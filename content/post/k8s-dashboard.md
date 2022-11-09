---
title: "第十一章 Kubernetes Dashboard"
date: 2021-10-28T18:18:16+08:00
lastmod: 2021-10-28T18:18:16+08:00
draft: false
tags: ["k8s", "云原生", "kubernetes", "dashboard"]
categories: ["kubernetes"]
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

> 本章节主要介绍 kubernetes 的 Dashboard。
>
> 找不到目录, 传送门：[Kubernetes 总纲及脑图](https://yezihack.github.io/k8s-mindmap.html)

1) 下载yaml，并运行Dashboard

~~~powershell
# 下载yaml
[root@master ~]# wget  https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml

# 修改kubernetes-dashboard的Service类型
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort  # 新增
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30009  # 新增
  selector:
    k8s-app: kubernetes-dashboard

# 部署
[root@master ~]# kubectl create -f recommended.yaml

# 查看namespace下的kubernetes-dashboard下的资源
[root@master ~]# kubectl get pod,svc -n kubernetes-dashboard
NAME                                            READY   STATUS    RESTARTS   AGE
pod/dashboard-metrics-scraper-c79c65bb7-zwfvw   1/1     Running   0          111s
pod/kubernetes-dashboard-56484d4c5-z95z5        1/1     Running   0          111s

NAME                               TYPE       CLUSTER-IP      EXTERNAL-IP  PORT(S)         AGE
service/dashboard-metrics-scraper  ClusterIP  10.96.89.218    <none>       8000/TCP        111s
service/kubernetes-dashboard       NodePort   10.104.178.171  <none>       443:30009/TCP   111s
~~~

2）创建访问账户，获取token

~~~powershell
# 创建账号
[root@master-1 ~]# kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard

# 授权
[root@master-1 ~]# kubectl create clusterrolebinding dashboard-admin-rb --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin

# 获取账号token
[root@master ~]#  kubectl get secrets -n kubernetes-dashboard | grep dashboard-admin
dashboard-admin-token-xbqhh        kubernetes.io/service-account-token   3      2m35s

[root@master ~]# kubectl describe secrets dashboard-admin-token-xbqhh -n kubernetes-dashboard
Name:         dashboard-admin-token-xbqhh
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: dashboard-admin
              kubernetes.io/service-account.uid: 95d84d80-be7a-4d10-a2e0-68f90222d039

Type:  kubernetes.io/service-account-token

Data
====
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6ImJrYkF4bW5XcDhWcmNGUGJtek5NODFuSXl1aWptMmU2M3o4LTY5a2FKS2cifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4teGJxaGgiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiOTVkODRkODAtYmU3YS00ZDEwLWEyZTAtNjhmOTAyMjJkMDM5Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmRhc2hib2FyZC1hZG1pbiJ9.NAl7e8ZfWWdDoPxkqzJzTB46sK9E8iuJYnUI9vnBaY3Jts7T1g1msjsBnbxzQSYgAG--cV0WYxjndzJY_UWCwaGPrQrt_GunxmOK9AUnzURqm55GR2RXIZtjsWVP2EBatsDgHRmuUbQvTFOvdJB4x3nXcYLN2opAaMqg3rnU2rr-A8zCrIuX_eca12wIp_QiuP3SF-tzpdLpsyRfegTJZl6YnSGyaVkC9id-cxZRb307qdCfXPfCHR_2rt5FVfxARgg_C0e3eFHaaYQO7CitxsnIoIXpOFNAR8aUrmopJyODQIPqBWUehb7FhlU1DCduHnIIXVC_UICZ-MKYewBDLw
ca.crt:     1025 bytes
~~~

3）通过浏览器访问Dashboard的UI

在登录页面上输入上面的token

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520144548997.png?imageslim)

出现下面的页面代表成功

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520144959353.png?imageslim)

## 使用DashBoard

本章节以Deployment为例演示DashBoard的使用

**查看**

选择指定的命名空间`dev`，然后点击`Deployments`，查看dev空间下的所有deployment

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520154628679.png?imageslim)

**扩缩容**

在`Deployment`上点击`规模`，然后指定`目标副本数量`，点击确定

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520162605102.png?imageslim)

**编辑**

在`Deployment`上点击`编辑`，然后修改`yaml文件`，点击确定

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520163253644.png?imageslim)

**查看Pod**

点击`Pods`, 查看pods列表

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520163552110.png?imageslim)

**操作Pod**

选中某个Pod，可以对其执行日志（logs）、进入执行（exec）、编辑、删除操作

![](https://cdn.jsdelivr.net/gh/yezihack/assets/b/image-20200520163832827.png?imageslim)

> Dashboard提供了kubectl的绝大部分功能，这里不再一一演示
>
> 找不到目录, 传送门：[Kubernetes 总纲及脑图](https://yezihack.github.io/k8s-mindmap.html)


## 参考

1. 以上笔记来自于黑马视频课程整理.
2. 视频入口：[https://www.bilibili.com/video/BV1cK4y1L7Am](https://www.bilibili.com/video/BV1cK4y1L7Am)

   





## 关于作者
我的博客：https://yezihack.github.io

欢迎关注我的微信公众号【空树之空】，共同学习，一起进步~
![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)