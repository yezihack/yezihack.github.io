---
title: "算法第1天: 缺失的第一个正数"
date: 2020-02-24T11:21:11+08:00
draft: false
tags: ["golang", "算法", "leetcode", "每日算法"]
categories: ["算法"]
author: "百里"
comment: false
toc: true
reward: true

---
![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417143038.webp?imageslim)

# 感触
为了坚持学习算法, 每篇算法标题写上坚持多少天,以此鼓励自己坚持学下去. 
会把自己理解的都写在代码处, 你在看代码时也方便, 为什么这一行这么写. 
也是锻炼自己的文档水平.

## 题目
> LeetCode:41题, 困难

```
给定一个未排序的整数数组，找出其中没有出现的最小的正整数。
示例 1:
输入: [1,2,0]
输出: 3

示例 2:
输入: [3,4,-1,1]
输出: 2

示例 3:
输入: [7,8,9,11,12]
输出: 1
```

要求: 你的算法的时间复杂度应为O(n)，并且只能使用常数级别的空间

---
## 解法一: 利用map+for-range实现
> Time: O(n), Space:O(n)不符合题目要求

```golang
//解法一: 利用map+for-range实现.时间复杂度O(n), 空间是常数O(n)
//	4 ms	2.8 MB
func FirstMissingPositive(nums []int) int {
	hash := make(map[int]struct{}, len(nums))
	for i := 0; i < len(nums); i++ {
		hash[nums[i]] = struct{}{}
	}
	fmt.Println(hash)
	//1-n之间检查, 如果有缺失则是最小值.
	for i := 1; i <= len(nums); i++ { //从1循环到n, 包含n
		if _, ok := hash[i]; !ok {
			return i
		}
	}
	//如果都不在hash里面的话,则是长度+1
	return len(nums) + 1
}
```

## 解法二: 原地桶排序(符合要求)
Time: O(n), Space:O(1)

最小整数大于等于1, 小于的都不符合.也就是说:数字1,应该存放在0下标, 数字2存放在1的位置
如果不符合的元素,再进行遍历一遍: 条件: 数字==数字-1(下标),如果不符合则就是缺失的最小整数的元素
[4, 2, -1, 1]. 进行调整: [1, 2, -1, 4]. 发现只有-1与他所在的下标不符合.即是缺失的最小整数.

```golang
//解题: 原地桶排序
//最小整数大于等于1, 小于的都不符合.也就是说:数字1,应该存放在0下标, 数字2存放在1的位置
//如果不符合的元素,再进行遍历一遍: 条件: 数字==数字-1(下标),如果不符合则就是缺失的最小整数的元素
//[4, 2, -1, 1]. 进行调整: [1, 2, -1, 4]. 发现只有-1与他所在的下标不符合.即是缺失的最小整数.
func FirstMissingPositiveV2(nums []int) int {
	l := len(nums)
	for i := 0; i < l; i++ {
		for nums[i] > 0 /*最小正整数必须大于0*/ &&
			nums[i] <= l /*最小正整数必须等于长度. 因为4的元素存放在3的下标*/ &&
			nums[i] != nums[nums[i]-1] /*元素与下标减1不符合则需要调整*/ {
			tmp := nums[i]        //元素存放在临时变量.
			nums[i] = nums[tmp-1] //寻找元素所处在下标正确的位置,如元素3应该存放在下标2的位置.
			nums[tmp-1] = tmp     //as above
			//也可以写成
			//nums[i], nums[nums[i]-1] = nums[nums[i]-1], nums[i]
		}
	}
	//调整好的位置, 可以查看结果, 缺失的位置.
	fmt.Println(nums)
	for i := 0; i < l; i++ {
		if nums[i] != i+1 { //元素必须与下标i+1相等,才是元素所处的正常位置.如元素3应该存放在下标2的位置.
			return i + 1
		}
	}
	return l + 1
}

```

## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)
