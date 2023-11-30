---
title: "Helm Chart 模板"
date: 2023-11-29T18:44:17+08:00
lastmod: 2023-11-29T18:44:17+08:00
draft: false
tags: ["helm", "chart","云原生"]
categories: ["云原生"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 介绍

Chart 模板才是 Helm 的灵魂所在,学会模板才算入门 Helm,让我们一起学习吧.

## 2. 模板语法

模板命令要括在 {{ 和 }} 之间。

如:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  myvalue: "Hello World"
```

## 3. 内置对象

系统自带一些内置对象,可以在模板里使用.

Release： Release对象描述了版本发布本身。包含了以下对象：

- Release.Name： release名称
- Release.Namespace： 版本中包含的命名空间(如果manifest没有覆盖的话)
- Release.IsUpgrade： 如果当前操作是升级或回滚的话，该值将被设置为true
- Release.IsInstall： 如果当前操作是安装的话，该值将被设置为true
- Release.Revision： 此次修订的版本号。安装时是1，每次升级或回滚都会自增
- Release.Service： 该service用来渲染当前模板。Helm里始终Helm

Values： Values对象是从values.yaml文件和用户提供的文件传进模板的。默认为空

Chart： Chart.yaml文件内容。 Chart.yaml里的所有数据在这里都可以可访问的。比如 {{ .Chart.Name }}-{{ .Chart.Version }} 会打印出 mychart-0.1.0

Files： 在chart中提供访问所有的非特殊文件的对象。你不能使用它访问Template对象，只能访问其他文件。 请查看这个 文件访问部分了解更多信息

- Files.Get 通过文件名获取文件的方法。 （.Files.Getconfig.ini）
- Files.GetBytes 用字节数组代替字符串获取文件内容的方法。 对图片之类的文件很有用
- Files.Glob 用给定的shell glob模式匹配文件名返回文件列表的方法
- Files.Lines 逐行读取文件内容的方法。迭代文件中每一行时很有用
- Files.AsSecrets 使用Base 64编码字符串返回文件体的方法
- Files.AsConfig 使用YAML格式返回文件体的方法

Template： 包含当前被执行的当前模板信息

- Template.Name: 当前模板的命名空间文件路径 (e.g. mychart/templates/mytemplate.yaml)
- Template.BasePath: 当前chart模板目录的路径 (e.g. mychart/templates)

## 4. Values 文件

- chart中的values.yaml文件
- 如果是子chart，就是父chart中的values.yaml文件
- 使用-f参数(helm install -f myvals.yaml ./mychart)传递到 helm install 或 helm upgrade的values文件
- 使用--set (比如helm install --set foo=bar ./mychart)传递的单个参数

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  myvalue: "Hello World"
  drink: {{ .Values.favoriteDrink }}
```

## 5. 函数

| 函数名 | 作用 | 用法
| --- | --- | ---
| quote | 添加引号
| repeat | 重复 | repeat 5
| upper | 大写
| lower | 小写
| default | 默认值| default "xxx"
| lookup | 获取资源的对象

```yaml
# 普通
food: {{ quote .Values.favorite.food }}

# 使用管道符
food: {{  .Values.favorite.food | quote}}
```

lookup 函数

```sh
# kubectl get pod mypod -n mynamespace
lookup "v1" "Pod" "mynamespace" "mypod"

# kubectl get pods -n mynamespace
lookup "v1" "Pod" "mynamespace" ""

# kubectl get pods --all-namespaces
lookup "v1" "Pod" "" ""

# kubectl get namespace mynamespace
lookup "v1" "Namespace" "" "mynamespace"

# kubectl get namespaces
lookup "v1" "Namespace" "" ""
```

```yaml
# 返回mynamespace对象的annotations属性：
(lookup "v1" "Namespace" "" "mynamespace").metadata.annotations

{{ range $index, $service := (lookup "v1" "Service" "mynamespace" "").items }}
    {{/* do something with each service */}}
{{ end }}
```

**运算符也是函数**

运算符(eq, ne, lt, gt, and, or等等)

```yaml

```

## 6. 流控制

- if/else， 用来创建条件语句
- with， 用来指定范围
- range， 提供"for each"类型的循环
- define 在模板中声明一个新的命名模板
- template 导入一个命名模板
- block 声明一种特殊的可填充的模板块

```yaml
{{ if PIPELINE }}
  # Do something
{{ else if OTHER PIPELINE }}
  # Do something else
{{ else }}
  # Default case
{{ end }}
```

去掉空格

- {{- (包括添加的横杠和空格)表示向左删除空白， 而 -}}表示右边的空格应该被去掉

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  myvalue: "Hello World"
  drink: {{ .Values.favorite.drink | default "tea" | quote }}
  food: {{ .Values.favorite.food | upper | quote }}
  {{- if eq .Values.favorite.drink "coffee" }}
  mug: "true"
  {{- end }}
```

预留空格使用: indent 函数

```yaml
annotations:
{{- with .Values.podAnnotations }}
{{- toYaml . | nindent 8 }}
{{- end }}
```

with

```yaml
{{- with .Values.favorite }}
drink: {{ .drink | default "tea" | quote }}
food: {{ .food | upper | quote }}
release: {{ $.Release.Name }}
{{- end }}
```

range

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-configmap
data:
  myvalue: "Hello World"
  {{- with .Values.favorite }}
  drink: {{ .drink | default "tea" | quote }}
  food: {{ .food | upper | quote }}
  {{- end }}
  toppings: |-
    {{- range .Values.pizzaToppings }}
    - {{ . | title | quote }}
    {{- end }}   
  sizes: |-
    {{- range tuple "small" "medium" "large" }}
    - {{ . }}
    {{- end }}  
```

## 7. 常见用法

### 7.1. 常量

```yaml
namespace: {{ .Release.Namespace | quote }}

name: {{ printf "%s-config" (include "redis.fullname" .) }}
```

### 7.2. IF/ELSE

- 注意`{{- }}`只使用一个 `-`
- `-` 代表消除空格的

values.yaml

```yaml
persistence:
  enable: false    
  storageClass: "" 
```

```yaml
apiVersion: apps/v1
{{- if and .Values.persistence.enable .Values.persistence.storageClass }}
kind: StatefulSet
{{- else }}
kind: Deployment
{{- end }}
...
```

### 7.3. with

values.yaml

```yaml
# 备注,支持多行备注
annotations: 
  desc: "备注" 
  title: "备注2"
```

```yaml
{{- with .Values.annotations }}
annotations:
{{- toYaml . | nindent 4  }}
{{- end }}
```

### 7.4. dict

- dict 相当于字典, key/value 模式.

```yaml
{{/*
获取 secret 设置的密码
*/}}
{{- define "getValueFromSecret" }}
    {{- $obj := (lookup "v1" "Secret" .Namespace .Name).data -}}
    {{- if $obj }}
        {{- index $obj .Key | b64dec -}}
    {{- end -}}
{{- end }}
```

使用

```yaml
{{- include "getValueFromSecret" (dict "Namespace" .Release.Namespace "Name" (include "redis.secretName" .) "Key" "password"  -}}
```

## 8. 实例模板

## 9. 名称

```yaml
{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "redis.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}
```

### 9.1. 生成随机密码

```yaml
{{/*
如果未设置则生成随机密码，默认长度为：16
*/}}
{{- define "get.password" }}
    {{- $len := (default 16 .Values.db.password_length ) | int -}}
    {{- if empty .Values.db.password -}}
        {{- randAlphaNum $len -}}
    {{- else -}}
        {{- .Values.db.password -}}
    {{- end -}}    
{{- end }}
```
