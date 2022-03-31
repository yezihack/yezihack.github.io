---
title: "Docker busybox 镜像工具"
date: 2022-1134-04T15:20:11+08:00
lastmod: 2022-1134-04T15:20:11+08:00
draft: false
tags: ["docker", "busybox"]
categories: ["docker"]
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

<!-- TOC -->

- [busybox](#busybox)
- [progrium/busybox](#progriumbusybox)
- [Alpine](#alpine)
  - [Alpine 替换国内源](#alpine-替换国内源)
  - [Dockerfile](#dockerfile)
  - [升级&安装软件](#升级安装软件)

<!-- /TOC -->

busybox 本身集成了300多个常用工具命令. 用于日常开发,维护.也是体积比较小. 
但是 busybox 本身不支持 curl,很遗憾,所以有了衍生品.

## busybox

原生的 busybox, 大小718K左右,不及1M大小.

本身采用 apt-get install 安装工具

## progrium/busybox

官方地址: [https://hub.docker.com/r/progrium/busybox](https://hub.docker.com/r/progrium/busybox)

支持创建自己的镜像,安装,采用 opkg-install  安装软件.

```sh
FROM progrium/busybox
RUN opkg-install curl bash git
CMD ["/bin/bash"]
```

## Alpine

### Alpine 替换国内源

```sh
# 查看镜像源
cat /etc/apk/repositories

http://dl-cdn.alpinelinux.org/alpine/v3.11/main
http://dl-cdn.alpinelinux.org/alpine/v3.11/community

# 替换阿里云
sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 替换科技大学
sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 替换清华源
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
```

### Dockerfile

```sh
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache gcc musl-dev linux-headers
```

### 升级&安装软件

```sh
# 升级
apk update
apk upgrade

# 安装 bash
apk add --no-cache bash

# 安装 bash 文档
apk add bash-doc

# 安装 bash 自动化命令行
apk add bash-completion

# 改变当前环境 Bash
bash
```