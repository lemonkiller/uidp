# UIDP Editor

**Collaborate with AI on UI Development through Sketches**

UIDP Editor is a visual sketching tool that lets you draw interface layouts through simple drag-and-drop, generating structured data that AI can easily understand to help you implement the code.

**[中文](README.md) | [English](README_EN.md)**

---

## What Problem Does It Solve?

### Pain Points of Traditional Methods

| Method | Problem |
|--------|---------|
| 📝 Text descriptions | Prone to ambiguity, back-and-forth communication |
| 🎨 Design to code | Requires manual measurement and annotation |
| 🔄 Repeated revisions | Every adjustment needs re-explanation |
| 🤖 AI understanding difficulty | Natural language UI descriptions are inefficient |
| 💰 **Design files too large** | Figma/Sketch files are several MB, wasting massive Tokens |

### UIDP's Solution

```
Your Sketch → .uidp File (a few KB) → AI Understanding → Code Implementation
```

- ✅ **Visual Drawing** - Drag and drop, no coding required
- ✅ **Precise Communication** - Geometric data eliminates ambiguity
- ✅ **Draw Once** - Export data directly to AI
- ✅ **AI-Friendly** - Structured format, easy for AI to parse
- 💰 **Extremely Token-Efficient** - Plain text format, **99%+ less** Token consumption than design images

### Why Save More Tokens Than Design Images?

| Method | File Size | Tokens per Request | Best For |
|--------|-----------|-------------------|----------|
| Figma/Sketch Screenshot | 500KB ~ 2MB | ~150K Tokens | High-fidelity visual reproduction |
| PNG/JPG Prototype | 100KB ~ 500KB | ~30K Tokens | Simple prototypes |
| **UIDP Data File** | **1KB ~ 5KB** | **~500 Tokens** | **Rapid development** |

> 💡 A login page: Figma screenshot ~200KB, UIDP only 0.5KB, **saving 400x Tokens**

---

## Quick Start

### 1. Download and Install

Download the Windows installer from [Releases](../../releases), or build it yourself:

```bash
cd uidp-editor
npm install
npm run tauri build
```

### 2. Draw Your First Interface

**Step 1: Create an Artboard**
- Press `F` key or select the Frame tool
- Drag to create a rectangle as the screen boundary

**Step 2: Draw Elements**
- `R` - Rectangle (buttons, input fields)
- `O` - Circle (avatars, icons)
- `T` - Text (labels, titles)
- `L` - Line (dividers)

**Step 3: Tag Components (Optional)**
- Select a shape
- Choose component type from the top toolbar (button, input, label, etc.)

**Step 4: Export to AI**
- Click "Export .uidp file" or "Copy to Clipboard"

**Step 5: Import and Iterate (Optional)**
- Click "Import .uidp file" to load previously exported files
- Supports editing `.uidp` files and reloading them into the editor
- Enables AI collaboration loop: Export → AI modifies → Import to view changes

### 3. Let AI Implement the Code

Send the `.uidp` file content to AI, and it will generate interface code based on geometric data and component semantics.

---

## Usage Example

### Example: Login Page

**Sketch:**
```
┌─────────────────────────┐
│      Login Page          │
│                          │
│    ┌───────────────┐     │
│    │   Username    │     │
│    └───────────────┘     │
│                          │
│    ┌───────────────┐     │
│    │   Password    │     │
│    └───────────────┘     │
│                          │
│    ┌───────────────┐     │  ← Tagged as button
│    │     Login     │     │
│    └───────────────┘     │
│                          │
└─────────────────────────┘
```

**Exported Data:**
```uidp
META:canvas=800x600 | unit=px | preset=custom | presetSize=400x500

#0 | T:artboard | R:0,0,400,500 | Z:0 | PRESET:custom
#1 | T:text | R:150,30,100,30 | Z:2 | TXT:Login Page | C:label
#2 | T:rect | R:50,80,300,40 | Z:1 | C:input
#3 | T:text | R:60,90,80,20 | Z:2 | TXT:Username | C:label
#4 | T:rect | R:50,140,300,40 | Z:1 | C:input
#5 | T:text | R:60,150,80,20 | Z:2 | TXT:Password | C:label
#6 | T:rect | R:50,220,300,45 | Z:1 | C:button
#7 | T:text | R:180,235,40,20 | Z:2 | TXT:Login | C:label
```

**AI-Generated Code** (React example):
```jsx
export default function LoginPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-[400px] p-8 border rounded-lg">
        <h1 className="text-center text-xl mb-6">Login Page</h1>
        <div className="mb-4">
          <label className="block mb-1">Username</label>
          <input className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input type="password" className="w-full px-3 py-2 border rounded" />
        </div>
        <button className="w-full py-2 bg-blue-500 text-white rounded">
          Login
        </button>
      </div>
    </div>
  );
}
```

---

## Core Concepts

### Artboard

The artboard defines screen boundaries. All element coordinates are relative offsets from the artboard's top-left corner.

- Create with **Frame tool (F key)**
- The largest Frame is automatically recognized as the artboard
- Supports device presets: Mobile, Tablet, Desktop

### Component Semantic Tags

Add semantic tags to shapes to help AI understand their purpose:

| Tag | Meaning | Usage |
|-----|---------|-------|
| `button` | Button | Clickable action |
| `input` | Input field | Single-line text input |
| `select` | Dropdown | Option selection |
| `checkbox` | Checkbox | Multiple selection |
| `radio` | Radio button | Single selection |
| `textarea` | Multi-line text | Long text input |
| `switch` | Toggle switch | State switching |
| `label` | Label | Descriptive text |
| `image` | Image | Image placeholder |
| `container` | Container | Layout container |

### Coordinate System

- Relative coordinates: Element positions relative to artboard top-left
- Proportional scaling: Scale to actual window size when rendering

---

## Shortcuts

| Shortcut | Function |
|----------|----------|
| `R` | Rectangle tool |
| `O` | Circle/Ellipse tool |
| `L` | Line tool |
| `T` | Text tool |
| `F` | Frame tool (Artboard) |
| `V` | Select tool |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + C/V` | Copy/Paste |
| `Delete` | Delete selected element |
| `Space + Drag` | Pan canvas |
| `Ctrl + +/-` | Zoom canvas |

---

## UIDP File Format

`.uidp` is a minimalist UI geometric data format:

```uidp
META:canvas=2560x1440 | unit=px | preset=desktop-hd | presetSize=1280x720

#0 | T:artboard | R:0,0,1280,720 | Z:0 | PRESET:desktop-hd
#1 | T:rect | R:80,90,200,50 | Z:1 | C:input
#2 | T:rect | R:80,160,200,50 | Z:1 | C:button
#3 | T:text | R:60,40,300,40 | Z:2 | TXT:Username | C:label
```

**Format Description:**
- `META` - Canvas info and device preset
- `#0` - Artboard (screen boundary reference)
- `#N` - Shapes (type, position, layer, semantics)
- `T` - Type (rect/circle/line/text/artboard)
- `R` - Rectangle area (x,y,width,height)
- `Z` - Layer (higher numbers are on top)
- `TXT` - Text content
- `C` - Component semantics (optional)

---

## Best Practices

1. **Create artboard first** - Press F key to create Frame as screen boundary
2. **Draw within artboard** - All elements should be inside the artboard
3. **Use rectangles for components** - Buttons, input fields use rectangles
4. **Add text labels** - Use text tool to add descriptions
5. **Tag key components** - Add semantic tags to buttons, inputs, etc.
6. **Choose appropriate preset** - Select Mobile/Tablet/Desktop based on target device
7. **Use import for iteration** - Export → AI modifies `.uidp` → Import to view changes

---

## Tech Stack

- **Tauri v2** - Lightweight desktop application framework
- **React 19** - User interface
- **Excalidraw** - Core canvas component

---

## License

MIT
