---
title: "算法第3天:最长公共前缀"
date: 2020-02-24T15:16:51+08:00
draft: false
tags: ["golang", "算法", "leetcode", "每日算法"]
categories: ["算法"]
author: "百里"
toc: true
reward: true
# weight: 1
# lastmod: 2018-03-01T16:01:23+08:00
# author: "xianmin"
# reward: false
# mathjax: false
# description = ""
# comment: false
# toc: false
---

![img](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417143019.webp?imageslim)

> leetcode 14. 最长公共前缀 simple

## 题目

编写一个函数来查找字符串数组中的最长公共前缀。
如果不存在公共前缀，返回空字符串 ""。

输入: ["flower","flow","flight"]
输出: "fl"

输入: ["dog","racecar","car"]
输出: ""
解释: 输入不存在公共前缀。

---

## 解题思路
### 解法一: 挨个比较

1. 首先要注意边界条件, 数组为空的情况
1. 先找到数组里最短的字符串,因为题目是求最短前缀,必须先找最短的字符串
1. 拿最短字符串与数组里每一个字符串的每一个字符进行比较. 如果不相等则截取,即获取最短前缀.
1. 注意这里是最外层循环是最短的字符串循环, 然后里层循环是数组循环, 挨个字符串进行比较. 也就是查看所有的字符串与最短的字符串是否一致.如果出现不一致则截取返回.

```
func LongestCommonPrefix(strs []string) string {
	l := len(strs)
	if l == 0 { //边界条件
		return ""
	}
	short := strs[0]
	//从数组里查找到最小字符串.
	for i := 1; i < l; i++ {
		if len(short) > len(strs[i]) { //只要存在比第一个字符还短的则进行赋值操作.
			short = strs[i]
		}
	}
	//如果最短字符串长度为0则,返回空
	if len(short) == 0 { //边界条件 .
		return ""
	}
	fmt.Println("short", short)
	//因为我们只求前缀.将最短字符串比较即可.
	for i := 0; i < len(short); i++ { //循环最短字符串. 然后与数组里每一个字符串按挨个字符进行比较.只要遇到不相等则截取最短字符串.
		for j := 0; j < l; j++ { //循环字符串数组.
			fmt.Printf("i:%d,j:%d, str;%s, s:%c, v:%c\n", i, j, strs[j], strs[j][i], short[i])
			if strs[j][i] != short[i] { //循环进行挨个字符进行比较.只要发现不相等的则截取返回.
				short = strs[j][:i] //只要不相等,则截取数组里的字符最短前缀.
				return short
			}
		}
	}
	return short
}
```

### 解法二: 水平扫描法
1. 处理边界条件
1. 默认从数组里获取一个元素做参照字符串.
1. 然后对数组进行遍历, 里面再进行不断循环判断参照字符串是不是数组某个元素的字集
1. 如果不是子集,则进行将参照字符串进行砍掉一个字符的尾巴. 直到是数组里某个字符串的子集.
1. 注意循环里的边界条件 

```
//水平扫描法
func longestCommonPrefixV2(strs []string) string {
	l := len(strs)
	if l == 0 { //边界条件
		return ""
	}
	short := strs[0]                 //假设第一个字符是最小字符串.
	for i := 0; i < len(strs); i++ { //遍历整个数组
		for strings.Index(strs[i], short) != 0 {
			//循环处理, 只要minPrefix不是子集则继续循环.
			// 每次对minPrefix减小一个字符进行循环比较
			if len(strs[i]) == 0 { //边界条件, 如果数组里有空的元素,则直接返回为空
				return ""
			}
			short = short[0 : len(short)-1] //每次减小一个字符进行下一轮比较.
			fmt.Printf("str:%s, min:%s\n", strs[i], short)
		}
	}
	return short
}
```

## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)









