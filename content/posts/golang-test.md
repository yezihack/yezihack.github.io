---
title: "Golang 单元测试/性能测试"
date: 2020-06-30T14:23:04+08:00
lastmod: 2020-06-30T14:23:04+08:00
draft: false
tags: ["golang", "测试", "压测"]
categories: ["golang"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 参考

[Go 单元测试/性能测试](https://www.cnblogs.com/52php/p/6985411.html)



## 性能测试

```
go test -test.bench=. -test.benchmem
```

### 指定方法

```
go test -test.bench=MyFunc -test.benchmem
```

### cpu 性能分析

```
go test -test.bench=MyFunc -test.cpuprofile cpu.out
```

### 内存分析

````
go test -test.bench=MyFunc -test.memprofile mem.out
````

### goroutine 阻塞分析

```
go test -test.bench=MyFunc -test.blockprofile block.out 
```

###　指定几个cpu分析

````
go test -test.bench=MyFunc -test.benchmem -test.cpu 1,2,4
````

