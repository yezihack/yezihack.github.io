---
title: "Helm 常用命令"
date: 2023-11-29T18:44:25+08:00
lastmod: 2023-11-29T18:44:25+08:00
draft: false
tags: ["helm", "chart","云原生"]
categories: ["云原生"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 查看 Release

```sh
# 查看当前 Default 命名空间下的 Release
helm ls 

# 查看所有命名空间下的 Release
helm ls -A 

# 查看指定命名空间下的 Release
helm ls -n <namespace>
```

## 2. 部署

```sh
helm install <release-name> <helm-Repository> -f values.yaml

helm install <release-name> <helm-Repository> --set name=xxx -f values.yaml
```

## 3. 仓库

```sh
helm - 针对Kubernetes的Helm包管理器
helm repo add - 添加chart仓库
helm repo index - 基于包含打包chart的目录，生成索引文件
helm repo list - 列举chart仓库
helm repo remove - 删除一个或多个仓库
helm repo update - 从chart仓库中更新本地可用chart的信息
```

## 4. 升级&卸载&回滚

```sh
# 升级
helm upgrade -f myvalues.yaml -f override.yaml redis ./redis

# 卸载
helm uninstall RELEASE_NAME [...] [flags]

# 回滚,1 表示版本号
helm history RELEASE_NAME

helm rollback <RELEASE> [REVISION] [flags]

helm rollback RELEASE_NAME 1
```

## 5. Chart

```sh
# Helm 展示chart
helm show chart bitnami/mysql

# 显示 readme
helm show readme bitnami/mysql

# 显示 crd
helm show crd bitnami/mysql

# 显示 values
helm show values bitnami/mysql

# 显示所有
helm show all bitnami/mysql

# 创建 chart
helm create my-release

```

## 6. 调试

```sh
# 本地渲染模板并显示输出,有错误的YAML也可以显示出来,方便调试
helm template [NAME]

# 查看渲染什么，有错误也会输入
helm install foo ./mychart --debug --dry-run --disable-openapi-validation

# 有错误会报错
helm install foo ./mychart --debug --dry-run

```

## 7. 登陆

```sh
helm registry login -u myuser localhost:5000

helm registry logout localhost:5000

helm push mychart-0.1.0.tgz oci://localhost:5000/helm-charts

helm pull oci://localhost:5000/helm-charts/mychart --version 0.1.0
```

## 8. 参考

- <https://helm.sh/zh/docs/helm/helm/>
