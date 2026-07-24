import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockPreviewClientRateCardImport = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () => new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/pricing/governed-load/rate-card-import", () => ({
  previewClientRateCardImport: (...args: unknown[]) => mockPreviewClientRateCardImport(...args),
}));

import { POST } from "../route";

function multipartRequest(formData: FormData) {
  return new NextRequest("http://localhost/api/admin/pricing/rate-cards/import", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/admin/pricing/rate-cards/import", () => {
  beforeEach(() => {
    mockRequireTenancy.mockReset();
    mockPreviewClientRateCardImport.mockReset();
    mockRequireTenancy.mockResolvedValue({ clientId: "c1", clientKey: "apexretail", userId: "user-1" });
  });

  it("400s when no file is provided", async () => {
    const response = await POST(multipartRequest(new FormData()));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ ok: false, error: "file_required" });
  });

  it("never writes to the database — returns the preview only", async () => {
    mockPreviewClientRateCardImport.mockResolvedValue({
      tenantKey: "apex-retail",
      cardCode: "ENTERPRISE",
      taxonomyVersion: 1,
      currentVersion: null,
      parseErrors: [],
      validationErrors: [],
      validRowCount: 1,
      diff: { added: [{ identityKey: "x" }], changed: [], unchanged: [], removed: [] },
      linesToCommit: [{ roleOrBandRef: "ROL-001" }],
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File(
        ["role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to\nROL-001,,,,client_negotiated,hour,400,USD,2026-08-01,"],
        "client_rate_card.csv",
        { type: "text/csv" },
      ),
    );

    const response = await POST(multipartRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.preview.diff.added).toHaveLength(1);
    expect(mockPreviewClientRateCardImport).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "apex-retail" }),
    );
  });

  it("maps an unloaded taxonomy into a 409, not a generic 500", async () => {
    mockPreviewClientRateCardImport.mockRejectedValue(new Error("pricing_taxonomy_not_loaded: no current row"));

    const formData = new FormData();
    formData.set("file", new File(["a,b"], "client_rate_card.csv", { type: "text/csv" }));

    const response = await POST(multipartRequest(formData));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("pricing_taxonomy_not_loaded");
  });
});
