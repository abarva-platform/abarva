// Runtime schema for SourceArtifactContract — validates the composed
// registry (build-registry.ts) against the same shape types.ts declares at
// compile time, so a future hand-edit to the composition logic that
// produces a structurally invalid contract fails a test, not a silent
// runtime surprise downstream.

import { z } from "zod";
import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";

const StageKeySchema = z.enum(
  SOURCE_STAGE_ORDER as [string, ...string[]],
);

const GenerationModeSchema = z.enum(["ai_generated", "chat_authored"]);

const ReviewRequirementSchema = z.enum([
  "consulting_grade_review_required",
  "standard_review_required",
  "review_recommended",
]);

const AcceptanceAuthoritySchema = z.literal("canApproveSourceStages");

const AuthoritativeUseMechanismSchema = z.enum([
  "client_final_artifact_slots",
  "vendor_proposal_fact_accepted_only",
]);

const SupersessionBehaviorSchema = z.literal("lifecycle_state_superseded");

const GovernanceStageSchema = z.enum([
  "ai_draft",
  "human_review",
  "approved_for_external_use",
  "client_final",
]);

const ExportEligibilitySchema = z.object({
  clientFacingMinimumGovernanceStage: z.enum([
    "approved_for_external_use",
    "client_final",
  ]),
  internalMinimumGovernanceStage: z.literal("ai_draft"),
});

const FinalityConditionsSchema = z
  .object({
    requiresGovernanceStageAtLeast: z.enum([
      "approved_for_external_use",
      "client_final",
    ]),
    requiresSiblingArtifactsAccepted: z.array(z.string().min(1)),
  })
  .nullable();

const TenantIsolationPostureSchema = z.enum([
  "standard_application_layer_tenant_scoping",
  "rls_enforced_tenant_scoped_session",
]);

const DownstreamConsumerSchema = z.enum([
  "generation_context_binder",
  "ava_qa_context",
]);

export const SourceArtifactContractSchema = z
  .object({
    code: z.string().min(1),
    displayName: z.string().min(1),
    sourcingStage: StageKeySchema,
    allowedGenerationStages: z.array(StageKeySchema).min(1),
    earliestEligibleStage: StageKeySchema,
    requiredUpstreamArtifacts: z.array(z.string().min(1)),
    optionalUpstreamArtifacts: z.array(z.string().min(1)),
    requiredEvidenceClasses: z.array(z.string()),
    evidenceMode: z.enum([
      "none",
      "basis_only",
      "caption_level",
      "appendix_only",
      "drilldown",
    ]),
    requiresVendorEventContext: z.boolean(),
    generationModes: z.array(GenerationModeSchema).min(1),
    reviewRequirement: ReviewRequirementSchema,
    acceptanceAuthority: AcceptanceAuthoritySchema,
    authoritativeUseMechanism: AuthoritativeUseMechanismSchema,
    supersessionBehavior: SupersessionBehaviorSchema,
    exportEligibility: ExportEligibilitySchema,
    permittedOutputFormats: z
      .array(z.enum(["docx", "pptx", "html", "xlsx"]))
      .min(1),
    governanceBannerAudience: z.union([
      z.string(),
      z.array(z.string()).min(1),
    ]),
    governanceBannerClientFacing: z.boolean(),
    downstreamConsumers: z.array(DownstreamConsumerSchema).min(1),
    qualityBarProfile: z.enum(["consulting_grade", "default"]),
    finalityConditions: FinalityConditionsSchema,
    tenantIsolationPosture: TenantIsolationPostureSchema,
    gateDefining: z.boolean(),
    requirementLevel: z.enum(["required", "recommended", "optional"]),
    family: z.string().min(1),
  })
  .refine((c) => c.earliestEligibleStage === c.sourcingStage, {
    message: "earliestEligibleStage must equal sourcingStage",
  })
  .refine((c) => c.allowedGenerationStages[0] === c.sourcingStage, {
    message: "allowedGenerationStages must start at sourcingStage",
  })
  .refine((c) => !c.requiredUpstreamArtifacts.includes(c.code), {
    message: "an artifact cannot require itself as upstream",
  });

export { GovernanceStageSchema };
