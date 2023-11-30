---

title: "Go 实践教程-基本语法(四)"
date: 2020-09-29T17:29:55+08:00
lastmod: 2020-09-29T17:29:55+08:00
draft: false
tags: ["Go实践教程", "golang", "教程"]
categories: ["Go教程"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description: ""
---
> 本篇主要介绍，基本数据类型、控制语句和数据结构及函数、方法、接口等知识。为后面学习打下基础，有个基本的认识。也为您将来进阶做准备。

## 基础语法 

之前我们在[Go 实践教程-工具及运行(三)](https://yezihack.github.io/tutorial-golang-runing.html)写过一个“hello world”程序，讲解了三个概念：package,import,main

### 注释

> 写代码时必不可少需要写一些代码注释，方便以后回过头来看程序。Go里面提供两种方法注释

```go
// 单行注释 （注意 //之后需要一个空格，之于为什么，go doc 方便自动生成文档抓取注释）
/*
 多行注释，在这里面都属于被注释的内容
*/
```

### 标识符

> 标识符用来命名变量，类型等程序实体。允许由大小写字母(a-z|A-Z)和数据(0~9)及下划线(_)组成，但第一个字符必须由字母和下划线组成

```go
a := 10 // ok
_a := 22 // ok 
case := "abc"// 无效变量 error
9a := 10 // 无效变量 error
```

### 变量命名

> Go 语言的变量命名比较独特，如果你熟悉其它语言你会不习惯的。
>
> 先变量名 后跟类型名称

1. 全局变量

   > 必须有 var 关键字

   ```go
   import main
   
   var num int
   func main() {
       
   }
   // 优雅的方法,适合多个变量， 也适用于import 里
   var (
   	num int
       age int
       name string
   )
   // 等价于
   var num int
   var age int
   var name string
   ```
   
2. 函数内的局部变量

   ```go
   import main
   
   func main() {
   	var a int
   }
   ```

### 变量操作

1. 变量声明

   ```go
   // 指定变量类型, 使用 var 关键字
   var x int // 默认为零值
   x = 10
   
   var arr []int //  arr 零值为 nil
   ```

   

2. 变量推断

   > 只适合在函数内，即局部变量使用

   ```go
   import main
   func main() {
       x := 10 // 自动推断为整形 int
       s := "sgfoot.com" // 自动推断为字符串 string
       var y = 120 // 也可以推断为整形 int
   }
   ```

3. 变量多个赋值

   ```go
   import main
   func main() {
       x, y := 10, 20
       fmt.Printf("x:%d, y:%d\n", x, y)
   }
   ```

   

### 关键字

> Go 一共只有25个关键字, 系统保留的， 不能做为自己的变量名或函数名，结构体名等。

| break    | default     | func   | interface | select |
| -------- | ----------- | ------ | --------- | ------ |
| case     | defer       | go     | map       | struct |
| chan     | else        | goto   | package   | switch |
| const    | fallthrough | if     | range     | type   |
| continue | for         | import | return    | var    |



### 访问权限

> Go 里只有公有与私有之分，没有其它语言中的保护权限
>
> Go 里没有用关键字来区分，而是使用大小写来区分，大写字母为公有，小写为私有(跨包不可见)

1. 变量

   ```go
   var name string // 私有变量
   var Name string // 公有变量
   ```

2. 函数

   ````
   // 私有函数
   func foo() {
   
   }
   // 公有函数
   func Foo() {
   
   }
   ````

3. 结构体

   ```go
   // 私有结构体
   type people struct {
       name string // 私有结构成员
       Age int // 公有结构成员
   }
   // 公有结构体
   type People struct {
       
   }
   ```

4. 接口

   ```go
   // 私有结构体
   type people interface {
       func foo() int 		// 私有函数
       func Foo() string   // 公有函数
   }
   // 公有结构体
   type People interface {
       
   }
   ```


### 常量

> 程序运行时，不会被修改，也无法修改。即是常量

```go
const NAME = "sgfoot.com" // 也可以自己推断
const AGE int = 19 // 也可以指定类型 
```

1. 常量用于枚举操作 优雅操作

   ```go
   const (
   	STATE_USA = "USA"
       STATE_JAP = "JAPANESE"
       STATE_CN = "CHINA"
   )
   ```

2. iota 特殊

   > iota 初使为0， 新的一行没有使用，自动加1，输出上面变量的值。如果遇到显示 iota 就输出值

   ```go
   package main
   
   import "fmt"
   
   const (
   	a = iota     // 0
   	b = 10       // 10
   	c = "sgfoot" // sgfoot
   	d            // sgfoot (输出上面变量即c的值),iota += 1 (iota继续+1)
   	e            // sgfoot (输出上面变量即c的值),iota += 1 (iota继续+1)
   	f = 50       // 50, iota += 1 (iota继续+1)
   	g            // 50(输出上面变量即f的值), iota += 1 (iota继续+1)
   	h = iota     // 7, 出现iota显示即恢复计数
   	i            // 8, iota += 1 (iota继续+1)
   	j = "ok"     // ok,iota += 1 (iota继续+1)
   )
   
   func main() {
   	fmt.Printf("a:%d, a:%d, c:%s, d:%s, e:%s, f:%d, g:%d, h:%d, i:%d, j：%s\n", a, b, c, d, e, f, g, h, i, j)
   }
   ```

### defer 

> 这个关键字的作用是延时操作，也是 go 独特的发明。非常好用。

1. 一般用于忘记关闭连接操作，如文件句柄关闭，数据库关闭

2. 多个 defer 的话，采用栈的方式执行，也就是先进后执行的顺序，这个非常重要。

3. 如果同一个函数内存在`os.Exit(0)`， defer 不会执行的。

   ```go
   package main
   
   func main() {
   	defer print("a")
   	defer print("b")
   	defer print("c")
   }
   // cba
   ```

   ```go
   package main
   
   import "os"
   
   func main() {
   	defer print("a")
   	defer print("b")
   	defer print("c")
   	os.Exit(0)
   }
   // 什么也不输出，因为 os.Exit 的存在
   ```

   ```go
   import "time"
   
   func main() {
   	go func() {
   		defer print("a")
   	}()
   	go func() {
   		defer print("b")
   	}()
   	go func() {
   		defer print("c")
   	}()
   	time.Sleep(time.Millisecond * 10)
   }
   // 输出结果可能是 abc, cba 不确定。因为 goroutine 执行没有顺序可言
   ```

   

## 基础类型

> 类型非常丰富， int 比较特殊，如果运行的机器当前是32位，int = int32, 如果64位 int=int64
>
> int8 占1个字节， int16占2个字节，int32占4个字节, int64占8个字节 

1. 布尔型  `false, true`
2. 数字类型`int, int8, int16, int32, int64, uint, uint8,uint16,uint32,uint64`
3. 字符串类型`float32, float64, complex64, complex128`
4. 其它类型`byte, rune, uint, uintptr`

## 控制操作

### 条件操作 

1. if 操作，三种写法 if , if else, if else if 

   ```go
   rand.Seed(time.Now().UnixNano()) // 必须给个种子。保证每次随机不一样
   x := rand.Intn(100)              // 随机[0, 100)
   // 第1种用法 if
   if x == 10 {
       println("x == 10")
   }
   ```

   ```go
   // 第2种用法 if else
   if x < 10 {
       println("x < 10")
   } else {
       println("x > 10")
   }
   ```

   ```go
   // 第3种用法 if else if else
   if x < 30 {
       println("x < 30")
   } else if x > 30 && x < 60 {
       println("x > 30 与 x < 60")
   } else {
       println("x > 60")
   }
   ```

   

2. switch 操作, 三种使用

   ```go
   rand.Seed(time.Now().UnixNano()) // 必须给个种子。保证每次随机不一样
   x := rand.Intn(100)              // 随机[0, 100)
   // 第1种写法
   switch x {
       case 10, 11, 12, 13: // 多个值的判断
       println("x = 10")
       case 20:
       println("x = 20")
       default:
       println("x", x)
   }
   ```
   ```go
   // 第2种写法
   switch { // switch 这里什么也不写
        case x > 10:
        println("x > 10")
        case x > 60:
        println("x == 60")
        fallthrough // 穿透下一个case判断
        case x == 70, x == 71:
        println("x == 70, 71")
        default:
        println("x", x)
   }
   ```

   ```go
   // 第3种写法： 用法判断未知变量类型
   data := map[int]interface{}{
       1: "sgfoot.com",
       2: 100,
   }
   y := data[1]
   switch y.(type) {// 判断类型 .(type)
       case int:
       println("y is int")
       case string:
       println("y is string")
       default:
       println("y dont know type")
   }
   ```

   

3. select 操作, channel 通道专用

   1. 类似switch， case必须是一个 channel 通信

   ```go
   var x chan int
   x = make(chan int, 1)
   x <- 10 // 使用注释再运行下，查看效果(default)
   select {
       case data := <-x:
       println("data:", data)
       default:
       println("default")
   }
   ```
   1. 如果有多个case都可以使用则会随机选出一个运行。

   ```go  
   var x chan int
   x = make(chan int, 1)
   x <- 10 // 使用注释再运行下，查看效果(default)
   y := make(chan int, 1)
   y <- 20
   select {
       case data := <-x:
       println("data:", data)
       case data := <-y:
       println("data:", data)
       default:
       println("default")
   }
   // 代码多运行几次，结果不一样的。
   ```

   

### 循环操作

> go里只有一种循环，包含其它语言的for, foreach 功能

1. for

   ```go
   // 第1种用法
   for i := 0; i < 10; i++ {
       println("i", i)
   }
   ```

   ```go
   // 第2种用法
   arr := []int{1, 10, 80, 90}
   for key, val := range arr {
       println("key", key, "val", val)
   }
   for _, val := range arr { // 忽略 key,使用 _, 同理也可以忽略 val, 只打印 key.自己试下吧。
       println("val", val)
   }
   ```

2. break, continue, goto 在for里使用

   1. break 是随时跳出第一层 for 循环

      ```go
      for i := 0; i < 10; i++ {
          if i == 5 { // i = 5时之后的数据不再打印啦。
              break
          }
          println("i", i)
      }
      ```

      

   2. continue 是跳过某逻辑代码，进入下一次循环

      ```go
      for i := 0; i < 10; i++ {
          if i == 5 {
              continue // i = 5时不执行本次循环啦，直接跳到下一次循环， 打印6之后的数据
          }
          println("i", i)
      }
      ```

      

   3. goto 是直接跳到标记处，少用，不推荐使用。危害性大.

      ```go
      for i := 0; i < 10; i++ {
          if i == 5 {
              goto END // i = 5时直接暴力跳到END标记处，即结束所有的循环操作啦
          }
          println("i", i)
      }
      END: // 顶格写
      	println("结束啦")
      ```

      

## 运算操作

### 算术运算

加+，减-，乘*， 除/，求余%，自增++，自减--

```go
x, y := 10, 2
println("加法", x+y)
println("减法", x-y)
println("乘法", x*y)
println("除法", x/y)
println("求余", x%y)
x++
println("自增", x)
y--
println("自减", y)
```

### 关系运算

相等(==)，不相等(!=)， 大于(>)，小于(<)，大于并等于(>=)， 小于并等于(<=)

```go
rand.Seed(time.Now().UnixNano())
x := 10
y := rand.Intn(20)
if x == y {
    println("x == y")
}
if x != y {
    println("x != y")
}
if x > y {
    println("x > y")
}
if x < y {
    println("x < y")
}
if x >= y {
    println("x >= y")
}
if x <= y {
    println("x <= y")
}
```

### 逻辑运算

&&与, ||或, !非

```go
rand.Seed(time.Now().UnixNano())
x := rand.Intn(20)
y := rand.Intn(20)
if y > 10 && x == y { // && 必须是两个条件同时满足，才成立
    println("y > 10 && x == y")
}
if y > 10 || x == y { // || 满足一个条件，即成立
    println("y > 10 || x == y")
}
if !(x == y) { // ! 取反，即成立
    println("!(x == y)")
}
```

### 位运算

&，|, ^, >>, << 

1. &位运算

   两个位都为1时，结果才为1

   ```shell
   1011
   1001
   ---- &运算结果
   1001
   ```

2. |位运算

   两个位都为0时，结果才为0。 含有1，结果就为1

   ```shell
   1011
   1001
   ---- |运算结果
   1011
   ```

   

3. ^位运算

   两个位相同为0， 相异为1

   ```shell
   1011
   1001
   ---- ^运算结果
   0010
   ```

4. `>>`运算

   向左移，最左边的高位丢掉补0， 最右边的低位直接丢掉。相当于除以2

   ```shell
   1011 >> 1
   结果：0101
   ```

5. `<<`运算

   向左移，最高位向前进一位， 左边的位进一位。相当于乘以2

   ```shell
   1011 << 1
   结果：0001 0110
   ```

综合golang练习一下

```go
x := 11                 // 二进制为 1011
y := 8                  // 二进制为 1000
println("x & y =", x&y) // 8 二进制为 1000
println("x | y =", x|y) // 11 二进制为 1011
println("x ^ y =", x^y) // 3 二进制为 0011
println("x >> 1", x>>1) // 5 二进制为 0000 0101
println("y << 1", x<<1) // 22 二进制为 0001 0110
```

### 赋值运算

对运算进行简化操作。如 a = a + 10, 可以简化成 a += 10

```go
x := 11 
y := 8 
x += y
x -= y
x /= y
x *= y
x %= y
x <<= y
x >>= y
x &= y
x |= y
x ^= y
println("x ", x)
```

### 其它运算

&取变量地址，*指针变量

```go
x := 10
println("x地址：", &x) // 0xc000037f68(每个人的内存不一样，显示地址也不一样)
var y *int          // 声明一个指针，未实例，不能使用。因为没有分配空间
y = &x              // 把 x 的地址赋值给 y
println("y=", *y)   // 10
println("y地址", y)   // 0xc000037f68 与 x 的地址相同
```

## 数据结构

> slice, map, chan 都是引用类型，需要使用 make 初使化，才能使用。

### 数组

> 使用时必须声明数组大小，不太灵活，所以很少使用, 底层是连续分配的空间

```go
var arr [3]int
arr[0] = 1
arr[1] = 2
arr[2] = 3
//arr[3] = 4 不能再赋值啦，因为只分配了3个大小的空间。
println("arr[2]=", arr[2]) // 3
```

### 切片(slice)

> 切片底层是指向数组的指针，即动态数组，在实际中常用。
>
> 线程不安全的数据结构
>
> 关于cap的扩容规则: 小于等于1024大小时采用2倍扩容，大于1024则按1.25倍扩容。

1. 第一种用法
    ```go
    var arr []int        // 只定义了切片，未分配内存
    arr = make([]int, 4) // 对 arr 进行分配内存空间， 第1个参数是类型， 第2个参数是初使大小， 还有第三个参数是容量cap
    arr[0] = 1
    arr[1] = 2
    arr[2] = 3
    arr[3] = 4                 // 数组是不能超出定义的大小，而切片可以动态扩容。
    println("arr[2]=", arr[2]) // 3
    arr = append(arr, 5)       // 动态追加数据
    arr = append(arr, 6)       // 动态追加数据
    arr = append(arr, 7)       // 动态追加数据
    for _, val := range arr {
        println("val=", val)
    }
    ```

2. 第二种用法

   ```go
   arr := make([]int, 0)
   for i := 0; i < 10; i++ {
       arr = append(arr, i) // 动态添加数据，无需指定大小，自动扩容
   }
   ```

3. 第三种用法 len, cap

    len 是切片实际长度

    cap是切片底层分配数组的大小，而并实际使用大小

    只有len > cap时才会进行一次 cap 大小扩容

    ```go
    arr := make([]int, 0, 10)
    for i := 0; i < 10; i++ {
    	arr = append(arr, i) // 动态添加数据，无需指定大小，自动扩容
    }
    // len 是切片实际长度，cap是切片底层分配数组的大小，而并实际使用大小，只有len > cap时才会进行一次 cap 大小扩容
    println("len:", len(arr), "cap", cap(arr)) // len: 10 cap 10
    for i := 0; i < 1; i++ {
    	arr = append(arr, i) // 动态添加数据，无需指定大小，自动扩容
    }
    println("len:", len(arr), "cap", cap(arr)) // len: 11 cap 20
    ```

4. copy 

    ```go
    arr := make([]int, 0, 10)
    for i := 0; i < 10; i++ {
        arr = append(arr, i) // 动态添加数据，无需指定大小，自动扩容
    }
    // copy 第一个参数是目标切片，第二个参数是源切片。
    // 当目标切片长度小于源切片则只复制目标切片长度的数据。反之则零值0
    cc := make([]int, 5)
    copy(cc, arr)
    for i := 0; i < len(cc); i++ {
        print(cc[i], ",")
    }
    // 0,1,2,3,4,
    cc2 := make([]int, 11)
    copy(cc2, arr)
    for i := 0; i < len(cc2); i++ {
        print(cc2[i], ",")
    }
    // 0,1,2,3,4,5,6,7,8,9,0,
    ```

    

### 字典(map)

> 无序的 kv 数据结构， 可以通过 key 检索数据，时间复杂度O(1), 
>
> 线程不安全的数据结构

1. 第一种用法

   ```go
   var s map[string]string
   s = make(map[string]string)
   s["golang"] = "最厉害的语言"
   s["sgfoot.com"] = "一个有节操的技术网站"
   println(s["golang"], s["sgfoot.com"]) // 最厉害的语言 一个有节操的技术网站
   ```

2. 第二种用法

   ```
   s := make(map[string]string) // 直接用推断初使化 map
   s["golang"] = "最厉害的语言"
   s["sgfoot.com"] = "一个有节操的技术网站"
   println(s["golang"], s["sgfoot.com"]) // 最厉害的语言 一个有节操的技术网站
   ```

3. 第三种用法，删除键与判断键是否存在

   ```go
   s := make(map[string]string)
   s["golang"] = "最厉害的语言"
   s["sgfoot.com"] = "一个有节操的技术网站"
   println(s["golang"], s["sgfoot.com"]) // 最厉害的语言 一个有节操的技术网站
   delete(s, "golang")
   if _, ok := s["golang"]; !ok { // 一种方便牛X的写法，判断map键是否存在， 注意有个分号(;)
   	println("golang键已经删除掉了") // golang键已经删除掉了
   }
   if val, ok := s["sgfoot.com"]; ok {
       println("sgfoot.com", val) // sgfoot.com 一个有节操的技术网站
   }
   ```

### 通道(chan)

> 通道非常重要，也是 go 语言的灵魂。
>
> 这是先简单介绍一下，后面会专门写一篇文章介绍如何使用

1. 第一种用法: 不带缓冲能力

   第一个参数是声明通道的类型

   第二个参数是声明通道是否带缓冲能力(这里为0，不带缓冲能力)

   ```go
   
   c := make(chan int, 0) // 第一个参数是声明通道的类型， 第二个参数是声明通道是否带缓冲能力(这里为0，不带缓冲能力)
   	// 无缓冲能力则需要使用一个 goroutine 将通道里的数据取出来，否则会 deadlock(你可以把 go func(){} 注释运行一下)
   go func() {
       for data := range c {
           println(data)
       }
   }()
   c <- 1
   c <- 2
   time.Sleep(time.Millisecond) // 等待上面代码完成，主线程再结束
   ```

2.  第二种用法：带缓冲能力

   ```go
   c := make(chan int, 2) // 第一个参数是声明通道的类型， 第二个参数是声明通道是否带缓冲能力
   c <- 1
   c <- 2
   println(<-c, <-c) // 1 2
   ```

   

