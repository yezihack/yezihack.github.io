---
title: "go压测,pprof分析利器"
date: 2020-06-09T11:21:11+08:00
draft: false
tags: ["golang", "bench", "pprof", "go压测", "go性能", "测试"]
categories: ["golang", "性能"]
author: "百里"
comment: true
toc: true
reward: true
---


# Benchmark

## 新建测试文件

util.go文件

```
func GetMd5V(s string) string {
	h := md5.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func SumMd5(s string) string {
	data := []byte(s)
	return fmt.Sprintf("%x", md5.Sum(data))
}

```

以_test结尾的文件, 如util_test.go

```
func BenchmarkSumMd5(b *testing.B) {
	for i := 0; i < b.N; i++ {
		SumMd5("1")
	}
}
func BenchmarkGetMd5V(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GetMd5V("1")
	}
}
```

## 运行Benchmark函数

```
go test -bench="." -benchmem 
```

## 输出结果

```
BenchmarkSumMd5-8        1719777               847 ns/op              64 B/op          3 allocs/op
BenchmarkGetMd5V-8       1861362               644 ns/op             184 B/op          5 allocs/op
PASS
ok      openapi/app/util        4.493s

```

1. 第二列, 1719777, 1861362 代表执行的次数, 越高越好.
2. ns/op 代表多少纳秒执行一次操作, 越低越好
3. B/op 每次操作内存占用字节数, 越低越好
4. allocs/op 每次操作内存分配次数, 越低越好

## 性能分析

```
 go test -bench="." -cpuprofile=prof.out
 go tool pprof prof.out
```

- `-blockprofilerate n`：goroutine 阻塞时候打点的纳秒数。默认不设置就相当于 -test.blockprofilerate=1，每一纳秒都打点记录一下。
- `-coverprofile cover.out`：在所有测试通过后，将覆盖概要文件写到文件中。设置过 -cover。
- `-cpuprofile cpu.out`：在退出之前，将一个 CPU 概要文件写入指定的文件。
- `-memprofile mem.out`：在所有测试通过后，将内存概要文件写到文件中。
- `-memprofilerate n`：开启更精确的内存配置。如果为 1，将会记录所有内存分配到 profile。

## 安装 Graphviz

https://graphviz.org/_pages/Download/Download_windows.html

1. 选择mis安装, 一直下一步即可.注意安装的目录 
2. 一般在: `C:\Program Files (x86)\Graphviz2.38\bin`
3. 将bin目录添加到path环境变量里.

## 使用Graphviz分析性能

![image-20200609195024098](http://img.sgfoot.com/b/20200609195024.png?imageslim)

![image-20200609195052354](http://img.sgfoot.com/b/20200609195052.png?imageslim)

1. 标红的矩形是cpu耗时最长的.
2. 线最粗的同理.
3. 显示时有耗时与占比.一目了然.分析利器

# 参考

1. [Go 测试，go test 工具的具体指令 flag](https://deepzz.com/post/the-command-flag-of-go-test.html)
2. [Go 基准测试](https://www.flysnow.org/2017/05/21/go-in-action-go-benchmark-test.html)
3. [安装Graphviz](https://blog.csdn.net/lanchunhui/article/details/49472949)

