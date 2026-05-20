// Board-grade Discover Brief — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack,
// composed by the shared `deck-shell` module. The reader flips slides; for
// print an `@media print` block expands the deck into the full document.
//
// The deck is a cover plus the six blueprint §5 Discover Brief sections:
//   1. Decision snapshot     — is this a real problem worth shaping?
//   2. Current-state baseline — what do we actually know today?
//   3. Pain and opportunity  — where is value likely hiding?
//   4. Evidence gaps         — what prevents honest sizing?
//   5. Go/no-go gate         — what would make us stop?
//   6. Appendix              — sources and assumptions.
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant hero exhibit, two to four lines of prose, and
// a quiet footer (decision role / evidence / owner / next gate).
//
// All CSS is inlined, every exhibit is an inline SVG, the slide-switch script
// is inline — the file opens offline. The renderer is PURE: a deterministic
// function of the kernel view-model. It changes no kernel logic; it renders
// Discover's real verdict (`reshape`), the real baseline, and the declared
// seed gaps — never an invented value.

import {
  buildApexDiscoverBrief,
  type DiscoverBrief,
  type BriefSectionAnatomy,
  type BriefEvidenceStrip,
} from './discover-brief-model';
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
  baselineCoverageMeter,
  opportunityRangeBar,
  gapClosureQueue,
  economicsStrip,
} from './svg-charts';

// The deck has a fixed slide count — the cover plus the six §5 sections.
const SLIDE_COUNT = 7;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: BriefEvidenceStrip['confidence']): string {
  const map: Record<BriefEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — decision role / evidence / owner / next gate. */
function footerFacts(a: BriefSectionAnatomy): FooterFact[] {
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
  a: BriefSectionAnatomy,
  brief: DiscoverBrief,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: brief.moveLabel,
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

// ===========================================================================
// Slide 1 — Decision snapshot.
// ===========================================================================

function renderDecisionSnapshot(brief: DiscoverBrief): string {
  const s = brief.sections.decisionSnapshot;
  const verdictClass =
    brief.verdict === 'go'
      ? 'verdict-fund'
      : brief.verdict === 'no-go'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Discover verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Discover decision at a glance',
      economicsStrip(s.tiles),
    ) +
    `<div class="brief-problem">` +
    `<span class="brief-problem-tag">Problem statement</span>` +
    `<span>${esc(s.problem)}</span>` +
    `</div>` +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Next evidence request</span>` +
    `<span>${esc(s.nextEvidenceRequest)}</span>` +
    `</div>`;
  return slide(s.anatomy, brief, 2, hero);
}

// ===========================================================================
// Slide 2 — Current-state baseline.
// ===========================================================================

function renderCurrentStateBaseline(brief: DiscoverBrief): string {
  const s = brief.sections.currentStateBaseline;

  const metricRows = s.metrics
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
  // Seed gaps render in the SAME table — explicit gap rows, never blank.
  const gapRows = s.seedGaps
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.metric)} ` +
        `<span class="chip chip-bad">Seed gap</span></td>` +
        `<td class="num">Not recorded</td>` +
        `<td colspan="2">${esc(g.reason)}</td>` +
        `<td class="num"><span class="chip chip-bad">none</span></td>` +
        `<td>As of ${esc(g.asOf)} — declared, not blank.</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Baseline coverage is ${s.coveragePct}% — ${s.recordedCount} metrics ` +
        `are measured, sourced and dated; ${s.seedGapCount} are declared ` +
        'seed gaps. Every recorded metric carries a source and a confidence; ' +
        'no missing metric is left blank.',
    ) +
    heroExhibit(
      'Exhibit 2 — Baseline coverage: recorded against seed gaps',
      baselineCoverageMeter({
        recorded: s.recordedCount,
        seedGaps: s.seedGapCount,
        weakestConfidence: s.weakestConfidence,
      }),
      'The recorded arc is the share of the metrics this Move needs that ' +
        'are actually measured; the remainder are declared seed gaps.',
    ) +
    detail(
      'Metric source table — every recorded metric and every seed gap',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th><th>Caveat carried forward</th>` +
        `</tr></thead>` +
        `<tbody>${metricRows}${gapRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, brief, 3, hero);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

// ===========================================================================
// Slide 3 — Pain and opportunity.
// ===========================================================================

function renderPainAndOpportunity(brief: DiscoverBrief): string {
  const s = brief.sections.painAndOpportunity;

  const painCards =
    `<div class="pain-cards">` +
    s.painThemes
      .map(
        (p) =>
          `<div class="pain-card">` +
          `<div class="pain-theme">${esc(p.theme)}</div>` +
          `<div class="pain-detail">${esc(p.detail)}</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const expressLabel =
    s.expressibleAs === 'dollars'
      ? 'Dollars'
      : s.expressibleAs === 'operational_hours'
        ? 'Operational hours'
        : 'Directional only';

  const hero =
    lede(
      'The pain is real and measured: containment is stuck, handle time is ' +
        'rising and repeat transfers are high. The value is genuine — but ' +
        'with the monetization inputs missing it can only be stated ' +
        'directionally, never as a dollar figure.',
    ) +
    heroExhibit(
      `Exhibit 3 — Opportunity range: ${expressLabel.toLowerCase()}`,
      opportunityRangeBar({
        low: 0.18,
        base: 0.46,
        high: 0.82,
        lowLabel: 'Conservative',
        baseLabel: 'Base direction',
        highLabel: 'Upside',
        directionalOnly: s.directionalOnly,
        caveat: s.caveat,
      }),
      'The band has no dollar axis — it is a directional read of where ' +
        'value is likely to sit, not a sized estimate.',
    ) +
    detail(
      'Pain themes and the constraints that bound the solution space',
      painCards +
        `<div class="mini-key mini-key-block">Known constraints</div>` +
        `<ul class="mini-list">` +
        s.constraints.map((c) => `<li>${esc(c)}</li>`).join('') +
        `</ul>` +
        `<div class="mini-key mini-key-block">Opportunity statement</div>` +
        `<p class="mini-para">${esc(s.opportunityStatement)}</p>`,
    );
  return slide(s.anatomy, brief, 4, hero);
}

// ===========================================================================
// Slide 4 — Evidence gaps.
// ===========================================================================

function renderEvidenceGaps(brief: DiscoverBrief): string {
  const s = brief.sections.evidenceGaps;

  const gapRows = s.gaps
    .slice()
    .sort((a, b) => b.impact - a.impact)
    .map(
      (g) =>
        `<tr class="${g.blocksSizing ? 'row-proxy' : ''}">` +
        `<td>${esc(g.label)}${
          g.blocksSizing
            ? ' <span class="chip chip-bad">Blocks sizing</span>'
            : ' <span class="chip chip-warn">Informs sizing</span>'
        }</td>` +
        `<td>${esc(g.owner)}</td>` +
        `<td class="num">${esc(g.due)}</td>` +
        `<td>${esc(g.decisionImpact)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'Four metrics are open seed gaps. Two of them — annual contact volume ' +
        'and cost-per-contact — block honest sizing; closing them is the ' +
        'work that converts this Discover into a fundable Charter case.',
    ) +
    heroExhibit(
      'Exhibit 4 — Gap-closure queue: open gaps by decision impact',
      gapClosureQueue(
        s.gaps.map((g) => ({
          label: g.label,
          owner: g.owner,
          due: g.due,
          impact: g.impact,
          blocksSizing: g.blocksSizing,
        })),
      ),
      'The queue is sorted by decision impact — the widest bar is the next ' +
        'evidence ask. Sizing-blocking gaps outrank informing gaps.',
    ) +
    detail(
      'Evidence request queue — owner, due date and decision impact',
      `<table class="data-table">` +
        `<thead><tr><th>Open evidence gap</th><th>Owner</th>` +
        `<th class="num">Due</th><th>Decision impact</th></tr></thead>` +
        `<tbody>${gapRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, brief, 5, hero);
}

// ===========================================================================
// Slide 5 — Go/no-go gate.
// ===========================================================================

function renderGoNoGoGate(brief: DiscoverBrief): string {
  const s = brief.sections.goNoGoGate;

  const stateChip = (st: 'pass' | 'shape' | 'stop'): string => {
    if (st === 'pass') return '<span class="chip chip-good">Pass</span>';
    if (st === 'stop') return '<span class="chip chip-bad">Stop</span>';
    return '<span class="chip chip-warn">Reshape</span>';
  };
  const checkClass = (st: 'pass' | 'shape' | 'stop'): string =>
    st === 'pass'
      ? 'check-approve'
      : st === 'stop'
        ? 'check-hold'
        : 'check-condition';
  const checklist =
    `<div class="checklist">` +
    s.killChecks
      .map(
        (c) =>
          `<div class="check-row ${checkClass(c.state)}">` +
          `<div class="check-mark">${stateChip(c.state)}</div>` +
          `<div class="check-body">` +
          `<div class="check-label">${esc(killTitle(c.code))}</div>` +
          `<div class="check-detail">${esc(c.condition)}</div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const firedShape = s.killChecks.filter((c) => c.state === 'shape').length;
  const firedStop = s.killChecks.filter((c) => c.state === 'stop').length;

  const hero =
    lede(
      `Every kill trigger in the contact-centre Discover playbook is tested ` +
        `here. ${firedStop} stop-trigger${firedStop === 1 ? '' : 's'} fired ` +
        `and ${firedShape} reshape-trigger${firedShape === 1 ? '' : 's'} ` +
        'fired — so the Move is not killed, but it cannot advance clean.',
    ) +
    heroExhibitHtml(
      'Exhibit 5 — Kill checklist: what would stop or reshape the Move',
      checklist,
    ) +
    detail(
      'Go/no-go rationale and the fix conditions before Charter',
      `<div class="mini-key mini-key-block">Go/no-go rationale</div>` +
        `<p class="mini-para">${esc(s.rationale)}</p>` +
        `<div class="mini-key mini-key-block mini-key-gap">` +
        `Fix conditions — must be met before the Charter gate</div>` +
        `<ul class="mini-list">` +
        s.fixConditions.map((c) => `<li>${esc(c)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, brief, 6, hero);
}

/** A short, human title for a kill-trigger code. */
function killTitle(code: string): string {
  const map: Record<string, string> = {
    kill_cc_no_unit_cost: 'Cost per contact not recorded',
    kill_cc_no_volume: 'Annual contact volume not recorded',
    kill_cc_compliance_blocks: 'Privacy review removes the core mechanism',
    kill_cc_no_capacity: 'No capacity headroom for labour takeout',
    kill_no_measured_problem: 'No measured problem to size',
    kill_no_sponsor: 'No accountable executive sponsor',
    kill_baseline_too_thin: 'Baseline too thin to size honestly',
  };
  return map[code] ?? code;
}

// ===========================================================================
// Slide 6 — Appendix.
// ===========================================================================

function renderAppendix(brief: DiscoverBrief): string {
  const s = brief.sections.appendix;

  const sourceRows = s.sources
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
  const assumptionRows = s.assumptions
    .map(
      (a) =>
        `<tr>` +
        `<td>${esc(a.note)}</td>` +
        `<td>${esc(a.basis)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'This brief makes no claim it cannot trace. Every recorded number ' +
        'below names its source and confidence; every assumption names its ' +
        'basis. Charter inherits this ledger unchanged.',
    ) +
    heroExhibitHtml(
      'Exhibit 6 — Source ledger: every recorded metric and its provenance',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th></tr></thead>` +
        `<tbody>${sourceRows}</tbody>` +
        `</table>`,
    ) +
    detail(
      'Assumption and method notes carried into Charter',
      `<table class="data-table">` +
        `<thead><tr><th>Assumption / method note</th><th>Basis</th>` +
        `</tr></thead>` +
        `<tbody>${assumptionRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, brief, 7, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(brief: DiscoverBrief): string {
  const verdictWord =
    brief.verdict === 'go'
      ? 'GO'
      : brief.verdict === 'no-go'
        ? 'NO-GO'
        : 'RESHAPE';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Discover Brief · Board-grade artifact',
    title: brief.moveLabel,
    tenantLine: `${brief.tenantLabel} · ${brief.tenantKey}`,
    lede:
      'A Discover brief in 7 slides. Every figure is produced by the Moves ' +
      "Expert Kernel from Apex's audited substrate. Where data is not " +
      'recorded it is declared a seed gap — never invented. The honest ' +
      'verdict is **reshape**: the problem is real, but two seed gaps must ' +
      'close before it can be sized.',
    meta: [
      { label: 'Discover verdict', value: verdictWord },
      { label: 'Opportunity', value: 'Directional — seed gaps' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: brief.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Discover-Brief-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function briefStyles(): string {
  return `
/* --- Discover Brief — problem statement callout. --- */
.brief-problem {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 13px 16px; border-radius: 5px; font-size: 12.5px;
  line-height: 1.55; margin: 16px 0; background: #fff;
  border: 1px solid #e0dbcd; border-left: 3px solid #0b4a91;
}
.brief-problem-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; white-space: nowrap; padding-top: 2px;
  color: #0b4a91;
}
/* --- Pain theme cards. --- */
.pain-cards {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
  margin: 8px 0 4px;
}
.pain-card {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 15px;
  background: #fff; border-top: 3px solid #a8533a;
}
.pain-theme {
  font-size: 12px; font-weight: 800; color: #1c1a17; line-height: 1.35;
}
.pain-detail {
  font-size: 11px; color: #5b5852; margin-top: 6px; line-height: 1.5;
}
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
@media (max-width: 880px) {
  .pain-cards { grid-template-columns: 1fr; }
}
`;
}

// ===========================================================================
// The full document — the Discover Brief's seven slides handed to the deck
// shell. The shell owns the menu rail, the stage, the inline script and the
// print expansion; this renderer supplies the slides and the brief-specific
// style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Discover Brief as one
 * self-contained HTML document — a left-menu presentation deck. Deterministic
 * — a pure function of `generatedOn`.
 */
export function renderApexDiscoverBriefHtml(generatedOn: string): string {
  const brief = buildApexDiscoverBrief(generatedOn);

  const verdictWord =
    brief.verdict === 'go'
      ? 'GO'
      : brief.verdict === 'no-go'
        ? 'NO-GO'
        : 'RESHAPE';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Discover Brief',
    moveLabel: brief.moveLabel,
    tenantLabel: brief.tenantLabel,
    tenantKey: brief.tenantKey,
    generatedOn: brief.generatedOn,
    verdict: {
      label: verdictWord,
      sub: 'Opportunity directional — seed gaps',
    },
    documentTitle: `${brief.moveLabel} — Discover Brief — ${brief.tenantLabel}`,
  };

  const renderers: Array<(b: DiscoverBrief) => string> = [
    renderDecisionSnapshot,
    renderCurrentStateBaseline,
    renderPainAndOpportunity,
    renderEvidenceGaps,
    renderGoNoGoGate,
    renderAppendix,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Discover Brief',
      render: () => renderCover(brief),
    },
    ...brief.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](brief),
    })),
  ];

  // The deck shell composes the full document; the brief-specific styles are
  // injected just before `</style>` so they sit after the shared deck CSS.
  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${briefStyles()}</style>`);
}
