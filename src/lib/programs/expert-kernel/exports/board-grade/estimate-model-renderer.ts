// Board-grade Estimate & Financial Model — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack,
// the Discover Brief and the Solution Architecture Pack, composed by the
// shared `deck-shell` module. The reader flips slides; for print an
// `@media print` block expands the deck into the full document.
//
// Blueprint §8's full form is an XLSX workbook; THIS deck is the HTML summary
// of it — a cover plus the eight §8 sections:
//   1. Executive summary           — is the estimate planning-grade credible?
//   2. Baseline metrics & seed gaps — what inputs is the model built on?
//   3. Workstream estimate         — what eight workstreams are being costed?
//   4. Role mix by phase           — how does the role-bearing effort phase?
//   5. Rate card & overrides       — where do the rates come from?
//   6. Value forecast              — gross value, the haircut, the net.
//   7. Sensitivity                 — base / conservative / upside; what breaks.
//   8. Roadmap cash flow           — phase cost, value unlock, payback.
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant hero exhibit, minimal prose, and a quiet
// footer. All CSS is inlined, every exhibit is an inline SVG, the slide-switch
// script is inline — the file opens offline. The renderer is PURE: a
// deterministic function of the kernel view-model. It changes no kernel logic;
// it renders the real `shape` recommendation, the real blocked payback, and
// the declared seed gaps — never an invented value.

import {
  buildApexEstimateModel,
  type EstimateModel,
  type EstimateSectionAnatomy,
  type EstimateEvidenceStrip,
} from './estimate-model-model';
import {
  type DeckMeta,
  type DeckSlide,
  type FooterFact,
  coverSlide,
  detailStrip,
  escapeHtml as esc,
  heroExhibit,
  heroExhibitHtml,
  lede,
  renderDeckDocument,
  slideShell,
} from './deck-shell';
import {
  CHART,
  compactUsd,
  economicsStrip,
  workstreamCostStack,
  roleMixByPhase,
  rateCardCoverageMatrix,
  scenarioRangeChart,
  sensitivityTornado,
  valueBridge,
  paybackRangeCurve,
} from './svg-charts';

// The deck has a fixed slide count — the cover plus the eight §8 sections.
const SLIDE_COUNT = 9;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: EstimateEvidenceStrip['confidence']): string {
  const map: Record<EstimateEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — so-what / decision role / owner / evidence / gate. */
function footerFacts(a: EstimateSectionAnatomy): FooterFact[] {
  const ev = a.evidence;
  const srcCount = ev.sources.length;
  const gapText =
    ev.gaps.length > 0
      ? `${ev.gaps.length} open ${ev.gaps.length === 1 ? 'gap' : 'gaps'}`
      : 'No open gaps';
  return [
    { key: 'So what', val: a.implication },
    { key: 'Decision role', val: a.decisionRole },
    { key: 'Owner', val: a.owner },
    {
      key: 'Evidence',
      val:
        `${srcCount} ${srcCount === 1 ? 'source' : 'sources'} · as of ` +
        `${ev.asOf} · confidence ${confidenceLabel(ev.confidence)} · ` +
        `${gapText}`,
    },
    { key: 'Next gate', val: a.nextGate },
  ];
}

/** Wrap a section's hero body into a `<section class="slide">`. */
function slide(
  a: EstimateSectionAnatomy,
  model: EstimateModel,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: model.moveLabel,
    navLabel: a.navLabel,
    sectionNo: a.page,
    takeaway: a.takeaway,
    hero,
    footer: footerFacts(a),
  });
}

function detail(summary: string, body: string): string {
  return detailStrip(summary, body);
}

function usd(n: number): string {
  return compactUsd(n);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

// A workstream-segment palette — disciplined, derived from the locked tokens.
const SEG_COLORS = [
  CHART.accent,
  '#3f6fae',
  '#6d93c4',
  '#9bb6d6',
  CHART.warn,
  '#a8763a',
  '#c79b6a',
  '#5b5852',
];

// ===========================================================================
// Slide 1 — Executive summary.
// ===========================================================================

function renderExecutiveSummary(model: EstimateModel): string {
  const s = model.sections.executiveSummary;
  const verdictClass =
    model.recommendation === 'fund'
      ? 'verdict-fund'
      : model.recommendation === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Estimate verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Estimate economics at a glance',
      economicsStrip(s.tiles),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Rate-card basis</span>` +
    `<span>${esc(s.rateCardBasis)}</span>` +
    `</div>`;
  return slide(s.anatomy, model, 2, hero);
}

// ===========================================================================
// Slide 2 — Baseline metrics & seed gaps.
// ===========================================================================

function renderBaselineInputs(model: EstimateModel): string {
  const s = model.sections.baselineInputs;

  const metricRows = s.metrics
    .map(
      (m) =>
        `<tr>` +
        `<td>${esc(m.metric)}</td>` +
        `<td class="num">${esc(m.value)}</td>` +
        `<td>${esc(m.source)}</td>` +
        `<td class="num">${esc(m.asOf)}</td>` +
        `<td class="num">${confChip(m.confidence)}</td>` +
        `</tr>`,
    )
    .join('');
  const gapRows = s.seedGaps
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.metric)} ` +
        `<span class="chip chip-bad">Seed gap</span></td>` +
        `<td class="num">Not recorded</td>` +
        `<td colspan="2">${esc(g.reason)}</td>` +
        `<td class="num"><span class="chip chip-bad">none</span></td>` +
        `</tr>` +
        `<tr class="row-proxy"><td colspan="5" class="gap-impact">` +
        `<strong>Decision impact —</strong> ${esc(g.impact)}</td></tr>`,
    )
    .join('');

  const hero =
    lede(
      `The financial model is built on ${s.recordedCount} recorded KPIs and ` +
        `${s.seedGapCount} declared seed gaps. Every recorded input carries a ` +
        'source, an as-of date and a confidence; every missing input is ' +
        'declared a seed gap with its decision impact spelled out — never ' +
        'left blank, never guessed.',
    ) +
    heroExhibitHtml(
      'Exhibit 2 — Model inputs: recorded KPIs and declared seed gaps',
      `<table class="data-table">` +
        `<thead><tr><th>Input metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th></tr></thead>` +
        `<tbody>${metricRows}${gapRows}</tbody>` +
        `</table>`,
      'Six recorded KPIs ground the cost and value model. Four seed gaps are ' +
        'declared in-line — the honest limits of what the estimate can claim.',
    );
  return slide(s.anatomy, model, 3, hero);
}

// ===========================================================================
// Slide 3 — Workstream estimate.
// ===========================================================================

function renderWorkstreamEstimate(model: EstimateModel): string {
  const s = model.sections.workstreamEstimate;

  const rows = s.workstreams
    .map(
      (w) =>
        `<tr${w.isBusinessChange ? ' class="row-change"' : ''}>` +
        `<td>${esc(w.label)}${
          w.isBusinessChange
            ? ' <span class="chip chip-warn">Business change</span>'
            : ''
        }</td>` +
        `<td class="num">${esc(usd(w.upsideCost))}</td>` +
        `<td class="num">${esc(usd(w.baseCost))}</td>` +
        `<td class="num">${esc(usd(w.conservativeCost))}</td>` +
        `<td class="num">${esc(usd(w.humanCost))}</td>` +
        `<td class="num">${esc(usd(w.agentCost))}</td>` +
        `<td class="num">${w.headcount}</td>` +
        `<td class="num">${w.durationMonths} mo</td>` +
        `</tr>`,
    )
    .join('');
  const totalRow =
    `<tr><td><strong>Total — eight workstreams</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalUpside))}</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalBase))}</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalConservative))}</strong></td>` +
    `<td class="num" colspan="3"></td><td class="num"></td></tr>`;

  const hero =
    lede(
      'The estimate decomposes into all eight Move workstreams — AI build, ' +
        'integration, data, foundational, data governance, process redesign, ' +
        'change & adoption and run. Each is costed on its own role mix; none ' +
        'is collapsed into a generic six-role model.',
    ) +
    heroExhibit(
      'Exhibit 3 — Workstream cost stack: human and AI-agent effort, by stream',
      workstreamCostStack(
        s.workstreams.map((w) => ({
          label: w.label,
          humanCost: w.humanCost,
          agentCost: w.agentCost,
          isBusinessChange: w.isBusinessChange,
        })),
      ),
      `Business change is ${Math.round(s.businessChangeFraction * 100)}% of ` +
        'base effort — the outlined bars. The §8 hard fail is omitting it; ' +
        'here it is a first-class, costed lane.',
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Build vs change</span>` +
    `<span>${esc(s.buildVsChangeNote)}</span>` +
    `</div>` +
    detail(
      'Per-workstream estimate — base / conservative / upside, human vs agent',
      `<table class="data-table">` +
        `<thead><tr><th>Workstream</th><th class="num">Upside</th>` +
        `<th class="num">Base</th><th class="num">Conservative</th>` +
        `<th class="num">Human</th><th class="num">AI agent</th>` +
        `<th class="num">FTEs</th><th class="num">Duration</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `<tfoot>${totalRow}</tfoot>` +
        `</table>`,
    );
  return slide(s.anatomy, model, 4, hero);
}

// ===========================================================================
// Slide 4 — Role mix by phase.
// ===========================================================================

function renderRoleMixByPhase(model: EstimateModel): string {
  const s = model.sections.roleMixByPhase;

  const rows: Array<{
    label: string;
    segments: Array<{ label: string; cost: number; color: string }>;
  }> = s.phases.map((p) => ({
    label: p.label,
    segments: p.workstreams.map((w, i) => ({
      label: w.label,
      cost: w.baseCost,
      color: SEG_COLORS[i % SEG_COLORS.length],
    })),
  }));

  const phaseTables = s.phases
    .map((p) => {
      const wsRows = p.workstreams
        .map(
          (w) =>
            `<tr${w.isBusinessChange ? ' class="row-change"' : ''}>` +
            `<td>${esc(w.label)}</td>` +
            `<td class="num">${esc(usd(w.baseCost))}</td>` +
            `<td class="num">${w.headcount}</td>` +
            `<td class="num">${w.durationMonths} mo</td>` +
            `<td class="num">${Math.round(w.agentSplit * 100)}%</td>` +
            `</tr>`,
        )
        .join('');
      return (
        `<div class="phase-block">` +
        `<div class="phase-block-head">${esc(p.label)} · ` +
        `${p.durationMonths} mo · ${esc(usd(p.baseCost))}` +
        `${p.isFoundational ? ' · <span class="chip chip-warn">Foundational</span>' : ''}` +
        `</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Workstream</th><th class="num">Base cost</th>` +
        `<th class="num">FTEs</th><th class="num">Duration</th>` +
        `<th class="num">Agent split</th></tr></thead>` +
        `<tbody>${wsRows}</tbody></table></div>`
      );
    })
    .join('');

  const hero =
    lede(
      'The estimate phases its effort — a foundational data-and-platform ' +
        'phase, a routing pilot, scale-out with process redesign, then ' +
        'adoption and run. Each phase carries its own workstream-bearing ' +
        'role mix, so the role-bearing effort is never lumped into one row.',
    ) +
    heroExhibit(
      'Exhibit 4 — Role mix by phase: workstream effort across the roadmap',
      roleMixByPhase(rows),
      'The foundational phase carries cost ahead of value — honest ' +
        'sequencing. Phase effort is shown by workstream, not blended.',
    ) +
    detail('Per-phase workstream detail — headcount, duration, agent split', phaseTables);
  return slide(s.anatomy, model, 5, hero);
}

// ===========================================================================
// Slide 5 — Rate card & overrides.
// ===========================================================================

function renderRateCard(model: EstimateModel): string {
  const s = model.sections.rateCard;

  const provLabel =
    s.provenance === 'comprehensive'
      ? 'Apex comprehensive client rate-card pack'
      : s.provenance === 'researched_benchmark'
        ? 'Researched market benchmark — not a quote'
        : s.provenance;

  const hero =
    lede(
      'Every rate in this estimate traces to a named source. The model runs ' +
        'on an Apex comprehensive rate-card pack — a client_rate_card onshore ' +
        'lane and a vendor_quote offshore lane — not a hidden benchmark. The ' +
        'rate-card source is shown, and the override path is explicit.',
    ) +
    heroExhibit(
      'Exhibit 5 — Rate-card coverage: role-family lanes and their source',
      rateCardCoverageMatrix(s.cells, provLabel),
      'Each role family keeps its onshore and offshore lane distinct — ' +
        'domain, location and seniority are not collapsed into one blended ' +
        'rate. A priced lane shows its rate; an unpriced lane would be ' +
        'hatched.',
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Override path</span>` +
    `<span>${esc(s.overrideNote)}</span>` +
    `</div>` +
    detail(
      'Rate-card provenance — the full source label carried by the kernel',
      `<table class="data-table">` +
        `<thead><tr><th>Attribute</th><th>Value</th></tr></thead>` +
        `<tbody>` +
        `<tr><td>Provenance</td><td>${esc(s.provenance)}</td></tr>` +
        `<tr><td>Client override in effect</td><td>${
          s.isClientOverride ? 'Yes — a client / comprehensive pack' : 'No — benchmark default'
        }</td></tr>` +
        `<tr><td>Source label</td><td>${esc(s.provenanceLabel)}</td></tr>` +
        `</tbody></table>`,
    );
  return slide(s.anatomy, model, 6, hero);
}

// ===========================================================================
// Slide 6 — Value forecast.
// ===========================================================================

function renderValueForecast(model: EstimateModel): string {
  const s = model.sections.valueForecast;

  // Build the gross-to-net bridge from the haircut factors. The gross is the
  // high-bound gross; each factor is a downward step; net is the high-bound
  // net. The step magnitudes are the factor discounts applied to gross.
  const grossPoint = parseUsdRangeHigh(s.grossTotal);
  const netPoint = parseUsdRangeHigh(s.netTotal);
  const bridgeSteps = s.haircutFactors.map((f) => ({
    label: f.dimension,
    amount: Math.round((grossPoint * f.discountPct) / 100),
  }));

  const factorRows = s.haircutFactors
    .map(
      (f) =>
        `<tr>` +
        `<td>${esc(f.dimension)}</td>` +
        `<td class="num">${f.score.toFixed(2)}</td>` +
        `<td class="num">${f.discountPct.toFixed(1)}%</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Gross value is never claimed. A mandatory six-factor haircut discounts ` +
        `${Math.round(s.totalHaircut * 100)}% of the gross before any net is ` +
        `shown — only ${Math.round(s.retainedFraction * 100)}% is retained. ` +
        'And the gross itself rests on a benchmark cost-per-contact proxy, so ' +
        'the net is a proxy net, honestly flagged.',
    ) +
    heroExhibit(
      'Exhibit 6 — Gross-to-net value bridge: the mandatory haircut',
      valueBridge(grossPoint, bridgeSteps, netPoint),
      `Gross 3-yr value ${esc(s.grossTotal)} → net ${esc(s.netTotal)} after ` +
        'the six-factor haircut. The gross rests on a seed-gap proxy — the ' +
        'net is directional, not a verified return.',
    ) +
    detail(
      'Haircut factors and the per-year net-value curve',
      `<table class="data-table">` +
        `<thead><tr><th>Haircut factor</th><th class="num">Confidence score</th>` +
        `<th class="num">Discount of gross</th></tr></thead>` +
        `<tbody>${factorRows}` +
        `<tr><td><strong>Total haircut</strong></td><td class="num"></td>` +
        `<td class="num"><strong>${Math.round(s.totalHaircut * 100)}%</strong></td></tr>` +
        `</tbody></table>` +
        `<div class="mini-key mini-key-block">Per-year net value (post-haircut)</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Year</th><th class="num">Adoption</th>` +
        `<th class="num">Net value</th></tr></thead>` +
        `<tbody>` +
        s.curve
          .map(
            (c) =>
              `<tr><td>Year ${c.year}</td>` +
              `<td class="num">${Math.round(c.adoption * 100)}%</td>` +
              `<td class="num">${esc(usd(c.netValue))}</td></tr>`,
          )
          .join('') +
        `</tbody></table>`,
    );
  return slide(s.anatomy, model, 7, hero);
}

// ===========================================================================
// Slide 7 — Sensitivity.
// ===========================================================================

function renderSensitivity(model: EstimateModel): string {
  const s = model.sections.sensitivity;

  const hero =
    lede(
      'A single ROI number would hide the real shape of the case. This ' +
        'estimate is shown as three scenarios — conservative, base, upside — ' +
        'and the assumptions that move it most are ranked. The one thing ' +
        'that breaks the case is named, not buried.',
    ) +
    heroExhibit(
      'Exhibit 7a — Net return: conservative, base and upside',
      scenarioRangeChart(
        s.scenarios.map((sc) => ({
          label: sc.label,
          value: sc.netReturn,
          tone: sc.tone,
        })),
      ),
    ) +
    heroExhibit(
      'Exhibit 7b — Sensitivity tornado: the assumptions that move the case',
      sensitivityTornado(s.tornado),
      'A hatched bar is a seed-gap proxy — an assumption that rests on a ' +
        'gap, not recorded data. It is the widest mover for a reason.',
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">What breaks the case</span>` +
    `<span>${esc(s.whatBreaksTheCase)}</span>` +
    `</div>` +
    detail(
      'The downside read — is the floor survivable?',
      `<p class="mini-para">${esc(s.downsideRead)}</p>`,
    );
  return slide(s.anatomy, model, 8, hero);
}

// ===========================================================================
// Slide 8 — Roadmap cash flow.
// ===========================================================================

function renderRoadmapCashFlow(model: EstimateModel): string {
  const s = model.sections.roadmapCashFlow;

  const phaseRows = s.phases
    .map(
      (p) =>
        `<tr${p.isFoundational ? ' class="row-change"' : ''}>` +
        `<td>${esc(p.label)}${
          p.isFoundational
            ? ' <span class="chip chip-warn">Foundational</span>'
            : ''
        }</td>` +
        `<td class="num">${esc(usd(p.investment))}</td>` +
        `<td class="num">${esc(usd(p.cumulativeInvestment))}</td>` +
        `<td class="num">${esc(usd(p.annualValueUnlocked))}</td>` +
        `<td class="num">${p.durationMonths} mo</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'Phase cost lands before phase value — the foundational phase is pure ' +
        'cost, value unlocks from the pilot onward. Because monetization is ' +
        'blocked by the cost-per-contact seed gap, the curve models ' +
        'discounted net value, not verified cash: no payback month is claimed.',
    ) +
    heroExhibit(
      'Exhibit 8 — Cash-flow shape: phase cost against unlocked value',
      paybackRangeCurve(
        [
          {
            label: 'Base',
            color: CHART.accent,
            cumulative: s.cashFlow.base,
          },
          {
            label: 'Conservative',
            color: CHART.negative,
            dashed: true,
            cumulative: s.cashFlow.conservative,
          },
          {
            label: 'Upside',
            color: CHART.good,
            dashed: true,
            cumulative: s.cashFlow.upside,
          },
        ],
        s.cashFlow.periodLabels,
        s.paybackBlocked,
      ),
      'The lines are cumulative discounted net value, not cash — payback is ' +
        'not computable while the cost-per-contact baseline is a seed gap.',
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Payback status</span>` +
    `<span>${esc(s.paybackNote)}</span>` +
    `</div>` +
    detail(
      'Per-phase cash flow — investment, cumulative cost, value unlocked',
      `<table class="data-table">` +
        `<thead><tr><th>Phase</th><th class="num">Investment</th>` +
        `<th class="num">Cumulative</th><th class="num">Annual value unlocked</th>` +
        `<th class="num">Duration</th></tr></thead>` +
        `<tbody>${phaseRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, model, 9, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(model: EstimateModel): string {
  const verdictWord = model.recommendation.toUpperCase();
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Estimate & Financial Model · Board-grade artifact',
    title: model.moveLabel,
    tenantLine: `${model.tenantLabel} · ${model.tenantKey}`,
    lede:
      'The HTML summary of the Estimate & Financial Model workbook, in 9 ' +
      "slides. Every figure is produced by the Moves Expert Kernel from Apex's " +
      'audited substrate and a client rate card. Payback is **blocked** — the ' +
      'cost-per-contact baseline is a declared seed gap, so the honest ' +
      'verdict is shape, not fund.',
    meta: [
      { label: 'Recommendation', value: verdictWord },
      { label: 'Payback', value: 'Blocked — seed gap' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: model.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Estimate-Model-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function estimateStyles(): string {
  return `
/* --- Estimate model — business-change row tint. --- */
.data-table tr.row-change td { background: #fdf6e8; }
.gap-impact {
  font-size: 11px; color: #7A4F01; background: #fdf6e8 !important;
  line-height: 1.5;
}
/* --- Per-phase blocks in the role-mix detail strip. --- */
.phase-block { margin-bottom: 14px; }
.phase-block-head {
  font-size: 11px; font-weight: 800; color: #1c1a17;
  padding: 8px 0 2px; letter-spacing: 0.01em;
}
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
`;
}

// ===========================================================================
// The full document — the Estimate Model's nine slides handed to the deck
// shell. The shell owns the menu rail, the stage, the inline script and the
// print expansion; this renderer supplies the slides and the style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Estimate & Financial Model as one
 * self-contained HTML document — a left-menu presentation deck. Deterministic
 * — a pure function of `generatedOn`.
 */
export function renderApexEstimateModelHtml(generatedOn: string): string {
  const model = buildApexEstimateModel(generatedOn);
  const verdictWord = model.recommendation.toUpperCase();

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Estimate & Financial Model',
    moveLabel: model.moveLabel,
    tenantLabel: model.tenantLabel,
    tenantKey: model.tenantKey,
    generatedOn: model.generatedOn,
    verdict: {
      label: verdictWord,
      sub: 'Payback blocked — cost-per-contact seed gap',
    },
    documentTitle: `${model.moveLabel} — Estimate & Financial Model — ${model.tenantLabel}`,
  };

  const renderers: Array<(m: EstimateModel) => string> = [
    renderExecutiveSummary,
    renderBaselineInputs,
    renderWorkstreamEstimate,
    renderRoleMixByPhase,
    renderRateCard,
    renderValueForecast,
    renderSensitivity,
    renderRoadmapCashFlow,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Estimate & Financial Model',
      render: () => renderCover(model),
    },
    ...model.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](model),
    })),
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${estimateStyles()}</style>`);
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/** Parse the high bound out of a "$Xm – $Ym" range string into a number. */
function parseUsdRangeHigh(range: string): number {
  const parts = range.split('–').map((p) => p.trim());
  const last = parts[parts.length - 1] ?? parts[0];
  return parseUsdToken(last);
}

/** Parse a single "$2.20M" / "$940K" token into a number. */
function parseUsdToken(token: string): number {
  const m = /\$?([\d.]+)\s*([MK]?)/i.exec(token);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === 'M') return Math.round(n * 1_000_000);
  if (unit === 'K') return Math.round(n * 1_000);
  return Math.round(n);
}
