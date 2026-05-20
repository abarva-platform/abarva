// Board-grade Costed Business-Case Pack — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK:
// a persistent left menu rail and a right content stage. Selecting a menu
// item swaps the slide shown on the stage — the reader flips slides, they do
// not scroll an 11-section dossier. The slide switch is driven by a small
// INLINE <script> (no external src). All CSS is inlined, every exhibit is an
// inline SVG, there are no remote fonts or images — the file opens offline.
//
// For print / PDF an `@media print` block expands every slide stacked
// vertically, one page each, so the file still exports as the full document.
//
// The visual register is the locked AbarVa design system: cream ground,
// near-black ink, one navy accent, a serif display face for headings and a
// clean sans for body. Each slide is ONE composed idea — a takeaway headline,
// a single hero exhibit, two to four lines of prose, and a quiet footer.
// The renderer is PURE — a deterministic function of the kernel view-model.

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

// The deck has a fixed number of stage slides — the cover plus the 11
// blueprint sections.
const SLIDE_COUNT = 12;

// ---------------------------------------------------------------------------
// Slide scaffold — every section slide shares the same calm chrome: a slim
// header, the takeaway headline, ONE hero exhibit, minimal prose, and a quiet
// single-line footer. The dense evidence/owner detail collapses into the
// footer strip rather than stacking as blocks.
// ---------------------------------------------------------------------------

function confidenceLabel(c: EvidenceStrip['confidence']): string {
  const map: Record<EvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The slim running header for a section slide. */
function slideHeader(
  a: SectionAnatomy,
  pack: CostedBusinessCasePack,
  slideNo: number,
): string {
  return (
    `<div class="slide-rule">` +
    `<div class="slide-rule-l">` +
    `<span class="slide-brand">${esc(pack.moveLabel)}</span>` +
    `<span class="slide-sep">·</span>` +
    `<span>${esc(a.navLabel)}</span>` +
    `</div>` +
    `<div class="slide-rule-r">Slide ${slideNo} / ${SLIDE_COUNT}</div>` +
    `</div>`
  );
}

/** The takeaway headline — the slide's single point of view. */
function slideHeadline(a: SectionAnatomy): string {
  return (
    `<div class="slide-eyebrow">Section ${a.page} · ${esc(a.navLabel)}</div>` +
    `<h2 class="slide-headline">${esc(a.takeaway)}</h2>`
  );
}

/**
 * The quiet footer strip — the decision-role / evidence / implication / owner
 * facts compressed into one thin row rather than four stacked blocks.
 */
function slideFooter(a: SectionAnatomy): string {
  const ev = a.evidence;
  const srcCount = ev.sources.length;
  const gapText =
    ev.gaps.length > 0
      ? `${ev.gaps.length} open ${ev.gaps.length === 1 ? 'gap' : 'gaps'}`
      : 'No open gaps';
  return (
    `<div class="slide-foot">` +
    `<div class="foot-cell foot-implication">` +
    `<span class="foot-key">So what</span>` +
    `<span class="foot-val">${esc(a.implication)}</span>` +
    `</div>` +
    `<div class="foot-cell">` +
    `<span class="foot-key">Decision role</span>` +
    `<span class="foot-val">${esc(a.decisionRole)}</span>` +
    `</div>` +
    `<div class="foot-cell">` +
    `<span class="foot-key">Owner</span>` +
    `<span class="foot-val">${esc(a.owner)}</span>` +
    `</div>` +
    `<div class="foot-cell">` +
    `<span class="foot-key">Evidence</span>` +
    `<span class="foot-val">${srcCount} ${
      srcCount === 1 ? 'source' : 'sources'
    } · as of ${esc(ev.asOf)} · confidence ${esc(
      confidenceLabel(ev.confidence),
    )} · ${esc(gapText)}</span>` +
    `</div>` +
    `<div class="foot-cell">` +
    `<span class="foot-key">Next gate</span>` +
    `<span class="foot-val">${esc(a.nextGate)}</span>` +
    `</div>` +
    `</div>`
  );
}

/**
 * Wrap a section's hero body into a `<section class="slide">`. Slides other
 * than the first carry `data-slide` and are hidden until selected; the inline
 * script reveals exactly one at a time.
 */
function slide(
  a: SectionAnatomy,
  pack: CostedBusinessCasePack,
  slideNo: number,
  hero: string,
): string {
  return (
    `<section class="slide" id="${esc(a.id)}" data-slide="${slideNo}" ` +
    `aria-label="${esc(a.navLabel)}">` +
    `<div class="slide-inner">` +
    slideHeader(a, pack, slideNo) +
    slideHeadline(a) +
    `<div class="slide-stage">${hero}</div>` +
    slideFooter(a) +
    `</div>` +
    `</section>`
  );
}

/** A framed hero exhibit — caption above, the SVG, an optional note below. */
function heroExhibit(caption: string, svg: string, note?: string): string {
  return (
    `<figure class="hero">` +
    `<figcaption class="hero-caption">${esc(caption)}</figcaption>` +
    `<div class="hero-frame">${svg}</div>` +
    (note ? `<p class="hero-note">${esc(note)}</p>` : '') +
    `</figure>`
  );
}

/** A short lede — 2 to 4 lines of supporting prose above the hero. */
function lede(text: string): string {
  return `<p class="slide-lede">${esc(text)}</p>`;
}

// ===========================================================================
// Slide 1 — Board answer.
// ===========================================================================

function renderBoardAnswer(pack: CostedBusinessCasePack): string {
  const s = pack.sections.boardAnswer;
  const verdictClass =
    pack.verdict === 'fund'
      ? 'verdict-fund'
      : pack.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Board decision</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Headline economics at a glance',
      economicsStrip(s.economics),
    ) +
    `<div class="answer-split">` +
    `<div class="answer-col answer-fund">` +
    `<div class="answer-head">Fund now</div>` +
    `<ul>${s.fundNow.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `</div>` +
    `<div class="answer-col answer-hold">` +
    `<div class="answer-head">Do not fund yet</div>` +
    `<ul>${s.doNotFundYet.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `</div>` +
    `</div>` +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Immediate ask</span>` +
    `<span>${esc(s.immediateAsk)}</span>` +
    `</div>`;

  return slide(s.anatomy, pack, 2, hero);
}

// ===========================================================================
// Slide 2 — Why now.
// ===========================================================================

function renderWhyNow(pack: CostedBusinessCasePack): string {
  const s = pack.sections.whyNow;
  const hero =
    lede(
      `Containment is plateaued and agents run hot. ${s.trigger.split('. ')[0]}. ` +
        `Repeat transfers and CSAT both read as mis-routing — the problem is ` +
        `now capacity-bound, not a tooling preference.`,
    ) +
    heroExhibit(
      'Exhibit 2 — Current-state baseline against the Move target',
      baselineImpact(s.baselineBars),
      'Bars are recorded NICE CXone and Zendesk KPIs; no target is shown ' +
        'where the metric is a declared seed gap.',
    );
  return slide(s.anatomy, pack, 3, hero);
}

// ===========================================================================
// Slide 3 — What we are funding.
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

  const hero =
    lede(
      'We are funding an agent-assist routing layer over NICE CXone — not ' +
        'an IVR replacement, and not autonomous customer-facing inference. ' +
        'The boundary below is what sits inside the funded scope.',
    ) +
    heroExhibit(
      'Exhibit 3 — Solution context: what sits inside the funded boundary',
      '',
    ).replace('<div class="hero-frame"></div>', `<div class="hero-frame">${diagram}</div>`) +
    `<div class="scope-triplet">` +
    scopeList('In scope', 'scope-in', s.included) +
    scopeList('Excluded', 'scope-out', s.excluded) +
    scopeList('Retained accountabilities', 'scope-retain', s.retainedAccountabilities) +
    `</div>`;
  return slide(s.anatomy, pack, 4, hero);
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
// Slide 4 — Investment case.
// ===========================================================================

function renderInvestmentCase(pack: CostedBusinessCasePack): string {
  const s = pack.sections.investmentCase;

  // ONE hero — the waterfall. The cost-stack split and the per-workstream
  // table are dense; they collapse into a quiet, expandable detail strip so
  // the slide reads as a single idea.
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

  const hero =
    lede(
      `The build is a ${compactUsd(s.investmentRange.point)} base bet — ` +
        `range ${compactUsd(s.investmentRange.low)} to ${compactUsd(
          s.investmentRange.high,
        )}. The waterfall shows where the money goes; the change lane is the ` +
        `execution risk to protect, not trim.`,
    ) +
    heroExhibit(
      `Exhibit 4 — Investment waterfall: where the ${compactUsd(
        s.investmentRange.point,
      )} base goes`,
      investmentWaterfall(s.waterfall),
    ) +
    detail(
      'Cost stack and the eight-workstream breakdown',
      heroExhibit(
        'Cost stack — build, run and business-change split',
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
        `</table>`,
    );
  return slide(s.anatomy, pack, 5, hero);
}

// ===========================================================================
// Slide 5 — Value case.
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

  const hero =
    lede(
      `Gross 3-year value of ${compactUsd(s.grossValue)} is discounted ` +
        `${s.totalHaircutPct}% by the mandatory six-factor haircut, landing ` +
        `at a net ${compactUsd(s.netValue)}. Adoption and data readiness ` +
        `take the two largest cuts.`,
    ) +
    heroExhibit(
      'Exhibit 5 — Gross-to-net value bridge: every haircut, in dollars',
      valueBridge(s.grossValue, s.bridgeSteps, s.netValue),
    ) +
    detail(
      'Adoption ramp and the six-factor haircut detail',
      heroExhibit(
        'Adoption ramp — net value follows the adoption curve',
        adoptionCurve(s.adoption),
      ) +
        `<table class="data-table">` +
        `<thead><tr><th>Haircut factor</th><th class="num">Score</th>` +
        `<th class="num">Weight</th><th class="num">Discount</th>` +
        `<th>Why this score</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 6, hero);
}

// ===========================================================================
// Slide 6 — Payback and sensitivity.
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

  const hero =
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Payback</span>` +
    `<span>Not computable — monetisation is blocked by the cost-per-contact ` +
    `seed gap. This pack shows no payback number rather than a fabricated ` +
    `one.</span>` +
    `</div>` +
    heroExhibit(
      'Exhibit 6 — Sensitivity tornado: what moves the case most',
      sensitivityTornado(s.tornado),
      'Two of the three widest movers are seed-gap proxies (hatched) — ' +
        'validating them is the highest-leverage next step.',
    ) +
    detail(
      'Three-scenario range and the cumulative cash-flow read',
      heroExhibit(
        'Cumulative cash-flow range — base, conservative, upside',
        paybackRangeCurve(s.cashFlow, s.cashFlowPeriods, s.paybackBlocked),
        'The lines accumulate modelled net value, not verified cash — no ' +
          'line is a real payback curve until the seed gap closes.',
      ) +
        `<table class="data-table">` +
        `<thead><tr><th>Scenario</th><th class="num">Investment</th>` +
        `<th class="num">Net value (3-yr)</th><th class="num">Net return</th>` +
        `<th class="num">Payback</th></tr></thead>` +
        `<tbody>${scenarioRows}</tbody>` +
        `</table>` +
        `<div class="mini-split">` +
        `<div><span class="mini-key">What breaks the case</span>` +
        `<p>${esc(s.whatBreaksTheCase)}</p></div>` +
        `<div><span class="mini-key">Downside read</span>` +
        `<p>${esc(s.downsideRead)}</p></div>` +
        `</div>`,
    );
  return slide(s.anatomy, pack, 7, hero);
}

// ===========================================================================
// Slide 7 — Roadmap.
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

  const hero =
    lede(
      `${s.totalMonths} months across four phases, each ending on a gate. ` +
        'Phase 0 is foundational and unlocks no value; Phase 1 is the first ' +
        'place value is verifiable — and the first place the board can stop.',
    ) +
    heroExhibit(
      `Exhibit 7 — Phased roadmap: ${s.totalMonths} months, four gates`,
      roadmapSwimlane(s.phases, s.totalMonths),
      'Three of the four gates are explicit kill points.',
    ) +
    detail(
      'Gate decisions — what is decided at each of the four gates',
      `<table class="data-table">` +
        `<thead><tr><th>Gate</th><th>Name</th><th>Decision at the gate</th>` +
        `<th class="num">Kill point</th></tr></thead>` +
        `<tbody>${gateRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 8, hero);
}

// ===========================================================================
// Slide 8 — Risks and controls.
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

  const hero =
    lede(
      'The monetisation seed gap (R1) and the transcript-privacy review ' +
        '(R2) are the two risks that can block approval. Both sit in the ' +
        'high-impact band, both have a named owner and a dated control.',
    ) +
    heroExhibit(
      'Exhibit 8 — Risk heatmap: likelihood × impact',
      riskHeatmap(s.heatmap),
      'Every plotted risk has a named owner and a control; the two ' +
        'high-impact risks gate the build, not the shaping spend.',
    ) +
    detail(
      'Risk register — all six risks, controls and owners',
      `<table class="data-table">` +
        `<thead><tr><th>Risk</th><th>Description</th>` +
        `<th class="num">Likelihood</th><th class="num">Impact</th>` +
        `<th>Control / mitigation</th><th>Owner</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 9, hero);
}

// ===========================================================================
// Slide 9 — Assumption ledger.
// ===========================================================================

function renderAssumptionLedger(pack: CostedBusinessCasePack): string {
  const s = pack.sections.assumptionLedger;

  // The hero is the three top-ranked, case-moving assumptions as cards — the
  // dense full ledger collapses into the detail strip.
  const topCards = s.assumptions
    .slice(0, 3)
    .map(
      (a) =>
        `<div class="assume-card ${a.isProxy ? 'assume-proxy' : ''}">` +
        `<div class="assume-rank">#${a.rank}</div>` +
        `<div class="assume-body">` +
        `<div class="assume-statement">${esc(a.statement)}${
          a.isProxy
            ? ' <span class="chip chip-warn">Seed-gap proxy</span>'
            : ''
        }</div>` +
        `<div class="assume-meta">` +
        `<span>${esc(a.owner)}</span>` +
        `<span class="assume-dot">·</span>` +
        `<span>Confidence ${confChip(a.confidence)}</span>` +
        `<span class="assume-dot">·</span>` +
        `<span>Sensitivity ${impactChip(a.sensitivity)}</span>` +
        `</div>` +
        `</div>` +
        `</div>`,
    )
    .join('');

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

  const hero =
    lede(
      'Assumptions are ranked by how much the case moves if they are wrong. ' +
        'The two highest-ranked are seed-gap proxies — they stand in for ' +
        'absent tenant data and are the evidence asks that gate funding.',
    ) +
    `<figure class="hero">` +
    `<figcaption class="hero-caption">Exhibit 9 — The three ` +
    `case-moving assumptions</figcaption>` +
    `<div class="assume-cards">${topCards}</div>` +
    `</figure>` +
    detail(
      `Full assumption ledger — all ${s.assumptions.length} ranked entries`,
      `<table class="data-table data-table-ledger">` +
        `<thead><tr><th class="num">Rank</th><th>Assumption</th><th>Owner</th>` +
        `<th class="num">Confidence</th><th class="num">Sensitivity</th>` +
        `<th>Source</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 10, hero);
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
// Slide 10 — Evidence appendix.
// ===========================================================================

function renderEvidenceAppendix(pack: CostedBusinessCasePack): string {
  const s = pack.sections.evidenceAppendix;
  const recordedCount = s.recorded.length;
  const gapCount = s.seedGaps.length;

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

  // The hero is a single coverage statement — two recorded-vs-gap tiles. The
  // two full audit tables collapse into the detail strip.
  const total = recordedCount + gapCount;
  const coveragePct = total > 0 ? Math.round((recordedCount / total) * 100) : 0;
  const hero =
    lede(
      `Baseline coverage is ${coveragePct}% — ${recordedCount} metrics are ` +
        `measured, sourced and dated; ${gapCount} are declared seed gaps. ` +
        'None are invented. The case is auditable end to end.',
    ) +
    `<figure class="hero">` +
    `<figcaption class="hero-caption">Exhibit 10 — Evidence coverage at a ` +
    `glance</figcaption>` +
    `<div class="coverage-tiles">` +
    `<div class="coverage-tile coverage-good">` +
    `<div class="coverage-num">${recordedCount}</div>` +
    `<div class="coverage-label">Recorded metrics</div>` +
    `<div class="coverage-sub">Measured · sourced · dated</div>` +
    `</div>` +
    `<div class="coverage-tile coverage-gap">` +
    `<div class="coverage-num">${gapCount}</div>` +
    `<div class="coverage-label">Declared seed gaps</div>` +
    `<div class="coverage-sub">Never blank · never invented</div>` +
    `</div>` +
    `<div class="coverage-tile coverage-neutral">` +
    `<div class="coverage-num">${coveragePct}%</div>` +
    `<div class="coverage-label">Baseline coverage</div>` +
    `<div class="coverage-sub">Of the metrics this case needs</div>` +
    `</div>` +
    `</div>` +
    `</figure>` +
    detail(
      'Full evidence tables — recorded metrics and declared seed gaps',
      `<div class="mini-key mini-key-block">Recorded metrics — measured, ` +
        `sourced, dated</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Value</th><th>Source</th>` +
        `<th class="num">As of</th><th class="num">Confidence</th>` +
        `<th>Caveat carried forward</th></tr></thead>` +
        `<tbody>${recordedRows}</tbody>` +
        `</table>` +
        `<div class="mini-key mini-key-block mini-key-gap">Seed gaps — ` +
        `declared, never blank, never invented</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th>Why it is missing</th><th>Owner</th>` +
        `<th class="num">As of</th><th>Decision impact</th></tr></thead>` +
        `<tbody>${gapRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 11, hero);
}

// ===========================================================================
// Slide 11 — Recommendation and asks.
// ===========================================================================

function renderRecommendation(pack: CostedBusinessCasePack): string {
  const s = pack.sections.recommendation;
  const stateChip = (st: 'approve' | 'hold' | 'condition'): string => {
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

  const hero =
    `<div class="board-card verdict-shape">` +
    `<div class="board-card-tag">Recommendation</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `</div>` +
    `<figure class="hero">` +
    `<figcaption class="hero-caption">Exhibit 11 — Decision checklist: ` +
    `what is requested at this gate</figcaption>` +
    `<div class="checklist">${checklist}</div>` +
    `</figure>` +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Requested spend</span>` +
    `<span>${esc(s.requestedSpend)}</span>` +
    `</div>` +
    detail(
      'Conditions before build funding, and the kill triggers',
      `<div class="mini-split">` +
        `<div><span class="mini-key">Conditions before a build-funding ` +
        `decision</span><ul class="mini-list">${s.conditions
          .map((c) => `<li>${esc(c)}</li>`)
          .join('')}</ul></div>` +
        `<div><span class="mini-key">Kill triggers — when to stop or ` +
        `re-shape</span><ul class="mini-list">${s.killTriggers
          .map((c) => `<li>${esc(c)}</li>`)
          .join('')}</ul></div>` +
        `</div>`,
    );
  return slide(s.anatomy, pack, 12, hero);
}

// ===========================================================================
// A collapsible detail strip — keeps the dense table OFF the composed slide
// while keeping it one click away (and always expanded for print).
// ===========================================================================

function detail(summary: string, body: string): string {
  return (
    `<details class="slide-detail">` +
    `<summary class="slide-detail-summary">` +
    `<span class="detail-chevron" aria-hidden="true"></span>` +
    `<span>${esc(summary)}</span>` +
    `</summary>` +
    `<div class="slide-detail-body">${body}</div>` +
    `</details>`
  );
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pack: CostedBusinessCasePack): string {
  return (
    `<section class="slide slide-cover" id="cover" data-slide="1" ` +
    `aria-label="Cover">` +
    `<div class="slide-inner cover-inner">` +
    `<div class="cover-brand">AbarVa · Moves</div>` +
    `<div class="cover-eyebrow">Costed Business-Case Pack · ` +
    `Board-grade reference artifact</div>` +
    `<h1 class="cover-title">${esc(pack.moveLabel)}</h1>` +
    `<div class="cover-tenant">${esc(pack.tenantLabel)} · ${esc(
      pack.tenantKey,
    )}</div>` +
    `<p class="cover-lede">A board deck in 12 slides. Every figure is ` +
    `produced by the Moves Expert Kernel from Apex's audited substrate. ` +
    `Where data is not recorded it is declared a seed gap — never invented. ` +
    `The honest verdict is <strong>shape</strong>: fund the next shaping ` +
    `gate, not the full build.</p>` +
    `<div class="cover-meta">` +
    `<div><span class="cover-meta-label">Verdict</span>` +
    `<span class="cover-meta-val">${pack.verdict.toUpperCase()}</span></div>` +
    `<div><span class="cover-meta-label">Payback</span>` +
    `<span class="cover-meta-val">Blocked — seed gap</span></div>` +
    `<div><span class="cover-meta-label">Slides</span>` +
    `<span class="cover-meta-val">${SLIDE_COUNT}</span></div>` +
    `<div><span class="cover-meta-label">Generated</span>` +
    `<span class="cover-meta-val">${esc(pack.generatedOn)}</span></div>` +
    `</div>` +
    `<div class="cover-hint">Use the menu, the arrows, or ← → keys to ` +
    `move through the deck.</div>` +
    `</div>` +
    `</section>`
  );
}

// ===========================================================================
// Left menu rail — the persistent deck navigation.
// ===========================================================================

function renderMenuRail(pack: CostedBusinessCasePack): string {
  const coverItem =
    `<button class="menu-item" type="button" data-goto="1" ` +
    `aria-current="true">` +
    `<span class="menu-num">00</span>` +
    `<span class="menu-text">` +
    `<span class="menu-label">Cover</span>` +
    `<span class="menu-sub">Costed Business-Case Pack</span>` +
    `</span>` +
    `</button>`;
  const items = pack.toc
    .map((t) => {
      const slideNo = t.page + 1; // cover is slide 1
      return (
        `<button class="menu-item" type="button" data-goto="${slideNo}">` +
        `<span class="menu-num">${String(t.page).padStart(2, '0')}</span>` +
        `<span class="menu-text">` +
        `<span class="menu-label">${esc(t.label)}</span>` +
        `<span class="menu-sub">${esc(t.takeaway)}</span>` +
        `</span>` +
        `</button>`
      );
    })
    .join('');
  return (
    `<nav class="menu" aria-label="Deck navigation">` +
    `<div class="menu-head">` +
    `<div class="menu-brand">AbarVa · Moves</div>` +
    `<div class="menu-title">Costed Business-Case Pack</div>` +
    `<div class="menu-tenant">${esc(pack.tenantLabel)}</div>` +
    `</div>` +
    `<div class="menu-list">${coverItem}${items}</div>` +
    `<div class="menu-foot">` +
    `<span class="menu-foot-verdict">Verdict · ${pack.verdict.toUpperCase()}` +
    `</span>` +
    `<span class="menu-foot-sub">Payback blocked — seed gap</span>` +
    `</div>` +
    `</nav>`
  );
}

// ===========================================================================
// Inline slide-switch script — no external src. Reveals one slide at a time,
// syncs the menu, wires prev/next + arrow keys, resets stage scroll on change.
// ===========================================================================

function deckScript(): string {
  // Kept terse and dependency-free; runs at the end of <body>.
  return (
    `(function(){` +
    `var total=${SLIDE_COUNT};` +
    `var stage=document.getElementById('stage');` +
    `var slides=Array.prototype.slice.call(` +
    `document.querySelectorAll('.slide'));` +
    `var items=Array.prototype.slice.call(` +
    `document.querySelectorAll('.menu-item'));` +
    `var cur=1;` +
    `function show(n){` +
    `if(n<1)n=1;if(n>total)n=total;` +
    `cur=n;` +
    `slides.forEach(function(s){` +
    `var sn=parseInt(s.getAttribute('data-slide'),10);` +
    `var on=sn===n;` +
    `s.classList.toggle('is-active',on);` +
    `if(on){s.removeAttribute('hidden');}` +
    `else{s.setAttribute('hidden','');}` +
    `});` +
    `items.forEach(function(it){` +
    `var gn=parseInt(it.getAttribute('data-goto'),10);` +
    `if(gn===n){it.setAttribute('aria-current','true');}` +
    `else{it.removeAttribute('aria-current');}` +
    `});` +
    `var active=items[n-1];` +
    `if(active&&active.scrollIntoView){` +
    `active.scrollIntoView({block:'nearest'});}` +
    `if(stage){stage.scrollTop=0;}` +
    `window.scrollTo(0,0);` +
    `var c=document.getElementById('deck-counter');` +
    `if(c){c.textContent=n+' / '+total;}` +
    `}` +
    `items.forEach(function(it){` +
    `it.addEventListener('click',function(){` +
    `show(parseInt(it.getAttribute('data-goto'),10));});` +
    `});` +
    `var prev=document.getElementById('deck-prev');` +
    `var next=document.getElementById('deck-next');` +
    `if(prev){prev.addEventListener('click',function(){show(cur-1);});}` +
    `if(next){next.addEventListener('click',function(){show(cur+1);});}` +
    `document.addEventListener('keydown',function(e){` +
    `var t=e.target;` +
    `if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;` +
    `if(e.key==='ArrowRight'||e.key==='PageDown'){` +
    `show(cur+1);e.preventDefault();}` +
    `else if(e.key==='ArrowLeft'||e.key==='PageUp'){` +
    `show(cur-1);e.preventDefault();}` +
    `else if(e.key==='Home'){show(1);e.preventDefault();}` +
    `else if(e.key==='End'){show(total);e.preventDefault();}` +
    `});` +
    `show(1);` +
    `})();`
  );
}

// ===========================================================================
// The deck chrome — prev/next controls anchored to the stage.
// ===========================================================================

function deckControls(): string {
  return (
    `<div class="deck-controls" aria-hidden="false">` +
    `<button class="deck-btn" type="button" id="deck-prev" ` +
    `aria-label="Previous slide">‹ Prev</button>` +
    `<span class="deck-counter" id="deck-counter">1 / ${SLIDE_COUNT}</span>` +
    `<button class="deck-btn" type="button" id="deck-next" ` +
    `aria-label="Next slide">Next ›</button>` +
    `</div>`
  );
}

// ===========================================================================
// The full document.
// ===========================================================================

/** Inlined stylesheet — the locked AbarVa register, deck on screen, full
 *  document in print. */
function styles(): string {
  return `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  background: #e7e3da;
  color: #070707;
  font-family: "DM Sans","Inter",system-ui,-apple-system,sans-serif;
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 {
  font-family: "Newsreader","Cormorant Garamond","Georgia",serif;
  font-weight: 500; letter-spacing: -0.01em; margin: 0;
}

/* === Deck shell — fixed left menu, scrolling right stage. === */
.deck {
  display: grid;
  grid-template-columns: 264px minmax(0,1fr);
  height: 100vh;
}

/* --- Left menu rail --- */
.menu {
  background: #11100e; color: #e7e3da;
  height: 100vh; position: sticky; top: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid #2a2824;
}
.menu-head {
  padding: 22px 22px 16px; border-bottom: 1px solid #2a2824;
}
.menu-brand {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
  text-transform: uppercase; color: #6ea2dd;
}
.menu-title {
  font-family: "Newsreader","Georgia",serif; font-size: 19px;
  color: #f8f7f4; margin-top: 8px; line-height: 1.2;
}
.menu-tenant {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10.5px; font-weight: 600; color: #a39d8e; margin-top: 5px;
}
.menu-list {
  flex: 1; overflow-y: auto; padding: 8px 0;
}
.menu-item {
  display: flex; gap: 11px; align-items: flex-start; width: 100%;
  background: transparent; border: 0; cursor: pointer;
  padding: 9px 18px 9px 16px; text-align: left;
  border-left: 3px solid transparent; color: #cdc8bc;
  font-family: inherit;
}
.menu-item:hover { background: #1b1a17; color: #f8f7f4; }
.menu-item[aria-current="true"] {
  background: #1f1e1a; border-left-color: #6ea2dd; color: #f8f7f4;
}
.menu-num {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; color: #75706320; color: #888273;
  padding-top: 2px; min-width: 18px;
}
.menu-item[aria-current="true"] .menu-num { color: #6ea2dd; }
.menu-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.menu-label {
  font-size: 12.5px; font-weight: 800; letter-spacing: -0.005em;
}
.menu-sub {
  font-size: 10.5px; line-height: 1.4; color: #8b8678;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.menu-item[aria-current="true"] .menu-sub { color: #b4ae9f; }
.menu-foot {
  padding: 14px 18px; border-top: 1px solid #2a2824;
  display: flex; flex-direction: column; gap: 3px;
}
.menu-foot-verdict {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #d8b65a;
}
.menu-foot-sub { font-size: 10px; color: #8b8678; }

/* --- Right stage --- */
.stage {
  height: 100vh; overflow-y: auto;
  display: flex; flex-direction: column;
  padding: 30px 38px 96px;
}

/* --- Slide — one composed screen. --- */
.slide { display: none; }
.slide.is-active { display: block; }
.slide-inner {
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 8px;
  max-width: 1080px; margin: 0 auto; width: 100%;
  min-height: calc(100vh - 130px);
  padding: 38px 52px 34px;
  display: flex; flex-direction: column;
}

/* Slide chrome — slim header rule. */
.slide-rule {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase; color: #8b8678;
  padding-bottom: 11px; border-bottom: 1px solid #e6e1d5;
}
.slide-rule-l { display: flex; gap: 7px; }
.slide-brand { color: #0b4a91; font-weight: 800; }
.slide-sep { color: #c9c3b3; }
.slide-rule-r { color: #8b8678; }

.slide-eyebrow {
  font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #0b4a91; margin: 22px 0 9px;
}
.slide-headline {
  font-size: 30px; line-height: 1.18; max-width: 880px;
  margin-bottom: 6px; color: #070707;
}

.slide-stage {
  flex: 1; padding: 16px 0 6px;
}
.slide-lede {
  font-size: 14.5px; line-height: 1.6; color: #2c2a26;
  max-width: 720px; margin: 4px 0 20px;
}

/* --- Hero exhibit — one dominant exhibit per slide. --- */
.hero { margin: 0 0 6px; }
.hero-caption {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; color: #070707; margin-bottom: 9px;
}
.hero-frame {
  background: #ffffff; border: 1px solid #e0dbcd; border-radius: 5px;
  padding: 20px 22px;
}
.hero-note {
  font-size: 11.5px; color: #5b5852; line-height: 1.5;
  margin: 9px 2px 0; max-width: 760px;
}

/* --- Quiet footer strip — facts compressed to one thin row. --- */
.slide-foot {
  display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 0;
  border-top: 1px solid #e6e1d5; margin-top: 18px; padding-top: 14px;
}
.foot-cell {
  padding: 0 16px 6px 0; border-right: 1px solid #ece7da;
  display: flex; flex-direction: column; gap: 3px;
}
.foot-cell:last-child { border-right: 0; }
.foot-implication { grid-row: span 1; }
.foot-key {
  font-size: 8.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; color: #8b8678;
}
.foot-val { font-size: 10.5px; line-height: 1.45; color: #2c2a26; }
.foot-implication .foot-val { color: #1c1a17; font-weight: 600; }

/* --- Collapsible detail strip — dense tables one click away. --- */
.slide-detail {
  margin-top: 16px; border: 1px solid #e0dbcd; border-radius: 5px;
  background: #f3f0e9;
}
.slide-detail-summary {
  cursor: pointer; list-style: none;
  display: flex; gap: 9px; align-items: center;
  padding: 11px 15px; font-size: 11px; font-weight: 800;
  letter-spacing: 0.03em; text-transform: uppercase; color: #5b5852;
}
.slide-detail-summary::-webkit-details-marker { display: none; }
.detail-chevron {
  width: 0; height: 0; border-left: 5px solid #8b8678;
  border-top: 4px solid transparent; border-bottom: 4px solid transparent;
  transition: transform 0.12s ease;
}
.slide-detail[open] .detail-chevron { transform: rotate(90deg); }
.slide-detail-summary:hover { color: #0b4a91; }
.slide-detail-body { padding: 4px 16px 16px; }

/* --- Cover slide --- */
.slide-cover .slide-inner { justify-content: center; }
.cover-inner { padding: 56px 60px; }
.cover-brand {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; letter-spacing: 0.22em;
  text-transform: uppercase; color: #0b4a91;
}
.cover-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #5b5852; margin-top: 16px;
}
.cover-title {
  font-size: 54px; line-height: 1.04; margin: 10px 0 14px; max-width: 760px;
}
.cover-tenant {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 12px; font-weight: 700; color: #070707;
}
.cover-lede {
  max-width: 620px; margin: 22px 0 30px; font-size: 15px;
  color: #2c2a26; line-height: 1.62;
}
.cover-meta {
  display: flex; gap: 44px; border-top: 1px solid #d8d3c6;
  padding-top: 20px;
}
.cover-meta-label {
  display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8b8678;
}
.cover-meta-val {
  display: block; font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 16px; font-weight: 800; margin-top: 4px;
}
.cover-hint {
  margin-top: 26px; font-size: 11px; color: #8b8678;
  font-style: italic;
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
  border-radius: 6px; padding: 20px 24px; margin: 0 0 20px;
  border: 1px solid;
}
.verdict-shape { background: #f7ecd6; border-color: #7A4F01; }
.verdict-fund { background: #e2efe2; border-color: #1B5E20; }
.verdict-kill { background: #f4ddd6; border-color: #8B1F0F; }
.board-card-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #7A4F01; margin-bottom: 7px;
}
.verdict-fund .board-card-tag { color: #1B5E20; }
.verdict-kill .board-card-tag { color: #8B1F0F; }
.board-verdict {
  font-family: "Newsreader","Georgia",serif; font-size: 23px;
  line-height: 1.26; color: #070707;
}
.board-detail { margin: 9px 0 0; font-size: 12.5px; color: #2c2a26; }

/* --- Board-answer split --- */
.answer-split {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin: 16px 0 16px;
}
.answer-col {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 14px 16px;
  background: #fff;
}
.answer-head {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.answer-col ul { margin: 0; padding-left: 17px; }
.answer-col li { font-size: 11.5px; line-height: 1.5; margin-bottom: 5px; }
.answer-fund { border-left: 3px solid #1B5E20; }
.answer-fund .answer-head { color: #1B5E20; }
.answer-hold { border-left: 3px solid #8B1F0F; }
.answer-hold .answer-head { color: #8B1F0F; }

/* --- Ask + payback lines --- */
.ask-line, .payback-line {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 12px 16px; border-radius: 5px; font-size: 12.5px;
  line-height: 1.5; margin: 0 0 16px;
}
.ask-line { background: #e8f0fa; color: #2c2a26; }
.payback-line { background: #f7ecd6; color: #2c2a26; }
.ask-line-tag, .payback-line-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; white-space: nowrap; padding-top: 2px;
}
.ask-line-tag { color: #0b4a91; }
.payback-line-tag { color: #7A4F01; }

/* --- Context diagram --- */
.context-diagram { display: flex; flex-direction: column; gap: 9px; }
.context-band {
  display: grid; grid-template-columns: 128px 1fr; gap: 12px;
  align-items: center;
}
.context-band-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #8b8678; text-align: right;
}
.context-nodes { display: flex; gap: 8px; flex-wrap: wrap; }
.context-node {
  flex: 1; min-width: 160px; background: #fff;
  border: 1px solid #cfc9b9; border-radius: 4px; padding: 9px 11px;
}
.context-node-gap { background: #f7ecd6; border-color: #7A4F01; }
.context-node-title { font-size: 12px; font-weight: 800; }
.context-node-detail {
  font-size: 10.5px; color: #5b5852; margin-top: 3px; line-height: 1.42;
}
.gap-flag {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 8px; font-weight: 800; color: #7A4F01;
  background: #fff; border: 1px solid #7A4F01; border-radius: 999px;
  padding: 1px 5px; text-transform: uppercase;
}

/* --- Scope triplet --- */
.scope-triplet {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 14px;
  margin: 16px 0 4px;
}
.scope-col {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 15px;
  background: #fff;
}
.scope-head {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.scope-col ul { margin: 0; padding-left: 16px; }
.scope-col li { font-size: 11px; line-height: 1.5; margin-bottom: 6px; }
.scope-in { border-left: 3px solid #1B5E20; }
.scope-in .scope-head { color: #1B5E20; }
.scope-out { border-left: 3px solid #8B1F0F; }
.scope-out .scope-head { color: #8B1F0F; }
.scope-retain { border-left: 3px solid #0b4a91; }
.scope-retain .scope-head { color: #0b4a91; }

/* --- Tables --- */
.data-table {
  width: 100%; border-collapse: collapse; margin: 10px 0 14px;
  background: #fff; border: 1px solid #e0dbcd; font-size: 11.5px;
}
.data-table th {
  text-align: left; background: #070707; color: #fbfaf7;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 9px 11px;
}
.data-table td {
  padding: 8px 11px; border-top: 1px solid #ece7da;
  vertical-align: top; line-height: 1.45;
}
.data-table tbody tr:nth-child(even) { background: #f7f5ef; }
.data-table .num {
  text-align: right; white-space: nowrap;
  font-family: "JetBrains Mono",ui-monospace,monospace;
}
.data-table th.num { text-align: right; }
.data-table tfoot td {
  background: #ece7da; font-weight: 800; border-top: 2px solid #070707;
}
.data-table-ledger td:nth-child(2) { width: 36%; }
.row-proxy { background: #fdf6e8 !important; }
.blocked-cell { color: #8B1F0F; font-weight: 800; }

/* --- Assumption cards --- */
.assume-cards { display: flex; flex-direction: column; gap: 10px; }
.assume-card {
  display: grid; grid-template-columns: 52px 1fr; gap: 14px;
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 14px 16px;
  background: #fff; border-left: 3px solid #0b4a91;
}
.assume-proxy { border-left-color: #7A4F01; background: #fdf6e8; }
.assume-rank {
  font-family: "Newsreader","Georgia",serif; font-size: 26px;
  color: #0b4a91; font-weight: 500;
}
.assume-proxy .assume-rank { color: #7A4F01; }
.assume-statement { font-size: 13px; font-weight: 600; color: #1c1a17;
  line-height: 1.45; }
.assume-meta {
  display: flex; gap: 7px; align-items: center; flex-wrap: wrap;
  margin-top: 7px; font-size: 11px; color: #5b5852;
}
.assume-dot { color: #c9c3b3; }

/* --- Coverage tiles --- */
.coverage-tiles {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
}
.coverage-tile {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 22px 20px;
  background: #fff; border-top: 3px solid #5b5852;
}
.coverage-good { border-top-color: #1B5E20; }
.coverage-gap { border-top-color: #8B1F0F; }
.coverage-neutral { border-top-color: #0b4a91; }
.coverage-num {
  font-family: "Newsreader","Georgia",serif; font-size: 44px;
  line-height: 1; color: #070707;
}
.coverage-good .coverage-num { color: #1B5E20; }
.coverage-gap .coverage-num { color: #8B1F0F; }
.coverage-neutral .coverage-num { color: #0b4a91; }
.coverage-label {
  font-size: 11.5px; font-weight: 800; letter-spacing: 0.03em;
  text-transform: uppercase; margin-top: 10px;
}
.coverage-sub { font-size: 10.5px; color: #5b5852; margin-top: 3px; }

/* --- Checklist --- */
.checklist { display: flex; flex-direction: column; gap: 8px; }
.check-row {
  display: grid; grid-template-columns: 120px 1fr; gap: 16px;
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 12px 15px;
  background: #fff; align-items: start;
}
.check-approve { border-left: 3px solid #1B5E20; }
.check-hold { border-left: 3px solid #8B1F0F; }
.check-condition { border-left: 3px solid #7A4F01; }
.check-label { font-weight: 800; font-size: 12.5px; }
.check-detail {
  font-size: 11px; color: #5b5852; margin-top: 3px; line-height: 1.5;
}

/* --- Mini split (detail strip prose) --- */
.mini-split {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin: 12px 0 4px;
}
.mini-key {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #0b4a91;
}
.mini-key-block { display: block; margin: 14px 0 2px; }
.mini-key-block:first-child { margin-top: 4px; }
.mini-key-gap { color: #8B1F0F; }
.mini-split p { margin: 5px 0 0; font-size: 11.5px; color: #2c2a26;
  line-height: 1.55; }
.mini-list { margin: 6px 0 0; padding-left: 16px; }
.mini-list li { font-size: 11px; line-height: 1.5; margin-bottom: 4px; }

/* --- Deck controls --- */
.deck-controls {
  position: fixed; bottom: 22px; right: 30px; z-index: 20;
  display: flex; gap: 8px; align-items: center;
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 999px;
  padding: 6px 8px; box-shadow: 0 6px 22px rgba(7,7,7,0.16);
}
.deck-btn {
  background: #11100e; color: #f8f7f4; border: 0; cursor: pointer;
  font-family: inherit; font-size: 11px; font-weight: 700;
  padding: 7px 13px; border-radius: 999px;
}
.deck-btn:hover { background: #2a2824; }
.deck-counter {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; color: #5b5852; padding: 0 4px;
}

/* --- Narrow screens — menu collapses to the top. --- */
@media (max-width: 880px) {
  .deck { grid-template-columns: 1fr; height: auto; }
  .menu { height: auto; position: static; }
  .menu-list { max-height: 220px; }
  .stage { height: auto; padding: 20px; }
  .slide-inner { min-height: 0; padding: 26px 22px; }
  .slide-foot, .answer-split, .scope-triplet, .coverage-tiles,
  .mini-split, .context-band, .check-row, .assume-card {
    grid-template-columns: 1fr;
  }
  .slide-headline { font-size: 24px; }
  .cover-title { font-size: 38px; }
}

/* === Print / PDF — expand EVERY slide, stacked, one page each. === */
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  body { background: #fff; }
  .deck { display: block; height: auto; }
  .menu, .deck-controls { display: none !important; }
  .stage { display: block; height: auto; overflow: visible; padding: 0; }
  .slide {
    display: block !important; page-break-after: always;
    break-after: page;
  }
  .slide:last-child { page-break-after: auto; break-after: auto; }
  .slide[hidden] { display: block !important; }
  .slide-inner {
    min-height: 0; border-radius: 0; border: 0;
    box-shadow: none; padding: 8mm 4mm; max-width: 100%;
  }
  /* Print shows the full document — detail strips expanded. */
  .slide-detail { background: #fff; border-color: #d8d3c6; }
  .slide-detail-body { display: block !important; }
  .slide-detail summary { color: #070707; }
  .detail-chevron { display: none; }
  .hero-frame, .data-table, .board-card, .answer-col, .scope-col,
  .context-node, .assume-card, .coverage-tile, .check-row {
    page-break-inside: avoid;
  }
}
`;
}

/**
 * Render the Apex Costed Business-Case Pack as one self-contained HTML
 * document — a left-menu presentation deck. Deterministic — a pure function
 * of `generatedOn`.
 */
export function renderApexCostedBusinessCaseHtml(generatedOn: string): string {
  const pack = buildApexCostedBusinessCasePack(generatedOn);
  const slides = [
    renderCover(pack),
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

  return (
    `<!doctype html><html lang="en"><head>` +
    `<meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
    `<title>${esc(pack.moveLabel)} — Costed Business-Case Pack — ${esc(
      pack.tenantLabel,
    )}</title>` +
    `<style>${styles()}</style>` +
    `</head><body>` +
    `<div class="deck">` +
    renderMenuRail(pack) +
    `<main class="stage" id="stage">${slides}</main>` +
    `</div>` +
    deckControls() +
    `<script>${deckScript()}</script>` +
    `</body></html>`
  );
}
