---
title: "Kubebuilder 入门教程:从零构建 Kubernetes Operator"
date: 2025-12-30T10:05:42+08:00
lastmod: 2025-12-30T10:05:42+08:00
draft: false
tags: ["k8s", "k8s-operator", "kubernetes"]
categories: ["k8s"]
author: "百里"
comment: false
toc: true
reward: true
---

## 什么是 Kubebuilder?

Kubebuilder 是一个用于构建 Kubernetes API 和 Operator 的框架,由 Kubernetes 官方维护。它能帮助你快速开发自定义资源(CRD)和控制器,让你像管理 Pod、Service 一样管理自己的业务资源。

### 为什么需要 Operator?

假设你要在 Kubernetes 上部署一个 Redis 集群:
- 传统方式:手动创建多个 Pod、Service、ConfigMap,手动处理主从切换
- Operator 方式:定义一个 `RedisCluster` 资源,Operator 自动完成一切

## 环境准备

### 前置条件

```bash
# 1. 安装 Go (1.20+)
go version

# 2. 安装 Docker
docker version

# 3. 安装 kubectl
kubectl version --client

# 4. 安装 kind (本地 k8s 集群)
go install sigs.k8s.io/kind@latest

# 5. 安装 Kubebuilder
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/
```

### 创建本地 K8s 集群

```bash
# 创建 kind 集群
kind create cluster --name kubebuilder-demo

# 验证
kubectl cluster-info
```

## 实战项目:构建一个博客应用 Operator

我们将创建一个 `Blog` Operator,用户只需定义博客的配置,Operator 自动创建 Deployment、Service 和 Ingress。

### 第一步:初始化项目

```bash
# 创建项目目录
mkdir blog-operator
cd blog-operator

# 初始化项目
kubebuilder init --domain example.com --repo github.com/yourname/blog-operator

# 目录结构
tree -L 2
# .
# ├── Dockerfile
# ├── Makefile
# ├── PROJECT
# ├── cmd/
# ├── config/
# ├── go.mod
# └── go.sum
```

### 第二步:创建 API

```bash
# 创建 Blog API
kubebuilder create api \
  --group webapp \
  --version v1 \
  --kind Blog \
  --resource \
  --controller

# 选择 y 创建资源和控制器
```

这会生成:
- `api/v1/blog_types.go` - CRD 定义
- `internal/controller/blog_controller.go` - 控制器逻辑

### 第三步:定义 Blog CRD

编辑 `api/v1/blog_types.go`:

```go
package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// BlogSpec 定义博客的期望状态
type BlogSpec struct {
	// 博客标题
	// +kubebuilder:validation:MinLength=1
	Title string `json:"title"`

	// 博客作者
	Author string `json:"author"`

	// 副本数
	// +kubebuilder:validation:Minimum=1
	// +kubebuilder:validation:Maximum=10
	Replicas int32 `json:"replicas"`

	// 镜像
	// +kubebuilder:default="nginx:latest"
	Image string `json:"image,omitempty"`

	// 端口
	// +kubebuilder:default=80
	Port int32 `json:"port,omitempty"`
}

// BlogStatus 定义博客的实际状态
type BlogStatus struct {
	// 可用副本数
	AvailableReplicas int32 `json:"availableReplicas,omitempty"`

	// 状态:Running, Pending, Failed
	Phase string `json:"phase,omitempty"`

	// URL 访问地址
	URL string `json:"url,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Title",type=string,JSONPath=`.spec.title`
// +kubebuilder:printcolumn:name="Replicas",type=integer,JSONPath=`.spec.replicas`
// +kubebuilder:printcolumn:name="Available",type=integer,JSONPath=`.status.availableReplicas`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

type Blog struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   BlogSpec   `json:"spec,omitempty"`
	Status BlogStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

type BlogList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Blog `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Blog{}, &BlogList{})
}
```

### 第四步:实现控制器逻辑

编辑 `internal/controller/blog_controller.go`:

```go
package controller

import (
	"context"
	"fmt"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	webappv1 "github.com/yourname/blog-operator/api/v1"
)

type BlogReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=webapp.example.com,resources=blogs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=webapp.example.com,resources=blogs/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete

func (r *BlogReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	// 1. 获取 Blog 实例
	blog := &webappv1.Blog{}
	if err := r.Get(ctx, req.NamespacedName, blog); err != nil {
		if errors.IsNotFound(err) {
			log.Info("Blog resource not found. Ignoring since object must be deleted")
			return ctrl.Result{}, nil
		}
		log.Error(err, "Failed to get Blog")
		return ctrl.Result{}, err
	}

	// 2. 创建或更新 Deployment
	deployment := r.deploymentForBlog(blog)
	found := &appsv1.Deployment{}
	err := r.Get(ctx, types.NamespacedName{Name: blog.Name, Namespace: blog.Namespace}, found)
	if err != nil && errors.IsNotFound(err) {
		log.Info("Creating a new Deployment", "Deployment.Namespace", deployment.Namespace, "Deployment.Name", deployment.Name)
		if err = r.Create(ctx, deployment); err != nil {
			log.Error(err, "Failed to create new Deployment")
			return ctrl.Result{}, err
		}
	} else if err != nil {
		log.Error(err, "Failed to get Deployment")
		return ctrl.Result{}, err
	} else {
		// 更新 Deployment
		if found.Spec.Replicas != &blog.Spec.Replicas {
			found.Spec.Replicas = &blog.Spec.Replicas
			if err = r.Update(ctx, found); err != nil {
				log.Error(err, "Failed to update Deployment")
				return ctrl.Result{}, err
			}
		}
	}

	// 3. 创建或更新 Service
	service := r.serviceForBlog(blog)
	foundService := &corev1.Service{}
	err = r.Get(ctx, types.NamespacedName{Name: blog.Name, Namespace: blog.Namespace}, foundService)
	if err != nil && errors.IsNotFound(err) {
		log.Info("Creating a new Service", "Service.Namespace", service.Namespace, "Service.Name", service.Name)
		if err = r.Create(ctx, service); err != nil {
			log.Error(err, "Failed to create new Service")
			return ctrl.Result{}, err
		}
	}

	// 4. 更新 Status
	blog.Status.AvailableReplicas = found.Status.AvailableReplicas
	if found.Status.AvailableReplicas == blog.Spec.Replicas {
		blog.Status.Phase = "Running"
	} else {
		blog.Status.Phase = "Pending"
	}
	blog.Status.URL = fmt.Sprintf("http://%s.%s.svc.cluster.local:%d", blog.Name, blog.Namespace, blog.Spec.Port)

	if err := r.Status().Update(ctx, blog); err != nil {
		log.Error(err, "Failed to update Blog status")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

// deploymentForBlog 创建 Deployment
func (r *BlogReconciler) deploymentForBlog(blog *webappv1.Blog) *appsv1.Deployment {
	labels := map[string]string{
		"app":  blog.Name,
		"type": "blog",
	}

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      blog.Name,
			Namespace: blog.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &blog.Spec.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{{
						Name:  "blog",
						Image: blog.Spec.Image,
						Ports: []corev1.ContainerPort{{
							ContainerPort: blog.Spec.Port,
						}},
						Env: []corev1.EnvVar{
							{Name: "BLOG_TITLE", Value: blog.Spec.Title},
							{Name: "BLOG_AUTHOR", Value: blog.Spec.Author},
						},
					}},
				},
			},
		},
	}

	ctrl.SetControllerReference(blog, deployment, r.Scheme)
	return deployment
}

// serviceForBlog 创建 Service
func (r *BlogReconciler) serviceForBlog(blog *webappv1.Blog) *corev1.Service {
	labels := map[string]string{
		"app":  blog.Name,
		"type": "blog",
	}

	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      blog.Name,
			Namespace: blog.Namespace,
			Labels:    labels,
		},
		Spec: corev1.ServiceSpec{
			Selector: labels,
			Ports: []corev1.ServicePort{{
				Port:       blog.Spec.Port,
				TargetPort: intstr.FromInt(int(blog.Spec.Port)),
			}},
			Type: corev1.ServiceTypeClusterIP,
		},
	}

	ctrl.SetControllerReference(blog, service, r.Scheme)
	return service
}

func (r *BlogReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&webappv1.Blog{}).
		Owns(&appsv1.Deployment{}).
		Owns(&corev1.Service{}).
		Complete(r)
}
```

### 第五步:生成 CRD 和部署

```bash
# 1. 生成 CRD manifests
make manifests

# 2. 安装 CRD 到集群
make install

# 3. 验证 CRD
kubectl get crd
# blogs.webapp.example.com

# 4. 查看 CRD 详情
kubectl describe crd blogs.webapp.example.com
```

### 第六步:运行 Operator

```bash
# 本地运行(开发模式)
make run

# 另开一个终端创建 Blog 实例
```

### 第七步:创建 Blog 实例

创建 `config/samples/webapp_v1_blog.yaml`:

```yaml
apiVersion: webapp.example.com/v1
kind: Blog
metadata:
  name: my-tech-blog
  namespace: default
spec:
  title: "Kubernetes 技术博客"
  author: "张三"
  replicas: 3
  image: nginx:alpine
  port: 80
```

应用配置:

```bash
# 创建 Blog
kubectl apply -f config/samples/webapp_v1_blog.yaml

# 查看 Blog
kubectl get blogs
# NAME            TITLE              REPLICAS   AVAILABLE   PHASE     AGE
# my-tech-blog    Kubernetes 技术博客  3          3          Running   30s

# 查看详情
kubectl describe blog my-tech-blog

# 查看自动创建的资源
kubectl get deployments
kubectl get services
kubectl get pods

# 查看 Status
kubectl get blog my-tech-blog -o jsonpath='{.status}' | jq
```

### 第八步:测试功能

```bash
# 1. 扩容博客
kubectl patch blog my-tech-blog -p '{"spec":{"replicas":5}}' --type=merge

# 观察 Pod 变化
kubectl get pods -w

# 2. 更新镜像
kubectl patch blog my-tech-blog -p '{"spec":{"image":"httpd:alpine"}}' --type=merge

# 3. 删除博客(会自动删除关联资源)
kubectl delete blog my-tech-blog

# 验证资源已清理
kubectl get deployments
kubectl get services
```

## 部署到集群

### 构建并推送镜像

```bash
# 构建镜像
make docker-build IMG=yourusername/blog-operator:v1.0.0

# 推送到 Docker Hub
make docker-push IMG=yourusername/blog-operator:v1.0.0

# 部署到集群
make deploy IMG=yourusername/blog-operator:v1.0.0

# 验证
kubectl get pods -n blog-operator-system
```

## Kubebuilder 核心概念

### 1. Controller 工作原理

```
Watch Event → Reconcile Loop → Desired State → Actual State
    ↑                                              ↓
    └──────────────── Compare ────────────────────┘
```

### 2. Reconcile 循环

- **幂等性**:多次调用结果相同
- **最终一致性**:系统最终达到期望状态
- **错误重试**:失败会自动重新入队

### 3. Marker 注释

```go
// RBAC 权限
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list

// 字段验证
// +kubebuilder:validation:Minimum=1
// +kubebuilder:validation:Maximum=10

// 默认值
// +kubebuilder:default=80

// 打印列
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`
```

## 最佳实践

### 1. 错误处理

```go
if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
    if errors.IsNotFound(err) {
        // 资源已删除,不需要处理
        return ctrl.Result{}, nil
    }
    // 其他错误,返回并重试
    return ctrl.Result{}, err
}
```

### 2. 状态更新

```go
// 先更新资源,再更新 Status
if err := r.Update(ctx, obj); err != nil {
    return ctrl.Result{}, err
}

// 使用 Status() 子资源
if err := r.Status().Update(ctx, obj); err != nil {
    return ctrl.Result{}, err
}
```

### 3. Owner Reference

```go
// 设置所有者,实现级联删除
ctrl.SetControllerReference(blog, deployment, r.Scheme)
```

### 4. 避免频繁 Reconcile

```go
// 只在特定字段变化时触发
return ctrl.NewControllerManagedBy(mgr).
    For(&webappv1.Blog{}).
    Owns(&appsv1.Deployment{}).
    WithEventFilter(predicate.GenerationChangedPredicate{}).
    Complete(r)
```

## 进阶功能

### 1. Webhook 验证

```bash
# 创建 Webhook
kubebuilder create webhook \
  --group webapp \
  --version v1 \
  --kind Blog \
  --defaulting \
  --programmatic-validation
```

实现验证逻辑:

```go
func (r *Blog) ValidateCreate() error {
    if r.Spec.Replicas > 10 {
        return fmt.Errorf("replicas cannot exceed 10")
    }
    return nil
}
```

### 2. Finalizer (清理逻辑)

```go
const blogFinalizer = "blog.webapp.example.com/finalizer"

// 添加 Finalizer
if !controllerutil.ContainsFinalizer(blog, blogFinalizer) {
    controllerutil.AddFinalizer(blog, blogFinalizer)
    return ctrl.Result{}, r.Update(ctx, blog)
}

// 资源删除时执行清理
if !blog.DeletionTimestamp.IsZero() {
    if controllerutil.ContainsFinalizer(blog, blogFinalizer) {
        // 执行清理逻辑
        if err := r.cleanupExternalResources(blog); err != nil {
            return ctrl.Result{}, err
        }
        
        // 移除 Finalizer
        controllerutil.RemoveFinalizer(blog, blogFinalizer)
        return ctrl.Result{}, r.Update(ctx, blog)
    }
}
```

### 3. 多版本 API

```bash
# 创建 v2 版本
kubebuilder create api \
  --group webapp \
  --version v2 \
  --kind Blog

# 实现版本转换
# api/v1/blog_conversion.go
```

## 调试技巧

```bash
# 1. 查看 Operator 日志
kubectl logs -n blog-operator-system deployment/blog-operator-controller-manager -f

# 2. 增加日志级别
make run ARGS="--zap-log-level=debug"

# 3. 使用 kubectl debug
kubectl debug pod/my-tech-blog-xxx -it --image=busybox

# 4. 事件查看
kubectl get events --sort-by='.lastTimestamp'
```

## 常见问题

### 1. CRD 更新不生效

```bash
# 重新生成并安装
make manifests
make install
```

### 2. RBAC 权限不足

```bash
# 检查 RBAC marker 注释
# 重新生成 RBAC
make manifests
```

### 3. Reconcile 无限循环

- 检查是否每次都更新了资源
- 使用 `Generation` 判断是否真正变化
- 添加日志排查

## 总结

通过这个教程,你学会了:
- ✅ Kubebuilder 的基本概念和工作原理
- ✅ 创建自定义资源(CRD)
- ✅ 实现控制器逻辑
- ✅ 部署和测试 Operator
- ✅ 最佳实践和调试技巧

## 下一步

- 学习 [Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- 研究 [Controller Runtime](https://github.com/kubernetes-sigs/controller-runtime)
- 参考优秀开源 Operator:[Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- 了解 [OLM (Operator Lifecycle Manager)](https://olm.operatorframework.io/)

## 参考资源

- [Kubebuilder 官方文档](https://book.kubebuilder.io/)
- [Kubernetes API 参考](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Controller Runtime](https://pkg.go.dev/sigs.k8s.io/controller-runtime)

---
