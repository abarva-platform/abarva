import { resolveMovesAvaVisibleEvidenceCount } from "../evidence-count";

describe("resolveMovesAvaVisibleEvidenceCount", () => {
  it("does not let an empty live linked-evidence relation hide page-loaded evidence", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: 0,
        pageEvidenceCount: 8,
      }),
    ).toBe(8);
  });

  it("keeps the live linked-evidence count when it is the richer signal", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: 12,
        pageEvidenceCount: 8,
      }),
    ).toBe(12);
  });

  it("uses a server-verified fresh context extract when it is the richer signal", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: 0,
        pageEvidenceCount: 0,
        contextExtractFreshness: {
          freshnessStatus: "fresh",
          attachedEvidenceCount: 8,
        },
      }),
    ).toBe(8);
  });

  it("ignores a stale context-extract count after its evidence review changes", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: 0,
        pageEvidenceCount: 0,
        contextExtractFreshness: {
          freshnessStatus: "stale",
          attachedEvidenceCount: 8,
        },
      }),
    ).toBe(0);
  });

  it("normalizes absent or invalid counts to zero", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: null,
        pageEvidenceCount: undefined,
        contextExtractFreshness: null,
      }),
    ).toBe(0);
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: Number.NaN,
        pageEvidenceCount: -1,
        contextExtractFreshness: {
          freshnessStatus: "fresh",
          attachedEvidenceCount: Number.POSITIVE_INFINITY,
        },
      }),
    ).toBe(0);
  });
});
