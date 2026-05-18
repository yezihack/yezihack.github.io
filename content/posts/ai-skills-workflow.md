---
title: "AI Skills 完全指南：把 AI 纳入标准工程流程"
date: 2026-05-18T10:00:00+08:00
lastmod: 2026-05-18T10:00:00+08:00
draft: false
tags: ["AI", "Claude", "Skills", "工程流程", "开发工作流"]
categories: ["AI工程化", "开发工具"]
author: "百里"
comment: false
toc: true
reward: true
---

> 这不是一个命令参考。这是关于**如何把 AI 纳入标准软件工程流程**的完整指南。

很多人安装完 `/grill-me`、`/tdd`，然后陷入迷茫：**这些 Skill 怎么融入真实开发？**

本文给你一套真正能落地的工作流。

---

## 为什么需要 Skills？

Matt Pocock 的 [AI Skills 仓库](https://github.com/mattpocock/skills) 的真正价值不在于**命令本身**，而在于：

> **把隐性的工程经验显式化，变成 AI 可执行的工作流**

以前，只有资深工程师脑子里有：

- 如何拆需求
- 如何调试 Bug
- 如何重构混乱代码
- 如何设计架构

现在，这些知识被编码成了 Skills，可以被 AI 执行。

这就是 **AI Native Development** 的开始。

---

## 第一部分：新项目开发（最标准的使用方式）

新项目是 Skills 最适合的场景。

### ❌ 大多数人的错误方式

直接告诉 AI：

```txt
帮我做一个 AI 导航站
```

结果：

- AI 直接开写代码
- 技术栈随意选择
- 数据库表结构混乱
- 后面疯狂返工

这就是著名的 **Vibe Coding**（感觉编程）。

### ✅ 正确方式：5 个阶段工作流

---

### 阶段 1：`/grill-me` - 需求澄清

开发前，先：

```txt
/grill-me

我要做一个 AI 导航站
```

AI 会进入**盘问模式**，问你一系列问题：

- 用户是否需要登录？
- 是否支持收藏功能？
- 是否支持分类？
- 导航数据谁维护？
- 是否支持 SEO？
- 移动端优先吗？
- 是否支持分享？

**关键洞察**：需求开始"工程化"。

你会从模糊的想法走向清晰的需求边界。

---

### 阶段 2：`/grill-with-docs` - 架构与术语统一

继续：

```txt
/grill-with-docs
```

AI 会生成完整的文档集：

```txt
docs/
  ├── PRD.md              # 产品需求文档
  ├── CONTEXT.md          # 术语与上下文
  ├── ARCHITECTURE.md     # 架构设计
  └── ADR/                # 架构决策记录
```

**最关键的是 CONTEXT.md**。例如：

```markdown
# 项目术语

**Tool**：导航中的一个网站项目

**Collection**：用户收藏夹

**Spotlight Search**：顶部聚合搜索

**Curator**：导航维护者
```

这极其重要。为什么？

因为如果没有术语统一，后续 AI 开发时会出现：

- `tool` 一会儿叫 `website`
- 一会儿叫 `item`
- 一会儿叫 `product`

在大项目中，**术语混乱 = 灾难**。

---

### 阶段 3：`/to-prd` - PRD 生成

继续：

```txt
/to-prd
```

生成完整的产品需求文档：

```markdown
# 用户故事

## 用户故事 1
作为一个用户
我希望能收藏网站
以便快速访问我喜欢的资源

验收标准：
- 用户可以点击"收藏"按钮
- 收藏的网站会出现在"我的收藏"中
- 用户可以取消收藏

## 非功能需求
- 页面加载时间 < 2s
- 支持 SEO
- 移动端响应式
```

这一步非常适合：**产品经理 + AI 协作**。

---

### 阶段 4：`/to-issues` - 任务分解

```txt
/to-issues
```

AI 会自动拆分任务。但要注意：

#### ❌ 错误的拆法（按技术层）

```txt
- 前端开发
- 后端开发
- 数据库设计
```

这样拆出来的任务彼此依赖，互相阻塞。

#### ✅ 正确的拆法（Vertical Slice 垂直切片）

```txt
- 实现用户登录全链路（前端 UI + 后端 API + 数据库）
- 实现导航收藏全链路
- 实现搜索功能全链路
- 实现分享功能全链路
```

每个 Issue 都是一个**完整的端到端功能**。

这就是现代敏捷开发的核心思想：**垂直切片**。

好处：

- 每个 Issue 可以独立开发
- 可以更早集成和测试
- 降低集成风险
- 更容易并行开发

---

### 阶段 5：`/tdd` - 开发与测试

正式进入开发：

```txt
/tdd

实现用户登录全链路
```

AI 会自动执行：

```txt
1. 先写测试（RED）- 测试失败
2. 写最小实现使测试通过（GREEN）
3. 重构改进代码（REFACTOR）
4. 验证覆盖率 >= 80%
```

这样做的好处：

- 防止 AI 一次生成 5000 行垃圾代码
- 代码天生就有测试覆盖
- 重构时有保障
- 需求变化时容易修改

---

### 完整新项目工作流总结

```
需求阶段:
  /grill-me          → 澄清需求
  /grill-with-docs   → 统一术语和架构

规划阶段:
  /to-prd            → 生成 PRD
  /to-issues         → 拆分任务

开发阶段:
  /tdd               → TDD 开发
```

**最终输出**：

```txt
你的项目
├── docs/
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── PRD.md
│   └── ADR/
├── issues/          # 结构化任务
├── tests/           # 完整的测试
└── src/             # 清晰的代码
```

这已经是**真正的软件工程流程**，不是"聊天生成代码"。

---

## 第二部分：旧项目改造（可能比新项目更有价值）

很多人误以为 Skills 只能用于新项目。

**实际上，旧项目的价值更大。**

---

### 场景 1：接手"屎山项目"

你继承了一个混乱的 Go 项目：

```txt
/improve-codebase-architecture

分析当前的 Go 后端
```

AI 会系统地分析：

```txt
问题：
- Handler 层太重（1000+ 行）
- Service 层高度耦合
- Repo 层混乱（直接 SQL）
- 缺失 DTO 层
- 存在循环依赖
- 错误处理不一致

改进方案：
1. 提取 DTO
2. 拆分 Service（单一职责）
3. 规范 Repo 接口
4. 引入依赖注入
5. 统一错误码

重构顺序：
  第一阶段：提取 DTO
  第二阶段：规范 Repo
  第三阶段：拆分 Service
  第四阶段：补充单测

风险分析：
  - 需要保持 API 兼容
  - 需要增加集成测试
  - 可以分段发布
```

这特别适合 Go 后端的改造（也是你当前的方向）。

---

### 场景 2：老项目没有文档

接手一个没有文档的项目，一头雾水？

```txt
/grill-with-docs

分析这个项目的架构
```

AI 会：

1. 自动分析代码结构
2. 生成 `CONTEXT.md`（术语词汇表）
3. 生成 `ARCHITECTURE.md`（架构说明）
4. 提取关键概念

例如，对一个电商系统，AI 会提炼出：

```markdown
# 关键概念

**Authentication System**
- JWT Token 验证
- Session 管理
- 权限检查

**Payment Flow**
- 订单创建
- 支付网关集成（Stripe）
- Webhook 回调处理
- 订单状态机
```

以后 AI 才能真正理解你的项目。

---

### 场景 3：旧项目 Bug 巨多

不要直接问 AI"帮我修一下"。

而是用**专业的调试流程**：

```txt
/diagnose

用户支付偶尔失败
```

AI 会进入标准调试流程：

```txt
Step 1: 复现 Bug
  - 如何稳定复现？
  - 什么条件下出现？
  - 错误信息是什么？

Step 2: 日志埋点
  - 支付开始：记录订单 ID、金额
  - 网关请求：记录请求/响应
  - 数据库操作：记录状态变化
  
Step 3: 代码分析
  - 是否存在竞态条件？
  - 超时设置是否合理？
  - 是否有边界条件遗漏？
  
Step 4: 最小化复现
  - 创建测试用例复现 Bug
  - 验证修复前测试失败
  
Step 5: 验证修复
  - 修复后测试通过
  - 边界条件都覆盖
```

这比"帮我修一下"专业太多。

---

## 第三部分：真实开发中的最佳实践

### ❌ 常见误解

很多人一旦学会 Skills，就想：

```txt
全程 /tdd
全程 /grill-me
全程打开一个 Skill
```

**这是错的。**

### ✅ 正确理解

Skills 不是"永久人格"，而是**阶段性工作模式**。

就像：

- 你不会一整天都在开会
- 你不会一整天都在写代码
- 你不会一整天都在调试

---

### 推荐工作节奏

#### 需求阶段（项目启动）

```txt
/grill-me           → 澄清想法
/grill-with-docs    → 统一术语
```

**时间**：1-3 天

---

#### 规划阶段

```txt
/to-prd   → PRD 生成
/to-issues → 任务分解
```

**时间**：1-2 天

---

#### 开发阶段

```txt
/tdd      → TDD 开发
```

**时间**：大部分工作时间

---

#### 出现 Bug

```txt
/diagnose → 系统调试
```

**即用即停**

---

#### 代码变乱

```txt
/improve-codebase-architecture → 架构改进
```

**定期使用**（每个月/每个 Sprint）

---

### 不同项目规模的推荐组合

#### 小项目（1-2 周）

```txt
/grill-me
/tdd
```

简单够用。

---

#### 中型项目（1-3 个月）

```txt
/grill-me
/grill-with-docs
/to-prd
/to-issues
/tdd
```

这是**黄金组合**。

---

#### 大型长期项目

```txt
/grill-me
/grill-with-docs
/to-prd
/to-issues
/tdd
/diagnose
/improve-codebase-architecture
```

完整的工程体系。

---

## 第四部分：结合你的技术栈

你现在用：

- **Go** - 后端
- **Supabase** - 数据库 + 认证
- **Vercel** - 前端部署
- **Flutter** - 移动端
- **AI 项目** - 特殊挑战

这里是针对你的推荐使用方式。

---

### Go 后端开发

**开发前必做**：

```txt
/grill-me
```

明确：

- DTO 设计
- Service 层职责
- Repo 层接口
- 事务边界
- 错误码规范
- API 设计

这和你之前的最佳实践 `Handler → Service → Repo` 完全一致。

AI 现在会遵守这个模式，而不是乱生成代码。

**开发时**：

```txt
/tdd
```

每个接口都有测试保障。

**项目变乱时**：

```txt
/improve-codebase-architecture
```

---

### Flutter APP 开发

Flutter 的特点：**页面很多，状态管理容易乱**。

最适合用：

```txt
/to-issues
```

拆分成：

```txt
- 实现登录页全链路（UI + 状态管理 + API）
- 实现主页导航全链路
- 实现商品详情页全链路
- 实现购物车全链路
- 实现订单页全链路
```

每个 Issue 都是独立的端到端功能。

这样 AI 生成的代码会稳定得多。

---

### AI 项目（Agent 开发）

**最重要**：

```txt
/grill-with-docs
```

为什么？因为 AI 项目术语极多：

```txt
Agent       - AI 代理
Tool        - 工具调用
Memory      - 上下文记忆
Skill       - 技能/能力
Workflow    - 工作流程
Context     - 上下文信息
Prompt      - 提示词
Chain       - 任务链
```

没有 `CONTEXT.md`，AI 很快就会混乱：

- Tool 一会儿叫 Function
- 一会儿叫 Function Call
- 一会儿叫 Action

导致生成的代码前后不一致。

---

## 第五部分：高级玩法（AI Native 开发）

很多高手现在这样用 Skills：

### 把 Skills 当作团队规范

在项目里创建：

```txt
.ai/
├── CONTEXT.md          # 术语统一
├── ARCHITECTURE.md     # 架构规范
├── TDD_GUIDE.md       # 测试规范
└── ISSUE_TEMPLATE.md  # Issue 模板
```

新成员，包括 AI，都遵守：

- TDD 流程
- 架构规范
- Issue 规范
- 术语规范

这已经是 **AI Native Development** 的雏形。

### 效果

- 代码风格一致
- 架构清晰
- 沟通高效
- 新成员（包括 AI）快速上手

---

### 一个团队的最佳实践

```txt
项目初期:
  所有人都用 /grill-me 澄清需求
  生成共享的 CONTEXT.md

开发期间:
  所有 PR 都遵守 /tdd
  code review 检查测试覆盖率

遇到复杂 Bug:
  团队一起用 /diagnose
  记录在项目文档

项目衰老:
  定期用 /improve-codebase-architecture
  持续改进架构
```

---

## 第六部分：安装与快速开始

### 安装

如果你用 Claude 官方提供的环境，Skills 通常已经预装。

如果需要手动配置，在 VS Code 的 Claude 扩展中：

```txt
Command Palette (Ctrl+Shift+P)
> Claude: Add Skill
> 搜索 "grill-me" / "tdd" 等
```

或者在项目根目录创建 `.claude` 配置。

### 快速开始模板

对于一个新项目，这是完整的流程：

```bash
# 1. 新建项目目录
mkdir my-project
cd my-project

# 2. 初始化 Git 和 Claude 配置
git init
mkdir -p docs .ai

# 3. 在 Claude 中：
# /grill-me
# 我想做 XXX

# 4. 等待建议，然后：
# /grill-with-docs

# 5. 生成 PRD 和任务：
# /to-prd
# /to-issues

# 6. 开始第一个 Issue 的开发：
# /tdd
# 实现 Issue #1：用户登录
```

---

## 第七部分：常见问题

### Q: Skills 会不会让我"依赖" AI？

**A**: 正好相反。Skills 强制你：

- 先想清楚需求
- 写测试
- 整理文档
- 定义架构

这些都是**好的工程实践**。

如果没有 AI，你也应该这样做。

---

### Q: 用了 Skills，代码质量会不会更差？

**A**: 用了 TDD + 完整的需求分解，代码质量通常会**更好**。

因为：

- 测试驱动设计
- 需求清晰
- 架构一致
- 职责明确

---

### Q: Skills 需要学多长时间？

**A**:

- 学会基本用法：**1-2 小时**
- 真正融入工作流：**1-2 周**
- 变成自然的工作方式：**1-2 个月**

不要试图一次学会所有 Skills。

先用 `/grill-me` 和 `/tdd`。

用顺了，再加入其他。

---

### Q: 现有项目能用 Skills 吗？

**A**: **完全可以。**

从 `/improve-codebase-architecture` 和 `/grill-with-docs` 开始。

---

## 总结：AI Skills 的核心价值

这些 Skills 本质在做：

> **把隐性的工程经验编码化，变成 AI 可执行的流程**

不是为了让 AI 替代你。

而是为了让你：

- 更清晰地思考
- 更系统地工作
- 更高效地协作
- 更少犯错误

就像 Git 不是为了替代文件系统，而是为了更好地管理代码版本。

---

## 推荐阅读

- [Matt Pocock - AI Skills](https://github.com/mattpocock/skills)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

---

## 下一步

现在你了解了完整的工作流。

推荐的行动顺序：

1. **下周新项目**：用 `/grill-me` 和 `/tdd`
2. **现有项目**：用 `/improve-codebase-architecture` 分析一下
3. **逐步融入**：每周加一个 Skill，变成肌肉记忆

不要试图一次全用。

一个好的工程师，是逐步提升工程规范的。

AI Skills 只是加快了这个过程。

---

**开始你的 AI Native Development 之旅吧！**
