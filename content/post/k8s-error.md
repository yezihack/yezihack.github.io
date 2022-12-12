---
title: "云运维笔记(6) kubernetes 错误大全"
date: 2022-12-07T11:31:00+08:00
lastmod: 2022-12-07T11:31:00+08:00
draft: false
tags: ["异常", "错误", "云运维笔记", "kubernetes", "k8s"]
categories: ["云运维笔记"]
author: "百里"
comment: false
toc: true
reward: true
# 音乐开关，true/false
music: false
# 只支持163的音乐，在生成外链播放器获取ID
music_id: "22748787"
# 是否自动播放 1是，0否
music_auto: 1
# weight: 1
# description: ""
---

## 为什么

Kubernetes 众多组件汇集于一身，插件也是多如牛毛，在运维中或日常安装中难免会遇到各种各样的错误，有些错误并不好排查，让人火急火燎搜索一翻，半天已经过去。在此收集日常使用 kubernetes 遇到的问题。

## Ingress-nginx

### Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io"

#### 详细错误信息

```sh
Error from server (InternalError): error when creating "ingress.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/networking/v1beta1/ingresses?timeout=10s": context deadline exceeded
```

#### 解决方法

删除验证

```sh
# 查看
kubectl get validatingwebhookconfigurations

# 删除
kubectl delete -A ValidatingWebhookConfiguration ingress-nginx-admission
```













## 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
