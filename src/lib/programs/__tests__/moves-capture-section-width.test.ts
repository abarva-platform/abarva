import {
  captureSectionSpan,
  PHASE_WIDE_CAPTURE_SECTIONS,
} from "@/lib/programs/moves-capture-section-width";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { getPhaseStepGroups } from "@/lib/programs/moves-phase-step-groups";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

// The Claude-Design verdicts, re-stated here as the contract (so a drift in the
// map is a failing test, not a silent layout change).
const EXPECTED_WIDE: Record<number, string[]> = {
  3: [
    "solution_approach",
    "recommendation",
    "controls_governance",
    "architecture_integration",
    "evidence_confidence",
  ],
  4: [
    "roadmap_sequencing",
    "estimates_capacity",
    "value_plan",
    "funding_governance",
    "recommendation",
  ],
  5: [
    "mobilization_plan",
    "launch_readiness",
    "value_proof_rules",
    "governance_cadence",
    "first_90_days",
  ],
};

const plain = (key: string): PhaseCaptureSection => ({
  key,
  label: key,
  description: "",
  required: true,
});

describe("captureSectionSpan", () => {
  for (const phaseStr of Object.keys(EXPECTED_WIDE)) {
    const phase = Number(phaseStr);
    const wide = new Set(EXPECTED_WIDE[phase]);
    const sections = getPhaseCaptureSections(phase);

    it(`P${phase}: every declared section gets its reviewed width`, () => {
      // Guard: the map keys must all be real sections for this phase.
      const real = new Set(sections.map((s) => s.key));
      for (const key of wide) expect(real.has(key)).toBe(true);

      for (const section of sections) {
        const expected = wide.has(section.key) ? "wide" : "default";
        expect({ key: section.key, span: captureSectionSpan(phase, section) }).toEqual(
          { key: section.key, span: expected },
        );
      }
    });
  }

  it("keeps a structured editor wide even when its phase lists nothing", () => {
    // P2 is not in the map; a structured section there must still be wide.
    expect(
      captureSectionSpan(2, { key: "diagnosis_facts", structured: "facts" }),
    ).toBe("wide");
    // and a plain section in an unlisted phase is single-column
    expect(captureSectionSpan(2, plain("some_plain"))).toBe("default");
  });

  it("never narrows a structured section, even if the map wrongly listed it as default", () => {
    // estimates_capacity is structured; whether or not it's in the wide set it
    // must resolve wide. (It is listed, but the structured guard is the floor.)
    expect(
      captureSectionSpan(4, { key: "estimates_capacity", structured: "estimate-model" }),
    ).toBe("wide");
  });

  it("only lists keys that exist in the phase it's filed under", () => {
    for (const phaseStr of Object.keys(PHASE_WIDE_CAPTURE_SECTIONS)) {
      const phase = Number(phaseStr);
      const real = new Set(getPhaseCaptureSections(phase).map((s) => s.key));
      for (const key of PHASE_WIDE_CAPTURE_SECTIONS[phase]) {
        expect({ phase, key, exists: real.has(key) }).toEqual({
          phase,
          key,
          exists: true,
        });
      }
    }
  });

  // THE design invariant: in the two-column auto-flow grid, a step renders with
  // no lone half-cell exactly when every maximal run of single-column
  // ("default") sections has EVEN length (each D pairs; a wide section forces
  // its own full row). This catches a wrong verdict OR a future question
  // reorder that would strand a half-cell.
  describe("every P3-P5 step resolves to a clean rectangle", () => {
    for (const phase of [3, 4, 5]) {
      const groups = getPhaseStepGroups(phase);
      const byKey = new Map(
        getPhaseCaptureSections(phase).map((s) => [s.key, s]),
      );
      groups.forEach((group, idx) => {
        it(`P${phase} step ${idx + 1} "${group.title}" has no orphan half-cell`, () => {
          const spans = group.sectionKeys.map((key) => {
            const section = byKey.get(key);
            expect(section).toBeDefined();
            return captureSectionSpan(phase, section as PhaseCaptureSection);
          });
          // Longest run of consecutive "default" cells.
          let run = 0;
          const oddRuns: number[] = [];
          for (const span of [...spans, "wide"]) {
            if (span === "default") run += 1;
            else {
              if (run % 2 === 1) oddRuns.push(run);
              run = 0;
            }
          }
          expect({ phase, step: group.title, spans, oddRuns }).toEqual({
            phase,
            step: group.title,
            spans,
            oddRuns: [],
          });
        });
      });
    }
  });
});
