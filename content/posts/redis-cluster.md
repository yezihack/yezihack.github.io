---
title: "Redis 集群完全指南：从原理到实战"
date: 2025-10-17T09:32:51+08:00
lastmod: 2025-10-17T09:32:51+08:00
draft: false
tags: ["redis", "中间件", "集群"]
categories: ["中间件"]
author: "百里"
comment: false
toc: true
reward: true
---

## 目录

1. [为什么需要 Redis 集群](#1-为什么需要-redis-集群)
2. [Redis 集群核心概念](#2-redis-集群核心概念)
3. [集群架构深度解析](#3-集群架构深度解析)
4. [搭建第一个 Redis 集群](#4-搭建第一个-redis-集群)
5. [集群操作命令大全](#5-集群操作命令大全)
6. [数据分片与路由](#6-数据分片与路由)
7. [故障检测与自动恢复](#7-故障检测与自动恢复)
8. [集群扩容与缩容](#8-集群扩容与缩容)
9. [性能优化与最佳实践](#9-性能优化与最佳实践)
10. [常见问题与故障排查](#10-常见问题与故障排查)

---

## 1. 为什么需要 Redis 集群

### 1.1 单机 Redis 的局限性

**问题一：容量瓶颈**
```
单机 Redis 内存上限：
- 理论上限：512GB（受操作系统限制）
- 实际生产：通常 32GB-64GB
- 问题：业务数据超过单机容量怎么办？
```

**问题二：性能瓶颈**
```
单机 QPS 极限：
- 读操作：约 10万 QPS
- 写操作：约 8万 QPS
- 问题：高并发场景无法满足
```

**问题三：可用性问题**
```
单点故障：
- 主机宕机 → 服务完全不可用
- 硬件故障 → 数据可能丢失
- 维护升级 → 必须停机
```

### 1.2 Redis 集群的优势

| 特性 | 单机 Redis | 主从复制 | Redis 集群 |
|------|-----------|---------|-----------|
| **数据容量** | 受限于单机内存 | 受限于单机内存 | ✅ 水平扩展，无限容量 |
| **读性能** | 约 10万 QPS | ✅ 可扩展（主从分离） | ✅ 线性扩展 |
| **写性能** | 约 8万 QPS | 受限于主节点 | ✅ 线性扩展 |
| **高可用** | ❌ 单点故障 | ⚠️ 需要 Sentinel | ✅ 自动故障转移 |
| **数据分片** | ❌ 不支持 | ❌ 不支持 | ✅ 自动分片 |

---

## 2. Redis 集群核心概念

### 2.1 什么是 Redis 集群？

Redis 集群是 Redis 的**分布式实现**，它具有以下特点：

```
┌─────────────────────────────────────────────┐
│         Redis Cluster (集群)                 │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Master1 │  │ Master2 │  │ Master3 │    │ → 数据分片
│  │ 5461槽  │  │ 5461槽  │  │ 5462槽  │    │
│  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │          │
│  ┌────┴────┐  ┌───┴─────┐ ┌────┴────┐    │
│  │ Slave1  │  │ Slave2  │ │ Slave3  │    │ → 高可用
│  └─────────┘  └─────────┘ └─────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.2 核心术语

#### 节点 (Node)
```
节点是集群的基本组成单元
- 每个节点都是一个 Redis 实例
- 节点之间通过 Gossip 协议通信
- 每个节点都保存集群的完整拓扑信息
```

#### 槽位 (Slot)
```
Redis 集群的核心概念：
- 总共 16384 个槽位 (0-16383)
- 每个键通过 CRC16 算法映射到一个槽位
- 每个 Master 节点负责一部分槽位
- 槽位可以在节点间迁移
```

**计算公式：**
```python
slot = CRC16(key) % 16384
```

#### 主从复制 (Master-Slave)
```
Master (主节点)：
- 处理读写请求
- 负责槽位的数据存储

Slave (从节点)：
- 复制 Master 的数据
- Master 故障时自动提升为 Master
- 可以分担读请求（需配置）
```

### 2.3 哈希槽分配示例

**3个 Master 节点的标准分配：**
```
Master1: 0-5460     (5461个槽)
Master2: 5461-10922 (5461个槽)
Master3: 10923-16383 (5461个槽)
```

**数据存储示例：**
```bash
# 键 "user:1000" 的存储位置
CRC16("user:1000") = 52143
52143 % 16384 = 2799
→ 槽位 2799 在 Master1 (0-5460)
→ 数据存储在 Master1

# 键 "order:2000" 的存储位置
CRC16("order:2000") = 31324
31324 % 16384 = 14940
→ 槽位 14940 在 Master3 (10923-16383)
→ 数据存储在 Master3
```

---

## 3. 集群架构深度解析

### 3.1 集群通信机制

#### Gossip 协议

```
节点间通信方式：
1. MEET：节点加入集群
2. PING：心跳检测（每秒一次）
3. PONG：响应 PING
4. FAIL：标记节点失败
```

**通信端口：**
```
- 客户端通信端口：6379
- 集群总线端口：16379 (客户端端口 + 10000)
```

**通信流程：**
```
Node1 ──PING──→ Node2
      ←─PONG──┘

携带信息：
- 节点自身状态
- 负责的槽位信息
- 其他节点的状态
- 槽位迁移进度
```

### 3.2 数据分片原理

#### 为什么是 16384 个槽？

```
原因一：Gossip 协议效率
- 心跳包需要携带槽位信息
- 16384 个槽位 = 2KB 位图
- 更多槽位会增加网络开销

原因二：集群规模
- Redis 官方推荐最大 1000 个节点
- 16384 / 1000 ≈ 16 个槽/节点
- 足够均匀分配

原因三：CRC16 算法
- CRC16 输出范围：0-65535
- 取模 16384 分布更均匀
```

#### 哈希标签 (Hash Tag)

```
问题：多个相关的键可能分散在不同节点
解决：使用哈希标签强制键存储在同一槽位

语法：{标签}
示例：
  user:{1000}:name
  user:{1000}:age
  user:{1000}:email

计算：只对 {} 中的内容计算哈希
  CRC16("1000") % 16384
  → 所有键都在同一槽位
```

**实际应用：**
```bash
# 用户相关数据
SET user:{10086}:profile "张三"
SET user:{10086}:balance "1000"
SET user:{10086}:vip "true"

# 订单相关数据
SET order:{20240101}:total "999"
SET order:{20240101}:items "商品列表"

# 好处：可以使用事务或 Lua 脚本
MULTI
SET user:{10086}:balance "900"
SET order:{20240101}:paid "true"
EXEC
```

### 3.3 请求路由机制

#### MOVED 重定向

```
场景：客户端连接错误的节点

流程：
1. 客户端连接 Node1
2. 请求 GET key1
3. key1 的槽位在 Node2
4. Node1 返回：-MOVED 3999 192.168.1.2:6379
5. 客户端重新连接 Node2
6. 执行命令成功
```

```
客户端 ──GET key1──→ Node1 (槽位 0-5460)
       ←─MOVED─────┘

       ──GET key1──→ Node2 (槽位 5461-10922)
       ←──"value"──┘
```

#### ASK 重定向

```
场景：槽位正在迁移中

流程：
1. 槽位 3999 正在从 Node1 迁移到 Node2
2. 客户端请求 GET key1
3. Node1 检查 key1 是否已迁移
4. 如果已迁移，返回：-ASK 3999 192.168.1.2:6379
5. 客户端向 Node2 发送：ASKING
6. 客户端执行：GET key1
```

**MOVED vs ASK：**
| 特性 | MOVED | ASK |
|------|-------|-----|
| 含义 | 槽位已永久迁移 | 槽位正在迁移 |
| 客户端操作 | 更新槽位映射 | 临时重定向 |
| 持续时间 | 永久 | 迁移完成后消失 |

### 3.4 故障检测机制

#### 主观下线 (PFAIL)

```
单个节点认为某节点失败：
1. Node1 向 Node2 发送 PING
2. 超过 cluster-node-timeout 未收到 PONG
3. Node1 标记 Node2 为 PFAIL
```

#### 客观下线 (FAIL)

```
多数节点认为某节点失败：
1. Node1 标记 Node2 为 PFAIL
2. Node1 向其他节点询问 Node2 状态
3. 超过半数节点认为 Node2 失败
4. Node2 被标记为 FAIL
5. 触发故障转移
```

**判断公式：**
```
FAIL = (PFAIL 数量 > 集群节点总数 / 2)
```

---

## 4. 搭建第一个 Redis 集群

### 4.1 准备工作

**环境要求：**
```bash
- Redis 版本：≥ 5.0（推荐 7.x）
- 服务器：至少 3 台（推荐 6 台）
- 网络：节点间互相访问
- 端口：6379 和 16379
```

### 4.2 方式一：Docker Compose 快速搭建

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  redis-1:
    image: redis:7.2-alpine
    container_name: redis-1
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6379:6379"
      - "16379:16379"
    volumes:
      - redis-1-data:/data

  redis-2:
    image: redis:7.2-alpine
    container_name: redis-2
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6380
    ports:
      - "6380:6380"
      - "16380:16380"
    volumes:
      - redis-2-data:/data

  redis-3:
    image: redis:7.2-alpine
    container_name: redis-3
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6381
    ports:
      - "6381:6381"
      - "16381:16381"
    volumes:
      - redis-3-data:/data

  redis-4:
    image: redis:7.2-alpine
    container_name: redis-4
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6382
    ports:
      - "6382:6382"
      - "16382:16382"
    volumes:
      - redis-4-data:/data

  redis-5:
    image: redis:7.2-alpine
    container_name: redis-5
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6383
    ports:
      - "6383:6383"
      - "16383:16383"
    volumes:
      - redis-5-data:/data

  redis-6:
    image: redis:7.2-alpine
    container_name: redis-6
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6384
    ports:
      - "6384:6384"
      - "16384:16384"
    volumes:
      - redis-6-data:/data

volumes:
  redis-1-data:
  redis-2-data:
  redis-3-data:
  redis-4-data:
  redis-5-data:
  redis-6-data:
```

**启动集群：**
```bash
# 1. 启动所有节点
docker-compose up -d

# 2. 查看容器状态
docker-compose ps

# 3. 创建集群
docker exec -it redis-1 redis-cli --cluster create \
  172.17.0.2:6379 \
  172.17.0.3:6380 \
  172.17.0.4:6381 \
  172.17.0.5:6382 \
  172.17.0.6:6383 \
  172.17.0.7:6384 \
  --cluster-replicas 1

# 4. 验证集群
docker exec -it redis-1 redis-cli -c -p 6379 cluster nodes
```

### 4.3 方式二：手动搭建（生产环境）

#### 步骤 1：安装 Redis

```bash
# CentOS/RHEL
sudo yum install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# 编译安装
wget https://download.redis.io/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable
make
sudo make install
```

#### 步骤 2：配置节点

**创建配置文件：**
```bash
mkdir -p /etc/redis/cluster/{7000,7001,7002,7003,7004,7005}
```

**/etc/redis/cluster/7000/redis.conf：**
```conf
# 基础配置
port 7000
bind 0.0.0.0
protected-mode no
daemonize yes
pidfile /var/run/redis_7000.pid
logfile /var/log/redis/redis_7000.log
dir /var/lib/redis/7000

# 集群配置
cluster-enabled yes
cluster-config-file nodes-7000.conf
cluster-node-timeout 5000

# 持久化
appendonly yes
appendfilename "appendonly.aof"

# 性能优化
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

**复制配置到其他节点：**
```bash
for port in 7001 7002 7003 7004 7005; do
  sed "s/7000/${port}/g" /etc/redis/cluster/7000/redis.conf > /etc/redis/cluster/${port}/redis.conf
done
```

#### 步骤 3：启动节点

```bash
# 创建数据目录
for port in 7000 7001 7002 7003 7004 7005; do
  mkdir -p /var/lib/redis/${port}
done

# 启动所有节点
for port in 7000 7001 7002 7003 7004 7005; do
  redis-server /etc/redis/cluster/${port}/redis.conf
done

# 检查进程
ps aux | grep redis-server
```

#### 步骤 4：创建集群

```bash
redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  127.0.0.1:7003 \
  127.0.0.1:7004 \
  127.0.0.1:7005 \
  --cluster-replicas 1
```

**输出示例：**
```
>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
Adding replica 127.0.0.1:7004 to 127.0.0.1:7000
Adding replica 127.0.0.1:7005 to 127.0.0.1:7001
Adding replica 127.0.0.1:7003 to 127.0.0.1:7002

Can I set the above configuration? (type 'yes' to accept): yes

>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join
.....
>>> Performing Cluster Check (using node 127.0.0.1:7000)
M: a1b2c3d4... 127.0.0.1:7000
   slots:[0-5460] (5461 slots) master
   1 additional replica(s)
...
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

### 4.4 方式三：使用 Bitnami Redis Cluster（生产环境）

#### 部署集群

```sh
# 或者先添加 Bitnami 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 创建 values-redis-cluster.yaml 文件
cat > values-redis-cluster.yaml <<EOF
# 设置集群节点数量
cluster:
  nodes: 6  # 默认 6 个节点（3主3从）
  replicas: 1  # 每个主节点有 1 个从节点

# 配置持久化存储
persistence:
  enabled: true
  size: 8Gi
  storageClass: "local-path"  # 使用默认 StorageClass

# 设置 Redis 密码
password: "your-secure-password"

# 资源限制
resources:
  limits:
    cpu: 250m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
EOF

# 部署 Redis 集群
helm upgrade -i redis bitnami/redis-cluster --version 13.0.4 -f values-redis-cluster.yaml
```

#### 扩容节点

```bash
# 实现动态扩容节点

cat > values-expand-cluster.yaml <<EOF
cluster:
  init: true

  ## 扩容方案：从 6 节点扩到 12 节点
  ## 原配置：3 master + 1 replica (nodes=6, replicas=1)
  ## 新配置：6 master + 1 replica (nodes=12, replicas=1)
  ##
  nodes: 12
  replicas: 1

password: "your-secure-password"

# 配置持久化存储
persistence:
  enabled: true
  size: 8Gi
  storageClass: "local-path"  # 使用默认 StorageClass

# 资源限制
resources:
  limits:
    cpu: 250m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

  ## 关键：扩容时需要启用 update 配置
  update:
    ## 设置为 true，启用节点添加功能
    addNodes: true

    ## 当前部署的节点数（扩容前的数量）
    currentNumberOfNodes: 6

    ## 当前部署的副本数（扩容前的数量）
    currentNumberOfReplicas: 1
EOF

# 扩容节点
helm upgrade -i redis bitnami/redis-cluster --version 13.0.4 -f values-expand-cluster.yaml
```
---

## 5. 集群操作命令大全

### 5.1 查看集群信息

#### CLUSTER INFO
```bash
redis-cli -c -p 7000 cluster info
```

**输出解析：**
```
cluster_state:ok                    # 集群状态：ok（正常）/ fail（故障）
cluster_slots_assigned:16384        # 已分配槽位数
cluster_slots_ok:16384              # 正常槽位数
cluster_slots_pfail:0               # 疑似故障槽位数
cluster_slots_fail:0                # 故障槽位数
cluster_known_nodes:6               # 集群节点总数
cluster_size:3                      # 集群分片数（Master数量）
cluster_current_epoch:6             # 当前配置纪元
cluster_my_epoch:1                  # 本节点配置纪元
cluster_stats_messages_sent:12345   # 发送消息总数
cluster_stats_messages_received:12340 # 接收消息总数
```

#### CLUSTER NODES
```bash
redis-cli -c -p 7000 cluster nodes
```

**输出格式：**
```
<节点ID> <IP:Port@总线端口> <标志> <主节点ID> <PING发送时间> <PONG接收时间> <配置纪元> <连接状态> <槽位范围>
```

**示例输出：**
```
a1b2c3d4e5f6... 127.0.0.1:7000@17000 myself,master - 0 1640000000 1 connected 0-5460
b2c3d4e5f6a1... 127.0.0.1:7001@17001 master - 0 1640000001 2 connected 5461-10922
c3d4e5f6a1b2... 127.0.0.1:7002@17002 master - 0 1640000002 3 connected 10923-16383
d4e5f6a1b2c3... 127.0.0.1:7003@17003 slave c3d4e5f6a1b2 0 1640000003 3 connected
e5f6a1b2c3d4... 127.0.0.1:7004@17004 slave a1b2c3d4e5f6 0 1640000004 1 connected
f6a1b2c3d4e5... 127.0.0.1:7005@17005 slave b2c3d4e5f6a1 0 1640000005 2 connected
```

**标志说明：**
- `myself`: 当前连接的节点
- `master`: 主节点
- `slave`: 从节点
- `fail`: 节点失败
- `fail?`: 疑似失败（PFAIL）
- `handshake`: 握手中
- `noaddr`: 地址未知

### 5.2 槽位管理

#### 查看槽位分配

```bash
# 查看所有槽位分配
redis-cli -c -p 7000 cluster slots
```

**输出示例：**
```
1) 1) (integer) 0              # 起始槽位
   2) (integer) 5460           # 结束槽位
   3) 1) "127.0.0.1"          # Master IP
      2) (integer) 7000        # Master Port
      3) "a1b2c3d4..."         # Master ID
   4) 1) "127.0.0.1"          # Slave IP
      2) (integer) 7004        # Slave Port
      3) "e5f6a1b2..."         # Slave ID
```

#### 查看键所在槽位

```bash
# 计算键的槽位
redis-cli -c -p 7000 cluster keyslot "user:1000"
# Output: (integer) 2799

# 统计槽位中的键数量
redis-cli -c -p 7000 cluster countkeysinslot 2799
# Output: (integer) 5

# 获取槽位中的键（最多返回 count 个）
redis-cli -c -p 7000 cluster getkeysinslot 2799 10
```

#### 手动分配槽位

```bash
# 将槽位 100-200 分配给指定节点
redis-cli -c -p 7000 cluster addslots 100 101 102 ... 200

# 批量分配
redis-cli -c -p 7000 cluster addslots {100..200}

# 删除槽位分配
redis-cli -c -p 7000 cluster delslots 100 101 102
```

### 5.3 节点管理

#### 添加节点

```bash
# 添加新的 Master 节点
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

# 添加新的 Slave 节点
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 \
  --cluster-slave \
  --cluster-master-id <master节点ID>

# 或者先添加节点，再设置为从节点
redis-cli -c -p 7007 cluster replicate <master节点ID>
```

#### 删除节点

```bash
# 1. 如果是 Master，先迁移槽位（见下文）
# 2. 删除节点
redis-cli --cluster del-node 127.0.0.1:7000 <节点ID>

# 注意：节点ID 可以从 CLUSTER NODES 获取
```

#### 忘记节点（强制移除）

```bash
# 在集群的每个节点上执行
redis-cli -c -p 7000 cluster forget <节点ID>
```

### 5.4 故障转移

#### 手动故障转移

```bash
# 在 Slave 节点执行
redis-cli -c -p 7004 cluster failover

# 强制故障转移（即使数据不同步）
redis-cli -c -p 7004 cluster failover force

# 接管故障转移（Master 已下线）
redis-cli -c -p 7004 cluster failover takeover
```

**三种模式区别：**
```
1. FAILOVER（默认）
   - 等待与 Master 数据同步完成
   - 适用于计划内维护

2. FAILOVER FORCE
   - 不等待数据同步
   - 可能丢失少量数据
   - 适用于 Master 响应慢

3. FAILOVER TAKEOVER
   - 强制接管，不需要多数节点同意
   - 适用于 Master 完全不可达
   - 风险最高
```

### 5.5 集群重置

```bash
# 软重置：保留节点ID和配置纪元
redis-cli -c -p 7000 cluster reset soft

# 硬重置：完全清空集群信息
redis-cli -c -p 7000 cluster reset hard
```

---

## 6. 数据分片与路由

### 6.1 客户端路由

#### 智能客户端（推荐）

**Python 示例（redis-py-cluster）：**
```python
from rediscluster import RedisCluster

# 连接集群
startup_nodes = [
    {"host": "127.0.0.1", "port": "7000"},
    {"host": "127.0.0.1", "port": "7001"},
    {"host": "127.0.0.1", "port": "7002"}
]

rc = RedisCluster(
    startup_nodes=startup_nodes,
    decode_responses=True,
    skip_full_coverage_check=True  # 允许部分槽位不可用
)

# 客户端会自动维护槽位映射
rc.set("user:1000", "张三")
print(rc.get("user:1000"))

# 批量操作（使用 pipeline）
pipe = rc.pipeline()
pipe.set("user:1001", "李四")
pipe.set("user:1002", "王五")
pipe.execute()
```

**Java 示例（Jedis）：**
```java
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;

Set<HostAndPort> nodes = new HashSet<>();
nodes.add(new HostAndPort("127.0.0.1", 7000));
nodes.add(new HostAndPort("127.0.0.1", 7001));
nodes.add(new HostAndPort("127.0.0.1", 7002));

JedisCluster jedis = new JedisCluster(nodes);

// 自动路由
jedis.set("user:1000", "张三");
System.out.println(jedis.get("user:1000"));
```

#### 手动路由（了解）

```bash
# 1. 计算槽位
redis-cli -c cluster keyslot "user:1000"
# Output: 2799

# 2. 查找槽位所在节点
redis-cli -c -p 7000 cluster nodes | grep "0-5460"

# 3. 连接对应节点
redis-cli -c -p 7000 get "user:1000"
```

### 6.2 哈希标签实战

#### 场景 1：用户会话管理

```bash
# 同一用户的所有会话数据存储在一起
SET session:{user:10086}:token "abc123"
SET session:{user:10086}:expire "1640000000"
SET session:{user:10086}:device "iPhone"

# 使用事务
MULTI
SET session:{user:10086}:login_time "2024-01-01"
EXPIRE session:{user:10086}:login_time 3600
EXEC
```

#### 场景 2：分布式锁

```bash
# 同一资源的锁信息存储在一起
SET lock:{resource:order_12345}:owner "worker-1"
SET lock:{resource:order_12345}:expire "1640000000"

# 使用 Lua 脚本原子操作
EVAL "..." 2 lock:{resource:order_12345}:owner lock:{resource:order_12345}:expire
```

#### 场景 3：商品库存

```bash
# 同一商品的库存信息
SET product:{SKU:12345}:stock "100"
SET product:{SKU:12345}:reserved "20"
SET product:{SKU:12345}:sold "80"

# 扣减库存（原子操作）
EVAL "
  local stock = redis.call('GET', KEYS[1])
  if tonumber(stock) >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    redis.call('INCRBY', KEYS[2], ARGV[1])
    return 1
  else
    return 0
  end
" 2 product:{SKU:12345}:stock product:{SKU:12345}:sold 5
```

### 6.3 多键操作限制与解决方案

#### 问题：跨槽位操作

```bash
# ❌ 错误：键在不同槽位
redis-cli -c -p 7000
> MGET user:1000 user:2000 user:3000
(error) CROSSSLOT Keys in request don't hash to the same slot

> MSET user:1000 "张三" user:2000 "李四"
(error) CROSSSLOT Keys in request don't hash to the same slot
```

#### 解决方案 1：使用哈希标签

```bash
# ✅ 正确：使用相同标签
MGET user:{batch1}:1000 user:{batch1}:2000 user:{batch1}:3000
MSET user:{batch1}:1000 "张三" user:{batch1}:2000 "李四"
```

#### 解决方案 2：使用 Pipeline

```python
# Python 示例
pipe = rc.pipeline()
pipe.get("user:1000")
pipe.get("user:2000")
pipe.get("user:3000")
results = pipe.execute()  # 自动路由到不同节点
```

#### 解决方案 3：客户端聚合

```python
# 手动聚合多个节点的数据
def mget_cluster(keys):
    results = {}
    for key in keys:
        results[key] = rc.get(key)
    return results

values = mget_cluster(["user:1000", "user:2000", "user:3000"])
```

---

## 7. 故障检测与自动恢复

### 7.1 故障检测流程

#### 完整流程图

```
1. 心跳检测
   Node1 ──PING──→ Node2 (每秒一次)
         ←─PONG──┘

2. 超时判断
   Node1: "5秒没收到 Node2 的 PONG"
   → 标记 Node2 为 PFAIL (主观下线)

3. 询问其他节点
   Node1 ──询问Node2状态──→ Node3, Node4, Node5
         ←──"我也认为下线"──┘

4. 投票判断
   超过半数节点 (3/5) 认为 Node2 下线
   → 标记 Node2 为 FAIL (客观下线)

5. 触发故障转移
   Node2 的 Slave 发起选举
   → 成为新 Master
```

### 7.2 主从切换详细步骤

#### 步骤 1：检测 Master 下线

```bash
# 模拟 Master 故障
redis-cli -c -p 7000 DEBUG SLEEP 30

# 其他节点日志
[7001] Node 7000 marked as PFAIL
[7001] Asking other nodes about 7000
[7001] Received enough PFAIL reports, marking 7000 as FAIL
```

#### 步骤 2：Slave 选举

**选举条件：**
```
1. Slave 必须健康在线
2. 数据复制偏移量最大（数据最新）
3. 节点 ID 较小（作为 Tie-breaker）
```

**选举流程：**
```
1. Slave 向所有 Master 节点请求投票
2. 每个 Master 只能投一票
3. 获得多数票的 Slave 当选
4. 当选 Slave 提升为 Master
```

#### 步骤 3：更新集群配置

```bash
# 自动执行的操作
1. 新 Master 接管原 Master 的槽位
2. 向集群广播配置变更
3. 其他 Slave 切换复制目标
4. 客户端更新路由表
```

#### 步骤 4：旧 Master 恢复

```bash
# 旧 Master 重新上线后
1. 发现集群配置变更
2. 自动降级为 Slave
3. 开始复制新 Master 的数据
```

### 7.3 实战演练：模拟故障恢复

#### 演练 1：Master 宕机

```bash
# 1. 查看当前集群状态
redis-cli -c -p 7000 cluster nodes

# 输出示例
a1b2c3... 127.0.0.1:7000@17000 master - 0 1640000000 1 connected 0-5460
e5f6a1... 127.0.0.1:7004@17004 slave a1b2c3... 0 1640000000 1 connected

# 2. 停止 Master (7000)
docker stop redis-1
# 或
redis-cli -c -p 7000 shutdown

# 3. 观察故障转移（15-30秒内）
watch -n 1 'redis-cli -c -p 7001 cluster nodes'

# 4. 验证 Slave 提升
redis-cli -c -p 7004 cluster nodes

# 输出：7004 已变为 master
e5f6a1... 127.0.0.1:7004@17004 master - 0 1640000030 7 connected 0-5460

# 5. 重启旧 Master
docker start redis-1

# 6. 观察降级为 Slave
redis-cli -c -p 7000 cluster nodes
a1b2... 127.0.0.1:7000@17000 slave e5f6a1... 0 1640000060 7 connected
```

#### 演练 2：网络分区

```bash
# 1. 模拟网络分区（使用 iptables）
# 隔离节点 7000
sudo iptables -A INPUT -p tcp --dport 7000 -j DROP
sudo iptables -A INPUT -p tcp --dport 17000 -j DROP

# 2. 观察集群行为
# 节点 7000 被标记为 FAIL
redis-cli -c -p 7001 cluster nodes

# 3. 恢复网络
sudo iptables -F

# 4. 验证节点重新加入
redis-cli -c -p 7000 cluster nodes
```

### 7.4 配置参数优化

#### cluster-node-timeout

```conf
# 默认值：5000ms
cluster-node-timeout 5000

# 影响：
- 值过小：误判频繁，不必要的故障转移
- 值过大：故障恢复时间长

# 推荐：
- 内网环境：5000-15000ms
- 跨机房：15000-30000ms
```

#### cluster-replica-validity-factor

```conf
# 默认值：10
cluster-replica-validity-factor 10

# 含义：
Slave 数据落后时间 > (node-timeout * validity-factor)
→ Slave 不参与故障转移

# 示例：
node-timeout = 5s, validity-factor = 10
→ 数据落后超过 50s 的 Slave 不能提升

# 设为 0：禁用检查（不推荐）
```

#### cluster-require-full-coverage

```conf
# 默认值：yes
cluster-require-full-coverage yes

# yes: 任何槽位不可用 → 整个集群拒绝服务
# no:  部分槽位不可用 → 其他槽位继续服务

# 推荐：
- 生产环境：no（提高可用性）
- 测试环境：yes（严格检查）
```

---

## 8. 集群扩容与缩容

### 8.1 添加 Master 节点（扩容）

#### 完整流程

```bash
# 步骤 1：启动新节点
redis-server --port 7006 \
  --cluster-enabled yes \
  --cluster-config-file nodes-7006.conf \
  --daemonize yes

# 步骤 2：加入集群（作为 Master）
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

# 步骤 3：检查节点状态
redis-cli -c -p 7000 cluster nodes
# 输出：新节点没有分配槽位
f1g2h3... 127.0.0.1:7006@17006 master - 0 1640000000 0 connected

# 步骤 4：重新分配槽位
redis-cli --cluster reshard 127.0.0.1:7000

# 交互式提示
How many slots do you want to move? 4096  # 从3个节点分别迁移
What is the receiving node ID? f1g2h3...   # 新节点ID
Source node #1: all                        # 从所有节点迁移
Do you want to proceed? yes

# 步骤 5：验证槽位分配
redis-cli -c -p 7000 cluster nodes
```

#### 自动化脚本

```bash
#!/bin/bash
# add_master.sh

NEW_PORT=$1
CLUSTER_NODE="127.0.0.1:7000"

echo "启动新节点: $NEW_PORT"
redis-server --port $NEW_PORT \
  --cluster-enabled yes \
  --cluster-config-file nodes-${NEW_PORT}.conf \
  --daemonize yes

sleep 2

echo "加入集群"
redis-cli --cluster add-node 127.0.0.1:$NEW_PORT $CLUSTER_NODE

echo "自动分配槽位"
redis-cli --cluster rebalance $CLUSTER_NODE \
  --cluster-use-empty-masters

echo "完成！"
redis-cli -c -p 7000 cluster nodes
```

### 8.2 添加 Slave 节点

```bash
# 方式 1：添加时指定 Master
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 \
  --cluster-slave \
  --cluster-master-id a1b2c3d4e5f6...

# 方式 2：先添加后指定
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000
redis-cli -c -p 7007 cluster replicate a1b2c3d4e5f6...

# 方式 3：自动分配（给 Slave 最少的 Master）
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 \
  --cluster-slave
```

### 8.3 删除节点（缩容）

#### 删除 Slave 节点

```bash
# 直接删除（简单）
redis-cli --cluster del-node 127.0.0.1:7000 <slave节点ID>
```

#### 删除 Master 节点

```bash
# 步骤 1：迁移槽位到其他节点
redis-cli --cluster reshard 127.0.0.1:7000

# 交互式提示
How many slots? 5461                    # 该节点的槽位总数
What is the receiving node ID? b2c3... # 目标节点
Source node #1: a1b2...                # 源节点（要删除的节点）
Source node #2: done
Do you want to proceed? yes

# 步骤 2：验证槽位已清空
redis-cli -c -p 7000 cluster nodes | grep a1b2...
# 应显示：connected (无槽位范围)

# 步骤 3：删除节点
redis-cli --cluster del-node 127.0.0.1:7000 a1b2c3d4e5f6...

# 步骤 4：停止节点进程
redis-cli -p 7000 shutdown
```

### 8.4 槽位迁移原理

#### 迁移过程

```
┌─────────────────────────────────────────┐
│  槽位 1000-2000 从 Node1 迁移到 Node2  │
└─────────────────────────────────────────┘

1. 标记槽位迁移中
   Node1: MIGRATING 1000-2000 → Node2
   Node2: IMPORTING 1000-2000 ← Node1

2. 逐个迁移键
   For each key in slot 1000:
     Node1: DUMP key
     Node2: RESTORE key value
     Node1: DEL key

3. 完成迁移
   Node1: 删除槽位 1000-2000
   Node2: 添加槽位 1000-2000
   广播配置变更
```

#### 手动迁移单个槽位

```bash
# 1. 设置源节点为 MIGRATING 状态
redis-cli -c -p 7000 cluster setslot 1000 migrating b2c3d4...

# 2. 设置目标节点为 IMPORTING 状态
redis-cli -c -p 7001 cluster setslot 1000 importing a1b2c3...

# 3. 获取槽位中的键
keys=$(redis-cli -c -p 7000 cluster getkeysinslot 1000 100)

# 4. 迁移每个键
for key in $keys; do
  redis-cli -c -p 7000 migrate 127.0.0.1 7001 "$key" 0 5000
done

# 5. 确认目标节点拥有槽位
redis-cli -c -p 7001 cluster setslot 1000 node b2c3d4...

# 6. 确认源节点释放槽位
redis-cli -c -p 7000 cluster setslot 1000 node b2c3d4...
```

### 8.5 在线扩容最佳实践

#### 1. 评估容量需求

```python
# 计算需要的节点数
当前数据量 = 100GB
单节点容量 = 32GB
安全系数 = 0.7

需要节点数 = ceil(100 / (32 * 0.7)) = 5 个 Master
```

#### 2. 渐进式扩容

```bash
# 不要一次性添加太多节点
# 推荐：每次添加 1-2 个节点

# 第一批：添加 1 个节点
./add_master.sh 7006

# 等待数据迁移完成（监控 cluster info）
redis-cli -c -p 7000 cluster info | grep cluster_state

# 第二批：添加第 2 个节点
./add_master.sh 7007
```

#### 3. 监控迁移进度

```bash
# 监控脚本
#!/bin/bash
while true; do
  echo "=== $(date) ==="
  redis-cli -c -p 7000 info replication | grep master_repl_offset
  redis-cli -c -p 7000 cluster info | grep -E "cluster_state|cluster_slots"
  sleep 5
done
```

---

## 9. 性能优化与最佳实践

### 9.1 性能优化配置

#### Redis 配置优化

```conf
# 1. 内存优化
maxmemory 8gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# 2. 持久化优化
# AOF
appendonly yes
appendfsync everysec          # 性能与安全的平衡
no-appendfsync-on-rewrite yes # 重写时不同步

# RDB
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error no

# 3. 网络优化
tcp-backlog 511
tcp-keepalive 300
timeout 0

# 4. 慢查询日志
slowlog-log-slower-than 10000  # 10ms
slowlog-max-len 128

# 5. 客户端输出缓冲区
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

#### 系统参数优化

```bash
# /etc/sysctl.conf
net.core.somaxconn = 511
net.ipv4.tcp_max_syn_backlog = 511
vm.overcommit_memory = 1

# 透明大页
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 应用配置
sysctl -p
```

### 9.2 客户端优化

#### 连接池配置

**Python (redis-py-cluster):**
```python
from rediscluster import RedisCluster

rc = RedisCluster(
    startup_nodes=nodes,
    max_connections=50,           # 每个节点最大连接数
    max_connections_per_node=True,
    socket_timeout=5,
    socket_connect_timeout=5,
    socket_keepalive=True,
    decode_responses=True
)
```

**Java (Jedis):**
```java
JedisPoolConfig config = new JedisPoolConfig();
config.setMaxTotal(100);        // 最大连接数
config.setMaxIdle(20);          // 最大空闲连接
config.setMinIdle(10);          // 最小空闲连接
config.setMaxWaitMillis(3000);  // 获取连接超时
config.setTestOnBorrow(true);   // 获取时测试连接

JedisCluster jedis = new JedisCluster(nodes, 3000, 3000, 5, password, config);
```

#### Pipeline 批量操作

```python
# ❌ 低效：逐个操作
for i in range(1000):
    rc.set(f"key:{i}", f"value:{i}")
# 耗时：~2000ms (每次 RTT ~2ms)

# ✅ 高效：使用 Pipeline
pipe = rc.pipeline()
for i in range(1000):
    pipe.set(f"key:{i}", f"value:{i}")
pipe.execute()
# 耗时：~50ms (批量发送)
```

### 9.3 数据结构选择

#### String vs Hash

```bash
# 场景：存储用户信息

# 方式 1：多个 String（不推荐）
SET user:10086:name "张三"
SET user:10086:age "25"
SET user:10086:email "zhang@example.com"
# 内存：~300 bytes

# 方式 2：单个 Hash（推荐）
HSET user:10086 name "张三" age "25" email "zhang@example.com"
# 内存：~100 bytes (节省 66%)
```

#### Set vs Sorted Set

```bash
# 场景：好友列表

# 方式 1：Set（无序）
SADD user:10086:friends 10087 10088 10089
SISMEMBER user:10086:friends 10087  # O(1)

# 方式 2：Sorted Set（需要排序）
ZADD user:10086:friends 1640000001 10087 1640000002 10088
ZRANGE user:10086:friends 0 -1  # 按时间排序
```

### 9.4 键设计规范

#### 命名规范

```bash
# ✅ 推荐格式
业务:对象:ID:属性

# 示例
user:profile:10086:name
order:info:20240101:total
product:stock:SKU12345:count
cache:homepage:banner:list

# ❌ 不推荐
user_10086_name              # 难以分类
very_long_key_name_is_bad    # 浪费内存
中文键名                      # 编码问题
```

#### 过期策略

```python
# 不同数据类型的 TTL 建议
TTL_CONFIG = {
    'cache:homepage': 300,        # 5分钟
    'cache:product': 3600,        # 1小时
    'session:user': 86400,        # 1天
    'lock:resource': 30,          # 30秒
    'temp:verification': 300,     # 5分钟
}

# 设置过期时间
rc.setex('cache:homepage:banner', 300, json.dumps(data))
```

### 9.5 监控指标

#### 关键指标

在线查询指标命令：

```bash
# 1. 性能指标
redis-cli -c -p 7000 info stats | grep -E "ops_per_sec|hit_rate"

# 2. 内存指标
redis-cli -c -p 7000 info memory | grep -E "used_memory|fragmentation"

# 3. 持久化指标
redis-cli -c -p 7000 info persistence | grep -E "rdb_last|aof_last"

# 4. 复制指标
redis-cli -c -p 7000 info replication | grep -E "master_repl|slave"

# 5. 集群指标
redis-cli -c -p 7000 cluster info
```

监控指标：

```yaml
# 1. 内存指标
- used_memory              # 已用内存
- used_memory_rss          # 物理内存
- mem_fragmentation_ratio  # 碎片率（建议<1.5）

# 2. 性能指标
- instantaneous_ops_per_sec  # QPS
- keyspace_hits              # 命中次数
- keyspace_misses            # 未命中次数
- hit_rate = hits / (hits + misses)  # 命中率（建议>90%）

# 3. 持久化指标
- rdb_last_save_time         # 最后RDB时间
- aof_current_size           # AOF文件大小
- aof_last_rewrite_time_sec  # AOF重写耗时

# 4. 集群指标
- cluster_state              # 集群状态（ok/fail）
- cluster_slots_assigned     # 已分配槽位（应为16384）
- cluster_known_nodes        # 已知节点数

# 5. 连接指标
- connected_clients          # 当前连接数
- blocked_clients            # 阻塞客户端数
- rejected_connections       # 拒绝连接数
```

#### Prometheus 监控

```yaml
# redis-exporter 配置
scrape_configs:
  - job_name: 'redis-cluster'
    static_configs:
      - targets:
        - redis-exporter:9121
    params:
      target:
        - redis://127.0.0.1:7000
        - redis://127.0.0.1:7001
        - redis://127.0.0.1:7002
```

#### ServiceMonitor示例

```yaml
# ServiceMonitor示例
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: redis-exporter
spec:
  selector:
    matchLabels:
      app: redis-exporter
  endpoints:
  - port: metrics
    interval: 30s
```


#### 告警规则示例

```yaml
groups:
- name: redis-alerts
  rules:
  # 内存使用率告警
  - alert: RedisMemoryHigh
    expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
    for: 5m
    annotations:
      summary: "Redis内存使用率超过90%"

  # 命中率告警
  - alert: RedisLowHitRate
    expr: redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) < 0.8
    for: 10m
    annotations:
      summary: "Redis命中率低于80%"

  # 集群状态告警
  - alert: RedisClusterDown
    expr: redis_cluster_state != 1
    for: 1m
    annotations:
      summary: "Redis集群状态异常"
```
---

## 10. 常见问题与故障排查

### 10.1 集群启动失败

#### 问题 1：Waiting for the cluster to join...

```bash
# 原因：节点无法相互通信

# 排查步骤
# 1. 检查端口是否监听
netstat -tlnp | grep redis

# 2. 检查防火墙
sudo iptables -L -n | grep 6379
sudo iptables -L -n | grep 16379

# 3. 测试连通性
redis-cli -h 127.0.0.1 -p 7000 ping
redis-cli -h 127.0.0.1 -p 7001 ping

# 解决方案
# 开放端口
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --permanent --add-port=16379/tcp
sudo firewall-cmd --reload
```

#### 问题 2：Node XXX is not empty

```bash
# 原因：节点已有数据或集群配置

# 解决方案
redis-cli -c -p 7000 cluster reset hard
redis-cli -c -p 7000 flushall
```

### 10.2 槽位异常

#### CLUSTERDOWN Hash slot not served

```bash
# 原因：部分槽位未分配或节点下线

# 排查
redis-cli -c -p 7000 cluster nodes
redis-cli -c -p 7000 cluster slots

# 解决方案 1：修复槽位分配
redis-cli --cluster fix 127.0.0.1:7000

# 解决方案 2：允许部分槽位不可用
redis-cli -c -p 7000 config set cluster-require-full-coverage no
```

### 10.3 数据不一致

#### 主从数据延迟

```bash
# 检查复制偏移量
redis-cli -c -p 7000 info replication

# Master
master_repl_offset:1234567

# Slave
redis-cli -c -p 7004 info replication
slave_repl_offset:1234500  # 延迟 67 字节

# 解决方案
# 1. 检查网络延迟
ping 从节点IP

# 2. 检查主节点负载
redis-cli -c -p 7000 info stats

# 3. 调整复制参数
repl-backlog-size 64mb
repl-timeout 60
```

### 10.4 性能问题

#### 慢查询分析

```bash
# 查看慢查询
redis-cli -c -p 7000 slowlog get 10

# 输出示例
1) 1) (integer) 3        # 日志ID
   2) (integer) 1640000000  # 时间戳
   3) (integer) 12000    # 执行时间(微秒)
   4) 1) "KEYS"          # 命令
      2) "user:*"

# 优化建议
# ❌ 避免使用 KEYS
KEYS user:*

# ✅ 使用 SCAN
SCAN 0 MATCH user:* COUNT 100
```

### 10.5 故障恢复演练

#### 完整恢复流程

```bash
# 场景：3主3从集群，Master1 彻底损坏

# 步骤 1：确认故障范围
redis-cli -c -p 7001 cluster nodes
# Master1 (7000) 和 Slave1 (7004) 都 FAIL

# 步骤 2：评估数据影响
redis-cli -c -p 7001 cluster slots
# 槽位 0-5460 不可用

# 步骤 3：启动新节点替换
redis-server --port 7008 \
  --cluster-enabled yes \
  --cluster-config-file nodes-7008.conf

# 步骤 4：加入集群
redis-cli --cluster add-node 127.0.0.1:7008 127.0.0.1:7001

# 步骤 5：分配槽位
redis-cli -c -p 7008 cluster addslots {0..5460}

# 步骤 6：从备份恢复数据（如果有）
redis-cli -c -p 7008 < backup.rdb

# 步骤 7：验证集群
redis-cli --cluster check 127.0.0.1:7001
```

---

## 总结

### Redis 集群核心要点

1. **分片机制**：16384 个槽位，CRC16 哈希算法
2. **高可用**：主从复制 + 自动故障转移
3. **去中心化**：Gossip 协议，无中心节点
4. **线性扩展**：水平扩展容量和性能

### 生产环境检查清单

- ✅ 至少 3 主 3 从配置
- ✅ 配置持久化（AOF + RDB）
- ✅ 启用密码认证和 ACL
- ✅ 设置合理的超时参数
- ✅ 配置监控和告警
- ✅ 定期备份数据
- ✅ 制定故障恢复预案
- ✅ 压力测试验证性能

### 进阶学习资源

- [Redis 官方文档](https://redis.io/docs/manual/scaling/)
- [Redis 集群规范](https://redis.io/docs/reference/cluster-spec/)
- [Redis 源码分析](https://github.com/redis/redis)

---

---

## 11. 高级特性与实战案例

### 11.1 Redis 集群与 Lua 脚本

#### 脚本限制

```lua
-- ❌ 错误：访问多个槽位的键
redis.call('SET', 'user:1000', 'value1')  -- 槽位 A
redis.call('SET', 'user:2000', 'value2')  -- 槽位 B
-- Error: Script attempted to access keys that don't hash to the same slot

-- ✅ 正确：使用哈希标签
redis.call('SET', 'user:{batch1}:1000', 'value1')
redis.call('SET', 'user:{batch1}:2000', 'value2')
```

#### 实战案例：分布式限流

```lua
-- rate_limiter.lua
-- 使用滑动窗口实现限流
local key = KEYS[1]              -- 限流键，如 "rate_limit:{user:10086}"
local limit = tonumber(ARGV[1])  -- 限流阈值，如 100
local window = tonumber(ARGV[2]) -- 时间窗口(秒)，如 60
local current_time = tonumber(ARGV[3])

-- 清理过期记录
redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)

-- 获取当前窗口内的请求数
local current_count = redis.call('ZCARD', key)

if current_count < limit then
    -- 允许请求，记录当前时间戳
    redis.call('ZADD', key, current_time, current_time .. math.random())
    redis.call('EXPIRE', key, window)
    return 1
else
    -- 拒绝请求
    return 0
end
```

**使用示例：**
```python
import time
import hashlib

def rate_limit(user_id, limit=100, window=60):
    # 使用哈希标签确保同一用户的限流数据在同一槽位
    key = f"rate_limit:{{user:{user_id}}}"
    current_time = int(time.time())

    # 执行 Lua 脚本
    with open('rate_limiter.lua', 'r') as f:
        script = f.read()

    result = rc.eval(script, 1, key, limit, window, current_time)
    return result == 1

# 测试
if rate_limit(10086):
    print("允许访问")
else:
    print("请求过于频繁，请稍后再试")
```

### 11.2 发布订阅在集群中的应用

#### 集群模式下的 Pub/Sub

```python
# 发布者
def publish_message(channel, message):
    # 集群模式下，消息会广播到所有节点
    rc.publish(channel, message)

# 订阅者
from redis import Redis

# 需要连接到每个节点
nodes = [
    Redis(host='127.0.0.1', port=7000),
    Redis(host='127.0.0.1', port=7001),
    Redis(host='127.0.0.1', port=7002)
]

def subscribe_channel(channel):
    for node in nodes:
        pubsub = node.pubsub()
        pubsub.subscribe(channel)

        for message in pubsub.listen():
            if message['type'] == 'message':
                print(f"收到消息: {message['data']}")
```

#### 实战：实时消息通知系统

```python
# 场景：订单状态变更通知

# 1. 订单服务发布消息
def order_status_changed(order_id, status):
    channel = f"order:{{notify:{order_id % 10}}}"  # 分片
    message = json.dumps({
        'order_id': order_id,
        'status': status,
        'timestamp': time.time()
    })
    rc.publish(channel, message)

# 2. 通知服务订阅消息
def start_notification_worker(shard_id):
    channel = f"order:{{notify:{shard_id}}}"
    pubsub = rc.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            send_notification(data['order_id'], data['status'])

# 3. 启动多个 Worker 处理不同分片
from multiprocessing import Process

workers = []
for i in range(10):
    p = Process(target=start_notification_worker, args=(i,))
    p.start()
    workers.append(p)
```

### 11.3 Stream 数据结构

#### Stream 基础操作

```bash
# 生产消息
XADD order:stream * order_id 12345 amount 999 status pending
# 返回：1640000000000-0

# 创建消费组
XGROUP CREATE order:stream order-processor 0

# 消费消息
XREADGROUP GROUP order-processor consumer1 COUNT 10 STREAMS order:stream >

# 确认消息
XACK order:stream order-processor 1640000000000-0

# 查看待处理消息
XPENDING order:stream order-processor
```

#### 实战：可靠消息队列

```python
class RedisStreamQueue:
    def __init__(self, stream_key, group_name):
        self.stream_key = f"{{queue:{stream_key}}}"  # 哈希标签
        self.group_name = group_name

        # 创建消费组（忽略已存在错误）
        try:
            rc.xgroup_create(self.stream_key, self.group_name, id='0', mkstream=True)
        except:
            pass

    def produce(self, data):
        """生产消息"""
        return rc.xadd(self.stream_key, data)

    def consume(self, consumer_name, count=10, block=5000):
        """消费消息"""
        messages = rc.xreadgroup(
            groupname=self.group_name,
            consumername=consumer_name,
            streams={self.stream_key: '>'},
            count=count,
            block=block
        )

        result = []
        if messages:
            for stream, msgs in messages:
                for msg_id, data in msgs:
                    result.append((msg_id, data))
        return result

    def ack(self, *msg_ids):
        """确认消息"""
        return rc.xack(self.stream_key, self.group_name, *msg_ids)

    def claim_stale_messages(self, consumer_name, min_idle_time=60000):
        """认领超时消息"""
        pending = rc.xpending_range(
            self.stream_key,
            self.group_name,
            min='-',
            max='+',
            count=100
        )

        stale_ids = [
            msg['message_id']
            for msg in pending
            if msg['time_since_delivered'] > min_idle_time
        ]

        if stale_ids:
            return rc.xclaim(
                self.stream_key,
                self.group_name,
                consumer_name,
                min_idle_time,
                stale_ids
            )
        return []

# 使用示例
queue = RedisStreamQueue('order:processing', 'order-workers')

# 生产者
def produce_orders():
    for i in range(100):
        queue.produce({
            'order_id': i,
            'amount': 999,
            'created_at': time.time()
        })

# 消费者
def process_orders(worker_id):
    while True:
        # 消费新消息
        messages = queue.consume(f'worker-{worker_id}', count=10)

        for msg_id, data in messages:
            try:
                # 处理订单
                process_order(data)
                # 确认消息
                queue.ack(msg_id)
            except Exception as e:
                logger.error(f"处理失败: {e}")

        # 认领超时消息
        stale = queue.claim_stale_messages(f'worker-{worker_id}')
        for msg_id, data in stale:
            try:
                process_order(data)
                queue.ack(msg_id)
            except Exception as e:
                logger.error(f"重试失败: {e}")
```

### 11.4 分布式锁实现

#### RedLock 算法

```python
import time
import uuid

class RedisDistributedLock:
    def __init__(self, resource_name, ttl=30000):
        # 使用哈希标签确保锁在同一槽位
        self.resource = f"lock:{{resource:{resource_name}}}"
        self.ttl = ttl  # 毫秒
        self.token = str(uuid.uuid4())

    def acquire(self):
        """获取锁"""
        # SET resource token NX PX ttl
        result = rc.set(
            self.resource,
            self.token,
            nx=True,
            px=self.ttl
        )
        return result is not None

    def release(self):
        """释放锁（使用 Lua 保证原子性）"""
        lua_script = """
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
        """
        return rc.eval(lua_script, 1, self.resource, self.token)

    def extend(self, additional_time=30000):
        """延长锁的有效期"""
        lua_script = """
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("PEXPIRE", KEYS[1], ARGV[2])
        else
            return 0
        end
        """
        return rc.eval(lua_script, 1, self.resource, self.token, additional_time)

    def __enter__(self):
        retry_count = 0
        max_retries = 3

        while retry_count < max_retries:
            if self.acquire():
                return self
            retry_count += 1
            time.sleep(0.1)

        raise Exception(f"无法获取锁: {self.resource}")

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

# 使用示例
def process_order(order_id):
    lock_key = f"order:{order_id}"

    with RedisDistributedLock(lock_key, ttl=5000):
        # 执行业务逻辑
        order = get_order(order_id)
        order['status'] = 'processing'
        update_order(order)

        # 长时间操作可以延长锁
        # lock.extend(5000)
```

#### 实战：防止重复提交

```python
def submit_order(user_id, order_data):
    """防止订单重复提交"""
    # 使用用户ID和订单数据生成唯一标识
    order_hash = hashlib.md5(
        json.dumps(order_data, sort_keys=True).encode()
    ).hexdigest()

    lock_key = f"submit:{user_id}:{order_hash}"

    try:
        with RedisDistributedLock(lock_key, ttl=10000):
            # 检查是否已提交
            submitted_key = f"submitted:{{user:{user_id}}}:{order_hash}"
            if rc.exists(submitted_key):
                return {"success": False, "message": "订单已提交，请勿重复操作"}

            # 创建订单
            order_id = create_order(user_id, order_data)

            # 标记已提交（24小时过期）
            rc.setex(submitted_key, 86400, order_id)

            return {"success": True, "order_id": order_id}
    except Exception as e:
        return {"success": False, "message": "系统繁忙，请稍后再试"}
```

### 11.5 集群数据迁移

#### 场景：从单机迁移到集群

```python
#!/usr/bin/env python3
# migrate_to_cluster.py

import redis
from rediscluster import RedisCluster

# 源：单机 Redis
source = redis.Redis(host='old-redis', port=6379, db=0)

# 目标：Redis 集群
target = RedisCluster(
    startup_nodes=[{"host": "127.0.0.1", "port": "7000"}],
    decode_responses=True
)

def migrate_keys(pattern='*', batch_size=1000):
    """迁移键"""
    cursor = 0
    migrated = 0

    while True:
        cursor, keys = source.scan(cursor, match=pattern, count=batch_size)

        for key in keys:
            try:
                # 获取键类型
                key_type = source.type(key)
                ttl = source.ttl(key)

                # 根据类型迁移
                if key_type == b'string':
                    value = source.get(key)
                    target.set(key, value)

                elif key_type == b'hash':
                    value = source.hgetall(key)
                    target.hmset(key, value)

                elif key_type == b'list':
                    value = source.lrange(key, 0, -1)
                    if value:
                        target.rpush(key, *value)

                elif key_type == b'set':
                    value = source.smembers(key)
                    if value:
                        target.sadd(key, *value)

                elif key_type == b'zset':
                    value = source.zrange(key, 0, -1, withscores=True)
                    if value:
                        target.zadd(key, dict(value))

                # 设置过期时间
                if ttl > 0:
                    target.expire(key, ttl)

                migrated += 1
                if migrated % 1000 == 0:
                    print(f"已迁移 {migrated} 个键")

            except Exception as e:
                print(f"迁移失败 {key}: {e}")

        if cursor == 0:
            break

    print(f"迁移完成！总计 {migrated} 个键")
    return migrated

# 执行迁移
if __name__ == '__main__':
    migrate_keys()
```

#### 在线迁移（双写方案）

```python
class DualWriteRedis:
    """双写 Redis：同时写入旧集群和新集群"""

    def __init__(self, old_redis, new_cluster):
        self.old = old_redis
        self.new = new_cluster

    def set(self, key, value, ex=None):
        # 先写新集群
        self.new.set(key, value, ex=ex)
        # 再写旧集群（失败不影响）
        try:
            self.old.set(key, value, ex=ex)
        except:
            pass

    def get(self, key):
        # 优先从新集群读取
        value = self.new.get(key)
        if value is not None:
            return value

        # 新集群没有，从旧集群读取并回填
        value = self.old.get(key)
        if value is not None:
            try:
                self.new.set(key, value)
            except:
                pass
        return value

    def delete(self, *keys):
        self.new.delete(*keys)
        try:
            self.old.delete(*keys)
        except:
            pass

# 使用示例
old_redis = redis.Redis(host='old', port=6379)
new_cluster = RedisCluster(startup_nodes=[...])

# 应用程序使用双写客户端
rc = DualWriteRedis(old_redis, new_cluster)

# 业务代码无需修改
rc.set('user:1000', 'data')
value = rc.get('user:1000')
```

### 11.6 性能基准测试

#### redis-benchmark 工具

```bash
# 基础测试
redis-benchmark -h 127.0.0.1 -p 7000 -c 50 -n 100000

# 测试特定命令
redis-benchmark -h 127.0.0.1 -p 7000 -t set,get -n 100000 -q

# 集群模式测试
redis-benchmark -h 127.0.0.1 -p 7000 --cluster -c 50 -n 100000

# 测试不同数据大小
redis-benchmark -h 127.0.0.1 -p 7000 -t set -n 100000 -d 1024

# Pipeline 测试
redis-benchmark -h 127.0.0.1 -p 7000 -t set -n 100000 -P 16
```

**输出解析：**
```
====== SET ======
  100000 requests completed in 1.23 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1

99.00% <= 1 milliseconds
99.90% <= 2 milliseconds
100.00% <= 3 milliseconds
81300.81 requests per second  # QPS
```

#### 自定义压测脚本

```python
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import random

class RedisBenchmark:
    def __init__(self, redis_client, num_threads=10, num_requests=10000):
        self.rc = redis_client
        self.num_threads = num_threads
        self.num_requests = num_requests
        self.results = []

    def test_set(self, thread_id, count):
        """测试 SET 操作"""
        latencies = []

        for i in range(count):
            key = f"bench:{{thread:{thread_id}}}:key:{i}"
            value = f"value_{i}"

            start = time.time()
            self.rc.set(key, value)
            latency = (time.time() - start) * 1000  # 毫秒
            latencies.append(latency)

        return latencies

    def test_get(self, thread_id, count):
        """测试 GET 操作"""
        # 先写入数据
        keys = []
        for i in range(count):
            key = f"bench:{{thread:{thread_id}}}:key:{i}"
            self.rc.set(key, f"value_{i}")
            keys.append(key)

        # 测试读取
        latencies = []
        for key in keys:
            start = time.time()
            self.rc.get(key)
            latency = (time.time() - start) * 1000
            latencies.append(latency)

        return latencies

    def run(self, test_func):
        """运行测试"""
        requests_per_thread = self.num_requests // self.num_threads

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            futures = []
            for i in range(self.num_threads):
                future = executor.submit(test_func, i, requests_per_thread)
                futures.append(future)

            for future in futures:
                self.results.extend(future.result())

        duration = time.time() - start_time

        # 统计结果
        self.print_stats(duration)

    def print_stats(self, duration):
        """打印统计信息"""
        total_requests = len(self.results)
        qps = total_requests / duration

        sorted_latencies = sorted(self.results)
        p50 = sorted_latencies[int(len(sorted_latencies) * 0.50)]
        p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)]
        p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)]
        avg = sum(sorted_latencies) / len(sorted_latencies)

        print(f"""
基准测试结果
=====================================
总请求数：{total_requests}
耗时：{duration:.2f} 秒
QPS：{qps:.2f}

延迟统计（毫秒）：
  平均：{avg:.2f}
  P50：{p50:.2f}
  P95：{p95:.2f}
  P99：{p99:.2f}
  最大：{max(sorted_latencies):.2f}
        """)

# 使用示例
benchmark = RedisBenchmark(rc, num_threads=50, num_requests=100000)
print("测试 SET 操作...")
benchmark.run(benchmark.test_set)
benchmark.results = []
print("\n测试 GET 操作...")
benchmark.run(benchmark.test_get)
```

### 11.7 安全加固

#### 配置安全检查清单

```bash
# 1. 启用密码认证
requirepass YourStrongPassword123!
masterauth YourStrongPassword123!

# 2. 配置 ACL
aclfile /etc/redis/users.acl

# 3. 禁用危险命令
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG "CONFIG-$(openssl rand -hex 8)"
rename-command KEYS ""

# 4. 网络安全
bind 0.0.0.0  # 生产环境改为内网 IP
protected-mode yes
port 6379
requirepass strong-password

# 5. 限制客户端连接
maxclients 10000
timeout 300

# 6. 关闭 Lua 脚本调试
lua-time-limit 5000
# 不要开启 lua-debugger

# 7. 日志审计
logfile /var/log/redis/redis.log
loglevel notice

# 8. 禁用 DEBUG 和 MONITOR（生产环境）
# 通过 ACL 控制

# 9. TLS 加密（可选）
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

#### 定期安全扫描脚本

```bash
#!/bin/bash
# security_check.sh

echo "Redis 集群安全检查"
echo "===================="

# 检查密码强度
echo "1. 检查认证配置..."
redis-cli -c -p 7000 ping 2>&1 | grep -q "NOAUTH" && echo "⚠️  未配置密码" || echo "✅ 已配置密码"

# 检查危险命令
echo "2. 检查危险命令..."
for cmd in FLUSHALL FLUSHDB KEYS; do
    redis-cli -a "$REDIS_PASS" -p 7000 $cmd 2>&1 | grep -q "unknown command" && \
        echo "✅ $cmd 已禁用" || echo "⚠️  $cmd 仍可用"
done

# 检查 ACL
echo "3. 检查 ACL 配置..."
redis-cli -a "$REDIS_PASS" -p 7000 ACL LIST | grep -q "user default" && \
    echo "✅ ACL 已配置" || echo "⚠️  未配置 ACL"

# 检查网络绑定
echo "4. 检查网络配置..."
netstat -tlnp | grep redis-server | grep "0.0.0.0" && \
    echo "⚠️  绑定到所有网卡" || echo "✅ 只绑定特定 IP"

# 检查慢查询
echo "5. 检查慢查询..."
slow_count=$(redis-cli -a "$REDIS_PASS" -p 7000 SLOWLOG LEN)
echo "慢查询数量: $slow_count"

echo "===================="
echo "安全检查完成"
```

---

## 12. 附录

### 12.1 常用命令速查表

#### 集群管理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `CLUSTER INFO` | 查看集群信息 | `redis-cli -c cluster info` |
| `CLUSTER NODES` | 查看节点列表 | `redis-cli -c cluster nodes` |
| `CLUSTER SLOTS` | 查看槽位分配 | `redis-cli -c cluster slots` |
| `CLUSTER MEET` | 添加节点 | `redis-cli -c cluster meet 127.0.0.1 7001` |
| `CLUSTER FORGET` | 移除节点 | `redis-cli -c cluster forget <node-id>` |
| `CLUSTER REPLICATE` | 设置复制 | `redis-cli -c cluster replicate <master-id>` |
| `CLUSTER FAILOVER` | 手动故障转移 | `redis-cli -c cluster failover` |
| `CLUSTER RESET` | 重置节点 | `redis-cli -c cluster reset hard` |

#### 槽位管理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `CLUSTER ADDSLOTS` | 分配槽位 | `redis-cli -c cluster addslots 0 1 2` |
| `CLUSTER DELSLOTS` | 删除槽位 | `redis-cli -c cluster delslots 0 1 2` |
| `CLUSTER KEYSLOT` | 计算键的槽位 | `redis-cli -c cluster keyslot user:1000` |
| `CLUSTER COUNTKEYSINSLOT` | 统计槽位键数 | `redis-cli -c cluster countkeysinslot 100` |
| `CLUSTER GETKEYSINSLOT` | 获取槽位的键 | `redis-cli -c cluster getkeysinslot 100 10` |
| `CLUSTER SETSLOT` | 设置槽位状态 | `redis-cli -c cluster setslot 100 migrating <node-id>` |

#### redis-cli --cluster 命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `create` | 创建集群 | `redis-cli --cluster create 127.0.0.1:7000 ...` |
| `add-node` | 添加节点 | `redis-cli --cluster add-node new-node existing-node` |
| `del-node` | 删除节点 | `redis-cli --cluster del-node node-ip:port node-id` |
| `reshard` | 重新分片 | `redis-cli --cluster reshard node-ip:port` |
| `rebalance` | 平衡槽位 | `redis-cli --cluster rebalance node-ip:port` |
| `check` | 检查集群 | `redis-cli --cluster check node-ip:port` |
| `fix` | 修复集群 | `redis-cli --cluster fix node-ip:port` |
| `info` | 集群信息 | `redis-cli --cluster info node-ip:port` |
| `call` | 在所有节点执行命令 | `redis-cli --cluster call node-ip:port command` |

### 12.2 配置参数完整列表

```conf
# ============ 集群配置 ============
cluster-enabled yes                        # 启用集群模式
cluster-config-file nodes.conf             # 集群配置文件
cluster-node-timeout 5000                  # 节点超时时间(毫秒)
cluster-replica-validity-factor 10         # 副本有效性因子
cluster-migration-barrier 1                # 主节点最少保留的副本数
cluster-require-full-coverage yes          # 是否要求完整槽位覆盖
cluster-replica-no-failover no             # 副本是否参与故障转移
cluster-allow-reads-when-down no           # 集群下线时是否允许读

# ============ 网络配置 ============
port 6379                                  # 监听端口
bind 0.0.0.0                              # 绑定地址
protected-mode yes                         # 保护模式
tcp-backlog 511                           # TCP 连接队列
timeout 0                                 # 客户端超时(0=永不)
tcp-keepalive 300                         # TCP keepalive

# ============ 安全配置 ============
requirepass password                       # 客户端密码
masterauth password                        # 主节点密码
aclfile /etc/redis/users.acl              # ACL 文件
rename-command FLUSHALL ""                 # 重命名命令

# ============ 内存配置 ============
maxmemory 8gb                             # 最大内存
maxmemory-policy allkeys-lru              # 淘汰策略
maxmemory-samples 5                       # 采样数量

# ============ 持久化配置 ============
# RDB
save 900 1                                # 900秒内1次修改则保存
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
