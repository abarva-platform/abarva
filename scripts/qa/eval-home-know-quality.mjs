#!/usr/bin/env node
//
// Home KNOW answer-quality eval. POSTs the golden question bank to the live
// /api/home/know/ask engine, applies the deterministic gate (Layer 1), and — if
// ANTHROPIC_API_KEY is set — runs the LLM judge (Layer 2) and prints the verdict.
//
// See docs/semantic2-answer-synthesis/QUALITY_EVAL.md.
//
// Env:
//   BASE_URL           engine origin (default http://localhost:3000)
//   HOME_KNOW_COOKIE   a signed-in SkyHarbor session cookie (the route requires auth)
//   HOME_KNOW_STORAGE_STATE optional — signed-in Playwright storageState; preferred for Clerk sessions
//   ANTHROPIC_API_KEY  optional — enables the Layer-2 LLM judge
//   JUDGE_MODEL        optional — default claude-opus-4-8
//   HOME_KNOW_QUALITY_OUT optional — writes exact response audit JSON

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const COOKIE = process.env.HOME_KNOW_COOKIE || '';
const STORAGE_STATE = process.env.HOME_KNOW_STORAGE_STATE || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-opus-4-8';
const OUT = process.env.HOME_KNOW_QUALITY_OUT || '';

const QUESTIONS = [
  { id: 1, q: "What do we know about SkyHarbor's IT organization and ownership model?" },
  { id: 2, q: 'Which business capabilities are most dependent on mission-critical systems?' },
  { id: 3, q: 'What does the loaded data and analytics estate tell us, and what is still missing?' },
  { id: 4, q: 'Which vendors create the largest operational dependency footprint?' },
  { id: 5, q: 'Where should SkyHarbor place the next $30M in AI?', expectHandoff: true },
  { id: 6, q: 'Which of our applications are unsupported or near end of life?' },
  { id: 7, q: 'What does it cost to run our most critical systems?' },
  { id: 8, q: 'Who leads cybersecurity and what is its budget?' },
];

const ROW_COUNT_LEAD = /^\s*(i\s+found|there\s+(are|were)|we\s+have|loaded)\b|^\s*\d[\d,]*\s+(rows|records|teams|apps|applications|vendors|data\s+products|systems)\b/i;
const RAW_ID = /\b(SHA-[A-Z]{2,}-\d+|APP-\d{4,}|DP-\d{4,}|CON-\d{4,}|NODE-\d+|EDGE-\d+)\b/;
const DEBUG_LANG = /\b(local env|read path|pattern family|enterprise_context_|mv_home_|Current-state read|Evidence points)\b/i;
const INTERNAL_DOSSIER_LANG =
  /\b(dossier|binder|dimension family|primary dimension|related dimension|source families|sections attached|composer packet|semantic packet|artifact plan|answer boundary|quality gate)\b/i;
const DECISION_RE =
  /\b(should|recommend|prioriti[sz]e|decide|invest|investment|option|roadmap|sequence|sequencing|kill|scale|stop|bet|bets|next \$?\d|where should|what would you tell|single biggest constraint|most defensible|behind peers|close the gap)\b/i;
const TABLE_RE = /\b(table|tabulate|list)\b/i;
const CHART_RE = /\b(chart|bar chart|visuali[sz]e|waterfall|curve|plot)\b/i;
const GRAPH_RE = /\b(graph|map|topology|lineage|dependency|dependencies|relationship|relationships|blast radius)\b/i;
const NO_BLOCKING_GAP = /\b(no blocking gap|no blocker|nothing blocking)\b/i;

const DIMENSION_PATTERNS = [
  ['risk_compliance', /\b(risks?|controls?|compliance|governance|security|audit|cyber)\b/i],
  ['organization_leadership', /\b(organi[sz]ation|organi[sz]ed|leader|leadership|cio|cto|ciso|cdao|cdto|owner|ownership|accountab|portfolio|team|function|workforce)\b/i],
  ['vendor_contracts', /\b(vendors?|contracts?|licenses?|renewals?|suppliers?|commercial|pricing|sourcing)\b/i],
  ['data_analytics', /\b(data|analytics|warehouse|lakehouse|bi|tableau|power bi|databricks|lineage|data products?|analytics platforms?|analytics tools?)\b/i],
  ['operations_process', /\b(service now|servicenow|jira|tickets?|incidents?|changes?|problems?|bottlenecks?|handoffs?|process|operational friction|repetitive|operations|service)\b/i],
  ['ai_value_governance', /\b(ai|agents?|automation|automate|llm|ai model|machine learning model|value|benefit|roi|initiatives?|adoption)\b/i],
  ['budget_financials', /\b(cost|budget|spend|finance|financial|run|change|funding|dollars?|investment)\b/i],
  ['application_systems', /\b(apps?|applications?|systems?|platforms?|technology|cmdb|integrations?|interfaces?|dependencies?|dependency|lifecycle|end of life|unsupported|system of record|connected)\b/i],
];

const JUDGE_PROMPT = (q, answer) => `You are grading an enterprise "Home" context assistant. It answers factual questions about a company's LOADED data ("what do we know?"). It must read like a senior advisor stating what the evidence shows — NOT like a database report.

QUESTION:
${q}

ANSWER:
${answer}

Score each 1-5 (5 best):
- executive_lead: does the FIRST sentence lead with business meaning, not a row/record count or coverage %?
- synthesis: does it interpret and connect the facts, or just list them?
- gap_specificity: when something is missing, does it name the EXACT missing field, not a vague "no data"?

Hard checks (true/false):
- no_rowcount_lead, no_raw_ids, no_debug_language.

Verdict: one of executive | acceptable | mechanical | blocked.

Return ONLY JSON: { "executive_lead": n, "synthesis": n, "gap_specificity": n, "no_rowcount_lead": b, "no_raw_ids": b, "no_debug_language": b, "verdict": "...", "one_line_reason": "..." }`;

async function askEngine(question, browserPage = null) {
  if (browserPage) {
    const result = await browserPage.evaluate(async (question) => {
      const res = await fetch('/api/home/know/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, client: 'skyharbor', tenantKey: 'skyharbor-air' }),
      });
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { _raw: text }; }
      return { ok: res.ok && !body?._raw, status: res.status, body, validJson: !body?._raw };
    }, question);
    return result;
  }
  const res = await fetch(`${BASE_URL}/api/home/know/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(COOKIE ? { cookie: COOKIE } : {}) },
    body: JSON.stringify({ question, client: 'skyharbor', tenantKey: 'skyharbor-air' }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text }; }
  const validJson = !body?._raw;
  return { ok: res.ok && validJson, status: res.status, body, validJson };
}

async function judge(q, answer) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: JUDGE_MODEL, max_tokens: 500, messages: [{ role: 'user', content: JUDGE_PROMPT(q, answer) }] }),
  });
  const data = await res.json();
  const txt = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const s = txt.indexOf('{'); const e = txt.lastIndexOf('}');
  try { return JSON.parse(txt.slice(s, e + 1)); } catch { return { verdict: 'parse_error', _raw: txt.slice(0, 200) }; }
}

function gate(prose) {
  const lead = (prose || '').split(/(?<=[.!?])\s/)[0] || prose || '';
  return {
    no_rowcount_lead: !ROW_COUNT_LEAD.test(lead),
    no_raw_ids: !RAW_ID.test(prose || ''),
    no_debug_language: !DEBUG_LANG.test(prose || ''),
  };
}

function expectedDimension(question) {
  for (const [dimension, pattern] of DIMENSION_PATTERNS) {
    if (pattern.test(question)) return dimension;
  }
  return 'organization_leadership';
}

function requestedArtifacts(question) {
  return {
    table: TABLE_RE.test(question),
    chart: CHART_RE.test(question),
    graph: GRAPH_RE.test(question),
  };
}

function directlyAnswers(question, prose) {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length >= 4 && ![
      'what', 'which', 'where', 'when', 'does', 'about', 'today', 'tell',
      'from', 'with', 'show', 'give', 'table', 'chart', 'graph', 'loaded',
      'context', 'current', 'most', 'near',
    ].includes(term));
  if (!terms.length) return true;
  const lower = String(prose || '').toLowerCase();
  const matches = terms.filter((term) => {
    if (lower.includes(term)) return true;
    if (term.endsWith('s') && lower.includes(term.slice(0, -1))) return true;
    if (term.endsWith('ies') && lower.includes(`${term.slice(0, -3)}y`)) return true;
    if (term.endsWith('ed') && lower.includes(term.slice(0, -2))) return true;
    return false;
  }).length;
  return matches >= Math.min(2, terms.length);
}

function relevanceGate(question, body, prose) {
  const expected = expectedDimension(question);
  const dimensions = [
    ...(Array.isArray(body?.dimensionsUsed) ? body.dimensionsUsed : []),
    ...(Array.isArray(body?.safety?.composerTrace?.dimensionsUsed) ? body.safety.composerTrace.dimensionsUsed : []),
  ];
  const artifacts = requestedArtifacts(question);
  const handoffTarget = body?.handoff?.target || null;
  const issues = [];
  if (dimensions.length && !dimensions.includes(expected)) issues.push('wrong_dimension_binder');
  if (DECISION_RE.test(question) && handoffTarget !== 'intelligence' && body?.answerStatus !== 'handoff') issues.push('missing_decision_handoff');
  if (artifacts.table && !(body?.tables || []).length) issues.push('missing_requested_table');
  if (artifacts.chart && !(body?.charts || []).length) issues.push('missing_requested_chart');
  if (artifacts.graph && !(body?.graphs || []).length) issues.push('missing_requested_graph');
  if (INTERNAL_DOSSIER_LANG.test(prose || '')) issues.push('internal_dossier_language');
  if (ROW_COUNT_LEAD.test((prose || '').split(/(?<=[.!?])\s/)[0] || '')) issues.push('count_instead_of_insight');
  if (!directlyAnswers(question, prose || '')) issues.push('does_not_directly_answer_question');
  if (NO_BLOCKING_GAP.test(prose || '') && (DECISION_RE.test(question) || artifacts.table || artifacts.chart || artifacts.graph)) {
    issues.push('misleading_no_blocking_gap');
  }
  return {
    passed: issues.length === 0,
    issues: [...new Set(issues)],
    expectedDimension: expected,
    dimensionsUsed: [...new Set(dimensions)],
    requestedArtifacts: Object.entries(artifacts).filter(([, value]) => value).map(([key]) => key),
    actualArtifacts: {
      tables: (body?.tables || []).length,
      charts: (body?.charts || []).length,
      graphs: (body?.graphs || []).length,
    },
    handoffTarget,
  };
}

async function main() {
  console.log(`Engine: ${BASE_URL}/api/home/know/ask  | auth: ${STORAGE_STATE ? 'storageState' : COOKIE ? 'cookie' : 'none'} | judge: ${ANTHROPIC_KEY ? JUDGE_MODEL : 'OFF (no ANTHROPIC_API_KEY)'}\n`);
  let browser = null;
  let browserPage = null;
  if (STORAGE_STATE) {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    browserPage = await context.newPage();
    await browserPage.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle', timeout: 90_000 });
    const bodyText = await browserPage.locator('body').innerText({ timeout: 30_000 });
    if (/sign in|continue/i.test(bodyText) && !/sign out/i.test(bodyText)) {
      await browser.close();
      throw new Error(`storageState did not produce a signed-in Home session: ${bodyText.slice(0, 300)}`);
    }
  }
  const rows = [];
  try {
  for (const item of QUESTIONS) {
    const { ok, status, body, validJson } = await askEngine(item.q, browserPage);
    const prose = body?.prose ?? body?.answer ?? body?._raw ?? '';
    const answerStatus = body?.answerStatus ?? body?.status ?? (body?.handoff ? 'handoff' : '');
    const evidenceChannels = body?.safety?.evidenceChannels ?? {};
    const usableEvidence = body?.safety?.usableEvidence ?? null;
    const g = gate(prose);
    const relevance = relevanceGate(item.q, body, prose);
    let verdict = '—';
    if (ok && prose && ANTHROPIC_KEY && !item.expectHandoff) {
      const j = await judge(item.q, prose);
      verdict = `${j.verdict} (e${j.executive_lead}/s${j.synthesis}/g${j.gap_specificity})`;
    }
    const handoffOk = item.expectHandoff ? (answerStatus === 'handoff' ? 'handoff ✓' : 'NOT handoff ✗') : '';
    rows.push({
      id: item.id,
      question: item.q,
      ok: ok ? status : `ERR ${status}`,
      validJson,
      gate: g,
      relevance,
      verdict: handoffOk || verdict,
      lead: (prose || '').slice(0, 160),
      prose,
      response: body,
      usableEvidence,
      evidenceChannels,
    });
    console.log(`Q${item.id} [${ok ? status : 'ERR ' + status}] rcLead=${g.no_rowcount_lead} rawId=${g.no_raw_ids} debug=${g.no_debug_language} relevance=${relevance.passed ? 'pass' : 'FAIL ' + relevance.issues.join('|')} usableEvidence=${usableEvidence} channels=${JSON.stringify(evidenceChannels)} | ${handoffOk || verdict}`);
    console.log(`   ${(prose || JSON.stringify(body)).slice(0, 160)}\n`);
  }
  const hardFails = rows.filter((r) => r.gate && (!r.gate.no_rowcount_lead || !r.gate.no_raw_ids || !r.gate.no_debug_language));
  const responseShapeFails = rows.filter((r) => !r.validJson);
  const relevanceFails = rows.filter((r) => r.relevance && !r.relevance.passed);
  const mechanical = rows.filter((r) => typeof r.verdict === 'string' && r.verdict.startsWith('mechanical')).length;
  if (OUT) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.mkdir(path.dirname(OUT), { recursive: true });
    await fs.writeFile(OUT, JSON.stringify({ baseUrl: BASE_URL, generatedAt: new Date().toISOString(), rows }, null, 2));
  }
  console.log('──────────────────────────────────────────────');
  console.log(`Hard fails: ${hardFails.length}  | response-shape fails: ${responseShapeFails.length} | relevance fails: ${relevanceFails.length} | mechanical verdicts: ${mechanical}`);
  console.log(responseShapeFails.length ? 'DECISION: request did not reach the Home answer engine; fix auth/session or route proof first.'
    : hardFails.length ? 'DECISION: fix the leak(s) in main\'s engine first.'
    : relevanceFails.length ? 'DECISION: fix relevance, binder, artifact, or handoff failures before calling answers product-ready.'
    : mechanical >= 3 ? 'DECISION: prose reads mechanical → do the LLM-synthesis graft (RECONCILIATION.md).'
    : ANTHROPIC_KEY ? 'DECISION: prose is good enough → no graft needed.'
    : 'DECISION: set ANTHROPIC_API_KEY to get the executive-vs-mechanical verdict.');
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((e) => { console.error('eval failed:', e.message); process.exit(1); });
