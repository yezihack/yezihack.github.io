---
title: "云运维笔记(6) k1s 工具使用教程"
date: 2022-12-06T16:46:57+08:00
lastmod: 2022-12-06T16:46:57+08:00
draft: false
tags: ["linux", "工具", "云运维笔记", "脚本", "k8s"]
categories: ["云运维笔记"]
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

- [.1. k1s 是 kubectl 辅助工具](#1-k1s-是-kubectl-辅助工具)
- [.2. 什么是 k1s](#2-什么是-k1s)
- [.3. k1s 特色](#3-k1s-特色)
- [.4. 安装](#4-安装)
- [.5. 快速上手](#5-快速上手)
- [.6. 功能](#6-功能)
  - [.6.1. Resources 列表( kubectl 系统对应)](#61-resources-列表-kubectl-系统对应)
  - [.6.2. Resources 列表(扩展功能)](#62-resources-列表扩展功能)
  - [.6.3. Action 列表](#63-action-列表)
  - [.6.4. Extend 扩展功能](#64-extend-扩展功能)
  - [.6.5. 环境变量](#65-环境变量)
- [.7. 使用说明](#7-使用说明)
  - [.7.1. 设置环境变量](#71-设置环境变量)
  - [.7.2. 日志查看](#72-日志查看)
  - [.7.3. 进入容器](#73-进入容器)
  - [.7.4. 资源操作](#74-资源操作)
    - [.7.4.1. nodes 资源](#741-nodes-资源)
    - [.7.4.2. pods 资源](#742-pods-资源)
    - [.7.4.3. deployments 资源](#743-deployments-资源)
    - [.7.4.4. daemonsets 资源](#744-daemonsets-资源)
    - [.7.4.5. services 资源](#745-services-资源)
    - [.7.4.6. 清理垃圾](#746-清理垃圾)
- [.8. 关于作者](#8-关于作者)

<!-- /TOC -->
## .1. k1s 是 kubectl 辅助工具

> so easy, so fast.

```text
   _   _   _
  / \ / \ / \
 ( k | 1 | s )
  \_/ \_/ \_/
        by 百里(github.com/yezihack/k1s)
    so easy, so fast.
 version: 2.0.0 
```

<!-- [![asciicast](https://asciinema.org/a/541172.svg)](https://asciinema.org/a/541172) -->

![README-k1s](https://cdn.jsdelivr.net/gh/yezihack/assets/b/README-k1s.gif)

<!-- 更多效果：<https://asciinema.org/a/541172> -->

## .2. 什么是 k1s

k1s 主要是用于 kubernetes 管理的命令行工具。对 kubectl 命令实现快捷操作。

 github 源码：<https://github.com/yezihack/k1s> 欢迎点星星。

## .3. k1s 特色

- 支持 28 种 kubernetes 资源操作。
- 缩减命令长度。
- 使用更人性化的组合操作。如日志，进入容器等，见下文的实例。
- 支持部署或更新 YAML 前的差异显示与模拟。

## .4. 安装

直接下载脚本，仅依赖 kubectl。

```sh
wget https://raw.githubusercontent.com/yezihack/k1s/master/k1s
chmod +x k1s
sudo mv k1s /usr/local/bin
```

## .5. 快速上手

设置命名空间

```sh
export K1S_NS=kube-system
```

基本操作命令

```sh
# 查看帮助
k1s

# 查看 pods 列表
k1s po

# 查看 pods describe 
k1s po xxx desc

# 查看 pods YAML 
k1s po xxx yaml

# 查看 pods 日志(xxx 表示 pods 名称)
k1s po xxx logs

# 查看 pods 最近10条日志(xxx 表示 pods 名称)
k1s po xxx logs 10

# 进入容器内部 
k1s po xxx exec
```

## .6. 功能

命令格式：

```sh
#  环境变量
k1s resources <param> action <extend>
```

### .6.1. Resources 列表( kubectl 系统对应)

> 资源(Resources) 列表详情, 与 api-resources 显示一致,未全列出,只列出常用的资源名称.

| No  | Name                     | ShortName | Describe                |
| --- | ------------------------ | --------- | ----------------------- |
| 01  | componentstatuses        | cs        | k8s 组件健康状态        |
| 02  | configmaps               | cm        | 配置管理资源            |
| 03  | endpoints                | ep        | 端点                    |
| 04  | events                   | ev        | 事件                    |
| 05  | limitranges              | limits    | 为pod自定义资源管理限制 |
| 06  | namespaces               | ns        | 命名空间                |
| 07  | nodes                    | node, no        | 节点资源                |
| 08  | persistentvolumeclaims   | pvc       | 声明持久卷              |
| 09  | persistentvolumes        | pv        | 持久卷                  |
| 10  | pods                     | po,ps        | k8s 管理最小单元        |
| 11  | replicationcontrollers   | rc        | 副本控制器              |
| 12  | resourcequotas           | quota     | 硬性资源限额            |
| 13  | secrets                  | secret, sec       | 机密数据配置资源        |
| 14  | services                 | svc       | 服务负载资源            |
| 15  | daemonsets               | ds        | 守护进程资源            |
| 16  | deployments              | deploy,d  | 控制器资源              |
| 17  | replicasets              | rs        | 副本集合资源            |
| 18  | statefulsets             | sts       | 有状态控制器            |
| 19  | horizontalpodautoscalers | hpa       | Pod 水平自动扩缩器      |
| 20  | cronjobs                 | bj        | 定时任务器              |
| 21  | jobs                     | job       | 一次性任务器            |
| 22  | ingresses                | ing       | 对外负载器              |
| 23  | ingressclasses           | ingc      | Ingress 分类器          |
| 24  | clusterrolebindings      | crb       | RBAC 集群角色绑定       |
| 25  | serviceaccounts          | sa        | RBAC 服务帐号           |
| 26  | clusterroles             | cr        | RBAC 集群角色           |
| 27  | rolebindings             | rb        | RBAC 角色绑定           |
| 28  | roles                    | ro        | RBAC 角色               |

### .6.2. Resources 列表(扩展功能)

| No  | Name   | ShortName | Describe          |
| --- | ----- | ----- | ----------------- |
| 1   | apply | p | 开始部署/重新部署 |
| 2   | exec  | auto, e | 进入容器 |
| 3   | clean | c | 清理无用 Pod      |

### .6.3. Action 列表

> 操作某资源时可以使用不同的动作(action)从而实现多功能操作。

| No  | Name     | ShortName | Describe           |
| --- | -------- | --------- | ------------------ |
| 01  | list     | ls        | 显示列表(默认显示) |
| 02  | describe | desc      | 查看详情           |
| 03  | yaml     | y,yml     | 查看 YAML          |
| 04  | wide     | w         | 查看更多信息       |
| 05  | exec     | e,auto    | 进入容器操作       |
| 06  | delete   | del,rm      | 删除资源操作       |
| 07  | logs     | log       | 查看日志操作,也兼容 tail       |
| 08  | tail     |           | 查看 Pod 最近日志  |
| 09  | tailf    |           | 监听日志变化       |
| 10  | like     |           | 模糊查找           |
| 11  | edit     |           | 编辑 YAML           |

### .6.4. Extend 扩展功能

> 动态的参数，如操作 logs 日志。见下面实例。

| No  | Extend         | Describe         |
| --- | -------------- | ---------------- |
| 1   | container-name | 选择不同容器名称 |
| 2   | 10               | 显示日志最近条数 |

### .6.5. 环境变量

| No  | Name     | Default | Describe                   |
| --- | -------- | ------- | -------------------------- |
| 1   | K1S_NS   | default | 命名空间名称               |
| 2   | K1S_PATH | ~       | 构建目录，默认本用户目录下 |

## .7. 使用说明

> 举例说明，只列举常用资源

### .7.1. 设置环境变量

```sh
# 设置命名空间名称
export K1S_NS=default

# 设置构建路径，主要用于 apply 部署或重建时用到。
export K1S_PATH=/home/dev/
```

小技巧：对于常操作的命令空间，可以设置别名

```sh
vim ~/.bashrc
# 或
vim ~/.zshrc

alias k1s-sys='export K1S_NS=kube-system && export K1S_PATH=/opt/deploy/'
```

### .7.2. 日志查看

> 别名：logs, log

**参数：**

- pod名称：`kube-cc-7789c5f6d6-szqwk`
- 容器名称：`client`

**模式：**

> 共四种模式操作

- 普通模式：`k1s po [pod 名称] logs`
- 最近模式：`k1s po [pod 名称] logs 10` 查看最近10条日志
- 选择模式：`k1s po [pod 名称] logs client` 查看 client 容器名称日志
- 选择最近模式：`k1s po [pod 名称] logs client 10` 查看 client 容器最近10条日志

实例操作：

```sh
# 普通模式
k1s po kube-cc-7789c5f6d6-szqwk logs
# 最近模式
k1s po kube-cc-7789c5f6d6-szqwk logs 10
# 选择模式
k1s po kube-cc-7789c5f6d6-szqwk logs client
# 选择最近模式
k1s po kube-cc-7789c5f6d6-szqwk logs client 10
```

- 查看多容器 pod 的日志，有选择性查看容器日志。

### .7.3. 进入容器

> 别名：exec, auto, e

**参数：**

- pod名称：`kube-cc-7789c5f6d6-szqwk`
- 容器名称：`client`

**模式：**

> 共四种模式操作

- 普通模式：`k1s exec [pod 名称]`
- 普通选择模式：`k1s exec [pod 名称] client` 进入 `client` 容器内
- 便捷模式：`k1s po [pod 名称] exec`
- 选择便捷模式：`k1s po [pod 名称] exec client` 进入 client 容器内
  
```sh
# 普通模式
k1s exec kube-cc-7789c5f6d6-szqwk
# 普通选择模式
k1s exec kube-cc-7789c5f6d6-szqwk client
# 便捷模式
k1s po kube-cc-7789c5f6d6-szqwk exec
# 选择便捷模式
k1s po kube-cc-7789c5f6d6-szqwk exec client
```

### .7.4. 资源操作

只列举常用的几种资源，其它资源查找大同小异。

- nodes
- pods
- deployments
- daemonsets
- services

支持的 action 动作：

- list 列表，默认值
- wide 更多显示
- like 模糊查找
- yaml 显示 yaml
- desc 显示详情
- exec 进入容器
- delete 删除资源
- log 日志

#### .7.4.1. nodes 资源

> 别名：nodes, node, no

**参数：**

- `kube` node 节点的前缀名称
- `kube-10` node 节点完整名称

**模式：**

- 普通模式: `k1s no`
- 模糊搜索模式: `k1s no [关键字] like`
- 单模式: `k1s no [节点名称]`
- YAML 模式: `k1s no [节点名称] yaml`
- 详情模式: `k1s no [节点名称] desc`

```sh
# 普通模式
k1s no
# 模糊搜索模式 ->  模糊查找含有 kube 的节点名称
k1s no kube like
# 单模式 -> 显示单个资源
k1s no kube-10
# YAML 模式  -> 查看资源的 YAML
k1s no kube-10 yaml
# 详情模式 -> 查看资源的 describe 详细
k1s no kube-10 desc
```

#### .7.4.2. pods 资源

> 别名：pods, po, ps

**参数：**

- `kube-box` pod 前缀名称
- `kube-box-685fb75bb-cvmgz` pod 的完整名称

**模式：**

- 普通模式: `k1s po`
- 模糊搜索模式: `k1s po [关键字] like`  模糊查找含有 kube 的节点名称
- 单模式: `k1s po [pod名称]`
- YAML 模式: `k1s po [pod名称] yaml`
- 详情模式: `k1s po [pod名称] desc`
- 删除模式: `k1s po [pod名称] delete`


```sh
# 普通模式 -> 简约列表
k1s po
# 模糊搜索模式 -> 模糊查找资源列表 
k1s po kube-box like
# 单模式 -> 显示单个资源
k1s po kube-box-685fb75bb-cvmgz
# YAML 模式 -> 查看资源的 YAML
k1s po kube-box-685fb75bb-cvmgz yaml
# 详情模式 -> 查看资源的 describe 详细
k1s po kube-box-685fb75bb-cvmgz desc
# 删除模式
k1s po kube-box-685fb75bb-cvmgz delete
```

#### .7.4.3. deployments 资源

> 别名：deployments, deploy, d

**参数：**

- `kube` deploy 前缀名称
- `kube-box` deploy 的完整名称

**模式：**

- 普通模式: `k1s d`
- 模糊搜索模式: `k1s d [关键字] like`  模糊查找含有 kube 的节点名称
- 单模式: `k1s d kube-box`
- YAML 模式: `k1s d kube-box yaml`
- 详情模式: `k1s d kube-box desc`

```sh
# 普通模式 -> 简约列表
k1s d
# 模糊搜索模式 -> 模糊查找资源列表 
k1s d kube-box like
# 单模式 -> 显示单个资源
k1s d kube-box
# YAML 模式 -> 查看资源的 YAML
k1s d kube-box yaml
# 详情模式 -> 查看资源的 describe 详细
k1s d kube-box desc
```

#### .7.4.4. daemonsets 资源

> 别名：daemonsets, ds

**参数：**

- `kube` daemonsets 前缀名称
- `kube-proxy` daemonsets 的完整名称

**模式：**

- 普通模式: `k1s ds`
- 模糊搜索模式: `k1s ds [关键字] like`  模糊查找含有 kube 的节点名称
- 单模式: `k1s ds [daemonset 名称]`
- YAML 模式: `k1s ds [daemonset 名称] yaml`
- 详情模式: `k1s ds  [daemonset 名称] desc`

```sh
# 普通模式 -> 简约列表
k1s ds
# 模糊搜索模式 -> 模糊查找资源列表 
k1s ds kube like
# 单模式 -> 显示单个资源
k1s ds kube-proxy
# YAML 模式 -> 查看资源的 YAML
k1s ds kube-proxy yaml
# 详情模式 -> 查看资源的 describe 详细
k1s ds kube-proxy desc
```

#### .7.4.5. services 资源

> 别名：services, svc

**参数：**

- `kube` daemonsets 前缀名称
- `kube-dns` daemonsets 的完整名称

**模式：**

- 普通模式: `k1s svc`
- 模糊搜索模式: `k1s svc [关键字] like`  模糊查找含有 kube 的节点名称
- 单模式: `k1s svc [service名称]`
- YAML 模式: `k1s svc [service名称] yaml`
- 详情模式: `k1s svc [service名称] desc`

```sh
# 普通模式 -> 简约列表
k1s svc
# 模糊搜索模式 -> 模糊查找资源列表 
k1s svc kube like
# 单模式 -> 显示单个资源
k1s svc kube-dns
# YAML 模式 -> 查看资源的 YAML
k1s svc kube-dns yaml
# 详情模式 -> 查看资源的 describe 详细
k1s svc kube-dns desc
```

#### .7.4.6. 清理垃圾

```sh
# 查看不同空间下统计的错误信息
k1s clean 

# 清理指定空间下的错误信息
k1s clean dev
```

## .8. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)