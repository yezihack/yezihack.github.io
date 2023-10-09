---
title: "Docker笔记(一) 原理"
date: 2020-10-14T18:11:18+08:00
lastmod: 2020-10-14T18:11:18+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

![img](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20201015181807.png?imageslim)

## 什么是docker

Docker 是 dotCloud 公司开源的一款产品，2013年开源(基于golang开发)。

Docker 英文意思是“搬运工",  是一种容器化技术，将您的运行软件封到一个沙盒里，随意搬运的应用容器引擎。

容器技术是所有云应用的基石，也把互联网升到到下一代。足以说明 docker 的强大之处。

> Google 自2004年开始使用容器技术，对Docker的贡献之大，开源了Cgroup和Imctfy项目，还开源了容器管理系统 Kubernetes. 
>
> 向开源致敬！

## Docker 架构

采用 c/s 模式体系架构， Docker 客户端与 Docker Daemon 守护进程通信。

![image-20201016113641239](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20201016113642.png?imageslim)

1. Docker Daemon: 是Docker服务端的守护进程， 用来监听 Docker API 的请求和管理 Docker 对象，比如镜像、容器、网络和 Volume。
2. Docker Client: docker client 是我们和 Docker 进行交互的最主要的方式方法
3. Docker Registry：用来存储 Docker 镜像的仓库
4. Images：镜像，镜像是一个只读模板
5. Containers：容器，容器是一个镜像的可运行的实例,容器可以拥有自己的 **root 文件系统、自己的网络配置、自己的进程空间，甚至自己的用户 ID 空间**
6. 底层技术支持：Namespaces（做隔离）、CGroups（做资源限制）、UnionFS（镜像和容器的分层）

## Docker 核心技术

> Docker 的基础是 Linux 容器(LXC) 等技术
>
> 三大底层技术实现 Docker 的关键技术

1. Namespaces 解决了进程，网络及文件系统的隔离
   1. 命名空间（namespaces）是 Linux 为我们提供的用于分离进程树、网络接口、挂载点以及进程间通信等资源的方法
2. CGroups 解决了CPU,内存等资源隔离
   1. Namespaces 并不能够为我们提供物理资源上的隔离。比如CPU，内存等。这样会导致多个Docker抢占物理资源。
   2. Control Groups（简称 CGroups）就是能够隔离宿主机器上的物理资源，例如 CPU、内存、磁盘 I/O 和网络带宽。
3. UnionFS 解决了镜像隔离
   1. Union File System，联合文件系统
   2. 将多个不同位置的目录联合挂载到同一个目录，将相同的部分合并