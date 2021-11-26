---
title: "rsyslog 占用内存过高"
date: 2020-10-16T10:38:58+08:00
lastmod: 2020-10-16T10:38:58+08:00
draft: false
tags: ["linux", "优化"]
categories: ["linux"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---

## 排查问题

使用`top` 再按大写`M`， 对内存采用降序显示，一目了然看到谁占用内存最高。

![image-20201016104223772](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20201016104225.png?imageslim)

定位到`rsyslogd`进程占用内存25.7%，非常可怕，需要急需解决掉它。

> 什么是`rsyslog`: 系统提供的多线性日志系统，参考: https://www.rsyslog.com/



## 解决问题

`rsyslogd`是它的守护进程，可以通过`systemctl status rsyslog` 查看运行状态

![image-20201016110056427](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20201016110057.png?imageslim)

红色显示错误信息。

1. 使用`journalctl --verify` 检查系统日志卷文件损坏情况

   如果检查出来有红色的文件，则直接删除即可。

2. 删除`/var/lib/rsyslog/imjournal.state` 文件
3. 重启`rsyslogd`进程， `systemctl restart rsyslog`

然后使用 `top` 查看，内存占用率是否没有啦。

## 避免再次发生

1. 修改`/etc/rsyslog.conf` 文件

   最后行添加2行代码

   ```shell
   $imjournalRatelimitInterval 0
   $imjournalRatelimitBurst 0
   ```

   重启服务:`systemctl restart rsyslog`

2. 关闭 `journal` 压缩配置

   ```shell
   vim /etc/systemd/journald.conf
   # 找到 #Compress=yes 修改成 no
   Compress=no
   # 重启服务
   systemctl restart systemd-journald
   ```

   