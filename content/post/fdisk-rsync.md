---
title: "fdisk lvm对根目录扩容"
date: 2020-09-22T20:04:14+08:00
lastmod: 2020-09-22T20:04:14+08:00
draft: false
tags: ["linux", "fdisk"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

> 生产服务器根目录空间余量告急，你可能会选择对重装系统重装，这种方式对生产服务器不友好，也不推荐。网上你可以看到很多文章进行LVM进行根目录扩容，当然一顿猛操作后，发现无计于事，因为你的根目录挂载的磁盘根本不是LVM方式，无法这样操作。在不重装，也不影响线上生产，有没有一种方式可以实现动态扩容呢？答案：有

## 概要
1. 使用`rsync`命令带属性方式转移数据
2. 然后再使用`lvm`方式进行对某些目录进行重装挂载
3. 这样就可以扩出容量。

## LVM 原理

> LVM的工作原理其实很简单，它就是通过将底层的物理硬盘抽象的封装起来，然后以逻辑卷的方式呈现给上层应用

1. 掌握4个基本的逻辑卷概念

   1. PE(Physical Extend)  物理扩展（底层）
   2. PV(Physical Volume) 物理卷（底层）
   3. VG(Volume Group) 卷组
   4. LV(Logical Volume) 逻辑卷（上层）

2. 工作原理 

   1. ![image-20200922210127568](http://img.sgfoot.com/b/20200922210129.png?imageslim)

3. 常用命令操作

   ```shell
   # 格式为物理卷
   pvcreate /dev/vda1 [可以多个]
   pvdisplay #查看物理卷
   pvs #查看物理卷列表
   # 创建卷组
   vgcreate vg1 /dev/vda1 # vg1 是卷组名称， /dev/vda1 是分区名称
   vgdisplay # 查看卷组
   vgs # 查看卷组列表
   # 创建逻辑卷
   lvcreate -n lv1 -L 50G vg1 # lv1 是逻辑卷名称， 50G 是转成逻辑卷大小 vg1就是卷组
   lvdisplay # 查看逻辑卷信息
   lvs # 查看逻辑卷列表
   ```

   

## 实战

1. 查看你的磁盘分区信息(df -h)

![image-20200922200604067](http://img.sgfoot.com/b/20200922205021.png?imageslim)

2. 查看你的磁盘信息(fdisk -l)

![image-20200922200742131](http://img.sgfoot.com/b/20200922210928.png?imageslim)

3. 对指点磁盘进行分区操作(fdisk /dev/vdc 每个人的磁盘分区名称不一样)

![image-20200922201034206](http://img.sgfoot.com/b/20200922212117.png?imageslim)

4. 创建物理卷

![image-20200922201426094](http://img.sgfoot.com/b/20200922212126.png?imageslim)

5. 创建卷组

![image-20200922204409131](http://img.sgfoot.com/b/20200922211048.png?imageslim)

6. 创建逻辑卷

![image-20200922204533606](http://img.sgfoot.com/b/20200922211110.png?imageslim)

7. 对逻辑卷进行格式化 ext4

![image-20200922201958090](http://img.sgfoot.com/b/20200922211140.png?imageslim)

8. 挂载某目录

``` shell
# 1. 先创建一个备份的目录
mkdir -p /data/var_bak
# 2. 然后对 /var 进行带属性转移，注意斜杆后的点
rsync -aXS /var/. /data/var_bak/.
# 3. 删除/var内容，释放空间，这是关键步骤
rm -rf /var/*
# 4. 对/var进行挂载分区
mount /dev/root2/myroo2 /var
# 5. 添加到开机挂载
使用 blkid 命令查看分区的UUID进行挂载操作。这样更安全。
blkid |grep myroo2
vim /etc/fstab
# 输入以下内容
UUID="52e65e6c-b834-4509-8791-c0e1532a95b2" /var   ext4 defaults 0 0
# 6. 挂载完后，将之前备份的数据，再移过来
rsync -aXS /data/var_bak/. /var/.
```



## 参考

1. [centos 7 新增硬盘挂载分区，及扩容](https://blog.csdn.net/weixin_41558061/article/details/87286680)