---
title: "golang http句柄泄露"
date: 2020-06-11T14:36:27+08:00
lastmod: 2020-06-13T08:22:27+08:00
draft: false
tags: ["golang", "curl", ""]
categories: ["golang", "Golang常见问题"]
author: "百里"
comment: false
toc: true
reward: true
---

## 前言
平时我们做Web开发, 经常会遇到需要请求网络资源,使用http请求, 如下面代码,注释处如果没有打开话,会导致句柄泄露, 最终报: `dial tcp 127.0.0.1:80: socket: too many open files`
这是为什么呢? 在linux中万物皆文件, 网络请求也相当于打开一个文件.如果打开文件忘记关闭的话, 没有及时回收资源, linux有文件打开上限,可以使用`ulimit -n` 查看最大支持文件打开数.

1. 如下代码会导致句柄泄露 
```
cli := &http.Client{}
req, err := http.NewRequest(http.MethodGet, "http://www.google.com", nil)
if err != nil {
	return
}
resp, err := cli.Do(req)
if err != nil {
	return
}
// 必须关闭, 如果我们没有写关闭resp.Body打开的句柄,就会导致句柄泄露
// defer resp.Body.Close() // 
data, err := ioutil.ReadAll(resp.Body)
if err != nil {
	return
}
fmt.Println(string(data))
return
```
## 分析 
可以使用并发工具请求你的代码, 如使用[Jmeter](https://www.sgfoot.com/jmeter/), 然后使用`lsof -p 18001 |wc -l` , `18001`就你程序的进程ID, 可以查看当前程序打开文件数.

**所有一定不要忘记关闭句柄**: `defer resp.Body.Close()`

注: **lsof(list open files)是一个列出当前系统打开文件的工具。**


## CURL函数
> 写代码经常使用网络请求, 不如将其封装起来, 这样使用起来更香.哈哈.
> <br/> 如 GET,POST-JSON, POST-FORM

### Get 
```
// curl 发起 get请求
func CurlGet(uri string, timeout time.Duration) (result []byte, err error) {
	// 创建一个 http 客户端
	cli := &http.Client{}
	// 写入 uri 请求信息
	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		err = errors.WithStack(err)
		return
	}
	// 设置超时
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	req = req.WithContext(ctx)
	// 发起请求
	resp, err := cli.Do(req)
	if err != nil {
		err = errors.WithStack(err)
		return
	}
	// 关闭连接
	defer resp.Body.Close()
	// 读取 body
	result, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		err = errors.WithStack(err)
		return
	}
	return
}
```

### Form post
```

// curl 支持POST form表单形式
func CurlFormPOST(uri, token string, params map[string]interface{}, timeout time.Duration) (result []byte, err error) {
	// 创建一个 http 客户端
	cli := &http.Client{}
	values := url.Values{}
	for k, v := range params {
		if v != nil {
			values.Set(k, cast.ToString(v))
		}
	}
	// 写入 post 请求数据
	req, err := http.NewRequest(http.MethodPost, uri, strings.NewReader(values.Encode()))
	if err != nil {
		return
	}
	// 设置超时
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	req = req.WithContext(ctx)
	// 设置 header
	req.Header.Set("ACCESS-TOKEN", token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := cli.Do(req)
	if err != nil {
		return
	}
	// 必须关闭
	defer resp.Body.Close()
	result, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	return
}
```
###  Json post
```

// curl 支持POST json
func CurlJsonPOST(uri, token string, params map[string]interface{}, timeout time.Duration) (result []byte, err error) {
	// 创建一个 http 客户端
	cli := &http.Client{}
	// 数据打包
	data, err := json.Marshal(params)
	if err != nil {
		return
	}
	// 写入 post 请求数据
	req, err := http.NewRequest(http.MethodPost, uri, bytes.NewBuffer(data))
	if err != nil {
		return
	}
	// 设置超时
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	req = req.WithContext(ctx)
	// 设置 header
	req.Header.Set("ACCESS-TOKEN", token)
	req.Header.Set("Content-Type", "application/json")
	// 发起 http 请求
	resp, err := cli.Do(req)
	if err != nil {
		return
	}
	// 必须关闭
	defer resp.Body.Close()
	result, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		return
	}
	return
}
```


## 参考
1. https://golang.org/src/net/http/request.go
