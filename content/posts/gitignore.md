---
title: "Git Ignore 常用文件"
date: 2022-01-14T10:05:18+08:00
lastmod: 2022-01-14T10:05:18+08:00
draft: false
tags: ["git", "技巧"]
categories: ["git"]
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

在开发中，代码管理常用 git，做为优秀的分布式代码管理工具，有着优秀的设计，
其中一项就是 `.gitignore` 的功能。主要用于忽略某此文件或敏感文件，以防
泄漏。

## 常用的 gitignore

```sh
tmp
.env
gohub
.DS_Store
.history

# Golang #
######################
# `go test -c` 生成的二进制文件
*.test
# go coverage 工具
*.out
*.prof
*.cgo1.go
*.cgo2.c
_cgo_defun.c
_cgo_gotypes.go
_cgo_export.*

# 编译文件 #
###################
*.com
*.class
*.dll
*.exe
*.o
*.so

# 压缩包 #
############
# Git 自带压缩,如果这些压缩包里有代码,建议解压后 commit
*.7z
*.dmg
*.gz
*.iso
*.jar
*.rar
*.tar
*.zip

# 日志文件和数据库 #
######################
*.log
*.sqlite
*.db

# 临时文件 #
######################
tmp/
.tmp/

# 系统生成文件 #
######################
.DS_Store
.DS_Store?
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
.TemporaryItems
.fseventsd
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

# IDE 和编辑器 #
######################
.idea/
/go_build_*
out/
.vscode/
.vscode/settings.json
*.sublime*
__debug_bin
.project

# 前端工具链 #
######################
.sass-cache/*
node_modules/
```

## 删除已经加入版本库文件

```sh
git rm --cached <文件名或目录>
```

## 参考

- <https://learnku.com/courses/go-api/1.17/gitignore-file/11774>

## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
