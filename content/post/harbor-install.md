---
title: "Harbor 安装（http&https）"
date: 2022-01-01T23:00:33+08:00
lastmod: 2022-01-01T23:00:33+08:00
draft: false
tags: ["kubernetes", "云原生", "安装", "GitOps"]
categories: ["云原生"]
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
<!-- TOC -->

- [前提准备](#%E5%89%8D%E6%8F%90%E5%87%86%E5%A4%87)
- [安装 Docker 和 Docker-Compose](#%E5%AE%89%E8%A3%85-docker-%E5%92%8C-docker-compose)
- [离线安装之非安全模式](#%E7%A6%BB%E7%BA%BF%E5%AE%89%E8%A3%85%E4%B9%8B%E9%9D%9E%E5%AE%89%E5%85%A8%E6%A8%A1%E5%BC%8F)
    - [下载安装软件](#%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85%E8%BD%AF%E4%BB%B6)
    - [编辑配置文件](#%E7%BC%96%E8%BE%91%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
    - [运行安装脚本](#%E8%BF%90%E8%A1%8C%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC)
    - [查看验证](#%E6%9F%A5%E7%9C%8B%E9%AA%8C%E8%AF%81)
    - [登陆 Harbor 管理页面](#%E7%99%BB%E9%99%86-harbor-%E7%AE%A1%E7%90%86%E9%A1%B5%E9%9D%A2)
    - [Docker 配置](#docker-%E9%85%8D%E7%BD%AE)
    - [Docker 登陆 harbor](#docker-%E7%99%BB%E9%99%86-harbor)
    - [测试上传镜像](#%E6%B5%8B%E8%AF%95%E4%B8%8A%E4%BC%A0%E9%95%9C%E5%83%8F)
- [生成自签名](#%E7%94%9F%E6%88%90%E8%87%AA%E7%AD%BE%E5%90%8D)
    - [生成证书颁发机构证书](#%E7%94%9F%E6%88%90%E8%AF%81%E4%B9%A6%E9%A2%81%E5%8F%91%E6%9C%BA%E6%9E%84%E8%AF%81%E4%B9%A6)
    - [生成服务器证书](#%E7%94%9F%E6%88%90%E6%9C%8D%E5%8A%A1%E5%99%A8%E8%AF%81%E4%B9%A6)
- [离线安装之安全模式](#%E7%A6%BB%E7%BA%BF%E5%AE%89%E8%A3%85%E4%B9%8B%E5%AE%89%E5%85%A8%E6%A8%A1%E5%BC%8F)
    - [下载安装软件](#%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85%E8%BD%AF%E4%BB%B6)
    - [向 Harbor 提供证书](#%E5%90%91-harbor-%E6%8F%90%E4%BE%9B%E8%AF%81%E4%B9%A6)
    - [编辑配置文件](#%E7%BC%96%E8%BE%91%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
    - [运行安装脚本](#%E8%BF%90%E8%A1%8C%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC)
    - [Docker 客户端使用证书](#docker-%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%BD%BF%E7%94%A8%E8%AF%81%E4%B9%A6)
    - [Docker 登陆测试](#docker-%E7%99%BB%E9%99%86%E6%B5%8B%E8%AF%95)
- [参考](#%E5%8F%82%E8%80%83)
- [关于作者](#%E5%85%B3%E4%BA%8E%E4%BD%9C%E8%80%85)

<!-- /TOC -->


## 1. 前提准备

1. harbor 2.4.1 版本
1. 基于 CentOS 7
1. 假设我们的 IP 是：192.168.100.8
1. 自定义域名: harbor.me
1. Harbor 安装目录：/data/harbor

## 2. 安装 Docker 和 Docker-Compose

参考：[https://sgfoot.com/docker-install.html](https://sgfoot.com/docker-install.html#docker-%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85)

## 3. 离线安装之非安全模式

> 分离线与在线安装。自由选择。offline 表示离线，online 表示在线。
> 本文选择离线安装

从 github 下载：[https://github.com/goharbor/harbor/releases](https://github.com/goharbor/harbor/releases)

选择对应的安装版本

### 3.1 下载安装软件

> 只配置 http，此步不配置 https，配置 https 往下看

```bash
# 下载离线包：
wget [https://github.com/goharbor/harbor/releases/download/v2.4.1/harbor-offline-installer-v2.4.1.tgz](https://github.com/goharbor/harbor/releases/download/v2.4.1/harbor-offline-installer-v2.4.1.tgz)

# 解压
tar -zxvf harbor-offline-installer-v2.4.1.tgz

# 复制配置文件
cd harbor
cp harbor.yml.tmpl harbor.yml
```

### 3.2 编辑配置文件

编辑 `vim harbor.yml` 文件

共5处修改。

```bash
# 5行，修改 hostname，可以是ip，域名，不建议使用 localhost, 127.0.0.1
hostname: 192.168.100.8

# 10行，修改端口，默认80，建议修改其它端口，此区修改为9900
http:
    port: 9900

# 此处不采用 https，建议注释掉 13～18行

# https related config
#https:
    # https port for harbor, default is 443
    # port: 443
    # The path of cert and key files for nginx
    # certificate: /your/certificate/path
    # private_key: /your/private/key/path

# 34行，修改 UI 界面的登陆密码,推荐随机16位密码。
# 在线随机密码：https://suijimimashengcheng.bmcx.com/
harbor_admin_password: 请替换您的密码

# 47行，修改 harbor 数据存储目录。默认 /data
data_volume: /data/harbor/data
```

### 3.3 运行安装脚本

```bash
# 创建目录和删除旧版本的镜像
./prepare

# 安装脚本，实际是通过 docker-compose up -d 进行安装 harbor 镜像的
./install
```

### 3.4 查看验证

```bash
# 查看安装的容器,必须在 harbor 目录，含有 docker-compose.yml 运行才有效
docker-compose ps 
```

### 3.5 登陆 Harbor 管理页面

<http://192.168.100.8:9900>

这里的 hostname 是指 `harbor.yml` 配置项 hostname 的值

用户名默认为 admin 和密码即是 `harbor.yml` 配置 harbor_admin_password 项

### 3.6 Docker 配置

> 客户端的 Docker

因为采用非安全模式，需要在客户端的 Docker 配置一个不安全项。

`vim /etc/docker/daemon.json`

```bash
{
    # 其它配置项
    ,"insecure-registries":["192.168.100.8:9900"]
}
```

不配置以上，则会报错：

```bash
Error response from daemon: Get https://192.168.100.8:9900/v2/: http: server gave HTTP response to HTTPS client
```

### 3.7 Docker 登陆 harbor

```bash
-> % docker login 192.168.100.8:9900
Username: admin
Password:
Login Succeeded

# 这里使用的帐号和密码与页面上使用的是一样的，也可以自建专属帐号进行登陆
```

### 3.8 测试上传镜像

Docker 推送与拉取命令格式

```bash
# 推送命令
    # 先打 tag
docker tag SOURCE_IMAGE[:TAG] 192.168.100.8:9900/library/REPOSITORY[:TAG]
    # 再推送
docker push 192.168.100.8:9900/library/REPOSITORY[:TAG]

# 拉取命令
docker pull 192.168.100.8:9900/library/REPOSITORY[:TAG]
```

测试一个简单的 nginx 镜像

```bash
# 推送

docker pull nginx:1.21.5

docker tag nginx:1.21.5 192.168.100.8:9900/library/nginx:1.21.5

docker push 192.168.100.8:9900/library/nginx:1.21.5

# 拉取

docker pull 192.168.100.8:9900/library/nginx:1.21.5
```

## 4. 生成自签名

> 💡 安全模式，即使用 https 签名方式访问，这样更加安全。
> 签名分 CA 机构购买或免费自签名
> 本文采用：生成自签名

自签名的域名，假定域名为：harhor.me

生成目录：`mkdir -p ~/cert`

### 4.1 生成证书颁发机构证书

生成CA证书私钥

```bash
openssl genrsa -out ca.key 4096
```

生成CA证书，10年有效期，也可以设置更长时间，将 3650 改成 36500，即 100 年

> 注意 harbor.me 修改自已定义的域名

```bash
openssl req -x509 -new -nodes -sha512 -days 3650 \
 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=harhor.me" \
 -key ca.key \
 -out ca.crt
```

### 4.2 生成服务器证书

生成私钥

```bash
openssl genrsa -out harhor.me.key 4096
```

生成证书签名请求(CSR)

> 注意 harbor.me 修改自已定义的域名

```bash
openssl req -sha512 -new \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=harhor.me" \
    -key harhor.me.key \
    -out harhor.me.csr
```

生成x509 v3扩展文件

> 注意 harbor.me 修改自已定义的域名

```bash
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harhor.me
EOF
```

使用 v3.ext 文件为您的 Harbor 主机生成证书

```bash
openssl x509 -req -sha512 -days 3650 \
    -extfile v3.ext \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -in harhor.me.csr \
    -out harhor.me.crt
```

全部证书列表,目录：`~/cert`

```bash
-rw-r--r--  1 root  staff   1.9K 12 31 17:59 ca.crt
-rw-r--r--  1 root  staff   3.2K 12 31 17:59 ca.key
-rw-r--r--  1 root  staff    17B 12 31 18:00 ca.srl
-rw-r--r--  1 root  staff   2.1K 12 31 18:00 harhor.me.crt
-rw-r--r--  1 root  staff   1.7K 12 31 18:00 harhor.me.csr
-rw-r--r--  1 root  staff   3.2K 12 31 17:59 harhor.me.key
-rw-r--r--  1 root  staff   228B 12 31 18:00 v3.ext
```

## 5 离线安装之安全模式

### 5.1 下载安装软件

```bash
# 下载离线包：
wget [https://github.com/goharbor/harbor/releases/download/v2.4.1/harbor-offline-installer-v2.4.1.tgz](https://github.com/goharbor/harbor/releases/download/v2.4.1/harbor-offline-installer-v2.4.1.tgz)

# 解压
tar -zxvf harbor-offline-installer-v2.4.1.tgz

# 复制配置文件
cd harbor
cp harbor.yml.tmpl harbor.yml
```

### 5.2 向 Harbor 提供证书

> 查看第4步骤生成的证书，目录：`ls -l ~/cert`

生成的 `harhor.me.csr` 和 `harhor.me.key` 复制到新的 /data/harbor/cert 目录下

```bash
mkdir -p /data/harbor/cert/

cp ~/cert/harhor.me.crt /data/harbor/cert/
cp ~/cert/harbor.me.key /data/harbor/cert/ 

```

### 5.3 编辑配置文件

> 需要配置 https 项

编辑 `vim harbor.yml` 文件

共5处修改。

```bash
# 5行，修改 hostname，可以是ip，域名，不建议使用 localhost, 127.0.0.1
hostname: 192.168.100.8

# 10行，修改端口，默认80，建议修改其它端口，此区修改为9900
http:
    port: 9900

# 此处不采用 https，建议注释掉 13～18行

# https related config
https:
    # https port for harbor, default is 443
    port: 443
    # The path of cert and key files for nginx
    certificate: /data/harbor/cert/harhor.me.crt
    private_key: /data/harbor/cert/harbor.me.key

# 34行，修改 UI 界面的登陆密码,推荐随机16位密码。
# 在线随机密码：https://suijimimashengcheng.bmcx.com/
harbor_admin_password: 请替换您的密码

# 47行，修改 harbor 数据存储目录。默认 /data
data_volume: /data/harbor/data
```

### 5.4 运行安装脚本

如何之前没有配置过非安全模式，运行以下即可

```bash
# 创建目录和删除旧版本的镜像
./prepare

# 安装脚本，实际是通过 docker-compose up -d 进行安装 harbor 镜像的
./install
```

之前配置过非安全模式，采用重启方式启动

```bash
# 清理配置数据，然后重建。不会清理镜像和用户信息。
./prepare

# 停止 docker 容器
sudo docker-compose down -v

# 启动服务
sudo docker-compose up -d 
```

### 5.5 Docker 客户端使用证书

将 crt 转换为 cert ，以供客户端的 Docker 使用

```sh
cd ~/cert/
openssl x509 -inform PEM -in harhor.me.crt -out harhor.me.cert
```

将 cert 和 key 文件复制到 Docker 配置目录下的 `certs.d`
> 找到自己的 Docker 配置目录。

```sh
mkdir -p /etc/docker/certs.d/harhor.me/

cp harhor.me.cert /etc/docker/certs.d/harhor.me/
cp harhor.me.key /etc/docker/certs.d/harhor.me/
cp ca.crt /etc/docker/certs.d/harhor.me/
```

### 5.6 Docker 登陆测试

```sh
# 先配置 host 
vim /etc/hosts
192.168.100.8 harhor.me

docker login harbor.me

```

## 参考

1. <https://www.wangxiaofeng.site/harbor-https-cert.html>
1. <https://goharbor.io/docs/1.10/install-config/configure-https/>

## 关于作者

我的博客：<https://sgfoot.com>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
