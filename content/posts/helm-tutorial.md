---
title: "Helm 入门学习"
date: 2023-11-29T16:23:40+08:00
lastmod: 2023-11-29T16:23:40+08:00
draft: false
tags: ["helm", "chart","云原生"]
categories: ["云原生"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 什么是 Helm

Helm是一个Kubernetes的包管理工具，它可以帮助我们简化Kubernetes应用程序的部署和管理。使用Helm，可以将Kubernetes应用程序打包成易于安装、升级和卸载的chart包，并且可以在不同的Kubernetes环境中重复使用这些chart包。

## 2. Helm 三个概念

1. Chart
   1. 代表着 Helm 包，即模板代码的集合
2. Repository
   1. 用来存放和共享 charts 的地方
3. Release
   1. 运行在 Kubernetes 集群中的 chart 的实例

## 3. 安装 Helm

- 官方地址: <https://github.com/helm/helm/releases>

```sh
# linux amd64
wget https://get.helm.sh/helm-v3.13.0-linux-amd64.tar.gz

tar -zxvf helm-v3.13.0-linux-amd64.tar.gz

cd linux-amd64

cp helm /usr/local/sbin
```

## 4. 快速入门

### 4.1. 添加 Repository 仓库

- <https://artifacthub.io/>

```sh
# 添加 Helm Char 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 查看添加的仓库列表
helm repo ls

# 更新 charts 列表
helm repo update
```

### 4.2. 搜索 Chart

```sh
# 搜索 charts 列表
helm search repo bitnami

# 搜索指定的 charts 包名，如 nginx
helm search repo nginx
```

### 4.3. 获取 Chart 包 Values.yaml

```sh
helm show values bitnami/mysql
# 写入文件
helm show values bitnami/mysql >  values.yaml
```

### 4.4. 安装 Chart

```sh
# 安装 mysql(随机名称)
helm install bitnami/mysql --generate-name

# 安装 mysql(指定名称)
helm install happly-mysql bitnami/mysql

# 指定自定义的 values.yaml
helm install happly-mysql bitnami/mysql -f values.yaml
```

### 4.5. 查看 Release 状态

```sh
# 查看已经安装的 charts 列表
helm list / helm ls 

# 查看状态
helm status happly-mysql

# 查看 Release 所有文件
helm get all happly-mysql
```

### 4.6. 升级 Release

```sh
helm upgrade happly-mysql bitnami/mysql

# 一条命令安装或升级版本
helm upgrade --install <release name> --values <values file> <chart directory>
```

### 4.7. 回滚 Chart

```sh
# 查看历史版本
helm history happly-mysql
# 回滚指定版本号
helm rollback happly-mysql 1
```

### 4.8. 卸载&恢复 Chart

```sh
# 以下两种命令都是卸载
helm uninstall happly-mysql
helm delete happly-mysql

# 卸载,但是保留版本
helm uninstall --keep-history happly-mysql

# 查看
helm list --uninstalled
helm history 

# 恢复
helm rollback happly-mysql 1
```

## 5. 进阶 Chart

### 5.1. 目录结构

```sh
wordpress/
  Chart.yaml          # 包含了chart信息的YAML文件
  LICENSE             # 可选: 包含chart许可证的纯文本文件
  README.md           # 可选: 可读的README文件
  values.yaml         # chart 默认的配置值
  values.schema.json  # 可选: 一个使用JSON结构的values.yaml文件
  charts/             # 包含chart依赖的其他chart
  crds/               # 自定义资源的定义
  templates/          # 模板目录， 当和values 结合时，可生成有效的Kubernetes manifest文件
  templates/NOTES.txt # 可选: 包含简要使用说明的纯文本文件
```

### 5.2. 创建 Chart

```sh
# 创建自已的 chart,会生成一个文件夹
helm create my-chart
```

### 5.3. 打包 Chart

- 自动生成 *.tgz 文件,带版本号.
- 版本号来自于:Chart.yaml 文件里的 `version: "1.0.0"`

```sh
helm package my-chart
```

### 5.4. 下载 Chart

```sh
# 下载一个 tgz 文件
helm pull bitnami/redis 

# 下载一个 redis 文件夹
helm pull bitnami/redis --untar=true

# 下载指定版本 chart 包
helm pull bitnami/redis --version 18.3.0
```

## 6. 参考资料

- <https://helm.sh/>
- <https://artifacthub.io/>
