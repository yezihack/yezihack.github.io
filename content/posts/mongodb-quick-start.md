---
title: "MongoDB完整学习指南 - 从入门到精通"
date: 2025-08-07T10:31:57+08:00
lastmod: 2025-08-07T10:31:57+08:00
draft: false
tags: ["MongoDB", "NoSQL", "数据库"]
categories: ["数据库", "NoSQL"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. MongoDB简介

### 1.1. 什么是MongoDB？

MongoDB是一个基于分布式文件存储的NoSQL数据库，由C++编写，旨在为WEB应用提供可扩展的高性能数据存储解决方案。

**MongoDB的特点：**

- 面向文档存储（Document-Oriented）
- 模式自由（Schema-Free）
- 支持动态查询
- 支持完全索引
- 支持复制和故障恢复
- 使用高效的二进制数据存储，包括大型对象（如视频等）
- 自动处理负载均衡
- 支持Python、PHP、Ruby、Java、C、C#、Javascript、Perl及C++语言的驱动程序

### 1.2. MongoDB vs 关系型数据库

| 特性 | MongoDB | 关系型数据库 |
|------|---------|-------------|
| 数据模型 | 文档模型 | 关系模型 |
| 表结构 | 灵活的Schema | 固定的Schema |
| 查询语言 | MongoDB查询语法 | SQL |
| 事务支持 | 支持ACID事务 | 强ACID事务 |
| 扩展方式 | 水平扩展 | 主要垂直扩展 |
| 存储格式 | BSON | 行列存储 |

---

## 2. 核心概念

### 2.1. 基本术语对比

```text
关系型数据库    MongoDB
数据库         数据库(Database)
表(Table)      集合(Collection)
行(Row)        文档(Document)
列(Column)     字段(Field)
索引           索引
表连接         嵌入文档或引用
主键           主键（MongoDB提供了默认的_id字段）
```

### 2.2. BSON数据类型

MongoDB使用BSON（Binary JSON）格式存储数据，支持以下数据类型：

```javascript
// 基本数据类型示例
{
  "name": "张三",                    // String
  "age": 25,                        // Number (Int32)
  "salary": 8500.50,               // Number (Double)
  "isActive": true,                // Boolean
  "birthDate": new Date(),         // Date
  "address": {                     // Object (嵌套文档)
    "city": "北京",
    "district": "朝阳区"
  },
  "skills": ["Java", "Python", "MongoDB"],  // Array
  "avatar": null,                  // Null
  "userId": ObjectId("..."),       // ObjectId
  "metadata": {                    // Mixed
    "created": new Date(),
    "tags": ["developer", "backend"]
  }
}
```

### 2.3. 集合（Collection）

集合是MongoDB中的文档组，类似于关系型数据库中的表。集合的特点：

- 集合名不能以"system."开头（系统集合保留前缀）
- 集合名不能包含空字符
- 集合名不能为空字符串("")
- 集合名最好有意义

---

## 3. 部署模式

MongoDB 支持三种主要部署架构：

1. **单例（Standalone）**：
   - 单个 MongoDB 实例，运行在一个服务器上。
   - 适用于开发、测试或低负载场景。
   - 没有冗余或故障转移，数据丢失风险较高。
2. **副本集（Replica Set）**：
   - 多个 MongoDB 节点（通常 3 个或更多），包含一个主节点和多个从节点（及可选仲裁者）。
   - 提供高可用性、数据冗余和自动故障转移。
   - 适用于生产环境，需要高可用性和数据一致性。
3. **分片（Sharded Cluster）**：
   - 数据分布在多个分片（shard）上，每个分片可以是一个副本集。
   - 提供水平扩展，适合处理大规模数据和高并发。
   - 需要额外的组件，如配置服务器（Config Server）和查询路由（Mongos）。

### 3.1. 三种架构对比对比**

| **特性**              | **单例（Standalone）** | **副本集（Replica Set）** | **分片（Sharded Cluster）** |
|-----------------------|------------------------|---------------------------|-----------------------------|
| **高可用性**          | 无（单点故障）         | 支持（自动故障转移）      | 支持（每个分片为副本集）    |
| **数据冗余**          | 无                    | 有（从节点复制）          | 有（分片内副本集）          |
| **水平扩展**          | 不支持                | 有限（读扩展）            | 支持（数据分布）            |
| **部署复杂度**        | 低                    | 中等                     | 高                         |
| **适用场景**          | 开发、测试            | 中型生产环境             | 大规模、高并发生产环境      |
| **资源需求**          | 低                    | 中等（多节点）           | 高（多分片、Mongos、配置服务器） |

### 3.2. 副本集架构组成

MongoDB副本集通常由以下节点组成：

1. 主节点(Primary)：负责处理所有写操作和读操作(默认情况下)。只能有一个主节点，它是数据的权威来源。
2. 从节点(Secondary)：从主节点复制数据，可以处理读操作(如果配置了读偏好)。通常有1-2个从节点。
3. 仲裁节点(Arbiter)：不存储数据，仅参与选举过程。当副本集成员数量为偶数时使用，确保选举能够达到多数票。

工作原理：

数据复制过程：

1. 主节点将所有写操作记录到操作日志(oplog)中
2. 从节点异步地从主节点的oplog中拉取操作记录
3. 从节点按顺序重放这些操作，保持与主节点的数据同步

选举机制：当主节点不可用时，剩余节点会自动进行选举：

1. 每个节点都有优先级设置(0-1000)
2. 具有最高优先级且数据最新的节点成为新主节点
3. 选举需要获得多数节点(N/2+1)的支持

心跳检测：

1. 节点间每2秒发送一次心跳
2. 如果主节点10秒内未响应，触发选举过程
3. 确保集群能够快速检测和响应故障

一致性保证

1. 写关注(Write Concern)：可以配置写操作需要多少个节点确认才算成功，平衡性能和一致性需求。
2. 读偏好(Read Preference)：可以配置读操作的目标节点，如只读主节点、优先读从节点等。
3. 这种架构设计使MongoDB能够在节点故障时自动恢复，同时提供数据冗余和读取扩展能力，是生产环境中实现高可用性的重要机制。

测试选举：

```sh
# 方法一：使用rs.stepDown()命令（推荐）
# 连接到当前的主节点（mongodb-0），执行：
# 让主节点主动退位，60秒内不参与选举
rs.stepDown(60)

# 这个命令会：
1. 让mongodb-1. 0主动放弃主节点身份
2. 在60秒内不参与新的选举
3. 触发其他节点进行选举

# 方法二：临时降低优先级
# 获取当前配置
cfg = rs.conf()

# 将mongodb-0的优先级设为0（不能成为主节点）
cfg.members[0].priority = 0

# 重新配置副本集
rs.reconfig(cfg)

# 观察选举过程

# 检查副本集状态
rs.status()

# 查看选举统计
rs.printReplicationInfo()


# 先切换到admin数据库
use admin

# 实时监控状态变化
while(true) {
  try {
    var status = rs.isMaster()
    var replStatus = rs.status()
    var myState = replStatus.myState
    print(new Date() + ": isMaster=" + status.ismaster + 
          " | primary=" + (status.primary || "NONE") + 
          " | myState=" + myState)
  } catch(e) {
    print(new Date() + ": Error - " + e.message)
  }
  sleep(1000)
}

# 立即检查状态
rs.status()

# 再次检查谁是新主节点
rs.isMaster()
```

### 3.3. 分片工作原理

MongoDB分片(Sharding)是MongoDB的水平扩展解决方案，通过将数据分布在多个服务器上来处理大量数据和高并发访问。

分片架构组件

**分片(Shards)**：

- 每个分片是一个独立的副本集或单个mongod实例
- 存储数据集的一个子集
- 负责处理分配给它的数据范围的读写操作

**配置服务器(Config Servers)**：

- 存储分片集群的元数据和配置信息
- 记录每个分片包含哪些数据块(chunks)
- 通常部署为3个节点的副本集，确保高可用性

**查询路由器(mongos)**：

- 作为客户端和分片集群之间的接口
- 根据分片键将查询路由到正确的分片
- 聚合来自多个分片的查询结果
- 可以部署多个mongos实例提供负载均衡

数据分布机制

**分片键(Shard Key)**：

- 决定文档如何在分片间分布的字段
- 必须在所有文档中存在且不能为数组
- 选择合适的分片键对性能至关重要

**数据块(Chunks)**：

- MongoDB将数据划分为连续的数据块
- 默认每个块最大64MB
- 基于分片键的范围进行划分
- 例如：用户ID 1-1000在分片A，1001-2000在分片B

**分片策略**：

- **范围分片**：根据分片键值的范围分布数据，适合范围查询
- **哈希分片**：对分片键进行哈希，数据分布更均匀，但范围查询效率较低

工作流程

**写操作**：

1. 客户端连接到mongos
2. mongos根据文档的分片键确定目标分片
3. 将写请求路由到相应的分片
4. 分片执行写操作并返回结果

**读操作**：

1. mongos分析查询条件
2. 如果查询包含分片键，直接路由到目标分片
3. 如果不包含分片键，可能需要向所有分片发送查询（散播查询）
4. mongos聚合各分片的结果并返回给客户端

负载均衡

**自动均衡器(Balancer)**：

- MongoDB内置的后台进程
- 监控各分片间的数据分布
- 当分片间数据量差异超过阈值时，自动迁移chunks
- 确保数据在集群中均匀分布

**块迁移过程**：

- 源分片将chunk数据复制到目标分片
- 目标分片确认接收完成
- 更新配置服务器中的元数据
- 删除源分片上的原始数据

分片的优势与注意事项

**优势**：

- 水平扩展存储和计算能力
- 提高并发处理能力
- 支持超大数据集

**注意事项**：

- 分片键选择很重要，一旦设定难以更改
- 跨分片的事务和连接查询性能较差
- 增加了架构复杂性和运维难度
- 某些查询可能需要访问所有分片，影响性能

## 4. 安装与配置

### 4.1. Windows安装

```bash
# 1. 下载MongoDB Community Server
# 访问：https://www.mongodb.com/try/download/community

# 2. 安装后设置环境变量
# 将 C:\Program Files\MongoDB\Server\7.0\bin 添加到PATH

# 3. 创建数据目录
mkdir C:\data\db

# 4. 启动MongoDB服务
mongod --dbpath C:\data\db
```

### 4.2. Linux安装（Ubuntu）

```bash
# 1. 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# 2. 创建源列表文件
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 3. 更新包数据库
sudo apt-get update

# 4. 安装MongoDB
sudo apt-get install -y mongodb-org

# 5. 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4.3. Docker安装

```bash
# 拉取MongoDB镜像
docker pull mongo:latest

# 运行MongoDB容器
docker run --name mongodb -p 27017:27017 -d mongo:latest

# 连接到MongoDB
docker exec -it mongodb mongosh
```

### 4.4. Helm 安装

```sh
# architecture 可选择：standalone, replicaset
    # standalone：单例模式
    # replicaset：副本集模式
# arbiter.enabled：是否启用仲裁节点、当节点数为偶数时，需要启用仲裁节点，仲裁节点不存储数据，只参与选举
# replicaCount：副本集数量
# auth.enabled：是否启用认证
# auth.rootPassword：root密码
# backup.enabled：是否启用备份
# metrics.enabled：是否启用监控
# serviceMonitor.enabled：是否启用ServiceMonitor

# 单例模式
helm upgrade --install mongodb oci://registry-1.docker.io/bitnamicharts/mongodb \
  -n mongodb \
  --create-namespace \
  --set global.storageClass="nfs" \
  --set architecture="standalone" \
  --set auth.enabled=true \
  --set auth.rootPassword="your-password" \
  --set replicaCount=1 \
  --set backup.enabled=true \
  --set metrics.enabled=true \
  --set serviceMonitor.enabled=false

# 副本集模式
helm upgrade --install mongodb oci://registry-1.docker.io/bitnamicharts/mongodb \
  -n mongodb \
  --create-namespace \
  --set global.storageClass="nfs" \
  --set architecture="replicaset" \
  --set auth.enabled=true \
  --set auth.rootPassword="your-password" \
  --set replicaCount=2 \
  --set arbiter.enabled=true \
  --set backup.enabled=true \
  --set metrics.enabled=true \
  --set serviceMonitor.enabled=false

# 高性能部署
# MongoDB 的 wiredTigerCacheSizeGB 参数用于配置 WiredTiger 存储引擎的内存缓存大小，直接影响数据库性能
# 专用 MongoDB 服务器：分配 ‌60%-80%‌ 物理内存
# 云服务器：分配 50%-60% 物理内存
helm upgrade --install mongodb oci://registry-1.docker.io/bitnamicharts/mongodb \
  -n mongodb \
  --create-namespace \
  --set global.storageClass="nfs" \
  --set architecture="replicaset" \
  --set auth.enabled=true \
  --set auth.rootPassword="your-password" \
  --set replicaCount=2 \
  --set arbiter.enabled=true \
  --set backup.enabled=true \
  --set metrics.enabled=true \
  --set serviceMonitor.enabled=false \
  --set resources.requests.cpu=4 \  
  --set resources.requests.memory="16Gi" \
  --set resources.limits.cpu=4 \
  --set resources.limits.memory="16Gi" \
  --set-string extraFlags[0]="--wiredTigerCacheSizeGB=8"
```

---

## 5. 基础操作

### 5.1. 连接数据库

```javascript
// 使用mongosh连接
mongosh "mongodb://localhost:27017"

// 或指定数据库
mongosh "mongodb://localhost:27017/myapp"
```

### 5.2. 数据库操作

```javascript
// 查看所有数据库
show dbs

// 创建/切换数据库
use myapp

// 查看当前数据库
db

// 删除数据库
db.dropDatabase()

// 查看数据库状态
db.stats()
```

### 5.3. 集合操作

```javascript
// 创建集合
db.createCollection("users")

// 查看所有集合
show collections

// 删除集合
db.users.drop()

// 重命名集合
db.users.renameCollection("members")
```

### 5.4. 文档的CRUD操作

#### 5.4.1. 插入文档（Create）

```javascript
// 插入单个文档
db.users.insertOne({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
  skills: ["JavaScript", "Python"],
  address: {
    city: "北京",
    district: "朝阳区"
  },
  createdAt: new Date()
})

// 插入多个文档
db.users.insertMany([
  {
    name: "李四",
    age: 28,
    email: "lisi@example.com",
    skills: ["Java", "Spring"],
    department: "后端开发"
  },
  {
    name: "王五",
    age: 30,
    email: "wangwu@example.com",
    skills: ["React", "Vue"],
    department: "前端开发"
  }
])

// 批量插入的返回结果
{
  "acknowledged": true,
  "insertedIds": [
    ObjectId("..."),
    ObjectId("...")
  ]
}
```

#### 5.4.2. 查询文档（Read）

```javascript
// 查询所有文档
db.users.find()

// 格式化输出
db.users.find().pretty()

// 查询指定条件
db.users.findOne({name: "张三"})

// 条件查询
db.users.find({age: {$gte: 25}})  // 年龄大于等于25

// 多条件查询
db.users.find({
  age: {$gte: 25, $lt: 30},
  department: "后端开发"
})

// 正则表达式查询
db.users.find({name: /^张/})  // 姓张的用户

// 数组字段查询
db.users.find({skills: "JavaScript"})  // 技能包含JavaScript

// 嵌套文档查询
db.users.find({"address.city": "北京"})
```

#### 5.4.3. 更新文档（Update）

```javascript
// 更新单个文档
db.users.updateOne(
  {name: "张三"},  // 查询条件
  {
    $set: {
      age: 26,
      email: "zhangsan_new@example.com"
    },
    $push: {
      skills: "MongoDB"
    }
  }
)

// 更新多个文档
db.users.updateMany(
  {department: "前端开发"},
  {
    $set: {
      level: "高级"
    }
  }
)

// 替换文档
db.users.replaceOne(
  {name: "李四"},
  {
    name: "李四",
    age: 29,
    email: "lisi_updated@example.com",
    skills: ["Java", "Spring", "MongoDB"],
    department: "全栈开发",
    updatedAt: new Date()
  }
)

// 更新操作符
db.users.updateOne(
  {name: "王五"},
  {
    $inc: {age: 1},           // 递增
    $unset: {department: ""},  // 删除字段
    $addToSet: {skills: "Node.js"},  // 向数组添加唯一值
    $currentDate: {lastModified: true}  // 设置当前日期
  }
)
```

#### 5.4.4. 删除文档（Delete）

```javascript
// 删除单个文档
db.users.deleteOne({name: "张三"})

// 删除多个文档
db.users.deleteMany({age: {$lt: 25}})

// 删除所有文档
db.users.deleteMany({})
```

---

## 6. 高级查询

### 6.1. 比较操作符

```javascript
// 等于
db.products.find({price: 100})

// 不等于
db.products.find({price: {$ne: 100}})

// 大于
db.products.find({price: {$gt: 100}})

// 大于等于
db.products.find({price: {$gte: 100}})

// 小于
db.products.find({price: {$lt: 200}})

// 小于等于
db.products.find({price: {$lte: 200}})

// 在指定值内
db.products.find({category: {$in: ["电子", "图书"]}})

// 不在指定值内
db.products.find({category: {$nin: ["电子", "图书"]}})
```

### 6.2. 逻辑操作符

```javascript
// AND 查询（默认）
db.products.find({
  price: {$gte: 100, $lte: 500},
  category: "电子"
})

// 显式 AND
db.products.find({
  $and: [
    {price: {$gte: 100}},
    {category: "电子"}
  ]
})

// OR 查询
db.products.find({
  $or: [
    {price: {$lt: 50}},
    {category: "图书"}
  ]
})

// NOT 查询
db.products.find({
  price: {$not: {$gt: 100}}
})

// NOR 查询（都不满足）
db.products.find({
  $nor: [
    {price: {$lt: 50}},
    {category: "电子"}
  ]
})
```

### 6.3. 数组查询

```javascript
// 准备数据
db.students.insertMany([
  {
    name: "张三",
    grades: [85, 90, 78],
    subjects: ["数学", "物理", "化学"]
  },
  {
    name: "李四",
    grades: [92, 88, 95],
    subjects: ["数学", "英语", "历史"]
  }
])

// 查询数组包含特定值
db.students.find({subjects: "数学"})

// 查询数组包含所有指定值
db.students.find({subjects: {$all: ["数学", "物理"]}})

// 查询数组大小
db.students.find({grades: {$size: 3}})

// 查询数组元素范围
db.students.find({grades: {$elemMatch: {$gte: 85, $lte: 95}}})

// 数组索引查询
db.students.find({"grades.0": {$gte: 90}})  // 第一个成绩大于等于90
```

### 6.4. 投影（Projection）

```javascript
// 只返回指定字段
db.users.find({}, {name: 1, age: 1})

// 排除指定字段
db.users.find({}, {_id: 0, password: 0})

// 数组切片
db.students.find({}, {
  name: 1,
  grades: {$slice: 2}  // 只返回前2个成绩
})

// 数组元素匹配位置
db.students.find(
  {grades: {$gte: 90}},
  {name: 1, "grades.$": 1}  // 只返回匹配的数组元素
)
```

### 6.5. 排序与分页

```javascript
// 排序
db.products.find().sort({price: 1})    // 升序
db.products.find().sort({price: -1})   // 降序

// 多字段排序
db.products.find().sort({category: 1, price: -1})

// 分页
db.products.find()
  .sort({_id: 1})
  .limit(10)     // 限制返回10条
  .skip(20)      // 跳过前20条

// 计算总数
db.products.countDocuments({price: {$gte: 100}})
```

---

## 7. 索引优化

### 7.1. 索引基础

```javascript
// 查看集合的索引
db.users.getIndexes()

// 创建单字段索引
db.users.createIndex({name: 1})    // 升序索引
db.users.createIndex({age: -1})    // 降序索引

// 创建复合索引
db.users.createIndex({age: 1, name: 1})

// 创建唯一索引
db.users.createIndex({email: 1}, {unique: true})

// 创建稀疏索引（跳过没有该字段的文档）
db.users.createIndex({phone: 1}, {sparse: true})

// 创建TTL索引（生存时间索引）
db.sessions.createIndex(
  {createdAt: 1},
  {expireAfterSeconds: 3600}  // 1小时后过期
)
```

### 7.2. 索引类型详解

```javascript
// 1. 文本索引
db.articles.createIndex({
  title: "text",
  content: "text"
})

// 文本搜索
db.articles.find({$text: {$search: "MongoDB 教程"}})

// 2. 地理空间索引
db.locations.createIndex({location: "2dsphere"})

// 地理查询
db.locations.find({
  location: {
    $near: {
      $geometry: {type: "Point", coordinates: [116.4074, 39.9042]},
      $maxDistance: 1000  // 1000米内
    }
  }
})

// 3. 哈希索引（分片键常用）
db.users.createIndex({userId: "hashed"})
```

### 7.3. 索引性能分析

```javascript
// 查看查询执行计划
db.users.find({age: 25}).explain("executionStats")

// 强制使用指定索引
db.users.find({age: 25}).hint({age: 1})

// 查看索引使用统计
db.users.aggregate([{$indexStats: {}}])

// 删除索引
db.users.dropIndex({age: 1})

// 删除所有索引（除了_id）
db.users.dropIndexes()
```

### 7.4. 索引优化建议

```javascript
// 复合索引的字段顺序很重要
// 好的顺序：相等查询 -> 范围查询 -> 排序
db.orders.createIndex({
  status: 1,        // 相等查询
  createdAt: 1,     // 范围查询
  amount: -1        // 排序
})

// 查询示例
db.orders.find({
  status: "completed",
  createdAt: {$gte: new Date("2024-01-01")}
}).sort({amount: -1})
```

---

## 8. 聚合框架

### 8.1. 聚合管道基础

```javascript
// 基本聚合管道结构
db.orders.aggregate([
  {$match: {status: "completed"}},    // 筛选阶段
  {$group: {                          // 分组阶段
    _id: "$customerId",
    totalAmount: {$sum: "$amount"},
    orderCount: {$sum: 1}
  }},
  {$sort: {totalAmount: -1}},         // 排序阶段
  {$limit: 10}                        // 限制阶段
])
```

### 8.2. 常用聚合操作

```javascript
// 准备测试数据
db.sales.insertMany([
  {
    _id: 1,
    product: "iPhone",
    category: "electronics",
    price: 999,
    quantity: 2,
    date: new Date("2024-01-15"),
    salesperson: "张三"
  },
  {
    _id: 2,
    product: "MacBook",
    category: "electronics", 
    price: 1999,
    quantity: 1,
    date: new Date("2024-01-20"),
    salesperson: "李四"
  },
  {
    _id: 3,
    product: "Java编程思想",
    category: "books",
    price: 89,
    quantity: 5,
    date: new Date("2024-02-01"),
    salesperson: "张三"
  }
])

// $match - 筛选文档
db.sales.aggregate([
  {$match: {category: "electronics"}}
])

// $group - 分组聚合
db.sales.aggregate([
  {$group: {
    _id: "$category",
    totalRevenue: {$sum: {$multiply: ["$price", "$quantity"]}},
    avgPrice: {$avg: "$price"},
    maxPrice: {$max: "$price"},
    minPrice: {$min: "$price"},
    count: {$sum: 1}
  }}
])

// $project - 字段投影和计算
db.sales.aggregate([
  {$project: {
    product: 1,
    price: 1,
    quantity: 1,
    revenue: {$multiply: ["$price", "$quantity"]},
    discountPrice: {$multiply: ["$price", 0.9]},
    year: {$year: "$date"},
    month: {$month: "$date"}
  }}
])

// $sort - 排序
db.sales.aggregate([
  {$project: {
    product: 1,
    revenue: {$multiply: ["$price", "$quantity"]}
  }},
  {$sort: {revenue: -1}}
])

// $limit 和 $skip - 分页
db.sales.aggregate([
  {$sort: {date: -1}},
  {$skip: 1},
  {$limit: 2}
])

// $unwind - 展开数组
db.articles.insertOne({
  title: "MongoDB教程",
  tags: ["数据库", "NoSQL", "MongoDB"],
  author: "技术专家"
})

db.articles.aggregate([
  {$unwind: "$tags"},
  {$group: {
    _id: "$tags",
    count: {$sum: 1}
  }}
])
```

### 8.3. 高级聚合操作

```javascript
// $lookup - 关联查询（类似SQL的JOIN）
// 假设有用户和订单两个集合
db.users.insertMany([
  {_id: 1, name: "张三", email: "zhang@example.com"},
  {_id: 2, name: "李四", email: "li@example.com"}
])

db.orders.insertMany([
  {_id: 1, userId: 1, product: "iPhone", amount: 999},
  {_id: 2, userId: 1, product: "iPad", amount: 699},
  {_id: 3, userId: 2, product: "MacBook", amount: 1999}
])

db.users.aggregate([
  {$lookup: {
    from: "orders",           // 关联的集合
    localField: "_id",        // 本集合的字段
    foreignField: "userId",   // 关联集合的字段
    as: "userOrders"          // 结果字段名
  }},
  {$project: {
    name: 1,
    email: 1,
    totalOrders: {$size: "$userOrders"},
    totalSpent: {$sum: "$userOrders.amount"}
  }}
])

// $facet - 多维度聚合
db.sales.aggregate([
  {$facet: {
    "byCategory": [
      {$group: {
        _id: "$category",
        total: {$sum: {$multiply: ["$price", "$quantity"]}}
      }}
    ],
    "bySalesperson": [
      {$group: {
        _id: "$salesperson", 
        total: {$sum: {$multiply: ["$price", "$quantity"]}}
      }}
    ],
    "priceRange": [
      {$bucket: {
        groupBy: "$price",
        boundaries: [0, 100, 500, 1000, 2000],
        default: "other",
        output: {count: {$sum: 1}}
      }}
    ]
  }}
])

// $addFields - 添加计算字段
db.sales.aggregate([
  {$addFields: {
    revenue: {$multiply: ["$price", "$quantity"]},
    season: {
      $switch: {
        branches: [
          {case: {$in: [{$month: "$date"}, [3, 4, 5]]}, then: "春季"},
          {case: {$in: [{$month: "$date"}, [6, 7, 8]]}, then: "夏季"},
          {case: {$in: [{$month: "$date"}, [9, 10, 11]]}, then: "秋季"}
        ],
        default: "冬季"
      }
    }
  }}
])
```

### 8.4. 聚合表达式

```javascript
// 条件表达式
db.students.aggregate([
  {$project: {
    name: 1,
    score: 1,
    grade: {
      $switch: {
        branches: [
          {case: {$gte: ["$score", 90]}, then: "A"},
          {case: {$gte: ["$score", 80]}, then: "B"},
          {case: {$gte: ["$score", 70]}, then: "C"}
        ],
        default: "D"
      }
    },
    pass: {$cond: {if: {$gte: ["$score", 60]}, then: "通过", else: "不通过"}}
  }}
])

// 数组表达式
db.surveys.aggregate([
  {$project: {
    answers: 1,
    answerCount: {$size: "$answers"},
    firstAnswer: {$arrayElemAt: ["$answers", 0]},
    hasAnswers: {$gt: [{$size: "$answers"}, 0]},
    avgRating: {$avg: "$answers.rating"}
  }}
])

// 字符串表达式  
db.users.aggregate([
  {$project: {
    fullName: {$concat: ["$firstName", " ", "$lastName"]},
    nameLength: {$strLenCP: "$name"},
    upperName: {$toUpper: "$name"},
    emailDomain: {
      $arrayElemAt: [
        {$split: ["$email", "@"]}, 1
      ]
    }
  }}
])
```

---

## 9. 复制集与分片

### 9.1. 复制集（Replica Set）

```javascript
// 复制集配置示例
rs.initiate({
  _id: "myReplicaSet",
  members: [
    {_id: 0, host: "mongodb1.example.com:27017"},
    {_id: 1, host: "mongodb2.example.com:27017"},  
    {_id: 2, host: "mongodb3.example.com:27017"}
  ]
})

// 查看复制集状态
rs.status()

// 添加成员
rs.add("mongodb4.example.com:27017")

// 移除成员
rs.remove("mongodb4.example.com:27017")

// 设置读偏好
db.users.find().readPref("secondary")

// 连接复制集
mongosh "mongodb://mongodb1.example.com:27017,mongodb2.example.com:27017,mongodb3.example.com:27017/myapp?replicaSet=myReplicaSet"
```

### 9.2. 分片（Sharding）

```javascript
// 启动配置服务器
mongod --configsvr --replSet configReplSet --port 27019 --dbpath /data/configdb

// 启动分片服务器
mongod --shardsvr --replSet shard1 --port 27018 --dbpath /data/shard1

// 启动mongos路由器
mongos --configdb configReplSet/mongodb1:27019,mongodb2:27019,mongodb3:27019 --port 27017

// 连接到mongos并添加分片
sh.addShard("shard1/mongodb1:27018,mongodb2:27018,mongodb3:27018")

// 启用数据库分片
sh.enableSharding("myapp")

// 创建分片键
sh.shardCollection("myapp.users", {"userId": "hashed"})

// 查看分片状态
sh.status()
```

---

## 10. 性能优化

### 10.1. 查询优化

```javascript
// 1. 使用索引
db.users.createIndex({age: 1, name: 1})

// 2. 限制返回字段
db.users.find({age: {$gte: 25}}, {name: 1, email: 1})

// 3. 使用limit限制结果
db.users.find({status: "active"}).limit(100)

// 4. 避免全表扫描
db.users.find({name: /^张/})  // 好：前缀匹配
db.users.find({name: /张/})   // 差：包含匹配

// 5. 使用聚合管道优化
// 差的做法：先查询再在应用层处理
const users = db.users.find({age: {$gte: 25}}).toArray()
// 在JavaScript中处理统计

// 好的做法：使用聚合管道
db.users.aggregate([
  {$match: {age: {$gte: 25}}},
  {$group: {
    _id: "$department",
    count: {$sum: 1},
    avgAge: {$avg: "$age"}
  }}
])
```

### 10.2. 写入优化

```javascript
// 1. 批量写入
const bulk = db.users.initializeOrderedBulkOp()
for(let i = 0; i < 1000; i++) {
  bulk.insert({
    name: `User${i}`,
    age: Math.floor(Math.random() * 50) + 20,
    createdAt: new Date()
  })
}
bulk.execute()

// 2. 使用upsert减少查询
db.users.updateOne(
  {email: "user@example.com"},
  {
    $set: {
      name: "Updated Name",
      lastLogin: new Date()
    }
  },
  {upsert: true}  // 如果不存在则插入
)

// 3. 写入关注点设置
db.users.insertOne(
  {name: "张三", age: 25},
  {writeConcern: {w: "majority", j: true, wtimeout: 5000}}
)
```

### 10.3. 监控与诊断

```javascript
// 1. 查看当前操作
db.currentOp()

// 2. 终止长时间运行的操作
db.killOp(opId)

// 3. 数据库统计信息
db.stats()

// 4. 集合统计信息
db.users.stats()

// 5. 分析慢查询
db.setProfilingLevel(2, {slowms: 100})  // 记录超过100ms的操作
db.system.profile.find().limit(5).sort({ts: -1})

// 6. 索引使用统计
db.users.aggregate([{$indexStats: {}}])
```

---

## 11. 实战项目

### 11.1. 博客系统设计

```javascript
// 1. 用户集合设计
db.users.insertOne({
  _id: ObjectId(),
  username: "techblogger",
  email: "blogger@example.com",
  password: "hashed_password",
  profile: {
    firstName: "Tech",
    lastName: "Blogger",
    avatar: "https://example.com/avatar.jpg",
    bio: "热爱技术分享的程序员"
  },
  social: {
    github: "techblogger",
    twitter: "@techblogger",
    website: "https://techblog.example.com"
  },
  settings: {
    emailNotifications: true,
    privacy: "public"
  },
  stats: {
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

// 2. 文章集合设计
db.posts.insertOne({
  _id: ObjectId(),
  title: "MongoDB聚合框架深入解析",
  slug: "mongodb-aggregation-framework-deep-dive",
  content: "文章内容...",
  excerpt: "本文深入探讨MongoDB聚合框架的高级用法...",
  author: {
    userId: ObjectId("用户ID"),
    username: "techblogger",
    avatar: "https://example.com/avatar.jpg"
  },
  tags: ["MongoDB", "数据库", "聚合", "NoSQL"],
  categories: ["数据库", "后端开发"],
  status: "published", // draft, published, archived
  publishedAt: new Date(),
  stats: {
    views: 1250,
    likes: 89,
    comments: 23,
    shares: 15
  },
  seo: {
    metaTitle: "MongoDB聚合框架完整指南",
    metaDescription: "学习MongoDB聚合框架...",
    keywords: ["MongoDB", "聚合", "数据库"]
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

// 3. 评论集合设计
db.comments.insertOne({
  _id: ObjectId(),
  postId: ObjectId("文章ID"),
  author: {
    userId: ObjectId("用户ID"),
    username: "reader001",
    avatar: "https://example.com/user_avatar.jpg"
  },
  content: "这篇文章写得很详细，对我很有帮助！",
  parentId: null, // 父评论ID，用于嵌套回复
  level: 0, // 嵌套层级
  likes: 5,
  dislikes: 0,
  status: "approved", // pending, approved, spam, deleted
  createdAt: new Date(),
  updatedAt: new Date()
})

// 4. 标签集合设计
db.tags.insertOne({
  _id: ObjectId(),
  name: "MongoDB",
  slug: "mongodb",
  description: "MongoDB数据库相关文章",
  color: "#13aa52",
  postsCount: 45,
  followersCount: 128,
  createdAt: new Date()
})
```

### 11.2. 博客系统核心功能实现

```javascript
// 1. 发布文章
function publishPost(postData) {
  const session = db.getMongo().startSession()
  
  try {
    session.startTransaction()
    
    // 插入文章
    const postResult = db.posts.insertOne({
      ...postData,
      publishedAt: new Date(),
      status: "published",
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      }
    }, {session})
    
    // 更新用户文章数
    db.users.updateOne(
      {_id: postData.author.userId},
      {$inc: {"stats.postsCount": 1}},
      {session}
    )
    
    // 更新标签文章数
    if (postData.tags && postData.tags.length > 0) {
      db.tags.updateMany(
        {name: {$in: postData.tags}},
        {$inc: {postsCount: 1}},
        {session}
      )
    }
    
    session.commitTransaction()
    return postResult.insertedId
    
  } catch (error) {
    session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// 2. 文章列表查询（支持分页、排序、筛选）
function getPostsList(options = {}) {
  const {
    page = 1,
    limit = 10,
    author,
    tags,
    category,
    search,
    sortBy = "publishedAt",
    sortOrder = -1
  } = options
  
  let matchStage = {status: "published"}
  
  // 添加筛选条件
  if (author) matchStage["author.username"] = author
  if (tags) matchStage.tags = {$in: Array.isArray(tags) ? tags : [tags]}
  if (category) matchStage.categories = category
  if (search) {
    matchStage.$text = {$search: search}
  }
  
  return db.posts.aggregate([
    {$match: matchStage},
    {$sort: {[sortBy]: sortOrder}},
    {$skip: (page - 1) * limit},
    {$limit: limit},
    {$project: {
      title: 1,
      slug: 1,
      excerpt: 1,
      author: 1,
      tags: 1,
      categories: 1,
      publishedAt: 1,
      stats: 1,
      readTime: {
        $round: [{$divide: [{$strLenCP: "$content"}, 200]}] // 估算阅读时间
      }
    }}
  ])
}

// 3. 热门文章统计
function getPopularPosts(timeRange = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - timeRange)
  
  return db.posts.aggregate([
    {$match: {
      status: "published",
      publishedAt: {$gte: startDate}
    }},
    {$addFields: {
      popularityScore: {
        $add: [
          {$multiply: ["$stats.views", 1]},
          {$multiply: ["$stats.likes", 5]},
          {$multiply: ["$stats.comments", 10]},
          {$multiply: ["$stats.shares", 15]}
        ]
      }
    }},
    {$sort: {popularityScore: -1}},
    {$limit: 10},
    {$project: {
      title: 1,
      slug: 1,
      author: 1,
      publishedAt: 1,
      stats: 1,
      popularityScore: 1
    }}
  ])
}

// 4. 用户关注系统
db.follows.insertOne({
  _id: ObjectId(),
  follower: ObjectId("关注者ID"),
  following: ObjectId("被关注者ID"),
  createdAt: new Date()
})

// 获取用户关注的人的文章
function getFollowingPosts(userId, page = 1, limit = 10) {
  return db.follows.aggregate([
    {$match: {follower: ObjectId(userId)}},
    {$lookup: {
      from: "posts",
      localField: "following",
      foreignField: "author.userId",
      as: "posts"
    }},
    {$unwind: "$posts"},
    {$match: {"posts.status": "published"}},
    {$sort: {"posts.publishedAt": -1}},
    {$skip: (page - 1) * limit},
    {$limit: limit},
    {$replaceRoot: {newRoot: "$posts"}}
  ])
}

// 5. 搜索功能
db.posts.createIndex({
  title: "text",
  content: "text",
  tags: "text"
}, {
  weights: {
    title: 10,
    tags: 5,
    content: 1
  },
  name: "posts_text_index"
})

function searchPosts(query, page = 1, limit = 10) {
  return db.posts.aggregate([
    {$match: {
      $text: {$search: query},
      status: "published"
    }},
    {$addFields: {
      score: {$meta: "textScore"}
    }},
    {$sort: {score: {$meta: "textScore"}}},
    {$skip: (page - 1) * limit},
    {$limit: limit}
  ])
}
```

### 11.3. 电商系统设计

```javascript
// 1. 商品集合设计
db.products.insertOne({
  _id: ObjectId(),
  name: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  description: "最新款iPhone，搭载A17 Pro芯片",
  category: {
    main: "电子产品",
    sub: "智能手机",
    path: ["电子产品", "智能手机", "苹果"]
  },
  brand: "Apple",
  sku: "IPH15P-256-BLU",
  variants: [
    {
      sku: "IPH15P-128-BLU",
      attributes: {
        storage: "128GB",
        color: "深空蓝色"
      },
      price: 8999,
      stock: 50,
      images: ["url1.jpg", "url2.jpg"]
    },
    {
      sku: "IPH15P-256-BLU", 
      attributes: {
        storage: "256GB",
        color: "深空蓝色"
      },
      price: 9999,
      stock: 30,
      images: ["url3.jpg", "url4.jpg"]
    }
  ],
  specifications: {
    "屏幕尺寸": "6.1英寸",
    "处理器": "A17 Pro",
    "摄像头": "4800万像素主摄",
    "电池": "3274mAh"
  },
  tags: ["5G", "Face ID", "无线充电"],
  seo: {
    title: "iPhone 15 Pro - Apple官方授权",
    description: "购买iPhone 15 Pro...",
    keywords: ["iPhone", "苹果手机", "5G手机"]
  },
  pricing: {
    basePrice: 8999,
    salePrice: null,
    wholesalePrice: 8500,
    currency: "CNY"
  },
  inventory: {
    totalStock: 80,
    reserved: 5,
    available: 75,
    lowStockThreshold: 10
  },
  ratings: {
    average: 4.8,
    count: 1250,
    distribution: {
      "5": 980,
      "4": 200,
      "3": 50,
      "2": 15,
      "1": 5
    }
  },
  status: "active", // active, inactive, discontinued
  isDigital: false,
  shippingInfo: {
    weight: 0.187, // kg
    dimensions: {
      length: 14.76,
      width: 7.15,
      height: 0.83
    },
    freeShipping: true,
    shippingMethods: ["standard", "express", "same-day"]
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

// 2. 订单集合设计
db.orders.insertOne({
  _id: ObjectId(),
  orderNumber: "ORD20240807001",
  customer: {
    userId: ObjectId("用户ID"),
    email: "customer@example.com",
    name: "张三",
    phone: "13800138000"
  },
  items: [
    {
      productId: ObjectId("商品ID"),
      sku: "IPH15P-256-BLU",
      name: "iPhone 15 Pro 256GB 深空蓝色",
      price: 9999,
      quantity: 1,
      subtotal: 9999,
      attributes: {
        storage: "256GB",
        color: "深空蓝色"
      }
    }
  ],
  pricing: {
    subtotal: 9999,
    shipping: 0,
    tax: 899.91,
    discount: 0,
    total: 10898.91,
    currency: "CNY"
  },
  shipping: {
    method: "express",
    address: {
      recipient: "张三",
      phone: "13800138000",
      province: "北京市",
      city: "北京市", 
      district: "朝阳区",
      street: "XXX街道XXX号",
      postalCode: "100000"
    },
    estimatedDelivery: new Date("2024-08-09")
  },
  payment: {
    method: "alipay",
    status: "paid",
    transactionId: "ALI20240807001",
    paidAt: new Date()
  },
  status: "processing", // pending, paid, processing, shipped, delivered, cancelled, refunded
  timeline: [
    {
      status: "pending",
      timestamp: new Date("2024-08-07T10:00:00Z"),
      note: "订单已创建"
    },
    {
      status: "paid", 
      timestamp: new Date("2024-08-07T10:05:00Z"),
      note: "支付成功"
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})

// 3. 购物车集合设计
db.carts.insertOne({
  _id: ObjectId(),
  userId: ObjectId("用户ID"),
  items: [
    {
      productId: ObjectId("商品ID"),
      sku: "IPH15P-256-BLU",
      quantity: 1,
      addedAt: new Date(),
      price: 9999 // 添加时的价格
    }
  ],
  totals: {
    itemCount: 1,
    subtotal: 9999
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
})

// 4. 库存管理
function updateInventory(sku, quantityChange, operation = "reserve") {
  const session = db.getMongo().startSession()
  
  try {
    session.startTransaction()
    
    const product = db.products.findOne(
      {"variants.sku": sku},
      {session}
    )
    
    if (!product) {
      throw new Error("商品不存在")
    }
    
    const variant = product.variants.find(v => v.sku === sku)
    if (operation === "reserve" && variant.stock < quantityChange) {
      throw new Error("库存不足")
    }
    
    // 更新库存
    const updateDoc = {}
    updateDoc[`variants.$.stock`] = variant.stock - quantityChange
    
    db.products.updateOne(
      {"variants.sku": sku},
      {$inc: updateDoc},
      {session}
    )
    
    // 记录库存变动
    db.inventoryLogs.insertOne({
      sku: sku,
      operation: operation,
      quantity: quantityChange,
      previousStock: variant.stock,
      newStock: variant.stock - quantityChange,
      reason: "订单处理",
      timestamp: new Date()
    }, {session})
    
    session.commitTransaction()
    
  } catch (error) {
    session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// 5. 商品推荐系统
function getRecommendations(userId, limit = 10) {
  return db.orders.aggregate([
    // 找出用户购买过的商品类别
    {$match: {"customer.userId": ObjectId(userId)}},
    {$unwind: "$items"},
    {$lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
    }},
    {$unwind: "$product"},
    
    // 统计用户偏好的类别
    {$group: {
      _id: "$product.category.main",
      purchaseCount: {$sum: 1}
    }},
    {$sort: {purchaseCount: -1}},
    {$limit: 3},
    
    // 查找相似类别的热门商品
    {$lookup: {
      from: "products",
      let: {category: "$_id"},
      pipeline: [
        {$match: {
          $expr: {$eq: ["$category.main", "$category"]},
          status: "active"
        }},
        {$sort: {"ratings.average": -1, "ratings.count": -1}},
        {$limit: limit}
      ],
      as: "recommendations"
    }},
    
    {$unwind: "$recommendations"},
    {$replaceRoot: {newRoot: "$recommendations"}},
    {$limit: limit}
  ])
}
```

---

## 12. 面试问题集锦

### 12.1. 基础概念题

**Q1: 什么是MongoDB？它与关系型数据库有什么区别？**

A: MongoDB是一个面向文档的NoSQL数据库，主要区别包括：

- **数据模型**: MongoDB存储BSON文档，关系型数据库存储表格数据
- **Schema**: MongoDB是schema-free，关系型数据库有固定schema
- **扩展性**: MongoDB易于水平扩展，关系型数据库主要垂直扩展
- **查询语言**: MongoDB使用自己的查询语法，关系型数据库使用SQL
- **事务**: MongoDB 4.0+支持多文档事务，关系型数据库天然支持ACID事务

**Q2: 解释MongoDB中的BSON是什么？**

A: BSON (Binary JSON) 是MongoDB使用的二进制格式：

- 扩展了JSON类型系统，增加了Date、ObjectId、Binary等类型
- 比JSON更节省空间和更快的解析速度
- 保持了JSON的易读性和灵活性
- 支持嵌套文档和数组

**Q3: 什么是ObjectId？它的结构是什么？**

A: ObjectId是MongoDB中文档的默认主键：

```text
ObjectId = 4字节时间戳 + 5字节随机值 + 3字节递增计数器
- 前4字节：Unix时间戳，确保时间排序
- 接下来5字节：机器和进程的随机值
- 最后3字节：自增计数器，确保同一秒内的唯一性
```

### 12.2. 查询与索引题

**Q4: 解释MongoDB中的索引类型？**

A: MongoDB支持多种索引类型：

```javascript
// 1. 单字段索引
db.collection.createIndex({field: 1})

// 2. 复合索引  
db.collection.createIndex({field1: 1, field2: -1})

// 3. 多键索引（数组字段自动创建）
db.collection.createIndex({arrayField: 1})

// 4. 文本索引
db.collection.createIndex({title: "text", content: "text"})

// 5. 地理空间索引
db.collection.createIndex({location: "2dsphere"})

// 6. 哈希索引
db.collection.createIndex({field: "hashed"})

// 7. 稀疏索引
db.collection.createIndex({field: 1}, {sparse: true})

// 8. 唯一索引
db.collection.createIndex({email: 1}, {unique: true})

// 9. TTL索引
db.collection.createIndex({createdAt: 1}, {expireAfterSeconds: 3600})
```

**Q5: 如何优化MongoDB查询性能？**

A: MongoDB查询优化策略：

```javascript
// 1. 使用explain()分析查询
db.collection.find({field: value}).explain("executionStats")

// 2. 创建合适的索引
db.collection.createIndex({queryField: 1})

// 3. 复合索引的字段顺序：等值查询 -> 范围查询 -> 排序
db.collection.createIndex({status: 1, createdAt: 1, priority: -1})

// 4. 使用投影限制返回字段
db.collection.find({}, {name: 1, email: 1})

// 5. 使用limit限制结果集
db.collection.find().limit(100)

// 6. 避免否定查询
db.collection.find({status: {$ne: "inactive"}}) // 避免
db.collection.find({status: "active"}) // 推荐

// 7. 使用聚合管道优化复杂查询
db.collection.aggregate([
  {$match: {status: "active"}}, // 先过滤
  {$sort: {createdAt: -1}},     // 再排序
  {$limit: 100}                 // 最后限制
])
```

### 12.3. 聚合框架题

**Q6: 解释MongoDB聚合框架的工作原理？**

A: MongoDB聚合框架基于管道（Pipeline）概念：

```javascript
// 聚合管道示例
db.orders.aggregate([
  // 第1阶段：匹配条件
  {$match: {
    status: "completed",
    orderDate: {$gte: new Date("2024-01-01")}
  }},
  
  // 第2阶段：展开数组字段
  {$unwind: "$items"},
  
  // 第3阶段：分组聚合
  {$group: {
    _id: "$items.category",
    totalRevenue: {$sum: {$multiply: ["$items.price", "$items.quantity"]}},
    orderCount: {$sum: 1},
    avgOrderValue: {$avg: "$totalAmount"}
  }},
  
  // 第4阶段：排序
  {$sort: {totalRevenue: -1}},
  
  // 第5阶段：限制结果
  {$limit: 10}
])
```

**Q7: $lookup操作符如何使用？什么时候使用？**

A: $lookup用于实现类似SQL JOIN的关联查询：

```javascript
// 基本用法
db.orders.aggregate([
  {$lookup: {
    from: "users",              // 关联集合
    localField: "userId",       // 本集合字段
    foreignField: "_id",        // 关联集合字段  
    as: "userInfo"             // 输出字段名
  }}
])

// 高级用法：带条件的lookup
db.orders.aggregate([
  {$lookup: {
    from: "products",
    let: {orderItems: "$items"},
    pipeline: [
      {$match: {
        $expr: {$in: ["$_id", "$orderItems.productId"]},
        status: "active"
      }},
      {$project: {name: 1, price: 1}}
    ],
    as: "productDetails"
  }}
])

// 使用场景：
// 1. 需要展示关联数据（如订单显示用户信息）
// 2. 数据统计分析（如用户订单汇总）
// 3. 替代应用层的多次查询
```

### 12.4. 复制集与分片题

**Q8: 什么是MongoDB复制集？如何配置？**

A: 复制集是MongoDB的高可用解决方案：

```javascript
// 初始化复制集
rs.initiate({
  _id: "myReplicaSet",
  members: [
    {_id: 0, host: "mongo1:27017", priority: 2}, // Primary优先级高
    {_id: 1, host: "mongo2:27017", priority: 1}, // Secondary
    {_id: 2, host: "mongo3:27017", priority: 0, arbiterOnly: true} // Arbiter
  ]
})

// 特点：
// 1. 自动故障转移
// 2. 数据冗余备份  
// 3. 读写分离（可配置读偏好）
// 4. 最少需要3个节点（或2个数据节点+1个仲裁节点）
```

**Q9: 什么时候需要使用分片？如何设计分片键？**

A: 分片的使用场景和分片键设计：

```javascript
// 使用分片的场景：
// 1. 数据量超过单机存储能力（TB级别）
// 2. 读写QPS超过单机处理能力
// 3. 需要水平扩展存储和计算能力

// 分片键设计原则：
// 1. 高基数（Cardinality）- 取值范围要广
// 2. 低频率（Frequency）- 避免数据倾斜
// 3. 单调变化避免（Non-monotonically changing）

// 好的分片键示例：
sh.shardCollection("app.users", {userId: "hashed"}) // 哈希分片
sh.shardCollection("app.logs", {timestamp: 1, userId: 1}) // 复合分片键
sh.shardCollection("app.products", {category: 1, productId: 1})

// 避免的分片键：
// {_id: 1} - ObjectId是单调递增的
// {timestamp: 1} - 时间戳单调递增
// {status: 1} - 基数太低
```

### 12.5. 性能优化题

**Q10: 如何监控MongoDB性能？**

A: MongoDB性能监控方法：

```javascript
// 1. 数据库性能分析
db.enableFreeMonitoring() // 启用免费监控

// 2. 慢查询分析
db.setProfilingLevel(2, {slowms: 100}) // 记录>100ms的操作
db.system.profile.find().limit(5).sort({ts: -1}).pretty()

// 3. 实时监控
db.serverStatus() // 服务器状态
db.stats() // 数据库统计
db.collection.stats() // 集合统计

// 4. 当前操作监控
db.currentOp({
  "active": true,
  "secs_running": {"$gte": 5}
}) // 查看运行超过5秒的操作

// 5. 索引使用分析
db.collection.aggregate([{$indexStats: {}}])

// 6. 连接池监控
db.serverStatus().connections

// 7. 锁信息
db.serverStatus().globalLock
```

**Q11: MongoDB写关注和读偏好如何配置？**

A: 写关注（Write Concern）和读偏好（Read Preference）配置：

```javascript
// 写关注级别
db.collection.insertOne(
  {name: "test"},
  {
    writeConcern: {
      w: "majority",        // 等待大多数节点确认
      j: true,              // 等待写入journal
      wtimeout: 5000        // 5秒超时
    }
  }
)

// 写关注选项：
// w: 1 - 只等待primary确认（默认）
// w: "majority" - 等待大多数节点确认
// w: 0 - 不等待确认（最快但不安全）

// 读偏好设置
db.collection.find().readPref("secondary") // 从secondary读取
db.collection.find().readPref("primaryPreferred") // 优先primary

// 读偏好选项：
// primary - 只从primary读（默认）
// primaryPreferred - 优先primary，不可用时从secondary
// secondary - 只从secondary读
// secondaryPreferred - 优先secondary，不可用时从primary
// nearest - 从网络延迟最小的节点读
```

### 12.6. 事务与一致性题

**Q12: MongoDB支持事务吗？如何使用？**

A: MongoDB 4.0+支持多文档ACID事务：

```javascript
// 单文档事务（自动支持）
db.accounts.updateOne(
  {_id: "account1"},
  {$inc: {balance: -100}}
)

// 多文档事务
const session = db.getMongo().startSession()

try {
  session.startTransaction({
    readConcern: {level: "snapshot"},
    writeConcern: {w: "majority"}
  })
  
  // 转账操作
  db.accounts.updateOne(
    {_id: "account1"},
    {$inc: {balance: -100}},
    {session}
  )
  
  db.accounts.updateOne(
    {_id: "account2"}, 
    {$inc: {balance: 100}},
    {session}
  )
  
  // 记录转账日志
  db.transactions.insertOne({
    from: "account1",
    to: "account2",
    amount: 100,
    timestamp: new Date()
  }, {session})
  
  session.commitTransaction()
  
} catch (error) {
  session.abortTransaction()
  throw error
} finally {
  session.endSession()
}

// 事务使用场景：
// 1. 金融转账操作
// 2. 订单处理（扣库存、创建订单、更新用户积分）
// 3. 多集合数据一致性要求的操作
```

**Q13: 如何处理MongoDB的数据一致性问题？**

A: MongoDB数据一致性保障策略：

```javascript
// 1. 文档级原子性（单文档操作天然原子）
db.users.updateOne(
  {_id: userId},
  {
    $inc: {balance: -100, orderCount: 1},
    $push: {orders: orderId},
    $set: {lastOrderDate: new Date()}
  }
)

// 2. 使用事务保证多文档一致性
function transferMoney(fromId, toId, amount) {
  const session = db.getMongo().startSession()
  
  try {
    session.startTransaction()
    
    const fromAccount = db.accounts.findOne({_id: fromId}, {session})
    if (fromAccount.balance < amount) {
      throw new Error("余额不足")
    }
    
    db.accounts.updateOne(
      {_id: fromId},
      {$inc: {balance: -amount}},
      {session}
    )
    
    db.accounts.updateOne(
      {_id: toId},
      {$inc: {balance: amount}},
      {session}
    )
    
    session.commitTransaction()
  } catch (error) {
    session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// 3. 最终一致性模式（适用于不需要强一致性的场景）
// 订单创建 -> 异步更新库存 -> 异步更新用户统计
function createOrderEventually(orderData) {
  // 1. 先创建订单
  const orderId = db.orders.insertOne(orderData).insertedId
  
  // 2. 发布事件到消息队列
  publishEvent('order.created', {
    orderId: orderId,
    items: orderData.items,
    userId: orderData.userId
  })
  
  return orderId
}

// 4. 使用唯一索引防止重复
db.orders.createIndex({orderNumber: 1}, {unique: true})
db.users.createIndex({email: 1}, {unique: true})
```

### 12.7. 实际应用题

**Q14: 如何设计一个高并发的商品秒杀系统？**

A: MongoDB实现秒杀系统的关键设计：

```javascript
// 1. 商品库存设计（使用版本号乐观锁）
db.products.insertOne({
  _id: ObjectId("product_id"),
  name: "限量商品",
  stock: 100,
  version: 1,  // 版本号
  saleStart: new Date("2024-08-07T20:00:00Z"),
  saleEnd: new Date("2024-08-07T20:05:00Z")
})

// 2. 秒杀逻辑（原子操作减库存）
function seckill(productId, userId, quantity = 1) {
  const now = new Date()
  
  // 预检查（减少数据库压力）
  const product = db.products.findOne({
    _id: ObjectId(productId),
    stock: {$gte: quantity},
    saleStart: {$lte: now},
    saleEnd: {$gte: now}
  })
  
  if (!product) {
    return {success: false, message: "商品不存在或活动未开始"}
  }
  
  // 原子减库存
  const result = db.products.updateOne({
    _id: ObjectId(productId),
    stock: {$gte: quantity},
    version: product.version  // 乐观锁
  }, {
    $inc: {stock: -quantity, version: 1},
    $push: {
      purchaseLog: {
        userId: userId,
        quantity: quantity,
        timestamp: now
      }
    }
  })
  
  if (result.modifiedCount === 0) {
    return {success: false, message: "库存不足或商品已更新"}
  }
  
  // 创建订单（可异步处理）
  const orderId = db.orders.insertOne({
    userId: userId,
    productId: ObjectId(productId),
    quantity: quantity,
    status: "pending",
    createdAt: now
  }).insertedId
  
  return {success: true, orderId: orderId}
}

// 3. 防刷机制
db.seckillLogs.createIndex({userId: 1, productId: 1}, {unique: true}) // 防止重复购买
db.seckillLogs.createIndex({ip: 1, createdAt: 1}) // IP限制
db.seckillLogs.createIndex({createdAt: 1}, {expireAfterSeconds: 3600}) // 日志过期

// 4. 缓存预热和降级
// 使用Redis缓存商品信息和库存
// MongoDB作为最终数据持久化
```

**Q15: 如何处理MongoDB的大数据量查询和分页？**

A: 大数据量处理和分页优化：

```javascript
// 1. 避免使用skip进行深度分页（性能差）
// 错误做法：
db.posts.find().skip(10000).limit(20) // 非常慢

// 2. 使用游标分页（Cursor Pagination）
function getCursorPagination(lastId = null, limit = 20) {
  let query = {}
  if (lastId) {
    query._id = {$gt: ObjectId(lastId)}
  }
  
  const results = db.posts.find(query)
    .sort({_id: 1})
    .limit(limit + 1) // 多查一个判断是否有下一页
  
  const hasNext = results.length > limit
  if (hasNext) {
    results.pop() // 移除多余的一个
  }
  
  return {
    data: results,
    hasNext: hasNext,
    nextCursor: results.length > 0 ? results[results.length - 1]._id : null
  }
}

// 3. 时间范围分页
function getTimeBasedPagination(lastDate = null, limit = 20) {
  let query = {}
  if (lastDate) {
    query.createdAt = {$lt: new Date(lastDate)}
  }
  
  return db.posts.find(query)
    .sort({createdAt: -1})
    .limit(limit)
}

// 4. 聚合分页（复杂查询场景）
function getAggregationPagination(page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit
  
  const pipeline = [
    {$match: filters},
    {$sort: {createdAt: -1}},
    {$facet: {
      data: [
        {$skip: skip},
        {$limit: limit}
      ],
      totalCount: [
        {$count: "count"}
      ]
    }}
  ]
  
  const result = db.posts.aggregate(pipeline).next()
  const total = result.totalCount[0]?.count || 0
  
  return {
    data: result.data,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      pages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1
    }
  }
}

// 5. 大数据量统计优化
// 使用聚合管道 + 采样
db.hugecollection.aggregate([
  {$sample: {size: 10000}}, // 随机采样
  {$group: {
    _id: "$category",
    avgPrice: {$avg: "$price"},
    count: {$sum: 1}
  }}
])

// 6. 分批处理大数据集
function processBigData(batchSize = 1000) {
  let processed = 0
  let lastId = null
  
  while (true) {
    const query = lastId ? {_id: {$gt: lastId}} : {}
    const batch = db.bigcollection.find(query)
      .sort({_id: 1})
      .limit(batchSize)
      .toArray()
    
    if (batch.length === 0) break
    
    // 处理批次数据
    batch.forEach(doc => {
      // 业务处理逻辑
      processDocument(doc)
    })
    
    lastId = batch[batch.length - 1]._id
    processed += batch.length
    
    console.log(`已处理 ${processed} 条记录`)
  }
}
```

### 12.8. 架构设计题

**Q16: 如何设计MongoDB的备份和恢复策略？**

A: MongoDB备份恢复最佳实践：

```bash
# 1. mongodump/mongorestore（适合小型数据库）
# 全库备份
mongodump --host localhost:27017 --out /backup/mongodb-$(date +%Y%m%d)

# 指定数据库备份
mongodump --host localhost:27017 --db myapp --out /backup/myapp-$(date +%Y%m%d)

# 恢复数据
mongorestore --host localhost:27017 --drop /backup/mongodb-20240807/

# 2. 文件系统快照（适合大型数据库）
# 停止写入或使用db.fsyncLock()
db.fsyncLock()
# 创建文件系统快照
sudo lvm snapshot /dev/vg0/mongodb-data
# 解除锁定
db.fsyncUnlock()

# 3. 复制集的备份策略
# 从Secondary节点备份，不影响Primary性能
mongodump --host secondary-host:27017 --oplog

# 4. 时间点恢复（Point-in-Time Recovery）
# 结合全量备份和oplog重放
mongorestore /backup/full-backup
mongorestore --oplogReplay /backup/oplog-replay

# 5. MongoDB Atlas的自动备份
# 云版本提供连续备份和时间点恢复
```

```javascript
// 备份脚本示例
function createBackupStrategy() {
  return {
    // 每日全量备份
    daily: {
      schedule: "0 2 * * *", // 凌晨2点
      retention: "30d",      // 保留30天
      command: "mongodump --host replica-set/host1,host2,host3 --oplog"
    },
    
    // 每小时增量备份（oplog）
    hourly: {
      schedule: "0 * * * *", // 每小时
      retention: "7d",       // 保留7天
      command: "mongodump --host secondary --oplog --query '{ts:{$gt:ObjectId(\"...\")}}'"
    },
    
    // 周备份（归档）
    weekly: {
      schedule: "0 3 * * 0", // 周日凌晨3点
      retention: "12w",      // 保留12周
      storage: "offsite"     // 异地存储
    }
  }
}
```

**Q17: 如何进行MongoDB的容量规划？**

A: MongoDB容量规划考虑因素：

```javascript
// 1. 数据增长预估
function calculateDataGrowth() {
  const currentData = db.stats()
  
  return {
    currentSize: currentData.dataSize,
    indexSize: currentData.indexSize,
    totalSize: currentData.storageSize,
    
    // 预估增长（基于历史数据）
    monthlyGrowthRate: 0.15, // 15%月增长
    yearlyProjection: currentData.dataSize * Math.pow(1.15, 12),
    
    // 考虑压缩比例
    compressionRatio: 0.7, // WiredTiger压缩比例
    actualStorageNeeded: currentData.dataSize * 0.7
  }
}

// 2. 性能需求评估
const performanceRequirements = {
  // 读写QPS需求
  readQPS: 10000,
  writeQPS: 2000,
  
  // 延迟要求
  maxReadLatency: 10,   // ms
  maxWriteLatency: 50,  // ms
  
  // 并发连接数
  maxConnections: 1000,
  
  // 可用性要求
  uptime: "99.9%",
  rto: 30, // Recovery Time Objective (seconds)
  rpo: 60  // Recovery Point Objective (seconds)
}

// 3. 硬件规划
const hardwareSpecs = {
  // CPU规划
  cpu: {
    cores: Math.ceil((performanceRequirements.readQPS + performanceRequirements.writeQPS) / 1000),
    frequency: "2.4GHz+",
    recommendation: "高频率比多核心更重要"
  },
  
  // 内存规划
  memory: {
    // 工作集大小 + 操作系统 + 连接开销
    workingSetSize: "50GB", // 热数据
    osOverhead: "8GB",
    connectionOverhead: performanceRequirements.maxConnections * 1, // 1MB per connection
    totalRAM: "64GB",
    recommendation: "工作集应完全放入内存"
  },
  
  // 存储规划
  storage: {
    dataSize: "500GB",
    indexSize: "100GB", 
    oplogSize: "50GB",   // 24-72小时的操作日志
    totalStorage: "1TB",
    type: "SSD",
    iops: "10000+",
    recommendation: "使用SSD，RAID 10配置"
  },
  
  // 网络规划
  network: {
    bandwidth: "1Gbps+",
    latency: "<1ms", // 集群内部
    recommendation: "专用网络，低延迟"
  }
}

// 4. 集群架构规划
const clusterArchitecture = {
  // 复制集配置
  replicaSet: {
    primary: 1,
    secondary: 2, // 至少2个
    arbiter: 0,   // 推荐使用数据节点代替仲裁节点
    hidden: 1,    // 用于备份和分析
    delayed: 1    // 延迟节点，防误删
  },
  
  // 分片配置（大数据量场景）
  sharding: {
    enabled: true,
    configServers: 3,  // 配置服务器复制集
    mongosRouters: 2,  // 路由器（应用层前面）
    shards: [
      {name: "shard1", replicas: 3},
      {name: "shard2", replicas: 3},
      {name: "shard3", replicas: 3}
    ],
    shardKey: {userId: "hashed"} // 分片键选择
  }
}
```

### 12.9. 故障排查题

**Q18: MongoDB常见性能问题和解决方案？**

A: MongoDB性能问题诊断和解决：

```javascript
// 1. 慢查询诊断
db.setProfilingLevel(2, {slowms: 100})

// 分析慢查询
db.system.profile.find().limit(5).sort({ts: -1}).forEach(
  function(op) {
    print("命令: " + JSON.stringify(op.command))
    print("执行时间: " + op.millis + "ms")
    print("扫描文档数: " + op.docsExamined)
    print("返回文档数: " + op.docsReturned)
    print("---")
  }
)

// 2. 锁争用问题
db.serverStatus().globalLock.currentQueue // 查看锁队列
db.currentOp({"waitingForLock": true})     // 查看等待锁的操作

// 解决方案：
// - 优化查询，减少锁持有时间
// - 使用合适的索引
// - 考虑读写分离
// - 升级到WiredTiger存储引擎（文档级锁）

// 3. 内存压力问题
const memStats = db.serverStatus().mem
const wiredTiger = db.serverStatus().wiredTiger

console.log({
  resident: memStats.resident,      // 物理内存使用
  virtual: memStats.virtual,        // 虚拟内存使用
  cacheSize: wiredTiger.cache["bytes currently in the cache"],
  cacheDirty: wiredTiger.cache["bytes dirty in the cache"]
})

// 内存优化：
// - 增加物理内存
// - 调整WiredTiger缓存大小
// - 优化查询减少内存使用
// - 使用投影限制返回字段

// 4. 连接池问题
db.serverStatus().connections
// 解决方案：
// - 配置合适的连接池大小
// - 使用连接池监控
// - 检查连接泄漏

// 5. 磁盘I/O问题
db.serverStatus().wiredTiger.cache // 缓存命中率
db.serverStatus().wiredTiger["block-manager"] // I/O统计

// I/O优化：
// - 使用SSD存储
// - 增加内存提高缓存命中率
// - 优化数据模型减少I/O
// - 考虑数据压缩
```

**Q19: 如何处理MongoDB的数据迁移？**

A: MongoDB数据迁移策略：

```javascript
// 1. 在线迁移（零停机）
// 使用Change Streams实现实时同步
const changeStream = db.sourceCollection.watch([
  {$match: {"fullDocument.status": "active"}}
])

changeStream.on('change', next => {
  switch(next.operationType) {
    case 'insert':
      db.targetCollection.insertOne(next.fullDocument)
      break
    case 'update':
      db.targetCollection.updateOne(
        {_id: next.documentKey._id},
        {$set: next.updateDescription.updatedFields}
      )
      break
    case 'delete':
      db.targetCollection.deleteOne({_id: next.documentKey._id})
      break
  }
})

// 2. 批量数据迁移
function migrateCollection(sourceCol, targetCol, batchSize = 1000) {
  let lastId = null
  let totalMigrated = 0
  
  while (true) {
    const query = lastId ? {_id: {$gt: lastId}} : {}
    const batch = sourceCol.find(query)
      .sort({_id: 1})
      .limit(batchSize)
      .toArray()
    
    if (batch.length === 0) break
    
    // 数据转换逻辑
    const transformedBatch = batch.map(doc => {
      return {
        ...doc,
        migratedAt: new Date(),
        version: "v2"
      }
    })
    
    // 批量插入
    targetCol.insertMany(transformedBatch)
    
    lastId = batch[batch.length - 1]._id
    totalMigrated += batch.length
    
    console.log(`迁移进度: ${totalMigrated} 条记录`)
  }
}

// 3. 跨集群迁移
// 使用mongodump/mongorestore
mongodump --host source-cluster --out /tmp/migration
mongorestore --host target-cluster /tmp/migration

// 4. 数据校验
function validateMigration(sourceCol, targetCol) {
  const sourceCount = sourceCol.countDocuments()
  const targetCount = targetCol.countDocuments()
  
  console.log(`源集合文档数: ${sourceCount}`)
  console.log(`目标集合文档数: ${targetCount}`)
  
  if (sourceCount !== targetCount) {
    console.log("⚠️ 文档数量不一致！")
  }
  
  // 抽样验证数据一致性
  const sampleDocs = sourceCol.aggregate([{$sample: {size: 100}}])
  
  sampleDocs.forEach(doc => {
    const targetDoc = targetCol.findOne({_id: doc._id})
    if (!targetDoc) {
      console.log(`❌ 缺失文档: ${doc._id}`)
    }
  })
}
```

---

## 13. 总结

MongoDB作为领先的NoSQL数据库，在现代应用开发中扮演着重要角色。通过本指南的学习，你应该能够：

### 13.1. 掌握的核心技能：

1. **基础操作**：CRUD操作、索引管理、聚合查询
2. **高级特性**：复制集、分片、事务处理
3. **性能优化**：查询优化、索引策略、监控诊断
4. **架构设计**：数据建模、容量规划、高可用设计

### 13.2. 实际应用能力：

- 设计高性能的数据库架构
- 处理大数据量的查询和存储
- 实现高可用和故障恢复
- 进行性能调优和问题排查

### 13.3. 面试准备：

- 理解MongoDB的核心概念和原理
- 掌握常见问题的解决方案
- 具备实际项目经验和最佳实践

继续学习建议：

1. 多做实践项目，加深理解
2. 关注MongoDB官方文档和社区动态
3. 学习相关生态工具（如MongoDB Compass、Atlas等）
4. 了解与其他技术的集成（如微服务、大数据分析等）

MongoDB的学习是一个持续的过程，随着技术的发展和项目需求的变化，需要不断更新知识和技能。希望这个指南能为你的MongoDB学习之旅提供有价值的参考！