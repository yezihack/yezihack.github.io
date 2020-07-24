---
title: "Elasticsearch 入门(六) cerebro 集群管理工具"
date: 2020-07-22T15:32:52+08:00
lastmod: 2020-07-22T15:32:52+08:00
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

之前介绍过`head`, `hd` 软件, 两种都不如今天的主角(cerebro), 也推荐使用. 言归正传. 开始吧.

## 介绍

源码: https://github.com/lmenezes/cerebro

下载二进制包: https://github.com/lmenezes/cerebro/releases

![](http://img.sgfoot.com/b/20200722163421.png?imageslim)

1. 集群名称
2. 节点数
3. 索引数
4. 分片数
5. 文档数
6. 磁盘剩余量
7. 节点名称,实心的星为主节点(即master节点), 空心的星为副节点(cluster节点)
   1. master 节点才有权限修改集群的状态
8. 实线的方块代表主分片
9. 虚线的方块代表副本分片

图片最上面有一条为黄色的线. 表示服务的健康状态. 在elasticsearch里有三种颜色
1. green 绿色为健康状态
   1. 所有的主分片和副本分片都已分配。你的集群是 100% 可用的。
2. yellow 黄色为亚健康状态
   1. 所有的主分片已经分片了，但至少还有一个副本是缺失的。不会有数据丢失，所以搜索结果依然是完整的。不过，你的高可用性在某种程度上被弱化。如果 更多的 分片消失，你就会丢数据了。把 yellow 想象成一个需要及时调查的警告。
3. red 红色为非健康状态
   1. 至少一个主分片（以及它的全部副本）都在缺失中。这意味着你在缺少数据：搜索只能返回部分数据，而分配到这个分片上的写入请求会返回一个异常。

## 安装

```
# 下载二进制包
cd /usr/local
wget https://github.com/lmenezes/cerebro/releases/download/v0.9.2/cerebro-0.9.2.zip

unzip cerebro-0.9.2.zip
```

## 修改配置文件

```
vim conf/application.conf
# 大约70行. 去掉 # 可以配置多个.
hosts = [
  {
    host = "http://127.0.0.1:9200" # 设置 elasticsearch 地址
    name = "Localhost cluster" # 显示名称
  #  headers-whitelist = [ "x-proxy-user", "x-proxy-roles", "X-Forwarded-For" ]
  }
  # Example of host with authentication
  #{
  #  host = "http://some-authenticated-host:9200"
  #  name = "Secured Cluster"
  #  auth = {
  #    username = "username"
  #    password = "secret-password"
  #  }
  #}
]

```

## 启动

```
bin/cerebro
or 
nohup bin/cerebro &
```

