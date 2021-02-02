---
title: "Redis 配置"
date: 2020-07-14T17:11:29+08:00
lastmod: 2020-07-14T17:11:29+08:00
draft: false
tags: ["redis"]
categories: ["redis"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 配置文件目录

以上是常见的redis存放目录

```
vim /etc/redis.conf
vim /etc/redis/6379.conf
```



## 启动配置

```
# 后台运行: yes 是, no 不是
daemonize yes 
# 提供服务的端口
port 6379
# 对外提供的ip地址
 bind 127.0.0.1 # 只允许本地连接,如果没有其它服务访问, 推荐这种.
 bind 10.11.12.9 # 只允许局域网连接, 还有其它服务访问, [推荐]
 bind 0.0.0.0 # 允许任意连接 
 
# 设置客户端连接后进行任何其他指定前需要使用的密码。
requirepass mypass
```

## 限制配置

### 内存设置

默认redis没有内存上限, 如果超时物理内存就会实例挂掉. 所以勿必设置内存大小, 然后配合淘汰策略使用.

```
# 连接数限制 如果设置 maxclients 0，表示不作限制。
# 注意 2g 和 2gb 是有区别的. 见下面, 大小写不区分.
maxclients 1024 
maxmemory 2gb
```
设置完后可以在: info memory看到

```
maxmemory:2147483648
maxmemory_human:2.00G
```



### 配置内存大小参考

```
# 1k => 1000 bytes
# 1kb => 1024 bytes
# 1m => 1000000 bytes
# 1mb => 1024*1024 bytes
# 1g => 1000000000 bytes
# 1gb => 1024*1024*1024 bytes
```

### 淘汰策略设置

```
# volatile-lru -> 利用LRU算法移除设置过过期时间的key (LRU:最近使用 Least Recently Used )
# allkeys-lru -> 利用LRU算法移除任何key
# volatile-random -> 移除设置过过期时间的随机key
# allkeys->random -> remove a random key, any key
# volatile-ttl -> 移除即将过期的key(minor TTL)
# noeviction -> 不移除任何可以，只是返回一个写错误
```

```
maxmemory-policy volatile-lru
```



## 快照配置

```
# save 900 1 900秒内至少有1个key被改变
# save 300 10 300秒内至少有300个key被改变
# save 60 10000 60秒内至少有10000个key被改变

save 900 1
save 300 10
save 60 10000

# 存储至本地数据库时（持久化到rdb文件）是否压缩数据，默认为yes
rdbcompression yes

# 本地持久化数据库文件名，默认值为dump.rdb
dbfilename dump.rdb
```

## 主从复制配置

```
# 主从复制. 设置该数据库为其他数据库的从数据库.
# 设置当本机为slav服务时，设置master服务的IP地址及端口，在Redis启动时，它会自动从master进行数据同步
#
slaveof 127.0.0.1 6380

# 当master服务设置了密码保护时(用requirepass制定的密码)
# slav服务连接master的密码
#
masterauth 123456
```

## 慢查询配置

两个配置参数有关`slowlog-log-slower-than`, `slowlog-max-len`

时间的换算

```
1秒 = 1000毫秒
1毫秒 = 1000微秒
```

1. `slowlog-log-slower-than` 设置多少微秒, 也就是说某命令超出设置的微秒数将记录.
2. `slowlog-max-len` 记录存放在哪儿呢? 存在一个列表里, 这个参数就是设置列表的长度.超出采用先进先出的方法移出

```
slowlog-log-slower-than 10000
slowlog-max-len 128
或
config set slowlog-log-slower-than 20000
config set slowlog-max-len 1000
# 如果需要写入到配置文件则使用以下命令
config rewrite 
```

### 查看慢日志

redis并没有暴露列表的键值. 所以只能使用特点命令查看

```
# [n]是一次查看多少条数据
slowlog get [n]
# 查看慢日志有多少条
slowlog len
# 慢日志重置
slowlog reset
```

