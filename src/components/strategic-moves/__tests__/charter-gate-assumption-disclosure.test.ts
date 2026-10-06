import {
  charterGateAssumptionDisclosure,
  type CharterGateBasisCounts,
} from "@/lib/programs/charter-gate-assumption-disclosure";

function counts(
  overrides: Partial<CharterGateBasisCounts> = {},
): CharterGateBasisCounts {
  return {
    total: 6,
    answered: 6,
    evidence: 6,
    asserted: 0,
    assumptions: 0,
    unrecorded: 0,
    openAssumptions: [],
    ...overrides,
  };
}

const assumption = (sectionKey: string, label: string) => ({
  sectionKey,
  label,
  owner: "Workspace owner",
  p2ValidationPlan: "Discover interviews the two named process owners.",
});

describe("charterGateAssumptionDisclosure", () => {
  it("says nothing while the basis surface is inactive", () => {
    // The whole slice is behind `moves_charter_basis_v1`; with it off the gate
    // dialog has to be byte-for-byte what it is today, even on a charter that
    // happens to carry assumptions in its persisted state.
    expect(
      charterGateAssumptionDisclosure({
        active: false,
        counts: counts({
          assumptions: 2,
          evidence: 4,
          openAssumptions: [assumption("a", "A"), assumption("b", "B")],
        }),
      }),
    ).toBeNull();
  });

  it("says nothing when the charter has no basis-eligible questions", () => {
    expect(
      charterGateAssumptionDisclosure({
        active: true,
        counts: counts({ total: 0, answered: 0, evidence: 0 }),
      }),
    ).toBeNull();
  });

  it("says nothing when no question is answered yet", () => {
    // An unanswered charter is empty, not clean. Rendering the neutral
    // "none is an open assumption" line here would assert something the counts
    // do not support.
    expect(
      charterGateAssumptionDisclosure({
        active: true,
        counts: counts({ answered: 0, evidence: 0 }),
      }),
    ).toBeNull();
  });

  it("says nothing when the host passes no counts", () => {
    expect(
      charterGateAssumptionDisclosure({ active: true, counts: null }),
    ).toBeNull();
  });

  it("discloses the clean case rather than staying silent", () => {
    // Silence in a dialog is indistinguishable from a clean charter, so the
    // clean charter has to say so out loud.
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({ evidence: 4, asserted: 2 }),
    });
    expect(disclosure).not.toBeNull();
    expect(disclosure?.tone).toBe("neutral");
    expect(disclosure?.headline).toContain("All 6 answered questions");
    expect(disclosure?.headline).toContain("None is an open assumption");
    expect(disclosure?.openAssumptions).toEqual([]);
  });

  it("counts assumptions against ANSWERED, not against the section total", () => {
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({
        total: 9,
        answered: 4,
        evidence: 2,
        assumptions: 2,
        openAssumptions: [assumption("a", "Scope"), assumption("b", "Owner")],
      }),
    });
    expect(disclosure?.tone).toBe("amber");
    expect(disclosure?.headline).toContain("2 of 4 answered questions");
    expect(disclosure?.headline).not.toContain("of 9");
  });

  it("carries each open assumption's owner and validation plan through", () => {
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({
        answered: 3,
        evidence: 1,
        assumptions: 2,
        openAssumptions: [assumption("a", "Scope"), assumption("b", "Owner")],
      }),
    });
    expect(disclosure?.openAssumptions).toHaveLength(2);
    expect(disclosure?.openAssumptions[0]).toMatchObject({
      sectionKey: "a",
      label: "Scope",
      owner: "Workspace owner",
      p2ValidationPlan: "Discover interviews the two named process owners.",
    });
  });

  it("goes amber on an unrecorded basis even with zero assumptions", () => {
    // An answered question with no declared basis is not a backed one. The
    // neutral line must not be reachable while any answer is unaccounted for.
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({ answered: 5, evidence: 3, unrecorded: 2 }),
    });
    expect(disclosure?.tone).toBe("amber");
    expect(disclosure?.headline).toContain("2 carry no declared basis yet");
    expect(disclosure?.headline).not.toContain("None is an open assumption");
    expect(disclosure?.openAssumptions).toEqual([]);
  });

  it("reports both halves when a charter is part assumed and part unrecorded", () => {
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({
        answered: 6,
        evidence: 3,
        assumptions: 2,
        unrecorded: 1,
        openAssumptions: [assumption("a", "Scope"), assumption("b", "Owner")],
      }),
    });
    expect(disclosure?.headline).toContain("2 of 6 answered questions");
    expect(disclosure?.headline).toContain("are assumptions");
    expect(disclosure?.headline).toContain("1 carries no declared basis yet");
  });

  it("agrees in number with the singular case", () => {
    const disclosure = charterGateAssumptionDisclosure({
      active: true,
      counts: counts({
        total: 1,
        answered: 1,
        evidence: 0,
        assumptions: 1,
        openAssumptions: [assumption("a", "Scope")],
      }),
    });
    expect(disclosure?.headline).toContain("1 of 1 answered question is an assumption");
    expect(disclosure?.headline).not.toContain("questions");
    expect(disclosure?.headline).not.toContain("are assumptions");
  });
});
