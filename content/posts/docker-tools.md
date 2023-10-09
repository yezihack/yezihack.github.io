---
title: "Docker busybox 镜像工具"
date: 2022-03-31T14:20:11+08:00
lastmod: 2022-03-31T14:20:11+08:00
draft: false
tags: ["docker", "busybox"]
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

<!-- TOC -->

- [.1. busybox](#1-busybox)
- [.2. progrium/busybox](#2-progriumbusybox)
- [.3. Alpine](#3-alpine)
  - [.3.1. Alpine 替换国内源](#31-alpine-替换国内源)
  - [.3.2. Dockerfile](#32-dockerfile)
  - [.3.3. 升级&安装软件](#33-升级安装软件)
- [.4. sgfoot/busybox](#4-sgfootbusybox)
  - [.4.1. 支持常用命令](#41-支持常用命令)
  - [.4.2. 更加详情的命令列表](#42-更加详情的命令列表)

<!-- /TOC -->
busybox 本身集成了300多个常用工具命令. 用于日常开发,维护.也是体积比较小. 
但是 busybox 本身不支持 curl,很遗憾,所以有了衍生品.

## .1. busybox

原生的 busybox, 大小718K左右,不及1M大小.

本身采用 apt-get install 安装工具

## .2. progrium/busybox

官方地址: [https://hub.docker.com/r/progrium/busybox](https://hub.docker.com/r/progrium/busybox)

支持创建自己的镜像,安装,采用 opkg-install  安装软件.

```sh
FROM progrium/busybox
RUN opkg-install curl bash git
CMD ["/bin/bash"]
```

## .3. Alpine

### .3.1. Alpine 替换国内源

```sh
# 查看镜像源
cat /etc/apk/repositories

http://dl-cdn.alpinelinux.org/alpine/v3.11/main
http://dl-cdn.alpinelinux.org/alpine/v3.11/community

# 替换阿里云
sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 替换科技大学
sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 替换清华源
sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
```

### .3.2. Dockerfile

```sh
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache gcc musl-dev linux-headers
```

### .3.3. 升级&安装软件

```sh
# 升级
apk update
apk upgrade

# 安装 bash
apk add --no-cache bash

# 安装 bash 文档
apk add bash-doc

# 安装 bash 自动化命令行
apk add bash-completion zsh vim curl

# 改变当前环境 Bash
bash
```

## .4. sgfoot/busybox

基于 alpine:3.15.4 构建 [busybox](https://hub.docker.com/r/sgfoot/busybox) 工具箱。

### .4.1. 支持常用命令

1. curl 是一款很强大的http命令行工具
1. wget 是一个下载文件的工具
1. bash 支持数组
1. nc 在网络工具中有“瑞士军刀”美誉
1. nc ip port
1. nc -l 9999 > a.tgz 开启监听
1. nc ip port < a.tgz 发送数据
1. ping 用来作为网络可用性的检查
1. nslookup 查询域名信息的一个非常有用的命令
1. traceroute 用于追踪数据包在网络上的传输时的全部路径

### .4.2. 更加详情的命令列表

> 支持100多种命令

```sh
acpid, add-shell, addgroup, adduser, adjtimex, arch, arp, arping, ash, awk

base64, basename, bbconfig, bc, beep, blkdiscard, blkid,blockdev, brctl, bunzip2, bzcat, bzip2

cal, cat, chgrp, chmod, chown, chpasswd, chroot, chvt, cksum, clear, cmp, comm, cp, cpio, crond,crontab, cryptpw, cut

date, dc, dd, deallocvt, delgroup, deluser, depmod, df, diff, dirname, dmesg, dnsdomainname, dos2unix, du, dumpkmap,

echo, ed, egrep, eject, env, ether-wake, expand, expr

factor, fallocate, false, fatattr, fbset, fbsplash, fdflush, fdisk, fgrep, find,
findfs, flock, fold, free, fsck, fstrim, fsync, fuser

getopt, getty, grep, groups, gunzip, gzip

halt, hd, head, hexdump, hostid,hostname, hwclock, 

id,ifconfig, ifdown, ifenslave, ifup,init, inotifyd, insmod, install, ionice, iostat, ip, ipaddr, ipcalc, ipcrm, ipcs,iplink, ipneigh, iproute, iprule, iptunnel

kbd_mode, kill, killall, killall5, klogd

less, link, linux32, linux64, ln, loadfont, loadkmap,logger, login, logread, losetup, ls, lsmod, lsof, lsusb, lzcat, lzma, lzop, lzopcat

makemime, md5sum, mdev, mesg, microcom, mkdir,mkdosfs, mkfifo, mkfs.vfat, mknod, mkpasswd, mkswap, mktemp, modinfo, modprobe, more, mount, mountpoint, mpstat, mv

nameif, nanddump,nandwrite, nbd-client, nc, netstat, nice, nl, nmeter, nohup, nologin, nproc, nsenter, nslookup, ntpd

od, openvt

partprobe, passwd, paste,pgrep, pidof, ping, ping6, pipe_progress, pivot_root, pkill, pmap, poweroff, printenv, printf, ps, pscan, pstree, pwd, pwdx

raidautorun,rdate, rdev, readahead, readlink, realpath, reboot, reformime, remove-shell, renice, reset, resize, rev, rfkill, rm, rmdir, rmmod, route,
run-parts

sed, sendmail, seq, setconsole, setfont, setkeycodes, setlogcons, setpriv, setserial, setsid, sh, sha1sum, sha256sum, sha3sum,sha512sum, showkey, shred, shuf, slattach, sleep, sort, split, stat, strings, stty, su, sum, swapoff, swapon, switch_root, sync, sysctl,
syslogd

tac, tail, tar, tee, test, time, timeout, top, touch, tr, traceroute, traceroute6, true, truncate, tty, ttysize, tunctl, udhcpc,

udhcpc6, umount, uname, unexpand, uniq, unix2dos, unlink, unlzma, unlzop, unshare, unxz, unzip, uptime, usleep, uudecode, uuencode,

vconfig, vi, vlock, volname

watch, watchdog, wc, wget, which, whoami, whois

xargs, xxd, xzcat

yes

zcat
```
