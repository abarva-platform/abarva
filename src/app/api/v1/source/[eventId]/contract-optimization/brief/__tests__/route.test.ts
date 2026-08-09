const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getSourcingEventMock = jest.fn();
const getContractOptimizationProfileMock = jest.fn();
const buildContractOptimizationBriefMarkdownMock = jest.fn();

jest.mock("@/app/api/v1/_intel-auth", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  tenancyErrorResponse: (...args: unknown[]) =>
    tenancyErrorResponseMock(...args),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: (...args: unknown[]) => getSourcingEventMock(...args),
}));

jest.mock("@/lib/source/contract-optimization", () => ({
  buildContractOptimizationBriefMarkdown: (...args: unknown[]) =>
    buildContractOptimizationBriefMarkdownMock(...args),
}));

jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: (...args: unknown[]) =>
    getContractOptimizationProfileMock(...args),
}));

jest.mock("docx", () => ({
  Packer: { toBuffer: jest.fn() },
}));

jest.mock("@/lib/exports-shared/docx-base", () => ({
  DOCX_CONTENT_TYPE:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}));

jest.mock("@/lib/exports-shared/pdf-base", () => ({
  PDF_CONTENT_TYPE: "application/pdf",
}));

jest.mock("@/lib/source/exports/renderers/narrative-docx", () => ({
  buildNarrativeDocx: jest.fn(),
}));

jest.mock("@/lib/source/exports/renderers/narrative-pdf", () => ({
  buildNarrativePdf: jest.fn(),
}));

jest.mock("@react-pdf/renderer", () => ({
  pdf: jest.fn(),
}));

function request(
  url = "https://app.abarva.ai/api/v1/source/event-1/contract-optimization/brief",
) {
  return {
    nextUrl: new URL(url),
  } as unknown as import("next/server").NextRequest;
}

describe("/api/v1/source/[eventId]/contract-optimization/brief", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue({
      clientId: "client-tenant-b",
      userId: "user-1",
    });
    getActiveClientRowMock.mockResolvedValue({
      id: "client-tenant-b",
      key: "tenant-b",
      name: "Tenant B",
    });
    getSourcingEventMock.mockResolvedValue({
      id: "event-1",
      code: "MER-CONTRACT-2026",
      name: "Incumbent agreement renewal",
    });
    getContractOptimizationProfileMock.mockResolvedValue(null);
  });

  it("does not serve a contract-optimization pack unless an exact-event profile is persisted", async () => {
    const { GET } = await import("../route");

    const response = await GET(request(), {
      params: Promise.resolve({ eventId: "event-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "not_available",
    });
    expect(getContractOptimizationProfileMock).toHaveBeenCalledWith(
      "tenant-b",
      "event-1",
    );
    expect(buildContractOptimizationBriefMarkdownMock).not.toHaveBeenCalled();
  });
});

export {};
