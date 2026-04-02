---
title: "FreeTube - 私密安全的 YouTube 客户端完全指南"
date: 2026-02-06T14:30:00+08:00
lastmod: 2026-04-02T16:57:07+08:00
draft: false
tags: ["youtube", "privacy", "open-source", "cross-platform"]
categories: ["tools"]
author: "百里"
comment: false
toc: true
reward: true
---

## 简介

在数字时代，隐私保护变得越来越重要。大多数人每天都在使用 YouTube，但很少有人意识到 YouTube 在跟踪我们的观看习惯。**FreeTube** 是一个开源的 YouTube 客户端，让你能够在桌面上私密地观看 YouTube，而不用担心被跟踪。

官网地址：[https://freetubeapp.io/](https://freetubeapp.io/)

B站视频介绍：<https://www.bilibili.com/video/BV1m19WB7EVb/>

## 什么是 FreeTube？

FreeTube 是一款面向 Windows、macOS 和 Linux 的开源 YouTube 客户端，专注于隐私保护。它的核心理念是：**用户可以享受自己喜欢的内容和创作者，但不会被追踪习惯**。

### 核心特点

- **完全私密**：你的观看习惯不会被 YouTube 或 FreeTube 追踪
- **本地存储**：所有数据（订阅、播放列表、历史记录）都存储在本地，不会上网
- **开源免费**：遵循 AGPLv3 开源协议，代码完全透明
- **无广告体验**：彻底告别视频广告
- **跨平台支持**：Windows、macOS、Linux 全覆盖
- **易于迁移**：支持从 YouTube 导入订阅，快速建立你的订阅列表
- **熟悉的界面**：设计风格接近 YouTube，易于上手

## FreeTube vs YouTube 的优势

| 特性 | YouTube | FreeTube |
|------|---------|----------|
| 隐私保护 | ❌ 追踪用户行为 | ✅ 完全私密 |
| 广告 | ❌ 需要看广告 | ✅ 无广告 |
| 本地数据 | ❌ 云端存储 | ✅ 本地存储 |
| 开源 | ❌ 闭源 | ✅ 开源代码 |
| 成本 | 💰 需要付费会员 | ✅ 完全免费 |
| 跨平台 | ✅ 网页版 | ✅ 桌面应用 |

## 系统要求

### Windows
- Windows 10 及更高版本
- 支持 x64 和 ARM64 架构

### macOS
- macOS 12 及更高版本
- 支持 Intel 和 Apple Silicon（ARM64）

### Linux
- Ubuntu / Debian
- Fedora / RedHat
- Arch Linux
- 其他 Linux 发行版（AppImage、Flatpak、Snap）

## 安装指南

### Windows 安装

国内下载：<https://freemt.lanzouq.com/ivly93m8i4vc>

Windows 用户有多种安装方式可选：

#### 方法 1：使用安装程序（推荐）
1. 访问 [FreeTube 官网](https://freetubeapp.io/)
2. 下载 `.exe` 安装程序（选择 x64 或 arm64 版本）
3. 双击执行安装
4. 按照向导完成安装

#### 方法 2：便携版
- 下载 `.exe Portable` 版本
- 直接运行，无需安装
- 可放在 U 盘或任何位置使用

#### 方法 3：压缩包
- 下载 `.zip` 或 `.7z` 文件
- 解压后直接运行

### macOS 安装

```bash
# 方法 1：使用 DMG 文件
# 下载 .dmg 文件，双击安装

# 方法 2：使用 Homebrew（如果支持）
brew install freetube
```

### Linux 安装

#### Ubuntu / Debian

```bash
# 方法 1：使用 deb 包
wget https://github.com/FreeTubeApp/FreeTube/releases/download/v0.24.0-beta/freetube_0.24.0_beta_amd64.deb
sudo dpkg -i freetube_0.24.0_beta_amd64.deb

# 方法 2：使用 Flathub
flatpak install flathub io.freetubeapp.FreeTube
flatpak run io.freetubeapp.FreeTube
```

#### Fedora / RedHat

```bash
# 使用 RPM 包
wget https://github.com/FreeTubeApp/FreeTube/releases/download/v0.24.0-beta/freetube-0.24.0-beta.amd64.rpm
sudo dnf install freetube-0.24.0-beta.amd64.rpm
```

#### Arch Linux

```bash
# 使用 AUR
yay -S freetube

# 或者使用 Pacman 包
sudo pacman -U freetube-0.24.0-beta-amd64.pacman
```

#### AppImage

```bash
# 下载 AppImage 文件
wget https://github.com/FreeTubeApp/FreeTube/releases/download/v0.24.0-beta/freetube-0.24.0-beta-amd64.AppImage

# 添加执行权限
chmod +x freetube-0.24.0-beta-amd64.AppImage

# 运行
./freetube-0.24.0-beta-amd64.AppImage
```

## 快速开始

### 1. 导入 YouTube 订阅

这是让 FreeTube 快速可用的最简单方式：

**步骤：**
1. 打开 FreeTube
2. 进入菜单 → **设置** → **导入/导出**
3. 选择 **从 YouTube 导入订阅**
4. 登录你的 Google 账户（只用于一次性授权）
5. 授权后，所有订阅会导入到 FreeTube

**注意**：导入完成后，你的数据全部存储在本地，Google 不会再进行任何追踪。

### 2. 订阅频道

#### 方法 1：通过 URL 订阅
1. 复制 YouTube 频道 URL
2. 在 FreeTube 中粘贴或搜索频道名称
3. 点击**订阅**

#### 方法 2：直接搜索
1. 在 FreeTube 搜索框输入频道名称
2. 找到目标频道
3. 点击频道并选择**订阅**

### 3. 浏览和观看

- **订阅列表**：左侧导航栏显示所有订阅频道
- **推荐视频**：主页展示订阅频道的最新视频
- **网格/列表切换**：可切换不同的浏览视图
- **观看历史**：仅在本地保存，支持继续播放

### 4. 创建播放列表

1. 右键单击视频
2. 选择 **添加到播放列表**
3. 创建新播放列表或添加到现有列表

## 主要功能详解

### 1. 订阅管理

FreeTube 允许你：
- ✅ **无需账户订阅**：不需要 Google 账户
- ✅ **管理订阅**：添加、删除、分组管理
- ✅ **导入导出**：与 YouTube 数据互操作
- ✅ **频道通知**：获取订阅频道的更新通知

### 2. 本地数据存储

所有用户数据都保存在本地计算机：
- **位置**（不同系统）：
  - Windows: `C:\Users\<用户名>\AppData\Local\FreeTube`
  - macOS: `~/Library/Application Support/FreeTube`
  - Linux: `~/.config/FreeTube`

**优势**：
- 数据完全自主
- 不依赖云服务
- 可随时备份
- 多设备独立使用

### 3. 播放功能

支持多种播放选项：
- **自适应清晰度**：根据网速自动调整
- **手动选择分辨率**：从 144p 到 4K
- **播放速度调整**：0.25x 到 2.0x
- **字幕支持**：自动生成和手动上传的字幕
- **剧院模式**：全屏或扩展播放界面

### 4. 搜索和发现

- **全文搜索**：搜索标题、频道名
- **频道内搜索**：在具体频道内搜索视频
- **热门视频**：查看当前热门内容
- **趋势**：了解时下流行

### 5. 隐私设置

完全掌控你的隐私：
- **启用 Invidious API**（可选）：使用第三方 API 而非 YouTube 官方 API
- **代理设置**：可配置网络代理
- **数据清空**：随时清空所有本地数据

### 6. 外观和语言

- **深色/浅色模式**：保护眼睛
- **自定义主题**：多种配色方案
- **多语言支持**：已翻译为 30+ 种语言

## 进阶使用技巧

### 1. 数据备份和恢复

#### 备份数据
```bash
# Linux/macOS
cp -r ~/.config/FreeTube ~/freetube-backup

# 或使用 FreeTube 内置功能
# 设置 → 导入/导出 → 导出订阅为 JSON
```

#### 恢复数据
1. 打开 FreeTube
2. 进入 **设置** → **导入/导出**
3. 选择备份文件导入

### 2. 跨设备同步

**方案 1：手动导出导入**
1. 在设备 A 导出订阅 JSON 文件
2. 通过云盘或 U 盘转移文件
3. 在设备 B 导入数据

**方案 2：同步文件夹**（高级用户）
```bash
# 使用 Syncthing 或 Nextcloud 同步配置文件夹
# 不同系统配置文件夹位置见前面说明
```

### 3. 使用 Invidious API

Invidious 是 YouTube 的开源前端，可以增加隐私：

1. 打开设置
2. 找到 **API 设置**
3. 启用 Invidious
4. 选择公共 Invidious 实例或自建实例

### 4. 创建快捷键

一些常用快捷键：
- **Space** / **K**：播放/暂停
- **J**：后退 10 秒
- **L**：前进 10 秒
- **F**：全屏
- **M**：静音
- **< / >**：调整播放速度
- **数字 0-9**：快速跳转到相应百分比

### 5. 频道订阅管理

按频道分类：
1. 订阅频道后右键点击
2. 选择 **编辑频道分类**
3. 添加或创建频道分组

## 常见问题解答

### Q1: FreeTube 真的完全私密吗？

**A**: 是的。除非你启用 Invidious API 并选择特定实例，否则 FreeTube 通过本地数据抓取与 YouTube 通信，不会被追踪。即使启用 API，也只是连接到第三方服务器而非 YouTube。

### Q2: 可以在书签栏分享我的播放列表吗？

**A**: 不能直接分享。但你可以：
- 导出为 JSON 文件共享
- 将播放列表 URL 分享（需要对方也用 FreeTube）
- 告诉朋友具体视频和频道名称

### Q3: FreeTube 支持 4K 和 HDR 吗？

**A**: 支持 4K（取决于 YouTube 提供的清晰度），但取决于：
- 你的网络速度
- 视频是否提供 4K
- 显示器支持

### Q4: 在多个设备上使用 FreeTube 需要付费吗？

**A**: 完全免费。你可以在无数设备上安装使用。

### Q5: FreeTube 会从 YouTube 上消失吗？

**A**: 这取决于 YouTube 的政策。但由于 FreeTube 是开源的，即使官方站点消失，社区也会维护它。

### Q6: 我可以离线观看视频吗？

**A**: 官方版本不支持离线下载。但你可以通过其他工具配合使用（如 youtube-dl）来下载视频。

## 对比其他隐私工具

| 工具 | 开源 | 跨平台 | 本地存储 | 无广告 | 易用性 |
|------|------|--------|---------|--------|--------|
| **FreeTube** | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Invidious | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| NewPipe | ✅ | ❌ (仅 Android) | ✅ | ✅ | ⭐⭐⭐⭐ |
| YouTube Premium | ❌ | ✅ | 部分 | ✅ | ⭐⭐⭐⭐⭐ |

## 隐私和安全考虑

### FreeTube 的安全保障

1. **开源代码**：任何人都可以审计代码
2. **无广告追踪**：不包含任何追踪 JavaScript
3. **本地处理**：数据在本地加密存储
4. **定期更新**：社区维护，及时修复安全问题

### 增强隐私的建议

1. **使用 VPN**：进一步隐藏你的 IP 地址
2. **禁用 DNS 跟踪**：使用 DNS over HTTPS
3. **定期清空历史**：设置→清除浏览数据
4. **使用独立账户导入**：不要使用日常使用的 Google 账户

## 贡献和支持

### 如何贡献

FreeTube 欢迎社区贡献：

1. **提交 Issue**：报告 Bug 或建议功能
   - GitHub: [https://github.com/FreeTubeApp/FreeTube/issues](https://github.com/FreeTubeApp/FreeTube/issues)

2. **翻译**：帮助翻译为更多语言
   - Weblate: [https://hosted.weblate.org/engage/free-tube/](https://hosted.weblate.org/engage/free-tube/)

3. **代码贡献**：提交 Pull Request
   - 需要同意贡献协议

### 支持项目

如果你喜欢 FreeTube，可以通过以下方式支持项目：

- **捐赠比特币**：`1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS`
- **在 GitHub 上 Star**：表示你的支持
- **分享和推荐**：向朋友介绍
- **参与讨论**：在社区活跃，帮助新用户

### 联系方式

- 📧 **邮件**：[freetubeapp@protonmail.com](mailto:freetubeapp@protonmail.com)
- 💬 **Matrix Chat**：[#freetube:matrix.org](https://matrix.to/#/#freetube:matrix.org)
- 🦣 **Mastodon**：[@FreeTube@fosstodon.org](https://fosstodon.org/@FreeTube)

## 总结

FreeTube 是一个优秀的隐私保护工具，适合所有关注隐私的用户。它的优势包括：

✅ **完全免费且开源**  
✅ **无广告、完全私密**  
✅ **跨平台支持**  
✅ **易于使用和迁移**  
✅ **活跃的社区支持**  

如果你厌倦了被 YouTube 追踪，想要一个更私密的观看体验，**FreeTube 值得一试**。

---

**相关资源**：
- [官方网站](https://freetubeapp.io/)
- [GitHub 项目](https://github.com/FreeTubeApp/FreeTube)
- [官方文档](https://docs.freetubeapp.io/)
- [变更日志](https://github.com/FreeTubeApp/FreeTube/releases)

**最后更新**：2026 年 4 月
