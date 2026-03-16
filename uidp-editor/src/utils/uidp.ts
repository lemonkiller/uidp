import type { UIDPComponentType, UIDPMeta, UIDPShape } from "../types";
import type { Translations } from "../i18n";

type ExcalidrawElementLike = {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  isDeleted?: boolean;
  customData?: {
    preset?: string;
    uidpComponent?: UIDPComponentType;
  };
};

function encodeTextField(text: string): string {
  return encodeURIComponent(text);
}

function decodeTextField(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function isValidComponentType(type: string): boolean {
  const validTypes: UIDPComponentType[] = [
    "button",
    "input",
    "select",
    "checkbox",
    "radio",
    "textarea",
    "switch",
    "label",
    "image",
    "container",
  ];
  return validTypes.includes(type as UIDPComponentType);
}

export function getProtocolHeader(t: Translations): string {
  const isEnglish = t.language === "Language";
  return [
    "# ================================================",
    `# UIDP PROTOCOL v5.3 - ${isEnglish ? "Interface Geometry Data Format" : "界面几何数据格式"}`,
    "# ================================================",
    "#",
    `# ${isEnglish ? "[Important Notes]" : "【重要说明】"}`,
    `# - ${t.artboardDesc1}`,
    `# - ${t.artboardDesc3}`,
    `# - ${isEnglish ? "Artboard size represents the original design resolution." : "画板尺寸代表设计稿的原始分辨率。"}`,
    `# - ${isEnglish ? "Renderers should scale elements proportionally to the actual window size." : "渲染时应按实际窗口大小对元素进行等比缩放。"}`,
    "#",
    `# ${isEnglish ? "[Coordinate System]" : "【坐标系统】"}`,
    `# - ${isEnglish ? "All coordinates use the top-left corner as origin (0,0)." : "所有坐标均使用左上角作为原点 (0,0)。"}`,
    `# - ${isEnglish ? "X increases to the right and Y increases downward." : "X 轴向右递增，Y 轴向下递增。"}`,
    `# - ${isEnglish ? "Element coordinates are stored relative to the artboard origin." : "元素坐标相对于画板原点保存。"}`,
    "#",
    `# ${isEnglish ? "[Fields]" : "【字段说明】"}`,
    `# META: canvas, unit, preset, presetSize`,
    `# #0: artboard definition`,
    `# #N: shape definition`,
    "# ================================================",
    "",
  ].join("\n");
}

export function calculateCanvasSize(
  elements: unknown[],
): { width: number; height: number } {
  if (elements.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const element = el as ExcalidrawElementLike;
    if (element.isDeleted) {
      continue;
    }

    const x = element.x;
    const y = element.y;
    const width = element.width ?? 0;
    const height = element.height ?? 0;

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

export function convertToUIDP(
  elements: unknown[],
  presetName: string,
  presetWidth: number,
  presetHeight: number,
  t: Translations,
): string {
  const sceneElements = elements as ExcalidrawElementLike[];
  const shapes: UIDPShape[] = [];
  let artboard: UIDPShape | null = null;

  const frames = sceneElements
    .filter((element) => !element.isDeleted && element.type === "frame")
    .sort(
      (a, b) =>
        (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0),
    );

  if (frames.length > 0) {
    const selectedArtboard = frames[0];
    artboard = {
      id: selectedArtboard.id,
      type: "artboard",
      x: Math.round(selectedArtboard.x),
      y: Math.round(selectedArtboard.y),
      width: Math.round(selectedArtboard.width ?? presetWidth),
      height: Math.round(selectedArtboard.height ?? presetHeight),
      zIndex: 0,
      preset: selectedArtboard.customData?.preset || presetName,
    };
  }

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

  let zIndexCounter = 1;

  for (const element of sceneElements) {
    if (element.isDeleted) {
      continue;
    }
    if (element.type === "frame" && element.id === artboard.id) {
      continue;
    }

    let type: UIDPShape["type"];
    switch (element.type) {
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
      id: element.id,
      type,
      x: Math.round(element.x - artboard.x),
      y: Math.round(element.y - artboard.y),
      width: Math.round(element.width ?? 0),
      height: Math.round(element.height ?? 0),
      zIndex: zIndexCounter++,
    };

    if (type === "text" && typeof element.text === "string") {
      shape.text = element.text;
    }

    if (element.customData?.uidpComponent) {
      shape.component = element.customData.uidpComponent;
    }

    shapes.push(shape);
  }

  shapes.sort((a, b) => a.zIndex - b.zIndex);

  const canvasSize = calculateCanvasSize(sceneElements);
  const metaLine = `META:canvas=${canvasSize.width}x${canvasSize.height} | unit=px | preset=${artboard.preset} | presetSize=${presetWidth}x${presetHeight}`;

  const lines = [
    `#0 | T:artboard | R:0,0,${artboard.width},${artboard.height} | Z:0 | PRESET:${artboard.preset}`,
  ];

  shapes.forEach((shape, index) => {
    let line = `#${index + 1} | T:${shape.type} | R:${shape.x},${shape.y},${shape.width},${shape.height} | Z:${shape.zIndex}`;
    if (shape.text !== undefined) {
      line += ` | TXT:${encodeTextField(shape.text)}`;
    }
    if (shape.component) {
      line += ` | C:${shape.component}`;
    }
    lines.push(line);
  });

  return `${getProtocolHeader(t)}${metaLine}\n\n${lines.join("\n")}`;
}

export function parseUIDP(
  content: string,
): { meta: UIDPMeta; shapes: UIDPShape[] } | null {
  const lines = content.split("\n");
  const meta: UIDPMeta = {};
  const shapes: UIDPShape[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }
    if (trimmedLine.startsWith("META:")) {
      const parts = trimmedLine.slice(5).split(" | ");
      for (const part of parts) {
        const separatorIndex = part.indexOf("=");
        if (separatorIndex === -1) {
          continue;
        }
        const key = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();
        (meta as Record<string, string>)[key] = value;
      }
    }
  }

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }
    if (trimmedLine.startsWith("META:")) {
      continue;
    }
    if (trimmedLine.startsWith("#") && !/^#\d+/.test(trimmedLine)) {
      continue;
    }

    const typeMatch = trimmedLine.match(/T:(\w+)/);
    const rectMatch = trimmedLine.match(/R:([-\d.,]+)/);
    if (!typeMatch || !rectMatch) {
      continue;
    }

    const zMatch = trimmedLine.match(/Z:(\d+)/);
    const txtMatch = trimmedLine.match(/TXT:([^|]+)/);
    const componentMatch = trimmedLine.match(/C:(\w+)/);
    const presetMatch = trimmedLine.match(/PRESET:([\w-]+)/);
    const rectParts = rectMatch[1]
      .split(",")
      .map((value) => parseFloat(value.trim()));

    if (rectParts.length < 4 || rectParts.some(Number.isNaN)) {
      continue;
    }

    const shape: UIDPShape = {
      id: generateId(),
      type: typeMatch[1] as UIDPShape["type"],
      x: rectParts[0],
      y: rectParts[1],
      width: rectParts[2],
      height: rectParts[3],
      zIndex: parseInt(zMatch?.[1] ?? "1", 10),
    };

    if (txtMatch) {
      shape.text = decodeTextField(txtMatch[1].trim());
    }

    if (componentMatch && isValidComponentType(componentMatch[1])) {
      shape.component = componentMatch[1] as UIDPComponentType;
    }

    if (shape.type === "artboard") {
      shape.preset = presetMatch?.[1] || meta.preset || "custom";
    }

    shapes.push(shape);
  }

  if (shapes.length === 0) {
    return null;
  }

  shapes.sort((a, b) => {
    if (a.type === "artboard") {
      return -1;
    }
    if (b.type === "artboard") {
      return 1;
    }
    return a.zIndex - b.zIndex;
  });

  return { meta, shapes };
}

export function convertFromUIDP(
  shapes: UIDPShape[],
  _meta: UIDPMeta,
): Record<string, unknown>[] {
  const elements: Record<string, unknown>[] = [];
  const artboard = shapes.find((shape) => shape.type === "artboard");
  const artboardOriginX = artboard?.x ?? 0;
  const artboardOriginY = artboard?.y ?? 0;

  if (artboard) {
    elements.push({
      id: generateId(),
      type: "frame",
      x: artboardOriginX,
      y: artboardOriginY,
      width: artboard.width,
      height: artboard.height,
      isDeleted: false,
      version: 1,
      versionNonce: Date.now(),
      updated: Date.now(),
      seed: Math.floor(Math.random() * 100000),
      frameId: null,
      boundElements: null,
      groupIds: [],
      link: null,
      locked: false,
      index: null,
      customData: {
        preset: artboard.preset,
      },
      angle: 0,
      backgroundColor: "transparent",
      strokeColor: "#000000",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      fillStyle: "hachure",
      roundness: null,
      name: "Artboard",
    });
  }

  for (const shape of shapes) {
    if (shape.type === "artboard") {
      continue;
    }

    const absoluteX = artboardOriginX + shape.x;
    const absoluteY = artboardOriginY + shape.y;

    const baseProperties = {
      id: generateId(),
      isDeleted: false,
      version: 1,
      versionNonce: Date.now(),
      updated: Date.now(),
      seed: Math.floor(Math.random() * 100000),
      frameId: null,
      boundElements: null,
      groupIds: [],
      link: null,
      locked: false,
      index: null,
      customData: shape.component ? { uidpComponent: shape.component } : {},
      angle: 0,
    };

    switch (shape.type) {
      case "rect":
        elements.push({
          ...baseProperties,
          type: "rectangle",
          x: absoluteX,
          y: absoluteY,
          width: shape.width,
          height: shape.height,
          backgroundColor: "transparent",
          strokeColor: "#000000",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          fillStyle: "hachure",
          roundness: null,
        });
        break;
      case "circle":
        elements.push({
          ...baseProperties,
          type: "ellipse",
          x: absoluteX,
          y: absoluteY,
          width: shape.width,
          height: shape.height,
          backgroundColor: "#e3e3e3",
          strokeColor: "#000000",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          fillStyle: "solid",
          roundness: null,
        });
        break;
      case "line":
        elements.push({
          ...baseProperties,
          type: "line",
          x: absoluteX,
          y: absoluteY,
          width: shape.width,
          height: shape.height,
          backgroundColor: "transparent",
          strokeColor: "#000000",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          points: [
            [0, 0],
            [shape.width, shape.height],
          ],
          lastCommittedPoint: null,
          startBinding: null,
          endBinding: null,
          startArrowhead: null,
          endArrowhead: null,
        });
        break;
      case "text":
        elements.push({
          ...baseProperties,
          type: "text",
          x: absoluteX,
          y: absoluteY,
          width: shape.width,
          height: shape.height,
          text: shape.text || "",
          backgroundColor: "transparent",
          strokeColor: "#000000",
          fontSize: 20,
          fontFamily: 1,
          textAlign: "left",
          verticalAlign: "top",
          roughness: 0,
          opacity: 100,
          containerId: null,
          originalText: shape.text || "",
          lineHeight: 1.25,
          autoResize: true,
        });
        break;
      default:
        break;
    }
  }

  return elements;
}

export type { UIDPComponentType, UIDPMeta, UIDPShape } from "../types";
