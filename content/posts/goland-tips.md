---
title: "Goland 提高效率的技巧"
date: 2020-06-17T11:31:17+08:00
lastmod: 2020-06-17T11:31:17+08:00
draft: false
tags: ["golang", "效率", "goland"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

> 工欲善其事, 必先利其器

## 添加 Go MOD

> File->Settings->Go->Go Modules

1. 填写 goproxy: `GOPROXY=https://goproxy.cn,direct`
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200617114544.png?imageslim)

## 结构体添加 tags

> File->Settings->Editor->Live Templates -> Go

1. 复制一个 tag
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200617113853.png?imageslim)

2. 新建一个 "gorm"
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200617114046.png?imageslim)

3. 使用
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200617114300.png?imageslim)

## 保存时并格式代码

> File->Settings->Tools->File Watchers

1. 选择 `go fmt`
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200617115019.png?imageslim)