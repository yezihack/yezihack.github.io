---
title: "MySQL 操作手册"
date: 2024-04-22T19:43:28+08:00
lastmod: 2024-04-22T19:43:28+08:00
draft: false
tags: ["mysql", "极简教程"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---


## 1. 查看系统信息

```sh
# 查看 MySQL 版本信息
SELECT VERSION();

# 查看 MySQL 服务器启动时间
SHOW GLOBAL STATUS LIKE 'Uptime';

# 查看当前连接的用户和主机信息
SELECT USER(), CURRENT_USER(), @@hostname;

# 查看帐号列表
SELECT User, Host FROM mysql.user;

# 查看 MySQL 数据库中当前可用的存储引擎
SHOW ENGINES;

# 检查 MySQL 服务器允许的最大连接数 
SHOW VARIABLES LIKE 'max_connections';

# 查看 MySQL 服务器当前运行的线程数
SHOW GLOBAL STATUS LIKE 'Threads_running';

# 查看 MySQL 当前的连接数
SHOW STATUS WHERE `variable_name` = 'Threads_connected';
## 或
SELECT COUNT(*) FROM information_schema.processlist;

# 查看 MySQL 数据库中当前正在运行的进程
SHOW PROCESSLIST;

# MySQL 服务器监听的网络地址
SHOW GLOBAL VARIABLES LIKE 'bind_address';

# MySQL服务器监听的TCP/IP端口号
SHOW GLOBAL VARIABLES LIKE 'port';
```

## 2. 库操作

```sh
# 查看当前数据库默认的字符集
SHOW VARIABLES LIKE 'character_set_database';

# 创建库名
CREATE DATABASE `库名` CHARACTER SET utf8 COLLATE utf8_general_ci;
CREATE DATABASE `库名` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# 显示所有的库名
show databases;

# 选择库名
USE mydb;

# 删除库名
DROP DATABASE person;

# 查看库大小
SELECT 
  table_schema as 'database',
  table_name as 'table_name',
  table_rows as 'table_rows',
  truncate(data_length/1024/1024, 2) as 'data_cap(MB)',
  truncate(index_length/1024/1024, 2) as 'index_cap(MB)',
  truncate(DATA_FREE/1024/1024, 2) as 'shard_cap(MB)'
from information_schema.tables
where table_schema='<数据库名>'
order by data_length desc, index_length desc;

```

## 3. 表操作

```sh
# 显示所有的表
show tables;

# 检查表编码：
SHOW CREATE TABLE person;

# 创建名为 user 的表，包含 ID（主键）、age、name 字段
CREATE TABLE 表名 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  age INT,
  name VARCHAR(100)
) CHARACTER SET  utf8mb4 COLLATE utf8mb4_general_ci;

# 插入 5 条数据
INSERT INTO 表名 (age, name) VALUES (25, 'Alice');
INSERT INTO 表名 (age, name) VALUES (30, 'Bob');
INSERT INTO 表名 (age, name) VALUES (22, 'Charlie');

# 更新
update test set name='ok' where id = 3;

# 删除数据
delete from user where id=1;

```

## 4. 容量

```sh
# 查看 MySQL「指定库」中「所有表」的容量大小
SELECT
  table_schema as 'database',
  table_name as 'table_name',
  table_rows as 'table_rows',
  truncate(data_length/1024/1024, 2) as 'data_cap(MB)',
  truncate(index_length/1024/1024, 2) as 'index_cap(MB)',
  truncate(DATA_FREE/1024/1024, 2) as 'shard_cap(MB)'
from 
  information_schema.tables
where 
  table_schema='<数据库名>'
order by 
  data_length desc, index_length desc;

# 查看 MySQL「指定库」中「指定表」的容量大小
SELECT
  table_schema as 'database',
  table_name as 'table_name',
  table_rows as 'table_rows',
  truncate(data_length/1024/1024, 2) as 'data_cap(MB)',
  truncate(index_length/1024/1024, 2) as 'index_cap(MB)',
  truncate(DATA_FREE/1024/1024, 2) as 'shard_cap(MB)'
from 
  information_schema.tables
where 
  table_schema='<数据库名>' and table_name='<表名>'
order by 
  data_length desc, index_length desc;

# 查看 MySQL 数据库中，容量排名前 10 的表
USE information_schema;
SELECT 
    table_schema as 'database',
    table_name as 'table_name',
    table_rows as 'table_rows',
    ENGINE as 'engine',
    truncate(data_length/1024/1024, 2) as 'data_cap(MB)',
    truncate(index_length/1024/1024, 2) as 'index_cap(MB)',
    truncate(DATA_FREE/1024/1024, 2) as 'shard_cap(MB)'
from  tables 
order by table_rows desc limit 10;

# 查看 MySQL「指定库」中，容量排名前 10 的表
USE information_schema;
SELECT 
  table_schema as 'database',
  table_name as 'table_name',
  table_rows as 'table_rows',
  truncate(data_length/1024/1024, 2) as 'data_cap(MB)',
  truncate(index_length/1024/1024, 2) as 'index_cap(MB)',
  truncate(DATA_FREE/1024/1024, 2) as 'shard_cap(MB)'
from  tables 
where 
  table_schema='<数据库名>' 
order by table_rows desc limit 10;
```

## 5. 备份与恢复

```sh
# 备份整个数据库，即所有的库
mysqldump -u 用户名 -p"密码" --port=3306 --host=127.0.0.1 --all-databases > backup_file.sql

# 备份某一个库
mysqldump -u 用户名 -p"密码" 数据库名 > backup_file.sql

# 备份多个库
mysqldump -u 用户名 -p"密码" 数据库名1 数据库名2 > backup_file.sql

# 备份某库中的某表
mysqldump -u 用户名 -p"密码" 数据库名 表名 > backup_file.sql
mysqldump -u 用户名 -p"密码" 数据库名 --tables  表名1 表名2> backup_file.sql

# 只导出表结构
mysqldump -u 用户名 -p"密码" --host=127.0.0.1 --port=3306 -d 表名 > backup_file.sql

# 只导出数据
mysqldump -u 用户名 -p"密码" --host=127.0.0.1 --port=3306 -t 表名 > backup_file.sql

# 恢复数据库1
mysql -u root -p 库名 < backup_file.sql

# 恢复数据库2
mysql>source /opt/backup_file.sql

```

## 6. 锁

```sh
# 获取读锁
## 刷新表意味着MySQL会写入所有挂起的写操作到磁盘，并清理缓存（如查询缓存）。这对于确保数据的一致性非常有用，特别是在备份数据库之前。
## 刷新操作之后，命令为所有表加上全局的读锁定。这个锁定阻止了所有写操作（如INSERT、UPDATE、DELETE等），但允许读操作（如SELECT）继续执行。
FLUSH TABLES WITH READ LOCK;

# 解锁
mysql> UNLOCK TABLES;
```

## 7. 权限

```sh
# 查看帐号列表
SELECT User, Host FROM mysql.user;

# 创建用户名称
CREATE USER '用户名'@'localhost' IDENTIFIED BY '密码';
CREATE USER '用户名'@'%' IDENTIFIED BY '密码';

# 授权某库所有的权限
GRANT ALL PRIVILEGES ON 库名1.* TO '用户名'@'%';
GRANT ALL PRIVILEGES ON 库名2.* TO '用户名'@'%';

# 刷新权限使其生效
FLUSH PRIVILEGES;
```

## 8. 主从集群

```sh
# 查看主库状态
show master status;

# 查看主库连接从库列表信息
show slave hosts;

# 查看从库同步状态
show slave status \G;

# 开始主从同步
CHANGE MASTER TO master_host = 'master_host',
    master_user = 'root',
    master_password = 'your_repl_password',
    master_port = 3306,
    master_log_file = 'mysql-0-bin.000005',
    master_log_pos = 154,
    master_connect_retry = 30;

# 开启同步
start slave;

```
