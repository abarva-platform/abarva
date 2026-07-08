import { checkCapabilityClaims } from "../capability-claim-guard";

describe("checkCapabilityClaims", () => {
  it("flags a definitive claim that a not_built capability runs", () => {
    const violations = checkCapabilityClaims(
      "This platform automatically flags records older than your freshness threshold as stale.",
      "lakeshore",
    );
    expect(violations.some((v) => v.id === "capability-staleness_detector")).toBe(true);
  });

  it("does not flag a bare mention without a definitive-live framing", () => {
    const violations = checkCapabilityClaims(
      "Staleness detection against freshness thresholds is on the roadmap.",
      "lakeshore",
    );
    expect(violations).toEqual([]);
  });

  it("flags a pilot-only capability claimed live for a non-enrolled tenant", () => {
    const violations = checkCapabilityClaims(
      "You can already use pattern assembly to assemble solution options for this Move.",
      "apexretail",
    );
    expect(violations.some((v) => v.id === "capability-moves_pattern_assembly")).toBe(true);
  });

  it("does not flag a pilot-only capability for an enrolled tenant", () => {
    const violations = checkCapabilityClaims(
      "You can already use pattern assembly to assemble solution options for this Move.",
      "lakeshore",
    );
    expect(violations.some((v) => v.id === "capability-moves_pattern_assembly")).toBe(false);
  });

  it("returns no violations for clean, unrelated text", () => {
    const violations = checkCapabilityClaims(
      "P2 has zero evidence items uploaded so far — that's the gap.",
      "lakeshore",
    );
    expect(violations).toEqual([]);
  });
});
