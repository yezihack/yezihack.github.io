---
title: "K8s Dashboard Helm"
date: 2025-06-16T17:32:24+08:00
lastmod: 2025-06-16T17:32:24+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes", "dashboard", "helm"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

## 为什么使用 helm 安装

- <https://github.com/kubernetes/dashboard/?tab=readme-ov-file#introduction>

从版本 7.0.0 开始，我们不再支持基于 Manifest 的安装。现在仅支持基于 Helm 的安装。
由于多容器设置和对 Kong 网关 API 代理的硬依赖，因此无法轻松支持基于 Manifest 的安装。

## Helm 安装

- 本次以 k8s 1.27 版本为例

找到适配的版本，即 Helm Chart 7.5.0, See: <https://github.com/kubernetes/dashboard/releases?page=5>

```sh
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/

helm search repo kubernetes-dashboard/kubernetes-dashboard --version 7.5.0

helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
helm upgrade --install kubernetes-dashboard ./kubernetes-dashboard-7.5.0.tgz --create-namespace --namespace kubernetes-dashboard --dry-run
helm upgrade --install kubernetes-dashboard ./kubernetes-dashboard-7.5.0.tgz --create-namespace --namespace kubernetes-dashboard -f dashboard-values.yaml --dry-run

```

涉及到的镜像：

```sh
# API 组件负责处理来自前端（Web 界面）的请求
docker.io/kubernetesui/dashboard-api:1.7.0
# 这个镜像是 Kubernetes Dashboard 认证组件的镜像
docker.io/kubernetesui/dashboard-auth:1.1.3
# 这个镜像是 Kubernetes Dashboard Metrics Scraper 组件的镜像。Metrics Scraper 负责从 Heapster 或 Metrics Server 收集指标数据，并将其提供给 Dashboard 以便展示资源使用情况。
docker.io/kubernetesui/dashboard-metrics-scraper:1.1.1
# 这个镜像是 Kubernetes Dashboard 前端（Web 界面）组件的镜像
docker.io/kubernetesui/dashboard-web:1.4.0
```

依赖

- 确保 metrics-server 和 dashboard-metrics-scraper 已启动并正在运行
