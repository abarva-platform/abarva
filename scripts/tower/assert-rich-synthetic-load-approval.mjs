#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATASET_ID = "tower-rich-synthetic-source-reconciliation-20261013";
const SOURCE_NAMES = [
  "20_it_budget_by_domain.csv",
  "21_it_project_portfolio.csv",
  "22_ai_business_cases.csv",
  "23_ai_tool_rollout.csv",
  "24_monthly_value_tracking.csv",
  "25_finance_approval_ledger.csv",
  "26_evidence_register.csv",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function csvRowCount(text) {
  let quoted = false;
  let records = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (text[index] === "\n" && !quoted) {
      records += 1;
    }
  }
  if (quoted) throw new Error("Source CSV has an unclosed quoted field");
  if (text.length && text[text.length - 1] !== "\n") records += 1;
  return Math.max(0, records - 1);
}

export function deriveRichSyntheticSourceIdentity(packageDir) {
  const files = SOURCE_NAMES.map((name) => {
    const file = `layer_1_client_intake/source_system_extracts/${name}`;
    const content = fs.readFileSync(path.join(packageDir, file));
    return {
      file,
      rows: csvRowCount(content.toString("utf8")),
      sha256: sha256(content),
    };
  }).sort((left, right) => left.file.localeCompare(right.file));
  return {
    files,
    object_count: files.reduce((sum, file) => sum + file.rows, 0),
    source_set_hash: sha256(JSON.stringify(files)),
  };
}

export async function checkRichSyntheticLoadApproval({
  packageDir,
  assessmentId,
  tenantKey,
  releaseRecord,
  manifestDir = path.join(ROOT, "docs/governance/dataset-manifests"),
}) {
  const { resolveLoadApproval } = await import("../../src/lib/governance/dataset-manifest.ts");
  const packageManifest = JSON.parse(
    fs.readFileSync(path.join(packageDir, "package_manifest.json"), "utf8"),
  );
  const source = deriveRichSyntheticSourceIdentity(packageDir);
  const reasons = [];
  const registry = JSON.parse(fs.readFileSync(
    path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8",
  ));
  if (!registry.activeTenants?.some((tenant) => tenant.tenantKey === tenantKey)) {
    reasons.push("requested tenant is not declared active in the tenant input registry");
  }
  if (packageManifest.no_runtime_load !== false) {
    reasons.push("package remains no_runtime_load=true");
  }
  if (packageManifest.assessment_id !== assessmentId) {
    reasons.push("package assessment differs from requested assessment");
  }
  if (packageManifest.source_set_hash !== source.source_set_hash) {
    reasons.push("package source-set hash differs from recomputed source files");
  }
  if (!Array.isArray(packageManifest.files) || packageManifest.files.length < source.files.length) {
    reasons.push("package output file manifest is missing");
  } else {
    const changed = packageManifest.files.filter((entry) => {
      const fullPath = path.join(packageDir, entry.file);
      if (!entry.file || path.resolve(fullPath) !== fullPath ||
          !fullPath.startsWith(`${path.resolve(packageDir)}${path.sep}`) ||
          !fs.existsSync(fullPath)) return true;
      const bytes = fs.readFileSync(fullPath);
      return sha256(bytes) !== entry.sha256 ||
        (entry.rows !== null && csvRowCount(bytes.toString("utf8")) !== entry.rows);
    });
    if (changed.length) reasons.push(`${changed.length} package output files differ from their manifest hashes`);
  }
  if (packageManifest.tenant_key !== tenantKey) {
    reasons.push("package tenant differs from requested tenant");
  }
  if (!releaseRecord || !/^docs\/releases\/records\/[a-zA-Z0-9._-]+\.md$/.test(releaseRecord)) {
    reasons.push("a repo release record is required for a load");
  }
  const manifests = fs.readdirSync(manifestDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(manifestDir, name), "utf8")));
  const declaration = manifests.filter((manifest) => manifest.dataset_id === DATASET_ID);
  if (declaration.length === 1 && /^pending\b/i.test(declaration[0].approved_by)) {
    reasons.push("dataset declaration has not received named human signoff");
  }
  const binding = {
    dataset_id: DATASET_ID,
    tenant_key: tenantKey,
    assessment_id: assessmentId,
    source_set_hash: source.source_set_hash,
    object_count: source.object_count,
    ingestion_method: "operator_aca_job",
    release_record: releaseRecord,
  };
  const decision = resolveLoadApproval(manifests, binding);
  if (!decision.approved) reasons.push(...decision.reasons);
  if (decision.approved && decision.approval.release_record !== releaseRecord) {
    reasons.push("load approval release record differs from requested release record");
  }
  return {
    status: reasons.length ? "pending" : "approved",
    reasons,
    binding,
    package_id: packageManifest.package_id,
    source_files: source.files,
  };
}

export async function assertRichSyntheticLoadApproval(options) {
  const report = await checkRichSyntheticLoadApproval(options);
  if (report.status !== "approved") {
    throw new Error(`Refusing rich synthetic load: ${report.reasons.join("; ")}`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : null;
  };
  const report = await checkRichSyntheticLoadApproval({
    packageDir: path.resolve(arg("--package-dir") ?? path.join(ROOT, "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-10-reconciled-rich")),
    assessmentId: arg("--assessment-id"),
    tenantKey: arg("--tenant-key") ?? "meridian-health",
    releaseRecord: arg("--release-record"),
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "approved" && !process.argv.includes("--check-only")) process.exitCode = 1;
}
