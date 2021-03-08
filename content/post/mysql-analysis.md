---
title: "MySQL 性能分析"
date: 2020-06-19T19:13:48+08:00
lastmod: 2020-06-19T19:13:48+08:00
draft: false
tags: ["mysql", "性能分析", "技巧", "工具"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""

---

## MySQL 运行的状态

重点关注以下参数

```
show status like 'Queries';
show status like 'Threads_connected';
show status like 'Threads_running';
show status like 'Connection_errors_max_connections';
```

## MySQL 运行线程 

```
show processlist
```

## 开启慢查询日志

**一、参数查询**

1. slow_query_log 开启慢查询

   ```sh
   mysql> show variables like '%slow_query_log%';
   +---------------------+--------------------------------------+
   | Variable_name       | Value                                |
   +---------------------+--------------------------------------+
   | slow_query_log      | ON                                   |
   | slow_query_log_file | /var/lib/mysql/7709d56792f9-slow.log |
   +---------------------+--------------------------------------+
   2 rows in set (0.00 sec)
   ```

   ```sh
   set global slow_query_log=1;
   ```

2. slow_query_log_file 慢日志存放位置

   ```sh
   set global slow_query_log_file='/data/logs/slow-mysql.log';
   ```

3. long_query_time 表示1秒的SQL就记录

   ```sh
   mysql> show variables like 'long_query_time';
   +-----------------+-----------+
   | Variable_name   | Value     |
   +-----------------+-----------+
   | long_query_time | 10.000000 |
   +-----------------+-----------+
   1 row in set (0.00 sec)
   ```

   ```sh
   mysql> set global long_query_time=1;
   Query OK, 0 rows affected (0.00 sec)
   
   mysql> show global variables like 'long_query_time';
   +-----------------+----------+
   | Variable_name   | Value    |
   +-----------------+----------+
   | long_query_time | 1.000000 |
   +-----------------+----------+
   1 row in set (0.00 sec)
   ```

4. log_output 输出方式

   > 开启慢查询日志后，还要设定log_output变量决定将慢查询日志写到表中还是文件中。log_output由三种值TABLE、FILE和NONE，对应着表、文件和啥都不写。

   ```sh
   mysql> show variables like '%log_output%';
   +---------------+-------+
   | Variable_name | Value |
   +---------------+-------+
   | log_output    | FILE  |
   +---------------+-------+
   1 row in set (0.00 sec)
   ```

   ```sh
   mysql> set global log_output='TABLE,FILE';
   Query OK, 0 rows affected (0.00 sec)
   
   mysql> show variables like '%log_output%';
   +---------------+------------+
   | Variable_name | Value      |
   +---------------+------------+
   | log_output    | FILE,TABLE |
   +---------------+------------+
   1 row in set (0.01 sec)
   ```

5. log_queries_not_using_indexes 记录没有使用索引的SQL语句

   > log_queries_not_using_indexes：动态可修改变量，默认值OFF。如果设为ON，那么不使用索引的SQL会被记录到慢查询日志中。开启后，慢查询日志可能会增长的很快，可以设定 log_throttle_queries_not_using_indexes 变量来限制，其默认值是0，也就是不限制。如果值大于0，如log_throttle_queries_not_using_indexes=100，则每秒钟记录100条不使用索引的SQL语句到慢查询日志。

   ```sh
   mysql> show variables like 'log_queries_not_using_indexes';
   +-------------------------------+-------+
   | Variable_name                 | Value |
   +-------------------------------+-------+
   | log_queries_not_using_indexes | ON    |
   +-------------------------------+-------+
   1 row in set (0.00 sec)
   ```

   ```sh
   set global log_queries_not_using_indexes=1;
   ```

6. slow_queries 查询多少条慢日志

   ```sh
   mysql> show global status like '%Slow_queries%';
   +---------------+-------+
   | Variable_name | Value |
   +---------------+-------+
   | Slow_queries  | 0     |
   +---------------+-------+
   1 row in set (0.03 sec)
   ```

7. 查看所有的参数

   ```sh
   mysql> show variables like '%quer%';
   +----------------------------------------+---------------------------+
   | Variable_name                          | Value                     |
   +----------------------------------------+---------------------------+
   | binlog_rows_query_log_events           | OFF                       |
   | ft_query_expansion_limit               | 20                        |
   | have_query_cache                       | NO                        |
   | log_queries_not_using_indexes          | ON                        |
   | log_throttle_queries_not_using_indexes | 0                         |
   | long_query_time                        | 1.000000                  |
   | query_alloc_block_size                 | 8192                      |
   | query_prealloc_size                    | 8192                      |
   | slow_query_log                         | OFF                       |
   | slow_query_log_file                    | /data/logs/slow-mysql.log |
   +----------------------------------------+---------------------------+
   10 rows in set (0.00 sec)
   ```

   

以上命令行下操作只是当前连接有效，其它无效。需要生效则需要写入配置文件`my.cnf`

**二、修改配置文件**

在配置文件 my.cnf 中的 [mysqld] 添加以下参数

```
[mysqld]
log_output=file
slow_query_log=1
slow_query_log_file = /data/logs/slow-mysql.log
log_queries_not_using_indexes=1
long_query_time = 1
```

**三、配置完后重启MySQL**

```
# 系统安装
systemctl restart mysqld
# 如果是 docker 
docker restart containerID
```

## mysqldumpslow 分析慢日志
1. -s：排序方式，后边接着如下参数
         c：访问次数
        l：锁定时间
        r：返回记录
         t：查询时间
1. al：平均锁定时间
1. ar：平均返回记录书
1. at：平均查询时间
1. -t：返回前面多少条的数据
1. -g：翻遍搭配一个正则表达式，大小写不敏感

得到返回记录集最多的10个SQL。

```sh
mysqldumpslow -s r -t 10 /data/logs/slow-mysql.log
```

得到访问次数最多的10个SQL

```sh
mysqldumpslow -s c -t 10 /data/logs/slow-mysql.log
```

得到按照时间排序的前10条里面含有左连接的查询语句。

```sh
mysqldumpslow -s t -t 10 -g “left join” /data/logs/slow-mysql.log
```

另外建议在使用这些命令时结合 | 和more 使用 ，否则有可能出现刷屏的情况。

```sh
mysqldumpslow -s r -t 20 /data/logs/slow-mysql.log | more
```

## 参数

1. https://juejin.im/post/59d83f1651882545eb54fc7e
2. https://coolshell.cn/articles/1846.html
3. [MySQL慢查询日志总结](https://www.cnblogs.com/kerrycode/p/5593204.html)