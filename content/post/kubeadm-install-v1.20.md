---
title: "云运维笔记(4) Kubeadm etcd 堆叠式安装 k8s 1.20"
date: 2022-11-14T18:27:51+08:00
lastmod: 2022-11-14T18:27:51+08:00
draft: false
tags: ["linux", "教程", "云运维笔记", "kubeadm", "k8s"]
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

<!-- TOC -->

- [.1. 回顾](#1-回顾)
- [.2. 安装前的准备](#2-安装前的准备)
  - [.2.1. 安装要求](#21-安装要求)
  - [.2.2. 集群规划](#22-集群规划)
  - [.2.3. 版本选择](#23-版本选择)
  - [.2.4. 基本设置](#24-基本设置)
- [.3. Kubernetes 设置的参数](#3-kubernetes-设置的参数)
  - [.3.1. br_netfilter 模块](#31-br_netfilter-模块)
  - [.3.2. 桥接的IPv4流量传递到iptables的链](#32-桥接的ipv4流量传递到iptables的链)
  - [.3.3. 加载 IPVS](#33-加载-ipvs)
- [.4. Docker 部署](#4-docker-部署)
  - [.4.1. 设置 Docker 镜像源](#41-设置-docker-镜像源)
  - [.4.2. 列出 Docker 所有的版本](#42-列出-docker-所有的版本)
  - [.4.3. 安装 docker](#43-安装-docker)
  - [.4.4. 设置 daemon.json](#44-设置-daemonjson)
    - [.4.4.1. 设置CPU](#441-设置cpu)
    - [.4.4.2. 支持GPU](#442-支持gpu)
  - [.4.5. 启动 docker](#45-启动-docker)
- [.5. 设置 firewall 防火墙规则](#5-设置-firewall-防火墙规则)
  - [.5.1. k8s master需要开启以下端口](#51-k8s-master需要开启以下端口)
  - [.5.2. k8s node需要开启以下端口](#52-k8s-node需要开启以下端口)
  - [.5.3. 打开 NAT 转发功能](#53-打开-nat-转发功能)
  - [.5.4. calico 需要开启以下端口](#54-calico-需要开启以下端口)
  - [.5.5. NFS 防火墙规则设置](#55-nfs-防火墙规则设置)
  - [.5.6. 其它端口](#56-其它端口)
- [.6. Kubernetes 部署](#6-kubernetes-部署)
  - [.6.1. 设置 kubernetes 镜像源](#61-设置-kubernetes-镜像源)
  - [.6.2. 安装 kubeadm,kubelet,kubectl](#62-安装-kubeadmkubeletkubectl)
  - [.6.3. 初使化集群](#63-初使化集群)
- [.7. 安装 Calico](#7-安装-calico)
  - [.7.1. 下载 YAML](#71-下载-yaml)
  - [.7.2. 修改 YAML](#72-修改-yaml)
  - [.7.3. 安装 calico](#73-安装-calico)
  - [.7.4. 卸载 Calico](#74-卸载-calico)
- [.8. GPU](#8-gpu)
  - [.8.1. 前提](#81-前提)
  - [.8.2. 在 GPU node 节点上安装 nvidia-container-toolkit](#82-在-gpu-node-节点上安装-nvidia-container-toolkit)
  - [.8.3. k8s-device-plugin](#83-k8s-device-plugin)
- [.9. 参考](#9-参考)
- [.10. 关于作者](#10-关于作者)

<!-- /TOC -->

## .1. 回顾

之前写过一篇 [Kubeadm etcd 堆叠式安装 k8s 1.16](https://yezihack.github.io/kubeadm-install-v1.16.html)。

本次安装版本：1.20.15(1.20最后一个发布版本)，与之前有以下不同点：

1. 采用 calico 作为容器内的网络插件。
2. 开启 firewalld，设置允许 k8s 访问规则。
3. K8S 支持 GPU。

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

### .2.3. 版本选择

| 序列 | 软件名称 | 版本号 |
| --- | --- | --- |
| 1 | kubeadm | 1.20.15|
| 2 | kubectl | 1.20.15|
| 3 | kubelet | 1.20.15|
| 4 | docker | 20.10.18 |
| 5 | calico |  3.20 |

### .2.4. 基本设置

```sh
# 1. 关闭 selinux
sed -i 's/enforcing/disabled/' /etc/selinux/config # 永久
setenforce 0 # 临时
getenforce # 查看

# 2. 关闭 swap
swapoff -a # 临时 
sed -ri 's/.*swap.*/#&/' /etc/fstab # 永久
swapon -v # 检查

# 3. 查看时间区域
timedatectl

## 3.1 设置成中国时区
timedatectl set-timezone Asia/Shanghai
## 3.2  设置完时区后，强制同步下系统时钟：
chronyc -a makestep
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

## .4. Docker 部署

### .4.1. 设置 Docker 镜像源

```sh
# 下载 docker 官方源
wget -O /etc/yum.repos.d/docker-ce.repo https://download.docker.com/linux/centos/docker-ce.repo

# 替换成清华大学镜像源
sudo sed -i 's+download.docker.com+mirrors.tuna.tsinghua.edu.cn/docker-ce+' /etc/yum.repos.d/docker-ce.repo

# 快速建立缓存
yum makecache fast
```

### .4.2. 列出 Docker 所有的版本

```sh
yum search docker-ce --showduplicates|sort -r
```

### .4.3. 安装 docker

```sh
yum -y install docker-ce-19.03.5 docker-ce-cli-19.03.5 containerd.io-19.03.5
```

### .4.4. 设置 daemon.json

#### .4.4.1. 设置CPU

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

#### .4.4.2. 支持GPU

详细可参考：<https://yezihack.github.io/docker-daemon.html>

```json
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
  "live-restore": true,
  "default-runtime": "nvidia",
    "runtimes":  {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
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

### .4.5. 启动 docker

```sh
systemctl start docker
```

## .5. 设置 firewall 防火墙规则

![kubeadm-install-v1](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-v1.20-20221115111238)

特殊的端口说明：

- 8472/udp为flannel的通信端口
- 443/tcp 为Kubernetes server端口

### .5.1. k8s master需要开启以下端口

```sh
firewall-cmd --permanent --add-port=6443/tcp
firewall-cmd --permanent --add-port=2379-2380/tcp
firewall-cmd --permanent --add-port=10250/tcp
firewall-cmd --permanent --add-port=10251/tcp
firewall-cmd --permanent --add-port=10252/tcp
firewall-cmd --permanent --add-port=10255/tcp
firewall-cmd --permanent --add-port=8472/udp
firewall-cmd --permanent --add-port=443/udp
firewall-cmd --permanent --add-port=53/udp
firewall-cmd --permanent --add-port=53/tcp
firewall-cmd --permanent --add-port=9153/tcp
firewall-cmd --add-masquerade --permanent
# only if you want NodePorts exposed on control plane IP as well
firewall-cmd --permanent --add-port=30000-32767/tcp
systemctl restart firewalld
```

### .5.2. k8s node需要开启以下端口

```sh
firewall-cmd --permanent --add-port=10250/tcp
firewall-cmd --permanent --add-port=10255/tcp
firewall-cmd --permanent --add-port=8472/udp
firewall-cmd --permanent --add-port=443/udp
firewall-cmd --permanent --add-port=30000-32767/tcp
firewall-cmd --permanent --add-port=30000-32767/udp
firewall-cmd --permanent --add-port=53/udp
firewall-cmd --permanent --add-port=53/tcp
firewall-cmd --permanent --add-port=9153/tcp
firewall-cmd --add-masquerade --permanent
systemctl restart firewalld　
```

### .5.3. 打开 NAT 转发功能

```sh
# 检查是否允许 NAT 转发
firewall-cmd --query-masquerade
# 关闭 NAT 转发
firewall-cmd --remove-masquerade
# 打开 NAT 转发
firewall-cmd --add-masquerade --permanent
# 重启再查看
firewall-cmd --reload
```

### .5.4. calico 需要开启以下端口

> 安装 calico 之后再操作

```sh

#!/bin/bash

# 设置 zone 名称
name="calico"

# 获取 calico 的网卡名称
for i in $(ip a | grep cali | awk -F":" '{print $2}' | awk -F"@" '{print $1}') 
do 
    echo "网卡名称：$i"
    sudo firewall-cmd --permanent --new-zone=${name}
    sudo firewall-cmd --permanent --zone=${name} --set-target=ACCEPT
    sudo firewall-cmd --permanent --zone=${name} --add-interface=${i}
done

# 重启 firewalld
sudo firewall-cmd --reload

# 查看 zone
firewall-cmd --list-all-zone|grep -A 15 ${name}
```

### .5.5. NFS 防火墙规则设置

> 如果安装 nfs 参考：

生产上想要利用NFS实现共享，
由于生产规则防火墙仅开放了22端口，此时我们需要开启NFS服务端口

但是NFS启动时会随机启动多个端口并向RPC注册.

为了设置安全组以及防火墙规则，此时就需要设置NFS固定端口。

NFS服务需要开启 mountd,nfs,nlockmgr,portmapper,rquotad这5个服务.

其中nfs、portmapper的端口是固定的.

另外三个服务的端口是随机分配的.

所以需要给mountd,nlockmgr,rquotad设置固定的端口。

**给mountd、rquotad设置端口：**

```sh
编写/etc/sysconfig/nfs文件设置端口

vim /etc/sysconfig/nfs
RQUOTAD_PORT=30001
LOCKD_TCPPORT=30002
LOCKD_UDPPORT=30002
MOUNTD_PORT=30003
STATD_PORT=30004
```

**重启rpc、nfs的配置与服务：**

```sh
systemctl restart rpcbind.service
systemctl restart nfs.service
```

在/etc/modprobe.d/lockd.conf中添加以下设置：

```sh
options lockd nlm_tcpport=30002
options lockd nlm_udpport=30002
```

**重新加载NFS配置和服务：**

```sh
systemctl restart nfs-config
systemctl restart nfs-idmap
systemctl restart nfs-lock
systemctl restart nfs-server
```

**查看修改后的NFS端口使用情况：**

```sh
rpcinfo -p
   program vers proto   port  service
    100000    4   tcp    111  portmapper
    100000    3   tcp    111  portmapper
    100000    2   tcp    111  portmapper
    100000    4   udp    111  portmapper
    100000    3   udp    111  portmapper
    100000    2   udp    111  portmapper
    100024    1   udp  30004  status
    100024    1   tcp  30004  status
    100005    1   udp  30003  mountd
    100005    1   tcp  30003  mountd
    100005    2   udp  30003  mountd
    100005    2   tcp  30003  mountd
    100005    3   udp  30003  mountd
    100005    3   tcp  30003  mountd
    100003    3   tcp   2049  nfs
    100003    4   tcp   2049  nfs
    100227    3   tcp   2049  nfs_acl
    100003    3   udp   2049  nfs
    100003    4   udp   2049  nfs
    100227    3   udp   2049  nfs_acl
    100021    1   udp  30002  nlockmgr
    100021    3   udp  30002  nlockmgr
    100021    4   udp  30002  nlockmgr
    100021    1   tcp  30002  nlockmgr
    100021    3   tcp  30002  nlockmgr
    100021    4   tcp  30002  nlockmgr
```

**编写防火墙规则(firewalld)，开放NFS端口访问：**

```sh
firewall-cmd --permanent --add-port=2049/tcp
firewall-cmd --permanent --add-port=2049/udp
firewall-cmd --permanent --add-port=111/tcp
firewall-cmd --permanent --add-port=111/udp
firewall-cmd --permanent --add-port=30001/tcp
firewall-cmd --permanent --add-port=30001/udp
firewall-cmd --permanent --add-port=30002/tcp
firewall-cmd --permanent --add-port=30002/udp
firewall-cmd --permanent --add-port=30003/udp
firewall-cmd --permanent --add-port=30003/tcp
firewall-cmd --permanent --add-port=30004/tcp
firewall-cmd --permanent --add-port=30004/udp
firewall-cmd --reload
```

**查看 firewall：**

```sh
firewall-cmd --permanent --list-all
```

### .5.6. 其它端口

如果你使用了istio还有把istio-pilot的端口加到防火墙里：

```sh
firewall-cmd --permanent --add-port=15010-15014/tcp
```



## .6. Kubernetes 部署

### .6.1. 设置 kubernetes 镜像源

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

### .6.2. 安装 kubeadm,kubelet,kubectl

```sh
# 搜索所有的版本
yum search kubeadm --showduplicates|sort -r
yum search kubelet --showduplicates|sort -r
yum search kubectl --showduplicates|sort -r

# 或指定版本
yum install -y kubelet-1.20.15 kubeadm-1.20.15 kubectl-1.20.15

# 开机启动
systemctl enable kubelet
```

### .6.3. 初使化集群

初使化为两种方式，一种是直接命令式，一种是配置文件式。

命令式初使化：

- apiserver-advertise-address 控制面板地址
- image-repository 镜像源地址，默认 k8s.gcr.io，使用：`kubeadm config images list` 查看所需镜像版本。
- service-cidr Service 网络IP段设置
- pod-network-cidr Pod IP段设置，后续要安装 calico，使用 `192.168.0.0/16` 网段

```sh
# 在 master01 节点上操作
kubeadm init \
--apiserver-advertise-address=192.168.9.10 \
--image-repository registry.aliyuncs.com/google_containers \
--kubernetes-version v1.20.15 \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=192.168.0.0/16 \
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
kubernetesVersion: v1.20.15 # 版本号
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12 # 指定 Service 网络
  podSubnet: 192.168.0.0/16 # 指定 pod 网络，与 docker bip 相对应
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

# 或使用命令
sudo kubeadm init \
 --apiserver-advertise-address 192.168.9.10 \
 --image-repository registry.aliyuncs.com/google_containers \
 --kubernetes-version=v1.20.15 \
 --service-cidr=10.96.0.0/12 \
 --pod-network-cidr=192.168.0.0/16 \
 --upload-certs

# 拷贝 kubeconfig 文件到 HOME 目录
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

```

## .7. 安装 Calico

- 选择 calico 3.20 版本

打开官网: <https://projectcalico.docs.tigera.io/archive/v3.20/getting-started/kubernetes/requirements>

![kubeadm-install-v1](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-v1.20-20221115121232)

打开本地自定义集群说明：<https://projectcalico.docs.tigera.io/archive/v3.20/getting-started/kubernetes/self-managed-onprem/onpremises>

### .7.1. 下载 YAML

还区分你的集群大小，如果集群节点小于50个，则使用：

```sh
curl https://docs.projectcalico.org/archive/v3.20/manifests/calico.yaml -O
```

如果集群节点大于50个，则使用：

```sh
curl https://docs.projectcalico.org/archive/v3.20/manifests/calico-typha.yaml -o calico.yaml
```

### .7.2. 修改 YAML

- 大约在 `calico.yaml`的4026行附近。
- 将注释掉的 `CALICO_IPV4POOL_CIDR` 去掉。
- `value` 值填写你安装 k8s 时设置的 `--pod-network-cidr`，默认值：`192.168.0.0/16`

```yaml
            # The default IPv4 pool to create on startup if none exists. Pod IPs will be
            # chosen from this range. Changing this value after installation will have
            # no effect. This should fall within `--cluster-cidr`.
            - name: CALICO_IPV4POOL_CIDR
               value: "192.168.0.0/16"
            # Disable file logging so `kubectl logs` works.
            - name: CALICO_DISABLE_FILE_LOGGING
              value: "true"
```

### .7.3. 安装 calico

```sh
k apply -f calico.yaml
```

安装失败：Error querying BIRD: unable to connect to BIRDv4 socket: dial unix /var/run/calico/bird.ctl: connect: connection refused

```sh
  Warning  Unhealthy  13m (x5 over 14m)     kubelet            Readiness probe failed: calico/node is not ready: BIRD is not ready: Error querying BIRD: unable to connect to BIRDv4 socket: dial unix /var/run/calico/bird.ctl: connect: connection refused
  Warning  Unhealthy  10m (x15 over 14m)    kubelet            Liveness probe failed: calico/node is not ready: bird/confd is not live: Service bird is not running. Output << down: /etc/service/enabled/bird: 1s, normally up, want up >>
  Warning  Unhealthy  5m56s (x8 over 13m)   kubelet            Liveness probe failed: calico/node is not ready: bird/confd is not live: Service bird is not running. Output << down: /etc/service/enabled/bird: 0s, normally up, want up >>
  Warning  BackOff    47s (x28 over 8m16s)  kubelet            Back-off restarting failed container
```

原因：没有找到网卡

解决：

- 编辑 calico.yaml
- 搜索：`CALICO_IPV4POOL_IPIP` 附近添加一个环境变量，填写自己的的网卡名称。注：ifconfig

![kubeadm-install-v1](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-v1.20-20221115143701)

```yaml
 # Auto-detect the BGP IP address.
    - name: IP_AUTODETECTION_METHOD
      value: "interface=eth0"  # ens 根据实际网卡开头配置
    - name: IP
      value: "autodetect"
    # Enable IPIP
    - name: CALICO_IPV4POOL_IPIP
      value: "Always"
```

### .7.4. 卸载 Calico

```sh
# 删除应用
k delete -f calico.yaml

# 删除每台机器的 cali* 网卡

# 移除Calico配置文件
ls /etc/cni/net.d/
#看看是否存在Calico相关的文件和目录，如：10-calico.conflist， calico-kubeconfig， calico-tls，如果有将其移除。

calico=$(ip a | grep cali | awk -F":" '{print $2}' | awk -F"@" '{print $1}')
ifconfig ${calico} down
ip link delete ${calico}
```

## .8. GPU

### .8.1. 前提

- NVIDIA drivers ~= 384.81
- nvidia-docker >= 2.0 || nvidia-container-toolkit >= 1.7.0
- nvidia-container-runtime configured as the default low-level runtime
- Kubernetes version >= 1.10

### .8.2. 在 GPU node 节点上安装 nvidia-container-toolkit

```sh
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.repo | sudo tee /etc/yum.repos.d/nvidia-container-runtime.repo

sudo yum install -y nvidia-container-toolkit
yum -y install nvidia-container-runtime
```

### .8.3. k8s-device-plugin

> 让 kubernetes 能识别 GPU 硬件

```sh
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.12.3/nvidia-device-plugin.yml
```

验证 GPU:

![kubeadm-install-v1](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-v1.20-20221116184618)

## .9. 参考

1. 关于K8S端口的官方说明：<https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/>
2. calico 支持的 kubernetes 版本 <https://projectcalico.docs.tigera.io/archive/v3.20/getting-started/kubernetes/requirements>
3. Linux NFS配置固定端口并设置防火墙规则 <https://blog.csdn.net/baoyuhang0/article/details/108631551>
4. Kubernetes cluster with firewall enabled on CentOS(calico) not working  <https://stackoverflow.com/questions/67701010/kubernetes-cluster-with-firewall-enabled-on-centoscalico-not-working>
5. <https://github.com/NVIDIA/k8s-device-plugin>

## .10. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
