import {
  PHASE_REQUIRED_CONTEXT,
  architectureMayProceed,
  contextReadyForPhase,
  type SolutionContext,
} from "../solution-context";
import {
  SOLUTION_CONTEXT_FIELD_LABELS,
  describeMissingSolutionContext,
} from "../solution-context-labels";
import { formatDraftCaveatText } from "@/lib/deliverables/generate-artifact";

const EMPTY_CONTEXT: SolutionContext = {
  moveId: "move-1",
  tenantKey: "tenant-1",
  decisions: [],
  humanApprovalNotes: [],
  evidencePackets: [],
};

// Derived from the producers, not hand-typed: every entry `contextReadyForPhase`
// and `architectureMayProceed` can report for an empty context.
const EVERY_REPORTED_MISSING = [
  ...Object.keys(PHASE_REQUIRED_CONTEXT).flatMap(
    (phase) => contextReadyForPhase(EMPTY_CONTEXT, Number(phase)).missing,
  ),
  ...architectureMayProceed(EMPTY_CONTEXT).missing,
];

describe("describeMissingSolutionContext", () => {
  it("covers every field a phase can report missing", () => {
    expect(EVERY_REPORTED_MISSING.length).toBeGreaterThanOrEqual(8);
    for (const missing of EVERY_REPORTED_MISSING) {
      const described = describeMissingSolutionContext(missing);
      expect(described).not.toBe(missing);
      expect(described).not.toMatch(/\b[a-z]+[A-Z][A-Za-z]*\b/);
    }
  });

  it("names each required field by its label", () => {
    expect(describeMissingSolutionContext("useCase")).toBe(
      SOLUTION_CONTEXT_FIELD_LABELS.useCase,
    );
    expect(describeMissingSolutionContext("kpis")).toBe(
      SOLUTION_CONTEXT_FIELD_LABELS.kpis,
    );
    expect(
      describeMissingSolutionContext("chosenOption (P3a approval required)"),
    ).toBe(
      `${SOLUTION_CONTEXT_FIELD_LABELS.chosenOption} (P3a approval required)`,
    );
  });

  it("returns an unknown entry unchanged rather than dropping it", () => {
    expect(describeMissingSolutionContext("someFutureField")).toBe(
      "someFutureField",
    );
    expect(describeMissingSolutionContext("toString")).toBe("toString");
  });
});

describe("the pre-gate draft banner names missing context by label", () => {
  it("prints no raw SolutionContext key for the P2 required fields", () => {
    const missing = contextReadyForPhase(EMPTY_CONTEXT, 2).missing;
    expect(missing).toEqual(["useCase", "kpis"]);
    const text = formatDraftCaveatText({
      draftCaveats: [],
      contextCaveats: missing,
    });
    expect(text).toContain(
      `${SOLUTION_CONTEXT_FIELD_LABELS.useCase} is not yet captured or approved for final use`,
    );
    expect(text).toContain(
      `${SOLUTION_CONTEXT_FIELD_LABELS.kpis} is not yet captured or approved for final use`,
    );
    expect(text).not.toMatch(/\buseCase\b/);
    expect(text).not.toMatch(/\bkpis\b/);
    // The P2 gate reads this banner as an open gap; the phrase it matches stays.
    expect(text).toMatch(/\bnot yet captured\b/);
  });
});
