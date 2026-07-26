// Builds SOURCE_ARTIFACT_CONTRACTS by joining the three pre-existing
// per-artifact registries — see types.ts's header comment for why this is a
// join, not a fourth hand-authored table.
//
// Fails loudly (throws at module load) if the three registries disagree on
// which codes exist — the exact "no cross-validation between registries"
// gap ADR-0015 named. A silently-missing entry in any one registry would
// previously just mean that registry's field was unavailable for that code;
// here it is a startup error instead.

import {
  SOURCE_ARTIFACT_SPECS,
  type SourceArtifactSpec,
} from "@/lib/source/canonical-specs/artifact-specs";
import { getPromptTemplate } from "@/lib/source/agent-generation/prompt-registry";
import { getSourceArtifactProfile } from "@/lib/source/documentation-standards/source-artifact-profiles";
import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import { SOURCE_CONSULTING_GRADE_GATE_CODES } from "@/lib/source/agent-generation/quality-review";
import type { SourceStageKey } from "@/lib/source/types";
import type { DefaultFormat } from "@/lib/source/documentation-standards/source-artifact-profiles";
import type { SourceArtifactContract } from "./types";

/** Mirrors prompt-registry.ts's private shortPromptProfileCode() — the
 * established convention for mapping a full code (`d09_rfp_pack`) to the
 * short id source-artifact-profiles.ts keys its map by (`d09`). */
function shortProfileCode(artifactCode: string): string {
  return artifactCode.split("_")[0] ?? artifactCode;
}

// Stages at or after RFP involve vendor engagement.
const RFP_STAGE_INDEX = SOURCE_STAGE_ORDER.indexOf("rfp");
// Stages that produce a decision or a final selection — finality-bearing.
const DECISION_STAGES: SourceStageKey[] = ["executive_decision", "selection"];

function allowedGenerationStages(from: SourceStageKey): SourceStageKey[] {
  const index = SOURCE_STAGE_ORDER.indexOf(from);
  if (index < 0) {
    throw new Error(
      `source-artifact-contract: stage "${from}" is not a canonical SourceStageKey`,
    );
  }
  return SOURCE_STAGE_ORDER.slice(index);
}

function buildOne(spec: SourceArtifactSpec): SourceArtifactContract {
  const template = getPromptTemplate(spec.code);
  if (!template) {
    throw new Error(
      `source-artifact-contract: "${spec.code}" is declared in canonical-specs/artifact-specs.ts but has no prompt-registry.ts template — the three source registries have drifted out of sync.`,
    );
  }
  const profile = getSourceArtifactProfile(shortProfileCode(spec.code));
  if (!profile) {
    throw new Error(
      `source-artifact-contract: "${spec.code}" is declared in canonical-specs/artifact-specs.ts but has no source-artifact-profiles.ts entry (looked up as "${shortProfileCode(spec.code)}") — the three source registries have drifted out of sync.`,
    );
  }

  const stageIndex = SOURCE_STAGE_ORDER.indexOf(spec.stage);
  const permittedOutputFormats: DefaultFormat[] = [
    profile.defaultFormat,
    ...(profile.secondaryFormats ?? []),
  ];

  const isConsultingGrade = SOURCE_CONSULTING_GRADE_GATE_CODES.has(spec.code);

  return {
    code: spec.code,
    displayName: profile.humanTitle || spec.name,
    sourcingStage: spec.stage,
    allowedGenerationStages: allowedGenerationStages(spec.stage),
    earliestEligibleStage: spec.stage,
    requiredUpstreamArtifacts: template.upstreamRequired,
    optionalUpstreamArtifacts: template.upstreamOptional,
    requiredEvidenceClasses: profile.requiredExhibits,
    evidenceMode: profile.evidenceMode,
    requiresVendorEventContext: stageIndex >= RFP_STAGE_INDEX,
    // Both live generation routes (AI generate, chat-save) can produce a
    // body for any code today — see ADR-0015's route-layer finding. This
    // field names the intended future per-artifact restriction; it does
    // not itself claim one is enforced yet.
    generationModes: ["ai_generated", "chat_authored"],
    reviewRequirement: isConsultingGrade
      ? "consulting_grade_review_required"
      : spec.gateDefining
        ? "standard_review_required"
        : "review_recommended",
    // Every artifact-accept route uses the same flat capability today
    // (source-access-policy.ts has no per-artifact/per-stage authority) —
    // see ADR-0015's authority finding. Not per-artifact modeling yet.
    acceptanceAuthority: "canApproveSourceStages",
    // Every d-code artifact resolves through the general slot mechanism
    // (client-final-artifacts.ts) — VendorProposalFact's binary
    // accepted-only mechanism is a distinct type this registry never emits,
    // named in types.ts for future unification.
    authoritativeUseMechanism: "client_final_artifact_slots",
    supersessionBehavior: "lifecycle_state_superseded",
    exportEligibility: {
      clientFacingMinimumGovernanceStage: "approved_for_external_use",
      internalMinimumGovernanceStage: "ai_draft",
    },
    permittedOutputFormats,
    governanceBannerAudience: profile.audience,
    governanceBannerClientFacing: profile.clientFacing,
    // Neither consumer context filters by artifact type today — see
    // ADR-0015's context-binder finding (collectUpstreamBodies has no
    // authority filter at all; resolveAuthoritativeArtifactSlots is
    // artifact-type-agnostic). Naming the intended scope, not a claim of
    // enforcement.
    downstreamConsumers: ["generation_context_binder", "ava_qa_context"],
    qualityBarProfile: isConsultingGrade ? "consulting_grade" : "default",
    finalityConditions: DECISION_STAGES.includes(spec.stage)
      ? {
          requiresGovernanceStageAtLeast: "approved_for_external_use",
          requiresSiblingArtifactsAccepted: siblingFinalityRequirements(
            spec.code,
          ),
        }
      : null,
    tenantIsolationPosture: "standard_application_layer_tenant_scoping",
    gateDefining: spec.gateDefining,
    requirementLevel: spec.requirementLevel,
    family: spec.family,
  };
}

/**
 * Named finality preconditions for the handful of codes that make a
 * decision/selection claim — matches the contract rule "Decision artifacts
 * must not claim finality before the event and artifact acceptance
 * conditions are met." d24/d27 explicitly require the governance sign-off
 * record (d26) to already be accepted; every other decision/selection-stage
 * artifact has no sibling precondition beyond its own governance stage.
 */
function siblingFinalityRequirements(code: string): string[] {
  if (code === "d24_decision_brief" || code === "d27_selection_memo") {
    return ["d26_steward_signoff"];
  }
  return [];
}

function buildRegistry(): ReadonlyMap<string, SourceArtifactContract> {
  const entries = SOURCE_ARTIFACT_SPECS.map(
    (spec) => [spec.code, buildOne(spec)] as const,
  );
  const seen = new Set<string>();
  for (const [code] of entries) {
    if (seen.has(code)) {
      throw new Error(
        `source-artifact-contract: duplicate artifact code "${code}" in canonical-specs/artifact-specs.ts`,
      );
    }
    seen.add(code);
  }
  return new Map(entries);
}

export const SOURCE_ARTIFACT_CONTRACT_REGISTRY: ReadonlyMap<
  string,
  SourceArtifactContract
> = buildRegistry();
