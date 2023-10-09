---
title: "Nginx 源码安装"
date: 2023-03-03T15:34:45+08:00
lastmod: 2023-03-03T15:34:45+08:00
draft: false
tags: ["linux", "nginx"]
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

## 源码安装 nginx

### 下载

<http://nginx.org/en/download.html>

```sh
wget http://nginx.org/download/nginx-1.23.3.tar.gz

tar -zxvf nginx-1.23.3.tar.gz

cd nginx-1.23.3
```

### 修改源码版本

> 修改 nginx 默认的版本名称,如 nginx/1.23.3, 可任意修改为: sgfoot/100.0.0

```sh
vim src/core/nginx.h # 大约在14行左右

#define nginx_version      1023003
#define NGINX_VERSION      "1.23.3" # 版本号修改
#define NGINX_VER          "nginx/" NGINX_VERSION # 软件名称修改
```

## 安装

- 使用自定义用户和用户组,更加安全

开启模块:

- `with-http_ssl_module` SSL模块
- `with-http_stub_status_module` 统计功能模块,分析 nginx 性能
- `with-http_realip_module` 获取真实IP模块
- `with-threads` 线程池模块,提高nginx性能
- `with-http_gzip_static_module` 开启压缩功能

```sh
yum -y install gcc pcre pcre-devel zlib zlib-devel openssl openssl-devel

# 添加用户和组
groupadd www
useradd -g www www

# 配置
./configure \
--user=www \
--group=www \
--prefix=/usr/local/nginx \
--with-http_ssl_module \
--with-http_stub_status_module \
--with-http_realip_module \
--with-threads \
--with-http_gzip_static_module

# 编译
make

# 安装
make install
```

## 验证

```sh
-> # /usr/local/nginx/sbin/nginx -V        
nginx version: fox/10.230.30
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 
built with OpenSSL 1.0.2k-fips  26 Jan 2017
TLS SNI support enabled
configure arguments: --user=www --group=www --prefix=/usr/local/nginx --with-http_ssl_module --with-http_stub_status_module --with-http_realip_module --with-threads
```

## 加入 systemd

创建 systemd 文件

```sh

cat > /usr/lib/systemd/system/nginx.service <<EOF
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
User=root
Group=root
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t
ExecStart=/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/bin/kill -s QUIT \$MAINPID
PrivateTmp=true
ReRestart=always
RestartSec=3s

[Install]
WantedBy=multi-user.target
EOF
```

命令使用

```sh
# 刷新 systemd
systemctl daemon-reload

# 启动 nginx
systemctl start nginx

# 停止 
systemctl stop nginx

# 重启
systemctl restart nginx
```

## 推荐配置

- `worker_processes` 设置CPU核数, lscpu Core(s) 可以查看,最多设置8个进程数.
- 

```conf
user  www www;
worker_processes 8;
worker_cpu_affinity 10000000 01000000 00100000 00010000 00001000 00000100 00000010 00000001
worker_rlimit_nofile 51200;

error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

pid        logs/nginx.pid;


events {
    use epoll;
    worker_connections  1024; # 是每个worker进程允许的最多连接数，
    multi_accept on;
}


http {
    include       mime.types;
    default_type  application/octet-stream;
    charset utf-8; 

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile       on; # 加速文件传输效率
    tcp_nopush     on; # 减小了额外开销，提高网络效率
    tcp_nodelay    on;

    #keepalive_timeout  0;
    keepalive_timeout  65;
    client_max_body_size 100m;         #主要是这个参数，限制了上传文件大大小

    # 开启压缩
    gzip  on;
    gzip_min_length  1k;
    gzip_buffers     4 16k;
    gzip_http_version 1.1;
    gzip_comp_level 9;
    gzip_types       text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php;
    gzip_vary on;

    include conf.d/*.conf;
}
```

conf.d 文件夹配置实例:

```conf
server {
   listen       8000;
   server_name  test.cc;

   location / {
        return 200;
   }
}
```

## 参考

- [Nginx常用模块及案例](https://www.cnblogs.com/you-men/p/12827547.html)
- [Nginx 中文文档](https://docshome.gitbook.io/nginx-docs/he-xin-gong-neng/http)

## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
