---
title: "查看 Linux 系统资源"
date: 2022-02-17T15:36:03+08:00
lastmod: 2022-02-17T15:36:03+08:00
draft: false
tags: ["linux", "命令", "工具"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 1. 系统
```sh
uname -a # 查看系统版本全部信息
uname -r # 查看内核版本
hostname # 查看主机名称
cat /etc/redhat-release # 打印系统类型，只对红帽系统有用, 如 CentOS
env # 显示环境变量
lspci # 主板信息
```

## 2. 资源
```sh
free -mh # 查看内存使用量和交换区使用量
df -h # 查看各分区使用情况
du -sh <目录名> # 查看指定目录的大小
uptime # 查看系统运行时间、用户数、负载
cat /proc/loadavg # 查看系统负载
lsblk # 树形显示硬盘结构
nvidia-smi # 显卡信息
cat /proc/cpuinfo | grep 'model name' | sort | uniq # 查看CPU型号
cat /proc/cpuinfo | grep 'physical id' | sort | uniq | wc -l # 查看 CPU 颗数, 实际Server中插槽上的CPU个数, 物理cpu数量
cat /proc/cpuinfo |grep "cores"|uniq|awk '{print $4}' # 查看 CPU 核数, 一颗CPU上面能处理数据的芯片组的数量。
cat /proc/cpuinfo |grep "processor"|wc -l # 逻辑CPU核数，逻辑CPU数量=物理cpu数量 x cpu cores 这个规格值 x 2(如果支持并开启超线程)。
```

## 3. 进程
```sh
ps -ef                      # 查看所有进程
top                         # 实时显示进程状态
netstat -nplt               # 查看所有监听端口
```

## 4. 用户 
```sh
w                           # 查看活动用户
id <userID>                 # 查看指定用户信息
last                        # 查看用户登录日志
cut -d: -f1 /etc/passwd     # 查看系统所有用户
cut -d: -f1 /etc/group      # 查看系统所有组
crontab -l                  # 查看当前用户的计划任务
systemctl list-unit-files   # 列出服务的开机状态
```


# 网络
```sh
ifconfig # 查看所有网络接口的属性
ip addr # 查看网卡
iptables -L # 查看防火墙设置
route -n # 查看路由表
netstat -lntp # 查看所有监听端口
netstat -antp # 查看所有已经建立的连接
netstat -s # 查看网络统计信息
```

## 其它
```sh
sudo cat /sys/class/dmi/id/product_uuid # 查看 product_uuid 唯一性
```