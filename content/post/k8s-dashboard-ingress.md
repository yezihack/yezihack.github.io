---
title: "云运维笔记(4) k8s 安装 dashboard 配置 ingress"
date: 2022-11-08T16:47:30+08:00
lastmod: 2022-11-08T16:47:30+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes", "教程", "dashboard", "ingress"]
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
<!-- TOC -->

- [.1. 回顾](#1-回顾)
- [.2. 下载对应的版本](#2-下载对应的版本)
- [.3. 生成自签名的证书](#3-生成自签名的证书)
- [.4. 生成 secret](#4-生成-secret)
- [.5. 修改 dashboard.yaml 文件](#5-修改-dashboardyaml-文件)
- [.6. 部署 Dashboard](#6-部署-dashboard)
- [.7. 创建 token](#7-创建-token)
  - [.7.1. 创建 admin token](#71-创建-admin-token)
  - [.7.2. 创建某空间的 token](#72-创建某空间的-token)
- [.8. 配置 ingress-nginx](#8-配置-ingress-nginx)
- [.9. dashboard 登陆使用](#9-dashboard-登陆使用)
- [.10. 参考](#10-参考)
- [.11. 关于作者](#11-关于作者)

<!-- /TOC -->
## .1. 回顾

之前写过一篇 kuberntes-dashboard 的文章，介绍如何使用 nodeport 方式部署与访问。

[参考：第十一章 Kubernetes Dashboard](https://yezihack.github.io/k8s-dashboard.html)

本次介绍使用 ingress 域名方式访问 dashboard。

- 采用 tls 方式配置 ingress-nginx 访问 dashboard。

## .2. 下载对应的版本

访问 github 仓库：<https://github.com/kubernetes/dashboard/>

如何安装合适自己 kuberntes 版本的 Dashboard 的呢？官方发布 release 时，每个版本都有测试，当前版本支持哪些范围的 kubernetes 版本。还特意列出不完全兼容的版本信息。

在 <https://github.com/kubernetes/dashboard/releases> 找到"Compatibility"能找到完合兼容的版本信息，如图：

![k8s-dashboard-ingress-20221108192511](https://cdn.jsdelivr.net/gh/yezihack/assets/b/k8s-dashboard-ingress-20221108192511)

本次安装使用的 kubernetes 版本为：1.20

找到适合的 dashboard 版本：<https://github.com/kubernetes/dashboard/releases/tag/v2.4.0>

```sh
# 下载 YAML 
wget -O dashboard.yaml https://raw.githubusercontent.com/kubernetes/dashboard/v2.4.0/aio/deploy/recommended.yaml

# YAML 里含有的镜像：
kubernetesui/dashboard:v2.4.0
kubernetesui/metrics-scraper:v1.0.7
```

## .3. 生成自签名的证书

> 如果是公网证书则跳过

- 使用自签名证书，去掉 dashboard.yaml 生成证书。

```sh
# 创建目录
mkdir certs
# 进入目录，准备生成证书
cd certs
# req 生成证书签名请求
# -newkey 生成新的私钥文件
# -keyout 生成新的私钥文件
# -out 生成的CS文件
# -days 证书有效期，3650天，即10年
# -subj 生成CSR证书的参数
openssl req -newkey rsa:2048 -nodes -keyout dash.k8s.io.key -x509 -days 3650 -out dash.k8s.io.crt -subj "/C=CN/ST=Beijing/L=Beijing/O=Kubernetes/OU=K8S/CN=dash.k8s.io"

# X.509证书包含三个文件：key，csr，crt。
### key是服务器上的私钥文件，用于对发送给客户端数据的加密，以及对从客户端接收到数据的解密
### csr是证书签名请求文件，用于提交给证书颁发机构（CA）对证书签名
### crt是由证书颁发机构（CA）签名后的证书，或者是开发者自签名的证书，包含证书持有人的信息，持有人的公钥，以及签署者的签名等信息

# 查看 crt 证书信息
openssl x509 -noout -text -in dash.k8s.io.crt
```

## .4. 生成 secret

crt 和 key 文件修改 dashboard.yaml 需要使用到：

- cert 文件名：dash.k8s.io.crt
- key 文件名：dash.k8s.io.key

```sh
# 创建命名空间
kubectl create ns kubernetes-dashboard

# 在 kubernetes-dashboard 空间下创建 secret 
## secret=kubernetes-dashboard-certs 固定的名称，请勿修改。
kubectl create secret tls kubernetes-dashboard-certs --cert=dash.k8s.io.crt --key=dash.k8s.io.key -n kubernetes-dashboard
```

## .5. 修改 dashboard.yaml 文件

- 注释掉 dashboard.yaml 自动生成的证书。
- 使用自签名的证书。

```sh
vim dashboard.yaml

# 找到 Deployment name=kubernetes-dashboard

```

```yaml
# 注释 kubernetes-dashboard-certs 名称，因为前面生成了自签名的 secret，注意名称必须与这个名称一致。

# apiVersion: v1
# kind: Secret
# metadata:
#   labels:
#     k8s-app: kubernetes-dashboard
#   name: kubernetes-dashboard-certs  # 替换成手动生成的 secret 文件
#   namespace: kubernetes-dashboard
# type: Opaque


# 修改第2处
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
    spec:
      containers:
        - name: kubernetes-dashboard
          image: kubernetesui/dashboard:v2.4.0          
          imagePullPolicy: Always
          resources: {}
          ports:
            - containerPort: 8443
              protocol: TCP
          args:
            # - --auto-generate-certificates # 去掉自动生成的证书
            - --namespace=kubernetes-dashboard
            - --tls-key-file=tls.key  # 生成 Secret 时默认给的名称即：tls.key
            - --tls-cert-file=tls.crt # 生成 Secret 时默认给的名称即：tls.crt
            - --token-ttl=3600   # 设置 token 的超时时间
```

为什么这样填写： `--tls-key-file=tls.key`, `--tls-cert-file=tls.crt`

- 生成 kubernetes-dashboard-certs 时，系统生成的名称即是 tls.key, tls,crt

```sh
-> # k -n kubernetes-dashboard get secret kubernetes-dashboard-certs -o yaml
```

```yaml
apiVersion: v1
data:
  tls.crt: xxx  # crt 名称
  tls.key: xxx  # key 名称
kind: Secret
metadata:
  name: kubernetes-dashboard-certs
  namespace: kubernetes-dashboard
type: kubernetes.io/tls
```

## .6. 部署 Dashboard

```sh
kubectl apply -f dashboard.yaml
```

## .7. 创建 token

dashboard 不是输入用户名和密码方式登陆，而是采用 token 和 kubeconfig 两种方式登陆。

本次介绍使用 token 方式登陆，可以赋予不同权限给 Token，从而实现权限控制。

### .7.1. 创建 admin token

本 token 具体超级权限，可以访问整个集群，分享权限时，慎重操作。

想要控制权限范围，给新用户添加访问权限控制，需要创建普通 token。

```yaml

# 创建 serviceAccount 帐号名称
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard

---
# 将 clustrole 与 serviceAccount 进行绑定
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
---

```

查看 token 字符串：

```sh
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')
```

### .7.2. 创建某空间的 token

假设我们需要给某用户授权 general 命名空间下的权限:

- pods
- deployments,
- configmaps
- services
- statefulsets
- ingresses

注意：pods 没有删除权限，只有 list, get, watch 权限。

文件名： create-general.yaml

```yaml
######################## 创建指定命名空间下的 token #############################
apiVersion: v1
kind: ServiceAccount
metadata:
  name: general-user
  namespace: general # 权限限制的操作的命名空间
  annotations:
     remark: "创建一个 ServiceAccount 帐号" 
  
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: general # 权限限制的操作的命名空间
  name: role-general
  annotations:
     remark: "创建一个角色名称，即这个角色可以做什么" 
rules:
- apiGroups: [""]
  resources: ["pods"] # 可以操作的对象，如 pods
  verbs: ["get", "watch", "list"] # 如何操作，具有的权限
- apiGroups: ["extensions", "apps"] 
  resources: ["deployments", "configmaps", "services", "statefulsets", "ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: role-bind-cnych
  namespace: general # 权限限制的操作的命名空间
  annotations:
     remark: "将 ServiceAccount 与 Role 进行绑定在一起，给用户赋予角色操作权限" 
subjects:
- kind: ServiceAccount 
  name: general-user # serviceAccount 帐号名称
  namespace: general # 权限限制的操作的命名空间
roleRef:
  kind: Role
  name: role-aipoc  # 绑定的角色
  apiGroup: rbac.authorization.k8s.io
````

查看 token:

```sh
kubectl -n general describe secret $(kubectl -n general get secret | grep aipoc-user | awk '{print $1}')
```

## .8. 配置 ingress-nginx

需要配置自定义的域名：dash.k8s.io，使用 ingress-nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: kube-ingress
  namespace: kubernetes-dashboard
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.kubernetes.io/ingress.class: "nginx"  # 指定 nginx
    # 默认为 true，启用 TLS 时，http请求会 308 重定向到https
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    # 默认为 http，开启后端服务使用 proxy_pass https://协议
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  tls:
    - hosts:
        - dash.k8s.io
      secretName: kubernetes-dashboard-certs
  rules:
    - host: dash.k8s.io # kibana & es 配置
      http:
        paths:
          - path: /
            backend:
              serviceName: kubernetes-dashboard
              servicePort: 443
```

注意：`nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"` 默认为 HTTP

因为 ingress-nginx 代理 kubernetes-dashboard 443 端口，必须要设置 `nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"` ，若不设置则无法访问。

> 区别在于 proxy_pass

如果设置 backend-protocal = http

```nginx
proxy_pass http://upstream_balancer;
```

如果设置 backend-protocal = https

```nginx
proxy_pass https://upstream_balancer;
```

## .9. dashboard 登陆使用

请求地址：<https://dash.k8s.io:8884/#/login>

将配置好的 token 输入到界面中，即可登陆。

![k8s-dashboard-ingress-20221108212346](https://cdn.jsdelivr.net/gh/yezihack/assets/b/k8s-dashboard-ingress-20221108212346)

## .10. 参考

1. [为kubernetes dashboard访问用户添加权限控制](https://www.qikqiak.com/post/add-authorization-for-kubernetes-dashboard/)


## .11. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)