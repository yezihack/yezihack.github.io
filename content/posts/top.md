---
title: "Top"
date: 2020-06-22T10:21:47+08:00
lastmod: 2020-06-22T10:21:47+08:00
draft: false
tags: ["linux", "top", "性能分析", "性能", "技巧", "优化"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

> top 是 linux 最常用的命令, 包括很多少直观的信息, 有利于我们对系统运行状态的把握.

## top 使用

> top 系统自带命令,可以直接使用.

```
top 
```

## top 详情

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200622103249.png?imageslim)

a. 如图编号(1) 
```
top - 10:34:07 up 16 min,  1 user,  load average: 0.00, 0.01, 0.05
```

1. 10:34:07 当前时间
2. up 16 min 系统运行时间, 如 16 分钟
3. 1 user 当前登陆用户数
4. load average: 0.00, 0.01, 0.05 系统负载. 三个数值分别为 1分钟、5分钟、15分钟前到现在的平均值。

b. 如图编号(2)

```
Tasks: 206 total,   1 running, 205 sleeping,   0 stopped,   0 zombie
```

1. Tasks: 206 total 进程总数
2. 1 running 正在运行的进程数
3. 205 sleeping 睡眠进程数
4. 0 stopped 停止进程数
5. 0 zombie 僵尸进程数

c. 如图编号(3)

```
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
```

1. %Cpu(s):  0.0 us 用户空间占用CPU百分比
2. 0.0 sy 内核空间占用CPU百分比
3. 0.0 ni 用户进程空间内改变过优先级的进程占用CPU百分比
4. 100.0 id 空间CPU百分比
5.  0.0 wa 等待输入输出CPU时间百分比
6. 0.0 hi 硬中断CPU占用百分比
7. 0.0 si 软中断CPU占用百分比
8. 0.0 st 虚拟机CPU占用百分比

d. 如图编号(4)

```
KiB Mem :  1863088 total,  1495200 free,   210928 used,   156960 buff/cache
```

1. KiB Mem 内存(kb 单位)
2. 1863088 total 物理内存总量
3. 1495200 free 空闲内存总量
4. 210928 used  使用的物理内存总量
5. 156960 buff/cache 用作内核缓存的内存量

e. 如图编号(5)

```
KiB Swap:  2097148 total,  2097148 free,        0 used.  1499120 avail Mem
```

1. KiB Swap 交换区(kb 单位)
2. 2097148 total 交换区总量
3. 2097148 free 空闲交换区总量
4. 0 used 使用交换区总量
5. 1499120 avail Mem 有效使用总量

f. 如图编号(6)

```
PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
```

1. PID 进程ID
2. USER 进程所有者
3. PR 进程优化级
4. NI nice值。负值表示高优先级，正值表示低优先级
5. VIRT 进程使用的虚拟内存总量，单位kb。VIRT=SWAP+RES
6. RES 进程使用的、未被换出的物理内存大小，单位kb。RES=CODE+DATA
7. SHR 共享内存大小，单位kb
8. S  进程状态。
   1. D=不可中断的睡眠状态 
   2. R=运行 
   3. S=睡眠 
   4. T=跟踪/停止 
   5. Z=僵尸进程
9. %CPU 上次更新到现在的CPU时间占用百分比
10. %MEM 进程使用的物理内存百分比
11. TIME+ 进程使用的CPU时间总计，单位1/100秒
12. COMMAND 进程名称（命令名/命令行）

## top 交互命令

> 以下为常用而有用的操作.

1. l 切换显示平均负载和启动时间信息
2. m 切换显示内存信息
3. t 切换显示进程和CPU状态信息
4. c 切换显示命令名称和完整命令行
5. M 根据驻留内存大小进行排序
6. P 根据CPU使用百分比大小进行排序
7. T 根据时间/累计时间进行排序

## top 实操

### 显示多核CPU监控

```
top 
按数字: 1 即可
```

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200622110832.png?imageslim)

### 彩色显示
top 使用大写 Z, 进入如下界面后, 进行使用数字 `0 ~ 7` 共8种颜色可以选择. 也可以使用

`a`或`w` 轮询选择(注意是小写的 a , w). 然后按回车即可.

![image-20200622111153523](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200622111154.png?imageslim)

如果想取消则按小写的: `z` 恢复默认色.

### 高亮正在运行的进程

进入`top` 界面后, 使用小写: `b` , 取消再次按:`b`

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200622111746.png?imageslim) 

### 显示完整命令

使用`top -c` 回车即可.

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200622111956.png?imageslim)

### **显示指定的进程信息**

使用`top -p 6379` 回车即可.



## 参考

1. [top命令](https://man.linuxde.net/top)