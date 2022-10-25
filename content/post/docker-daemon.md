---
title: "Docker笔记(七) Docker Daemon 配置"
date: 2022-10-15T13:37:47+08:00
lastmod: 2022-10-15T13:37:47+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
categories: ["docker"]
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

云原生中 docker 有着重要的地位，我们有必要学习下 Docker 几个重要的启动参数，也适合生产。

## 如何配置

### daemon.json JSON文件形式配置

### dockerd





## daemon.json 配置参考

### CPU 机器使用 daemon.json

```json
{
    "graph": "/data01/docker",
    "storage-driver": "overlay2",
    "registry-mirrors": ["https://sziho4ql.mirror.aliyuncs.com"],
    "insecure-registries": ["harbor.io"],
    "exec-opts": ["native.cgroupdriver=systemd"],
    "live-restore": true,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "10"
    },
    "exec-opts": ["native.cgroupdriver=systemd"],
    "default-runtime": "nvidia",
    "runtimes":  {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

### GPU 机器使用 daemon.json

```json
{
    "graph": "/data01/docker",
    "storage-driver": "overlay2",
    "registry-mirrors": ["https://sziho4ql.mirror.aliyuncs.com"],
    "insecure-registries": ["harbor.io"],
    "exec-opts": ["native.cgroupdriver=systemd"],
    "live-restore": true,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "10"
    },
    "exec-opts": ["native.cgroupdriver=systemd"],
    "default-runtime": "nvidia",
    "runtimes":  {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```











## 关于作者

我的博客：<https://sgfoot.com>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
