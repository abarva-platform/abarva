// PR-8 — SourceRfpContextBundleTrace + claim validation.
//
// Proves the governed reasoning chain for every RFP section generation: which inputs
// were present/missing, which governed evidence was used vs excluded-by-reason, the
// assumptions/client-complete items, and whether the model call was allowed. Hard rule
// (enforced in buildSectionGenerationDecision): Claude/OpenAI may produce client-specific
// factual content ONLY when the section is AUTO-GOVERNED with evidence; AUTO-TEMPLATE /
// ELICIT-preliminary / CLIENT-COMPLETE generate boilerplate/placeholders only.

import crypto from 'node:crypto';
import type { RfpSectionDefinition, RfpSectionReadiness, SectionMode } from './types';

export interface SourceRfpContextBundleTrace {
  trace_id: string;
  source_event_id: string;
  tenant_id: string;
  tenant_key: string;
  archetype: string;
  section_id: string;
  section_mode: SectionMode;
  readiness_status: string;
  user_intent: string;
  required_inputs: string[];
  present_inputs: string[];
  missing_inputs: string[];
  retrieved_facts: string[];
  retrieved_artifacts: string[];
  retrieved_corpus_patterns: string[];
  excluded_objects_by_reason: Record<string, number>;
  assumptions_used: string[];
  client_complete_items: string[];
  source_basis_distribution: Record<string, number>;
  confidence_distribution: Record<string, number>;
  citation_ready_count: number;
  model_input_context_hash: string;
  model_call_allowed: boolean;
  model_call_kind: 'governed_facts' | 'boilerplate_only' | 'placeholder_only' | 'none';
  response_id: string | null;
  claims_detected: number;
  claims_supported: number;
  claims_unsupported: number;
  citations_emitted: string[];
  tenant_leakage_status: 'clean' | 'leak_detected';
}

export interface SectionGenerationDecision {
  modelCallAllowed: boolean;
  modelCallKind: SourceRfpContextBundleTrace['model_call_kind'];
  /** the only evidence the model may use (governed, agent_ready, tenant-scoped). */
  allowedEvidenceFamilies: string[];
  /** instruction injected into the section prompt to keep it honest. */
  generationDirective: string;
}

/**
 * Decide what kind of generation a section may have, from its effective mode.
 * The hard rule lives here: only AUTO-GOVERNED may assert client facts.
 */
export function buildSectionGenerationDecision(
  def: RfpSectionDefinition,
  readiness: RfpSectionReadiness,
): SectionGenerationDecision {
  switch (readiness.mode) {
    case 'auto_governed':
      return {
        modelCallAllowed: true,
        modelCallKind: 'governed_facts',
        allowedEvidenceFamilies: readiness.sourceBasis,
        generationDirective: 'Generate from the governed evidence only; cite [n]; never invent client facts.',
      };
    case 'auto_template':
      return {
        modelCallAllowed: true,
        modelCallKind: 'boilerplate_only',
        allowedEvidenceFamilies: [],
        generationDirective: 'Generate STANDARD template/boilerplate only — no client-specific facts. Flag as "standard template — client/legal to review".',
      };
    case 'elicit':
      return readiness.preliminaryOnly
        ? {
            modelCallAllowed: true,
            modelCallKind: 'placeholder_only',
            allowedEvidenceFamilies: [],
            generationDirective: `Produce a clearly-labelled PRELIMINARY draft from assumptions; insert "📋 NEXUS INTAKE" placeholders for: ${readiness.missingInputs.join(', ')}. Do not assert client facts.`,
          }
        : {
            modelCallAllowed: false,
            modelCallKind: 'none',
            allowedEvidenceFamilies: [],
            generationDirective: `Do not generate. Emit a NEXUS INTAKE block requesting: ${readiness.missingInputs.join(', ')}.`,
          };
    case 'client_complete':
      return {
        modelCallAllowed: true,
        modelCallKind: 'placeholder_only',
        allowedEvidenceFamilies: [],
        generationDirective: `Emit a "✍️ CLIENT TO COMPLETE" guided placeholder for: ${readiness.clientToCompleteItems.join(', ') || def.title}. Do not invent client policy/legal terms.`,
      };
  }
}

export interface SectionTraceInput {
  sourceEventId: string;
  tenantId: string;
  tenantKey: string;
  archetype: string;
  def: RfpSectionDefinition;
  readiness: RfpSectionReadiness;
  decision: SectionGenerationDecision;
  retrieved?: { facts?: string[]; artifacts?: string[]; corpusPatterns?: string[] };
  excludedByReason?: Record<string, number>;
  /** claims the produced section makes, each backed (or not) by a citation. */
  draftClaims?: { text: string; citation?: string }[];
  responseId?: string | null;
  /** non-tenant evidence that appeared (must be 0 for clean). */
  crossTenantHits?: number;
}

export function buildSourceRfpSectionTrace(inp: SectionTraceInput): SourceRfpContextBundleTrace {
  const { def, readiness, decision } = inp;
  const facts = inp.retrieved?.facts ?? [];
  const citationSet = new Set(readiness.citedSources);
  const claims = inp.draftClaims ?? [];
  const unsupported = claims.filter((c) => !c.citation || !citationSet.has(c.citation));
  const confDist: Record<string, number> = { [readiness.confidence]: 1 };
  const sbDist: Record<string, number> = {};
  for (const s of readiness.sourceBasis) sbDist[s] = (sbDist[s] ?? 0) + 1;
  const ctxStr = [decision.modelCallKind, ...readiness.sourceBasis, ...facts].join('|');
  return {
    trace_id: `rfptr-${inp.sourceEventId}-${def.id}`,
    source_event_id: inp.sourceEventId,
    tenant_id: inp.tenantId,
    tenant_key: inp.tenantKey,
    archetype: inp.archetype,
    section_id: def.id,
    section_mode: readiness.mode,
    readiness_status: readiness.readinessStatus,
    user_intent: `generate_section:${def.id}`,
    required_inputs: readiness.requiredInputs,
    present_inputs: readiness.presentInputs,
    missing_inputs: readiness.missingInputs,
    retrieved_facts: facts,
    retrieved_artifacts: inp.retrieved?.artifacts ?? [],
    retrieved_corpus_patterns: inp.retrieved?.corpusPatterns ?? [],
    excluded_objects_by_reason: inp.excludedByReason ?? {},
    assumptions_used: readiness.assumptions,
    client_complete_items: readiness.clientToCompleteItems,
    source_basis_distribution: sbDist,
    confidence_distribution: confDist,
    citation_ready_count: readiness.citedSources.length,
    model_input_context_hash: crypto.createHash('sha256').update(ctxStr).digest('hex').slice(0, 16),
    model_call_allowed: decision.modelCallAllowed,
    model_call_kind: decision.modelCallKind,
    response_id: inp.responseId ?? null,
    claims_detected: claims.length,
    claims_supported: claims.length - unsupported.length,
    claims_unsupported: unsupported.length,
    citations_emitted: readiness.citedSources,
    tenant_leakage_status: (inp.crossTenantHits ?? 0) > 0 ? 'leak_detected' : 'clean',
  };
}

/** A section trace is clean iff: allowed-kind respected, no unsupported claims, no leak. */
export function isCleanSectionTrace(t: SourceRfpContextBundleTrace): boolean {
  if (t.tenant_leakage_status !== 'clean') return false;
  if (t.model_call_kind === 'governed_facts' && t.claims_unsupported > 0) return false;
  if ((t.model_call_kind === 'boilerplate_only' || t.model_call_kind === 'placeholder_only') && t.citations_emitted.length > 0 && t.claims_unsupported > 0) return false;
  return true;
}
