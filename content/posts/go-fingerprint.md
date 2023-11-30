---
title: "Go 字符串指纹"
date: 2020-08-05T15:34:32+08:00
lastmod: 2020-08-05T15:34:32+08:00
draft: false
tags: ["golang", "指纹"]
categories: ["golang"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---

写项目时,有时我们需要缓存, 缓存就会需要唯一的`key`. 常规是对字符串求`md5`指纹. 
在golang里我们也可以使用, 目前可以计算一个字符串的`crc32`, `md5`, `sha1`的指纹.

**md5 :**
一种被广泛使用的密码散列函数，可以产bai生出一个128位（du16字节）的散列值（hash value），用于确保信息传输完整一zhi致。MD5由美国密码学家罗纳德·李维斯特（Ronald Linn Rivest）设计，于1992年公开，用以取代MD4算法。

**sha1:** 
SHA1是由NISTNSA设计为同DSA一起使用的，它对长度小于264的输入，产生长度为160bit的散列值，因此抗穷举(brute-force)性更好。SHA-1基于MD5，MD5又基于MD4。

**crc32:**
本身是“冗余校验码”的意思，CRC32则表示会产生一个32bit（8位十六进制数）的校验值。由于CRC32产生校验值时源数据块的每一个bit（位）都参与了计算，所以数据块中即使只有一位发生了变化，也会得到不同的CRC32值。



## golang 实现

### md5 

```go
// md5值
func Md5Str(s string) string {
	hash := md5.Sum([]byte(s))
	return hex.EncodeToString(hash[:])
}
```

### sha1

```go
// 散列值
func Sha1Str(s string) string {
	r := sha1.Sum([]byte(s))
	return hex.EncodeToString(r[:])
}
```

### crc32

```
// String hashes a string to a unique hashcode.
// https://github.com/hashicorp/terraform/blob/master/helper/hashcode/hashcode.go
// crc32 returns a uint32, but for our use we need
// and non negative integer. Here we cast to an integer
// and invert it if the result is negative.
func HashCode(s string) int {
	v := int(crc32.ChecksumIEEE([]byte(s)))
	if v >= 0 {
		return v
	}
	if -v >= 0 {
		return -v
	}
	// v == MinInt
	return 0
}

// Strings hashes a list of strings to a unique hashcode.
func HashCodes(strings []string) string {
	var buf bytes.Buffer

	for _, s := range strings {
		buf.WriteString(fmt.Sprintf("%s-", s))
	}

	return fmt.Sprintf("%d", HashCode(buf.String()))
}
```



## 使用

```go
func main() {
	// 2713056744
	// 1f8689c0dd07ce42757ac01b1ea714f9
	// 9addcbc6fee9c06f43d7110b657f3c61ff707032
	txt := "https://github.com/hashicorp/terraform/blob/master/helper/hashcode/hashcode.go"
	fmt.Println(HashCode(txt))
	fmt.Println(Md5Str(txt))
	fmt.Println(Sha1Str(txt))
}
```

## 效率

> 得出效率: hash_code > md5 > sha1
>

```go
const (
	Txt = "https://github.com/hashicorp/terraform/blob/master/helper/hashcode/hashcode.go"
)

// go test -test.bench=. -test.benchmem
func BenchmarkMd5Str(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Md5Str(Txt)
	}
}
func BenchmarkHashCode(b *testing.B) {
	for i := 0; i < b.N; i++ {
		HashCode(Txt)
	}
}
func BenchmarkSha1Str(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Sha1Str(Txt)
	}
}

// BenchmarkMd5Str-8        2148428               518 ns/op             144 B/op          3 allocs/op
// BenchmarkHashCode-8      8105571               160 ns/op              80 B/op          1 allocs/op
// BenchmarkSha1Str-8       1836854               700 ns/op             176 B/op          3 allocs/op

// 得出效率: hash_code > md5 > sha1

```

