// Board-grade Costed Business-Case Pack — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string: all CSS inlined in a single
// <style>, every exhibit an inline SVG, no external <script>, <link> or remote
// <img>. It opens offline and prints cleanly. The renderer is PURE — a
// deterministic function of the kernel-derived view-model.
//
// The visual register is the locked AbarVa design system: cream ground,
// near-black ink, one navy accent, a serif display face for headings and a
// clean sans for body. Each of the 11 sections is a "page" with a running
// header, a page number, and the §2 consulting-exhibit anatomy.

import {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type SectionAnatomy,
  type EvidenceStrip,
} from './pack-model';
import {
  investmentWaterfall,
  costStack,
  valueBridge,
  adoptionCurve,
  sensitivityTornado,
  paybackRangeCurve,
  roadmapSwimlane,
  riskHeatmap,
  economicsStrip,
  baselineImpact,
  compactUsd,
} from './svg-charts';

// ---------------------------------------------------------------------------
// Escaping — the renderer composes a document string, so every interpolated
// kernel string is escaped.
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Shared section scaffold — every page uses the §2 consulting anatomy.
// ---------------------------------------------------------------------------

function confidenceChip(c: EvidenceStrip['confidence']): string {
  const map: Record<EvidenceStrip['confidence'], [string, string]> = {
    high: ['Confidence · High', 'chip-good'],
    medium: ['Confidence · Medium', 'chip-warn'],
    low: ['Confidence · Low', 'chip-warn'],
    blocked: ['Confidence · Blocked', 'chip-bad'],
  };
  const [label, cls] = map[c];
  return `<span class="chip ${cls}">${esc(label)}</span>`;
}

/** The running header + takeaway title + decision-role line for a page. */
function pageHead(a: SectionAnatomy, pack: CostedBusinessCasePack): string {
  return (
    `<header class="page-head">` +
    `<div class="running">` +
    `<span class="running-brand">${esc(pack.tenantLabel)}</span>` +
    `<span class="running-sep">·</span>` +
    `<span>${esc(pack.moveLabel)}</span>` +
    `<span class="running-sep">·</span>` +
    `<span>${esc(pack.artifactLabel)}</span>` +
    `</div>` +
    `<div class="running-page">Page ${a.page} / 11</div>` +
    `</div>` +
    `<div class="eyebrow">${esc(a.navLabel)} · Section ${a.page}</div>` +
    `<h2 class="takeaway">${esc(a.takeaway)}</h2>` +
    `<div class="decision-role">` +
    `<span class="decision-role-tag">Decision role</span>` +
    `<span>${esc(a.decisionRole)}</span>` +
    `</div>` +
    `</header>`
  );
}

/** The evidence strip + implication + owner/gate footer for a page. */
function pageFoot(a: SectionAnatomy): string {
  const ev = a.evidence;
  const gaps =
    ev.gaps.length > 0
      ? ev.gaps.map((g) => `<li>${esc(g)}</li>`).join('')
      : '<li class="gap-clear">No open gaps for this exhibit.</li>';
  return (
    `<div class="evidence-strip">` +
    `<div class="evidence-col">` +
    `<div class="evidence-label">Sources</div>` +
    `<ul class="evidence-list">${ev.sources
      .map((s) => `<li>${esc(s)}</li>`)
      .join('')}</ul>` +
    `</div>` +
    `<div class="evidence-col">` +
    `<div class="evidence-label">Open gaps</div>` +
    `<ul class="evidence-list">${gaps}</ul>` +
    `</div>` +
    `<div class="evidence-col evidence-meta">` +
    `<div class="evidence-label">As of</div>` +
    `<div class="evidence-asof">${esc(ev.asOf)}</div>` +
    confidenceChip(ev.confidence) +
    `</div>` +
    `</div>` +
    `<div class="implication">` +
    `<div class="implication-mark">So what</div>` +
    `<p>${esc(a.implication)}</p>` +
    `</div>` +
    `<div class="owner-gate">` +
    `<div><span class="og-label">Owner</span> ${esc(a.owner)}</div>` +
    `<div><span class="og-label">Next gate</span> ${esc(a.nextGate)}</div>` +
    `</div>`
  );
}

/** Wrap a page's exhibit body + scaffold into a `<section class="page">`. */
function page(
  a: SectionAnatomy,
  pack: CostedBusinessCasePack,
  body: string,
): string {
  return (
    `<section class="page" id="${esc(a.id)}">` +
    pageHead(a, pack) +
    `<div class="page-body">${body}</div>` +
    pageFoot(a) +
    `</section>`
  );
}

/** A framed exhibit block — caption above, the SVG, an optional note below. */
function exhibit(caption: string, svg: string, note?: string): string {
  return (
    `<figure class="exhibit">` +
    `<figcaption class="exhibit-caption">${esc(caption)}</figcaption>` +
    `<div class="exhibit-frame">${svg}</div>` +
    (note ? `<p class="exhibit-note">${esc(note)}</p>` : '') +
    `</figure>`
  );
}

// ===========================================================================
// Page 1 — Board answer.
// ===========================================================================

function renderBoardAnswer(pack: CostedBusinessCasePack): string {
  const s = pack.sections.boardAnswer;
  const verdictClass =
    pack.verdict === 'fund'
      ? 'verdict-fund'
      : pack.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const body =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Board decision</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    exhibit(
      'Exhibit 1 — Headline economics at a glance',
      economicsStrip(s.economics),
    ) +
    `<div class="two-col">` +
    `<div class="callout callout-fund">` +
    `<div class="callout-head">Fund now</div>` +
    `<ul>${s.fundNow.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `</div>` +
    `<div class="callout callout-hold">` +
    `<div class="callout-head">Do not fund yet</div>` +
    `<ul>${s.doNotFundYet.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `</div>` +
    `</div>` +
    `<div class="blocker-bar">` +
    `<span class="blocker-tag">Blocker</span>` +
    `<span>${esc(s.blocker)}</span>` +
    `</div>` +
    `<div class="ask-bar">` +
    `<span class="ask-tag">Immediate ask</span>` +
    `<span>${esc(s.immediateAsk)}</span>` +
    `</div>`;

  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 2 — Why now.
// ===========================================================================

function renderWhyNow(pack: CostedBusinessCasePack): string {
  const s = pack.sections.whyNow;
  const body =
    `<div class="two-col narrative">` +
    `<div><div class="micro-label">Trigger</div><p>${esc(s.trigger)}</p></div>` +
    `<div><div class="micro-label">Pain</div><p>${esc(s.pain)}</p></div>` +
    `</div>` +
    exhibit(
      'Exhibit 2 — Current-state baseline against the Move target',
      baselineImpact(s.baselineBars),
      'Containment and CSAT are below target; handle time and utilisation ' +
        'are above it. Bars are drawn from recorded NICE CXone and Zendesk ' +
        'KPIs; no target is shown where the metric is a seed gap.',
    ) +
    `<div class="sponsor-line"><span class="micro-label">Sponsor</span> ${esc(
      s.sponsor,
    )}</div>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 3 — What we are funding.
// ===========================================================================

function renderWhatWeAreFunding(pack: CostedBusinessCasePack): string {
  const s = pack.sections.whatWeAreFunding;
  const bands: Array<{
    key: 'actors' | 'platform' | 'systems' | 'governance';
    label: string;
  }> = [
    { key: 'actors', label: 'Actors' },
    { key: 'platform', label: 'Funded build' },
    { key: 'systems', label: 'Systems of record' },
    { key: 'governance', label: 'Governance + Tower' },
  ];
  const diagram =
    `<div class="context-diagram">` +
    bands
      .map((b) => {
        const nodes = s.contextNodes.filter((n) => n.band === b.key);
        return (
          `<div class="context-band">` +
          `<div class="context-band-label">${esc(b.label)}</div>` +
          `<div class="context-nodes">` +
          nodes
            .map(
              (n) =>
                `<div class="context-node ${
                  n.isGap ? 'context-node-gap' : ''
                }">` +
                `<div class="context-node-title">${esc(n.label)}${
                  n.isGap ? ' <span class="gap-flag">gap</span>' : ''
                }</div>` +
                `<div class="context-node-detail">${esc(n.detail)}</div>` +
                `</div>`,
            )
            .join('') +
          `</div>` +
          `</div>`
        );
      })
      .join('') +
    `</div>`;

  const body =
    exhibit(
      'Exhibit 3 — Solution context: what sits inside the funded boundary',
      '',
    ).replace('<div class="exhibit-frame"></div>', diagram) +
    `<div class="three-col">` +
    scopeList('Included scope', 'scope-in', s.included) +
    scopeList('Excluded scope', 'scope-out', s.excluded) +
    scopeList(
      'Retained accountabilities',
      'scope-retain',
      s.retainedAccountabilities,
    ) +
    `</div>`;
  return page(s.anatomy, pack, body);
}

function scopeList(title: string, cls: string, items: string[]): string {
  return (
    `<div class="scope-col ${cls}">` +
    `<div class="scope-head">${esc(title)}</div>` +
    `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `</div>`
  );
}

// ===========================================================================
// Page 4 — Investment case.
// ===========================================================================

function renderInvestmentCase(pack: CostedBusinessCasePack): string {
  const s = pack.sections.investmentCase;
  const rows = s.workstreams
    .map(
      (w) =>
        `<tr>` +
        `<td>${esc(w.label)}</td>` +
        `<td class="num">${compactUsd(w.base)}</td>` +
        `<td class="num">${w.headcount}</td>` +
        `<td class="num">${w.durationMonths} mo</td>` +
        `<td class="num">${w.agentSplitPct}%</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    exhibit(
      'Exhibit 4a — Investment waterfall: where the $2.2M base goes',
      investmentWaterfall(s.waterfall),
    ) +
    exhibit(
      'Exhibit 4b — Cost stack: build, run and business-change split',
      costStack(s.costStack),
      s.buildVsChangeNote,
    ) +
    `<table class="data-table">` +
    `<thead><tr><th>Workstream</th><th class="num">Base cost</th>` +
    `<th class="num">Headcount</th><th class="num">Duration</th>` +
    `<th class="num">AI-agent split</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `<tfoot><tr><td>Total — base / range</td>` +
    `<td class="num">${compactUsd(s.investmentRange.point)}</td>` +
    `<td class="num" colspan="3">${compactUsd(
      s.investmentRange.low,
    )} – ${compactUsd(s.investmentRange.high)} (conservative)</td>` +
    `</tr></tfoot>` +
    `</table>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 5 — Value case.
// ===========================================================================

function renderValueCase(pack: CostedBusinessCasePack): string {
  const s = pack.sections.valueCase;
  const rows = s.factors
    .map(
      (f) =>
        `<tr>` +
        `<td>${esc(f.label)}</td>` +
        `<td class="num">${f.score.toFixed(2)}</td>` +
        `<td class="num">${f.weightPct}%</td>` +
        `<td class="num">${f.discountPct}%</td>` +
        `<td>${esc(f.rationale)}</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    exhibit(
      'Exhibit 5a — Gross-to-net value bridge: every haircut, in dollars',
      valueBridge(s.grossValue, s.bridgeSteps, s.netValue),
      `Gross 3-year value of ${compactUsd(
        s.grossValue,
      )} is discounted ${s.totalHaircutPct}% by the mandatory six-factor ` +
        `haircut model, landing at a net ${compactUsd(s.netValue)}.`,
    ) +
    exhibit(
      'Exhibit 5b — Adoption ramp: net value follows the adoption curve',
      adoptionCurve(s.adoption),
    ) +
    `<table class="data-table">` +
    `<thead><tr><th>Haircut factor</th><th class="num">Score</th>` +
    `<th class="num">Weight</th><th class="num">Discount</th>` +
    `<th>Why this score</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 6 — Payback and sensitivity.
// ===========================================================================

function renderPaybackSensitivity(pack: CostedBusinessCasePack): string {
  const s = pack.sections.paybackSensitivity;
  const scenarioRows = s.scenarios
    .map(
      (sc) =>
        `<tr>` +
        `<td><strong>${esc(sc.name)}</strong></td>` +
        `<td class="num">${compactUsd(sc.investment)}</td>` +
        `<td class="num">${compactUsd(sc.netValue)}</td>` +
        `<td class="num">${compactUsd(sc.netReturn)}</td>` +
        `<td class="num">${
          sc.paybackMonths === null
            ? '<span class="blocked-cell">Blocked — seed gap</span>'
            : `${sc.paybackMonths} mo`
        }</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    `<div class="payback-banner">` +
    `<span class="payback-banner-tag">Payback</span>` +
    `<span>Not computable — monetisation is blocked by the cost-per-contact ` +
    `seed gap. This pack shows no payback number rather than a fabricated ` +
    `one (blueprint §9 hard fail avoided).</span>` +
    `</div>` +
    exhibit(
      'Exhibit 6a — Sensitivity tornado: what moves the case most',
      sensitivityTornado(s.tornado),
      'Two of the three widest movers are seed-gap proxies (hatched) — ' +
        'validating them is the highest-leverage next step.',
    ) +
    exhibit(
      'Exhibit 6b — Cumulative cash-flow range: base, conservative, upside',
      paybackRangeCurve(s.cashFlow, s.cashFlowPeriods, s.paybackBlocked),
      'The lines accumulate modelled net value, not verified cash. Because ' +
        'monetisation is blocked, no line is a real payback curve — the ' +
        'crossing of break-even cannot be claimed until the seed gap closes.',
    ) +
    `<table class="data-table">` +
    `<thead><tr><th>Scenario</th><th class="num">Investment</th>` +
    `<th class="num">Net value (3-yr)</th><th class="num">Net return</th>` +
    `<th class="num">Payback</th></tr></thead>` +
    `<tbody>${scenarioRows}</tbody>` +
    `</table>` +
    `<div class="two-col">` +
    `<div class="callout callout-neutral">` +
    `<div class="callout-head">What breaks the case</div>` +
    `<p>${esc(s.whatBreaksTheCase)}</p>` +
    `</div>` +
    `<div class="callout callout-neutral">` +
    `<div class="callout-head">Downside read</div>` +
    `<p>${esc(s.downsideRead)}</p>` +
    `</div>` +
    `</div>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 7 — Roadmap.
// ===========================================================================

function renderRoadmap(pack: CostedBusinessCasePack): string {
  const s = pack.sections.roadmap;
  const gateRows = s.gates
    .map(
      (g) =>
        `<tr>` +
        `<td><strong>${esc(g.code)}</strong></td>` +
        `<td>${esc(g.name)}</td>` +
        `<td>${esc(g.decision)}</td>` +
        `<td class="num">${
          g.killable
            ? '<span class="chip chip-bad">Killable</span>'
            : '<span class="chip chip-good">Handoff</span>'
        }</td>` +
        `</tr>`,
    )
    .join('');

  const milestones = s.phases
    .map(
      (p) =>
        `<div class="milestone-row">` +
        `<div class="milestone-phase">${esc(p.label)}</div>` +
        `<div class="milestone-text">${esc(p.milestone)}</div>` +
        `</div>`,
    )
    .join('');

  const body =
    exhibit(
      `Exhibit 7 — Phased roadmap: ${s.totalMonths} months, four gates`,
      roadmapSwimlane(s.phases, s.totalMonths),
      'Phase 0 is foundational (no value). Every phase ends on a gate — ' +
        'three of the four are explicit kill points.',
    ) +
    `<div class="milestones">${milestones}</div>` +
    `<table class="data-table">` +
    `<thead><tr><th>Gate</th><th>Name</th><th>Decision at the gate</th>` +
    `<th class="num">Kill point</th></tr></thead>` +
    `<tbody>${gateRows}</tbody>` +
    `</table>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 8 — Risks and controls.
// ===========================================================================

function renderRisksControls(pack: CostedBusinessCasePack): string {
  const s = pack.sections.risksControls;
  const rows = s.risks
    .map(
      (r) =>
        `<tr>` +
        `<td><strong>${esc(r.code)}</strong></td>` +
        `<td>${esc(r.risk)}</td>` +
        `<td class="num">${esc(r.likelihood)}</td>` +
        `<td class="num">${esc(r.impact)}</td>` +
        `<td>${esc(r.control)}</td>` +
        `<td>${esc(r.owner)}</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    `<div class="heatmap-row">` +
    `<figure class="exhibit exhibit-inline">` +
    `<figcaption class="exhibit-caption">Exhibit 8 — Risk heatmap: ` +
    `likelihood × impact</figcaption>` +
    `<div class="exhibit-frame">${riskHeatmap(s.heatmap)}</div>` +
    `</figure>` +
    `<div class="heatmap-aside">` +
    `<div class="micro-label">Reading the grid</div>` +
    `<p>R1 (cost-per-contact baseline) and R2 (transcript privacy review) ` +
    `sit in the high-impact band — both gate the build, not the shaping ` +
    `spend. Every plotted risk has a named owner and a control.</p>` +
    `</div>` +
    `</div>` +
    `<table class="data-table">` +
    `<thead><tr><th>Risk</th><th>Description</th>` +
    `<th class="num">Likelihood</th><th class="num">Impact</th>` +
    `<th>Control / mitigation</th><th>Owner</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 9 — Assumption ledger.
// ===========================================================================

function renderAssumptionLedger(pack: CostedBusinessCasePack): string {
  const s = pack.sections.assumptionLedger;
  const rows = s.assumptions
    .map(
      (a) =>
        `<tr class="${a.isProxy ? 'row-proxy' : ''}">` +
        `<td class="num">${a.rank}</td>` +
        `<td>${esc(a.statement)}${
          a.isProxy
            ? ' <span class="chip chip-warn">Seed-gap proxy</span>'
            : ''
        }</td>` +
        `<td>${esc(a.owner)}</td>` +
        `<td class="num">${confChip(a.confidence)}</td>` +
        `<td class="num">${impactChip(a.sensitivity)}</td>` +
        `<td>${esc(a.source)}</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    `<table class="data-table data-table-ledger">` +
    `<thead><tr><th class="num">Rank</th><th>Assumption</th><th>Owner</th>` +
    `<th class="num">Confidence</th><th class="num">Sensitivity</th>` +
    `<th>Source</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>` +
    `<div class="ledger-note">` +
    `Assumptions are ranked by how much the case moves if they are wrong. ` +
    `The two highest-ranked are seed-gap proxies — they stand in for absent ` +
    `tenant data and are the evidence asks that gate funding.` +
    `</div>`;
  return page(s.anatomy, pack, body);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls = c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

function impactChip(c: 'high' | 'medium' | 'low'): string {
  const cls = c === 'high' ? 'chip-bad' : c === 'low' ? 'chip-good' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

// ===========================================================================
// Page 10 — Evidence appendix.
// ===========================================================================

function renderEvidenceAppendix(pack: CostedBusinessCasePack): string {
  const s = pack.sections.evidenceAppendix;
  const recordedRows = s.recorded
    .map(
      (m) =>
        `<tr>` +
        `<td>${esc(m.metric)}</td>` +
        `<td class="num">${esc(m.value)}</td>` +
        `<td>${esc(m.source)}</td>` +
        `<td class="num">${esc(m.asOf)}</td>` +
        `<td class="num">${confChip(m.confidence)}</td>` +
        `<td>${esc(m.caveat)}</td>` +
        `</tr>`,
    )
    .join('');
  const gapRows = s.seedGaps
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.metric)} <span class="chip chip-bad">Seed gap</span></td>` +
        `<td>${esc(g.reason)}</td>` +
        `<td>${esc(g.owner)}</td>` +
        `<td class="num">${esc(g.asOf)}</td>` +
        `<td>${esc(g.decisionImpact)}</td>` +
        `</tr>`,
    )
    .join('');

  const body =
    `<div class="micro-label">Recorded metrics — measured, sourced, dated</div>` +
    `<table class="data-table">` +
    `<thead><tr><th>Metric</th><th class="num">Value</th><th>Source</th>` +
    `<th class="num">As of</th><th class="num">Confidence</th>` +
    `<th>Caveat carried forward</th></tr></thead>` +
    `<tbody>${recordedRows}</tbody>` +
    `</table>` +
    `<div class="micro-label micro-label-gap">Seed gaps — declared, never ` +
    `blank, never invented</div>` +
    `<table class="data-table">` +
    `<thead><tr><th>Metric</th><th>Why it is missing</th><th>Owner</th>` +
    `<th class="num">As of</th><th>Decision impact</th></tr></thead>` +
    `<tbody>${gapRows}</tbody>` +
    `</table>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Page 11 — Recommendation and asks.
// ===========================================================================

function renderRecommendation(pack: CostedBusinessCasePack): string {
  const s = pack.sections.recommendation;
  const stateChip = (
    st: 'approve' | 'hold' | 'condition',
  ): string => {
    if (st === 'approve') return '<span class="chip chip-good">Approve now</span>';
    if (st === 'hold') return '<span class="chip chip-bad">Hold</span>';
    return '<span class="chip chip-warn">Condition</span>';
  };
  const checklist = s.checklist
    .map(
      (c) =>
        `<div class="check-row check-${c.state}">` +
        `<div class="check-mark">${stateChip(c.state)}</div>` +
        `<div class="check-body">` +
        `<div class="check-label">${esc(c.label)}</div>` +
        `<div class="check-detail">${esc(c.detail)}</div>` +
        `</div>` +
        `</div>`,
    )
    .join('');

  const body =
    `<div class="board-card verdict-shape">` +
    `<div class="board-card-tag">Recommendation</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `</div>` +
    `<div class="micro-label">Decision checklist — what is requested at this gate</div>` +
    `<div class="checklist">${checklist}</div>` +
    `<div class="two-col">` +
    `<div class="callout callout-neutral">` +
    `<div class="callout-head">Conditions before a build-funding decision</div>` +
    `<ul>${s.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` +
    `</div>` +
    `<div class="callout callout-neutral">` +
    `<div class="callout-head">Kill triggers — when to stop or re-shape</div>` +
    `<ul>${s.killTriggers
      .map((c) => `<li>${esc(c)}</li>`)
      .join('')}</ul>` +
    `</div>` +
    `</div>` +
    `<div class="ask-bar">` +
    `<span class="ask-tag">Requested spend</span>` +
    `<span>${esc(s.requestedSpend)}</span>` +
    `</div>` +
    `<div class="ask-bar">` +
    `<span class="ask-tag">Next gate</span>` +
    `<span>${esc(s.nextGate)}</span>` +
    `</div>`;
  return page(s.anatomy, pack, body);
}

// ===========================================================================
// Cover + table of contents.
// ===========================================================================

function renderCover(pack: CostedBusinessCasePack): string {
  return (
    `<section class="cover">` +
    `<div class="cover-brand">AbarVa · Moves</div>` +
    `<div class="cover-eyebrow">Costed Business-Case Pack · Board-grade reference artifact</div>` +
    `<h1 class="cover-title">${esc(pack.moveLabel)}</h1>` +
    `<div class="cover-tenant">${esc(pack.tenantLabel)} · ${esc(
      pack.tenantKey,
    )}</div>` +
    `<p class="cover-lede">A self-contained, 11-section board dossier. ` +
    `Every figure is produced by the Moves Expert Kernel from Apex's audited ` +
    `substrate. Where data is not recorded it is declared a seed gap — never ` +
    `invented. The honest verdict is <strong>shape</strong>: fund the next ` +
    `shaping gate, not the full build.</p>` +
    `<div class="cover-meta">` +
    `<div><span class="cover-meta-label">Verdict</span><span class="cover-meta-val">` +
    `${pack.verdict.toUpperCase()}</span></div>` +
    `<div><span class="cover-meta-label">Payback</span><span class="cover-meta-val">` +
    `Blocked — seed gap</span></div>` +
    `<div><span class="cover-meta-label">Generated</span><span class="cover-meta-val">` +
    `${esc(pack.generatedOn)}</span></div>` +
    `</div>` +
    `</section>`
  );
}

function renderToc(pack: CostedBusinessCasePack): string {
  const rows = pack.toc
    .map(
      (t) =>
        `<a class="toc-row" href="#${esc(t.id)}">` +
        `<span class="toc-num">${String(t.page).padStart(2, '0')}</span>` +
        `<span class="toc-label">${esc(t.label)}</span>` +
        `<span class="toc-takeaway">${esc(t.takeaway)}</span>` +
        `</a>`,
    )
    .join('');
  return (
    `<nav class="toc" id="contents" aria-label="Table of contents">` +
    `<div class="toc-head">Contents — 11 sections</div>` +
    `<div class="toc-list">${rows}</div>` +
    `</nav>`
  );
}

/** A compact sticky rail so an 11-section dossier stays navigable. */
function renderStickyRail(pack: CostedBusinessCasePack): string {
  const links = pack.toc
    .map(
      (t) =>
        `<a class="rail-link" href="#${esc(t.id)}">` +
        `<span class="rail-num">${String(t.page).padStart(2, '0')}</span>` +
        `<span>${esc(t.label)}</span>` +
        `</a>`,
    )
    .join('');
  return (
    `<aside class="rail" aria-label="Section navigation">` +
    `<a class="rail-link rail-link-top" href="#contents">` +
    `<span class="rail-num">·</span><span>Contents</span></a>` +
    links +
    `</aside>`
  );
}

// ===========================================================================
// The full document.
// ===========================================================================

/** Inlined stylesheet — the locked AbarVa register, print-ready. */
function styles(): string {
  return `
@media print { @page { size: A4; margin: 14mm; } }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: #e7e3da;
  color: #070707;
  font-family: "DM Sans","Inter",system-ui,-apple-system,sans-serif;
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.doc { max-width: 1180px; margin: 0 auto; padding: 32px 24px 64px; }
.layout { display: grid; grid-template-columns: 188px minmax(0,1fr); gap: 28px; }
h1, h2, h3 {
  font-family: "Newsreader","Cormorant Garamond","Georgia",serif;
  font-weight: 500; letter-spacing: -0.01em; margin: 0;
}

/* --- Sticky rail --- */
.rail {
  position: sticky; top: 24px; align-self: start;
  display: flex; flex-direction: column; gap: 1px;
  font-size: 11px;
}
.rail-link {
  display: flex; align-items: baseline; gap: 8px;
  padding: 7px 9px; color: #5b5852; text-decoration: none;
  border-left: 2px solid transparent; line-height: 1.25;
}
.rail-link:hover { color: #0b4a91; border-left-color: #0b4a91; background: #f3f0e9; }
.rail-link-top { font-weight: 800; color: #070707; }
.rail-num {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; color: #b4ae9f; min-width: 14px;
}

/* --- Cover --- */
.cover {
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 6px;
  padding: 56px 52px; margin-bottom: 18px;
}
.cover-brand {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; letter-spacing: 0.22em;
  text-transform: uppercase; color: #0b4a91;
}
.cover-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #5b5852; margin-top: 18px;
}
.cover-title {
  font-size: 52px; line-height: 1.04; margin: 10px 0 14px; max-width: 760px;
}
.cover-tenant {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 12px; font-weight: 700; color: #070707;
}
.cover-lede {
  max-width: 640px; margin: 22px 0 30px; font-size: 15px;
  color: #2c2a26; line-height: 1.62;
}
.cover-meta { display: flex; gap: 40px; border-top: 1px solid #d8d3c6; padding-top: 20px; }
.cover-meta-label {
  display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8b8678;
}
.cover-meta-val {
  display: block; font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 16px; font-weight: 800; margin-top: 4px;
}

/* --- TOC --- */
.toc {
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 6px;
  padding: 28px 32px; margin-bottom: 18px;
}
.toc-head {
  font-family: "Newsreader","Georgia",serif; font-size: 22px;
  margin-bottom: 14px;
}
.toc-list { display: flex; flex-direction: column; }
.toc-row {
  display: grid; grid-template-columns: 38px 168px 1fr; gap: 14px;
  align-items: baseline; padding: 11px 0; border-top: 1px solid #e6e1d5;
  color: #070707; text-decoration: none;
}
.toc-row:hover { background: #f3f0e9; }
.toc-num {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 13px; font-weight: 800; color: #0b4a91;
}
.toc-label { font-weight: 800; font-size: 13px; }
.toc-takeaway { font-size: 12px; color: #5b5852; line-height: 1.45; }

/* --- Page --- */
.page {
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 6px;
  padding: 36px 40px 30px; margin-bottom: 18px;
}
.page-head { margin-bottom: 18px; }
.running {
  display: flex; gap: 7px; align-items: baseline;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: #8b8678;
}
.running { justify-content: flex-start; }
.page-head .running, .page-head .running-page { }
.page-head { position: relative; }
.running-page {
  position: absolute; top: 0; right: 0;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9.5px; font-weight: 700; color: #8b8678;
}
.running-brand { font-weight: 800; color: #0b4a91; }
.running-sep { color: #c9c3b3; }
.eyebrow {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.09em;
  text-transform: uppercase; color: #0b4a91; margin: 14px 0 8px;
}
.takeaway {
  font-size: 27px; line-height: 1.2; max-width: 880px;
  margin-bottom: 12px;
}
.decision-role {
  display: flex; gap: 10px; align-items: baseline;
  font-size: 12.5px; color: #2c2a26; padding-bottom: 14px;
  border-bottom: 2px solid #070707;
}
.decision-role-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; color: #8b8678; white-space: nowrap;
}
.page-body { padding: 18px 0 4px; }

/* --- Exhibits --- */
.exhibit { margin: 0 0 22px; }
.exhibit-caption {
  font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; color: #070707; margin-bottom: 8px;
}
.exhibit-frame {
  background: #ffffff; border: 1px solid #e0dbcd; border-radius: 4px;
  padding: 14px 16px;
}
.exhibit-note {
  font-size: 11.5px; color: #5b5852; line-height: 1.5;
  margin: 8px 2px 0; max-width: 760px;
}
.exhibit-inline { margin: 0; }

/* --- Evidence strip + implication + owner --- */
.evidence-strip {
  display: grid; grid-template-columns: 1fr 1fr 150px; gap: 20px;
  background: #f3f0e9; border-radius: 4px; padding: 14px 18px;
  margin-top: 6px;
}
.evidence-label {
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8b8678; margin-bottom: 5px;
}
.evidence-list { margin: 0; padding-left: 15px; }
.evidence-list li { font-size: 11px; line-height: 1.5; color: #2c2a26; }
.evidence-list .gap-clear { color: #1B5E20; list-style: none; margin-left: -15px; }
.evidence-meta { text-align: left; }
.evidence-asof {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 13px; font-weight: 800; margin-bottom: 8px;
}
.implication {
  display: flex; gap: 14px; align-items: flex-start;
  border-left: 3px solid #0b4a91; padding: 12px 16px;
  margin-top: 14px; background: #fff;
}
.implication-mark {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; color: #0b4a91; white-space: nowrap;
  padding-top: 2px;
}
.implication p { margin: 0; font-size: 13px; color: #1c1a17; }
.owner-gate {
  display: flex; gap: 36px; margin-top: 12px;
  font-size: 12px; color: #2c2a26;
}
.og-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #8b8678; margin-right: 5px;
}

/* --- Chips --- */
.chip {
  display: inline-block; font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 800; letter-spacing: 0.03em;
  text-transform: uppercase; padding: 3px 7px; border-radius: 999px;
  border: 1px solid;
}
.chip-good { background: #e2efe2; color: #1B5E20; border-color: #1B5E20; }
.chip-warn { background: #f7ecd6; color: #7A4F01; border-color: #7A4F01; }
.chip-bad { background: #f4ddd6; color: #8B1F0F; border-color: #8B1F0F; }

/* --- Board card --- */
.board-card {
  border-radius: 5px; padding: 22px 24px; margin-bottom: 22px;
  border: 1px solid;
}
.verdict-shape { background: #f7ecd6; border-color: #7A4F01; }
.verdict-fund { background: #e2efe2; border-color: #1B5E20; }
.verdict-kill { background: #f4ddd6; border-color: #8B1F0F; }
.board-card-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #7A4F01; margin-bottom: 8px;
}
.verdict-fund .board-card-tag { color: #1B5E20; }
.verdict-kill .board-card-tag { color: #8B1F0F; }
.board-verdict {
  font-family: "Newsreader","Georgia",serif; font-size: 24px;
  line-height: 1.25; color: #070707;
}
.board-detail { margin: 10px 0 0; font-size: 13px; color: #2c2a26; }

/* --- Callouts --- */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 4px 0 18px; }
.three-col { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin: 6px 0 8px; }
.callout {
  border: 1px solid #e0dbcd; border-radius: 4px; padding: 14px 16px;
  background: #fff;
}
.callout-head {
  font-size: 11px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.callout ul { margin: 0; padding-left: 17px; }
.callout li { font-size: 12px; line-height: 1.5; margin-bottom: 5px; }
.callout p { margin: 0; font-size: 12.5px; color: #2c2a26; }
.callout-fund { border-left: 3px solid #1B5E20; }
.callout-fund .callout-head { color: #1B5E20; }
.callout-hold { border-left: 3px solid #8B1F0F; }
.callout-hold .callout-head { color: #8B1F0F; }
.callout-neutral { border-left: 3px solid #0b4a91; }
.callout-neutral .callout-head { color: #0b4a91; }

/* --- Bars --- */
.blocker-bar, .ask-bar, .payback-banner {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 12px 16px; border-radius: 4px; font-size: 12.5px;
  margin-bottom: 10px; line-height: 1.5;
}
.blocker-bar { background: #f4ddd6; color: #2c2a26; }
.ask-bar { background: #e8f0fa; color: #2c2a26; }
.payback-banner { background: #f7ecd6; color: #2c2a26; margin: 0 0 16px; }
.blocker-tag, .ask-tag, .payback-banner-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; white-space: nowrap; padding-top: 2px;
}
.blocker-tag { color: #8B1F0F; }
.ask-tag { color: #0b4a91; }
.payback-banner-tag { color: #7A4F01; }

/* --- Narrative --- */
.narrative p { margin: 0; font-size: 13px; color: #2c2a26; line-height: 1.62; }
.micro-label {
  font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #0b4a91; margin-bottom: 6px;
}
.micro-label-gap { color: #8B1F0F; margin-top: 18px; }
.sponsor-line { font-size: 12px; color: #2c2a26; margin-top: 4px; }
.sponsor-line .micro-label { display: inline; margin-right: 8px; }

/* --- Tables --- */
.data-table {
  width: 100%; border-collapse: collapse; margin: 6px 0 14px;
  background: #fff; border: 1px solid #e0dbcd; font-size: 12px;
}
.data-table th {
  text-align: left; background: #070707; color: #fbfaf7;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 9px 11px;
}
.data-table td {
  padding: 9px 11px; border-top: 1px solid #ece7da;
  vertical-align: top; line-height: 1.45;
}
.data-table tbody tr:nth-child(even) { background: #f7f5ef; }
.data-table .num { text-align: right; white-space: nowrap;
  font-family: "JetBrains Mono",ui-monospace,monospace; }
.data-table th.num { text-align: right; }
.data-table tfoot td {
  background: #ece7da; font-weight: 800; border-top: 2px solid #070707;
}
.data-table-ledger td:nth-child(2) { width: 38%; }
.row-proxy { background: #fdf6e8 !important; }
.blocked-cell { color: #8B1F0F; font-weight: 800; }

/* --- Context diagram --- */
.context-diagram { display: flex; flex-direction: column; gap: 9px; }
.context-band {
  display: grid; grid-template-columns: 120px 1fr; gap: 12px;
  align-items: center;
}
.context-band-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #8b8678; text-align: right;
}
.context-nodes { display: flex; gap: 8px; flex-wrap: wrap; }
.context-node {
  flex: 1; min-width: 150px; background: #fff;
  border: 1px solid #cfc9b9; border-radius: 4px; padding: 9px 11px;
}
.context-node-gap { background: #f7ecd6; border-color: #7A4F01; }
.context-node-title { font-size: 12px; font-weight: 800; }
.context-node-detail { font-size: 10.5px; color: #5b5852; margin-top: 3px;
  line-height: 1.42; }
.gap-flag {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 8px; font-weight: 800; color: #7A4F01;
  background: #fff; border: 1px solid #7A4F01; border-radius: 999px;
  padding: 1px 5px; text-transform: uppercase;
}

/* --- Scope columns --- */
.scope-col {
  border: 1px solid #e0dbcd; border-radius: 4px; padding: 13px 15px;
  background: #fff;
}
.scope-head {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.scope-col ul { margin: 0; padding-left: 16px; }
.scope-col li { font-size: 11.5px; line-height: 1.5; margin-bottom: 6px; }
.scope-in { border-left: 3px solid #1B5E20; }
.scope-in .scope-head { color: #1B5E20; }
.scope-out { border-left: 3px solid #8B1F0F; }
.scope-out .scope-head { color: #8B1F0F; }
.scope-retain { border-left: 3px solid #0b4a91; }
.scope-retain .scope-head { color: #0b4a91; }

/* --- Roadmap milestones --- */
.milestones { margin: 4px 0 14px; }
.milestone-row {
  display: grid; grid-template-columns: 230px 1fr; gap: 16px;
  padding: 8px 0; border-top: 1px solid #ece7da; font-size: 12px;
}
.milestone-phase { font-weight: 800; color: #070707; }
.milestone-text { color: #2c2a26; line-height: 1.5; }

/* --- Heatmap row --- */
.heatmap-row { display: grid; grid-template-columns: 420px 1fr; gap: 22px;
  align-items: center; margin-bottom: 18px; }
.heatmap-aside p { font-size: 12.5px; color: #2c2a26; line-height: 1.6; margin: 0; }

/* --- Checklist --- */
.checklist { display: flex; flex-direction: column; gap: 8px; margin: 6px 0 16px; }
.check-row {
  display: grid; grid-template-columns: 120px 1fr; gap: 16px;
  border: 1px solid #e0dbcd; border-radius: 4px; padding: 12px 15px;
  background: #fff; align-items: start;
}
.check-approve { border-left: 3px solid #1B5E20; }
.check-hold { border-left: 3px solid #8B1F0F; }
.check-condition { border-left: 3px solid #7A4F01; }
.check-label { font-weight: 800; font-size: 13px; }
.check-detail { font-size: 11.5px; color: #5b5852; margin-top: 3px;
  line-height: 1.5; }

/* --- Ledger note --- */
.ledger-note {
  font-size: 12px; color: #2c2a26; background: #f3f0e9;
  border-radius: 4px; padding: 12px 16px; line-height: 1.55;
}

/* --- Footer --- */
.doc-footer {
  font-size: 10.5px; color: #8b8678; line-height: 1.6;
  text-align: center; padding: 24px 40px 0; max-width: 740px;
  margin: 0 auto;
}

@media (max-width: 940px) {
  .layout { grid-template-columns: 1fr; }
  .rail { display: none; }
  .two-col, .three-col, .heatmap-row, .check-row,
  .evidence-strip, .context-band, .milestone-row { grid-template-columns: 1fr; }
}
`;
}

/**
 * Render the Apex Costed Business-Case Pack as one self-contained HTML
 * document. Deterministic — a pure function of `generatedOn`.
 */
export function renderApexCostedBusinessCaseHtml(generatedOn: string): string {
  const pack = buildApexCostedBusinessCasePack(generatedOn);
  const pages = [
    renderBoardAnswer(pack),
    renderWhyNow(pack),
    renderWhatWeAreFunding(pack),
    renderInvestmentCase(pack),
    renderValueCase(pack),
    renderPaybackSensitivity(pack),
    renderRoadmap(pack),
    renderRisksControls(pack),
    renderAssumptionLedger(pack),
    renderEvidenceAppendix(pack),
    renderRecommendation(pack),
  ].join('');

  const footer =
    `<footer class="doc-footer">` +
    `Every figure in this dossier is produced by the Moves Expert Kernel ` +
    `from Apex Retail's audited substrate. Absent data is declared a seed ` +
    `gap, never invented. The verdict is <strong>shape</strong> and payback ` +
    `is shown as blocked because the cost-per-contact baseline is a declared ` +
    `seed gap — this artifact reports the honest result, not a flattering ` +
    `one. Effort rests on a researched planning rate card — a market range, ` +
    `not a quote. Generated by AbarVa · Moves on ${esc(generatedOn)}.` +
    `</footer>`;

  return (
    `<!doctype html><html lang="en"><head>` +
    `<meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
    `<title>${esc(pack.moveLabel)} — Costed Business-Case Pack — ${esc(
      pack.tenantLabel,
    )}</title>` +
    `<style>${styles()}</style>` +
    `</head><body>` +
    `<div class="doc">` +
    renderCover(pack) +
    renderToc(pack) +
    `<div class="layout">` +
    renderStickyRail(pack) +
    `<main>${pages}</main>` +
    `</div>` +
    footer +
    `</div>` +
    `</body></html>`
  );
}
