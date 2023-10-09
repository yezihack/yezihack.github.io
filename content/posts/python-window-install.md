---
title: "Python Window10 安装"
date: 2020-07-27T11:14:29+08:00
lastmod: 2020-07-27T11:14:29+08:00
draft: false
tags: ["python", "window10"]
categories: ["python"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

![img](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200727113627.webp?imageslim)

window 10环境下安装 python3.8 版本. 采用国内镜像, 国内官方下载实在太慢, 无法忍受. 

## 下载安装

推荐华为镜像下载.

https://mirrors.huaweicloud.com/python/3.8.0/

选择 window 64 位

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200727111833.png?imageslim)

下载后,双击文件

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200727112728.png?imageslim)


1.  python 安装的目录
2. 勾选加入环境变量. 如果忘记勾选需要配置环境变量. 

   1. 右击我的电脑->高级系统设置->环境变量->系统变量(最下面的框)->找到`path`变量名称->点击编辑->点击新建->把 python的目录加入即可.(即安装时的目录)

## 配置 pip

pip 是安装 python 模块的工具.

还是那样, 默认下载源非常慢, 配置国内源.

window 10 找到 `C:\Users\<yourname>\AppData\Roaming\pip` 也许你找不到这个目录, `<yourname>`是你的计算机名称, `AppData` 是一个隐藏目录, 点击输入栏输入`AppData`进入, 然后找到`Roaming`, 如果没有找到`pip`目录,请新建一个`pip`目录, 然后在`pip`目录下新建一个`pip.ini`文件, 填下以下内容即可.

```ini
[global]
index-url = https://mirrors.huaweicloud.com/repository/pypi/simple
trusted-host = mirrors.huaweicloud.com
timeout = 120
```

### 更新 pip 

打开你的`cmd`工具, 输入 `python -m pip install --upgrade  pip`即可更新

![image-20200727113234399](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200727113235.png?imageslim)

划线部分显示采用了刚才配置的源信息.说明没有走官网的源.这样非常快的更新完了. 如果你的界面没有动, 回车一下即可.(window常见的毛病)



如果镜像不好用,可以临时指定镜像, 如安装 `requests` 库

```
pip install requests -i http://pypi.douban.com/simple --trusted-host=pypi.douban.com
```





**画境**

《竹里馆》

​					-- 唐·王维。

独坐幽篁里，弹琴复长啸。

深林人不知，明月来相照