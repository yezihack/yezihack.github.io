---
title: "云运维笔记(9) Kubernetes Pod 调度策略"
date: 2022-12-16T18:14:20+08:00
lastmod: 2022-12-16T18:14:20+08:00
draft: false
tags: ["linux", "教程", "云运维笔记", "调度", "k8s"]
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

- [1.1. 四大调度方式](#11-四大调度方式)
  - [1.1.1. 自动调试](#111-自动调试)
  - [1.1.2. 定向调度](#112-定向调度)
    - [1.1.2.1. NodeName](#1121-nodename)
    - [1.1.2.2. NodeSelector](#1122-nodeselector)
  - [1.1.3. 亲和性调度](#113-亲和性调度)
    - [1.1.3.1. NodeAffinity](#1131-nodeaffinity)
    - [1.1.3.2. PodAffinity](#1132-podaffinity)
    - [1.1.3.3. PodAntiAffinity](#1133-podantiaffinity)
  - [1.1.4. 污点（容忍）调度](#114-污点容忍调度)
    - [1.1.4.1. 污点](#1141-污点)
    - [1.1.4.2. 容忍](#1142-容忍)
- [1.2. 参考](#12-参考)
- [关于作者](#关于作者)

<!-- /TOC -->

## 1.1. 四大调度方式

1. 自动调度：运行在哪个节点上完全由`Scheduler`经过一系列的算法计算得出
1. 定向调度：NodeName、NodeSelector
1. 亲和性调度：NodeAffinity、PodAffinity、PodAntiAffinity
1. 污点（容忍）调度：Taints、Toleration

### 1.1.1. 自动调试

完全交由 kube-scheduler 来决定 pod 调度到哪里，不受人为控制。

### 1.1.2. 定向调度

#### 1.1.2.1. NodeName

NodeName用于强制约束将Pod调度到指定的Name的Node节点上。这种方式，其实是直接跳过Scheduler的调度逻辑，直接将Pod调度到指定名称的节点。

使用实例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodename
  namespace: dev
spec:
  nodeName: kube-11 # 指定调度到node1节点上
  containers:
    - name: nginx
      image: nginx:1.17.1  
```

tip: 这种调度不够灵活，必须指定某 node 节点，若 node 异常会导致调度失败。

#### 1.1.2.2. NodeSelector

NodeSelector 用于将 pod 调度到添加了指定标签的 node 节点上。它是通过 kubernetes 的label-selector机制实现的。

使用实例：

```sh
# 给 node 机器打上标签
k label no kube-11 node-type=cpu
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeselector
  namespace: dev
spec:
  nodeSelector:
    node-type: cpu # 指定调度到具有 node-type=cpu 标签的节点上
  containers:
    - name: nginx
      image: nginx:1.17.1
```

tip: 相对于 nodeName 调度方式更加灵活一些，不再局限于某 node 节点。而是选择 node 上的标签进行调度。

### 1.1.3. 亲和性调度

亲和性是一大调度特色，适应了大多数场景而且做到了非常灵活的调度。

关于亲和性(反亲和性)使用场景的说明：

- 亲和性：如果两个应用频繁交互，那就有必要利用亲和性让两个应用的尽可能的靠近，这样可以减少因网络通信而带来的性能损耗。

- 反亲和性：当应用的采用多副本部署时，有必要采用反亲和性让各个应用实例打散分布在各个node上，这样可以提高服务的高可用性。

亲和性又分硬限制与软限制：

- `requiredDuringSchedulingIgnoredDuringExecution` 必须满足条件才能调度。
- `preferredDuringSchedulingIgnoredDuringExecution` 尽量满足条件，不满足也没关系。

#### 1.1.3.1. NodeAffinity

以node为目标，解决pod可以调度到哪些node的问题

使用实例：

- 硬限制

硬限制，label 值必须存在才能调到成功，否则调度失败。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeaffinity-required
  namespace: dev
spec:
  affinity: #亲和性设置
    nodeAffinity: #设置node亲和性
      requiredDuringSchedulingIgnoredDuringExecution: # 硬限制
        nodeSelectorTerms:
          - matchExpressions: # 匹配 env 的值在["xxx","yyy"]中的标签
              - key: node-type
                operator: In # 支持：In, NotIn, Exists, DoesNotExist, Gt, Lt
                values: ["cpu", "gpu"]
  containers:
    - name: nginx
      image: nginx:1.17.1
      resources: {}
```

- 软限制

相比硬限制，会尽量调到存在 label 的机器上，不存在的 label 值也会被调度成功。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-nodeaffinity-preferred
  namespace: dev
spec:
  affinity: #亲和性设置
    nodeAffinity: #设置node亲和性
      preferredDuringSchedulingIgnoredDuringExecution: # 软限制
        - weight: 1 # 权重 取值范围是 1 到 100，在调度器为 Pod 作出调度决定时，总分最高的节点的优先级也最高。
          preference: # 优先调度，尽量调度
            matchExpressions: # 匹配规则
              - key: node-type # 存在 node label
                operator: In # 包括
                values: # label 值，如果不存在则也会调度成功。
                  - net 
                  - gpu
  containers:
    - name: nginx
      image: nginx:1.17.1
```

#### 1.1.3.2. PodAffinity

PodAffinity主要实现以运行的Pod为参照，实现让新创建的Pod跟参照pod在一个区域的功能。

使用实例：

- 硬限制

硬限制，应用 label app=nginx 值必须存在才能调到成功，否则调度失败。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-podaffinity-required
  namespace: dev
spec:
  affinity: #亲和性设置
    podAffinity: #设置pod亲和性
      requiredDuringSchedulingIgnoredDuringExecution: # 硬限制
        - labelSelector: # label 选择器
            matchExpressions: # 匹配env的值在["xxx","yyy"]中的标签
              - key: app  # 某应用 app=nginx, app=kong
                operator: In
                values: ["nginx", "kong"]
          topologyKey: kubernetes.io/hostname
  containers:
    - name: nginx
      image: nginx:1.17.1
```

- 软限制

相比硬限制，会尽量调到存在应用 label app=nginx，不存在的应用 label app=nginx 值也会被调度成功。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-podaffinity-preferred
  namespace: dev
spec:
  affinity: #亲和性设置
    podAffinity: #设置pod亲和性
      preferredDuringSchedulingIgnoredDuringExecution: # 软限制
        - weight: 100 # 权重，取值范围：0~100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - pod-nodeselector
            topologyKey: kubernetes.io/hostname
  containers:
    - name: nginx
      image: nginx:1.17.1
```

#### 1.1.3.3. PodAntiAffinity

PodAntiAffinity主要实现以运行的Pod为参照，让新创建的Pod跟参照pod不在一个区域中的功能。

使用实例：

- 硬限制

硬限制，应用 label app=pod-nodeselector 值必须存在才能调到成功，否则调度失败。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-podantiaffinity-required
  namespace: dev
  annotations:
    info: "pod 反亲和性之硬限制"
spec:
  selector:
    matchLabels:
      app: deploy-podantiaffinity-required
  template:
    metadata:
      labels:
        app: deploy-podantiaffinity-required
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - pod-nodeselector
            topologyKey: "kubernetes.io/hostname"
      containers:
        - name: client
          image: nginx:1.17.1

```

- 软限制

相比硬限制，会尽量调到存在应用 label app=store ，不存在的应用 label app=store 值也会被调度成功。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-podantiaffinity-preferred
  namespace: dev
  annotations:
    info: "pod 反亲和性之软限制"
spec:
  selector:
    matchLabels:
      app: deploy-podantiaffinity-preferred
  template:
    metadata:
      labels:
        app: deploy-podantiaffinity-preferred
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - store
              topologyKey: "kubernetes.io/hostname"
      containers:
        - name: client
          image: nginx:1.17.1
```

### 1.1.4. 污点（容忍）调度

前面的调度方式都是站在Pod的角度上，通过在Pod上添加属性，来确定Pod是否要调度到指定的Node上，其实我们也可以站在Node的角度上，通过在Node上添加污点属性，来决定是否允许Pod调度过来。

Node被设置上污点之后就和Pod之间存在了一种相斥的关系，进而拒绝Pod调度进来，甚至可以将已经存在的Pod驱逐出去。

污点的格式为：key=value:effect, key和value是污点的标签，effect描述污点的作用，支持如下三个选项：

- PreferNoSchedule：kubernetes将尽量避免把Pod调度到具有该污点的Node上，除非没有其他节点可调度
- NoSchedule：kubernetes将不会把Pod调度到具有该污点的Node上，但不会影响当前Node上已存在的Pod
- NoExecute：kubernetes将不会把Pod调度到具有该污点的Node上，同时也会将Node上已存在的Pod驱离

![20221216180240](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20221216180240.png)

#### 1.1.4.1. 污点

使用kubectl设置和去除污点的命令示例如下：

```sh
# 设置污点
kubectl taint nodes node1 key=value:effect

# 去除污点
kubectl taint nodes node1 key:effect-

# 去除所有污点
kubectl taint nodes node1 key-
```

#### 1.1.4.2. 容忍

上面介绍了污点的作用，我们可以在node上添加污点用于拒绝pod调度上来，但是如果就是想将一个pod调度到一个有污点的node上去，这时候应该怎么做呢？这就要使用到容忍。

污点就是拒绝，容忍就是忽略，Node通过污点拒绝pod调度上去，Pod通过容忍忽略拒绝

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-toleration
  namespace: dev
  labels:
    app: pod-toleration
spec:
  tolerations:      # 添加容忍
  - key: "node-role.kubernetes.io/master"        # 要容忍的污点的key
    operator: "Exists" # 操作符 支持Equal和Exists
    # value: ""    # 容忍的污点的value
    effect: "NoSchedule"   # 添加容忍的规则，这里必须和标记的污点规则相同
    # tolerationSeconds: 10 # 容忍时间, 当effect为NoExecute时生效，表示pod在Node上的停留时间。如果为0或负则立即驱逐。
  containers:
    - name: nginx
      image: nginx:1.17.1
```

## 1.2. 参考

1. <https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/assign-pod-node/>

## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
