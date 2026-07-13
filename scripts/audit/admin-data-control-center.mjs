#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${message}`);
  }
}

const requiredFiles = [
  "src/lib/admin/setup-control.ts",
  "src/app/api/admin/setup-control/route.ts",
  "src/components/admin/AdminSetupExperience.tsx",
  "reports/admin-setup-control/airline-demo/setup-control.json",
  "reports/admin-setup-control/airline-demo/setup-control-summary.md",
  "reports/admin-setup-control/admin-pr2-overview-readout.md",
  "docs/architecture/admin-data-control-center.md",
  "docs/releases/records/2026-07-12-admin-setup-control.md",
  "docs/releases/records/2026-07-12-admin-overview-setup-control.md",
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} exists`);
}

const setupControl = read("src/lib/admin/setup-control.ts");
const route = read("src/app/api/admin/setup-control/route.ts");
const adminUi = read("src/components/admin/AdminSetupExperience.tsx");
const csvRoute = read("src/app/api/admin/context-layer/csv-upload/route.ts");
const bulkRoute = read("src/app/api/admin/context-layer/bulk-upload/route.ts");
const loaderCommitRoute = read("src/app/api/admin/context-layer/loader/commit/route.ts");
const triageRoute = read("src/app/api/admin/context-layer/triage/[id]/route.ts");
const proof = JSON.parse(
  read("reports/admin-setup-control/airline-demo/setup-control.json"),
);

const requiredSections = [
  "tenant",
  "activeTenantAccess",
  "candidateTenantDataVersion",
  "uploadState",
  "evidenceRegistry",
  "canonicalFacts",
  "relationshipGraph",
  "derivedIntelligence",
  "moduleReadiness",
  "promotionControl",
  "guardrails",
  "sourceOfTruth",
];

for (const section of requiredSections) {
  assert(
    setupControl.includes(section) && route.includes("buildAdminSetupControlReadModel"),
    `setup-control includes ${section}`,
  );
  assert(proof[section] !== undefined, `proof JSON includes ${section}`);
}

assert(
  proof.guardrails.productionTenantDataWritten === false,
  "proof says productionTenantDataWritten=false",
);
assert(
  proof.guardrails.activeTenantAccessLayerUpdated === false,
  "proof says activeTenantAccessLayerUpdated=false",
);
assert(proof.guardrails.candidatePromoted === false, "proof says candidatePromoted=false");
assert(
  proof.guardrails.candidateReadByDefault === false,
  "proof says candidateReadByDefault=false",
);
assert(
  proof.candidateTenantDataVersion.promotionEnabled === false,
  "proof says candidate promotion is disabled",
);
assert(
  proof.moduleReadiness.home.status !== "ready",
  "Home is not marked ready solely because files exist",
);

for (const [label, source] of [
  ["csv upload route", csvRoute],
  ["bulk upload route", bulkRoute],
  ["loader commit route", loaderCommitRoute],
  ["triage route", triageRoute],
]) {
  assert(
    source.includes("legacyControlledImport") &&
      source.includes("LEGACY_CONTROLLED_IMPORT_WARNING"),
    `${label} labels legacy controlled import`,
  );
}

assert(
  adminUi.includes("Data control status") &&
    adminUi.includes("Candidate runway is not active yet"),
  "Admin overview includes compact setup-control status panel",
);
assert(
  adminUi.includes("Tenant setup and data control") &&
    adminUi.includes("Tenant data control center") &&
    adminUi.includes("Uploaded is not active. Candidate is not promoted."),
  "Admin overview is redesigned around setup-control truth split",
);
assert(
  adminUi.includes("Module readiness") &&
    adminUi.includes("No module becomes ready just because files were uploaded"),
  "Admin overview exposes module readiness without greenwashing uploaded files",
);
assert(
  adminUi.includes("Production writes: no") &&
    adminUi.includes("Active access changed: no") &&
    adminUi.includes("Runtime behavior changed: no"),
  "Admin overview shows production/write/runtime guardrails",
);

if (process.exitCode) {
  console.error("Admin data-control-center audit failed.");
  process.exit(process.exitCode);
}

console.log("Admin data-control-center audit passed.");
