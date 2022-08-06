---
title: "Kubeadm etcd 堆叠式安装(2)"
date: 2022-08-04T10:40:28+08:00
lastmod: 2022-08-04T10:40:28+08:00
draft: false
tags: ["linux", "教程", "运维笔记", "kubeadm"]
categories: ["运维笔记"]
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


## .1. Kubeadm 高可用集群

本次安装 Kubernetes 采用官方推荐的 kubeadm 安装方式。

利用 kubeadm 创建高可用集群，使用 kubeadm 设置一个高可用的 Kubernetes 集群的两种不同方式：

- 使用具有堆叠的控制平面节点。这种方法所需基础设施较少。etcd 成员和控制平面节点位于同一位置。
- 使用外部集群。这种方法所需基础设施较多。控制平面的节点和 etcd 成员是分开的。

本次教程采用 etcd 堆叠式高可用集群，即将 etcd 与控制平面的节点在同一个位置。

## .2. 安装前的准备

### .2.1. 安装要求

在开始安装 kubernetes 集群机器之前需要满足以下几上条件：

| 序列 | 名称 | 参考值 | 命令 |
| --- | --- | --- | --- |
| 1 | 系统 | Linux | uname -s |
| 2 | 内存 | >= 2 GB | free -hm |
| 3 | CPU  | >= 2 核 | cat /proc/cpuinfo &#124;grep "processor"&#124;wc -l |
| 4 | 硬盘 | >= 20 GB | df -h |
| 5 | 交换分区 | 必须禁用 | swapoff / vim /etc/fstab |
| 6 | 网络 | 集群中所有机器之间网络互通 | ping  |
| 7 | 主机名 | 集群中所有机器不重复 | hostname |
| 8 | MAC地址 | 集群中所有机器不重复 | cat /sys/class/net/ens33/address |
| 9  | product_uuid | 集群中所有机器不重复 | cat /sys/class/dmi/id/product_uuid |

### .2.2. 集群规划

- master 表示 Kubernetes 控制面板节点
- etcd01~etcd03 表示 etcd 集群节点
- node 表示 Kubernetes 工作节点

| 序列 | IP | HOSTNAME |  角色 |
| --- | --- | --- | --- |
| 1 | 192.168.9.10 | kube-10| master01|
| 2 | 192.168.9.11 | kube-11| master02|
| 3 | 192.168.9.12 | kube-12| master03|
| 4 | 192.168.9.13 | kube-13| node|
| 5 | 192.168.9.14 | kube-14| node|

### 版本选择

| 序列 | 软件名称 | 版本号 |
| --- | --- | --- |
| 1 | kubeadm | 1.16.11|
| 2 | kubectl | 1.16.11|
| 3 | kubelet | 1.16.11|
| 4 | docker | 19.03.5|

### .2.3. 设置IP

- 克隆出五台机器，分别设置不同的IP值

```sh
$ vim /etc/sysconfig/network-scripts/ifcfg-ens33

TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="static"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="ens33"
UUID="7ce873a8-d5f8-471a-8c7a-0100bcc84e77"
DEVICE="ens33"
ONBOOT="yes"
IPADDR="192.168.9.*" # 修改集群规划里的IP值
GATEWAY="192.168.9.2"
NETMASK="255.255.255.0"
```

### .2.4. 设置 HOSTNAME

- 对五台机器，分别设置不同的 Hostname

```sh
hostnamectl set-hostname kube-10
hostnamectl set-hostname kube-11
hostnamectl set-hostname kube-12
hostnamectl set-hostname kube-13
hostnamectl set-hostname kube-14
```

### .2.5. 关闭防火墙

```sh
systemctl stop firewalld && systemctl disable firewalld

systemctl status firewalld
```

### .2.6. 关闭 selinux

```sh
sed -i 's/enforcing/disabled/' /etc/selinux/config # 永久
setenforce 0 # 临时
getenforce # 查看
```

### .2.7. 关闭 swap

```sh
swapoff -a # 临时 
sed -ri 's/.*swap.*/#&/' /etc/fstab # 永久
swapon -v # 检查
```

### .2.8. 添加 HOST

```sh
cat >> /etc/hosts << EOF
192.168.9.10 kube-10
192.168.9.11 kube-11
192.168.9.12 kube-12
192.168.9.13 kube-13
192.168.9.14 kube-14
EOF
```

### .2.9. 时间同步

采用 chrony 软件同步时间。

Chrony是NTP（Network Time Protocol，网络时间协议，服务器时间同步的一种协议）的另一种实现，与ntpd不同，它可以更快且更准确地同步系统时钟，最大程度的减少时间和频率误差。

#### .2.10. chrony 安装

```sh
# 安装
yum install chrony -y

# 管理
systemctl start chronyd      #启动
systemctl status chronyd    #查看
systemctl restart chronyd   #重启
systemctl stop chronyd      #停止

systemctl enable chronyd 　　  #设置开机启动

```

#### .2.10.1. 修改为中国时区

```sh
timedatectl set-timezone Asia/Shanghai

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep
```

#### .2.10.2. 修改配置

```sh
vim /etc/chrony.conf

# 注释默认的同步地址
#server 0.centos.pool.ntp.org iburst
#server 1.centos.pool.ntp.org iburst
#server 2.centos.pool.ntp.org iburst
#server 3.centos.pool.ntp.org iburst
server 192.168.9.10 iburst # 添加这一行，表示与本机同步时间，其它机器都填写这个地址。

# Allow NTP client access from local network.
allow 192.168.9.0/24   #允许哪些服务器到这台服务器来同步时间
```

重启：`systemctl restart chronyd`

国内常用同步服务器地址：

- ntp1.aliyun.com

#### .2.10.3. 同步时间

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

#### .2.11. 加入防火墙

> 如果开启了防火墙，需要设置白名单

- 开放 323/udp，123/udp端口，或直接关闭防火墙
  
```sh
firewall-cmd --add-service=ntp --permanent
firewall-cmd --reload
```

## .3. Kubernetes 设置的参数

### .3.1. br_netfilter 模块

```sh
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF
```

### .3.2. 桥接的IPv4流量传递到iptables的链

```sh
cat > /etc/sysctl.d/k8s.conf << EOF
net.ipv4.ip_forward = 1 
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

# 生效
sysctl --system
```

### .3.3. 加载 IPVS

```sh
cat <<EOF | sudo tee /etc/sysconfig/modules/ipvs.modules
#!/bin/bash
ipvs_modules="ip_vs ip_vs_rr ip_vs_wrr ip_vs_sh nf_conntrack"
for kernel_module in \${ipvs_modules}; do
  /sbin/modinfo -F filename \${kernel_module} > /dev/null 2>&1
  if [ \$? -eq 0 ]; then
    /sbin/modprobe \${kernel_module}
  fi
done
EOF

# 设置权限
chmod 755 /etc/sysconfig/modules/ipvs.modules
sh /etc/sysconfig/modules/ipvs.modules

# 验证
lsmod | grep ip_vs 
```

## Docker 部署

### 设置 Docker 镜像源

```sh
# 下载 docker 官方源
wget -O /etc/yum.repos.d/docker-ce.repo https://download.docker.com/linux/centos/docker-ce.repo

# 替换成清华大学镜像源
sudo sed -i 's+download.docker.com+mirrors.tuna.tsinghua.edu.cn/docker-ce+' /etc/yum.repos.d/docker-ce.repo

# 快速建立缓存
yum makecache fast
```

### 列出 Docker 所有的版本

```sh
yum search docker-ce --showduplicates|sort -r
```

### 安装 docker

```sh
yum -y install docker-ce-19.03.5 docker-ce-cli-19.03.5 containerd.io-19.03.5
```

### 设置 daemon.json

```sh
# 创建目录
mkdir -p /etc/docker
mkdir -p /data/docker.data
# 创建文件
touch /etc/docker/daemon.json
# 设置 daemon.json
cat > /etc/docker/daemon.json <<EOF
{
  "data-root": "/data/docker.data",
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
      "max-size": "100m",
      "max-file": "10" 
  },
  "bip": "172.9.10.1/24",
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true
}
EOF
```

参数说明：

- data-root 数据存储目录
- storage-driver 存储驱动
- log-driver 采用 json 格式
- log-opts 设置docker日志切割
  - max-size 日志大小
  - max-file 最大文件日志数量
- bip docker 的IP段设置
- exec-opts 运行时执行的选项
- live-restore 在 dockerd 停止时保证已启动的 Running 容器持续运行，并在 daemon 进程启动后重新接管

### 启动 docker

```sh
systemctl start docker
```

## Kubernetes 部署

### 设置 kubernetes 镜像源

```sh
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

### 安装 kubeadm,kubelet,kubectl

```sh
# 搜索所有的版本
yum search kubeadm --showduplicates|sort -r
yum search kubelet --showduplicates|sort -r
yum search kubectl --showduplicates|sort -r

# 或指定版本
yum install -y kubelet-1.16.11 kubeadm-1.16.11 kubectl-1.16.11

# 开机启动
systemctl enable kubelet
```

### 初使化集群

初使化为两种方式，一种是直接命令式，一种是配置文件式。

命令式初使化：

- apiserver-advertise-address 控制面板地址
- image-repository 镜像源地址，默认 k8s.gcr.io，使用：`kubeadm config images list` 查看所需镜像版本。
- service-cidr Service 网络IP段设置
- pod-network-cidr Pod IP段设置

```sh
# 在 master01 节点上操作
kubeadm init \
--apiserver-advertise-address=192.168.9.10 \
--image-repository registry.aliyuncs.com/google_containers \
--kubernetes-version v1.16.11 \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=172.9.0.0/16 \
--upload-certs
```

配置文件式初使化：
  
```sh
# 生成配置
kubeadm config print init-defaults  > kubeadm-config.yaml 
```

- 修改 kubeadm-config.yaml

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.9.10 # 主控制面板的地址
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: kube-10 # 主控制面板名称
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers # 换成国内源
kind: ClusterConfiguration
kubernetesVersion: v1.16.11 # 版本号
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12 # 指定 Service 网络
  podSubnet: 172.9.0.0/16 # 指定 pod 网络，与 docker bip 相对应
scheduler: {}
```

- dry-run模式验证语法

```sh
kubeadm init --config kubeadm-config.yaml --dry-run
```

- 预先拉取镜像

```sh
kubeadm config images pull --config kubeadm-config.yaml
```

- 初始化集群

> --upload-certs 将证书保存到 kube-system 名称空间下名为 extension-apiserver-authentication 的 configmap 中，这样其他控制平面加入的话只要加上 --control-plane --certificate-key 并带上相应的key就可以拿到证书并下载到本地。
  
```sh
# 初使化
kubeadm init --config kubeadm-config.yaml --upload-certs

# 拷贝 kubeconfig 文件到 HOME 目录
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

```

### 其它 master 加入集群

```sh
# 生成 certificate key
kubeadm init phase upload-certs --upload-certs

[upload-certs] Using certificate key:
21ba109e0681f3e1bc5350e35817d795cb33164345ac978ae36c6f6e4420d6a7


# 生成 node 加入集群的命令
kubeadm token create --print-join-command

kubeadm join 192.168.9.10:6443 --token 63am4r.17s8430em0sngs6z     --discovery-token-ca-cert-hash sha256:87df00d45f3a503b806083c1eefbaaae770611ddd7d3eaa46c10ae743ff277bf

# 拼接其它控制面板， 将以上两个命名合并。
# --control-plane --certificate-key 一定要加入，表示 master 加入
kubeadm join 192.168.9.10:6443 --token 63am4r.17s8430em0sngs6z \
  --discovery-token-ca-cert-hash sha256:87df00d45f3a503b806083c1eefbaaae770611ddd7d3eaa46c10ae743ff277bf \
  --control-plane --certificate-key 21ba109e0681f3e1bc5350e35817d795cb33164345ac978ae36c6f6e4420d6a7

```

加入集群失败：

```sh
error execution phase preflight: 
One or more conditions for hosting a new control plane instance is not satisfied.

unable to add a new control plane instance a cluster that doesn't have a stable controlPlaneEndpoint address

Please ensure that:
* The cluster has a stable controlPlaneEndpoint address.
* The certificates that must be shared among control plane instances are provided.
```

需要修改 kubeadm-config:

```sh
# 添加 controlPlaneEndpoint 
kubectl -n kube-system edit cm kubeadm-config

# 添加
controlPlaneEndpoint: 192.168.9.10:6443
```

![kubeadm-install-20220805161637](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220805161637)

### 其它工作节点加入集群

```sh
kubeadm token create --print-join-command

kubeadm join 192.168.9.10:6443 --token pje2rc.utnrzkvvbuecolm2     --discovery-token-ca-cert-hash sha256:87df00d45f3a503b806083c1eefbaaae770611ddd7d3eaa46c10ae743ff277bf
```

### 查看集群状态

```sh
-> # k get no
NAME      STATUS     ROLES    AGE     VERSION
kube-10   NotReady   master   4h59m   v1.16.11
kube-11   NotReady   master   3m26s   v1.16.11
kube-12   NotReady   master   2m38s   v1.16.11
kube-13   NotReady   <none>   6s      v1.16.11
kube-14   NotReady   <none>   3s      v1.16.11
```

## Flannel 网络插件部署

> pod 与 pod 通信需要网络插件，通过 k8s 提供的 CNI 接口安装 flannel 插件

### 下载 YAML 文件

```sh
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

### 修改 kube-flannel.yml

- 自定义 network，大约84行

```yaml
  net-conf.json: |
    {   
      "Network": "172.9.0.0/16", # 修改与之前设置的 pod IP网络段一致
      "Backend": {
        "Type": "vxlan"  # 采用兼容模式
      }
    }

```

![kubeadm-install-20220805173058](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220805173058)


## .4. 参考

- [详解：Linux Chrony 设置服务器集群同步时间](https://www.linuxprobe.com/centos7-chrony-time.html)
- [Istio实战指南](https://huangzhongde.cn/istio/)

## .5. 关于作者

我的博客：<https://sgfoot.com>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
