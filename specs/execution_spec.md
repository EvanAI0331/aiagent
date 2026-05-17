# Execution Spec: Idea to MVP to Launch to Scale

## 全局执行规则

1. Contract first：先确认目标、证据和门禁，再执行。
2. Evidence bound：没有证据，不得进入下一阶段。
3. Fail closed：缺失证据、指标不达标、用户反馈不足时，状态必须是 blocked 或 rejected。
4. No silent fallback：不能用脚本默认值、模板输出、假数据或 LLM 自评补齐失败。
5. Human checkpoint：进入 MVP、公开 Launch、Scale 三个节点必须有人类确认。

## Stage 1: Idea

输入：
- 创始人的初始灵感。
- 目标行业、用户类型、已知约束。

执行：
1. Idea Advocate Agent 生成基础分析建议，但不得宣称已验证。
2. Demand Skeptic Agent 从需求、市场、付费、替代方案角度质疑并设置门槛。
3. Execution Skeptic Agent 从执行、合规、数据、AI 原型误导、交付风险角度质疑并设置门槛。
4. 系统必须对两个反方 agent 的输出去重；重复或语义相近内容只保留更具体的一条。
5. Idea Scout Agent 生成问题假设和访谈计划。
6. 创始人收集真实用户证据。
7. Discovery Analyst Agent 汇总证据并做阶段判定。

通过标准：
- 至少 10 条目标用户证据。
- 至少 6 条显示明确痛苦成本或当前替代行为。
- 至少 3 条显示预算、排期、复用或迁移意愿。

失败标准：
- 无目标用户证据。
- 只有称赞、想象、市场叙事。
- 用户没有现有替代行为。

## Stage 2: MVP

输入：
- 已通过 Idea 阶段的问题证据包。

执行：
1. MVP Architect Agent 定义单一关键假设。
2. MVP Architect Agent 给出 3 种 MVP 形态。
3. Skeptic Agent 审查错误原型风险。
4. 创始人选择最低成本实验。
5. Discovery Analyst Agent 记录用户行为结果。

通过标准：
- 至少 5 个目标用户试用。
- 至少 2 个用户完成核心行为并表达复用、预约或付费意向。
- 有真实操作证据或交易/预约证据。

失败标准：
- 只有 demo 演示，无用户行为。
- 用户依赖创始人解释才理解价值。
- MVP 验证了多个假设，无法归因。

## Stage 3: Launch

输入：
- MVP 证据包。
- 公开发布范围和渠道。

执行：
1. Launch Signal Agent 定义指标和反作弊指标。
2. Launch Signal Agent 生成渠道实验。
3. 创始人执行发布。
4. Launch Signal Agent 每周分析真实数据。
5. Skeptic Agent 审查是否存在伪 PMF。

通过标准：
- 激活率、D7 留存、付费/预约/转介绍中至少两项达到预设阈值。
- 用户反馈能稳定归因到同一核心价值。

失败标准：
- 只有曝光、点赞、注册。
- 注册后无激活。
- 有收入但无留存或复用。

## Stage 4: Scale

输入：
- Launch 后连续数据。
- 用户支持、交付、增长和成本记录。

执行：
1. Scale Systems Agent 识别可复制增长动作。
2. Scale Systems Agent 设计 agentic workflow。
3. Skeptic Agent 审查质量和失控风险。
4. 创始人批准扩大投入。
5. 系统持续记录失败、人工介入和成本。

通过标准：
- 单位经济稳定或改善。
- 支持成本可控。
- 核心交付质量可测量。
- agentic workflow 有失败状态和人工审批点。

失败标准：
- 增长依赖创始人手工补洞。
- AI 输出不可稳定验收。
- 成本或质量随用户增长恶化。
