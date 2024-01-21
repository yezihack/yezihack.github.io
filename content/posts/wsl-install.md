---
title: "Windows 子系统 Linux 系统之 WSL2 安装"
date: 2024-01-21T10:38:00+08:00
lastmod: 2024-01-21T10:38:00+08:00
draft: false
tags: ["linux", "win", "ubuntu"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
---
<!-- TOC -->

- [.1. 为什么安装 WSL](#1-为什么安装-wsl)
- [.2. 安装 WSL](#2-安装-wsl)
- [.3. 配置优化](#3-配置优化)
- [.4. 安装基础软件](#4-安装基础软件)
- [.5. 参考](#5-参考)

<!-- /TOC -->
## .1. 为什么安装 WSL

> 如果你的操作系统是 windows 系列则有必须了解一下 WSL，对于开发者来说必备的工具。

Windows Subsystem for Linux（简称WSL）是微软开发的一种允许在Windows操作系统上运行Linux二进制可执行文件（ELF格式）的兼容层。WSL将Linux内核的子系统嵌入到Windows中，使得用户可以在Windows环境中使用Linux工具、命令和应用程序。

WSL的主要特点包括：

1. 全面兼容性：WSL提供了高度兼容的Linux系统调用接口，可以运行大多数基于Linux的工具和应用程序，无需进行修改或重新编译。

2. 轻量化和快速启动：WSL只需要很小的资源开销，并且可以在几秒钟内启动。这使得在Windows系统上使用Linux工具和应用程序变得更加便捷。

3. 文件系统互通：WSL可以访问Windows文件系统，并且Windows和Linux之间的文件共享也变得非常容易。用户可以在Windows和Linux之间方便地共享文件和目录。

4. 命令行工具：WSL支持使用各种命令行工具，如Bash、Zsh、Fish等，提供了丰富的Shell环境和命令行工具集。

5. 自定义配置和扩展：WSL允许用户自定义Linux发行版，并且可以通过安装各种软件包来扩展功能。用户可以选择安装适合自己需求的发行版，并根据需要进行自定义配置。

使用WSL可以带来许多好处，例如在Windows环境中开发和运行Linux软件、使用Linux命令行工具和脚本、学习和测试Linux等。WSL目前有两个主要版本，即WSL 1和WSL 2，用户可以根据自己的需求选择适合自己的版本。

总之，WSL为Windows用户提供了与Linux系统无缝集成的能力，使得在Windows环境下使用Linux变得更加方便和灵活。

## .2. 安装 WSL

```sh
# 打开PowerShell作为管理员，执行以下命令，以启用WSL特性
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
# 然后，执行以下命令以启用虚拟机平台：
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

更新 WSL

- <https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi>

将WSL 2设置为默认版本：

```sh
wsl --set-default-version 2
```

安装最新的 Ubuntu 最新发行版本：

```sh
wsl --install

# 一会需要设置帐号和密码
```

将安装的 ubuntu 设置默认系统

```sh
wsl --list
wsl --set-default Ubuntu
```

## .3. 配置优化

```sh
# 打开 CMD 或 PowerShell 
wsl

# 查看版本
cat /etc/os-release

# 安装 oh-my-zsh
curl -sSL https://gitee.com/sgfoot/library/raw/master/oh-my-zsh/install.sh |bash

# 更新 apt 源
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

vim /etc/apt/sources

deb https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse

# 更新
sudo apt-get update && sudo apt-get upgrade
```

如果报以下错误：

```sh
N: See apt-secure(8) manpage for repository creation and user configuration details.
W: GPG error: http://mirrors.aliyun.com/ubuntu bionic-proposed InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 3B4FE6ACC0B21F32
```

解决方法：

```sh
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 3B4FE6ACC0B21F32
```

再次更新

```sh
sudo apt-get update && sudo apt-get upgrade
```

## .4. 安装基础软件

```sh
# 安装基础软件
apt install net-tools git vim telnet screen tree nmap dos2unix lrzsz netcat lsof wget tcpdump htop iftop iotop sysstat nethogs traceroute -y
```

## .5. 参考

- <https://yezihack.github.io/posts/window-subsystem-ubuntu/>
- <https://www.cnblogs.com/echohye/p/17712288.html>