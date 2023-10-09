---
title: "Supervisor进程守护工具"
date: 2020-05-27T14:46:37+08:00
lastmod: 2020-05-27T14:46:37+08:00
draft: false
tags: ["supervisor", "进程守护", "工具", "linux"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---
## 介绍
supervisor是python写的一个进程守护工具,非常实用,时时监听你的进程是否正常, 发现异常自动启动, 生产环境必备软件.
## 安装
1. CentOS Yum安装
```
#!/bin/bash
yum install -y epel-release # 依赖
yum install -y supervisor # 安装
systemctl enable supervisord # 开机自启动
systemctl start supervisord # 启动supervisord服务
systemctl status supervisord # 查看supervisord服务状态
ps -ef|grep supervisord # 查看是否存在supervisord进程
```
2. 离线安装
   参考: https://segmentfault.com/a/1190000011696023

## 基础
1. supervisord 启动工具
2. echo_supervisord_conf 生成配置工具
3. supervisorctl 管理进程工具
4. /etc/supervisor.conf 默认配置工具路径
5. /etc/supervisord.d/ 配置工具目录

### supervisorctl 命令使用

1. status 查看状态
2. reload 重启所有服务
3. update 更新
4. stop [进程名]
5. start [进程名]
6. restart [进程名] 



## supervisor.conf配置
`vim /etc/supervisor.conf`

1. include 
>  包含supervisord.d目录下所有的*.ini后缀文件配置. 所以我们在`supervisord.d`目录下新建 需要管理进程的配置, 如myprogram.ini. 里面填写什么内容,即上面的进程配置.

```
[include]
files = supervisord.d/*.ini
```



## 程序配置样例
跳转到`cd /etc/supervisord.d/ 新建touch mypro.ini文件, 将下面的内容复制

```
[program:gateway] 		; 程序名称，在 supervisorctl 中通过这个值来对程序进行一系列的操作
directory=/data/  ; 程序的启动目录, 相当于cd到这个目录
command=go run main.go 		; 启动命令，与手动在命令行启动的命令是一样的
autorestart=true     		; 程序异常退出后自动重启
autostart=true        		; 在 supervisord 启动的时候也自动启动
redirect_stderr=true  		; 把 stderr 重定向到 stdout，默认 false
startretries=3				; 启动失败后尝试次数
user=root           		; 用哪个用户启动
stdout_logfile_maxbytes = 100MB  ; stdout 日志文件大小，默认 50MB
stdout_logfile_backups = 3     ; stdout 日志文件备份数
stdout_logfile = /data/logs/supervisor.log ; 日志输出路径
;environment=""  		; 可以通过 environment 来添加需要的环境变量
```

## 使用supervisorctl 操作进程

```
supervisorctl start [程序名称] , 如上面[程序配置样例]的gateway
supervisorctl stop [程序名称] , 如上面[程序配置样例]的gateway
supervisorctl restart [程序名称] , 如上面[程序配置样例]的gateway
也可以直接进入supervisorctl 将会看到所有的程序名称.可以使用status, start, stop, restart, reload, update(如果更新配置后使用这个)
```


## 参考

1. https://www.cnblogs.com/sailq21/p/9227592.html