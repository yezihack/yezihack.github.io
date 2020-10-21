---
title: "Go 实践教程-gRPC-简单实例(七)"
date: 2020-10-21T14:20:39+08:00
lastmod: 2020-10-21T14:20:39+08:00
draft: false
tags: ["Go实践教程", "golang", "教程", "grpc入门"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---





**你将会学到**

1. 一个完整的gRPC实例
2. 如何实现gRPC服务端代码
3. 如何实现gRPC客户端代码

## 准备

1. 新建一个文件夹 go-grpc-simple
2. 在go-grpc-simple文件夹下建立三个目录: client, proto,server
3. 使用 `go mod` 管理代码
4. 在 go-grpc-simple 目录下执行 `go mod init grpc-simple`

## 编写一个 proto 文件

> 在 go-grpc-simple/proto 目录下新建 hello.proto 文件

```protobuf
// 选择 proto3 语法
syntax = "proto3"; 

// 定义一个包名
package hello;

// 定义一个 service 服务，相当于 GO 接口定义
service HelloService {
    // 以 rpc 开头，定义未实现的方法名称。 必须要有一个请求 message 和响应 message
    // rpc, returns 都是关键字
    rpc Hello(StringRequest) returns (StringResponse){}; 
}

// message 相当于一个结构体，里面定义字段属性， 先类型后变量名，然后序列号。
// protoful 编码是通过成员的唯一编号来绑定对应的数据。

// 定义一个请求结构体
message StringRequest {
    string value = 1;
} 
// 定义一个响应结构体
message StringResponse {
    string result = 1;
}
```

## 生成 pb golang 代码

> 在 go-grpc-simple/proto 目录下新建  gen.sh 文件
>
> 如何是 window 系统，则直接在将 protoc 命名复制在 cmd 下执行即可。

```shell
#!/usr/bin/env bash
set -x

# 第一步： 安装 protoc 插件
# 打开下面URL， 跟据自己的系统选择对应的 protoc-3.x.x-linux|osx|win
# https://github.com/protocolbuffers/protobuf/releases
# 下载完后，加入到环境变量或path中, 保证全局可用。
# 验证: protoc --version

# 第二步：引用 proto, protoc-gen-go, grpc 共3个工具包
# 安装 golang 的proto工具包
# go get -u github.com/golang/protobuf/proto
# 安装 goalng 的proto编译支持
# go get -u github.com/golang/protobuf/protoc-gen-go
# 安装 GRPC 包
# go get -u google.golang.org/grpc

protoc --go_out=plugins=grpc:. *.proto
```

执行以上脚本命令会在`go-grpc-simple/proto` 目录下生成 `hello.pb.go` 文件

## 实现服务端代码

> 在 go-grpc-simple/server目录下新建  main.go 文件

```go
package main

import (
	"context"
	"google.golang.org/grpc"
	hello "grpc-simple/proto"
	"log"
	"net"
)

type HelloServiceImpl struct {
}
func (p *HelloServiceImpl) Hello(ctx context.Context, req *hello.StringRequest)(
	resp *hello.StringResponse, err error) {
	resp = new(hello.StringResponse)
	resp.Result = "hello grpc client."
	log.Println("req", req.GetValue())
	return resp, nil
}
func main() {
	// 构造一个 gRPC 服务对象
	grpcServer := grpc.NewServer()
	// 然后使用 protoc 工具生成的 go 代码函数(RegisterHelloServiceServer)  注册我们实现的 HelloServiceImpl 服务
	hello.RegisterHelloServiceServer(grpcServer, new(HelloServiceImpl))
	// 通过 grpcServer.Serve 在一个监听端口上提供 gRPC 服务
	lst, err := net.Listen("tcp", ":3721")
	if err != nil {
		log.Fatalln(err)
	}
    go func() {
		fmt.Printf("服务端的gRPC进程服务 %d %s", os.Getpid(), Addr)
	}()
	log.Fatal(grpcServer.Serve(lst))
}
```

运行 `go run .`

## 实现客户端代码

>在 go-grpc-simple/client 目录下新建  main.go 文件

```go
package main

import (
	"context"
	"google.golang.org/grpc"
	hello "grpc-simple/proto"
	"log"
)

func main() {
	// 1. grpc.Dial 负责和 gRPC 服务建立链接
	conn, err := grpc.Dial("localhost:3721", grpc.WithInsecure())
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	// 2. 使用NewHelloServiceClient() 函数基于链接构建 helloServiceClient 对象。
	// 然后就可以调用 helloServiceClient{} 结构体定义的方法啦，如 Hello 方法
	client := hello.NewHelloServiceClient(conn)
	resp, err := client.Hello(context.Background(), &hello.StringRequest{
		Value: "hello grpc server",
	})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("grpc client result:%v\n", resp.GetResult())
}
```

执行 `go run .`

## go mod 管理代码

> 在 go-grpc-simple 目录下

```shell
go mod tidy
```





