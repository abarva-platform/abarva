import fs from 'node:fs/promises';
import path from 'node:path';

interface Args {
  inputDir: string;
  output: string;
  title: string;
}

interface CrawlLatest {
  run?: {
    runId?: string;
    baseUrl?: string;
    createdAt?: string;
    observations?: Array<{
      tenantKey?: string;
      expectedTenantName?: string;
      personaKey?: string;
      surfaceId?: string;
      path?: string;
      url?: string;
      hardQuestionExactFieldCitations?: number;
      hardQuestionGroundingEvidence?: number;
      consoleErrors?: string[];
      networkErrors?: Array<{ url: string; status: number }>;
    }>;
  };
  comparison?: {
    p0?: number;
    p1?: number;
    p2?: number;
    findings?: Array<{
      severity?: string;
      tenantKey?: string;
      personaKey?: string;
      surfaceId?: string;
      dimension?: string;
      message?: string;
    }>;
  };
}

interface TranscriptTurn {
  question?: string;
  answer?: string;
  status?: string;
  error?: string;
  eventCount?: number;
  sourceEventCitations?: number;
  exactFieldCitations?: number;
  concreteFactSignals?: number;
  groundingEvidence?: number;
}

interface TranscriptFile {
  file: string;
  personaKey: string;
  surfaceId: string;
  turns: TranscriptTurn[];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const latestPath = path.join(args.inputDir, 'latest.json');
  const latest: CrawlLatest = await readJson<CrawlLatest>(latestPath).catch(() => ({}));
  const runId = latest.run?.runId ?? await findNewestRunId(args.inputDir);
  const runDir = runId ? path.join(args.inputDir, runId) : args.inputDir;
  const transcripts = await readTranscripts(path.join(runDir, 'transcripts'));
  const rows = flattenTranscripts(transcripts);
  const summary = summarize(rows, latest);
  const html = renderHtml(args, latest, runDir, transcripts, rows, summary);
  await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await fs.writeFile(args.output, html);
  console.log(`Agent response report written: ${args.output}`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    inputDir: 'audit-artifacts/post-deploy-crawl',
    output: 'reports/2026-06-05-agent-response-capture/index.html',
    title: 'Agent Response Capture - 50 Hard Turns',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--input-dir' && next) args.inputDir = next;
    if (arg === '--output' && next) args.output = next;
    if (arg === '--title' && next) args.title = next;
  }
  return args;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

async function findNewestRunId(inputDir: string): Promise<string | null> {
  const entries = await fs.readdir(inputDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return dirs.at(-1) ?? null;
}

async function readTranscripts(transcriptDir: string): Promise<TranscriptFile[]> {
  const entries = await fs.readdir(transcriptDir, { withFileTypes: true }).catch(() => []);
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const out: TranscriptFile[] = [];
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(transcriptDir, file.name);
    const turns = await readJson<TranscriptTurn[]>(fullPath).catch(() => []);
    const [personaKey = 'unknown', surfaceIdWithExt = 'unknown'] = file.name.split('__');
    out.push({
      file: file.name,
      personaKey,
      surfaceId: surfaceIdWithExt.replace(/\.json$/, ''),
      turns,
    });
  }
  return out;
}

function flattenTranscripts(transcripts: TranscriptFile[]) {
  return transcripts.flatMap((transcript) =>
    transcript.turns.map((turn, index) => ({
      ...turn,
      index: index + 1,
      personaKey: transcript.personaKey,
      surfaceId: transcript.surfaceId,
      file: transcript.file,
    })),
  );
}

function summarize(rows: ReturnType<typeof flattenTranscripts>, latest: CrawlLatest) {
  const answered = rows.filter((row) => row.status !== 'error' && (row.answer ?? '').trim().length > 0 && !looksLikeSynthesisError(row.answer ?? ''));
  const errors = rows.filter((row) => row.status === 'error' || !(row.answer ?? '').trim() || looksLikeSynthesisError(row.answer ?? ''));
  const chromeOnly = rows.filter((row) => looksLikeChromeOnlyAnswer(row.answer ?? ''));
  const synthesisErrors = rows.filter((row) => looksLikeSynthesisError(row.answer ?? ''));
  const groundingEvidence = rows.reduce(
    (sum, row) => sum + (row.groundingEvidence ?? row.exactFieldCitations ?? 0),
    0,
  );
  const observations = latest.run?.observations?.length ?? 0;
  return {
    totalTurns: rows.length,
    answeredTurns: answered.length,
    errorTurns: errors.length,
    synthesisErrorTurns: synthesisErrors.length,
    chromeOnlyTurns: chromeOnly.length,
    groundingEvidence,
    observations,
    p0: latest.comparison?.p0 ?? 0,
    p1: latest.comparison?.p1 ?? 0,
    p2: latest.comparison?.p2 ?? 0,
  };
}

function renderHtml(
  args: Args,
  latest: CrawlLatest,
  runDir: string,
  transcripts: TranscriptFile[],
  rows: ReturnType<typeof flattenTranscripts>,
  summary: ReturnType<typeof summarize>,
): string {
  const findings = latest.comparison?.findings ?? [];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(args.title)}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:36px auto;max-width:1180px;padding:0 24px;color:#111827;line-height:1.5;background:#fafafa}
    h1{font-size:30px;margin:0 0 8px} h2{font-size:22px;margin:32px 0 12px;border-top:1px solid #d1d5db;padding-top:18px}
    .meta{color:#4b5563}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.card{background:#fff;border:1px solid #d1d5db;border-radius:8px;padding:14px}
    .num{font-size:28px;font-weight:750}.label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em}
    table{border-collapse:collapse;width:100%;background:#fff;margin:12px 0 20px;font-size:14px}th,td{border:1px solid #d1d5db;padding:9px 10px;text-align:left;vertical-align:top}th{background:#f3f4f6}
    details{background:#fff;border:1px solid #d1d5db;border-radius:8px;margin:12px 0;padding:12px}summary{cursor:pointer;font-weight:700}
    pre{white-space:pre-wrap;word-wrap:break-word;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;font-size:13px}
    .pass{color:#047857;font-weight:700}.warn{color:#92400e;font-weight:700}.fail{color:#b91c1c;font-weight:700}
    .callout{border-left:4px solid #2563eb;background:#eff6ff;padding:12px 16px;border-radius:6px}.bad{border-left-color:#dc2626;background:#fef2f2}
    code{background:#f3f4f6;border-radius:4px;padding:2px 5px}
  </style>
</head>
<body>
  <h1>${escapeHtml(args.title)}</h1>
  <p class="meta">Generated ${escapeHtml(new Date().toISOString())} from <code>${escapeHtml(runDir)}</code>. Base URL: ${escapeHtml(latest.run?.baseUrl ?? 'unknown')}. Run ID: <code>${escapeHtml(latest.run?.runId ?? 'unknown')}</code>.</p>
  <div class="callout ${summary.errorTurns || summary.chromeOnlyTurns ? 'bad' : ''}">
    <strong>Honesty note:</strong> this report renders exactly what the crawl captured. Empty answers and page-chrome-only captures are treated as capture failures, not as good agent answers.
  </div>
  <div class="grid">
    ${metric('Turns Captured', String(summary.totalTurns))}
    ${metric('Answered Turns', String(summary.answeredTurns))}
    ${metric('Error / Empty Turns', String(summary.errorTurns))}
    ${metric('Synthesis Error Turns', String(summary.synthesisErrorTurns))}
    ${metric('Chrome-only Turns', String(summary.chromeOnlyTurns))}
    ${metric('Grounding Evidence Signals', String(summary.groundingEvidence))}
    ${metric('P0 / P1 / P2', `${summary.p0} / ${summary.p1} / ${summary.p2}`)}
    ${metric('Page Observations', String(summary.observations))}
    ${metric('Transcript Files', String(transcripts.length))}
    ${metric('Target', '50 turns')}
  </div>
  <h2>Coverage</h2>
  <table>
    <thead><tr><th>Transcript</th><th>Persona</th><th>Surface</th><th>Turns</th><th>Answered</th><th>Errors</th><th>Chrome-only</th></tr></thead>
    <tbody>${transcripts.map((item) => {
      const answered = item.turns.filter((turn) => turn.status !== 'error' && (turn.answer ?? '').trim() && !looksLikeSynthesisError(turn.answer ?? '')).length;
      const errors = item.turns.length - answered;
      const chromeOnly = item.turns.filter((turn) => looksLikeChromeOnlyAnswer(turn.answer ?? '')).length;
      return `<tr><td><code>${escapeHtml(item.file)}</code></td><td>${escapeHtml(item.personaKey)}</td><td>${escapeHtml(item.surfaceId)}</td><td>${item.turns.length}</td><td>${answered}</td><td>${errors}</td><td>${chromeOnly}</td></tr>`;
    }).join('')}</tbody>
  </table>
  <h2>Issues</h2>
  ${findings.length ? `<table><thead><tr><th>Severity</th><th>Tenant</th><th>Persona</th><th>Surface</th><th>Dimension</th><th>Message</th></tr></thead><tbody>${findings.map((finding) => `<tr><td>${escapeHtml(finding.severity ?? '')}</td><td>${escapeHtml(finding.tenantKey ?? '')}</td><td>${escapeHtml(finding.personaKey ?? '')}</td><td>${escapeHtml(finding.surfaceId ?? '')}</td><td>${escapeHtml(finding.dimension ?? '')}</td><td>${escapeHtml(finding.message ?? '')}</td></tr>`).join('')}</tbody></table>` : '<p class="pass">No comparison findings recorded.</p>'}
  <h2>Question And Answer Transcript</h2>
  ${rows.map((row, i) => `<details ${i < 3 ? 'open' : ''}>
    <summary>${i + 1}. ${escapeHtml(row.personaKey)} / ${escapeHtml(row.surfaceId)} / Q${row.index}: ${escapeHtml(row.question ?? '')}</summary>
    <p>Status: <span class="${row.status === 'error' || !(row.answer ?? '').trim() || looksLikeChromeOnlyAnswer(row.answer ?? '') || looksLikeSynthesisError(row.answer ?? '') ? 'fail' : 'pass'}">${escapeHtml(row.status ?? 'unknown')}</span>${row.error ? ` - ${escapeHtml(row.error)}` : ''} · Events: ${row.eventCount ?? 0}${looksLikeChromeOnlyAnswer(row.answer ?? '') ? ' · page-chrome-only capture' : ''}${looksLikeSynthesisError(row.answer ?? '') ? ' · synthesis/API error' : ''}</p>
    <h3>Answer</h3>
    <pre>${escapeHtml(row.answer ?? '')}</pre>
  </details>`).join('')}
</body>
</html>`;
}

function metric(label: string, value: string): string {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="num">${escapeHtml(value)}</div></div>`;
}

function looksLikeChromeOnlyAnswer(answer: string): boolean {
  const normalized = answer.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  return normalized.includes('SENTINEL INTEL')
    && normalized.includes('ASK SENTINEL')
    && normalized.includes('Ask an IT-productivity question to stream');
}

function looksLikeSynthesisError(answer: string): boolean {
  return /\[(?:synthesis|agent|model) error:/i.test(answer)
    || /specified API usage limits/i.test(answer)
    || /invalid_request_error/i.test(answer)
    || /\bquota\b/i.test(answer)
    || /\brate limit/i.test(answer);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
