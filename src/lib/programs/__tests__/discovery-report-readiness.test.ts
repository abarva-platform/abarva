import {
  discoveryReportTextFromLatestVersion,
  p2ReadinessBlockedReason,
} from "@/lib/programs/discovery-report-readiness";

describe("discoveryReportTextFromLatestVersion", () => {
  it("returns an EMPTY string when there is no version row at all", () => {
    // The defect this module exists for: the previous inline
    // `[a, b].join("\n")` produced "\n" here — length 1 — so every
    // `.length > 0` guard in the gate evaluator passed on nothing.
    expect(discoveryReportTextFromLatestVersion(undefined)).toBe("");
    expect(discoveryReportTextFromLatestVersion(null)).toBe("");
  });

  it("returns an EMPTY string when the version carries no readable content", () => {
    expect(
      discoveryReportTextFromLatestVersion({
        content: null,
        structured_data: null,
      }),
    ).toBe("");
  });

  it("treats whitespace-only content as empty", () => {
    expect(
      discoveryReportTextFromLatestVersion({
        content: "   \n\t  ",
        structured_data: null,
      }),
    ).toBe("");
  });

  it("lowercases the version content", () => {
    expect(
      discoveryReportTextFromLatestVersion({
        content: "P2 CLEARS For P3 Design",
        structured_data: null,
      }),
    ).toBe("p2 clears for p3 design");
  });

  it("includes structured data when that is the only readable half", () => {
    const text = discoveryReportTextFromLatestVersion({
      content: null,
      structured_data: { decision: "Proceed", baseline: "MTTR" },
    });
    expect(text).toContain("proceed");
    expect(text).toContain("mttr");
  });

  it("joins content and structured data on a newline when both are readable", () => {
    const text = discoveryReportTextFromLatestVersion({
      content: "Narrative body",
      structured_data: { decision: "Proceed" },
    });
    expect(text).toBe('narrative body\n{"decision":"proceed"}');
  });

  it("does not leave a separator when only one half is readable", () => {
    // A leading/trailing "\n" is exactly what made the emptiness test vacuous,
    // so the separator must only appear BETWEEN two present halves.
    expect(
      discoveryReportTextFromLatestVersion({
        content: "Only the narrative",
        structured_data: null,
      }),
    ).toBe("only the narrative");
  });
});

describe("p2ReadinessBlockedReason", () => {
  it("names the missing Discovery Report when no row exists", () => {
    expect(
      p2ReadinessBlockedReason({
        hasReportRow: false,
        reportText: "",
        hasHardGap: false,
      }),
    ).toContain("No signed Discovery Report is available");
  });

  it("names unresolved hard gaps when the report declares them", () => {
    expect(
      p2ReadinessBlockedReason({
        hasReportRow: true,
        reportText: "hard gaps: owner not yet named",
        hasHardGap: true,
      }),
    ).toContain("still contains unresolved hard-gap");
  });

  it("names a conditional proceed decision", () => {
    expect(
      p2ReadinessBlockedReason({
        hasReportRow: true,
        reportText: "synthesis complete. conditional proceed to p3.",
        hasHardGap: false,
      }),
    ).toContain("says conditional proceed");
  });

  it("names an unreadable report — the state that previously had NO sentence", () => {
    const reason = p2ReadinessBlockedReason({
      hasReportRow: true,
      reportText: "",
      hasHardGap: false,
    });
    expect(reason).toContain("no readable content");
    // It must prescribe an action that can actually be taken, not a log read.
    expect(reason).toMatch(/regenerate|upload/i);
  });

  it("falls back to 'does not state that P2 is clear' for a readable report that simply does not clear", () => {
    expect(
      p2ReadinessBlockedReason({
        hasReportRow: true,
        reportText: "a page of current-state notes with no decision recorded",
        hasHardGap: false,
      }),
    ).toContain("does not state that P2 is clear");
  });

  it("returns a non-empty sentence for EVERY combination of its inputs", () => {
    const texts = [
      "",
      "   ",
      "conditional proceed",
      "hard gaps remain",
      "p2 is clear, proceed to p3",
    ];
    for (const hasReportRow of [true, false]) {
      for (const hasHardGap of [true, false]) {
        for (const reportText of texts) {
          const reason = p2ReadinessBlockedReason({
            hasReportRow,
            reportText,
            hasHardGap,
          });
          expect(typeof reason).toBe("string");
          expect(reason.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("distinguishes the no-row case from the unreadable-row case", () => {
    const noRow = p2ReadinessBlockedReason({
      hasReportRow: false,
      reportText: "",
      hasHardGap: false,
    });
    const unreadableRow = p2ReadinessBlockedReason({
      hasReportRow: true,
      reportText: "",
      hasHardGap: false,
    });
    expect(noRow).not.toBe(unreadableRow);
  });
});
