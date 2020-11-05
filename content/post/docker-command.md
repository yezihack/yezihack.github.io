---
title: "Docker笔记(七) 命令"
date: 2020-11-03T19:49:09+08:00
lastmod: 2020-11-03T19:49:09+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: true
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "1368398851"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

> 前面教程介绍过 docker 是 c/s 模式, 通过 client 命令 与 server 端进行交互, docker 有着强大的命令系统, 我们需要系统学习下.



## 基础的命令

### 查看版本

`docker version`

### 查看 docker 信息

> 会显示多少镜像,容器, 运行中,暂停中, 停止的容器数量, cpu, memory, system等信息

`docker info`

## 容器操作

### 下载仓库

`docker pull centos`

### 运行容器

`docker run -it centos /bin/bash`

`docker run -it`

1. `-i` 交互式操作
2. `-t` 终端
3. `centos` 镜像
4. `/bin/bash` 交互使用/bin/bash模式

### 查看容器

`docker ps` 查看正在运行的容器

`docker ps -a` 查看所有容器,包括运行中,停止和暂停的容器

### 启动指定ID的容器

`docker start ID` 支持3位数操作.

### 停止容器

`docker stop ID`

### 暂停容器

`docker pause ID`

### 恢复容器

`docker unpause ID`

### 重启容器

`docker restart ID`