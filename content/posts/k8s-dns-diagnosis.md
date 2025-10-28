---
title: "Kubernetes 集群 DNS 解析与网络问题排查完整指南"
date: 2025-10-28T19:10:51+08:00
lastmod: 2025-10-28T19:10:51+08:00
draft: false
tags: ["k8s","network", "kubernetes", "flannel"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

## 文章概述

本文记录了一次完整的 Kubernetes 集群网络问题排查过程，从容器内 DNS 解析失败，到发现 RBAC 权限缺失，再到解决跨节点 Pod 网络不通的完整历程。适用于 Kubernetes 1.29 版本，使用 Flannel 作为 CNI 插件。

## 目录

- [问题现象](#问题现象)
- [排查思路](#排查思路)
- [问题一：kube-proxy RBAC 权限缺失](#问题一kube-proxy-rbac-权限缺失)
- [问题二：flannel RBAC 权限缺失](#问题二flannel-rbac-权限缺失)
- [问题三：双 Pod CIDR 共存导致路由问题](#问题三双-pod-cidr-共存导致路由问题)
- [故障总结与预防](#故障总结与预防)
- [DNS 问题排查通用方法论](#dns-问题排查通用方法论)

---

## 问题现象

### 环境信息

- **Kubernetes 版本**: 1.29
- **网络插件**: Flannel (VXLAN 模式)
- **集群规模**: 5 节点（3 master + 2 GPU worker）
- **故障时间**: 已运行 n 天后突然出现

### 初始症状

容器内无法进行 DNS 解析和服务访问：

```bash
# 在容器内测试
$ ping coredns.kube-system
ping: bad address 'coredns.kube-system'

$ nc -zv coredns.kube-system 53
nc: bad address 'coredns.kube-system'
```

CoreDNS Service 信息正常：

```bash
$ kubectl get svc -n kube-system coredns
NAME      TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                  AGE
coredns   ClusterIP   10.233.0.3     <none>        53/UDP,53/TCP,9153/TCP   94d
```

---

## 排查思路

遇到 DNS 问题时，应该按照以下层次进行排查：

```
应用层问题（DNS 解析）
    ↓
服务层问题（Service 无法访问）
    ↓
网络层问题（Pod 间网络不通）
    ↓
组件层问题（kube-proxy、CNI）
    ↓
权限层问题（RBAC）
    ↓
配置层问题（网络配置冲突）
```

---

## 问题一：kube-proxy RBAC 权限缺失

### 发现过程

查看 kube-proxy 日志时发现大量权限错误：

```bash
$ kubectl logs -n kube-system kube-proxy-xxxxx --tail=50
```

**关键错误信息**：

```
User "system:serviceaccount:kube-system:kube-proxy" cannot list resource "services"
User "system:serviceaccount:kube-system:kube-proxy" cannot list resource "nodes"
User "system:serviceaccount:kube-system:kube-proxy" cannot list resource "endpointslices"
RBAC: [clusterrole.rbac.authorization.k8s.io "system:node-proxier" not found, ...]
```

### 根因分析

kube-proxy 需要通过 `system:node-proxier` ClusterRole 来：
1. 监听 Services 资源变化
2. 监听 Endpoints/EndpointSlices 资源变化
3. 监听 Nodes 资源变化
4. 创建 events 事件

缺少权限导致：
- 无法建立 iptables/ipvs 规则
- Service 网络完全失效
- DNS Service 无法访问

### 解决方案

创建完整的 kube-proxy RBAC 配置：

```yaml
# kube-proxy-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:node-proxier
rules:
- apiGroups:
  - ""
  resources:
  - endpoints
  - services
  - nodes
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - discovery.k8s.io
  resources:
  - endpointslices
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - events
  verbs:
  - create
  - patch
  - update
- apiGroups:
  - events.k8s.io
  resources:
  - events
  verbs:
  - create
  - patch
  - update
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:node-proxier
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:node-proxier
subjects:
- kind: ServiceAccount
  name: kube-proxy
  namespace: kube-system
```

应用配置：

```bash
# 1. 应用 RBAC 配置
kubectl apply -f kube-proxy-rbac.yaml

# 2. 重启 kube-proxy pods
kubectl delete pod -n kube-system -l k8s-app=kube-proxy

# 3. 验证日志
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=100
```

### 注意事项

⚠️ **Kubernetes 1.19+ 的 events 权限**：需要同时配置 `""` 和 `events.k8s.io` 两个 API group 的 events 资源权限，因为从 1.19 开始 events 资源迁移到了新的 API group。

---

## 问题二：flannel RBAC 权限缺失

### 发现过程

修复 kube-proxy 后，发现部分节点的 Pod 网络仍然不通。查看 flannel 日志：

```bash
$ kubectl logs -n kube-system -l app=flannel --tail=100
```

**关键错误信息**：

```
User "system:serviceaccount:kube-system:flannel" cannot list resource "nodes"
RBAC: [clusterrole.rbac.authorization.k8s.io "flannel" not found, ...]
Failed to watch *v1.Node: nodes is forbidden
```

### 根因分析

Flannel 需要：
1. 监听 Nodes 资源变化，获取每个节点的 Pod CIDR
2. 动态建立 VXLAN 隧道到其他节点
3. 更新节点状态（设置 node.status.network-unavailable）

缺少权限导致：
- 无法发现新节点或节点变化
- 无法建立跨节点的 VXLAN 路由
- 跨节点 Pod 网络不通

### 解决方案

创建 flannel RBAC 配置：

```yaml
# flannel-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: flannel
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-system
```

应用配置：

```bash
# 1. 应用 RBAC 配置
kubectl apply -f flannel-rbac.yaml

# 2. 重启 flannel pods
kubectl delete pod -n kube-system -l app=flannel

# 3. 验证路由建立
ip route | grep 10.233
bridge fdb show dev flannel.1
```

---

## 问题三：双 Pod CIDR 共存导致路由问题

### 发现过程

修复 RBAC 后，仍然存在部分节点间 Pod 无法通信。通过 tcpdump 抓包分析：

```bash
# 在目标节点抓包
$ tcpdump -i bond0 udp port 8472 -nn -vv

# 关键发现
10.244.2.0 > 10.233.67.18: ICMP echo request  # 请求来自旧 CIDR
# 但没有看到回复包
```

检查节点邻居表：

```bash
$ ip neigh show dev flannel.1
10.244.0.0 lladdr xx:xx:xx:xx:xx:xx PERMANENT  # 旧 CIDR
10.244.1.0 lladdr xx:xx:xx:xx:xx:xx PERMANENT
10.233.64.0 lladdr xx:xx:xx:xx:xx:xx PERMANENT  # 新 CIDR
10.233.65.0 lladdr xx:xx:xx:xx:xx:xx PERMANENT
```

### 根因分析

集群中同时存在两套 Pod CIDR：
- **旧配置**: `10.244.0.0/16`
- **新配置**: `10.233.64.0/18`

导致的问题：
1. 部分节点使用旧 CIDR，部分使用新 CIDR
2. 使用新 CIDR 的节点没有到旧 CIDR 的路由
3. ICMP 请求能到达，但回复包无法返回

### 诊断命令

```bash
# 1. 检查所有节点的 Pod CIDR 分配
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.podCIDR}{"\n"}{end}'

# 2. 查找使用旧 CIDR 的 Pod
kubectl get pods --all-namespaces -o wide | grep "10.244"

# 3. 检查节点网络接口
ip addr show | grep -E "10.244|10.233"

# 4. 检查 flannel 配置
kubectl get cm -n kube-system kube-flannel-cfg -o yaml
```

### 解决方案

#### 方案 A：统一到新 CIDR（推荐）

```bash
# 1. 在使用旧 CIDR 的节点上执行
# 备份路由
ip route save > /tmp/routes.backup

# 删除旧的 CNI 网桥（会自动重建）
ip link set cni0 down
ip link delete cni0

# 2. 重启该节点的网络组件
systemctl restart kubelet
kubectl delete pod -n kube-system -l app=flannel --field-selector spec.nodeName=<node-name>

# 3. 验证 Pod 使用新 CIDR
kubectl get pods -o wide --field-selector spec.nodeName=<node-name>
```

#### 方案 B：临时添加路由（快速恢复）

```bash
# 在使用新 CIDR 的节点上，为每个旧 CIDR 添加路由
ip route add 10.244.X.0/24 via 10.244.X.0 dev flannel.1 onlink
```

### 验证修复

```bash
# 1. 确认所有节点使用统一 CIDR
kubectl get nodes -o custom-columns=NAME:.metadata.name,CIDR:.spec.podCIDR

# 2. 确认没有旧 IP 的 Pod
kubectl get pods --all-namespaces -o wide | grep "10.244" || echo "清理完成"

# 3. 测试跨节点连通性
ping <remote-pod-ip>
```

---

## 故障总结与预防

### 问题根源

本次故障是一个**级联式问题**：

```
1. RBAC 配置丢失（可能原因：集群升级/误删除/初始化不完整）
   ↓
2. kube-proxy 无法工作 → Service 网络失效 → DNS 无法访问
   ↓
3. flannel 无法工作 → 无法建立跨节点路由 → Pod 网络不通
   ↓
4. 网络配置冲突（双 CIDR） → 部分路由缺失 → 连通性问题
```

### 为什么会丢失 RBAC

可能的原因：
1. **手动删除了系统 ClusterRole**（最常见）
2. **集群升级过程中 RBAC 未正确迁移**
3. **使用了不完整的集群初始化配置**
4. **etcd 数据部分丢失或恢复不完整**

### 预防措施

#### 1. 定期备份 RBAC 配置

```bash
# 备份所有系统 ClusterRole
kubectl get clusterrole -o yaml > cluster-roles-backup.yaml

# 备份所有 ClusterRoleBinding
kubectl get clusterrolebinding -o yaml > cluster-rolebindings-backup.yaml

# 定期执行（加入 cron）
0 2 * * * kubectl get clusterrole,clusterrolebinding -o yaml > /backup/rbac-$(date +\%Y\%m\%d).yaml
```

#### 2. 监控关键组件日志

```yaml
# Prometheus AlertManager 规则示例
groups:
- name: k8s-rbac
  rules:
  - alert: KubeProxyRBACError
    expr: |
      sum(rate(container_log_errors{pod=~"kube-proxy.*",error=~".*forbidden.*"}[5m])) > 0
    annotations:
      summary: "kube-proxy RBAC 权限错误"

  - alert: FlannelRBACError
    expr: |
      sum(rate(container_log_errors{pod=~"kube-flannel.*",error=~".*forbidden.*"}[5m])) > 0
    annotations:
      summary: "flannel RBAC 权限错误"
```

#### 3. 健康检查脚本

```bash
#!/bin/bash
# check-k8s-rbac.sh

echo "=== 检查关键 ClusterRole ==="
critical_roles=(
    "system:node-proxier"
    "flannel"
    "system:kube-dns"
)

for role in "${critical_roles[@]}"; do
    if ! kubectl get clusterrole "$role" &>/dev/null; then
        echo "❌ ClusterRole $role 不存在！"
        exit 1
    else
        echo "✅ ClusterRole $role 存在"
    fi
done

echo -e "\n=== 检查组件日志 ==="
if kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=100 | grep -i "forbidden" &>/dev/null; then
    echo "❌ kube-proxy 存在权限错误"
    exit 1
fi

if kubectl logs -n kube-system -l app=flannel --tail=100 | grep -i "forbidden" &>/dev/null; then
    echo "❌ flannel 存在权限错误"
    exit 1
fi

echo "✅ 所有检查通过"
```

#### 4. 网络配置管理

```bash
# 确保 Pod CIDR 配置一致性
# 在集群初始化前明确定义
kubeadm init --pod-network-cidr=10.233.64.0/18

# 定期审计 Pod CIDR 分配
kubectl get nodes -o custom-columns=NAME:.metadata.name,CIDR:.spec.podCIDR | sort -k2
```

---

## DNS 问题排查通用方法论

### 快速诊断流程图

```
DNS 解析失败
    ↓
┌─────────────────────────────┐
│ 1. 测试 ClusterIP 直连      │
│ nslookup kubernetes 10.233.0.3 │
└─────────────────────────────┘
         ↓ 成功              ↓ 失败
    DNS 配置问题         Service 网络问题
         ↓                      ↓
    检查 /etc/resolv.conf   检查 kube-proxy
         ↓                      ↓
    nameserver 正确?       查看日志 RBAC?
         ↓                      ↓
    Pod dnsPolicy?         修复权限/重启
         ↓                      ↓
    kubelet clusterDNS?    检查 ipvs/iptables
                               ↓
                          测试 Pod 网络连通性
                               ↓
                          检查 CNI 插件 (flannel)
                               ↓
                          查看日志 RBAC?
                               ↓
                          检查路由/FDB表
                               ↓
                          检查防火墙/内核参数
```

### 分层排查清单

#### Layer 1: DNS 配置层

```bash
# ✓ 检查容器 DNS 配置
cat /etc/resolv.conf
# 应该包含：
# nameserver <CoreDNS-ClusterIP>
# search <namespace>.svc.cluster.local svc.cluster.local cluster.local
# options ndots:5

# ✓ 直接测试 CoreDNS
nslookup kubernetes.default.svc.cluster.local <CoreDNS-ClusterIP>

# ✓ 测试外部 DNS
nslookup www.google.com <CoreDNS-ClusterIP>
```

**常见问题**：
- nameserver 指向错误的 IP
- kubelet `--cluster-dns` 参数配置错误
- Pod `dnsPolicy` 配置为 "None" 但未指定 dnsConfig

#### Layer 2: Service 网络层

```bash
# ✓ 验证 Service 存在且有 Endpoints
kubectl get svc -n kube-system coredns
kubectl get endpoints -n kube-system coredns

# ✓ 测试 Service ClusterIP 连通性
nc -zv <CoreDNS-ClusterIP> 53

# ✓ 检查 kube-proxy 状态
kubectl get pods -n kube-system -l k8s-app=kube-proxy
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=100 | grep -i error
```

**常见问题**：
- kube-proxy 未运行或有错误
- RBAC 权限不足
- ipvs/iptables 规则缺失

#### Layer 3: Pod 网络层

```bash
# ✓ 测试 Pod 间连通性
kubectl run test --image=busybox --rm -it -- ping <CoreDNS-Pod-IP>

# ✓ 检查 CNI 插件状态
kubectl get pods -n kube-system -l app=flannel
kubectl logs -n kube-system -l app=flannel --tail=100

# ✓ 验证路由表
ip route | grep <pod-cidr>
bridge fdb show dev flannel.1  # 对于 flannel VXLAN
```

**常见问题**：
- CNI 插件未运行
- RBAC 权限不足
- VXLAN 隧道未建立
- 防火墙阻塞

#### Layer 4: 系统配置层

```bash
# ✓ IP 转发
sysctl net.ipv4.ip_forward  # 应该为 1

# ✓ 防火墙
systemctl status firewalld
iptables -L FORWARD -n | head

# ✓ 内核模块
lsmod | grep br_netfilter
lsmod | grep overlay

# ✓ SELinux（如适用）
getenforce  # 应该为 Permissive 或 Disabled
```

### 常用调试命令速查

```bash
# === CoreDNS 相关 ===
# 查看 CoreDNS 配置
kubectl get cm -n kube-system coredns -o yaml

# 查看 CoreDNS 日志
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100

# 重启 CoreDNS
kubectl rollout restart -n kube-system deployment/coredns

# === Service 网络 ===
# 查看 Service 详情
kubectl describe svc -n kube-system coredns

# 查看 Endpoints
kubectl get endpoints -n kube-system coredns -o yaml

# 检查 ipvs 规则（ipvs 模式）
ipvsadm -Ln | grep <ClusterIP>

# 检查 iptables 规则（iptables 模式）
iptables-save | grep <ClusterIP>

# === Pod 网络 ===
# 查看 Pod CIDR 分配
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.podCIDR}{"\n"}{end}'

# 检查网络接口
ip addr show
ip route show

# 抓包分析
tcpdump -i <interface> -nn -vv port 53
tcpdump -i <interface> udp port 8472  # flannel VXLAN

# === RBAC 权限 ===
# 检查 ServiceAccount
kubectl get sa -n kube-system kube-proxy
kubectl get sa -n kube-system flannel

# 检查 ClusterRole
kubectl get clusterrole system:node-proxier
kubectl get clusterrole flannel

# 检查 ClusterRoleBinding
kubectl get clusterrolebinding system:node-proxier
kubectl get clusterrolebinding flannel

# 测试权限
kubectl auth can-i list services --as=system:serviceaccount:kube-system:kube-proxy
```

---

## 总结

### 关键要点

1. **DNS 问题往往是表象**，根因可能在更底层（RBAC、网络路由、配置冲突）

2. **RBAC 是基础**，确保关键组件有正确的权限：
   - kube-proxy 需要 `system:node-proxier`
   - flannel 需要 `flannel` ClusterRole
   - CoreDNS 需要 `system:coredns`

3. **分层诊断**，从应用层到基础设施层逐层排查

4. **日志是最好的老师**，学会阅读组件日志中的关键错误信息

5. **网络配置一致性**，避免多套 CIDR 并存

### 最佳实践

✅ **DO**
- 定期备份 RBAC 配置
- 监控关键组件日志
- 使用版本控制管理集群配置
- 建立标准化的故障诊断流程
- 记录集群变更历史

❌ **DON'T**
- 不要轻易删除系统 ClusterRole
- 不要在生产环境直接修改核心配置
- 不要忽略组件日志中的警告
- 不要混用多套网络配置

### 相关资源

- [Kubernetes RBAC 官方文档](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [CoreDNS Troubleshooting](https://coredns.io/manual/toc/#troubleshooting)
- [Flannel Documentation](https://github.com/flannel-io/flannel)
- [Kubernetes Network Troubleshooting](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

---


