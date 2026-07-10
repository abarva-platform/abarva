import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import type { MoveArtifactRow } from "@/lib/programs/deliverables/move-artifacts";
import type {
  WorkspaceItem,
  WorkspaceItemKind,
  WorkspaceItemState,
} from "./types";

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  const asString = String(value);
  return asString === "[object Object]" ? null : asString;
}

function moveArtifactKind(row: MoveArtifactRow): WorkspaceItemKind {
  if (row.artifact_family === "generated_deliverable") return "deliverable";
  if (row.artifact_family === "approval_artifact") return "approval";
  if (row.artifact_family === "template") return "input";
  if (row.artifact_family === "uploaded_evidence") return "evidence";
  return "attachment";
}

function moveArtifactState(row: MoveArtifactRow): WorkspaceItemState {
  if (row.lifecycle_state === "superseded" || row.status === "superseded") {
    return "superseded";
  }
  if (row.status === "blocked") return "blocked";
  if (row.status === "approved") return "approved";
  if (
    row.status === "legal_review_required" ||
    row.status === "procurement_review_required" ||
    row.status === "issue_ready"
  ) {
    return "review";
  }
  if (row.artifact_family === "uploaded_evidence") return "loaded";
  return "draft";
}

export function moveArtifactToWorkspaceItem(
  row: MoveArtifactRow,
): WorkspaceItem {
  const kind = moveArtifactKind(row);
  return {
    id: `move-artifact:${row.artifact_id}`,
    name: row.title || row.file_name,
    module: "moves",
    type: row.artifact_type,
    kind,
    origin:
      row.artifact_family === "generated_deliverable"
        ? "generated"
        : "uploaded",
    state: moveArtifactState(row),
    version: row.version,
    stageKey: row.phase === null ? null : `P${row.phase}`,
    artifactCode: row.artifact_type,
    sourceLabel: "Move File Cabinet",
    description: `${humanizeToken(row.artifact_family)} · ${row.file_name}`,
    href: `/api/v1/programs/${encodeURIComponent(
      row.move_id,
    )}/artifacts/${encodeURIComponent(row.artifact_id)}/download`,
    classification: null,
    lineage: { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdBy: row.generated_by,
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.generated_at ?? row.created_at),
    },
    blobPath: row.blob_path,
  };
}

export function generatedMoveArtifactToWorkspaceItem(
  record: GeneratedArtifactRecord,
): WorkspaceItem {
  const title =
    typeof record.metadata.title === "string" && record.metadata.title
      ? record.metadata.title
      : humanizeToken(record.artifactType);
  const moveId =
    typeof record.metadata.moveId === "string" ? record.metadata.moveId : "";
  const artifactId =
    typeof record.metadata.artifactId === "string"
      ? record.metadata.artifactId
      : record.sourceArtifactRef;
  return {
    id: `generated-artifact:${record.id}`,
    name: title,
    module: "moves",
    type: record.artifactType,
    kind: "deliverable",
    origin: "generated",
    state: "draft",
    version: null,
    stageKey: null,
    artifactCode: artifactId,
    sourceLabel: "generated_artifacts",
    description: `Generated ${record.outputFormat} · quality ${
      record.qualityScore ?? "not scored"
    }`,
    href:
      record.blobUrl || `/api/v1/artifacts/${encodeURIComponent(record.id)}`,
    classification: null,
    lineage:
      record.citedInputIds.length > 0
        ? { cites: record.citedInputIds, usedBy: [], status: "recorded" }
        : { cites: [], usedBy: [], status: "not_recorded" },
    audit: {
      createdBy: record.renderedBy,
      createdAt: normalizeTimestamp(record.renderedAt),
      updatedBy: record.renderedBy,
      updatedAt: normalizeTimestamp(record.renderedAt),
    },
    blobPath: moveId ? `generated_artifacts:${moveId}` : null,
  };
}

export function buildMovesWorkspaceItems(args: {
  moveArtifacts: MoveArtifactRow[];
  generatedArtifacts: GeneratedArtifactRecord[];
}): WorkspaceItem[] {
  return [
    ...args.generatedArtifacts.map(generatedMoveArtifactToWorkspaceItem),
    ...args.moveArtifacts.map(moveArtifactToWorkspaceItem),
  ].sort((a, b) => {
    const aUpdated = normalizeTimestamp(a.audit.updatedAt ?? a.audit.createdAt) ?? "";
    const bUpdated = normalizeTimestamp(b.audit.updatedAt ?? b.audit.createdAt) ?? "";
    return bUpdated.localeCompare(aUpdated);
  });
}
