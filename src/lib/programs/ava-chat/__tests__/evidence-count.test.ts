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

  it("uses the surface context count when the visible File Cabinet context extract is richer", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: 0,
        pageEvidenceCount: 0,
        surfaceContextEvidenceCount: 8,
      }),
    ).toBe(8);
  });

  it("normalizes absent or invalid counts to zero", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: null,
        pageEvidenceCount: undefined,
        surfaceContextEvidenceCount: undefined,
      }),
    ).toBe(0);
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: Number.NaN,
        pageEvidenceCount: -1,
        surfaceContextEvidenceCount: Number.POSITIVE_INFINITY,
      }),
    ).toBe(0);
  });
});
