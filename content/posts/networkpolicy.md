---
title: "Kubernetes NetworkPolicy 完全指南：从入门到实战"
date: 2025-08-04T17:53:05+08:00
lastmod: 2025-08-04T17:53:05+08:00
draft: false
tags: ["k8s", "network", "networkpolicy]
categories: ["k8s", "network", "networkpolicy"]
author: "百里"
comment: false
toc: true
reward: true
---

## 前言

在 Kubernetes 集群中，默认情况下所有 Pod 之间都可以自由通信。但在生产环境中，我们往往需要对网络流量进行精细化控制，这时就需要用到 NetworkPolicy。本文将从基础概念到实际应用，全面介绍 NetworkPolicy 的使用方法。

## 什么是 NetworkPolicy？

NetworkPolicy 是 Kubernetes 的一种资源对象，用于定义 Pod 之间的网络访问规则。它类似于传统网络中的防火墙规则，可以控制：

- **入站流量（Ingress）**：哪些来源可以访问目标 Pod
- **出站流量（Egress）**：目标 Pod 可以访问哪些目的地

## 前置条件

在开始之前，确保您的集群满足以下条件：

### 1. CNI 插件支持

NetworkPolicy 需要 CNI 插件的支持，常见支持的插件包括：

- **Calico**（推荐）
- **Cilium**
- **Weave Net**
- **Antrea**

⚠️ **注意**：Flannel 默认不支持 NetworkPolicy

### 2. 验证支持情况

```bash
# 检查当前 CNI 插件
kubectl get pods -n kube-system | grep -E "(calico|cilium|weave|antrea)"

# 创建测试策略验证支持
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-policy
  namespace: default
spec:
  podSelector: {}
  policyTypes: []
EOF

# 如果支持，会输出 "networkpolicy/test-policy created"
kubectl get networkpolicies -n default
```

## NetworkPolicy 基础语法

### 完整结构示例

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: example-policy
  namespace: production
spec:
  # 选择应用此策略的 Pod
  podSelector:
    matchLabels:
      app: web-server
  
  # 策略类型：Ingress（入站）和/或 Egress（出站）
  policyTypes:
    - Ingress
    - Egress
  
  # 入站规则
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
        - namespaceSelector:
            matchLabels:
              name: allowed-namespace
        - ipBlock:
            cidr: 192.168.1.0/24
            except:
              - 192.168.1.100/32
      ports:
        - protocol: TCP
          port: 8080
  
  # 出站规则
  egress:
    - to:
        - podSelector:
            matchLabels:
              role: database
      ports:
        - protocol: TCP
          port: 5432
```

### 关键字段解析

| 字段 | 说明 |
|------|------|
| `podSelector` | 选择应用此策略的目标 Pod |
| `policyTypes` | 策略类型，可以是 `Ingress`、`Egress` 或两者 |
| `ingress.from` | 定义允许的入站来源 |
| `egress.to` | 定义允许的出站目标 |
| `ports` | 指定允许的端口和协议 |

## 实战案例

### 案例 1：拒绝所有流量（默认拒绝策略）

首先创建一个拒绝所有流量的基础策略：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}  # 选择命名空间中的所有 Pod
  policyTypes:
    - Ingress
    - Egress
  # 没有定义 ingress 和 egress 规则，因此拒绝所有流量
```

### 案例 2：Web 应用三层架构

创建一个典型的 Web 应用场景：Frontend → Backend → Database

#### 环境准备

```bash
# 创建命名空间和标签
kubectl create namespace webapp
kubectl label namespace webapp name=webapp

# 部署应用（示例）
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: webapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
      tier: web
  template:
    metadata:
      labels:
        app: frontend
        tier: web
    spec:
      containers:
      - name: frontend
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: webapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
      tier: api
  template:
    metadata:
      labels:
        app: backend
        tier: api
    spec:
      containers:
      - name: backend
        image: nginx:alpine
        ports:
        - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: database
  namespace: webapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: database
      tier: db
  template:
    metadata:
      labels:
        app: database
        tier: db
    spec:
      containers:
      - name: database
        image: postgres:13
        ports:
        - containerPort: 5432
EOF
```

#### 网络策略配置

**1. Frontend 策略**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: webapp
spec:
  podSelector:
    matchLabels:
      tier: web
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # 允许来自集群外部的流量（通过 Ingress Controller）
    - ports:
      - protocol: TCP
        port: 80
  egress:
    # 允许访问 Backend
    - to:
      - podSelector:
          matchLabels:
            tier: api
      ports:
      - protocol: TCP
        port: 8080
    # 允许 DNS 解析
    - to: []
      ports:
      - protocol: UDP
        port: 53
```

**2. Backend 策略**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: webapp
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # 只允许来自 Frontend 的流量
    - from:
      - podSelector:
          matchLabels:
            tier: web
      ports:
      - protocol: TCP
        port: 8080
  egress:
    # 允许访问 Database
    - to:
      - podSelector:
          matchLabels:
            tier: db
      ports:
      - protocol: TCP
        port: 5432
    # 允许 DNS 解析
    - to: []
      ports:
      - protocol: UDP
        port: 53
```

**3. Database 策略**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: webapp
spec:
  podSelector:
    matchLabels:
      tier: db
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # 只允许来自 Backend 的流量
    - from:
      - podSelector:
          matchLabels:
            tier: api
      ports:
      - protocol: TCP
        port: 5432
  egress:
    # 允许 DNS 解析（如需要）
    - to: []
      ports:
      - protocol: UDP
        port: 53
```

### 案例 3：跨命名空间访问控制

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cross-namespace-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Ingress
  ingress:
    # 允许来自 staging 命名空间的特定 Pod
    - from:
      - namespaceSelector:
          matchLabels:
            name: staging
        podSelector:
          matchLabels:
            app: test-client
      ports:
      - protocol: TCP
        port: 8080
    # 允许来自相同命名空间的所有 Pod
    - from:
      - podSelector: {}
      ports:
      - protocol: TCP
        port: 8080
```

### 案例 4：基于 IP 的访问控制

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ip-allowlist-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: admin-panel
  policyTypes:
    - Ingress
  ingress:
    # 只允许特定 IP 段的流量
    - from:
      - ipBlock:
          cidr: 10.0.0.0/8
          except:
            - 10.0.1.0/24  # 排除特定子网
      - ipBlock:
          cidr: 192.168.1.0/24
      ports:
      - protocol: TCP
        port: 443
```

## 测试和验证

### 1. 创建测试 Pod

```bash
# 创建测试客户端
kubectl run test-client --image=busybox -it --rm --restart=Never -- sh

# 在 Pod 内测试连接
wget -qO- --timeout=2 http://frontend-service.webapp.svc.cluster.local
```

### 2. 使用 netshoot 进行网络调试

```bash
kubectl run netshoot --image=nicolaka/netshoot -it --rm --restart=Never
```

### 3. 查看策略状态

```bash
# 列出所有网络策略
kubectl get networkpolicy -A

# 查看策略详情
kubectl describe networkpolicy frontend-policy -n webapp

# 查看 Pod 标签
kubectl get pods -n webapp --show-labels
```

## 常见问题和最佳实践

### 问题 1：策略不生效

**可能原因：**

- CNI 插件不支持 NetworkPolicy
- Pod 标签选择器错误
- 策略应用到错误的命名空间

**解决方法：**

```bash
# 检查 CNI 插件
kubectl get pods -n kube-system | grep -E "(calico|cilium)"

# 验证标签选择器
kubectl get pods --show-labels -n your-namespace
```

### 问题 2：DNS 解析失败

NetworkPolicy 可能会阻止 DNS 查询，需要显式允许：

```yaml
egress:
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

### 问题 3：服务发现问题

确保允许访问 Kubernetes API Server：

```yaml
egress:
  - to:
    - ipBlock:
        cidr: 10.96.0.1/32  # API Server IP
    ports:
    - protocol: TCP
      port: 443
```

### 最佳实践

1. **从拒绝开始**：先创建 `deny-all` 策略，再逐步添加允许规则
2. **最小权限原则**：只开放必需的端口和协议
3. **使用标签管理**：合理设计 Pod 和 Namespace 标签
4. **分层设计**：按应用层次设计网络策略
5. **文档化**：为每个策略添加清晰的注释说明
6. **定期审计**：定期检查和更新网络策略

## 高级功能

### 1. 命名端口支持

```yaml
egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: db-port  # 使用命名端口
```

### 2. 组合选择器

```yaml
ingress:
  - from:
    # 必须同时满足命名空间和 Pod 标签条件
    - namespaceSelector:
        matchLabels:
          name: production
      podSelector:
        matchLabels:
          role: api-client
```

### 3. 空规则的含义

```yaml
# 允许所有入站流量
ingress:
  - {}

# 允许所有出站流量  
egress:
  - {}
```

## 监控和日志

### 使用 Calico 查看策略日志

```bash
# 启用 Calico 日志记录
kubectl patch felixconfiguration default --type merge --patch '{"spec":{"flowLogsEnableNetworkPolicy":true}}'

# 查看拒绝的连接
kubectl logs -n calico-system -l k8s-app=calico-node | grep "calico-packet"
```

### 使用 Cilium Hubble

```bash
# 安装 Hubble CLI
hubble observe --type drop

# 查看网络流量
hubble observe --namespace webapp
```

## 总结

NetworkPolicy 是 Kubernetes 中实现网络安全的重要工具。通过合理设计和应用网络策略，我们可以：

- 实现零信任网络架构
- 符合安全合规要求
- 减少攻击面
- 提高系统安全性

掌握 NetworkPolicy 的使用，是构建安全 Kubernetes 集群的必备技能。在实际应用中，建议从简单的场景开始，逐步构建复杂的网络安全策略。
