// Board-grade Mobilize & Go-Decision Packet — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the Costed Business-Case Pack,
// the Discover Brief and the Solution Architecture Pack, composed by the
// shared `deck-shell` module. The reader flips slides; for print an
// `@media print` block expands the deck into the full document.
//
// The deck is a cover plus the eight blueprint §11 / Appendix A.7 sections:
//   1. Go / no-go answer       — are we ready to mobilize?
//   2. 30/60/90 mobilization   — what happens first?
//   3. Owners & decision rights — who owns execution and exceptions?
//   4. Adoption & change       — what must change in the business?
//   5. Controls & readiness    — what must be true before launch?
//   6. Tower measurement handoff — what will be measured after launch?
//   7. Open action queue       — what blocks go-live?
//   8. Signoff                 — who has approved what?
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant hero exhibit, minimal prose, and a quiet
// footer. All CSS is inlined, every exhibit is an inline SVG or HTML diagram,
// the slide-switch script is inline — the file opens offline. The renderer is
// PURE: a deterministic function of the kernel view-model. It changes no
// kernel logic; the go-decision verdict is rendered EXACTLY as the kernel
// returns it — for Apex, `no_go` — never upgraded.

import {
  buildApexMobilizePacket,
  type MobilizePacket,
  type MobilizeSectionAnatomy,
  type MobilizeEvidenceStrip,
} from './mobilize-packet-model';
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
  mobilizeSwimlane,
  readinessHeatmap,
  gapClosureQueue,
} from './svg-charts';

// The deck has a fixed slide count — the cover plus the eight §11 sections.
const SLIDE_COUNT = 9;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MobilizeEvidenceStrip['confidence']): string {
  const map: Record<MobilizeEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — so-what / decision role / owner / evidence / gate. */
function footerFacts(a: MobilizeSectionAnatomy): FooterFact[] {
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
  a: MobilizeSectionAnatomy,
  packet: MobilizePacket,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: packet.moveLabel,
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

// ===========================================================================
// Slide 1 — Go / no-go answer.
// ===========================================================================

function renderGoDecision(packet: MobilizePacket): string {
  const s = packet.sections.goDecision;
  const verdictClass =
    packet.verdict === 'go'
      ? 'verdict-fund'
      : packet.verdict === 'no_go'
        ? 'verdict-kill'
        : 'verdict-shape';

  const stateChip = (ok: boolean): string =>
    ok
      ? '<span class="chip chip-good">Yes</span>'
      : '<span class="chip chip-bad">No</span>';

  const triggerCards =
    s.firedTriggers.length === 0
      ? `<p class="mini-para">No Mobilize kill trigger fired.</p>`
      : `<div class="checklist">` +
        s.firedTriggers
          .map(
            (t) =>
              `<div class="check-row check-hold">` +
              `<div class="check-mark">` +
              `<span class="chip chip-bad">Fired</span></div>` +
              `<div class="check-body">` +
              `<div class="check-label">${esc(t.code)}</div>` +
              `<div class="check-detail">${esc(t.observation)}</div>` +
              `<div class="check-detail"><strong>Fix —</strong> ${esc(t.fix)}</div>` +
              `</div></div>`,
          )
          .join('') +
        `</div>`;

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Go-decision</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
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
      'Exhibit 1b — Fired kill triggers: what holds the launch gate',
      triggerCards,
    ) +
    detail(
      'Conditions to clear before the verdict can be upgraded',
      `<ul class="mini-list">` +
        s.conditions
          .map(
            (c) =>
              `<li><strong>${esc(c.code)}</strong> — ${esc(c.condition)}</li>`,
          )
          .join('') +
        `</ul>`,
    );
  return slide(s.anatomy, packet, 2, hero);
}

// ===========================================================================
// Slide 2 — 30/60/90 mobilization plan.
// ===========================================================================

function renderMobilizationPlan(packet: MobilizePacket): string {
  const s = packet.sections.mobilizationPlan;

  const hero =
    lede(
      'Mobilization does not start with the pilot — it starts with the ' +
        'operating spine. The first 90 days name the operating-model owner, ' +
        'stand up governance, run the foundational data work and wire the ' +
        'Tower measurement loop. The pilot is sequenced, not rushed.',
    ) +
    heroExhibit(
      'Exhibit 2 — 30/60/90 mobilization plan: stand up, wire the loop, ready the pilot',
      mobilizeSwimlane(
        s.bands.map((b) => ({
          label: b.label,
          milestones: b.milestones,
        })),
      ),
      'Each band carries specific, owned milestones drawn from the costed ' +
        'roadmap and the fired-trigger fix conditions — not generic phases.',
    );
  return slide(s.anatomy, packet, 3, hero);
}

// ===========================================================================
// Slide 3 — Owners & decision rights (RACI).
// ===========================================================================

function renderOwnersDecisionRights(packet: MobilizePacket): string {
  const s = packet.sections.ownersDecisionRights;

  const autonomyChip = (a: string | null): string => {
    if (!a) return '—';
    const label = a.replace(/_/g, ' ');
    return `<span class="chip chip-warn">${esc(label)}</span>`;
  };

  const rows = s.decisions
    .map(
      (d) =>
        `<tr>` +
        `<td>${esc(d.decision)}</td>` +
        `<td><strong>${esc(d.accountable)}</strong></td>` +
        `<td>${esc(d.responsible)}</td>` +
        `<td>${esc(d.consulted.join(', ') || '—')}</td>` +
        `<td>${esc(d.informed.join(', ') || '—')}</td>` +
        `<td class="num">${autonomyChip(d.agentAutonomy)}</td>` +
        `</tr>`,
    )
    .join('');

  const partyChips = s.parties
    .map(
      (p) =>
        `<span class="party-chip party-${p.kind}">${esc(p.name)}` +
        ` <span class="party-kind">${p.kind}</span></span>`,
    )
    .join('');

  const hero =
    lede(
      'Execution needs unambiguous accountability. Every decision in the ' +
        'RACI has exactly one accountable owner; where an AI agent is ' +
        'Responsible, its autonomy is bounded — recommend or act-with-' +
        'approval, never unbounded action on a governance decision.',
    ) +
    heroExhibitHtml(
      'Exhibit 3 — RACI: decision rights across human and agent parties',
      `<div class="party-row">${partyChips}</div>` +
        `<table class="data-table">` +
        `<thead><tr><th>Decision</th><th>Accountable</th>` +
        `<th>Responsible</th><th>Consulted</th><th>Informed</th>` +
        `<th class="num">Agent autonomy</th></tr></thead>` +
        `<tbody>${rows}</tbody></table>`,
      'A governance decision is never agent-accountable; an agent that acts ' +
        'does so only with a bounded autonomy level.',
    );
  return slide(s.anatomy, packet, 4, hero);
}

// ===========================================================================
// Slide 4 — Adoption & change.
// ===========================================================================

function renderAdoptionChange(packet: MobilizePacket): string {
  const s = packet.sections.adoptionChange;

  const magChip = (m: string): string => {
    const cls =
      m === 'high' ? 'chip-bad' : m === 'low' ? 'chip-good' : 'chip-warn';
    return `<span class="chip ${cls}">${esc(m)}</span>`;
  };

  const roleCards =
    `<div class="pain-cards">` +
    s.impactedRoles
      .map(
        (r) =>
          `<div class="pain-card">` +
          `<div class="pain-theme">${esc(r.role)} ${magChip(
            r.changeMagnitude,
          )}</div>` +
          `<div class="pain-detail">${esc(r.whatChanges)}</div>` +
          (r.headcountIsProxy
            ? `<div class="pain-detail proxy-note">Headcount not ` +
              `recorded — a declared seed gap.</div>`
            : '') +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const dimRows = s.dimensions
    .map(
      (d) =>
        `<tr${d.restsOnSeedGap ? ' class="row-proxy"' : ''}>` +
        `<td>${esc(d.dimension)}</td>` +
        `<td class="num">${magChip(d.magnitude)}</td>` +
        `<td>${esc(d.recommendation)}</td>` +
        `<td>${esc(d.ownerRole)}${
          d.restsOnSeedGap
            ? ' <span class="chip chip-warn">Seed gap</span>'
            : ''
        }</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `The operating-model owner is ${esc(s.operatingModelOwner)}; overall ` +
        `change load is ${esc(s.overallChangeLoad)}, with an adoption ` +
        `confidence of ${Math.round(s.adoptionConfidence * 100)}%. The ` +
        'change is structured across seven dimensions and three impacted ' +
        'roles — a decision-grade approach, not a paragraph.',
    ) +
    heroExhibitHtml(
      'Exhibit 4 — Impacted roles: what concretely changes for each',
      roleCards,
    ) +
    detail(
      'Seven-dimension change assessment — recommendation and owner per dimension',
      `<table class="data-table">` +
        `<thead><tr><th>Change dimension</th><th class="num">Magnitude</th>` +
        `<th>Approach</th><th>Owner role</th></tr></thead>` +
        `<tbody>${dimRows}</tbody></table>` +
        `<p class="mini-para">A ${s.hypercareWeeks}-week hypercare window ` +
        `is planned — the weeks after go-live are when adoption is won or ` +
        `lost.</p>`,
    );
  return slide(s.anatomy, packet, 5, hero);
}

// ===========================================================================
// Slide 5 — Controls & readiness.
// ===========================================================================

function renderControlsReadiness(packet: MobilizePacket): string {
  const s = packet.sections.controlsReadiness;

  const blocked = s.rows.filter((r) => r.state === 'blocked').length;

  const hero =
    lede(
      `Seven readiness gates are scored. ${blocked} ${
        blocked === 1 ? 'is' : 'are'
      } blocked — and the blocked gates are exactly the reasons the ` +
        'go-decision lands at no-go. The heatmap makes the launch ' +
        'pre-conditions explicit, not assumed.',
    ) +
    heroExhibit(
      'Exhibit 5 — Launch readiness heatmap: what must be true before go-live',
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
  return slide(s.anatomy, packet, 6, hero);
}

// ===========================================================================
// Slide 6 — Tower measurement handoff.
// ===========================================================================

function renderTowerHandoff(packet: MobilizePacket): string {
  const s = packet.sections.towerHandoff;

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
        `<td class="num">${esc(m.target)}</td>` +
        `<td>${esc(m.cadence)}</td>` +
        `<td>${esc(m.owner)}</td>` +
        `</tr>` +
        `<tr${m.wired ? '' : ' class="row-proxy"'}>` +
        `<td colspan="5" class="readiness-note">${esc(m.readinessNote)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `Tower will measure ${s.metrics.length} committed value metrics — ` +
        `${s.wiredCount} are wired to a recorded Discover baseline ` +
        `(${Math.round(s.wiringCoverage * 100)}% coverage). The remaining ` +
        `${s.unwiredCount} — cost per contact — is an honest seed gap, ` +
        'carried with a dated capture plan, never dropped.',
    ) +
    heroExhibitHtml(
      'Exhibit 6 — Measurement handoff: every metric tied to the Discover baseline',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
        `<th class="num">Target</th><th>Cadence</th><th>Owner</th>` +
        `</tr></thead>` +
        `<tbody>${rows}</tbody></table>`,
      'Each metric ties to its Discover baseline value. The value loop ' +
        `${
          s.loopCloses
            ? 'closes — every metric is wired.'
            : 'does not yet close — cost-per-contact is unwired.'
        }`,
    );
  return slide(s.anatomy, packet, 7, hero);
}

// ===========================================================================
// Slide 7 — Open action queue.
// ===========================================================================

function renderOpenActions(packet: MobilizePacket): string {
  const s = packet.sections.openActions;

  const queueRows = s.actions.map((a, i) => ({
    label: a.action.slice(0, 64),
    owner: a.owner,
    due: a.due,
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
        `<td class="num">${esc(a.due)}</td>` +
        `<td>${esc(a.gateImpact)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'Nothing that gates the launch is unowned. Every open action — the ' +
        'two that fire kill triggers and the supporting pre-launch work — ' +
        'carries a named owner, a due date and an explicit gate impact.',
    ) +
    heroExhibit(
      'Exhibit 7 — Open action queue: gate blockers, by launch impact',
      gapClosureQueue(queueRows),
      'The widest bars are the two gate-blocking actions — the critical ' +
        'path from no-go to a conditional go.',
    ) +
    detail(
      'Open action queue — owner, due date and gate impact',
      `<table class="data-table">` +
        `<thead><tr><th>Open action</th><th>Owner</th>` +
        `<th class="num">Due</th><th>Gate impact</th></tr></thead>` +
        `<tbody>${tableRows}</tbody></table>`,
    );
  return slide(s.anatomy, packet, 8, hero);
}

// ===========================================================================
// Slide 8 — Signoff.
// ===========================================================================

function renderSignoff(packet: MobilizePacket): string {
  const s = packet.sections.signoff;

  const statusChip = (st: 'cleared' | 'conditional' | 'blocked'): string => {
    if (st === 'cleared') return '<span class="chip chip-good">Cleared</span>';
    if (st === 'blocked') return '<span class="chip chip-bad">Blocked</span>';
    return '<span class="chip chip-warn">Conditional</span>';
  };
  const rowClass = (st: 'cleared' | 'conditional' | 'blocked'): string =>
    st === 'cleared'
      ? 'check-approve'
      : st === 'blocked'
        ? 'check-hold'
        : 'check-condition';

  const checklist =
    `<div class="checklist">` +
    s.rows
      .map(
        (r) =>
          `<div class="check-row ${rowClass(r.status)}">` +
          `<div class="check-mark">${statusChip(r.status)}</div>` +
          `<div class="check-body">` +
          `<div class="check-label">${esc(r.role)} — ${esc(r.reviewer)}</div>` +
          `<div class="check-detail">${esc(r.note)}</div>` +
          `</div></div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      'Signoff records what each reviewer has cleared — it is a readiness ' +
        'record, not a final approval. Two reviewers are blocked and three ' +
        'are conditional; that is precisely why the go-decision is no-go. ' +
        'The launch gate is a separate, later decision.',
    ) +
    heroExhibitHtml(
      'Exhibit 8 — Signoff matrix: what each reviewer has cleared',
      checklist,
    );
  return slide(s.anatomy, packet, 9, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(packet: MobilizePacket): string {
  const verdictWord =
    packet.verdict === 'go'
      ? 'GO'
      : packet.verdict === 'conditional_go'
        ? 'CONDITIONAL GO'
        : 'NO-GO';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Mobilize & Go-Decision Packet · Board-grade artifact',
    title: packet.moveLabel,
    tenantLine: `${packet.tenantLabel} · ${packet.tenantKey}`,
    lede:
      'The Mobilize & Go-Decision Packet in 9 slides. Every figure is ' +
      "produced by the Moves Expert Kernel from Apex's audited substrate. " +
      'The go-decision is rendered exactly as the kernel returns it: ' +
      '**no-go** — two Mobilize kill triggers fired, so the Move cannot ' +
      'mobilize until they are cleared.',
    meta: [
      { label: 'Go-decision', value: verdictWord },
      { label: 'Readiness', value: 'Two gates blocked' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: packet.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Mobilize-Packet-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function mobilizeStyles(): string {
  return `
/* --- Mobilize packet — readiness chips row. --- */
.readiness-line {
  display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 16px;
}
.readiness-chip {
  display: inline-flex; gap: 7px; align-items: center;
  font-size: 11px; font-weight: 700; color: #2c2a26;
  background: #fff; border: 1px solid #e0dbcd; border-radius: 999px;
  padding: 6px 12px;
}
/* --- Party chips for the RACI exhibit. --- */
.party-row {
  display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px;
}
.party-chip {
  font-size: 10.5px; font-weight: 700; color: #1c1a17;
  background: #fff; border: 1px solid #cfc9b9; border-radius: 4px;
  padding: 5px 9px;
}
.party-agent { border-left: 3px solid #7A4F01; }
.party-human { border-left: 3px solid #0b4a91; }
.party-kind {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 8px; font-weight: 800; text-transform: uppercase;
  color: #8b8678; margin-left: 3px;
}
/* --- Impacted-role cards (reuse the pain-card register). --- */
.pain-cards {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
  margin: 8px 0 4px;
}
.pain-card {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 15px;
  background: #fff; border-top: 3px solid #0b4a91;
}
.pain-theme {
  font-size: 12px; font-weight: 800; color: #1c1a17; line-height: 1.35;
}
.pain-detail {
  font-size: 11px; color: #5b5852; margin-top: 6px; line-height: 1.5;
}
.proxy-note { color: #7A4F01; font-weight: 600; }
.readiness-note {
  font-size: 10.5px; color: #5b5852; background: #f7f5ef !important;
  line-height: 1.5; font-style: italic;
}
.row-proxy .readiness-note { color: #7A4F01; }
.mini-para {
  margin: 8px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
@media (max-width: 880px) {
  .pain-cards { grid-template-columns: 1fr; }
}
`;
}

// ===========================================================================
// The full document — the Mobilize Packet's nine slides handed to the deck
// shell. The shell owns the menu rail, the stage, the inline script and the
// print expansion; this renderer supplies the slides and the style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Mobilize & Go-Decision Packet as
 * one self-contained HTML document — a left-menu presentation deck.
 * Deterministic — a pure function of `generatedOn`.
 */
export function renderApexMobilizePacketHtml(generatedOn: string): string {
  const packet = buildApexMobilizePacket(generatedOn);
  const verdictWord =
    packet.verdict === 'go'
      ? 'GO'
      : packet.verdict === 'conditional_go'
        ? 'CONDITIONAL GO'
        : 'NO-GO';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Mobilize & Go-Decision Packet',
    moveLabel: packet.moveLabel,
    tenantLabel: packet.tenantLabel,
    tenantKey: packet.tenantKey,
    generatedOn: packet.generatedOn,
    verdict: {
      label: verdictWord,
      sub: 'Two Mobilize kill triggers fired',
    },
    documentTitle: `${packet.moveLabel} — Mobilize & Go-Decision Packet — ${packet.tenantLabel}`,
  };

  const renderers: Array<(p: MobilizePacket) => string> = [
    renderGoDecision,
    renderMobilizationPlan,
    renderOwnersDecisionRights,
    renderAdoptionChange,
    renderControlsReadiness,
    renderTowerHandoff,
    renderOpenActions,
    renderSignoff,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Mobilize & Go-Decision Packet',
      render: () => renderCover(packet),
    },
    ...packet.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](packet),
    })),
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${mobilizeStyles()}</style>`);
}
