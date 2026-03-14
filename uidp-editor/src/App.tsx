import { useState, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import "./App.css";

interface UIDPShape {
  id: string;
  type: "rect" | "circle" | "line" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text?: string;
}

interface DevicePreset {
  name: string;
  width: number;
  height: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: "移动端", width: 375, height: 667 },
  { name: "平板", width: 768, height: 1024 },
  { name: "桌面", width: 1440, height: 900 },
];

const PROTOCOL_HEADER = `# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.1 - 界面几何数据格式
# ═══════════════════════════════════════════════════════════
#
# META 字段说明：
#   canvas - 实际画布尺寸 (从元素边界自动计算)
#   base   - 基准分辨率 (用户通过UI预设，用于响应式换算)
#   unit   - 单位类型 (px=像素)
#
# 形状字段说明：
#   #N  - 序号标识符 (N=1,2,3...)
#   T   - 类型: rect=矩形 circle=圆形 line=线条 text=文本
#   R   - 矩形区域: x,y,width,height (像素值)
#   Z   - 层级: 必须为纯数字（0,1,2...），禁止包含字母，数字越大越在上层
#   TXT - 文本内容 (仅 text 类型)
#
# AI 使用建议：
# - 根据 base 字段进行响应式换算
# - 根据形状位置和层级推断界面结构
# - 根据形状类型选择合适的组件实现
# - 根据相对位置推断布局关系
# ═══════════════════════════════════════════════════════════

`;

function calculateCanvasSize(elements: any[]): { width: number; height: number } {
  if (elements.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.isDeleted) continue;

    const x = el.x;
    const y = el.y;
    const width = el.width || 0;
    const height = el.height || 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  if (minX === Infinity) {
    return { width: 0, height: 0 };
  }

  return {
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

function convertToUIDP(elements: any[], baseWidth: number, baseHeight: number): string {
  const shapes: UIDPShape[] = [];

  for (const el of elements) {
    if (el.isDeleted) continue;

    let type: UIDPShape["type"];
    switch (el.type) {
      case "rectangle":
      case "diamond":
        type = "rect";
        break;
      case "ellipse":
        type = "circle";
        break;
      case "line":
      case "arrow":
        type = "line";
        break;
      case "text":
        type = "text";
        break;
      default:
        continue;
    }

    const shape: UIDPShape = {
      id: el.id,
      type,
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      zIndex: parseInt(String(el.index || 0).replace(/[^0-9]/g, ''), 10) || 0,
    };

    if (type === "text" && "text" in el) {
      shape.text = el.text;
    }

    shapes.push(shape);
  }

  shapes.sort((a, b) => a.zIndex - b.zIndex);

  const canvasSize = calculateCanvasSize(elements);

  const metaLine = `META:canvas=${canvasSize.width}x${canvasSize.height} | base=${baseWidth}x${baseHeight} | unit=px`;

  const lines = shapes.map((shape, index) => {
    let line = `#${index + 1} | T:${shape.type} | R:${shape.x},${shape.y},${shape.width},${shape.height} | Z:${shape.zIndex}`;
    if (shape.text) {
      line += ` | TXT:${shape.text}`;
    }
    return line;
  });

  return PROTOCOL_HEADER + metaLine + "\n\n" + lines.join("\n");
}

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("移动端");
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const getBaseDimensions = useCallback((): { width: number; height: number } => {
    if (isCustom) {
      const width = parseInt(customWidth, 10) || 375;
      const height = parseInt(customHeight, 10) || 667;
      return { width, height };
    }
    const preset = DEVICE_PRESETS.find((p) => p.name === selectedPreset);
    return preset || { width: 375, height: 667 };
  }, [isCustom, selectedPreset, customWidth, customHeight]);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "自定义") {
      setIsCustom(true);
      setSelectedPreset("自定义");
    } else {
      setIsCustom(false);
      setSelectedPreset(value);
    }
  }, []);

  const handleExportToFile = useCallback(async () => {
    if (!excalidrawAPI) {
      setExportStatus("编辑器未初始化");
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      setExportStatus("没有可导出的元素");
      return;
    }

    const baseDims = getBaseDimensions();
    const uidpContent = convertToUIDP(elements, baseDims.width, baseDims.height);

    try {
      const filePath = await save({
        filters: [
          {
            name: "UIDP 文件",
            extensions: ["uidp"],
          },
        ],
        defaultPath: "sketch.uidp",
      });

      if (filePath) {
        await writeTextFile(filePath, uidpContent);
        setExportStatus(`已保存到: ${filePath}`);
      }
    } catch (error) {
      setExportStatus(`保存失败: ${error}`);
    }
  }, [excalidrawAPI, getBaseDimensions]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!excalidrawAPI) {
      setExportStatus("编辑器未初始化");
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      setExportStatus("没有可导出的元素");
      return;
    }

    const baseDims = getBaseDimensions();
    const uidpContent = convertToUIDP(elements, baseDims.width, baseDims.height);

    try {
      await writeText(uidpContent);
      setExportStatus("已复制到剪贴板");
    } catch (error) {
      setExportStatus(`复制失败: ${error}`);
    }
  }, [excalidrawAPI, getBaseDimensions]);

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1 className="app-title">UIDP Editor</h1>
        <div className="device-preset-section">
          <label className="preset-label">基准分辨率:</label>
          <select
            className="preset-select"
            value={isCustom ? "自定义" : selectedPreset}
            onChange={handlePresetChange}
          >
            {DEVICE_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name} ({preset.width}x{preset.height})
              </option>
            ))}
            <option value="自定义">自定义...</option>
          </select>
          {isCustom && (
            <div className="custom-dimensions">
              <input
                type="number"
                className="dimension-input"
                placeholder="宽"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="1"
              />
              <span className="dimension-separator">x</span>
              <input
                type="number"
                className="dimension-input"
                placeholder="高"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="1"
              />
            </div>
          )}
        </div>
        <div className="export-buttons">
          <button onClick={handleExportToFile} className="export-btn">
            导出 .uidp 文件
          </button>
          <button onClick={handleCopyToClipboard} className="export-btn secondary">
            复制到剪贴板
          </button>
        </div>
        {exportStatus && <span className="status-message">{exportStatus}</span>}
      </div>
      <div className="excalidraw-wrapper">
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          theme="light"
          zenModeEnabled={false}
          viewModeEnabled={false}
        />
      </div>
    </div>
  );
}

export default App;
