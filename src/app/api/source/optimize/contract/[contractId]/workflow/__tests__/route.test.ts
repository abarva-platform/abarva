jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  TenancyError: class TenancyError extends Error {},
  tenancyErrorResponse: jest.fn(),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(),
}));

jest.mock(
  "@/lib/source/data-model/contract-optimization-workflow-actions",
  () => {
    class ContractOptimizationWorkflowActionError extends Error {
      constructor(
        public readonly code:
          | "missing_dataset"
          | "missing_baseline"
          | "baseline_conflict"
          | "missing_case"
          | "missing_opportunity"
          | "opportunity_not_ready"
          | "missing_pending_request"
          | "missing_approved_request"
          | "invalid_action",
        message: string,
      ) {
        super(message);
      }
    }

    return {
      ContractOptimizationWorkflowActionError,
      runContractOptimizationWorkflowAction: jest.fn(),
    };
  },
);

import { POST } from "../route";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  ContractOptimizationWorkflowActionError,
  runContractOptimizationWorkflowAction,
} from "@/lib/source/data-model/contract-optimization-workflow-actions";

const mockRequireTenancy = jest.mocked(requireTenancy);
const mockTenancyErrorResponse = jest.mocked(tenancyErrorResponse);
const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockLoadUserSourceAccessPolicy = jest.mocked(loadUserSourceAccessPolicy);
const mockRunContractOptimizationWorkflowAction = jest.mocked(
  runContractOptimizationWorkflowAction,
);

describe("POST Source Optimize workflow action", () => {
  beforeEach(() => {
    mockRequireTenancy.mockResolvedValue({
      userId: "user-1",
      clientId: "client-skyharbor",
      role: "client_admin",
    });
    mockTenancyErrorResponse.mockImplementation(() =>
      Response.json({ ok: false, error: "tenancy" }, { status: 401 }),
    );
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor_global",
      name: "SkyHarbor Global",
      industry_code: "AIRLINE",
    });
    mockLoadUserSourceAccessPolicy.mockResolvedValue({
      userId: "user-1",
      clientId: "client-skyharbor",
      activeClientKey: "skyharbor_global",
      accessLevel: "admin",
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
    } as never);
    mockRunContractOptimizationWorkflowAction.mockResolvedValue({
      ok: true,
      action: "create_approval_request",
      tenantKey: "skyharbor_global",
      contractId: "CTR-090",
      datasetVersion: "v4",
      optimizationCaseId: "CASE-CTR-090",
      opportunityId: "OPP-CTR-090-RATE",
      approvalRequestId: "APR-CASE-CTR-090-OPP-CTR-090-RATE-STRATEGY",
      negotiatedOutcomeId: null,
      caseState: "outreach_approval",
      message: "Strategy approval request is ready for review.",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a governed approval request for the active client and contract", async () => {
    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/source/optimize/contract/CTR-090/workflow",
        {
          method: "POST",
          body: JSON.stringify({
            action: "create_approval_request",
            opportunityId: "OPP-CTR-090-RATE",
            rationale: "Ready for outreach approval.",
          }),
        },
      ),
      { params: Promise.resolve({ contractId: "CTR-090" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mockRunContractOptimizationWorkflowAction).toHaveBeenCalledWith({
      tenantKey: "skyharbor_global",
      contractId: "CTR-090",
      opportunityId: "OPP-CTR-090-RATE",
      action: "create_approval_request",
      rationale: "Ready for outreach approval.",
      actorRole: "client_admin",
      actorUserId: "user-1",
    });
  });

  it("requires Source approval permission before recording an approval decision", async () => {
    mockLoadUserSourceAccessPolicy.mockResolvedValueOnce({
      userId: "user-1",
      clientId: "client-skyharbor",
      activeClientKey: "skyharbor_global",
      accessLevel: "viewer",
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
    } as never);

    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/source/optimize/contract/CTR-090/workflow",
        {
          method: "POST",
          body: JSON.stringify({ action: "approve_request" }),
        },
      ),
      { params: Promise.resolve({ contractId: "CTR-090" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("forbidden_source_approval_required");
    expect(mockRunContractOptimizationWorkflowAction).not.toHaveBeenCalled();
  });

  it("returns a conflict response for baseline/action-state blockers", async () => {
    mockRunContractOptimizationWorkflowAction.mockRejectedValueOnce(
      new ContractOptimizationWorkflowActionError(
        "baseline_conflict",
        "Baseline inputs conflict; resolve the commercial baseline before approval.",
      ),
    );

    const response = await POST(
      new Request(
        "https://app.abarva.ai/api/source/optimize/contract/CTR-061/workflow",
        {
          method: "POST",
          body: JSON.stringify({ action: "create_approval_request" }),
        },
      ),
      { params: Promise.resolve({ contractId: "CTR-061" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("baseline_conflict");
    expect(payload.detail).toContain("Baseline inputs conflict");
  });
});
