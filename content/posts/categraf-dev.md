---
title: "Categraf 采集器开发"
date: 2024-07-25T13:24:37+08:00
lastmod: 2024-07-25T13:24:37+08:00
draft: false
tags: ["prometheus", "categraf"]
categories: ["prometheus"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 目录

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [1. 目录](#1-目录)
- [2. Categraf 介绍](#2-categraf-介绍)
- [3. 小试牛刀](#3-小试牛刀)
  - [3.1. Categraf 下载源码](#31-categraf-下载源码)
  - [3.2. 配置 golang 环境](#32-配置-golang-环境)
  - [3.3. Categraf 编译](#33-categraf-编译)
  - [3.4. 运行 categraf](#34-运行-categraf)
- [4. 二次开发](#4-二次开发)
  - [4.1. 目录说明](#41-目录说明)
  - [4.2. 插件开发](#42-插件开发)
    - [4.2.1. 配置文件](#421-配置文件)
    - [4.2.2. 代码逻辑](#422-代码逻辑)
    - [4.2.3. 注册 插件](#423-注册-插件)
    - [4.2.4. 编译源码](#424-编译源码)
- [5. 推送至 prometheus](#5-推送至-prometheus)
  - [5.1. 安装 prometheus](#51-安装-prometheus)
  - [5.2. prometheus 配置 systemd](#52-prometheus-配置-systemd)
  - [5.3. 启动 prometheus](#53-启动-prometheus)
  - [5.4. categraf 配置 prometheus](#54-categraf-配置-prometheus)
  - [5.5. prometheus 查看 categraf 上报的数据](#55-prometheus-查看-categraf-上报的数据)
- [6. 参考](#6-参考)

<!-- /TOC -->
## 2. Categraf 介绍

Categraf 是一个开源的监控采集 Agent，类似 Telegraf、Grafana-Agent、Datadog-Agent，希望对所有常见监控对象提供高质量的监控数据采集能力，采用了 All-in-one 的设计理念，可以同时支持指标、日志、链路追踪数据的采集

## 3. 小试牛刀

### 3.1. Categraf 下载源码

- <https://github.com/flashcatcloud/categraf>

```sh
cd /opt/src

wget https://github.com/flashcatcloud/categraf.git

cd categraf
```

### 3.2. 配置 golang 环境

```sh
cd /opt/src 

wget https://studygolang.com/dl/golang/go1.22.5.linux-amd64.tar.gz

tar -zxvf go1.22.5.linux-amd64.tar.gz -C /usr/local/

```

```sh
cat > /etc/profile.d/go.sh <<EOF

export GOROOT=/usr/local/go

export GOPATH=/opt/gopath

export GOBIN=\$GOROOT/bin

export PATH=\$PATH:\$GOBIN

export GO111MODULE=on

export GOPROXY=https://goproxy.cn,direct
EOF

source /etc/profile

go env
```

### 3.3. Categraf 编译

```sh
cd /opt/src/categraf
make
```

### 3.4. 运行 categraf

```sh
./categraf -debug
```

## 4. 二次开发

### 4.1. 目录说明

> 需要关注的目录

- `conf`：配置目录，命名规则，以 input. 开头，如 input.cpu 表示 cpu 的配置
- `inputs`：代码逻辑文件夹，命名规则与 conf 同名，如 input.cpu 对应的代码文件为 inputs/cpu/cpu.go
- `agent/metrics_agent.go`：注册入口， 在 import 中注册插件路径，如：`_ "flashcat.cloud/categraf/inputs/cpu"`

### 4.2. 插件开发

- 插件开发需要遵循 Categraf 的插件规范，包括插件的配置文件、数据采集逻辑等

以 linux-exec 为 例，开发一个简单的插件，实现 linux 命令执行

#### 4.2.1. 配置文件

```sh
mkdir -p conf/linux-exec

touch conf/linux-exec/linux-exec.toml
```

```toml
# # collect interval
interval = 15

# 获取 linux 内核版本
[[instances]]
labels = { query_type="system" }
field="hostname"
query_command="hostname"
```

#### 4.2.2. 代码逻辑

```sh
touch inputs/linux-exec/linux-exec.go
```

```golang
package linux-exec


import (
  "log"
  "os/exec"

  "flashcat.cloud/categraf/config"
  "flashcat.cloud/categraf/inputs"
  "flashcat.cloud/categraf/types"
)

//  插件名称，与配置文件中的 input. 开头一致
const inputName = "linux-exec"

// 定义结构体，用于解析配置文件
type LinuxExec struct {
  config.PluginConfig
  Instances []*Instance `toml:"instances"`
}

func init() {
  inputs.Add(inputName, func() inputs.Input {
    return &LinuxExec{}
  })
}

func (pt *LinuxExec) Clone() inputs.Input {
  return &LinuxExec{}
}

func (pt *LinuxExec) Name() string {
  return inputName
}

func (pt *LinuxExec) GetInstances() []inputs.Instance {
  ret := make([]inputs.Instance, len(pt.Instances))
  for i := 0; i < len(pt.Instances); i++ {
    ret[i] = pt.Instances[i]
  }
  return ret
}

type Instance struct {
  config.InstanceConfig

  Field        string `toml:"field"`
  QueryCommand string `toml:"query_command"`
}

// 逻辑处理
func (ins *Instance) Gather(slist *types.SampleList) {
  if ins.Field == "" {
    log.Println("E!", "missing field for linux_exec_query")
    return
  }
  if ins.QueryCommand == "" {
    log.Println("E!", "missing query_command for linux_exec")
    return
  }
  result, err := exec.Command("sh", "-c", ins.QueryCommand).Output()
  if err != nil {
    log.Println("E!", "failed to run query_command for linux_exec:", err)
    return
  }
  // 生成 metrics 查询名称，即 inputName+ins.Field, 如 linux_exec_hostname
  fields := map[string]interface{}{
    ins.Field: 1,
  }
  // 制作 tags
  tags := map[string]string{
    "name":    ins.Field,
    "linux_exec": string(result),
  }
  // 将数据推入 slist
  slist.PushSamples(inputName, fields, tags)
}
```

#### 4.2.3. 注册 插件

```sh
vim agent/metrics_agent.go
```

```golang
import (
  // ...
  _ "flashcat.cloud/categraf/inputs/linux-exec"
  // ...
)
```

#### 4.2.4. 编译源码

```sh
# 会生成一个 categraf 二进制文件 
make

# 测试 
-> # ./categraf -debug -test -inputs linux-exec                          
2024/07/25 10:49:59 I! tracing disabled
2024/07/25 10:49:59 main.go:128: I! runner.binarydir: /opt/src/categraf
2024/07/25 10:49:59 main.go:129: I! runner.hostname: sgfoot
2024/07/25 10:49:59 main.go:130: I! runner.fd_limits: (soft=4096, hard=4096)
2024/07/25 10:49:59 main.go:131: I! runner.vm_limits: (soft=unlimited, hard=unlimited)
2024/07/25 10:49:59 provider_manager.go:61: I! use input provider: [local]
2024/07/25 10:49:59 traces_agent.go:19: I! traces agent disabled!
2024/07/25 10:49:59 prometheus_agent.go:19: I! prometheus scraping disabled!
2024/07/25 10:49:59 ibex_agent.go:19: I! ibex agent disabled!
2024/07/25 10:49:59 agent.go:39: I! agent starting
2024/07/25 10:49:59 metrics_agent.go:272: I! input: local.linux-exec started
2024/07/25 10:49:59 agent.go:47: I! [*agent.MetricsAgent] started
2024/07/25 10:49:59 agent.go:50: I! agent started
2024/07/25 10:49:59 metrics_reader.go:54: D! local.linux-exec : before gather once
10:49:59 linux_exec_hostname agent_hostname=sgfoot name=hostname query_type=system linux_exec=sgfoot
 1

# 打包 categraf
tar -zcvf categraf-0.1.0-dev.tar.gz categraf conf
```

## 5. 推送至 prometheus

### 5.1. 安装 prometheus

- <https://prometheus.io/download/>

```sh
cd /opt/src
wget https://github.com/prometheus/prometheus/releases/download/v2.45.6/prometheus-2.45.6.linux-amd64.tar.gz

tar -zxvf prometheus-2.53.1.linux-amd64.tar.gz -C /opt

mv /opt/prometheus-2.53.1.linux-amd64 /opt/prometheus

cd /opt/prometheus && ls -l

drwxr-xr-x.  2 1001 docker   38 Jul 10 18:31 console_libraries
drwxr-xr-x.  2 1001 docker  173 Jul 10 18:31 consoles
drwxr-xr-x. 14 root root   4.0K Jul 25 11:18 data
-rw-r--r--.  1 1001 docker  12K Jul 10 18:31 LICENSE
-rw-r--r--.  1 1001 docker 3.7K Jul 10 18:31 NOTICE
-rwxr-xr-x.  1 1001 docker 132M Jul 10 18:18 prometheus
-rw-r--r--.  1 1001 docker  934 Jul 10 18:31 prometheus.yml
-rwxr-xr-x.  1 1001 docker 124M Jul 10 18:18 promtool
```

### 5.2. prometheus 配置 systemd

```sh
cat > /etc/systemd/system/prometheus.service < EOF
[Unit]
Description="prometheus"
Documentation=https://prometheus.io/
After=network.target

[Service]
Type=simple

ExecStart=/opt/prometheus/prometheus  --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/opt/prometheus/data --web.enable-lifecycle --enable-feature=remote-write-receiver --query.lookback-delta=2m 

Restart=on-failure
SuccessExitStatus=0
LimitNOFILE=65536
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=prometheus


[Install]
WantedBy=multi-user.target
EOF
```

### 5.3. 启动 prometheus

```sh
systemctl daemon-reload
systemctl start prometheus
systemctl enable prometheus
```

### 5.4. categraf 配置 prometheus

```sh
tar -zxvf categraf-0.1.0-dev.tar.gz
vim conf/config.toml

```

```toml
[[writers]]
# url = "http://127.0.0.1:17000/prometheus/v1/write"
url = "http://127.0.0.1:9090/api/v1/write" # 这是 prometheus 的 write API 地址
```

### 5.5. prometheus 查看 categraf 上报的数据

- <http://127.0.0.1:9090/graph>

```sh
linux_exec_hostname
linux_exec_hostname{agent_hostname="192.168.1.100", name="hostname", query_type="system", linux_exec="sgfoot"}

```

## 6. 参考

- <https://flashcat.cloud/docs/content/flashcat-monitor/categraf/1-introduction/>
- <https://github.com/flashcatcloud/categraf>
- <https://juejin.cn/post/7236591682630959162>
