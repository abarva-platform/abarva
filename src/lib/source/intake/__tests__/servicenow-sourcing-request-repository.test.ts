import { azureRead } from "@/lib/data-plane/azureRead";
import { readSourceIntakeRequestQueue } from "../servicenow-sourcing-request-repository";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: jest.fn() },
}));

const withSession = azureRead.withSession as jest.Mock;

describe("readSourceIntakeRequestQueue", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the latest imported version with proposal, human decision, and event link kept distinct", async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          request_id: "servicenow:sn_sourcing_request:abc",
          source_request_number: "SRC0010042",
          source_status: "New",
          source_version: "2026-09-22T12:00:00Z",
          extracted_at: "2026-09-22T12:05:00Z",
          updated_at: "2026-09-22T11:55:00Z",
          normalized_request: {
            title: "Replace member contact center platform",
            description:
              "Plan member services needs a new platform and operations partner.",
            trigger: "Current platform contract expires in nine months.",
            requestedOutcome:
              "Select a platform and managed operations partner.",
            organization: {
              requestedFor: "Health Plan",
              businessDomain: "plan",
              businessFunction: "Member Services",
            },
            value: { amount: 12500000, currency: "USD", validated: false },
            scope: {
              included:
                "Member calls, chat, quality monitoring, and workforce management.",
              excluded: "Clinical triage.",
            },
            governance: {
              decisionOwner: "VP Member Services",
              baselineOwner: "Contact center operations",
              securityReviewNeeded: true,
              legalReviewNeeded: true,
            },
          },
          mapping_proposal: {
            categoryId: "contact_center_cx",
            archetypeId: "CONTACT_CENTER_CX",
            confidence: "medium",
            reasons: ["Matched contact-center scope"],
          },
          required_fact_gaps: ["baseline_owner"],
          decision_id: "mapping-1",
          decision_state: "accepted",
          decision_source_version: "2026-09-22T12:00:00Z",
          decision_category_id: "contact_center_cx",
          decision_archetype_id: "CONTACT_CENTER_CX",
          decided_by_user_id: "person-1",
          decided_by_name: "Procurement lead",
          decided_at: "2026-09-22T12:10:00Z",
          decision_rationale: "Scope and buying motion confirmed.",
          source_event_id: "11111111-1111-4111-8111-111111111111",
          event_source_version: "2026-09-22T12:00:00Z",
          linked_at: "2026-09-22T12:20:00Z",
        },
      ]);
    withSession.mockImplementation(async (callback) => callback(run));

    const result = await readSourceIntakeRequestQueue("tenant-a");

    expect(result.registryAvailable).toBe(true);
    expect(result.requests).toEqual([
      expect.objectContaining({
        requestId: "servicenow:sn_sourcing_request:abc",
        requestNumber: "SRC0010042",
        title: "Replace member contact center platform",
        trigger: "Current platform contract expires in nine months.",
        requestedOutcome: "Select a platform and managed operations partner.",
        decisionOwner: "VP Member Services",
        baselineOwner: "Contact center operations",
        scopeIncluded:
          "Member calls, chat, quality monitoring, and workforce management.",
        scopeExcluded: "Clinical triage.",
        securityReviewNeeded: true,
        legalReviewNeeded: true,
        sourceSystem: "ServiceNow",
        requiredFactGaps: ["baseline_owner"],
        mappingProposal: expect.objectContaining({
          categoryId: "contact_center_cx",
          archetypeId: "CONTACT_CENTER_CX",
        }),
        mappingDecision: expect.objectContaining({
          decisionId: "mapping-1",
          state: "accepted",
          decidedByUserId: "person-1",
          decidedByName: "Procurement lead",
          sourceVersion: "2026-09-22T12:00:00Z",
        }),
        eventLink: expect.objectContaining({
          eventId: "11111111-1111-4111-8111-111111111111",
          sourceVersion: "2026-09-22T12:00:00Z",
        }),
      }),
    ]);
    expect(run).toHaveBeenNthCalledWith(
      1,
      "SELECT set_config('app.tenant_key', $1, false)",
      ["tenant-a"],
    );
    expect(run.mock.calls[1][1]).toEqual(["tenant-a"]);
  });

  it("fails closed when the authority table is unavailable", async () => {
    withSession.mockRejectedValue(
      Object.assign(new Error("missing"), { code: "42P01" }),
    );

    await expect(readSourceIntakeRequestQueue("tenant-a")).resolves.toEqual({
      registryAvailable: false,
      requests: [],
    });
  });

  it("does not query without a tenant identity", async () => {
    await expect(readSourceIntakeRequestQueue(" ")).resolves.toEqual({
      registryAvailable: false,
      requests: [],
    });
    expect(withSession).not.toHaveBeenCalled();
  });

  it("does not promote a proposal into a human mapping decision", async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          request_id: "servicenow:sn_sourcing_request:def",
          source_request_number: "SRC0010043",
          source_status: "New",
          source_version: "v1",
          extracted_at: "2026-09-22T12:05:00Z",
          updated_at: null,
          normalized_request: {
            title: "Cloud commitment review",
            description: "Review cloud commitments.",
            organization: { businessDomain: "it" },
          },
          mapping_proposal: {
            categoryId: "cloud_consumption",
            archetypeId: "CLOUD_CONSUMPTION",
            confidence: "high",
            reasons: ["Matched cloud consumption"],
          },
          required_fact_gaps: [],
          decision_state: null,
          source_event_id: null,
        },
      ]);
    withSession.mockImplementation(async (callback) => callback(run));

    const result = await readSourceIntakeRequestQueue("tenant-a");

    expect(result.requests[0].mappingProposal.archetypeId).toBe(
      "CLOUD_CONSUMPTION",
    );
    expect(result.requests[0].mappingDecision).toBeNull();
    expect(result.requests[0].eventLink).toBeNull();
  });
});
