---
title: "监控 Prometheus入门(一)"
date: 2020-06-05T10:59:18+08:00
lastmod: 2020-08-31T10:59:18+08:00
draft: false
tags: ["prometheus", "grafana", "监控"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
#weight: 1
#description: ""
---

> 基于 CentOS 7 amd64 系统

## Prometheus 
1. 多维数据模型（有metric名称和键值对确定的时间序列）
1. 灵活的查询语言
1. 不依赖分布式存储
1. 通过pull方式采集时间序列，通过http协议传输
1. 支持通过中介网关的push时间序列的方式
1. 监控数据通过服务或者静态配置来发现
1. 支持图表和dashboard等多种方式
1. 组件：
   - Prometheus 主程序，主要是负责存储、抓取、聚合、查询方面。
   - Alertmanager 程序，主要是负责实现报警功能。
   - Pushgateway 程序，主要是实现接收由Client push过来的指标数据，在指定的时间间隔，由主程序来抓取。
   - node_exporter 这类是不同系统已经实现了的集成。

### 架构图

![img](https://img-blog.csdnimg.cn/20181228233707328)

工作流程

- Prometheus 服务器定期从配置好的 jobs 或者 exporters 中获取度量数据；或者接收来自推送网关发送过来的 度量数据。
- Prometheus 服务器在本地存储收集到的度量数据，并对这些数据进行聚合；
- 运行已定义好的 alert.rules，记录新的时间序列或者向告警管理器推送警报。
- 告警管理器根据配置文件，对接收到的警报进行处理，并通过email等途径发出告警。
- Grafana等图形工具获取到监控数据，并以图形化的方式进行展示。

### 安装

> prometheus提供二进制,直接解压即可用.由 go 编写

[官网下载](https://prometheus.io/download/)

Centos 64x 选择下载 `*linux-amd64.tar.gz`

```shell
wget -c https://github.com/prometheus/prometheus/releases/download/v2.18.1/prometheus-2.18.1.darwin-amd64.tar.gz
tar -xvf prometheus-2.18.1.darwin-amd64.tar.gz -C /usr/local/
```

### 运行

创建 systemd 服务

```shell
cat > /usr/lib/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Documentation=https://prometheus.io/
After=network.target
 
[Service]
Type=simple
ExecStart=/usr/local/prometheus/prometheus --config.file=/usr/local/prometheus/prometheus.yml --storage.tsdb.path=/usr/local/prometheus/data
Restart=on-failure
RestartSec=42s
 
[Install]
WantedBy=multi-user.target
EOF
```

刷新 systemd && 运行 && 查看

```
systemctl daemon-reload # 刷新 systemd 配置
systemctl enable prometheus # 加入开机启动
systemctl start prometheus # 启动服务 
systemctl status prometheus # 查看详情
```

### 预览

http://localhost:9090

![image-20200831170056207](http://img.sgfoot.com/b/20200831170057.png?imageslim)

自带也会产生监控数据

http://192.168.61.66:9090/metrics 

## node_exporter 安装

> 监控远程 linux 服务器CPU、内存、磁盘、I/O等信息

https://prometheus.io/download/

![image-20200831161413148](http://img.sgfoot.com/b/20200831161414.png?imageslim)

```
cd /usr/local/src
wget https://github.com/prometheus/node_exporter/releases/download/v1.0.1/node_exporter-1.0.1.linux-amd64.tar.gz
tar -zxvf node_exporter-1.0.1.linux-amd64.tar.gz -C /usr/local/
cd /usr/local/
mv node_exporter-1.0.1.linux-amd64 node_exporter
cd node_exporter
```

### 运行

先创建 systemd 服务

```
cat > /usr/lib/systemd/system/node_exporter.service << EOF
[Unit]
Description=node_exporter
Documentation=https://prometheus.io/
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/node_exporter/node_exporter
KillMode=process
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF
```

刷新 systemd && 运行 && 查看

```
systemctl daemon-reload # 刷新 systemd 配置
systemctl enable node_exporter # 加入开机启动
systemctl start node_exporter # 启动服务 
systemctl status node_exporter # 查看详情
```

### 预览

http://192.168.61.66:9100/metrics

![image-20200831170126304](http://img.sgfoot.com/b/20200831170127.png?imageslim)



## 添加监控节点

### 添加 node_exporter

```
vim /usr/local/prometheus/prometheus.yml
# 在最后一个节点 scrape_configs 下添加  job_name 
# 空2个空格

- job_name: 'node'  # 一定要全局唯一, 采集本机的 metrics，需要在本机安装 node_exporter
    scrape_interval: 10s # 采集的间隔时间
    static_configs:
      - targets: ['localhost:9100']  # 本机 node_exporter 的 endpoint
```

![image-20200831171238397](http://img.sgfoot.com/b/20200831171239.png?imageslim)

重启服务 

```powershell
systemctl restart prometheus
```



浏览器上查看添加是否成功

http://192.168.61.66:9090/targets

![image-20200831171651802](http://img.sgfoot.com/b/20200831171652.png?imageslim)



## 参考

1. [文档下载](https://freemt.lanzous.com/iqhTfg8bzuf)
2. [CentOS7.5 Prometheus2.5+Grafana5.4监控部署](https://blog.csdn.net/xiegh2014/article/details/84936174)

## 软件下载

1. [node_exporter1.0.1.linux.amd64](https://freemt.lanzous.com/ieS67g8exab)
2. [prometheus-2.21.0.linux.amd64](https://freemt.lanzous.com/iXVhLg8exlc)

