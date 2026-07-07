import {
  PERSONA_ARMY_DURATION_HOURS,
  PERSONA_ARMY_JOBS,
  buildPersonaArmyPlan,
  summarizePersonaArmyCoverage,
} from "../persona-army-harness";

describe("persona army harness", () => {
  it("defines the required 10 persona agents", () => {
    expect(PERSONA_ARMY_JOBS).toHaveLength(10);
    expect(new Set(PERSONA_ARMY_JOBS.map((job) => job.id)).size).toBe(10);
  });

  it("covers the core agents, tenants, and adversarial risks", () => {
    const coverage = summarizePersonaArmyCoverage();

    expect(coverage).toMatchObject({
      personaCount: 10,
      agentCount: 3,
      tenantCount: 3,
      riskCount: 5,
      durationHours: 24,
      expectedRuns: 240,
      scheduledRunCount: 240,
    });
  });

  it("schedules each persona once per hour for 24 hours", () => {
    const plan = buildPersonaArmyPlan();

    for (let hour = 0; hour < PERSONA_ARMY_DURATION_HOURS; hour += 1) {
      const slots = plan.schedule.filter((slot) => slot.hour === hour);

      expect(slots).toHaveLength(10);
      expect(slots.map((slot) => slot.minute)).toEqual([
        0, 6, 12, 18, 24, 30, 36, 42, 48, 54,
      ]);
    }
  });

  it("anchors every persona run to a golden quality fixture", () => {
    const plan = buildPersonaArmyPlan();

    expect(
      plan.personas.every((job) => job.goldenFixtureId.includes("-")),
    ).toBe(true);
    expect(
      plan.personas.some(
        (job) =>
          job.goldenFixtureId === "atlas-adversarial-current-affairs-scope",
      ),
    ).toBe(true);
    expect(
      plan.personas.some(
        (job) => job.goldenFixtureId === "steward-adversarial-sensitive-upload",
      ),
    ).toBe(true);
  });
});
