---
title: "Redis 性能分析"
date: 2020-06-30T16:17:44+08:00
lastmod: 2020-06-30T16:17:44+08:00
draft: false
tags: ["redis", "性能分析"]
categories: ["redis"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 查看 Clients 属性

```
127.0.0.1:6379>info clients
```

```
# Clients
connected_clients:1 # 已连接客户端的数量（不包括通过从属服务器连接的客户端）
client_recent_max_input_buffer:2 #  当前连接的客户端当中，最长的输出列表
client_recent_max_output_buffer:0 # 当前连接的客户端当中，最大输入缓存
blocked_clients:0 # 正在等待阻塞命令（BLPOP、BRPOP、BRPOPLPUSH）的客户端的数量
```

## 查看 Memeory 属性

```
127.0.0.1:6379>info memory
```

```
used_memory_human:1.92G # 用户数据所占用的内存，就是你缓存的数据的大小。
used_memory_rss_human:30.73M # 常驻内存, 与top占用内存一致
used_memory_peak_human:1.93G # 内存使用峰值
total_system_memory_human:1.78G # 整个系统的内存
mem_fragmentation_ratio:0.02 # 内存碎片比率. used_memory_rss/used_memory求的值. 如果小于1时,需要优化内存碎片.
```

1. mem_fragmentation_ratio 查看内存碎片比率, 

   1. 小于<1时,Redis实例可能会把部分数据交换到硬盘上，内存交换会严重影响Redis的性能，所以应该增加可用物理内存
   2.  大于>1时, 说明碎片占用 更多的内存, 需要整理, **在1~1.5 之间比较健康.**

   > 重启Redis服务；也能达到碎片整理目的

   查看是否开启自动碎片整理: `config get activedefrag`

   设置自动碎片整理: `config set activedefrag yes`

   直接手动整理碎片: `memory purge`

2. redis.conf配置设置自动整理碎片

   > redis 4.0

   ```
   # Enabled active defragmentation
   # 碎片整理总开关
   # activedefrag yes
   
   # Minimum amount of fragmentation waste to start active defrag
   # 当碎片达到 100mb 时，开启内存碎片整理
   active-defrag-ignore-bytes 100mb
   
   # Minimum percentage of fragmentation to start active defrag
   # 当碎片超过 10% 时，开启内存碎片整理
   active-defrag-threshold-lower 10
   
   # Maximum percentage of fragmentation at which we use maximum effort
   # #内存碎片超过 100%，则尽最大努力整理
   active-defrag-threshold-upper 100
   
   # Minimal effort for defrag in CPU percentage
   # 内存自动整理占用资源最小百分比
   active-defrag-cycle-min 25
   
   # Maximal effort for defrag in CPU percentage
   # 内存自动整理占用资源最大百分比
   active-defrag-cycle-max 75
   ```

   

   

## 查看 Stats 属性

> 只列出部分属性. 有代表性的属性.

```
127.0.0.1:6379>info stats
```

```
# Stats
rejected_connections:0 ## 因为最大客户端数量限制而被拒绝的连接请求数量
expired_keys:40982     ##  因为过期而被自动删除的数据库键数量
latest_fork_usec:201   ##  最近一次 fork() 操作耗费的毫秒数
```



## 参考

[Redis info命令中各个参数的含义](https://zhuanlan.zhihu.com/p/78297083)

[如何监控Redis的工作状态——INFO命令详解](http://ghoulich.xninja.org/2016/10/15/how-to-monitor-redis-status/)

[Redis 4.0 自动内存碎片整理](https://juejin.im/post/5cec843bf265da1bb77648b5)