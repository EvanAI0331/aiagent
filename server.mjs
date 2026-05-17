import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
loadEnv(path.join(root, '.env.local'));

const port = Number(process.env.AGENT_API_PORT || 8787);
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekBaseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, {
        ok: Boolean(deepseekApiKey),
        provider: 'deepseek',
        model: deepseekModel
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/agent-question') {
      if (!deepseekApiKey) {
        sendJson(res, 503, {
          error: 'missing_deepseek_api_key',
          message: 'DeepSeek runtime is not configured.'
        });
        return;
      }

      const body = await readJson(req);
      const payload = await callDeepSeek(body);
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/saas-scope-review') {
      if (!deepseekApiKey) {
        sendJson(res, 503, {
          error: 'missing_deepseek_api_key',
          message: 'DeepSeek runtime is not configured.'
        });
        return;
      }

      const body = await readJson(req);
      const payload = await callDeepSeekScopeReview(body);
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/idea-agent-panel') {
      if (!deepseekApiKey) {
        sendJson(res, 503, {
          error: 'missing_deepseek_api_key',
          message: 'DeepSeek runtime is not configured.'
        });
        return;
      }

      const body = await readJson(req);
      const payload = await callDeepSeekIdeaPanel(body);
      sendJson(res, 200, payload);
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.code || 'agent_runtime_failed',
      message: error.message || 'Agent runtime failed.'
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Agent API listening on http://127.0.0.1:${port}`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(withStatus(new Error('Request body is too large.'), 413, 'body_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(withStatus(new Error('Invalid JSON request body.'), 400, 'invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

async function callDeepSeekIdeaPanel(context) {
  const response = await fetch(`${deepseekBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: deepseekModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            '你是 Idea 阶段的三 agent 审查 runtime。',
            '必须输出 1 个正方 agent 和 2 个反方 agent。',
            '正方 agent 负责基础分析建议：提炼用户、问题、机会、最小验证路径。',
            '反方 agent A 从需求真实性、市场、付费、替代方案角度质疑并设置门槛。',
            '反方 agent B 从执行复杂度、合规、数据、AI 原型误导、交付风险角度质疑并设置门槛。',
            '两个反方 agent 的质疑、门槛、证据要求不得重复；如果语义相近，保留更具体的一条。',
            '禁止伪成功、禁止虚构用户证据、禁止把“能做”说成“值得做”。',
            '所有字段内容必须使用简体中文。',
            '只输出 JSON，不要 Markdown。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            required_schema: {
              status: 'ok | blocked',
              positive_agent: {
                name: 'Idea Advocate Agent',
                summary: 'string',
                opportunities: ['3 positive but evidence-bound opportunities'],
                suggested_next_steps: ['3 concrete next steps']
              },
              skeptic_agents: [
                {
                  name: 'Demand Skeptic Agent',
                  angle: 'demand_market_payment',
                  objections: ['3 unique objections'],
                  thresholds: ['3 concrete thresholds'],
                  required_evidence: ['3 evidence items']
                },
                {
                  name: 'Execution Skeptic Agent',
                  angle: 'execution_ai_prototype_delivery',
                  objections: ['3 unique objections not overlapping with first skeptic'],
                  thresholds: ['3 concrete thresholds not overlapping with first skeptic'],
                  required_evidence: ['3 evidence items not overlapping with first skeptic']
                }
              ],
              dedupe_note: 'brief note explaining deduplication',
              next_action: 'one concrete next action'
            },
            context
          })
        }
      ]
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw withStatus(
      new Error(`DeepSeek request failed with HTTP ${response.status}.`),
      502,
      'deepseek_http_error'
    );
  }

  const parsed = parseProviderJson(text, 'Idea panel output');
  if (!parsed.status || !parsed.positive_agent || !Array.isArray(parsed.skeptic_agents) || parsed.skeptic_agents.length !== 2) {
    throw withStatus(new Error('Idea panel output missed required fields.'), 502, 'invalid_agent_schema');
  }

  const skepticAgents = dedupeSkepticAgents(parsed.skeptic_agents);
  const validSkeptics = skepticAgents.every((agent) =>
    agent.name &&
    agent.angle &&
    nonEmptyArray(agent.objections) &&
    nonEmptyArray(agent.thresholds) &&
    nonEmptyArray(agent.required_evidence)
  );

  if (!validSkeptics || !parsed.positive_agent.summary) {
    throw withStatus(new Error('Idea panel output missed required agent content.'), 502, 'invalid_agent_schema');
  }

  return {
    status: parsed.status,
    positive_agent: {
      name: parsed.positive_agent.name || 'Idea Advocate Agent',
      summary: parsed.positive_agent.summary,
      opportunities: Array.isArray(parsed.positive_agent.opportunities) ? parsed.positive_agent.opportunities : [],
      suggested_next_steps: Array.isArray(parsed.positive_agent.suggested_next_steps) ? parsed.positive_agent.suggested_next_steps : []
    },
    skeptic_agents: skepticAgents,
    dedupe_note: parsed.dedupe_note || '反方内容已按规范去重。',
    next_action: parsed.next_action || ''
  };
}

function parseProviderJson(text, label) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw withStatus(new Error('DeepSeek returned invalid JSON envelope.'), 502, 'invalid_provider_json');
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw withStatus(new Error('DeepSeek response did not contain message content.'), 502, 'missing_provider_content');
  }
  try {
    return JSON.parse(content);
  } catch {
    throw withStatus(new Error(`${label} was not valid JSON.`), 502, 'invalid_agent_json');
  }
}

function dedupeSkepticAgents(agents) {
  const seen = new Set();
  return agents.map((agent) => ({
    name: agent.name,
    angle: agent.angle,
    objections: dedupeList(agent.objections, seen),
    thresholds: dedupeList(agent.thresholds, seen),
    required_evidence: dedupeList(agent.required_evidence, seen)
  }));
}

function dedupeList(items, seen) {
  if (!Array.isArray(items)) return [];
  const result = [];
  for (const item of items) {
    const text = String(item || '').trim();
    const key = normalizeText(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[，。！？、；：,.!?;:\s]/g, '')
    .replace(/用户|客户|证据|门槛|需要/g, '');
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

async function callDeepSeekScopeReview(context) {
  const response = await fetch(`${deepseekBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: deepseekModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            '你是 LLM-backed SaaS 创业验证 Skeptic Agent。',
            '用户点击一个垂直 SaaS 行业后，你必须生成该行业的初始质疑、进入 Idea Gate 的门槛、必须收集的证据和最容易被 AI 放大的错误原型。',
            '必须遵循 Idea -> MVP -> Launch -> Scale 验证框架。',
            'SaaS 行业列表只能提供候选方向，不能替代真实用户证据。',
            '禁止伪成功、禁止虚构市场反馈、禁止把“能做”说成“值得做”。',
            '只输出 JSON，不要 Markdown。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            required_schema: {
              status: 'ok | blocked',
              industry: 'string',
              agent_name: 'Skeptic Agent',
              initial_questions: ['3 concise skeptical questions in Chinese'],
              thresholds: ['4 concrete pass thresholds in Chinese'],
              evidence_required: ['4 required evidence items in Chinese'],
              killer_risks: ['3 reasons to reject or pause in Chinese'],
              ai_amplification_traps: ['3 AI prototype traps in Chinese'],
              next_action: 'one concrete next action in Chinese'
            },
            context
          })
        }
      ]
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw withStatus(
      new Error(`DeepSeek request failed with HTTP ${response.status}.`),
      502,
      'deepseek_http_error'
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw withStatus(new Error('DeepSeek returned invalid JSON envelope.'), 502, 'invalid_provider_json');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw withStatus(new Error('DeepSeek response did not contain message content.'), 502, 'missing_provider_content');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw withStatus(new Error('Scope review output was not valid JSON.'), 502, 'invalid_agent_json');
  }

  const requiredArrays = [
    'initial_questions',
    'thresholds',
    'evidence_required',
    'killer_risks',
    'ai_amplification_traps'
  ];
  const hasArrays = requiredArrays.every((key) => Array.isArray(parsed[key]) && parsed[key].length > 0);
  if (!parsed.status || !parsed.industry || !parsed.next_action || !hasArrays) {
    throw withStatus(new Error('Scope review output missed required fields.'), 502, 'invalid_agent_schema');
  }

  return {
    status: parsed.status,
    industry: parsed.industry,
    agent_name: parsed.agent_name || 'Skeptic Agent',
    initial_questions: parsed.initial_questions,
    thresholds: parsed.thresholds,
    evidence_required: parsed.evidence_required,
    killer_risks: parsed.killer_risks,
    ai_amplification_traps: parsed.ai_amplification_traps,
    next_action: parsed.next_action
  };
}

async function callDeepSeek(context) {
  const response = await fetch(`${deepseekBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: deepseekModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            '你是 LLM-backed 创业验证 agent runtime。',
            '必须遵循 Idea -> MVP -> Launch -> Scale 验证框架。',
            '如果 context.saas_scope 存在，必须把用户选择的垂直 SaaS 行业、候选服务和可用服务项作为追问上下文。',
            'SaaS 范围只能用于扩展可选方向和提出验证问题，不能替代真实用户证据。',
            '禁止伪成功、禁止虚构用户证据、禁止把脚本判断称为 agent。',
            '如果证据不足，必须明确 blocked，并提出一个最关键的追问。',
            '只输出 JSON，不要 Markdown。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            required_schema: {
              status: 'ok | blocked',
              agent_id: 'string',
              question: 'one concise follow-up question in Chinese',
              rationale: 'why this question matters',
              missing_evidence: ['evidence item'],
              risk_flags: ['risk']
            },
            context
          })
        }
      ]
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw withStatus(
      new Error(`DeepSeek request failed with HTTP ${response.status}.`),
      502,
      'deepseek_http_error'
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw withStatus(new Error('DeepSeek returned invalid JSON envelope.'), 502, 'invalid_provider_json');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw withStatus(new Error('DeepSeek response did not contain message content.'), 502, 'missing_provider_content');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw withStatus(new Error('Agent output was not valid JSON.'), 502, 'invalid_agent_json');
  }

  if (!parsed.status || !parsed.agent_id || !parsed.question) {
    throw withStatus(new Error('Agent output missed required fields.'), 502, 'invalid_agent_schema');
  }

  return {
    status: parsed.status,
    agent_id: parsed.agent_id,
    question: parsed.question,
    rationale: parsed.rationale || '',
    missing_evidence: Array.isArray(parsed.missing_evidence) ? parsed.missing_evidence : [],
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : []
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function withStatus(error, statusCode, code) {
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
