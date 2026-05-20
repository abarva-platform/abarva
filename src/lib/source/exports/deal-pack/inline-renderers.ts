// Source · Deal Pack · inline HTML renderers for structured payloads.
//
// Each function takes one of the canonical structured artifact payloads
// (the same shapes the xlsx renderers consume) and emits a self-
// contained HTML fragment using only the CSS classes defined in
// styles.ts.
//
// Hard rules:
//   - No external fetch — no <script>, no <img src=http>, no @import.
//   - No invented data — when a payload list is empty, surface a
//     "Not recorded — seed gap" row, never silently drop the section.
//   - These functions are pure: (payload) -> string.
//
// Why we don't reuse the existing per-artifact HTML / docx renderers
// for the Deal Pack body:
//   - narrative-html.ts inlines a Google-Fonts @import (external
//     fetch). The Deal Pack is offline-first, so we render the markdown
//     body via the shared mdast walker directly.
//   - The structured artifacts ship docx / xlsx / pdf surfaces today,
//     not HTML. The Deal Pack needs a compact in-page rendering of the
//     same content — these inline renderers are that rendering.
//
// The intent is intentionally faithful to the canonical payload: every
// field rendered, every seed-gap line preserved.

import {
  isHoldVerdict,
  sourceJudgmentVerdictLabel,
} from '../../expert-judgment/source-judgment-rules';
import type { SourceJudgment } from '../../expert-judgment/source-judgment-types';
import type { AppInventoryPayload } from '../renderers/app-inventory';
import type { ResponseChecklistPayload } from '../renderers/response-checklist';
import type { ScorecardPayload } from '../renderers/scorecard';
import type { PricingTemplatePayload } from '../renderers/pricing-template';
import type { PricingComparisonPayload } from '../renderers/pricing-comparison';
import type { TrapLogPayload } from '../renderers/trap-log';
import type { BafoQuestionPackPayload } from '../renderers/bafo-question-pack';
import type { MarketScanPayload } from '../renderers/market-scan';
import type { TcoIcebergPayload } from '../renderers/tco-iceberg';
import type { AiClauseGapPayload } from '../renderers/ai-clause-gap';
import type { RenewalDecisionPayload } from '../renderers/renewal-decision';

const SEED_GAP_LINE = '— Not recorded — seed gap';

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return SEED_GAP_LINE;
  if (n === 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function fmtMissing(s: string | null | undefined): string {
  return s && s.trim().length > 0 ? s : SEED_GAP_LINE;
}

function pillFor(kind: string, value: string): string {
  const cls = `dp-pill dp-pill--${escapeHtml(kind)}`;
  return `<span class="${cls}">${escapeHtml(value)}</span>`;
}

function emptyRow(cols: number, message: string = SEED_GAP_LINE): string {
  return `<tr><td colspan="${cols}" style="color: var(--muted); font-style: italic;">${escapeHtml(message)}</td></tr>`;
}

/**
 * Render the kernel verdict banner an artifact must carry. When the
 * kernel holds the award, this is shown so the artifact's own positive
 * numbers (top-scoring vendor, cheapest price) cannot read as "go".
 * `domains` scopes which blockers are surfaced on this artifact.
 */
function renderKernelVerdictBanner(
  judgment: SourceJudgment,
  domains: ReadonlyArray<SourceJudgment['blockers'][number]['domain']>,
): string {
  const hold = isHoldVerdict(judgment.verdict);
  const label = sourceJudgmentVerdictLabel(judgment.verdict);
  const relevantBlockers = judgment.blockers.filter((b) => domains.includes(b.domain));
  const blockerList = relevantBlockers.length
    ? `<ul class="dp-body">${relevantBlockers
        .map(
          (b) =>
            `<li><strong>[${escapeHtml(b.severity)} · ${escapeHtml(b.domain)}]</strong> ${escapeHtml(b.description)}</li>`,
        )
        .join('')}</ul>`
    : '';
  if (hold) {
    return `<div class="dp-stage__empty" style="margin-bottom:12px;"><strong>Kernel verdict: ${escapeHtml(label)}.</strong> The Source expert-judgment kernel holds the award — this artifact is not decision-ready and must not be read as a recommendation to award or proceed.${blockerList}</div>`;
  }
  return `<p class="dp-stage__intent" style="margin-bottom:8px;">Kernel verdict: ${escapeHtml(label)} — Source expert-judgment kernel.</p>`;
}

// ── d04 · App Inventory ────────────────────────────────────────────────────

export function renderAppInventoryHtml(p: AppInventoryPayload): string {
  const tierRows =
    p.tierDefinitions.length === 0
      ? emptyRow(5)
      : p.tierDefinitions
          .map(
            (t) =>
              `<tr class="is-locked"><td>Tier ${t.tier}</td><td>${escapeHtml(t.label)}</td><td>${escapeHtml(t.criterion)}</td><td>${escapeHtml(t.recoveryObjective)}</td><td>${escapeHtml(t.examples)}</td></tr>`,
          )
          .join('');
  const inv =
    p.rows.length === 0
      ? emptyRow(8)
      : p.rows
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.name)}</td><td>${r.tier === 0 ? '—' : `Tier ${r.tier}`}</td><td>${escapeHtml(r.owner)}</td><td>${escapeHtml(r.techStack)}</td><td>${escapeHtml(r.hostingToday)}</td><td class="is-num">${r.annualWorkloadCount.toLocaleString()}</td><td>${r.inScope ? 'Y' : 'N'}</td></tr>`,
          )
          .join('');
  return `
    <table class="dp-table"><caption>Tier definitions (locked rubric)</caption>
      <thead><tr><th>Tier</th><th>Label</th><th>Criterion</th><th>Recovery</th><th>Examples</th></tr></thead>
      <tbody>${tierRows}</tbody>
    </table>
    <table class="dp-table"><caption>Application inventory (${p.rows.length} rows)</caption>
      <thead><tr><th>ID</th><th>Name</th><th>Tier</th><th>Owner</th><th>Tech</th><th>Hosting today</th><th>Workload/yr</th><th>In&nbsp;scope</th></tr></thead>
      <tbody>${inv}</tbody>
    </table>
  `;
}

// ── d11 · Response Checklist ───────────────────────────────────────────────

export function renderResponseChecklistHtml(p: ResponseChecklistPayload): string {
  const mand =
    p.mandatoryItems.length === 0
      ? emptyRow(3)
      : p.mandatoryItems
          .map(
            (i) =>
              `<tr><td>${escapeHtml(i.id)}</td><td>${escapeHtml(i.section)}</td><td>${escapeHtml(i.requirement)}</td></tr>`,
          )
          .join('');
  const opt =
    p.optionalItems.length === 0
      ? emptyRow(3)
      : p.optionalItems
          .map(
            (i) =>
              `<tr><td>${escapeHtml(i.id)}</td><td>${escapeHtml(i.section)}</td><td>${escapeHtml(i.requirement)}</td></tr>`,
          )
          .join('');
  const fmt =
    p.formatExpectations.length === 0
      ? emptyRow(2)
      : p.formatExpectations
          .map(
            (f) =>
              `<tr class="is-locked"><td>${escapeHtml(f.topic)}</td><td>${escapeHtml(f.requirement)}</td></tr>`,
          )
          .join('');
  const deadline = p.submissionDeadline
    ? `<p class="dp-stage__intent">Submission deadline: ${escapeHtml(p.submissionDeadline)}</p>`
    : '';
  return `
    ${deadline}
    <table class="dp-table"><caption>Mandatory response items</caption>
      <thead><tr><th>ID</th><th>Section</th><th>Requirement</th></tr></thead>
      <tbody>${mand}</tbody>
    </table>
    <table class="dp-table"><caption>Optional / recommended items</caption>
      <thead><tr><th>ID</th><th>Section</th><th>Requirement</th></tr></thead>
      <tbody>${opt}</tbody>
    </table>
    <table class="dp-table"><caption>Format expectations (locked)</caption>
      <thead><tr><th>Topic</th><th>Requirement</th></tr></thead>
      <tbody>${fmt}</tbody>
    </table>
  `;
}

// ── d16 · Scorecard ────────────────────────────────────────────────────────

export function renderScorecardHtml(p: ScorecardPayload, judgment: SourceJudgment): string {
  // A high score is not an award. The kernel verdict is surfaced above
  // the criteria/weights so a top-scoring vendor cannot read as
  // award-ready while the kernel holds the award.
  const verdictBanner = renderKernelVerdictBanner(judgment, [
    'governance',
    'legal',
    'ai_data_rights',
    'security',
    'evidence',
  ]);
  const criteria =
    p.criteria.length === 0
      ? emptyRow(4)
      : p.criteria
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.id)}</td><td>${escapeHtml(c.label)}</td><td class="is-num">${c.weightPercent}%</td><td>${escapeHtml(c.description)}</td></tr>`,
          )
          .join('');
  const guidance =
    p.scoreGuidance.length === 0
      ? emptyRow(3)
      : p.scoreGuidance
          .map(
            (g) =>
              `<tr class="is-locked"><td>${g.score}</td><td>${escapeHtml(g.label)}</td><td>${escapeHtml(g.rubric)}</td></tr>`,
          )
          .join('');
  const vendors =
    p.vendors.length === 0
      ? `<p style="color: var(--muted); font-style: italic;">${SEED_GAP_LINE} — vendor shortlist not yet recorded.</p>`
      : `<p>Vendors in scope: <strong>${p.vendors.map(escapeHtml).join(', ')}</strong></p>`;
  const round = p.roundLabel
    ? `<p class="dp-stage__intent">Round: ${escapeHtml(p.roundLabel)}</p>`
    : '';
  return `
    ${verdictBanner}
    ${round}
    ${vendors}
    <table class="dp-table"><caption>Criteria + weights</caption>
      <thead><tr><th>ID</th><th>Criterion</th><th>Weight</th><th>Description</th></tr></thead>
      <tbody>${criteria}</tbody>
    </table>
    <table class="dp-table"><caption>Score guidance rubric (locked)</caption>
      <thead><tr><th>Score</th><th>Label</th><th>Rubric</th></tr></thead>
      <tbody>${guidance}</tbody>
    </table>
  `;
}

// ── d19 · Pricing Template ─────────────────────────────────────────────────

export function renderPricingTemplateHtml(p: PricingTemplatePayload): string {
  const assumptions =
    p.assumptions.length === 0
      ? emptyRow(3)
      : p.assumptions
          .map(
            (a) =>
              `<tr class="is-locked"><td>${escapeHtml(a.key)}</td><td>${escapeHtml(a.value)}</td><td>${escapeHtml(a.rationale ?? '')}</td></tr>`,
          )
          .join('');
  const items =
    p.lineItems.length === 0
      ? emptyRow(6)
      : p.lineItems
          .map(
            (l) =>
              `<tr><td>${escapeHtml(l.id)}</td><td>${escapeHtml(l.category)}</td><td>${escapeHtml(l.description)}</td><td>${escapeHtml(l.unit)}</td><td class="is-num">${l.annualQuantity.toLocaleString()}</td><td>${escapeHtml(l.note ?? '')}</td></tr>`,
          )
          .join('');
  return `
    <p class="dp-stage__intent">TCO horizon: ${p.tcoYears}&nbsp;years · Escalator: ${(p.escalator * 100).toFixed(1)}%</p>
    <table class="dp-table"><caption>Locked assumptions (d21)</caption>
      <thead><tr><th>Key</th><th>Value</th><th>Rationale</th></tr></thead>
      <tbody>${assumptions}</tbody>
    </table>
    <table class="dp-table"><caption>Pricing line items</caption>
      <thead><tr><th>ID</th><th>Category</th><th>Description</th><th>Unit</th><th>Annual&nbsp;qty</th><th>Note</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
  `;
}

// ── d19c · Pricing Comparison ──────────────────────────────────────────────

export function renderPricingComparisonHtml(
  p: PricingComparisonPayload,
  judgment: SourceJudgment,
): string {
  if (p.submissions.length === 0) {
    return `<p style="color: var(--muted); font-style: italic;">${SEED_GAP_LINE} — no vendor pricing submissions recorded yet.</p>`;
  }
  const demoBanner = p.demoMode
    ? '<div class="dp-stage__empty" style="margin-bottom: 12px;"><strong>Demo mode</strong> — synthetic vendor submissions. Replace with uploaded responses before sharing externally.</div>'
    : '';
  // Pricing that is incomplete or non-comparable must NEVER be silently
  // normalized as apples-to-apples. Detect missing line-item prices and
  // label them; if pricing incompleteness is a kernel blocker, the whole
  // comparison is explicitly flagged as not decision-ready.
  const lineCount = p.lineItems.length;
  const incompleteVendors = p.submissions.filter((s) => {
    if (lineCount === 0) return false;
    const filled = p.lineItems.filter((l) => {
      const v = s.unitPricesById[l.id];
      return typeof v === 'number' && v > 0;
    }).length;
    return filled < lineCount;
  });
  const pricingIsIncomplete = incompleteVendors.length > 0;
  const pricingBlocker = judgment.blockers.find((b) => b.domain === 'pricing');
  const verdictBanner = renderKernelVerdictBanner(judgment, ['pricing', 'commercial']);
  const incompleteBanner =
    pricingIsIncomplete || pricingBlocker
      ? `<div class="dp-stage__empty" style="margin-bottom:12px;"><strong>Pricing is incomplete / not comparable — this comparison is not decision-ready.</strong> ${
          pricingIsIncomplete
            ? `${escapeHtml(
                incompleteVendors.map((s) => s.vendorName).join(', '),
              )} did not price every locked line item. Missing prices are shown as an evidence gap, not normalized to zero or inferred.`
            : 'The Source expert-judgment kernel flags pricing as incomplete or non-comparable.'
        } Do not present these figures as an apples-to-apples commercial view until missing pricing is closed or the non-comparable scope is explicitly excluded.</div>`
      : '';
  const head = `<tr><th>Line</th><th>Description</th>${p.submissions.map((s) => `<th>${escapeHtml(s.vendorName)}</th>`).join('')}</tr>`;
  const rows =
    p.lineItems.length === 0
      ? emptyRow(2 + p.submissions.length)
      : p.lineItems
          .map((l) => {
            const cells = p.submissions
              .map((s) => {
                const unit = s.unitPricesById[l.id];
                return `<td class="is-num">${unit == null ? `${SEED_GAP_LINE} — pricing not recorded` : fmtUsd(unit * l.annualQuantity)}</td>`;
              })
              .join('');
            return `<tr><td>${escapeHtml(l.id)}</td><td>${escapeHtml(l.description)}</td>${cells}</tr>`;
          })
          .join('');
  const deviations = p.submissions
    .map((s) => {
      if (s.assumptionDeviations.length === 0) return '';
      const items = s.assumptionDeviations
        .map(
          (d) =>
            `<li><strong>${escapeHtml(s.vendorName)}</strong> · ${escapeHtml(d.assumptionKey)} → ${escapeHtml(d.proposedAlternative)} (<em>${escapeHtml(d.severity)}</em>)</li>`,
        )
        .join('');
      return items;
    })
    .filter(Boolean)
    .join('');
  const deviationsBlock = deviations
    ? `<p class="dp-stage__intent" style="margin-top:12px;">Vendor assumption deviations</p><ul class="dp-body">${deviations}</ul>`
    : '';
  return `
    ${verdictBanner}
    ${demoBanner}
    ${incompleteBanner}
    <table class="dp-table"><caption>Per-line annualized comparison (qty × unit price)</caption>
      <thead>${head}</thead>
      <tbody>${rows}</tbody>
    </table>
    ${deviationsBlock}
  `;
}

// ── d20 · Trap Log ─────────────────────────────────────────────────────────

export function renderTrapLogHtml(p: TrapLogPayload): string {
  const defs =
    p.severityDefinitions.length === 0
      ? emptyRow(3)
      : p.severityDefinitions
          .map(
            (d) =>
              `<tr class="is-locked"><td>${escapeHtml(d.severity)}</td><td>${escapeHtml(d.label)}</td><td>${escapeHtml(d.rubric)}</td></tr>`,
          )
          .join('');
  const rows =
    p.rows.length === 0
      ? emptyRow(6)
      : p.rows
          .map((r) => {
            const rowCls = r.severity === 'P0' ? 'is-critical' : r.severity === 'P1' ? 'is-warning' : '';
            return `<tr class="${rowCls}"><td>${escapeHtml(r.id)}</td><td>${pillFor(r.severity.toLowerCase(), r.severity)}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.description)}</td><td>${escapeHtml(r.surfacedFor)}</td><td>${escapeHtml(r.surfacedBy)}</td></tr>`;
          })
          .join('');
  return `
    <table class="dp-table"><caption>Severity rubric (locked)</caption>
      <thead><tr><th>Severity</th><th>Label</th><th>Rubric</th></tr></thead>
      <tbody>${defs}</tbody>
    </table>
    <table class="dp-table"><caption>Open traps (${p.rows.length})</caption>
      <thead><tr><th>ID</th><th>Severity</th><th>Category</th><th>Description</th><th>Surfaced for</th><th>By</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── d22 · BAFO Question Pack ───────────────────────────────────────────────

export function renderBafoQuestionPackHtml(p: BafoQuestionPackPayload): string {
  const trap =
    p.trapQuestions.length === 0
      ? emptyRow(4)
      : p.trapQuestions
          .map(
            (q) =>
              `<tr><td>${escapeHtml(q.id)}</td><td>${q.severity === 'n/a' ? '—' : pillFor(q.severity.toLowerCase(), q.severity)}</td><td>${escapeHtml(q.question)}</td><td>${escapeHtml(q.responseFormat)}</td></tr>`,
          )
          .join('');
  const value =
    p.valueQuestions.length === 0
      ? emptyRow(3)
      : p.valueQuestions
          .map(
            (q) =>
              `<tr><td>${escapeHtml(q.id)}</td><td>${escapeHtml(q.question)}</td><td>${escapeHtml(q.responseFormat)}</td></tr>`,
          )
          .join('');
  const round = p.roundLabel ? `<p class="dp-stage__intent">Round: ${escapeHtml(p.roundLabel)}</p>` : '';
  const vendors =
    p.vendors.length === 0
      ? `<p style="color: var(--muted); font-style: italic;">${SEED_GAP_LINE} — invited vendor list not yet recorded.</p>`
      : `<p>Invited vendors: <strong>${p.vendors.map(escapeHtml).join(', ')}</strong></p>`;
  return `
    ${round}
    ${vendors}
    <table class="dp-table"><caption>Trap-driven questions</caption>
      <thead><tr><th>ID</th><th>Severity</th><th>Question</th><th>Expected format</th></tr></thead>
      <tbody>${trap}</tbody>
    </table>
    <table class="dp-table"><caption>Value-uplift questions</caption>
      <thead><tr><th>ID</th><th>Question</th><th>Expected format</th></tr></thead>
      <tbody>${value}</tbody>
    </table>
  `;
}

// ── dx2 · Market Scan ──────────────────────────────────────────────────────

export function renderMarketScanHtml(p: MarketScanPayload): string {
  const vendors =
    p.vendors.length === 0
      ? emptyRow(7)
      : p.vendors
          .map(
            (v) =>
              `<tr><td>${escapeHtml(v.name)}</td><td>${escapeHtml(v.archetype)}</td><td>${escapeHtml(v.hq)}</td><td>${escapeHtml(v.scale)}</td><td>${escapeHtml(v.platformReality)}</td><td>${escapeHtml(v.maFlag)}</td><td>${escapeHtml(v.notes)}</td></tr>`,
          )
          .join('');
  const capabilities =
    p.capabilities.length === 0
      ? emptyRow(2 + p.vendors.length)
      : p.capabilities
          .map((c) => {
            const cells = p.vendors
              .map((v) => `<td>${escapeHtml(c.byVendor[v.id] ?? '—')}</td>`)
              .join('');
            return `<tr><td>${escapeHtml(c.capability)}</td><td>${escapeHtml(c.importance)}</td>${cells}</tr>`;
          })
          .join('');
  const rates =
    p.rates.length === 0
      ? emptyRow(6)
      : p.rates
          .map(
            (r) =>
              `<tr class="is-locked"><td>${escapeHtml(r.archetype)}</td><td>${escapeHtml(r.delivery)}</td><td>${escapeHtml(r.specialization)}</td><td class="is-num">$${r.rateUsdHrLow}/hr</td><td class="is-num">$${r.rateUsdHrHigh}/hr</td><td>${escapeHtml(r.source)}</td></tr>`,
          )
          .join('');
  const signals =
    p.industrySignals.length === 0
      ? emptyRow(3)
      : p.industrySignals
          .map(
            (s) =>
              `<tr><td>${escapeHtml(s.topic)}</td><td>${escapeHtml(s.observation)}</td><td>${escapeHtml(s.source)}</td></tr>`,
          )
          .join('');
  return `
    <table class="dp-table"><caption>Vendor longlist</caption>
      <thead><tr><th>Vendor</th><th>Archetype</th><th>HQ</th><th>Scale</th><th>Platform reality</th><th>M&amp;A flag</th><th>Notes</th></tr></thead>
      <tbody>${vendors}</tbody>
    </table>
    <table class="dp-table"><caption>Capability matrix</caption>
      <thead><tr><th>Capability</th><th>Importance</th>${p.vendors.map((v) => `<th>${escapeHtml(v.name)}</th>`).join('')}</tr></thead>
      <tbody>${capabilities}</tbody>
    </table>
    <table class="dp-table"><caption>3-D rate benchmarks (archetype × delivery × spec)</caption>
      <thead><tr><th>Archetype</th><th>Delivery</th><th>Spec</th><th>Low USD/hr</th><th>High USD/hr</th><th>Source</th></tr></thead>
      <tbody>${rates}</tbody>
    </table>
    <table class="dp-table"><caption>Industry signals (substrate)</caption>
      <thead><tr><th>Topic</th><th>Observation</th><th>Source</th></tr></thead>
      <tbody>${signals}</tbody>
    </table>
  `;
}

// ── dx4 · TCO Iceberg ──────────────────────────────────────────────────────

export function renderTcoIcebergHtml(p: TcoIcebergPayload): string {
  if (p.layers.length === 0) {
    return `<p style="color: var(--muted); font-style: italic;">${SEED_GAP_LINE} — no TCO layers loaded for this event.</p>`;
  }
  const totalY1 = p.layers.reduce((s, l) => s + l.year1Usd, 0);
  const totalY2 = p.layers.reduce((s, l) => s + l.year2Usd, 0);
  const totalY3 = p.layers.reduce((s, l) => s + l.year3Usd, 0);
  const hiddenSum = p.layers.filter((l) => l.visibility === 'hidden').reduce((s, l) => s + l.year1Usd + l.year2Usd + l.year3Usd, 0);
  const visibleSum = p.layers.filter((l) => l.visibility === 'visible').reduce((s, l) => s + l.year1Usd + l.year2Usd + l.year3Usd, 0);
  const rows = p.layers
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.label)}</td><td>${escapeHtml(l.visibility)}</td><td>${escapeHtml(l.driver)}</td><td class="is-num">${fmtUsd(l.year1Usd)}</td><td class="is-num">${fmtUsd(l.year2Usd)}</td><td class="is-num">${fmtUsd(l.year3Usd)}</td><td>${escapeHtml(l.confidence)}</td></tr>`,
    )
    .join('');
  const defs =
    p.definitions.length === 0
      ? ''
      : `<table class="dp-table"><caption>Methodology §5 layer definitions</caption>
          <thead><tr><th>Layer</th><th>Rubric</th></tr></thead>
          <tbody>${p.definitions.map((d) => `<tr class="is-locked"><td>${escapeHtml(d.layerLabel)}</td><td>${escapeHtml(d.rubric)}</td></tr>`).join('')}</tbody>
        </table>`;
  return `
    <p class="dp-stage__intent">3-year TCO: ${fmtUsd(totalY1 + totalY2 + totalY3)} · Vendor-quoted: ${fmtUsd(visibleSum)} · Hidden: <strong>${fmtUsd(hiddenSum)}</strong></p>
    <table class="dp-table"><caption>TCO Iceberg — Year 1 / 2 / 3</caption>
      <thead><tr><th>Layer</th><th>Visibility</th><th>Driver</th><th>Y1</th><th>Y2</th><th>Y3</th><th>Confidence</th></tr></thead>
      <tbody>${rows}
        <tr class="is-locked"><td><strong>Total</strong></td><td>—</td><td>—</td><td class="is-num"><strong>${fmtUsd(totalY1)}</strong></td><td class="is-num"><strong>${fmtUsd(totalY2)}</strong></td><td class="is-num"><strong>${fmtUsd(totalY3)}</strong></td><td>—</td></tr>
      </tbody>
    </table>
    ${defs}
  `;
}

// ── dx6a · AI Clause Gap ───────────────────────────────────────────────────

export function renderAiClauseGapHtml(p: AiClauseGapPayload): string {
  if (p.clauses.length === 0) {
    return `<p style="color: var(--muted); font-style: italic;">${SEED_GAP_LINE} — clause library not loaded for this event.</p>`;
  }
  const present = p.clauses.filter((c) => c.status === 'present').length;
  const partial = p.clauses.filter((c) => c.status === 'partial').length;
  const missing = p.clauses.filter((c) => c.status === 'missing').length;
  const critMissing = p.clauses.filter((c) => c.status === 'missing' && c.riskIfMissing === 'critical').length;
  const rows = p.clauses
    .map((c) => {
      const statusCls = c.status === 'present' ? 'present' : c.status === 'missing' ? 'missing' : c.status === 'partial' ? 'partial' : 'na';
      const rowCls = c.status === 'missing' && c.riskIfMissing === 'critical' ? 'is-critical' : c.status === 'missing' ? 'is-warning' : '';
      return `<tr class="${rowCls}"><td>${escapeHtml(c.clause)}</td><td>${escapeHtml(c.whyItMatters)}</td><td>${escapeHtml(c.requiredLanguage)}</td><td>${escapeHtml(c.riskIfMissing)}</td><td>${pillFor(statusCls, c.status)}</td><td>${escapeHtml(c.notes)}</td></tr>`;
    })
    .join('');
  const vendorLine = p.vendorName ? `Vendor under review: <strong>${escapeHtml(p.vendorName)}</strong>` : 'Vendor under review: not yet selected';
  return `
    <p class="dp-stage__intent">${vendorLine} · Present: ${present} · Partial: ${partial} · Missing: <strong>${missing}</strong> (critical-missing: ${critMissing})</p>
    <table class="dp-table"><caption>AI clause library — gap review</caption>
      <thead><tr><th>Clause</th><th>Why it matters</th><th>Required language</th><th>Risk if missing</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── dx7 · Renewal Decision ─────────────────────────────────────────────────

export function renderRenewalDecisionHtml(p: RenewalDecisionPayload): string {
  const candidates =
    p.candidates.length === 0
      ? emptyRow(8)
      : p.candidates
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.vendor)}</td><td>${escapeHtml(c.scope)}</td><td class="is-num">${fmtUsd(c.annualSpendUsd)}</td><td>${escapeHtml(c.renewalDate)}</td><td class="is-num">${c.daysUntilRenewal === 0 ? '—' : c.daysUntilRenewal}</td><td><strong>${escapeHtml(c.posture)}</strong></td><td>${escapeHtml(c.rationale)}</td><td>${escapeHtml(fmtMissing(c.finalDecision))}</td></tr>`,
          )
          .join('');
  const timing =
    p.candidates.length === 0
      ? emptyRow(7)
      : p.candidates
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.vendor)}</td><td>${escapeHtml(c.renewalDate)}</td><td class="is-num">${c.daysUntilRenewal === 0 ? '—' : c.daysUntilRenewal}</td><td>${escapeHtml(fmtBool(c.autoRenew))}</td><td>${escapeHtml(fmtMissing(c.noticePeriodDays == null ? null : String(c.noticePeriodDays)))}</td><td>${escapeHtml(fmtMissing(c.daysToNoticeDeadline == null ? null : String(c.daysToNoticeDeadline)))}</td><td>${escapeHtml(buildTimingRead(c))}</td></tr>`,
          )
          .join('');
  const usage =
    p.candidates.length === 0
      ? emptyRow(5)
      : p.candidates
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.vendor)}</td><td>${escapeHtml(c.scope)}</td><td>${escapeHtml(fmtPct(c.utilizationRate))}</td><td class="is-num">${escapeHtml(fmtOptionalUsd(c.estimatedShelfwareUsd))}</td><td>${escapeHtml(buildUsageRead(c))}</td></tr>`,
          )
          .join('');
  const spend =
    p.candidates.length === 0
      ? emptyRow(5)
      : p.candidates
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.vendor)}</td><td class="is-num">${fmtUsd(c.annualSpendUsd)}</td><td class="is-num">${escapeHtml(fmtOptionalUsd(c.benchmarkUsd))}</td><td class="is-num">${escapeHtml(fmtOptionalUsd(c.overspendVsBenchmarkUsd))}</td><td>${escapeHtml(buildSpendRead(c))}</td></tr>`,
          )
          .join('');
  const negotiation =
    p.candidates.length === 0
      ? emptyRow(5)
      : p.candidates
          .map(
            (c) =>
              `<tr><td>${escapeHtml(c.vendor)}</td><td><strong>${escapeHtml(c.posture)}</strong></td><td>${escapeHtml(c.negotiationPosture ?? SEED_GAP_LINE)}</td><td>${escapeHtml(c.topAlternative)}</td><td>${escapeHtml(c.srmAction ?? SEED_GAP_LINE)}</td></tr>`,
          )
          .join('');
  const signals =
    p.signals.length === 0
      ? emptyRow(4)
      : p.signals
          .map(
            (s) =>
              `<tr><td>${escapeHtml(s.metric)}</td><td>${escapeHtml(s.value)}</td><td>${escapeHtml(s.source)}</td><td>${escapeHtml(s.impact)}</td></tr>`,
          )
          .join('');
  const triggers =
    p.triggers.length === 0
      ? emptyRow(2)
      : p.triggers
          .map(
            (t) =>
              `<tr class="is-locked"><td>${escapeHtml(t.trigger)}</td><td>${escapeHtml(t.ifTrue)}</td></tr>`,
          )
          .join('');
  return `
    <p class="dp-stage__intent"><strong>Executive answer:</strong> ${escapeHtml(buildExecutiveAnswer(p))}</p>
    <table class="dp-table"><caption>Renewal candidates — recommended posture</caption>
      <thead><tr><th>Vendor</th><th>Scope</th><th>Annual</th><th>Renews</th><th>Days</th><th>Posture</th><th>Rationale</th><th>Final decision</th></tr></thead>
      <tbody>${candidates}</tbody>
    </table>
    <table class="dp-table"><caption>Timing and leverage</caption>
      <thead><tr><th>Vendor</th><th>Renewal</th><th>Days</th><th>Auto?</th><th>Notice period</th><th>Notice deadline</th><th>Leverage read</th></tr></thead>
      <tbody>${timing}</tbody>
    </table>
    <table class="dp-table"><caption>Usage and value leakage</caption>
      <thead><tr><th>Vendor</th><th>Scope</th><th>Utilization</th><th>Shelfware</th><th>Usage/value read</th></tr></thead>
      <tbody>${usage}</tbody>
    </table>
    <table class="dp-table"><caption>Spend and uplift bridge</caption>
      <thead><tr><th>Vendor</th><th>Annual</th><th>Benchmark</th><th>Uplift/overspend</th><th>Spend read</th></tr></thead>
      <tbody>${spend}</tbody>
    </table>
    <table class="dp-table"><caption>Negotiation posture and SRM handoff</caption>
      <thead><tr><th>Vendor</th><th>Posture</th><th>Stance</th><th>BATNA</th><th>SRM / Tower action</th></tr></thead>
      <tbody>${negotiation}</tbody>
    </table>
    <table class="dp-table"><caption>Operating telemetry signals</caption>
      <thead><tr><th>Metric</th><th>Value</th><th>Source</th><th>Posture impact</th></tr></thead>
      <tbody>${signals}</tbody>
    </table>
    <table class="dp-table"><caption>Locked decision triggers — "what would change my mind"</caption>
      <thead><tr><th>Trigger</th><th>If true</th></tr></thead>
      <tbody>${triggers}</tbody>
    </table>
  `;
}

function fmtOptionalUsd(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  return fmtUsd(n);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return SEED_GAP_LINE;
  return `${Math.round(n * 100)}%`;
}

function fmtBool(v: boolean | null | undefined): string {
  if (v == null) return SEED_GAP_LINE;
  return v ? 'Yes' : 'No';
}

function buildExecutiveAnswer(p: RenewalDecisionPayload): string {
  const priority = p.candidates.find((c) => c.posture !== 'renew_as_is') ?? p.candidates[0];
  if (!priority) return 'No renewal candidates recorded; load vendor_contracts before presenting a decision.';
  return `${priority.vendor}: ${priority.posture}. ${priority.rationale}`;
}

function buildTimingRead(c: RenewalDecisionPayload['candidates'][number]): string {
  const notice = c.daysToNoticeDeadline == null ? 'notice deadline not recorded' : `${c.daysToNoticeDeadline} days to notice deadline`;
  const auto = c.autoRenew == null ? 'auto-renewal term not recorded' : c.autoRenew ? 'auto-renewal applies' : 'no auto-renewal recorded';
  return `${c.daysUntilRenewal || 'Unknown'} days to renewal; ${auto}; ${notice}.`;
}

function buildUsageRead(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.utilizationRate == null && c.estimatedShelfwareUsd == null) {
    return 'Usage telemetry not recorded. Cannot quantify shelfware or adoption leakage.';
  }
  return `Utilization ${fmtPct(c.utilizationRate)}; estimated avoidable spend ${fmtOptionalUsd(c.estimatedShelfwareUsd)}.`;
}

function buildSpendRead(c: RenewalDecisionPayload['candidates'][number]): string {
  if (c.benchmarkUsd == null && c.overspendVsBenchmarkUsd == null) {
    return 'Benchmark not recorded. Use Source should-cost or client rate card before approving renewal economics.';
  }
  return `Annual spend ${fmtUsd(c.annualSpendUsd)} versus benchmark ${fmtOptionalUsd(c.benchmarkUsd)}; uplift / overspend ${fmtOptionalUsd(c.overspendVsBenchmarkUsd)}.`;
}
