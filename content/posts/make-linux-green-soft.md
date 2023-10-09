---
title: "linux 制作绿色安装包"
date: 2020-11-16T17:51:10+08:00
lastmod: 2020-11-16T17:51:10+08:00
draft: false
tags: ["PATH", "linux", "工具", "绿色"]
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

> 绿色安装包的概念来自于 win 的概念, 也就是说无需安装即可使用软件. 即为绿色安装包. 在 linux 为了方便, 我们也需要制作绿色安装包, 方便相同系统之间的 copy. 即高效又好用. 何乐不为.



## 你将了解到

1. `LD_LIBRARY_PATH` 的概念
2. `ldd` 是什么东西
3. 如何制作绿色安装包



## 安装 mediainfo

> 在 CentOS7 192.168.1. 100 机器上操作.

```sh
yum -y install mediainfo
```



## 制作ldd打包脚本

> 本脚本用于将 `mediainfo` 所依赖的动态库或依赖文件都复制出来
>
> 文件名:pack.sh

```sh
#!/bin/bash
set +x
# 需要打包的命令全路径 
file_path=$1
# 需要复制的目录
target_dir=$2

# check file path
if [ ! -f $file_path ];then 
    echo "$file_path is not file"
    exit 0
fi 
# 判断目录是否为空
if [ -z $target_dir ]; then
    echo "target_dir is null"
    exit 0
fi 
# 目录不存在,自动创建
if [ ! -d $target_dir ];then 
    mkdir -p $target_dir
fi
list=$(ldd $file_path | awk '{print $3}')
for name in $list
do
    if [ -f $name ];then 
    cp $name $target_dir
fi
done
```



## 打包成绿色软件包

> 在 CentOS7 192.168.1. 100 机器上操作.

```sh
# 1. 查找 mediainfo 执行文件的路径
whereis mediainfo
# mediainfo: /usr/bin/mediainfo

# 2. 创建绿色安装包文件夹
mkdir -p ~/mediainfo-green/{lib,bin}
cp /usr/bin/mediainfo ~/mediainfo-green/bin

# 3. 复制依赖包 lib
./pack.sh /usr/bin/mediainfo ~/mediainfo-green/lib

# 4. 打包, 使用 zip打包, -r 递归, -y 保留软链
zip -ry mediainfo-green.zip ~/mediainfo-green/
 
```



## LD_LIBRARY_PATH 作用

1. LD_LIBRARY_PATH 是 Linux 环境变量

2. 以便**程序加载运行时**能够自动找到需要的动态链接库。

3. 除了系统默认路径之外的其他路径

## 移植操作

> 在 CentOS7 192.168.1. 101 机器上操作.
>
> 将 mediainfo-green.zip 移植到 101 机器上

```sh
cd ~
unzip mediainfo-green.zip
# 设置 LD_LIBRARY_PATH
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:~/mediainfo-green/lib

export PATH=$PATH:~/mediainfo-green/bin/

# 直接使用即可.
mediainfo
```

让环境变量永久生效

```sh
vim ~/.bashrc
# 设置 LD_LIBRARY_PATH
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:~/mediainfo-green/lib
# 设置 path
export PATH=$PATH:~/mediainfo-green/bin/
```



## 一键绿色打包

```sh
wget http://s1.sgfoot.com/sh/pack.sh
chmod +x pack.sh
./pack.sh
```

