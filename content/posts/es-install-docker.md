---
title: "Elasticsearch 入门(七) Docker 安装 Es, Kibana,Head和IK分词器(es7.14.1)"
date: 2020-09-15T12:00:27+08:00
lastmod: 2020-09-15T12:00:27+08:00
draft: false
tags: ["elasticsearch", "elk", "docker"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
---

> docker 的优点，就是简化所有的安装流程。移植性好，安装快捷。

在安装之前，Elasticsearch 与 Kibana 需要注意版本一致。
> 当前IK分词器也需要一致。见 github release

1. [dockerhub es](https://hub.docker.com/_/elasticsearch?tab=tags&page=1&ordering=last_updated)
2. [dockerhub kibana](https://hub.docker.com/_/kibana?tab=tags&page=1&ordering=last_updated)
3. [github ik analysis](https://github.com/medcl/elasticsearch-analysis-ik/releases)


## Docker 创建网络栈
> 后面创建 elaticsearch, kibana 需要用到。
```sh
docker network create es-network
```

## Elasticsearch 安装
```sh
docker pull elasticsearch:7.14.1
docker run -d --name elasticsearch --net es-network -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.14.1
```
1. `--net es-network` 使用刚创建的网络栈
2. `-e "discovery.type=single-node"` 设置配置参数为单结点集群
3. `--name elasticsearch` 设置容器名称
4. `-p 9200:9200` 设置端口映射，前为宿主机端口，后为容器里的端口。
5. `-d` 后台运行模式
6. `elasticsearch:7.14.1` 镜像名称，通过`docker images` 查看，若没有会自动下载

查看日志，发现一处警告：
`docker logs elasticsearch`

```json
{
    "type":"deprecation.elasticsearch",
    "timestamp":"2021-09-15T03:55:39,835Z",
    "level":"DEPRECATION",
    "component":"o.e.d.x.s.s.SecurityStatusChangeListener",
    "cluster.name":"docker-cluster",
    "node.name":"5875ad143345",
    "message":"The default behavior of disabling security on basic licenses is deprecated. In a later version of Elasticsearch, the value of [xpack.security.enabled] will default to \"true\" , regardless of the license level. See https://www.elastic.co/guide/en/elasticsearch/reference/7.14/security-minimal-setup.html to enable security, or explicitly disable security by setting [xpack.security.enabled] to false in elasticsearch.yml",
    "cluster.uuid":"N-aNFfTdQV6cV0YgVF9qGQ",
    "node.id":"rS9sim8lQfKpxYgUpMATtQ"
}
```

参考官方设置：https://www.elastic.co/guide/en/elasticsearch/reference/7.14/security-minimal-setup.html

## IK 分词器安装

github 官方下载，选择与 elasticsearch 版本一致的，否则可能会出现异常。

https://github.com/medcl/elasticsearch-analysis-ik/releases

通过 `docker ps` 找到 elasticsearch 容器ID，假设ID为：`229a953c26c2`

1. 下载 [elasticsearch-analysis-ik-7.14.1.zip](https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.14.1/elasticsearch-analysis-ik-7.14.1.zip) 
2. `elasticsearch-analysis-ik-7.14.1.zip` 然后解压，更名为 ik 文件名。
3. 将 ik 文件夹复制到容器里。`docker cp ik 229a953c26c2:/usr/share/elasticsearch/plugins`
4. 重启 elasticsearch 容器, `docker restart 229a953c26c2`
5. 查看日志，`docker logs 229a953c26c2`。 找到 `"message": "loaded plugin [analysis-ik]"` 字样，表示加载成功。

### 测试 ik analyer 分词器。


## Kibana 安装

```sh
docker run -d --name kibana --net es-network -p 5601:5601 kibana:7.14.1
```

1. `--net es-network` 使用刚创建的网络栈
1. `--name kibana` 设置容器名称
1. `-p 5601:5601` 设置端口映射，前为宿主机端口，后为容器里的端口。
1. `-d` 后台运行模式
1. `kibana:7.14.1` 镜像名称，通过`docker images` 查看，若没有会自动下载


## Elasticsearch-head 安装
> 界面显示 es 概览，索引，数据，基本查询，复合查询等功能。

**chrome 插件方式安装**
1. 直接市场安装（如果可能的话）
	https://chrome.google.com/webstore/detail/elasticsearch-head/ffmkiejjmecolpfloofpjologoblkegm?hl=zh-CN
2. 离线方装（一定可能。哈哈）
	https://github.com/mobz/elasticsearch-head/blob/master/crx/es-head.crx 下载，可能会慢点。
	1. 将 `es-head.crx` 后缀改为rar，如 `es-head.rar`
	2. 打开 Chrome, 输入：`chrome://extensions/`，点击"加载已解压的扩展程序"。
	3. 在扩展程序里直接打开即可。


## 推荐阅读

1. [Elasticsearch 入门(一) 介绍](https://yezihack.github.io/es-info.html)
2. [Elasticsearch 入门(二) 安装](https://yezihack.github.io/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://yezihack.github.io/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://yezihack.github.io/es-search.html)
