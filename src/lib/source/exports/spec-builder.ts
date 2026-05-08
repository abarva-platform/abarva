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

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  SourceDeliverableKind,
  SourceDeliverableSpec,
} from './types';

import { buildNarrativeDocxPayloadFromContext } from './payloads/narrative-docx-payload';
import { buildAppInventoryPayloadFromContext } from './payloads/app-inventory-payload';
import { buildResponseChecklistPayloadFromContext } from './payloads/response-checklist-payload';
import { buildScorecardPayloadFromContext } from './payloads/scorecard-payload';
import { buildPricingTemplatePayloadFromContext } from './payloads/pricing-template-payload';
import { buildPricingComparisonPayloadFromContext } from './payloads/pricing-comparison-payload';
import { buildTrapLogPayloadFromContext } from './payloads/trap-log-payload';
import { buildBafoQuestionPackPayloadFromContext } from './payloads/bafo-question-pack-payload';

const KIND_TO_ARTIFACT_CODE: Record<SourceDeliverableKind, string> = {
  'scope-memo': 'd05_scope_memo',
  'rfp-package': 'd09_rfp_pack',
  'decision-brief': 'd24_decision_brief',
  'selection-memo': 'd27_selection_memo',
  'app-inventory': 'd04_app_inv',
  'response-checklist': 'd11_response_checklist',
  'scorecard': 'd16_scorecard',
  'pricing-template': 'd19_pricing_workbook',
  'pricing-comparison': 'd19_pricing_workbook',
  'trap-log': 'd20_trap_log',
  'bafo-question-pack': 'd22_bafo_question_pack',
};

const NARRATIVE_KINDS = new Set<SourceDeliverableKind>([
  'scope-memo',
  'rfp-package',
  'decision-brief',
  'selection-memo',
]);

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
    const payload = buildNarrativeDocxPayloadFromContext(ctx, artifactCode, generatedAt);
    return {
      ...base,
      kind,
      payload: {
        eventCode: payload.eventCode,
        eventName: payload.eventName,
        issuedBy: payload.issuedBy,
        body: payload.body,
        bodyIsAuthored: payload.bodyIsAuthored,
      } as unknown as Record<string, unknown>,
    };
  }

  switch (kind) {
    case 'app-inventory':
      return {
        ...base,
        kind,
        payload: buildAppInventoryPayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    case 'response-checklist':
      return {
        ...base,
        kind,
        payload: buildResponseChecklistPayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    case 'scorecard':
      return {
        ...base,
        kind,
        payload: buildScorecardPayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    case 'pricing-template':
      return {
        ...base,
        kind,
        payload: buildPricingTemplatePayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    case 'pricing-comparison':
      return {
        ...base,
        kind,
        payload: (await buildPricingComparisonPayloadFromContext(ctx, generatedAt)) as unknown as Record<string, unknown>,
      };
    case 'trap-log':
      return {
        ...base,
        kind,
        payload: buildTrapLogPayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    case 'bafo-question-pack':
      return {
        ...base,
        kind,
        payload: buildBafoQuestionPackPayloadFromContext(ctx, generatedAt) as unknown as Record<string, unknown>,
      };
    default:
      throw new Error(`spec-builder does not know kind "${kind}"`);
  }
}

/** Translate a canonical artifact code to the dispatcher's kind. */
export function kindForArtifactCode(
  artifactCode: string,
  variant?: 'template' | 'comparison',
): SourceDeliverableKind | null {
  if (artifactCode === 'd19_pricing_workbook') {
    return variant === 'comparison' ? 'pricing-comparison' : 'pricing-template';
  }
  for (const [k, code] of Object.entries(KIND_TO_ARTIFACT_CODE)) {
    if (code === artifactCode) return k as SourceDeliverableKind;
  }
  return null;
}
