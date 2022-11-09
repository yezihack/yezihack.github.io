---
title: "Kubernetes PVC (3)"
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

## 什么是NFS

网络文件系统（英语：Network File System，缩写作 NFS）是一种分布式文件系统，力求客户端主机可以访问服务器端文件，并且其过程与访问本地存储时一样，它由Sun微系统（已被甲骨文公司收购）开发，于1984年发布

## 安装

1. rpcbind 是用于通信传输。
2. nfs-utils 是 nfs 的客户端。

```sh
# 服务端
$ yum install -y nfs-utils rpcbind
# 客户端
$ yum install -y nfs-utils
```

## 配置

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

## 配置生效

1. -v：查看本机所有NFS共享
1. -r：重读配置文件并共享目录
1. -a：输出本机所有共享
1. -au：停止本机所有共享

```sh
# 使得"exports"文件生效.
exportfs –avr
```

## 检查 nfs 共享目录

```sh
# 本机
showmount -e localhost
# 远程机器
showmount -e 192.168.9.100
```

## 查看统计

nfsstat 查看统计状态

```sh
# 查看客户端请求数据统计
nfsstat -c 
```

## 测试

```sh
# 格式
mount -t nfs -o options host:/remote/export /mnt/test10

# 实际
mount -t nfs -o rw 192.168.9.100:/data/nfsdata/ /mnt/test10
```

## 安全问题

`no_root_squash`: 登入到 NFS 主机的用户如果是 ROOT 用户,他就拥有 ROOT 的权限,此参数很不安全,建议不要使用.

解决：使用指定的 root_squash

## 参考

1. [搭建 NFS 服务器](https://kubesphere.io/zh/docs/v3.3/reference/storage-system-installation/nfs-server/)
2. [解决客户端showmount时报错](https://blog.csdn.net/sean908/article/details/89208550)

## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
