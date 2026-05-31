// Generic Move Master Move Dossier — self-contained HTML renderer.
//
// The generic sibling of `master-dossier-renderer.ts` (the Apex reference
// dossier renderer). It renders the assembled-book deck for a REAL, originated
// Move from `buildMoveMasterDossier(move, moveId)` — the kernel-derived
// view-model.
//
// It REUSES the shared `deck-shell` chrome and the shared `svg-charts`
// exhibits — it does not rebuild rendering. The deck is a cover plus the seven
// generic sections (executive answer, decision timeline, economics, roadmap &
// Tower handoff, evidence & gaps, the assembled book, recommendation), driven
// entirely by the kernel skeleton and the Function-Pack binding.
//
// THE ASSEMBLED-BOOK PIVOT: §6 lists and LINKS every sibling generic
// board-grade deck for this Move — each `htmlHref` carrying `?moveId=<id>` so
// the reader opens that Move's kernel-derived chapter.
//
// HONESTY: when the Move binds no curated pack, `renderMoveMasterDossierHtml`
// renders an honest UNBOUND deck — a single slide that states no curated
// Function Pack covers the function. It NEVER renders a fabricated dossier for
// an unbound Move.
//
// The Apex renderer (`renderApexMasterDossierHtml`) is left untouched — this
// file is added alongside it.

import {
  buildMoveMasterDossier,
  type MoveMasterDossier,
  type MoveMasterDossierResult,
  type MoveDossierSectionAnatomy,
  type MoveDossierEvidenceStrip,
} from './move-master-dossier-model';
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
  evidenceGapMatrix,
  investmentWaterfall,
  scenarioRangeChart,
  sensitivityTornado,
  compactUsd,
} from './svg-charts';
import { renderVerdictExplainerChip } from './verdict-explainer';

// The bound deck has a fixed slide count — the cover plus the 7 sections.
const SLIDE_COUNT = 8;

// ---------------------------------------------------------------------------
// Shared slide scaffold — reuses the deck-shell `slideShell`.
// ---------------------------------------------------------------------------

function confidenceLabel(c: MoveDossierEvidenceStrip['confidence']): string {
  const map: Record<MoveDossierEvidenceStrip['confidence'], string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    blocked: 'Blocked',
  };
  return map[c];
}

function footerFacts(a: MoveDossierSectionAnatomy): FooterFact[] {
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
  a: MoveDossierSectionAnatomy,
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

function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

function renderDossierAiOpsPanel(
  s: MoveMasterDossier['sections']['roadmapTower'],
): string {
  const maxAxis = Math.max(s.aiBuildCost, s.businessChangeCost, s.aiOpsCost, 1);
  const axis = (label: string, value: number, cls: string): string =>
    `<div class="axis-row">` +
    `<span class="axis-label">${esc(label)}</span>` +
    `<span class="axis-track">` +
    `<span class="axis-fill ${cls}" style="width:${Math.max(
      2,
      (value / maxAxis) * 100,
    ).toFixed(1)}%"></span>` +
    `</span>` +
    `<span class="axis-value">${compact(value)}</span>` +
    `</div>`;

  if (!s.aiOps) {
    return heroExhibitHtml(
      'Exhibit 4b — Three-axis cost view: AI ops not yet modeled',
      `<div class="axis-stack">` +
        axis('Build cost', s.aiBuildCost, 'axis-build') +
        axis('Change cost', s.businessChangeCost, 'axis-change') +
        axis('AI Ops cost', 0, 'axis-ops') +
        `</div>` +
        `<p class="mini-para">AI Ops cost is not supplied on this Move yet. ` +
        `The dossier keeps that run-cost gap visible instead of implying ` +
        `the operating cost is zero.</p>`,
    );
  }

  const unitEconomic =
    s.aiOps.costPerDecisionUsd !== null && s.aiOps.decisionUnit
      ? `$${s.aiOps.costPerDecisionUsd.toFixed(4)} per ${s.aiOps.decisionUnit}`
      : `$${s.aiOps.costPerCallUsd.toFixed(4)} per call`;
  const warnings = [
    s.aiOps.pricingTierShockWarning
      ? `<div class="aiops-warning aiops-warning-amber">` +
        `<strong>Pricing-tier alert</strong><span>${esc(
          s.aiOps.pricingTierShockWarning,
        )}</span></div>`
      : '',
    s.aiOps.modelTierDriftWarning
      ? `<div class="aiops-warning aiops-warning-red">` +
        `<strong>Model-tier drift</strong><span>${esc(
          s.aiOps.modelTierDriftWarning,
        )}</span></div>`
      : '',
  ].join('');

  return heroExhibitHtml(
    'Exhibit 4b — Three-axis cost view: Build, Change, and AI Ops',
    `<div class="axis-stack">` +
      axis('Build cost', s.aiBuildCost, 'axis-build') +
      axis('Change cost', s.businessChangeCost, 'axis-change') +
      axis('AI Ops cost', s.aiOpsCost, 'axis-ops') +
      `</div>` +
      `<div class="aiops-metrics">` +
      `<div><span>3-year AI Ops</span><strong>${compact(
        s.aiOps.threeYearTotal,
      )}</strong></div>` +
      `<div><span>5-year AI Ops</span><strong>${compact(
        s.aiOps.fiveYearTotal,
      )}</strong></div>` +
      `<div><span>Unit economic</span><strong>${esc(
        unitEconomic,
      )}</strong></div>` +
      `</div>` +
      warnings,
  );
}

// ===========================================================================
// Slide 1 — Executive answer.
// ===========================================================================

function renderExecutiveAnswer(dossier: MoveMasterDossier): string {
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
      `style="margin-left:${lp.toFixed(1)}%;width:${Math.max(2, wp).toFixed(
        1,
      )}%"></span>` +
      `</span>` +
      `<span class="ivr-val">${compact(low)}–${compact(high)}</span>` +
      `</div>`
    );
  };

  const blockerExhibit =
    s.blockers.length > 0
      ? heroExhibitHtml(
          `Exhibit 1c — Blocker strip: ${s.blockers.length} open ${
            s.blockers.length === 1 ? 'blocker' : 'blockers'
          } between this Move and funding`,
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
            `</div>`,
        )
      : '';

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
    `<div class="board-card-tag">Move verdict</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(dossier.verdictExplainerChip) +
    `</div>` +
    heroExhibit(
      'Exhibit 1 — The decision at a glance, from the kernel',
      economicsStrip(s.tiles),
    ) +
    heroExhibitHtml(
      'Exhibit 1b — Investment against return: the case the board is funding',
      `<div class="ivr">` +
        bar('Investment', ivr.investmentLow, ivr.investmentHigh, 'invest') +
        bar('Net value', ivr.valueLow, ivr.valueHigh, 'value') +
        `</div>` +
        `<p class="ivr-note">Net value is post the mandatory six-factor ` +
        `haircut. The bars are planning ranges, never single points${
          dossier.monetisationBlocked
            ? ' — and no payback is drawn, because the unit economics are a ' +
              'declared seed gap.'
            : '.'
        }</p>`,
    ) +
    blockerExhibit +
    `<div class="ask-line">` +
    `<span class="ask-line-tag">Immediate ask</span>` +
    `<span>${esc(s.nextAsk)}</span>` +
    `</div>` +
    notes;
  return slide(s.anatomy, dossier.moveLabel, 2, hero);
}

// ===========================================================================
// Slide 2 — Decision timeline.
// ===========================================================================

function renderDecisionTimeline(dossier: MoveMasterDossier): string {
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
          `</div>` +
          `<div class="tl-verdict">${esc(p.state)} · ` +
          `<strong>${esc(p.verdict)}</strong></div>` +
          `<div class="tl-revision">${esc(p.revision)}</div>` +
          `</div></div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      'The assembled case is sequenced through the curated phase outline — ' +
        'Discover frames the problem, Charter sets the value hypothesis, ' +
        'Design & Plan costs the build, Mobilize designs the handoff. The ' +
        'same evidence asks are named consistently the whole way through.',
    ) +
    heroExhibitHtml(
      'Exhibit 2 — Decision timeline: how the case is sequenced',
      timeline,
    );
  return slide(s.anatomy, dossier.moveLabel, 3, hero);
}

// ===========================================================================
// Slide 3 — Economics.
// ===========================================================================

function renderEconomics(dossier: MoveMasterDossier): string {
  const s = dossier.sections.economics;

  const hero =
    lede(
      dossier.monetisationBlocked
        ? `The build is a ${compactUsd(s.investmentPoint)} base planning ` +
          `estimate (range ${compactUsd(s.investmentLow)}–${compactUsd(
            s.investmentHigh,
          )}). The net value is a planning proxy — the kernel honestly draws ` +
          'no payback line, because the unit economics are a seed gap.'
        : `The build is a ${compactUsd(s.investmentPoint)} base planning ` +
          `estimate against a ${compactUsd(s.netValuePoint)} net 3-year ` +
          'value. The case is shown as a range, never a single point.',
    ) +
    (s.waterfall.length > 0
      ? heroExhibit(
          `Exhibit 3 — Investment waterfall: where the ${compactUsd(
            s.investmentPoint,
          )} base goes`,
          investmentWaterfall(s.waterfall),
        )
      : '') +
    heroExhibit(
      'Exhibit 3b — Net return, three scenarios — never a single point',
      scenarioRangeChart(s.scenarios),
    ) +
    `<div class="payback-line">` +
    `<span class="payback-line-tag">Payback</span>` +
    `<span>${esc(s.paybackText)}</span>` +
    `</div>` +
    (s.tornado.length > 0
      ? detail(
          'Sensitivity tornado and what breaks the case',
          heroExhibit(
            'The case-moving assumptions, widest first',
            sensitivityTornado(s.tornado),
            'Hatched bars are seed-gap proxies — they stand in for absent ' +
              'tenant data and are the evidence asks that gate funding.',
          ) +
            `<div class="mini-key mini-key-block mini-key-gap">` +
            `What breaks the case</div>` +
            `<p class="mini-para">${esc(s.whatBreaksTheCase)}</p>`,
        )
      : detail(
          'What breaks the case',
          `<div class="mini-key mini-key-block mini-key-gap">` +
            `What breaks the case</div>` +
            `<p class="mini-para">${esc(s.whatBreaksTheCase)}</p>`,
        ));
  return slide(s.anatomy, dossier.moveLabel, 4, hero);
}

// ===========================================================================
// Slide 4 — Roadmap and Tower handoff.
// ===========================================================================

function renderRoadmapTower(dossier: MoveMasterDossier): string {
  const s = dossier.sections.roadmapTower;

  const wsRows = s.workstreams
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

  const towerRows = s.towerHandoff
    .map(
      (t) =>
        `<tr${t.isSeedGap ? ' class="row-proxy"' : ''}>` +
        `<td>${esc(t.metric)}${
          t.isSeedGap
            ? ' <span class="chip chip-bad">Seed gap</span>'
            : ' <span class="chip chip-good">Wired</span>'
        }</td>` +
        `<td class="num">${esc(t.baseline)}</td>` +
        `<td>${esc(t.readinessNote)}</td>` +
        `</tr>`,
    )
    .join('');

  const hero =
    lede(
      `The execution path is decomposed into ${s.workstreams.length} costed ` +
        `workstreams, and ${s.wiredCount} of ${
          s.wiredCount + s.unwiredCount
        } committed value metrics are wired to a recorded baseline. The ` +
        `remaining ${s.unwiredCount} ${
          s.unwiredCount === 1 ? 'is an' : 'are'
        } honest seed gap${s.unwiredCount === 1 ? '' : 's'}, carried with a ` +
        'capture plan, not dropped.',
    ) +
    heroExhibitHtml(
      'Exhibit 4 — Costed workstreams: where the build is decomposed',
      `<table class="data-table">` +
        `<thead><tr><th>Workstream</th><th class="num">Base cost</th>` +
        `<th class="num">Headcount</th><th class="num">Duration</th>` +
        `<th class="num">AI-agent split</th></tr></thead>` +
        `<tbody>${wsRows}</tbody></table>`,
      s.buildVsChangeNote,
    ) +
    renderDossierAiOpsPanel(s) +
    detail(
      'Tower measurement handoff — every metric tied to a baseline or a gap',
      `<table class="data-table">` +
        `<thead><tr><th>Metric</th><th class="num">Baseline</th>` +
        `<th>Readiness</th></tr></thead>` +
        `<tbody>${towerRows}</tbody></table>`,
    );
  return slide(s.anatomy, dossier.moveLabel, 5, hero);
}

// ===========================================================================
// Slide 5 — Evidence and gaps.
// ===========================================================================

function renderEvidenceAndGaps(dossier: MoveMasterDossier): string {
  const s = dossier.sections.evidenceAndGaps;

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
        'inherited from the Function Pack. The assembled case is auditable ' +
        'end to end; none of these numbers is invented.',
    ) +
    (s.matrix.length > 0
      ? heroExhibit(
          'Exhibit 5 — Evidence and gap matrix: recorded facts against seed gaps',
          evidenceGapMatrix(s.matrix),
          'The left column is sourced fact; the right column is declared seed ' +
            'gaps — stated, owned and named with their source, not hidden.',
        )
      : '') +
    (s.recorded.length > 0
      ? detail(
          'Recorded-metric source ledger',
          `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th class="num">Value</th>` +
            `<th>Source</th><th class="num">As of</th>` +
            `<th class="num">Confidence</th></tr></thead>` +
            `<tbody>${recordedRows}</tbody></table>`,
        )
      : '') +
    (s.seedGaps.length > 0
      ? detail(
          'Seed-gap register — the precise gaps inherited from the pack',
          `<table class="data-table">` +
            `<thead><tr><th>Metric</th><th>Why it is a gap</th>` +
            `<th>Expected data source</th></tr></thead>` +
            `<tbody>${gapRows}</tbody></table>`,
        )
      : '');
  return slide(s.anatomy, dossier.moveLabel, 6, hero);
}

// ===========================================================================
// Slide 6 — The assembled book.
//
// The assembled-book pivot — the artifact grid lists and LINKS every sibling
// generic board-grade deck for this Move, each link carrying `?moveId=`.
// ===========================================================================

function renderAssembledBook(dossier: MoveMasterDossier): string {
  const s = dossier.sections.assembledBook;

  const artifactGrid =
    `<div class="artifact-grid">` +
    s.artifacts
      .map(
        (a) =>
          `<div class="artifact-card">` +
          `<div class="artifact-head">` +
          `<span class="artifact-label">${esc(a.label)}</span>` +
          `</div>` +
          `<div class="artifact-phase">${esc(a.phase)}</div>` +
          `<div class="artifact-blurb">${esc(a.blurb)}</div>` +
          `<div class="artifact-links">` +
          `<a class="artifact-link" href="${esc(a.htmlHref)}">View deck →</a>` +
          `</div>` +
          `</div>`,
      )
      .join('') +
    `</div>`;

  const hero =
    lede(
      `This dossier is the assembled book — and ${s.artifacts.length} other ` +
        'kernel-derived board-grade decks are its chapters. Every one is ' +
        'linked below with a working View link that carries this Move’s id, ' +
        'so it renders this Move’s kernel-derived chapter — never the Apex ' +
        'reference.',
    ) +
    heroExhibitHtml(
      `Exhibit 6 — The assembled book: the ${s.artifacts.length} sibling ` +
        'board-grade decks for this Move',
      artifactGrid,
      'Each card links straight to that chapter’s deck for this Move.',
    );
  return slide(s.anatomy, dossier.moveLabel, 7, hero);
}

// ===========================================================================
// Slide 7 — Recommendation.
// ===========================================================================

function renderRecommendation(dossier: MoveMasterDossier): string {
  const s = dossier.sections.recommendation;
  const verdictClass =
    dossier.verdict === 'fund'
      ? 'verdict-fund'
      : dossier.verdict === 'kill'
        ? 'verdict-kill'
        : 'verdict-shape';

  const hero =
    `<div class="board-card ${verdictClass}">` +
    `<div class="board-card-tag">Recommendation</div>` +
    `<div class="board-verdict">${esc(s.verdictHeadline)}</div>` +
    `<p class="board-detail">${esc(s.verdictDetail)}</p>` +
    renderVerdictExplainerChip(dossier.verdictExplainerChip) +
    `</div>` +
    heroExhibitHtml(
      'Exhibit 7 — The conditions that gate a funding decision',
      `<ul class="mini-list">${s.conditions
        .map((c) => `<li>${esc(c)}</li>`)
        .join('')}</ul>`,
    ) +
    (s.killTriggers.length > 0
      ? detail(
          'Kill triggers — when to stop or re-shape the Move',
          `<ul class="mini-list">${s.killTriggers
            .map((k) => `<li>${esc(k)}</li>`)
            .join('')}</ul>`,
        )
      : '');
  return slide(s.anatomy, dossier.moveLabel, 8, hero);
}

// ===========================================================================
// Cover — slide 1.
// ===========================================================================

function renderCover(dossier: MoveMasterDossier): string {
  const verdictWord = dossier.verdict.toUpperCase();
  return coverSlide({
    brand: 'AbarVa · Moves',
    eyebrow: 'Master Move Dossier · Kernel-derived for a real Move',
    title: dossier.moveLabel,
    tenantLine: `${dossier.tenantLabel} · ${dossier.functionLabel}`,
    lede:
      'The assembled book in eight slides — the whole Move pulled into one ' +
      'CEO / CFO / CIO read, with every other board-grade artifact deck ' +
      'linked. Every figure is produced by the Moves Expert Kernel for this ' +
      'Move; value is a planning range, unrecorded metrics are named seed ' +
      'gaps, and the verdict is the kernel’s real recommendation, never ' +
      'invented.',
    meta: [
      { label: 'Move verdict', value: verdictWord },
      {
        label: 'Payback',
        value: dossier.monetisationBlocked ? 'Blocked — seed gap' : 'See deck',
      },
      { label: 'Slides', value: String(SLIDE_COUNT) },
      { label: 'Generated', value: dossier.generatedOn },
    ],
    hint: 'Use the menu, the arrows, or ← → keys to move through the deck.',
  });
}

// ===========================================================================
// The honest UNBOUND deck — a single slide stating no curated pack covers
// the Move's function. NEVER a fabricated dossier.
// ===========================================================================

function renderUnboundDocument(
  moveLabel: string,
  generatedOn: string,
  unboundReason: string,
): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Master Move Dossier',
    moveLabel,
    tenantLabel: 'Unbound Move',
    tenantKey: 'unbound',
    generatedOn,
    verdict: { label: 'UNBOUND', sub: 'No curated Function Pack' },
    documentTitle: `${moveLabel} — Master Move Dossier — unbound`,
  };

  const coverSlideHtml = (): string =>
    coverSlide({
      brand: 'AbarVa · Moves',
      eyebrow: 'Master Move Dossier · Honest unbound state',
      title: moveLabel,
      tenantLine: 'No curated Domain Function Pack covers this Move',
      lede:
        'The Moves Expert Kernel **cannot run with curated depth** for this ' +
        'Move — no curated Domain Function Pack covers its function. This is ' +
        'a known curated-depth gap, surfaced honestly. No dossier is ' +
        'fabricated, and no sibling artifact decks are assembled.',
      meta: [
        { label: 'Verdict', value: 'UNBOUND' },
        { label: 'Kernel', value: 'Not run' },
        { label: 'Generated', value: generatedOn },
      ],
      hint: 'This Move resolves to no board-grade Master Move Dossier.',
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
        'kernel cannot produce a board-grade Master Move Dossier.',
      hero:
        lede(
          'AbarVa’s board-grade Master Move Dossier is the assembled book — ' +
            'it pulls together every other kernel-derived artifact deck for ' +
            'the Move. Each of those decks is grounded in a curated Domain ' +
            'Function Pack. Without one, the kernel will not fabricate a ' +
            'dossier or assemble fake chapters.',
        ) +
        heroExhibitHtml(
          'Why this Move has no board-grade Master Move Dossier',
          `<div class="ask-line">` +
            `<span class="ask-line-tag">Honest fallback</span>` +
            `<span>${esc(unboundReason)}</span>` +
            `</div>`,
        ) +
        `<p class="hero-note">To produce a board-grade Master Move Dossier ` +
        `for this Move, it must resolve to a curated Function Pack — a known ` +
        `industry and a classified function. This is surfaced as a gap, not ` +
        `papered over with a fabricated deck.</p>`,
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
      navPreview: 'Why this Move has no board-grade Master Move Dossier',
      render: () => noteSlide(),
    },
  ];

  const doc = renderDeckDocument(meta, slides);
  return doc.replace('</style>', `${dossierStyles()}</style>`);
}

// ===========================================================================
// Master-Dossier-specific styles — appended after the shared deck CSS. These
// reuse the locked design tokens; they add no new palette colour. They mirror
// the Apex dossier renderer's `dossierStyles` so the generic deck reads the
// same — the investment-vs-return bars, the blocker strip, the timeline and
// the artifact-health grid.
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
/* --- Three-axis AI operating-cost view. --- */
.axis-stack { display: grid; gap: 8px; margin-bottom: 12px; }
.axis-row {
  display: grid; grid-template-columns: 120px minmax(120px,1fr) 82px;
  gap: 10px; align-items: center;
}
.axis-label { font-size: 10.5px; font-weight: 800; color: #2c2a26; }
.axis-track {
  height: 12px; border-radius: 4px; background: #ece7da; overflow: hidden;
}
.axis-fill { display: block; height: 100%; border-radius: 4px; }
.axis-build { background: #0b4a91; }
.axis-change { background: #a8533a; }
.axis-ops { background: #7A4F01; }
.axis-value {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10.5px; font-weight: 800; color: #1c1a17; text-align: right;
}
.aiops-metrics {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 8px;
  margin: 10px 0;
}
.aiops-metrics div {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 9px 10px;
  background: #fff;
}
.aiops-metrics span {
  display: block; font-size: 9px; font-weight: 800; color: #8b8678;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
}
.aiops-metrics strong { display: block; font-size: 13px; color: #1c1a17; }
.aiops-warning {
  display: grid; gap: 4px; border-radius: 5px; padding: 9px 10px;
  margin: 8px 0; font-size: 10.5px; line-height: 1.45;
}
.aiops-warning strong {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
}
.aiops-warning-amber {
  background: #fdf6e8; border: 1px solid #e6c884; color: #5f3b00;
}
.aiops-warning-red {
  background: #fff1ee; border: 1px solid #e0a091; color: #6c160a;
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
.artifact-phase {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #8b8678; margin-top: 4px;
}
.artifact-blurb {
  font-size: 10.5px; color: #5b5852; line-height: 1.5; margin-top: 7px;
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
.mini-para {
  margin: 5px 0 0; font-size: 11.5px; color: #2c2a26; line-height: 1.55;
}
@media (max-width: 880px) {
  .artifact-grid { grid-template-columns: 1fr; }
  .ivr-row { grid-template-columns: 1fr; }
  .aiops-metrics { grid-template-columns: 1fr; }
  .axis-row { grid-template-columns: 1fr; }
  .axis-value { text-align: left; }
}
`;
}

// ===========================================================================
// Public entry — render the generic Move Master Move Dossier.
// ===========================================================================

/**
 * Render the generic Move Master Move Dossier as one self-contained HTML
 * document. Projects the deck from `buildMoveMasterDossier`.
 *
 * When the Move binds a curated pack, renders the full bound assembled-book
 * deck. When the Move is unbound, renders the honest unbound document — never
 * a fabricated deck. Deterministic — a pure function of the Move + `moveId` +
 * `generatedOn`.
 */
export function renderMoveMasterDossierHtml(
  move: MoveBusinessCaseInput,
  moveIdOrGeneratedOn: string,
  generatedOn?: string,
): string {
  // Signature harmonisation (P2-2): callers should prefer the 2-arg form
  // `renderMoveMasterDossierHtml(move, generatedOn)` and put the moveId on
  // the Move (`move.id`). The legacy 3-arg form still works for back-compat.
  const result: MoveMasterDossierResult =
    typeof generatedOn === 'string'
      ? buildMoveMasterDossier(move, moveIdOrGeneratedOn, generatedOn)
      : buildMoveMasterDossier(move, moveIdOrGeneratedOn);

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
function renderBoundDocument(dossier: MoveMasterDossier): string {
  const meta: DeckMeta = {
    brand: 'AbarVa · Moves',
    artifactLabel: 'Master Move Dossier',
    moveLabel: dossier.moveLabel,
    tenantLabel: dossier.tenantLabel,
    tenantKey: dossier.tenantKey,
    generatedOn: dossier.generatedOn,
    verdict: {
      label: dossier.verdict.toUpperCase(),
      sub: dossier.monetisationBlocked
        ? 'Payback blocked — seed gap'
        : 'Kernel recommendation',
    },
    documentTitle: `${dossier.moveLabel} — Master Move Dossier — ${dossier.tenantLabel}`,
  };

  const renderers: Array<(d: MoveMasterDossier) => string> = [
    renderExecutiveAnswer,
    renderDecisionTimeline,
    renderEconomics,
    renderRoadmapTower,
    renderEvidenceAndGaps,
    renderAssembledBook,
    renderRecommendation,
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
