---
title: "Go 实践教程-gRPC-简介(五)"
date: 2020-10-21T14:18:34+08:00
lastmod: 2020-10-21T14:18:34+08:00
draft: false
tags: ["Go实践教程", "golang", "教程", "grpc入门"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---



## 什么是gRPC

> RPC 是远程过程调用 (Remote Procedure Call)的缩写。在 RPC 中，客户端应用程序可以直接调用不同机器上的服务器应用程序上的方法，就像它是本地对象一样，使您可以更轻松地创建分布式应用程序和服务。

gRPC 是 Google 开源的基于 Protobuf 和 Http2.0 协议的通信框架，底层由netty提供。

是一款语言中立、平台中立、开源的远程过程调用(RPC)系统。

![image-20201021145555841](http://img.sgfoot.com/b/20201021145604.png?imageslim)

## 特点

1. 基于HTTP/2协议实现，实现多路复用，双向流等特点。
2. 基于 Protobuf 协议，支持多种语言。



## 参考

[gRPC 官方文档中文版](http://doc.oschina.net/grpc)



## 推荐学习

2. [gRPC入门 简介](https://www.sgfoot.com/tutorial-grpc-base.html)
2. [gRPC入门 Protobuf](https://www.sgfoot.com/tutorial-grpc-protobuf.html)
3. [gRPC入门 搭建完整gRPC](https://www.sgfoot.com/tutorial-grpc-simple.html)
4. [gRPC入门 实现双向流](https://www.sgfoot.com/tutorial-grpc-stream-simple.html)

