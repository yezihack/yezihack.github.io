---
title: "nginx 添加权限验证"
date: 2020-07-21T19:57:25+08:00
lastmod: 2022-06-16T8:37:25+08:00
draft: false
tags: ["nginx", "权限", "htpasswd"]
categories: ["nginx"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---
<!-- TOC -->

- [.1. 安装 httpd-tools](#1-安装-httpd-tools)
- [.2. 创建密码目录](#2-创建密码目录)
- [.3. 生成新的用户名和密码](#3-生成新的用户名和密码)
- [.4. 查看用户名](#4-查看用户名)
- [.5. 应用到nginx配置上](#5-应用到nginx配置上)
- [.6. 报错无扩展(http_auth_basic_module)](#6-报错无扩展http_auth_basic_module)
  - [.6.1. 编译 http_auth_basic_module 扩展](#61-编译-http_auth_basic_module-扩展)

<!-- /TOC -->
> 安全永久是第一位

## .1. 安装 httpd-tools

````sh
yum install -y  httpd-tools 
````

## .2. 创建密码目录

```sh
mkdir -p /etc/nginx/
```

## .3. 生成新的用户名和密码

> 可以创建多个用户和密码.

```sh
# admin 是你的帐号
# password 是你的密码
htpasswd -bc /etc/nginx/htpasswd.users admin password

# 添加 root 帐号和密码
htpasswd -bc /etc/nginx/htpasswd.users root password
```

## .4. 查看用户名

```sh
cat /etc/nginx/htpasswd.users 
# admin:$apr1$9c2/hWtI$0CSGPb8xGTxbZ4CLOx2N3.
# root:$apr1$9c2/fsadfasf1213xGTxbZ4fas12311.
```

## .5. 应用到nginx配置上

添加以下二行代码在 `server节点上`

```sh
auth_basic "Restricted Access";      # 验证
auth_basic_user_file /etc/nginx/htpasswd.users;    
```

也可以关闭

```shell
auth_basic off;      # 关闭验证
```

完整的配置：

auth_basic 可以位于 http, server, location, limit_except 位置。

```sh
server {
    listen 80;
    server_name fs.com;
    access_log /usr/local/nginx/logs/data.log main;
    root /data/wwwroot/mywww;
    auth_basic "Restricted Access";      # 验证
    auth_basic_user_file /etc/nginx/htpasswd.users;             # 验证文件
    location / {
     
   }
}
```

## .6. 报错无扩展(http_auth_basic_module)

```shell
nginx: [emerg] unknown directive "auth_basic " in /usr/local/nginx/conf/vhost/prometheus.conf:4
nginx: configuration file /usr/local/nginx/conf/nginx.conf test failed
```

### .6.1. 编译 http_auth_basic_module 扩展

<http://nginx.org/en/docs/http/ngx_http_auth_basic_module.html>
