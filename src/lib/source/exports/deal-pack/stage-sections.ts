// Source · Deal Pack · stage section + chrome rendering.
//
// Pure module. Takes the aggregator's `DealPackInput` and emits the
// full HTML document — topbar, sticky TOC, Headline strip, eight
// stage sections, Evidence Ledger, Decision History, Glossary, footer.
//
// All anchors are <a href="#stage-N"> with smooth-scroll handled by
// `html { scroll-behavior: smooth; }` in styles.ts. The active-section
// highlight is provided by a tiny same-origin script using
// IntersectionObserver — it's the ONLY <script> in the document, it's
// inline (no `src`), and the document degrades gracefully without it.

import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '@/lib/source/canvas-substrate/types';
import type { SourceStageKey } from '@/lib/source/types';
import { buildSourceJudgmentFromDealPack } from '../../expert-judgment/source-judgment-kernel';
import {
  isHoldVerdict,
  sourceJudgmentVerdictLabel,
} from '../../expert-judgment/source-judgment-rules';
import type {
  SourceJudgment,
  SourceJudgmentBlocker,
} from '../../expert-judgment/source-judgment-types';
import type { AppInventoryPayload } from '../renderers/app-inventory';
import type { ResponseChecklistPayload } from '../renderers/response-checklist';
import type { ScorecardPayload } from '../renderers/scorecard';
import type { PricingTemplatePayload } from '../renderers/pricing-template';
import type { PricingComparisonPayload } from '../renderers/pricing-comparison';
import type { TrapLogPayload } from '../renderers/trap-log';
import type { BafoQuestionPackPayload } from '../renderers/bafo-question-pack';
import type { MarketScanPayload } from '../renderers/market-scan';
import type { TcoIcebergPayload } from '../renderers/tco-iceberg';
import type { AiClauseGapPayload } from '../renderers/ai-clause-gap';
import type { RenewalDecisionPayload } from '../renderers/renewal-decision';
import type { SourceTransitionReadinessModel } from '../../transition/readiness-scoring';
import {
  escapeHtml,
  renderAppInventoryHtml,
  renderResponseChecklistHtml,
  renderScorecardHtml,
  renderPricingTemplateHtml,
  renderPricingComparisonHtml,
  renderTrapLogHtml,
  renderBafoQuestionPackHtml,
  renderMarketScanHtml,
  renderTcoIcebergHtml,
  renderAiClauseGapHtml,
  renderRenewalDecisionHtml,
} from './inline-renderers';
import { renderTransitionSectionHtml } from './sections/transition-section';

// ── Input shapes ──────────────────────────────────────────────────────────

export type DealPackStructuredCarrier =
  | { kind: 'app-inventory'; payload: AppInventoryPayload }
  | { kind: 'response-checklist'; payload: ResponseChecklistPayload }
  | { kind: 'scorecard'; payload: ScorecardPayload }
  | { kind: 'pricing-template'; payload: PricingTemplatePayload }
  | { kind: 'pricing-comparison'; payload: PricingComparisonPayload }
  | { kind: 'trap-log'; payload: TrapLogPayload }
  | { kind: 'bafo-question-pack'; payload: BafoQuestionPackPayload }
  | { kind: 'market-scan'; payload: MarketScanPayload }
  | { kind: 'tco-iceberg'; payload: TcoIcebergPayload }
  | { kind: 'ai-clause-gap'; payload: AiClauseGapPayload }
  | { kind: 'renewal-decision'; payload: RenewalDecisionPayload }
  | { kind: 'transition-readiness'; payload: SourceTransitionReadinessModel };

export interface DealPackArtifact {
  code: string;
  title: string;
  kind: 'narrative' | 'structured' | 'missing';
  bodyIsAuthored: boolean;
  issuedBy?: string;
  /** Set when kind=narrative. */
  bodyMarkdown?: string;
  bodyHtml?: string;
  /** Set when kind=structured. */
  structured?: DealPackStructuredCarrier;
  /** Set when kind=missing. */
  missingReason?: string;
}

export interface DealPackStage {
  /** Numeric stage 0–7. */
  stage: number;
  /** Anchor slug (e.g. "stage-3"). */
  slug: string;
  /** Stage title (e.g. "Scope & RFP"). */
  title: string;
  /** One-line intent — methodology §3 framing. */
  intent: string;
  artifacts: DealPackArtifact[];
}

export interface DealPackInput {
  tenantName: string;
  eventCode: string;
  eventName: string;
  eventOwner: string | null;
  eventStatus: string;
  currentStageKey: SourceStageKey;
  archetype: string | null;
  estimatedValueUsd: number | null;
  generatedAt: string;
  stages: DealPackStage[];
  artifactStates: SourceEventArtifactState[];
  gateCriteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  cssBlock: string;
}

// ── Entry point ───────────────────────────────────────────────────────────

export function assembleDealPackHtml(input: DealPackInput): string {
  const docTitle = `${input.tenantName} · ${input.eventName} · Deal Pack`;
  // The Deal Pack headline verdict, blockers, evidence gaps and next
  // actions are sourced from the one Source expert-judgment kernel — the
  // SAME kernel the CXO narrative report consumes. The Deal Pack does NOT
  // synthesize its own conclusion: a kernel hold verdict must override any
  // positive decision artifact, so no part of the pack can read "Award /
  // proceed" while the kernel holds the award.
  const judgment = buildSourceJudgmentFromDealPack(input);
  const headlineHtml = renderHeadline(input, judgment);
  const tocHtml = renderToc(input);
  const stagesHtml = input.stages
    .map((s) => renderStageSection(s, judgment))
    .join('\n');
  const evidenceHtml = renderEvidenceLedger(input);
  const decisionsHtml = renderDecisionHistory(input);
  const glossaryHtml = renderGlossary();
  const generatedAtFmt = formatTimestamp(input.generatedAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(docTitle)}</title>
<meta name="generator" content="AbarVa Source Deal Pack" />
<meta name="x-source-event-code" content="${escapeHtml(input.eventCode)}" />
<meta name="x-source-tenant" content="${escapeHtml(input.tenantName)}" />
<meta name="x-source-generated-at" content="${escapeHtml(input.generatedAt)}" />
<style>${input.cssBlock}</style>
</head>
<body>
<div class="dp-shell">
  <header class="dp-shell__topbar">
    <div class="dp-topbar__brand">AbarVa · Source Deal Pack</div>
    <div class="dp-topbar__crumbs">
      <strong>${escapeHtml(input.tenantName)}</strong>
      <span>·</span>
      ${escapeHtml(input.eventCode)}
      <span>·</span>
      ${escapeHtml(input.eventName)}
      <span>·</span>
      ${escapeHtml(input.generatedAt.slice(0, 10))}
    </div>
  </header>
  <aside class="dp-toc" aria-label="Table of contents">
    ${tocHtml}
  </aside>
  <main class="dp-main">
    ${headlineHtml}
    ${stagesHtml}
    ${evidenceHtml}
    ${decisionsHtml}
    ${glossaryHtml}
    <footer class="dp-footer">
      Confidential — AbarVa Source Deal Pack · assembled by Sentinel on ${escapeHtml(generatedAtFmt)} · self-contained · safe to print or PDF-export.
    </footer>
  </main>
</div>
<script>
(function(){
  // Active-section TOC highlight via IntersectionObserver. Inline,
  // same-origin, no external deps. Degrades gracefully if disabled.
  try {
    var links = document.querySelectorAll('.dp-toc__list a[href^="#"]');
    if (!links.length || typeof IntersectionObserver !== 'function') return;
    var byId = {};
    links.forEach(function(a){
      var id = a.getAttribute('href').slice(1);
      if (id) byId[id] = a;
    });
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var id = e.target.id;
        var link = byId[id];
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(function(l){ l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    Object.keys(byId).forEach(function(id){
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  } catch (e) { /* harmless */ }
})();
</script>
</body>
</html>`;
}

// ── Headline (Fast Answer) ────────────────────────────────────────────────

function renderHeadline(input: DealPackInput, judgment: SourceJudgment): string {
  const synth = synthesizeHeadline(input, judgment);
  const eyebrow = `${escapeHtml(input.tenantName)} · ${escapeHtml(input.eventCode)} · ${escapeHtml(input.eventStatus)}`;
  const blockersBlock = renderHeadlineBlockers(judgment);
  if (synth.kind === 'hold') {
    // Kernel holds the award. The Deal Pack must NOT render "Award /
    // proceed" anywhere — it shows the hold verdict, the blockers, the
    // evidence gaps and the kernel next action verbatim.
    return `
    <section class="dp-headline dp-headline--hold" id="headline" aria-labelledby="headline-title">
      <div class="dp-headline__eyebrow">Headline · Fast Answer</div>
      <h1 class="dp-headline__title" id="headline-title">${escapeHtml(input.eventName)}</h1>
      <p class="dp-headline__subtitle">${eyebrow}</p>
      <div class="dp-headline__pending">
        <strong>${escapeHtml(synth.verdictLabel)} — Source expert-judgment kernel.</strong> ${escapeHtml(synth.executiveSummary)}
      </div>
      <dl class="dp-headline__rows">
        <dt>Verdict</dt><dd><strong>${escapeHtml(synth.verdictLabel)}</strong></dd>
        <dt>Confidence</dt><dd>${escapeHtml(synth.confidence)}</dd>
        <dt>Financial impact</dt><dd>${escapeHtml(synth.financialImpact)}</dd>
        <dt>Next action</dt><dd>${escapeHtml(synth.nextStep)}</dd>
        <dt>What would change the verdict</dt><dd>${escapeHtml(synth.changeTrigger)}</dd>
      </dl>
      ${blockersBlock}
    </section>
  `;
  }
  if (synth.kind === 'pending') {
    return `
    <section class="dp-headline" id="headline" aria-labelledby="headline-title">
      <div class="dp-headline__eyebrow">Headline · Fast Answer</div>
      <h1 class="dp-headline__title" id="headline-title">${escapeHtml(input.eventName)}</h1>
      <p class="dp-headline__subtitle">${eyebrow}</p>
      <div class="dp-headline__pending">
        <strong>Recommendation pending — Stage ${synth.stageNumber} (${escapeHtml(synth.stageLabel)}).</strong> ${escapeHtml(synth.nextStep)}
      </div>
      ${renderHeadlineRows(input, synth.facts)}
      ${blockersBlock}
    </section>
  `;
  }
  return `
    <section class="dp-headline" id="headline" aria-labelledby="headline-title">
      <div class="dp-headline__eyebrow">Headline · Fast Answer</div>
      <h1 class="dp-headline__title" id="headline-title">${escapeHtml(input.eventName)}</h1>
      <p class="dp-headline__subtitle">${eyebrow}</p>
      <dl class="dp-headline__rows">
        <dt>Recommended action</dt><dd><strong>${escapeHtml(synth.action)}</strong></dd>
        <dt>Confidence</dt><dd>${escapeHtml(synth.confidence)}</dd>
        <dt>Financial impact</dt><dd>${escapeHtml(synth.financialImpact)}</dd>
        <dt>Key risk</dt><dd>${escapeHtml(synth.keyRisk)}</dd>
        <dt>Next step</dt><dd>${escapeHtml(synth.nextStep)}</dd>
      </dl>
      ${blockersBlock}
    </section>
  `;
}

/**
 * Render the kernel's blockers + evidence gaps as a visible block. Every
 * Deal Pack — hold or not — surfaces the blockers and gaps the kernel
 * found so a recommendation is never shown without them.
 */
function renderHeadlineBlockers(judgment: SourceJudgment): string {
  if (judgment.blockers.length === 0 && judgment.evidenceGaps.length === 0) {
    return '';
  }
  const blockerRows = judgment.blockers
    .map(
      (b) =>
        `<li><strong>[${escapeHtml(b.severity)} · ${escapeHtml(b.domain)}]</strong> ${escapeHtml(b.description)} <em>${escapeHtml(b.requiredResolution)}</em></li>`,
    )
    .join('');
  const gapRows = judgment.evidenceGaps
    .map(
      (g) =>
        `<li><strong>Evidence gap:</strong> ${escapeHtml(g.gap)} <em>${escapeHtml(g.whyItMatters)}</em></li>`,
    )
    .join('');
  const blockers = blockerRows
    ? `<p class="dp-stage__intent">Open blockers (Source expert-judgment kernel)</p><ul class="dp-body">${blockerRows}</ul>`
    : '';
  const gaps = gapRows
    ? `<p class="dp-stage__intent">Evidence gaps</p><ul class="dp-body">${gapRows}</ul>`
    : '';
  return `<div class="dp-headline__blockers">${blockers}${gaps}</div>`;
}

interface HeadlineFacts {
  estimatedValue: string;
  archetype: string;
  owner: string;
  stage: string;
}

function renderHeadlineRows(input: DealPackInput, facts: HeadlineFacts): string {
  return `
      <dl class="dp-headline__rows">
        <dt>Estimated value</dt><dd>${escapeHtml(facts.estimatedValue)}</dd>
        <dt>Archetype</dt><dd>${escapeHtml(facts.archetype)}</dd>
        <dt>Owner</dt><dd>${escapeHtml(facts.owner)}</dd>
        <dt>Active stage</dt><dd>${escapeHtml(facts.stage)}</dd>
      </dl>
  `;
}

type HeadlineSynthesis =
  | {
      kind: 'hold';
      verdictLabel: string;
      executiveSummary: string;
      confidence: string;
      financialImpact: string;
      nextStep: string;
      changeTrigger: string;
    }
  | {
      kind: 'decided';
      action: string;
      confidence: string;
      financialImpact: string;
      keyRisk: string;
      nextStep: string;
    }
  | {
      kind: 'pending';
      stageNumber: number;
      stageLabel: string;
      nextStep: string;
      facts: HeadlineFacts;
    };

function synthesizeHeadline(input: DealPackInput, judgment: SourceJudgment): HeadlineSynthesis {
  const valueLabel = input.estimatedValueUsd
    ? fmtUsd(input.estimatedValueUsd)
    : '— not recorded';
  const archetype = input.archetype ?? '— not recorded';
  const owner = input.eventOwner ?? '— not recorded';
  const stageMap = stageNumberFor(input.currentStageKey);
  const stageLabel = stageMap.label;
  const stageNumber = stageMap.number;
  const facts: HeadlineFacts = {
    estimatedValue: valueLabel,
    archetype,
    owner,
    stage: `Stage ${stageNumber} · ${stageLabel}`,
  };

  // The kernel verdict is authoritative. When it holds the award, the
  // headline shows the hold verdict — it cannot be overridden by an
  // optimistic selection memo, decision brief or renewal posture.
  if (isHoldVerdict(judgment.verdict)) {
    return {
      kind: 'hold',
      verdictLabel: sourceJudgmentVerdictLabel(judgment.verdict),
      executiveSummary: judgment.executiveSummary,
      confidence: `${capitalizeFirst(judgment.confidence)} — Source expert-judgment kernel`,
      financialImpact: `${valueLabel} — do not treat as approved value until blockers close`,
      nextStep:
        judgment.nextActions[0]?.action
        ?? 'Close the named blockers and evidence gaps before supplier commitment.',
      changeTrigger: judgment.whatWouldChangeTheVerdict.join(' '),
    };
  }

  // Prefer authored decision artifacts in priority order — Selection
  // Memo (post-decision) > Renewal Decision (renewal track) > Decision
  // Brief (pre-decision) > Demand Challenge (pre-source).
  const findAuthored = (code: string): string | null => {
    const row = input.artifactStates.find((a) => a.artifactCode === code);
    if (row?.body && row.body.trim().length > 0) return row.body;
    return null;
  };

  const selectionMemo = findAuthored('d27_selection_memo');
  const renewalDecision = findAuthored('dx7_renewal_decision');
  const decisionBrief = findAuthored('d24_decision_brief');
  const demandChallenge = findAuthored('dx0_demand_challenge');

  // Confidence and key risk come from the kernel — not a hardcoded label.
  // The kernel verdict here is `award_ready` (the hold branch returned
  // above), so its `confidence` and any residual blockers are authoritative.
  const kernelConfidence = `${capitalizeFirst(judgment.confidence)} — Source expert-judgment kernel`;
  const kernelKeyRisk = deriveKeyRisk(judgment);

  if (selectionMemo) {
    return {
      kind: 'decided',
      action: extractFirstHeading(selectionMemo, 'Selection finalized — see Stage 5'),
      confidence: kernelConfidence,
      financialImpact: valueLabel,
      keyRisk: kernelKeyRisk ?? 'Transition / runbook delivery',
      nextStep: 'Mobilize transition plan; track Stage 7 (SRM) commitments.',
    };
  }
  if (renewalDecision) {
    return {
      kind: 'decided',
      action: extractFirstHeading(renewalDecision, 'Renewal posture recorded — see Stage 7'),
      confidence: kernelConfidence,
      financialImpact: valueLabel,
      keyRisk: kernelKeyRisk ?? 'Auto-renewal trap if posture not enacted before lock date',
      nextStep: 'Enact posture per Stage 7 candidate row; flip Final Decision once panel signs.',
    };
  }
  if (decisionBrief) {
    return {
      kind: 'decided',
      action: extractFirstHeading(decisionBrief, 'Recommendation drafted — see Stage 5'),
      confidence: kernelConfidence,
      financialImpact: valueLabel,
      keyRisk: kernelKeyRisk ?? 'Open traps in Stage 5 trap log',
      nextStep: 'Run BAFO question pack; close P0 traps before sponsor review.',
    };
  }
  if (demandChallenge) {
    return {
      kind: 'decided',
      action: extractFirstHeading(demandChallenge, 'Demand challenged — see Stage 0'),
      confidence: kernelConfidence,
      financialImpact: valueLabel,
      keyRisk: kernelKeyRisk ?? 'Sourcing without demand-challenge sign-off',
      nextStep: 'Confirm sourcing approach in Stage 1 before issuing solicitation.',
    };
  }

  // No authored decision yet — produce the "pending" headline keyed to
  // the current stage. Never invent a recommendation.
  const stagePending = stageMap;
  const nextStepFor = (n: number): string => {
    if (n <= 0) return 'Author the demand-challenge verdict (Stage 0) before proceeding.';
    if (n === 1) return 'Lock the sourcing approach (Stage 1) and approve before scoping.';
    if (n === 2) return 'Complete the market scan (Stage 2) before issuing the RFP.';
    if (n === 3) return 'Finalize the scope memo + RFP package (Stage 3).';
    if (n === 4) return 'Receive vendor pricing submissions to populate Stage 4 comparison.';
    if (n === 5) return 'Score finalists, close traps, draft decision brief (Stage 5).';
    if (n === 6) return 'Resolve AI clause gaps and finalize the vendor risk pack (Stage 6).';
    return 'Set renewal posture (Stage 7) before the auto-renewal lock date.';
  };
  return {
    kind: 'pending',
    stageNumber: stagePending.number,
    stageLabel: stagePending.label,
    nextStep: nextStepFor(stagePending.number),
    facts,
  };
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Derive the headline "key risk" from the kernel, not a hardcoded string.
 * Prefers the highest-severity residual blocker; falls back to the first
 * decision-blocking evidence gap. Returns `null` when the kernel found
 * neither — callers then use a stage-appropriate default.
 */
function deriveKeyRisk(judgment: SourceJudgment): string | null {
  const severityRank: Record<SourceJudgmentBlocker['severity'], number> = {
    P0: 0,
    P1: 1,
    P2: 2,
  };
  const topBlocker = [...judgment.blockers].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  )[0];
  if (topBlocker) {
    return `[${topBlocker.severity} · ${topBlocker.domain}] ${topBlocker.description}`;
  }
  const blockingGap =
    judgment.evidenceGaps.find((g) => g.blocksDecision) ?? judgment.evidenceGaps[0];
  if (blockingGap) return `Evidence gap: ${blockingGap.gap}`;
  return null;
}

// ── TOC ───────────────────────────────────────────────────────────────────

function renderToc(input: DealPackInput): string {
  const stageItems = input.stages
    .map(
      (s) => `<li><a href="#${escapeHtml(s.slug)}">Stage ${s.stage} — ${escapeHtml(s.title)}</a></li>`,
    )
    .join('\n');
  return `
    <div class="dp-toc__label">Headline</div>
    <ul class="dp-toc__list">
      <li><a href="#headline">Fast Answer</a></li>
    </ul>
    <div class="dp-toc__label">Lifecycle stages</div>
    <ul class="dp-toc__list">
      ${stageItems}
    </ul>
    <div class="dp-toc__label">Reference</div>
    <ul class="dp-toc__list">
      <li><a href="#evidence">Evidence Ledger</a></li>
      <li><a href="#decisions">Decision History</a></li>
      <li><a href="#glossary">Glossary</a></li>
    </ul>
  `;
}

// ── Stage section ─────────────────────────────────────────────────────────

function renderStageSection(stage: DealPackStage, judgment: SourceJudgment): string {
  const artifactsHtml = stage.artifacts
    .map((a) => renderArtifact(a, judgment))
    .join('\n');
  const emptyState =
    stage.artifacts.length === 0
      ? `<div class="dp-stage__empty"><strong>Not yet produced</strong> — this stage has no artifacts wired yet.</div>`
      : '';
  return `
    <section class="dp-stage" id="${escapeHtml(stage.slug)}" aria-labelledby="${escapeHtml(stage.slug)}-title">
      <header class="dp-stage__heading">
        <span class="dp-stage__number">Stage ${stage.stage}</span>
        <h2 class="dp-stage__title" id="${escapeHtml(stage.slug)}-title">${escapeHtml(stage.title)}</h2>
      </header>
      <p class="dp-stage__intent">${escapeHtml(stage.intent)}</p>
      ${emptyState}
      ${artifactsHtml}
    </section>
  `;
}

function renderArtifact(a: DealPackArtifact, judgment: SourceJudgment): string {
  const statusBadge = a.kind === 'missing'
    ? '<span class="dp-artifact__status">Not yet produced</span>'
    : a.bodyIsAuthored
      ? '<span class="dp-artifact__status is-authored">Authored</span>'
      : '<span class="dp-artifact__status is-scaffold">Scaffold</span>';
  const head = `
    <header class="dp-artifact__head">
      <span class="dp-artifact__code">${escapeHtml(a.code)}</span>
      <h3 class="dp-artifact__title">${escapeHtml(a.title)}</h3>
      ${statusBadge}
    </header>
  `;
  if (a.kind === 'missing') {
    return `
      <div class="dp-artifact">
        ${head}
        <div class="dp-stage__empty"><strong>Not yet produced</strong> — ${escapeHtml(a.missingReason ?? 'no payload available.')}</div>
      </div>
    `;
  }
  if (a.kind === 'narrative') {
    const issuedLine = a.issuedBy
      ? `<p class="dp-stage__intent">Issued by: ${escapeHtml(a.issuedBy)}</p>`
      : '';
    return `
      <div class="dp-artifact">
        ${head}
        ${issuedLine}
        <div class="dp-body">${a.bodyHtml ?? ''}</div>
      </div>
    `;
  }
  // Structured.
  const inner = a.structured ? renderStructured(a.structured, judgment) : '';
  return `
    <div class="dp-artifact">
      ${head}
      ${inner}
    </div>
  `;
}

function renderStructured(c: DealPackStructuredCarrier, judgment: SourceJudgment): string {
  switch (c.kind) {
    case 'app-inventory':
      return renderAppInventoryHtml(c.payload);
    case 'response-checklist':
      return renderResponseChecklistHtml(c.payload);
    case 'scorecard':
      return renderScorecardHtml(c.payload, judgment);
    case 'pricing-template':
      return renderPricingTemplateHtml(c.payload);
    case 'pricing-comparison':
      return renderPricingComparisonHtml(c.payload, judgment);
    case 'trap-log':
      return renderTrapLogHtml(c.payload);
    case 'bafo-question-pack':
      return renderBafoQuestionPackHtml(c.payload);
    case 'market-scan':
      return renderMarketScanHtml(c.payload);
    case 'tco-iceberg':
      return renderTcoIcebergHtml(c.payload);
    case 'ai-clause-gap':
      return renderAiClauseGapHtml(c.payload);
    case 'renewal-decision':
      return renderRenewalDecisionHtml(c.payload);
    case 'transition-readiness':
      return renderTransitionSectionHtml(c.payload);
  }
}

// ── Evidence Ledger ───────────────────────────────────────────────────────

function renderEvidenceLedger(input: DealPackInput): string {
  // Pull what the substrate captured. The Deal Pack does NOT re-derive
  // sources from the rendered artifacts — that would double-count and
  // could disagree with the underlying payloads.
  const rows = input.evidence
    .map((e) => {
      const stageLabel = e.stage ? `Stage ${stageNumberFor(e.stage).number}` : '—';
      const cited = e.sourceArtifactId && e.sourceArtifactId.trim().length > 0
        ? e.sourceArtifactId
        : '— citation not recorded';
      const asOf = e.lastSyncedAt ?? '—';
      const status = e.currentState ?? '—';
      const note = e.notes && e.notes.trim().length > 0 ? e.notes : '—';
      return `<tr><td>${escapeHtml(stageLabel)}</td><td>${escapeHtml(e.requirementId)}</td><td>${escapeHtml(cited)}</td><td>${escapeHtml(asOf)}</td><td>${escapeHtml(status)}</td><td>${escapeHtml(note)}</td></tr>`;
    })
    .join('');
  const body =
    input.evidence.length === 0
      ? `<p class="dp-ledger__empty">No evidence rows recorded for this event yet.</p>`
      : `<table class="dp-table"><thead><tr><th>Stage</th><th>Requirement</th><th>Source artifact</th><th>Last synced</th><th>Readiness state</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`;
  return `
    <section class="dp-ledger" id="evidence" aria-labelledby="evidence-title">
      <h2 class="dp-ledger__title" id="evidence-title">Evidence Ledger</h2>
      ${body}
    </section>
  `;
}

// ── Decision History ──────────────────────────────────────────────────────

function renderDecisionHistory(input: DealPackInput): string {
  const rows = input.gateCriteria
    .map((c) => {
      const stageLabel = c.fromStage ? `Stage ${stageNumberFor(c.fromStage).number}` : '—';
      const reviewedAt = c.reviewedAt ?? '—';
      const note = c.notes && c.notes.trim().length > 0 ? c.notes : '—';
      return `<tr><td>${escapeHtml(stageLabel)}</td><td>${escapeHtml(c.criterionId)}</td><td>${escapeHtml(c.state)}</td><td>${escapeHtml(reviewedAt)}</td><td>${escapeHtml(note)}</td></tr>`;
    })
    .join('');
  const body =
    input.gateCriteria.length === 0
      ? `<p class="dp-ledger__empty">No gate-criterion decisions recorded for this event yet.</p>`
      : `<table class="dp-table"><thead><tr><th>Stage</th><th>Gate criterion</th><th>State</th><th>Reviewed</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`;
  return `
    <section class="dp-ledger" id="decisions" aria-labelledby="decisions-title">
      <h2 class="dp-ledger__title" id="decisions-title">Decision History</h2>
      ${body}
    </section>
  `;
}

// ── Glossary ──────────────────────────────────────────────────────────────

function renderGlossary(): string {
  return `
    <section class="dp-ledger" id="glossary" aria-labelledby="glossary-title">
      <h2 class="dp-ledger__title" id="glossary-title">Glossary</h2>
      <dl class="dp-glossary">
        <dt>RFP / RFI / RFQ</dt><dd>Request for Proposal / Information / Quotation — the three solicitation lanes a buyer can issue. Picked in Stage 1.</dd>
        <dt>BAFO</dt><dd>Best And Final Offer — the last round before the selection memo. Vendor questions live in d22.</dd>
        <dt>TCO</dt><dd>Total Cost of Ownership — vendor-quoted PLUS hidden costs (integration, internal labor, exit). Stage 4 dx4 iceberg.</dd>
        <dt>SRM</dt><dd>Supplier Relationship Management — the live phase between contract signing and renewal. Stage 7.</dd>
        <dt>Seed gap</dt><dd>"Not recorded — seed gap" means substrate data for this row is not loaded yet. Never invented.</dd>
      </dl>
    </section>
  `;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function stageNumberFor(stageKey: SourceStageKey): { number: number; label: string } {
  // Map the canonical canvas stage keys to the methodology §3 stage
  // numbers (0–7). The canvas stage progression differs from the
  // methodology stage numbering, so we approximate via the closest
  // mapping. When a key doesn't match, default to "active stage".
  switch (stageKey) {
    case 'strategy':
      return { number: 1, label: 'Sourcing Strategy' };
    case 'scope':
      return { number: 3, label: 'Scope & RFP' };
    case 'rfp':
      return { number: 3, label: 'Scope & RFP' };
    case 'responses':
      return { number: 4, label: 'Pricing & TCO' };
    case 'evaluation':
      return { number: 5, label: 'Evaluation, BAFO & Decision' };
    case 'pricing':
      return { number: 4, label: 'Pricing & TCO' };
    case 'bafo':
      return { number: 5, label: 'Evaluation, BAFO & Decision' };
    case 'executive_decision':
      return { number: 5, label: 'Evaluation, BAFO & Decision' };
    case 'selection':
      return { number: 5, label: 'Evaluation, BAFO & Decision' };
    case 'transition':
      return { number: 10, label: 'Transition' };
    case 'value':
      return { number: 11, label: 'Value' };
    default:
      return { number: 1, label: 'Sourcing Strategy' };
  }
}

function extractFirstHeading(md: string, fallback: string): string {
  const trimmed = md.trim();
  if (!trimmed) return fallback;
  // First # / ## heading line
  const match = trimmed.match(/^#{1,3}\s+(.+)$/m);
  if (match) {
    const txt = match[1].trim();
    return txt.length > 0 ? txt : fallback;
  }
  // Fallback: first non-empty line, capped to ~120 chars.
  const firstLine = trimmed.split('\n').find((l) => l.trim().length > 0) ?? fallback;
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
}

function formatTimestamp(iso: string): string {
  // No locale dependency — keep deterministic in tests.
  return iso.replace('T', ' ').replace(/\..*$/, ' UTC');
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '— not recorded';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}
