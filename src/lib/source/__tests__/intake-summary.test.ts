import {
  buildSourceScopeDescription,
  parseSourceScopeDescription,
} from "@/lib/source/intake-summary";

describe("Source intake summary", () => {
  it("round-trips structured scope, value, baseline, and category fields", () => {
    const summary = parseSourceScopeDescription(
      buildSourceScopeDescription({
        scopeBoundary:
          "In scope: corporate shared-services AMS. Out of scope: plant IT.",
        valueTarget:
          "$15M-$20M four-year event with $2.5M-$3.5M avoided run cost.",
        baselineOwner:
          "Corporate IT service owner and Shared Services finance controller.",
        category: "Application Managed Services",
      }),
    );

    expect(summary.scopeBoundary).toBe(
      "In scope: corporate shared-services AMS. Out of scope: plant IT.",
    );
    expect(summary.valueTarget).toBe(
      "$15M-$20M four-year event with $2.5M-$3.5M avoided run cost.",
    );
    expect(summary.baselineOwner).toBe(
      "Corporate IT service owner and Shared Services finance controller.",
    );
    expect(summary.category).toBe("Application Managed Services");
  });

  it("normalizes duplicated composed rows from earlier intake submissions", () => {
    const summary = parseSourceScopeDescription(
      [
        "Scope boundary: Scope boundary: In scope: corporate shared-services AMS. Out of scope: plant IT.",
        "Value target: $15M-$20M four-year event with $2.5M-$3.5M avoided run cost.",
        "Baseline owner: Corporate IT service owner and Shared Services finance controller.",
        "Value target: $15M-$20M four-year event with $2.5M-$3.5M avoided run cost.",
        "Baseline owner: Corporate IT service owner and Shared Services finance controller.",
      ].join("\n"),
    );

    expect(summary.scopeBoundary).toBe(
      "In scope: corporate shared-services AMS. Out of scope: plant IT.",
    );
    expect(summary.valueTarget).toBe(
      "$15M-$20M four-year event with $2.5M-$3.5M avoided run cost.",
    );
    expect(summary.baselineOwner).toBe(
      "Corporate IT service owner and Shared Services finance controller.",
    );
  });
});
