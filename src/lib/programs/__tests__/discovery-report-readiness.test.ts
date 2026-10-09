import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  GENERATED_REPORT_SOURCE,
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

describe("a generated report is judged by its words, not by what generation read", () => {
  const generatedRecord = {
    source: GENERATED_REPORT_SOURCE,
    // What persistMoveGeneratedArtifact stores beside the HTML: the inputs it
    // generated from, and the quality measurement of the output.
    solution_context: {
      gaps: ["Claims lineage unverified across the warehouse"],
      currentState: "Stakeholder interviews pending; baseline not attested",
    },
    golden_bar: {
      missingExactEvidenceTerms: [
        "stakeholder map",
        "baseline source of record",
      ],
    },
  };

  it("reads only the content of a version the generator wrote", () => {
    expect(
      discoveryReportTextFromLatestVersion({
        content: "Narrative body",
        structured_data: generatedRecord,
      }),
    ).toBe("narrative body");
  });

  it("does not read a capture finding as the report's own hard gap", () => {
    const text = discoveryReportTextFromLatestVersion({
      content: "No open hard gaps. Recommendation: proceed to P3 Design.",
      structured_data: generatedRecord,
    });
    expect(text).not.toMatch(/\bunverified\b/);
  });

  it("does not credit a report with words only its inputs or its missing-terms list carry", () => {
    const text = discoveryReportTextFromLatestVersion({
      content: "Recommendation: proceed to P3 Design.",
      structured_data: generatedRecord,
    });
    expect(text).not.toMatch(/stakeholder/);
    expect(text).not.toMatch(/baseline/);
  });

  it("is empty when a generated version has no content, whatever its record holds", () => {
    expect(
      discoveryReportTextFromLatestVersion({
        content: null,
        structured_data: generatedRecord,
      }),
    ).toBe("");
  });

  it("names the source the generator actually stamps", () => {
    // If the writer's stamp drifts, every generated report silently goes back
    // to being judged by its inputs.
    const writer = readFileSync(
      join(
        process.cwd(),
        "src/lib/deliverables/persist-move-generated-artifact.ts",
      ),
      "utf8",
    );
    expect(writer).toContain(`source: "${GENERATED_REPORT_SOURCE}"`);
  });

  it("still reads structured data written by anything other than the generator", () => {
    const text = discoveryReportTextFromLatestVersion({
      content: "Narrative body",
      structured_data: { source: "client_upload", decision: "Proceed" },
    });
    expect(text).toContain('"decision":"proceed"');
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
