---
title: "Systemctl使用与自定义"
date: 2020-06-18T19:52:12+08:00
lastmod: 2020-06-18T19:52:12+08:00
draft: false
tags: ["tool", "systemctl", "linux"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



##  systemctl 命令的使用

### 启动

```
systemctl start redis
```

### 停止

```
systemctl stop redis
```

### 重启

```
systemctl restart redis
```

### 状态

```
systemctl status redis
```

## 自定义配置

### 新建 systemctl 文件

> 以 redis 服务为例

```
touch /lib/systemd/system/redis.service
vim /lib/systemd/system/redis.service
```

### 配置文件

> vim /lib/systemd/system/redis.service

```
[Unit]
Description=Redis
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
ExecReload=/usr/local/bin/redis-server -s reload
ExecStop=/usr/local/bin/redis-server -s stop
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

1. [Unit] 表示这是基础信息
    - Description 是描述
    - After 是在那个服务后面启动，一般是网络服务启动后启动
2. [Service] 表示这里是服务信息
    - ExecStart 是启动服务的命令
    - ExecReload 是重启服务的指令
    - ExecStop 是停止服务的指令
3. [Install] 表示这是是安装相关信息
	- WantedBy 是以哪种方式启动：multi-user.target表明当系统以多用户方式（默认的运行级别）启动时，这个服务需要被自动运行。

## 刷新配置

```
systemctl daemon-reload
```

##　设置开机启动

```
systemctl enable redis
```



## 参考

1. [Systemd 入门教程：命令篇](http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)
2. [[自定义systemctl管理服务(redis)](https://segmentfault.com/a/1190000011401522)