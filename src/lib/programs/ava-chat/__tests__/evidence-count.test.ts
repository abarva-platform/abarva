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

  it("normalizes absent or invalid counts to zero", () => {
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: null,
        pageEvidenceCount: undefined,
      }),
    ).toBe(0);
    expect(
      resolveMovesAvaVisibleEvidenceCount({
        liveLinkedEvidenceCount: Number.NaN,
        pageEvidenceCount: -1,
      }),
    ).toBe(0);
  });
});
