// Generic Move CFO Pack — self-contained HTML renderer.
//
// The generic sibling of `cfo-pack-renderer.ts` (the Apex reference CFO Pack
// renderer). It renders the financial-challenge deck for a REAL, originated
// Move from `buildMoveCfoPack(move)` — the kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The deck is a cover plus the seven
// CFO Pack sections (the answer, the case, assumptions, what would make it
// wrong, what not to fund yet, what Tower will measure, evidence and gaps),
// driven entirely by the kernel skeleton and the Function-Pack binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveCfoPackHtml` renders
// an honest UNBOUND deck — a single slide stating no curated Function Pack
// covers the function. It NEVER renders a fabricated CFO pack for an unbound
// Move, and the verdict is always the kernel's REAL recommendation.
//
// The Apex renderer (`renderApexCfoPackHtml`) is left untouched — this file is
// added alongside it.

import {
  buildMoveCfoPack,
  type MoveCfoPack,
  type MoveCfoPackResult,
  type MoveCfoSectionAnatomy,
  type MoveCfoEvidenceStrip,
} from './move-cfo-pack-model';
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
  economicsStrip,
  valueVsEffortSummary,
  sensitivityTornado,
  evidenceGapMatrix,
} from './svg-charts';

// The bound deck has a fixed slide count — the cover plus the 7 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveCfoEvidenceStrip['confidence']): string {
  const map: Record<MoveCfoEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveCfoSectionAnatomy): FooterFact[] {
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
  a: MoveCfoSectionAnatomy,
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

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

function usd(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `${sign}$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

// ===========================================================================
// Slide 1 — The answer.
// ===========================================================================

function renderTheAnswer(pack: MoveCfoPack): string {
  const s = pack.sections.theAnswer;
  const verdictClass =
    pack.verdict === 'fund'
      ? 'verdict-fund'
      : pack.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

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
    `</div>` +
    notes;
  return slide(s.anatomy, pack.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — The case.
// ===========================================================================

function renderTheCase(pack: MoveCfoPack): string {
  const s = pack.sections.theCase;

  const hero =
    lede(
      `Investment is ${usd(s.investmentLow)}–${usd(s.investmentHigh)}; the ` +
        `net value band is ${usd(s.netValueLow)}–${usd(s.netValueHigh)}` +
        (pack.monetisationBlocked
          ? ' — but that is a proxy ceiling, not a verified return, because ' +
            'the unit economics are a seed gap.'
          : ' — a planning range, honestly discounted by the mandatory ' +
            'six-factor haircut.'),
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
      pack.monetisationBlocked
        ? 'The value bar is hatched — it rests on a seed-gap proxy, so no ' +
            'payback or ROI is drawn. A single-point return is never shown.'
        : 'Both bars are planning ranges — the case is never shown as a ' +
            'single point.',
    ) +
    detail(
      'Where the value comes from, and the figures behind it',
      `<div class="mini-key mini-key-block">Value source</div>` +
        `<p class="mini-para">${esc(s.valueSource)}</p>` +
        `<table class="data-table">` +
        `<thead><tr><th>Figure</th><th class="num">Low</th>` +
        `<th class="num">Base</th><th class="num">High</th></tr></thead>` +
        `<tbody>` +
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
            ? 'not computable. Monetisation is blocked; the case models net ' +
              'value, not cash, and never crosses break-even.'
            : `${s.paybackMonths} months at the base case.`
        }</p>`,
    );
  return slide(s.anatomy, pack.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Assumptions.
// ===========================================================================

function renderAssumptions(pack: MoveCfoPack): string {
  const s = pack.sections.assumptions;

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
      `The top ${s.assumptions.length} assumptions are ranked by how much ` +
        `they move the case. ${s.proxyCount} of them are seed-gap proxies — ` +
        'assumptions standing in for tenant data that has not yet been ' +
        'captured.',
    ) +
    heroExhibit(
      'Exhibit 3 — Sensitivity stack: the assumptions that move the case',
      tornado,
      'A hatched bar is a seed-gap proxy; a solid bar is grounded. Finance ' +
        'should challenge the widest bars first.',
    ) +
    detail(
      'The case-moving assumptions — statement, owner, confidence, sensitivity',
      cards,
    );
  return slide(s.anatomy, pack.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — What would make it wrong.
// ===========================================================================

function renderWhatWouldMakeItWrong(pack: MoveCfoPack): string {
  const s = pack.sections.whatWouldMakeItWrong;

  const tornado = sensitivityTornado(s.drivers);

  const gapList =
    `<ul class="mini-list">` +
    s.monetisationGaps.map((g) => `<li>${esc(g)}</li>`).join('') +
    `</ul>`;

  const hero =
    lede(
      'A CFO Pack must show what breaks the case before it shows the upside. ' +
        (pack.monetisationBlocked
          ? 'For this Move the breakpoint and the case rest on the same ' +
            'missing number — the unit economics.'
          : 'The widest movers below are the assumptions to validate before ' +
            'the funding gate.'),
    ) +
    heroExhibit(
      'Exhibit 4 — Tornado: what swings the case, widest mover at top',
      tornado,
      'The widest movers are the seed-gap proxies. Until they are measured, ' +
        'the case can swing in either direction without warning.',
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
        `<td>The figure a CFO funds against</td></tr>` +
        `<tr><td>Base</td><td class="num">${usd(s.baseNetReturn)}</td>` +
        `<td>${
          pack.monetisationBlocked
            ? 'Proxy ceiling — rests on the seed gap'
            : 'Planning base case'
        }</td></tr>` +
        `<tr><td>Upside</td><td class="num">${usd(s.upsideNetReturn)}</td>` +
        `<td>Planning upper bound — not a commitment</td></tr>` +
        `</tbody></table>` +
        `<div class="mini-key mini-key-block mini-key-gap">` +
        `Monetisation gaps — what blocks a hard return</div>` +
        gapList,
    );
  return slide(s.anatomy, pack.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — What not to fund yet.
// ===========================================================================

function renderWhatNotToFundYet(pack: MoveCfoPack): string {
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
      'A CFO Pack without an explicit holdback list is a hard fail. These ' +
        `are the ${s.holdbacks.length} thing${
          s.holdbacks.length === 1 ? '' : 's'
        } finance should withhold at this gate — each with the condition ` +
        'that releases it.',
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
  return slide(s.anatomy, pack.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — What Tower will measure.
// ===========================================================================

function renderTowerMeasurement(pack: MoveCfoPack): string {
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
        `${s.metrics.length} Tower metric${
          s.metrics.length === 1 ? '' : 's'
        } ${
          measurable === 1 ? 'is' : 'are'
        } measurable today against a recorded baseline; the seed-gapped ` +
        'metrics are honestly carried as not-yet-measurable.',
    ) +
    heroExhibitHtml(
      'Exhibit 6 — Tower measurement table: metric, baseline, owner',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
        `<th>Owner</th></tr></thead>` +
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
  return slide(s.anatomy, pack.moveLabel, 7, hero);
}

// ===========================================================================
// Slide 7 — Evidence and gaps.
// ===========================================================================

function renderEvidenceAndGaps(pack: MoveCfoPack): string {
  const s = pack.sections.evidenceAndGaps;

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
        `<td>${esc(g.reason)}</td>` +
        `<td>${esc(g.expectedDataSource)}</td>` +
        `</tr>`,
    )
    .join('');
  const provenanceRows = s.provenance
    .map((p) => `<tr><td>${esc(p.note)}</td><td>${esc(p.basis)}</td></tr>`)
    .join('');

  const hero =
    lede(
      `Finance can audit this pack end to end. Baseline coverage is ` +
        `${s.coveragePct}% — ${s.recordedCount} metric${
          s.recordedCount === 1 ? '' : 's'
        } trace to a named source; every missing one is a declared seed gap, ` +
        'never a silent omission.',
    ) +
    heroExhibitHtml(
      'Exhibit 7 — Evidence / gap matrix: recorded facts against seed gaps',
      evidenceGapMatrix(s.matrix),
    ) +
    detail(
      'Source ledger, seed gaps and assumption provenance',
      (s.sources.length > 0
        ? `<div class="mini-key mini-key-block">Recorded metrics — ` +
          `measured, sourced, dated</div>` +
          `<table class="data-table">` +
          `<thead><tr><th>Recorded metric</th><th class="num">Value</th>` +
          `<th>Source</th><th class="num">As of</th>` +
          `<th class="num">Confidence</th></tr></thead>` +
          `<tbody>${sourceRows}</tbody>` +
          `</table>`
        : '') +
        (s.seedGaps.length > 0
          ? `<div class="mini-key mini-key-block mini-key-gap">Seed gaps — ` +
            `declared, never blank, named with their source</div>` +
            `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th>Why it is a gap</th>` +
            `<th>Expected data source</th></tr></thead>` +
            `<tbody>${gapRows}</tbody>` +
            `</table>`
          : '') +
        `<div class="mini-key mini-key-block">Assumption provenance</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Provenance note</th><th>Basis</th></tr></thead>` +
        `<tbody>${provenanceRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack.moveLabel, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function verdictWordOf(verdict: MoveCfoPack['verdict']): string {
  return verdict === 'fund'
    ? 'CAPITAL'
    : verdict === 'kill'
      ? 'REJECT'
      : 'SHAPING';
}

function renderCover(pack: MoveCfoPack): string {
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'CFO Pack · Kernel-derived for a real Move',
    title: pack.moveLabel,
    tenantLine: `${pack.tenantLabel} · ${pack.functionLabel}`,
    lede:
      'A CFO Pack in 8 slides — a financial challenge, not product advocacy. ' +
      'Every figure is produced by the Moves Expert Kernel for this Move. ' +
      'The verdict is the kernel’s **real recommendation**; value is a ' +
      'planning range; the do-not-fund holdbacks are explicit; and unrecorded ' +
      'metrics are named seed gaps, never papered over.',
    meta: [
      { label: 'Finance verdict', value: verdictWordOf(pack.verdict) },
      {
        label: 'Payback',
        value: pack.monetisationBlocked ? 'Blocked — seed gap' : 'See deck',
      },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: pack.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers the
// Move's function. NEVER a fabricated CFO pack.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'CFO Pack',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — CFO Pack — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'CFO Pack · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No CFO pack is ' +
        'fabricated.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade CFO Pack.',
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
        'kernel cannot produce a board-grade CFO Pack.',
      hero:
        lede(
          'AbarVa’s board-grade CFO Pack is grounded in a curated Domain ' +
            'Function Pack — the pack supplies the expected operating ' +
            'metrics, the value model and the haircut factors the kernel ' +
            'reasons against. Without one, the kernel will not fabricate a ' +
            'financial challenge.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade CFO Pack',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade CFO Pack for this ` +
        `Move, it must resolve to a curated Function Pack — a known industry ` +
        `and a classified function. This is surfaced as a gap, not papered ` +
        `over with a fabricated deck.</p>`,
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
      navPreview: 'Why this Move has no board-grade CFO Pack',
      render: () => noteSlide(),
    },
  ];

  return renderDeckDocument(meta, slides);
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
// Public entry — render the generic Move CFO Pack.
// ===========================================================================

/**
 * Render the generic Move CFO Pack as one self-contained HTML document.
 * Projects the deck from `buildMoveCfoPack`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * deck. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveCfoPackHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveCfoPackResult = buildMoveCfoPack(move, generatedOn);

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
function renderBoundDocument(pack: MoveCfoPack): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'CFO Pack',
    moveLabel: pack.moveLabel,
    tenantLabel: pack.tenantLabel,
    tenantKey: pack.tenantKey,
    generatedOn: pack.generatedOn,
    verdict: {
      label: verdictWordOf(pack.verdict),
      sub: pack.monetisationBlocked
        ? 'Payback blocked — capital withheld'
        : 'Kernel recommendation',
    },
    documentTitle: `${pack.moveLabel} — CFO Pack — ${pack.tenantLabel}`,
  };

  const renderers: Array<(p: MoveCfoPack) => string> = [
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
