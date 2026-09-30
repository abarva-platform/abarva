import type { CanonicalIngestionRecord } from "../../../src/lib/enterprise-data/contracts/canonical-ingestion";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import {
  buildHomeSegmentServingPlan,
  homeSegmentSourceSetHash,
  type DeclaredSegmentEdge,
  type EclSourceFile,
  type EclSourceRecord,
  type SegmentSourceSetBinding,
} from "../home-segment-serving-plan";

const tenantKey = CANONICAL_TENANT_KEYS[0];
const assessmentId = "synthetic-assessment";
const segmentPath = `datasets/tenant-inputs/active/${tenantKey}/current/01b_business_segments.csv`;
const functionPath = `datasets/tenant-inputs/active/${tenantKey}/current/01_business_functions.csv`;
const segmentHash = "a".repeat(64);
const functionHash = "b".repeat(64);
const expectedSourceHashes = {
  [segmentPath]: segmentHash,
  [functionPath]: functionHash,
};
const sourceSetHash = homeSegmentSourceSetHash(expectedSourceHashes)!;
const sourceSetBinding: SegmentSourceSetBinding = {
  tenantKey,
  assessmentId,
  reviewState: "approved",
  sourceSetHash,
  files: expectedSourceHashes,
  snapshot: {
    id: "snapshot-one",
    tenantKey,
    assessmentId,
    sourceHash: sourceSetHash,
    qualityState: "passed",
  },
  projection: {
    tenantKey,
    assessmentId,
    snapshotId: "snapshot-one",
    sourceHash: sourceSetHash,
    qualityState: "passed",
  },
};

function record(
  objectType: "business_segment" | "business_function",
  key: string,
  filePath: string,
  rowNumber: number,
  name: string,
): CanonicalIngestionRecord {
  return {
    tenantKey,
    packetVersion: "test",
    domain: "enterprise_structure",
    objectType,
    sourceObjectId: `${objectType}:${key}:${rowNumber}`,
    canonicalObjectKey: key,
    attributes: {
      displayName: { value: name, valueType: "string" },
      sourcePath: { value: filePath, valueType: "string" },
      sourceRowNumber: { value: rowNumber, valueType: "number" },
      ...(objectType === "business_segment"
        ? {
            revenueSharePct: { value: 40, valueType: "percent" as const },
            revenueUsd: { value: 4000000, valueType: "currency" as const },
            pnlOwnerRole: {
              value: "Operating executive",
              valueType: "string" as const,
            },
          }
        : {}),
    },
    relationships: [],
    evidenceReferences: [{ evidenceKey: `${filePath}:${rowNumber}` }],
    sourceAuthority: {
      sourceSystem: "test",
      sourceType: "intake",
      authority: "self_reported",
    },
    sensitivity: "internal",
    dataStatus: "synthetic",
    qualityStatus: "valid",
    lineage: [],
  };
}

const segment = record(
  "business_segment",
  "segment:one",
  segmentPath,
  2,
  "Segment One",
);
const businessFunction = record(
  "business_function",
  "function:one",
  functionPath,
  2,
  "Function One",
);
const sourceFiles: EclSourceFile[] = [
  {
    id: "segment-file",
    tenantKey,
    assessmentId,
    fileName: "01b_business_segments.csv",
    fileHash: segmentHash,
    qualityState: "accepted",
  },
  {
    id: "function-file",
    tenantKey,
    assessmentId,
    fileName: "01_business_functions.csv",
    fileHash: functionHash,
    qualityState: "accepted",
  },
];
const sourceRecords: EclSourceRecord[] = [
  {
    id: "segment-source",
    tenantKey,
    assessmentId,
    sourceFileId: "segment-file",
    nativeId: segment.sourceObjectId,
    rowNumber: 2,
    parseState: "parsed",
  },
  {
    id: "function-source",
    tenantKey,
    assessmentId,
    sourceFileId: "function-file",
    nativeId: businessFunction.sourceObjectId,
    rowNumber: 2,
    parseState: "parsed",
  },
];
const edge: DeclaredSegmentEdge = {
  tenantKey,
  relationshipId: "declared-edge",
  normalizedRelationshipType: "BELONGS_TO_SEGMENT",
  fromNodeId: businessFunction.canonicalObjectKey!,
  toNodeId: segment.canonicalObjectKey!,
  sourceFile: functionPath,
  sourceRowNumber: "2",
  evidenceBasis: `${functionPath}:2`,
  knownGaps: "",
  disposition: "declared-canonical-relationship",
};

function plan(
  overrides: Partial<Parameters<typeof buildHomeSegmentServingPlan>[0]> = {},
) {
  return buildHomeSegmentServingPlan({
    tenantKey,
    assessmentId,
    records: [segment, businessFunction],
    edges: [edge],
    expectedSourceHashes,
    sourceSetBinding,
    sourceFiles,
    sourceRecords,
    ...overrides,
  });
}

describe("Home segment serving admission plan", () => {
  it("carries only source-matched segment facts and declared function links", () => {
    expect(plan()).toEqual({
      sourceSet: { state: "verified", hash: sourceSetHash, reason: null },
      candidates: [
        {
          canonicalObjectKey: "segment:one",
          segmentName: "Segment One",
          revenueSharePct: 40,
          revenueUsd: 4000000,
          declaredOwnerRole: "Operating executive",
          qualityStatus: "valid",
          sourceRecordId: "segment-source",
          linkedFunctions: [
            {
              canonicalObjectKey: "function:one",
              functionName: "Function One",
              relationshipId: "declared-edge",
              sourceRecordId: "function-source",
            },
          ],
        },
      ],
      withheld: [],
    });
  });

  it("blocks a changed canonical file before inspecting individual rows", () => {
    const result = plan({
      expectedSourceHashes: {
        [segmentPath]: "c".repeat(64),
        [functionPath]: functionHash,
      },
    });
    expect(result.candidates).toEqual([]);
    expect(result.sourceSet.reason).toBe("reviewed-source-set-mismatch");
    expect(result.withheld).toContainEqual({
      objectKey: "segment:one",
      reason: "reviewed-source-set-mismatch",
    });
  });

  it("keeps source-set identity tied to registered paths, not just basenames", () => {
    const movedPath = `datasets/tenant-inputs/active/${tenantKey}/replaced/01b_business_segments.csv`;
    const result = plan({
      expectedSourceHashes: {
        [movedPath]: segmentHash,
        [functionPath]: functionHash,
      },
    });
    expect(result.sourceSet.reason).toBe("reviewed-source-set-mismatch");
    expect(result.candidates).toEqual([]);
  });

  it("requires an approved source-set binding for the exact assessment", () => {
    expect(plan({ sourceSetBinding: null }).sourceSet.reason).toBe(
      "source-set-proof-missing",
    );
    expect(
      plan({
        sourceSetBinding: { ...sourceSetBinding, reviewState: "candidate" },
      }).sourceSet.reason,
    ).toBe("reviewed-source-set-mismatch");
    expect(plan({ assessmentId: "another-assessment" }).sourceSet.reason).toBe(
      "reviewed-source-set-mismatch",
    );
  });

  it("blocks a different snapshot or projection source set", () => {
    expect(
      plan({
        sourceSetBinding: {
          ...sourceSetBinding,
          snapshot: { ...sourceSetBinding.snapshot, sourceHash: "c".repeat(64) },
        },
      }).sourceSet.reason,
    ).toBe("target-snapshot-mismatch");
    expect(
      plan({
        sourceSetBinding: {
          ...sourceSetBinding,
          projection: {
            ...sourceSetBinding.projection,
            snapshotId: "older-snapshot",
          },
        },
      }).sourceSet.reason,
    ).toBe("target-snapshot-mismatch");
  });

  it("blocks extra, missing, or duplicate accepted source files", () => {
    expect(
      plan({ sourceFiles: sourceFiles.slice(0, 1) }).sourceSet.reason,
    ).toBe("source-catalog-mismatch");
    expect(
      plan({
        sourceFiles: [
          ...sourceFiles,
          {
            id: "unreviewed-file",
            tenantKey,
            assessmentId,
            fileName: "unreviewed.csv",
            fileHash: "c".repeat(64),
            qualityState: "accepted",
          },
        ],
      }).sourceSet.reason,
    ).toBe("source-catalog-mismatch");
    expect(
      plan({ sourceFiles: [...sourceFiles, sourceFiles[0]] }).sourceSet.reason,
    ).toBe("source-catalog-mismatch");
  });

  it("rejects ambiguous file names in the declared full source set", () => {
    expect(
      homeSegmentSourceSetHash({
        "first/01.csv": "a".repeat(64),
        "second/01.csv": "b".repeat(64),
      }),
    ).toBeNull();
    expect(
      homeSegmentSourceSetHash({ "first/../01.csv": "a".repeat(64) }),
    ).toBeNull();
  });

  it("withholds a source row when its native ID or assessment differs", () => {
    const result = plan({
      sourceRecords: sourceRecords.map((source) =>
        source.id === "segment-source"
          ? { ...source, nativeId: "another-object" }
          : source,
      ),
    });
    expect(result.candidates).toEqual([]);
    expect(result.withheld).toContainEqual({
      objectKey: "segment:one",
      reason: "source-record-not-verified",
    });
    expect(plan({ assessmentId: "another-assessment" }).candidates).toEqual([]);
  });

  it("withholds duplicate or non-parsed source rows", () => {
    const duplicate = plan({
      sourceRecords: [
        ...sourceRecords,
        { ...sourceRecords[0], id: "another-segment-source" },
      ],
    });
    expect(duplicate.candidates).toEqual([]);
    const partial = plan({
      sourceRecords: sourceRecords.map((source) =>
        source.id === "segment-source"
          ? { ...source, parseState: "partial" }
          : source,
      ),
    });
    expect(partial.candidates).toEqual([]);
  });

  it("does not infer function membership from a missing or ambiguous edge", () => {
    const missing = plan({ edges: [] });
    expect(missing.candidates[0].linkedFunctions).toEqual([]);
    expect(missing.withheld).toContainEqual({
      objectKey: "function:one",
      reason: "segment-relationship-missing",
    });
    const ambiguous = plan({
      edges: [edge, { ...edge, relationshipId: "second-edge" }],
    });
    expect(ambiguous.candidates[0].linkedFunctions).toEqual([]);
    expect(ambiguous.withheld).toContainEqual({
      objectKey: "function:one",
      reason: "segment-relationship-not-unique",
    });
  });

  it("does not attribute a function through an unresolved or unsupported edge", () => {
    const unresolved = plan({
      edges: [{ ...edge, disposition: "quarantined", knownGaps: "unresolved" }],
    });
    expect(unresolved.candidates[0].linkedFunctions).toEqual([]);
    expect(unresolved.withheld).toContainEqual({
      objectKey: "function:one",
      reason: "segment-relationship-not-verified",
    });
    const wrongEvidence = plan({
      edges: [{ ...edge, evidenceBasis: "different-source" }],
    });
    expect(wrongEvidence.candidates[0].linkedFunctions).toEqual([]);
  });

  it("reports quarantined and duplicate canonical identities instead of serving them", () => {
    const quarantined = plan({
      records: [{ ...segment, qualityStatus: "quarantined" }, businessFunction],
    });
    expect(quarantined.candidates).toEqual([]);
    expect(quarantined.withheld).toContainEqual({
      objectKey: "segment:one",
      reason: "canonical-quality-quarantined",
    });
    const duplicate = plan({
      records: [segment, { ...segment }, businessFunction],
    });
    expect(duplicate.candidates).toEqual([]);
    expect(duplicate.withheld).toContainEqual({
      objectKey: "segment:one",
      reason: "canonical-identity-not-unique",
    });
  });

  it("does not carry an impossible revenue share into a candidate metric", () => {
    const impossible = {
      ...segment,
      attributes: {
        ...segment.attributes,
        revenueSharePct: { value: 120, valueType: "percent" as const },
      },
    };
    expect(
      plan({ records: [impossible, businessFunction] }).candidates[0]
        .revenueSharePct,
    ).toBeNull();
  });
});
