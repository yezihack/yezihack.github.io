---
title: "Go 实践教程-gRPC-Protobuf(六)"
date: 2020-10-21T14:20:32+08:00
lastmod: 2020-10-21T14:20:32+08:00
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



> Protobuf 是 Protobuf Buffers 的简称，它是 Google 公司开发的一种数据描述语言，并于2008年开源。
>
> 可用作为设计安全的跨语言 RPC 接口的基础工具。
>
> 目前 Protobuf 已经发展到第3版本，即 `syntax = "proto3"; `



**你将会学到**

1. 如何编写 protobuf 文件
2. 如何通过`protoc`工具生成 go 代码



## 编写 protobuf 文件

1. 先定义语法版本
2. 再定义`package`
3. 定义一个 `service`
4. 定义一组 `request`，`response` 的 `message`



创建 `hello.proto` 文件

1. 第一行结尾需要写上分号`;`
2. `service` 相当于定义接口， `rpc` 定义未实现的接口方法
3. `message` 相当于定义一个结构体，里面定义字段属性， 先类型后变量名，然后序列号。
   1. 每一行数据类型后需要写一个编号，从1开始，因为编码是通过成员的唯一编号来绑定对应的数据。
   2. 推荐使用请求`message`后加上`Request`关键字,  如`StringRequest`
   3. 推荐使用响应`message`后加上`Response`关键字，如`StringResponse`

```protobuf
// 选择 proto3 语法
syntax = "proto3"; 

// 定义一个包名为 hello
package hello;

// 定义一个 service 服务名为 HelloService，相当于 GO 接口定义
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



### 标量类型

> 以下只列出常用的类型对应关系。更多参考最下面的链接

| .proto Type | Go Type |
| ----------- | ------- |
| double      | float64 |
| float       | float32 |
| int32       | int32   |
| int64       | int64   |
| uint32      | uint32  |
| uint64      | uint64  |
| bool        | bool    |
| string      | string  |
| bytes       | []byte  |

### 枚举
1. 使用 `enum` 关键字
2. 编号从0开始

```protobuf
// 枚举，编号从0开始。
enum ResultType {
    Success = 0;
    Failed = 1;
}
// 在 message 里使用枚举
// 定义一个响应结构体
message StringResponse {
    string result = 1;
    ResultType result_type = 2;
}
```

### 嵌套

> 一般用于多条数据传递或分页数据等操作。

1. 使用`repeated` 关键字

```protobuf
message UserItem {
    int64 id = 1;
    string user_name = 2;
    int32 age = 3;
    string passwd = 4;
}

message UserListResponse {
    string tag = 1;
    repeated UserItem user_list = 2;
}
```



## protoc 插件安装

> protoc 工具可将 protobuf 文件生成 golang 代码

下载 `protoc` 工具，选择对应的操作系统版本

https://github.com/protocolbuffers/protobuf/releases 

![image-20201021162116165](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20201021162117.png?imageslim)

下载完后，加入到环境变量或path中, 保证全局可用。
验证: `protoc --version`

### 安装依赖包

```shell
# 安装 golang 的proto工具包
go get -u github.com/golang/protobuf/proto
# 安装 goalng 的proto编译支持
go get -u github.com/golang/protobuf/protoc-gen-go
# 安装 GRPC 包
go get -u google.golang.org/grpc
```

## 生成 go 代码

1. `hello.proto` 文件的当前目录下
2. `--go_out` 表示加载插件`grpc`
3. 对`hello.proto` 文件进行编译加载，生成 `hello.pb.go`文件

```shell
protoc --go_out=plugins=grpc:. hello.proto
```

也可以制作shell脚本

1. `gen.sh` 脚本名称

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

## 参考

[Protobuf语言指南](https://juejin.im/post/6844903942170624008)

[Protobuf生成Go代码指南](https://juejin.im/post/6844903944511029262)

[gRPC 官方文档中文版](http://doc.oschina.net/grpc)



## 推荐学习

3. [gRPC入门 简介](https://yezihack.github.io/tutorial-grpc-base.html)
2. [gRPC入门 Protobuf](https://yezihack.github.io/tutorial-grpc-protobuf.html)
3. [gRPC入门 搭建完整gRPC](https://yezihack.github.io/tutorial-grpc-simple.html)
4. [gRPC入门 实现双向流](https://yezihack.github.io/tutorial-grpc-stream-simple.html)