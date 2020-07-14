---
title: "Elasticsearch 入门(一)安装"
date: 2020-06-11T14:36:27+08:00
lastmod: 2020-06-11T14:36:27+08:00
draft: false
tags: ["elasticsearch", "es"]
categories: ["Elasticsearch 入门教程"]
author: "百里"
comment: true
toc: true
reward: true
---

[TOC]

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

> 浏览不同的es版本对java版本的要求: https://www.elastic.co/cn/support/matrix#matrix_jvm

[JDK1.8下载与安装](https://www.jianshu.com/p/efef80171a4a)

centos 

```
yum -y install java-1.8.0-openjdk-devel.x86_64
```

ubuntu

```
apt-get -y install java-1.8.0-openjdk-devel.x86_64
```

安装完后查看java版本

```
java -version
```

## 2. 下载es
1. v7.6.2
https://www.elastic.co/cn/downloads/elasticsearch

## 3. linux/win环境安装

> 目录概述
1. bin 执行文件目录 
	1. bin/elasticsearch.bat 双击安装(window)
	2. bin/elasticsearch (linux) 
	   1. 加个 `-d`  参数的话表示后台静默运行
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

window: 双击bin/elasticsearch.bat 文件, 差不多需要1~2分钟, 注意屏幕不动, 敲个回车.

linux : bin/elasticsearch  or bin/elasticsearch -d (后台运行)

> 测试一下

1. `curl 'http://localhost:9200/?pretty'`
2. http://localhost:9200/

   ![](http://img.sgfoot.com/b/20200416212147.png?imageslim)

默认情况下，Elastic 只允许本机访问，如果需要远程访问，可以修改 Elastic 安装目录的`config/elasticsearch.yml`文件，去掉`network.host`的注释，将它的值改成`0.0.0.0`，然后重新启动 Elastic。

```
network.host: 0.0.0.0
```

上面代码中，设成`0.0.0.0`让任何人都可以访问。线上服务不要这样设置，要设成具体的 IP。

## 安装遇到的坑

1. 不能使用root权限运行 (linux)

   ![](http://img.sgfoot.com/b/20200714155701.png?imageslim)

解决办法就是新建一个 es帐号与组运行

```
# 创建组
groupadd es
# 创建用户名
useradd es
# 对 elaticsearch 目录添加到es组里
chown -R es:es /usr/local/es
```



## 参考

1. [全文搜索引擎 Elasticsearch 入门教程](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)