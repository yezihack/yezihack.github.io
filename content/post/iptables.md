---
title: "Iptables 防火墙基础操作(一)"
date: 2021-02-23T11:53:51+08:00
lastmod: 2021-02-23T11:53:51+08:00
draft: false
tags: ["linux", "防火墙", "安全"]
categories: ["linux"]
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

> 基于 linxu centos 7 

## 查看防火墙

> iptables 命令大小写敏感

```sh
iptables -nL
```

## 添加一条规则

添加一条开放 9090 端口的规则



```sh
# 插入最前面
iptables -I INPUT -p tcp --dport 9090 -j ACCEPT
# 追加最后面
iptables -A INPUT -p tcp --dport 9090 -j ACCEPT


# 插入某指定位置
iptables -I INPUT 3 -p tcp --dport 9090 -j ACCEPT
```















## 关于我
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)