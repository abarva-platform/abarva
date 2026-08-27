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

jest.mock("@/lib/source/data-model/contract-360-view", () => ({
  buildContract360View: jest.fn(),
  collectContractSubjectRefs: jest.fn(),
}));

jest.mock("@/lib/source/data-model/read-adapter", () => ({
  getContract360: jest.fn(),
  getContractEvidenceOverview: jest.fn(),
  getContractEvidencePerformanceSummary: jest.fn(),
  getContractOptimizationEvidencePack: jest.fn(),
  getContractOptimizationOpportunitySet: jest.fn(),
  listContractApplicationScope: jest.fn(),
  listContractEvidencePricing: jest.fn(),
  listContractEvidenceScope: jest.fn(),
  listContractFinancialExposure: jest.fn(),
  listContractInitiativeDependency: jest.fn(),
  listContractOperationalPerformance: jest.fn(),
  listDocExtractionsForSubject: jest.fn(),
  listLatestTowerObservationsForSubjects: jest.fn(),
  listTowerValueClaimsForSubjects: jest.fn(),
}));

import { GET } from "../route";
import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  buildContract360View,
  collectContractSubjectRefs,
} from "@/lib/source/data-model/contract-360-view";
import {
  getContract360,
  getContractEvidenceOverview,
  getContractEvidencePerformanceSummary,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
  listContractApplicationScope,
  listContractEvidencePricing,
  listContractEvidenceScope,
  listContractFinancialExposure,
  listContractInitiativeDependency,
  listContractOperationalPerformance,
  listDocExtractionsForSubject,
  listLatestTowerObservationsForSubjects,
  listTowerValueClaimsForSubjects,
} from "@/lib/source/data-model/read-adapter";

const mockRequireTenancy = requireTenancy as jest.Mock;
const mockGetActiveClientRow = getActiveClientRow as jest.Mock;
const mockCheckTenantAccessByKey = checkTenantAccessByKey as jest.Mock;
const mockBuildContract360View = buildContract360View as jest.Mock;
const mockCollectContractSubjectRefs = collectContractSubjectRefs as jest.Mock;
const mockGetContract360 = getContract360 as jest.Mock;
const mockListContractApplicationScope =
  listContractApplicationScope as jest.Mock;
const mockListContractFinancialExposure =
  listContractFinancialExposure as jest.Mock;
const mockListContractInitiativeDependency =
  listContractInitiativeDependency as jest.Mock;
const mockListContractOperationalPerformance =
  listContractOperationalPerformance as jest.Mock;
const mockGetContractEvidenceOverview =
  getContractEvidenceOverview as jest.Mock;
const mockGetContractEvidencePerformanceSummary =
  getContractEvidencePerformanceSummary as jest.Mock;
const mockGetContractOptimizationEvidencePack =
  getContractOptimizationEvidencePack as jest.Mock;
const mockGetContractOptimizationOpportunitySet =
  getContractOptimizationOpportunitySet as jest.Mock;
const mockListContractEvidencePricing =
  listContractEvidencePricing as jest.Mock;
const mockListContractEvidenceScope = listContractEvidenceScope as jest.Mock;
const mockListDocExtractionsForSubject =
  listDocExtractionsForSubject as jest.Mock;
const mockListLatestTowerObservationsForSubjects =
  listLatestTowerObservationsForSubjects as jest.Mock;
const mockListTowerValueClaimsForSubjects =
  listTowerValueClaimsForSubjects as jest.Mock;

const contract = {
  tenant_key: "meridian",
  contract_id: "CTR-0006",
  vendor_ref: "VEN-0006",
  vendor_name: "Northstar Software",
  scoped_application_count: null,
  critical_application_count: null,
  cloud_sev1_sev2_incidents: null,
  operational_evidence_gap: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-meridian",
    clientKey: "meridian",
    userId: "user-1",
  });
  mockGetActiveClientRow.mockResolvedValue({
    id: "client-fallback",
    key: "arcturus",
    name: "First Capital",
  });
  mockCheckTenantAccessByKey.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
  });
  mockGetContract360.mockResolvedValue(contract);
  mockListContractApplicationScope.mockResolvedValue([]);
  mockListContractFinancialExposure.mockResolvedValue([]);
  mockListContractOperationalPerformance.mockResolvedValue([]);
  mockListContractInitiativeDependency.mockResolvedValue([]);
  mockGetContractEvidenceOverview.mockResolvedValue(null);
  mockListContractEvidenceScope.mockResolvedValue([]);
  mockListContractEvidencePricing.mockResolvedValue([]);
  mockGetContractEvidencePerformanceSummary.mockResolvedValue(null);
  mockCollectContractSubjectRefs.mockReturnValue(["CTR-0006", "VEN-0006"]);
  mockListLatestTowerObservationsForSubjects.mockResolvedValue([]);
  mockListTowerValueClaimsForSubjects.mockResolvedValue([]);
  mockListDocExtractionsForSubject.mockResolvedValue([]);
  mockGetContractOptimizationEvidencePack.mockResolvedValue(null);
  mockGetContractOptimizationOpportunitySet.mockResolvedValue(null);
  mockBuildContract360View.mockReturnValue({
    contractId: "CTR-0006",
    evidence: [],
  });
});

function params(contractId = "CTR-0006") {
  return { params: Promise.resolve({ contractId }) };
}

describe("GET /api/source/workspace/contract/[contractId]", () => {
  it("uses a requested client that matches trusted tenancy without a secondary access lookup", async () => {
    const res = await GET(
      new Request(
        "https://app.test/api/source/workspace/contract/CTR-0006?client=meridian",
      ),
      params(),
    );

    expect(res.status).toBe(200);
    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(getActiveClientRow).not.toHaveBeenCalled();
    expect(getContract360).toHaveBeenCalledWith("meridian", "CTR-0006");
    expect(listContractApplicationScope).toHaveBeenCalledWith(
      "meridian",
      "CTR-0006",
    );
    expect(listContractFinancialExposure).toHaveBeenCalledWith("meridian");
  });

  it("authorizes a cross-session requested client before reading contract detail", async () => {
    mockRequireTenancy.mockResolvedValueOnce({
      clientId: "client-arcturus",
      clientKey: "arcturus",
      userId: "user-1",
    });

    const res = await GET(
      new Request(
        "https://app.test/api/source/workspace/contract/CTR-0006?client=meridian",
      ),
      params(),
    );

    expect(res.status).toBe(200);
    expect(checkTenantAccessByKey).toHaveBeenCalledWith("meridian");
    expect(getContract360).toHaveBeenCalledWith("meridian", "CTR-0006");
  });

  it("blocks unauthorized requested clients before reading contract detail", async () => {
    mockRequireTenancy.mockResolvedValueOnce({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: "user-1",
    });
    mockCheckTenantAccessByKey.mockResolvedValueOnce({
      ok: false,
      reason: "forbidden",
    });

    const res = await GET(
      new Request(
        "https://app.test/api/source/workspace/contract/CTR-0006?client=skyharbor",
      ),
      params(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "forbidden" });
    expect(getContract360).not.toHaveBeenCalled();
  });

  it("rejects unknown client aliases without falling back to another tenant", async () => {
    const res = await GET(
      new Request(
        "https://app.test/api/source/workspace/contract/CTR-0006?client=ghost-tenant",
      ),
      params(),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "unknown_client" });
    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(getContract360).not.toHaveBeenCalled();
  });

  it("falls back to active tenancy when no explicit workspace client is present", async () => {
    mockGetActiveClientRow.mockResolvedValueOnce(null);

    const res = await GET(
      new Request("https://app.test/api/source/workspace/contract/CTR-0006"),
      params(),
    );

    expect(res.status).toBe(200);
    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(getActiveClientRow).toHaveBeenCalledWith();
    expect(getContract360).toHaveBeenCalledWith("meridian", "CTR-0006");
  });

  it("keeps a resolved-tenant miss distinct from missing tenancy", async () => {
    mockGetContract360.mockResolvedValueOnce(null);

    const res = await GET(
      new Request(
        "https://app.test/api/source/workspace/contract/CTR-0006?client=meridian",
      ),
      params(),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
  });
});
