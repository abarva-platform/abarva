// Generic Move Discover Brief — self-contained HTML renderer.
//
// The generic sibling of `discover-brief-renderer.ts` (the Apex reference
// renderer). It renders the Discover Brief deck for a REAL, originated Move
// from `buildMoveDiscoverBrief(move)` — the kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The deck is a cover plus six
// sections: the decision snapshot, the inherited curated Discover outline, the
// current-state baseline, pain & opportunity, the evidence gaps, and the
// go/no-go gate — all driven by the kernel skeleton and the Function-Pack
// binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveDiscoverBriefHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated Discover
// Brief for an unbound Move.
//
// The Apex renderer (`renderApexDiscoverBriefHtml`) is left untouched — this
// file is added alongside it.

import {
  buildMoveDiscoverBrief,
  type MoveDiscoverBrief,
  type MoveDiscoverBriefResult,
  type MoveBriefSectionAnatomy,
  type MoveBriefEvidenceStrip,
} from './move-discover-brief-model';
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
  baselineCoverageMeter,
  economicsStrip,
  gapClosureQueue,
  opportunityRangeBar,
} from './svg-charts';
import { renderVerdictExplainerChip } from './verdict-explainer';

// The bound deck has a fixed slide count — the cover plus the 6 sections.
const SLIDE_COUNT = 7;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveBriefEvidenceStrip['confidence']): string {
  const map: Record<MoveBriefEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveBriefSectionAnatomy): FooterFact[] {
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
  a: MoveBriefSectionAnatomy,
  brief: MoveDiscoverBrief,
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

function detail(summary: string, body: string): string {
  return detailStrip(summary, body);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

// ===========================================================================
// Slide 1 — Decision snapshot.
// ===========================================================================

function renderDecisionSnapshot(brief: MoveDiscoverBrief): string {
  const s = brief.sections.decisionSnapshot;
  const verdictClass =
    brief.verdict === 'go'
      ? 'verdict-fund'
      : brief.verdict === 'no-go'
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
    `<div class="board-card-tag">Discover verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(brief.verdictExplainerChip) +
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
    `</div>` +
    notes;
  return slide(s.anatomy, brief, 2, hero);
}

// ===========================================================================
// Slide 2 — Inherited curated Discover outline.
// ===========================================================================

function renderInheritedOutline(brief: MoveDiscoverBrief): string {
  const s = brief.sections.inheritedOutline;
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

  const cards =
    `<div class="context-diagram">` +
    `<div class="context-band">` +
    `<div class="context-band-label">Inherited curated Discover outline</div>` +
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
      `This Discover Brief inherits the curated ${esc(
        brief.functionLabel,
      )} Discover outline from the bound Domain Function Pack. The agent ` +
        `does not improvise the structure — every section below is a ` +
        `curated, function-calibrated heading.`,
    ) +
    heroExhibitHtml(
      `Exhibit 2 — The inherited ${esc(brief.functionLabel)} Discover outline`,
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
  return slide(s.anatomy, brief, 3, hero);
}

// ===========================================================================
// Slide 3 — Current-state baseline.
// ===========================================================================

function renderCurrentStateBaseline(brief: MoveDiscoverBrief): string {
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
      'Exhibit 3 — Baseline coverage: recorded against seed gaps',
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
        `<th class="num">Confidence</th>` +
        `</tr></thead>` +
        `<tbody>${metricRows}${gapRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, brief, 4, hero);
}

// ===========================================================================
// Slide 4 — Pain and opportunity.
// ===========================================================================

function renderPainAndOpportunity(brief: MoveDiscoverBrief): string {
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

  const hero =
    lede(
      s.directionalOnly
        ? 'The pain themes below are the curated failure modes the kernel ' +
          'tracks for this function. The value is genuine — but with the ' +
          'monetisation inputs missing it can only be stated directionally, ' +
          'never as a dollar figure.'
        : 'The pain themes below are the curated failure modes the kernel ' +
          'tracks for this function. The opportunity is real and sizeable ' +
          'against the recorded baseline.',
    ) +
    heroExhibit(
      `Exhibit 4 — Opportunity read: ${
        s.directionalOnly ? 'directional only' : 'sized to the baseline'
      }`,
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
      s.directionalOnly
        ? 'The band has no dollar axis — it is a directional read of where ' +
          'value is likely to sit, not a sized estimate.'
        : 'The band frames where value is likely to land against the ' +
          'recorded baseline.',
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
  return slide(s.anatomy, brief, 5, hero);
}

// ===========================================================================
// Slide 5 — Evidence gaps.
// ===========================================================================

function renderEvidenceGaps(brief: MoveDiscoverBrief): string {
  const s = brief.sections.evidenceGaps;

  const gapRows = s.gaps
    .slice()
    .sort((a, b) => b.impact - a.impact)
    .map(
      (g) =>
        `<tr class="row-proxy">` +
        `<td>${esc(g.label)} ` +
        `<span class="chip chip-bad">Seed gap</span></td>` +
        `<td>${esc(g.reason)}</td>` +
        `<td>${esc(g.expectedDataSource)}</td>` +
        `</tr>`,
    )
    .join('');

  const queueExhibit =
    s.gaps.length > 0
      ? heroExhibit(
          'Exhibit 5 — Gap-closure queue: open seed gaps by decision impact',
          gapClosureQueue(
            s.gaps.map((g) => ({
              label: g.label,
              owner: 'Move sponsor — TBC with tenant',
              due: 'Before the Charter gate',
              impact: g.impact,
              blocksSizing: true,
            })),
          ),
          'The queue is sorted by decision impact — the widest bar is the ' +
            'next evidence ask. Every gap is a curated, expected metric.',
        )
      : heroExhibitHtml(
          'Exhibit 5 — No open seed gap',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Baseline complete</span>` +
            `<span>Every operating metric this function expects is ` +
            `recorded — there is no open seed gap to close.</span>` +
            `</div>`,
        );

  const hero =
    lede(
      s.gaps.length > 0
        ? `${s.gaps.length} expected operating metric` +
          `${s.gaps.length === 1 ? ' is' : 's are'} an open seed gap. ` +
          'Closing them is the work that converts this Discover into a ' +
          'fundable Charter case — each gap below is named with its source.'
        : 'No expected operating metric is an open seed gap — the baseline ' +
          'is complete and the Charter can be sized directly.',
    ) +
    queueExhibit +
    (s.gaps.length > 0
      ? detail(
          'Evidence request queue — each seed gap, why it is a gap, and its source',
          `<table class="data-table">` +
            `<thead><tr><th>Open evidence gap</th><th>Why it is a gap</th>` +
            `<th>Expected data source</th></tr></thead>` +
            `<tbody>${gapRows}</tbody>` +
            `</table>`,
        )
      : '');
  return slide(s.anatomy, brief, 6, hero);
}

// ===========================================================================
// Slide 6 — Go/no-go gate.
// ===========================================================================

function renderGoNoGoGate(brief: MoveDiscoverBrief): string {
  const s = brief.sections.goNoGoGate;
  const verdictClass =
    brief.verdict === 'go'
      ? 'verdict-fund'
      : brief.verdict === 'no-go'
        ? 'verdict-kill'
        : 'verdict-shape';

  const stateChip = (st: 'pass' | 'fired'): string =>
    st === 'pass'
      ? '<span class="chip chip-good">Pass</span>'
      : '<span class="chip chip-bad">Live</span>';
  const checkClass = (st: 'pass' | 'fired'): string =>
    st === 'pass' ? 'check-approve' : 'check-hold';
  const checklist =
    `<div class="checklist">` +
    s.killChecks
      .map(
        (c) =>
          `<div class="check-row ${checkClass(c.state)}">` +
          `<div class="check-mark">${stateChip(c.state)}</div>` +
          `<div class="check-body">` +
          `<div class="check-detail">${esc(c.condition)}</div>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Go/no-go verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.rationale)}</p>` +
    renderVerdictExplainerChip(brief.verdictExplainerChip) +
    `</div>` +
    heroExhibitHtml(
      'Exhibit 6 — Kill checklist: the kernel kill criteria',
      s.killChecks.length > 0
        ? checklist
        : `<p class="hero-note">The kernel raised no kill criterion for ` +
            `this Move.</p>`,
    ) +
    detail(
      'Fix conditions — what must become true before the Charter gate',
      `<div class="mini-key mini-key-block mini-key-gap">` +
        `Fix conditions — must be met before the Charter gate</div>` +
        `<ul class="mini-list">` +
        s.fixConditions.map((c) => `<li>${esc(c)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, brief, 7, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(brief: MoveDiscoverBrief): string {
  const verdictWord =
    brief.verdict === 'go'
      ? 'GO'
      : brief.verdict === 'no-go'
        ? 'NO-GO'
        : 'RESHAPE';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Discover Brief · Kernel-derived for a real Move',
    title: brief.moveLabel,
    tenantLine: `${brief.tenantLabel} · ${brief.functionLabel}`,
    lede:
      'A Discover brief produced by the Moves Expert Kernel for this Move. ' +
      'The section structure is **inherited** from the curated Domain ' +
      'Function Pack; every figure is the kernel’s — the baseline is the ' +
      'real recorded / seed-gapped split, unrecorded metrics are named seed ' +
      'gaps, and the verdict is the kernel’s real recommendation, never ' +
      'invented.',
    meta: [
      { label: 'Discover verdict', value: verdictWord },
      {
        label: 'Opportunity',
        value: brief.monetisationBlocked ? 'Directional — seed gaps' : 'Sized',
      },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: brief.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated Discover Brief.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Discover Brief',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Discover Brief — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Discover Brief · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No Discover Brief is ' +
        'fabricated.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade Discover Brief.',
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
        'kernel cannot produce a board-grade Discover Brief.',
      hero:
        lede(
          'AbarVa’s board-grade Discover Brief is grounded in a curated ' +
            'Domain Function Pack — the pack supplies the Discover deliverable ' +
            'outline, the expected operating metrics, and the curated pain ' +
            'themes the kernel reasons against. Without one, the kernel will ' +
            'not fabricate a brief.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade Discover Brief',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade Discover Brief for ` +
        `this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function. This is surfaced as a gap, ` +
        `not papered over with a fabricated brief.</p>`,
      footer: [
        {
          key: 'So what',
          val:
            'The agent falls back to general reasoning for this Move — a ' +
            'known curated-depth gap.',
        },
        { key: 'Decision role', val: 'No Discover decision is supported.' },
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
      navPreview: 'Why this Move has no board-grade Discover Brief',
      render: () => noteSlide(),
    },
  ];

  return renderDeckDocument(meta, slides);
}

// ===========================================================================
// Discover-Brief-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour. Kept
// identical to the Apex brief's tail so the two decks render consistently.
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
// Public entry — render the generic Move Discover Brief.
// ===========================================================================

/**
 * Render the generic Move Discover Brief as one self-contained HTML document.
 * Projects the deck from `buildMoveDiscoverBrief`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * brief. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveDiscoverBriefHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveDiscoverBriefResult = buildMoveDiscoverBrief(
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
function renderBoundDocument(brief: MoveDiscoverBrief): string {
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
      sub: brief.monetisationBlocked
        ? 'Opportunity directional — seed gaps'
        : 'Kernel recommendation',
    },
    documentTitle: `${brief.moveLabel} — Discover Brief — ${brief.tenantLabel}`,
  };

  const renderers: Array<(b: MoveDiscoverBrief) => string> = [
    renderDecisionSnapshot,
    renderInheritedOutline,
    renderCurrentStateBaseline,
    renderPainAndOpportunity,
    renderEvidenceGaps,
    renderGoNoGoGate,
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
