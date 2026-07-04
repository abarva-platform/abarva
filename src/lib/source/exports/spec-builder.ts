// Source · DeliverableSpec builder (Slice 8.4).
//
// Bridge between the substrate context (SourceGenerationContext) and
// the SourceDeliverableSpec envelope used by the dispatcher. Each
// kind has a builder that pulls the right fields from substrate and
// the right legacy payload binder, then wraps the result in a
// kind-narrowed spec.
//
// The unified render route in this slice calls buildSourceDeliverable
// Spec(ctx, kind, generatedAt) and hands the result to
// renderSourceDeliverable. The legacy per-format routes still work
// in parallel during the transition; Slice 8.5 deletes them.

import "server-only";

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { SourceDeliverableKind, SourceDeliverableSpec } from "./types";

import { buildNarrativeDocxPayloadFromContext } from "./payloads/narrative-docx-payload";
import { buildAppInventoryPayloadFromContext } from "./payloads/app-inventory-payload";
import { buildResponseChecklistPayloadFromContext } from "./payloads/response-checklist-payload";
import { buildScorecardPayloadFromContext } from "./payloads/scorecard-payload";
import { buildPricingTemplatePayloadFromContext } from "./payloads/pricing-template-payload";
import { buildPricingComparisonPayloadFromContext } from "./payloads/pricing-comparison-payload";
import { buildTrapLogPayloadFromContext } from "./payloads/trap-log-payload";
import { buildBafoQuestionPackPayloadFromContext } from "./payloads/bafo-question-pack-payload";
import { buildDemandChallengePayloadFromContext } from "./payloads/demand-challenge-payload";
import { buildSourcingApproachPayloadFromContext } from "./payloads/sourcing-approach-payload";
import { buildVendorRiskPackPayloadFromContext } from "./payloads/vendor-risk-pack-payload";
import { buildMarketScanPayloadFromContext } from "./payloads/market-scan-payload";
import { buildTcoIcebergPayloadFromContext } from "./payloads/tco-iceberg-payload";
import { buildAiClauseGapPayloadFromContext } from "./payloads/ai-clause-gap-payload";
import { buildRenewalDecisionPayloadFromContext } from "./payloads/renewal-decision-payload";

const KIND_TO_ARTIFACT_CODE: Record<SourceDeliverableKind, string> = {
  "strategy-memo": "d01_strategy_memo",
  "scope-memo": "d05_scope_memo",
  "rfp-package": "d09_rfp_pack",
  "vendor-response-pack": "d13_vendor_responses",
  "decision-brief": "d24_decision_brief",
  "selection-memo": "d27_selection_memo",
  "app-inventory": "d04_app_inv",
  "response-checklist": "d11_response_checklist",
  scorecard: "d16_scorecard",
  "pricing-template": "d19_pricing_workbook",
  "pricing-comparison": "d19_pricing_workbook",
  "trap-log": "d20_trap_log",
  "bafo-question-pack": "d22_bafo_question_pack",
  "demand-challenge": "dx0_demand_challenge",
  "sourcing-approach": "dx1_sourcing_approach",
  "market-scan": "dx2_market_scan",
  "tco-iceberg": "dx4_tco_iceberg",
  "ai-clause-gap": "dx6a_ai_clause_gap",
  "vendor-risk-pack": "dx6b_vendor_risk_pack",
  "renewal-decision": "dx7_renewal_decision",
};

const ARTIFACT_CODE_ALIASES: Record<string, string> = {
  d01: "d01_strategy_memo",
  strategy_memo: "d01_strategy_memo",
  "strategy-memo": "d01_strategy_memo",
  d05: "d05_scope_memo",
  scope_memo: "d05_scope_memo",
  "scope-memo": "d05_scope_memo",
  d09: "d09_rfp_pack",
  d09_rfp_package: "d09_rfp_pack",
  rfp_package: "d09_rfp_pack",
  rfp_pack: "d09_rfp_pack",
  "rfp-package": "d09_rfp_pack",
  d11: "d11_response_checklist",
  d11_response_control_pack: "d11_response_checklist",
  response_control_pack: "d11_response_checklist",
  "response-control-pack": "d11_response_checklist",
  response_checklist: "d11_response_checklist",
  "response-checklist": "d11_response_checklist",
  d13: "d13_vendor_responses",
  vendor_response_pack: "d13_vendor_responses",
  vendor_responses: "d13_vendor_responses",
  "vendor-response-pack": "d13_vendor_responses",
  d16: "d16_scorecard",
  d16_evaluation_scorecard: "d16_scorecard",
  scorecard: "d16_scorecard",
  evaluation_scorecard: "d16_scorecard",
  "evaluation-scorecard": "d16_scorecard",
  d22: "d22_bafo_question_pack",
  bafo_question_pack: "d22_bafo_question_pack",
  bafo_pack: "d22_bafo_question_pack",
  "bafo-question-pack": "d22_bafo_question_pack",
  d24: "d24_decision_brief",
  decision_brief: "d24_decision_brief",
  executive_decision: "d24_decision_brief",
  executive_award_recommendation: "d24_decision_brief",
  "decision-brief": "d24_decision_brief",
  d27: "d27_selection_memo",
  selection_memo: "d27_selection_memo",
  "selection-memo": "d27_selection_memo",
};

// Narrative kinds use the shared NarrativeDocxPayload shape. The
// lifecycle wave (demand-challenge / sourcing-approach / vendor-risk-
// pack) reuses the same shape but with substrate-grounded scaffold
// builders, so it gets its own list of async narrative binders below
// rather than going through buildNarrativeDocxPayloadFromContext.
const NARRATIVE_KINDS = new Set<SourceDeliverableKind>([
  "strategy-memo",
  "scope-memo",
  "rfp-package",
  "vendor-response-pack",
  "decision-brief",
  "selection-memo",
]);

const LIFECYCLE_NARRATIVE_KINDS: Record<
  string,
  (ctx: SourceGenerationContext, at: string) => Promise<unknown>
> = {
  "demand-challenge": buildDemandChallengePayloadFromContext,
  "sourcing-approach": buildSourcingApproachPayloadFromContext,
  "vendor-risk-pack": buildVendorRiskPackPayloadFromContext,
};

/**
 * Build a SourceDeliverableSpec by pulling from substrate via the
 * kind-appropriate payload binder.
 */
export async function buildSourceDeliverableSpec(
  ctx: SourceGenerationContext,
  kind: SourceDeliverableKind,
  generatedAt: string,
): Promise<SourceDeliverableSpec> {
  const base = {
    tenantKey: ctx.tenantName, // Source uses tenantName as the tenant key
    sourceEventId: ctx.event.id,
    title: ctx.event.name,
    generatedAt,
  };

  if (NARRATIVE_KINDS.has(kind)) {
    const artifactCode = KIND_TO_ARTIFACT_CODE[kind];
    const payload = buildNarrativeDocxPayloadFromContext(
      ctx,
      artifactCode,
      generatedAt,
    );
    return {
      ...base,
      kind,
      payload: {
        tenantName: payload.tenantName,
        eventCode: payload.eventCode,
        eventName: payload.eventName,
        issuedBy: payload.issuedBy,
        generatedAt: payload.generatedAt,
        body: payload.body,
        bodyIsAuthored: payload.bodyIsAuthored,
      } as unknown as Record<string, unknown>,
    };
  }

  switch (kind) {
    case "app-inventory":
      return {
        ...base,
        kind,
        payload: buildAppInventoryPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "response-checklist":
      return {
        ...base,
        kind,
        payload: buildResponseChecklistPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "scorecard":
      return {
        ...base,
        kind,
        payload: buildScorecardPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "pricing-template":
      return {
        ...base,
        kind,
        payload: buildPricingTemplatePayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "pricing-comparison":
      return {
        ...base,
        kind,
        payload: (await buildPricingComparisonPayloadFromContext(
          ctx,
          generatedAt,
        )) as unknown as Record<string, unknown>,
      };
    case "trap-log":
      return {
        ...base,
        kind,
        payload: buildTrapLogPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "bafo-question-pack":
      return {
        ...base,
        kind,
        payload: buildBafoQuestionPackPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "demand-challenge":
    case "sourcing-approach":
    case "vendor-risk-pack": {
      const builder = LIFECYCLE_NARRATIVE_KINDS[kind]!;
      const payload = (await builder(ctx, generatedAt)) as {
        tenantName?: string;
        eventCode: string;
        eventName: string;
        issuedBy?: string;
        generatedAt?: string;
        body: string;
        bodyIsAuthored: boolean;
      };
      return {
        ...base,
        kind,
        payload: {
          tenantName: payload.tenantName,
          eventCode: payload.eventCode,
          eventName: payload.eventName,
          issuedBy: payload.issuedBy,
          generatedAt: payload.generatedAt,
          body: payload.body,
          bodyIsAuthored: payload.bodyIsAuthored,
        } as unknown as Record<string, unknown>,
      };
    }
    case "market-scan":
      return {
        ...base,
        kind,
        payload: (await buildMarketScanPayloadFromContext(
          ctx,
          generatedAt,
        )) as unknown as Record<string, unknown>,
      };
    case "tco-iceberg":
      return {
        ...base,
        kind,
        payload: buildTcoIcebergPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "ai-clause-gap":
      return {
        ...base,
        kind,
        payload: buildAiClauseGapPayloadFromContext(
          ctx,
          generatedAt,
        ) as unknown as Record<string, unknown>,
      };
    case "renewal-decision":
      return {
        ...base,
        kind,
        payload: (await buildRenewalDecisionPayloadFromContext(
          ctx,
          generatedAt,
        )) as unknown as Record<string, unknown>,
      };
    default:
      throw new Error(`spec-builder does not know kind "${kind}"`);
  }
}

/** Translate a canonical artifact code to the dispatcher's kind. */
export function canonicalArtifactCodeFor(
  artifactCode: string,
  variant?: "template" | "comparison",
): string {
  if (artifactCode === "d19_pricing_workbook") {
    return variant === "comparison"
      ? "d19_pricing_workbook"
      : "d19_pricing_workbook";
  }
  const normalized = artifactCode.trim().toLowerCase();
  return ARTIFACT_CODE_ALIASES[normalized] ?? artifactCode;
}

export function kindForArtifactCode(
  artifactCode: string,
  variant?: "template" | "comparison",
): SourceDeliverableKind | null {
  const canonicalArtifactCode = canonicalArtifactCodeFor(artifactCode, variant);
  if (canonicalArtifactCode === "d19_pricing_workbook") {
    return variant === "comparison" ? "pricing-comparison" : "pricing-template";
  }
  for (const [k, code] of Object.entries(KIND_TO_ARTIFACT_CODE)) {
    if (code === canonicalArtifactCode) return k as SourceDeliverableKind;
  }
  return null;
}
