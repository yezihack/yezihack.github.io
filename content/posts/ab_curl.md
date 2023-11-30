---
title: "Ab和curl使用"
date: 2020-07-30T15:06:52+08:00
lastmod: 2020-07-30T15:06:52+08:00
draft: false
tags: ["ab", "curl", "工具"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## curl post json

> 如果多个头信息, 多次使用-H即可. 

```bash
curl -H "Content-Type: application/json" -X POST --data '{"username:":"abc", "password":"abc"}' http://www.github.com/login
```

1. `-H` 请求头信息
2. `-X` 请求方式, GET, POST
3. `--data` 数据

## ab post json

```bash
ab -r -k -c 50 -n 100 -T 'application/json' -p json.txt http://www.github.com/login
```

json.txt

```json
{
	"username":"abc",
	"password":"1234"
}
```

1. `-T`就`Content-Type`
2. `-H` 自定义头信息 `Token:111`
3. `-c` 请求并发数
4. `-n` 请求数.
5. `-r` 不要退出套接字接收错误
6. `-k` 保持 KeepAlive

