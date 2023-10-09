---
title: "Shell运算符"
date: 2020-06-04T11:03:14+08:00
lastmod: 2020-06-04T11:03:14+08:00
draft: false
tags: ["linux", "shell", "运算符"]
categories: ["shell"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""

---

# 运算符

## 算术运算符

```
八种运算符号 +, -, *, /, %, =, ==, !=

采用此表达式: `expr $a + $b` 计算加法, 其它类似
数字判断相等: [ $a == $b ] 
数字判断不相等: [ $a != $b ] 
乘号比较特殊: val=`expr $a \* $b` 需要加\才能运算
不使用expr, 可以使用$((表达式))代替

例: 
a=10
b=20
val=`expr $a + $b`
echo "a + b : $val"
```

## 关系运算符

关系运算符只支持数字, 不支持字符串,除非字符串是数字

```
六种运算符号
-eq 判断左边等于右边
-ne 判断左边不相等右边
-gt 判断左边大于右边
-lt 判断左边小于右边
-ge 判断左边大于等于右边
-le 判断左边小于等于右边

例: 
a=10
b=20
if [ $a -eq $b ]; then
	echo "a与b相等"
else
	echo "a与b不相等"
fi
```

## 布尔运算符

```
共三种符号: !非, -o或, -a与

例
a=10
b=20

if [ $a != $b ]
then
   echo "$a != $b : a 不等于 b"
else
   echo "$a == $b: a 等于 b"
fi

if [ $a -lt 100 -a $b -gt 15 ]
then
   echo "$a 小于 100 且 $b 大于 15 : 返回 true"
else
   echo "$a 小于 100 且 $b 大于 15 : 返回 false"
fi
```

## 逻辑运算符

```
二种符号: && And , ||　or

例
if [[ $a -lt 100 && $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi
```

##　字符串运算符

```
5种符号: 
 = 检测字符串是否相等					
!= 检测字符串是否不相等				
-z 检测字符串长度是否为0, 为0则true 	   
-n 检测字符串长度是否不为0, 不为0则true	  
$ 检测字符串是否为空，不为空返回 true。  	 

例:
 a 为 "abc"，变量 b 为 "efg"：
  [ $a = $b ] 返回 false。
  [ $a != $b ] 返回 true。
  [ $a != $b ] 返回 true。
  [ -z $a ] 返回 false。
  [ -n "$a" ] 返回 true。
  [ $a ] 返回 true。
```

## 文件测试运算符

| 操作符  | 说明                                                         | 举例                      |
| :------ | :----------------------------------------------------------- | :------------------------ |
| -b file | 检测文件是否是块设备文件，如果是，则返回 true。              | [ -b $file ] 返回 false。 |
| -c file | 检测文件是否是字符设备文件，如果是，则返回 true。            | [ -c $file ] 返回 false。 |
| -d file | 检测文件是否是目录，如果是，则返回 true。                    | [ -d $file ] 返回 false。 |
| -f file | 检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 true。 | [ -f $file ] 返回 true。  |
| -g file | 检测文件是否设置了 SGID 位，如果是，则返回 true。            | [ -g $file ] 返回 false。 |
| -k file | 检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回 true。  | [ -k $file ] 返回 false。 |
| -p file | 检测文件是否是有名管道，如果是，则返回 true。                | [ -p $file ] 返回 false。 |
| -u file | 检测文件是否设置了 SUID 位，如果是，则返回 true。            | [ -u $file ] 返回 false。 |
| -r file | 检测文件是否可读，如果是，则返回 true。                      | [ -r $file ] 返回 true。  |
| -w file | 检测文件是否可写，如果是，则返回 true。                      | [ -w $file ] 返回 true。  |
| -x file | 检测文件是否可执行，如果是，则返回 true。                    | [ -x $file ] 返回 true。  |
| -s file | 检测文件是否为空（文件大小是否大于0），不为空返回 true。     | [ -s $file ] 返回 true。  |
| -e file | 检测文件（包括目录）是否存在，如果是，则返回 true。          | [ -e $file ] 返回 true。  |