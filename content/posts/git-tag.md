---
title: "Git Tag 常用命令"
date: 2020-10-30T16:43:01+08:00
lastmod: 2020-10-30T16:43:01+08:00
draft: false
tags: ["git"]
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

> git tag 是给当前仓库设置一个快照,常用于设置版本号, 你有必须知道一下.

## 查看

```sh
git tag # 查看当前项目的tag 
git show v1.0.0 # 查看某 tag 的详情
```



## 创建

```sh
git tag v1.0.0 # 给当前项目版本打上 v1.0.0 版本号

# 给指定的提交版本号打上 tag
git log --pretty=oneline --abbrev-commit # 查看所有短ID
312bda6 (HEAD -> master)
# 给日志 312bda6 打上 tag
git tag v1.0.3 312bda6

# 给标签写上注释 
git tag -a v1.2.0 -m "tag notes"
```



## 提交

```sh
git push origin v1.0.0 # 将 v1.0.0 推送到远程
git push --tags # 推送本地的所有的 Tag
```



## 删除

```sh
git tag -d v1.0.0 # 删除本地 tag 
git push origin :v1.0.0
```



## 拉取

```sh
git fetch origin tag v1.0.0
```

