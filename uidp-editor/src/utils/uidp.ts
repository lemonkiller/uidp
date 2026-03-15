import type {
  UIDPShape,
  UIDPMeta,
  UIDPComponentType,
} from "../types";
import type { Translations } from "../i18n";

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 验证组件类型
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

// 获取协议头
export function getProtocolHeader(t: Translations): string {
  return `# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.3 - ${t.language === "Language" ? "Interface Geometry Data Format" : "界面几何数据格式"}
# ═══════════════════════════════════════════════════════════
#
# ${t.language === "Language" ? "[Important Notes]" : "【重要说明】"}
# - ${t.artboardDesc1}
# - ${t.artboardDesc3}
# - ${t.language === "Language" ? "Artboard size represents the original resolution of the design draft" : "画板尺寸表示设计稿的原始分辨率，元素坐标在此坐标系内定义"}
# - ${t.language === "Language" ? "Elements need to be scaled proportionally to actual window size when rendering" : "渲染时需要将画板内的元素按比例缩放到实际窗口大小"}
#
# ${t.language === "Language" ? "[Coordinate System]" : "【坐标系统】"}
# - ${t.language === "Language" ? "All coordinates use top-left origin (0,0)" : "所有坐标都是左上角原点 (0,0)"}
# - X${t.language === "Language" ? " axis increases to the right, Y axis increases downward" : "轴向右递增，Y轴向下递增"}
# - ${t.artboardDesc3}
# - ${t.language === "Language" ? "Element coordinates = offset within artboard (automatically calculated as relative coordinates)" : "元素坐标 = 元素在画板内的偏移量（已自动计算为相对坐标）"}
#
# META ${t.language === "Language" ? "Field Description" : "字段说明"}：
#   canvas     - ${t.language === "Language" ? "Actual canvas size (auto-calculated from element boundaries)" : "实际画布尺寸 (从元素边界自动计算)"}
#   unit       - ${t.language === "Language" ? "Unit type (px=pixel)" : "单位类型 (px=像素)"}
#   preset     - ${t.language === "Language" ? "Device preset type: mobile/tablet/desktop-hd/desktop-fhd/custom" : "设备预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom"}
#   presetSize - ${t.language === "Language" ? "Preset reference size (used to calculate scale ratio)" : "预设参考尺寸 (用于计算缩放比例)"}
#
# ${t.artboardDescription.replace("📐 ", "")}${t.language === "Language" ? " Field Description" : "字段说明"}：
#   #0       - ${t.language === "Language" ? "Artboard index fixed at 0" : "画板序号固定为 0"}
#   T        - ${t.language === "Language" ? "Type: artboard=artboard" : "类型: artboard=画板"}
#   R        - ${t.language === "Language" ? "Rect area: x,y,width,height (pixel values, x,y fixed at 0,0)" : "矩形区域: x,y,width,height (像素值，x,y固定为0,0)"}
#   Z        - ${t.artboardDesc4}
#   PRESET   - ${t.language === "Language" ? "Preset type: mobile/tablet/desktop-hd/desktop-fhd/custom" : "预设类型: mobile/tablet/desktop-hd/desktop-fhd/custom"}
#
# ${t.language === "Language" ? "Shape Field Description" : "形状字段说明"}：
#   #N  - ${t.language === "Language" ? "Index identifier (N=1,2,3...)" : "序号标识符 (N=1,2,3...)"}
#   T   - ${t.language === "Language" ? "Type: rect=rectangle circle=circle line=line text=text" : "类型: rect=矩形 circle=圆形 line=线条 text=文本"}
#   R   - ${t.language === "Language" ? "Rect area: x,y,width,height (pixel values, relative to artboard top-left)" : "矩形区域: x,y,width,height (像素值，相对于画板左上角)"}
#   Z   - ${t.language === "Language" ? "Layer: must be pure numbers (1,2,3...), larger numbers are on top" : "层级: 必须为纯数字（1,2,3...），数字越大越在上层"}
#   TXT - ${t.language === "Language" ? "Text content (text type only)" : "文本内容 (仅 text 类型)"}
#   C   - ${t.language === "Language" ? "Component semantics (optional): button/input/select/checkbox/radio/textarea/switch/label/image/container" : "组件语义 (可选): button/input/select/checkbox/radio/textarea/switch/label/image/container"}
#
# ${t.language === "Language" ? "[Rendering Formula - Proportional Scaling]" : "【渲染公式 - 等比缩放】"}
#   ${t.language === "Language" ? "[Required] Must use proportional scaling to maintain original aspect ratio" : "【强制】必须使用等比缩放，保持元素原始宽高比"}
#   scale = min(${t.language === "Language" ? "actual window width" : "实际窗口宽度"} / ${t.language === "Language" ? "artboard width" : "画板宽度"}, ${t.language === "Language" ? "actual window height" : "实际窗口高度"} / ${t.language === "Language" ? "artboard height" : "画板高度"})
#   ${t.language === "Language" ? "Actual X" : "实际X"} = ${t.language === "Language" ? "element relative X" : "元素相对X"} * scale
#   ${t.language === "Language" ? "Actual Y" : "实际Y"} = ${t.language === "Language" ? "element relative Y" : "元素相对Y"} * scale
#   ${t.language === "Language" ? "Actual Width" : "实际宽度"} = ${t.language === "Language" ? "element width" : "元素宽度"} * scale
#   ${t.language === "Language" ? "Actual Height" : "实际高度"} = ${t.language === "Language" ? "element height" : "元素高度"} * scale
#
# AI ${t.language === "Language" ? "Usage Suggestions" : "使用建议"}：
# - ${t.language === "Language" ? "Determine target device type based on artboard PRESET" : "根据画板 PRESET 确定目标设备类型"}
# - ${t.language === "Language" ? "[Required] Initial screen window size must use the base resolution specified by presetSize" : "【强制】初始屏幕窗口大小必须使用 presetSize 指定的基准分辨率"}
# - ${t.language === "Language" ? "Use the above rendering formula to convert relative coordinates to actual pixel positions" : "使用上述渲染公式将相对坐标转换为实际像素位置"}
# - ${t.language === "Language" ? "Choose appropriate component implementation based on shape type" : "根据形状类型选择合适的组件实现"}
# - ${t.language === "Language" ? "Determine component semantics based on C field (if present)" : "根据 C 字段（如有）确定组件语义"}
# ═══════════════════════════════════════════════════════════

`;
}

// 计算画布尺寸
export function calculateCanvasSize(
  elements: unknown[]
): { width: number; height: number } {
  if (elements.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const element = el as {
      isDeleted?: boolean;
      x: number;
      y: number;
      width?: number;
      height?: number;
    };

    if (element.isDeleted) continue;

    const x = element.x;
    const y = element.y;
    const width = element.width || 0;
    const height = element.height || 0;

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

// 转换为 UIDP 格式
export function convertToUIDP(
  elements: unknown[],
  presetName: string,
  presetWidth: number,
  presetHeight: number,
  t: Translations
): string {
  const shapes: UIDPShape[] = [];
  let artboard: UIDPShape | null = null;

  // 第一遍：查找画板（Frame类型元素，最大的那个作为画板）
  const frames: unknown[] = [];
  for (const el of elements) {
    const element = el as {
      isDeleted?: boolean;
      type: string;
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      customData?: { preset?: string };
    };

    if (element.isDeleted) continue;

    if (element.type === "frame") {
      frames.push(element);
    }
  }

  // 选择面积最大的 Frame 作为画板
  if (frames.length > 0) {
    frames.sort(
      (a, b) =>
        (b as { width: number; height: number }).width *
          (b as { width: number; height: number }).height -
        (a as { width: number; height: number }).width *
          (a as { width: number; height: number }).height
    );
    const selectedArtboard = frames[0] as {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      customData?: { preset?: string };
    };
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
  let zIndexCounter = 1;
  for (const el of elements) {
    const element = el as {
      isDeleted?: boolean;
      type: string;
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      text?: string;
      customData?: { uidpComponent?: UIDPComponentType };
    };

    if (element.isDeleted) continue;

    // 跳过画板本身
    if (element.type === "frame" && element.id === artboard?.id) {
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

    // 获取元素的左上角坐标
    let elX = element.x;
    let elY = element.y;

    // Excalidraw中椭圆和菱形的x,y是中心点，需要转换为左上角
    if (element.type === "ellipse" || element.type === "diamond") {
      elX = element.x - element.width / 2;
      elY = element.y - element.height / 2;
    }

    // 坐标相对于画板
    const relativeX = Math.round(elX - artboard.x);
    const relativeY = Math.round(elY - artboard.y);

    const shape: UIDPShape = {
      id: element.id,
      type,
      x: relativeX,
      y: relativeY,
      width: Math.round(element.width),
      height: Math.round(element.height),
      zIndex: zIndexCounter++,
    };

    if (type === "text" && "text" in element) {
      shape.text = element.text;
    }

    // 读取组件语义标记
    if (element.customData?.uidpComponent) {
      shape.component = element.customData.uidpComponent;
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

  // 其他形状
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

// 解析 UIDP 文件内容
export function parseUIDP(
  content: string
): { meta: UIDPMeta; shapes: UIDPShape[] } | null {
  const lines = content.split("\n");
  const meta: UIDPMeta = {};
  const shapes: UIDPShape[] = [];

  console.log("[UIDP Import] Starting to parse content, lines:", lines.length);

  // 1. 预扫描：提取 META 信息和画板坐标
  let artboardInfo: { x: number; y: number; width: number; height: number } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 解析 META 行
    if (trimmedLine.startsWith("META:")) {
      const metaStr = trimmedLine.substring(5);
      const parts = metaStr.split(" | ");
      for (const part of parts) {
        const [key, value] = part.split("=");
        if (key && value) {
          (meta as Record<string, string>)[key.trim()] = value.trim();
        }
      }
      console.log("[UIDP Import] Parsed META:", meta);
      continue;
    }

    // 预扫描画板信息
    if (trimmedLine.startsWith("#0") && trimmedLine.includes("T:artboard")) {
      const rMatch = trimmedLine.match(/R:([-\d.,]+)/);
      if (rMatch) {
        const rectParts = rMatch[1].split(",").map((n) => parseFloat(n.trim()));
        if (rectParts.length >= 4 && !rectParts.some(isNaN)) {
          artboardInfo = {
            x: rectParts[0],
            y: rectParts[1],
            width: rectParts[2],
            height: rectParts[3],
          };
          console.log("[UIDP Import] Found artboard:", artboardInfo);
        }
      }
    }
  }

  // 2. 正式解析元素
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 跳过注释行（以 # 开头但不是 #数字 的行）
    if (trimmedLine.startsWith("#") && !/^#\d+/.test(trimmedLine)) {
      continue;
    }

    // 跳过 META 行
    if (trimmedLine.startsWith("META:")) continue;

    // 解析形状行
    const typeMatch = trimmedLine.match(/T:(\w+)/);
    const rMatch = trimmedLine.match(/R:([-\d.,]+)/);
    const zMatch = trimmedLine.match(/Z:(\d+)/);
    const txtMatch = trimmedLine.match(/TXT:([^|]+)/);
    const cMatch = trimmedLine.match(/C:(\w+)/);
    const presetMatch = trimmedLine.match(/PRESET:(\w+)/);

    if (!typeMatch || !rMatch) {
      continue;
    }

    const type = typeMatch[1];
    const rectStr = rMatch[1];
    const zIndexStr = zMatch ? zMatch[1] : "1";
    const text = txtMatch ? txtMatch[1].trim() : undefined;
    const component = cMatch ? cMatch[1] : undefined;
    const preset = presetMatch ? presetMatch[1] : undefined;

    const rectParts = rectStr.split(",").map((n) => parseFloat(n.trim()));

    if (rectParts.length < 4 || rectParts.some(isNaN)) {
      continue;
    }

    const shape: UIDPShape = {
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as UIDPShape["type"],
      x: rectParts[0],
      y: rectParts[1],
      width: rectParts[2],
      height: rectParts[3],
      zIndex: parseInt(zIndexStr, 10),
    };

    if (text) {
      shape.text = text;
    }

    if (component && isValidComponentType(component)) {
      shape.component = component as UIDPComponentType;
    }

    if (type === "artboard") {
      shape.preset = preset || meta.preset || "custom";
    }

    shapes.push(shape);
  }

  console.log(
    `[UIDP Import] Parsed ${shapes.length} shapes:`
  );

  if (shapes.length === 0) {
    return null;
  }

  // 3. 排序：确保 Z 轴层级正确
  shapes.sort((a, b) => {
    if (a.type === "artboard") return -1;
    if (b.type === "artboard") return 1;
    return a.zIndex - b.zIndex;
  });

  return { meta, shapes };
}

// 从 UIDP 转换为 Excalidraw 元素
export function convertFromUIDP(
  shapes: UIDPShape[],
  _meta: UIDPMeta
): Record<string, unknown>[] {
  const elements: Record<string, unknown>[] = [];

  console.log(
    "[UIDP Import] Converting shapes to Excalidraw elements:",
    shapes.length
  );

  // 找到画板
  const artboard = shapes.find((s) => s.type === "artboard");
  const artboardOriginX = artboard ? artboard.x : 0;
  const artboardOriginY = artboard ? artboard.y : 0;

  console.log(
    `[UIDP Import] Artboard: ${artboard ? `${artboard.width}x${artboard.height} at (${artboardOriginX},${artboardOriginY})` : "none"}`
  );

  // 首先添加画板（frame）
  if (artboard) {
    const frameElement: Record<string, unknown> = {
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
      name: "画板",
    };
    elements.push(frameElement);
    console.log(`[UIDP Import] Created frame element: ${artboard.width}x${artboard.height}`);
  }

  // 转换其他形状
  for (const shape of shapes) {
    if (shape.type === "artboard") continue;

    // 相对坐标转绝对坐标
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
      customData: {},
      angle: 0,
    };

    let element: Record<string, unknown> | null = null;

    switch (shape.type) {
      case "rect":
        element = {
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
        };
        if (shape.component) {
          element.customData = { uidpComponent: shape.component };
        }
        break;

      case "circle":
        element = {
          ...baseProperties,
          type: "ellipse",
          x: absoluteX + shape.width / 2,
          y: absoluteY + shape.height / 2,
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
        };
        if (shape.component) {
          element.customData = { uidpComponent: shape.component };
        }
        break;

      case "line":
        element = {
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
        };
        if (shape.component) {
          element.customData = { uidpComponent: shape.component };
        }
        break;

      case "text":
        element = {
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
        };
        if (shape.component) {
          element.customData = { uidpComponent: shape.component };
        }
        break;

      default:
        continue;
    }

    if (element) {
      elements.push(element);
    }
  }

  console.log(`[UIDP Import] Total elements created:`, elements.length);
  return elements;
}

// 重新导出类型
export type { UIDPShape, UIDPComponentType, UIDPMeta } from "../types";
