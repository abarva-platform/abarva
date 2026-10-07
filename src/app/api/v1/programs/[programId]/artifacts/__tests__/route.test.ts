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
let mockPendingEvidenceRows: Array<Record<string, unknown>> = [];
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
  getAzureWriteFluentClient: jest.fn(() => ({
    from: (table: string) => {
      const data =
        table === "program_evidence_reviews"
          ? mockPendingEvidenceReviewRows
          : mockPendingEvidenceRows;
      // Thenable builder: every method chains, and awaiting the chain resolves
      // to the table's rows regardless of which method terminates it — so this
      // tolerates the tenant-key filter being `.in(...)` mid-chain.
      const query: Record<string, unknown> = {
        select: () => query,
        eq: () => query,
        in: () => query,
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

function req(search = "") {
  return { nextUrl: { searchParams: new URLSearchParams(search) } } as never;
}
function params(programId: string) {
  return { params: Promise.resolve({ programId }) };
}

beforeEach(() => {
  moveRows = [];
  generatedRecs = [];
  mockPendingEvidenceReviewRows = [];
  mockPendingEvidenceRows = [];
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
