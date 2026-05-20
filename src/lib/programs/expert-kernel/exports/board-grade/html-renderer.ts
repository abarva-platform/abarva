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
//
// The deck CHROME — the menu rail, the stage, the slide scaffold, the inline
// slide-switch script, the print expansion and the locked design-system CSS —
// is the shared `deck-shell` module. This file only builds the Costed pack's
// twelve slides and hands them to the shell.

import {
  buildApexCostedBusinessCasePack,
  type CostedBusinessCasePack,
  type SectionAnatomy,
  type EvidenceStrip,
} from './pack-model';
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

// The deck has a fixed number of stage slides — the cover plus the 11
// blueprint sections.
const SLIDE_COUNT = 12;

// ---------------------------------------------------------------------------
// Slide scaffold — every section slide shares the same calm chrome via the
// deck-shell `slideShell`: a slim header, the takeaway headline, ONE hero
// exhibit, minimal prose, and a quiet single-line footer. The dense
// evidence/owner detail collapses into the footer strip.
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

/**
 * The quiet-footer facts — the decision-role / evidence / implication / owner
 * facts compressed into one thin row rather than four stacked blocks.
 */
function footerFacts(a: SectionAnatomy): FooterFact[] {
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

/**
 * Wrap a section's hero body into a `<section class="slide">` via the shared
 * `slideShell`. Slides other than the cover carry `data-slide` and are hidden
 * until selected; the inline script reveals exactly one at a time.
 */
function slide(
  a: SectionAnatomy,
  pack: CostedBusinessCasePack,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: pack.moveLabel,
    navLabel: a.navLabel,
    sectionNo: a.page,
    takeaway: a.takeaway,
    hero,
    footer: footerFacts(a),
  });
}

/** A framed hero exhibit — caption above, the SVG, an optional note below. */
function heroExhibit(caption: string, svg: string, note?: string): string {
  return shellHeroExhibit(caption, svg, note);
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
    heroExhibitHtml(
      'Exhibit 3 — Solution context: what sits inside the funded boundary',
      diagram,
    ) +
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
  return detailStrip(summary, body);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pack: CostedBusinessCasePack): string {
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Costed Business-Case Pack · Board-grade reference artifact',
    title: pack.moveLabel,
    tenantLine: `${pack.tenantLabel} · ${pack.tenantKey}`,
    lede:
      'A board deck in 12 slides. Every figure is produced by the Moves ' +
      "Expert Kernel from Apex's audited substrate. Where data is not " +
      'recorded it is declared a seed gap — never invented. The honest ' +
      'verdict is **shape**: fund the next shaping gate, not the full build.',
    meta: [
      { label: 'Verdict', value: pack.verdict.toUpperCase() },
      { label: 'Payback', value: 'Blocked — seed gap' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: pack.generatedOn },
    ],
    hint:
      'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// The full document — the Costed pack's twelve slides handed to the deck
// shell, which owns the menu rail, the stage, the inline script and print.
// ===========================================================================

/**
 * Render the Apex Costed Business-Case Pack as one self-contained HTML
 * document — a left-menu presentation deck. Deterministic — a pure function
 * of `generatedOn`.
 */
export function renderApexCostedBusinessCaseHtml(generatedOn: string): string {
  const pack = buildApexCostedBusinessCasePack(generatedOn);

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Costed Business-Case Pack',
    moveLabel: pack.moveLabel,
    tenantLabel: pack.tenantLabel,
    tenantKey: pack.tenantKey,
    generatedOn: pack.generatedOn,
    verdict: {
      label: pack.verdict.toUpperCase(),
      sub: 'Payback blocked — seed gap',
    },
    documentTitle: `${pack.moveLabel} — Costed Business-Case Pack — ${pack.tenantLabel}`,
  };

  const renderers: Array<(p: CostedBusinessCasePack) => string> = [
    renderBoardAnswer,
    renderWhyNow,
    renderWhatWeAreFunding,
    renderInvestmentCase,
    renderValueCase,
    renderPaybackSensitivity,
    renderRoadmap,
    renderRisksControls,
    renderAssumptionLedger,
    renderEvidenceAppendix,
    renderRecommendation,
  ];

  // The cover slide carries the fixed "Cover" menu entry; the section slides
  // carry their TOC label + takeaway. Each slide's `render()` returns the
  // already-composed section — the slide number is fixed by the renderer.
  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Costed Business-Case Pack',
      render: () => renderCover(pack),
    },
    ...pack.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](pack),
    })),
  ];

  return renderDeckDocument(meta, slides);
}
