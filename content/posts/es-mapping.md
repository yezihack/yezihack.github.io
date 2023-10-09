---
title: "Elasticsearch Mapping学习"
date: 2020-07-23T19:49:49+08:00
lastmod: 2020-07-23T19:49:49+08:00
draft: false
tags: ["elasticsearch", "mapping"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## Mapping的定义

> 可以对索引的数据字段设置类型, 还可以设置不变索引.也就是说不被搜索到.

````
PUT users 
{
  "mappings": {
    "properties": {
      "firstName":{
        "type": "text"
      },
      "lastName":{
        "type": "text"
      },
      "mobile":{
        "type": "text",
        "index": false  # 设置不变索引的字段
      }
    }
  }
}
````

结果

```
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "users"
}
```

添加真实数据.

```
PUT users/_doc/1
{
  "firstName":"sg",
  "lastName":"foot",
  "mobile":"123"
}
```

对已经禁止索引的`mobile`字段查询

```
POST /users/_search
{
  "query": {
    "match": {
      "mobile": "123"
    }
  }
}
```

结果显示报错是:

```
{
  "error" : {
    "root_cause" : [
      {
        "type" : "query_shard_exception",
        "reason" : "failed to create query: Cannot search on field [mobile] since it is not indexed.",
        "index_uuid" : "YkoG3QrnS3qKMPJwgYuvug",
        "index" : "users"
      }
    ],
    "type" : "search_phase_execution_exception",
    "reason" : "all shards failed",
    "phase" : "query",
    "grouped" : true,
    "failed_shards" : [
      {
        "shard" : 0,
        "index" : "users",
        "node" : "bob_wQxnRHaCvOo8eG__fA",
        "reason" : {
          "type" : "query_shard_exception",
          "reason" : "failed to create query: Cannot search on field [mobile] since it is not indexed.",
          "index_uuid" : "YkoG3QrnS3qKMPJwgYuvug",
          "index" : "users",
          "caused_by" : {
            "type" : "illegal_argument_exception",
            "reason" : "Cannot search on field [mobile] since it is not indexed."
          }
        }
      }
    ]
  },
  "status" : 400
}

```

### 空字段设置

删除上面的数据.重新定义 

```
DELETE users
```

重新定义

```
PUT users 
{
  "mappings": {
    "properties": {
      "firstName":{
        "type": "text"
      },
      "lastName":{
        "type": "text"
      },
      "mobile":{
        "type": "keyword",
        "null_value": "NULL"
      }
    }
  }
}

```

添加真实数据

```
PUT users/_doc/1
{
  "firstName":"sg",
  "lastName":"foot",
  "mobile":"123"
}

PUT users/_doc/2
{
  "firstName":"aaa",
  "lastName":"bbb",
  "mobile":""
}

PUT users/_doc/3
{
  "firstName":"qqq",
  "lastName":"www",
  "mobile":null
}
```

进行空搜索

````
POST /users/_search
{
  "query": {
    "match": {
      "mobile": "NULL"
    }
  }
}
````

查询结果

````
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.9808291,
    "hits" : [
      {
        "_index" : "users",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.9808291,
        "_source" : {
          "firstName" : "qqq",
          "lastName" : "www",
          "mobile" : null
        }
      }
    ]
  }
}
````

