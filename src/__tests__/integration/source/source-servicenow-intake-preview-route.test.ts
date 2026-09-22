import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { POST } from "@/app/api/source/intake/servicenow/preview/route";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  TenancyError: class TenancyError extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

const row = {
  sys_id: "abc123",
  number: "SRC0010042",
  opened_at: "2026-09-22T10:00:00Z",
  updated_at: "2026-09-22T11:00:00Z",
  state: "New",
  requested_by_user_id: "user-1",
  requested_by_display_name: "Requestor",
  requested_for_org: "Health Plan",
  business_domain: "plan",
  business_function: "Member Services",
  cost_center: "CC-100",
  assignment_group: "Strategic Sourcing",
  short_description: "Replace member contact center platform",
  description: "Source a contact center platform and operations partner.",
  business_justification: "Improve member service and control operating cost.",
  sourcing_trigger: "Current contract expires next year.",
  requested_outcome: "Select a governed partner.",
  needed_by: "2027-03-01",
  target_decision_date: "2026-12-01",
  contract_end_date: "2027-06-30",
  estimated_annual_value: "12500000",
  currency: "USD",
  value_confidence: "requester estimate",
  incumbent_supplier_name: "Incumbent supplier",
  existing_contract_reference: "CTR-001",
  scope_in: "Member calls, chat, quality, workforce management",
  scope_out: "Clinical advice",
  geography: "US",
  service_criticality: "high",
  regulated_data_flags: "PHI|PII",
  data_system_owner: "Member Services Technology",
  budget_status: "planning",
  decision_owner: "Member Services VP",
  baseline_owner: "Plan Finance",
  security_review_needed: "true",
  legal_review_needed: "true",
  attachment_references: "att-1|att-2",
  source_table: "sn_sourcing_request",
  extract_timestamp: "2026-09-22T12:00:00Z",
  extract_version: "v1",
};

describe("ServiceNow sourcing request preview route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requireTenancy).mockResolvedValue({
      clientKey: "tenant-a",
    } as never);
  });

  it("returns a proposal without persisting authority or creating an event", async () => {
    const response = await POST(
      new Request("http://localhost/api/source/intake/servicenow/preview", {
        method: "POST",
        body: JSON.stringify({ sourceRow: 2, row }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.request.mappingProposal.archetypeId).toBe("CONTACT_CENTER_CX");
    expect(body.request.rawSource).toBeUndefined();
    expect(body.authority).toEqual({
      persisted: false,
      mappingAccepted: false,
      eventCreated: false,
      supplierContactAuthorized: false,
    });
  });

  it("requires a signed-in tenant before classification", async () => {
    jest.mocked(requireTenancy).mockRejectedValue(
      new TenancyError("unauthenticated" as never),
    );
    const response = await POST(
      new Request("http://localhost/api/source/intake/servicenow/preview", {
        method: "POST",
        body: JSON.stringify({ sourceRow: 2, row }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("rejects malformed rows instead of inventing required request facts", async () => {
    const response = await POST(
      new Request("http://localhost/api/source/intake/servicenow/preview", {
        method: "POST",
        body: JSON.stringify({ sourceRow: 2, row: { ...row, sys_id: "" } }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "invalid_servicenow_request" }),
    );
  });
});
