import {
  GENERATION_STAGES,
  TOTAL_GENERATION_STAGES,
  buildGenerationProgress,
  stageLabel,
} from "../progress";

describe("deliverable generation progress", () => {
  it("has six ordered stages matching the orchestrator pass sequence", () => {
    expect(TOTAL_GENERATION_STAGES).toBe(6);
    expect(GENERATION_STAGES.map((s) => s.pass)).toEqual([
      "architect",
      "evidence_grounding",
      "full_draft",
      "red_team",
      "board_grade_rewrite",
      "render_package",
    ]);
    for (const s of GENERATION_STAGES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("maps each completed pass to a cumulative percent and a human label", () => {
    expect(buildGenerationProgress("architect", 1)).toMatchObject({
      completed: 1,
      total: 6,
      pct: 17,
      label: "Planning the structure",
      nextLabel: "Grounding in your evidence",
    });
    expect(buildGenerationProgress("full_draft", 3)).toMatchObject({
      pct: 50,
      label: "Writing the first draft",
      nextLabel: "Pressure-testing for gaps",
    });
  });

  it("reaches 100% with no next stage after the final pass", () => {
    const last = buildGenerationProgress("render_package", 6);
    expect(last.pct).toBe(100);
    expect(last.nextLabel).toBeNull();
  });

  it("clamps out-of-range counts instead of producing nonsense percents", () => {
    expect(buildGenerationProgress("architect", 0).pct).toBe(17);
    expect(buildGenerationProgress("render_package", 99).pct).toBe(100);
  });

  it("falls back to the pass id when a label is unknown", () => {
    // @ts-expect-error — exercising the defensive default path
    expect(stageLabel("unknown_pass")).toBe("unknown_pass");
  });
});
