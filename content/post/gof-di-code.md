---
title: "设计模式-依赖注入DI.Go实例(十一)"
date: 2021-02-08T11:22:56+08:00
lastmod: 2021-02-08T11:22:56+08:00
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

### 依赖注入(DI)

> Dependency Injection

不通过 new() 的方式在类内部创建依赖类对象，而是将依赖的类对象在外部创建好之后，通过构造函数，函数参数等方式传递（或注入）给类使用。

*tip: 基于接口而非实现编程*

## Go代码实现

```go
package main

import "fmt"

// DI 依赖注入:Dependency Injection

// 定义一个发送接口类
type ManagerSender interface {
	// 发送类
	Send(phone, message string)
}

// 定义短信发送结构体，实现 ManagerSender 接口
type SmsSender struct {
}

func (s *SmsSender) Send(phone, message string) {
	fmt.Printf("正在使用短信发送消息，手机号:%s,消息内容:%s\n", phone, message)
}

// 定义站内发送结构体，实现 ManagerSender 接口
type InboxSender struct {
}

func (s *InboxSender) Send(phone, message string) {
	fmt.Printf("正在使用站内发送消息，手机号:%s,消息内容:%s\n", phone, message)
}

// ----------------- 实现注入的代码 --------------------
// 定义一个发消息结构体
type Notification struct {
	ms ManagerSender
}

// 将接口赋值给 Notification
func NewNotification(m ManagerSender) *Notification {
	return &Notification{ms: m}
}

// 实现发消息，使用接口的对象 Send
func (n *Notification) SendMessage(phone, message string) {
	n.ms.Send(phone, message)
}

func main() {
	// 传入不同的结构体，实现不同的类型发送消息。
	NewNotification(&SmsSender{}).SendMessage("15112341234", "你回来没有？")
	NewNotification(&InboxSender{}).SendMessage("13198771100", "我回来了!")
}
```


![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122112114.png?imageslim)