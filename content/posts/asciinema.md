---
title: "Asciinema 搭配 asciicast2gif 终端录屏专家"  
date: 2022-11-29T17:40:13+08:00
lastmod: 2022-11-29T17:40:13+08:00
draft: false
tags: ["linux", "工具", "asciinema"]
categories: ["工具"]
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

## .1. 一点点

喜欢写博客的你，曾几何时开启录屏软件进行你的命令行录制，然后再转成 gif 动画图片。

此刻你看着几兆大小的gif或几十兆大小的gif，是不是有种别无办法的选择了。

现在告诉你有一种不行帧录制，而是文本录制，大小在 10 kb左右。神器就是：<https://asciinema.org/>

如同它的名称，ascii + nema，存储文件里是字符，自然轻盈。

## .2. 介绍

- [asciinema](https://github.com/asciinema/asciinema) 录制成文本文件,需要跳转到官方才能播放。
- [asciicast2gif](https://github.com/asciinema/asciicast2gif) 将录制的文本文件转成 gif

## .3. 安装 asciinema

> 由 python 编写

**CentOS：**

```sh
sudo yum install asciinema
```

**Ubuntu：**

```sh
sudo apt-get install asciinema
```

**MacOS：**

```sh
brew install asciinema
```

## .4. Asciinema 使用

### .4.1. 登陆

**登陆逻辑：**

asciinema 的登陆有别于传统的帐号密码，只需要一个邮箱即可实现个人登陆。

- 使用：`asciinema auth` 生成一个URL，后面是一串 UUID，做为唯一码。
- 复制 URL 浏览器上，输入您的邮件地址，系统会发一封认证 URL。
- 打开邮件点击 URL，采用 Token [JWT](https://jwt.io/) 实现的。
- 命令行上传文件时会携带 UUID 到服务器上验证，从而实现登陆功能。

```sh
-> # asciinema auth          
Open the following URL in a browser to register your API token and assign any recorded asciicasts to your profile:
https://asciinema.org/connect/4cd5756a-fdfc-4bfc-ad91-f0da88e66fe4
```

### .4.2. 开始录制

**两种模式上传：**

- asciinema rec 回车上传
- asciinema upload 文件上传

#### .4.2.1. 回车上传

- `asciinema rec` 开始录制
- 使用 `ctrl + d` 或 exit 退出录屏
- 按回车键则上传文件
- 按 `ctrl + c` 则保存在本地

```sh
# 开始录制 rec
-> % asciinema rec
asciinema: recording asciicast to /tmp/tmp3v37640p-ascii.cast # 临时保存文件
asciinema: press <ctrl-d> or type "exit" when you're done        # 使用 <ctrl-d> 或 exit 退出录屏

......

asciinema: recording finished
asciinema: press <enter> to upload to asciinema.org, <ctrl-c> to save locally
# 按回车键则上传文件，如果按 <ctrl-c> 则保存在本地

View the recording at:

    https://asciinema.org/a/CrII4W93tKIJt9wsveo8XwDjk

# 上传文件的URL
```

#### .4.2.2. upload 上传

```sh
asciinema upload first.json
```

### .4.3. 本地操作

- 保存本地文件
- 播放文件
- 上传文件

```sh
# 开始录屏
asciinema rec first.json

# 按 ctrl + d 停止录屏，自动保存文件当前目录。

# 播放文件 
asciinema play first.json

# 上传文件
asciinema upload first.json
```

**效果图：**

[![asciicast](https://asciinema.org/a/1nqoVzhdVYNaJsanBxMVT5FEh.svg)](https://asciinema.org/a/1nqoVzhdVYNaJsanBxMVT5FEh)

## .5. asciicast2gif

asciinema 录制成文本，并不能在 HTML 播放，必须在官方网站上插放，并不是很友好。

官方又开发了转换成 gif 插件，嵌入播客更友好。

### .5.1. 安装 asciicast2gif

采用 docker 方式部署

```sh
docker pull asciinema/asciicast2gif
```

### .5.2. 组合使用

```sh
# 开始录制
asciinema rec demo.json
# 按 ctrl + d
# ~ Asciicast recording finished

# 转换成 gif
docker run --rm -v $PWD:/data asciinema/asciicast2gif -S demo.json demo.gif
```

## .6. 制作快捷脚本

脚本名称：`/opt/sh/asciicast2gif.sh`

```sh
#!/bin/bash

rec_name=$(date +%Y%m%d%H%M%S)
rec_name="asciinema-${rec_name}"

echo "正在录制: ${rec_name}"

asciinema rec "${rec_name}.cast"

# 转换 gif
docker run --rm -e "GIFSICLE_OPTS=--lossy=80" -e "NODE_OPTS=--max-old-space-size=12288" -e "MAGICK_MEMORY_LIMIT=6gb" -e "MAGICK_MAP_LIMIT=12gb" -v $PWD:/data asciinema/asciicast2gif -S 1 -s 2 ${rec_name}.cast ${rec_name}.gif
```

添加到 `~/.bashrc` 或 `~/.zshrc` 文件中：

```sh
vim ~/.zshrc

alias rec='/bin/bash /opt/sh/asciicast2gif.sh'

source ~/.zshrc
```

*效果图：*

![asciinema-asciinema-20221129205943](https://cdn.jsdelivr.net/gh/yezihack/assets/b/asciinema-asciinema-20221129205943)


## .7. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
