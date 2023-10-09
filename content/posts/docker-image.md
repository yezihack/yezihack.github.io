---
title: "Docker笔记(五) 镜像管理"
date: 2020-12-17T13:12:31+08:00
lastmod: 2020-12-17T13:12:31+08:00
draft: false
tags: ["docker", "docker教程", "教程"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: true
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "1334327077"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

> 镜像是 Docker 三大核心概念中最重要的
> Docker 三大核心:
>
> 1. 镜像
> 2. 容器
> 3. 仓库
>

## 镜像介绍

Docker 运行容器前需要本地存在对应的镜像, 如果镜像不存在, Docker 会尝试远程仓库里拉取. 默认为 Docker Hub 仓库.用户也可以自定义镜像仓库. 

### 获取镜像
`docker pull ubuntu:18.04`

1. 如果不指定TAG标签, 则拉取 `latest`标签, 如上面使用tag: 18.04
2. 镜像文件一般由若干层(layer)组成, 每一层由唯一的ID标记 : 63ca9dsd732a1 (实际完整ID包括 256比特, 64个十六进制字符组成)
3. 当不同镜像包括相同的层, 本地仅存储一份内容. 减少存储空间.
4. 以上`ubuntu:18.04` 相当于 `docker pull registry.hub.docker.com/ubuntu:18.04`. 默认注册服务器为 Docker Hub.
5. 有时需要代理服务来加速Docker镜像获取过程. 可能在docker 服务启时配置中增加`--registry-mirror=proxy_URL`, 如国内: `https://registry.docker-cn.com`

### 查看镜像
**列出本地镜像**

`docker images`

```sh
-> # docker images
REPOSITORY            TAG       IMAGE ID       CREATED       SIZE
mysql                 latest    ab2f358b8612   5 days ago    545MB
redis                 5.0.0     1babb1dde7e1   2 years ago   94.9MB
quay.io/coreos/etcd   v3.3.9    58c02f00d03b   2 years ago   39.2MB
```

**使用Tag命令添加镜像标签**

`docker tag mysql:latest mysqld:latest`

会多出一个镜像文件(mysqld:latest)

```sh
-> # docker images 
REPOSITORY            TAG       IMAGE ID       CREATED       SIZE
mysql                 latest    ab2f358b8612   5 days ago    545MB
mysqld                latest    ab2f358b8612   5 days ago    545MB
redis                 5.0.0     1babb1dde7e1   2 years ago   94.9MB
quay.io/coreos/etcd   v3.3.9    58c02f00d03b   2 years ago   39.2MB
```

**使用 inspect 命令查看镜像详细信息**

`docker inspect mysqld`

```sh
[
    {
        "Id": "sha256:ab2f358b86124c477cc1f91066d42ca15fb2da58f029aa3c4312de5b3ca02018",
        "RepoTags": [
            "mysql:latest",
            "mysqld:latest"
        ],
        "RepoDigests": [
            "mysql@sha256:365e891b22abd3336d65baefc475b4a9a1e29a01a7b6b5be04367fcc9f373bb7"
        ],
....
```

可以查看制作者, 适应架构, 各层的数字摘要

**history 命令查看镜像历史**

可以打印出此镜像创建过程, 每一层使用的命令. 

`docker history mysqld` 缩写版本命令行.

`docker history mysqld --no-trunc` 打印完整的命令.

```sh
-> # docker history mysqld
IMAGE          CREATED      CREATED BY                                      SIZE      COMMENT
ab2f358b8612   5 days ago   /bin/sh -c #(nop)  CMD ["mysqld"]               0B        
<missing>      5 days ago   /bin/sh -c #(nop)  EXPOSE 3306 33060            0B        
<missing>      5 days ago   /bin/sh -c #(nop)  ENTRYPOINT ["docker-entry…   0B        
<missing>      5 days ago   /bin/sh -c ln -s usr/local/bin/docker-entryp…   34B       
<missing>      5 days ago   /bin/sh -c #(nop) COPY file:f9202f6b715c0e78…   13.1kB    
<missing>      5 days ago   /bin/sh -c #(nop) COPY dir:2e040acc386ebd23b…   1.12kB    
<missing>      5 days ago   /bin/sh -c #(nop)  VOLUME [/var/lib/mysql]      0B        
<missing>      5 days ago   /bin/sh -c {   echo mysql-community-server m…   410MB     
<missing>      5 days ago   /bin/sh -c echo 'deb http://repo.mysql.com/a…   55B       
<missing>      5 days ago   /bin/sh -c #(nop)  ENV MYSQL_VERSION=8.0.22-…   0B        
<missing>      5 days ago   /bin/sh -c #(nop)  ENV MYSQL_MAJOR=8.0          0B        
<missing>      5 days ago   /bin/sh -c set -ex;  key='A4A9406876FCBD3C45…   2.61kB    
<missing>      5 days ago   /bin/sh -c apt-get update && apt-get install…   52.2MB    
<missing>      5 days ago   /bin/sh -c mkdir /docker-entrypoint-initdb.d    0B        
<missing>      5 days ago   /bin/sh -c set -eux;  savedAptMark="$(apt-ma…   4.17MB    
<missing>      5 days ago   /bin/sh -c #(nop)  ENV GOSU_VERSION=1.12        0B        
<missing>      5 days ago   /bin/sh -c apt-get update && apt-get install…   9.34MB    
<missing>      5 days ago   /bin/sh -c groupadd -r mysql && useradd -r -…   329kB     
<missing>      6 days ago   /bin/sh -c #(nop)  CMD ["bash"]                 0B        
<missing>      6 days ago   /bin/sh -c #(nop) ADD file:3a7bff4e139bcacc5…   69.2MB
```

### 查找镜像

`docker search nginx`

```sh
NAME                               DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
nginx                              Official build of Nginx.                        14163     [OK]       
jwilder/nginx-proxy                Automated Nginx reverse proxy for docker con…   1928                 [OK]
richarvey/nginx-php-fpm            Container running Nginx + PHP-FPM capable of…   797                  [OK]
linuxserver/nginx                  An Nginx container, brought to you by LinuxS…   133                  
jc21/nginx-proxy-manager           Docker container for managing Nginx proxy ho…   120                  
tiangolo/nginx-rtmp                Docker image with Nginx using the nginx-rtmp…   106                  [OK]
bitnami/nginx                      Bitnami nginx Docker Image                      91                   [OK]

```



1. 镜像名字
2.  描述
3. 收藏数（表示该镜像的受欢迎程度）
4. 是否官方创建
5. 是否自动创建

### 删除镜像

`docker rmi mysqld:latest`

也可以指定ID删除 .

**无法删除一个已经运行或退出的镜像, 也就是容器与镜像有依赖关系, 不建议删除.**

`docker run mysql echo "hello mysql"`

再执行删除命令.

`docker rmi mysql`

```sh
Error response from daemon: conflict: unable to remove repository reference "mysql" (must force) - container f33c302ee0f6 is using its referenced image ab2f358b8612
```

可以使用`-f`强制删除 

```sh
-> # docker rmi -f mysql
Untagged: mysql:latest
Untagged: mysql@sha256:365e891b22abd3336d65baefc475b4a9a1e29a01a7b6b5be04367fcc9f373bb7
```

### 清理镜像

`docker images prune`

使用Docker 一 段时间后， 系统中可能会遗留一些临时的镜像文件， 以及 一 些没有被使
用的镜像

1. `-a` 删除所有无用的镜像,不光是临时镜像
2. `-f` 强制删除镜像, 不进行确认.

## 创建镜像

### 基本已有镜像

先运行已有的镜像, 然后修改后,跟据ID保存

```sh
-> # docker run -it ubuntu:18.04 /bin/bash
root@4a6858ac4c0c:/# mkdir /data
root@4a6858ac4c0c:/data# touch README.md
root@4a6858ac4c0c:/data# echo "#sgfoot" > README.md
root@4a6858ac4c0c:/data# exit
```

保存新的镜像

`docker commit -m "README" -a "sgfoot" 4a6858ac4c0c ubuntu:0.1`

1. `-m` 提交消息
2. `-a` 作者信息
3. `-c, --change=[]` 提交的时候执行dockerfile指令
4. `-p` 提交时暂停容器运行.

### 基于Dockefile创建

> 最常见的方式,也是推荐方式.

创建 Dockerfile 文件 `touch Dockerfile`

```sh
FROM ubuntu:18.04

RUN mkdir /data && \
cd /data && \
touch ok.sh && \
echo "#!/bin/bash" >> ok.sh &&\
echo "top" >> ok.sh 

RUN chmod +x /data/ok.sh
CMD ["/data/ok.sh"]
```

创建镜像

`docker build -t top:1.0 . `

```sh
Sending build context to Docker daemon  2.048kB
Step 1/4 : FROM ubuntu:18.04
 ---> 2c047404e52d
Step 2/4 : RUN mkdir /data && cd /data && touch ok.sh && echo "#!/bin/bash" >> ok.sh &&echo "top" >> ok.sh
 ---> Using cache
 ---> c62e19182c3d
Step 3/4 : RUN chmod +x /data/ok.sh
 ---> Using cache
 ---> 5600216ffadb
Step 4/4 : CMD ["/data/ok.sh"]
 ---> Using cache
 ---> 6aab809b415d
Successfully built 6aab809b415d
Successfully tagged top:1.0

```

Successfully built 6aab809b415d 创建镜像产生的ID

运行容器

```sh
docker run -it -d --name top 6aab809b415d
```

测试容器

```sh
docker logs -f top
```



## 导入与导出镜像

> 使用 docker images 查看镜像列表. 

测试镜像信息

```sh
REPOSITORY              TAG       IMAGE ID       CREATED         SIZE
test/top                latest    f2b97b51ecab   4 seconds ago   65.6MB
```

### 导出镜像

> 如果需要跨操作系统, 请使用 `-o` 方式

```sh
docker save -o top_v1.tar f2b97b51ecab
#或者
docker save f2b97b51ecab > top_v1.1.tar
```

### 导入镜像

> 如果需要跨操作系统, 请使用 `-i` 方式

以下方式不能对载入的镜像重命名

```sh
docker load -i top_v1.tar
#或者
docker load < top_v1.tar
```

以下方式可以对载入的镜像重命名

```sh
docker import top_v1.tar sgfoot/top:v1
```

## 上传镜像

1. 先登陆 `docker login`

2. 再 push `docker push top:1.0`

   ```sh 
   # 可以先添加新的标签
   docker tag top:1.0 sgfoot/top:1.0
   docker push sgfoot/top:1.0
   ```

