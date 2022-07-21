---
title: "Prometheus: Grafana 入门"
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

## .1. 简介

> Grafana是一个开源的度量分析和可视化工具，可以通过将采集的数据分
> 析，查询，然后进行可视化的展示,并能实现报警

- 官网：<https://grafana.com/>

## .2. 安装

### .2.1. 源码安装

> 官方最新版本下载：<https://grafana.com/grafana/download>

```powershell
# 下载
cd /usr/local/src
wget https://dl.grafana.com/oss/release/grafana-7.1.5.linux-amd64.tar.gz
wget https://dl.grafana.com/oss/release/grafana-9.0.0.linux-amd64.tar.gz
# 解压
tar -zxvf /grafana-7.1.5.linux-amd64.tar.gz -C /usr/local
# 重命名文件夹 grafana
mv /usr/local/grafana-7.1.5.linux-amd64 /usr/local/grafana
```

### .2.2. RPM 方式安装

```sh
wget https://dl.grafana.com/enterprise/release/grafana-enterprise-9.0.0-1.x86_64.rpm
sudo yum install grafana-enterprise-9.0.0-1.x86_64.rpm

sudo systemctl daemon-reload
sudo systemctl start grafana-server
sudo systemctl status grafana-server

sudo systemctl enable grafana-server
```

### .2.3. docker 安装

```sh
docker run -d \
  -p 3000:3000 \
  --name=grafana \
  -v /opt/grafana-storage:/var/lib/grafana \
  grafana/grafana
```

## .3. 修改密码

> 参考官方：<https://grafana.com/docs/grafana/next/cli/>

- [在线生成密码](https://suijimimashengcheng.bmcx.com/)

```sh
cd /usr/local/grafana/bin
或
whereis grafana-cli

sudo ./grafana-cli --homepath "/usr/local/grafana" admin reset-admin-password <新密码, 长度最长最好32位>
```

### 查看是否修改

> grafana 默认使用 sqlite3

```sh
[root@local]# sqlite3 /var/lib/grafana/grafana.db
#查看数据库中包含的表
.tables

#查看user表内容
select * from user;

#重置admin用户的密码为默认admin
update user set password = '59acf18b94d7eb0694c61e60ce44c110c7a683ac6a8f09580d626f90f4a242000746579358d77dd9e570e83fa24faa88a8a6', salt = 'F3FAxVm33R' where login = 'admin';

#退出sqlite3
.exit
```

## .4. 创建 systemd 服务

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

## .5. 启动服务

> grafana 默认为3000端口

```sh
systemctl start grafana
```

![image-20200901105728756](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901105729.png?imageslim)

## .6. 界面显示

> 默认帐号和密码：admin/admin, 不管生产还是测试一定要修改默认密码，推荐密码生成：<https://suijimimashengcheng.bmcx.com/>

<http://127.0.0.1:3000/>

![image-20200901110252897](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110253.png?imageslim)

## .7. 配置数据源

### .7.1. 第一步：Data Sources

> 点击齿轮图标，选择 Data Sources

![image-20200901110554879](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110555.png?imageslim)

### .7.2. 添加数据源

   ![image-20200901110707055](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110708.png?imageslim)

### .7.3. 选择 Prometheus 小火炬

   ![image-20200901110811716](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200901110813.png?imageslim)

### .7.4. 设置基本参数

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
  