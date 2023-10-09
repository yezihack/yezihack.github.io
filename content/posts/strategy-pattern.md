---
title: "go 策略模式(三)"
date: 2020-04-26T19:58:34+08:00
lastmod: 2020-08-19T10:58:34+08:00
draft: true
tags: ["golang", "策略模式","设计模式"]
categories: ["设计模式"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200426201610.png?imageslim)

## 原理

### 1. 概念
 策略模式的概念: 定义一系列的算法,把每一个算法封装起来, 并且使它们可相互替换。
 本模式使得算法可独立于使用它的客户而变化. 也称为政策模式(Policy)

 策略模式 属于行为模式, 可以改变对象的形为操作
 主要解决可以互相替代的算法族, 可以通过动态去替换Context使用的算法.

### 2. 适用于
 1. 消除了一些if else条件语句
 2. 实现的选择 Strategy模式可以提供相同行为的不同实现

### 3. 缺点
 1. 客户端必须知道所有的策略类，并自行决定使用哪一个策略类
 2. Strategy和Context之间的通信开销
 3. 策略模式将造成产生很多策略类

## 代码实现
### 1. 定义策略接口
- 文件名:strategy.go
```
// 定义一个策略接口, 可以独立于具体算法.
type Strategy interface {
	// 接口方法, 这里只是抽象出一种算法框架, 而不定义具体使用哪种算法, 将实现推迟到实现的子类
	// 这里只定义算法框架, 这是重点.
	DoOperation(x, y int) int
}
```
### 2. 定义上下文Context
- 文件名:context.go
- 如何实现不同算法使用同一个框架呢? 由Context完成操作.
- Context叫做上下文角色，起承上启下封装作用，屏蔽高层模块对策略、算法的直接访问，封装可能存在的变化。 ---<<设计模式之禅>>
```
// 创建一个Context 结构接受接口的对象.
type Context struct {
	sy Strategy // 这里必须与接口建立一种继承关系(golang里这就是一种继承, 没有 implements 关键字)
}
// New一个Context, 返回结构体
func NewContext(s Strategy) *Context {
	return &Context{
		sy:s, // 接口赋值给sy
	}
}
// 执行接口里的方法, 这里非常关键, 也是具体算法的执行方法.也称执行策略方法
func (c *Context) ExecuteStrategy(x, y int) int {
	return c.sy.DoOperation(x, y)
}
```

### 3. 实现策略接口(1)
- 文件名: add.go
```
// 实现策略接口
type Add struct {
}
// 这里就是策略实现不同的算法代码.
func (a *Add) DoOperation(x, y int) int {
	return x +y
}
```

### 4. 实现策略接口(2)
- 文件名 sub.go
```
// 实现策略接口
type Sub struct {
}

// 这里就是策略实现不同的算法代码.
func (s *Sub) DoOperation(x, y int)int {
	return x - y
}

```

### 5. main实现策略模式的调用
- 文件名:main.go
```
func main() {
	// New一个Context, 将具体算法传入
	add := NewContext(&Add{})
	// 调用执行策略的访求
	fmt.Printf("Add x + y: %d\n", add.ExecuteStrategy(10, 10))
	// New一个Context, 将具体算法传入
	sub := NewContext(&Sub{})
	// 调用执行策略的访求
	fmt.Printf("sub x + y: %d\n", sub.ExecuteStrategy(10, 10))
}
```

## 参考
 1. https://blog.csdn.net/hguisu/article/details/7558249
 2. https://www.runoob.com/design-pattern/strategy-pattern.html
