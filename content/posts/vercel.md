---
title: "Vercel - 现代化的 AI 云部署平台完全指南"
date: 2026-04-02T17:06:36+08:00
lastmod: 2026-04-02T17:06:36+08:00
draft: false
tags: ["deployment", "vercel", "nextjs", "cloud", "frontend", "ai"]
categories: ["tools", "devops"]
author: "百里"
comment: false
toc: true
reward: true
---

## 简介

**Vercel** 是一个现代化的云部署平台，致力于让开发者能够更快地构建、部署和扩展网络应用。从个人项目到企业级应用，Vercel 提供了完整的工具链和基础设施支持。

官网地址：[https://vercel.com/](https://vercel.com/)

## 什么是 Vercel？

Vercel 是一个**全栈云计算平台**，为开发者提供：

### 核心功能

- **一键部署**：从 Git 直接部署到全球 CDN
- **AI 云基础设施**：支持 AI 应用和模型集成
- **无服务器函数**：轻松创建和部署后端 API
- **全球边缘网络**：自动在全球范围内分发内容
- **零配置**：自动识别项目类型，智能配置
- **实时预览**：每次 Git 推送都自动生成预览链接
- **自动 HTTPS**：所有域名都支持 SSL/TLS

## Vercel 的核心特点

### 1. 框架支持

Vercel 支持多种现代前端框架：

| 框架 | 支持状态 | 推荐指数 |
|------|---------|---------|
| **Next.js** | ✅ 官方支持 | ⭐⭐⭐⭐⭐ |
| **React** | ✅ 完美支持 | ⭐⭐⭐⭐⭐ |
| **Svelte** | ✅ 完整支持 | ⭐⭐⭐⭐ |
| **Vue/Nuxt** | ✅ 完整支持 | ⭐⭐⭐⭐ |
| **Astro** | ✅ 完整支持 | ⭐⭐⭐⭐ |
| **Python** | ✅ 支持 | ⭐⭐⭐ |
| **Static HTML** | ✅ 支持 | ⭐⭐⭐⭐ |

### 2. 全球基础设施

- **60+ 个全球节点**：确保内容快速交付
- **自动地理优化**：根据用户位置选择最近的服务器
- **智能缓存**：边缘计算和智能缓存策略
- **高可用性**：99.95% 正常运行时间保证

### 3. AI 功能集成

Vercel 内置 AI 支持：

- **AI Gateway**：统一接口访问多个 AI 模型
  - 支持 OpenAI、Anthropic、Google Gemini 等
  - 自动负载均衡和故障转移
  
- **AI SDK**：JavaScript SDK 简化 AI 集成
  - 流式响应支持
  - 自动重试和错误处理
  
- **Workflow**：自动化工作流执行
  
- **Agents**：AI 代理执行复杂任务

### 4. 安全特性

- **Web 应用防火墙 (WAF)**
- **Bot 管理**
- **BotID**：高级机器人检测
- **DDoS 保护**
- **企业级安全审计**

### 5. 开发者体验

- **本地开发**：`vercel dev` 命令模拟生产环境
- **环境变量**：安全管理敏感配置
- **分析仪表板**：实时性能监控
- **日志和追踪**：完整的可观测性
- **CI/CD 集成**：自动化测试和部署

## 快速开始

### 前置要求

- Git 账户（GitHub、GitLab 或 Bitbucket）
- Node.js 和 npm/yarn（本地开发）
- 一个要部署的项目

### 第 1 步：创建账户

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Start Deploying** 或 **Sign Up**
3. 使用 GitHub/GitLab/Bitbucket 账户登录（推荐）
4. 授权 Vercel 访问你的代码仓库

### 第 2 步：导入项目

#### 方法 1：从 Git 导入（推荐）

1. 登录 Vercel 仪表板
2. 点击 **Add New** → **Project**
3. 选择你的 Git 提供商和仓库
4. 配置项目设置（见下文）
5. 点击 **Deploy**

#### 方法 2：使用 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 在项目目录中
cd your-project

# 3. 链接到 Vercel
vercel link

# 4. 部署
vercel deploy

# 5. 部署到生产环境
vercel deploy --prod
```

#### 方法 3：使用模板快速开始

Vercel 提供数百个预构建模板：

```bash
# 使用 Next.js 模板
vercel create app --template nextjs

# 使用 React 模板
vercel create app --template react

# 浏览所有模板
# https://vercel.com/templates
```

### 第 3 步：配置项目

#### 创建 vercel.json 配置文件

```json
{
  "name": "my-project",
  "version": 2,
  "env": {
    "NEXT_PUBLIC_DOMAIN": "example.com"
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 300
    }
  }
}
```

**常用配置参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `name` | 项目名称 | `my-app` |
| `version` | 配置版本 | `2` |
| `env` | 环境变量 | `{"KEY": "value"}` |
| `builds` | 构建配置 | 见下文 |
| `routes` | 路由规则 | 见下文 |
| `functions` | 函数配置 | 见下文 |

### 第 4 步：管理环境变量

#### 方法 1：通过仪表板

1. 打开项目设置
2. 进入 **Settings** → **Environment Variables**
3. 添加环境变量（支持不同环境：Production/Preview/Development）

#### 方法 2：本地 .env.local 文件

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
```

**环境变量最佳实践：**

```bash
# ✅ 好的做法：明确标注公开变量
NEXT_PUBLIC_API_KEY=public-key

# ✅ 好的做法：敏感信息不前缀
DATABASE_PASSWORD=secret

# ❌ 避免：在代码中硬编码敏感信息
# const API_KEY = "sk-1234567890"

# ✅ 好的做法：使用 .env.local（Git 忽略）
# DATABASE_URL=...
```

## 部署详解

### Web 应用部署

#### Next.js 应用部署

```bash
# 1. 创建 Next.js 项目
npx create-next-app my-app
cd my-app

# 2. 推送到 Git
git add .
git commit -m "Initial commit"
git push origin main

# 3. 在 Vercel 导入项目（自动识别 Next.js）
# 仪表板中点击导入，无需额外配置
```

**Next.js 特定优化：**
- 自动 SSR（服务端渲染）
- 自动静态生成（SSG）
- 增量静态重新生成（ISR）
- 镜像优化和压缩

#### React 应用部署

```bash
# Create React App
npx create-react-app my-app
cd my-app

# Vite + React
npm create vite my-app -- --template react
cd my-app

# 部署流程相同
vercel deploy --prod
```

#### 静态网站部署

```bash
# Hugo 博客
hugo new site my-blog
# 配置并构建
hugo

# 部署
vercel deploy --prod
```

### 无服务器函数部署

Vercel 支持部署无服务器函数（Serverless Functions）作为后端 API。

#### Node.js 函数示例

```javascript
// api/hello.js
export default function handler(req, res) {
  const { name = 'World' } = req.query;
  res.status(200).json({
    message: `Hello, ${name}!`
  });
}

// 访问: https://your-domain.vercel.app/api/hello?name=Vercel
// 响应: { "message": "Hello, Vercel!" }
```

#### Python 函数示例

```python
# api/hello.py
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(self.path.split('?')[1] if '?' in self.path else '')
        name = query.get('name', ['World'])[0]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = f'{{"message": "Hello, {name}!"}}'
        self.wfile.write(response.encode())
```

#### 配置函数

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 300
    },
    "api/heavy/**/*.js": {
      "memory": 3008,
      "maxDuration": 900
    }
  }
}
```

**函数配置说明：**

| 配置 | 说明 | 默认值 | 范围 |
|------|------|--------|------|
| `memory` | 内存大小 (MB) | 1024 | 128-10,240 |
| `maxDuration` | 最大执行时间 (秒) | 60 | 5-900 |
| `maxConcurrency` | 并发数 | 无限 | 1-1000 |

### 数据库连接

#### 集成 PostgreSQL

```javascript
// api/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 集成 MongoDB

```javascript
// api/mongo.js
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('mydb');
    const collection = db.collection('users');
    const users = await collection.find({}).toArray();
    res.status(200).json(users);
  } finally {
    await client.close();
  }
}
```

## 高级配置

### 自定义域名

#### 1. 添加域名

在 Vercel 仪表板：
1. 项目设置 → **Domains**
2. 输入你的域名
3. 按照指示配置 DNS 记录

#### 2. DNS 配置

对于不同的域名提供商，配置方式略有不同：

```bash
# A 记录
76.76.19.140

# CNAME 记录
cname.vercel-dns.com
```

#### 3. SSL 证书

Vercel 自动为所有域名生成和管理 SSL/TLS 证书。

### 重定向和重写

在 `vercel.json` 中配置路由：

```json
{
  "routes": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html",
      "status": 200
    }
  ]
}
```

### 中间件和边缘函数

#### Next.js 中间件

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 添加自定义头
  response.headers.set('X-Custom-Header', 'value');
  
  // 条件重定向
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
```

### Web Analytics（分析）

Vercel 内置分析工具：

```typescript
// pages/index.tsx
import { useWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric: any) {
  console.log(metric);
}
```

### AI 集成

#### 使用 AI Gateway

```typescript
// api/chat.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(req, res) {
  const { message } = req.body;
  
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: message,
  });
  
  res.status(200).json({ response: result.text });
}
```

#### 流式响应

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(req, res) {
  const { message } = req.body;
  
  const result = streamText({
    model: openai('gpt-4'),
    prompt: message,
  });
  
  response.setHeader('Content-Type', 'text/event-stream');
  for await (const chunk of result.toReadableStream()) {
    res.write(chunk);
  }
  res.end();
}
```

## 本地开发

### Vercel CLI 操作

```bash
# 安装 CLI
npm i -g vercel

# 初始化项目
vercel

# 本地开发环境
vercel dev

# 部署预览
vercel deploy

# 生产部署
vercel deploy --prod

# 查看部署日志
vercel logs

# 删除部署
vercel remove <deployment-url>
```

### 本地环境变量

```bash
# 创建 .vercel/project.json（自动创建）
{
  "projectId": "prj_xxxxx",
  "orgId": "team_xxxxx"
}

# 拉取环境变量
vercel env pull

# 这将创建 .env.local 文件
```

## 监控和调试

### 性能监控

1. **Vercel Analytics**：实时性能数据
2. **Web Vitals**：核心网络指标
3. **自定义指标**：追踪特定事件

### 日志查看

```bash
# 查看实时日志
vercel logs

# 查看特定函数的日志
vercel logs api/hello

# 查看错误
vercel logs --error
```

### 调试 Serverless 函数

```javascript
// api/debug.js
export default async function handler(req, res) {
  console.log('Request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  
  try {
    // 你的逻辑
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

## 定价和计划

### 免费计划

✅ 完美用于个人项目和学习：
- 无限部署
- 每月 100GB 带宽
- 6 个并发构建
- 基础分析
- 社区支持

### Pro 计划

适合专业开发者和小团队：
- 无限部署和并发构建
- 每月 500GB 带宽
- 优先支持
- 高级分析
- 环境预览

### 团队计划

适合企业级应用：
- 所有 Pro 功能
- 无限团队成员
- 企业级 SLA
- 优先技术支持
- 自定义限制

### Enterprise 计划

针对大型组织：
- 完全自定义
- 专属学习成功经理
- 企业级安全
- SLA 保证

## 安全最佳实践

### 1. 环境变量安全

```bash
# ✅ 正确：敏感信息存储为环境变量
DATABASE_PASSWORD=your-secret

# ❌ 错误：硬编码敏感信息
const PASSWORD = 'your-secret'
```

### 2. API 密钥管理

```typescript
// ✅ 正确：后端调用 API
// api/secret-endpoint.ts
const apiKey = process.env.API_KEY; // 服务端安全

// ❌ 错误：前端暴露密钥
const apiKey = 'sk-1234567890'; // 不安全！
```

### 3. CORS 配置

```typescript
// api/cors-example.ts
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://example.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  res.status(200).json({ message: 'OK' });
}
```

### 4. 身份验证

```typescript
// api/protected.ts
import { verify } from 'jsonwebtoken';

export default function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    res.status(200).json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

## 常见问题

### Q1: Vercel 支持哪些框架？

**A**: 支持 Next.js、React、Svelte、Vue/Nuxt、Astro、Remix、Qwik 等，以及 Python、Go、Ruby 等后端语言。

### Q2: 免费计划有什么限制？

**A**: 
- 带宽：100GB/月
- 构建时间：无限
- 部署数量：无限
- 支持：社区论坛

### Q3: 如何自定义域名？

**A**: 在项目设置 → Domains，添加你的域名并按照指示配置 DNS 记录。

### Q4: Serverless 函数的冷启动问题？

**A**: Vercel 优化了冷启动时间。对于关键应用，可以考虑：
- 增加函数内存
- 使用 Scheduled Functions 预热
- 考虑 Fluid Compute 模式

### Q5: 如何处理数据库连接？

**A**: 
- 使用连接池（如 PgBouncer）
- 配置环境变量存储连接字符串
- 在函数中复用连接

### Q6: 可以在 Vercel 上运行 cron jobs 吗？

**A**: 是的，使用 Scheduled Functions（仅 Pro+ 计划）：

```json
{
  "functions": {
    "api/cron.js": {
      "schedule": "0 0 * * *"
    }
  }
}
```

## 常用命令参考

```bash
# 初始化
vercel init
vercel create

# 开发
vercel dev
vercel dev --prod

# 部署
vercel deploy
vercel deploy --prod
vercel deploy --force

# 环境管理
vercel env pull
vercel env push
vercel env list

# 项目管理
vercel projects list
vercel remove <name>

# 变量管理
vercel secrets list
vercel secrets add <name>

# 日志和监控
vercel logs
vercel analytics

# 帮助
vercel help
vercel --version
```

## 资源和文档

- **官网**：[vercel.com](https://vercel.com/)
- **文档**：[vercel.com/docs](https://vercel.com/docs)
- **模板库**：[vercel.com/templates](https://vercel.com/templates)
- **API 参考**：[vercel.com/docs/api](https://vercel.com/docs/api)
- **社区**：[community.vercel.com](https://community.vercel.com/)
- **博客**：[vercel.com/blog](https://vercel.com/blog)
- **学习**：[vercel.com/academy](https://vercel.com/academy)

## 总结

Vercel 是一个强大的现代化部署平台，具有以下优势：

✅ **零配置部署** - 自动识别项目，开箱即用  
✅ **全球 CDN** - 快速内容交付  
✅ **AI 集成** - 原生支持 AI 函数和模型  
✅ **优秀的 DX** - 出色的开发者体验  
✅ **企业级功能** - 从初创到大企业都支持  
✅ **活跃社区** - 大量文档、教程和社区支持  

无论你是构建个人项目、初创应用还是企业级系统，Vercel 都提供了可靠的基础设施和工具。

---

**相关链接**：
- [Vercel 官网](https://vercel.com)
- [Next.js 文档](https://nextjs.org)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [AI SDK 文档](https://ai-sdk.dev)

**最后更新**：2026 年 4 月
