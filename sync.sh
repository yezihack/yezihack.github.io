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
