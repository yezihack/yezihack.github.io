---
title: "第二章 Kubernetes 安装"
date: 2021-10-28T15:24:42+08:00
lastmod: 2021-10-28T15:24:42+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes"]
categories: ["kubernetes"]
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

- [kubectl 安装](#kubectl-安装)
- [kind 安装](#kind-安装)
- [创建一个集群](#创建一个集群)
- [查看集群](#查看集群)
- [删除集群](#删除集群)

> kubernetes 安装比较复杂，用于学习可以搭建单机集群安装。
> 推荐使用 linux 系统安装实验。

kubernetes有多种部署方式，目前主流的方式有kind、kubeadm、minikube、二进制包

- kind: 一个基于 Docker 安装的 kubernetes 工具（推荐）
- minikube：一个用于快速搭建单节点 kubernetes 的工具
- kubeadm：一个用于快速搭建 kubernetes 集群的工具
- 二进制包 ：从官网下载每个组件的二进制包，依次去安装，此方式对于理解 kubernetes 组件更加有效


## kubectl 安装
> 参考: https://kubernetes.io/zh/docs/tasks/tools/install-kubectl-linux/

```sh
# 下载安装

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 添加权限，复制到/bin下，方便全局使用

chmod +x kubectl
mkdir -p ~/.local/bin/kubectl
mv ./kubectl ~/.local/bin/kubectl

# 验证安装是否成功
kubectl version --client

```

## kind 安装
> 官网：https://kind.sigs.k8s.io/

下载二进制包，无须其它依赖 

https://github.com/kubernetes-sigs/kind/releases

```sh
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.11.1/kind-linux-amd64
chmod +x ./kind
mv ./kind /usr/local/bin/kind
```



## 创建一个集群

> 一个节点也叫集群。

```sh
# 不指定名称，默认名称:kind 
kind create cluster

# 指定名称
kind create cluster --name kind-2
```



## 查看集群

```sh
kind get clusters

# 详情
kubectl cluster-info --context kind-kind
```



## 删除集群

```sh
kind delete cluster
```

## 参考

1. 以上笔记来自于黑马视频课程整理.
2. 视频入口：[https://www.bilibili.com/video/BV1cK4y1L7Am](https://www.bilibili.com/video/BV1cK4y1L7Am)


## 关于作者
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)