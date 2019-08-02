#!/bin/bash
###########################
# 部署到 github pages 脚本
# date: 2019.08.02
###########################
# 错误时终止脚本
set -e
comment=$1
if [ "$comment" == "" ];then
    comment="fix"
fi

# 删除打包文件夹
rm -rf public

#生成静态文件
#hugo --theme=hugo-swift-theme --baseUrl="https://yezihack.github.io"
hugo

#进入public
cd public/

# 初使git并加入版本库
git init
git add -A
git commit -m "$comment"
#推到master分支下
git config user.name "百里"
git config user.email "sgfoot2020gmail.com"
git push -v -f git@github.com:yezihack/yezihack.github.io.git master