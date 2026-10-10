---
title: "VMware 虚拟机 ping 不通外网？一次 NAT 网关 IP 冲突的完整排查记录"
date: 2026-10-10T11:24:17+08:00
lastmod: 2026-10-10T11:24:17+08:00
draft: false
tags: [""]
categories: [""]
author: "百里"
comment: false
toc: true
reward: true
---

> 环境：CentOS 虚拟机（VMware，网卡 `ens33`），静态 IP `192.168.9.20/24`，网关 `192.168.9.1`。
> 现象：`ping aliyun.com` 卡住没有任何输出。

文末"修复"部分是根据排查证据得出的结论，我没看到你执行后的结果，发布前建议先在自己机器上验证一遍。

## 一、第一反应：是不是 DNS 的问题？

先看 `/etc/resolv.conf`：

```
nameserver 114.114.114.114
nameserver 8.8.8.8
```

DNS 配置没毛病。`ping aliyun.com` 卡住，没有显示 `PING aliyun.com (x.x.x.x)` 这一行，说明域名解析都没成功。但这时还不能下结论，因为"DNS 不通"和"网络不通"表现一模一样。

**关键技巧：绕开域名，直接 ping IP。**

```bash
ping -c 3 114.114.114.114
```

结果 3 个包全丢，100% packet loss。**问题不在 DNS，是整台机器没有通到外网。**

## 二、检查本机网络

```bash
ip addr
nmcli device status
```

结果：

- `ens33` 状态 `UP`，IP 是 `192.168.9.20/24`
- NetworkManager 里显示 `connected`

本机网卡没问题。接着 ping 网关 `192.168.9.1`，一开始不通，问题缩小到**本机到网关这一段**。

## 三、用 ARP 看二层：发现 IP 冲突

```bash
ip neigh show
arping -I ens33 -c 3 192.168.9.1
```

输出里有个关键现象：**同一个 IP 192.168.9.1，出现了两个不同的 MAC 地址在应答**：

```
Unicast reply from 192.168.9.1 [00:50:56:E5:1C:32]
Unicast reply from 192.168.9.1 [00:50:56:C0:00:08]
```

`00:50:56` 是 VMware 的 OUI 前缀。其中 `C0:00:08` 是宿主机上 VMnet8 虚拟网卡的 MAC，另一个 `E5:1C:32` 很可能是 NAT 网关。两个设备抢同一个 IP，就是 IP 冲突。

## 四、再看路由和网关

```bash
ip route
```

```
default via 192.168.9.1 dev ens33 proto static metric 100
192.168.9.0/24 dev ens33 proto kernel scope link src 192.168.9.20 metric 100
```

默认网关指向 `192.168.9.1`。这时再 ping：

- `ping 192.168.9.1`：通，但 **`ttl=128`**
- `ping 192.168.9.2`：不通

`ttl=128` 是 Windows 系统的典型值，说明应答的是 **Windows 宿主机的 VMnet8 虚拟网卡**，不是 NAT 网关。这块虚拟网卡只负责宿主机和虚拟机通信，不转发流量，所以默认网关指向它，虚拟机永远出不了外网。

## 五、根因分析

VMware NAT 模式的默认约定是：

| 角色 | 默认地址 |
|---|---|
| 宿主机 VMnet8 虚拟网卡 | `x.x.x.1` |
| NAT 网关 | `x.x.x.2` |
| DHCP 范围 | `x.x.x.128 ~ 254` |

而这台虚拟机的网关写的是 `.1`，ARP 里又出现了两个 MAC 应答 `.1`。比较可能的情况是：

1. NAT 网关被改成了 `.1`，和宿主机 VMnet8 网卡冲突；或者
2. 网关本来是 `.2`，但虚拟机里手动配成了 `.1`，请求全发给了宿主机网卡。

另外 `.2` ping 不通也不一定代表它不存在，也可能是 VMware NAT Service 没在运行。

## 六、修复步骤

**1. 查 NAT 网关的真实地址**

VMware 里：编辑 → 虚拟网络编辑器 → 更改设置 → 选中 VMnet8 → NAT 设置，记下**网关 IP**。

**2. 查宿主机 VMnet8 网卡地址**

在 Windows 的 cmd 里执行 `ipconfig`，看 "VMware Network Adapter VMnet8" 的 IPv4。

**3. 消除冲突**

- 若 NAT 网关被设成了 `.1`：改成 `.2`，保证宿主机网卡和 NAT 网关不同地址
- 若 NAT 网关本来就是 `.2`：把虚拟机的网关改成 `.2`

```bash
nmcli connection modify ens33 ipv4.gateway 192.168.9.2
nmcli connection up ens33
ip neigh flush all
```

**4. 确认 Windows 服务在运行**

`services.msc` 里确认 **VMware NAT Service** 和 **VMware DHCP Service** 处于"正在运行"，必要时重启。

**5. 实在搞不清就重置**

虚拟网络编辑器里点"还原默认设置"，VMnet8 会恢复成默认布局（宿主机 `.1`，NAT 网关 `.2`）。网段可能变化，虚拟机改回 DHCP 重新获取：

```bash
nmcli connection modify ens33 ipv4.method auto
nmcli connection up ens33
ip route
```

**6. 备选方案：桥接模式**

不想折腾 NAT，可以把虚拟机网络适配器改成**桥接模式**，直接使用路由器的网段和网关。

**7. 验证**

```bash
ping -c 3 <网关IP>
ping -c 3 114.114.114.114
ping aliyun.com
```

三个都通，说明问题解决。

## 七、排查思路总结

这次排查最有价值的是**由外到内、逐层缩小范围**：

| 步骤 | 命令 | 排除/定位了什么 |
|---|---|---|
| 1 | `ping 域名` | 卡住，只知道有问题 |
| 2 | `ping 公网IP` | 排除 DNS，确定是网络不通 |
| 3 | `ip addr` / `nmcli` | 排除本机网卡故障 |
| 4 | `ping 网关` | 定位到本机到网关这一段 |
| 5 | `arping` / `ip neigh` | 发现同一 IP 有两个 MAC，IP 冲突 |
| 6 | `ip route` + TTL | TTL=128 暴露应答者是 Windows 宿主机 |

几个小经验：

- **先 ping IP，再 ping 域名**，一步就能分清 DNS 问题还是网络问题
- **看 TTL 能猜对端系统**：64 多为 Linux，128 多为 Windows，255 多为网络设备
- **`arping` 能暴露 IP 冲突**，同一个 IP 出现多个 MAC，基本就是冲突
- 虚拟机用 NAT 模式时，**网关是 `.2` 不是 `.1`**，这是 VMware 的默认约定
- 网卡名 `ens33` 是 VMware 虚拟机的典型特征，能帮你快速判断环境
