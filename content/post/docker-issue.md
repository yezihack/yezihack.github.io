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

![](http://img.sgfoot.com/b/20200826110835.png?imageslim)

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

## 参考

1. https://juejin.im/post/6844903953793024014