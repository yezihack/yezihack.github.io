---
title: "Elasticsearch 入门(四) 查询"
date: 2020-07-15T19:52:52+08:00
lastmod: 2020-07-15T19:52:52+08:00
draft: false
tags: ["elasticsearch", "elk"]
categories: ["elasticsearch"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""
---

# 概要

Elasticsearch对外提供的API遵循REST原则

1. GET
2. POST
3. PUT
4. DELETE

# 数据操作

## 新增记录

```
curl -X PUT 'localhost:9200/accounts/person/1' -d '
{
  "user": "张三",
  "title": "工程师",
  "desc": "数据库管理"
}' 
```
## 查询
### 带条件查询

query: 查询

desc: 是指 json 数据里的字段, 即key

```
curl http://192.168.70.220:9200/accounts/person/_search -d '
{
  "query" : { "match" : { "user" : "李" }}
}'
```

返回结果

```
{
  "took": 6, # 查询耗时
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 7,
      "relation": "eq"
    },
    "max_score": 0.21305239,
    "hits": [
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "DOReUnMB62FoPIXfGPFf",
        "_score": 0.21305239,
        "_source": {
          "user": "李四",
          "title": "工程师",
          "desc": "系统管理"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "DeReUnMB62FoPIXfPfH_",
        "_score": 0.21305239,
        "_source": {
          "user": "李四",
          "title": "工程师",
          "desc": "系统管理"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "DuReUnMB62FoPIXfRPHW",
        "_score": 0.21305239,
        "_source": {
          "user": "李四",
          "title": "工程师",
          "desc": "系统管理"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "D-ReUnMB62FoPIXfSPFF",
        "_score": 0.21305239,
        "_source": {
          "user": "李四",
          "title": "工程师",
          "desc": "系统管理"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "EOReUnMB62FoPIXfUvE6",
        "_score": 0.21305239,
        "_source": {
          "user": "李四",
          "title": "工程师",
          "desc": "系统管理"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "3",
        "_score": 0.18055287,
        "_source": {
          "user": "李四2020",
          "title": "工程师",
          "desc": "系统管理222"
        }
      },
      {
        "_index": "accounts",
        "_type": "person",
        "_id": "4",
        "_score": 0.18055287,
        "_source": {
          "user": "李四2020",
          "title": "工程师",
          "desc": "系统管理222"
        }
      }
    ]
  }
}
```





# 参考

1.[全文搜索引擎 Elasticsearch 入门教程](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)