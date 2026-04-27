---
title: "FSRS 算法深入解析：比 SM-2 更智能的间隔重复调度"
date: 2026-04-27T20:00:00+08:00
lastmod: 2026-04-27T20:00:00+08:00
draft: false
tags: ["FSRS", "间隔重复", "记忆算法", "机器学习"]
categories: ["算法"]
author: "百里"
comment: true
toc: true
reward: false
---

## 前言

SM-2 算法自 1987 年由 Piotr Wozniak 设计以来，一直是间隔重复（Spaced Repetition）领域的核心算法。它简单有效，但有一个致命缺陷：**所有用户共用同一套固定参数**。

FSRS（Free Spaced Repetition Scheduler）由 Jarrett Ye 于 2022 年开发，旨在用机器学习取代手工调参，让算法真正适应每个用户的记忆特性。

## 一、SM-2 的局限性

SM-2 的核心问题在于它的参数是**固定的**：

- 所有新用户使用相同的初始 easiness factor（2.5）
- 所有用户使用相同的间隔乘数
- 失败时所有卡片一律重置

这意味着一个记忆力超强的人和一个普通人，背同样的单词，系统给他们的复习节奏完全一样——只是因为算法无法感知他们的差异。

## 二、FSRS 的核心思想：DSR 模型

FSRS 基于 **Difficulty-Stability-Retrievability（难度-稳定性-可检索性）** 三元素模型：

| 变量 | 含义 | 范围 |
|------|------|------|
| **D** (Difficulty) | 记忆的难度 | [1, 10]，值越大越难记住 |
| **S** (Stability) | 记忆稳定度 | 天数，R 从 100% 衰减到 90% 所需时间 |
| **R** (Retrievability) | 当前可检索概率 | [0, 1]，即「我现在能回忆起来的概率」 |

### 遗忘曲线

FSRS 使用以下公式计算可检索性随时间衰减：

$$R(t, S) = \left(1 + factor \cdot \frac{t}{S}\right)^{-decay}$$

其中 `factor` 和 `decay` 是可训练的参数。当你设置**目标保留率**（默认 90%）时，系统会计算下次复习的时间点，使得 R 恰好衰减到目标值。

### 稳定性更新

每次复习后，系统根据评分更新 S：

**成功评分（Hard/Good/Easy）：**
$$S' = S \cdot e^{w \cdot (G - 3)} \cdot S^{-w_{19}}$$

**失败评分（Again）：**
$$S'_f = w_{11} \cdot D^{-w_{12}} \cdot ((S+1)^{w_{13}} - 1) \cdot e^{w_{14} \cdot (1-R)}$$

注意失败时 S **不是归零**，而是适度降低——这反映了残余记忆的存在。

## 三、FSRS 的参数体系

FSRS v6 使用 **21 个可训练参数**（w0 到 w20）：

```python
# FSRS 默认参数
default_params = [
    0.0042,  # w0: 初始难度基准
    0.424,   # w1: 难度调节因子
    0.00796, # w2: 稳定性初始值（Easy）
    0.286,   # w3: 稳定性初始值（Good）
    3.082,   # w4: 稳定性初始值（Hard）
    9.32,    # w5: 难度初始值
    0.0361,  # w6: 稳定性衰减率
    0.117,   # w7: 难度影响因子
    0.00306, # w8: retrievability 影响因子
    0.833,   # w9: 失败后稳定性保留因子
    # ... 更多参数
]
```

这些参数不是手工设定的，而是通过**梯度下降**在真实用户数据上优化得到的。

## 四、参数优化机制

新用户使用**群体平均参数**；随着review数据积累（约 400+ 条），系统会使用优化算法调整参数：

```python
def optimize_parameters(review_logs):
    """
    review_logs: 包含每次复习的时间、评分、间隔等信息的日志
    目标: 最小化对数损失，使模型预测的回忆概率与实际吻合
    """
    # 使用梯度下降优化 21 个参数 w0~w20
    # 损失函数: log-loss between predicted R and actual recall
```

这意味着：
- 使用越久，算法越懂你
- 算法会持续改进（参数定期重优化）

## 五、与 SM-2 的关键差异

| 特性 | SM-2 | FSRS |
|------|------|------|
| 参数来源 | 手工设定（1987） | 机器学习优化 |
| 失败行为 | 重置卡片（interval=1） | 适度降低稳定性 |
| 适应能力 | 固定参数，所有人相同 | 个性化，累积数据后优化 |
| 目标控制 | 通过 easiness factor（间接） | 直接设定目标保留率 |
| 参数数量 | ~5 | 21（可训练） |

## 六、实际使用示例

```typescript
import { fsrs, Rating } from 'ts-fsrs';

const scheduler = fsrs({
  desired_retention: 0.9,  // 目标保留率 90%
  maximum_interval: 36500,
  enable_fuzz: true,
});

// 复习一张新单词卡
const card = { /* 卡片当前状态 */ };

// 用户选择 "Good"
const result = scheduler.next(card, {
  rating: Rating.Good,
  elapsed_days: 1,
});

// result.next_interval: 下次复习的间隔（天数）
// result.stability: 更新后的稳定度
// result.difficulty: 更新后的难度
```

## 七、为什么 FSRS 更好

基于真实 Anki 用户数据的基准测试结果：

- **相同保留率下**：FSRS 比 SM-2 减少约 15% 总复习量
- **相同复习量下**：FSRS 达到更高的保留率（约 95% vs 90%）
- **长期用户**：使用 6 个月后，FSRS 的预测误差比 SM-2 低 40%

## 八、局限性与注意事项

1. **冷启动问题**：前 400 条记录前，参数是群体均值，个性化程度有限
2. **参数不收敛风险**：如果用户行为不稳定（如大量漏刷），优化可能不收敛
3. **数据依赖**：优化效果取决于用户是否诚实记录评分

## 参考文献

- [FSRS 官方 Wiki - The Algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
- [TS-FSRS 文档](https://open-spaced-repetition.github.io/ts-fsrs/)
- [True Recall - FSRS 算法介绍](https://www.truerecall.app/features/fsrs-algorithm/)