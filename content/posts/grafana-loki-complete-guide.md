---
title: "Grafana Loki 完全指南：架构、组件、安装与 Kubernetes 实践"
date: 2026-10-14T17:51:52+08:00
lastmod: 2026-10-14T17:51:52+08:00
draft: false
tags: ["k8s", "grafana", "loki"]
categories: ["k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

> 版本说明：Loki 3.x 迭代较快，尤其是 Helm Chart 的部署模式和实验性组件（如 Bloom）。本文以 3.x 为准，落地前请对照官方文档核对 values 字段。
>
> 采集器说明：Promtail 已进入 EOL，官方推荐迁移到 Grafana Alloy，本文采集端统一使用 Alloy。

---

## 一、Loki 是什么

Loki 是 Grafana Labs 开源的**水平可扩展、多租户的日志聚合系统**，口号是 "Like Prometheus, but for logs"。

和 Elasticsearch 的核心区别：

| | Loki | Elasticsearch |
|---|---|---|
| 索引内容 | 只索引**标签**（元数据） | 对日志**全文**建倒排索引 |
| 存储成本 | 低（压缩块存对象存储） | 高（索引体积常与原文相当） |
| 查询方式 | 标签筛选 + 分布式 grep（LogQL） | 全文检索 DSL |
| 运维复杂度 | 较低 | 较高 |
| 适合场景 | 运维排障、应用日志、与 Metrics/Trace 联动 | 复杂全文检索、日志分析 |

因此 Loki 的使用关键在于：**标签设计要克制，正文靠 LogQL 过滤**。

---

## 二、整体架构与数据流

```
应用日志 → 采集器（Alloy / Promtail / Fluent Bit …）
              │ HTTP push
              ▼
        ┌─ Distributor ─┐         写路径
        │  （校验/分片）  │
        └──────┬────────┘
               ▼  一致性哈希环 + 副本
          Ingester ×N  （内存 + WAL → 压缩成 chunk）
               │ flush
               ▼
     对象存储（chunks） + TSDB 索引

Grafana ──► Query Frontend ──► Query Scheduler ──► Querier ×N     读路径
                （拆分/缓存）      （队列）         ├─ 查 Ingester（近期数据）
                                                    └─ 查对象存储（历史数据，经 Index Gateway）
```

**写路径**：采集器推送 → Distributor 校验并按 stream 哈希 → 写入多个 Ingester（默认 3 副本）→ Ingester 在内存中攒 chunk 并写 WAL → 满足大小/时间条件后刷到对象存储。

**读路径**：Query Frontend 把大查询按时间拆成小查询并缓存结果 → Querier 同时查 Ingester（未刷盘的新数据）和对象存储（历史数据）→ 合并去重返回。

---

## 三、Loki 全部组件详解

Loki 是**单一二进制**，通过 `-target` 参数决定运行哪些组件，所以同一个镜像可以按不同模式部署。

### 3.1 写路径组件

**Distributor（分发器）**

- 入口，接收采集器的 push 请求。
- 校验标签数量、日志行长度、时间戳、租户限速。
- 对 stream 做一致性哈希，转发给 N 个 Ingester。
- **无状态**，可随意横向扩容。

**Ingester（摄取器）**

- 有状态组件，把日志按 stream 在内存中构建 chunk。
- 写 **WAL**（预写日志），宕机重启可回放，避免丢数据。
- chunk 达到大小或空闲超时后 flush 到对象存储。
- 也负责响应近期数据的查询，所以内存是它的关键资源。
- 通过 **Ring**（基于 memberlist / etcd / consul）管理成员。

### 3.2 读路径组件

**Query Frontend（查询前端）**

- 查询的入口，无状态。
- 按时间间隔拆分查询、并行执行、结果缓存、失败重试。
- 把拆分后的子查询放入队列。

**Query Scheduler（查询调度器，可选）**

- 在 Frontend 与 Querier 之间维护队列，实现按租户的公平调度。
- 让 Frontend 和 Querier 可以独立扩缩容，大规模集群建议启用。

**Querier（查询器）**

- 真正执行 LogQL 的组件。
- 从 Ingester 拉近期数据，从对象存储拉历史数据，做合并与去重。

**Index Gateway（索引网关，可选）**

- 对 Querier 提供索引查询服务，避免每个 Querier 都下载本地索引副本。
- 降低 Querier 的磁盘和启动开销，生产环境推荐。

### 3.3 后台与管理组件

**Compactor（压缩器）**

- 合并小的索引文件。
- **负责日志保留（retention）和按条件删除**，是实现"日志保留 N 天"的关键组件。
- 通常只运行一个实例。

**Ruler（规则引擎）**

- 周期性执行 LogQL 规则。
- 支持**告警规则**（对接 Alertmanager）和**记录规则**（把日志转成 Metrics，通过 remote write 写入 Prometheus 兼容存储）。

**Pattern Ingester（3.x）**

- 从日志中自动提取模式（pattern），支撑 Grafana 的 Explore Logs 等功能。

**Bloom Planner / Builder / Gateway（实验性）**

- 基于布隆过滤器加速"大范围、低命中率"的文本过滤查询。
- 3.x 引入，仍属实验性质，生产使用要谨慎评估。

**Overrides Exporter（可选）**

- 把各租户的限额配置以 Metrics 形式导出，方便监控和告警。

### 3.4 缓存与配套组件

**Memcached 缓存（外部）**

- 常见三类：**chunks cache**、**results cache**（查询结果）、**index 及其他缓存**。
- 显著降低对象存储的读取压力和查询延迟。

**Gateway（nginx，Helm 内置）**

- Helm 部署时前置的反向代理，统一对外提供 push / query 入口，并可做租户鉴权。

**Loki Canary**

- 金丝雀：持续写入带时间戳的日志再回查，用来**验证端到端是否丢日志、延迟多少**。

**Ring / Memberlist**

- Distributor、Ingester、Compactor 等通过 Ring 做成员发现与分片，默认用 memberlist（gossip），无需外部 KV。

### 3.5 存储

- **Chunks（日志正文）**：压缩后存对象存储（S3、GCS、Azure Blob、MinIO、OSS / COS 等）。
- **Index（索引）**：推荐 **TSDB** 格式，配合 **schema v13**；旧的 boltdb-shipper 属于历史方案。
- 本地 `filesystem` 仅适合测试，不要用于生产。

### 3.6 组件速查表

| 组件 | 路径 | 有状态 | 是否必须 | 一句话职责 |
|---|---|---|---|---|
| Distributor | 写 | 否 | 是 | 校验、限流、哈希分发 |
| Ingester | 写/读 | 是 | 是 | 内存 chunk、WAL、刷盘、近期查询 |
| Query Frontend | 读 | 否 | 推荐 | 拆分、缓存、重试 |
| Query Scheduler | 读 | 否 | 可选 | 租户公平队列 |
| Querier | 读 | 否 | 是 | 执行 LogQL |
| Index Gateway | 读 | 轻 | 可选 | 集中提供索引查询 |
| Compactor | 后台 | 轻 | 推荐 | 索引合并、保留、删除 |
| Ruler | 后台 | 轻 | 可选 | 告警与记录规则 |
| Pattern Ingester | 读 | 是 | 可选 | 日志模式提取 |
| Bloom 系列 | 读 | - | 实验性 | 布隆过滤加速 |

---

## 四、部署模式

| 模式 | 说明 | 适用 |
|---|---|---|
| **单体（Monolithic，`-target=all`）** | 所有组件一个进程，可多副本 | 测试、小规模 |
| **简单可扩展（SSD）** | 拆成 read / write / backend 三个目标 | 中等规模；3.x 中官方在逐步弱化此模式，请查看最新文档 |
| **微服务（Distributed）** | 每个组件独立部署、独立扩缩 | 大规模、生产重度使用 |

选型建议：先单体验证，日志量上来后迁移到微服务。对象存储和 schema 是共用的，迁移主要是调整部署形态，数据可以保留。

---

## 五、安装

### 5.1 Docker Compose（本地体验）

```yaml
services:
  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]
    command: -config.file=/etc/loki/local-config.yaml
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
  alloy:
    image: grafana/alloy:latest
    volumes:
      - ./config.alloy:/etc/alloy/config.alloy
      - /var/log:/var/log:ro
    command: run /etc/alloy/config.alloy
```

启动后在 Grafana 添加 Loki 数据源（`http://loki:3100`）即可查询。

### 5.2 二进制 + systemd

```bash
wget https://github.com/grafana/loki/releases/download/<version>/loki-linux-amd64.zip
unzip loki-linux-amd64.zip && chmod +x loki-linux-amd64
./loki-linux-amd64 -config.file=loki.yaml
```

最小配置（单机测试）：

```yaml
auth_enabled: false
server:
  http_listen_port: 3100
common:
  path_prefix: /var/lib/loki
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory
  storage:
    filesystem:
      chunks_directory: /var/lib/loki/chunks
      rules_directory: /var/lib/loki/rules
schema_config:
  configs:
    - from: 2024-04-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
limits_config:
  allow_structured_metadata: true
  retention_period: 168h
compactor:
  working_directory: /var/lib/loki/compactor
  retention_enabled: true
  delete_request_store: filesystem
```

systemd 单元：

```ini
[Unit]
Description=Loki
After=network.target

[Service]
ExecStart=/usr/local/bin/loki -config.file=/etc/loki/loki.yaml
Restart=always
User=loki

[Install]
WantedBy=multi-user.target
```

---

## 六、Kubernetes 中使用

### 6.1 用 Helm 部署 Loki

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
kubectl create namespace logging
```

#### 场景 A：单体模式 + 对象存储（中小规模推荐起步）

`loki-values.yaml`：

```yaml
deploymentMode: SingleBinary

loki:
  auth_enabled: false           # 多租户场景改为 true
  commonConfig:
    replication_factor: 1
  schemaConfig:
    configs:
      - from: "2024-04-01"
        store: tsdb
        object_store: s3
        schema: v13
        index:
          prefix: loki_index_
          period: 24h
  storage:
    type: s3
    bucketNames:
      chunks: loki-chunks
      ruler: loki-ruler
      admin: loki-admin
    s3:
      endpoint: http://minio.logging.svc:9000   # 公有云 S3 则填 region 即可
      region: us-east-1
      accessKeyId: <ACCESS_KEY>
      secretAccessKey: <SECRET_KEY>
      s3ForcePathStyle: true
      insecure: true
  limits_config:
    retention_period: 168h
    allow_structured_metadata: true
    volume_enabled: true
  compactor:
    retention_enabled: true
    delete_request_store: s3
  pattern_ingester:
    enabled: true

singleBinary:
  replicas: 1
  persistence:
    size: 20Gi

# 关闭其他模式的副本
read:    { replicas: 0 }
write:   { replicas: 0 }
backend: { replicas: 0 }
```

```bash
helm upgrade --install loki grafana/loki -n logging -f loki-values.yaml
```

> 密钥不要明文写在 values 里，改用 Secret + `extraEnvFrom`，或用云厂商的 IRSA / Workload Identity 等无密钥方式。

#### 场景 B：微服务模式（大规模）

```yaml
deploymentMode: Distributed

loki:
  # schemaConfig / storage 同上
  ...

distributor:    { replicas: 3, maxUnavailable: 1 }
ingester:       { replicas: 3, zoneAwareReplication: { enabled: true } }
querier:        { replicas: 3 }
queryFrontend:  { replicas: 2 }
queryScheduler: { replicas: 2 }
indexGateway:   { replicas: 2 }
compactor:      { replicas: 1 }
ruler:          { replicas: 1 }

# 单体 / SSD 组件关闭
singleBinary: { replicas: 0 }
read:         { replicas: 0 }
write:        { replicas: 0 }
backend:      { replicas: 0 }
```

微服务模式下务必为 Ingester 配置**持久卷**（WAL）和充足内存，并启用 **zone-aware replication**，避免一个可用区故障导致写入失败。

### 6.2 部署采集器（推荐 Alloy）

```bash
helm upgrade --install alloy grafana/alloy -n logging -f alloy-values.yaml
```

`alloy-values.yaml`：

```yaml
alloy:
  configMap:
    content: |
      discovery.kubernetes "pods" {
        role = "pod"
      }

      discovery.relabel "pods" {
        targets = discovery.kubernetes.pods.targets
        rule {
          source_labels = ["__meta_kubernetes_namespace"]
          target_label  = "namespace"
        }
        rule {
          source_labels = ["__meta_kubernetes_pod_name"]
          target_label  = "pod"
        }
        rule {
          source_labels = ["__meta_kubernetes_pod_container_name"]
          target_label  = "container"
        }
        rule {
          source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"]
          target_label  = "app"
        }
      }

      loki.source.kubernetes "pods" {
        targets    = discovery.relabel.pods.output
        forward_to = [loki.write.default.receiver]
      }

      loki.write "default" {
        endpoint {
          url = "http://loki-gateway.logging.svc/loki/api/v1/push"
          // 多租户时: tenant_id = "team-a"
        }
      }
controller:
  type: daemonset
```

要点：

- `loki.source.kubernetes` 通过 Kubernetes API 读取日志，不需要挂载 hostPath，部署更简单。
- 也可以用 `loki.source.file` 配合 `local.file_match` 读取节点文件，对应 Promtail 的原有方式。
- 从 Promtail 迁移可使用 `alloy convert --source-format=promtail` 自动转换配置。

### 6.3 对接 Grafana

在 Grafana 数据源里添加 Loki，URL 填 `http://loki-gateway.logging.svc`（如果开启多租户，需加请求头 `X-Scope-OrgID`）。

### 6.4 验证

```bash
kubectl -n logging get pods
kubectl -n logging port-forward svc/loki-gateway 3100:80
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={namespace="logging"}' --data-urlencode 'limit=5'
```

### 6.5 常用 LogQL

```logql
{namespace="prod", app="order"} |= "error"
{app="order"} | json | status >= 500
sum by (app) (rate({namespace="prod"} |= "error" [5m]))
topk(5, sum by (pod) (count_over_time({namespace="prod"}[1h])))
```

---

## 七、生产环境最佳实践

### 7.1 标签设计（重中之重）

- 只用低基数标签：`namespace`、`app`、`env`、`cluster`、`level`。
- `trace_id`、`user_id`、`ip`、`url` 不要做标签。3.x 可以放进 **Structured Metadata**，既能过滤又不增加 stream 数量。
- 单租户 stream 数量尽量控制在合理范围，出现 `max streams` 限制多半是标签基数过高。

### 7.2 存储与保留

- 必须使用对象存储，TSDB + schema v13。
- 保留策略在 `compactor` 中开启 `retention_enabled`，并配合 `limits_config.retention_period`（可按租户或 stream 单独设置）。
- 对象存储侧再配生命周期规则作兜底。

### 7.3 性能与缓存

- 部署 Memcached 的 chunks cache 与 results cache，对查询速度提升明显。
- 启用 Query Frontend 的查询拆分和结果缓存。
- 大集群启用 Query Scheduler 与 Index Gateway。
- 限制单次查询范围：`max_query_length`、`max_entries_limit_per_query`、`max_query_parallelism`。

### 7.4 写入限流

- 设置 `ingestion_rate_mb`、`ingestion_burst_size_mb`、`per_stream_rate_limit`，防止单个应用刷爆集群。
- 日志行过长的设置 `max_line_size`，必要时在采集端用 `drop` / `limit` 过滤低价值日志。

### 7.5 可靠性

- Ingester 开启 WAL 并挂持久卷，`replication_factor` 至少 3。
- 多可用区部署，启用 zone-aware replication。
- 为各组件配置 requests / limits、PodDisruptionBudget、反亲和。
- Ingester 滚动更新务必慢，避免多个副本同时重启。

### 7.6 多租户与安全

- `auth_enabled: true` 后通过 `X-Scope-OrgID` 区分租户。Loki 本身不做鉴权，需要在网关层（nginx / oauth2-proxy / API Gateway）加认证。
- 采集器到 Loki 启用 TLS；对象存储凭证走 IAM 角色。

### 7.7 可观测与告警

- 部署 **loki-mixin** 提供的 Dashboard 与告警规则。
- 部署 **Loki Canary**，监控丢日志与延迟。
- 重点关注：`loki_ingester_memory_streams`、`loki_distributor_bytes_received_total`、分发 429 错误、Ingester flush 失败、Compactor 是否正常运行。

### 7.8 容量规划（经验值）

- 日志量（GB/天）决定对象存储和 Ingester 内存；压缩比一般在 5~10 倍左右，具体看日志内容。
- 查询慢先排查：标签筛选不够精确、时间范围过大、缓存没开。

---

## 八、常见问题

| 问题 | 常见原因与处理 |
|---|---|
| `entry out of order` / 时间乱序 | 3.x 已默认允许一定乱序；检查多个采集器是否重复推送同一个 stream |
| `maximum active stream limit exceeded` | 标签基数过高，检查是否把 pod IP、请求路径等做了标签 |
| `429 Too Many Requests` | 触发租户限流，调高 `ingestion_rate_mb` 或在源头过滤 |
| 查询超时 | 缩小时间范围，增加标签条件，开启缓存与查询拆分 |
| 重启后数据"丢失" | Ingester 未挂持久卷或 WAL 未启用 |
| 日志没有被清理 | 未开启 `compactor.retention_enabled`，或 Compactor 没运行 |

---

## 九、选型对比与结语

- 预算有限、以排障为主、已经在用 Prometheus / Grafana → **Loki 是首选**。
- 需要复杂全文检索、聚合分析、安全审计 → 考虑 Elasticsearch / OpenSearch，或与 Loki 搭配。
- Kubernetes 场景下推荐组合：**Alloy（采集）+ Loki（存储与查询）+ Grafana（展示）+ 对象存储（低成本持久化）**。

建议的落地路径：单体模式 + 对象存储跑通 → 规范标签与保留策略 → 加缓存和监控 → 日志量增长后迁移到微服务模式。
