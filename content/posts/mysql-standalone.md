---
title: "MySQL v5.7.44 单机部署"
date: 2024-08-30T11:33:30+08:00
lastmod: 2024-08-30T11:33:30+08:00
draft: false
tags: ["mysql", "mysql5.7", "k8s"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 目录

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [1. 目录](#1-目录)
- [2. 介绍](#2-介绍)
- [3. Docker](#3-docker)
- [4. Docker-Compose](#4-docker-compose)
- [5. 二进制包](#5-二进制包)
  - [5.1. 下载及创建目录](#51-下载及创建目录)
  - [5.2. 配置环境变量](#52-配置环境变量)
  - [5.3. 配置my.cnf](#53-配置mycnf)
  - [5.4. 初使化并启动mysql](#54-初使化并启动mysql)
- [6. k8s Deployment](#6-k8s-deployment)
- [7. 参考链接](#7-参考链接)

<!-- /TOC -->

## 2. 介绍

MySQL 是一个开源的关系型数据库管理系统，广泛用于各种应用程序中。它支持多种存储引擎，包括 InnoDB、MyISAM 等，并且具有高性能、可靠性和易用性等特点。MySQL 可以在多种操作系统上运行，包括 Windows、Linux 和 macOS 等。

本次采用多种方式部署 MySQL，包括 Docker、Docker-Compose、二进制包、k8s-Deployment。

## 3. Docker

```bash
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=your_power_password -v /data/mysql:/var/lib/mysql mysql:5.7.44
```

## 4. Docker-Compose

```sh
cat > docker-compose.yml <<EOF
version: '3'
services:
  mysql:
    image: mysql:5.7.44
    container_name: mysql
    ports:
      - 3306:3306
    environment:
      - MYSQL_ROOT_PASSWORD=your_power_password
    volumes:
      - /data/mysql:/var/lib/mysql
EOF

docker-compose up -d
```

## 5. 二进制包

- 官方下载地址：<https://downloads.mysql.com/archives/community/>

![mysql.5.7.44](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240830113958.png)

### 5.1. 下载及创建目录

```bash
# 下载二进制包
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.44-linux-glibc2.12-x86_64.tar.gz

# 解压
tar -xvf mysql-5.7.44-linux-glibc2.12-x86_64.tar.gz -C /usr/local

# 重命名
mv /usr/local/mysql-5.7.44-linux-glibc2.12-x86_64 /usr/local/mysql

# 创建用户和组
groupadd mysql
useradd -r -g mysql mysql

# 创建数据目录
mkdir -p /data/mysql/{data,logs}
touch /data/mysql/logs/mysql.log
touch /data/mysql/logs/slow.log
touch /data/mysql/logs/general.log

# 授权
chown -R mysql:mysql /usr/local/mysql
chown -R mysql:mysql /data/mysql
chmod -R 755 /data/mysql
```

### 5.2. 配置环境变量

```sh
echo "配置环境变量"
cat >> /etc/profile.d/mysql.sh <<EOF
export PATH=\$PATH:/usr/local/mysql/bin
EOF
source /etc/profile
```

### 5.3. 配置my.cnf

```sh
cat > /etc/my.cnf <<EOF
[client]
port = 3306
socket =/data/mysql/mysql.sock

[mysqld]
port=3306
basedir=/usr/local/mysql
datadir=/data/mysql/data
socket=/data/mysql/mysql.sock
pid-file = /data/mysql/mysql.pid

symbolic-links=0
explicit_defaults_for_timestamp=1

# 慢查询记录
slow_query_log = 1                             
slow_query_log_file = /data/mysql/logs/slow.log  
long_query_time = 10                                # 查询时间超过该值将被记录到慢查询日志中，单位为秒
log_queries_not_using_indexes=1             # 记录没有使用索引的SQL

# 日志记录
general_log = 1                                 # 开启一般查询日志
general_log_file =/data/mysql/logs/general.log   # 一般查询日志文件的路径，请根据实际情况调整
log-error=/data/mysql/logs/mysql.log

# 引用配置文件
!includedir /etc/my.cnf.d
EOF
```

### 5.4. 初使化并启动mysql

```sh
# 初始化
/usr/local/mysql/bin/mysqld --initialize --user=mysql

# 添加 systemd 并启动服务
cp /usr/local/mysql/support-files/mysql.server /etc/init.d/mysqld
chkconfig --add mysqld
systemctl restart mysqld

# 登录， 在 /data/mysql/logs/mysql.log 中找到临时密码
mysql -u root -p

# 修改密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'xxxxx';

# 或使用以下命令修改密码
TEMP_PASSWORD=$(grep 'temporary password' /data/mysql/logs/mysql.log | awk '{print $NF}')
# 使用提取的临时密码来更改 MySQL root 用户的密码并刷新权限
mysql -u root --connect-expired-password -p"$TEMP_PASSWORD" -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_PASSWORD'; FLUSH PRIVILEGES;"

# 尝试使用新的密码登陆
mysql -u root -p
```

## 6. k8s Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: mysql
  labels:
    app: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:5.7.44
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "your_power_password"
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        - name: mysql-config
          mountPath: /etc/mysql/conf.d
      volumes:
      - name: mysql-data
        persistentVolumeClaim:
          claimName: mysql-pvc
      - name: mysql-config
        configMap:
          name: mysql-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: mysql
data:
  my.cnf: |
    [client]
    port = 3306
    socket =/var/lib/mysql/mysql.sock

    [mysqld]
    port=3306
    basedir=/usr/local/mysql
    datadir=/var/lib/mysql
    socket=/var/lib/mysql/mysql.sock
    pid-file = /var/lib/mysql/mysql.pid

    symbolic-links=0
    explicit_defaults_for_timestamp=1

    # 慢查询记录
    slow_query_log = 1                             
    slow_query_log_file = /var/lib/mysql/logs/slow.log  
    long_query_time = 10                                # 查询时间超过该值将被记录到慢查询日志中，单位为秒
    log_queries_not_using_indexes=1             # 记录没有使用索引的SQL

    # 日志记录
    general_log = 1                                 # 开启一般查询日志
    general_log_file =/var/lib/mysql/logs/general.log   # 一般查询日志文件的路径，请根据实际情况调整
    log-error=/var/lib/mysql/logs/mysql.log
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: mysql
spec:
  storageClassName: nfs # 填写 stroageClass 名称
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## 7. 参考链接

- [MySQL 5.7.44 下载](https://dev.mysql.com/downloads/mysql/5.7.html#downloads)
- [MySQL 5.7.44 安装](https://dev.mysql.com/doc/refman/5.7/en/binary-installation.html)
- [MySQL 5.7.44 配置](https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html)