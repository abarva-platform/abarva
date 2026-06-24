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
//   ANTHROPIC_API_KEY  optional — enables the Layer-2 LLM judge
//   JUDGE_MODEL        optional — default claude-opus-4-8

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const COOKIE = process.env.HOME_KNOW_COOKIE || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-opus-4-8';

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

async function askEngine(question) {
  const res = await fetch(`${BASE_URL}/api/home/know/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(COOKIE ? { cookie: COOKIE } : {}) },
    body: JSON.stringify({ question, client: 'skyharbor', tenantKey: 'skyharbor-air' }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text }; }
  return { ok: res.ok, status: res.status, body };
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

async function main() {
  console.log(`Engine: ${BASE_URL}/api/home/know/ask  | judge: ${ANTHROPIC_KEY ? JUDGE_MODEL : 'OFF (no ANTHROPIC_API_KEY)'}\n`);
  const rows = [];
  for (const item of QUESTIONS) {
    const { ok, status, body } = await askEngine(item.q);
    const prose = body?.prose ?? body?.answer ?? body?._raw ?? '';
    const answerStatus = body?.answerStatus ?? body?.status ?? (body?.handoff ? 'handoff' : '');
    const g = gate(prose);
    let verdict = '—';
    if (ok && prose && ANTHROPIC_KEY && !item.expectHandoff) {
      const j = await judge(item.q, prose);
      verdict = `${j.verdict} (e${j.executive_lead}/s${j.synthesis}/g${j.gap_specificity})`;
    }
    const handoffOk = item.expectHandoff ? (answerStatus === 'handoff' ? 'handoff ✓' : 'NOT handoff ✗') : '';
    rows.push({ id: item.id, ok: ok ? status : `ERR ${status}`, gate: g, verdict: handoffOk || verdict, lead: (prose || '').slice(0, 90) });
    console.log(`Q${item.id} [${ok ? status : 'ERR ' + status}] rcLead=${g.no_rowcount_lead} rawId=${g.no_raw_ids} debug=${g.no_debug_language} | ${handoffOk || verdict}`);
    console.log(`   ${(prose || JSON.stringify(body)).slice(0, 160)}\n`);
  }
  const hardFails = rows.filter((r) => r.gate && (!r.gate.no_rowcount_lead || !r.gate.no_raw_ids || !r.gate.no_debug_language));
  const mechanical = rows.filter((r) => typeof r.verdict === 'string' && r.verdict.startsWith('mechanical')).length;
  console.log('──────────────────────────────────────────────');
  console.log(`Hard fails: ${hardFails.length}  | mechanical verdicts: ${mechanical}`);
  console.log(hardFails.length ? 'DECISION: fix the leak(s) in main\'s engine first.'
    : mechanical >= 3 ? 'DECISION: prose reads mechanical → do the LLM-synthesis graft (RECONCILIATION.md).'
    : ANTHROPIC_KEY ? 'DECISION: prose is good enough → no graft needed.'
    : 'DECISION: set ANTHROPIC_API_KEY to get the executive-vs-mechanical verdict.');
}

main().catch((e) => { console.error('eval failed:', e.message); process.exit(1); });
