// VisualArtifactContract — every deliverable is a VISUAL consulting artifact, not
// a prose memo. Claude decides the exact exhibit mix, but the prompt FORCES a
// visual-first standard and specifies minimum exhibits by deliverable type, and
// the quality gate checks they are present.

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

export type NarrativeDepth = "concise" | "standard" | "board-grade";

export interface VisualArtifactContract {
  artifact: DeliverableKey;
  /** Minimum diagrams/charts/maps the artifact must include. */
  requiredVisuals: ReadonlyArray<string>;
  /** Minimum tables/matrices the artifact must include. */
  requiredTables: ReadonlyArray<string>;
  minNarrativeDepth: NarrativeDepth;
}

/** The standard injected into EVERY artifact prompt — visual-first by default. */
export const VISUAL_ARTIFACT_STANDARD = `VISUAL ARTIFACT STANDARD
This is not a text-only document. Produce a board-grade consulting artifact.
For every major section, decide whether the content is best expressed as: narrative,
table, decision matrix, KPI scorecard, current-state diagram, future-state diagram,
data-flow diagram, workflow diagram, architecture diagram, roadmap/timeline,
operating model / RACI, risk heatmap, value tree, or dependency map.
Use visuals aggressively when they clarify the story. Do not wait to be asked.

Default rule: if a section contains comparison, sequence, flow, architecture,
ownership, dependencies, KPIs, evidence, or tradeoffs, render it visually as a
table, chart, matrix, or diagram (inline SVG / HTML), not as prose.`;

const CONTRACTS: Partial<Record<DeliverableKey, VisualArtifactContract>> = {
  charter: {
    artifact: "charter",
    requiredVisuals: ["value tree", "KPI scorecard", "stakeholder map"],
    requiredTables: ["scope boundary table", "proceed/hold/stop gate"],
    minNarrativeDepth: "standard",
  },
  discovery_report: {
    artifact: "discovery_report",
    requiredVisuals: [
      "current-state architecture diagram",
      "current-state data-flow diagram",
      "current-state process map",
      "root-cause map",
    ],
    requiredTables: ["gap matrix", "KPI baseline table", "evidence/source table"],
    minNarrativeDepth: "board-grade",
  },
  root_cause_worksheet: {
    artifact: "root_cause_worksheet",
    requiredVisuals: ["root-cause tree"],
    requiredTables: ["symptom-vs-cause table"],
    minNarrativeDepth: "standard",
  },
  solution_approach_options: {
    artifact: "solution_approach_options",
    requiredVisuals: ["approach arc / increments"],
    requiredTables: ["solution-options matrix", "tradeoff table", "recommendation scorecard"],
    minNarrativeDepth: "board-grade",
  },
  target_state_architecture: {
    artifact: "target_state_architecture",
    requiredVisuals: [
      "conceptual architecture diagram",
      "logical architecture diagram",
      "physical/deployment diagram",
      "integration / data-flow diagram",
      "native vs non-native service pattern",
    ],
    requiredTables: ["decision records / tradeoff table", "KPI-to-capability traceability"],
    minNarrativeDepth: "board-grade",
  },
  solution_design: {
    artifact: "solution_design",
    requiredVisuals: ["experience flow", "agent workflow", "data-flow diagram"],
    requiredTables: ["control checkpoints", "exception-handling table"],
    minNarrativeDepth: "board-grade",
  },
  execution_roadmap: {
    artifact: "execution_roadmap",
    requiredVisuals: ["3/6/9/12 roadmap timeline", "dependency map", "KPI trajectory"],
    requiredTables: ["workstream plan", "decision calendar"],
    minNarrativeDepth: "standard",
  },
  business_case: {
    artifact: "business_case",
    requiredVisuals: ["value/KPI trajectory"],
    requiredTables: ["cost/value table", "risk and readiness matrix"],
    minNarrativeDepth: "board-grade",
  },
  handoff_package: {
    artifact: "handoff_package",
    requiredVisuals: ["operating cadence", "Tower measurement map"],
    requiredTables: ["RACI"],
    minNarrativeDepth: "board-grade",
  },
};

export function visualContractFor(
  artifact: DeliverableKey,
): VisualArtifactContract | undefined {
  return CONTRACTS[artifact];
}

/** Render the per-artifact required-exhibits block for the prompt. */
export function renderVisualContractPrompt(contract: VisualArtifactContract): string {
  const v = contract.requiredVisuals.map((s) => `  - ${s}`).join("\n");
  const t = contract.requiredTables.map((s) => `  - ${s}`).join("\n");
  const tableRule =
    contract.requiredTables.length > 0
      ? `\nHard table rule: every Tables/matrices item above must be rendered as an actual <table>
element with a visible heading that uses the required exhibit name or a close singular/plural
variant. Do not satisfy a table requirement with bullets, cards, or prose.`
      : "";
  return `REQUIRED EXHIBITS for ${contract.artifact} (minimum — add more where they clarify):
Diagrams/charts:
${v}
Tables/matrices:
${t}
Narrative depth: ${contract.minNarrativeDepth}.
Use these required exhibit names, or close singular/plural variants of them, as visible section,
table, or figure headings so reviewers can verify the artifact contains them.${tableRule}`;
}

export interface VisualContractCheck {
  pass: boolean;
  missingVisuals: string[];
  missingTables: string[];
}

/**
 * Gate check: did the rendered artifact include the required visuals/tables?
 * `renderedVisuals`/`renderedTables` are the exhibit kinds the renderer reports.
 */
export function checkVisualArtifactContract(
  artifact: DeliverableKey,
  rendered: { visuals: ReadonlyArray<string>; tables: ReadonlyArray<string> },
): VisualContractCheck {
  const contract = visualContractFor(artifact);
  if (!contract) return { pass: true, missingVisuals: [], missingTables: [] };
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const has = (set: ReadonlyArray<string>, need: string) =>
    set.some((s) => norm(s).includes(norm(need)) || norm(need).includes(norm(s)));
  const missingVisuals = contract.requiredVisuals.filter((n) => !has(rendered.visuals, n));
  const missingTables = contract.requiredTables.filter((n) => !has(rendered.tables, n));
  return {
    pass: missingVisuals.length === 0 && missingTables.length === 0,
    missingVisuals,
    missingTables,
  };
}
