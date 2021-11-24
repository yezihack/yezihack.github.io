---
title: "GitHub 徽章制作"
date: 2021-01-22T14:23:07+08:00
lastmod: 2021-01-22T16:23:07+08:00
draft: false
tags: ["徽章", "工具"]
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

> 很早前写过一篇关于[Golang持续集成服务之Travis教程](https://www.sgfoot.com/golang-travis.html), 今天再写写关于 github 上常见的徽章是如何制作的. 让你的开源项目更高大上, 让你的代码也更健壮. 



## 徽章的含意

> 当你浏览一个开源项目时,看到各种徽章, 有些徽章是直接反应这个开源库的质量和完整性等等.

![image-20210122143122198](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122143123.png?imageslim)

如上图所示

1. 第一个徽章即 Github 自带的 [workflow](https://docs.github.com/en/packages/guides/using-github-packages-with-github-actions) 提供的持续集成(CI)和持续部署(CD), 官方称之为 Actions, 图示显示为 CI, CD 是否通过
2. 第二个徽章即 [Codecov](https://codecov.io/) 是一个测试结果分析工具, 图标显示测试覆盖率.
3. 第三个徽章即 [shields.io](https://shields.io/) 一个可以自定义徽章的网站
4. 第四个徽章即 [goreportcard](https://goreportcard.com/) 是一个项目综合评分网站
5. 第五个徽章即 [gitter](https://gitter.im/) 自定义讨论组的网站

## CI&CD 徽章

> github 于2018. 10月推荐 GitHub Actions 持续集成服务, 在此之前大家都是使用 https://travis-ci.org/ 持续集成服务, 之前我也写过相关文章. [Golang持续集成服务之Travis教程](https://www.sgfoot.com/golang-travis.html).

持续集成和持续部署目前 github 官方自带支持, 官方称之为 GitHub Actions. 

只要你在 github 上创建一个开源项目仓库就自带 Actions 功能, 支持各种语言. 还可以自动发布 GitHub Pages 等功能, 十分强大. 

如何使用可以参考阮一峰写的[GitHub Actions 入门教程](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)

**关于GO的持续集成服务模板参考:**

> 使用 GitHub Actions 后会在你的项目里自带生成一个`.github`文件夹, 即`.github/workflows/go.yml`

```yml
name: Go # 使用语言

on:     # 监听动作
  push: # 监听 push 动作
    branches: [ main ] # 监听哪个分支 branch
  pull_request:
    branches: [ main ]

jobs: # 工作 job
  build: # 构建动作
    runs-on: ubuntu-latest # 基于 ubuntu 系统
    steps: 
    - uses: actions/checkout@v2

    - name: Set up Go 
      uses: actions/setup-go@v2
      with:
        go-version: 1.15

    - name: Build # 构建项目
      run: go build -v ./...

    - name: Test # 运行用例
      run: go test -v .
```

**徽章的制作.** 

[![workflows](https://github.com/yezihack/e/workflows/Go/badge.svg)](https://github.com/yezihack/e/actions?query=workflow%3AGo)


```
https://github.com/yezihack/e/workflows/Go/badge.svg
```

1. `https://github.com/yezihack/e` 是项目的地址
2. `workflows/Go/badge.svg` 中间的`Go` 是 https://github.com/yezihack/e/actions?query=workflow%3AGo 下的名称. 需要注意区分大小写

## 测试覆盖率 徽章

登陆官网 https://codecov.io/ 使用 GitHub 帐号登陆, 授权导出你的项目. 

在项目的根目录新建`.travis.yml` 文件

实例文件参考

```yml
language: go # 使用语言.
go: 
  - 1.15.6  # 版本号, 支持多种版本号

sudo: required #  #有定制化开发环境需要，默认false，不开启容器，编译效率高 

os:			# 使用的操作系统 
  - linux
  - osx

notifications:  # 邮箱通知
  email: freeit@126.com

go_import_path: # 使用Go需要导入的包. 
  - github.com/gin-gonic/gin
  - github.com/pkg/errors
  - github.com/smartystreets/goconvey

before_install: # 主要安装一些系统依赖,
  - go mod tidy

install: true # 安装, true跳过

script: # 脚本执行.
  - echo "run"
  - go test -race -coverprofile=coverage.txt -covermode=atomic
  - go test -v ./...

after_success: # 上传测试报告
  - bash <(curl -s https://codecov.io/bash)
```

**徽章制作**

[![codecov](https://codecov.io/gh/yezihack/e/branch/main/graph/badge.svg?token=QZSV2DZM60)](https://codecov.io/gh/yezihack/e)


点击Settings -> Badge 

![image-20210122160148601](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122160150.png?imageslim)

## 文档徽章

> https://pkg.go.dev/ 只针对Golang语言自动生成文档

打开网站直接输入你项目的访问地址, 自带生成.

如 https://github.com/yezihack/e

文档地址即: https://pkg.go.dev/github.com/yezihack/e

**徽章制作**

```sh
https://img.shields.io/badge/go.dev-reference-brightgreen?logo=go&logoColor=white&style=flat
```

```
[![Go doc](https://img.shields.io/badge/go.dev-reference-brightgreen?logo=go&logoColor=white&style=flat)](https://pkg.go.dev/github.com/yezihack/e)
```

[![Go doc](https://img.shields.io/badge/go.dev-reference-brightgreen?logo=go&logoColor=white&style=flat)](https://pkg.go.dev/github.com/yezihack/e)

## 综合报告徽章

打开 https://goreportcard.com/  直接填写你的项目访问地址即可. 

![image-20210122161750380](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122161752.png?imageslim)



**徽章制作**

```
https://goreportcard.com/badge/github.com/yezihack/e
```

[![Go Report Card](https://goreportcard.com/badge/github.com/yezihack/e)](https://goreportcard.com/report/github.com/yezihack/e)

## 讨论组徽章

打开 https://gitter.im/ 注册, 创建一个小组, 可以邀请开发者一起讨论. 

创建小组时最好以你的用户名+仓库名 命名. 这样方便识别.

**徽章制作**

获取你的讨论组的地址, 然后在 https://shields.io/category/chat 选择 Gitter即可. 填写你的用户名和仓库名信息

```
![Gitter](https://img.shields.io/gitter/room/yezihack/e)
```

[![Gitter](https://img.shields.io/gitter/room/yezihack/e)](https://gitter.im/yezihack-e/community)

## 其它徽章

打开 https://shields.io 可以自定义很多个性的图标, 让你的项目更专业. 

![image-20210122162326038](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122162326.png?imageslim)

![big-white](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20210122112114.png?imageslim)