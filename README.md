# UIDP Editor

一个基于 Excalidraw 的界面草图编辑器，用于生成 UIDP (User Interface Data Packet) 格式的几何数据文件，辅助 AI 进行界面开发。

## 功能特性

- 🎨 **手绘风格画布** - 基于 Excalidraw 的直观绘图体验
- 📐 **几何数据导出** - 将草图导出为结构化的 `.uidp` 格式
- 🤖 **AI 友好** - 简洁的数据格式，便于 AI 理解和处理
- 💻 **跨平台** - Windows 桌面应用，轻量快速

## 技术栈

- **Tauri v2** - Rust 驱动的桌面应用框架
- **React 19** - 用户界面
- **TypeScript** - 类型安全
- **Excalidraw** - 核心画布组件

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (Tauri 需要)
- Windows 10/11

### 安装依赖

```bash
cd uidp-editor
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布版本

```bash
npm run tauri build
```

构建完成后，可执行文件位于 `src-tauri/target/release/uidp-editor.exe`

## UIDP 文件格式

`.uidp` 是一种极简的界面几何数据格式：

```uidp
# UIDP PROTOCOL v5.0 - 界面几何数据格式
# 字段说明：
#   ID  - 唯一标识符
#   T   - 类型: rect=矩形 circle=圆形 line=线条 text=文本
#   R   - 矩形区域: x,y,width,height (像素值)
#   Z   - 层级: 数字越大越在上层
#   TXT - 文本内容 (仅 text 类型)

ID:s1 | T:rect | R:100,200,120,40 | Z:1
ID:s2 | T:circle | R:300,220,20,20 | Z:1
ID:s3 | T:text | R:80,100,200,30 | Z:2 | TXT:Title
```

## 项目结构

```
uidp/
├── uidp-editor/          # 主应用目录
│   ├── src/              # React 前端代码
│   ├── src-tauri/        # Tauri/Rust 后端代码
│   ├── package.json      # 项目配置
│   └── ...
├── test.uidp             # 示例文件
└── README.md             # 本文件
```

## 许可证

MIT
