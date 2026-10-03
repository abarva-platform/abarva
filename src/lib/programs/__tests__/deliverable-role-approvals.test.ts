const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureReadFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

import {
  getRoleApprovalSummary,
  requiredApprovalRolesFor,
  REQUIRED_APPROVAL_ROLES,
} from "../deliverable-role-approvals";

const CTX = {
  clientId: "client-1",
  userId: "person-1",
};

function selectRows(rows: unknown[]) {
  const result = Promise.resolve({ data: rows, error: null });
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: {
        id: "deliverable-1",
        deliverable_type_key: "business_case",
        current_version: 3,
        signed_off_version: 2,
      },
      error: null,
    }),
    then: result.then.bind(result),
  };
}

describe("Moves deliverable approval authority", () => {
  it("does not require business, finance, technology, or risk role approvals", () => {
    expect(REQUIRED_APPROVAL_ROLES).toEqual({});
    for (const key of [
      "business_case",
      "target_state_architecture",
      "operating_model_design",
      "charter",
    ]) {
      expect(requiredApprovalRolesFor(key)).toEqual([]);
    }
  });

  describe("historical role approval readback", () => {
    beforeEach(() => {
      fromMock.mockReset();
      getProgramByIdMock.mockReset();
      getProgramByIdMock.mockResolvedValue({ id: "move-1" });
    });

    it("does not synthesize pending role approvals for the authorized-user sign-off", async () => {
      fromMock.mockImplementation((table: string) => {
        if (table === "deliverables_v2") return selectRows([]);
        if (table === "deliverable_role_approvals") return selectRows([]);
        throw new Error(`Unexpected table ${table}`);
      });

      const summary = await getRoleApprovalSummary(
        CTX,
        "move-1",
        "deliverable-1",
        "business_case",
      );

      expect(summary).toMatchObject({
        requiredRoles: [],
        records: [],
        allRequiredApproved: false,
        anyRejected: false,
      });
    });

    it("retains old role rows as read-only history without making them gate conditions", async () => {
      fromMock.mockImplementation((table: string) => {
        if (table === "deliverables_v2") return selectRows([]);
        if (table === "deliverable_role_approvals")
          return selectRows([
            {
              role: "finance",
              status: "rejected",
              version: 2,
              approver_user_id: "person-2",
              approver_name: "Finance reviewer",
              outstanding_conditions: "Historical note",
              decided_at: "2026-07-20T00:10:00Z",
            },
          ]);
        throw new Error(`Unexpected table ${table}`);
      });

      const summary = await getRoleApprovalSummary(
        CTX,
        "move-1",
        "deliverable-1",
        "business_case",
      );

      expect(summary.requiredRoles).toEqual([]);
      expect(summary.records).toEqual([
        expect.objectContaining({ role: "finance", status: "rejected" }),
      ]);
      expect(summary.allRequiredApproved).toBe(false);
      expect(summary.anyRejected).toBe(false);
    });

    it("fails closed when the deliverable does not belong to the program", async () => {
      getProgramByIdMock.mockResolvedValue(null);

      await expect(
        getRoleApprovalSummary(CTX, "move-1", "missing", "business_case"),
      ).rejects.toThrow(/not accessible/i);
      expect(fromMock).not.toHaveBeenCalled();
    });
  });
});
