---
title: "Docker笔记(二) 安装"
date: 2020-10-15T17:12:16+08:00
lastmod: 2020-10-15T17:12:16+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 适合于 CentOS 系统

## docker 一键安装

```shell
curl -sSL https://cdn.jsdelivr.net/gh/yezihack/assets/sh/docker-install.sh |sudo sh
```

```sh
#!/bin/bash
################
# CentOS 一键安装
# From: sgfoot.com
#################

# 卸载旧版本
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine


# 设置仓库
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

# 使用阿里源地址
sudo yum-config-manager \
    --add-repo \
    http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo


# 安装 Docker Engine
sudo yum install docker-ce docker-ce-cli containerd.io -y

# 启动
systemctl start docker

# 测试一下
sudo docker run hello-world

echo "安装完毕"
```



## docker-compose 安装

> 　docker-compose 是负责 docker 编排使用的

```shell
curl -L https://github.com/docker/compose/releases/download/1.25.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose

docker-compose -h
```

## docker 加速

推荐使用阿里云 docker 加速

使用流程： https://cr.console.aliyun.com/cn-hangzhou/instances/repositories

找到镜像加速器

![image-20200826111636483](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200826111637.png?imageslim)

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