---
title: "MySQL 一个连接占多少内存？为什么你总是被 OOM Kill？"
date: 2025-08-05T17:40:00+08:00
lastmod: 2025-08-05T17:40:00+08:00
draft: false
tags: ["MySQL", "InnoDB", "Buffer Pool", "k8s", "面试"]
categories: ["数据库", "性能优化"]
author: "百里"
comment: false
toc: true
reward: true
---


## 1. 你遇到过这样的坑吗？

某天你打开监控，看见：

```text
Pod：mysql-prod-xxxx  内存使用率：96.25%
容器资源限制：8Gi
innodb_buffer_pool_size：6Gi
```

你心想：6G + 一点点堆栈，不就够了？怎么可能用掉 96%？
再一看：

```sql
SHOW PROCESSLIST;
-- 200+ 个连接，全部 Sleep 状态，持续几千秒未释放
```

✅ Bingo：**连接相关的内存**拖垮了你的数据库。

---

## 2. MySQL 总内存使用结构图

MySQL 启动后，内存分为两大部分：

```text
MySQL 总内存 ≈
  全局共享内存（Global memory）
+ 每连接私有内存（Per-connection memory）
```

### 2.1. ️全局共享内存（常驻不变）

| 参数                        | 功能            | 说明                   |
| ------------------------- | ------------- | -------------------- |
| `innodb_buffer_pool_size` | 缓存数据页、索引页     | 5.7 和 8.0 核心参数       |
| `innodb_log_buffer_size`  | redo log 写入缓冲 | 较小，一般 16\~64MB       |
| `key_buffer_size`         | MyISAM 缓冲     | 只用于 MyISAM，InnoDB 忽略 |
| `query_cache_size`        | 查询缓存          | 8.0 已移除，5.7 建议禁用     |
| `table_open_cache`        | 打开表的缓存        | 每张表 8K\~16K 内存不等     |

### 2.2. ️每连接私有内存（连接越多越恐怖）

每个连接都会分配一块独立的内存空间，用于执行语句的临时运算。

> 每连接 = 多个 buffer 之和

| 参数                     | 描述          | 默认值 (5.7) | 默认值 (8.0) |
| ---------------------- | ----------- | --------- | --------- |
| `sort_buffer_size`     | ORDER BY 使用 | 256K      | 256K      |
| `read_buffer_size`     | 顺序读取使用      | 128K      | 128K      |
| `read_rnd_buffer_size` | 随机读         | 256K      | 256K      |
| `join_buffer_size`     | JOIN 操作     | 128K      | 256K      |
| `tmp_table_size`       | 内存临时表最大值    | 16M       | 16M       |
| `max_heap_table_size`  | 控制 tmp 表大小  | 16M       | 16M       |
| `binlog_cache_size`    | binlog 缓存   | 32K       | 32K       |
| `thread_stack`         | 线程栈         | 256K      | 256K      |
| `net_buffer_length`    | 网络 buffer   | 16K       | 16K       |

这些参数在 MySQL 8.0 中大部分保留，个别（如 join buffer）默认值略高。

---

## 3. 三、如何估算每个连接占用内存？

### 3.1. ️理论上限估算公式（保守）

```text
per_connection_memory ≈
  sort_buffer_size
+ read_buffer_size
+ read_rnd_buffer_size
+ join_buffer_size
+ binlog_cache_size
+ thread_stack
+ net_buffer_length
+ tmp_table_size（或实际使用）
```

举例配置：

```ini
sort_buffer_size       = 2M
read_buffer_size       = 128K
read_rnd_buffer_size   = 2M
join_buffer_size       = 256K
tmp_table_size         = 64M
binlog_cache_size      = 32K
thread_stack           = 256K
net_buffer_length      = 16K
```

则每连接最大内存可能达到：

```text
2M + 128K + 2M + 256K + 64M + 32K + 256K + 16K ≈ 69MB
```

💡 注意：不是所有查询都会用满，比如不涉及临时表就不会占满 `tmp_table_size`。

---

## 4. 最大连接数怎么算才不会炸？

设定容器内存为 8GiB，`innodb_buffer_pool_size = 4GiB`，预留 OS 使用 0.5GiB，剩余用于连接：

```text
连接可用内存 ≈ 8192 - 4096 - 512 = 3584 MB

max_connections ≈ 3584MB / 每连接内存
               ≈ 3584 / 69
               ≈ 51（实际建议保守设置 40）
```

> 所以，不是你设得越高越好！你设 2000 个 max\_connections，可能 200 个都撑不住！

---

## 5. MySQL 8.0 有自动调优？能解决吗？

> innodb_dedicated_server 是从 MySQL 8.0.14 开始引入的一个配置项，主要用于简化 InnoDB 的内存配置。
> 默认：innodb_dedicated_server = OFF

`innodb_dedicated_server = ON`

* 会根据服务器内存总量，自动调整 `innodb_buffer_pool_size`、`innodb_redo_log_capacity`、`innodb_flush_method`
* 适合专用实例（非容器化环境）

1. 如果MySQL实例与其他应用程序共享系统资源，不建议启用innodb_dedicated_server。 ❌
2. 按照官方说明，只有当MySQL实例位于专用服务器上，独享所有可用的系统资源时，才考虑启用。

---

## 6. 面试模拟：考你！

### 6.1. 问：你线上一个 MySQL 实例，经常被 OOM Kill，你怎么排查？

答（高分回答结构）：

1. 查看 `kubectl describe pod` 中是否有 memory 超出
2. 分析 MySQL 参数：

   * `innodb_buffer_pool_size` 是否过高？
   * `max_connections` 是否设置太多？
   * 每个连接的私有内存是否过大（查看相关 buffer 配置）？
3. 执行 `SHOW PROCESSLIST`，排查是否存在大量 `Sleep` 长连接
4. 检查 `wait_timeout` 是否太长（默认 28800 秒），是否未关闭空闲连接
5. 检查是否使用连接池（HikariCP、SQLAlchemy、GORM）

---

## 7. 最佳实践建议汇总（5.7 & 8.0 通用）

| 项目                        | 建议值（容器内 8Gi）  |
| ------------------------- | ------------- |
| `innodb_buffer_pool_size` | 4GiB\~5GiB    |
| `max_connections`         | 300（通过上文公式估算） |
| `tmp_table_size`          | 64M           |
| `sort_buffer_size`        | 1M\~2M        |
| `join_buffer_size`        | 128K\~512K    |
| `wait_timeout`            | 300           |
| `interactive_timeout`     | 300           |
| `thread_cache_size`       | 64            |
| `innodb_dedicated_server` | OFF（容器中）      |

---

## 8. Bonus：你需要监控这些指标

Prometheus + Grafana 指标：

| 指标                                               | 说明              |
| ------------------------------------------------ | --------------- |
| `mysql_global_status_threads_connected`          | 当前连接总数          |
| `mysql_global_status_threads_running`            | 正在运行的连接数        |
| `mysql_global_variables_innodb_buffer_pool_size` | Buffer Pool 实际值 |
| `container_memory_working_set_bytes`             | Pod 实时内存使用      |
| `mysql_global_status_created_tmp_disk_tables`    | 临时表溢出次数         |
| `mysql_global_status_max_used_connections`       | 曾经达到的最大连接数      |

---

## 9. 总结公式

```text
MySQL 总内存 ≈
  innodb_buffer_pool_size
+ (max_connections × per-connection memory)
+ OS、线程栈、缓存

合理 max_connections ≈
  (总内存 - buffer_pool - 预留空间) / 每连接内存
```

---

## 10. 最后一问（送命题）

> 你的 MySQL 容器是 8Gi 内存，设了 max\_connections=2000，tmp\_table\_size=64M，会怎么样？

答：理论最大内存使用 = 2000 × 64M = 128G，远超容器限制，必然内存爆掉，Pod 被 K8s Kill。

---
