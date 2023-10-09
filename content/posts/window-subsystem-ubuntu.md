---
title: "Window Subsystem Ubuntu"
date: 2020-03-14T22:36:14+08:00
draft: false
tags: ["工具", "win10", "subsystem", "ubuntu"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
---

> 做开发的话,如果是从mac或linux转为window的用户,有很多不习惯需要一些使用linux的命令
>而window虽然有powershell,还是不够尽兴,如果有一台linux系统又运行在window上,而又不是
>那种笨重的虚拟机,那该多好.而win10就满足了你的需求.win10内置linux子系统,让你操作如飞的感觉.

# win10安装linux子系统

## 第一步: 启用或关闭Windows功能

开始->设置->应用->找到"程序和功能"(一般在右边位置")->找到"启用或关闭Windows功能"

点击弹出窗口后, 向下拉找到"适用于Linux的Windows子系统"选项. 勾选后,确定. 重新电脑.

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417142630.png?imageslim)

## 第二步: 安装Ubuntu子系统

在Microsoft Store搜索ubuntu,点击免费安装.

下载完, 在开始程序中找到.点击进行初使化, 数分钟后安装完毕.

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417142734.png?imageslim)

## 第三步: 设置新帐号

1. 系统会 提示你设置一个用户名,然后再设置密码即可.正常使用ubuntu. 
2. 此时你还不是root帐号.安装东西需要使用root帐号

## 第四步:  初使root密码 

```
sudo passwd root #回车
输入新密码
确认密码
# 切换root
su root
```

## 更换ubuntu软件源

**切换root帐号**

`su root` #回车

**备份一下之前的源**

`cp /etc/apt/sources.list /etc/apt/sources.list.backup`

**编辑sources.list**

`vim /etc/apt/source.list` #按ecs,一直按d按键清空源,然后再i键

复制下面的aliyun源

**aliyun源**

```
# 1.阿里云源
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
##測試版源
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
# 源碼
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
##測試版源
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse

```

按ecs->:x 保存.

**更新软件包列表**

`apt-get update`

**升级软件**

`apt-get upgrade`

# 使用xshell 连接 Ubuntu子系统

**查看运行ssh运行状态**
`ps -e |grep ssh`

**如果未安装,则安装**
`sudo apt-get install openssh-server

**修改SSH配置文件**
```shell script
sudo vim /etc/ssh/sshd_config
Port 22
ListenAddress 0.0.0.0
PermitRootLogin yes
PasswordAuthentication yes
UseLogin yes
```

**运行ssh进程**

```
开启:sudo service ssh start
重启:sudo service ssh restart
停止:sudo service ssh stop
重启服务，运行两次，先停止后开启:`sudo service ssh --full-restart`
```


**xshell连接ubuntu**

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417142818.png?imageslim)

# 在window上如何优雅使用linux

安装的这个linux子系统并非虚拟机,而是微软win10系统自带内置.而我们想在windows上执行make命令,我们需要找到window上的盘.如何与win10通信呢.

一般window的盘都挂载在/mnt上. 只需要cd /mnt/d 代表跳到d盘上.

# cmder 优雅的工具
> 官网地址http://cmder.net/ 

full版功能强大，包含了git、powershell、bash、chocolatey、Cygwin、SDK等功能 

1. 加入PATH，使用win+R启动
1. 加入右击菜单： `Cmder.exe /REGISTER ALL` (使用管理员权限运行cmd)

```bash
可以利用Tab，自动路径补全
可以利用Ctrl+T建立新页签；
利用Ctrl+W关闭页签;
还可以透过Ctrl+Tab切换页签;
Alt+F4：关闭所有页签
Alt+Shift+1：开启cmd.exe
Alt+Shift+2：开启powershell.exe
Alt+Shift+3：开启powershell.exe (系统管理员权限)
Ctrl+1：快速切换到第1个页签
Ctrl+n：快速切换到第n个页签( n值无上限)
Alt + enter： 切换到全屏状态；
Ctr+r 历史命令搜索;
End, Home, Ctrl : Traversing text with as usual on Windows
```

# 参考

1. https://www.cnblogs.com/Mike2019/p/11888164.html
2. https://www.cnblogs.com/yayazhang221/p/11833882.html
3. https://www.jianshu.com/p/98ad2ab29eaa
1. cmder: https://www.jianshu.com/p/0d1264e9efc8   
1. https://www.jianshu.com/p/b691b48bcee3