# 文章统计信息功能 - 实现文档

## 📋 功能概述

为博客文章添加详细的统计信息显示，包括：
- ✅ **字数统计** - 文章总字数
- ✅ **阅读时间** - 预计阅读时间（分钟）
- ✅ **文章总数** - 博客发布的总文章数

## 🔧 实现细节

### 1. 模板修改 (`themes/poison/layouts/partials/post/info.html`)

在原有的日期显示下方新增统计信息区域：

```html
<!-- 新增: 文章统计信息 -->
<div class="post-stats">
    <span class="stat-item">
        <span class="stat-label">字数:</span>
        <span class="stat-value">{{ .WordCount }}</span>
    </span>
    <span class="stat-separator">·</span>
    <span class="stat-item">
        <span class="stat-label">阅读:</span>
        <span class="stat-value">{{ .ReadingTime }} 分钟</span>
    </span>
    <span class="stat-separator">·</span>
    <span class="stat-item">
        <span class="stat-label">第</span>
        <span class="stat-value">{{ len (where .Site.RegularPages "Type" "posts") }}</span>
        <span class="stat-label">篇</span>
    </span>
</div>
```

**Hugo 模板变量说明：**

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `{{ .WordCount }}` | 文章字数 | 2500 |
| `{{ .ReadingTime }}` | Hugo 自动计算的阅读时间 | 8 |
| `len (where .Site.RegularPages "Type" "posts")` | 博客总文章数 | 42 |

### 2. CSS 样式 (`assets/css/custom.css`)

新增样式类：

```css
/* 文章统计信息容器 */
.post-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 0.8rem 1rem;
    
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    
    font-size: 0.9em;
    color: var(--list-color);
}

/* 单个统计项 */
.post-stats .stat-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

/* 标签文字 */
.post-stats .stat-label {
    color: var(--list-color);
    opacity: 0.8;
}

/* 统计数值 */
.post-stats .stat-value {
    color: var(--text-color);
    font-weight: 600;
}

/* 分隔符 */
.post-stats .stat-separator {
    color: var(--list-color);
    opacity: 0.5;
}
```

**暗色主题支持：**
```css
body.dark-theme .post-stats {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
}
```

### 3. 响应式设计

移动端会自动缩小字体和间距，保持美观的显示效果。

## 📊 显示效果

在文章页面，统计信息会显示为：

```
字数: 2500 · 阅读: 8 分钟 · 第 42 篇
```

## 🎯 计算说明

### 字数计算 (`WordCount`)
- 由 Hugo 自动计算
- 基于文章的纯文本内容
- 不包含 Markdown 语法符号

### 阅读时间计算 (`ReadingTime`)
- 由 Hugo 自动计算
- 默认假设每分钟 220 个字
- 结果向上取整到最近的整数分钟

**可在 hugo.toml 中配置：**
```toml
[params]
    wordsPerMinute = 220  # 每分钟字数
```

### 文章总数计算
- 统计所有类型为 `posts` 的常规页面
- 实时动态计算，新文章发布后自动更新
- 不包含草稿 (`draft: true`) 和未来文章

## ✨ 特点

- ✅ **零依赖** - 不需要额外的 JavaScript 或插件
- ✅ **自动计算** - 无需手动维护数据
- ✅ **实时更新** - 每次重新构建时自动更新
- ✅ **响应式** - 在所有设备上都能正常显示
- ✅ **主题适配** - 支持浅色和暗色主题
- ✅ **无侵入** - 不修改现有逻辑，完全增量式功能

## 🔄 更新周期

- 本地开发：修改文章内容后自动重新计算
- 生产环境：每次部署时计算所有统计值
- 无缓存问题：Hugo 每次都重新生成

## 📝 文件变更

| 文件 | 变更 | 说明 |
| --- | --- | --- |
| `themes/poison/layouts/partials/post/info.html` | 新增 | 添加 `.post-stats` 区域 |
| `assets/css/custom.css` | 新增 | 添加统计信息样式 |

## 🚀 使用建议

1. **字数提示** - 帮助读者快速判断是否有时间阅读
2. **内容规划** - 用于分析文章长度分布和阅读时间分布
3. **SEO** - 字数统计有助于 SEO 优化
4. **用户体验** - 让读者了解博客的内容产量

## 🎨 自定义建议

如需修改样式，可调整以下 CSS 变量：

```css
/* 改变字体大小 */
.post-stats {
    font-size: 0.85em;  /* 改为 0.85em 更小 */
}

/* 改变颜色 */
.post-stats .stat-value {
    color: var(--link-color);  /* 改为链接色 */
}

/* 改变背景 */
.post-stats {
    background: rgba(100, 200, 255, 0.1);  /* 自定义背景色 */
}
```

## ✅ 测试步骤

1. 访问任何文章页面
2. 在日期下方应该看到统计信息
3. 查看字数、阅读时间、文章总数是否正确
4. 切换浅色/暗色主题，验证样式
5. 在移动设备查看响应式效果
