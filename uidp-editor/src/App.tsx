import { useCallback, useMemo, useRef, useState } from "react";
import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { translations, type Language, type Translations } from "./i18n";
import {
  convertFromUIDP,
  convertToUIDP,
  parseUIDP,
  type UIDPComponentType,
} from "./utils/uidp";
import type { ExcalidrawAPI, ExcalidrawAnyElement } from "./types/excalidraw";
import "./App.css";

type DevicePresetKey =
  | "mobile"
  | "tablet"
  | "desktop-hd"
  | "desktop-fhd"
  | "custom";

interface DevicePreset {
  key: Exclude<DevicePresetKey, "custom">;
  width: number;
  height: number;
  label: string;
}

function App() {
  const [lang, setLang] = useState<Language>("zh-CN");
  const [exportStatus, setExportStatus] = useState("");
  const [selectedPreset, setSelectedPreset] =
    useState<DevicePresetKey>("mobile");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [selectedElements, setSelectedElements] = useState<
    ExcalidrawAnyElement[]
  >([]);
  const [selectedComponentType, setSelectedComponentType] = useState<
    UIDPComponentType | ""
  >("");
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const selectionStateRef = useRef({
    ids: [] as string[],
    componentType: "" as UIDPComponentType | "",
  });

  const t = translations[lang];

  const devicePresets = useMemo<DevicePreset[]>(
    () => [
      { key: "mobile", width: 375, height: 667, label: t.mobile },
      { key: "tablet", width: 768, height: 1024, label: t.tablet },
      { key: "desktop-hd", width: 1280, height: 720, label: t.desktopHD },
      { key: "desktop-fhd", width: 1920, height: 1080, label: t.desktopFHD },
    ],
    [t.desktopFHD, t.desktopHD, t.mobile, t.tablet],
  );

  const componentTypes = useMemo(
    () => [
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
    ] as { value: UIDPComponentType | ""; label: string }[],
    [
      t.button,
      t.checkbox,
      t.container,
      t.image,
      t.input,
      t.label,
      t.none,
      t.radio,
      t.select,
      t.switch,
      t.textarea,
    ],
  );

  const isCustom = selectedPreset === "custom";
  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        toggleTheme: false,
        saveToActiveFile: false,
      },
    }),
    [],
  );
  const handleExcalidrawAPI = useCallback((api: unknown) => {
    excalidrawAPIRef.current = api as ExcalidrawAPI | null;
  }, []);

  const getBaseDimensions = useCallback(() => {
    if (selectedPreset === "custom") {
      return {
        width: parseInt(customWidth, 10) || 375,
        height: parseInt(customHeight, 10) || 667,
        key: "custom" as const,
      };
    }

    const preset = devicePresets.find((item) => item.key === selectedPreset);
    return preset || { width: 375, height: 667, label: t.mobile, key: "mobile" };
  }, [customHeight, customWidth, devicePresets, selectedPreset, t.mobile]);

  const syncSelectionState = useCallback(
    (
      elements: readonly ExcalidrawAnyElement[],
      appState: { selectedElementIds?: Record<string, boolean> },
    ) => {
      const selectedIds = Object.keys(appState.selectedElementIds || {});
      const nextSelected = elements.filter((element) =>
        selectedIds.includes(element.id),
      );
      const nextIds = nextSelected.map((element) => element.id);
      const nextComponentType =
        nextSelected.length === 1
          ? ((nextSelected[0].customData?.uidpComponent as
              | UIDPComponentType
              | undefined) ?? "")
          : "";

      const prevState = selectionStateRef.current;
      const hasSameSelection =
        prevState.ids.length === nextIds.length &&
        prevState.ids.every((id, index) => id === nextIds[index]) &&
        prevState.componentType === nextComponentType;

      if (hasSameSelection) {
        return;
      }

      selectionStateRef.current = {
        ids: nextIds,
        componentType: nextComponentType,
      };

      setSelectedElements(nextSelected);
      setSelectedComponentType(nextComponentType);
    },
    [],
  );

  const handleSceneChange = useCallback(
    (
      elements: readonly ExcalidrawAnyElement[],
      appState: { selectedElementIds?: Record<string, boolean> },
      _files: unknown,
    ) => {
      syncSelectionState(elements, appState);
    },
    [syncSelectionState],
  );

  const handlePresetChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedPreset(event.target.value as DevicePresetKey);
    },
    [],
  );

  const handleComponentTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as UIDPComponentType | "";
      setSelectedComponentType(value);
      selectionStateRef.current = {
        ...selectionStateRef.current,
        componentType: value,
      };

      const excalidrawAPI = excalidrawAPIRef.current;
      if (selectedElements.length !== 1 || !excalidrawAPI) {
        return;
      }

      const selectedElement = selectedElements[0];
      excalidrawAPI.updateScene({
        elements: excalidrawAPI.getSceneElements().map((sceneElement) =>
          sceneElement.id === selectedElement.id
            ? {
                ...sceneElement,
                customData: {
                  ...sceneElement.customData,
                  uidpComponent: value || undefined,
                },
              }
            : sceneElement,
        ),
      });
    },
    [selectedElements],
  );

  const handleClearComponent = useCallback(() => {
    setSelectedComponentType("");
    selectionStateRef.current = {
      ...selectionStateRef.current,
      componentType: "",
    };

    const excalidrawAPI = excalidrawAPIRef.current;
    if (selectedElements.length !== 1 || !excalidrawAPI) {
      return;
    }

    const selectedElement = selectedElements[0];
    excalidrawAPI.updateScene({
      elements: excalidrawAPI.getSceneElements().map((sceneElement) =>
        sceneElement.id === selectedElement.id
          ? {
              ...sceneElement,
              customData: {
                ...sceneElement.customData,
                uidpComponent: undefined,
              },
            }
          : sceneElement,
      ),
    });
  }, [selectedElements]);

  const handleExportToFile = useCallback(async () => {
    const excalidrawAPI = excalidrawAPIRef.current;
    if (!excalidrawAPI) {
      setExportStatus(t.editorNotInitialized);
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (elements.length === 0) {
      setExportStatus(t.noElementsToExport);
      return;
    }

    const baseDimensions = getBaseDimensions();
    const uidpContent = convertToUIDP(
      elements,
      baseDimensions.key,
      baseDimensions.width,
      baseDimensions.height,
      t,
    );

    try {
      const filePath = await save({
        filters: [{ name: "UIDP", extensions: ["uidp"] }],
        defaultPath: "sketch.uidp",
      });

      if (!filePath) {
        return;
      }

      await writeTextFile(filePath, uidpContent);
      setExportStatus(`${t.savedTo} ${filePath}`);
    } catch (error) {
      setExportStatus(`${t.saveFailed} ${String(error)}`);
    }
  }, [getBaseDimensions, t]);

  const handleCopyToClipboard = useCallback(async () => {
    const excalidrawAPI = excalidrawAPIRef.current;
    if (!excalidrawAPI) {
      setExportStatus(t.editorNotInitialized);
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (elements.length === 0) {
      setExportStatus(t.noElementsToExport);
      return;
    }

    const baseDimensions = getBaseDimensions();
    const uidpContent = convertToUIDP(
      elements,
      baseDimensions.key,
      baseDimensions.width,
      baseDimensions.height,
      t,
    );

    try {
      await writeText(uidpContent);
      setExportStatus(t.copiedToClipboard);
    } catch (error) {
      setExportStatus(`${t.copyFailed} ${String(error)}`);
    }
  }, [getBaseDimensions, t]);

  const handleImportFromFile = useCallback(async () => {
    const excalidrawAPI = excalidrawAPIRef.current;
    if (!excalidrawAPI) {
      setExportStatus(t.editorNotInitialized);
      return;
    }

    try {
      const selectedPath = await open({
        filters: [{ name: "UIDP", extensions: ["uidp"] }],
      });

      const filePath =
        typeof selectedPath === "string" ? selectedPath : selectedPath?.[0];
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
      excalidrawAPI.updateScene({
        elements: elements as ExcalidrawAnyElement[],
        appState: {
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 },
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      if (elements.length > 0) {
        requestAnimationFrame(() => {
          excalidrawAPI.scrollToContent(elements as ExcalidrawAnyElement[]);
        });
      }

      switch (result.meta.preset) {
        case "mobile":
        case "tablet":
        case "desktop-hd":
        case "desktop-fhd":
          setSelectedPreset(result.meta.preset);
          break;
        case "custom":
          setSelectedPreset("custom");
          if (result.meta.presetSize) {
            const [width = "", height = ""] = result.meta.presetSize.split("x");
            setCustomWidth(width);
            setCustomHeight(height);
          }
          break;
        default:
          break;
      }

      setExportStatus(t.importSuccess);
    } catch (error) {
      setExportStatus(`${t.readFailed} ${String(error)}`);
    }
  }, [t]);

  const getSelectedElementTypeName = useCallback(() => {
    if (selectedElements.length === 0) {
      return "";
    }
    if (selectedElements.length > 1) {
      return t.multipleElements;
    }

    switch (selectedElements[0].type) {
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
        return selectedElements[0].type || t.unknownType;
    }
  }, [selectedElements, t]);

  const toggleLanguage = useCallback(() => {
    setLang((current) => (current === "zh-CN" ? "en" : "zh-CN"));
  }, []);

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1 className="app-title">{t.appTitle}</h1>
        <div className="device-preset-section">
          <label className="preset-label">{t.baseResolution}</label>
          <select
            className="preset-select"
            value={selectedPreset}
            onChange={handlePresetChange}
          >
            {devicePresets.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label} ({preset.width}x{preset.height})
              </option>
            ))}
            <option value="custom">{t.custom}...</option>
          </select>
          {isCustom && (
            <div className="custom-dimensions">
              <input
                type="number"
                className="dimension-input"
                placeholder={t.width}
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
                min="1"
              />
              <span className="dimension-separator">x</span>
              <input
                type="number"
                className="dimension-input"
                placeholder={t.height}
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
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
          <button onClick={handleImportFromFile} className="export-btn import">
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
            {lang === "zh-CN" ? "EN / 中文" : "中文 / EN"}
          </button>
        </div>

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
                        {componentTypes.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
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
                    <span className="property-hint">{t.artboardAutoDetect}</span>
                  </>
                )}
            </div>
          )}
        </div>

        {exportStatus && <span className="status-message">{exportStatus}</span>}
      </div>

      <div className="main-content">
        <div className="excalidraw-wrapper">
          <Excalidraw
            excalidrawAPI={handleExcalidrawAPI}
            onChange={handleSceneChange}
            theme="light"
            zenModeEnabled={false}
            viewModeEnabled={false}
            langCode={lang}
            UIOptions={uiOptions}
          />
        </div>
      </div>

      {showHelp && <HelpModal t={t} onClose={() => setShowHelp(false)} />}
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
      <div className="help-modal" onClick={(event) => event.stopPropagation()}>
        <div className="help-header">
          <h2>{t.help}</h2>
          <button className="help-close-btn" onClick={onClose}>
            {t.close}
          </button>
        </div>
        <div className="help-content">
          <section className="help-section">
            <h3>{t.quickStart}</h3>
            <ol>
              <li>
                <strong>{t.helpStep1}</strong>
              </li>
              <li>
                <strong>{t.helpStep2}</strong>
              </li>
              <li>
                <strong>{t.helpStep3}</strong>
              </li>
              <li>
                <strong>{t.helpStep4}</strong>
              </li>
              <li>
                <strong>{t.helpStep5}</strong>
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h3>{t.drawingTools}</h3>
            <ul>
              <li>
                <kbd>R</kbd> - {t.toolRect}
              </li>
              <li>
                <kbd>O</kbd> - {t.toolEllipse}
              </li>
              <li>
                <kbd>L</kbd> - {t.toolLine}
              </li>
              <li>
                <kbd>T</kbd> - {t.toolText}
              </li>
              <li>
                <kbd>F</kbd> - {t.toolFrame}
              </li>
              <li>
                <kbd>V</kbd> - {t.toolSelect}
              </li>
              <li>
                <kbd>1-9</kbd> - {t.toolQuickSwitch}
              </li>
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
              <li>
                <code>META</code> - {t.exportDesc1}
              </li>
              <li>
                <code>#0</code> - {t.exportDesc2}
              </li>
              <li>
                <code>#N</code> - {t.exportDesc3}
              </li>
            </ul>
            <p className="help-tip">{t.exportTip}</p>
          </section>

          <section className="help-section">
            <h3>{t.shortcuts}</h3>
            <div className="help-shortcut-grid">
              <div>
                <kbd>Ctrl</kbd> + <kbd>Z</kbd>
              </div>
              <span>{t.shortcutUndo}</span>
              <div>
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
              </div>
              <span>{t.shortcutRedo}</span>
              <div>
                <kbd>Ctrl</kbd> + <kbd>C</kbd>
              </div>
              <span>{t.shortcutCopy}</span>
              <div>
                <kbd>Ctrl</kbd> + <kbd>V</kbd>
              </div>
              <span>{t.shortcutPaste}</span>
              <div>
                <kbd>Delete</kbd>
              </div>
              <span>{t.shortcutDelete}</span>
              <div>
                <kbd>Space</kbd> + {t.shortcutPan}
              </div>
              <span>{t.shortcutPan}</span>
              <div>
                <kbd>Ctrl</kbd> + <kbd>+/-</kbd>
              </div>
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
