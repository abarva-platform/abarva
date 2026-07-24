import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockCommitClientRateCardImport = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () => new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/pricing/governed-load/rate-card-import", () => ({
  commitClientRateCardImport: (...args: unknown[]) => mockCommitClientRateCardImport(...args),
}));

import { POST } from "../route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/pricing/rate-cards/ENTERPRISE/approve", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validLine = {
  roleOrBandRef: "ROL-001",
  rateBasis: "client_negotiated",
  unit: "hour",
  rateValue: 400,
  validFrom: "2026-08-01",
};

describe("POST /api/admin/pricing/rate-cards/:id/approve", () => {
  beforeEach(() => {
    mockRequireTenancy.mockReset();
    mockCommitClientRateCardImport.mockReset();
    mockRequireTenancy.mockResolvedValue({ clientId: "c1", clientKey: "apexretail", userId: "user-1" });
  });

  it("400s when lines is missing", async () => {
    const response = await POST(jsonRequest({}), { params: Promise.resolve({ id: "ENTERPRISE" }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("lines_required");
  });

  it("400s when a line is missing required fields", async () => {
    const response = await POST(jsonRequest({ lines: [{ roleOrBandRef: "ROL-001" }] }), {
      params: Promise.resolve({ id: "ENTERPRISE" }),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("lines_invalid_shape");
  });

  it("commits with the caller's canonical tenant key and userId as approver", async () => {
    mockCommitClientRateCardImport.mockResolvedValue({ action: "new_version", version: 2, previousVersion: 1, cardId: "card-2" });

    const response = await POST(
      jsonRequest({ lines: [validLine], approvalRationale: "Confirmed with client" }),
      { params: Promise.resolve({ id: "ENTERPRISE" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result).toMatchObject({ action: "new_version", version: 2 });
    expect(mockCommitClientRateCardImport).toHaveBeenCalledWith({
      tenantKey: "apex-retail",
      cardCode: "ENTERPRISE",
      lines: [validLine],
      approvedBy: "user-1",
      approvalRationale: "Confirmed with client",
    });
  });
});
