import {
  parseStepPageView,
  STEP_PAGE_VIEWS,
  stepPageHref,
} from "@/lib/programs/step-page-views";
import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";

describe("step page views", () => {
  it("parses only a declared view", () => {
    expect(parseStepPageView("architecture-options")).toBe(
      "architecture-options",
    );
    expect(parseStepPageView("operating-adoption")).toBe("operating-adoption");
    expect(parseStepPageView("toString")).toBeNull();
    expect(parseStepPageView(["gate"])).toBeNull();
    expect(parseStepPageView(undefined)).toBeNull();
  });

  it("links a step to its page, and a step without one to the phase", () => {
    expect(stepPageHref("m1", 3, "P3.2")).toBe(
      "/strategic-moves/m1/phase/3?step=architecture-options",
    );
    expect(stepPageHref("m1", 3, "P3.3")).toBe(
      "/strategic-moves/m1/phase/3?step=operating-adoption",
    );
    expect(stepPageHref("m1", 3, "P3.4")).toBe(
      "/strategic-moves/m1/phase/3?step=rom-estimate",
    );
    expect(parseStepPageView("rom-estimate")).toBe("rom-estimate");
  });

  it("names only steps the workflow registry declares", () => {
    expect(Object.keys(STEP_PAGE_VIEWS)).toHaveLength(29);
    expect(
      Object.values(STEP_PAGE_VIEWS).filter(({ phase }) =>
        [0, 1, 4, 5].includes(phase),
      ),
    ).toHaveLength(19);
    for (const { phase, stepId } of Object.values(STEP_PAGE_VIEWS)) {
      expect(resolvePhaseWorkflow(phase, null).map((s) => s.id)).toContain(
        stepId,
      );
    }
  });
});
