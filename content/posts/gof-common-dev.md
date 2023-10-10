---
title: "设计模式-通用系统开发(十五)"
date: 2021-02-10T17:37:59+08:00
lastmod: 2021-02-10T17:37:59+08:00
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

> 针对非业务通用框架开发，需要做到尽量通用，适合百变的场景，做到良好的扩展。

## 需求分析

### 功能性需求分析

1. 满足使用者的需求，尽量通用。
2. 借助设计产品线框图工具来罗列需求点。
3. 把最终的数据显示样式画出来，一目了然。

### 非功能性需求分析

> 一个通用系统，需要做好良好的兼容性。

1. 易用性

   - 框架是否易集成，易插拔，跟业务代码是否松耦合，提供的接口是否够灵活。

2. 性能

   - 当集成到业务系统的框架里，不会影响业务性能。
   - 做到低延时，内存消耗低。

3. 扩展性

   - 做到不修改框架源码进行扩展。
   - 做到给框架开发插件一样扩展。

4. 容错性

   - 非常重要，不能因为框架本身异常导致接口请求错误。

   - 对外暴露的接口抛出的所有运行时，非运行时异常都要进行捕获处理。

5. 通用性

   - 能够灵活应用到各种场景中。
   - 多思考一下，除了当前需求场景，还适合其它哪些场景中。

## 框架设计 

借鉴TDD（测试驱动开发）和 Prototype (最小原型)的思想

1. 先聚集一个简单的应用场景。 
2. 设计实现一个简单的原型。
3. 尽管功能不完善，但它能够看得见，摸得着，比较具体，不抽象，能够很有效地帮助自己缕清更复杂的设计思路，是迭代设计的基础。
4. 在原型系统的代码实现中，我们可以把所有代码都塞到一个类中，暂时不用考虑任何代码质量，线程安全，性能，扩展性等等问题，怎么简单怎么来就行。
5. 最小原型的代码实现虽然简陋，但它帮我们将思路理顺很多。
6. 我们现在就基于它做最终的框架设计。



## 关于我
我的博客：https://yezihack.github.io

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)