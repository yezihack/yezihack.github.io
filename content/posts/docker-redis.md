---
title: "Docker笔记(七) 安装 Redis"
date: 2021-03-23T11:49:46+08:00
lastmod: 2021-03-23T11:49:46+08:00
draft: false
tags: ["docker", "docker教程", "教程", "脚本"]
categories: ["docker"]
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



## 下载镜像

```sh
docker search redis
docker pull redis # 下载最新的 redis
```



## 安装脚本

```sh
#!/bin/bash
################
# DOCKER 创建 Redis 实例
#
################

name=$1 # Docker 名称
home=$2 # 安装目录
port=6379 # 端口号
host="0.0.0.0" # 绑定HOST
password="123456" # 密码

# docker 名称必须输入
if test -z $name; then
	echo "docker name is null"
	exit 0
fi 

# 未设置安装目录则默认 /data/docker
if test -z $home;then
	home=/data/docker/
fi

# redis 存储目录
redis_home="${home}redis/"
# 持久化存储目录
append_home="${redis_home}data/"
# 配置存储目录
conf_home="${redis_home}conf/"
# 配置文件名
conf_filename="${conf_home}redis.conf"

# 目录为空则创建
if test ! -d ${redis_home}; then
	mkdir -p ${redis_home}
fi 
if test ! -d ${append_home}; then
	mkdir -p ${append_home}
fi 
if test ! -d ${conf_home};then
	mkdir -p ${conf_home}
fi 

cat > ${conf_filename} << EOF
bind ${host}
protected-mode no
appendonly yes 
requirepass ${password}
EOF

docker run --restart=always --name ${name} -p ${port}:6379 -v ${append_home}:/data -v ${conf_filename}:/etc/redis/redis.conf -d redis redis-server /etc/redis/redis.conf

echo "installed is ok!"
docker ps
```













## 关于我
我的博客：https://yezihack.github.io

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)