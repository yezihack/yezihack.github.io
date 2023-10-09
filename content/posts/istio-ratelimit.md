---
title: "Istio 限流实现"
date: 2023-06-12T15:29:48+08:00
lastmod: 2023-06-12T15:29:48+08:00
draft: false
tags: ["istio", "k8s", "云原生","限流"]
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

## 1. 介绍限流

限流是一种通过对系统请求进行限制和控制，避免系统过载，保证系统稳定性和安全性的技术手段。

## 2. Istio 限流

- 首先确认需要限流的应用是否已经加载了 sidecar，如果还未安装 istio, 请参考:<https://yezihack.github.io/istio-install.html>

创建 app-ratelimit.yaml：

- 设置流速间隔时间：`token_bucket.fill_interval`
- 设置流速令牌数量：`token_bucket.max_tokens`
- 选择哪些应用限流：`workloadSelector.labels`

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: app-ratelimit
spec:  
  workloadSelector:
    labels:
      app: my-app # 用来选择需要进行配置的工作负载
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/udpa.type.v1.TypedStruct
            type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
            value:
              stat_prefix: http_local_rate_limiter
              token_bucket: # 令牌桶算法的配置信息，用于控制每秒放行的请求数量。
                max_tokens: 10 # 指定令牌桶中最多可以存储的令牌数，即最大可用令牌数
                tokens_per_fill: 10 # 指定每次填充令牌桶的令牌数，即每次可用令牌数。
                fill_interval: 60s # 定填充令牌桶的时间间隔，即每隔多长时间填充一次令牌桶。
              filter_enabled: # 控制是否启用该过滤器的开关。
                runtime_key: local_rate_limit_enabled
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              filter_enforced: # 制是否强制执行该过滤器的开关。
                runtime_key: local_rate_limit_enforced
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              response_headers_to_add: 
                - append: false
                  header:
                    key: x-local-rate-limit
                    value: 'true'
```

```sh
kubectl apply -f app-ratelimit.yaml
```

## 3. 测试限流是否生效

```sh
url="http://<service ip>:80"
cat > istio-test.sh <<EOF
for i in {1..20};do
    echo "第${i}次请求"
    curl -I "${url}"; echo ""
done
EOF

# 当请求第11个时，HttpCode=429 状态，显示 Too Many Requests

第11次请求
HTTP/1.1 429 Too Many Requests
Date: Mon, 12 Jun 2023 07:58:35 GMT
Content-Type: text/plain
Content-Length: 18
Connection: keep-alive
x-local-rate-limit: true
x-envoy-decorator-operation: my-app.default.svc.cluster.local:80/*
```










## 4. 关于作者

我的博客：<https://yezihack.github.io>

欢迎关注我的微信公众号【空树之空】，一日不学则面目可憎也，吾学也。

![空树之空](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20210122112114.png?imageslim)
