// Board-grade Master Move Dossier — self-contained HTML renderer.
//
// Produces ONE self-contained HTML string laid out as a PRESENTATION DECK —
// the same left-menu / right-stage chrome as the other board-grade artifact
// decks, composed by the shared `deck-shell` module. The reader flips slides;
// for print an `@media print` block expands the deck into the full document.
//
// The deck is a cover plus the nine blueprint §4 Master Move Dossier sections:
//   1. Executive answer       — fund / shape / kill, in one sentence.
//   2. Board memo             — the case in 90 seconds.
//   3. Decision timeline      — how the case evolved Discover → Mobilize.
//   4. Evidence and gaps      — recorded metrics, seed gaps, source quality.
//   5. Solution & delivery    — architecture, build/buy/partner, control.
//   6. Economics              — investment, value, sensitivity, what breaks it.
//   7. Roadmap & mobilization — 30/60/90, workstreams, RACI, open actions.
//   8. Tower measurement      — baseline, target, cadence, forecast handoff.
//   9. Downloads and signoff  — every sibling artifact, scores, reviewer verdicts.
//
// The dossier is the "assembled book" (blueprint §3 / §4): §9 lists and links
// EVERY other board-grade artifact deck for this Move, with working View links
// (and the Download-PowerPoint link for the Costed pack). That list is sourced
// from the board-artifacts registry via the view-model, so it stays in sync.
//
// Each slide follows the §2 consulting-exhibit anatomy: a takeaway title that
// takes a position, ONE dominant exhibit, minimal prose, and a quiet footer.
// All CSS is inlined, every exhibit is an inline SVG or HTML diagram, the
// slide-switch script is inline — the file opens offline. The renderer is
// PURE: a deterministic function of the kernel view-model. It changes no
// kernel logic; the honest verdict (`shape`), the blocked payback and the
// `no_go` go-decision are rendered exactly as the kernel returns them — never
// upgraded, never fabricated.

import {
  buildApexMasterMoveDossier,
  type MasterMoveDossier,
  type DossierSectionAnatomy,
  type DossierEvidenceStrip,
} from './master-dossier-model';
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
  evidenceGapMatrix,
  investmentWaterfall,
  mobilizeSwimlane,
  scenarioRangeChart,
  sensitivityTornado,
  valueBridge,
} from './svg-charts';
import { contextDiagram, boundaryLaneMap } from './svg-architecture';

// The deck has a fixed slide count — the cover plus the nine §4 sections.
const SLIDE_COUNT = 10;

// ---------------------------------------------------------------------------
// Slide scaffold — the §2 exhibit anatomy via the shared `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: DossierEvidenceStrip['confidence']): string {
  const map: Record<DossierEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

/** The quiet-footer facts — so-what / decision role / owner / evidence / gate. */
function footerFacts(a: DossierSectionAnatomy): FooterFact[] {
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
  a: DossierSectionAnatomy,
  dossier: MasterMoveDossier,
  slideNo: number,
  hero: string,
): string {
  return slideShell({
    id: a.id,
    slideNo,
    slideCount: SLIDE_COUNT,
    headerBrand: dossier.moveLabel,
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
// Slide 1 — Executive answer.
// ===========================================================================

function renderExecutiveAnswer(dossier: MasterMoveDossier): string {
  const s = dossier.sections.executiveAnswer;
  const verdictClass =
    dossier.verdict === 'fund'
      ? 'verdict-fund'
      : dossier.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const ivr = s.investmentVsReturn;
  const ivrMax = Math.max(ivr.investmentHigh, ivr.valueHigh, 1);
  const bar = (
    label: string,
    low: number,
    high: number,
    tone: string,
  ): string => {
    const lp = (low / ivrMax) * 100;
    const wp = ((high - low) / ivrMax) * 100;
    return (
      `<div class="ivr-row">` +
      `<span class="ivr-label">${esc(label)}</span>` +
      `<span class="ivr-track">` +
      `<span class="ivr-fill ivr-${tone}" ` +
      `style="margin-left:${lp.toFixed(1)}%;width:${Math.max(2, wp).toFixed(1)}%"></span>` +
      `</span>` +
      `<span class="ivr-val">${compact(low)}–${compact(high)}</span>` +
      `</div>`
    );
  };

  const blockerStrip =
    `<div class="blocker-strip">` +
    s.blockers
      .map(
        (b) =>
          `<div class="blocker-item">` +
          `<span class="blocker-tag">${esc(b.label)}</span>` +
          `<span class="blocker-detail">${esc(b.detail)}</span>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Move verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — The decision at a glance',
      economicsStrip(s.tiles),
    ) +
    heroExhibitHtml(
      'Exhibit 1b — Investment against return: the case the board is funding',
      `<div class="ivr">` +
        bar(
          'Investment',
          ivr.investmentLow,
          ivr.investmentHigh,
          'invest',
        ) +
        bar('Net value', ivr.valueLow, ivr.valueHigh, 'value') +
        `</div>` +
        `<p class="ivr-note">Net value is post six-factor haircut. The ` +
        `bars are ranges, never single points — and no payback is drawn, ` +
        `because the cost-per-contact baseline is a declared seed gap.</p>`,
    ) +
    heroExhibitHtml(
      `Exhibit 1c — Blocker strip: ${s.blockers.length} open ${
        s.blockers.length === 1 ? 'blocker' : 'blockers'
      } between this Move and funding`,
      blockerStrip,
    ) +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Immediate ask</span>` +
    `<span>${esc(s.nextAsk)}</span>` +
    `</div>`;
  return slide(s.anatomy, dossier, 2, hero);
}

// ===========================================================================
// Slide 2 — Board memo.
// ===========================================================================

function renderBoardMemo(dossier: MasterMoveDossier): string {
  const s = dossier.sections.boardMemo;

  const calloutTone = (t: 'neutral' | 'warn' | 'bad'): string =>
    t === 'bad' ? 'callout-bad' : t === 'warn' ? 'callout-warn' : 'callout-neutral';
  const callouts =
    `<div class="memo-callouts">` +
    s.callouts
      .map(
        (c) =>
          `<div class="memo-callout ${calloutTone(c.tone)}">` +
          `<div class="memo-callout-label">${esc(c.label)}</div>` +
          `<div class="memo-callout-value">${esc(c.value)}</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const memoBody =
    `<div class="memo">` +
    s.paragraphs
      .map(
        (p) =>
          `<div class="memo-para">` +
          `<div class="memo-heading">${esc(p.heading)}</div>` +
          `<p class="memo-text">${esc(p.body)}</p>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      'This is the case in 90 seconds — the whole Move in scannable prose ' +
        'with the numbers that matter called out. Sections 3 to 9 are the ' +
        'challenge detail behind it; a board member can act on this page ' +
        'alone.',
    ) +
    callouts +
    heroExhibitHtml('Exhibit 2 — The board memo', memoBody) +
    detail(
      'What not to fund yet — the explicit holdback',
      `<div class="mini-key mini-key-block mini-key-gap">` +
        `Do not fund yet</div>` +
        `<ul class="mini-list">` +
        s.doNotFundYet.map((d) => `<li>${esc(d)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, dossier, 3, hero);
}

// ===========================================================================
// Slide 3 — Decision timeline.
// ===========================================================================

function renderDecisionTimeline(dossier: MasterMoveDossier): string {
  const s = dossier.sections.decisionTimeline;

  const toneClass = (t: 'good' | 'warn' | 'bad' | 'neutral'): string =>
    t === 'good'
      ? 'tl-good'
      : t === 'bad'
        ? 'tl-bad'
        : t === 'warn'
          ? 'tl-warn'
          : 'tl-neutral';

  const timeline =
    `<div class="timeline">` +
    s.phases
      .map(
        (p) =>
          `<div class="tl-phase ${toneClass(p.tone)}">` +
          `<div class="tl-marker"></div>` +
          `<div class="tl-body">` +
          `<div class="tl-head">` +
          `<span class="tl-phase-name">${esc(p.phase)}</span>` +
          `<span class="tl-date">Reviewed ${esc(p.reviewDate)}</span>` +
          `</div>` +
          `<div class="tl-verdict">${esc(p.state)} · verdict ` +
          `<strong>${esc(p.verdict)}</strong></div>` +
          `<div class="tl-revision">${esc(p.revision)}</div>` +
          `</div></div>`,
      )
      .join('') +
    `</div>`;

  const changeRows = s.changedAssumptions
    .map(
      (c) =>
        `<tr>` +
        `<td><strong>${esc(c.assumption)}</strong></td>` +
        `<td>${esc(c.from)}</td>` +
        `<td>${esc(c.to)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'The case has not drifted — it has sharpened. Every phase narrowed ' +
        'the scope and hardened the same monetization gap rather than ' +
        'papering over it. The revision markers below show exactly what ' +
        'changed and when.',
    ) +
    heroExhibitHtml(
      'Exhibit 3 — Decision timeline: how the case evolved Discover → Mobilize',
      timeline,
    ) +
    detail(
      'Changed assumptions — what moved across the book',
      `<table class="data-table">` +
        `<thead><tr><th>Assumption</th><th>Earlier state</th>` +
        `<th>Current state</th></tr></thead>` +
        `<tbody>${changeRows}</tbody></table>`,
    );
  return slide(s.anatomy, dossier, 4, hero);
}

// ===========================================================================
// Slide 4 — Evidence and gaps.
// ===========================================================================

function renderEvidenceAndGaps(dossier: MasterMoveDossier): string {
  const s = dossier.sections.evidenceAndGaps;

  const recordedRows = s.recorded
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
        `<td colspan="2">${esc(g.reason)}</td>` +
        `<td>${esc(g.owner)}</td>` +
        `<td class="num">${esc(g.due)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `The case rests on ${s.recordedCount} recorded, sourced metrics and ` +
        `${s.seedGapCount} declared seed gaps. The matrix makes the ` +
        'recorded-versus-missing split visible at a glance — every gap is ' +
        'an explicit cell with an owner, never a silent blank.',
    ) +
    heroExhibit(
      'Exhibit 4 — Evidence and gap matrix: recorded facts against seed gaps',
      evidenceGapMatrix(s.matrix),
      'The left column is sourced fact; the right column is declared seed ' +
        'gaps — stated, owned and dated, not hidden.',
    ) +
    detail(
      'Recorded-metric source ledger',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Value</th>` +
        `<th>Source</th><th class="num">As of</th>` +
        `<th class="num">Confidence</th></tr></thead>` +
        `<tbody>${recordedRows}</tbody></table>`,
    ) +
    detail(
      'Seed-gap register — reason, evidence owner and due date',
      `<table class="data-table">` +
        `<thead><tr><th>Seed gap</th><th colspan="2">Why it is not recorded</th>` +
        `<th>Evidence owner</th><th class="num">Due</th></tr></thead>` +
        `<tbody>${gapRows}</tbody></table>`,
    );
  return slide(s.anatomy, dossier, 5, hero);
}

function confChip(c: 'high' | 'medium' | 'low'): string {
  const cls =
    c === 'high' ? 'chip-good' : c === 'low' ? 'chip-bad' : 'chip-warn';
  return `<span class="chip ${cls}">${c}</span>`;
}

// ===========================================================================
// Slide 5 — Solution and delivery model.
// ===========================================================================

function renderSolutionDelivery(dossier: MasterMoveDossier): string {
  const s = dossier.sections.solutionDelivery;

  const ctx = contextDiagram({
    enterprise: s.context.enterprise.map((n) => ({
      title: n.title,
      sub: n.sub,
      role: 'actor' as const,
    })),
    systems: s.context.systems.map((n) => ({
      title: n.title,
      sub: n.sub,
      role: 'system' as const,
      gap: n.gap,
    })),
    solution: s.context.solution.map((n) => ({
      title: n.title,
      sub: n.sub,
      role: 'context' as const,
    })),
  });

  const lanes = boundaryLaneMap(
    s.boundary.map((b) => ({
      lane: b.lane,
      disposition: b.disposition,
      owner: b.owner,
      rationale: b.rationale,
    })),
  );

  const hero =
    lede(
      `The selected architecture is ${esc(s.selectedArchitecture)}. ` +
        `${esc(s.architectureRationale)}`,
    ) +
    heroExhibit(
      'Exhibit 5 — Solution context: where the routing capability sits',
      ctx,
      'The systems-of-record band is explicit; the CDP / intent-data node ' +
        'is flagged as a gap, not assumed.',
    ) +
    heroExhibit(
      'Exhibit 5b — Build / buy / partner / retain: what is actually funded',
      lanes,
    ) +
    detail(
      'Human accountability and control posture',
      `<div class="mini-key mini-key-block">Where a human stays in the loop</div>` +
        `<ul class="mini-list">` +
        s.humanAccountability.map((h) => `<li>${esc(h)}</li>`).join('') +
        `</ul>` +
        `<div class="mini-key mini-key-block mini-key-gap">Control posture</div>` +
        `<p class="mini-para">${esc(s.controlPosture)}</p>`,
    );
  return slide(s.anatomy, dossier, 6, hero);
}

// ===========================================================================
// Slide 6 — Economics.
// ===========================================================================

function renderEconomics(dossier: MasterMoveDossier): string {
  const s = dossier.sections.economics;

  const haircutSteps = s.haircut.factors.map((f) => ({
    label: f.label,
    // The downward step is the share of value the factor discounts.
    amount: ((s.haircut.grossHigh - s.haircut.netHigh) / s.haircut.factors.length),
  }));

  const hero =
    lede(
      'The bet does not pay back under challenge — and the dossier is ' +
        'honest about why. The widest sensitivity driver is a seed-gap ' +
        'proxy, so no payback line is drawn; the CFO funds the ' +
        'conservative case, not an optimistic point.',
    ) +
    heroExhibit(
      'Exhibit 6 — Investment waterfall: where the money goes, by phase',
      investmentWaterfall(s.waterfall),
    ) +
    heroExhibit(
      'Exhibit 6b — Sensitivity tornado: the assumptions that move the case',
      sensitivityTornado(s.tornado),
      'A hatched bar is a seed-gap proxy — the largest driver of the case ' +
        'is not yet a recorded fact.',
    ) +
    heroExhibit(
      'Exhibit 6c — Net return, three scenarios — never a single point',
      scenarioRangeChart(s.scenarios),
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Payback</span>` +
    `<span>${esc(s.paybackText)}</span>` +
    `</div>` +
    detail(
      'Gross-to-net haircut and what breaks the case',
      heroExhibit(
        'Six-factor haircut — gross value discounted to net',
        valueBridge(s.haircut.grossHigh, haircutSteps, s.haircut.netHigh),
        `Retained fraction ${Math.round(s.haircut.retainedFraction * 100)}% ` +
          'of gross value — the anti-optimism mechanism, applied in full.',
      ) +
        `<div class="mini-key mini-key-block mini-key-gap">` +
        `What breaks the case</div>` +
        `<p class="mini-para">${esc(s.whatBreaksTheCase)}</p>`,
    );
  return slide(s.anatomy, dossier, 7, hero);
}

// ===========================================================================
// Slide 7 — Roadmap and mobilization.
// ===========================================================================

function renderRoadmapMobilization(dossier: MasterMoveDossier): string {
  const s = dossier.sections.roadmapMobilization;

  const phaseRows = s.phases
    .map(
      (p) =>
        `<tr${p.isFoundational ? ' class="row-proxy"' : ''}>` +
        `<td>${esc(p.label)}${
          p.isFoundational
            ? ' <span class="chip chip-warn">Foundational</span>'
            : ''
        }</td>` +
        `<td class="num">${p.durationMonths} mo</td>` +
        `<td class="num">${esc(p.cost)}</td>` +
        `<td>${esc(p.valueMilestone)}</td>` +
        `</tr>`,
    )
    .join('');

  const raciRows = s.raci
    .map(
      (d) =>
        `<tr>` +
        `<td>${esc(d.decision)}</td>` +
        `<td><strong>${esc(d.accountable)}</strong></td>` +
        `<td>${esc(d.responsible)}</td>` +
        `<td class="num">${
          d.agentAutonomy
            ? `<span class="chip chip-warn">${esc(d.agentAutonomy)}</span>`
            : '—'
        }</td>` +
        `</tr>`,
    )
    .join('');

  const actionRows = s.openActions
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
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      'The execution path is sequenced, owned and gated. The first 90 days ' +
        'stand up the operating spine and wire the Tower loop; the pilot is ' +
        'deliberately the last thing to start. Every decision has one ' +
        'accountable owner; every gate-blocking action is named.',
    ) +
    heroExhibit(
      'Exhibit 7 — 30/60/90 mobilization: stand up the spine, then the pilot',
      mobilizeSwimlane(s.bands),
    ) +
    detail(
      'Costed roadmap — four phases, foundational Phase 0',
      `<table class="data-table">` +
        `<thead><tr><th>Phase</th><th class="num">Duration</th>` +
        `<th class="num">Cost</th><th>Value milestone</th></tr></thead>` +
        `<tbody>${phaseRows}</tbody></table>`,
    ) +
    detail(
      'RACI — a single accountable owner per decision; bounded agent autonomy',
      `<table class="data-table">` +
        `<thead><tr><th>Decision</th><th>Accountable</th>` +
        `<th>Responsible</th><th class="num">Agent autonomy</th></tr></thead>` +
        `<tbody>${raciRows}</tbody></table>`,
    ) +
    detail(
      'Open-action queue — what blocks go-live, with owners and dates',
      `<table class="data-table">` +
        `<thead><tr><th>Open action</th><th>Owner</th>` +
        `<th class="num">Due</th></tr></thead>` +
        `<tbody>${actionRows}</tbody></table>`,
    );
  return slide(s.anatomy, dossier, 8, hero);
}

// ===========================================================================
// Slide 8 — Tower measurement.
// ===========================================================================

function renderTowerMeasurement(dossier: MasterMoveDossier): string {
  const s = dossier.sections.towerMeasurement;

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
        'carried with a dated capture plan, not dropped.',
    ) +
    heroExhibitHtml(
      'Exhibit 8 — Measurement handoff: every metric tied to the Discover baseline',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
        `<th class="num">Target</th><th>Cadence</th><th>Owner</th>` +
        `</tr></thead>` +
        `<tbody>${rows}</tbody></table>`,
      `The forecast-to-actual handoff opens once the value loop closes. It ` +
        `${
          s.loopCloses
            ? 'closes now — every metric is wired.'
            : 'does not yet close — cost-per-contact is unwired, so financial ' +
              'value stays unverifiable until the baseline lands.'
        }`,
    );
  return slide(s.anatomy, dossier, 9, hero);
}

// ===========================================================================
// Slide 9 — Downloads and signoff.
//
// The "assembled book" pivot — the artifact-health grid lists and LINKS every
// sibling board-grade artifact deck for this Move, with working View links
// (and the Download-PowerPoint link for the Costed pack).
// ===========================================================================

function renderDownloadsSignoff(dossier: MasterMoveDossier): string {
  const s = dossier.sections.downloadsSignoff;

  const artifactGrid =
    `<div class="artifact-grid">` +
    s.artifacts
      .map(
        (a) =>
          `<div class="artifact-card">` +
          `<div class="artifact-head">` +
          `<span class="artifact-label">${esc(a.label)}</span>` +
          `<span class="artifact-score">${a.qualityScore}/10</span>` +
          `</div>` +
          `<div class="artifact-phase">${esc(a.phase)}</div>` +
          `<div class="artifact-blurb">${esc(a.blurb)}</div>` +
          `<div class="artifact-verdict">${esc(a.verdict)}</div>` +
          `<div class="artifact-links">` +
          `<a class="artifact-link" href="${esc(a.htmlHref)}">View deck →</a>` +
          (a.pptxHref
            ? `<a class="artifact-link artifact-link-alt" ` +
              `href="${esc(a.pptxHref)}">Download PowerPoint ↓</a>`
            : '') +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

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

  const signoff =
    `<div class="checklist">` +
    s.signoff
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
      `This dossier is the assembled book — and ${s.artifacts.length} ` +
        'other board-grade decks are its chapters. Every one is linked ' +
        'below with a working View link; signoff is a readiness record, ' +
        'not a final approval — two reviewers are blocked, which is ' +
        'precisely why the Move is not yet fundable.',
    ) +
    heroExhibitHtml(
      `Exhibit 9 — Artifact health grid: the ${s.artifacts.length} sibling ` +
        'board-grade decks for this Move',
      artifactGrid,
      'Each card links straight to the deck it scores. The Costed ' +
        'Business-Case Pack additionally offers an editable PowerPoint.',
    ) +
    heroExhibitHtml(
      'Exhibit 9b — Signoff matrix: what each reviewer has cleared',
      signoff,
    ) +
    detail(
      'Open actions still required before approval',
      `<ul class="mini-list">` +
        s.openActions.map((a) => `<li>${esc(a)}</li>`).join('') +
        `</ul>`,
    );
  return slide(s.anatomy, dossier, 10, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(dossier: MasterMoveDossier): string {
  const verdictWord =
    dossier.verdict === 'fund'
      ? 'FUND'
      : dossier.verdict === 'kill'
        ? 'KILL'
        : 'SHAPE';
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Master Move Dossier · Board-grade artifact',
    title: dossier.moveLabel,
    tenantLine: `${dossier.tenantLabel} · ${dossier.tenantKey}`,
    lede:
      'The assembled book in 10 slides — the whole Move pulled into one ' +
      'CEO / CFO / CIO / board-advisor read. Every figure is produced by ' +
      "the Moves Expert Kernel from Apex's audited substrate. The verdict " +
      'is the honest **shape**: the mechanism is real, but payback is ' +
      'blocked by a seed gap and the go-decision is no-go.',
    meta: [
      { label: 'Move verdict', value: verdictWord },
      { label: 'Payback', value: 'Blocked — seed gap' },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: dossier.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// Compact money helper — used in the investment-vs-return exhibit.
// ===========================================================================

function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

// ===========================================================================
// Master-Dossier-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour.
// ===========================================================================

function dossierStyles(): string {
  return `
/* --- Master dossier — investment-vs-return paired bars. --- */
.ivr { display: flex; flex-direction: column; gap: 14px; margin: 4px 0 2px; }
.ivr-row {
  display: grid; grid-template-columns: 92px 1fr 132px; gap: 12px;
  align-items: center;
}
.ivr-label {
  font-size: 10.5px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.05em; color: #5b5852;
}
.ivr-track {
  position: relative; height: 22px; background: #f3f0e9;
  border: 1px solid #e0dbcd; border-radius: 3px;
}
.ivr-fill {
  position: absolute; top: 0; height: 100%; border-radius: 2px;
  display: block;
}
.ivr-invest { background: #0b4a91; }
.ivr-value { background: #1B5E20; }
.ivr-val {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; color: #1c1a17; text-align: right;
}
.ivr-note {
  font-size: 11.5px; color: #5b5852; line-height: 1.5; margin: 12px 2px 0;
}
/* --- Blocker strip. --- */
.blocker-strip { display: flex; flex-direction: column; gap: 8px; }
.blocker-item {
  display: flex; gap: 12px; align-items: flex-start;
  border: 1px solid #e0dbcd; border-left: 3px solid #8B1F0F;
  border-radius: 5px; padding: 11px 14px; background: #fdf6e8;
}
.blocker-tag {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.04em; color: #8B1F0F; white-space: nowrap;
  padding-top: 2px; min-width: 168px;
}
.blocker-detail { font-size: 11.5px; color: #2c2a26; line-height: 1.5; }
/* --- Board-memo callouts + prose. --- */
.memo-callouts {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 10px;
  margin: 0 0 16px;
}
.memo-callout {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 12px 14px;
  background: #fff; border-top: 3px solid #5b5852;
}
.callout-warn { border-top-color: #7A4F01; }
.callout-bad { border-top-color: #8B1F0F; }
.callout-neutral { border-top-color: #0b4a91; }
.memo-callout-label {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.06em; color: #8b8678;
}
.memo-callout-value {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 13px; font-weight: 800; color: #1c1a17; margin-top: 6px;
}
.memo { display: flex; flex-direction: column; gap: 14px; }
.memo-para {
  border-left: 3px solid #0b4a91; padding-left: 14px;
}
.memo-heading {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.05em; color: #0b4a91;
}
.memo-text {
  margin: 5px 0 0; font-size: 12.5px; color: #2c2a26; line-height: 1.6;
}
/* --- Decision timeline. --- */
.timeline { display: flex; flex-direction: column; gap: 4px; }
.tl-phase {
  display: grid; grid-template-columns: 22px 1fr; gap: 12px;
  position: relative; padding-bottom: 14px;
}
.tl-phase:not(:last-child)::before {
  content: ""; position: absolute; left: 10px; top: 16px; bottom: -2px;
  width: 2px; background: #d8d3c6;
}
.tl-marker {
  width: 14px; height: 14px; border-radius: 999px; margin-top: 3px;
  border: 3px solid #fbfaf7; background: #5b5852; z-index: 1;
  box-shadow: 0 0 0 1px #d8d3c6;
}
.tl-good .tl-marker { background: #1B5E20; }
.tl-warn .tl-marker { background: #7A4F01; }
.tl-bad .tl-marker { background: #8B1F0F; }
.tl-body {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 11px 14px;
  background: #fff;
}
.tl-good .tl-body { border-left: 3px solid #1B5E20; }
.tl-warn .tl-body { border-left: 3px solid #7A4F01; }
.tl-bad .tl-body { border-left: 3px solid #8B1F0F; }
.tl-neutral .tl-body { border-left: 3px solid #0b4a91; }
.tl-head {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 10px;
}
.tl-phase-name {
  font-size: 13px; font-weight: 800; color: #1c1a17;
}
.tl-date {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9.5px; font-weight: 700; color: #8b8678;
}
.tl-verdict { font-size: 11px; color: #5b5852; margin-top: 3px; }
.tl-revision {
  font-size: 11px; color: #2c2a26; line-height: 1.5; margin-top: 5px;
}
/* --- Artifact-health grid (the assembled-book chapter list). --- */
.artifact-grid {
  display: grid; grid-template-columns: repeat(2,1fr); gap: 12px;
}
.artifact-card {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 15px;
  background: #fff; border-top: 3px solid #0b4a91;
  display: flex; flex-direction: column;
}
.artifact-head {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 8px;
}
.artifact-label {
  font-size: 12.5px; font-weight: 800; color: #1c1a17; line-height: 1.3;
}
.artifact-score {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; color: #1B5E20; white-space: nowrap;
}
.artifact-phase {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #8b8678; margin-top: 4px;
}
.artifact-blurb {
  font-size: 10.5px; color: #5b5852; line-height: 1.5; margin-top: 7px;
}
.artifact-verdict {
  font-size: 10.5px; color: #2c2a26; line-height: 1.45; margin-top: 7px;
  font-style: italic;
}
.artifact-links {
  display: flex; gap: 14px; flex-wrap: wrap; margin-top: 10px;
  padding-top: 9px; border-top: 1px solid #ece7da;
}
.artifact-link {
  font-size: 10.5px; font-weight: 800; color: #0b4a91;
  text-decoration: none; letter-spacing: 0.01em;
}
.artifact-link:hover { text-decoration: underline; }
.artifact-link-alt { color: #7A4F01; }
.readiness-note {
  font-size: 10.5px; color: #5b5852; background: #f7f5ef !important;
  line-height: 1.5; font-style: italic;
}
.row-proxy .readiness-note { color: #7A4F01; }
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
@media (max-width: 880px) {
  .memo-callouts, .artifact-grid { grid-template-columns: 1fr; }
  .ivr-row { grid-template-columns: 1fr; }
}
`;
}

// ===========================================================================
// The full document — the Master Move Dossier's ten slides handed to the deck
// shell. The shell owns the menu rail, the stage, the inline script and the
// print expansion; this renderer supplies the slides and the style tail.
// ===========================================================================

/**
 * Render the Apex Contact Center AI Routing Master Move Dossier as one
 * self-contained HTML document — a left-menu presentation deck. Deterministic
 * — a pure function of `generatedOn`.
 */
export function renderApexMasterDossierHtml(generatedOn: string): string {
  const dossier = buildApexMasterMoveDossier(generatedOn);
  const verdictWord =
    dossier.verdict === 'fund'
      ? 'FUND'
      : dossier.verdict === 'kill'
        ? 'KILL'
        : 'SHAPE';

  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Master Move Dossier',
    moveLabel: dossier.moveLabel,
    tenantLabel: dossier.tenantLabel,
    tenantKey: dossier.tenantKey,
    generatedOn: dossier.generatedOn,
    verdict: {
      label: verdictWord,
      sub: 'Payback blocked · go-decision no-go',
    },
    documentTitle: `${dossier.moveLabel} — Master Move Dossier — ${dossier.tenantLabel}`,
  };

  const renderers: Array<(d: MasterMoveDossier) => string> = [
    renderExecutiveAnswer,
    renderBoardMemo,
    renderDecisionTimeline,
    renderEvidenceAndGaps,
    renderSolutionDelivery,
    renderEconomics,
    renderRoadmapMobilization,
    renderTowerMeasurement,
    renderDownloadsSignoff,
  ];

  const slides: DeckSlide[] = [
    {
      id: 'cover',
      navLabel: 'Cover',
      navPreview: 'Master Move Dossier',
      render: () => renderCover(dossier),
    },
    ...dossier.toc.map((t, i) => ({
      id: t.id,
      navLabel: t.label,
      navPreview: t.takeaway,
      render: () => renderers[i](dossier),
    })),
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${dossierStyles()}</style>`);
}
