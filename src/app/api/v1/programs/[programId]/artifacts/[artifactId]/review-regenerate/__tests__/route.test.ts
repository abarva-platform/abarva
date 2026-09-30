import JSZip from "jszip";

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
  blob_path:
    "moves/lakeshore/move-1/sessions/session_artifact/discovery-quality-proof.md",
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
let originalDownload: { bytes: Buffer; fileName: string; fileFormat: string } = {
  bytes: Buffer.from("<html><body><h1>Original artifact</h1></body></html>"),
  fileName: "original.html",
  fileFormat: "html",
};
const saveMoveArtifact = jest.fn(async (...args: [unknown, unknown]) => {
  void args;
  return {
    artifactId: "artifact-v2",
    version: 2,
    blobPath: "blob/path",
    blobStored: true,
  };
});
const mockStreamAgentTurn = jest.fn(async function* (_input?: unknown) {
  void _input;
  yield "<html><body><svg>Current-State Handoff Map</svg><table>Process vs Data vs Policy vs Ownership vs AI Matrix</table><p>Complete regenerated draft.</p></body></html>";
});

jest.mock("../../../../../_auth", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  getMoveArtifactForTenant: jest.fn(async () => currentArtifact),
  downloadArtifactBytes: jest.fn(async () => originalDownload),
  saveMoveArtifact: (ctx: unknown, input: unknown) =>
    saveMoveArtifact(ctx, input),
}));

jest.mock("@/lib/agent/stream", () => ({
  streamAgentTurn: (...args: Parameters<typeof mockStreamAgentTurn>) =>
    mockStreamAgentTurn(...args),
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
  originalDownload = {
    bytes: Buffer.from("<html><body><h1>Original artifact</h1></body></html>"),
    fileName: "original.html",
    fileFormat: "html",
  };
  saveMoveArtifact.mockClear();
  mockStreamAgentTurn.mockClear();
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
      regeneratedArtifact: {
        artifactId: string;
        qualityStatus: string;
        editableArtifactId: string;
      };
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.feedbackItemCount).toBe(1);
    expect(json.regeneratedArtifact.artifactId).toBe("artifact-v2");
    expect(json.regeneratedArtifact.editableArtifactId).toBe("artifact-v2");
    expect(json.regeneratedArtifact.qualityStatus).toBe("Passed with caveats");
    expect(mockStreamAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: expect.any(Number),
        aiEgress: expect.objectContaining({
          workflow: "moves-review-regenerate-complete-artifact",
        }),
      }),
    );
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        moveId: "move-1",
        artifactType: "session_artifact",
        status: "review_required",
        qualityScore: 88,
        sourceBasis: "client_review_feedback",
        fileFormat: "html",
        body: expect.stringContaining("Complete regenerated draft"),
        metadata: expect.objectContaining({
          outputRole: "html_visual_review_companion",
          provenanceCategory: "abarva_generated_deliverable",
          feedbackItemCount: 1,
          regeneratedFromArtifactId: "artifact-v1",
          goldenBarStatus: "Passed with caveats",
          regenerationMode: "complete_artifact",
          originalArtifactBodyRetrieved: true,
        }),
      }),
    );
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        moveId: "move-1",
        artifactType: "session_artifact_editable_docx",
        status: "review_required",
        sourceBasis: "client_review_feedback",
        fileFormat: "docx",
        body: expect.any(Buffer),
        metadata: expect.objectContaining({
          outputRole: "docx_editable_phase_record",
          pairedVisualCompanionArtifactId: "artifact-v2",
          regeneratedFromArtifactId: "artifact-v1",
        }),
      }),
    );
  });

  it("uses the deterministic fast lane for editable Word-equivalent packaging feedback", async () => {
    const res = await POST(
      req({
        feedbackText:
          "Create the editable phase-end Word-equivalent record for sponsor review. Keep this review required and do not mark final.",
      }),
      params(),
    );
    const json = (await res.json()) as {
      ok: boolean;
      regeneratedArtifact: {
        artifactId: string;
        editableArtifactId: string;
      };
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.regeneratedArtifact.artifactId).toBe("artifact-v2");
    expect(json.regeneratedArtifact.editableArtifactId).toBe("artifact-v2");
    expect(mockStreamAgentTurn).not.toHaveBeenCalled();
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        moveId: "move-1",
        artifactType: "session_artifact",
        status: "review_required",
        fileFormat: "html",
        body: expect.stringContaining("Executive Summary"),
        metadata: expect.objectContaining({
          outputRole: "html_visual_review_companion",
          provenanceCategory: "abarva_generated_deliverable",
          regenerationMode: "deterministic_editable_review_package",
          originalArtifactBodyRetrieved: true,
        }),
      }),
    );
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        moveId: "move-1",
        artifactType: "session_artifact_editable_docx",
        status: "review_required",
        fileFormat: "docx",
        body: expect.any(Buffer),
        metadata: expect.objectContaining({
          outputRole: "docx_editable_phase_record",
          regenerationMode: "deterministic_editable_review_package",
        }),
      }),
    );
  });

  it("uses full regeneration for layout feedback on an editable document", async () => {
    const res = await POST(
      req({
        feedbackText:
          "Create an editable Word-equivalent record and fix its layout and pagination while preserving the approved content.",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mockStreamAgentTurn).toHaveBeenCalled();
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        metadata: expect.objectContaining({
          regenerationMode: "complete_artifact",
        }),
      }),
    );
  });

  it("extracts readable DOCX text before sending a revision prompt", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Source charter paragraph</w:t></w:r></w:p></w:body></w:document>',
    );
    originalDownload = {
      bytes: await zip.generateAsync({ type: "nodebuffer" }),
      fileName: "original.docx",
      fileFormat: "docx",
    };
    currentArtifact = { ...artifact, file_format: "docx" };

    const res = await POST(
      req({
        feedbackText:
          "Create the editable Word-equivalent record and fix layout and pagination while preserving the current facts.",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mockStreamAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            content: expect.stringContaining("Source charter paragraph"),
          }),
        ],
      }),
    );
    const prompt = mockStreamAgentTurn.mock.calls[0]?.[0] as {
      messages?: Array<{ content?: string }>;
    };
    expect(prompt.messages?.[0]?.content).not.toContain("PK");
    expect(prompt.messages?.[0]?.content).not.toContain("word/document.xml");
  });

  it("fails closed when a DOCX source cannot be extracted", async () => {
    originalDownload = {
      bytes: Buffer.from("not-a-docx"),
      fileName: "broken.docx",
      fileFormat: "docx",
    };
    currentArtifact = { ...artifact, file_format: "docx" };

    const res = await POST(
      req({ feedbackText: "Rewrite the charter from its source content." }),
      params(),
    );
    const json = (await res.json()) as { error?: string };

    expect(res.status).toBe(422);
    expect(json.error).toBe("source_artifact_not_extractable");
    expect(mockStreamAgentTurn).not.toHaveBeenCalled();
    expect(saveMoveArtifact).not.toHaveBeenCalled();
  });
});
