/**
 * GET /api/v1/artifacts/[artifactId] route tests.
 *
 * Proves the prescribed-format rendering on download:
 *   - a docx artifact downloads as a real DOCX buffer (PK zip magic + content-type)
 *   - an xlsx (financial model) artifact downloads as a real XLSX buffer
 *   - ?format=docx|xlsx|html overrides the persisted format
 *   - an older artifact with NO renderableDoc falls back to stored HTML (never 500)
 *   - html artifacts still serve inline HTML (preview behavior preserved)
 *
 * Identity / tenancy boundaries are mocked at the module edge; the renderers,
 * repository helpers, and route logic run for real.
 */

export {};

import { goodDocument } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";

const mockGetUser = jest.fn();
const mockGetClientKey = jest.fn();
const mockGetArtifact = jest.fn();

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => mockGetUser(),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientKey: () => mockGetClientKey(),
  // The route resolves the active client row to scope the artifact lookup by
  // client UUID. (Mock added: the route gained getActiveClientRow but this mock
  // had only getActiveClientKey, so the suite threw "not a function".)
  getActiveClientRow: () =>
    Promise.resolve({ id: "c1", key: "c1", name: "C1", industry_code: null }),
}));

jest.mock("@/lib/artifacts/repository", () => {
  const actual = jest.requireActual("@/lib/artifacts/repository");
  return {
    ...actual,
    getGeneratedArtifactById: (...args: unknown[]) => mockGetArtifact(...args),
  };
});

import { GET } from "../route";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function recordWith(
  outputFormat: GeneratedArtifactRecord["outputFormat"],
  metadata: Record<string, unknown>,
): GeneratedArtifactRecord {
  return {
    id: ZERO_UUID,
    clientId: "c1",
    artifactType: "move_board_pack",
    sourceArtifactRef: "move:m1:charter",
    renderEngine: "internal",
    outputFormat,
    blobUrl: `/api/v1/artifacts/${ZERO_UUID}`,
    blobSha256: "x",
    qualityScore: 1,
    evidenceLedgerIds: [],
    citedInputIds: [],
    generationEgressAudit: null,
    renderedAt: new Date(0).toISOString(),
    renderedBy: "u1",
    quarantineReason: null,
    supersededBy: null,
    metadata,
  };
}

function reqUrl(query = ""): Request {
  return new Request(`https://app.test/api/v1/artifacts/${ZERO_UUID}${query}`);
}

const params = Promise.resolve({ artifactId: ZERO_UUID });

beforeEach(() => {
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockGetClientKey.mockResolvedValue("c1");
  mockGetArtifact.mockReset();
});

describe("GET /api/v1/artifacts/[artifactId]", () => {
  it("renders a docx artifact as a real DOCX buffer", async () => {
    mockGetArtifact.mockResolvedValue(
      recordWith("docx", { renderedHtml: "<html>x</html>", renderableDoc: goodDocument() }),
    );

    const res = await GET(reqUrl(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename=".+\.docx"/);
    const buf = Buffer.from(await res.arrayBuffer());
    // DOCX is a zip — first two bytes are 'PK'.
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("renders a financial-model (xlsx) artifact as a real XLSX buffer", async () => {
    // goodDocument() includes an xlsx-flagged table, so the companion workbook builds.
    mockGetArtifact.mockResolvedValue(
      recordWith("xlsx", { renderedHtml: "<html>x</html>", renderableDoc: goodDocument() }),
    );

    const res = await GET(reqUrl(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toMatch(/\.xlsx"/);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK"); // xlsx is also a zip
  });

  it("honors ?format=docx on an xlsx-prescribed artifact", async () => {
    mockGetArtifact.mockResolvedValue(
      recordWith("xlsx", { renderedHtml: "<html>x</html>", renderableDoc: goodDocument() }),
    );

    const res = await GET(reqUrl("?format=docx"), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("serves inline HTML when ?format=html", async () => {
    mockGetArtifact.mockResolvedValue(
      recordWith("docx", { renderedHtml: "<html>preview</html>", renderableDoc: goodDocument() }),
    );

    const res = await GET(reqUrl("?format=html"), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toContain("preview");
  });

  it("falls back to stored HTML when a docx artifact has no renderableDoc (never 500)", async () => {
    mockGetArtifact.mockResolvedValue(
      recordWith("docx", { renderedHtml: "<html>legacy</html>" }),
    );

    const res = await GET(reqUrl(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(res.headers.get("x-generated-artifact-format-fallback")).toBe("html");
    expect(await res.text()).toContain("legacy");
  });

  it("preserves inline-HTML preview for html artifacts", async () => {
    mockGetArtifact.mockResolvedValue(
      recordWith("html", { renderedHtml: "<html>inline</html>" }),
    );

    const res = await GET(reqUrl(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toContain("inline");
  });

  it("401s without a session", async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await GET(reqUrl(), { params });
    expect(res.status).toBe(401);
  });

  it("404s a malformed artifact id without hitting the DB", async () => {
    const res = await GET(
      new Request("https://app.test/api/v1/artifacts/not-a-uuid"),
      { params: Promise.resolve({ artifactId: "not-a-uuid" }) },
    );
    expect(res.status).toBe(404);
    expect(mockGetArtifact).not.toHaveBeenCalled();
  });
});
