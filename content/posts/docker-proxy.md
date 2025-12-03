---
title: "Docker Daemon 配置代理完整指南"
date: 2025-11-28T19:29:51+08:00
lastmod: 2025-11-28T19:29:51+08:00
draft: false
tags: ["docker", "proxy", "tool"]
categories: ["docker"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 问题背景

当 Docker daemon 需要访问外网资源（如 Docker Hub）时，但本地只能通过代理访问，直接运行 `docker login` 或 `docker pull` 会出现连接超时错误。这是因为设置在 shell 中的代理环境变量对 Docker daemon 服务无效。

```txt
Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
```

## 2. 解决方案

### 2.1. 第一步：创建 Docker daemon 配置目录

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
```

### 2.2. 第二步：编辑代理配置文件

```bash
sudo vim /etc/systemd/system/docker.service.d/http-proxy.conf
```

在文件中添加以下内容：

```ini
[Service]
Environment="HTTP_PROXY=http://PROXY_HOST:PROXY_PORT"
Environment="HTTPS_PROXY=http://PROXY_HOST:PROXY_PORT"
Environment="NO_PROXY=localhost,127.0.0.1"
```

**参数说明：**

- `HTTP_PROXY` - HTTP 连接代理地址
- `HTTPS_PROXY` - HTTPS 连接代理地址
- `NO_PROXY` - 不经过代理的地址列表（本地地址无需代理）

### 2.3. 第三步：重新加载并重启 Docker 服务

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 重启 Docker 服务
sudo systemctl restart docker
```

### 2.4. 第四步：验证代理配置

查看 Docker daemon 是否正确读取了代理环境变量：

```bash
sudo systemctl show --property=Environment docker
```

输出应该包含你配置的代理信息。

## 3. 测试代理连接

### 3.1. 测试代理本身是否可用

```bash
curl -x http://PROXY_HOST:PROXY_PORT https://registry-1.docker.io/v2/
```

### 3.2. 测试到代理服务器的网络连接

```bash
telnet PROXY_HOST PROXY_PORT
```

## 4. 实际使用

配置完成后，可以正常进行 Docker 操作：

```bash
# 登录 Docker Hub
docker login --username your-username

# 拉取镜像
docker pull ubuntu:latest

# 构建镜像
docker build -t myimage:latest .

# 推送镜像
docker push myimage:latest
```

## 5. 高级配置：代理需要认证

如果代理服务器需要用户名和密码认证，修改配置文件为：

```ini
[Service]
Environment="HTTP_PROXY=http://username:password@PROXY_HOST:PROXY_PORT"
Environment="HTTPS_PROXY=http://username:password@PROXY_HOST:PROXY_PORT"
Environment="NO_PROXY=localhost,127.0.0.1"
```

## 6. 排查步骤

如果配置后仍然无法连接，按以下步骤排查：

1. **检查 Docker 服务状态**
   ```bash
   sudo systemctl status docker
   ```

2. **查看 Docker daemon 日志**
   ```bash
   sudo journalctl -u docker -n 50 -f
   ```

3. **验证代理服务器可达性**
   ```bash
   ping PROXY_HOST
   telnet PROXY_HOST PROXY_PORT
   ```

4. **测试代理功能**
   ```bash
   curl -x http://PROXY_HOST:PROXY_PORT https://www.google.com
   ```

5. **确认防火墙规则**
   - 确保本地能访问代理服务器的指定端口
   - 确保代理服务器允许访问目标服务

## 7. 取消代理配置

如果需要移除代理配置：

```bash
sudo rm /etc/systemd/system/docker.service.d/http-proxy.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 8. 总结

通过在 systemd 配置中为 Docker daemon 设置代理环境变量，可以让 Docker 服务正确地通过代理访问外网资源。这个方案适用于公司网络环境或需要经过代理才能访问互联网的场景。
