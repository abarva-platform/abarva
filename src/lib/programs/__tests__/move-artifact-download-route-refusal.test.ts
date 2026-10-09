// `GET /api/v1/programs/:programId/artifacts/:artifactId/download` is the href
// behind BOTH controls on every document-cabinet row ("Open" via
// `artifactInlinePreviewUrl`, "Download" via `artifactFinalDownloadUrl`), and
// both are plain `<a>` elements. There is no `fetch` of this route anywhere in
// the product, so a refusal body is not parsed by any client — the browser
// renders it as a page, and the raw JSON IS the screen the reader gets.
//
// That makes the mapping from cause to status and sentence the whole fix: the
// route used to answer all three causes with one 404 reading
// `artifact_unavailable` / "not found or storage unconfigured".
//
// The producer's own labelling is pinned separately, against the real row and
// download behaviour, in
// `src/lib/programs/deliverables/__tests__/move-artifacts.test.ts` — these
// cases mock the producer, so they cannot prove it classifies correctly, only
// that the route reports what it is handed.
//
// This suite lives here rather than beside the route because
// `src/lib/programs/__tests__` is swept wholesale by the required AI surface
// control catalog, so it is merge-blocking with no workflow edit.

import { moveArtifactDownloadRefusal } from "@/lib/programs/move-artifact-download-refusal";
import type { MoveArtifactDownloadRefusalReason } from "@/lib/programs/move-artifact-download-refusal";

const mockRequireTenancy = jest.fn();
const mockTenancyErrorResponse = jest.fn();
const mockDownloadArtifactOutcome = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => mockTenancyErrorResponse(err),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  downloadArtifactOutcome: (...args: unknown[]) =>
    mockDownloadArtifactOutcome(...args),
}));

const ROUTE =
  "@/app/api/v1/programs/[programId]/artifacts/[artifactId]/download/route";

async function callRoute(url = "https://app.example/download") {
  const { GET } = (await import(ROUTE)) as {
    GET: (
      req: unknown,
      ctx: { params: Promise<{ programId: string; artifactId: string }> },
    ) => Promise<Response>;
  };
  return GET(
    { nextUrl: new URL(url) },
    { params: Promise.resolve({ programId: "move-1", artifactId: "art-1" }) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "tenant-1",
    clientKey: "meridian",
    userId: "user-1",
  });
});

describe("the artifact download route reports the cause it was given", () => {
  const CASES: Array<{
    reason: MoveArtifactDownloadRefusalReason;
    status: number;
    error: string;
  }> = [
    { reason: "artifact_not_found", status: 404, error: "artifact_not_found" },
    {
      reason: "bytes_never_retained",
      status: 410,
      error: "artifact_bytes_never_retained",
    },
    {
      reason: "storage_unreachable",
      status: 503,
      error: "artifact_storage_unreachable",
    },
  ];

  it.each(CASES)(
    "answers $reason with $status and its own sentence",
    async ({ reason, status, error }) => {
      mockDownloadArtifactOutcome.mockResolvedValue({ ok: false, reason });

      const res = await callRoute();
      const body = (await res.json()) as { error: string; detail: string };

      expect(res.status).toBe(status);
      expect(body.error).toBe(error);
      expect(body.detail).toBe(moveArtifactDownloadRefusal(reason).detail);
    },
  );

  it("gives the three causes three different screens", async () => {
    const seen: Array<{ status: number; detail: string }> = [];
    for (const { reason } of CASES) {
      mockDownloadArtifactOutcome.mockResolvedValue({ ok: false, reason });
      const res = await callRoute();
      const body = (await res.json()) as { detail: string };
      seen.push({ status: res.status, detail: body.detail });
    }

    expect(new Set(seen.map((s) => s.status)).size).toBe(CASES.length);
    expect(new Set(seen.map((s) => s.detail)).size).toBe(CASES.length);
  });

  it("never renders the bare disjunction it replaced", async () => {
    for (const { reason } of CASES) {
      mockDownloadArtifactOutcome.mockResolvedValue({ ok: false, reason });
      const res = await callRoute();
      const body = (await res.json()) as { error: string; detail: string };

      expect(body.error).not.toBe("artifact_unavailable");
      expect(body.detail).not.toBe("not found or storage unconfigured");
      expect(body.detail).toEqual(expect.any(String));
      expect(body.detail.length).toBeGreaterThan(40);
    }
  });

  it("fences the lookup to the Move in the path", async () => {
    mockDownloadArtifactOutcome.mockResolvedValue({
      ok: false,
      reason: "artifact_not_found",
    });

    await callRoute();

    expect(mockDownloadArtifactOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "meridian" }),
      "art-1",
      "move-1",
    );
  });
});

describe("the artifact download route still streams a healthy file", () => {
  beforeEach(() => {
    mockDownloadArtifactOutcome.mockResolvedValue({
      ok: true,
      file: {
        bytes: Buffer.from("report body"),
        fileName: "discovery-report.docx",
        fileFormat: "docx",
      },
    });
  });

  it("answers 200 with the recorded bytes as an attachment", async () => {
    const res = await callRoute();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="discovery-report.docx"',
    );
    expect(res.headers.get("content-length")).toBe("11");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("report body");
  });

  it("serves the preview control's inline request inline", async () => {
    const res = await callRoute("https://app.example/download?inline=1");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(
      'inline; filename="discovery-report.docx"',
    );
  });
});
