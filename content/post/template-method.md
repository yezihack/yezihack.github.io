---
title: "golang模板方法"
date: 2020-04-15T20:26:26+08:00
draft: false
tags: ["golang", "设计模式", "模板方法", "行为模式"]
categories: ["设计模式"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# lastmod: 2018-03-01T16:01:23+08:00
# author: "xianmin"
# reward: false
# mathjax: false
description: "使用WOW讲解模板设计模式, 使用golang实现代码"
share: true  # 是否开启分享
---
![image-20200415202441813](http://img.sgfoot.com/b/20200415202443.png?imageslim)

> 今天我们要使用WOW讲解模板设计模式, 使用golang实现代码


# 原理

定义一个稳定的算法的骨架, 而将一些步骤推迟到子类中实现.

模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤.

## 特点

1. 封装不变的部分, 扩展可变的部分.
2. 抽取公共代码, 做为稳定的部分.
3. 代码流程由父类控制完成, 可变的代码交由子类实现.



## golang 实现模板模式代码
1. 实现一个游戏引擎,包括初使化, 开始, 结束
2. 使用游戏引擎接入不同游戏, 如woo, lol游戏.

### 定义模式接口,即游戏引擎接口
```go
type GameEngineer interface {
	Play()
}
```

### 定义推荐子类实现的方法
> 定义引擎给子类扩展的方法.

```go
type GameEngine struct {
	Init      func()
	StartPlay func()
	EndPlay   func()
}
```

### 定义父类稳定的算法骨架
```go
func (g GameEngine) Play() {
	g.Init()
	g.StartPlay()
	g.EndPlay()
}
```

### 使用游戏引擎
> 实现一款wow游戏.

定义 wow游戏结构,使用游戏提供的引擎(GameEngine)
```go
type WoWGame struct {
	GameEngine
}
```
实现引擎扩展的方法
```go
func (g WoWGame) Init() {
	fmt.Println("wow game")
}

func (g WoWGame) StartPlay() {
	fmt.Println("wow game is start")
}

func (g WoWGame) EndPlay() {
	fmt.Println("wow game is over")
}

```
实例wow游戏 
```go
func NewWoWGame() *WoWGame {
	wow := &WoWGame{}
	wow.GameEngine.Init = wow.Init
	wow.GameEngine.StartPlay = wow.StartPlay
	wow.GameEngine.EndPlay = wow.EndPlay
	return wow
}
```

> 同样的方法实现lol游戏.
```

type LOlGame struct {
	GameEngine
}

func NewLOlGame() *LOlGame {
	lol := &LOlGame{}
	lol.GameEngine.Init = lol.Init
	lol.GameEngine.StartPlay = lol.StartPlay
	lol.GameEngine.EndPlay = lol.EndPlay
	return lol
}

func (g LOlGame) Init() {
	fmt.Println("lol game")
}

func (g LOlGame) StartPlay() {
	fmt.Println("lol game is start")
}

func (g LOlGame) EndPlay() {
	fmt.Println("lol game is over")
}

```

## 运行游戏
```go
func main() {
	// 定义一个游戏引擎句柄
	var game GameEngineer
	// 将wow游戏接入游戏引擎上.
	game = NewWoWGame()
	// 开始玩游戏啦
	game.Play()

	fmt.Println("---------华丽分隔线------------")
	// 将lol游戏接入游戏引擎上.
	game = NewLOlGame()
	// 开始玩游戏啦
	game.Play()
}
```

# 参考文档
1. [深入设计模式之模板模式](https://refactoringguru.cn/design-patterns/template-method/php/example#example-1)