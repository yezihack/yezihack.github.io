---
title: "Systemd 和 Systemctl 完全指南"
date: 2025-09-05T09:51:54+08:00
lastmod: 2025-09-05T09:51:54+08:00
draft: false
tags: ["systemd", "systemctl", "linux", "服务管理", "系统管理"]
categories: ["linux", "系统管理"]
author: "百里"
comment: false
toc: true
reward: true
description: "深入了解 Systemd 和 Systemctl 的使用方法，包括服务管理、自定义服务配置、日志管理和故障排查等内容"
---

Systemd 是现代 Linux 系统的核心组件，负责系统初始化和服务管理。本文将全面介绍 Systemd 和 Systemctl 的使用方法，从基础操作到高级配置。

## Systemd 简介

### 什么是 Systemd

Systemd 是 Linux 系统的初始化系统和服务管理器，它替代了传统的 SysV init 系统。主要特点包括：

- **并行启动**：提高系统启动速度
- **按需启动**：只在需要时启动服务
- **依赖管理**：自动处理服务间的依赖关系
- **统一管理**：提供统一的服务管理接口
- **日志集成**：集成了完整的日志系统

### 核心概念

- **Unit（单元）**：Systemd 管理的基本对象，包括服务、挂载点、设备等
- **Service（服务）**：最常见的 Unit 类型，用于管理后台进程
- **Target（目标）**：类似于传统的运行级别，定义系统状态
- **Socket（套接字）**：用于进程间通信的 Unit

### Unit 类型

| 类型 | 扩展名 | 描述 |
|------|--------|------|
| Service | .service | 系统服务 |
| Target | .target | 多个 Unit 的组合 |
| Socket | .socket | 套接字 |
| Mount | .mount | 挂载点 |
| Timer | .timer | 定时器 |
| Path | .path | 路径监控 |

## Systemctl 基础命令

### 服务控制命令

#### 启动和停止服务

```bash
# 启动服务
systemctl start <service_name>
systemctl start nginx

# 停止服务
systemctl stop <service_name>
systemctl stop nginx

# 重启服务
systemctl restart <service_name>
systemctl restart nginx

# 重新加载配置（不重启服务）
systemctl reload <service_name>
systemctl reload nginx

# 重新加载或重启（如果不支持 reload）
systemctl reload-or-restart <service_name>
```

#### 服务状态查询

```bash
# 查看服务状态
systemctl status <service_name>
systemctl status nginx

# 检查服务是否运行
systemctl is-active <service_name>

# 检查服务是否启用
systemctl is-enabled <service_name>

# 检查服务是否失败
systemctl is-failed <service_name>
```

#### 开机启动管理

```bash
# 设置开机启动
systemctl enable <service_name>
systemctl enable nginx

# 取消开机启动
systemctl disable <service_name>
systemctl disable nginx

# 启用并立即启动
systemctl enable --now <service_name>

# 禁用并立即停止
systemctl disable --now <service_name>

# 屏蔽服务（完全禁用）
systemctl mask <service_name>

# 取消屏蔽
systemctl unmask <service_name>
```

### 系统管理命令

#### 系统状态和信息

```bash
# 查看系统状态
systemctl status

# 列出所有服务
systemctl list-units --type=service

# 列出所有启用的服务
systemctl list-unit-files --type=service --state=enabled

# 列出失败的服务
systemctl --failed

# 查看启动时间
systemd-analyze

# 查看启动时间详情
systemd-analyze blame

# 查看启动链
systemd-analyze critical-chain
```

#### 系统控制

```bash
# 重启系统
systemctl reboot

# 关闭系统
systemctl poweroff

# 挂起系统
systemctl suspend

# 休眠系统
systemctl hibernate

# 进入救援模式
systemctl rescue

# 进入紧急模式
systemctl emergency
```

### 配置管理

```bash
# 重新加载 systemd 配置
systemctl daemon-reload

# 重新执行所有生成器
systemctl daemon-reexec

# 清理失效的符号链接
systemctl reset-failed
```

## 服务状态详解

### 服务状态类型

| 状态 | 描述 |
|------|------|
| active (running) | 服务正在运行 |
| active (exited) | 服务已成功执行并退出 |
| active (waiting) | 服务正在等待事件 |
| inactive (dead) | 服务未运行 |
| activating | 服务正在启动 |
| deactivating | 服务正在停止 |
| failed | 服务启动失败 |

### 启用状态类型

| 状态 | 描述 |
|------|------|
| enabled | 开机启动已启用 |
| disabled | 开机启动已禁用 |
| static | 服务不能被启用，只能被其他服务依赖 |
| masked | 服务被屏蔽，无法启动 |
| indirect | 服务被其他启用的服务间接启用 |

## 自定义服务配置

### 服务文件位置

```bash
# 系统服务目录（优先级高）
/etc/systemd/system/

# 软件包安装的服务目录
/lib/systemd/system/
/usr/lib/systemd/system/

# 用户服务目录
~/.config/systemd/user/
```

### 创建自定义服务

#### 1. 创建服务文件

```bash
# 创建服务文件
sudo vim /etc/systemd/system/myapp.service
```

#### 2. 基本服务配置

```ini
[Unit]
Description=My Application Service
Documentation=https://example.com/docs
After=network.target
Wants=network-online.target
Requires=network.target

[Service]
Type=simple
User=myuser
Group=mygroup
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/myapp --config /opt/myapp/config.conf
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=on-failure
RestartSec=5
TimeoutStartSec=30
TimeoutStopSec=30

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/myapp

# 环境变量
Environment=NODE_ENV=production
EnvironmentFile=/etc/myapp/environment

[Install]
WantedBy=multi-user.target
```

### 配置文件详解

#### [Unit] 段配置

| 参数 | 描述 | 示例 |
|------|------|------|
| Description | 服务描述 | `Description=Redis Server` |
| Documentation | 文档链接 | `Documentation=man:redis-server(1)` |
| After | 在指定服务后启动 | `After=network.target` |
| Before | 在指定服务前启动 | `Before=nginx.service` |
| Wants | 弱依赖关系 | `Wants=network-online.target` |
| Requires | 强依赖关系 | `Requires=network.target` |
| Conflicts | 冲突关系 | `Conflicts=apache2.service` |

#### [Service] 段配置

| 参数 | 描述 | 可选值 |
|------|------|--------|
| Type | 服务类型 | simple, forking, oneshot, notify, idle |
| ExecStart | 启动命令 | 完整的命令路径 |
| ExecReload | 重载命令 | 重载配置的命令 |
| ExecStop | 停止命令 | 停止服务的命令 |
| Restart | 重启策略 | no, always, on-success, on-failure, on-abnormal |
| RestartSec | 重启间隔 | 秒数，如 `5` |
| User | 运行用户 | 用户名 |
| Group | 运行组 | 组名 |
| WorkingDirectory | 工作目录 | 目录路径 |

#### 服务类型说明

- **simple**：默认类型，ExecStart 启动的进程就是主进程
- **forking**：ExecStart 启动的进程会 fork 出子进程，父进程退出
- **oneshot**：类似 simple，但进程退出后服务仍被认为是活跃的
- **notify**：类似 simple，但服务会通过 sd_notify() 发送就绪通知
- **idle**：类似 simple，但会等到其他任务完成后才启动

#### [Install] 段配置

| 参数 | 描述 | 示例 |
|------|------|------|
| WantedBy | 被哪个 target 需要 | `multi-user.target` |
| RequiredBy | 被哪个 target 强制需要 | `graphical.target` |
| Alias | 服务别名 | `redis.service` |

### 实际配置示例

#### Redis 服务配置

```ini
[Unit]
Description=Redis In-Memory Data Store
After=network.target
Documentation=https://redis.io/documentation

[Service]
Type=notify
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecReload=/bin/kill -USR2 $MAINPID
ExecStop=/usr/bin/redis-cli shutdown
TimeoutStartSec=0
Restart=always
User=redis
Group=redis

# 安全设置
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/redis
ReadWritePaths=/var/log/redis

[Install]
WantedBy=multi-user.target
```

#### Node.js 应用服务配置

```ini
[Unit]
Description=Node.js Web Application
After=network.target

[Service]
Type=simple
User=nodejs
Group=nodejs
WorkingDirectory=/opt/webapp
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webapp

# 环境变量
Environment=NODE_ENV=production
Environment=PORT=3000

# 安全设置
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 启用自定义服务

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable myapp.service

# 启动服务
sudo systemctl start myapp.service

# 查看服务状态
sudo systemctl status myapp.service
```

## 日志管理

### Journalctl 基础使用

```bash
# 查看所有日志
journalctl

# 查看特定服务的日志
journalctl -u nginx.service

# 实时查看日志
journalctl -u nginx.service -f

# 查看最近的日志
journalctl -u nginx.service -n 50

# 查看指定时间范围的日志
journalctl -u nginx.service --since "2023-01-01" --until "2023-01-02"

# 查看今天的日志
journalctl -u nginx.service --since today

# 查看昨天的日志
journalctl -u nginx.service --since yesterday

# 查看最近一小时的日志
journalctl -u nginx.service --since "1 hour ago"
```

### 日志过滤和格式

```bash
# 按优先级过滤日志
journalctl -u nginx.service -p err

# 显示详细信息
journalctl -u nginx.service -o verbose

# JSON 格式输出
journalctl -u nginx.service -o json

# 只显示消息内容
journalctl -u nginx.service -o cat

# 反向显示（最新的在前）
journalctl -u nginx.service -r
```

### 日志清理和维护

```bash
# 查看日志占用空间
journalctl --disk-usage

# 清理日志（保留最近7天）
sudo journalctl --vacuum-time=7d

# 清理日志（保留最近100MB）
sudo journalctl --vacuum-size=100M

# 清理日志（保留最近10个文件）
sudo journalctl --vacuum-files=10
```

## 故障排查

### 常见问题诊断

#### 1. 服务启动失败

```bash
# 查看服务状态
systemctl status service_name

# 查看详细错误信息
journalctl -u service_name -n 50

# 检查配置文件语法
systemd-analyze verify /etc/systemd/system/service_name.service
```

#### 2. 服务依赖问题

```bash
# 查看服务依赖关系
systemctl list-dependencies service_name

# 查看反向依赖
systemctl list-dependencies service_name --reverse

# 分析启动链
systemd-analyze critical-chain service_name
```

#### 3. 权限问题

```bash
# 检查文件权限
ls -la /etc/systemd/system/service_name.service

# 检查用户和组
id username

# 检查 SELinux 状态（如果启用）
getenforce
```

### 调试技巧

#### 1. 启用调试模式

```bash
# 临时启用调试
sudo systemctl set-log-level debug

# 恢复正常日志级别
sudo systemctl set-log-level info
```

#### 2. 手动测试服务

```bash
# 手动运行服务命令
sudo -u service_user /path/to/service/command

# 检查配置文件
sudo -u service_user /path/to/service/command --test-config
```

#### 3. 使用 strace 跟踪

```bash
# 跟踪服务启动过程
sudo strace -f -o /tmp/service.trace systemctl start service_name
```

## 高级功能

### 定时器（Timer）

#### 创建定时器服务

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup Service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup daily
Requires=backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

#### 管理定时器

```bash
# 启用定时器
sudo systemctl enable backup.timer
sudo systemctl start backup.timer

# 查看定时器状态
systemctl list-timers

# 查看特定定时器
systemctl status backup.timer
```

### 套接字激活

#### 创建套接字服务

```ini
# /etc/systemd/system/myapp.socket
[Unit]
Description=MyApp Socket

[Socket]
ListenStream=8080
Accept=no

[Install]
WantedBy=sockets.target
```

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=MyApp Service
Requires=myapp.socket

[Service]
Type=simple
ExecStart=/usr/local/bin/myapp
StandardInput=socket
```

### 资源限制

```ini
[Service]
# CPU 限制
CPUQuota=50%

# 内存限制
MemoryLimit=512M

# 文件描述符限制
LimitNOFILE=65536

# 进程数限制
LimitNPROC=4096

# 任务数限制
TasksMax=100
```

## 最佳实践

### 1. 服务配置建议

- 使用非 root 用户运行服务
- 设置适当的工作目录
- 配置合理的重启策略
- 启用安全特性（PrivateTmp、ProtectSystem 等）
- 设置资源限制

### 2. 日志管理建议

- 定期清理日志文件
- 设置合适的日志级别
- 使用结构化日志格式
- 配置日志轮转

### 3. 监控和维护

- 定期检查服务状态
- 监控系统资源使用
- 及时处理失败的服务
- 保持系统和服务更新

### 4. 安全考虑

- 最小权限原则
- 使用专用用户账户
- 启用 systemd 安全特性
- 定期审查服务配置

## 常用命令速查

### 服务管理

```bash
systemctl start/stop/restart/reload service_name
systemctl enable/disable service_name
systemctl status service_name
systemctl is-active/is-enabled service_name
```

### 系统管理

```bash
systemctl list-units --type=service
systemctl --failed
systemctl daemon-reload
systemd-analyze
```

### 日志查看

```bash
journalctl -u service_name
journalctl -u service_name -f
journalctl -u service_name --since today
```

## 总结

Systemd 和 Systemctl 是现代 Linux 系统管理的核心工具。掌握它们的使用方法对于系统管理员和开发人员都非常重要。主要要点：

1. **理解基本概念**：Unit、Service、Target 等
2. **熟练使用命令**：服务控制、状态查询、日志管理
3. **掌握配置编写**：服务文件的结构和参数
4. **学会故障排查**：使用日志和调试工具
5. **遵循最佳实践**：安全、性能、维护等方面

通过系统学习和实践，可以更好地管理 Linux 系统服务，提高系统的稳定性和安全性。

## 参考资料

1. [Systemd 官方文档](https://systemd.io/)
2. [Systemd 入门教程：命令篇](http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)
3. [Systemd 入门教程：实战篇](https://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-part-two.html)
4. [ArchLinux Systemd Wiki](https://wiki.archlinux.org/title/Systemd)
5. [Red Hat Systemd 指南](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/system_administrators_guide/chap-managing_services_with_systemd)