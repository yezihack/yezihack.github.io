---
title: "Rocky Linux 完全指南：从入门到实践"
date: 2025-12-22T10:30:17+08:00
lastmod: 2025-12-22T10:30:17+08:00
draft: false
tags: ["linux", "rocky", "centos7", "centos8"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 目录

1. [什么是 Rocky Linux](#什么是-rocky-linux)
2. [Rocky Linux 与 CentOS 的关系](#rocky-linux-与-centos-的关系)
3. [版本选择指南](#版本选择指南)
4. [镜像类型详解](#镜像类型详解)
5. [安装教程](#安装教程)
6. [初始配置与使用](#初始配置与使用)
7. [实用场景](#实用场景)
8. [总结与建议](#总结与建议)

---

## 2. 什么是 Rocky Linux

Rocky Linux 是一个企业级 Linux 发行版，由 CentOS 原创始人 Gregory Kurtzer 于 2020 年创建。它的诞生源于 Red Hat 宣布停止传统 CentOS 开发并转向 CentOS Stream 的决定。

### 2.1. 核心特点

**完全开源免费**

- 100% 开源，无商业限制
- 社区驱动，不受单一公司控制
- 可用于生产环境，无需付费

**企业级稳定性**

- 与 Red Hat Enterprise Linux (RHEL) 完全二进制兼容
- 为 RHEL 编译的软件可直接在 Rocky Linux 上运行
- 长期支持周期（10+ 年）

**生产就绪**

- 经过严格测试和验证
- 适合关键业务应用
- 广泛的企业级应用支持

### 2.2. 应用场景

Rocky Linux 适用于：

- 企业服务器部署
- 数据中心基础设施
- 云计算平台
- 容器化环境
- 开发测试环境
- 学习和教育用途

---

## 3. Rocky Linux 与 CentOS 的关系

### 3.1. 历史演变

**传统 CentOS 时代（2004-2020）**

- CentOS 作为 RHEL 的下游（downstream）重建版本
- 免费提供与 RHEL 完全兼容的企业级 Linux
- 成为中小企业和开发者的首选

**转折点（2020 年底）**

- Red Hat 宣布停止传统 CentOS 开发
- CentOS 8 支持提前至 2021 年底结束
- CentOS Stream 成为唯一官方版本

**Rocky Linux 的诞生（2021）**

- 填补传统 CentOS 留下的空白
- 继承 CentOS 的使命和精神
- 成为 RHEL 的新免费替代品

### 3.2. 三者对比

| 特性 | RHEL | Rocky Linux | CentOS Stream |
|------|------|-------------|---------------|
| **定位** | 商业产品 | RHEL 下游重建 | RHEL 上游测试 |
| **发布时机** | 正式发布 | RHEL 发布后 | RHEL 发布前 |
| **稳定性** | 生产就绪 | 生产就绪 | 持续测试 |
| **更新频率** | 定期维护 | 跟随 RHEL | 滚动更新 |
| **费用** | 需要订阅 | 完全免费 | 完全免费 |
| **支持周期** | 10+ 年 | 10+ 年 | 较短 |
| **适用场景** | 企业生产 | 企业生产 | 开发测试 |
| **二进制兼容** | 标准 | 完全兼容 | 预览版本 |

### 3.3. 为什么选择 Rocky Linux

**相比传统 CentOS**

- 继承了 CentOS 的所有优点
- 社区更加独立和开放
- 得到原 CentOS 创始人的支持
- 有明确的长期发展路线

**相比 CentOS Stream**

- 提供稳定的生产版本，而非滚动测试版
- 更新更加可预测和可控
- 更适合关键业务系统
- 减少意外变更的风险

**相比 RHEL**

- 完全免费，无需订阅
- 功能完全相同
- 社区支持充足
- 适合预算有限的场景

---

## 4. 版本选择指南

Rocky Linux 目前提供三个主要版本，每个版本都有其适用场景。

### 4.1. Rocky Linux 8

**基本信息**

- 基于 RHEL 8.x
- 当前版本：8.10
- 支持至：2029 年 5 月
- 内核版本：4.18.x

**技术特性**

- Python 3.6/3.8/3.9
- PHP 7.2/7.3/7.4/8.0
- Node.js 10/12/14/16
- Podman 容器引擎
- 传统系统管理工具

**适用场景**

```
✅ 推荐使用：
- 需要兼容旧版 CentOS 8 的应用
- 现有 CentOS 8 系统迁移
- 对稳定性要求极高的环境
- 有特定软件版本依赖（如旧版 Python、PHP）

⚠️ 不推荐：
- 新项目（建议直接用 Rocky 9）
- 需要最新软件版本
```

### 4.2. Rocky Linux 9 ⭐ 推荐

**基本信息**

- 基于 RHEL 9.x
- 当前版本：9.5
- 支持至：2032 年 5 月
- 内核版本：5.14.x

**技术特性**

- Python 3.9/3.11/3.12
- PHP 8.0/8.1/8.2
- Node.js 16/18/20
- 改进的安全特性
- 更好的容器支持
- 性能优化

**适用场景**

```
✅ 强烈推荐：
- 所有新项目和新部署
- 生产环境标准选择
- 云原生应用
- 容器化部署
- 微服务架构
- 长期稳定运行的服务器

优势：
- 最佳的稳定性和支持周期平衡
- 成熟的生态系统
- 活跃的社区支持
- 充足的文档和资源
```

### 4.3. Rocky Linux 10

**基本信息**

- 基于 RHEL 10.x
- 当前版本：10.1（2025 年发布）
- 预计支持至：2035 年
- 内核版本：6.x

**技术特性**

- 最新的软件栈
- 增强的安全功能
- 改进的硬件支持
- 最新的容器和云技术
- AI/ML 工具链升级

**适用场景**

```
✅ 适合尝鲜：
- 试验最新技术
- 非关键业务系统
- 开发测试环境
- 技术预研项目

⚠️ 暂缓使用：
- 生产环境（建议等 6-12 个月后更稳定）
- 关键业务系统
- 需要大量第三方软件支持的场景
```

### 4.4. 版本选择决策树

```
开始
  │
  ├─ 是新项目吗？
  │   ├─ 是 → Rocky Linux 9 ✓
  │   └─ 否 → 需要兼容旧系统吗？
  │          ├─ 是 → Rocky Linux 8
  │          └─ 否 → Rocky Linux 9 ✓
  │
  ├─ 对新技术有需求吗？
  │   ├─ 是 → 生产环境吗？
  │   │      ├─ 是 → Rocky Linux 9（稳妥）
  │   │      └─ 否 → Rocky Linux 10（尝鲜）
  │   └─ 否 → Rocky Linux 9 ✓
  │
  └─ 默认选择 → Rocky Linux 9 ✓
```

### 4.5. 综合建议

**最佳实践**

- 90% 的场景选择 Rocky Linux 9
- 仅在有明确理由时选择 8 或 10
- 生产环境避免使用刚发布的版本
- 规划升级路径（8→9→10）

---

## 5. 镜像类型详解

Rocky Linux 提供多种镜像类型，适应不同的使用场景。选择正确的镜像可以节省时间和带宽。

参考官网提供的下载：<https://rockylinux.org/zh-CN/download>

### 5.1. 一、服务器安装镜像(rocky 9)

#### 5.1.1. DVD ISO（完整镜像）

**特点**

- 体积：约 10GB
- 包含完整的软件包仓库
- 无需网络即可完成安装
- 可选择各种软件组合

**适用场景**

```bash
✅ 推荐使用：
- 无网络或网络较慢的环境
- 企业内网批量部署
- 实验室环境
- 需要离线安装多个软件包

示例场景：
- 数据中心新机房部署
- 内网服务器搭建
- 教学实验室环境
```

**下载命令**

```bash
# 使用 wget 下载
wget -c https://download.rockylinux.org/pub/rocky/9/isos/x86_64/Rocky-9.7-x86_64-dvd.iso

# 使用 curl 下载
curl -O https://download.rockylinux.org/pub/rocky/9/isos/x86_64/Rocky-9.7-x86_64-dvd.iso
```

#### 5.1.2. Boot ISO（网络安装镜像）

**特点**

- 体积：约 700MB-1GB
- 仅包含引导和安装程序
- 安装时从网络下载软件包
- 始终获取最新版本

**适用场景**

```bash
✅ 推荐使用：
- 网络状况良好的环境
- 需要最新软件包
- 快速下载安装介质
- 带宽充足的数据中心

⚠️ 注意事项：
- 安装过程需要稳定网络
- 总下载量可能更大（取决于选择的软件）
- 安装时间较长
```

#### 5.1.3. Minimal ISO（最小化镜像）

**特点**

- 体积：约 2-3GB
- 包含基本系统所需的最少软件包
- 无需联网即可完成基础安装
- 系统占用空间小

**适用场景**

```bash
✅ 强烈推荐（服务器最佳选择）：
- 生产服务器环境
- 容器宿主机
- 云服务器部署
- 安全敏感环境
- 资源受限的系统

优势：
- 减少攻击面（安全性更好）
- 系统更精简
- 启动更快
- 易于管理和维护

安装后可按需添加软件：
sudo dnf install httpd mariadb-server php
```

#### 5.1.4. 镜像选择快速决策

```
服务器部署场景
  │
  ├─ 网络环境如何？
  │   ├─ 快速稳定 → Boot ISO（最小下载）
  │   ├─ 较慢/不稳定 → DVD ISO 或 Minimal ISO
  │   └─ 无网络 → DVD ISO
  │
  ├─ 用途是什么？
  │   ├─ 生产服务器 → Minimal ISO ✓✓✓
  │   ├─ 开发测试 → DVD ISO（工具齐全）
  │   └─ 学习使用 → DVD ISO（包含图形界面选项）
  │
  └─ 默认推荐 → Minimal ISO（90% 场景适用）
```

### 5.2. 二、桌面 Live 镜像

如果你需要图形桌面环境，Rocky Linux 提供三种 Live 镜像：

#### 5.2.1. Live Image (GNOME) - 完整版

**特点**

- 体积：约 2-3GB
- GNOME 桌面环境（官方默认）
- 现代化界面设计
- 功能完整，开箱即用
- 内存占用：约 1.5GB

**适用场景**

```bash
✅ 推荐使用：
- Linux 初学者
- 需要完整桌面体验
- 日常办公使用
- 多媒体处理
- 图形设计工作

特点：
- 类似 macOS 的界面风格
- 顶部栏 + 活动视图
- 工作区管理流畅
- 预装完整办公套件
```

#### 5.2.2. Live Image (GNOME Lite) - 轻量版

**特点**

- 体积：约 1.5-2GB
- GNOME 精简版
- 移除不常用应用
- 内存占用：约 1.2GB
- 启动速度更快

**适用场景**

```bash
✅ 推荐使用（性价比最高）：
- 配置较低的电脑（2-4GB 内存）
- 虚拟机使用
- 追求流畅体验
- 不需要太多预装软件

优势：
- 占用资源少
- 运行更流畅
- 可后续按需安装软件
- 适合老旧电脑复活

性能对比：
标准版 1.5GB 内存 vs 轻量版 1.2GB 内存
节省约 20-30% 资源
```

#### 5.2.3. Live Image (KDE) - 高度定制

**特点**

- 体积：约 2.5-3.5GB
- KDE Plasma 桌面环境
- 类似 Windows 的界面布局
- 高度可定制化
- 内存占用：约 1.3GB

**适用场景**

```bash
✅ 推荐使用：
- 从 Windows 迁移的用户
- 喜欢自定义界面
- 需要华丽视觉效果
- 配置较好的电脑

特点：
- 底部任务栏（类似 Windows）
- 开始菜单式启动器
- 丰富的主题和插件
- 窗口管理功能强大
- 多屏幕支持优秀

界面布局：
┌────────────────────────────┐
│  应用程序  文件  编辑  查看  │ ← 菜单栏
├────────────────────────────┤
│                            │
│      工作区域              │
│                            │
├────────────────────────────┤
│ [开始] [应用] [系统托盘]   │ ← 任务栏
└────────────────────────────┘
```

#### 5.2.4. 桌面环境对比表

| 特性 | GNOME | GNOME Lite | KDE |
|------|-------|------------|-----|
| **内存占用** | ~1.5GB | ~1.2GB | ~1.3GB |
| **磁盘空间** | ~15GB | ~10GB | ~18GB |
| **启动速度** | 中等 | 快 | 中等 |
| **定制性** | 中等 | 中等 | 很高 |
| **易用性** | 简单 | 简单 | 中等 |
| **适合新手** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **适合 Windows 用户** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

#### 5.2.5. Live 镜像的多种用途

```bash
1. 试用系统
   - 从 USB 启动
   - 无需安装即可体验
   - 不影响现有系统

2. 安装到硬盘
   - 试用满意后一键安装
   - 保留个性化设置
   - 图形化安装向导

3. 系统急救
   - 当系统无法启动时
   - 可以挂载硬盘修复
   - 备份重要数据

4. 便携系统
   - 在 USB 上运行完整系统
   - 随身携带工作环境
   - 在任何电脑上使用
```

### 5.3. 三、云平台镜像

#### 5.3.1. 通用云镜像（QCOW2）

**特点**

- 格式：QCOW2（QEMU/KVM 虚拟磁盘）
- 体积：约 500MB-1GB
- 预配置云环境
- 支持 cloud-init 自动化

**适用场景**

```bash
✅ 推荐使用：
- OpenStack 云平台
- KVM/QEMU 虚拟化
- libvirt 管理的虚拟机
- 私有云部署

使用示例：
# 下载镜像
wget -c https://dl.rockylinux.org/pub/rocky/9/images/x86_64/Rocky-9-GenericCloud-Base.latest.x86_64.qcow2


# 创建虚拟机
virt-install \
  --name rocky9-vm \
  --memory 2048 \
  --vcpus 2 \
  --disk path=Rocky-9-GenericCloud-Base.latest.x86_64.qcow2 \
  --import \
  --os-variant rocky9
```

#### 5.3.2. 公有云平台镜像

**AWS AMI**

```bash
适用：Amazon Web Services
特点：
- EC2 优化版本
- 预配置 AWS 工具
- 区域特定 AMI ID
- 支持各种实例类型

使用方法：
1. 登录 AWS Console
2. 进入 EC2 服务
3. 选择 "Launch Instance"
4. 搜索 "Rocky Linux"
5. 选择对应版本和区域
```

**阿里云**

```bash
适用：阿里云 ECS
特点：
- 针对阿里云优化
- 预装 aliyun-cli
- 国内网络优化
- 镜像市场提供

使用方法：
1. 登录阿里云控制台
2. 进入 ECS 实例创建页面
3. 镜像类型选择 "镜像市场"
4. 搜索 "Rocky Linux"
5. 选择官方镜像
```

**Azure**

```bash
适用：Microsoft Azure
特点：
- Azure 平台优化
- 支持各种 VM 大小
- 预配置 waagent
- Marketplace 提供

使用方法：
1. 登录 Azure Portal
2. 创建虚拟机
3. 选择 "Marketplace"
4. 搜索 "Rocky Linux"
5. 选择对应版本
```

### 5.4. 四、容器镜像（Docker/OCI）

#### 5.4.1. 完整镜像（Full Image）

**特点**

- 体积：约 500MB-1GB
- 包含完整的包管理器和工具
- 适合复杂应用
- 更多的系统工具

**适用场景**

```dockerfile
✅ 推荐使用：
- 复杂的应用部署
- 需要多种开发工具
- 调试和开发环境
- 传统应用容器化

使用示例：
FROM rockylinux:9

RUN dnf install -y \
    httpd \
    php \
    php-mysqlnd \
    mariadb-server \
    && dnf clean all

COPY app/ /var/www/html/
EXPOSE 80
CMD ["httpd", "-DFOREGROUND"]
```

#### 5.4.2. 最小化镜像（Minimal Image）

**特点**

- 体积：约 100-200MB
- 仅包含核心组件
- 极致精简
- 安全性更高

**适用场景**

```dockerfile
✅ 强烈推荐（生产环境最佳）：
- 微服务架构
- 云原生应用
- 追求镜像体积
- 安全敏感场景

使用示例：
FROM rockylinux:9-minimal

# 仅安装必要的包
RUN microdnf install -y \
    nginx \
    && microdnf clean all

COPY nginx.conf /etc/nginx/
COPY app/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

优势：
- 镜像构建速度快 50%+
- 体积减少 60-70%
- 漏洞扫描问题更少
- 拉取速度更快
```

#### 5.4.3. 容器镜像对比

```bash
场景对比：

开发环境：
rockylinux:9 (完整版)
- 体积大但工具齐全
- 方便调试和开发
- 可以临时安装各种工具

生产环境：
rockylinux:9-minimal (最小化)
- 体积小，拉取快
- 攻击面小，更安全
- 符合容器最佳实践
- 减少漏洞风险

构建时间对比：
完整版：~5 分钟
最小化：~2 分钟

镜像大小对比：
完整版：850MB
最小化：180MB
节省：~70%
```

### 5.5. 五、WSL 镜像

**特点**

- Windows Subsystem for Linux 专用
- 体积：约 300-500MB
- 深度集成 Windows
- 无需虚拟机

**适用场景**

```powershell
✅ 推荐使用：
- Windows 开发者
- 需要 Linux 工具链
- 跨平台开发
- 学习 Linux

优势：
- 启动速度极快（秒级）
- 资源占用低
- 文件系统互通
- 网络直接共享
- VS Code 完美集成

使用示例：
# 安装
wsl --import RockyLinux C:\WSL\Rocky rocky-wsl.tar.gz

# 启动
wsl -d RockyLinux

# 在 Windows 访问 Linux 文件
\\wsl$\RockyLinux

# 在 Linux 访问 Windows 文件
cd /mnt/c/Users/YourName
```

### 5.6. 镜像选择总结

```
快速决策指南：

物理机/虚拟机服务器
└→ Minimal ISO (90% 场景)

桌面使用
├→ 新手：GNOME
├→ 老电脑：GNOME Lite
└→ Windows 用户：KDE

云平台
├→ OpenStack/KVM：QCOW2
├→ AWS：AMI
├→ 阿里云：ECS 镜像
└→ Azure：Marketplace 镜像

容器部署
├→ 开发：rockylinux:9
└→ 生产：rockylinux:9-minimal

Windows 开发
└→ WSL 镜像

默认推荐：
- 服务器：Minimal ISO
- 桌面：GNOME Lite
- 容器：Minimal Image
- Windows：WSL
```

---

## 6. 安装教程

### 6.1. 一、服务器安装（Minimal ISO）

这是最常见的安装方式，适用于 90% 的服务器场景。

#### 6.1.1. 准备工作

**1. 下载镜像**

```bash
# 从官方网站下载
wget https://download.rockylinux.org/pub/rocky/9/isos/x86_64/Rocky-9.5-x86_64-minimal.iso

# 验证校验和（推荐）
sha256sum Rocky-9.5-x86_64-minimal.iso
# 与官网 CHECKSUM 文件对比
```

**2. 制作启动盘**

**Linux/macOS 系统：**

```bash
# 查看 USB 设备
lsblk
# 或
diskutil list  # macOS

# 写入镜像（假设 USB 是 /dev/sdb）
sudo dd if=Rocky-9.5-x86_64-minimal.iso of=/dev/sdb bs=4M status=progress
sudo sync
```

**Windows 系统：**

```
推荐工具：
1. Rufus (推荐)
   - 下载：https://rufus.ie
   - 选择 ISO 镜像
   - 选择 USB 设备
   - 点击开始

2. Etcher
   - 下载：https://www.balena.io/etcher
   - 跨平台支持
   - 界面简单直观
```

#### 6.1.2. 安装步骤

**1. 启动安装程序**

```
1. 插入 USB 启动盘
2. 重启电脑
3. 进入 BIOS/UEFI (通常按 F2/F12/DEL)
4. 设置从 USB 启动
5. 选择 "Install Rocky Linux 9"
```

**2. 语言和键盘设置**

```
- 选择语言：中文（简体）或 English
- 键盘布局：根据实际情况选择
- 时区：Asia/Shanghai（或 Asia/Taipei）
```

**3. 安装目标**

```
磁盘分区方案（推荐）：

服务器标准分区：
/boot      - 1GB   (XFS)
/boot/efi  - 512MB (FAT32, UEFI 系统)
swap       - 8GB   (根据内存大小)
/          - 剩余空间 (XFS)

或使用 LVM（推荐）：
/boot      - 1GB
/boot/efi  - 512MB
PV (物理卷) - 剩余空间
  └─ VG (卷组)
      ├─ LV swap  - 8GB
      ├─ LV root  - 50GB  (/)
      └─ LV data  - 剩余  (/data)

优势：
- 灵活调整分区大小
- 支持快照和备份
- 易于扩展存储
```

**4. 网络配置**

```
点击网络和主机名：
1. 打开以太网开关
2. 配置静态 IP（生产环境推荐）
   - IP 地址：192.168.1.100
   - 子网掩码：255.255.255.0
   - 网关：192.168.1.1
   - DNS：8.8.8.8, 114.114.114.114
3. 设置主机名：rocky-server-01
```

**5. 软件选择**

```
最小化安装：
- 基本环境：Minimal Install
- 附加软件：
  ☑ Standard（推荐，包含基本工具）
  ☐ Guest Agents（虚拟机需要）
  ☐ Development Tools（开发需要）
```

**6. 用户设置**

```
Root 密码：
- 设置强密码
- 生产环境建议禁用 root 远程登录

创建用户：
- 用户名：admin
- ☑ 使此用户成为管理员
- 设置密码
```

**7. 开始安装**

```
点击"开始安装"
等待 5-15 分钟
完成后重启系统
```

### 6.2. 二、桌面安装（GNOME Live）

适合需要图形界面的用户。

#### 6.2.1. 安装步骤

**1. 启动 Live 环境**

```
1. 从 USB 启动
2. 选择 "Start Rocky Linux"
3. 直接进入桌面环境
4. 可以先体验系统
```

**2. 开始安装**

```
1. 双击桌面上的 "Install to Hard Drive"
2. 语言选择：中文（简体）
3. 进入安装摘要界面
```

**3. 安装目标**

```
磁盘分区（桌面推荐）：
/boot      - 1GB
/boot/efi  - 512MB (UEFI)
swap       - 16GB (桌面建议更大)
/          - 80GB
/home      - 剩余空间 (存放用户数据)
```

**4. 软件选择**

```
已自动选择 GNOME 桌面
可以在附加软件中选择：
☑ GNOME 应用程序
☑ 办公套件和生产力
☑ 开发工具
```

**5. 完成安装**

```
- 等待安装完成（15-30 分钟）
- 重启系统
- 首次启动配置向导
```

### 6.3. 三、虚拟机安装（快速方法）

使用虚拟化软件如 VirtualBox、VMware、KVM。

#### 6.3.1. VirtualBox 安装示例

**1. 创建虚拟机**

```
名称：Rocky-Linux-9
类型：Linux
版本：Red Hat (64-bit)
内存：2048 MB (最小)
硬盘：20 GB (动态分配)
```

**2. 配置虚拟机**

```
设置 → 系统：
- 启用 EFI
- 处理器：2 核心

设置 → 存储：
- 控制器 IDE：加载 ISO 镜像

设置 → 网络：
- 网卡 1：桥接网卡（或 NAT）
```

**3. 启动安装**

```
启动虚拟机
按常规步骤安装
完成后移除 ISO
```

### 6.4. 四、云平台部署

#### 6.4.1. AWS EC2 部署

```bash
# 使用 AWS CLI
aws ec2 run-instances \
    --image-id ami-xxxxxxxxx \  # Rocky Linux 9 AMI ID
    --instance-type t3.micro \
    --key-name your-key \
    --security-groups rocky-sg \
    --region us-east-1

# 或在 AWS Console 中：
1. EC2 → Launch Instance
2. 搜索 "Rocky Linux"
3. 选择实例类型
4. 配置网络和安全组
5. 添加存储
6. 启动实例
```

#### 6.4.2. OpenStack/KVM 部署

```bash
# 下载云镜像
wget https://download.rockylinux.org/pub/rocky/9/images/x86_64/Rocky-9-GenericCloud-Base.latest.x86_64.qcow2

# 使用 virt-install
virt-install \
    --name rocky9-cloud \
    --memory 2048 \
    --vcpus 2 \
    --disk Rocky-9-GenericCloud-Base.latest.x86_64.qcow2 \
    --import \
    --os-variant rocky9 \
    --network bridge=virbr0 \
    --graphics none \
    --cloud-init user-data=cloud-init.yaml

# cloud-init.yaml 示例
#cloud-config
users:
  - name: admin
    groups: wheel
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E... your-key

packages:
  - vim
  - git
  - htop

runcmd:
  - dnf update -y
```

### 6.5. 五、容器部署

#### 6.5.1. Docker 使用

```bash
# 拉取最小化镜像（推荐）
docker pull rockylinux:9-minimal

# 拉取完整镜像
docker pull rockylinux:9

# 运行容器
docker run -it --name rocky9 rockylinux:9-minimal bash

# 构建自定义镜像
cat > Dockerfile <<EOF
FROM rockylinux:9-minimal

RUN microdnf install -y nginx \
    && microdnf clean all

COPY app/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

docker build -t my-rocky-app .
docker run -d -p 80:80 my-rocky-app
```

#### 6.5.2. Podman 使用（Rocky Linux 原生）

```bash
# Podman 是 Rocky Linux 推荐的容器引擎
# 无守护进程，更安全

# 拉取镜像
podman pull rockylinux:9-minimal

# 运行容器
podman run -it rockylinux:9-minimal bash

# 创建 Pod
podman pod create --name mypod -p 8080:80

# 在 Pod 中运行容器
podman run -d --pod mypod rockylinux:9-minimal
```

### 6.6. 六、WSL 安装

**1. 启用 WSL**

```powershell
# 以管理员身份运行 PowerShell
wsl --install
```

**2. 下载并导入 Rocky Linux**

```powershell
# 创建安装目录
mkdir C:\WSL\RockyLinux

# 下载 WSL 镜像
# 从官网下载 rocky-wsl.tar.gz

# 导入镜像
wsl --import RockyLinux C:\WSL\RockyLinux C:\Users\YourName\Downloads\rocky-wsl.tar.gz

# 启动
wsl -d RockyLinux
```

**3. 初始配置**

```bash
# 创建用户
useradd -m -G wheel yourusername
passwd yourusername

# 退出后在 PowerShell 设置默认用户
wsl --terminate RockyLinux
rocky config --default-user yourusername
```

---

## 7. 初始配置与使用

安装完成后，需要进行一些基础配置以确保系统安全和易用。

### 7.1. 一、系统更新

**首次更新（必须）**

```bash
# 更新所有软件包
sudo dnf update -y

# 重启系统（如果有内核更新）
sudo reboot
```

**配置自动更新**

```bash
# 安装自动更新工具
sudo dnf install -y dnf-automatic

# 配置自动更新
sudo vim /etc/dnf/automatic.conf
# 修改：
apply_updates = yes

# 启用自动更新服务
sudo systemctl enable --now dnf-automatic.timer
```

### 7.2. 二、软件源配置

**使用国内镜像（加速访问）**

```bash
# 备份原有源
sudo cp /etc/yum.repos.d/rocky.repo /etc/yum.repos.d/rocky.repo.backup

# 使用阿里云镜像（推荐）
sudo sed -e 's|^mirrorlist=|#mirrorlist=|g' \
         -e 's|^#baseurl=http://dl.rockylinux.org/$contentdir|baseurl=https://mirrors.aliyun.com/rockylinux|g' \
         -i.bak \
         /etc/yum.repos.d/rocky*.repo

# 或使用清华大学镜像
sudo sed -e 's|^mirrorlist=|#mirrorlist=|g' \
         -e 's|^#baseurl=http://dl.rockylinux.org/$contentdir|baseurl=https://mirrors.tuna.tsinghua.edu.cn/rockylinux|g' \
         -i.bak \
         /etc/yum.repos.d/rocky*.repo

# 清理并重建缓存
sudo dnf clean all
sudo dnf makecache

# 测试速度
sudo dnf repolist
```

**启用 EPEL 仓库（扩展软件）**

```bash
# EPEL 提供额外的软件包
sudo dnf install -y epel-release

# 更新缓存
sudo dnf makecache
```

### 7.3. 三、基础工具安装

**开发工具包**

```bash
# 安装编译工具链
sudo dnf groupinstall "Development Tools" -y

# 包含：gcc, make, git, etc.
```

**常用系统工具**

```bash
# 系统管理工具
sudo dnf install -y \
    vim \
    nano \
    wget \
    curl \
    htop \
    tmux \
    screen \
    tree \
    net-tools \
    bind-utils \
    telnet \
    traceroute \
    tcpdump \
    rsync \
    zip \
    unzip \
    tar
```

**网络工具**

```bash
sudo dnf install -y \
    nmap \
    netcat \
    iptables-services \
    firewalld
```

### 7.4. 四、安全配置

**1. 防火墙配置**

```bash
# 启动防火墙
sudo systemctl enable --now firewalld

# 查看状态
sudo firewall-cmd --state

# 允许 SSH
sudo firewall-cmd --permanent --add-service=ssh

# 允许 HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 允许特定端口
sudo firewall-cmd --permanent --add-port=8080/tcp

# 重载配置
sudo firewall-cmd --reload

# 查看规则
sudo firewall-cmd --list-all
```

**2. SELinux 配置**

```bash
# 查看 SELinux 状态
getenforce

# SELinux 模式：
# - Enforcing（强制）：推荐，最安全
# - Permissive（宽容）：记录违规但不阻止
# - Disabled（禁用）：不推荐

# 临时设置为宽容模式（调试用）
sudo setenforce 0

# 永久配置
sudo vim /etc/selinux/config
# SELINUX=enforcing  # 生产环境推荐

# 查看 SELinux 日志
sudo tail -f /var/log/audit/audit.log
```

**3. SSH 安全配置**

```bash
# 编辑 SSH 配置
sudo vim /etc/ssh/sshd_config

# 推荐配置：
Port 22                          # 可改为非标准端口
PermitRootLogin no               # 禁止 root 登录
PasswordAuthentication no        # 仅允许密钥登录
PubkeyAuthentication yes         # 启用公钥认证
MaxAuthTries 3                   # 最大认证次数
ClientAliveInterval 300          # 客户端保活时间
ClientAliveCountMax 2            # 保活最大次数

# 重启 SSH 服务
sudo systemctl restart sshd
```

**4. 配置 SSH 密钥登录**

```bash
# 在客户端生成密钥对
ssh-keygen -t ed25519 -C "your_email@example.com"

# 上传公钥到服务器
ssh-copy-id user@server-ip

# 或手动添加
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys  # 粘贴公钥
chmod 600 ~/.ssh/authorized_keys
```

**5. 配置 Fail2Ban（防暴力破解）**

```bash
# 安装 Fail2Ban
sudo dnf install -y fail2ban

# 创建本地配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local

# SSH 防护配置：
[sshd]
enabled = true
port = 22
logpath = /var/log/secure
maxretry = 5
bantime = 3600
findtime = 600

# 启动服务
sudo systemctl enable --now fail2ban

# 查看状态
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 7.5. 五、用户和权限管理

**创建用户**

```bash
# 创建用户
sudo useradd -m -s /bin/bash newuser

# 设置密码
sudo passwd newuser

# 添加到 wheel 组（sudo 权限）
sudo usermod -aG wheel newuser

# 查看用户信息
id newuser
```

**配置 sudo**

```bash
# 编辑 sudoers
sudo visudo

# 允许 wheel 组无密码 sudo（可选）
%wheel  ALL=(ALL)  NOPASSWD: ALL

# 或为特定用户配置
newuser ALL=(ALL) ALL
```

**设置用户资源限制**

```bash
# 编辑限制文件
sudo vim /etc/security/limits.conf

# 示例配置：
*    soft    nofile    65536
*    hard    nofile    65536
*    soft    nproc     4096
*    hard    nproc     4096
```

### 7.6. 六、时间同步配置

```bash
# 安装 chrony（时间同步）
sudo dnf install -y chrony

# 启动服务
sudo systemctl enable --now chronyd

# 查看时间同步状态
chronyc tracking

# 查看时间服务器
chronyc sources -v

# 手动同步
sudo chronyc makestep

# 设置时区
sudo timedatectl set-timezone Asia/Shanghai
# 或
sudo timedatectl set-timezone Asia/Taipei

# 查看时间设置
timedatectl
```

### 7.7. 七、系统监控

**安装监控工具**

```bash
# 系统监控
sudo dnf install -y htop iotop iftop

# 使用方法
htop    # 进程监控
iotop   # IO 监控
iftop   # 网络监控
```

**配置日志管理**

```bash
# 查看系统日志
sudo journalctl -f              # 实时日志
sudo journalctl -u sshd         # SSH 服务日志
sudo journalctl --since "1 hour ago"  # 最近1小时

# 查看传统日志
sudo tail -f /var/log/messages  # 系统日志
sudo tail -f /var/log/secure    # 安全日志

# 配置日志轮转
sudo vim /etc/logrotate.d/custom-logs
```

### 7.8. 八、性能优化

**系统参数优化**

```bash
# 编辑内核参数
sudo vim /etc/sysctl.conf

# 网络优化（高并发场景）
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# 文件系统优化
fs.file-max = 1000000
fs.inotify.max_user_watches = 524288

# 应用配置
sudo sysctl -p
```

**禁用不需要的服务**

```bash
# 查看所有服务
systemctl list-unit-files --type=service

# 禁用不需要的服务
sudo systemctl disable postfix  # 邮件服务（如不需要）
sudo systemctl disable bluetooth  # 蓝牙（服务器）
```

---

## 8. 实用场景

### 8.1. 场景一：Web 服务器（LAMP/LEMP）

**LEMP Stack (Nginx + PHP + MariaDB)**

```bash
# 1. 安装软件包
sudo dnf install -y nginx php php-fpm php-mysqlnd php-json php-opcache mariadb-server

# 2. 启动服务
sudo systemctl enable --now nginx php-fpm mariadb

# 3. 配置 Nginx
sudo vim /etc/nginx/conf.d/default.conf

server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.php index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# 4. 配置 PHP-FPM
sudo vim /etc/php-fpm.d/www.conf
# 确保：
user = nginx
group = nginx
listen.owner = nginx
listen.group = nginx

# 5. 初始化数据库
sudo mysql_secure_installation

# 6. 测试
echo "<?php phpinfo(); ?>" | sudo tee /var/www/html/info.php
curl http://localhost/info.php

# 7. 防火墙开放
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### 8.2. 场景二：Docker 容器主机

```bash
# 1. 安装 Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 2. 启动 Docker
sudo systemctl enable --now docker

# 3. 配置用户权限
sudo usermod -aG docker $USER
newgrp docker

# 4. 配置镜像加速（国内）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://dockerproxy.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker

# 5. 测试
docker run hello-world

# 6. 部署应用示例
docker run -d \
  --name nginx-app \
  -p 80:80 \
  -v /data/html:/usr/share/nginx/html:ro \
  nginx:alpine
```

### 8.3. 场景三：数据库服务器（PostgreSQL）

```bash
# 1. 安装 PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# 2. 初始化数据库
sudo postgresql-setup --initdb

# 3. 配置远程访问
sudo vim /var/lib/pgsql/data/postgresql.conf
# 修改：
listen_addresses = '*'

sudo vim /var/lib/pgsql/data/pg_hba.conf
# 添加：
host    all             all             0.0.0.0/0               md5

# 4. 启动服务
sudo systemctl enable --now postgresql

# 5. 创建用户和数据库
sudo -u postgres psql
CREATE USER myuser WITH PASSWORD 'password';
CREATE DATABASE mydb OWNER myuser;
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
\q

# 6. 防火墙配置
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload

# 7. 性能优化
sudo vim /var/lib/pgsql/data/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 8.4. 场景四：Git 服务器（Gitea）

```bash
# 1. 安装依赖
sudo dnf install -y git

# 2. 创建用户
sudo adduser \
   --system \
   --shell /bin/bash \
   --comment 'Git Version Control' \
   --user-group \
   --home-dir /home/git \
   git

# 3. 下载 Gitea
wget -O /tmp/gitea https://dl.gitea.com/gitea/1.21/gitea-1.21-linux-amd64
sudo mv /tmp/gitea /usr/local/bin/gitea
sudo chmod +x /usr/local/bin/gitea

# 4. 创建目录结构
sudo mkdir -p /var/lib/gitea/{custom,data,log}
sudo chown -R git:git /var/lib/gitea/
sudo chmod -R 750 /var/lib/gitea/

# 5. 创建 systemd 服务
sudo vim /etc/systemd/system/gitea.service

[Unit]
Description=Gitea
After=syslog.target
After=network.target

[Service]
Type=simple
User=git
Group=git
WorkingDirectory=/var/lib/gitea/
ExecStart=/usr/local/bin/gitea web -c /etc/gitea/app.ini
Restart=always
Environment=USER=git HOME=/home/git

[Install]
WantedBy=multi-user.target

# 6. 启动服务
sudo systemctl enable --now gitea

# 7. 防火墙配置
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 8. 访问 Web 界面完成配置
# http://server-ip:3000
```

### 8.5. 场景五：Kubernetes 节点

```bash
# 1. 禁用 swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 2. 配置内核参数
sudo tee /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

sudo tee /etc/sysctl.d/k8s.conf <<EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system

# 3. 安装容器运行时（containerd）
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y containerd.io

sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo systemctl enable --now containerd

# 4. 安装 kubeadm, kubelet, kubectl
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/repodata/repomd.xml.key
EOF

sudo dnf install -y kubelet kubeadm kubectl --disableexcludes=kubernetes
sudo systemctl enable --now kubelet

# 5. 初始化集群（master 节点）
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# 6. 配置 kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 7. 安装网络插件（Flannel）
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

---

## 9. 总结与建议

### 9.1. 版本选择建议

**生产环境首选：Rocky Linux 9**

- 最佳的稳定性和支持周期平衡
- 支持至 2032 年，足够长的生命周期
- 成熟的生态系统和社区支持
- 适合 90% 的企业应用场景

**特殊场景：**

- 需要兼容旧系统 → Rocky Linux 8
- 尝鲜最新技术 → Rocky Linux 10（非生产）
- 开发测试 → 任何版本都可以

### 9.2. 镜像选择建议

**服务器部署：**

```
首选：Minimal ISO
- 体积适中（2-3GB）
- 无需联网即可完成基础安装
- 系统精简，安全性高
- 适合 90% 的服务器场景
```

**桌面使用：**

```
新手：GNOME Live
配置低：GNOME Lite Live
Windows 用户：KDE Live
```

**容器部署：**

```
生产环境：rockylinux:9-minimal
开发环境：rockylinux:9
```

**云平台：**

```
使用对应平台的官方镜像
- AWS：AMI
- 阿里云：ECS 镜像
- Azure：Marketplace 镜像
- OpenStack/KVM：QCOW2
```

### 9.3. 安全最佳实践

1. **及时更新**
   - 启用自动安全更新
   - 定期检查系统更新

2. **最小化原则**
   - 只安装必要的服务
   - 禁用不需要的端口
   - 使用 Minimal ISO 安装

3. **访问控制**
   - 禁用 root 远程登录
   - 使用 SSH 密钥认证
   - 配置 Fail2Ban

4. **防火墙配置**
   - 默认拒绝策略
   - 只开放必要端口
   - 定期审查规则

5. **保持 SELinux 启用**
   - 提供额外的安全层
   - 不要轻易禁用

### 9.4. 性能优化建议

1. **选择合适的文件系统**
   - XFS：默认选择，性能均衡
   - ext4：兼容性好
   - Btrfs：需要快照功能时

2. **使用 LVM**
   - 灵活调整分区大小
   - 支持快照和备份
   - 易于扩展

3. **合理配置 swap**
   - 物理内存 < 2GB：swap = 2倍内存
   - 物理内存 2-8GB：swap = 内存大小
   - 物理内存 > 8GB：swap = 8GB 或更少

4. **启用 BBR 拥塞控制**

   ```bash
   echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
   echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### 9.5. 监控和维护

**定期检查：**

```bash
# 磁盘空间
df -h

# 内存使用
free -h

# 系统负载
uptime

# 日志检查
sudo journalctl -p err -b

# 安全更新
sudo dnf check-update --security
```

**备份策略：**

- 系统配置：/etc
- 用户数据：/home
- 应用数据：/var
- 数据库：定期导出

### 9.6. 学习资源

**官方文档：**

- Rocky Linux 文档：<https://docs.rockylinux.org>
- RHEL 文档：<https://access.redhat.com/documentation>

**社区支持：**

- 论坛：<https://forums.rockylinux.org>
- Mattermost：<https://chat.rockylinux.org>
- Reddit：r/RockyLinux

**中文社区：**

- Rocky Linux 中文文档
- CentOS 中文社区（大部分内容适用）

### 9.7. 迁移指南

**从 CentOS 7/8 迁移：**

```bash
# 使用官方迁移工具
curl -O https://raw.githubusercontent.com/rocky-linux/rocky-tools/main/migrate2rocky/migrate2rocky.sh
sudo bash migrate2rocky.sh -r

# 验证迁移
cat /etc/os-release
```

**升级路径：**

- CentOS 7 → Rocky Linux 8 → Rocky Linux 9
- CentOS 8 → Rocky Linux 8 → Rocky Linux 9
- 建议在测试环境先验证

### 9.8. 常见问题

**Q: Rocky Linux 和 AlmaLinux 哪个更好？**
A: 两者技术上几乎相同，都是 RHEL 的完美替代。Rocky Linux 由 CentOS 原创始人创建，社区更独立；AlmaLinux 由 CloudLinux 赞助。选择任何一个都可以。

**Q: Rocky Linux 支持多久？**
A: 每个主版本支持 10+ 年，与 RHEL 保持一致。

**Q: 可以用于商业环境吗？**
A: 完全可以，Rocky Linux 100% 开源免费，无商业限制。

**Q: 如何获取技术支持？**
A: 社区免费支持（论坛、聊天室）；也有第三方公司提供付费支持服务。

**Q: 性能如何？**
A: 与 RHEL 完全相同，因为是二进制兼容的重建版本。

### 9.9. 结语

Rocky Linux 是企业级 Linux 的优秀选择，完美继承了 CentOS 的衣钵。无论你是：

- 企业 IT 管理员
- 独立开发者
- 运维工程师
- 云架构师
- Linux 学习者

Rocky Linux 都能为你提供稳定、可靠、免费的企业级 Linux 体验。

**立即开始：**

1. 访问官网：<https://rockylinux.org>
2. 下载适合你的镜像
3. 按照本指南安装配置
4. 加入社区，获取帮助和分享经验

**记住关键原则：**

- 生产环境优先选择 Rocky Linux 9
- 服务器首选 Minimal ISO 安装
- 始终保持系统更新
- 重视安全配置
- 做好备份

祝你使用愉快！如有问题，欢迎在 Rocky Linux 社区寻求帮助。

---

## 10. 附录：快速参考命令

### 10.1. 系统管理

```bash
# 查看系统信息
cat /etc/os-release
hostnamectl
uname -r

# 查看硬件信息
lscpu
free -h
df -h
lsblk

# 系统更新
sudo dnf update
sudo dnf upgrade

# 服务管理
sudo systemctl start service_name
sudo systemctl stop service_name
sudo systemctl restart service_name
sudo systemctl enable service_name
sudo systemctl status service_name

# 查看日志
sudo journalctl -xe
sudo journalctl -u service_name -f
sudo tail -f /var/log/messages
```

### 10.2. 网络管理

```bash
# 查看网络接口
ip addr show
ip link show
nmcli device status

# 配置网络（NetworkManager）
sudo nmcli con mod eth0 ipv4.addresses 192.168.1.100/24
sudo nmcli con mod eth0 ipv4.gateway 192.168.1.1
sudo nmcli con mod eth0 ipv4.dns "8.8.8.8 8.8.4.4"
sudo nmcli con mod eth0 ipv4.method manual
sudo nmcli con up eth0

# 防火墙
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# 网络测试
ping google.com
traceroute google.com
nslookup google.com
curl -I https://example.com
```

### 10.3. 软件包管理

```bash
# 搜索软件包
dnf search package_name

# 安装软件包
sudo dnf install package_name

# 删除软件包
sudo dnf remove package_name

# 查看已安装的包
dnf list installed
rpm -qa

# 查看包信息
dnf info package_name
rpm -qi package_name

# 查看包文件列表
rpm -ql package_name

# 查找文件属于哪个包
rpm -qf /path/to/file

# 清理缓存
sudo dnf clean all
```

### 10.4. 用户和权限

```bash
# 用户管理
sudo useradd username
sudo passwd username
sudo userdel username
sudo usermod -aG groupname username

# 查看用户信息
id username
groups username
who
w

# 权限管理
chmod 755 file
chmod u+x file
chown user:group file
chown -R user:group directory/

# sudo 配置
sudo visudo
```

### 10.5. 文件和目录

```bash
# 查找文件
find /path -name "filename"
find /path -type f -mtime -7  # 7天内修改的文件
locate filename

# 文件内容搜索
grep "pattern" file
grep -r "pattern" directory/

# 压缩和解压
tar -czf archive.tar.gz directory/
tar -xzf archive.tar.gz
zip -r archive.zip directory/
unzip archive.zip

# 同步和备份
rsync -avz source/ destination/
rsync -avz -e ssh source/ user@remote:/destination/
```

### 10.6. 进程管理

```bash
# 查看进程
ps aux
ps -ef
top
htop

# 查找进程
pgrep process_name
pidof process_name

# 终止进程
kill PID
killall process_name
pkill process_name

# 后台运行
command &
nohup command &

# 查看端口占用
sudo netstat -tulpn
sudo ss -tulpn
sudo lsof -i :8080
```

### 10.7. 磁盘管理

```bash
# 查看磁盘使用
df -h
du -sh directory/
du -h --max-depth=1 /

# 挂载
sudo mount /dev/sdb1 /mnt
sudo umount /mnt

# 查看分区
lsblk
fdisk -l

# LVM 管理
sudo pvcreate /dev/sdb
sudo vgcreate vg_name /dev/sdb
sudo lvcreate -L 10G -n lv_name vg_name
sudo mkfs.xfs /dev/vg_name/lv_name
```

### 10.8. 性能监控

```bash
# CPU 和负载
uptime
top
htop
mpstat

# 内存
free -h
vmstat 1

# 磁盘 IO
iostat
iotop

# 网络
iftop
nethogs
ss -s
```

### 10.9. 安全相关

```bash
# SELinux
getenforce
sudo setenforce 0
sudo setenforce 1
sestatus
ls -Z file

# 防火墙
sudo firewall-cmd --state
sudo firewall-cmd --list-all
sudo firewall-cmd --list-services

# 检查开放端口
sudo netstat -tulpn
sudo ss -tulpn
nmap localhost

# 查看登录历史
last
lastb
who
w

# 审计日志
sudo ausearch -m user_login
sudo tail -f /var/log/secure
```

### 10.10. Docker 常用命令

```bash
# 镜像管理
docker pull image:tag
docker images
docker rmi image:tag

# 容器管理
docker run -d --name container_name image:tag
docker ps
docker ps -a
docker stop container_name
docker start container_name
docker restart container_name
docker rm container_name

# 日志和执行
docker logs -f container_name
docker exec -it container_name bash

# 清理
docker system prune -a
```

### 10.11. 故障排查

```bash
# 系统启动问题
sudo journalctl -xb
sudo systemctl --failed

# 服务问题
sudo systemctl status service_name
sudo journalctl -u service_name -xe

# 网络问题
ping gateway_ip
traceroute target_ip
dig domain.com
nslookup domain.com

# 磁盘问题
df -h
du -sh /*
sudo fsck /dev/sdb1

# 内存问题
free -h
ps aux --sort=-%mem | head
top -o %MEM

# 查看系统错误
sudo journalctl -p err
sudo tail -f /var/log/messages
dmesg | tail
```

---

## 11. 版本历史

**文档版本：** 2.0  
**最后更新：** 2024年12月  
**适用版本：** Rocky Linux 8.x, 9.x, 10.x  
**作者：** Rocky Linux 中文社区  

**更新日志：**

- v2.0 (2024-12): 添加 Rocky Linux 10 信息，更新最佳实践
- v1.5 (2024-06): 增强安全配置章节，添加容器部署指南
- v1.0 (2023-12): 初始版本发布

**参考资源：**

- Rocky Linux 官方文档: <https://docs.rockylinux.org>
- RHEL 9 文档: <https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9>
- Rocky Linux GitHub: <https://github.com/rocky-linux>
