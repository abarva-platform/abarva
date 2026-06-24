import { getAuditedAnthropicClient } from "@/lib/agent/stream";

import { synthesizeHomeKnowProse } from "../home-know-synthesis";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

function mockClaudeText(text: string) {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text }],
        }),
      },
    },
  } as never);
}

describe("synthesizeHomeKnowProse", () => {
  beforeEach(() => {
    mockGetAuditedAnthropicClient.mockReset();
  });

  it("returns concise executive prose when Claude stays inside the contract", async () => {
    mockClaudeText(
      "SkyHarbor's data estate is strong enough to describe ownership and platform direction, but real-time operating readiness is still uneven. The most important implication is that agentic IROPS should be staged behind certified operational data products and freshness controls. The missing evidence is certified feed freshness by domain.",
    );

    await expect(
      synthesizeHomeKnowProse({
        tenantKey: "skyharbor",
        question: "Why is IROPS not ready to scale?",
        intent: "lookup",
        facts: [
          {
            id: "fact-1",
            dimensionId: "data_analytics_estate",
            label: "Data estate",
            value: "Large EDW and integration footprint",
            citationIds: [],
          },
        ],
        gaps: [
          {
            id: "gap-1",
            dimensionId: "data_analytics_estate",
            objectType: "data_product",
            displayLabel: "Feed freshness",
            message: "Certified feed freshness by domain is missing.",
            severity: "medium",
            expectedField: "certified_freshness_sla",
            citationIds: [],
          },
        ],
      }),
    ).resolves.toContain("agentic IROPS should be staged");
  });

  it("falls back to the deterministic template when the model leads with row counts", async () => {
    mockClaudeText("Home found 38 IT org rows and 500 application rows.");

    await expect(
      synthesizeHomeKnowProse({
        tenantKey: "skyharbor",
        question: "How is IT structured?",
        intent: "lookup",
        facts: [
          {
            id: "fact-1",
            dimensionId: "it_org_ownership",
            label: "IT org",
            value: "38 teams loaded",
            citationIds: [],
          },
        ],
        gaps: [],
      }),
    ).resolves.toBeNull();
  });
});
