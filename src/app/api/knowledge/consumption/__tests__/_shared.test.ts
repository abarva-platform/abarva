import type { NextRequest } from "next/server";

const mockResolveFoundationPreviewTenantKeyForSession = jest.fn();
const mockIsFoundationPreviewOperatorSession = jest.fn();
const mockIsFoundationPreviewTenantKey = jest.fn();
const mockIsFoundationPreviewTenantSession = jest.fn();
const mockIsPlatformAdminSession = jest.fn();
const mockRequireTenancy = jest.fn();
const mockTenancyErrorResponse = jest.fn();
const mockGetConsumptionReader = jest.fn();
const mockGetTenantScopedConsumptionReader = jest.fn();

jest.mock("@/lib/auth/foundation-preview-session", () => ({
  isFoundationPreviewOperatorSession: () =>
    mockIsFoundationPreviewOperatorSession(),
  isFoundationPreviewTenantKey: (tenantKey: string) =>
    mockIsFoundationPreviewTenantKey(tenantKey),
  isFoundationPreviewTenantSession: (tenantKey: string) =>
    mockIsFoundationPreviewTenantSession(tenantKey),
  resolveFoundationPreviewTenantKeyForSession: () =>
    mockResolveFoundationPreviewTenantKeyForSession(),
}));

jest.mock("@/lib/auth/platform-admin-session", () => ({
  isPlatformAdminSession: () => mockIsPlatformAdminSession(),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => mockTenancyErrorResponse(err),
}));

jest.mock("@/lib/knowledge/consumption-server", () => ({
  ConsumptionReader: class ConsumptionReader {},
  getConsumptionReader: () => mockGetConsumptionReader(),
  getTenantScopedConsumptionReader: (tenantKey: string) =>
    mockGetTenantScopedConsumptionReader(tenantKey),
}));

import { handleConsumption } from "@/app/api/knowledge/consumption/_shared";

function requestWithBody(body: Record<string, unknown>): NextRequest {
  return new Request("https://app.abarva.ai/api/knowledge/consumption/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveFoundationPreviewTenantKeyForSession.mockResolvedValue(null);
  mockIsFoundationPreviewOperatorSession.mockResolvedValue(false);
  mockIsFoundationPreviewTenantKey.mockImplementation((tenantKey: string) =>
    ["airline-demo-new", "healthcare-demo-new"].includes(tenantKey),
  );
  mockIsFoundationPreviewTenantSession.mockResolvedValue(false);
  mockIsPlatformAdminSession.mockResolvedValue(false);
  mockRequireTenancy.mockResolvedValue({
    clientKey: "apex-retail",
    userId: "user_123",
  });
  mockTenancyErrorResponse.mockReturnValue(
    Response.json({ error: "no_client" }, { status: 403 }),
  );
  mockGetConsumptionReader.mockReturnValue({ readerKind: "generic" });
  mockGetTenantScopedConsumptionReader.mockImplementation((tenantKey: string) => ({
    readerKind: "foundation",
    tenantKey,
  }));
});

describe("handleConsumption tenant resolution", () => {
  it("prefers the signed-in Foundation proof tenant over generic active-client tenancy", async () => {
    mockResolveFoundationPreviewTenantKeyForSession.mockResolvedValue(
      "airline-demo-new",
    );

    const response = await handleConsumption(
      requestWithBody({ tenantKey: "healthcare-demo-new" }),
      async ({ reader, tenantKey, body }) => ({
        bodyTenantKey: body.tenantKey,
        reader,
        tenantKey,
      }),
    );

    await expect(response.json()).resolves.toEqual({
      bodyTenantKey: "healthcare-demo-new",
      reader: { readerKind: "foundation", tenantKey: "airline-demo-new" },
      tenantKey: "airline-demo-new",
    });
    expect(mockRequireTenancy).not.toHaveBeenCalled();
    expect(mockGetTenantScopedConsumptionReader).toHaveBeenCalledWith(
      "airline-demo-new",
    );
  });

  it("falls back to generic tenancy for non-Foundation sessions", async () => {
    const response = await handleConsumption(
      requestWithBody({ tenantKey: "healthcare-demo-new" }),
      async ({ reader, tenantKey }) => ({
        reader,
        tenantKey,
      }),
    );

    await expect(response.json()).resolves.toEqual({
      reader: { readerKind: "generic" },
      tenantKey: "apex-retail",
    });
    expect(mockRequireTenancy).toHaveBeenCalledTimes(1);
    expect(mockGetConsumptionReader).toHaveBeenCalledTimes(1);
  });
});
