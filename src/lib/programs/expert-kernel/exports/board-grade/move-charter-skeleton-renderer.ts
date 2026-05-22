// Generic Move Charter Business-Case Skeleton — self-contained HTML renderer.
//
// The generic sibling of `charter-skeleton-renderer.ts` (the Apex reference
// renderer). It renders the Charter Skeleton deck for a REAL, originated Move
// from `buildMoveCharterSkeleton(move)` — the kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering, and it reuses the Apex Charter's
// own value-hypothesis card styling (`charterStyles`). The only difference
// from the Apex renderer is the section set: the generic deck has seven
// sections (Charter answer, the inherited curated outline, value hypothesis,
// initial cost/effort, assumption ledger, kill criteria, evidence asks),
// driven entirely by the kernel skeleton and the Function-Pack binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveCharterSkeletonHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated charter for
// an unbound Move. The verdict shown is always the kernel's real verdict.
//
// The Apex renderer (`renderApexCharterSkeletonHtml`) is left untouched — this
// file is added alongside it.

import {
  buildMoveCharterSkeleton,
  type MoveCharterSkeleton,
  type MoveCharterSkeletonResult,
  type MoveCharterSectionAnatomy,
  type MoveCharterEvidenceStrip,
} from './move-charter-skeleton-model';
import type { MoveBusinessCaseInput } from '../../../move-business-case';
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
  economicsStrip,
  baselineImpact,
  valueVsEffortSummary,
  sensitivityTornado,
  gapClosureQueue,
} from './svg-charts';

// The bound deck has a fixed slide count — the cover plus the 7 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveCharterEvidenceStrip['confidence']): string {
  const map: Record<MoveCharterEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — decision role / evidence / owner / next gate. */
function footerFacts(a: MoveCharterSectionAnatomy): FooterFact[] {
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
  a: MoveCharterSectionAnatomy,
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

/** A small chevron-collapsible detail strip — dense detail, one click away. */
function detail(summary: string, body: string): string {
  return detailStrip(summary, body);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

function verdictClassOf(verdict: 'fund' | 'shape' | 'kill'): string {
  return verdict === 'fund'
    ? 'verdict-fund'
    : verdict === 'kill'
      ? 'verdict-kill'
      : 'verdict-shape';
}

function usd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `$${Math.round(a / 1_000)}K`;
  return `$${Math.round(a)}`;
}

// ===========================================================================
// Slide 1 — Charter answer.
// ===========================================================================

function renderCharterAnswer(charter: MoveCharterSkeleton): string {
  const s = charter.sections.charterAnswer;

  const notes =
    s.derivationNotes.length > 0
      ? detail(
          'How the kernel inputs were derived — honesty notes',
          `<ul class="mini-list">${s.derivationNotes
            .map((n) => `<li>${esc(n)}</li>`)
            .join('')}</ul>`,
        )
      : '';

  const hero =
    `<div class="board-card ${verdictClassOf(charter.verdict)}">` +
    `<div class="board-card-tag">Charter verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Charter decision at a glance, from the kernel',
      economicsStrip(s.tiles),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">What is being approved now</span>` +
    `<span>${esc(s.shapingAsk)}</span>` +
    `</div>` +
    notes;
  return slide(s.anatomy, charter.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Inherited curated outline.
// ===========================================================================

function renderInheritedOutline(charter: MoveCharterSkeleton): string {
  const s = charter.sections.inheritedOutline;
  const rows = s.outline
    .map(
      (o, i) =>
        `<tr>` +
        `<td class="num">${i + 1}</td>` +
        `<td><strong>${esc(o.heading)}</strong></td>` +
        `<td>${esc(o.guidance)}</td>` +
        `</tr>`,
    )
    .join('');

  // The inherited outline is rendered as a node grid, reusing the shared
  // context-diagram styling — no new CSS class is introduced.
  const cards =
    `<div class="context-diagram">` +
    `<div class="context-band">` +
    `<div class="context-band-label">Inherited curated Charter outline</div>` +
    `<div class="context-nodes">` +
    s.outline
      .map(
        (o, i) =>
          `<div class="context-node">` +
          `<div class="context-node-title">` +
          `${String(i + 1).padStart(2, '0')} · ${esc(o.heading)}</div>` +
          `<div class="context-node-detail">${esc(o.guidance)}</div>` +
          `</div>`,
      )
      .join('') +
    `</div>` +
    `</div>` +
    `</div>`;

  const hero =
    lede(
      `This Charter Business-Case Skeleton inherits the curated ${esc(
        charter.functionLabel,
      )} Charter outline from the bound Domain Function Pack. The agent does ` +
        `not improvise the structure — every section below is a curated, ` +
        `function-calibrated heading.`,
    ) +
    heroExhibitHtml(
      `Exhibit 2 — The inherited ${esc(charter.functionLabel)} Charter outline`,
      cards,
    ) +
    detail(
      'The curated outline — every section heading and its guidance',
      `<table class="data-table">` +
        `<thead><tr><th class="num">#</th><th>Section heading</th>` +
        `<th>Curated guidance</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, charter.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Value hypothesis.
// ===========================================================================

function renderValueHypothesis(charter: MoveCharterSkeleton): string {
  const s = charter.sections.valueHypothesis;

  const metricExhibit =
    s.metricBars.length > 0
      ? heroExhibit(
          'Exhibit 3 — The value claim against the recorded baseline',
          baselineImpact(s.metricBars),
          'The bars carry no committed target — they are the recorded ' +
            'baseline the pilot must move; a single fabricated target would ' +
            'be a hard fail.',
        )
      : heroExhibitHtml(
          'Exhibit 3 — No recorded baseline metrics yet',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest gap</span>` +
            `<span>This Move records none of the Function-Pack operating ` +
            `metrics yet — the value claim is anchored on the curated ` +
            `benchmark band until the tenant’s own baseline lands. The ` +
            `seed-gapped metrics are the evidence asks on the last slide.` +
            `</span>` +
            `</div>`,
        );

  const hero =
    lede(
      'A value hypothesis earns its place only if it can be proven false. ' +
        'This one is anchored on the recorded baseline and the curated ' +
        'Function-Pack value model — a pilot is the test.',
    ) +
    `<div class="hypo-card">` +
    `<div class="hypo-claim-tag">Falsifiable value claim</div>` +
    `<div class="hypo-claim">${esc(s.claim)}</div>` +
    `<div class="hypo-flow">` +
    `<div class="hypo-node"><span class="hypo-node-tag">Baseline</span>` +
    `<span class="hypo-node-val">${
      s.metricBars.length > 0 ? 'Recorded' : 'Seed-gapped'
    }</span></div>` +
    `<div class="hypo-arrow">→</div>` +
    `<div class="hypo-node hypo-node-mech">` +
    `<span class="hypo-node-tag">Mechanism</span>` +
    `<span class="hypo-node-mech-text">${esc(s.mechanism)}</span></div>` +
    `<div class="hypo-arrow">→</div>` +
    `<div class="hypo-node hypo-node-target">` +
    `<span class="hypo-node-tag">Target</span>` +
    `<span class="hypo-node-mech-text">${esc(s.targetValue)}</span></div>` +
    `</div>` +
    `</div>` +
    metricExhibit +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Falsification test</span>` +
    `<span>${esc(s.falsificationTest)}</span>` +
    `</div>` +
    (s.monetisationBlocked
      ? `<p class="hero-note">Monetisation is blocked — the value rests on ` +
        `the Function Pack’s curated benchmark ranges, a planning proxy ` +
        `until the tenant’s spend base and seed-gapped metrics are supplied. ` +
        `The hypothesis is directional, never a fabricated dollar claim.</p>`
      : '');
  return slide(s.anatomy, charter.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — Initial cost/effort.
// ===========================================================================

function renderInitialCostEffort(charter: MoveCharterSkeleton): string {
  const s = charter.sections.initialCostEffort;
  const changePct = Math.round(s.changeFraction * 100);

  const splitRows =
    `<table class="data-table">` +
    `<thead><tr><th>Cost lane</th><th class="num">Base cost</th>` +
    `<th>Basis</th></tr></thead>` +
    `<tbody>` +
    `<tr><td>AI build, integration, data &amp; run</td>` +
    `<td class="num">${usd(s.buildCost)}</td>` +
    `<td>Build-side workstreams — includes ${usd(s.runCost)} year-1 run ` +
    `cost</td></tr>` +
    `<tr class="row-proxy"><td>Business change &amp; adoption</td>` +
    `<td class="num">${usd(s.changeCost)}</td>` +
    `<td>Process redesign, change &amp; adoption, data governance — ` +
    `${changePct}% of effort</td></tr>` +
    `</tbody></table>`;

  const hero =
    lede(
      `The early envelope is a range — ${usd(s.effortLow)} to ` +
        `${usd(s.effortHigh)}, base ${usd(s.effortPoint)} — never a single ` +
        `number. ${changePct}% is business change, the half AI cases most ` +
        'often under-budget.',
    ) +
    heroExhibit(
      'Exhibit 4 — Investment envelope read against the value band',
      valueVsEffortSummary({
        effortLow: s.effortLow,
        effortPoint: s.effortPoint,
        effortHigh: s.effortHigh,
        valueLow: s.valueLow,
        valuePoint: s.valuePoint,
        valueHigh: s.valueHigh,
        monetisationBlocked: s.monetisationBlocked,
      }),
      'Both bars are low–high ranges with a base marker — a single-point ' +
        'cost or ROI is a blueprint §6 hard fail and is never shown.',
    ) +
    detail(
      'Build / run / change split and the rate-card basis',
      splitRows +
        `<div class="mini-key mini-key-block">Build-vs-change read</div>` +
        `<p class="mini-para">${esc(s.splitNote)}</p>` +
        `<div class="mini-key mini-key-block">Rate-card basis</div>` +
        `<p class="mini-para">${esc(s.rateCardBasis)} — a researched ` +
        `planning benchmark, NOT a client quote.</p>`,
    );
  return slide(s.anatomy, charter.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Assumption ledger.
// ===========================================================================

function renderAssumptionLedger(charter: MoveCharterSkeleton): string {
  const s = charter.sections.assumptionLedger;

  const tornado = sensitivityTornado(
    s.assumptions.map((a) => ({
      label: a.statement.split(/[—.:]/)[0].trim().slice(0, 46),
      swing:
        a.sensitivityImpact === 'high'
          ? 100
          : a.sensitivityImpact === 'medium'
            ? 58
            : 26,
      isProxy: a.isSeedGapProxy,
    })),
  );

  const cards =
    `<div class="assume-cards">` +
    s.assumptions
      .map(
        (a) =>
          `<div class="assume-card${a.isSeedGapProxy ? ' assume-proxy' : ''}">` +
          `<div class="assume-rank">${a.rank}</div>` +
          `<div>` +
          `<div class="assume-statement">${esc(a.statement)}</div>` +
          `<div class="assume-meta">` +
          `<span>Owner — ${esc(a.owner)}</span>` +
          `<span class="assume-dot">·</span>` +
          `<span>Confidence ${confChip(a.confidence)}</span>` +
          `<span class="assume-dot">·</span>` +
          `<span>Sensitivity ${esc(a.sensitivityImpact)}</span>` +
          (a.isSeedGapProxy
            ? `<span class="assume-dot">·</span>` +
              `<span class="chip chip-warn">Seed-gap proxy</span>`
            : '') +
          `</div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      'Every assumption is owned and ranked by how much it moves the case. ' +
        `${s.proxyMoverCount} of the case-moving assumptions are seed-gap ` +
        'proxies — assumptions standing in for absent tenant data.',
    ) +
    heroExhibit(
      'Exhibit 5 — Assumption sensitivity: what moves the case most',
      tornado,
      'A hatched bar is a seed-gap proxy; a solid bar is grounded. The ' +
        'widest bars are the assumptions the shaping spend must validate.',
    ) +
    detail(
      'Assumption ledger — every assumption, owner and sensitivity',
      cards,
    );
  return slide(s.anatomy, charter.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — Kill criteria.
// ===========================================================================

function renderKillCriteria(charter: MoveCharterSkeleton): string {
  const s = charter.sections.killCriteria;

  const stateChip = (st: 'fired' | 'armed'): string =>
    st === 'fired'
      ? '<span class="chip chip-bad">Firing</span>'
      : '<span class="chip chip-warn">Armed</span>';
  const checkClass = (st: 'fired' | 'armed'): string =>
    st === 'fired' ? 'check-hold' : 'check-condition';

  const checklist =
    `<div class="checklist">` +
    s.criteria
      .map(
        (c) =>
          `<div class="check-row ${checkClass(c.state)}">` +
          `<div class="check-mark">${stateChip(c.state)}</div>` +
          `<div class="check-body">` +
          `<div class="check-label">${esc(c.title)}</div>` +
          `<div class="check-detail">${esc(c.condition)}</div>` +
          `<div class="check-detail check-threshold">` +
          `<span class="check-owner">Owner: ${esc(c.owner)}</span></div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      `These are the conditions that stop or reshape the Move. ` +
        `${s.firedCount} ${
          s.firedCount === 1 ? 'criterion is' : 'criteria are'
        } ` +
        (s.firedCount > 0
          ? 'already firing — which is precisely why the Charter verdict is ' +
            'not a clean fund.'
          : 'firing — the criteria stay armed as the gate conditions Design ' +
            '& Plan is held to.'),
    ) +
    heroExhibitHtml(
      'Exhibit 6 — Kill criteria: the stop conditions, armed and fired',
      checklist,
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Why this matters</span>` +
    `<span>A "fund" recommendation while a kill criterion is firing is a ` +
    `blueprint §6 hard fail. A fired criterion is the gate condition on ` +
    `build funding — it must clear before Design &amp; Plan can be funded ` +
    `to build.</span>` +
    `</div>`;
  return slide(s.anatomy, charter.moveLabel, 7, hero);
}

// ===========================================================================
// Slide 7 — Evidence asks.
// ===========================================================================

function renderEvidenceAsks(charter: MoveCharterSkeleton): string {
  const s = charter.sections.evidenceAsks;

  const askRows = s.asks
    .slice()
    .sort((a, b) => b.impact - a.impact)
    .map(
      (g) =>
        `<tr class="${g.blocksFunding ? 'row-proxy' : ''}">` +
        `<td>${esc(g.label)}${
          g.blocksFunding
            ? ' <span class="chip chip-bad">Blocks funding</span>'
            : ' <span class="chip chip-warn">Informs scope</span>'
        }</td>` +
        `<td>${esc(g.reason)}</td>` +
        `<td>${esc(g.expectedDataSource)}</td>` +
        `<td>${esc(g.owner)}</td>` +
        `</tr>`,
    )
    .join('');

  const queueExhibit =
    s.asks.length > 0
      ? heroExhibit(
          'Exhibit 7 — Evidence asks before Design & Plan, by decision impact',
          gapClosureQueue(
            s.asks.map((g) => ({
              label: g.label,
              owner: g.owner,
              due: 'Before the funding gate',
              impact: g.impact,
              blocksSizing: g.blocksFunding,
            })),
          ),
          'The queue is sorted by decision impact — the widest bar is the ' +
            'next evidence ask. Funding-blocking asks outrank scope-informing ' +
            'asks.',
        )
      : heroExhibitHtml(
          'Exhibit 7 — No open evidence asks',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Baseline grounded</span>` +
            `<span>This Move records every operating metric the Function ` +
            `Pack expects — the Charter case has no open seed-gap evidence ` +
            `ask.</span>` +
            `</div>`,
        );

  const hero =
    lede(
      'Closing evidence — not more analysis — is the work that turns this ' +
        'Charter into a fundable Design & Plan. Each ask is a precise, named ' +
        'seed gap inherited from the curated Function Pack.',
    ) +
    queueExhibit +
    (s.asks.length > 0
      ? detail(
          'Evidence ask table — why it is a gap, its source, and its owner',
          `<table class="data-table">` +
            `<thead><tr><th>Evidence ask before funding</th>` +
            `<th>Why it is a gap</th><th>Expected data source</th>` +
            `<th>Owner</th></tr></thead>` +
            `<tbody>${askRows}</tbody>` +
            `</table>`,
        )
      : '');
  return slide(s.anatomy, charter.moveLabel, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(charter: MoveCharterSkeleton): string {
  const verdictWord =
    charter.verdict === 'fund'
      ? 'FUND'
      : charter.verdict === 'kill'
        ? 'STOP'
        : 'SHAPE';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Charter Business-Case Skeleton · Kernel-derived for a real Move',
    title: charter.moveLabel,
    tenantLine: `${charter.tenantLabel} · ${charter.functionLabel}`,
    lede:
      'A Charter business-case skeleton produced by the Moves Expert Kernel ' +
      'for this Move. The section structure is **inherited** from the curated ' +
      'Domain Function Pack; every figure is the kernel’s — cost and value ' +
      'are ranges, never single points, unrecorded metrics are named seed ' +
      'gaps, and the verdict is the kernel’s real recommendation, never ' +
      'invented.',
    meta: [
      { label: 'Charter verdict', value: verdictWord },
      {
        label: 'Funding',
        value:
          charter.verdict === 'fund'
            ? 'Fundable into Design & Plan'
            : charter.verdict === 'kill'
              ? 'Not funded — Charter stopped'
              : 'Shaping only — not build',
      },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: charter.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Charter-Skeleton-specific styles — the value-hypothesis card. These mirror
// the Apex Charter renderer's styles so the generic deck looks identical; they
// reuse the locked design tokens and add no new palette colour.
// ===========================================================================

function charterStyles(): string {
  return `
/* --- Charter — value-hypothesis card. --- */
.hypo-card {
  border: 1px solid #e0dbcd; border-radius: 6px; padding: 16px 18px;
  background: #fff; border-left: 3px solid #0b4a91; margin: 4px 0 16px;
}
.hypo-claim-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; color: #0b4a91; margin-bottom: 6px;
}
.hypo-claim {
  font-size: 13.5px; font-weight: 600; color: #1c1a17; line-height: 1.5;
}
.hypo-flow {
  display: grid; grid-template-columns: 1fr auto 1.6fr auto 1.3fr; gap: 8px;
  align-items: stretch; margin-top: 14px;
}
.hypo-node {
  background: #f3f0e9; border: 1px solid #e0dbcd; border-radius: 5px;
  padding: 9px 11px; display: flex; flex-direction: column; gap: 4px;
}
.hypo-node-mech { background: #e8f0fa; }
.hypo-node-target { background: #e2efe2; border-color: #1B5E20; }
.hypo-node-tag {
  font-size: 8.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #8b8678;
}
.hypo-node-val {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 13px; font-weight: 800; color: #070707;
}
.hypo-node-mech-text { font-size: 10px; color: #2c2a26; line-height: 1.4; }
.hypo-arrow {
  align-self: center; font-size: 18px; color: #0b4a91; font-weight: 800;
}
/* --- Charter — kill-criteria threshold line. --- */
.check-threshold { margin-top: 5px; color: #2c2a26; }
.check-owner { color: #8b8678; font-weight: 600; }
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
@media (max-width: 880px) {
  .hypo-flow { grid-template-columns: 1fr; }
  .hypo-arrow { transform: rotate(90deg); }
}
`;
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated charter.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Charter Business-Case Skeleton',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Charter Business-Case Skeleton — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Charter Business-Case Skeleton · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No Charter business ' +
        'case is fabricated.',
      meta: [
        { label: 'Charter verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade Charter skeleton.',
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
        'kernel cannot produce a board-grade Charter skeleton.',
      hero:
        lede(
          'AbarVa’s board-grade Charter Business-Case Skeleton is grounded ' +
            'in a curated Domain Function Pack — the pack supplies the ' +
            'Charter deliverable outline, the expected operating metrics, ' +
            'and the value model the kernel reasons against. Without one, ' +
            'the kernel will not fabricate a charter.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade Charter skeleton',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade Charter skeleton for ` +
        `this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function. This is surfaced as a gap, ` +
        `not papered over with a fabricated charter.</p>`,
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
      navPreview: 'Why this Move has no board-grade Charter skeleton',
      render: () => noteSlide(),
    },
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${charterStyles()}</style>`);
}

// ===========================================================================
// Public entry — render the generic Move Charter Business-Case Skeleton.
// ===========================================================================

/**
 * Render the generic Move Charter Business-Case Skeleton as one self-contained
 * HTML document. Projects the deck from `buildMoveCharterSkeleton`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * charter. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveCharterSkeletonHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveCharterSkeletonResult = buildMoveCharterSkeleton(
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

/** Render the bound deck — the cover plus the seven kernel-derived sections. */
function renderBoundDocument(charter: MoveCharterSkeleton): string {
  const verdictWord =
    charter.verdict === 'fund'
      ? 'FUND'
      : charter.verdict === 'kill'
        ? 'STOP'
        : 'SHAPE';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Charter Business-Case Skeleton',
    moveLabel: charter.moveLabel,
    tenantLabel: charter.tenantLabel,
    tenantKey: charter.tenantKey,
    generatedOn: charter.generatedOn,
    verdict: {
      label: verdictWord,
      sub:
        charter.verdict === 'fund'
          ? 'Fundable into Design & Plan'
          : charter.verdict === 'kill'
            ? 'Charter stopped'
            : 'Fund shaping only — build blocked',
    },
    documentTitle: `${charter.moveLabel} — Charter Business-Case Skeleton — ${charter.tenantLabel}`,
  };

  const renderers: Array<(c: MoveCharterSkeleton) => string> = [
    renderCharterAnswer,
    renderInheritedOutline,
    renderValueHypothesis,
    renderInitialCostEffort,
    renderAssumptionLedger,
    renderKillCriteria,
    renderEvidenceAsks,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Charter Business-Case Skeleton',
      render: () => renderCover(charter),
    },
    ...charter.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](charter),
    })),
  ];

  // The deck shell composes the full document; the Charter-specific styles are
  // injected just before `</style>` so they sit after the shared deck CSS.
  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${charterStyles()}</style>`);
}
