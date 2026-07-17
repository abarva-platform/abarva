#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertIncludes(file, text, label) {
  const body = read(file);
  if (!body.includes(text)) {
    throw new Error(`${label} missing in ${file}: ${text}`);
  }
}

function assertNotIncludes(file, text, label) {
  const body = read(file);
  if (body.includes(text)) {
    throw new Error(`${label} still present in ${file}: ${text}`);
  }
}

assertIncludes(
  "src/lib/programs/current-state-doc-ingest.ts",
  "ensureEvidenceReviewForUploadedEvidence",
  "upload review lifecycle helper",
);
assertIncludes(
  "src/app/api/programs/workspace/[moveId]/upload/route.ts",
  "reviewStatus",
  "workspace upload review status response",
);
assertIncludes(
  "src/lib/programs/discovery/evidence-readiness.ts",
  "FROM program_evidence_reviews per",
  "readiness approved-review source",
);
assertIncludes(
  "src/lib/programs/discovery/evidence-readiness.ts",
  "per.decision = 'approved'",
  "readiness approved-only decision filter",
);
assertIncludes(
  "src/lib/deliverables/orchestrator/evidence-assembler.ts",
  "Do not fall back to raw program_evidence_items",
  "generation raw-upload bypass prevention",
);
assertNotIncludes(
  "src/lib/deliverables/orchestrator/evidence-assembler.ts",
  "Controlled canary/setup evidence can be committed directly",
  "legacy unreviewed evidence fallback",
);

console.log("PASS audit:moves-evidence-lifecycle");
