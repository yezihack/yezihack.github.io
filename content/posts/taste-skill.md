---
title: "Taste Skill 上手指南：让 AI 写出不像 AI 写的前端"
date: 2026-10-14T19:36:16+08:00
lastmod: 2026-10-14T19:36:16+08:00
draft: false
tags: ["skill", "ai", "前端", "指南"]
categories: ["ai"]
author: "百里"
comment: false
toc: true
reward: true
---

> 官网：<https://www.tasteskill.dev/>　GitHub：<https://github.com/Leonxlnx/taste-skill>　协议：MIT 开源

用 Cursor、Claude Code、Codex 写前端，你一定见过这些"AI 味"：紫色渐变背景、三张一模一样的居中功能卡片、满屏的"Scroll to explore"、假装高级的 `v1.4.2 · Build 0048` 页脚……每个 AI 生成的页面看起来都像同一个模板的变体。

**Taste Skill** 就是专门治这个病的：一套开源的 `SKILL.md` 规则文件，让你的 AI 编码代理在动手写 UI 之前，先读一遍"设计品味"的规则。官网的口号是 *Less slop, designs pop*（少一点糊弄，多一点惊艳）。

本文分三部分：

1. Taste Skill 是什么、有哪些技能
2. 怎么安装、怎么用（含两个官方提示词模板）
3. **12 个场景示例**：官网、技术产品、商业、电商、管理后台、作品集、App、品牌、改版等

---

## 一、Taste Skill 是什么

### 1.1 一句话介绍

Taste Skill 是一组 `SKILL.md` 文件。你把它装进项目，AI 代理在生成界面前会自动读取它，里面写着关于**字体、间距、色彩、布局、动效**的硬性规则，以及一长串"禁止这样做"的清单。

它不是组件库，也不是 CSS 框架，而是**给 AI 的设计规范**。

### 1.2 支持哪些工具

只要工具能读 `SKILL.md`，就能用。官网列出的有：

Cursor、Claude Code、Codex、Antigravity、Gemini CLI、AI Studio、v0、Lovable、OpenCode、OpenClaw、Windsurf、Copilot。

### 1.3 13 个技能一览

官网把它们分成四类，一次安装全部拿到，按需启用：

| 类别 | 技能 | 作用 |
|---|---|---|
| **核心** | `taste-skill`（安装名 `design-taste-frontend`，v2 默认） | 读需求、推断设计方向、避免模板化，带严格的"发布前检查" |
| | `taste-skill-v1` | 旧版，只在 v2 搞坏了你的流程时用 |
| | `gpt-tasteskill` | 针对 GPT / Codex 的更严格版本，布局变化和动效更强 |
| **工作流** | `redesign-skill` | 给已有项目做视觉审计和改版 |
| | `image-to-code-skill` | 先生成设计参考图，研究后再按图实现 |
| | `output-skill` | 反偷懒：禁止占位符、跳过章节、半成品输出 |
| | `stitch-skill` | 兼容 Google Stitch，可导出 `DESIGN.md` |
| **风格** | `soft-skill` | 柔和、高级感：低对比、大留白、弹簧式动效 |
| | `minimalist-skill` | 类 Notion / Linear 的编辑式产品界面 |
| | `brutalist-skill` | 瑞士字体 + 粗粝结构 + 高对比 |
| **图像生成** | `imagegen-frontend-web` | 生成网站分段参考图 |
| | `imagegen-frontend-mobile` | 生成移动端界面概念图 |
| | `brandkit` | 生成品牌板：Logo 概念、色彩、字体、样机 |

### 1.4 v2 的核心思路

官方文档说 v2 是 2026 年对默认技能的大改写（目前仍标为 experimental，安装名保持稳定）。几个关键机制：

- **先读需求再动手（Brief 推断）**：根据页面类型、氛围词、受众、参考站点，先用一句话声明"设计判断"，而不是默认套紫色渐变。
- **需求到设计系统的映射**：需求读起来像 Material、Fluent、Carbon、Polaris、Atlassian、Primer、GOV.UK、USWDS、Bootstrap、Radix、shadcn 或 Tailwind 时，代理会去用官方包；只是审美类描述，则会老实标注为"网页近似实现"。
- **三把"锁"**：
  - 颜色一致锁：全页只有一个强调色，不会第 7 屏突然冒出蓝色按钮
  - 形状一致锁：全页一套圆角体系（全直角 / 全圆角 / 全胶囊）
  - 主题锁：亮 / 暗 / 自动，在页面级别选定一次，不中途翻转
- **首屏纪律**：标题最多两行，副文案不超过 20 个词、4 行，主按钮不滚动就能看到，导航单行且不超过 80px。
- **动效骨架**：给 sticky-stack、横向平移、滚动揭示等提供规范代码模式；禁止手写 `window.addEventListener('scroll')`。
- **暗色模式协议**：默认双主题，保证 WCAG AA 对比度，用"近黑 / 近白"而不是纯黑纯白。
- **改版协议**：对已有项目先审计，URL、导航文案、表单字段名不会被悄悄改掉。
- **硬性发布前检查（Pre-Flight）**：每一项都真的通过才算完成，"没勾完就不许交"。

### 1.5 反糊弄禁令（节选）

这是 Taste Skill 最有辨识度的部分，官网列出了一份严格禁令：

- 全文禁用破折号（em-dash `—` 和 en-dash `–`），改用连字符或重写句子
- 禁止"00 / INDEX""06 · how it works"这类章节编号眉标
- 首屏禁止 `V0.6`、`BETA` 这类版本标签（除非需求本身就是产品发布）
- 禁止叠在图片上的小标签胶囊
- 营销页禁止版本号页脚、城市 / 时间 / 天气装饰条
- 禁止"Scroll to explore"和向下箭头
- 禁止装饰性状态圆点
- 禁止用 div 拼出来的假产品界面（假任务列表、假终端、假仪表盘）
- 默认禁止"三等分卡片"功能行，改用左右交错、非对称网格等
- 默认禁止 AI 紫色和网格渐变团块
- 不鼓励手绘装饰 SVG 插画

---

## 二、怎么安装和使用

### 2.1 安装

**只装 v2 核心技能（推荐起步）：**

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

**装全部 13 个技能：**

```bash
npx skills add Leonxlnx/taste-skill
```

**装到 Codex：**

```bash
npx skills add Leonxlnx/taste-skill -a codex
```

**必须用旧版 v1：**

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v1"
```

安装后会在项目里添加 `SKILL.md`，代理会自动读取，不需要额外配置。如果你的工具不走命令行（比如网页版 ChatGPT），也可以直接把 `SKILL.md` 的内容复制粘贴到对话里。

### 2.2 自定义

`SKILL.md` 完全可编辑。想加一条自己的规则、删掉一条你不认同的，直接改文件即可，下次生成就生效。如果你有项目自己的风格指南，**贴在 `SKILL.md` 最顶部**，代理会把它当作最高优先级的依据。

### 2.3 使用流程：一个会话里"先加载，再下指令"

官方 Guide 页给了两个现成的提示词模板，核心特点是**分步骤、每步等你确认**。

#### 模板 A：从零做新网站

```text
I have loaded tasteskill v2 (experimental) as my only source of design rules.

Brief:
- Page kind: <landing / portfolio / marketing>
- Product: <name and one-line description>
- Audience: <who reads this, concrete adjectives>
- Vibe words: <2 to 4 concrete adjectives, e.g. "minimalist, editorial, restrained">
- References: <real URLs or product names that anchor the aesthetic>
- Avoid: <explicit slop patterns the brief should NOT default to>

Step 1. Declare your design read in one sentence and the three dial values
with one-line reasoning each. Stop.

Step 2 (after my OK). Ship a single Next.js page with at least 8 sections.
Pick the sections that actually fit the product. At least 4 different layout
families across the page. Use real images (gen-tool first, then Picsum-seed).
Lock one theme for the whole page.

Step 3. Run in writing:
- Em-dash audit
- Pre-Flight Check (Section 14, every box marked Pass or Fail)
- Section-Layout-Repetition audit
- Hero discipline audit

Any Fail blocks completion.
```

**怎么填**：Brief 里的六项是关键。其中 **Vibe words（氛围词）** 和 **References（参考）** 对结果影响最大，因为 v2 就是靠这些词来推断"布局变化度、动效强度、信息密度"三个旋钮的。

#### 模板 B：改版已有网站

```text
I have loaded tasteskill v2 (experimental) as my only source of design rules.

Brief:
- Site: <URL or repo path>
- Mode: <preserve brand / overhaul / unsure>
- Audience: <who reads this>
- What works today: <2 to 3 specifics you want kept>
- What is broken today: <2 to 3 specifics you want fixed>
- SEO constraint: <which routes, headings, or anchors must not change>

Step 1. Run the Section 11 audit (brand tokens, information architecture,
patterns to preserve / retire, inferred dials, SEO baseline). Stop.
Step 2 (after my OK). Declare the mode and the modernisation levers. Stop.
Step 3 (after my OK). Implement. Keep URLs, nav labels, form field names,
logo and legal copy unchanged unless I approve.
Step 4. Run: Em-dash audit, Pre-Flight Check, Preservation audit,
Brand fidelity audit. Any Fail blocks completion.
```

### 2.4 通用使用小技巧

1. **氛围词要具体**：写 "minimalist, editorial, restrained" 比写 "modern, clean, beautiful" 有用得多。
2. **给真实参考**：贴 2 到 3 个你喜欢的网站 URL 或产品名。
3. **用 Avoid 字段**：把你最烦的 AI 味直接写进去。
4. **分步确认**：Step 1 让它只输出"设计判断"就停，你点头后再让它写代码，省得整页重来。
5. **多技能叠加**：核心 `taste-skill` 管底线，再叠一个风格技能（`soft` / `minimalist` / `brutalist`）定调子，再叠 `output-skill` 防偷懒。
6. **图片**：规则要求用真实图片，不要 div 拼假截图。官方模板的写法是"先用生成工具，再退到 Picsum 种子图"。
7. **旋钮**：`DESIGN_VARIANCE`（布局变化）、`MOTION_INTENSITY`（动效）、`VISUAL_DENSITY`（密度）是 v2 里的三个设计旋钮；如果动效强度大于 4，页面就应该真的有动效。

---

## 三、12 个场景示例

> 以下示例的提示词是**我根据官方模板改写的参考写法**，不是官网原文。所有提示词都已遵守 Taste Skill 自己的规矩：不使用破折号。
> 每个示例都假设你已经执行过 `npx skills add Leonxlnx/taste-skill`。

### 示例 1：AI 工具的产品官网（Landing Page）

**适用技能**：`taste-skill` + `output-skill`

```text
I have loaded tasteskill v2 as my only source of design rules.

Brief:
- Page kind: landing
- Product: Lumen, an AI meeting notes app that turns calls into action items
- Audience: startup founders and team leads, busy, skeptical of hype
- Vibe words: calm, confident, editorial
- References: linear.app, granola.ai
- Avoid: purple gradients, three equal feature cards, fake dashboards made of divs

Step 1. Declare your design read in one sentence and the three dial values
with one-line reasoning each. Stop.
Step 2 (after my OK). Ship a single Next.js page with at least 8 sections.
Step 3. Run the em-dash audit, Pre-Flight Check and Hero discipline audit.
```

**你应该看到**：首屏标题不超过两行、一个主按钮、没有滚动提示；功能区是左右交错而不是三等分卡片；全页一个强调色。

---

### 示例 2：开发者工具 / 开源项目官网

**适用技能**：`taste-skill` + `brutalist-skill` 或 `minimalist-skill`

```text
Brief:
- Page kind: marketing
- Product: Forge, an open-source CLI that scaffolds Go microservices
- Audience: backend engineers, allergic to marketing fluff
- Vibe words: technical, sharp, monochrome
- References: bun.sh, vercel.com
- Avoid: fake terminals built from styled divs, version badges in the hero

Constraints:
- Show the install command as a real copyable code block.
- Use one real screenshot or generated image of the CLI output.
- Include a quickstart section and a "why Forge" comparison table.
```

**要点**：技术产品最容易踩"div 假终端"和"hero 版本标签"两条禁令。Taste Skill 会逼代理用真截图或生成图，把安装命令做成真实的代码块。

---

### 示例 3：技术文档站 / API 文档首页

**适用技能**：`minimalist-skill`

```text
Brief:
- Page kind: docs home
- Product: Relay API, payments infrastructure for marketplaces
- Audience: integration engineers
- Vibe words: minimalist, editorial, dense but readable
- References: stripe.com/docs, linear.app/docs
- Avoid: section-numbering eyebrows, border lines on every row

Deliver:
- A left nav, a search entry, and a "choose your path" block with 4 entry points
- A tabbed code sample block for curl, Node, Python
- No decorative status dots
```

**要点**：文档页常见毛病是每行都加上下边线的"表格味"列表。Taste Skill 禁用这种写法，会改用卡片、标签页或滚动吸附胶囊。

---

### 示例 4：SaaS 定价页（商业）

**适用技能**：`taste-skill` + `soft-skill`

```text
Brief:
- Page kind: pricing
- Product: Ledgerly, bookkeeping software for freelancers
- Audience: designers and consultants, not accountants
- Vibe words: friendly, trustworthy, soft
- References: wise.com, mercury.com
- Avoid: three identical plan cards, glowing gradient borders

Requirements:
- 3 plans plus a monthly / annual toggle
- Highlight the recommended plan using the single accent color only
- A FAQ section and a short social-proof strip
- One corner radius system across the whole page
```

**要点**：这是"形状一致锁"和"颜色一致锁"最容易看出效果的场景：推荐套餐只靠同一个强调色突出，而不是再引入第二个颜色。

---

### 示例 5：咨询公司 / 创意机构官网（商业）

**适用技能**：`taste-skill` + `brutalist-skill`

```text
Brief:
- Page kind: marketing
- Product: Northstar, a brand strategy agency
- Audience: marketing directors at mid-size companies
- Vibe words: bold, Swiss, high-contrast
- References: pentagram.com, collins.co
- Avoid: stock photo captions as decoration, pills over images

Sections: hero, selected work (asymmetric grid), services, process,
clients, team, contact. At least 4 distinct layout families.
```

**要点**：机构站最容易写出"Field study no. 12 · 摄影师名"这类假图注，官方禁令明确禁止，只允许真实摄影师的真实署名。

---

### 示例 6：电商首页与品类页（商品）

**适用技能**：`taste-skill` + `soft-skill`

```text
Brief:
- Page kind: e-commerce home
- Product: Verdant Room, an online shop for rare indoor plants
- Audience: urban plant lovers aged 25 to 40
- Vibe words: calm, botanical, expensive-looking
- References: aesop.com, haycanada.com
- Avoid: scroll cues, weather strips, mesh gradients

Deliver:
- Hero with one featured plant and a visible primary CTA
- Category browse (not three equal cards)
- Best sellers carousel
- Care-guide editorial block
- Newsletter and footer (no version number in the footer)
- Use real product-style images
```

---

### 示例 7：商品详情页（商品）

**适用技能**：`taste-skill` + `output-skill`

```text
Brief:
- Page kind: product detail
- Product: "Aria" wireless headphones, 40h battery, $199
- Audience: commuters and remote workers
- Vibe words: minimalist, tactile, precise
- References: teenage.engineering, nothing.tech
- Avoid: div-made fake product mockups

Requirements:
- Image gallery with thumbnails
- Sticky buy box with color picker and add-to-cart
- Specs as tabs, not a table with borders on every row
- Reviews summary and a related products rail
- Complete every section, no placeholder comments
```

**要点**：这里 `output-skill` 的价值最大。商品页内容多，AI 最爱写 `{/* more specs here */}` 然后收工，`output-skill` 专门禁止这种半成品。

---

### 示例 8：管理后台 / 仪表盘

**适用技能**：`taste-skill`（利用"需求到设计系统映射"）

```text
Brief:
- Page kind: admin dashboard
- Product: ShipDesk, an order and inventory backend for small online stores
- Audience: operations staff who stare at this all day
- Vibe words: calm, dense, readable, shadcn-style
- References: linear.app, vercel.com/dashboard
- Avoid: neon charts, decorative status dots, gradient cards

Deliver:
- App shell: sidebar, top bar, breadcrumb
- Overview page: 4 KPI tiles, one revenue chart, a recent orders table
- Orders page: filters, sortable table, bulk actions, a detail drawer
- Settings page with form sections
- Dual theme (light and dark) with AA contrast in both
- Status dots only where they convey real state (paid, shipped, refunded)
```

**要点**：

- 提示里写出 "shadcn-style"，v2 会按"需求到设计系统映射"去使用 shadcn / Radix 等真实组件，而不是自己手搓一套。
- 管理后台天然适合**暗色模式协议**：官方要求双主题对比度和层级保持一致，且用近黑近白。
- 官方对"装饰性状态圆点"默认是零，只有表达真实语义状态时才允许，订单状态正好符合。
- 注意：官方禁令里"div 假界面"针对的是**营销页里假装是产品截图**的情况，你在做的是真实的后台，用真实组件完全没问题。

---

### 示例 9：个人作品集（Portfolio）

**适用技能**：`taste-skill` + `minimalist-skill`

```text
Brief:
- Page kind: portfolio
- Product: personal site of a freelance product designer, 6 case studies
- Audience: hiring managers and startup founders
- Vibe words: editorial, quiet, confident
- References: rauno.me, paco.me
- Avoid: section-numbering eyebrows, photo-credit captions as decoration

Deliver:
- Intro hero, selected work as a scroll-pinned or horizontal-pan section
- Case study template page
- About, contact
- Use the sticky-stack or horizontal-pan skeleton for motion, no raw scroll listeners
```

---

### 示例 10：移动 App 的界面概念图

**适用技能**：`imagegen-frontend-mobile`

```text
Generate a mobile screen set for a habit-tracking app called "Tidy".

Flow: onboarding (3 screens), home, habit detail, weekly review, settings.
Style: soft, warm neutrals, one accent color, consistent corner radius.
Keep hierarchy clear and the visual language consistent across all screens.
```

**要点**：这是纯图像技能，产出的是界面参考图。可以把图交给 Codex、Cursor 或 Claude Code 去实现；也可以配合 `image-to-code-skill`，让代理"先出图，再对图写代码"。

---

### 示例 11：品牌视觉板（Brand Kit）

**适用技能**：`brandkit`

```text
Create a brand kit board for "Kōji", a small-batch miso and fermented
sauce company.

Include: 3 logo concepts, a color system (one primary, one accent, neutrals),
a type pairing, and mockups on packaging and a tote bag.
Mood: warm, crafted, modern Japanese, not rustic cliché.
```

**要点**：做品牌的人可以先用 `brandkit` 定色彩和字体，再把结果作为"品牌资产"写进网页项目的 Brief，让前端沿用同一套视觉。

---

### 示例 12：给已有网站做改版

**适用技能**：`redesign-skill` + `taste-skill`

```text
I have loaded tasteskill v2 as my only source of design rules.

Brief:
- Site: ./apps/marketing (Next.js repo)
- Mode: preserve brand
- Audience: small business owners
- What works today: the logo, the orange accent, the pricing page structure
- What is broken today: generic hero, three equal feature cards, inconsistent radii
- SEO constraint: /pricing, /blog/*, and all H1 text must not change

Step 1. Run the Section 11 audit and post it. Stop.
Step 2 (after my OK). Declare the mode and the modernisation levers. Stop.
Step 3 (after my OK). Implement. Do not rename URLs, nav labels or form fields.
Step 4. Run the preservation audit and brand fidelity audit.
```

**要点**：改版最怕"改着改着把 SEO 和品牌弄丢"。这套流程强制先审计、再确认、再动手，最后还要交一份"被改动的 URL 和导航清单（应当为空）"。

---

## 四、常见组合速查表

| 你要做的事 | 推荐技能组合 |
|---|---|
| 产品官网 / 落地页 | `taste-skill` + `output-skill` |
| 想要高级、柔和的质感 | `taste-skill` + `soft-skill` |
| 想要 Notion / Linear 的冷静感 | `taste-skill` + `minimalist-skill` |
| 想要强烈个性、先锋感 | `taste-skill` + `brutalist-skill` |
| 管理后台 / 工具型产品 | `taste-skill`（需求里点名设计系统，如 shadcn、Carbon、Polaris） |
| 已有项目升级 | `redesign-skill` + `taste-skill` |
| 先看效果再写代码 | `imagegen-frontend-web` / `imagegen-frontend-mobile` → `image-to-code-skill` |
| 用 GPT / Codex | `gpt-tasteskill` |
| 用 Google Stitch | `stitch-skill` |
| 品牌从零开始 | `brandkit` → 再做网页 |

## 五、相关项目：TasteCode

官网还推出了 **TasteCode**，一个本地桌面应用（macOS 和 Windows，公开测试版免费），内置设计代理，可驱动 Codex、Claude Code 和 Grok。它的 Design Mode 把流程固定为四步：**Brief（读需求并写下假设）→ Direction（明确品牌、文案、布局、素材、动效决策）→ Build（由你选的代理在真实项目里实现）→ Review（打开实时站点、截取真实视口、修正问题）**。网址：<https://tastecode.dev>。

## 六、小结与提醒

- **Taste Skill 的本质**：把"设计审美"写成 AI 能执行、能自检的规则。价值不在于让页面一定变好看，而在于**稳定地避开最常见的 AI 糊弄套路**。
- **它不能替你做决定**：Brief 写得越具体，结果越好；氛围词空泛，结果也会空泛。
- **v2 仍是实验版**：官方说明安装名稳定，但章节编号和规则措辞在 2.0 正式版之前可能变化。如果某次更新破坏了你的流程，可以退回 v1。
- **规则可以改**：不认同某条禁令（比如你就是要用紫色品牌），直接编辑 `SKILL.md`，或者在 Brief 里明确说明品牌本身就是紫色（官方的 LILA 规则只在品牌明确是紫色时才放行）。
- **先小范围试**：建议先用一个页面试跑，看看输出是否对味，再决定叠哪些风格技能。

---

*本文依据 tasteskill.dev 首页、Docs、Guide 三个页面整理，示例提示词为作者改写。具体规则以官方 `SKILL.md` 与 [Changelog](https://www.tasteskill.dev/changelog) 为准。*
