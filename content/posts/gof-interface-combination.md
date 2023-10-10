---
title: "设计模式-接口组合(八)"
date: 2021-01-11T20:23:10+08:00
lastmod: 2021-01-11T20:23:10+08:00
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

> 有一种非常经典的设计原则: 组合优于继承, 多用组合少用继承



## 为什么少用继承

> 继承是面向对象的四大特性之一, 表示类之间的 is-a 关系. 支持多态特性, 可以解决代码复用问题.

如果继承层次过深, 过复杂, 会影响到代码的可维护性, 可读性. 

![image-20210111202903783](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210111202911.png?imageslim)

如上面, 继承带来的后果就是代码变得复杂, 因为层次过深, 继承关系过于复杂, 影响到代码的可读性与可维护性. 

## 组合的优势

可以利用组合(composition), 接口(interface), 委托(delegation) 三个技术手段解决继承的问题.(如上面的问题)

1. 利用接口实现多态特性

2. 利用组合和委托实现代码复用问题

通过组合, 接口, 委托三个技术手段完全可以替换掉继承. 

Tip: 在项目中不用或少用继承关系, 特别是一些复杂的继承关系 .



## 什么时候使用继承还是组合

> 一个技术的出现, 一定是有他的用武之地, 并非一无是处.

当类之间的继承结构稳定, 继承层次比较浅(最多有两层继承关系), 我们可以大胆使用继承. 

当类之间的继承结构不稳定, 复杂, 继承层次又深,我们尽量考虑使用组合来替代继承 

**哪些设计模式使用了继承?**

1. 装饰者模式(decorator pattern)
2. 策略模式(strategy pattern)
3. 组合模式(composite pattern)

**哪些设计模式使用了组合?**

1. 模板模式(template pattern)