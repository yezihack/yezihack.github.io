---
title: "nginx 添加权限验证"
date: 2020-07-21T19:57:25+08:00
lastmod: 2020-07-21T19:57:25+08:00
draft: false
tags: ["nginx", "权限"]
categories: ["nginx"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

> 安全永久是第一位. 

## 安装 httpd-tools

````
yum install -y  httpd-tools 
````

## 创建密码目录

```
mkdir -p /etc/nginx/
```

## 生成新的用户名和密码

> 可以创建多个用户和密码.

```
# admin 是你的帐号
# password 是你的密码
htpasswd -bc /etc/nginx/htpasswd.users admin password

htpasswd -bc /etc/nginx/htpasswd.users root password
```

## 查看用户名

```
cat /etc/nginx/htpasswd.users 
# admin:$apr1$9c2/hWtI$0CSGPb8xGTxbZ4CLOx2N3.
# root:$apr1$9c2/fsadfasf1213xGTxbZ4fas12311.
```

## 应用到nginx配置上

添加以下二行代码在 `server节点上`

```
auth_basic "Restricted Access";      # 验证
auth_basic_user_file /etc/nginx/htpasswd.users;    
```

完整的配置

```
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

