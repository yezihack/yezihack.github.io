---
title: "监控 Node Exporter 监控主机(六)"
date: 2021-09-24T17:05:06+08:00
lastmod: 2021-09-24T17:05:06+08:00
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


## node_exporter 安装

> 监控远程 linux 服务器CPU、内存、磁盘、I/O等信息
>
> 下载慢，请查看[软件下载列表](https://www.sgfoot.com/soft.html)

https://prometheus.io/download/

![image-20200831161413148](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831161414.png?imageslim)

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

![image-20200831170126304](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831170127.png?imageslim)



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

![image-20200831171238397](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831171239.png?imageslim)

重启服务 

```powershell
systemctl restart prometheus
```



## docker 安装

```sh
docker run -d -p 9100:9100 \
  -v "/proc:/host/proc:ro" \
  -v "/sys:/host/sys:ro" \
  -v "/:/rootfs:ro" \
  --net="host" \
  prom/node-exporter
```



## 验证

**浏览器上查看添加是否成功**

http://192.168.61.66:9090/targets

![image-20200831171651802](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200831171652.png?imageslim)












## 关于我
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)