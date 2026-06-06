// Generic Move Solution Architecture Pack — self-contained HTML renderer.
//
// The generic sibling of `solution-architecture-renderer.ts` (the Apex
// reference renderer). It renders the Solution Architecture deck for a REAL,
// originated Move from `buildMoveSolutionArchitecture(move)` — the pack-bound,
// kernel-derived view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-architecture`
// exhibits — it does not rebuild rendering. The deck has seven sections:
// the architecture decision, the inherited curated outline, the target-state
// architecture (the curated reference patterns), the AI use-case archetypes,
// the control posture, evidence & gaps, and the open architecture decisions.
//
// HONESTY: when the Move binds no curated pack (or the pack carries no
// solution-architecture outline), `renderMoveSolutionArchitectureHtml` renders
// an honest UNBOUND deck — a single slide that states no curated Function Pack
// covers the function. It NEVER renders a fabricated architecture.
//
// The Apex renderer (`renderApexSolutionArchitectureHtml`) is left untouched —
// this file is added alongside it.

import {
  buildMoveSolutionArchitecture,
  type MoveSolutionArchitecture,
  type MoveSolutionArchitectureResult,
  type MoveArchSectionAnatomy,
  type MoveArchEvidenceStrip,
} from './move-solution-architecture-model';
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
  accountabilityMap,
  openDecisionQueue,
  optionScorecard,
} from './svg-architecture';
import { renderVerdictExplainerChip } from './verdict-explainer';

// The bound deck has a fixed slide count — the cover plus the 7 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveArchEvidenceStrip['confidence']): string {
  const map: Record<MoveArchEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveArchSectionAnatomy): FooterFact[] {
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
  a: MoveArchSectionAnatomy,
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

/** A short, human label for a control posture string. */
function postureLabel(posture: string): string {
  return posture
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join('-');
}

// ===========================================================================
// Slide 1 — Architecture decision.
// ===========================================================================

function renderArchitectureDecision(
  arch: MoveSolutionArchitecture,
): string {
  const s = arch.sections.architectureDecision;
  const tp = arch.targetPattern;

  const rejectedRows = tp.rejected
    .map(
      (r) =>
        `<div class="pattern-card pattern-rejected">` +
        `<div class="pattern-name">${esc(r.name)} ` +
        `<span class="chip chip-bad">Higher autonomy</span></div>` +
        `<div class="pattern-detail">${esc(r.reason)}</div>` +
        `</div>`,
    )
    .join('');

  const hero =
    `<div class="board-card verdict-shape">` +
    `<div class="board-card-tag">Target-state architecture pattern</div>` +
    `<div class="board-verdict">${esc(tp.name)}</div>` +
    `<p class="board-detail">${esc(tp.oneLine)}</p>` +
    renderVerdictExplainerChip(arch.verdictExplainerChip) +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Curated reference-pattern scorecard: selected against alternatives',
      optionScorecard(
        s.options.map((o) => ({
          name: o.name,
          shapeLabel: o.shapeLabel,
          referenceScore: o.referenceScore,
          productionShaped: o.productionShaped,
          selected: o.selected,
          disposition: o.disposition,
        })),
      ),
      'Every candidate is a curated reference solution pattern from the bound ' +
        'Domain Function Pack; the selected pattern is the most ' +
        'human-accountable, not the highest-autonomy option.',
    ) +
    detail(
      'Higher-autonomy alternatives, and the decision rationale',
      (rejectedRows
        ? `<div class="pattern-cards">${rejectedRows}</div>`
        : `<p class="hero-note">The bound Function Pack carries a single ` +
          `reference pattern at the selected autonomy tier — no ` +
          `higher-autonomy alternative is catalogued for this function.</p>`) +
        `<div class="mini-key mini-key-block">Decision rationale</div>` +
        `<ul class="mini-list">` +
        s.reasons.map((r) => `<li>${esc(r)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, arch.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Inherited curated outline.
// ===========================================================================

function renderInheritedOutline(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.inheritedOutline;
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
      `This Solution Architecture Pack inherits the curated ${esc(
        arch.functionLabel,
      )} solution-architecture outline from the bound Domain Function Pack. ` +
        `The agent does not improvise the structure — every section below is ` +
        `a curated, function-calibrated heading.`,
    ) +
    heroExhibitHtml(
      `Exhibit 2 — The inherited ${esc(arch.functionLabel)} architecture outline`,
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
  return slide(s.anatomy, arch.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Target-state architecture (the curated reference patterns).
// ===========================================================================

function renderTargetArchitecture(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.targetArchitecture;

  const cards = s.patterns
    .map(
      (p) =>
        `<div class="pattern-card${p.selected ? ' pattern-selected' : ''}">` +
        `<div class="pattern-name">${esc(p.name)} ` +
        (p.selected
          ? '<span class="chip chip-good">Selected target</span>'
          : `<span class="chip chip-warn">${esc(
              postureLabel(p.controlPosture),
            )}</span>`) +
        `</div>` +
        `<div class="pattern-detail">${esc(p.description)}</div>` +
        `<div class="pattern-detail"><strong>Boundary —</strong> ${esc(
          p.boundary,
        )}</div>` +
        `<div class="pattern-detail"><strong>Human accountability —</strong> ${esc(
          p.humanAccountabilityPoint,
        )}</div>` +
        `</div>`,
    )
    .join('');

  const rows = s.patterns
    .map(
      (p) =>
        `<tr class="${p.selected ? '' : 'row-proxy'}">` +
        `<td><strong>${esc(p.name)}</strong>${
          p.selected
            ? ' <span class="chip chip-good">Target</span>'
            : ''
        }</td>` +
        `<td>${esc(postureLabel(p.controlPosture))}</td>` +
        `<td>${esc(p.humanAccountabilityPoint)}</td>` +
        `</tr>`,
    )
    .join('');

  const foundationClause =
    s.foundation.length > 0
      ? ` It rests on an adopted platform foundation of ${s.foundation.length} ` +
        `components — landing zone, ingestion, medallion data products, ` +
        `governed serving and the governance spine — shown below as adopted, ` +
        `never ranked or rejected.`
      : '';

  const hero =
    lede(
      `The target-state architecture is built from ${s.patterns.length} ` +
        `curated reference solution options. Every option names its ` +
        `boundary — what it owns and what it explicitly does not — and a ` +
        `named human accountability point.` +
        foundationClause,
    ) +
    heroExhibitHtml(
      'Exhibit 3 — The curated reference solution options',
      `<div class="pattern-cards">${cards}</div>`,
    ) +
    detail(
      'Reference-option table — option, control posture, accountability',
      `<table class="data-table">` +
        `<thead><tr><th>Reference option</th><th>Control posture</th>` +
        `<th>Human accountability point</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    ) +
    renderFoundationExhibit(s.foundation);
  return slide(s.anatomy, arch.moveLabel, 4, hero);
}

/**
 * The "Adopted platform foundation" exhibit — the foundation-tagged patterns
 * (landing zone, ingestion, medallion, governed serving, governance spine)
 * rendered as ADOPTED components. They are visually distinct from the option
 * scorecard (a blue "Adopted" treatment, never the red "rejected" treatment)
 * and carry no selected/rejected disposition. Renders nothing when the pack
 * carries no foundation patterns (fully back-compatible).
 */
function renderFoundationExhibit(
  foundation: MoveSolutionArchitecture['sections']['targetArchitecture']['foundation'],
): string {
  if (foundation.length === 0) return '';

  const cards = foundation
    .map(
      (f) =>
        `<div class="pattern-card pattern-foundation">` +
        `<div class="pattern-name">${esc(f.name)} ` +
        `<span class="chip-found">Adopted foundation</span>` +
        `<span class="chip chip-warn">${esc(
          postureLabel(f.controlPosture),
        )}</span>` +
        `</div>` +
        `<div class="pattern-detail"><strong>Boundary —</strong> ${esc(
          f.boundary,
        )}</div>` +
        `<div class="pattern-detail"><strong>Human accountability —</strong> ${esc(
          f.humanAccountabilityPoint,
        )}</div>` +
        `</div>`,
    )
    .join('');

  return (
    heroExhibitHtml(
      'Exhibit 3b — Adopted platform foundation (cross-cutting, not an option)',
      `<div class="pattern-cards">${cards}</div>`,
    ) +
    detail(
      'Adopted-foundation table — component, control posture, accountability',
      `<table class="data-table">` +
        `<thead><tr><th>Foundation component</th><th>Control posture</th>` +
        `<th>Human accountability point</th></tr></thead>` +
        `<tbody>${foundation
          .map(
            (f) =>
              `<tr>` +
              `<td><strong>${esc(f.name)}</strong> ` +
              `<span class="chip-found">Adopted</span></td>` +
              `<td>${esc(postureLabel(f.controlPosture))}</td>` +
              `<td>${esc(f.humanAccountabilityPoint)}</td>` +
              `</tr>`,
          )
          .join('')}</tbody>` +
        `</table>`,
    )
  );
}

// ===========================================================================
// Slide 4 — AI use-case archetypes.
// ===========================================================================

function renderArchetypes(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.archetypes;

  const cards = s.archetypes
    .map(
      (a) =>
        `<div class="pattern-card">` +
        `<div class="pattern-name">${esc(a.name)} ` +
        `<span class="chip chip-warn">${esc(
          postureLabel(a.controlPosture),
        )}</span></div>` +
        `<div class="pattern-detail"><strong>Value mechanism —</strong> ${esc(
          a.valueMechanism,
        )}</div>` +
        `<div class="pattern-detail"><strong>Adoption —</strong> ${esc(
          a.adoptionProfile,
        )}</div>` +
        `</div>`,
    )
    .join('');

  const rows = s.archetypes
    .map(
      (a) =>
        `<tr>` +
        `<td><strong>${esc(a.name)}</strong></td>` +
        `<td>${esc(postureLabel(a.controlPosture))}</td>` +
        `<td>${
          a.dataDependencies.length > 0
            ? a.dataDependencies.map((d) => esc(d)).join('; ')
            : '—'
        }</td>` +
        `<td>${
          a.controlRiskNotes.length > 0
            ? a.controlRiskNotes.map((n) => esc(n)).join('; ')
            : '—'
        }</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `The architecture must support ${s.archetypes.length} curated AI ` +
        `use-case archetypes — the recurring AI bets in this function. The ` +
        `agent recognises the bet instead of reasoning from zero; each ` +
        `archetype carries a named value mechanism and a control posture.`,
    ) +
    heroExhibitHtml(
      'Exhibit 4 — The curated AI use-case archetypes',
      `<div class="pattern-cards">${cards}</div>`,
    ) +
    detail(
      'Archetype table — control posture, data dependencies, control/risk notes',
      `<table class="data-table">` +
        `<thead><tr><th>AI use-case archetype</th><th>Control posture</th>` +
        `<th>Data dependencies</th><th>Control / risk notes</th></tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Control posture.
// ===========================================================================

function renderControlPosture(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.controlPosture;

  const pointRows = s.accountabilityPoints
    .map(
      (p) =>
        `<tr>` +
        `<td><strong>${esc(p.pattern)}</strong></td>` +
        `<td>${esc(postureLabel(p.posture))}</td>` +
        `<td>${esc(p.owner)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'The agent retrieves, drafts and prepares — but the decision to act ' +
        'belongs to a named human. The accountability checkpoint is a real ' +
        'step in the workflow, drawn from the curated patterns’ control ' +
        'posture, not a footnote.',
    ) +
    heroExhibit(
      'Exhibit 5 — Human / agent accountability map: where the human decides',
      accountabilityMap(
        s.steps.map((st) => ({
          label: st.label,
          lane: st.lane,
          note: st.note,
          checkpoint: st.checkpoint,
        })),
      ),
      'The agent lane and the human lane are explicit; the accountability ' +
        'checkpoint is drawn emphasised — the diagram shows, not asserts, ' +
        'where a named human stays in the loop.',
    ) +
    detail(
      'Accountability points — the named owner per curated pattern',
      `<table class="data-table">` +
        `<thead><tr><th>Reference pattern</th><th>Control posture</th>` +
        `<th>Human accountability point</th></tr></thead>` +
        `<tbody>${pointRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — Evidence and gaps.
// ===========================================================================

function renderEvidenceGaps(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.evidenceGaps;

  const matrixRows = s.matrix
    .map(
      (m) =>
        `<tr class="${m.recorded ? '' : 'row-proxy'}">` +
        `<td>${esc(m.label)}${
          m.recorded
            ? ' <span class="chip chip-good">Recorded</span>'
            : ' <span class="chip chip-bad">Seed gap</span>'
        }</td>` +
        `<td>${esc(m.detail)}</td>` +
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
    heroExhibitHtml(
      'Exhibit 6 — Baseline coverage: recorded against seed-gapped',
      `<div class="coverage-tiles">` +
        `<div class="coverage-tile coverage-neutral">` +
        `<div class="coverage-num">${s.recordedCount}</div>` +
        `<div class="coverage-label">Recorded metrics</div>` +
        `<div class="coverage-sub">Measured by the Move</div>` +
        `</div>` +
        `<div class="coverage-tile coverage-gap">` +
        `<div class="coverage-num">${s.gapCount}</div>` +
        `<div class="coverage-label">Declared seed gaps</div>` +
        `<div class="coverage-sub">Named, never blank</div>` +
        `</div>` +
        `<div class="coverage-tile coverage-neutral">` +
        `<div class="coverage-num">${s.coveragePct}%</div>` +
        `<div class="coverage-label">Baseline coverage</div>` +
        `<div class="coverage-sub">Recorded ÷ expected</div>` +
        `</div>` +
        `</div>` +
        (s.matrix.length > 0
          ? `<table class="data-table">` +
            `<thead><tr><th>Operating metric</th>` +
            `<th>Source or declared gap</th></tr></thead>` +
            `<tbody>${matrixRows}</tbody>` +
            `</table>`
          : ''),
    ) +
    (s.seedGaps.length > 0
      ? detail(
          'Seed gaps — declared, never blank, named with their source',
          `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th>Why it is a gap</th>` +
            `<th>Expected data source</th></tr></thead>` +
            `<tbody>${gapRows}</tbody>` +
            `</table>`,
        )
      : '');
  return slide(s.anatomy, arch.moveLabel, 7, hero);
}

// ===========================================================================
// Slide 7 — Open architecture decisions.
// ===========================================================================

function renderOpenDecisions(arch: MoveSolutionArchitecture): string {
  const s = arch.sections.openDecisions;

  const decisionRows = s.decisions
    .slice()
    .sort((a, b) => b.impact - a.impact)
    .map(
      (d) =>
        `<tr class="${d.blocksGate ? 'row-proxy' : ''}">` +
        `<td>${esc(d.decision)}${
          d.blocksGate
            ? ' <span class="chip chip-bad">Blocks gate</span>'
            : ' <span class="chip chip-warn">Informs gate</span>'
        }</td>` +
        `<td>${esc(d.owner)}</td>` +
        `<td>${esc(d.gate)}</td>` +
        `</tr>`,
    )
    .join('');

  const blockCount = s.decisions.filter((d) => d.blocksGate).length;

  const hero =
    lede(
      `${s.decisions.length} architecture decisions are still open. ` +
        `${blockCount} of them block the production gate — closing those is ` +
        'the work that stands between this architecture and a go-live.',
    ) +
    heroExhibit(
      'Exhibit 7 — Open architecture-decision queue, by gate impact',
      openDecisionQueue(
        s.decisions.map((d) => ({
          decision: d.decision,
          owner: d.owner,
          gate: d.gate,
          impact: d.impact,
          blocksGate: d.blocksGate,
        })),
      ),
      'The queue is ordered by gate impact — the widest bar is the next ' +
        'decision. A gate-blocking decision is drawn red.',
    ) +
    detail(
      'Open-decision table — owner and gate',
      `<table class="data-table">` +
        `<thead><tr><th>Open architecture decision</th><th>Owner</th>` +
        `<th>Gate</th></tr></thead>` +
        `<tbody>${decisionRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch.moveLabel, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(arch: MoveSolutionArchitecture): string {
  const verdictWord = arch.verdict.toUpperCase();
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Solution Architecture Pack · Kernel-derived for a real Move',
    title: arch.moveLabel,
    tenantLine: `${arch.tenantLabel} · ${arch.functionLabel}`,
    lede:
      'A target-state architecture produced by the Moves Expert Kernel for ' +
      'this Move. The section structure is **inherited** from the curated ' +
      'Domain Function Pack; the target-state architecture, the reference ' +
      'patterns and the AI archetypes are the pack’s curated material — the ' +
      'recommended pattern is the most human-accountable, never full ' +
      'autonomy. Declared seed gaps stay declared.',
    meta: [
      { label: 'Architecture verdict', value: verdictWord },
      { label: 'Target pattern', value: 'Curated reference pattern' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: arch.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Solution-Architecture-specific styles — appended after the shared deck CSS.
// Mirrors the Apex renderer's `archStyles`; adds no new palette colour.
// ===========================================================================

function archStyles(): string {
  return `
/* --- Move Solution Architecture — target-state pattern cards. --- */
.pattern-cards { display: flex; flex-direction: column; gap: 10px; }
.pattern-card {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 16px;
  background: #fff;
}
.pattern-rejected { border-left: 3px solid #8B1F0F; background: #fdf6e8; }
.pattern-selected { border-left: 3px solid #2f6b3f; background: #f3f7f1; }
.pattern-foundation { border-left: 3px solid #2c4a6e; background: #f1f4f8; }
.chip-found {
  display: inline-block; font-size: 9.5px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 7px;
  border-radius: 999px; border: 1px solid #2c4a6e; background: #e3eaf3;
  color: #2c4a6e;
}
.pattern-name {
  font-size: 12.5px; font-weight: 800; color: #1c1a17; line-height: 1.35;
  display: flex; gap: 9px; align-items: baseline; flex-wrap: wrap;
}
.pattern-detail {
  font-size: 11px; color: #5b5852; margin-top: 6px; line-height: 1.5;
}
`;
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated architecture.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Solution Architecture Pack',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Solution Architecture Pack — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Solution Architecture Pack · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot produce a curated target-state ' +
        'architecture** for this Move — no curated Domain Function Pack ' +
        'covers its function. This is a known curated-depth gap, surfaced ' +
        'honestly. No architecture is fabricated.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Architecture', value: 'Not produced' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade architecture.',
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
        'kernel cannot produce a board-grade target-state architecture.',
      hero:
        lede(
          'AbarVa’s board-grade Solution Architecture Pack is grounded in a ' +
            'curated Domain Function Pack — the pack supplies the deliverable ' +
            'outline, the reference solution patterns, and the AI use-case ' +
            'archetypes the architecture is shaped around. Without one, the ' +
            'kernel will not fabricate an architecture.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade architecture',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade architecture for ` +
        `this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function — carrying a ` +
        `solution-architecture outline. This is surfaced as a gap, not ` +
        `papered over with a fabricated architecture.</p>`,
      footer: [
        {
          key: 'So what',
          val:
            'The agent falls back to general reasoning for this Move — a ' +
            'known curated-depth gap.',
        },
        {
          key: 'Decision role',
          val: 'No architecture decision is supported.',
        },
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
      navPreview: 'Why this Move has no board-grade architecture',
      render: () => noteSlide(),
    },
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${archStyles()}</style>`);
}

// ===========================================================================
// Public entry — render the generic Move Solution Architecture Pack.
// ===========================================================================

/**
 * Render the generic Move Solution Architecture Pack as one self-contained
 * HTML document. Projects the deck from `buildMoveSolutionArchitecture`.
 *
 * When the Move binds a curated pack, renders the full bound deck. When the
 * Move is unbound, renders the honest unbound document — never a fabricated
 * architecture. Deterministic — a pure function of the Move + `generatedOn`.
 */
export function renderMoveSolutionArchitectureHtml(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): string {
  const result: MoveSolutionArchitectureResult = buildMoveSolutionArchitecture(
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
function renderBoundDocument(arch: MoveSolutionArchitecture): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Solution Architecture Pack',
    moveLabel: arch.moveLabel,
    tenantLabel: arch.tenantLabel,
    tenantKey: arch.tenantKey,
    generatedOn: arch.generatedOn,
    verdict: {
      label: arch.verdict.toUpperCase(),
      sub: arch.verdictSub,
    },
    documentTitle: `${arch.moveLabel} — Solution Architecture Pack — ${arch.tenantLabel}`,
  };

  const renderers: Array<(a: MoveSolutionArchitecture) => string> = [
    renderArchitectureDecision,
    renderInheritedOutline,
    renderTargetArchitecture,
    renderArchetypes,
    renderControlPosture,
    renderEvidenceGaps,
    renderOpenDecisions,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Solution Architecture Pack',
      render: () => renderCover(arch),
    },
    ...arch.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](arch),
    })),
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${archStyles()}</style>`);
}
