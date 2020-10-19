---
title: "Shell Node_export 一键安装"
date: 2020-10-15T16:49:55+08:00
lastmod: 2020-10-15T16:49:55+08:00
draft: false
tags: ["一键安装", "shell"]
categories: ["shell"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 仅适合用 CentOS 7

## node_export 安装

> linux 服务器信息等资源收集安装包



一键安装

```shell
curl -sSL http://img.sgfoot.com/sh/node_exporter.sh |sh
```



## 添加 prometheus 节点

 1. `vim /data/local/prometheus/prometheus.yml` 在 node_exporter.targets 添加 host:port
 1. 重启 `systemctl restart prometheus`

