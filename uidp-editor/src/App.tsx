import { useState, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { translations, type Language, type Translations } from "./i18n";
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

function App() {
  const [lang, setLang] = useState<Language>("zh-CN");
  const t = translations[lang];

  const DEVICE_PRESETS: DevicePreset[] = [
    { name: t.mobile, width: 375, height: 667, preset: "mobile" },
    { name: t.tablet, width: 768, height: 1024, preset: "tablet" },
    { name: t.desktopHD, width: 1280, height: 720, preset: "desktop-hd" },
    { name: t.desktopFHD, width: 1920, height: 1080, preset: "desktop-fhd" },
  ];

  const COMPONENT_TYPES: { value: UIDPComponentType | ""; label: string }[] = [
    { value: "", label: t.none },
    { value: "button", label: t.button },
    { value: "input", label: t.input },
    { value: "select", label: t.select },
    { value: "checkbox", label: t.checkbox },
    { value: "radio", label: t.radio },
    { value: "textarea", label: t.textarea },
    { value: "switch", label: t.switch },
    { value: "label", label: t.label },
    { value: "image", label: t.image },
    { value: "container", label: t.container },
  ];

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>(t.mobile);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // 组件属性面板状态
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<
    UIDPComponentType | ""
  >("")

  // 使用ref追踪上一次选中的元素ID，避免不必要的渲染
  const prevSelectedIdsRef = useRef<string>("");

  // 当语言变化时更新选中的预设名称
  useEffect(() => {
    if (!isCustom) {
      const currentPreset = DEVICE_PRESETS.find(p => p.preset === DEVICE_PRESETS.find(dp => dp.name === selectedPreset)?.preset);
      if (currentPreset) {
        setSelectedPreset(currentPreset.name);
      }
    }
  }, [lang]);

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
  }, [isCustom, selectedPreset, customWidth, customHeight, DEVICE_PRESETS]);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === t.custom) {
        setIsCustom(true);
        setSelectedPreset(t.custom);
      } else {
        setIsCustom(false);
        setSelectedPreset(value);
      }
    },
    [t.custom]
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
      setExportStatus(t.editorNotInitialized);
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      setExportStatus(t.noElementsToExport);
      return;
    }

    const baseDims = getBaseDimensions();
    const uidpContent = convertToUIDP(
      elements,
      baseDims.preset,
      baseDims.width,
      baseDims.height,
      t
    );

    try {
      const filePath = await save({
        filters: [
          {
            name: "UIDP",
            extensions: ["uidp"],
          },
        ],
        defaultPath: "sketch.uidp",
      });

      if (filePath) {
        await writeTextFile(filePath, uidpContent);
        setExportStatus(`${t.savedTo} ${filePath}`);
      }
    } catch (error) {
      setExportStatus(`${t.saveFailed} ${error}`);
    }
  }, [excalidrawAPI, getBaseDimensions, t]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!excalidrawAPI) {
      setExportStatus(t.editorNotInitialized);
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) {
      setExportStatus(t.noElementsToExport);
      return;
    }

    const baseDims = getBaseDimensions();
    const uidpContent = convertToUIDP(
      elements,
      baseDims.preset,
      baseDims.width,
      baseDims.height,
      t
    );

    try {
      await writeText(uidpContent);
      setExportStatus(t.copiedToClipboard);
    } catch (error) {
      setExportStatus(`${t.copyFailed} ${error}`);
    }
  }, [excalidrawAPI, getBaseDimensions, t]);

  // 获取选中元素的类型名称
  const getSelectedElementTypeName = useCallback((): string => {
    if (selectedElements.length === 0) return "";
    if (selectedElements.length > 1) return t.multipleElements;

    const el = selectedElements[0];
    switch (el.type) {
      case "rectangle":
        return t.rectangle;
      case "ellipse":
        return t.ellipse;
      case "line":
        return t.line;
      case "arrow":
        return t.arrow;
      case "text":
        return t.text;
      case "frame":
        return t.frame;
      default:
        return el.type || t.unknownType;
    }
  }, [selectedElements, t]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === "zh-CN" ? "en" : "zh-CN"));
  }, []);

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1 className="app-title">{t.appTitle}</h1>
        <div className="device-preset-section">
          <label className="preset-label">{t.baseResolution}</label>
          <select
            className="preset-select"
            value={isCustom ? t.custom : selectedPreset}
            onChange={handlePresetChange}
          >
            {DEVICE_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name} ({preset.width}x{preset.height})
              </option>
            ))}
            <option value={t.custom}>{t.custom}...</option>
          </select>
          {isCustom && (
            <div className="custom-dimensions">
              <input
                type="number"
                className="dimension-input"
                placeholder={t.width}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="1"
              />
              <span className="dimension-separator">x</span>
              <input
                type="number"
                className="dimension-input"
                placeholder={t.height}
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="1"
              />
            </div>
          )}
        </div>
        <div className="export-buttons">
          <button onClick={handleExportToFile} className="export-btn">
            {t.exportUidp}
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="export-btn secondary"
          >
            {t.copyToClipboard}
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="export-btn help"
          >
            {t.help}
          </button>
          <button
            onClick={toggleLanguage}
            className="export-btn language"
            title={t.language}
          >
            {lang === "zh-CN" ? "🌐 EN" : "🌐 中文"}
          </button>
        </div>
        {/* 组件属性 - 已移至顶部栏 */}
        <div className="toolbar-properties">
          {selectedElements.length === 0 ? (
            <span className="property-placeholder">{t.selectShape}</span>
          ) : (
            <div className="property-content">
              <span className="property-item">
                <span className="property-label">{t.selected}</span>
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
                        {t.componentType}
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
                          {t.clearMark}
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
                      {t.artboardAutoDetect}
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
            key={lang}
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
            langCode={lang}
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
        <HelpModal t={t} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

interface HelpModalProps {
  t: Translations;
  onClose: () => void;
}

function HelpModal({ t, onClose }: HelpModalProps) {
  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>{t.help}</h2>
          <button
            className="help-close-btn"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>
        <div className="help-content">
          <section className="help-section">
            <h3>{t.quickStart}</h3>
            <ol>
              <li><strong>{t.helpStep1}</strong></li>
              <li><strong>{t.helpStep2}</strong></li>
              <li><strong>{t.helpStep3}</strong></li>
              <li><strong>{t.helpStep4}</strong></li>
              <li><strong>{t.helpStep5}</strong></li>
            </ol>
          </section>

          <section className="help-section">
            <h3>{t.drawingTools}</h3>
            <ul>
              <li><kbd>R</kbd> - {t.toolRect}</li>
              <li><kbd>O</kbd> - {t.toolEllipse}</li>
              <li><kbd>L</kbd> - {t.toolLine}</li>
              <li><kbd>T</kbd> - {t.toolText}</li>
              <li><kbd>F</kbd> - {t.toolFrame}</li>
              <li><kbd>V</kbd> - {t.toolSelect}</li>
              <li><kbd>1-9</kbd> - {t.toolQuickSwitch}</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>{t.componentSemanticMark}</h3>
            <p>{t.selectComponentTypeHint}</p>
            <div className="help-component-grid">
              <div className="help-component-item">
                <code>button</code>
                <span>{t.button}</span>
              </div>
              <div className="help-component-item">
                <code>input</code>
                <span>{t.input}</span>
              </div>
              <div className="help-component-item">
                <code>select</code>
                <span>{t.select}</span>
              </div>
              <div className="help-component-item">
                <code>checkbox</code>
                <span>{t.checkbox}</span>
              </div>
              <div className="help-component-item">
                <code>radio</code>
                <span>{t.radio}</span>
              </div>
              <div className="help-component-item">
                <code>textarea</code>
                <span>{t.textarea}</span>
              </div>
              <div className="help-component-item">
                <code>switch</code>
                <span>{t.switch}</span>
              </div>
              <div className="help-component-item">
                <code>label</code>
                <span>{t.label}</span>
              </div>
              <div className="help-component-item">
                <code>image</code>
                <span>{t.image}</span>
              </div>
              <div className="help-component-item">
                <code>container</code>
                <span>{t.container}</span>
              </div>
            </div>
            <p className="help-tip">{t.componentTip}</p>
          </section>

          <section className="help-section">
            <h3>{t.artboardDescription}</h3>
            <ul>
              <li>{t.artboardDesc1}</li>
              <li>{t.artboardDesc2}</li>
              <li>{t.artboardDesc3}</li>
              <li>{t.artboardDesc4}</li>
              <li>{t.artboardDesc5}</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>{t.exportFormat}</h3>
            <p>{t.exportDesc1}</p>
            <ul>
              <li><code>META</code> - {t.exportDesc1}</li>
              <li><code>#0</code> - {t.exportDesc2}</li>
              <li><code>#N</code> - {t.exportDesc3}</li>
            </ul>
            <p className="help-tip">{t.exportTip}</p>
          </section>

          <section className="help-section">
            <h3>{t.shortcuts}</h3>
            <div className="help-shortcut-grid">
              <div><kbd>Ctrl</kbd> + <kbd>Z</kbd></div>
              <span>{t.shortcutUndo}</span>
              <div><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></div>
              <span>{t.shortcutRedo}</span>
              <div><kbd>Ctrl</kbd> + <kbd>C</kbd></div>
              <span>{t.shortcutCopy}</span>
              <div><kbd>Ctrl</kbd> + <kbd>V</kbd></div>
              <span>{t.shortcutPaste}</span>
              <div><kbd>Delete</kbd></div>
              <span>{t.shortcutDelete}</span>
              <div><kbd>Space</kbd> + {t.shortcutPan}</div>
              <span>{t.shortcutPan}</span>
              <div><kbd>Ctrl</kbd> + <kbd>+/-</kbd></div>
              <span>{t.shortcutZoom}</span>
            </div>
          </section>

          <section className="help-section">
            <h3>{t.bestPractices}</h3>
            <ul>
              <li>{t.practice1}</li>
              <li>{t.practice2}</li>
              <li>{t.practice3}</li>
              <li>{t.practice4}</li>
              <li>{t.practice5}</li>
              <li>{t.practice6}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function convertToUIDP(
  elements: any[],
  presetName: string,
  presetWidth: number,
  presetHeight: number,
  t: Translations
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

  return getProtocolHeader(t) + metaLine + "\n\n" + lines.join("\n");
}

function getProtocolHeader(t: Translations): string {
  return `# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.3 - ${t.language === 'Language' ? 'Interface Geometry Data Format' : '界面几何数据格式'}
# ═══════════════════════════════════════════════════════════
#
# ${t.language === 'Language' ? '[Important Notes]' : '【重要说明】'}
# - ${t.artboardDesc1}
# - ${t.artboardDesc3}
# - ${t.language === 'Language' ? 'Artboard size represents the original resolution of the design draft' : '画板尺寸表示设计稿的原始分辨率，元素坐标在此坐标系内定义'}
# - ${t.language === 'Language' ? 'Elements need to be scaled proportionally to actual window size when rendering' : '渲染时需要将画板内的元素按比例缩放到实际窗口大小'}
#
# ${t.language === 'Language' ? '[Coordinate System]' : '【坐标系统】'}
# - ${t.language === 'Language' ? 'All coordinates use top-left origin (0,0)' : '所有坐标都是左上角原点 (0,0)'}
# - X${t.language === 'Language' ? ' axis increases to the right, Y axis increases downward' : '轴向右递增，Y轴向下递增'}
# - ${t.artboardDesc3}
# - ${t.language === 'Language' ? 'Element coordinates = offset within artboard (automatically calculated as relative coordinates)' : '元素坐标 = 元素在画板内的偏移量（已自动计算为相对坐标）'}
#
# META ${t.language === 'Language' ? 'Field Description' : '字段说明'}：
#   canvas     - ${t.language === 'Language' ? 'Actual canvas size (auto-calculated from element boundaries)' : '实际画布尺寸 (从元素边界自动计算)'}
#   unit       - ${t.language === 'Language' ? 'Unit type (px=pixel)' : '单位类型 (px=像素)'}
#   preset     - ${t.language === 'Language' ? 'Device preset type: mobile/tablet/desktop-hd/desktop-fhd/custom' : '设备预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom'}
#   presetSize - ${t.language === 'Language' ? 'Preset reference size (used to calculate scale ratio)' : '预设参考尺寸 (用于计算缩放比例)'}
#
# ${t.artboardDescription.replace('📐 ', '')}${t.language === 'Language' ? ' Field Description' : '字段说明'}：
#   #0       - ${t.language === 'Language' ? 'Artboard index fixed at 0' : '画板序号固定为 0'}
#   T        - ${t.language === 'Language' ? 'Type: artboard=artboard' : '类型: artboard=画板'}
#   R        - ${t.language === 'Language' ? 'Rect area: x,y,width,height (pixel values, x,y fixed at 0,0)' : '矩形区域: x,y,width,height (像素值，x,y固定为0,0)'}
#   Z        - ${t.artboardDesc4}
#   PRESET   - ${t.language === 'Language' ? 'Preset type: mobile/tablet/desktop-hd/desktop-fhd/custom' : '预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom'}
#
# ${t.language === 'Language' ? 'Shape Field Description' : '形状字段说明'}：
#   #N  - ${t.language === 'Language' ? 'Index identifier (N=1,2,3...)' : '序号标识符 (N=1,2,3...)'}
#   T   - ${t.language === 'Language' ? 'Type: rect=rectangle circle=circle line=line text=text' : '类型: rect=矩形 circle=圆形 line=线条 text=文本'}
#   R   - ${t.language === 'Language' ? 'Rect area: x,y,width,height (pixel values, relative to artboard top-left)' : '矩形区域: x,y,width,height (像素值，相对于画板左上角)'}
#   Z   - ${t.language === 'Language' ? 'Layer: must be pure numbers (1,2,3...), larger numbers are on top' : '层级: 必须为纯数字（1,2,3...），数字越大越在上层'}
#   TXT - ${t.language === 'Language' ? 'Text content (text type only)' : '文本内容 (仅 text 类型)'}
#   C   - ${t.language === 'Language' ? 'Component semantics (optional): button/input/select/checkbox/radio/textarea/switch/label/image/container' : '组件语义 (可选): button/input/select/checkbox/radio/textarea/switch/label/image/container'}
#
# ${t.language === 'Language' ? '[Rendering Formula - Proportional Scaling]' : '【渲染公式 - 等比缩放】'}
#   ${t.language === 'Language' ? '[Required] Must use proportional scaling to maintain original aspect ratio' : '【强制】必须使用等比缩放，保持元素原始宽高比'}
#   scale = min(${t.language === 'Language' ? 'actual window width' : '实际窗口宽度'} / ${t.language === 'Language' ? 'artboard width' : '画板宽度'}, ${t.language === 'Language' ? 'actual window height' : '实际窗口高度'} / ${t.language === 'Language' ? 'artboard height' : '画板高度'})
#   ${t.language === 'Language' ? 'Actual X' : '实际X'} = ${t.language === 'Language' ? 'element relative X' : '元素相对X'} * scale
#   ${t.language === 'Language' ? 'Actual Y' : '实际Y'} = ${t.language === 'Language' ? 'element relative Y' : '元素相对Y'} * scale
#   ${t.language === 'Language' ? 'Actual Width' : '实际宽度'} = ${t.language === 'Language' ? 'element width' : '元素宽度'} * scale
#   ${t.language === 'Language' ? 'Actual Height' : '实际高度'} = ${t.language === 'Language' ? 'element height' : '元素高度'} * scale
#
# AI ${t.language === 'Language' ? 'Usage Suggestions' : '使用建议'}：
# - ${t.language === 'Language' ? 'Determine target device type based on artboard PRESET' : '根据画板 PRESET 确定目标设备类型'}
# - ${t.language === 'Language' ? '[Required] Initial screen window size must use the base resolution specified by presetSize' : '【强制】初始屏幕窗口大小必须使用 presetSize 指定的基准分辨率'}
# - ${t.language === 'Language' ? 'Use the above rendering formula to convert relative coordinates to actual pixel positions' : '使用上述渲染公式将相对坐标转换为实际像素位置'}
# - ${t.language === 'Language' ? 'Choose appropriate component implementation based on shape type' : '根据形状类型选择合适的组件实现'}
# - ${t.language === 'Language' ? 'Determine component semantics based on C field (if present)' : '根据 C 字段（如有）确定组件语义'}
# ═══════════════════════════════════════════════════════════

`;
}

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

export default App;
