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

const APEX_ADMIN = {
  personId: null,
  clerkUserId: "user_apex_cio",
  metadataClientKey: "apexretail",
  name: "Carlos Rivera",
  email: "cio@apex-retail.example.com",
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
    getCurrentUserMock.mockResolvedValue(APEX_ADMIN);
    getActiveClientRowMock.mockImplementation((requestedClientKey?: string) => {
      if (requestedClientKey === "meridian")
        return Promise.resolve(MERIDIAN_CLIENT);
      return Promise.resolve(APEX_CLIENT);
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

  it("streams DOCX for a same-client admin fallback when the active-client cookie is missing", async () => {
    const res = await GET(req("?format=docx&client=apexretail") as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("content-disposition")).toMatch(
      /attachment; filename="tower-outcome-report__apexretail__\d{4}-\d{2}-\d{2}\.docx"/,
    );
    expect(res.headers.get("x-tower-report-format")).toBe("docx");
    expect(res.headers.get("x-tower-report-tenant")).toBe("apexretail");
    expect(
      Buffer.from(await res.arrayBuffer())
        .subarray(0, 2)
        .toString("latin1"),
    ).toBe("PK");
  });

  it("streams XLSX for a same-client admin fallback when the active-client cookie is missing", async () => {
    const res = await GET(req("?format=xlsx&client=apexretail") as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toMatch(
      /attachment; filename="tower-outcome-report__apexretail__\d{4}-\d{2}-\d{2}\.xlsx"/,
    );
    expect(res.headers.get("x-tower-report-format")).toBe("xlsx");
    expect(res.headers.get("x-tower-report-tenant")).toBe("apexretail");
    expect(
      Buffer.from(await res.arrayBuffer())
        .subarray(0, 2)
        .toString("latin1"),
    ).toBe("PK");
  });

  it("does not let a same-client fallback widen into another requested client", async () => {
    const res = await GET(req("?format=docx&client=meridian") as never);

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
      ...APEX_ADMIN,
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
