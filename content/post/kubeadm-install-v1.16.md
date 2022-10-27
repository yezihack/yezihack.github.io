---
title: "Kubeadm etcd 堆叠式安装(2) k8s 1.16"
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

### .2.3. 版本选择

| 序列 | 软件名称 | 版本号 |
| --- | --- | --- |
| 1 | kubeadm | 1.16.11|
| 2 | kubectl | 1.16.11|
| 3 | kubelet | 1.16.11|
| 4 | docker | 19.03.5|

### .2.4. 设置IP

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

### .2.5. 设置 HOSTNAME

- 对五台机器，分别设置不同的 Hostname

```sh
hostnamectl set-hostname kube-10
hostnamectl set-hostname kube-11
hostnamectl set-hostname kube-12
hostnamectl set-hostname kube-13
hostnamectl set-hostname kube-14
```

### .2.6. 关闭防火墙

```sh
systemctl stop firewalld && systemctl disable firewalld

systemctl status firewalld
```

### .2.7. 关闭 selinux

```sh
sed -i 's/enforcing/disabled/' /etc/selinux/config # 永久
setenforce 0 # 临时
getenforce # 查看
```

### .2.8. 关闭 swap

```sh
swapoff -a # 临时 
sed -ri 's/.*swap.*/#&/' /etc/fstab # 永久
swapon -v # 检查
```

### .2.9. 添加 HOST

```sh
cat >> /etc/hosts << EOF
192.168.9.10 kube-10
192.168.9.11 kube-11
192.168.9.12 kube-12
192.168.9.13 kube-13
192.168.9.14 kube-14
EOF
```

### .2.10. 时间同步

采用 chrony 软件同步时间。

Chrony是NTP（Network Time Protocol，网络时间协议，服务器时间同步的一种协议）的另一种实现，与ntpd不同，它可以更快且更准确地同步系统时钟，最大程度的减少时间和频率误差。

#### .2.10.1. chrony 安装

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

#### .2.10.2. 修改为中国时区

```sh
timedatectl set-timezone Asia/Shanghai

# 设置完时区后，强制同步下系统时钟：
chronyc -a makestep
```

#### .2.10.3. 修改配置

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

#### .2.10.4. 同步时间

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

#### .2.10.5. 加入防火墙

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

### .4.5. 启动 docker

```sh
systemctl start docker
```

## .5. Kubernetes 部署

### .5.1. 设置 kubernetes 镜像源

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

### .5.2. 安装 kubeadm,kubelet,kubectl

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

### .5.3. 初使化集群

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
--pod-network-cidr=10.244.0.0/16 \
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
  podSubnet: 10.244.0.0/16 # 指定 pod 网络，与 docker bip 相对应
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
 --kubernetes-version=v1.16.11 \
 --service-cidr=10.96.0.0/12 \
 --pod-network-cidr=10.244.0.0/16 \
 --upload-certs

# 拷贝 kubeconfig 文件到 HOME 目录
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

```

### .5.4. 查看 kubeadm 配置

需要观察

- podSubnet: 10.244.0.0/16
- serviceSubnet: 10.96.0.0/12

```sh
-> # k -n kube-system get cm kubeadm-config -oyaml
apiVersion: v1
data:
  ClusterConfiguration: |
    apiServer:
      extraArgs:
        authorization-mode: Node,RBAC
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
    imageRepository: registry.aliyuncs.com/google_containers
    kind: ClusterConfiguration
    kubernetesVersion: v1.16.11
    networking:
      dnsDomain: cluster.local
      podSubnet: 10.244.0.0/16
      serviceSubnet: 10.96.0.0/12
    scheduler: {}
  ClusterStatus: |
    apiEndpoints:
      kube-10:
        advertiseAddress: 192.168.9.10
        bindPort: 6443
    apiVersion: kubeadm.k8s.io/v1beta2
    kind: ClusterStatus
kind: ConfigMap
metadata:
  creationTimestamp: "2022-08-16T02:34:01Z"
  name: kubeadm-config
  namespace: kube-system
  resourceVersion: "155"
  selfLink: /api/v1/namespaces/kube-system/configmaps/kubeadm-config
  uid: b50bc7ad-a754-4251-a446-f5b958d47409
```

### .5.5. 其它 master 加入集群

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
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: v1.16.11
controlPlaneEndpoint: 192.168.9.10:6443 # 新增项
```

![kubeadm-install-20220805161637](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220805161637)

### .5.6. 其它工作节点加入集群

```sh
kubeadm token create --print-join-command

kubeadm join 192.168.9.10:6443 --token pje2rc.utnrzkvvbuecolm2     --discovery-token-ca-cert-hash sha256:87df00d45f3a503b806083c1eefbaaae770611ddd7d3eaa46c10ae743ff277bf
```

### .5.7. 查看集群状态

```sh
-> # k get no
NAME      STATUS     ROLES    AGE     VERSION
kube-10   NotReady   master   4h59m   v1.16.11
kube-11   NotReady   master   3m26s   v1.16.11
kube-12   NotReady   master   2m38s   v1.16.11
kube-13   NotReady   <none>   6s      v1.16.11
kube-14   NotReady   <none>   3s      v1.16.11
```

### .5.8. 去掉污点

```sh
# 去掉污点
kubectl taint nodes --all node-role.kubernetes.io/master-

# 添加污点
kubectl taint nodes k8s node-role.kubernetes.io/master=true:NoSchedule
```

### .5.9. 集群重置

```sh
sudo kubeadm reset -f
sudo systemctl stop docker && sudo systemctl stop kubelet
sudo rm -rf /etc/kubernetes/
sudo rm -rf .kube/
sudo rm -rf /var/lib/kubelet/
sudo rm -rf /var/lib/cni/
sudo rm -rf /etc/cni/
sudo rm -rf /var/lib/etcd/
```

### .5.10. Docker 重置

```sh
yum install -y bridge-utils
ifconfig docker0 down
ifconfig flannel.1 down

brctl show
brctl delbr docker0

ip link delete cni0
ip link delete flannel.1

```

## .6. Flannel 网络插件部署

> pod 与 pod 通信需要网络插件，通过 k8s 提供的 CNI 接口安装 flannel 插件

### .6.1. 下载 YAML 文件

flannel 有众多版本，需要查看官方文档是否适合当前版本。

需要查看当前 k8s 支持的 api-versions : `k api-versions`

本次采用 flannel v0.14.0 版本

- <https://github.com/flannel-io/flannel/blob/v0.13.1-rc2/Documentation/kubernetes.md>

```sh
wget https://raw.githubusercontent.com/flannel-io/flannel/v0.13.1-rc2/Documentation/kube-flannel.yml
```

### .6.2. 修改 kube-flannel.yml

- 查看当前集群中的 pod 网络段设置

```sh
-> # kubectl -n kube-system get cm kubeadm-config -oyaml
apiVersion: v1
kind: ConfigMap
data:
....
      podSubnet: 10.244.0.0/16
      serviceSubnet: 10.96.0.0/12
 ....
```

- 自定义 network，大约84行

```yaml
  net-conf.json: |
    {   
      "Network": "10.244.0.0/16", # 修改与之前设置的 pod IP网络段一致
      "Backend": {
        "Type": "vxlan"  # 采用兼容模式
      }
    }

```

![kubeadm-install-20220805173058](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220805173058)

### .6.3. 部署异常

#### .6.3.1. NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized

```sh
Aug 16 12:56:03 kube-10 kubelet[6291]: W0816 12:56:03.260171    6291 cni.go:171] Error loading CNI config list file /etc/cni/net.d/10-flannel.conflist: error parsing configuration list: invalid character 't' looking for beginning of object key string
Aug 16 12:56:03 kube-10 kubelet[6291]: W0816 12:56:03.260216    6291 cni.go:237] Unable to update cni config: no valid networks found in /etc/cni/net.d
Aug 16 12:56:04 kube-10 kubelet[6291]: E0816 12:56:04.660240    6291 kubelet.go:2187] Container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
```

解决方法：修改/var/lib/kubelet/kubeadm-flags.env文件，删除参数 --network-plugin=cni

```sh
cat /var/lib/kubelet/kubeadm-flags.env
KUBELET_KUBEADM_ARGS="--cgroup-driver=systemd --network-plugin=cni --pod-infra-container-image=registry.aliyuncs.com/google_containers/pause:3.1"

# 重启 kubelet
systemctl restart kubelet
```

查看集群状态：

```sh
-> # k get no
NAME      STATUS   ROLES    AGE   VERSION
kube-10   Ready    master   64m   v1.16.11
```

## .7. Ingress 组件

### .7.1. 基本原理

Ingress也是Kubernetes API的标准资源类型之一，它其实就是一组基于DNS名称（host）或URL路径把请求转发到指定的Service资源的规则。用于将集群外部的请求流量转发到集群内部完成的服务发布。我们需要明白的是，Ingress资源自身不能进行“流量穿透”，仅仅是一组规则的集合，这些集合规则还需要其他功能的辅助，比如监听某套接字，然后根据这些规则的匹配进行路由转发，这些能够为Ingress资源监听套接字并将流量转发的组件就是Ingress Controller。

Ingress 其实就是从 Kuberenets 集群外部访问集群的一个入口，将外部的请求转发到集群内不同的 Service 上，其实就相当于 nginx、haproxy 等负载均衡代理服务器。

Ingress Controller 可以理解为一个监听器，通过不断地监听 kube-apiserver，实时的感知后端 Service、Pod 的变化，当得到这些信息变化后，Ingress Controller 再结合 Ingress 的配置，更新反向代理负载均衡器，达到服务发现的作用。

Ingress Controller 有很多开源实现，比如 traefik、nginx-controller、Kubernetes Ingress Controller for Kong、HAProxy Ingress controller等等。

![Ingress原理图](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220809153332)

### .7.2. 常见的部署与暴露方式

#### .7.2.1. Deployment+LoadBalancer 模式的 Service

如果要把ingress部署在公有云，那用这种方式比较合适。用Deployment部署ingress-controller，创建一个type为LoadBalancer的service关联这组pod。大部分公有云，都会为LoadBalancer的service自动创建一个负载均衡器，通常还绑定了公网地址。只要把域名解析指向该地址，就实现了集群服务的对外暴露。

#### .7.2.2. Deployment+NodePort 模式的 Service

同样用deployment模式部署ingress-controller，并创建对应的服务，但是type为NodePort。这样，ingress就会暴露在集群节点ip的特定端口上。由于nodeport暴露的端口是随机端口，一般会在前面再搭建一套负载均衡器来转发请求。该方式一般用于宿主机是相对固定的环境ip地址不变的场景。
NodePort方式暴露ingress虽然简单方便，但是NodePort多了一层NAT，在请求量级很大时可能对性能会有一定影响

#### .7.2.3. DaemonSet+HostNetwork+nodeSelector 模式

用DaemonSet结合nodeselector来部署ingress-controller到特定的node上，然后使用HostNetwork直接把该pod与宿主机node的网络打通，直接使用宿主机的80/433端口就能访问服务。这时，ingress-controller所在的node机器就很类似传统架构的边缘节点，比如机房入口的nginx服务器。该方式整个请求链路最简单，性能相对NodePort模式更好。缺点是由于直接利用宿主机节点的网络和端口，一个node只能部署一个ingress-controller pod。比较适合大并发的生产环境使用。

### .7.3. Ingress-nginx 部署

```sh
wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/baremetal/deploy.yaml

mv deploy.yaml ingress-nginx.yaml

k apply -f ingress-nginx.yaml --dry-run
k apply -f ingress-nginx.yaml
```

修改 ingress-nginx.yaml 配置

```yaml
kind: Deployment
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/instance: ingress-nginx
      app.kubernetes.io/component: controller
  revisionHistoryLimit: 10
  minReadySeconds: 0
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/component: controller
    spec:
      dnsPolicy: ClusterFirst
      hostNetwork: true
      ....
```

### .7.4. Ingress 测试

```sh
# 部署
k apply -f https://raw.githubusercontent.com/yezihack/kube-box/master/mainfest/kube-ingress-podanti.yaml

# 查看 po
k -n default get po 

# 设置 host
vim /etc/hosts

192.168.9.10 kube-box.io

# 测试 kube-box
curl kube-box.io/
curl kube-box.io/kube-box/ping

```

### .7.5. 部署异常

(1). MountVolume.SetUp failed for volume "webhook-cert" : secret "ingress-nginx-admission" not found

```sh
Warning  FailedMount  7m11s (x3 over 14m)       kubelet, kube-14   Unable to attach or mount volumes: unmounted volumes=[webhook-cert], unattached volumes=[ingress-nginx-token-8jf2j webhook-cert]: timed out waiting for the condition
  Normal   Scheduled    <invalid>                 default-scheduler  Successfully assigned ingress-nginx/ingress-nginx-controller-f8d756996-4lbtn to kube-14
  Warning  FailedMount  <invalid> (x23 over 18m)  kubelet, kube-14   MountVolume.SetUp failed for volume "webhook-cert" : secret "ingress-nginx-admission" not found
  Warning  FailedMount  <invalid> (x15 over 16m)  kubelet, kube-14   Unable to attach or mount volumes: unmounted volumes=[webhook-cert], unattached volumes=[webhook-cert ingress-nginx-token-8jf2j]: timed out waiting for the condition
```

- 解决：

```sh
# 查看 secret 
-> # k -n ingress-nginx get secret
NAME                                  TYPE                                  DATA   AGE
default-token-6gdsm                   kubernetes.io/service-account-token   3      51m
ingress-nginx-admission-token-crdmf   kubernetes.io/service-account-token   3      51m
ingress-nginx-token-8jf2j             kubernetes.io/service-account-token   3      51m

# 没有找到 secret "ingress-nginx-admission" not found，实际上是ingress-nginx-admission-token-crdmf 这个名称，所以需要改名为：ingress-nginx-admission

k -n ingress-nginx get secret ingress-nginx-admission-token-crdmf -o yaml > ingress-nginx-admission.yaml

k appply -f ingress-nginx-admission.yaml --dry-run
k appply -f ingress-nginx-admission.yaml

```

(2). Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io"

```sh
Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post 
https://ingress-nginx-controller-admission.kube-system.svc:443/networking/v1beta1/ingresses?
timeout=10s: dial tcp 192.168.9.10:6443: connect: connection refused
```

- 原因分析:

我刚开始使用yaml的方式创建nginx-ingress，之后删除了它创建的命名空间以及 clusterrole and clusterrolebinding ，但是没有删除ValidatingWebhookConfiguration ingress-nginx-admission，这个ingress-nginx-admission是在yaml文件中安装的。当我再次使用helm安装nginx-ingress之后，创建自定义的ingress就会报这个错误。

- 解决:

```sh
# 使用下面的命令查看 webhook
kubectl get validatingwebhookconfigurations ingress-nginx-admission

# 删除ingress-nginx-admission
kubectl delete -A ValidatingWebhookConfiguration ingress-nginx-admission
```

## .8. 集群监控

### .8.1. metrics-server

Metrics Server 是 Kubernetes 集群核心监控数据的聚合器，Metrics Server 从 Kubelet 收集资源指标，并通过 Merics API 在 Kubernetes APIServer 中提供给缩放资源对象 HPA 使用。也可以通过 Metrics API 提供的 Kubectl top 查看 Pod 资源占用情况，从而实现对资源的自动缩放。

主要功能：主要是基于 Kubernetes 集群的 CPU、内存的水平自动缩放。

#### .8.1.1. 安装

安装前需要查看对应的版本，如当前 k8s 1.16 选择为：v0.3.6

![kubeadm-install-20220815151235](https://cdn.jsdelivr.net/gh/yezihack/assets/b/kubeadm-install-20220815151235)

```sh
# 下载YAML
wget -O /opt/deploy/metrics-server.yaml https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml
```

修改几个关键代码：

```sh
containers:
      - name: metrics-server
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/metrics-server-amd64:v0.3.6 # 在境内请修改为国内
        imagePullPolicy: IfNotPresent
        args:
          - --cert-dir=/tmp
          - --secure-port=4443
          - --kubelet-insecure-tls # 新增
          - --kubelet-preferred-address-types=InternalIP # 新增
          # - --kubelet-preferred-address-types=InternalIP,Hostname,InternalDNS,ExternalDNS,ExternalIP
```

```sh
kubectl apply -f /opt/deploy/metrics-server.yaml
```

## .9. 参考

- [详解：Linux Chrony 设置服务器集群同步时间](https://www.linuxprobe.com/centos7-chrony-time.html)
- [Istio实战指南](https://huangzhongde.cn/istio/)
- [QuickNote: Kubernetes — Networking Issues](https://medium.com/@cminion/quicknote-kubernetes-networking-issues-78f1e0d06e12)
- [k8s coredns显示0/1 Running问题排查](https://www.cxymm.net/article/mayi_xiaochaun/121402679)
- [使用kubeadm安装kubernetes1.16](https://segmentfault.com/a/1190000020738509)

## .10. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
