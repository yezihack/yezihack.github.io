---
title: "Redis 参数配置详解与优化指南"
date: 2025-10-17T16:48:48+08:00
lastmod: 2025-10-17T16:48:48+08:00
draft: false
tags: ["redis", "中间件", "优化"]
categories: ["中间件"]
author: "百里"
comment: false
toc: true
reward: true
---

## 概述

Redis 作为高性能的内存数据库，其性能表现很大程度上取决于参数配置的合理性。本文将详细介绍 Redis 的核心参数，并针对不同的部署架构（单机、主从、哨兵、集群）提供优化配置建议。

## 一、Redis 核心参数详解

### 1.1 基础配置参数

#### bind
- **说明**：指定 Redis 监听的网络接口
- **默认值**：`127.0.0.1`
- **建议**：生产环境建议绑定内网 IP，避免使用 `0.0.0.0`
```conf
bind 192.168.1.100
```

#### port
- **说明**：Redis 监听端口
- **默认值**：`6379`
- **建议**：可修改为非默认端口以提高安全性
```conf
port 6379
```

#### protected-mode
- **说明**：保护模式，防止未授权访问
- **默认值**：`yes`
- **建议**：生产环境必须开启，配合 `requirepass` 使用
```conf
protected-mode yes
```

#### requirepass
- **说明**：设置访问密码
- **默认值**：无
- **建议**：生产环境必须设置强密码
```conf
requirepass YourStrongPassword@2025
```

#### timeout
- **说明**：客户端空闲多少秒后关闭连接，0 表示禁用
- **默认值**：`0`
- **建议**：设置 300 秒，避免僵尸连接
```conf
timeout 300
```

#### tcp-keepalive
- **说明**：TCP 连接保活时间（秒）
- **默认值**：`300`
- **建议**：保持默认或设置为 60
```conf
tcp-keepalive 60
```

### 1.2 内存管理参数

#### maxmemory
- **说明**：Redis 最大内存使用量
- **默认值**：`0`（不限制）
- **建议**：设置为物理内存的 60%-70%，留出空间给系统和持久化
```conf
maxmemory 4gb
```

#### maxmemory-policy
- **说明**：内存淘汰策略
- **可选值**：
  - `noeviction`：不淘汰，写入失败（默认）
  - `allkeys-lru`：对所有 key 使用 LRU 算法淘汰
  - `volatile-lru`：对设置了过期时间的 key 使用 LRU 淘汰
  - `allkeys-random`：随机淘汰所有 key
  - `volatile-random`：随机淘汰有过期时间的 key
  - `volatile-ttl`：淘汰即将过期的 key
  - `allkeys-lfu`：对所有 key 使用 LFU 算法淘汰
  - `volatile-lfu`：对设置了过期时间的 key 使用 LFU 淘汰
- **建议**：根据业务场景选择，缓存场景推荐 `allkeys-lru`
```conf
maxmemory-policy allkeys-lru
```

#### maxmemory-samples
- **说明**：LRU/LFU 算法采样数量
- **默认值**：`5`
- **建议**：增加到 10 可提高准确性，但会增加 CPU 开销
```conf
maxmemory-samples 10
```

### 1.3 持久化参数

#### save
- **说明**：RDB 快照保存条件
- **默认值**：
  ```conf
  save 900 1      # 900秒内至少1个key变化
  save 300 10     # 300秒内至少10个key变化
  save 60 10000   # 60秒内至少10000个key变化
  ```
- **建议**：根据数据重要性调整
```conf
# 对数据持久性要求高
save 900 1
save 300 10
save 60 10000

# 对性能要求高，可关闭
save ""
```

#### stop-writes-on-bgsave-error
- **说明**：RDB 快照失败时是否停止写入
- **默认值**：`yes`
- **建议**：保持默认，避免数据丢失
```conf
stop-writes-on-bgsave-error yes
```

#### rdbcompression
- **说明**：是否压缩 RDB 文件
- **默认值**：`yes`
- **建议**：保持开启，节省磁盘空间
```conf
rdbcompression yes
```

#### rdbchecksum
- **说明**：是否对 RDB 文件进行校验
- **默认值**：`yes`
- **建议**：保持开启，确保数据完整性
```conf
rdbchecksum yes
```

#### dbfilename
- **说明**：RDB 文件名
- **默认值**：`dump.rdb`
```conf
dbfilename dump.rdb
```

#### dir
- **说明**：持久化文件存储目录
- **默认值**：`./`
- **建议**：设置独立目录，确保有足够空间
```conf
dir /data/redis
```

#### appendonly
- **说明**：是否开启 AOF 持久化
- **默认值**：`no`
- **建议**：对数据可靠性要求高的场景必须开启
```conf
appendonly yes
```

#### appendfilename
- **说明**：AOF 文件名
- **默认值**：`appendonly.aof`
```conf
appendfilename "appendonly.aof"
```

#### appendfsync
- **说明**：AOF 文件同步策略
- **可选值**：
  - `always`：每次写入都同步（最安全，性能最差）
  - `everysec`：每秒同步（推荐，平衡性能和安全）
  - `no`：由操作系统决定（性能最好，可能丢失数据）
- **建议**：使用 `everysec`
```conf
appendfsync everysec
```

#### no-appendfsync-on-rewrite
- **说明**：重写 AOF 时是否暂停 fsync
- **默认值**：`no`
- **建议**：设置为 yes，避免磁盘 IO 阻塞
```conf
no-appendfsync-on-rewrite yes
```

#### auto-aof-rewrite-percentage
- **说明**：AOF 文件增长百分比触发重写
- **默认值**：`100`
```conf
auto-aof-rewrite-percentage 100
```

#### auto-aof-rewrite-min-size
- **说明**：触发 AOF 重写的最小文件大小
- **默认值**：`64mb`
```conf
auto-aof-rewrite-min-size 64mb
```

#### aof-load-truncated
- **说明**：AOF 文件末尾损坏时是否加载
- **默认值**：`yes`
- **建议**：保持默认
```conf
aof-load-truncated yes
```

#### aof-use-rdb-preamble
- **说明**：AOF 重写时使用 RDB 格式作为前缀
- **默认值**：`yes`（Redis 4.0+）
- **建议**：开启可加快加载速度
```conf
aof-use-rdb-preamble yes
```

### 1.4 性能优化参数

#### databases
- **说明**：数据库数量
- **默认值**：`16`
- **建议**：单机可保持默认，集群模式只有 db0
```conf
databases 16
```

#### maxclients
- **说明**：最大客户端连接数
- **默认值**：`10000`
- **建议**：根据实际需求调整
```conf
maxclients 10000
```

#### tcp-backlog
- **说明**：TCP 连接队列长度
- **默认值**：`511`
- **建议**：高并发场景增大到 2048
```conf
tcp-backlog 2048
```

#### hz
- **说明**：内部定时任务执行频率（1-500）
- **默认值**：`10`
- **建议**：增大可提高过期 key 清理速度，但会增加 CPU 使用
```conf
hz 10
```

#### dynamic-hz
- **说明**：动态调整 hz
- **默认值**：`yes`
- **建议**：保持开启
```conf
dynamic-hz yes
```

#### lazyfree-lazy-eviction
- **说明**：淘汰 key 时使用异步删除
- **默认值**：`no`
- **建议**：开启，避免阻塞
```conf
lazyfree-lazy-eviction yes
```

#### lazyfree-lazy-expire
- **说明**：过期 key 使用异步删除
- **默认值**：`no`
- **建议**：开启，避免阻塞
```conf
lazyfree-lazy-expire yes
```

#### lazyfree-lazy-server-del
- **说明**：隐式删除（如 rename）使用异步删除
- **默认值**：`no`
- **建议**：开启
```conf
lazyfree-lazy-server-del yes
```

#### lazyfree-lazy-user-del
- **说明**：用户执行 DEL 时使用异步删除
- **默认值**：`no`
- **建议**：根据业务需求，可开启
```conf
lazyfree-lazy-user-del yes
```

### 1.5 日志参数

#### loglevel
- **说明**：日志级别
- **可选值**：`debug`、`verbose`、`notice`、`warning`
- **默认值**：`notice`
- **建议**：生产环境使用 `notice`
```conf
loglevel notice
```

#### logfile
- **说明**：日志文件路径
- **默认值**：`""`（标准输出）
- **建议**：指定日志文件
```conf
logfile /var/log/redis/redis.log
```

#### syslog-enabled
- **说明**：是否启用系统日志
- **默认值**：`no`
```conf
syslog-enabled no
```

### 1.6 安全参数

#### rename-command
- **说明**：重命名危险命令
- **建议**：生产环境禁用或重命名危险命令
```conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_8f3a9b2c"
rename-command KEYS ""
```

#### maxmemory-clients
- **说明**：客户端输出缓冲区最大内存（Redis 7.0+）
- **建议**：防止客户端缓冲区占用过多内存
```conf
maxmemory-clients 10%
```

#### client-output-buffer-limit
- **说明**：客户端输出缓冲区限制
- **格式**：`<class> <hard limit> <soft limit> <soft seconds>`
- **建议**：合理设置，防止内存溢出
```conf
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

## 二、单机模式优化配置

单机模式适用于开发环境、小型应用或对可用性要求不高的场景。

### 2.1 配置示例

```conf
# 基础配置
bind 0.0.0.0
port 6379
protected-mode yes
requirepass StrongPassword@2025
timeout 300
tcp-keepalive 60
daemonize yes
pidfile /var/run/redis_6379.pid

# 日志配置
loglevel notice
logfile /var/log/redis/redis.log

# 内存配置
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# 持久化配置（数据安全优先）
# RDB配置
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# AOF配置
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# 工作目录
dir /data/redis

# 连接配置
maxclients 10000
tcp-backlog 2048

# 性能优化
hz 10
dynamic-hz yes
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
lazyfree-lazy-user-del no

# 安全配置
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_SECRET"
rename-command KEYS ""

# 数据库数量
databases 16
```

### 2.2 性能优先配置

如果对性能要求极高，可以牺牲部分数据安全性：

```conf
# 关闭RDB
save ""

# AOF使用no策略或关闭
appendonly no
# 或
appendfsync no

# 其他优化
maxmemory-policy allkeys-lru
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
```

### 2.3 数据安全优先配置

如果对数据可靠性要求极高：

```conf
# RDB更频繁
save 900 1
save 300 10
save 60 10000
save 30 1000

# AOF使用always策略
appendonly yes
appendfsync always
no-appendfsync-on-rewrite no

# 错误时停止写入
stop-writes-on-bgsave-error yes
```

## 三、主从模式优化配置

主从模式提供数据备份和读写分离能力，适用于读多写少的场景。

### 3.1 主节点配置

```conf
# 基础配置
bind 192.168.1.100
port 6379
protected-mode yes
requirepass MasterPassword@2025
masterauth MasterPassword@2025  # 用于主从切换
timeout 300

# 日志配置
loglevel notice
logfile /var/log/redis/redis-master.log

# 内存配置
maxmemory 8gb
maxmemory-policy allkeys-lru

# 持久化配置（主节点建议开启）
# RDB配置
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# AOF配置
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 128mb
aof-use-rdb-preamble yes

# 工作目录
dir /data/redis/master

# 连接配置
maxclients 20000
tcp-backlog 2048

# 复制配置
repl-diskless-sync no  # 是否使用无盘复制
repl-diskless-sync-delay 5  # 无盘复制延迟
repl-diskless-load disabled  # 从节点是否无盘加载
repl-ping-replica-period 10  # ping从节点周期
repl-timeout 60  # 复制超时时间
repl-disable-tcp-nodelay no  # 是否禁用TCP_NODELAY
repl-backlog-size 256mb  # 复制积压缓冲区大小（重要）
repl-backlog-ttl 3600  # 复制积压缓冲区保留时间
replica-priority 100  # 从节点优先级

# 从节点配置
min-replicas-to-write 1  # 最少从节点数才允许写入
min-replicas-max-lag 10  # 从节点最大延迟（秒）

# 性能优化
hz 10
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# 安全配置
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_SECRET"

# 客户端输出缓冲区（重要：防止慢从节点）
client-output-buffer-limit replica 512mb 128mb 60
```

### 3.2 从节点配置

```conf
# 基础配置
bind 192.168.1.101
port 6379
protected-mode yes
requirepass SlavePassword@2025
masterauth MasterPassword@2025
timeout 300

# 日志配置
loglevel notice
logfile /var/log/redis/redis-slave.log

# 复制配置（关键）
replicaof 192.168.1.100 6379  # 主节点地址
replica-read-only yes  # 从节点只读
replica-serve-stale-data yes  # 断线时是否继续服务
replica-priority 100  # 优先级（越小越优先）

# 内存配置
maxmemory 8gb
maxmemory-policy allkeys-lru

# 持久化配置（从节点可选择性关闭以提高性能）
# 方案1：关闭持久化（推荐，主节点已有持久化）
save ""
appendonly no

# 方案2：开启持久化（数据安全优先）
# save 900 1
# appendonly yes
# appendfsync everysec

# 工作目录
dir /data/redis/slave

# 连接配置
maxclients 20000
tcp-backlog 2048

# 复制配置
repl-diskless-load disabled
repl-ping-replica-period 10
repl-timeout 60
repl-disable-tcp-nodelay no
repl-backlog-size 256mb

# 性能优化
hz 10
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# 安全配置
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_SECRET"
```

### 3.3 主从模式关键参数说明

#### repl-backlog-size
- **重要性**：⭐⭐⭐⭐⭐
- **作用**：主节点维护的复制积压缓冲区，用于部分重同步
- **建议**：设置为峰值写入速率 × 预期网络中断时间
- **计算示例**：写入速率 10MB/s，容忍中断 60 秒，则设置 `600mb`

#### min-replicas-to-write & min-replicas-max-lag
- **重要性**：⭐⭐⭐⭐
- **作用**：保证数据安全，至少有 N 个从节点延迟小于 M 秒才允许写入
- **建议**：`min-replicas-to-write 1` + `min-replicas-max-lag 10`

#### client-output-buffer-limit replica
- **重要性**：⭐⭐⭐⭐⭐
- **作用**：控制从节点输出缓冲区，防止慢从节点导致主节点内存溢出
- **建议**：根据数据量调整，大数据量场景设置为 `512mb 128mb 60`

## 四、哨兵模式优化配置

哨兵模式在主从复制基础上增加了自动故障转移能力，适用于高可用场景。

### 4.1 Redis 主从节点配置

主从节点配置与第三章相同，额外注意以下配置：

```conf
# 主节点和从节点都需要设置
masterauth MasterPassword@2025  # 用于故障转移后的认证

# 从节点优先级设置（数值越小越优先成为主节点）
replica-priority 100  # 可以为不同从节点设置不同优先级
```

### 4.2 哨兵配置文件（sentinel.conf）

```conf
# 基础配置
port 26379
bind 0.0.0.0
protected-mode yes
daemonize yes
pidfile /var/run/redis-sentinel.pid
logfile /var/log/redis/sentinel.log
dir /data/redis/sentinel

# 哨兵监控配置（核心）
# sentinel monitor <master-name> <ip> <port> <quorum>
sentinel monitor mymaster 192.168.1.100 6379 2

# 认证配置
sentinel auth-pass mymaster MasterPassword@2025

# 故障判定配置
sentinel down-after-milliseconds mymaster 5000  # 5秒无响应判定下线
sentinel parallel-syncs mymaster 1  # 故障转移时同时同步的从节点数
sentinel failover-timeout mymaster 30000  # 故障转移超时时间（毫秒）

# 通知脚本（可选）
# sentinel notification-script mymaster /path/to/notification.sh
# sentinel client-reconfig-script mymaster /path/to/reconfig.sh

# 哨兵自身配置
sentinel deny-scripts-reconfig yes  # 禁止运行时重配置脚本

# 性能配置
# 哨兵之间的通信
sentinel resolve-hostnames no
sentinel announce-hostnames no
```

### 4.3 多哨兵部署（推荐至少 3 个）

**哨兵 1（192.168.1.201:26379）：**
```conf
port 26379
bind 192.168.1.201
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel auth-pass mymaster MasterPassword@2025
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 30000
```

**哨兵 2（192.168.1.202:26379）：**
```conf
port 26379
bind 192.168.1.202
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel auth-pass mymaster MasterPassword@2025
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 30000
```

**哨兵 3（192.168.1.203:26379）：**
```conf
port 26379
bind 192.168.1.203
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel auth-pass mymaster MasterPassword@2025
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 30000
```

### 4.4 哨兵模式关键参数说明

#### quorum（法定人数）
- **重要性**：⭐⭐⭐⭐⭐
- **说明**：至少多少个哨兵同意主节点下线才进行故障转移
- **建议**：
  - 3 个哨兵：设置为 2
  - 5 个哨兵：设置为 3
  - 公式：`quorum = (哨兵总数 / 2) + 1`

#### down-after-milliseconds
- **重要性**：⭐⭐⭐⭐⭐
- **说明**：多少毫秒无响应后判定主节点主观下线
- **建议**：
  - 网络稳定：3000-5000ms
  - 网络不稳定：10000-30000ms
  - 过小会导致误判，过大会延长故障转移时间

#### parallel-syncs
- **重要性**：⭐⭐⭐⭐
- **说明**：故障转移时同时向新主节点同步的从节点数
- **建议**：
  - 设置为 1：避免所有从节点同时同步导致服务不可用
  - 从节点较多且网络好：可设置为 2-3

#### failover-timeout
- **重要性**：⭐⭐⭐⭐
- **说明**：故障转移超时时间
- **建议**：30000ms（30 秒），大数据集可适当增加

### 4.5 哨兵模式部署建议

1. **哨兵数量**：建议部署奇数个（3、5、7），最少 3 个
2. **哨兵部署位置**：与 Redis 节点分开部署，避免单点故障
3. **网络要求**：哨兵之间、哨兵与 Redis 之间网络要稳定
4. **资源需求**：哨兵占用资源少，可与其他服务共存

## 五、集群模式优化配置

Redis Cluster 提供了数据分片和高可用能力，适用于大规模、高并发场景。

### 5.1 集群节点配置

每个集群节点的配置文件（建议至少 6 个节点：3 主 3 从）：

**节点 1（192.168.1.101:7001）：**
```conf
# 基础配置
bind 192.168.1.101
port 7001
protected-mode yes
requirepass ClusterPassword@2025
masterauth ClusterPassword@2025  # 集群节点间认证
timeout 300
daemonize yes
pidfile /var/run/redis_7001.pid

# 日志配置
loglevel notice
logfile /var/log/redis/redis-7001.log

# 集群配置（核心）
cluster-enabled yes  # 启用集群模式
cluster-config-file nodes-7001.conf  # 集群配置文件（自动生成）
cluster-node-timeout 15000  # 节点超时时间（毫秒）
cluster-replica-validity-factor 10  # 从节点有效性因子
cluster-migration-barrier 1  # 主节点最少保留从节点数
cluster-require-full-coverage no  # 部分槽位不可用时是否继续服务
cluster-replica-no-failover no  # 从节点是否参与故障转移
cluster-allow-reads-when-down no  # 集群下线时是否允许读

# 内存配置
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# 持久化配置
# 方案1：AOF（推荐）
appendonly yes
appendfilename "appendonly-7001.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 128mb
aof-use-rdb-preamble yes

# 方案2：RDB（性能优先）
# save 900 1
# save 300 10
# save 60 10000

# 方案3：混合持久化（推荐）
save 900 1
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes

# 工作目录
dir /data/redis/cluster/7001

# 连接配置
maxclients 10000
tcp-backlog 2048

# 性能优化
hz 10
dynamic-hz yes
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
lazyfree-lazy-user-del yes

# 复制配置（集群内部主从）
repl-backlog-size 256mb
repl-timeout 60
repl-disable-tcp-nodelay no
client-output-buffer-limit replica 512mb 128mb 60

# 安全配置
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""

# 集群模式下只有 db0
databases 1
```

**其他节点配置类似，需要修改：**
- `bind`：对应的 IP 地址
- `port`：不同的端口（7001-7006）
- `pidfile`：不同的 PID 文件
- `logfile`：不同的日志文件
- `cluster-config-file`：不同的集群配置文件
- `appendfilename`：不同的 AOF 文件（如果使用）
- `dir`：不同的数据目录

### 5.2 集群节点配置示例（6 节点）

| 节点 | IP | 端口 | 角色 | 配置要点 |
|------|------------|------|------|----------|
| 节点1 | 192.168.1.101 | 7001 | 主 | 完整配置 |
| 节点2 | 192.168.1.102 | 7002 | 主 | 完整配置 |
| 节点3 | 192.168.1.103 | 7003 | 主 | 完整配置 |
| 节点4 | 192.168.1.104 | 7004 | 从 | 完整配置 |
| 节点5 | 192.168.1.105 | 7005 | 从 | 完整配置 |
| 节点6 | 192.168.1.106 | 7006 | 从 | 完整配置 |

### 5.3 集群创建命令

```bash
# Redis 5.0+ 使用 redis-cli 创建集群
redis-cli --cluster create \
  192.168.1.101:7001 \
  192.168.1.102:7002 \
  192.168.1.103:7003 \
  192.168.1.104:7004 \
  192.168.1.105:7005 \
  192.168.1.106:7006 \
  --cluster-replicas 1 \
  -a ClusterPassword@2025

# --cluster-replicas 1 表示每个主节点有 1 个从节点
```

### 5.4 集群模式关键参数说明

#### cluster-node-timeout
- **重要性**：⭐⭐⭐⭐⭐
- **说明**：节点间心跳超时时间，超过此时间判定节点下线
- **建议**：
  - 网络稳定：10000-15000ms
  - 网络不稳定：20000-30000ms
  - 公式：`cluster-node-timeout = down-after-milliseconds * 3`

#### cluster-require-full-coverage
- **重要性**：⭐⭐⭐⭐⭐
- **说明**：是否要求所有槽位可用才提供服务
- **建议**：
  - `no`：部分节点故障时继续服务（推荐）
  - `yes`：保证数据完整性，但可用性降低

#### cluster-migration-barrier
- **重要性**：⭐⭐⭐⭐
- **说明**：主节点最少保留的从节点数，用于自动迁移
- **建议**：设置为 1，保证每个主节点至少有 1 个从节点

#### cluster-replica-validity-factor
- **重要性**：⭐⭐⭐
- **说明**：从节点数据过期时间因子
- **计算**：`有效时间 = cluster-node-timeout × factor`
- **建议**：保持默认值 10

#### cluster-allow-reads-when-down
- **重要性**：⭐⭐⭐
- **说明**：集群下线时是否允许读取
- **建议**：`no`，避免读取到不一致数据

### 5.5 集群模式性能优化

#### 1. 内存优化
```conf
# 合理设置最大内存
maxmemory 4gb
maxmemory-policy allkeys-lru

# 启用懒删除
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
lazyfree-lazy-user-del yes
```

#### 2. 网络优化
```conf
# 禁用 TCP_NODELAY 可以减少小包，但会增加延迟
repl-disable-tcp-nodelay no

# 增加客户端连接数
maxclients 10000
tcp-backlog 2048

# 客户端输出缓冲区
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 512mb 128mb 60
```

#### 3. 持久化优化
```conf
# 推荐混合持久化
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes

# AOF 重写时不阻塞
no-appendfsync-on-rewrite yes

# 合理设置重写触发条件
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 128mb
```

#### 4. 复制优化
```conf
# 增大复制积压缓冲区
repl-backlog-size 256mb

# 设置合理的超时时间
repl-timeout 60
```

### 5.6 集群模式部署建议

#### 1. 节点数量规划
- **最小配置**：6 个节点（3 主 3 从）
- **推荐配置**：9 个节点（3 主 6 从）或更多
- **扩展规则**：节点数应为 3 的倍数，便于槽位分配

#### 2. 硬件规划
- **CPU**：8 核+（Redis 是单线程，但集群有多个实例）
- **内存**：根据数据量规划，每个节点建议 8GB-32GB
- **磁盘**：SSD，确保持久化性能
- **网络**：万兆网卡，低延迟

#### 3. 分片策略
- **均匀分布**：确保 16384 个槽位均匀分配
- **考虑业务**：相关的 key 使用 Hash Tag 分配到同一槽位
  ```bash
  # 例如：{user:1000}:name 和 {user:1000}:age 会分配到同一槽位
  ```

#### 4. 监控指标
- 节点状态：`cluster nodes`
- 槽位分布：`cluster slots`
- 内存使用：`info memory`
- 复制延迟：`info replication`
- 性能指标：`info stats`

## 六、系统参数优化

除了 Redis 自身配置，操作系统参数也对性能有重要影响。

### 6.1 Linux 内核参数优化

**文件：/etc/sysctl.conf**
```conf
# 网络优化
net.core.somaxconn = 2048  # 增大连接队列
net.ipv4.tcp_max_syn_backlog = 2048  # SYN 队列长度
net.ipv4.tcp_tw_reuse = 1  # TIME_WAIT 重用
net.ipv4.tcp_fin_timeout = 30  # FIN_WAIT 超时
net.ipv4.tcp_keepalive_time = 300  # TCP keepalive 时间
net.ipv4.tcp_keepalive_probes = 3  # keepalive 探测次数
net.ipv4.tcp_keepalive_intvl = 30  # keepalive 探测间隔

# 内存优化
vm.overcommit_memory = 1  # 允许内存超配（重要）
vm.swappiness = 0  # 减少使用 swap
vm.dirty_background_ratio = 5  # 后台写入比例
vm.dirty_ratio = 10  # 强制写入比例

# 文件描述符
fs.file-max = 1000000  # 系统最大文件描述符
```

应用内核参数：
```bash
sysctl -p
```

### 6.2 系统限制优化

**文件：/etc/security/limits.conf**
```conf
# 为 redis 用户设置资源限制
redis soft nofile 65535
redis hard nofile 65535
redis soft nproc 65535
redis hard nproc 65535
```

### 6.3 透明大页（THP）优化

Redis 官方建议禁用透明大页：
```bash
# 临时禁用
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 永久禁用（添加到 /etc/rc.local）
#!/bin/bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

### 6.4 文件系统优化

建议使用 ext4 或 xfs 文件系统，挂载选项：
```bash
# /etc/fstab
/dev/sdb1 /data ext4 defaults,noatime,nodiratime 0 0
```

- `noatime`：不更新访问时间，减少 IO
- `nodiratime`：不更新目录访问时间

### 6.5 进程优先级优化

提高 Redis 进程优先级：
```bash
# 设置 nice 值
renice -n -10 -p $(pidof redis-server)

# 或在启动脚本中设置
nice -n -10 redis-server /etc/redis/redis.conf
```

## 七、不同场景配置选择建议

### 7.1 缓存场景

**特点**：数据可丢失，性能优先

```conf
# 内存策略
maxmemory 8gb
maxmemory-policy allkeys-lru

# 关闭持久化
save ""
appendonly no

# 异步删除
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes

# 架构选择
# - 单机：简单场景
# - 主从：读多写少
# - 集群：大容量、高并发
```

### 7.2 数据库场景

**特点**：数据不能丢失，可靠性优先

```conf
# 内存策略
maxmemory-policy noeviction  # 不淘汰

# 持久化
appendonly yes
appendfsync everysec  # 或 always
save 900 1
save 300 10

# 主从复制
min-replicas-to-write 1
min-replicas-max-lag 10

# 架构选择
# - 单机：不推荐
# - 主从+哨兵：推荐
# - 集群：大数据量场景
```

### 7.3 消息队列场景

**特点**：吞吐量大，需要持久化

```conf
# 内存策略
maxmemory 16gb
maxmemory-policy noeviction

# 持久化（AOF）
appendonly yes
appendfsync everysec

# 性能优化
hz 100  # 提高频率，快速处理过期 key
lazyfree-lazy-expire yes

# 连接数
maxclients 20000

# 架构选择
# - 单机：小规模
# - 主从：读取多
# - 集群：大规模、高并发
```

### 7.4 会话存储场景

**特点**：中等重要性，需要快速访问

```conf
# 内存策略
maxmemory 4gb
maxmemory-policy volatile-lru

# 持久化（可选）
appendonly yes
appendfsync everysec

# 过期策略
hz 10
lazyfree-lazy-expire yes

# 架构选择
# - 单机：小型应用
# - 主从+哨兵：中大型应用
```

## 八、配置验证与监控

### 8.1 配置验证

启动 Redis 后验证配置：
```bash
# 连接 Redis
redis-cli -h 192.168.1.100 -p 6379 -a password

# 查看所有配置
CONFIG GET *

# 查看特定配置
CONFIG GET maxmemory
CONFIG GET appendonly

# 运行时修改配置（临时）
CONFIG SET maxmemory 4gb

# 持久化配置修改
CONFIG REWRITE
```

### 8.2 关键监控指标

```bash
# 基础信息
INFO server
INFO clients
INFO memory
INFO persistence
INFO stats
INFO replication
INFO cpu

# 集群信息
CLUSTER INFO
CLUSTER NODES

# 哨兵信息
SENTINEL masters
SENTINEL master mymaster
SENTINEL replicas mymaster
SENTINEL sentinels mymaster
```

### 8.3 性能测试

```bash
# 使用 redis-benchmark 进行性能测试
redis-benchmark -h 192.168.1.100 -p 6379 -a password -c 100 -n 100000

# 测试特定命令
redis-benchmark -h 192.168.1.100 -p 6379 -a password -t set,get -n 1000000 -q

# 测试集群
redis-benchmark -h 192.168.1.101 -p 7001 -a password -c 100 -n 100000 --cluster
```

### 8.4 常见问题排查

#### 1. 内存不足
```bash
# 查看内存使用
INFO memory

# 检查大 key
redis-cli --bigkeys

# 分析内存
redis-cli --memkeys
```

#### 2. 慢查询
```bash
# 配置慢查询
CONFIG SET slowlog-log-slower-than 10000  # 微秒
CONFIG SET slowlog-max-len 128

# 查看慢查询
SLOWLOG GET 10
```

#### 3. 连接数过多
```bash
# 查看当前连接数
INFO clients

# 查看连接列表
CLIENT LIST

# 关闭空闲连接
CONFIG SET timeout 300
```

## 九、最佳实践总结

### 9.1 安全最佳实践

1. ✅ 必须设置强密码（`requirepass`）
2. ✅ 绑定内网 IP，禁止外网直接访问
3. ✅ 开启保护模式（`protected-mode yes`）
4. ✅ 禁用或重命名危险命令（FLUSHALL、CONFIG 等）
5. ✅ 使用防火墙限制访问
6. ✅ 定期更新 Redis 版本，修复安全漏洞

### 9.2 性能最佳实践

1. ✅ 合理设置 `maxmemory` 和淘汰策略
2. ✅ 启用 lazyfree 机制，避免阻塞
3. ✅ 禁用 THP（透明大页）
4. ✅ 优化系统内核参数
5. ✅ 使用 SSD 存储，提升持久化性能
6. ✅ 避免使用 KEYS 命令，使用 SCAN 替代
7. ✅ 合理使用数据结构，避免大 key

### 9.3 可靠性最佳实践

1. ✅ 生产环境必须开启持久化（推荐 AOF）
2. ✅ 使用主从复制，实现数据备份
3. ✅ 部署哨兵或集群，实现高可用
4. ✅ 设置 `min-replicas-to-write`，保证写入安全
5. ✅ 定期备份 RDB/AOF 文件
6. ✅ 监控磁盘空间，防止持久化失败
7. ✅ 设置合理的 `repl-backlog-size`

### 9.4 运维最佳实践

1. ✅ 使用配置管理工具（Ansible、Salt 等）管理配置
2. ✅ 建立完善的监控体系（Prometheus + Grafana）
3. ✅ 设置告警规则，及时发现问题
4. ✅ 定期进行性能测试和压力测试
5. ✅ 制定应急预案，演练故障转移流程
6. ✅ 记录配置变更，便于问题排查
7. ✅ 定期审查和优化配置

## 十、参考资源

- [Redis 官方文档](https://redis.io/documentation)
- [Redis 配置文件详解](https://redis.io/topics/config)
- [Redis 最佳实践](https://redis.io/topics/admin)
- [Redis Cluster 规范](https://redis.io/topics/cluster-spec)
- [Redis Sentinel 文档](https://redis.io/topics/sentinel)

---

