// Board-grade CFO Pack — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack,
// the Discover Brief and the Charter Skeleton, composed by the shared
// `deck-shell` module. The reader flips slides; for print an `@media print`
// block expands the deck into the full document.
//
// The deck is a cover plus the seven blueprint §10 CFO Pack sections:
//   1. The answer        — what is finance being asked to approve?
//   2. The case          — why does this create value?
//   3. Assumptions       — the top five assumptions, owned.
//   4. What would make it wrong — downside, breakpoints, monetisation gaps.
//   5. What not to fund yet — blocked scope, unfunded autonomy.
//   6. What Tower will measure — metrics, baseline, target, cadence.
//   7. Evidence and gaps — source ledger, seed gaps, provenance.
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant hero exhibit, two to four lines of prose, and
// a quiet footer (decision role / evidence / owner / next gate).
//
// All CSS is inlined, every exhibit is an inline SVG, the slide-switch script
// is inline — the file opens offline. The renderer is PURE: a deterministic
// function of the kernel view-model. It is a FINANCIAL CHALLENGE, not product
// advocacy — it renders the honest verdict (`shape`), the blocked payback, the
// explicit do-not-fund holdbacks, and the declared seed gaps.

import {
  buildApexCfoPack,
  type CfoPack,
  type CfoSectionAnatomy,
  type CfoEvidenceStrip,
} from './cfo-pack-model';
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
  valueVsEffortSummary,
  sensitivityTornado,
  evidenceGapMatrix,
} from './svg-charts';

// The deck has a fixed slide count — the cover plus the seven §10 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: CfoEvidenceStrip['confidence']): string {
  const map: Record<CfoEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — decision role / evidence / owner / next gate. */
function footerFacts(a: CfoSectionAnatomy): FooterFact[] {
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
  a: CfoSectionAnatomy,
  pack: CfoPack,
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

/** A small chevron-collapsible detail strip — dense detail, one click away. */
function detail(summary: string, body: string): string {
  return detailStrip(summary, body);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
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
// Slide 1 — The answer.
// ===========================================================================

function renderTheAnswer(pack: CfoPack): string {
  const s = pack.sections.theAnswer;
  const verdictClass =
    pack.verdict === 'fund'
      ? 'verdict-fund'
      : pack.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Finance verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — The finance decision at a glance',
      economicsStrip(s.tiles),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Funding ask</span>` +
    `<span>${esc(s.fundingAsk)}</span>` +
    `</div>` +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Open blocker</span>` +
    `<span>${esc(s.blocker)}</span>` +
    `</div>`;
  return slide(s.anatomy, pack, 2, hero);
}

// ===========================================================================
// Slide 2 — The case.
// ===========================================================================

function renderTheCase(pack: CfoPack): string {
  const s = pack.sections.theCase;
  const haircutPct = Math.round(s.totalHaircut * 100);

  const hero =
    lede(
      `Investment is ${usd(s.investmentLow)}–${usd(s.investmentHigh)}; the ` +
        `net value band is ${usd(s.netValueLow)}–${usd(s.netValueHigh)} — but ` +
        `that is a proxy ceiling, after a mandatory ${haircutPct}% haircut, ` +
        'not a verified return.',
    ) +
    heroExhibit(
      'Exhibit 2 — Value against investment: both as ranges',
      valueVsEffortSummary({
        effortLow: s.investmentLow,
        effortPoint: s.investmentPoint,
        effortHigh: s.investmentHigh,
        valueLow: s.netValueLow,
        valuePoint: s.netValuePoint,
        valueHigh: s.netValueHigh,
        monetisationBlocked: pack.monetisationBlocked,
      }),
      'The value bar is hatched — it rests on a seed-gap proxy, so no ' +
        'payback or ROI is drawn. A single-point return is never shown.',
    ) +
    detail(
      'Where the value comes from, and the haircut taken',
      `<div class="mini-key mini-key-block">Value source</div>` +
        `<p class="mini-para">${esc(s.valueSource)}</p>` +
        `<table class="data-table">` +
        `<thead><tr><th>Figure</th><th class="num">Low</th>` +
        `<th class="num">Base</th><th class="num">High</th></tr></thead>` +
        `<tbody>` +
        `<tr><td>Gross value (3-yr, pre-haircut)</td>` +
        `<td class="num">${usd(s.grossValueLow)}</td>` +
        `<td class="num">—</td>` +
        `<td class="num">${usd(s.grossValueHigh)}</td></tr>` +
        `<tr class="row-proxy"><td>Net value (3-yr, post-haircut)</td>` +
        `<td class="num">${usd(s.netValueLow)}</td>` +
        `<td class="num">${usd(s.netValuePoint)}</td>` +
        `<td class="num">${usd(s.netValueHigh)}</td></tr>` +
        `<tr><td>Investment</td>` +
        `<td class="num">${usd(s.investmentLow)}</td>` +
        `<td class="num">${usd(s.investmentPoint)}</td>` +
        `<td class="num">${usd(s.investmentHigh)}</td></tr>` +
        `</tbody></table>` +
        `<p class="mini-para">Payback — ${
          s.paybackMonths === null
            ? 'not computable. Monetisation is blocked; the cumulative cash ' +
              'lines model net value, not cash, and never cross break-even.'
            : `${s.paybackMonths} months at the base case.`
        }</p>`,
    );
  return slide(s.anatomy, pack, 3, hero);
}

// ===========================================================================
// Slide 3 — Assumptions.
// ===========================================================================

function renderAssumptions(pack: CfoPack): string {
  const s = pack.sections.assumptions;

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
      `The top five assumptions are ranked by how much they move the case. ` +
        `${s.proxyCount} of them are seed-gap proxies — assumptions standing ` +
        'in for tenant data that has not yet been captured.',
    ) +
    heroExhibit(
      'Exhibit 3 — Sensitivity stack: the assumptions that move the case',
      tornado,
      'A hatched bar is a seed-gap proxy; a solid bar is grounded. Finance ' +
        'should challenge the widest bars first.',
    ) +
    detail(
      'The five assumptions — statement, owner, confidence and sensitivity',
      cards,
    );
  return slide(s.anatomy, pack, 4, hero);
}

// ===========================================================================
// Slide 4 — What would make it wrong.
// ===========================================================================

function renderWhatWouldMakeItWrong(pack: CfoPack): string {
  const s = pack.sections.whatWouldMakeItWrong;

  const tornado = sensitivityTornado(s.drivers);

  const gapList =
    `<ul class="mini-list">` +
    s.monetisationGaps.map((g) => `<li>${esc(g)}</li>`).join('') +
    `</ul>`;

  const hero =
    lede(
      'A CFO Pack must show what breaks the case before it shows the upside. ' +
        'For this Move the breakpoint and the case rest on the same missing ' +
        'number — the unit economics.',
    ) +
    heroExhibit(
      'Exhibit 4 — Tornado: what swings the case, widest mover at top',
      tornado,
      'The widest movers are the two seed-gap proxies. Until they are ' +
        'measured, the case can swing in either direction without warning.',
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">What breaks the case</span>` +
    `<span>${esc(s.whatBreaksTheCase)}</span>` +
    `</div>` +
    detail(
      'The downside read, the breakpoints and the monetisation gaps',
      `<div class="mini-key mini-key-block">Downside read</div>` +
        `<p class="mini-para">${esc(s.downsideRead)}</p>` +
        `<div class="mini-key mini-key-block">` +
        `Net return — conservative / base / upside</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Scenario</th><th class="num">Net return</th>` +
        `<th>Read</th></tr></thead>` +
        `<tbody>` +
        `<tr class="row-proxy"><td>Conservative</td>` +
        `<td class="num">${usd(s.conservativeNetReturn)}</td>` +
        `<td>Proxy figure — not a verified downside</td></tr>` +
        `<tr><td>Base</td><td class="num">${usd(s.baseNetReturn)}</td>` +
        `<td>Proxy ceiling — rests on the seed gap</td></tr>` +
        `<tr><td>Upside</td><td class="num">${usd(s.upsideNetReturn)}</td>` +
        `<td>Proxy — not a fundable upside</td></tr>` +
        `</tbody></table>` +
        `<div class="mini-key mini-key-block mini-key-gap">` +
        `Monetisation gaps — what blocks a hard return</div>` +
        gapList,
    );
  return slide(s.anatomy, pack, 5, hero);
}

// ===========================================================================
// Slide 5 — What not to fund yet.
// ===========================================================================

function renderWhatNotToFundYet(pack: CfoPack): string {
  const s = pack.sections.whatNotToFundYet;

  const checklist =
    `<div class="checklist">` +
    s.holdbacks
      .map(
        (h) =>
          `<div class="check-row check-hold">` +
          `<div class="check-mark">` +
          `<span class="chip chip-bad">Withhold</span></div>` +
          `<div class="check-body">` +
          `<div class="check-label">${esc(h.title)}</div>` +
          `<div class="check-detail">${esc(h.detail)}</div>` +
          `<div class="check-detail check-threshold">` +
          `<strong>Release condition</strong> — ${esc(h.releaseCondition)} ` +
          `<span class="check-owner">Owner: ${esc(h.owner)}</span></div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      'A CFO Pack without an explicit holdback list is a blueprint §10 hard ' +
        'fail. These are the four things finance should withhold at this ' +
        'gate — each with the condition that releases it.',
    ) +
    heroExhibitHtml(
      'Exhibit 5 — Do-not-fund checklist: what to withhold, and why',
      checklist,
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">The shape of the ask</span>` +
    `<span>Approving the shaping spend is not approving the build. Each ` +
    `holdback above is released only against its stated condition — not ` +
    `bundled into a single capital decision.</span>` +
    `</div>`;
  return slide(s.anatomy, pack, 6, hero);
}

// ===========================================================================
// Slide 6 — What Tower will measure.
// ===========================================================================

function renderTowerMeasurement(pack: CfoPack): string {
  const s = pack.sections.towerMeasurement;

  const rows = s.metrics
    .map(
      (m) =>
        `<tr class="${m.isSeedGap ? 'row-proxy' : ''}">` +
        `<td>${esc(m.metric)}${
          m.isSeedGap
            ? ' <span class="chip chip-bad">Seed gap</span>'
            : ' <span class="chip chip-good">Measurable</span>'
        }</td>` +
        `<td class="num">${esc(m.baseline)}</td>` +
        `<td class="num">${esc(m.target)}</td>` +
        `<td>${esc(m.cadence)}</td>` +
        `<td>${esc(m.owner)}</td>` +
        `</tr>`,
    )
    .join('');

  const readinessRows = s.metrics
    .map(
      (m) =>
        `<tr class="${m.isSeedGap ? 'row-proxy' : ''}">` +
        `<td>${esc(m.metric)}</td>` +
        `<td>${esc(m.readiness)}</td>` +
        `</tr>`,
    )
    .join('');

  const measurable = s.metrics.filter((m) => !m.isSeedGap).length;

  const hero =
    lede(
      `Value will be proven, not asserted. ${measurable} of the ` +
        `${s.metrics.length} Tower metrics are measurable today against a ` +
        'recorded baseline; the financial metric is honestly carried as ' +
        'not-yet-measurable.',
    ) +
    heroExhibitHtml(
      'Exhibit 6 — Tower measurement table: metric, baseline, target, cadence',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
        `<th class="num">Target</th><th>Cadence</th><th>Owner</th>` +
        `</tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    ) +
    detail(
      'Measurement readiness — what must be true for Tower to verify each',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th>Readiness note</th></tr></thead>` +
        `<tbody>${readinessRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 7, hero);
}

// ===========================================================================
// Slide 7 — Evidence and gaps.
// ===========================================================================

function renderEvidenceAndGaps(pack: CfoPack): string {
  const s = pack.sections.evidenceAndGaps;

  const matrixRows = [
    ...s.sources.map((m) => ({
      label: m.metric,
      recorded: true,
      detail: `${m.value} · ${m.source} · ${m.confidence}`,
    })),
    ...s.seedGaps.map((g) => ({
      label: g.metric,
      recorded: false,
      detail: g.reason,
    })),
  ];

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
  const gapRows = s.seedGaps
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.metric)} ` +
        `<span class="chip chip-bad">Seed gap</span></td>` +
        `<td colspan="3">${esc(g.reason)}</td>` +
        `<td class="num">As of ${esc(g.asOf)}</td>` +
        `</tr>`,
    )
    .join('');
  const provenanceRows = s.provenance
    .map(
      (p) =>
        `<tr><td>${esc(p.note)}</td><td>${esc(p.basis)}</td></tr>`,
    )
    .join('');

  const hero =
    lede(
      'Finance can audit this pack end to end. Every recorded number names ' +
        'its source and confidence; every missing one is a declared seed ' +
        'gap, never a silent omission.',
    ) +
    heroExhibitHtml(
      'Exhibit 7 — Evidence / gap matrix: recorded facts against seed gaps',
      evidenceGapMatrix(matrixRows),
    ) +
    detail(
      'Source ledger, seed gaps and assumption provenance',
      `<table class="data-table">` +
        `<thead><tr><th>Recorded metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th></tr></thead>` +
        `<tbody>${sourceRows}${gapRows}</tbody>` +
        `</table>` +
        `<div class="mini-key mini-key-block">Assumption provenance</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Provenance note</th><th>Basis</th></tr></thead>` +
        `<tbody>${provenanceRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pack: CfoPack): string {
  const verdictWord =
    pack.verdict === 'fund'
      ? 'CAPITAL'
      : pack.verdict === 'kill'
        ? 'REJECT'
        : 'SHAPING';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'CFO Pack · Board-grade artifact',
    title: pack.moveLabel,
    tenantLine: `${pack.tenantLabel} · ${pack.tenantKey}`,
    lede:
      'A CFO Pack in 8 slides — a financial challenge, not product advocacy. ' +
      "Every figure is produced by the Moves Expert Kernel from Apex's " +
      'audited substrate. The honest verdict is **approve shaping spend ' +
      'only**: payback is blocked by a seed gap, so capital is withheld and ' +
      'the holdbacks are explicit.',
    meta: [
      { label: 'Finance verdict', value: verdictWord },
      { label: 'Payback', value: 'Blocked — seed gap' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: pack.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// CFO-Pack-specific styles — appended after the shared deck CSS. These reuse
// the locked design tokens; they add no new palette colour.
// ===========================================================================

function cfoStyles(): string {
  return `
/* --- CFO Pack — holdback / threshold line. --- */
.check-threshold { margin-top: 5px; color: #2c2a26; }
.check-threshold strong { color: #1B5E20; }
.check-owner { color: #8b8678; font-weight: 600; }
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
`;
}

// ===========================================================================
// The full document — the CFO Pack's eight slides handed to the deck shell.
// The shell owns the menu rail, the stage, the inline script and the print
// expansion; this renderer supplies the slides and the style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing CFO Pack as one self-contained
 * HTML document — a left-menu presentation deck. Deterministic — a pure
 * function of `generatedOn`.
 */
export function renderApexCfoPackHtml(generatedOn: string): string {
  const pack = buildApexCfoPack(generatedOn);

  const verdictWord =
    pack.verdict === 'fund'
      ? 'CAPITAL'
      : pack.verdict === 'kill'
        ? 'REJECT'
        : 'SHAPING';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'CFO Pack',
    moveLabel: pack.moveLabel,
    tenantLabel: pack.tenantLabel,
    tenantKey: pack.tenantKey,
    generatedOn: pack.generatedOn,
    verdict: {
      label: verdictWord,
      sub: 'Payback blocked — capital withheld',
    },
    documentTitle: `${pack.moveLabel} — CFO Pack — ${pack.tenantLabel}`,
  };

  const renderers: Array<(p: CfoPack) => string> = [
    renderTheAnswer,
    renderTheCase,
    renderAssumptions,
    renderWhatWouldMakeItWrong,
    renderWhatNotToFundYet,
    renderTowerMeasurement,
    renderEvidenceAndGaps,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'CFO Pack',
      render: () => renderCover(pack),
    },
    ...pack.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](pack),
    })),
  ];

  // The deck shell composes the full document; the CFO-specific styles are
  // injected just before `</style>` so they sit after the shared deck CSS.
  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${cfoStyles()}</style>`);
}
