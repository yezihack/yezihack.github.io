---
title: "Go 优雅追踪堆栈错误包"
date: 2021-01-21T14:42:08+08:00
lastmod: 2021-01-21T14:42:08+08:00
draft: false
tags: ["golang", "每日一库", "Go库"]
categories: ["GO库"]
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

![github.com/yezihack/e](http://img.sgfoot.com/b/20210121205418.png?imageslim)

> Golang tracks stack error package. 优雅追踪堆栈错误包

## 安装(Install)

```
go get github.com/yezihack/e
```

## 介绍(Introduction)
`github.com/yezihack/e` 项目是一个优雅地追踪你的堆栈信息.方便存储日志里.
而且还扩展了`error`包,自定义 `code,msg` 信息.

## 特色(Features)
> 优雅地追踪堆栈错误信息
1. 基于`github.com/pkg/errors`包进行封装
2. 支持 `code`, `msg` 自定义错误码和错误信息
3. 方便存储日志`json`文件
4. 堆栈信息以人性化展示

## 文档(Documentation)
[https://godoc.org/github.com/yezihack/e](https://godoc.org/github.com/yezihack/e)


## 简单使用(Use)
```go
package main
import (
	"github.com/yezihack/e"
    "log"
)
func foo() error {
	return e.New("foo")
}
func main() {
    err := foo()
    if err != nil { // 需要判断是否是自定义error, 否则无法输出堆栈信息.
        if e.Assert(err)  {
            log.Println(e.Convert(err).ToStr()) // 输出字符串形式
            log.Println(e.Convert(err).ToArr()) // 输出数组形式
        } else {
            log.Println(err) // 系统的 error
        }
    }
}
```

## 与原堆栈信息对比

`github.com/pkg/errors` 原生输出的. 

> 仅使用 fmt.Printf("%+v", err) 输出

```sh
// Example output:
	// whoops
	// github.com/pkg/errors_test.ExampleNew_printf
	//         /home/dfc/src/github.com/pkg/errors/example_test.go:17
	// testing.runExample
	//         /home/dfc/go/src/testing/example.go:114
	// testing.RunExamples
	//         /home/dfc/go/src/testing/example.go:38
	// testing.(*M).Run
	//         /home/dfc/go/src/testing/testing.go:744
	// main.main
	//         /github.com/pkg/errors/_test/_testmain.go:106
	// runtime.main
	//         /home/dfc/go/src/runtime/proc.go:183
	// runtime.goexit
	//         /home/dfc/go/src/runtime/asm_amd64.s:2059
```

`github.com/yezihack/e` 输出的. 
> 可以进行字符串输出, 也可以以切片输出 

```sh
file:1.how_test.go, line:13, func:foo
file:1.how_test.go, line:18, func:TestFoo.func1
file:discovery.go, line:80, func:parseAction.func1
file:context.go, line:261, func:(*context).conveyInner
file:context.go, line:110, func:rootConvey.func1
file:context.go, line:97, func:(*ContextManager).SetValues.func1
file:gid.go, line:24, func:EnsureGoroutineId.func1
file:stack_tags.go, line:108, func:_m
file:stack_tags.go, line:56, func:github_com_jtolds_gls_markS
file:stack_tags.go, line:49, func:addStackTag
file:gid.go, line:24, func:EnsureGoroutineId
file:context.go, line:63, func:(*ContextManager).SetValues
file:context.go, line:105, func:rootConvey
file:doc.go, line:75, func:Convey
file:1.how_test.go, line:17, func:TestFoo
```


## 实例(Example)

1. [基本用法](https://github.com/yezihack/e/example/1.how_test.go)
1. [Code用法](https://github.com/yezihack/e/example/2.code_test.go)
1. [兼容老项目里的 error](https://github.com/yezihack/e/example/3.compatibility-error_test.go)
1. [获取 extra 的扩展错误](https://github.com/yezihack/e/example/4.extra_test.go)
1. [gin中使用](https://github.com/yezihack/e/example/5.gin_test.go)
1. 更多等待更新中... 

输出普通信息和堆栈信息(string or array)
```go
package main

import (
	"log"

	"github.com/yezihack/e"
)

func foo(s string) error {
	return e.New("foo," + s)
}

func main() {
	// (1)普通使用
    err := foo("stack error")
    if err != nil {
        log.Println(err)
    }
    // out:
    // 2021/01/15 20:23:21 foo,stack error

    // (2)输出堆栈信息 by string
    if e.Assert(err) { // 需要判断是否是自定义error, 否则无法输出堆栈信息.
        log.Println(e.Convert(err).ToStr())
    }
    // out:
    //2021/01/15 20:23:21 file:1.how.go, line:10, func:foo
    //file:1.how.go, line:15, func:main

    // (3)输出堆栈信息 by array
    if e.Assert(err) { // 需要判断是否是自定义error, 否则无法输出堆栈信息.
        log.Println(e.Convert(err).ToArr())
    }
    // out
    //2021/01/15 20:23:21 [file:1.how.go, line:10, func:foo file:1.how.go, line:15, func:main]
}
```

带自定义`code`的错误信息

```go
package main

import (
	"fmt"

	"github.com/yezihack/e"
)

// 如果使用带 code 的 error
func fooCode() error {
	return e.NewCode(400, "eoo error")
}

func main() {
	err := fooCode()
	if e.Assert(err) {
		e1 := e.Convert(err)
		fmt.Printf("code:%d, err:%s\n", e1.Code(), e1.Msg())
	}
	//out:
	//code:400, err:eoo error
	if e.Assert(err) {
		e1 := e.Convert(err)
		fmt.Printf("code:%d, err:%s\n", e1.Code(), e1.ToStr())
	}
	// out:
	//code:400, err:file:2.code.go, line:11, func:fooCode
	//file:2.code.go, line:15, func:main
}
```

![空树之空-白](http://img.sgfoot.com/b/20210121210259.png?imageslim)