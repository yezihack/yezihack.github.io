---
title: "Claude Code 完整入门手册：安装、配置与实战指南"
date: 2026-04-03
draft: false
description: "详细讲解如何在Windows、Linux、Mac上安装配置Claude Code，集成国内大模型，以及使用MCP、Agents、Skills打造专业开发环境"
keywords: ["Claude Code", "AI编程", "MCP", "Agents", "Skills"]
categories: ["开发工具", "AI编程"]
tags: ["Claude Code", "Anthropic", "MCP", "智谱GLM", "开发指南"]
---

## 简介

Claude Code 是 Anthropic 推出的代理编码工具，可在终端、VS Code、JetBrains IDE、桌面应用和浏览器中使用。它能够读取代码库、编辑文件、运行命令，并与开发工具集成，帮助你快速构建功能、修复bug和自动化开发任务。

本手册将详细讲解如何在各操作系统上安装配置Claude Code，并深度集成国内大模型和各类开发工具。

---

## 第一部分：环境准备与基础安装

### 1.1 前置环境要求

#### Windows

- Windows 10 或更高版本
- Git for Windows （必需）
- PowerShell 或 CMD
- Node.js 14+ （可选，但推荐）

#### macOS

- macOS 10.12 或更高版本
- Xcode Command Line Tools
- Homebrew （推荐）
- Node.js 14+ （可选）

#### Linux

- Ubuntu 18.04+ 或其他主流发行版
- curl 或 wget
- Node.js 14+ （可选）

### 1.2 Node.js 安装与配置

在安装Claude Code之前，建议先安装Node.js的包管理工具，以便支持更多功能。

**Windows (msi/二进制):**

1. 下载 [Node.js 安装包](https://nodejs.org/en/download/)

2. 运行安装程序，选择LTS版本（推荐）

3. 安装完成后，打开命令提示符或PowerShell，验证安装：!
  
![20260405192352](https://cdn.jsdelivr.net/gh/yezihack/assets/b/20260405192352.png)

1. 验证

```bash
node -v
npm -v
```

**Windows (PowerShell):**

```powershell
# 使用winget安装（推荐）
winget install OpenJS.NodeJS

# 或使用Chocolatey
choco install nodejs

# 验证安装
node --version
npm --version
```

**macOS:**

```bash
# 使用Homebrew安装（推荐）
brew install node

# 或使用MacPorts
sudo port install nodejs20

# 验证安装
node --version
npm --version
```

**Linux (Ubuntu/Debian):**

```bash
# 使用包管理器
sudo apt-get update
sudo apt-get install nodejs npm

# 或使用NodeSource官方仓库（获得最新版本）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**Linux (Fedora/CentOS):**

```bash
sudo dnf install nodejs npm
# 或
sudo yum install nodejs npm
```

设置国内NPM镜像（加快安装速度）：

```bash
npm config set registry https://registry.npmmirror.com
npm config set disturl https://registry.npmmirror.com/dist
npm config set sass_binary_site https://registry.npmmirror.com/mirrors/node-sass
```

### 1.3 Claude Code 安装

#### 方式一：官方安装脚本（推荐）

**macOS 和 Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell:**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

#### 方式二：包管理器安装

**macOS (Homebrew):**

```bash
brew install anthropic/claude-code/claude-code
```

**Windows (WinGet):**

```powershell
winget install Anthropic.ClaudeCode
```

#### 方式三：手动安装

1. 从 [code.claude.com](https://code.claude.com) 下载最新版本
2. 解压到指定目录
3. 将 `bin` 目录添加到系统 PATH

### 1.4 启动 Claude Code

安装完成后，进入任何项目目录启动：

```bash
cd your-project
claude
```

首次启动时，系统会提示you登录。根据你的需求选择：

- **Claude 订阅** - 需要 Claude.ai 账户
- **Anthropic API** - 需要 Anthropic 控制台 API Key
- **第三方提供商** - 支持集成其他AI服务

---

## 第二部分：集成国内大模型

### 2.1 智谱 GLM-5 集成

智谱 GLM-5 是国内最强大的通用大模型之一，与Claude代码兼容性很好。

#### 获取API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn)
2. 注册或登录账户
3. 创建 API Key
4. 复制并保存密钥

#### 配置 Claude Code

**方式一：环境变量配置**

Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your-zhipu-api-key"
$env:ANTHROPIC_API_BASE="https://open.bigmodel.cn/api/paas/v4"
$env:ANTHROPIC_MODEL="glm-5"
```

Linux/macOS:

```bash
export ANTHROPIC_API_KEY="your-zhipu-api-key"
export ANTHROPIC_API_BASE="https://open.bigmodel.cn/api/paas/v4"
export ANTHROPIC_MODEL="glm-5"
```

**方式二：全局配置文件**

编辑 `~/.claude/settings.json`:

```json
{
  "model": "glm-5",
  "apiKey": "your-zhipu-api-key",
  "apiBase": "https://open.bigmodel.cn/api/paas/v4",
  "env": {
    "ANTHROPIC_API_KEY": "your-zhipu-api-key",
    "ANTHROPIC_API_BASE": "https://open.bigmodel.cn/api/paas/v4"
  }
}
```

**方式三：项目级配置**

在项目根目录创建 `.claude/settings.json`:

```json
{
  "model": "glm-5",
  "apiBase": "https://open.bigmodel.cn/api/paas/v4"
}
```

### 2.2 其他国内大模型支持

#### 阿里 Qwen 系列

```json
{
  "model": "qwen-max",
  "apiBase": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "your-qwen-api-key"
}
```

#### 百度 文心一言

```json
{
  "model": "ernie-bot-4",
  "apiBase": "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/chat",
  "apiKey": "your-baidu-api-key"
}
```

#### FastAPI 本地部署

```json
{
  "model": "local-model",
  "apiBase": "http://localhost:8000",
  "apiKey": "optional-key"
}
```

### 2.3 成本优化建议

创建 `~/.claude/settings.json` 进行模型选择优化：

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

**配置说明：**

- `model: sonnet` - 使用 Sonnet（成本低约60%，处理大部分任务）
- `MAX_THINKING_TOKENS: 10000` - 限制思考tokens，降低成本70%
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: 50` - 更早压缩上下文
- `CLAUDE_CODE_SUBAGENT_MODEL: haiku` - 子代理用Haiku（最便宜）

### 2.4 模型切换命令

在Claude Code会话中直接切换模型：

```bash
# 查看当前模型
/settings

# 临时切换到Opus（深度推理）
/model opus

# 临时切换到Sonnet（日常任务）
/model sonnet

# 查看成本
/cost
```

---

## 第三部分：Everything Claude Code 插件

Everything Claude Code 是社区维护的超强插件集，包含38个agents、156个skills和72个命令。

### 3.1 快速安装

#### 方式一：插件形式安装（推荐）

```bash
# 添加marketplace
/plugin marketplace add affaan-m/everything-claude-code

# 安装插件
/plugin install everything-claude-code@everything-claude-code
```

#### 方式二：克隆仓库安装

```bash
# 克隆项目
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# 安装依赖
npm install

# Windows PowerShell（完整安装）
.\install.ps1 --profile full

# 或仅安装特定语言
.\install.ps1 typescript python golang

# macOS/Linux
./install.sh --profile full
./install.sh typescript python golang
```

### 3.2 核心功能清单

#### 代理（38个）

- **planner.md** - 功能实现规划
- **architect.md** - 系统设计决策
- **code-reviewer.md** - 代码质量评审
- **security-reviewer.md** - 安全漏洞分析
- **tdd-guide.md** - 测试驱动开发
- **build-error-resolver.md** - 构建错误修复
- **e2e-runner.md** - 端到端测试
- **refactor-cleaner.md** - 死代码清理
- **语言特定reviewer** - Python/Go/Rust/Kotlin等

#### 技能（156个）

- **前端patterns** - React/Next.js最佳实践
- **后端patterns** - API设计、数据库、缓存
- **测试框架** - pytest、Jest、Spring Boot测试
- **DevOps** - Docker、Kubernetes、CI/CD
- **文档** - 文档同步、API reference
- **内容创建** - 文章写作、社交媒体
- **市场研究** - 竞争对手分析
- **数据工程** - ClickHouse、PostgreSQL优化

#### 命令（72个）

```bash
# 规划与设计
/plan "Add user authentication" # 需求分析-> 风险评估-> 制作实现计划 
/architect "Design database schema"

# 开发流程
/tdd "Design test cases" # 强制 TDD 流程： 先写测试-》再实现-》验证覆盖率 > 80%
/code-review "Review my implementation" # 安全扫描、质量审查
/build-fix "Fix compilation errors" # 修复编译错误
/e2e "Generate Playwright tests"

# 学习与优化
/learn "Extract patterns from session"
/learn-eval "Evaluate patterns"
/verify "Run verification loop" # 全面验证整个代码库， 包括：构建，测试，安全

# 多模型编排
/multi-plan "Decompose complex task"
/multi-execute "Execute with team"
/multi-backend "Backend-focused workflow"
/multi-frontend "Frontend-focused workflow"

# 工具集成
/setup-pm "Configure package manager"
/skill-create "Generate skills from git" # 分析你的 git 历史，自动提取编程模式并生成 SKILL.md
/pm2 "Manage services with PM2"

# 持续学习
/instinct-status "View learned patterns"
/instinct-export "Export instincts"
/instinct-import "Import from others"
/evolve "Cluster into skills"
```

### 3.3 Rules 安装（必须）

Claude Code插件无法自动分发rules，需要手动安装：

```bash
# 仅安装通用rules
mkdir -p ~/.claude/rules
cp -r everything-claude-code/rules/common ~/.claude/rules/

# 或安装特定语言的rules
cp -r everything-claude-code/rules/typescript ~/.claude/rules/
cp -r everything-claude-code/rules/python ~/.claude/rules/
cp -r everything-claude-code/rules/golang ~/.claude/rules/

# 项目级安装（当前项目优先）
mkdir -p .claude/rules
cp -r everything-claude-code/rules/common .claude/rules/
cp -r everything-claude-code/rules/typescript .claude/rules/
```

### 3.4 Hooks 配置

复制 hooks 到 `~/.claude/settings.json`:

```bash
# 查看hooks
cat everything-claude-code/hooks/hooks.json

# 复制全部hooks到settings.json的hooks字段
```

### 3.5 MCP 服务器配置

从 `everything-claude-code/mcp-configs/mcp-servers.json` 中选择需要的机器人：

常用MCP服务器：

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-url",
        "SUPABASE_KEY": "your-key"
      }
    }
  }
}
```

---

## 第四部分：Skills 体系详解

Claude Skills 是可复用的工作流定义，教会Claude如何执行特定任务。

### 4.1 官方Skills市场

访问 [https://www.claudeskill.site/zh/skills](https://www.claudeskill.site/zh/skills) 浏览209个技能。

#### 按类别推荐

**开发工具类**

- **mcp-builder** - 创建高质量MCP服务器
- **frontend-design** - 构建生产级前端界面
- **web-artifacts-builder** - React/Tailwind多组件制作
- **skill-creator** - 创建自定义Skills
- **postgresql** - PostgreSQL数据库操作

**文档处理类**

- **docx** - Word文档创建/编辑
- **pdf** - PDF文本提取、合并
- **pptx** - 幻灯片制作
- **xlsx** - 电子表格处理
- **doc-coauthoring** - 文档共创流程

**研究与分析类**

- **research-lookup** - 当前信息查询
- **scientific-writing** - 学术论文写作
- **market-research** - 市场竞争分析
- **content-research-writer** - 带引用的内容创作

**创意内容类**

- **canvas-design** - 海报设计
- **theme-factory** - 主题应用
- **slack-gif-creator** - Slack GIF动画

### 4.2 第三方Skills库

#### Everything Claude Code Skills

```bash
# 已包含在installation中，常用skills：
# continuous-learning-v2 - 自动学习patterns
# frontend-patterns - React最佳实践  
# backend-patterns - API/数据库patterns
# security-scan - 安全审计
# tdd-workflow - 测试驱动开发
```

#### Awesome Claude Skills（ComposioHQ维护）

访问 [https://github.com/ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)

包含78个Composio应用自动化Skills：

**CRM & 销售**

- HubSpot/Salesforce/Pipedrive/Zoho automation

**项目管理**

- Asana/Jira/Linear/Notion/Todoist/Trello

**沟通协作**

- Slack/Gmail/Microsoft Teams/Discord

**DevOps & 代码**

- GitHub/GitLab/CircleCI/Datadog/Sentry

**工作流自动化**

- Make/n8n/Zapier集成

### 4.3 安装与使用Skills

#### 从Claude.ai添加

1. 点击界面中的技能图标（🧩）
2. 搜索或浏览Marketplace
3. 点击"Add"添加技能
4. Claude自动激活相关技能

#### 从Claude Code添加

```bash
# 将skill放入配置目录
mkdir -p ~/.claude/skills/
cp -r skill-name ~/.claude/skills/

# 验证skill元数据
head ~/.claude/skills/skill-name/SKILL.md

# 启动Claude Code会话（自动加载）
claude
```

#### 通过API使用Skills

```python
import anthropic

client = anthropic.Anthropic(api_key="your-key")

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    skills=["frontend-design", "research-lookup"],
    messages=[{
        "role": "user",
        "content": "Create a landing page for a SaaS product analyzing climate data"
    }]
)
```

### 4.4 创建自定义Skill

**基础Skill模板**

创建 `my-skill/SKILL.md`:

```markdown
---
name: my-awesome-skill
description: 简洁描述这个skill的用途和何时使用
keywords: ["keyword1", "keyword2"]
---

# My Awesome Skill

完整描述skill的功能和能力。

## 何时使用此Skill

- 使用场景1
- 使用场景2
- 使用场景3

## 使用说明

详细的Claude执行此skill的指导（写给Claude，不是写给用户）

## 示例

展示此skill实际应用的例子
```

安装自定义skill：

```bash
cp -r my-skill ~/.claude/skills/
```

### 4.5 避免技能重复的最佳实践

**核心原则：不重复安装**

```bash
# ✅ 只安装一次通用技能
# example-skills 已包含于 everything-claude-code
# document-skills 已包含于 everything-claude-code

# ❌ 避免重复
# 不要同时安装 anthropic-agent-skills 和 everything-claude-code
# 不要同时安装 awesome-claude-skills 的duplicate skills

# 检查已安装技能
ls ~/.claude/skills/

# 清理重复技能
rm -rf ~/.claude/skills/skill-name  # 保留最常用的版本
```

推荐安装顺序：

1. **第一层** - everything-claude-code（最全、最新）
2. **第二层** - Composer HQ awesome-claude-skills（补充）
3. **第三层** - 官方skills（必要时）

---

## 第五部分：MCP (Model Context Protocol)

MCP 是一个开放标准，让AI模型可以访问外部工具和数据源。

### 5.1 MCP核心概念

**关键概念**

- **Servers** - 暴露tools/resources的服务
- **Tools** - Claude可以调用的可执行操作
- **Resources** - 外部数据源（文件、API、数据库）
- **Prompts** - 预定义的提示模板

### 5.2 配置MCP服务器

编辑 `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxx"
      }
    },
    
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/mydb"
      }
    },
    
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"]
    },
    
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_KEY": "eyxxx"
      }
    },

    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "https://xxx.upstash.io",
        "UPSTASH_REDIS_REST_TOKEN": "xxx"
      }
    }
  }
}
```

### 5.3 常用MCP服务器

| MCP服务器 | 功能 | 安装 |
|----------|------|------|
| **github** | GitHub repositories、issues、PRs | `npx @modelcontextprotocol/server-github` |
| **postgres** | SQL查询数据库 | `npx @modelcontextprotocol/server-postgres` |
| **supabase** | Supabase数据库和API | `npx @modelcontextprotocol/server-supabase` |
| **memory** | 持久化会话记忆 | `npx @modelcontextprotocol/server-memory` |
| **context7** | Redis/Upstash集成 | `npx @upstash/context7-mcp` |
| **sequential-thinking** | 深度推理 | `npx @anthropic-ai/mcp-server-sequential-thinking` |

### 5.4 创建自定义MCP服务器

**Python FastMCP方案**

```python
from fastmcp import FastMCP
from typing import Any

app = FastMCP("my-service")

@app.tool()
def analyze_code(code: str) -> str:
    """分析代码质量"""
    return f"分析结果: {code[:50]}..."

@app.resource("file:///{path}")
def read_file(path: str) -> str:
    """读取文件内容"""
    with open(path) as f:
        return f.read()

if __name__ == "__main__":
    app.run()
```

**TypeScript SDK方案**

```typescript
import { MCPServer, Tool } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new MCPServer({
  name: "my-service",
  version: "1.0.0"
});

server.tool("analyze_code", {
  description: "分析代码质量",
  inputSchema: {
    type: "object",
    properties: {
      code: { type: "string" }
    }
  },
  execute: async (args) => {
    return `分析结果: ${args.code.substring(0, 50)}...`;
  }
});

server.start();
```

注册到Claude Code：

```json
{
  "mcpServers": {
    "my-service": {
      "type": "stdio",
      "command": "python",
      "args": ["path/to/my_service.py"]
    }
  }
}
```

---

## 第六部分：Agents 与多代理协调

### 6.1 什么是Agents

Agents 是具有特定角色和专业领域的子AI助手。每个Agent有：

- **专业知识** - 特定领域的instructions
- **工具集** - 可用的工具/能力
- **上下文** - 保存的状态和记忆
- **目标** - 专项任务目标

### 6.2 内置Agents概览

Everything Claude Code 的38个agents：

| Agent | 用途 |
|--------|------|
| **planner** | 分解功能、制订实现计划 |
| **architect** | 系统设计、技术架构决策 |
| **code-reviewer** | 代码质量、可维护性评审 |
| **security-reviewer** | 安全漏洞、攻击面分析 |
| **tdd-guide** | TDD流程、测试设计 |
| **build-error-resolver** | 编译/构建错误修复 |
| **e2e-runner** | Playwright E2E测试 |
| **refactor-cleaner** | 死代码移除、重构 |
| **doc-updater** | 文档同步 |
| **python-reviewer** | Python代码专项审查 |
| **go-reviewer** | Go代码专项审查 |
| **rust-reviewer** | Rust代码专项审查 |
| **typescript-reviewer** | TypeScript代码审查 |

### 6.3 双Agent编程范式

**协调模式：Planner + Executor**

```bash
# 1. 使用Planner设计方案
/planner "Add OAuth2 authentication to Next.js app"

# 2. Claude会生成详细计划
# - 选择OAuth提供商
# - 实现flow
# - 处理token管理
# - 添加错误处理
# - 编写测试

# 3. 执行实现
# Claude自动实现每个步骤

# 4. 使用Code-Reviewer审查
/code-review "Review my OAuth implementation"

# 5. 修复发现的问题
```

### 6.4 多Agent编排

启用高级多Agent协调：

```json
{
  "features": {
    "multi_agent": true,
    "agent_delegation": true,
    "context_sharing": true
  },
  "agents": {
    "planner": {
      "role": "system designer",
      "model": "opus",
      "max_iterations": 5
    },
    "executor": {
      "role": "implementation",
      "model": "sonnet",
      "max_iterations": 10
    },
    "reviewer": {
      "role": "quality gate",
      "model": "opus",
      "max_iterations": 3
    }
  }
}
```

使用多Agent命令：

```bash
# 智能分解复杂任务
/multi-plan "Build production-grade REST API with auth, database, tests, deployment"

# 协调执行
/multi-execute

# 后端specific流程
/multi-backend "Implement microservices with Docker, K8s, monitoring"

# 前端specific流程
/multi-frontend "Build React dashboard with real-time data, charts, exports"
```

### 6.5 创建自定义Agent

创建 `~/.claude/agents/my-agent.md`:

```markdown
---
name: my-specialized-agent
description: 专注于特定领域的agent
model: opus
tools: ["Read", "Grep", "Bash", "Edit"]
---

# My Specialized Agent

你是一个专营X领域的专家AI助手。

## 专业领域

详细描述你的专业领域和特殊能力。

## 工作流程

列出你处理任务的标准流程：

1. 第一步 - ...
2. 第二步 - ...
3. 第三步 - ...

## 专业知识点

- 关键概念1及最佳实践
- 关键概念2及常见坑
- 关键概念3及性能优化

## 通信风格

你应该如何与用户沟通（正式/非正式/技术性等）
```

---

## 第七部分：完整使用工作流

### 7.1 从零开始构建功能

**场景：构建用户认证系统**

```bash
# 1. 进入项目
cd my-project
claude

# 2. 制订计划
/multi-plan "Implement OAuth2 + JWT authentication for REST API"

# 3. 查看生成的计划
# Claude会分解为10+具体任务

# 4. 执行实现
/multi-execute

# 5. 运行测试
npm test

# 6. 代码审查
/code-review

# 7. 安全审计  
/security-scan

# 8. 创建提交
git add .
git commit -m "feat: OAuth2 authentication"
git push

# 9. 提交PR
gh pr create --title "OAuth2 Authentication System"
```

### 7.2 Bug修复工作流

```bash
# 1. 启动调试
claude

# 2. 分析错误
# Claude自动读取错误日志、堆栈跟踪

# 3. 诊断根因
/root-cause-tracing "Debug memory leak in event listeners"

# 4. 实现修复
# Claude生成修复代码

# 5. 验证修复
npm test
npm run dev  # 本地测试

# 6. TDD流程（未来bug预防）
/tdd "Design tests for this component"
/e2e "Generate integration tests"
```

### 7.3 代码重构工作流

```bash
# 1. 启动重构会话
claude

# 2. 分析现有代码
/semantic-analysis "Analyze this codebase for improvements"

# 3. 制订重构计划
/plan "Refactor authentication module for testability and performance"

# 4. 自动清理
/refactor-clean "Remove dead code and unused dependencies"

# 5. 迁移到新模式
/code-migration "Migrate from Redux to TanStack Query"

# 6. 完整测试
/verify  # 运行lint、test、typecheck、security scan

# 7. 性能对比
/benchmark "Compare performance before and after"
```

### 7.4 文档维护工作流

```bash
# 1. 启动会话
claude

# 2. 自动更新API文档
/update-docs "Sync API documentation with code changes"

# 3. 生成changelog
/changelog-generator

# 4. 创建migration指南
/doc-coauthoring "Write migration guide from v2 to v3"

# 5. 发布变更
git add docs/ CHANGELOG.md
git commit -m "docs: Update API documentation"
```

---

## 第八部分：高级优化技巧

### 8.1 Token成本优化

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

成本对比：

- Opus全职 = 基准成本
- Sonnet全职 = 基准成本的40%
- 上述配置 = 基准成本的13% (40% *深度思考降低* 子agent降低)

### 8.2 上下文管理技巧

```bash
# 每个无关任务之间清理context
/clear

# 在逻辑断点压缩context  
/compact

# 只在新会话启用高思考
/model opus  # 仅用于架构决策

# 学习完毕后导出instincts
/instinct-export > my-team-instincts.json

# 其他人导入
/instinct-import ./my-team-instincts.json
```

### 8.3 持续学习系统

```bash
# 会话中自动学习patterns
/learn "Extract best practices from this session"

# 评估patterns质量
/learn-eval "Grade and store high-confidence patterns"

# 查看学到的patterns
/instinct-status

# 导出供团队使用
/instinct-export

# 集群相关patterns为skills
/evolve "Turn learned instincts into reusable skills"
```

### 8.4 团队协作配置

```json
{
  "sharedContext": {
    "teamRules": ".claude/team-rules.md",
    "architecture": "docs/ARCHITECTURE.md",
    "conventions": "docs/CONVENTIONS.md"
  },
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "team-token"
      }
    }
  }
}
```

---

## 第九部分：故障排除

### 常见问题

**问题1：API连接失败**

```bash
# 验证API Key
$env:ANTHROPIC_API_KEY  # Windows PowerShell

# 测试连接
curl -X GET https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY"

# 检查network
ping api.anthropic.com
```

**问题2：Plugin无法加载**

```bash
# 清除插件缓存
rm -rf ~/.claude/plugins-cache

# 重新启动Claude Code
claude

# 验证installation
/plugin list
```

**问题3：MCP服务器连接超时**

```json
// 增加超时时间
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "...",
        "TIMEOUT": "30000"  // 30秒
      }
    }
  }
}
```

**问题4：Token限额超出**

```bash
# 查看成本
/cost

# 切换到更便宜的模型
/model sonnet

# 压缩context
/compact

# 清理旧会话
/sessions  # 列出所有会话
# 垃圾回收旧会话内存
```

---

## 总结与资源

### 核心要点回顾

✅ **三步启动**

1. 安装Node.js和Claude Code
2. 配置大模型API (智谱GLM-5推荐)
3. 安装Everything Claude Code插件

✅ **三层能力扩展**

1. **Skills** - 工作流模板库
2. **MCP** - 外部工具集成
3. **Agents** - 专业协作伙伴

✅ **三个必装插件包**

1. everything-claude-code (通用最强)
2. awesome-claude-skills (补充)
3. 行业特定skills (按需)

✅ **成本优化到13%** - 通过Sonnet + 思考token限制 + 子agent折扣

### 推荐资源

**官方文档**

- [Claude Code官方文档](https://code.claude.com/docs/zh-CN/) - 各语言详细指南
- [Anthropic API文档](https://docs.anthropic.com/) - API参考

**社区资源**

- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) - 最全插件包
- [Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills) - 社区skills合集
- [Claude Skills市场](https://www.claudeskill.site/zh/skills) - 209个官方skills

**学习资源**

- [Shorthand Guide](https://github.com/affaan-m/everything-claude-code/blob/main/the-shorthand-guide.md) - 快速入门指南
- [Longform Guide](https://github.com/affaan-m/everything-claude-code/blob/main/the-longform-guide.md) - 深度进阶指南
- [Security Guide](https://github.com/affaan-m/everything-claude-code/blob/main/the-security-guide.md) - 安全最佳实践

**国内大模型**

- [智谱GLM-5](https://open.bigmodel.cn) - 国内最强开源模型
- [阿里Qwen](https://dashscope.aliyuncs.com) - 通义千问系列
- [百度文心一言](https://console.bce.baidu.com/qianfan/ais) - 文心一言API

---

## 快速参考卡

### 常用命令列表

```bash
# 基础
claude                          # 启动会话
/clear                         # 清理context
/model sonnet                  # 切换模型
/cost                          # 查看费用

# 规划与设计  
/plan "your task"              # 制订实现计划
/architect "design task"       # 系统设计
/tdd "feature"                 # 测试驱动开发

# 开发工作流
/code-review                   # 代码审查
/security-review               # 安全审查
/build-fix                     # 修复构建错误
/e2e "test spec"              # E2E测试生成

# 持续学习
/learn                         # 提取patterns
/instinct-status               # 查看学习内容
/instinct-export               # 导出patterns
/evolve                        # 聚类为skills

# 多模型协调
/multi-plan                    # 多agent规划
/multi-execute                 # 多agent执行
/multi-backend                 # 后端工作流
/multi-frontend                # 前端工作流

# 插件与集成
/plugin list                   # 列表已安装插件
/plugin install X@X            # 安装插件
/settings                      # 查看配置
```

### 快速配置模板

```json
// ~/.claude/settings.json 标准配置
{
  "model": "sonnet",
  "apiKey": "your-api-key",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  },
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "xxx"}
    }
  },
  "rules": [".claude/rules"],
  "skills": [".claude/skills"]
}
```

祝你使用Claude Code愉快！🚀
