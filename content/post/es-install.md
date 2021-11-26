---
title: "Elasticsearch 入门(二) 安装"
date: 2020-06-11T14:36:27+08:00
lastmod: 2020-06-11T14:36:27+08:00
draft: false
tags: ["elasticsearch", "elk"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
---

[TOC]

> 基于es 7.x版本

## 安装

### 1. 安装jdk1.8

> 浏览不同的es版本对java版本的要求: https://www.elastic.co/cn/support/matrix#matrix_jvm
>
> elasticsearch 7以后自带 java jdk, 无需以下安装操作.

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

**后台启动**

```
./bin/elasticsearch -d -p /var/elasticsearch/es.pid
```



> 启动ElaticSearch 

window: 双击bin/elasticsearch.bat 文件, 差不多需要1~2分钟, 注意屏幕不动, 敲个回车.

linux : bin/elasticsearch  or bin/elasticsearch -d (后台运行)

> 测试一下

1. `curl 'http://localhost:9200/?pretty'`
2. http://localhost:9200/

   ![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200416212147.png?imageslim)

默认情况下，Elastic 只允许本机访问，如果需要远程访问，可以修改 Elastic 安装目录的`config/elasticsearch.yml`文件，去掉`network.host`的注释，将它的值改成`0.0.0.0`，然后重新启动 Elastic。

```
network.host: 0.0.0.0
```

上面代码中，设成`0.0.0.0`让任何人都可以访问。线上服务不要这样设置，要设成具体的 IP。



## 修改配置

> 对于 elasticsearch 配置并没有某个万能的配置项, 让性能提升100倍.

```
vim config/elasticsearch.yml 
```

### 修改集群名称

> 如果配置多台联合一个集群, cluster.name 需要都相同.

```
cluster.name: es-school
```

### 修改节点名称

> 每个节点都是集群的一部分, 每个节点名称都不能相同, 可以使用编号命名.

1. 设置一个有意义的节点名称

```
node.name: student-node-1
```

### 是否为主节点

> 如果是主节点,则参入集群选举.非主节点可以当数据节点或负载节点.

```
node.master: true
```

### 是否是数据节点

> 如果设置了主节点也可以设置成数据节点, 如果都不是,则成为负载节点.

```
node.data: true
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
# 设置集群的地址, ip 格式
discovery.seed_hosts: ["10.0.0.1", "10.0.0.2:9201"]
# 以下格式都可以
   - 192.168.1.10:9300
   - 192.168.1.11 
   - seeds.mydomain.com 
   - [0:0:0:0:0:ffff:c0a8:10c]:9301 
# 配置那些节点可以有资格被选为主节点。 
cluster.initial_master_nodes: ["node-1"]
```

### 设置收集监控数据

```
xpack.monitoring.collection.enabled: true
```



### 修改内存

设置环境变量,修改堆内存

```
export ES_HEAP_SIZE=10g
```

启动时设置堆内存最小值(Xms)与最大值(Xmx)

```
ES_JAVA_OPTS="-Xms2g -Xmx2g" ./bin/elasticsearch 
ES_JAVA_OPTS="-Xms4000m -Xmx4000m" ./bin/elasticsearch 
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

## 安装遇到的坑

1. 不能使用root权限运行 (linux)

   ![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200714155701.png?imageslim)

解决办法就是新建一个 es帐号与组运行

```
# 创建组
groupadd es
# 创建用户名
useradd es
# 对 elaticsearch 目录添加到es组里
chown -R es:es /usr/local/es
```
2. max_map_count is too low

`max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]`

临时解决
```
sysctl -w vm.max_map_count=262144
```
永久解决
```
vim  /etc/sysctl.conf

vm.max_map_count = 262144

sysctl -p #生效
```


## 推荐阅读

1. [Elasticsearch 入门(一) 介绍](https://www.sgfoot.com/es-info.html)
2. [Elasticsearch 入门(二) 安装](https://www.sgfoot.com/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://www.sgfoot.com/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://www.sgfoot.com/es-search.html)

## 参考

1. [全文搜索引擎 Elasticsearch 入门教程](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)
2. [堆内存:大小和交换](https://www.elastic.co/guide/cn/elasticsearch/guide/current/heap-sizing.html)
3. [手把手教你搭建一个 Elasticsearch 集群  by 6.x](https://juejin.im/post/5bad9520f265da0afe62ed95)]
4. [Elasticsearch集群搭建（基于Elasticsearch7.5.1)](https://segmentfault.com/a/1190000021589726)