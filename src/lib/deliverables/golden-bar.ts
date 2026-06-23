// Golden-bar acceptance — the deterministic "does this artifact meet the bar?"
// check used by the QA gate at every slice. The bar is set by the manually
// generated decks in docs/build/golden-artifacts/. A generated artifact passes
// only if it is a real visual consulting artifact: rendered SVG/visuals, no
// `[DATA GAP]`, not prose-only, and (when a contract exists) the required
// exhibits are present.

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  visualContractFor,
  checkVisualArtifactContract,
} from "./visual-artifact-contract";

export interface GoldenBarResult {
  pass: boolean;
  svgCount: number;
  hasDataGap: boolean;
  proseOnly: boolean;
  missingVisuals: string[];
  missingTables: string[];
  reasons: string[];
}

/** Extract the visual/table "kinds" present in a rendered HTML artifact (heuristic). */
function extractExhibitKinds(html: string): { visuals: string[]; tables: string[] } {
  const lower = html.toLowerCase();
  const visualMarkers = [
    "conceptual",
    "logical",
    "physical",
    "current-state",
    "current state",
    "target-state",
    "data-flow",
    "data flow",
    "pattern",
    "roadmap",
    "timeline",
    "trajectory",
    "value tree",
    "stakeholder",
    "process map",
    "root-cause",
    "heatmap",
    "approach",
    "native",
  ];
  const tableMarkers = [
    "matrix",
    "scorecard",
    "baseline",
    "evidence",
    "traceability",
    "raci",
    "tradeoff",
    "decision record",
    "cost",
    "gap matrix",
    "options",
    "kpi",
  ];
  const visuals = visualMarkers.filter((m) => lower.includes(m));
  // a visual marker only "counts" if there's an actual diagram/svg/flow nearby
  const tables = tableMarkers.filter((m) => lower.includes(m));
  return { visuals, tables };
}

/** Score a rendered artifact HTML against the golden bar. */
export function meetsGoldenBar(
  html: string,
  artifactKey?: DeliverableKey,
): GoldenBarResult {
  const reasons: string[] = [];
  const svgCount = (html.match(/<svg/gi) ?? []).length;
  const hasDataGap = /\[?\s*data gap/i.test(html);
  const cssDiagram = /class="[^"]*(flow|diagram|arc|matrix|road|med|kgrid|traj)[^"]*"/i.test(html);
  const hasVisuals = svgCount > 0 || cssDiagram;
  const tableCount = (html.match(/<table|class="[^"]*(matrix|kgrid|scorecard|road)[^"]*"/gi) ?? []).length;
  const proseOnly = !hasVisuals && tableCount === 0;

  if (!hasVisuals) reasons.push("no rendered SVG/CSS diagrams (prose-only architecture fails)");
  if (hasDataGap) reasons.push("contains [DATA GAP] — context was not bound");
  if (proseOnly) reasons.push("prose-only — no visuals or tables");

  let missingVisuals: string[] = [];
  let missingTables: string[] = [];
  if (artifactKey && visualContractFor(artifactKey)) {
    const { visuals, tables } = extractExhibitKinds(html);
    const check = checkVisualArtifactContract(artifactKey, { visuals, tables });
    missingVisuals = check.missingVisuals;
    missingTables = check.missingTables;
    if (!check.pass)
      reasons.push(
        `missing required exhibits: ${[...missingVisuals, ...missingTables].join(", ")}`,
      );
  }

  const pass =
    hasVisuals &&
    !hasDataGap &&
    !proseOnly &&
    missingVisuals.length === 0 &&
    missingTables.length === 0;

  return { pass, svgCount, hasDataGap, proseOnly, missingVisuals, missingTables, reasons };
}
