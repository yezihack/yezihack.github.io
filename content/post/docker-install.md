---
title: "Docker笔记(二) 安装"
date: 2020-10-15T17:12:16+08:00
lastmod: 2020-10-15T17:12:16+08:00
draft: false
tags: ["docker", "教程"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 适合于 CentOS 系统

## 一键安装
```shell
curl -sSL http://img.sgfoot.com/sh/docker-install.sh |sh
```



## docker 加速

推荐使用阿里云 docker 加速

使用流程： https://cr.console.aliyun.com/cn-hangzhou/instances/repositories

找到镜像加速器

![image-20200826111636483](http://img.sgfoot.com/b/20200826111637.png?imageslim)

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://sziho4ql.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```