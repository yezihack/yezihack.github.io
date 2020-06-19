---
title: "MySQL 性能优化"
date: 2020-06-19T20:23:17+08:00
lastmod: 2020-06-19T20:23:17+08:00
draft: false
tags: ["mysql", "优化", "性能分析"]
categories: ["mysql"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""
---

## MySQL 并发参数调整

### max_connections 参数
该参数设置mysql连接最大数量.
max_connections 默认151个连接.
```
show variables like 'max_connections'
```
服务器性能优时可以调节这个参数, 范围: 500~1000

**注**
当连接过大时, 查看 `Connection_errors_max_connections` 参数是否大于0 , 表示连接过多, 错误连接

```
show status like 'Connection_errors_max_connections';
```



## back_log 参数
> 积压栈的大小.

也就是说当 mysql 连接超过 `max_connections` 连接数时, 如果`back_log`大小为0时, mysql将授予连接资源. 如果`back_log`大于零时,则接受多余的请求, 以等待某一连接释放.而等待的连接数大于`back_log`数时则也将不授予连接资源. 

`back_log`默认大小: 50 + (max_connections/5), 最大可设置为900
```
show variables like 'back_log'
```
## table_open_cache

该参数用来控制所有SQL语句执行线程可打开表缓存的数量.

最大数量设定: max_connections * N
```
show variables like 'table_open_cache'
```

## thread_cache_size
该参数可控制 mysql缓存客户服务线程的数量, 相当于mysql的线程池, 也备重用.
```
show variables like 'thread_cache_size'
```

## innodb_lock_wait_timeout
该参数是用来设置innoDB事务等待行锁的时间, 默认值:50ms. 
如果并发要求高时: 可以设置小一点, 以避占用时间过长.

```
show variables like 'innodb_lock_wait_timeout'
```

## InnoDB 内存优化
> innodb用了一块内存区做IO缓存池, 该缓存池不仅用来缓存innodb的索引块, 而且也用来缓存innodb的数据块.

### innodb_buffer_pool_size
该参数决定了innodb存储引擎**表数据和索引数据**的最大缓存区大小.在保证操作系统及其它程序有足够的内存可用的情况下, innodb_buffer_pool_size的值越大,缓存命中率越高, 访问innodb表需要的磁盘IO就越小, 性能也越高.

```
show variables like 'innodb_buffer_pool_size'
innodb_buffer_pool_size=2048M
```

### innodb_log_buffer_size
决定innodb重做日志缓存的大小, 对于可能产生大量更新记录的大事务, 增加innodb_log_buffer_size的大小, 可以避免innodb在事务提交前就执行不必要的日志写入磁盘操作.
```
show variables like 'innodb_log_buffer_size'
innodb_log_buffer_size=32M
```

## 常用SQL技巧

### SQL执行顺序

编写顺序

![](../../../../../../../typora-image-list/20200619200504.png)

执行顺序

> from->on->join->where->group by->having->select field->order by-> limit

	![](http://img.sgfoot.com/b/20200619200641.png?imageslim)

### 正则查询

mysql支持的正则的符号

![](../../../../../../../typora-image-list/20200619200912.png)

实例

```
select * from student where name regexp '^abc' # 匹配abc开头的
select * from student where name regexp '[abc]' # 匹配方括号里任意一个字符
```