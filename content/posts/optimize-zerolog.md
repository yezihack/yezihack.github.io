---
title: "zerolog 占大量内存剖析"
date: 2020-07-01T19:06:01+08:00
lastmod: 2020-07-01T19:06:01+08:00
draft: false
tags: ["golang", "zerolog", "性能分析", "pprof"]
categories: ["golang", "zerolog"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

## 分析过程

### 使用 pprof top分析 

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200701190658.png?imageslim)

可见 json.Marshal占第一内存. 为什么呢? 我们进一步分析

### 使用 `tree ` 分析

![image-20200701190848060](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200701190849.png?imageslim)

查看到 `zerolog AppendInterface` 方法占用 73.32%的内存量. 而 zerolog 是一个很优秀的日志库, 比 `zap` 还优秀. 为什么呢?我们需要查看源码

```
822.70MB 73.32% |   github.com/rs/zerolog/internal/json.Encoder.AppendInterface
```

### 分析源码

> 找到 github.com/rs/zerolog/internal/json.Encoder.AppendInterface` 366 行

```
// AppendInterface marshals the input interface to a string and
// appends the encoded string to the input byte slice.
func (e Encoder) AppendInterface(dst []byte, i interface{}) []byte {
	marshaled, err := json.Marshal(i)
	if err != nil {
		return e.AppendString(dst, fmt.Sprintf("marshaling error: %v", err))
	}
	return append(dst, marshaled...)
}
```

4行 `marshaled, err := json.Marshal(i)` 使用了原生的 json 函数, 这是导致占用内存最大祸首.

为什么这样呢? 

我们再查看`github.com\rs\zerolog/array.go` 213行, 有调用 `AppendInterface` 函数.

```
// Interface append append i marshaled using reflection.
func (a *Array) Interface(i interface{}) *Array {
	if obj, ok := i.(LogObjectMarshaler); ok {
		return a.Object(obj)
	}
	a.buf = enc.AppendInterface(enc.AppendArrayDelim(a.buf), i)
	return a
}
```

分析到这里不难发现. 是因为程序里大量使用 `interface` 函数.

如:  只要使用啦 `Interface` 函数最终是以 `json.Marshal` 落盘.这样是很糟糕的. 

```
zlog.Info().Interface("act", "aa").Send()
```

## 结论

使用zerolog打印日志时,减少使用`interface`打印. 否则会占用大量内存.

我们可以使用选择具体的类型,还可以使用`Dict`

```
log.Info().
    Str("foo", "bar").
    Dict("dict", zerolog.Dict().
        Str("bar", "baz").
        Int("n", 1),
    ).Msg("hello world")
```

官方也提供 一个接口解决打印复杂结构的方案

```
// LogObjectMarshaler provides a strongly-typed and encoding-agnostic interface
// to be implemented by types used with Event/Context's Object methods.
type LogObjectMarshaler interface {
	MarshalZerologObject(e *Event)
}
```

## LogObjectMarshaler 接口使用

> 打印复杂数据的解决方案

````
// 需要打印的结构体
type User struct {
	Name    string
	Age     int
	Created time.Time
}
// 继承 zerolog LogObjectMarshaler 接口
func (u User) MarshalZerologObject(e *zerolog.Event) {
	e.Str("name", u.Name).
		Int("age", u.Age).
		Time("created", u.Created)
}

func ExampleEvent_Object() {
	log := zerolog.New(os.Stdout)

	// User implements zerolog.LogObjectMarshaler
	u := User{"John", 35, time.Time{}}

	log.Log().
		Str("foo", "bar").
		Object("user", u). // 使用Object 搞定, 或使用 EmbedObject(u).
		Msg("hello world")

	// Output: {"foo":"bar","user":{"name":"John","age":35,"created":"0001-01-01T00:00:00Z"},"message":"hello world"}
}
````

参考官方实例: [github.com\rs\zerolog\log_example_test.go](github.com\rs\zerolog\log_example_test.go)