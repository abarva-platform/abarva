// Generic Move Mobilize & Go-Decision Packet — self-contained HTML renderer.
//
// The generic sibling of `mobilize-packet-renderer.ts` (the Apex reference
// renderer). It renders the Mobilize & Go-Decision deck for a REAL, originated
// Move from `buildMoveMobilizePacket(move)` — the kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The deck is a cover plus six
// sections (the go-decision, the inherited curated mobilization plan, value &
// effort, controls & readiness, the Tower handoff, the open-action queue),
// driven entirely by the kernel skeleton and the Function-Pack binding.
//
// HONESTY: when the Move binds no curated pack, `renderMoveMobilizePacketHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated packet for
// an unbound Move, and the go-decision is always the kernel's real verdict.
//
// The Apex renderer (`renderApexMobilizePacketHtml`) is left untouched — this
// file is added alongside it.

import {
  buildMoveMobilizePacket,
  goVerdictWord,
  type MoveMobilizePacket,
  type MoveMobilizeResult,
  type MoveMobilizeSectionAnatomy,
  type MoveMobilizeEvidenceStrip,
} from './move-mobilize-model';
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
  readinessHeatmap,
  gapClosureQueue,
  compactUsd,
} from './svg-charts';
import { renderVerdictExplainerChip } from './verdict-explainer';

// The bound deck has a fixed slide count — the cover plus the 6 sections.
const SLIDE_COUNT = 7;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveMobilizeEvidenceStrip['confidence']): string {
  const map: Record<MoveMobilizeEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveMobilizeSectionAnatomy): FooterFact[] {
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
  a: MoveMobilizeSectionAnatomy,
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

/** The verdict CSS class — reuses the locked verdict tokens. */
function verdictClassFor(verdict: MoveMobilizePacket['verdict']): string {
  if (verdict === 'go') return 'verdict-fund';
  if (verdict === 'no_go') return 'verdict-kill';
  return 'verdict-shape';
}

// ===========================================================================
// Slide 1 — Go / no-go answer.
// ===========================================================================

function renderGoDecision(pack: MoveMobilizePacket): string {
  const s = pack.sections.goDecision;
  const verdictClass = verdictClassFor(pack.verdict);

  const stateChip = (ok: boolean): string =>
    ok
      ? '<span class="chip chip-good">Yes</span>'
      : '<span class="chip chip-bad">No</span>';

  const killCards =
    s.killCriteria.length === 0
      ? `<p class="mini-para">The kernel raised no kill criterion.</p>`
      : `<div class="checklist">` +
        s.killCriteria
          .map(
            (k) =>
              `<div class="check-row check-hold">` +
              `<div class="check-mark">` +
              `<span class="chip chip-bad">Kill criterion</span></div>` +
              `<div class="check-body">` +
              `<div class="check-label">${esc(k.code)}</div>` +
              `<div class="check-detail">${esc(k.condition)}</div>` +
              `</div></div>`,
          )
          .join('') +
        `</div>`;

  const blockerList =
    s.blockers.length === 0
      ? ''
      : detail(
          'Open critic blockers — what holds the launch gate',
          `<ul class="mini-list">` +
            s.blockers.map((b) => `<li>${esc(b)}</li>`).join('') +
            `</ul>`,
        );

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Go-decision · kernel verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(pack.verdictExplainerChip) +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Mobilize readiness at a glance',
      economicsStrip(s.tiles),
    ) +
    `<div class="readiness-line">` +
    `<span class="readiness-chip">Owned ${stateChip(s.readiness.owned)}</span>` +
    `<span class="readiness-chip">Adoptable ${stateChip(
      s.readiness.adoptable,
    )}</span>` +
    `<span class="readiness-chip">Measurable ${stateChip(
      s.readiness.measurable,
    )}</span>` +
    `</div>` +
    heroExhibitHtml(
      'Exhibit 1b — Kill criteria: when to stop or re-shape',
      killCards,
    ) +
    blockerList;

  return slide(s.anatomy, pack.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Inherited curated mobilization plan.
// ===========================================================================

function renderInheritedPlan(pack: MoveMobilizePacket): string {
  const s = pack.sections.inheritedPlan;
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
    `<div class="context-band-label">Inherited curated mobilization outline</div>` +
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
      `This Mobilize & Go-Decision Packet inherits the curated ${esc(
        pack.functionLabel,
      )} mobilization-plan outline from the bound Domain Function Pack. The ` +
        `agent does not improvise the plan — every section below is a ` +
        `curated, function-calibrated heading.`,
    ) +
    heroExhibitHtml(
      `Exhibit 2 — The inherited ${esc(pack.functionLabel)} mobilization outline`,
      cards,
    ) +
    detail(
      'The curated mobilization outline — every section heading and its guidance',
      `<table class="data-table">` +
        `<thead><tr><th class="num">#</th><th>Section heading</th>` +
        `<th>Curated guidance</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, pack.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Value & effort to mobilize.
// ===========================================================================

function renderValueEffort(pack: MoveMobilizePacket): string {
  const s = pack.sections.valueEffort;

  const tiles = economicsStrip([
    {
      label: 'Investment (base)',
      value: compactUsd(s.investmentRange.point),
      sub: `${compactUsd(s.investmentRange.low)}–${compactUsd(
        s.investmentRange.high,
      )} range`,
      tone: 'neutral',
    },
    {
      label: 'Net value (3-yr)',
      value: compactUsd(s.valueRange.point),
      sub: `${compactUsd(s.valueRange.low)}–${compactUsd(
        s.valueRange.high,
      )} · post-haircut`,
      tone: pack.monetisationBlocked ? 'warn' : 'good',
    },
    {
      label: 'Payback',
      value:
        s.paybackMonths === null ? 'Blocked' : `${s.paybackMonths} mo`,
      sub:
        s.paybackMonths === null
          ? 'Monetisation blocked — seed gap'
          : 'Base case',
      tone: s.paybackMonths === null ? 'bad' : 'good',
    },
  ]);

  const wsRows = s.workstreams
    .map(
      (w) =>
        `<tr>` +
        `<td>${esc(w.label)}</td>` +
        `<td class="num">${compactUsd(w.base)}</td>` +
        `<td class="num">${w.headcount}</td>` +
        `<td class="num">${w.durationMonths} mo</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      pack.monetisationBlocked
        ? `Net 3-year value is carried as a planning range — point ` +
          `${compactUsd(s.valueRange.point)}. It rests on the Function ` +
          `Pack's curated benchmark proxies, so the kernel honestly blocks a ` +
          `claimable dollar payback until the tenant's own metrics land.`
        : `Net 3-year value lands at ${compactUsd(s.valueRange.point)} ` +
          `against a ${compactUsd(s.investmentRange.point)} base ` +
          'investment — the economics that justify mobilizing now.',
    ) +
    heroExhibit(
      'Exhibit 3 — The economics that justify mobilizing this Move',
      tiles,
    ) +
    (s.workstreams.length > 0
      ? detail(
          'The first stand-up workstreams — the money mobilized first',
          `<table class="data-table">` +
            `<thead><tr><th>Workstream</th><th class="num">Base cost</th>` +
            `<th class="num">Headcount</th><th class="num">Duration</th>` +
            `</tr></thead>` +
            `<tbody>${wsRows}</tbody></table>` +
            `<p class="mini-para">These foundational and governance lanes ` +
            `are the first money the launch funds — they stand up the ` +
            `operating spine before any pilot value is claimed.</p>`,
        )
      : '');
  return slide(s.anatomy, pack.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — Controls & readiness.
// ===========================================================================

function renderControlsReadiness(pack: MoveMobilizePacket): string {
  const s = pack.sections.controlsReadiness;
  const blocked = s.rows.filter((r) => r.state === 'blocked').length;

  const hero =
    lede(
      `${s.rows.length} readiness gates are scored from the kernel state. ` +
        `${blocked} ${blocked === 1 ? 'is' : 'are'} blocked — and the ` +
        'blocked gates are exactly what hold the go-decision. The heatmap ' +
        'makes the launch pre-conditions explicit, not assumed.',
    ) +
    heroExhibit(
      'Exhibit 4 — Launch readiness heatmap: what must be true before go-live',
      readinessHeatmap(
        s.rows.map((r) => ({
          label: r.label,
          state: r.state,
          note: r.note,
        })),
      ),
      'A blocked gate is a hard pre-condition — the launch gate stays held ' +
        'until every blocked row is cleared.',
    );
  return slide(s.anatomy, pack.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Tower measurement handoff.
// ===========================================================================

function renderTowerHandoff(pack: MoveMobilizePacket): string {
  const s = pack.sections.towerHandoff;

  const rows = s.metrics
    .map(
      (m) =>
        `<tr${m.wired ? '' : ' class="row-proxy"'}>` +
        `<td>${esc(m.label)}${
          m.wired
            ? ' <span class="chip chip-good">Wired</span>'
            : ' <span class="chip chip-bad">Seed gap</span>'
        }</td>` +
        `<td class="num">${esc(m.baseline)}</td>` +
        `</tr>` +
        `<tr${m.wired ? '' : ' class="row-proxy"'}>` +
        `<td colspan="2" class="readiness-note">${esc(m.readinessNote)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Tower will measure ${s.metrics.length} committed value metrics — ` +
        `${s.wiredCount} ${
          s.wiredCount === 1 ? 'is' : 'are'
        } wired to a recorded baseline. The remaining ${s.unwiredCount} ` +
        `${
          s.unwiredCount === 1 ? 'is' : 'are'
        } honest seed gaps, carried with a capture plan, never dropped.`,
    ) +
    (s.metrics.length > 0
      ? heroExhibitHtml(
          'Exhibit 5 — Measurement handoff: every metric tied to a baseline',
          `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
            `</tr></thead>` +
            `<tbody>${rows}</tbody></table>`,
          'The value loop ' +
            `${
              s.loopCloses
                ? 'closes — every metric is wired to a baseline.'
                : 'does not yet close — seed-gapped baselines remain.'
            }`,
        )
      : heroExhibitHtml(
          'Exhibit 5 — Measurement handoff',
          `<p class="mini-para">The bound Function Pack carries no Tower ` +
            `handoff metrics for this Move.</p>`,
        ));
  return slide(s.anatomy, pack.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — Open action queue.
// ===========================================================================

function renderOpenActions(pack: MoveMobilizePacket): string {
  const s = pack.sections.openActions;

  const queueRows = s.actions.map((a, i) => ({
    label: a.action.slice(0, 72),
    owner: a.owner,
    due: a.blocksGoLive ? 'Before launch gate' : 'Before value lock',
    impact: a.blocksGoLive ? 100 - i : 50 - i,
    blocksSizing: a.blocksGoLive,
  }));

  const tableRows = s.actions
    .map(
      (a) =>
        `<tr${a.blocksGoLive ? ' class="row-proxy"' : ''}>` +
        `<td>${esc(a.action)}${
          a.blocksGoLive
            ? ' <span class="chip chip-bad">Blocks go-live</span>'
            : ' <span class="chip chip-warn">Pre-launch</span>'
        }</td>` +
        `<td>${esc(a.owner)}</td>` +
        `<td>${esc(a.gateImpact)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      s.actions.length === 0
        ? 'The kernel raised no kill criterion, no critic blocker, and the ' +
          'bound Function Pack reports no seed gap — there is no open action ' +
          'gating the launch.'
        : 'Nothing that gates the launch is unowned. Every open action — ' +
          'the kill criteria, the open critic blockers, and the precise ' +
          'seed gaps — carries a named owner and an explicit gate impact.',
    ) +
    (s.actions.length > 0
      ? heroExhibit(
          'Exhibit 6 — Open action queue: gate blockers, by launch impact',
          gapClosureQueue(queueRows),
          'The widest bars are the gate-blocking actions — the critical ' +
            'path to a clean go.',
        ) +
          detail(
            'Open action queue — owner and gate impact',
            `<table class="data-table">` +
              `<thead><tr><th>Open action</th><th>Owner</th>` +
              `<th>Gate impact</th></tr></thead>` +
              `<tbody>${tableRows}</tbody></table>`,
          )
      : heroExhibitHtml(
          'Exhibit 6 — Open action queue',
          `<p class="mini-para">No open action gates the launch.</p>`,
        ));
  return slide(s.anatomy, pack.moveLabel, 7, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(pack: MoveMobilizePacket): string {
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Mobilize & Go-Decision Packet · Kernel-derived for a real Move',
    title: pack.moveLabel,
    tenantLine: `${pack.tenantLabel} · ${pack.functionLabel}`,
    lede:
      'A board-grade Mobilize & Go-Decision Packet produced by the Moves ' +
      'Expert Kernel for this Move. The mobilization-plan structure is ' +
      '**inherited** from the curated Domain Function Pack; every figure is ' +
      'the kernel’s, and the go-decision is the kernel’s real verdict — ' +
      'never an invented `go`.',
    meta: [
      { label: 'Go-decision', value: goVerdictWord(pack.verdict) },
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
// Move's function. NEVER a fabricated packet.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Mobilize & Go-Decision Packet',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Mobilize & Go-Decision Packet — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Mobilize & Go-Decision Packet · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No go-decision is ' +
        'fabricated.',
      meta: [
        { label: 'Go-decision', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade Mobilize packet.',
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
        'kernel cannot produce a board-grade Mobilize packet.',
      hero:
        lede(
          'AbarVa’s board-grade Mobilize & Go-Decision Packet is grounded ' +
            'in a curated Domain Function Pack — the pack supplies the ' +
            'mobilization-plan outline and the operating metrics the kernel ' +
            'reasons against. Without one, the kernel will not fabricate a ' +
            'go-decision.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade Mobilize packet',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade Mobilize packet for ` +
        `this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function. This is surfaced as a gap, ` +
        `not papered over with a fabricated go-decision.</p>`,
      footer: [
        {
          key: 'So what',
          val:
            'The agent falls back to general reasoning for this Move — a ' +
            'known curated-depth gap.',
        },
        { key: 'Decision role', val: 'No go-decision is supported.' },
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
      navPreview: 'Why this Move has no board-grade Mobilize packet',
      render: () => noteSlide(),
    },
  ];

  return renderDeckDocument(meta, slides);
}

// ===========================================================================
// Mobilize-Packet-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function mobilizeStyles(): string {
  return `
/* --- Move Mobilize packet — readiness chips row. --- */
.readiness-line {
  display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 16px;
}
.readiness-chip {
  display: inline-flex; gap: 7px; align-items: center;
  font-size: 11px; font-weight: 700; color: #2c2a26;
  background: #fff; border: 1px solid #e0dbcd; border-radius: 999px;
  padding: 6px 12px;
}
.readiness-note {
  font-size: 10.5px; color: #5b5852; background: #f7f5ef !important;
  line-height: 1.5; font-style: italic;
}
.row-proxy .readiness-note { color: #7A4F01; }
.mini-para {
  margin: 8px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
`;
}

// ===========================================================================
// Public entry — render the generic Move Mobilize & Go-Decision Packet.
// ===========================================================================

/**
 * Render the generic Move Mobilize & Go-Decision Packet as one self-contained
 * HTML document. Projects the deck from `buildMoveMobilizePacket`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * packet. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveMobilizePacketHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveMobilizeResult = buildMoveMobilizePacket(
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
function renderBoundDocument(pack: MoveMobilizePacket): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Mobilize & Go-Decision Packet',
    moveLabel: pack.moveLabel,
    tenantLabel: pack.tenantLabel,
    tenantKey: pack.tenantKey,
    generatedOn: pack.generatedOn,
    verdict: {
      label: goVerdictWord(pack.verdict),
      sub: pack.monetisationBlocked
        ? 'Payback blocked — seed gap'
        : 'Kernel go-decision',
    },
    documentTitle: `${pack.moveLabel} — Mobilize & Go-Decision Packet — ${pack.tenantLabel}`,
  };

  const renderers: Array<(p: MoveMobilizePacket) => string> = [
    renderGoDecision,
    renderInheritedPlan,
    renderValueEffort,
    renderControlsReadiness,
    renderTowerHandoff,
    renderOpenActions,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Mobilize & Go-Decision Packet',
      render: () => renderCover(pack),
    },
    ...pack.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](pack),
    })),
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${mobilizeStyles()}</style>`);
}
