---
title: "Go 实践教程-简介(一)"
date: 2020-09-11T18:10:03+08:00
lastmod: 2020-09-11T18:10:03+08:00
draft: false
tags: ["Go实践教程", "golang", "教程"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---



## 为什么写这个教程

Golang在中国发展非常不错，国内关于 Golang 的书籍也挺多，网上的 Golang 教程也不在少数。为什么我还要重复造这个轮子呢？我自学 Golang 也是看网上各种教程，学至今日，我回头看过来。刚开始学习时会写个 "Hello World"，懂 Golang 语法，然后实际项目应用上感觉还是从零开始一样，刚开始无法自己去独立构建一个项目，只能采用模仿公司前辈写的项目再加领导指点一下，在写项目其间也遇到各种坑，如指针，Chan，切片等问题。而网上的教程大多数都是一种教科书式的，基本模式是：学习理论 -> 实践 -> 入坑 -> 理论 -> 实践 。 完成一个完整的闭环，你算是从理论入门到实践入门再到理论与实践结合入门。

这个教程的初衷就是让你一次：实践入门，至于基本理论原理涉及篇幅太大，不过其间也会略提一些。我也会推荐一些非常棒的教程供大家学习。

**本入门系列只带你实践入门，教你写出日常工程代码**



##  历史

1. Go 语言起源于 2007 年，并在 2009 年正式发布
2. Go 是一门非常年轻的语言，它“兼具 Python 的简洁，C/C++ 的性能与安全”
3. Go 被誉为“21世纪的 C 语言"

##  创始人

1. Rob Pike
   1. Go语言项目总负责人，贝尔实验室 Unix 团队成员
2. Ken Thompson
   1. 贝尔实验室 Unix 团队成员，C语言、Unix 和 Plan 9 的创始人之一
3. Robert Griesemer
   1. 就职于 Google，参与开发 Java HotSpot 虚拟机，对语言设计有深入的认识，并负责 Chrome 浏览器和 Node.js 使用的 Google V8 [JavaScript](http://c.biancheng.net/js/) 引擎的代码生成部分。

## 特点&优势

1. 语言层面支持并发编程
2. 跨平台编译
3. 特性少，语法简单，易于上手
4. 静态类型语言
5. 丰富的标准库和丰富的工具链
6. 可直接编译成机器码，不依赖其他库
7. 内嵌C支持
8. 支持GC
9. 支持反射
10. 匿名函数和闭包

## 用途

1. 网络编程
2. 系统编程
3. 并发编程
4. 分布式编程

## 知名项目

1. Kubernetes
2. Etcd
3. Prometheus
4. Grafana
5. Docker
6. Hugo
7. Influxdb

## 推荐教程

1. [Go入门指南](https://github.com/unknwon/the-way-to-go_ZH_CN/blob/master/eBook/directory.md)
2. [Go 语言设计与实现 --- 底层实现原理一一讲透](https://draveness.me/golang/) 
3. [Go 语言101---也是讲底层实现的不可多得的教程](https://gfw.go101.org/article/101.html)
4. [Go 语言学习资料与社区索引](https://github.com/unknwon/go-study-index)

