import {
  captureStepResumeIndex,
  type CaptureStepReadiness,
} from "@/lib/programs/capture-step-resume";
import { phaseStepPlan } from "@/lib/programs/moves-phase-step-plan";
import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";

const step = (
  over: Partial<CaptureStepReadiness> = {},
): CaptureStepReadiness => ({
  mounted: 2,
  unmounted: 0,
  allComplete: true,
  ...over,
});

describe("captureStepResumeIndex", () => {
  it("resumes to the first step with an unanswered question", () => {
    expect(
      captureStepResumeIndex([
        step(),
        step({ allComplete: false }),
        step({ allComplete: false }),
      ]),
    ).toBe(1);
  });

  it("stops at the last step when every step is answered, so the approval action is where the screen lands", () => {
    expect(captureStepResumeIndex([step(), step(), step()])).toBe(2);
  });

  it("treats a step that mounts no questions as done rather than as the place to stop", () => {
    expect(
      captureStepResumeIndex([step(), step({ mounted: 0 }), step()]),
    ).toBe(2);
  });

  // `MovesCaptureFlow` reads a step's answers with `every`, which is vacuously
  // true for a step that mounts nothing — so the mounted-count guard only earns
  // its place against a caller that reports the empty step as NOT complete.
  // Without the guard this case resumes onto a panel with no question on it.
  it("skips an empty step even when the caller calls it incomplete", () => {
    expect(
      captureStepResumeIndex([
        step(),
        step({ mounted: 0, allComplete: false }),
        step(),
      ]),
    ).toBe(2);
  });

  it("still stops at a step whose answers it cannot see, because a question it references is not mounted", () => {
    expect(
      captureStepResumeIndex([
        step(),
        step({ mounted: 1, unmounted: 1, allComplete: true }),
        step(),
      ]),
    ).toBe(1);
  });

  it("stops at the first unanswered step even when an empty step comes before it", () => {
    expect(
      captureStepResumeIndex([
        step({ mounted: 0 }),
        step({ allComplete: false }),
        step(),
      ]),
    ).toBe(1);
  });

  it("returns 0 for a phase with no steps at all", () => {
    expect(captureStepResumeIndex([])).toBe(0);
  });

  it("returns 0 when the only step is empty, because there is no other index to open on", () => {
    expect(captureStepResumeIndex([step({ mounted: 0 })])).toBe(0);
  });
});

describe("the P3 Design shape this rule exists for", () => {
  const section = (key: string): PhaseCaptureSection => ({
    key,
    label: key,
    description: "",
    required: true,
  });

  // A declared set no route variant covers exactly, so the plan is repaired
  // against P3's DEFAULT grouping — whose second step is exactly
  // `operating_model` + `process_design`, neither of which this set declares.
  const DECLARED = [
    "solution_approach",
    "business_change_boundary",
    "controls_governance",
    "architecture_integration",
    "evidence_confidence",
    "recommendation",
    "estimate_assumptions",
  ].map(section);

  it("repairs P3 into a grouping with one step that mounts nothing", () => {
    const plan = phaseStepPlan(3, DECLARED);
    expect(plan.basis).toBe("repaired");
    expect(plan.groups.map((group) => group.sectionKeys.length)).toEqual([
      2, 0, 5,
    ]);
  });

  it("does not resume a fully answered repaired P3 onto that empty step", () => {
    const plan = phaseStepPlan(3, DECLARED);
    const declaredKeys = new Set(DECLARED.map((s) => s.key));
    const resume = captureStepResumeIndex(
      plan.groups.map((group) => {
        const mounted = group.sectionKeys.filter((key) =>
          declaredKeys.has(key),
        );
        return {
          mounted: mounted.length,
          unmounted: group.sectionKeys.length - mounted.length,
          allComplete: true,
        };
      }),
    );
    expect(resume).toBe(plan.groups.length - 1);
  });

  it("leaves every phase whose grouping already fits resuming exactly as before", () => {
    for (const phase of [0, 1, 2, 3, 4, 5]) {
      const sections = getPhaseCaptureSections(phase);
      const plan = phaseStepPlan(phase, sections);
      expect(plan.basis).toBe("default");
      const answered = plan.groups.map((group) =>
        step({ mounted: group.sectionKeys.length }),
      );
      expect(captureStepResumeIndex(answered)).toBe(plan.groups.length - 1);
      const unanswered = plan.groups.map((group) =>
        step({ mounted: group.sectionKeys.length, allComplete: false }),
      );
      expect(captureStepResumeIndex(unanswered)).toBe(0);
    }
  });
});
