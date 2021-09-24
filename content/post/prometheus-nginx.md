---
title: "Prometheus Nginx"
date: 2020-11-05T20:08:17+08:00
lastmod: 2020-11-05T20:08:17+08:00
draft: true
tags: ["prometheus", "监控", "教程"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

> Prometheus 监控 nginx 需要用到两个模块
>
> 1. nginx-module-vts 主要用于收集 nginx 各项指标.能提供 json 数据
> 2. nginx-vts-exporter



## nginx-module-vts 安装

> 需要对 nginx 进行重新编译, 对于正在运行的 nginx 需要热启动, 谨慎操作.

一. 下载 `nginx-module-vts` 模块文件

```sh
cd /usr/local/src
git clone https://github.com/vozlt/nginx-module-vts 
```

