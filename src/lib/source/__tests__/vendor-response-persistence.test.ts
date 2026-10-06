import type { SourceArtifactRegistryRecord } from "../artifact-registry";

const insert = jest.fn(async (payload: unknown) => {
  void payload;
  return { data: null, error: null };
});
const filters: Array<[string, unknown]> = [];
let readRows: unknown[] = [];
let artifactRows: unknown[] = [];
let acceptanceRows: unknown[] = [];

const writeClient = { from: jest.fn(() => ({ insert })) };
const readClient = {
  from: jest.fn((table: string) => {
    type ReadChain = {
      select: jest.Mock<ReadChain, []>;
      eq: jest.Mock<ReadChain, [string, unknown]>;
      in: jest.Mock<ReadChain, [string, unknown]>;
      order: jest.Mock<ReadChain, [string?, unknown?]>;
      limit: jest.Mock<Promise<{ data: unknown[]; error: null }>, []>;
    };
    const chain = {} as ReadChain;
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn((column: string, value: unknown) => {
      filters.push([column, value]);
      return chain;
    });
    chain.in = jest.fn((column: string, value: unknown) => {
      filters.push([column, value]);
      return chain;
    });
    chain.order = jest.fn(() => chain);
    chain.limit = jest.fn(async () => ({
      data:
        table === "source_artifacts"
          ? artifactRows
          : table === "source_artifact_acceptances"
            ? acceptanceRows
            : readRows,
      error: null,
    }));
    return chain;
  }),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => writeClient,
  getAzureReadFluentClient: () => readClient,
}));

import {
  persistNormalizedVendorResponsePackage,
  readNormalizedVendorResponsePackages,
} from "../vendor-response-persistence";

const artifact: SourceArtifactRegistryRecord = {
  id: "artifact-1",
  tenantKey: "example-tenant",
  sourceEventId: "event-1",
  sourceEventRowId: "event-1",
  stageKey: "responses",
  artifactFamily: "proposal",
  artifactKind: "vendor_response_workbook",
  sourceOrigin: "uploaded",
  sourceFormat: "xlsx",
  originalName: "example-response.xlsx",
  blobUri: "example-tenant/event-1/artifact-1/example-response.xlsx",
  uploaderUserId: "user-1",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  sizeBytes: 100,
  sha256: "a".repeat(64),
  parseStatus: "parsed",
  embeddingStatus: "pending",
  graphStatus: "pending",
  classificationStatus: "classified",
  dataClassification: "Confidential",
  evidenceState: "parsed_uncited",
  approvalState: "draft",
  version: 1,
  supersedesArtifactVersionId: null,
  createdBy: "user-1",
  validatedBy: null,
  createdAt: "2026-09-08T00:00:00.000Z",
  updatedAt: "2026-09-08T00:00:00.000Z",
  deletedAt: null,
};

const analytics = {
  requirementCount: 1,
  requirementCoverageScore: 100,
  mandatoryCompletenessScore: 100,
  evidenceCoverageScore: 100,
  pricingTraceabilityScore: 100,
  slaTraceabilityScore: 100,
  exceptionDisclosureScore: 100,
  criterionLinkageScore: 100,
  readyForEvaluation: "yes" as const,
  nonConformances: [],
  clarificationQuestions: [],
};

beforeEach(() => {
  insert.mockClear();
  writeClient.from.mockClear();
  readClient.from.mockClear();
  filters.length = 0;
  readRows = [];
  artifactRows = [];
  acceptanceRows = [];
});

describe("normalized vendor response persistence", () => {
  it("persists every row and a quality summary with tenant/event provenance", async () => {
    await persistNormalizedVendorResponsePackage({
      artifact,
      parsed: {
        vendorId: "example-services",
        vendorName: "Example Services",
        rows: [
          {
            requirementId: "REQ-001",
            category: "service scope",
            section: "Scope",
            requirement: "Confirm scope.",
            requirementLevel: "Mandatory",
            responseType: "Narrative",
            evidenceRequired: false,
            responseDisposition: "Comply",
            responseNarrative: "Scope confirmed.",
            vendorOwner: "Account lead",
          },
        ],
        analytics,
        parserWarnings: [],
        syntheticDemo: true,
      },
    });

    const facts = insert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(facts).toHaveLength(2);
    expect(facts[1]).toMatchObject({
      fact_type: "normalized_response_quality",
      fact_value: { synthetic_demo: true },
    });
    expect(facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenant_key: "example-tenant",
          source_event_id: "event-1",
          fact_type: "normalized_requirement_response",
          fact_key: "example-services::REQ-001",
        }),
        expect.objectContaining({
          fact_type: "normalized_response_quality",
          fact_key: "example-services",
        }),
      ]),
    );
  });

  it("refuses unaccepted workbook extraction instead of feeding scoring, aVa, award, or benchmark consumers", async () => {
    readRows = [
      responseRow("artifact-draft", "REQ-001", "Draft response"),
      summaryRow("artifact-draft", "2026-09-08T00:00:00.000Z", "draft.xlsx"),
    ];
    artifactRows = [
      artifactAuthorityRow("artifact-draft", {
        is_client_final: false,
        is_current_authoritative: false,
        client_final_accepted_at: null,
      }),
    ];
    acceptanceRows = [];

    const packages = await readNormalizedVendorResponsePackages({
      eventId: "event-1",
      tenantKey: "example-tenant",
    });

    expect(packages).toEqual([]);
  });

  it("reads accepted packages with stable question identity, normalized response category, review state, and provenance", async () => {
    readRows = [
      responseRow("artifact-old", "REQ-001", "Old response"),
      summaryRow("artifact-old", "2026-09-01T00:00:00.000Z", "old.xlsx"),
      responseRow("artifact-new", "REQ-001", "Current response"),
      summaryRow("artifact-new", "2026-09-08T00:00:00.000Z", "new.xlsx"),
    ];
    artifactRows = [
      artifactAuthorityRow("artifact-old"),
      artifactAuthorityRow("artifact-new"),
    ];
    acceptanceRows = [
      acceptanceRow("artifact-old", "2026-09-01T01:00:00.000Z"),
      acceptanceRow("artifact-new", "2026-09-08T01:00:00.000Z"),
    ];

    const packages = await readNormalizedVendorResponsePackages({
      eventId: "event-1",
      tenantKey: "example-tenant",
    });

    expect(filters).toEqual(
      expect.arrayContaining([
        ["source_event_id", "event-1"],
        ["tenant_key", ["example-tenant"]],
      ]),
    );
    expect(packages).toHaveLength(1);
    expect(packages[0]).toMatchObject({
      artifactId: "artifact-new",
      originalName: "new.xlsx",
      vendorName: "Example Services",
      reviewState: "accepted",
      authority: {
        acceptedArtifactOnly: true,
        downstreamContextPolicy: "include",
      },
    });
    expect(packages[0].rows[0].responseNarrative).toBe("Current response");
    expect(packages[0].rows[0]).toMatchObject({
      questionId:
        "source-response-question:example-tenant:event-1:example-services:REQ-001",
      responseCategory: "comply",
      reviewState: "accepted",
      provenance: {
        artifactId: "artifact-new",
        artifactName: "new.xlsx",
        parser: "source_normalized_vendor_response_v1",
        factKey: "example-services::REQ-001",
      },
    });
  });

  it("reads canonical and app-client aliases for the same tenant", async () => {
    await readNormalizedVendorResponsePackages({
      eventId: "event-1",
      tenantKey: "meridian",
    });

    expect(filters).toContainEqual([
      "tenant_key",
      expect.arrayContaining(["meridian", "meridian-health"]),
    ]);
  });
});

function responseRow(
  artifactId: string,
  requirementId: string,
  responseNarrative: string,
) {
  return {
    artifact_id: artifactId,
    fact_type: "normalized_requirement_response",
    fact_key: `example-services::${requirementId}`,
    fact_value: {
      vendor_id: "example-services",
      vendor_name: "Example Services",
      requirementId,
      category: "service scope",
      section: "Scope",
      requirement: "Confirm scope.",
      requirementLevel: "Mandatory",
      responseType: "Narrative",
      evidenceRequired: false,
      responseDisposition: "Comply",
      responseNarrative,
      evidenceRefs: [],
      vendorOwner: "Account lead",
    },
  };
}

function summaryRow(
  artifactId: string,
  receivedAt: string,
  originalName: string,
) {
  return {
    artifact_id: artifactId,
    fact_type: "normalized_response_quality",
    fact_key: "example-services",
    fact_value: {
      vendor_id: "example-services",
      vendor_name: "Example Services",
      received_at: receivedAt,
      original_name: originalName,
      analytics,
      parser_warnings: [],
    },
  };
}

function artifactAuthorityRow(
  artifactId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: artifactId,
    status: "client_final",
    lifecycle_state: "current",
    approval_state: "approved",
    is_client_final: true,
    is_current_authoritative: true,
    client_final_accepted_at: "2026-09-08T01:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

function acceptanceRow(artifactId: string, acceptedAt: string) {
  return {
    artifact_id: artifactId,
    artifact_role: "authoritative",
    artifact_state: "client_final",
    content_drift_status: "current",
    gate_precondition_status: "ready",
    downstream_context_policy: "include",
    accepted_at: acceptedAt,
  };
}
