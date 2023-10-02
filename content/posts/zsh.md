---
title: "Linux 安装 zsh 和 oh-my-zsh "
date: 2022-04-23T09:58:14+08:00
lastmod: 2022-04-23T09:58:14+08:00
draft: false
tags: ["linux", "shell", "zsh"]
categories: ["shell"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""

---
<!-- TOC -->

- [.1. 介绍](#1-介绍)
- [.2. 安装 ZSH](#2-安装-zsh)
- [.3. 安装 oh-my-zsh](#3-安装-oh-my-zsh)
- [.4. 设置主题](#4-设置主题)
- [.5. 一键安装 zsh + oh-my-zsh](#5-一键安装-zsh--oh-my-zsh)
- [.6. 推荐一个华丽主题](#6-推荐一个华丽主题)

<!-- /TOC -->

## .1. 介绍

Zsh 是 Shell 脚本的天花板，个人觉得目前没有之一。华丽的外衣，丰富的内含，让你的终端操作如行云流水一般，好不快活，何不尝试一下 Oh-my-zsh。

![](https://raw.githubusercontent.com/jeremyFreeAgent/oh-my-zsh-powerline-theme/master/preview.png)


## .2. 安装 ZSH

> Zsh 全称 Z-shell，是一款用于交互式使用的shell，也可以作为脚本解释器来使用。其包含了 bash，ksh，tcsh 等其他shell中许多优秀功能，也拥有诸多自身特色。

```sh
# CentOS
sudo yum -y install zsh

# Ubuntu
sudo apt-get -y install zsh


# 查看系统支持哪些 shell
cat /etc/shells 

# 设置默认shell
chsh -s /bin/zsh

# 查看当前默认shell 
echo $SHELL

```

## .3. 安装 oh-my-zsh

```sh
# 官网下载
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 或源码下载
# 安装oh-my-zsh
git clone git://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
# 复制zshrc
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

## .4. 设置主题

官方更多主题：<https://github.com/ohmyzsh/ohmyzsh/wiki/Themes>

```sh
vim ~/.zshrc 找到ZSH_THEME 字段
# 推荐使用: agnoster, candy
ZSH_THEME="candy"
```

## .5. 一键安装 zsh + oh-my-zsh

```sh
curl -sSL https://gitee.com/sgfoot/library/raw/master/oh-my-zsh/install.sh |bash
```

## .6. 推荐一个华丽主题

```sh
cd ~/.oh-my-zsh/themes

git clone https://github.com/jeremyFreeAgent/oh-my-zsh-powerline-theme.git

ln -s oh-my-zsh-powerline-theme/powerline.zsh-theme powerline.zsh-theme

# 编辑 .zshrc
vim ~/.zshrc

ZSH_THEME="powerline"

source ~/.zshrc
```
