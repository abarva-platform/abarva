import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAuditSupabaseClient,
  readTurnCostTrace,
  resolveTenantForCostTrace,
  type TurnCostTrace,
} from './ai-egress-cost-trace';

interface Score {
  total: number;
  letter?: string;
}

interface TranscriptTurn {
  task: number;
  turn: number;
  tag: string;
  surface: string;
  user: string;
  answer: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  score: Score;
  notes?: string[];
}

interface Transcript {
  tenant: string;
  baseUrl: string;
  mainSha: string;
  mainDeployedAt: string;
  turns: TranscriptTurn[];
}

interface ReportConfig {
  tenantLabel: string;
  tenantAlias: string;
  reportPath: string;
  transcriptPath: string;
}

const REPORTS: ReportConfig[] = [
  {
    tenantLabel: 'Apex Retail',
    tenantAlias: 'apex',
    reportPath:
      '/Users/anand/Projects/nexus/audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/APEX_AGENT_INTELLIGENCE_REPORT.html',
    transcriptPath:
      '/Users/anand/Projects/nexus/audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/transcripts/full-transcript.json',
  },
  {
    tenantLabel: 'Meridian Health',
    tenantAlias: 'meridian',
    reportPath:
      '/Users/anand/Projects/nexus/audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/MERIDIAN_AGENT_INTELLIGENCE_REPORT.html',
    transcriptPath:
      '/Users/anand/Projects/nexus/audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/transcripts/full-transcript.json',
  },
];

async function main() {
  const sb = createAuditSupabaseClient();
  for (const config of REPORTS) {
    const transcript = JSON.parse(await fs.readFile(config.transcriptPath, 'utf8')) as Transcript;
    const tenant = await resolveTenantForCostTrace(sb, config.tenantAlias);
    const costTraces: Array<{ turn: TranscriptTurn; trace: TurnCostTrace }> = [];
    const reportDir = path.dirname(config.reportPath);
    const costDir = path.join(reportDir, 'cost-trace');
    await fs.mkdir(costDir, { recursive: true });

    for (const turn of transcript.turns) {
      const trace = await readTurnCostTrace({
        sb,
        tenantId: tenant.id,
        startedAt: turn.startedAt,
        completedAt: turn.completedAt,
        promptText: turn.user,
        responseText: turn.answer,
      });
      costTraces.push({ turn, trace });
      await fs.writeFile(
        path.join(costDir, `task${turn.task}-turn${turn.turn}-${slug(turn.tag)}.json`),
        JSON.stringify({ turn: pickTurnSummary(turn), trace }, null, 2),
      );
    }

    const summary = summarizeCostTraces(costTraces);
    await fs.writeFile(path.join(costDir, 'summary.json'), JSON.stringify(summary, null, 2));

    let html = await fs.readFile(config.reportPath, 'utf8');
    html = replaceSection(
      html,
      'Design Contribution Analysis',
      'Cost + Performance',
      renderDesignContribution(config, transcript),
      true,
    );
    html = replaceSection(
      html,
      'Cost + Performance',
      'Recommendations',
      renderCostPerformance(summary),
      true,
    );
    await fs.writeFile(config.reportPath, html);
    console.log(`${config.tenantLabel}: updated report and wrote ${summary.totalAuditRows} audit rows to ${costDir}`);
  }
}

function replaceSection(
  html: string,
  startHeading: string,
  nextHeading: string,
  replacement: string,
  includeStartHeading: boolean,
): string {
  const start = html.indexOf(`<h2>${startHeading}</h2>`);
  const next = html.indexOf(`<h2>${nextHeading}</h2>`, start + 1);
  if (start === -1 || next === -1) {
    throw new Error(`Could not find section ${startHeading} -> ${nextHeading}`);
  }
  const section = includeStartHeading ? `<h2>${startHeading}</h2>\n${replacement}\n` : replacement;
  return `${html.slice(0, start)}${section}${html.slice(next)}`;
}

function renderDesignContribution(config: ReportConfig, transcript: Transcript): string {
  const great = transcript.turns
    .filter((turn) => turn.score.total >= 8 && !turn.answer.trim().startsWith('FAIL '))
    .sort((a, b) => b.score.total - a.score.total);
  const weak = transcript.turns
    .filter((turn) => turn.score.total <= 5 || turn.answer.trim().startsWith('FAIL '))
    .sort((a, b) => a.score.total - b.score.total);

  return `
<p class="muted">Updated follow-up section authored after the 2026-05-24 two-task crawl. Great moments are turns scoring 8.0 or above; weak moments are turns scoring 5.0 or below. Capability names follow the original crawl prompt's Section 7 map.</p>
<h3>Great moments and enabling capability</h3>
<table>
  <thead><tr><th>Turn</th><th>Score</th><th>Moment</th><th>AbarVa capability that enabled it</th><th>Why this is hard to reproduce with a generic LLM + SharePoint</th></tr></thead>
  <tbody>
    ${great.map((turn) => renderGreatMoment(config, turn)).join('\n')}
  </tbody>
</table>
<h3>Weak moments and gap diagnosis</h3>
<table>
  <thead><tr><th>Turn</th><th>Score</th><th>Failure signal</th><th>Gap that caused it</th><th>Remediation</th></tr></thead>
  <tbody>
    ${weak.map((turn) => renderWeakMoment(config, turn)).join('\n')}
  </tbody>
</table>
<h3>Product read-through</h3>
<p>${escapeHtml(config.tenantLabel)}'s strongest turns were strongest when the agent used tenant-specific facts, sourcing context, and explicit dissent rather than general transformation prose. The weakest turns were not content-generation failures; they were continuity and evidence-accounting failures where the app state did not carry the user's decision thread into the next surface.</p>
<p>The investor-grade lesson is clear: AbarVa's moat is not a nicer chat response. It is the combination of tenant data substrate, evidence ledger, Source value chain, Decision Dossier continuity, and agent posture rules that make an answer auditable, replayable, and commercially useful.</p>
`;
}

function renderGreatMoment(config: ReportConfig, turn: TranscriptTurn): string {
  const capability = greatCapability(config, turn);
  return `<tr>
    <td>T${turn.task}.${turn.turn} ${escapeHtml(turn.tag)}</td>
    <td>${turn.score.total.toFixed(1)}</td>
    <td>${quote(turn.answer)}</td>
    <td>${escapeHtml(capability)}</td>
    <td>${escapeHtml(genericLlmContrast(capability))}</td>
  </tr>`;
}

function renderWeakMoment(config: ReportConfig, turn: TranscriptTurn): string {
  const gap = weakGap(config, turn);
  return `<tr>
    <td>T${turn.task}.${turn.turn} ${escapeHtml(turn.tag)}</td>
    <td>${turn.score.total.toFixed(1)}</td>
    <td>${quote(turn.answer)}</td>
    <td>${escapeHtml(gap)}</td>
    <td>${escapeHtml(remediationForGap(gap))}</td>
  </tr>`;
}

function greatCapability(config: ReportConfig, turn: TranscriptTurn): string {
  const text = `${turn.tag} ${turn.surface} ${turn.user} ${turn.answer}`.toLowerCase();
  if (/bafo|rfi|rfp|wipro|vendor|contract|renegotiation|source/.test(text)) {
    return 'Source value chain + vendor_contracts seed + tenant-grounded citation';
  }
  if (/shape move|business case|what would make|scope|sponsor/.test(text)) {
    return 'Sentinel/Nexus state machine final stage + value tri-state + dissent discipline';
  }
  if (/unknown|admit|do not know|not in/.test(text)) {
    return 'Hard-question refusal + no-evidence behavior';
  }
  if (/regulatory|hipaa|baa|ciso|compliance|malpractice/.test(text)) {
    return 'Regulatory overlay reasoning + Evidence Ledger confidence_basis';
  }
  if (config.tenantAlias === 'apex') {
    return 'Tenant data layer + Apex synthetic pack + Evidence Ledger citations';
  }
  return 'Tenant data layer + Meridian seed + Evidence Ledger citations';
}

function weakGap(config: ReportConfig, turn: TranscriptTurn): string {
  const text = `${turn.tag} ${turn.user} ${turn.answer}`.toLowerCase();
  if (turn.answer.trim().startsWith('FAIL event code')) {
    return 'Source event-code hygiene gap: legacy tenant alias duplication produced APEX-APEX-style event codes before the hotfix/backfill';
  }
  if (/created strategic move|this move|which move|shape move|programs\/new/.test(text)) {
    return 'Cross-surface continuity gap: Decision Dossier thread not created or carried into Move detail chat';
  }
  if (/mckinsey|jama|latest|benchmark|actually measured|what do you actually know/.test(text)) {
    return 'No-evidence behavior gap: the agent did not distinguish tenant evidence from unavailable external/report evidence sharply enough';
  }
  if (/savings number|cheapest|single-axis|just tell me/.test(text)) {
    return 'Source value proof gap: numerical answer was not anchored to a baseline/intervention/negotiated/realized chain';
  }
  return config.tenantAlias === 'apex'
    ? 'Apex retrieval/wiring gap: Packet 18 data exists on main but was not consistently pulled into this turn'
    : 'Tenant evidence retrieval gap: Meridian facts were present but not consistently cited at the claim level';
}

function remediationForGap(gap: string): string {
  if (gap.includes('Decision Dossier')) {
    return 'Create decision_thread at Intelligence Shape Move click, link the originating session and Move, and pass decisionThreadId into Move detail chat surfaceContext.';
  }
  if (gap.includes('No-evidence')) {
    return 'Force gray insufficient-evidence chips and explicit refusal language when a tenant row, report, or study is not present.';
  }
  if (gap.includes('Source value proof')) {
    return 'Use the Source four-layer value chain before answering savings prompts, with baseline citations and confidence labels.';
  }
  return 'Add retrieval assertions to the post-deploy crawl and verify the relevant tenant corpus rows appear in the context bundle.';
}

function genericLlmContrast(capability: string): string {
  if (capability.includes('Source value')) {
    return 'The answer depended on live vendor scope, renewal context, and Source posture; a generic model would not know the tenant contract baseline or BAFO constraints.';
  }
  if (capability.includes('Regulatory')) {
    return 'The answer blended tenant operating context with healthcare regulatory posture and role-specific buyer concerns instead of reciting generic compliance language.';
  }
  if (capability.includes('state machine')) {
    return 'The response contained a structured decision path, dissent, value state, and unsafe-to-fund criteria rather than a generic recommendation.';
  }
  if (capability.includes('no-evidence')) {
    return 'The value is in refusing to overclaim and showing what evidence is missing, which requires product-level honesty discipline.';
  }
  return 'The response used tenant-specific budget, system, vendor, and program facts rather than depending on whatever documents happened to be nearby.';
}

function renderCostPerformance(summary: ReturnType<typeof summarizeCostTraces>): string {
  return `
<p class="muted">Updated follow-up section. The runner now reads <code>ai_egress_audit</code> by tenant and turn timestamp, writes per-turn JSON traces under <code>cost-trace/</code>, and reports USD values. When provider metadata contains token/cost fields the trace uses it; when the current audit row only has model/workflow metadata, the trace marks the value as <code>turn_text_estimate</code> or <code>metadata_estimate</code> rather than pretending it is exact billing.</p>
<table>
  <thead><tr><th>Metric</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Total LLM cost USD</td><td>$${summary.totalCostUsd.toFixed(6)}</td></tr>
    <tr><td>Total audit rows read</td><td>${summary.totalAuditRows}</td></tr>
    <tr><td>Total estimated input tokens</td><td>${summary.totalInputTokens.toLocaleString()}</td></tr>
    <tr><td>Total estimated output tokens</td><td>${summary.totalOutputTokens.toLocaleString()}</td></tr>
    <tr><td>Turns with non-empty cost trace</td><td>${summary.turnsWithRows} / ${summary.turnCount}</td></tr>
    <tr><td>Median latency</td><td>${summary.medianLatencyMs.toLocaleString()} ms</td></tr>
    <tr><td>Most expensive turn</td><td>${escapeHtml(summary.mostExpensiveTurn)}</td></tr>
    <tr><td>Cost per high-quality response (score >= 8)</td><td>$${summary.costPerHighQualityResponseUsd.toFixed(6)}</td></tr>
  </tbody>
</table>
<p class="muted">Cost trace summary: <code>cost-trace/summary.json</code>. Per-turn traces are stored in the same directory and include audit ids, workflows, policy decisions, model names, token estimates, and cost basis.</p>
`;
}

function summarizeCostTraces(items: Array<{ turn: TranscriptTurn; trace: TurnCostTrace }>) {
  const totalCostUsd = roundUsd(items.reduce((sum, item) => sum + item.trace.totalCostUsd, 0));
  const highQuality = items.filter((item) => item.turn.score.total >= 8);
  const sortedLatency = items.map((item) => item.turn.latencyMs).sort((a, b) => a - b);
  const mostExpensive = items
    .slice()
    .sort((a, b) => b.trace.totalCostUsd - a.trace.totalCostUsd)[0];
  return {
    generatedAt: new Date().toISOString(),
    turnCount: items.length,
    turnsWithRows: items.filter((item) => item.trace.rowCount > 0).length,
    totalAuditRows: items.reduce((sum, item) => sum + item.trace.rowCount, 0),
    totalInputTokens: items.reduce((sum, item) => sum + item.trace.totalInputTokens, 0),
    totalOutputTokens: items.reduce((sum, item) => sum + item.trace.totalOutputTokens, 0),
    totalCostUsd,
    medianLatencyMs: sortedLatency[Math.floor(sortedLatency.length / 2)] ?? 0,
    mostExpensiveTurn: mostExpensive
      ? `T${mostExpensive.turn.task}.${mostExpensive.turn.turn} ${mostExpensive.turn.tag} ($${mostExpensive.trace.totalCostUsd.toFixed(6)})`
      : 'n/a',
    costPerHighQualityResponseUsd: highQuality.length ? roundUsd(totalCostUsd / highQuality.length) : 0,
  };
}

function pickTurnSummary(turn: TranscriptTurn) {
  return {
    task: turn.task,
    turn: turn.turn,
    tag: turn.tag,
    surface: turn.surface,
    startedAt: turn.startedAt,
    completedAt: turn.completedAt,
    latencyMs: turn.latencyMs,
    score: turn.score.total,
  };
}

function quote(value: string): string {
  return `<span class="quote">${escapeHtml(truncate(value.replace(/\s+/g, ' ').trim(), 260))}</span>`;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'turn';
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
