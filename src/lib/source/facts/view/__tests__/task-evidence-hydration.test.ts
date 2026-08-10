// Hydrating the task checklist done-state from ALREADY-PERSISTED evidence: a
// stage view whose event HAS a template's facts must mark that upload task
// complete on build (so the "N of M complete" counter is correct on reload); a
// task with no persisted evidence must stay not-complete; and the honest rule —
// done only because evidence reached a usable, persisted state — must hold.

import {
  hydrateTaskEvidenceState,
  templateFactsPresent,
} from "../task-evidence-hydration";
import { templateFactMapByCode } from "../../template-fact-map";
import type { StageTaskView } from "@/components/source/canvas/analytics/view-model";

const VOLUMETRICS_TASK: StageTaskView = {
  id: "scope.volumetrics",
  title: "Provide the volumetrics",
  subtitle: "Ticket history",
  type: "provide",
  state: "todo",
  guide: "Upload your ticket history.",
  cta: "Confirm volumetrics",
  factTemplateCode: "VOLUMETRICS_V1",
};

const APP_INVENTORY_TASK: StageTaskView = {
  id: "scope.app-inventory",
  title: "Provide the application inventory",
  subtitle: "Run cost per app",
  type: "provide",
  state: "todo",
  guide: "Upload your application inventory.",
  cta: "Confirm inventory",
  factTemplateCode: "APP_INVENTORY_V1",
};

const SPONSOR_LETTER_TASK: StageTaskView = {
  id: "scope.sponsor",
  title: "Sponsor commitment",
  subtitle: "Signed commitment letter",
  type: "provide",
  state: "todo",
  guide: "Upload the signed letter.",
  cta: "Upload letter",
  // No factTemplateCode → its evidence is a stored artifact.
};

const CONFIRM_TASK: StageTaskView = {
  id: "scope.apps",
  title: "Confirm the applications in scope",
  subtitle: "147 apps",
  type: "confirm",
  state: "todo",
  guide: "Review and accept.",
  cta: "Accept inventory",
};

const EXECUTIVE_DECISION_TASK: StageTaskView = {
  id: "executive-decision.recommendation-packet",
  title: "Confirm executive recommendation packet",
  subtitle: "Recommendation · value case · risk conditions",
  type: "decide",
  state: "todo",
  guide: "Review and confirm the decision packet.",
  cta: "Confirm recommendation packet",
};

/** One fact key the VOLUMETRICS_V1 template binds (proves ingestion). */
function volumetricsFactKey(): string {
  const map = templateFactMapByCode("VOLUMETRICS_V1");
  if (!map || map.columns.length === 0) {
    throw new Error("VOLUMETRICS_V1 must bind at least one column");
  }
  return map.columns[0].factKey;
}

describe("templateFactsPresent", () => {
  it("is true when any of the template column fact keys is present", () => {
    const inputs = { [volumetricsFactKey()]: 4200 };
    expect(templateFactsPresent("VOLUMETRICS_V1", inputs)).toBe(true);
  });

  it("is false when none of the template column fact keys is present", () => {
    expect(templateFactsPresent("VOLUMETRICS_V1", {})).toBe(false);
  });

  it("is false for an unknown template code (never fabricates done)", () => {
    const inputs = { [volumetricsFactKey()]: 4200 };
    expect(templateFactsPresent("NOT_A_TEMPLATE", inputs)).toBe(false);
  });

  it("ignores a non-finite fact value (bad cell never marks done)", () => {
    const inputs = { [volumetricsFactKey()]: Number.NaN };
    expect(templateFactsPresent("VOLUMETRICS_V1", inputs)).toBe(false);
  });
});

describe("hydrateTaskEvidenceState", () => {
  it("marks a template task complete when the event HAS its facts", () => {
    const inputs = { [volumetricsFactKey()]: 4200 };
    const hydrated = hydrateTaskEvidenceState({
      tasks: [VOLUMETRICS_TASK, APP_INVENTORY_TASK],
      factInputs: inputs,
      stageKey: "scope",
    });
    const volumetrics = hydrated.find((t) => t.id === "scope.volumetrics");
    const appInventory = hydrated.find((t) => t.id === "scope.app-inventory");
    // The volumetrics facts landed → complete from persisted evidence.
    expect(volumetrics?.evidenceComplete).toBe(true);
    // The app-inventory facts did NOT land → stays not-complete (no fake done).
    expect(appInventory?.evidenceComplete).toBeUndefined();
  });

  it("the completed-count derived from hydration reflects persisted evidence", () => {
    const inputs = { [volumetricsFactKey()]: 4200 };
    const hydrated = hydrateTaskEvidenceState({
      tasks: [VOLUMETRICS_TASK, APP_INVENTORY_TASK, CONFIRM_TASK],
      factInputs: inputs,
      stageKey: "scope",
    });
    const done = hydrated.filter(
      (t) => t.state === "done" || t.evidenceComplete === true,
    ).length;
    // Only the volumetrics task is evidence-complete: 1 of 3.
    expect(done).toBe(1);
  });

  it("falls back to the canonical task id when live payload omits factTemplateCode", () => {
    const inputs = { [volumetricsFactKey()]: 4200 };
    const hydrated = hydrateTaskEvidenceState({
      tasks: [{ ...VOLUMETRICS_TASK, factTemplateCode: undefined }],
      factInputs: inputs,
      stageKey: "scope",
    });
    expect(hydrated[0].evidenceComplete).toBe(true);
  });

  it("leaves a task with no persisted evidence not-complete", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [VOLUMETRICS_TASK],
      factInputs: {},
      stageKey: "scope",
    });
    expect(hydrated[0].evidenceComplete).toBeUndefined();
  });

  it("marks a template-less provide task complete from a stored artifact", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [SPONSOR_LETTER_TASK],
      factInputs: {},
      artifacts: [{ stageKey: "scope" }],
      stageKey: "scope",
    });
    expect(hydrated[0].evidenceComplete).toBe(true);
  });

  it("does not mark a template-less provide task complete when the artifact is for another stage", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [SPONSOR_LETTER_TASK],
      factInputs: {},
      artifacts: [{ stageKey: "rfp" }],
      stageKey: "scope",
    });
    expect(hydrated[0].evidenceComplete).toBeUndefined();
  });

  it("does not stamp confirm/decide tasks without mapped persisted evidence", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [CONFIRM_TASK],
      factInputs: { [volumetricsFactKey()]: 4200 },
      artifacts: [{ stageKey: "scope" }],
      stageKey: "scope",
    });
    expect(hydrated[0].evidenceComplete).toBeUndefined();
  });

  it("marks a mapped decide task complete when governed evidence meets minimum state", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [EXECUTIVE_DECISION_TASK],
      factInputs: {},
      evidenceStates: [
        {
          requirementId: "EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT",
          currentState: "Available",
        },
      ],
      stageKey: "executive_decision",
    });
    expect(hydrated[0].evidenceComplete).toBe(true);
  });

  it("does not mark a mapped decide task complete when evidence is stale", () => {
    const hydrated = hydrateTaskEvidenceState({
      tasks: [EXECUTIVE_DECISION_TASK],
      factInputs: {},
      evidenceStates: [
        {
          requirementId: "EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT",
          currentState: "Stale",
        },
      ],
      stageKey: "executive_decision",
    });
    expect(hydrated[0].evidenceComplete).toBeUndefined();
  });

  it("returns the same tasks in the same order", () => {
    const tasks = [VOLUMETRICS_TASK, CONFIRM_TASK, APP_INVENTORY_TASK];
    const hydrated = hydrateTaskEvidenceState({
      tasks,
      factInputs: {},
      stageKey: "scope",
    });
    expect(hydrated.map((t) => t.id)).toEqual(tasks.map((t) => t.id));
  });
});
