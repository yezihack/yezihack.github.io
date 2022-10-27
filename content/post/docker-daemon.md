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

## 参数说明

### daemon.json 文件位置

1. JSON 文件形式默认存储位置: `/etc/docker/daemon.json`。
2. dockerd 通过 `--config-file`  参数指定配置文件位置。

### graph 数据存储

> 19.x 版本后官方建议使用：`data-root` 替代

1. 表示数据存储位置，包括镜像的存储。
2. `docker info |grep -i dir` 命令查看存储位置。
3. 也可以在 dockerd 中使用 `--data-root` 设置。

### storage-driver 存储驱动

> 存储驱动支持多种类型。如：OverlayFS, AUFS, ZFS, VFS等。

1. 对于当前支持的所有Linux发行版，overlay2是首选的存储驱动程序，并且不需要额外的配置。

### registry-mirrors 镜像注册

> 主要用于镜像加速注册的地址。

1. 推荐 <https://mirror.baidubce.com> <https://sziho4ql.mirror.aliyuncs.com>

### insecure-registries 无权限注册

1. Docker 默认不允许非 https 的镜像地址。一般私有仓库可以填写，跳过权限验证。

### exec-opts

1. 默认的 cgroups 驱动采用 cgroup
2. kubernetes 推荐使用 systemd,参考：[cgroup-drivers](https://kubernetes.io/docs/setup/production-environment/container-runtimes/#cgroup-drivers)

### live-restore 实时还原

1. 在 dockerd 停止时保证已启动的 Running 容器持续运行，并在 daemon 进程启动后重新接管。

### log-driver 日志驱动

> 支持多种驱动类型，如 none, local, json-file, syslog, journald

1. 日志存储形式，默认：json-file

### log-opts 日志参数

1. max-size 切割之前日志的最大大小。可取值为(k,m,g)， 默认为20m。
   1. dockerd 参数设置： `--log-opt max-size=10m`
2. max-file 可以存在的最大日志文件数。如果超过最大值，则会删除最旧的文件。**仅在max-size设置时有效。默认为5。
   1. dockerd 参数设置：`--log-opt max-file=3`
3. compress 对应切割日志文件是否启用压缩。默认情况下启用。
   1. dockerd 参数设置：`--log-opt compress=false`

### default-runtime 运行时

1. 默认容器的运行时为:runc
2. 需要支持 GPU,则需要修改为：`nvidia`
 
### runtimes 运行时参数设置

1. 支持GPU需要设置，参考：[daemon-configuration-file](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/user-guide.html#daemon-configuration-file)

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
        "max-size": "500m",
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
