---
title: "MySQL 监控与告警"
date: 2025-09-22T15:22:04+08:00
lastmod: 2025-09-22T15:22:04+08:00
draft: false
tags: ["mysql", "监控", "告警"]
categories: ["mysql"]
author: "百里"
comment: false
toc: true
reward: true
---

<!-- TOC -->

- [1. 开启性能模式](#1-%E5%BC%80%E5%90%AF%E6%80%A7%E8%83%BD%E6%A8%A1%E5%BC%8F)
- [2. 部署 mysqld-exporter](#2-%E9%83%A8%E7%BD%B2-mysqld-exporter)
    - [2.1. collectors 解读](#21-collectors-%E8%A7%A3%E8%AF%BB)
    - [2.2. 单实例](#22-%E5%8D%95%E5%AE%9E%E4%BE%8B)
    - [2.3. 主从实例](#23-%E4%B8%BB%E4%BB%8E%E5%AE%9E%E4%BE%8B)
- [3. 告警规则](#3-%E5%91%8A%E8%AD%A6%E8%A7%84%E5%88%99)
    - [3.1. MySQL 服务可用性告警](#31-mysql-%E6%9C%8D%E5%8A%A1%E5%8F%AF%E7%94%A8%E6%80%A7%E5%91%8A%E8%AD%A6)
    - [3.2. 主从复制状态告警](#32-%E4%B8%BB%E4%BB%8E%E5%A4%8D%E5%88%B6%E7%8A%B6%E6%80%81%E5%91%8A%E8%AD%A6)
    - [3.3. 连接数告警](#33-%E8%BF%9E%E6%8E%A5%E6%95%B0%E5%91%8A%E8%AD%A6)
    - [3.4. InnoDB 缓冲池告警](#34-innodb-%E7%BC%93%E5%86%B2%E6%B1%A0%E5%91%8A%E8%AD%A6)
    - [3.5. 查询性能告警](#35-%E6%9F%A5%E8%AF%A2%E6%80%A7%E8%83%BD%E5%91%8A%E8%AD%A6)
    - [3.6. 锁等待告警](#36-%E9%94%81%E7%AD%89%E5%BE%85%E5%91%8A%E8%AD%A6)
    - [3.7. 二进制日志告警](#37-%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%97%A5%E5%BF%97%E5%91%8A%E8%AD%A6)
    - [3.8. 复制错误告警](#38-%E5%A4%8D%E5%88%B6%E9%94%99%E8%AF%AF%E5%91%8A%E8%AD%A6)
- [4. 部署建议](#4-%E9%83%A8%E7%BD%B2%E5%BB%BA%E8%AE%AE)
- [5. 注意事项](#5-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

<!-- /TOC -->

## 1. 开启性能模式

```sh
[mysqld]
performance_schema=1
optimizer_search_depth = 0
optimizer_switch = index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_intersection=on
```

`performance_schema` 解释：

1. 1 或 ON：启用（推荐）
2. 0 或 OFF：禁用

`optimizer_search_depth` 解释：

1. 控制 MySQL 查询优化器在探索执行计划时的搜索深度
2. 默认值：62（表示“自动”）
3. 设置为 0：表示“自动深度”
4. 设置为 1-62：限制搜索范围

`optimizer_switch` 解释：

1. `index_merge=on` 启用索引合并优化（总开关）
2. 'index_merge_union=on' 启用 OR 条件下的索引联合（如 WHERE a=1 OR b=2）
3. 'index_merge_sort_union=on' 启用排序后的索引联合（适用于无索引排序的 OR）
4. 'index_merge_intersection=on' 启用 AND 条件下的索引交集（如 WHERE a=1 AND b=2，但 a、b 分属不同索引）

## 2. 部署 mysqld-exporter

```sh
# 添加 Helm 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# 更新 Helm 仓库
helm repo update
# 搜索
helm search repo prometheus-mysql-exporter
# 下载
helm pull prometheus-community/prometheus-mysql-exporter --version 2.11.0 
# 下载并解压
helm pull prometheus-community/prometheus-mysql-exporter --version 2.11.0 --untar
```

### 2.1. collectors 解读

```yaml
collectors: {}
  # auto_increment.columns: false # 抓取自增列使用情况（接近上限会告警）。
  # binlog_size: false # 当前 binlog 文件大小，👉 用于监控 binlog 膨胀，防止磁盘爆掉。
  # engine_innodb_status: false # 解析 SHOW ENGINE INNODB STATUS（锁等待、死锁、事务信息）。👉 对调优事务和死锁有用。
  # engine_tokudb_status: false # 
  # global_status: true # 从 SHOW GLOBAL STATUS 抓取 MySQL 的运行状态（QPS、TPS、连接数、缓冲池使用等核心指标）。👉 生产强烈建议开启。
  # global_variables: true # 从 SHOW GLOBAL VARIABLES 抓取配置参数。👉 用于监控参数变动。

  # info_schema.innodb_metrics: false # 采集 information_schema.innodb_metrics 的数据，更细粒度的 InnoDB 指标（buffer pool、事务、IO）。
  # info_schema.innodb_tablespaces: false # 各个表空间大小、空间使用。
  # info_schema.innodb_cmp: false # InnoDB 压缩表相关的指标。
  # info_schema.innodb_cmpmem: false
  # info_schema.processlist: false # 当前连接信息（类似 SHOW PROCESSLIST）。👉 可看阻塞线程、长事务。
  # info_schema.processlist.min_time: 0 # 只采集运行超过 N 秒的 SQL，避免噪音。
  # info_schema.query_response_time: false
  # info_schema.tables: true # 采集表大小、行数、索引大小等。
  # info_schema.tables.databases: '*' # 表示采集所有库的表。
  # info_schema.tablestats: false # 表级别的统计数据。
  # info_schema.schemastats: false # 库级别的统计数据。
  # info_schema.userstats: false # 用户维度维度的连接/查询统计（需要 userstat=1 编译 MySQL）。
  # info_schema.clientstats: false # 客户端维度的连接/查询统计（需要 userstat=1 编译 MySQL）。
  # perf_schema.eventsstatements: false
  # perf_schema.eventsstatements.digest_text_limit: 120
  # perf_schema.eventsstatements.limit: false
  # perf_schema.eventsstatements.timelimit: 86400
  # perf_schema.eventswaits: false
  # perf_schema.file_events: false
  # perf_schema.file_instances: false
  # perf_schema.indexiowaits: false
  # perf_schema.tableiowaits: false
  # perf_schema.tablelocks: false
  # perf_schema.replication_group_member_stats: false
  # slave_status: true # 采集 SHOW SLAVE STATUS，监控主从复制延迟。👉 必须开。
  # slave_hosts: false # 采集 SHOW SLAVE HOSTS，查看从库信息。
  # heartbeat: false # 配合 pt-heartbeat 或自建心跳表，计算主从复制延迟（比 Seconds_Behind_Master 更准确）。
  # heartbeat.database: heartbeat
  # heartbeat.table: heartbeat
```

必开:
global_status, global_variables, slave_status, info_schema.tables
（这是 QPS/TPS/连接数/表大小/复制延迟的核心指标）

视情况开:

高并发事务库：engine_innodb_status, info_schema.innodb_metrics

调优/慢 SQL 分析：perf_schema.eventsstatements

有复制心跳表：heartbeat

存储膨胀风险：binlog_size, info_schema.innodb_tablespaces

一般不开:
innodb_cmp, userstats, 各种 iowaits （指标太多，Prometheus 压力大，除非专门调优）。

推荐配置：

```yaml
collectors:
  # 基础状态
  global_status: true
  global_variables: true

  # 表大小监控
  info_schema.tables: true
  info_schema.tables.databases: '*'

  # 主从复制
  slave_status: true
  # 如果有 pt-heartbeat 或自建心跳表，启用下面
  # heartbeat: true
  # heartbeat.database: heartbeat
  # heartbeat.table: heartbeat

  # InnoDB 引擎
  engine_innodb_status: true
  info_schema.innodb_metrics: true

  # Binlog 监控（防止磁盘爆掉）
  binlog_size: true

  # SQL 分析（可选，打开会有较大开销）
  perf_schema.eventsstatements: false
  # perf_schema.eventsstatements.digest_text_limit: 120
  # perf_schema.eventsstatements.limit: 500
  # perf_schema.eventsstatements.timelimit: 86400

  # 进程/长事务（只监控运行超过30s的SQL）
  info_schema.processlist: true
  info_schema.processlist.min_time: 30

  # 不常用，默认关闭（需要时再开）
  auto_increment.columns: false
  info_schema.userstats: false
  info_schema.clientstats: false
  info_schema.innodb_tablespaces: false
  info_schema.innodb_cmp: false
  info_schema.innodb_cmpmem: false
  perf_schema.eventswaits: false
  perf_schema.file_events: false
  perf_schema.file_instances: false
  perf_schema.indexiowaits: false
  perf_schema.tableiowaits: false
  perf_schema.tablelocks: false
  perf_schema.replication_group_member_stats: false
  slave_hosts: false
```

### 2.2. 单实例

```sh
# set values
cat > mysqld-exporter-standalone-values.yaml <<EOF
image:
  registry: quay.io
  repository: prometheus/mysqld-exporter
  tag: "v0.17.2"
mysql:
  host: "localhost"
  port: 3306
  pass: "password"  
collectors: 
  # 基础状态
  global_status: true
  global_variables: true

  # 表大小监控
  info_schema.tables: true
  info_schema.tables.databases: '*'

  # 主从复制
  slave_status: false
  slave_hosts: false

  # InnoDB 引擎
  engine_innodb_status: true
  info_schema.innodb_metrics: true

  # Binlog 监控（防止磁盘爆掉）
  binlog_size: true

  # 进程/长事务（只监控运行超过30s的SQL）
  info_schema.processlist: true
  info_schema.processlist.min_time: 30
EOF

# install
helm upgrade --install prometheus-mysql-exporter \
  prometheus-community/prometheus-mysql-exporter \
  --version 2.11.0 \
  -n db \
  --set serviceMonitor.enabled=true \
  -f mysqld-exporter-standalone-values.yaml
```

### 2.3. 主从实例 

主服务器 exporter

```sh
# set values
cat > mysqld-exporter-standalone-values.yaml <<EOF
image:
  registry: quay.io
  repository: prometheus/mysqld-exporter
  tag: "v0.17.2"
mysql:
  host: "localhost"
  port: 3306
  pass: "password"  
collectors: 
  # 基础状态
  global_status: true
  global_variables: true

  # 表大小监控
  info_schema.tables: true
  info_schema.tables.databases: '*'

  # 主从复制
  slave_status: false
  slave_hosts: true

  # InnoDB 引擎
  engine_innodb_status: true
  info_schema.innodb_metrics: true

  # Binlog 监控（防止磁盘爆掉）
  binlog_size: true

  # 进程/长事务（只监控运行超过30s的SQL）
  info_schema.processlist: true
  info_schema.processlist.min_time: 30
EOF

# install
helm upgrade --install prometheus-mysql-exporter \
  prometheus-community/prometheus-mysql-exporter \
  --version 2.11.0 \
  -n db \
  --set serviceMonitor.enabled=true \
  -f mysqld-exporter-standalone-values.yaml
```

从服务器 exporter

```sh
# set values
cat > mysqld-exporter-standalone-values.yaml <<EOF
image:
  registry: quay.io
  repository: prometheus/mysqld-exporter
  tag: "v0.17.2"
mysql:
  host: "localhost"
  port: 3306
  pass: "password"  
collectors: 
  # 基础状态
  global_status: true
  global_variables: true

  # 表大小监控
  info_schema.tables: true
  info_schema.tables.databases: '*'

  # 主从复制
  slave_status: true
  slave_hosts: false

  # InnoDB 引擎
  engine_innodb_status: true
  info_schema.innodb_metrics: true

  # Binlog 监控（防止磁盘爆掉）
  binlog_size: true

  # 进程/长事务（只监控运行超过30s的SQL）
  info_schema.processlist: true
  info_schema.processlist.min_time: 30
EOF

# install
helm upgrade --install prometheus-mysql-exporter \
  prometheus-community/prometheus-mysql-exporter \
  --version 2.11.0 \
  -n db \
  --set serviceMonitor.enabled=true \
  -f mysqld-exporter-standalone-values.yaml
```

## 3. 告警规则

### 3.1. MySQL 服务可用性告警

```yaml
- alert:  
  expr: mysql_up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 服务不可用"
    description: "{{ $labels.instance }} MySQL 服务已停止运行"
```

### 3.2. 主从复制状态告警

```yaml
# 从库 IO 线程停止
- alert: MySQLSlaveIOThreadStopped
  expr: mysql_slave_sql_running == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 从库 IO 线程停止"
    description: "{{ $labels.instance }} 从库 IO 线程已停止，复制中断"

# 从库 SQL 线程停止
- alert: MySQLSlaveSQLThreadStopped
  expr: mysql_slave_io_running == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 从库 SQL 线程停止"
    description: "{{ $labels.instance }} 从库 SQL 线程已停止，复制中断"

# 主从延迟过高
- alert: MySQLSlaveReplicationLag
  expr: mysql_slave_lag_seconds > 300
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 主从复制延迟过高"
    description: "{{ $labels.instance }} 主从复制延迟 {{ $value }} 秒，超过 5 分钟"

# 主从延迟严重
- alert: MySQLSlaveReplicationLagCritical
  expr: mysql_slave_lag_seconds > 3600
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 主从复制延迟严重"
    description: "{{ $labels.instance }} 主从复制延迟 {{ $value }} 秒，超过 1 小时"
```

### 3.3. 连接数告警

```yaml
# 连接数过高
- alert: MySQLTooManyConnections
  expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections * 100 > 80
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 连接数过高"
    description: "{{ $labels.instance }} 当前连接数占最大连接数的 {{ $value }}%，超过 80%"

# 连接数达到上限
- alert: MySQLConnectionsNearLimit
  expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections * 100 > 95
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 连接数接近上限"
    description: "{{ $labels.instance }} 当前连接数占最大连接数的 {{ $value }}%，超过 95%"

# 异常连接中断
- alert: MySQLAbortedConnections
  expr: rate(mysql_global_status_aborted_connects[5m]) > 5
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 异常连接中断过多"
    description: "{{ $labels.instance }} 连接中断速率 {{ $value }}/秒，超过正常水平"
```

### 3.4. InnoDB 缓冲池告警

```yaml
# 缓冲池命中率低
- alert: MySQLInnoDBBufferPoolHitRateLow
  expr: (mysql_global_status_innodb_buffer_pool_read_requests - mysql_global_status_innodb_buffer_pool_reads) / mysql_global_status_innodb_buffer_pool_read_requests * 100 < 95
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MySQL InnoDB 缓冲池命中率低"
    description: "{{ $labels.instance }} InnoDB 缓冲池命中率 {{ $value }}%，低于 95%"

# 脏页比例过高
- alert: MySQLInnoDBDirtyPagesHigh
  expr: mysql_global_status_buffer_pool_dirty_pages / (mysql_global_status_buffer_pool_pages{state="data"} + mysql_global_status_buffer_pool_pages{state="free"} + mysql_global_status_buffer_pool_pages{state="misc"}) * 100 > 75
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MySQL InnoDB 脏页比例过高"
    description: "{{ $labels.instance }} InnoDB 脏页占比 {{ $value }}%，超过 75%"
```

### 3.5. 查询性能告警

```yaml
# 慢查询增长过快
- alert: MySQLSlowQueriesHigh
  expr: rate(mysql_global_status_slow_queries[5m]) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 慢查询过多"
    description: "{{ $labels.instance }} 慢查询频率 {{ $value }}/秒，需要优化查询"

# 全表扫描过多
- alert: MySQLSelectScanHigh
  expr: rate(mysql_global_status_select_scan[5m]) > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 全表扫描过多"
    description: "{{ $labels.instance }} 全表扫描频率 {{ $value }}/秒，建议优化索引"
```

### 3.6. 锁等待告警

```yaml
# InnoDB 行锁等待时间过长
- alert: MySQLInnoDBRowLockWaitHigh
  expr: mysql_global_status_innodb_row_lock_time_avg > 5000
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "MySQL InnoDB 行锁等待时间过长"
    description: "{{ $labels.instance }} 平均行锁等待时间 {{ $value }} 毫秒，超过 5 秒"

# 表锁等待
- alert: MySQLTableLocksWaitingHigh
  expr: mysql_global_status_table_locks_waited > 0
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 表锁等待"
    description: "{{ $labels.instance }} 存在表锁等待情况"
```

### 3.7. 二进制日志告警

```yaml
# 二进制日志空间使用率高（适用于主库）
- alert: MySQLBinlogSpaceHigh
  expr: mysql_global_variables_binlog_cache_use / mysql_global_variables_max_binlog_cache_size * 100 > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MySQL 二进制日志缓存使用率高"
    description: "{{ $labels.instance }} 二进制日志缓存使用率 {{ $value }}%，超过 80%"
```

### 3.8. 复制错误告警

```yaml
# 检测主从数据不一致（基于 mysqld-exporter 0.11+ 版本）
- alert: MySQLSlaveReplicationError
  expr: mysql_global_status_slave_retried_transactions > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "MySQL 从库复制出现错误"
    description: "{{ $labels.instance }} 从库复制出现错误，需要人工介入"
```

## 4. 部署建议

1. **阈值调整**：根据业务实际情况调整各项告警阈值
2. **告警分级**：critical 级别需要立即处理，warning 级别需要关注
3. **监控频率**：建议 mysqld-exporter 抓取间隔设置为 15-30 秒
4. **标签管理**：为主库和从库实例添加适当的标签区分

## 5. 注意事项

- 某些指标（如 `mysql_slave_*`）仅在从库实例中存在
- 根据实际的 mysqld-exporter 版本，部分指标名称可能需要调整
- 建议结合业务监控一起使用，形成完整的监控体系
