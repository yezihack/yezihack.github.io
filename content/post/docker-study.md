---
title: "Docker 容器学习(三)"
date: 2020-11-04T16:28:01+08:00
lastmod: 2020-11-04T16:28:01+08:00
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

[TOC]

## 入门基础知识
### Docker 三大基础组件
三个重要的概念
1. 仓库(Repository)
2. 镜像(Image)
3. 容器(Container)

实例命令:　`docker run --name db --env MYSQL_ROOT_PASSWORD=sgfoot.com -d mariadb`
1. 先在本机查找有没有 mariadb 镜像, 如果没有,就到 docker 的仓库查找 `mariadb` 镜像, 然后下载到本机
2. 基本 `mariadb` 镜像创建容器 `db`, 提供 `mysql` 服务 
3. 然后通过 `docker ps` 查看正在运行的容器.

### Docker 指令
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

## 容器管理
> dockerID 是由128位组成, 前16位保证唯一. `docker ps --no-trunc`

### 容器运行
基本命令: `docker run`

例`docker run --name db --env MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -d mariadb`

### 查看容器
基本命令: `docker ps`
1. 查看所有的容器: `docker ps -a`
2. 查看已经停止的容器: `docker ps -a`

### 查看容器日志
1. 查看日志: `docker logs ID`
2. 动态查看日志: `docker logs -f ID`

### 容器删除
1. 删除容器: `docker rm ID`
2. 强制删除容器: `docker rm -f ID`

### 查看容器系统资源信息
1. `docker stats ID`
2. `docker top ID`

### 容器内部命令
> 一个容器一个进程 

`docker exec + 容器名 + 容器内部执行命令`

1. 执行内部命令: `docker exec 5ad ps aux` (5ad是ID的前三位)
2. 进入容器内:`docker exec -it 5ad /bin/bash`


## 多容器管理
> Docker 倡导的理念是: "一个容器一个进程", 如果一个服务由多个进程组成, 就需要创建
> 多个容器组成一个系统, 相互分工和配合来对外提供完整的服务.

通过 `--link container` 命令互联容器.

```
docker run --name mdb --env MYSQL_ROOT_PASSWORD=qweqwe -d mariadb 
docker run --name my_wordpress --link mdb:mysql -p 8080:80 -d wordpress
```

### Docker Compose
> Docker 提供一个容器编排工具. Docker Compose. 它允许用户在一个模板(YAML格式)中定义一组相关联的应用容器, 这组容器会根据配置模板中的`--link`等参数, 对启动的优先级自动排序,简单执行一条`docker-compose up`, 就可以把同一个服务中的多个容器依次创建和启动.

### docker-compose 安装
> 通过修改`1.25.0`版本号,使用最新版本

```sh
curl -L https://github.com/docker/compose/releases/download/1.25.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose -h
```

**安装 wordpress 案例**

```sh
mkdir ~/docker-wordpress/
cd ~/docker-wordpress
touch docker-compose.yml
```
docker-compose.yml 文件
```yml
wordpress:
        image: wordpress
        links:
                - mydb:mysql
        ports:
                - 8080:80
mydb:
        image: mariadb
        environment:
                MYSQL_ROOT_PASSWORD: qweqwe
```
1. `wordpress, mydb` 是节点名称
2. `links` 是互联哪个节点.支持多个
3. `image` 指定镜像
4. `ports` 与宿主机映射端口.(8080是宿主机的, 80是docker里的.)
5. `environment` 设置环境变量

#### 启动/停止
> 必须在 docker-compose.yml 文件的当前目录下.

1. `docker-compose up` 非后台运行
2. `docker-compose up -d` 后台运行
3. `docker-compose stop` 停止
3. `docker-compose start` 启动
4. `docker-compose -f a.yml up` 指定`a.yml`文件启动(默认为 docker-compose.yml)

#### 操作指定文件(yml)的容器
1. 状态 `docker-compose -f ~/docker-wordpress/a.yml ps`
2. 停止 `docker-compose -f ~/docker-wordpress/a.yml stop`
3. 启动 `docker-compose -f ~/docker-wordpress/a.yml start`