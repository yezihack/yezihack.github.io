---
title: "Docker笔记(六) 安装phpmyadin"
date: 2021-02-03T14:47:10+08:00
lastmod: 2021-02-03T14:47:10+08:00
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

> 开发项目涉及到 MySQL时就需要MySQL管理工具, phpmyadmin 是一款网页功能强大的免费软件。



## 安装 MySQL

命令方式：

```sh
docker run -itd --name dev_mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql
```

docker-compose.yml 方式：

```sh
version: '3'

services:
  mysql:
    image: "mysql"
    restart: always
    container_name: "mysqld"
    environment:
      MYSQL_ROOT_PASSWORD: "123456"
    ports:
      - "3306:3306"
```



## 安装 phpmyadmin

> 管理 MySQL 的软件

### 修改 MySQL 配置

```sh
docker exec -it <dockerID> /bin/bash # 进入容器
mysql -u root -p # 进入 mysql

# 将root账号（可替换成其他）的host修改为%
update mysql.user set host = '%' where user = 'root';
# 查看修改结果
select host, user from user;
# 刷新加密方式
flush privileges;
```



### 安装 phpmyadmin

命令行方式：

```sh
docker run -d --name myadmin \
-e PMA_HOST=$(ip route show | grep docker0 | awk '{print $9}') \
-e PMA_PORT=3306 \
-p 3380:80 \
phpmyadmin/phpmyadmin
```

1. `PMA_HOST` 连接MYSQL的host
2. `PMA_PORT` 连接MYSQL的端口号
3. `3380:80` 3380为宿主机的，80为docker内部的端口号



## docker-compose 套件

> [安装docker-compose](https://www.sgfoot.com/docker-install.html#docker-compose-%E5%AE%89%E8%A3%85)

vim mysql-phpmyadmin.yml

```yaml
version: '3.2'

services:
   db:
      image: mysql:8.0
      container_name: appsDB
      restart: always
      ports:
       - '6603:3306'
      environment:
        MYSQL_ROOT_PASSWORD: helloworld

   app:
      depends_on:
       - db
      image: phpmyadmin/phpmyadmin
      container_name: phpmyadmin
      restart: always
      ports:
       - '8080:80'
      environment:
        PMA_HOST: db
```



### 启动 

```sh
docker-compose -f mysql-phpmyadmin.yml up -d 
```

### 查看 

```sh
docker ps
```

### 停止

```sh
docker-composer -f mysql-phpmyadmin.yml stop
```

### 开启

```sh
docker-composer -f mysql-phpmyadmin.yml start
```


![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)