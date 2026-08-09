// GET /api/v1/source/events/{eventId}/artifacts
//
// File Cabinet listing for a Source event. Tenant-scoped. Returns the current versions
// by default; ?includeHistory=1 includes superseded/retired. Optional ?group= and
// ?status= filters.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { artifactDisplayName } from "@/lib/source/artifact-display-names";
import {
  listSourceArtifactsForSourceEventId,
  type SourceArtifactRegistryRecord,
} from "@/lib/source/artifact-registry";
import { listArtifactStatesForEvent } from "@/lib/source/canvas-substrate/queries";
import { specByCode } from "@/lib/source/canonical-specs";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import type {
  ArtifactFileFormat,
  ArtifactGroup,
  ArtifactStatus,
  SourceArtifactRecord,
} from "@/lib/source/file-cabinet/types";
import { resolveAuthoritativeArtifactSlots } from "@/lib/source/client-final-artifacts";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { loadContractEvidenceRuntimeSummary } from "@/lib/source/contract-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROUPS: ArtifactGroup[] = [
  "generated",
  "upload",
  "template",
  "session",
  "approval",
];
const EXPORT_READY_ARTIFACTS: Record<
  string,
  { fileFormat: ArtifactFileFormat; fileName: string; status: ArtifactStatus }
> = {
  d09_rfp_pack: {
    fileFormat: "docx",
    fileName: "D09 Client RFP Pack.docx",
    status: "issue_ready",
  },
  d11_response_checklist: {
    fileFormat: "xlsx",
    fileName: "D11 Vendor Response Workbook.xlsx",
    status: "issue_ready",
  },
  d16_scorecard: {
    fileFormat: "xlsx",
    fileName: "D16 Normalized Evaluation Scorecard.xlsx",
    status: "issue_ready",
  },
  d22_bafo_question_pack: {
    fileFormat: "docx",
    fileName: "D22 BAFO Question Pack.docx",
    status: "issue_ready",
  },
  d24_decision_brief: {
    fileFormat: "pdf",
    fileName: "D24 Executive Decision Brief.pdf",
    status: "issue_ready",
  },
};

export async function GET(
  req: NextRequest,
  ctxParam: { params: Promise<{ eventId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim()) {
      return Response.json(
        { error: "bad_request", detail: "eventId is required." },
        { status: 400 },
      );
    }
    const url = new URL(req.url);
    const groupParam = url.searchParams.get("group");
    const statusParam = url.searchParams.get("status");
    const includeHistory = url.searchParams.get("includeHistory") === "1";

    const artifacts = await listSourceArtifacts(eventId, ctx.clientId, {
      includeHistory,
      ...(groupParam && GROUPS.includes(groupParam as ArtifactGroup)
        ? { artifactGroup: groupParam as ArtifactGroup }
        : {}),
      ...(statusParam ? { status: statusParam as ArtifactStatus } : {}),
    });
    const generatedStateArtifacts = await listGeneratedArtifactStateFallbacks({
      sourceEventId: eventId,
      clientId: ctx.clientId,
      tenantKey: ctx.clientKey ?? ctx.clientId,
      existingArtifacts: artifacts,
      includeHistory,
      groupParam,
      statusParam,
    });
    const registryArtifacts = await listRegistryArtifactFallbacks({
      sourceEventId: eventId,
      clientId: ctx.clientId,
      tenantKey: ctx.clientKey ?? ctx.clientId,
      existingArtifacts: [...artifacts, ...generatedStateArtifacts],
      includeHistory,
      groupParam,
      statusParam,
    });
    const resolvedArtifacts = [
      ...artifacts,
      ...generatedStateArtifacts,
      ...registryArtifacts,
    ];
    const visibleArtifacts = includeHistory
      ? resolvedArtifacts
      : resolveVisibleAuthoritativeArtifacts(resolvedArtifacts);

    // group for the File Cabinet UI
    const grouped: Record<string, typeof visibleArtifacts> = {
      generated: [],
      upload: [],
      template: [],
      session: [],
      approval: [],
    };
    for (const a of visibleArtifacts) (grouped[a.artifactGroup] ??= []).push(a);
    const structuredEvidence = await loadContractEvidenceRuntimeSummary({
      db: getAzureReadFluentClient(),
      tenantKey: ctx.clientKey ?? ctx.clientId,
      sourceEventId: eventId,
    });

    return Response.json({
      sourceEventId: eventId,
      count: visibleArtifacts.length,
      includeHistory,
      artifacts: visibleArtifacts,
      grouped,
      structuredEvidence,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/source/events/[eventId]/artifacts]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

function resolveVisibleAuthoritativeArtifacts(
  artifacts: SourceArtifactRecord[],
): SourceArtifactRecord[] {
  const slots = resolveAuthoritativeArtifactSlots(
    artifacts,
    sourceArtifactListingSlotKey,
  );
  const visibleIds = new Set(slots.map((slot) => slot.authoritative.id));
  return artifacts.filter((artifact) => visibleIds.has(artifact.id));
}

function sourceArtifactListingSlotKey(artifact: SourceArtifactRecord): string {
  return `${artifact.sourcingStage ?? "unknown"}::${artifact.artifactType}`;
}

async function listGeneratedArtifactStateFallbacks(args: {
  sourceEventId: string;
  clientId: string;
  tenantKey: string;
  existingArtifacts: SourceArtifactRecord[];
  includeHistory: boolean;
  groupParam: string | null;
  statusParam: string | null;
}): Promise<SourceArtifactRecord[]> {
  if (args.groupParam && args.groupParam !== "generated") return [];
  const existingIds = new Set(
    args.existingArtifacts.map((artifact) => artifact.id),
  );
  const existingSourceBasis = new Set(
    args.existingArtifacts
      .map((artifact) => artifact.sourceBasis)
      .filter((basis): basis is string => Boolean(basis)),
  );
  const states = await listArtifactStatesForEvent(args.sourceEventId);
  const fallbackArtifacts: SourceArtifactRecord[] = [];
  for (const state of states) {
    if (!state.linkedArtifactId) continue;
    if (existingIds.has(state.linkedArtifactId)) continue;
    if (existingSourceBasis.has(`source_event_artifact_states:${state.id}`))
      continue;
    if (!args.includeHistory && state.status === "superseded") continue;
    const spec = specByCode(state.artifactCode);
    const exportReady = EXPORT_READY_ARTIFACTS[state.artifactCode];
    const status = exportReady?.status ?? mapArtifactStateStatus(state.status);
    if (args.statusParam && args.statusParam !== status) continue;
    const title = artifactDisplayName(state.artifactCode, spec?.name);
    const updatedAt = state.bodyUpdatedAt ?? state.updatedAt;
    fallbackArtifacts.push({
      id: state.linkedArtifactId,
      clientId: args.clientId,
      tenantKey: args.tenantKey,
      sourceEventId: args.sourceEventId,
      sourcingStage: state.stage,
      artifactGroup: "generated",
      artifactType: state.artifactCode,
      artifactFamily: state.family,
      title,
      description: exportReady
        ? `${title} is export-ready from the governed render path. The inline markdown body is retained as source lineage.`
        : (spec?.description ?? "Generated Source deliverable."),
      fileName: exportReady?.fileName ?? `${state.artifactCode}.md`,
      fileFormat: exportReady?.fileFormat ?? "md",
      blobContainer: "source-artifacts",
      blobPath: `inline://source-event-artifact-state/${state.id}`,
      fileSize: exportReady
        ? null
        : state.body
          ? Buffer.byteLength(state.body, "utf8")
          : null,
      version: 1,
      status,
      generatedBy: state.bodyAuthoredBy,
      generatedAt: updatedAt,
      sourceBasis: `source_event_artifact_states:${state.id}`,
      confidence: exportReady ? "high" : null,
      citationReady: Boolean(state.body?.trim()),
      evidenceFamiliesUsed: [],
      sourceRegisterId: state.linkedArtifactId,
      contextBundleTraceId: null,
      approvalState: null,
      approvedBy: null,
      approvedAt: null,
      maestroOverrideId: null,
      missingInputs: [],
      clientCompleteItems: [],
      assumptions: [],
      supersedesArtifactId: null,
      supersededByArtifactId: null,
      lifecycleState: state.status === "superseded" ? "superseded" : "current",
      blobSha256: null,
      isClientFinal: false,
      isCurrentAuthoritative: false,
      sourceGeneratedArtifactId: null,
      clientFinalUploadedBy: null,
      clientFinalUploadedAt: null,
      clientFinalAcceptedBy: null,
      clientFinalAcceptedAt: null,
      clientFinalNote: null,
      clientFinalReviewMeetingDate: null,
      clientFinalStakeholderGroup: null,
      clientFinalChangeSummary: {},
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    });
  }
  return fallbackArtifacts;
}

async function listRegistryArtifactFallbacks(args: {
  sourceEventId: string;
  clientId: string;
  tenantKey: string;
  existingArtifacts: SourceArtifactRecord[];
  includeHistory: boolean;
  groupParam: string | null;
  statusParam: string | null;
}): Promise<SourceArtifactRecord[]> {
  const existingIds = new Set(
    args.existingArtifacts.map((artifact) => artifact.id),
  );
  const existingSourceBasis = new Set(
    args.existingArtifacts
      .map((artifact) => artifact.sourceBasis)
      .filter((basis): basis is string => Boolean(basis)),
  );
  const allowedTenantAliases = new Set(
    tenantAliasesFor(args.tenantKey)
      .concat(args.tenantKey)
      .map((alias) => alias.trim().toLowerCase()),
  );
  const registryRows = await listSourceArtifactsForSourceEventId(
    args.sourceEventId,
  ).catch((error) => {
    console.warn("[source-file-cabinet] registry artifact fallback failed", {
      sourceEventId: args.sourceEventId,
      message: error instanceof Error ? error.message : String(error),
    });
    return [] as SourceArtifactRegistryRecord[];
  });

  return registryRows
    .filter((artifact) =>
      allowedTenantAliases.has(artifact.tenantKey.trim().toLowerCase()),
    )
    .filter((artifact) => !existingIds.has(artifact.id))
    .filter(
      (artifact) =>
        !existingSourceBasis.has(`source_artifacts:${artifact.id}`) &&
        !existingSourceBasis.has(`source-artifact:${artifact.id}`),
    )
    .filter((artifact) => args.includeHistory || !artifact.deletedAt)
    .map((artifact) => registryArtifactToFileCabinetRecord(artifact, args))
    .filter((artifact): artifact is SourceArtifactRecord => Boolean(artifact))
    .filter(
      (artifact) =>
        !args.groupParam || artifact.artifactGroup === args.groupParam,
    )
    .filter(
      (artifact) => !args.statusParam || artifact.status === args.statusParam,
    );
}

function registryArtifactToFileCabinetRecord(
  artifact: SourceArtifactRegistryRecord,
  args: {
    sourceEventId: string;
    clientId: string;
    tenantKey: string;
  },
): SourceArtifactRecord | null {
  const group = mapRegistryArtifactGroup(artifact.sourceOrigin);
  if (!group) return null;
  const status = mapRegistryArtifactStatus(artifact);
  const title =
    artifactDisplayName(artifact.artifactKind) ||
    artifact.originalName ||
    artifact.artifactKind;

  return {
    id: artifact.id,
    clientId: args.clientId,
    tenantKey: artifact.tenantKey || args.tenantKey,
    sourceEventId: args.sourceEventId,
    sourcingStage: artifact.stageKey,
    artifactGroup: group,
    artifactType: artifact.artifactKind,
    artifactFamily: artifact.artifactFamily,
    title,
    description:
      group === "generated"
        ? "Generated Source deliverable persisted in the Source artifact registry."
        : "Uploaded Source evidence persisted in the Source artifact registry.",
    fileName:
      artifact.originalName ||
      `${artifact.artifactKind}.${artifact.sourceFormat}`,
    fileFormat: mapRegistryFileFormat(artifact.sourceFormat),
    blobContainer: "source-artifacts",
    blobPath: artifact.blobUri || `registry://source_artifacts/${artifact.id}`,
    fileSize: Number.isFinite(artifact.sizeBytes) ? artifact.sizeBytes : null,
    version: artifact.version || 1,
    status,
    generatedBy:
      artifact.sourceOrigin === "generated" ? artifact.createdBy : null,
    generatedAt: artifact.createdAt,
    sourceBasis: `source_artifacts:${artifact.id}`,
    confidence:
      artifact.isCurrentAuthoritative || artifact.parseStatus === "parsed"
        ? "high"
        : "medium",
    citationReady:
      artifact.evidenceState === "cited" ||
      artifact.parseStatus === "parsed" ||
      artifact.sourceOrigin === "generated",
    evidenceFamiliesUsed: [artifact.artifactFamily].filter(Boolean),
    sourceRegisterId: artifact.id,
    contextBundleTraceId: null,
    approvalState: artifact.approvalState,
    approvedBy: artifact.validatedBy,
    approvedAt: null,
    maestroOverrideId: null,
    missingInputs: [],
    clientCompleteItems: [],
    assumptions: [],
    supersedesArtifactId: artifact.supersedesArtifactVersionId,
    supersededByArtifactId: null,
    lifecycleState: artifact.deletedAt ? "retired" : "current",
    blobSha256: artifact.sha256 || null,
    isClientFinal: artifact.isClientFinal === true,
    isCurrentAuthoritative: artifact.isCurrentAuthoritative === true,
    sourceGeneratedArtifactId: artifact.sourceGeneratedArtifactId ?? null,
    clientFinalUploadedBy: artifact.clientFinalUploadedBy ?? null,
    clientFinalUploadedAt: artifact.clientFinalUploadedAt ?? null,
    clientFinalAcceptedBy: artifact.clientFinalAcceptedBy ?? null,
    clientFinalAcceptedAt: artifact.clientFinalAcceptedAt ?? null,
    clientFinalNote: artifact.clientFinalNote ?? null,
    clientFinalReviewMeetingDate: artifact.clientFinalReviewMeetingDate ?? null,
    clientFinalStakeholderGroup: artifact.clientFinalStakeholderGroup ?? null,
    clientFinalChangeSummary: artifact.clientFinalChangeSummary ?? {},
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  };
}

function mapRegistryArtifactGroup(
  origin: SourceArtifactRegistryRecord["sourceOrigin"],
): ArtifactGroup | null {
  if (origin === "generated") return "generated";
  if (
    origin === "uploaded" ||
    origin === "reuploaded" ||
    origin === "imported"
  ) {
    return "upload";
  }
  if (origin === "note_capture") return "session";
  return null;
}

function mapRegistryArtifactStatus(
  artifact: SourceArtifactRegistryRecord,
): ArtifactStatus {
  if (artifact.isClientFinal) return "client_final";
  if (
    artifact.approvalState === "approved" ||
    artifact.approvalState === "locked"
  ) {
    return "approved";
  }
  if (artifact.deletedAt) return "retired";
  if (
    artifact.evidenceState === "challenged" ||
    artifact.parseStatus === "needs_review"
  ) {
    return "preliminary";
  }
  if (artifact.parseStatus === "failed") return "blocked";
  return artifact.sourceOrigin === "generated" ? "draft" : "preliminary";
}

function mapRegistryFileFormat(
  format: SourceArtifactRegistryRecord["sourceFormat"],
): ArtifactFileFormat {
  if (format === "markdown") return "md";
  if (format === "txt") return "md";
  if (
    format === "unknown" ||
    format === "image" ||
    format === "audio" ||
    format === "video"
  ) {
    return "json";
  }
  return format;
}

function mapArtifactStateStatus(status: string): ArtifactStatus {
  if (status === "approved" || status === "locked") return "approved";
  if (status === "superseded") return "superseded";
  if (status === "needs_review") return "preliminary";
  if (status === "drafting") return "draft";
  return "draft";
}
