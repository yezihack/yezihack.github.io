---
title: "Linux 命令集"
date: 2020-07-06T18:07:38+08:00
lastmod: 2021-03-05 T11:37:38+08:00
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



## 文本处理

### grep 

#### 或的关系 

```
cat 1.txt |grep a |grep b
```

#### 并集的关系 
```
cat 1.txt |grep -E "a" |grep -E "b"
```

#### 搜索多个文件内容

```sh
# 普通搜索
grep "搜索内容" *.conf

# 显示行号
grep -n "搜索内容" *.conf

# 显示上下文及行号
grep -n -C 10 "搜索内容" *.conf
```



### awk

提出内存大小
1. awk '{print $1}' 提出第1列的数据
2. sed -n '2p' 提出第二行的数据
```
free -m |awk '{print $3}' |sed -n '2p'
```





## 传输

### scp

> scp [参数] [原路径] [目标路径]

```sh
# 1. 从本地复制到远程目录
scp /opt/soft/demo.tar root@10.6.159.147:/opt/soft/scptest
# 2. 从本地递归复制整个目录到远程目录
scp -r /opt/soft/test root@10.6.159.147:/opt/soft/scptest

# 3. 从远程复制文件到本地
scp root@10.6.159.147:/opt/soft/demo.tar /opt/soft/
# 4. 从远程复制文件到本地 递归复制整个目录
scp -r root@10.6.159.147:/opt/soft/demo.tar /opt/soft/
```



### rsync

### curl

POST JSON请求

```
curl -H "Content-type:application/json" -X POST -d '{"name":"king"}' http://localhost/test
```



## 调试

### gdb

### pstack

### strace

## 查看进程及端口

### netstat 

```sh 
# 查看 tcp 所有的进程
netstat -nplt 
```



### lsof

1. 列出谁在使用某个端口

```sh
lsof -i :80 
```

2. 查找某个文件相关进程

```sh
lsof /bin/bash
```

3. 列出某个用户打开的文件信息

```sh
lsof -u root
```

4. **列出某个程序进程所打开的文件信息**

```sh
lsof -c mysql
```

5. 列出某个用户以及某个进程所打开的文件信息

```sh
lsof -u root -c mysql
```

6. 通过某个进程显示该进程打开的文件
```sh
lsof -p 11201
```

7. 列出所有网络连接
```sh
lsof -i 
# 列出tcp 
lsof -i tcp
```

8. 通过端口获取当前进程ID	

```sh
lsof -t -i:3306
```

9. 杀死进程

```sh
kill -9 $(lsof -t -i :3306)
```



## 监控&优化

### 工具合集

1. sysstat
   - iostat
   - mpstat
   - pidstat
   - tapestat
   - cifsiostat
   - sadf

```sh
# Linux 性能监视工具合集
yum -y install sysstat  
```



### free

查看内容情况

```sh
free -m # 显示以 km 为单位
free -g # 显示以 kg 为单位
```

释放缓冲内容

```sh
echo 3 > /proc/sys/vm/drop_caches
```

### ldd

查看程序依赖库

```sh
# 查看 nginx 执行命令 依赖库
ldd /usr/sbin/nginx
```

## 权限管理

```sh
# 创建用户组
groupadd work
# 创建用户并加入用户组
useradd work -g work # -g 加入用户组
# 创建不登陆的用户 
useradd -s /sbin/nologin bear
# 修改用户组权限
usermod -s /bin/bash bear
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



### 定时删除日志

```sh
#!/bin/sh
set -x

day=7

find /data/logs/ -mtime +${day} -exec rm -rf {} \;
```

高级级，支持多个目录。

```sh
#!/bin/bash
###################
# 功能：定时删除日志文件
# 作者：百里
# 时间：2021/03/25
###################

# 保留多少天
day=$1

shell_name=$(basename $0)

if [ -z $day ];then
    day=31
    echo "默认删除${day}天的日志,可以自定义过期天数.${shell_name} 7"
fi

# 日志列表,支持多个目录
logs_list=(
"/data/logs/"
)


# 删除方法
function rm_file() {
   dir_path=$1
   expired=$2
   if [ ! -d $dir_path ];then
	echo "${dir_path},目录不存在"
        return 10
   fi
   if [ -z $expired ];then
	echo "过期时间不能为空"
	return 11
   fi 
   logs=$(find $dir_path -mtime +${expired} -name "*.log")
   for log in ${logs[@]};do
	now=$(date +%F_%T)
	if test ! -f $log;then
		echo "${log} 文件不存在"
		continue
	fi 
	echo "${log} 已删除 in ${now}"
	rm -f $log	
   done
   return 0
}


# 执行
for item in ${logs_list[@]};do
	rm_file $item $day
	if [ $? -ne 0 ];then
		exit 0
	fi 
done
echo "successful!"
exit 0
```



## 其它

### 时间

```sh
#!/bin/bash
echo $(date +%F)
```

时间格式列表：

| `date +%c`       | locale’s date time                                | Sat May 9 11:49:47 2020 |
| ---------------- | ------------------------------------------------- | ----------------------- |
| `date +%x`       | locale’s date                                     | 05/09/20                |
| `date +%X`       | locale’s time                                     | 11:49:47                |
| `date +%A`       | locale’s full weekday name                        | Saturday                |
| `date +%B`       | locale’s full month name                          | May                     |
| `date +%m-%d-%Y` | MM-DD-YYYY date format                            | 05-09-2020              |
| `date +%D`       | MM/DD/YY date format                              | 05/09/20                |
| `date +%F`       | YYYY-MM-DD date format                            | 2020-05-09              |
| `date +%T`       | HH:MM:SS time format                              | 11:44:15                |
| `date +%u`       | Day of Week                                       | 6                       |
| `date +%U`       | Week of Year with Sunday as first day of week     | 18                      |
| `date +%V`       | ISO Week of Year with Monday as first day of week | 19                      |
| `date +%j`       | Day of Year                                       | 130                     |
| `date +%Z`       | Timezone                                          | PDT                     |
| `date +%m`       | Month of year (MM)                                | 05                      |
| `date +%d`       | Day of Month (DD)                                 | 09                      |
| `date +%Y`       | Year (YY)                                         | 2020                    |
| `date +%H`       | Hour (HH)                                         | 11                      |
| `date +%H`       | Hour (HH) in 24-hour clock format                 | 11                      |
| `date +%I`       | Hour in 12-hour clock format                      | 11                      |
| `date +%p`       | locale’s equivalent of AM or PM                   | AM                      |
| `date +%P`       | same as %p but in lower case                      | am                      |