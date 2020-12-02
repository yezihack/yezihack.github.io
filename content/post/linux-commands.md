---
title: "Linux 命令集"
date: 2020-07-06T18:07:38+08:00
lastmod: 2020-07-06T18:07:38+08:00
draft: false
tags: ["linux", "命令"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 文件类

### 查看文件大小

```sh
# 加 h 查看可读性的文件大小
ll -h 
# 查看文件夹大小
# --max-depth=1 表示查看文件夹的一层
du -h --max-depth=1 /usr
```

### 压缩

**ZIP**

- `-r `递归处理，将指定目录下的所有文件和子目录一并处理。
- `-y` 直接保存符号连接，而非该连接所指向的文件，本参数仅在UNIX之类的系统下有效。
- `-v` 显示指令执行过程或显示版本信息。
- `-j` 只保存文件名称及其内容，而不存放任何目录名称。
- `-b` 添加注释 
- `-u` 更新文件

```sh
# 压缩
# target.zip 是压缩后的文件名
# source-dir 要压缩的文件夹名
zip -r target.zip source-dir

# 压缩保留软链, 只对类 unix 系统有效
# -y 保留软链
zip -ry target.zip source-dir

# 压缩带注释
zip -ryb target.zip source-dir

# 解压
unzip target.zip

# 查看压缩文件, 不压缩
unzip -v target.zip
unzip -l test.zip # 可以看到压缩包中的文件名，日期等信息

# 解压到指定文件夹 -d 指定文件夹
unzip target.zip -d target-dir/

# 自定义压缩率(1~9) 越高越耗时
zip -r8 target.zip target-dir/

# 向压缩包里更新文件
zip -u target.zip update/

# 压缩, 不带多余的目录
zip -rj target.zip target/
```

**tar**

- `-c` 创建压缩文档
- `-x` 解压压缩文档
- `-z` 是否需要用gzip压缩
- `-v` 压缩的过程中显示档案
- `-C` 解压到指定的目录
- `-f`  指定压缩文件

```sh
# 创建压缩文件
tar -zcvf target.tar.gz source/

# 解压缩文件
tar -zxvf target.tar.gz 

# 解压到指定文件夹
tar -zxvf target.tar.gz -C /usr/local/src/target

# 万能压缩
tar -xvf target.tar.gz

# 预览压缩(不解压)
tar -tvf target.tar.gz

# 压缩,排除其它文件
# 打包test目录下所有文件，排除以.log结尾的文件
# --exclude选项，支持通配符和正则表达式，因此也非常强大。
tar -zcvf target.tar.gz test/ --exclude=test/*.log

# 忽略.git文件
tar -zcvf target.tar.gz  test/ --exclude=*.git
```





## RPM

### 安装

`rpm -ivh rpm软件包`

###  搜索

`rpm -qa 搜索的名称`

### 卸载

`rpm -e rpm包名(搜索后的结果名称)`

## grep 

### 或的关系 

```
cat 1.txt |grep a |grep b
```

### 并集的关系 
```
cat 1.txt |grep -E "a" |grep -E "b"
```

## awk

提出内存大小
1. awk '{print $1}' 提出第1列的数据
2. sed -n '2p' 提出第二行的数据
```
free -m |awk '{print $3}' |sed -n '2p'
```



## curl

POST JSON请求

```
curl -H "Content-type:application/json" -X POST -d '{"name":"king"}' http://localhost/test
```



## 脚本

### 获取当前文件名

```sh
CUR_DIR="$PWD"
SCRIPTPATH="${CUR_DIR}/${0#*/}"
# OR
SCRIPTPATH="${PWD}/${0#*/}"
```



### 获取当前目录名

```sh
SCRIPTPATH=$(cd `dirname -- $0` && pwd)
```



![image-20201117193818034](http://img.sgfoot.com/b/20201117193827.png?imageslim)