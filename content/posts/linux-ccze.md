---
title: "Linux Ccze 彩色化日志文件输出的工具"
date: 2024-01-21T17:50:55+08:00
lastmod: 2024-01-21T17:50:55+08:00
draft: false
tags: ["linux", "tools"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
---

## .1. 什么是 ccze

ccze 是 Linux 一个用于彩色化日志文件输出的工具。它可以将文本文件中的日志内容进行颜色标记，以提高可读性。

## .2. 安装

```sh
# 对于Debian/Ubuntu系统
sudo apt-get install ccze

# 对于CentOS/RHEL系统
sudo yum install ccze
```

## .3. 使用

- -A 选项用于启用ANSI颜色代码

```sh
cat nginx.log |ccze -A
cat nginx.log |ccze -A | more
journalctl -xeu docker|ccze -A|more
docker logs xxx |ccze
```

![](http://lintut.com/wp-content/uploads/2014/04/Example-using-ccze-tool.png)

导出 HTML

```sh
cat /var/log/messages |ccze -h > ~/messages.html
```

![](http://lintut.com/wp-content/uploads/2014/04/cczz-export-logfile-in-html.png)

## .4. 参考

- <https://www.cnblogs.com/flashfish/p/11230141.html>
- <https://lintut.com/colorize-log-files-on-linux-using-ccze-tool/>