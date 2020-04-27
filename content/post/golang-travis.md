---
title: "Golang持续集成服务之Travis教程"
date: 2020-04-24T20:19:39+08:00
lastmod: 2020-04-24T20:19:39+08:00
draft: false
tags: ["golang", "travis", "集成测试"]
categories: ["工具", "Golang", "Go语言"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# lastmod: 2018-03-01T16:01:23+08:00
# author: "xianmin"
# reward: false
# mathjax: false
# description = ""
---
# 为什么使用集成服务呢
我们向github提交代码时, 我们得保证我们的代码是能运行的, 我们会写测试用例, 保证我们的代码功能能正常使用.常见大神们的开源项目都一个绿色图标"build|passing 表示构建OK

# 如何使用Travis服务呢
打开这个网站 https://travis-ci.org/ 点击登陆, 使用github登陆.目前似也只支持github

## 1. 添加仓库

![image-20200424202808582](http://img.sgfoot.com/b/20200424202810.png?imageslim)

## 2. 开启集成

![image-20200424202943071](http://img.sgfoot.com/b/20200424202945.png?imageslim)

## 3. 项目根目录添加.travis.yml文件

```
cd ~/github_webhook
touch .travis.yml 
```

## 4. 编写.travis.yml文件

- `language: go` 表示当前仓库是go语言
- `go - 1.14` 表示使用golang版本
- `sudo:required` 表示需要root权限
- `os` 表示使用运行环境, linux, osx是苹果系统
- `install` 安装需要集成的必要软件
- `script` 代表运行的脚本

**以下是个测试空命令文件, 可以拿测试.看看能不能运行** 

```
language: go
go:
  - 1.14

sudo: required

os:
  - linux
  - osx

install:
  - echo "install"

script:
  - echo "script"
```

**以下是一个正式的集成测试文件**

```
language: go
go:
  - 1.14

sudo: required

os:
  - linux
  - osx

install:
  - echo "install"
  - go get -u github.com/go-bindata/go-bindata/...

script:
  - echo "script"
  - make dev
```

- 将.travis.yml提交到github代码仓库里.
- 以后每次push都会有结果的.如果通过集成,则图标是绿色的.



## 3. 查看集成的结果

点击你刚才开启的仓库名称, 进入监听页面.

![image-20200424203303828](http://img.sgfoot.com/b/20200424203305.png?imageslim)

以下是linux环境下的运行结果,很详细的步骤,哪里出错,你就对应的修改.如果测试不通过. 不会显示**小绿图标**的

![image-20200424203940184](http://img.sgfoot.com/b/20200424203943.png?imageslim)



## 4. 将绿色小图标放在你的项目里.

![image-20200424204250683](http://img.sgfoot.com/b/20200424204252.png?imageslim)

将小图标Copy到你的项目README.md文件里.

# 参考

- http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html

