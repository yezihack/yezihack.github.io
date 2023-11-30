---
title: "Prometheus: 入门"
date: 2020-08-31T10:59:18+08:00
lastmod: 2020-08-31T10:59:18+08:00
draft: false
tags: ["prometheus", "grafana", "监控", "教程"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
#weight: 1
#description: ""
---

> 基于 CentOS 7 amd64 系统

## Prometheus 
1. 多维数据模型（有metric名称和键值对确定的时间序列）
1. 灵活的查询语言
1. 不依赖分布式存储
1. 通过pull方式采集时间序列，通过http协议传输
1. 支持通过中介网关的push时间序列的方式
1. 监控数据通过服务或者静态配置来发现
1. 支持图表和dashboard等多种方式
1. 组件：
   - Prometheus 主程序，主要是负责存储、抓取、聚合、查询方面。
   - Alertmanager 程序，主要是负责实现报警功能。
   - Pushgateway 程序，主要是实现接收由Client push过来的指标数据，在指定的时间间隔，由主程序来抓取。
   - node_exporter 监控远程 linux 服务器CPU、内存、磁盘、I/O等信息

### 生态架构图

> 普罗米修斯的体系结构及其一些生态系统组件
>
> https://prometheus.io/docs/introduction/overview/

![img](https://img-blog.csdnimg.cn/20181228233707328)

工作流程

- Prometheus 服务器定期从配置好的 jobs 或者 exporters 中获取度量数据；或者接收来自推送网关发送过来的 度量数据。
- Prometheus 服务器在本地存储收集到的度量数据，并对这些数据进行聚合；
- 运行已定义好的 alert.rules，记录新的时间序列或者向告警管理器推送警报。
- 告警管理器根据配置文件，对接收到的警报进行处理，并通过email等途径发出告警。
- Grafana等图形工具获取到监控数据，并以图形化的方式进行展示。

### Client Library 提供度量的四种类型

1. Counter 类型： 计数器。
   1. 是一个累计的指标，代表一个单调递增的计数器，它的值只会增加或在重启时重置为零。
   2. 一般用于记录访问数，错误数，任务数等
2. Gauge 类型：计量器。
   1. 是代表一个数值类型的指标，它的值可以增或减
   2. 如CPU的负载，协程数，并发请求量，内存使用量等
3. Histogram 柱状图
   1. 是一种累积直方图，在一段时间范围内对数据进行采样，并将其计入可配置的存储桶（bucket）中。
   2. histogram并不会保存数据采样点值，每个bucket只有记录样本数的counter,即histogram存储是区间的样本数据统计值。
   3. 如请求持续时间或响应大小等。
4. Summary 摘要
   1. 是对百分数进行统计的。
   2. 即在一段时间内（默认10分钟）的每个采样点进行统计，并形成分位图 （如：正态分布一样，统计低于60分不及格的同学比例，统计低于80分的同学比例，统计低于95分的同学比例） 



## 参考

1. [文档下载](https://freemt.lanzous.com/iqhTfg8bzuf)
2. [官方文档](https://prometheus.io/docs/introduction/overview/)
3. [非官方中文文档](https://yunlzheng.gitbook.io/prometheus-book)
4. [CentOS7.5 Prometheus2.5+Grafana5.4监控部署](https://blog.csdn.net/xiegh2014/article/details/84936174)
5. https://blog.csdn.net/wtan825/article/details/94616813

