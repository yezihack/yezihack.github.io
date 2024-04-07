---
title: "Linux 网络命令"
date: 2024-02-28T18:26:33+08:00
lastmod: 2024-02-28T18:26:33+08:00
draft: false
tags: ["linux", "命令"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. ping 遍天下

```sh
# windows 默认ping 3次
ping www.github.com

# linux 默认无限次数
ping www.github.com

# 限制次数
ping -c 3 www.github.com

# 指定 ping 数据包的大小
ping -s 10240 -c 3 www.github.com

# 指定 ping 时间间隔,默认1秒一次
ping -i 0.1 -c 100 www.github.com

# 快速产生大量的 ping,一般用于测试网卡的丢包率
ping -f -c 1000 www.github.com
```

分析结果

```sh
# ping -c 3 www.github.com
PING github.com (20.205.243.166) 56(84) bytes of data.
64 bytes from 20.205.243.166 (20.205.243.166): icmp_seq=1 ttl=110 time=125 ms
64 bytes from 20.205.243.166 (20.205.243.166): icmp_seq=2 ttl=110 time=125 ms
64 bytes from 20.205.243.166 (20.205.243.166): icmp_seq=3 ttl=110 time=125 ms

--- github.com ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 125.555/125.645/125.813/0.426 ms
```

解释：rtt min/avg/max/mdev = 125.555/125.645/125.813/0.426 ms

- min 最低延时
- avg 平均延时
- max 最大延时
- mdev 是 Mean Deviation 的缩写，表示 ICMP 包的 RTT 偏离平均值的程度，主要用于衡量网速的稳定性
  - mdev 值越大说明网速越不稳定

## 2. nslookup DNS探测

安装软件：

```sh
# CentOS
yum -y install bind-utils

# Ubuntu
apt -y install dnsutils
```

常见使用：

```sh
# 交互模式，默认选择 /etc/resolv.conf 第一个DNS服务器
-> # nslookup
> www.github.com
Server:114.114.114.114 # DNS IP
Address:114.114.114.114#53 # DNS IP#Port

Non-authoritative answer: # 非权威，即非最新解析地址
www.github.com	canonical name = github.com. # 别名
Name:	github.com # 域名
Address: 20.205.243.166 # 服务器IP

-> # nslookup - 8.8.8.8 # 加 - ,指定连接 8.8.8.8 的DNS服务器
> www.github.com
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
www.github.com	canonical name = github.com.
Name:	github.com
Address: 20.205.243.166

# 调试配置
nslookup # 进入交互模式
server 8.8.8.8 # 更改上连的DNS服务器地址

www.bing.com # 再次查看

set all # 查看当前dns配置
set debug # 进入调试模式

> set domain=baidu.com # 设置主域名
> images # 查询

# 设置邮件
> set type=MX
> baidu.com
```

目前常用的 type 值：

- A (Address Record): 它指定了一个32位的IPv4地址，用于把域名映射到对应的IP地址。
- AAAA (Quad-A Record): 等同于A记录，但它指定了一个128位的IPv6地址。
- ANY (Any Record): 这不是真正的记录类型，而是DNS查询的一个特殊请求，它请求返回所有可用的关于域名的记录。
- CNAME (Canonical Name Record): 它允许你将一个域名指向另一个域名，即别名记录。
- HINFO (Host Information Record): 该记录用来描述主机的CPU类型和操作系统类型，不常用于普通的DNS记录。
- MINFO (Mailbox or mail list Information Record): 用于电子邮件和邮件列表的管理信息，现在已不常用。
- MX (Mail Exchange Record): 它指定了处理该域名电子邮件的邮件服务器及其优先级。
- NS (Name Server Record): 它表明了该域由哪个DNS服务器控制。
- PTR (Pointer Record): 通常用于反向DNS查询，把IP地址映射回对应的域名。
- RP (Responsible Person Record): 指定了与域名相关的负责人的电子邮件地址。
- SOA (Start of Authority Record): 它标志了一个DNS区域文件的开始，包含了关于DNS区域的关键元数据，如DNS区域的管理员、最后更新时间等信息。
- UINFO (User Information Record): 为一个域名提供了关于用户的信息，但此记录类型在现实中几乎不使用。


反查IP所属地：

```sh
-> # curl cip.cc/20.205.243.166
IP	: 20.205.243.166
地址	: 美国  美国

数据二	: 美国 | Microsoft数据中心

数据三	: 美国 | 微软

URL	: http://www.cip.cc/20.205.243.166
```

## dig

> dig 是一个在Unix和类Unix系统上非常流行的DNS查找工具，全称为“Domain Information Groper”。它是用于查询DNS服务器的命令行工具，可以获取和诊断域名相关的信息。

```sh
dig # 查看全球13台根服务器信息
dig . # 加个点

# 格式
dig @dnsserver name querytype

# 查询
dig bing.com
dig bing.com A
dig bing.com +short
dig bing.com +trace

# 指定DNS查询
dig @8.8.8.8 bing.com
dig @8.8.8.8 bing.com A
dig @8.8.8.8 bing.com +short
dig @8.8.8.8 bing.com +trace

# 批量查询
cat querylist
www.bing.com
www.github.com

dig -f querylist -t A
dig -f querylist -t A +short

# ip 反查域名
dig -x 220.181.38.150

# dig 交互采默 UDP
dig +tcp www.bing.com

# 追加域
dig +domain=bing.com image

# 跟踪 dig 全过程
dig +trace bing.com
```

## 3. ss

> 取代 netstat 的强大命令

![netstat替代方案图](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317092932.png)
![net-tools vs iproute2](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093052.png)
![net-tools](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093342.png)
![ss](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093405.png)

```sh
# 安装
yum -y install iproute iproute-doc

# 统计,可查看到TCP,UDP,RAW,INET,FRAG
ss -s

# 查看所有打开的网络端口
ss -l

# 查看所有的 socket 连接
ss -a
## 仅 TCP
ss -ta
## 仅 UDP
ss -ua
## 仅 RAW
ss -wa
## 仅 UNIX
ss -xa
```

net-tools 和 iproute2 对应关系

![iproute](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093503.png)
![iproute](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093512.png)
![ip取代](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093647.png)
![ip取代](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240317093655.png)