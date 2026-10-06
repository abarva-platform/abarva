/**
 * gate-summary-line — the Explain drawer's gate headline.
 *
 * Pure unit tests. Each case pins one of the four independent things that
 * were wrong with the line this module replaced: the set it counted, `partial`
 * reported as unmet, `waived` reported as met, and a fixed plural noun welded
 * to a figure whose 1 is reachable.
 */

import {
  buildGateSummaryLine,
  countGateStatuses,
  gateCriterionNoun,
  type GateStatusCounts,
} from "@/lib/reasoning/gate-summary-line";
import type { GateEvaluation } from "@/lib/reasoning/types";

function status(s: GateEvaluation["status"]): Pick<GateEvaluation, "status"> {
  return { status: s };
}

function counts(over: Partial<GateStatusCounts> = {}): GateStatusCounts {
  return { total: 0, met: 0, partial: 0, waived: 0, unmet: 0, ...over };
}

describe("countGateStatuses", () => {
  it("partitions the list — the four counts always sum to the total", () => {
    const result = countGateStatuses([
      status("met"),
      status("met"),
      status("partial"),
      status("waived"),
      status("unmet"),
    ]);
    expect(result).toEqual({ total: 5, met: 2, partial: 1, waived: 1, unmet: 1 });
    expect(result.met + result.partial + result.waived + result.unmet).toBe(
      result.total,
    );
  });

  it("does NOT count a waived criterion as met", () => {
    // The replaced reading was `status === 'met' || status === 'waived'`, which
    // reported a deliberately bypassed criterion as proven.
    const result = countGateStatuses([status("waived"), status("waived")]);
    expect(result.met).toBe(0);
    expect(result.waived).toBe(2);
  });

  it("does NOT count a partial criterion as unmet", () => {
    // The replaced reading was `unmet: total - metCount`, which swept every
    // status that was not met-or-waived into `unmet`.
    const result = countGateStatuses([status("partial"), status("unmet")]);
    expect(result.partial).toBe(1);
    expect(result.unmet).toBe(1);
  });

  it("counts the list it is given, so caller and body cannot drift", () => {
    expect(countGateStatuses([]).total).toBe(0);
    expect(
      countGateStatuses([status("met"), status("unmet"), status("met")]).total,
    ).toBe(3);
  });
});

describe("gateCriterionNoun", () => {
  it("agrees the noun with its figure", () => {
    expect(gateCriterionNoun(1)).toBe("criterion");
    expect(gateCriterionNoun(0)).toBe("criteria");
    expect(gateCriterionNoun(2)).toBe("criteria");
  });
});

describe("buildGateSummaryLine", () => {
  it("names what it counted", () => {
    expect(buildGateSummaryLine(counts({ total: 4, met: 2, unmet: 2 }))).toBe(
      "2 of 4 gate criteria met · 2 unmet",
    );
  });

  it("agrees the noun with a one-criterion reading, which is reachable", () => {
    // One program synthesis context builder constructs `total: 1` literally,
    // so `Gates: 1 of 1 met` — a fixed plural over a single criterion — was a
    // reading this surface could produce.
    expect(buildGateSummaryLine(counts({ total: 1, met: 1 }))).toBe(
      "1 of 1 gate criterion met",
    );
    expect(buildGateSummaryLine(counts({ total: 1, unmet: 1 }))).toBe(
      "0 of 1 gate criterion met · 1 unmet",
    );
  });

  it("says a waived criterion was not met, in the same line as the figure", () => {
    const line = buildGateSummaryLine(
      counts({ total: 3, met: 2, waived: 1 }),
    );
    expect(line).toBe("2 of 3 gate criteria met · 1 waived, not met");
    // The headline must never let a waiver read as proof.
    expect(line).not.toMatch(/3 of 3/);
  });

  it("reports partial separately from unmet", () => {
    const line = buildGateSummaryLine(
      counts({ total: 5, met: 1, partial: 2, unmet: 2 }),
    );
    expect(line).toBe("1 of 5 gate criteria met · 2 partial · 2 unmet");
    expect(line).not.toMatch(/4 unmet/);
  });

  it("states every status present, so the clauses reconcile to the total", () => {
    const line = buildGateSummaryLine(
      counts({ total: 4, met: 1, partial: 1, waived: 1, unmet: 1 }),
    );
    expect(line).toBe(
      "1 of 4 gate criteria met · 1 partial · 1 waived, not met · 1 unmet",
    );
  });

  it("omits a clause for a status that is absent", () => {
    expect(buildGateSummaryLine(counts({ total: 2, met: 2 }))).toBe(
      "2 of 2 gate criteria met",
    );
  });

  it("claims nothing when nothing was evaluated", () => {
    const line = buildGateSummaryLine(counts());
    expect(line).toBe("No gate criteria evaluated");
    // Not "0 of 0 met", which reads as a measured all-clear.
    expect(line).not.toMatch(/\bmet\b/);
  });
});
