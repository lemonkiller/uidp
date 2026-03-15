import { useState, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import "./App.css";

type UIDPComponentType =
  | "button"
  | "input"
  | "select"
  | "checkbox"
  | "radio"
  | "textarea"
  | "switch"
  | "label"
  | "image"
  | "container";

interface UIDPShape {
  id: string;
  type: "rect" | "circle" | "line" | "text" | "artboard";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text?: string;
  component?: UIDPComponentType;
  preset?: string;
}

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  preset: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: "移动端", width: 375, height: 667, preset: "mobile" },
  { name: "平板", width: 768, height: 1024, preset: "tablet" },
  { name: "桌面 HD", width: 1280, height: 720, preset: "desktop-hd" },
  { name: "桌面 FHD", width: 1920, height: 1080, preset: "desktop-fhd" },
];

const COMPONENT_TYPES: { value: UIDPComponentType | ""; label: string }[] = [
  { value: "", label: "无" },
  { value: "button", label: "button (按钮)" },
  { value: "input", label: "input (输入框)" },
  { value: "select", label: "select (下拉选择)" },
  { value: "checkbox", label: "checkbox (复选框)" },
  { value: "radio", label: "radio (单选框)" },
  { value: "textarea", label: "textarea (多行文本)" },
  { value: "switch", label: "switch (开关)" },
  { value: "label", label: "label (标签)" },
  { value: "image", label: "image (图片)" },
  { value: "container", label: "container (容器)" },
];

const PROTOCOL_HEADER = `# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.3 - 界面几何数据格式
# ═══════════════════════════════════════════════════════════
#
# 【重要说明】
# - 画板(artboard)仅作为屏幕大小的基准参考，不应被实际绘制
# - 所有形状的坐标都是相对于画板左上角的偏移量（相对坐标）
# - 画板尺寸表示设计稿的原始分辨率，元素坐标在此坐标系内定义
# - 渲染时需要将画板内的元素按比例缩放到实际窗口大小
#
# 【坐标系统】
# - 所有坐标都是左上角原点 (0,0)
# - X轴向右递增，Y轴向下递增
# - 画板位置固定为 R:0,0,width,height（相对坐标系原点）
# - 元素坐标 = 元素在画板内的偏移量（已自动计算为相对坐标）
#
# META 字段说明：
#   canvas     - 实际画布尺寸 (从元素边界自动计算)
#   unit       - 单位类型 (px=像素)
#   preset     - 设备预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom
#   presetSize - 预设参考尺寸 (用于计算缩放比例)
#
# 画板字段说明：
#   #0       - 画板序号固定为 0
#   T        - 类型: artboard=画板
#   R        - 矩形区域: x,y,width,height (像素值，x,y固定为0,0)
#   Z        - 层级: 固定为 0，画板始终在最底层
#   PRESET   - 预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom
#
# 形状字段说明：
#   #N  - 序号标识符 (N=1,2,3...)
#   T   - 类型: rect=矩形 circle=圆形 line=线条 text=文本
#   R   - 矩形区域: x,y,width,height (像素值，相对于画板左上角)
#   Z   - 层级: 必须为纯数字（1,2,3...），数字越大越在上层
#   TXT - 文本内容 (仅 text 类型)
#   C   - 组件语义 (可选): button/input/select/checkbox/radio/textarea/switch/label/image/container
#
# 【渲染公式 - 等比缩放】
#   【强制】必须使用等比缩放，保持元素原始宽高比
#   scale = min(实际窗口宽度 / 画板宽度, 实际窗口高度 / 画板高度)
#   实际X = 元素相对X * scale
#   实际Y = 元素相对Y * scale
#   实际宽度 = 元素宽度 * scale
#   实际高度 = 元素高度 * scale
#
# AI 使用建议：
# - 根据画板 PRESET 确定目标设备类型
# - 【强制】初始屏幕窗口大小必须使用 presetSize 指定的基准分辨率
# - 使用上述渲染公式将相对坐标转换为实际像素位置
# - 根据形状类型选择合适的组件实现
# - 根据 C 字段（如有）确定组件语义
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

function convertToUIDP(
  elements: any[],
  presetName: string,
  presetWidth: number,
  presetHeight: number
): string {
  const shapes: UIDPShape[] = [];
  let artboard: UIDPShape | null = null;

  // 第一遍：查找画板（Frame类型元素，最大的那个作为画板）
  const frames: any[] = [];
  for (const el of elements) {
    if (el.isDeleted) continue;

    // 将所有 Frame 视为候选画板
    if (el.type === "frame") {
      frames.push(el);
    }
  }

  // 选择面积最大的 Frame 作为画板
  if (frames.length > 0) {
    frames.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const selectedArtboard = frames[0];
    artboard = {
      id: selectedArtboard.id,
      type: "artboard",
      x: Math.round(selectedArtboard.x),
      y: Math.round(selectedArtboard.y),
      width: Math.round(selectedArtboard.width),
      height: Math.round(selectedArtboard.height),
      zIndex: 0,
      preset: selectedArtboard.customData?.preset || presetName,
    };
  }

  // 如果没有找到画板，使用预设创建一个
  if (!artboard) {
    artboard = {
      id: "artboard-0",
      type: "artboard",
      x: 0,
      y: 0,
      width: presetWidth,
      height: presetHeight,
      zIndex: 0,
      preset: presetName,
    };
  }

  // 第二遍：处理其他形状，坐标相对于画板
  // 使用数组索引作为层级（Excalidraw中元素顺序就是层级顺序）
  let zIndexCounter = 1;
  for (const el of elements) {
    if (el.isDeleted) continue;

    // 跳过画板本身（与上面找到的是同一个Frame）
    if (el.type === "frame" && el.id === artboard?.id) {
      continue;
    }

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

    // 获取元素的左上角坐标（处理不同元素类型的坐标系统）
    let elX = el.x;
    let elY = el.y;
    
    // Excalidraw中椭圆和菱形的x,y是中心点，需要转换为左上角
    if (el.type === "ellipse" || el.type === "diamond") {
      elX = el.x - el.width / 2;
      elY = el.y - el.height / 2;
    }
    
    // 坐标相对于画板
    const relativeX = Math.round(elX - artboard.x);
    const relativeY = Math.round(elY - artboard.y);

    const shape: UIDPShape = {
      id: el.id,
      type,
      x: relativeX,
      y: relativeY,
      width: Math.round(el.width),
      height: Math.round(el.height),
      zIndex: zIndexCounter++, // 使用递增的层级值
    };

    if (type === "text" && "text" in el) {
      shape.text = el.text;
    }

    // 读取组件语义标记
    if (el.customData?.uidpComponent) {
      shape.component = el.customData.uidpComponent;
    }

    shapes.push(shape);
  }

  shapes.sort((a, b) => a.zIndex - b.zIndex);

  const canvasSize = calculateCanvasSize(elements);

  const metaLine = `META:canvas=${canvasSize.width}x${canvasSize.height} | unit=px | preset=${artboard.preset} | presetSize=${presetWidth}x${presetHeight}`;

  const lines: string[] = [];

  // 画板始终是第一行
  lines.push(
    `#0 | T:artboard | R:0,0,${artboard.width},${artboard.height} | Z:0 | PRESET:${artboard.preset}`
  );

  // 其他形状（坐标已相对于画板）
  shapes.forEach((shape, index) => {
    let line = `#${index + 1} | T:${shape.type} | R:${shape.x},${shape.y},${shape.width},${shape.height} | Z:${shape.zIndex}`;
    if (shape.text) {
      line += ` | TXT:${shape.text}`;
    }
    if (shape.component) {
      line += ` | C:${shape.component}`;
    }
    lines.push(line);
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
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // 组件属性面板状态
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<
    UIDPComponentType | ""
  >("");

  // 使用ref追踪上一次选中的元素ID，避免不必要的渲染
  const prevSelectedIdsRef = useRef<string>("");

  const getBaseDimensions = useCallback((): {
    width: number;
    height: number;
    preset: string;
  } => {
    if (isCustom) {
      const width = parseInt(customWidth, 10) || 375;
      const height = parseInt(customHeight, 10) || 667;
      return { width, height, preset: "custom" };
    }
    const preset = DEVICE_PRESETS.find((p) => p.name === selectedPreset);
    return preset || { width: 375, height: 667, preset: "mobile" };
  }, [isCustom, selectedPreset, customWidth, customHeight]);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "自定义") {
        setIsCustom(true);
        setSelectedPreset("自定义");
      } else {
        setIsCustom(false);
        setSelectedPreset(value);
      }
    },
    []
  );

  // 监听选中元素变化
  const handleSelectionChange = useCallback((elements: any[]) => {
    const newElements = elements || [];
    
    // 比较元素ID数组，避免不必要的更新
    const newIds = newElements.map(el => el.id).sort().join(',');
    
    if (prevSelectedIdsRef.current !== newIds) {
      prevSelectedIdsRef.current = newIds;
      setSelectedElements(newElements);
      if (newElements.length === 1) {
        const el = newElements[0];
        const componentType = el.customData?.uidpComponent || "";
        setSelectedComponentType(componentType);
      } else {
        setSelectedComponentType("");
      }
    }
  }, []);

  // 更新选中元素的组件类型
  const handleComponentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as UIDPComponentType | "";
      setSelectedComponentType(value);

      if (selectedElements.length === 1 && excalidrawAPI) {
        const el = selectedElements[0];
        const updatedElement = {
          ...el,
          customData: {
            ...el.customData,
            uidpComponent: value || undefined,
          },
        };

        excalidrawAPI.updateScene({
          elements: excalidrawAPI
            .getSceneElements()
            .map((sceneEl: any) =>
              sceneEl.id === el.id ? updatedElement : sceneEl
            ),
        });
      }
    },
    [selectedElements, excalidrawAPI]
  );

  // 清除组件标记
  const handleClearComponent = useCallback(() => {
    setSelectedComponentType("");

    if (selectedElements.length === 1 && excalidrawAPI) {
      const el = selectedElements[0];
      const updatedElement = {
        ...el,
        customData: {
          ...el.customData,
          uidpComponent: undefined,
        },
      };

      excalidrawAPI.updateScene({
        elements: excalidrawAPI
          .getSceneElements()
          .map((sceneEl: any) =>
            sceneEl.id === el.id ? updatedElement : sceneEl
          ),
      });
    }
  }, [selectedElements, excalidrawAPI]);

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
    const uidpContent = convertToUIDP(
      elements,
      baseDims.preset,
      baseDims.width,
      baseDims.height
    );

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
    const uidpContent = convertToUIDP(
      elements,
      baseDims.preset,
      baseDims.width,
      baseDims.height
    );

    try {
      await writeText(uidpContent);
      setExportStatus("已复制到剪贴板");
    } catch (error) {
      setExportStatus(`复制失败: ${error}`);
    }
  }, [excalidrawAPI, getBaseDimensions]);

  // 获取选中元素的类型名称
  const getSelectedElementTypeName = useCallback((): string => {
    if (selectedElements.length === 0) return "";
    if (selectedElements.length > 1) return "多个元素";

    const el = selectedElements[0];
    switch (el.type) {
      case "rectangle":
        return "矩形";
      case "ellipse":
        return "圆形/椭圆";
      case "line":
        return "线条";
      case "arrow":
        return "箭头";
      case "text":
        return "文本";
      case "frame":
        return "画板 (Frame)";
      default:
        return el.type || "未知类型";
    }
  }, [selectedElements]);

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
          <button
            onClick={handleCopyToClipboard}
            className="export-btn secondary"
          >
            复制到剪贴板
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="export-btn help"
          >
            使用帮助
          </button>
        </div>
        {/* 组件属性 - 已移至顶部栏 */}
        <div className="toolbar-properties">
          {selectedElements.length === 0 ? (
            <span className="property-placeholder">请选择一个形状</span>
          ) : (
            <div className="property-content">
              <span className="property-item">
                <span className="property-label">选中:</span>
                <span className="property-value">
                  {getSelectedElementTypeName()}
                </span>
              </span>
              {selectedElements.length === 1 &&
                selectedElements[0].type !== "frame" && (
                  <>
                    <span className="property-separator">|</span>
                    <span className="property-item">
                      <label className="property-label" htmlFor="component-type">
                        组件类型:
                      </label>
                      <select
                        id="component-type"
                        className="property-select"
                        value={selectedComponentType}
                        onChange={handleComponentTypeChange}
                      >
                        {COMPONENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </span>
                    {selectedComponentType && (
                      <>
                        <span className="property-separator">|</span>
                        <button
                          className="property-clear-btn"
                          onClick={handleClearComponent}
                        >
                          清除标记
                        </button>
                      </>
                    )}
                  </>
                )}
              {selectedElements.length === 1 &&
                selectedElements[0].type === "frame" && (
                  <>
                    <span className="property-separator">|</span>
                    <span className="property-hint">
                      画板自动识别
                    </span>
                  </>
                )}
            </div>
          )}
        </div>

        {exportStatus && (
          <span className="status-message">{exportStatus}</span>
        )}
      </div>
      <div className="main-content">
        <div className="excalidraw-wrapper">
          <Excalidraw
            excalidrawAPI={(api: any) => {
              setExcalidrawAPI(api);
              // 监听选中变化 - 使用 ref 存储上一次状态避免重复渲染
              const prevSelectedIdsState = { current: "" };
              
              const checkSelection = () => {
                if (!api.getAppState) return;
                const appState = api.getAppState();
                if (appState.selectedElementIds) {
                  const selectedIds = Object.keys(appState.selectedElementIds).sort().join(',');
                  // 只有当选择真正改变时才更新
                  if (prevSelectedIdsState.current !== selectedIds) {
                    prevSelectedIdsState.current = selectedIds;
                    const elements = api.getSceneElements();
                    const selected = elements.filter((el: any) =>
                      Object.keys(appState.selectedElementIds).includes(el.id)
                    );
                    handleSelectionChange(selected);
                  }
                }
              };
              // 使用定时器检查选中状态变化
              const interval = setInterval(checkSelection, 100);
              // 清理函数
              window.addEventListener('beforeunload', () => {
                clearInterval(interval);
              });
            }}
            theme="light"
            zenModeEnabled={false}
            viewModeEnabled={false}
            UIOptions={{
              canvasActions: {
                toggleTheme: false,
                saveToActiveFile: false,
              },
            }}
          />
        </div>
      </div>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>UIDP Editor 使用帮助</h2>
              <button
                className="help-close-btn"
                onClick={() => setShowHelp(false)}
              >
                ×
              </button>
            </div>
            <div className="help-content">
              <section className="help-section">
                <h3>📋 快速开始</h3>
                <ol>
                  <li>
                    <strong>选择设备预设</strong>：在顶部工具栏选择目标设备（移动端/平板/桌面）
                  </li>
                  <li>
                    <strong>创建画板</strong>：按 <kbd>F</kbd> 键或选择 Frame
                    工具创建画板
                  </li>
                  <li>
                    <strong>绘制界面</strong>：在画板内绘制矩形、圆形、文本等元素
                  </li>
                  <li>
                    <strong>标记组件</strong>：选中形状后在顶部工具栏选择组件类型
                  </li>
                  <li>
                    <strong>导出数据</strong>：点击「导出.uidp文件」或「复制到剪贴板」
                  </li>
                </ol>
              </section>

              <section className="help-section">
                <h3>🎨 绘制工具</h3>
                <ul>
                  <li>
                    <kbd>R</kbd> - 矩形工具（用于按钮、输入框、卡片等）
                  </li>
                  <li>
                    <kbd>O</kbd> - 圆形/椭圆工具（用于头像、图标等）
                  </li>
                  <li>
                    <kbd>L</kbd> - 线条工具（用于分割线、装饰线等）
                  </li>
                  <li>
                    <kbd>T</kbd> - 文本工具（用于标签、标题等）
                  </li>
                  <li>
                    <kbd>F</kbd> - Frame工具（<strong>画板</strong>，用于定义屏幕边界）
                  </li>
                  <li>
                    <kbd>V</kbd> - 选择工具
                  </li>
                  <li>
                    <kbd>1-9</kbd> - 快速切换工具
                  </li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🏷️ 组件语义标记</h3>
                <p>选中形状后，在顶部工具栏的「组件类型」下拉框选择类型：</p>
                <div className="help-component-grid">
                  <div className="help-component-item">
                    <code>button</code>
                    <span>按钮</span>
                  </div>
                  <div className="help-component-item">
                    <code>input</code>
                    <span>输入框</span>
                  </div>
                  <div className="help-component-item">
                    <code>select</code>
                    <span>下拉选择</span>
                  </div>
                  <div className="help-component-item">
                    <code>checkbox</code>
                    <span>复选框</span>
                  </div>
                  <div className="help-component-item">
                    <code>radio</code>
                    <span>单选框</span>
                  </div>
                  <div className="help-component-item">
                    <code>textarea</code>
                    <span>多行文本</span>
                  </div>
                  <div className="help-component-item">
                    <code>switch</code>
                    <span>开关</span>
                  </div>
                  <div className="help-component-item">
                    <code>label</code>
                    <span>标签/说明</span>
                  </div>
                  <div className="help-component-item">
                    <code>image</code>
                    <span>图片</span>
                  </div>
                  <div className="help-component-item">
                    <code>container</code>
                    <span>容器/卡片</span>
                  </div>
                </div>
                <p className="help-tip">
                  💡 提示：标记组件语义可以帮助 AI 更准确地理解界面意图
                </p>
              </section>

              <section className="help-section">
                <h3>📐 画板（Frame）说明</h3>
                <ul>
                  <li>
                    画板用于定义屏幕边界，导出时会作为 <code>#0</code>{" "}
                    行输出
                  </li>
                  <li>
                    面积最大的 Frame 会被自动识别为画板
                  </li>
                  <li>
                    所有形状的坐标都是相对于画板左上角的偏移量（相对坐标）
                  </li>
                  <li>画板层级固定为 Z:0，始终在最底层</li>
                  <li>画板会自动识别，无需标记组件类型</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>📤 导出格式</h3>
                <p>导出的 .uidp 文件包含以下信息：</p>
                <ul>
                  <li>
                    <code>META</code> - 画布尺寸、设备预设和参考尺寸
                  </li>
                  <li>
                    <code>#0</code> - 画板信息（尺寸、预设类型）
                  </li>
                  <li>
                    <code>#N</code> - 形状信息（类型、相对坐标、层级、文本、组件语义）
                  </li>
                </ul>
                <p className="help-tip">
                  💡 提示：AI 会使用等比缩放公式将相对坐标转换为实际像素位置
                </p>
              </section>

              <section className="help-section">
                <h3>⌨️ 常用快捷键</h3>
                <div className="help-shortcut-grid">
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  </div>
                  <span>撤销</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
                  </div>
                  <span>重做</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>C</kbd>
                  </div>
                  <span>复制</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>V</kbd>
                  </div>
                  <span>粘贴</span>
                  <div>
                    <kbd>Delete</kbd>
                  </div>
                  <span>删除选中元素</span>
                  <div>
                    <kbd>Space</kbd> + 拖拽
                  </div>
                  <span>平移画布</span>
                  <div>
                    <kbd>Ctrl</kbd> + <kbd>+/-</kbd>
                  </div>
                  <span>缩放画布</span>
                </div>
              </section>

              <section className="help-section">
                <h3>💡 最佳实践</h3>
                <ul>
                  <li>先创建画板，再在画板内绘制元素</li>
                  <li>使用矩形表示按钮、输入框等交互组件</li>
                  <li>使用文本工具添加标签和说明</li>
                  <li>为关键组件添加语义标记，提高 AI 理解准确度</li>
                  <li>合理设置层级（Z值），确保元素遮挡关系正确</li>
                  <li>导出前检查设备预设是否匹配目标平台</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
