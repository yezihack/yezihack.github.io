---
title: "Yapi入门笔记"
date: 2020-03-13T13:08:13+08:00
draft: false
tags: ["工具", "YAPI", "良心软件"]
categories: ["工具"]
author: "百里"
comment: false
toc: true
reward: true
---

# 什么是YAPI
 写接口文档的软件, 支持RESTful, Mock假数据, 团队管理协作,非常方便好用.良心之作

# 内网安装
> 参考网上的教程吧.
mac: https://www.cnblogs.com/yehuisir/p/12190446.html
linux; https://www.jianshu.com/p/6c269d00bb38

# 安装cross-request插件

> 可以在Yapi运行假数据.

百度云：https://pan.baidu.com/s/1iB6GMXRqaj9Ovs8KbFFBhA
提取码: akdk

# 使用mock假数据
```json5
{
    "status": 200,//状态码
    "msg": "success",//提示信息
    "data": {
     	"page": 1, //当前页
        "page_count": 10, //一共多少页
        "total_ount": 100, //数据数量
        "list|5-18":[ //生成5到18个子序列
            {
                "id":"@increment", //生成递增主键ID
                "name":"@ctitle(4,6)",//生成中文字符4到6个之间
                "uuid":"@uuid",//生成uuid               
                "created_at":"@date('yyyy-MM-dd')",//生成时期格式
                "status":"@pick(['未认证','已认证','已拒绝','已冻结'])"//从数组里随机选择一项.
            }
        ]
    }
}
```

## mock常用规则
1. @cname() 生成名字
2. @date("yyyy-MM-dd") 生成日期， "2013-05-07"
3. @boolean() 生成true, false
4. @url 生成url 
5. @domain() 生成域名
6. @email() 生成邮箱
7. @region() 生成地区， 如华中，华北
8. @province() 生成省份，如北京，山东，湖南省
9. @city() 生成城市， 如玉林市，拉萨， @city(true)
10. @county() 生成区域 ， 龙亭区
11. @county(true)  生成完整的区域， 如山西省 忻州市 神池县
12. @zip() 生成区号
13. @pick(["a", "e", "i", "o", "u"]) 选择一个元素
14. @guid() 生成uuid
15. @id() 生成ID
16. @increment() 递增1，2，3
17. @increment(100) 递增步长100
18. @title() 生成标头
19. @word(），@word(3），@word(3, 5)生成字母，可以指定大小，也可以是范围。
20. @sentence() @sentence(3) @sentence(3， 5) 生成单词数量 同上
21. @cparagraph()，@cparagraph(2)， @cparagraph(2，5) 生成句子 同上
22. @integer(1, 10) 生成数字， @integer ， @integer(5）
23. @csentence 中文句子
24. @rgba() 生成RBG颜色值 如"rgb(129, 121, 242)"
25. @color()  生成颜色值， 如"#f2798f"


# 参考
1. github https://github.com/YMFE/yapi
1. 官方文档 https://hellosean1025.github.io/yapi/
1. mockjs规则样例: http://mockjs.com/examples.html


