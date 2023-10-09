---
title: "Windows 找不到文件 C: Program Files/Windowsapps...launcherrsxruntime.exe，请确定文件名是否正确后，再试一次"
date: 2022-11-13T08:27:37+08:00
lastmod: 2022-11-13T08:27:37+08:00
draft: false
tags: ["修复", "win10", "window10", "cmd"]
categories: ["windows"]
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

## .1. 错误提示

突然有一天，当你重启电脑后，系统就弹出以下错误弹窗，提示某某文件找不到。如果你没有解决，每次重启电脑
都会弹出此窗，非常讨厌，今天我们来解决此问题。

提示：Windows 找不到文件: "C:\\Program File\" 请确定文件名是否正确后，再试一次。

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/tasks-20221113083110)

## .2. 解决方法

- 打开你的 cmd，使用 win + R 或者开始-> 运行 -> 输入：cmd
- 注意：使用 administrator 权限打开 CMD
- 再输入以下代码即可。

```cmd
sfc /scannow

DISM /Online /Cleanup-Image /CheckHealth

# 如果执行失败后，重启后再执行此命令
DISM /Online /Cleanup-Image /ScanHealth

# 如果执行失败后，重启后再执行此命令
DISM /Online /Cleanup-Image /RestoreHealth
```

最后重启电脑，以后就不再弹窗啦。一切都安静了。

## .3. 参考

- <https://learn.microsoft.com/en-us/answers/questions/663590/windows-error.html>
- <https://learn.microsoft.com/zh-cn/windows-hardware/manufacture/desktop/repair-a-windows-image?source=recommendations&view=windows-11>












## .4. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
