import {
  EXISTING_STEP_PAGE_VIEWS,
  availableStepPageView,
  phaseStepPageFlagEnabled,
  phaseStepPageHref,
  resolvePhaseStepPageLanding,
} from "@/lib/programs/phase-step-page-routing";
import { STEP_PAGE_VIEWS, type StepPageView } from "@/lib/programs/step-page-views";

const p0Views = Object.keys(STEP_PAGE_VIEWS).filter(
  (view) => STEP_PAGE_VIEWS[view as StepPageView].phase === 0,
) as StepPageView[];

const base = {
  moveId: "move-1",
  phase: 0,
  route: null,
  implementedViews: p0Views,
  doneByStep: { "P0.1": true, "P0.2": false },
  enabled: true,
  legacy: false,
  requestedView: null,
};

describe("phase step-page sunset routing", () => {
  it("defaults a complete phase to its first step not done", () => {
    expect(resolvePhaseStepPageLanding(base)).toBe(
      "/strategic-moves/move-1/phase/0?step=p0-scope",
    );
    expect(
      resolvePhaseStepPageLanding({
        ...base,
        doneByStep: Object.fromEntries(
          ["P0.1", "P0.2", "P0.3", "P0.4", "P0.5"].map((id) => [id, true]),
        ),
      }),
    ).toBe("/strategic-moves/move-1/phase/0?step=p0-approve");
  });

  it("keeps an incomplete phase on capture and links its missing step to its section", () => {
    expect(
      resolvePhaseStepPageLanding({
        ...base,
        implementedViews: [p0Views[0]],
      }),
    ).toBeNull();
    expect(
      phaseStepPageHref("move-1", 0, "P0.2", ["scope_out"], [p0Views[0]]),
    ).toBe("/strategic-moves/move-1/phase/0?section=scope_out");
    expect(
      phaseStepPageHref("move-1", 1, "P1.5", [], []),
    ).toBe("/strategic-moves/move-1/phase/1");
    expect(availableStepPageView(0, "P0.2", [p0Views[0]])).toBeNull();
  });

  it("preserves the unlinked legacy hatch and an explicit page request", () => {
    expect(resolvePhaseStepPageLanding({ ...base, legacy: true })).toBeNull();
    expect(
      resolvePhaseStepPageLanding({ ...base, requestedView: "p0-signal" }),
    ).toBeNull();
    expect(
      phaseStepPageHref("move-1", 0, "P0.2", ["scope_out"], []),
    ).not.toContain("legacy=1");
  });

  it("leaves flag-off routing alone", () => {
    expect(resolvePhaseStepPageLanding({ ...base, enabled: false })).toBeNull();
    expect(
      phaseStepPageFlagEnabled(0, {
        captureV2: true,
        stepPagesV3: true,
        p0p1: false,
        p4p5: true,
      }),
    ).toBe(false);
    expect(
      phaseStepPageFlagEnabled(4, {
        captureV2: true,
        stepPagesV3: true,
        p0p1: true,
        p4p5: false,
      }),
    ).toBe(false);
    expect(EXISTING_STEP_PAGE_VIEWS).toContain("gate");
  });
});
