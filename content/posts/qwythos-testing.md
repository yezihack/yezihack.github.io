---
title: "Qwythos V1vsv2"
date: 2026-07-31T10:38:27+08:00
lastmod: 2026-07-31T10:38:27+08:00
draft: true
tags: [""]
categories: [""]
author: "百里"
comment: true
toc: true
reward: true
---

## 介绍 Qwythos


- 官网：<https://empero.org>
- 魔塔: <https://modelscope.cn/organization/empero-ai>
- HF: <https://huggingface.co/empero-ai>

- 9B-V1 <https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF>
- 9B-V2 <https://huggingface.co/empero-ai/Qwythos-9B-v2-GGUF>
- 9B.BIG-V1 <https://huggingface.co/empero-ai/Qwythos-27B-v1-GGUF>

## 环境

- windows 11
- nvidia 4060Ti 16G

## 测评

### 9B-V1

- 模型文件：<https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF/resolve/main/Qwythos-9B-Claude-Mythos-5-1M-MTP-Q8_0.gguf?download=true>
- 多态文件：<https://huggingface.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF/resolve/main/mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf?download=true>

```sh
llama-server.exe -m Qwythos-9B-Claude-Mythos-5-1M-Q8_0.gguf --mmproj mmproj-Qwythos-9B-Claude-Mythos-5-1M-F16.gguf --alias Qwythos-9B-Claude-Mythos-5-1M-Q8_0 -fa on -ngl 999 --jinja --cont-batching --temp 0.6 --top-p 0.95 --top-k 20 --cache-type-k q8_0 --cache-type-v q8_0 -b 2048 -ub 512 -c 32768 -t 13 --host 127.0.0.1 --port 8080
```

### 9B-V2

- 模型文件：<https://huggingface.co/empero-ai/Qwythos-9B-v2-GGUF/resolve/main/Qwythos-9B-v2-MTP-Q8_0.gguf?download=true>
- 多态文件：<https://huggingface.co/empero-ai/Qwythos-9B-v2-GGUF/resolve/main/mmproj-Qwythos-9B-v2-BF16.gguf?download=true>

```sh
llama-server.exe -m I:\ai\models\Qwythos-9B-v2-MTP-Q8_0.gguf --mmproj I:\ai\models\mmproj-Qwythos-9B-v2-BF16.gguf --alias Qwythos-9B-v2-MTP-Q8_0 -fa on -ngl 999 --jinja --cont-batching --temp 0.6 --top-p 0.95 --top-k 20 --cache-type-k q8_0 --cache-type-v q8_0 -b 2048 -ub 512 -c 32768 -t 13 --host 127.0.0.1 --port 8080  --spec-type draft-mtp --spec-draft-n-max 6

```

### 9B.BIG-V1

- 模型文件：<https://huggingface.co/empero-ai/Qwythos-27B-v1-GGUF/resolve/main/Qwythos-27B-Q4_K_M.gguf?download=true>
- 多态文件：<https://huggingface.co/empero-ai/Qwythos-27B-v1-GGUF/resolve/main/mmproj-Qwythos-27B-F16.gguf?download=true>

```sh
llama-server.exe -m I:\ai\models\Qwythos-27B-Q4_K_M.gguf --mmproj I:\ai\models\mmproj-Qwythos-27B-F16.gguf --alias Qwythos-27B-Q4_K_M -fa on -ngl 999 --jinja --cont-batching --temp 0.6 --top-p 0.95 --top-k 20 --cache-type-k q8_0 --cache-type-v q8_0 -b 2048 -ub 512 -c 8192 -t 13 --host 127.0.0.1 --port 8080
```