---
title: Claude-Mem：AI代理的持久化内存系统
description: 深入了解Claude-Mem，这个为Claude Code构建的持久化内存压缩系统，如何跨会话保持上下文，实现AI代理的连续性学习。
date: 2026-05-19T00:00:00+08:00
categories: ['AI', 'Claude', '工具']
tags: ['Claude-Code', '内存系统', 'AI代理', 'RAG', '持久化']
keywords: ['Claude-Mem', '持久化内存', 'Claude Code', 'AI代理', '上下文管理']
---

## 什么是Claude-Mem？

[Claude-Mem](https://github.com/thedotmack/claude-mem) 是一个为 Claude Code 构建的**持久化内存压缩系统**，它能够在 AI 代理的多个会话之间无缝地保持和延续上下文。通过自动捕获工具使用观察、生成语义总结，使得 Claude 能够在会话结束后仍然保持对项目的连续性认识。

核心理念很简单但强大：**让你的 AI 代理记住它所做的一切**。

## 项目特性

### 🧠 核心功能

1. **跨会话持久化内存** - 即使会话中断或重新连接，上下文也能保持
2. **智能上下文压缩** - 使用 AI 生成语义总结，优化 token 使用
3. **渐进式信息披露** - 分层显示内存内容，控制 token 成本
4. **技能化搜索** - 通过 `mem-search` 技能使用自然语言查询项目历史
5. **Web 查看器 UI** - 在 `http://localhost:37777` 实时查看内存流
6. **隐私控制** - 使用 `<private>` 标签排除敏感内容
7. **自动运行** - 无需手动干预，自动捕获和管理上下文
8. **引用链接** - 通过 ID 引用过去的观察

### 📊 核心特点

- **77.7k+ Stars** - 在 GitHub 上备受瞩目
- **109+ 贡献者** - 活跃的开源社区
- **多 IDE 支持** - Claude Code、Gemini CLI、OpenCode
- **多语言支持** - 简体中文、繁体中文、日语等
- **Apache 2.0 开源** - 易于嵌入商业系统

## 工作原理

### 系统架构

Claude-Mem 由以下核心组件组成：

```
┌─────────────────────────────────────────────┐
│       5 个生命周期钩子 (Lifecycle Hooks)     │
│  SessionStart → UserPromptSubmit → PostToolUse
│         Stop → SessionEnd                    │
└────────────────┬────────────────────────────┘
                 │
        ┌────────▼────────┐
        │   Worker 服务   │
        │  (HTTP API)     │
        │  Port: 37777    │
        └────────┬────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
      ▼          ▼          ▼
   SQLite    Chroma 向量库  Web 查看器
   数据库     (混合搜索)    (实时 UI)
```

### 工作流程

1. **捕获阶段** - 通过生命周期钩子自动捕获会话中的工具使用和观察
2. **处理阶段** - Worker 服务处理捕获的数据
3. **存储阶段** - 生成语义总结并存储到 SQLite 数据库
4. **检索阶段** - 使用混合搜索（全文 + 向量）从 Chroma 检索相关上下文
5. **注入阶段** - 将相关上下文自动注入到新会话中

### 三层搜索工作流

Claude-Mem 采用高效的三层搜索模式，大幅降低 token 成本：

```
层级 1: search() 
  └─ 获取紧凑索引（50-100 tokens/结果）
     ├─ 支持全文搜索
     ├─ 按类型/日期/项目过滤
     └─ 返回 ID 列表

层级 2: timeline()
  └─ 获取特定观察周围的上下文
     ├─ 时间序列视图
     └─ 帮助理解发生了什么

层级 3: get_observations()
  └─ 仅获取过滤 ID 的完整详情
     ├─ 避免浪费 tokens
     └─ 批量获取多个 ID
```

**效果**：通过分层过滤，可以节省约 **10 倍的 token 成本**！

## 快速开始

### 安装方法

#### 方式一：标准安装（推荐）

```bash
npx claude-mem install
```

#### 方式二：指定 IDE

```bash
# 为 Gemini CLI 安装（自动检测 ~/.gemini）
npx claude-mem install --ide gemini-cli

# 为 OpenCode 安装
npx claude-mem install --ide opencode
```

#### 方式三：从 Claude Code 插件市场安装

```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

#### 方式四：OpenClaw 网关安装

```bash
curl -fsSL https://install.cmem.ai/openclaw.sh | bash
```

重启 Claude Code 后，前一个会话的上下文会自动出现在新会话中。

### 🪟 Windows 用户必读：Bun 安装指南

Claude-Mem 的后台服务依赖 **Bun** 这个 JavaScript 运行时环境。如果你收到 `Bun not found` 或类似错误，请按以下步骤安装：

#### 1️⃣ 安装 Bun（在 PowerShell 中执行）

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

完成后会看到类似提示：
```
The binary is located at C:\Users\<username>\.bun\bin\bun.exe
```

#### 2️⃣ ⚠️ 关键步骤：重启终端

**必须关闭并重启你的 PowerShell 或 Windows Terminal 窗口**，否则系统找不到 bun 命令。新终端会自动加载最新的环境变量。

#### 3️⃣ 验证 Bun 安装

在新终端中运行：
```powershell
bun --version
```

如果显示版本号（如 `1.0.0`），说明安装成功 ✅

#### 4️⃣ 处理依赖问题（如果出现 zod 错误）

如果启动时出现 `Cannot find module 'zod'` 错误，说明缺少依赖包。进入插件脚本目录并安装：

```powershell
cd C:\Users\<username>\.claude\plugins\marketplaces\thedotmack\plugin\scripts
bun add zod
```

如果 PowerShell 仍提示找不到 bun，使用绝对路径：

```powershell
C:\Users\<username>\.bun\bin\bun.exe add zod
```

或者刷新环境变量：

```powershell
$env:PATH = "C:\Users\<username>\.bun\bin;$env:PATH"
```

#### 5️⃣ 启动 Claude-Mem 服务

所有依赖安装完成后，运行：
```bash
npx claude-mem start
```

成功启动后会看到：
```
✓ Worker service running on http://localhost:37777
```

#### 6️⃣ 访问 Web UI

在浏览器中打开：`http://localhost:37777`

你就能看到实时的 AI 记忆界面了！🎉

### 系统要求

- **Node.js**: 18.0.0 或更高
- **Claude Code**: 最新版本，支持插件
- **Bun**: JavaScript 运行时和进程管理器（**Windows 用户必须手动安装，见上文**）
- **uv**: Python 包管理器（用于向量搜索，缺失时自动安装）
- **SQLite 3**: 持久化存储（内置）

#### ⚠️ Windows 常见问题

如果在 Windows 上遇到错误，最常见的原因是：

1. **Bun 未安装或未在 PATH 中** → 按上面的 Windows 安装指南操作
2. **终端未重启** → 关闭并重新打开 PowerShell/Terminal
3. **缺少依赖包** → 运行 `bun add zod` 补充缺失的包
4. **端口被占用** → 改用其他端口：`npx claude-mem start --port 37778`

## 配置

### 模式和语言配置

编辑 `~/.claude-mem/settings.json`：

```json
{
  "CLAUDE_MEM_MODE": "code--zh"
}
```

#### 可用模式

| 模式 | 说明 |
|------|------|
| `code` | 默认英文模式 |
| `code--zh` | 简体中文模式 |
| `code--ja` | 日语模式 |

语言模式遵循模式 `code--[lang]`，其中 `[lang]` 是 ISO 639-1 语言代码。

### 关键配置项

设置位于 `~/.claude-mem/settings.json`：

```json
{
  "CLAUDE_MEM_MODE": "code--zh",
  "AI_MODEL": "claude-3-5-sonnet-20241022",
  "WORKER_PORT": 37777,
  "DATA_DIR": "~/.claude-mem/data",
  "LOG_LEVEL": "info"
}
```

修改模式后需要重启 Claude Code。

## 使用场景

### 1. 长期项目开发

Claude-Mem 特别适合长期项目，在这些项目中：
- 项目历史很重要
- 需要保持设计决策的连续性
- 代码库知识需要在多个会话中累积

### 2. 复杂系统理解

```
会话 1: 初始代码审查 → 理解架构
   │
   ├─ 存储: 系统架构、设计模式、依赖关系
   │
会话 2: 实现新功能 → 自动加载前次学习
   │
   ├─ Claude 已经知道架构！
   ├─ 避免重复解释
   └─ 新建议基于完整上下文
```

### 3. 调试和故障排除

保持过去的调试会话上下文，追踪问题解决过程。

### 4. 文档生成

自动从项目历史中总结和生成文档。

## MCP 搜索工具

Claude-Mem 提供 4 个 MCP 工具用于智能内存搜索：

### 1. `search` 工具
```typescript
search(
  query="认证 bug",
  type="bugfix",
  limit=10
)
// 返回: 紧凑索引 (~50-100 tokens)
```

### 2. `timeline` 工具
```typescript
timeline(
  query="性能优化",
  hours=24
)
// 返回: 时间序列上下文
```

### 3. `get_observations` 工具
```typescript
get_observations(ids=[123, 456, 789])
// 返回: 完整观察详情 (~500-1000 tokens)
```

### 完整搜索示例

```typescript
// 步骤 1: 搜索索引
const index = await search({
  query: "数据库连接问题",
  type: "bug",
  limit: 10
});

// 步骤 2: 审查索引，识别相关 ID
// 例如：#123, #456

// 步骤 3: 仅获取必要的详情
const details = await get_observations({
  ids: [123, 456]
});
```

## 高级特性

### Beta 功能

Claude-Mem 提供 Beta 频道，包含实验性功能，如：

- **Endless Mode** - 仿生记忆架构，用于扩展会话

从 Web 查看器 UI（`http://localhost:37777` → 设置）可在稳定版和 Beta 版之间切换。

### 隐私保护

使用 `<private>` 标签排除敏感内容：

```markdown
<private>
API 密钥: sk-xxxxxxxxxxxx
</private>

这部分不会被存储
```

### 自定义观察元数据

```typescript
{
  "id": "obs-123",
  "timestamp": "2026-05-19T10:30:00Z",
  "type": "bugfix",
  "project": "my-project",
  "summary": "修复登录页面渲染问题",
  "tags": ["authentication", "ui", "critical"]
}
```

## 架构深度解析

### 5 个生命周期钩子

| 钩子 | 触发时机 | 用途 |
|------|---------|------|
| `SessionStart` | 会话开始 | 加载先前的上下文 |
| `UserPromptSubmit` | 用户提交提示 | 捕获用户意图 |
| `PostToolUse` | 工具执行后 | 记录工具输出和结果 |
| `Stop` | 工作中断 | 保存当前状态 |
| `SessionEnd` | 会话结束 | 生成总结，清理资源 |

### SQLite 数据库架构

```sql
-- 会话表
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  project TEXT,
  summary TEXT
);

-- 观察表
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  type TEXT,  -- 'tool_use', 'error', 'insight'
  content TEXT,
  timestamp TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- FTS5 全文搜索索引
CREATE VIRTUAL TABLE observations_fts USING fts5(
  content,
  metadata
);
```

### 混合搜索策略

- **关键字搜索** - FTS5 全文搜索
- **语义搜索** - Chroma 向量数据库
- **时间过滤** - 按日期范围过滤
- **类型分类** - 按观察类型分类

## 与其他工具的比较

| 特性 | Claude-Mem | Mem0 | Supermemory |
|------|-----------|------|-------------|
| 开源 | ✅ | ✅ | ✅ |
| 跨会话上下文 | ✅ | ✅ | ✅ |
| 自动捕获 | ✅ | ✅ | ✅ |
| Claude Code 集成 | ✅ | ❌ | ❌ |
| MCP 工具 | ✅ | ✅ | ❌ |
| 向量搜索 | ✅ (Chroma) | ✅ | ✅ |
| Web UI | ✅ | ❌ | ✅ |
| 本地运行 | ✅ | ✅ | ❌ |

## 常见问题

### Q: Claude-Mem 会存储我的代码吗？

A: Claude-Mem 存储的是观察和总结，而不是原始代码。你可以使用 `<private>` 标签排除敏感内容。

### Q: 支持哪些 IDE？

A: 支持 Claude Code、Gemini CLI、OpenCode 等。

### Q: 数据存储在哪里？

A: 默认存储在 `~/.claude-mem/data/`，这是本地的，不会上传到云端。

### Q: 如何重置内存？

A: 删除 `~/.claude-mem/data/` 目录，重启 Claude Code。

### Q: 支持离线使用吗？

A: 支持！Claude-Mem 完全在本地运行，不需要互联网连接。

## 性能数据

根据官方报告：

- **Token 节省** - 三层搜索模式可节省约 10 倍 token
- **搜索速度** - 本地 SQLite 查询 < 100ms
- **存储成本** - 平均 ~1-5MB/项目（取决于会话长度）
- **内存占用** - Worker 服务 ~50-100MB

## 最佳实践

### 1. 合理使用隐私标签

```markdown
<private>
API_KEY=sk-xxxxxxx
DATABASE_URL=postgresql://...
AWS_SECRET_ACCESS_KEY=...
</private>

这些敏感信息不会被存储
```

### 2. 编写清晰的总结

让观察总结简洁明了，便于未来搜索。

**好的例子**：`修复登录页面的响应式设计问题，改进了移动端体验`

**不好的例子**：`处理了一些 UI 问题`

### 3. 定期清理数据

```bash
# 清理旧观察（>30天）
npm run cleanup --days=30

# 只保留最近 7 天
npm run cleanup --days=7
```

### 4. 使用项目标签

在配置中指定项目名称，方便按项目搜索：

```json
{
  "PROJECT_NAME": "my-awesome-project",
  "PROJECT_TAG": "frontend"
}
```

### 5. 定期备份内存数据

```bash
# 导出所有观察为 JSON
npm run export > backup-$(date +%Y%m%d).json

# 手动备份数据目录
# Windows
xcopy %USERPROFILE%\.claude-mem\data backup\

# macOS/Linux
cp -r ~/.claude-mem/data backup/
```

### 6. Windows 用户的最佳做法

- 📌 **始终使用新的终端窗口** - 在重装软件后，务必关闭并重新打开终端
- 🔧 **保存绝对路径快捷方式** - 把 `C:\Users\<username>\.bun\bin\bun.exe` 加入你的 PowerShell Profile
- 🌐 **检查防火墙** - 确保 localhost:37777 未被防火墙阻止
- 💾 **定期检查端口** - 使用 `netstat -ano | findstr :37777` 检查端口状态

---

## 🚀 快速参考指南

### 日常命令

```bash
# 安装
npx claude-mem install

# 启动服务
npx claude-mem start

# 查看状态
npx claude-mem status

# 查看日志
npx claude-mem logs

# 重启
npx claude-mem restart

# 停止
npx claude-mem stop

# 卸载
npx claude-mem uninstall
```

### 配置文件位置

| 系统 | 路径 |
|------|------|
| Windows | `C:\Users\<username>\.claude-mem\` |
| macOS | `~/.claude-mem/` |
| Linux | `~/.claude-mem/` |

### 关键目录

| 目录 | 用途 |
|------|------|
| `~/.claude-mem/settings.json` | 配置文件 |
| `~/.claude-mem/data/` | SQLite 数据库 |
| `~/.claude/plugins/marketplaces/thedotmack/` | 插件源码 |

### Web UI 功能

- 📊 **观察流** - 实时查看捕获的所有数据
- 🔍 **搜索** - 全文和语义搜索
- 📈 **统计** - 会话统计和数据量分析
- ⚙️ **设置** - 模式切换、版本选择
- 🔗 **引用链接** - 按 ID 访问特定观察

## 故障排除

### ❌ Windows 特定问题

#### 问题: `Bun not found` 或 `bun: command not found`

**根本原因**: Windows 系统还未加载最新的环境变量

**解决方案**（选一种）:

**方案 A：使用绝对路径运行**（最稳妥）
```powershell
C:\Users\<username>\.bun\bin\bun.exe add zod
C:\Users\<username>\.bun\bin\bun.exe install
```

**方案 B：刷新环境变量**（当前会话）
```powershell
$env:PATH = "C:\Users\<username>\.bun\bin;$env:PATH"
bun --version
```

**方案 C：重启终端**（最简单）
- 完全关闭 PowerShell / Windows Terminal 窗口
- 重新打开一个新窗口
- 新窗口会自动加载最新的 PATH

#### 问题: `Cannot find module 'zod'`

**根本原因**: claude-mem 的依赖包缺失

**解决方案**:
```powershell
cd C:\Users\<username>\.claude\plugins\marketplaces\thedotmack\plugin\scripts
bun add zod
```

或者用绝对路径版本:
```powershell
cd C:\Users\<username>\.claude\plugins\marketplaces\thedotmack\plugin\scripts
C:\Users\<username>\.bun\bin\bun.exe add zod
```

重新启动后:
```bash
npx claude-mem start
```

#### 问题: `Error: listen EADDRINUSE: address already in use :::37777`

**根本原因**: 默认端口 37777 已被占用

**解决方案**:
```json
{
  "WORKER_PORT": 37778
}
```

保存到 `~/.claude-mem/settings.json`，然后访问 `http://localhost:37778`

#### 问题: `npm: The term 'npm' is not recognized`

**根本原因**: Node.js 未正确安装或未在 PATH 中

**解决方案**:
1. 下载并安装 [Node.js](https://nodejs.org/)（推荐 LTS 版本）
2. 重启 PowerShell 或 Windows Terminal
3. 验证: `npm --version` 和 `node --version`

---

### 🔍 通用问题

#### 问题: Worker 服务无法启动

**解决方案**:
```bash
# 检查服务是否在运行
npx claude-mem status

# 查看日志
npx claude-mem logs

# 重启服务
npx claude-mem restart
```

#### 问题: 搜索结果不准确

**解决方案**:
- 使用更具体的查询词
- 检查观察是否包含相关关键词
- 重新生成向量索引: `npm run rebuild-index`
- 确保 Chroma 向量库正常运行

#### 问题: Claude Code 无法加载插件

**解决方案**:
```bash
# 完全重新安装
npx claude-mem install --force

# 或手动清理后重装
rm -r ~/.claude/plugins/marketplaces/thedotmack
npx claude-mem install
```

#### 问题: 内存占用过高

**解决方案**:
```bash
# 清理旧观察数据（>30天）
npm run cleanup --days=30

# 重建索引
npm run rebuild-index
```

#### 问题: 搜索功能缓慢

**解决方案**:
- 检查数据库大小: `du -sh ~/.claude-mem/data/`
- 如果超过 500MB，执行清理
- 确保有足够的磁盘空间（建议 1GB+）

## 开发和贡献

### 本地开发设置

```bash
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
npm install
npm run dev
```

#### ⚠️ Windows 开发注意事项

1. **使用 PowerShell 或 Git Bash**，避免使用 cmd.exe
2. **确保 Bun 已安装** - 大部分开发命令都依赖它
3. **文件路径使用正斜杠** - 在脚本中使用 `/` 而不是 `\`

```powershell
# 正确 ✅
npm run dev

# 不使用反斜杠的绝对路径
C:\Users\<username>\.bun\bin\bun.exe run dev
```

### 运行测试

```bash
npm test
npm run test:e2e

# Windows 上如果出现权限问题
npm run test -- --no-sandbox
```

### 生成 Bug 报告

```bash
npm run bug-report
```

### 提交 Pull Request

1. Fork 项目
2. 创建特性分支: `git checkout -b feat/amazing-feature`
3. 提交更改: `git commit -m 'feat: add amazing feature'`
4. 推送到分支: `git push origin feat/amazing-feature`
5. 开启 Pull Request

## 许可证

Claude-Mem 采用 **Apache License 2.0**，便于在开发者工具、本地代理、MCP 服务器、企业系统、机器人和生产代理中嵌入。

选择 Apache 2.0 是因为持久的代理内存应该易于嵌入到各种系统中。

## 社区和支持

- **官方文档**: [docs.claude-mem.ai](https://docs.claude-mem.ai/)
- **GitHub Issues**: [Report bugs](https://github.com/thedotmack/claude-mem/issues)
- **官方 X 账号**: [@Claude_Memory](https://x.com/Claude_Memory)
- **Discord 社区**: [Join Server](https://discord.com/invite/J4wttp9vDu)
- **作者**: Alex Newman ([@thedotmack](https://github.com/thedotmack))

## 总结

Claude-Mem 是一个革命性的工具，解决了 AI 代理在跨会话保持上下文的根本问题。通过智能的内存压缩、渐进式信息披露和混合搜索，它使得 AI 代理能够真正"记住"它所做的一切。

无论你是在进行长期项目开发，还是需要复杂系统的连续上下文，Claude-Mem 都能显著提升工作效率。最棒的是，它完全在本地运行，开源免费，支持多种 IDE。

### 🪟 Windows 用户快速开始

如果你在 Windows 上，按这个顺序执行：

```powershell
# 1️⃣ 安装 Bun（如果还没有）
powershell -c "irm bun.sh/install.ps1 | iex"

# 2️⃣ 重启 PowerShell（关闭再打开）

# 3️⃣ 验证安装
bun --version

# 4️⃣ 安装 Claude-Mem
npx claude-mem install

# 5️⃣ 重启 Claude Code

# 6️⃣ 启动 Worker 服务
npx claude-mem start

# 7️⃣ 打开浏览器访问
# http://localhost:37777
```

**遇到问题？** 参考上面的"故障排除"部分，特别是 Windows 特定问题。

### 🚀 立即开始

```bash
npx claude-mem install
```

然后重启 Claude Code，享受跨会话的持久内存！

---

**相关资源**:
- [Claude-Mem GitHub 仓库](https://github.com/thedotmack/claude-mem)
- [官方文档](https://docs.claude-mem.ai/)
- [Claude Code 官方网站](https://claude.com/claude-code)
- [Discord 社区](https://discord.com/invite/J4wttp9vDu)

**更新日期**: 2026-05-19  
**版本**: Claude-Mem v13.2.0 及以上

