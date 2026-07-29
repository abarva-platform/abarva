const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getSourcingEventMock = jest.fn();
const isSkyHarborContractOptimizationEventMock = jest.fn();
const buildContractOptimizationMveProfileMock = jest.fn();
const buildSkyHarborAmsExistingContractInputMock = jest.fn();
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
  buildContractOptimizationMveProfile: (...args: unknown[]) =>
    buildContractOptimizationMveProfileMock(...args),
  buildSkyHarborAmsExistingContractInput: (...args: unknown[]) =>
    buildSkyHarborAmsExistingContractInputMock(...args),
  isSkyHarborContractOptimizationEvent: (...args: unknown[]) =>
    isSkyHarborContractOptimizationEventMock(...args),
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

function request(url = "https://app.abarva.ai/api/v1/source/event-1/contract-optimization/brief") {
  return {
    nextUrl: new URL(url),
  } as unknown as import("next/server").NextRequest;
}

describe("/api/v1/source/[eventId]/contract-optimization/brief", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue({
      clientId: "client-airline",
      userId: "user-1",
    });
    getActiveClientRowMock.mockResolvedValue({
      id: "client-airline",
      key: "airline-demo-new",
      name: "Airline Demo New",
    });
    getSourcingEventMock.mockResolvedValue({
      id: "event-1",
      code: "AIR-AMS-2026",
      name: "Application managed services renewal",
    });
    isSkyHarborContractOptimizationEventMock.mockReturnValue(false);
  });

  it("does not serve a legacy fixture-specific contract-optimization pack for governed foundation events", async () => {
    const { GET } = await import("../route");

    const response = await GET(request(), {
      params: Promise.resolve({ eventId: "event-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "not_available",
    });
    expect(isSkyHarborContractOptimizationEventMock).toHaveBeenCalledWith({
      activeClientKey: "airline-demo-new",
      eventCode: "AIR-AMS-2026",
      eventName: "Application managed services renewal",
    });
    expect(buildSkyHarborAmsExistingContractInputMock).not.toHaveBeenCalled();
    expect(buildContractOptimizationMveProfileMock).not.toHaveBeenCalled();
    expect(buildContractOptimizationBriefMarkdownMock).not.toHaveBeenCalled();
  });
});

export {};
