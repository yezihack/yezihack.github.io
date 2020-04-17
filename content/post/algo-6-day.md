---
title: "算法第6天:跳水板"
date: 2020-04-14T21:22:39+08:00
draft: false
tags: ["golang", "算法", "leetcode", "每日算法"]
categories: ["算法"]
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

> leetcode: 16.11
> https://leetcode-cn.com/problems/diving-board-lcci

## 题目

你正在使用一堆木板建造跳水板。有两种类型的木板，其中长度较短的木板长度为shorter，长度较长的木板长度为longer。你必须正好使用k块木板。编写一个方法，生成跳水板所有可能的长度。

返回的长度需要从小到大排列。

---

## 思路

题目的意思就是求一个k的组合, 利用给出的长短木板进行组合.

边界条件考虑:

如果k = 0, 也就是不需要组合.返回空数组.

如果长短目录都相等, 最长的目录组就是 k * 长度(shorter, longer)


## 代码求解
```go

func LivingBoard(shorter, longer, k int) []int {
	if k == 0 { // 也就是不需要组合.返回空数组.
		return nil
	}
	if shorter == longer { // 如果长短目录都相等, 最长的目录组就是 k * 长度(shorter, longer)
		return []int{shorter * k}
	}
	group := make([]int, k+1) // 为什么k+1, 因为在组合中我可以使用全是长木板也可以使用全是短木板.
	for i := 0; i < k+1; i++ {
		fmt.Printf("i:%d, k-i:%d\n", i, k-i)
		// 当i=0时,不采用短木板,也就是k-i=k, 表示全使用长木板.
		// 当i=k时,采用全是短木板,而k-k=0,表示不采用长木板
		group[i] = i*shorter + (k-i)*longer
	}
	// 进行排序一下.从低到高的顺序.
	sort.Ints(group)
	return group
}
```

## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)


