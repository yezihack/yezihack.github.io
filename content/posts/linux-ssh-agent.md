---
title: "Linux ssh-agent 极简教程"
date: 2024-01-30T18:52:04+08:00
lastmod: 2024-01-30T18:52:04+08:00
draft: false
tags: ["linux", "ssh", "极简教程"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
---
<!-- TOC -->

- [1. .1. ssh-agent 简介](#1-1-ssh-agent-简介)
- [2. .2. 原理图](#2-2-原理图)
- [3. .3. 生成密钥对](#3-3-生成密钥对)
- [4. .4. 开启 ssh-agent](#4-4-开启-ssh-agent)
- [5. .5. ssh-add 管理密钥](#5-5-ssh-add-管理密钥)
  - [5.1. .5.1. 添加](#51-51-添加)
  - [5.2. .5.2. 查看](#52-52-查看)
  - [5.3. .5.3. 删除](#53-53-删除)
- [6. .6. 复制公钥](#6-6-复制公钥)
- [7. .7. ssh 免密连接](#7-7-ssh-免密连接)
- [8. .8. 终结 ssh-agent](#8-8-终结-ssh-agent)
- [9. 自动化](#9-自动化)
- [10. DEBUG](#10-debug)

<!-- /TOC -->
## 1. .1. ssh-agent 简介

ssh-agent 是一个用于管理 SSH 密钥的认证代理，它可以在一段时间内缓存您的私钥，使得在此期间内无需重复输入密码即可进行 SSH 连接。下面是关于 ssh-agent 的优缺点：

优点：

方便性：ssh-agent 可以让用户在一定时间内轻松地管理和使用他们的 SSH 密钥，而无需反复输入密码。
安全性：通过 ssh-agent，用户可以将私钥保存在内存中而不是硬盘上，从而减少私钥被恶意获取的风险。
自动化：对于脚本或其他自动化操作，ssh-agent 可以让您无需人工干预即可进行安全的 SSH 连接。
缺点：

安全性考量：尽管 ssh-agent 提高了私钥的安全性，但一旦攻击者获得了对系统的完全控制权限，仍然可能访问到内存中的私钥。
生命周期管理：ssh-agent 中缓存的密钥在一定时间内保持有效，这可能会导致一些安全隐患，特别是在共享计算机上使用时。

总的来说，ssh-agent 为 SSH 密钥的管理提供了便利性和安全性，但在使用时仍需用户对其安全性有清晰的认识，并设置合适的安全策略以确保数据的安全。

## 2. .2. 原理图

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20240130193057.png)

## 3. .3. 生成密钥对

- 随机密码：<https://suijimimashengcheng.bmcx.com/>

```sh
mkdir /opt/.ssh

# 生成带密钥的密钥对
ssh-keygen -f <文件名称> -t rsa -P <3种类型16位以上的密码>

# 例1 显式输入密码
ssh-keygen -f box -t rsa -P "16位以上的密码"

# 例2 隐式输入密码（推荐）
ssh-keygen -f box -t rsa
```
生成两个文件

- box 是私钥(加密的)
- box.pub 是公钥

## 4. .4. 开启 ssh-agent

```sh
eval `ssh-agent`

# or
eval "$(ssh-agent -s)"
```

## 5. .5. ssh-add 管理密钥

### 5.1. .5.1. 添加

```sh
# box 私钥
ssh-add box
```

### 5.2. .5.2. 查看

```sh
# 查看私钥列表，所有的哦
ssh-add -l

# 查看公钥列表，也是所有的哦
ssh-add -L
```

### 5.3. .5.3. 删除

```sh
# 删除单个密钥对
ssh-add -d box

# 删除所有的密钥对
ssh-add -D
```

## 6. .6. 复制公钥

- 不是本机，是其它机器上哦

```sh
mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys

# 将 box 公钥内容粘贴到文件内
vim  ~/.ssh/authorized_keys
## 或
ssh-copy-id -i box user@remote-server
```

## 7. .7. ssh 免密连接

```sh
# 身份验证检查，更加安全哟
ssh <other-host>

# or 免提示哦
ssh -o StrictHostKeyChecking=no <other-host>
```

## 8. .8. 终结 ssh-agent

- ssh-agent 是将密钥保存在内存里，为了安全终结当前 ssh-agent 进程。

```sh
ssh-agent -k

# 如果成功关闭 ssh-agent，它会输出以下消息
Agent pid 12345 killed
```

## 9. 自动化

```sh
# 将 SSH Agent 环境变量添加到 .bashrc 中以便之后的 shell 会话能够找到 agent
echo 'eval $(ssh-agent)' >> ~/.bashrc
echo 'ssh-add /opt/ssh/box' >> ~/.bashrc
```

## 10. DEBUG

> 将公钥复制再次 ssh 时还提示输入密码，则需要采用以下操作。

```sh
# 设置权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 /path/to/your/private/key

# debug
ssh -vvv user@remote-server

# 查看公钥
ssh-add -L

# 指定私钥
   ssh -i /path/to/your/private/key user@remote-server
```
