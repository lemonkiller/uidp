// Excalidraw 类型定义

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
  customData?: {
    uidpComponent?: string;
    preset?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ExcalidrawRectangleElement extends ExcalidrawElement {
  type: 'rectangle';
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface ExcalidrawEllipseElement extends ExcalidrawElement {
  type: 'ellipse';
  backgroundColor: string;
  strokeColor: string;
}

export interface ExcalidrawTextElement extends ExcalidrawElement {
  type: 'text';
  text: string;
  originalText: string;
  fontSize: number;
}

export interface ExcalidrawLineElement extends ExcalidrawElement {
  type: 'line';
  points: number[][];
}

export interface ExcalidrawFrameElement extends ExcalidrawElement {
  type: 'frame';
}

export type ExcalidrawAnyElement =
  | ExcalidrawRectangleElement
  | ExcalidrawEllipseElement
  | ExcalidrawTextElement
  | ExcalidrawLineElement
  | ExcalidrawFrameElement
  | ExcalidrawElement;

export interface AppState {
  selectedElementIds: Record<string, boolean>;
  scrollX: number;
  scrollY: number;
  zoom: { value: number };
  [key: string]: unknown;
}

export interface ExcalidrawAPI {
  getSceneElements: () => ExcalidrawAnyElement[];
  updateScene: (scene: {
    elements?: ExcalidrawAnyElement[];
    appState?: Partial<AppState>;
    captureUpdate?: unknown;
  }) => void;
  getAppState: () => AppState;
  scrollToContent: (elements?: ExcalidrawAnyElement[]) => void;
  [key: string]: unknown;
}
