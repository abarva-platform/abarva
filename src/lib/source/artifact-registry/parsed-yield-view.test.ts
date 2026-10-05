import {
  describeParsedYield,
  parsedYieldLabel,
  PARSED_YIELD_FAMILIES,
} from "./parsed-yield-view";

describe("describeParsedYield", () => {
  // The distinction the projection exists for.
  it("reports an unreadable store as unread, never as nothing extracted", () => {
    expect(describeParsedYield({ registryAvailable: false, counts: {} })).toEqual({
      kind: "unread",
    });
    expect(
      describeParsedYield({ registryAvailable: false, counts: { requirements: 9 } }),
    ).toEqual({ kind: "unread" });
  });

  it("reports a readable store that yielded nothing as none", () => {
    expect(describeParsedYield({ registryAvailable: true, counts: {} }).kind).toBe("none");
    expect(
      describeParsedYield({
        registryAvailable: true,
        counts: { requirements: 0, pricingComponents: 0 },
      }).kind,
    ).toBe("none");
  });

  it("counts every family the parser writes", () => {
    const view = describeParsedYield({
      registryAvailable: true,
      counts: {
        requirements: 14,
        pricingComponents: 6,
        vendorCommitments: 3,
        meetingOutcomes: 2,
      },
    });
    expect(view).toEqual({
      kind: "extracted",
      counts: {
        requirements: 14,
        pricingComponents: 6,
        vendorCommitments: 3,
        meetingOutcomes: 2,
      },
      total: 25,
    });
  });

  // A negative or non-finite count is a broken read. Carrying it through would
  // let a bad row subtract from the total and hide real extraction.
  it("treats a negative or non-finite count as zero rather than carrying it", () => {
    const view = describeParsedYield({
      registryAvailable: true,
      counts: {
        requirements: -5,
        pricingComponents: Number.NaN,
        vendorCommitments: 4,
      },
    });
    expect(view.kind === "extracted" && view.total).toBe(4);
    expect(view.kind === "extracted" && view.counts.requirements).toBe(0);
  });

  it("names every family it knows, so a new one cannot be silently dropped", () => {
    expect([...PARSED_YIELD_FAMILIES].sort()).toEqual([
      "meetingOutcomes",
      "pricingComponents",
      "requirements",
      "vendorCommitments",
    ]);
  });
});

describe("parsedYieldLabel", () => {
  it("distinguishes unread from nothing extracted", () => {
    expect(parsedYieldLabel({ kind: "unread" })).toBe("Not recorded");
    expect(parsedYieldLabel({ kind: "none" })).toBe("Nothing extracted yet");
  });

  it("names only the families that found something", () => {
    expect(
      parsedYieldLabel({
        kind: "extracted",
        counts: {
          requirements: 14,
          pricingComponents: 0,
          vendorCommitments: 0,
          meetingOutcomes: 2,
        },
        total: 16,
      }),
    ).toBe("14 requirements · 2 meeting outcomes");
  });

  it("singularises a count of one", () => {
    expect(
      parsedYieldLabel({
        kind: "extracted",
        counts: {
          requirements: 1,
          pricingComponents: 1,
          vendorCommitments: 0,
          meetingOutcomes: 0,
        },
        total: 2,
      }),
    ).toBe("1 requirement · 1 pricing component");
  });
});
