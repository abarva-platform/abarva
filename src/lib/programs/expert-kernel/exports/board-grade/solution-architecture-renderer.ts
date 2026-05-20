// Board-grade Solution Architecture Pack — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack and
// the Discover Brief, composed by the shared `deck-shell` module. The reader
// flips slides; for print an `@media print` block expands the deck into the
// full document.
//
// The deck is a cover plus the nine blueprint §7 Solution Architecture Pack
// sections:
//   1. Architecture decision   — what architecture should we shape around?
//   2. Context view            — where does the solution sit in the enterprise?
//   3. Logical architecture    — what components are being funded?
//   4. Data flow               — what data moves, where, under what controls?
//   5. Integration map         — what must integrate and what is a gap?
//   6. Build/buy/partner        — what do we build, buy, partner for, retain?
//   7. Human accountability    — where does the human stay in the loop?
//   8. Controls and risks      — what must be true before production?
//   9. Open architecture decisions — what remains unresolved?
//
// Each section's hero exhibit is a genuine architecture diagram drawn by the
// matching `svg-architecture.ts` builder — an option scorecard, three
// node-and-edge diagrams, an integration map, a build/buy lane map, an
// accountability swimlane, a control overlay + risk heatmap, and an open-
// decision queue. Blueprint §7 hard fails are honoured: every section has a
// diagram, data sources and control points are explicit, the build/buy/partner
// boundary is unambiguous, the sensitive workflow carries a privacy/control
// review, and full autonomy is NOT recommended — the human-in-loop pattern is.
//
// All CSS is inlined, every exhibit is an inline SVG, the slide-switch script
// is inline — the file opens offline. The renderer is PURE: a deterministic
// function of the kernel view-model. It changes no kernel logic; declared gaps
// (the CDP gap node, the transcript-privacy blocker) stay declared.

import {
  buildApexSolutionArchitecture,
  type SolutionArchitecture,
  type ArchSectionAnatomy,
  type ArchEvidenceStrip,
} from './solution-architecture-model';
import {
  type DeckMeta,
  type DeckSlide,
  type FooterFact,
  coverSlide,
  detailStrip,
  escapeHtml as esc,
  heroExhibit,
  lede,
  renderDeckDocument,
  slideShell,
} from './deck-shell';
import {
  accountabilityMap,
  archRiskHeatmap,
  boundaryLaneMap,
  contextDiagram,
  controlOverlay,
  integrationMap,
  layeredFlow,
  openDecisionQueue,
  optionScorecard,
} from './svg-architecture';

// The deck has a fixed slide count — the cover plus the nine §7 sections.
const SLIDE_COUNT = 10;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: ArchEvidenceStrip['confidence']): string {
  const map: Record<ArchEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — decision role / evidence / owner / next gate. */
function footerFacts(a: ArchSectionAnatomy): FooterFact[] {
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
  a: ArchSectionAnatomy,
  arch: SolutionArchitecture,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: arch.moveLabel,
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
// Slide 1 — Architecture decision.
// ===========================================================================

function renderArchitectureDecision(arch: SolutionArchitecture): string {
  const s = arch.sections.architectureDecision;
  const tp = arch.targetPattern;

  const rejectedRows = tp.rejected
    .map(
      (r) =>
        `<div class="pattern-card pattern-rejected">` +
        `<div class="pattern-name">${esc(r.name)} ` +
        `<span class="chip chip-bad">Rejected</span></div>` +
        `<div class="pattern-detail">${esc(r.reason)}</div>` +
        `</div>`,
    )
    .join('');

  const hero =
    `<div class="board-card verdict-shape">` +
    `<div class="board-card-tag">Target-state architecture pattern</div>` +
    `<div class="board-verdict">${esc(tp.name)}</div>` +
    `<p class="board-detail">${esc(tp.oneLine)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — Architecture option scorecard: selected against rejected',
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
      'Every candidate is scored against the eight §4 reference-architecture ' +
        'components; the selected pattern is the responsible target, not the ' +
        'most ambitious option on the board.',
    ) +
    detail(
      'Patterns considered and rejected, and the decision rationale',
      `<div class="pattern-cards">${rejectedRows}</div>` +
        `<div class="mini-key mini-key-block">Decision rationale</div>` +
        `<ul class="mini-list">` +
        s.reasons.map((r) => `<li>${esc(r)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, arch, 2, hero);
}

// ===========================================================================
// Slide 2 — Context view.
// ===========================================================================

function renderContextView(arch: SolutionArchitecture): string {
  const s = arch.sections.contextView;

  const hero =
    lede(
      'The solution sits in its own zone behind the AbarVa broker boundary. ' +
        'It reads the systems of record for grounding evidence, but every ' +
        'consequential action crosses a human checkpoint before it touches ' +
        'an operational system.',
    ) +
    heroExhibit(
      'Exhibit 2 — Architecture context diagram: enterprise, systems, solution',
      contextDiagram({
        enterprise: s.enterprise.map((n) => ({
          title: n.title,
          sub: n.sub,
          role: n.role,
          gap: n.gap,
        })),
        systems: s.systems.map((n) => ({
          title: n.title,
          sub: n.sub,
          role: n.role,
          gap: n.gap,
        })),
        solution: s.solution.map((n) => ({
          title: n.title,
          sub: n.sub,
          role: n.role,
          gap: n.gap,
        })),
      }),
      'The systems-of-record band is always present and labelled; the ' +
        'gap-state CDP node is drawn AS a gap — it is not backfilled with an ' +
        'invented integration.',
    ) +
    detail(
      'Context-diagram notes — the boundary the design holds',
      `<ul class="mini-list">` +
        s.notes.map((n) => `<li>${esc(n)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, arch, 3, hero);
}

// ===========================================================================
// Slide 3 — Logical architecture.
// ===========================================================================

function renderLogicalArchitecture(arch: SolutionArchitecture): string {
  const s = arch.sections.logicalArchitecture;

  const componentRows = s.components
    .map(
      (c) =>
        `<tr>` +
        `<td>${esc(c.component)}</td>` +
        `<td>${esc(c.responsibility)}</td>` +
        `<td>${esc(c.owner)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'Six components are being funded. The diagram shows the responsibility ' +
        'of each and the owner accountable for it — the guardrail and ' +
        'eval-harness component is where the production quality bar lives.',
    ) +
    heroExhibit(
      'Exhibit 3 — Logical architecture: components, responsibilities, owners',
      layeredFlow({
        stages: s.stages.map((st) => ({
          title: st.title,
          sub: st.sub,
          role: st.role,
          gap: st.gap,
          side: st.side,
        })),
        edges: s.edges,
        laneLabel: 'Component',
        sideLabel: 'Ownership / control point',
      }),
      'Each stage is a funded component; the right gutter names the team ' +
        'accountable for it and the control point it carries.',
    ) +
    detail(
      'Component table — responsibility and ownership, and the trade-offs',
      `<table class="data-table">` +
        `<thead><tr><th>Component</th><th>Responsibility</th>` +
        `<th>Owner</th></tr></thead>` +
        `<tbody>${componentRows}</tbody>` +
        `</table>` +
        `<div class="mini-key mini-key-block">Design notes and trade-offs</div>` +
        `<ul class="mini-list">` +
        s.notes.map((n) => `<li>${esc(n)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, arch, 4, hero);
}

// ===========================================================================
// Slide 4 — Data flow.
// ===========================================================================

function renderDataFlow(arch: SolutionArchitecture): string {
  const s = arch.sections.dataFlow;

  const hero =
    lede(
      'Data flows read-first. Evidence is retrieved through the broker, ' +
        'grounded into a prompt, and turned into a recommendation — but ' +
        'nothing mutates a system of record until the human checkpoint has ' +
        'approved the action.',
    ) +
    heroExhibit(
      'Exhibit 4 — Data and decision flow: sources, controls, the mutation barrier',
      layeredFlow({
        stages: s.stages.map((st) => ({
          title: st.title,
          sub: st.sub,
          role: st.role,
          gap: st.gap,
          side: st.side,
        })),
        edges: s.edges,
        laneLabel: 'Flow stage',
        sideLabel: 'Control on this hop',
      }),
      'Every hop carries its control; the human checkpoint is the mutation ' +
        'barrier — no write reaches an operational system without it.',
    ) +
    detail(
      'Data sources and the control points on the flow',
      `<div class="mini-key mini-key-block">` +
        `Data sources feeding the broker (${s.dataSources.length})</div>` +
        `<ul class="mini-list">` +
        s.dataSources.map((d) => `<li>${esc(d)}</li>`).join('') +
        `</ul>` +
        `<div class="mini-key mini-key-block">Control points on the flow</div>` +
        `<ul class="mini-list">` +
        s.controlPoints.map((c) => `<li>${esc(c)}</li>`).join('') +
        `</ul>` +
        `<div class="mini-key mini-key-block mini-key-gap">` +
        `Declared gap carried forward</div>` +
        `<ul class="mini-list">` +
        s.notes.map((n) => `<li>${esc(n)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, arch, 5, hero);
}

// ===========================================================================
// Slide 5 — Integration map.
// ===========================================================================

function renderIntegrationMap(arch: SolutionArchitecture): string {
  const s = arch.sections.integrationMap;

  const integrationRows = s.rows
    .map(
      (r) =>
        `<tr class="${r.status === 'gap' ? 'row-proxy' : ''}">` +
        `<td>${esc(r.system)}${
          r.status === 'gap'
            ? ' <span class="chip chip-bad">Gap</span>'
            : ' <span class="chip chip-good">Grounded</span>'
        }</td>` +
        `<td>${esc(r.mode)}</td>` +
        `<td>${esc(r.owner)}</td>` +
        `<td>${esc(r.role)}</td>` +
        `<td>${esc(r.evidence)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Of ${s.rows.length} integrations, ${s.groundedCount} are grounded and ` +
        `ready and ${s.gapCount} is a declared gap. The unified intent layer ` +
        'is the gap that bounds how far intent-driven autonomy can expand.',
    ) +
    heroExhibit(
      'Exhibit 5 — Integration readiness map: systems wired to the broker',
      integrationMap(
        s.rows.map((r) => ({
          system: r.system,
          mode: r.mode,
          owner: r.owner,
          status: r.status,
          role: r.role,
        })),
      ),
      'A grounded integration path is solid; the gap path is dashed and the ' +
        'system box reads AS a gap — readiness is legible without prose.',
    ) +
    detail(
      'Integration table — system, path, owner, role and evidence',
      `<table class="data-table">` +
        `<thead><tr><th>System / integration</th><th>Path</th>` +
        `<th>Owner</th><th>Role</th><th>Evidence</th></tr></thead>` +
        `<tbody>${integrationRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch, 6, hero);
}

// ===========================================================================
// Slide 6 — Build / buy / partner boundary.
// ===========================================================================

function renderBuildBuyPartner(arch: SolutionArchitecture): string {
  const s = arch.sections.buildBuyPartner;

  const laneRows = s.lanes
    .map(
      (l) =>
        `<tr>` +
        `<td>${esc(l.lane)}</td>` +
        `<td>${dispositionChip(l.disposition)}</td>` +
        `<td>${esc(l.owner)}</td>` +
        `<td>${esc(l.rationale)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'The delivery boundary is unambiguous. The platform is bought, model ' +
        'operations are partnered for, and the workflow change is retained ' +
        'in-house — there is no lane Apex should custom-build.',
    ) +
    heroExhibit(
      'Exhibit 6 — Build / buy / partner / retain lane map',
      boundaryLaneMap(
        s.lanes.map((l) => ({
          lane: l.lane,
          disposition: l.disposition,
          owner: l.owner,
          rationale: l.rationale,
        })),
      ),
      'Each capability sits in exactly one disposition column with a named ' +
        'owner; an empty column still renders so the boundary is unambiguous.',
    ) +
    detail(
      'Boundary table — lane, disposition, owner and rationale',
      `<table class="data-table">` +
        `<thead><tr><th>Capability lane</th><th>Disposition</th>` +
        `<th>Owner</th><th>Rationale</th></tr></thead>` +
        `<tbody>${laneRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch, 7, hero);
}

function dispositionChip(
  d: 'build' | 'buy' | 'partner' | 'retain',
): string {
  const map: Record<
    'build' | 'buy' | 'partner' | 'retain',
    { cls: string; label: string }
  > = {
    build: { cls: 'chip-warn', label: 'Build' },
    buy: { cls: 'chip-warn', label: 'Buy' },
    partner: { cls: 'chip-warn', label: 'Partner' },
    retain: { cls: 'chip-good', label: 'Retain' },
  };
  const m = map[d];
  return `<span class="chip ${m.cls}">${m.label}</span>`;
}

// ===========================================================================
// Slide 7 — Human accountability.
// ===========================================================================

function renderHumanAccountability(arch: SolutionArchitecture): string {
  const s = arch.sections.humanAccountability;

  const rightRows = s.decisionRights
    .map(
      (r) =>
        `<tr>` +
        `<td>${esc(r.step)}</td>` +
        `<td>${esc(r.owner)}</td>` +
        `<td>${esc(r.right)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'The agent retrieves, drafts and prepares — but the decision to act ' +
        'belongs to a named human. The accountability checkpoint is a real ' +
        'step in the workflow, not a footnote.',
    ) +
    heroExhibit(
      'Exhibit 7 — Human / agent accountability map: where the human decides',
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
      'Decision-rights table — who holds which right',
      `<table class="data-table">` +
        `<thead><tr><th>Workflow step</th><th>Owner</th>` +
        `<th>Decision right</th></tr></thead>` +
        `<tbody>${rightRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch, 8, hero);
}

// ===========================================================================
// Slide 8 — Controls and risks.
// ===========================================================================

function renderControlsAndRisks(arch: SolutionArchitecture): string {
  const s = arch.sections.controlsAndRisks;

  const riskRows = s.risks
    .map(
      (r, i) =>
        `<tr class="${r.severity === 'blocker' ? 'row-proxy' : ''}">` +
        `<td>AR${i + 1}</td>` +
        `<td>${esc(r.label)} ${severityChip(r.severity)}</td>` +
        `<td>${esc(r.message)}</td>` +
        `<td>${esc(r.fixCondition)}</td>` +
        `</tr>`,
    )
    .join('');

  const blockerCount = s.risks.filter((r) => r.severity === 'blocker').length;

  const hero =
    lede(
      `All eight §4 reference-architecture controls are native — a reference ` +
        `score of ${s.referenceScore} / 100. But a green control overlay ` +
        `does not clear the gate: ${blockerCount} blocker` +
        `${blockerCount === 1 ? '' : 's'} must close before production.`,
    ) +
    heroExhibit(
      'Exhibit 8a — Reference-architecture control overlay (the eight §4 controls)',
      controlOverlay(
        s.controls.map((c) => ({
          label: c.label,
          coverage: c.coverage,
          note: c.note,
        })),
      ),
      'A native control reads green, a partial control amber, a missing ' +
        'control red — the production-gate picture is legible at a glance.',
    ) +
    heroExhibit(
      'Exhibit 8b — Architecture risk heatmap (likelihood × impact)',
      archRiskHeatmap(
        s.riskPoints.map((p) => ({
          likelihood: p.likelihood,
          impact: p.impact,
          code: p.code,
          blocker: p.blocker,
        })),
      ),
      'A blocker is a square; a watch risk is a circle. A blocker must clear ' +
        'before production — a green control overlay alone does not.',
    ) +
    detail(
      'Architecture risk register — message and fix condition',
      `<table class="data-table">` +
        `<thead><tr><th>ID</th><th>Risk</th><th>What it means</th>` +
        `<th>Fix condition</th></tr></thead>` +
        `<tbody>${riskRows}</tbody>` +
        `</table>`,
    );
  return slide(s.anatomy, arch, 9, hero);
}

function severityChip(s: 'blocker' | 'watch' | 'managed'): string {
  if (s === 'blocker') return '<span class="chip chip-bad">Blocker</span>';
  if (s === 'watch') return '<span class="chip chip-warn">Watch</span>';
  return '<span class="chip chip-good">Managed</span>';
}

// ===========================================================================
// Slide 9 — Open architecture decisions.
// ===========================================================================

function renderOpenDecisions(arch: SolutionArchitecture): string {
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
      'Exhibit 9 — Open architecture-decision queue, by gate impact',
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
  return slide(s.anatomy, arch, 10, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(arch: SolutionArchitecture): string {
  const verdictWord =
    arch.verdict === 'shape'
      ? 'SHAPE'
      : arch.verdict === 'hold'
        ? 'HOLD'
        : 'CONDITIONAL';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Solution Architecture Pack · Board-grade artifact',
    title: arch.moveLabel,
    tenantLine: `${arch.tenantLabel} · ${arch.tenantKey}`,
    lede:
      'A target-state architecture in 10 slides. Every node, edge, lane and ' +
      "risk is produced by the Moves Expert Kernel from Apex's audited " +
      'substrate. The recommended pattern is a **broker-mediated ' +
      'human-in-the-loop agent** — agent-assist over the system of record, ' +
      'not full autonomy. Declared gaps stay declared.',
    meta: [
      { label: 'Architecture verdict', value: verdictWord },
      { label: 'Target pattern', value: 'Human-in-the-loop agent' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: arch.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Solution-Architecture-specific styles — appended after the shared deck CSS.
// These reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function archStyles(): string {
  return `
/* --- Solution Architecture — target-state pattern cards. --- */
.pattern-cards { display: flex; flex-direction: column; gap: 10px; }
.pattern-card {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 16px;
  background: #fff;
}
.pattern-rejected { border-left: 3px solid #8B1F0F; background: #fdf6e8; }
.pattern-name {
  font-size: 12.5px; font-weight: 800; color: #1c1a17; line-height: 1.35;
  display: flex; gap: 9px; align-items: baseline; flex-wrap: wrap;
}
.pattern-detail {
  font-size: 11px; color: #5b5852; margin-top: 6px; line-height: 1.5;
}
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
`;
}

// ===========================================================================
// The full document — the Solution Architecture Pack's ten slides handed to
// the deck shell. The shell owns the menu rail, the stage, the inline script
// and the print expansion; this renderer supplies the slides and the
// pack-specific style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Solution Architecture Pack as one
 * self-contained HTML document — a left-menu presentation deck. Deterministic
 * — a pure function of `generatedOn`.
 */
export function renderApexSolutionArchitectureHtml(
  generatedOn: string,
): string {
  const arch = buildApexSolutionArchitecture(generatedOn);

  const verdictWord =
    arch.verdict === 'shape'
      ? 'SHAPE'
      : arch.verdict === 'hold'
        ? 'HOLD'
        : 'CONDITIONAL';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Solution Architecture Pack',
    moveLabel: arch.moveLabel,
    tenantLabel: arch.tenantLabel,
    tenantKey: arch.tenantKey,
    generatedOn: arch.generatedOn,
    verdict: {
      label: verdictWord,
      sub: arch.verdictSub,
    },
    documentTitle:
      `${arch.moveLabel} — Solution Architecture Pack — ${arch.tenantLabel}`,
  };

  const renderers: Array<(a: SolutionArchitecture) => string> = [
    renderArchitectureDecision,
    renderContextView,
    renderLogicalArchitecture,
    renderDataFlow,
    renderIntegrationMap,
    renderBuildBuyPartner,
    renderHumanAccountability,
    renderControlsAndRisks,
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

  // The deck shell composes the full document; the pack-specific styles are
  // injected just before `</style>` so they sit after the shared deck CSS.
  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${archStyles()}</style>`);
}
