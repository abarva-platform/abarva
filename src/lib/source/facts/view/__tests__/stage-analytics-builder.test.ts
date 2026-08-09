import { liveStageScaffoldFor } from "../stage-analytics-builder";

describe("liveStageScaffoldFor", () => {
  it("uses Pricing-specific tasks instead of Scope intake tasks", () => {
    const scaffold = liveStageScaffoldFor("pricing");

    expect(scaffold.stageKey).toBe("pricing");
    expect(scaffold.tasks.map((task) => task.title)).toEqual([
      "Confirm normalized supplier pricing",
    ]);
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Sponsor commitment",
    );
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Provide the volumetrics",
    );
  });

  it("uses Executive Decision-specific tasks instead of Scope intake tasks", () => {
    const scaffold = liveStageScaffoldFor("executive_decision");

    expect(scaffold.stageKey).toBe("executive_decision");
    expect(scaffold.tasks.map((task) => task.title)).toEqual([
      "Confirm executive recommendation packet",
    ]);
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Sponsor commitment",
    );
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Provide the volumetrics",
    );
  });

  it("uses Transition-specific tasks instead of Scope intake tasks", () => {
    const scaffold = liveStageScaffoldFor("transition");

    expect(scaffold.stageKey).toBe("transition");
    expect(scaffold.tasks.map((task) => task.title)).toEqual([
      "Confirm transition go-live readiness",
    ]);
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Sponsor commitment",
    );
    expect(scaffold.tasks.map((task) => task.title)).not.toContain(
      "Provide the volumetrics",
    );
  });
});
