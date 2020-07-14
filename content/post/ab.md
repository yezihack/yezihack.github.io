---
title: "Ab"
date: 2020-07-07T15:36:03+08:00
lastmod: 2020-07-07T15:36:03+08:00
draft: false
tags: ["golang", "", ""]
categories: [""]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""
---

## ab 简单使用

并发100, 请求数为1000次.

```
ab -c 100 -n 1000 http://localhost/test.html
```

## ab post json使用
1. -p 数据
2. -T 请求内容格式, 如json: application/json
```
ab -c 100 -n 1000 -p data.json -T application/json http://localhost/1.html
```
data.json
```
{"username":"sgfoot.com"}
```

## 解读报告

```

```





## ab压力测试报错

```
Benchmarking 192.168.1.10 (be patient)
apr_socket_recv: Connection reset by peer (104)
```

以上错误, 说明`192.168.1.10`机器重设连接. 因为`apr_socket_recv`是操作系统内核的一个参数, 如果系统感应到大量的请求时,会降慢速度,对连接进行重置. 这是一种面对SYN flood攻击保护. 但是我们压测时需要关闭这个保护. 

关闭保护

```
# vim /etc/sysctl.conf 
net.ipv4.tcp_syncookies = 0
# sysctl -p
```

