---
title: "Kubernetes 调试技巧"
date: 2024-11-28T15:56:23+08:00
lastmod: 2024-11-28T15:56:23+08:00
draft: false
tags: ["k8s", "kubernetes", "linux"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 介绍

在 Kubernetes 环境中进行 故障分析与调试 是一项重要的技能，因为 Kubernetes 涉及众多的组件和服务，且其工作负载通常是分布式的。在面对问题时，分析和调试的技巧将帮助你更快速地定位问题并找到解决方案

## 2. 涉及工具

- kubectl
- crictl
- kubeadm
- journalctl
- netstat
- ss
- lsof
- tcpdump
- ip
- iptables
- firewall-cmd
- traceroute
- nmap

## 3. 网络问题

首先，我们需要了解 k8s 整个网络架构，数据包是如何流转的，才能快速定位问题。

架构图如下(以flannel为例)：

![20241128170114](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20241128170114.png)

具体如何排查，网络问题千万种，这里只提供一种思路，仅供参考。

- 第一步：基本参数，如 `overlay`,`br_netfilter`,`net.ipv4.ip_forward` 等是否配置正确
- 第二步：防火墙，如 `iptables`, `firewalld`
- 第三步：路由表，如 `ip route`
- 第四步：网络插件，如 `flannel`, `calico`
- 第五步：服务发现，如 `coredns`
- 第六步：网络策略，如 `networkpolicy`
- 第七步：网络日志，如 `kubectl describe pod`, `kubectl logs pod`, `flannel`, `calico`,`journalctl -fu kubelet`
- 第八步：抓包诊断，如 `tcpdump`, `ss`, `netstat`

```sh
# 基本参数
## 1 为开启，0 为关闭
## 查看方法一
lsmod | grep -E 'overlay|br_netfilter'
cat /proc/sys/net/ipv4/ip_forward
cat /proc/sys/net/bridge/bridge-nf-call-iptables
cat /proc/sys/net/bridge/bridge-nf-call-ip6tables

## 查看方法二
modprobe overlay
modprobe br_netfilter
sysctl net.ipv4.ip_forward
sysctl net.bridge.bridge-nf-call-iptables
sysctl net.bridge.bridge-nf-call-ip6tables

## 修改方法一（临时生效）
modprobe overlay
modprobe br_netfilter
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.bridge.bridge-nf-call-iptables=1
sysctl -w net.bridge.bridge-nf-call-ip6tables=1

## 修改方法二（永久设置）
cat <<EOF > /etc/modules-load.d/k8s-modules.conf
overlay
br_netfilter
EOF
echo 'net.ipv4.ip_forward = 1' > /proc/sys/net/ipv4/ip_forward
echo 'net.bridge.bridge-nf-call-iptables = 1' > /proc/sys/net/bridge/bridge-nf-call-iptables
echo 'net.bridge.bridge-nf-call-ip6tables = 1' > /proc/sys/net/bridge/bridge-nf-call-ip6tables
sysctl -p # 重新加载配置

# 防火墙
## 主要查看有没有 REJUCT 的规则
## 查看
iptables -L -n -v
iptables -nL INPUT
iptables -nL FORWARD
iptables -nL OUTPUT --line-number
firewall-cmd --list-all
firewall-cmd --list-all-zones
iptables -P FORWARD ACCEPT

## 修改
### 插入
iptables -I INPUT -i eth0 -p tcp --dport 6443 -j ACCEPT
### 追加
iptables -A INPUT -i eth0 -p tcp --dport 6443 -j ACCEPT

## 删除
iptables -nL OUTPUT --line-number
iptables -D OUTPUT 1
firewall-cmd --remove-port=6443/tcp --permanent
firewall-cmd --reload

# 路由表
## 观察是否有网关、路由是否正确、网卡是否启动等
ip route
ip route show 
ip link
ip -d link
ip addr

## arp
arp -a
arp -n

# 网络插件
## 主要看看是否启动，运行正常
kubectl get pods -n kube-system -l app=flannel
kubectl get pods -n kube-flannel -l app=flannel
kubectl get pods -n kube-system -l k8s-app=calico-node

# 服务发现
kubectl get pods -n kube-system -l k8s-app=kube-dns

# 网络策略
kubectl get networkpolicy

# 网络日志
kubectl describe pod
kubectl logs pod
journalctl -fu kubelet

# 抓包诊断
tcpdump -i eth0 -nneevvv -s0 -v port 80
tcpdump -i flannel.1 -nneevvvv icmp
tcpdump -i flannel.1 -nneevvvv host 10.244.1.2
tcpdump -i flannel.1 -nneevvvv port 80
tcpdump -i flannel.1 -nneevvvv port 80 and host 10.244.1.2
tcpdump -i flannel.1 -nneevvvv port 80 and src 10.244.1.2

## 查看 tcp 连接
ss -nplt
netstat -nplt
ss -l | grep LISTEN
```

## 4. 抓包

```sh
# 安装软件
yum install -y tcpdump

# 命令

## 捕获特定子网流量
tcpdump -i eth0 net 192.168.1.0/24

## 捕获 HTTP 和 HTTPS 流量
tcpdump -i eth0 port 80 or port 443

## 仅捕获传输层协议为 TCP
tcpdump -i eth0 tcp

## 指定源或目标 IP
tcpdump -i eth0 host 192.168.1.10

## 常用过滤条件（-s0 整个包）
tcpdump -i eth0 -nneevvv -s0 -v port 80

## 捕获 ICMP 流量
tcpdump -i flannel.1 -nneevvvv icmp

## 捕获特定 IP 流量
tcpdump -i flannel.1 -nneevvvv host 10.244.1.2

## 捕获特定端口流量
tcpdump -i flannel.1 -nneevvvv port 80 and host 10.244.1.2
tcpdump -i flannel.1 -nneevvvv port 80 and src 10.244.1.2
```

### 4.1. 容器内抓包

- 获取容器 PID
- 使用 nsenter 进入容器网络命名空间

```sh
docker inspect xxx |grep -i pid
crictl inspect xxx |grep -i pid

# 进入容器网络命名空间
nsenter -t 12345 -n ip link
nsenter -t 12345 -n ip a
nsenter -t 12345 -n ip route
nsenter -t 12345 -n tcpdump -i eth0 -nneevvvv icmp
nsenter -t 12345 -n tcpdump -i eth0 -nneevvvv -s0 -v port 80
```

## 探测

```sh
# 路由跟踪
traceroute -n 192.168.9.74  # 若跨网段使用

# 端口扫描
nmap -Pn 192.168.9.74  # 跳过 ping 扫描，直接探测端口
```

## 5. 参考

- [K8s network](https://marcuseddie.github.io/categories/Cloud-Computing/)
- [pod背后原理](https://mp.weixin.qq.com/s/ctdvbasKE-vpLRxDJjwVMw)
