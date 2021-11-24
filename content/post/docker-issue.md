---
title: "Docker 问题集"
date: 2020-08-26T11:00:28+08:00
lastmod: 2020-08-26T11:00:28+08:00
draft: false
tags: ["issue", "docker"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## Docker映射端口时仅有IPv6无法到IPv4解决方法

启动 docker 某服务，只显示 ipv6 的端口信息。ipv4 无端口信息，导致外部无法通过 ipv4 访问服务，报 `Connection refused` 错误

**解决方法**

在服务器上禁用 ipv6

```sh
vim /etc/default/grub
```

在第6行中增加 `ipv6.disable=1`

![](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20200826110835.png?imageslim)

```sh
GRUB_CMDLINE_LINUX="ipv6.disable=1 crashkernel=auto spectre_v2=retpoline rd.lvm.lv=centos/root rd.lvm.lv=centos/swap rhgb quiet"
```

重新配置grub并重启服务器

```sh
grub2-mkconfig -o /boot/grub2/grub.cfg
reboot
```

## WARNING: bridge-nf-call-iptables is disabled
```
WARNING: bridge-nf-call-iptables is disabled
WARNING: bridge-nf-call-ip6tables is disabled
```

**解决方法**

```sh
vim /etc/sysctl.conf

# 添加以下二行内容
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1

# 然后使其生效
sysctl -p /etc/sysctl.conf

# 验证
docker info
```

## docker 磁盘不足

**第一步： 查看服务的磁盘情况**

`df -h`

**第二步：查看 docker 使用的磁盘路径**

`docker info` 找到 `Docker Root Dir`节点。

![image-20210218150344102](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210218150344.png?imageslim)

一般默认目录是在:`/var/lib/docker`

**第三步：迁移数据之前查看哪个磁盘空间最大，新建新的docker目录**

```sh
du -h 
mkdir -p /data/docker/lib
```

**第四步：编辑 `/etc/docker/daemon.json` 添加参数**

```sh
{
	”graph": "/data/docker/lib/docker"
}
```

**第五步：停止docker服务**

```sh
systemctl stop docker
```

**第六步：迁移数据**

```sh
rsync -avz /var/lib/docker /data/docker/lib/
```

**第七步：重新启动 docker 服务**

```sh
docker daemon-reload && docker start docker
```

**第八步：检查迁移是否成功**

```sh
# 也就是第二步时的 docker root dir 目录是否更改为： /data/docker/lib 
docker info 

```

**第九步：删除 docker 旧目录**

```sh
rm -rf /var/lib/docker
```



## 参考

1. https://juejin.im/post/6844903953793024014