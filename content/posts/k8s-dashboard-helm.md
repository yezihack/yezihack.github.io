---
title: "Helm 安装 Kubernetes Dashboard"
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

## 1. 为什么使用 helm 安装

- <https://github.com/kubernetes/dashboard/?tab=readme-ov-file#introduction>

从版本 7.0.0 开始，我们不再支持基于 Manifest 的安装。现在仅支持基于 Helm 的安装。
由于多容器设置和对 Kong 网关 API 代理的硬依赖，因此无法轻松支持基于 Manifest 的安装。

## 2. Helm 安装

- 本次以 k8s 1.27 版本为例

找到适配的版本，即 Helm Chart 7.5.0, See: <https://github.com/kubernetes/dashboard/releases?page=5>

```sh
# 添加 helm 仓库
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/

# 更新仓库
helm repo update

# 查找 kubernetes-dashboard
helm search repo kubernetes-dashboard/kubernetes-dashboard -l # 列出所有版本
helm search repo kubernetes-dashboard/kubernetes-dashboard  --version 7.5.0 # 查看指定版本

# 安装(不含 metrics-server、使用事先安装好的 metrics-server)
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
  --version 7.5.0 \
  --create-namespace \
  --namespace kubernetes-dashboard \
  --set app.ingress.enabled=true \
  --set app.ingress.hosts[0]="web.k8s.local" \
  --set app.ingress.ingressClassName=nginx \
  --set app.ingress.issuer.scope=disabled \
  --set app.ingress.tls.enabled=true \
  --set app.ingress.tls.secretName="kubernetes-dashboard-tls"

# 安装(含 metrics-server)
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
  --create-namespace \
  --namespace kubernetes-dashboard \
  --set app.ingress.enabled=true \
  --set app.ingress.hosts[0]="web.k8s.local" \
  --set app.ingress.ingressClassName=nginx \
  --set metrics-server.enabled=true
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

## 3. 生成自签名证书

```sh
# 生成自签名证书
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=web.k8s.local"

# 创建 kubernetes-dashboard-tls Secret
kubectl -n kubernetes-dashboard create secret tls kubernetes-dashboard-tls --key tls.key --cert tls.crt
```

## 4. 访问

- <https://web.k8s.local/>

## 5. 生成 token

- 超级管理员权限

```sh
# 创建一个 ServiceAccount
kubectl -n kubernetes-dashboard create serviceaccount admin-user

# 创建一个 ClusterRoleBinding
kubectl -n kubernetes-dashboard create clusterrolebinding admin-user --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:admin-user

# 获取 token
kubectl -n kubernetes-dashboard create token admin-user
```

或者使用YAML

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

- 只读权限

```sh
# 创建一个 ServiceAccount
kubectl -n kubernetes-dashboard create serviceaccount admin-view

# 创建一个 ClusterRoleBinding
kubectl -n kubernetes-dashboard create clusterrolebinding admin-view --clusterrole=view --serviceaccount=kubernetes-dashboard:admin-view

# 获取 token
kubectl -n kubernetes-dashboard create token admin-view
```

## 6. 参考

- <https://github.com/kubernetes/dashboard/releases?page=5>
