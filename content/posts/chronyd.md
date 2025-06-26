---
title: "Linux Chronyd 极简教程"
date: 2023-12-28T23:28:45+08:00
lastmod: 2025-06-26T23:28:45+08:00
draft: false
tags: ["linux", "chronyd", "极简教程"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

<!-- TOC -->

- [1. 什么是 Chrony](#1-%E4%BB%80%E4%B9%88%E6%98%AF-chrony)
- [2. 安装](#2-%E5%AE%89%E8%A3%85)
- [3. chrony.conf 配置](#3-chronyconf-%E9%85%8D%E7%BD%AE)
    - [3.1. 服务端配置](#31-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E9%85%8D%E7%BD%AE)
    - [3.2. 客户端配置](#32-%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)
- [4. 常用命令](#4-%E5%B8%B8%E7%94%A8%E5%91%BD%E4%BB%A4)
- [5. 实战分析](#5-%E5%AE%9E%E6%88%98%E5%88%86%E6%9E%90)
    - [5.1. 服务器时钟跟踪状态信息](#51-%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%97%B6%E9%92%9F%E8%B7%9F%E8%B8%AA%E7%8A%B6%E6%80%81%E4%BF%A1%E6%81%AF)
    - [5.2. 查看时钟层级](#52-%E6%9F%A5%E7%9C%8B%E6%97%B6%E9%92%9F%E5%B1%82%E7%BA%A7)
    - [5.3. 时间源的统计信息](#53-%E6%97%B6%E9%97%B4%E6%BA%90%E7%9A%84%E7%BB%9F%E8%AE%A1%E4%BF%A1%E6%81%AF)
    - [5.4. chronyc tracking](#54-chronyc-tracking)
- [6. 防火墙设置](#6-%E9%98%B2%E7%81%AB%E5%A2%99%E8%AE%BE%E7%BD%AE)
- [7. 离线环境时钟同步设置](#7-%E7%A6%BB%E7%BA%BF%E7%8E%AF%E5%A2%83%E6%97%B6%E9%92%9F%E5%90%8C%E6%AD%A5%E8%AE%BE%E7%BD%AE)
    - [7.1. 主服务器配置](#71-%E4%B8%BB%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%85%8D%E7%BD%AE)
    - [7.2. 客户端配置](#72-%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)
    - [7.3. 如果仍然有问题，查看日志](#73-%E5%A6%82%E6%9E%9C%E4%BB%8D%E7%84%B6%E6%9C%89%E9%97%AE%E9%A2%98%E6%9F%A5%E7%9C%8B%E6%97%A5%E5%BF%97)

<!-- /TOC -->

## 1. 什么是 Chrony

Chrony 是一款用于时钟同步的程序，它可以通过网络协议（如 NTP、UDP）与外部时间源进行通信，从而使本地系统的时钟与参考时钟保持同步。相比其他时钟同步程序，Chrony 具有更高的精度和更好的稳定性，特别适用于在网络不稳定或移动设备上使用。

以下是 Chrony 的一些主要特点：

- 渐进式时钟调整：Chrony 通过缓慢地调整时钟频率和偏移量来避免大幅度调整引起的系统不稳定性。
- 时钟纠正算法：Chrony 使用一种称为 MLE（Maximum Likelihood Estimation）的算法来计算时钟偏移量和频率误差，从而提高时钟同步的准确性和稳定性。
- 无需 root 权限：Chrony 可以在普通用户下运行，并且不需要 root 权限。
- 安全性：Chrony 支持加密和身份验证，以防止恶意攻击和数据篡改。
- 网络适应性：Chrony 可以根据网络延迟和时钟偏移量自适应地选择最佳的时间源。

相比 NTP 更加精准好用。推荐使用 Chrony。

总的来说，Chrony 是一款功能强大、精度高、稳定性好、安全性高的时钟同步程序，广泛用于各种 Linux 和 Unix 系统中。

## 2. 安装

```sh
# CentOS
yum -y install chrony

# Ubuntu
apt -y install chrony

# 开启
systemctl enable chronyd
systemctl start chronyd
```

## 3. chrony.conf 配置

需要关注以下项：

1. 设置时间源: server
2. 设置权限: allow

```conf
# 使用 pool.ntp.org 项目中的公共服务器。以server开，理论上想添加多少时间服务器都可以。
# Use public servers from the pool.ntp.org project.
# Please consider joining the pool (http://www.pool.ntp.org/join.html).
server 0.centos.pool.ntp.org iburst
server 1.centos.pool.ntp.org iburst
server 2.centos.pool.ntp.org iburst
server 3.centos.pool.ntp.org iburst

# 国内源
server ntp1.aliyun.com iburst
server ntp2.aliyun.com iburst

# 根据实际时间计算出服务器增减时间的比率，然后记录到一个文件中，在系统重启后为系统做出最佳时间补偿调整。
# Record the rate at which the system clock gains/losses time.
driftfile /var/lib/chrony/drift

# 如果系统时钟的偏移量大于1秒，则允许系统时钟在前三次更新中步进。
# Allow the system clock to be stepped in the first three updates if its offset is larger than 1 second.
makestep 1.0 3

# 启用实时时钟（RTC）的内核同步。
# Enable kernel synchronization of the real-time clock (RTC).
rtcsync

# 通过使用 hwtimestamp 指令启用硬件时间戳
# Enable hardware timestamping on all interfaces that support it.
#hwtimestamp *

# Increase the minimum number of selectable sources required to adjust the system clock.
#minsources 2

# 指定 NTP 客户端地址，以允许或拒绝连接到扮演时钟服务器的机器
# Allow NTP client access from local network.
allow 192.168.0.0/16

# Serve time even if not synchronized to a time source.
#local stratum 10

# 指定包含 NTP 身份验证密钥的文件。
# Specify file containing keys for NTP authentication.
#keyfile /etc/chrony.keys

# 指定日志文件的目录。
# Specify directory for log files.
logdir /var/log/chrony

# 选择日志文件要记录的信息。
# Select which information is logged.
#log measurements statistics tracking
```

### 3.1. 服务端配置

- ip: 192.168.0.100

```conf
server ntp1.aliyun.com iburst 
server ntp2.aliyun.com iburst

allow 192.168.0.0/16
```

命令：

```sh
systemctl restart chronyd

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 查看时间同步状态
timedatectl status

# 开启网络时间同步
timedatectl set-ntp true

# 设置完时区后，强制同步下系统时钟：
chronyc makestep

# 查看时间源状态
chrony sources -v

# 查看同步状态
chrony tracking

# 查看客户端连接
chronyc clients
```

### 3.2. 客户端配置

```conf
# 指向主时间服务器
server 192.168.0.100 iburst

# 其他基本配置
driftfile /var/lib/chrony/drift
rtcsync
makestep 1.0 3
```

命令：

```sh
systemctl enable chronyd
systemctl start chronyd
systemctl status chronyd

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 查看时间同步状态
timedatectl status

# 开启网络时间同步
timedatectl set-ntp true

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep

# 查看时间源状态
chrony sources -v
```

## 4. 常用命令

```sh
# 查看当前系统时区
timedatectl

# 查看时间同步源：　
chronyc sources -v

# 查看时间同步源状态： 
chronyc sourcestats -v

# 显示 chronyd 的时钟跟踪状态信息
chronyc tracking

# 查看客户端（仅主服务器）
chronyc clients

# 手动同步
chronyc makestep

# 查看 ntp_servers 是否在线
chronyc activity -v

```

## 5. 实战分析

### 5.1. 服务器时钟跟踪状态信息

```sh
# chronyc tracking

Reference ID    : C0A8091E (kube30)
Stratum         : 4
Ref time (UTC)  : Thu Dec 28 15:19:42 2023
System time     : 1557.763061523 seconds slow of NTP time
Last offset     : -0.000001475 seconds
RMS offset      : 0.174507022 seconds
Frequency       : 12.863 ppm slow
Residual freq   : -0.000 ppm
Skew            : 0.057 ppm
Root delay      : 0.028756578 seconds
Root dispersion : 0.002254671 seconds
Update interval : 122.1 seconds
Leap status     : Normal
```

- Reference ID：参考时钟的标识符，此处为 IP 地址 C0A8091E，转换为十进制即为 192.168.9.30，表示此 NTP 服务器的参考时钟为这个 IP 地址所在的设备。
- Stratum：时钟层级，表示此 NTP 服务器与参考时钟之间的距离，数字越小表示层级越高，一般 NTP 客户端在与 NTP 服务器同步时钟时，选择层级比自己低的服务器进行同步。
- Ref time (UTC)：参考时钟的时间，使用 UTC 时间格式表示，此处为 Thu Dec 28 15:19:42 2023，表示参考时钟的时间为 2023 年 12 月 28 日 15 点 19 分 42 秒。
- System time：本地系统的时间，以秒为单位，与参考时钟的时间进行比较，此处为比参考时钟慢了 0.000000000 秒。
- Last offset：本次同步与上次同步的时间偏移量，此处为 -0.000001475 秒，表示本次同步时本地系统的时间比上次同步时提前了这么多。
- RMS offset：时间偏移量的均方根值，反映同步误差的稳定性，此处为 0.174507022 秒。
- Frequency：本地时钟的频率偏移量，表示本地时钟的频率相对于参考时钟的频率有多少偏差。此处为 12.863 ppm slow，表示本地时钟比参考时钟慢了 12.863 个百万分之一。
- Residual freq：频率偏移量的残留误差，即剩余的未被纠正的误差，此处为 -0.000 ppm。
- Skew：时钟偏移量，表示本地时钟与参考时钟之间的偏移量，此处为 0.057 ppm。
- Root delay：NTP 服务器与参考时钟之间的网络延迟，即数据从参考时钟到达 NTP 服务器的时间和从 NTP 服务器到达本地系统的时间之和，此处为 0.028756578 秒。
- Root dispersion：NTP 服务器与参考时钟之间的时钟偏差，表示 NTP 服务器无法精确知道参考时钟的时间，因为时间信息的传输有一定的延迟，此处为 0.002254671 秒。
- Update interval：NTP 客户端更新时钟的时间间隔，此处为 122.1 seconds。
- Leap status：闰秒指示器状态，有三种状态：Normal（正常），Add leap second（加入闰秒），Delete leap second（删除闰秒）。此处为 Normal，表示当前未有闰秒。

当 System time 这个值比较大的话，说明同步时间有问题，需要强制同步时间。

```sh
chronyc -a makestep
```

### 5.2. 查看时钟层级

```sh
-> #  chronyc sources
210 Number of sources = 1
MS Name/IP address         Stratum Poll Reach LastRx Last sample               
===============================================================================
^* kube30                           3            8     1        35    -14us[  -77us] +/-   17ms
```

- 第一列为时间源的 IP 地址或主机名，第二列是时钟层级，数字越小表示层级越高，第三列是时间源的状态（如 代表可用）和延迟（单位为毫秒）

第一列：MS（Mode & State）:

左边字符（M）：

1. ^ = 服务器（server）
2. = = 对等节点（peer）
3. `# =` 本地时钟（local clock）

右边字符（S）:

1. `*` = 当前正在使用作为主时间源（best source）
2. `+` = 已选中，可用于组合计算（combined）
3. `-` = 未被选中（not combined）
4. x = 排除，可能是错误源（may be in error）
5. ~ = 不稳定，延迟波动大（too variable）
6. ? = 不可用（unreachable 或 unreachable for too long）

第三列：Stratum:

>  值越小越好，一般选择 stratum <= 4 的服务器较可靠。

时间服务器层级，范围是 0 ~ 16。

1. 0：特殊保留值（通常为原子钟或 GPS）
2. 1：直接连接到参考时钟（如 GPS）
3. 2：连接到 stratum 1 的服务器
4. 3：连接到 stratum 2 的服务器
5. 16：不可用

第五列：Reach

📌 数值越高越好，推荐至少 377 才算稳定连接。

1. 八进制数字，代表最近 8 次轮询中有多少次成功通信。
2. 377 = 二进制 11111111，表示连续 8 次成功
3. 0 = 连续 8 次失败

第六列：LastRx

1. 最后一次成功接收响应的时间（单位：秒）。数值越小越好。
2. 303 表示 303 秒前收到过数据（约 5 分钟前）

第七列：Last sample

显示上次测量的时间偏差和误差。

1. 格式：±xxxxus[yyyyus] +/- zzzzms
2. adjusted offset：当前调整后的时间偏移（主偏移）
3. measured offset：原始测量的时间偏移
4. estimated error：估计误差（越小越好）

### 5.3. 时间源的统计信息

```sh
-> # chronyc sourcestats -v
210 Number of sources = 1
Name/IP Address            NP  NR  Span  Frequency  Freq Skew  Offset  Std Dev
==============================================================================
kube30                     22  13   28m     -0.000      0.054    -51ns    35us
```

- Number of sources：时间源的数量。
- Name/IP Address：时间源的名称或 IP 地址。
- NP：测量集中的样本点数量。
- NR：与前一个样本点同号的残余运行次数。
- Span：测量集的跨度时间。
- Frequency：估计的时钟频率误差，以 ppm（百万分之一）为单位。
- Freq Skew：频率偏斜，用于统计频率误差的变化率。
- Offset：本地时钟与时间源的时间偏移量。
- Std Dev：偏移量的标准差，用于衡量时钟同步的稳定性。

### 5.4. chronyc tracking

```sh
Reference ID    : 14.103.157.44
Stratum         : 4
Ref time (UTC)  : Thu Jun 26 09:35:00 2025
System time     : 0.000000000 seconds fast on average
Last offset     : +0.001234567 seconds
RMS offset      : 0.002345678 seconds
Frequency       : 10.234 ppm slow
Residual freq   : +0.001 ppm
Skew            : 0.123 ppm
Root delay      : 0.012345678 seconds
Root dispersion : 0.001234567 seconds
Update interval : 64.0 seconds
Leap status     : Normal
```

1. System time 应接近 0（越小越好）
2. Stratum 越小越好
3. Last offset 应在毫秒级以内

## 6. 防火墙设置

```sh
# 添加ntp服务到防火墙
firewall-cmd --permanent --add-service=ntp
firewall-cmd --reload

# 或端口方式添加
firewall-cmd --permanent --add-port=123/udp
firewall-cmd --reload

# 查看防火墙已添加的服务
firewall-cmd --list-services
firewall-cmd --list-ports

# 查看端口是否开放
netstat -unlp | grep 123

# 客户端检查
nc -zv -u ip 123
```

## 7. 离线环境时钟同步设置

### 7.1. 主服务器配置

```conf
# 允许客户端同步
allow 192.168.1.0/24

# 即使没有外部时间源也提供服务
local stratum 10

# 其他基本配置
driftfile /var/lib/chrony/drift
rtcsync
makestep 1.0 3

# 日志配置
logdir /var/log/chrony
```

```sh
# 启动服务
systemctl enable chronyd
systemctl start chronyd
systemctl status chronyd

# 查看时间源状态
chrony sources -v

# 查看客户端连接
chrony clients
```

### 7.2. 客户端配置

```conf
# 指定主服务器
server 192.168.1.1 iburst

# 其他基本配置
driftfile /var/lib/chrony/drift
rtcsync
makestep 1.0 3
```

```sh
# 启动服务
systemctl enable chronyd
systemctl start chronyd
systemctl status chronyd

# 查看时间源状态
chrony sources -v

# 查看同步状态
chrony tracking

# 强制立即同步
chronyc makestep
```

### 7.3. 如果仍然有问题，查看日志

```sh
# 查看systemd日志
journalctl -u chronyd -n 20

# 查看系统日志中的chrony相关信息
grep chrony /var/log/messages | tail -10

# 临时关闭SELinux测试
# 查看SELinux状态
getenforce

# 如果是Enforcing，临时关闭测试
setenforce 0
systemctl restart chronyd
```
