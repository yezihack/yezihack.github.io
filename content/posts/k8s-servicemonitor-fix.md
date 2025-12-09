---
title: "Prometheus ServiceMonitor 无法发现指标问题排查与解决方案"
date: 2025-12-09T19:02:19+08:00
lastmod: 2025-12-09T19:02:19+08:00
draft: false
tags: ["k8s", "prometheus", "ingress-nginx", "debug"]
categories: ["k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

## 问题现象

在 Kubernetes 集群中部署了 kube-prometheus-stack 和 ingress-nginx 后，发现 Prometheus 无法抓取 ingress-nginx 的 metrics 指标：

- ✅ 在容器内可以直接访问 metrics 端点
- ✅ ServiceMonitor 配置正确
- ✅ Service 端口配置正确
- ❌ Prometheus UI 的 Targets 页面找不到 ingress-nginx 相关目标

```bash
# 在 busybox 容器中测试 metrics 端点正常
kubectl run busybox --rm -it --image=busybox -- sh
curl -sS ingress-nginx-controller-metrics.ingress-nginx:10254/metrics | grep nginx_ingress_controller
# 输出正常，说明 metrics 端点工作正常
```

## 问题原因

Prometheus Operator 使用标签选择器（Label Selector）来决定监控哪些 ServiceMonitor。默认情况下，kube-prometheus-stack 要求 ServiceMonitor 必须包含 `release: kube-prometheus-stack` 标签。

查看 Prometheus 配置：

```bash
kubectl get prometheus -n monitoring kube-prometheus-stack-prometheus -o yaml | grep -A 5 serviceMonitorSelector
```

输出：

```yaml
serviceMonitorSelector:
  matchLabels:
    release: kube-prometheus-stack
```

这意味着只有带有 `release: kube-prometheus-stack` 标签的 ServiceMonitor 才会被 Prometheus 发现和监控。

## 解决方案

### 方案一：为 ServiceMonitor 添加所需标签（推荐用于已安装环境）

这是最快速、影响最小的解决方案，适用于 Prometheus 已经部署完成的场景。

#### 1. 检查当前 ServiceMonitor 的标签

```bash
kubectl get servicemonitor -n ingress-nginx ingress-nginx-controller -o yaml | grep -A 8 "metadata:"
```

输出示例：

```yaml
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    # 缺少 release: kube-prometheus-stack
```

#### 2. 添加所需标签

**方法 A：使用 kubectl label 命令**

```bash
kubectl label servicemonitor -n ingress-nginx ingress-nginx-controller \
  release=kube-prometheus-stack
```

**方法 B：使用 kubectl patch 命令**

```bash
kubectl patch servicemonitor -n ingress-nginx ingress-nginx-controller \
  --type=merge \
  -p '{"metadata":{"labels":{"release":"kube-prometheus-stack"}}}'
```

**方法 C：直接编辑**

```bash
kubectl edit servicemonitor -n ingress-nginx ingress-nginx-controller
```

在 `metadata.labels` 下添加：

```yaml
metadata:
  labels:
    release: kube-prometheus-stack  # 添加这一行
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    # ... 其他标签
```

#### 3. 验证标签添加成功

```bash
kubectl get servicemonitor -n ingress-nginx ingress-nginx-controller --show-labels
```

#### 4. 等待 Prometheus 发现新的 Target

等待 30-60 秒后，访问 Prometheus UI：

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

浏览器访问 `http://localhost:9090/targets`，搜索 `ingress`，应该能看到新的监控目标。

#### 5. 测试指标查询

在 Prometheus UI 的 Graph 页面执行查询：

```promql
nginx_ingress_controller_requests
```

如果返回数据，说明配置成功！

#### 使用 Helm 持久化配置

如果使用 Helm 安装的 ingress-nginx，可以通过 values 文件持久化这个配置：

```yaml
# ingress-nginx-values.yaml
controller:
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
      additionalLabels:
        release: kube-prometheus-stack  # 关键配置
```

重新部署：

```bash
helm upgrade ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx \
  -f ingress-nginx-values.yaml
```

### 方案二：安装时取消 ServiceMonitor 标签限制（推荐用于新部署）

这是最彻底的解决方案，允许 Prometheus 发现所有命名空间下的所有 ServiceMonitor，无需额外配置标签。

#### 1. 添加 Helm 仓库

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

#### 2. 使用自定义配置安装

```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.serviceMonitorSelector={} \
  --set prometheus.prometheusSpec.serviceMonitorNamespaceSelector={}
```

#### 关键参数说明

| 参数 | 说明 |
|------|------|
| `serviceMonitorSelectorNilUsesHelmValues=false` | 禁用 Helm 默认的标签选择器 |
| `serviceMonitorSelector={}` | 清空标签选择器，匹配所有 ServiceMonitor |
| `serviceMonitorNamespaceSelector={}` | 允许跨命名空间发现 ServiceMonitor |
| `podMonitorSelectorNilUsesHelmValues=false` | 同样适用于 PodMonitor |
| `podMonitorSelector={}` | 清空 PodMonitor 标签选择器 |

#### 3. 或使用 values 文件安装

创建 `prometheus-values.yaml`：

```yaml
prometheus:
  prometheusSpec:
    # 取消 ServiceMonitor 标签限制
    serviceMonitorSelectorNilUsesHelmValues: false
    serviceMonitorSelector: {}
    
    # 取消 PodMonitor 标签限制
    podMonitorSelectorNilUsesHelmValues: false
    podMonitorSelector: {}
    
    # 允许跨命名空间发现
    serviceMonitorNamespaceSelector: {}
    podMonitorNamespaceSelector: {}
```

安装：

```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f prometheus-values.yaml
```

#### 4. 升级现有部署

如果已经安装了 kube-prometheus-stack，可以使用 `helm upgrade` 升级：

```bash
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --reuse-values \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.serviceMonitorSelector={} \
  --set prometheus.prometheusSpec.serviceMonitorNamespaceSelector={}
```

#### 5. 验证配置

```bash
kubectl get prometheus -n monitoring kube-prometheus-stack-prometheus -o yaml | grep -A 5 serviceMonitorSelector
```

期望输出：

```yaml
serviceMonitorSelector: {}  # 空对象，表示匹配所有
```

## 两种方案对比

| 特性 | 方案一：添加标签 | 方案二：取消限制 |
|------|-----------------|-----------------|
| **适用场景** | 已部署环境 | 新部署或可以重新配置 |
| **操作难度** | 简单，一条命令 | 需要修改 Helm 配置 |
| **安全性** | 更精确的控制 | 监控范围更广 |
| **维护成本** | 每个 ServiceMonitor 需要添加标签 | 一次配置，无需维护 |
| **影响范围** | 仅影响特定 ServiceMonitor | 影响所有 ServiceMonitor 发现 |
| **回滚难度** | 删除标签即可 | 需要重新配置 Helm |

## 完整排查流程

当遇到 ServiceMonitor 不生效的问题时，按以下流程排查：

### 1. 验证 Metrics 端点可访问

```bash
# 在集群内测试
kubectl run busybox --rm -it --image=busybox -- sh
wget -qO- http://ingress-nginx-controller-metrics.ingress-nginx:10254/metrics | head

# 或从 Prometheus Pod 测试
kubectl exec -n monitoring prometheus-kube-prometheus-stack-prometheus-0 -c prometheus -- \
  wget -qO- http://ingress-nginx-controller-metrics.ingress-nginx:10254/metrics | head
```

### 2. 检查 ServiceMonitor 配置

```bash
kubectl get servicemonitor -n ingress-nginx ingress-nginx-controller -o yaml
```

关键检查点：

- `spec.endpoints[].port` 是否与 Service 的端口名称匹配
- `spec.selector.matchLabels` 是否与 Service 的标签匹配
- `spec.namespaceSelector.matchNames` 是否正确

### 3. 检查 Service 配置

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller-metrics -o yaml
```

确认：

- 端口名称与 ServiceMonitor 中的 `port` 字段匹配
- Service 标签与 ServiceMonitor 的 `selector` 匹配

### 4. 检查 Prometheus 选择器

```bash
kubectl get prometheus -n monitoring -o yaml | grep -A 10 serviceMonitorSelector
kubectl get prometheus -n monitoring -o yaml | grep -A 10 serviceMonitorNamespaceSelector
```

### 5. 查看 Prometheus Operator 日志

```bash
kubectl logs -n monitoring deployment/kube-prometheus-stack-operator --tail=50 | grep -i "servicemonitor\|error"
```

### 6. 检查 Prometheus Targets

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

访问 `http://localhost:9090/targets` 查看是否有对应的 target。

## 常见问题

### Q1: 添加标签后仍然不生效？

等待 30-60 秒让 Prometheus Operator 同步配置。可以查看 Operator 日志确认：
```bash
kubectl logs -n monitoring deployment/kube-prometheus-stack-operator -f
```

### Q2: 如何批量为多个 ServiceMonitor 添加标签？

```bash
# 为特定命名空间下的所有 ServiceMonitor 添加标签
kubectl label servicemonitor -n ingress-nginx --all release=kube-prometheus-stack

# 为所有命名空间下的 ServiceMonitor 添加标签
kubectl get servicemonitor -A -o json | \
  jq -r '.items[] | "\(.metadata.namespace) \(.metadata.name)"' | \
  while read ns name; do
    kubectl label servicemonitor -n "$ns" "$name" release=kube-prometheus-stack --overwrite
  done
```

### Q3: 方案二会监控所有 ServiceMonitor 吗？

是的，`serviceMonitorSelector: {}` 意味着匹配所有 ServiceMonitor。如果需要更精细的控制，可以使用其他标签：

```yaml
prometheus:
  prometheusSpec:
    serviceMonitorSelector:
      matchLabels:
        prometheus: enabled  # 自定义标签
```

### Q4: 如何限制只监控特定命名空间？

```yaml
prometheus:
  prometheusSpec:
    serviceMonitorSelector: {}
    serviceMonitorNamespaceSelector:
      matchLabels:
        monitoring: enabled  # 只监控带有此标签的命名空间
```

然后为需要监控的命名空间添加标签：

```bash
kubectl label namespace ingress-nginx monitoring=enabled
kubectl label namespace app-namespace monitoring=enabled
```

## 最佳实践建议

1. **新部署环境**：推荐使用方案二，统一配置，减少后续维护成本
2. **已有环境**：使用方案一快速解决问题，避免影响现有监控
3. **多租户环境**：使用命名空间标签控制监控范围，平衡灵活性和安全性
4. **自动化部署**：在 Helm values 文件中预配置好标签，确保一致性
5. **文档记录**：记录选择器配置和标签约定，方便团队协作

## 总结

Prometheus ServiceMonitor 不生效的核心原因是标签选择器不匹配。根据环境和需求选择合适的解决方案：

- **快速修复**：为 ServiceMonitor 添加 `release: kube-prometheus-stack` 标签
- **彻底解决**：安装时配置 `serviceMonitorSelector: {}` 取消限制
