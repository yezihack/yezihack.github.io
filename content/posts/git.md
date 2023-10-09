---
title: "Git 简明命令"
date: 2020-11-20T17:10:43+08:00
lastmod: 2020-11-20T17:10:43+08:00
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

## 基本概念

![img](http://www.ruanyifeng.com/blogimg/asset/2015/bg2015120901.png)

- Workspace：工作区
- Index / Stage：暂存区
- Repository：仓库区（或本地仓库）
- Remote：远程仓库



## 初使化

### 新建仓库

```sh
git init 
```

### 配置

```sh
# 显示全部配置
git config --list 

# 编辑配置
git config -e [--global]

# 设置用户和邮箱
git config [--global] user.name "百里"
git config [--global] user.email "freeit@126.com"
```

## 拉取

### 克隆仓库

`git clone git@github.com:yezihack/barry.git `

### 克隆指定分支

1. `-b` 指定分支名

`git clone -b master git@github.com:yezihack/barry.git`

## 分支 

### 查看本地分支

`git branch`

### 查看所有远程分支 

`git branch -r`

### 查看所有分支 

`git branch -a`

### 创建并切换分支

`git checkout -b dev`

### 新建一个分支 

`git branch dev`

### 切换分支

```sh
git checkout dev
```

### 合并分支 

```sh
# 当前分支master, 要将dev分支合并到master分支
git checkout master
git merge dev
```

### 删除分支 

`git branch -d dev`

### 删除远程分支

`git push origin --delete dev`

### 删除远程分支2

```sh
//删除 dev_test 分支
git push origin :refs/heads/dev_test
```

### 删除远程 tag

```sh
//删除 dev_test 标签
git push origin :refs/tags/dev_test
```

## 推送

### 添加文件

`git add .`

### 提交暂存区

`git commit -m "fix"`

### 提交远程仓库

`git push origin dev`

## 回滚

###  丢弃工作区改动

`git checkout -- [file]`

### 丢弃暂存区改动

`git reset HEAD`

`git reset [file]`

### 恢复指定CommitID

`git reset --hard [commit]`

### 暂存未提交文件

`git stash`

### 恢复暂存文件

`git stash pop`

## 参考

1. [常用 Git 命令清单](https://www.ruanyifeng.com/blog/2015/12/git-cheat-sheet.html)

