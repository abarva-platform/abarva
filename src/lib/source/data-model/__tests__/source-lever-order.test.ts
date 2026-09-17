import {
  displaySourceLeverTiming,
  displaySourceLeverTitle,
  leverPriorityRank,
  leverSequenceRank,
} from "../source-lever-order";

describe("Source lever display and order", () => {
  it("puts a recorded P0 commitment ahead of a P2 marketplace signal", () => {
    expect(leverPriorityRank("P0")).toBeLessThan(leverPriorityRank("P2"));
    expect(leverSequenceRank("Re-time annual commitment")).toBeLessThan(
      leverSequenceRank("Route through Marketplace"),
    );
  });

  it("keeps the signal state separate from a readable label and date", () => {
    expect(displaySourceLeverTitle("Signal-stage discount band review"))
      .toBe("Discount band review");
    expect(displaySourceLeverTiming("Complete before 2026-10-14 lock-in."))
      .toBe("Complete before Oct 14, 2026 lock-in.");
  });
});
