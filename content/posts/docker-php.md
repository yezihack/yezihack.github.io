---
title: "Docker 安装 php 环境"
date: 2021-04-06T11:38:33+08:00
lastmod: 2021-04-06T11:38:33+08:00
draft: false
tags: ["docker", "docker教程", "教程", "php", "nginx"]
categories: ["docker"]
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

> php 环境需要与 nginx 配合安装，共享 nginx 解析的目录(www)



## 基本参数

1. `-d` 后台启动
2. `--name` 定义一个别名
3. `-v` 挂载目录
4. `--link`  链接其它 docker 容器名称



## 安装 php 

> 即安装 php-fpm 环境
>
> docker search php

```sh 
docker run --name  dev-phpfpm -v /d/local/nginx/www:/www  -d php:5.6-fpm
```

1. `/d/local/nginx/www` 这里必须是 nginx 解析的目录，也就是与 nginx 共享目录。

## 安装 nginx

> ro 表示只读权限

```sh
docker run --name dev-nginx-php -p 8080:80 -d -v /d/local/nginx/www:/usr/share/nginx/html:ro -v /d/local/nginx/conf.d:/etc/nginx/conf.d:ro --link dev-phpfpm:php nginx
```

1. `/d/local/nginx/www` , `/d/local/nginx/conf.d`是宿主机的目录，可以自定义。
2. `/usr/share/nginx/html`, `/etc/nginx/conf.d` 是 nginx 里的固定目录，不能更改。
3. `--link dev-phpfpm:php` 是链接上面的 `php` 容器，`dev-phpfpm`是别名，`php` 是php容器



## 修改nginx配置文件

> /d/local/nginx/conf.d 是 nginx 映射的目录。

`/d/local/nginx/conf.d` 目录下创建:`php.conf`文件

```sh
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm index.php;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    location ~ \.php$ {
        fastcgi_pass   php:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  /www/$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```



## 验证

在 `/d/local/nginx/www`目录下创建，`phpinfo.php`

```php
<?php
echo phpinfo();
```



## 关于我
我的博客：https://yezihack.github.io

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)