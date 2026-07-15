import fs from "node:fs";
import path from "node:path";

const summaryPath = path.join("reports/tower-v3-runtime-wiring", "summary.json");
const contextPackPath = path.join("reports/tower-v3-runtime-wiring", "context-pack-used.json");

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing_required_proof_artifact:${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

interface RuntimeSummary {
  contextPackMode: string;
  contextPackTruthStatus: string;
  outcomeProofAllowed: boolean;
  cioTowerFallback: string;
  acceptance: Record<string, boolean>;
}

interface ContextPackUsed {
  sourceOfTruthPath: string;
  projectionPath: string;
  projectionStatus: string;
}

function main(): void {
  const summary = readJson<RuntimeSummary>(summaryPath);
  const contextPack = readJson<ContextPackUsed>(contextPackPath);
  const failures: string[] = [];

  if (summary.contextPackMode !== "active") failures.push("context_pack_not_active_mode");
  if (summary.contextPackTruthStatus !== "active") failures.push("context_pack_not_active_truth_status");
  if (summary.outcomeProofAllowed) failures.push("unsupported_outcome_proof_allowed");
  if (!/bridge-only diagnostic\/fallback/.test(summary.cioTowerFallback)) {
    failures.push("cio_tower_not_bridge_only_fallback");
  }
  if (contextPack.sourceOfTruthPath !== "v3_enterprise_context_layer") {
    failures.push("context_pack_not_v3_enterprise_context_layer");
  }
  if (contextPack.projectionPath !== "path_a_derived_projection") {
    failures.push("projection_path_not_path_a");
  }
  for (const [check, passed] of Object.entries(summary.acceptance)) {
    if (!passed) failures.push(`acceptance_failed:${check}`);
  }

  if (failures.length > 0) {
    throw new Error(`tower_v3_source_of_truth_alignment_failed:${failures.join(",")}`);
  }
  console.log("Tower v3 source-of-truth alignment passed.");
}

main();
