const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};
const saveMoveArtifact = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: mockAzureRead,
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact,
}));

function contentExportRequest(format = "html"): Request {
  return new Request(
    `http://localhost/api/programs/program_1/deliverables/deliv_1/content-export?format=${format}`,
  );
}

describe("GET /api/programs/[id]/deliverables/[deliverableId]/content-export read plane", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({
      clientId: "client_1",
      clientKey: "apex-retail",
      userId: "user_1",
      email: "maestro@example.com",
    });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    saveMoveArtifact.mockResolvedValue({
      artifactId: "artifact_1",
      version: 1,
      blobPath:
        "moves/apex-retail/program_1/generated/p0/p2_package_html/v1/phase-2-package.html",
      blobStored: true,
    });
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === "deliverables_v2") {
        return {
          id: "deliv_1",
          engagement_id: "program_1",
          deliverable_type_key: "p2_package",
          title: "Phase 2 Package",
        };
      }
      if (request.table === "deliverable_versions") {
        return {
          content: "# Executive Summary\n\n- Margin recovery plan",
          version: 4,
          generated_at: "2026-05-29T00:00:00Z",
        };
      }
      return null;
    });
  });

  it("exports latest deliverable content through azureRead", async () => {
    const { GET } =
      await import("@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route");
    const res = await GET(contentExportRequest(), {
      params: Promise.resolve({ id: "program_1", deliverableId: "deliv_1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Disposition")).toContain(
      "phase-2-package.html",
    );
    expect(res.headers.get("X-Move-Artifact-Persisted")).toBe("true");
    expect(res.headers.get("X-Move-Artifact-Blob-Stored")).toBe("true");
    await expect(res.text()).resolves.toContain(
      "<li>Margin recovery plan</li>",
    );
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "apex-retail" }),
      expect.objectContaining({
        moveId: "program_1",
        artifactType: "p2_package_html",
        fileName: "phase-2-package.html",
        fileFormat: "html",
        sourceBasis: "deliverables_v2",
        metadata: expect.objectContaining({
          deliverableId: "deliv_1",
          deliverableVersion: 4,
          exportFormat: "html",
        }),
      }),
    );
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "deliverables_v2",
        where: { id: "deliv_1", engagement_id: "program_1" },
      }),
    );
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "deliverable_versions",
        where: { deliverable_id: "deliv_1" },
        orderBy: { column: "version", direction: "desc" },
      }),
    );
  });

  it("persists rendered DOCX bytes into the artifact vault", async () => {
    saveMoveArtifact.mockResolvedValue({
      artifactId: "artifact_docx",
      version: 1,
      blobPath:
        "moves/apex-retail/program_1/generated/p0/p2_package_docx/v1/phase-2-package.docx",
      blobStored: true,
    });

    const { GET } =
      await import("@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route");
    const res = await GET(contentExportRequest("docx"), {
      params: Promise.resolve({ id: "program_1", deliverableId: "deliv_1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain(
      "wordprocessingml.document",
    );
    expect(res.headers.get("X-Move-Artifact-Id")).toBe("artifact_docx");
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        artifactType: "p2_package_docx",
        fileName: "phase-2-package.docx",
        fileFormat: "docx",
        body: expect.any(Uint8Array),
      }),
    );
    const call = saveMoveArtifact.mock.calls[0]?.[1];
    expect(call.body.byteLength).toBeGreaterThan(100);
  });

  it("persists rendered XLSX bytes into the artifact vault", async () => {
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === "deliverables_v2") {
        return {
          id: "deliv_1",
          engagement_id: "program_1",
          deliverable_type_key: "financial_model",
          title: "Financial Model",
        };
      }
      if (request.table === "deliverable_versions") {
        return {
          content:
            "## ASSUMPTIONS\n| Driver | Value |\n| --- | --- |\n| Run cost | $100000 |\n",
          version: 2,
          generated_at: "2026-05-29T00:00:00Z",
        };
      }
      return null;
    });
    saveMoveArtifact.mockResolvedValue({
      artifactId: "artifact_xlsx",
      version: 1,
      blobPath:
        "moves/apex-retail/program_1/generated/p0/financial_model_xlsx/v1/financial-model.xlsx",
      blobStored: true,
    });

    const { GET } =
      await import("@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route");
    const res = await GET(contentExportRequest("xlsx"), {
      params: Promise.resolve({ id: "program_1", deliverableId: "deliv_1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("spreadsheetml.sheet");
    expect(res.headers.get("X-Move-Artifact-Id")).toBe("artifact_xlsx");
    expect(saveMoveArtifact).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        artifactType: "financial_model_xlsx",
        fileName: "financial-model.xlsx",
        fileFormat: "xlsx",
        body: expect.any(Buffer),
      }),
    );
    const call = saveMoveArtifact.mock.calls[0]?.[1];
    expect(call.body.byteLength).toBeGreaterThan(100);
  });

  it("keeps no-content response when latest version is empty", async () => {
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === "deliverables_v2") {
        return {
          id: "deliv_1",
          engagement_id: "program_1",
          deliverable_type_key: "p2_package",
          title: "Phase 2 Package",
        };
      }
      if (request.table === "deliverable_versions") {
        return {
          content: "   ",
          version: 5,
          generated_at: "2026-05-29T00:00:00Z",
        };
      }
      return null;
    });

    const { GET } =
      await import("@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route");
    const res = await GET(contentExportRequest(), {
      params: Promise.resolve({ id: "program_1", deliverableId: "deliv_1" }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "no_content" });
  });
});

export {};
