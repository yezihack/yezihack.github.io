---
title: "Linux DNS 略解"
date: 2022-04-25T09:58:14+08:00
lastmod: 2022-04-25T09:58:14+08:00
draft: false
tags: ["linux", "网络", "dns"]
categories: ["网络"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""

---

## DNS

> 域名系统

DNS 全称：Domain Name System

域名系统相当于一个“翻译官”，将域名翻译成对应的IP地址，然后再请求目标IP。

## Linux 设置 DNS

> /etc/resolv 设置DNS无须重新网络，立即生效。

```sh
cat /etc/resolv.conf

search github.com
options timeout:1 attempts:1 rotate
nameserver 192.168.1.1
nameserver 192.168.1.2
nameserver 192.168.1.3
```

### 解释

nameserver:dns服务器的ip地址。最多能设三个。

- timeout:查询一个nameserver的超时时间，单位是秒。系统缺省是5，最大可以设为30。
- attempts:这个是查询的整个都尝试一遍的次数。缺省是2。
- rotate:这个参数的含义是随机选取一个作为首选查询的dns server。系统缺省是从上到下的。

## DNS 排障方法

经常会出现某域名不通，需要使用 nslookup 工具诊断

```sh
# 安装
yum -y  install nslookup 

-> % nslookup www.github.com
Server:		114.114.114.114
Address:	114.114.114.114#53

Non-authoritative answer:
www.github.com	canonical name = github.com.
Name:	github.com
Address: 20.205.243.166
```