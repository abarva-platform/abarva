import {
  emptyP4RoadmapPlan,
  isP4RoadmapPlanComplete,
  newP4RoadmapMilestone,
  p4RoadmapPlanGateText,
  p4RoadmapPlanIssues,
  p4RoadmapPlanText,
  parseP4RoadmapPlan,
  serializeP4RoadmapPlan,
  type P4RoadmapPlan,
} from "@/lib/programs/p4-roadmap-plan";
import {
  captureValueGateText,
  captureValueText,
} from "@/lib/programs/structured-capture-text";
import {
  phaseStepRecordSections,
  resolvePhaseWorkflow,
} from "@/lib/programs/phase-workflow-registry";

function plan(): P4RoadmapPlan {
  return {
    ...emptyP4RoadmapPlan(),
    milestones: [
      {
        ...newP4RoadmapMilestone("m1"),
        name: "Agree input scope",
        workstream: "Source readiness",
        ownerRole: "Data owner",
        plannedWindow: "R1 opening week",
        timingBasis: "Approved ROM R1 [A:T1]",
        dependencyNotes: "First decision; no predecessor",
        dependenciesReviewed: true,
        reviewed: true,
      },
      {
        ...newP4RoadmapMilestone("m2"),
        name: "Approve validation design",
        workstream: "Validation",
        ownerRole: "Validation lead",
        plannedWindow: "R1 second week",
        timingBasis: "Approved ROM R1 [A:T2]",
        dependsOn: ["m1"],
        dependencyNotes: "Uses the agreed input scope",
        dependenciesReviewed: true,
        reviewed: true,
      },
    ],
  };
}

describe("P4 reviewed roadmap plan", () => {
  it("round trips stable identities, workstreams, owner roles, timing sources and dependency IDs", () => {
    const value = plan();
    expect(parseP4RoadmapPlan(serializeP4RoadmapPlan(value))).toEqual(value);
    expect(isP4RoadmapPlanComplete(value)).toBe(true);
    expect(p4RoadmapPlanIssues(value)).toEqual([]);
  });

  it.each([
    undefined,
    "",
    "prose",
    "{}",
    '{"kind":"p4_roadmap_plan","version":2,"milestones":[]}',
    JSON.stringify({
      ...plan(),
      milestones: [{ ...plan().milestones[0], dependsOn: [7] }],
    }),
    JSON.stringify({
      ...plan(),
      milestones: [{ ...plan().milestones[0], reviewed: "yes" }],
    }),
  ])("refuses malformed or unversioned record %s", (raw) => {
    expect(parseP4RoadmapPlan(raw)).toBeNull();
  });

  it("holds empty and incomplete records", () => {
    expect(isP4RoadmapPlanComplete(null)).toBe(false);
    expect(isP4RoadmapPlanComplete(emptyP4RoadmapPlan())).toBe(false);
    const value = {
      ...emptyP4RoadmapPlan(),
      milestones: [newP4RoadmapMilestone("m1")],
    };
    expect(parseP4RoadmapPlan(serializeP4RoadmapPlan(value))).toEqual(value);
    expect(isP4RoadmapPlanComplete(value)).toBe(false);
  });

  it.each([
    "name",
    "workstream",
    "ownerRole",
    "plannedWindow",
    "timingBasis",
    "dependencyNotes",
  ] as const)("holds the plan without %s", (key) => {
    const value = plan();
    value.milestones[0][key] = "  ";
    expect(isP4RoadmapPlanComplete(value)).toBe(false);
    expect(p4RoadmapPlanText(value)).toBe("");
  });

  it.each(["reviewed", "dependenciesReviewed"] as const)(
    "requires explicit %s even with no predecessors",
    (key) => {
      const value = plan();
      value.milestones[0][key] = false;
      expect(isP4RoadmapPlanComplete(value)).toBe(false);
      expect(p4RoadmapPlanGateText(value)).toBe("");
    },
  );

  it.each([{ ids: ["m2"] }, { ids: ["outside"] }, { ids: ["m1", "m1"] }])(
    "holds self, foreign or duplicate predecessors $ids",
    ({ ids }) => {
      const value = plan();
      value.milestones[1].dependsOn = ids;
      expect(isP4RoadmapPlanComplete(value)).toBe(false);
      expect(p4RoadmapPlanIssues(value).join(" ")).toMatch(
        /distinct dependencies/,
      );
    },
  );

  it("detects indirect dependency cycles and duplicate identities", () => {
    const value = plan();
    value.milestones.push({
      ...value.milestones[0],
      id: "m3",
      name: "Release review",
      dependsOn: ["m2"],
    });
    value.milestones[0].dependsOn = ["m3"];
    expect(p4RoadmapPlanIssues(value)).toContain(
      "The dependencies form a cycle. Correct the sequence before saving the plan.",
    );
    value.milestones[2].id = "m1";
    expect(p4RoadmapPlanIssues(value)).toContain(
      "Milestone IDs must be unique.",
    );
  });

  it("renders reviewed source words for generation and only team words for phrase checks", () => {
    const value = plan();
    const raw = serializeP4RoadmapPlan(value);
    const text = captureValueText("p4_roadmap_plan", raw);
    expect(text).toContain("Milestone [m2]: Approve validation design");
    expect(text).toContain("Owner role: Validation lead");
    expect(text).toContain("Timing source: Approved ROM R1 [A:T2]");
    expect(text).toContain("Depends on: Agree input scope");
    const gate = captureValueGateText("p4_roadmap_plan", raw);
    expect(gate).toContain("Uses the agreed input scope");
    expect(gate).not.toMatch(/Milestone|Depends on|ownerRole|m1|reviewed|kind/);
    expect(captureValueText("p4_roadmap_plan", "malformed milestone")).toBe("");
    expect(captureValueGateText("p4_roadmap_plan", "malformed milestone")).toBe(
      "",
    );
    value.milestones[0].reviewed = false;
    expect(
      captureValueText("p4_roadmap_plan", serializeP4RoadmapPlan(value)),
    ).toBe("");
    expect(
      captureValueGateText("p4_roadmap_plan", serializeP4RoadmapPlan(value)),
    ).toBe("");
  });

  it("declares the record for P4.1 without making it a capture question", () => {
    expect(phaseStepRecordSections(4)).toEqual([
      expect.objectContaining({ key: "p4_roadmap_plan", stepId: "P4.1" }),
    ]);
    const step = resolvePhaseWorkflow(4, null)[0];
    expect(step.recordKeys).toEqual(["p4_roadmap_plan"]);
    expect(step.sectionKeys).toEqual(["roadmap_sequencing"]);
  });
});
