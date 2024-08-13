---
title: "Vmware Linux 虚拟机初始化"
date: 2024-07-26T10:24:35+08:00
lastmod: 2024-07-26T10:24:35+08:00
draft: false
tags: ["虚拟机", "linux"]
categories: ["虚拟机"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 网络配置

```sh
cat /etc/sysconfig/network-scripts/ifcfg-ens33 

TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static # 修改成 static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=f72ecf66-d8b0-456b-9e61-05297b1d4131
DEVICE=ens33
ONBOOT=yes # 开机启动
IPADDR=192.168.9.100 # 设置本机IP
GATEWAY=192.168.9.2 # 设置本机的网关
NETMASK=255.255.255.0 # 设置本机的掩码

#  设置DNS
cat /etc/resolv.conf                          
nameserver 223.5.5.5
nameserver 114.114.114.114

# 重启网络服务
systemctl restart network

# 查看网络状态
ip addr

# 测试网络
ping www.baidu.com

PING www.a.shifen.com (220.181.38.148) 56(84) bytes of data.
64 bytes from 220.181.38.148 (220.181.38.148): icmp_seq=1 ttl=128 time=8.00 ms
64 bytes from 220.181.38.148 (220.181.38.148): icmp_seq=2 ttl=128 time=7.84 ms
64 bytes from 220.181.38.148 (220.181.38.148): icmp_seq=3 ttl=128 time=7.84 ms
```

## 2. 更换源

```sh
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup

curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo

yum clean all && yum makecache
```

## 3. 安装常用工具

```sh
curl -sSL https://gitee.com/sgfoot/library/raw/master/oh-my-zsh/install.sh |bash

yum install net-tools git vim telnet screen tree nmap dos2unix lrzsz nc lsof wget tcpdump htop iftop iotop sysstat nethogs traceroute -y

yum install -y epel-release
```

## 4. 时间同步

```sh
# 安装
yum install chrony -y

# 管理
systemctl start chronyd      #启动
systemctl status chronyd    #查看
systemctl restart chronyd   #重启
systemctl stop chronyd      #停止

systemctl enable chronyd 　　  #设置开机启动

timedatectl set-timezone Asia/Shanghai
```

设置时间源

```sh
vim /etc/chrony.conf

# 注释默认的同步地址
#server 0.centos.pool.ntp.org iburst
#server 1.centos.pool.ntp.org iburst
#server 2.centos.pool.ntp.org iburst
#server 3.centos.pool.ntp.org iburst
server ntp1.aliyun.com iburst # 添加这一行，表示与本机同步时间，其它机器都填写这个地址。
server ntp2.aliyun.com iburst
server ntp.ntsc.ac.cn iburst　

# Allow NTP client access from local network.
# allow 192.168.9.0/24   #允许哪些服务器到这台服务器来同步时间

systemctl restart chronyd   #重启
```

查看时间&同步

```sh

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep

# 校准时间服务器
chronyc tracking

# 查看
timedatectl

# 命令行模式查看时间同步源 　　
chronyc sources -v

# 查看时间同步源状态： 
chronyc sourcestats -v
```

## 5. 共享目录

```sh
yum install -y open-vm-tools

vmhgfs-fuse /mnt/hgfs/
```

## 6. 参考

- [windows安装vmware.centos7工作流程](https://www.jianshu.com/p/4cbb6d402bcc)
- [VMware Workstation Pro 15安装CentOS7](https://www.jianshu.com/p/abeb59e3cf61)
- [vmware虚拟机centos7网络配置](https://www.jianshu.com/p/a516a28b5f04)