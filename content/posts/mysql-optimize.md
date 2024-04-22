---
title: "MySQL 性能优化"
date: 2020-06-19T20:23:17+08:00
lastmod: 2020-06-19T20:23:17+08:00
draft: false
tags: ["mysql", "优化", "性能分析"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 1. MySQL 并发参数调整

### 1.1. max_connections 参数

该参数设置mysql连接最大数量.
max_connections 默认151个连接.

```sh
show variables like 'max_connections'
```

服务器性能优时可以调节这个参数, 范围: 500~1000

**注**
当连接过大时, 查看 `Connection_errors_max_connections` 参数是否大于0 , 表示连接过多, 错误连接

```sh
show status like 'Connection_errors_max_connections';
```

## 2. back_log 参数

> 积压栈的大小.

也就是说当 mysql 连接超过 `max_connections` 连接数时, 如果`back_log`大小为0时, mysql将授予连接资源. 如果`back_log`大于零时,则接受多余的请求, 以等待某一连接释放.而等待的连接数大于`back_log`数时则也将不授予连接资源. 

`back_log`默认大小: 50 + (max_connections/5), 最大可设置为900

```sh
show variables like 'back_log'
```

## 3. table_open_cache

该参数用来控制所有SQL语句执行线程可打开表缓存的数量.

最大数量设定: max_connections * N

```sh
show variables like 'table_open_cache'
```

## 4. thread_cache_size

该参数可控制 mysql缓存客户服务线程的数量, 相当于mysql的线程池, 也备重用.

```sh
show variables like 'thread_cache_size'
```

## 5. innodb_lock_wait_timeout

该参数是用来设置innoDB事务等待行锁的时间, 默认值:50ms. 
如果并发要求高时: 可以设置小一点, 以避占用时间过长.

```sh
show variables like 'innodb_lock_wait_timeout'
```

## 6. InnoDB 内存优化

> innodb用了一块内存区做IO缓存池, 该缓存池不仅用来缓存innodb的索引块, 而且也用来缓存innodb的数据块.

### 6.1. innodb_buffer_pool_size

该参数决定了innodb存储引擎**表数据和索引数据**的最大缓存区大小.在保证操作系统及其它程序有足够的内存可用的情况下, innodb_buffer_pool_size的值越大,缓存命中率越高, 访问innodb表需要的磁盘IO就越小, 性能也越高.

```sh
show variables like 'innodb_buffer_pool_size'

# 对 my.cnf 设置
innodb_buffer_pool_size = 2147483648  #设置2G
或
innodb_buffer_pool_size = 2G  #设置2G
或
innodb_buffer_pool_size = 500M  #设置500M

# 命令行动态设置
set global innodb_buffer_pool_size = 2097152; # 单位kb
```

### 6.2. innodb_log_buffer_size

决定innodb重做日志缓存的大小, 对于可能产生大量更新记录的大事务, 增加innodb_log_buffer_size的大小, 可以避免innodb在事务提交前就执行不必要的日志写入磁盘操作.

```sh
show variables like 'innodb_log_buffer_size'
innodb_log_buffer_size=32M
```

## 7. 常用SQL技巧

### 7.1. SQL执行顺序

编写顺序

执行顺序

> from->on->join->where->group by->having->select field->order by-> limit

![mysql](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200619200641.png?imageslim)

### 7.2. 正则查询

mysql支持的正则的符号

实例

```sh
select * from student where name regexp '^abc' # 匹配abc开头的
select * from student where name regexp '[abc]' # 匹配方括号里任意一个字符
```

## 8. my.cnf

```sh
cat > my.cnf <<EOF
[mysqld]
skip-name-resolve
port=3306
basedir=/var/lib/mysql
datadir=/var/lib/mysql/mysqldb
max_connections=2000
max_connect_errors=100
character-set-server=utf8mb4
default-storage-engine=INNODB
# default_authentication_plugin=mysql_native_password
authentication_policy = 'DEFAULT'
lower_case_table_names = 1
interactive_timeout = 1800
wait_timeout = 1800
lock_wait_timeout = 3600
tmp_table_size = 64M
max_heap_table_size = 64M
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
lc-messages-dir = /usr/share/mysql/

# InnoDB 优化配置
innodb_buffer_pool_size = 2G                # InnoDB 缓冲池大小，根据系统内存大小适当调整，推荐为总内存的 50%-80%
innodb_flush_log_at_trx_commit = 2             # 提高性能的方式是将此值设置为 2 或 0，在安全性方面的牺牲是较少的
innodb_log_buffer_size = 128M                   # InnoDB 日志缓冲区大小
innodb_log_file_size = 512M                    # InnoDB 日志文件大小，根据实际情况进行适当调整
innodb_file_per_table = 1                      # 每个表单独创建一个独立的表空间文件，方便管理和维护

# 日志记录
general_log = 0                                # 开启一般查询日志
general_log_file = /var/log/mysql/general.log    # 一般查询日志文件的路径，请根据实际情况调整
log_error = /var/log/mysql/error.log     # 错误日志文件的路径，请根据实际情况调整

# 慢查询记录
slow_query_log = 1                             # 开启慢查询日志
slow_query_log_file = /var/log/mysql/slow.log    # 慢查询日志文件的路径，请根据实际情况调整
long_query_time = 2                            # 查询时间超过该值将被记录到慢查询日志中，单位为秒

# 查询优化
performance_schema = 0
optimizer_search_depth = 5
optimizer_switch = index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_intersection=on

[mysql]
default-character-set=utf8mb4
[client]
port=3306
default-character-set=utf8mb4
EOF
```
