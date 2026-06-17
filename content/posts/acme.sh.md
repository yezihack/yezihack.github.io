---
title: "acme.sh 完整使用指南：从泛域名到单域名证书申请与自动续期"
date: 2026-06-17T10:55:12+08:00
lastmod: 2026-06-17T10:55:12+08:00
draft: false
tags: ["SSL/TLS", "HTTPS", "Let's Encrypt", "acme.sh", "Cloudflare", "nginx", "证书管理"]
categories: ["DevOps", "运维工具"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 快速导航

本文分为两个部分：

- **第一部分**：泛域名证书（`*.example.com`）的完整申请流程，适合需要一张证书覆盖所有子域名的场景
- **第二部分**：单个域名证书的申请方法，对比 DNS-01 和 HTTP-01 两种验证方式的选择指南

**为什么选 acme.sh？** CentOS 7 已 EOL，certbot 依赖繁重，acme.sh 是纯 shell 实现，零依赖、轻量、支持所有主流 DNS 服务商的 API 自动化。

---

## 2. 第一部分：泛域名证书申请与自动续期

### 2.1. 场景说明

适用于这类情况：
- 一个根域名（如 `example.com`）底下有多个子域名（`zipic.example.com`、`api.example.com` 等）
- 不想给每个子域名单独申请一张证书
- 希望一张泛域名证书 `*.example.com` 搞定所有现有和未来的子域名
- 需要证书到期后完全自动续期，不需要人工干预

### 2.2. 第一步：安装 acme.sh

```bash
curl https://get.acme.sh | sh -s email=your@email.com
source ~/.bashrc
acme.sh --set-default-ca --server letsencrypt
```

最后一行很关键——acme.sh 新版本默认 CA 是 ZeroSSL，手动切回 Let's Encrypt，避免后面验证流程对不上。

### 2.3. 第二步：泛域名证书为什么必须用 DNS 验证

泛域名（`*.example.com`）只能用 **DNS-01** 方式验证，无法用 HTTP-01。原因很简单：HTTP-01 验证的是某一个具体子域名指向的服务器上有没有放对应文件，但泛域名涵盖的是无限多个子域名，CA 没法用 HTTP 方式逐一验证，只能让你在 DNS 里加一条 TXT 记录证明你对整个域名拥有控制权。

这也是为什么用 Cloudflare（或其他支持 API 的 DNS 服务商）特别重要：有了 API，加 TXT 记录这个动作可以完全自动化，不需要人工登录控制台操作，这也是后面能自动续期的前提。

### 2.4. 第三步：获取 Cloudflare API 凭证

Cloudflare 现在推荐用 **API Token**（权限可以精确控制到某个域名的 DNS 编辑权限），比老式的 Global API Key 更安全，强烈建议优先用这个。

操作路径：登录 Cloudflare 控制台 → 右上角头像 → **My Profile** → **API Tokens** → **Create Token**，选择 **Edit zone DNS** 模板，Zone Resources 限定到自己的域名，创建后复制保存（只显示一次）。

如果嫌麻烦想用更简单的 Global API Key，也是在同一个 API Tokens 页面往下翻能找到，但权限范围是账号下所有域名，安全性上稍弱一些。

### 2.5. 第四步：申请泛域名证书

用 API Token 的写法：

```bash
export CF_Token="你的API_Token"
export CF_Account_ID="你的Account_ID"

acme.sh --issue --dns dns_cf \
  -d example.com -d '*.example.com'
```

用 Global API Key 的写法：

```bash
export CF_Key="你的Global_API_Key"
export CF_Email="你的Cloudflare登录邮箱"

acme.sh --issue --dns dns_cf \
  -d example.com -d '*.example.com'
```

执行后 acme.sh 会自动调用 Cloudflare API 加一条 `_acme-challenge.example.com` 的 TXT 记录、等待解析、验证、再自动删除记录，全程不需要手动操作。看到 `Cert success` 就说明成功了。

这里有个前提容易被忽略：**域名的 NS（Nameserver）必须已经指向 Cloudflare**，也就是域名要托管在 Cloudflare 上，否则 acme.sh 找不到对应的 zone 会直接报错。如果还没做这一步，先去注册商那边把 DNS 服务器改成 Cloudflare 分配的两个 NS，等解析生效后再继续。

### 2.6. 第五步：把证书安装到固定路径

acme.sh 申请下来的证书放在 `~/.acme.sh/域名_ecc/` 这种隐藏目录里，文件名固定但每次续期内容会变，权限也是 `600`，不建议 nginx 直接引用这个路径。更推荐用 `--install-cert` 命令把证书"导出"到一个固定位置：

```bash
mkdir -p /etc/nginx/ssl

acme.sh --install-cert -d example.com --ecc \
  --key-file       /etc/nginx/ssl/example.com.key \
  --fullchain-file /etc/nginx/ssl/example.com.crt \
  --ca-file        /etc/nginx/ssl/example.com.ca.crt \
  --reloadcmd "systemctl reload nginx"
```

注意 `--ecc` 这个参数：acme.sh 默认申请的是 ECC（椭圆曲线）证书，目录名会带 `_ecc` 后缀，所以这里安装证书时也要加上 `--ecc`，否则会提示找不到对应证书。

执行后会生成三个文件：
- `example.com.key`：私钥
- `example.com.crt`：完整证书链（你的证书 + 中间 CA 证书拼接）
- `example.com.ca.crt`：单独的中间 CA 证书（只有开启 OCSP Stapling 才会用到）

`--reloadcmd` 这一段是关键，它告诉 acme.sh：以后每次自动续期完成后，自动执行 `systemctl reload nginx` 让 nginx 加载新证书，不需要人工干预。

### 2.7. 第六步：自动续期是怎么生效的

acme.sh 安装时会自动写入一条 crontab：

```bash
crontab -l
# 0 0 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```

它每天检查一次所有已申请的证书，剩余有效期低于 30 天（Let's Encrypt 证书有效期固定 90 天）就自动续期。续期时用到的 Cloudflare API 凭证，acme.sh 会自动保存在 `~/.acme.sh/account.conf` 里，不需要每次重新 `export` 环境变量，也不需要登录服务器手动操作。

可以手动测试一下续期流程是否真的能跑通：

```bash
acme.sh --renew -d example.com --ecc --force
```

如果重新走一遍 DNS 验证、显示 `Cert success`、nginx 也被自动 reload，说明整套自动化链路没问题，以后可以完全不管它。

### 2.8. 第七步：nginx 配置

这里有一个很容易被忽略、也是这次踩到的一个坑：**同一个 443 端口被多个 server 块监听时，所有涉及 SSL/HTTP2 协议参数的 listen 行写法必须完全一致**，否则 nginx 会报 `protocol options redefined` 的 warning。这是因为 `ssl`、`http2` 这些参数实际上绑定在监听端口本身，而不是某个具体域名上，如果不同配置文件里这部分写法不统一，nginx 合并配置时就会冲突。

推荐做法是把通用的 SSL 参数抽成一个公共文件，每个域名配置只保留自己独有的部分。

公共配置 `/etc/nginx/conf.d/ssl-common.conf`（注意这个文件本身不要带 `server {}`，要用 `include` 方式引入，否则会被当成独立 server 块加载）：

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
```

主域名 + 所有子域名跳转和首页配置（`/etc/nginx/conf.d/example.com.conf`）：

```nginx
server {
    listen 80;
    server_name example.com *.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name example.com *.example.com;

    include /etc/nginx/conf.d/ssl-common.conf;

    ssl_certificate     /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    root /var/www/example.com;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

某个子域名单独反代到后端服务（`/etc/nginx/conf.d/zipic.example.com.conf`），证书直接复用同一张泛域名证书：

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name zipic.example.com;

    include /etc/nginx/conf.d/ssl-common.conf;

    ssl_certificate     /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8040;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
    }
}
```

需要 OCSP Stapling 的话（轻微提速，可选）加上：

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/nginx/ssl/example.com.ca.crt;
resolver 223.5.5.5 119.29.29.29 valid=300s;
resolver_timeout 5s;
```

`ssl_trusted_certificate` 要指向前面 `--install-cert` 生成的 `.ca.crt` 文件，不要随手抄网上教程里常见的 `/etc/letsencrypt/live/...` 路径——那是 certbot 的证书目录结构，acme.sh 的证书根本不在那个位置，配上去会导致 nginx 启动报错。

修改完成后检查并重载：

```bash
nginx -t
systemctl reload nginx
```

## 3. 最后别忘了开放端口

服务器本机防火墙：

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

如果是云服务器，还要去云厂商控制台的安全组里同步放开 80/443，这一步经常被遗漏，本机防火墙配对了但云端安全组没开，访问依然会超时。

### 3.1. 第一部分总结

整套流程串起来就是：
1. acme.sh 负责证书申请和续期
2. Cloudflare API 负责自动完成 DNS 验证
3. `--install-cert` 把证书固定到一个 nginx 能稳定读取的路径并绑定自动 reload
4. nginx 这边把公共 SSL 参数抽出来复用，避免多 server 块协议参数冲突

一次配置好之后，一张泛域名证书可以覆盖所有现在和将来新增的子域名，到期自动续期、自动重载，基本不用再手动管理证书这件事了。

---

## 4. 第二部分：单个域名证书申请指南

### 4.1. 场景说明

适用于这类情况：
- 需要给某个具体子域名（如 `blog.example.com`）申请证书
- 无法使用泛域名证书（例如泛域名证书已经用于其他主域名）
- 不确定应该用 DNS-01 还是 HTTP-01 验证方式
- 需要根据实际条件选择最合适的申请方法

### 4.2. DNS-01 vs HTTP-01：两条独立的验证路径

acme.sh（或任何 ACME 客户端）申请证书时，CA 都会向你提问："你真的控制着这个域名吗？" 证明方式有两种，互不依赖：

**DNS-01**：要求你在域名的 DNS 记录里加一条指定的 TXT 记录。CA 去查这条记录，查到了就说明你能操作这个域名的 DNS，间接证明你拥有这个域名。这种方式需要域名所在的 DNS 服务商提供 API（比如 Cloudflare、阿里云、DNSPod），否则只能手动加记录。

**HTTP-01**：要求你在这个域名对应的网站上，把一个指定的文件放到 `http://你的域名/.well-known/acme-challenge/` 这个路径下。CA 直接通过 HTTP 访问这个文件，访问到了就证明你控制着这台服务器。这种方式**不需要任何 DNS 账号信息**，只需要域名已经解析到这台机器、且 80 端口能被外网访问到。

最容易搞混的一点是：**泛域名证书必须用 DNS-01**（因为 HTTP-01 没法对无限多个子域名逐一验证），但**单个具体域名两种方式都能用**，选哪个完全看你手头有什么条件——有 DNS API 权限就用 DNS-01，没有但域名已经解析到位就用 HTTP-01，两者没有谁更"正规"的区别，只是适用场景不同。

之前遇到一种情况：要给一个域名申请证书，但这个域名的 DNS 托管账号不在自己手上（比如是另一个团队管理的 Cloudflare 账号），完全没有 API Key。这种时候就不需要纠结怎么搞到 DNS 权限，直接换成 HTTP-01 就行，因为域名已经解析到自己的服务器上了，这个条件本身就足够。

---

### 4.3. 单域名证书申请方法对比

根据你拥有的条件选择合适的方式：

#### 4.3.1. 方式一：有 DNS API 权限 → 用 DNS-01（最省心）

这是最省心的方式，不需要碰任何 nginx 配置，也不依赖网站本身是否在正常运行。

```bash
export CF_Token="你的API_Token"
export CF_Account_ID="你的Account_ID"

acme.sh --issue --dns dns_cf -d sub.example.com --server letsencrypt
```

`--server letsencrypt` 这个参数建议每次都加上，因为 acme.sh 新版本默认 CA 是 ZeroSSL，不显式指定的话申请下来的证书 CA 可能不是你以为的 Let's Encrypt（虽然对使用没有实质影响，但容易让人困惑日志里突然冒出个陌生的 CA 名字）。

如果用的是 Global API Key 而不是 API Token：

```bash
export CF_Key="你的Global_API_Key"
export CF_Email="你的Cloudflare登录邮箱"

acme.sh --issue --dns dns_cf -d sub.example.com --server letsencrypt
```

其他 DNS 服务商（阿里云、DNSPod 等）只是环境变量名和 `--dns` 后面的参数不同，原理完全一样。

#### 4.3.2. 方式二：没有 DNS API → 用 HTTP-01（需要 nginx 配置）

无法访问 DNS API 时，换成 HTTP-01 验证。根据网站配置类型分为三种子方式：

##### 4.3.2.1. ① 自动模式：nginx 配置自动扫描（推荐）

acme.sh 自带的 `--nginx` 模式会自动扫描你现有的 nginx 配置、找到对应域名、临时插入验证规则、验证完成后自动清理干净，全程不需要手动改配置文件：

```bash
acme.sh --issue -d sub.example.com --nginx --server letsencrypt
```

如果自动检测失败，可以显式指定配置文件路径：

```bash
acme.sh --issue -d sub.example.com \
  --nginx /path/to/your/nginx/conf/sub.example.com.conf \
  --server letsencrypt
```

##### 4.3.2.2. ② 半自动模式：webroot 指定本地目录

需要这个域名对应的 80 端口配置里，有一个能写文件的本地目录。如果是纯反代型站点（没有静态文件目录的那种），随便建一个空目录充当验证用途即可：

```bash
mkdir -p /www/wwwroot/sub.example.com
```

在对应的 nginx 配置里加一条规则，**必须放在反代规则之前**（这一点很关键，下面单独说原因）：

```nginx
location ~ /\.well-known/acme-challenge/ {
    root /www/wwwroot/sub.example.com;
}
```

重载 nginx 后执行：

```bash
acme.sh --issue -d sub.example.com -w /www/wwwroot/sub.example.com --server letsencrypt
```

##### 4.3.2.3. ③ 最后手段：standalone 模式（需要停 nginx）

acme.sh 自己起一个临时 80 端口服务来响应验证请求，这意味着**必须先停掉现有 nginx**，期间这台机器上所有走 80 端口的站点都会短暂不可访问：

```bash
nginx -s stop
acme.sh --issue -d sub.example.com --standalone --server letsencrypt
nginx
```

如果这台机器只跑一个站点、或者可以接受几秒到几十秒的中断，standalone 是最简单粗暴的方式；如果机器上还有其他重要站点同时在跑，优先用 nginx 模式或 webroot 模式，避免影响别的服务。

---

### 4.4. 常见问题与陷阱

#### 4.4.1. ⚠️ 陷阱一：nginx location 规则的匹配顺序

如果你的站点是反代型配置（典型写法是 `location ^~ / { proxy_pass http://127.0.0.1:端口; }`），验证文件请求的路径 `/.well-known/acme-challenge/xxx` 也会匹配 `/` 这条规则。nginx 在多条 location 都能匹配同一个请求时，会按照特定的优先级规则去选——不是简单的"谁写在前面谁生效"，而是精确匹配 > 最长前缀匹配（`^~`）> 正则匹配（`~`/`~*`）> 普通前缀匹配，这套优先级有固定顺序，跟你在文件里物理上把哪一段写在前面没关系。

但实际操作中，把验证规则放在反代规则前面仍然是稳妥的习惯——因为不同 nginx 版本、不同写法组合下行为细节可能有差异，提前放好可以减少踩坑概率，并且配置可读性也更好（一眼能看出验证规则的存在和用途）。如果验证规则放对了位置但请求还是被转发到了后端，去查一下后端服务（比如反代到的 8010 端口程序）是不是返回了非 200 状态码，CA 看到的不是预期内容也会判定验证失败。

#### 4.4.2. ⚠️ 陷阱二：证书路径和权限问题

不管走哪种验证方式，acme.sh 申请下来的证书都会放在 `~/.acme.sh/域名_ecc/` 这种目录里，**不建议 nginx 直接引用这里的文件**——文件名虽然固定，但每次续期内容会变，权限也是 `600`，不如统一用 `--install-cert` 命令导出到一个固定路径：

```bash
mkdir -p /etc/nginx/ssl

acme.sh --install-cert -d sub.example.com --ecc \
  --key-file       /etc/nginx/ssl/sub.example.com.key \
  --fullchain-file /etc/nginx/ssl/sub.example.com.crt \
  --reloadcmd "nginx -s reload"
```

注意几个细节：申请时如果用的是默认 ECC 算法（acme.sh 不显式指定的话默认就是），安装证书时也要带上 `--ecc`，否则 acme.sh 会提示找不到对应证书。`--reloadcmd` 这一行要换成这台机器实际能用的重载命令——用了宝塔面板的机器，nginx 往往是编译安装的，不一定走 systemd 管理，`systemctl reload nginx` 可能直接报错找不到服务，得用 `nginx -s reload` 或宝塔 nginx 的实际安装路径，比如 `/www/server/nginx/sbin/nginx -s reload`。

这个 `--reloadcmd` 配置好之后，以后每次自动续期完成，acme.sh 都会自动执行这条命令重载 nginx，证书更新和服务生效全程不需要人工介入。

#### 4.4.3. ⚠️ 陷阱三：证书和域名必须对应

这是最容易被忽略、但后果最直观的一个问题——如果 nginx 某个 server 块的 `server_name` 是域名 A，但 `ssl_certificate` 配置的却是域名 B 的证书，浏览器访问时会在 TLS 握手阶段直接报 `NET::ERR_CERT_COMMON_NAME_INVALID`，连不上网站，而且**这个时候 nginx 配置里写的任何业务逻辑（包括 301 跳转）都不会执行**，因为握手都没通过，请求根本到不了应用层。

典型的踩坑场景：把一个旧域名的 nginx 配置改成跳转到新域名，图省事直接复用了新域名的证书文件，结果旧域名访问 HTTPS 直接报证书错误。正确做法是：这个 server 块的 `server_name` 是谁，证书就必须是谁的，跳转逻辑（`return 301 ...`）只能在证书校验通过、TLS 握手成功之后才会被执行。如果旧域名暂时没有自己的证书，要么单独给它申请一张（用上面任意一种方式都行），要么干脆只配 80 端口的跳转、不开 443，二者选一个，但不能用别的域名的证书来"顶替"。

---

### 4.5. 完整总结

#### 4.5.1. 泛域名证书（第一部分）

适合一个根域名加多个子域名的场景。核心流程：DNS API 凭证 → acme.sh 申请 → --install-cert 安装 → 绑定 reload 命令 → 自动续期。一次配置，永久有效。

#### 4.5.2. 单域名证书（第二部分）

根据条件灵活选择：
- **有 DNS API** → DNS-01，最省心
- **无 DNS API** → HTTP-01，根据网站类型选择 nginx 模式 / webroot 模式 / standalone 模式

申请完成后同样用 `--install-cert` 导出证书、配好 reload 命令，核心思路与泛域名完全一致。

#### 4.5.3. 通用注意事项

1. 证书和 server_name 必须对应
2. location 规则位置很重要，验证规则要优先级更高
3. 证书绝对不要直接用隐藏目录里的文件，一定要导出到固定路径
4. 续期命令 `--reloadcmd` 一定要适配你的系统（systemctl vs nginx -s reload）

---
