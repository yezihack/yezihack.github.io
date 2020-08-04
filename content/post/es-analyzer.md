---
title: "elasticsearch 分词器"
date: 2020-07-23T20:07:29+08:00
lastmod: 2020-07-23T20:07:29+08:00
draft: false
tags: ["elasticsearch"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""


---

## 介绍

1. Character Filter 

在 Tokenizer 之前对文本进行处理, 例如增加删除及替换字符, 可以配置多个 Character Filters, 会影响 Tokenizer 的 position 和 offset 信息

自带: html_strip, mapping, pattern replace

1. Tokenizer

将原始的文本按照一定的规则, 切分为词 (term or token)

自带: whitespace, standard/ pattern/ keyword/ path hierarchy

1. Token Filter

将 Tokenizer 输出的单词 (term), 进行增加, 修改, 删除.

如自带的 lowercase, stop, synonym(添加近义词)

## 定义分词器

### 过滤html标签

```
# 自定义分词器
POST _analyze
{
  "tokenizer": "keyword",
  "char_filter": ["html_strip"],
  "text":"<b>hello world</b>"
}

```

过滤之后的结果

````
{
  "tokens" : [
    {
      "token" : "hello world",
      "start_offset" : 3,
      "end_offset" : 18,
      "type" : "word",
      "position" : 0
    }
  ]
}
````

### 替换

将一个字符替换成其它字符

```
POST _analyze
{
  "tokenizer": "standard",
  "char_filter": [
      {
        "type":"mapping",
        "mappings":["- => _"]
      }
   ],
   "text": "a-b word-ok"
}
```

替换结果

```
{
  "tokens" : [
    {
      "token" : "a_b",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "word_ok",
      "start_offset" : 4,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 1
    }
  ]
}

```

###  正则匹配

自定义正则匹配

````

GET _analyze
{
  "tokenizer": "standard",
  "char_filter": [
      {
        "type":"pattern_replace",
        "pattern":"http://(.*)",
        "replacement":"$1"
      }
    ],
    "text": "http://www.google.com"
}

````

正则后的结果

````
{
  "tokens" : [
    {
      "token" : "www.google.com",
      "start_offset" : 0,
      "end_offset" : 21,
      "type" : "<ALPHANUM>",
      "position" : 0
    }
  ]
}

````

### 路径切分

```
# 路径切分
POST _analyze 
{
  "tokenizer": "path_hierarchy",
  "text": "/usr/local/elasticsearch"
}
```
结果显示, 一级一级的显示
````
{
  "tokens" : [
    {
      "token" : "/usr",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/usr/local",
      "start_offset" : 0,
      "end_offset" : 10,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/usr/local/elasticsearch",
      "start_offset" : 0,
      "end_offset" : 24,
      "type" : "word",
      "position" : 0
    }
  ]
}

````

### 空格切分

以空格分切, 去掉一些介词

```
GET _analyze
{
  "tokenizer": "whitespace",
  "filter": ["stop"],
  "text": ["This is a apple"]
}

```

切分结果

```
{
  "tokens" : [
    {
      "token" : "This",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "apple",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "word",
      "position" : 3
    }
  ]
}

```

还可以加入一个转小写的分词器 `lowercase`

```

GET _analyze
{
  "tokenizer": "whitespace",
  "filter": ["stop", "lowercase"],
  "text": ["The is A apple"]
}

```

## 自定义分记号器

```
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

测试一下自定义的分词器

```
POST my_index/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": [":) person man, HELLO"]
}

```

结果

```
{
  "tokens" : [
    {
      "token" : "_happy_",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "person",
      "start_offset" : 3,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "man",
      "start_offset" : 10,
      "end_offset" : 13,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "hello",
      "start_offset" : 15,
      "end_offset" : 20,
      "type" : "word",
      "position" : 3
    }
  ]
}

```



