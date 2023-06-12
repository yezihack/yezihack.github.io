---
title: "Istio 安装"
date: 2023-06-12T14:26:54+08:00
lastmod: 2023-06-12T14:26:54+08:00
draft: false
tags: ["istio", "k8s", "云原生"]
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

## 1. Istio 介绍

Istio 是由 Google、IBM 和 Lyft 开源的微服务管理、保护和监控框架。Istio 为希腊语，意思是”起航“。

Istio 使用功能强大的 Envoy 服务代理扩展了 Kubernetes，以建立一个可编程的、可感知的应用程序网络。

Istio 与 Kubernetes 和传统工作负载一起使用，为复杂的部署带来了标准的通用流量管理、遥测和安全性。

## 2. 下载 istio

> 以 CentOS7 为例

官方下载：<https://github.com/istio/istio/releases/>

截止写本文时，版本更新到 v1.18.0。

### 2.1. 版本的选择

<https://istio.io/latest/zh/docs/releases/supported-releases/>

v1.18.0 适合 k8s 1.24, 1.25, 1.26, 1.27。

根据你的 kubernetes 版本进行下载相应的 istio 版本。

```sh
cd /opt/src
wget https://github.com/istio/istio/releases/download/1.18.0/istio-1.18.0-linux-amd64.tar.gz

tar -zxvf istio-1.18.0-linux-amd64.tar.gz

cd istio-1.18.0

cp istio-1.18.0/bin/istioctl /usr/local/bin

# 查看版本
istioctl version

# 如果显示如下，则表示你未设置 KUBECONFIG 环境变量
unable to retrieve Pods: Get "http://localhost:8080/api/v1/namespaces/istio-system/pods?fieldSelector=status.phase%3DRunning&labelSelector=app%3Distiod": dial tcp [::1]:8080: connect: connection refused
1.18.0

# 设置 KUBECONFIG 后显示应该是这样
no running Istio pods in "istio-system" # 出现这一行表示你当前集群中还没有安装 istio
1.18.0
```

## 3. 安装 istio

自动注入边车模式：

```sh
istioctl install --set profile=demo -y
```

半自动注入边车模式

- `values.global.proxy.autoInject=disabled` 设置非自动注入边车模式

```sh
istioctl install --set profile=demo --set values.global.proxy.autoInject=disabled -y
```

安装后再查看 version：

```sh
-> # istioctl version
client version: 1.18.0
control plane version: 1.18.0
data plane version: 1.18.0 (2 proxies)
```

设置 namespace 标签：

- `default` 命名空间名称

```sh
kubectl label namespace default istio-injection=enabled --overwrite
```

查看 namespace 标签：

- ISTIO-INJECTION 如果是 enabled 表示可以注入边车，disabled 表示不注入边车

```sh
# 查看
kubectl get namespace -L istio-injection

NAME                        STATUS   AGE     ISTIO-INJECTION
default                       Active    10m     enabled
```

## 4. 注入边车

### 4.1. 自动注入边车

默认安装时 `values.global.proxy.autoInject=enabled`，则新部署的 POD 会启动边车。

如果新部署的 pod 不允许带边车 sidecar，需要额外设置 label，标记不加载 sidecar

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
        labels:
            app: my-app
        annotations:
            sidecar.istio.io/inject: "false" # false 标记不加载 sidecar
    spec:
      containers:
      - name: my-app
        image: my-image:v1
        ports:
        - containerPort: 80
```

## 5. 手动注入边车

如果安装是设置 `values.global.proxy.autoInject=disabled` 则新部署的 POD 不会启动边车。

指定某应用加载 sidecar,需要设置 label 标签。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
        labels:
            app: my-app
        annotations:
            sidecar.istio.io/inject: "true" # true 标记加载 sidecar
    spec:
      containers:
      - name: my-app
        image: my-image:v1
        ports:
        - containerPort: 80
```










## 6. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
