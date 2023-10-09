---
title: "云运维笔记(4) Kubernetes  NFS 搭建 PVC"
date: 2022-10-27T10:57:00+08:00
lastmod: 2022-10-27T10:57:00+08:00
draft: true
tags: ["linux", "教程", "云运维笔记", "nfs", "pvc"]
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

- [.1. 什么是NFS](#1-什么是nfs)
- [.2. 安装](#2-安装)
- [.3. 配置](#3-配置)
- [.4. 配置生效](#4-配置生效)
- [.5. 检查 nfs 共享目录](#5-检查-nfs-共享目录)
- [.6. 查看统计](#6-查看统计)
- [.7. 测试](#7-测试)
- [.8. 安全问题](#8-安全问题)
- [.9. PV/PVC](#9-pvpvc)
  - [.9.1. 创建 PV](#91-创建-pv)
  - [.9.2. 创建 PVC](#92-创建-pvc)
- [.10. 使用 PVC 实例](#10-使用-pvc-实例)
- [.11. 参考](#11-参考)
- [.12. 关于作者](#12-关于作者)

<!-- /TOC -->
## .1. 什么是NFS

网络文件系统（英语：Network File System，缩写作 NFS）是一种分布式文件系统，力求客户端主机可以访问服务器端文件，并且其过程与访问本地存储时一样，它由Sun微系统（已被甲骨文公司收购）开发，于1984年发布

## .2. 安装

1. rpcbind 是用于通信传输。
2. nfs-utils 是 nfs 的客户端。

```sh
# 服务端
$ yum install -y nfs-utils rpcbind
# 客户端
$ yum install -y nfs-utils
```

## .3. 配置

nfs 配置文件默认在 /etc/exports

- 使用 root 权限配置：

```sh
mkdir -p /data/nfsdata

/data/nfsdata 192.168.0.0/24(rw,sync,no_subtree_check)

# or

/data/nfsdata 192.168.0.0/24(rw,sync)

# 多个IP段, 以空格隔开
/data01/nfsdata/pv01 172.1.100.0/24(rw,no_root_squash,no_all_squash,sync) 192.168.1.0/24(rw,no_root_squash,no_all_squash,sync)
```

- 使用自定义用户权限配置：
  
创建用户组与用户名

```sh
# 创建指定组=nfs，指定groupID=1100
groupadd -g 1100 nfs
# 创建 nfs 用户，-s /sbin/nologin 不允许登陆，-u 指定userID, -g 使用指定groupID
useradd -M -s /sbin/nologin -u 1100 -g 1100 nfs 
```

配置 /etc/exports

```sh
mkdir -p /data/nfsdata
/data/nfsdata/ 192.168.9.0/24(rw,sync,all_squash,anonuid=1100,anongid=1100)
```

参数说明：

| **nfs共享参数** | **参数作用** |
| --- | --- |
| rw* | 读写权限 |
| ro | 只读权限 |
| sync* | 同时将数据写入到内存与硬盘当中保证不丢失数据 |
| async | 优先将数据保存到内存，然后在写入硬盘，这样效率更高：但可能会丢失数据 |
| root_squash | 当NFS客户端以root管理员访问时，映射为NFS服务器的匿名用户(不常用) |
| no_root_squash | 当NFS客户端以root管理员访问时，映射为NFS服务器的root管理员(不常用) |
| no_all_squash | 无论NFS客户端使用什么账户访问，都不进行压缩（ kvm热迁移 ） |
| all_squash | 无论NFS客户端使用什么账户访问，均映射为NFS服务器的匿名用户(常用) |
| no_subtree_check | 防止子树检查，即禁用客户端挂载允许的子目录所需的安全验证。 |
| anonuid* | 配置all_squash使用,指定NFS的用户UID,必须存在系统 |
| anongid* | 配置all_squash使用,指定NFS的组的UID,必须存在系统 |

## .4. 配置生效

1. -v：查看本机所有NFS共享
1. -r：重读配置文件并共享目录
1. -a：输出本机所有共享
1. -au：停止本机所有共享

```sh
# 使得"exports"文件生效.
exportfs –avr
```

## .5. 检查 nfs 共享目录

```sh
# 本机
showmount -e localhost
# 远程机器
showmount -e 192.168.9.100
```

## .6. 查看统计

nfsstat 查看统计状态

```sh
# 查看客户端请求数据统计
nfsstat -c 
```

## .7. 测试

```sh
# 格式
mount -t nfs -o options host:/remote/export /mnt/test10

# 实际
mount -t nfs -o rw 192.168.9.100:/data/nfsdata/ /mnt/test10
```

## .8. 安全问题

`no_root_squash`: 登入到 NFS 主机的用户如果是 ROOT 用户,他就拥有 ROOT 的权限,此参数很不安全,建议不要使用.

解决：使用指定的 root_squash

## .9. PV/PVC

> PV 与 PVC 是一对一的关系。

**AccessModes（访问模式）：**

AccessModes 是用来对 PV 进行访问模式的设置，用于描述用户应用对存储资源的访问权限，访问权限包括下面几种方式：

- ReadWriteOnce（RWO）：单路读写权限，但是只能被单个节点挂载
- ReadOnlyMany（ROX）：多路只读权限，可以被多个节点挂载
- ReadWriteMany（RWX）：多路读写权限，可以被多个节点挂载

**RECLAIM POLICY（回收策略）：**

目前 PV 支持的策略有三种：

- Retain（保留）： 保留数据，需要管理员手工清理数据
- Recycle（回收）：清除 PV 中的数据，效果相当于执行 rm -rf /ifs/kuberneres/*
- Delete（删除）：与 PV 相连的后端存储同时删除
  
**STATUS（状态）：**

一个 PV 的生命周期中，可能会处于4中不同的阶段：

- Available（可用）：表示可用状态，还未被任何 PVC 绑定
- Bound（已绑定）：表示 PV 已经被 PVC 绑定
- Released（已释放）：PVC 被删除，但是资源还未被集群重新声明
- Failed（失败）： 表示该 PV 的自动回收失败

### .9.1. 创建 PV

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv01  # PV 的名称
spec:
  capacity:
    storage: 1Ti  # 设置存储空间大小
  accessModes: # 设置访问模型   
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain # 回收策略
  storageClassName: "nfs-block"
  nfs:
    server: 192.168.9.100 # NFS 服务端
    path: "/data/nfsdata/pv01/" # NFS 服务端的物理目录
```

### .9.2. 创建 PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-pvc01
  namespace: 空间名称
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: "nfs-block"
  resources:
    requests:
      storage: 1Ti
  volumeName: nfs-pv01
```

## .10. 使用 PVC 实例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-box
  namespace: ai-poc
spec:
  selector:
    matchLabels:
      app: ai-box
  replicas: 1
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: ai-box
    spec:
      containers:
        - name: client
          image: sgfoot/kube-box:0.3.0
          resources:
            requests:
              cpu: 100m
              memory: 100Mi
            limits:
              cpu: 100m
              memory: 100Mi
          ports:
            - containerPort: 80
              name: client
          volumeMounts:
            - name: nfs-vol # volumes 名称 
              mountPath: /data # 容器内映射的目录
              subPath: "box-data" # NFS 物理映射的目录，NFS 存储目录 /data/nfsdata/pv01/ 下的子目录，完整：/data/nfsdata/pv01/box-data
      volumes:
        - name: nfs-vol # volumes 名称 
          persistentVolumeClaim:
            claimName: nfs-pvc01 # PVC 的名称
      restartPolicy: Always
```

## .11. 参考

1. [搭建 NFS 服务器](https://kubesphere.io/zh/docs/v3.3/reference/storage-system-installation/nfs-server/)
2. [解决客户端showmount时报错](https://blog.csdn.net/sean908/article/details/89208550)
3. <https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/>


## .12. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
