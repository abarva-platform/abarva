import React from "react";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("not-found");
  }),
  redirect: jest.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  }),
}));

jest.mock("@/components/source/SourceOptimizeContractPage", () => ({
  SourceOptimizeContractPage: jest.fn(
    (props: Record<string, unknown>) =>
      React.createElement("div", {
        "data-testid": "source-optimize-contract-page",
        "data-props": JSON.stringify(props),
      }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(),
}));

jest.mock("@/lib/auth/tenancy", () => {
  class TenancyError extends Error {
    constructor(
      public readonly code: string,
      message = code,
    ) {
      super(message);
    }
  }
  return {
    requireTenancy: jest.fn(),
    TenancyError,
  };
});

jest.mock("@/lib/client-config", () => ({
  canonicalClientDisplayName: jest.fn(() => "SkyHarbor Global"),
}));

jest.mock("@/lib/source/data-model/contract-optimization-client-payload", () => ({
  trimContractOptimizationOpportunitySetForClient: jest.fn((value) => value),
}));

jest.mock("@/lib/source/data-model/contract-optimization-ledger", () => ({
  buildContractOptimizationLedger: jest.fn(() => null),
}));

jest.mock("@/lib/source/data-model/contract-optimization-spine", () => ({
  buildContractOptimizationSpine: jest.fn(() => ({
    selected: null,
    candidates: [],
    topCandidates: [],
    sourceConnections: [],
    missingEvidenceSources: [],
    contractStory: [],
    missingEvidenceStory: [],
  })),
}));

jest.mock("@/lib/source/data-model/read-adapter", () => ({
  getContract360: jest.fn(),
  getContractOptimizationEvidencePack: jest.fn(),
  getContractOptimizationOpportunitySet: jest.fn(),
  listContract360: jest.fn(),
}));

jest.mock("@/lib/source/data-model/source-v4-cube-ui-catalog", () => ({
  SOURCE_V4_CUBE_AS_OF_DATE: "2027-06-30",
}));

jest.mock("@/lib/source/data-model/vendor-contract-portfolio", () => ({
  computeContractLeverageSignals: jest.fn(() => []),
}));

import SourceOptimizeContractRoute from "../page";
import { SourceOptimizeContractPage } from "@/components/source/SourceOptimizeContractPage";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  getContract360,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
  listContract360,
} from "@/lib/source/data-model/read-adapter";
import { buildContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";

const mockRequireTenancy = jest.mocked(requireTenancy);
const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockLoadUserSourceAccessPolicy = jest.mocked(loadUserSourceAccessPolicy);
const mockSourceOptimizeContractPage = jest.mocked(SourceOptimizeContractPage);
const mockListContract360 = jest.mocked(listContract360);
const mockGetContract360 = jest.mocked(getContract360);
const mockGetOpportunitySet = jest.mocked(getContractOptimizationOpportunitySet);
const mockGetEvidencePack = jest.mocked(getContractOptimizationEvidencePack);
const mockBuildSpine = jest.mocked(buildContractOptimizationSpine);

describe("Source Optimize Contract route financial access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      userId: "user-1",
      clientId: "client-skyharbor",
      clientKey: "skyharbor_global",
      role: "client_admin",
    } as never);
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor_global",
      name: "SkyHarbor Global",
      industry_code: "AIRLINE",
    } as never);
  });

  it("does not load or serialize optimization financial data without financial visibility", async () => {
    mockLoadUserSourceAccessPolicy.mockResolvedValue({
      canViewFinancialData: false,
    } as never);

    const element = await SourceOptimizeContractRoute({
      searchParams: Promise.resolve({ contractId: "CTR-090" }),
    });

    expect(mockLoadUserSourceAccessPolicy).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "skyharbor_global" }),
      { activeClientKey: "skyharbor_global" },
    );
    expect(mockListContract360).not.toHaveBeenCalled();
    expect(mockGetContract360).not.toHaveBeenCalled();
    expect(mockGetOpportunitySet).not.toHaveBeenCalled();
    expect(mockGetEvidencePack).not.toHaveBeenCalled();
    expect(mockSourceOptimizeContractPage).not.toHaveBeenCalled();
    expect(element.type).toBe(SourceOptimizeContractPage);
    expect(element.props).toEqual(
      expect.objectContaining({
        canViewFinancialValues: false,
        opportunitySet: null,
        evidencePack: null,
      }),
    );
  });
});


/**
 * C-610. The Contract 360 `Open Optimize` affordance now hands a contract id to
 * this route in a query parameter, so the route is where the handoff's tenant
 * scoping has to hold. A parameter arrives from a URL and is therefore an
 * attacker-controlled string, not a fact: these cases assert the id is
 * re-resolved against the signed-in tenant's own register on every request, and
 * that an id the tenant does not hold yields no contract and no downstream
 * optimization read rather than a contract belonging to someone else.
 *
 * They live in this file rather than a new one because this suite already
 * carries the route's mock harness and is already named by exact path in
 * `.github/workflows/unit-suites.yml`. A new file would have needed its runner
 * established first, and an unrun guard is the shape this backlog exists about.
 */
describe("Source Optimize Contract route contract-id scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      userId: "user-1",
      clientId: "client-skyharbor",
      clientKey: "skyharbor_global",
      role: "client_admin",
    } as never);
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor_global",
      name: "SkyHarbor Global",
      industry_code: "AIRLINE",
    } as never);
    mockLoadUserSourceAccessPolicy.mockResolvedValue({
      canViewFinancialData: true,
    } as never);
    mockBuildSpine.mockReturnValue({
      selected: null,
      candidates: [],
      topCandidates: [],
      sourceConnections: [],
      missingEvidenceSources: [],
      contractStory: [],
      missingEvidenceStory: [],
    } as never);
  });

  it("opens the journey on a contract the signed-in tenant's own register holds", async () => {
    mockListContract360.mockResolvedValue([
      { contract_id: "CTR-OWNED", contract_name: "Owned agreement" },
    ] as never);
    mockGetOpportunitySet.mockResolvedValue(null as never);
    mockGetEvidencePack.mockResolvedValue(null as never);

    await SourceOptimizeContractRoute({
      searchParams: Promise.resolve({ contractId: "CTR-OWNED" }),
    });

    expect(mockListContract360).toHaveBeenCalledWith("skyharbor_global");
    // Resolved from the tenant's own list, so no second read is needed.
    expect(mockGetContract360).not.toHaveBeenCalled();
    // Every downstream read is tenant-scoped, with the id from the query.
    expect(mockGetOpportunitySet).toHaveBeenCalledWith(
      "skyharbor_global",
      "CTR-OWNED",
      expect.objectContaining({ contract_id: "CTR-OWNED" }),
    );
    expect(mockGetEvidencePack).toHaveBeenCalledWith(
      "skyharbor_global",
      "CTR-OWNED",
    );
    expect(mockBuildSpine).toHaveBeenCalledWith(
      expect.objectContaining({
        contract: expect.objectContaining({ contract_id: "CTR-OWNED" }),
      }),
    );
  });

  it("resolves a contract id the tenant does not hold to nothing, and reads no optimization data for it", async () => {
    // The tenant's register holds one contract, and it is not the one asked for.
    mockListContract360.mockResolvedValue([
      { contract_id: "CTR-OWNED", contract_name: "Owned agreement" },
    ] as never);
    // A tenant-scoped point read of another tenant's contract finds nothing.
    mockGetContract360.mockResolvedValue(null as never);

    await SourceOptimizeContractRoute({
      searchParams: Promise.resolve({ contractId: "CTR-OTHER-TENANT" }),
    });

    // The id is re-resolved against this tenant, never trusted as given.
    expect(mockGetContract360).toHaveBeenCalledWith(
      "skyharbor_global",
      "CTR-OTHER-TENANT",
    );
    expect(mockGetOpportunitySet).not.toHaveBeenCalled();
    expect(mockGetEvidencePack).not.toHaveBeenCalled();
    expect(mockBuildSpine).toHaveBeenCalledWith(
      expect.objectContaining({ contract: null }),
    );
  });

  it("opens the journey with no contract when the handoff carries no id", async () => {
    mockListContract360.mockResolvedValue([] as never);

    await SourceOptimizeContractRoute({
      searchParams: Promise.resolve({}),
    });

    expect(mockGetContract360).not.toHaveBeenCalled();
    expect(mockGetOpportunitySet).not.toHaveBeenCalled();
    expect(mockGetEvidencePack).not.toHaveBeenCalled();
    expect(mockBuildSpine).toHaveBeenCalledWith(
      expect.objectContaining({ contract: null }),
    );
  });
});
