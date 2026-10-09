/**
 * @jest-environment node
 */

// POST /api/v1/programs/:programId/artifacts/upload — the catch answers with a
// body, and the body names which writes had landed.
//
// Lives here, not beside the route, deliberately. The route's own `__tests__`
// directory is reached only by the broad `src/app/api/v1/programs` argument in
// `unit-suites.yml`, and that workflow is required by nothing — a regression in
// it could not fail a merge. `src/lib/programs/__tests__` is wired as a
// DIRECTORY by the required AI surface control catalog, so these cases are
// merge-blocking with no workflow edit.
//
// The mocks here are deliberately NOT the ones the sibling suite uses. That
// suite's `tenancyErrorResponse` returns a 500 instead of re-throwing, so the
// re-throw this lane fixes cannot happen under it and the named arm is never
// reached. The mock below re-throws exactly as `@/lib/auth/tenancy` does,
// because that last statement IS the defect.

import {
  classifyMoveUploadWriteFailure,
  type MoveUploadWriteStage,
} from "@/lib/programs/move-upload-write-stage";
import { describeMoveUploadRefusal } from "@/lib/programs/move-upload-refusal";

class FakeTenancyError extends Error {}

const mockAssessSensitivity = jest.fn();
const mockIngest = jest.fn();
const mockSaveMoveArtifact = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: async () => ({
    clientId: "tenant-id",
    clientKey: "tenant-key",
    userId: "user-id",
    email: "reviewer@example.test",
  }),
  // The real responder's last statement is `throw err`. Anything that is not
  // one of its four tenancy codes is re-thrown, which is what used to reject
  // the handler and produce a response with no body at all.
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof FakeTenancyError) {
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }
    throw err;
  },
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  ...jest.requireActual("@/lib/programs/deliverables/move-artifacts"),
  saveMoveArtifact: (...args: unknown[]) => mockSaveMoveArtifact(...args),
}));

jest.mock("@/lib/programs/current-state-doc-ingest", () => ({
  assessMoveUploadSensitivity: (...args: unknown[]) =>
    mockAssessSensitivity(...args),
  ingestUploadedMoveEvidence: (...args: unknown[]) => mockIngest(...args),
}));

jest.mock("@/lib/programs/queries", () => ({
  ...jest.requireActual("@/lib/programs/queries"),
  getProgramById: async () => ({ id: "move-1", archetype: null }),
}));

const ROUTE = "@/app/api/v1/programs/[programId]/artifacts/upload/route";
const FILE_NAME = "discovery-notes.md";

async function upload(): Promise<Response> {
  const { NextRequest } = await import("next/server");
  const { POST } = (await import(ROUTE)) as {
    POST: (
      req: unknown,
      ctx: { params: Promise<{ programId: string }> },
    ) => Promise<Response>;
  };
  const form = new FormData();
  form.append(
    "file",
    new File(["Five agent steps across four systems."], FILE_NAME, {
      type: "text/markdown",
    }),
  );
  form.append("phase", "2");
  form.append("family", "uploaded_evidence");
  const req = new NextRequest(
    "http://localhost/api/v1/programs/move-1/artifacts/upload",
    { method: "POST", body: form },
  );
  return POST(req, { params: Promise.resolve({ programId: "move-1" }) });
}

/** A parse summary JSON cannot carry — the shape a document parser produces. */
function circularSummary(): unknown {
  const section: Record<string, unknown> = { heading: "Scope" };
  section.parent = section;
  return [section];
}

function expectedCodeFor(stage: MoveUploadWriteStage): string {
  return classifyMoveUploadWriteFailure(stage).code;
}

const ALL_CODES = (
  ["before_storage", "storing", "stored"] as MoveUploadWriteStage[]
).map(expectedCodeFor);

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
  // The route logs the stage on every exit. Silenced so a suite that
  // deliberately throws three times does not bury its own result.
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockAssessSensitivity.mockResolvedValue({ decision: "allow" });
  mockSaveMoveArtifact.mockResolvedValue({
    artifactId: "artifact-1",
    version: 1,
    blobPath: "moves/tenant-key/move-1/uploads/x/v1/discovery-notes.md",
    blobStored: true,
  });
  mockIngest.mockResolvedValue({
    evidenceId: "evidence-1",
    reviewId: "review-1",
    reviewState: "pending_review",
    parseMethod: "markdown-line-parser",
    warnings: [],
    whatFound: [],
    whereUsed: [],
  });
});

describe("a failure before either write", () => {
  it("names the pre-storage stage and says nothing was stored", async () => {
    mockAssessSensitivity.mockRejectedValue(
      new Error("scanner pool exhausted"),
    );

    const res = await upload();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(expectedCodeFor("before_storage"));
    expect(mockSaveMoveArtifact).not.toHaveBeenCalled();
    expect(
      describeMoveUploadRefusal({ code: body.error, fileName: FILE_NAME }),
    ).toMatch(/nothing was stored/);
  });

  it("does not report a write that was never attempted", async () => {
    mockAssessSensitivity.mockRejectedValue(
      new Error("scanner pool exhausted"),
    );
    const body = await (await upload()).json();
    expect(body.error).not.toBe(expectedCodeFor("storing"));
    expect(body.error).not.toBe(expectedCodeFor("stored"));
  });
});

describe("a failure inside the artifact write", () => {
  it("names the unregistered stage, not the pre-storage one", async () => {
    mockSaveMoveArtifact.mockRejectedValue(
      new Error('insert into "move_artifacts" violates not-null constraint'),
    );

    const res = await upload();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(expectedCodeFor("storing"));
    expect(body.error).not.toBe(expectedCodeFor("before_storage"));
  });

  it("stops the reviewer being told nothing was stored", async () => {
    // The bytes may be in the container. The row is what the cabinet lists, so
    // the old sentence sent the reviewer to look somewhere that shows nothing.
    mockSaveMoveArtifact.mockRejectedValue(new Error("insert failed"));
    const body = await (await upload()).json();
    const sentence = describeMoveUploadRefusal({
      code: body.error,
      detail: body.detail,
      fileName: FILE_NAME,
    });
    expect(sentence).not.toMatch(/nothing was stored/);
    expect(sentence).toMatch(/not be listed/);
    expect(sentence).toMatch(/[Uu]pload it again/);
  });
});

describe("a failure after both writes have landed", () => {
  it("names the completed stage when the response cannot be serialised", async () => {
    mockIngest.mockResolvedValue({
      evidenceId: "evidence-1",
      reviewId: "review-1",
      reviewState: "pending_review",
      parseMethod: "markdown-line-parser",
      warnings: [],
      whatFound: circularSummary(),
      whereUsed: [],
    });

    const res = await upload();
    const body = await res.json();

    expect(mockSaveMoveArtifact).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(body.error).toBe(expectedCodeFor("stored"));
  });

  it("tells the reviewer the file landed and not to upload it again", async () => {
    // The worst outcome this lane prevents: before the split this reached the
    // screen as "was not uploaded … Try again", for a file that was stored,
    // registered and queued for extraction. Acting on it files a second copy.
    mockIngest.mockResolvedValue({
      evidenceId: "evidence-1",
      reviewId: "review-1",
      reviewState: "pending_review",
      parseMethod: "markdown-line-parser",
      warnings: [],
      whatFound: circularSummary(),
      whereUsed: [],
    });

    const body = await (await upload()).json();
    const sentence = describeMoveUploadRefusal({
      code: body.error,
      detail: body.detail,
      fileName: FILE_NAME,
    });
    expect(sentence).toMatch(/stored and registered/);
    expect(sentence).toMatch(/Do not upload it again/);
    expect(sentence).not.toMatch(/nothing was stored/);
  });
});

describe("what every failing exit owes the reader", () => {
  const exits: Array<[MoveUploadWriteStage, () => void]> = [
    [
      "before_storage",
      () => mockAssessSensitivity.mockRejectedValue(new Error("scanner down")),
    ],
    [
      "storing",
      () => mockSaveMoveArtifact.mockRejectedValue(new Error("insert failed")),
    ],
    [
      "stored",
      () =>
        mockIngest.mockResolvedValue({
          evidenceId: "e",
          reviewId: "r",
          reviewState: "pending_review",
          parseMethod: "p",
          warnings: [],
          whatFound: circularSummary(),
          whereUsed: [],
        }),
    ],
  ];

  it.each(exits)(
    "answers the %s exit with a readable body, never an unbodied rejection",
    async (stage, arrange) => {
      arrange();
      const res = await upload();
      // The defect in one assertion: the handler used to REJECT here, so this
      // await threw instead of yielding a response at all.
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe(expectedCodeFor(stage));
      expect(typeof body.detail).toBe("string");
      expect(
        describeMoveUploadRefusal({
          code: body.error,
          detail: body.detail,
          fileName: FILE_NAME,
        }),
      ).not.toBe(describeMoveUploadRefusal({ fileName: FILE_NAME }));
    },
  );

  it.each(exits)(
    "gives the %s exit a code no other exit uses",
    async (stage, arrange) => {
      arrange();
      const body = await (await upload()).json();
      const others = ALL_CODES.filter(
        (code) => code !== expectedCodeFor(stage),
      );
      expect(others).not.toContain(body.error);
    },
  );
});

describe("the tenancy contract is untouched", () => {
  it("returns the tenancy responder's own answer unchanged", async () => {
    mockAssessSensitivity.mockRejectedValue(new FakeTenancyError("no session"));

    const res = await upload();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("unauthenticated");
    expect(ALL_CODES).not.toContain(body.error);
  });

  it("still answers a clean upload with the success body", async () => {
    const res = await upload();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.artifactId).toBe("artifact-1");
    expect(body.evidence?.reviewId).toBe("review-1");
    expect(body.error).toBeUndefined();
  });
});
