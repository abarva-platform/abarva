import {
  capturePhaseProgress,
  capturePhaseSavedAnswers,
} from "@/lib/programs/capture-phase-progress";
import {
  capturePhaseSavedAnswerCounts,
  type CaptureModuleStateRow,
} from "@/lib/programs/capture-phase-saved-answers";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

function route(
  overrides: Partial<ConfirmedSolutionRoute> = {},
): ConfirmedSolutionRoute {
  return {
    route: "process_change",
    recommendation: "process_change",
    solutionOutput: "workflow_automation",
    workflowChange: "material",
    roleAccountabilityChange: "material",
    adoptionOwner: "Named business owner",
    adoptionResponsibility: "business",
    decision: "confirm",
    evidenceReference: "evidence-ref",
    validatedBy: "Validator",
    rationale: "Route confirmed against P2 evidence.",
    ...overrides,
  };
}

const TECHNICAL_PRODUCT = route({
  route: "technical_product",
  recommendation: "technical_product",
  solutionOutput: "data_product",
  workflowChange: "limited",
  roleAccountabilityChange: "none",
});

/** A saved module row for the Nth section of `phase`, under the real key. */
function savedRow(
  phase: number,
  index: number,
  value = "A real saved answer.",
  routeArg: ConfirmedSolutionRoute | null = null,
): CaptureModuleStateRow {
  const section = getPhaseCaptureSections(phase, routeArg)[index];
  return {
    moduleKey: phaseCaptureModuleKey(phase, section.key),
    state: { value },
  };
}

describe("capturePhaseSavedAnswerCounts", () => {
  it("counts a phase's saved answers off the rows the host already holds", () => {
    const counts = capturePhaseSavedAnswerCounts(
      [savedRow(1, 0), savedRow(1, 1), savedRow(4, 0)],
      null,
    );
    expect(counts[1]).toBe(2);
    expect(counts[4]).toBe(1);
  });

  it("reports every phase, including the ones with nothing saved", () => {
    const counts = capturePhaseSavedAnswerCounts([savedRow(2, 0)], null);
    for (const phase of [0, 1, 2, 3, 4, 5]) {
      expect(typeof counts[phase]).toBe("number");
    }
    expect(counts[0]).toBe(0);
    expect(counts[5]).toBe(0);
  });

  it("does not count a blank or whitespace-only value as a saved answer", () => {
    // The capture route trims both sides when it diffs values, so an untrimmed
    // count here would report an answer the product itself treats as absent.
    expect(capturePhaseSavedAnswerCounts([savedRow(1, 0, "")], null)[1]).toBe(
      0,
    );
    expect(
      capturePhaseSavedAnswerCounts([savedRow(1, 0, "   \n ")], null)[1],
    ).toBe(0);
    expect(capturePhaseSavedAnswerCounts([savedRow(1, 0, "x")], null)[1]).toBe(
      1,
    );
  });

  it("ignores a row whose state holds no string value", () => {
    const section = getPhaseCaptureSections(1, null)[0];
    const key = phaseCaptureModuleKey(1, section.key);
    expect(
      capturePhaseSavedAnswerCounts([{ moduleKey: key, state: {} }], null)[1],
    ).toBe(0);
    expect(
      capturePhaseSavedAnswerCounts([{ moduleKey: key, state: null }], null)[1],
    ).toBe(0);
    expect(
      capturePhaseSavedAnswerCounts(
        [{ moduleKey: key, state: { value: 7 } }],
        null,
      )[1],
    ).toBe(0);
  });

  it("ignores a module row that is not a capture section of that phase", () => {
    // A Move's module rows include far more than the capture sections; keying
    // off the canonical key is what keeps an unrelated row out of the count.
    expect(
      capturePhaseSavedAnswerCounts(
        [{ moduleKey: "phase_1_not_a_capture_section", state: { value: "x" } }],
        null,
      )[1],
    ).toBe(0);
  });

  it("does not credit a phase for another phase's saved answer", () => {
    const counts = capturePhaseSavedAnswerCounts([savedRow(2, 0)], null);
    expect(counts[2]).toBe(1);
    expect(counts[1]).toBe(0);
  });

  it("counts P3 against the route's own question set, not the default one", () => {
    // P3 is the only route-dependent phase. Assert the sets differ from the
    // CONTRACT rather than from hard-coded sizes, so a future contract change
    // cannot leave this case passing while covering nothing.
    const defaultSections = getPhaseCaptureSections(3, null);
    const technicalSections = getPhaseCaptureSections(3, TECHNICAL_PRODUCT);
    expect(technicalSections.length).toBeLessThan(defaultSections.length);

    // Save an answer for every section the DEFAULT route asks for.
    const rows = defaultSections.map((section) => ({
      moduleKey: phaseCaptureModuleKey(3, section.key),
      state: { value: "Saved." },
    }));

    expect(capturePhaseSavedAnswerCounts(rows, null)[3]).toBe(
      defaultSections.length,
    );

    // The technical-product set is NOT a subset of the default one — it asks a
    // question the default route does not — so the same rows count only the
    // overlap. Derived from the contract, because the expected number is a
    // property of the two section lists and not of this test.
    const defaultKeys = new Set(defaultSections.map((section) => section.key));
    const overlap = technicalSections.filter((section) =>
      defaultKeys.has(section.key),
    ).length;
    expect(overlap).toBeLessThan(defaultSections.length);
    expect(capturePhaseSavedAnswerCounts(rows, TECHNICAL_PRODUCT)[3]).toBe(
      overlap,
    );
  });
});

describe("capturePhaseSavedAnswers", () => {
  const context = {
    viewedPhase: 1,
    currentPhase: 3,
    viewedAnsweredCount: 2,
    savedAnswerCountByPhase: { 0: 4, 1: 6, 2: 1, 3: 0, 4: 0, 5: 0 },
  };

  it("returns the saved count for a row this screen cannot measure", () => {
    expect(capturePhaseSavedAnswers({ phase: 0, total: 11 }, context)).toBe(4);
    expect(capturePhaseSavedAnswers({ phase: 2, total: 7 }, context)).toBe(1);
  });

  it("returns null for the VIEWED row, which already states a live count", () => {
    // One figure per row. Showing a second, weaker number beside the live one
    // is the shape of the defect that produced a count above its own total.
    expect(capturePhaseSavedAnswers({ phase: 1, total: 7 }, context)).toBeNull();
  });

  it("returns null when the host supplies no rollup", () => {
    expect(
      capturePhaseSavedAnswers(
        { phase: 0, total: 11 },
        { viewedPhase: 1, currentPhase: 3, viewedAnsweredCount: 2 },
      ),
    ).toBeNull();
  });

  it("returns null for a phase the rollup does not mention", () => {
    expect(
      capturePhaseSavedAnswers(
        { phase: 4, total: 7 },
        { ...context, savedAnswerCountByPhase: { 0: 1 } },
      ),
    ).toBeNull();
  });

  it("clamps a saved count to the row's own total", () => {
    expect(
      capturePhaseSavedAnswers(
        { phase: 0, total: 3 },
        { ...context, savedAnswerCountByPhase: { 0: 99 } },
      ),
    ).toBe(3);
    expect(
      capturePhaseSavedAnswers(
        { phase: 0, total: 3 },
        { ...context, savedAnswerCountByPhase: { 0: -5 } },
      ),
    ).toBe(0);
  });

  it("rejects a non-finite count rather than rendering it", () => {
    expect(
      capturePhaseSavedAnswers(
        { phase: 0, total: 3 },
        { ...context, savedAnswerCountByPhase: { 0: Number.NaN } },
      ),
    ).toBeNull();
  });
});

describe("capturePhaseProgress with a saved-answer rollup", () => {
  const rows = [
    { phase: 0, total: 11 },
    { phase: 1, total: 7 },
    { phase: 2, total: 7 },
  ];
  const context = {
    viewedPhase: 1,
    currentPhase: 2,
    viewedAnsweredCount: 3,
    savedAnswerCountByPhase: { 0: 5, 1: 7, 2: 2 },
  };

  it("never gives one row both an answered and a saved count", () => {
    // The two are defined on complementary sets of rows, so a row showing both
    // would mean the strip could state the same phase two different figures.
    for (const row of capturePhaseProgress(rows, context)) {
      expect(row.answered === null || row.savedAnswers === null).toBe(true);
    }
  });

  it("keeps the viewed row's live answered count and gives it no saved count", () => {
    const viewed = capturePhaseProgress(rows, context).find(
      (row) => row.phase === 1,
    );
    expect(viewed?.answered).toBe(3);
    expect(viewed?.savedAnswers).toBeNull();
  });

  it("leaves the unmeasured rows' answered count null — a saved answer is not an answered question", () => {
    // The invariant this rollup must not weaken: only a live measurement can
    // make a row claim coverage. A phase whose every question holds a saved
    // answer still reports `answered: null`, so no completion tick is drawn
    // from saved work alone.
    const full = capturePhaseProgress(
      [{ phase: 0, total: 2 }],
      {
        viewedPhase: 1,
        currentPhase: 1,
        viewedAnsweredCount: 0,
        savedAnswerCountByPhase: { 0: 2 },
      },
    )[0];
    expect(full.savedAnswers).toBe(2);
    expect(full.answered).toBeNull();
  });

  it("is unchanged from the pre-rollup behaviour when no rollup is passed", () => {
    const withoutRollup = capturePhaseProgress(rows, {
      viewedPhase: 1,
      currentPhase: 2,
      viewedAnsweredCount: 3,
    });
    expect(withoutRollup.map((row) => row.answered)).toEqual([null, 3, null]);
    expect(withoutRollup.map((row) => row.savedAnswers)).toEqual([
      null,
      null,
      null,
    ]);
  });
});
