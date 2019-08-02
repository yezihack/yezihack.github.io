+++
title = "hugo搭建github pages博客"
date = 2019-08-02T18:39:54+08:00
description = ""
draft = false
categories = [
    "golang",
]
tags = [
    "hugo",
    "github",
]
image = "default.jpg"
+++

# 文档参考
- [hugo官方](https://gohugo.io/ )
- [hugo官网主题](https://themes.gohugo.io/)

# 第一步: 创建一个github pages
- [https://github.com/new](https://github.com/new)

### 注意
创建 Repository name 仓库名称时,最好与你的用户名相同,如用户名为:yezihack,站点名为:yezihack.github.io


# 第二步: 安装hugo 
> 基于mac安装
```go
brew install hugo
```

# 第三步: New一个站点
```shell
hugo new site yezihack.github.com
 
# 以下二个命令必须执行哦
cd yezihack.github.com 
git init
```

# 第四步: 下载一个主题
> hugo-swift-theme 主题不错
```
git submodule add https://github.com/onweru/hugo-swift-theme.git themes/hugo-swift-theme
```

## 复制一下官网给的DEMO
> -a 表示复制所有,最后一个点(.) 表示复制当前目录,文件目录最后必须有/

```
cp -a themes/hugo-swift-theme/exampleSite/ .
```

# 第五步: 将代码添加到github版本库
> 获取第一步创建的仓库地址: 如: git@github.com:yezihack/yezihack.github.io.git

```
git remote add origin git@github.com:yezihack/yezihack.github.io.git
```

## checkout一个分支并提交代码
>  master用于存储hugo 生成的静态文件, 新建一个dev分支
```
git checkout -b dev

```

### 新建一个.gitignore

```
touch .gitigonre
echo "public/" >> .gitignore
echo ".idea/" >> .gitignore
```

### 将代码添加到版本库里并提交远端
```
git add -A
git commit -m "add hugo"
git push -u origin dev
```

# 第六步: 生成静态网站

## 编辑 config.toml 配置文件 
```
vim config.toml
# 找到baseurl字段,修改为你的站点名,如: https://yezihack.github.io/ 最后一定要加 /
baseurl = "https://yezihack.github.io/"
```

## 新建一个发布脚本

```
touch sync.sh
vim sync.sh 
#将下面的sync.sh复制到sync.sh里
chmod +x sync.sh
```

### 脚步sync.sh

注意
- 修改baseurl
- 修改github

```
#!/bin/bash
###########################
# 部署到 github pages 脚本
# 使用方法: ./sync.sh
# date: 2019.08.02
###########################


baseurl="https://yezihack.github.io"
github="git@github.com:yezihack/yezihack.github.io.git"

# 错误时终止脚本
set -e
comment=$1
if [ "$comment" == "" ];then
    comment="issue pages"
fi

# 删除打包文件夹
rm -rf public

#生成静态文件
hugo --theme=hugo-swift-theme

#进入public
cd public/

# 初使git并加入版本库
git init
git add -A
git commit -m "$comment"
#推到master分支下
git push -v -f "$github" master
```

## 执行脚步
```
./sync.sh
```
