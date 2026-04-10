---
title: "告别插件！VS Code 原生实现 Ctrl+V 粘贴图片并自定义存储路径"
date: 2026-04-10T15:08:33+08:00
lastmod: 2026-04-10T15:08:33+08:00
draft: false
tags: ["vscode"]
categories: ["vscode"]
author: "百里"
comment: false
toc: true
reward: true
---

## 告别插件！VS Code 原生实现 Ctrl+V 粘贴图片并自定义存储路径

VS Code 从 1.79 版本开始，已经内置了强大的文件粘贴功能。这意味着我们不再需要安装繁琐的插件，就能直接在 Markdown 文件中 `Ctrl+V` 粘贴图片，VS Code 会自动将剪贴板中的图片保存为文件并生成链接。

但默认情况下，图片可能会保存在当前文件夹下，导致项目结构混乱。本文将教你如何通过简单的设置，将粘贴的图片统一存储到你想要的位置，例如项目的根目录或专门的资源文件夹。

### 核心配置项

要实现自定义存储路径，我们需要修改 VS Code 的设置项：`Markdown > Copy Files: Destination`。

这个设置项接受一个 JSON 对象，由“匹配模式（Key）”和“目标路径（Value）”组成。

#### 关键变量解释

在配置路径时，VS Code 提供了一系列变量来帮助我们动态生成路径。以下是几个最常用的变量及其含义：

| 变量名 | 含义 | 示例（假设文件在 `docs/guide.md`） |
| :--- | :--- | :--- |
| **`${documentWorkspaceFolder}`** | **当前项目的根目录** | `D:/MyProject` |
| `${documentDirName}` | 当前 Markdown 文件所在的绝对目录 | `D:/MyProject/docs` |
| `${documentBaseName}` | 当前 Markdown 文件的文件名（不含后缀） | `guide` |
| `${fileName}` | 粘贴的图片原始文件名 | `image.png` |
| `${fileExtName}` | 粘贴的图片扩展名 | `png` |
| `${documentRelativeDirName}` | 当前文件相对于项目根目录的路径 | `docs` |

### 如何设置图片存储到项目根目录

如果你希望无论 Markdown 文件位于项目的哪个子文件夹中，粘贴的图片都统一保存到项目的最顶层（根目录），请按照以下步骤操作：

1. **打开设置**
   按下快捷键 `Ctrl + ,` 打开 VS Code 设置，搜索 `markdown.copy`。

2. **编辑配置**
   找到 `Markdown > Copy Files: Destination`，点击“编辑在 settings.json”或在图形界面中点击“添加项”。

3. **填入规则**

   在弹出的输入框中：

   - **Item (Key)**: 填入 `**/*.md`
     - 这表示该规则适用于项目中所有的 Markdown 文件。
   - **Value (值)**: 填入 `${documentWorkspaceFolder}/`
     - 这表示将图片保存到项目根目录。

**推荐配置：** 为了保持根目录整洁，通常建议在根目录下创建一个专门的文件夹（如 `assets` 或 `images`）。

```json
"markdown.copyFiles.destination": {
    "**/*.md": "${documentWorkspaceFolder}/assets/"
}
```

### 其他实用配置方案

除了存到根目录，根据不同的项目需求，你还可以尝试以下几种配置：

**方案 A：存放到与 Markdown 文件同级的 `images` 文件夹**

如果你希望图片紧跟在 Markdown 文件旁边，方便移动文件时图片不丢失。

- **Value**: `"./images/"`
- **效果**：编辑 `docs/guide.md` 时，图片会保存到 `docs/images/` 目录下。

**方案 B：存放到以文件名命名的专属文件夹**

这是一种非常优雅的管理方式，每个 Markdown 文件都有自己独立的图片文件夹。

- **Value**: `"./${documentBaseName}_assets/"`
- **效果**：编辑 `guide.md` 时，图片会自动保存到 `./guide_assets/` 文件夹中。

**方案 C：统一存放到项目根目录的 `static` 文件夹**

适合 Hexo、Hugo 等静态博客框架的用户。

- **Value**: `"${documentWorkspaceFolder}/static/images/"`
- **效果**：所有图片都会集中存放在项目根目录的 `static/images` 下。

### 总结

通过简单的配置，VS Code 的原生功能完全可以替代第三方插件。使用 `${documentWorkspaceFolder}` 变量，你可以轻松实现将图片统一归档到项目根目录，让项目结构更加清晰有序。快去试试吧！