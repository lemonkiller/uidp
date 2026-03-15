// UIDP 组件类型定义
export type UIDPComponentType =
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

// UIDP 形状定义
export interface UIDPShape {
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

// UIDP 元数据
export interface UIDPMeta {
  canvas?: string;
  unit?: string;
  preset?: string;
  presetSize?: string;
}

// 设备预设
export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  preset: string;
}

// 组件类型选项
export interface ComponentTypeOption {
  value: UIDPComponentType | "";
  label: string;
}

// 语言类型
export type Language = "zh-CN" | "en";

// Translations 接口定义在 i18n.ts 中，请从 i18n.ts 导入
