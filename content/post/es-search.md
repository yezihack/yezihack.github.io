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

### 分词使用

官方提供标准的分词器, 对于亚洲语言, 可以安装

```
bin/elasticsearch-plugin list # 查看安装过的插件
bin/elasticsearch-plugin install analysis-icu # 安装icu, 支持亚洲语言的插件
# 更好的支持中文, 使用 ik
https://github.com/medcl/elasticsearch-analysis-ik/releases 
选择 zip包 , 解压安装
```



```
GET _analyze
{
   "analyzer": "standard", # 使用指定的分词器. 或者 icu_analyzer
   "text":"10.A date math index name takes the following form:分词器哦"
}
```



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

#### 指定某字段查询

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

#### 进行整体查询



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
#### query_string 查询方法



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

## 高级查询

### 指定返回字段

```
GET /student/_search
{
   "_source": ["name", "age"],
   "from": 0
}
```

### 聚合查询

max, min, avg 最大, 最小, 平均值.

age_avg, age_max, age_min 是自定义的字段名称.

```
GET /student/_search
{
  "size":0,
  "aggs": {
    "age_avg": {
      "avg": { 
        "field": "age"
      }
    },
    "age_max":{
      "max": {
        "field": "age"
      }
    },
    "age_min":{
      "min": {
        "field": "age"
      }
    }
  }
}
```

### 嵌套查询聚合

aggs , terms 按bucker统计, 再在当前bucker里再求avg和stat

```
GET /student/_search
{
  "size":0,
  "aggs": {
    "age_aggs": {
      "terms": {
        "field": "age",
        "size": 10
      },
      "aggs": {
        "age_avg": {
          "avg": {
            "field": "age"
          }
        },
        "stats_age":{
          "stats": {
            "field": "age"
          }
        }
      }
    }
  }
}
```

### term 查询

term 查询对输入不做分词, 会将输入作为一个整体.  

插入新数据

```
POST /products/_bulk
{"index":{"_id":1}}
{"productID":"a2020-kk-#001", "desc":"iPhone"}
{"index":{"_id":2}}
{"productID":"a2020-kk-#002", "desc":"iPad"}
{"index":{"_id":3}}
{"productID":"a2020-kk-#003", "desc":"MP3"}
```

```
# 直接搜索无法找到, 因为es在做 index 时会做一个分词处理. 
POST /products/_search
{
  "profile": "true", 
  "query": {
    "term": {
      "desc": {
        "value": "iPhone"
      }
    }
  }
}
```

````
# 使用小写进行查询, 能查询到.
POST /products/_search
{
  "profile": "true", 
  "query": {
    "term": {
      "desc": {
        "value": "iphone"
      }
    }
  }
}
````

```
# 或者 使用 keyword
POST /products/_search
{
  "profile": "true", 
  "query": {
    "term": {
      "desc.keyword": {
        "value": "iPhone"
      }
    }
  }
}
```

```
# 以下查询并不会查询到任何结果, 因为index时对 prodoctID 进行了分词操作.
POST /products/_search
{
  "query": {
    "term": {
      "productID": {
        "value": "a2020-kk-#003"
      }
    }
  }
}
# 上面查询不到,等价于以下标准分词

GET _analyze
{
  "analyzer": "standard",
  "text": ["a2020-kk-#003"]
}
```

```
# 以上可以使用 keyword 解决

POST /products/_search
{
  "query": {
    "term": {
      "productID.keyword": {
        "value": "a2020-kk-#003"
      }
    }
  }
}
```

### 复合查询

复合查询, Constant Score 转为 Filter

避免相关性的算分开销, 利用 Filter 缓存提高查询效率 

```
POST /products/_search
{
  "explain": true,
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "productID.keyword": "a2020-kk-#003"
        }
      },
      "boost": 1
    }
  }
}
```

```
# 全文本查询

# 以下查询是一种全文查询, 会采用 or 
# 将"kk 003" 切分成"kk" or "003" 
# 也就是说只要包括 kk 或 003的都返回.
POST /products/_search
{
  "profile": "true"
  , "query": {
    "match": {
      "productID": "kk 003"
    }
  }
}

```

````

# 以下是添加额外条件查询. 采用 and. 必须全都出现.
POST /products/_search
{
  "profile": "true"
  , "query": {
    "match": {
      "productID": {
        "query": "kk 003"
        , "operator": "and"
      }
    }
  }
}
````

minimum_should_match 的使用

意思是最小匹配一个

```
# 设定最小匹配数量
POST /products/_search
{
  "profile": "true", 
  "query": {
    "match": {
      "productID": {
        "query": "a2020 003",
        "minimum_should_match": 1
      }
    }
  }
}
```

### 范围查询

#### 数字 range 查询 

```
# 数字 range 查询
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "range": {
          "price": {
            "gte": 20,
            "lte": 30
          }
        }
      }
      ,"boost": 1.2
    }
  }
}
```

#### 日期 range

```
# 日期 range
# now-ly 当前时间减去1年, 相当于去年的数据. gte 就是大于2019年的数据, 全返回
# y 年, M 月, w 周, d 天, H/h 小时, m 分钟, s秒
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "range": {
          "date": {
            "gte": "now-1y"
          }
        }
      },
      "boost": 1.2
    }
  }
}
```

### 字段存在否

```
# exists 查找只包含这个字段的数据.
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "exists": {
          "field": "date"
        }
      },
      "boost": 1.2
    }
  }
}
```

## BOOL 查询

1. must 算分
2. must_not 算分
3. filter 不算分
4. shoud 算分

新增一下数据

```
POST /news/_bulk
{"index":{"_id":1}}
{"content":"Apple Mac"}
{"index":{"_id":2}}
{"content":"Apple Ipad"}
{"index":{"_id":3}}
{"content":"Apple employee like Apple Pie and Apple Juice"}

```

#### 单个must

```
# 普通搜索, 只要含有apple的文本就返回
POST news/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "content": "apple"
          }
        }
      ]
    }
  }
}
```

#### must, must_not组合

```
# 要求只返回与苹果公司相关产品的信息, 过滤吃苹果汁的信息
POST news/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "content": "apple"
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "content": "pie"
          }
        }
      ]
    }
  }
}
```

#### 对顺序调整, 分值

```

# 我们要求把苹果公司的信息显示最上面, 吃苹果的信息也显示, 显示在最下面.
# 就可以使用算分来控制
# positive 正面的, 加分
# negative 负面的, 减分
POST news/_search
{
  "query": {
    "boosting": {
      "positive": {
        "match": {
          "content": "apple"
        }
      },
      "negative": {
        "match": {
          "content": "pie"
        }
      },
      "negative_boost": 0.2
    }
  }
}
```



```
# must 算分, must_not 算分, filter不算分,shoud算分

POST move/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "genere.keyword": {
              "value": "jack"
            }
          }
        },
        {
          "term": {
            "genere_count": {
              "value": 2
            }
          }
        }
      ]
    }
  }
}
```





##  自定义分词器

```
# 自定义分词器
DELETE my_index
PUT my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer":{
          "type":"custom",
          "char_filter":["emoticons"],
          "tokenizer":"punctuation",
          "filter":["lowercase", "english_stop"]
        }
      },
      "tokenizer": {
        "punctuation":{
          "type":"pattern",
          "pattern":"[ .,!?]"
        }
      },
      "char_filter": {
        "emoticons":{
          "type":"mapping",
          "mappings":[
            ":) => _happy_"
            ]
        }
      },
      "filter": {
        "english_stop":{
          "type":"stop",
          "stopwords":"_english_"
        }
      }
    }
  }
}
```

使用自定义分词器

```
POST my_index/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": [":) person man, HELLO"]
}

```





## 设置 mappings & settings

```
PUT index
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "ik": {
          "tokenizer": "ik_max_word"
        }
      }
    }
  },
  "mappings": {
    "test1":{
      "properties": {
        "content": {
          "type": "text",
          "analyzer": "ik",
          "search_analyzer": "ik_max_word"
        }
      }
    }
  }
}
————————————————
版权声明：本文为CSDN博主「gxx_csdn」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/gxx_csdn/article/details/79110384
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