---
title: "MySQL 性能优化"
date: 2020-06-19T19:13:48+08:00
lastmod: 2020-06-19T19:13:48+08:00
draft: false
tags: ["mysql", "性能分析", "技巧", "工具"]
categories: ["mysql"]
author: "百里"
comment: true
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

在配置文件 my.cnf 中的 [mysqld] 添加以下参数

```
slow_query_log = 1
slow_query_log_file=/var/lib/mysql/slow-query.log
long_query_time = 1
log_queries_not_using_indexes = 1
```

1. slow_query_log 开启慢查询
2. slow_query_log_file 慢日志存放位置
3. long_query_time 表示1秒的SQL就记录
4. log_queries_not_using_indexes 记录没有使用索引的SQL语句

配置完后重启MySQL

```
systemctl restart mysqld
```

可以在命令行下查看参数状态: 

```
show variables like 'slow_query%';
show variables like 'long_query_time';
```

### mysqldumpslow 工具分析慢日志
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



未完待续...

## 参数

1. https://juejin.im/post/59d83f1651882545eb54fc7e
2. https://coolshell.cn/articles/1846.html