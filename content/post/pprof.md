---
title: "Pprof"
date: 2020-06-05T19:16:31+08:00
lastmod: 2020-06-05T19:16:31+08:00
draft: false
tags: ["golang", "pprof", "性能分析", "火焰图"]
categories: ["工具"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""
---

## 前言

> 如果你的应用是一直运行的，比如 web 应用，那么可以使用 `net/http/pprof` 库，它能够在提供 HTTP 服务进行分析。而非一直运行的程序可以使用 runtime/pprof 库

go1.10自带 go tool pprof工具

`go version` 查看golang版本

## 安装

引用包`_ "net/http/pprof"`

内置包的路径: net\http\pprof\pprof.go

```
const (
	PProfPort = 6060 // 端口
)
func PprofServer() {
	runtime.SetMutexProfileFraction(1) // 开启对锁调用的跟踪
	runtime.SetBlockProfileRate(1)     // 开启对阻塞操作的跟踪
	go func() {
		err := http.ListenAndServe(fmt.Sprintf(":%d", PProfPort), nil)
		if err != nil {
			zlog.Warn().Err(err).Msg("BootPprof")
		}
	}()
}

func main() {
	PprofServer()
	select{}
}

```

## 浏览器查看

1.  allocs 查看内存分配详情
2. block 同步原语阻塞的堆栈跟踪
3. cmdline 当前程序运行的参数
4. goroutine 所有当前goroutines的堆栈跟踪
5. heap 活动对象的内存分配的抽样
6. mutex 争用互斥锁的持有者的堆栈跟踪
7. profile CPU配置文件, 还可以使用go tool pprof 查看某时间段的cpu情况, 并生成火焰图
   1. `go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30`
8. threadcreate.Stack 导致创建新的OS线程的跟踪
9. trace 当前程序执行的轨迹
   1. `wget http://localhost:6060/debug/pprof/trace?seconds=5`

```
http://127.0.01:8080/debug/pprof/
```

![image-20200605192934762](http://img.sgfoot.com/b/20200605200515.png?imageslim)

## 命令行使用

新建Makefile文件

`touch Makefile`

```
#!/bin/bash
PPort=6060
profile:
	go tool pprof http://localhost:${PPort}/debug/pprof/profile
heap:
	go tool pprof http://localhost:${PPort}/debug/pprof/heap
allocs:
	go tool pprof http://localhost:${PPort}/debug/pprof/allocs
goroutine:
	go tool pprof http://localhost:${PPort}/debug/pprof/goroutine
mutex:
	go tool pprof http://localhost:${PPort}/debug/pprof/mutex
block:
	go tool pprof http://localhost:${PPort}/debug/pprof/block
```

例: make profile 进行命令行.

常用命令: top(排序),  png(生成一张图片), tree(列出一张表格)

## 火焰图

获取最近10秒程序运行的cpuprofile,-seconds参数不填默认为30

```text
go tool pprof http://127.0.0.1:6060/debug/pprof/profile?seconds=10
```

10秒后会在root/pprof文件夹下生成一个类似这样的文件: 

`Saved profile in /root/pprof/pprof.samples.cpu.007.pb.gz`

然后使用: go tool pprof -http=0.0.0.0:6061 /root/pprof/pprof.samples.cpu.007.pb.gz` 

然后浏览器上: http://127.0.0.1:6061

![image-20200605195833389](http://img.sgfoot.com/b/20200605200536.png?imageslim)

图中,从上往下是方法的调用栈,长度代表cpu时长。

## 参考

1. https://zhuanlan.zhihu.com/p/71529062
1. https://gocn.vip/topics/10521