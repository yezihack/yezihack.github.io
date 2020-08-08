---
title: "Linux 命令集"
date: 2020-07-06T18:07:38+08:00
lastmod: 2020-07-06T18:07:38+08:00
draft: false
tags: ["linux", "命令"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 文件类

### 

## RPM

### 安装

`rpm -ivh rpm软件包`

###  搜索

`rpm -qa 搜索的名称`

### 卸载

`rpm -e rpm包名(搜索后的结果名称)`

## grep 

### 或的关系 

```
cat 1.txt |grep a |grep b
```

### 并集的关系 
```
cat 1.txt |grep -E "a" |grep -E "b"
```

## awk

提出内存大小
1. awk '{print $1}' 提出第1列的数据
2. sed -n '2p' 提出第二行的数据
```
free -m |awk '{print $3}' |sed -n '2p'
```



## curl

POST JSON请求

```
curl -H "Content-type:application/json" -X POST -d '{"name":"king"}' http://localhost/test
```

