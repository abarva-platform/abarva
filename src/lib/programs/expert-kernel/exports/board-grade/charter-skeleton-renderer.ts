// Board-grade Charter Business-Case Skeleton — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack and
// the Discover Brief, composed by the shared `deck-shell` module. The reader
// flips slides; for print an `@media print` block expands the deck into the
// full document.
//
// The deck is a cover plus the six blueprint §6 Charter Skeleton sections:
//   1. Charter answer    — shape / fund shaping only / stop?
//   2. Value hypothesis  — the falsifiable value claim.
//   3. Initial cost/effort — the early investment envelope.
//   4. Assumption ledger — the case-moving assumptions, owned.
//   5. Kill criteria     — the stop conditions and thresholds.
//   6. Evidence asks     — what must be collected before funding.
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant hero exhibit, two to four lines of prose, and
// a quiet footer (decision role / evidence / owner / next gate).
//
// All CSS is inlined, every exhibit is an inline SVG, the slide-switch script
// is inline — the file opens offline. The renderer is PURE: a deterministic
// function of the kernel view-model. It changes no kernel logic; it renders
// the Charter's real verdict (`shape`), the real effort/value RANGES, and the
// declared seed gaps — never an invented value, never a single-point cost.

import {
  buildApexCharterSkeleton,
  type CharterSkeleton,
  type CharterSectionAnatomy,
  type CharterEvidenceStrip,
} from './charter-skeleton-model';
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

// The deck has a fixed slide count — the cover plus the six §6 sections.
const SLIDE_COUNT = 7;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: CharterEvidenceStrip['confidence']): string {
  const map: Record<CharterEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — decision role / evidence / owner / next gate. */
function footerFacts(a: CharterSectionAnatomy): FooterFact[] {
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
  a: CharterSectionAnatomy,
  charter: CharterSkeleton,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: charter.moveLabel,
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

// ===========================================================================
// Slide 1 — Charter answer.
// ===========================================================================

function renderCharterAnswer(charter: CharterSkeleton): string {
  const s = charter.sections.charterAnswer;
  const verdictClass =
    charter.verdict === 'fund'
      ? 'verdict-fund'
      : charter.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Charter verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Charter decision at a glance',
      economicsStrip(s.tiles),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">What is being approved now</span>` +
    `<span>${esc(s.shapingAsk)}</span>` +
    `</div>` +
    `<div class="brief-problem">` +
    `<span class="brief-problem-tag">Accountable sponsor</span>` +
    `<span>${esc(s.sponsor)}</span>` +
    `</div>`;
  return slide(s.anatomy, charter, 2, hero);
}

// ===========================================================================
// Slide 2 — Value hypothesis.
// ===========================================================================

function renderValueHypothesis(charter: CharterSkeleton): string {
  const s = charter.sections.valueHypothesis;

  const hero =
    lede(
      'A value hypothesis earns its place only if it can be proven false. ' +
        'This one is anchored on a recorded baseline and a stated KPI target ' +
        '— a pilot is the test.',
    ) +
    `<div class="hypo-card">` +
    `<div class="hypo-claim-tag">Falsifiable value claim</div>` +
    `<div class="hypo-claim">${esc(s.claim)}</div>` +
    `<div class="hypo-flow">` +
    `<div class="hypo-node"><span class="hypo-node-tag">Baseline</span>` +
    `<span class="hypo-node-val">${esc(s.baselineValue)}</span></div>` +
    `<div class="hypo-arrow">→</div>` +
    `<div class="hypo-node hypo-node-mech">` +
    `<span class="hypo-node-tag">Mechanism</span>` +
    `<span class="hypo-node-mech-text">${esc(s.mechanism)}</span></div>` +
    `<div class="hypo-arrow">→</div>` +
    `<div class="hypo-node hypo-node-target">` +
    `<span class="hypo-node-tag">Target</span>` +
    `<span class="hypo-node-val">${esc(s.targetValue)}</span></div>` +
    `</div>` +
    `</div>` +
    heroExhibit(
      'Exhibit 2 — The value claim against the recorded baseline',
      baselineImpact(s.metricBars),
      `Target metric — ${s.targetMetric}. The repeat-transfer bar carries no ` +
        'target: it is a watched signal, not a committed KPI.',
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Falsification test</span>` +
    `<span>${esc(s.falsificationTest)}</span>` +
    `</div>`;
  return slide(s.anatomy, charter, 3, hero);
}

// ===========================================================================
// Slide 3 — Initial cost/effort.
// ===========================================================================

function renderInitialCostEffort(charter: CharterSkeleton): string {
  const s = charter.sections.initialCostEffort;
  const changePct = Math.round(s.changeFraction * 100);

  const splitRows =
    `<table class="data-table">` +
    `<thead><tr><th>Cost lane</th><th class="num">Base cost</th>` +
    `<th>Basis</th></tr></thead>` +
    `<tbody>` +
    `<tr><td>AI build, integration, data &amp; run</td>` +
    `<td class="num">${usd(s.buildCost)}</td>` +
    `<td>Five build-side workstreams — includes ${usd(s.runCost)} year-1 ` +
    `run cost</td></tr>` +
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
      'Exhibit 3 — Investment envelope read against the value band',
      valueVsEffortSummary({
        effortLow: s.effortLow,
        effortPoint: s.effortPoint,
        effortHigh: s.effortHigh,
        valueLow: s.valueLow,
        valuePoint: s.valuePoint,
        valueHigh: s.valueHigh,
        monetisationBlocked: charter.monetisationBlocked,
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
        `<p class="mini-para">${esc(s.rateCardBasis)}</p>`,
    );
  return slide(s.anatomy, charter, 4, hero);
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
// Slide 4 — Assumption ledger.
// ===========================================================================

function renderAssumptionLedger(charter: CharterSkeleton): string {
  const s = charter.sections.assumptionLedger;

  const tornado = sensitivityTornado(
    s.assumptions.map((a) => ({
      label: a.statement.split(/[—.]/)[0].trim().slice(0, 46),
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
      `Every assumption is owned and ranked by how much it moves the case. ` +
        `${s.proxyMoverCount} of the three case-moving assumptions are ` +
        'seed-gap proxies — assumptions standing in for absent tenant data.',
    ) +
    heroExhibit(
      'Exhibit 4 — Assumption sensitivity: what moves the case most',
      tornado,
      'A hatched bar is a seed-gap proxy; a solid bar is grounded. The ' +
        'widest bars are the assumptions the shaping spend must validate.',
    ) +
    detail('Assumption ledger — every assumption, owner and sensitivity', cards);
  return slide(s.anatomy, charter, 5, hero);
}

// ===========================================================================
// Slide 5 — Kill criteria.
// ===========================================================================

function renderKillCriteria(charter: CharterSkeleton): string {
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
          `<strong>Evidence threshold</strong> — ${esc(c.threshold)} ` +
          `<span class="check-owner">Owner: ${esc(c.owner)}</span></div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      `These are the conditions that stop or reshape the Move. ` +
        `${s.firedCount} ${s.firedCount === 1 ? 'criterion is' : 'criteria are'} ` +
        'already firing — which is precisely why the Charter verdict is ' +
        'shape, not fund.',
    ) +
    heroExhibitHtml(
      'Exhibit 5 — Kill criteria: stop conditions and evidence thresholds',
      checklist,
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Why this matters</span>` +
    `<span>A "fund" recommendation while a kill criterion is firing is a ` +
    `blueprint §6 hard fail. The fired monetisation criterion is the gate ` +
    `condition on build funding — it must clear before Design &amp; Plan ` +
    `can be funded to build.</span>` +
    `</div>`;
  return slide(s.anatomy, charter, 6, hero);
}

// ===========================================================================
// Slide 6 — Evidence asks.
// ===========================================================================

function renderEvidenceAsks(charter: CharterSkeleton): string {
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
        `<td>${esc(g.owner)}</td>` +
        `<td class="num">${esc(g.due)}</td>` +
        `<td>${esc(g.decisionImpact)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'Closing evidence — not more analysis — is the work that turns this ' +
        'Charter into a fundable Design & Plan. Two of the four asks block ' +
        'build funding outright.',
    ) +
    heroExhibit(
      'Exhibit 6 — Evidence asks before Design & Plan, by decision impact',
      gapClosureQueue(
        s.asks.map((g) => ({
          label: g.label,
          owner: g.owner,
          due: g.due,
          impact: g.impact,
          blocksSizing: g.blocksFunding,
        })),
      ),
      'The queue is sorted by decision impact — the widest bar is the next ' +
        'evidence ask. Funding-blocking asks outrank scope-informing asks.',
    ) +
    detail(
      'Evidence ask table — owner, target date and decision impact',
      `<table class="data-table">` +
        `<thead><tr><th>Evidence ask before funding</th><th>Owner</th>` +
        `<th class="num">Target date</th><th>Decision impact</th></tr></thead>` +
        `<tbody>${askRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, charter, 7, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(charter: CharterSkeleton): string {
  const verdictWord =
    charter.verdict === 'fund'
      ? 'FUND'
      : charter.verdict === 'kill'
        ? 'STOP'
        : 'SHAPE';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Charter Business-Case Skeleton · Board-grade artifact',
    title: charter.moveLabel,
    tenantLine: `${charter.tenantLabel} · ${charter.tenantKey}`,
    lede:
      'A Charter business-case skeleton in 7 slides. Every figure is produced ' +
      "by the Moves Expert Kernel from Apex's audited substrate — costs and " +
      'value as ranges, never single points. The honest verdict is **shape**: ' +
      'fund the shaping work, but a critic blocker keeps the Move from being ' +
      'funded to build.',
    meta: [
      { label: 'Charter verdict', value: verdictWord },
      { label: 'Funding', value: 'Shaping only — not build' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: charter.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Charter-Skeleton-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
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
  display: grid; grid-template-columns: 1fr auto 1.6fr auto 1fr; gap: 8px;
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
.check-threshold strong { color: #8B1F0F; }
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
// The full document — the Charter Skeleton's seven slides handed to the deck
// shell. The shell owns the menu rail, the stage, the inline script and the
// print expansion; this renderer supplies the slides and the style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Charter Business-Case Skeleton as
 * one self-contained HTML document — a left-menu presentation deck.
 * Deterministic — a pure function of `generatedOn`.
 */
export function renderApexCharterSkeletonHtml(generatedOn: string): string {
  const charter = buildApexCharterSkeleton(generatedOn);

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
      sub: 'Fund shaping only — build blocked',
    },
    documentTitle: `${charter.moveLabel} — Charter Business-Case Skeleton — ${charter.tenantLabel}`,
  };

  const renderers: Array<(c: CharterSkeleton) => string> = [
    renderCharterAnswer,
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
