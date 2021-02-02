---
title: "Ngnix Prometheus 监控"
date: 2020-11-06T17:41:55+08:00
lastmod: 2020-11-06T17:41:55+08:00
draft: false
tags: ["监控", "nginx", "prometheus", "教程", "grafana"]
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

## 概述

> Prometheus 监控 nginx 需要用到两个模块

1. nginx-module-vts 主要用于收集 nginx 各项指标.能提供 json 数据
2. nginx-vts-exporter 向 prometheus 提供可以识别的数据结构



## 安装 nginx-module-vts 模块

> 需要对 nginx 进行重新编译, 对于正在运行的 nginx 需要热启动, 谨慎操作.

### 下载 `nginx-module-vts` 模块文件

```sh
cd /usr/local/src
git clone https://github.com/vozlt/nginx-module-vts 
```

### 重新编译 nginx 

1. 查看之前编译的参数, 重新编译时必须复用之前的参数,否则会影响业务

```sh
nginx -V 
```

```tex
-> # nginx -V
nginx version: nginx/1.19.1
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-39) (GCC) 
built with OpenSSL 1.1.1g  21 Apr 2020
TLS SNI support enabled
configure arguments: --user=www --group=www --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_v2_module --with-http_gzip_static_module --with-http_sub_module --with-stream --with-stream_ssl_module --with-openssl=/root/lnmp1.7/src/openssl-1.1.1g --with-openssl-opt=enable-weak-ssl-ciphers
```

注意: 涉及到nginx引用其它包的插件,如`--with-openssl=/root/lnmp1.7/src/openssl-1.1.1g`, 必须保证`/root/lnmp1.7/src/openssl-1.1.1g` 目录存在, 否则自己需要重新下载一个.

2. 找到 nginx 安装原始包

   > 如果找不到的话,需要重新下载一个.

   ```sh
   cd /usr/local/src/nginx-1.19.1
   ```

   ![image-20201106174938671](http://img.sgfoot.com/b/20201106174946.png?imageslim)

   复制`nginx -V` 打印的参数,需要添加一下 `--add-module=/usr/local/src/nginx-module-vts` 也就是第一步时下载的`nginx-module-vts` 目录

   ```sh
   ./configure --add-module=/usr/local/src/nginx-module-vts --user=www --group=www --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_v2_module --with-http_gzip_static_module --with-http_sub_module --with-stream --with-stream_ssl_module --with-openssl=/root/lnmp1.7/src/openssl-1.1.1g --with-openssl-opt=enable-weak-ssl-ciphers
   ```

   进行编译

   ```sh
   # 不使用 make install
   make 
   ```

3. 复盖之前的`nginx` 命令

   ```sh
   # 先查找 nginx 位置
   whereis nginx 
   # 对 nginx 命令进行重命令, 否则无法 cp
   mv /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.bak
   # 然后将编译好的命令进行复制
   cd /usr/local/src/nginx-1.19.1
   cp objs/nginx /usr/local/nginx/sbin/
   ```

   ![image-20201106175445640](http://img.sgfoot.com/b/20201106175446.png?imageslim)

4. 热启动

   ```sh
   # 找到 nginx 当前的进程ID号
   netstat -nplt |grep -v grep |grep nginx
   # 使用 -USR2 热启动
   kill -USR2 2520
   ```

   ![image-20201106175645475](http://img.sgfoot.com/b/20201106175646.png?imageslim)

5. 验证是否安装成功

   ```sh
   # 查看命令configure arguments字段 --add-module=/usr/local/src/nginx-module-vts 是否存在?
   nginx -V 
   ```

   ![image-20201106175808601](http://img.sgfoot.com/b/20201106175809.png?imageslim)

### 配置 server 信息

1. 添加 vhost_traffic_status_zone; 标识
    ```sh
    vim /usr/local/nginx/conf/nginx.conf
    http {
        ...
        vhost_traffic_status_zone;
        ...
    }
    ```

2. 添加 nginx-vts.conf

   ```sh
   server {        
       listen 9013;   
    location /status {
           vhost_traffic_status_display;
           vhost_traffic_status_display_format html;
       }
   }
   ```
   
3. 重启 nginx

    ```sh
    nginx -t && nginx -s reload
    ```

4. 查看是否收集到数据.

    http://localhost:9088/status

    访问: `curl -I http://localhost:9088/status`

## 安装 nginx-vts-exporter

### 下载软件

```sh
cd /usr/local/src

wget https://github.com/hnlq715/nginx-vts-exporter/releases/download/v0.10.3/nginx-vts-exporter-0.10.3.linux-amd64.tar.gz -C 
```

### 解压&安装

```sh
tar -zxvf nginx-vts-exporter-0.10.3.linux-amd64.tar.gz -C /usr/local/
mv /usr/local/nginx-vts-exporter-0.10.3.linux-amd64 /usr/local/nginx-vts-exporter
```

### 制作 systemctl 

```sh
cat > /lib/systemd/system/nginx_exporter.service << EOF
[Unit]
Description=nginx-vts-exporter
Documentation=https://github.com/hnlq715/nginx-vts-exporter
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/nginx-vts-exporter/nginx-vts-exporter -nginx.scrape_uri=http://localhost:9013/status/format/json
KillMode=process
Restart=on-failure
RestartSec=3s

[Install]
WantedBy=multi-user.target
EOF
```

### 管理 nginx-exporter

````sh
# 刷新配置
systemctl daemon-reload
# 启动
systemctl start nginx_exporter
# 状态
systemctl status nginx_exporter
# 停止
systemctl stop nginx_exporter
# 重启
systemctl restart nginx_exporter
````

### 查看 metrics

http://127.0.0.1:9913/metrics

## 添加到 prometheus 数据源

> 添加到 scrape_configs 节点上 job_name: ‘nginx_vts_exporter’, 没有则添加

```sh
vim /usr/local/prometheus/prometheus.yml

scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
    - targets: ['localhost:9090']

  - job_name: 'nginx_vts_exporter' # nginx_vts_exporter 数据源。
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:9913']
```

1. 使用 prometool 工具检查配置是否成功

   ```shell
   ./promtool check config prometheus.yml
   ```

   ```shell
   Checking prometheus.yml
     SUCCESS: 0 rule files found
   ```
   
2. 重启 prometheus 

   ```shell
   systemctl daemon-reload
   systemctl restart prometheus
   ```

3. 查看 prometheus 是否添加成功

   http://127.0.0.1:9090/targets

## MySQL Over 图表安装

> 选择 2949 [具体操作参数 mysqld_exporter](https://www.sgfoot.com/mysqld_exporter.html#mysql-over-%E5%9B%BE%E8%A1%A8%E5%AE%89%E8%A3%85)

![image-20201106181928076](http://img.sgfoot.com/b/20201106181929.png?imageslim)