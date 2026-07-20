// Binds the approval_page workshop template to the REAL tracked per-role
// approval data (deliverable-role-approvals.ts, PR #5102) instead of always
// rendering a blank fill-in-the-blank row — additive: every other template
// kind, and approval_page itself when there's no real data yet, is unchanged.

const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

import {
  fetchApprovalPageData,
  renderDesignSessionPackHtml,
} from "../design-session-pack";
import type { MovePhasePlaybook, MovePhaseSession } from "../move-phase-playbook";

const CTX = { clientId: "client-1", userId: "person-1" };

function session(overrides: Partial<MovePhaseSession> = {}): MovePhaseSession {
  return {
    id: "s1",
    label: "Test session",
    objective: "Decide something.",
    participants: ["Sponsor"],
    discussionGuide: ["Discuss."],
    frameworks: [],
    captureTemplate: ["Decision"],
    homework: ["Read the brief."],
    gate: { criterion: "Aligned.", alignedBy: "Sponsor", severity: "hard" },
    feedsDeliverables: ["business_case"],
    workshopTemplates: ["approval_page"],
    ...overrides,
  };
}

function playbook(sessions: MovePhaseSession[]): MovePhasePlaybook {
  return { phase: 4, label: "P4 Test", intent: "Test intent.", sessions };
}

describe("renderDesignSessionPackHtml — approval_page real-data binding", () => {
  it("renders the original blank row when no real approval data is passed (default, unaffected behavior)", () => {
    const html = renderDesignSessionPackHtml(playbook([session()]), "Test Move");
    expect(html).toMatch(/Approval Page/);
    expect(html).toMatch(/<td>&nbsp;<\/td>/);
  });

  it("renders real approver name, status, and decided date when approval data is supplied, with no blank cells for that section", () => {
    const html = renderDesignSessionPackHtml(playbook([session()]), "Test Move", {
      business_case: {
        deliverableId: "d-1",
        requiredRoles: ["business", "finance"],
        records: [
          {
            role: "business",
            status: "approved",
            approverUserId: "p-1",
            approverName: "Jane Doe, CEO",
            outstandingConditions: null,
            decidedAt: "2026-07-20T00:00:00.000Z",
          },
          {
            role: "finance",
            status: "reviewed",
            approverUserId: "p-2",
            approverName: null,
            outstandingConditions: "Awaiting FY26 budget confirmation",
            decidedAt: null,
          },
        ],
        allRequiredApproved: false,
        anyRejected: false,
      },
    });
    expect(html).toMatch(/Business approver/);
    expect(html).toMatch(/Jane Doe, CEO/);
    expect(html).toMatch(/Approved/);
    expect(html).toMatch(/2026-07-20/);
    expect(html).toMatch(/Finance approver/);
    expect(html).toMatch(/Reviewed/);
    // The approval_page table itself has real rows, not the blank template row.
    const approvalSection = html.slice(html.indexOf("Approval Page"));
    const nextSection = approvalSection.indexOf("<div class=\"wt\">", 10);
    const approvalTable = nextSection === -1 ? approvalSection : approvalSection.slice(0, nextSection);
    expect(approvalTable).not.toMatch(/<td>&nbsp;<\/td>/);
  });

  it("leaves an unrelated template kind (e.g. decision_log) blank even when approval data is supplied for approval_page", () => {
    const html = renderDesignSessionPackHtml(
      playbook([session({ workshopTemplates: ["approval_page", "decision_log"] })]),
      "Test Move",
      {
        business_case: {
          deliverableId: "d-1",
          requiredRoles: ["business"],
          records: [
            {
              role: "business",
              status: "approved",
              approverUserId: "p-1",
              approverName: "Jane Doe",
              outstandingConditions: null,
              decidedAt: "2026-07-20T00:00:00.000Z",
            },
          ],
          allRequiredApproved: true,
          anyRejected: false,
        },
      },
    );
    const decisionLogSection = html.slice(html.indexOf("Decision Log"));
    expect(decisionLogSection).toMatch(/<td>&nbsp;<\/td>/);
  });
});

describe("fetchApprovalPageData", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: "move-1" });
  });

  it("returns {} without any query when no fed deliverable type requires role approval", async () => {
    const result = await fetchApprovalPageData(CTX, "move-1", ["charter", "discovery_report"]);
    expect(result).toEqual({});
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("resolves real deliverable rows and returns their role-approval summary, keyed by type", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: [{ id: "biz-case-1", deliverable_type_key: "business_case" }],
            error: null,
          }),
        };
      }
      if (table === "deliverable_role_approvals") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                role: "business",
                status: "approved",
                approver_user_id: "p-1",
                approver_name: "Jane Doe",
                outstanding_conditions: null,
                decided_at: "2026-07-20T00:00:00Z",
              },
            ],
            error: null,
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await fetchApprovalPageData(CTX, "move-1", ["business_case", "charter"]);
    expect(Object.keys(result)).toEqual(["business_case"]);
    expect(result.business_case.requiredRoles).toEqual(["business", "finance"]);
    expect(result.business_case.records.find((r) => r.role === "business")?.approverName).toBe(
      "Jane Doe",
    );
  });

  it("omits a covered type from the result when no deliverable row exists for it yet", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await fetchApprovalPageData(CTX, "move-1", ["business_case"]);
    expect(result).toEqual({});
  });
});
