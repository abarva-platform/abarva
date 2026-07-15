import type {
  ContextPack,
  HomeKnowledgePack,
  IntelligenceContextPack,
  ModuleContextScope,
  ModuleContextResponse,
  MovesContextPack,
  SourceContextPack,
  TowerContextPack,
} from "../contracts";
import { buildClaudeReadyPayload } from "./claude-ready-payload-builder";
import {
  buildCanonicalFacts,
  buildEntityProfiles,
} from "./entity-profile-builder";
import { buildEvidenceRefs, summarizeEvidence } from "./evidence-summary-builder";
import {
  buildConfidenceSummary,
  buildContextGaps,
  unsupportedClaimsForRequest,
} from "./gap-confidence-builder";
import type { ContextAssemblyInput } from "./fixture-input";
import { buildRelationshipSlice } from "./relationship-slice-builder";
import { buildTowerContextPackFields } from "./tower-context-pack-builder";

export function assembleModuleContext(
  input: ContextAssemblyInput,
): ModuleContextResponse {
  const evidenceRefs = buildEvidenceRefs(input);
  const gaps = buildContextGaps(input);
  const facts = buildCanonicalFacts(input, evidenceRefs);
  const profiles = buildEntityProfiles(input, facts, evidenceRefs, gaps);
  const relationshipCandidates = buildRelationshipSlice(input, profiles, evidenceRefs);
  const unsupportedClaims = unsupportedClaimsForRequest(input);
  const confidenceSummary = buildConfidenceSummary(input);
  const mode = input.request.mode ?? "active";
  const moduleGuidance = input.blueprint.moduleGuidance[input.request.moduleKey];
  const includedProfiles =
    mode === "active"
      ? profiles.filter((profile) => profile.truthStatus !== "candidate")
      : profiles;
  const excludedCandidateOnlyContext =
    mode === "active"
      ? profiles.filter((profile) => profile.truthStatus === "candidate")
      : [];
  const packDraft = {
    contextPackId: `${input.blueprint.catalogKey}-${input.request.moduleKey}-assembler-pack`,
    tenantKey: input.blueprint.tenantKey,
    moduleKey: input.request.moduleKey,
    purpose: input.request.purpose,
    mode,
    truthStatus: "synthetic_review" as const,
    executiveSummary: `${input.blueprint.contextTitle} context assembled for ${input.request.moduleKey} (${input.intent.archetypeKey}): ${summarizeEvidence(evidenceRefs)}`,
    relevantEntityProfiles: includedProfiles,
    facts,
    relationships: [],
    relationshipCandidates,
    metrics: facts.filter((fact) => fact.predicate === "metric"),
    risks: profiles.filter((profile) => profile.entityType === "risk"),
    evidence: evidenceRefs,
    gaps,
    confidenceSummary,
    caveats: [
      "Dry-run assembler output.",
      "Synthetic semantic proof context is not active tenant truth.",
      ...(moduleGuidance ? [moduleGuidance] : []),
    ],
    excludedCandidateOnlyContext,
    unsupportedClaims,
    recommendedNextEvidence: [
      "source-owner attestation",
      "measured baseline extract",
      "relationship validation",
      "operator promotion review",
    ],
    assemblyTrace: {
      assemblerVersion: "knowledge-layer-design-pr2",
      generatedAt: input.generatedAt,
      inputSources: input.inputSources,
      includedEntityIds: includedProfiles.map((profile) => profile.profileId),
      excludedEntityIds: excludedCandidateOnlyContext.map((profile) => profile.profileId),
      includedEvidenceIds: evidenceRefs.map((ref) => ref.evidenceId),
      excludedEvidenceIds: [],
      ruleHits: [
        "shared-context-pack-assembler",
        "active-context-default-preserved",
        "unsupported-claims-held-out-of-claude-payload",
        "relationship-candidates-preserved-as-candidates",
        "audit-only-diagnostics-excluded-from-claude-payload",
        `intent-archetype:${input.intent.archetypeKey}`,
        `module-intent:${input.intent.moduleIntent}`,
      ],
    },
    truthBoundary: {
      activeTenantContextDefault: true,
      candidatePreviewExplicitlyRequested: mode === "candidate_preview",
      candidateContextIncluded: mode === "candidate_preview",
      sourceAdapterRowsActive: false,
      activeTenantAccessUpdated: false,
      productionTenantDataWritten: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
    },
  } satisfies Omit<ContextPack, "claudeReadyContextPayload">;

  const contextPack = attachModuleShape({
    ...packDraft,
    claudeReadyContextPayload: buildClaudeReadyPayload(input.request, packDraft),
  }, input.request.scope?.phase);

  return {
    requestId: `${contextPack.contextPackId}-response`,
    generatedAt: input.generatedAt,
    contextPack,
    explanation: {
      summary: contextPack.executiveSummary,
      strengths: [
        "Entity profiles preserve semantic context.",
        "Relationship semantics are kept as relationship candidates.",
        "Unsupported claims are listed but not model-visible facts.",
      ],
      limitations: contextPack.caveats,
      supportedQuestions: [
        "What context exists for this module and interpreted intent?",
        "Which entities, evidence, relationships, gaps, and risks are relevant?",
      ],
      unsupportedQuestions: contextPack.unsupportedClaims.map((claim) => claim.description),
      nextActions: contextPack.recommendedNextEvidence,
    },
    claudeReadyPayload: contextPack.claudeReadyContextPayload,
  };
}

function attachModuleShape(
  pack: ContextPack,
  requestedPhase?: ModuleContextScope["phase"],
): ContextPack {
  if (pack.moduleKey === "home") {
    return {
      ...pack,
      moduleKey: "home",
      supportsDoubleClickProfiles: true,
    } as HomeKnowledgePack;
  }
  if (pack.moduleKey === "intelligence") {
    return {
      ...pack,
      moduleKey: "intelligence",
      boardQualityContextRequired: true,
    } as IntelligenceContextPack;
  }
  if (pack.moduleKey === "moves") {
    return {
      ...pack,
      moduleKey: "moves",
      phase: movesPhaseLabel(requestedPhase),
    } as MovesContextPack;
  }
  if (pack.moduleKey === "source") {
    return {
      ...pack,
      moduleKey: "source",
      sourcingScopeIncluded: true,
    } as SourceContextPack;
  }
  if (pack.moduleKey === "tower") {
    return {
      ...pack,
      moduleKey: "tower",
      ...buildTowerContextPackFields(pack),
    } as TowerContextPack;
  }
  return pack;
}

function movesPhaseLabel(
  phase: ModuleContextScope["phase"] | undefined,
): MovesContextPack["phase"] {
  switch (phase) {
    case "P0":
      return "P0 Intake & Decision Framing";
    case "P1":
      return "P1 Charter & Baseline";
    case "P2":
      return "P2 Diagnose & Evidence Pressure-Test";
    case "P3":
      return "P3 Options & Business Case";
    case "P4":
      return "P4 Executive Decision & Commit";
    case "P5":
      return "P5 Execution Handoff";
    default:
      return "P2 Diagnose & Evidence Pressure-Test";
  }
}
