import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Binoculars,
  Boxes,
  Check,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Download,
  FileText,
  Flag,
  HelpCircle,
  History,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  Rocket,
  Save,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  UserRound,
  Workflow
} from 'lucide-react';
import saasMarkdown from '../saas.md?raw';
import './styles.css';

const saasCatalog = parseSaasCatalog(saasMarkdown);

const agents = [
  {
    id: 'idea',
    name: 'Idea Scout',
    icon: Binoculars,
    role: '把灵感改写为问题假设、目标用户和访谈问题。',
    stage: 'Idea'
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    icon: ShieldCheck,
    role: '识别伪需求、弱付费、低频场景和确认偏差。',
    stage: 'Idea'
  },
  {
    id: 'discovery',
    name: 'Discovery Analyst',
    icon: BarChart3,
    role: '汇总用户证据，判断是否进入 MVP。',
    stage: 'Idea'
  },
  {
    id: 'mvp',
    name: 'MVP Architect',
    icon: Boxes,
    role: '把范围压缩成一个可验证的核心行为。',
    stage: 'MVP'
  },
  {
    id: 'launch',
    name: 'Launch Signal',
    icon: Rocket,
    role: '区分真实需求、虚假热度和早期 PMF 信号。',
    stage: 'Launch'
  },
  {
    id: 'scale',
    name: 'Scale Systems',
    icon: Workflow,
    role: '设计可复制增长系统和带失败状态的工作流。',
    stage: 'Scale'
  }
];

const stages = [
  {
    id: 'idea',
    number: 1,
    title: 'IDEA',
    subtitle: 'Problem & Opportunity',
    gate: 'Gate 1: Problem Fit',
    requirements: [
      '问题具体且高痛',
      '目标用户清晰',
      '存在当前替代方案',
      '至少 10 条用户证据',
      '至少 6 条痛点/替代行为',
      '至少 3 条预算/排期/复用信号'
    ]
  },
  {
    id: 'mvp',
    number: 2,
    title: 'MVP',
    subtitle: 'Solution & Feasibility',
    gate: 'Gate 2: MVP Fit',
    requirements: [
      '只验证一个核心假设',
      '5 个目标用户试用',
      '2 个用户完成核心行为',
      '保存真实操作证据',
      '定义失败条件'
    ]
  },
  {
    id: 'launch',
    number: 3,
    title: 'LAUNCH',
    subtitle: 'Go-to-Market Readiness',
    gate: 'Gate 3: Launch Fit',
    requirements: [
      '定义北极星指标',
      '定义反作弊指标',
      '跟踪激活率',
      '跟踪 D7 留存',
      '记录付费/预约/转介绍'
    ]
  },
  {
    id: 'scale',
    number: 4,
    title: 'SCALE',
    subtitle: 'Unit Economics & Systems',
    gate: 'Gate 4: Scale Fit',
    requirements: [
      '单位经济稳定',
      '支持成本可控',
      '质量可测量',
      'agent workflow 有失败状态',
      '高风险动作有人类审批'
    ]
  }
];

const seedQuestions = [
  {
    id: 1,
    agent: 'idea',
    status: 'open',
    source: 'spec',
    text: '谁是最主要的目标用户？他们想完成的具体结果是什么？',
    answer: ''
  },
  {
    id: 2,
    agent: 'skeptic',
    status: 'open',
    source: 'spec',
    text: '你有什么证据证明这是一个真实且紧急的问题，而不是“听起来不错”？',
    answer: ''
  },
  {
    id: 3,
    agent: 'discovery',
    status: 'open',
    source: 'spec',
    text: '用户今天用什么替代方案解决？这个替代方案哪里成本高、慢或不可靠？',
    answer: ''
  },
  {
    id: 4,
    agent: 'mvp',
    status: 'pending',
    source: 'spec',
    text: 'Gate 1 通过后，我会把 MVP 压缩到一个核心行为。',
    answer: ''
  }
];

const riskRules = [
  {
    id: 'weak-evidence',
    label: '问题证据弱',
    detail: '缺少目标用户访谈或当前替代行为。',
    severity: 'high'
  },
  {
    id: 'ai-amplify',
    label: 'AI 可能放大错误原型',
    detail: '如果先做全功能 demo，容易把功能完成误判为需求成立。',
    severity: 'high'
  },
  {
    id: 'vanity',
    label: '虚荣指标风险',
    detail: '曝光、点赞、注册不能单独证明 PMF。',
    severity: 'medium'
  }
];

function App() {
  const [idea, setIdea] = useState('');
  const [activeStage, setActiveStage] = useState('idea');
  const [activeAgent, setActiveAgent] = useState('idea');
  const [selectedIndustry, setSelectedIndustry] = useState(saasCatalog[0]?.name || '');
  const [selectedServices, setSelectedServices] = useState([]);
  const [scopeReviewOpen, setScopeReviewOpen] = useState(false);
  const [selectedReviewScope, setSelectedReviewScope] = useState(null);
  const [scopeReview, setScopeReview] = useState(null);
  const [isScopeReviewLoading, setIsScopeReviewLoading] = useState(false);
  const [ideaPanel, setIdeaPanel] = useState(null);
  const [isIdeaPanelLoading, setIsIdeaPanelLoading] = useState(false);
  const [ideaPanelNotice, setIdeaPanelNotice] = useState('等待输入创意后运行 Idea 三 agent 审查。');
  const [questions, setQuestions] = useState(seedQuestions);
  const [answerDraft, setAnswerDraft] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(1);
  const [evidence, setEvidence] = useState([
    { id: 1, type: '访谈', title: 'HVAC 店主访谈', source: 'Zoom 录音', stage: 'Idea' },
    { id: 2, type: '问卷', title: '家庭服务 CRM 调研 N=42', source: 'Google Forms', stage: 'Idea' }
  ]);
  const [evidenceDraft, setEvidenceDraft] = useState({ type: '访谈', title: '', source: '' });
  const [completed, setCompleted] = useState(['目标用户清晰']);
  const [runtimeNotice, setRuntimeNotice] = useState(
    'LLM runtime ready: agent 补充提问将由 LLM 生成；失败时保持 blocked。'
  );
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  const currentStage = stages.find((stage) => stage.id === activeStage);
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId);
  const stageIndex = stages.findIndex((stage) => stage.id === activeStage);
  const currentSaasScope = saasCatalog.find((item) => item.name === selectedIndustry) || saasCatalog[0];

  const score = useMemo(() => {
    const ideaScore = idea.trim().length > 40 ? 16 : idea.trim().length > 0 ? 8 : 0;
    const answerScore = questions.filter((q) => q.status === 'answered').length * 12;
    const evidenceScore = Math.min(evidence.length * 8, 32);
    const checklistScore = Math.min(completed.length * 5, 20);
    return Math.min(100, ideaScore + answerScore + evidenceScore + checklistScore);
  }, [idea, questions, evidence, completed]);

  const gateReady = currentStage.requirements.every((item) => completed.includes(item));
  const openQuestionCount = questions.filter((question) => question.status === 'open').length;
  const answeredQuestionCount = questions.filter((question) => question.status === 'answered').length;

  function saveAnswer() {
    if (!selectedQuestion || !answerDraft.trim()) return;
    setQuestions((items) =>
      items.map((item) =>
        item.id === selectedQuestion.id
          ? { ...item, answer: answerDraft.trim(), status: 'answered' }
          : item
      )
    );
    setAnswerDraft('');
    const next = questions.find((item) => item.status === 'open' && item.id !== selectedQuestion.id);
    if (next) setSelectedQuestionId(next.id);
  }

  function toggleService(service) {
    const key = `${service.category}：${service.services}`;
    setSelectedServices((items) =>
      items.includes(key) ? items.filter((item) => item !== key) : [...items, key]
    );
  }

  function selectIndustry(industry) {
    setSelectedIndustry(industry);
    setSelectedServices([]);
  }

  function addSaasScopeToIdea() {
    if (!selectedIndustry || selectedServices.length === 0) return;
    const addition = `\n\nSaaS 范围参考：${selectedIndustry}；候选服务：${selectedServices.join('、')}。`;
    setIdea((value) => (value.includes(addition.trim()) ? value : `${value}${addition}`.trim()));
  }

  async function openScopeReview(scope) {
    setSelectedReviewScope(scope);
    setScopeReview(null);
    setScopeReviewOpen(true);
    setIsScopeReviewLoading(true);
    try {
      const response = await fetch('/api/saas-scope-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: scope.name,
          services: scope.items,
          idea,
          selected_services: selectedServices
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Scope review failed.');
      }
      setScopeReview(result);
    } catch (error) {
      setScopeReview({
        status: 'blocked',
        industry: scope.name,
        agent_name: 'Skeptic Agent',
        initial_questions: [`blocked: ${error.message}`],
        thresholds: [],
        evidence_required: [],
        killer_risks: [],
        ai_amplification_traps: [],
        next_action: 'LLM 输出不可用，未生成本地替代质疑。'
      });
    } finally {
      setIsScopeReviewLoading(false);
    }
  }

  async function requestAgentQuestion(mode = 'followup') {
    setIsAgentLoading(true);
    setRuntimeNotice('LLM agent 正在生成补充追问...');
    try {
      const response = await fetch('/api/agent-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAgentContext(mode))
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Agent runtime failed.');
      }
      if (!result.question || !result.agent_id) {
        throw new Error('Agent output missing required fields.');
      }
      const agentId = agents.some((agent) => agent.id === result.agent_id)
        ? result.agent_id
        : activeAgent;
      const question = {
        id: Date.now(),
        agent: agentId,
        status: 'open',
        source: 'llm',
        text: result.question,
        answer: '',
        rationale: result.rationale,
        missingEvidence: result.missing_evidence || [],
        riskFlags: result.risk_flags || []
      };
      setQuestions((items) => [question, ...items]);
      setSelectedQuestionId(question.id);
      setRuntimeNotice(`${agentLabel(agentId)} 已生成 LLM-backed 追问：${result.rationale || '等待用户补充证据。'}`);
    } catch (error) {
      setRuntimeNotice(`blocked: ${error.message} 未生成伪 agent 输出。`);
    } finally {
      setIsAgentLoading(false);
    }
  }

  async function runIdeaAgentPanel() {
    setIsIdeaPanelLoading(true);
    setIdeaPanelNotice('LLM 正在运行 Idea 阶段 3-agent 审查...');
    try {
      const response = await fetch('/api/idea-agent-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          saas_scope: {
            industry: selectedIndustry,
            selected_services: selectedServices,
            available_services: currentSaasScope?.items || []
          },
          evidence,
          gate_requirements: stages[0].requirements
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Idea panel failed.');
      }
      setIdeaPanel(result);
      setIdeaPanelNotice(`${result.positive_agent?.name || '正方 agent'} 与 2 个反方 agent 已完成审查；${result.dedupe_note || '反方内容已去重。'}`);
    } catch (error) {
      setIdeaPanel(null);
      setIdeaPanelNotice(`blocked: ${error.message} 未生成本地替代审查。`);
    } finally {
      setIsIdeaPanelLoading(false);
    }
  }

  function addEvidence() {
    if (!evidenceDraft.title.trim() || !evidenceDraft.source.trim()) return;
    setEvidence((items) => [
      ...items,
      { id: Date.now(), ...evidenceDraft, stage: currentStage.title }
    ]);
    setEvidenceDraft({ type: '访谈', title: '', source: '' });
  }

  function toggleRequirement(item) {
    setCompleted((items) =>
      items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item]
    );
  }

  function buildAgentContext(mode) {
    return {
      mode,
      active_agent: activeAgent,
      active_stage: currentStage,
      idea,
      saas_scope: {
        industry: selectedIndustry,
        selected_services: selectedServices,
        available_services: currentSaasScope?.items?.slice(0, 20) || []
      },
      questions: questions.map(({ agent, status, source, text, answer }) => ({
        agent,
        status,
        source,
        text,
        answer
      })),
      evidence,
      completed_requirements: completed,
      gate_ready: gateReady
    };
  }

  function agentLabel(agentId) {
    return agents.find((agent) => agent.id === agentId)?.name || 'Agent';
  }

  function requestGateReview() {
    requestAgentQuestion('gate_review');
  }

  return (
    <div className="app-shell">
      <TopBar idea={idea} />
      <div className="layout">
        <StageRail
          stages={stages}
          activeStage={activeStage}
          setActiveStage={setActiveStage}
          stageIndex={stageIndex}
          score={score}
          completedCount={completed.length}
        />
        <main className="workspace">
          <AgentTabs
            agents={agents}
            activeAgent={activeAgent}
            setActiveAgent={setActiveAgent}
          />
          <IdeaComposer idea={idea} setIdea={setIdea} />
          <IdeaAgentPanel
            panel={ideaPanel}
            notice={ideaPanelNotice}
            loading={isIdeaPanelLoading}
            runIdeaAgentPanel={runIdeaAgentPanel}
          />
          <SaasIndustryMap
            catalog={saasCatalog}
            selectedIndustry={selectedIndustry}
            selectIndustry={selectIndustry}
            openScopeReview={openScopeReview}
          />
          <SaasScopePicker
            catalog={saasCatalog}
            currentScope={currentSaasScope}
            selectedIndustry={selectedIndustry}
            selectIndustry={selectIndustry}
            selectedServices={selectedServices}
            toggleService={toggleService}
            addSaasScopeToIdea={addSaasScopeToIdea}
          />
          <QuestionThread
            agents={agents}
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            setSelectedQuestionId={setSelectedQuestionId}
            answerDraft={answerDraft}
            setAnswerDraft={setAnswerDraft}
            saveAnswer={saveAnswer}
            requestAgentQuestion={requestAgentQuestion}
            runtimeNotice={runtimeNotice}
            isAgentLoading={isAgentLoading}
          />
          <EvidenceCapture
            evidence={evidence}
            evidenceDraft={evidenceDraft}
            setEvidenceDraft={setEvidenceDraft}
            addEvidence={addEvidence}
          />
          <GateChecklist
            stage={currentStage}
            completed={completed}
            toggleRequirement={toggleRequirement}
            gateReady={gateReady}
            requestGateReview={requestGateReview}
            isAgentLoading={isAgentLoading}
          />
        </main>
        <Inspector
          score={score}
          riskRules={riskRules}
          currentStage={currentStage}
          completed={completed}
          evidenceCount={evidence.length}
          openQuestionCount={openQuestionCount}
          answeredQuestionCount={answeredQuestionCount}
          gateReady={gateReady}
          requestGateReview={requestGateReview}
          runtimeNotice={runtimeNotice}
          isAgentLoading={isAgentLoading}
        />
      </div>
      <ScopeReviewModal
        open={scopeReviewOpen}
        scope={selectedReviewScope}
        review={scopeReview}
        loading={isScopeReviewLoading}
        onClose={() => setScopeReviewOpen(false)}
        onUseScope={() => {
          if (!selectedReviewScope) return;
          selectIndustry(selectedReviewScope.name);
          setScopeReviewOpen(false);
        }}
      />
    </div>
  );
}

function parseSaasCatalog(markdown) {
  const sections = [];
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+\d+\.\s+(.+)$/);
    if (heading) {
      current = { name: heading[1].trim(), items: [] };
      sections.push(current);
      continue;
    }
    if (!current || !line.startsWith('|') || line.includes('---')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 2 || cells[0] === '类别' || cells[0] === '模块') continue;
    current.items.push({ category: cells[0], services: cells[1] });
  }
  return sections.filter((section) => section.items.length > 0);
}

function TopBar({ idea }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark"><Layers size={18} /></span>
        <span>Startup Validation Cockpit</span>
      </div>
      <div className="idea-select">
        <Sparkles size={16} />
        <span>{idea.trim() || '输入创意后开始验证'}</span>
      </div>
      <div className="top-actions">
        <button><Share2 size={16} /> Share</button>
        <button><Download size={16} /> Export</button>
        <button><History size={16} /> History</button>
        <button className="icon-button"><Settings size={17} /></button>
        <span className="avatar">AK</span>
      </div>
    </header>
  );
}

function StageRail({ stages, activeStage, setActiveStage, stageIndex, score, completedCount }) {
  return (
    <aside className="stage-rail">
      <p className="rail-label">VALIDATION FRAMEWORK</p>
      <div className="stage-list">
        {stages.map((stage, index) => {
          const locked = index > stageIndex && stage.id !== activeStage;
          return (
            <button
              key={stage.id}
              className={`stage-card ${activeStage === stage.id ? 'active' : ''}`}
              onClick={() => setActiveStage(stage.id)}
            >
              <span className="stage-number">{stage.number}</span>
              <span className="stage-copy">
                <strong>{stage.title}</strong>
                <small>{stage.subtitle}</small>
                <em>{locked ? <Lock size={12} /> : null}{locked ? 'LOCKED' : 'IN PROGRESS'}</em>
              </span>
              <span className="gate-line"><Circle size={14} /> {stage.gate}</span>
            </button>
          );
        })}
      </div>
      <div className="overview-panel">
        <p>OVERVIEW</p>
        <div className="progress-row">
          <span>Overall Progress</span>
          <strong>{Math.round(score)}%</strong>
        </div>
        <div className="progress-track"><span style={{ width: `${score}%` }} /></div>
        <div className="progress-row">
          <span>Checklist Items</span>
          <strong>{completedCount}</strong>
        </div>
        <button className="summary-button"><ClipboardCheck size={16} /> View Summary</button>
      </div>
    </aside>
  );
}

function AgentTabs({ agents, activeAgent, setActiveAgent }) {
  return (
    <nav className="agent-tabs">
      {agents.map((agent) => {
        const Icon = agent.icon;
        return (
          <button
            key={agent.id}
            className={activeAgent === agent.id ? 'selected' : ''}
            onClick={() => setActiveAgent(agent.id)}
            title={agent.role}
          >
            <Icon size={17} />
            <span>{agent.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

function IdeaComposer({ idea, setIdea }) {
  return (
    <section className="composer">
      <div>
        <h1>Describe your startup idea</h1>
        <p>写清问题、目标用户、现有替代方案和为什么现在值得解决。</p>
      </div>
      <textarea
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        placeholder="例如：为家庭服务商家做一个 AI 驱动的垂直 CRM，自动处理排期、跟进和客户沟通。"
      />
      <div className="composer-footer">
        <span><HelpCircle size={15} /> 不要先写功能清单，先写用户问题和证据。</span>
        <span>{idea.length} / 2000</span>
        <button><Save size={15} /> Save Idea</button>
      </div>
    </section>
  );
}

function IdeaAgentPanel({ panel, notice, loading, runIdeaAgentPanel }) {
  const positive = panel?.positive_agent;
  const skeptics = panel?.skeptic_agents || [];
  return (
    <section className="panel idea-agent-panel">
      <div className="panel-header">
        <div>
          <h2>Idea 3-Agent Review</h2>
          <p>1 个正方基础分析建议 agent，2 个反方门槛 agent；反方输出会去重。</p>
        </div>
        <button className="idea-run-button" onClick={runIdeaAgentPanel} disabled={loading}>
          <Sparkles size={15} /> {loading ? 'Reviewing' : 'Run 3 Agents'}
        </button>
      </div>
      <div className="idea-panel-notice">{notice}</div>
      {loading ? (
        <div className="idea-loading">
          <Sparkles size={20} />
          <span>LLM 正在分别生成正方建议、需求反方质疑、执行反方质疑...</span>
        </div>
      ) : panel ? (
        <div className="idea-agent-grid">
          <AgentReviewCard
            tone="positive"
            title={positive?.name || 'Idea Advocate Agent'}
            subtitle="正方：基础分析建议"
            summary={positive?.summary}
            groups={[
              ['机会点', positive?.opportunities],
              ['下一步建议', positive?.suggested_next_steps]
            ]}
          />
          {skeptics.map((agent) => (
            <AgentReviewCard
              key={agent.name}
              tone="negative"
              title={agent.name}
              subtitle={agent.angle === 'demand_market_payment' ? '反方：需求/市场/付费' : '反方：执行/原型/交付'}
              summary="必须先过门槛，否则不得进入 MVP。"
              groups={[
                ['质疑', agent.objections],
                ['门槛', agent.thresholds],
                ['证据要求', agent.required_evidence]
              ]}
            />
          ))}
        </div>
      ) : (
        <div className="idea-empty-state">
          <strong>还没有 agent 审查结果。</strong>
          <span>输入创意和 SaaS 范围后运行，结果必须来自 LLM。</span>
        </div>
      )}
      {panel?.next_action ? <div className="idea-next-action"><Flag size={16} /> {panel.next_action}</div> : null}
    </section>
  );
}

function AgentReviewCard({ tone, title, subtitle, summary, groups }) {
  return (
    <article className={`agent-review-card ${tone}`}>
      <div>
        <span>{subtitle}</span>
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
      {groups.map(([label, items]) => (
        <div className="agent-review-group" key={label}>
          <strong>{label}</strong>
          <ul>
            {(items || []).map((item, index) => (
              <li key={`${label}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

function SaasIndustryMap({ catalog, selectedIndustry, selectIndustry, openScopeReview }) {
  return (
    <section className="panel industry-map-panel">
      <div className="panel-header">
        <div>
          <h2>25 Vertical SaaS Industries</h2>
          <p>点击行业，打开 LLM-backed Skeptic Agent 的初始质疑和验证门槛。</p>
        </div>
      </div>
      <div className="industry-grid">
        {catalog.map((scope, index) => (
          <button
            key={scope.name}
            className={selectedIndustry === scope.name ? 'industry-card selected' : 'industry-card'}
            onClick={() => openScopeReview(scope)}
          >
            <span className="industry-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{scope.name}</strong>
            <small>{scope.items.length} 个服务方向</small>
            <em>{scope.items.slice(0, 3).map((item) => item.category).join(' / ')}</em>
          </button>
        ))}
      </div>
      <div className="industry-footer">
        <span>数据源：saas.md</span>
        <span>点击只触发 LLM 审查，不自动视为已验证方向。</span>
      </div>
    </section>
  );
}

function ScopeReviewModal({ open, scope, review, loading, onClose, onUseScope }) {
  if (!open || !scope) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="scope-modal" role="dialog" aria-modal="true" aria-label={`${scope.name} agent review`}>
        <div className="modal-header">
          <div>
            <span className="modal-agent">Skeptic Agent</span>
            <h2>{scope.name}</h2>
            <p>初始质疑、证据门槛和 AI 原型风险由 LLM LLM 生成。</p>
          </div>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <Sparkles size={22} />
            <strong>LLM agent 正在审查这个 SaaS 方向...</strong>
            <span>缺字段或输出无效会 fail-closed，不会显示本地兜底内容。</span>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-status">
              <span className={review?.status === 'blocked' ? 'status-blocked' : 'status-ok'}>
                {review?.status || 'blocked'}
              </span>
              <strong>{review?.next_action || '没有可用审查结果。'}</strong>
            </div>
            <ReviewList title="初始质疑" items={review?.initial_questions} />
            <ReviewList title="进入 Idea Gate 的门槛" items={review?.thresholds} />
            <ReviewList title="必须收集的证据" items={review?.evidence_required} />
            <ReviewList title="应淘汰或暂停的信号" items={review?.killer_risks} />
            <ReviewList title="AI 放大错误原型陷阱" items={review?.ai_amplification_traps} />
            <div className="modal-services">
              <h3>该行业服务范围</h3>
              <div>
                {scope.items.map((item) => (
                  <span key={`${item.category}-${item.services}`}>{item.category}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary-action" onClick={onUseScope}>Use This Scope</button>
        </div>
      </section>
    </div>
  );
}

function ReviewList({ title, items = [] }) {
  return (
    <div className="review-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>无可用 LLM 输出。</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SaasScopePicker({
  catalog,
  currentScope,
  selectedIndustry,
  selectIndustry,
  selectedServices,
  toggleService,
  addSaasScopeToIdea
}) {
  const shownItems = currentScope?.items || [];
  return (
    <section className="panel scope-panel">
      <div className="panel-header">
        <div>
          <h2>SaaS Scope Prompts</h2>
          <p>从 `saas.md` 选择行业和典型服务，为创意生成更多可验证方向。</p>
        </div>
        <div className="scope-actions">
          <select
            value={selectedIndustry}
            onChange={(event) => selectIndustry(event.target.value)}
          >
            {catalog.map((scope) => (
              <option key={scope.name} value={scope.name}>{scope.name}</option>
            ))}
          </select>
          <button onClick={addSaasScopeToIdea} disabled={selectedServices.length === 0}>
            <Plus size={15} /> Add to Idea
          </button>
        </div>
      </div>
      <div className="scope-strip">
        {shownItems.map((item) => {
          const key = `${item.category}：${item.services}`;
          const selected = selectedServices.includes(key);
          return (
            <button
              key={key}
              className={selected ? 'scope-chip selected' : 'scope-chip'}
              onClick={() => toggleService(item)}
              title={item.services}
            >
              <strong>{item.category}</strong>
              <span>{item.services}</span>
            </button>
          );
        })}
      </div>
      <div className="scope-summary">
        <span>{catalog.length} 个 SaaS 行业范围</span>
        <span>{shownItems.length} 个当前行业服务项</span>
        <span>{selectedServices.length} 个已选提示</span>
      </div>
    </section>
  );
}

function QuestionThread({
  agents,
  questions,
  selectedQuestionId,
  setSelectedQuestionId,
  answerDraft,
  setAnswerDraft,
  saveAnswer,
  requestAgentQuestion,
  runtimeNotice,
  isAgentLoading
}) {
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId);
  return (
    <section className="panel question-panel">
      <div className="panel-header">
        <div>
          <h2>Agent Question Thread</h2>
          <p>回答 agent 的补充问题，补齐证据后才能推进门禁。</p>
        </div>
        <div className="panel-actions">
          <button className="ghost-button"><SlidersHorizontal size={15} /> Filter</button>
          <button onClick={() => requestAgentQuestion('followup')} disabled={isAgentLoading}>
            <Plus size={15} /> {isAgentLoading ? 'Thinking' : 'Ask Next'}
          </button>
        </div>
      </div>
      <div className="runtime-notice">{runtimeNotice}</div>
      <div className="thread-grid">
        <div className="question-list">
          {questions.map((question) => {
            const agent = agents.find((item) => item.id === question.agent);
            const Icon = agent.icon;
            return (
              <button
                key={question.id}
                className={`question-row ${selectedQuestionId === question.id ? 'active' : ''}`}
                onClick={() => setSelectedQuestionId(question.id)}
              >
                <Icon size={18} />
                <span>
                  <strong>{agent.name}</strong>
                  <small>{question.text}</small>
                  <i>{question.source === 'spec' ? 'Spec starter question' : 'LLM generated'}</i>
                </span>
                <em className={question.status}>{question.status}</em>
              </button>
            );
          })}
        </div>
        <div className="answer-box">
          {selectedQuestion ? (
            <>
              <div className="answer-heading">
                <MessageSquare size={18} />
                <strong>{selectedQuestion.text}</strong>
              </div>
              {selectedQuestion.answer ? (
                <div className="saved-answer">{selectedQuestion.answer}</div>
              ) : (
                <>
                  <textarea
                    value={answerDraft}
                    onChange={(event) => setAnswerDraft(event.target.value)}
                    placeholder="补充真实证据、用户原话、访谈结论或你还不确定的地方。"
                  />
                  <button className="primary-action" onClick={saveAnswer}>
                    <Send size={15} /> Submit Answer
                  </button>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function EvidenceCapture({ evidence, evidenceDraft, setEvidenceDraft, addEvidence }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Capture Evidence</h2>
          <p>证据必须来自真实用户、真实行为或可追溯记录。</p>
        </div>
      </div>
      <div className="evidence-form">
        <select
          value={evidenceDraft.type}
          onChange={(event) => setEvidenceDraft({ ...evidenceDraft, type: event.target.value })}
        >
          <option>访谈</option>
          <option>问卷</option>
          <option>市场数据</option>
          <option>操作录屏</option>
          <option>支付/预约</option>
        </select>
        <input
          value={evidenceDraft.title}
          onChange={(event) => setEvidenceDraft({ ...evidenceDraft, title: event.target.value })}
          placeholder="证据标题"
        />
        <input
          value={evidenceDraft.source}
          onChange={(event) => setEvidenceDraft({ ...evidenceDraft, source: event.target.value })}
          placeholder="来源"
        />
        <button onClick={addEvidence}><Plus size={15} /> Add Evidence</button>
      </div>
      <div className="evidence-table">
        <div className="table-head">
          <span>TYPE</span>
          <span>TITLE / DESCRIPTION</span>
          <span>SOURCE</span>
          <span>STAGE</span>
        </div>
        {evidence.map((item) => (
          <div className="table-row" key={item.id}>
            <span><FileText size={15} /> {item.type}</span>
            <strong>{item.title}</strong>
            <span>{item.source}</span>
            <span>{item.stage}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GateChecklist({ stage, completed, toggleRequirement, gateReady, requestGateReview, isAgentLoading }) {
  return (
    <section className="panel gate-panel">
      <div className="panel-header">
        <div>
          <h2>{stage.gate} Checklist</h2>
          <p>缺任何关键证据都必须 blocked，不能伪完成。</p>
        </div>
        <span className={gateReady ? 'gate-status pass' : 'gate-status'}>
          {completed.filter((item) => stage.requirements.includes(item)).length} / {stage.requirements.length} completed
        </span>
      </div>
      <div className="check-grid">
        {stage.requirements.map((item) => {
          const checked = completed.includes(item);
          return (
            <button
              key={item}
              className={checked ? 'check-item checked' : 'check-item'}
              onClick={() => toggleRequirement(item)}
            >
              <span>{checked ? <Check size={14} /> : <Circle size={14} />}</span>
              {item}
            </button>
          );
        })}
      </div>
      <button className="review-button" onClick={requestGateReview} disabled={isAgentLoading}>
        {isAgentLoading ? 'Reviewing' : 'Request Gate Review'} <ChevronRight size={15} />
      </button>
    </section>
  );
}

function Inspector({
  score,
  riskRules,
  currentStage,
  completed,
  evidenceCount,
  openQuestionCount,
  answeredQuestionCount,
  gateReady,
  requestGateReview,
  runtimeNotice,
  isAgentLoading
}) {
  const stageCompleted = completed.filter((item) => currentStage.requirements.includes(item)).length;
  const runtimeBlocked = runtimeNotice.startsWith('blocked:');
  return (
    <aside className="inspector">
      <section className="score-card">
        <h2>Validation Score</h2>
        <p>当前创意离通过 {currentStage.title} 门禁还有多远？</p>
        <div className="score-dial" style={{ '--score': `${score * 3.6}deg` }}>
          <span>{score}</span>
          <small>/100</small>
        </div>
        <strong>{score >= 70 ? 'STRONG' : score >= 45 ? 'FAIR' : 'WEAK'}</strong>
      </section>
      <section className="side-card">
        <div className="side-title">
          <h2>Top Risk Flags</h2>
          <span>{riskRules.length}</span>
        </div>
        {riskRules.map((risk) => (
          <div className="risk-row" key={risk.id}>
            <TriangleAlert size={18} />
            <span>
              <strong>{risk.label}</strong>
              <small>{risk.detail}</small>
            </span>
          </div>
        ))}
      </section>
      <section className="side-card">
        <div className="side-title">
          <h2>Required Evidence</h2>
          <span>{currentStage.requirements.length - stageCompleted}</span>
        </div>
        <div className="metric-row"><span>Evidence Items</span><strong>{evidenceCount}</strong></div>
        <div className="metric-row"><span>Open Questions</span><strong>{openQuestionCount}</strong></div>
        <div className="metric-row"><span>Answered Questions</span><strong>{answeredQuestionCount}</strong></div>
      </section>
      <section className="side-card">
        <div className="side-title">
          <h2>LLM Runtime</h2>
          <span>{runtimeBlocked ? '!' : '✓'}</span>
        </div>
        <div className="runtime-box">
          <strong>{runtimeBlocked ? 'Fail-closed' : 'LLM active'}</strong>
          <small>{runtimeNotice}</small>
        </div>
      </section>
      <section className="next-card">
        <Flag size={26} />
        <div>
          <h2>{gateReady ? 'Gate Ready' : 'Next Recommended Action'}</h2>
          <p>{gateReady ? '可以请求 agent 做证据审查。' : '先补齐用户证据和 agent 追问。'}</p>
        </div>
        <button onClick={requestGateReview} disabled={isAgentLoading}>
          {isAgentLoading ? 'Thinking' : gateReady ? 'Start Gate Review' : 'Generate Follow-up'}
        </button>
      </section>
    </aside>
  );
}

createRoot(document.getElementById('root')).render(<App />);
