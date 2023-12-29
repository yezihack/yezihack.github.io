---
title: "Linux Chronyd 极简教程"
date: 2023-12-28T23:28:45+08:00
lastmod: 2023-12-28T23:28:45+08:00
draft: false
tags: ["linux", "chronyd", "极简教程"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

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
chronyc -a makestep
```

### 3.2. 客户端配置

```conf
server 192.168.0.100 iburst 

allow 192.168.0.100
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
chronyc -a makestep
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

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep

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