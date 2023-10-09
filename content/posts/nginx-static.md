---
title: "Nginx 搭建静态服务器"
date: 2020-11-11T17:34:48+08:00
lastmod: 2020-11-11T17:34:48+08:00
draft: false
tags: ["工具", "静态服务器", "nginx"]
categories: ["nginx"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

## 快捷安装 nginx

> CentOS 安装

```sh
yum -y install nginx
```

> 源码安装

```sh
# 下载, 解包
wget http://nginx.org/download/nginx-1.19.4.tar.gz && tar -zxvf nginx-1.19.4.tar.gz && cd nginx-1.19.4

# 编译安装
./configure --prefix=/usr/local/nginx --without-http_rewrite_module
make && make install
# 建立软链
ln -s /usr/local/nginx/sbin/nginx /usr/sbin/
```



## 配置静态服务器

> yum 安装的配置文件目录在 /etc/nginx
>
> 手动安装目录在: /usr/local/nginx



**关键参数配置**

```sh
 root /data/wwwroot/;# 指向你的文件目录
 autoindex on;# 显示目录
 autoindex_exact_size on;# 显示文件大小
 autoindex_localtime on;# 显示文件时间
```

**yum 安装方式配置**

```sh
vim /etc/nginx/nginx.conf
```

**手动安装方式配置**

```sh
vim /usr/local/nginx/conf/nginx.conf
```

可以找到默认的 server {}

```sh
server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        #root         /usr/share/nginx/html;
        root /data/wwwroot/;
        autoindex on;# 显示目录
        autoindex_exact_size on;# 显示文件大小
        autoindex_localtime on;# 显示文件时间

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
        }

        error_page 404 /404.html;
        location = /404.html {
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
        }
    }

```

