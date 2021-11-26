---
title: "设计模式-控制反转IOC.Go实例(十二)"
date: 2021-02-08T11:23:01+08:00
lastmod: 2021-02-08T11:23:01+08:00
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



### 控制反转(IOC)

> Inversion Of Control

1. “控制”是指对程序执行流程的控制

2. ”反转“ 指没有使用框架之前，程序员自己控制整个程序的执行。在使用框架之后，整个程序的执行流程可以通过框架来控制。流程的控制权从程序员”反转“到了框架。

*tip: 控制反转是指对程序执行流程的控制权交给框架完成。*



## Go代码实现

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// 控制反转 ioc

// 定义一个发送接口
type Sender interface {
	Send() // 发送函数
}

// 定义一个发送 app 结构体，实现控制反转操作
type SendIoc struct {
	list chan Sender // 使用 chan 的发送接口
}

var (
	// 定义一个全局的 Ioc 对象，保证全局唯一
	__sendApp     *SendIoc
	__sendAppOnce sync.Once
)

func NewSendIoc() *SendIoc {
	__sendAppOnce.Do(func() {
		__sendApp = &SendIoc{
			list: make(chan Sender, 10),
		}
		go __sendApp.run() // 进行调度操作，也就是在框架内实现控制反转
	})
	return __sendApp
}

// 注册接口
func (s *SendIoc) Register(ss Sender) {
	s.list <- ss
}

// 实现框架自动调度，即控制反转
func (s *SendIoc) run() {
	for {
		select {
		case f, ok := <-s.list:
			if ok {
				f.Send()
			}
		}
	}
}

// 实现 Sender 接口
type TxtSend struct {
	ID int
}

func (t *TxtSend) Send() {
	fmt.Printf("%d:使用 txt 发送消息\n", t.ID)
}

// 实现 Sender 接口
type SmsSend struct {
	ID int
}

func (s *SmsSend) Send() {
	fmt.Printf("%d:使用 sms 发送消息\n", s.ID)
}
func main() {
	// 向框架里注册，框架自动完成控制反转操作。
	for i := 0; i < 100; i++ {
		NewSendIoc().Register(&TxtSend{ID: i})
		NewSendIoc().Register(&SmsSend{ID: i})
	}
	time.Sleep(time.Millisecond * 1500)
}
```


















![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)