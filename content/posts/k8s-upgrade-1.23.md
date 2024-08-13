---
title: "Kubernetes v1.22 升级至 v1.23"
date: 2024-08-12T16:40:47+08:00
lastmod: 2024-08-12T16:40:47+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes", "云运维笔记", "linux"]
categories: ["kubernetes", "k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

# Kubernetes 升级操作

## 1. 目录
<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [Kubernetes 升级操作](#kubernetes-升级操作)
  - [1. 目录](#1-目录)
  - [2. 升级需知](#2-升级需知)
  - [3. 升级流程](#3-升级流程)
  - [4. 检查集群](#4-检查集群)
  - [5. 备份操作](#5-备份操作)
    - [5.1. 备份 etcd 数据](#51-备份-etcd-数据)
    - [5.2. 备份 flannel 二进制文件](#52-备份-flannel-二进制文件)
    - [5.3. 备份 kubernetes 文件](#53-备份-kubernetes-文件)
  - [6. 升级主master](#6-升级主master)
    - [6.1. 查看当前版本](#61-查看当前版本)
    - [6.2. 设置版本号](#62-设置版本号)
  - [7. 规划升级版本](#7-规划升级版本)
  - [8. 查询](#8-查询)
  - [9. 升级主master](#9-升级主master)
    - [9.1. 设置版本号](#91-设置版本号)
    - [9.2. 获取当前集群配置](#92-获取当前集群配置)
    - [9.3. kubeadm 升级](#93-kubeadm-升级)
    - [9.4. 查看计划\&差异](#94-查看计划差异)
    - [9.5. 升级主master](#95-升级主master)
    - [9.6. 升级组件](#96-升级组件)
    - [9.7. 验证升级](#97-验证升级)
  - [10. 升级其它 master](#10-升级其它-master)
  - [11. 升级 worker 节点](#11-升级-worker-节点)
    - [11.1. 排空节点](#111-排空节点)
    - [11.2. 升级节点](#112-升级节点)
    - [11.3. 验证](#113-验证)
  - [12. 回滚](#12-回滚)
  - [13. 参考](#13-参考)

<!-- /TOC -->

## 2. 升级需知

1. Kubernetes 是不可以进行跨版本升级的，只能一个版本一个版本的升级。
2. 如果是多个master节点，每个节点逐一升级，确保一个控制节点升级完成后再升级下一个，保障系统的高可用始终有两个是健康的。
3. kubeadm upgrade 不会影响你的工作负载，只会涉及 Kubernetes 内部的组件，但备份终究是好的。
4. 升级后，因为容器规约的哈希值已更改，所有容器都会被重新启动。
5. 控制面节点上的升级过程应该每次处理一个节点。
6. 需要腾空 master 节点。

## 3. 升级流程

1. 升级主控制平面节点
2. 升级其他控制平面节点
3. 升级工作节点

## 4. 检查集群

```sh
# 检查集群版本
kubectl version

# 检查集群状态
kubectl get nodes

# 检查集群组件状态
kubectl get componentstatuses

# 检查集群资源
kubectl get pods --all-namespaces
```

## 5. 备份操作

1. 备份 etcd 数据。
2. 备份 flannel 二进制文件(若网络插件为flannel)
3. `/etc/kubernetes` 目录下所有文件备份

```sh
# 创建备份目录
backup_dir=/opt/backup-$(date +%F)
mkdir -p $backup_dir
```

### 5.1. 备份 etcd 数据

```sh
# 备份 etcd 数据
cd /var/lib/etcd
## 查看集群状态
etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key endpoint status --write-out=table

etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key endpoint health --write-out=table

## 开启备份
etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/peer.crt --key=/etc/kubernetes/pki/etcd/peer.key --endpoints=127.0.0.1:2379 snapshot save backup-etcd.db

## 验证备份文件
etcdctl snapshot status backup-etcd.db --write-out=table

## 宿主机上可以查看到备份文档
ls -l /var/lib/etcd/backup-etcd.db
## 移动到备份目录
mv /var/lib/etcd/backup-etcd.db $backup_dir/backup-etcd.db
```

### 5.2. 备份 flannel 二进制文件

```sh
cd $backup_dir
cp /opt/cni/bin/flannel $backup_dir/flannel
```

### 5.3. 备份 kubernetes 文件

```sh
cp -a /etc/kubernetes/ /etc/kubernetes.bak-$(date +%F)
```

## 6. 升级主master

### 6.1. 查看当前版本

设置 k8s 源

```sh
# 查看是否有 k8s 源
ls -l /etc/yum.repos.d/kubernetes.repo

# 设置 k8s 源
cat > /etc/yum.repos.d/kubernetes.repo << EOF 
[kubernetes] 
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64 
enabled=1 
gpgcheck=0 
epo_gpgcheck=0 
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg 
https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg 
EOF
```

```sh
# 查看目录支持所有 k8s 版本
yum list --showduplicates kubeadm --disableexcludes=kubernetes
```

### 6.2. 设置版本号

```sh
k8s_version="1.23.17"
```

## 7. 规划升级版本

- 当前 k8s 版本：1.22.17
- 升级目标版本：1.23.17
- 升级步骤：1.22.17 -> 1.23.17

## 8. 查询

```sh
kubeadm config images list --image-repository=registry.aliyuncs.com/google_containers
kubeadm config images list --image-repository=registry.aliyuncs.com/google_containers --kubernetes-version=v1.23.16
kubeadm config images list --config=kubeadm-config.yaml
```

## 9. 升级主master

### 9.1. 设置版本号

```sh
k8s_version="1.23.17"
```

### 9.2. 获取当前集群配置

```sh
mkdir -p /opt/k8s-upgrade
cd /opt/k8s-upgrade
kubectl -n kube-system get cm kubeadm-config -o yaml > kubeadm-config.yaml
```

- 只取：`data.ClusterConfiguration` 内容，如下实例：

```yaml
apiServer:
  extraArgs:
    authorization-mode: Node,RBAC
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: v1.23.17 # 修改升级版本
networking:
  dnsDomain: cluster.local
  podSubnet: 10.244.0.0/16
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

### 9.3. kubeadm 升级

升级 kubeadm

```sh
yum install -y kubeadm-$k8s_version-0 --disableexcludes=kubernetes
```

### 9.4. 查看计划&差异

```sh
# 检查可升级版本
kubeadm upgrade plan v$k8s_version

# 查看可升级版本差异
kubeadm upgrade diff v$k8s_version --config kubeadm-config.yaml
```

> `--config kubeadm-config.yaml` 也可以不加

### 9.5. 升级主master

- 若多个 master 节点，先升级一个节点，升级完成后，再升级其他节点。

```sh
export master_node="master-1"
# 先 cordon  master 节点
kubectl cordon $master_node

# 从集群中驱逐升级的节点
kubectl drain $master_node --ignore-daemonsets --delete-local-data=true

# 升级主master(测试)
## 结束：[dryrun] Finished dryrunning successfully!
kubeadm upgrade apply v$k8s_version --config kubeadm-config.yaml --dry-run

# 升级控制平面
kubeadm upgrade apply v$k8s_version --config kubeadm-config.yaml 

# 取消对控制面节点的保护
kubectl uncordon $master_node
```

> `--config kubeadm-config.yaml` 也可以不加

特殊情况:

- 不升级证书

```sh
# 不升级证书
kubeadm upgrade apply v$k8s_version --certificate-renewal=false --config kubeadm-config.yaml 

# 查看证书时间
kubeadm certs check-expiration
```

### 9.6. 升级组件

```sh
yum install -y kubelet-$k8s_version-0 kubectl-$k8s_version-0 --disableexcludes=kubernetes

# 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet
```

### 9.7. 验证升级

```sh
# 查看集群版本
kubectl version

# 查看节点状态
kubectl get nodes
```

## 10. 升级其它 master

```sh
export master_node="master-2"
# 先让节点变的不可调度
kubectl cordon $master_node

# 腾空节点
kubectl drain $master_node --ignore-daemonsets --delete-local-data=true

# 安装 kubeadm，kubectl，kubelet
yum install -y kubeadm-$k8s_version --disableexcludes=kubernetes

# 测试运行
kubeadm upgrade node --config kubeadm-config.yaml --dry-run

# 升级 worker 节点
kubeadm upgrade node  --config kubeadm-config.yaml

# 取消对控制面节点的保护
kubectl uncordon $master_node

# 升级 kubelet,kubectl
yum install -y kubelet-$k8s_version kubectl-$k8s_version --disableexcludes=kubernetes

# 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet

# 查看节点状态
kubectl get nodes
```

## 11. 升级 worker 节点

### 11.1. 排空节点

- 在 master 节点上操作

```sh
# 设置 work 节点名称
work_node="work-1"

# 先让节点变的不可调度
kubectl cordon $work_node

# 腾空节点
kubectl drain $work_node --ignore-daemonsets --delete-local-data=true

# 解除
kubectl uncordon $work_node
```

### 11.2. 升级节点

- 在工作节点上操作

```sh
# 设置版本号
k8s_version="1.23.17"

# 安装 kubeadm，kubectl，kubelet
yum install -y kubeadm-$k8s_version-0 kubelet-$k8s_version-0 kubectl-$k8s_version-0 --disableexcludes=kubernetes

# 测试运行
kubeadm upgrade node --dry-run

# 升级 worker 节点
kubeadm upgrade node 

# 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet
```

### 11.3. 验证

```sh
kubectl get nodes 

kubectl get pod -n kube-system

kubectl get pod -A
```

## 12. 回滚

```sh
rollback_k8s_version="1.22.17"
# 暂停kubelet 服务
systemctl stop kubelet

# 3、卸载新版本
yum remove -y kubelet kubeadm kubectl

# 4、安装回原来的版本
yum install -y kubeadm-$rollback_k8s_version kubectl-$rollback_k8s_version kubelet-$rollback_k8s_version

# 5、配置文件回滚
rsync -avP /etc/kubernetes.old/ /etc/kubernetes/

# 6、启动kubelet 服务
systemctl daemon-reload
systemctl start kubelet

# 7、查看当前配置
kubectl version --short
```

## 13. 参考

- <https://www.rhce.cc/3703.html>
