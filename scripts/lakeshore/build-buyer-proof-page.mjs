#!/usr/bin/env node
/**
 * Builds a buyer-facing Lakeshore proof page from captured QA responses and
 * live production screenshots. This script does not call a model.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

const DEFAULT_QA_RUN = 'reports/2026-06-05-lakeshore-cxo-hard-question-qa-final4/lakeshore-cxo-hard-question-qa-2026-06-05T20-16-23-176Z-d0215cec';
const DEFAULT_SCREENSHOT_RUN = '/private/tmp/nexus-lakeshore-atlas-boundary/reports/2026-06-05-final-lakeshore-app-demo-readiness-screens-post3128/lakeshore-app-demo-readiness-2026-06-05T19-32-58-793Z-277cb8eb3';
const DEFAULT_OUT = 'reports/2026-06-05-lakeshore-buyer-proof/abarva-vs-raw-llm-proof';

const examples = [
  {
    id: 'kyriba-claim-boundary',
    title: 'Kyriba value claim without overstatement',
    questionId: 'LSH-CXO-001',
    screenshotId: 'source-kyriba-executive-decision',
    liveTruth: 'Demo event artifacts backed by live production route QA; context is CSV/context-loader backed, not fully setup/admin approval-ledger proven.',
    directClaudeGap: 'A generic LLM can explain Kyriba rollout risk, but it will not know the current Lakeshore stage boundary, review state, or what value cannot be claimed.',
    actionLabel: 'Decision artifact / action',
    action: 'CFO finalizes or holds the Executive Decision gate before any board claim of award, cutover, or realized savings.',
  },
  {
    id: 'source-to-tower-chain',
    title: 'Source artifact chain to Tower value story',
    questionId: 'LSH-CXO-030',
    screenshotId: 'tower-source-value',
    liveTruth: 'Live route screenshot plus captured agent response; Source/Tower value story is demo-seeded and explicitly still in review where evidence is incomplete.',
    directClaudeGap: 'A raw chat answer can sound confident about value realization. AbarVa keeps projected, tracked, reviewed, and verified states separate.',
    actionLabel: 'Workflow artifact / action',
    action: 'Audit Committee reviews the Executive Decision and downstream artifacts before Tower can present the value story as closed.',
  },
  {
    id: 'success-loop',
    title: 'AI success loop, not chatbot advice',
    questionId: 'LSH-CXO-096',
    screenshotId: 'moves-kyriba-documents',
    liveTruth: 'Move/Source/Tower proof is live-production crawled; generated artifacts and loaded context are labeled as demo/synthetic where applicable.',
    directClaudeGap: 'Direct Claude can recommend a transformation plan. AbarVa binds the recommendation to client context, persona, gates, evidence gaps, and persisted artifacts.',
    actionLabel: 'Program action / artifact',
    action: 'CFO approves or holds the Kyriba executive-decision artifacts and closes evidence gaps before moving value into Tower as decision-grade.',
  },
];

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function answerSections(answerText) {
  const labels = ['My read', 'Why', 'Decision owner', 'What I would do next', 'Evidence gap'];
  const sections = {};
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const next = labels[index + 1];
    const pattern = next
      ? new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${next}:)`, 'i')
      : new RegExp(`${label}:\\s*([\\s\\S]*)`, 'i');
    const match = answerText.match(pattern);
    sections[label] = match?.[1]?.trim() ?? '';
  }
  return sections;
}

function renderEvidence(refs) {
  return refs.map((ref) => {
    const [source, chunk] = String(ref).split('#');
    const classification = source.includes('LAKESHORE_LIVE_DATA_AUDIT')
      ? 'live-loader-backed audit'
      : source.includes('/loaded/')
        ? 'loaded context'
        : source.includes('/moves-design/')
          ? 'design package'
          : 'source context';
    return `<li><span>${esc(classification)}</span><code>${esc(source)}${chunk ? `#${esc(chunk)}` : ''}</code></li>`;
  }).join('');
}

function copyScreenshot({ screenshotRun, screenshot, assetsDir, index }) {
  const sourcePath = path.join(screenshotRun, 'screenshots', screenshot.screenshot.file);
  const ext = path.extname(screenshot.screenshot.file);
  const destName = `${String(index + 1).padStart(2, '0')}-${screenshot.id}${ext}`;
  const destPath = path.join(assetsDir, destName);
  fs.copyFileSync(sourcePath, destPath);
  return `assets/${destName}`;
}

function renderHtml({ qaSummary, qaRun, screenshotRun, selected, generatedAt }) {
  const cards = selected.map((item, index) => {
    const sections = answerSections(item.answer.answer);
    return `
      <section class="example" id="${esc(item.config.id)}">
        <div class="example-head">
          <div>
            <p class="eyebrow">Example ${index + 1}</p>
            <h2>${esc(item.config.title)}</h2>
          </div>
          <div class="score ${esc(item.score.verdict)}">${esc(item.score.verdict.toUpperCase())} · ${esc(item.score.overall)}/5</div>
        </div>
        <div class="screen-wrap">
          <img src="${esc(item.assetPath)}" alt="${esc(item.screenshot.route)} screenshot" />
          <div>
            <p class="label">Live screenshot</p>
            <p><strong>${esc(item.screenshot.area)}</strong> · ${esc(item.screenshot.route)}</p>
            <p class="truth">${esc(item.config.liveTruth)}</p>
          </div>
        </div>
        <div class="proof-grid">
          <article>
            <p class="label">AbarVa answer</p>
            <h3>${esc(item.question.question)}</h3>
            <p><strong>My read:</strong> ${esc(sections['My read'])}</p>
            <p><strong>Why:</strong> ${esc(sections.Why)}</p>
            <p><strong>Decision owner:</strong> ${esc(sections['Decision owner'])}</p>
            <p><strong>What I would do next:</strong> ${esc(sections['What I would do next'])}</p>
            <p><strong>Evidence gap:</strong> ${esc(sections['Evidence gap'])}</p>
          </article>
          <article>
            <p class="label">Evidence cited</p>
            <ul class="evidence">${renderEvidence(item.answer.evidence_refs ?? [])}</ul>
            <p class="note">${esc(item.config.directClaudeGap)}</p>
          </article>
          <article>
            <p class="label">${esc(item.config.actionLabel)}</p>
            <p>${esc(item.config.action)}</p>
            <p class="note">AbarVa turns the answer into an owner-bound workflow step, with tenant boundary and evidence status preserved.</p>
          </article>
        </div>
      </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AbarVa Lakeshore Buyer Proof</title>
  <style>
    :root { color-scheme: light; --ink:#151923; --muted:#5b6472; --line:#ddd8cc; --paper:#f8f7f2; --card:#fff; --accent:#0f766e; --warn:#9a6a12; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header { padding: 40px 48px 28px; border-bottom: 1px solid var(--line); background: #fffdf8; }
    .eyebrow, .label { margin: 0 0 8px; font: 700 11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
    h1 { margin: 0; font-size: 38px; line-height: 1.05; letter-spacing: 0; max-width: 1020px; }
    .lede { max-width: 980px; color: var(--muted); font-size: 16px; line-height: 1.55; }
    .truthbar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; max-width: 1180px; margin-top: 24px; }
    .metric, .example, article { background: var(--card); border: 1px solid var(--line); border-radius: 8px; }
    .metric { padding: 14px; }
    .metric b { display:block; font-size:24px; }
    main { padding: 28px 48px 56px; max-width: 1320px; margin: 0 auto; }
    .example { padding: 22px; margin: 0 0 24px; }
    .example-head { display: flex; justify-content: space-between; gap: 18px; align-items: start; }
    h2 { margin: 0 0 14px; font-size: 25px; letter-spacing: 0; }
    h3 { margin: 0 0 12px; font-size: 17px; line-height: 1.3; }
    .score { border-radius: 999px; padding: 7px 10px; font: 700 12px ui-monospace, SFMono-Regular, Menlo, monospace; background: #eef8f6; color: var(--accent); white-space: nowrap; }
    .score.watch { background: #fff7dc; color: var(--warn); }
    .screen-wrap { display: grid; grid-template-columns: minmax(320px, 1.4fr) minmax(260px, .6fr); gap: 18px; align-items: center; border-top: 1px solid var(--line); padding-top: 18px; }
    img { width: 100%; border: 1px solid var(--line); border-radius: 8px; display: block; background: #fff; }
    .truth, .note { color: var(--muted); line-height: 1.5; }
    .proof-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 14px; margin-top: 18px; }
    article { padding: 16px; }
    p, li { line-height: 1.52; }
    code { display: block; margin-top: 4px; overflow-wrap: anywhere; font-size: 11px; color: #344054; }
    .evidence { padding-left: 18px; }
    .evidence span { font-weight: 700; color: var(--ink); }
    footer { color: var(--muted); font-size: 12px; padding-top: 18px; }
    @media (max-width: 900px) {
      header, main { padding-left: 20px; padding-right: 20px; }
      .truthbar, .screen-wrap, .proof-grid { grid-template-columns: 1fr; }
      h1 { font-size: 30px; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">Lakeshore buyer proof · generated ${esc(generatedAt)}</p>
    <h1>AbarVa is not “Claude with a nicer UI.” It is a governed AI success platform.</h1>
    <p class="lede">These examples use live production screenshots and captured QA responses. The difference is the operating system around the answer: client context, corpus patterns, role/persona framing, evidence gaps, next actions, tenant boundaries, and persisted workflow artifacts.</p>
    <div class="truthbar">
      <div class="metric"><b>${esc(qaSummary.total)}</b> hard questions</div>
      <div class="metric"><b>${esc(qaSummary.pass)}</b> pass</div>
      <div class="metric"><b>${esc(qaSummary.watch)}</b> watch</div>
      <div class="metric"><b>${esc(qaSummary.fail)}</b> fail</div>
    </div>
  </header>
  <main>
    ${cards}
    <footer>
      <p>QA source: ${esc(qaRun)} · Screenshot source: ${esc(screenshotRun)}</p>
      <p>Labels: “live production screenshot” means the route was crawled on app.abarva.ai. “live-loader-backed audit” means the answer cites the Lakeshore live data audit/context bundle. “demo-seeded” means synthetic Lakeshore data prepared for demo proof, not a production client operating record.</p>
    </footer>
  </main>
</body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const qaRun = path.resolve(REPO_ROOT, args.get('qa-run') ?? DEFAULT_QA_RUN);
  const screenshotRun = path.resolve(args.get('screenshot-run') ?? DEFAULT_SCREENSHOT_RUN);
  const outDir = path.resolve(REPO_ROOT, args.get('out') ?? DEFAULT_OUT);
  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const qaSummary = readJson(path.join(qaRun, 'summary.json'));
  const scores = readJsonl(path.join(qaRun, 'scores.jsonl'));
  const screenshotManifest = readJson(path.join(screenshotRun, 'screenshots.json'));

  const selected = examples.map((config, index) => {
    const row = scores.find((candidate) => candidate.question.id === config.questionId);
    if (!row) throw new Error(`Missing QA response ${config.questionId}`);
    const screenshot = screenshotManifest.find((candidate) => candidate.id === config.screenshotId);
    if (!screenshot) throw new Error(`Missing screenshot ${config.screenshotId}`);
    return {
      config,
      question: row.question,
      answer: row.answer,
      score: row.score,
      screenshot,
      assetPath: copyScreenshot({ screenshotRun, screenshot, assetsDir, index }),
    };
  });

  const generatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'proof.json'), JSON.stringify({ generatedAt, qaRun, screenshotRun, qaSummary, examples: selected }, null, 2));
  fs.writeFileSync(path.join(outDir, 'report.html'), renderHtml({ qaSummary, qaRun, screenshotRun, selected, generatedAt }));
  fs.writeFileSync(path.join(outDir, 'README.md'), [
    '# Lakeshore Buyer Proof',
    '',
    'Buyer-facing proof page showing why AbarVa is not just a raw LLM interface.',
    '',
    'Files:',
    '- `report.html`',
    '- `proof.json`',
    '- `assets/*.png`',
    '',
    `Generated: ${generatedAt}`,
    '',
  ].join('\n'));
  console.log(JSON.stringify({ outDir, report: path.join(outDir, 'report.html'), examples: selected.length }, null, 2));
}

main();
