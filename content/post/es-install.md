---
title: "Elasticsearch 入门(二)安装"
date: 2020-06-11T14:36:27+08:00
lastmod: 2020-06-11T14:36:27+08:00
draft: false
tags: ["elasticsearch", "elk"]
categories: ["elasticsearch"]
author: "百里"
comment: true
toc: true
reward: true
---

[TOC]

> 基于es 7.x版本

## 安装

### 1. 安装jdk1.8

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

### 2. 下载es
1. v7.6.2
https://www.elastic.co/cn/downloads/elasticsearch

### 3. linux/win环境安装

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

## 修改配置

> 对于 elasticsearch 配置并没有某个万能的配置项, 让性能提升100倍.

### 修改集群名称

```
cluster.name: es-school
```

### 修改节点名称

设置一个有意义的节点名称

```
node.name: student-node
```

### 修改索引存储路径

用于存储 ES 所有的索引数据路径,**非常重要**, 最好不要默认设置

```
path.data: /data/es/data
```

### 修改日志路径 

```
path.logs: /data/es/logs
```

### 修改绑定地址

```
network.host: 10.0.0.10
```

最好指定域局网的IP, 也可以使用`0.0.0.0` 表示任意都可以访问.也可以设置`localhost`只允许本机访问.

###  修改端口

```
http.port: 9200
```

### 修改集群配置

> 以下配置只限于7.x后版本使用.
>
> 参考: [官方配置](https://www.elastic.co/guide/en/elasticsearch/reference/7.0/discovery-settings.html)

```
# 设置集群的地址, ip:port 格式
discovery.seed_hosts: ["host1", "host2"]
# 设置主节点 ip:port格式
cluster.initial_master_nodes: ["node-1"]
```



### 修改内存

设置环境变量,修改堆内存

```
export ES_HEAP_SIZE=10g
```

启动时设置堆内存最小值(Xms)与最大值(Xmx)

```
./bin/elasticsearch -Xmx10g -Xms10g 
```

注: 设置物理内存的一半, 最大不要超过32g

### Swapping 是性能的坟墓

内存交换 到磁盘对服务器性能来说是 *致命* 的,如果内存交换到磁盘上，一个 100 微秒的操作可能变成 10 毫秒

最好的办法就是在你的操作系统中完全禁用 swap。这样可以暂时禁用：

```
sudo swapoff -a
```

永久修改 `/etc/fstab`, 带有swap的那一条进行注释掉.

```
# /dev/mapper/centos-swap swap                    swap    defaults        0 0
```

更好的操作是, 锁定内存.

 `vim elasticsearch.yml`

```
bootstrap.memory_lock: true
```



## 推荐阅读

1. [Elaticsearch 学习(一) 介绍](https://www.sgfoot.com/es-info.html)
2. [Elasticsearch 入门(二)安装](https://www.sgfoot.com/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://www.sgfoot.com/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://www.sgfoot.com/es-search.html)

## 参考

1. [全文搜索引擎 Elasticsearch 入门教程](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)
2. [堆内存:大小和交换](https://www.elastic.co/guide/cn/elasticsearch/guide/current/heap-sizing.html)