---
title: "Llama.cpp 本地部署与工具接入指南"
date: 2026-07-02T10:53:07+08:00
lastmod: 2026-07-02T10:53:07+08:00
draft: false
tags: ["ai", "llama.cpp", "agent"]
categories: ["ai"]
author: "百里"
comment: false
toc: true
reward: true
---

## 1. 什么是 llama.cpp

始于2023年的llama.cpp 是一个用 C/C++ 从零实现的 LLM 推理引擎，最初由 Georgi Gerganov 为了在 MacBook 上跑 LLaMA 而写，现在已经发展成支持几乎所有主流开源模型架构的通用推理框架。核心特点是**零依赖、极致优化、跨平台**——CPU、CUDA、Metal、Vulkan、ROCm 都能跑，甚至能在树莓派上跑。

核心组件:

1. llama.cpp 本体:推理引擎和 C API
2. llama-server:内置的 HTTP server,提供 OpenAI 兼容和原生 API
3. 量化格式 GGUF:自家的模型格式,支持 Q4_K_M、IQ2_M、IQ3_XXS 这些你已经在用的量化方案
4. llama-cli / llama-bench:命令行推理和性能测试工具

## 2. 安装 llama.cpp

### 2.1. 一键安装

- <https://llama.app/>

打开命令行，输入：`irm https://llama.app/install.ps1 | iex`

打开命令行方式：Win+ R，输入：powershell 或 wt

### 2.2. 手动安装

打开：<https://github.com/ggml-org/llama.cpp/releases> 下载最新的推理工具

我的显卡是：NVIDIA 4060Ti 16GB

1. 首先查看显卡的CUDA版本，我的显卡是CUDA 12.2

使用命令：`nvidia-smi` 查看显卡信息

![20260703160945](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260703160945.png)

2. 我的操作系统是：Windows 10 64位

- 下载：<https://github.com/ggml-org/llama.cpp/releases/download/b9860/llama-b9860-bin-win-cuda-12.4-x64.zip>
- 加速库：<https://github.com/ggml-org/llama.cpp/releases/download/b9860/cudart-llama-bin-win-cuda-12.4-x64.zip>

1. `llama-b9860-bin-win-cuda-12.4-x64.zip` 解压后加入环境变量中
2. `cudart-llama-bin-win-cuda-12.4-x64.zip` 解压后放在 `llama-b9860-bin-win-cuda-12.4-x64.zip` 解压后的目录中

建议：存储在 `D:\llama` 目录中

linux & mac 方法：

```bash
vim ~/.bashrc
export PATH=$PATH:/path/to/llama-b9860-bin-linux-cuda-12.4-x64
```

window 方法：

1. win+r 打开运行窗口
2. 输入：`systempropertiesadvanced` 打开系统属性
3. 点击环境变量
4. 选择系统变量中的 Path 变量，点击编辑
5. 新建，把解压后的路径添加进去

## 3. 下载模型

部署一个目前最火并且只有9B大小的模型：Qwythos-9B-Claude-Mythos-5-1M-GGUF，它是由第三方团队 Empero AI 基于 Qwen3.5-9B 底座做的全参数微调模型，用超过5亿 token 的 Claude Mythos / Claude Fable 对话轨迹＋自研工具 rethink 生成的思维链数据训练而成，官方支持1M上下文（YaRN扩展）、原生 function calling 和多模态（沿用 Qwen3.5-9B 的视觉塔）

提供两个平台下载方式：

1. <https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF>
2. <https://modelscope.cn/models/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF>

在线下载：

```sh
# 国内加速
# linux & mac
export HF_ENDPOINT=https://hf-mirror.com
mkdir -p /data/llama
export LLAMA_CACHE = "/data/llama"
llama serve -hf empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M

# windows
$env:HF_ENDPOINT = "https://hf-mirror.com"
$env:LLAMA_CACHE = "D:\llama\models_cache"
llama serve -hf empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M
## 以上会下载在`C盘用户名\.cache\huggingface\hub\models--empero-ai--Qwythos-9B-Claude-Mythos-5-1M-GGUF`目录下
## 由于模型文件很大、占用C盘空间、建议采用设置环境变量方式指定下载目录
```

手动下载：

1. <https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF/resolve/main/Qwythos-9B-Claude-Mythos-5-1M-MTP-Q4_K_M.gguf?download=true>
2. <https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF/resolve/main/mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf?download=true>

模型保存目录为：`D:\llama\models`

## 4. 压力测试

```sh
llama-bench -m Qwythos-9B-Claude-Mythos-5-1M-MTP-Q4_K_M.gguf

# 或

$env:LLAMA_CACHE = "D:\llama\models_cache"
llama-bench -hf empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M
```

![20260707163242](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260707163242.png)

| 字段    | 解释                                                                 |
| ------- | -------------------------------------------------------------------- |
| model   | 模型名称，这里是 9B 量化 Q4_K_M                                      |
| size    | 模型加载占用显存 / 内存：5.23GiB                                     |
| params  | 模型参数量：89.5 亿参数（9B）                                        |
| backend | 计算后端 CUDA = 显卡跑，CPU = 纯 CPU                                 |
| ngl     | GPU 分层层数，-1 = 全部层丢显卡（全卡加速）                          |
| test    | 两种测试项目：<br>pp512：Prefill 预填充，输入 512token<br>tg128：Token Generate 生成，输出 128token |
| t/s     | token per second，每秒处理 token 数，± 后面是波动误差                |

怎么判断性能好坏（参考标准）：

1. ＜20 t/s：很慢，大概率 CPU 跑 / 显存不足分层不够
2. 30～50 t/s：中端游戏卡正常区间（你的 46 属于优秀）
3. ＞60 t/s：高端卡（4090/5090）

## 5. 推理

```sh
# 使用在线方式
$env:LLAMA_CACHE = "D:\llama\models_cache"
llama-serve -hf empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M --alias claude-mythos-5-1m --port 8080

# linux & mac 手动下载文件、指定文件启动模型
llama-server \
  --alias claude-mythos-5-1m \
  -m Qwythos-9B-Claude-Mythos-5-1M-Q4_K_M.gguf \
  --mmproj mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf \
  -c 32768 --port 8080

# windows 手动下载文件、指定文件启动模型
# win+R 输入`powershell`打开powershell窗口
llama-server `
  --alias claude-mythos-5-1m `
  -m Qwythos-9B-Claude-Mythos-5-1M-Q4_K_M.gguf `
  --mmproj mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf `
  -c 32768 --host 127.0.0.1 --port 8080

# 更复杂的配置
llama-server `
  -m Qwythos-9B-Claude-Mythos-5-1M-Q4_K_M.gguf `
  --mmproj mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf `
  --alias claude-mythos-5-1m `
  -fa on -ngl 999 --jinja --cont-batching `
  --temp 0.6 --top-p 0.95 --top-k 20 `
  --cache-type-k q8_0 --cache-type-v q8_0 `
  -b 2048 -ub 512 `
  -c 32768 --host 127.0.0.1 --port 8080
```

![20260707100605](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260707100605.png)
![20260707101622](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260707101622.png)

参数说明：

- `--alias` 给当前运行模型自定义别名,方便接入 viber coding 工具
- `-c`：上下文长度
  - 显卡4GB显存：16384
  - 显卡8GB显存：32768
  - 显卡16GB显存：65536
  - 显卡32GB显存：131072
  - 显卡64GB显存：262144
  - 显卡128GB显存：524288
- `-m`：主 LLM 文本模型 GGUF 文件路径
- `--mmproj`：多模态投影编码器文件，图文模型必加
- `-fa`：开启 Flash Attention 2 加速，大幅降低长上下文显存占用、提升生成速度，32k 上下文强烈推荐开启；老显卡不支持可设 off
- `-ngl`：把模型所有层全部扔到显卡跑，最大化 GPU 加速；显存不足可下调（如 35、80）
- `-jinja`：强制使用模型内置 Jinja 对话模板，替代硬编码 prompt 格式
- `-cont-batching`：连续批处理，同时处理多条用户请求，不用排队串行生成，多客户端并发请求吞吐量大幅提升，本地多开聊天界面必备
- `--temp`：生成文本的随机性，0.1~1.0，值越大生成文本越随机，越有创造性
- `--top-p`：0.1~1.0，核采样：累积概率 95% 的候选词参与采样，过滤极低概率词汇，提升生成质量
- `--top-k`：0~100, 每次只取概率最高前 20 个 token 参与生成，限制候选池大小
- `--cache-type-k`：键缓存类型，q8_0：8 位量化，显存占用小，但生成速度略慢；q4_0：4 位量化，显存占用更小，生成速度更快,KV Cache 是上下文缓存，存储历史对话，长上下文显存大户
- `--cache-type-v`：值缓存类型，q8_0：8 位量化，显存占用小，但生成速度略慢；q4_0：4 位量化，显存占用更小，生成速度更快
- `-b`: 单次前向推理最大 token 批次量，显存不足可下调（如 512）
- `-ub`: 细分大 batch，平衡显卡显存波动，数值越小显存峰值越低，并发更稳
- `--api-key`：API 密钥
- `--port` ：端口

## 6. 工具选择

- <https://openrouter.ai/apps>

## 7. 接入 Pi

> 也是 llama.app 官方推荐的接入方式 <https://llama.app/>

- 官网 <https://pi.dev/>

安装 pi 工具：

1. windows : `powershell -c "irm https://pi.dev/install.ps1 | iex"`
2. linux & mac : `curl -fsSL https://pi.dev/install.sh | sh`

```sh
# 插件
pi install git:github.com/huggingface/pi-llama

# 进入Viber Coding状态
pi 
# 查看当前模型
/model
```

- 注意这条命令 `pi install git:github.com/huggingface/pi-llama` 需要本机安装 git，没有则先安装 git <https://git-scm.com/install/windows>

## 8. Claude Code

- 安装 npm: <https://nodejs.org/en/download> 建议下带`LTS`版本
- 安装：`npm install -g @anthropic-ai/claude-code`
- 安装路由工具ccr: `npm install -g @musistudio/claude-code-router`

```sh
# 安装 claude code cli
npm install -g @anthropic-ai/claude-code

# 安装路由工具
npm install -g @musistudio/claude-code-router

# 进入UI, 接入  Agent 配置
ccr start
ccr ui
```

![20260715191710](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260715191710.png)

## 9. 接入 Cherry Studio

- 下载 <https://cherryai.com.cn/>

![20260707102017](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260707102017.png)

## 10. 接入 Vscode

- 下载：<https://code.visualstudio.com/download>
- 先登陆 vscode，然后再添加自定义模型

![20260707135544](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260707135544.png)
