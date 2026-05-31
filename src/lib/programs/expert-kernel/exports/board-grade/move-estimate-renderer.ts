// Generic Move Estimate & Financial Model — self-contained HTML renderer.
//
// The generic sibling of `estimate-model-renderer.ts` (the Apex reference
// renderer). It renders the Estimate & Financial Model deck for a REAL,
// originated Move from `buildMoveEstimateModel(move)` — the kernel-derived
// view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The deck has six sections
// (executive summary, baseline & seed gaps, workstream estimate, rate card,
// value forecast, sensitivity & cash flow), driven entirely by the kernel
// skeleton and the Function-Pack binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveEstimateModelHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated estimate
// for an unbound Move.
//
// The Apex renderer (`renderApexEstimateModelHtml`) is left untouched — this
// file is added alongside it.

import {
  buildMoveEstimateModel,
  type MoveEstimateModel,
  type MoveEstimateModelResult,
  type MoveEstimateSectionAnatomy,
  type MoveEstimateEvidenceStrip,
} from './move-estimate-model';
import type { MoveBusinessCaseInput } from '../../../move-business-case';
import {
  type DeckMeta,
  type DeckSlide,
  type FooterFact,
  coverSlide,
  detailStrip,
  escapeHtml as esc,
  heroExhibit as shellHeroExhibit,
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
  rateCardCoverageMatrix,
  scenarioRangeChart,
  sensitivityTornado,
  valueBridge,
  paybackRangeCurve,
} from './svg-charts';
import { renderVerdictExplainerChip } from './verdict-explainer';

// The bound deck has a fixed slide count — the cover plus the six sections.
const SLIDE_COUNT = 7;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveEstimateEvidenceStrip['confidence']): string {
  const map: Record<MoveEstimateEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveEstimateSectionAnatomy): FooterFact[] {
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

function slide(
  a: MoveEstimateSectionAnatomy,
  moveLabel: string,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: moveLabel,
    navLabel: a.navLabel,
    sectionNo: a.page,
    takeaway: a.takeaway,
    hero,
    footer: footerFacts(a),
  });
}

function heroExhibit(caption: string, svg: string, note?: string): string {
  return shellHeroExhibit(caption, svg, note);
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

function renderAiOpsPanel(s: MoveEstimateModel['sections']['workstreamEstimate']): string {
  const aiOps = s.aiOps;
  const maxAxis = Math.max(s.aiBuildCost, s.businessChangeCost, s.aiOpsCost, 1);
  const axis = (label: string, value: number, cls: string): string =>
    `<div class="axis-row">` +
    `<span class="axis-label">${esc(label)}</span>` +
    `<span class="axis-track">` +
    `<span class="axis-fill ${cls}" style="width:${Math.max(
      2,
      (value / maxAxis) * 100,
    ).toFixed(1)}%"></span>` +
    `</span>` +
    `<span class="axis-value">${esc(usd(value))}</span>` +
    `</div>`;

  if (!aiOps) {
    return heroExhibitHtml(
      'Exhibit 3b — Three-axis cost view: AI ops not yet modeled',
      `<div class="axis-stack">` +
        axis('Build cost', s.aiBuildCost, 'axis-build') +
        axis('Change cost', s.businessChangeCost, 'axis-change') +
        axis('AI Ops cost', 0, 'axis-ops') +
        `</div>` +
        `<p class="hero-note">AI Ops cost is not supplied on this Move yet. ` +
        `The funding view is still honest: build and change cost are shown, ` +
        `and the run-cost gap remains visible instead of being implied.</p>`,
    );
  }

  const warningCards = [
    aiOps.pricingTierShockWarning
      ? `<div class="aiops-warning aiops-warning-amber">` +
        `<strong>Pricing-tier alert</strong><span>${esc(
          aiOps.pricingTierShockWarning,
        )}</span></div>`
      : '',
    aiOps.modelTierDriftWarning
      ? `<div class="aiops-warning aiops-warning-red">` +
        `<strong>Model-tier drift</strong><span>${esc(
          aiOps.modelTierDriftWarning,
        )}</span></div>`
      : '',
  ].join('');
  const yearRows = aiOps.perYear
    .map(
      (y) =>
        `<tr>` +
        `<td class="num">Y${y.year}</td>` +
        `<td class="num">${esc(usd(y.inferenceUsd))}</td>` +
        `<td class="num">${esc(usd(y.embeddingUsd))}</td>` +
        `<td class="num">${esc(usd(y.evalUsd))}</td>` +
        `<td class="num">${esc(usd(y.fineTuneUsd))}</td>` +
        `<td class="num"><strong>${esc(usd(y.totalUsd))}</strong></td>` +
        `</tr>`,
    )
    .join('');
  const unitEconomic =
    aiOps.costPerDecisionUsd !== null && aiOps.decisionUnit
      ? `$${aiOps.costPerDecisionUsd.toFixed(4)} per ${aiOps.decisionUnit}`
      : `$${aiOps.costPerCallUsd.toFixed(4)} per call`;

  return heroExhibitHtml(
    'Exhibit 3b — Three-axis cost view: Build, Change, and AI Ops',
    `<div class="axis-stack">` +
      axis('Build cost', s.aiBuildCost, 'axis-build') +
      axis('Change cost', s.businessChangeCost, 'axis-change') +
      axis('AI Ops cost', s.aiOpsCost, 'axis-ops') +
      `</div>` +
      `<div class="aiops-metrics">` +
      `<div><span>3-year AI Ops</span><strong>${esc(
        usd(aiOps.threeYearTotal),
      )}</strong></div>` +
      `<div><span>5-year AI Ops</span><strong>${esc(
        usd(aiOps.fiveYearTotal),
      )}</strong></div>` +
      `<div><span>Unit economic</span><strong>${esc(
        unitEconomic,
      )}</strong></div>` +
      `<div><span>Rate card as of</span><strong>${esc(
        aiOps.rateCardAsOf,
      )}</strong></div>` +
      `</div>` +
      warningCards +
      `<table class="data-table aiops-table">` +
      `<thead><tr><th class="num">Year</th><th class="num">Inference</th>` +
      `<th class="num">Embedding</th><th class="num">Eval</th>` +
      `<th class="num">Fine-tune</th><th class="num">Total</th></tr></thead>` +
      `<tbody>${yearRows}</tbody></table>`,
  );
}

// ===========================================================================
// Slide 1 — Executive summary.
// ===========================================================================

function renderExecutiveSummary(model: MoveEstimateModel): string {
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
    renderVerdictExplainerChip(model.verdictExplainerChip) +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Estimate economics, from the kernel',
      economicsStrip(s.tiles),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Rate-card basis</span>` +
    `<span>${esc(s.rateCardBasis)}</span>` +
    `</div>`;
  return slide(s.anatomy, model.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Baseline metrics & seed gaps.
// ===========================================================================

function renderBaselineInputs(model: MoveEstimateModel): string {
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
        `<strong>Expected data source —</strong> ` +
        `${esc(g.expectedDataSource)}</td></tr>`,
    )
    .join('');

  const tableBody =
    metricRows +
    gapRows +
    (s.metrics.length === 0
      ? `<tr><td colspan="5" class="gap-impact">` +
        `This Move records no baseline metrics yet — every input the ` +
        `financial model needs is a declared seed gap below, named with ` +
        `its expected data source. No value is fabricated.</td></tr>`
      : '');

  const hero =
    lede(
      `The financial model is built on ${s.recordedCount} recorded ` +
        `${s.recordedCount === 1 ? 'metric' : 'metrics'} and ` +
        `${s.seedGapCount} declared seed ` +
        `${s.seedGapCount === 1 ? 'gap' : 'gaps'} — ` +
        `baseline coverage ${s.coveragePct}%. Every recorded input carries a ` +
        'source, an as-of date and a confidence; every missing input is a ' +
        'precise seed gap inherited from the curated Function Pack — never ' +
        'left blank, never guessed.',
    ) +
    heroExhibitHtml(
      'Exhibit 2 — Model inputs: recorded metrics and declared seed gaps',
      `<table class="data-table">` +
        `<thead><tr><th>Input metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th></tr></thead>` +
        `<tbody>${tableBody}</tbody>` +
        `</table>`,
      'The recorded metrics ground the cost and value model. The seed gaps ' +
        'are declared in-line — the honest limits of what the estimate can ' +
        'claim today.',
    );
  return slide(s.anatomy, model.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Workstream estimate.
// ===========================================================================

function renderWorkstreamEstimate(model: MoveEstimateModel): string {
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
    `<tr><td><strong>Total — ${s.workstreams.length} workstreams</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalUpside))}</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalBase))}</strong></td>` +
    `<td class="num"><strong>${esc(usd(s.totalConservative))}</strong></td>` +
    `<td class="num" colspan="3"></td><td class="num"></td></tr>`;

  const hero =
    lede(
      `The estimate decomposes into all ${s.workstreams.length} Move ` +
        'workstreams — AI build, integration, data, foundational, data ' +
        'governance, process redesign, change & adoption and run. Each is ' +
        'costed on its own role mix; none is collapsed into a generic ' +
        'six-role model. Every figure is a planning estimate, NOT a quote.',
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
        'base effort — the outlined bars. Omitting it is the common way an ' +
        'AI estimate fails; here it is a first-class, costed lane.',
    ) +
    renderAiOpsPanel(s) +
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
        `</table>` +
        `<p class="hero-note">The base / conservative / upside columns are ` +
        `a planning range derived from the curated Function Pack archetypes ` +
        `— they must be replaced with a client-specific estimate before any ` +
        `funding commitment.</p>`,
    );
  return slide(s.anatomy, model.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — Rate card & overrides.
// ===========================================================================

function renderRateCard(model: MoveEstimateModel): string {
  const s = model.sections.rateCard;

  const provLabel = s.isClientOverride
    ? 'Client rate-card pack'
    : 'Researched market benchmark — not a quote';

  const hero =
    lede(
      'Every rate in this estimate traces to a named source. The model runs ' +
        `on ${
          s.isClientOverride
            ? 'a client rate-card pack'
            : 'the kernel’s researched benchmark rate card'
        } — not a hidden rate. The rate-card source is shown below, and the ` +
        'client-override path is explicit.',
    ) +
    heroExhibit(
      'Exhibit 4 — Rate-card coverage: role-family lanes and their source',
      rateCardCoverageMatrix(s.cells, provLabel),
      'Each role family keeps its onshore and offshore lane distinct — ' +
        'domain, location and seniority are not collapsed into one blended ' +
        'rate. A priced lane shows its rate; an unpriced lane is hatched.',
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
          s.isClientOverride
            ? 'Yes — a client / comprehensive pack'
            : 'No — researched benchmark default'
        }</td></tr>` +
        `<tr><td>Effective AI-agent split</td><td>${s.agentSplitPct}% of ` +
        `base effort delivered by AI agents</td></tr>` +
        `<tr><td>Source label</td><td>${esc(s.provenanceLabel)}</td></tr>` +
        `</tbody></table>`,
    );
  return slide(s.anatomy, model.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Value forecast.
// ===========================================================================

function renderValueForecast(model: MoveEstimateModel): string {
  const s = model.sections.valueForecast;

  const curveRows = s.curve
    .map(
      (c) =>
        `<tr><td>Year ${c.year}</td>` +
        `<td class="num">${Math.round(c.adoption * 100)}%</td>` +
        `<td class="num">${esc(usd(c.netValue))}</td></tr>`,
    )
    .join('');

  // The bridge shows the discount from the upper planning ceiling to the net
  // point — a single "six-factor haircut" step. The skeleton does not
  // re-expose the per-dimension haircut factors, so the deck is honest about
  // showing one combined step rather than fabricating six.
  const hero =
    lede(
      s.monetisationBlocked
        ? `Net 3-year value is carried as a planning range — point ` +
          `${usd(s.netValue.point)}, range ${usd(s.netValue.low)} to ` +
          `${usd(s.netValue.high)}. It rests on the Function Pack’s curated ` +
          `benchmark proxies, so the kernel honestly blocks a claimable ` +
          `dollar payback until the tenant’s own metrics land.`
        : `Net 3-year value lands at ${usd(s.netValue.point)} after the ` +
          `mandatory six-factor haircut discounts the gross planning range.`,
    ) +
    (s.grossCeiling > s.netValue.point
      ? heroExhibit(
          'Exhibit 5 — Gross-to-net value bridge (planning range)',
          valueBridge(
            s.grossCeiling,
            [
              {
                label: 'Six-factor haircut',
                amount: s.grossCeiling - s.netValue.point,
              },
            ],
            s.netValue.point,
          ),
          'The gross figure is the upper planning bound — a curated benchmark ' +
            'proxy, not the tenant’s own measured value. The net is ' +
            'directional, not a verified return.',
        )
      : heroExhibitHtml(
          'Exhibit 5 — Net value, carried honestly as a planning range',
          `<div class="coverage-tiles">` +
            `<div class="coverage-tile coverage-neutral">` +
            `<div class="coverage-num">${usd(s.netValue.point)}</div>` +
            `<div class="coverage-label">Net value (3-yr, base)</div>` +
            `<div class="coverage-sub">Post-haircut · planning range</div>` +
            `</div>` +
            `<div class="coverage-tile coverage-gap">` +
            `<div class="coverage-num">${s.haircutPct}%</div>` +
            `<div class="coverage-label">Haircut applied</div>` +
            `<div class="coverage-sub">Mandatory six-factor model</div>` +
            `</div>` +
            `</div>`,
        )) +
    detail(
      'Per-year net-value curve — value follows the adoption ramp',
      `<table class="data-table">` +
        `<thead><tr><th>Year</th><th class="num">Adoption</th>` +
        `<th class="num">Net value at adoption</th></tr></thead>` +
        `<tbody>${curveRows}</tbody>` +
        `</table>` +
        `<p class="hero-note">The adoption ramp is a conservative planning ` +
        `curve — value lands as people change how they work, never on day ` +
        `one. It is a planning curve, not a commitment.</p>`,
    );
  return slide(s.anatomy, model.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — Sensitivity & cash flow.
// ===========================================================================

function renderSensitivity(model: MoveEstimateModel): string {
  const s = model.sections.sensitivity;

  const tornadoBlock =
    s.tornado.length > 0
      ? heroExhibit(
          'Exhibit 6b — Sensitivity tornado: the assumptions that move the case',
          sensitivityTornado(s.tornado),
          'A hatched bar is a seed-gap proxy — an assumption that rests on a ' +
            'gap, not recorded data. It is the widest mover for a reason.',
        )
      : '';

  const hero =
    lede(
      'A single ROI number would hide the real shape of the case. This ' +
        'estimate is shown as three scenarios — conservative, base, upside — ' +
        'and the assumptions that move it most are ranked. The cash-flow ' +
        'curve is staged across the cost lanes — and because monetisation ' +
        'rests on a curated proxy it models discounted net value, not ' +
        'verified cash.',
    ) +
    heroExhibit(
      'Exhibit 6a — Net return: conservative, base and upside',
      scenarioRangeChart(
        s.scenarios.map((sc) => ({
          label: sc.label,
          value: sc.netReturn,
          tone: sc.tone,
        })),
      ),
    ) +
    tornadoBlock +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">What breaks the case</span>` +
    `<span>${esc(s.whatBreaksTheCase)}</span>` +
    `</div>` +
    detail(
      'Cash-flow shape — cumulative net value staged across the cost lanes',
      heroExhibit(
        'Cash-flow shape: cost lands before value unlocks',
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
        'The lines are cumulative discounted net value, not cash — they are ' +
          'staged across the build, change and run cost lanes.',
      ) +
        `<div class="payback-line">` +
        `<span class="payback-line-tag">Payback status</span>` +
        `<span>${esc(s.paybackNote)}</span>` +
        `</div>`,
    );
  return slide(s.anatomy, model.moveLabel, 7, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(model: MoveEstimateModel): string {
  const verdictWord = model.recommendation.toUpperCase();
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Estimate & Financial Model · Kernel-derived for a real Move',
    title: model.moveLabel,
    tenantLine: `${model.tenantLabel} · ${model.functionLabel}`,
    lede:
      'The board-grade Estimate & Financial Model produced by the Moves ' +
      'Expert Kernel for this Move. Every figure is the kernel’s — the ' +
      'effort estimate is a **planning range** on a researched benchmark ' +
      'rate card, NOT a quote; the value forecast rests on curated benchmark ' +
      'proxies; unrecorded inputs are named seed gaps; and the verdict is ' +
      'the kernel’s real recommendation, never invented.',
    meta: [
      { label: 'Recommendation', value: verdictWord },
      {
        label: 'Payback',
        value: model.paybackBlocked ? 'Blocked — seed gap' : 'See deck',
      },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: model.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated estimate.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Estimate & Financial Model',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Estimate & Financial Model — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Estimate & Financial Model · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No estimate or ' +
        'financial model is fabricated.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade estimate.',
    });

  const noteSlide = (): string =>
    slideShell({
      id: 'unbound',
      slideNo: 2,
      slideCount: 2,
      headerBrand: moveLabel,
      navLabel: 'No curated pack',
      sectionNo: 1,
      takeaway:
        'No curated Domain Function Pack covers this Move’s function — the ' +
        'kernel cannot produce a board-grade estimate.',
      hero:
        lede(
          'AbarVa’s board-grade Estimate & Financial Model is grounded in a ' +
            'curated Domain Function Pack — the pack supplies the AI use-case ' +
            'archetypes the effort estimate is scaled against, the value ' +
            'model, and the expected operating metrics. Without one, the ' +
            'kernel will not fabricate an estimate.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade estimate',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade estimate for this ` +
        `Move, it must resolve to a curated Function Pack — a known industry ` +
        `and a classified function. This is surfaced as a gap, not papered ` +
        `over with a fabricated financial model.</p>`,
      footer: [
        {
          key: 'So what',
          val:
            'The agent falls back to general reasoning for this Move — a ' +
            'known curated-depth gap.',
        },
        { key: 'Decision role', val: 'No funding decision is supported.' },
        { key: 'Owner', val: 'Curated Domain Function Pack coverage' },
        {
          key: 'Next gate',
          val: 'Extend Function-Pack coverage to this function.',
        },
      ],
    });

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Honest unbound state',
      render: () => coverSlideHtml(),
    },
    {
      id: 'unbound',
      navLabel: 'No curated pack',
      navPreview: 'Why this Move has no board-grade estimate',
      render: () => noteSlide(),
    },
  ];

  return renderDeckDocument(meta, slides);
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
.axis-stack {
  display: grid; gap: 8px; margin-bottom: 12px;
}
.axis-row {
  display: grid; grid-template-columns: 120px minmax(120px,1fr) 82px;
  gap: 10px; align-items: center;
}
.axis-label {
  font-size: 10.5px; font-weight: 800; color: #2c2a26;
}
.axis-track {
  height: 12px; border-radius: 4px; background: #ece7da; overflow: hidden;
}
.axis-fill {
  display: block; height: 100%; border-radius: 4px;
}
.axis-build { background: #0b4a91; }
.axis-change { background: #a8533a; }
.axis-ops { background: #7A4F01; }
.axis-value {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10.5px; font-weight: 800; color: #1c1a17; text-align: right;
}
.aiops-metrics {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 8px;
  margin: 10px 0;
}
.aiops-metrics div {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 9px 10px;
  background: #fff;
}
.aiops-metrics span {
  display: block; font-size: 9px; font-weight: 800; color: #8b8678;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
}
.aiops-metrics strong {
  display: block; font-size: 13px; color: #1c1a17;
}
.aiops-warning {
  display: grid; gap: 4px; border-radius: 5px; padding: 9px 10px;
  margin: 8px 0; font-size: 10.5px; line-height: 1.45;
}
.aiops-warning strong {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
}
.aiops-warning-amber {
  background: #fdf6e8; border: 1px solid #e6c884; color: #5f3b00;
}
.aiops-warning-red {
  background: #fff1ee; border: 1px solid #e0a091; color: #6c160a;
}
.aiops-table { margin-top: 10px; }
@media (max-width: 880px) {
  .aiops-metrics { grid-template-columns: repeat(2,1fr); }
  .axis-row { grid-template-columns: 1fr; }
  .axis-value { text-align: left; }
}
`;
}

// ===========================================================================
// Public entry — render the generic Move Estimate & Financial Model.
// ===========================================================================

/**
 * Render the generic Move Estimate & Financial Model as one self-contained
 * HTML document. Projects the deck from `buildMoveEstimateModel`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * estimate. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveEstimateModelHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveEstimateModelResult = buildMoveEstimateModel(
    move,
    generatedOn,
  );

  if (!result.bound) {
    return renderUnboundDocument(
      result.moveLabel,
      result.generatedOn,
      result.unboundReason,
    );
  }

  return renderBoundDocument(result);
}

/** Render the bound deck — the cover plus the six kernel-derived sections. */
function renderBoundDocument(model: MoveEstimateModel): string {
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
      sub: model.paybackBlocked
        ? 'Payback blocked — seed gap'
        : 'Kernel recommendation',
    },
    documentTitle: `${model.moveLabel} — Estimate & Financial Model — ${model.tenantLabel}`,
  };

  const renderers: Array<(m: MoveEstimateModel) => string> = [
    renderExecutiveSummary,
    renderBaselineInputs,
    renderWorkstreamEstimate,
    renderRateCard,
    renderValueForecast,
    renderSensitivity,
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
