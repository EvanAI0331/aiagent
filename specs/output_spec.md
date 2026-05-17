# Output Spec: Startup Validation Artifacts

## Idea Evidence Pack

必须包含：
- `idea_agent_panel`: Idea Advocate Agent、Demand Skeptic Agent、Execution Skeptic Agent 的结构化审查结果。
- `skeptic_dedupe_note`: 两个反方 agent 输出的去重说明。
- `problem_hypotheses`: 问题假设列表。
- `anti_hypotheses`: 反证和淘汰理由。
- `interview_notes`: 用户原始反馈摘要。
- `evidence_table`: 用户角色、场景、频率、替代方案、痛苦成本、预算信号。
- `stage_decision`: `proceed_to_mvp`、`revise_idea` 或 `reject`。

禁止：
- 虚构用户。
- 只保留支持性反馈。

## MVP Experiment Pack

必须包含：
- `single_core_assumption`: 单一核心假设。
- `mvp_scope`: 最小范围。
- `prototype_risk_review`: AI 放大错误原型风险。
- `test_results`: 用户操作、复用、预约、付费或失败证据。
- `stage_decision`: `proceed_to_launch`、`revise_mvp` 或 `reject`。

禁止：
- 把 demo 截图当作验证。
- 把 LLM 自评当作用户反馈。

## Launch Signal Pack

必须包含：
- `launch_channels`: 渠道和承诺。
- `metrics`: 激活、留存、转化、复访、付费或转介绍。
- `anti_vanity_metrics`: 用于排除虚假热度的指标。
- `feedback_clusters`: 反馈归因。
- `stage_decision`: `proceed_to_scale`、`iterate_launch` 或 `pause`。

禁止：
- 只汇报曝光和注册。
- 用短期热度证明 PMF。

## Scale Readiness Pack

必须包含：
- `growth_loop`: 可复制增长循环。
- `unit_economics`: 成本、收入、支持负担。
- `quality_controls`: 质量验收和失败状态。
- `agentic_workflows`: LLM-backed workflow 设计。
- `stage_decision`: `scale`、`constrain_growth` 或 `return_to_launch`。

禁止：
- 无失败状态的自动化。
- 无人类审批的高风险决策。
