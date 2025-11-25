---
title: "Kubernetes 网络深度解析：从入门到实战"
date: 2025-11-03T10:35:01+08:00
lastmod: 2025-11-03T10:35:01+08:00
draft: false
tags: ["k8s", "network", "kubernetes", "flannel", "calico"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

> 从零开始理解 K8s 网络模型，深入 Flannel 和 Calico 原理，掌握网络故障排查与解决方案

## 目录

1. [Kubernetes 网络基础](#1-kubernetes-网络基础)
2. [Pod 间通信原理](#2-pod-间通信原理)
3. [Service 与 DNAT 机制](#3-service-与-dnat-机制)
4. [Flannel 网络方案详解](#4-flannel-网络方案详解)
5. [Calico 网络方案详解](#5-calico-网络方案详解)
6. [网络故障排查实战](#6-网络故障排查实战)
7. [复杂场景解决方案](#7-复杂场景解决方案)

---

## 1. Kubernetes 网络基础

### 1.1 K8s 网络模型的三大原则

Kubernetes 采用**扁平网络模型**（Flat Network Model），核心原则：

```
✅ 原则 1：所有 Pod 可以在不使用 NAT 的情况下与其他 Pod 通信
✅ 原则 2：所有节点可以在不使用 NAT 的情况下与所有 Pod 通信  
✅ 原则 3：Pod 看到的自己的 IP 和其他 Pod 看到的 IP 是同一个
```

**这意味着：**
- Pod 之间是"直连"的（IP 层面）
- 没有复杂的 NAT 转换
- 网络拓扑清晰简单

### 1.2 网络组件架构

```
┌─────────────────────────────────────────────────────┐
│                   Application                       │
│                   (你的应用)                         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Service (ClusterIP)                    │
│          虚拟 IP + 负载均衡 (kube-proxy)             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Pod Network (CNI)                      │
│         Flannel / Calico / Cilium 等                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│            Node Network                             │
│         物理网络 / 云厂商 VPC                         │
└─────────────────────────────────────────────────────┘
```

### 1.3 关键组件说明

| 组件 | 作用 | 实现方式 |
|------|------|----------|
| **CNI 插件** | 为 Pod 分配 IP，配置网络 | Flannel, Calico, Cilium 等 |
| **kube-proxy** | Service 负载均衡 | iptables / IPVS |
| **CoreDNS** | 集群内 DNS 解析 | Service 名称 → ClusterIP |
| **iptables** | 数据包过滤和转发 | DNAT, SNAT, 防火墙 |

---

## 2. Pod 间通信原理

### 2.1 同节点 Pod 通信

```
┌─────────────────────────────────────────────────────┐
│                    Node A                           │
│                                                     │
│  ┌──────────────┐            ┌──────────────┐     │
│  │   Pod A      │            │   Pod B      │     │
│  │ 10.244.1.5   │            │ 10.244.1.6   │     │
│  └──────┬───────┘            └──────┬───────┘     │
│         │                           │             │
│    veth pair                   veth pair          │
│         │                           │             │
│         └────────┬──────────────────┘             │
│                  │                                 │
│          ┌───────▼────────┐                       │
│          │  Linux Bridge  │                       │
│          │     (cni0)     │                       │
│          └────────────────┘                       │
└─────────────────────────────────────────────────────┘
```

**通信流程：**

1. Pod A 发送数据包（dst: 10.244.1.6）
2. 数据包通过 veth pair 到达 cni0 网桥
3. 网桥查找 MAC 地址表，转发给 Pod B 的 veth
4. Pod B 收到数据包

**特点：**
- ✅ 完全二层转发，无路由
- ✅ 性能最高（几乎无损耗）
- ✅ 延迟最低

### 2.2 跨节点 Pod 通信（核心）

```
┌──────────────────────┐          ┌──────────────────────┐
│      Node A          │          │      Node B          │
│                      │          │                      │
│  ┌────────────┐      │          │      ┌────────────┐  │
│  │  Pod A     │      │          │      │  Pod B     │  │
│  │10.244.1.5  │      │          │      │10.244.2.8  │  │
│  └─────┬──────┘      │          │      └─────┬──────┘  │
│        │             │          │            │         │
│   veth pair          │          │       veth pair      │
│        │             │          │            │         │
│    ┌───▼───┐         │          │        ┌───▼───┐    │
│    │ cni0  │         │          │        │ cni0  │    │
│    └───┬───┘         │          │        └───┬───┘    │
│        │             │          │            │         │
│   ┌────▼────┐        │          │       ┌────▼────┐   │
│   │  eth0   │◄───────┼──────────┼──────►│  eth0   │   │
│   └─────────┘        │          │       └─────────┘   │
│   Node IP:           │          │       Node IP:      │
│   192.168.1.10       │          │       192.168.1.20  │
└──────────────────────┘          └──────────────────────┘
         │                                     ▲
         │        物理网络 / 隧道               │
         └─────────────────────────────────────┘
```

**关键点：**
- Pod 看到的是对方 Pod IP（直连）
- 底层可能有封装（取决于 CNI 插件）
- 需要节点间网络互通

---

## 3. Service 与 DNAT 机制

### 3.1 为什么需要 Service？

**问题：**
- Pod IP 会变化（重启、扩缩容）
- Pod 可能有多个副本
- 客户端不应该关心后端 Pod 细节

**解决方案：Service**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  clusterIP: 10.96.100.50  # 虚拟 IP，固定不变
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

### 3.2 kube-proxy 的两种模式详解

kube-proxy 是 Kubernetes 中实现 Service 的核心组件，支持两种主要模式：**iptables** 和 **IPVS**。

#### 3.2.1 iptables 模式（默认）

**工作原理：**

iptables 模式通过创建大量的 iptables 规则来实现 Service 的负载均衡和 DNAT。

```text
数据包流转过程：

客户端 Pod
    ↓
┌──────────────────────────────────────┐
│ 原始数据包                            │
│ src: 10.244.1.5:52314               │
│ dst: 10.96.100.50:80  ← Service IP  │
└──────────────────┬───────────────────┘
                   │
                   ▼ PREROUTING
┌──────────────────────────────────────┐
│ iptables NAT 表处理流程               │
│                                      │
│ 1. KUBE-SERVICES 链                  │
│    匹配 Service IP:Port              │
│                                      │
│ 2. KUBE-SVC-XXX 链                   │
│    使用随机概率实现负载均衡           │
│    - 50% → KUBE-SEP-AAA (Pod1)      │
│    - 50% → KUBE-SEP-BBB (Pod2)      │
│                                      │
│ 3. KUBE-SEP-YYY 链                   │
│    执行 DNAT 转换                     │
│    将目标改为具体的 Pod IP:Port       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ DNAT 后的数据包                       │
│ src: 10.244.1.5:52314  ← 源不变！    │
│ dst: 10.244.2.8:8080  ← 改为 Pod IP  │
└──────────────────┬───────────────────┘
                   │
                   ▼
            通过 CNI 网络转发到目标 Pod
```

**iptables 规则链结构：**

```bash
# NAT 表的规则链
nat table:
  PREROUTING → KUBE-SERVICES
                    ↓
              KUBE-SVC-XXXXX (每个 Service 一个链)
                    ↓
              KUBE-SEP-YYYYY (每个 Endpoint 一个链)
                    ↓
                  DNAT

  OUTPUT → KUBE-SERVICES (本机访问 Service)

  POSTROUTING → KUBE-POSTROUTING
                    ↓
                MASQUERADE (访问集群外部时)
```

**负载均衡实现：**

```bash
# 使用 statistic 模块实现概率负载均衡
# 假设有 3 个后端 Pod

-A KUBE-SVC-XXXXX -m statistic --mode random --probability 0.33333 -j KUBE-SEP-POD1
-A KUBE-SVC-XXXXX -m statistic --mode random --probability 0.50000 -j KUBE-SEP-POD2
-A KUBE-SVC-XXXXX -j KUBE-SEP-POD3

# 概率计算：
# Pod1: 33.33%
# Pod2: (1-0.3333) * 0.5 = 33.33%
# Pod3: (1-0.3333) * (1-0.5) = 33.33%
```

**Session Affinity（会话亲和性）：**

```bash
# 如果启用了 sessionAffinity: ClientIP
# kube-proxy 会使用 recent 模块记录客户端 IP

-A KUBE-SEP-XXX -m recent --name KUBE-SEP-XXX --set
-A KUBE-SVC-YYY -m recent --name KUBE-SEP-XXX --rcheck --seconds 10800 -j KUBE-SEP-XXX
```

#### 3.2.2 IPVS 模式（高性能）

**工作原理：**

IPVS (IP Virtual Server) 是 Linux 内核的 L4 负载均衡器，性能远超 iptables。

```text
数据包流转过程：

客户端 Pod
    ↓
┌──────────────────────────────────────┐
│ 原始数据包                            │
│ src: 10.244.1.5:52314               │
│ dst: 10.96.100.50:80                │
└──────────────────┬───────────────────┘
                   │
                   ▼ INPUT
┌──────────────────────────────────────┐
│ IPVS 处理流程                         │
│                                      │
│ 1. 虚拟服务器 (VS)                    │
│    10.96.100.50:80                  │
│                                      │
│ 2. 调度算法选择真实服务器 (RS)         │
│    - rr: 轮询                        │
│    - lc: 最少连接                    │
│    - dh: 目标地址哈希                 │
│    - sh: 源地址哈希                   │
│    - sed: 最短期望延迟                │
│    - nq: 不排队调度                   │
│                                      │
│ 3. 转发到选中的 Pod                   │
│    10.244.2.8:8080                  │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ IPVS NAT 模式转发                     │
│ src: 10.244.1.5:52314               │
│ dst: 10.244.2.8:8080                │
└──────────────────┬───────────────────┘
                   │
                   ▼
              CNI 网络转发
```

**IPVS 的三种工作模式：**

```text
1. NAT 模式（默认）
   Client → IPVS (DNAT) → Real Server
   响应包必须经过 IPVS 节点

2. DR 模式（Direct Routing）
   Client → IPVS → Real Server
   响应包直接返回客户端，不经过 IPVS
   要求在同一二层网络

3. TUN 模式（IP Tunneling）
   Client → IPVS (IP-in-IP) → Real Server
   通过 IP 隧道转发
```

**IPVS 在 Kubernetes 中的实现：**

```bash
# kube-proxy 创建的 IPVS 规则
# 1. 创建 dummy 接口绑定 Service IP
ip link add kube-ipvs0 type dummy
ip addr add 10.96.100.50/32 dev kube-ipvs0

# 2. 创建 IPVS 虚拟服务
ipvsadm -A -t 10.96.100.50:80 -s rr

# 3. 添加真实服务器（Pod）
ipvsadm -a -t 10.96.100.50:80 -r 10.244.2.8:8080 -m
ipvsadm -a -t 10.96.100.50:80 -r 10.244.3.9:8080 -m
```

#### 3.2.3 iptables vs IPVS 对比

| 特性 | iptables 模式 | IPVS 模式 |
|------|--------------|----------|
| **性能** | O(n) 线性查找 | O(1) 哈希查找 |
| **规则数量** | 随 Service/Pod 增长 | 固定数量 |
| **负载均衡算法** | 随机 | rr/lc/dh/sh/sed/nq 等 10+ 种 |
| **连接数限制** | 受 conntrack 表限制 | 几乎无限制 |
| **CPU 使用** | 高（大规模时） | 低 |
| **内存使用** | 中等 | 略高（需要维护连接表） |
| **健康检查** | 无 | 支持（需配置） |
| **会话保持** | 基于 ClientIP | 多种方式 |
| **可观测性** | iptables -nvL | ipvsadm -Ln |
| **内核要求** | 基础 netfilter | ip_vs 模块 |
| **稳定性** | 非常稳定 | 稳定 |
| **适用场景** | 中小规模集群 | 大规模集群 |

**性能测试数据：**

```text
测试环境：1000 个 Service，每个 Service 10 个 Pod

iptables 模式：
- 规则数量：~40,000 条
- 第一个包延迟：~8ms
- CPU 使用率：25%

IPVS 模式：
- 规则数量：~1,000 条
- 第一个包延迟：~0.2ms  
- CPU 使用率：5%
```

### 3.3 配置 kube-proxy 模式

#### 3.3.1 切换到 IPVS 模式

```bash
# 1. 检查内核模块
for mod in ip_vs ip_vs_rr ip_vs_wrr ip_vs_sh nf_conntrack; do
    modprobe $mod
    lsmod | grep $mod
done

# 2. 安装 ipvsadm 工具
apt-get install -y ipvsadm ipset
# 或
yum install -y ipvsadm ipset

# 3. 修改 kube-proxy 配置
kubectl edit configmap kube-proxy -n kube-system

# 找到 mode 字段，修改为：
mode: "ipvs"

# 配置 IPVS 调度算法（可选）
ipvs:
  scheduler: "rr"  # 可选: rr, lc, dh, sh, sed, nq
  syncPeriod: "30s"
  minSyncPeriod: "2s"

# 4. 重启 kube-proxy
kubectl rollout restart daemonset kube-proxy -n kube-system

# 5. 验证 IPVS 模式
kubectl logs -n kube-system kube-proxy-xxxxx | grep "Using ipvs Proxier"

# 6. 查看 IPVS 规则
ipvsadm -Ln

# 输出示例：
# IP Virtual Server version 1.2.1 (size=4096)
# Prot LocalAddress:Port Scheduler Flags
#   -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
# TCP  10.96.0.1:443 rr
#   -> 192.168.1.10:6443            Masq    1      0          0
# TCP  10.96.100.50:80 rr
#   -> 10.244.2.8:8080              Masq    1      0          0
#   -> 10.244.3.9:8080              Masq    1      0          0
```

#### 3.3.2 IPVS 高级配置

```yaml
# kube-proxy 配置文件示例
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: "ipvs"
ipvs:
  scheduler: "lc"  # 最少连接算法
  syncPeriod: "30s"
  minSyncPeriod: "2s"
  # 启用严格 ARP（推荐）
  strictARP: true
  # TCP 超时配置
  tcpTimeout: "900s"
  tcpFinTimeout: "120s"
  udpTimeout: "300s"
# 启用 DSR (Direct Server Return) - 仅在特定网络环境
# excludeCIDRs:
# - "10.0.0.0/8"
```

#### 3.3.3 性能优化建议

```bash
# 1. IPVS 连接表优化
echo 1000000 > /proc/sys/net/ipv4/vs/conn_tab_bits

# 2. 调整 IPVS 超时
ipvsadm --set 900 120 300  # TCP, TCP-FIN, UDP

# 3. 启用 IPVS 连接复用
echo 1 > /proc/sys/net/ipv4/vs/conn_reuse_mode

# 4. 监控 IPVS 性能
watch -n 1 'ipvsadm -Ln --stats'

# 5. 查看 IPVS 连接数
ipvsadm -Ln --connection
```

### 3.4 查看和调试规则

#### 3.4.1 iptables 模式调试

```bash
# 1. 查看 Service 入口规则
iptables -t nat -L KUBE-SERVICES -n --line-numbers | grep 10.96.100.50

# 输出：
# -A KUBE-SERVICES -d 10.96.100.50/32 -p tcp -m tcp --dport 80 \
#    -j KUBE-SVC-ABCD1234

# 2. 查看负载均衡规则
iptables -t nat -L KUBE-SVC-ABCD1234 -n

# 输出（2 个后端 Pod）：
# -A KUBE-SVC-ABCD1234 -m statistic --mode random --probability 0.50000 \
#    -j KUBE-SEP-POD-B
# -A KUBE-SVC-ABCD1234 -j KUBE-SEP-POD-C

# 3. 查看具体的 DNAT 规则
iptables -t nat -L KUBE-SEP-POD-B -n

# 输出：
# -A KUBE-SEP-POD-B -p tcp -m tcp \
#    -j DNAT --to-destination 10.244.2.8:8080

# 4. 统计规则命中次数
iptables -t nat -L KUBE-SVC-ABCD1234 -nvx
# pkts bytes target     prot opt in     out     source               destination
#  100 6000  KUBE-SEP-1 all  --  *      *       0.0.0.0/0            0.0.0.0/0
#   95 5700  KUBE-SEP-2 all  --  *      *       0.0.0.0/0            0.0.0.0/0

# 5. 追踪特定连接
conntrack -L -d 10.96.100.50
```

#### 3.4.2 IPVS 模式调试

```bash
# 1. 查看所有虚拟服务
ipvsadm -Ln

# 2. 查看详细统计
ipvsadm -Ln --stats
# Prot LocalAddress:Port               Conns   InPkts  OutPkts  InBytes OutBytes
# TCP  10.96.100.50:80                  1000    5000    5000    500000  500000
#   -> 10.244.2.8:8080                   500    2500    2500    250000  250000
#   -> 10.244.3.9:8080                   500    2500    2500    250000  250000

# 3. 查看连接率
ipvsadm -Ln --rate
# Prot LocalAddress:Port                CPS    InPPS   OutPPS    InBPS   OutBPS
# TCP  10.96.100.50:80                   10      50      50     5000    5000

# 4. 查看活跃连接
ipvsadm -Lnc
# IPVS connection entries
# pro expire state       source             virtual            destination
# TCP 14:58  ESTABLISHED 10.244.1.5:52314   10.96.100.50:80   10.244.2.8:8080

# 5. 查看 Service IP 绑定
ip addr show kube-ipvs0
# 输出所有绑定的 Service ClusterIP

# 6. 实时监控
watch -n 1 'ipvsadm -Ln --rate'
```

### 3.5 完整请求流程对比

#### 3.5.1 iptables 模式流程

```
┌─────────────────────────────────────────────────────┐
│ 1. Pod A 发起请求                                    │
│    curl http://myapp-svc:80                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. DNS 解析                                          │
│    myapp-svc → 10.96.100.50 (ClusterIP)            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. iptables DNAT                                    │
│    10.96.100.50:80 → 10.244.2.8:8080 (Pod B)       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. CNI 网络转发                                      │
│    Node A → Node B                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 5. Pod B 接收请求并响应                              │
│    响应包原路返回（conntrack 自动反向转换）           │
└─────────────────────────────────────────────────────┘
```

#### 3.5.2 IPVS 模式流程

```text
┌─────────────────────────────────────────────────────┐
│ 1. Pod A 发起请求                                    │
│    curl http://myapp-svc:80                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. DNS 解析                                          │
│    myapp-svc → 10.96.100.50 (ClusterIP)            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. IPVS 处理                                         │
│    - 匹配虚拟服务 10.96.100.50:80                   │
│    - 根据调度算法选择后端                            │
│    - NAT 转换到 10.244.2.8:8080                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. CNI 网络转发                                      │
│    通过 VXLAN/BGP 等转发到目标节点                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 5. Pod B 处理并响应                                  │
│    响应包经 IPVS 反向 NAT 后返回                     │
└─────────────────────────────────────────────────────┘
```

### 3.6 选择 iptables 还是 IPVS？

**选择建议：**

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| **小规模集群** (<100 节点) | iptables | 简单稳定，易于调试 |
| **中等规模** (100-500 节点) | 都可以 | 根据 Service 数量决定 |
| **大规模集群** (>500 节点) | IPVS | 性能优势明显 |
| **Service 数量多** (>1000) | IPVS | iptables 规则过多影响性能 |
| **需要会话保持** | IPVS | 支持多种调度算法 |
| **需要健康检查** | IPVS | 原生支持后端健康检查 |
| **简单部署** | iptables | 无需额外内核模块 |
| **Windows 节点** | iptables | Windows 不支持 IPVS |

**迁移建议：**

```bash
# 从 iptables 迁移到 IPVS
# 1. 先在测试环境验证
# 2. 确保内核模块加载
# 3. 分批更新节点
# 4. 监控性能指标
# 5. 保留回滚方案

# 回滚到 iptables（如果需要）
kubectl edit configmap kube-proxy -n kube-system
# 将 mode: "ipvs" 改回 mode: "iptables"
kubectl rollout restart daemonset kube-proxy -n kube-system
```

---

## 4. Flannel 网络方案详解

### 4.1 Flannel 架构概述

```
┌─────────────────────────────────────────────────────┐
│                  etcd / K8s API                     │
│           (存储网络配置和 Pod CIDR 分配)              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼───────┐      ┌──────▼────────┐
│   Node A      │      │   Node B      │
│               │      │               │
│  flanneld     │      │  flanneld     │
│  (守护进程)    │      │  (守护进程)    │
│               │      │               │
│  flannel.1    │      │  flannel.1    │
│  (VXLAN 接口) │      │  (VXLAN 接口) │
└───────────────┘      └───────────────┘
```

### 4.2 Flannel 工作模式

#### 模式 1: VXLAN（推荐，默认）

**特点：**
- ✅ 最通用，适用于任何网络环境
- ✅ 三层可达即可（不需要二层互通）
- ❌ 有封装开销（约 10-15% 性能损耗）

**封装过程：**

```
原始 Pod 数据包：
┌─────────────────────────────────────┐
│ IP Header                           │
│ src: 10.244.1.5                    │
│ dst: 10.244.2.8                    │
├─────────────────────────────────────┤
│ TCP/UDP Header                      │
├─────────────────────────────────────┤
│ Application Data                    │
└─────────────────────────────────────┘

VXLAN 封装后：
┌─────────────────────────────────────┐
│ Outer IP Header                     │
│ src: 192.168.1.10 (Node A IP)      │
│ dst: 192.168.1.20 (Node B IP)      │
├─────────────────────────────────────┤
│ UDP Header (port 8472)              │
├─────────────────────────────────────┤
│ VXLAN Header (VNI: 1)               │
├─────────────────────────────────────┤
│ 原始 Pod 数据包                      │
│ (Inner IP + TCP/UDP + Data)        │
└─────────────────────────────────────┘
```

**配置示例：**

```yaml
# kube-flannel.yaml
net-conf.json: |
  {
    "Network": "10.244.0.0/16",
    "Backend": {
      "Type": "vxlan",
      "VNI": 1,
      "Port": 8472
    }
  }
```

**数据流转：**

```
Pod A (10.244.1.5)
    ↓
veth → cni0 → flannel.1 (VXLAN 接口)
    ↓
查询路由：10.244.2.0/24 → 通过 flannel.1
    ↓
查询 FDB（转发数据库）：10.244.2.8 → Node B MAC
    ↓
VXLAN 封装：目标 Node B IP (192.168.1.20)
    ↓
物理网卡 eth0 发送
    ↓
物理网络传输
    ↓
Node B eth0 接收
    ↓
VXLAN 解封装：提取原始 Pod 数据包
    ↓
flannel.1 → cni0 → veth
    ↓
Pod B (10.244.2.8) 接收
```

#### 模式 2: Host-GW（最高性能）

**特点：**
- ✅ 无封装，性能最高
- ✅ 原生三层路由
- ❌ 要求所有节点在同一个二层网络

**路由方式：**

```bash
# Node A 的路由表
ip route show

# 输出：
10.244.1.0/24 dev cni0 proto kernel scope link src 10.244.1.1
10.244.2.0/24 via 192.168.1.20 dev eth0  ← 直接路由到 Node B
10.244.3.0/24 via 192.168.1.30 dev eth0
```

**配置：**

```yaml
net-conf.json: |
  {
    "Network": "10.244.0.0/16",
    "Backend": {
      "Type": "host-gw"
    }
  }
```

**数据流转：**

```
Pod A → cni0 → 查路由表 → 直接从 eth0 发往 Node B
无任何封装！纯三层路由！
```

### 4.3 Flannel 安装与配置

```bash
# 1. 下载 Flannel 配置文件
wget https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# 2. 修改网络配置（如果需要）
vim kube-flannel.yml
# 找到 net-conf.json，修改 Network 字段

# 3. 部署 Flannel
kubectl apply -f kube-flannel.yml

# 4. 验证部署
kubectl get pods -n kube-flannel
kubectl get ds -n kube-flannel

# 5. 检查节点状态
kubectl get nodes
# 所有节点应该是 Ready 状态
```

### 4.4 Flannel 故障排查

```bash
# 1. 检查 Flannel Pod 状态
kubectl get pods -n kube-flannel -o wide

# 2. 查看 Flannel 日志
kubectl logs -n kube-flannel <flannel-pod-name>

# 3. 检查 VXLAN 接口
ip link show flannel.1
ip addr show flannel.1

# 4. 检查路由表
ip route | grep flannel

# 5. 检查 FDB（转发数据库）
bridge fdb show dev flannel.1

# 6. 测试 VXLAN 连通性
# 在 Node A 上
ping -I flannel.1 <node-b-flannel-ip>

# 7. 抓包分析
tcpdump -i flannel.1 -n
tcpdump -i eth0 port 8472 -n  # VXLAN 流量
```

---

## 5. Calico 网络方案详解

### 5.1 Calico 架构概述

```
┌─────────────────────────────────────────────────────┐
│                  etcd / K8s API                     │
│           (存储 BGP 路由和网络策略)                   │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼───────┐      ┌──────▼────────┐
│   Node A      │      │   Node B      │
│               │      │               │
│  calico-node  │◄─────┼─────►calico-node  │
│  (Felix)      │ BGP  │     (Felix)   │
│  (BIRD)       │ 路由 │     (BIRD)    │
│               │ 交换 │               │
│  caliXXX      │      │  caliYYY      │
│  (veth)       │      │  (veth)       │
└───────────────┘      └───────────────┘
```

**核心组件：**
- **Felix**：Calico 的核心代理，配置路由和 ACL
- **BIRD**：BGP 客户端，交换路由信息
- **Confd**：监听配置变化
- **CNI Plugin**：为 Pod 配置网络

### 5.2 Calico 工作模式

#### 模式 1: BGP（推荐）

**特点：**
- ✅ 无封装，性能最高
- ✅ 原生三层路由
- ✅ 支持大规模集群
- ❌ 需要支持 BGP 的网络环境

**BGP 路由交换：**

```
Node A                                    Node B
  ↓                                         ↓
BIRD (BGP)  ←──────  BGP Session  ──────→  BIRD (BGP)
  ↓                                         ↓
通告路由：                                 通告路由：
10.244.1.0/24 via 192.168.1.10           10.244.2.0/24 via 192.168.1.20
```

**路由表：**

```bash
# Node A 的路由
ip route show

# 输出：
10.244.1.0/24 dev cali+ proto kernel scope link
10.244.2.0/24 via 192.168.1.20 dev eth0 proto bird  ← BGP 学习的路由
10.244.3.0/24 via 192.168.1.30 dev eth0 proto bird
```

**数据流转：**

```
Pod A (10.244.1.5)
    ↓
caliXXX (veth)
    ↓
查路由表：10.244.2.8 via 192.168.1.20
    ↓
直接从 eth0 发送（无封装）
    ↓
物理网络路由
    ↓
Node B eth0 接收
    ↓
查路由表：10.244.2.8 dev caliYYY
    ↓
caliYYY (veth)
    ↓
Pod B (10.244.2.8)
```

#### 模式 2: IPIP（隧道模式）

**特点：**
- ✅ 适用于不支持 BGP 的环境
- ✅ 比 VXLAN 开销小
- ❌ 有封装开销

**IPIP 封装：**

```
原始数据包：
┌──────────────────────────┐
│ IP: 10.244.1.5 → 10.244.2.8 │
│ TCP/UDP + Data            │
└──────────────────────────┘

IPIP 封装后：
┌──────────────────────────┐
│ Outer IP Header          │
│ src: 192.168.1.10        │
│ dst: 192.168.1.20        │
├──────────────────────────┤
│ 原始 IP 包                │
│ (Inner IP + TCP + Data)  │
└──────────────────────────┘
```

**配置：**

```yaml
# calico.yaml
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
    - blockSize: 26
      cidr: 10.244.0.0/16
      encapsulation: IPIP  # 或 IPIPCrossSubnet, VXLAN, None
      natOutgoing: true
```

### 5.3 Calico 网络策略

**Calico 的杀手级特性：强大的网络策略！**

```yaml
# 示例：只允许特定 Pod 访问数据库
apiVersion: projectcalico.org/v3
kind: NetworkPolicy
metadata:
  name: allow-app-to-db
  namespace: default
spec:
  selector: app == 'database'
  types:
  - Ingress
  ingress:
  - action: Allow
    protocol: TCP
    source:
      selector: app == 'web'
    destination:
      ports:
      - 3306
  - action: Deny  # 默认拒绝其他流量
```

**实现原理：iptables + ipset**

```bash
# Calico 创建的 iptables 规则
iptables -L cali-fw-caliXXX -n

# 输出示例：
-A cali-fw-caliXXX -m set --match-set cali-allowed-ips src -j ACCEPT
-A cali-fw-caliXXX -j DROP
```

### 5.4 Calico 安装与配置

```bash
# 方法 1: 使用 Operator（推荐）
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/master/manifests/tigera-operator.yaml

# 下载配置文件
wget https://raw.githubusercontent.com/projectcalico/calico/master/manifests/custom-resources.yaml

# 修改 CIDR（如果需要）
vim custom-resources.yaml

# 应用配置
kubectl create -f custom-resources.yaml

# 验证
kubectl get pods -n calico-system
kubectl get installation -o yaml

# 方法 2: 直接安装（适用于简单场景）
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# 检查状态
kubectl get pods -n kube-system | grep calico
calicoctl node status  # 需要安装 calicoctl
```

### 5.5 Calico 故障排查

```bash
# 1. 检查 Calico 组件状态
kubectl get pods -n calico-system
kubectl get pods -n kube-system | grep calico

# 2. 查看 Felix 日志
kubectl logs -n calico-system <calico-node-pod> -c calico-node

# 3. 检查 BGP 状态（如果使用 BGP 模式）
# 安装 calicoctl
curl -L https://github.com/projectcalico/calico/releases/download/v3.27.0/calicoctl-linux-amd64 -o calicoctl
chmod +x calicoctl

# 查看 BGP 对等体状态
calicoctl node status

# 输出示例：
# Calico process is running.
# 
# IPv4 BGP status
# +--------------+-------------------+-------+----------+-------------+
# | PEER ADDRESS |     PEER TYPE     | STATE |  SINCE   |    INFO     |
# +--------------+-------------------+-------+----------+-------------+
# | 192.168.1.20 | node-to-node mesh | up    | 12:34:56 | Established |
# | 192.168.1.30 | node-to-node mesh | up    | 12:35:01 | Established |
# +--------------+-------------------+-------+----------+-------------+

# 4. 查看路由
ip route | grep bird

# 5. 检查 IPIP 隧道（如果使用 IPIP）
ip link show tunl0
ip addr show tunl0

# 6. 查看网络策略
calicoctl get networkpolicy -A
calicoctl get globalnetworkpolicy

# 7. 检查 Pod 的 Workload Endpoint
calicoctl get workloadendpoint -A

# 8. 调试特定 Pod 的网络
kubectl exec -it <pod-name> -- ip addr
kubectl exec -it <pod-name> -- ip route
```

---

## 6. 网络故障排查实战

### 6.1 排查工具箱

```bash
# 在节点上安装必要工具
apt-get install -y tcpdump iproute2 iputils-ping traceroute net-tools dnsutils

# 在 Pod 内使用的调试镜像
kubectl run debug --image=nicolaka/netshoot -it --rm
```

### 6.2 场景 1：Pod 无法访问外网

**症状：**
```bash
kubectl exec -it mypod -- curl https://www.google.com
# 超时或 DNS 解析失败
```

**排查步骤：**

```bash
# Step 1: 检查 DNS
kubectl exec -it mypod -- nslookup www.google.com
# 如果失败，检查 CoreDNS

kubectl get svc -n kube-system kube-dns
kubectl get pods -n kube-system -l k8s-app=kube-dns

# 查看 Pod 的 DNS 配置
kubectl exec -it mypod -- cat /etc/resolv.conf

# Step 2: 检查网络连通性
kubectl exec -it mypod -- ping 8.8.8.8
# 如果失败，检查出站路由

# Step 3: 检查 SNAT 规则
iptables -t nat -L POSTROUTING -n | grep MASQUERADE

# Flannel 应该有：
# -A POSTROUTING -s 10.244.0.0/16 ! -d 10.244.0.0/16 -j MASQUERADE

# Calico 应该有：
# -A cali-nat-outgoing -m set --match-set cali-masq-ipam-pools src \
#    -m set ! --match-set cali-all-ipam-pools dst -j MASQUERADE

# Step 4: 检查出站网关
kubectl exec -it mypod -- ip route
# 应该有 default via 169.254.1.1 dev eth0 （或类似）

# Step 5: 在节点上抓包
tcpdump -i any -n host <pod-ip>
```

**常见原因：**
1. CoreDNS 故障
2. SNAT/MASQUERADE 规则缺失
3. 节点出站路由配置错误
4. 云厂商安全组限制

**解决方案：**
```bash
# 修复 CoreDNS
kubectl rollout restart deployment coredns -n kube-system

# 检查 CNI 配置
# Flannel
kubectl get configmap kube-flannel-cfg -n kube-flannel -o yaml

# Calico
calicoctl get ippool -o yaml
# 确保 natOutgoing: true
```

### 6.3 场景 2：Pod 间通信失败

**症状：**
```bash
# Pod A 无法访问 Pod B
kubectl exec -it pod-a -- curl http://<pod-b-ip>:80
# Connection refused 或 timeout
```

**排查流程图：**

```
开始排查
    ↓
┌─────────────────────────────────────┐
│ 1. 确认 Pod B 是否正常运行？        │
│    kubectl get pods                 │
└────────┬────────────────────────────┘
         │ YES
         ▼
┌─────────────────────────────────────┐
│ 2. Pod B 的端口是否监听？           │
│    kubectl exec pod-b -- netstat -ln│
└────────┬────────────────────────────┘
         │ YES
         ▼
┌─────────────────────────────────────┐
│ 3. 同节点还是跨节点？               │
└────┬───────────────────┬────────────┘
     │                   │
   同节点              跨节点
     │                   │
     ▼                   ▼
 检查 bridge         检查节点间
 和 veth            网络连通性
```

**详细排查步骤：**

```bash
# Step 1: 获取 Pod 信息
kubectl get pods -o wide
# 记录 Pod IP 和所在节点

# Step 2: 在 Pod A 内测试
kubectl exec -it pod-a -- ping <pod-b-ip>

# 如果 ping 不通：

# Step 3: 检查路由
kubectl exec -it pod-a -- ip route

# 应该能看到到达 Pod B 网段的路由
# 如：10.244.2.0/24 via 169.254.1.1 dev eth0

# Step 4: 检查 CNI 网络
# Flannel
kubectl logs -n kube-flannel <flannel-pod-on-node-a>
kubectl logs -n kube-flannel <flannel-pod-on-node-b>

# Calico
kubectl logs -n calico-system <calico-node-pod>

# Step 5: 在节点上检查
# 登录到 Node A
ssh node-a

# 检查 Pod A 的 veth
ip link | grep <pod-a-name>
# 或查找 veth
nsenter -t <pod-a-pid> -n ip link

# 检查路由
ip route | grep <pod-b-cidr>

# Step 6: 抓包分析
# 在 Node A 上
tcpdump -i any -n host <pod-b-ip>

# 发起请求（在另一个终端）
kubectl exec -it pod-a -- curl http://<pod-b-ip>:80

# 观察：
# - 如果看到 SYN 包发出，但没有 SYN-ACK 返回 → 跨节点网络问题
# - 如果看到 SYN-ACK 返回 → 应用层问题

# Step 7: 检查节点间连通性
# 在 Node A 上
ping <node-b-ip>

# Flannel VXLAN 模式
ping -I flannel.1 <node-b-flannel-ip>

# Step 8: 检查防火墙和 iptables
iptables -L -n | grep <pod-b-ip>
iptables -t nat -L -n | grep <pod-b-ip>

# 检查 NetworkPolicy
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name>
```

**常见问题和解决方案：**

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| ping 不通 | 节点间网络不通 | 检查物理网络、防火墙 |
| TCP 连接失败 | NetworkPolicy 阻止 | 检查并调整策略 |
| 间歇性失败 | 负载不均或某节点故障 | 检查所有节点状态 |
| 单向不通 | 路由不对称 | 检查双向路由 |

### 6.4 场景 3：Service 无法访问

**症状：**
```bash
kubectl exec -it pod-a -- curl http://myapp-svc
# Connection refused 或 timeout
```

**排查步骤：**

```bash
# Step 1: 确认 Service 存在
kubectl get svc myapp-svc

# 检查详细信息
kubectl describe svc myapp-svc

# 重点关注：
# - ClusterIP（应该在 Service CIDR 范围内）
# - Endpoints（应该有后端 Pod IP）

# Step 2: 检查 Endpoints
kubectl get endpoints myapp-svc

# 如果 Endpoints 为空：
# - 检查 Pod 的 label 是否匹配 Service selector
kubectl get pods --show-labels
kubectl describe svc myapp-svc | grep Selector

# Step 3: DNS 解析测试
kubectl exec -it pod-a -- nslookup myapp-svc
kubectl exec -it pod-a -- nslookup myapp-svc.default.svc.cluster.local

# 应该返回 Service 的 ClusterIP

# Step 4: 直接访问 ClusterIP
kubectl exec -it pod-a -- curl http://<cluster-ip>:80

# Step 5: 直接访问 Pod IP（绕过 Service）
kubectl exec -it pod-a -- curl http://<pod-ip>:8080

# 如果 Pod IP 可以访问，但 Service IP 不行 → kube-proxy 问题

# Step 6: 检查 kube-proxy
kubectl get pods -n kube-system | grep kube-proxy
kubectl logs -n kube-system kube-proxy-xxxxx

# 检查 kube-proxy 模式
kubectl logs -n kube-system kube-proxy-xxxxx | grep "Using"
# 输出：Using iptables Proxier 或 Using ipvs Proxier

# Step 7: 检查 iptables/IPVS 规则

# === iptables 模式调试 ===
# 查看 Service 规则
iptables -t nat -L KUBE-SERVICES -n | grep <cluster-ip>
# 查看负载均衡规则
iptables -t nat -L KUBE-SVC-XXX -n
# 查看 DNAT 规则
iptables -t nat -L KUBE-SEP-XXX -n
# 查看规则计数
iptables -t nat -L -nvx | grep <cluster-ip>

# === IPVS 模式调试 ===
# 查看虚拟服务
ipvsadm -Ln | grep <cluster-ip>
# 查看统计信息
ipvsadm -Ln --stats | grep <cluster-ip>
# 查看连接
ipvsadm -Lnc | grep <cluster-ip>
# 查看 Service IP
ip addr show kube-ipvs0 | grep <cluster-ip>

# Step 8: 检查 conntrack 表
conntrack -L | grep <cluster-ip>

# Step 9: 测试负载均衡
# 多次请求，看是否分发到不同 Pod
for i in {1..10}; do
  kubectl exec -it pod-a -- curl -s http://myapp-svc | grep hostname
done
```

**Service 常见问题：**

```bash
# 问题 1: Endpoints 为空
# 原因：Selector 不匹配
# 解决：
kubectl label pods <pod-name> app=myapp

# 问题 2: DNS 解析失败
# 原因：CoreDNS 故障
# 解决：
kubectl rollout restart deployment coredns -n kube-system

# 问题 3: iptables 规则缺失
# 原因：kube-proxy 未运行或配置错误
# 解决：
kubectl delete pod -n kube-system kube-proxy-xxxxx
# Pod 会自动重建

# 问题 4: conntrack 表满
# 解决：
sysctl -w net.netfilter.nf_conntrack_max=1000000
sysctl -w net.netfilter.nf_conntrack_buckets=250000

# 问题 5: IPVS 模式下连接超时
# 检查内核模块
lsmod | grep ip_vs
# 如果缺失，加载模块
modprobe ip_vs
modprobe ip_vs_rr
modprobe ip_vs_wrr
modprobe ip_vs_sh
modprobe nf_conntrack

# 问题 6: IPVS 模式下 Service 不通
# 检查 kube-ipvs0 接口
ip link show kube-ipvs0
# 检查 Service IP 是否绑定
ip addr show kube-ipvs0
# 重建 ipvs 接口
ip link del kube-ipvs0
# kube-proxy 会自动重建

# 问题 7: iptables 规则过多导致性能下降
# 查看规则数量
iptables-save | wc -l
# 如果超过 10000 条，考虑切换到 IPVS

# 问题 8: IPVS 调度不均匀
# 切换调度算法
ipvsadm -E -t <vip:port> -s lc  # 改为最少连接
# 或修改 kube-proxy 配置
kubectl edit cm kube-proxy -n kube-system
# 设置 ipvs.scheduler: "lc"
```

### 6.5 场景 4：DNS 解析异常

**症状：**
```bash
kubectl exec -it pod-a -- nslookup kubernetes.default
# Server: 10.96.0.10
# ** server can't find kubernetes.default: NXDOMAIN
```

**排查步骤：**

```bash
# Step 1: 检查 CoreDNS 状态
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get svc -n kube-system kube-dns

# Step 2: 查看 CoreDNS 日志
kubectl logs -n kube-system <coredns-pod-name>

# 常见错误：
# - plugin/errors: 2 example.com. AAAA: read udp ...timeout
# - Failed to list *v1.Service: ... connection refused

# Step 3: 检查 Pod 的 DNS 配置
kubectl exec -it pod-a -- cat /etc/resolv.conf

# 应该看到：
# nameserver 10.96.0.10
# search default.svc.cluster.local svc.cluster.local cluster.local
# options ndots:5

# Step 4: 测试 CoreDNS Service
kubectl exec -it pod-a -- nslookup kubernetes.default 10.96.0.10
# 直接指定 DNS 服务器

# Step 5: 检查 CoreDNS 配置
kubectl get configmap coredns -n kube-system -o yaml

# Step 6: 测试上游 DNS
kubectl exec -it <coredns-pod> -- nslookup google.com

# Step 7: 检查 CoreDNS 到 API Server 的连通性
kubectl exec -it <coredns-pod> -- curl -k https://kubernetes.default.svc.cluster.local

# Step 8: 抓包分析
kubectl exec -it pod-a -- tcpdump -i eth0 port 53 -n
```

**DNS 常见问题：**

```yaml
# 问题 1: ndots 配置导致查询缓慢
# 症状：每个域名查询都很慢
# 解决：自定义 Pod 的 dnsConfig

apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  dnsConfig:
    options:
    - name: ndots
      value: "1"  # 降低 ndots 值
    - name: timeout
      value: "2"
  containers:
  - name: app
    image: nginx

# 问题 2: CoreDNS 负载过高
# 解决：增加 CoreDNS 副本
kubectl scale deployment coredns -n kube-system --replicas=3

# 或启用 NodeLocal DNSCache
# https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/

# 问题 3: Service 域名解析失败
# 检查 CoreDNS 插件配置
kubectl edit configmap coredns -n kube-system

# 确保有 kubernetes 插件：
# Corefile: |
#   .:53 {
#       errors
#       health
#       kubernetes cluster.local in-addr.arpa ip6.arpa {
#         pods insecure
#         fallthrough in-addr.arpa ip6.arpa
#       }
#       prometheus :9153
#       forward . /etc/resolv.conf
#       cache 30
#       loop
#       reload
#       loadbalance
#   }
```

### 6.6 场景 5：网络策略不生效

**症状：**
```bash
# 创建了 NetworkPolicy 拒绝访问，但仍然可以访问
kubectl apply -f deny-all-policy.yaml
kubectl exec -it pod-a -- curl http://pod-b  # 预期失败，实际成功
```

**排查步骤：**

```bash
# Step 1: 检查 CNI 是否支持 NetworkPolicy
# Flannel 默认不支持！需要配合 Calico
# Calico 原生支持

# 检查是否安装了支持 NetworkPolicy 的插件
kubectl get pods -n kube-system | grep calico

# Step 2: 查看 NetworkPolicy
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name>

# Step 3: 检查 Policy 的 Selector
kubectl get pods --show-labels
# 确认 Pod 的 label 匹配 Policy 的 podSelector

# Step 4: 检查 iptables 规则（Calico）
# 登录到节点
iptables -L -n | grep cali
iptables -L cali-fw-caliXXX -n  # Pod 对应的链

# Step 5: 查看 Calico 日志
kubectl logs -n calico-system <calico-node-pod>

# Step 6: 使用 calicoctl 调试
calicoctl get networkpolicy -A -o yaml
calicoctl get workloadendpoint -A

# Step 7: 测试 Policy 效果
# 创建测试 Policy
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-deny-all
  namespace: default
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

# 测试是否生效
kubectl exec -it pod-a -- curl http://pod-b
# 应该失败（timeout 或 refused）

# Step 8: 检查 Policy 顺序
# NetworkPolicy 是累加的（whitelist 模式）
# 多个 Policy 都会生效

# Step 9: 抓包验证
tcpdump -i caliXXX -n
# 如果看到包被拒绝（RST 或无响应），说明 Policy 生效
```

**NetworkPolicy 常见问题：**

```yaml
# 问题 1: Flannel 不支持 NetworkPolicy
# 解决方案 1: 迁移到 Calico
# 解决方案 2: Flannel + Calico（Canal）

# 安装 Canal
kubectl apply -f https://raw.githubusercontent.com/projectcalico/canal/master/k8s-install/1.7/canal.yaml

# 问题 2: Policy 不匹配任何 Pod
# 检查 selector
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test
spec:
  podSelector:
    matchLabels:
      app: myapp  # 确保 Pod 有这个 label
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend

# 问题 3: 忘记允许 DNS
# 解决：添加 DNS egress 规则
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

### 6.7 通用排查工具和技巧

#### 抓包分析

```bash
# 1. 在 Pod 内抓包（需要权限）
kubectl exec -it pod-a -- tcpdump -i eth0 -w /tmp/capture.pcap

# 2. 在节点的 veth 上抓包
# 找到 Pod 的 veth
POD_PID=$(docker inspect --format '{{.State.Pid}}' <container-id>)
POD_NETNS=$(ip netns identify $POD_PID)
ip netns exec $POD_NETNS ip link show

# 在对应的 veth 上抓包
tcpdump -i vethXXX -w /tmp/capture.pcap

# 3. 同时抓多个接口
tcpdump -i any host <pod-ip> -w /tmp/capture.pcap

# 4. 实时查看 HTTP 请求
tcpdump -i any -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'

# 5. 使用 Wireshark 分析
# 将 capture.pcap 下载到本地
kubectl cp pod-a:/tmp/capture.pcap ./capture.pcap
# 用 Wireshark 打开
```

#### 使用 netshoot 调试容器

```bash
# 启动调试 Pod
kubectl run netshoot --rm -it --image=nicolaka/netshoot -- /bin/bash

# netshoot 包含大量网络工具：
# - tcpdump, nmap, curl, wget
# - iperf3, mtr, traceroute
# - dig, nslookup, host
# - netstat, ss, ip

# 在特定节点运行
kubectl run netshoot --rm -it --image=nicolaka/netshoot \
  --overrides='{"spec": {"nodeSelector": {"kubernetes.io/hostname": "node-a"}}}'

# 使用 host 网络
kubectl run netshoot --rm -it --image=nicolaka/netshoot \
  --overrides='{"spec": {"hostNetwork": true}}'
```

#### 性能测试

```bash
# 1. 使用 iperf3 测试带宽
# 在 Server Pod
kubectl run iperf-server --image=networkstatic/iperf3 -- -s

# 在 Client Pod
kubectl run iperf-client --rm -it --image=networkstatic/iperf3 -- \
  -c <server-pod-ip> -t 30 -P 4

# 2. 使用 qperf 测试延迟
# Server
kubectl run qperf-server --image=arcts/qperf -- -lp 4000

# Client
kubectl run qperf-client --rm -it --image=arcts/qperf -- \
  <server-pod-ip> -lp 4000 -t 60 tcp_lat tcp_bw

# 3. 使用 ab 测试 HTTP 性能
kubectl run apache-bench --rm -it --image=httpd -- \
  ab -n 10000 -c 100 http://<service-ip>/
```

---

## 7. 复杂场景解决方案

### 7.1 场景：节点网络不互通

**问题描述：**
```
Node A ↔ Node D (Master) ✅
Node B ↔ Node D (Master) ✅
Node C ↔ Node D (Master) ✅
Node A ↔ Node B ❌
Node A ↔ Node C ❌
Node B ↔ Node C ❌
```

**影响：**
- ❌ 跨节点 Pod 通信失败
- ✅ DNS 解析成功（如果 CoreDNS 在 Master）
- ❌ CNI 网络无法工作

**解决方案 1：使用 VPN 打通节点网络（推荐）**

```bash
# 使用 WireGuard 建立星型拓扑，Master 为中心

# 在 Master (Node D) 上
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.200.0.100/24
PrivateKey = <master-private-key>
ListenPort = 51820

[Peer]
# Node A
PublicKey = <node-a-public-key>
AllowedIPs = 10.200.0.1/32, 10.244.1.0/24
Endpoint = <node-a-ip>:51820

[Peer]
# Node B
PublicKey = <node-b-public-key>
AllowedIPs = 10.200.0.2/32, 10.244.2.0/24
Endpoint = <node-b-ip>:51820

[Peer]
# Node C
PublicKey = <node-c-public-key>
AllowedIPs = 10.200.0.3/32, 10.244.3.0/24
Endpoint = <node-c-ip>:51820
EOF

wg-quick up wg0

# 在 Node A 上
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.200.0.1/24
PrivateKey = <node-a-private-key>
ListenPort = 51820

[Peer]
# Master (作为中转)
PublicKey = <master-public-key>
AllowedIPs = 10.200.0.0/24, 10.244.0.0/16
Endpoint = <master-ip>:51820
PersistentKeepalive = 25
EOF

wg-quick up wg0

# 在所有节点添加路由
# Node A
ip route add 10.244.2.0/24 via 10.200.0.100 dev wg0
ip route add 10.244.3.0/24 via 10.200.0.100 dev wg0

# Node B
ip route add 10.244.1.0/24 via 10.200.0.100 dev wg0
ip route add 10.244.3.0/24 via 10.200.0.100 dev wg0

# 验证
ping -I wg0 10.200.0.2  # 从 Node A ping Node B
```

**解决方案 2：使用 Ingress/Gateway 在 Master 中转**

```yaml
# 部署 Nginx Ingress 到 Master
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-ingress-controller
  namespace: ingress-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-ingress
  template:
    metadata:
      labels:
        app: nginx-ingress
    spec:
      nodeSelector:
        node-role.kubernetes.io/master: ""  # 调度到 Master
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule
      hostNetwork: true  # 使用主机网络
      containers:
      - name: nginx-ingress-controller
        image: registry.k8s.io/ingress-nginx/controller:v1.8.0
        args:
        - /nginx-ingress-controller
        - --configmap=$(POD_NAMESPACE)/nginx-configuration
        - --tcp-services-configmap=$(POD_NAMESPACE)/tcp-services
        - --udp-services-configmap=$(POD_NAMESPACE)/udp-services

# 配置 Service 使用 ExternalIP（Master IP）
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  externalIPs:
  - <master-node-ip>  # Master 的 IP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

### 7.2 场景：Flannel VXLAN 性能优化

**问题：VXLAN 封装带来性能损耗**

**优化方案：**

```bash
# 1. 调整 MTU 大小
# 计算：物理网卡 MTU - VXLAN 封装开销 (50字节)
# 例如：1500 - 50 = 1450

kubectl edit cm kube-flannel-cfg -n kube-flannel

# 修改 net-conf.json
{
  "Network": "10.244.0.0/16",
  "Backend": {
    "Type": "vxlan",
    "VNI": 1,
    "Port": 8472,
    "MTU": 1450  # 添加这行
  }
}

# 重启 Flannel
kubectl rollout restart daemonset kube-flannel-ds -n kube-flannel

# 2. 启用硬件卸载（如果网卡支持）
ethtool -K eth0 tx-checksum-ipv4 off
ethtool -K eth0 tx-checksum-ipv6 off
ethtool -K eth0 tx-udp_tnl-segmentation on

# 3. 调整 VXLAN 参数
ip link set flannel.1 mtu 1450
ip link set flannel.1 txqueuelen 1000

# 4. 优化内核参数
cat > /etc/sysctl.d/99-flannel.conf <<EOF
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
EOF

sysctl -p /etc/sysctl.d/99-flannel.conf

# 5. 如果条件允许，切换到 Host-GW 模式
# 要求：所有节点在同一二层网络
kubectl edit cm kube-flannel-cfg -n kube-flannel

# 修改为：
{
  "Network": "10.244.0.0/16",
  "Backend": {
    "Type": "host-gw"  # 改为 host-gw
  }
}
```

### 7.3 场景：Calico 大规模集群优化

**问题：集群规模超过 100 节点，BGP 路由表过大**

**优化方案：**

```yaml
# 1. 使用路由反射器（Route Reflector）
apiVersion: projectcalico.org/v3
kind: BGPConfiguration
metadata:
  name: default
spec:
  logSeverityScreen: Info
  nodeToNodeMeshEnabled: false  # 禁用全互联
  asNumber: 64512

# 配置路由反射器节点
---
apiVersion: projectcalico.org/v3
kind: Node
metadata:
  name: node-rr-1
spec:
  bgp:
    routeReflectorClusterID: 224.0.0.1
    
# 配置其他节点连接到路由反射器
---
apiVersion: projectcalico.org/v3
kind: BGPPeer
metadata:
  name: peer-to-rr-1
spec:
  peerIP: <rr-node-1-ip>
  asNumber: 64512
  nodeSelector: "!has(routeReflectorClusterID)"

# 2. 启用 IP-in-IP 或 VXLAN（减少路由条目）
apiVersion: projectcalico.org/v3
kind: IPPool
metadata:
  name: default-ipv4-ippool
spec:
  cidr: 10.244.0.0/16
  ipipMode: CrossSubnet  # 跨子网使用 IPIP
  natOutgoing: true
  blockSize: 26

# 3. 调整 BIRD 日志级别（减少日志量）
kubectl edit felixconfiguration default

# 添加：
spec:
  logSeverityScreen: Warning  # 只记录警告和错误

# 4. 启用 Prometheus 监控
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/master/manifests/prometheus.yaml

# 5. 调整 Felix 性能参数
apiVersion: projectcalico.org/v3
kind: FelixConfiguration
metadata:
  name: default
spec:
  iptablesRefreshInterval: 60s  # 增加刷新间隔
  iptablesLockTimeoutSecs: 10
  iptablesLockProbeIntervalMillis: 50
  iptablesPostWriteCheckIntervalSecs: 1
```

### 7.4 场景：多集群网络互通

**需求：两个 K8s 集群需要 Pod 互访**

**解决方案：使用 Submariner**

```bash
# 1. 安装 subctl 工具
curl -Ls https://get.submariner.io | bash
export PATH=$PATH:~/.local/bin

# 2. 部署 Broker（在集群 1）
subctl deploy-broker --kubeconfig cluster1-kubeconfig

# 输出会包含 broker-info.subm 文件

# 3. 加入集群 1
subctl join --kubeconfig cluster1-kubeconfig broker-info.subm \
  --clusterid cluster1 \
  --cable-driver vxlan

# 4. 加入集群 2
subctl join --kubeconfig cluster2-kubeconfig broker-info.subm \
  --clusterid cluster2 \
  --cable-driver vxlan

# 5. 验证连通性
subctl show all --kubeconfig cluster1-kubeconfig

# 6. 导出 Service
# 在集群 1
kubectl label service myapp submariner.io/exported=true

# 在集群 2 访问
kubectl run test --rm -it --image=busybox -- \
  wget -O- myapp.default.svc.clusterset.local
```

### 7.5 场景：Service Mesh 集成

**需求：在保留 CNI 网络的同时，添加 Service Mesh 能力**

**方案：部署 Istio + Calico/Flannel**

```bash
# 1. 安装 Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.20.0
export PATH=$PWD/bin:$PATH

# 安装 Istio（保留现有 CNI）
istioctl install --set profile=default -y

# 2. 启用自动注入
kubectl label namespace default istio-injection=enabled

# 3. 部署应用
kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml

# 4. 查看网络架构
kubectl get pods -o wide
kubectl exec -it <pod-name> -c istio-proxy -- curl localhost:15000/config_dump

# 5. 理解流量路径
# Pod 间通信：
# Pod A → Envoy Sidecar (A) → CNI Network → Envoy Sidecar (B) → Pod B
# 
# Service 访问：
# Pod A → Envoy Sidecar → Service (kube-proxy DNAT) → CNI → Pod B

# 6. 配置流量策略
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews-destination
spec:
  host: reviews
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    loadBalancer:
      simple: LEAST_REQUEST
EOF

# 7. 与 NetworkPolicy 配合使用
# NetworkPolicy 在 CNI 层控制（更底层）
# Istio 策略在应用层控制（更高层）
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend
spec:
  selector:
    matchLabels:
      app: reviews
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/frontend"]
EOF
```

### 7.6 场景：混合云网络

**需求：本地 K8s 集群与云上集群互通**

**架构：**

```
┌─────────────────────────────────────────┐
│         本地数据中心                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   K8s Cluster 1                 │   │
│  │   CNI: Calico                   │   │
│  │   Pod CIDR: 10.244.0.0/16      │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
            VPN/专线连接
                  │
┌─────────────────▼───────────────────────┐
│         云厂商 (AWS/阿里云)               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   K8s Cluster 2                 │   │
│  │   CNI: Calico                   │   │
│  │   Pod CIDR: 10.245.0.0/16      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**实现步骤：**

```bash
# 1. 确保 Pod CIDR 不冲突
# 集群 1: 10.244.0.0/16
# 集群 2: 10.245.0.0/16

# 2. 建立 VPN 连接（例如使用 IPsec）
# 在本地网关
cat > /etc/ipsec.d/aws.conf <<EOF
conn to-aws
    authby=secret
    left=<local-gateway-ip>
    leftsubnet=10.244.0.0/16
    right=<aws-gateway-ip>
    rightsubnet=10.245.0.0/16
    ike=aes256-sha2_256-modp2048!
    esp=aes256-sha2_256!
    keyingtries=%forever
    auto=start
EOF

# 配置预共享密钥
echo "<local-ip> <aws-ip> : PSK \"your-secret-key\"" >> /etc/ipsec.secrets

# 启动 IPsec
ipsec restart

# 3. 配置 Calico BGP Peering（如果使用 Calico）
# 在集群 1
cat <<EOF | calicoctl apply -f -
apiVersion: projectcalico.org/v3
kind: BGPPeer
metadata:
  name: to-cluster2
spec:
  peerIP: <cluster2-bgp-ip>
  asNumber: 64513
EOF

# 4. 配置路由
# 在集群 1 的所有节点
ip route add 10.245.0.0/16 via <vpn-gateway-ip>

# 在集群 2 的所有节点
ip route add 10.244.0.0/16 via <vpn-gateway-ip>

# 5. 测试跨集群通信
# 从集群 1 的 Pod
kubectl run test --rm -it --image=busybox -- \
  ping <cluster2-pod-ip>

# 6. 配置跨集群 Service（使用 Submariner 或手动配置）
# 手动方式：在集群 1 创建 ExternalName Service
apiVersion: v1
kind: Service
metadata:
  name: remote-service
spec:
  type: ExternalName
  externalName: <cluster2-service-ip>
```

### 7.7 场景：网络隔离与多租户

**需求：同一集群内实现租户网络隔离**

**方案：使用 Namespace + NetworkPolicy**

```yaml
# 1. 创建租户 Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: tenant-a
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-b
  labels:
    tenant: tenant-b

# 2. 默认拒绝所有流量
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: tenant-b
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

# 3. 允许同租户内通信
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
  egress:
  - to:
    - podSelector: {}

# 4. 允许访问 DNS
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53

# 5. 允许访问特定外部服务
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-api
  namespace: tenant-a
spec:
  podSelector:
    matchLabels:
      role: api-client
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector: {}
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
  - ports:
    - protocol: UDP
      port: 53

# 6. 使用 Calico GlobalNetworkPolicy 实现全局策略
---
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: tenant-isolation
spec:
  order: 0
  selector: has(tenant)
  types:
  - Ingress
  - Egress
  ingress:
  # 拒绝跨租户访问
  - action: Deny
    source:
      selector: tenant != "{{ tenant }}"
  egress:
  - action: Deny
    destination:
      selector: tenant != "{{ tenant }}"
  # 允许访问系统组件
  - action: Allow
    destination:
      namespaceSelector: kubernetes.io/metadata.name == "kube-system"
```

### 7.8 场景：高可用网络架构

**需求：确保网络组件高可用**

**架构设计：**

```yaml
# 1. CoreDNS 高可用配置
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coredns
  namespace: kube-system
spec:
  replicas: 3  # 至少 3 个副本
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                k8s-app: kube-dns
            topologyKey: kubernetes.io/hostname  # 分散到不同节点
      containers:
      - name: coredns
        resources:
          limits:
            cpu: 200m
            memory: 170Mi
          requests:
            cpu: 100m
            memory: 70Mi

# 2. kube-proxy 高可用（DaemonSet 天然高可用）
# 确保每个节点都运行
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-proxy
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: kube-proxy
  template:
    spec:
      priorityClassName: system-node-critical  # 高优先级
      tolerations:
      - operator: Exists  # 容忍所有污点

# 3. CNI 高可用监控
---
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: calico-node
  namespace: calico-system
spec:
  selector:
    matchLabels:
      k8s-app: calico-node
  endpoints:
  - port: metrics
    interval: 30s

# 4. 实施健康检查和自动恢复
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: network-health-check
  namespace: kube-system
data:
  check.sh: |
    #!/bin/bash
    # 检查 CNI 健康
    if ! ip link show cni0; then
      echo "CNI bridge missing, restarting..."
      systemctl restart kubelet
    fi
    
    # 检查 Pod 网络连通性
    if ! ping -c 1 -W 2 10.96.0.1 > /dev/null 2>&1; then
      echo "Cannot reach Service network"
      exit 1
    fi

# 部署为 DaemonSet
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: network-health-check
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: network-health-check
  template:
    metadata:
      labels:
        app: network-health-check
    spec:
      hostNetwork: true
      containers:
      - name: checker
        image: busybox
        command:
        - /bin/sh
        - -c
        - |
          while true; do
            sh /scripts/check.sh
            sleep 60
          done
        volumeMounts:
        - name: scripts
          mountPath: /scripts
      volumes:
      - name: scripts
        configMap:
          name: network-health-check
          defaultMode: 0755

# 5. 配置告警规则（Prometheus）
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  network.rules: |
    groups:
    - name: network
      interval: 30s
      rules:
      - alert: CoreDNSDown
        expr: up{job="coredns"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CoreDNS is down"
      
      - alert: CNIPodNotReady
        expr: kube_pod_status_phase{namespace=~"kube-system|calico-system",phase!="Running"} == 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CNI Pod not ready"
      
      - alert: HighNetworkLatency
        expr: histogram_quantile(0.99, rate(apiserver_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High network latency detected"
```

---

## 8. 性能优化与最佳实践

### 8.1 iptables vs IPVS 性能测试

```bash
# 性能测试脚本
cat > service-perf-test.sh <<'EOF'
#!/bin/bash

# 创建测试 Service 和 Deployment
for i in {1..100}; do
  cat <<YAML | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: test-svc-$i
spec:
  selector:
    app: test-app-$i
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app-$i
spec:
  replicas: 10
  selector:
    matchLabels:
      app: test-app-$i
  template:
    metadata:
      labels:
        app: test-app-$i
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 8080
YAML
done
EOF

# 执行测试
bash service-perf-test.sh

# 测试 iptables 模式性能
time for i in {1..1000}; do 
  kubectl exec test-pod -- curl -s test-svc-$((RANDOM % 100)):80 > /dev/null
done

# 切换到 IPVS 模式后重新测试
kubectl edit cm kube-proxy -n kube-system
# 修改 mode: "ipvs"
kubectl rollout restart ds kube-proxy -n kube-system

# 等待切换完成
sleep 30

# 测试 IPVS 模式性能
time for i in {1..1000}; do 
  kubectl exec test-pod -- curl -s test-svc-$((RANDOM % 100)):80 > /dev/null
done

# 对比结果：
# iptables: real 2m30s
# IPVS:     real 1m15s
# 性能提升: ~50%
```

### 8.2 网络性能基准测试

```bash
# 1. Pod 间带宽测试
# 创建 iperf3 Server
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: iperf-server
spec:
  containers:
  - name: iperf3
    image: networkstatic/iperf3
    command: ["iperf3", "-s"]
    ports:
    - containerPort: 5201
EOF

# 创建 iperf3 Client
kubectl run iperf-client --rm -it --image=networkstatic/iperf3 -- \
  iperf3 -c <server-pod-ip> -t 30 -P 4 -i 1

# 预期结果：
# 同节点: > 10 Gbps（接近物理网卡速度）
# 跨节点 (host-gw/BGP): > 5 Gbps
# 跨节点 (VXLAN): 3-5 Gbps

# 2. 延迟测试
kubectl run qperf-server --image=arcts/qperf -- -lp 4000

kubectl run qperf-client --rm -it --image=arcts/qperf -- \
  <server-pod-ip> -lp 4000 -t 60 tcp_lat udp_lat

# 预期结果：
# 同节点: < 0.1 ms
# 跨节点 (host-gw/BGP): < 0.5 ms
# 跨节点 (VXLAN): 0.5-1 ms

# 3. Service 性能测试
kubectl expose pod iperf-server --port=5201 --name=iperf-svc

kubectl run iperf-client --rm -it --image=networkstatic/iperf3 -- \
  iperf3 -c iperf-svc -t 30

# 对比直接访问 Pod IP 的性能差异
```

### 8.3 CNI 和 kube-proxy 模式选择建议

#### CNI 选择建议

| 场景 | 推荐 CNI | 理由 |
|------|----------|------|
| **小规模集群** (< 50 节点) | Flannel (VXLAN) | 简单、稳定、易部署 |
| **中等规模** (50-200 节点) | Calico (BGP) | 性能好、功能全 |
| **大规模** (> 200 节点) | Calico (RR) / Cilium | 可扩展性强 |
| **需要网络策略** | Calico / Cilium | 原生支持 |
| **高性能要求** | Calico (BGP) / Cilium | 无封装开销 |
| **多租户隔离** | Calico | 强大的策略引擎 |
| **云厂商环境** | 云厂商 CNI | 集成最佳 |
| **边缘计算** | Flannel (host-gw) | 轻量、简单 |

#### kube-proxy 模式选择建议

| 集群规模 | Service 数量 | 推荐模式 | CNI 搭配建议 |
|----------|-------------|----------|--------------|
| **< 50 节点** | < 500 | iptables | Flannel |
| **50-200 节点** | 500-1000 | iptables/IPVS | Calico |
| **200-500 节点** | 1000-5000 | IPVS | Calico + IPVS |
| **> 500 节点** | > 5000 | IPVS | Cilium (eBPF) |

#### 最佳实践组合

```yaml
# 小规模开发环境
CNI: Flannel (VXLAN)
kube-proxy: iptables
特点: 简单易用，开箱即用

# 中等规模生产环境
CNI: Calico (BGP)
kube-proxy: IPVS
特点: 性能均衡，功能完善

# 大规模生产环境
CNI: Calico (BGP + Route Reflector)
kube-proxy: IPVS (lc 算法)
特点: 高性能，可扩展

# 云原生环境
CNI: Cilium (eBPF)
kube-proxy: 替换为 Cilium kube-proxy replacement
特点: 最高性能，完全基于 eBPF
```

### 8.3 内核参数优化

```bash
# 网络性能优化
cat > /etc/sysctl.d/99-kubernetes-network.conf <<EOF
# TCP 性能优化
net.core.somaxconn = 32768
net.ipv4.tcp_max_syn_backlog = 8192
net.core.netdev_max_backlog = 16384

# 增加连接追踪表大小
net.netfilter.nf_conntrack_max = 1000000
net.netfilter.nf_conntrack_buckets = 256000
net.netfilter.nf_conntrack_tcp_timeout_established = 86400

# 启用 TCP 快速回收
net.ipv4.tcp_tw_reuse = 1

# 优化 TCP 缓冲区
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 1048576
net.core.wmem_default = 1048576
net.ipv4.tcp_rmem = 4096 1048576 16777216
net.ipv4.tcp_wmem = 4096 1048576 16777216

# IP 转发（必须开启）
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1

# ARP 缓存优化
net.ipv4.neigh.default.gc_thresh1 = 4096
net.ipv4.neigh.default.gc_thresh2 = 6144
net.ipv4.neigh.default.gc_thresh3 = 8192

# 减少 TIME_WAIT 连接
net.ipv4.tcp_fin_timeout = 15

# 启用 TCP BBR 拥塞控制（如果内核支持）
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
EOF

sysctl -p /etc/sysctl.d/99-kubernetes-network.conf
```

### 8.4 监控指标

**关键监控指标：**

```yaml
# Prometheus 查询示例

# 1. Pod 网络流量
sum(rate(container_network_receive_bytes_total[5m])) by (pod)
sum(rate(container_network_transmit_bytes_total[5m])) by (pod)

# 2. Service 延迟（Istio/Linkerd）
histogram_quantile(0.95, 
  sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le)
)

# 3. DNS 查询 QPS
sum(rate(coredns_dns_requests_total[5m]))

# 4. DNS 查询延迟
histogram_quantile(0.95,
  sum(rate(coredns_dns_request_duration_seconds_bucket[5m])) by (le)
)

# 5. iptables 规则数量
node_iptables_nat_rules_count

# 6. conntrack 使用率
node_nf_conntrack_entries / node_nf_conntrack_entries_limit * 100

# 7. CNI 错误率（Calico）
rate(felix_int_dataplane_failures[5m])

# 8. 网络策略违规
sum(rate(calico_denied_packets[5m])) by (policy)
```

### 8.5 故障预防 Checklist

```bash
# 部署前检查清单

# □ 1. 节点网络连通性
for node in node1 node2 node3; do
  echo "Testing $node..."
  ping -c 3 $node
  ssh $node "ip link show"
done

# □ 2. 防火墙规则
# 确保以下端口开放：
# - 6443: Kubernetes API
# - 2379-2380: etcd
# - 10250-10255: Kubelet/kube-proxy
# - 8472: Flannel VXLAN
# - 179: Calico BGP
# - 5473: Calico Typha

# □ 3. Pod CIDR 规划
# 确保不与现有网络冲突
ip route show

# □ 4. DNS 配置
# 确保节点可以解析外部域名
nslookup google.com

# □ 5. 内核模块
lsmod | grep -E 'br_netfilter|overlay|ip_vs'

# □ 6. 内核参数
sysctl net.ipv4.ip_forward
sysctl net.bridge.bridge-nf-call-iptables

# □ 7. MTU 配置
# 确保所有网卡 MTU 一致
ip link show | grep mtu

# □ 8. 时间同步
timedatectl status

# □ 9. CNI 配置备份
kubectl get cm -n kube-system kube-flannel-cfg -o yaml > flannel-backup.yaml
calicoctl get ippool -o yaml > calico-ippool-backup.yaml

# □ 10. 监控和告警
# 确保已部署监控系统
kubectl get pods -n monitoring
```

---

## 9. 常见问题 FAQ

### Q1: Flannel 和 Calico 可以共存吗？

**答：** 不推荐，但有特殊场景：

```bash
# Canal = Flannel (网络) + Calico (策略)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/canal/master/k8s-install/1.7/canal.yaml

# 这样可以获得：
# ✅ Flannel 的简单性
# ✅ Calico 的网络策略功能
```

### Q2: 如何从 Flannel 迁移到 Calico？

**答：** 需要谨慎规划，通常需要重建集群：

```bash
# 方案 1: 蓝绿部署（推荐）
# 1. 搭建新的 Calico 集群
# 2. 迁移应用
# 3. 切换流量
# 4. 下线旧集群

# 方案 2: 原地升级（风险大）
# 1. 备份所有配置
kubectl get all -A -o yaml > backup.yaml

# 2. 驱逐所有 Pod
kubectl drain --all-nodes --ignore-daemonsets

# 3. 删除 Flannel
kubectl delete -f kube-flannel.yml
rm -rf /etc/cni/net.d/*
rm -rf /var/lib/cni/*

# 4. 清理 iptables
iptables -F && iptables -t nat -F && iptables -t mangle -F
iptables -X && iptables -t nat -X && iptables -t mangle -X

# 5. 安装 Calico
kubectl apply -f calico.yaml

# 6. 重启所有节点
systemctl reboot

# 7. 验证
kubectl get nodes
kubectl get pods -A
```

### Q3: 为什么 ping Service ClusterIP 不通？

**答：** 这是正常的：

```
原因：
1. ClusterIP 是虚拟 IP，没有真实的网络接口响应
2. iptables/IPVS 规则主要处理 TCP/UDP，对 ICMP 支持有限
3. ICMP 没有端口概念，Service 的负载均衡基于端口

解决：
# 使用 TCP/UDP 测试
kubectl run test --rm -it --image=busybox -- \
  telnet <service-ip> <port>

# 或使用 curl
kubectl run test --rm -it --image=curlimages/curl -- \
  curl http://<service-ip>:<port>
```

### Q4: 如何调试"Connection refused"错误？

**答：** 系统化排查：

```bash
# 1. 确认目标 Pod 是否运行
kubectl get pods -o wide

# 2. 确认端口是否监听
kubectl exec <pod-name> -- netstat -lntp

# 3. 确认 Service Endpoints
kubectl get endpoints <service-name>

# 4. 测试 Pod IP（绕过 Service）
kubectl exec test-pod -- curl http://<pod-ip>:<port>

# 5. 检查 NetworkPolicy
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name>

# 6. 检查防火墙
iptables -L -n | grep <port>

# 7. 查看应用日志
kubectl logs <pod-name>
```

### Q5: conntrack table full 怎么办？

**答：** 增加 conntrack 表大小：

```bash
# 临时修改
sysctl -w net.netfilter.nf_conntrack_max=1000000
sysctl -w net.netfilter.nf_conntrack_buckets=250000

# 永久修改
cat >> /etc/sysctl.conf <<EOF
net.netfilter.nf_conntrack_max = 1000000
net.netfilter.nf_conntrack_buckets = 250000
net.netfilter.nf_conntrack_tcp_timeout_established = 86400
EOF

sysctl -p

# 查看当前使用情况
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max

# 监控
watch 'cat /proc/sys/net/netfilter/nf_conntrack_count'
```

---

## 10. 总结与参考资源

### 10.1 核心要点总结

**网络模型：**

- ✅ Kubernetes 采用扁平网络，Pod 间 IP 直连
- ✅ 所有通信不经过 NAT（访问 Service 时会 DNAT）
- ✅ CNI 插件负责实现网络模型

**Service 机制：**

- ✅ Service ClusterIP 是虚拟 IP
- ✅ kube-proxy 通过 iptables/IPVS 实现 DNAT 和负载均衡
- ✅ conntrack 追踪连接状态，保证响应正确返回

**CNI 选择：**

- 📦 **Flannel**: 简单稳定，适合小规模
- 🚀 **Calico**: 性能强劲，功能丰富，适合生产环境
- ⚡ **Cilium**: 基于 eBPF，性能最优，未来趋势

**故障排查：**

- 🔍 从上到下：应用 → Service → Pod → CNI → 节点网络
- 🔍 工具链：kubectl, tcpdump, iptables, calicoctl
- 🔍 抓包是王道：看到数据包才能确定问题

### 10.2 学习路径建议

```txt
入门阶段：
  └─ 理解 K8s 网络三原则
  └─ 搭建单节点集群，观察网络组件
  └─ 学习 kubectl 网络相关命令

进阶阶段：
  └─ 深入理解 Service 和 DNAT
  └─ 对比 Flannel 和 Calico
  └─ 实践 NetworkPolicy

高级阶段：
  └─ 阅读 CNI 插件源码
  └─ 性能调优和大规模部署
  └─ 多集群网络架构
```

### 10.3 参考资源

**官方文档：**

- [Kubernetes 网络模型](https://kubernetes.io/docs/concepts/cluster-administration/networking/)
- [Flannel 官方文档](https://github.com/flannel-io/flannel)
- [Calico 官方文档](https://docs.tigera.io/calico/latest/about/)
- [CNI 规范](https://github.com/containernetworking/cni)

**工具：**

- [calicoctl](https://github.com/projectcalico/calico)
- [netshoot](https://github.com/nicolaka/netshoot) - 网络调试容器
- [ksniff](https://github.com/eldadru/ksniff) - K8s 抓包工具

**社区：**

- [Kubernetes Slack #sig-network](https://kubernetes.slack.com/)
- [CNCF Network Working Group](https://github.com/cncf/tag-network)

**书籍：**

- 《Kubernetes 网络权威指南》
- 《Kubernetes in Action》
- 《Container Networking》

---

## 附录：快速参考命令

```bash
# ========== 基础检查 ==========
# 查看节点网络
kubectl get nodes -o wide
kubectl describe node <node-name>

# 查看 Pod 网络
kubectl get pods -o wide -A
kubectl describe pod <pod-name> -n <namespace>
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -A 5 "podIP\|hostIP"

# 查看 Service 和 Endpoint
kubectl get svc -A
kubectl get endpoints -A
kubectl describe svc <service-name> -n <namespace>

# ========== CNI 相关 ==========
# Flannel 状态检查
kubectl get pods -n kube-system | grep flannel
kubectl logs -n kube-system <flannel-pod-name>
kubectl exec -n kube-system <flannel-pod-name> -- cat /etc/kube-flannel/net-conf.json

# Calico 状态检查
kubectl get pods -n kube-system | grep calico
calicoctl node status
calicoctl get ippool -o wide
calicoctl get workloadendpoint --all-namespaces

# 查看 CNI 配置
cat /etc/cni/net.d/*.conf
ls -la /opt/cni/bin/

# ========== 网络诊断 ==========
# Pod 内部网络测试
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh
# 在 Pod 内执行
ip addr show
ip route show
cat /etc/resolv.conf
nslookup kubernetes.default
ping <other-pod-ip>
curl <service-name>.<namespace>.svc.cluster.local

# 测试 Pod 到 Pod 连通性
kubectl run test-pod --image=busybox --rm -it -- sh
# 在测试 Pod 内
ping <target-pod-ip>
wget -O- <target-pod-ip>:<port>

# 测试 Service 连通性
kubectl run curl --image=curlimages/curl --rm -it -- sh
curl <service-name>.<namespace>.svc.cluster.local:<port>

# ========== iptables 规则检查 ==========
# 查看 kube-proxy 规则
iptables -t nat -L -n -v | grep <service-cluster-ip>
iptables -t nat -L KUBE-SERVICES -n -v
iptables -t nat -L KUBE-SEP-* -n -v

# 查看 DNAT 规则
iptables -t nat -L PREROUTING -n -v
iptables -t nat -L OUTPUT -n -v

# 查看 Flannel/Calico 规则
iptables -t filter -L FORWARD -n -v
iptables -t mangle -L -n -v

# ========== 网络抓包分析 ==========
# 在节点上抓包
tcpdump -i any -nn host <pod-ip>
tcpdump -i flannel.1 -nn
tcpdump -i cali* -nn
tcpdump -i docker0 -nn

# 抓取特定端口流量
tcpdump -i any -nn port <port>

# 保存抓包文件
tcpdump -i any -w /tmp/capture.pcap -nn host <pod-ip>

# ========== CoreDNS 诊断 ==========
# 查看 CoreDNS 状态
kubectl get pods -n kube-system | grep coredns
kubectl logs -n kube-system <coredns-pod-name>

# 测试 DNS 解析
kubectl exec -it <pod-name> -- nslookup kubernetes.default
kubectl exec -it <pod-name> -- nslookup <service-name>.<namespace>.svc.cluster.local
kubectl exec -it <pod-name> -- dig @<coredns-cluster-ip> kubernetes.default.svc.cluster.local

# 查看 CoreDNS 配置
kubectl get configmap coredns -n kube-system -o yaml

# ========== 网络策略 (NetworkPolicy) ==========
# 查看网络策略
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name> -n <namespace>

# 应用网络策略示例
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: test
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: allowed
    ports:
    - protocol: TCP
      port: 80
EOF

# ========== 性能测试 ==========
# 使用 iperf3 测试带宽
# 服务端
kubectl run iperf3-server --image=networkstatic/iperf3 --port=5201 --expose -- -s
# 客户端
kubectl run iperf3-client --image=networkstatic/iperf3 --rm -it -- -c iperf3-server

# 测试延迟
kubectl exec -it <pod-name> -- ping -c 100 <target-pod-ip>

# ========== 常见问题快速修复 ==========
# 重启 kube-proxy
kubectl rollout restart daemonset kube-proxy -n kube-system

# 重启 Flannel
kubectl rollout restart daemonset kube-flannel-ds -n kube-system

# 重启 Calico
kubectl rollout restart daemonset calico-node -n kube-system

# 重启 CoreDNS
kubectl rollout restart deployment coredns -n kube-system

# 清理 iptables 规则（慎用）
iptables -F
iptables -t nat -F
iptables -t mangle -F
systemctl restart kubelet
systemctl restart docker

# ========== 日志收集 ==========
# 收集所有网络相关日志
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=100
kubectl logs -n kube-system -l app=flannel --tail=100
kubectl logs -n kube-system -l k8s-app=calico-node --tail=100
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100

# 查看系统日志
journalctl -u kubelet -f
journalctl -u docker -f
dmesg | grep -i "network\|eth\|flannel\|calico"

# ========== 集群网络信息汇总 ==========
# 一键收集网络配置信息
cat <<'SCRIPT' > /tmp/collect-network-info.sh
#!/bin/bash
echo "=== Node Network Info ==="
ip addr show
ip route show
echo "=== CNI Config ==="
cat /etc/cni/net.d/*.conf
echo "=== Kube-proxy Config ==="
kubectl get configmap kube-proxy -n kube-system -o yaml
echo "=== Service CIDR ==="
kubectl cluster-info dump | grep -i service-cluster-ip-range
echo "=== Pod CIDR ==="
kubectl get nodes -o jsonpath='{.items[*].spec.podCIDR}'
SCRIPT
bash /tmp/collect-network-info.sh
```

## 常用网络工具安装

```bash
# 在调试容器中安装网络工具
# Alpine Linux
apk add --no-cache curl wget bind-tools tcpdump iperf3 netcat-openbsd

# Ubuntu/Debian
apt-get update && apt-get install -y curl wget dnsutils tcpdump iperf3 netcat

# CentOS/RHEL
yum install -y curl wget bind-utils tcpdump iperf3 nc

# 创建网络调试 Pod
kubectl run netshoot --image=nicolaka/netshoot --rm -it -- /bin/bash
```

## 快速故障定位流程

```bash
# 1. 检查 Pod 状态
kubectl get pods -o wide --all-namespaces | grep -v Running

# 2. 检查节点状态
kubectl get nodes

# 3. 检查 CNI 插件状态
kubectl get pods -n kube-system | grep -E "flannel|calico|weave|cilium"

# 4. 检查 Service 和 Endpoints
kubectl get svc,ep --all-namespaces

# 5. 检查 DNS
kubectl exec -it <any-pod> -- nslookup kubernetes.default

# 6. 检查网络策略
kubectl get networkpolicy --all-namespaces

# 7. 查看错误日志
kubectl logs -n kube-system -l component=kube-proxy --tail=50
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50
```
