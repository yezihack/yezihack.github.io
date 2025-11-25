---
title: "OpenYurt 完整使用手册 - 从入门到实践"
date: 2025-10-29T17:37:54+08:00
lastmod: 2025-10-29T17:37:54+08:00
draft: false
tags: ["kubernetes", "openyurt"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

## 目录

1. [什么是 OpenYurt](#什么是-openyurt)
2. [核心概念与架构](#核心概念与架构)
3. [环境准备](#环境准备)
4. [快速开始](#快速开始)
5. [集群部署详解](#集群部署详解)
6. [边缘节点管理](#边缘节点管理)
7. [边缘应用部署](#边缘应用部署)
8. [进阶特性](#进阶特性)
9. [运维与监控](#运维与监控)
10. [故障排查](#故障排查)
11. [最佳实践](#最佳实践)

---

## 什么是 OpenYurt

### 简介

OpenYurt 是阿里云开源的边缘计算平台，基于原生 Kubernetes 构建，专门为边缘计算场景设计。它将 Kubernetes 的能力无缝延伸到边缘端，使云端和边缘能够协同工作。

### 核心优势

- **非侵入式**：无需修改 Kubernetes 核心代码
- **云边协同**：支持云端统一管理边缘资源
- **边缘自治**：网络断连时边缘节点可独立运行
- **原生兼容**：完全兼容 Kubernetes API 和生态
- **轻量化**：针对边缘资源受限场景优化

### 适用场景

- **物联网 (IoT)**：设备管理、数据采集
- **CDN 边缘节点**：内容分发、边缘缓存
- **智慧城市**：交通监控、视频分析
- **工业互联网**：设备监控、生产管理
- **5G MEC**：边缘计算、低延迟应用

---

## 核心概念与架构

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                Cloud (云端)                      │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Kube-APIServer│  │  YurtHub      │            │
│  └──────────────┘  │  (云端代理)    │            │
│  ┌──────────────┐  └──────────────┘            │
│  │ YurtManager  │  ┌──────────────┐            │
│  │ (控制器)      │  │ YurtIoTDock  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                       │
                       │ 不稳定网络
                       │
┌─────────────────────────────────────────────────┐
│                Edge (边缘)                       │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  YurtHub     │  │   Kubelet    │            │
│  │ (边缘代理)    │  └──────────────┘            │
│  │ (缓存/过滤)   │  ┌──────────────┐            │
│  └──────────────┘  │  容器运行时   │            │
│                    └──────────────┘            │
└─────────────────────────────────────────────────┘
```

### 核心组件

#### 1. **YurtHub**
- 边缘节点的本地代理
- 缓存云端数据，实现边缘自治
- 网络断连时提供本地服务

#### 2. **YurtManager**
- 云端控制器集合
- 管理节点池、单元化部署
- 处理边缘特有的工作负载

#### 3. **Raven**
- 跨公网的边缘容器网络方案
- VPN 隧道，打通云边网络

#### 4. **YurtIoTDock**
- IoT 设备管理
- 支持多种 IoT 协议（MQTT、Modbus 等）

### 关键概念

#### NodePool (节点池)
将地理位置相近或属性相同的边缘节点分组管理。

```yaml
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: beijing-pool
spec:
  type: Edge
  selector:
    matchLabels:
      region: beijing
```

#### UnitedDeployment (单元化部署)
跨多个节点池部署应用，每个节点池运行独立副本。

---

## 环境准备

### 系统要求

**云端节点（Master）：**
- CPU: 2 核以上
- 内存: 4GB 以上
- 操作系统: Ubuntu 20.04+, CentOS 7.9+
- Kubernetes: 1.20+

**边缘节点（Worker）：**
- CPU: 1 核以上
- 内存: 1GB 以上
- 支持容器运行时（Docker/Containerd）

### 准备工作

```bash
# 1. 关闭 swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 2. 关闭防火墙（或开放必要端口）
sudo systemctl stop firewalld
sudo systemctl disable firewalld

# 3. 禁用 SELinux
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

# 4. 加载内核模块
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 5. 配置内核参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

### 安装容器运行时

**安装 Containerd：**

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y containerd

# CentOS
sudo yum install -y containerd

# 生成默认配置
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# 修改 cgroup 驱动为 systemd
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 启动服务
sudo systemctl restart containerd
sudo systemctl enable containerd
```

---

## 快速开始

### 方式一：使用 yurtadm 快速部署

#### 1. 下载 yurtadm

```bash
# 下载最新版本
export YURT_VERSION=v1.4.0
wget https://github.com/openyurtio/openyurt/releases/download/${YURT_VERSION}/yurtadm

# 添加执行权限
chmod +x yurtadm
sudo mv yurtadm /usr/local/bin/
```

#### 2. 初始化云端集群

```bash
# Master 节点执行
sudo yurtadm init \
  --apiserver-advertise-address=<MASTER_IP> \
  --openyurt-version=latest \
  --passwd=<YOUR_PASSWORD>

# 等待初始化完成，保存输出的 join 命令
```

#### 3. 加入边缘节点

```bash
# Edge 节点执行
sudo yurtadm join <MASTER_IP>:6443 \
  --token=<TOKEN> \
  --node-type=edge \
  --discovery-token-ca-cert-hash sha256:<HASH> \
  --cri-socket=unix:///run/containerd/containerd.sock
```

#### 4. 验证集群

```bash
# Master 节点查看节点状态
kubectl get nodes

# 查看 OpenYurt 组件
kubectl get pods -n kube-system | grep yurt
```

### 方式二：转换现有 Kubernetes 集群

如果已有 Kubernetes 集群，可以直接转换为 OpenYurt：

```bash
# 1. 部署 OpenYurt 组件
kubectl apply -f https://raw.githubusercontent.com/openyurtio/openyurt/master/config/setup/all_in_one.yaml

# 2. 标记边缘节点
kubectl label node <NODE_NAME> openyurt.io/is-edge-worker=true

# 3. 重启节点上的 Pod 以注入 YurtHub
kubectl delete pod <POD_NAME> -n <NAMESPACE>
```

---

## 集群部署详解

### Master 节点配置

#### 自定义初始化参数

```bash
yurtadm init \
  --apiserver-advertise-address=192.168.1.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 \
  --openyurt-version=v1.4.0 \
  --ignore-preflight-errors=NumCPU
```

#### 配置文件方式

```yaml
# yurt-init-config.yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: v1.28.0
networking:
  podSubnet: 10.244.0.0/16
  serviceSubnet: 10.96.0.0/12
apiServer:
  extraArgs:
    enable-admission-plugins: NodeRestriction
```

```bash
sudo yurtadm init --config yurt-init-config.yaml
```

### 安装网络插件

```bash
# Flannel
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# 或 Calico
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

### 获取 Join Token

```bash
# 创建新 token（24小时有效）
yurtadm token create --print-join-command

# 创建永久 token
yurtadm token create --ttl 0

# 列出所有 token
yurtadm token list

# 删除 token
yurtadm token delete <TOKEN>
```

### 边缘节点分类

OpenYurt 支持两种节点类型：

1. **Cloud 节点**：云端节点，网络稳定
2. **Edge 节点**：边缘节点，网络不稳定

```bash
# 加入为 Cloud 节点
yurtadm join <MASTER_IP>:6443 --token=<TOKEN> --node-type=cloud

# 加入为 Edge 节点
yurtadm join <MASTER_IP>:6443 --token=<TOKEN> --node-type=edge
```

---

## 边缘节点管理

### 节点池 (NodePool)

#### 创建节点池

```yaml
# nodepool-beijing.yaml
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: beijing-pool
spec:
  type: Edge
  annotations:
    nodepool.openyurt.io/hostNetwork: "true"
  taints:
  - key: node.openyurt.io/autonomy
    value: "true"
    effect: NoSchedule
```

```bash
kubectl apply -f nodepool-beijing.yaml
```

#### 将节点加入节点池

```bash
# 方式一：使用 label
kubectl label node edge-node-1 apps.openyurt.io/nodepool=beijing-pool

# 方式二：在 join 时指定
yurtadm join <MASTER_IP>:6443 \
  --token=<TOKEN> \
  --node-type=edge \
  --node-pool=beijing-pool
```

#### 查看节点池

```bash
# 列出所有节点池
kubectl get nodepool

# 查看节点池详情
kubectl describe nodepool beijing-pool

# 查看节点池中的节点
kubectl get nodes -l apps.openyurt.io/nodepool=beijing-pool
```

### 节点自治

边缘节点在网络断连时可以继续运行：

```bash
# 查看 YurtHub 状态
systemctl status yurt-hub

# YurtHub 日志
journalctl -u yurt-hub -f

# 测试自治：模拟网络断连
sudo iptables -A OUTPUT -d <MASTER_IP> -j DROP

# 验证 Pod 仍在运行
kubectl get pods -o wide
```

### 节点维护

```bash
# 暂停调度（drain）
kubectl drain edge-node-1 --ignore-daemonsets --delete-emptydir-data

# 恢复调度
kubectl uncordon edge-node-1

# 删除节点
kubectl delete node edge-node-1
```

---

## 边缘应用部署

### 普通 Deployment

```yaml
# nginx-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-edge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      nodeSelector:
        openyurt.io/is-edge-worker: "true"
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

```bash
kubectl apply -f nginx-deployment.yaml
```

### UnitedDeployment (单元化部署)

UnitedDeployment 可以在多个节点池中分别部署应用：

```yaml
# united-deployment.yaml
apiVersion: apps.openyurt.io/v1beta1
kind: UnitedDeployment
metadata:
  name: web-app
  namespace: default
spec:
  selector:
    matchLabels:
      app: web
  workloadTemplate:
    deploymentTemplate:
      metadata:
        labels:
          app: web
      spec:
        replicas: 2
        selector:
          matchLabels:
            app: web
        template:
          metadata:
            labels:
              app: web
          spec:
            containers:
            - name: nginx
              image: nginx:1.21
              ports:
              - containerPort: 80
  topology:
    pools:
    - name: beijing-pool
      replicas: 2
    - name: shanghai-pool
      replicas: 3
  revisionHistoryLimit: 5
```

```bash
kubectl apply -f united-deployment.yaml

# 查看状态
kubectl get ud web-app
kubectl get deployment -l apps.openyurt.io/pool-name
```

### YurtAppSet (应用集)

更灵活的边缘应用编排：

```yaml
# yurtappset.yaml
apiVersion: apps.openyurt.io/v1beta1
kind: YurtAppSet
metadata:
  name: video-stream
spec:
  selector:
    matchLabels:
      app: video
  workloadTemplate:
    deploymentTemplate:
      metadata:
        labels:
          app: video
      spec:
        replicas: 1
        selector:
          matchLabels:
            app: video
        template:
          metadata:
            labels:
              app: video
          spec:
            containers:
            - name: streamer
              image: video-stream:v1
              env:
              - name: REGION
                value: "{{region}}"
  topology:
    pools:
    - name: beijing-pool
      replicas: 2
      patch:
        spec:
          template:
            spec:
              containers:
              - name: streamer
                env:
                - name: REGION
                  value: "beijing"
    - name: shanghai-pool
      replicas: 1
      patch:
        spec:
          template:
            spec:
              containers:
              - name: streamer
                env:
                - name: REGION
                  value: "shanghai"
```

### DaemonSet 优化

OpenYurt 支持将 DaemonSet 限定在特定节点池：

```yaml
# daemonset-edge.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-agent
spec:
  selector:
    matchLabels:
      app: monitor
  template:
    metadata:
      labels:
        app: monitor
    spec:
      nodeSelector:
        apps.openyurt.io/nodepool: beijing-pool
      containers:
      - name: agent
        image: monitoring-agent:v1
```

---

## 进阶特性

### 边缘流量管理

#### YurtAppDaemon

在每个节点池部署一个 Pod：

```yaml
apiVersion: apps.openyurt.io/v1beta1
kind: YurtAppDaemon
metadata:
  name: gateway
spec:
  selector:
    matchLabels:
      app: gateway
  workloadTemplate:
    deploymentTemplate:
      metadata:
        labels:
          app: gateway
      spec:
        replicas: 1
        selector:
          matchLabels:
            app: gateway
        template:
          metadata:
            labels:
              app: gateway
          spec:
            containers:
            - name: nginx
              image: nginx:1.21
  nodepoolSelector:
    matchLabels:
      type: edge
```

### 边缘设备管理

#### 安装 YurtIoTDock

```bash
# 安装设备管理组件
kubectl apply -f https://raw.githubusercontent.com/openyurtio/yurt-device-controller/main/deploy/yurt-iot-dock.yaml

# 查看组件状态
kubectl get pods -n kube-system | grep yurt-iot-dock
```

#### 接入 MQTT 设备

```yaml
# device-mqtt.yaml
apiVersion: iot.openyurt.io/v1alpha1
kind: Device
metadata:
  name: temperature-sensor
spec:
  nodePool: beijing-pool
  managed: true
  protocol: mqtt
  properties:
    - name: temperature
      description: "Temperature reading"
      accessMode: ReadOnly
      visitor:
        mqtt:
          topic: sensors/temperature
          qos: 1
```

### 跨网络通信 (Raven)

#### 部署 Raven

```bash
# 安装 Raven
kubectl apply -f https://raw.githubusercontent.com/openyurtio/raven/main/config/setup/raven.yaml

# 创建 Gateway
kubectl apply -f - <<EOF
apiVersion: raven.openyurt.io/v1beta1
kind: Gateway
metadata:
  name: beijing-gateway
spec:
  nodeSelector:
    gateway: "true"
  endpoints:
    - nodeName: edge-node-1
      underNAT: true
      port: 4500
      publicIP: 1.2.3.4
EOF
```

### 边缘存储

#### 使用 OpenEBS

```bash
# 安装 OpenEBS
kubectl apply -f https://openebs.github.io/charts/openebs-operator.yaml

# 创建 StorageClass
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: openebs-hostpath
provisioner: openebs.io/local
volumeBindingMode: WaitForFirstConsumer
EOF
```

#### 使用本地 PV

```yaml
# local-pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: edge-storage
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data/storage
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - edge-node-1
```

---

## 运维与监控

### 日志收集

#### 部署 Fluentd

```yaml
# fluentd-ds.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
```

### 监控告警

#### 部署 Prometheus

```bash
# 使用 kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

#### 监控边缘节点

```yaml
# servicemonitor-yurthub.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: yurthub
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: yurt-hub
  endpoints:
  - port: metrics
    interval: 30s
```

### 健康检查

```bash
# 检查组件健康
kubectl get componentstatuses

# 检查 YurtHub
systemctl status yurt-hub

# 检查节点池
kubectl get nodepool

# 检查边缘应用
kubectl get ud,yurtappset,yurtappdaemon
```

---

## 故障排查

### 常见问题

#### 1. 节点加入失败

**症状**：`yurtadm join` 命令执行失败

**排查步骤**：

```bash
# 检查网络连通性
ping <MASTER_IP>
telnet <MASTER_IP> 6443

# 检查 token 是否有效
yurtadm token list  # 在 Master 节点执行

# 查看详细日志
yurtadm join <MASTER_IP>:6443 --token=<TOKEN> -v=5
```

#### 2. YurtHub 无法启动

**症状**：边缘节点 Pod 无法创建

**排查步骤**：

```bash
# 查看 YurtHub 状态
systemctl status yurt-hub

# 查看日志
journalctl -u yurt-hub -n 100

# 检查配置文件
cat /etc/kubernetes/manifests/yurt-hub.yaml

# 重启 YurtHub
systemctl restart yurt-hub
```

#### 3. 边缘节点自治失败

**症状**：网络断连后 Pod 被驱逐

**排查步骤**：

```bash
# 检查节点标签
kubectl get node <NODE_NAME> --show-labels | grep edge-worker

# 检查 YurtHub 缓存
curl http://127.0.0.1:10267/v1/cache/list

# 查看 kubelet 配置
ps aux | grep kubelet | grep server
```

#### 4. UnitedDeployment 不生效

**症状**：应用未按预期分布到节点池

**排查步骤**：

```bash
# 查看 UnitedDeployment 状态
kubectl describe ud <NAME>

# 查看控制器日志
kubectl logs -n kube-system -l app=yurt-manager -c yurt-manager

# 检查节点池标签
kubectl get nodes --show-labels | grep nodepool
```

### 日志收集

```bash
# 收集所有相关日志
#!/bin/bash
mkdir -p /tmp/openyurt-logs

# 系统日志
journalctl -u kubelet > /tmp/openyurt-logs/kubelet.log
journalctl -u yurt-hub > /tmp/openyurt-logs/yurt-hub.log

# Kubernetes 组件日志
kubectl logs -n kube-system -l component=kube-apiserver > /tmp/openyurt-logs/apiserver.log
kubectl logs -n kube-system -l app=yurt-manager > /tmp/openyurt-logs/yurt-manager.log

# 节点信息
kubectl get nodes -o yaml > /tmp/openyurt-logs/nodes.yaml
kubectl describe nodes > /tmp/openyurt-logs/nodes-describe.txt

# 打包
tar -czf openyurt-logs.tar.gz /tmp/openyurt-logs
```

---

## 最佳实践

### 1. 节点池规划

```yaml
# 按地理位置划分
beijing-pool:
  - 北京数据中心边缘节点
  
shanghai-pool:
  - 上海数据中心边缘节点

# 按业务类型划分
video-pool:
  - 视频处理节点
  
iot-pool:
  - IoT 设备管理节点
```

### 2. 资源限制

```yaml
# 为边缘应用设置合理的资源限制
apiVersion: v1
kind: Pod
metadata:
  name: edge-app
spec:
  containers:
  - name: app
    image: app:v1
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
```

### 3. 自治能力配置

```bash
# 设置 YurtHub 缓存时间
# /etc/kubernetes/manifests/yurt-hub.yaml
--cache-agents=kubelet,kube-proxy,flannel,coredns
--working-mode=edge
```

### 4. 网络优化

```yaml
# 使用 hostNetwork 减少网络开销
apiVersion: v1
kind: Pod
metadata:
  name: gateway
spec:
  hostNetwork: true
  containers:
  - name: nginx
    image: nginx:1.21
```

### 5. 安全加固

```bash
# 1. 定期轮换 token
yurtadm token create --ttl 24h

# 2. 使用 RBAC 限制权限
kubectl create clusterrolebinding edge-nodes \
  --clusterrole=system:node \
  --group=system:nodes

# 3. 启用 Pod 安全策略
kubectl apply -f - <<EOF
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-edge
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  runAsUser:
    rule: MustRunAsNonRoot
  fsGroup:
    rule: RunAsAny
  seLinux:
    rule: RunAsAny
EOF
```

### 6. 监控告警规则

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: edge-alerts
  namespace: monitoring
spec:
  groups:
  - name: edge-node
    interval: 30s
    rules:
    - alert: EdgeNodeDown
      expr: up{job="yurt-hub"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Edge node {{ $labels.instance }} is down"
    
    - alert: YurtHubHighMemory
      expr: process_resident_memory_bytes{job="yurt-hub"} > 500000000
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "YurtHub memory usage high"
```

### 7. 升级策略

```bash
# 灰度升级
kubectl patch ud web-app --type merge -p '
{
  "spec": {
    "topology": {
      "pools": [
        {"name": "beijing-pool", "replicas": 2},
        {"name": "shanghai-pool", "replicas": 1}
      ]
    }
  }
}'

# 滚动更新
kubectl set image deployment/nginx-edge nginx=nginx:1.22
```

### 8. 备份恢复

```bash
# 备份集群配置
kubectl get all -A -o yaml > cluster-backup.yaml
kubectl get nodepool -o yaml > nodepool-backup.yaml

# 备份 etcd
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

---

## 总结

OpenYurt 是一个强大的边缘计算平台，通过本文档，你应该已经掌握了：

✅ OpenYurt 的核心概念和架构  
✅ 从零开始部署 OpenYurt 集群  
✅ 边缘节点管理和节点池配置  
✅ 各种边缘应用的部署方式  
✅ 进阶特性的使用（设备管理、跨网络通信）
