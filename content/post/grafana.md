---
title: "监控 Grafana 入门(四)"
date: 2020-08-31T20:29:51+08:00
lastmod: 2022-06-15T10:46:51+08:00
draft: false
tags: ["监控", "grafana", "prometheus", "教程"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---
<!-- TOC -->

- [.1. 简介](#1-简介)
- [.2. 源码安装](#2-源码安装)
- [.3. RPM 方式安装](#3-rpm-方式安装)
- [.4. 启动服务](#4-启动服务)
- [.5. docker 安装](#5-docker-安装)
- [.6. 界面显示](#6-界面显示)
- [.7. 配置数据源](#7-配置数据源)
  - [7.1. 第一步：Data Sources](#71-第一步data-sources)
  - [7.2. 添加数据源](#72-添加数据源)
  - [7.3. 选择 Prometheus 小火炬](#73-选择-prometheus-小火炬)
  - [7.4. 设置基本参数](#74-设置基本参数)
- [.8. 安装 Dashboards](#8-安装-dashboards)

<!-- /TOC -->

## .1. 简介

> Grafana是一个开源的度量分析和可视化工具，可以通过将采集的数据分
> 析，查询，然后进行可视化的展示,并能实现报警

- 官网：<https://grafana.com/>

## .2. 源码安装

> 官方最新版本下载：<https://grafana.com/grafana/download>

```powershell
# 下载
cd /usr/local/src
wget https://dl.grafana.com/oss/release/grafana-7.1.5.linux-amd64.tar.gz
# 解压
tar -zxvf /grafana-7.1.5.linux-amd64.tar.gz -C /usr/local
# 重命名文件夹 grafana
mv /usr/local/grafana-7.1.5.linux-amd64 /usr/local/grafana
```

## .3. RPM 方式安装

```sh
wget https://dl.grafana.com/enterprise/release/grafana-enterprise-9.0.0-1.x86_64.rpm
sudo yum install grafana-enterprise-9.0.0-1.x86_64.rpm
```


创建 systemd 服务

1. -homepath  grafana的工作目录。

```powershell
cat > /lib/systemd/system/grafana.service << EOF
[Unit]
Description=Grafana
Documentation=https://grafana.com/
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/grafana/bin/grafana-server -homepath /usr/local/grafana/
Restart=on-failure
RestartSec=42s

[Install]
WantedBy=multi-user.target
EOF
```

## .4. 启动服务

> grafana 默认为3000端口

```powershell
systemctl start grafana
```

![image-20200901105728756](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901105729.png?imageslim)

## .5. docker 安装

```sh
docker run -d \
  -p 3000:3000 \
  --name=grafana \
  -v /opt/grafana-storage:/var/lib/grafana \
  grafana/grafana
```

## .6. 界面显示

> 默认帐号和密码：admin/admin

<http://127.0.0.1:3000/>

![image-20200901110252897](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110253.png?imageslim)

## .7. 配置数据源

### 7.1. 第一步：Data Sources

> 点击齿轮图标，选择 Data Sources

![image-20200901110554879](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110555.png?imageslim)

### 7.2. 添加数据源

   ![image-20200901110707055](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110708.png?imageslim)

### 7.3. 选择 Prometheus 小火炬

   ![image-20200901110811716](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110813.png?imageslim)

### 7.4. 设置基本参数

   1. Prometheus
   2. <http://localhost:9090>
   3. GET

   ![image-20200901111029490](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901111030.png?imageslim)

## .8. 安装 Dashboards

- 官方和社区建立的仪表板

<https://grafana.com/grafana/dashboards>

![image-20200901111546055](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901111547.png?imageslim)

下载：<https://grafana.com/grafana/dashboards/8919>

![image-20200901111639166](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901111639.png?imageslim)

导入 JSON 仪表板， 也可以使用ID快捷导入。

![image-20200901111902641](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901111903.png?imageslim)

使用ID导入JSON仪表板

![image-20200901112707015](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901112708.png?imageslim)

效果：

![image-20200831203441031](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831203442.png?imageslim)
  