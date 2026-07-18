// Proves the core mechanism behind MOVES-DELIVERABLE-4's approval-lineage
// fix: regenerating a deliverable must never be able to clobber
// signed_off_version, because signOffDeliverable is the ONLY place that sets
// it. This test asserts persistVersion's regeneration UPDATE payload never
// includes that column — Postgres partial UPDATEs only touch listed columns,
// so omitting it here is what guarantees a prior approval survives any number
// of later regenerations (see moves-generate-deps.ts /
// deliverable-content-signals.ts, which then prefer signed_off_version when
// selecting content for the next phase).

let updatePayload: Record<string, unknown> | null = null;

const mockClient = {
  from: jest.fn((table: string) => {
    if (table === "deliverables_v2") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: { id: "deliv-1", current_version: 3 },
                error: null,
              })),
            })),
          })),
        })),
        update: jest.fn((payload: Record<string, unknown>) => {
          updatePayload = payload;
          return { eq: jest.fn(() => Promise.resolve({ error: null })) };
        }),
      };
    }
    if (table === "deliverable_versions") {
      return {
        insert: jest.fn(async () => ({ error: null })),
      };
    }
    throw new Error(`unexpected table ${table}`);
  }),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => mockClient,
}));

import { persistVersion } from "../v2-generator";

describe("persistVersion regeneration", () => {
  beforeEach(() => {
    updatePayload = null;
    mockClient.from.mockClear();
  });

  it("bumps current_version and status without touching signed_off_version", async () => {
    const result = await persistVersion({
      engagementId: "eng-1",
      deliverableTypeKey: "discovery_report",
      content: "regenerated content",
      qualityReview: {
        scores: {},
        critical_issues: [],
        remaining_issues: [],
        total_score: 90,
      } as never,
    });

    expect(result).toEqual({ deliverable_id: "deliv-1", version: 4 });
    expect(updatePayload).toEqual({ current_version: 4, status: "draft" });
    // The whole point: signed_off_version is simply absent from this
    // payload, so a prior approval (set only by signOffDeliverable) is
    // structurally impossible to clobber via regeneration.
    expect(updatePayload).not.toHaveProperty("signed_off_version");
  });
});
