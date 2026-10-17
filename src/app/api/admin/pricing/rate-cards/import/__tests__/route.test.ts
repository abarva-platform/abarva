import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockPreviewClientRateCardImport = jest.fn();

const mockRequireTenantAdmin = jest.fn();
const mockHasTenantAdminAccess = jest.fn();
// The real rate-card authority runs; only the two role lookups under it are mocked.
jest.mock("@/lib/auth/tenant-roles", () => ({
  requireTenantAdmin: (...args: unknown[]) => mockRequireTenantAdmin(...args),
}));
jest.mock("@/lib/admin/tenant-admin-access", () => ({
  hasTenantAdminAccess: (...args: unknown[]) => mockHasTenantAdminAccess(...args),
}));

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
    mockRequireTenancy.mockResolvedValue({ clientId: "c1", clientKey: "apexretail", userId: "user-1", clerkUserId: "clerk-1" });
    mockRequireTenantAdmin.mockReset().mockResolvedValue(undefined);
    mockHasTenantAdminAccess.mockReset().mockResolvedValue(false);
  });

  it("refuses a member who is not a workspace admin before reading the file", async () => {
    mockRequireTenantAdmin.mockRejectedValue(new Error("forbidden_tenant_admin_required"));
    const formData = new FormData();
    formData.set("file", new File(["role_or_band_ref\n"], "card.csv", { type: "text/csv" }));
    const response = await POST(multipartRequest(formData));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "rate_card_admin_required", detail: expect.stringContaining("workspace admin") });
    expect(mockPreviewClientRateCardImport).not.toHaveBeenCalled();
  });

  it("admits a user whose access policy lets them administer the workspace", async () => {
    mockRequireTenantAdmin.mockRejectedValue(new Error("forbidden_tenant_admin_required"));
    mockHasTenantAdminAccess.mockResolvedValue(true);
    const response = await POST(multipartRequest(new FormData()));
    expect(response.status).toBe(400); // past the gate, refused only for the missing file
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
