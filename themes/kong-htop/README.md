# Kong-Htop

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Hugo](https://img.shields.io/badge/Hugo-0.101.0+-179BD7?style=flat&logo=hugo)](https://gohugo.io)

> 一个优雅现代的 Hugo 主题，采用毛玻璃设计，基于 Poison 主题深度定制。

![Kong-Htop Theme](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20251022154715.png)

## ✨ 特性

- 🎨 **现代毛玻璃设计** - glassmorphism UI 设计风格
- 🌓 **完全暗色模式支持** - 自动切换，深度适配
- 📱 **响应式设计** - 完美支持桌面、平板、手机
- 🏷️ **标签云** - 现代化标签和分类页面
- 📝 **文章时间线** - 按年份分组的紧凑列表
- 🔍 **搜索功能** - 全文本地搜索（JSON-based）
- 📚 **目录导航** - 自动生成文章目录侧栏
- 🎯 **系列文章** - 支持文章系列管理
- 🔢 **文章统计** - 阅读次数、访问量等
- ⚡ **高性能** - GPU 加速动画，优化的 CSS 选择器
- 📖 **KaTeX 支持** - 数学公式渲染
- 💬 **代码块增强** - 一键复制、行号显示

## 🚀 快速开始

### 安装主题

#### 方式 1: 作为 Git 子模块（推荐）

```bash
git clone https://github.com/your-blog/my-blog.git
cd my-blog
git submodule add https://github.com/yezihack/kong-htop.git themes/kong-htop
```

#### 方式 2: 直接克隆

```bash
git clone https://github.com/your-blog/my-blog.git
cd my-blog
git clone https://github.com/yezihack/kong-htop.git themes/kong-htop
```

#### 方式 3: 下载压缩包

从 [Releases](https://github.com/yezihack/kong-htop/releases) 下载最新版本，解压到 `themes/kong-htop` 目录。

### 配置 Hugo

更新您的 `hugo.toml` 文件：

```toml
theme = "kong-htop"
```

### 快速配置

复制示例配置：

```bash
cp themes/kong-htop/exampleSite/hugo.toml ./
```

然后根据您的需求修改配置文件。

## 📋 配置说明

### 基础配置

```toml
baseURL = 'https://your-site.com/'
languageCode = 'zh-cn'
title = "Your Blog Title"
theme = "kong-htop"
paginate = 10

[Author]
name = "Your Name"
```

### 站点参数

```toml
[params]
    # 品牌设置
    title = "Your Blog Title"
    brand = "Brand Name"
    brand_image = "/images/logo.png"
    og_image = "/images/og-image.png"
    favicon = "/images/favicon.png"
    
    # 站点描述
    description = "Your site description"
    
    # 深色模式
    dark_mode = true
    
    # 主要内容分类
    mainSections = ["posts"]
    
    # 菜单配置
    menu = [
        {Name = "About", URL = "/about/", HasChildren = false},
        {Name = "Posts", URL = "/posts/", Pre = "Recent", HasChildren = true, Limit = 5},
        {Name = "Categories", URL = "/categories/", HasChildren = false},
        {Name = "Tags", URL = "/tags/", HasChildren = false},
    ]
    
    # RSS 配置
    rss_icon = true
    rss_section = "posts"
```

### 颜色自定义

#### 侧边栏颜色

```toml
[params]
    sidebar_bg_color = "#202020"           # 背景色
    sidebar_img_border_color = "#515151"   # 头像边框色
    sidebar_p_color = "#909090"            # 描述文本色
    sidebar_h1_color = "#FFF"              # 标题色
    sidebar_a_color = "#FFF"               # 链接色
    sidebar_socials_color = "#FFF"         # 社交图标色
    moon_sun_color = "#FFF"                # 深浅切换按钮颜色
    moon_sun_background_color = "#515151"  # 深浅切换按钮背景
```

#### 浅色模式

```toml
[params]
    text_color = "#222"             # 文字色
    content_bg_color = "#FAF9F6"    # 内容背景
    post_title_color = "#303030"    # 标题色
    list_color = "#5a5a5a"          # 列表色
    link_color = "#268bd2"          # 链接色
    date_color = "#515151"          # 日期色
    table_border_color = "#E5E5E5"  # 表格边框
    table_stripe_color = "#F9F9F9"  # 表格条纹
```

#### 深色模式

```toml
[params]
    text_color_dark = "#eee"            # 文字色
    content_bg_color_dark = "#121212"   # 内容背景
    post_title_color_dark = "#DBE2E9"   # 标题色
    list_color_dark = "#9d9d9d"         # 列表色
    link_color_dark = "#268bd2"         # 链接色
    date_color_dark = "#9a9a9a"         # 日期色
    table_border_color_dark = "#515151" # 表格边框
    table_stripe_color_dark = "#202020" # 表格条纹
```

### 分类配置

```toml
[taxonomies]
    series = 'series'
    tags = 'tags'
    categories = 'categories'

[outputs]
    home = ["HTML", "RSS", "JSON"]
```

## 📁 目录结构

```
kong-htop/
├── layouts/                    # 主题模板
│   ├── _default/              # 默认模板
│   │   ├── baseof.html        # 基础模板
│   │   ├── list.html          # 列表页模板
│   │   ├── single.html        # 单页面模板
│   │   └── index.json         # JSON 输出
│   ├── posts/                 # 文章相关
│   │   └── list.html          # 文章列表页
│   ├── categories/            # 分类相关
│   │   ├── list.html          # 分类列表
│   │   └── terms.html         # 分类标签云
│   ├── tags/                  # 标签相关
│   │   ├── list.html          # 标签列表
│   │   └── terms.html         # 标签云
│   ├── search/                # 搜索页面
│   │   └── list.html          # 搜索结果
│   └── partials/              # 可复用组件
│       ├── head/              # 头部组件
│       ├── post/              # 文章组件
│       └── sidebar/           # 侧边栏组件
├── assets/                    # 静态资源
│   ├── css/                   # 样式表
│   │   ├── poison.css         # 主样式
│   │   ├── custom.css         # 自定义样式（2800+ 行优化）
│   │   └── lib/               # 第三方库
│   └── js/                    # JavaScript
│       ├── light_dark.js      # 深浅模式切换
│       ├── search.js          # 搜索功能
│       ├── back_to_top.js     # 返回顶部
│       └── lib/               # 第三方库
├── static/                    # 静态文件
│   ├── fonts/                 # 字体文件
│   ├── icons/                 # 图标资源
│   └── katex/                 # KaTeX 数学库
├── archetypes/                # 内容模板
│   └── default.md             # 默认文章模板
├── exampleSite/               # 示例网站
│   ├── hugo.toml              # 配置示例
│   ├── content/               # 示例内容
│   └── static/                # 示例静态文件
├── theme.toml                 # 主题配置
├── LICENSE                    # 许可证
└── README.md                  # 本文档
```

## 🎨 设计特色

### 毛玻璃效果（Glassmorphism）

主题采用现代的毛玻璃设计元素：

```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.15);
```

### 流畅动画

所有交互都有精心设计的动画：

- 平滑的 CSS 过渡
- GPU 加速的 transform 动画
- 悬停效果和按压反馈

### 响应式设计

三个响应式断点：

- **手机端** (< 768px): 单列布局
- **平板端** (768px - 1024px): 灵活布局
- **桌面端** (> 1024px): 完整效果

## 🔧 高级用法

### 自定义样式

在您的网站项目中创建 `assets/css/custom.css` 覆盖主题样式：

```css
/* 自定义链接颜色 */
.content a {
    color: #your-color;
}
```

### 自定义模板

在您的项目中创建相同路径的模板文件来覆盖主题模板：

```
content/
├── layouts/
│   └── posts/
│       └── single.html        # 覆盖文章详情页模板
```

### 文章元数据

完整的前置元数据示例：

```markdown
---
title: "文章标题"
date: 2024-01-15
description: "文章描述"
tags: ["标签1", "标签2"]
categories: ["分类1"]
series: ["系列名称"]
image: "cover-image.jpg"
---
```

## 📖 CSS 结构

### custom.css 包含的功能模块

1. **滚动条样式** (≈150 行)
   - Firefox 和 Webkit 兼容
   - 深色/浅色模式自适应

2. **移动端优化** (≈500 行)
   - 响应式断点
   - 触摸友好
   - 紧凑布局

3. **代码块美化** (≈150 行)
   - 一键复制功能
   - 行号显示
   - 水平滚动提示

4. **表格响应式** (≈100 行)
   - 移动端适配
   - 可滚动表格

5. **标签云** (≈300 行)
   - 毛玻璃效果
   - 动态字体大小
   - 悬停动画

6. **文章列表** (≈350 行)
   - 按年份分组
   - 紧凑布局
   - 日期徽章

7. **文章详情页** (≈500 行)
   - 现代卡片布局
   - 毛玻璃效果
   - 优化排版

8. **侧边栏** (≈300 行)
   - 毛玻璃背景
   - 菜单动画
   - 社交图标

9. **搜索页面** (≈400 行)
   - 搜索框样式
   - 结果展示
   - 高亮匹配

总计：**2800+ 行**优化 CSS

## 🌓 深色模式

主题提供完整的深色模式支持：

- ✅ 自动检测系统主题偏好
- ✅ 手动切换按钮在侧边栏
- ✅ 所有组件完美适配
- ✅ 平滑的过渡动画

## 🚀 性能优化

- **CSS** 优化的选择器，避免重排和重绘
- **GPU 加速** 使用 transform 和 opacity 属性
- **代码分割** 按需加载 KaTeX 等库
- **图片优化** 自动应用懒加载
- **缓存策略** 利用浏览器缓存

## 📱 兼容性

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 12+
- ✅ Android Chrome

## 🤝 贡献

欢迎提交问题和拉取请求！

## 📄 许可证

本主题采用 GPL-3.0 许可证，基于 [Poison](https://github.com/lukeorth/poison) 主题。

关于原始 Poison 主题，请参考：
- 原作者：Luke Orth
- 原始设计灵感：[Hyde](https://github.com/mdo/hyde)

## 🙏 致谢

感谢：
- [Poison](https://github.com/lukeorth/poison) 主题的优秀基础
- Hugo 社区的支持
- 所有贡献者和使用者

## 📞 支持

遇到问题？

1. 查看 [示例网站](exampleSite/)
2. 提交 [GitHub Issues](https://github.com/yezihack/kong-htop/issues)
3. 检查 [Hugo 文档](https://gohugo.io/)

---

**制作者**: Yezihack  
**开源时间**: 2025  
**版本**: 1.0.0
