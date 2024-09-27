---
title: "Containerd 容器安装"
date: 2024-09-27T16:59:10+08:00
lastmod: 2024-09-27T16:59:10+08:00
draft: false
tags: ["containerd", "k8s", "docker"]
categories: ["kubernetes"]
author: "百里"
comment: false
toc: true
reward: true
---

<!-- TOC tocDepth:2..3 chapterDepth:2..6 -->

- [1. Containerd 软件安装](#1-containerd-软件安装)
  - [1.1. Containerd 组件介绍](#11-containerd-组件介绍)
- [2. runc 安装](#2-runc-安装)
- [3. crictl 安装](#3-crictl-安装)
  - [3.1. crictl 配置](#31-crictl-配置)
- [4. containerd 配置](#4-containerd-配置)
  - [4.1. 修改配置](#41-修改配置)
  - [4.2. 配置镜像加速](#42-配置镜像加速)
- [5. 添加 containerd 到 systemd](#5-添加-containerd-到-systemd)
- [6. Containerd 使用说明](#6-containerd-使用说明)
  - [6.1. crictl 命令](#61-crictl-命令)
  - [6.2. cri 命令](#62-cri-命令)

<!-- /TOC -->

## 1. Containerd 软件安装

- <https://github.com/containerd/containerd/releases>

```sh
# 下载
wget https://github.com/containerd/containerd/releases/download/v1.7.22/containerd-1.7.22-linux-amd64.tar.gz
# 解压
tar -zxvf containerd-1.7.22-linux-amd64.tar.gz
# 移动
mv bin/* /usr/local/bin/

-> # ctr version
Client:
  Version:  v1.7.22
  Revision: 7f7fdf5fed64eb6a7caf99b3e12efcf9d60e311c
  Go version: go1.22.7
```

### 1.1. Containerd 组件介绍

| 序列 | 名称                 | 介绍                                       |
|------|---------------------|--------------------------------------------|
| 1    | containerd-shim-runc-v1 | `containerd` 的旧版本 shim 进程，用于管理单个容器的生命周期。 |
| 2    | containerd-shim-runc-v2 | `containerd` 的更新版本 shim 进程，用于管理单个容器的生命周期。 |
| 3    | containerd-stress     | 用于压力测试 `containerd` 的工具。                     |
| 4    | containerd           | `containerd` 的主要守护进程，负责管理容器的生命周期和镜像存储。 |
| 5    | containerd-shim       | `containerd` 的 shim 进程，用于在容器和 `containerd` 守护进程之间建立通信。 |
| 6    | ctr                  | `containerd` 的命令行界面（CLI）工具，允许直接与 `containerd` 守护进程交互。 |

## 2. runc 安装

- <https://github.com/opencontainers/runc/releases>

```sh
wget https://github.com/opencontainers/runc/releases/download/v1.1.14/runc.amd64

# 移动
mv runc.amd64 /usr/local/bin/runc
```

## 3. crictl 安装

- 版本选择：<https://github.com/kubernetes-sigs/cri-tools/releases>

![crictl](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240923205442.png)

```sh
wget https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.31.1/crictl-v1.31.1-linux-amd64.tar.gz
# 解压
tar -zxvf crictl-v1.31.1-linux-amd64.tar.gz
# 移动
mv crictl /usr/local/bin/

-> # crictl version
crictl info 

# 查看 sock文件
cat /etc/containerd/config.toml | grep sock

# 验证
crictl --runtime-endpoint=unix:///run/containerd/containerd.sock  version
```

### 3.1. crictl 配置

```sh
# 方法一：创建文件
cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 0
debug: false
pull-image-on-create: false
EOF

# 方法二：环境变量
export CONTAINER_RUNTIME_ENDPOINT=unix:///run/containerd/containerd.sock
export IMAGE_SERVICE_ENDPOINT=unix:///run/containerd/containerd.sock
```

## 4. containerd 配置

```sh
# 生成配置文件
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
```

### 4.1. 修改配置

- `containerdEndpoint` 指定了 containerd 服务监听的 Unix 套接字文件路径
- `containerdRootDir`: 指定了 containerd 的根目录，这是 containerd 存储其数据和状态的地方。默认情况下，它通常位于 /var/lib/containerd。
- `sandboxImage`: 指定了用于创建 Pod 沙箱（Pod 内的隔离环境）的基础镜像。

```sh
vim /etc/containerd/config.toml

# root
sed -i 's/\/var\/lib\/containerd/\/data01\/containerd/'  /etc/containerd/config.toml

# systemd
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/'  /etc/containerd/config.toml

#  sandbox_image
sed -i 's/sandbox_image.*/sandbox_image = "registry.aliyuncs.com\/google_containers\/pause:3.8"/' /etc/containerd/config.toml

#  registry.mirrors
sed -i 's|^config_path[[:space:]]*=.*|config_path = "/etc/containerd/certs.d"|' /etc/containerd/config.toml

# 检查
cat /etc/containerd/config.toml |grep -E "root|SystemdCgroup|sandbox_image|config_path"|grep -v root_path|grep -v runtime_root

# root = "/data01/containerd"
#     sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.8"
#             SystemdCgroup = true
```

### 4.2. 配置镜像加速

```sh
# docker hub镜像加速
mkdir -p /etc/containerd/certs.d

mkdir -p /etc/containerd/certs.d/docker.io

cat > /etc/containerd/certs.d/docker.io/hosts.toml << EOF
server = "https://docker.io"
[host."https://dockerproxy.com"]
  capabilities = ["pull", "resolve"]

[host."https://docker.m.daocloud.io"]
  capabilities = ["pull", "resolve"]

[host."https://reg-mirror.qiniu.com"]
  capabilities = ["pull", "resolve"]

[host."https://registry.docker-cn.com"]
  capabilities = ["pull", "resolve"]

[host."http://hub-mirror.c.163.com"]
  capabilities = ["pull", "resolve"]
EOF

# 配置 config.toml
# 编辑 /etc/containerd/config.toml 文件，设置 config_path 指向你创建的证书目录
[plugins."io.containerd.grpc.v1.cri".registry]
config_path = "/etc/containerd/certs.d"
```

- 直接修改 config.toml 文件

```toml
# 设置存储目录
root="/var/lib/containerd"

# 设置 cgroup = systemd
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true

# 设置镜像仓库
[plugins."io.containerd.grpc.v1.cri"]
  # sandbox_image = "registry.k8s.io/pause:3.8"
  sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"

# 设置镜像仓库地址
[plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
    endpoint = ["https://registry-1.docker.io"]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."gcr.io"]
    endpoint = ["https://gcr.azk8s.cn/google-containers"]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
```

## 5. 添加 containerd 到 systemd

- 官方提供的 systemd 文件<https://raw.githubusercontent.com/containerd/containerd/refs/heads/main/containerd.service>

```sh
cat > /etc/systemd/system/containerd.service <<EOF
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd

Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5

# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNPROC=infinity
LimitCORE=infinity

# Comment TasksMax if your systemd version does not supports it.
# Only systemd 226 and above support this version.
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
EOF

# 启动
systemctl daemon-reload
systemctl enable containerd --now 
```

## 6. Containerd 使用说明

### 6.1. crictl 命令

- `crictl` 是一个与 Kubernetes 集群中的容器运行时接口（CRI）兼容的命令行工具，它允许用户直接与容器运行时进行交互。在非 Kubernetes 环境中，`crictl` 的某些命令可能不适用或者行为不同。

| 命令              | 解释                                                         |
|-------------------|--------------------------------------------------------------|
| `crictl ps`       | 列出当前运行的容器。                                           |
| `crictl pods`     | 列出当前运行的 Pod 容器。（注意：`crictl` 通常不直接管理 Pod，这个命令可能与 Kubernetes 集群中的 Pod 概念不同） |
| `crictl images`   | 列出当前本地存储的镜像。                                       |
| `crictl pull <image>` | 从指定的容器镜像仓库拉取一个镜像。例如：`crictl pull alpine:latest` 会拉取最新的 Alpine Linux 镜像。 |
| `crictl runp <image>` | 运行一个指定的镜像作为一个新容器。例如：`crictl runp docker.io/library/alpine:latest` 会创建一个新的 Alpine 容器。 |
| `crictl rmp <id>`  | 移除指定的镜像。例如：`crictl rmp 1` 会移除 ID 为 1 的镜像。       |
| `crictl rm <id>`   | 移除指定的容器。例如：`crictl rm 1` 会移除 ID 为 1 的容器。         |
| `crictl rmi <image>` | 移除指定的镜像。例如：`crictl rmi alpine:latest` 会移除 Alpine 镜像。 |
| `crictl stop <id>` | 停止指定的容器。例如：`crictl stop 1` 会停止 ID 为 1 的容器。       |
| `crictl stopp <id>` | 停止指定的 Pod 容器。（注意：`crictl` 通常不直接管理 Pod，这个命令可能与 Kubernetes 集群中的 Pod 概念不同） |

### 6.2. cri 命令

- ctr 是 containerd 的命令行界面工具，它允许用户直接与 containerd 守护进程交互，执行容器相关的操作。这些命令涵盖了镜像管理、容器的运行和删除、以及任务（容器）的执行和管理。

下面是根据您提供的 `ctr` 命令生成的表格：

| 命令                                  | 解释                                                         |
|---------------------------------------|--------------------------------------------------------------|
| `ctr images ls`                      | 列出当前本地存储的镜像。                                       |
| `ctr run -d --rm <image> <command>`   | 运行指定的镜像作为一个新容器，并在后台运行。`--rm` 标志表示容器退出后自动删除容器。例如：`ctr run -d --rm docker.io/library/alpine:latest /bin/sh` 会启动 Alpine 镜像并在后台运行 `/bin/sh`。 |
| `ctr ps`                             | 列出当前运行的容器。                                           |
| `ctr tasks ls`                       | 列出当前运行的任务（容器）。                                   |
| `ctr tasks ps`                       | 显示当前任务（容器）的详细状态和资源使用情况。                   |
| `ctr tasks exec -t <container-id> <command>` | 在指定的容器内执行命令。`-t` 标志分配一个伪终端。例如：`ctr tasks exec -t 1 /bin/sh` 会在容器 ID 为 1 的容器内启动一个新的 shell 会话。 |
| `ctr tasks kill <container-id>`       | 发送信号（默认为 SIGTERM）来停止指定的容器。                     |
| `ctr tasks rm <container-id>`         | 删除指定的容器。                                               |
| `ctr tasks rm <container-id> --force` | 强制删除指定的容器，即使容器当前正在运行。                     |
| `ctr containers ls`                  | 列出当前容器的概览信息。                                       |
| `ctr containers rm <container-id>`    | 删除指定的容器。                                               |
| `ctr containers rm <container-id> --force` | 强制删除指定的容器，即使容器当前正在运行。 |
| `ctr images ls`                      | 列出当前本地存储的镜像。                                       |
| `ctr images rm <image>`              | 删除指定的镜像。                                               |
| `ctr images rm <image> --force`      | 强制删除指定的镜像，即使镜像当前正在被使用。                     |
