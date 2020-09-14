---
title: "Go 实践教程-安装及环境配置(二)"
date: 2020-09-11T18:10:11+08:00
lastmod: 2020-09-11T18:10:11+08:00
draft: false
tags: ["Go实践教程","golang"]
categories: ["Go教程"]
author: "百里"
comment: true
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

### Linux 

```shell
cd /usr/local/src/
wget https://studygolang.com/dl/golang/go1.15.2.linux-amd64.tar.gz
tar -zxvf go1.15.2.linux-amd64.tar.gz -C /usr/local/
```

### MacOS

https://studygolang.com/dl/golang/go1.15.2.darwin-amd64.pkg

```shell
cd /usr/local/src/
wget https://studygolang.com/dl/golang/go1.15.2.darwin-amd64.tar.gz
tar -zxvf go1.15.2.darwin-amd64.tar.gz -C /usr/local/
```


## 设置 Goproxy


> 国内加速代理，用于加速下载 github 或 google 上的包

**window设置方法**

1. 临时生效设置方法

```shell
# 启用 Go Modules 功能
$env:GO111MODULE="on"
# 配置 GOPROXY 环境变量
$env:GOPROXY="https://goproxy.io,direct"
```

2. 永久生效设置方法

> 1. `计算机` 图标上鼠标右击 选择 `属性`
> 2. 选择左侧 `高级系统设置`

1. `GO111MODULE="on"`
2. `GOPROXY="https://goproxy.io,direct"`

![image-20200914162609696](http://img.sgfoot.com/b/20200914162610.png?imageslim)

**Linux && macOS**

```shell
vim /etc/profile
# 跳到最后一行并新建一行添加如下命令

# 启用 Go Modules 功能
export GO111MODULE=on
# 设置代理，代理没有数据，则直接拉取
export GOPROXY=https://goproxy.io,direct

source /etc/profile # 使其生效
```

## 设置GO环境变量

### window 环境变量

1. `计算机` 图标上鼠标右击 选择 `属性`
2. 选择左侧 `高级系统设置`
3. 选择底部 `环境变量`

1. 新建 GOROOT 目录 

    选择系统变量（下面那个框）-> 找到 Path -> 编辑 -> 新建

> 安装时的目录，注意 bin 目录

```shell
c:\Go\bin
```

![image-20200914161546609](http://img.sgfoot.com/b/20200914161555.png?imageslim)

2. 新建 GOPATH 目录(可不设置)

   >  D 盘新建"gopath" 目录， gopath目录下再新建三个文件夹："bin", "pkg", "src"

   1. bin 编译后生成的可执行文件
   2. pkg 编译时生成的中间文件
   3. src 存放源代码

   ![image-20200914161824026](http://img.sgfoot.com/b/20200914161825.png?imageslim)

3. 设置 GOPATH 环境变量

   > 需要设置 GOBIN, GOPATH 两个环境变量，见图示

   ![image-20200914162024372](http://img.sgfoot.com/b/20200914162025.png?imageslim)

4. 查看 GO ENV

   >  打开 cmd 或 powershell

    ```shell
    go env
    ```

### Linux, macOS 环境变量

1. 新建 GOPATH 目录 

   ```shell
   mkdir -p ~/gopath/{src,pkg,bin}
   ```
2. 设置环境变量
> 包括 GOROOT,GOPATH,GOBIN 目录一起设置

```shell
vim /etc/profile
# 跳到最后一行(快捷键：shift+g), 新建一行(按o)

# 设置GO安装目录 
export GOROOT=/usr/local/go
# # 设置gopath
export GOPATH=~/gopath
# # 设置gobin
export GOBIN=~/gopath/bin
# # 加入PATH
export PATH=$PATH:$GOROOT/bin:$GOBIN
```

生效设置

```shell
source /etc/profile
```

3. 查看 GO ENV

   > 也可以查看版本: go version

```
go env
```

![image-20200914165712911](http://img.sgfoot.com/b/20200914165713.png?imageslim)