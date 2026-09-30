import crypto from "node:crypto";

import type { CanonicalDataBuildReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";

type CsvRow = Record<string, string>;
type Candidate = CanonicalDataBuildReport["relationshipCandidates"][number];

type GraphInput = {
  records: CanonicalIngestionRecord[];
  relationships: Candidate[];
  nodes: CsvRow[];
  edges: CsvRow[];
  quarantine: CsvRow[];
};

function sourcePath(record: CanonicalIngestionRecord): string {
  return String(record.attributes.sourcePath?.value ?? "");
}

function sourceRow(record: CanonicalIngestionRecord): number {
  return Number(record.attributes.sourceRowNumber?.value ?? 0);
}

function sourcePosition(path: string, row: number): string {
  return `${path}:${row}`;
}

function confidenceBand(value: number): string {
  if (value >= 0.8) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

function relationshipId(candidate: Candidate): string {
  const identity = [
    candidate.tenantKey,
    candidate.relationshipType,
    candidate.sourceObjectKey,
    candidate.targetObjectKey,
    candidate.sourcePath,
    candidate.rowNumber,
  ].join("|");
  return `${candidate.tenantKey}:declared-segment:${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
}

export function augmentDeclaredSegmentGraph(input: GraphInput): Pick<GraphInput, "nodes" | "edges" | "quarantine"> & {
  acceptedSegmentEdges: number;
  quarantinedSegmentEdges: number;
} {
  const segments = new Map(
    input.records
      .filter(
        (record) =>
          record.objectType === "business_segment" &&
          record.qualityStatus !== "quarantined" &&
          record.canonicalObjectKey,
      )
      .map((record) => [record.canonicalObjectKey!, record]),
  );
  const functions = new Map(
    input.records
      .filter(
        (record) =>
          record.objectType === "business_function" &&
          record.qualityStatus !== "quarantined" &&
          record.canonicalObjectKey,
      )
      .map((record) => [record.canonicalObjectKey!, record]),
  );
  const nodesBySource = new Map<string, CsvRow[]>();
  for (const node of input.nodes) {
    if (node.objectType !== "business_function") continue;
    const key = sourcePosition(node.sourceFile, Number(node.sourceRowNumber));
    nodesBySource.set(key, [...(nodesBySource.get(key) ?? []), node]);
  }

  const nodes = [...input.nodes];
  const edges = [...input.edges];
  const quarantine = [...input.quarantine];
  const segmentNodes = new Set(nodes.map((node) => node.nodeId));
  let acceptedSegmentEdges = 0;
  let quarantinedSegmentEdges = 0;

  for (const candidate of input.relationships) {
    if (candidate.relationshipType !== "belongs_to_segment") continue;
    const source = candidate.sourceObjectKey
      ? functions.get(candidate.sourceObjectKey)
      : undefined;
    const target = candidate.targetObjectKey
      ? segments.get(candidate.targetObjectKey)
      : undefined;
    const targetEvidenceKey = target?.evidenceReferences.find((reference) => reference.evidenceKey)?.evidenceKey;
    const matchingNodes = nodesBySource.get(
      sourcePosition(candidate.sourcePath, candidate.rowNumber),
    ) ?? [];
    const reason =
      candidate.resolutionStatus !== "resolved"
        ? "unresolved-canonical-relationship"
        : candidate.sourceObjectType !== "business_function" ||
            candidate.targetObjectType !== "business_segment"
          ? "relationship-endpoint-type-mismatch"
        : !candidate.evidenceKey ||
            !source?.evidenceReferences.some(
              (reference) => reference.evidenceKey === candidate.evidenceKey,
            )
          ? "missing-source-evidence"
        : !source ||
              source.tenantKey !== candidate.tenantKey ||
              sourcePath(source) !== candidate.sourcePath ||
              sourceRow(source) !== candidate.rowNumber
            ? "source-function-not-verified"
            : !target ||
                target.tenantKey !== candidate.tenantKey ||
                sourcePath(target) === "" ||
                sourceRow(target) <= 0 ||
                !targetEvidenceKey ||
                !target.attributes.displayName?.value
              ? "target-segment-not-verified"
              : matchingNodes.length !== 1 ||
                  matchingNodes[0]?.tenantKey !== candidate.tenantKey
                ? "function-graph-node-not-unique"
                : null;
    const id = relationshipId(candidate);
    if (reason || !target || !matchingNodes[0] || !targetEvidenceKey) {
      const quarantineReason = reason ?? "missing-resolved-endpoint";
      quarantinedSegmentEdges += 1;
      quarantine.push({
        tenantKey: candidate.tenantKey,
        relationshipId: id,
        sourceRowNumber: String(candidate.rowNumber),
        rawRelationshipType: candidate.relationshipType,
        normalizedRelationshipType: "BELONGS_TO_SEGMENT",
        fromObjectType: "business_function",
        fromObjectName: candidate.sourceObjectName,
        fromNodeId: "",
        toObjectType: "business_segment",
        toObjectName: candidate.targetObjectName,
        toNodeId: "",
        evidenceBasis: candidate.evidenceKey,
        confidence: confidenceBand(candidate.confidence),
        knownGaps: quarantineReason,
        disposition: "quarantined",
        quarantineReasons: quarantineReason,
        quarantineClass: "dangling_reference",
        quarantineDisposition: "source-review-required",
      });
      continue;
    }

    const segmentNodeId = target.canonicalObjectKey!;
    if (!segmentNodes.has(segmentNodeId)) {
      nodes.push({
        tenantKey: candidate.tenantKey,
        nodeId: segmentNodeId,
        objectType: "business_segment",
        objectFamily: "enterprise",
        displayName: String(target.attributes.displayName?.value ?? ""),
        sourceFile: sourcePath(target),
        sourceRowNumber: String(sourceRow(target)),
        sourceEvidenceKey: targetEvidenceKey,
        mappingProfile: "business-segments/v1",
        materialized: "no",
      });
      segmentNodes.add(segmentNodeId);
    }
    acceptedSegmentEdges += 1;
    edges.push({
      tenantKey: candidate.tenantKey,
      relationshipId: id,
      sourceRowNumber: String(candidate.rowNumber),
      sourceFile: candidate.sourcePath,
      rawRelationshipType: candidate.relationshipType,
      normalizedRelationshipType: "BELONGS_TO_SEGMENT",
      fromObjectType: "business_function",
      fromObjectName: candidate.sourceObjectName,
      fromNodeId: matchingNodes[0].nodeId,
      toObjectType: "business_segment",
      toObjectName: String(target.attributes.displayName?.value ?? ""),
      toNodeId: segmentNodeId,
      evidenceBasis: candidate.evidenceKey,
      confidence: confidenceBand(candidate.confidence),
      knownGaps: "",
      disposition: "declared-canonical-relationship",
    });
  }

  return { nodes, edges, quarantine, acceptedSegmentEdges, quarantinedSegmentEdges };
}
