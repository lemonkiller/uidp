# UIDP Editor

An Excalidraw-based UI sketch editor for generating UIDP (User Interface Data Packet) format geometric data files, designed to assist AI in interface development.

**[中文](README.md) | [English](README_EN.md)**

## Features

- 🎨 **Hand-drawn Style Canvas** - Intuitive drawing experience based on Excalidraw
- 📐 **Geometric Data Export** - Export sketches to structured `.uidp` format
- 🏷️ **Component Semantic Tagging** - Tag shapes with component types (button, input, label, etc.)
- 📱 **Device Presets** - Support for mobile, tablet, desktop, and other device sizes
- 📏 **Custom Dimensions** - Support for custom canvas size input
- 🌐 **Multi-language Support** - Switch between Chinese/English interface
- 🤖 **AI-friendly** - Clean data format for easy AI understanding and processing
- 💻 **Cross-platform** - Windows desktop application, lightweight and fast

## Tech Stack

- **Tauri v2** - Rust-powered desktop application framework
- **React 19** - User interface
- **TypeScript** - Type safety
- **Excalidraw** - Core canvas component

## Quick Start

### Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (required for Tauri)
- Windows 10/11

### Install Dependencies

```bash
cd uidp-editor
npm install
```

### Development Mode

```bash
npm run tauri dev
```

### Build Release Version

```bash
npm run tauri build
```

After building:
- Executable: `src-tauri/target/release/uidp-editor.exe`
- Installer: `src-tauri/target/release/bundle/`

## Usage Guide

### 1. Select Device Preset

Choose target device preset in the top toolbar:
- **Mobile**: 375×667 (iPhone SE/8)
- **Tablet**: 768×1024 (iPad Portrait)
- **Desktop HD**: 1280×720
- **Desktop FHD**: 1920×1080
- **Custom**: Manually input width and height

### 2. Draw Sketch

Use Excalidraw tools to draw interfaces:

| Shortcut | Tool | Purpose |
|----------|------|---------|
| R | Rectangle | Buttons, input boxes, cards |
| O | Circle/Ellipse | Avatars, icons, radio buttons |
| L | Line | Dividers, decorative lines |
| T | Text | Labels, titles, descriptions |
| F | Frame | **Artboard** - Define screen boundaries |
| V | Select | Select and edit elements |

### 3. Tag Component Semantics

1. Select a shape
2. Choose type from the "Component Type" dropdown in the top toolbar:
   - `button` - Button
   - `input` - Input field
   - `select` - Dropdown select
   - `checkbox` - Checkbox
   - `radio` - Radio button
   - `textarea` - Multi-line text
   - `switch` - Toggle switch
   - `label` - Label/Description text
   - `image` - Image placeholder
   - `container` - Container/Card

### 4. Export Data

- **Export File**: Click "Export .uidp file" to save locally
- **Copy to Clipboard**: Click "Copy to Clipboard" to copy content directly

### 5. Switch Language

Click the 🌐 button in the toolbar to switch between Chinese/English interface.

## UIDP File Format (v5.3)

`.uidp` is a minimalist UI geometric data format:

```uidp
# ═══════════════════════════════════════════════════════════
# UIDP PROTOCOL v5.3 - UI Geometric Data Format
# ═══════════════════════════════════════════════════════════
#
# [Important Notes]
# - All shape coordinates are relative offsets from the artboard top-left corner (relative coordinates)
# - Rendering requires proportional scaling to convert relative coordinates to actual pixel positions
#
# [Rendering Formula]
#   scale = min(actual window width / artboard width, actual window height / artboard height)
#   actualX = element relative X * scale
#   actualY = element relative Y * scale
# ═══════════════════════════════════════════════════════════

META:canvas=2560x1440 | unit=px | preset=desktop-hd | presetSize=1280x720

#0 | T:artboard | R:0,0,1280,720 | Z:0 | PRESET:desktop-hd
#1 | T:rect | R:80,90,200,50 | Z:1 | C:input
#2 | T:rect | R:80,160,200,50 | Z:1 | C:button
#3 | T:text | R:60,40,300,40 | Z:2 | TXT:Username | C:label
```

### Format Description

- **META**: Canvas info, device preset, and reference dimensions
- **#0**: Artboard (screen boundary reference)
- **#N**: Shapes (type, position, layer, component semantics)
- **T**: Type (rect/circle/line/text/artboard)
- **R**: Rectangle area (x,y,width,height)
- **Z**: Layer (higher numbers are on top)
- **TXT**: Text content (text type only)
- **C**: Component semantics (optional)

## Project Structure

```
uidp/
├── uidp-editor/          # Main application directory
│   ├── src/              # React frontend code
│   │   ├── App.tsx       # Main application component
│   │   ├── App.css       # Styles
│   │   ├── i18n.ts       # Internationalization config
│   │   └── main.tsx      # Entry file
│   ├── src-tauri/        # Tauri/Rust backend code
│   │   ├── src/          # Rust source code
│   │   └── tauri.conf.json  # Tauri configuration
│   ├── package.json      # Project configuration
│   └── ...
├── docs/
│   └── product.md        # Product design document
├── test.uidp             # Sample file
└── README.md             # This file (Chinese)
└── README_EN.md          # English version
```

## Shortcuts

| Shortcut | Function |
|----------|----------|
| R | Rectangle tool |
| O | Circle/Ellipse tool |
| L | Line tool |
| T | Text tool |
| F | Frame tool (Artboard) |
| V | Select tool |
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| Ctrl + C/V | Copy/Paste |
| Delete | Delete selected element |
| Space + Drag | Pan canvas |
| Ctrl + +/- | Zoom canvas |

## Artboard Notes

- Use **Frame tool (F key)** to create artboards
- The largest Frame area is automatically recognized as the artboard
- Artboard defines screen boundaries, all element coordinates are relative to artboard top-left corner
- Artboard layer is fixed at Z:0, always at the bottom

## Best Practices

1. **Create artboard first**: Press F key to create Frame as artboard
2. **Draw within artboard**: All elements should be placed inside the artboard
3. **Use rectangles for components**: Buttons, input fields, cards, etc. use rectangles
4. **Add text labels**: Use text tool to add labels and descriptions
5. **Tag component semantics**: Add semantic tags to key components to help AI understand
6. **Set correct preset**: Check if device preset matches target platform before exporting
7. **Use custom dimensions**: Use custom size input when presets don't meet requirements

## License

MIT
