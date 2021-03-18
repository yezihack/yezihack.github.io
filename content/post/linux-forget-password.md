---
title: "linux 忘记密码"
date: 2021-03-03T15:57:12+08:00
lastmod: 2021-03-03T15:57:12+08:00
draft: false
tags: ["linux", "技巧"]
categories: ["linux"]
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



## 启动

1. 使用上下键选择不同的内核（可能有些机器就只有一个内核）
2. 选中内核后，按`e` 键进入编辑状态

![image-20210303160002306](https://img.sgfoot.com/b/20210303160003.png?imageslim)

## 编辑

1. 以下内容都是可以编辑，添加或删除的代码。（谨慎操作）

![image-20210303160104283](https://img.sgfoot.com/b/20210303160105.png?imageslim)

2. 找到`linux16`的字符串， 然后再在本行中找到`ro`的字母，将其替换成`rw init=/sysroot/bin/sh` 
3. 然后按`ctrl+x`组合键，系统进入emergency(紧急情况)模式

![image-20210303160719076](https://img.sgfoot.com/b/20210303160720.png?imageslim)

4. ```sh
   chroot /sysroot/ # 切换回原始系统
   LANG=en # 如果出现方块，不是字母的情况下设置成英文语言
   passwd root # 对 root 修改密码
   touch /.autorelabel # 使SELinux生效，密码生效
   exit # 退出
   reboot # 重启命令
   ```

![image-20210318192331000](https://img.sgfoot.com/b/20210318192332.png?imageslim)



![image-20210318191741120](https://img.sgfoot.com/b/20210318191749.png?imageslim)



## 关于我
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)