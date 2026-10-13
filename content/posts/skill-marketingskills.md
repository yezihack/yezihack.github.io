---
title: "我用 WorkBuddy 装了一套「营销外挂」：50 个 AI 营销技能一键部署"
date: 2026-10-13T15:14:54+08:00
lastmod: 2026-10-13T15:14:54+08:00
draft: false
tags: ["skills", "workbuddy", "codex"]
categories: ["skills"]
author: "百里"
comment: false
toc: true
reward: true
---

> 一套面向 AI Agent 的营销技能集 marketingskills，覆盖 CRO、文案、SEO、投放、邮件、定价……我把它部署进了 WorkBuddy，从此让 AI 帮我做增长。

## 这是什么？

最近在 GitHub 上刷到一个很有意思的项目：[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)（当前版本 v2.11.26）。

它本质上是一套 **Skills（技能）**——也就是给 AI Agent 看的「专项工作手册」。每个技能都是一个 `SKILL.md` 文件，里面写好了某一个营销场景的方法论、检查清单和工作流。当你在对话里提到相关任务，Agent 就能自动识别并加载对应的技能，按专业框架来干活。

换句话说：**它不是某个具体的 App，而是一摞「营销专家的操作手册」**。装上之后，你的 AI 助手就相当于同时雇了 50 个营销领域的顾问。

## 都有哪 50 个技能？

我把它们按用途分了个类，方便检索：

**🎯 转化与增长**
`cro`（转化率优化）、`signup`（注册流程）、`onboarding`（新用户激活）、`popups`（弹窗）、`paywalls`（付费墙）、`churn-prevention`（流失预警）、`ab-testing`（A/B 测试）

**✍️ 内容与文案**
`copywriting`（文案）、`copy-editing`（文案润色）、`content-strategy`（内容策略）、`emails`（邮件序列）、`sms`（短信）、`social`（社媒）

**📣 投放与获客**
`ads`（广告投放）、`ad-creative`（广告创意）、`cold-email`（冷邮件）、`directory-submissions`（目录提交）、`programmatic-seo`（程序化 SEO）、`launch`（发布策划）

**📊 分析与调研**
`analytics`（数据分析）、`attribution`（归因）、`customer-research`（用户调研）、`competitor-profiling`（竞品画像）、`marketing-plan`（营销计划）

**🔧 其他细分**
`pricing`（定价）、`seo-audit`（SEO 审计）、`schema`（结构化数据）、`ai-seo`（AI 搜索优化）、`lead-magnets`（诱饵内容）、`influencer-marketing`、`community-marketing`、`referrals`（推荐计划）、`revops`、`sales-enablement`…… 等等。

完整 50 个，这里就不一一展开了。

## 怎么部署到 WorkBuddy？

官方推荐用 `npx skills add`，但在 WorkBuddy 里，我们走的是**用户级技能目录**这条路——一次安装，所有项目对话都能用。

```bash
# 1. 克隆仓库到临时目录
git clone --depth 1 https://github.com/coreyhaines31/marketingskills.git ~/.workbuddy/tmp/marketingskills

# 2. 把 skills/ 复制到用户级技能目录
cp -r ~/.workbuddy/tmp/marketingskills/skills/* ~/.workbuddy/skills/

# 3. 清理临时目录
rm -rf ~/.workbuddy/tmp/marketingskills
```

> ⚠️ 部署前我做了一次安全扫描：该仓库技能全部为纯 Markdown，无任何可执行脚本、无数据外传、无凭证窃取行为，可放心使用。

部署完，用 `ls ~/.workbuddy/skills/` 数一下，会发现多了 50 个目录。搞定。

## 怎么用？

最舒服的地方在于——**它基本是自动触发的**。你不需要记命令，正常说话就行：

| 你对 WorkBuddy 说 | 自动加载的技能 |
|---|---|
| “帮我优化这个落地页的转化率” | `cro` |
| “给我的 SaaS 写一段首页文案” | `copywriting` |
| “帮我做一次 SEO 审计” | `seo-audit` |
| “给注册流程搭个 GA4 埋点” | `analytics` |
| “写一个 5 封的新用户欢迎邮件序列” | `emails` |
| “帮我规划定价策略” | `pricing` |

如果你想要更精准的控制，也可以直接点名技能：

> “用 `cold-email` 技能帮我写一封开发信”
> “运行 `competitor-profiling` 分析这个竞品网站”

### 更多实战例子

光看触发词可能还不够直观，下面放几个我实际会用的场景，以及 AI 大概会怎么回应——你照着改自己的内容就行：

**① 落地页转化诊断（cro）**

> 你：「这是我的产品落地页 https://example.com，最近转化率只有 1.2%，帮我看看哪里能改。」

AI 会先确认页面目标（注册 / 试用 / 购买？），再按「首屏主张 → 信任证据 → 行动按钮 → 表单阻力」的顺序给一份**按优先级排序**的优化清单，而不是随手提两句。

**② 冷邮件开发信（cold-email）**

> 你：「用 `cold-email` 技能，给 200 人规模的 HR SaaS 公司 CTO 写一封冷邮件，推我们的招聘分析工具，别显得像群发。」

AI 会套用「痛点钩子 + 具体价值 + 低门槛 CTA」结构，并提醒你**永远别用主域名发冷邮件**、注意送达率（deliverability）这类实战坑。

**③ 竞品研究（competitor-profiling）**

> 你：「运行 `competitor-profiling`，分析 Notion 和 Coda 的定价页差异，给我一张对比表。」

AI 会拆开两边的定价层级、锚定策略、免费档定位，再补一段「我们该怎么差异化」的建议。

**④ 新用户欢迎邮件序列（emails）**

> 你：「写一个 5 封的欢迎邮件序列，面向刚注册的设计师，目标是让他们完成第一张作品。」

AI 会按「第 1 天欢迎 → 第 2 天上手引导 → 第 4 天案例激励 → 第 7 天社交证明 → 第 10 天升级引导」排好节奏，每封都标好主题行和目标。

**⑤ 定价策略（pricing）**

> 你：「用 `pricing` 技能，帮我们的订阅工具设计三档定价，主打小团队。」

AI 会先问清楚成本结构、客群支付意愿、竞品价位，再给出「入门 / 标准 / 专业」三档的锚定和分隔逻辑。

**⑥ 流失预警（churn-prevention）**

> 你：「我们 SaaS 月流失 6%，用 `churn-prevention` 帮我设计一套 dunning（催缴）和挽留流程。」

AI 会区分「付款失败类流失」和「主动取消类流失」，分别给自动催缴话术和挽留 Offer 的设计。

> 💡 小技巧：第一次用某个技能时，**显式点名**最稳（比如「用 cro 技能…」），确认它能正确加载后，后面再用自然语言描述也能稳定触发。

## 我的实际感受

之前让 AI 帮忙写营销内容，结果往往是「看起来很专业但落不了地」的泛泛而谈。装上这套技能后，AI 会按真实营销框架工作——比如 `cro` 会先让你明确页面目标、分析漏斗、给出按优先级排序的优化清单，而不是上来就给你改两个按钮颜色。

对于独立开发者、小团队、或者想系统化管理自己产品增长的个人来说，这相当于**白嫖了一整个增长团队的方法论**。

## 小结

- 项目：coreyhaines31/marketingskills（v2.11.26，50 个营销技能）
- 一键装进 WorkBuddy 用户级技能目录，全项目可用
- 自然语言触发，也可点名调用
- 纯 Markdown，安全可控，免费开源

如果你也在用 WorkBuddy 折腾效率工具，这套技能值得装一波。

