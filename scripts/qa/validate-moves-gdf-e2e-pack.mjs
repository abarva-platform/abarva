#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PACKAGE = path.join(ROOT, "tests/fixtures/moves-governed-data-foundation-e2e");
const GOVERNANCE = path.join(
  ROOT,
  "docs/governance/dataset-manifests/nexus-moves-governed-data-foundation-e2e-synthetic-20261006.json",
);
export const REQUIRED_FAMILIES = [
  "data_governance_ownership",
  "semantic_layer_certification",
  "data_lineage_audit_trail",
  "data_quality_rules",
  "source_system_data_access",
  "platform_architecture_readiness",
  "master_identity_resolution",
  "privacy_security_controls",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function validatePackage(packageRoot = PACKAGE, governancePath = GOVERNANCE) {
  const errors = [];
  const root = path.resolve(packageRoot);
  let upload;
  let packageManifest;
  let governance;
  try {
    upload = readJson(path.join(root, "00_demo/upload_manifest.json"));
    packageManifest = readJson(path.join(root, "package_manifest.json"));
    governance = readJson(governancePath);
  } catch (error) {
    return [`Manifest read failed: ${error.message}`];
  }

  const initial = upload.initial_uploads ?? [];
  const deferred = upload.deferred_uploads ?? [];
  if (upload.default_review_state !== "pending") errors.push("Uploads must start pending human review.");
  if (upload.upload_mode !== "manual_product_ui_only" || upload.does_not_write_data !== true) {
    errors.push("Package must remain a manual product-UI input pack, not a loader.");
  }
  if (upload.does_not_approve_evidence !== true) errors.push("Package must not approve evidence.");
  if (initial.length !== 13) errors.push(`Expected 13 initial P2 files; found ${initial.length}.`);
  if (deferred.length !== 1) errors.push(`Expected one deferred P3 redline; found ${deferred.length}.`);

  const familyUploads = initial.filter((item) => item.family_key);
  const families = familyUploads.map((item) => item.family_key).sort();
  if (JSON.stringify(families) !== JSON.stringify([...REQUIRED_FAMILIES].sort())) {
    errors.push("Initial P2 uploads must cover each required GDF family exactly once.");
  }
  if (familyUploads.some((item) => item.phase !== 2 || item.evidence_type !== "uploaded_evidence")) {
    errors.push("Family evidence must be phase-2 uploaded_evidence.");
  }
  const sessions = initial.filter((item) => item.evidence_type === "session_artifact");
  if (sessions.length !== 2 || sessions.some((item) => item.phase !== 2 || item.family_key !== null)) {
    errors.push("The two P2 workshop/review files must remain session artifacts without family attribution.");
  }
  const paths = [...initial, ...deferred].map((item) => item.path);
  if (new Set(paths).size !== 14) errors.push("All 14 package paths must be unique.");

  for (const item of [...initial, ...deferred]) {
    const fullPath = path.resolve(root, item.path);
    if (!fullPath.startsWith(`${root}${path.sep}`)) {
      errors.push(`Upload path escapes package: ${item.path}`);
      continue;
    }
    if (!fs.existsSync(fullPath)) {
      errors.push(`Upload file is missing: ${item.path}`);
      continue;
    }
    const content = fs.readFileSync(fullPath, "utf8");
    const explicitCsvProvenance = fullPath.endsWith(".csv") &&
      /synthetic_status/i.test(content) && /SYNTHETIC_NOT_(?:VALIDATED|GRANTED)/i.test(content);
    if (!explicitCsvProvenance && !/SYNTHETIC[^\n]*(NOT CLIENT-ATTESTED|fictional|simulated)/i.test(content)) {
      errors.push(`File lacks clear synthetic/non-attested provenance: ${item.path}`);
    }
    if (/(?:\b\w+@\w+\.\w+\b|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(content)) {
      errors.push(`File may contain contact data or credentials: ${item.path}`);
    }
  }

  if (deferred[0]?.phase !== 3 || deferred[0]?.evidence_type !== "session_artifact" || !deferred[0]?.upload_when) {
    errors.push("The reviewer redline must be deferred to P3 and carry an upload condition.");
  }
  if (initial.some((item) => item.path.includes("14_solution_design_reviewer_redline"))) {
    errors.push("Do not upload the simulated reviewer redline before a P3 draft exists.");
  }

  if (packageManifest.synthetic !== true || packageManifest.contains_phi !== false || packageManifest.contains_real_personal_data !== false) {
    errors.push("Package must be synthetic and contain no PHI or real personal data.");
  }
  if (packageManifest.agent_ready !== false || packageManifest.registry_activation !== false || packageManifest.loading_status !== "offline_only_not_loaded_not_indexed_not_agent_ready") {
    errors.push("Package must not claim loaded, indexed, active, or agent-ready status.");
  }
  if (packageManifest.archetype_id !== "governed_data_foundation" || packageManifest.total_upload_count !== 14) {
    errors.push("Package must declare the intended archetype and 14-file total.");
  }

  if (governance.client_key !== null || governance.tenant_scope !== "move_registry") {
    errors.push("Governance manifest must use Move-registry scope without a tenant key.");
  }
  if (governance.expected_object_count !== 14 || governance.ingestion_method !== "api_upload") {
    errors.push("Governance manifest count or ingestion method does not match the UI upload plan.");
  }
  if (governance.load_approval !== null || governance.serving_approval !== null) {
    errors.push("Dataset declaration must not fabricate load or serving approval.");
  }
  if (!/no data-plane load|no load approval|no indexing/i.test(governance.notes ?? "")) {
    errors.push("Governance manifest must state that declaration is not load/indexing approval.");
  }

  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validatePackage(process.argv[2] ?? PACKAGE, process.argv[3] ?? GOVERNANCE);
  if (errors.length) {
    console.error(`Moves GDF E2E pack invalid (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Moves GDF E2E pack valid: 11 pending-review families, 2 P2 sessions, 1 deferred P3 redline.");
  }
}
