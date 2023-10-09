---
title: "云运维笔记(8) Kubeadm 内网补丁版本升级，从v1.16.0至v1.16.15"
date: 2022-12-09T16:26:37+08:00
lastmod: 2022-12-09T16:26:37+08:00
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

## .1. 为什么升级

- 漏洞问题
- 使用新功能

## .2. 特殊性

- 内网环境，没有外网。
- 多 master 集群。
- 外置 Etcd。

## .3. 版本

- kubeadm升级前版本：v1.16.0
- kubeadm升级后版本：v1.16.15

## .4. 升级前的检查

### .4.1. 查看当前版本

```sh
kubeadm version

kubeadm version: &version.Info{Major:"1", Minor:"16", GitVersion:"v1.16.0", GitCommit:"72c30166b2105cd7d3350f2c28a219e6abcd79eb", GitTreeState:"clean", BuildDate:"2020-01-18T23:29:13Z", GoVersion:"go1.13.5", Compiler:"gc", Platform:"linux/amd64"}
```

### .4.2. 离线下载 kubectl,kubeadm,kubelet 下载

```sh
# 必须本机没有安装以下软件
version="1.16.15"
yumdownloader --resolve --destdir=/opt/local-packages/ kubelet-${version} kubeadm-${version} kubectl-${version}
```

### .4.3. 制作共享 YUM 源

使用工具：[saber](https://github.com/yezihack/saber/releases/tag/v1.0.0)

假定本机IP：192.168.10.10

```sh
# 安装 Createrepo
yum install createrepo -y

createrepo /opt/local-packages/ 
# 如果存在 repodata 则使用更新
createrepo --update /opt/local-packages/

# 共享文件
saber fs /opt/local-packages/
```

### .4.4. 设置 yum 源

每台要升级的机器设置一下内网 yum 源

```sh
cat > /etc/yum.repos.d/local-packages.repo << EOF
[local-packages]
name=local-packages
baseurl=http://192.168.10.10:7000/
gpgcheck=0
enabled=1
EOF

# 查看，设置缓存源
yum repolist && yum makecache fast
```

### .4.5. k8s 组件镜像下载

> 查看指定版本的镜像

需要将外网的镜像下载然后再上传到内网上(me.hubor.io)，必须有外网的机器。

```sh
# 查看镜像列表
kubeadm config images list  --kubernetes-version=1.16.15 --image-repository=registry.aliyuncs.com/google_containers

# 显示结果
registry.aliyuncs.com/google_containers/kube-apiserver:v1.16.15
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.16.15
registry.aliyuncs.com/google_containers/kube-scheduler:v1.16.15
registry.aliyuncs.com/google_containers/kube-proxy:v1.16.15
registry.aliyuncs.com/google_containers/pause:3.1
registry.aliyuncs.com/google_containers/etcd:3.3.15-0
registry.aliyuncs.com/google_containers/coredns:1.6.2
```

将以上镜像上传到内网(me.hubor.io)

- [upload-images.sh](https://gist.github.com/yezihack/c57bcd84b81571faa5d2a229951c3534)

运行下载镜像并上传：

```sh
chmod +x upload-images.sh 
./upload-images.sh download 1.16.15
```

## .5. 执行升级

- v1.16.0 升级至 v1.16.15
- 控制面节点上的升级过程应该每次处理一个节点。 首先选择一个要先行升级的控制面节点。该节点上必须拥有 /etc/kubernetes/admin.conf 文件

> 内网环境则需要下载好需要安装的版本软件放入YUM源里。

### .5.1. 升级主控制面板节点

> 本次操作机器：kube-10，该节点上必须拥有 /etc/kubernetes/admin.conf 文件

- 安装 kubeadm-1.16.15

```sh
# 升级 kubeadm 
yum install -y kubeadm-1.16.15-0 --disableexcludes=kubernetes
```

```sh
# 查看版本验证升级成功
kubeadm version

# 查看集群节点列表
kubectl get no

NAME      STATUS   ROLES    AGE    VERSION
kube-10   Ready    master   9h    v1.16.0
kube-11   Ready    master   8h     v1.16.0
kube-12   Ready    <none>   8h     v1.16.0
```

- 查看升级计划

```sh
kubeadm upgrade plan
```

显示结果：

```text
### result
Upgrade to the latest stable version:

COMPONENT            CURRENT    AVAILABLE
API Server           v1.16.0   v1.16.15
Controller Manager  v1.16.0   v1.16.15
Scheduler           v1.16.0   v1.16.15
Kube Proxy          v1.16.0   v1.16.15
CoreDNS              1.6.2      1.6.5
Etcd                 3.3.15     3.4.3-0

You can now apply the upgrade by executing the following command:

kubeadm upgrade apply v1.16.15
```

本次不直接使用 `kubeadm upgrade apply v1.16.15`命令，因集群特殊性，采用配置文件升级。

- 导出 kubeadm-config 配置，预先下载镜像

```sh
kubeadm config view > kubeadm-config-v1.16.15.yaml

# 修改
imageRepository: me.hubor.io/google_containers # 设置内网的镜像源地址
kind: ClusterConfiguration
kubernetesVersion: v1.16.15  # 修改为升级目录版本
```

升级 kube-10 主节点

> 升级完后集群内所有的 kube-proxy 会重启一次。

```sh
# 执行升级命令(模拟运行)

## 适合外置 ETCD
# --certificate-renewal 禁止更新证书操作
#  --etcd-upgrade=false 禁止更新 etcd 
kubeadm upgrade apply v1.16.15 --certificate-renewal=false --etcd-upgrade=false --config kubeadm-config-v1.16.15.yaml --ignore-preflight-errors=ControlPlaneNodesReady,swap --dry-run


# 执行升级命令(真实运行)

## 适合外置 ETCD
# --certificate-renewal 禁止更新证书操作
#  --etcd-upgrade=false 禁止更新 etcd 
kubeadm upgrade apply v1.16.15 --certificate-renewal=false --etcd-upgrade=false --config kubeadm-config-v1.16.15.yaml --ignore-preflight-errors=ControlPlaneNodesReady,swap

# 显示以下信息，表示成功
....
[upgrade/successful] SUCCESS! Your cluster was upgraded to "v1.16.15". Enjoy!
...

```

升级主控制面板 kubelet, kubectl

```sh
# 从集群中驱逐升级的节点
kubectl drain kube-10 --ignore-daemonsets --delete-local-data=true --dry-run
kubectl drain kube-10 --ignore-daemonsets --delete-local-data=true 

# 升级 kubelet, kubectl 
sudo yum update -y kubelet-1.16.15-0 kubectl-1.16.15-0 --disableexcludes=kubernetes

# 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet

# 查看 kubelet 状态
systemctl status kubelet

# 取消对控制面节点的保护
kubectl uncordon  kube-10
```

- 查看集群节点

目前主节点已升级为 v1.16.15 版本，工作节点还是 v1.16.0 版本，接下来需要升级其它控制面板和工作节点。

```sh
-> # k get no                
NAME      STATUS   ROLES    AGE    VERSION
kube-10   Ready    master   9h    v1.16.15
kube-11   Ready    master   8h     v1.16.0
kube-12   Ready   <none>  8h     v1.16.0
```

#### .5.1.1. 升级其他控制平面节点

> 操作 kube-11 节点

与第一个控制面节点相同，但是使用：

```sh
sudo kubeadm upgrade node
```

而不是：

```sh
sudo kubeadm upgrade apply
```

此外，不需要执行 kubeadm upgrade plan 和更新 CNI 驱动插件的操作

先升级  kubeadm

```sh
yum update -y kubeadm-1.16.15 --disableexcludes=kubernetes
```

选择其它主节点，使用：`kubeadm upgrade node` 命令

```sh
# 外部 etcd，无须升级 etcd --etcd-upgrade=false
sudo kubeadm upgrade node --certificate-renewal=false --etcd-upgrade=false --kubelet-version=v1.16.15 --dry-run 

# 真实运行
sudo kubeadm upgrade node --certificate-renewal=false --etcd-upgrade=false --kubelet-version=v1.16.15

# 显示以下信息，表示成功
[upgrade] The configuration for this node was successfully updated!
[upgrade] Now you should go ahead and upgrade the kubelet package using your package manager.
```

升级其它控制面板 kubelet, kubectl

```sh
# 从集群中驱逐升级的节点
kubectl drain kube-11 --ignore-daemonsets --delete-local-data=true --dry-run
kubectl drain kube-11 --ignore-daemonsets --delete-local-data=true 

# 升级 kubelet, kubectl 
sudo yum update -y kubelet-1.16.15-0 kubectl-1.16.15-0 --disableexcludes=kubernetes

# 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet

# 查看 kubelet 状态
systemctl status kubelet

# 取消对控制面节点的保护
kubectl uncordon  kube-11
```

#### .5.1.2. 升级工作节点

> 操作 kube-12 节点

- 升级 kubeadm

```sh
yum update -y kubeadm-1.16.15 --disableexcludes=kubernetes
```

选择工作节点，使用：`kubeadm upgrade node` 命令

```sh
# 外部 etcd，无须升级 etcd --etcd-upgrade=false
sudo kubeadm upgrade node --certificate-renewal=false --etcd-upgrade=false --kubelet-version=v1.16.15 --dry-run 

# 真实运行
sudo kubeadm upgrade node --certificate-renewal=false --etcd-upgrade=false --kubelet-version=v1.16.15
```

升级工作面板 kubelet, kubectl

```sh
# 通过将节点标记为不可调度并逐出工作负载，为维护做好准备。运行：
kubectl drain kube-12 --ignore-daemonsets --delete-local-data=true --dry-run
kubectl drain kube-12 --ignore-daemonsets --delete-local-data=true 

# 升级 kubelet, kubectl 
sudo yum update -y kubelet-1.16.15-0 kubectl-1.16.15-0 --disableexcludes=kubernetes

# 重启 kubelet
systemctl daemon-reload
systemctl restart kubelet

# 查看 kubelet 状态
systemctl status kubelet

# 取消对控制面节点的保护
kubectl uncordon  kube-12
```

#### .5.1.3. 验证集群的状态

```sh
-> # kubectl get nodes       
NAME      STATUS   ROLES    AGE    VERSION
kube-10   Ready    master   175m   v1.16.15
kube-11   Ready    master   44m    v1.16.15
kube-12   Ready   <none>   40m    v1.16.15
```

## .6. 参考

- [kubeadm upgrade](https://kubernetes.io/zh-cn/docs/reference/setup-tools/kubeadm/kubeadm-upgrade/)


## .7. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
