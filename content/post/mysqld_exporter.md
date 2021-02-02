---
title: "监控 MySQL(三)"
date: 2020-09-02T11:02:44+08:00
lastmod: 2020-09-02T11:02:44+08:00
draft: false
tags: ["监控", "mysql", "prometheus", "教程", "grafana"]
categories: ["监控"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## mysqld_exporter 安装

> 下载慢，请查看[软件下载列表](https://www.sgfoot.com/soft.html)

https://prometheus.io/download/

```shell
cd /usr/local/src/
wget https://github.com/prometheus/mysqld_exporter/releases/download/v0.12.1/mysqld_exporter-0.12.1.darwin-amd64.tar.gz
tar -zxvf mysqld_exporter-0.12.1.darwin-amd64.tar.gz -C /usr/local/
mv /usr/local/mysqld_exporter-0.12.1.darwin-amd64 /usr/local/mysqld_exporter
```

1. 创建 .my.cnf 文件

   1. host 主机地址
   2. user mysql名称
   3. password mysql密码

   ```shell
   cat > /usr/local/mysqld_exporter/.my.cnf << EOF
   [client]
   host=127.0.0.1 
   user=root
   password=root
   EOF
   ```

2. 创建 systemd 服务

```shell
cat > /lib/systemd/system/mysqld_exporter.service << EOF
[Unit]
Description=mysqld_exporter
Documentation=https://prometheus.io/
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/mysqld_exporter/mysqld_exporter --config.my-cnf=/usr/local/mysqld_exporter/.my.cnf
KillMode=process
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF
```

3. 启动

```shell
systemctl daemon-reload
systemctl start mysqld_exporter
systemctl status mysqld_exporter
```

4. 验证 metrics

   > 显示有数据则表示已经采集到数据啦。

   ```shell
   curl http://localhost:9104/metrics
   ```

## 添加到 prometheus 数据源

> 添加到 scrape_configs 节点上 job_name: 'mysqld_exporter'

```shell
vim /usr/local/prometheus/prometheus.yml

scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
    - targets: ['localhost:9090']

  - job_name: 'mysqld_exporter' # mysqld_exporter 数据源。
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:9104']
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

   ![image-20200902162755205](http://img.sgfoot.com/b/20200902162756.png?imageslim)

## MySQL Over 图表安装

   https://grafana.com/grafana/dashboards/7362

1. 在 Grafana 导入 ID： 7362 添加图表

![image-20200902163025933](http://img.sgfoot.com/b/20200902163027.png?imageslim)

2. Import ID: 7362

![image-20200902163203183](http://img.sgfoot.com/b/20200902163204.png?imageslim)

3. 查看图表

   ![image-20200902163255102](http://img.sgfoot.com/b/20200902163256.png?imageslim)

![image-20200902163326760](http://img.sgfoot.com/b/20200902163327.png?imageslim)



## 分享

1.  https://www.sgfoot.com/soft.html 提供软件快速下载