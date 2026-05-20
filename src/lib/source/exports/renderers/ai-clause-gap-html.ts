// Source · AI Clause Gap · html renderer
//
// Buyers want to share the clause checklist as a link — easier than
// circulating xlsx for executive review. Self-contained HTML; AbarVa
// typography inlined. Pure: payload → HTML string.

import 'server-only';

import type { AiClauseGapPayload } from './ai-clause-gap';

const STYLE_BLOCK = `
  :root {
    --bg: #F8F7F4;
    --fg: #0C1A3A;
    --muted: #706D66;
    --rule: #D8D5CC;
    --warning: #F4B400;
    --warn-fill: #FFF4D6;
    --error-fill: #FADBDB;
    --soft: #F4F2EC;
  }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500&family=Inter:wght@400;600&display=swap');
  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.55;
    padding: 48px 32px;
  }
  .doc { max-width: 1080px; margin: 0 auto; }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .title {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 32px;
    line-height: 1.15;
    font-weight: 500;
    margin: 0 0 16px;
  }
  .meta { color: var(--muted); font-size: 13px; margin: 4px 0; }
  .divider { border-top: 1px solid var(--rule); margin: 28px 0; }
  h2 { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 500; margin: 28px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid var(--rule); text-align: left; vertical-align: top; }
  th { background: var(--fg); color: #FAF7F1; font-weight: 600; }
  tr.warn td { background: var(--warn-fill); color: #5B3F00; }
  tr.crit td { background: var(--error-fill); color: #5A1B1B; }
  .summary-grid { display: grid; grid-template-columns: 1.4fr 0.6fr; gap: 0; }
  .summary-grid > div { padding: 8px 10px; border-bottom: 1px solid var(--rule); }
  .summary-grid > div:nth-child(odd) { background: var(--soft); font-weight: 600; }
  .footer { color: var(--muted); font-size: 12px; font-style: italic; margin-top: 32px; }
`;

function escape(value: string | number | undefined | null): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAiClauseGapHtml(payload: AiClauseGapPayload): string {
  let present = 0,
    partial = 0,
    missing = 0,
    na = 0;
  let criticalMissing = 0,
    criticalPartial = 0,
    highMissing = 0;
  for (const c of payload.clauses) {
    if (c.status === 'present') present += 1;
    else if (c.status === 'partial') partial += 1;
    else if (c.status === 'missing') missing += 1;
    else if (c.status === 'n/a') na += 1;
    if (c.riskIfMissing === 'critical' && c.status === 'missing') criticalMissing += 1;
    if (c.riskIfMissing === 'critical' && c.status === 'partial') criticalPartial += 1;
    if (c.riskIfMissing === 'high' && c.status === 'missing') highMissing += 1;
  }

  const rowsHtml = payload.clauses
    .map((c) => {
      const cls =
        c.riskIfMissing === 'critical' && (c.status === 'missing' || c.status === 'partial')
          ? 'crit'
          : c.riskIfMissing === 'high' && c.status === 'missing'
            ? 'warn'
            : '';
      return `<tr class="${cls}">
        <td>${escape(c.clause)}</td>
        <td>${escape(c.whyItMatters)}</td>
        <td>${escape(c.requiredLanguage)}</td>
        <td>${escape(c.riskIfMissing)}</td>
        <td>${escape(c.status)}</td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <title>AI Clause Gap · ${escape(payload.eventCode)}</title>
  <style>${STYLE_BLOCK}</style>
</head>
<body>
  <main class="doc">
    <div class="eyebrow">Stage 6 · AI Clause Gap · ${escape(payload.tenantName)}</div>
    <h1 class="title">${escape(payload.eventName)}</h1>
    <p class="meta">Event code: ${escape(payload.eventCode)}</p>
    <p class="meta">Vendor under review: ${escape(payload.vendorName || '(buyer fills before circulating)')}</p>
    ${payload.issuedBy ? `<p class="meta">Issued by: ${escape(payload.issuedBy)}</p>` : ''}
    <p class="meta">Generated: ${escape(payload.generatedAt)}</p>
    <div class="divider"></div>
    <p>Methodology §6: most procurement orgs do not yet know to ask for the clauses below. Critical-risk clauses left Missing or Partial must be redlined before signature.</p>

    <h2>Gap summary</h2>
    <div class="summary-grid">
      <div>Total clauses in library</div><div>${payload.clauses.length}</div>
      <div>Present</div><div>${present}</div>
      <div>Partial</div><div>${partial}</div>
      <div>Missing</div><div>${missing}</div>
      <div>N/A</div><div>${na}</div>
      <div>Critical-risk × Missing (must redline)</div><div>${criticalMissing}</div>
      <div>Critical-risk × Partial (must redline)</div><div>${criticalPartial}</div>
      <div>High-risk × Missing</div><div>${highMissing}</div>
    </div>

    <h2>Clause library</h2>
    <table>
      <thead>
        <tr>
          <th>Clause</th>
          <th>Why it matters</th>
          <th>Required language</th>
          <th>Risk</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml || `<tr><td colspan="5">— No clauses in library —</td></tr>`}</tbody>
    </table>

    <p class="footer">Review with procurement counsel before signature. The xlsx companion is the editable working surface.</p>
  </main>
</body></html>`;
}
