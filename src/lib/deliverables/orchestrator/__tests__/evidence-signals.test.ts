import {
  carriesRequiredEvidenceSignal,
  selectRequiredEvidenceSignals,
} from "../evidence-signals";
import type { GovernedEvidenceItem } from "../types";

function evidence(
  citationNumber: number,
  label: string,
  statement: string,
  evidenceFamily = "smoke_test",
): GovernedEvidenceItem {
  return {
    citationNumber,
    label,
    statement,
    evidenceFamily,
    confidence: "high",
    disclosureTier: "internal_only",
    provenanceRef: `test:${citationNumber}`,
  };
}

describe("required evidence signal selection", () => {
  it("keeps closure-rate and scope-caveat signals in a crowded evidence pack", () => {
    const signals = selectRequiredEvidenceSignals([
      evidence(1, "Open care gaps", "Open care gaps: 1,142,000."),
      evidence(2, "Interface channels", "41 of 86 interface channels are not under source control."),
      evidence(3, "Unmonitored interfaces", "33 of 86 interfaces are unmonitored."),
      evidence(4, "Manual search time", "31 of every 53 minutes goes to search and reconciliation."),
      evidence(5, "Delivery baseline", "Lead time is 44 days."),
      evidence(6, "Legacy ETL test coverage", "Test coverage is 12 %."),
      evidence(7, "Application count", "120 systems are in the landscape."),
      evidence(8, "Facility count", "78 facilities are in scope."),
      evidence(9, "Quality measures", "40 quality measures are tracked."),
      evidence(10, "Overall care-gap closure rate", "Overall care-gap closure rate: 41.2 %."),
      evidence(11, "Kona Coast scope caveat", "Kona Coast remains design-only because the legacy feed is weekly."),
      evidence(12, "Retired readmission model", "The readmission model was retired in 2024."),
      evidence(13, "Declined sepsis alert", "The sepsis alert was declined because it lacked a monitoring plan."),
      evidence(14, "Value inputs", "Three value inputs are zero and unvalidated."),
    ]);

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Overall care-gap closure rate",
          statement: expect.stringContaining("41.2"),
        }),
        expect.objectContaining({
          label: "Interface channels",
          statement: expect.stringContaining("41 of 86"),
        }),
        expect.objectContaining({
          label: "Unmonitored interfaces",
          statement: expect.stringContaining("33 of 86"),
        }),
        expect.objectContaining({
          label: "Kona Coast scope caveat",
          statement: expect.stringContaining("design-only"),
        }),
      ]),
    );
  });

  it("treats qualitative caveats as carried when their meaning survives", () => {
    expect(
      carriesRequiredEvidenceSignal(
        "Launch readiness excludes Kona Coast from go-live scope until the weekly legacy feed improves.",
        "Kona Coast scope caveat",
        "Kona Coast remains design-only because the legacy feed is weekly.",
      ),
    ).toBe(true);
  });

  it("prefers exact phase-captured metrics over broad prior generated prose", () => {
    const signals = selectRequiredEvidenceSignals(
      [
        evidence(
          1,
          "Prior roadmap",
          "Care-gap closure roadmap discusses validation closure, operating closure, and gap-closure throughput without a measured baseline.",
          "generated_artifact:execution_roadmap",
        ),
        evidence(
          2,
          "P2 Capture Closure Rate",
          "Closure Rate: 41.2% (source: quality_measures.csv)",
          "phase_capture:baseline_metrics:closure_rate",
        ),
        evidence(
          3,
          "Prior architecture",
          "Interfaces are unmonitored and unversioned across the target architecture narrative.",
          "generated_artifact:target_state_architecture",
        ),
        evidence(
          4,
          "P2 Capture Unmonitored Interfaces",
          "Unmonitored Interfaces: 33 of 86 plus 18 partial (source: interface_inventory.csv)",
          "phase_capture:baseline_metrics:unmonitored_interfaces",
        ),
      ],
      2,
    );

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citationNumber: 2,
          statement: expect.stringContaining("41.2%"),
        }),
        expect.objectContaining({
          citationNumber: 4,
          statement: expect.stringContaining("33 of 86"),
        }),
      ]),
    );
    expect(signals.map((signal) => signal.citationNumber)).not.toContain(1);
    expect(signals.map((signal) => signal.citationNumber)).not.toContain(3);
  });
});
