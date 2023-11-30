---
title: "鲁班工具之 Markdown 生成目录(一)"
date: 2020-12-24T17:06:46+08:00
lastmod: 2020-12-24T17:06:46+08:00
draft: false
tags: ["工具", "鲁班工具", "toc", "markdown", "教程"]
categories: ["鲁班工具"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

> 命令行对 markdown 生成目录结构, 主要解决 markdown 不自动生成目录的困扰. 即[TOC]不支持.



## 工具源码

https://github.com/ekalinin/github-markdown-toc.go

## 下载安装

```sh
$ wget https://github.com/ekalinin/github-markdown-toc.go/releases/download/1.1.0/gh-md-toc.linux.amd64.tgz
$ tar xzvf gh-md-toc.linux.amd64.tgz
gh-md-toc
$ ./gh-md-toc --version
1.1.0
```

mac 

```sh
brew install github-markdown-toc
```

## 使用方式

```sh
 gh-md-toc README.md
```

```markdown
* [音乐开关，true/false](#音乐开关truefalse)
* [只支持163的音乐，在生成外链播放器获取ID](#只支持163的音乐在生成外链播放器获取id)
* [是否自动播放 1是，0否](#是否自动播放-1是0否)
* [weight: 1](#weight-1)
* [description: ""](#description-)
  * [镜像介绍](#镜像介绍)
    * [获取镜像](#获取镜像)
    * [查看镜像](#查看镜像)
    * [查找镜像](#查找镜像)
    * [删除镜像](#删除镜像)
    * [清理镜像](#清理镜像)
  * [创建镜像](#创建镜像)
    * [基本已有镜像](#基本已有镜像)
    * [基于Dockefile创建](#基于dockefile创建)
  * [导入与导出镜像](#导入与导出镜像)
    * [导出镜像](#导出镜像)
    * [导入镜像](#导入镜像)
  * [上传镜像](#上传镜像)
```

