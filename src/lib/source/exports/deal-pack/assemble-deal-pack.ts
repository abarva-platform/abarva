// Source · Deal Pack assembler.
//
// One self-contained HTML file per source event that bundles every
// artifact in the IT-sourcing lifecycle (stages 0–7) into one document
// a CXO or VP Sourcing can open, navigate, share, or print to PDF.
//
// Hard rules (non-negotiable):
//   - The HTML opens OFFLINE in any browser. No <script src=...>,
//     no <link rel=stylesheet href=http>, no <img src=http>, no
//     @import url(http://...). All CSS is inlined via styles.ts.
//   - The aggregator does NOT invent content. It pulls existing
//     artifact payloads via the canonical binders + the authored body
//     when present. When a stage has nothing to render, it shows a
//     "Not yet produced" panel naming the reason. Seed-gap lines from
//     the underlying artifacts are preserved verbatim.
//   - The Headline (Fast Answer) is synthesized only from the deal's
//     existing decision artifacts. When no clear punchline exists yet
//     (e.g. mid-RFP), the Headline reads "Recommendation pending —
//     Stage X" with the named next step.
//
// Stage map (methodology §3, lifecycle-coverage wave):
//   Stage 0 — Demand Challenge          dx0_demand_challenge
//   Stage 1 — Sourcing Strategy         dx1_sourcing_approach
//   Stage 2 — Market Intelligence       dx2_market_scan
//   Stage 3 — Scope / RFP               d04, d05, d09, d11
//   Stage 4 — Pricing / TCO             d19, d19c (variant=comparison), dx4
//   Stage 5 — Evaluation / BAFO         d16, d20, d22, d24, d27
//   Stage 6 — Risk / Clauses            dx6a, dx6b
//   Stage 7 — SRM / Renewal             dx7
//   Stage 10 — Transition               KT plan + readiness + risk register

import 'server-only';

import { markdownToHtml } from '@/lib/exports-shared/markdown-to-html';
import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';

import { buildNarrativeDocxPayloadFromContext } from '../payloads/narrative-docx-payload';
import { buildAppInventoryPayloadFromContext } from '../payloads/app-inventory-payload';
import { buildResponseChecklistPayloadFromContext } from '../payloads/response-checklist-payload';
import { buildScorecardPayloadFromContext } from '../payloads/scorecard-payload';
import { buildPricingTemplatePayloadFromContext } from '../payloads/pricing-template-payload';
import { buildPricingComparisonPayloadFromContext } from '../payloads/pricing-comparison-payload';
import { buildTrapLogPayloadFromContext } from '../payloads/trap-log-payload';
import { buildBafoQuestionPackPayloadFromContext } from '../payloads/bafo-question-pack-payload';
import { buildDemandChallengePayloadFromContext } from '../payloads/demand-challenge-payload';
import { buildSourcingApproachPayloadFromContext } from '../payloads/sourcing-approach-payload';
import { buildVendorRiskPackPayloadFromContext } from '../payloads/vendor-risk-pack-payload';
import { buildMarketScanPayloadFromContext } from '../payloads/market-scan-payload';
import { buildTcoIcebergPayloadFromContext } from '../payloads/tco-iceberg-payload';
import { buildAiClauseGapPayloadFromContext } from '../payloads/ai-clause-gap-payload';
import { buildRenewalDecisionPayloadFromContext } from '../payloads/renewal-decision-payload';
import { buildSourceTransitionReadinessModel } from '../../transition/readiness-scoring';

import { DEAL_PACK_STYLES } from './styles';
import { assembleDealPackHtml, type DealPackInput, type DealPackArtifact } from './stage-sections';

export interface DealPackBuildResult {
  /** The full HTML document as a UTF-8 string. */
  html: string;
  /** Suggested filename (without path). */
  filename: string;
  /** The same input we passed to the renderer — useful in tests. */
  input: DealPackInput;
}

/**
 * Build the Deal Pack for a source event. Pure assembler: takes a
 * SourceGenerationContext + a fixed generatedAt, calls every artifact
 * payload binder, then assembles the document via stage-sections.
 *
 * Any single payload-binder failure is caught and surfaced as a
 * stage-section that explains the gap honestly. The aggregator NEVER
 * throws — better to render an honest "not yet produced" than to fail
 * the download entirely.
 */
export async function assembleDealPack(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<DealPackBuildResult> {
  const tryBuild = async <T>(
    label: string,
    fn: () => T | Promise<T>,
  ): Promise<{ ok: true; value: T } | { ok: false; reason: string }> => {
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        reason: `${label} could not be built (${detail}). Substrate may not be loaded for this tenant yet.`,
      };
    }
  };

  // ── Stage 0 — Demand Challenge ─────────────────────────────────────────
  const dx0 = await tryBuild('dx0 demand challenge', () =>
    buildDemandChallengePayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 1 — Sourcing Strategy ────────────────────────────────────────
  const dx1 = await tryBuild('dx1 sourcing approach', () =>
    buildSourcingApproachPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 2 — Market Intelligence ──────────────────────────────────────
  const dx2 = await tryBuild('dx2 market scan', () =>
    buildMarketScanPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 3 — Scope / RFP ──────────────────────────────────────────────
  const d04 = await tryBuild('d04 app inventory', () =>
    buildAppInventoryPayloadFromContext(ctx, generatedAt),
  );
  const d05 = await tryBuild('d05 scope memo', () =>
    buildNarrativeDocxPayloadFromContext(ctx, 'd05_scope_memo', generatedAt),
  );
  const d09 = await tryBuild('d09 RFP package', () =>
    buildNarrativeDocxPayloadFromContext(ctx, 'd09_rfp_pack', generatedAt),
  );
  const d11 = await tryBuild('d11 response checklist', () =>
    buildResponseChecklistPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 4 — Pricing / TCO ────────────────────────────────────────────
  const d19 = await tryBuild('d19 pricing template', () =>
    buildPricingTemplatePayloadFromContext(ctx, generatedAt),
  );
  const d19c = await tryBuild('d19c pricing comparison', () =>
    buildPricingComparisonPayloadFromContext(ctx, generatedAt),
  );
  const dx4 = await tryBuild('dx4 TCO iceberg', () =>
    buildTcoIcebergPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 5 — Evaluation / BAFO ────────────────────────────────────────
  const d16 = await tryBuild('d16 scorecard', () =>
    buildScorecardPayloadFromContext(ctx, generatedAt),
  );
  const d20 = await tryBuild('d20 trap log', () =>
    buildTrapLogPayloadFromContext(ctx, generatedAt),
  );
  const d22 = await tryBuild('d22 BAFO question pack', () =>
    buildBafoQuestionPackPayloadFromContext(ctx, generatedAt),
  );
  const d24 = await tryBuild('d24 decision brief', () =>
    buildNarrativeDocxPayloadFromContext(ctx, 'd24_decision_brief', generatedAt),
  );
  const d27 = await tryBuild('d27 selection memo', () =>
    buildNarrativeDocxPayloadFromContext(ctx, 'd27_selection_memo', generatedAt),
  );

  // ── Stage 6 — Risk / Clauses ───────────────────────────────────────────
  const dx6a = await tryBuild('dx6a AI clause gap', () =>
    buildAiClauseGapPayloadFromContext(ctx, generatedAt),
  );
  const dx6b = await tryBuild('dx6b vendor risk pack', () =>
    buildVendorRiskPackPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 7 — SRM / Renewal ────────────────────────────────────────────
  const dx7 = await tryBuild('dx7 renewal decision', () =>
    buildRenewalDecisionPayloadFromContext(ctx, generatedAt),
  );

  // ── Stage 10 — Transition ──────────────────────────────────────────────
  const stage10Transition = await tryBuild('stage 10 transition readiness', () =>
    buildSourceTransitionReadinessModel(),
  );

  // The aggregator passes raw markdown bodies through `markdownToHtml`
  // here so the renderer module stays free of mdast imports.
  const renderMarkdown = (md: string): string => markdownToHtml(md);

  const input: DealPackInput = {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    eventOwner: ctx.event.owner,
    eventStatus: ctx.event.statusLabel,
    currentStageKey: ctx.event.currentStageKey,
    archetype: ctx.event.archetype,
    estimatedValueUsd: ctx.event.estimatedValueUsd,
    generatedAt,
    stages: [
      {
        stage: 0,
        slug: 'stage-0',
        title: 'Demand Challenge',
        intent: 'Should we even source this? Test the demand against existing vendor coverage, IT landscape and IT financials before any solicitation lane.',
        artifacts: dx0.ok
          ? [narrativeArtifact('dx0_demand_challenge', 'Demand Challenge verdict', dx0.value, renderMarkdown)]
          : missingArtifact('dx0_demand_challenge', 'Demand Challenge', dx0.reason),
      },
      {
        stage: 1,
        slug: 'stage-1',
        title: 'Sourcing Strategy',
        intent: 'Pick the solicitation lane (RFI / RFP / RFQ), commercial model, single vs multi vendor, SI delivery posture.',
        artifacts: dx1.ok
          ? [narrativeArtifact('dx1_sourcing_approach', 'Sourcing Approach', dx1.value, renderMarkdown)]
          : missingArtifact('dx1_sourcing_approach', 'Sourcing Approach', dx1.reason),
      },
      {
        stage: 2,
        slug: 'stage-2',
        title: 'Market Intelligence',
        intent: 'Map the vendor landscape, capability matrix, 3-D rate benchmarks, industry signals.',
        artifacts: dx2.ok
          ? [structuredArtifact('dx2_market_scan', 'Market Scan', { kind: 'market-scan', payload: dx2.value })]
          : missingArtifact('dx2_market_scan', 'Market Scan', dx2.reason),
      },
      {
        stage: 3,
        slug: 'stage-3',
        title: 'Scope & RFP',
        intent: 'Lock the application inventory, scope memo, RFP package and response checklist.',
        artifacts: [
          ...(d04.ok
            ? [structuredArtifact('d04_app_inv', 'Application Inventory', { kind: 'app-inventory', payload: d04.value })]
            : missingArtifact('d04_app_inv', 'Application Inventory', d04.reason)),
          ...(d05.ok
            ? [narrativeArtifact('d05_scope_memo', 'Scope Memo', d05.value, renderMarkdown)]
            : missingArtifact('d05_scope_memo', 'Scope Memo', d05.reason)),
          ...(d09.ok
            ? [narrativeArtifact('d09_rfp_pack', 'RFP Package', d09.value, renderMarkdown)]
            : missingArtifact('d09_rfp_pack', 'RFP Package', d09.reason)),
          ...(d11.ok
            ? [structuredArtifact('d11_response_checklist', 'Response Checklist', { kind: 'response-checklist', payload: d11.value })]
            : missingArtifact('d11_response_checklist', 'Response Checklist', d11.reason)),
        ],
      },
      {
        stage: 4,
        slug: 'stage-4',
        title: 'Pricing & TCO',
        intent: 'Issue the locked pricing template, compare vendor submissions, surface hidden costs via TCO iceberg.',
        artifacts: [
          ...(d19.ok
            ? [structuredArtifact('d19_pricing_workbook', 'Pricing Template', { kind: 'pricing-template', payload: d19.value })]
            : missingArtifact('d19_pricing_workbook', 'Pricing Template', d19.reason)),
          ...(d19c.ok
            ? [structuredArtifact('d19c_pricing_comparison', 'Pricing Comparison', { kind: 'pricing-comparison', payload: d19c.value })]
            : missingArtifact('d19c_pricing_comparison', 'Pricing Comparison', d19c.reason)),
          ...(dx4.ok
            ? [structuredArtifact('dx4_tco_iceberg', 'TCO Iceberg', { kind: 'tco-iceberg', payload: dx4.value })]
            : missingArtifact('dx4_tco_iceberg', 'TCO Iceberg', dx4.reason)),
        ],
      },
      {
        stage: 5,
        slug: 'stage-5',
        title: 'Evaluation, BAFO & Decision',
        intent: 'Score finalists, log open traps, prepare BAFO questions, draft the decision brief and selection memo.',
        artifacts: [
          ...(d16.ok
            ? [structuredArtifact('d16_scorecard', 'Scorecard', { kind: 'scorecard', payload: d16.value })]
            : missingArtifact('d16_scorecard', 'Scorecard', d16.reason)),
          ...(d20.ok
            ? [structuredArtifact('d20_trap_log', 'Trap Log', { kind: 'trap-log', payload: d20.value })]
            : missingArtifact('d20_trap_log', 'Trap Log', d20.reason)),
          ...(d22.ok
            ? [structuredArtifact('d22_bafo_question_pack', 'BAFO Question Pack', { kind: 'bafo-question-pack', payload: d22.value })]
            : missingArtifact('d22_bafo_question_pack', 'BAFO Question Pack', d22.reason)),
          ...(d24.ok
            ? [narrativeArtifact('d24_decision_brief', 'Decision Brief', d24.value, renderMarkdown)]
            : missingArtifact('d24_decision_brief', 'Decision Brief', d24.reason)),
          ...(d27.ok
            ? [narrativeArtifact('d27_selection_memo', 'Selection Memo', d27.value, renderMarkdown)]
            : missingArtifact('d27_selection_memo', 'Selection Memo', d27.reason)),
        ],
      },
      {
        stage: 6,
        slug: 'stage-6',
        title: 'Risk & Clauses',
        intent: 'Close the AI clause library gaps, build the vendor risk pack covering security, financial, concentration and 4P.',
        artifacts: [
          ...(dx6a.ok
            ? [structuredArtifact('dx6a_ai_clause_gap', 'AI Clause Gap', { kind: 'ai-clause-gap', payload: dx6a.value })]
            : missingArtifact('dx6a_ai_clause_gap', 'AI Clause Gap', dx6a.reason)),
          ...(dx6b.ok
            ? [narrativeArtifact('dx6b_vendor_risk_pack', 'Vendor Risk Pack', dx6b.value, renderMarkdown)]
            : missingArtifact('dx6b_vendor_risk_pack', 'Vendor Risk Pack', dx6b.reason)),
        ],
      },
      {
        stage: 7,
        slug: 'stage-7',
        title: 'SRM & Renewal',
        intent: 'Treat renewal as a sourcing event in its own right — recommend posture per vendor against operating telemetry.',
        artifacts: dx7.ok
          ? [structuredArtifact('dx7_renewal_decision', 'Renewal Decision', { kind: 'renewal-decision', payload: dx7.value })]
          : missingArtifact('dx7_renewal_decision', 'Renewal Decision', dx7.reason),
      },
      {
        stage: 10,
        slug: 'stage-10',
        title: 'Transition',
        intent: 'Track knowledge transfer, go-live readiness, cutover sign-offs, and transition risks before value measurement begins.',
        artifacts: stage10Transition.ok
          ? [
              structuredArtifact('stage10_transition_readiness', 'Transition Readiness', {
                kind: 'transition-readiness',
                payload: stage10Transition.value,
              }),
            ]
          : missingArtifact('stage10_transition_readiness', 'Transition Readiness', stage10Transition.reason),
      },
    ],
    artifactStates: ctx.artifactStates,
    gateCriteria: ctx.gateCriteria,
    evidence: ctx.evidence,
    cssBlock: DEAL_PACK_STYLES,
  };

  const html = assembleDealPackHtml(input);
  const filename = makeFilename(ctx, generatedAt);
  return { html, filename, input };
}

function narrativeArtifact(
  code: string,
  title: string,
  payload: { body: string; bodyIsAuthored: boolean; issuedBy?: string },
  renderMarkdown: (md: string) => string,
): DealPackArtifact {
  return {
    code,
    title,
    kind: 'narrative',
    bodyIsAuthored: payload.bodyIsAuthored,
    issuedBy: payload.issuedBy,
    bodyMarkdown: payload.body,
    bodyHtml: renderMarkdown(payload.body || ''),
  };
}

function structuredArtifact(
  code: string,
  title: string,
  carrier: DealPackArtifact['structured'] & object,
): DealPackArtifact {
  return {
    code,
    title,
    kind: 'structured',
    bodyIsAuthored: true,
    structured: carrier,
  };
}

function missingArtifact(code: string, title: string, reason: string): DealPackArtifact[] {
  return [
    {
      code,
      title,
      kind: 'missing',
      bodyIsAuthored: false,
      missingReason: reason,
    },
  ];
}

function makeFilename(ctx: SourceGenerationContext, generatedAt: string): string {
  const dateStamp = generatedAt.slice(0, 10);
  const tenantSlug = slugify(ctx.tenantName);
  const eventSlug = slugify(ctx.event.code);
  return `abarva-source-deal-pack-${tenantSlug}-${eventSlug}-${dateStamp}.html`;
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
