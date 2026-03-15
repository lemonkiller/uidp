export type Language = "zh-CN" | "en";

export interface Translations {
  appTitle: string;
  baseResolution: string;
  custom: string;
  width: string;
  height: string;
  exportUidp: string;
  copyToClipboard: string;
  help: string;
  selectShape: string;
  selected: string;
  multipleElements: string;
  componentType: string;
  clearMark: string;
  artboardAutoDetect: string;
  editorNotInitialized: string;
  noElementsToExport: string;
  savedTo: string;
  saveFailed: string;
  copiedToClipboard: string;
  copyFailed: string;
  // Import
  importUidp: string;
  openFile: string;
  fileNotFound: string;
  readFailed: string;
  importSuccess: string;
  invalidFileFormat: string;
  // Element type names
  rectangle: string;
  ellipse: string;
  line: string;
  arrow: string;
  text: string;
  frame: string;
  unknownType: string;
  // Device presets
  mobile: string;
  tablet: string;
  desktopHD: string;
  desktopFHD: string;
  // Component types
  none: string;
  button: string;
  input: string;
  select: string;
  checkbox: string;
  radio: string;
  textarea: string;
  switch: string;
  label: string;
  image: string;
  container: string;
  // Help content
  quickStart: string;
  drawingTools: string;
  componentSemanticMark: string;
  artboardDescription: string;
  exportFormat: string;
  shortcuts: string;
  bestPractices: string;
  helpStep1: string;
  helpStep2: string;
  helpStep3: string;
  helpStep4: string;
  helpStep5: string;
  toolRect: string;
  toolEllipse: string;
  toolLine: string;
  toolText: string;
  toolFrame: string;
  toolSelect: string;
  toolQuickSwitch: string;
  selectComponentTypeHint: string;
  componentTip: string;
  artboardDesc1: string;
  artboardDesc2: string;
  artboardDesc3: string;
  artboardDesc4: string;
  artboardDesc5: string;
  exportDesc1: string;
  exportDesc2: string;
  exportDesc3: string;
  exportTip: string;
  shortcutUndo: string;
  shortcutRedo: string;
  shortcutCopy: string;
  shortcutPaste: string;
  shortcutDelete: string;
  shortcutPan: string;
  shortcutZoom: string;
  practice1: string;
  practice2: string;
  practice3: string;
  practice4: string;
  practice5: string;
  practice6: string;
  close: string;
  language: string;
}

export const translations: Record<Language, Translations> = {
  "zh-CN": {
    appTitle: "UIDP Editor",
    baseResolution: "基准分辨率:",
    custom: "自定义",
    width: "宽",
    height: "高",
    exportUidp: "导出 .uidp 文件",
    copyToClipboard: "复制到剪贴板",
    help: "使用帮助",
    selectShape: "请选择一个形状",
    selected: "选中:",
    multipleElements: "多个元素",
    componentType: "组件类型:",
    clearMark: "清除标记",
    artboardAutoDetect: "画板自动识别",
    editorNotInitialized: "编辑器未初始化",
    noElementsToExport: "没有可导出的元素",
    savedTo: "已保存到:",
    saveFailed: "保存失败:",
    copiedToClipboard: "已复制到剪贴板",
    copyFailed: "复制失败:",
    importUidp: "导入 .uidp 文件",
    openFile: "打开文件",
    fileNotFound: "文件不存在",
    readFailed: "读取失败:",
    importSuccess: "导入成功",
    invalidFileFormat: "文件格式无效",
    rectangle: "矩形",
    ellipse: "圆形/椭圆",
    line: "线条",
    arrow: "箭头",
    text: "文本",
    frame: "画板 (Frame)",
    unknownType: "未知类型",
    mobile: "移动端",
    tablet: "平板",
    desktopHD: "桌面 HD",
    desktopFHD: "桌面 FHD",
    none: "无",
    button: "button (按钮)",
    input: "input (输入框)",
    select: "select (下拉选择)",
    checkbox: "checkbox (复选框)",
    radio: "radio (单选框)",
    textarea: "textarea (多行文本)",
    switch: "switch (开关)",
    label: "label (标签)",
    image: "image (图片)",
    container: "container (容器)",
    quickStart: "📋 快速开始",
    drawingTools: "🎨 绘制工具",
    componentSemanticMark: "🏷️ 组件语义标记",
    artboardDescription: "📐 画板（Frame）说明",
    exportFormat: "📤 导出格式",
    shortcuts: "⌨️ 常用快捷键",
    bestPractices: "💡 最佳实践",
    helpStep1: "选择设备预设：在顶部工具栏选择目标设备（移动端/平板/桌面）",
    helpStep2: "创建画板：按 F 键或选择 Frame 工具创建画板",
    helpStep3: "绘制界面：在画板内绘制矩形、圆形、文本等元素",
    helpStep4: "标记组件：选中形状后在顶部工具栏选择组件类型",
    helpStep5: "导出数据：点击「导出.uidp文件」或「复制到剪贴板」",
    toolRect: "R - 矩形工具（用于按钮、输入框、卡片等）",
    toolEllipse: "O - 圆形/椭圆工具（用于头像、图标等）",
    toolLine: "L - 线条工具（用于分割线、装饰线等）",
    toolText: "T - 文本工具（用于标签、标题等）",
    toolFrame: "F - Frame工具（画板，用于定义屏幕边界）",
    toolSelect: "V - 选择工具",
    toolQuickSwitch: "1-9 - 快速切换工具",
    selectComponentTypeHint: "选中形状后，在顶部工具栏的「组件类型」下拉框选择类型：",
    componentTip: "💡 提示：标记组件语义可以帮助 AI 更准确地理解界面意图",
    artboardDesc1: "画板用于定义屏幕边界，导出时会作为 #0 行输出",
    artboardDesc2: "面积最大的 Frame 会被自动识别为画板",
    artboardDesc3: "所有形状的坐标都是相对于画板左上角的偏移量（相对坐标）",
    artboardDesc4: "画板层级固定为 Z:0，始终在最底层",
    artboardDesc5: "画板会自动识别，无需标记组件类型",
    exportDesc1: "META - 画布尺寸、设备预设和参考尺寸",
    exportDesc2: "#0 - 画板信息（尺寸、预设类型）",
    exportDesc3: "#N - 形状信息（类型、相对坐标、层级、文本、组件语义）",
    exportTip: "💡 提示：AI 会使用等比缩放公式将相对坐标转换为实际像素位置",
    shortcutUndo: "撤销",
    shortcutRedo: "重做",
    shortcutCopy: "复制",
    shortcutPaste: "粘贴",
    shortcutDelete: "删除选中元素",
    shortcutPan: "平移画布",
    shortcutZoom: "缩放画布",
    practice1: "先创建画板，再在画板内绘制元素",
    practice2: "使用矩形表示按钮、输入框等交互组件",
    practice3: "使用文本工具添加标签和说明",
    practice4: "为关键组件添加语义标记，提高 AI 理解准确度",
    practice5: "合理设置层级（Z值），确保元素遮挡关系正确",
    practice6: "导出前检查设备预设是否匹配目标平台",
    close: "×",
    language: "语言",
  },
  "en": {
    appTitle: "UIDP Editor",
    baseResolution: "Base Resolution:",
    custom: "Custom",
    width: "Width",
    height: "Height",
    exportUidp: "Export .uidp File",
    copyToClipboard: "Copy to Clipboard",
    help: "Help",
    selectShape: "Please select a shape",
    selected: "Selected:",
    multipleElements: "Multiple Elements",
    componentType: "Component Type:",
    clearMark: "Clear Mark",
    artboardAutoDetect: "Artboard Auto-detect",
    editorNotInitialized: "Editor not initialized",
    noElementsToExport: "No elements to export",
    savedTo: "Saved to:",
    saveFailed: "Save failed:",
    copiedToClipboard: "Copied to clipboard",
    copyFailed: "Copy failed:",
    importUidp: "Import .uidp File",
    openFile: "Open File",
    fileNotFound: "File not found",
    readFailed: "Read failed:",
    importSuccess: "Import successful",
    invalidFileFormat: "Invalid file format",
    rectangle: "Rectangle",
    ellipse: "Ellipse",
    line: "Line",
    arrow: "Arrow",
    text: "Text",
    frame: "Artboard (Frame)",
    unknownType: "Unknown Type",
    mobile: "Mobile",
    tablet: "Tablet",
    desktopHD: "Desktop HD",
    desktopFHD: "Desktop FHD",
    none: "None",
    button: "button",
    input: "input",
    select: "select",
    checkbox: "checkbox",
    radio: "radio",
    textarea: "textarea",
    switch: "switch",
    label: "label",
    image: "image",
    container: "container",
    quickStart: "📋 Quick Start",
    drawingTools: "🎨 Drawing Tools",
    componentSemanticMark: "🏷️ Component Semantic Mark",
    artboardDescription: "📐 Artboard (Frame) Description",
    exportFormat: "📤 Export Format",
    shortcuts: "⌨️ Keyboard Shortcuts",
    bestPractices: "💡 Best Practices",
    helpStep1: "Select device preset: Choose target device (Mobile/Tablet/Desktop) in the top toolbar",
    helpStep2: "Create artboard: Press F key or select Frame tool to create an artboard",
    helpStep3: "Draw interface: Draw rectangles, circles, text and other elements within the artboard",
    helpStep4: "Mark components: Select component type in the top toolbar after selecting a shape",
    helpStep5: "Export data: Click 'Export .uidp File' or 'Copy to Clipboard'",
    toolRect: "R - Rectangle tool (for buttons, inputs, cards, etc.)",
    toolEllipse: "O - Ellipse tool (for avatars, icons, etc.)",
    toolLine: "L - Line tool (for dividers, decorative lines, etc.)",
    toolText: "T - Text tool (for labels, titles, etc.)",
    toolFrame: "F - Frame tool (Artboard, for defining screen boundaries)",
    toolSelect: "V - Select tool",
    toolQuickSwitch: "1-9 - Quick tool switch",
    selectComponentTypeHint: "After selecting a shape, choose the type from the 'Component Type' dropdown in the top toolbar:",
    componentTip: "💡 Tip: Marking component semantics helps AI understand interface intent more accurately",
    artboardDesc1: "Artboard defines screen boundaries and is exported as #0 row",
    artboardDesc2: "The largest Frame area is automatically recognized as the artboard",
    artboardDesc3: "All shape coordinates are relative offsets from the artboard top-left corner",
    artboardDesc4: "Artboard layer is fixed at Z:0, always at the bottom",
    artboardDesc5: "Artboard is auto-detected, no need to mark component type",
    exportDesc1: "META - Canvas size, device preset and reference dimensions",
    exportDesc2: "#0 - Artboard info (size, preset type)",
    exportDesc3: "#N - Shape info (type, relative coordinates, layer, text, component semantics)",
    exportTip: "💡 Tip: AI uses proportional scaling formula to convert relative coordinates to actual pixel positions",
    shortcutUndo: "Undo",
    shortcutRedo: "Redo",
    shortcutCopy: "Copy",
    shortcutPaste: "Paste",
    shortcutDelete: "Delete selected element",
    shortcutPan: "Pan canvas",
    shortcutZoom: "Zoom canvas",
    practice1: "Create artboard first, then draw elements inside",
    practice2: "Use rectangles for interactive components like buttons and inputs",
    practice3: "Use text tool to add labels and descriptions",
    practice4: "Add semantic marks to key components to improve AI understanding",
    practice5: "Set layers (Z values) properly to ensure correct element occlusion",
    practice6: "Check if device preset matches target platform before exporting",
    close: "×",
    language: "Language",
  },
};

export function getDevicePresetName(preset: string, lang: Language): string {
  const t = translations[lang];
  switch (preset) {
    case "mobile": return t.mobile;
    case "tablet": return t.tablet;
    case "desktop-hd": return t.desktopHD;
    case "desktop-fhd": return t.desktopFHD;
    default: return preset;
  }
}
