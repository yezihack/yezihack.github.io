#!/bin/bash
cate=$1 # 选择类型, 如new, rm, issue
name=$2 # [可选]
year=`date +%Y` #年
month=`date +%m` #月
today=`date +%Y-%m-%d` #年月日
github="git@github.com:yezihack/yezihack.github.io.git" #github的地址

#获取当前目录
dir=$(cd "$(dirname "$0")"; pwd)

if [ -z "$cate" ];then
    echo "请输入类型!,如: new, rm, issue"
    exit 0
fi
# 创建文章页面
function new_pages() {
    page_name=$1
    if [ -z "$page_name" ];then
        echo "请输入页面名称?"
        exit 0
    fi
    pages=${year}/${month}/${page_name}.md
    file=${dir}/content/$pages
    if [ -f $file ];then
        echo "$file 文件已存在,请选择其它名称!"
        exit 0
    fi
    hugo new $pages
    echo "创建成功"
}
# 创建三省
function new_bat() {
    bat=${dir}/content/bluebat
    if [ ! -d $bat ];then
        mkdir -p $bat
    fi
    count=$((`cd ${bat};ls |wc -l`))
    count=$(($count+1))
    pages=bluebat/$(($count)).md
    file=${bat}/$(($count)).md
    if [ -f $file ];then
        echo "$file 文件已存在,请选择其它名称!"
        exit 0
    fi
    hugo new $pages
    echo "创建成功"
    sed -i "" "s/default.jpg/bluebat\/$count.jpg/g" $file
}
# 删除页面
function rm_page() {
    page_name=$1
    if [ -z "$page_name" ];then
        echo "请输入页面名称?"
        exit 0
    fi
    pages=${year}/${month}/${page_name}.md
    file=${dir}/content/$pages
    if [ ! -f $file ];then
        echo "$file 文件不存在!"
        exit 0
    fi
    rm $file
    echo "删除成功 $file"
}
# 发布github pages
function issue() {
    comment=$1
    if [ "$comment" == "" ];then
        comment="fix"
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
    git push -v -f $github master
    echo "发布成功, $today"
}

# 选择
case $cate in
"dev")
    hugo serve
    ;;
"new")
    new_pages $name
    ;;
"bat")
    new_bat
    ;;
"rm")
    rm_page $name
    ;;
"issue")
    issue $name
    ;;
"help"|"h"|"?"|*)
    echo "请输入以下命令"
    echo "start new bat 蝙蝠三省"
    echo "start new [页面名称,无须后缀名] ------创建文章页面"
    echo "start rm [页面名称,无须后缀名] ------删除文章页面"
    echo "start issue [可选,git提交备注] ------发布站点"
esac
