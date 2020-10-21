---
title: "Go 实践教程-gRPC-流实例(八)"
date: 2020-10-21T14:20:48+08:00
lastmod: 2020-10-21T14:20:48+08:00
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

1. 一个完整的gRPC流实例，包括单向流与双向流的操作
2. 如何实现gRPC流服务端代码
3. 如何实现gRPC流客户端代码

## 准备

1. 新建一个文件夹 go-grpc-simple-stream
2. 在go-grpc-simple文件夹下建立三个目录: client, proto,server
3. 使用 `go mod` 管理代码
4. 在 go-grpc-simple-stream 目录下执行 `go mod init go-grpc-simple-stream`

## 编写 proto 文件

> 在 go-grpc-simple-stream/proto 目录下新建 hello.proto 文件

```protobuf
syntax = "proto3";

package hello;

service HelloService {
  //  定义一个服务端推送客户的单向流
  rpc ServerToClient(StreamRequest) returns (stream StreamResponse){};
  //　定义一个客户端推送服务端的单向流
  rpc ClientToServer(stream StreamRequest) returns (StreamResponse){};
  //  定义一个服务端与客户端的双向流
  rpc AllStream(stream StreamRequest) returns (stream StreamResponse){};
}
// stream 请求结构
message StreamRequest {
    string data = 1;
}
// stream 响应结构
message StreamResponse {
    string data = 1;
}
```

## 生成 pb go 代码

> 在 go-grpc-simple-stream/proto 目录下新建  gen.sh 文件
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

执行以上脚本命令会在`go-grpc-simple-stream/proto` 目录下生成 `hello.pb.go` 文件

## 实现服务端代码

> 在 go-grpc-simple-stream/server目录下新建  main.go 文件

```go
package main

import (
	"fmt"
	hello "go-grpc-simple-stream/proto"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
	"os"
	"sync"
	"time"
)
const (
	Addr = "localhost:3721"
)

type HelloServiceImpl struct {
}

// 服务端->客户端 推送单向流
func (h *HelloServiceImpl) ServerToClient(req *hello.StreamRequest, server hello.HelloService_ServerToClientServer) error {
	// 模拟一个向客户端推送10次的单向流
	var i int
	for {
		// 打印接受客户端的消息
		log.Printf("单向流.接受客户端的消息:%s\n", req.GetData())
		// 向客户端发送消息
		err := server.Send(&hello.StreamResponse{Data: fmt.Sprintf("%d 单向流.%s", i, time.Now().Format("15:04:05"))})
		if err != nil {
			break
		}
		i ++
		if i > 3 {
			server.Send(&hello.StreamResponse{Data: "单向流.服务端推送完啦"})
			break
		}
		time.Sleep(time.Second)
	}
	return nil
}
// 客户端->服务端 推送单向流
// 需要循环的接受来自客户端的消息，至到 io.EOF
func (h *HelloServiceImpl) ClientToServer(server hello.HelloService_ClientToServerServer) error {
	for {
		// 接受客户端的消息
		data, err := server.Recv()
		if err != nil {
			// 无数据时跳出循环
			if err == io.EOF {
				break
			}
			return err
		}
		log.Printf("单向流.接受到客户端的消息:%s", data.GetData())
	}
	err := server.SendAndClose(&hello.StreamResponse{
		Data: "单向流.接受客户端消息完毕",
	})
	if err != nil {
		return err
	}
	return nil
}
// 双向流，即可以从服务端不断发送流数据，也可以不断的接受客户端发送过来的流数据。
// 所以需要处理发送与接受，需要采用两个协程处理。
func (h *HelloServiceImpl) AllStream(server hello.HelloService_AllStreamServer) error {
	wg := sync.WaitGroup{}
	wg.Add(2)
	// 处理服务端向客户端发送的流数据
	go func() {
		defer wg.Done()
		i := 0
		for {
			err := server.Send(&hello.StreamResponse{
				Data: fmt.Sprintf("%d,来自双向流的服务端:%s",i, time.Now().Format("2006-01-02 15:04:05")),
			})
			if err != nil {
				break
			}
			i ++
			if i > 3 {
				break
			}
			time.Sleep(time.Second)
		}

	}()
	// 处理客户端向服务端发送过来的流数据。
	go func() {
		for {
			data, err := server.Recv()
			if err != nil {
				if err == io.EOF {
					break
				}
				log.Fatalln(err)
			}
			log.Printf("来自客户端的消息：%s\n", data.GetData())
		}
	}()
	wg.Wait()
	return nil
}

func main() {
	log.SetFlags(log.Lshortfile|log.LstdFlags)
	// 构造一个 gRPC 服务对象
	grpcServer := grpc.NewServer()
	// 然后使用 protoc 工具生成的 go 代码函数(RegisterHelloServiceServer)  注册我们实现的 HelloServiceImpl 服务
	hello.RegisterHelloServiceServer(grpcServer, new(HelloServiceImpl))
	// 通过 grpcServer.Serve 在一个监听端口上提供 gRPC 服务
	lis, err := net.Listen("tcp", Addr)
	if err != nil {
		log.Fatal(err)
	}
	// 打印一下运行时的进程ID和地址
	go func() {
		log.Printf("PID:%d, %s\n", os.Getpid(), Addr)
	}()
	err = grpcServer.Serve(lis)
	if err != nil {
		log.Fatal(err)
	}
}
```

运行 `go run .`

## 实现客户端代码

>在 go-grpc-simple-stream/client 目录下新建  main.go 文件

```go
package main

import (
	"context"
	"fmt"
	hello "go-grpc-simple-stream/proto"
	"google.golang.org/grpc"
	"io"
	"log"
	"sync"
	"time"
)

const (
	Addr = "localhost:3721"
)

func main() {
	log.SetFlags(log.Lshortfile|log.LstdFlags)
	conn, err := grpc.Dial(Addr, grpc.WithInsecure())
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	client := hello.NewHelloServiceClient(conn)
	// 获取服务端向客户端不断推送的数据流。
	GetServerStream(client)
	// 客户端不断的向服务器推送单向流
	PutServerStream(client)
	// 双向流
	AllStream(client)
}
// 双向流
func AllStream(client hello.HelloServiceClient) {
	all, err := client.AllStream(context.Background())
	if err != nil {
		log.Fatalln(err)
	}
	wg := sync.WaitGroup{}
	wg.Add(2)
	// 处理服务端->客户端的流
	go func() {
		defer wg.Done()
		for {
			resp, err := all.Recv()
			if err != nil {
				if err == io.EOF {
					break
				}
				log.Fatalln(err)
			}
			log.Printf("双向流，接受到服务的数据:%s\n", resp.GetData())
		}
	}()
	// 处理 客户端->服务端的流
	go func() {
		defer wg.Done()
		i := 0
		for {
			err = all.Send(&hello.StreamRequest{
				Data: fmt.Sprintf("%d,%s", i, time.Now().Format("15:04:05")),
			})
			if err != nil {
				log.Println(err)
				break
			}
			i ++
			if i > 3 {
				break
			}
			time.Sleep(time.Second)
		}
	}()
	wg.Wait()
}
// 客户端不断的向服务器推送单向流
func PutServerStream(client hello.HelloServiceClient) {
	i := 0
	// 向服务端推送流
	put, err := client.ClientToServer(context.Background())
	if err != nil {
		log.Fatalln(err)
	}
	for {
		err = put.Send(&hello.StreamRequest{
			Data: fmt.Sprintf("%d,%s", i, time.Now().Format("15:04:05")),
		})
		if err != nil {
			break
		}
		i ++
		if i > 3 {
			break
		}
		time.Sleep(time.Second)
	}
	// 接受
	resp, err := put.CloseAndRecv()
	if err != nil {
		if err != io.EOF {
			log.Fatalln(err)
		}
	}
	// 接受服务端响应的数据
	if resp != nil {
		log.Println(resp.GetData()) // 接受完毕
	}

}
// 获取服务端向客户端不断推送的数据流。
func GetServerStream(client hello.HelloServiceClient) {
	// 向服务器发一个数据标识
	req := hello.StreamRequest{Data: "客户端"}
	// 调用 ServerToClient 函数，准备接受服务端单向流
	resp, err := client.ServerToClient(context.Background(), &req)
	if err != nil {
		log.Fatalln(err)
	}
	for {
		data, err := resp.Recv()
		if err != nil {
			// 遇到 io.EOF 表示服务端流关闭
			if err == io.EOF {
				break
			}
			log.Println(err)
			break
		}
		log.Printf("服务端推送的单向流:%s\n", data)
	}
}
```

执行 `go run .`

## go mod 管理代码

> 在 go-grpc-simple 目录下

```shell
go mod tidy
```



## 源码

[github.com/go-grpc-simple-stream](https://github.com/yezihack/grpc/tree/master/go-grpc-simple-stream)



## 推荐学习

2. [gRPC入门 简介](https://www.sgfoot.com/tutorial-grpc-base.html)
2. [gRPC入门 Protobuf](https://www.sgfoot.com/tutorial-grpc-protobuf.html)
3. [gRPC入门 搭建完整gRPC](https://www.sgfoot.com/tutorial-grpc-simple.html)
4. [gRPC入门 实现双向流](https://www.sgfoot.com/tutorial-grpc-stream-simple.html)