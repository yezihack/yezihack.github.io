---
title: "io.ReadAll优化"
date: 2020-06-30T11:05:28+08:00
lastmod: 2020-06-30T11:05:28+08:00
draft: false
tags: ["golang", "", ""]
categories: [""]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## 解析方案

```
// 替换 ioutil.ReadAll
func ReadAll(data io.ReadCloser) (body []byte) {
	buffer := bytes.NewBuffer(make([]byte, 0, 65536))
	io.Copy(buffer, data)
	temp := buffer.Bytes()
	length := len(temp)
	if cap(temp) > (length + length/10) {
		body = make([]byte, length)
		copy(body, temp)
	} else {
		body = temp
	}
	return
}
```





# 参考

[[golang]内存不断增长bytes.makeSlice](https://studygolang.com/articles/2763)

[Golang Slices And The Case Of The Missing Memory](https://www.openmymind.net/Go-Slices-And-The-Case-Of-The-Missing-Memory/)