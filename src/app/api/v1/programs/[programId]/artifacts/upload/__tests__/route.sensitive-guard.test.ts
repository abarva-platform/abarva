/**
 * @jest-environment node
 */

// POST /api/v1/programs/:programId/artifacts/upload — the sensitive-data guard
// runs before storage. The guard and its rules are real; tenancy, the artifact
// write and evidence ingestion are mocked so the test can assert that a
// quarantined file never reaches them.

let savedArtifactArguments: unknown[][] = [];
let ingestedEvidenceArguments: unknown[][] = [];
const saveMoveArtifactMock = jest.fn(async (...args: unknown[]) => {
  savedArtifactArguments.push(args);
  return { artifactId: "artifact-1", version: 1, blobStored: true };
});
const ingestMock = jest.fn(async (...args: unknown[]) => {
  ingestedEvidenceArguments.push(args);
  return {
    evidenceId: "evidence-1",
    reviewId: "review-1",
    reviewState: "review_required",
    parseMethod: "markdown-line-parser",
    warnings: [],
    whatFound: [],
    whereUsed: [],
  };
});

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: async () => ({
    clientId: "tenant-id",
    clientKey: "tenant-key",
    userId: "user-id",
    email: "reviewer@example.test",
  }),
  tenancyErrorResponse: (err: unknown) =>
    Response.json({ error: String(err) }, { status: 500 }),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  ...jest.requireActual("@/lib/programs/deliverables/move-artifacts"),
  saveMoveArtifact: (...args: unknown[]) =>
    (saveMoveArtifactMock as unknown as (...a: unknown[]) => unknown)(...args),
}));

jest.mock("@/lib/programs/queries", () => ({
  ...jest.requireActual("@/lib/programs/queries"),
  getProgramById: async () => ({ id: "move-1", archetype: null }),
}));

jest.mock("@/lib/programs/current-state-doc-ingest", () => ({
  ...jest.requireActual("@/lib/programs/current-state-doc-ingest"),
  ingestUploadedMoveEvidence: (...args: unknown[]) =>
    (ingestMock as unknown as (...a: unknown[]) => unknown)(...args),
}));

import { NextRequest } from "next/server";
import { POST } from "../route";

// Synthetic content only. The identifiers are fabricated test patterns.
const SENSITIVE =
  "Fabricated record. Member ID SYN-M-0000000; date of birth 1900-01-01; SSN 000-00-0000.";
const CLEAN =
  "Routine status inquiries follow five agent steps across four systems.";

function upload(
  text: string,
  family: string,
  options: { phase?: number; evidenceFamily?: string } = {},
) {
  const form = new FormData();
  form.append("file", new File([text], "note.md", { type: "text/markdown" }));
  form.append("phase", String(options.phase ?? 2));
  form.append("family", family);
  if (options.evidenceFamily) {
    form.append("evidenceFamily", options.evidenceFamily);
  }
  const req = new NextRequest(
    "http://localhost/api/v1/programs/move-1/artifacts/upload",
    { method: "POST", body: form },
  );
  return POST(req, { params: Promise.resolve({ programId: "move-1" }) });
}

describe("Move artifact upload — sensitive-data guard", () => {
  beforeEach(() => {
    saveMoveArtifactMock.mockClear();
    ingestMock.mockClear();
    savedArtifactArguments = [];
    ingestedEvidenceArguments = [];
  });

  it.each([
    "uploaded_evidence",
    "session_artifact",
    "template",
    "approval_artifact",
  ])(
    "refuses a %s file carrying identifiers, and stores nothing",
    async (family) => {
      const res = await upload(SENSITIVE, family);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe("sensitive_data_quarantined");
      expect(saveMoveArtifactMock).not.toHaveBeenCalled();
      expect(ingestMock).not.toHaveBeenCalled();
    },
  );

  it("stores and ingests a clean file as before", async () => {
    const res = await upload(CLEAN, "uploaded_evidence");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveMoveArtifactMock).toHaveBeenCalledTimes(1);
    expect(ingestMock).toHaveBeenCalledTimes(1);
    expect((savedArtifactArguments[0]?.[1] as { phase: number }).phase).toBe(2);
    expect((ingestedEvidenceArguments[0]?.[1] as { phase: number }).phase).toBe(
      2,
    );
  });

  it("stores a P1 charter declaration on the human-review evidence record", async () => {
    const res = await upload(CLEAN, "uploaded_evidence", {
      phase: 1,
      evidenceFamily: "charter_sponsor",
    });

    expect(res.status).toBe(200);
    expect(ingestedEvidenceArguments[0]?.[1]).toEqual(
      expect.objectContaining({
        phase: 1,
        declaredFamilyKey: "charter_sponsor",
      }),
    );
  });

  it("rejects a P1 charter family declared against a later-phase upload", async () => {
    const res = await upload(CLEAN, "uploaded_evidence", {
      phase: 2,
      evidenceFamily: "charter_sponsor",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "unknown_evidence_family" });
    expect(saveMoveArtifactMock).not.toHaveBeenCalled();
    expect(ingestMock).not.toHaveBeenCalled();
  });
});
