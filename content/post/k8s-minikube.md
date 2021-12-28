---
title: "第十二章 Minikube 安装"
date: 2021-12-28T17:39:06+08:00
lastmod: 2021-12-28T17:39:06+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes", "k8s安装"]
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

# Minikube 安装

> 仅用于开产使用，生产不能使用。
以下仅以 macOS 系统演示

## 1.1 Docker 安装

官方下载，直接安装即可。

[https://docs.docker.com/desktop/mac/install/](https://docs.docker.com/desktop/mac/install/)



使用国内镜像源，推荐阿里云的。

参考：[https://sgfoot.com/docker-install.html#docker-加速](https://sgfoot.com/docker-install.html#docker-%E5%8A%A0%E9%80%9F)

## 1.2 Kubectl 安装

Kubernetes 命令行工具，[kubectl](https://kubernetes.io/docs/reference/kubectl/kubectl/)，使得你可以对 Kubernetes 集群运行命令。 你可以使用 kubectl 来部署应用、监测和管理集群资源以及查看日志。

官方下载，有详细的安装流程。支持：windows, linux, macOS

参考：[https://kubernetes.io/zh/docs/tasks/tools/install-kubectl-macos/](https://kubernetes.io/zh/docs/tasks/tools/install-kubectl-macos/)

```sh
# Apple Silicon M1 cpu
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl"
 
# Intel cpu
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"

```

添加权限，加入 PATH 目录

```bash
# 添加执行权限
chmod +x ./kubectl

# 移动到path目录，全局可访问
sudo mv ./kubectl /usr/local/bin/kubectl
sudo chown root: /usr/local/bin/kubectl

# 查看版本
kubectl version --client
```

查看配置，[了解更多 kubectl 命令](https://kubernetes.io/zh/docs/reference/kubectl/overview/) 

```bash
# 查看 kubectl 配置，即读这里的信息：cat ~/.kube/config
kubectl config view 
```

## 1.3 Minikube安装

minikube 是一个单节点的 Kubernetes 集群，用于本地开展开发工作。

官方下载二进制包，选择你对应的操作系统。

下载地址：[https://minikube.sigs.k8s.io/docs/start/](https://minikube.sigs.k8s.io/docs/start/)

```bash
# 添加执行权限
chmod +x ./minikube

# 移动到path目录，全局可访问
sudo mv ./minikube /usr/local/bin/minikube
sudo chown root: /usr/local/bin/minikube

# 启动集群
minikube start --image-mirror-country='cn'
	# cn 表示使用国内镜像源
```

参考：[https://developer.aliyun.com/article/221687](https://developer.aliyun.com/article/221687)

## 1.4 运行一个完整的 web nginx 应用

> 采用声明式对象配置安装一个 nginx 应用
> 格式：kubectl apply -f  file-example.yaml

新建  `web-nginx.yaml`

1. 创建一个 web 命名空间
2. 创建一个 Deployment ，将其运行在 web 空间下
3. 创建一个 Service 服务，用于暴露服务

> Yaml 简单语法说明：采用 key: value 形式，冒号后必须加一个空格，缩进以空格为主，三个中划线（---）表示在一个 yaml 文件里分隔多个yaml文件。[更多 yaml 语法学习](https://www.ruanyifeng.com/blog/2016/07/yaml.html)

以下 web-nginx.yaml  一个文件里写了三处中划线，相当于三个 yaml

```yaml
# 1. 创建一个独立的命名空间，方便做隔离区分。
apiVersion: v1
kind: Namespace
metadata: 
  name: web  # 创建一个新的命名空间

---
# 2. 创建一个 deployment，设置 3 个副本数
apiVersion: apps/v1
kind: Deployment   # 定义 deployment 对象，进行创建多个pod
metadata: 
  name: web-nginx-deployment  # deployment 名称
  namespace: web          # 所属命名空间
spec:
  selector:             # 选择标签
    matchLabels:        # 采用匹配方式
      app: web-nginx        # 标签名称: key : value 形式。即选择template下面 metadata.abels 定义的标签pod
  replicas: 3   # 定义副本数，即 pod 的数量
  template:     # 定义模板，即 pod 所需的容器
    metadata:   # 基本信息
      labels:   # 定义 labels 
        app: web-nginx # 定义 pod 的标签，采用 key:value 形式
    spec: 
      containers:  # 定义容器信息
      - name: nginx  # 名称
        image: nginx:1.14.2  # 镜像名称和版本号
        ports:   # 端口
        - containerPort: 80 # containerPort是在pod控制器中定义的、pod中的容器需要暴露的端口

---
# 3. 创建一个 servive 向外暴露服务。 采用 NodePort 方式，即在 Node 上开设一个端口
apiVersion: v1
kind: Service
metadata:
  name: web-nginx-service # 定义名称
  namespace: web          # 运行在 web 空间下
spec:
  type: NodePort    # 默认为ClusterIP，可选：NodePort（默认端口取值范围值：30000-32767), ExternalName, LoadBalancer  
  selector: 
    app: web-nginx   # 选择 app=nginx 的 deployment 
  ports: 
  - protocol: TCP     # 采用 tcp 协议
    port: 8080        # 服务访问端口，集群内部访问的端口
    targetPort: 80  # pod 控制器中定义的端口（应用访问的端口）
    #nodePort: 30003   # NodePort，外部客户端访问的端口
```

使用 `kubectl apply -f web-nginx.yaml`  创建以上定义的服务

使用以下命令查看服务:

```bash
# 查看所有的命令空间, 可以看到创建的 web 空间， ns 是 namespace 的简写
kubectl get ns 

# 查看创建的 Pod 服务, 需要使用 -n 指定命名空间
kubectl get pods -n web 

# 查看 deployment 服务， deploy 是 deployment 的简写方式
kubectl get deploy -n web

# 查看 service  服务， svc 是 service 的简写方式
kubectl get svc -n web

# 查看 endpoints 服务,可以查看到 service 通过 endpoints 关联到 deployment 服务
kubectl get ep -n web

```

service 提供的ip还只是集群内部的ip，如何验证 nginx 呢，借用 minikube 提供的 service 功能，进行代理访问。

```bash
# 列出 service 服务名称。即 web-nginx-service 名称。
kubectl get svc -n web

# 使用 minikube service 功能，注意需要指定命名空间，-n web
minikube service web-nginx-service -n web
```

更加详细的查看服务命令：

```bash
# 使用 describe 查看服务详情，适用于 pod, deployment, service, ep 等
kubectl describe  svc -n web # 查看 service 详情

# 使用 -o wide 浏览更多信息， 适用于 pod, deployment, service, ep 等
kubectl get deploy -n web -o wide

# 进入容器内部
kubectl exec -it nginx-deployment-66b6c48dd5-4js2m -n dev sh
	# nginx-deployment-66b6c48dd5-4js2m 名称是 pod 的名称。
	# 可以使用  kubectl get pods -n web 查看到名称。
	# sh 采用 shell 方式
```

## 1.5 运行Dashboard

> 官方出的 kubernetes web 界面，可以查看集群内的服务信息。
> 

```bash
# 默认打开浏览器，随机一个端口。
minikube dashboard 

# 指定端口，显示URL,推荐使用
minikube dashboard --port=52000 --url=true
```

## 参考文档

- kubernetes 官方 minikube 介绍： [https://kubernetes.io/zh/docs/tutorials/hello-minikube/](https://kubernetes.io/zh/docs/tutorials/hello-minikube/)
- kubectl 概述：[https://kubernetes.io/zh/docs/reference/kubectl/](https://kubernetes.io/zh/docs/reference/kubectl/)
- k8s 辨析 port, NodePort, targetPort, containerPort: [https://www.cnblogs.com/veeupup/p/13545361.html](https://www.cnblogs.com/veeupup/p/13545361.html)
- k8s 总纲及脑图： [https://sgfoot.com/k8s-mindmap.html](https://sgfoot.com/k8s-mindmap.html)






## 关于作者
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)