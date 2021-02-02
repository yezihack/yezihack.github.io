---
title: "Elasticsearch 入门(五) HD 可视化界面"
date: 2020-07-22T11:33:08+08:00
lastmod: 2020-07-22T11:33:08+08:00
draft: false
tags: ["elasticsearch", "elk"]
categories: ["elasticsearch"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""

---



## 效果

1. 图表格式显示, 展示比较丰富
2. 可以自定义`elasticsearch` 的地址, 并显示服务的健康状态

![](http://img.sgfoot.com/b/20200722113701.png?imageslim)

## 安装使用

下载地址

```shell
wget https://github.com/360EntSecGroup-Skylar/ElasticHD/releases/tag/1.4
```

linux & maxOS

```
Step1: Download the corresponding elasticHD version，unzip xxx_elasticHd_xxx.zip
Step2: chmod 0777 ElasticHD
Step3: exec elastichd ./ElasticHD -p 127.0.0.1:9800
# 指定127.0.0.1地址与 9800 端口.
```

window

```
Step1: Download the corresponding elasticHD version，Double click zip package to unzip
Step2: exec elastichd ./ElasticHD -p 127.0.0.1:9800 
# 指定127.0.0.1地址与 9800 端口.
```

## nginx 代理

```shell
vim hd.conf
```

```shell
upstream hd_server {
    server 127.0.0.1:9800 weight=1 max_fails=3 fail_timeout=60;
}
server {
    listen 80;
    server_name hd.elk;
    access_log /data/logs/nginx-hd.log;
    location / {
        proxy_pass http://hd_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```



## 参考

1. https://github.com/360EntSecGroup-Skylar/ElasticHD