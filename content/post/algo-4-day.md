---
title: "算法第4天:LRU缓存机制"
date: 2020-02-24T15:16:54+08:00
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
![](http://img.sgfoot.com/b/20200417143014.webp?imageslim)

> leetcode 146.  LRU缓存机制 middle

## 题目

运用你所掌握的数据结构，设计和实现一个  LRU (最近最少使用) 缓存机制。它应该支持以下操作： 获取数据 get 和 写入数据 put 。
获取数据 get(key) - 如果密钥 (key) 存在于缓存中，则获取密钥的值（总是正数），否则返回 -1。
写入数据 put(key, value) - 如果密钥不存在，则写入其数据值。当缓存容量达到上限时，它应该在写入新数据之前删除最近最少使用的数据值，从而为新的数据值留出空间。

进阶:
你是否可以在 O(1) 时间复杂度内完成这两种操作？
---

## 解题方法
采用hash+double-linked实现LRU缓存算法机制.
先独立写个双链表, 然后引用双链表和hash实现LRU

### 双链表
>  有些多除的方法,主要为了调试使用.

```

type Linkeder interface {
	AddHead(key, value int) *LinkedNode //插入头位置
	Append(key, value int) *LinkedNode  //追求到尾部
	RemoveNode(node *LinkedNode) bool   //删除指定位置的节点
	RemoveTail() *LinkedNode            //删除尾部的节点
	Reverse() *LinkedNode               //反转链表
	Print() string                      //打印链表
	PrintLink(head *LinkedNode) string
}

type LinkedNode struct {
	key   int         //key
	value int         //value
	next  *LinkedNode //next pointer
	prev  *LinkedNode //prev pointer
}

type Linked struct {
	length int         //链表长度
	head   *LinkedNode //链表头部节点
	tail   *LinkedNode //链表尾部节点
}

func NewLinked() Linkeder {
	return &Linked{}
}

//插入头部操作.
func (l *Linked) AddHead(key, value int) *LinkedNode {
	//创建一个新的节点
	node := &LinkedNode{key: key, value: value}
	if l.head == nil { //头问点为空,则表明这个链表为空的状态
		l.head = node //新节点赋值给头节点
		l.tail = node //新节点赋值给尾节点
		//整个链表只有一个节点.
	} else {
		l.head.prev = node //head的前驱指向新的节点
		node.next = l.head //之前的头节点赋值 给新节点的后继节点
		l.head = node      //将node设置给head, 设置新的头节点
	}
	l.length++
	return node
}

//追加新的节点
func (l *Linked) Append(key, value int) *LinkedNode {
	node := &LinkedNode{key: key, value: value}
	if l.tail == nil { //如果尾指针为空则设置头与尾指针
		l.head = node
		l.tail = node
	} else {
		node.prev = l.tail //node前驱指向尾节点
		l.tail.next = node //属节点后驱指向node
		l.tail = node      //node赋值给尾节点.node并成为新的尾结点
	}
	l.length++
	return node
}

//删除指点位置的节点
//删除中间节点需要考虑的四点:
//1. 是否是头节点
//2. 是否是尾节点
//3. 节点前驱是否为空
//4. 节点后继是否为空
func (l *Linked) RemoveNode(node *LinkedNode) bool {
	if node == l.head { //要删除的节点等于头节点的话
		l.head = l.head.next //头指针的后继指针指作为新的头指针
	} else if node == l.tail { //如果要删除的节点是尾节点的话
		l.tail = l.tail.prev //将尾指针的前驱指针作为新的尾指针.
	}
	if node.prev != nil { //要删除的节点前驱不为空的话
		node.prev.next = node.next //则将删除的节点的前驱节点的后继指针指向要删除的节点的后继节点.
	}
	if node.next != nil { //要删除的节点后继不为空的话.
		node.next.prev = node.prev //则将删除的节点后前驱指向要删除的节点前驱节点
	}
	l.length--
	return true
}

//移除尾节点.
func (l *Linked) RemoveTail() *LinkedNode {
	if l.tail == nil {
		return nil
	}
	node := l.tail
	if l.tail.prev == nil { //尾节点的前以区为空的话
		l.head, l.tail = nil, nil //则头与尾都设置为空
	} else {
		l.tail = l.tail.prev //尾节点的前驱作为新的尾节点
		l.tail.next = nil    //将新的尾节点后继指针设置为空
	}
	l.length--
	return node
}

//反转链表
func (l *Linked) Reverse() *LinkedNode {
	if l.head == nil {
		return nil
	}
	head := l.head       //获取头节点
	var prev *LinkedNode //声明一个空节点,用于实现头插法.
	for head != nil {
		node := head.next //截断头节点与后继的节点.
		head.next = prev  //将头节点后继指向新的节点上.即prev
		prev = head       //将整个head作为prev节点.
		head = node       //设置新的头节点.即截断的后部分
	}
	return prev
}

//打印链表
func (l *Linked) Print() string {
	str := ""
	node := l.head    //声明一个节点
	for node != nil { //循环判断节点是否为空
		str += fmt.Sprintf("%d:%d", node.key, node.value)
		node = node.next //继续探测后继节点
		if node != nil { //如果不为空则加个标签.
			str += "=>"
		}
	}
	return str
}

//打印链表
func (l *Linked) PrintLink(head *LinkedNode) string {
	str := ""
	for head != nil {
		str += fmt.Sprintf("k:%d, v:%d", head.key, head.value)
		head = head.next
		if head != nil {
			str += "=>"
		}
	}
	return str
}

```

### LRU算法实现代码

```
//LRU策略算法
//使用map+double link实现.
//如果添加节点时,将添加到头部.表示经常使用.需要考虑,如果容量满则淘汰尾部节点.并删除map里的数据.
//如果获取节点时,先查看缓存是否存在,不存在则返回-1, 如果存在则先删除节点, 然后将数据重新添加到头部.

//以下实现方法是,先实现一个链表. 然后对链表实现添加头部操作, 删除尾部删除, 删除指点节点操作.
type LRUCache struct {
	capacity int                 //存储上限大小
	count    int                 //记录存储的长度
	cache    map[int]*LinkedNode //设置map存储节点
	link     Linkeder            //设置一个链表
}

func Constructor(capacity int) LRUCache {
	lru := LRUCache{
		capacity: capacity,
		cache:    make(map[int]*LinkedNode),
		link:     NewLinked(),
	}
	return lru
}

//获取数据
func (this *LRUCache) Get(key int) int {
	node, ok := this.cache[key] //查看缓存是否存在数据.
	if !ok {                    //不存在则返回-1
		return -1
	}
	this.link.RemoveNode(node)                       //先删除节点.
	_node := this.link.AddHead(node.key, node.value) //重新将节点添加到头部.
	this.cache[key] = _node                          //更新缓存节点
	return _node.value                               //返回数据.
}

//添加节点操作.
func (this *LRUCache) Put(key, value int) {
	node, ok := this.cache[key] //查看缓存是否存在.
	if ok {                     //存在
		this.link.RemoveNode(node)             //删除旧节点
		_node := this.link.AddHead(key, value) //重新添加到头部.
		this.cache[key] = _node                //更新缓存节点.
	} else { //节点不存在
		if this.count == this.capacity { //当容量满时则淘汰尾部节点
			_node := this.link.RemoveTail() //删除尾部节点
			delete(this.cache, _node.key)   //并删除缓存里的节点
			this.count--                    //数量减一
		}
		_node := this.link.AddHead(key, value) //添加头部
		this.cache[key] = _node                //向缓存中添加数据.
		this.count++                           //数量加1
	}
}

```

## 查看完整源码
[https://github.com/yezihack/leetcode](https://github.com/yezihack/leetcode)
