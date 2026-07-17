import "server-only";

import { createHash } from "node:crypto";
import { queryTenantContext } from "@/lib/azure-search/tenant-context-retriever";
import type { TenantContextChunk } from "@/lib/azure-search/tenant-context-retriever";
import { findSkyHarborPreviewModule } from "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  getDiscoveryBlueprint,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import {
  mapEvidenceToDiscoveryFamily,
  type DiscoveryEvidenceReadinessItem,
} from "@/lib/programs/discovery/evidence-readiness";
import {
  recordProgramEvidence,
  type ExtractedProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import {
  sourceDisplayLabelFor,
  technicalSourceFileFor,
} from "@/lib/enterprise-data/source-display-labels";

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
  evidenceId?: string;
  moveId?: string;
  tenantId?: string;
  tenantKey?: string;
  evidenceFamily?: string;
  sourceType?: string;
  sourceFileRef?: string;
  technicalSourceFile?: string;
  citation?: string;
  readinessStatus?: "covered" | "generation_eligible" | "agent_ready";
  usedByPhase?: number;
  targetPhase?: number;
  whyAttached?: string;
  sourceArtifactId?: string;
  canonicalRecordId?: string;
  sourceSegmentId?: string;
  confidence?: number;
}

export type MoveContextExtractFreshnessStatus =
  | "fresh"
  | "stale"
  | "rebuild_required";

export interface MoveContextExtractFreshness {
  extractId: string | null;
  moveId: string;
  tenantKey: string;
  evidenceFingerprint: string;
  attachedEvidenceCount: number;
  acceptedEvidenceCount: number;
  latestEvidenceUpdatedAt: string | null;
  blueprintId: string;
  blueprintVersion: string;
  createdAt: string;
  freshnessStatus: MoveContextExtractFreshnessStatus;
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
  freshness: MoveContextExtractFreshness;
  generatedAt: string;
  message?: string;
}

interface MoveContextExtractDeps {
  queryContext?: typeof queryTenantContext;
  saveArtifact?: typeof saveMoveArtifact;
  recordEvidence?: typeof recordProgramEvidence;
  loadMoveEvidence?: typeof defaultLoadMoveEvidenceRows;
  existingExtract?: (args: {
    tenantKey: string;
    moveId: string;
    artifactType: string;
  }) => Promise<ExistingMoveContextExtract | null>;
}

interface ExistingMoveContextExtract {
  artifactId: string;
  createdAt: string | null;
  metadata: Record<string, unknown>;
}

interface MoveEvidenceRow {
  id: string;
  tenantKey: string;
  programId: string;
  attachmentId: string | null;
  phase: number | null;
  evidenceType: string;
  title: string;
  summary: string;
  extractedText: string | null;
  extractedStructured: Record<string, unknown>;
  confidence: number | string | null;
  createdAt: string | null;
  reviewUpdatedAt: string | null;
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
  const sourcePath = chunk.sourceDoc ?? chunk.sourceSegmentId ?? chunk.chunkId;
  const sourceLabel = sourceDisplayLabelFor({
    sourcePath,
    evidenceId: chunk.chunkId,
    fallback: "Tenant context",
  });
  return {
    status: "attached_evidence",
    label: sourceLabel,
    summary: compact(chunk.text),
    reason:
      "Tenant-scoped active context matched the Move and is agent-ready, citation-ready, and not restricted.",
    sourceMode: "active_home_context",
    evidenceFamily: chunk.sourceBasis ?? chunk.sourceSegmentId ?? "enterprise_context",
    sourceType: "active_module_context",
    sourceFileRef: sourceLabel,
    technicalSourceFile: technicalSourceFileFor(sourcePath),
    citation: chunk.chunkId,
    readinessStatus: "agent_ready",
    sourceArtifactId: chunk.chunkId,
    canonicalRecordId: chunk.recordId,
    sourceSegmentId: chunk.sourceSegmentId,
    confidence: chunk.vectorScore,
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function isoOrNull(value: unknown): string | null {
  const text = stringOrNull(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : text;
}

function maxIso(values: Array<string | null | undefined>): string | null {
  let max = 0;
  let out: string | null = null;
  for (const value of values) {
    const text = isoOrNull(value);
    if (!text) continue;
    const time = Date.parse(text);
    if (Number.isFinite(time) && time >= max) {
      max = time;
      out = text;
    }
  }
  return out;
}

function extractedStringArray(
  structured: Record<string, unknown>,
  key: string,
): string[] {
  const value = structured[key];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function evidenceRowText(row: MoveEvidenceRow): string {
  const signals = [
    ...extractedStringArray(row.extractedStructured, "decisions"),
    ...extractedStringArray(row.extractedStructured, "baseline_candidates"),
    ...extractedStringArray(row.extractedStructured, "risks"),
    ...extractedStringArray(row.extractedStructured, "action_items"),
  ];
  return compact(
    [
      row.summary,
      signals.length ? `Extracted signals: ${signals.slice(0, 8).join("; ")}` : "",
      row.extractedText ?? "",
    ].join(" "),
    1200,
  );
}

function evidencePolicyAllowsAttachment(row: MoveEvidenceRow): boolean {
  if (row.evidenceType === MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE) return false;
  const structured = row.extractedStructured;
  const sourceType = stringOrNull(structured.source_type);
  if (sourceType === "candidate_preview" || sourceType === "suggested_context") {
    return false;
  }
  const classification = stringOrNull(structured.classification);
  if (classification === "restricted") return false;
  const sensitivity = stringOrNull(structured.sensitivity);
  if (sensitivity === "restricted") return false;
  return Boolean(evidenceRowText(row));
}

function discoveryItemFromRow(row: MoveEvidenceRow): DiscoveryEvidenceReadinessItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    evidenceType: row.evidenceType,
    phase: row.phase,
    confidence: row.confidence,
    createdAt: row.createdAt,
  };
}

function attachedItemFromEvidenceRow(
  input: MoveContextExtractInput,
  row: MoveEvidenceRow,
): MoveContextExtractItem {
  const blueprint = getDiscoveryBlueprint(input.useCaseArchetype);
  const family =
    mapEvidenceToDiscoveryFamily(discoveryItemFromRow(row), blueprint) ??
    stringOrNull(row.extractedStructured.evidence_type) ??
    row.evidenceType;
  const sourceFileRef =
    stringOrNull(row.extractedStructured.citation) ??
    stringOrNull(row.extractedStructured.source_file) ??
    row.attachmentId ??
    row.id;
  return {
    status: "attached_evidence",
    evidenceId: row.id,
    moveId: row.programId,
    tenantId: input.ctx.clientId,
    tenantKey: row.tenantKey,
    evidenceFamily: family,
    label: row.title,
    summary: evidenceRowText(row),
    reason:
      "Move-scoped uploaded evidence is covered by readiness and eligible for phase generation.",
    sourceMode: "active_home_context",
    sourceType:
      stringOrNull(row.extractedStructured.source_type) ??
      (row.attachmentId ? "uploaded_evidence" : "program_evidence"),
    sourceArtifactId: row.attachmentId ?? row.id,
    sourceFileRef,
    citation: sourceFileRef,
    confidence: numberOrNull(row.confidence) ?? undefined,
    readinessStatus: "covered",
    usedByPhase: input.phase,
    targetPhase: input.targetPhase ?? input.phase,
    whyAttached:
      "Same tenant, same Move, source-backed/uploaded evidence, readiness-covered, and generation-eligible.",
  };
}

async function defaultLoadMoveEvidenceRows(args: {
  tenantKey: string;
  moveId: string;
}): Promise<MoveEvidenceRow[]> {
  const sb = getAzureWriteFluentClient();
  const { data: reviewData, error: reviewError } = await sb
    .from("program_evidence_reviews")
    .select(
      "evidence_id, decision, reviewed_at, updated_at, created_at",
    )
    .eq("tenant_key", args.tenantKey)
    .eq("program_id", args.moveId)
    .eq("decision", "approved")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (reviewError || !Array.isArray(reviewData)) return [];

  const reviewRows = reviewData as Array<Record<string, unknown>>;
  const evidenceIds = reviewRows
    .map((row) => stringOrNull(row.evidence_id))
    .filter((id): id is string => Boolean(id));
  if (evidenceIds.length === 0) return [];

  const { data: evidenceData, error: evidenceError } = await sb
    .from("program_evidence_items")
    .select(
      "id, tenant_key, program_id, attachment_id, phase, evidence_type, title, summary, extracted_text, extracted_structured, confidence, created_at",
    )
    .in("id", evidenceIds);
  if (evidenceError || !Array.isArray(evidenceData)) return [];

  const evidenceById = new Map(
    (evidenceData as Array<Record<string, unknown>>).map((row) => [
      stringOrNull(row.id),
      row,
    ]),
  );
  return reviewRows
    .map((reviewRow) => {
      const evidenceId = stringOrNull(reviewRow.evidence_id);
      const row = evidenceId ? evidenceById.get(evidenceId) : null;
      if (!row) return null;
      return {
        id: stringOrNull(row.id) ?? evidenceId ?? "",
        tenantKey: stringOrNull(row.tenant_key) ?? args.tenantKey,
        programId: stringOrNull(row.program_id) ?? args.moveId,
        attachmentId: stringOrNull(row.attachment_id),
        phase: numberOrNull(row.phase),
        evidenceType: stringOrNull(row.evidence_type) ?? "uploaded_artifact",
        title: stringOrNull(row.title) ?? "Untitled Move evidence",
        summary: stringOrNull(row.summary) ?? "",
        extractedText: stringOrNull(row.extracted_text),
        extractedStructured: objectValue(row.extracted_structured),
        confidence: row.confidence as number | string | null,
        createdAt: stringOrNull(row.created_at),
        reviewUpdatedAt:
          stringOrNull(reviewRow.reviewed_at) ??
          stringOrNull(reviewRow.updated_at) ??
          stringOrNull(reviewRow.created_at),
      };
    })
    .filter((row): row is MoveEvidenceRow => row !== null)
    .filter((row) => row.id && row.programId === args.moveId && row.tenantKey === args.tenantKey);
}

async function defaultExistingExtract(args: {
  tenantKey: string;
  moveId: string;
  artifactType: string;
}): Promise<ExistingMoveContextExtract | null> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("move_artifacts")
    .select("artifact_id, metadata, created_at, generated_at")
    .eq("tenant_key", args.tenantKey)
    .eq("move_id", args.moveId)
    .eq("artifact_type", args.artifactType)
    .eq("lifecycle_state", "current")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    artifact_id: string;
    metadata?: Record<string, unknown> | null;
    created_at?: string | null;
    generated_at?: string | null;
  };
  return {
    artifactId: row.artifact_id,
    createdAt: stringOrNull(row.generated_at) ?? stringOrNull(row.created_at),
    metadata: objectValue(row.metadata),
  };
}

function evidenceFingerprint(args: {
  rows: MoveEvidenceRow[];
  blueprintId: string;
  blueprintVersion: string;
  sourceMode: MoveContextExtractSourceMode;
}): string {
  if (args.rows.length === 0) return "no-accepted-evidence";
  const payload = {
    sourceMode: args.sourceMode,
    blueprintId: args.blueprintId,
    blueprintVersion: args.blueprintVersion,
    evidence: args.rows
      .map((row) => ({
        id: row.id,
        phase: row.phase,
        evidenceType: row.evidenceType,
        attachmentId: row.attachmentId,
        createdAt: row.createdAt,
        reviewUpdatedAt: row.reviewUpdatedAt,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function freshnessFor(args: {
  input: MoveContextExtractInput;
  generatedAt: string;
  extractId: string | null;
  attachedEvidenceCount: number;
  acceptedEvidenceRows: MoveEvidenceRow[];
  blueprintId: string;
  blueprintVersion: string;
  sourceMode: MoveContextExtractSourceMode;
  status: MoveContextExtractFreshnessStatus;
}): MoveContextExtractFreshness {
  return {
    extractId: args.extractId,
    moveId: args.input.moveId,
    tenantKey: args.input.tenantKey,
    evidenceFingerprint: evidenceFingerprint({
      rows: args.acceptedEvidenceRows,
      blueprintId: args.blueprintId,
      blueprintVersion: args.blueprintVersion,
      sourceMode: args.sourceMode,
    }),
    attachedEvidenceCount: args.attachedEvidenceCount,
    acceptedEvidenceCount: args.acceptedEvidenceRows.length,
    latestEvidenceUpdatedAt: maxIso(
      args.acceptedEvidenceRows.map((row) => row.reviewUpdatedAt ?? row.createdAt),
    ),
    blueprintId: args.blueprintId,
    blueprintVersion: args.blueprintVersion,
    createdAt: args.generatedAt,
    freshnessStatus: args.status,
  };
}

function existingResultFromMetadata(args: {
  input: MoveContextExtractInput;
  existing: ExistingMoveContextExtract;
  generatedAt: string;
  targetPhase: number;
  sourceMode: MoveContextExtractSourceMode;
  currentFreshness: MoveContextExtractFreshness;
}): MoveContextExtractResult {
  const extract = objectValue(args.existing.metadata.moveContextExtract);
  const array = (value: unknown): MoveContextExtractItem[] =>
    Array.isArray(value) ? (value as MoveContextExtractItem[]) : [];
  return {
    status: "skipped_existing",
    extractId: stringOrNull(extract.extractId),
    artifactId: args.existing.artifactId,
    evidenceId: null,
    moveId: args.input.moveId,
    tenantKey: args.input.tenantKey,
    sourceMode: args.sourceMode,
    phase: args.input.phase,
    targetPhase: args.targetPhase,
    activeTenantAccessVersionId: stringOrNull(extract.activeTenantAccessVersionId),
    candidateVersionId: args.input.candidatePreview?.candidateVersionId ?? null,
    sourceBuildId: stringOrNull(extract.sourceBuildId),
    attachedEvidenceItems: array(extract.attachedEvidenceItems),
    suggestedContextItems: array(extract.suggestedContextItems),
    excludedContextItems: array(extract.excludedContextItems),
    gapItems: array(extract.gapItems),
    freshness: {
      ...args.currentFreshness,
      freshnessStatus: "fresh",
      createdAt: args.existing.createdAt ?? args.currentFreshness.createdAt,
    },
    generatedAt: args.generatedAt,
    message: "Existing current Move Context Extract found and fresh for the accepted evidence fingerprint and blueprint.",
  };
}

function existingFreshness(value: ExistingMoveContextExtract | null): MoveContextExtractFreshness | null {
  const extract = objectValue(value?.metadata.moveContextExtract);
  const freshness = objectValue(extract.freshness);
  const evidenceFingerprintValue = stringOrNull(freshness.evidenceFingerprint);
  const blueprintId = stringOrNull(freshness.blueprintId);
  const blueprintVersion = stringOrNull(freshness.blueprintVersion);
  if (!evidenceFingerprintValue || !blueprintId || !blueprintVersion) return null;
  return {
    extractId: stringOrNull(freshness.extractId),
    moveId: stringOrNull(freshness.moveId) ?? "",
    tenantKey: stringOrNull(freshness.tenantKey) ?? "",
    evidenceFingerprint: evidenceFingerprintValue,
    attachedEvidenceCount: numberOrNull(freshness.attachedEvidenceCount) ?? 0,
    acceptedEvidenceCount: numberOrNull(freshness.acceptedEvidenceCount) ?? 0,
    latestEvidenceUpdatedAt: stringOrNull(freshness.latestEvidenceUpdatedAt),
    blueprintId,
    blueprintVersion,
    createdAt: stringOrNull(freshness.createdAt) ?? value?.createdAt ?? "",
    freshnessStatus:
      freshness.freshnessStatus === "fresh" ||
      freshness.freshnessStatus === "stale" ||
      freshness.freshnessStatus === "rebuild_required"
        ? freshness.freshnessStatus
        : "rebuild_required",
  };
}

function isExistingFresh(args: {
  existing: ExistingMoveContextExtract | null;
  current: MoveContextExtractFreshness;
}): boolean {
  const previous = existingFreshness(args.existing);
  if (!previous) return false;
  const latestTime = args.current.latestEvidenceUpdatedAt
    ? Date.parse(args.current.latestEvidenceUpdatedAt)
    : 0;
  const createdTime = previous.createdAt ? Date.parse(previous.createdAt) : 0;
  return (
    previous.evidenceFingerprint === args.current.evidenceFingerprint &&
    previous.attachedEvidenceCount === args.current.attachedEvidenceCount &&
    previous.acceptedEvidenceCount === args.current.acceptedEvidenceCount &&
    previous.blueprintId === args.current.blueprintId &&
    previous.blueprintVersion === args.current.blueprintVersion &&
    (!latestTime || !createdTime || latestTime <= createdTime)
  );
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
  const familyCounts = new Map<string, number>();
  for (const item of input.result.attachedEvidenceItems) {
    const family = item.evidenceFamily ?? "uncategorized";
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
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
    `- Attached Evidence count: ${input.result.attachedEvidenceItems.length}`,
    "",
    "## Evidence Family Coverage",
    familyCounts.size === 0
      ? "None."
      : [...familyCounts.entries()]
          .map(([family, count]) => `- ${family}: ${count} attached`)
          .join("\n"),
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
          ...(item.evidenceId ? [`  - Evidence ID: ${item.evidenceId}`] : []),
          ...(item.evidenceFamily ? [`  - Evidence family: ${item.evidenceFamily}`] : []),
          ...(item.sourceType ? [`  - Source type: ${item.sourceType}`] : []),
          ...(item.sourceFileRef ? [`  - Source: ${item.sourceFileRef}`] : []),
          ...(item.technicalSourceFile ? [`  - Technical source file: ${item.technicalSourceFile}`] : []),
          `  - Reason: ${item.reason}`,
          ...(item.whyAttached ? [`  - Why attached: ${item.whyAttached}`] : []),
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
    (item) =>
      [
        item.evidenceId ? `Evidence ID ${item.evidenceId}` : null,
        item.evidenceFamily ? `Family ${item.evidenceFamily}` : null,
        `${item.label}: ${item.summary}`,
        item.sourceFileRef ? `Source ${item.sourceFileRef}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
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
  const blueprint = getDiscoveryBlueprint(input.useCaseArchetype);
  const loadMoveEvidence = deps.loadMoveEvidence ?? defaultLoadMoveEvidenceRows;
  const moveEvidenceRows =
    sourceMode === "active_home_context"
      ? await loadMoveEvidence({
          tenantKey: input.tenantKey,
          moveId: input.moveId,
        })
      : [];
  const acceptedEvidenceItems = moveEvidenceRows
    .filter(evidencePolicyAllowsAttachment)
    .map((row) => attachedItemFromEvidenceRow(input, row));
  const preContextFreshness = freshnessFor({
    input,
    generatedAt,
    extractId: null,
    attachedEvidenceCount: acceptedEvidenceItems.length,
    acceptedEvidenceRows: moveEvidenceRows.filter(evidencePolicyAllowsAttachment),
    blueprintId: blueprint.blueprintId,
    blueprintVersion: blueprint.blueprintVersion,
    sourceMode,
    status: "fresh",
  });
  const existing = await (deps.existingExtract ?? defaultExistingExtract)({
    tenantKey: input.tenantKey,
    moveId: input.moveId,
    artifactType,
  });
  if (existing && isExistingFresh({ existing, current: preContextFreshness })) {
    return existingResultFromMetadata({
      input,
      existing,
      generatedAt,
      targetPhase,
      sourceMode,
      currentFreshness: preContextFreshness,
    });
  }

  const queryContext = deps.queryContext ?? queryTenantContext;
  let attachedEvidenceItems: MoveContextExtractItem[] = acceptedEvidenceItems;
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
    attachedEvidenceItems = [
      ...attachedEvidenceItems,
      ...chunks.map(attachedItemFromChunk),
    ];
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
    freshness: freshnessFor({
      input,
      generatedAt,
      extractId: extractId(input, generatedAt),
      attachedEvidenceCount: attachedEvidenceItems.length,
      acceptedEvidenceRows: moveEvidenceRows.filter(evidencePolicyAllowsAttachment),
      blueprintId: blueprint.blueprintId,
      blueprintVersion: blueprint.blueprintVersion,
      sourceMode,
      status: "fresh",
    }),
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
    status: attachedEvidenceItems.length > 0 ? "review_required" : "draft",
    generatedBy: input.ctx.userId,
    sourceBasis: sourceMode,
    confidence: attachedEvidenceItems.length > 0 ? "medium" : "low",
    citationReady: attachedEvidenceItems.length > 0,
    metadata: {
      moveContextExtract: resultBase,
      previousMoveContextExtract:
        existing && !isExistingFresh({ existing, current: preContextFreshness })
          ? {
              artifactId: existing.artifactId,
              freshnessStatus: "rebuild_required",
              reason:
                "Accepted evidence fingerprint, counts, latest review timestamp, or blueprint changed.",
            }
          : null,
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
