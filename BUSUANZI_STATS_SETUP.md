# 不蒜子（Busuanzi）统计功能 - 实现文档

## 📊 功能概述

为博客添加不蒜子（Busuanzi）访问统计功能，实现：
- ✅ **文章访问量** - 每篇文章的独立访问统计（PV）
- ✅ **全站访问量** - 博客总访问量（PV）
- ✅ **全站访客数** - 博客独立访客数（UV）

## 🔧 实现细节

### 1. 加载不蒜子脚本 (`layouts/partials/head/scripts.html`)

```html
{{/* 不蒜子（Busuanzi）访问统计 */}}
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

**说明：**
- 使用 `async` 异步加载，不阻塞页面渲染
- 使用官方 CDN: `busuanzi.ibruce.info`
- 版本: 2.3 (pure.mini 精简版)

### 2. 文章页面访问量 (`themes/poison/layouts/partials/post/info.html`)

在文章统计信息区域添加访问量显示：

```html
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
    <span class="stat-item busuanzi-item">
        <span class="stat-label">访问:</span>
        <span class="stat-value" id="busuanzi_value_page_pv">-</span>
    </span>
</div>
```

**关键 ID：**
- `busuanzi_value_page_pv` - 文章页面浏览量（Page View）

### 3. 侧边栏全站统计 (`layouts/partials/sidebar/stats.html`)

创建新的 partial 显示全站统计：

```html
<div class="site-stats">
    <div class="stats-title">📊 站点统计</div>
    <div class="stats-content">
        <div class="stats-row">
            <span class="stats-label">访问量:</span>
            <span class="stats-value" id="busuanzi_value_site_pv">-</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">访客数:</span>
            <span class="stats-value" id="busuanzi_value_site_uv">-</span>
        </div>
    </div>
</div>
```

**关键 ID：**
- `busuanzi_value_site_pv` - 全站访问量（Site Page View）
- `busuanzi_value_site_uv` - 全站独立访客数（Site Unique Visitor）

### 4. 侧边栏集成 (`themes/poison/layouts/partials/sidebar/sidebar.html`)

在侧边栏中添加统计模块：

```html
<aside class="sidebar">
    <div class="container sidebar-sticky">
        {{ partial "light_dark.html" . }}
        {{ partial "sidebar/title.html" . }}
        {{ partial "sidebar/menu.html" . }}
        {{ partial "sidebar/socials.html" . }}
        {{ partial "sidebar/stats.html" . }}      ← 新增
        {{ partial "sidebar/copyright.html" . }}
    </div>
</aside>
```

### 5. CSS 样式 (`assets/css/custom.css`)

#### 文章访问量样式
```css
/* 不蒜子统计项加载动画 */
.busuanzi-item .stat-value {
    min-width: 2.5rem;
    display: inline-block;
}

.busuanzi-item .stat-value:empty::after {
    content: "加载中...";
    font-size: 0.85em;
    opacity: 0.6;
}
```

#### 侧边栏统计样式
```css
.site-stats {
    margin: 1.5rem 0;
    padding: 1rem;
    
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.site-stats:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
```

## 📊 不蒜子统计说明

### 统计类型

| 统计类型 | ID | 说明 |
| --- | --- | --- |
| **页面浏览量（PV）** | `busuanzi_value_page_pv` | 单个页面的访问次数 |
| **站点浏览量（PV）** | `busuanzi_value_site_pv` | 全站所有页面的访问次数总和 |
| **站点访客数（UV）** | `busuanzi_value_site_uv` | 全站独立访客数（基于 IP） |

### 工作原理

1. **自动统计** - 页面加载时自动向不蒜子服务器发送请求
2. **异步加载** - 不影响页面加载速度
3. **实时更新** - 访问数据实时更新
4. **跨域识别** - 基于域名区分不同网站
5. **本地缓存** - 浏览器缓存减少请求次数

### 统计规则

- **PV（Page View）** - 每次页面加载计数 +1
- **UV（Unique Visitor）** - 基于 IP 地址，同一 IP 24 小时内只计数一次
- **跨页面** - 同一站点不同页面共享 UV 计数
- **跨设备** - 不同设备（不同 IP）分别计数

## 📍 显示位置

### 文章页面
```
标题
September 22, 2025
字数: 235 · 阅读: 2 分钟 · 访问: 1234    ← 文章访问量
标签: mysql | binlog | 数据恢复
```

### 侧边栏
```
┌─────────────────────┐
│  📊 站点统计         │
│                     │
│  访问量:    12,345  │
│  访客数:     3,456  │
└─────────────────────┘
```

## ✨ 特点

- ✅ **零配置** - 无需注册账号或申请 API Key
- ✅ **免费服务** - 完全免费使用
- ✅ **轻量级** - 脚本体积小，加载快
- ✅ **实时统计** - 访问数据实时更新
- ✅ **跨平台** - 支持所有静态网站
- ✅ **隐私友好** - 不收集用户隐私信息
- ✅ **美观设计** - 毛玻璃风格，支持暗色主题
- ✅ **响应式** - 移动端完美显示

## 🎨 自定义建议

### 修改文字
```html
<!-- 修改标签文字 -->
<span class="stat-label">浏览:</span>  <!-- 改为"浏览" -->
```

### 修改样式
```css
/* 修改统计值颜色 */
.site-stats .stats-value {
    color: #ff6b6b;  /* 改为红色 */
}

/* 修改背景 */
.site-stats {
    background: rgba(100, 200, 255, 0.1);
}
```

### 隐藏特定统计
```css
/* 隐藏文章访问量 */
.busuanzi-item {
    display: none;
}

/* 隐藏侧边栏统计 */
.site-stats {
    display: none;
}
```

## 🔧 故障排查

### 统计显示为 "-" 或不更新

**可能原因：**
1. 脚本未加载完成
2. 网络问题无法连接到不蒜子服务器
3. 浏览器拦截了第三方脚本

**解决方案：**
1. 检查浏览器控制台是否有错误
2. 确认脚本 URL 可访问：`http://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js`
3. 检查浏览器是否启用了广告拦截插件
4. 使用 HTTPS 可能需要改为 `https://busuanzi.ibruce.info`

### 本地开发访问量异常

**原因：** 本地开发时（localhost），不蒜子可能无法正确统计

**解决方案：** 部署到生产环境后查看，或使用 ngrok 等工具映射公网域名测试

## 📝 文件变更清单

| 文件 | 变更类型 | 说明 |
| --- | --- | --- |
| `layouts/partials/head/scripts.html` | 新增 | 添加不蒜子脚本 |
| `themes/poison/layouts/partials/post/info.html` | 修改 | 添加文章访问量显示 |
| `layouts/partials/sidebar/stats.html` | 新建 | 创建全站统计模块 |
| `themes/poison/layouts/partials/sidebar/sidebar.html` | 修改 | 集成统计模块 |
| `assets/css/custom.css` | 新增 | 添加统计样式 |

## 🚀 上线检查清单

- [x] 不蒜子脚本已加载
- [x] 文章页面显示访问量
- [x] 侧边栏显示全站统计
- [x] 样式在浅色/暗色主题下正常
- [x] 移动端显示正常
- [ ] 部署到生产环境
- [ ] 验证统计数据正常更新

## 📚 参考资料

- [不蒜子官网](http://busuanzi.ibruce.info/)
- [不蒜子文档](https://busuanzi.ibruce.info/)
