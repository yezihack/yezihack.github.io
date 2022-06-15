---
title: "Linux DNS 略解"
date: 2022-04-25T09:58:14+08:00
lastmod: 2022-04-25T09:58:14+08:00
draft: false
tags: ["linux", "网络", "dns"]
categories: ["网络"]
author: "百里"
comment: false
toc: true
reward: true
# weight: 1
# description = ""

---

## DNS

DNS 全称：

```sh
/etc/resolv.conf

search cluster.local
options timeout:1 attempts:1 rotate
nameserver 10.0.0.1
nameserver 10.0.0.2
nameserver 10.0.0.3



nameserver:dns服务器的ip地址。最多能设三个。
timeout:查询一个nameserver的超时时间，单位是秒。系统缺省是5，最大可以设为30。这他娘不是坑爹吗？那个应用的dns请求会允许这么长的超时时间？早tm超时出错返回了吧。所以我们这里改成最小值：1
attempts:这个是查询的整个都尝试一遍的次数。缺省是2，我觉得在有3台nameserver的前提下，都查询一遍就完全够了（毕竟三台中有一台能正常查出结果的概率是相当大的吧，尤其是nameserver都有监控的说）
rotate:这个参数的含义是随机选取一个作为首选查询的dns server。系统缺省是从上到下的，所以你该了解到为什么缺省情况下第一个nameserver的负载比第三个的大多了吧。

作者：haw_haw
链接：https://www.jianshu.com/p/2c1c081cc521
来源：简书
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```