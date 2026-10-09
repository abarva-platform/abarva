// Cabinet merge proof: GET /programs/:id/artifacts merges governed generated_artifacts
// (Approve & Build output) with the move_artifacts vault — de-duped, newest-first, and
// only including generated docs when the family filter allows it.

const tenancy = {
  clientId: "client-uuid",
  clientKey: "skyharbor-air",
  userId: "u1",
};
let moveRows: Array<Record<string, unknown>> = [];
let generatedRecs: Array<Record<string, unknown>> = [];
let mockPendingEvidenceReviewRows: Array<Record<string, unknown>> = [];
/**
 * The column filters the route puts on `program_evidence_reviews`, captured
 * only — the builder below still resolves every row for the table, so adding
 * this changes no existing case. It is how a case can ask WHICH decisions a
 * read asked for, which is the question behind a decision value that no list
 * carried.
 */
let mockEvidenceReviewFilters: Array<{ column: string; value: unknown }> = [];
let mockPendingEvidenceRows: Array<Record<string, unknown>> = [];
let mockDeliverablesV2Rows: Array<Record<string, unknown>> = [];
let mockDeliverablesV2Error: { message: string } | null = null;
// An error returned ALONGSIDE an array, which is the shape that separates
// "read the error" from "read the rows".
let mockDeliverablesV2ErrorWithRows: { message: string } | null = null;
let mockReadClientThrows = false;
const moveCalls: Array<Record<string, unknown>> = [];
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();
let genCalled = 0;

jest.mock("../../../_auth", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));
jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  listMoveArtifacts: jest.fn(
    async (_ctx: unknown, _id: string, opts: Record<string, unknown>) => {
      moveCalls.push(opts);
      return moveRows;
    },
  ),
}));
jest.mock("@/lib/artifacts/repository", () => ({
  listGeneratedArtifactsForMoveAllRefs: jest.fn(async () => {
    genCalled += 1;
    return generatedRecs;
  }),
}));
jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) =>
    mockLoadApprovedMoveEvidenceSnapshot(...args),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  // The deliverables_v2 sign-off projection is read through the READ client and
  // nothing else in this route uses it. Its failure mode is what the response's
  // `deliverableSignOffStatus` exists to report, so the mock has to be able to
  // answer `{ data: null, error }` — which is how the fluent client resolves a
  // failed query; it does not throw.
  getAzureReadFluentClient: jest.fn(() => {
    // Constructing the client is the ONE thing in this loader that can raise —
    // the fluent query itself resolves its failures. Both paths have to be
    // reachable from a test or the loader's catch is unexercised.
    if (mockReadClientThrows) {
      throw new Error("no read connection string configured");
    }
    return {
      from: () => {
        const query: Record<string, unknown> = {
          select: () => query,
          eq: () => query,
          in: () => query,
          order: () => query,
          limit: () => query,
          then: (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
            resolve(
              mockDeliverablesV2Error
                ? { data: null, error: mockDeliverablesV2Error }
                : {
                    data: mockDeliverablesV2Rows,
                    error: mockDeliverablesV2ErrorWithRows,
                  },
            ),
        };
        return query;
      },
    };
  }),
  getAzureWriteFluentClient: jest.fn(() => ({
    from: (table: string) => {
      const data =
        table === "program_evidence_reviews"
          ? mockPendingEvidenceReviewRows
          : mockPendingEvidenceRows;
      // Thenable builder: every method chains, and awaiting the chain resolves
      // to the table's rows regardless of which method terminates it — so this
      // tolerates the tenant-key filter being `.in(...)` mid-chain.
      const record = (column: string, value: unknown) => {
        if (table === "program_evidence_reviews") {
          mockEvidenceReviewFilters.push({ column, value });
        }
      };
      const query: Record<string, unknown> = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          record(column, value);
          return query;
        },
        in: (column: string, value: unknown) => {
          record(column, value);
          return query;
        },
        order: () => query,
        limit: () => query,
        then: (resolve: (v: { data: unknown; error: null }) => unknown) =>
          resolve({ data, error: null }),
      };
      return query;
    },
  })),
}));

import { GET } from "../route";
import { normalizeReviewedEvidenceExtraction } from "@/lib/programs/evidence-review-contract";

function req(search = "") {
  return { nextUrl: { searchParams: new URLSearchParams(search) } } as never;
}
function params(programId: string) {
  return { params: Promise.resolve({ programId }) };
}

beforeEach(() => {
  moveRows = [];
  generatedRecs = [];
  mockDeliverablesV2Rows = [];
  mockDeliverablesV2Error = null;
  mockDeliverablesV2ErrorWithRows = null;
  mockReadClientThrows = false;
  mockPendingEvidenceReviewRows = [];
  mockPendingEvidenceRows = [];
  mockEvidenceReviewFilters = [];
  moveCalls.length = 0;
  genCalled = 0;
  mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    revision: "revision-current",
    approvedEvidenceCount: 2,
    rows: [],
    revisionByPhase: {
      1: "revision-current",
      2: "revision-current",
      3: "revision-current",
      4: "revision-current",
      5: "revision-current",
    },
    latestEvidenceActivityAtByPhase: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    },
  });
});

describe("GET /api/v1/programs/[programId]/artifacts — Cabinet merge", () => {
  it("returns parser facts and source text for pending human evidence review", async () => {
    mockPendingEvidenceReviewRows = [
      {
        id: "review-1",
        evidence_id: "evidence-1",
        family_key: "baseline",
        phase: 2,
        source_ref: {
          move_artifact_id: "source-artifact-1",
          filename: "baseline.docx",
          parse_method: "docx-text-extract/v1",
          confidence: 0.86,
        },
      },
    ];
    mockPendingEvidenceRows = [
      {
        id: "evidence-1",
        title: "baseline.docx",
        summary: "Parser found the current baseline.",
        extracted_text: "Original source says baseline is 18%.",
        extracted_structured: {
          baseline_candidates: ["18%"],
        },
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      pendingEvidenceReviews: Array<Record<string, unknown>>;
      evidenceReviewStatus: string;
    };

    expect(json.evidenceReviewStatus).toBe("available");
    expect(json.pendingEvidenceReviews).toEqual([
      expect.objectContaining({
        evidenceId: "evidence-1",
        reviewId: "review-1",
        sourceArtifactId: "source-artifact-1",
        title: "baseline.docx",
        familyKey: "baseline",
        phase: 2,
        parseMethod: "docx-text-extract/v1",
        confidence: 0.86,
        sourceTextPreview: "Original source says baseline is 18%.",
        extraction: expect.objectContaining({
          summary: "Parser found the current baseline.",
          structured: expect.objectContaining({
            baselineCandidates: ["18%"],
          }),
        }),
      }),
    ]);
  });

  it("merges generated_artifacts with the move vault, newest first", async () => {
    moveRows = [
      {
        artifact_id: "mv-1",
        artifact_type: "upload",
        artifact_family: "uploaded_evidence",
        title: "Old Upload",
        phase: 1,
        file_format: "pdf",
        file_name: "x.pdf",
        version: 1,
        status: "aligned",
        lifecycle_state: "current",
        quality_score: null,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-06-01T00:00:00Z",
        file_size: 10,
        metadata: {},
      },
    ];
    generatedRecs = [
      {
        id: "gen-1",
        artifactType: "program_charter",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-17T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: { renderableDoc: { title: "Program Charter" } },
      },
    ];
    const res = await GET(req(), params("move-x"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      count: number;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(json.count).toBe(2);
    // newest first → generated (Jun 17) before the move upload (Jun 1)
    expect(json.artifacts[0]!.artifactId).toBe("gen-1");
    expect(json.artifacts[0]!.family).toBe("generated_deliverable");
    expect(json.artifacts[0]!.title).toBe("Program Charter");
    expect(json.artifacts[0]!.downloadUrl).toBe("/api/v1/artifacts/gen-1");
    expect(json.artifacts[1]!.artifactId).toBe("mv-1");
  });

  it("returns vault and generated quality scores on the same 0-100 scale", async () => {
    moveRows = [
      {
        artifact_id: "vault-fractional",
        artifact_type: "move_board_pack",
        artifact_family: "generated_deliverable",
        title: "Vault artifact",
        phase: 1,
        file_format: "docx",
        file_name: "charter.docx",
        version: 1,
        status: "ready",
        lifecycle_state: "current",
        quality_score: 0.6,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-06-01T00:00:00Z",
        file_size: 10,
        metadata: {},
      },
      {
        artifact_id: "vault-percent",
        artifact_type: "move_board_pack",
        artifact_family: "generated_deliverable",
        title: "Vault artifact with percentage score",
        phase: 1,
        file_format: "docx",
        file_name: "charter-v2.docx",
        version: 2,
        status: "ready",
        lifecycle_state: "current",
        quality_score: 60,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-06-02T00:00:00Z",
        file_size: 10,
        metadata: {},
      },
    ];
    generatedRecs = [
      {
        id: "generated-fractional",
        artifactType: "program_charter",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.6,
        renderedAt: "2026-06-03T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: { renderableDoc: { title: "Generated charter" } },
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      artifacts: Array<{ artifactId: string; qualityScore: number | null }>;
    };

    expect(res.status).toBe(200);
    expect(
      Object.fromEntries(
        json.artifacts.map((artifact) => [
          artifact.artifactId,
          artifact.qualityScore,
        ]),
      ),
    ).toEqual({
      "generated-fractional": 60,
      "vault-percent": 60,
      "vault-fractional": 60,
    });
  });

  it("labels generated output stale when approved evidence has changed", async () => {
    generatedRecs = [
      {
        id: "gen-stale",
        artifactType: "program_charter",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-09-27T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: {
          evidenceSnapshotHash: "revision-before-review",
          renderableDoc: { title: "Program Charter" },
        },
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };

    expect(res.status).toBe(200);
    expect(json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "gen-stale",
        evidenceSnapshotStatus: "stale",
      }),
    );
  });

  it("keeps a P1 artifact current for later P2 evidence but stales it for later P1 activity", async () => {
    const phaseScopedArtifact = {
      id: "gen-p1-charter",
      artifactType: "program_charter",
      sourceArtifactRef: "move-x",
      outputFormat: "docx",
      blobUrl: "b",
      qualityScore: 0.9,
      renderedAt: "2026-09-29T16:00:00.000Z",
      renderedBy: "u",
      quarantineReason: null,
      metadata: {
        phase: 1,
        evidenceSnapshotHash: "whole-move-before-p2",
        phaseEvidenceSnapshotHash: "p1-current",
        evidenceSnapshotScope: "phase",
        renderableDoc: { title: "P1 Charter" },
      },
    };
    generatedRecs = [phaseScopedArtifact];
    const phase2ChangedSnapshot = {
      revision: "whole-move-after-p2",
      approvedEvidenceCount: 2,
      rows: [],
      latestEvidenceActivityAt: "2026-09-29T17:00:00.000Z",
      revisionByPhase: {
        1: "p1-current",
        2: "p2-updated",
        3: "p3-current",
        4: "p4-current",
        5: "p5-current",
      },
      latestEvidenceActivityAtByPhase: {
        1: null,
        2: "2026-09-29T17:00:00.000Z",
        3: null,
        4: null,
        5: null,
      },
    };
    mockLoadApprovedMoveEvidenceSnapshot
      .mockResolvedValueOnce(phase2ChangedSnapshot)
      .mockResolvedValueOnce({
        ...phase2ChangedSnapshot,
        latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
        revisionByPhase: {
          ...phase2ChangedSnapshot.revisionByPhase,
          1: "p1-updated",
        },
        latestEvidenceActivityAtByPhase: {
          ...phase2ChangedSnapshot.latestEvidenceActivityAtByPhase,
          1: "2026-09-29T18:00:00.000Z",
        },
      });

    const afterP2 = await GET(req(), params("move-x"));
    const afterP2Json = (await afterP2.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(afterP2Json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "gen-p1-charter",
        phase: 1,
        evidenceSnapshotStatus: "current",
      }),
    );

    const afterP1 = await GET(req(), params("move-x"));
    const afterP1Json = (await afterP1.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(afterP1Json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "gen-p1-charter",
        phase: 1,
        evidenceSnapshotStatus: "stale",
      }),
    );
  });

  it("derives generated artifact phase from the deliverable registry metadata", async () => {
    generatedRecs = [
      {
        id: "gen-p3",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 1,
        renderedAt: "2026-07-23T16:04:12Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: {
          deliverableTypeKey: "solution_design",
          renderableDoc: {
            title:
              "Governed Agent-Assist Layer for Commercial Lending — Solution Design Approval",
            deliverableTypeKey: "solution_design",
          },
        },
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "gen-p3",
        family: "generated_deliverable",
        phase: 3,
      }),
    );
  });

  it("de-dupes a generated artifact already present in the move vault", async () => {
    moveRows = [
      {
        artifact_id: "gen-1",
        artifact_type: "program_charter",
        artifact_family: "generated_deliverable",
        title: "Charter (vault)",
        phase: 1,
        file_format: "docx",
        file_name: null,
        version: 2,
        status: "board_ready",
        lifecycle_state: "current",
        quality_score: 0.9,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-06-17T00:00:00Z",
        file_size: null,
        metadata: {},
      },
    ];
    generatedRecs = [
      {
        id: "gen-1",
        artifactType: "program_charter",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-17T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: {},
      },
    ];
    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      count: number;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(json.count).toBe(1); // not duplicated
    expect(json.artifacts[0]!.title).toBe("Charter (vault)"); // the vault row wins
  });

  it("quarantines smoke-test control packets that otherwise look approved", async () => {
    moveRows = [
      {
        artifact_id: "fixture-packet",
        artifact_type: "client_approved_deliverables_packet",
        artifact_family: "generated_deliverable",
        title: "Client Approved Deliverables Packet APPROVED v1",
        phase: 5,
        file_format: "docx",
        file_name: "Client_Approved_Deliverables_Packet_APPROVED_v1.docx",
        version: 1,
        status: "approved",
        lifecycle_state: "current",
        quality_score: null,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-09-23T00:00:00Z",
        file_size: 1013,
        metadata: {
          storage: "azure_blob",
          openItems: ["Original upload marked approved."],
        },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable&currentOnly=1"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      count: number;
      artifacts: Array<Record<string, unknown>>;
    };

    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "fixture-packet",
        status: "quarantined",
        artifactStatus: "fixture_control_quarantined",
        preliminaryCaveat: expect.stringContaining("not a client deliverable"),
        openItems: expect.arrayContaining([
          expect.stringContaining("Smoke-test control language detected"),
          "Original upload marked approved.",
        ]),
      }),
    );
  });

  it("excludes generated docs when a non-deliverable family is selected", async () => {
    generatedRecs = [
      {
        id: "gen-1",
        artifactType: "program_charter",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-17T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        metadata: {},
      },
    ];
    const res = await GET(req("family=uploaded_evidence"), params("move-x"));
    const json = (await res.json()) as { count: number };
    expect(genCalled).toBe(0); // never even queried generated_artifacts
    expect(json.count).toBe(0);
  });

  it("honors currentOnly for generated artifacts as well as vault artifacts", async () => {
    generatedRecs = [
      {
        id: "gen-current",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-18T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: { renderableDoc: { title: "Current Deliverable" } },
      },
      {
        id: "gen-old",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-17T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: "gen-current",
        metadata: { renderableDoc: { title: "Superseded Deliverable" } },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable&currentOnly=1"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      count: number;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(json.artifacts[0]!.artifactId).toBe("gen-current");
  });

  it("does not label superseded generated artifacts as board ready", async () => {
    generatedRecs = [
      {
        id: "gen-old",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-06-17T00:00:00Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: "gen-current",
        metadata: { renderableDoc: { title: "Superseded Deliverable" } },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      count: number;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "gen-old",
        lifecycleState: "superseded",
        status: "superseded",
      }),
    );
  });

  it("does not mix older current phase docs with a newer quarantined phase rebuild", async () => {
    generatedRecs = [
      {
        id: "gen-quarantine",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "html",
        blobUrl: "b",
        qualityScore: 0.75,
        renderedAt: "2026-08-22T19:11:06Z",
        renderedBy: "u",
        quarantineReason: "blocked_quality: decision_clarity",
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Target-State Architecture",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
      {
        id: "gen-old-solution",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-08-22T18:51:01Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "solution_design",
          renderableDoc: {
            title: "Solution Design",
            deliverableTypeKey: "solution_design",
          },
        },
      },
      {
        id: "gen-p2",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 1,
        renderedAt: "2026-08-22T15:57:59Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "root_cause_worksheet",
          renderableDoc: {
            title: "Root-Cause Worksheet",
            deliverableTypeKey: "root_cause_worksheet",
          },
        },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable&currentOnly=1"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.artifacts.map((artifact) => artifact.artifactId)).toEqual([
      "gen-quarantine",
      "gen-p2",
    ]);
  });

  it("does not mix stale P3 docs after a newer successful architecture rebuild", async () => {
    generatedRecs = [
      {
        id: "gen-old-quarantine",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "html",
        blobUrl: "b",
        qualityScore: 0.8,
        renderedAt:
          "Sat Aug 22 2026 19:11:06 GMT+0000 (Coordinated Universal Time)",
        renderedBy: "u",
        quarantineReason: "blocked_quality: decision_clarity",
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Old Target-State Architecture",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
      {
        id: "gen-old-solution",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.9,
        renderedAt: "2026-08-22T18:51:01Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "solution_design",
          renderableDoc: {
            title: "Old Solution Design",
            deliverableTypeKey: "solution_design",
          },
        },
      },
      {
        id: "gen-new-target",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.88,
        renderedAt: "2026-08-22T19:59:19.075Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Target-State Architecture",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
      {
        id: "gen-p2",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 1,
        renderedAt: "2026-08-22T15:57:59Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "root_cause_worksheet",
          renderableDoc: {
            title: "Root-Cause Worksheet",
            deliverableTypeKey: "root_cause_worksheet",
          },
        },
      },
      {
        id: "gen-new-target-editable",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.88,
        renderedAt: "2026-08-22T19:59:19.327Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Target-State Architecture — Editable Deliverable",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable&currentOnly=1"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.artifacts.map((artifact) => artifact.artifactId)).toEqual([
      "gen-new-target-editable",
      "gen-new-target",
      "gen-p2",
    ]);
  });

  it("filters stale P3 vault rows after a newer successful architecture rebuild", async () => {
    moveRows = [
      {
        artifact_id: "vault-old-quarantine",
        artifact_type: "move_board_pack",
        artifact_family: "generated_deliverable",
        title: "Target-State Architecture",
        phase: 3,
        file_format: "html",
        file_name: null,
        version: 1,
        status: "quarantined",
        lifecycle_state: "current",
        quality_score: 80,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at:
          "Sat Aug 22 2026 19:11:06 GMT+0000 (Coordinated Universal Time)",
        file_size: 10,
        metadata: {},
      },
    ];
    generatedRecs = [
      {
        id: "gen-new-target",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.88,
        renderedAt: "2026-08-22T19:59:19.075Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Target-State Architecture",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
      {
        id: "gen-new-target-editable",
        artifactType: "move_board_pack",
        sourceArtifactRef: "move-x",
        outputFormat: "docx",
        blobUrl: "b",
        qualityScore: 0.88,
        renderedAt: "2026-08-22T19:59:19.327Z",
        renderedBy: "u",
        quarantineReason: null,
        supersededBy: null,
        metadata: {
          deliverableTypeKey: "target_state_architecture",
          renderableDoc: {
            title: "Target-State Architecture — Editable Deliverable",
            deliverableTypeKey: "target_state_architecture",
          },
        },
      },
    ];

    const res = await GET(
      req("family=generated_deliverable&currentOnly=1"),
      params("move-x"),
    );
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.artifacts.map((artifact) => artifact.artifactId)).toEqual([
      "gen-new-target-editable",
      "gen-new-target",
    ]);
  });

  it("still renders the vault when the generated_artifacts read throws", async () => {
    const repo = jest.requireMock("@/lib/artifacts/repository") as {
      listGeneratedArtifactsForMoveAllRefs: jest.Mock;
    };
    repo.listGeneratedArtifactsForMoveAllRefs.mockRejectedValueOnce(
      new Error("db down"),
    );
    moveRows = [
      {
        artifact_id: "mv-1",
        artifact_type: "upload",
        artifact_family: "uploaded_evidence",
        title: "Upload",
        phase: 1,
        file_format: "pdf",
        file_name: "x",
        version: 1,
        status: "aligned",
        lifecycle_state: "current",
        quality_score: null,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-06-01T00:00:00Z",
        file_size: 1,
        metadata: {},
      },
    ];
    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as { ok: boolean; count: number };
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
  });

  it("surfaces Move Context Extract metadata for the executive review panel", async () => {
    moveRows = [
      {
        artifact_id: "ctx-1",
        artifact_type: "move_context_extract_p1",
        artifact_family: "session_artifact",
        title: "P1 Context Extract",
        phase: 1,
        file_format: "md",
        file_name: "move_context_extract_p1.md",
        version: 1,
        status: "review_required",
        lifecycle_state: "current",
        quality_score: null,
        unsupported_claims_count: 0,
        generated_by: "u",
        created_at: "2026-07-14T12:52:25Z",
        file_size: 6695,
        metadata: {
          storage: "azure_blob",
          moveContextExtract: {
            sourceMode: "active_home_context",
            phase: 1,
            targetPhase: 1,
            generatedAt: "2026-07-14T12:52:25Z",
            freshness: {
              approvedEvidenceRevision: "revision-before-review",
            },
            candidateVersionId: null,
            attachedEvidenceItems: [
              {
                evidenceId: "ev-1",
                label: "Call center metrics",
                evidenceFamily: "kpi_baseline",
                sourceType: "uploaded_evidence",
              },
            ],
            suggestedContextItems: [{ label: "Review-only benchmark" }],
            excludedContextItems: [{ label: "Candidate preview data" }],
            gapItems: [],
          },
        },
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.artifacts[0]).toEqual(
      expect.objectContaining({
        artifactId: "ctx-1",
        contextExtract: expect.objectContaining({
          sourceMode: "active_home_context",
          candidateVersionId: null,
          attachedEvidenceItems: [
            expect.objectContaining({
              evidenceId: "ev-1",
              evidenceFamily: "kpi_baseline",
            }),
          ],
          suggestedContextItems: [
            expect.objectContaining({ label: "Review-only benchmark" }),
          ],
          excludedContextItems: [
            expect.objectContaining({ label: "Candidate preview data" }),
          ],
          gapItems: [],
          freshness: expect.objectContaining({
            freshnessStatus: "stale",
            currentApprovedEvidenceCount: 2,
          }),
        }),
      }),
    );
  });
});

// A governed operator data-build job writes canonical evidence + a pending
// review row directly, with no uploaded attachment and no move_artifacts row.
// That shape differs from the upload door in every field the cabinet reads, and
// an empty vault must not hide it: if this queue comes back empty, a reviewer
// sees "no artifacts yet" and the loaded inputs can never be approved, so the
// discovery phase can never close.
describe("GET /api/v1/programs/[programId]/artifacts — operator-job evidence", () => {
  const jobReviewRow = {
    id: "review-job-1",
    evidence_id: "evidence-job-1",
    family_key: "identity_resolution",
    phase: 2,
    // No move_artifact_id: the job wrote no attachment and no vault row.
    source_ref: {
      governance_dataset_id: "dataset-under-test",
      source_file: "02_p2_discover/identity_resolution.md",
      filename: "identity_resolution.md",
      title: "Identity resolution current state",
      parse_method: "exact_utf8_fixture",
      confidence: 1,
      synthetic: true,
      client_attested: false,
    },
  };
  const jobEvidenceRow = {
    id: "evidence-job-1",
    title: "Identity resolution current state",
    summary: "SYNTHETIC - NOT CLIENT-ATTESTED. Pending review.",
    extracted_text: "# Identity resolution\n\nOne record per person is not yet established.",
    // The job nests its citation under `flexible` and sets none of the
    // top-level structured lists the upload parser produces.
    extracted_structured: {
      synthetic: true,
      client_attested: false,
      agent_readiness_status: "not_reviewed",
      flexible: {
        citations: [
          {
            quote: "SYNTHETIC - NOT CLIENT-ATTESTED",
            locator: "02_p2_discover/identity_resolution.md",
          },
        ],
      },
    },
  };

  it("queues job-written evidence for review even when the move vault is empty", async () => {
    mockPendingEvidenceReviewRows = [jobReviewRow];
    mockPendingEvidenceRows = [jobEvidenceRow];
    moveRows = [];
    generatedRecs = [];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      artifacts: unknown[];
      pendingEvidenceReviews: Array<Record<string, unknown>>;
      evidenceReviewStatus: string;
    };

    // An empty vault is the real post-load state, and must not empty the queue.
    expect(json.artifacts).toEqual([]);
    expect(json.evidenceReviewStatus).toBe("available");
    expect(json.pendingEvidenceReviews).toHaveLength(1);
    expect(json.pendingEvidenceReviews[0]).toEqual(
      expect.objectContaining({
        evidenceId: "evidence-job-1",
        reviewId: "review-job-1",
        familyKey: "identity_resolution",
        phase: 2,
        sourceArtifactId: null,
        title: "identity_resolution.md",
        parseMethod: "exact_utf8_fixture",
        confidence: 1,
      }),
    );
  });

  it("offers an approvable extraction, so Approve is not a dead end", async () => {
    mockPendingEvidenceReviewRows = [jobReviewRow];
    mockPendingEvidenceRows = [jobEvidenceRow];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      pendingEvidenceReviews: Array<{ extraction: unknown }>;
    };

    // The approve route rejects a body whose extraction does not normalize
    // (400 reviewed_extraction_required), so the extraction the cabinet hands
    // the reviewer has to survive that same contract.
    const offered = json.pendingEvidenceReviews[0]?.extraction;
    expect(normalizeReviewedEvidenceExtraction(offered)).not.toBeNull();
    expect(normalizeReviewedEvidenceExtraction(offered)).toEqual(
      expect.objectContaining({
        version: 1,
        summary: "SYNTHETIC - NOT CLIENT-ATTESTED. Pending review.",
        structured: expect.objectContaining({
          citations: [
            {
              quote: "SYNTHETIC - NOT CLIENT-ATTESTED",
              locator: "02_p2_discover/identity_resolution.md",
            },
          ],
        }),
      }),
    );
  });
});

// ── The rejected decision reaches the cabinet payload ─────────────────────────
//
// `program_evidence_reviews.decision` admits `pending | approved | rejected`.
// This route read two of the three by name — one query for the pending queue
// and one for the reviewed list, filtered `decision = 'approved'` — so a
// REJECTED review was returned by neither and the cabinet had no list to put it
// in. These cases pin the producer: that the decided read asks for the decided
// SET, and that a rejected row leaves the route in its own field with the
// reviewer's reason attached.
describe("GET artifacts carries the rejected evidence reviews", () => {
  const reviewRow = (decision: string) => ({
    id: `review-${decision}`,
    evidence_id: "evidence-9",
    family_key: "kpi_baseline",
    phase: 2,
    decision,
    rationale: "The parser merged two baselines into one row.",
    reviewed_at: "2026-10-07T00:00:00.000Z",
    source_ref: { filename: "finance-baseline.xlsx" },
  });

  it("asks for both decided decisions, not approved alone", async () => {
    mockPendingEvidenceReviewRows = [reviewRow("rejected")];
    mockPendingEvidenceRows = [{ id: "evidence-9", title: "Finance baseline" }];

    await GET(req(), params("11111111-1111-1111-1111-111111111111"));

    const decisionFilters = mockEvidenceReviewFilters.filter(
      (filter) => filter.column === "decision",
    );
    // The pending queue's own `decision = 'pending'` is one of these; the
    // decided read is the one that asks for a set, and it has to name both.
    const decidedFilter = decisionFilters.find((filter) =>
      Array.isArray(filter.value),
    );
    expect(decidedFilter).toBeDefined();
    expect(decidedFilter!.value).toEqual(
      expect.arrayContaining(["approved", "rejected"]),
    );
    expect(decidedFilter!.value).not.toEqual(
      expect.arrayContaining(["pending"]),
    );
  });

  it("returns a rejected review with the reason the reviewer recorded", async () => {
    mockPendingEvidenceReviewRows = [reviewRow("rejected")];
    mockPendingEvidenceRows = [{ id: "evidence-9", title: "Finance baseline" }];

    const res = await GET(
      req(),
      params("11111111-1111-1111-1111-111111111111"),
    );
    const json = await res.json();

    expect(json.rejectedEvidence).toEqual([
      {
        evidenceId: "evidence-9",
        reviewId: "review-rejected",
        title: "finance-baseline.xlsx",
        familyKey: "kpi_baseline",
        phase: 2,
        reviewedAt: "2026-10-07T00:00:00.000Z",
        rationale: "The parser merged two baselines into one row.",
      },
    ]);
    // It is not ALSO reported as accepted evidence: the approved list is what
    // phase generation treats as committed.
    expect(json.reviewedEvidence).toEqual([]);
  });

  it("keeps an approved review in the reviewed list and out of the rejected one", async () => {
    // The control. Both lists come from one read, so a split that ignored the
    // decision would put every decided row in both.
    mockPendingEvidenceReviewRows = [reviewRow("approved")];
    mockPendingEvidenceRows = [{ id: "evidence-9", title: "Finance baseline" }];

    const res = await GET(
      req(),
      params("11111111-1111-1111-1111-111111111111"),
    );
    const json = await res.json();

    expect(json.rejectedEvidence).toEqual([]);
    expect(json.reviewedEvidence).toHaveLength(1);
    expect(json.reviewedEvidence[0].reviewId).toBe("review-approved");
    // The approved list has never carried a rationale and does not start now.
    expect(json.reviewedEvidence[0]).not.toHaveProperty("rationale");
  });
});

// The deliverables_v2 sign-off projection is a SEPARATE read from the artifact
// vault, and its failure mode is an empty map — which strips `deliverableId` /
// `currentVersion` / `signedOffVersion` from every generated row at once. The
// gate attestation ledger cannot tell that apart from a projection that holds
// no sign-off records, so it reported a phase whose documents are signed off as
// having no sign-off tracked and stated a count of zero. The response now says
// which of the two it is.
describe("GET artifacts reports the health of its sign-off projection read", () => {
  const signedVaultRow = {
    artifact_id: "mv-signed",
    artifact_type: "move_board_pack",
    artifact_family: "generated_deliverable",
    title: "Program Charter",
    phase: 1,
    file_format: "docx",
    file_name: "charter.docx",
    version: 2,
    status: "ready",
    lifecycle_state: "current",
    quality_score: null,
    unsupported_claims_count: 0,
    generated_by: "u",
    created_at: "2026-06-01T00:00:00Z",
    file_size: 10,
    metadata: { deliverableTypeKey: "charter" },
  };

  it("reports available and carries the sign-off columns when the read lands", async () => {
    moveRows = [signedVaultRow];
    mockDeliverablesV2Rows = [
      {
        id: "deliv-charter",
        deliverable_type_key: "charter",
        current_version: 2,
        signed_off_version: 2,
        updated_at: "2026-06-02T00:00:00Z",
      },
    ];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      deliverableSignOffStatus: string;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(json.deliverableSignOffStatus).toBe("available");
    expect(json.artifacts[0]).toMatchObject({
      deliverableId: "deliv-charter",
      currentVersion: 2,
      signedOffVersion: 2,
    });
  });

  it("reports available when the projection simply holds no sign-off record", async () => {
    // Nothing to sign off against is a FACT, and the ledger is allowed to say
    // so. It must not be conflated with a read that failed.
    moveRows = [signedVaultRow];
    mockDeliverablesV2Rows = [];

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      deliverableSignOffStatus: string;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(json.deliverableSignOffStatus).toBe("available");
    expect(json.artifacts[0]!.deliverableId).toBeUndefined();
  });

  it("reports unavailable when the projection query errors", async () => {
    // The fluent client resolves a failed query to `{ data: null, error }`
    // rather than throwing, so `error` is the only signal — and before this
    // change the loader did not even read it.
    moveRows = [signedVaultRow];
    mockDeliverablesV2Error = { message: "relation deliverables_v2 is gone" };

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      ok: boolean;
      deliverableSignOffStatus: string;
      artifacts: Array<Record<string, unknown>>;
    };
    // Still a 200 with the vault intact: the sign-off read is non-fatal.
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.artifacts).toHaveLength(1);
    // But the columns are gone, and the response says why.
    expect(json.artifacts[0]!.deliverableId).toBeUndefined();
    expect(json.deliverableSignOffStatus).toBe("unavailable");
  });

  it("treats a reported error as authoritative over the rows beside it", async () => {
    // A query that reported an error has not established that there are zero
    // sign-off records, whatever array came back with it. Reading the rows and
    // ignoring the error is how an empty result becomes a false negative.
    moveRows = [signedVaultRow];
    mockDeliverablesV2Rows = [];
    mockDeliverablesV2ErrorWithRows = { message: "statement timeout" };

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as { deliverableSignOffStatus: string };
    expect(json.deliverableSignOffStatus).toBe("unavailable");
  });

  it("reports unavailable when the read client cannot be constructed", async () => {
    // The only raising path in the loader. It must not report healthy either.
    moveRows = [signedVaultRow];
    mockReadClientThrows = true;

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      ok: boolean;
      deliverableSignOffStatus: string;
      artifacts: Array<Record<string, unknown>>;
    };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.artifacts).toHaveLength(1);
    expect(json.deliverableSignOffStatus).toBe("unavailable");
  });

  it("keeps the evidence-review status independent of the sign-off status", async () => {
    // Two sub-reads, two health fields. One failing must not be reported as
    // the other failing.
    moveRows = [signedVaultRow];
    mockDeliverablesV2Error = { message: "down" };

    const res = await GET(req(), params("move-x"));
    const json = (await res.json()) as {
      evidenceReviewStatus: string;
      deliverableSignOffStatus: string;
    };
    expect(json.evidenceReviewStatus).toBe("available");
    expect(json.deliverableSignOffStatus).toBe("unavailable");
  });
});
