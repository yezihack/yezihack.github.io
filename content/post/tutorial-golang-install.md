---
title: "Go 实践教程-安装(二)"
date: 2020-09-11T18:10:11+08:00
lastmod: 2020-09-11T18:10:11+08:00
draft: false
tags: ["Go实践教程","golang"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 本教程基于 Go1.11版本展开， 也就是官方提供 Go Module 功能。

## 安装 Golang 

> 国内推荐下载点 [Go 语言中文网](https://studygolang.com/dl) ，默认大家使用 CPU Amd 64 架构
>
> 最新版本：go1.15.2

###  Window

https://studygolang.com/dl/golang/go1.15.2.windows-amd64.msi

 傻瓜式一键安装即可。安装目录推荐 `c:\\Go`

**添加环境变量**

打开 powershell

```shell
$env:path += ";c:\\Go\bin"
```

**设置 goproxy**

> 国内加速代理

```shell
# 启用 Go Modules 功能
$env:GO111MODULE="on"
# 配置 GOPROXY 环境变量
$env:GOPROXY="https://goproxy.io,direct"
```

**查看 go env**

```shell
go env
```



### Linux 

```shell
cd /usr/local/src/
wget https://studygolang.com/dl/golang/go1.15.2.linux-amd64.tar.gz
tar -zxvf go1.15.2.linux-amd64.tar.gz -C /usr/local/
```

**添加环境变量**

```shell

```



### MacOS

https://studygolang.com/dl/golang/go1.15.2.darwin-amd64.pkg

```shell
cd /usr/local/src/
wget https://studygolang.com/dl/golang/go1.15.2.darwin-amd64.tar.gz
tar -zxvf go1.15.2.darwin-amd64.tar.gz -C /usr/local/
```



