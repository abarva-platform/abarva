import {
  MODULE_V6_ANSWER_CONTRACT_VERSION,
  buildModuleV6PacketContract,
  buildModuleV6VisibleOutputAudit,
  moduleV6PacketPromptBlock,
  validateModuleV6VisibleSections,
} from "../module-v6-answer-contract";

// Item T-744. Only the four boundaries that would otherwise leave the process
// are replaced: the active-client lookup, the audited AI egress preflight, the
// Clerk-backed user-context block and the feature-flag read. Everything the
// cases below assert on -- the header spread, the packet contract and the
// prompt block -- is the routes' own code, running.
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: jest.fn() }));
jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: jest.fn(),
}));
jest.mock("@/lib/agent/userContext", () => ({
  getUserContextPromptBlock: jest.fn(),
}));
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(),
}));

const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
  getActiveClientRow: jest.Mock;
};
const { preflightAnthropicDirectClient } = jest.requireMock(
  "@/lib/integrations/ai-egress",
) as { preflightAnthropicDirectClient: jest.Mock };
const { getUserContextPromptBlock } = jest.requireMock(
  "@/lib/agent/userContext",
) as { getUserContextPromptBlock: jest.Mock };
const { isFeatureEnabled } = jest.requireMock(
  "@/lib/features/is-feature-enabled",
) as { isFeatureEnabled: jest.Mock };

// Imported statically, below the mocks: `jest.mock` is hoisted above every
// import in the file, so these two route modules resolve the four boundaries
// above to the same spies these handles point at.
import { POST as postSourceSynthesis } from "@/app/api/source/synthesis/route";
import { POST as postMovesSynthesis } from "@/app/api/programs/synthesis/route";

describe("module V6 answer contract", () => {
  it("builds an explicit packet and visible-output prompt block", () => {
    const contract = buildModuleV6PacketContract({
      surface: "source",
      packetType: "vendor-commercial-packet",
      tenantKey: "skyharbor-air",
      tenantName: "Airline Demo",
      question: "Which vendor renewals are exposed?",
      packetSummary: "Three vendor renewals and one missing pricing file.",
      requiredEvidenceFamilies: ["vendor contracts"],
      availableEvidenceFamilies: ["renewal dates"],
      missingEvidence: ["Current BAFO pricing"],
    });

    expect(contract).toMatchObject({
      surface: "source",
      packetType: "vendor-commercial-packet",
      claudeOwnsVisibleOutput: true,
      rendererRole: "placement_only",
    });
    expect(moduleV6PacketPromptBlock(contract)).toContain(
      "Claude must produce every user-visible answer word",
    );
  });

  it("computes visible section parity byte-for-byte except whitespace", () => {
    const audit = buildModuleV6VisibleOutputAudit({
      surface: "tower",
      packetType: "metric-read-model",
      answerSource: "claude_text",
      claudeInvoked: true,
      claudeSelected: true,
      fallbackUsed: false,
      rawClaudePreserved: true,
      sections: [
        {
          id: "answer",
          label: "Answer",
          modelText: "Airline Demo has $248.0M in initiative budget.",
          renderedText: "Airline Demo has\n$248.0M in initiative budget.",
        },
      ],
    });

    expect(audit.validationErrors).toEqual([]);
    expect(audit.visibleSectionParity[0]?.byteEqualExceptWhitespace).toBe(true);
  });

  it("flags renderer-visible mutation and internal answer language", () => {
    const audit = buildModuleV6VisibleOutputAudit({
      surface: "intelligence",
      packetType: "advisory-packet",
      answerSource: "claude_text",
      claudeInvoked: true,
      claudeSelected: true,
      fallbackUsed: false,
      rawClaudePreserved: false,
      sections: [
        {
          id: "decision",
          label: "Decision",
          modelText: "Scale the governed option.",
          renderedText: "Scale the governed option after adding a caveat.",
        },
      ],
    });

    expect(audit.validationErrors).toContain(
      "visible_section_mutated:decision",
    );
    expect(
      validateModuleV6VisibleSections([
        {
          id: "answer",
          label: "Answer",
          modelText: "The semantic packet has 12 rows.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "answer:implementation_semantic_packet",
        "answer:implementation_rows",
      ]),
    );
  });

  // Item T-744. This case used to `readFileSync` both synthesis routes and
  // assert five string tokens appeared in them. Its SUBJECT was route
  // behaviour -- the headers a response carries and the prompt block the route
  // sends -- and that subject is executable, so byte-matching was a proxy for
  // it rather than the thing itself: a rename or a refactor that kept the
  // strings and dropped the behaviour passed. Both routes are invoked here and
  // read off the Response and off the egress call.
  describe("Source and Moves synthesis routes carry the V6 contract on the wire", () => {
    const SURFACES = [
      {
        surface: "source",
        post: postSourceSynthesis,
        url: "http://localhost/api/source/synthesis",
        body: { instanceId: "apex-retail-ams-outsourcing-2026" },
      },
      {
        surface: "moves",
        post: postMovesSynthesis,
        url: "http://localhost/api/programs/synthesis",
        body: {},
      },
    ] as const;

    const request = (url: string, body: unknown) =>
      new Request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    // Deliberately NOT `jest.resetModules()`. Resetting the registry re-runs
    // the `jest.mock` factories, so the routes would then import a DIFFERENT
    // `jest.fn()` from the one these handles point at -- the egress spy reads
    // zero calls while the route is calling its own copy, which looks exactly
    // like a route that stopped sending the prompt. Neither route caches
    // anything on the paths these cases take, so there is nothing to reset.
    beforeEach(() => {
      getActiveClientRow.mockReset();
      preflightAnthropicDirectClient.mockReset();
      getUserContextPromptBlock.mockReset();
      getUserContextPromptBlock.mockResolvedValue("");
      isFeatureEnabled.mockReset();
      isFeatureEnabled.mockResolvedValue(false);
    });

    // The V6 contract headers are read OFF THE RESPONSE. The no-active-client
    // branch is used because it is the cheapest response either route can
    // produce, and it goes through the same header spread as the streaming
    // 200: a route that stopped attaching them would fail here too.
    it.each(SURFACES)(
      "$surface answers with the contract version and the placement-only renderer policy",
      async ({ post, url, body }) => {
        getActiveClientRow.mockResolvedValue(null);

        const response = await post(request(url, body));

        expect(response.headers.get("X-AbarVa-V6-Contract")).toBe(
          MODULE_V6_ANSWER_CONTRACT_VERSION,
        );
        expect(response.headers.get("X-AbarVa-Renderer-Policy")).toBe(
          "placement-only",
        );
      },
    );

    // The prompt block is read off WHAT THE ROUTE SENDS. `preflight` is the
    // single audited egress boundary both routes pass every prompt through,
    // so capturing its argument is capturing the real payload; it is refused
    // so nothing reaches Anthropic.
    it.each(SURFACES)(
      "$surface sends the V6 packet prompt block to the audited egress boundary",
      async ({ post, url, body }) => {
        getActiveClientRow.mockResolvedValue({
          id: "tenant-apex-retail",
          key: "apex-retail",
          name: "Apex Retail",
        });
        preflightAnthropicDirectClient.mockResolvedValue({
          ok: false,
          reason: "refused by test boundary",
        });

        const response = await post(request(url, body));

        expect(response.status).toBe(403);
        expect(preflightAnthropicDirectClient).toHaveBeenCalledTimes(1);

        const sent = preflightAnthropicDirectClient.mock.calls[0][0].prompt as string;
        // Not a substring of the route file: the exact text this module
        // generates for the contract the route built.
        expect(sent).toContain(
          "Claude must produce every user-visible answer word",
        );
        expect(sent).toContain("placement_only");
      },
    );
  });
});
