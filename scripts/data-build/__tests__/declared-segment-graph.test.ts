import type { CanonicalDataBuildReport } from "../../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../../../src/lib/enterprise-data/contracts/canonical-ingestion";
import { augmentDeclaredSegmentGraph } from "../declared-segment-graph";

const tenant = "synthetic-test-tenant";
const functionPath = `datasets/tenant-inputs/active/${tenant}/current/01_business_functions.csv`;
const segmentPath = `datasets/tenant-inputs/active/${tenant}/current/01b_business_segments.csv`;
const functionKey = `${tenant}:business_function:operations`;
const segmentKey = `${tenant}:business_segment:core`;

function record(
  objectType: string,
  canonicalObjectKey: string,
  displayName: string,
  path: string,
  rowNumber: number,
  evidenceKey: string,
): CanonicalIngestionRecord {
  return {
    tenantKey: tenant,
    packetVersion: "test",
    domain: "enterprise_structure",
    objectType,
    sourceObjectId: canonicalObjectKey,
    canonicalObjectKey,
    qualityStatus: "valid",
    relationships: [],
    evidenceReferences: [{ evidenceKey }],
    attributes: {
      displayName: { value: displayName, valueType: "string" },
      sourcePath: { value: path, valueType: "string" },
      sourceRowNumber: { value: rowNumber, valueType: "number" },
    },
    sourceAuthority: {
      sourceSystem: "synthetic-fixture",
      sourceType: "csv",
      authority: "self_reported",
      basis: "declared",
    },
    sensitivity: "internal",
    dataStatus: "synthetic",
    lineage: [],
  };
}

function input() {
  const evidenceKey = `${tenant}:function-row:2`;
  return {
    records: [
      record("business_function", functionKey, "Operations", functionPath, 2, evidenceKey),
      record("business_segment", segmentKey, "Core Business", segmentPath, 2, `${tenant}:segment-row:2`),
    ],
    relationships: [{
      tenantKey: tenant,
      relationshipType: "belongs_to_segment",
      sourceObjectType: "business_function",
      sourceObjectName: "Operations",
      sourceObjectKey: functionKey,
      targetObjectType: "business_segment",
      targetObjectName: "core",
      targetObjectKey: segmentKey,
      resolutionStatus: "resolved" as const,
      confidence: 0.72,
      evidenceKey,
      sourcePath: functionPath,
      rowNumber: 2,
    }] as CanonicalDataBuildReport["relationshipCandidates"],
    nodes: [{
      tenantKey: tenant,
      nodeId: `${tenant}:business_function:operations`,
      objectType: "business_function",
      objectFamily: "organization",
      displayName: "Operations",
      sourceFile: functionPath,
      sourceRowNumber: "2",
      mappingProfile: "organization-business-functions/v1",
      materialized: "no",
    }],
    edges: [],
    quarantine: [],
  };
}

describe("declared segment graph", () => {
  it("adds only the source-backed canonical function-to-segment edge", () => {
    const graph = augmentDeclaredSegmentGraph(input());

    expect(graph.acceptedSegmentEdges).toBe(1);
    expect(graph.quarantinedSegmentEdges).toBe(0);
    expect(graph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        nodeId: segmentKey,
        displayName: "Core Business",
        sourceFile: segmentPath,
        sourceEvidenceKey: `${tenant}:segment-row:2`,
      }),
    ]));
    expect(graph.edges).toEqual([
      expect.objectContaining({
        normalizedRelationshipType: "BELONGS_TO_SEGMENT",
        fromNodeId: `${tenant}:business_function:operations`,
        toNodeId: segmentKey,
        sourceFile: functionPath,
        evidenceBasis: `${tenant}:function-row:2`,
      }),
    ]);
  });

  it("uses the first non-empty segment evidence reference", () => {
    const fixture = input();
    fixture.records[1].evidenceReferences.unshift({ evidenceKey: "" });
    const graph = augmentDeclaredSegmentGraph(fixture);

    expect(graph.acceptedSegmentEdges).toBe(1);
    expect(graph.nodes.at(-1)?.sourceEvidenceKey).toBe(`${tenant}:segment-row:2`);
  });

  it.each([
    ["unresolved", (fixture: ReturnType<typeof input>) => {
      fixture.relationships[0].resolutionStatus = "unresolved";
    }],
    ["missing segment", (fixture: ReturnType<typeof input>) => {
      fixture.records.pop();
    }],
    ["missing evidence", (fixture: ReturnType<typeof input>) => {
      fixture.relationships[0].evidenceKey = "unmatched";
    }],
    ["missing segment evidence", (fixture: ReturnType<typeof input>) => {
      fixture.records[1].evidenceReferences = [];
    }],
    ["endpoint type mismatch", (fixture: ReturnType<typeof input>) => {
      fixture.relationships[0].targetObjectType = "application_system";
    }],
    ["ambiguous function node", (fixture: ReturnType<typeof input>) => {
      fixture.nodes.push({ ...fixture.nodes[0], nodeId: `${tenant}:business_function:duplicate` });
    }],
    ["wrong tenant", (fixture: ReturnType<typeof input>) => {
      fixture.relationships[0].tenantKey = "another-tenant";
    }],
  ])("quarantines %s without creating a segment node or graph edge", (_name, change) => {
    const fixture = input();
    change(fixture);
    const graph = augmentDeclaredSegmentGraph(fixture);

    expect(graph.acceptedSegmentEdges).toBe(0);
    expect(graph.quarantinedSegmentEdges).toBe(1);
    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes).toHaveLength(fixture.nodes.length);
    expect(graph.quarantine[0]?.quarantineReasons).toBeTruthy();
  });
});
