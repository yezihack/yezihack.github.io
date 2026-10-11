---
title: "Vmware 虚拟机共享宿主机文件夹"
date: 2023-10-19T17:37:26+08:00
lastmod: 2023-10-19T17:37:26+08:00
draft: false
tags: ["linux", "虚拟机", "工具"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 设置共享目录

> 前提：必须关闭虚拟机，再点击设置

如图所示：

![20231019194613](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20231019194613.png)

## 2. 使用共享目录

```sh
# 安装 open-vm-tools
yum install -y open-vm-tools

# 共享目录生效 (只允许root用户访问，docker挂载就会出现权限不足)
vmhgfs-fuse /mnt/hgfs/

# 解决其它用户也能访问 两个参数各自的作用
# allow_other：解除"只有挂载者能访问"的限制，允许其他 uid（包括 999）访问。这是解决问题的关键。
# umask=022：让文件显示为 644、目录为 755，其他人可读但不可写。这顺带解决了 my.cnf 全局可写（777）会被 MySQL 忽略的问题。
# uid=0,gid=0：声明文件属主显示为 root，保持原样。
vmhgfs-fuse .host:/ /mnt/hgfs -o allow_other,uid=0,gid=0,umask=022


# 设置软链
mkdir /opt/vm-share

ln -s /mnt/hgfs/vm-share/ /opt/vm-share
```

## 3. 设置开机启动

```sh
cat >> /etc/rc.local <<EOF
vmhgfs-fuse /mnt/hgfs/
EOF
```
