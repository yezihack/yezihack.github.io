---
title: "Gin_validator"
date: 2020-06-15T18:35:49+08:00
lastmod: 2020-06-15T18:35:49+08:00
draft: false
tags: ["golang", "", ""]
categories: ["golang"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""
---



## gin 自带验证器

> 参考文档: https://godoc.org/gopkg.in/go-playground/validator.v8#hdr-Baked_In_Validators_and_Tags

gin 是个优秀的web框架, 集大成于一身. 对于参数的验证可以进行过滤. gin是引用了 [go-playground](https://github.com/go-playground/validator)框架, 今天我们来学习一下如何使用验证器.

