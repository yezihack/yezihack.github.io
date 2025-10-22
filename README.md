# 空树之空博客

基于Hugo静态站点生成器的个人技术博客，使用Poison主题。

## 📚 文档目录

- [POISON_THEME_ANALYSIS.md](POISON_THEME_ANALYSIS.md) - Poison主题深度分析报告
- [OPTIMIZATION_REPORT.md](OPTIMIZATION_REPORT.md) - 主题优化实施报告
- [QUICK_TEST_GUIDE.md](QUICK_TEST_GUIDE.md) - 优化效果测试指南
- [NEW_FEATURES.md](NEW_FEATURES.md) - 新增功能详细说明
- [TAG_CLOUD_UPDATE.md](TAG_CLOUD_UPDATE.md) - 标签云现代化升级文档
- [POSTS_TIMELINE_UPDATE.md](POSTS_TIMELINE_UPDATE.md) - Posts时间线展示文档
- [ARTICLE_PAGE_UPDATE.md](ARTICLE_PAGE_UPDATE.md) - 文章详情页优化文档

## 🎨 主题优化

已完成以下优化（2025-10-17）：

1. ✅ **滚动条样式统一** - 深色/浅色模式自适应
2. ✅ **移动端体验改善** - 侧边栏紧凑化，减少30%高度
3. ✅ **代码块优化** - 移动端字体调整，复制按钮优化
4. ✅ **TOC显示优化** - 从1600px降至1280px，中等屏幕可用
5. ✅ **表格响应式** - 自动横向滚动，移动端友好

详细信息请查看 [OPTIMIZATION_REPORT.md](OPTIMIZATION_REPORT.md)

## ✨ 新增功能

已完成以下新功能（2025-10-17）：

1. ✅ **分类菜单** - 侧边栏新增Categories分类导航
2. ✅ **返回顶部按钮** - 右下角浮动按钮，平滑滚动到顶部
3. ✅ **现代化标签云** - Categories/Tags页面毛玻璃效果展示
4. ✅ **Posts时间线** - 按年份分组的紧凑列表布局
5. ✅ **文章详情页** - 毛玻璃卡片布局，优化排版和动画

详细信息请查看 [NEW_FEATURES.md](NEW_FEATURES.md)、[TAG_CLOUD_UPDATE.md](TAG_CLOUD_UPDATE.md)、[POSTS_TIMELINE_UPDATE.md](POSTS_TIMELINE_UPDATE.md) 和 [ARTICLE_PAGE_UPDATE.md](ARTICLE_PAGE_UPDATE.md)

## 1. 安装主题

```sh
git submodule add https://github.com/lukeorth/poison.git themes/poison --depth 1
```

## 2. hugo.toml

```toml
baseURL = 'https://yezihack.github.io/'
languageCode = 'en-us'
title = "空树之空"
theme = "poison"
paginate = 10
pluralizelisttitles = false
# disqusShortname = 'poison'
# disqus_url = 'https://yezihack.github.io/'

[params]
    brand = "空树之空"
    brand_image = "/images/brand_image.jpg"
    # og_image = ""                             # path to social icon - front matter: image takes precedent, then og_image, then brand_url
    # publisher_icon = ""                       # path to publisher icon - defaults to favicon, used in schema
    # favicon = ""                              # path to favicon
    description = "《空樹之空》博客是一个技术导向的平台，聚焦于Kubernetes（K8s）、DevOps、GitOps、运维和Linux等领域。通过简洁而优美的文字，我们提供对这些技术主题的深入探索和实用的指南。By <a href='https://github.com/yezihack' target='_blank'>@yezihack</a>"
    dark_mode = true

    menu = [
        {Name = "About", URL = "/about/", HasChildren = false},
        {Name = "Posts", URL = "/posts/", Pre = "Recent", HasChildren = true, Limit = 5},
        {Name = "Tags", URL = "/tags/", HasChildren = false},
    ]

    github_url = "https://github.com"
    linkedin_url = "https://linkedin.com"
    twitter_url = "https://twitter.com"
    discord_url = "https://discord.com"
    youtube_url = "https://youtube.com"
    email_url = "mailto://niko2022@yeah.net"

    # Adds an RSS icon to the end of the socials which links to {{ .Site.BaseURL }}/index.xml
    rss_icon = true
    # Which section the RSS icon links to, defaults to all content. See https://gohugo.io/templates/rss/#section-rss
    rss_section = "posts"

    # sidebar
    sidebar_bg_color = "#202020"            # default is #202020
    sidebar_img_border_color = "#515151"    # default is #515151
    sidebar_p_color = "#909090"             # default is #909090
    sidebar_h1_color = "#FFF"               # default is #FFF
    sidebar_a_color = "#FFF"                # default is #FFF
    sidebar_socials_color = "#FFF"          # default is #FFF
    moon_sun_color = "#FFF"                 # default is #FFF
    moon_sun_background_color = "#515151"   # default is #515151

    # light mode
    text_color = "#222"             # default is #222
    content_bg_color = "#FAF9F6"    # default is #FAF9F6
    post_title_color = "#303030"    # default is #303030
    list_color = "#5a5a5a"          # default is #5a5a5a
    link_color = "#268bd2"          # default is #268bd2
    date_color = "#515151"          # default is #515151
    table_border_color = "#E5E5E5"  # default is #E5E5E5
    table_stripe_color = "#F9F9F9"  # default is #F9F9F9

    # dark mode
    text_color_dark = "#eee"            # default is #eee
    content_bg_color_dark = "#121212"   # default is #121212
    post_title_color_dark = "#DBE2E9"   # default is #DBE2E9
    list_color_dark = "#9d9d9d"         # default is #9d9d9d
    link_color_dark = "#268bd2"         # default is #268bd2
    date_color_dark = "#9a9a9a"         # default is #9a9a9a
    table_border_color_dark = "#515151" # default is #515151
    table_stripe_color_dark = "#202020" # default is #202020


[params.meta]
    favicon = true
[taxonomies]
    series = 'series'
    tags = 'tags'
```

## 3. hugo 常用命令

```sh
# 查看hugo版本号
hugo version 

# 生成一个页面
hugo new content posts/my-first-post.md

# 本地运行
hugo server

# 本地运行 指定为 production 环境，默认为 development 环境，该环境下部分特性不会开启
hugo serve -e production

# 生成public文件
hugo

# 本地运行 清理目标目录
# 清理目标目录，避免重复生成
hugo server --cleanDestinationDir
```
