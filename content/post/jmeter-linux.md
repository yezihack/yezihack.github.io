---
title: "Jmeter Linux 使用"
date: 2020-08-03T19:18:30+08:00
lastmod: 2020-08-03T19:18:30+08:00
draft: false
tags: ["jmeter", "压测"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

> 采用 centos 安装, jmeter 5.3版本

## 安装 java jdk 环境

> JDK1.8版本即可满足

````
yum install java-1.8.0-openjdk
````

## 下载 jmeter

```
cd /home/
wget https://mirrors.bfsu.edu.cn/apache//jmeter/binaries/apache-jmeter-5.3.zip
unzip apache-jmeter-5.3.zip
cd apache-jmeter-5.3
pwd

```

## 配置环境变量
> 官方下载: https://jmeter.apache.org/download_jmeter.cgi

```
export JMETER=/home/apache-jmeter-5.3
export CLASSPATH=$JMETER/lib/ext/ApacheJMeter_core.jar:$JMETER/lib/jorphan.jar:$JMETER/lib/logkit-2.0.jar:$CLASSPATH
export PATH=$JMETER/bin/:$PATH
```

## 使用
> 首先在 window 版本上新建jmx文件, 然后保存为测试计划. 将 jmx 文件上传到 linux , 使用以下命令运行即可. 得到 jtl 结果文件, 下载下来, 导入到可视化界面上,即可查看到分析的结果.

```
jmeter -n -t test.jmx -l test.jtl
```



图示: 保存 test.jmx 文件

![image-20200803192529974](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200803192531.png?imageslim)

![image-20200803192551511](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200803192552.png?imageslim)

图示: 导入分析结果

![image-20200803192721153](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200803192722.png?imageslim)