// EXPORT-4-EXTEND · HTML renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. The API route
// (export/route.ts) wraps this with the audit log.
//
// Supports every kind whose `format-router.ts` allowed set includes
// `html`:
//   • program-charter        — faithful structured renderer
//   • outcome-report         — faithful structured renderer
//   • stakeholder-map        — generic structured-payload renderer
//   • synthesis-options-table — generic structured-payload renderer
//   • architecture-sketch    — generic structured-payload renderer
//   • roadmap                — generic structured-payload renderer
//
// `archetype-primer` keeps its own dedicated route
// (/api/programs/[id]/primer-html) and is intentionally NOT routed
// here; the format router does not advertise it through the generic
// export route.
//
// No fabrication: renderers only emit data present on the spec. Where a
// section's data is absent the renderer emits an explicit
// "not recorded" empty state rather than inventing content.

import 'server-only';

import { buildExportFilename } from '../filename';
import type { DeliverableRenderResult, DeliverableSpec } from '../types';

import type { OutcomeReportPayload } from './outcome-report';
import type { ProgramCharterPayload } from './program-charter';

/** HTML MIME with explicit UTF-8 charset. */
const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';

// ── Escaping ────────────────────────────────────────────────────────────
//
// Every value that originates from the payload is escaped before it
// reaches the document. The renderer never emits raw payload text into
// markup — `<script>` and friends render as literal characters.

/** Escape a string for safe interpolation into HTML text/attribute context. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** True for a non-empty trimmed string. */
function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// ── Shared chrome ───────────────────────────────────────────────────────

/** Brand palette — mirrors the DOCX renderers + AbarVa design system. */
const STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: 'DM Sans', 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1A1A18;
    background: #F8F7F4;
    margin: 0;
    padding: 48px 24px 96px;
  }
  .doc { max-width: 820px; margin: 0 auto; }
  .doc-header {
    border-bottom: 2px solid #0A0A0A;
    padding-bottom: 18px;
    margin-bottom: 28px;
  }
  .doc-eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #706D66;
    margin-bottom: 8px;
  }
  h1 {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: normal;
    font-size: 30px;
    line-height: 1.2;
    margin: 0 0 6px;
    color: #0A0A0A;
  }
  .doc-subtitle {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 16px;
    color: #525866;
    margin: 0 0 10px;
  }
  .doc-meta {
    font-size: 12px;
    color: #9AA3B2;
  }
  .doc-meta code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
  }
  .banner {
    display: inline-block;
    border-top: 2px solid #0A0A0A;
    border-bottom: 2px solid #0A0A0A;
    padding: 8px 0;
    margin: 18px 0 4px;
    font-family: Georgia, serif;
    font-weight: bold;
    letter-spacing: 0.04em;
    font-size: 13px;
  }
  h2 {
    font-family: Georgia, serif;
    font-weight: normal;
    font-size: 21px;
    margin: 36px 0 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #E2DFD8;
    color: #0A0A0A;
  }
  h3 {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #525866;
    margin: 22px 0 6px;
  }
  p { margin: 0 0 12px; }
  ul { padding-left: 22px; margin: 0 0 14px; }
  li { margin-bottom: 5px; }
  .label { font-weight: 600; }
  .empty {
    color: #9AA3B2;
    font-style: italic;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 18px;
    font-size: 13px;
  }
  th {
    background: #0A0A0A;
    color: #F5F5F0;
    text-align: left;
    padding: 7px 10px;
    font-weight: 600;
  }
  td {
    border: 1px solid #E2DFD8;
    padding: 7px 10px;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #FCFBF9; }
  blockquote {
    border-left: 3px solid #0A0A0A;
    margin: 14px 0;
    padding: 4px 16px;
    background: rgba(10,10,10,0.03);
    color: #525866;
  }
  .doc-footer {
    margin-top: 48px;
    padding-top: 14px;
    border-top: 1px solid #E2DFD8;
    font-size: 11px;
    color: #9AA3B2;
  }
`;

/** Wrap document body sections in the full standalone HTML shell. */
function pageShell(args: {
  title: string;
  subtitle?: string;
  tenantKey: string;
  brandSubtitle: string;
  generatedAt: Date;
  authors?: ReadonlyArray<string>;
  banner?: string;
  body: string;
}): string {
  const headerBits: string[] = [
    `<div class="doc-meta">Tenant: <code>${esc(args.tenantKey)}</code></div>`,
    `<div class="doc-meta">Generated by ${esc(args.brandSubtitle)} at ${esc(
      args.generatedAt.toISOString(),
    )}</div>`,
  ];
  if (args.authors !== undefined && args.authors.length > 0) {
    headerBits.push(
      `<div class="doc-meta">Authors: ${esc(args.authors.join(', '))}</div>`,
    );
  }
  const bannerHtml =
    args.banner !== undefined
      ? `<div class="banner">${esc(args.banner)}</div>`
      : '';
  const subtitleHtml =
    args.subtitle !== undefined
      ? `<p class="doc-subtitle">${esc(args.subtitle)}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(args.title)}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="doc">
<div class="doc-header">
<div class="doc-eyebrow">${esc(args.brandSubtitle)}</div>
<h1>${esc(args.title)}</h1>
${subtitleHtml}
${headerBits.join('\n')}
${bannerHtml}
</div>
${args.body}
<div class="doc-footer">${esc(args.brandSubtitle)} · This document renders only data recorded on the deliverable; sections shown as &ldquo;not recorded&rdquo; were empty at export time.</div>
</div>
</body>
</html>`;
}

/** Render a list of strings as a `<ul>`, or an empty-state line. */
function listOrEmpty(
  items: ReadonlyArray<unknown> | undefined,
  emptyLabel: string,
): string {
  const clean = (items ?? [])
    .map((i) => String(i ?? '').trim())
    .filter((s) => s.length > 0);
  if (clean.length === 0) {
    return `<p class="empty">${esc(emptyLabel)}</p>`;
  }
  return `<ul>${clean.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

/** Render a labeled inline value line. */
function labeled(label: string, value: unknown): string {
  const text = String(value ?? '').trim();
  if (text.length === 0) {
    return `<p><span class="label">${esc(label)}:</span> <span class="empty">not recorded</span></p>`;
  }
  return `<p><span class="label">${esc(label)}:</span> ${esc(text)}</p>`;
}

/** Render an array-of-objects as a table; emits an empty state if no rows. */
function objectTable(
  rows: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<{ key: string; label: string }>,
  emptyLabel: string,
): string {
  if (rows.length === 0) {
    return `<p class="empty">${esc(emptyLabel)}</p>`;
  }
  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${esc(row[c.key])}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// ── program-charter renderer ────────────────────────────────────────────

function renderProgramCharterBody(payload: ProgramCharterPayload): string {
  const out: string[] = [];

  // Value hypothesis.
  const vh = payload.valueHypothesis;
  out.push('<h2>Value hypothesis</h2>');
  if (
    hasText(vh?.cohort) ||
    hasText(vh?.currentPain) ||
    hasText(vh?.behaviorChange)
  ) {
    out.push(
      `<p>For ${esc(vh.cohort)} experiencing ${esc(vh.currentPain)}, this ` +
        `program will change ${esc(vh.behaviorChange)}, expecting to ` +
        `${esc(vh.valueDirection)} value through ${esc(
          vh.causalMechanism,
        )}.</p>`,
    );
  } else {
    out.push('<p class="empty">Value hypothesis not recorded.</p>');
  }
  out.push('<h3>In scope</h3>');
  out.push(listOrEmpty(vh?.inScope, 'No in-scope items recorded.'));
  out.push('<h3>Out of scope</h3>');
  out.push(listOrEmpty(vh?.outOfScope, 'No out-of-scope items recorded.'));

  // Sponsor.
  const s = payload.sponsor;
  out.push('<h2>Sponsor commitment</h2>');
  out.push(
    labeled(
      'Sponsor',
      hasText(s?.name) ? `${s.name} (${s.role ?? ''})`.trim() : '',
    ),
  );
  out.push('<h3>Decision rights</h3>');
  out.push(listOrEmpty(s?.decisionRights, 'No decision rights recorded.'));
  if (hasText(s?.successionOwner)) {
    out.push(labeled('Succession owner', s.successionOwner));
  }
  if (hasText(s?.cadence)) {
    out.push(labeled('Sponsor cadence', s.cadence));
  }

  // Recommended path.
  const rp = payload.recommendedPath;
  out.push('<h2>Recommended path</h2>');
  out.push(labeled('Path', rp?.name));
  if (hasText(rp?.rationale)) {
    out.push(`<p>${esc(rp.rationale)}</p>`);
  }
  out.push('<h3>Trade-offs accepted</h3>');
  out.push(listOrEmpty(rp?.tradeoffsAccepted, 'No trade-offs recorded.'));
  out.push('<h3>Options considered and not chosen</h3>');
  const options = Array.isArray(rp?.optionsConsidered)
    ? rp.optionsConsidered
    : [];
  if (options.length === 0) {
    out.push('<p class="empty">No alternative options recorded.</p>');
  } else {
    out.push(
      options
        .map(
          (o) =>
            `<p><span class="label">${esc(o.name)}:</span> ${esc(
              o.whyNotChosen,
            )}</p>`,
        )
        .join(''),
    );
  }

  // Architecture review attestation.
  const a = payload.architectureReviewAttestation;
  out.push('<h2>Architecture review attestation</h2>');
  out.push(labeled('Attested at', a?.attestedAt));
  out.push(
    labeled(
      'Attested by',
      Array.isArray(a?.attestedBy) ? a.attestedBy.join(', ') : '',
    ),
  );
  out.push('<h3>Findings</h3>');
  out.push(listOrEmpty(a?.findings, 'No findings recorded.'));
  out.push('<h3>Open items</h3>');
  out.push(listOrEmpty(a?.openItems, 'No open items at attestation time.'));

  // Kill criterion.
  const k = payload.killCriterion;
  out.push('<h2>Kill criterion</h2>');
  out.push(labeled('Measurable event', k?.measurableEvent));
  out.push(labeled('Observable by', k?.observableBy));
  out.push(labeled('Triggers when', k?.triggersWhen));
  out.push(labeled('Consequence', k?.consequence));

  // Named dissenter (only when present).
  const d = payload.namedDissenter;
  if (d !== undefined && hasText(d.name)) {
    out.push('<h2>Named dissenter</h2>');
    out.push(labeled('Name', `${d.name} (${d.role ?? ''})`.trim()));
    out.push('<h3>Verbatim objection</h3>');
    out.push(
      hasText(d.objection)
        ? `<blockquote>${esc(d.objection)}</blockquote>`
        : '<p class="empty">No objection text recorded.</p>',
    );
    out.push('<h3>Mitigation or acceptance</h3>');
    out.push(
      hasText(d.mitigationOrAcceptance)
        ? `<p>${esc(d.mitigationOrAcceptance)}</p>`
        : '<p class="empty">Not recorded.</p>',
    );
  }

  // Baseline KPIs.
  out.push('<h2>Baseline KPIs</h2>');
  const kpis = Array.isArray(payload.baselineKpis) ? payload.baselineKpis : [];
  out.push(
    objectTable(
      kpis as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'metric', label: 'Metric' },
        { key: 'currentValue', label: 'Current value' },
        { key: 'targetValue', label: 'Target value' },
        { key: 'sourceSystem', label: 'Source system' },
        { key: 'measurementMethod', label: 'Measurement method' },
      ],
      'No baseline KPIs recorded.',
    ),
  );

  // Sign-off.
  const so = payload.signoff;
  out.push('<h2>Sponsor sign-off</h2>');
  out.push(labeled('Sponsor', so?.sponsorName));
  if (hasText(so?.sponsorSignatureLine)) {
    out.push(`<p>${esc(so.sponsorSignatureLine)}</p>`);
  }
  if (hasText(so?.signedAt)) {
    out.push(labeled('Signed at', so.signedAt));
  }
  if (hasText(so?.notes)) {
    out.push('<h3>Notes</h3>');
    out.push(`<p>${esc(so.notes)}</p>`);
  }

  return out.join('\n');
}

// ── outcome-report renderer ─────────────────────────────────────────────

function renderOutcomeReportBody(payload: OutcomeReportPayload): string {
  const out: string[] = [];

  // Program summary.
  const ps = payload.programSummary;
  out.push('<h2>Program summary</h2>');
  out.push(labeled('Program', ps?.name));
  out.push(labeled('Sponsor', ps?.sponsor));
  out.push(labeled('Program lead', ps?.programLead));
  out.push(labeled('Charter date', ps?.charterDate));
  out.push(labeled('Outcome attestation date', ps?.outcomeDate));

  // Outcomes vs baseline.
  out.push('<h2>Outcomes vs. baseline</h2>');
  const outcomes = Array.isArray(payload.outcomesVsBaseline)
    ? payload.outcomesVsBaseline
    : [];
  out.push(
    objectTable(
      outcomes.map((row) => ({
        ...row,
        confidence:
          typeof row.confidence === 'number'
            ? `${Math.round(row.confidence * 100)}%`
            : '',
      })) as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'metric', label: 'Metric' },
        { key: 'baselineValue', label: 'Baseline' },
        { key: 'targetValue', label: 'Target' },
        { key: 'actualValue', label: 'Actual' },
        { key: 'deltaVsTarget', label: 'Δ vs target' },
        { key: 'confidence', label: 'Confidence' },
        { key: 'measurementMethod', label: 'Measurement method' },
      ],
      'No outcome rows recorded.',
    ),
  );

  // Adoption evidence.
  out.push('<h2>Adoption evidence</h2>');
  const adoption = Array.isArray(payload.adoptionEvidence)
    ? payload.adoptionEvidence
    : [];
  out.push(
    objectTable(
      adoption as ReadonlyArray<Record<string, unknown>>,
      [
        { key: 'cohort', label: 'Cohort' },
        { key: 'metric', label: 'Adoption metric' },
        { key: 'result', label: 'Result' },
      ],
      'No adoption evidence recorded.',
    ),
  );

  // Benefits attestation.
  const ba = payload.benefitsAttestation;
  out.push('<h2>Benefits attestation</h2>');
  out.push(labeled('Attested by', ba?.attestedBy));
  out.push(labeled('Attested at', ba?.attestedAt));
  if (hasText(ba?.attestationStatement)) {
    out.push(`<blockquote>${esc(ba.attestationStatement)}</blockquote>`);
  } else {
    out.push('<p class="empty">No attestation statement recorded.</p>');
  }

  // Challenges and mitigations.
  out.push('<h2>Challenges and mitigations</h2>');
  const challenges = Array.isArray(payload.challengesAndMitigations)
    ? payload.challengesAndMitigations
    : [];
  if (challenges.length === 0) {
    out.push('<p class="empty">No challenges recorded.</p>');
  } else {
    out.push(
      challenges
        .map(
          (cm) =>
            `<p><span class="label">Challenge:</span> ${esc(
              cm.challenge,
            )}</p><ul><li>Mitigation: ${esc(cm.mitigation)}</li></ul>`,
        )
        .join(''),
    );
  }

  // Learnings for catalog.
  out.push('<h2>Learnings for pattern catalog</h2>');
  const learnings = Array.isArray(payload.learningsForCatalog)
    ? payload.learningsForCatalog
    : [];
  if (learnings.length === 0) {
    out.push('<p class="empty">No learnings recorded.</p>');
  } else {
    const sorted = [
      ...learnings.filter((l) => l.applicability === 'cross-archetype'),
      ...learnings.filter((l) => l.applicability !== 'cross-archetype'),
    ];
    out.push(
      `<ul>${sorted
        .map(
          (l) =>
            `<li>[${esc(l.applicability)}] ${esc(l.learning)}</li>`,
        )
        .join('')}</ul>`,
    );
  }

  // P6 handoff plan.
  const hp = payload.p6HandoffPlan;
  out.push('<h2>P6 handoff plan</h2>');
  out.push(labeled('Standing owner', hp?.standingOwner));
  out.push(labeled('Review cadence', hp?.quarterlyReviewCadence));
  out.push('<h3>Kill / expand thresholds</h3>');
  out.push(
    listOrEmpty(hp?.killOrExpandThresholds, 'No thresholds recorded.'),
  );

  return out.join('\n');
}

// ── generic structured-payload renderer ─────────────────────────────────
//
// For kinds without a typed payload contract (stakeholder-map,
// synthesis-options-table, architecture-sketch, roadmap) we faithfully
// walk whatever structured data the spec carries. No invention: the
// renderer mirrors the payload's own shape — objects become labeled
// sections, arrays-of-objects become tables, arrays-of-scalars become
// lists, scalars become labeled lines.

/** Convert a camelCase / snake_case key into a human-readable label. */
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return spaced.length === 0
    ? key
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/** True when an array is a uniform array of plain objects (renders as table). */
function isObjectArray(
  value: ReadonlyArray<unknown>,
): value is ReadonlyArray<Record<string, unknown>> {
  return value.length > 0 && value.every((v) => isPlainObject(v));
}

/** Render any scalar payload value. */
function renderScalar(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '<span class="empty">not recorded</span>';
  }
  return esc(value);
}

/** Render a uniform array of objects as a table with a derived column set. */
function renderGenericObjectArray(
  rows: ReadonlyArray<Record<string, unknown>>,
): string {
  // Column set = union of keys across all rows, in first-seen order.
  const keys: string[] = [];
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!keys.includes(k)) keys.push(k);
    }
  }
  const head = keys.map((k) => `<th>${esc(humanizeKey(k))}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = keys
        .map((k) => {
          const cell = row[k];
          if (isPlainObject(cell)) {
            return `<td>${esc(JSON.stringify(cell))}</td>`;
          }
          if (Array.isArray(cell)) {
            return `<td>${cell.map((c) => esc(c)).join('; ')}</td>`;
          }
          return `<td>${renderScalar(cell)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * Recursively render a payload value at a given heading depth.
 * `depth` 0 → `<h2>`, 1 → `<h3>`, deeper collapses to `<h3>`.
 */
function renderGenericValue(
  label: string,
  value: unknown,
  depth: number,
): string {
  const headingTag = depth <= 0 ? 'h2' : 'h3';
  const heading = `<${headingTag}>${esc(label)}</${headingTag}>`;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${heading}<p class="empty">No ${esc(
        label.toLowerCase(),
      )} recorded.</p>`;
    }
    if (isObjectArray(value)) {
      return `${heading}${renderGenericObjectArray(value)}`;
    }
    // Array of scalars.
    return `${heading}${listOrEmpty(
      value,
      `No ${label.toLowerCase()} recorded.`,
    )}`;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${heading}<p class="empty">Not recorded.</p>`;
    }
    const inner = entries
      .map(([k, v]) => {
        if (Array.isArray(v) || isPlainObject(v)) {
          return renderGenericValue(humanizeKey(k), v, depth + 1);
        }
        return labeled(humanizeKey(k), v);
      })
      .join('\n');
    return `${heading}${inner}`;
  }

  // Scalar at section level.
  return `${heading}<p>${renderScalar(value)}</p>`;
}

/** Render an arbitrary structured payload faithfully (no invention). */
function renderGenericBody(
  payload: Record<string, unknown>,
  kind: string,
): string {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return `<p class="empty">No ${esc(
      kind.replace(/-/g, ' '),
    )} content was recorded on this deliverable.</p>`;
  }
  return entries
    .map(([k, v]) => {
      if (Array.isArray(v) || isPlainObject(v)) {
        return renderGenericValue(humanizeKey(k), v, 0);
      }
      return `<h2>${esc(humanizeKey(k))}</h2><p>${renderScalar(v)}</p>`;
    })
    .join('\n');
}

// ── Dispatcher ──────────────────────────────────────────────────────────

/** Per-kind banner label shown under the document title. */
const BANNER: Record<string, string | undefined> = {
  'program-charter': 'SIGNED PROGRAM CHARTER · P2 GATE PACKAGE',
  'outcome-report': 'OUTCOME REPORT · P5 GATE PACKAGE',
  'stakeholder-map': 'STAKEHOLDER MAP',
  'synthesis-options-table': 'SYNTHESIS OPTIONS · P2 SYNTHESIS',
  'architecture-sketch': 'ARCHITECTURE SKETCH',
  roadmap: 'PROGRAM ROADMAP',
};

/** Kinds the HTML dispatcher knows how to render. */
const HTML_KINDS: ReadonlySet<string> = new Set([
  'program-charter',
  'outcome-report',
  'stakeholder-map',
  'synthesis-options-table',
  'architecture-sketch',
  'roadmap',
]);

/**
 * Render a `DeliverableSpec` as a standalone HTML `DeliverableRenderResult`.
 *
 * `program-charter` and `outcome-report` use faithful structured
 * renderers; the remaining HTML kinds use the generic structured-payload
 * walker. All payload-derived text is HTML-escaped end-to-end.
 */
export async function renderDeliverableAsHtml(
  spec: DeliverableSpec,
): Promise<DeliverableRenderResult> {
  if (!HTML_KINDS.has(spec.kind)) {
    throw new Error(
      `Kind "${spec.kind}" does not have an HTML renderer. Use the format ` +
        `router to pick the canonical format.`,
    );
  }
  if (!spec.payload || typeof spec.payload !== 'object') {
    throw new Error(
      `${spec.kind} payload is malformed: expected a structured object.`,
    );
  }

  const generatedAt =
    spec.generatedAt !== undefined ? new Date(spec.generatedAt) : new Date();
  const brandSubtitle = spec.brandSubtitle ?? 'AbarVa · Programs';

  let body: string;
  switch (spec.kind) {
    case 'program-charter':
      body = renderProgramCharterBody(
        spec.payload as unknown as ProgramCharterPayload,
      );
      break;
    case 'outcome-report':
      body = renderOutcomeReportBody(
        spec.payload as unknown as OutcomeReportPayload,
      );
      break;
    default:
      body = renderGenericBody(spec.payload, spec.kind);
      break;
  }

  const html = pageShell({
    title: spec.title,
    subtitle: spec.subtitle,
    tenantKey: spec.tenantKey,
    brandSubtitle,
    generatedAt,
    authors: spec.authors,
    banner: BANNER[spec.kind],
    body,
  });

  const buffer = Buffer.from(html, 'utf-8');
  const filename = buildExportFilename({
    title: spec.title,
    kind: spec.kind,
    format: 'html',
    generatedAt:
      spec.generatedAt !== undefined ? new Date(spec.generatedAt) : undefined,
  });

  return {
    format: 'html',
    buffer,
    filename,
    contentType: HTML_CONTENT_TYPE,
    sizeBytes: buffer.byteLength,
  };
}

export { HTML_CONTENT_TYPE };
