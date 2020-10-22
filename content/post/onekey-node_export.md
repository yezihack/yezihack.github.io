---
title: "node_export 一键安装"
date: 2020-10-15T16:49:55+08:00
lastmod: 2020-10-15T16:49:55+08:00
draft: false
tags: ["一键安装", "shell", "脚本"]
categories: ["脚本"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 仅适合用 CentOS 7

## node_export 安装

> linux 服务器信息等资源收集安装包

一键安装

```shell
curl -sSL http://s1.sgfoot.com/sh/node_exporter.sh |sh
```

## 验证

```shell
netstat -nplt |grep node_exporter
```



## 配置nginx安全访问

> 如果涉及到外网访问则需要配置密码访问
>
> 参考：[nginx 添加权限验证](https://www.sgfoot.com/htpasswd.html)

```shell
htpasswd -bc /etc/nginx/htpasswd.users sgfoot sgfoot.pass
# sgfoot 是帐号名
# sgfoot.pass 是密码
```

nginx 的vhost配置 node_exporter.conf

```shell
server {
    listen 80;
    server_name node_exporter.io;
    location / {
    	auth_basic           "Prometheus";
        auth_basic_user_file /etc/nginx/htpasswd.users;# 验证文件
 	    proxy_pass http://127.0.0.1:9100;
   }
}
```

## 添加 prometheus 节点

 1. 配置 host

    ```shell
    vim /etc/hosts
    127.0.0.1 mysqld_exporter.io
    ```

 1. `vim /data/local/prometheus/prometheus.yml` 在 node_exporter.targets 添加 host:port

    ```shell
    scrape_configs:
        - job_name: 'node_exporter'
            static_configs:
            - targets: ['sgfoot.node_exporter:9100', 'cj.node_exporter.io:80']
            basic_auth:
              username: sgfoot
              password: sgfoot.pass
    ```

 1. 重启 `systemctl restart prometheus`



## 参考

[prometheus监听node_exporter](http://localhost:1313/prometheus.html#node_exporter-%E5%AE%89%E8%A3%85)

[nginx 添加权限验证](https://www.sgfoot.com/htpasswd.html)

