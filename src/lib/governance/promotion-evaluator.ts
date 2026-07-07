// PR-P1 · Read-only promotion eligibility evaluator.
//
// Pure, side-effect-free. For each governed_object_readiness sidecar row it
// computes the ten promotion criteria + a recommendation. It MIRRORS the
// canonical gates `evaluateGovernedObject` and `computeProposedReadiness`
// (same block/restrict/gap ladder) so the preview, the ledger, and the runtime
// gate all agree. It performs NO writes and NO promotion — it only reports what
// WOULD be eligible. Promotion to agent_ready is an earned, evidenced transition
// (PR-P2), never automatic just because data exists.

import {
  APPLICABLE_AGENTS,
  CORPUS_GLOBAL_SCOPE,
  RETRIEVABLE_STATES,
  SENSITIVE_CLASSIFICATIONS,
  isCanonicalClientKey,
  type AgentReadiness,
  type ApplicableAgent,
  type Classification,
  type Retrievability,
} from "./context-corpus-policy";

const APPLICABLE_AGENT_SET: ReadonlySet<string> = new Set(APPLICABLE_AGENTS);

/** The subset of governed_object_readiness columns the evaluator reads. */
export interface ReadinessRow {
  object_table: string;
  object_id: string;
  client_key: string;
  tenant_id: string | null;
  source_layer: string;
  agent_readiness_status: AgentReadiness | string;
  retrievability: Retrievability | string;
  classification: Classification | string;
  source_basis: string | null;
  confidence_level: string | null;
  applicable_agents: string[] | null;
  cited_render_verified_at: string | null;
  policy_validation_status?: string | null; // pending | pass | warn | block
  provenance?: Record<string, unknown> | null;
}

export interface PromotionCriteria {
  policy_valid: boolean;
  tenant_scoped: boolean;
  classification_allowed: boolean;
  source_basis_present: boolean;
  confidence_present: boolean;
  provenance_present: boolean;
  indexed_or_retrievable: boolean;
  citation_renderable: boolean;
  applicable_agents_valid: boolean;
}

export type PromotionRecommendation =
  | "agent_ready"
  | "promotion_candidate"
  | "restricted"
  | "blocked"
  | "remain_not_reviewed";

export interface PromotionEvaluation {
  object_table: string;
  object_id: string;
  client_key: string;
  source_layer: string;
  criteria: PromotionCriteria;
  recommendation: PromotionRecommendation;
  /** Human-readable reasons this row is not agent_ready (empty when recommended). */
  failure_reasons: string[];
}

function provenancePresent(p: ReadinessRow["provenance"]): boolean {
  if (!p || typeof p !== "object") return false;
  return Object.keys(p).length > 0;
}

/**
 * Evaluate one sidecar row. Pure. Mirrors the canonical gate ladder:
 * block → restricted → gap(not_reviewed) → not-indexed → not-cite-rendered → agent_ready.
 */
export function evaluatePromotion(row: ReadinessRow): PromotionEvaluation {
  const isTenant = row.client_key !== CORPUS_GLOBAL_SCOPE;
  const sensitive = SENSITIVE_CLASSIFICATIONS.has(
    row.classification as Classification,
  );
  const sensitiveInCorpus =
    row.source_layer === "industry_corpus" && sensitive;

  // ---- the ten criteria ----------------------------------------------------
  const tenant_scoped = !isTenant || row.tenant_id != null;
  const classification_allowed = !sensitiveInCorpus;
  const source_basis_present = !!row.source_basis && row.source_basis.trim() !== "";
  const confidence_present =
    !!row.confidence_level && row.confidence_level.trim() !== "";
  const provenance_present = provenancePresent(row.provenance);
  const indexed_or_retrievable = RETRIEVABLE_STATES.has(
    row.retrievability as Retrievability,
  );
  // citation_renderable = the earned, end-to-end cite-render gate (#3322).
  const citation_renderable = row.cited_render_verified_at != null;
  const agents = row.applicable_agents ?? [];
  const applicable_agents_valid =
    agents.length > 0 && agents.every((a) => APPLICABLE_AGENT_SET.has(a));

  const hardBlocked =
    row.agent_readiness_status === "blocked" ||
    row.agent_readiness_status === "quarantined" ||
    row.agent_readiness_status === "retired" ||
    !isCanonicalClientKey(row.client_key) ||
    !tenant_scoped ||
    sensitiveInCorpus ||
    row.policy_validation_status === "block";

  const policy_valid = !hardBlocked;

  const criteria: PromotionCriteria = {
    policy_valid,
    tenant_scoped,
    classification_allowed,
    source_basis_present,
    confidence_present,
    provenance_present,
    indexed_or_retrievable,
    citation_renderable,
    applicable_agents_valid,
  };

  // ---- recommendation ladder (mirrors computeProposedReadiness) ------------
  const failure_reasons: string[] = [];
  let recommendation: PromotionRecommendation;

  if (hardBlocked) {
    recommendation = "blocked";
    if (!isCanonicalClientKey(row.client_key))
      failure_reasons.push(`non-canonical client_key "${row.client_key}"`);
    if (!tenant_scoped) failure_reasons.push("tenant object missing tenant_id");
    if (sensitiveInCorpus)
      failure_reasons.push(
        `sensitive classification "${row.classification}" cannot be in shared corpus`,
      );
    if (["blocked", "quarantined", "retired"].includes(String(row.agent_readiness_status)))
      failure_reasons.push(`status is ${row.agent_readiness_status}`);
    if (row.policy_validation_status === "block")
      failure_reasons.push("policy_validation_status=block");
  } else if (sensitive) {
    recommendation = "restricted";
    failure_reasons.push(
      `sensitive classification "${row.classification}" requires explicit clearance`,
    );
  } else {
    // accumulate the agent_ready gaps
    if (!source_basis_present) failure_reasons.push("missing source_basis");
    if (!confidence_present) failure_reasons.push("missing confidence_level");
    if (!provenance_present) failure_reasons.push("missing provenance");
    if (!indexed_or_retrievable)
      failure_reasons.push(`not retrievable (retrievability=${row.retrievability})`);
    if (!citation_renderable)
      failure_reasons.push("not cite-render-verified end-to-end");
    if (!applicable_agents_valid)
      failure_reasons.push("no valid applicable_agents");

    // WS-F: split the terminal state so agent_ready is reached ONLY through a
    // governed promotion (the persisted agent_readiness_status), never directly
    // from evidence. A row that meets every criterion but is not yet approved is
    // a promotion_candidate — eligible to be promoted, awaiting governed sign-off.
    if (failure_reasons.length > 0) {
      recommendation = "remain_not_reviewed";
    } else if (row.agent_readiness_status === "agent_ready") {
      recommendation = "agent_ready";
    } else {
      recommendation = "promotion_candidate";
    }
  }

  return {
    object_table: row.object_table,
    object_id: row.object_id,
    client_key: row.client_key,
    source_layer: row.source_layer,
    criteria,
    recommendation,
    failure_reasons,
  };
}

/** All criteria that must be true for an agent_ready recommendation. */
export const REQUIRED_CRITERIA: (keyof PromotionCriteria)[] = [
  "policy_valid",
  "tenant_scoped",
  "classification_allowed",
  "source_basis_present",
  "confidence_present",
  "provenance_present",
  "indexed_or_retrievable",
  "citation_renderable",
  "applicable_agents_valid",
];

/** True when the row meets every criterion and is eligible to be promoted to
 *  agent_ready through governed sign-off (it is not yet agent_ready itself). */
export function isPromotionCandidate(evaluation: PromotionEvaluation): boolean {
  return evaluation.recommendation === "promotion_candidate";
}

export type { ApplicableAgent };
