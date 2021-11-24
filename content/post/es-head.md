---
title: "Elasticsearch 入门(三) Head 助手安装"
date: 2020-07-16T19:38:51+08:00
lastmod: 2020-07-16T19:38:51+08:00
draft: false
tags: ["elasticsearch", "elk", "elasticsearch-head"]
categories: ["elasticsearch"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 下载 elasticsearch-head

```
cd /usr/local
git clone https://github.com/mobz/elasticsearch-head 
```

## 安装 npm

> 国内的 npm 很慢, 推荐使用 taobao 的镜像

使用 npm 别名方式

```base
# 默认 bash
vim ~/.bashrc
# 如果你使用的是 zsh 的话
vim ~/.zshrc

# 最后一行添加
alias cnpm="npm --registry=https://registry.npm.taobao.org \
--cache=$HOME/.npm/.cache/cnpm \
--disturl=https://npm.taobao.org/dist \
--userconfig=$HOME/.cnpmrc"

# 验证一下
cnpm -v
```

## 修改 Gruntfile.js

> 修改 elasticsearch-head 对外提供服务的配置

```bash
cd /usr/local/elasticsearch-head
vim Gruntfile.js 
# 大约96行, connect.server.options 节点
```

![](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200716200648.png?imageslim)

## 修改连接 es 服务的配置

````
cd /usr/local/elasticsearch-head
vim _site/app.js
# 大约 4374 行
````

![](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200716201136.png?imageslim)

## 修改 elasticsearch.yml 文件

使用 head 助手需要 es 允许跨域访问

```
vim /usr/local/es/config/elasticsearch.yml
# 允许跨域访问, 添加以下二行
http.cors.enabled: true
http.cors.allow-origin: "*"
```

## 安装 head

```
cd /usr/local/elasticsearch-head
cnpm install
```

## 启动

```
cnpm run start
```

## 推荐阅读

1. [Elasticsearch 入门(一) 介绍](https://www.sgfoot.com/es-info.html)
2. [Elasticsearch 入门(二) 安装](https://www.sgfoot.com/es-install.html)
3. [Elasticsearch 入门(三) Head 助手安装](https://www.sgfoot.com/es-head.html)
4. [Elasticsearch 入门(四) 查询](https://www.sgfoot.com/es-search.html)
