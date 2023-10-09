---
title: "Go 并发"
date: 2020-08-06T12:01:45+08:00
lastmod: 2020-08-06T12:01:45+08:00
draft: false
tags: ["golang", "go"]
categories: ["golang"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



golang 天生语言层面支持并发, 非常棒的语言, 有时我们业务开发时, 遇到复杂场景, 需要用于并发, 将多个请求使用协程组完成并发, 当遇到嵌套循环,还存在上下文关系需要改造为并发请求, 将之前的时间复杂度为O(n^2)改为O(n)的时间复杂度, 那是否还能否并时间复杂度进一步降为O(1)呢? 就出现嵌套并发. 具体如何嵌套并发, 如何写. 今天就一步一步分析.



## 串行执行

1. 时间复杂度为O(n^2)
2. 不使用并发
3. 结果执行时间为 9s

````go

// 串行执行
func SerializeRun() {
	start := time.Now()
	xx := []int{1, 2, 3}
	yy := []int{100, 200, 300}
	for _, x := range xx {
		for _, y := range yy {
			abc(x, y)
		}
	}
	fmt.Printf("串行执行总时间:%s\n", time.Since(start))
}

func abc(x, y int) {
	time.Sleep(time.Second * 1)
	fmt.Printf("x:%d, y:%d\n", x, y)
}
````

执行结果

```
x:1, y:100
x:1, y:200
x:1, y:300
x:2, y:100
x:2, y:200
x:2, y:300
x:3, y:100
x:3, y:200
x:3, y:300
串行执行总时间:9.0026338s
```

## 单协程组并发

1. 使用了协程组将O(n^2)降为O(n)
2. 结果执行时间为 3s

```go
// 单并行执行
func SingleConcurrenceRun() {
	start := time.Now()
	xx := []int{1, 2, 3}
	yy := []int{100, 200, 300}
	for _, x := range xx {
		wgg := sync.WaitGroup{}
		for _, y := range yy {
			wgg.Add(1)
			go func(x, y int) {
				defer wgg.Done()
				abc(x, y)
			}(x, y)
		}
		wgg.Wait()
	}
	fmt.Printf("单并行执行总时间:%s\n", time.Since(start))
}
func abc(x, y int) {
	time.Sleep(time.Second * 1)
	fmt.Printf("x:%d, y:%d\n", x, y)
}
```

结果

```shell
x:1, y:300
x:1, y:200
x:1, y:100
x:2, y:100
x:2, y:200
x:2, y:300
x:3, y:300
x:3, y:100
x:3, y:200
单并行执行总时间:3.0013813s
```

## 嵌套并发执行

1. 使用嵌套协程组执行并发. 
2. 将O(n^2)降到O(1)
3. 结果执行时间为 1s

```go

// 嵌套执行
func NestConcurrenceRun() {
	xx := []int{1, 2, 3}
	yy := []int{100, 200, 300}
	start := time.Now()
	wgg := sync.WaitGroup{}
	for _, x := range xx {
		wgg.Add(1)
		go func(x int) {
			wg := sync.WaitGroup{}
			for _, y := range yy {
				wg.Add(1)
				go func(x, y int) {
					defer wg.Done()
					abc(x, y)
				}(x, y)
			}
			wg.Wait()
			wgg.Done()
		}(x)
	}
	wgg.Wait()
	fmt.Printf("嵌套并发执行总时间:%s\n", time.Since(start))
}
func abc(x, y int) {
	time.Sleep(time.Second * 1)
	fmt.Printf("x:%d, y:%d\n", x, y)
}
```

结果

```go
x:1, y:200
x:3, y:300
x:3, y:200
x:1, y:300
x:2, y:200
x:1, y:100
x:2, y:300
x:2, y:100
x:3, y:100
嵌套并发执行总时间:1.0023542s
```

