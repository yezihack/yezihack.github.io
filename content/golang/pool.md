+++
title = "chan实现一个pool"
date = 2019-08-02T14:38:54+08:00
description = "一个简单的池"
draft = false
categories = [
    "golang",
]
image = "pool.jpg"
+++

# chan实现一个pool
```go
type PoolByte chan []byte

func NewPoolByte() PoolByte {
	return make(chan []byte)
}
func (p PoolByte) Put(b []byte) {
	select {
	case p <- b:
	default:
	}
}
func (p PoolByte) Get() []byte {
	var v []byte
	select {
	case v = <-p:
	default:
		v = make([]byte, 3)
	}
	return v
}
```

