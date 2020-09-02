---
title: ""
date: 2020-09-02T11:02:44+08:00
lastmod: 2020-09-02T11:02:44+08:00
draft: false
tags: ["", ""]
categories: [""]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## 



## 启动

1. 创建 systemd 服务

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

2. 启动

   ```shell
   systemctl daemon-reload
   systemctl start mysqld_exporter
   systemctl status mysqld_exporter
   ```

   