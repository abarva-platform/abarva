import { composeOriginateFirstMessage } from "@/components/strategic-moves/composeOriginateFirstMessage";
import type { TenancyCtx } from "@/lib/programs/types.db";

// Isolate the composer from the persistence layer (intelligence path never reads it).
jest.mock("@/lib/programs/origination-drafts", () => ({
  getOpenDraft: jest.fn(async () => null),
}));

const ctx = {} as TenancyCtx;

describe("composeOriginateFirstMessage — grounding guard", () => {
  it("cites a treasury pattern when the inbound id is in-namespace", async () => {
    const msg = await composeOriginateFirstMessage(ctx, null, {
      patternId: "LSH-TMS-002",
      patternName: "Bank connectivity matrix clears before rollout",
      useCaseName: "Kyriba global treasury rollout",
    });
    expect(msg.text).toContain("LSH-TMS-002");
    expect(msg.text).toContain("Binding pattern:");
  });

  it("drops an off-namespace corpus id and NEVER echoes it into the Move", async () => {
    const msg = await composeOriginateFirstMessage(ctx, null, {
      patternId: "PAT-LSH-D18-00479",
      patternName:
        "Prioritize City and State Procurement Calendars For Timing Local Bids",
      useCaseName: "Kyriba global treasury rollout",
    });
    // Acceptance: the off-namespace id must never appear in the Move text.
    expect(msg.text).not.toContain("PAT-LSH-D18-00479");
    expect(msg.text).not.toContain("Procurement Calendars");
    expect(msg.text.toLowerCase()).toContain("off-namespace");
    expect(msg.id).not.toContain("pat-lsh-d18-00479");
  });
});
