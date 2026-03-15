# UIDP Editor

**用草图与 AI 协作开发界面**

UIDP Editor 是一个可视化草图工具，让你通过简单的拖拽绘制界面布局，生成 AI 易于理解的结构化数据，让 AI 帮你实现代码。

**[中文](README.md) | [English](README_EN.md)**

---

## 解决了什么问题？

### 传统方式的痛点

| 方式 | 问题 |
|------|------|
| 📝 文字描述 | 容易歧义，反复沟通 |
| 🎨 设计稿转代码 | 需要手动测量、标注 |
| 🔄 反复修改 | 每次调整都要重新说明 |
| 🤖 AI 理解困难 | 自然语言描述界面结构效率低 |
| 💰 **设计文件太大** | Figma/Sketch 文件动辄几 MB，浪费大量 Token |

### UIDP 的解决方案

```
你的草图 → .uidp 文件（几 KB） → AI 理解 → 代码实现
```

- ✅ **可视化绘制** - 拖拽即可，无需写代码
- ✅ **精确传达** - 几何数据无歧义
- ✅ **一次绘制** - 导出数据直接给 AI
- ✅ **AI 友好** - 结构化格式，AI 轻松解析
- 💰 **极致省 Token** - 纯文本格式，比设计图少 **99%+** 的 Token 消耗

### 为什么比传设计图更省 Token？

| 方式 | 文件大小 | 单次请求 Token | 适合场景 |
|------|----------|----------------|----------|
| Figma/Sketch 截图 | 500KB ~ 2MB | ~15万 Token | 高精度视觉还原 |
| PNG/JPG 原型图 | 100KB ~ 500KB | ~3万 Token | 简单原型 |
| **UIDP 数据文件** | **1KB ~ 5KB** | **~500 Token** | **快速开发** |

> 💡 一个登录界面：Figma 截图约 200KB，UIDP 仅 0.5KB，**节省 400 倍 Token**

---

## 快速开始

### 1. 下载安装

从 [Releases](../../releases) 下载 Windows 安装包，或自行构建：

```bash
cd uidp-editor
npm install
npm run tauri build
```

### 2. 绘制你的第一个界面

**步骤 1：创建画板**
- 按 `F` 键或选择 Frame 工具
- 拖拽创建一个矩形作为屏幕边界

**步骤 2：绘制元素**
- `R` - 矩形（按钮、输入框）
- `O` - 圆形（头像、图标）
- `T` - 文本（标签、标题）
- `L` - 线条（分隔线）

**步骤 3：标记组件（可选）**
- 选中形状
- 在顶部工具栏选择组件类型（button、input、label 等）

**步骤 4：导出给 AI**
- 点击「导出 .uidp 文件」或「复制到剪贴板」

### 3. 让 AI 实现代码

将 `.uidp` 文件内容发送给 AI，它会根据几何数据和组件语义生成界面代码。

---

## 使用示例

### 示例：登录界面

**绘制草图：**
```
┌─────────────────────────┐
│      登录界面            │
│                         │
│    ┌───────────────┐    │
│    │   用户名       │    │
│    └───────────────┘    │
│                         │
│    ┌───────────────┐    │
│    │   密码         │    │
│    └───────────────┘    │
│                         │
│    ┌───────────────┐    │
│    │     登录       │    │  ← 标记为 button
│    └───────────────┘    │
│                         │
└─────────────────────────┘
```

**导出数据：**
```uidp
META:canvas=800x600 | unit=px | preset=custom | presetSize=400x500

#0 | T:artboard | R:0,0,400,500 | Z:0 | PRESET:custom
#1 | T:text | R:150,30,100,30 | Z:2 | TXT:登录界面 | C:label
#2 | T:rect | R:50,80,300,40 | Z:1 | C:input
#3 | T:text | R:60,90,80,20 | Z:2 | TXT:用户名 | C:label
#4 | T:rect | R:50,140,300,40 | Z:1 | C:input
#5 | T:text | R:60,150,80,20 | Z:2 | TXT:密码 | C:label
#6 | T:rect | R:50,220,300,45 | Z:1 | C:button
#7 | T:text | R:180,235,40,20 | Z:2 | TXT:登录 | C:label
```

**AI 生成代码**（以 React 为例）：
```jsx
export default function LoginPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-[400px] p-8 border rounded-lg">
        <h1 className="text-center text-xl mb-6">登录界面</h1>
        <div className="mb-4">
          <label className="block mb-1">用户名</label>
          <input className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">密码</label>
          <input type="password" className="w-full px-3 py-2 border rounded" />
        </div>
        <button className="w-full py-2 bg-blue-500 text-white rounded">
          登录
        </button>
      </div>
    </div>
  );
}
```

---

## 核心概念

### 画板（Artboard）

画板定义屏幕边界，所有元素坐标都是相对于画板左上角的偏移量。

- 使用 **Frame 工具（F键）** 创建
- 面积最大的 Frame 自动识别为画板
- 支持设备预设：移动端、平板、桌面

### 组件语义标记

为形状添加语义标记，帮助 AI 理解用途：

| 标记 | 含义 | 用途 |
|------|------|------|
| `button` | 按钮 | 可点击操作 |
| `input` | 输入框 | 单行文本输入 |
| `select` | 下拉选择 | 选项选择 |
| `checkbox` | 复选框 | 多选 |
| `radio` | 单选框 | 单选 |
| `textarea` | 多行文本 | 长文本输入 |
| `switch` | 开关 | 切换状态 |
| `label` | 标签 | 说明文字 |
| `image` | 图片 | 图片占位 |
| `container` | 容器 | 布局容器 |

### 坐标系统

- 相对坐标：元素位置相对于画板左上角
- 等比缩放：渲染时按比例缩放到实际窗口大小

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `R` | 矩形工具 |
| `O` | 圆形/椭圆工具 |
| `L` | 线条工具 |
| `T` | 文本工具 |
| `F` | Frame 工具（画板） |
| `V` | 选择工具 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` | 重做 |
| `Delete` | 删除选中元素 |
| `Space + 拖拽` | 平移画布 |
| `Ctrl + +/-` | 缩放画布 |

---

## UIDP 文件格式

`.uidp` 是一种极简的界面几何数据格式：

```uidp
META:canvas=2560x1440 | unit=px | preset=desktop-hd | presetSize=1280x720

#0 | T:artboard | R:0,0,1280,720 | Z:0 | PRESET:desktop-hd
#1 | T:rect | R:80,90,200,50 | Z:1 | C:input
#2 | T:rect | R:80,160,200,50 | Z:1 | C:button
#3 | T:text | R:60,40,300,40 | Z:2 | TXT:用户名 | C:label
```

**格式说明：**
- `META` - 画布信息和设备预设
- `#0` - 画板（屏幕边界参考）
- `#N` - 形状（类型、位置、层级、语义）
- `T` - 类型（rect/circle/line/text/artboard）
- `R` - 矩形区域（x,y,width,height）
- `Z` - 层级（数字越大越在上层）
- `TXT` - 文本内容
- `C` - 组件语义（可选）

---

## 最佳实践

1. **先创建画板** - 按 F 键创建 Frame 作为屏幕边界
2. **在画板内绘制** - 所有元素放在画板内部
3. **使用矩形表示组件** - 按钮、输入框用矩形
4. **添加文本标签** - 用文本工具添加说明
5. **标记关键组件** - 为按钮、输入框等添加语义标记
6. **选择合适的预设** - 根据目标设备选择移动端/平板/桌面

---

## 技术栈

- **Tauri v2** - 轻量级桌面应用框架
- **React 19** - 用户界面
- **Excalidraw** - 核心画布组件

---

## 许可证

MIT
