---
title: "云运维笔记(11) Etcd V3.4 集群二进制搭建"
date: 2023-05-16T11:24:46+08:00
lastmod: 2023-05-16T11:24:46+08:00
draft: false
tags: ["k8s", "etcd", "etcd-3.4"]
categories: ["云运维笔记"]
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

## 1. 准备工作

- 适合于 kubernetes 1.17/1.18/1.19/1.20/1.21


搭建 ETCD 高可用集群，至少3台或5台或7台，奇数台即可。本地搭建采用3台 Linux CentOS7.9 环境。

| 序列  | HOSTNAME| IP | etcd 节点名称
| ---| ---| ---|---|
| 1 | kube-10 | 192.168.9.10| etcd01
| 2 | kube-11 | 192.168.9.11| etcd02
| 3 | kube-13 | 192.168.9.13| etcd03

创建目录：

- bin 存储 etcd 二进制文件
- data 存储数据目录
- conf 配置目录
- sh 脚本目录
- ssl 证书目录

```sh
# 每个机器上都执行
mkdir -p /opt/etcd-3.4/{bin,data,sh,ssl,conf}
```

## 时间同步

```sh
# 安装
yum install chrony -y

# 管理
systemctl start chronyd      #启动
systemctl status chronyd    #查看
systemctl restart chronyd   #重启
systemctl stop chronyd      #停止

systemctl enable chronyd 　　  #设置开机启动

# 修改时区
timedatectl set-timezone Asia/Shanghai

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep
```

设置与指定服务器时间同步

```sh
vim /etc/chrony.conf

server ntp1.aliyun.com iburst # 添加这一行，表示与本机同步时间，其它机器都填写这个地址。

systemctl restart chronyd   #重启
```

同步时间

```sh
# 查看当前系统时区
timedatectl

# 命令行模式查看时间同步源 　　
chronyc sources -v

# 查看时间同步源状态： 
chronyc sourcestats -v

# 校准时间服务器
chronyc tracking
```

设置完后，使用 `date` 三台服务器必须时间一致。否则 etcd 会受影响。

## 2. 证书生成

### 2.1. cfssl 工具

```sh
cd /opt/src
# 下载
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64

# 改名
mv cfssl_linux-amd64 cfssl
mv cfssljson_linux-amd64 cfssljson
mv cfssl-certinfo_linux-amd64 cfssl-certinfo

# 添加执行权限
chmod +x cfssl cfssljson cfssl-certinfo

# 复制到 /usr/local/bin
cp cfssl cfssl-cerinfo cfssljson /usr/local/bin
```

### 2.2. 生成 json 配置

```sh
cd /opt/src/certs

# 生成默认配置
cfssl print-defaults config > ca-config.json 
cfssl print-defaults csr > ca-csr.json
```

修改 ca-csr.json 文件

```sh
{
  "CN": "CA",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "etcd",
      "OU": "System"
    }
  ]
}
```

生成 ca 相关证书：

```sh
-> # cfssl gencert -initca ca-csr.json | cfssljson -bare ca
2023/04/24 07:32:57 [INFO] generating a new CA key and certificate from CSR
2023/04/24 07:32:57 [INFO] generate received request
2023/04/24 07:32:57 [INFO] received CSR
2023/04/24 07:32:57 [INFO] generating key: rsa-2048
2023/04/24 07:32:57 [INFO] encoded CSR
2023/04/24 07:32:57 [INFO] signed certificate with serial number 375456288458839559624029196548550817711678376679

├── ca-config.json
├── ca.csr  # 新增 ca 请求文件
├── ca-csr.json
├── ca-key.pem # 新增 ca 私钥
└── ca.pem   # 新增 ca证书
```

修改 ca-config.json

- ca-config.json：可以定义多个 profiles，分别指定不同的过期时间、使用场景等参数；后续在签名证书时使用某个 profile；
- signing：表示该证书可用于签名其它证书；生成的 ca.pem 证书中 CA=TRUE；
- server auth：表示 client 可以用该 CA 对 server 提供的证书进行验证
- client auth：表示 server 可以用该CA对 client 提供的证书进行验证
- peer auth：表示 etcd 节点与节点之间通信提供的证书进行验证
- expiry：也表示过期时间，如果不写以 default 中的为准。

```json
{
    "signing":{
        "default":{
            "expiry":"87600h"
        },
        "profiles":{
            "etcd":{
                "usages":[
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ],
                "expiry":"87600h"
            }
        }
    }
}
```

新增 etcd 签发证书 etct-csr.json 文件

- 将服务地址填入

```json
{
    "CN":"etcd",
    "key":{
        "algo":"rsa",
        "size":2048
    },
    "hosts":[
        "localhost",
        "127.0.0.1",
        "192.168.9.10",
        "192.168.9.11",
        "192.168.9.13"
    ],
    "names":[
        {
            "C": "CN",
            "ST": "BeiJing",
            "L": "BeiJing",
            "O": "etcd",
            "OU": "System"
        }
    ]
}
```

生成 etcd 相关证书：

```sh
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=etcd etcd-csr.json | cfssljson -bare etcd

2023/04/24 07:42:34 [INFO] generate received request
2023/04/24 07:42:34 [INFO] received CSR
2023/04/24 07:42:34 [INFO] generating key: rsa-2048
2023/04/24 07:42:34 [INFO] encoded CSR
2023/04/24 07:42:34 [INFO] signed certificate with serial number 299977400939279198682002747109587400028800435906
2023/04/24 07:42:34 [WARNING] This certificate lacks a "hosts" field. This makes it unsuitable for
websites. For more information see the Baseline Requirements for the Issuance and Management
of Publicly-Trusted Certificates, v.1.1.6, from the CA/Browser Forum (https://cabforum.org);
specifically, section 10.2.3 ("Information Requirements").
```

参数解释：

- `-config=ca-config.json` 使用 ca-config 文件。
- `-profile=etcd` 是使用 ca-config.json profiles.etcd 字段里的信息。
- `-bare etcd` 生成名称为 etcd 前缀。

文件列表信息：

```sh
├── ca-key.pem # ca 根私钥
├── ca.pem  # ca 根证书
├── etcd-key.pem # etcd 私钥
└── etcd.pem # etcd 证书
```

证书验证

```sh
cfssl-certinfo -cert etcd.pem
```

复制证书

```sh
cp ca-key.pem ca.pem etcd-key.pem etcd.pem /opt/etcd-3.4/ssl
```

## 3. 部署 ETCD

### 3.1. 下载软件

```sh
cd /opt/src

wget https://github.com/etcd-io/etcd/releases/download/v3.4.13/etcd-v3.4.13-linux-amd64.tar.gz

tar -zxvf etcd-v3.4.13-linux-amd64

cp etcd-v3.4.13-linux-amd64/etcd etcd-v3.4.13-linux-amd64/etcdctl /opt/etcd-3.4/bin

```

### 3.2. 制作启动脚本


```sh
cd /opt/etcd/sh

touch start.sh

chmod +x start.sh
```

```sh
#!/bin/bash
#################
#  etcd 启动脚本
#################

# 本机的基本信息
ETCD_NAME=etcd01 # 修改成对应的节点名称
HOST=192.168.9.10 # 填写本服务器的地址
ETCD_DATA_DIR=/opt/etcd-3.4/data

# 所有节点的信息
etcd01=192.168.9.10
etcd02=192.168.9.11
etcd03=192.168.9.13

INITIAL_CLUSTER_STATE="new" # 初使状态，有两种: new 表示新集群, existing 已存在的集群。多个节点必须有一个是 new

# 通信信息
## 所有节点的IP地址及通信端口号，已命名为etcd01,etcd02等。通过此参数，Etcd节点能够在一开始加入到Etcd集群中。
ETCD_INITIAL_CLUSTER=etcd01=https://${etcd01}:2380,etcd02=https://${etcd02}:2380,etcd03=https://${etcd03}:2380

# 证书信息
CA_FILE=/opt/etcd/ssl/ca.pem # 根证书
KEY_FILE=/opt/etcd/ssl/etcd-key.pem # 服务器私钥
CERT_FILE=/opt/etcd/ssl/etcd.pem # 服务器证书
ETCD_INITIAL_CLUSTER_TOKEN=etcd-cluster # 集群统一标识

 
/opt/etcd-3.4/bin/etcd \
  --data-dir=${ETCD_DATA_DIR} \
  --name=${ETCD_NAME} \
  --cert-file=${CERT_FILE} \
  --key-file=${KEY_FILE} \
  --trusted-ca-file=${CA_FILE} \
  --peer-cert-file=${CERT_FILE} \
  --peer-key-file=${KEY_FILE} \
  --peer-trusted-ca-file=${CA_FILE} \
  --peer-client-cert-auth \
  --client-cert-auth \
  --listen-peer-urls=https://${HOST}:2380 \
  --initial-advertise-peer-urls=https://${HOST}:2380 \
  --listen-client-urls=https://${HOST}:2379,http://127.0.0.1:2379 \
  --advertise-client-urls=https://${HOST}:2379 \
  --initial-cluster-token=${ETCD_INITIAL_CLUSTER_TOKEN} \
  --initial-cluster=${ETCD_INITIAL_CLUSTER} \
  --initial-cluster-state=${INITIAL_CLUSTER_STATE} \
  --auto-compaction-mode=periodic \
  --auto-compaction-retention=1 \
  --max-request-bytes=33554432 \
  --quota-backend-bytes=6442450944 \
  --heartbeat-interval=250 \
  --election-timeout=2000
```

### 3.3. 使用 systemd 管理

```sh
cat > /etc/systemd/system/etcd.service <<EOF
[Unit]
Description=etcd
Documentation=https://github.com/coreos/etcd
After=network.target

[Service]
User=root
WorkingDirectory=/opt/etcd-3.4/sh
ExecStart=/opt/etcd-3.4/sh/start.sh
Restart=on-failure
RestartSec=10s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

管理

```sh
# 刷新 Systemd
systemctl daemon-reload

# 加入开机启动
systemctl enable etcd

# 启动 etcd
systemctl start etcd

# 查看 etcd 状态
systemctl status etcd

# 重启 etcd 
systemctl restart etcd
```

## 4. 打包分发

- 把 /opt/etcd-3.4 下的文件分发到其它机器上

```sh
cd /opt

tar --exclude='etcd-3.4/data/*' -zcvf etcd-3.4.tgz etcd-3.4

# 接收服务器
cd /opt/
nc -l 9999 > etcd-3.4.tgz

# 发送服务器
cd /opt
nc 192.168.9.11 9999 < etcd-3.4.tgz
nc 192.168.9.13 9999 < etcd-3.4.tgz


```

修改 /opt/etcd/sh/start.sh 文件的二行信息

```sh
# 192.168.9.10
ETCD_NAME=etcd01
HOST=192.168.9.10

# 192.168.9.11
ETCD_NAME=etcd02
HOST=192.168.9.10

# 192.168.9.13
ETCD_NAME=etcd03
HOST=192.168.9.13
```

## 5. 验证 ETCD 集群

```sh
# 当前 etcd 状态
ETCDCTL_API=3 /opt/etcd-3.4/bin/etcdctl endpoint health
127.0.0.1:2379 is healthy: successfully committed proposal: took = 3.469256ms

# 查看集群健康状态
-> # /opt/etcd-3.4/bin/etcdctl cluster-health
member 8221ca9600a5f70e is healthy: got healthy result from http://127.0.0.1:2379
member b0e02ecc310302e5 is healthy: got healthy result from http://127.0.0.1:2379
member eae486fb5250a72f is healthy: got healthy result from http://127.0.0.1:2379
cluster is healthy

# 查看成员信息
-> # ETCDCTL_API=3 /opt/etcd-3.4/bin/etcdctl member list
8221ca9600a5f70e: name=etcd03 peerURLs=https://192.168.9.13:2380 clientURLs=http://127.0.0.1:2379,https://192.168.9.13:2379 isLeader=false
b0e02ecc310302e5: name=etcd02 peerURLs=https://192.168.9.11:2380 clientURLs=http://127.0.0.1:2379,https://192.168.9.11:2379 isLeader=false
eae486fb5250a72f: name=etcd01 peerURLs=https://192.168.9.10:2380 clientURLs=http://127.0.0.1:2379,https://192.168.9.10:2379 isLeader=true
```

存储数据

```sh
# 在 192.168.9.10 执行
-> # ETCDCTL_API=3 /opt/etcd-3.4/bin/etcdctl put /test 99 
OK


# 在 192.168.9.11 执行
-> # ETCDCTL_API=3 /opt/etcd-3.4/bin/etcdctl get /test
/test
99
```

## 6. 异常排查方法

```sh
# 查看端口
netstat -nlpt |grep -E "2379|2380"

# 查看 etcd 日志
journalctl -xeu etcd -f

# 查看网络状态
lsof -i:2379 -r
lsof -i:2380 -r
```

## 7. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。
