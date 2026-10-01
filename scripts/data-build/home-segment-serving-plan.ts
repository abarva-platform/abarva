import crypto from "node:crypto";
import path from "node:path";

import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";

export type EclSourceFile = {
  id: string;
  tenantKey: string;
  assessmentId: string;
  fileName: string;
  fileHash: string;
  qualityState: string;
};

export type EclSourceRecord = {
  id: string;
  tenantKey: string;
  assessmentId: string;
  sourceFileId: string;
  nativeId: string | null;
  rowNumber: number | null;
  parseState: string;
};

export type EclSnapshotProof = {
  id: string;
  tenantKey: string;
  assessmentId: string;
  sourceHash: string;
  qualityState: string;
};

export type EclProjectionProof = {
  tenantKey: string;
  assessmentId: string;
  snapshotId: string;
  projectionKey: string;
  sourceHash: string;
  projectionHash: string;
  qualityState: string;
};

export type SegmentSourceSetBinding = {
  tenantKey: string;
  assessmentId: string;
  reviewState: "approved" | "candidate";
  sourceSetHash: string;
  files: Readonly<Record<string, string>>;
  snapshot: EclSnapshotProof;
  projection: EclProjectionProof;
};

export type DeclaredSegmentEdge = {
  tenantKey: string;
  relationshipId: string;
  normalizedRelationshipType: string;
  fromNodeId: string;
  toNodeId: string;
  sourceFile: string;
  sourceRowNumber: string;
  evidenceBasis: string;
  knownGaps: string;
  disposition: string;
};

export type SegmentServingCandidate = {
  canonicalObjectKey: string;
  segmentName: string;
  revenueSharePct: number | null;
  revenueUsd: number | null;
  declaredOwnerRole: string | null;
  qualityStatus: "valid" | "warning";
  sourceRecordId: string;
  linkedFunctions: Array<{
    canonicalObjectKey: string;
    functionName: string;
    relationshipId: string;
    sourceRecordId: string;
  }>;
};

export type SegmentServingPlan = {
  sourceSet:
    | { state: "verified"; hash: string; reason: null }
    | { state: "blocked"; hash: string | null; reason: string };
  candidates: SegmentServingCandidate[];
  withheld: Array<{ objectKey: string; reason: string }>;
};

type Input = {
  tenantKey: string;
  assessmentId: string;
  records: readonly CanonicalIngestionRecord[];
  edges: readonly DeclaredSegmentEdge[];
  expectedSourceHashes: Readonly<Record<string, string>>;
  sourceSetBinding: SegmentSourceSetBinding | null;
  targetSnapshot: EclSnapshotProof | null;
  targetProjection: EclProjectionProof | null;
  sourceFiles: readonly EclSourceFile[];
  sourceRecords: readonly EclSourceRecord[];
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nonnegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function percentage(value: unknown): number | null {
  const number = nonnegativeNumber(value);
  return number !== null && number <= 100 ? number : null;
}

function sourcePath(record: CanonicalIngestionRecord): string | null {
  return text(record.attributes.sourcePath?.value);
}

function sourceRow(record: CanonicalIngestionRecord): number | null {
  const value = record.attributes.sourceRowNumber?.value;
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function sourceSetFiles(
  files: Readonly<Record<string, string>>,
): Array<[string, string]> | null {
  const entries = Object.entries(files);
  if (entries.length === 0) return null;
  const names = new Set<string>();
  const normalized: Array<[string, string]> = [];
  for (const [filePath, fileHash] of entries) {
    const name = path.posix.basename(filePath);
    if (
      !filePath ||
      name === "." ||
      path.posix.isAbsolute(filePath) ||
      path.posix.normalize(filePath) !== filePath ||
      filePath.split("/").includes("..") ||
      names.has(name) ||
      !/^[a-f0-9]{64}$/.test(fileHash)
    )
      return null;
    names.add(name);
    normalized.push([filePath, fileHash]);
  }
  return normalized.sort(([left], [right]) => left.localeCompare(right));
}

export function homeSegmentSourceSetHash(
  files: Readonly<Record<string, string>>,
): string | null {
  const normalized = sourceSetFiles(files);
  return normalized
    ? crypto
        .createHash("sha256")
        .update(JSON.stringify(normalized))
        .digest("hex")
    : null;
}

function verifySourceSet(input: Input): SegmentServingPlan["sourceSet"] {
  const binding = input.sourceSetBinding;
  const snapshot = input.targetSnapshot;
  const projection = input.targetProjection;
  const expected = sourceSetFiles(input.expectedSourceHashes);
  const reviewed = binding && sourceSetFiles(binding.files);
  const hash = homeSegmentSourceSetHash(input.expectedSourceHashes);
  if (
    !binding ||
    !binding.snapshot ||
    !binding.projection ||
    !snapshot ||
    !projection ||
    !expected ||
    !reviewed ||
    !hash
  )
    return { state: "blocked", hash: null, reason: "source-set-proof-missing" };
  if (
    binding.tenantKey !== input.tenantKey ||
    binding.assessmentId !== input.assessmentId ||
    binding.reviewState !== "approved" ||
    binding.sourceSetHash !== hash ||
    JSON.stringify(reviewed) !== JSON.stringify(expected)
  )
    return { state: "blocked", hash, reason: "reviewed-source-set-mismatch" };
  if (
    binding.snapshot.tenantKey !== input.tenantKey ||
    binding.snapshot.assessmentId !== input.assessmentId ||
    !binding.snapshot.id ||
    binding.snapshot.qualityState !== "passed" ||
    !/^[a-f0-9]{64}$/.test(binding.snapshot.sourceHash) ||
    snapshot.id !== binding.snapshot.id ||
    snapshot.tenantKey !== binding.snapshot.tenantKey ||
    snapshot.assessmentId !== binding.snapshot.assessmentId ||
    snapshot.sourceHash !== binding.snapshot.sourceHash ||
    snapshot.qualityState !== binding.snapshot.qualityState ||
    binding.projection.tenantKey !== input.tenantKey ||
    binding.projection.assessmentId !== input.assessmentId ||
    binding.projection.snapshotId !== binding.snapshot.id ||
    binding.projection.projectionKey !== "home_enterprise_landscape" ||
    binding.projection.qualityState !== "passed" ||
    !/^[a-f0-9]{64}$/.test(binding.projection.sourceHash) ||
    !/^[a-f0-9]{64}$/.test(binding.projection.projectionHash) ||
    projection.tenantKey !== binding.projection.tenantKey ||
    projection.assessmentId !== binding.projection.assessmentId ||
    projection.snapshotId !== binding.projection.snapshotId ||
    projection.projectionKey !== binding.projection.projectionKey ||
    projection.sourceHash !== binding.projection.sourceHash ||
    projection.projectionHash !== binding.projection.projectionHash ||
    projection.qualityState !== binding.projection.qualityState
  )
    return { state: "blocked", hash, reason: "target-snapshot-mismatch" };
  const expectedCatalog = expected
    .map(([filePath, fileHash]) => [path.posix.basename(filePath), fileHash])
    .sort(([left], [right]) => left.localeCompare(right));
  const catalog = input.sourceFiles
    .filter(
      (file) =>
        file.tenantKey === input.tenantKey &&
        file.assessmentId === input.assessmentId,
    )
    .map((file) => [file.fileName, file.fileHash, file.qualityState])
    .sort(([left], [right]) => left.localeCompare(right));
  if (
    JSON.stringify(catalog) !==
    JSON.stringify(
      expectedCatalog.map(([name, fileHash]) => [name, fileHash, "accepted"]),
    )
  )
    return { state: "blocked", hash, reason: "source-catalog-mismatch" };
  return { state: "verified", hash, reason: null };
}

function verifiedSourceRecord(
  input: Input,
  record: CanonicalIngestionRecord,
): string | null {
  const filePath = sourcePath(record);
  const row = sourceRow(record);
  if (!filePath || !row || !record.sourceObjectId) return null;
  const expectedHash = input.expectedSourceHashes[filePath];
  if (!expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash)) return null;
  const files = input.sourceFiles.filter(
    (file) =>
      file.tenantKey === input.tenantKey &&
      file.assessmentId === input.assessmentId &&
      file.fileName === path.posix.basename(filePath) &&
      file.fileHash === expectedHash &&
      file.qualityState === "accepted",
  );
  if (files.length !== 1) return null;
  const rows = input.sourceRecords.filter(
    (source) =>
      source.tenantKey === input.tenantKey &&
      source.assessmentId === input.assessmentId &&
      source.sourceFileId === files[0].id &&
      source.rowNumber === row &&
      source.nativeId === record.sourceObjectId &&
      source.parseState === "parsed",
  );
  return rows.length === 1 ? rows[0].id : null;
}

function isDeclaredEdge(edge: DeclaredSegmentEdge): boolean {
  return (
    edge.normalizedRelationshipType === "BELONGS_TO_SEGMENT" &&
    edge.disposition === "declared-canonical-relationship" &&
    edge.knownGaps === "" &&
    edge.fromNodeId !== "" &&
    edge.toNodeId !== ""
  );
}

/** A review candidate only; source hashes and catalog rows must come from separately governed reads. */
export function buildHomeSegmentServingPlan(input: Input): SegmentServingPlan {
  const sourceSet = verifySourceSet(input);
  if (sourceSet.state === "blocked") {
    return {
      sourceSet,
      candidates: [],
      withheld: input.records
        .filter(
          (record) =>
            record.tenantKey === input.tenantKey &&
            (record.objectType === "business_segment" ||
              record.objectType === "business_function"),
        )
        .map((record) => ({
          objectKey: record.canonicalObjectKey ?? record.sourceObjectId,
          reason: sourceSet.reason,
        }))
        .sort((left, right) => left.objectKey.localeCompare(right.objectKey)),
    };
  }
  const withheld: SegmentServingPlan["withheld"] = [];
  const verified = new Map<
    string,
    { record: CanonicalIngestionRecord; sourceRecordId: string }
  >();
  const relevant = input.records.filter(
    (record) =>
      record.tenantKey === input.tenantKey &&
      (record.objectType === "business_segment" ||
        record.objectType === "business_function"),
  );
  const keyCounts = new Map<string, number>();
  for (const record of relevant) {
    if (record.canonicalObjectKey) {
      keyCounts.set(
        record.canonicalObjectKey,
        (keyCounts.get(record.canonicalObjectKey) ?? 0) + 1,
      );
    }
  }
  for (const record of relevant) {
    const key = record.canonicalObjectKey;
    if (record.qualityStatus === "quarantined") {
      withheld.push({
        objectKey: key ?? record.sourceObjectId,
        reason: "canonical-quality-quarantined",
      });
      continue;
    }
    if (!key || keyCounts.get(key) !== 1) {
      withheld.push({
        objectKey: key ?? record.sourceObjectId,
        reason: "canonical-identity-not-unique",
      });
      continue;
    }
    const sourceRecordId = verifiedSourceRecord(input, record);
    if (!sourceRecordId) {
      withheld.push({ objectKey: key, reason: "source-record-not-verified" });
      continue;
    }
    verified.set(key, { record, sourceRecordId });
  }

  const edgesByFunction = new Map<string, DeclaredSegmentEdge[]>();
  for (const edge of input.edges) {
    if (
      edge.tenantKey !== input.tenantKey ||
      edge.normalizedRelationshipType !== "BELONGS_TO_SEGMENT"
    )
      continue;
    if (!edge.fromNodeId) {
      withheld.push({
        objectKey: edge.relationshipId,
        reason: "segment-edge-unresolved",
      });
      continue;
    }
    edgesByFunction.set(edge.fromNodeId, [
      ...(edgesByFunction.get(edge.fromNodeId) ?? []),
      edge,
    ]);
  }
  const linkedBySegment = new Map<
    string,
    SegmentServingCandidate["linkedFunctions"]
  >();
  for (const [functionKey, source] of verified) {
    if (source.record.objectType !== "business_function") continue;
    const edges = edgesByFunction.get(functionKey) ?? [];
    if (edges.length === 0) {
      withheld.push({
        objectKey: functionKey,
        reason: "segment-relationship-missing",
      });
      continue;
    }
    if (edges.length !== 1) {
      withheld.push({
        objectKey: functionKey,
        reason: "segment-relationship-not-unique",
      });
      continue;
    }
    const edge = edges[0];
    const target = verified.get(edge.toNodeId);
    if (
      !target ||
      target.record.objectType !== "business_segment" ||
      !isDeclaredEdge(edge) ||
      edge.sourceFile !== sourcePath(source.record) ||
      Number(edge.sourceRowNumber) !== sourceRow(source.record) ||
      !source.record.evidenceReferences.some(
        (ref) => ref.evidenceKey === edge.evidenceBasis,
      )
    ) {
      withheld.push({
        objectKey: functionKey,
        reason: "segment-relationship-not-verified",
      });
      continue;
    }
    const functionName = text(source.record.attributes.displayName?.value);
    if (!functionName) {
      withheld.push({
        objectKey: functionKey,
        reason: "function-name-missing",
      });
      continue;
    }
    linkedBySegment.set(edge.toNodeId, [
      ...(linkedBySegment.get(edge.toNodeId) ?? []),
      {
        canonicalObjectKey: functionKey,
        functionName,
        relationshipId: edge.relationshipId,
        sourceRecordId: source.sourceRecordId,
      },
    ]);
  }

  const candidates: SegmentServingCandidate[] = [];
  for (const [key, { record, sourceRecordId }] of verified) {
    if (record.objectType !== "business_segment") continue;
    if (record.qualityStatus === "quarantined") {
      withheld.push({
        objectKey: key,
        reason: "canonical-quality-quarantined",
      });
      continue;
    }
    const segmentName = text(record.attributes.displayName?.value);
    if (!segmentName) {
      withheld.push({ objectKey: key, reason: "segment-name-missing" });
      continue;
    }
    candidates.push({
      canonicalObjectKey: key,
      segmentName,
      revenueSharePct: percentage(record.attributes.revenueSharePct?.value),
      revenueUsd: nonnegativeNumber(record.attributes.revenueUsd?.value),
      declaredOwnerRole: text(record.attributes.pnlOwnerRole?.value),
      qualityStatus: record.qualityStatus,
      sourceRecordId,
      linkedFunctions: (linkedBySegment.get(key) ?? []).sort((left, right) =>
        left.functionName.localeCompare(right.functionName),
      ),
    });
  }
  candidates.sort((left, right) =>
    left.segmentName.localeCompare(right.segmentName),
  );
  withheld.sort(
    (left, right) =>
      left.objectKey.localeCompare(right.objectKey) ||
      left.reason.localeCompare(right.reason),
  );
  return { sourceSet, candidates, withheld };
}
