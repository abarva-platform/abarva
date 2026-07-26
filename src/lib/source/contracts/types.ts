// SourceArtifactContract — the single typed, versioned contract governing
// the relationship between a sourcing event's stage and every artifact type:
// eligibility, upstream requirements, review/acceptance authority,
// authoritative-use eligibility, export eligibility, and finality (PR 4A of
// ADR-0013-source-modernization-baseline.md's sequencing).
//
// Named `SourceArtifactContract` per ADR-0013's own naming (not
// `StageArtifactContract`) — see ADR-0015 for the design rationale and the
// stage-model decision this rests on.
//
// COMPOSED, not hand-authored: every field here is either read directly from
// one of the three pre-existing per-artifact registries (canonical-specs/
// artifact-specs.ts, agent-generation/prompt-registry.ts,
// documentation-standards/source-artifact-profiles.ts) or derived by an
// explicit, documented rule from those same fields — see build-registry.ts.
// This is deliberate: those three registries already exist, are keyed by the
// same artifact codes, and were drifting out of sync with no cross-
// validation (the exact gap this contract closes). A fourth, independently
// hand-typed 33-entry table would just be a fourth place to keep in sync.

import type { SourceStageKey } from "@/lib/source/types";
import type { SourceArtifactFamily } from "@/lib/source/artifact-registry/types";
import type {
  ArtifactAudience,
  DefaultFormat,
  EvidenceMode,
} from "@/lib/source/documentation-standards/source-artifact-profiles";

/** How a generated body may legitimately come to exist for this artifact. */
export type SourceArtifactGenerationMode = "ai_generated" | "chat_authored";

/**
 * Review depth required before an artifact's governance stage may advance
 * past `ai_draft`/`human_review`. `consulting_grade` names the 5-code set
 * already enforced today (SOURCE_CONSULTING_GRADE_GATE_CODES,
 * agent-generation/quality-review.ts) — carried through unchanged, not
 * reinvented.
 */
export type SourceArtifactReviewRequirement =
  | "consulting_grade_review_required"
  | "standard_review_required"
  | "review_recommended";

/**
 * Which acceptance-authority capability (source-access-policy.ts) a review
 * decision requires. Today this is uniformly `canApproveSourceStages` for
 * every artifact-accept route — see the "Known limitations" section of
 * ADR-0015. Modeled as a field (not a hardcoded constant) so a genuinely
 * per-artifact authority model has somewhere to live once source-access-
 * policy.ts supports one; this contract does not itself add that capability.
 */
export type SourceArtifactAcceptanceAuthority = "canApproveSourceStages";

/**
 * Which downstream authoritative-use mechanism resolves this artifact type.
 * Every current SourceArtifactContract entry is `client_final_artifact_slots`
 * (client-final-artifacts.ts's resolveAuthoritativeArtifactSlots, the general
 * mechanism already used by aVa/Q&A) — `vendor_proposal_fact_accepted_only`
 * exists as a named, documented sibling for `VendorProposalFact`, which is
 * NOT a d-code artifact and is therefore not itself an entry in this
 * registry, but the value is named here so a future unification is
 * type-safe rather than stringly-typed.
 */
export type SourceArtifactAuthoritativeUseMechanism =
  | "client_final_artifact_slots"
  | "vendor_proposal_fact_accepted_only";

/** Matches source_artifacts.lifecycle_state — no new vocabulary. */
export type SourceArtifactSupersessionBehavior = "lifecycle_state_superseded";

/**
 * The export-eligibility RULE this contract defines. As of PR 4A this is a
 * declared target, not yet an enforced gate — no live render/export route
 * checks governance stage today (see ADR-0015's route-layer finding). Wiring
 * this into route enforcement is PR 4C's scope.
 */
export interface SourceArtifactExportEligibility {
  /** Client-facing artifacts require this governance stage or later before export. */
  clientFacingMinimumGovernanceStage:
    | "approved_for_external_use"
    | "client_final";
  /** Internal-only (clientFacing=false) artifacts may export as working drafts. */
  internalMinimumGovernanceStage: "ai_draft";
}

/**
 * Finality is a stronger claim than "exportable" — decision/selection-stage
 * artifacts additionally require named sibling artifacts to already be
 * accepted (contract rule: "Decision artifacts must not claim finality
 * before the event and artifact acceptance conditions are met"). Empty
 * `requiresSiblingArtifactsAccepted` means this artifact type has no
 * finality precondition beyond its own governance stage.
 */
export interface SourceArtifactFinalityConditions {
  requiresGovernanceStageAtLeast: "approved_for_external_use" | "client_final";
  requiresSiblingArtifactsAccepted: string[];
}

/**
 * Tenant/event isolation posture for this artifact's persisted rows. Named
 * honestly per ADR-0014's finding: only `source_vendor_proposal_facts`/
 * `source_vendor_proposal_fact_reviews` have real, live-traffic-enforced RLS
 * today (via tenant-scoped-session.ts). Every d-code artifact in this
 * registry relies on `standard_application_layer_tenant_scoping` — ordinary
 * `client_id`/`tenant_key`-filtered queries through postgresCompat, RLS
 * enabled but decorative for live traffic, same gap ADR-0014 named as a
 * real, separate, larger follow-up. This contract does not silently upgrade
 * that claim.
 */
export type SourceArtifactTenantIsolationPosture =
  | "standard_application_layer_tenant_scoping"
  | "rls_enforced_tenant_scoped_session";

export interface SourceArtifactContract {
  /** Stable identifier, e.g. `d09_rfp_pack`. Registry key. */
  code: string;
  /** Human display name (source-artifact-profiles.ts's humanTitle, falling back to artifact-specs.ts's name). */
  displayName: string;
  /** The stage this artifact belongs to (canonical-specs/artifact-specs.ts). */
  sourcingStage: SourceStageKey;
  /** Every stage at or after `sourcingStage` — generation is not blocked again once eligible. */
  allowedGenerationStages: SourceStageKey[];
  /** Equal to `sourcingStage` — named separately because it is the field the contract rule references directly. */
  earliestEligibleStage: SourceStageKey;
  /** Artifact codes that must exist in an accepted authoritative state before this artifact may generate. */
  requiredUpstreamArtifacts: string[];
  /** Artifact codes that enrich generation if present but never block it. */
  optionalUpstreamArtifacts: string[];
  /**
   * Structural evidence the generated body must contain
   * (source-artifact-profiles.ts's requiredExhibits) plus how evidence is
   * meant to be surfaced in the rendered document (evidenceMode).
   */
  requiredEvidenceClasses: string[];
  evidenceMode: EvidenceMode;
  /** True once the artifact's own stage is at or after `rfp` — vendor engagement has begun. */
  requiresVendorEventContext: boolean;
  generationModes: SourceArtifactGenerationMode[];
  reviewRequirement: SourceArtifactReviewRequirement;
  acceptanceAuthority: SourceArtifactAcceptanceAuthority;
  authoritativeUseMechanism: SourceArtifactAuthoritativeUseMechanism;
  supersessionBehavior: SourceArtifactSupersessionBehavior;
  exportEligibility: SourceArtifactExportEligibility;
  /** [defaultFormat, ...secondaryFormats] from source-artifact-profiles.ts. */
  permittedOutputFormats: DefaultFormat[];
  /** Audience + clientFacing — the two governance-banner inputs artifact-governance.ts's sourceArtifactGovernanceBanner() already consumes. */
  governanceBannerAudience: ArtifactAudience | ArtifactAudience[];
  governanceBannerClientFacing: boolean;
  /**
   * Named consumer contexts this artifact type is eligible to feed. Every
   * d-code artifact currently reaches both — neither context filters by
   * artifact type today (see ADR-0015's context-binder finding); this field
   * names the intended scope for PR 4C to enforce, not a claim that
   * filtering already happens.
   */
  downstreamConsumers: Array<"generation_context_binder" | "ava_qa_context">;
  /** `consulting_grade` for the 5 SOURCE_CONSULTING_GRADE_GATE_CODES, `default` otherwise — Source has no other real per-artifact quality-bar overrides today. */
  qualityBarProfile: "consulting_grade" | "default";
  finalityConditions: SourceArtifactFinalityConditions | null;
  tenantIsolationPosture: SourceArtifactTenantIsolationPosture;
  /** True if a missing artifact of this type blocks stage-gate promotion (artifact-specs.ts's gateDefining). */
  gateDefining: boolean;
  /** artifact-specs.ts's requirementLevel. */
  requirementLevel: "required" | "recommended" | "optional";
  /** artifact-registry/types.ts's SourceArtifactFamily this code belongs to. */
  family: SourceArtifactFamily;
}
