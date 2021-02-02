---
title: "Docker笔记(三) 基础知识"
date: 2020-11-04T15:20:11+08:00
lastmod: 2020-11-04T15:20:11+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
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

## Docker 三大基础组件
三个重要的概念
1. 仓库(Repository)
2. 镜像(Image)
3. 容器(Container)

![image-20201105160413765](http://img.sgfoot.com/b/20201105160421.png?imageslim)

实例命令:　`docker run --name db --env MYSQL_ROOT_PASSWORD=sgfoot.com -d mariadb`
1. 先在本机查找有没有 mariadb 镜像, 如果没有,就到 docker 的仓库查找 `mariadb` 镜像, 然后下载到本机
2. 基本 `mariadb` 镜像创建容器 `db`, 提供 `mysql` 服务 
3. 然后通过 `docker ps` 查看正在运行的容器.

## Docker 指令
1. 基本命令格式如下: 
`docker + command(如run, ps) + 一系列参数(args...)`

如: `docker run --name db --env MYSQL_ROOT_PASSWORD=sgfoot.com -d mariadb`

2. 命令帮助
    `docker command --help`

如: `docker run --help`

3. 命令分四大类
    1. 系统资源设置和全局信息获取: docker info, docker system df 
    2. Docker 仓库查询, 下载操作:docker search, docker pull
    3. Docker 镜像查询,创建,删除操作: docker images, docker build, docker rmi
    4. Docker 容器查询,创建,开启,停止,删除,详情操作:docker ps, docker run, docker start, docker stop, docker rm, docker inspect
    5. Docker 调试: docker logs(日志), docker stats(运行状态) 
    

其它: 删除所有停止运行的容器 `docker rm $(docker ps -a -q)` (危险操作)