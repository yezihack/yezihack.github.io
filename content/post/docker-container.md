---
title: "Docker笔记(四) 容器管理"
date: 2020-11-05T15:28:01+08:00
lastmod: 2020-11-05T15:28:01+08:00
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

<!-- TOC -->

- [.1. 容器管理](#1-%E5%AE%B9%E5%99%A8%E7%AE%A1%E7%90%86)
    - [.1.1. 容器运行](#11-%E5%AE%B9%E5%99%A8%E8%BF%90%E8%A1%8C)
    - [.1.2. 查看容器](#12-%E6%9F%A5%E7%9C%8B%E5%AE%B9%E5%99%A8)
    - [.1.3. 查看容器日志](#13-%E6%9F%A5%E7%9C%8B%E5%AE%B9%E5%99%A8%E6%97%A5%E5%BF%97)
    - [.1.4. 容器删除](#14-%E5%AE%B9%E5%99%A8%E5%88%A0%E9%99%A4)
    - [.1.5. 查看容器系统资源信息](#15-%E6%9F%A5%E7%9C%8B%E5%AE%B9%E5%99%A8%E7%B3%BB%E7%BB%9F%E8%B5%84%E6%BA%90%E4%BF%A1%E6%81%AF)
    - [.1.6. 容器内部命令](#16-%E5%AE%B9%E5%99%A8%E5%86%85%E9%83%A8%E5%91%BD%E4%BB%A4)
    - [.1.7. 复制文件相互](#17-%E5%A4%8D%E5%88%B6%E6%96%87%E4%BB%B6%E7%9B%B8%E4%BA%92)
- [.2. 导入导出容器](#2-%E5%AF%BC%E5%85%A5%E5%AF%BC%E5%87%BA%E5%AE%B9%E5%99%A8)
    - [.2.1. 导出容器](#21-%E5%AF%BC%E5%87%BA%E5%AE%B9%E5%99%A8)
    - [.2.2. 导入容器](#22-%E5%AF%BC%E5%85%A5%E5%AE%B9%E5%99%A8)
- [.3. 重启启动](#3-%E9%87%8D%E5%90%AF%E5%90%AF%E5%8A%A8)
    - [.3.1. 系统开机启动](#31-%E7%B3%BB%E7%BB%9F%E5%BC%80%E6%9C%BA%E5%90%AF%E5%8A%A8)
    - [.3.2. 容器开机启动](#32-%E5%AE%B9%E5%99%A8%E5%BC%80%E6%9C%BA%E5%90%AF%E5%8A%A8)
- [.4. 多容器管理](#4-%E5%A4%9A%E5%AE%B9%E5%99%A8%E7%AE%A1%E7%90%86)
    - [.4.1. Docker Compose](#41-docker-compose)
    - [.4.2. docker-compose 安装](#42-docker-compose-%E5%AE%89%E8%A3%85)
        - [.4.2.1. 启动/停止](#421-%E5%90%AF%E5%8A%A8%E5%81%9C%E6%AD%A2)
        - [.4.2.2. 操作指定文件yml的容器](#422-%E6%93%8D%E4%BD%9C%E6%8C%87%E5%AE%9A%E6%96%87%E4%BB%B6yml%E7%9A%84%E5%AE%B9%E5%99%A8)
- [.5. 参考](#5-%E5%8F%82%E8%80%83)

<!-- /TOC -->

> Docker 倡导的理念是: “一个容器一个进程”
>
> 容器是镜像运行的一个实例
>
> 它们的区别是镜像是一个静态只读文件, 而容器是一个运行时可写的文件层.

## .1. 容器管理

> dockerID 是由128位组成, 前16位保证唯一. `docker ps --no-trunc`

### .1.1. 容器运行

基本命令: `docker run`

例`docker run --name db --env MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -d mariadb`

**常见参数**

> man docker 查看更多命令
>
> man docker-run

| 参数     | 解释                     |
| -------- | ------------------------ |
| `-d`     | 是否在后台运行, 默认为否 |
| `--name` | 指定容器别名             |
| `-v`     | 挂载主机上的文件到容器内 |
| `-e`     | 指定容器内的环境变量     |
| `-t`     | Docker 分配一个伪终端    |
| `-i`     | 让容器的标准输入保持打开 |
|          |                          |

允许用户进行容器内的交互模式.

`docker run -it ubuntu:18.04 /bin/bash`

### .1.2. 查看容器

基本命令: `docker ps`

1. 查看所有的容器: `docker ps -a`
2. 查看已经停止的容器: `docker ps -a`

### .1.3. 查看容器日志

1. 查看日志: `docker logs ID`
2. 动态查看日志: `docker logs -f ID`

### .1.4. 容器删除

1. 删除容器: `docker rm ID`
2. 强制删除容器: `docker rm -f ID`

### .1.5. 查看容器系统资源信息

1. `docker stats ID`
2. `docker top ID`

### .1.6. 容器内部命令

> 一个容器一个进程

`docker exec + 容器名 + 容器内部执行命令`

1. 执行内部命令: `docker exec 5ad ps aux` (5ad是ID的前三位)
2. 进入容器内:`docker exec -it 5ad /bin/bash`

### .1.7. 复制文件(相互)

> docker ps 查看容器, 假设容器ID: 7709d56792f9

从宿主机 复制到 容器里

```sh
docker cp  /home/sgfoot.txt 7709d56792f9:/home/
```

从容器里 复制到 宿主机

```sh
docker cp  7709d56792f9:/home/sgfoot.txt /home/sgfoot.txt 
```

## .2. 导入导出容器

> docker ps 查看容器信息

```sh
CONTAINER ID   IMAGE                        COMMAND                  CREATED       STATUS      PORTS                               NAMES
08a1edd9e89e   redis:5.0.0                  "docker-entrypoint.s…"   12 days ago   Up 5 days   0.0.0.0:6379->6379/tcp              dev_redis
```

### .2.1. 导出容器

方式一: 先提交容器保存为镜像

```sh
#保存容器
docker commit -a "sgfoot" -m "this is test" 08a1edd9e89e test_redis:v1
#导出镜像
docker save -o test_redis.tar test_redis:v1
#或者
docker save test_redis:v1 > test_redis_1.tar
```

方式二: 直接使用`docker export` 保证容器

```sh
docker export -o test_redis_v1.tar 08a1edd9e89e
```

### .2.2. 导入容器

> 载入docker 打包文件只能是镜像, 使用docker run 运行镜像才能成为容器

> 如果需要跨操作系统, 请使用 `-i` 方式

以下方式不能对载入的镜像重命名

```sh
docker load -i test_redis_v1.tar
#或者
docker load < test_redis_v1.tar
```

以下方式可以对载入的镜像重命名

```sh
docker import test_redis_v1.tar sgfoot/redis:v1
```

运行容器

```sh
docker run -it -d --name dev_redis -p 6379:6379 -v $PWD/data:/data sgfoot/redis:v1 --requirepass "123456"
```

## .3. 重启启动

### .3.1. 系统开机启动

```sh
systemctl enable docker
```

### .3.2. 容器开机启动

查看当前容器重启状态？

```bash
docker inspect <容器ID> |grep -A 3 RestartPolicy
```

```sh
"RestartPolicy": {
        "Name": "always",
        "MaximumRetryCount": 0
},
```

RestartPolicy.Name 共四种状态

1. no，默认策略，在容器退出时不重启容器
1. on-failure，在容器非正常退出时（退出状态非0），才会重启容器
1. on-failure:3，在容器非正常退出时重启容器，最多重启3次
1. always，在容器退出时总是重启容器
1. unless-stopped，在容器退出时总是重启容器，但是不考虑在Docker守护进程启动时就已经停止了的容器

运行时加入以下参数即可

```sh
docker run -itd --restart=always --name dev_mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql 
```

已经运行的程序更新参数

```sh
docker update --restart=always <容器ID>
```

## .4. 多容器管理

> Docker 倡导的理念是: "一个容器一个进程", 如果一个服务由多个进程组成, 就需要创建
> 多个容器组成一个系统, 相互分工和配合来对外提供完整的服务.

通过 `--link container` 命令互联容器.

```sh
docker run --name mdb --env MYSQL_ROOT_PASSWORD=qweqwe -d mariadb 
docker run --name my_wordpress --link mdb:mysql -p 8080:80 -d wordpress
```

### .4.1. Docker Compose

> Docker 提供一个容器编排工具. Docker Compose. 它允许用户在一个模板(YAML格式)中定义一组相关联的应用容器, 这组容器会根据配置模板中的`--link`等参数, 对启动的优先级自动排序,简单执行一条`docker-compose up`, 就可以把同一个服务中的多个容器依次创建和启动.

### .4.2. docker-compose 安装

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

#### .4.2.1. 启动/停止

> 必须在 docker-compose.yml 文件的当前目录下.

1. `docker-compose up` 非后台运行
2. `docker-compose up -d` 后台运行
3. `docker-compose stop` 停止
4. `docker-compose start` 启动
5. `docker-compose -f a.yml up` 指定`a.yml`文件启动(默认为 docker-compose.yml)

#### .4.2.2. 操作指定文件(yml)的容器

1. 状态 `docker-compose -f ~/docker-wordpress/a.yml ps`
2. 停止 `docker-compose -f ~/docker-wordpress/a.yml stop`
3. 启动 `docker-compose -f ~/docker-wordpress/a.yml start`

## .5. 参考

1. <https://docs.docker.com/config/containers/start-containers-automatically/>
