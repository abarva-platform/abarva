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

const mockRequireTenancy = jest.mocked(requireTenancy);
const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockLoadUserSourceAccessPolicy = jest.mocked(loadUserSourceAccessPolicy);
const mockSourceOptimizeContractPage = jest.mocked(SourceOptimizeContractPage);
const mockListContract360 = jest.mocked(listContract360);
const mockGetContract360 = jest.mocked(getContract360);
const mockGetOpportunitySet = jest.mocked(getContractOptimizationOpportunitySet);
const mockGetEvidencePack = jest.mocked(getContractOptimizationEvidencePack);

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
