---
title: "Helm 部署 elasticsearch 集群"
date: 2024-07-03T10:07:22+08:00
lastmod: 2024-07-03T10:07:22+08:00
draft: false
tags: ["elasticsearch", "k8s", "helm"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
---
<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [1. 介绍](#1-介绍)
- [2. 版本介绍](#2-版本介绍)
- [3. 生成 elastic 证书及密码](#3-生成-elastic-证书及密码)
  - [3.1. elastic 证书配置代码](#31-elastic-证书配置代码)
  - [3.2. 添加到 secret 中](#32-添加到-secret-中)
  - [3.3. 生成密码加入 secret](#33-生成密码加入-secret)
- [4. helm 配置](#4-helm-配置)
  - [4.1. 添加 helm repo](#41-添加-helm-repo)
  - [4.2. 下载 elastic](#42-下载-elastic)
  - [4.3. 获取 values.yaml](#43-获取-valuesyaml)
- [5. elastic values 配置](#5-elastic-values-配置)
  - [5.1. 配置 master values.yaml](#51-配置-master-valuesyaml)
  - [5.2. 配置 data values.yaml](#52-配置-data-valuesyaml)
  - [5.3. 配置 client values.yaml](#53-配置-client-valuesyaml)
- [6. 部署](#6-部署)
  - [6.1. 观察](#61-观察)

<!-- /TOC -->
## 1. 介绍

Elasticsearch 是一个基于 Lucene 构建的开源搜索引擎。它提供了一个分布式多用户能力的全文搜索引擎，基于 RESTful web 接口。Elasticsearch 是用 Java 语言开发的，并且是 Apache 许可条款下的开源产品。

以下是 Elasticsearch 的一些关键特性：

1. **分布式**：Elasticsearch 设计为分布式，可以很容易地扩展到数百台服务器，处理 PB 级别的数据。

2. **实时搜索**：Elasticsearch 提供了实时搜索能力，这意味着从索引文档到搜索结果的延迟非常低。

3. **高可用性**：Elasticsearch 自动管理数据的复制和分片，确保了高可用性。

4. **易用性**：Elasticsearch 提供了一个简单的 RESTful API，使得它很容易与各种语言和平台集成。

5. **多租户**：Elasticsearch 支持多租户，允许多个用户在同一个集群上工作，而不会相互干扰。

6. **扩展性**：Elasticsearch 可以水平扩展，随着数据量的增长，可以简单地添加更多的节点到集群中。

7. **丰富的查询语言**：Elasticsearch 提供了强大的查询语言，支持复杂查询，包括结构化、非结构化、地理位置和度量数据。

8. **分析和聚合**：Elasticsearch 可以执行复杂的分析和聚合操作，帮助用户从数据中提取有价值的信息。

9. **监控和告警**：Elasticsearch 集成了监控和告警功能，帮助用户监控集群的健康状态。

10. **与其他工具的集成**：Elasticsearch 可以与 Kibana、Logstash 和 Beats 等工具集成，形成一个强大的数据处理和可视化平台。

Elasticsearch 广泛应用于日志分析、全文搜索、监控系统、信息安全等多个领域。

## 2. 版本介绍

目前主流2个版本：

1. elasticsearch 7(本次使用此版本)
2. elasticsearch 8

## 3. 生成 elastic 证书及密码

```sh
# 镜像地址
export ELASTICSEARCH_IMAGE=elasticsearch:7.17.3
# 容器名称
export ELASTIC_NAME="elastic"
# 证书存储目录
export WORK_DIR="$PWD/elastic-certs"
# 容器内的证书存储目录
export CERTS_DIR="/tmp/certs"
# 证书有效时间，单位：天
export DAYS=36500

# 创建目录
mkdir -p $WORK_DIR

# 运行容器，生成证书
docker run --rm -i --name ${ELASTIC_NAME} \
    -e discovery.type=single-node \
    -e xpack.security.enabled=true \
    -v $WORK_DIR:$CERTS_DIR \
    $ELASTICSEARCH_IMAGE /bin/sh <<EOF
#!/bin/bash
# 使用elasticsearch-certutil创建CA文件
bin/elasticsearch-certutil ca --out $CERTS_DIR/elastic-stack-ca.p12 --pass '' --days $DAYS

# 使用上面的CA来创建节点证书
bin/elasticsearch-certutil cert --name security-master --dns security-master --ca $CERTS_DIR/elastic-stack-ca.p12 --pass '' --ca-pass '' --out $CERTS_DIR/elastic-certificates.p12 --days $DAYS
EOF

# 将 pcks12 中的信息分离出来，写入文件
openssl pkcs12 -nodes -passin pass:'' -in $WORK_DIR/elastic-certificates.p12 -out $WORK_DIR/elastic-certificate.pem

# 查看证书有效期
openssl pkcs12 -in $WORK_DIR/elastic-certificates.p12 -nodes -passin pass:'' | openssl x509 -noout -dates
```

### 3.1. elastic 证书配置代码

```conf
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: /path/to/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: /path/to/elastic-stack-ca.p12
```

### 3.2. 添加到 secret 中

```sh
# 添加证书
cd $WORK_DIR
kubectl -n elastic create secret generic elastic-certificates --from-file=elastic-certificates.p12
kubectl -n elastic create secret generic elastic-certificate-pem --from-file=elastic-certificate.pem
```

### 3.3. 生成密码加入 secret

```sh
# 创建密码
ELASTIC_USER=elastic
ELASTIC_PASSWORD="强密码"

# 创建空间名
kubectl create ns elastic

# 创建 Secret
kubectl create secret generic elastic-credentials -n elastic \
  --from-literal=username="${ELASTIC_USER}" \
  --from-literal=password="${ELASTIC_PASSWORD}" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 4. helm 配置

### 4.1. 添加 helm repo

```sh
helm repo add elastic https://helm.elastic.co
```

### 4.2. 下载 elastic

```sh
helm search repo elastic/elasticsearch --version=7.17.3

helm pull elastic/elasticsearch --version=7.17.3
```

### 4.3. 获取 values.yaml

```sh
helm show values elastic/elasticsearch --version=7.17.3 > values.yaml
```

## 5. elastic values 配置

| 集群名称 |  节点角色 | 副本数 | 网络模式| 描述 |
| --- |--- |--- |--- |--- |
| elastic-cluster| master | 3 | ClusterIP | 负责集群状态管理，包括索引创建、删除和集群元数据的变更 |
| elastic-cluster| data | 3 | ClusterIP | 负责存储数据和执行数据相关的操作，如 CRUD（创建、读取、更新、删除）操作 |
| elastic-cluster| client | 3 | ClusterIP | 主要用于处理客户端请求，转发请求到适当的节点更, 负载均衡 |

### 5.1. 配置 master values.yaml

1. 负责集群状态管理，包括索引创建、删除和集群元数据的变更。
2. 负责集群的选举过程和集群设置的变更。

```sh
helm show values elastic/elasticsearch --version=7.17.3 > elastic-master-values.yaml
```

```yaml
# 集群名称，所以的配置统一名称
clusterName: "elastic-cluster"

# 标识名称
nodeGroup: "master"

# 角色设置，此为 master 角色
roles:
  master: "true"
  ingest: "false"
  data: "false"

# 副本数
replicas: 3

# 设置最小 master 节点数
minimumMasterNodes: 2

# elastic config 配置证书
esConfig: 
 elasticsearch.yml: |
  xpack.security.enabled: true
  xpack.security.transport.ssl.enabled: true
  xpack.security.transport.ssl.verification_mode: certificate
  xpack.security.transport.ssl.keystore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
  xpack.security.transport.ssl.truststore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12

# 环境变量：帐号与密码
extraEnvs: 
  - name: ELASTIC_USERNAME
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: username
  - name: ELASTIC_PASSWORD
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: password

# 自定义的 secret，即证书
secretMounts: 
 - name: elastic-certificates
   secretName: elastic-certificates
   path: /usr/share/elasticsearch/config/certs
   defaultMode: 0755

# 镜像地址
# image: "docker.elastic.co/elasticsearch/elasticsearch"
image: "elasticsearch"
imageTag: "7.17.3"
imagePullPolicy: "IfNotPresent"

# 设置 JVM 堆内存
esJavaOpts: "-Xmx1g -Xms1g" # example: "-Xmx1g -Xms1g"

# 资源配置
resources:
  requests:
    cpu: "1000m"
    memory: "2Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"

# 持久化存储，storageClass
volumeClaimTemplate:
  storageClassName: nfs
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 30Gi

# 开启持久化
persistence:
  enabled: true

# 硬性反亲和
antiAffinity: "hard"

```

### 5.2. 配置 data values.yaml

1. 负责存储数据和执行数据相关的操作，如 CRUD（创建、读取、更新、删除）操作。
2. 管理分片的分配和恢复。

```sh
helm show values elastic/elasticsearch --version=7.17.3 > elastic-data-values.yaml
```

```yaml
# 集群名称，所以的配置统一名称
clusterName: "elastic-cluster"

# 标识名称
nodeGroup: "data"

# 角色设置，此为 data 角色
roles:
  master: "false"
  ingest: "true"
  data: "true"

# 副本数
replicas: 3

# elastic config 配置证书
esConfig: 
 elasticsearch.yml: |
  xpack.security.enabled: true
  xpack.security.transport.ssl.enabled: true
  xpack.security.transport.ssl.verification_mode: certificate
  xpack.security.transport.ssl.keystore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
  xpack.security.transport.ssl.truststore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12

# 环境变量：帐号与密码
extraEnvs: 
  - name: ELASTIC_USERNAME
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: username
  - name: ELASTIC_PASSWORD
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: password

# 自定义的 secret，即证书
secretMounts: 
 - name: elastic-certificates
   secretName: elastic-certificates
   path: /usr/share/elasticsearch/config/certs
   defaultMode: 0755

# 镜像地址
# image: "docker.elastic.co/elasticsearch/elasticsearch"
image: "elasticsearch"
imageTag: "7.17.3"
imagePullPolicy: "IfNotPresent"

# 设置 JVM 堆内存
esJavaOpts: "-Xmx1g -Xms1g" # example: "-Xmx1g -Xms1g"

# 资源配置
resources:
  requests:
    cpu: "1000m"
    memory: "2Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"

# 持久化存储，storageClass
volumeClaimTemplate:
  storageClassName: nfs
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 30Gi

# 开启持久化
persistence:
  enabled: true

# 硬性反亲和
antiAffinity: "hard"
```

### 5.3. 配置 client values.yaml

1. 主要用于处理客户端请求，转发请求到适当的节点。
2. 不存储数据，不参与分片的分配。

```sh
helm show values elastic/elasticsearch --version=7.17.3 > elastic-client-values.yaml
```

```yaml
# 集群名称，所以的配置统一名称
clusterName: "elastic-cluster"
# 标识名称
nodeGroup: "client"

# 角色设置，此为 client 角色
roles:
  master: "false"
  ingest: "false"
  data: "false"

# 副本数
replicas: 3

# elastic config 配置证书
esConfig: 
 elasticsearch.yml: |
  xpack.security.enabled: true
  xpack.security.transport.ssl.enabled: true
  xpack.security.transport.ssl.verification_mode: certificate
  xpack.security.transport.ssl.keystore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
  xpack.security.transport.ssl.truststore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12

# 环境变量：帐号与密码
extraEnvs: 
  - name: ELASTIC_USERNAME
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: username
  - name: ELASTIC_PASSWORD
    valueFrom:
      secretKeyRef:
        name: elastic-credentials
        key: password

# 自定义的 secret，即证书
secretMounts: 
 - name: elastic-certificates
   secretName: elastic-certificates
   path: /usr/share/elasticsearch/config/certs
   defaultMode: 0755

# 镜像地址
# image: "docker.elastic.co/elasticsearch/elasticsearch"
image: "elasticsearch"
imageTag: "7.17.3"
imagePullPolicy: "IfNotPresent"

# 设置 JVM 堆内存
esJavaOpts: "-Xmx1g -Xms1g" # example: "-Xmx1g -Xms1g"

# 资源配置
resources:
  requests:
    cpu: "1000m"
    memory: "2Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"

# 关闭持久化，客户端无存储需求
persistence:
  enabled: false

# 硬性反亲和
antiAffinity: "hard"

```

## 6. 部署

```sh

# 先部署 master
helm upgrade --install elastic-cluster elastic/elasticsearch -n elasticsearch -f elastic-master-values.yaml

# 再部署 data
helm upgrade --install elastic-cluster elastic/elasticsearch -n elasticsearch -f elastic-data-values.yaml

# 再部署 client
helm upgrade --install elastic-cluster elastic/elasticsearch -n elasticsearch -f elastic-client-values.yaml
```

### 6.1. 观察

```sh
kubectl -n elasticsearch get pods

kubectl -n elasticsearch exec -it xxx /bin/bash

# 集群的健康状况信息
curl -X GET -u "elastic:$ELASTIC_PASSWORD" 'http://localhost:9200/_cluster/health?pretty'
# 请求集群健康状况信息
curl -X GET -u "elastic:$ELASTIC_PASSWORD" 'http://localhost:9200/_cat/health?v'
#求所有节点信息。
curl -X GET -u "elastic:$ELASTIC_PASSWORD" 'http://localhost:9200/_cat/nodes?v'
# 请求所有索引信息。
curl -X GET -u "elastic:$ELASTIC_PASSWORD" 'http://localhost:9200/_cat/indices?v'
```
