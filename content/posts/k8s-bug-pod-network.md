---
title: "K8s 跨 Node 机器 Pod 网络异常"
date: 2023-02-07T18:07:36+08:00
lastmod: 2023-02-07T18:07:36+08:00
draft: false
tags: ["异常", "错误", "网络", "云运维笔记", "kubernetes", "k8s", "flannel"]
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

## 背景

在 k8s 里部署了应用需要通过 ingress 提供外部调用. ingressController Pod 应用部署在 A 机器上, 应用部署在 B 机器上.

通过自定义域名调用应用,则需要经过自定义域名配置的 host 的 kube-proxy 到 IngressController Pod 机器,再由 Ingress 负载找到应用的 Service 负载的 endpoint.

最终请求到应用的 Pod.

## 环境

- k8s: 1.19
- docker: 19.10
- linux: CentOS7.6

## 分析思路

1. 先确定 host:port 端口是否通达？
2. 再确认 ingress 是否可以访问到 service IP

### ingress





















## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
