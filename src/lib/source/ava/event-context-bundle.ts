// =============================================================================
// aVa — acceptance-bound governed event-context bundle (item C-008)
// -----------------------------------------------------------------------------
// aVa answers scoped to a Source event assembled their model context per mode:
// each builder collected its own candidates and handed them to
// `buildValidatedAgentContextBundle`. That seam enforces the corpus policy —
// downstream context policy, sensitive classification, agent-readiness — but it
// takes NO requesting identity, so it cannot tell a candidate belonging to this
// tenant, this event and this contract from one belonging to another. It also
// has no view of `source_artifact_acceptances`, so a superseded artifact version
// reads to it exactly like the accepted one.
//
// This module is the missing half: it binds candidates to a DECLARED event
// identity before the policy seam sees them, and refuses the four classes the
// seam is structurally unable to catch — opposite tenant, cross event/contract,
// superseded version, unreviewed evidence — plus the two kinds that may never
// reach a model at all, raw uploads and draft AI text.
//
// Identity is declared, never inferred (AGENTS.md). `EventContextIdentity` is a
// parameter: nothing in here reads a tenant or an event out of the candidates
// it is filtering, because a candidate asserting its own tenancy is exactly the
// input this fence exists to reject.
//
// Pure and DB-free: the caller reads acceptances, artifacts and facts, this
// decides what may be seen.
// =============================================================================

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
  type ValidatedAgentContextBundle,
} from "@/lib/governance/agent-context-bundle";
import {
  POLICY_VERSION,
  type AgentReadiness,
  type Classification,
  type ConfidenceLevel,
  type PolicyDecision,
  type Retrievability,
  type SourceLayer,
} from "@/lib/governance/context-corpus-policy";
// Type-only: erased at compile time, so the `server-only` guard on the
// acceptance repository is not pulled into this pure module. Imported rather
// than re-declared so the reader of the acceptance grammar cannot drift from
// its writer.
import type {
  ArtifactContentDriftStatus,
  ArtifactDownstreamContextPolicy,
} from "@/lib/source/artifact-acceptances";

// ── Kinds ────────────────────────────────────────────────────────────────────

/**
 * The context kinds an event answer may be built from. This is an ALLOWLIST:
 * a candidate whose kind is not on it is refused, so a kind added upstream
 * cannot reach a model until somebody adds it here deliberately.
 */
export const ADMISSIBLE_EVENT_CONTEXT_KINDS = [
  "accepted_artifact",
  "reviewed_evidence",
  "stage_plan",
  "supplier_fact",
  "archetype_intelligence",
  "citation",
] as const;
export type AdmissibleEventContextKind =
  (typeof ADMISSIBLE_EVENT_CONTEXT_KINDS)[number];

/** Kinds that may never enter a model context, whatever else is true of them. */
export const NEVER_ADMISSIBLE_EVENT_CONTEXT_KINDS = [
  "raw_upload",
  "ai_draft",
] as const;
export type NeverAdmissibleEventContextKind =
  (typeof NEVER_ADMISSIBLE_EVENT_CONTEXT_KINDS)[number];

export type EventContextKind =
  | AdmissibleEventContextKind
  | NeverAdmissibleEventContextKind;

/** Review states the acceptance contract recognises. Anything else fails closed. */
export const REVIEWED_STATES = ["accepted", "reviewed"] as const;
export type EventContextReviewState =
  | (typeof REVIEWED_STATES)[number]
  | "draft"
  | "rejected"
  | "unreviewed"
  | "superseded";

// ── Identity ─────────────────────────────────────────────────────────────────

export interface EventContextIdentity {
  /** The authenticated tenant. Never taken from a candidate. */
  tenantId: string;
  /** The canonical cover key for that tenant. Never a real client name. */
  clientKey: string;
  /** The event the answer is about. */
  eventId: string;
  /**
   * The contract the event is bound to, when it has one. `null` means the event
   * is not contract-bound; candidates naming a contract are then cross-contract.
   */
  contractId: string | null;
  /** The stage the event is in now. A plan for another stage is superseded. */
  currentStageKey: string;
  /**
   * artifactId -> `authoritative_version_id`, read from
   * `source_artifact_acceptances`. An artifact absent from this map has no
   * acceptance and is therefore not accepted evidence.
   */
  acceptedArtifactVersions: Readonly<Record<string, string>>;
}

// ── Candidate ────────────────────────────────────────────────────────────────

export interface EventContextCandidate {
  id: string;
  kind: EventContextKind;
  title?: string;
  /**
   * Candidate-asserted tenancy. Present so it can be CHECKED against the
   * declared identity — never so it can supply one.
   */
  tenantId: string | null;
  clientKey: string;
  eventId: string | null;
  contractId?: string | null;
  artifactId?: string | null;
  versionId?: string | null;
  stageKey?: string | null;
  reviewState?: EventContextReviewState;
  contentDriftStatus?: ArtifactContentDriftStatus;
  downstreamContextPolicy?: ArtifactDownstreamContextPolicy;
  /**
   * The prose a model would actually read. Refused candidates are returned with
   * this stripped, so a diagnostic render of `refused` cannot re-introduce the
   * text the refusal exists to keep out.
   */
  content?: string;
  // Governance fields handed on to the policy seam unchanged.
  sourceLayer: SourceLayer;
  sourceBasis: string | null;
  classification: Classification;
  retrievability: Retrievability;
  agentReadinessStatus: AgentReadiness;
  confidenceLevel: ConfidenceLevel | null;
  citedRenderVerifiedAt: string | null;
  citations?: string[];
}

// ── Refusals ─────────────────────────────────────────────────────────────────

export type EventContextRefusalCode =
  | "opposite_tenant"
  | "cross_event"
  | "cross_contract"
  | "raw_upload"
  | "ai_draft"
  | "unknown_kind"
  | "stale_version"
  | "unreviewed_evidence"
  | "superseded_stage_plan"
  | "policy_blocked";

export interface EventContextRefusal {
  /** The candidate with `content` removed. */
  candidate: EventContextCandidate;
  code: EventContextRefusalCode;
  reason: string;
  /** True whenever the candidate arrived carrying prose that was stripped. */
  contentRedacted: boolean;
}

export interface GovernedEventContextBundle {
  identity: EventContextIdentity;
  /** Candidates that may be put in front of a model. */
  admitted: EventContextCandidate[];
  refused: EventContextRefusal[];
  /** The policy seam's own verdict over the admitted set. */
  bundle: ValidatedAgentContextBundle;
  citations: string[];
  decision: PolicyDecision;
  /**
   * A POST-condition, recomputed over `admitted` rather than inferred from the
   * filter having run: every admitted candidate names this tenant and this
   * event. If the filter above ever stops working, this goes false.
   */
  tenantFencePassed: boolean;
  policy_version: string;
}

// ── Implementation ───────────────────────────────────────────────────────────

function withoutContent(candidate: EventContextCandidate): {
  candidate: EventContextCandidate;
  redacted: boolean;
} {
  if (candidate.content === undefined) {
    return { candidate, redacted: false };
  }
  const redacted = { ...candidate };
  delete redacted.content;
  return { candidate: redacted, redacted: true };
}

const NEVER_ADMISSIBLE: ReadonlySet<string> = new Set(
  NEVER_ADMISSIBLE_EVENT_CONTEXT_KINDS,
);
const ADMISSIBLE: ReadonlySet<string> = new Set(
  ADMISSIBLE_EVENT_CONTEXT_KINDS,
);
const REVIEWED: ReadonlySet<string> = new Set(REVIEWED_STATES);

/**
 * Decide one candidate against the declared identity. Returns the refusal code,
 * or `null` when the candidate survives to the policy seam.
 *
 * Order is deliberate and is asserted by the suite. The isolation boundary is
 * checked FIRST — tenant, then event, then contract — so a candidate that is
 * both cross-tenant and a raw upload is reported as the cross-tenant one, which
 * is the fact an audit needs. Kind, version binding, review state and stage
 * currency follow.
 */
function refusalFor(
  candidate: EventContextCandidate,
  identity: EventContextIdentity,
): { code: EventContextRefusalCode; reason: string } | null {
  if (
    candidate.tenantId !== identity.tenantId ||
    candidate.clientKey !== identity.clientKey
  ) {
    return {
      code: "opposite_tenant",
      reason: `candidate asserts tenant ${candidate.clientKey}/${String(candidate.tenantId)}; the authorized identity is ${identity.clientKey}/${identity.tenantId}`,
    };
  }
  if (candidate.eventId !== identity.eventId) {
    return {
      code: "cross_event",
      reason: `candidate belongs to event ${String(candidate.eventId)}, not ${identity.eventId}`,
    };
  }
  const candidateContract = candidate.contractId ?? null;
  if (candidateContract !== null && candidateContract !== identity.contractId) {
    return {
      code: "cross_contract",
      reason: `candidate belongs to contract ${candidateContract}; this event is bound to ${identity.contractId ?? "no contract"}`,
    };
  }
  if (NEVER_ADMISSIBLE.has(candidate.kind)) {
    return {
      code: candidate.kind === "raw_upload" ? "raw_upload" : "ai_draft",
      reason:
        candidate.kind === "raw_upload"
          ? "a raw upload may never enter a model context; accept a reviewed artifact version instead"
          : "draft AI text may never enter a model context; it stays suggested until a named user accepts it",
    };
  }
  if (!ADMISSIBLE.has(candidate.kind)) {
    return {
      code: "unknown_kind",
      reason: `kind "${candidate.kind}" is not on the admissible allowlist`,
    };
  }
  if (candidate.kind === "accepted_artifact") {
    const artifactId = candidate.artifactId ?? null;
    const accepted =
      artifactId === null
        ? undefined
        : identity.acceptedArtifactVersions[artifactId];
    if (accepted === undefined) {
      return {
        code: "unreviewed_evidence",
        reason: `artifact ${String(artifactId)} has no acceptance for this event, so no version of it is authoritative`,
      };
    }
    if (candidate.versionId !== accepted) {
      return {
        code: "stale_version",
        reason: `version ${String(candidate.versionId)} is not the accepted version ${accepted}`,
      };
    }
    // `unknown` drift fails closed alongside `stale`: an unmeasured artifact is
    // not a current one.
    if (candidate.contentDriftStatus !== "current") {
      return {
        code: "stale_version",
        reason: `content drift is "${candidate.contentDriftStatus ?? "unset"}"; only "current" may be quoted`,
      };
    }
  }
  if (!REVIEWED.has(candidate.reviewState ?? "")) {
    return {
      code: "unreviewed_evidence",
      reason: `review state is "${candidate.reviewState ?? "unset"}"; only ${REVIEWED_STATES.join(" or ")} may enter a model context`,
    };
  }
  if (
    candidate.kind === "stage_plan" &&
    candidate.stageKey !== identity.currentStageKey
  ) {
    return {
      code: "superseded_stage_plan",
      reason: `plan is for stage ${String(candidate.stageKey)}; the event is at ${identity.currentStageKey}`,
    };
  }
  return null;
}

function toGovernedCandidate(
  candidate: EventContextCandidate,
): GovernedCandidate {
  return {
    id: candidate.id,
    client_key: candidate.clientKey,
    tenant_id: candidate.tenantId,
    source_layer: candidate.sourceLayer,
    source_basis: candidate.sourceBasis,
    classification: candidate.classification,
    retrievability: candidate.retrievability,
    agent_readiness_status: candidate.agentReadinessStatus,
    confidence_level: candidate.confidenceLevel,
    cited_render_verified_at: candidate.citedRenderVerifiedAt,
    title: candidate.title,
    citations: candidate.citations,
    downstream_context_policy: candidate.downstreamContextPolicy,
  };
}

/**
 * The fence stated as a post-condition over an already-admitted set: every one
 * of these names the authorized tenant and event.
 *
 * Exported, and separate from the filter that produces `admitted`, for one
 * reason: an invariant recomputed only inside the function that guarantees it
 * is unfalsifiable — deleting it changes no observable behaviour, which is the
 * shape of gate this backlog exists against. Called directly with a hand-built
 * set, it can fail, so it can be tested.
 */
export function eventContextFenceHolds(
  admitted: readonly EventContextCandidate[],
  identity: EventContextIdentity,
): boolean {
  return admitted.every(
    (candidate) =>
      candidate.tenantId === identity.tenantId &&
      candidate.clientKey === identity.clientKey &&
      candidate.eventId === identity.eventId,
  );
}

export interface BuildEventContextBundleOptions {
  /** Forwarded to the policy seam; see `BuildBundleOptions`. */
  requireAgentReady?: boolean;
  allowSensitive?: boolean;
  allowRestrictedDownstreamContext?: boolean;
}

/**
 * Build the acceptance-bound governed context for one event answer.
 *
 * Identity fences run first, then the existing corpus policy seam decides the
 * rest. A candidate the seam blocks is reported here as `policy_blocked` and is
 * absent from `admitted`, so there is exactly one list a caller may read.
 */
export function buildGovernedEventContextBundle(
  candidates: readonly EventContextCandidate[],
  identity: EventContextIdentity,
  options: BuildEventContextBundleOptions = {},
): GovernedEventContextBundle {
  const refused: EventContextRefusal[] = [];
  const survivors: EventContextCandidate[] = [];

  for (const candidate of candidates) {
    const refusal = refusalFor(candidate, identity);
    if (refusal) {
      const { candidate: stripped, redacted } = withoutContent(candidate);
      refused.push({
        candidate: stripped,
        code: refusal.code,
        reason: refusal.reason,
        contentRedacted: redacted,
      });
      continue;
    }
    survivors.push(candidate);
  }

  const bundle = buildValidatedAgentContextBundle(
    survivors.map(toGovernedCandidate),
    options,
  );
  const blockedIds = new Set(bundle.blocked.map((b) => b.candidate.id));
  const admitted: EventContextCandidate[] = [];
  for (const candidate of survivors) {
    if (!blockedIds.has(candidate.id)) {
      admitted.push(candidate);
      continue;
    }
    const { candidate: stripped, redacted } = withoutContent(candidate);
    const errors =
      bundle.blocked.find((b) => b.candidate.id === candidate.id)?.errors ?? [];
    refused.push({
      candidate: stripped,
      code: "policy_blocked",
      reason: errors.join("; ") || "refused by the context & corpus policy",
      contentRedacted: redacted,
    });
  }

  const citations = [
    ...new Set(admitted.flatMap((candidate) => candidate.citations ?? [])),
  ];

  const tenantFencePassed = eventContextFenceHolds(admitted, identity);

  const decision: PolicyDecision =
    admitted.length === 0 && candidates.length > 0
      ? "block"
      : refused.length > 0 || bundle.warnings.length > 0
        ? "warn"
        : "pass";

  return {
    identity,
    admitted,
    refused,
    bundle,
    citations,
    decision,
    tenantFencePassed,
    policy_version: POLICY_VERSION,
  };
}

/** Refusal counts by code — for an audit line or a diagnostic panel. */
export function summarizeEventContextRefusals(
  bundle: GovernedEventContextBundle,
): Record<EventContextRefusalCode, number> {
  const counts = {
    opposite_tenant: 0,
    cross_event: 0,
    cross_contract: 0,
    raw_upload: 0,
    ai_draft: 0,
    unknown_kind: 0,
    stale_version: 0,
    unreviewed_evidence: 0,
    superseded_stage_plan: 0,
    policy_blocked: 0,
  } satisfies Record<EventContextRefusalCode, number>;
  for (const refusal of bundle.refused) {
    counts[refusal.code] += 1;
  }
  return counts;
}
