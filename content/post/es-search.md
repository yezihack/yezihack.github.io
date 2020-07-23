---

title: "Elasticsearch 入门(四) 查询"
date: 2020-07-15T19:52:52+08:00
lastmod: 2020-07-15T19:52:52+08:00
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

## 概要

Elasticsearch对外提供的API遵循REST原则

1. GET
2. POST
3. PUT
4. DELETE
## 简介
1. `_index` 索引, 文档在哪儿存放
2. `_type` 类型, 7.x以后都使用 `_doc`类型
3. `_id` 文档唯一标识, 不指定则自动生成.

一个文档的 `_index` 、` _type` 和 `_id` 唯一标识一个文档

## 基本RESTful操作

### 新增记录 create

二种操作. `PUT`, `POST`

PUT方法, `/{_index}/_create/{id}` 如果文档存在,操作失败

还可以使用 `/{_index}/_doc/{id}?op_type=create`

```
# 创建一个文档, 如果文档存在,操作失败
# 使用_create
PUT /student/_create/1
{
  "name": "张三",
  "age":19,
  "sex":1
}
# 使用 _doc指定操作类型
PUT /student/_doc/3?op_type=create
{
  "name": "张三丰",
  "age":600,
  "sex":1
}

# 自动生成ID
PUT /student/_doc/
{
  "name": "张三元",
  "age":600,
  "sex":1
}
```

POST方法 `{index}/_doc/{id}` 如果文档不存在则创建新文档, 文档存在则旧文档删除, 新的文档被索引, 版本信息+1

```

POST /student/_doc/2
{
  "name": "阳明",
  "age":290,
  "sex":1
}
```

返回JSON

```
{
  "_index" : "student", # 索引名称
  "_type" : "_doc", # 类型, 默认为 _doc
  "_id" : "2", # 标识ID
  "_version" : 5, # 更新版本次数. 5代表此文档更新过5次.
  "result" : "updated", # 此操作类型为更新操作完成
  "_shards" : { #
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 5,
  "_primary_term" : 1
}

```

### 获取文档 get

GET `{_index}/{_type}/{id}`

```
GET /student/_doc/2

{
  "_index" : "student", # 索引名称
  "_type" : "_doc", # 类型名称
  "_id" : "2", # 标识ID
  "_version" : 5, # 版本次数
  "_seq_no" : 5,
  "_primary_term" : 1,
  "found" : true, # true 代表找到信息
  "_source" : { # 文档的原则信息
    "name" : "阳明",
    "age" : 290,
    "sex" : 1
  }
}

```

### 更新文档 update

> 每次更新,注意查看 _version 版本号的变化 

Update 方法, 与上面的`/{_index}/_doc/{id}` 更新不一样, 它是删除后再创建. 而update是真实的更新字段

```


POST /student/_update/2
{
  "doc":{
    "age":300,
    "sex":1
  }
}
```

查看下

````
GET /student/_doc/2
{
  "_index" : "student",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 2,
  "_seq_no" : 12,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "name" : "阳明",
    "sex" : 1, # 新增的两个字段
    "age" : 300
  }
}

````

### 删除文档 delete

```
# 删除文档
DELETE /student/_doc/2
```



## bulk 批量操作

> 支持创建, 更新,删除操作

1. index 表示创建或更新文档, 后跟要{}要创建的文档信息
2. delete 删除文档
3. create 创建文档, 后跟{}要创建的文档信息
4. update 更新文档, 后跟{}要更新的文档信息

```
POST /_bulk?pretty
{ "index" : { "_index" : "test", "_id" : "1" } } 
{ "field1" : "value1" }
{ "delete" : { "_index" : "test", "_id" : "2" } }
{ "create" : { "_index" : "test", "_id" : "3" } }
{ "field1" : "value3" }
{ "update" : {"_id" : "1", "_index" : "test"} }
{ "doc" : {"field2" : "value2"} }
```

每一个操作都会返回对应的结果

```
{
  "took" : 7,
  "errors" : false,
  "items" : [
    {
      "index" : {
        "_index" : "test",
        "_type" : "_doc",
        "_id" : "1",
        "_version" : 6,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 10,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "delete" : {
        "_index" : "test",
        "_type" : "_doc",
        "_id" : "2",
        "_version" : 3,
        "result" : "not_found",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 11,
        "_primary_term" : 1,
        "status" : 404
      }
    },
    {
      "create" : {
        "_index" : "test",
        "_type" : "_doc",
        "_id" : "3",
        "_version" : 3,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 12,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "update" : {
        "_index" : "test",
        "_type" : "_doc",
        "_id" : "1",
        "_version" : 7,
        "result" : "updated",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 13,
        "_primary_term" : 1,
        "status" : 200
      }
    }
  ]
}
```

## mget 批量获取

```
# 批量获取 mget
GET /_mget 
{
  "docs":[
    {
      "_index":"test",
      "_id":"1"
    },
    {
      "_index":"test",
      "_id":"3"
    }
  ]
}
简单写法
GET /student/_mget
{
  "ids":[1,2,3]
}
```

对应的返回每一条结果

```
{
  "docs" : [
    {
      "_index" : "test",
      "_type" : "_doc",
      "_id" : "1",
      "_version" : 7,
      "_seq_no" : 13,
      "_primary_term" : 1,
      "found" : true,
      "_source" : {
        "field1" : "value1",
        "field2" : "value2"
      }
    },
    {
      "_index" : "test",
      "_type" : "_doc",
      "_id" : "3",
      "_version" : 3,
      "_seq_no" : 12,
      "_primary_term" : 1,
      "found" : true,
      "_source" : {
        "field1" : "value3"
      }
    }
  ]
}

```

## msearch 批量搜索

```
POST /student/_msearch
{}
{"query":{"match_all":{}}, "size":1}

```

## 查询

### URI 方式查询

> profile:"true"查看查询详情过程

1. df=name 指定某个字段
2. sort=name 指定字段排序
   1. sort=name:desc
3. from=0 从什么位置开始
4. size=10 返回多少条
5. timeout=1s 设置查询超时

```
# 对所有的字段进行查询
GET /student/_search?q=诗
# 指定某个字段进行查询
GET /student/_search?q=诗&df=name

# profile:"true"查看查询详情过程 
GET /student/_search?q=诗
{
	"profile":"true"
}

# 可以使用q=字段:值 简单的写法
GET /student/_search?q=name:诗
{
  "profile": "true"
}
```

搜索字段加引号与不加引号的区别

1. name:诗人．　会出现以下三种情况搜索, 相当于: "诗" or "人"
   1. name:诗 name:人
   2. name:诗
   3. name:人
   4. 搜索类型: BooleanQuery, TermQuery
2. name:诗 人  #中间有个空格
   1. 不再是指定字段查询啦, 而是泛查询, 对所有字段查询
   2. 搜索类型: BooleanQuery, TermQuery, DisjunctionMaxQuery
3. name:"诗人"
   1. 只有一种情况: name:"诗人", 一个整体查询, 前后保持一致
   2. 搜索类型: PhraseQuery

```
GET /student/_search?q=name:诗人
{
  "profile": "true"
}

GET /student/_search?q=name:诗 人
{
  "profile": "true"
}

GET /student/_search?q=name:"诗人"
{
  "profile": "true"
}
```

#### 布尔操作

​	AND/OR/NOT   &&/ || / !
```
# 采用 BooleanQuery 操作. 
# "description" : "name:诗 name:and name:人",
GET /student/_search?q=name:(诗 and 人)
{
  "profile": "true"
}
```
#### 分组

   	1. `+` 表示 must
        	2. `-` 表示 must_not

### Request Body 查询

```
GET /student/_search
{
  "_source": ["name"], # 指定返回的字段.
  "from":0, # 开始的位置
  "size": 2, # 返回的尺寸大小
  "query": { # 查询
    "match_all": {} # 查询所有
  }
}

```

脚本字段

```

```


指定某字段查询
```
# 不加操作类型, 默认为 or 
GET /student/_search
{
  "query": {
    "match": {
      "name": "李白 诗人"
    }
  }
}
# 指定操作类型, operator:and
GET /student/_search
{
  "query": {
    "match": {
      "name": {
        "query": "诗人"
        , "operator": "and"
      }
    }
  }
}
```

进行整体查询
```

# 整体查询, 前后一致
GET /student/_search
{
  "query": {
    "match_phrase": {
      "name": {
        "query": "诗人"
      }
    }
  }
}
# 如果加上slop 中间可以插入别的字也匹配
GET /student/_search
{
  "query": {
    "match_phrase": {
      "name": {
        "query": "诗人",
        "slop": 1
      }
    }
  }
}
```
query_string 查询方法
```
# 使用 query_string 查询

POST /student/_search
{
  "query": {
    "query_string": {
      "default_field": "name",
      "query": "诗 AND 人"
    }
  }
}

POST /student/_search
{
  "query": {
    "query_string": {
      "default_field": "name",
      "query": "诗 OR 人"
    }
  }
}
# 过滤一些错误的语法
POST /student/_search
{
  "query": {
    "simple_query_string": {
      "query": "诗 AND 人 OR 190",
      "fields": ["name"]
    }
  }
}
```




## 常见错误 

![](http://img.sgfoot.com/b/20200723154626.png?imageslim)

## 推荐阅读

1. [Elasticsearch 入门(一) 介绍](https://www.sgfoot.com/es-info.html)
2. [Elasticsearch 入门(二) 安装](https://www.sgfoot.com/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://www.sgfoot.com/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://www.sgfoot.com/es-search.html)

## 参考

1.[全文搜索引擎 Elasticsearch 入门教程](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)