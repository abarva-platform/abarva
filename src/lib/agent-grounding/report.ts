import type {
  AgentGroundingReport,
  AgentGroundingScore,
  AgentGroundingSeverity,
  AgentGroundingSummary,
} from './types';

const SEVERITIES: AgentGroundingSeverity[] = ['P0', 'P1', 'P2', 'P3'];

export function summarizeGroundingScores(scores: AgentGroundingScore[]): AgentGroundingSummary {
  const summary: AgentGroundingSummary = {
    total: scores.length,
    passed: scores.filter((score) => score.passed).length,
    failed: scores.filter((score) => !score.passed).length,
    passRate: scores.length === 0 ? 0 : Math.round((scores.filter((score) => score.passed).length / scores.length) * 1000) / 10,
    byAgent: {},
    byTenant: {},
    byCategory: {},
    bySeverity: { P0: 0, P1: 0, P2: 0, P3: 0 },
    blockers: 0,
  };

  for (const score of scores) {
    increment(summary.byAgent, score.agent, score.passed);
    increment(summary.byTenant, score.tenant, score.passed);
    increment(summary.byCategory, score.category, score.passed);
    for (const issue of score.issues) summary.bySeverity[issue.severity] += 1;
  }

  summary.blockers = summary.bySeverity.P0 + summary.bySeverity.P1;
  return summary;
}

export function buildGroundingReport(scores: AgentGroundingScore[]): AgentGroundingReport {
  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeGroundingScores(scores),
    scores,
  };
}

export function renderGroundingHtml(report: AgentGroundingReport): string {
  const rows = report.scores
    .map((score) => `
      <section class="case ${score.passed ? 'pass' : 'fail'}">
        <div class="case-head">
          <div>
            <h2>${escapeHtml(score.id)}</h2>
            <p>${escapeHtml(score.agent)} · ${escapeHtml(score.tenant)} · ${escapeHtml(score.category)} · ${escapeHtml(score.surface)}</p>
          </div>
          <strong>${score.passed ? 'PASS' : 'FAIL'} · ${score.score}/100</strong>
        </div>
        <dl>
          <dt>Prompt</dt><dd><pre>${escapeHtml(score.prompt)}</pre></dd>
          <dt>Answer</dt><dd><pre>${escapeHtml(score.answer || '(empty)')}</pre></dd>
          <dt>Issues</dt><dd>${renderIssues(score)}</dd>
        </dl>
      </section>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AbarVa Agent Grounding Report</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #111827; background: #f8fafc; }
    header { padding: 32px 40px; background: #0f172a; color: white; }
    header h1 { margin: 0 0 8px; font-size: 30px; }
    header p { margin: 0; color: #cbd5e1; }
    main { padding: 28px 40px 48px; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
    .metric, .case { background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
    .metric { padding: 16px; }
    .metric span { display: block; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .metric strong { font-size: 26px; }
    .case { margin: 16px 0; padding: 18px; border-left: 6px solid #16a34a; }
    .case.fail { border-left-color: #dc2626; }
    .case-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
    .case h2 { font-size: 18px; margin: 0 0 4px; }
    .case p { margin: 0; color: #64748b; }
    dl { margin: 16px 0 0; }
    dt { font-weight: 700; margin-top: 12px; }
    dd { margin: 6px 0 0; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f1f5f9; padding: 12px; border-radius: 6px; }
    .issue { display: inline-block; margin: 0 8px 8px 0; padding: 6px 8px; border-radius: 999px; background: #fee2e2; color: #7f1d1d; font-size: 13px; }
    .issue.P2, .issue.P3 { background: #fef3c7; color: #78350f; }
  </style>
</head>
<body>
  <header>
    <h1>AbarVa Agent Grounding Report</h1>
    <p>Generated ${escapeHtml(report.generatedAt)}. Non-mutating QA: evaluates captured or live answers without loading tenant data.</p>
  </header>
  <main>
    <section class="summary">
      <div class="metric"><span>Total</span><strong>${report.summary.total}</strong></div>
      <div class="metric"><span>Pass Rate</span><strong>${report.summary.passRate}%</strong></div>
      <div class="metric"><span>Failed</span><strong>${report.summary.failed}</strong></div>
      <div class="metric"><span>P0/P1 Blockers</span><strong>${report.summary.blockers}</strong></div>
      <div class="metric"><span>Severity</span><strong>${SEVERITIES.map((severity) => `${severity}:${report.summary.bySeverity[severity]}`).join(' ')}</strong></div>
    </section>
    ${rows}
  </main>
</body>
</html>`;
}

function increment(
  bucket: Record<string, { total: number; passed: number; failed: number }>,
  key: string,
  passed: boolean,
): void {
  bucket[key] ??= { total: 0, passed: 0, failed: 0 };
  bucket[key].total += 1;
  bucket[key][passed ? 'passed' : 'failed'] += 1;
}

function renderIssues(score: AgentGroundingScore): string {
  if (score.issues.length === 0) return '<span>None</span>';
  return score.issues
    .map((issue) => `<span class="issue ${issue.severity}">${escapeHtml(issue.severity)} · ${escapeHtml(issue.code)}${issue.evidence ? ` · ${escapeHtml(issue.evidence)}` : ''}</span>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
