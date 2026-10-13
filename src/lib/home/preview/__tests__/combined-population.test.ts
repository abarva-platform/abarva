import { hasUnsupportedMaOnlyRevenueConcentration } from "../combined-population";

const COMBINED_SOURCE =
  "Revenue is split 60% provider delivery / 40% health plan, with the health plan itself 70% Medicare Advantage and Medicare FFS versus 30% commercial and Medicaid managed care.";
const COMPOSITION_SOURCE =
  "Medicare Advantage and Medicare FFS together account for 70% of health plan revenue.";

describe("hasUnsupportedMaOnlyRevenueConcentration", () => {
  it("rejects the nonnumeric headline phrase revenue concentrated in Medicare Advantage", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        [
          "A two-sided provider/health-plan model with revenue concentrated in Medicare Advantage.",
        ],
        [COMBINED_SOURCE],
      ),
    ).toBe(true);
  });

  it.each([
    "Revenue is concentrated in Medicare Advantage.",
    "Enterprise revenue is concentrated in Medicare Advantage.",
    "Health plan revenue is heavily concentrated in Medicare Advantage.",
    "The revenue mix is dominated by Medicare Advantage.",
    "Medicare Advantage dominates plan revenue.",
    "Medicare Advantage is the dominant source of enterprise revenue.",
    "MA is the primary plan revenue source.",
    "**Business:** Revenue remains largely concentrated in Medicare Advantage.",
    "Revenue is not only concentrated in Medicare Advantage.",
  ])("rejects a recognized MA-only financial assertion: %s", (passage) => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration([passage], [COMPOSITION_SOURCE]),
    ).toBe(true);
  });

  it.each([
    COMPOSITION_SOURCE,
    "Health plan revenue is 70% Medicare Advantage + Medicare FFS.",
    "Plan revenue splits 70% Medicare Advantage and Medicare fee-for-service.",
    "Medicare FFS and Medicare Advantage jointly represent 70% of plan revenue.",
    "MA / Medicare FFS together account for 70 percent of plan revenue.",
  ])("requires a recognized combined financial source: %s", (source) => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Revenue is concentrated in Medicare Advantage."],
        [source],
      ),
    ).toBe(true);
  });

  it.each([
    "Revenue is concentrated in Medicare Advantage and Medicare FFS.",
    "Plan revenue is dominated by Medicare FFS and Medicare Advantage.",
    "Medicare Advantage and Medicare FFS dominate plan revenue.",
    "Medicare FFS and Medicare Advantage dominate plan revenue.",
    "Medicare Advantage + Medicare FFS is the primary plan revenue source.",
    "Medicare Advantage is a strategic priority.",
    "Medicare Advantage is the primary revenue growth priority.",
    "Medicare Advantage is the main enterprise revenue growth goal.",
    "Improving the Medicare Advantage Star Rating is a declared strategic goal.",
    "Medicare Advantage dominates the strategic priorities, not revenue.",
    "The plan intends to improve its MA Star Rating from 3.5 to 4.5+.",
    "MA performance could have revenue implications alongside its quality goals.",
    "Revenue could be concentrated in Medicare Advantage.",
    "Revenue may be concentrated in Medicare Advantage.",
    "Medicare Advantage might dominate plan revenue.",
    "Revenue is not concentrated in Medicare Advantage.",
    "Medicare Advantage does not dominate plan revenue.",
    "The record does not establish that revenue is concentrated in Medicare Advantage.",
    "No evidence proves Medicare Advantage dominates enterprise revenue.",
    "Revenue concentrated in Medicare Advantage is not established.",
    "Medicare Advantage accounts for 70% of plan revenue.",
  ])(
    "preserves combined, strategic, conditional or out-of-scope wording: %s",
    (passage) => {
      expect(
        hasUnsupportedMaOnlyRevenueConcentration([passage], [COMBINED_SOURCE]),
      ).toBe(false);
    },
  );

  it.each(
    [
      [],
      [
        "Provider delivery is 60% and health plan operations are 40% of revenue.",
      ],
      ["Medicare Advantage and Medicare FFS are declared member populations."],
      ["Medicare Advantage and Medicare FFS account for 70% of members."],
      [
        "Medicare Advantage is a Star Rating priority with a 70% completion goal.",
      ],
      [
        "Medicare Advantage and Medicare FFS could account for 70% of plan revenue.",
      ],
      [
        "Medicare Advantage and Medicare FFS do not account for 70% of plan revenue.",
      ],
      ["Plan revenue is not 70% Medicare Advantage and Medicare FFS."],
      [`The record does not establish that ${COMBINED_SOURCE}`],
    ].map((sources) => ({ sources })),
  )(
    "does not activate without explicit combined revenue composition: $sources",
    ({ sources }) => {
      expect(
        hasUnsupportedMaOnlyRevenueConcentration(
          ["Revenue is concentrated in Medicare Advantage."],
          sources,
        ),
      ).toBe(false);
    },
  );

  it.each([
    "Medicare Advantage alone accounts for 60% of plan revenue.",
    "Plan revenue is 60% Medicare Advantage.",
    "MA generates 60 percent of health plan revenue.",
    "Plan revenue is concentrated in Medicare Advantage.",
  ])(
    "admits independent MA-only composition on its own basis: %s",
    (source) => {
      const sources = [COMBINED_SOURCE, source];
      expect(
        hasUnsupportedMaOnlyRevenueConcentration(
          ["Plan revenue is concentrated in Medicare Advantage."],
          sources,
        ),
      ).toBe(false);
      expect(
        hasUnsupportedMaOnlyRevenueConcentration(
          ["Enterprise revenue is concentrated in Medicare Advantage."],
          sources,
        ),
      ).toBe(true);
      expect(
        hasUnsupportedMaOnlyRevenueConcentration(
          ["Revenue is concentrated in Medicare Advantage."],
          sources,
        ),
      ).toBe(true);
    },
  );

  it("admits independent enterprise composition without deriving it from plan shares", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Medicare Advantage dominates enterprise revenue."],
        [
          COMBINED_SOURCE,
          "Medicare Advantage accounts for 65% of enterprise revenue.",
        ],
      ),
    ).toBe(false);
  });

  it("requires independent unqualified support for an unqualified assertion", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Revenue is concentrated in Medicare Advantage."],
        [COMBINED_SOURCE, "Medicare Advantage accounts for 65% of revenue."],
      ),
    ).toBe(false);
  });

  it.each([
    "Medicare Advantage accounts for 35% of plan revenue.",
    "Medicare Advantage accounts for 50% of plan revenue.",
    "Medicare Advantage accounts for 150% of plan revenue.",
    "Medicare Advantage could account for 65% of plan revenue.",
    "Medicare Advantage does not account for 65% of plan revenue.",
    "Medicare Advantage may dominate plan revenue.",
    "Plan revenue is not concentrated in Medicare Advantage.",
    "Medicare FFS and Medicare Advantage represent 70% of plan revenue.",
    "Improving the Medicare Advantage Star Rating is a priority; the plan revenue goal is 65% growth.",
    "Medicare Advantage accounts for 65% of plan revenue growth.",
    "Medicare Advantage is the primary plan revenue source.",
    "Plan revenue is concentrated in Medicare Advantage.",
  ])(
    "does not license categorical dominance from weaker or unrelated support: %s",
    (source) => {
      expect(
        hasUnsupportedMaOnlyRevenueConcentration(
          ["Medicare Advantage dominates plan revenue."],
          [COMBINED_SOURCE, source],
        ),
      ).toBe(true);
    },
  );

  it("does not borrow a combined label or a qualifier from another field", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        [
          "Revenue is concentrated in Medicare Advantage.",
          "**Composition:** Medicare Advantage and Medicare FFS together account for 70% of plan revenue.",
          "**Interpretation:** Revenue could be concentrated in Medicare Advantage.",
        ],
        [COMBINED_SOURCE],
      ),
    ).toBe(true);
  });

  it.each([
    "Revenue could be concentrated in Medicare Advantage; Medicare Advantage dominates plan revenue.",
    "Revenue is not concentrated in Medicare Advantage, but Medicare Advantage dominates plan revenue.",
    "Medicare Advantage and Medicare FFS dominate plan revenue; enterprise revenue is concentrated in Medicare Advantage.",
    "The record does not establish that revenue is concentrated in Medicare Advantage, while Medicare Advantage dominates plan revenue.",
  ])("checks mixed local assertions independently: %s", (passage) => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration([passage], [COMBINED_SOURCE]),
    ).toBe(true);
  });

  it("does not infer arbitrary aliases, subgroup shares or external source coverage", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["The Advantage product dominates revenue."],
        [COMBINED_SOURCE],
      ),
    ).toBe(false);
    expect(
      hasUnsupportedMaOnlyRevenueConcentration([], [COMBINED_SOURCE]),
    ).toBe(false);
  });

  it("does not activate from a combined share of revenue growth", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Plan revenue is concentrated in Medicare Advantage."],
        [
          "Medicare Advantage and Medicare FFS account for 70% of plan revenue growth.",
        ],
      ),
    ).toBe(false);
  });

  it("keeps unrecognized revenue modifiers outside coverage without licensing a broader basis", () => {
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Regional revenue is concentrated in Medicare Advantage."],
        [COMBINED_SOURCE],
      ),
    ).toBe(false);
    expect(
      hasUnsupportedMaOnlyRevenueConcentration(
        ["Plan revenue is concentrated in Medicare Advantage."],
        [COMBINED_SOURCE, "Regional plan revenue is 80% Medicare Advantage."],
      ),
    ).toBe(true);
  });
});
