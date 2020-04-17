#!/bin/bash

now=$(date "+%Y-%m-%d %H:%M:%S")

case $1 in
	gen)
	hugo
	;;
  save)
 	  git checkout www && git add . && git commit -m "save blog,at:${now}" && git push origin www
  ;;
	push)
	# push yezihack.github.io
	cd public && #git init && git remote add origin git@github.com:yezihack/yezihack.github.io.git &&
	git add . && git commit -m "update blog,at:${now}" && git push origin master -f # && rm -rf .git/
	if [ $? = 0 ];then
		cd ../
		echo "update ok"
	fi
	;;
	*)
	echo "Please input command: gen or push. at:${now}"
	;;
esac
