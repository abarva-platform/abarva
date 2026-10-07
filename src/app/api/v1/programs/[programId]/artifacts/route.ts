// GET /api/v1/programs/:programId/artifacts?family=&currentOnly=1
// Move File Cabinet data: durable artifacts registered in move_artifacts (Blob +
// Postgres), newest first, filterable by family / current-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import {
  listMoveArtifacts,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  initialReviewedEvidenceExtraction,
  reviewedExtractionFromStoredSourceRef,
} from "@/lib/programs/evidence-review-contract";
import {
  isApprovedMoveEvidenceBasisCurrent,
  loadApprovedMoveEvidenceSnapshot,
} from "@/lib/programs/approved-move-evidence-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CabinetArtifact {
  artifactId: string;
  artifactType: string;
  deliverableTypeKey?: string | null;
  family: string;
  title: string;
  phase: number | null;
  fileFormat: string | null;
  fileName: string | null;
  version: number;
  status: string;
  lifecycleState?: string | null;
  qualityScore: number | null;
  unsupportedClaims?: number | null;
  generatedBy: string | null;
  createdAt: string;
  fileSize?: number | null;
  stored?: string | null;
  openItems?: string[];
  reviewStatus?: string | null;
  feedbackStatus?: string | null;
  feedbackItemCount?: number | null;
  regeneratedFromArtifactId?: string | null;
  qualityStatus?: string | null;
  goldenBarStatus?: string | null;
  artifactStatus?: string | null;
  preliminaryCaveat?: string | null;
  clientFacingVersionLabel?: string | null;
  outputRole?: string | null;
  provenanceCategory?: string | null;
  primaryEditableRecordLabel?: string | null;
  pairedVisualCompanionArtifactId?: string | null;
  visualCompanionArtifactType?: string | null;
  contextExtract?: CabinetContextExtract | null;
  evidenceSnapshotStatus?: "current" | "stale" | "unverified";
  downloadUrl: string;
}

interface CabinetPendingEvidenceReview {
  evidenceId: string;
  reviewId: string;
  sourceArtifactId: string | null;
  title: string;
  familyKey: string;
  phase: number | null;
  parseMethod: string;
  confidence: number;
  sourceTextPreview: string;
  extraction: ReturnType<typeof initialReviewedEvidenceExtraction>;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function qualityScoreForDisplay(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value <= 1 ? value * 100 : value);
}

async function loadPendingEvidenceReviews(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
): Promise<{
  items: CabinetPendingEvidenceReview[];
  available: boolean;
}> {
  try {
    const db = getAzureWriteFluentClient();
    // Program-evidence rows may be stored under any of the tenant's
    // representations (the app client key, e.g. "meridian", or its canonical
    // substrate alias, e.g. "meridian-health") depending on which writer
    // created them. Match all of them so a load under either representation is
    // visible; the alias set is per-tenant, so this cannot widen to another
    // tenant.
    const tenantKeys = tenantAliasesFor(ctx.clientKey ?? "");
    const { data: reviews, error: reviewError } = await db
      .from("program_evidence_reviews")
      .select("id, evidence_id, family_key, phase, source_ref")
      .in("tenant_key", tenantKeys)
      .eq("program_id", programId)
      .eq("decision", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    if (reviewError || !Array.isArray(reviews)) {
      return { items: [], available: false };
    }
    const reviewRows = reviews as Array<Record<string, unknown>>;
    const evidenceIds = reviewRows
      .map((row) => row.evidence_id)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
    if (!evidenceIds.length) return { items: [], available: true };

    const { data: evidenceRows, error: evidenceError } = await db
      .from("program_evidence_items")
      .select("id, title, summary, extracted_text, extracted_structured")
      .in("tenant_key", tenantKeys)
      .eq("program_id", programId)
      .in("id", evidenceIds);
    if (evidenceError || !Array.isArray(evidenceRows)) {
      return { items: [], available: false };
    }
    const evidenceById = new Map(
      (evidenceRows as Array<Record<string, unknown>>).map((row) => [
        row.id,
        row,
      ]),
    );
    return {
      available: true,
      items: reviewRows.flatMap((review) => {
        const evidenceId =
          typeof review.evidence_id === "string" ? review.evidence_id : "";
        const evidence = evidenceById.get(evidenceId);
        if (!evidence) return [];
        const sourceRef = objectValue(review.source_ref);
        const sourceText =
          typeof evidence.extracted_text === "string"
            ? evidence.extracted_text
            : "";
        const reviewed = reviewedExtractionFromStoredSourceRef(sourceRef);
        return [
          {
            evidenceId,
            reviewId: String(review.id ?? ""),
            sourceArtifactId:
              typeof sourceRef.move_artifact_id === "string"
                ? sourceRef.move_artifact_id
                : null,
            title: String(
              sourceRef.filename ??
                sourceRef.title ??
                evidence.title ??
                "Uploaded evidence",
            ),
            familyKey: String(review.family_key ?? "uploaded_move_evidence"),
            phase: typeof review.phase === "number" ? review.phase : null,
            parseMethod: String(sourceRef.parse_method ?? "unknown"),
            confidence:
              typeof sourceRef.confidence === "number"
                ? sourceRef.confidence
                : 0,
            sourceTextPreview: sourceText.slice(0, 12000),
            extraction:
              reviewed ??
              initialReviewedEvidenceExtraction({
                summary: evidence.summary,
                extractedText: sourceText,
                extractedStructured: evidence.extracted_structured,
              }),
          },
        ];
      }),
    };
  } catch {
    return { items: [], available: false };
  }
}

interface CabinetReviewedEvidence {
  evidenceId: string;
  reviewId: string;
  title: string;
  familyKey: string;
  phase: number | null;
  reviewedAt: string | null;
}

/**
 * Human-approved program evidence for this Move, as a light read-only list for
 * the Files & Evidence cabinet. Unlike the pending queue it carries no
 * extraction/source-text payload — it is an audit trail of what a reviewer
 * accepted, not an editing surface. Tenant match uses the per-tenant alias set
 * so rows written under either representation surface (see the pending loader).
 */
async function loadReviewedEvidence(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
): Promise<{ items: CabinetReviewedEvidence[]; available: boolean }> {
  try {
    const db = getAzureWriteFluentClient();
    const tenantKeys = tenantAliasesFor(ctx.clientKey ?? "");
    const { data: reviews, error: reviewError } = await db
      .from("program_evidence_reviews")
      .select("id, evidence_id, family_key, phase, source_ref, reviewed_at")
      .in("tenant_key", tenantKeys)
      .eq("program_id", programId)
      .eq("decision", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(200);
    if (reviewError || !Array.isArray(reviews)) {
      return { items: [], available: false };
    }
    const reviewRows = reviews as Array<Record<string, unknown>>;
    const evidenceIds = reviewRows
      .map((row) => row.evidence_id)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
    if (!evidenceIds.length) return { items: [], available: true };

    const { data: evidenceRows, error: evidenceError } = await db
      .from("program_evidence_items")
      .select("id, title")
      .in("tenant_key", tenantKeys)
      .eq("program_id", programId)
      .in("id", evidenceIds);
    if (evidenceError || !Array.isArray(evidenceRows)) {
      return { items: [], available: false };
    }
    const titleById = new Map(
      (evidenceRows as Array<Record<string, unknown>>).map((row) => [
        row.id,
        typeof row.title === "string" ? row.title : "",
      ]),
    );
    return {
      available: true,
      items: reviewRows.flatMap((review) => {
        const evidenceId =
          typeof review.evidence_id === "string" ? review.evidence_id : "";
        if (!titleById.has(evidenceId)) return [];
        const sourceRef = objectValue(review.source_ref);
        return [
          {
            evidenceId,
            reviewId: String(review.id ?? ""),
            title: String(
              sourceRef.filename ??
                sourceRef.title ??
                titleById.get(evidenceId) ??
                "Approved evidence",
            ),
            familyKey: String(review.family_key ?? "uploaded_move_evidence"),
            phase: typeof review.phase === "number" ? review.phase : null,
            reviewedAt:
              typeof review.reviewed_at === "string"
                ? review.reviewed_at
                : null,
          },
        ];
      }),
    };
  } catch {
    return { items: [], available: false };
  }
}

interface CabinetContextExtractItem {
  status?: string;
  label?: string;
  summary?: string;
  reason?: string;
  evidenceId?: string;
  evidenceFamily?: string;
  sourceType?: string;
  sourceFileRef?: string;
  readinessStatus?: string;
  targetPhase?: number;
  whyAttached?: string;
}

interface CabinetContextExtract {
  sourceMode?: string;
  phase?: number;
  targetPhase?: number;
  generatedAt?: string;
  candidateVersionId?: string | null;
  activeTenantAccessVersionId?: string | null;
  attachedEvidenceItems?: CabinetContextExtractItem[];
  suggestedContextItems?: CabinetContextExtractItem[];
  excludedContextItems?: CabinetContextExtractItem[];
  gapItems?: CabinetContextExtractItem[];
  freshness?: {
    approvedEvidenceRevision?: string | null;
    approvedEvidenceRevisionScope?: "phase" | null;
    freshnessStatus?: "fresh" | "stale" | "rebuild_required";
    currentApprovedEvidenceCount?: number;
    createdAt?: string | null;
  };
}

function contextExtractFromMetadata(
  value: unknown,
): CabinetContextExtract | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const extract = value as CabinetContextExtract;
  const hasContextExtractShape =
    typeof extract.sourceMode === "string" ||
    Array.isArray(extract.attachedEvidenceItems) ||
    Array.isArray(extract.suggestedContextItems) ||
    Array.isArray(extract.excludedContextItems) ||
    Array.isArray(extract.gapItems);
  return hasContextExtractShape ? extract : null;
}

function phaseFromGeneratedArtifactMetadata(
  meta: Record<string, unknown> | null | undefined,
): number | null {
  const directPhase = meta?.phase;
  if (typeof directPhase === "number" && Number.isInteger(directPhase))
    return directPhase;
  if (typeof directPhase === "string" && directPhase.trim()) {
    const parsed = Number(directPhase);
    if (Number.isInteger(parsed)) return parsed;
  }

  const keyCandidates = [
    meta?.deliverableTypeKey,
    meta?.registryKey,
    meta?.deliverableType,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableTypeKey
      : null,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableType
      : null,
  ];
  for (const candidate of keyCandidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const spec = DELIVERABLE_REGISTRY.find(
      (item) => item.deliverableTypeKey === candidate.trim(),
    );
    if (spec) return spec.phase;
  }

  return null;
}

function deliverableKeyFromGeneratedArtifactMetadata(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  const candidates = [
    meta?.deliverableTypeKey,
    meta?.registryKey,
    meta?.deliverableType,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableTypeKey
      : null,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableType
      : null,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function deliverableKeyFromMoveArtifactMetadata(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  const candidates = [
    meta?.deliverableTypeKey,
    meta?.registryKey,
    meta?.deliverableType,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function artifactTime(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function renderableDocMetadataTitle(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  const renderableDoc = meta?.renderableDoc;
  if (
    !renderableDoc ||
    typeof renderableDoc !== "object" ||
    Array.isArray(renderableDoc)
  ) {
    return null;
  }
  const title = (renderableDoc as Record<string, unknown>).title;
  return typeof title === "string" && title.trim() ? title : null;
}

function isEditableDeliverableTitle(title: string): boolean {
  return /editable deliverable/i.test(title);
}

function filterCurrentGeneratedArtifacts(
  recs: Awaited<ReturnType<typeof listGeneratedArtifactsForMoveAllRefs>>,
) {
  const active = recs.filter((rec) => !rec.supersededBy);
  const newestByPhase = new Map<number, (typeof active)[number]>();
  const newestByPhaseAndKey = new Map<string, (typeof active)[number]>();
  const newestAnchorByPhase = new Map<number, (typeof active)[number]>();
  for (const rec of active) {
    const phase = phaseFromGeneratedArtifactMetadata(rec.metadata);
    const key = deliverableKeyFromGeneratedArtifactMetadata(rec.metadata);
    const title = renderableDocMetadataTitle(rec.metadata);
    if (phase !== null) {
      const current = newestByPhase.get(phase);
      if (
        !current ||
        artifactTime(rec.renderedAt) > artifactTime(current.renderedAt)
      ) {
        newestByPhase.set(phase, rec);
      }
      if (
        key === "target_state_architecture" &&
        !isEditableDeliverableTitle(title ?? "")
      ) {
        const currentAnchor = newestAnchorByPhase.get(phase);
        if (
          !currentAnchor ||
          artifactTime(rec.renderedAt) > artifactTime(currentAnchor.renderedAt)
        ) {
          newestAnchorByPhase.set(phase, rec);
        }
      }
    }
    if (phase !== null && key) {
      const phaseKey = `${phase}:${key}:${normalizedArtifactTitle(
        title ?? key,
      )}`;
      const currentForKey = newestByPhaseAndKey.get(phaseKey);
      if (
        !currentForKey ||
        artifactTime(rec.renderedAt) > artifactTime(currentForKey.renderedAt)
      ) {
        newestByPhaseAndKey.set(phaseKey, rec);
      }
    }
  }
  return active.filter((rec) => {
    const phase = phaseFromGeneratedArtifactMetadata(rec.metadata);
    if (phase === null) return true;
    const key = deliverableKeyFromGeneratedArtifactMetadata(rec.metadata);
    const title = renderableDocMetadataTitle(rec.metadata);
    if (key) {
      const newestForKey = newestByPhaseAndKey.get(
        `${phase}:${key}:${normalizedArtifactTitle(title ?? key)}`,
      );
      if (newestForKey && rec.id !== newestForKey.id) return false;
    }
    const anchor = newestAnchorByPhase.get(phase);
    if (
      phase === 3 &&
      anchor &&
      rec.id !== anchor.id &&
      !isEditableDeliverableTitle(title ?? "") &&
      artifactTime(rec.renderedAt) < artifactTime(anchor.renderedAt)
    ) {
      return false;
    }
    const newest = newestByPhase.get(phase);
    if (!newest?.quarantineReason) return true;
    return rec.id === newest.id;
  });
}

function normalizedArtifactTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

const FIXTURE_CONTROL_MARKERS = [
  /client[\s_-]+approved[\s_-]+deliverables[\s_-]+packet/i,
  /simulated client approved upload/i,
  /synthetic aggregate evidence only/i,
  /must mention in generated output/i,
  /must not claim:/i,
];

function compactJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "";
  }
}

function isFixtureControlArtifact(value: {
  artifact_family?: unknown;
  title?: unknown;
  file_name?: unknown;
  metadata?: unknown;
}): boolean {
  if (value.artifact_family !== "generated_deliverable") return false;
  const haystack = [
    typeof value.title === "string" ? value.title : "",
    typeof value.file_name === "string" ? value.file_name : "",
    compactJson(value.metadata),
  ].join("\n");
  return FIXTURE_CONTROL_MARKERS.some((pattern) => pattern.test(haystack));
}

function filterCurrentCabinetArtifacts(
  artifacts: readonly CabinetArtifact[],
): CabinetArtifact[] {
  const newestByPhaseAndTitle = new Map<string, CabinetArtifact>();
  let newestP3ArchitectureAnchor: CabinetArtifact | null = null;
  for (const artifact of artifacts) {
    if (artifact.phase === null) continue;
    const title = normalizedArtifactTitle(artifact.title);
    const phaseTitle = `${artifact.phase}:${title}`;
    const currentForTitle = newestByPhaseAndTitle.get(phaseTitle);
    if (
      !currentForTitle ||
      artifactTime(artifact.createdAt) > artifactTime(currentForTitle.createdAt)
    ) {
      newestByPhaseAndTitle.set(phaseTitle, artifact);
    }
    if (
      artifact.phase === 3 &&
      /target-state architecture/i.test(artifact.title) &&
      !isEditableDeliverableTitle(artifact.title) &&
      (!newestP3ArchitectureAnchor ||
        artifactTime(artifact.createdAt) >
          artifactTime(newestP3ArchitectureAnchor.createdAt))
    ) {
      newestP3ArchitectureAnchor = artifact;
    }
  }

  return artifacts.filter((artifact) => {
    if (artifact.phase === null) return true;
    const title = normalizedArtifactTitle(artifact.title);
    const newestForTitle = newestByPhaseAndTitle.get(
      `${artifact.phase}:${title}`,
    );
    if (newestForTitle && artifact.artifactId !== newestForTitle.artifactId) {
      return false;
    }
    if (
      artifact.phase === 3 &&
      newestP3ArchitectureAnchor &&
      artifact.artifactId !== newestP3ArchitectureAnchor.artifactId &&
      !isEditableDeliverableTitle(artifact.title) &&
      artifactTime(artifact.createdAt) <
        artifactTime(newestP3ArchitectureAnchor.createdAt)
    ) {
      return false;
    }
    return true;
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const family = req.nextUrl.searchParams.get(
      "family",
    ) as ArtifactFamily | null;
    const currentOnly = req.nextUrl.searchParams.get("currentOnly") === "1";
    const rows = await listMoveArtifacts(ctx, programId, {
      family: family ?? undefined,
      currentOnly,
    });
    const evidenceReviewQueue = await loadPendingEvidenceReviews(
      ctx,
      programId,
    );
    const reviewedEvidenceList = await loadReviewedEvidence(ctx, programId);
    const approvedSnapshot = ctx.clientKey
      ? await loadApprovedMoveEvidenceSnapshot({
          tenantKey: ctx.clientKey,
          moveId: programId,
        }).catch(() => null)
      : null;

    const moveArtifacts: CabinetArtifact[] = rows.map((r) => {
      const fixtureControl = isFixtureControlArtifact(r);
      const meta = r.metadata as {
        storage?: string;
        deliverableTypeKey?: string;
        registryKey?: string;
        deliverableType?: string;
        openItems?: string[];
        reviewStatus?: string;
        feedbackStatus?: string;
        feedbackItemCount?: number;
        regeneratedFromArtifactId?: string;
        qualityStatus?: string;
        goldenBarStatus?: string;
        artifactStatus?: string;
        preliminaryCaveat?: string;
        clientFacingVersionLabel?: string;
        outputRole?: string;
        provenanceCategory?: string;
        primaryEditableRecordLabel?: string;
        pairedVisualCompanionArtifactId?: string;
        visualCompanionArtifactType?: string;
        moveContextExtract?: unknown;
        evidenceSnapshotHash?: string;
        phaseEvidenceSnapshotHash?: string;
        evidenceSnapshotScope?: string;
        phase?: number | string;
      };
      const contextExtract = contextExtractFromMetadata(
        meta?.moveContextExtract,
      );
      if (contextExtract?.freshness) {
        const savedRevision = contextExtract.freshness.approvedEvidenceRevision;
        contextExtract.freshness.currentApprovedEvidenceCount =
          approvedSnapshot?.approvedEvidenceCount;
        contextExtract.freshness.freshnessStatus = !savedRevision
          ? "rebuild_required"
          : isApprovedMoveEvidenceBasisCurrent({
                snapshot: approvedSnapshot,
                phase: contextExtract.targetPhase ?? r.phase ?? 0,
                recordedRevision: savedRevision,
                scope: contextExtract.freshness.approvedEvidenceRevisionScope,
                generatedAt: contextExtract.freshness.createdAt,
              })
            ? "fresh"
            : "stale";
      }
      const artifactPhase =
        r.phase ?? phaseFromGeneratedArtifactMetadata(meta) ?? 0;
      const evidenceSnapshotStatus =
        r.artifact_family === "generated_deliverable"
          ? !approvedSnapshot || !meta?.evidenceSnapshotHash
            ? "unverified"
            : isApprovedMoveEvidenceBasisCurrent({
                  snapshot: approvedSnapshot,
                  phase: artifactPhase,
                  recordedRevision:
                    typeof meta.phaseEvidenceSnapshotHash === "string"
                      ? meta.phaseEvidenceSnapshotHash
                      : meta.evidenceSnapshotHash,
                  scope:
                    typeof meta.evidenceSnapshotScope === "string"
                      ? meta.evidenceSnapshotScope
                      : null,
                  generatedAt: r.generated_at ?? r.created_at,
                })
              ? "current"
              : "stale"
          : undefined;
      return {
        artifactId: r.artifact_id,
        artifactType: r.artifact_type,
        deliverableTypeKey: deliverableKeyFromMoveArtifactMetadata(meta),
        family: r.artifact_family,
        title: r.title,
        phase: r.phase,
        fileFormat: r.file_format,
        fileName: r.file_name,
        version: r.version,
        status: fixtureControl ? "quarantined" : r.status,
        lifecycleState: r.lifecycle_state,
        qualityScore: qualityScoreForDisplay(r.quality_score),
        unsupportedClaims: r.unsupported_claims_count,
        generatedBy: r.generated_by,
        createdAt: r.created_at,
        fileSize: r.file_size,
        stored: meta?.storage ?? null,
        openItems: fixtureControl
          ? [
              "Smoke-test control language detected; keep this packet in test evidence, not client deliverables.",
              ...(meta?.openItems ?? []),
            ]
          : (meta?.openItems ?? []),
        reviewStatus: meta?.reviewStatus ?? null,
        feedbackStatus: meta?.feedbackStatus ?? null,
        feedbackItemCount: meta?.feedbackItemCount ?? null,
        regeneratedFromArtifactId: meta?.regeneratedFromArtifactId ?? null,
        qualityStatus: meta?.qualityStatus ?? null,
        goldenBarStatus: meta?.goldenBarStatus ?? null,
        artifactStatus: fixtureControl
          ? "fixture_control_quarantined"
          : (meta?.artifactStatus ?? null),
        preliminaryCaveat: fixtureControl
          ? "This packet contains smoke-test control instructions. It is not a client deliverable until replaced by evidence-backed content."
          : (meta?.preliminaryCaveat ?? null),
        clientFacingVersionLabel: meta?.clientFacingVersionLabel ?? null,
        outputRole: meta?.outputRole ?? null,
        provenanceCategory: meta?.provenanceCategory ?? null,
        primaryEditableRecordLabel: meta?.primaryEditableRecordLabel ?? null,
        pairedVisualCompanionArtifactId:
          meta?.pairedVisualCompanionArtifactId ?? null,
        visualCompanionArtifactType: meta?.visualCompanionArtifactType ?? null,
        contextExtract,
        ...(evidenceSnapshotStatus ? { evidenceSnapshotStatus } : {}),
        downloadUrl: `/api/v1/programs/${programId}/artifacts/${r.artifact_id}/download`,
      };
    });

    // Also surface the governed generated_artifacts (the real output of Approve &
    // Build / the orchestrator) — the durable move_artifacts vault often does not
    // mirror them, so the Cabinet would otherwise look near-empty. These are the
    // "generated_deliverable" family; only included when that family is selected
    // (or no family filter is applied). De-duped against move_artifacts by id.
    let generated: CabinetArtifact[] = [];
    if (!family || family === "generated_deliverable") {
      try {
        const recs = await listGeneratedArtifactsForMoveAllRefs({
          clientId: ctx.clientId,
          clientIds: [ctx.clientKey].filter(
            (clientId): clientId is string => typeof clientId === "string",
          ),
          moveId: programId,
        });
        const seen = new Set(moveArtifacts.map((a) => a.artifactId));
        generated = (currentOnly ? filterCurrentGeneratedArtifacts(recs) : recs)
          .filter((rec) => !seen.has(rec.id))
          .map((rec) => {
            const meta = rec.metadata as {
              renderableDoc?: { title?: string };
              phase?: number | string;
              deliverableTypeKey?: string;
              deliverableType?: string;
              registryKey?: string;
              qualityStatus?: string;
              goldenBarStatus?: string;
              artifactStatus?: string;
              outputRole?: string;
              provenanceCategory?: string;
              evidenceSnapshotHash?: string;
              phaseEvidenceSnapshotHash?: string;
              evidenceSnapshotScope?: string;
            } | null;
            const generatedPhase =
              phaseFromGeneratedArtifactMetadata(meta) ?? 0;
            const generatedEvidenceBasisCurrent =
              isApprovedMoveEvidenceBasisCurrent({
                snapshot: approvedSnapshot,
                phase: generatedPhase,
                recordedRevision:
                  typeof meta?.phaseEvidenceSnapshotHash === "string"
                    ? meta.phaseEvidenceSnapshotHash
                    : typeof meta?.evidenceSnapshotHash === "string"
                      ? meta.evidenceSnapshotHash
                      : null,
                scope:
                  typeof meta?.evidenceSnapshotScope === "string"
                    ? meta.evidenceSnapshotScope
                    : null,
                generatedAt: rec.renderedAt,
              });
            return {
              artifactId: rec.id,
              artifactType: rec.artifactType,
              deliverableTypeKey:
                deliverableKeyFromGeneratedArtifactMetadata(meta),
              family: "generated_deliverable",
              title: meta?.renderableDoc?.title ?? rec.artifactType,
              phase: phaseFromGeneratedArtifactMetadata(meta),
              fileFormat: rec.outputFormat,
              fileName: null,
              version: 1,
              status: rec.supersededBy
                ? "superseded"
                : rec.quarantineReason
                  ? "quarantined"
                  : "board_ready",
              // Generated deliverables are current unless a newer version
              // supersedes them. Without this the Cabinet's lifecycle filter
              // (lifecycleState === 'current') hid every generated artifact by
              // default, so a freshly-built charter showed "No artifacts yet".
              lifecycleState: rec.supersededBy ? "superseded" : "current",
              // Normalize quality to the 0–100 the Cabinet renders ("/100"):
              // the orchestrator stores 0–1, move_artifacts store 0–100.
              qualityScore: qualityScoreForDisplay(rec.qualityScore),
              qualityStatus: meta?.qualityStatus ?? null,
              goldenBarStatus: meta?.goldenBarStatus ?? null,
              artifactStatus: meta?.artifactStatus ?? null,
              outputRole: meta?.outputRole ?? null,
              provenanceCategory: meta?.provenanceCategory ?? null,
              evidenceSnapshotStatus:
                !approvedSnapshot || !meta?.evidenceSnapshotHash
                  ? "unverified"
                  : generatedEvidenceBasisCurrent
                    ? "current"
                    : "stale",
              generatedBy: rec.renderedBy,
              createdAt: rec.renderedAt,
              downloadUrl: `/api/v1/artifacts/${rec.id}`,
            };
          });
      } catch (err) {
        // Non-fatal: the Cabinet still renders the move_artifacts vault if the
        // generated_artifacts read fails (e.g. transient DB issue).
        console.error(
          "[GET /programs/:id/artifacts] generated_artifacts merge failed",
          err,
        );
      }
    }

    const mergedArtifacts = [...generated, ...moveArtifacts];
    const artifacts = (
      currentOnly
        ? filterCurrentCabinetArtifacts(mergedArtifacts)
        : mergedArtifacts
    ).sort((a, b) => artifactTime(b.createdAt) - artifactTime(a.createdAt));

    return Response.json({
      ok: true,
      count: artifacts.length,
      artifacts,
      pendingEvidenceReviews: evidenceReviewQueue.items,
      reviewedEvidence: reviewedEvidenceList.items,
      evidenceReviewStatus: evidenceReviewQueue.available
        ? "available"
        : "unavailable",
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
