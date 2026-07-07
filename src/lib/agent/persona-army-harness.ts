export type PersonaArmyAgent = "atlas" | "nexus" | "steward";

export type PersonaArmyRisk =
  | "tenant_grounding"
  | "hallucination"
  | "no_auto_action"
  | "continuity"
  | "decision_quality";

export interface PersonaArmyJob {
  readonly id: string;
  readonly agent: PersonaArmyAgent;
  readonly tenant: string;
  readonly persona: string;
  readonly surface: string;
  readonly goldenFixtureId: string;
  readonly risk: PersonaArmyRisk;
}

export interface PersonaArmyScheduleSlot extends PersonaArmyJob {
  readonly hour: number;
  readonly minute: number;
  readonly runNumber: number;
}

export interface PersonaArmyPlan {
  readonly durationHours: number;
  readonly personas: readonly PersonaArmyJob[];
  readonly schedule: readonly PersonaArmyScheduleSlot[];
  readonly expectedRuns: number;
  readonly maxConcurrentPersonas: number;
}

export const PERSONA_ARMY_DURATION_HOURS = 24;
export const PERSONA_ARMY_MAX_CONCURRENT_PERSONAS = 10;

export const PERSONA_ARMY_JOBS: readonly PersonaArmyJob[] = [
  {
    id: "apex-cio-atlas-renewal",
    agent: "atlas",
    tenant: "apex-retail",
    persona: "cio",
    surface: "/tower",
    goldenFixtureId: "atlas-apex-renewal-clock",
    risk: "tenant_grounding",
  },
  {
    id: "apex-cfo-nexus-kill",
    agent: "nexus",
    tenant: "apex-retail",
    persona: "cfo",
    surface: "/strategic-moves",
    goldenFixtureId: "nexus-apex-kill-weak-move",
    risk: "decision_quality",
  },
  {
    id: "apex-cdo-nexus-boundary",
    agent: "nexus",
    tenant: "apex-retail",
    persona: "cdo",
    surface: "/strategic-moves/new",
    goldenFixtureId: "nexus-apex-merchandising-boundary",
    risk: "decision_quality",
  },
  {
    id: "apex-cio-atlas-no-delete",
    agent: "atlas",
    tenant: "apex-retail",
    persona: "cio",
    surface: "/tower",
    goldenFixtureId: "atlas-adversarial-delete-program",
    risk: "no_auto_action",
  },
  {
    id: "meridian-cdio-atlas-adoption",
    agent: "atlas",
    tenant: "meridian-health",
    persona: "cdio",
    surface: "/tower",
    goldenFixtureId: "atlas-meridian-adoption-gaps",
    risk: "tenant_grounding",
  },
  {
    id: "meridian-cdao-nexus-sepsis",
    agent: "nexus",
    tenant: "meridian-health",
    persona: "cdao",
    surface: "/strategic-moves",
    goldenFixtureId: "nexus-meridian-sepsis-gate",
    risk: "tenant_grounding",
  },
  {
    id: "meridian-cdio-nexus-recap",
    agent: "nexus",
    tenant: "meridian-health",
    persona: "cdio",
    surface: "/strategic-moves/new",
    goldenFixtureId: "nexus-continuity-p0-recap",
    risk: "continuity",
  },
  {
    id: "firstcapital-cio-atlas-model-risk",
    agent: "atlas",
    tenant: "first-capital",
    persona: "cio",
    surface: "/tower",
    goldenFixtureId: "atlas-first-model-risk",
    risk: "tenant_grounding",
  },
  {
    id: "firstcapital-cio-atlas-current-affairs",
    agent: "atlas",
    tenant: "first-capital",
    persona: "cio",
    surface: "/tower",
    goldenFixtureId: "atlas-adversarial-current-affairs-scope",
    risk: "hallucination",
  },
  {
    id: "meridian-cdio-steward-sensitive-upload",
    agent: "steward",
    tenant: "meridian-health",
    persona: "cdio",
    surface: "/admin/data-trust",
    goldenFixtureId: "steward-adversarial-sensitive-upload",
    risk: "no_auto_action",
  },
] as const;

export function buildPersonaArmyPlan(
  jobs: readonly PersonaArmyJob[] = PERSONA_ARMY_JOBS,
): PersonaArmyPlan {
  const schedule: PersonaArmyScheduleSlot[] = [];

  for (let hour = 0; hour < PERSONA_ARMY_DURATION_HOURS; hour += 1) {
    jobs.forEach((job, index) => {
      schedule.push({
        ...job,
        hour,
        minute: index * 6,
        runNumber: hour * jobs.length + index + 1,
      });
    });
  }

  return {
    durationHours: PERSONA_ARMY_DURATION_HOURS,
    personas: jobs,
    schedule,
    expectedRuns: PERSONA_ARMY_DURATION_HOURS * jobs.length,
    maxConcurrentPersonas: Math.min(
      PERSONA_ARMY_MAX_CONCURRENT_PERSONAS,
      jobs.length,
    ),
  };
}

export function summarizePersonaArmyCoverage(
  plan: PersonaArmyPlan = buildPersonaArmyPlan(),
) {
  return {
    personaCount: plan.personas.length,
    agentCount: new Set(plan.personas.map((job) => job.agent)).size,
    tenantCount: new Set(plan.personas.map((job) => job.tenant)).size,
    riskCount: new Set(plan.personas.map((job) => job.risk)).size,
    scheduledRunCount: plan.schedule.length,
    expectedRuns: plan.expectedRuns,
    durationHours: plan.durationHours,
  };
}
