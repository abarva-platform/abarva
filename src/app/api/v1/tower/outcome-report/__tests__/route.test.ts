const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadUserProgramAccessPolicyMock = jest.fn();
const listInitiativesForClientMock = jest.fn();
const listVendorsForClientMock = jest.fn();
const listKpisForClientMock = jest.fn();
const packerToBufferMock = jest.fn();

jest.mock("docx", () => ({
  Packer: {
    toBuffer: (...args: unknown[]) => packerToBufferMock(...args),
  },
}));

jest.mock("@/lib/auth/tenancy", () => ({
  __esModule: true,
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  tenancyErrorResponse: (...args: unknown[]) =>
    tenancyErrorResponseMock(...args),
}));

jest.mock("@/lib/active-client", () => ({
  __esModule: true,
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

jest.mock("@/lib/auth/current-user", () => ({
  __esModule: true,
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  __esModule: true,
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

jest.mock("@/lib/admin/ai-initiatives/queries", () => ({
  __esModule: true,
  listInitiativesForClient: (...args: unknown[]) =>
    listInitiativesForClientMock(...args),
  listVendorsForClient: (...args: unknown[]) =>
    listVendorsForClientMock(...args),
  listKpisForClient: (...args: unknown[]) => listKpisForClientMock(...args),
}));

jest.mock("@/lib/tower/today-resolution", () => ({
  __esModule: true,
  resolveTowerToday: () => "2026-06-03",
}));

jest.mock("@/lib/tower/exports", () => ({
  __esModule: true,
  DOCX_CONTENT_TYPE:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLSX_CONTENT_TYPE:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  buildTowerOutcomeReportPayload: (input: unknown) => input,
  renderTowerOutcomeReportDocx: () => ({ document: true }),
  renderTowerOutcomeReportXlsx: () => ({
    xlsx: {
      writeBuffer: async () =>
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x78, 0x6c]),
    },
  }),
}));

import { GET } from "../route";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";

const APEX_CLIENT = {
  id: "client_apex",
  key: "apexretail",
  name: "Apex Retail Group",
};

const MERIDIAN_CLIENT = {
  id: "client_meridian",
  key: "meridian",
  name: "Meridian Health System",
};

// The identity this suite hangs on has to satisfy isSameClientAdminFallback,
// which needs BOTH halves: same client as the active one, and admin-like. The
// previous fixture was a persona address dropped from the canonical
// client-admin roster in 6ebe6d4a9, so it was admin-like against no list, the
// three fallback cases were unreachable, and the widening case below could not
// tell the guard from its absence (T-483). The roster is not widened to suit
// the test; the test uses an address that is on it.
//
// FALLBACK_ADMIN's own tenant is the one its address infers to, which is
// FALLBACK_OWN_CLIENT. FALLBACK_OTHER_CLIENT is the tenant it must NOT reach.
// Written out, not read back out of CANONICAL_CLIENT_ADMIN_EMAILS. Taking it
// from that list makes the pin below assert that a list contains its own first
// element, which is true however the roster changes -- the same
// satisfied-by-a-name shape this item exists to remove. Measured: with the
// address read from the list, removing it from the roster left all five cases
// green.
const FALLBACK_ADMIN_EMAIL = "admin@abarva.ai";

const FALLBACK_OWN_CLIENT = MERIDIAN_CLIENT;
const FALLBACK_OTHER_CLIENT = APEX_CLIENT;

const FALLBACK_ADMIN = {
  personId: null,
  clerkUserId: "user_canonical_client_admin",
  // Deliberately null: isSameClient then rests on the address inference alone,
  // so dropping that half of the condition shows up here. The metadata half is
  // covered by the non-admin case below, which sets this key instead.
  metadataClientKey: null as string | null,
  name: "Canonical client admin",
  email: FALLBACK_ADMIN_EMAIL,
  primaryRole: "client_viewer",
  accessibleClients: [],
  defaultClientId: null,
};

function req(query: string): Request {
  return new Request(`http://localhost/api/v1/tower/outcome-report${query}`);
}

describe("GET /api/v1/tower/outcome-report", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockRejectedValue(new Error("no_client"));
    tenancyErrorResponseMock.mockReturnValue(
      Response.json(
        { error: "no_client", detail: "No active client for this user" },
        { status: 403 },
      ),
    );
    getCurrentUserMock.mockResolvedValue(FALLBACK_ADMIN);
    getActiveClientRowMock.mockImplementation((requestedClientKey?: string) => {
      if (requestedClientKey === FALLBACK_OTHER_CLIENT.key)
        return Promise.resolve(FALLBACK_OTHER_CLIENT);
      return Promise.resolve(FALLBACK_OWN_CLIENT);
    });
    loadUserProgramAccessPolicyMock.mockResolvedValue({
      accessLevel: "program_member",
    });
    listInitiativesForClientMock.mockResolvedValue([]);
    listVendorsForClientMock.mockResolvedValue([]);
    listKpisForClientMock.mockResolvedValue([]);
    packerToBufferMock.mockResolvedValue(
      Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x64, 0x6f]),
    );
  });

  it("pins the fallback fixture to the canonical client-admin roster", () => {
    // Without this, a future narrowing of the roster takes the three cases
    // below with it and leaves them red for a reason none of them names --
    // which is how this suite spent ten weeks proving nothing (T-483).
    expect(CANONICAL_CLIENT_ADMIN_EMAILS).toContain(FALLBACK_ADMIN.email);
  });

  it("streams DOCX for a same-client admin fallback when the active-client cookie is missing", async () => {
    const res = await GET(
      req(`?format=docx&client=${FALLBACK_OWN_CLIENT.key}`) as never,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("content-disposition")).toMatch(
      new RegExp(
        `attachment; filename="tower-outcome-report__${FALLBACK_OWN_CLIENT.key}__\\d{4}-\\d{2}-\\d{2}\\.docx"`,
      ),
    );
    expect(res.headers.get("x-tower-report-format")).toBe("docx");
    expect(res.headers.get("x-tower-report-tenant")).toBe(
      FALLBACK_OWN_CLIENT.key,
    );
    expect(
      Buffer.from(await res.arrayBuffer())
        .subarray(0, 2)
        .toString("latin1"),
    ).toBe("PK");
  });

  it("streams XLSX for a same-client admin fallback when the active-client cookie is missing", async () => {
    const res = await GET(
      req(`?format=xlsx&client=${FALLBACK_OWN_CLIENT.key}`) as never,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toMatch(
      new RegExp(
        `attachment; filename="tower-outcome-report__${FALLBACK_OWN_CLIENT.key}__\\d{4}-\\d{2}-\\d{2}\\.xlsx"`,
      ),
    );
    expect(res.headers.get("x-tower-report-format")).toBe("xlsx");
    expect(res.headers.get("x-tower-report-tenant")).toBe(
      FALLBACK_OWN_CLIENT.key,
    );
    expect(
      Buffer.from(await res.arrayBuffer())
        .subarray(0, 2)
        .toString("latin1"),
    ).toBe("PK");
  });

  it("does not let a same-client fallback widen into another requested client", async () => {
    // The 403 below only means something if this identity can reach the
    // fallback at all, and that truth has to come from somewhere other than
    // the assertion it is supporting. Mutation M3 -- dropping the same-client
    // condition from isSameClientAdminFallback -- survived this case for ten
    // weeks precisely because the fixture could never be admin-like, so the
    // 403 was arriving for a reason the case does not test (T-483).
    const ownTenant = await GET(
      req(`?format=docx&client=${FALLBACK_OWN_CLIENT.key}`) as never,
    );
    expect(ownTenant.status).toBe(200);

    // Counts rather than never-called, because the control above legitimately
    // reads and renders. The property is that the widened request adds none.
    const substrateReads = listInitiativesForClientMock.mock.calls.length;
    const renders = packerToBufferMock.mock.calls.length;

    const res = await GET(
      req(`?format=docx&client=${FALLBACK_OTHER_CLIENT.key}`) as never,
    );

    expect(res.status).toBe(403);
    expect(listInitiativesForClientMock.mock.calls.length).toBe(substrateReads);
    expect(packerToBufferMock.mock.calls.length).toBe(renders);
  });

  it("reaches the fallback for a tenant the admin's metadata scopes them to, not only the one their address infers", async () => {
    // isSameClient is an OR of two halves and each needs its own case:
    // removing the metadata half left all six other cases green, because the
    // fixture above is same-client by address inference alone. Here the
    // address infers a different tenant and the metadata carries the match.
    getCurrentUserMock.mockResolvedValue({
      ...FALLBACK_ADMIN,
      metadataClientKey: FALLBACK_OTHER_CLIENT.key,
    });

    const res = await GET(
      req(`?format=docx&client=${FALLBACK_OTHER_CLIENT.key}`) as never,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-tower-report-tenant")).toBe(
      FALLBACK_OTHER_CLIENT.key,
    );
  });

  it("does not let a same-client non-admin skip the program-access policy", async () => {
    // The fallback is "same client AND admin-like". Nothing asserted the
    // second half: dropping it from isSameClientAdminFallback left all five
    // cases green, because the only fixture reaching the fallback was already
    // admin-like. This identity is same-client by metadata and admin-like by
    // nothing.
    getCurrentUserMock.mockResolvedValue({
      ...FALLBACK_ADMIN,
      clerkUserId: "user_same_client_viewer",
      metadataClientKey: FALLBACK_OWN_CLIENT.key,
      email: "analyst@meridian-health.example.com",
    });

    const res = await GET(
      req(`?format=docx&client=${FALLBACK_OWN_CLIENT.key}`) as never,
    );

    expect(res.status).toBe(403);
    expect(listInitiativesForClientMock).not.toHaveBeenCalled();
    expect(packerToBufferMock).not.toHaveBeenCalled();
  });

  it("still honors a normal tenancy policy when tenancy matches the active client", async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: "client_meridian",
      clientKey: "meridian",
      userId: "person_meridian",
      email: "cdio@meridian-health.example.com",
    });
    getCurrentUserMock.mockResolvedValue({
      ...FALLBACK_ADMIN,
      metadataClientKey: "meridian",
      email: "cdio@meridian-health.example.com",
    });

    const res = await GET(req("?format=xlsx&client=meridian") as never);

    expect(res.status).toBe(200);
    expect(loadUserProgramAccessPolicyMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client_meridian" }),
    );
    expect(res.headers.get("x-tower-report-tenant")).toBe("meridian");
  });
});
