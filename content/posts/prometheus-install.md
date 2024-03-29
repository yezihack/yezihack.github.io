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
  - [.1.3. 添加认证](#13-添加认证)
  - [.1.4. 预览](#14-预览)
  - [.1.5. nginx 反向代理](#15-nginx-反向代理)
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

### .1.3. 添加认证

- 参考官方：<https://prometheus.io/docs/guides/basic-auth/>

创建 gen-pass.py 文件

```py
import getpass
import bcrypt

password = getpass.getpass("password: ")
hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
print(hashed_password.decode())
```

运行 gen-pass.py 文件

```sh
python3 gen-pass.py

# 输入密码
password:
$2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
```

添加 web.yml 文件

```yml
basic_auth_users:
    admin: $2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
```

验证文件正确性：

```sh
$ promtool check web-config web.yml
web.yml SUCCESS
```

创建 systemd 服务

- web.listen-address 只允许本地访问
- web.config.file 添加 web.yml 文件

```shell
cat > /usr/lib/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
Documentation=https://prometheus.io/
After=network.target
 
[Service]
Type=simple
ExecStart=/usr/local/prometheus/prometheus \
  --web.listen-address=127.0.0.1:9090 \
  --config.file=/usr/local/prometheus/prometheus.yml \
  --storage.tsdb.path=/usr/local/prometheus/data \
  --web.config.file=/usr/local/prometheus/web.yml
Restart=on-failure
RestartSec=42s
 
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

验证认证是否生效：

```sh
# 访问失败
curl --head http://localhost:9090/metrics

# 使用认证
curl -u admin http://localhost:9090/metrics
Enter host password for user 'admin':
```

### .1.4. 预览

<http://localhost:9090>

![image-20200831170056207](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831170057.png?imageslim)

**自带也会产生监控数据:**

<http://192.168.61.66:9090/metrics>

### .1.5. nginx 反向代理

> 如果添加过 prometheus 自身认证 web.config.file 则无须再添加 auth_basic 操作。
> htpasswd 参考: <https://www.sgfoot.com/htpasswd.html>

带 auth_basic 的 nginx 配置文件

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

不带 auth_basic 的 nginx 配置文件，使用 web.config.file.basic_auth_users 认证

```nginx
server {
  listen 80;
  server_name prome.sgfoot.com;
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
我的博客：<https://www.sgfoot.com>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
