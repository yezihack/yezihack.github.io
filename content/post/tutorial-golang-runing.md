---
title: "Go 实践教程-工具及运行(三)"
date: 2020-09-16T16:45:10+08:00
lastmod: 2020-09-16T16:45:10+08:00
draft: false
tags: ["Go实践教程", "golang", "教程"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 经过前面二篇 [Go 简介](https://www.sgfoot.com/tutorial-golang-info.html),[Go 环境配置](https://www.sgfoot.com/tutorial-golang-install.html) 学习，大家对 Golang 有个大概的了解了， 环境也配置好了，就差上手写代码啦，今天主要介绍 Golang 的开发工具与工具链，如何写出第一个 "Hello World"



## Goland 开发工具

> 编写 Golang ，首选 Goland 开发工具，当然 Goland 是收费的(可试用30天)。国内也有破解教程。自行 Google，在此也会介绍一种快捷的方式 

1. 下载 Goland

   https://www.jetbrains.com/go/

2. 安装

   官方提供：Window, Mac, Linux 三个平台的安装包。

   安装过程下一步，下一步即可，在此不赘述。

3. 激活

   > 可能会遇到用一段时间就失效啦，你只需要再次来到这个网站下载激活码，重新激活一次即可。

   http://idea.medeming.com/jetbrains/

   ![image-20200916170208682](http://img.sgfoot.com/b/20200916170209.png?imageslim)

4. 设置 Go Modules 

   	File -> Settings -> Go -> Go Modules 
      	
      	![image-20200916200143415](http://img.sgfoot.com/b/20200916200144.png?imageslim)
      	
      	将 `GOPROXY=https://goproxy.cn,direct`  填写到 Environment 处。
      	
      	用于 Go GET 加速下载依赖包。![image-20200916170456456](http://img.sgfoot.com/b/20200916170457.png?imageslim)



## 第一个 Go 程序

1. 新建项目 

   File -> New -> Project

   ![image-20200916170725101](http://img.sgfoot.com/b/20200916170731.png?imageslim)

2. 新建 Go 文件

   右击 awesomeProject -> New -> Go -> 选择"Simple Application"

3. 写个"Hello World"

   ```go
   package main
   
   import "fmt"
   
   func main() {
   	fmt.Println("Hello World")
   }
   ```

   ![image-20200916171144649](http://img.sgfoot.com/b/20200916171146.png?imageslim)

4. 解释代码

   1. `package` 就是包的意思，在golang语言里相当于其它语言的命名空间，一个复杂的项目是由不同包管理的，调用其它项目也需要用到包。包是函数与数据的集合。
   2. `import` 是引用包的意思，需要调用其它函数或数据就需要使用 import 来操作，如"fmt" 就是一个 `package fmt`
   3. `main` 是整个程序的唯一入口，如同 C 语言一样

   ```go
   package main // 包名，main 是一个特殊的包，在 golang 里跟 C 一样，只有一个入口，即 main
   
   import "fmt" // import 是导入某个包的意思
   
   func main() { // main 为主入口
   	fmt.Println("Hello World") // fmt.Println 是输出的意思。里面还有很多方法，fmt主要是操作输入输出的。
   }
   ```

## Go 工具链

> go 的工具链非常丰富强大，比如：交叉编译，性能分析，单元测试，压力测试及文档自动生成等等。
>
> 本篇只介绍常用的几个，想要进一步了解，移步：[Go 命令教程-郝林](http://wiki.jikexueyuan.com/project/go-command-tutorial/)

### go mod

> 自 Go 1.11 版本来，官方提供 go mod 管理项目，不局限于 GOPATH 目录下创建项目啦，对于早先的 Go 程序员来说，是一种解脱。也就是说现在创建 Go 项目可以任意目录，只需要使用 Go Mod 管理即可。

1. 初使 init

   需要在项目的根目录下使用 `go mod init` 或者 `go mod init <mod_name>`

   `go mod init` 必须在 GOPATH 下才能使用

   `go mod init <mod_name>` 可以在任意目录下使用.推荐使用

2. 整理 tidy

   将未引用的依赖包删除，已使用但未加载的依赖包 ，则自动下载并引用

3. 实践

   将上面的代码进行进一步改写如下：

   > 以下代码有标红，查看图片，因为没有引用`github.com/satori/go.uuid`依赖包

   ```
   // 包名，main 是一个特殊的包，在 golang 里跟 C 一样，只有一个入口，即 main
   package main
   
   import (
   	"fmt" // import 是导入某个包的意思
   	"github.com/satori/go.uuid"
   )
   
   func main() { // main 为主入口
   	// fmt.Println 是输出的意思。里面还有很多方法，fmt主要是操作输入输出的。
   	fmt.Println("Hello World")
   	fmt.Println(uuid.NewV4().String())
   }
   ```

   ![image-20200916174849623](http://img.sgfoot.com/b/20200916174850.png?imageslim)

   打开命令行：右击项目名称->Open In Terminal

   ![image-20200916180206273](http://img.sgfoot.com/b/20200916180207.png?imageslim)

   初使 mod

   ```shell
   go mod init first_go
   ```

   tidy 整理包

   > 会自动从远程下载未引用的依赖包，红色的代码会自动消除

   ```shell
   go mod tidy
   ```

   ![image-20200916180900411](http://img.sgfoot.com/b/20200916180901.png?imageslim)

### go run 

> 继续上面的代码逻辑，让代码在命令行中运行。
>
> 必须在 Terminal 下运行， 不会在当前目录产生任何文件，只输入程序的结果。
>
> `go run`命令实现编译文件到运行的全过程，可以使用 `go run -x .` 输入整个过程的详细

```shell
# 项目的根目录下运行命令
# .点代表当前整个项目的意思
\awesomeProject> go run .
```

### go build

> 将源码文件编译后的结果生成一个二进制的可执行的文件

1. `go build .` 会采用 go mod 里的名称命名文件
2. `go build -o custom_name .` 自定义生成文件名称`custom_name`

### go get

> 获取远程包，实现自动下载，并对它们是行编译和安装。如果配置 GOPROXY 会加速下载。
>
> 注意：不要加http/https

1. `go get github.com/satori/go.uuid`  常用方式下载远程包
2. `go get -v -x github.com/satori/go.uuid` 可以查看到下载过程和编译及安装的详细过程 

