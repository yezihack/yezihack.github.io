---
title: "使用 etcdadm 安装 etcd 集群"
date: 2022-08-04T17:16:06+08:00
lastmod: 2022-08-04T17:16:06+08:00
draft: true
tags: ["linux", "教程", "云运维笔记", "kubeadm", "etcd"]
categories: ["云运维笔记"]
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

## 安装 etcdadm

> etcdadm 灵感来自于 kubeadm，提高了生产效率。

```sh
# 下载
wget https://github.com/kubernetes-sigs/etcdadm/releases/download/v0.1.5/etcdadm-linux-amd64
# 添加执行权限
chmod +x etcdadm-linux-amd64 
# 重命名
mv etcdadm-linux-amd64 etcdadm
# 添加到 bin 目录
cp etcdadm /usr/local/bin

# 同样复制到其它两台机器上
scp etcdadm kube-11:/usr/local/bin
scp etcdadm kube-12:/usr/local/bin
```

## 初使化

- 192.168.9.10

```sh
etcdadm init
```

![kubeadm-etcd-20220804181122](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-etcd-20220804181122)

## 加入集群

```sh
etcdadm join https://192.168.9.10:2379
```















## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
