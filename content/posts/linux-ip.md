---
title: "Linux ip 命令完全指南"
date: 2025-11-25T11:02:27+08:00
lastmod: 2025-11-25T11:02:27+08:00
draft: false
tags: ["linux", "ip", "工具"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 目录

1. [简介](#简介)
2. [基础语法](#基础语法)
3. [命令分类详解](#命令分类详解)
4. [日常运维操作](#日常运维操作)
5. [故障排查实战](#故障排查实战)
6. [最佳实践](#最佳实践)

---

## 简介

`ip` 命令是 Linux 系统中用于网络配置和管理的现代化工具,属于 `iproute2` 工具包。它是传统 `ifconfig`、`route`、`arp` 等命令的替代品,功能更强大、更灵活。

### 为什么使用 ip 命令?

- **功能全面**: 统一管理网络接口、路由、隧道、策略路由等
- **输出清晰**: 结构化的输出格式,便于脚本解析
- **持续维护**: 活跃开发,支持最新的内核特性
- **性能更好**: 直接与内核 netlink 接口通信

---

## 基础语法

```bash
ip [ OPTIONS ] OBJECT { COMMAND | help }
```

### 常用选项 (OPTIONS)

- `-4` 或 `-6`: 指定 IPv4 或 IPv6
- `-s`: 显示统计信息 (statistics)
- `-d`: 显示详细信息 (details)
- `-c`: 彩色输出
- `-br`: 简洁输出 (brief)
- `-j`: JSON 格式输出
- `-p`: 美化输出 (pretty print)

### 对象类型 (OBJECT)

| 对象 | 简写 | 说明 |
|------|------|------|
| link | l | 网络设备 (网卡) |
| address | addr/a | IP 地址 |
| route | r | 路由表 |
| neighbor | neigh/n | ARP 或 NDISC 缓存 |
| rule | ru | 路由策略 |
| tunnel | t | IP 隧道 |
| maddress | maddr | 组播地址 |
| netns | netns | 网络命名空间 |

---

## 命令分类详解

### 1. 网络接口管理 (ip link)

#### 查看网络接口

```bash
# 查看所有网络接口
ip link show

# 查看指定接口
ip link show dev eth0

# 简洁输出
ip -br link show

# 带统计信息
ip -s link show eth0
```

#### 启用/禁用网络接口

```bash
# 启用接口
ip link set eth0 up

# 禁用接口
ip link set eth0 down

# 设置 MTU
ip link set eth0 mtu 1400

# 设置 MAC 地址
ip link set eth0 address 00:11:22:33:44:55

# 修改接口名称
ip link set eth0 name wan0
```

#### 创建虚拟接口

```bash
# 创建 VLAN 接口
ip link add link eth0 name eth0.100 type vlan id 100

# 创建网桥
ip link add name br0 type bridge

# 创建 veth pair (容器网络常用)
ip link add veth0 type veth peer name veth1

# 创建 bond 接口
ip link add bond0 type bond mode 802.3ad
```

---

### 2. IP 地址管理 (ip address)

#### 查看 IP 地址

```bash
# 查看所有地址
ip addr show

# 查看指定接口地址
ip addr show dev eth0

# 只显示 IPv4
ip -4 addr show

# 只显示 IPv6
ip -6 addr show

# 简洁格式
ip -br addr show
```

#### 添加/删除 IP 地址

```bash
# 添加 IPv4 地址
ip addr add 192.168.1.100/24 dev eth0

# 添加带广播地址的 IP
ip addr add 192.168.1.100/24 brd + dev eth0

# 添加 IPv6 地址
ip addr add 2001:db8::1/64 dev eth0

# 添加次要地址
ip addr add 192.168.1.101/24 dev eth0 label eth0:1

# 删除 IP 地址
ip addr del 192.168.1.100/24 dev eth0

# 清空接口所有地址
ip addr flush dev eth0
```

---

### 3. 路由管理 (ip route)

#### 查看路由表

```bash
# 查看主路由表
ip route show

# 查看指定路由表
ip route show table local

# 查看所有路由表
ip route show table all

# 查看到特定目标的路由
ip route get 8.8.8.8

# 显示缓存路由
ip route show cache
```

#### 添加/删除路由

```bash
# 添加默认路由
ip route add default via 192.168.1.1 dev eth0

# 添加静态路由
ip route add 10.0.0.0/8 via 192.168.1.254

# 添加带 metric 的路由
ip route add 172.16.0.0/16 via 192.168.1.254 metric 100

# 添加到指定表
ip route add 192.168.2.0/24 via 192.168.1.254 table 10

# 删除路由
ip route del 10.0.0.0/8

# 删除默认路由
ip route del default

# 替换路由
ip route replace default via 192.168.1.2
```

#### 高级路由

```bash
# 多路径负载均衡
ip route add default \
  nexthop via 192.168.1.1 weight 1 \
  nexthop via 192.168.1.2 weight 2

# 策略路由 - 基于源地址
ip rule add from 192.168.2.0/24 table 100
ip route add default via 10.0.0.1 table 100

# 策略路由 - 基于标记
ip rule add fwmark 1 table 200
```

---

### 4. 邻居表管理 (ip neighbor)

ARP (IPv4) 和 NDP (IPv6) 缓存管理。

```bash
# 查看 ARP 缓存
ip neigh show

# 查看指定接口
ip neigh show dev eth0

# 添加静态 ARP 条目
ip neigh add 192.168.1.1 lladdr 00:11:22:33:44:55 dev eth0

# 删除 ARP 条目
ip neigh del 192.168.1.1 dev eth0

# 清空 ARP 缓存
ip neigh flush dev eth0
```

---

### 5. 网络命名空间 (ip netns)

```bash
# 创建命名空间
ip netns add ns1

# 列出所有命名空间
ip netns list

# 在命名空间中执行命令
ip netns exec ns1 ip addr show

# 删除命名空间
ip netns del ns1

# 将接口移到命名空间
ip link set veth1 netns ns1
```

---

## 日常运维操作

### 配置静态 IP

```bash
#!/bin/bash
# 完整的静态 IP 配置

INTERFACE="eth0"
IP_ADDR="192.168.1.100/24"
GATEWAY="192.168.1.1"
DNS1="8.8.8.8"
DNS2="8.8.4.4"

# 1. 配置 IP 地址
ip addr flush dev $INTERFACE
ip addr add $IP_ADDR dev $INTERFACE

# 2. 启用接口
ip link set $INTERFACE up

# 3. 配置网关
ip route add default via $GATEWAY dev $INTERFACE

# 4. 配置 DNS (写入 /etc/resolv.conf)
cat > /etc/resolv.conf <<EOF
nameserver $DNS1
nameserver $DNS2
EOF
```

### 配置网桥

```bash
# 创建网桥并添加接口
ip link add br0 type bridge
ip link set br0 up

# 添加物理接口到网桥
ip link set eth0 master br0
ip link set eth1 master br0

# 配置网桥 IP
ip addr add 192.168.1.1/24 dev br0

# 查看网桥信息
ip link show master br0
```

### 配置 VLAN

```bash
# 加载 8021q 模块
modprobe 8021q

# 创建 VLAN 100
ip link add link eth0 name eth0.100 type vlan id 100
ip addr add 192.168.100.1/24 dev eth0.100
ip link set eth0.100 up

# 删除 VLAN
ip link del eth0.100
```

### 配置绑定 (Bonding)

```bash
# 创建 bond 接口 (主备模式)
ip link add bond0 type bond mode active-backup

# 添加从接口
ip link set eth0 master bond0
ip link set eth1 master bond0

# 配置 IP 并启用
ip addr add 192.168.1.100/24 dev bond0
ip link set bond0 up

# 查看 bond 状态
cat /proc/net/bonding/bond0
```

### 监控网络流量

```bash
# 实时监控接口流量
watch -n 1 "ip -s link show eth0"

# 查看接口统计信息
ip -s -s link show eth0

# 输出格式化统计
ip -s -j link show | jq
```

---

## 故障排查实战

### 1. 网络不通诊断流程

```bash
# 步骤 1: 检查网卡状态
ip link show
# 确保状态为 UP,LOWER_UP

# 步骤 2: 检查 IP 地址配置
ip addr show
# 确认 IP、掩码、广播地址正确

# 步骤 3: 检查路由
ip route show
# 确认默认网关存在

# 步骤 4: 检查网关可达性
ping -c 4 $(ip route | grep default | awk '{print $3}')

# 步骤 5: 检查 ARP 解析
ip neigh show
# 查看网关 MAC 是否解析成功

# 步骤 6: 检查 DNS
cat /etc/resolv.conf
ping -c 4 8.8.8.8
```

### 2. 网卡未启动

```bash
# 诊断
ip link show eth0
# 如果显示 DOWN

# 解决
ip link set eth0 up

# 检查驱动
ethtool eth0
dmesg | grep eth0
```

### 3. IP 冲突检测

```bash
# 发送 ARP 请求检测冲突
arping -I eth0 -c 3 192.168.1.100

# 查看 ARP 表中是否有重复
ip neigh show | sort

# 临时更换 IP 测试
ip addr add 192.168.1.200/24 dev eth0
```

### 4. 路由问题排查

```bash
# 查看到目标的完整路由路径
ip route get 8.8.8.8

# 追踪路由
traceroute 8.8.8.8

# 检查路由表优先级
ip rule show

# 查看所有路由表
ip route show table all

# 临时添加测试路由
ip route add 8.8.8.0/24 via 192.168.1.254
```

### 5. MTU 问题诊断

```bash
# 查看当前 MTU
ip link show eth0 | grep mtu

# 测试 MTU (不分片)
ping -M do -s 1472 8.8.8.8

# 调整 MTU
ip link set eth0 mtu 1400

# 路由中指定 MTU
ip route add 10.0.0.0/8 via 192.168.1.1 mtu 1400
```

### 6. 双网卡路由问题

```bash
# 场景: eth0 (内网), eth1 (外网)

# 查看当前路由
ip route show

# 添加策略路由
# 内网流量走 eth0
ip rule add from 192.168.1.0/24 table 1
ip route add default via 192.168.1.1 table 1

# 外网流量走 eth1
ip rule add from 10.0.0.0/24 table 2
ip route add default via 10.0.0.1 table 2

# 验证
ip route get 192.168.1.100 from 192.168.1.50
ip route get 8.8.8.8 from 10.0.0.50
```

### 7. 网络丢包分析

```bash
# 查看接口错误统计
ip -s link show eth0

# 关键指标:
# RX errors - 接收错误
# TX errors - 发送错误
# dropped - 丢弃的包
# overruns - 缓冲区溢出

# 详细统计
ip -s -s link show eth0

# 使用 ethtool 查看更多信息
ethtool -S eth0
```

---

## 最佳实践

### 1. 脚本中使用 ip 命令

```bash
#!/bin/bash
# 始终检查命令执行结果

if ip addr add 192.168.1.100/24 dev eth0; then
    echo "IP 地址配置成功"
else
    echo "IP 地址配置失败" >&2
    exit 1
fi

# 使用 JSON 输出便于解析
IP_INFO=$(ip -j addr show dev eth0)
echo $IP_INFO | jq -r '.[0].addr_info[0].local'
```

### 2. 持久化配置

ip 命令的配置是临时的,重启后失效。持久化配置方法:

**CentOS/RHEL 系统:**
编辑 `/etc/sysconfig/network-scripts/ifcfg-eth0`

**Ubuntu/Debian 系统:**
编辑 `/etc/netplan/*.yaml` (netplan) 或 `/etc/network/interfaces`

**通用方法:**
将命令写入 `/etc/rc.local` 或创建 systemd 服务

### 3. 安全建议

```bash
# 禁用不需要的接口
ip link set eth1 down

# 限制 ARP 刷新
echo 1 > /proc/sys/net/ipv4/conf/all/arp_ignore
echo 2 > /proc/sys/net/ipv4/conf/all/arp_announce

# 启用反向路径过滤
echo 1 > /proc/sys/net/ipv4/conf/all/rp_filter
```

### 4. 性能优化

```bash
# 调整网卡队列长度
ip link set eth0 txqueuelen 10000

# 启用网卡多队列
ethtool -L eth0 combined 4

# 调整 ring buffer
ethtool -G eth0 rx 4096 tx 4096
```

### 5. 常用别名

添加到 `~/.bashrc`:

```bash
alias ipb='ip -br -c'
alias ipa='ip -br -c addr'
alias ipl='ip -br -c link'
alias ipr='ip -c route'
```

---

## 快速参考

### 常用命令速查

```bash
# 查看
ip a                    # 查看所有地址
ip -4 a                 # 只看 IPv4
ip r                    # 查看路由
ip n                    # 查看 ARP

# 配置
ip a add IP/MASK dev IF      # 添加 IP
ip r add default via GW      # 添加默认网关
ip l set IF up               # 启用接口

# 删除
ip a del IP/MASK dev IF      # 删除 IP
ip r del NET                 # 删除路由
ip l set IF down             # 禁用接口
```

### 与传统命令对比

| 传统命令 | ip 命令 | 说明 |
|---------|---------|------|
| ifconfig | ip addr | 查看 IP 地址 |
| ifconfig eth0 up | ip link set eth0 up | 启用接口 |
| route -n | ip route | 查看路由表 |
| arp -n | ip neigh | 查看 ARP 表 |
| ifconfig eth0 192.168.1.1 | ip addr add 192.168.1.1/24 dev eth0 | 配置 IP |

---

## 总结

`ip` 命令是现代 Linux 网络管理的核心工具,掌握它对于系统管理员至关重要。关键要点:

1. **统一性**: 一个命令管理所有网络配置
2. **灵活性**: 支持复杂的网络场景和策略
3. **可脚本化**: 输出格式友好,便于自动化
4. **持续更新**: 紧跟内核特性发展

建议在日常工作中逐步替换传统的 `ifconfig` 和 `route` 命令,充分利用 `ip` 命令的强大功能。

---

**相关资源:**
- man ip
- man ip-address
- man ip-route
- man ip-link
- [iproute2 官方文档](https://wiki.linuxfoundation.org/networking/iproute2)
