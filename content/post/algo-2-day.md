---
title: "算法第2天: 盛最多水的容器"
date: 2020-02-24T11:21:11+08:00
draft: false
tags: ["golang", "算法", "leetcode"]
categories: ["算法"]
author: "百里"
menu:
  main:
    parent: "算法练习"
    weight: 1
---

![算法第2天](/images/13827699-a32bc27e01768793.png)

> LeetCode:11题, 中等

## 解析题目
解析题目: 将数组想象成一个矩形, 寻找这个矩形盛最多水的大小. 决定盛水高度取决于最低的那根木板.也就是数字最小的那个值, 决定盛水最多还得取决于它的长度.也就是数组的头与尾之间的距离.

---
## 暴力求解.

> 对数组从小到大都查看一遍, 取最大容器的那个.

```
//暴力求解
//Time:O(n^2), Space:O(1)
func ContainerWithMostWater(height []int) int {
	if len(height) == 0 {
		return 0
	}
	//暴力求解, 任何可能都不放过.
	maxArea := 0 //存放最大面积的变量.
	for i := 0; i < len(height); i++ {
		for j := i + 1; j < len(height); j++ {
			//获取最短板的那个数字,也就是最小值的数字
			minHeight := height[i]
			if height[j] < minHeight {
				minHeight = height[j]
			}
			//获取j与i之间的差距离.
			distance := j - i
			//求面积.
			area := minHeight * distance
			if area > maxArea {
				maxArea = area
			}
		}
	}
	return maxArea
}
```

## 双指针算法求解.
```
//解法二: 双指针解法
//Time: O(n), Space:O(1)
func ContainerWithMostWaterV2(height []int) int {
	if len(height) == 0 { //边界条件
		return 0
	}
	left, right := 0, len(height)-1 //声明左右指针.
	maxArea := 0                    //声明存放最大面积的变量.
	for left < right {              //左边指针相遇则结束程序
		distance := right - left          //求解左右之间的差距离.可能想象成一个矩形,求最大面积
		minHeight := height[left]         //左右两边的数字求最小, 可以想象成一个桶, 决定桶能盛最多水,取决于最短的那根木板.
		if height[right] < height[left] { //如果右边小于左边,则取右边的木板高度.
			minHeight = height[right]
			right-- //移动右指针继续下一次计算.这是是减减,因为右指针要向左边移动
		} else {
			left++ //反之.左边的指针要向右移动.
		}
		area := distance * minHeight //计算当前的面积
		if area > maxArea {          //如果大于之前计算过的面积则替换之.
			maxArea = area
		}
	}
	//返回最大的面积值.
	return maxArea
}
```

## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)
