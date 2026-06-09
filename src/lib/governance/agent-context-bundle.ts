// =============================================================================
// Context & Corpus Governance — validated agent context bundle (PR-5, runtime)
// -----------------------------------------------------------------------------
// The single seam every agent context bundle flows through before it reaches a
// model. It unifies the three historical shapes (Sentinel `AskSource[]`, Nexus
// `CompositionBundle`/`Source[]`, broker `EnterpriseAgentContextBundle`) into one
// governed-candidate form, runs each candidate through the policy contract
// (evaluateGovernedObject), and returns a bundle split into usable vs blocked
// with a bundle-level decision. It then wraps into a `DecisionReasoningRequest`
// — the envelope a reasoning agent receives.
//
// Why a seam: with one chokepoint, the PR-4 `agent-readiness` CI check can be
// tightened to require this call site, so no future change (Codex or Claude
// Code) can put ungoverned context in front of a model. Pure + DB-free.
// =============================================================================

import {
  evaluateGovernedObject,
  POLICY_VERSION,
  SENSITIVE_CLASSIFICATIONS,
  type AgentReadiness,
  type ApplicableAgent,
  type Classification,
  type ConfidenceLevel,
  type PolicyDecision,
  type Retrievability,
  type SourceLayer,
} from "./context-corpus-policy";

/** The governance-relevant subset known at bundle-assembly time. */
export interface GovernedCandidate {
  id: string;
  client_key: string;
  tenant_id: string | null;
  source_layer: SourceLayer;
  source_basis: string | null;
  classification: Classification;
  retrievability: Retrievability;
  agent_readiness_status: AgentReadiness;
  confidence_level: ConfidenceLevel | null;
  cited_render_verified_at: string | null;
  title?: string;
  citations?: string[];
}

export interface BlockedCandidate {
  candidate: GovernedCandidate;
  errors: string[];
}

export interface ValidatedAgentContextBundle {
  /** Candidates that may enter the model context (decision !== block). */
  usable: GovernedCandidate[];
  /** Candidates the policy refused. They never reach the model. */
  blocked: BlockedCandidate[];
  /** Bundle-level decision: block if nothing usable, warn if any caveats, else pass. */
  decision: PolicyDecision;
  /** Count of fully agent-ready candidates (grounded + retrievable + cite-verified). */
  agentReadyCount: number;
  /** Flattened, de-duplicated citation locators from usable candidates. */
  citations: string[];
  warnings: string[];
  policy_version: string;
}

/** Lift a candidate to a full GovernedObject (conservative defaults) and gate it. */
function evaluateCandidate(c: GovernedCandidate) {
  return evaluateGovernedObject({
    id: c.id,
    tenant_id: c.tenant_id,
    client_key: c.client_key,
    object_type: c.source_layer,
    source_layer: c.source_layer,
    industry: null,
    enterprise_area: null,
    function: null,
    process_area: null,
    use_case_category: null,
    strategic_move_phase_applicability: [],
    applicable_agents: [],
    source_basis: c.source_basis,
    source_references: c.citations ?? [],
    classification: c.classification,
    compliance_basis: null,
    agent_readiness_status: c.agent_readiness_status,
    retrievability: c.retrievability,
    confidence_level: c.confidence_level,
    confidence_rationale: null,
    cited_render_verified_at: c.cited_render_verified_at,
    last_reviewed_at: null,
    owner: null,
    data_domains: [],
    required_kpis: [],
    baseline_requirements: [],
    measurement_method: null,
    value_levers: [],
    known_failure_modes: [],
    guardrails: [],
    human_in_loop_controls: [],
    allowed_agent_actions: [],
    blocked_agent_actions: [],
    provenance: c.source_basis ? { source_file: c.source_basis } : null,
    policy_version: POLICY_VERSION,
    contract_hash: null,
    created_at: null,
    updated_at: null,
  });
}

export interface BuildBundleOptions {
  /**
   * Allow sensitive (pii/phi/restricted) candidates into the bundle. Off by
   * default: per the policy contract, sensitive classifications may not enter an
   * agent bundle unless a caller with clearance explicitly opts in.
   */
  allowSensitive?: boolean;
}

/**
 * Validate a set of candidates into a governed bundle. Blocked candidates are
 * removed from `usable` and never reach the model. Sensitive candidates are
 * fenced by default (the agent-bundle half of the SENSITIVE_CLASSIFICATIONS
 * rule — the corpus half lives in evaluateGovernedObject).
 */
export function buildValidatedAgentContextBundle(
  candidates: GovernedCandidate[],
  options: BuildBundleOptions = {},
): ValidatedAgentContextBundle {
  const usable: GovernedCandidate[] = [];
  const blocked: BlockedCandidate[] = [];
  const warnings: string[] = [];
  let agentReadyCount = 0;

  for (const c of candidates) {
    if (
      !options.allowSensitive &&
      SENSITIVE_CLASSIFICATIONS.has(c.classification)
    ) {
      blocked.push({
        candidate: c,
        errors: [
          `sensitive classification "${c.classification}" may not enter an agent bundle by default`,
        ],
      });
      continue;
    }
    const evaluation = evaluateCandidate(c);
    if (evaluation.decision === "block") {
      blocked.push({ candidate: c, errors: evaluation.errors });
      continue;
    }
    usable.push(c);
    if (evaluation.agentReady) agentReadyCount += 1;
    for (const w of evaluation.warnings) {
      warnings.push(`${c.id}: ${w}`);
    }
  }

  const citations = [...new Set(usable.flatMap((c) => c.citations ?? []))];

  const decision: PolicyDecision =
    usable.length === 0 && candidates.length > 0
      ? "block"
      : warnings.length > 0 || blocked.length > 0
        ? "warn"
        : "pass";

  return {
    usable,
    blocked,
    decision,
    agentReadyCount,
    citations,
    warnings,
    policy_version: POLICY_VERSION,
  };
}

// ── DecisionReasoningRequest spine ───────────────────────────────────────────

export interface DecisionReasoningRequest {
  task: string;
  agent: ApplicableAgent | string;
  tenantKey: string;
  retrievalBundle: ValidatedAgentContextBundle;
  policy_version: string;
}

export function buildDecisionReasoningRequest(input: {
  task: string;
  agent: ApplicableAgent | string;
  tenantKey: string;
  candidates: GovernedCandidate[];
}): DecisionReasoningRequest {
  return {
    task: input.task,
    agent: input.agent,
    tenantKey: input.tenantKey,
    retrievalBundle: buildValidatedAgentContextBundle(input.candidates),
    policy_version: POLICY_VERSION,
  };
}
