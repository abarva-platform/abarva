#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const helperPath = path.join(root, "src/lib/programs/move-context-extract.ts");
const routePath = path.join(root, "src/app/api/v1/deliverables/generate-phase/route.ts");

const helper = fs.readFileSync(helperPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

const checks = [
  {
    name: "active mode requires agent_ready filter",
    pass: helper.includes("agent_readiness_status eq 'agent_ready'"),
  },
  {
    name: "candidate preview is not read by default",
    pass:
      helper.includes("Never read candidate data by default") &&
      helper.includes("candidateReadByDefault: false") &&
      route.includes("x-abarva-candidate-preview-mode") &&
      route.includes("acknowledgedNotActiveRuntimeTruth"),
  },
  {
    name: "suggested context is not written as generation evidence",
    pass:
      helper.includes("suggestedContextUsedForGeneration: false") &&
      helper.includes("if (attachedEvidenceItems.length > 0)") &&
      helper.includes("recordEvidence"),
  },
  {
    name: "existing extracts are not silently overwritten",
    pass:
      helper.includes("skipped_existing") &&
      helper.includes("Existing current Move Context Extract found"),
  },
  {
    name: "no raw filesystem input read by extractor",
    pass: !/\bfs\b|readFile|createReadStream/.test(helper),
  },
];

const failures = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failures.length > 0) {
  console.error(`moves-context-extract audit failed: ${failures.length} check(s) failed.`);
  process.exit(1);
}
