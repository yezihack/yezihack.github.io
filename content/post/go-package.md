---
title: "Go Package优秀的包"
date: 2020-05-13T14:40:23+08:00
lastmod: 2020-09-09T14:40:23+08:00
draft: false
tags: ["golang", "分享", "golang库"]
categories: ["分享"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

## 文件
| pkg | 文档 | 描述 |
| -------| ------ |------ |
| [fsnotify](https://github.com/fsnotify/fsnotify) | [用法](https://segmentfault.com/a/1190000021632889) | 监听文件修改进而自动重新加载|


## 微服务
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[ratelimit](https://github.com/uber-go/ratelimit)||漏桶率限制算法|
|[Jaeger](https://github.com/jaegertracing/jaeger)||分布式追踪系统|
|[hystrix-go](https://github.com/afex/hystrix-go)||流量控制,熔断,容错,隔离功能|

## 缓存
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[cache2go](https://github.com/muesli/cache2go)||go 进程内缓存|
|[golang-lru](https://github.com/hashicorp/golang-lru)||实现LRU缓存策略|

## 日志&调试
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[errors](https://github.com/pkg/errors)||错误处理|
|[zerolog](https://github.com/rs/zerolog)||零拷贝日志|


## 池
| pkg | 文档 | 描述 |
| -------| ------ |------ |
| [grpool](https://github.com/ivpusic/grpool) |  | 轻量级协程池 |
| [ants](https://github.com/panjf2000/ants) || 协程池|

## 框架 
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[gin](https://github.com/gin-gonic/gin)||web 高效框架|
|[goConvey](https://github.com/smartystreets/goconvey)||单元测试框架, 自带 Web 界面|

## 配置
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[ini](https://github.com/go-ini/ini)||ini 配置文件|
|[gjson](https://github.com/tidwall/gjson)|[用法](https://darjun.github.io/2020/03/22/godailylib/gjson/)|用于读取 JSON 串|
|[sjson](https://github.com/tidwall/sjson)|[用法](https://darjun.github.io/2020/03/24/godailylib/sjson/)|用于设置 JSON 串|

## 唯一ID
| pkg | 文档 | 描述 |
| -------| ------ |------ |
|[uuid](http://github.com/satori/go.uuid)||uuid 码|
|[sonyflake](https://github.com/sony/sonyflake)||sony 雪花算法|
|[xid](https://github.com/rs/xid)||全局唯一ID生成器 20个字符长度|

## 工具包
| pkg | 文档 | 描述 |
| -------| ------ |------ |
| [cron](https://github.com/robfig/cron) | [用法](https://godoc.org/github.com/robfig/cron) | 定时器 by linux crontab|
|[endless](https://github.com/fvbock/endless)||优雅重启 go 程序|
|[com](https://github.com/unknwon/com)||工具包|
|[cast](https://github.com/spf13/cast)||全类型转换|
|[gopass](https://github.com/howeyc/gopass)||交互模式输入密码|
|[cobra](https://github.com/spf13/cobra)||命令行框架, spf13大神出品|



















