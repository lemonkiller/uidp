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

const PROTOCOL_HEADER = `# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.0 - 界面几何数据格式
# ═══════════════════════════════════════════════════════════
#
# 本文件包含界面草图的几何数据，每行一个形状。
#
# 字段说明：
#   ID  - 唯一标识符
#   T   - 类型: rect=矩形 circle=圆形 line=线条 text=文本
#   R   - 矩形区域: x,y,width,height (像素值)
#   Z   - 层级: 数字越大越在上层
#   TXT - 文本内容 (仅 text 类型)
#
# AI 使用建议：
# - 根据形状位置和层级推断界面结构
# - 根据形状类型选择合适的组件实现
# - 根据相对位置推断布局关系
# ═══════════════════════════════════════════════════════════

`;

function convertToUIDP(elements: any[]): string {
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
      zIndex: el.index || 0,
    };

    if (type === "text" && "text" in el) {
      shape.text = el.text;
    }

    shapes.push(shape);
  }

  shapes.sort((a, b) => a.zIndex - b.zIndex);

  const lines = shapes.map((shape) => {
    let line = `ID:${shape.id} | T:${shape.type} | R:${shape.x},${shape.y},${shape.width},${shape.height} | Z:${shape.zIndex}`;
    if (shape.text) {
      line += ` | TXT:${shape.text}`;
    }
    return line;
  });

  return PROTOCOL_HEADER + lines.join("\n");
}

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string>("");

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

    const uidpContent = convertToUIDP(elements);

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
  }, [excalidrawAPI]);

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

    const uidpContent = convertToUIDP(elements);

    try {
      await writeText(uidpContent);
      setExportStatus("已复制到剪贴板");
    } catch (error) {
      setExportStatus(`复制失败: ${error}`);
    }
  }, [excalidrawAPI]);

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1 className="app-title">UIDP Editor</h1>
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
