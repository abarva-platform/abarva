#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(
  root,
  "docs/build/tenant-readiness/lakeshore-meridian-shared-readiness-2026-06-05.json",
);
const reportPath = path.join(
  root,
  "docs/build/tenant-readiness/lakeshore-meridian-shared-readiness-2026-06-05.md",
);
const runbookPath = path.join(root, "docs/runbooks/tenant-shared-readiness-evidence.md");

const REQUIRED_CONTROL_IDS = [
  "admin-loader-ingestion-evidence",
  "client-id-lineage",
  "context-corpus-setup",
  "responsible-ai-acknowledgement",
  "ai-human-approval-boundary",
  "ai-output-defense",
  "usage-cost-cap",
  "private-subscription-dry-run",
];

const REQUIRED_TRUTH_LABELS = [
  "shared-environment rehearsal",
  "not private data-plane proof",
  "not SSO proof",
  "not customer-subscription proof",
  "not HIPAA production proof",
];

function fail(message) {
  console.error(`tenant shared readiness evidence failed: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing ${path.relative(root, filePath)}`);
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing ${path.relative(root, filePath)}`);
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

const manifest = readJson(manifestPath);
const report = readText(reportPath);
const runbook = readText(runbookPath);

if (manifest) {
  if (manifest.status !== "shared_environment_rehearsal") {
    fail("manifest status must remain shared_environment_rehearsal");
  }

  const tenantKeys = new Set((manifest.tenants ?? []).map((tenant) => tenant.clientKey));
  for (const requiredTenant of ["lakeshore", "meridian"]) {
    if (!tenantKeys.has(requiredTenant)) {
      fail(`missing tenant ${requiredTenant}`);
    }
  }

  for (const tenant of manifest.tenants ?? []) {
    if (tenant.currentEvidenceLevel !== "level_2_shared_tenant_rehearsal") {
      fail(`${tenant.clientKey} must be level_2_shared_tenant_rehearsal`);
    }
    if (tenant.privateDataPlaneStatus !== "deferred_private_plane") {
      fail(`${tenant.clientKey} private data plane must stay deferred_private_plane`);
    }
    if (tenant.ssoStatus !== "deferred_private_plane") {
      fail(`${tenant.clientKey} SSO must stay deferred_private_plane`);
    }
  }

  for (const label of REQUIRED_TRUTH_LABELS) {
    if (!(manifest.truthBoundaries ?? []).includes(label)) {
      fail(`manifest missing truth boundary: ${label}`);
    }
  }

  const controls = manifest.controls ?? [];
  const controlIds = new Set(controls.map((control) => control.id));
  for (const requiredControlId of REQUIRED_CONTROL_IDS) {
    if (!controlIds.has(requiredControlId)) {
      fail(`missing control ${requiredControlId}`);
    }
  }

  for (const control of controls) {
    if (control.evidenceLevel === 3 && control.status !== "deferred_private_plane") {
      fail(`level 3 control ${control.id} cannot be marked ${control.status}`);
    }

    if (!Array.isArray(control.requiredEvidence) || control.requiredEvidence.length < 2) {
      fail(`control ${control.id} needs required evidence`);
    }

    if (!Array.isArray(control.cannotClaim) || control.cannotClaim.length < 1) {
      fail(`control ${control.id} needs cannotClaim boundaries`);
    }
  }
}

for (const label of REQUIRED_TRUTH_LABELS) {
  if (!report.includes(label)) {
    fail(`report missing truth label: ${label}`);
  }
}

for (const phrase of [
  "Level 2 shared tenant rehearsal",
  "Deferred private plane",
  "Responsible AI acknowledgement",
  "Admin loader ingestion evidence",
]) {
  if (!report.includes(phrase)) {
    fail(`report missing phrase: ${phrase}`);
  }
}

for (const phrase of [
  "Current Lakeshore and Meridian status is Level 2 shared tenant rehearsal",
  "Level 3 is deferred until the true private subscription dry run",
  "If an item needs private infra or SSO to be true, label it `deferred_private_plane`",
]) {
  if (!runbook.includes(phrase)) {
    fail(`runbook missing phrase: ${phrase}`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log("Tenant shared readiness evidence verified.");
