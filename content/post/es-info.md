---
title: "Elasticsearch 入门(一) 介绍"
date: 2020-07-16T14:22:17+08:00
lastmod: 2020-07-16T14:22:17+08:00
draft: false
tags: ["elasticsearch", "elk"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## Elasticsearch 是什么

Elasticsearch(ES) 是一个 Lucene 构建的开源,分布式,RESTful 接口全文搜索引擎.

还是一个分布式文档数据库, 其中每个字段均是被索引的数据且可被搜索,它能够扩展至数以百计的服务器存储以及处理PB级的数据.它可以在很短的时间内存储, 搜索和分析大量的数据.

**Elasticsearch就是为高可用和可扩展(水平扩展)而生**

## 优点
1. 横向可扩展性: 只需要增加一台服务器, 调整一点儿配置,启动一下Elasticsearch进程就可以并入集群.
2. 分片机制提供更好的分布性: 同一个索引分成多个分片(sharding), 这点类似于HDFS的块机制,分而治之的方式可提升处理效率.
3. 高可用:提供复制(replica)机制,一个分片可以设置多个复制,使得某台服务器在宕机的情况下,集群仍可以照常运行,并会把服务器宕机丢失的数据信息复制恢复到其它可用节点上.
4. 使用简单:解压即可使用. 无需安装(bin/elasticsearch).

## 相关产品
### Beats
它是一个代理, 将不同类型的数据发送到Elasticsearch中.
1. Filebeat: 主要用于转发和集中日志数据。
2. Metricbeat: 定期收集操作系统、软件或服务的指标数据
   Metricbeat支持收集的module非常多，常用的有docker、kafka、mysql、nginx、redis、zookeeper等等
3. Packetbeat: 是一款轻量型网络数据包分析器，Packetbeat的工作原理是捕获应用程序服务器之间的网络流量，解码应用程序层协议（HTTP，MySQL，Redis等）
4. Winlogbeat: Windows 事件日志
5. Auditbeat: Auditbeat 允许您在 Linux、macOS 和 Windows 平台上仔细监控任何您感兴趣的文件目录,主要用来记录安全信息，用于对系统安全事件的追溯
6. Heartbeat: 主要是检测服务或主机是否正常运行或存活，Heartbeat 能够通过 ICMP、TCP 和 HTTP 进行 ping 检测。
7. Functionbeat: 是在无服务器环境中部署的Elastic Beat，用于收集由云服务生成的事件并将事件发送到Elasticsearch。

## Lucene 倒排索引
倒排索引与之相对是正向索引. 正向索引是通过 `key` 找 `value`, 倒排索引是对关键字建立倒排索引

1. 正排索引: 文档ID到文档内容和单词的关联

2. **倒排索引: 单词到文档ID的关系**

例如, 假设我们有两个文档, 每个文档的内容如下:
1. 我是一名程序员
2. 我是一名高级程序员

为了创建倒排索引, 我们首先将每个文档的`content`域拆分成单独的词(称词条),创建一个包含所有不重复词条的排序列表，然后列出每个词条出现在哪个文档。结果如下所示：

| Term(索引词) | Doc_1 | Doc_2 |
| ------------ | ----- | ----- |
| 我           | x     | x     |
| 是           | x     | x     |
| 一名         | x     | x     |
| 程序员       | x     | x     |
| 高级         | x     |       |

现在，如果我们想搜索 `高级程序员` ，我们只需要查找包含每个词条的文档：

| Term(索引词) | Doc_1 | Doc_2 |
| ------------ | ----- | ----- |
| 程序员       | x     | x     |
| 高级         | x     |       |
| Total        | 2     | 1     |

两个文档都匹配，但是第一个文档比第二个匹配度更高。如果我们使用仅计算匹配词条数量的简单 *相似性算法* ，那么，我们可以说，对于我们查询的相关性来讲，第一个文档比第二个文档更佳。

注: 文档中的`是`等词没有什么实际意义, 这些不代表概念的词是可以过滤掉的.

### 倒排索引的核心组成

![](http://img.sgfoot.com/b/20200723155219.png?imageslim)





## 健康状态

1. green

   1. 所有的主分片和副本分片都已分配。你的集群是 100% 可用的。

2. yellow

   1. 所有的主分片已经分片了，但至少还有一个副本是缺失的。不会有数据丢失，所以搜索结果依然是完整的。不过，你的高可用性在某种程度上被弱化。如果 更多的 分片消失，你就会丢数据了。把 yellow 想象成一个需要及时调查的警告。

3. red 

   1. 至少一个主分片（以及它的全部副本）都在缺失中。这意味着你在缺少数据：搜索只能返回部分数据，而分配到这个分片上的写入请求会返回一个异常。

   

   查看健康状态

   ```
   curl -XGET 'http://localhost:9200/_cluster/health?pretty=true'
   ```

   查看所有索引

   ````
   curl  'localhost:9200/_cat/indices?v'
   ````

   

## 推荐阅读

1. [Elasticsearch 入门(一) 介绍](https://www.sgfoot.com/es-info.html)
2. [Elasticsearch 入门(二) 安装](https://www.sgfoot.com/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://www.sgfoot.com/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://www.sgfoot.com/es-search.html)


## 参考

[elastic之beats各组件使用](https://blog.csdn.net/yu849893679/article/details/99640921)

[Elasticsearch: 权威指南](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)