---
title: "监控 Grafana入门(二)"
date: 2020-08-31T20:29:51+08:00
lastmod: 2020-08-31T20:29:51+08:00
draft: false
tags: ["监控", "grafana", "prometheus"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 简介 

> Grafana是一个开源的度量分析和可视化工具，可以通过将采集的数据分
> 析，查询，然后进行可视化的展示,并能实现报警

https://grafana.com/

## 源码安装

```powershell
# 下载
cd /usr/local/src
wget https://dl.grafana.com/oss/release/grafana-7.1.5.linux-amd64.tar.gz
# 解压
tar -zxvf /grafana-7.1.5.linux-amd64.tar.gz -C /usr/local
# 重命名文件夹 grafana
mv /usr/local/grafana-7.1.5.linux-amd64 /usr/local/grafana
# 自定义配置文件
cp /usr/local/grafana/conf/defaults.ini /usr/local/grafana/conf/user.ini 
# 编辑配置文件

```

编辑配置文件

```shell
vim /usr/local/grafana/conf/user.ini 
# 将 logs, plugins, provisioning
```

![image-20200901105957662](http://img.sgfoot.com/b/20200901105958.png?imageslim)

创建 systemd 服务

```powershell
cat > /lib/systemd/system/grafana.service << EOF
[Unit]
Description=Grafana
Documentation=https://grafana.com/
After=network.target
 
[Service]
Type=simple
ExecStart=/usr/local/grafana/bin/grafana-server -config /usr/local/grafana/conf/user.ini
Restart=on-failure
RestartSec=42s
 
[Install]
WantedBy=multi-user.target
EOF
```



## 启动服务

> grafana 默认为3000端口

```powershell
systemctl start grafana
```

![image-20200901105728756](http://img.sgfoot.com/b/20200901105729.png?imageslim)



## 界面显示

> 默认帐号和密码：admin/admin

http://127.0.0.1:3000/

![image-20200901110252897](http://img.sgfoot.com/b/20200901110253.png?imageslim)



## 配置数据源

1. 第一步：点击齿轮图标，选择 Data Sources

![image-20200901110554879](http://img.sgfoot.com/b/20200901110555.png?imageslim)

2. 添加数据源

   ![image-20200901110707055](http://img.sgfoot.com/b/20200901110708.png?imageslim)

3. 选择 Prometheus 小火炬

   ![image-20200901110811716](http://img.sgfoot.com/b/20200901110813.png?imageslim)

4. 设置基本参数

   1. Prometheus
   2. http://localhost:9090
   3. GET

   ![image-20200901111029490](http://img.sgfoot.com/b/20200901111030.png?imageslim)

## 安装 Dashboards

- 官方和社区建立的仪表板

https://grafana.com/grafana/dashboards

![image-20200901111546055](http://img.sgfoot.com/b/20200901111547.png?imageslim)

下载： https://grafana.com/grafana/dashboards/8919

![image-20200901111639166](http://img.sgfoot.com/b/20200901111639.png?imageslim)

导入 JSON 仪表板， 也可以使用ID快捷导入。

![image-20200901111902641](http://img.sgfoot.com/b/20200901111903.png?imageslim)

使用ID导入JSON仪表板

![image-20200901112707015](http://img.sgfoot.com/b/20200901112708.png?imageslim)

效果：

![image-20200831203441031](http://img.sgfoot.com/b/20200831203442.png?imageslim)

## 软件下载

1. [grafana-7.1.5.linux.amd64](https://freemt.lanzous.com/iQEcXg8f8qd)

   