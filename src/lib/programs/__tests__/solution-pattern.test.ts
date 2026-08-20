import {
  applySolutionPatternIfEnabled,
  embedSolutionPatternInCharter,
  readSolutionPatternFromCharter,
  SOLUTION_PATTERN_OPTIONS,
} from "../solution-pattern";

const FIELDS = {
  pattern: "Build on the Platform" as const,
  rationale:
    "Clinical documentation and claims joined inside the tenant boundary — no data leaves.",
};

describe("solution-pattern", () => {
  it("defines exactly the 5 patterns from the source model", () => {
    expect(SOLUTION_PATTERN_OPTIONS.map((o) => o.value)).toEqual([
      "Build on the Platform",
      "Point Automation",
      "Embedded in a Licensed Product",
      "Native to the Core Clinical System",
      "New Third-Party Platform",
    ]);
  });

  it("embeds and reads the fields back exactly", () => {
    const charter = embedSolutionPatternInCharter(
      { existing: "value" },
      FIELDS,
    );
    expect(charter).toEqual({
      existing: "value",
      p3_solution_pattern_v1: FIELDS,
    });
    expect(readSolutionPatternFromCharter(charter)).toEqual(FIELDS);
  });

  it("does not disturb existing charter content when embedding", () => {
    const charter = { p2_risk_tier_inputs_v1: { some: "risk data" } };
    const next = embedSolutionPatternInCharter(charter, FIELDS);
    expect(next.p2_risk_tier_inputs_v1).toEqual({ some: "risk data" });
    expect(next.p3_solution_pattern_v1).toEqual(FIELDS);
  });

  it("returns null for a legacy/missing charter", () => {
    expect(readSolutionPatternFromCharter(null)).toBeNull();
    expect(readSolutionPatternFromCharter({})).toBeNull();
  });

  it("returns null for an unrecognized pattern value", () => {
    const charter = {
      p3_solution_pattern_v1: { pattern: "Something Else", rationale: "x" },
    };
    expect(readSolutionPatternFromCharter(charter)).toBeNull();
  });

  it("returns null when the rationale is missing or blank", () => {
    expect(
      readSolutionPatternFromCharter({
        p3_solution_pattern_v1: { pattern: "Point Automation", rationale: "" },
      }),
    ).toBeNull();
    expect(
      readSolutionPatternFromCharter({
        p3_solution_pattern_v1: { pattern: "Point Automation" },
      }),
    ).toBeNull();
  });

  describe("applySolutionPatternIfEnabled", () => {
    it("is byte-identical (same reference) when the flag is off", () => {
      const charter = { existing: "value" };
      expect(applySolutionPatternIfEnabled(charter, FIELDS, false)).toBe(
        charter,
      );
    });

    it("is byte-identical (same reference) when fields is null, regardless of the flag", () => {
      const charter = { existing: "value" };
      expect(applySolutionPatternIfEnabled(charter, null, true)).toBe(charter);
    });

    it("embeds only when the flag is on AND fields are present", () => {
      const charter = { existing: "value" };
      const next = applySolutionPatternIfEnabled(charter, FIELDS, true);
      expect(next).toEqual({
        existing: "value",
        p3_solution_pattern_v1: FIELDS,
      });
    });
  });
});
