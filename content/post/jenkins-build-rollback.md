---
title: "Jenkins 构建及回滚任务"
date: 2021-02-03T14:47:04+08:00
lastmod: 2021-02-03T14:47:04+08:00
draft: false
tags: ["工具", "jenkins", "golang"]
categories: ["工具"]
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



> 以 golang 构建项目为例。

![cicd](https://img.sgfoot.com/b/20210203173409.png?imageslim)



## 新建任务

1. 输入一个任务名称
2. 选择：构建一个自由风格的软件项目
3. 可选：也可以复制已创建的任务
4. 确定提交

![image-20210203153829359](https://img.sgfoot.com/b/20210203153838.png?imageslim)

![image-20210203153954925](https://img.sgfoot.com/b/20210203153955.png?imageslim)



## 配置

> 再次编辑刚创建的任务

![image-20210203154135859](https://img.sgfoot.com/b/20210203154136.png?imageslim)



### 描述

对你的项目进行描述，可以写如下信息。

1. 项目名称
2. 部署的IP地址
3. 部署远程的目录
4. 日志路径 
5. 配置目录及文件名称
6. 启动服务
7. 停止服务
8. 重启服务
9. 等等

![image-20210203171056828](https://img.sgfoot.com/b/20210203171058.png?imageslim)

## Job Notifications

参数化构建过程

> 构选： 参数化构建过程

1. GIT参数
   1. ![image-20210203171232726](https://img.sgfoot.com/b/20210203171234.png?imageslim)
2. 选项参数
   1. 配置“构建” 和 “回滚” 参数。供构建时选择
   2. ![image-20210203171306056](https://img.sgfoot.com/b/20210203171307.png?imageslim)
3. 字符参数
   1. 设置填写构建ID号。
   2. ![image-20210203171413932](https://img.sgfoot.com/b/20210203171415.png?imageslim)
   3. ![image-20210203171503041](https://img.sgfoot.com/b/20210203171504.png?imageslim)



### 源码管理

一般使用GIT，在 branches to build 指定分支使用变量 `${GIT_COMMIT}`,即参数化构建过程那一步使用的GIT参数名称

**填写有效的 GIT 地址。并使用授权的用户帐号，保证可以访问仓库代码。**

![image-20210203171635027](https://img.sgfoot.com/b/20210203171635.png?imageslim)

### 构建

会用到以下二个选项：

1. 执行Shell
2. Send files or execute commands over SSH

![image-20210203171832703](https://img.sgfoot.com/b/20210203171834.png?imageslim)

### 构建项目的SHELL

1. 定义变量
2. 删除或创建目录
3. 判断用户是“构建”还是“回滚”进行区别操作

![image-20210203172045718](https://img.sgfoot.com/b/20210203172046.png?imageslim)

源码：

```sh
set -x
# 定义名称
program_name=go_test
# 项目压缩名称
program_filename=${program_name}.tar.gz
# 项目路径 
target_path="${WORKSPACE}/target/"

# 备份路径
back_path="${WORKSPACE}/bak/"

if [ -f "${back_path}${program_filename}" ];then
	rm -f ${back_path}${program_filename}
fi 

ls -l $back_path

# 当前构建ID的路径
back_path_num="${back_path}${BUILD_NUMBER}"


# 删除前必须判断是否存在

if [ -f "${target_path}${program_filename}" ]; then 
	rm -rf "${target_path}${program_filename}"
    echo "${target_path}${program_filename} 删除成功"
fi 


# 备份路径不存在则创建
if [ ! -d ${back_path_num} ]; then 
	mkdir -p $back_path_num
    echo "$back_path_num 创建成功"
fi

# 项目路径不存在则创建
if [ ! -d ${target_path} ]; then 
	mkdir -p $target_path
    echo "$target_path 创建成功"
fi

# 配置 Go 环境
set CGO_ENABLED=0
set GOARCH=amd64
set GOOS=linux
export GO111MODULE=on
export GOPROXY=https://goproxy.cn,direct


case $status in 
	deploy)
     	echo "开始构建项目..."
        # 生成可执行文件
        /usr/local/go/bin/go build -mod=vendor -tags=jsoniter -o "${program_name}" .
        # 压缩打包
        tar -czf ${program_filename} --exclude=docs ${program_name}
        # 将压缩好的程序复制到备份文件夹里
        cp -f ${program_filename} ${back_path_num}
        # 将压缩好的程序复制到 target 文件里
        cp -f ${program_filename} ${target_path}
        # 将其删除压缩包和二进制文件
        rm -f ${program_filename}
        rm -f ${program_name}
        echo "构建完成"
    ;;
    
    rollback)
    	echo "版本回滚.回滚至 $version 版本"
        cd "${back_path}${version}"       
        # 将历史版本的文件复到项目目录里
    	cp -f * "${target_path}"
        # 回滚的版本也复制到当前版本的文件夹里，方便下次回滚。
        cp -f * "${back_path_num}"
    ;;
esac
```



### 复制到远程机器 SHELL

将 jenkins 打包好的文件复制到远程机器上。

![image-20210203172124561](https://img.sgfoot.com/b/20210203172125.png?imageslim)

*注意： Source files，填写 `target/go_test.tar.gz`， 即 target目录下的文件。*

源码：

```sh
set -x
# 项目名称
app_name=go_test
app_name_tar=${app_name}.tar.gz
# 项目路径
app_path=/data/work/
# 源文件目录
origin_path=/root/target/
# 源文件
origin_filename=${origin_path}${app_name}

# 进入到源文件目录 
cd ${origin_path}
# 解压文件
tar -xzvf ${app_name}
# 添加执行权限
chmod +x ${app_name}
# 将执行文件复制到项目路径下
cp ${app_name} ${app_path}

# 复制完后，删除源始文件
if [ -f "${origin_filename}" ];then 
   rm -f ${origin_filename}
  echo "${origin_filename} delete success"
fi 
# 写上你启动程序的代码。

echo "completed"
```



### 维护备份 SHELL

jenkins 里的备份不可能无限的使用，否则磁盘会无法使用。必须对备份的目录进行维护。

我们可以设置保留 10 个版本的数据。

![image-20210203172414790](https://img.sgfoot.com/b/20210203172415.png?imageslim)

源码：

```sh
# 项目备份不可能无限备份。保留 10 个版本的历史数据。
reserved_num=10  #保留文件数
file_dir=${WORKSPACE}/bak/
date=$(date "+%Y%m%d-%H%M%S")

cd $file_dir   #进入备份目录
file_num=$(ls -l | grep '^d' | wc -l)   #当前有几个文件夹，即几个备份

while(( $file_num > $reserved_num ))
do
    old_file=$(ls -rt | head -1)         #获取最旧的那个备份文件夹
    echo  $date "Delete File:"$old_file
    rm -rf "${file_dir}$old_file"
    let "file_num--"
done 

ls -l $file_dir
```



## 发布操作

### 构建

1. 选择: Build with Parameters
2. 选择分支
3. 选择 status

![image-20210203172706624](https://img.sgfoot.com/b/20210203172707.png?imageslim)

### 回滚

1. 选择: Build with Parameters
2. 选择 status: rollback
3. 设置 version 版本号

![image-20210203172929159](https://img.sgfoot.com/b/20210203172930.png?imageslim)



## 总结

Jenkins 保证了项目的持续集成与构建，加速了项目构建过程，保证人为干扰。

版本回滚对于线上的业务是必不可少的一个功能，一旦线上异常需要马上回滚版本。容不得任何时间耽搁。




![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)
















![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)