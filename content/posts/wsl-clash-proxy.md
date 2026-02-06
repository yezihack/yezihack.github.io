---
title: "WSL2 使用 Windows Clash 代理完整解决方案"
date: 2026-02-06T12:09:58+08:00
lastmod: 2026-02-06T12:09:58+08:00
draft: false
tags: ["wsl", "clash", "linux"]
categories: ["windows"]
author: "百里"
comment: false
toc: true
reward: true
---

## 问题背景

在 Windows 10/11 上使用 WSL2（Windows Subsystem for Linux）时，经常需要让 WSL 中的 Linux 系统使用 Windows 上运行的 Clash 代理。然而，由于 WSL2 采用虚拟化网络架构，直接配置代理往往会遇到连接问题。

本文将详细介绍如何解决这个问题，适用于 WSL2 + Clash/Clash Verge 的场景。

## 环境信息

- **Windows 系统**：Windows 10 Build 19044（或更高版本）
- **WSL 版本**：WSL2
- **Linux 发行版**：CentOS 7（其他发行版类似）
- **代理工具**：Clash Verge（或 Clash for Windows）
- **代理端口**：7890（根据实际情况调整）

## 问题分析

### WSL2 网络架构

WSL2 使用虚拟化技术，拥有独立的网络栈：

- **Windows 物理网卡 IP**：例如 `192.168.1.100`
- **WSL2 内部 IP**：例如 `172.26.207.145`（每次重启可能变化）
- **WSL2 网关 IP**：例如 `172.26.192.1`（WSL 访问 Windows 的入口）

关键问题：**WSL2 无法直接访问 Windows 的物理网卡 IP，也无法通过 localhost（127.0.0.1）访问 Windows 服务**。

### 常见错误

```bash
# 尝试 ping Windows 物理 IP - 失败
ping 192.168.1.100
# 100% packet loss

# 尝试连接 localhost - 失败
nc -zv 127.0.0.1 7890
# Connection refused

# 尝试连接 WSL 网关 - 超时
nc -zv 172.26.192.1 7890
# Connection timed out
```

## 完整解决方案

### 步骤 1：确认 Clash 配置

#### 1.1 检查 Clash 端口

打开 Clash Verge，进入 **设置** → **Clash 设置**，确认：

- **端口设置**：记下端口号（例如 7890）
- **局域网连接**：必须 **开启** ✅

#### 1.2 验证 Clash 监听状态

在 Windows PowerShell 中执行：

```powershell
netstat -ano | findstr 7890
```

确认输出中包含：
```
TCP    0.0.0.0:7890           0.0.0.0:0              LISTENING       xxxxx
```

`0.0.0.0:7890` 表示 Clash 正在监听所有网络接口（正确）。

如果只看到 `127.0.0.1:7890`，需要修改 Clash 配置文件，确保 `allow-lan: true`。

### 步骤 2：配置 Windows 防火墙

#### 2.1 方法一：使用 PowerShell（推荐）

以**管理员身份**打开 PowerShell，执行：

```powershell
New-NetFirewallRule -DisplayName "WSL Clash Proxy" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7890
```

#### 2.2 方法二：使用图形界面

1. 按 `Win + R`，输入 `wf.msc`，回车打开防火墙高级设置
2. 左侧点击 **入站规则**
3. 右侧点击 **新建规则**
4. 选择 **端口** → 下一步
5. 选择 **TCP**，特定本地端口填入 `7890` → 下一步
6. 选择 **允许连接** → 下一步
7. **全部勾选**（域、专用、公用）→ 下一步
8. 名称填入 `WSL Clash Proxy` → 完成

### 步骤 3：配置端口转发（核心步骤）

由于 WSL2 的网络隔离特性，需要使用 Windows 的端口转发功能。

#### 3.1 获取 WSL 网关 IP

在 WSL 中执行：

```bash
# 方法 1：查看默认网关
ip route | grep default | awk '{print $3}'

# 方法 2：查看 DNS 配置
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

通常会得到类似 `172.26.192.1` 的 IP 地址。

#### 3.2 添加端口转发规则

在 Windows PowerShell（**管理员身份**）中执行：

```powershell
# 将 172.26.192.1 替换为你实际的 WSL 网关 IP
# 将 7890 替换为你的 Clash 端口
netsh interface portproxy add v4tov4 listenport=7890 listenaddress=172.26.192.1 connectport=7890 connectaddress=127.0.0.1

# 验证规则是否添加成功
netsh interface portproxy show all
```

成功后会显示：

```
侦听 ipv4:                 连接到 ipv4:
地址            端口        地址            端口
--------------- ----------  --------------- ----------
172.26.192.1    7890        127.0.0.1       7890
```

#### 3.3 测试连接

在 WSL 中测试端口是否可达：

```bash
nc -zv 172.26.192.1 7890
```

成功的输出：
```
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connected to 172.26.192.1:7890.
Ncat: 0 bytes sent, 0 bytes received in 0.00 seconds.
```

### 步骤 4：配置 WSL 代理环境变量

#### 4.1 临时设置（当前会话有效）

在 WSL 中执行：

```bash
export http_proxy="http://172.26.192.1:7890"
export https_proxy="http://172.26.192.1:7890"
export all_proxy="socks5://172.26.192.1:7890"  # 可选
```

#### 4.2 测试代理

```bash
# 测试 HTTPS 访问
curl -I https://www.google.com

# 查看当前 IP（应显示代理后的 IP）
curl cip.cc

# 测试 HTTP 访问
curl -I http://www.baidu.com
```

#### 4.3 永久配置

编辑 `~/.bashrc` 文件：

```bash
vi ~/.bashrc
```

在文件末尾添加：

```bash
# Clash Proxy Configuration
export WSL_HOST=$(ip route | grep default | awk '{print $3}')
export http_proxy="http://${WSL_HOST}:7890"
export https_proxy="http://${WSL_HOST}:7890"
export all_proxy="socks5://${WSL_HOST}:7890"

# 可选：添加代理管理函数
proxy_on() {
    export WSL_HOST=$(ip route | grep default | awk '{print $3}')
    export http_proxy="http://${WSL_HOST}:7890"
    export https_proxy="http://${WSL_HOST}:7890"
    export all_proxy="socks5://${WSL_HOST}:7890"
    echo "Proxy enabled: $http_proxy"
}

proxy_off() {
    unset http_proxy
    unset https_proxy
    unset all_proxy
    echo "Proxy disabled"
}
```

保存后使配置生效：

```bash
source ~/.bashrc
```

现在可以使用 `proxy_on` 开启代理，`proxy_off` 关闭代理。

### 步骤 5：配置 Git 代理（可选）

如果需要让 Git 使用代理：

```bash
# 设置 Git HTTP 代理
git config --global http.proxy http://172.26.192.1:7890
git config --global https.proxy http://172.26.192.1:7890

# 取消 Git 代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 开机自动配置

### 问题

Windows 重启后，`netsh` 端口转发规则会丢失，需要重新配置。

### 解决方案：创建自动启动脚本

#### 方法一：使用批处理脚本

1. 创建文件 `wsl-proxy-setup.bat`，内容如下：

```batch
@echo off
echo Setting up WSL Clash Proxy...

REM 删除可能存在的旧规则（避免重复）
netsh interface portproxy delete v4tov4 listenport=7890 listenaddress=172.26.192.1 >nul 2>&1

REM 添加端口转发规则
netsh interface portproxy add v4tov4 listenport=7890 listenaddress=172.26.192.1 connectport=7890 connectaddress=127.0.0.1

echo WSL Proxy setup completed!
netsh interface portproxy show all
pause
```

2. 右键以**管理员身份运行**这个批处理文件

#### 方法二：添加到 Windows 启动项

1. 按 `Win + R`，输入 `shell:startup`，打开启动文件夹
2. 在该文件夹中创建一个快捷方式：
   - 右键 → 新建 → 快捷方式
   - 位置填入：`C:\Windows\System32\netsh.exe`
   - 参数：`interface portproxy add v4tov4 listenport=7890 listenaddress=172.26.192.1 connectport=7890 connectaddress=127.0.0.1`
3. 右键快捷方式 → 属性 → 高级 → 勾选**用管理员身份运行**

#### 方法三：使用任务计划程序（最稳定）

1. 按 `Win + R`，输入 `taskschd.msc`，打开任务计划程序
2. 右侧点击 **创建任务**
3. **常规** 标签：
   - 名称：`WSL Clash Proxy Setup`
   - 勾选 **使用最高权限运行**
4. **触发器** 标签：
   - 新建 → 开始任务：**登录时**
5. **操作** 标签：
   - 新建 → 操作：**启动程序**
   - 程序：`C:\Windows\System32\netsh.exe`
   - 参数：`interface portproxy add v4tov4 listenport=7890 listenaddress=172.26.192.1 connectport=7890 connectaddress=127.0.0.1`
6. 点击 **确定** 保存

## 常见问题排查

### 问题 1：Connection timed out

**原因**：防火墙阻止连接

**解决方案**：
- 确认防火墙规则已添加
- 临时关闭防火墙测试，确认是否为防火墙问题

### 问题 2：Connection refused

**原因**：端口未监听或网络隔离

**解决方案**：
- 检查 Clash 是否正在运行
- 确认端口号正确
- 使用 `netstat -ano | findstr 端口号` 检查监听状态

### 问题 3：代理速度慢

**原因**：双重转发导致性能损失

**优化方案**：
- 考虑升级到支持镜像网络的 Windows 版本（22H2 或更高）
- 使用 Clash TUN 模式（需要 Windows 22H2+）

### 问题 4：WSL 重启后 IP 变化

**原因**：WSL 网关 IP 可能变化

**解决方案**：
在 `~/.bashrc` 中使用动态获取：

```bash
export WSL_HOST=$(ip route | grep default | awk '{print $3}')
export http_proxy="http://${WSL_HOST}:7890"
```

### 问题 5：某些应用不使用代理

**原因**：部分应用不遵循环境变量

**解决方案**：
- Docker：在 `~/.docker/config.json` 中配置
- Curl：使用 `-x` 参数显式指定代理
- Wget：在 `~/.wgetrc` 中配置

## 高级配置

### 1. 按需启用/禁用代理

在 `~/.bashrc` 中添加更完善的代理管理：

```bash
# 代理配置
export CLASH_PORT=7890

proxy_on() {
    export WSL_HOST=$(ip route | grep default | awk '{print $3}')
    export http_proxy="http://${WSL_HOST}:${CLASH_PORT}"
    export https_proxy="http://${WSL_HOST}:${CLASH_PORT}"
    export all_proxy="socks5://${WSL_HOST}:${CLASH_PORT}"
    export no_proxy="localhost,127.0.0.1,::1"
    echo -e "\033[32m✓ Proxy enabled: $http_proxy\033[0m"
}

proxy_off() {
    unset http_proxy
    unset https_proxy
    unset all_proxy
    unset no_proxy
    echo -e "\033[31m✗ Proxy disabled\033[0m"
}

proxy_status() {
    if [ -n "$http_proxy" ]; then
        echo -e "\033[32m✓ Proxy is enabled: $http_proxy\033[0m"
        echo "Testing connection..."
        curl -I -s --connect-timeout 3 https://www.google.com | head -n 1
    else
        echo -e "\033[31m✗ Proxy is disabled\033[0m"
    fi
}

# 别名
alias pon='proxy_on'
alias poff='proxy_off'
alias pst='proxy_status'

# 自动启用代理（可选）
# proxy_on
```

### 2. 排除特定域名

```bash
export no_proxy="localhost,127.0.0.1,::1,*.local,192.168.*"
```

### 3. Docker 代理配置

编辑 `~/.docker/config.json`：

```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://172.26.192.1:7890",
      "httpsProxy": "http://172.26.192.1:7890",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
```

## Windows 11 22H2+ 用户的更优方案

如果你的 Windows 版本是 22H2 或更高，可以使用镜像网络模式，无需端口转发。

### 启用镜像网络

在 Windows 用户目录下创建 `.wslconfig` 文件：

```powershell
# 在 PowerShell 中执行
Set-Content -Path "$env:USERPROFILE\.wslconfig" -Value @"
[wsl2]
networkingMode=mirrored
localhostForwarding=true
"@

# 重启 WSL
wsl --shutdown
```

重新启动 WSL 后，可以直接使用 `127.0.0.1`：

```bash
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
```

## 验证代理工作正常

### 测试命令

```bash
# 1. 测试基本连接
curl -I https://www.google.com

# 2. 查看 IP 地址（应显示代理 IP）
curl cip.cc

# 3. 测试代理响应时间
time curl -I https://www.google.com

# 4. 查看详细连接信息
curl -v https://www.google.com 2>&1 | grep -i proxy

# 5. 测试 Git
git ls-remote https://github.com/torvalds/linux.git HEAD
```

### 预期结果

- 能够访问被墙网站（如 Google）
- IP 地址显示为代理服务器 IP
- 连接速度正常

## 总结

本文介绍的解决方案核心思路：

1. **确保 Clash 正确监听**（`0.0.0.0:端口` + `allow-lan: true`）
2. **配置防火墙允许连接**
3. **使用 netsh 端口转发**，将 WSL 网关 IP 的流量转发到 Windows localhost
4. **配置环境变量**，让 WSL 应用使用代理
5. **设置开机自动化**，避免每次手动配置

这个方案适用于 Windows 10/11 的所有版本，无需升级系统，稳定可靠。

## 参考资料

- [WSL2 官方文档](https://docs.microsoft.com/zh-cn/windows/wsl/)
- [Windows 端口转发文档](https://docs.microsoft.com/zh-cn/windows-server/networking/technologies/netsh/netsh-interface-portproxy)
- [Clash 文档](https://clash.wiki/)

