import {
  EXISTING_STEP_PAGE_VIEWS,
  availableStepPageView,
  phaseStepPageFlagEnabled,
  phaseStepPageHref,
  resolveBarePhaseStepPageLanding,
  resolvePhaseStepPageLanding,
  shouldDeferBarePhaseLanding,
} from "@/lib/programs/phase-step-page-routing";
import {
  STEP_PAGE_VIEWS,
  type StepPageView,
} from "@/lib/programs/step-page-views";
import { PHASE_STEP_PAGES } from "@/components/strategic-moves/step-page/phase-step-pages";
import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
  it("defers only flagged bare landings that need saved completion or P2 catch-up", () => {
    const input = {
      catchUpEnabled: true,
      requestedPhase: 3,
      currentPhase: 3,
      earlyTarget: "/first",
    };
    expect(shouldDeferBarePhaseLanding(input)).toBe(true);
    expect(shouldDeferBarePhaseLanding({ ...input, requestedPhase: 2 })).toBe(
      true,
    );
    expect(shouldDeferBarePhaseLanding({ ...input, requestedPhase: 1 })).toBe(
      false,
    );
    expect(
      shouldDeferBarePhaseLanding({ ...input, catchUpEnabled: false }),
    ).toBe(false);
    expect(shouldDeferBarePhaseLanding({ ...input, earlyTarget: null })).toBe(
      false,
    );
  });
  it("matches the host's dedicated mounts, every gate, and every slot in both directions", () => {
    const host = readFileSync(
      join(
        process.cwd(),
        "src/components/strategic-moves/MovesPhaseStandaloneClient.tsx",
      ),
      "utf8",
    );
    const dedicatedMounts = [
      ...host.matchAll(/initialStepView === "([^"]+)"/g),
    ].map((match) => match[1]);
    const gateViews = (Object.keys(STEP_PAGE_VIEWS) as StepPageView[]).filter(
      (view) => {
        const entry = STEP_PAGE_VIEWS[view];
        return (
          resolvePhaseWorkflow(entry.phase, null).at(-1)?.id === entry.stepId
        );
      },
    );
    expect(host).toContain("if (gateStepPageActive)");
    expect(host).toContain("PHASE_STEP_PAGES[initialStepView]");
    const mounted = new Set<StepPageView>([
      ...(dedicatedMounts as StepPageView[]),
      ...gateViews,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ]);
    const implemented = new Set<StepPageView>([
      ...EXISTING_STEP_PAGE_VIEWS,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ]);
    expect([...implemented].sort()).toEqual([...mounted].sort());
    expect([...implemented]).toContain("rom-estimate");
    expect(gateViews).toEqual(
      expect.arrayContaining([
        "p0-approve",
        "p1-charter-gate",
        "p2-gate",
        "gate",
        "p4-gate",
        "p5-handoff",
      ]),
    );
  });
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

  it("lands both completed P4 and P5 page sets on their first open step", () => {
    const implementedViews = [
      ...EXISTING_STEP_PAGE_VIEWS,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ];
    for (const [phase, expectedView] of [
      [4, "p4-milestones"],
      [5, "p5-owners"],
    ] as const) {
      expect(
        resolvePhaseStepPageLanding({
          ...base,
          phase,
          implementedViews,
          doneByStep: {},
        }),
      ).toBe(`/strategic-moves/move-1/phase/${phase}?step=${expectedView}`);
    }
  });

  it("lands P2 on its first open step while the unlinked legacy hatch stays available", () => {
    const implementedViews = [
      ...EXISTING_STEP_PAGE_VIEWS,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ];
    expect(
      resolvePhaseStepPageLanding({
        ...base,
        phase: 2,
        implementedViews,
        doneByStep: { "P2.1": true },
      }),
    ).toBe("/strategic-moves/move-1/phase/2?step=p2-baseline");
    expect(
      resolvePhaseStepPageLanding({
        ...base,
        phase: 2,
        implementedViews,
        doneByStep: { "P2.1": true },
        legacy: true,
      }),
    ).toBeNull();
    expect(implementedViews).toEqual(
      expect.arrayContaining([
        "p2-evidence-plan",
        "p2-baseline",
        "p2-validate",
      ]),
    );
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
    expect(phaseStepPageHref("move-1", 1, "P1.5", [], [])).toBe(
      "/strategic-moves/move-1/phase/1",
    );
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

  it("redirects a bare reachable phase on the server and preserves explicit surfaces", () => {
    const input = {
      moveId: "move-1",
      phase: 0,
      currentPhase: 3,
      implementedViews: p0Views,
      enabled: true,
      searchParams: {},
    };
    expect(resolveBarePhaseStepPageLanding(input)).toBe(
      "/strategic-moves/move-1/phase/0?step=p0-signal",
    );
    for (const searchParams of [
      { legacy: "1" },
      { step: "p0-value" },
      { workspace: "intelligence" },
      { section: "business_trigger" },
      { focus: "gate" },
      { blockedPhase: "1" },
    ]) {
      expect(
        resolveBarePhaseStepPageLanding({ ...input, searchParams }),
      ).toBeNull();
    }
    expect(
      resolveBarePhaseStepPageLanding({ ...input, currentPhase: 0, phase: 1 }),
    ).toBeNull();
  });

  it("leaves flag-off routing alone", () => {
    expect(resolvePhaseStepPageLanding({ ...base, enabled: false })).toBeNull();
    expect(
      resolvePhaseStepPageLanding({
        ...base,
        phase: 2,
        implementedViews: [
          ...EXISTING_STEP_PAGE_VIEWS,
          ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
        ],
        enabled: false,
      }),
    ).toBeNull();
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

  it("derives every gate view and includes all mounted P0/P1 pages in both directions", () => {
    const gates = (Object.keys(STEP_PAGE_VIEWS) as StepPageView[]).filter(
      (view) => {
        const entry = STEP_PAGE_VIEWS[view];
        return (
          resolvePhaseWorkflow(entry.phase, null).at(-1)?.id === entry.stepId
        );
      },
    );
    expect(gates).toEqual(
      expect.arrayContaining([
        "p0-approve",
        "p1-charter-gate",
        "gate",
        "p4-gate",
        "p5-handoff",
      ]),
    );
    for (const gate of gates) expect(EXISTING_STEP_PAGE_VIEWS).toContain(gate);
    const host = readFileSync(
      join(
        process.cwd(),
        "src/components/strategic-moves/MovesPhaseStandaloneClient.tsx",
      ),
      "utf8",
    );
    expect(host).toMatch(/if \(gateStepPageActive\)[\s\S]*?<GateReadinessStep/);
    expect(host).toContain("PHASE_STEP_PAGES[initialStepView]");
    const direct = [
      "root-causes",
      "root-cause-design",
      "architecture-options",
      "operating-adoption",
      "rom-estimate",
    ] as const;
    for (const view of direct) {
      expect(host).toContain(`initialStepView === "${view}"`);
      expect(EXISTING_STEP_PAGE_VIEWS).toContain(view);
    }
    expect(host).toMatch(
      /if \(romEstimateStepPageActive\)[\s\S]*?<RomEstimateStep/,
    );
    const mounted = new Set<StepPageView>([
      ...direct,
      ...gates,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ]);
    const implemented = new Set<StepPageView>([
      ...EXISTING_STEP_PAGE_VIEWS,
      ...(Object.keys(PHASE_STEP_PAGES) as StepPageView[]),
    ]);
    expect([...implemented].sort()).toEqual([...mounted].sort());
    for (const view of implemented) expect(STEP_PAGE_VIEWS[view]).toBeDefined();
  });
});
