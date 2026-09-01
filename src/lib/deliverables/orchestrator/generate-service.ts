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
import { buildGroundedArchitectureFallback } from "@/lib/visual-system/architecture-fallback";
import { governedArchitectureToolCall } from "@/lib/deliverables/quality/architecture-egress-adapter";
import {
  generateDeliverablePlan,
  type DeliverablePlanGenRequest,
} from "@/lib/deliverables/planning/deliverable-plan-generation";
import type { DeliverablePlan } from "@/lib/deliverables/planning/deliverable-plan";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import type { GenerationProgress } from "./progress";
import type { DeliverableArtifactBrief, OutputFormat } from "./types";
import type { AdaptiveDepthDecision } from "@/lib/deliverables/adaptive-depth";
import { getArtifactBrief } from "./artifact-brief-registry";
import { adaptArtifactBriefForDepth } from "@/lib/deliverables/adaptive-depth";
import { buildPassPrompt } from "./prompt-builder";
import { resolveContextBudget } from "./context-budget";
import {
  withCitedEvidence,
  type ContextCoverage,
} from "./context-coverage";

export interface GenerateDeliverableServiceInput extends Omit<
  BuildRequestParams,
  "outputFormats"
> {
  tenantClientKey: string;
  clientId: string;
  userId: string;
  /** the move / source-event id this deliverable is generated for. */
  sourceArtifactRef: string;
  /** Canonical deliverables_v2 registry key, when different from the orchestrator type. */
  deliverableTypeKey?: string;
  /** semantic query used to retrieve governed evidence. */
  evidenceQuery?: string;
  /** Human-approved P3 option. Required by P3 architecture assembly. */
  approvedSolutionApproach?: string;
  decisionLineage?: {
    decisionHash: string;
    decisionVersion: string;
    approvedOptionId: string;
    approvedOptionVersion: string;
    contextSnapshotHash: string;
    architectureModelVersion: string;
  };
  outputFormats?: OutputFormat[];
  adaptiveDepth?: AdaptiveDepthDecision;
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
  contextCoverage?: ContextCoverage;
  blockedReason?: string;
}

export interface GenerateServiceDeps {
  assemble?: typeof assembleGovernedEvidence;
  loadPolicy?: typeof defaultLoadPolicy;
  generate?: typeof defaultGenerate;
  persist?: typeof defaultPersist;
  /** Reason-first deliverable plan generation. Injectable for tests. */
  generatePlan?: (
    req: DeliverablePlanGenRequest,
  ) => Promise<{ plan: DeliverablePlan }>;
  /** Architecture model generation — defaults to the governed adapter. Injectable for tests. */
  generateArchitecture?: (req: {
    engagement: string;
    client: string;
    contextText: string;
    model?: string;
  }) => Promise<{ model: ArchitectureModel }>;
}

function normalizeQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildSectionDrivenEvidenceQueries(
  input: Pick<
    GenerateDeliverableServiceInput,
    "deliverableType" | "useCaseArchetype" | "evidenceQuery"
  >,
  brief: DeliverableArtifactBrief,
): string[] {
  if (input.evidenceQuery?.trim()) return [normalizeQuery(input.evidenceQuery)];

  const prefix = `${input.deliverableType} ${input.useCaseArchetype}`;
  const rawQueries: string[] = brief.recommendedStructure.map((section) =>
    normalizeQuery(
      [
        prefix,
        section.title,
        section.intent,
        section.expectedEvidenceFamilies.join(" "),
      ]
        .filter(Boolean)
        .join(" "),
    ),
  );

  for (const exhibit of brief.expectedExhibits) {
    rawQueries.push(
      normalizeQuery(
        [
          prefix,
          "expected exhibit",
          exhibit.title,
          exhibit.kind,
          exhibit.purpose,
          exhibit.requiredElements?.join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
  }
  for (const table of brief.expectedTables) {
    rawQueries.push(
      normalizeQuery(
        [
          prefix,
          "expected table",
          table.title,
          table.columns.join(" "),
          table.groundingMode,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
  }

  const seen = new Set<string>();
  const queries = rawQueries.filter((query) => {
    if (!query) return false;
    const key = query.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return queries.length > 0
    ? queries
    : [normalizeQuery(`${prefix} current state baseline`)];
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

  const preliminaryReq = buildDeliverableRequest(
    {
      module: input.module,
      useCaseArchetype: input.useCaseArchetype,
      deliverableType: input.deliverableType,
      audience: input.audience,
      decisionContext: input.decisionContext,
      clientDisplayName: input.clientDisplayName,
      initiativeDisplayName: input.initiativeDisplayName,
      outputFormats: input.outputFormats,
      adaptiveDepth: input.adaptiveDepth,
    },
    [],
    [],
  );
  const preliminaryBrief = adaptArtifactBriefForDepth(
    preliminaryReq,
    getArtifactBrief(preliminaryReq),
  );
  const fixedPrompt = buildPassPrompt("architect", {
    req: preliminaryReq,
    brief: preliminaryBrief,
    evidence: [],
  });
  const contextBudget = resolveContextBudget({
    fixedOverheadText: `${fixedPrompt.system}\n\n${fixedPrompt.user}`,
  });
  const evidenceQueries = buildSectionDrivenEvidenceQueries(
    input,
    preliminaryBrief,
  );

  // 1 · governed evidence (clean, citation-numbered, vendor-facing exclusion applied)
  const { evidence, sourceRegister, retrievedCount, coverage } = await assemble({
    tenantClientKey: input.tenantClientKey,
    clientId: input.clientId,
    sourceArtifactRef: input.sourceArtifactRef,
    query: evidenceQueries[0],
    queries: evidenceQueries,
    audienceIsVendorFacing,
    contextBudget,
  });
  const coverageWarnings =
    coverage.approvedAvailable > 0 && coverage.packed === 0
      ? [
          `context_coverage_empty: ${coverage.approvedAvailable} approved evidence item(s) existed for this Move, but 0 were packed into the prompt.`,
        ]
      : [];

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
      adaptiveDepth: input.adaptiveDepth,
    },
    evidence,
    sourceRegister,
  );
  const deliverableKey = deliverableKeyForOrchestratorType(
    input.deliverableType,
  );
  const wantsArchitecture =
    !!deliverableKey &&
    DELIVERABLE_PROFILES[deliverableKey].renderer === "html_architecture";
  // Target Architecture's quality contract requires a rendered current state,
  // gap-to-target bridge, and conceptual/logical/physical architecture levels.
  // A prose-only path can never satisfy that contract, so the structured model
  // is part of the artifact contract rather than an optional tenant preview.
  const structuredArchitectureRequired =
    deliverableKey === "target_state_architecture";
  const structuredExhibitsEnabled =
    wantsArchitecture &&
    (structuredArchitectureRequired ||
      isFeatureEnabled(
        { clientKey: input.tenantClientKey },
        "deliverable_structured_exhibits",
      ));

  let deliverablePlan: DeliverablePlan | undefined;
  if (structuredExhibitsEnabled && deliverableKey) {
    try {
      const contextText = [
        input.approvedSolutionApproach,
        `Decision context: ${input.decisionContext}`,
        ...evidence.map(
          (e) =>
            `[${e.citationNumber}] ${e.label} (${e.evidenceFamily}, ${e.confidence}): ${e.statement}`,
        ),
      ]
        .join("\n")
        .slice(0, 24000);
      const genPlan =
        deps.generatePlan ??
        ((req) => generateDeliverablePlan(req, governedArchitectureToolCall));
      const gen = await genPlan({
        artifactType: deliverableKey,
        audience: req.audience.join(", "),
        decisionPurpose: DELIVERABLE_PROFILES[deliverableKey].decisionPurpose,
        client: input.clientDisplayName,
        initiative: input.initiativeDisplayName,
        contextText,
        requireGapChain:
          DELIVERABLE_PROFILES[deliverableKey].gapAnalysisRequired === true,
        ...(input.model ? { model: input.model } : {}),
      });
      deliverablePlan = gen.plan;
    } catch (err) {
      console.error(
        "[generate-service] deliverable plan generation failed; structured exhibit plan unavailable",
        err,
      );
      if (structuredArchitectureRequired) {
        return {
          ok: false,
          qualityPass: false,
          blockers: [
            "Structured Architecture Brief could not be assembled and validated.",
          ],
          blockedReason: `architecture_brief_incomplete: ${err instanceof Error ? err.message : String(err)}`,
          retrievedEvidence: retrievedCount,
          contextCoverage: coverage,
        };
      }
    }
  }

  // Target Architecture is assembled from the validated brief before narrative drafting.
  // The visible document explains the structured model; it does not invent the model from prose.
  let structuredModels:
    | {
        architectureModel?: ArchitectureModel;
        structuredArchitectureBrief?: DeliverablePlan;
      }
    | undefined;
  if (structuredArchitectureRequired) {
    const planContext = deliverablePlan
      ? `Structured Architecture Brief:\n${JSON.stringify(deliverablePlan)}\n\n`
      : "";
    const contextText = [
      input.approvedSolutionApproach,
      planContext,
      ...evidence.map(
        (e) =>
          `[${e.citationNumber}] ${e.label} (${e.evidenceFamily}, ${e.confidence}): ${e.statement}`,
      ),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 32000);
    try {
      const genArch =
        deps.generateArchitecture ??
        ((request) =>
          generateArchitectureModel(request, governedArchitectureToolCall));
      const generated = await genArch({
        engagement: input.initiativeDisplayName,
        client: input.clientDisplayName,
        contextText,
        ...(input.model ? { model: input.model } : {}),
      });
      structuredModels = {
        architectureModel: generated.model,
        structuredArchitectureBrief: deliverablePlan,
      };
      req.decisionContext = [
        req.decisionContext,
        planContext,
        `VALIDATED ARCHITECTURE MODEL - NARRATE WITHOUT CHANGING ITS DECISIONS:\n${JSON.stringify(generated.model)}`,
      ]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 48000);
    } catch (err) {
      return {
        ok: false,
        qualityPass: false,
        blockers: [
          "Target Architecture assembly failed structured-model validation.",
        ],
        blockedReason: `architecture_assembly_failed: ${err instanceof Error ? err.message : String(err)}`,
        retrievedEvidence: retrievedCount,
        contextCoverage: coverage,
      };
    }
  }

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
    const finalCoverage = withCitedEvidence(coverage, result.document);
    return {
      ok: false,
      qualityPass: result.quality?.pass ?? false,
      blockers: result.quality?.blockers ?? [],
      blockedReason: result.blockedReason,
      sectionCount: result.document?.generatedSections.length,
      retrievedEvidence: retrievedCount,
      contextCoverage: finalCoverage,
      warnings: [...coverageWarnings, ...(result.quality?.warnings ?? [])],
    };
  }
  const finalCoverage = withCitedEvidence(coverage, result.document);

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
  if (structuredExhibitsEnabled && !structuredArchitectureRequired) {
    const contextText = result.document.generatedSections
      .map((s) => `## ${s.title}\n${s.bodyMarkdown}`)
      .join("\n\n")
      .slice(0, 24000);
    const planContext = deliverablePlan
      ? `Reason-first DeliverablePlan:\n${JSON.stringify(deliverablePlan)}\n\n`
      : "";
    try {
      const genArch =
        deps.generateArchitecture ??
        ((req) => generateArchitectureModel(req, governedArchitectureToolCall));
      const gen = await genArch({
        engagement: result.document.initiativeDisplayName,
        client: result.document.clientDisplayName,
        contextText:
          `${input.approvedSolutionApproach ?? ""}\n\n${planContext}${contextText}`.slice(
            0,
            32000,
          ),
        ...(input.model ? { model: input.model } : {}),
      });
      structuredModels = { architectureModel: gen.model };
    } catch (err) {
      console.error(
        "[generate-service] architecture model generation failed; using grounded architecture fallback",
        err,
      );
      structuredModels = {
        architectureModel: buildGroundedArchitectureFallback({
          engagement: result.document.initiativeDisplayName,
          client: result.document.clientDisplayName,
          contextText:
            `${input.approvedSolutionApproach ?? ""}\n\n${planContext}${contextText}`.slice(
              0,
              32000,
            ),
          ...(deliverablePlan ? { plan: deliverablePlan } : {}),
          failureReason: err instanceof Error ? err.message : String(err),
        }),
      };
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
    isFeatureEnabled(
      { clientKey: input.tenantClientKey },
      "moves_decision_storytelling",
    );
  const record = await persist(result, {
    clientId: input.clientId,
    renderedBy: input.userId,
    sourceArtifactRef: input.sourceArtifactRef,
    ...(input.deliverableTypeKey
      ? { deliverableTypeKey: input.deliverableTypeKey }
      : {}),
    tenantPolicy: policy,
    ...(explicitOverride ? { outputFormat: explicitOverride } : {}),
    userId: input.userId,
    evidenceLedgerIds: evidence.map((e) => e.provenanceRef),
    ...(renderAsDeck
      ? { renderAsDeck: true, tenantKey: input.tenantClientKey }
      : {}),
    // Stage 4-7: hand the structured exhibit models to persistence so the profile's
    // renderer draws them and they count toward exhibit enforcement.
    ...(structuredModels ? { structuredModels, renderViaProfile: true } : {}),
    ...(input.decisionLineage
      ? { generationLineage: input.decisionLineage }
      : {}),
    enforceQualityContract,
    governanceOk: true, // the multi-pass generation already cleared audited egress
    tenantTerms: [
      result.document.clientDisplayName,
      result.document.initiativeDisplayName,
    ],
  });

  if (record.quarantineReason) {
    return {
      ok: false,
      artifactId: record.id,
      blobUrl: record.blobUrl,
      qualityPass: false,
      blockers: [record.quarantineReason],
      blockedReason: `quality gate blocked export: ${record.quarantineReason}`,
      warnings: [...coverageWarnings, ...(result.quality?.warnings ?? [])],
      sectionCount: result.document.generatedSections.length,
      retrievedEvidence: retrievedCount,
      contextCoverage: finalCoverage,
    };
  }

  return {
    ok: true,
    artifactId: record.id,
    blobUrl: record.blobUrl,
    qualityPass: true,
    warnings: [...coverageWarnings, ...(result.quality?.warnings ?? [])],
    sectionCount: result.document.generatedSections.length,
    retrievedEvidence: retrievedCount,
    contextCoverage: finalCoverage,
  };
}
