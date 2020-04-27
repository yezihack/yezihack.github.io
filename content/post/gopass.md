---
title: "Go命令行下星号代替输入内容"
date: 2020-04-17T19:34:16+08:00
lastmod: 2020-04-17T19:34:16+08:00
draft: false
tags: ["golang", "每日一库", "Go优秀库", "密码", "gopass"]
categories: ["每日一库"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# lastmod: 2018-03-01T16:01:23+08:00
# author: "xianmin"
# reward: false
# mathjax: false
# description = ""

---

![(图片来自网络,有侵权,联系我删除)](http://img.sgfoot.com/b/20200417194055.png?imageslim)

(图片来自网络,有侵权,联系我删除)

> 当我们做命令行工具时, 遇到用户需要输入密码时, 常规处理是当字符串显示输入,这样并不是很好.应该像mysqld工具一样,输入密码时,以星号代替.对敏感数据进行脱敏处理.

今天要介绍一个golang这方面的包`github.com/howeyc/gopass`

# 代码实例使用

## 1. 当输入密码时,不显示任何信息
```go
func GetPasswd() {
	fmt.Printf("1.请输入密码:")
	pass, err := gopass.GetPasswd()
	if err != nil {
		log.Fatalln(err)
		return
	}
	fmt.Println("您输入的密码是:", string(pass))
}
```

### 2. 当输入密码时,以星号*代替你输入的字符
```go
func GetPasswdMasked() {
	fmt.Printf("2.请输入密码:")
	pass, err := gopass.GetPasswdMasked()
	if err != nil {
		log.Fatalln(err)
		return
	}
	fmt.Println("您输入的密码是:", string(pass))
}
```
## 3.你输入密码时,以星号*代替你输入的字符

```
func GetPasswdPrompt() {
	pass, err := gopass.GetPasswdPrompt("3.请输入密码:", true, os.Stdin, os.Stdout)
	if err != nil {
		log.Fatalln(err)
		return
	}
	fmt.Println("您输入的密码是:", string(pass))
}
```

# 效果

```
1.请输入密码:
您输入的密码是: www.sgfoot.com
2.请输入密码:**********
您输入的密码是: sgfoot.com
3.请输入密码:******
您输入的密码是: sgfoot
```

