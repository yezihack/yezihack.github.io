---
title: "Golang err is shadowed during return"
date: 2020-12-24T16:11:38+08:00
lastmod: 2020-12-24T16:11:38+08:00
draft: false
tags: ["bug", "golang", "go"]
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

![image-20201224162811056](https://cdn.jsdelivr.net/gh/yezihack/assets@master/b/20201224162820.png?imageslim)

## 复现

```go
package main

import "errors"

func main() {
	TestErr("go", "golang")
}

func TestErr(t, p string) (s string, err error) {
	switch t {
	case "go":
		err := check(p)
		if err != nil {
			// 返回参数里的 err 作用域是整个函数,即外层作用域
			// check 返回的 err 作用域是 switch 范围.即内层作用域.
			// return 操作,不指明是将内层作用域 返回给外层作用域, 这样在 go 里是不允许的.
			return
		}
	}
	return
}
func check(s string) error {
	if s == "hello" {
		return nil
	}
	return errors.New("s is not hello")
}
```

以上代码运行后会报`err is shadowed during return` 错误. 主要原因就是**不同的作用域不能直接返回**.而需要在return 后面跟上返回的参数才行



将上面的`TestErr` 改为以下形式即可

```go
func TestErr(t, p string) (s string, err error) {
	switch t {
	case "go":
		err := check(p)
		if err != nil {
            // 在 return 后面后跟指定参数返回. 就不会报错啦.
			return "", err
		}
	}
	return
}
```



## 结论

1. golang 函数里, 同一级别的作用域可以直接通过 return 返回
2. golang 函数里, 不同级另的作用域只能在 return 后指定参数返回