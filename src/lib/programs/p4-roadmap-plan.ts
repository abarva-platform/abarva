export const P4_ROADMAP_PLAN_KEY = "p4_roadmap_plan";

export interface P4RoadmapMilestone {
  id: string;
  name: string;
  workstream: string;
  ownerRole: string;
  plannedWindow: string;
  timingBasis: string;
  dependsOn: string[];
  dependencyNotes: string;
  dependenciesReviewed: boolean;
  reviewed: boolean;
}

export interface P4RoadmapPlan {
  kind: typeof P4_ROADMAP_PLAN_KEY;
  version: 1;
  milestones: P4RoadmapMilestone[];
}

export function emptyP4RoadmapPlan(): P4RoadmapPlan {
  return { kind: P4_ROADMAP_PLAN_KEY, version: 1, milestones: [] };
}

export function newP4RoadmapMilestone(id: string): P4RoadmapMilestone {
  return {
    id,
    name: "",
    workstream: "",
    ownerRole: "",
    plannedWindow: "",
    timingBasis: "",
    dependsOn: [],
    dependencyNotes: "",
    dependenciesReviewed: false,
    reviewed: false,
  };
}

const TEXT_FIELDS = [
  "id",
  "name",
  "workstream",
  "ownerRole",
  "plannedWindow",
  "timingBasis",
  "dependencyNotes",
] as const;

/** Incomplete rows remain editable; malformed records never become a plan. */
export function parseP4RoadmapPlan(
  raw: string | undefined,
): P4RoadmapPlan | null {
  try {
    const value: unknown = JSON.parse(raw ?? "");
    if (!value || typeof value !== "object") return null;
    const plan = value as Record<string, unknown>;
    if (
      plan.kind !== P4_ROADMAP_PLAN_KEY ||
      plan.version !== 1 ||
      !Array.isArray(plan.milestones) ||
      plan.milestones.length > 100
    )
      return null;
    const milestones: P4RoadmapMilestone[] = [];
    for (const value of plan.milestones) {
      if (!value || typeof value !== "object") return null;
      const row = value as Record<string, unknown>;
      if (
        TEXT_FIELDS.some((key) => typeof row[key] !== "string") ||
        !Array.isArray(row.dependsOn) ||
        row.dependsOn.some((id) => typeof id !== "string") ||
        typeof row.dependenciesReviewed !== "boolean" ||
        typeof row.reviewed !== "boolean"
      )
        return null;
      milestones.push({
        id: row.id as string,
        name: row.name as string,
        workstream: row.workstream as string,
        ownerRole: row.ownerRole as string,
        plannedWindow: row.plannedWindow as string,
        timingBasis: row.timingBasis as string,
        dependsOn: [...row.dependsOn] as string[],
        dependencyNotes: row.dependencyNotes as string,
        dependenciesReviewed: row.dependenciesReviewed,
        reviewed: row.reviewed,
      });
    }
    return { kind: P4_ROADMAP_PLAN_KEY, version: 1, milestones };
  } catch {
    return null;
  }
}

export function p4RoadmapPlanIssues(plan: P4RoadmapPlan): string[] {
  const issues: string[] = [];
  if (plan.milestones.length === 0)
    issues.push("Add at least one critical milestone.");
  const ids = new Set(plan.milestones.map((row) => row.id));
  if (ids.size !== plan.milestones.length)
    issues.push("Milestone IDs must be unique.");
  for (const [index, row] of plan.milestones.entries()) {
    const label = row.name.trim() || `Milestone ${index + 1}`;
    if (TEXT_FIELDS.some((key) => !row[key].trim())) {
      issues.push(
        `${label}: record its name, workstream, owner role, planned window, timing source and dependency notes.`,
      );
    }
    if (!row.dependenciesReviewed)
      issues.push(
        `${label}: confirm the dependency list, including when none apply.`,
      );
    if (!row.reviewed)
      issues.push(`${label}: review the milestone before saving the plan.`);
    if (
      row.dependsOn.includes(row.id) ||
      row.dependsOn.some((id) => !ids.has(id)) ||
      new Set(row.dependsOn).size !== row.dependsOn.length
    )
      issues.push(
        `${label}: choose distinct dependencies from the other milestones in this plan.`,
      );
  }
  const byId = new Map(plan.milestones.map((row) => [row.id, row]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cyclic = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (byId.has(dependency) && cyclic(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if (plan.milestones.some((row) => cyclic(row.id))) {
    issues.push(
      "The dependencies form a cycle. Correct the sequence before saving the plan.",
    );
  }
  return issues;
}

export function isP4RoadmapPlanComplete(plan: P4RoadmapPlan | null): boolean {
  return plan !== null && p4RoadmapPlanIssues(plan).length === 0;
}

export function serializeP4RoadmapPlan(plan: P4RoadmapPlan): string {
  return JSON.stringify(plan);
}

/** Generation sees reviewed planning words and explicit timing provenance. */
export function p4RoadmapPlanText(plan: P4RoadmapPlan): string {
  if (!isP4RoadmapPlanComplete(plan)) return "";
  const byId = new Map(plan.milestones.map((row) => [row.id, row.name]));
  return plan.milestones
    .map((row) =>
      [
        `Milestone [${row.id}]: ${row.name}`,
        `Workstream: ${row.workstream}`,
        `Owner role: ${row.ownerRole}`,
        `Planned window: ${row.plannedWindow}`,
        `Timing source: ${row.timingBasis}`,
        `Depends on: ${row.dependsOn.length ? row.dependsOn.map((id) => byId.get(id)).join("; ") : "None, reviewed"}`,
        `Dependency notes: ${row.dependencyNotes}`,
      ].join("\n"),
    )
    .join("\n\n");
}

/** Phrase checks get only the team's words, without schema labels or IDs. */
export function p4RoadmapPlanGateText(plan: P4RoadmapPlan): string {
  if (!isP4RoadmapPlanComplete(plan)) return "";
  return plan.milestones
    .flatMap((row) => [
      row.name,
      row.workstream,
      row.ownerRole,
      row.plannedWindow,
      row.timingBasis,
      row.dependencyNotes,
    ])
    .join("\n");
}
