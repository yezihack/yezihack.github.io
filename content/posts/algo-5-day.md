---
title: "算法第5天:最大子序和"
date: 2020-02-24T15:16:57+08:00
draft: false
tags: ["golang", "算法", "leetcode", "每日算法"]
categories: ["算法"]
author: "百里"
reward: true
comment: false
toc: true
# weight: 1
# lastmod: 2018-03-01T16:01:23+08:00
# author: "xianmin"
# mathjax: false
# description = ""

---

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20200417143007.webp?imageslim)

> leetcode 53.  最大子序和 simple

## 题目

给定一个整数数组 nums ，找到一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

示例:
输入: [-2,1,-3,4,-1,2,1,-5,4],
输出: 6
解释: 连续子数组 [4,-1,2,1] 的和最大，为 6。

----

## 解题思路
> 共三种思路: 暴力求解;贪心算法,动态规划

### 暴力求解
数组每一种组合都查看一遍, 每个组合都与保存当前最大值的变量比较一下.
```
//暴力求解
//Time:O(n^2), space:O(1)
func MaxSubArray(nums []int) int {
	count := len(nums)
	if count == 0 {
		return 0
	}
	max := 0
	for i := 0; i < count; i++ {
		sum := 0
		for j := i; j < count; j++ {
			sum += nums[j] //累加操作
			if sum > max { //如果大于max则替换掉.
				max = sum
			}
		}
	}
	return max
}
```

### 贪心算法
每计算一步,都认为是最大值.最终求得最大值.

```
//贪心求解
//Time:O(n), space:O(1)
func MaxSubArrayV2(nums []int) int {
	if len(nums) == 0 { //边界条件
		return 0
	}
	var (
		max = nums[0] //默认第一个元素最大.
		sum = nums[0] //默认第一个元素最大.
	)
	for i := 1; i < len(nums); i++ {
		sum += nums[i]
		if nums[i] > sum { //如果当前数组的值大于sum,则替换
			sum = nums[i]
		}
		if sum > max { //如果大于max,则替换
			max = sum
		}
	}
	return max
}
```

### 动态规划
每计算一步时,求得当前最大子序列之和,存入dp数组里. 然后再进行与result进行对比.求得最终的值.
```
//动态求解
//Time:O(n), space:O(n)
//递推公式: F(n) = Max(f(n-1), nums[n]),
func MaxSubArrayV3(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	//申请一个dp数组.
	dp := make([]int, len(nums))
	//默认第一个元素最大.
	dp[0] = nums[0]
	//max function
	Max := func(a, b int) int {
		if a > b {
			return a
		}
		return b
	}
	result := 0
	for i := 1; i < len(nums); i++ {
		dp[i] = Max(dp[i-1]+nums[i], nums[i]) //递推公式
		result = Max(dp[i], result)           //求最大值.
	}
	return result
}
```
## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)
