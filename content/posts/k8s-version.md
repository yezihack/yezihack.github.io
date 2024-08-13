---
title: "K8S 版本"
date: 2024-08-01T15:31:43+08:00
lastmod: 2024-08-01T15:31:43+08:00
draft: false
tags: ["k8s", "docker", "kubernetes"]
categories: ["k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

## Docker 版本

- <https://github.com/kubernetes/kubernetes/blob/release-1.20/build/dependencies.yaml>

k8s 不同版本，支持的 docker 版本不同，导致安装和升级，版本冲突，需要提前了解。

### 版本对应关系

| Kubernetes 版本 | 支持的 Docker 版本 |
| :-------------- | :----------------- |
| 1.20.x          | 18.09, 19.03, 20.10 |
| 1.19.x          | 18.09, 19.03, 20.10 |
| 1.18.x          | 18.09, 19.03, 19.03 |

## flanned

选择版本：<https://github.com/flannel-io/flannel/blob/v0.24.4/Documentation/kube-flannel.yml>

## ingress-nginx

选择版本：<https://github.com/kubernetes/ingress-nginx?tab=readme-ov-file#changelog>