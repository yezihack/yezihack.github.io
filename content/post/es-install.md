---
title: "elaticsearch 入门"
date: 2020-06-11T14:36:27+08:00
lastmod: 2020-06-11T14:36:27+08:00
draft: false
tags: ["elaticsearch", "es", "全文检索引擎"]
categories: ["elaticsearch"]
author: "百里"
comment: true
toc: true
reward: true
---


# 概述

Elaticsearch,简称es, es是一个开源的高扩展的分布式全文检索引擎. 它可以近乎实时的存储,检索数据. 可以水平扩展.处理PB级别的数据.es使用java开发并使用Lucene作为核心来实现所有的索引和搜索的功能.



# Solr 与 Es 区别

![image-20200416203047179](http://img.sgfoot.com/b/20200416203050.png?imageslim)

![image-20200416203106220](http://img.sgfoot.com/b/20200416203109.png?imageslim)

![image-20200416203139093](http://img.sgfoot.com/b/20200416203140.png?imageslim)

![image-20200416203124040](http://img.sgfoot.com/b/20200416203125.png?imageslim)

![image-20200416203153924](http://img.sgfoot.com/b/20200416203155.png?imageslim)

# ElasticSearch
## 1. 安装jdk1.8
[JDK1.8下载与安装](https://www.jianshu.com/p/efef80171a4a)

## 2. 下载es
1. v7.6.2
https://www.elastic.co/cn/downloads/elasticsearch

## 3. win环境安装

> 目录概述
1. bin 执行文件目录 
	1. elasticsearch.bat 双击安装
1. config 配置目录 
   1.  elasticsearch.yml es配置文件
   1. jvm.options jdk配置文件
      1.  -Xms1g 表示使用1G内存
   1.  log4j2.properties 日志配置文件
1.  data 数据目录
1.  lib jar包目录
1.  logs日志目录
1.  modules 模块目录
1.  plugins 插件目录 

> 启动ElaticSearch 

双击bin/elasticsearch.bat 文件, 差不多需要1~2分钟, 注意屏幕不动, 敲个回车.

> 测试一下

1. http://localhost:9200/

   ![image-20200416212146541](http://img.sgfoot.com/b/20200416212147.png?imageslim)