---
title: "Ipvs"
date: 2024-03-27T10:56:10+08:00
lastmod: 2024-03-27T10:56:10+08:00
draft: true
tags: [""]
categories: [""]
author: "百里"
comment: false
toc: true
reward: true
---

## 常用命令

```sh
# 显示 IPVS 表：
ipvsadm -Ln

# 添加一个虚拟服务
ipvsadm -A -t 192.168.0.1:80 -s rr

# 添加一个真实服务器到虚拟服务
## -a 用于将一台真实服务器添加至虚拟服务
## -t 后面是虚拟服务的地址和端口
## -r 后面是真实服务器的地址和端口
## -m 表示使用 masquerading（NAT）模式
ipvsadm -a -t 192.168.0.1:80 -r 172.16.0.2:80 -m

# 删除一个虚拟服务
ipvsadm -D -t 192.168.0.1:80

# 清空 IPVS 表
## -C 命令会清空当前的 IPVS 表，所有的虚拟服务和真实服务器的配置将会被删除。
ipvsadm -C
```

