---
title: "设计模式-充血模式(九)"
date: 2021-01-14T14:37:12+08:00
lastmod: 2021-01-14T14:37:12+08:00
draft: false
tags: ["设计模式", "教程"]
categories: ["设计模式"]
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

> 充血模式即领域驱动设计(Domain Driven Design, 简称 DDD)

## 贫血模式

>  在之前我们写一篇关于[贫血模式](https://www.sgfoot.com/gof-mvc.html)的文章, 点击查看.

贫血模式是目前主流的一种开发模式, 基于MVC结构的开发模式.

MVC三层架构中

1. M 表示 Model 即数据层
2. V 表示 View 即展示层
3. C 表示 Controller 即逻辑层

做为后端开发MVC有所调整

	1.  Model 层 负责数据访问
 	2.  Service层 负责业务逻辑
 	3.  Controller层 负责暴露接口