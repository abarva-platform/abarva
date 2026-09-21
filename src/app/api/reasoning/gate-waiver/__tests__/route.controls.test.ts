const mockRequireReasoningTenancy = jest.fn();
const mockRequireGateApprovalRole = jest.fn();
const mockAssertInstanceInTenant = jest.fn();
const mockRecordWaiver = jest.fn();

jest.mock("@/app/api/reasoning/_auth", () => ({
  requireReasoningTenancy: () => mockRequireReasoningTenancy(),
  tenancyErrorResponse: (error: unknown) => {
    throw error;
  },
  assertInstanceInTenant: (...args: unknown[]) =>
    mockAssertInstanceInTenant(...args),
  requireGateApprovalRole: (...args: unknown[]) =>
    mockRequireGateApprovalRole(...args),
  reasoningTenantId: () => "example-tenant",
}));

jest.mock("@/app/api/reasoning/audit/route", () => ({
  recordWaiver: (...args: unknown[]) => mockRecordWaiver(...args),
}));

function request(reason: string): Request {
  return new Request("http://test/api/reasoning/gate-waiver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "gate_waiver",
      criterionId: "criterion-1",
      instanceId: "instance-1",
      reason,
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireReasoningTenancy.mockResolvedValue({
    userId: "user-1",
    email: "reviewer@example.invalid",
    role: "approver",
  });
  mockRequireGateApprovalRole.mockReturnValue(null);
  mockAssertInstanceInTenant.mockReturnValue(null);
});

describe("POST /api/reasoning/gate-waiver decision controls", () => {
  it("refuses a reason too short to explain a consequential waiver", async () => {
    const { POST } = await import("../route");
    const response = await POST(request("ok"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "human_rationale_required" }),
    );
    expect(mockRecordWaiver).not.toHaveBeenCalled();
  });

  it("records an auditable evidence packet for an accepted waiver", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      request("Proceed temporarily while the independent review is completed."),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      evidencePacket?: {
        recordsHumanDecision?: boolean;
        humanRationale?: string;
        decisionOwner?: { userId?: string };
      };
    };
    expect(body.evidencePacket).toEqual(
      expect.objectContaining({
        recordsHumanDecision: true,
        humanRationale:
          "Proceed temporarily while the independent review is completed.",
        decisionOwner: expect.objectContaining({ userId: "user-1" }),
      }),
    );
    expect(mockRecordWaiver).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        aiDecisionEvidencePacket: expect.objectContaining({
          recordsHumanDecision: true,
        }),
      }),
    );
  });
});
