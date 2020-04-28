---
title: "Goz学习笔记"
date: 2020-04-28T20:33:51+08:00
lastmod: 2020-04-28T20:33:51+08:00
draft: false
tags: ["golang", "goz", "curl", "学习总结"]
categories: ["学习笔记"]
author: "百里"
comment: true
toc: true
reward: true
# weight: 1
# description = ""
---
![](http://img.sgfoot.com/b/20200428203103.png?imageslim)

# 分析
项目四个Go文件, 每个文件仅描述一件事, 思路非常清淅, 故此学习并总结一下里面的精华.

## 入口文件 Goz.go
- 只初使化了Request结构体. 
- 可以定义初使配置Options, 整个项目所需的配置都在Options结构里
- [options.go#L6](https://github.com/idoubi/goz/blob/master/options.go#L6)
```go
// NewClient new request object
func NewClient(opts ...Options) *Request {
	req := &Request{}

	if len(opts) > 0 {
		req.opts = opts[0]
	}

	return req
}
```
## 配置文件 Options.go
- 定义了整个项目需要的外部参数
- [options.go#L6](https://github.com/idoubi/goz/blob/master/options.go#L6)
```go
// Options object
type Options struct {
	BaseURI    string
	Timeout    float32
	timeout    time.Duration
	Query      interface{}
	Headers    map[string]interface{}
	Cookies    interface{}
	FormParams map[string]interface{}
	JSON       interface{}
	Proxy      string
}
```

## 核心处理文件 Request.go
- 定义了自己所需的Request结构体
- 如果需要上下方法共用一份结果, 必须是指针变量, 这样扩展的方法都可以使用并修改参数变量.
- 里面的参数是整个文件所需的参数,仅限自己使用, 因为字段名都是小写.
- [request.go#L16](https://github.com/idoubi/goz/blob/master/request.go#L16)
```go
// Request object
type Request struct {
	opts Options
	cli  *http.Client
	req  *http.Request
	body io.Reader
}
```

### 1. 定义Request所要操作方法
- 外部使用的方法(首字母大写)
    - 主要是提供给调用方使用.如[Request方法](https://github.com/idoubi/goz/blob/master/request.go#L54)
- 内部使用的方法(首字母小写).如[parseClient方法](https://github.com/idoubi/goz/blob/master/request.go#L119)
    - 主要是内部处理逻辑使用, 不暴露给外部使用.
    - 一般细节逻辑交给内部方法完成.
    - 而且每一个方法只处理一件单纯的逻辑,否则拆成两个方法处理.


### 2. 提供给外部调用的方法返回Response结构体.转向结果处理逻辑
- 如下代码Get返回了Response结构体,必须是指针类型, 这样response方法拿到的数据是同一份.
- 而且也要将Request处理的error也装入response结构体里,方便结果分析处理.
```go
// Get send get request
func (r *Request) Get(uri string, opts ...Options) (*Response, error) {
	return r.Request("GET", uri, opts...)
}
```

## 结果处理 Response.go
> 这个文件属于结尾文件, 整个文件在此处理收尾逻辑 

- 定义了自己所需的`Response`结构体
- 定义结果处理的方法, 将Request传过来的数据进行处理. 也就是Response结构体里的参数.
- [response.go#L11](https://github.com/idoubi/goz/blob/master/response.go#L11)
```go
type Response struct {
	resp *http.Response
	req  *http.Request
	err  error
}
```

### 1. 更人性化的方法
> 一般返回给调用方的结果是字节流或string或切片或map

- 这里返回的是字节流, 我们定义自己的字节流类型.
- [response.go#L18](https://github.com/idoubi/goz/blob/master/response.go#L18)
```go
type ResponseBody []byte
```
- 然后对类型进行扩展方法
- [response.go#L21](https://github.com/idoubi/goz/blob/master/response.go#L21)
```go
// String fmt outout
func (r ResponseBody) String() string {
	return string(r)
}
```

### 2. 利用自定义的类型
- 如果正常返回`[]byte`字节流给用户,也许用户还需要进行一步处理.这样有点不方便,我们帮他做了
- Response的方法返回自定义的类型, 这样我们就可以使用上面定义的类型方法啦. 是不是好方便.
- [response.go#L44](https://github.com/idoubi/goz/blob/master/response.go#L44)
```go
// GetBody parse response body
func (r *Response) GetBody() (ResponseBody, error) {
	defer r.resp.Body.Close()

	body, err := ioutil.ReadAll(r.resp.Body)
	if err != nil {
		return nil, err
	}

	return ResponseBody(body), nil
}
```

## 总结
- 好的开源项目代码逻辑思路特别清淅
- 目录或文件处理逻辑分工清淅,也就是所谓单一原则,一个类只描述一件事.
- 层次清淅, 层层递进. 像套娃一般.哈哈.