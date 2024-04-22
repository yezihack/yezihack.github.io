---
title: "MySQL 主从极简教程"
date: 2024-04-22T19:17:40+08:00
lastmod: 2024-04-22T19:17:40+08:00
draft: false
tags: ["mysql", "极简教程"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [1. 什么是 MySQL 主从同步](#1-什么是-mysql-主从同步)
- [2. 主从原理](#2-主从原理)
- [3. 主从配置参数](#3-主从配置参数)
  - [3.1. server\_id](#31-server_id)
  - [3.2. log\_bin](#32-log_bin)
  - [3.3. sync\_binlog](#33-sync_binlog)
  - [3.4. relay\_log](#34-relay_log)
  - [3.5. log\_slave\_updates](#35-log_slave_updates)
  - [3.6. read\_only](#36-read_only)
  - [3.7. sync\_master\_info](#37-sync_master_info)
  - [3.8. sync\_relay\_log](#38-sync_relay_log)
  - [3.9. sync\_relay\_log\_info](#39-sync_relay_log_info)
  - [3.10. expire\_logs\_days](#310-expire_logs_days)
  - [3.11. max\_binlog\_size](#311-max_binlog_size)
  - [3.12. binlog\_format](#312-binlog_format)
  - [3.13. 实例配置](#313-实例配置)
- [4. 主从常用命令](#4-主从常用命令)
- [5. 测试数据](#5-测试数据)
- [6. 主从同步(docker)](#6-主从同步docker)
  - [6.1. 准备](#61-准备)
  - [6.2. 主库](#62-主库)
  - [6.3. 从库](#63-从库)
  - [6.4. 停止主从同步](#64-停止主从同步)
  - [6.5. 删除 mysql](#65-删除-mysql)
- [7. 一主多从同步(docker)](#7-一主多从同步docker)
  - [7.1. 准备](#71-准备)
  - [7.2. 主库](#72-主库)
  - [7.3. 从库01](#73-从库01)
  - [7.4. 从库02](#74-从库02)
  - [7.5. 停止主从同步](#75-停止主从同步)
  - [7.6. 删除 mysql](#76-删除-mysql)
- [8. 主从(主)从部署(docker)](#8-主从主从部署docker)
  - [8.1. 准备](#81-准备)
  - [8.2. 主库](#82-主库)
  - [8.3. 从库01](#83-从库01)
  - [8.4. 从库02](#84-从库02)
  - [8.5. 停止主从同步](#85-停止主从同步)
  - [8.6. 删除 mysql](#86-删除-mysql)
- [9. 主从同步(docker-compose)](#9-主从同步docker-compose)
  - [9.1. 准备](#91-准备)
  - [9.2. 配置](#92-配置)
  - [9.3. 创建 docker-compose](#93-创建-docker-compose)
  - [9.4. 启动服务](#94-启动服务)
  - [9.5. 设置主从同步](#95-设置主从同步)
  - [9.6. 停止主从同步](#96-停止主从同步)
  - [9.7. 重启服务](#97-重启服务)
  - [9.8. 删除 mysql](#98-删除-mysql)
- [10. 主从同步(docker-compose自动)](#10-主从同步docker-compose自动)
  - [10.1. 准备](#101-准备)
  - [10.2. 配置](#102-配置)
  - [10.3. 自动脚本](#103-自动脚本)
  - [10.4. 创建 docker-compose](#104-创建-docker-compose)
  - [10.5. 启动服务](#105-启动服务)
  - [10.6. 查看主库状态](#106-查看主库状态)
  - [10.7. 查看从库状态](#107-查看从库状态)
  - [10.8. 停止主从同步](#108-停止主从同步)
  - [10.9. 重启服务](#109-重启服务)
  - [10.10. 删除 mysql](#1010-删除-mysql)
- [11. mysqldump 导出](#11-mysqldump-导出)
- [12. 参考](#12-参考)

<!-- /TOC -->

## 1. 什么是 MySQL 主从同步

MySQL主从同步，也称作MySQL复制，是数据库管理中的一个核心特性，它允许你从一个MySQL数据库服务器（称为主服务器）复制数据到一个或多个MySQL数据库服务器（称为从服务器）。复制过程是异步的，并且通常实时进行，所以从服务器的数据是对主服务器数据近似实时的镜像。

这项技术主要用于以下几个目的：

- [ ] 数据备份：在从服务器上持有主服务器数据的副本，可以在主服务器故障时避免数据丢失。
- [ ] 故障切换（Failover）：当主服务器宕机时，可以快速切换至从服务器，保证服务的持续可用。
- [ ] 负载均衡：通过从服务器处理读请求，可以减轻主服务器的负载。
- [ ] 数据分析和报告：在从服务器上运行查询，可以减少对主服务器操作产生影响。
- [ ] 地理分布：将数据复制到不同地理位置的服务器上，可以提高用户访问数据时的速度和可靠性。

MySQL主从复制是一种强大的特性，它可以在不同的用例中使用，以提高数据的可用性和可靠性，同时提供系统和数据的可伸缩性。这对于任何规模的企业环境都是不可或缺的。

## 2. 主从原理

- 主服务器上的操作：主服务器将所有的更改操作记录到二进制日志（binary log）中。这些日志是复制的基础，包含了所有可能影响数据的SQL语句。
- 日志传送和读取：从服务器连接到主服务器，并从二进制日志中读取数据更改的事件记录。
- 写入中继日志：从服务器接收到这些事件后，它会将它们写入自己的中继日志（relay log）。
- SQL线程应用更改：从服务器上的SQL线程读取中继日志中的事件，然后在从服务器的数据库上应用它们。

![20240422192037](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240422192037.png)

专业术语：

1. 二进制日志（Binary Log）：记录了导致数据更改的所有语句的日志，主服务器上的每个写操作都会被记录在这里。
2. 中继日志（Relay Log）：主服务器上的二进制日志传递到从服务器之后，从服务器上的中继日志保存了这些事件。
3. I/O线程：这是从服务器上的线程，它连接到主服务器并从二进制日志读取事件，写入中继日志。
4. SQL线程：又一个从服务器上的线程，它读取中继日志中的事件，并在本地数据库中执行这些SQL语句。

## 3. 主从配置参数

### 3.1. server_id

1. server_id是MySQL服务器的唯一标识符。在MySQL复制架构中，每个服务器（包括主服务器和从服务器）必须有一个唯一的server_id。
2. 在这个配置里，server_id被设置为10。这个标识符用来标识和区分不同的MySQL服务器，尤其是在多服务器（如主从复制、群集）环境中。
3. 设定server_id对于开启复制功能是必需的。

样例：

```conf
server_id = 10
```

### 3.2. log_bin

1. log_bin选项启用二进制日志功能，这是MySQL复制的基础。二进制日志记录了数据库更改的所有“事件”，如表的更改（DDL）和行的更改（DML），供其他MySQL服务器（从服务器）使用，以使数据保持同步。
2. mysql-bin为二进制日志文件的前缀。实际的日志文件会添加上索引号，如mysql-bin.000001。
3. 开启二进制日志除了对复制有用之外，它还可以用于数据恢复操作。

样例：

```conf
log_bin = mysql-bin
```

### 3.3. sync_binlog

1. sync_binlog配置项控制着二进制日志写入磁盘的频率。设置为1意味着MySQL会在每次提交事务时都将二进制日志的事件同步写入到磁盘。
2. 这个设置可以增加MySQL操作的耐久性（Durability），因为确保了在发生崩溃时，事务的记录不会丢失。
3. 不过，这种耐久性是以性能为代价的，因为每次事务提交时的磁盘同步操作可能会引入额外的延迟。因此，这是数据安全性与性能之间的一个权衡。
4. 通过将sync_binlog设置为1，它确保了更高水平的数据安全性，尽管可能会稍微影响性能。这通常出现在需要高数据一致性和恢复能力的环境（如金融服务）中。

### 3.4. relay_log

1. 中继日志（relay log）保存了主服务器上二进制日志的事件

样例：

```conf
relay_log = /var/lib/mysql/mysql-relay-bin
```

### 3.5. log_slave_updates

1. 当设置为1时，从服务器上由于复制引起的更改也会被写入从服务器的二进制日志。这在链式复制或双向复制中是必需的。

样例：

```conf
log_slave_updates = 1
```

### 3.6. read_only

1. 这个参数将从服务器设置为只读模式。这意味着只有拥有SUPER权限的用户或具有REPLICATION SLAVE权限的复制线程可以修改数据库。

### 3.7. sync_master_info

1. 当设置为1时，每次事务提交都会同步更新主服务器信息到磁盘中。这有助于保持关于主服务器状态的信息更新，对恢复数据很重要。

### 3.8. sync_relay_log

1. 此参数将导致从服务器在事务提交时同步中继日志到磁盘。这增加了crash-safe能力，但可能对性能有轻微影响。

### 3.9. sync_relay_log_info

1. 与sync_relay_log相似，在事务提交时，从服务器同步中继日志信息到磁盘，这有助于确保复制的可靠性。 

### 3.10. expire_logs_days

1. 定义了mysql清除过期日志的时间

### 3.11. max_binlog_size

1. 如果二进制日志写入的内容超出给定值，日志就会发生滚动。你不能将该变量设置为大于1GB或小于4096字节。 默认值是1GB。

### 3.12. binlog_format

MySQL的  有三种格式，分别是：

1. STATEMENT
    - 优点
      - 日志文件通常较小，因为只记录了执行的SQL语句。
      - 执行SQL语句通常比ROW格式快，因为只执行一次即可影响多行。
    - 缺点
      - 可能会引起数据不一致的问题，特别是在使用存储函数、触发器、LAST_INSERT_ID()和用户自定义函数等特定SQL场景下。不支持行级的复制过滤器。
      - 因为只记录了SQL语句而没有上下文，所以在某些情况下可能难以进行故障排查。
2. ROW
   - 优点
      - 记录了实际更改的行的数据，确保从库与主库的数据一致性，适用于所有复制类型的场景。
      - 减少了因为执行非确定性SQL语句引起的复制问题。
   - 缺点
     - 日志文件可能会很大，因为每一行更改都会被记录下来。
     - 如果频繁更新大量数据，将对磁盘空间和I/O性能造成较大压力。
3. MIXED
   - 优点
     - 默认情况下使用STATEMENT格式，但在某些可能引起数据不一致的情况下，如有必要会自动切换至ROW格式。
     - 结合了STATEMENT和ROW两种模式的优点，旨在优化日志文件大小并保持数据一致性。
   - 缺点
     - 在某些特定情况下不容易确定MySQL是否会切换到ROW格式记录，使得预测binlog的内容和大小变得复杂。

### 3.13. 实例配置

主库配置：

```conf
[mysqld]
server-id = 10
log_bin = /var/lib/mysql/mysql-bin
sync_binlog =1 
```

从库配置：

```conf
[mysqld]
log_bin = mysql-bin
server_id = 100
relay_log = /var/lib/mysql/mysql-relay-bin 
log_slave_updates =1
read_only = 1
sync_master_info = 1
sync_relay_log = 1
sync_relay_log_info = 1
```

## 4. 主从常用命令

```sh
# 开始同步
start slave;

# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G

#  查看 master 服务器状态，File 和 Postion 对应的值要记录下来，下面要用到
show master status;

# 查看有哪些从节点连接到主库上
show slave hosts;

# 进程
show processlist;

# binlog 事件
show binlog events;

# 查看变量
show global variables like '%server%';
show global variables like '%read_only%';
show global variables like '%log_slave_updates%';
show global variables like '%log_bin%';
```

## 5. 测试数据

```sh
CREATE DATABASE `test` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

use test;

CREATE TABLE test (
  id INT AUTO_INCREMENT PRIMARY KEY,
  age INT,
  name VARCHAR(100)
) CHARACTER SET  utf8mb4 COLLATE utf8mb4_general_ci;

INSERT INTO test (age, name) VALUES (25, 'Alice');
INSERT INTO test (age, name) VALUES (30, 'Bob');
INSERT INTO test (age, name) VALUES (22, 'Charlie');
INSERT INTO test (age, name) VALUES (22, 'li');
INSERT INTO test (age, name) VALUES (25, 'lwang');
INSERT INTO test (age, name) VALUES (23, 'zhang');
INSERT INTO test (age, name) VALUES (8, 'pali');

select * from test;

show databases;
```

## 6. 主从同步(docker)

- A 同步 B

### 6.1. 准备

```sh
docker pull mysql:5.7

mkdir -p /data/mysql-data/{master,slave}

# 建一个网络，以便主从容器可以相互通信：
docker network create mysql-replication-net
```

### 6.2. 主库

```sh
# 启动主数据库MySQL容器：
docker run -d \
  --name mysql-master \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_master_password \
  -e MYSQL_DATABASE=mydb \
  -v /data/mysql-data/master:/var/lib/mysql \
  mysql:5.7 \
  --server-id=1 \
  --log-bin=mysql-bin \
  --binlog-ignore-db=mysql \
  --binlog-ignore-db=sys \
  --binlog-ignore-db=infomation_schema \
  --binlog-ignore-db=performance_schema \
  --binlog-format=ROW
```

创建复制帐号

```sh
# 进入容器
docker exec -it mysql-master /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 创建复制帐号
grant replication slave,replication client on *.* to repl@'%' identified by 'your_repl_password';

FLUSH PRIVILEGES;

# 查看帐号列表
SELECT User, Host FROM mysql.user;
```

查看状态

```sh
#  查看 master 服务器状态，File 和 Postion 对应的值要记录下来，下面要用到
SHOW MASTER STATUS;

# 查看从节点
SHOW SLAVE HOSTS;

# 其它
SHOW VARIABLES LIKE '%server_id%';
SHOW VARIABLES LIKE '%log_bin%';
SHOW VARIABLES LIKE '%server_uuid%';
SHOW VARIABLES LIKE '%datadir%';
SHOW PROCESSLIST;
SHOW BINLOG EVENTS;
```

### 6.3. 从库

```sh
# 启动从数据库MySQL容器：
# 服务器唯一id，每台服务器的id必须不同，如果配置其他从机，注意修改id
docker run -d \
  --name mysql-slave \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_slave_password \
  -v /data/mysql-data/slave:/var/lib/mysql \
  mysql:5.7 \
  --server-id=2 \
  --relay-log=relay-bin \
  --log_slave_updates=1 \
  --read_only=1
```

设置同步：

```sh
# 进入容器
docker exec -it mysql-slave /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G
```

### 6.4. 停止主从同步

```sh
# 在从机上执行。功能说明：停止I/O 线程和SQL线程的操作。
stop slave; 

# 在从机上执行。功能说明：用于删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件。
reset slave;

# 在主机上执行。功能说明：删除所有的binglog日志文件，并将日志索引文件清空，重新开始所有新的日志文件。
# 用于第一次进行搭建主从库时，进行主库binlog初始化工作；
reset master;
```

### 6.5. 删除 mysql

```sh
docker rm -f mysql-master
docker rm -f mysql-slave
rm -rf /data/mysql-data/
```

## 7. 一主多从同步(docker)

- A 同步 B
- A 同步 C

### 7.1. 准备

```sh
docker pull mysql:5.7

mkdir -p /data/mysql-data/{master,slave01,slave02}

# 建一个网络，以便主从容器可以相互通信：
docker network create mysql-replication-net
```

### 7.2. 主库

```sh
# 启动主数据库MySQL容器：
docker run -d \
  --name mysql-master \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_master_password \
  -e MYSQL_DATABASE=mydb \
  -v /data/mysql-data/master:/var/lib/mysql \
  mysql:5.7 \
  --server-id=1 \
  --log-bin=mysql-bin \
  --binlog-ignore-db=mysql \
  --binlog-ignore-db=sys \
  --binlog-ignore-db=infomation_schema \
  --binlog-ignore-db=performance_schema \
  --binlog-format=ROW
```

创建复制帐号

```sh
# 进入容器
docker exec -it mysql-master /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 创建复制帐号
grant replication slave,replication client on *.* to repl@'%' identified by 'your_repl_password';

FLUSH PRIVILEGES;

# 查看帐号列表
SELECT User, Host FROM mysql.user;
```

查看状态

```sh
#  查看 master 服务器状态，File 和 Postion 对应的值要记录下来，下面要用到
SHOW MASTER STATUS;

# 查看有哪些从节点连接到主库上
SHOW SLAVE HOSTS;

# 其它
SHOW VARIABLES LIKE '%server_id%';
SHOW VARIABLES LIKE '%log_bin%';
SHOW VARIABLES LIKE '%server_uuid%';
SHOW VARIABLES LIKE '%datadir%';
SHOW PROCESSLIST;
SHOW BINLOG EVENTS;
```

### 7.3. 从库01

```sh
# 启动从数据库MySQL容器：
# 服务器唯一id，每台服务器的id必须不同，如果配置其他从机，注意修改id
docker run -d \
  --name mysql-slave01 \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_slave_password \
  -v /data/mysql-data/slave01:/var/lib/mysql \
  mysql:5.7 \
  --server-id=100 \
  --relay-log=relay-bin \
  --log_slave_updates=1 \
  --read_only=1
```

设置同步：

```sh
# 进入容器
docker exec -it mysql-slave01 /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G
```

### 7.4. 从库02

```sh
# 启动从数据库MySQL容器：
# 服务器唯一id，每台服务器的id必须不同，如果配置其他从机，注意修改id
docker run -d \
  --name mysql-slave02 \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_slave_password \
  -v /data/mysql-data/slave02:/var/lib/mysql \
  mysql:5.7 \
  --server-id=101 \
  --relay-log=relay-bin \
  --log_slave_updates=1 \
  --read_only=1
```

设置同步：

```sh
# 进入容器
docker exec -it mysql-slave02 /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G
```

### 7.5. 停止主从同步

```sh
# 在从机上执行。功能说明：停止I/O 线程和SQL线程的操作。
stop slave; 

# 在从机上执行。功能说明：用于删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件。
reset slave;

# 在主机上执行。功能说明：删除所有的binglog日志文件，并将日志索引文件清空，重新开始所有新的日志文件。
# 用于第一次进行搭建主从库时，进行主库binlog初始化工作；
reset master;
```

### 7.6. 删除 mysql

```sh
docker rm -f mysql-master
docker rm -f mysql-slave01
docker rm -f mysql-slave02
rm -rf /data/mysql-data/
```

## 8. 主从(主)从部署(docker)

- A 同步 B
- B 同步 C （B也即允当从库也允当主库）

### 8.1. 准备

```sh
docker pull mysql:5.7

mkdir -p /data/mysql-data/{master,master-slave01,slave02}

# 建一个网络，以便主从容器可以相互通信：
docker network create mysql-replication-net
```

### 8.2. 主库

```sh
# 启动主数据库MySQL容器：
docker run -d \
  --name mysql-master \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_master_password \
  -v /data/mysql-data/master:/var/lib/mysql \
  mysql:5.7 \
  --server-id=1 \
  --log-bin=mysql-bin \
  --binlog-ignore-db=mysql \
  --binlog-ignore-db=sys \
  --binlog-ignore-db=infomation_schema \
  --binlog-ignore-db=performance_schema \
  --binlog-format=ROW
```

创建复制帐号

```sh
# 进入容器
docker exec -it mysql-master /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 创建复制帐号
grant replication slave,replication client on *.* to repl@'%' identified by 'your_repl_password';

FLUSH PRIVILEGES;

# 查看帐号列表
SELECT User, Host FROM mysql.user;
```

查看状态

```sh
#  查看 master 服务器状态，File 和 Postion 对应的值要记录下来，下面要用到
SHOW MASTER STATUS;

# 查看有哪些从节点连接到主库上
SHOW SLAVE HOSTS;

# 事件
SHOW BINLOG EVENTS;
```

### 8.3. 从库01

- 允当slave02从库的的主库

```sh
# 启动从数据库MySQL容器：
# 服务器唯一id，每台服务器的id必须不同，如果配置其他从机，注意修改id
docker run -d \
  --name mysql-slave01 \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_slave_password \
  -v /data/mysql-data/slave01:/var/lib/mysql \
  mysql:5.7 \
  --server-id=100 \
  --log-bin=mysql-slave-logbin \
  --relay-log=relay-bin \
  --log_slave_updates=1 \
  --read_only=1
```

设置同步：

```sh
# 进入容器
docker exec -it mysql-slave01 /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G

# 从主库的状态
show master status;
```

### 8.4. 从库02

```sh
# 启动从数据库MySQL容器：
# 服务器唯一id，每台服务器的id必须不同，如果配置其他从机，注意修改id
docker run -d \
  --name mysql-slave02 \
  --network mysql-replication-net \
  -e MYSQL_ROOT_PASSWORD=your_slave_password \
  -v /data/mysql-data/slave02:/var/lib/mysql \
  mysql:5.7 \
  --server-id=101 \
  --relay-log=relay-bin \
  --log_slave_updates=1 \
  --read_only=1
```

设置同步：

```sh
# 进入容器
docker exec -it mysql-slave02 /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-slave01',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-slave-logbin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G;
```

### 8.5. 停止主从同步

```sh
# 在从机上执行。功能说明：停止I/O 线程和SQL线程的操作。
stop slave; 

# 在从机上执行。功能说明：用于删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件。
reset slave;

# 在主机上执行。功能说明：删除所有的binglog日志文件，并将日志索引文件清空，重新开始所有新的日志文件。
# 用于第一次进行搭建主从库时，进行主库binlog初始化工作；
reset master;
```

### 8.6. 删除 mysql

```sh
docker rm -f mysql-master
docker rm -f mysql-slave01
docker rm -f mysql-slave02
rm -rf /data/mysql-data/
```

## 9. 主从同步(docker-compose)

- A 同步 B

### 9.1. 准备

```sh
docker pull mysql:5.7

mkdir -p /data/mysql-data/{master,slave}
mkdir -p /data/mysql-compose/
mkdir -p /data/mysql-config/

```

### 9.2. 配置

```sh

# 创建 master config
cat > /data/mysql-config/master.cnf <<EOF
[mysqld]
server_id = 1
log_bin = mysql-bin
sync_binlog = 1
binlog_format=ROW

# 清理策略
expire_logs_days=7
max_binlog_size = 500M

# 不需要写binlog的库
binlog_ignore_db = mysql
binlog_ignore_db = information_schema
binlog_ignore_db = performance_schema
binlog_ignore_db = sys
# 从库不进行同步的库
replicate_ignore_db = mysql
replicate_ignore_db = information_schema
replicate_ignore_db = performance_schema
replicate_ignore_db = sys
EOF

# 创建 slave config
cat > /data/mysql-config/slave.cnf <<EOF
[mysqld]
server_id = 100
relay_log = /var/lib/mysql/mysql-relay-bin
log_slave_updates =1
read_only = 1
sync_master_info = 1
sync_relay_log = 1
sync_relay_log_info = 1
EOF
```

### 9.3. 创建 docker-compose

```sh
cat > /data/mysql-compose/master-slave.yaml <<EOF
version: '3.1'

services:
  # 主库
  mysql-master:
    container_name: mysql-master 
    image: mysql:5.7
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_master_password
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
    volumes:
      - /data/mysql-data/master:/var/lib/mysql
      - /data/mysql-config/master.cnf:/etc/mysql/conf.d/master.cnf
    networks:
      - mysql-master-slave-net
  # 从库
  mysql-slave:
    image: mysql:5.7
    container_name: mysql-slave 
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_slave_password
    volumes:
      - /data/mysql-data/slave:/var/lib/mysql
      - /data/mysql-config/slave.cnf:/etc/mysql/conf.d/slave.cnf
    networks:
      - mysql-master-slave-net
networks:
  mysql-master-slave-net:
    driver: bridge
EOF
```

### 9.4. 启动服务

```sh
# 启动服务
docker-compose -f /data/mysql-compose/master-slave.yaml up -d

# 创建复制帐号

# 进入容器
docker exec -it mysql-master /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 创建复制帐号
grant replication slave,replication client on *.* to repl@'%' identified by 'your_repl_password';

FLUSH PRIVILEGES;

# 查看帐号列表
SELECT User, Host FROM mysql.user;
```

查看状态

```sh
#  查看 master 服务器状态，File 和 Postion 对应的值要记录下来，下面要用到
SHOW MASTER STATUS;

# 查看从节点
SHOW SLAVE HOSTS;
```

### 9.5. 设置主从同步

```sh
# 进入容器
docker exec -it mysql-slave /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 执行以下SQL语句，其中MASTER_LOG_FILE和MASTER_LOG_POS需要根据上一步获得的主库状态进行替换：
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

# 开启主从同步
START SLAVE;
```

查看状态：

```sh
# 查看从库状态
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G
```

### 9.6. 停止主从同步

```sh
# 在从机上执行。功能说明：停止I/O 线程和SQL线程的操作。
stop slave; 

# 在从机上执行。功能说明：用于删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件。
reset slave;

# 在主机上执行。功能说明：删除所有的binglog日志文件，并将日志索引文件清空，重新开始所有新的日志文件。
# 用于第一次进行搭建主从库时，进行主库binlog初始化工作；
reset master;
```

### 9.7. 重启服务

```sh
# 重启
docker-compose -f /data/mysql-compose/master-slave.yaml restart
docker-compose -f /data/mysql-compose/master-slave.yaml up -d  --force-recreate
```

### 9.8. 删除 mysql

```sh
docker-compose -f /data/mysql-compose/master-slave.yaml down -v

rm -rf /data/mysql-data/

mkdir -p /data/mysql-data/{master,slave}
```

## 10. 主从同步(docker-compose自动)

- A 同步 B

### 10.1. 准备

```sh
docker pull mysql:5.7

mkdir -p /data/mysql-data/{master,slave}
mkdir -p /data/mysql-compose/
mkdir -p /data/mysql-config/
mkdir -p /data/mysql-script/

```

### 10.2. 配置

```sh

# 创建 master config
cat > /data/mysql-config/master.cnf <<EOF
[mysqld]
server_id = 1
log_bin = mysql-bin
sync_binlog = 1
binlog_format=ROW

# 清理策略
expire_logs_days=7
max_binlog_size = 500M

# 不需要写binlog的库
binlog_ignore_db = mysql
binlog_ignore_db = information_schema
binlog_ignore_db = performance_schema
binlog_ignore_db = sys
# 从库不进行同步的库
replicate_ignore_db = mysql
replicate_ignore_db = information_schema
replicate_ignore_db = performance_schema
replicate_ignore_db = sys
EOF

# 创建 slave config
cat > /data/mysql-config/slave.cnf <<EOF
[mysqld]
server_id = 100
relay_log = /var/lib/mysql/mysql-relay-bin
log_slave_updates =1
read_only = 1
sync_master_info = 1
sync_relay_log = 1
sync_relay_log_info = 1
EOF
```

### 10.3. 自动脚本

```sh
# 主库
cat <<EOF | tee /data/mysql-script/master.sql
# 创建复制帐号
# grant replication slave,replication client on *.* to repl@'%' identified by 'your_repl_password';

CREATE USER 'repl'@'%' IDENTIFIED BY 'your_repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

FLUSH PRIVILEGES;
EOF

# 从库
cat <<EOF |tee /data/mysql-script/slave.sql 
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='repl',
  MASTER_PASSWORD='your_repl_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1,
  MASTER_CONNECT_RETRY=30;

START SLAVE;
EOF

# 查看
```

### 10.4. 创建 docker-compose

```sh
cat  <<EOF |tee /data/mysql-compose/master-slave.yaml
version: '3.1'

services:
  # 主库
  mysql-master:
    container_name: mysql-master 
    image: mysql:5.7
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_master_password
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
    volumes:
      - /data/mysql-data/master:/var/lib/mysql
      - /data/mysql-config/master.cnf:/etc/mysql/conf.d/master.cnf
      - /data/mysql-script/master.sql:/docker-entrypoint-initdb.d/master.sql
    networks:
      - mysql-master-slave-net
  # 从库
  mysql-slave:
    image: mysql:5.7
    container_name: mysql-slave 
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_slave_password
    volumes:
      - /data/mysql-data/slave:/var/lib/mysql
      - /data/mysql-config/slave.cnf:/etc/mysql/conf.d/slave.cnf
      - /data/mysql-script/slave.sql:/docker-entrypoint-initdb.d/slave.sql
    networks:
      - mysql-master-slave-net
networks:
  mysql-master-slave-net:
    driver: bridge
EOF
```

### 10.5. 启动服务

```sh
# 启动服务
docker-compose -f /data/mysql-compose/master-slave.yaml up -d

```

### 10.6. 查看主库状态

```sh

# 进入容器
docker exec -it mysql-master /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# 查看帐号列表,检查是否有 repl 帐号
SELECT User, Host FROM mysql.user;

#  查看 master 服务器状态
SHOW MASTER STATUS;

# 查看从节点
SHOW SLAVE HOSTS;
```

### 10.7. 查看从库状态

```sh
# 进入容器
docker exec -it mysql-slave /bin/bash

# 登陆 mysql
mysql -u root -p"$MYSQL_ROOT_PASSWORD"
## 检查  SlaveIORunning 和 SlaveSQLRunning 是不是 YES
show slave status\G
```

### 10.8. 停止主从同步

```sh
# 在从机上执行。功能说明：停止I/O 线程和SQL线程的操作。
stop slave; 

# 在从机上执行。功能说明：用于删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件。
reset slave;

# 在主机上执行。功能说明：删除所有的binglog日志文件，并将日志索引文件清空，重新开始所有新的日志文件。
# 用于第一次进行搭建主从库时，进行主库binlog初始化工作；
reset master;
```

### 10.9. 重启服务

```sh
# 重启
docker-compose -f /data/mysql-compose/master-slave.yaml restart
docker-compose -f /data/mysql-compose/master-slave.yaml up -d  --force-recreate
```

### 10.10. 删除 mysql

```sh
docker-compose -f /data/mysql-compose/master-slave.yaml down -v

rm -rf /data/mysql-data/

mkdir -p /data/mysql-data/{master,slave}
```

## 11. mysqldump 导出

- `--master-data`该参数用于将主库的bin-log信息写入到dump文件中，即当前文件名(filename)和位置（position），用于主从复制的搭建

```sh
### 5.1. 加锁导出

## 12. 使用--master-data参数的默认行为是先给所有的表加读锁，然后记录其二进制日志位置，并最终写入到转储文件中,执行完后会自动解锁。
mysqldump --all-databases --master-data > dbdump.db

# 会将change master 语句写入dump文件中
# 在从库导入后，配置主从无需再指定文件名和位置
mysqldump --master-data -uroot -p"$MYSQL_ROOT_PASSWORD" test > dbdump-test.db

# 会将change master 语句写入dump文件中，只不过会被注释掉
# 在从库导入后，配置主从需要指定文件名和位置
mysqldump --master-data=1 -uroot -p"$MYSQL_ROOT_PASSWORD" test > dbdump-test.db
```

## 12. 参考

1. <https://www.cnblogs.com/jhxxb/p/14987112.html>
2. <https://www.didispace.com/installation-guide/middleware/mysql-cluster-2.html>
3. <https://dev.mysql.com/doc/refman/5.7/en/replication-configuration.html>
4. <https://learnku.com/articles/30439>
5. <https://developer.aliyun.com/article/681817>
