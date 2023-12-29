---
title: "Firewalld 防火墙的极简教程"
date: 2023-12-29T15:44:25+08:00
lastmod: 2023-12-29T15:44:25+08:00
draft: false
tags: ["linux", "firewalld", "极简教程"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 什么是 Firewalld

Firewalld 是一个在 Linux 系统上提供动态防火墙管理的工具。它是一个用户和管理员友好的前端，用于配置和管理 iptables 规则，并提供了一种简化的方式来管理网络连接和保护系统免受未经授权的访问。

Firewalld 的主要特点包括：

1. 基于区域的防火墙：Firewalld 将网络接口划分为不同的区域，例如公共区域、内部区域和信任区域。每个区域都有其自己的安全策略和规则集。
2. 动态更新规则：Firewalld 允许实时添加、删除和修改防火墙规则，而无需重启防火墙服务或中断网络连接。
3. 服务和应用程序级别的访问控制：Firewalld 允许根据服务或应用程序的名称来控制网络访问权限，而不仅仅是基于端口号。
4. 高级网络管理功能：Firewalld 支持网络地址转换（NAT）、端口转发、IPSec 和 IPv6 等高级网络功能。
5. 兼容性和扩展性：Firewalld 可以与其他网络管理工具和服务集成，如 NetworkManager 和 SELinux。

使用 Firewalld，管理员可以轻松地配置和管理系统的防火墙设置，保护系统免受恶意网络活动和未经授权的访问。它提供了一种灵活且强大的方式来管理网络连接，并根据实际需求进行定制配置。

需要注意的是，Firewalld 本身并不是防火墙，而是一个防火墙管理工具。

## 2. 工作原理

Firewalld 的工作原理可以简要概括如下：

1. 区域和服务定义：Firewalld 使用预定义的区域和服务来管理网络连接和访问控制。区域定义了特定接口的安全策略，而服务定义了允许的网络服务和端口。

2. 运行时状态：Firewalld 在运行时维护一个状态，以跟踪网络连接和防火墙规则的变化。它监视网络接口上的数据包流量，并根据规则进行决策。

3. 防火墙规则集：Firewalld 根据配置文件中定义的防火墙规则集来处理传入和传出的数据包。规则可以基于源 IP、目标 IP、源端口、目标端口等条件进行匹配，并决定是允许还是拒绝数据包。

4. 动态更新：Firewalld 允许在运行时动态地添加、删除和修改防火墙规则，而无需重启防火墙服务或中断网络连接。这使得管理员可以实时地对网络连接进行调整和控制。

5. 网络地址转换（NAT）和端口转发：Firewalld 支持配置网络地址转换（NAT）和端口转发规则，以便将数据包从一个网络接口转发到另一个接口或端口。

6. D-Bus 接口：Firewalld 提供了一个 D-Bus 接口，使其他应用程序和工具可以与其交互并管理防火墙设置。

7. Firewalld 是通过定义防火墙规则最终交由内核的 netfilter 进行包过滤实现防火墙功能。

## 3. 架构图

以下是官方给出的架构图，<https://firewalld.org/documentation/architecture.html>

![](https://firewalld.org/documentation/firewalld-structure+nftables.png)

Firewalld 是一个复杂的系统，包含了多个组件和模块来实现其功能。以下是关于每个组件的简要介绍：

1. 前端组件：
   - firewall-cmd：firewall-cmd 是 Firewalld 的命令行前端工具，用于管理和配置防火墙规则、区域、服务等。
   - firewall-config：firewall-config 是一个图形化的前端工具，提供了一个易于使用的界面来配置和管理防火墙设置。
   - firewall-applet：firewall-applet 是 Firewalld 的系统托盘应用程序，可以在系统托盘中显示防火墙状态，并提供快速访问配置选项的功能。
   - firewall-offline-cmd：firewall-offline-cmd 是一个离线命令行工具，用于在没有网络连接的情况下配置和管理防火墙规则。

2. 核心组件：
   - Zone（区域）：Zone 定义了特定接口的安全策略和防火墙规则集，例如内部区域、公共区域、信任区域等。
   - IPSet（IP集合）：IPSet 是一种高效的数据结构，用于存储和管理 IP 地址和网络地址的集合，可用于更精细地定义防火墙规则。
   - Service（服务）：Service 定义了特定应用程序或服务的网络连接规则和端口范围，例如 HTTP、SSH 等。
   - Icmptype（ICMP 类型）：Icmptype 定义了 ICMP（Internet 控制消息协议）的类型和代码，用于控制对 ICMP 数据包的处理。
   - Helper（协议助手）：Helper 提供了一种方式来跟踪和处理特定应用程序或协议相关的网络连接，例如 FTP、SIP 等。
   - Direct（直接规则）：Direct 允许管理员直接定义自定义防火墙规则，以满足特定需求。
   - Policy（策略）：Policy 用于配置和管理防火墙的默认策略，例如默认拒绝或默认允许。

3. 后端组件：
   - NetworkManager：NetworkManager 是一个后端插件，用于与 NetworkManager 网络管理器集成，以获取网络接口和连接的状态信息。
   - iptables、ip6tables：iptables 和 ip6tables 是 Linux 系统的防火墙工具，Firewalld 使用它们来实际操作防火墙规则。
   - nft：nft 是一个新一代的防火墙工具，用于进行高级网络过滤和转发操作。
   - modules：Modules 提供了扩展功能和插件，用于支持额外的防火墙功能和特性，如网络地址转换（NAT）、端口转发等。
   - ipset：ipset 是一个工具集，用于管理 IP 集合，并可以与防火墙规则集成。
   - ebtables：ebtables 是一个工具集，用于处理以太网帧层的防火墙规则和过滤器。
   - libnftables：libnftables 是一个库，提供了程序化配置和管理 nftables 的接口。

4. 内核组件：
   - Kernel（kmod）：Kernel 模块是 Linux 内核的一部分，用于支持网络过滤和转发功能，提供底层的防火墙支持。
   - Kernel（netfilter）：Netfilter 是 Linux 内核中的一个框架，用于实现网络数据包的过滤、转发和修改操作。

这些组件共同协作，使 Firewalld 能够提供动态防火墙管理和配置的功能，并为系统提供强大的网络安全保护。

## 4. 安装

在 CentOS7 默认使用 firewalld 作为防火墙

```sh
# 安装
yum -y install firewalld

# 开启防火墙
systemctl start firewalld

# 加入开机启动
systemctl enable firewalld

# 查看运行状态， running（运行中）not running（未运行）
firewall-cmd --state

```

## 5. Firewalld 区域管理

通过将网络划分成不同的区域，制定出不同区域之间的访问控制策略来控制不同程序区域间传送的数据流。

| 网络区名称	| 默认配置
| ---- | ----
| trusted（信任）	| 可接受所有的网络连接
| home（家庭）	| 用于家庭网络，仅接受ssh,mdns,gp-client,samba-client,dhcpv6-client连接
| internal（ 内部）	| 用于内部网络，仅接受ssh,mdns,gp-client,samba-client,dhcpv6-client连接
| work（工作）	| 用于工作区，仅接受sshjpp-client,dhcpv6-client服务连接
| public（工作）	| 用于工作区，仅接受ssh,ipp-client,dhcpv6-client服务连接，在公共区域内使用，仅接受ssh或dhcpv6-client服务连接，是firewalld的默认区域
| external（ 外部）| 	出去的ipv4网络连接通过此区域为伪装或转发，仅接受ssh服务的连接
| dmz（非军事区）| 	仅接受ssh服务的连接
| block（限制）	| 拒绝所有网络的连接
| drop （丢弃）	| 任何接收的网络数据包都被丢弃，没有任何回复

使用以下命令可以查看到所有的区域：

```sh
# 查看可用的区域
firewall-cmd --list-all-zones
firewall-cmd --get-zones

# 设置默认的区域
firewall-cmd --set-default-zone=<zone>

# 分配区域给接口
firewall-cmd --zone=<zone> --change-interface=<interface>

# 添加/删除服务
firewall-cmd --zone=<zone> --add-service=<service>
firewall-cmd --zone=<zone> --remove-service=<service>

# 添加/删除端口
firewall-cmd --zone=<zone> --add-port=<port>/tcp
firewall-cmd --zone=<zone> --remove-port=<port>/tcp
```

## 6. 基本命令

```sh
# 查看所有的区域
firewall-cmd --list-all-zones

# 要修改默认区域：
firewall-cmd --set-default-zone=public

# 查看默认区域
firewall-cmd --list-all 

# 查看指定的 zone 规则
firewall-cmd --zone=trusted --list-all

# 对某区域进行添加/删除/更改网卡
firewall-cmd --zone=public --add-interface=eth0
firewall-cmd --zone=public --remove-interface=eth0
firewall-cmd --zone=public --change-interface=eth0

# 查看状态
sudo firewall-cmd --state

# 查看 direct 直接规则
firewall-cmd --direct --get-all-rules
```

## 7. 实战

Firewalld有规则两种状态

1. 运行时（runtime)：修改规则马上生效,但是临时生效
2. 持久配置（permanent）：修改后需要重载才会生效

```sh
firewall-cmd --permanent [RULE]
firewall-cmd --reload
```

一旦使用了 `--permanent` 会将配置写入到/etc/firewalld/{services,zones}/*.xml对应的文件中，配置完成后一定要 reload，否则只能待防火墙重启后这些配置才能生效。

Firewalld配置文件:

1. /etc/firewalld/{services,zones}/*.xml    优先级最高，`--permanent` 模式生效的策略会放到这里
2. /lib/firewalld/{services,zones}/*.xml   优先级要低些，是一些默认配置，可以当做模板使用

### 7.1. 新增区域

```sh
firewall-cmd --permanent --new-zone=www
```

### 7.2. 设置默认区域

```sh
sudo firewall-cmd --set-default-zone=www
```

### 7.3. 添加网络接口

```sh
firewall-cmd --permanent --zone=www --add-interface=eth0 
```

### 7.4. 添加服务

```sh
firewall-cmd --permanent --zone=www --add-service=http
```

### 7.5. 添加端口

```sh
firewall-cmd --permanent --zone=www --add-port=22/tcp 
```

### 7.6. 转发端口

```sh
firewall-cmd --permanent --zone=www --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.100 
```

### 7.7. 开启网络地址伪装转换

```sh
firewall-cmd --zone=www --add-masquerade
```

### 7.8. 使用 direct

> Direct 规则允许在防火墙中直接添加自定义 Iptables 规则

```sh
firewall-cmd --direct  --permanent --add-rule ipv4 filter INPUT 0 -s 192.168.1.101/32 -m multiport -p tcp --dport 22 -m comment --comment ssh -j ACCEPT 
```

## 8. Rich 规则使用

> 使用 rich 规则可以更精确地配置 firewalld 防火墙，以满足特定的需求和安全要求。

1. rule：rich 规则的基本单位是 rule。它定义了特定的过滤或转发操作。
2. family：family 参数用于指定规则的协议族，可以是 "ipv4" 或 "ipv6"。
3. source and destination：使用 source 和 destination 参数可以限制规则适用的来源和目标地址。
4. service：使用 service 参数可以匹配预定义的服务名，例如 "http"、"ssh" 等。该参数会根据预定义的服务规则自动匹配端口和协议。
5. port：使用 port 参数可以指定端口号。可以指定单个端口或端口范围，例如 "80" 或 "8080-8090"。
6. protocol：使用 protocol 参数可以指定协议类型，例如 "tcp"、"udp" 或 "icmp"。
7. accept and reject：accept 操作表示接受通过规则的流量，而 reject 操作表示拒绝通过规则的流量。
8. forward-port：forward-port 是一种特殊的 rich 规则，用于设置端口转发。可以指定源端口、目标端口和目标地址。
9. to-port and to-addr：forward-port 规则中的 to-port 参数用于指定转发到的目标端口，而 to-addr 参数用于指定转发到的目标地址。

如将上面添加的命令转换成 rich 写法，如下代码：

```sh
firewall-cmd --permanent --zone=www --add-rich-rule='rule family="ipv4" source address="any" service name="http" accept'
firewall-cmd --permanent --zone=www --add-rich-rule='rule family="ipv4" port port="22" protocol="tcp" accept'
firewall-cmd --permanent --zone=www --add-rich-rule='rule family="ipv4" forward-port port="80" protocol="tcp" to-port="8080" to-addr="192.168.1.100"'
```

## 9. Ipset 使用

>  IPset 是一种高效的数据结构，用于管理大量 IP 地址的集合

### 9.1. 创建 ipset

> 使用 `--new-ipset` 参数可以创建一个新的 IPset。例如，创建名为`k8s`的 IPset：
   
```sh
firewall-cmd --permanent --new-ipset=k8s --type=hash:ip
```

这将创建一个类型为 `hash:ip` 的新 IPset,它适用于大规模的 IP 地址范围，具有快速的查找和插入性能。

```sh
# 查询支持 IPset 类型
firewall-cmd --get-ipset-types
hash:ip hash:ip,mark hash:ip,port hash:ip,port,ip hash:ip,port,net hash:mac hash:net hash:net,iface hash:net,net hash:net,port hash:net,port,net
```

### 9.2. 添加 IP 到 IPset

> 使用 `--add-entry` 参数可以将 IP 添加到 IPset 中。例如，将 IP `192.168.1.100` 添加到 `k8s`：
   
```sh
firewall-cmd --permanent --ipset=k8s --add-entry=192.168.1.100
firewall-cmd --permanent --ipset=k8s --add-entry=192.168.1.101
firewall-cmd --permanent --ipset=k8s --add-entry=192.168.1.102
firewall-cmd --permanent --ipset=k8s --add-entry=192.168.1.103
```

这将把 IP `192.168.1.100~192.168.1.103` 添加到名为 `k8s` 的 IPset 中。

### 9.3. 删除 IPset 删除 IP

> 使用 `--remove-entry` 参数可以从 IPset 中删除指定的 IP。例如，从 `k8s` 中删除 IP `192.168.1.100`：
   
```sh
sudo firewall-cmd --permanent --ipset=k8s --remove-entry=192.168.1.100
```

这将从名为 `k8s` 的 IPset 中删除 IP `192.168.1.100`。

### 9.4. 查询 IPset

```sh
# 查询 ipset 名称
firewall-cmd --get-ipsets
k8s

# 查询添加的IP列表
firewall-cmd --ipset=k8s --get-entries
```

### 9.5. 使用 IPset

>  创建一个规则，允许来自 `k8s` 中的 IP 访问某个服务：
   
```sh
# 允许 IPset 里的 IP 通行
firewall-cmd --permanent --add-rich-rule 'rule family="ipv4" source ipset="k8s" accept'

# 禁止 IPset 里的 IP 访问 22 端口
firewall-cmd --permanent --add-rich-rule 'rule family="ipv4" source ipset="k8s" port port=22 protocol=tcp reject'

# 允许 IPset 里的 IP 访问 22 端口
firewall-cmd --permanent --add-rich-rule 'rule family="ipv4" source ipset="k8s" port port=22 protocol=tcp accept'
```

这将允许来自 `k8s` 中的 IP 访问目标端口为 80 的 TCP 服务。

### 9.6. 删除 IPset

> 使用 `--delete-ipset` 参数可以删除指定的 IPset。例如，删除 `k8s`：
   
```bash
sudo firewall-cmd --permanent --delete-ipset=k8s
```

这将删除名为 `k8s` 的 IPset。

注意：使用 `--permanent` 参数将修改永久保存并在启动时加载防火墙规则。如果你想立即生效而不重启防火墙服务，可以执行以下命令：

```bash
sudo firewall-cmd --reload
```

## 10. 排障思路

1. 查询防火墙的状态
2. 查看各区域的的规则设置
3. 查看 Direct 规则
4. 使用 `--permanent` 时，一定记得使用 `firewall-cmd --reload` 规则才会生效
5. 找台其它机器测试添加的规则是否生效
