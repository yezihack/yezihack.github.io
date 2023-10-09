---
title: "解决tcp6问题"
date: 2020-12-19T18:00:57+08:00
lastmod: 2020-12-19T18:00:57+08:00
draft: false
tags: ["linux", "error"]
categories: ["linux"]
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



> 背景: 在 windows 上安装了 vmware linux . 在 linux 上开启一个服务对外提供8080端口, 而在 windows 上无法访问到. 



## 解决思路 

1. 使用 `netstat -nplt` 查看端口上 `tcp`, 还是 `tcp6`
2. 查看是否只绑定在 ipv6 上 `sysctl net.ipv6.bindv6only`
3. 查看`ipv4` 上可以转发数据 : `sysctl net.ipv4.ip_forward`
4. 查看防火墙是否禁用端口.



## 第一步: 查看端口

`netstat -nplt`

```sh
-> # netstat -nplt
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1001/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      1156/master         
tcp6       0      0 :::8080                :::*                    LISTEN      28187/output/bin/go 
```

可以看出 `8080`端口只出现在 tcp6 上. 

## 第二步: 查看 ipv6

`sysctl net.ipv6.bindv6only`

```sh
-> # sysctl net.ipv6.bindv6only
net.ipv6.bindv6only = 0
```

0 表示没有死死的绑定在ipv6上

### 解决

```
vim /etc/sysctl.conf
# 添加下面这行
net.ipv6.bindv6only=1

# 然后保存退出. 重启网络
systemctl restart network
```



## 第三步: 查看 ipv4 转发状态

`sysctl net.ipv4.ip_forward`

```sh
-> # sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 1
```

1 表示可以转发, 也就是说 tcp6 上的数据也可以能过 tcp 转发

### 解决

```
vim /etc/sysctl.conf
# 添加下面这行
net.ipv4.ip_forward=1

# 然后保存退出. 重启网络
systemctl restart network
```

## 第三步: 防火墙

`iptables -nL`

```sh
-> # iptables -nL
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy DROP)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         

Chain DOCKER (0 references)
target     prot opt source               destination     
...
```

### 解决

**以下为粗暴解决(生产上谨慎操作)**

```sh
iptables -F
iptables-save
```

添加防火墙规则 

```sh
iptables -A INPUT -p tcp -m tcp --dport 8080 -j ACCEPT  //开放8080端口  
iptables-save
```

