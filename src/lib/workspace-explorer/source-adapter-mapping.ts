import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import { specByCode } from "@/lib/source/canonical-specs";
import { listSupportedGenerationCodes } from "@/lib/source/agent-generation";
import type {
  SourceArtifactApprovalState,
  SourceArtifactEvidenceState,
  SourceArtifactOrigin,
  SourceArtifactRegistryRecord,
  SourceParseStatus,
} from "@/lib/source/artifact-registry/types";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import type {
  WorkspaceItem,
  WorkspaceItemKind,
  WorkspaceItemOrigin,
  WorkspaceItemState,
  WorkspaceGenerateCandidate,
} from "./types";

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sourceArtifactReviewHref(sourceEventId: string, artifactId: string): string {
  return `/source/events/${encodeURIComponent(
    sourceEventId,
  )}/artifacts/${encodeURIComponent(artifactId)}`;
}

function sourceArtifactDownloadHref(artifactId: string): string {
  return `/api/v1/source/artifacts/${encodeURIComponent(artifactId)}/download`;
}

function sortableAuditTimestamp(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

function originToWorkspaceOrigin(
  origin: SourceArtifactOrigin,
): WorkspaceItemOrigin {
  return origin === "generated" ? "generated" : "uploaded";
}

function registryKind(record: SourceArtifactRegistryRecord): WorkspaceItemKind {
  if (
    record.artifactFamily === "proposal" ||
    record.artifactFamily === "response_checklist" ||
    /vendor|response|proposal/i.test(record.artifactKind)
  ) {
    return "vendor_response";
  }
  if (record.sourceOrigin === "generated") return "deliverable";
  if (record.approvalState !== "not_required") return "approval";
  return "input";
}

function registryState(args: {
  origin: SourceArtifactOrigin;
  parseStatus: SourceParseStatus;
  evidenceState: SourceArtifactEvidenceState;
  approvalState: SourceArtifactApprovalState;
}): WorkspaceItemState {
  const { origin, parseStatus, evidenceState, approvalState } = args;
  if (approvalState === "approved" || approvalState === "locked")
    return "approved";
  if (approvalState === "in_review") return "review";
  if (approvalState === "rejected") return "blocked";
  if (approvalState === "draft" || origin === "generated") return "draft";
  if (evidenceState === "cited") return "usable";
  if (parseStatus === "parsed") return "parsed";
  if (parseStatus === "needs_review" || evidenceState === "challenged")
    return "review";
  if (parseStatus === "failed") return "blocked";
  return "loaded";
}

function artifactStateToWorkspaceState(
  status: SourceEventArtifactState["status"],
): WorkspaceItemState {
  switch (status) {
    case "approved":
    case "locked":
      return "approved";
    case "needs_review":
      return "review";
    case "drafting":
      return "draft";
    case "superseded":
      return "superseded";
    case "not_started":
    default:
      return "missing";
  }
}

function evidenceStateToWorkspaceState(
  state: SourceEventEvidence["currentState"],
): WorkspaceItemState {
  switch (state) {
    case "Usable Evidence":
      return "usable";
    case "Available":
      return "available";
    case "Parsed":
      return "parsed";
    case "Loaded":
      return "loaded";
    case "Low Confidence":
      return "review";
    case "Stale":
      return "blocked";
    case "Not Requested":
    default:
      return "missing";
  }
}

export function sourceRegistryArtifactToWorkspaceItem(
  record: SourceArtifactRegistryRecord,
): WorkspaceItem {
  const citedSourceArtifactIds = record.citedSourceArtifactIds ?? [];
  return {
    id: record.id,
    name: record.originalName,
    module: "source",
    type: record.sourceFormat,
    kind: registryKind(record),
    origin: originToWorkspaceOrigin(record.sourceOrigin),
    state: registryState({
      origin: record.sourceOrigin,
      parseStatus: record.parseStatus,
      evidenceState: record.evidenceState,
      approvalState: record.approvalState,
    }),
    version: record.version,
    stageKey: record.stageKey,
    artifactCode: record.artifactKind,
    sourceLabel: "source_artifacts registry",
    description: `${humanizeToken(record.artifactFamily)} · ${humanizeToken(
      record.artifactKind,
    )}`,
    href: sourceArtifactReviewHref(record.sourceEventId, record.id),
    downloadHref: sourceArtifactDownloadHref(record.id),
    classification: record.dataClassification,
    lineage:
      citedSourceArtifactIds.length > 0
        ? {
            cites: citedSourceArtifactIds,
            usedBy: [],
            status: "recorded",
          }
        : { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedBy: record.validatedBy,
      updatedAt: record.updatedAt,
      approvedBy:
        record.approvalState === "approved" ? record.validatedBy : null,
      approvedAt: record.approvalState === "approved" ? record.updatedAt : null,
    },
    blobPath: record.blobUri,
  };
}

export function sourceArtifactStateToWorkspaceItem(
  artifact: SourceEventArtifactState,
): WorkspaceItem {
  const spec = specByCode(artifact.artifactCode);
  const stageLabel =
    SOURCE_STAGE_LABELS[artifact.stage] ?? humanizeToken(artifact.stage);
  return {
    id: `source-artifact-state:${artifact.id}`,
    name: spec?.name ?? humanizeToken(artifact.artifactCode),
    module: "source",
    type: artifact.family,
    kind: "deliverable",
    origin: "generated",
    state: artifactStateToWorkspaceState(artifact.status),
    version: null,
    stageKey: artifact.stage,
    artifactCode: artifact.artifactCode,
    sourceLabel: "Source canvas substrate",
    description:
      spec?.description ??
      `${stageLabel} work product · ${humanizeToken(artifact.requirementLevel)}`,
    href: artifact.linkedArtifactId
      ? sourceArtifactReviewHref(artifact.sourceEventId, artifact.linkedArtifactId)
      : null,
    downloadHref: artifact.linkedArtifactId
      ? sourceArtifactDownloadHref(artifact.linkedArtifactId)
      : null,
    classification: null,
    lineage: { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdAt: artifact.createdAt,
      updatedBy: artifact.bodyAuthoredBy,
      updatedAt: artifact.updatedAt,
    },
    blobPath: null,
  };
}

export function sourceEvidenceStateToWorkspaceItem(
  evidence: SourceEventEvidence,
): WorkspaceItem {
  const stageLabel =
    SOURCE_STAGE_LABELS[evidence.stage] ?? humanizeToken(evidence.stage);
  return {
    id: `source-evidence:${evidence.id}`,
    name: humanizeToken(evidence.requirementId),
    module: "source",
    type: "evidence",
    kind: "evidence",
    origin: "uploaded",
    state: evidenceStateToWorkspaceState(evidence.currentState),
    version: null,
    stageKey: evidence.stage,
    artifactCode: null,
    sourceLabel: "Source evidence readiness",
    description: evidence.notes ?? `${stageLabel} evidence requirement`,
    href: evidence.sourceArtifactId
      ? sourceArtifactReviewHref(evidence.sourceEventId, evidence.sourceArtifactId)
      : null,
    downloadHref: evidence.sourceArtifactId
      ? sourceArtifactDownloadHref(evidence.sourceArtifactId)
      : null,
    classification: null,
    lineage: evidence.sourceArtifactId
      ? { cites: [evidence.sourceArtifactId], usedBy: [], status: "recorded" }
      : { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    },
    blobPath: null,
  };
}

export function sourceGateCriterionToWorkspaceItem(
  criterion: SourceEventGateCriterion,
): WorkspaceItem {
  return {
    id: `source-gate:${criterion.id}`,
    name: humanizeToken(criterion.criterionId),
    module: "source",
    type: "approval",
    kind: "approval",
    origin: "generated",
    state:
      criterion.state === "met" || criterion.state === "waived"
        ? "approved"
        : criterion.state === "deferred"
          ? "blocked"
          : "review",
    version: null,
    stageKey: criterion.fromStage,
    artifactCode: null,
    sourceLabel: "Source gate criterion",
    description:
      criterion.notes ?? `Required before ${humanizeToken(criterion.toStage)}`,
    href: null,
    classification: null,
    lineage:
      criterion.evidenceArtifactIds.length > 0
        ? {
            cites: criterion.evidenceArtifactIds,
            usedBy: [],
            status: "recorded",
          }
        : { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdAt: criterion.createdAt,
      updatedBy: criterion.reviewerUserId,
      updatedAt: criterion.updatedAt,
      approvedBy: criterion.reviewerUserId,
      approvedAt: criterion.reviewedAt,
    },
    blobPath: null,
  };
}

export function buildSourceGenerateCandidates(args: {
  sourceEventId: string;
  stageKey: string | null;
  artifactStates: SourceEventArtifactState[];
}): WorkspaceGenerateCandidate[] {
  const supportedCodes = new Set(listSupportedGenerationCodes());
  return args.artifactStates
    .filter((artifact) => {
      if (!supportedCodes.has(artifact.artifactCode)) return false;
      if (args.stageKey && artifact.stage !== args.stageKey) return false;
      return artifact.status !== "locked" && artifact.status !== "superseded";
    })
    .map((artifact) => {
      const spec = specByCode(artifact.artifactCode);
      return {
        id: `source-generate:${artifact.artifactCode}`,
        module: "source" as const,
        artifactCode: artifact.artifactCode,
        label: spec?.name ?? humanizeToken(artifact.artifactCode),
        description: spec?.description ?? null,
        stageKey: artifact.stage,
        state: artifactStateToWorkspaceState(artifact.status),
        generateHref: `/api/v1/source/${encodeURIComponent(
          args.sourceEventId,
        )}/artifacts/${encodeURIComponent(artifact.artifactCode)}/generate`,
        reviewHref: `/source/events/${encodeURIComponent(
          args.sourceEventId,
        )}?stage=${encodeURIComponent(artifact.stage)}`,
      };
    })
    .sort((a, b) => {
      const aMissing = a.state === "missing" ? 0 : 1;
      const bMissing = b.state === "missing" ? 0 : 1;
      if (aMissing !== bMissing) return aMissing - bMissing;
      return a.label.localeCompare(b.label);
    });
}

export function buildSourceWorkspaceItems(args: {
  registryArtifacts: SourceArtifactRegistryRecord[];
  artifactStates: SourceEventArtifactState[];
  evidenceStates: SourceEventEvidence[];
  gateCriterionStates: SourceEventGateCriterion[];
}): WorkspaceItem[] {
  const registryIds = new Set(
    args.registryArtifacts.map((record) => record.id),
  );
  return [
    ...args.registryArtifacts.map(sourceRegistryArtifactToWorkspaceItem),
    ...args.artifactStates
      .filter(
        (artifact) =>
          !artifact.linkedArtifactId ||
          !registryIds.has(artifact.linkedArtifactId),
      )
      .map(sourceArtifactStateToWorkspaceItem),
    ...args.evidenceStates.map(sourceEvidenceStateToWorkspaceItem),
  ].sort((a, b) => {
    const aUpdated = sortableAuditTimestamp(
      a.audit.updatedAt ?? a.audit.createdAt,
    );
    const bUpdated = sortableAuditTimestamp(
      b.audit.updatedAt ?? b.audit.createdAt,
    );
    return bUpdated.localeCompare(aUpdated);
  });
}
