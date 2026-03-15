import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw, CaptureUpdateAction } from "@excalidraw/excalidraw";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { translations, type Language, type Translations } from "./i18n";
import {
  convertToUIDP,
  parseUIDP,
  convertFromUIDP,
  type UIDPComponentType,
} from "./utils/uidp";
import type { ExcalidrawAnyElement } from "./types/excalidraw";
import "./App.css";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>(t.mobile);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // 组件属性面板状态
  const [selectedElements, setSelectedElements] = useState<ExcalidrawAnyElement[]>([]);
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
  const handleSelectionChange = useCallback((elements: ExcalidrawAnyElement[]) => {
    const newElements = elements || [];

    // 比较元素ID数组，避免不必要的更新
    const newIds = newElements.map(el => el.id).sort().join(',');

    if (prevSelectedIdsRef.current !== newIds) {
      prevSelectedIdsRef.current = newIds;
      setSelectedElements(newElements);
      if (newElements.length === 1) {
        const el = newElements[0];
        const componentType = (el.customData?.uidpComponent as UIDPComponentType | undefined) || "";
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
            .map((sceneEl: ExcalidrawAnyElement) =>
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
          .map((sceneEl: ExcalidrawAnyElement) =>
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

  const handleImportFromFile = useCallback(async () => {
    if (!excalidrawAPI) {
      setExportStatus(t.editorNotInitialized);
      return;
    }

    try {
      const filePath = await open({
        filters: [
          {
            name: "UIDP",
            extensions: ["uidp"],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const content = await readTextFile(filePath);
      const result = parseUIDP(content);

      if (!result) {
        setExportStatus(t.invalidFileFormat);
        return;
      }

      const elements = convertFromUIDP(result.shapes, result.meta);

      // 计算元素边界框，用于后续居中显示
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of elements) {
        const elX = el.x as number | undefined;
        const elY = el.y as number | undefined;
        const elWidth = (el.width as number | undefined) || 0;
        const elHeight = (el.height as number | undefined) || 0;
        if (typeof elX === 'number' && typeof elY === 'number') {
          minX = Math.min(minX, elX);
          minY = Math.min(minY, elY);
          maxX = Math.max(maxX, elX + elWidth);
          maxY = Math.max(maxY, elY + elHeight);
        }
      }

      console.log(`[UIDP Import] Bounds: min(${minX},${minY}) max(${maxX},${maxY})`);

      // 获取画布容器尺寸以计算居中位置
      const canvasContainer = document.querySelector('.excalidraw-wrapper');
      const containerWidth = canvasContainer?.clientWidth || window.innerWidth;
      const containerHeight = canvasContainer?.clientHeight || window.innerHeight;

      // 计算元素中心点
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // 滚动到元素中心，使元素显示在画布中央
      const newScrollX = elements.length > 0 ? containerWidth / 2 - centerX : 0;
      const newScrollY = elements.length > 0 ? containerHeight / 2 - centerY : 0;

      console.log(`[UIDP Import] Container size: ${containerWidth}x${containerHeight}`);
      console.log(`[UIDP Import] Center: (${centerX}, ${centerY})`);
      console.log(`[UIDP Import] Setting scroll to: (${newScrollX}, ${newScrollY})`);

      // 只传递必要的 appState 属性，避免与 Excalidraw 内部状态冲突
      // 使用新导入的元素替换现有元素（不合并）
      
      console.log(`[UIDP Import] Updating scene with ${elements.length} elements`);
      console.log(`[UIDP Import] First few elements:`, elements.slice(0, 3).map((e) => ({
        id: e.id,
        type: e.type,
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
      })));
      
      // 使用 updateScene 方法更新场景 - 替换所有元素
      excalidrawAPI.updateScene({
        elements: elements as unknown[],
        appState: {
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 },
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      console.log(`[UIDP Import] Scene updated with ${elements.length} elements`);
      
      // 滚动到元素位置，使导入的内容可见
      if (elements.length > 0) {
        setTimeout(() => {
          excalidrawAPI.scrollToContent(elements as unknown[]);
          console.log(`[UIDP Import] Scrolled to content`);
        }, 100);
      }

      // 延迟检查元素是否被正确添加
      setTimeout(() => {
        const sceneElements = excalidrawAPI.getSceneElements();
        console.log(`[UIDP Import] Scene now has ${sceneElements.length} elements`);
        if (sceneElements.length > 0) {
          console.log(`[UIDP Import] First element:`, sceneElements[0]);
        }
      }, 200);

      // 更新预设选择
      if (result.meta.preset) {
        const presetNames: Record<string, string> = {
          mobile: t.mobile,
          tablet: t.tablet,
          "desktop-hd": t.desktopHD,
          "desktop-fhd": t.desktopFHD,
        };
        if (presetNames[result.meta.preset]) {
          setSelectedPreset(presetNames[result.meta.preset]);
          setIsCustom(false);
        } else if (result.meta.preset === "custom" && result.meta.presetSize) {
          setIsCustom(true);
          setSelectedPreset(t.custom);
          const [width, height] = result.meta.presetSize.split("x");
          setCustomWidth(width);
          setCustomHeight(height);
        }
      }

      setExportStatus(t.importSuccess);
    } catch (error) {
      setExportStatus(`${t.readFailed} ${error}`);
    }
  }, [excalidrawAPI, t]);

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
            onClick={handleImportFromFile}
            className="export-btn import"
          >
            {t.openFile}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    const selected = elements.filter((el: ExcalidrawAnyElement) =>
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

export default App;
