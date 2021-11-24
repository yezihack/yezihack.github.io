---
title: "GO 编译及构建"
date: 2021-08-06T17:38:49+08:00
lastmod: 2021-08-06T17:38:49+08:00
draft: true
tags: ["Go实践教程", "golang", "教程"]
categories: ["Go教程"]
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



## 普通构建



## 构建过程

> Go 编译器逻辑上共分为四个阶段

1. 第一阶段：语法分析
   1. 此阶段主要是将所有的代码生成 token 序列
2. 第二阶段：语法分析
   1. 将 token 转换成抽象语法树 AST
3. 第三阶段：语义分析（类型检查）
   1. 检查常量，类型推断
4. 第四阶段：中间代码生成
   1. 从AST抽象语法树转换成 SSA
5. 第五阶段：机器码生成
   1. 二进制的生成



| 名称    | 说明                                                         |
| ------- | ------------------------------------------------------------ |
| `-a`    | 强制重新编译所有的源代码                                     |
| `-n`    | 只打印执行过程，不真执行代码                                 |
| `-race` | 用于检查程序中存在的数据竞争问题，当使用大量的并发时，非常有用 |
| `-v`    | 编译时显示包名                                               |
| `-x`    | 编译时显示所有用到的命令                                     |
| `-p n`  | 开启并发编译，加快编译速度。默认CPU核数                      |



## 普通编译

```sh
go build .
```

### 模拟编译过程

>   加 -n  不真正执行它

```sh
go build -n .
```



## 最小编译

```sh
# 编译的时候禁止内联
go build -gcflags '-N -l'

-N 禁止编译优化
-l 禁止内联,禁止内联也可以一定程度上减小可执行程序大小

```



## 零依赖编译 

> 会将依赖的标准库全所打包。一般用于 Docker 

```sh
go build '-extldflags "-static"' .
```



## 注入编译



## 交叉编译







## 参考

1 [GO编译原理](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-compile-intro/)





## 关于我
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122112114.png?imageslim)