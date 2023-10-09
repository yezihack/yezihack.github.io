---
title: "Go Mod 引用私有仓库"
date: 2020-10-30T16:01:25+08:00
lastmod: 2020-10-30T16:01:25+08:00
draft: false
tags: ["go", "golang", "error"]
categories: ["golang"]
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

> 在做 go 开发, 如果是使用 go1.11 版本, 相信大家都会使用到 go mod 做为依赖管理, 因为 go mod 可以设置代理,国外的包,轻松下载. 但是在某一天你使用公司自建的 gitlab ,需要引用 gitlab 上面的依赖包,就需要做一些设置才会正常 `go mod tidy`,否则会出现无法引用的问题. 本文介绍一下如何操作.

> 适用于 window, linux 环境, 本人没 macOSX

**你将学到:**

1. 如何设置 go mod 代理
2. 如何设置 go env GOPRIVATE 变量
3. 如何在代码里引用自建的 gitlab 依赖代码



## 设置 go mod 代理

linux, window 设置

```
go env -w GO111MODULE=on
go env -w GOPROXY=https://goproxy.io,direct
```



## 实践

> 假定私有 gitlab 仓库地址为: `http://mygit.sgfoot.com/`  (注意只支持http, 不支持https)

### 创建一个 gitlab 依赖代码

1. 仓库地址HTTP: `http://mygit.sgfoot.com/common.git`
2. 仓库地址SSH: `git@mygit.sgfoot.com/common.git`
3.  git 下载

```sh
# 先进入 $GOPATH/src 目录
cd $GOPATH/src 
git clone git@mygit.sgfoot.com/helloworld.git mygit.sgfoot.com/common
```

4. 创建 util.go 文件

   > 必须在这个目录下创建文件 $GOPATH/src/mygit.sgfoot.com/common

   ```go
   package common
   
   import "time"
   
   func Today() string {
   	return time.Now().Format("2006-01-02 15:04:05")
   }
   
   ```

5. 使用 `go mod init `

   > 如果没有外部依赖可以不使用 go mod 也是可以的.

   ```sh
   # 直接回车
   go mod init 
   ```

   会在项目的根目录下生成 go.mod 文件, 第一行必须是你的网站域名+你的项目路径. 也就是可以在浏览器里找到这个项目. 否则后续无法使用`go mod tidy`命令.

   go.mod 文件内容

   ```shell
   module mygit.sgfoot.com/common
   ```

6. 使用 `go mod tidy`

   ```sh
   module mygit.sgfoot.com/common
   go 1.15
   ```

7. 使用 git tag 

   > 为什么使用 tag, 方便其它项目引用不同版本号.

   ```
   git add . && git commit -m "new hello" && git push -u origin master
   git tag v1.0.0 && git push --tag
   ```

8. git tag 扩展学习

   https://yezihack.github.io/git-tag.html

### 创建一个工程项目

> 引用上面的 `mygit.sgfoot.com/common` 里的方法

1. 创建 helloworld 项目
1. 仓库地址HTTP: `http://mygit.sgfoot.com/helloworld.git`
2. 仓库地址SSH: `git@mygit.sgfoot.com/helloworld.git`
3.  git 下载(可以是任意目录下)

```sh
git clone git@mygit.sgfoot.com/helloworld.git
```

5. 创建 main.go 

   ```go
   package main
   
   import (
   	"github.com/gin-gonic/gin"
   	"mygit.sgfoot.com/common"
   )
   
   func main() {
   	r := gin.Default()
   	r.GET("/", func(c *gin.Context) {
   		c.JSON(200, gin.H{
   			"msg":"hello world",
   			"today": common.Today(),
   		})
   	})
   	r.Run(":8000")
   }
   ```

6. 使用 `go mod init `

   > 这里可以自定义 mod name

   ```sh
   # 直接回车
   go mod init helloworld
   ```

   go.mod 文件内容

   ```shell
   module helloworld
   ```

7. 设置 go env GOPRIVATE 

   > 设置 gitlab 不走代理

   ```sh
   go env -w GOPRIVATE=mygit.sgfoot.com
   ```

   > go get 不走 https
   >
   > 注意使用版本号.

   ```sh
   go get -v -insecure mygit.sgfoot.com/common@v1.0.0
   ```

   

8. 使用 `go mod tidy`

   ```sh
   module helloworld
   go 1.15
   
   require (
   	github.com/gin-gonic/gin v1.6.3
   	mygit.sgfoot.com/common v1.0.0
   )
   ```

## 简约总结

### 1. 设置 GOPRIVATE 

```sh
go env -w GOPRIVATE=mygit.sgfoot.com

或 设置环境变量
export GOPRIVATE=mygit.sgfoot.com
```

### 2. 使用`-insecure`

> 忽略 https

```sh
go get -v -insecure mygit.sgfoot.com/common
```

### 3. 保存 git 输入的帐号和密码

```shell
git config --global credential.helper store
```

