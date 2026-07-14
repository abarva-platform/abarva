import "server-only";

import { queryTenantContext } from "@/lib/azure-search/tenant-context-retriever";
import type { TenantContextChunk } from "@/lib/azure-search/tenant-context-retriever";
import { findSkyHarborPreviewModule } from "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  recordProgramEvidence,
  type ExtractedProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";

export const MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE =
  "move_context_extract_attached";

export type MoveContextExtractSourceMode =
  | "active_home_context"
  | "active_tenant_access"
  | "candidate_preview";

export type MoveContextExtractItemStatus =
  | "attached_evidence"
  | "suggested_context"
  | "excluded_context"
  | "gap";

export interface MoveContextExtractCandidatePreviewRequest {
  enabled: boolean;
  candidateVersionId?: string;
  acknowledgedNotActiveRuntimeTruth?: boolean;
}

export interface MoveContextExtractInput {
  ctx: TenancyCtx;
  moveId: string;
  tenantKey: string;
  phase: number;
  targetPhase?: number;
  moveName: string;
  useCaseArchetype: string;
  phaseLabel: string;
  phasePurpose: string;
  candidatePreview?: MoveContextExtractCandidatePreviewRequest;
}

export interface MoveContextExtractItem {
  status: MoveContextExtractItemStatus;
  label: string;
  summary: string;
  reason: string;
  sourceMode: MoveContextExtractSourceMode;
  sourceArtifactId?: string;
  canonicalRecordId?: string;
  sourceSegmentId?: string;
  confidence?: number;
}

export interface MoveContextExtractResult {
  status: "created" | "skipped_existing" | "error";
  extractId: string | null;
  artifactId: string | null;
  evidenceId: string | null;
  moveId: string;
  tenantKey: string;
  sourceMode: MoveContextExtractSourceMode;
  phase: number;
  targetPhase: number;
  activeTenantAccessVersionId: string | null;
  candidateVersionId: string | null;
  sourceBuildId: string | null;
  attachedEvidenceItems: MoveContextExtractItem[];
  suggestedContextItems: MoveContextExtractItem[];
  excludedContextItems: MoveContextExtractItem[];
  gapItems: MoveContextExtractItem[];
  generatedAt: string;
  message?: string;
}

interface MoveContextExtractDeps {
  queryContext?: typeof queryTenantContext;
  saveArtifact?: typeof saveMoveArtifact;
  recordEvidence?: typeof recordProgramEvidence;
  existingExtract?: (args: {
    tenantKey: string;
    moveId: string;
    artifactType: string;
  }) => Promise<{ artifactId: string } | null>;
}

function compact(value: string, max = 900): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function extractId(input: MoveContextExtractInput, generatedAt: string): string {
  return [
    "move_context_extract",
    input.tenantKey,
    input.moveId,
    `p${input.phase}`,
    generatedAt.replace(/[^0-9T]/g, "").slice(0, 15),
  ].join(":");
}

function artifactTypeForPhase(phase: number): string {
  return `move_context_extract_p${phase}`;
}

function titleForPhase(phase: number): string {
  if (phase === 2) return "P2 Context Extract";
  if (phase === 3) return "P3 Design Evidence Pack";
  if (phase === 4) return "P4 Business Case Baseline Pack";
  if (phase === 5) return "P5 Execution / Tower Handoff Context Pack";
  return `P${phase} Context Extract`;
}

function queryFor(input: MoveContextExtractInput): string {
  return [
    input.moveName,
    input.useCaseArchetype,
    input.phaseLabel,
    input.phasePurpose,
    "business functions applications systems data assets integrations vendors risks controls metrics owners platform infrastructure evidence",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function attachedItemFromChunk(chunk: TenantContextChunk): MoveContextExtractItem {
  return {
    status: "attached_evidence",
    label: chunk.sourceDoc ?? chunk.sourceSegmentId ?? "Tenant context",
    summary: compact(chunk.text),
    reason:
      "Tenant-scoped active context matched the Move and is agent-ready, citation-ready, and not restricted.",
    sourceMode: "active_home_context",
    sourceArtifactId: chunk.chunkId,
    canonicalRecordId: chunk.recordId,
    sourceSegmentId: chunk.sourceSegmentId,
    confidence: chunk.vectorScore,
  };
}

async function defaultExistingExtract(args: {
  tenantKey: string;
  moveId: string;
  artifactType: string;
}): Promise<{ artifactId: string } | null> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("move_artifacts")
    .select("artifact_id")
    .eq("tenant_key", args.tenantKey)
    .eq("move_id", args.moveId)
    .eq("artifact_type", args.artifactType)
    .eq("lifecycle_state", "current")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { artifactId: (data as { artifact_id: string }).artifact_id };
}

function explicitCandidatePreview(input: MoveContextExtractInput): boolean {
  return Boolean(
    input.candidatePreview?.enabled &&
      input.candidatePreview.acknowledgedNotActiveRuntimeTruth &&
      input.candidatePreview.candidateVersionId,
  );
}

function candidateSuggestedItems(input: MoveContextExtractInput): MoveContextExtractItem[] {
  if (!explicitCandidatePreview(input)) return [];
  const packet = findSkyHarborPreviewModule("moves");
  return packet.sampleFacts.map((fact) => ({
    status: "suggested_context",
    label: fact.label,
    summary: `${fact.objectType} in ${fact.domain}. Candidate preview only; not active runtime truth.`,
    reason:
      "Candidate preview context is relevant but cannot be attached as approved evidence until promoted and reviewed.",
    sourceMode: "candidate_preview",
    sourceArtifactId: input.candidatePreview?.candidateVersionId,
  }));
}

function candidateExcludedItem(input: MoveContextExtractInput): MoveContextExtractItem | null {
  if (input.candidatePreview?.enabled) return null;
  return {
    status: "excluded_context",
    label: "Candidate preview data",
    summary:
      "Candidate context was not read because this was a default active-mode Approve & Build request.",
    reason: "Never read candidate data by default.",
    sourceMode: "candidate_preview",
  };
}

function gapItems(attached: MoveContextExtractItem[]): MoveContextExtractItem[] {
  if (attached.length > 0) return [];
  return [
    {
      status: "gap",
      label: "Agent-ready tenant context",
      summary:
        "No active agent-ready context matched this Move and phase. Upload, review, or promote source-backed evidence before relying on enterprise context.",
      reason: "No attached evidence was created.",
      sourceMode: "active_home_context",
    },
  ];
}

function renderMarkdown(input: {
  result: Omit<MoveContextExtractResult, "artifactId" | "evidenceId">;
  moveName: string;
  phaseLabel: string;
}): string {
  const lines = [
    `# ${titleForPhase(input.result.phase)}`,
    "",
    "Move Context Extract",
    "",
    "AbarVa gathered governed enterprise context relevant to this Move and phase. Source-backed, agent-ready items can be attached as Move evidence. Relevant but incomplete items are shown separately for review and are not used by generation until approved.",
    "",
    `- Move: ${input.moveName}`,
    `- Phase: ${input.phaseLabel}`,
    `- Source mode: ${input.result.sourceMode}`,
    `- Generated at: ${input.result.generatedAt}`,
    `- Candidate version: ${input.result.candidateVersionId ?? "not used"}`,
    `- Active Tenant Access version: ${input.result.activeTenantAccessVersionId ?? "not wired"}`,
    "",
  ];
  const section = (title: string, items: MoveContextExtractItem[]) => {
    lines.push(`## ${title}`);
    if (items.length === 0) {
      lines.push("None.");
    } else {
      for (const item of items) {
        lines.push(
          `- ${item.label}: ${item.summary}`,
          `  - Reason: ${item.reason}`,
        );
      }
    }
    lines.push("");
  };
  section("Attached Evidence", input.result.attachedEvidenceItems);
  section("Suggested Context - Needs Review", input.result.suggestedContextItems);
  section("Excluded / Not Used", input.result.excludedContextItems);
  section("Gaps to Complete", input.result.gapItems);
  return lines.join("\n");
}

function evidencePayload(
  input: MoveContextExtractInput,
  result: MoveContextExtractResult,
): ExtractedProgramEvidence {
  const facts = result.attachedEvidenceItems.map(
    (item) => `${item.label}: ${item.summary}`,
  );
  return {
    evidenceType: MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE,
    title: titleForPhase(input.phase),
    summary: `${facts.length} agent-ready context item${facts.length === 1 ? "" : "s"} attached to ${input.phaseLabel}. Suggested/candidate-only context is excluded from this evidence row.`,
    extractedText: facts.join("\n\n"),
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: facts,
      attendees: [],
      parse_method: "move-context-extract/v1",
      warnings: [
        "Only Attached Evidence is present in this row.",
        "Suggested Context and candidate-preview items are intentionally excluded from downstream generation.",
      ],
    },
    confidence: facts.length > 0 ? 0.82 : 0.5,
  };
}

export async function createMoveContextExtract(
  input: MoveContextExtractInput,
  deps: MoveContextExtractDeps = {},
): Promise<MoveContextExtractResult> {
  const generatedAt = new Date().toISOString();
  const targetPhase = input.targetPhase ?? input.phase;
  const sourceMode: MoveContextExtractSourceMode = explicitCandidatePreview(input)
    ? "candidate_preview"
    : "active_home_context";
  const artifactType = artifactTypeForPhase(input.phase);
  const existing = await (deps.existingExtract ?? defaultExistingExtract)({
    tenantKey: input.tenantKey,
    moveId: input.moveId,
    artifactType,
  });
  if (existing) {
    return {
      status: "skipped_existing",
      extractId: null,
      artifactId: existing.artifactId,
      evidenceId: null,
      moveId: input.moveId,
      tenantKey: input.tenantKey,
      sourceMode,
      phase: input.phase,
      targetPhase,
      activeTenantAccessVersionId: null,
      candidateVersionId: input.candidatePreview?.candidateVersionId ?? null,
      sourceBuildId: null,
      attachedEvidenceItems: [],
      suggestedContextItems: [],
      excludedContextItems: [],
      gapItems: [],
      generatedAt,
      message: "Existing current Move Context Extract found; not regenerated.",
    };
  }

  const queryContext = deps.queryContext ?? queryTenantContext;
  let attachedEvidenceItems: MoveContextExtractItem[] = [];
  const suggestedContextItems = candidateSuggestedItems(input);
  const excludedContextItems = [candidateExcludedItem(input)].filter(
    (item): item is MoveContextExtractItem => item !== null,
  );

  if (sourceMode === "active_home_context") {
    const chunks = await queryContext({
      tenantClientKey: input.tenantKey,
      query: queryFor(input),
      topK: 12,
      filters: {
        minConfidence: 0.5,
        sensitivity: ["public", "internal"],
        extra: ["agent_readiness_status eq 'agent_ready'"],
      },
    });
    attachedEvidenceItems = chunks.map(attachedItemFromChunk);
  }

  const resultBase = {
    status: "created" as const,
    extractId: extractId(input, generatedAt),
    moveId: input.moveId,
    tenantKey: input.tenantKey,
    sourceMode,
    phase: input.phase,
    targetPhase,
    activeTenantAccessVersionId: null,
    candidateVersionId:
      sourceMode === "candidate_preview"
        ? (input.candidatePreview?.candidateVersionId ?? null)
        : null,
    sourceBuildId: null,
    attachedEvidenceItems,
    suggestedContextItems,
    excludedContextItems,
    gapItems: gapItems(attachedEvidenceItems),
    generatedAt,
  };

  const saveArtifact = deps.saveArtifact ?? saveMoveArtifact;
  const saved = await saveArtifact(input.ctx, {
    moveId: input.moveId,
    phase: input.phase,
    archetype: input.useCaseArchetype,
    artifactType,
    artifactFamily: "session_artifact",
    title: titleForPhase(input.phase),
    description:
      "Move-scoped context extract. Suggested context is visible but not used by generation.",
    fileName: `${artifactType}.md`,
    fileFormat: "md",
    body: renderMarkdown({
      result: resultBase,
      moveName: input.moveName,
      phaseLabel: input.phaseLabel,
    }),
    status: attachedEvidenceItems.length > 0 ? "needs_review" : "draft",
    generatedBy: input.ctx.userId,
    sourceBasis: sourceMode,
    confidence: attachedEvidenceItems.length > 0 ? "medium" : "low",
    citationReady: attachedEvidenceItems.length > 0,
    metadata: {
      moveContextExtract: resultBase,
      guardrails: {
        candidateReadByDefault: false,
        activeAndCandidateMixed: false,
        suggestedContextUsedForGeneration: false,
        candidatePromoted: false,
        activeTenantAccessLayerUpdated: false,
        moduleRuntimeConsumptionChanged: false,
        realizedValueClaimed: false,
      },
    },
  });

  let evidenceId: string | null = null;
  if (attachedEvidenceItems.length > 0) {
    const recordEvidence = deps.recordEvidence ?? recordProgramEvidence;
    evidenceId = await recordEvidence(input.ctx, {
      tenantKey: input.tenantKey,
      programId: input.moveId,
      phase: input.phase,
      stepId: "move_context_extract",
      ...evidencePayload(input, {
        ...resultBase,
        artifactId: saved.artifactId,
        evidenceId: null,
      }),
    });
  }

  return {
    ...resultBase,
    artifactId: saved.artifactId,
    evidenceId,
  };
}
