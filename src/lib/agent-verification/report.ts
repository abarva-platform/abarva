// Renders a VerificationSummary as a human-readable markdown report (PR-5).

import type { VerificationSummary } from './types';

export function renderReportMarkdown(summary: VerificationSummary): string {
  const lines: string[] = [];
  lines.push(`> ${summary.generatedNote}`, '');
  lines.push('## Coverage', '');
  lines.push(`- Mode: \`${summary.mode}\``);
  lines.push(`- Tenants tested: ${summary.tenantsTested.join(', ') || '(none)'}`);
  lines.push(`- Total questions run: ${summary.totalQuestions}`);
  lines.push(`- Context-bundle trace coverage: ${summary.traceCoveragePct}%`);
  lines.push(`- Citation coverage: ${summary.citationCoveragePct}%`);
  lines.push(`- Unsupported claim count: ${summary.unsupportedClaimCount}`);
  lines.push(`- Tenant leakage findings: ${summary.tenantLeakageCount}`, '');

  lines.push('## Pass/fail by tenant', '', '| Tenant | Total | Passed | Failed |', '|---|---|---|---|');
  for (const t of summary.passFailByTenant) {
    lines.push(`| ${t.tenantKey} | ${t.total} | ${t.passed} | ${t.failed} |`);
  }
  lines.push('');

  lines.push('## Pass/fail by agent', '', '| Agent | Passed | Failed |', '|---|---|---|');
  for (const [agent, v] of Object.entries(summary.passFailByAgent)) {
    lines.push(`| ${agent} | ${v.passed} | ${v.failed} |`);
  }
  lines.push('');

  lines.push('## Pass/fail by surface', '', '| Surface | Passed | Failed |', '|---|---|---|');
  for (const [surface, v] of Object.entries(summary.passFailBySurface)) {
    lines.push(`| ${surface} | ${v.passed} | ${v.failed} |`);
  }
  lines.push('');

  lines.push('## Wisdom score distribution', '', '| Bucket | Count |', '|---|---|');
  for (const [bucket, count] of Object.entries(summary.wisdomScoreDistribution)) {
    lines.push(`| ${bucket} | ${count} |`);
  }
  lines.push('');

  lines.push('## Top failure modes', '', '| Reason | Count |', '|---|---|');
  for (const f of summary.topFailureModes) lines.push(`| ${f.reason} | ${f.count} |`);
  if (summary.topFailureModes.length === 0) lines.push('| (none) | 0 |');
  lines.push('');

  lines.push('## Remediation backlog (by lane)', '', '| Lane | Count |', '|---|---|');
  for (const b of summary.remediationBacklog) lines.push(`| ${b.lane} | ${b.count} |`);
  if (summary.remediationBacklog.length === 0) lines.push('| (none) | 0 |');
  lines.push('');

  return lines.join('\n');
}
