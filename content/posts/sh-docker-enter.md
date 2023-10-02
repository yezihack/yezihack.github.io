---
title: "Docker Enter 进入容器脚本"
date: 2020-11-06T11:26:24+08:00
lastmod: 2020-11-06T11:26:24+08:00
draft: false
tags: ["shell", "脚本"]
categories: ["脚本"]
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

> 快捷进入容器内部命令.只需要填写容器ID即可. `enter containerID`

## 脚本

创建 `/usr/bin/enter`文件

```sh
touch /usr/bin/enter && chmod +x /usr/bin/enter
```

`enter` 文件内容

```sh
#!/bin/sh

if [ -e $(dirname "$0")/nsenter ]; then
    # with boot2docker, nsenter is not in the PATH but it is in the same folder
    NSENTER=$(dirname "$0")/nsenter
else
    NSENTER=nsenter
fi

if [ -z "$1" ]; then
    echo "Usage: `basename "$0"` CONTAINER [COMMAND [ARG]...]"
    echo ""
    echo "Enters the Docker CONTAINER and executes the specified COMMAND."
    echo "If COMMAND is not specified, runs an interactive shell in CONTAINER."
else
    PID=$(docker inspect --format "{{.State.Pid}}" "$1")
    if [ -z "$PID" ]; then
        exit 1
    fi
    shift
    
    OPTS="--target $PID --mount --uts --ipc --net --pid --"
    
    if [ -z "$1" ]; then
        # No command given.
        # Use su to clear all host environment variables except for TERM,
        # initialize the environment variables HOME, SHELL, USER, LOGNAME, PATH,
        # and start a login shell.
        "$NSENTER" $OPTS /bin/su - root
    else
        # Use env to clear all host environment variables.
        "$NSENTER" $OPTS env --ignore-environment -- "$@"
    fi
fi
```

## 使用

```sh
enter containerID
```

