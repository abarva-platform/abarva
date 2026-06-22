// Generate-deliverable service — the in-product entry point.
//
// Ties together: governed-evidence assembly → request build → audited multi-pass
// generation → quality gate → persistence. The route is a thin wrapper over this.
// Heavy collaborators are injectable so the service is testable without Azure/Claude/DB.

import "server-only";

import { loadTenantAiPolicyRecord as defaultLoadPolicy } from "@/lib/integrations/ai-egress/tenant-policy";
import { assembleGovernedEvidence } from "./evidence-assembler";
import {
  buildDeliverableRequest,
  type BuildRequestParams,
} from "./build-request";
import { generateDeliverable as defaultGenerate } from "./model-caller";
import { persistDeliverable as defaultPersist } from "./persistence";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { generateArchitectureModel } from "@/lib/visual-system/architecture-generation";
import type { ArchitectureModel } from "@/lib/visual-system/architecture-model";
import { governedArchitectureToolCall } from "@/lib/deliverables/quality/architecture-egress-adapter";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import type { GenerationProgress } from "./progress";
import type { OutputFormat } from "./types";

export interface GenerateDeliverableServiceInput extends Omit<
  BuildRequestParams,
  "outputFormats"
> {
  tenantClientKey: string;
  clientId: string;
  userId: string;
  /** the move / source-event id this deliverable is generated for. */
  sourceArtifactRef: string;
  /** semantic query used to retrieve governed evidence. */
  evidenceQuery?: string;
  outputFormats?: OutputFormat[];
  model?: string;
  /** invoked after each orchestrator pass with a {pct,label} for the live progress band. */
  onProgress?: (p: GenerationProgress) => void;
}

export interface GenerateDeliverableServiceResult {
  ok: boolean;
  artifactId?: string;
  blobUrl?: string;
  qualityPass?: boolean;
  blockers?: string[];
  warnings?: string[];
  sectionCount?: number;
  retrievedEvidence?: number;
  blockedReason?: string;
}

export interface GenerateServiceDeps {
  assemble?: typeof assembleGovernedEvidence;
  loadPolicy?: typeof defaultLoadPolicy;
  generate?: typeof defaultGenerate;
  persist?: typeof defaultPersist;
  /** Architecture model generation — defaults to the governed adapter. Injectable for tests. */
  generateArchitecture?: (req: {
    engagement: string;
    client: string;
    contextText: string;
    model?: string;
  }) => Promise<{ model: ArchitectureModel }>;
}

export async function runDeliverableForTenant(
  input: GenerateDeliverableServiceInput,
  deps: GenerateServiceDeps = {},
): Promise<GenerateDeliverableServiceResult> {
  const assemble = deps.assemble ?? assembleGovernedEvidence;
  const loadPolicy = deps.loadPolicy ?? defaultLoadPolicy;
  const generate = deps.generate ?? defaultGenerate;
  const persist = deps.persist ?? defaultPersist;

  const audienceIsVendorFacing =
    input.audience?.includes("vendor_facing") ?? false;

  // 1 · governed evidence (clean, citation-numbered, vendor-facing exclusion applied)
  const { evidence, sourceRegister, retrievedCount } = await assemble({
    tenantClientKey: input.tenantClientKey,
    clientId: input.clientId,
    sourceArtifactRef: input.sourceArtifactRef,
    query:
      input.evidenceQuery ??
      `${input.deliverableType} ${input.useCaseArchetype} current state baseline`,
    audienceIsVendorFacing,
  });

  // 2 · orchestrator request
  const req = buildDeliverableRequest(
    {
      module: input.module,
      useCaseArchetype: input.useCaseArchetype,
      deliverableType: input.deliverableType,
      audience: input.audience,
      decisionContext: input.decisionContext,
      clientDisplayName: input.clientDisplayName,
      initiativeDisplayName: input.initiativeDisplayName,
      outputFormats: input.outputFormats,
    },
    evidence,
    sourceRegister,
  );

  // 3 · multi-pass generation through the audited egress (plan gate + quality gate inside)
  const result = await generate(
    req,
    {
      // Egress identity must be the client UUID: the audit sink writes tenant_id (uuid),
      // and policy resolution falls back to the raw string when a non-canonical client
      // key (e.g. 'skyharbor' vs tenant_key 'skyharbor-air') doesn't match — which then
      // fails the uuid insert ("invalid input syntax for type uuid"). Class bug, found
      // live by clicking the Generate button (2026-06-11).
      tenantId: input.clientId,
      userId: input.userId,
      ...(input.model ? { model: input.model } : {}),
    },
    input.onProgress ? { onProgress: input.onProgress } : undefined,
  );

  if (!result.ok || !result.document) {
    return {
      ok: false,
      qualityPass: result.quality?.pass ?? false,
      blockers: result.quality?.blockers ?? [],
      blockedReason: result.blockedReason,
      sectionCount: result.document?.generatedSections.length,
      retrievedEvidence: retrievedCount,
    };
  }

  // 4 · persist through the governed artifacts repository. The persisted artifact's
  // PRIMARY format follows the deliverable's prescribed format (resolved inside
  // persistDeliverable from the brief: most → DOCX, financial model → XLSX). We only
  // override here when the caller explicitly requested a presentation/print packaging
  // (pptx/pdf/html) that the prescribed-format resolver does not produce; otherwise we
  // let persistence pick docx/xlsx so the financial model is stored as a real workbook.
  // 3b · structured exhibit generation (flag-gated, stage 4 + 6). For architecture
  // deliverables, generate the ArchitectureModel via the GOVERNED adapter and render
  // the profile's renderer. Tenant-agnostic; grounded in the tenant's own generated
  // narrative. Any failure falls back to prose — generation never breaks.
  let structuredModels: { architectureModel?: ArchitectureModel } | undefined;
  const deliverableKey = deliverableKeyForOrchestratorType(result.brief.deliverableType);
  const wantsArchitecture =
    !!deliverableKey &&
    DELIVERABLE_PROFILES[deliverableKey].renderer === "html_architecture";
  if (
    wantsArchitecture &&
    isFeatureEnabled(
      { clientKey: input.tenantClientKey },
      "deliverable_structured_exhibits",
    )
  ) {
    try {
      const contextText = result.document.generatedSections
        .map((s) => `## ${s.title}\n${s.bodyMarkdown}`)
        .join("\n\n")
        .slice(0, 24000);
      const genArch =
        deps.generateArchitecture ??
        ((req) => generateArchitectureModel(req, governedArchitectureToolCall));
      const gen = await genArch({
        engagement: result.document.initiativeDisplayName,
        client: result.document.clientDisplayName,
        contextText,
        ...(input.model ? { model: input.model } : {}),
      });
      structuredModels = { architectureModel: gen.model };
    } catch (err) {
      console.error(
        "[generate-service] architecture model generation failed; prose fallback",
        err,
      );
    }
  }
  const enforceQualityContract = isFeatureEnabled(
    { clientKey: input.tenantClientKey },
    "deliverable_quality_contract",
  );

  const first = input.outputFormats?.[0];
  const explicitOverride: "pptx" | "pdf" | "html" | undefined =
    first === "pptx" || first === "pdf" || first === "html" ? first : undefined;
  const { policy } = await loadPolicy(input.clientId);
  // Flag-gated decision-storytelling: render Move deliverables as the exhibit-led deck. Skip when
  // the caller forced a presentation format (pptx/pdf) — that explicit request wins.
  const renderAsDeck =
    result.brief.module === "moves" &&
    !explicitOverride &&
    isFeatureEnabled({ clientKey: input.tenantClientKey }, "moves_decision_storytelling");
  const record = await persist(result, {
    clientId: input.clientId,
    renderedBy: input.userId,
    sourceArtifactRef: input.sourceArtifactRef,
    tenantPolicy: policy,
    ...(explicitOverride ? { outputFormat: explicitOverride } : {}),
    userId: input.userId,
    evidenceLedgerIds: evidence.map((e) => e.provenanceRef),
    ...(renderAsDeck ? { renderAsDeck: true, tenantKey: input.tenantClientKey } : {}),
    // Stage 4-7: hand the structured exhibit models to persistence so the profile's
    // renderer draws them and they count toward exhibit enforcement.
    ...(structuredModels ? { structuredModels, renderViaProfile: true } : {}),
    enforceQualityContract,
    governanceOk: true, // the multi-pass generation already cleared audited egress
    tenantTerms: [
      result.document.clientDisplayName,
      result.document.initiativeDisplayName,
    ],
  });

  return {
    ok: true,
    artifactId: record.id,
    blobUrl: record.blobUrl,
    qualityPass: true,
    warnings: result.quality?.warnings ?? [],
    sectionCount: result.document.generatedSections.length,
    retrievedEvidence: retrievedCount,
  };
}
