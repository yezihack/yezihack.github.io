---
title: "Certbot 入门使用"
date: 2026-05-12T19:00:46+08:00
lastmod: 2026-05-12T19:00:46+08:00
draft: false
tags: ["nginx", "certbot", "ssl"]
categories: ["nginx"]
author: "百里"
comment: false
toc: true
reward: true
---

## 介绍

Certbot 是一个免费、开源的自动化工具，用于获取和管理 SSL/TLS 证书。它可以帮助你轻松地获取 Let's Encrypt 证书，并将其配置到你的 Web 服务器上，如 Nginx、Apache 等。

## 安装

在 Ubuntu 上，你可以使用以下命令安装 Certbot：

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

## 使用

### 获取证书

使用以下命令获取证书（以7778880.xyz 域名为例）：

```bash
#  同时加 7778880.xyz 是因为泛域名不覆盖根域名。
> # certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "*.7778880.xyz" \
  -d "7778880.xyz"
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for *.7778880.xyz and 7778880.xyz

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name: # 提示添加域名 txt 的解析记录

_acme-challenge.7778880.xyz. # 这里是域名

with the following value:

hvRTajXOAsA9WxL5y642An5UFP9lU9hS7alnK9wcaNw # 这里是对应的值

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can
check if it has finished deploying with aid of online tools, such as the Google
Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.7778880.xyz.
Look for one or more bolded line(s) below the line ';ANSWER'. It should show the
value(s) you've just added.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue # 解析完后再回车

# 验证是否添加成功：
dig TXT _acme-challenge.7778880.xyz +short
```

回车后，Certbot 将会验证你的 DNS TXT 记录是否已经部署成功。如果验证成功，Certbot 将会生成证书并保存到 `/etc/letsencrypt/live/7778880.xyz/` 目录下。

```txt
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/7778880.xyz/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/7778880.xyz/privkey.pem
This certificate expires on 2026-08-10.
These files will be updated when the certificate renews.

NEXT STEPS:
- This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

生成的证书目录如下：

```txt
-> # tree 7778880.xyz 
7778880.xyz
├── cert.pem -> ../../archive/7778880.xyz/cert1.pem
├── chain.pem -> ../../archive/7778880.xyz/chain1.pem
├── fullchain.pem -> ../../archive/7778880.xyz/fullchain1.pem
├── privkey.pem -> ../../archive/7778880.xyz/privkey1.pem
└── README
```
