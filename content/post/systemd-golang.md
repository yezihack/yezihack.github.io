---
title: "Systemd 管理 Golang 进程"
date: 2021-03-15T20:13:44+08:00
lastmod: 2021-03-15T20:13:44+08:00
draft: false
tags: ["go", "linux", "systemctl", "脚本"]
categories: ["golang"]
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





## systemd 脚本

```sh 
#!/bin/bash

project_name="mygo"
project_path="/data/backend/"
exec_path="${project_path}${project_name}"

cat > /lib/systemd/system/${project_name}.service << EOF
[Unit]
Description=mygo systemd
Documentation=https://www.sgfoot.com
After=network.target

[Service]
Type=simple
User=root
# 启动命令
ExecStart=${exec_path}
# 重启命令
ExecReload=/bin/kill -SIGINT 

# 环境变量
Environment="SGFOOT_ENV=pro"
Environment="SGFOOT_PATH=/data/conf"

KillMode=process
Restart=on-failure
RestartSec=3s

[Install]
WantedBy=multi-user.targe
EOF
```

## 管理

```sh
systemctl daemon-reload # 更新配置
systemctl start mygo # 启动
systemctl stop mygo # 停止
systemctl restart mygo # 重启
systemctl enable mygo # 加入开机启动
```



## 关于我
我的博客：https://www.sgfoot.com

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://img.sgfoot.com/b/20210122112114.png?imageslim)