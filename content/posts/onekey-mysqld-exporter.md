---
title: "mysqld_export 一键安装"
date: 2020-10-22T14:32:37+08:00
lastmod: 2020-10-22T14:32:37+08:00
draft: false
tags: ["一键安装", "shell", "脚本"]
categories: ["脚本"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: true
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "1335350269"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---



> 仅适用 CentOS 7

## mysqld_export 安装

> prometheus 监听 mysql 服务

一键安装

```shell
curl -sSL http://s1.sgfoot.com/sh/mysql_exporter.sh | sudo bash
```

## 验证

```shell
# 验证进程是否启动
netstat -nplt |grep mysqld_exporter

# 验证是否可以获取 metrics
curl http://localhost:9104/metrics
```

## 配置nginx安全访问

> 如果涉及到外网访问则需要配置密码访问
>
> 参考：[nginx 添加权限验证](https://yezihack.github.io/htpasswd.html)

```shell
htpasswd -bc /etc/nginx/htpasswd.users sgfoot sgfoot.pass
# sgfoot 是帐号名
# sgfoot.pass 是密码
```

nginx 的vhost配置 mysqld_exporter.conf

```shell
server {
    listen 80;
    server_name mysqld_exporter.io;
    location / {
    	auth_basic           "Prometheus";
        auth_basic_user_file /etc/nginx/htpasswd.users;# 验证文件
 	    proxy_pass http://127.0.0.1:9104;
   }
}
```

## 添加 prometheus 节点

 1. 配置 host

    ```shell
    vim /etc/hosts
    127.0.0.1 mysqld_exporter.io
    ```

    

 2. `vim /data/local/prometheus/prometheus.yml` 在 node_exporter.targets 添加 host:port

    ```shell
    scrape_configs:
        - job_name: 'mysqld_exporter' # mysqld_exporter 数据源。
            scrape_interval: 10s
            static_configs:
              - targets: ['mysqld_exporter.io:9104']
            basic_auth:
              username: sgfoot
              password: sgfoot.pass
    ```

    

 3. 重启 `systemctl restart prometheus`



## 参考

[promethues监听MySQL](https://yezihack.github.io/mysqld_exporter.html)

[nginx 添加权限验证](https://yezihack.github.io/htpasswd.html)

