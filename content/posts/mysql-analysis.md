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

## percona-toolkit  分析慢日志

1. 下载

   ```sh
   wget https://www.percona.com/downloads/percona-toolkit/3.2.1/binary/redhat/7/x86_64/percona-toolkit-3.2.1-1.el7.x86_64.rpm
   ```

2. 依赖包

   ```sh
   [root@xxx ~]# yum install perl-DBI.x86_64
   [root@xxx ~]# yum install perl-DBD-MySQL.x86_64
   [root@xxx ~]# yum install perl-IO-Socket-SSL.noarch
   [root@xxx ~]# yum install perl-Digest-MD5.x86_64
   [root@xxx ~]# yum install perl-TermReadKey.x86_64
   ```

3. 安装

   ```sh
   rpm -iv percona-toolkit-3.2.1-1.el7.x86_64.rpm
   ```

4. 位置

   ```sh
   whereis pt-query-digest
   ```

5. 分析慢日志

   > 回看上面如何开启慢日志

   ```sh
   pt-query-digest mysql-slow.log
   ```

   

## mysqlslap 基准压测

**参考说明：**

1. `--concurrency` 并发数,可指定多个值，以逗号
2. `--iterations` 运行次数
3. `--auto-generate-sql` 自动生成测试表和数据
4. `--auto-generate-sql-load-type` 测试语句的类型,read，key，write，update和mixed(默认)。
5. `--auto-generate-sql-add-auto-increment` 代表对生成的表自动添加auto_increment列，从5.1.18版本开始支持。
6. `--engine=engine_name` 代表要测试的引擎，可以有多个，用分隔符隔开。例如：--engines=myisam,innodb。
7. `--number-of-queries` 总的测试查询次数(并发客户数×每客户查询次数)
8. `--query 自己的SQL`　　　　　　　　  脚本执行测试
9. `--only-print` 　　　　　　　　　　    如果只想打印看看SQL语句是什么，可以用这个选项



**运行命令**

1. 测试单SQL	

   ```mysql
   mysqlslap -a -uroot -p123456
   ```

2. 测试多并发

   ```mysql
   mysqlslap -a -c 100 -uroot -p123456 -h 127.0.0.1
   ```

3. 模拟不同并发，并打印错误信息

   ```mysql
   # 执行一次测试，分别50和100个并发，执行1000次总查询：
   mysqlslap -a --concurrency=50,100 --number-of-queries 1000 --debug-info -uroot -p12345
   ```

4. 更复杂的测试

    ```mysql
    mysqlslap -h 127.0.0.1 -u root -p123456 --concurrency=100 --iterations=1 --auto-generate-sql --auto-generate-sql-load-type=mixed --auto-generate-sql-add-autoincrement --engine=innodb --number-of-queries=5000
    # -p密码 密码与p没有空格
    ```

5. 查看SQL

   ```mysql
   mysqlslap -a --concurrency=50,100 --number-of-queries 1000 --iterations=5 --debug-info -uroot -p123456 -h 127.0.0.1 --only-print
   ```

**结果分析：**

```
Benchmark
	Average number of seconds to run all queries: 0.160 seconds  # 平均响应时间
	Minimum number of seconds to run all queries: 0.156 seconds	 # 最小响应时间
	Maximum number of seconds to run all queries: 0.166 seconds  # 最大响应时间
	Number of clients running queries: 50 	 # 模拟客户端数量
	Average number of queries per client: 20 # 每个客户端的平均查询SQL条数



User time 0.24, System time 0.37 # 用户响应时间，系统响应时间
Maximum resident set size 14568, Integral resident set size 0
Non-physical pagefaults 8068, Physical pagefaults 0, Swaps 0
Blocks in 0 out 0, Messages in 0 out 0, Signals 0
Voluntary context switches 19587, Involuntary context switches 723
```





## 参考

1. https://juejin.im/post/59d83f1651882545eb54fc7e
2. https://coolshell.cn/articles/1846.html
3. [MySQL慢查询日志总结](https://www.cnblogs.com/kerrycode/p/5593204.html)