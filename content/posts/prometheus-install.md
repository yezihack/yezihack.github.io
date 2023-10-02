---
title: "Prometheus: 安装"
date: 2021-09-24T17:04:51+08:00
lastmod: 2022-06-15T10:54:51+08:00
draft: false
tags: ["prometheus", "grafana", "监控", "教程"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

<!-- TOC -->

- [.1. 安装](#1-安装)
  - [.1.1. 下载](#11-下载)
  - [.1.2. 运行](#12-运行)
  - [.1.3. 预览](#13-预览)
  - [.1.4. nginx 反向代理](#14-nginx-反向代理)
- [.2. Docker 安装](#2-docker-安装)
- [.3. 关于作者](#3-关于作者)

<!-- /TOC -->

## .1. 安装

### .1.1. 下载

> prometheus提供二进制,直接解压即可用.由 go 编写

- 官网下载: <https://prometheus.io/download/>

- Centos 64x 选择下载 `*linux-amd64.tar.gz`

```shell
wget -c https://github.com/prometheus/prometheus/releases/download/v2.18.1/prometheus-2.18.1.darwin-amd64.tar.gz
tar -xvf prometheus-2.18.1.darwin-amd64.tar.gz -C /usr/local/
```

### .1.2. 运行

创建 systemd 服务

- `--config.file` 配置文件
- `--storage.tsdb.retention` 数据保留多少天
- `--query.max-concurrency` 最大并发数
- `--storage.tsdb.path` 数据存储位置
- `--web.max-connections` 最大连接数

```shell
cat > /usr/lib/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Documentation=https://prometheus.io/
After=network.target
 
[Service]
Type=simple
ExecStart=/usr/local/prometheus/prometheus \\
    --config.file=/usr/local/prometheus/prometheus.yml \\
    --web.read-timeout=5m  \\
    --web.max-connections=10 \\
    --storage.tsdb.retention=15d \\
    --storage.tsdb.path=/data/prometheus \\
    --query.max-concurrency=20 \\
    --query.timeout=2m

Restart=always
RestartSec=3s
 
[Install]
WantedBy=multi-user.target
EOF
```

刷新 systemd && 运行 && 查看

```sh
systemctl daemon-reload # 刷新 systemd 配置
systemctl enable prometheus # 加入开机启动
systemctl start prometheus # 启动服务 
systemctl status prometheus # 查看详情
```

### .1.3. 预览

<http://localhost:9090>

![image-20200831170056207](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831170057.png?imageslim)

**自带也会产生监控数据:**

<http://localhost:9090/metrics>

### .1.4. nginx 反向代理

> htpasswd 参考: <https://yezihack.github.io/htpasswd.html>

```nginx
server {
  listen 80;
  server_name prome.sgfoot.com;
  auth_basic "Auth";
  auth_basic_user_file /usr/local/nginx/conf/vhost/htpasswd.users;
  location / {
      proxy_pass http://127.0.0.1:9090;
      index index.html index.htm;
  }
}
```

## .2. Docker 安装

创建配置文件，进行挂载

```sh
mkdir -p /root/prometheus/conf/
cat > ~/prometheus/conf/prometheus.yml << EOF
# my global config
global:
  scrape_interval: 15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 192.168.100.100:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "prometheus"
    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.
    scrape_interval: 10s # 间隔pull时间
    static_configs:
      - targets: ["localhost:9090"]
EOF
```

```sh
docker run -d -p 9090:9090 --name=prometheus  -v  ~/prometheus/conf/:/etc/prometheus/  quay.io/prometheus/prometheus
```

## .3. 关于作者
我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
