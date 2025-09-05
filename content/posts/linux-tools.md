---
title: "Linux 网络工具完全指南"
date: 2025-09-05T09:53:28+08:00
lastmod: 2025-09-05T10:11:33+08:00
draft: false
tags: ["linux", "网络工具", "netstat", "ss", "lsof", "tcpdump", "网络排障"]
categories: ["linux", "网络"]
author: "百里"
comment: false
toc: true
reward: true
description: "深入了解 Linux 网络工具的使用方法，包括 netstat、ss、lsof、tcpdump 等命令的详细说明和网络故障排查实战案例"
---

Linux 系统提供了丰富的网络工具来帮助管理员监控、诊断和排查网络问题。本文将详细介绍常用的网络工具使用方法，并提供实际的故障排查案例。

## 概述

网络故障排查是系统管理员的重要技能。掌握以下工具能够帮助快速定位和解决网络问题：

- **netstat**：显示网络连接、路由表和网络接口信息
- **ss**：现代化的 netstat 替代工具，性能更好
- **lsof**：列出打开的文件和网络连接
- **tcpdump**：网络数据包捕获和分析工具
- **ping/traceroute**：网络连通性测试工具
- **nmap**：网络扫描和端口检测工具

## netstat 命令详解

### 基本语法

```bash
netstat [选项]
```

### 常用选项

| 选项 | 描述 |
|------|------|
| -a | 显示所有连接和监听端口 |
| -t | 显示 TCP 连接 |
| -u | 显示 UDP 连接 |
| -n | 以数字形式显示地址和端口 |
| -l | 只显示监听状态的端口 |
| -p | 显示进程 ID 和名称 |
| -r | 显示路由表 |
| -i | 显示网络接口统计 |
| -s | 显示网络统计信息 |

### 实用示例

#### 1. 查看所有网络连接

```bash
# 显示所有 TCP 和 UDP 连接
netstat -an

# 显示所有 TCP 连接，包含进程信息
netstat -antp

# 显示所有 UDP 连接，包含进程信息
netstat -anup
```

#### 2. 查看监听端口

```bash
# 查看所有监听端口
netstat -ln

# 查看 TCP 监听端口
netstat -lnt

# 查看 UDP 监听端口
netstat -lnu

# 查看监听端口及对应进程
netstat -lntp
```

#### 3. 查看特定端口

```bash
# 查看端口 80 的连接
netstat -an | grep :80

# 查看端口 22 的监听状态
netstat -lnt | grep :22

# 查看某个进程的网络连接
netstat -antp | grep nginx
```

#### 4. 网络统计信息

```bash
# 显示网络统计
netstat -s

# 显示 TCP 统计
netstat -st

# 显示 UDP 统计
netstat -su
```

#### 5. 路由表信息

```bash
# 显示路由表
netstat -r

# 显示路由表（数字格式）
netstat -rn
```

## ss 命令详解

`ss` 是现代 Linux 系统推荐使用的网络状态查看工具，比 `netstat` 更快更强大。

### 基本语法

```bash
ss [选项] [过滤器]
```

### 常用选项

| 选项 | 描述 |
|------|------|
| -a | 显示所有套接字 |
| -l | 显示监听状态的套接字 |
| -t | 显示 TCP 套接字 |
| -u | 显示 UDP 套接字 |
| -n | 不解析服务名称 |
| -p | 显示进程信息 |
| -s | 显示套接字统计 |
| -4 | 只显示 IPv4 |
| -6 | 只显示 IPv6 |

### 实用示例

#### 1. 基本查看

```bash
# 显示所有连接
ss -a

# 显示所有 TCP 连接
ss -at

# 显示所有 UDP 连接
ss -au

# 显示监听端口
ss -lt
```

#### 2. 显示进程信息

```bash
# 显示 TCP 连接及进程
ss -ltp

# 显示 UDP 连接及进程
ss -lup

# 显示所有连接及进程
ss -ap
```

#### 3. 过滤特定端口

```bash
# 查看端口 80 的连接
ss -tn sport = :80

# 查看端口 443 的连接
ss -tn dport = :443

# 查看端口范围
ss -tn sport ge :1024

# 查看特定状态的连接
ss -t state established
```

#### 4. 高级过滤

```bash
# 查看连接到特定 IP 的连接
ss -tn dst 192.168.1.100

# 查看来自特定 IP 的连接
ss -tn src 192.168.1.0/24

# 组合条件查询
ss -tn '( dport = :80 or dport = :443 )'
```

#### 5. 统计信息

```bash
# 显示套接字统计
ss -s

# 显示内存使用情况
ss -m
```

## lsof 命令详解

`lsof`（List Open Files）可以列出系统中被进程打开的文件，包括网络连接。

### 基本语法

```bash
lsof [选项] [文件]
```

### 网络相关选项

| 选项 | 描述 |
|------|------|
| -i | 显示网络连接 |
| -P | 显示端口号而不是服务名 |
| -n | 显示 IP 地址而不是主机名 |
| -p PID | 显示指定进程的文件 |
| -c 命令 | 显示指定命令的文件 |
| -u 用户 | 显示指定用户的文件 |

### 实用示例

#### 1. 查看网络连接

```bash
# 显示所有网络连接
lsof -i

# 显示 TCP 连接
lsof -i tcp

# 显示 UDP 连接
lsof -i udp

# 显示 IPv4 连接
lsof -i 4

# 显示 IPv6 连接
lsof -i 6
```

#### 2. 查看特定端口

```bash
# 查看端口 80 的使用情况
lsof -i :80

# 查看端口 22 的使用情况
lsof -i :22

# 查看端口范围
lsof -i :1-1024

# 查看 TCP 端口 80
lsof -i tcp:80
```

#### 3. 查看特定进程

```bash
# 查看进程 ID 1234 打开的文件
lsof -p 1234

# 查看 nginx 进程的网络连接
lsof -c nginx -i

# 查看用户 www-data 的网络连接
lsof -u www-data -i
```

#### 4. 查看特定 IP

```bash
# 查看连接到特定 IP 的连接
lsof -i @192.168.1.100

# 查看本机特定 IP 的连接
lsof -i @127.0.0.1:80
```

#### 5. 组合查询

```bash
# 查看 nginx 进程在端口 80 的连接
lsof -c nginx -i :80

# 查看所有 ESTABLISHED 状态的连接
lsof -i -sTCP:ESTABLISHED

# 查看所有 LISTEN 状态的连接
lsof -i -sTCP:LISTEN
```

## tcpdump 命令详解

`tcpdump` 是强大的网络数据包捕获工具，用于分析网络流量。

### 基本语法

```bash
tcpdump [选项] [过滤表达式]
```

### 常用选项

| 选项 | 描述 |
|------|------|
| -i 接口 | 指定网络接口 |
| -n | 不解析主机名 |
| -nn | 不解析主机名和端口名 |
| -v | 详细输出 |
| -vv | 更详细输出 |
| -c 数量 | 捕获指定数量的包 |
| -w 文件 | 保存到文件 |
| -r 文件 | 从文件读取 |
| -X | 以十六进制和 ASCII 显示包内容 |
| -s 长度 | 设置捕获包的长度 |

### 实用示例

#### 1. 基本捕获

```bash
# 捕获所有网络包
tcpdump

# 捕获指定接口的包
tcpdump -i eth0

# 捕获 10 个包后停止
tcpdump -c 10

# 详细显示包信息
tcpdump -v
```

#### 2. 协议过滤

```bash
# 只捕获 TCP 包
tcpdump tcp

# 只捕获 UDP 包
tcpdump udp

# 只捕获 ICMP 包
tcpdump icmp

# 只捕获 ARP 包
tcpdump arp
```

#### 3. 主机过滤

```bash
# 捕获与特定主机的通信
tcpdump host 192.168.1.100

# 捕获来自特定主机的包
tcpdump src host 192.168.1.100

# 捕获发往特定主机的包
tcpdump dst host 192.168.1.100

# 捕获特定网段的包
tcpdump net 192.168.1.0/24
```

#### 4. 端口过滤

```bash
# 捕获特定端口的包
tcpdump port 80

# 捕获源端口为 80 的包
tcpdump src port 80

# 捕获目标端口为 80 的包
tcpdump dst port 80

# 捕获端口范围的包
tcpdump portrange 1-1024
```

#### 5. 复杂过滤

```bash
# 捕获 HTTP 流量
tcpdump -i eth0 'tcp port 80'

# 捕获 SSH 流量
tcpdump -i eth0 'tcp port 22'

# 捕获特定主机的 HTTP 流量
tcpdump -i eth0 'host 192.168.1.100 and tcp port 80'

# 捕获非 SSH 的 TCP 流量
tcpdump -i eth0 'tcp and not port 22'

# 捕获 SYN 包
tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'
```

#### 6. 保存和读取

```bash
# 保存捕获的包到文件
tcpdump -i eth0 -w capture.pcap

# 从文件读取包
tcpdump -r capture.pcap

# 保存特定条件的包
tcpdump -i eth0 -w http.pcap 'tcp port 80'

# 实时显示并保存
tcpdump -i eth0 -w capture.pcap 'tcp port 80' &
```

## 其他常用网络工具

### ping 命令

```bash
# 基本 ping
ping google.com

# 指定次数
ping -c 4 google.com

# 指定间隔
ping -i 2 google.com

# 指定包大小
ping -s 1024 google.com

# 设置超时时间
ping -W 3 google.com
```

### traceroute 命令

```bash
# 跟踪路由
traceroute google.com

# 使用 ICMP 包
traceroute -I google.com

# 使用 TCP 包
traceroute -T -p 80 google.com

# 设置最大跳数
traceroute -m 15 google.com
```

### nmap 命令

```bash
# 扫描主机
nmap 192.168.1.100

# 扫描端口范围
nmap -p 1-1000 192.168.1.100

# 扫描网段
nmap 192.168.1.0/24

# TCP SYN 扫描
nmap -sS 192.168.1.100

# UDP 扫描
nmap -sU 192.168.1.100

# 服务版本检测
nmap -sV 192.168.1.100
```

### curl 和 wget

```bash
# 测试 HTTP 连接
curl -I http://example.com

# 测试 HTTPS 连接
curl -I https://example.com

# 显示详细信息
curl -v http://example.com

# 测试特定端口
curl telnet://192.168.1.100:80

# 下载文件
wget http://example.com/file.txt

# 测试下载速度
wget --spider http://example.com
```

## 网络故障排查实战案例

### 案例 1：Web 服务无法访问

**问题描述**：用户反馈无法访问 Web 服务器

**排查步骤**：

```bash
# 1. 检查服务是否运行
systemctl status nginx
ps aux | grep nginx

# 2. 检查端口是否监听
ss -lnt | grep :80
netstat -lnt | grep :80

# 3. 检查防火墙
iptables -L
firewall-cmd --list-all

# 4. 测试本地连接
curl -I http://localhost
telnet localhost 80

# 5. 检查网络连通性
ping 服务器IP
traceroute 服务器IP

# 6. 分析访问日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 案例 2：网络连接异常缓慢

**问题描述**：网络连接建立缓慢，响应时间长

**排查步骤**：

```bash
# 1. 检查网络统计
ss -s
netstat -s

# 2. 查看连接状态分布
ss -tan | awk '{print $1}' | sort | uniq -c

# 3. 检查 TIME_WAIT 连接数
ss -tan | grep TIME-WAIT | wc -l

# 4. 查看网络接口统计
cat /proc/net/dev
ip -s link show

# 5. 检查 TCP 参数
sysctl net.ipv4.tcp_fin_timeout
sysctl net.ipv4.tcp_tw_reuse

# 6. 抓包分析
tcpdump -i eth0 -n 'tcp port 80' -c 100
```

### 案例 3：端口占用问题

**问题描述**：启动服务时提示端口已被占用

**排查步骤**：

```bash
# 1. 查看端口占用情况
lsof -i :80
ss -lntp | grep :80
netstat -lntp | grep :80

# 2. 查看进程详细信息
ps aux | grep 进程ID
cat /proc/进程ID/cmdline

# 3. 查看进程打开的所有文件
lsof -p 进程ID

# 4. 检查服务配置
systemctl status 服务名
journalctl -u 服务名

# 5. 强制释放端口（谨慎使用）
kill -9 进程ID
fuser -k 80/tcp
```

### 案例 4：DNS 解析问题

**问题描述**：域名无法解析或解析缓慢

**排查步骤**：

```bash
# 1. 测试 DNS 解析
nslookup google.com
dig google.com
host google.com

# 2. 检查 DNS 配置
cat /etc/resolv.conf
cat /etc/hosts

# 3. 测试不同 DNS 服务器
dig @8.8.8.8 google.com
dig @114.114.114.114 google.com

# 4. 检查 DNS 缓存
systemctl status systemd-resolved
resolvectl status

# 5. 清除 DNS 缓存
systemctl flush-dns
resolvectl flush-caches

# 6. 跟踪 DNS 查询
tcpdump -i eth0 port 53
```

### 案例 5：网络丢包问题

**问题描述**：网络传输出现丢包现象

**排查步骤**：

```bash
# 1. 检查网络接口错误
ip -s link show
cat /proc/net/dev

# 2. 使用 ping 测试丢包
ping -c 100 目标IP
mtr 目标IP

# 3. 检查网络缓冲区
cat /proc/sys/net/core/rmem_max
cat /proc/sys/net/core/wmem_max

# 4. 查看网络统计
netstat -s | grep -i drop
netstat -s | grep -i error

# 5. 抓包分析
tcpdump -i eth0 -n -c 1000 | grep -i error

# 6. 检查硬件状态
ethtool eth0
dmesg | grep -i network
```

## 网络监控脚本

### 端口监控脚本

```bash
#!/bin/bash
# 监控关键端口状态

PORTS="22 80 443 3306"
LOG_FILE="/var/log/port_monitor.log"

for port in $PORTS; do
    if ss -lnt | grep -q ":$port "; then
        echo "$(date): Port $port is listening" >> $LOG_FILE
    else
        echo "$(date): WARNING - Port $port is not listening" >> $LOG_FILE
        # 发送告警
        echo "Port $port is down" | mail -s "Port Alert" admin@example.com
    fi
done
```

### 连接数监控脚本

```bash
#!/bin/bash
# 监控网络连接数

THRESHOLD=1000
CURRENT=$(ss -tan | grep ESTABLISHED | wc -l)

echo "$(date): Current connections: $CURRENT"

if [ $CURRENT -gt $THRESHOLD ]; then
    echo "$(date): WARNING - Too many connections: $CURRENT" >> /var/log/connection_monitor.log
    # 显示连接最多的 IP
    ss -tan | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr | head -10
fi
```

## 性能优化建议

### 网络参数调优

```bash
# TCP 连接优化
echo 'net.ipv4.tcp_fin_timeout = 30' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_tw_reuse = 1' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 8192' >> /etc/sysctl.conf

# 网络缓冲区优化
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf

# 应用配置
sysctl -p
```

### 监控最佳实践

1. **定期检查**：设置定时任务监控关键指标
2. **日志分析**：定期分析网络日志
3. **性能基线**：建立网络性能基线
4. **告警机制**：设置合理的告警阈值
5. **文档记录**：记录常见问题和解决方案

## 常用命令速查表

### 连接查看

```bash
# 查看所有连接
ss -tuln
netstat -tuln

# 查看进程连接
lsof -i
ss -tlnp

# 查看特定端口
lsof -i :80
ss -lnt | grep :80
```

### 网络测试

```bash
# 连通性测试
ping -c 4 目标IP
traceroute 目标IP
mtr 目标IP

# 端口测试
telnet 目标IP 端口
nmap -p 端口 目标IP
```

### 流量分析

```bash
# 抓包分析
tcpdump -i eth0 -n
tcpdump -i eth0 port 80

# 流量统计
iftop
nethogs
```

## 总结

掌握 Linux 网络工具是系统管理员的必备技能。本文介绍的工具各有特色：

1. **netstat/ss**：查看网络连接状态，ss 性能更好
2. **lsof**：查看进程打开的文件和网络连接
3. **tcpdump**：强大的数据包捕获和分析工具
4. **ping/traceroute**：基础的网络连通性测试
5. **nmap**：网络扫描和安全检测

在实际工作中，建议：

- 熟练掌握基础命令的常用参数
- 建立系统化的故障排查流程
- 编写监控脚本自动化检查
- 定期分析网络性能数据
- 保持学习新工具和技术

通过系统学习和实践，能够快速定位和解决各种网络问题，提高系统的稳定性和可用性。

## 参考资料

1. [Linux 网络工具参考手册](https://linux.die.net/man/)
2. [TCP/IP 详解](https://klose911.github.io/html/tii/tii.html)
3. [Wireshark 网络分析](https://www.wireshark.org/docs/)
4. [Linux 网络编程](https://www.kernel.org/doc/Documentation/networking/)
