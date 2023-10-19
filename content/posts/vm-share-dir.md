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

# 共享目录生效
vmhgfs-fuse /mnt/hgfs/

# 设置软链
mkdir /opt/vm-share

ln -s /mnt/hgfs/vm-share/ /opt/vm-share
```

## 设置开机启动

```sh
cat >> /etc/rc.local <<EOF
vmhgfs-fuse /mnt/hgfs/
EOF
```
