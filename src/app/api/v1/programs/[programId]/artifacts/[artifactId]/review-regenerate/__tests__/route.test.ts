const tenancy = {
  clientId: "client-lakeshore",
  clientKey: "lakeshore",
  userId: "user-1",
  email: "lakeshore-cio@example.com",
};

const artifact = {
  artifact_id: "artifact-v1",
  move_id: "move-1",
  phase: 2,
  artifact_type: "session_artifact",
  artifact_family: "session_artifact",
  title: "Discovery Quality Proof",
  file_name: "discovery-quality-proof.md",
  file_format: "md",
  blob_container: "context-drops",
  blob_path: "moves/lakeshore/move-1/sessions/session_artifact/discovery-quality-proof.md",
  file_size: 100,
  version: 1,
  status: "aligned",
  generated_by: "tester",
  generated_at: "2026-06-27T00:00:00Z",
  quality_score: null,
  unsupported_claims_count: 0,
  lifecycle_state: "current",
  created_at: "2026-06-27T00:00:00Z",
  metadata: {},
};

let currentArtifact: Record<string, unknown> | null = artifact;
const saveMoveArtifact = jest.fn(async (...args: [unknown, unknown]) => {
  void args;
  return {
    artifactId: "artifact-v2",
    version: 2,
    blobPath: "blob/path",
    blobStored: true,
  };
});

jest.mock("../../../../../_auth", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  getMoveArtifactForTenant: jest.fn(async () => currentArtifact),
  saveMoveArtifact: (ctx: unknown, input: unknown) =>
    saveMoveArtifact(ctx, input),
}));

import { POST } from "../route";

function req(body: Record<string, unknown>) {
  return {
    json: jest.fn(async () => body),
  } as never;
}

function params(programId = "move-1", artifactId = "artifact-v1") {
  return { params: Promise.resolve({ programId, artifactId }) };
}

beforeEach(() => {
  currentArtifact = artifact;
  saveMoveArtifact.mockClear();
});

describe("POST /api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate", () => {
  it("requires feedback before creating a regenerated version", async () => {
    const res = await POST(req({ feedbackText: " " }), params());

    expect(res.status).toBe(400);
    expect(saveMoveArtifact).not.toHaveBeenCalled();
  });

  it("returns 404 when the artifact is outside the requested move", async () => {
    currentArtifact = { ...artifact, move_id: "other-move" };

    const res = await POST(
      req({ feedbackText: "Add the missing caveat." }),
      params(),
    );

    expect(res.status).toBe(404);
    expect(saveMoveArtifact).not.toHaveBeenCalled();
  });

  it("saves a review-required v2 artifact with feedback and quality metadata", async () => {
    const res = await POST(
      req({
        feedbackText:
          "Add AP exception aging caveat and keep preliminary until logs are uploaded.",
      }),
      params(),
    );
    const json = (await res.json()) as {
      ok: boolean;
      feedbackItemCount: number;
      regeneratedArtifact: { artifactId: string; qualityStatus: string };
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.feedbackItemCount).toBe(1);
    expect(json.regeneratedArtifact.artifactId).toBe("artifact-v2");
    expect(json.regeneratedArtifact.qualityStatus).toBe("Passed with caveats");
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        moveId: "move-1",
        artifactType: "session_artifact",
        status: "review_required",
        qualityScore: 88,
        sourceBasis: "client_review_feedback",
        metadata: expect.objectContaining({
          feedbackItemCount: 1,
          regeneratedFromArtifactId: "artifact-v1",
          goldenBarStatus: "Passed with caveats",
        }),
      }),
    );
  });
});
