---
title: "Cobra 使用说明"
date: 2025-07-01T17:54:40+08:00
lastmod: 2025-07-01T17:54:40+08:00
draft: false
tags: ["golang", "cli"]
categories: ["golang"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

<!-- TOC -->

- [1. 介绍](#1-%E4%BB%8B%E7%BB%8D)
- [2. 安装](#2-%E5%AE%89%E8%A3%85)
- [3. 初始化项目](#3-%E5%88%9D%E5%A7%8B%E5%8C%96%E9%A1%B9%E7%9B%AE)
- [4. 基础用法示例](#4-%E5%9F%BA%E7%A1%80%E7%94%A8%E6%B3%95%E7%A4%BA%E4%BE%8B)
- [5. 添加子命令](#5-%E6%B7%BB%E5%8A%A0%E5%AD%90%E5%91%BD%E4%BB%A4)
- [6. 使用Flags](#6-%E4%BD%BF%E7%94%A8flags)
- [7. 参数验证](#7-%E5%8F%82%E6%95%B0%E9%AA%8C%E8%AF%81)
- [8. 完整示例](#8-%E5%AE%8C%E6%95%B4%E7%A4%BA%E4%BE%8B)
- [9. 使用示例](#9-%E4%BD%BF%E7%94%A8%E7%A4%BA%E4%BE%8B)
- [10. 总结](#10-%E6%80%BB%E7%BB%93)

<!-- /TOC -->

## 1. 介绍

Cobra 是一个用于创建强大的现代 CLI 应用程序的库。如果你使用 Go，并且正在寻找一个简单而强大的库来创建 CLI 应用程序，那么你可能会对 Cobra 感兴趣。

## 2. 安装

```go
go mod init your-project-name
go get -u github.com/spf13/cobra@latest
```

## 3. 初始化项目

> 使用 Cobra CLI 工具快速创建项目结构

```go
# 安装 cobra-cli
go install github.com/spf13/cobra-cli@latest

# 初始化项目
cobra-cli init
```

## 4. 基础用法示例

创建一个简单的CLI应用：

```go
package main

import (
    "fmt"
    "github.com/spf13/cobra"
    "os"
)

var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "一个简单的CLI应用",
    Long:  `这是一个使用Cobra构建的命令行应用示例。`,
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Println("欢迎使用 myapp!")
    },
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
}
```

## 5. 添加子命令

```go
var versionCmd = &cobra.Command{
    Use:   "version",
    Short: "显示版本信息",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Println("myapp v1.0.0")
    },
}

var configCmd = &cobra.Command{
    Use:   "config",
    Short: "配置管理",
    Long:  `用于管理应用配置的命令`,
}

var setConfigCmd = &cobra.Command{
    Use:   "set [key] [value]",
    Short: "设置配置项",
    Args:  cobra.ExactArgs(2),
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("设置 %s = %s\n", args[0], args[1])
    },
}

func init() {
    rootCmd.AddCommand(versionCmd)
    rootCmd.AddCommand(configCmd)
    configCmd.AddCommand(setConfigCmd)
}

```

## 6. 使用Flags

```go
var (
    verbose bool
    output  string
)

func init() {
    // 全局flags
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "详细输出")
    
    // 本地flags
    rootCmd.Flags().StringVarP(&output, "output", "o", "", "输出文件路径")
    
    // 必需的flag
    configCmd.MarkFlagRequired("config")
}

```

## 7. 参数验证

```go
var exampleCmd = &cobra.Command{
    Use:   "example",
    Short: "参数验证示例",
    Args:  cobra.MinimumNArgs(1), // 至少需要1个参数
    // Args: cobra.ExactArgs(2),    // 恰好需要2个参数
    // Args: cobra.RangeArgs(1, 3), // 需要1-3个参数
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("接收到参数: %v\n", args)
    },
}

```

## 8. 完整示例

```go
package main

import (
    "fmt"
    "github.com/spf13/cobra"
    "os"
)

var (
    verbose bool
    config  string
)

var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "一个功能完整的CLI应用",
    Long:  `使用Cobra构建的命令行应用，展示了commands、arguments和flags的使用。`,
}

var serverCmd = &cobra.Command{
    Use:   "server",
    Short: "启动服务器",
    Run: func(cmd *cobra.Command, args []string) {
        if verbose {
            fmt.Println("启用详细模式")
        }
        fmt.Printf("使用配置文件: %s\n", config)
        fmt.Println("服务器已启动...")
    },
}

func init() {
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "启用详细输出")
    rootCmd.PersistentFlags().StringVar(&config, "config", "", "配置文件路径")
    
    rootCmd.AddCommand(serverCmd)
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
}

```

## 9. 使用示例

> 编译并运行

```sh
go build -o myapp

# 显示帮助
./myapp --help

# 运行服务器命令
./myapp server --verbose --config config.yaml

# 使用短标志
./myapp server -v --config config.yaml
```

## 10. 总结

* 命令结构设计: 保持命令层级简洁，避免过深的嵌套
* 帮助信息: 为每个命令提供清晰的Short和Long描述
* 错误处理: 合理处理命令执行中的错误情况
* 参数验证: 使用Cobra提供的Args验证器确保输入正确
* 代码组织: 将不同的命令分别放在不同的文件中管理