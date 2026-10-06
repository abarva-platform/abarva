jest.mock("server-only", () => ({}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  TenancyError: class TenancyError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: jest.fn(),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock(
  "@/app/(maestro)/source/preview/workspace/live/portfolioAdapter",
  () => ({
    loadSourceWorkspaceImpactPayload: jest.fn(),
    loadSourceWorkspacePortfolio: jest.fn(),
  }),
);

import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  loadSourceWorkspaceImpactPayload,
  loadSourceWorkspacePortfolio,
} from "@/app/(maestro)/source/preview/workspace/live/portfolioAdapter";
import { GET } from "../route";

const mockRequireTenancy = requireTenancy as jest.Mock;
const mockCheckTenantAccessByKey = checkTenantAccessByKey as jest.Mock;
const mockGetActiveClientRow = getActiveClientRow as jest.Mock;
const mockLoadSourceWorkspacePortfolio =
  loadSourceWorkspacePortfolio as jest.Mock;
const mockLoadSourceWorkspaceImpactPayload =
  loadSourceWorkspaceImpactPayload as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-meridian",
    clientKey: "meridian",
    userId: "user-1",
  });
  mockCheckTenantAccessByKey.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
  });
  mockGetActiveClientRow.mockResolvedValue(null);
  mockLoadSourceWorkspacePortfolio.mockResolvedValue({
    contracts: [],
    vendors: [],
    impact: null,
    workspaceDiagnostics: {
      exploreProvider: "EclProjectionDbProvider",
    },
  });
  mockLoadSourceWorkspaceImpactPayload.mockResolvedValue({
    impact: null,
    projectionSource: "ecl_projection_db",
    timings: [],
  });
});

describe("GET /api/source/workspace/portfolio", () => {
  it("authorizes an explicit client without depending on active tenancy lookup", async () => {
    const response = await GET(
      new Request(
        "https://app.test/api/source/workspace/portfolio?client=meridian&sourceProvider=ecl_projection_db&impact=deferred",
      ),
    );

    expect(response.status).toBe(200);
    expect(checkTenantAccessByKey).toHaveBeenCalledWith("meridian");
    expect(requireTenancy).not.toHaveBeenCalled();
    expect(getActiveClientRow).not.toHaveBeenCalled();
    expect(loadSourceWorkspacePortfolio).toHaveBeenCalledWith(
      "meridian",
      expect.any(String),
      "ecl_projection_db",
      { impactMode: "deferred" },
    );
  });

  it("blocks an unauthorized explicit client before any portfolio read", async () => {
    mockCheckTenantAccessByKey.mockResolvedValueOnce({
      ok: false,
      reason: "forbidden",
    });

    const response = await GET(
      new Request(
        "https://app.test/api/source/workspace/portfolio?client=skyharbor",
      ),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    expect(requireTenancy).not.toHaveBeenCalled();
    expect(loadSourceWorkspacePortfolio).not.toHaveBeenCalled();
    expect(loadSourceWorkspaceImpactPayload).not.toHaveBeenCalled();
  });

  it("uses session tenancy when no explicit client is supplied", async () => {
    const response = await GET(
      new Request(
        "https://app.test/api/source/workspace/portfolio?impact=deferred",
      ),
    );

    expect(response.status).toBe(200);
    expect(requireTenancy).toHaveBeenCalledTimes(1);
    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(loadSourceWorkspacePortfolio).toHaveBeenCalledWith(
      "meridian",
      expect.any(String),
      null,
      { impactMode: "deferred" },
    );
  });
});
