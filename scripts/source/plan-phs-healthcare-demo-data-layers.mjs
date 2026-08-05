#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { EXPECTED, validatePackage } from "./validate-phs-healthcare-demo-package.mjs";

const DEFAULT_OUT_DIR = "/Users/anand/Downloads";
const SOURCE_VOLUME_RELEASE_VERSION = "source-volume-v1";
const SOURCE_VOLUME_EXECUTION_SUFFIX = "source-volume-plan-v1";

async function main() {
  const packageDir = await resolvePackageDir();
  const outDir = path.resolve(argValue("--out-dir", DEFAULT_OUT_DIR));
  const timestamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
  const proofDir = path.join(outDir, `phs_healthcare_demo_data_layer_plan_${timestamp}`);
  await fs.rm(proofDir, { recursive: true, force: true });
  await fs.mkdir(proofDir, { recursive: true });

  const packageValidation = await validatePackage(packageDir);
  if (!packageValidation.ok) {
    throw new Error(`PHS package validation failed: ${JSON.stringify(packageValidation.failures.slice(0, 5))}`);
  }

  const packageManifest = await readJson(path.join(packageDir, "phs_healthcare_demo_package_manifest.json"));
  const phaseResult = await readJson(path.join(packageDir, "phase_a_result.json"));
  const proofZip = resolveProofZip(packageDir, phaseResult);
  const proofZipSha256 = await sha256File(proofZip);
  const proofZipAttestation = `${proofZip}.sha256`;
  const attestationText = await fs.readFile(proofZipAttestation, "utf8");
  if (!attestationText.includes(proofZipSha256)) {
    throw new Error(`Proof ZIP attestation mismatch for ${proofZip}`);
  }
  execFileSync("unzip", ["-t", proofZip], { stdio: "ignore" });

  const sourceFiles = await sourceFilePlans(packageDir, packageManifest);
  const sourceRows = sourceFiles.reduce((sum, file) => sum + file.row_count, 0);
  const sourceFieldValues = sourceFiles.reduce((sum, file) => sum + file.field_count, 0);
  const releaseHash = sha256(
    stableJson(sourceFiles.map((file) => ({
      relative_path: file.relative_path,
      content_sha256: file.content_sha256,
      row_count: file.row_count,
      field_count: file.field_count,
    }))),
  );

  const layer0 = {
    status: "PHS_HEALTHCARE_DEMO_LAYER0_PACKAGE_PROOF_READY",
    generated_at: new Date().toISOString(),
    mutation_executed: false,
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    activation_state: packageManifest.activation_state,
    package_dir: packageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofZipSha256,
    proof_zip_sha256_attestation: proofZipAttestation,
    package_validation_summary: packageValidation.summary,
    package_validation_failures: packageValidation.failures.length,
    package_validation_warnings: packageValidation.warnings.length,
  };

  const layer1 = {
    status: "PHS_HEALTHCARE_DEMO_LAYER1_SOURCE_VOLUME_PLAN_READY",
    generated_at: new Date().toISOString(),
    mutation_executed: false,
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    as_of_date: EXPECTED.asOfDate,
    source_release_id: `${EXPECTED.datasetId}:${SOURCE_VOLUME_RELEASE_VERSION}`,
    source_volume_execution_id: `${EXPECTED.datasetId}:${SOURCE_VOLUME_EXECUTION_SUFFIX}`,
    source_volume_release_version: SOURCE_VOLUME_RELEASE_VERSION,
    source_volume_release_hash: releaseHash,
    source_files: sourceFiles.length,
    required_core_source_extracts: packageValidation.summary.coreSourceExtracts,
    optional_health_plan_outcome_snapshot_rows: packageValidation.summary.optionalHealthPlanOutcomeSnapshotRows,
    source_records: sourceRows,
    source_field_values: sourceFieldValues,
    max_columns: Math.max(...sourceFiles.map((file) => file.headers.length)),
    restricted_detail_health_plan_extracts_present: sourceFiles
      .map((file) => file.file_name)
      .filter((fileName) => ["PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv", "STARS_HEDIS_MEASURE_PERFORMANCE.csv"].includes(fileName)),
    apply_gate: "NOT_AUTHORIZED_IN_PLAN_MODE",
    next_required_gate: "approved ACA data-build job with isolated lab target and explicit package SHA",
    files: sourceFiles.map(({ rows, ...file }) => file),
  };

  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_LAYER0_PACKAGE_PROOF.json"), layer0);
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_LAYER1_SOURCE_VOLUME_PLAN.json"), layer1);
  await writeCsv(path.join(proofDir, "PHS_HEALTHCARE_DEMO_SOURCE_FILES.csv"), [
    "file_index",
    "file_name",
    "domain_contract",
    "source_system",
    "source_object",
    "grain",
    "row_count",
    "field_count",
    "content_sha256",
  ], sourceFiles);
  await fs.writeFile(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATA_LAYER_EXECUTION_PLAN.md"), buildExecutionPlan(layer0, layer1));

  const proofZipPath = path.join(outDir, `PHS_Healthcare_Demo_Data_Layer_Plan_${timestamp}.zip`);
  await fs.rm(proofZipPath, { force: true });
  execFileSync("zip", ["-qr", proofZipPath, "."], { cwd: proofDir });
  const dataLayerPlanSha256 = await sha256File(proofZipPath);
  await fs.writeFile(`${proofZipPath}.sha256`, `${dataLayerPlanSha256}  ${path.basename(proofZipPath)}\n`);

  const result = {
    status: "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_READY",
    mutation_executed: false,
    package_dir: packageDir,
    proof_dir: proofDir,
    proof_zip: proofZipPath,
    proof_zip_sha256: dataLayerPlanSha256,
    proof_zip_sha256_attestation: `${proofZipPath}.sha256`,
    source_files: layer1.source_files,
    source_records: layer1.source_records,
    source_field_values: layer1.source_field_values,
    next_required_gate: layer1.next_required_gate,
  };
  await writeJson(path.join(proofDir, "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_RESULT.json"), result);
  console.log(JSON.stringify(result, null, 2));
}

function argValue(name, fallback = null) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] ?? fallback;
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
}

async function resolvePackageDir() {
  const explicit = argValue("--package-dir");
  if (explicit) return path.resolve(explicit);
  const entries = await fs.readdir(DEFAULT_OUT_DIR, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("phs_healthcare_demo_phase_a_"))
    .map((entry) => path.join(DEFAULT_OUT_DIR, entry.name))
    .sort();
  if (matches.length === 0) throw new Error("No PHS healthcare demo package found in /Users/anand/Downloads");
  return matches[matches.length - 1];
}

function resolveProofZip(packageDir, phaseResult) {
  const proofZipName = phaseResult.proof_zip;
  if (!proofZipName) throw new Error("phase_a_result.json does not declare proof_zip");
  const candidate = path.join(path.dirname(packageDir), proofZipName);
  return candidate;
}

async function sourceFilePlans(packageDir, packageManifest) {
  const contracts = (packageManifest.file_contracts || [])
    .filter((contract) => String(contract.path || "").startsWith("source_system_extracts/") && contract.format === "csv")
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  const files = [];
  for (let index = 0; index < contracts.length; index += 1) {
    const contract = contracts[index];
    const relativePath = contract.path;
    const absolutePath = path.join(packageDir, relativePath);
    const content = await fs.readFile(absolutePath, "utf8");
    const rows = parseCsv(content);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : parseCsvHeaders(content);
    const contentSha256 = sha256(content);
    const stats = await fs.stat(absolutePath);
    if (contract.expected_rows !== rows.length) {
      throw new Error(`${relativePath} row count mismatch: expected ${contract.expected_rows}, got ${rows.length}`);
    }
    files.push({
      file_index: index + 1,
      relative_path: relativePath,
      file_name: path.basename(relativePath),
      source_file_id: `${EXPECTED.datasetId}:source-file:${shortHash(relativePath, 16)}`,
      domain_contract: contract.domain_contract,
      source_system: contract.source_system,
      source_object: contract.source_object,
      grain: contract.grain,
      primary_key: contract.primary_key,
      content_sha256: contentSha256,
      bytes: stats.size,
      headers,
      row_count: rows.length,
      field_count: rows.length * headers.length,
      rows,
    });
  }
  return files;
}

function parseCsvHeaders(text) {
  const [first = ""] = text.split(/\n/u);
  return parseCsv(`${first}\n`).length > 0 ? Object.keys(parseCsv(`${first}\n`)[0]) : first.split(",");
}

function parseCsv(text) {
  const rawRows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rawRows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rawRows.push(row);
  }
  const [header = [], ...data] = rawRows.filter((candidate) => candidate.some((cell) => cell !== ""));
  return data.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function sha256File(filePath) {
  return sha256(await fs.readFile(filePath));
}

function shortHash(value, length) {
  return sha256(value).slice(0, length);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function writeCsv(filePath, headers, rows) {
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n") + "\n";
  await fs.writeFile(filePath, text);
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/u.test(stringValue)) return `"${stringValue.replaceAll('"', '""')}"`;
  return stringValue;
}

function buildExecutionPlan(layer0, layer1) {
  return `# PHS Healthcare Demo Data-Layer Execution Plan

Status: plan_ready, not_loaded

No database load, migration, Cube refresh, runtime deploy, tenant activation or existing-tenant mutation was executed by this plan.

## Layer 0 Package Proof

- Package: ${layer0.package_dir}
- Proof ZIP: ${layer0.proof_zip}
- Proof SHA-256: ${layer0.proof_zip_sha256}
- Validation failures: ${layer0.package_validation_failures}
- Validation warnings: ${layer0.package_validation_warnings}

## Layer 1 Source Volume Plan

- Tenant key: ${layer1.tenant_key}
- Dataset id: ${layer1.dataset_id}
- Source release id: ${layer1.source_release_id}
- Source files: ${layer1.source_files}
- Source records: ${layer1.source_records}
- Source field values: ${layer1.source_field_values}
- Required core source extracts: ${layer1.required_core_source_extracts}
- Optional health-plan outcome snapshot rows: ${layer1.optional_health_plan_outcome_snapshot_rows}
- Restricted detailed health-plan extracts present: ${layer1.restricted_detail_health_plan_extracts_present.length}

## Next Gate

Run only after approval through an isolated ACA data-build job:

1. Preflight against the lab database with writer context and transaction rollback.
2. Apply Layer 1 source release/files/records/field values only if the approved package SHA matches.
3. Verify with independent reader counts.
4. Continue to source adapters and canonical candidates as separate gated jobs.
`;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_DATA_LAYER_PLAN_FAILED", error: error.message }, null, 2));
  process.exit(1);
});
