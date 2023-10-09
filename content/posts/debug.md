---
title: "Debug 调试"
date: 2020-09-01T17:24:01+08:00
lastmod: 2020-09-01T17:24:01+08:00
draft: false
tags: ["debug", "调试"]
categories: ["debug"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## Linux 网络调试

1. tcpdump 监听网卡 eth0 及 端口 80 

```shell
tcpdump -i eth0 -nnA 'port 80'
```

