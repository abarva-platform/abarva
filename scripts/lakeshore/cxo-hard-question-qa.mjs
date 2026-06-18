#!/usr/bin/env node
/**
 * Lakeshore CXO hard-question QA harness.
 *
 * Captures 100 finance / treasury / Kyriba / federated-holdings answers through
 * an OpenAI-only agent, scores each answer, and writes JSONL + HTML evidence.
 * The harness is intentionally direct: no Anthropic path, no Pinecone path, and
 * no app-route dependency.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DEFAULT_OUT_ROOT = path.join(REPO_ROOT, 'audit-artifacts/lakeshore-cxo-hard-question-qa');
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 120_000);

const SOURCE_FILES = [
  'docs/build/lakeshore/LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md',
  'docs/build/lakeshore/agent-grounding/LAKESHORE_FINANCE_CFO_AGENT_PACK_2026-06-04.md',
  'docs/build/lakeshore/agent-grounding/LAKESHORE_KYRIBA_SUCCESS_AGENT_PACK_2026-06-04.md',
  'docs/build/lakeshore/agent-grounding/LAKESHORE_CORPUS_ACTIVATION_PLAN.md',
  'docs/build/lakeshore/loaded/README.md',
  'docs/build/lakeshore/loaded/CORPUS_COVERAGE_MAP.md',
  'docs/build/lakeshore/loaded/manifest.json',
  'docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-commit-latest.json',
  'docs/build/lakeshore/loaded/data/vendor-contracts.csv',
  'docs/build/lakeshore/loaded/data/financial-kpi-workbook.csv',
  'docs/build/lakeshore/loaded/data/application-portfolio.csv',
  'docs/build/lakeshore/loaded/data/initiative-portfolio.csv',
  'docs/build/lakeshore/loaded/data/integration-topology.csv',
  'docs/build/lakeshore/loaded/data/erp-landscape-workbook.csv',
  'docs/build/lakeshore/loaded/data/ai-tool-footprint.csv',
  'docs/build/lakeshore/loaded/data/dora-baseline.csv',
  'docs/build/lakeshore/loaded/data/strategy-memo.csv',
  'docs/build/moves-design/lakeshore-federated-ai-strategy/01-lakeshore-federated-structure-brief.md',
  'docs/build/moves-design/lakeshore-federated-ai-strategy/05-design-module-review.md',
];

const CXO_QUESTIONS = [
  ['LSH-CXO-001', 'finance_treasury', 'CFO', 'If Kyriba is not live yet, what exactly can Lakeshore claim today without overstating value?'],
  ['LSH-CXO-002', 'finance_treasury', 'Treasurer', 'What are the six failure modes that usually stall Kyriba rollouts, and which ones are already addressed by Move 0?'],
  ['LSH-CXO-003', 'finance_treasury', 'CFO', 'How should Lakeshore sequence Northern Trust, BMO, JPMorgan, and Wintrust connectivity without letting the tail banks stall the program?'],
  ['LSH-CXO-004', 'finance_treasury', 'Treasurer', 'What evidence proves daily cash position is an operating discipline, not just a Kyriba configuration task?'],
  ['LSH-CXO-005', 'finance_treasury', 'Audit Committee', 'What would make the Kyriba value ledger audit-defensible versus a consulting estimate?'],
  ['LSH-CXO-006', 'finance_treasury', 'CFO', 'How should intercompany lending be governed so Lakeshore avoids sloppy AFR and true-up failures?'],
  ['LSH-CXO-007', 'finance_treasury', 'Treasurer', 'Which cash visibility gaps should be remediated before predictive cash forecasting is presented to the board?'],
  ['LSH-CXO-008', 'finance_treasury', 'CFO', 'How should the board distinguish projected, committed, measuring, and realized Kyriba value?'],
  ['LSH-CXO-009', 'finance_treasury', 'Treasurer', 'What is the go/no-go rule for retiring spreadsheet cash-position workflows?'],
  ['LSH-CXO-010', 'finance_treasury', 'CFO', 'What is the same-day reconciliation rule for cash variance surprises, and who owns it?'],
  ['LSH-CXO-011', 'finance_treasury', 'Treasurer', 'What bank-connectivity protocols matter for Lakeshore, and where should AbarVa refuse fake precision?'],
  ['LSH-CXO-012', 'finance_treasury', 'CFO', 'How should covenant forecasting be incorporated before Kyriba is called successful?'],
  ['LSH-CXO-013', 'finance_treasury', 'Controller', 'What ERP feed defects would break Kyriba reconciliation even if the treasury tool is configured correctly?'],
  ['LSH-CXO-014', 'finance_treasury', 'CFO', 'What entity-hierarchy evidence must be loaded before multi-HoldCo treasury reporting is trusted?'],
  ['LSH-CXO-015', 'finance_treasury', 'Treasurer', 'How should historical cash-position reconstruction be scoped and measured?'],
  ['LSH-CXO-016', 'finance_treasury', 'Audit Committee', 'What audit-log and evidence-retention controls should be required in the Kyriba contract record?'],
  ['LSH-CXO-017', 'finance_treasury', 'CFO', 'Which treasury benefits are real enough to include in a board pack now, and which must stay out?'],
  ['LSH-CXO-018', 'finance_treasury', 'Treasurer', 'What payment workflow controls should be treated as non-negotiable for Lakeshore?'],
  ['LSH-CXO-019', 'finance_treasury', 'CFO', 'How should FX hedging discipline be framed for a diversified holdings company rather than a PE fund?'],
  ['LSH-CXO-020', 'finance_treasury', 'Audit Committee', 'How does AbarVa de-risk adoption so treasury does not quietly return to Excel after go-live?'],

  ['LSH-CXO-021', 'source_kyriba', 'CFO', 'Show the current Source truth for LSH-KYRIBA-TREASURY-2026 by stage, including what remains in review.'],
  ['LSH-CXO-022', 'source_kyriba', 'Procurement', 'Why is the Kyriba Source event safe to demo as full-spine while the AMS event is not?'],
  ['LSH-CXO-023', 'source_kyriba', 'CFO', 'What selection decision can be discussed for Kyriba without implying the award is already complete?'],
  ['LSH-CXO-024', 'source_kyriba', 'Counsel', 'Which contract redlines in the Kyriba contract record are program-critical rather than legal trivia?'],
  ['LSH-CXO-025', 'source_kyriba', 'Treasurer', 'How should the transition plan handle parallel run, variance rules, and cutover readiness?'],
  ['LSH-CXO-026', 'source_kyriba', 'CIO', 'What does the Knowledge Transfer Evidence artifact prove, and what does it not prove yet?'],
  ['LSH-CXO-027', 'source_kyriba', 'CFO', 'What Source gates are met through BAFO, and which downstream gates remain pending?'],
  ['LSH-CXO-028', 'source_kyriba', 'Procurement', 'What would be a misleading Source demo claim about Selection, Transition, or Value?'],
  ['LSH-CXO-029', 'source_kyriba', 'CFO', 'How should the Value Proof story avoid the broken Apex-style UUID/slug failure mode?'],
  ['LSH-CXO-030', 'source_kyriba', 'Audit Committee', 'What evidence chain connects the Kyriba Source event to the linked Move and Tower value story?'],
  ['LSH-CXO-031', 'source_kyriba', 'Procurement', 'What should a BAFO stage answer include for Kyriba to be credible to a treasurer?'],
  ['LSH-CXO-032', 'source_kyriba', 'CFO', 'How should AbarVa answer if asked whether realized savings have already been booked?'],
  ['LSH-CXO-033', 'source_kyriba', 'Treasurer', 'What operating evidence should be required before the first bank wave is called complete?'],
  ['LSH-CXO-034', 'source_kyriba', 'Counsel', 'What data ownership and exit-assistance terms must be visible in the contract record?'],
  ['LSH-CXO-035', 'source_kyriba', 'CFO', 'What should Tower monitor after the Kyriba event moves from Source into transition?'],

  ['LSH-CXO-036', 'moves_program_success', 'CFO', 'What makes Move 0 a Kyriba rollout de-risk Move rather than a generic treasury transformation slide?'],
  ['LSH-CXO-037', 'moves_program_success', 'CIO', 'How does Move 1 AI-on-top-of-Kyriba depend on Move 0 gates rather than running in parallel theatre?'],
  ['LSH-CXO-038', 'moves_program_success', 'Treasurer', 'Which four AI-on-top-of-Kyriba capabilities are credible only after the foundation is clean?'],
  ['LSH-CXO-039', 'moves_program_success', 'CFO', 'How should AbarVa kill or pause the Kyriba Move if entity hierarchy remains unresolved?'],
  ['LSH-CXO-040', 'moves_program_success', 'CIO', 'How does AbarVa prevent a systems integrator from declaring progress without evidence artifacts?'],
  ['LSH-CXO-041', 'moves_program_success', 'CFO', 'What should be in the 30/60/90 mobilization plan for Kyriba, and which milestones are evidence-based?'],
  ['LSH-CXO-042', 'moves_program_success', 'Treasurer', 'How should AbarVa measure adoption beyond login counts?'],
  ['LSH-CXO-043', 'moves_program_success', 'CFO', 'What are the unsafe-to-fund conditions for the Kyriba Move?'],
  ['LSH-CXO-044', 'moves_program_success', 'Audit Committee', 'How should model-driven treasury anomaly detection be governed after Kyriba goes live?'],
  ['LSH-CXO-045', 'moves_program_success', 'CIO', 'How should the Shared Data Platform Move support the Kyriba value story without claiming more than it has?'],

  ['LSH-CXO-046', 'federated_holdco', 'L0 Sponsor', 'What does Lakeshore L0 see that Morgan Street L1 should not automatically see at transaction grain?'],
  ['LSH-CXO-047', 'federated_holdco', 'CFO', 'How does the holding_group_id shortcut help the demo, and what hierarchy work remains post-demo?'],
  ['LSH-CXO-048', 'federated_holdco', 'L0 CIO', 'How should cross-HoldCo vendor overlap detection work without violating tenant isolation?'],
  ['LSH-CXO-049', 'federated_holdco', 'L1 CFO', 'What should a Morgan Street CFO be able to see versus a sibling HoldCo CFO?'],
  ['LSH-CXO-050', 'federated_holdco', 'L0 Sponsor', 'How should federated Tower show aggregate savings while preserving contract confidentiality?'],
  ['LSH-CXO-051', 'federated_holdco', 'CFO', 'How should AbarVa explain parent aggregate reads to a skeptical GC?'],
  ['LSH-CXO-052', 'federated_holdco', 'CIO', 'What is the right sequence for L0/L1/L2 tenancy hardening after the demo shortcut?'],
  ['LSH-CXO-053', 'federated_holdco', 'CFO', 'How do cross-HoldCo Microsoft, audit, and cyber opportunities turn into Source events?'],
  ['LSH-CXO-054', 'federated_holdco', 'L0 Sponsor', 'What are the top risks in making a federated holdings company look too centralized?'],
  ['LSH-CXO-055', 'federated_holdco', 'CIO', 'What evidence would prove AbarVa is not leaking Apex or Meridian into Lakeshore?'],

  ['LSH-CXO-056', 'cxo_loader', 'CIO', 'What CIO files should be uploaded in Wave 1 of the CXO Intel Loader, and why?'],
  ['LSH-CXO-057', 'cxo_loader', 'CFO', 'What CFO files should be uploaded in Wave 1 of the CXO Intel Loader, and which questions do they unlock?'],
  ['LSH-CXO-058', 'cxo_loader', 'CFO', 'How should AbarVa label current loader truth: setup/admin approval-ledger proven or CSV/context-loader backed?'],
  ['LSH-CXO-059', 'cxo_loader', 'CIO', 'What should happen when a CXO upload validates structurally but has weak evidence depth?'],
  ['LSH-CXO-060', 'cxo_loader', 'Steward', 'What provenance should every CXO upload retain so future agent answers are auditable?'],
  ['LSH-CXO-061', 'cxo_loader', 'CFO', 'Which Lakeshore loaded context dimensions are deepest today, and which are thinner?'],
  ['LSH-CXO-062', 'cxo_loader', 'CIO', 'How should AbarVa avoid creating shallow corpus filler while expanding Lakeshore coverage?'],
  ['LSH-CXO-063', 'cxo_loader', 'CFO', 'What is the difference between loaded context records and Azure AI Search corpus patterns?'],
  ['LSH-CXO-064', 'cxo_loader', 'CIO', 'What should the loader UI refuse to claim until the commit path is wired?'],
  ['LSH-CXO-065', 'cxo_loader', 'CFO', 'How should CXO bundle approvals become evidence for Move funding?'],

  ['LSH-CXO-066', 'corpus_intelligence', 'CFO', 'How deep is the Lakeshore corpus today, and why is 8,987 patterns enough for demo but not final?'],
  ['LSH-CXO-067', 'corpus_intelligence', 'Treasurer', 'What makes D08 Treasury patterns the credibility core of the Lakeshore corpus?'],
  ['LSH-CXO-068', 'corpus_intelligence', 'Audit Committee', 'What would cause a finance or treasury answer to fail the senior-partner bar?'],
  ['LSH-CXO-069', 'corpus_intelligence', 'CIO', 'Why is native Azure AI Search the vector store, and why should the answer not mention Pinecone?'],
  ['LSH-CXO-070', 'corpus_intelligence', 'CFO', 'How should agent answers distinguish source artifacts, enterprise context chunks, and corpus doctrine?'],
  ['LSH-CXO-071', 'corpus_intelligence', 'CFO', 'What evidence should the agent cite when asked about Kyriba success patterns?'],
  ['LSH-CXO-072', 'corpus_intelligence', 'Treasurer', 'How should the agent answer a question whose exact numeric value is not loaded?'],
  ['LSH-CXO-073', 'corpus_intelligence', 'CIO', 'What coverage gaps remain in the 10,000-pattern target?'],
  ['LSH-CXO-074', 'corpus_intelligence', 'CFO', 'How should the agent avoid sounding like a generic consulting deck?'],
  ['LSH-CXO-075', 'corpus_intelligence', 'L0 Sponsor', 'How does the corpus make AbarVa an AI success platform rather than a chatbot?'],

  ['LSH-CXO-076', 'tower_governance', 'L0 Sponsor', 'What should the federated Tower command center show on the first viewport?'],
  ['LSH-CXO-077', 'tower_governance', 'CFO', 'How should Tower separate value-at-stake, committed value, and realized savings?'],
  ['LSH-CXO-078', 'tower_governance', 'CIO', 'How should Tower show cross-HoldCo modernization waves without drowning the sponsor in project details?'],
  ['LSH-CXO-079', 'tower_governance', 'Audit Committee', 'What risk concentrations should Tower surface across HoldCos?'],
  ['LSH-CXO-080', 'tower_governance', 'CFO', 'How should Tower use Source events as evidence rather than duplicate Source workflow?'],
  ['LSH-CXO-081', 'tower_governance', 'CIO', 'What should Atlas refuse to do when a decision belongs in Source or Moves?'],
  ['LSH-CXO-082', 'tower_governance', 'L0 Sponsor', 'How should the AI capability marketplace avoid hype and prove reuse?'],
  ['LSH-CXO-083', 'tower_governance', 'CFO', 'What board pack metrics should be included for a holdings-company treasury modernization?'],
  ['LSH-CXO-084', 'tower_governance', 'Audit Committee', 'How should AbarVa evidence every gate decision and exception?'],
  ['LSH-CXO-085', 'tower_governance', 'CFO', 'How does AbarVa prevent a sponsor from confusing motion with accepted work?'],

  ['LSH-CXO-086', 'adversarial', 'CFO', 'A board member says AbarVa already proved $48M of Kyriba value. How should the agent correct that?'],
  ['LSH-CXO-087', 'adversarial', 'Treasurer', 'A treasurer says bank portals are good enough. What is the strongest fair pushback?'],
  ['LSH-CXO-088', 'adversarial', 'CIO', 'A CIO wants to demo AMS at BAFO next week. What should the agent refuse or require first?'],
  ['LSH-CXO-089', 'adversarial', 'Counsel', 'A vendor says bank connectivity delays are outside its responsibility. What should Source demand?'],
  ['LSH-CXO-090', 'adversarial', 'CFO', 'A family principal wants transaction-level sibling HoldCo visibility. How should governance respond?'],
  ['LSH-CXO-091', 'adversarial', 'Audit Committee', 'The model finds a treasury anomaly. Who decides what action is taken?'],
  ['LSH-CXO-092', 'adversarial', 'CFO', 'A user asks for exact confidential contract terms not in evidence. What should the agent do?'],
  ['LSH-CXO-093', 'adversarial', 'CIO', 'A sponsor asks whether Lakeshore uses Pinecone. What should the answer say?'],
  ['LSH-CXO-094', 'adversarial', 'CFO', 'A consultant claims Kyriba itself solves intercompany reconciliation. How should the agent respond?'],
  ['LSH-CXO-095', 'adversarial', 'L0 Sponsor', 'What should AbarVa say if asked whether all modules are 100% production-ready today?'],

  ['LSH-CXO-096', 'ai_success_platform', 'CFO', 'Explain the full AbarVa success loop from CXO upload to Move gate to Source artifact to Tower value.'],
  ['LSH-CXO-097', 'ai_success_platform', 'CIO', 'What makes AbarVa useful during the Kyriba rollout itself, before AI forecasting is live?'],
  ['LSH-CXO-098', 'ai_success_platform', 'L0 Sponsor', 'How does cross-HoldCo intelligence compound after multiple CXO bundles are loaded?'],
  ['LSH-CXO-099', 'ai_success_platform', 'Audit Committee', 'What controls make the AI success platform safe enough for board-grade operating decisions?'],
  ['LSH-CXO-100', 'ai_success_platform', 'CFO', 'Give the strongest one-page answer for why AbarVa will make Lakeshore treasury modernization succeed.'],
].map(([id, domain, persona, question]) => ({ id, domain, persona, question }));

function parseArgs(argv) {
  const parsed = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed.set(key, next);
      index += 1;
    } else {
      parsed.set(key, 'true');
    }
  }
  return parsed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function readSourceCorpus() {
  const chunks = [];
  for (const rel of SOURCE_FILES) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const parts = rel.endsWith('.csv') || rel.endsWith('.json')
      ? splitFixed(text, 1800)
      : text.split(/\n(?=#{1,3}\s)|\n\n+/g);
    parts.forEach((part, index) => {
      const clean = part.replace(/\s+/g, ' ').trim();
      if (clean.length < 80) return;
      chunks.push({
        id: `${rel}#${index + 1}`,
        source: rel,
        text: clean.slice(0, 2600),
      });
    });
  }
  return chunks;
}

function splitFixed(text, maxLen) {
  const parts = [];
  for (let index = 0; index < text.length; index += maxLen) {
    parts.push(text.slice(index, index + maxLen));
  }
  return parts;
}

function tokens(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []);
}

function retrieveEvidence(question, corpus, limit = 10) {
  const qTokens = tokens(question.question);
  const domainTokens = tokens(`${question.domain} ${question.persona} kyriba treasury finance source move tower federated lakeshore`);
  const scored = corpus.map((chunk) => {
    const cTokens = tokens(`${chunk.source} ${chunk.text}`);
    let score = 0;
    for (const token of qTokens) if (cTokens.has(token)) score += 4;
    for (const token of domainTokens) if (cTokens.has(token)) score += 1;
    if (/Kyriba|treasury|cash|bank|covenant/i.test(question.question) && /Kyriba|treasury|cash|bank|covenant/i.test(chunk.text)) score += 10;
    if (/Source|BAFO|artifact|stage|Selection|Transition|Value/i.test(question.question) && /Source|BAFO|artifact|stage|Selection|Transition|Value/i.test(chunk.text)) score += 10;
    if (/federated|HoldCo|L0|L1|tenant|holding/i.test(question.question) && /federated|HoldCo|L0|L1|tenant|holding/i.test(chunk.text)) score += 10;
    return { ...chunk, score };
  });
  return scored
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((chunk) => ({ id: chunk.id, source: chunk.source, text: chunk.text }));
}

function buildAnswerPrompt(items) {
  const payload = items.map((item) => ({
    id: item.id,
    persona: item.persona,
    domain: item.domain,
    question: item.question,
    evidence: item.evidence,
  }));
  return `Answer each Lakeshore CXO hard question as the AbarVa Lakeshore agent.

Non-negotiable truth:
- Use only OpenAI in this harness.
- Vector store truth: Lakeshore corpus doctrine is in native Azure AI Search, not Pinecone.
- Lakeshore loaded context is CSV/context-loader backed; it is not fully setup/admin approval-ledger proven.
- Kyriba Source event is artifact-backed through all 11 stages, but Selection/Transition/Value remain in review/needs-review. Do not claim award, cutover, or realized savings are complete.
- AMS Source event is real only through Evaluation. Do not present AMS as BAFO/Decision/Value complete.
- Be specific: owner, trigger, evidence, failure mode, and next action.
- If an exact number or confidential term is not in evidence, say what is known and what evidence would be required.
- Every answer must follow this CXO digestibility shape exactly:
  My read:
  One direct judgment or recommendation.

  Why:
  - Two or three evidence-backed reasons.

  Decision owner:
  Name the accountable role. Use the question persona when that is the right owner.

  What I would do next:
  One concrete action, artifact, gate, or owner-led next step.

  Evidence gap:
  One line naming what still needs proof or, if fully evidenced, what evidence supports the answer.
- Keep each answer concise: 120-220 words, no markdown tables.

Return one JSON object:
{
  "answers": [
    {
      "id": "LSH-CXO-001",
      "answer": "CXO-shaped answer with My read, Why, Decision owner, What I would do next, Evidence gap",
      "evidence_refs": ["source ids used"],
      "agent_confidence": "high|medium|low"
    }
  ]
}

Questions and retrieved evidence:
${JSON.stringify(payload)}`;
}

function buildJudgePrompt(items) {
  return `You are Anand's cold QA critic for AbarVa Lakeshore. Score each answer ruthlessly.

Score each dimension 1-5:
- grounding: cites/uses provided evidence and does not invent facts
- finance_treasury_depth: credible to CFO/Treasurer/Audit Committee
- program_success: shows how AbarVa enables execution success, not just advice
- honesty: names limits, review states, missing evidence, and avoids overclaim
- actionability: has owners, next actions, gates, or artifacts

Flag issues from this controlled list when present:
fabricated_fact, overclaims_completion, weak_finance_depth, generic_consulting_voice, missing_answer_shape, missing_owner, missing_evidence_ref, missing_evidence_gap, tenant_bleed_risk, mentions_pinecone, wrong_source_stage, no_next_action

Structural labels may appear on separate lines or inline. Do not flag
missing_answer_shape when the answer contains all five labels: My read, Why,
Decision owner, What I would do next, Evidence gap.

Return one JSON object:
{
  "scores": [
    {
      "id": "LSH-CXO-001",
      "grounding": 1,
      "finance_treasury_depth": 1,
      "program_success": 1,
      "honesty": 1,
      "actionability": 1,
      "overall": 1,
      "verdict": "pass|watch|fail",
      "issues": ["..."],
      "critic_note": "one sentence"
    }
  ]
}

Answers to judge:
${JSON.stringify(items)}`;
}

async function callOpenAIJson({ apiKey, model, prompt, temperature = 0.2, maxTokens = 12000 }) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    try {
      const response = await fetch(OPENAI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Return valid JSON only. No markdown fences.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`OpenAI ${response.status}: ${text.slice(0, 1200)}`);
      const parsed = JSON.parse(text);
      const content = parsed.choices?.[0]?.message?.content;
      if (!content) throw new Error(`OpenAI response missing content: ${text.slice(0, 1200)}`);
      return JSON.parse(content);
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      process.stdout.write(`openai-retry(${error instanceof Error ? error.name : 'error'}) ... `);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function deterministicIssues(answer, question) {
  const issues = [];
  const text = `${answer.answer ?? ''}`;
  const prompt = `${question?.question ?? ''}`;
  const refs = Array.isArray(answer.evidence_refs) ? answer.evidence_refs : [];
  if (!text.trim() || text.includes('[missing answer]')) {
    issues.push('missing_answer_shape', 'missing_evidence_ref', 'missing_owner', 'missing_evidence_gap', 'no_next_action');
    return [...new Set(issues)];
  }
  const requiredSections = [
    /\bMy read\s*:/i,
    /\bWhy\s*:/i,
    /\bDecision owner\s*:/i,
    /\bWhat I would do next\s*:/i,
    /\bEvidence gap\s*:/i,
  ];
  if (!requiredSections.every((pattern) => pattern.test(text))) issues.push('missing_answer_shape');
  if (refs.length < 2) issues.push('missing_evidence_ref');
  const pineconeMentionIsNegated =
    /\b(?:not|no|without|instead of|rather than|does not|do not|isn't|is not)\b[^.]{0,90}\bpinecone\b/i.test(text) ||
    /\bpinecone\b[^.]{0,90}\b(?:not|no|without|is not|isn't|does not|not used|not utilized)\b/i.test(text);
  const pineconeUsageClaim = /\b(?:uses?|using|stored in|loaded to|upserted to|vector store is)\s+pinecone\b|\bpinecone\b[^.]{0,80}\b(?:is used|stores|indexes|retrieves|upserts)\b/i.test(text);
  const pineconeQuestion = /\bpinecone\b/i.test(prompt);
  if (/pinecone/i.test(text) && !pineconeMentionIsNegated && (!pineconeQuestion || pineconeUsageClaim)) {
    issues.push('mentions_pinecone');
  }
  if (/realized savings (?:are|have been)|award is complete|cutover is complete|transition is complete/i.test(text) && !/\b(?:not|without|avoid|does not|do not|isn't|is not|cannot|should not|don't)\b[^.]{0,120}\b(?:realized savings|award|cutover|transition|complete|finalized)\b/i.test(text)) {
    issues.push('overclaims_completion');
  }
  if (/AMS/i.test(text) && /BAFO complete|decision complete|value complete|selection complete/i.test(text)) issues.push('wrong_source_stage');
  if (!/\b(CFO|Treasurer|Controller|Counsel|Audit Committee|L0 Sponsor|CIO|owner|owns|owned|accountable|responsible|decision rights|decision owner|sponsor)\b/i.test(text)) issues.push('missing_owner');
  if (!/\b(next|gate|evidence|required|approve|pause|refuse|sequence|action|step|condition|before|until|must|should)\b/i.test(text)) issues.push('no_next_action');
  if (!/\b(evidence gap|still needs proof|needs proof|not yet|missing evidence|loaded evidence|source evidence|proof)\b/i.test(text)) issues.push('missing_evidence_gap');
  if (/\bApex\b|\bMeridian\b|\bNorthstar\b|\bSkyHarbor\b/i.test(text) && !/\bApex\b|\bMeridian\b|\bNorthstar\b|\bSkyHarbor\b/i.test(prompt)) {
    issues.push('tenant_bleed_risk');
  }
  return issues;
}

function normalizeVerdict(score, issues) {
  const severe = new Set([
    'fabricated_fact',
    'overclaims_completion',
    'tenant_bleed_risk',
    'mentions_pinecone',
    'wrong_source_stage',
  ]);
  if (score.verdict === 'fail' || issues.some((issue) => severe.has(issue))) return 'fail';
  if (issues.length > 0 || Number(score.overall ?? 0) < 3) return 'watch';
  return 'pass';
}

function aggregateResults(results) {
  const issueCounts = new Map();
  const verdictCounts = new Map();
  let scoreTotal = 0;
  for (const result of results) {
    scoreTotal += result.score.overall;
    verdictCounts.set(result.score.verdict, (verdictCounts.get(result.score.verdict) ?? 0) + 1);
    for (const issue of result.score.issues) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }
  return {
    total: results.length,
    pass: verdictCounts.get('pass') ?? 0,
    watch: verdictCounts.get('watch') ?? 0,
    fail: verdictCounts.get('fail') ?? 0,
    averageOverall: results.length ? scoreTotal / results.length : 0,
    issueCounts: [...issueCounts.entries()].sort((a, b) => b[1] - a[1]),
  };
}

function renderHtml({ runId, model, startedAt, completedAt, results, summary }) {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
  const rows = results.map((result) => `
    <section class="card ${esc(result.score.verdict)}">
      <div class="qid">${esc(result.question.id)} · ${esc(result.question.domain)} · ${esc(result.question.persona)}</div>
      <h3>${esc(result.question.question)}</h3>
      <div class="scores">
        <span>overall ${esc(result.score.overall)}/5</span>
        <span>grounding ${esc(result.score.grounding)}</span>
        <span>finance ${esc(result.score.finance_treasury_depth)}</span>
        <span>success ${esc(result.score.program_success)}</span>
        <span>honesty ${esc(result.score.honesty)}</span>
        <span>action ${esc(result.score.actionability)}</span>
      </div>
      <p><strong>Verdict:</strong> ${esc(result.score.verdict.toUpperCase())} · ${esc(result.score.critic_note)}</p>
      <p><strong>Issues:</strong> ${result.score.issues.length ? result.score.issues.map(esc).join(', ') : 'none'}</p>
      <details open><summary>Captured agent answer</summary><p>${esc(result.answer.answer).replace(/\n/g, '<br>')}</p></details>
      <details><summary>Evidence refs</summary><ul>${(result.answer.evidence_refs ?? []).map((ref) => `<li>${esc(ref)}</li>`).join('')}</ul></details>
    </section>`).join('\n');
  const issueRows = summary.issueCounts.map(([issue, count]) => `<tr><td>${esc(issue)}</td><td>${count}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lakeshore CXO Hard-Question QA</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f7f7f3; }
    body { margin: 0; padding: 32px; }
    header { max-width: 1120px; margin: 0 auto 24px; }
    h1 { margin: 0 0 8px; font-size: 34px; letter-spacing: 0; }
    .lede { font-size: 16px; line-height: 1.5; max-width: 980px; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; max-width: 1120px; margin: 24px auto; }
    .metric, .card { background: white; border: 1px solid #ddd8cc; border-radius: 8px; box-shadow: 0 1px 1px rgba(31,41,55,.04); }
    .metric { padding: 14px 16px; }
    .metric b { display: block; font-size: 24px; }
    table { border-collapse: collapse; width: 100%; background: white; border: 1px solid #ddd8cc; }
    th, td { border-bottom: 1px solid #ece7dc; padding: 8px 10px; text-align: left; }
    main { max-width: 1120px; margin: 0 auto; }
    .card { padding: 18px; margin: 14px 0; }
    .card.pass { border-left: 5px solid #168a4a; }
    .card.watch { border-left: 5px solid #b7791f; }
    .card.fail { border-left: 5px solid #b42318; }
    .qid { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #64748b; text-transform: uppercase; }
    .scores { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
    .scores span { background: #eef2f7; border: 1px solid #d8dee8; border-radius: 999px; padding: 4px 8px; font-size: 12px; }
    details { margin-top: 10px; }
    summary { cursor: pointer; font-weight: 700; }
    p, li { line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>Lakeshore CXO Hard-Question QA</h1>
    <p class="lede">Concrete QA deliverable for the Lakeshore AI success platform story: 100 CXO-grade finance, treasury, Kyriba, Source, Moves, Tower, corpus, and federated-tenancy questions with captured OpenAI-only agent answers, cold-critic scoring, issue taxonomy, and source references.</p>
    <p><strong>Run:</strong> ${esc(runId)} · <strong>Model:</strong> ${esc(model)} · <strong>Started:</strong> ${esc(startedAt)} · <strong>Completed:</strong> ${esc(completedAt)}</p>
  </header>
  <section class="summary">
    <div class="metric"><b>${summary.total}</b> Questions</div>
    <div class="metric"><b>${summary.pass}</b> Pass</div>
    <div class="metric"><b>${summary.watch}</b> Watch</div>
    <div class="metric"><b>${summary.fail}</b> Fail</div>
    <div class="metric"><b>${summary.averageOverall.toFixed(2)}</b> Avg / 5</div>
  </section>
  <main>
    <h2>Issue Counts</h2>
    <table><thead><tr><th>Issue</th><th>Count</th></tr></thead><tbody>${issueRows || '<tr><td>none</td><td>0</td></tr>'}</tbody></table>
    <h2>Question Evidence</h2>
    ${rows}
  </main>
</body>
</html>`;
}

function writeJsonl(filePath, rows) {
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join('\n') + '\n');
}

async function main() {
  loadEnvFile(path.join(REPO_ROOT, '.env.local'));
  loadEnvFile('/Users/anand/Projects/nexus/.env.local');

  const args = parseArgs(process.argv.slice(2));
  const model = args.get('model') || DEFAULT_MODEL;
  const limit = Number(args.get('limit') || CXO_QUESTIONS.length);
  const batchSize = Number(args.get('batch-size') || 5);
  const outRoot = path.resolve(REPO_ROOT, args.get('out-root') || DEFAULT_OUT_ROOT);
  const runId = args.get('run-id') || `lakeshore-cxo-hard-question-qa-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
  const runDir = path.join(outRoot, runId);
  const rawDir = path.join(runDir, 'raw');
  const startedAt = new Date().toISOString();
  fs.mkdirSync(rawDir, { recursive: true });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required.');

  const corpus = readSourceCorpus();
  if (corpus.length < 10) throw new Error('Lakeshore source corpus is missing or too small.');

  const questions = CXO_QUESTIONS.slice(0, limit).map((question) => ({
    ...question,
    evidence: retrieveEvidence(question, corpus, 10),
  }));
  fs.writeFileSync(path.join(runDir, 'questions.json'), JSON.stringify(questions, null, 2));

  const answers = [];
  for (let offset = 0; offset < questions.length; offset += batchSize) {
    const batch = questions.slice(offset, offset + batchSize);
    process.stdout.write(`answer ${offset + 1}-${offset + batch.length}/${questions.length} ... `);
    const response = await callOpenAIJson({
      apiKey,
      model,
      prompt: buildAnswerPrompt(batch),
      temperature: 0.18,
      maxTokens: 14000,
    });
    const batchAnswers = normalizeBatchIds(response.answers ?? [], batch);
    for (const question of batch) {
      let answer = batchAnswers.find((item) => item.id === question.id);
      if (!answer) {
        process.stdout.write(`retry ${question.id} ... `);
        const retry = await callOpenAIJson({
          apiKey,
          model,
          prompt: buildAnswerPrompt([question]),
          temperature: 0.16,
          maxTokens: 5000,
        });
        const retryAnswers = normalizeBatchIds(retry.answers ?? [], [question]);
        answer = retryAnswers.find((item) => item.id === question.id);
        fs.writeFileSync(path.join(rawDir, `answer-retry-${question.id}.json`), JSON.stringify(retry, null, 2));
      }
      answer ??= {
        id: question.id,
        answer: '[missing answer]',
        evidence_refs: [],
        agent_confidence: 'low',
      };
      answers.push({ question, answer });
    }
    fs.writeFileSync(path.join(rawDir, `answers-${offset + 1}.json`), JSON.stringify(response, null, 2));
    console.log('ok');
  }

  const scored = [];
  for (let offset = 0; offset < answers.length; offset += batchSize) {
    const batch = answers.slice(offset, offset + batchSize);
    process.stdout.write(`judge ${offset + 1}-${offset + batch.length}/${answers.length} ... `);
    const judgeInput = batch.map((item) => ({
      id: item.question.id,
      persona: item.question.persona,
      domain: item.question.domain,
      question: item.question.question,
      answer: item.answer.answer,
      evidence_refs: item.answer.evidence_refs ?? [],
    }));
    const response = await callOpenAIJson({
      apiKey,
      model,
      prompt: buildJudgePrompt(judgeInput),
      temperature: 0.05,
      maxTokens: 9000,
    });
    const scores = normalizeBatchIds(response.scores ?? [], batch.map((item) => item.question));
    for (const item of batch) {
      let score = scores.find((candidate) => candidate.id === item.question.id);
      if (!score) {
        process.stdout.write(`retry-score ${item.question.id} ... `);
        const retry = await callOpenAIJson({
          apiKey,
          model,
          prompt: buildJudgePrompt([{
            id: item.question.id,
            persona: item.question.persona,
            domain: item.question.domain,
            question: item.question.question,
            answer: item.answer.answer,
            evidence_refs: item.answer.evidence_refs ?? [],
          }]),
          temperature: 0.03,
          maxTokens: 3000,
        });
        const retryScores = normalizeBatchIds(retry.scores ?? [], [item.question]);
        score = retryScores.find((candidate) => candidate.id === item.question.id);
        fs.writeFileSync(path.join(rawDir, `score-retry-${item.question.id}.json`), JSON.stringify(retry, null, 2));
      }
      score ??= {
          id: item.question.id,
          grounding: 1,
          finance_treasury_depth: 1,
          program_success: 1,
          honesty: 1,
          actionability: 1,
          overall: 1,
          verdict: 'fail',
          issues: ['missing_judge_score'],
          critic_note: 'No judge score returned.',
        };
      const deterministic = deterministicIssues(item.answer, item.question);
      const structuralIssues = new Set([
        'missing_answer_shape',
        'missing_owner',
        'missing_evidence_ref',
        'missing_evidence_gap',
        'no_next_action',
        'mentions_pinecone',
        'overclaims_completion',
        'tenant_bleed_risk',
        'wrong_source_stage',
      ]);
      const judgeIssues = (score.issues ?? []).filter((issue) => !structuralIssues.has(issue));
      const mergedIssues = [...new Set([...judgeIssues, ...deterministic])];
      const normalizedScore = {
        ...score,
        issues: mergedIssues,
        verdict: normalizeVerdict(score, mergedIssues),
      };
      scored.push({ ...item, score: normalizedScore });
    }
    fs.writeFileSync(path.join(rawDir, `scores-${offset + 1}.json`), JSON.stringify(response, null, 2));
    console.log('ok');
  }

  const summary = aggregateResults(scored);
  const completedAt = new Date().toISOString();
  writeJsonl(path.join(runDir, 'answers.jsonl'), answers);
  writeJsonl(path.join(runDir, 'scores.jsonl'), scored);
  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify({ runId, model, startedAt, completedAt, ...summary }, null, 2));
  fs.writeFileSync(path.join(runDir, 'report.html'), renderHtml({ runId, model, startedAt, completedAt, results: scored, summary }));
  fs.writeFileSync(path.join(runDir, 'README.md'), [
    '# Lakeshore CXO Hard-Question QA',
    '',
    `Run: \`${runId}\``,
    `Model: \`${model}\``,
    `Questions: ${summary.total}`,
    `Pass / watch / fail: ${summary.pass} / ${summary.watch} / ${summary.fail}`,
    `Average overall score: ${summary.averageOverall.toFixed(2)} / 5`,
    '',
    'Artifacts:',
    '- `questions.json`',
    '- `answers.jsonl`',
    '- `scores.jsonl`',
    '- `summary.json`',
    '- `report.html`',
    '',
    'This harness is OpenAI-only. It uses the shipped Lakeshore source bundle as retrieval context and does not call Anthropic or Pinecone.',
    '',
  ].join('\n'));

  console.log(`\nWrote ${runDir}`);
  console.log(`Pass/watch/fail: ${summary.pass}/${summary.watch}/${summary.fail}; average=${summary.averageOverall.toFixed(2)}`);
}

function normalizeBatchIds(items, questions) {
  if (!Array.isArray(items)) return [];
  const expected = new Set(questions.map((question) => question.id));
  const hasAnyExpected = items.some((item) => expected.has(item?.id));
  if (hasAnyExpected) return items;
  if (items.length !== questions.length) return items;
  return items.map((item, index) => ({
    ...item,
    original_id: item?.id,
    id: questions[index].id,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
