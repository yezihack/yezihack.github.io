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



> systemd是Linux电脑操作系统之下的一套中央化系统及设置管理程序（init），包括有守护进程、程序库以及应用软件
> 在Unix中常以“d”作为系统守护进程（英语：daemon，亦称后台进程）的后缀标识

##  systemctl 命令的使用
> 以下以 redis 为例

### 启动

```sh
systemctl start redis
```

### 停止

```sh
systemctl stop redis
```

### 重启

```sh
systemctl restart redis
```

### 状态

```sh
systemctl status redis
```

### 刷新服务
```sh
systemctl daemon-reload
```

###　设置开机启动

```sh
systemctl enable redis
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
Type=simple
KillMode=process
Restart=on-failure
RestartSec=3s

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
    - Restart  设为`on-failure`，表示任何意外的失败，就将重启sshd
    - RestartSec 表示 Systemd 重启服务之前，需要等待的秒数。上面的例子设为等待3秒。
3. [Install] 表示这是是安装相关信息
	
	- WantedBy 是以哪种方式启动：multi-user.target表明当系统以多用户方式（默认的运行级别）启动时，这个服务需要被自动运行。
	




## 参考

1. [Systemd 入门教程：命令篇](http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)
2. [Systemd 参数解读](https://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-part-two.html)
3. [[自定义systemctl管理服务(redis)](https://segmentfault.com/a/1190000011401522)