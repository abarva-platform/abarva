import {
  GENERATION_PHASES,
  buildGenerationProgress,
  stageLabel,
} from "../progress";

describe("deliverable generation progress (decomposed)", () => {
  it("has the three decomposed phases in order", () => {
    expect(GENERATION_PHASES.map((s) => s.pass)).toEqual([
      "architect",
      "section_draft",
      "synthesis",
    ]);
    for (const s of GENERATION_PHASES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("reports a small fixed planning percent for the architect (total not yet known)", () => {
    expect(buildGenerationProgress("architect", 1)).toMatchObject({
      completed: 1,
      total: 0,
      pct: 5,
      label: "Planning the structure",
      nextLabel: "Writing the document, section by section",
    });
  });

  it("scales the percent to the dynamic total once the section count is known", () => {
    // 12-section charter → total = 12 + architect + synthesis = 14
    // 3rd call completed (architect + 2 sections) → 3/14 ≈ 21%
    expect(buildGenerationProgress("section_draft", 3, 14)).toMatchObject({
      completed: 3,
      total: 14,
      pct: 21,
      label: "Writing the document, section by section",
      nextLabel: "Writing the document, section by section",
    });
  });

  it("names synthesis as next once the last section is done", () => {
    // call 13 of 14 = the final section → synthesis runs next
    expect(buildGenerationProgress("section_draft", 13, 14).nextLabel).toBe(
      "Assembling the final document",
    );
  });

  it("reaches 100% with no next phase after synthesis", () => {
    const last = buildGenerationProgress("synthesis", 14, 14);
    expect(last.pct).toBe(100);
    expect(last.nextLabel).toBeNull();
  });

  it("clamps an out-of-range count instead of producing a nonsense percent", () => {
    expect(buildGenerationProgress("synthesis", 99, 14).pct).toBe(100);
  });

  it("falls back to the pass id when a label is unknown", () => {
    // @ts-expect-error — exercising the defensive default path
    expect(stageLabel("unknown_pass")).toBe("unknown_pass");
  });
});
