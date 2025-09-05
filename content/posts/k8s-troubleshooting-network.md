---
title: "Kubernetes 网络排障手册：从容器网络到服务发现的完整解决方案"
date: 2025-09-05T16:03:59+08:00
lastmod: 2025-09-05T16:03:59+08:00
draft: false
tags: ["k8s", "网络排障", "故障排查"]
categories: ["k8s", "网络"]
author: "百里"
comment: false
toc: true
reward: true
---

在 Kubernetes 集群的运维过程中，网络问题是最常见也是最复杂的故障类型之一。本文将基于一个真实的生产环境案例，详细介绍如何系统性地排查和解决 K8s 网络问题，涵盖从基础网络连通性到 DNS 解析的完整故障链条。

## 案例背景

在一个运行 Kubernetes 1.29 的生产集群中，我们遇到了以下问题：

- 宿主机网络正常，可以访问外网
- 容器内无法访问外网
- 使用 Flannel 作为 CNI 网络插件
- 后续发现容器无法 ping 通 CoreDNS Service IP

通过深入排查，我们发现了一个有趣的现象：DNS 配置错误不仅影响域名解析，还会导致整个 Service 网络不可达。

## 第一部分：容器外网访问故障排查

### 1.1 基础网络连通性检查

当容器无法访问外网时，首先需要验证网络的分层连通性：

```bash
# 进入问题 Pod 测试网络
kubectl exec -it <pod-name> -- /bin/sh

# 测试容器到节点网络
ping 10.244.0.1  # Pod 网关，通常是节点IP

# 测试集群内部网络
nslookup kubernetes.default.svc.cluster.local

# 测试外网IP连通性
ping 8.8.8.8

# 测试外网DNS解析
nslookup google.com
```

**诊断要点**：

- 如果 ping 节点 IP 不通：CNI 网络问题
- 如果 ping 外网 IP 不通：NAT/路由问题  
- 如果 IP 通但 DNS 不通：DNS 配置问题

### 1.2 Flannel 网络状态检查

Flannel 作为覆盖网络，其状态直接影响 Pod 间通信：

```bash
# 检查 Flannel Pod 运行状态
kubectl get pods -n kube-system | grep flannel

# 查看 Flannel 配置
kubectl get configmap kube-flannel-cfg -n kube-system -o yaml

# 分析 Flannel 日志
kubectl logs -n kube-system -l app=flannel

# 检查网络接口状态
ip addr show flannel.1
ip route show | grep flannel
```

**常见问题**：

- Flannel Pod 启动失败
- 网络配置与实际不符
- VXLAN 隧道建立失败

### 1.3 宿主机网络配置验证

外网访问的关键在于正确的 NAT 配置和 IP 转发：

```bash
# 检查 IP 转发（必须为 1）
cat /proc/sys/net/ipv4/ip_forward

# 永久开启 IP 转发
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 检查关键的 MASQUERADE 规则
sudo iptables -t nat -L POSTROUTING -n | grep MASQUERADE

# 应该看到类似规则：
# MASQUERADE  all  --  10.244.0.0/16    0.0.0.0/0
```

### 1.4 iptables 规则诊断与修复

最常见的外网访问问题是 MASQUERADE 规则缺失：

```bash
# 检查完整的 NAT 规则
sudo iptables -t nat -L -n

# 手动添加 MASQUERADE 规则（临时修复）
sudo iptables -t nat -A POSTROUTING -s 10.244.0.0/16 -j MASQUERADE

# 检查 FORWARD 链规则
sudo iptables -t filter -L FORWARD -n
```

**系统化排查脚本**：

```bash
#!/bin/bash
echo "=== K8s 外网访问排查脚本 ==="

echo "1. IP 转发状态："
cat /proc/sys/net/ipv4/ip_forward

echo "2. Flannel 网络状态："
kubectl get pods -n kube-system | grep flannel

echo "3. MASQUERADE 规则："
sudo iptables -t nat -L POSTROUTING -n | grep MASQUERADE | head -3

echo "4. 测试容器外网连通性："
kubectl run nettest --image=busybox --rm -it --restart=Never -- ping -c 3 8.8.8.8

echo "5. 检查网络接口："
ip addr show | grep -E "(flannel|cni)"
```

## 第二部分：Service 网络故障深度排查

在解决了基础网络问题后，我们发现了新问题：容器能 ping 通节点 IP（10.244.0.1），但无法 ping 通 CoreDNS 的 Service IP（10.96.0.3）。

### 2.1 Service 网络架构理解

Kubernetes Service 网络依赖 kube-proxy 创建的 iptables/ipvs 规则实现：

```sh
客户端请求 Service IP → iptables DNAT 规则 → 转发到后端 Pod IP
```

### 2.2 kube-proxy 状态检查

```bash
# 查看 kube-proxy 运行状态
kubectl get pods -n kube-system | grep kube-proxy

# 检查 kube-proxy 日志
kubectl logs -n kube-system -l k8s-app=kube-proxy

# 查看 kube-proxy 配置
kubectl get configmap kube-proxy -n kube-system -o yaml

# 确认 proxy 模式
kubectl logs -n kube-system -l k8s-app=kube-proxy | grep "Using.*Proxy"
```

### 2.3 Service 和 Endpoints 验证

Service 网络的核心是 Endpoints 对象：

```bash
# 检查 CoreDNS Service 配置
kubectl get svc -n kube-system | grep kube-dns
kubectl describe svc kube-dns -n kube-system

# 检查 Endpoints（最关键）
kubectl get endpoints kube-dns -n kube-system
kubectl describe endpoints kube-dns -n kube-system

# 正常输出应包含：
# Addresses: 10.244.0.2:53,10.244.1.2:53
```

**Endpoints 为空的常见原因**：

- Pod 标签与 Service selector 不匹配
- Pod 未通过就绪性检查
- Pod 处于异常状态

### 2.4 iptables 规则深度分析

```bash
# 查看 Service 相关的 iptables 规则
sudo iptables -t nat -L -n | grep 10.96.0.3

# 查看 KUBE-SERVICES 链
sudo iptables -t nat -L KUBE-SERVICES -n

# 查看具体 Service 的转发规则
sudo iptables -t nat -L KUBE-SVC-TCOU7JCQXEZGVUNU -n
```

### 2.5 Service 网络故障修复

```bash
# 重启 kube-proxy（最常见的解决方案）
kubectl rollout restart daemonset kube-proxy -n kube-system

# 强制重新创建 kube-proxy Pod
kubectl delete pods -n kube-system -l k8s-app=kube-proxy

# 验证修复效果
kubectl rollout status daemonset kube-proxy -n kube-system
```

## 第三部分：CoreDNS 配置问题的深度分析

最有趣的发现是：DNS 配置错误导致的连锁反应远超预期。

### 3.1 问题现象

原始配置中的问题：

```yaml
# 错误配置
forward . 233.5.5.5 114.114.114.114

# 修正配置  
forward . 223.5.5.5 114.114.114.114
```

**现象**：

- 修改前：无法 ping CoreDNS Pod，无法 ping Service IP
- 修改后：一切恢复正常

### 3.2 技术原理深度解释

#### CoreDNS 健康检查机制

CoreDNS Pod 包含内置的健康检查：

```yaml
# Deployment 中的健康检查配置
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  timeoutSeconds: 5

readinessProbe:
  httpGet:
    path: /ready  
    port: 8181
  timeoutSeconds: 2
```

#### 故障传播链条

```txt
233.5.5.5 DNS 服务器无响应
    ↓
CoreDNS forward 插件查询阻塞  
    ↓
健康检查端点超时
    ↓
Pod 标记为 NotReady
    ↓
从 Service Endpoints 中移除
    ↓
Service IP 无可用后端
    ↓
ping Service IP 失败
```

### 3.3 CoreDNS 最佳实践配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
            lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
            pods insecure
            fallthrough in-addr.arpa ip6.arpa
            ttl 30
        }
        prometheus :9153
        
        # 生产环境推荐配置
        forward . 223.5.5.5 223.6.6.6 114.114.114.114 8.8.8.8 {
            # 最大失败3次后标记服务器不可用
            max_fails 3
            # 服务器恢复检查间隔
            expire 10s
            # 健康检查间隔  
            health_check 5s
            # 负载均衡策略
            policy round_robin
            # 查询超时时间
            timeout 2s
        }
        
        cache 30
        loop
        reload
        loadbalance
    }
```

### 3.4 CoreDNS 关键参数详解

| 参数 | 作用 | 推荐值 | 说明 |
|------|------|--------|------|
| max_fails | 最大失败次数 | 3 | 超过后标记服务器不可用 |
| expire | 恢复检查间隔 | 10s | 不可用服务器的重试间隔 |
| health_check | 健康检查间隔 | 5s | 主动检查上游 DNS 健康状态 |
| timeout | 查询超时时间 | 2s | 单次 DNS 查询的超时限制 |
| policy | 负载均衡策略 | round_robin | 多个 DNS 服务器的分配算法 |

### 3.5 故障验证和测试

#### 实时监控脚本

```bash
#!/bin/bash
echo "=== CoreDNS 健康监控 ==="

while true; do
    # 检查 CoreDNS Pod 就绪状态
    READY_PODS=$(kubectl -n kube-system get pods -l k8s-app=kube-dns \
        -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | \
        tr ' ' '\n' | grep true | wc -l)
    
    TOTAL_PODS=$(kubectl -n kube-system get pods -l k8s-app=kube-dns \
        --no-headers | wc -l)
    
    echo "$(date): CoreDNS Ready: $READY_PODS/$TOTAL_PODS"
    
    # 检查 Service Endpoints
    ENDPOINTS=$(kubectl -n kube-system get endpoints kube-dns \
        -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
    
    echo "$(date): Service Endpoints: $ENDPOINTS"
    
    if [ "$READY_PODS" -eq 0 ] || [ "$ENDPOINTS" -eq 0 ]; then
        echo "WARNING: CoreDNS service degraded!"
        kubectl -n kube-system get pods -l k8s-app=kube-dns
        kubectl -n kube-system get endpoints kube-dns
    fi
    
    sleep 10
done
```

#### DNS 功能验证

```bash
# 测试内部 DNS
kubectl run dns-test --image=busybox --rm -it --restart=Never -- \
    nslookup kubernetes.default.svc.cluster.local

# 测试外部 DNS  
kubectl run dns-test --image=busybox --rm -it --restart=Never -- \
    nslookup google.com

# 直接测试 CoreDNS Service
kubectl run dns-test --image=busybox --rm -it --restart=Never -- \
    nslookup google.com 10.96.0.10
```

## 第四部分：综合排障方法论

### 4.1 分层排障法

Kubernetes 网络问题排查应该按层次进行：

```txt
应用层：DNS 解析、Service 发现
    ↓
服务层：Service、Endpoints、kube-proxy
    ↓  
网络层：Pod 网络、CNI 插件
    ↓
系统层：iptables、路由、网卡
```

### 4.2 通用排障工具箱

#### 网络诊断容器

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: network-debug
spec:
  containers:
  - name: debug
    image: nicolaka/netshoot
    command: ["sleep", "3600"]
  hostNetwork: true  # 可选：使用主机网络排查
```

#### 一键诊断脚本

```bash
#!/bin/bash
echo "=== Kubernetes 网络全面诊断 ==="

echo "1. 集群基本信息："
kubectl cluster-info
kubectl get nodes -o wide

echo "2. 网络组件状态："
kubectl get pods -n kube-system | grep -E "(flannel|coredns|kube-proxy)"

echo "3. Service 网络状态："
kubectl get svc -A | head -10
kubectl get endpoints -A | head -10

echo "4. 宿主机网络配置："
echo "IP Forward: $(cat /proc/sys/net/ipv4/ip_forward)"
echo "MASQUERADE 规则数量: $(sudo iptables -t nat -L POSTROUTING -n | grep MASQUERADE | wc -l)"

echo "5. DNS 配置检查："
kubectl -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | grep forward

echo "6. 端到端测试："
kubectl run connectivity-test --image=busybox --rm -it --restart=Never -- /bin/sh -c "
    echo 'Testing Pod to Node:' && ping -c 2 $(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') &&
    echo 'Testing Pod to Service:' && ping -c 2 kubernetes.default &&  
    echo 'Testing External DNS:' && nslookup google.com &&
    echo 'All tests completed'
"
```

### 4.3 预防性监控

#### Prometheus 监控指标

```yaml
# CoreDNS 关键指标
- coredns_dns_request_duration_seconds
- coredns_dns_response_rcode_total  
- coredns_forward_request_duration_seconds

# kube-proxy 指标  
- kubeproxy_sync_proxy_rules_duration_seconds
- kubeproxy_network_programming_duration_seconds
```

#### 告警规则示例

```yaml
groups:
- name: k8s-network
  rules:
  - alert: CoreDNSDown
    expr: up{job="kube-dns"} == 0
    for: 1m
    
  - alert: ServiceEndpointsEmpty
    expr: kube_service_status_load_balancer_ingress == 0
    for: 2m
    
  - alert: DNSLatencyHigh  
    expr: coredns_dns_request_duration_seconds{quantile="0.99"} > 1
    for: 5m
```

## 第五部分：生产环境最佳实践

### 5.1 网络配置最佳实践

#### CoreDNS 生产配置

```yaml
# 高可用 CoreDNS 配置
forward . 223.5.5.5 223.6.6.6 114.114.114.114 8.8.8.8 {
    max_fails 2
    expire 5s  
    health_check 3s
    timeout 1s
    policy round_robin
}

# 合理的缓存配置
cache 30 {
    success 9984 30
    denial 9984 10
}
```

#### kube-proxy 优化

```yaml
# 对于大规模集群，推荐 IPVS 模式
mode: "ipvs"
ipvs:
  scheduler: "rr"  # 轮询算法
  syncPeriod: "30s"
```

### 5.2 故障处理流程

1. **快速恢复**：重启相关组件
2. **根因分析**：收集日志和配置
3. **修复验证**：端到端测试
4. **预防改进**：更新监控和文档

### 5.3 容量规划建议

| 组件 | 建议配置 | 扩展策略 |
|------|----------|----------|
| CoreDNS | 2 副本起步 | 每 50 节点增加 1 副本 |
| kube-proxy | DaemonSet | 每节点一个实例 |
| Flannel | DaemonSet | 每节点一个实例 |

## 总结

Kubernetes 网络排障需要系统性思维和分层诊断方法。本文通过一个真实案例，展示了从基础网络连通性到 DNS 配置问题的完整排查过程。

**关键要点**：

1. **分层诊断**：从应用层到系统层逐步排查
2. **工具导向**：善用 kubectl、iptables、dig 等工具
3. **配置验证**：DNS 配置错误影响超出预期
4. **监控先行**：建立完善的网络监控体系
5. **文档化**：将排障过程标准化

**经验总结**：

- 80% 的外网访问问题源于 MASQUERADE 规则缺失
- 70% 的 Service 网络问题与 kube-proxy 相关  
- DNS 配置错误会导致意想不到的连锁反应
- 健康检查机制是理解故障传播的关键
