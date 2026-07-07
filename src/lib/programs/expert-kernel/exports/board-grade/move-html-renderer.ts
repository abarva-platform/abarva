// Generic Move Costed Business-Case Pack — self-contained HTML renderer.
//
// The generic sibling of `html-renderer.ts` (the Apex reference renderer).
// It renders the deck for a REAL, originated Move from
// `buildMoveCostedBusinessCasePack(move)` — the kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The only difference from the Apex
// renderer is the section set: the generic deck has seven sections (board
// answer, the inherited curated outline, investment, value, sensitivity,
// evidence & gaps, recommendation), driven entirely by the kernel skeleton
// and the Function-Pack binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveCostedBusinessCaseHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated business
// case for an unbound Move.
//
// The Apex renderer (`renderApexCostedBusinessCaseHtml`) is left untouched —
// this file is added alongside it.

import {
  buildMoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePack,
  type MoveCostedBusinessCasePackOptions,
  type MoveCostedBusinessCaseResult,
  type MoveSectionAnatomy,
  type MoveEvidenceStrip,
} from './move-pack-model';
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
import { renderVerdictExplainerChip } from './verdict-explainer';
import {
  investmentWaterfall,
  costStack,
  valueBridge,
  sensitivityTornado,
  scenarioRangeChart,
  baselineCoverageMeter,
  evidenceGapMatrix,
  economicsStrip,
  compactUsd,
} from './svg-charts';

// The bound deck has a fixed slide count — the cover plus the 7 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveEvidenceStrip['confidence']): string {
  const map: Record<MoveEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveSectionAnatomy): FooterFact[] {
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
  a: MoveSectionAnatomy,
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

// ===========================================================================
// Slide 1 — Board answer.
// ===========================================================================

function renderBoardAnswer(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.boardAnswer;
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
    `<div class="board-card-tag">Kernel verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(pack.verdictExplainerChip) +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Headline economics, from the kernel',
      economicsStrip(s.economics),
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Primary blocker</span>` +
    `<span>${esc(s.blocker)}</span>` +
    `</div>` +
    notes;

  return slide(s.anatomy, pack.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Inherited curated outline.
// ===========================================================================

function renderInheritedOutline(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.inheritedOutline;
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
    `<div class="context-band-label">Inherited curated outline</div>` +
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
      `This Costed Business-Case Pack inherits the curated ${esc(
        pack.functionLabel,
      )} business-case outline from the bound Domain Function Pack. The ` +
        `agent does not improvise the structure — every section below is a ` +
        `curated, function-calibrated heading.`,
    ) +
    heroExhibitHtml(
      `Exhibit 2 — The inherited ${esc(pack.functionLabel)} outline`,
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
  return slide(s.anatomy, pack.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Investment case.
// ===========================================================================

function renderInvestmentCase(pack: MoveCostedBusinessCasePack): string {
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

  const hero =
    lede(
      `The build is a ${compactUsd(s.investmentRange.point)} base planning ` +
        `estimate — range ${compactUsd(s.investmentRange.low)} to ${compactUsd(
          s.investmentRange.high,
        )}. It is derived from the Function Pack archetypes on a researched ` +
        `benchmark rate card — a planning range, NOT a quote.`,
    ) +
    (s.waterfall.length > 0
      ? heroExhibit(
          `Exhibit 3 — Investment waterfall: where the ${compactUsd(
            s.investmentRange.point,
          )} base goes`,
          investmentWaterfall(s.waterfall),
        )
      : '') +
    detail(
      'Cost stack and the per-workstream breakdown',
      (s.costStack.length > 0
        ? heroExhibit(
            'Cost stack — build, run and business-change split',
            costStack(s.costStack),
            s.buildVsChangeNote,
          )
        : '') +
        `<table class="data-table">` +
        `<thead><tr><th>Workstream</th><th class="num">Base cost</th>` +
        `<th class="num">Headcount</th><th class="num">Duration</th>` +
        `<th class="num">AI-agent split</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `<tfoot><tr><td>Total — base / range</td>` +
        `<td class="num">${compactUsd(s.investmentRange.point)}</td>` +
        `<td class="num" colspan="3">${compactUsd(
          s.investmentRange.low,
        )} – ${compactUsd(s.investmentRange.high)} (planning range)</td>` +
        `</tr></tfoot>` +
        `</table>`,
    );
  return slide(s.anatomy, pack.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — Value case.
// ===========================================================================

function renderValueCase(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.valueCase;

  const adoptionRows = s.adoption
    .map(
      (y) =>
        `<tr>` +
        `<td>${esc(y.label)}</td>` +
        `<td class="num">${Math.round(y.adoption * 100)}%</td>` +
        `<td class="num">${compactUsd(y.netValue)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      pack.monetisationBlocked
        ? `Net 3-year value is carried as a planning range — point ` +
          `${compactUsd(s.netValue)}. It rests on the Function Pack's ` +
          `curated benchmark proxies, so the kernel honestly blocks a ` +
          `claimable dollar payback until the tenant's own metrics land.`
        : `Net 3-year value lands at ${compactUsd(s.netValue)} after the ` +
          `mandatory six-factor haircut discounts the gross planning range.`,
    ) +
    (s.bridgeSteps.length > 0
      ? heroExhibit(
          'Exhibit 4 — Gross-to-net value bridge (planning range)',
          valueBridge(s.grossValue, s.bridgeSteps, s.netValue),
          'The gross figure is the upper planning bound — a curated benchmark ' +
            'proxy, not the tenant’s own measured value.',
        )
      : heroExhibitHtml(
          'Exhibit 4 — Net value, carried honestly as a planning range',
          `<div class="coverage-tiles">` +
            `<div class="coverage-tile coverage-neutral">` +
            `<div class="coverage-num">${compactUsd(s.netValue)}</div>` +
            `<div class="coverage-label">Net value (3-yr, base)</div>` +
            `<div class="coverage-sub">Post-haircut · planning range</div>` +
            `</div>` +
            `<div class="coverage-tile coverage-gap">` +
            `<div class="coverage-num">${s.totalHaircutPct}%</div>` +
            `<div class="coverage-label">Haircut applied</div>` +
            `<div class="coverage-sub">Mandatory six-factor model</div>` +
            `</div>` +
            `</div>`,
        )) +
    detail(
      'Adoption ramp — net value follows the adoption curve',
      `<table class="data-table">` +
        `<thead><tr><th>Year</th><th class="num">Adoption</th>` +
        `<th class="num">Net value at adoption</th></tr></thead>` +
        `<tbody>${adoptionRows}</tbody>` +
        `</table>` +
        `<p class="hero-note">The adoption ramp is a conservative planning ` +
        `curve — value lands as people change how they work, never on day ` +
        `one. It is a planning curve, not a commitment.</p>`,
    );
  return slide(s.anatomy, pack.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Sensitivity.
// ===========================================================================

function renderSensitivity(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.sensitivity;

  const hero =
    lede(
      'The case is shown as a range — conservative, base, upside — never a ' +
        'single point. The widest movers below are the highest-leverage ' +
        'evidence asks before the funding gate.',
    ) +
    heroExhibit(
      'Exhibit 5 — Net-return range across the three scenarios',
      scenarioRangeChart(
        s.scenarios.map((sc) => ({
          label: sc.name,
          value: sc.netReturn,
          tone: sc.tone,
        })),
      ),
    ) +
    (s.tornado.length > 0
      ? detail(
          'Sensitivity tornado — the assumptions that move the case most',
          heroExhibit(
            'The case-moving assumptions, widest first',
            sensitivityTornado(s.tornado),
            'Hatched bars are seed-gap proxies — they stand in for absent ' +
              'tenant data and are the evidence asks that gate funding.',
          ) +
            `<div class="mini-split">` +
            `<div><span class="mini-key">What breaks the case</span>` +
            `<p>${esc(s.whatBreaksTheCase)}</p></div>` +
            `</div>`,
        )
      : detail(
          'What breaks the case',
          `<div class="mini-split"><div>` +
            `<span class="mini-key">What breaks the case</span>` +
            `<p>${esc(s.whatBreaksTheCase)}</p></div></div>`,
        ));
  return slide(s.anatomy, pack.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — Evidence and gaps.
// ===========================================================================

function renderEvidenceGaps(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.evidenceGaps;

  const recordedRows = s.recorded
    .map(
      (m) =>
        `<tr>` +
        `<td>${esc(m.metric)}</td>` +
        `<td class="num">${esc(m.value)}</td>` +
        `<td>${esc(m.source)}</td>` +
        `<td class="num">${esc(m.asOf)}</td>` +
        `<td class="num">${esc(m.confidence)}</td>` +
        `</tr>`,
    )
    .join('');
  const gapRows = s.seedGaps
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.metric)} <span class="chip chip-bad">Seed gap</span></td>` +
        `<td>${esc(g.reason)}</td>` +
        `<td>${esc(g.expectedDataSource)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Baseline coverage is ${s.coveragePct}% — ${s.recordedCount} metrics ` +
        `are recorded by the Move, ${s.gapCount} are declared seed gaps ` +
        `inherited from the Function Pack. None are invented.`,
    ) +
    heroExhibit(
      'Exhibit 6 — Baseline coverage: recorded against seed-gapped',
      baselineCoverageMeter({
        recorded: s.recordedCount,
        seedGaps: s.gapCount,
        weakestConfidence: s.weakestConfidence,
      }),
    ) +
    (s.matrix.length > 0
      ? detail(
          'Evidence and gap matrix — recorded facts and declared seed gaps',
          heroExhibit(
            'Recorded facts against declared seed gaps',
            evidenceGapMatrix(s.matrix),
          ) +
            (s.recorded.length > 0
              ? `<div class="mini-key mini-key-block">Recorded metrics — ` +
                `measured, sourced, dated</div>` +
                `<table class="data-table">` +
                `<thead><tr><th>Metric</th><th class="num">Value</th>` +
                `<th>Source</th><th class="num">As of</th>` +
                `<th class="num">Confidence</th></tr></thead>` +
                `<tbody>${recordedRows}</tbody>` +
                `</table>`
              : '') +
            (s.seedGaps.length > 0
              ? `<div class="mini-key mini-key-block mini-key-gap">Seed ` +
                `gaps — declared, never blank, named with their source</div>` +
                `<table class="data-table">` +
                `<thead><tr><th>Metric</th><th>Why it is a gap</th>` +
                `<th>Expected data source</th></tr></thead>` +
                `<tbody>${gapRows}</tbody>` +
                `</table>`
              : ''),
        )
      : '');
  return slide(s.anatomy, pack.moveLabel, 7, hero);
}

// ===========================================================================
// Slide 7 — Recommendation.
// ===========================================================================

function renderRecommendation(pack: MoveCostedBusinessCasePack): string {
  const s = pack.sections.recommendation;
  const verdictClass =
    pack.verdict === 'fund'
      ? 'verdict-fund'
      : pack.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const towerRows = s.towerHandoff
    .map(
      (t) =>
        `<tr>` +
        `<td><strong>${esc(t.metric)}</strong></td>` +
        `<td class="num">${esc(t.baseline)}</td>` +
        `<td>${esc(t.readinessNote)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Recommendation</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(pack.verdictExplainerChip) +
    `</div>` +
    heroExhibitHtml(
      'Exhibit 7 — Kill triggers: when to stop or re-shape',
      `<ul class="mini-list">${s.killTriggers
        .map((k) => `<li>${esc(k)}</li>`)
        .join('')}</ul>`,
    ) +
    (s.towerHandoff.length > 0
      ? detail(
          'Tower measurement handoff — what Tower tracks once the Move goes live',
          `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
            `<th>Readiness</th></tr></thead>` +
            `<tbody>${towerRows}</tbody>` +
            `</table>`,
        )
      : '');
  return slide(s.anatomy, pack.moveLabel, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pack: MoveCostedBusinessCasePack): string {
  const verdictWord = pack.verdict.toUpperCase();
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Costed Business-Case Pack · Kernel-derived for a real Move',
    title: pack.moveLabel,
    tenantLine: `${pack.tenantLabel} · ${pack.functionLabel}`,
    lede:
      'A board deck produced by the Moves Expert Kernel for this Move. The ' +
      'section structure is **inherited** from the curated Domain Function ' +
      'Pack; every figure is the kernel’s — value is a planning range, ' +
      'unrecorded metrics are named seed gaps, and the verdict is the ' +
      'kernel’s real recommendation, never invented.',
    meta: [
      { label: 'Verdict', value: verdictWord },
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
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated business case.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Costed Business-Case Pack',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Costed Business-Case Pack — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Costed Business-Case Pack · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No business case is ' +
        'fabricated.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade business case.',
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
        'kernel cannot produce a board-grade business case.',
      hero:
        lede(
          'AbarVa’s board-grade Costed Business-Case Pack is grounded in a ' +
            'curated Domain Function Pack — the pack supplies the deliverable ' +
            'outline, the expected operating metrics, and the value model the ' +
            'kernel reasons against. Without one, the kernel will not ' +
            'fabricate a deck.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade business case',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade business case for ` +
        `this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function. This is surfaced as a gap, ` +
        `not papered over with a fabricated deck.</p>`,
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
      navPreview: 'Why this Move has no board-grade business case',
      render: () => noteSlide(),
    },
  ];

  return renderDeckDocument(meta, slides);
}

// ===========================================================================
// Public entry — render the generic Move Costed Business-Case Pack.
// ===========================================================================

/**
 * Render the generic Move Costed Business-Case Pack as one self-contained
 * HTML document. Projects the deck from `buildMoveCostedBusinessCasePack`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * deck. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveCostedBusinessCaseHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
  opts: MoveCostedBusinessCasePackOptions = {},
): string {
  const result: MoveCostedBusinessCaseResult = buildMoveCostedBusinessCasePack(
    move,
    generatedOn,
    opts,
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
function renderBoundDocument(pack: MoveCostedBusinessCasePack): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Costed Business-Case Pack',
    moveLabel: pack.moveLabel,
    tenantLabel: pack.tenantLabel,
    tenantKey: pack.tenantKey,
    generatedOn: pack.generatedOn,
    verdict: {
      label: pack.verdict.toUpperCase(),
      sub: pack.monetisationBlocked
        ? 'Payback blocked — seed gap'
        : 'Kernel recommendation',
    },
    documentTitle: `${pack.moveLabel} — Costed Business-Case Pack — ${pack.tenantLabel}`,
  };

  const renderers: Array<(p: MoveCostedBusinessCasePack) => string> = [
    renderBoardAnswer,
    renderInheritedOutline,
    renderInvestmentCase,
    renderValueCase,
    renderSensitivity,
    renderEvidenceGaps,
    renderRecommendation,
  ];

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
