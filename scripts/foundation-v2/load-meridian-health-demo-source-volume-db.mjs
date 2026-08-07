#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const EXPECTED = {
  tenantKey: "meridian_health_global",
  datasetId: "meridian-health-source-v1-202608",
  datasetVersion: "v1",
  asOfDate: "2026-07-31",
};

const SOURCE_VOLUME_RELEASE_VERSION = "source-volume-v1";
const SOURCE_VOLUME_EXECUTION_SUFFIX = "source-volume-apply-v1";
const TEST_NAMESPACE = "meridian-health-source-volume-v1";
const FOUNDATION_RELEASE_ALIAS = "meridian-health-demo-phase-a-source-volume-v1";
const DATABASE_SCHEMA = "foundation_v2_meridian_health_demo";
const EXPECTED_SOURCE_RELEASE_ID = "meridian-health-source-v1-202608:source-volume-v1:05889e763f88";
const ISOLATION_SCOPE = "ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY";
const SOURCE_VOLUME_GATE_IDS = ["Meridian Health-SOURCE-VOLUME-L0-L1", "Meridian Health-SOURCE-VOLUME-L1-L2"];
const WRITER_ROLE = "foundation_v2_meridian_health_demo_writer";
const READER_ROLE = "foundation_v2_meridian_health_demo_reader";
const MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT = Object.freeze({
  database_schema: DATABASE_SCHEMA,
  tenant_key: EXPECTED.tenantKey,
  test_namespace: TEST_NAMESPACE,
  writer_role: WRITER_ROLE,
  reader_role: READER_ROLE,
  foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
  expected_source_release_id: EXPECTED_SOURCE_RELEASE_ID,
  isolation_scope: ISOLATION_SCOPE,
  expected_source_file_context_rows: 54,
});
const EXPECTED_PROOF_ZIP_SHA256 = "02866d7ede177f1f0046f4a2ca936c098e9fd86b3036ac74a74bab9420c0f8de";
const LAYER1_SOURCE_GROUPS = ["enterprise_context", "optional_domain_context", "bpo_sourcing_event", "bpo_transformation_event"];
const RESTRICTED_DETAIL_HEALTH_PLAN_FILES = ["PAYER_CLAIMS_ENROLLMENT_MONTHLY.csv", "STARS_HEDIS_MEASURE_PERFORMANCE.csv"];
const REQUIRED_LAYER1_RELEASE_FILES = new Set([
  "WORKDAY_SUPPLIERS.csv", "WORKDAY_SUPPLIER_INVOICES.csv", "WORKDAY_PAYMENTS.csv", "WORKDAY_COST_CENTERS.csv",
  "WORKDAY_SPEND_CATEGORIES.csv", "WORKDAY_WORKER_ROLE_SUMMARY.csv", "LOCAL_HOSPITAL_PURCHASES.csv", "MEDSURG_ITEM_MASTER.csv",
  "MEDSURG_PRICE_TIERS.csv", "MEDSURG_BACKORDERS_SUBSTITUTIONS.csv", "MEDSURG_REBATES_CREDITS.csv", "CONTRACT_REGISTER.csv",
  "CONTRACT_INSTRUMENTS.csv", "CONTRACT_AMENDMENTS.csv", "CONTRACT_RATE_CARDS.csv", "CONTRACT_SLA_TERMS.csv",
  "CONTRACT_RENEWAL_EXIT_TERMS.csv", "SERVICENOW_VENDOR_SERVICES.csv", "SERVICENOW_CMDB_APPLICATIONS.csv",
  "SERVICENOW_CSDM_BUSINESS_SERVICES.csv", "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "SERVICENOW_MONTHLY_SLA_SUMMARY.csv",
  "SERVICENOW_SERVICE_CREDITS.csv", "EPIC_MODULE_INVENTORY.csv", "EPIC_INTERFACE_INVENTORY.csv",
  "CLARITY_CABOODLE_ASSET_INVENTORY.csv", "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv", "HADOOP_CLUSTER_WORKLOADS.csv",
  "SQL_SERVER_DATA_MARTS.csv", "SAS_APPLICATIONS_AND_USERS.csv", "ANALYTICS_PLATFORM_DEPENDENCIES.csv",
  "SAAS_MODULE_USAGE_MONTHLY.csv", "AWS_TARGET_COMMITMENT_SCENARIOS.csv", "DATABRICKS_TARGET_COMMITMENT_SCENARIOS.csv",
  "VENDOR_WORKFORCE_MONTHLY.csv", "VENDOR_RATE_CARD_INVOICES.csv", "CONTRACT_SCOPE_RELATIONSHIPS.csv",
  "PROGRAMS_INITIATIVES_DEPENDENCIES.csv", "RISK_CONTROL_OBSERVATIONS.csv", "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv",
  "BPO_CURRENT_STATE_WORKFORCE.csv", "BPO_CURRENT_STATE_COST_BASELINE.csv", "BPO_RFP_REQUIREMENTS.csv", "BPO_SUPPLIERS.csv",
  "BPO_SUPPLIER_RESPONSES.csv", "BPO_COMMERCIAL_LINES.csv", "BPO_EVALUATION_SCORES.csv", "BPO_CLARIFICATIONS.csv",
  "BPO_BAFO_RESPONSES.csv", "BPO_NORMALIZED_TCO.csv", "BPO_REBADGE_RETENTION_PLAN.csv",
  "BPO_TRANSITION_KNOWLEDGE_TRANSFER_PLAN.csv", "BPO_AI_AUTOMATION_TRANSFORMATION_COMMITMENTS.csv",
  "BPO_RETAINED_ORGANIZATION_SCENARIOS.csv",
]);

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({
    status: "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_FAILED",
    error: error.message,
  }, null, 2));
  process.exit(1);
});

async function main() {
  if (args.mode === "self-test") {
    fs.mkdirSync(args.outDir, { recursive: true });
    const result = await runSourceVolumeSelfTest();
    writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const plan = await buildSourceVolumePlan();
  assertMeridianExecutionContract(plan);
  fs.mkdirSync(args.outDir, { recursive: true });
  writePlanProof(args.outDir, plan);

  if (args.mode === "plan") {
    const result = manifest("MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PLAN_READY", plan, {});
    writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PLAN.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.mode === "apply") assertApplyApproved(plan);
  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("meridian-health-demo-source-volume"));
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client, plan);
      writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PREFLIGHT.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client, plan);
      writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_VERIFY.json"), result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client, plan);
    writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_APPLY.json"), result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_MODE || "plan",
    packageDir: process.env.MERIDIAN_HEALTH_DEMO_PACKAGE_DIR || "",
    packageZip: process.env.MERIDIAN_HEALTH_DEMO_PACKAGE_ZIP || "",
    packageZipUrl: process.env.MERIDIAN_HEALTH_DEMO_PACKAGE_ZIP_URL || "",
    packageZipSha256: process.env.MERIDIAN_HEALTH_DEMO_PACKAGE_ZIP_SHA256 || "",
    proofZip: process.env.MERIDIAN_HEALTH_DEMO_PROOF_ZIP || "",
    proofZipUrl: process.env.MERIDIAN_HEALTH_DEMO_PROOF_ZIP_URL || "",
    proofZipSha256: process.env.MERIDIAN_HEALTH_DEMO_PROOF_ZIP_SHA256 || "",
    outDir: process.env.MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_OUT_DIR || path.join(os.tmpdir(), "meridian-health-demo-source-volume"),
    approvedProofSha256: process.env.MERIDIAN_HEALTH_DEMO_APPROVED_PROOF_SHA256 || "",
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--package-dir") parsed.packageDir = path.resolve(next());
    else if (arg === "--package-zip") parsed.packageZip = path.resolve(next());
    else if (arg === "--package-zip-url") parsed.packageZipUrl = next();
    else if (arg === "--package-zip-sha256") parsed.packageZipSha256 = next();
    else if (arg === "--proof-zip") parsed.proofZip = path.resolve(next());
    else if (arg === "--proof-zip-url") parsed.proofZipUrl = next();
    else if (arg === "--proof-zip-sha256") parsed.proofZipSha256 = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(next());
    else if (arg === "--approved-proof-sha256") parsed.approvedProofSha256 = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["plan", "preflight", "apply", "verify", "self-test"].includes(parsed.mode)) {
    throw new Error(`Unsupported mode ${parsed.mode}`);
  }
  if (parsed.mode !== "self-test" && !parsed.packageDir && !parsed.packageZip && !parsed.packageZipUrl) {
    throw new Error("Explicit --package-dir, --package-zip, or --package-zip-url is required for Meridian Health source-volume modes; latest Downloads auto-selection is not allowed");
  }
  return parsed;
}

async function buildSourceVolumePlan() {
  const resolvedPackage = await resolvePackageInput();
  const packageDir = resolvedPackage.packageDir;
  const packageManifestPath = path.join(packageDir, "meridian_health_demo_package_manifest.json");
  const phaseResultPath = path.join(packageDir, "phase_a_result.json");
  assertFile(packageManifestPath);
  assertFile(phaseResultPath);
  const packageManifest = readJson(packageManifestPath);
  const phaseResult = readJson(phaseResultPath);
  assertPackageIdentity(packageManifest);
  const proofZip = await resolveProofZip(packageDir, phaseResult);
  assertFile(proofZip);
  const proofZipSha256 = sha256(fs.readFileSync(proofZip));
  if (proofZipSha256 !== EXPECTED_PROOF_ZIP_SHA256) {
    throw new Error(`Proof ZIP SHA mismatch: expected ${EXPECTED_PROOF_ZIP_SHA256}, got ${proofZipSha256}`);
  }
  const proofZipAttestation = `${proofZip}.sha256`;
  if (fs.existsSync(proofZipAttestation)) {
    const attestation = fs.readFileSync(proofZipAttestation, "utf8");
    if (!attestation.includes(proofZipSha256)) {
      throw new Error(`Proof ZIP SHA attestation mismatch for ${proofZip}`);
    }
  }
  await assertZipReadable(proofZip);

  const baseFiles = sourceFilePlans(packageDir, packageManifest);
  const releaseHash = sha256(stableJson(baseFiles.map((file) => ({
    relative_path: file.relative_path,
    content_sha256: file.content_sha256,
    row_count: file.row_count,
    field_count: file.field_count,
    source_group: file.source_group,
    context_treatment: file.context_treatment,
    demo_priority: file.demo_priority,
    event_id: file.event_id,
    effective_as_of: file.effective_as_of,
  }))));
  const sourceReleaseId = `${EXPECTED.datasetId}:${SOURCE_VOLUME_RELEASE_VERSION}:${releaseHash.slice(0, 12)}`;
  const files = baseFiles.map((file) => ({
    ...file,
    source_file_id: `${sourceReleaseId}:source-file:${shortHash(file.relative_path, 16)}`,
  }));
  const totalRows = files.reduce((sum, file) => sum + file.row_count, 0);
  const totalFields = files.reduce((sum, file) => sum + file.field_count, 0);
  const sourceGroupCounts = groupedCounts(files, "source_group");
  const demoPriorityCounts = groupedCounts(files, "demo_priority");
  const sourceFileContextRows = sourceFileContextPlanRows(sourceReleaseId, files);

  return {
    tenant_key: EXPECTED.tenantKey,
    dataset_id: EXPECTED.datasetId,
    dataset_version: EXPECTED.datasetVersion,
    database_schema: DATABASE_SCHEMA,
    test_namespace: TEST_NAMESPACE,
    source_release_id: sourceReleaseId,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: `${sourceReleaseId}:${SOURCE_VOLUME_EXECUTION_SUFFIX}`,
    release_version: `${SOURCE_VOLUME_RELEASE_VERSION}:${releaseHash.slice(0, 12)}`,
    release_hash: releaseHash,
    isolation_scope: ISOLATION_SCOPE,
    package_dir: packageDir,
    proof_zip: proofZip,
    proof_zip_sha256: proofZipSha256,
    file_count: files.length,
    source_group_counts: sourceGroupCounts,
    demo_priority_counts: demoPriorityCounts,
    total_source_rows: totalRows,
    total_field_values: totalFields,
    source_field_value_rule: "insert_all_field_slots_including_explicit_blank_cells",
    max_columns: Math.max(...files.map((file) => file.headers.length)),
    database_target_contract: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT,
    source_file_context_rows: sourceFileContextRows.length,
    source_file_context: sourceFileContextRows,
    restricted_detail_health_plan_extracts_present: files
      .map((file) => file.file_name)
      .filter((fileName) => RESTRICTED_DETAIL_HEALTH_PLAN_FILES.includes(fileName)),
    files,
  };
}

async function resolvePackageInput() {
  if (args.packageDir) {
    return { packageDir: path.resolve(args.packageDir) };
  }
  const zipPath = args.packageZipUrl ? await downloadPackageZip(args.packageZipUrl) : path.resolve(args.packageZip);
  assertFile(zipPath);
  const actualSha256 = sha256(fs.readFileSync(zipPath));
  const expectedSha256 = args.packageZipSha256;
  if (!expectedSha256) {
    throw new Error("MERIDIAN_HEALTH_DEMO_PACKAGE_ZIP_SHA256 or --package-zip-sha256 is required for package ZIP inputs");
  }
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Meridian Health package ZIP SHA mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
  const extractRoot = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-health-demo-package-"));
  await extractZipToDirectory(zipPath, extractRoot);
  return { packageDir: extractRoot };
}

async function resolveProofZip(packageDir, phaseResult) {
  const proofZip = args.proofZipUrl ? await downloadProofZip(args.proofZipUrl) : args.proofZip;
  const resolvedProofZip = proofZip || path.join(path.dirname(packageDir), phaseResult.proof_zip);
  assertFile(resolvedProofZip);
  const actualSha256 = sha256(fs.readFileSync(resolvedProofZip));
  const expectedSha256 = args.proofZipSha256 || args.approvedProofSha256 || EXPECTED_PROOF_ZIP_SHA256;
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Meridian Health proof ZIP SHA mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
  return resolvedProofZip;
}

async function downloadPackageZip(url) {
  const target = path.join(os.tmpdir(), `meridian-health-demo-approved-package-${shortHash(url, 12)}.zip`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download Meridian Health package ZIP: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, bytes);
  return target;
}

async function downloadProofZip(url) {
  const target = path.join(os.tmpdir(), `meridian-health-demo-approved-proof-${shortHash(url, 12)}.zip`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download Meridian Health proof ZIP: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, bytes);
  return target;
}

async function assertZipReadable(zipPath) {
  const JSZip = await optionalJSZip();
  if (JSZip) {
    await JSZip.loadAsync(fs.readFileSync(zipPath));
    return;
  }
  execFileSync("unzip", ["-t", zipPath], { stdio: "ignore" });
}

async function extractZipToDirectory(zipPath, destinationDir) {
  const JSZip = await optionalJSZip();
  if (!JSZip) {
    execFileSync("unzip", ["-q", zipPath, "-d", destinationDir], { stdio: "ignore" });
    return;
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  const destinationRoot = path.resolve(destinationDir);
  for (const [entryName, entry] of Object.entries(zip.files)) {
    const targetPath = path.resolve(destinationRoot, entryName);
    if (targetPath !== destinationRoot && !targetPath.startsWith(`${destinationRoot}${path.sep}`)) {
      throw new Error(`Unsafe ZIP entry path: ${entryName}`);
    }
    if (entry.dir) {
      fs.mkdirSync(targetPath, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, await entry.async("nodebuffer"));
  }
}

async function optionalJSZip() {
  try {
    return (await import("jszip")).default;
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") return null;
    throw error;
  }
}

function assertPackageIdentity(manifest) {
  if (manifest.tenant_key !== EXPECTED.tenantKey) throw new Error(`Unexpected tenant_key ${manifest.tenant_key}`);
  if (manifest.dataset_id !== EXPECTED.datasetId) throw new Error(`Unexpected dataset_id ${manifest.dataset_id}`);
  if (manifest.dataset_version !== EXPECTED.datasetVersion) throw new Error(`Unexpected dataset_version ${manifest.dataset_version}`);
  if (manifest.activation_state !== "generated_not_loaded") throw new Error(`Package activation state must be generated_not_loaded, got ${manifest.activation_state}`);
}

function sourceFilePlans(packageDir, packageManifest) {
  const contracts = (packageManifest.file_contracts || [])
    .filter((contract) => contract.format === "csv" && REQUIRED_LAYER1_RELEASE_FILES.has(path.basename(contract.path)) && LAYER1_SOURCE_GROUPS.includes(contract.source_group))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  const present = new Set(contracts.map((contract) => path.basename(contract.path)));
  for (const fileName of REQUIRED_LAYER1_RELEASE_FILES) {
    if (!present.has(fileName)) throw new Error(`Missing required Layer 1 release file: ${fileName}`);
  }
  if (contracts.length !== 54) throw new Error(`Layer 1 release must contain exactly 54 CSV files, got ${contracts.length}`);
  return contracts.map((contract, index) => {
    const relativePath = contract.path;
    const absolutePath = path.join(packageDir, relativePath);
    assertFile(absolutePath);
    const content = fs.readFileSync(absolutePath, "utf8");
    const rows = parseCsv(content);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : parseCsvHeaders(content);
    if (contract.expected_rows !== rows.length) {
      throw new Error(`${relativePath} row count mismatch: expected ${contract.expected_rows}, got ${rows.length}`);
    }
    return {
      file_index: index + 1,
      relative_path: relativePath,
      file_name: path.basename(relativePath),
      source_group: contract.source_group,
      context_treatment: contract.context_treatment,
      demo_priority: contract.demo_priority,
      event_id: contract.event_id || "",
      effective_as_of: contract.effective_as_of,
      source_family: contract.domain_contract,
      object_type: slug(contract.source_object || contract.grain || path.basename(relativePath, ".csv")).replace(/-/g, "_"),
      content_sha256: sha256(content),
      bytes: fs.statSync(absolutePath).size,
      headers,
      row_count: rows.length,
      field_count: rows.length * headers.length,
      rows,
    };
  });
}

function groupedCounts(files, field) {
  const counts = {};
  for (const file of files) {
    const key = file[field] || "unclassified";
    if (!counts[key]) counts[key] = { files: 0, records: 0, field_slots: 0 };
    counts[key].files += 1;
    counts[key].records += file.row_count;
    counts[key].field_slots += file.field_count;
  }
  return counts;
}

function sourceFileContextPlanRows(sourceReleaseId, files) {
  return files.map((file) => ({
    source_file_id: file.source_file_id,
    source_release_id: sourceReleaseId,
    tenant_key: EXPECTED.tenantKey,
    test_namespace: TEST_NAMESPACE,
    source_group: file.source_group,
    context_treatment: file.context_treatment,
    demo_priority: file.demo_priority,
    event_id: file.event_id || "",
    effective_as_of: file.effective_as_of,
    content_sha256: file.content_sha256,
  }));
}

function assertMeridianExecutionContract(plan, overrides = {}) {
  const actual = {
    database_schema: overrides.database_schema ?? envOrConstant("MERIDIAN_HEALTH_DEMO_DB_SCHEMA", DATABASE_SCHEMA),
    tenant_key: overrides.tenant_key ?? envOrConstant("MERIDIAN_HEALTH_DEMO_TENANT_KEY", plan.tenant_key),
    test_namespace: overrides.test_namespace ?? envOrConstant("MERIDIAN_HEALTH_DEMO_TEST_NAMESPACE", plan.test_namespace),
    writer_role: overrides.writer_role ?? envOrConstant("MERIDIAN_HEALTH_DEMO_DB_WRITER_ROLE", WRITER_ROLE),
    reader_role: overrides.reader_role ?? envOrConstant("MERIDIAN_HEALTH_DEMO_DB_READER_ROLE", READER_ROLE),
    foundation_release_alias: overrides.foundation_release_alias ?? envOrConstant("MERIDIAN_HEALTH_DEMO_FOUNDATION_RELEASE_ALIAS", plan.foundation_release_alias),
    source_release_id: overrides.source_release_id ?? envOrConstant("MERIDIAN_HEALTH_DEMO_SOURCE_RELEASE_ID", plan.source_release_id),
    isolation_scope: overrides.isolation_scope ?? envOrConstant("MERIDIAN_HEALTH_DEMO_ISOLATION_SCOPE", plan.isolation_scope),
  };
  const expected = {
    database_schema: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.database_schema,
    tenant_key: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.tenant_key,
    test_namespace: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.test_namespace,
    writer_role: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.writer_role,
    reader_role: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.reader_role,
    foundation_release_alias: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.foundation_release_alias,
    source_release_id: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.expected_source_release_id,
    isolation_scope: MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.isolation_scope,
  };
  const mismatches = Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key, value]) => ({ field: key, expected: value, actual: actual[key] }));
  if (mismatches.length > 0) {
    throw new Error(`Meridian Health execution contract mismatch before DB mutation path: ${JSON.stringify(mismatches)}`);
  }
  if (plan.file_count !== MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.expected_source_file_context_rows) {
    throw new Error(`Meridian Health source file context row contract mismatch: expected ${MERIDIAN_HEALTH_DEMO_EXECUTION_CONTRACT.expected_source_file_context_rows}, got ${plan.file_count}`);
  }
}

function envOrConstant(name, fallback) {
  return process.env[name] || fallback;
}

async function preflight(client, plan) {
  await client.query("BEGIN");
  try {
    await setContext(client, plan, WRITER_ROLE);
    const existing = await sourceVolumeReadback(client, plan);
    await client.query("ROLLBACK");
    const existingTotal = Object.values(existing.counts).reduce((sum, value) => sum + Number(value || 0), 0);
    const exact = existing.exact_match;
    return manifest(existingTotal === 0 || exact ? "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PREFLIGHT_PASSED" : "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_PREFLIGHT_FAILED", plan, {
      existing_readback: existing,
      existing_total: existingTotal,
      existing_exact_match: exact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function apply(client, plan) {
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${EXPECTED.tenantKey}:${TEST_NAMESPACE}:source-volume`]);
    await setContext(client, plan, WRITER_ROLE);
    const existing = await sourceVolumeReadback(client, plan);
    if (Object.values(existing.counts).some((value) => Number(value || 0) > 0)) {
      if (!existing.exact_match) {
        throw new Error(`Existing Meridian Health source-volume rows do not match expected identity/hash contract: ${JSON.stringify(existing.variances)}`);
      }
      await client.query("ROLLBACK");
      return manifest("MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_ALREADY_APPLIED_EXACT_MATCH", plan, {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        existing_readback: existing,
      });
    }

    await insertSourceRelease(client, plan);
    await insertSourceFiles(client, plan);
    await insertSourceFileContext(client, plan);
    for (const file of plan.files) {
      await insertSourceRowsAndFields(client, plan, file);
    }
    await insertParserExecution(client, plan);
    await insertGateResults(client, plan);
    const readback = await sourceVolumeReadback(client, plan);
    if (!readback.exact_match) {
      throw new Error(`Meridian Health source-volume variance after write: ${JSON.stringify(readback.variances)}`);
    }
    await client.query("COMMIT");
    return manifest("MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_APPLIED", plan, {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      actual_readback: readback,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verify(client, plan) {
  await client.query("BEGIN");
  try {
    const role = process.env.MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_DB_ROLE === "writer" ? WRITER_ROLE : READER_ROLE;
    await setContext(client, plan, role);
    const readback = await sourceVolumeReadback(client, plan);
    await client.query("ROLLBACK");
    const exact = readback.exact_match;
    return manifest(exact ? "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_VERIFIED" : "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_VERIFY_FAILED", plan, {
      actual_readback: readback,
      exact_match: exact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

function assertApplyApproved(plan) {
  assertMeridianExecutionContract(plan);
  if (process.env.MERIDIAN_HEALTH_DEMO_LAYER1_APPLY_APPROVED !== "true") {
    throw new Error("MERIDIAN_HEALTH_DEMO_LAYER1_APPLY_APPROVED=true is required for apply");
  }
  const approvedSha = args.approvedProofSha256 || process.env.MERIDIAN_HEALTH_DEMO_APPROVED_PROOF_SHA256 || "";
  if (!approvedSha || approvedSha !== plan.proof_zip_sha256) {
    throw new Error("Approved proof SHA is required and must match the Meridian Health proof ZIP SHA");
  }
  if (!process.env.ACA_JOB_NAME) {
    throw new Error("ACA_JOB_NAME is required; Meridian Health Layer 1 apply must run from an approved ACA data-build job");
  }
  if (plan.restricted_detail_health_plan_extracts_present.length > 0) {
    throw new Error(`Restricted detailed health-plan extracts present: ${plan.restricted_detail_health_plan_extracts_present.join(", ")}`);
  }
}

async function setContext(client, plan, roleName) {
  await client.query("SET LOCAL row_security = on");
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [EXPECTED.tenantKey]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [EXPECTED.tenantKey]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [plan.source_release_id]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
  await client.query(`SET LOCAL ROLE ${quoteIdent(roleName)}`);
}

async function sourceVolumeCounts(client) {
  const output = {};
  for (const table of ["source_releases", "source_files", "source_file_context", "source_records", "source_field_values", "parser_executions", "gate_results"]) {
    if (table === "gate_results") {
      output[table] = Number((await rows(
        client,
        `SELECT count(*)::int AS count
           FROM ${tableRef("gate_results")}
          WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($3::text[])`,
        [EXPECTED.tenantKey, TEST_NAMESPACE, SOURCE_VOLUME_GATE_IDS],
      ))[0].count);
      continue;
    }
    output[table] = Number((await rows(
      client,
      `SELECT count(*)::int AS count
         FROM ${tableRef(table)}
        WHERE tenant_key=$1 AND test_namespace=$2`,
      [EXPECTED.tenantKey, TEST_NAMESPACE],
    ))[0].count);
  }
  return output;
}

async function sourceVolumeReadback(client, plan) {
  const counts = await sourceVolumeCounts(client);
  const releaseRows = await rows(
    client,
    `SELECT source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state, isolation_scope, writer_job_id
       FROM ${tableRef("source_releases")}
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY source_release_id`,
    [EXPECTED.tenantKey, TEST_NAMESPACE],
  );
  const fileRows = await rows(
    client,
    `SELECT source_file_id, source_release_id, file_name, content_sha256, row_count, field_count
       FROM ${tableRef("source_files")}
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY file_name`,
    [EXPECTED.tenantKey, TEST_NAMESPACE],
  );
  const contextRows = await rows(
    client,
    `SELECT source_file_id, source_release_id, tenant_key, test_namespace, source_group, context_treatment,
            demo_priority, event_id, effective_as_of::text AS effective_as_of, content_sha256
       FROM ${tableRef("source_file_context")}
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY source_file_id`,
    [EXPECTED.tenantKey, TEST_NAMESPACE],
  );
  return {
    counts,
    releases: releaseRows,
    files: fileRows,
    source_file_context: contextRows,
    source_group_counts: groupedCounts(contextRows.map((row) => ({
      source_group: row.source_group,
      row_count: Number(fileRows.find((file) => file.source_file_id === row.source_file_id)?.row_count || 0),
      field_count: Number(fileRows.find((file) => file.source_file_id === row.source_file_id)?.field_count || 0),
    })), "source_group"),
    demo_priority_counts: groupedCounts(contextRows.map((row) => ({
      demo_priority: row.demo_priority,
      row_count: Number(fileRows.find((file) => file.source_file_id === row.source_file_id)?.row_count || 0),
      field_count: Number(fileRows.find((file) => file.source_file_id === row.source_file_id)?.field_count || 0),
    })), "demo_priority"),
    exact_match: exactSourceVolumeReadback(plan, { counts, releases: releaseRows, files: fileRows, source_file_context: contextRows }),
    variances: sourceVolumeReadbackVariances(plan, { counts, releases: releaseRows, files: fileRows, source_file_context: contextRows }),
  };
}

function exactSourceVolumeCounts(plan, counts) {
  return (
    Number(counts.source_releases || 0) === 1 &&
    Number(counts.source_files || 0) === plan.file_count &&
    Number(counts.source_file_context || 0) === plan.file_count &&
    Number(counts.source_records || 0) === plan.total_source_rows &&
    Number(counts.source_field_values || 0) === plan.total_field_values &&
    Number(counts.parser_executions || 0) === 1 &&
    Number(counts.gate_results || 0) === 2
  );
}

function exactSourceVolumeReadback(plan, readback) {
  return sourceVolumeReadbackVariances(plan, readback).length === 0;
}

function sourceVolumeReadbackVariances(plan, readback) {
  const variances = [];
  if (!exactSourceVolumeCounts(plan, readback.counts || {})) {
    variances.push({ field: "counts", expected: expectedCounts(plan), actual: readback.counts || {} });
  }
  if (readback.releases?.length !== 1) {
    variances.push({ field: "source_releases", expected: 1, actual: readback.releases?.length || 0 });
  } else {
    const release = readback.releases[0];
    for (const [field, expected] of Object.entries({
      source_release_id: plan.source_release_id,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      release_version: plan.release_version,
      release_hash: plan.release_hash,
      isolation_scope: ISOLATION_SCOPE,
    })) {
      if (release[field] !== expected) variances.push({ field: `release.${field}`, expected, actual: release[field] });
    }
  }

  const actualFiles = new Map((readback.files || []).map((file) => [file.file_name, file]));
  const expectedFiles = new Map(plan.files.map((file) => [file.file_name, file]));
  for (const fileName of expectedFiles.keys()) {
    const expected = expectedFiles.get(fileName);
    const actual = actualFiles.get(fileName);
    if (!actual) {
      variances.push({ field: "file.missing", expected: fileName, actual: null });
      continue;
    }
    for (const field of ["source_file_id", "source_release_id", "content_sha256", "row_count", "field_count"]) {
      const expectedValue = field === "source_release_id" ? plan.source_release_id : expected[field];
      const actualValue = ["row_count", "field_count"].includes(field) ? Number(actual[field]) : actual[field];
      if (actualValue !== expectedValue) variances.push({ field: `file.${fileName}.${field}`, expected: expectedValue, actual: actualValue });
    }
  }
  for (const fileName of actualFiles.keys()) {
    if (!expectedFiles.has(fileName)) variances.push({ field: "file.unexpected", expected: null, actual: fileName });
  }

  const actualContext = new Map((readback.source_file_context || []).map((row) => [row.source_file_id, row]));
  const expectedContext = new Map(plan.source_file_context.map((row) => [row.source_file_id, row]));
  for (const [sourceFileId, expected] of expectedContext.entries()) {
    const actual = actualContext.get(sourceFileId);
    if (!actual) {
      variances.push({ field: "source_file_context.missing", expected: sourceFileId, actual: null });
      continue;
    }
    for (const field of ["source_release_id", "tenant_key", "test_namespace", "source_group", "context_treatment", "demo_priority", "event_id", "effective_as_of", "content_sha256"]) {
      if (actual[field] !== expected[field]) variances.push({ field: `source_file_context.${sourceFileId}.${field}`, expected: expected[field], actual: actual[field] });
    }
  }
  for (const sourceFileId of actualContext.keys()) {
    if (!expectedContext.has(sourceFileId)) variances.push({ field: "source_file_context.unexpected", expected: null, actual: sourceFileId });
  }
  return variances;
}

function expectedCounts(plan) {
  return {
    source_releases: 1,
    source_files: plan.file_count,
    source_file_context: plan.file_count,
    source_records: plan.total_source_rows,
    source_field_values: plan.total_field_values,
    parser_executions: 1,
    gate_results: 2,
  };
}

async function insertSourceRelease(client, plan) {
  await q(
    client,
    `INSERT INTO ${tableRef("source_releases")}
      (source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state,
       isolation_scope, v1_component_classification, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,'isolated_golden_slice',$6,'SUPERSEDE_WITH_V2',$7)`,
    [plan.source_release_id, EXPECTED.tenantKey, TEST_NAMESPACE, plan.release_version, plan.release_hash, ISOLATION_SCOPE, plan.execution_id],
  );
}

async function insertSourceFiles(client, plan) {
  await insertBatches(
    client,
    `INSERT INTO ${tableRef("source_files")}
      (source_file_id, source_release_id, tenant_key, test_namespace, source_uri, file_name,
       content_sha256, row_count, field_count, writer_job_id)
     VALUES `,
    ["source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_uri", "file_name", "content_sha256", "row_count", "field_count", "writer_job_id"],
    plan.files.map((file) => ({
      source_file_id: file.source_file_id,
      source_release_id: plan.source_release_id,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      source_uri: `package://${EXPECTED.datasetId}/${file.relative_path}`,
      file_name: file.file_name,
      content_sha256: file.content_sha256,
      row_count: file.row_count,
      field_count: file.field_count,
      writer_job_id: plan.execution_id,
    })),
  );
}

async function insertSourceFileContext(client, plan) {
  await insertBatches(
    client,
    `INSERT INTO ${tableRef("source_file_context")}
      (source_file_id, source_release_id, tenant_key, test_namespace, source_group, context_treatment,
       demo_priority, event_id, effective_as_of, content_sha256)
     VALUES `,
    ["source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_group", "context_treatment", "demo_priority", "event_id", "effective_as_of", "content_sha256"],
    plan.source_file_context,
  );
}

async function insertSourceRowsAndFields(client, plan, file) {
  const recordBatch = [];
  const fieldBatch = [];
  const flushReadyRowsAndFields = async () => {
    if (recordBatch.length === 0) return;
    await flushRecordBatch(client, recordBatch);
    recordBatch.length = 0;
    if (fieldBatch.length > 0) {
      await flushFieldBatch(client, fieldBatch);
      fieldBatch.length = 0;
    }
  };

  for (let rowIndex = 0; rowIndex < file.rows.length; rowIndex += 1) {
    const row = file.rows[rowIndex];
    const rowNumber = rowIndex + 1;
    const rowHash = sha256(stableJson({ path: file.relative_path, rowNumber, row }));
    const sourceRecordId = `${plan.source_release_id}:source-record:${shortHash(file.relative_path, 10)}:${rowNumber}`;
    recordBatch.push({
      source_record_id: sourceRecordId,
      source_file_id: file.source_file_id,
      source_release_id: plan.source_release_id,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      source_row_number: rowNumber,
      source_row_hash: rowHash,
      row_disposition: "MATCHED",
      row_disposition_reason: `meridian-health-source-volume:${file.file_name}`,
      writer_job_id: plan.execution_id,
    });
    for (let fieldIndex = 0; fieldIndex < file.headers.length; fieldIndex += 1) {
      const header = file.headers[fieldIndex];
      const value = row[header] == null ? "" : String(row[header]);
      fieldBatch.push({
        source_field_value_id: `${plan.source_release_id}:sfv:${rowHash.slice(0, 24)}:${String(fieldIndex + 1).padStart(2, "0")}`,
        source_record_id: sourceRecordId,
        source_file_id: file.source_file_id,
        source_release_id: plan.source_release_id,
        tenant_key: EXPECTED.tenantKey,
        test_namespace: TEST_NAMESPACE,
        source_field_id: `${shortHash(file.relative_path, 10)}:${String(fieldIndex + 1).padStart(2, "0")}:${slug(header)}`,
        source_field_name: header,
        raw_value: value,
        normalized_value: value,
        field_disposition: "PRESERVED_AS_EVIDENCE",
        target_object_type: file.object_type,
        target_field_name: slug(header),
        adapter_rule_id: `meridian-health-healthcare-source-volume-v1:${file.object_type}:${slug(header)}`,
        evidence_ref: `package://${EXPECTED.datasetId}/${file.relative_path}#row=${rowNumber}`,
        restricted: file.file_name === "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv",
        writer_job_id: plan.execution_id,
      });
    }
    if (recordBatch.length >= 1000) await flushReadyRowsAndFields();
  }
  await flushReadyRowsAndFields();
}

async function flushRecordBatch(client, batch) {
  await insertBatches(
    client,
    `INSERT INTO ${tableRef("source_records")}
      (source_record_id, source_file_id, source_release_id, tenant_key, test_namespace, source_row_number,
       source_row_hash, row_disposition, row_disposition_reason, writer_job_id)
     VALUES `,
    ["source_record_id", "source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_row_number", "source_row_hash", "row_disposition", "row_disposition_reason", "writer_job_id"],
    batch,
  );
}

async function flushFieldBatch(client, batch) {
  await insertBatches(
    client,
    `INSERT INTO ${tableRef("source_field_values")}
      (source_field_value_id, source_record_id, source_file_id, source_release_id, tenant_key, test_namespace,
       source_field_id, source_field_name, raw_value, normalized_value, field_disposition, target_object_type,
       target_field_name, adapter_rule_id, evidence_ref, restricted, writer_job_id)
     VALUES `,
    ["source_field_value_id", "source_record_id", "source_file_id", "source_release_id", "tenant_key", "test_namespace", "source_field_id", "source_field_name", "raw_value", "normalized_value", "field_disposition", "target_object_type", "target_field_name", "adapter_rule_id", "evidence_ref", "restricted", "writer_job_id"],
    batch,
  );
}

async function insertParserExecution(client, plan) {
  await q(
    client,
    `INSERT INTO ${tableRef("parser_executions")}
      (parser_execution_id, source_release_id, tenant_key, test_namespace, parser_contract_version,
       input_file_count, output_record_count, output_field_count, rejected_record_count, parser_status, writer_job_id)
     VALUES ($1,$2,$3,$4,'meridian-health-healthcare-source-volume-v1',$5,$6,$7,0,'passed',$8)`,
    [
      `${plan.source_release_id}:parser-execution-001`,
      plan.source_release_id,
      EXPECTED.tenantKey,
      TEST_NAMESPACE,
      plan.file_count,
      plan.total_source_rows,
      plan.total_field_values,
      plan.execution_id,
    ],
  );
}

async function insertGateResults(client, plan) {
  const gates = [
    ["Meridian Health-SOURCE-VOLUME-L0-L1", "source files to landed rows", plan.total_source_rows, plan.total_source_rows],
    ["Meridian Health-SOURCE-VOLUME-L1-L2", "landed rows to parsed fields", plan.total_source_rows, plan.total_field_values],
  ];
  await insertBatches(
    client,
    `INSERT INTO ${tableRef("gate_results")}
      (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
       unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
     VALUES `,
    ["gate_result_id", "tenant_key", "test_namespace", "gate_id", "transition", "input_count", "output_count", "unexplained_variance", "gate_status", "failure_classification", "repair_owner", "rerun_scope", "proof_uri", "writer_job_id"],
    gates.map(([gateId, transition, inputCount, outputCount]) => ({
      gate_result_id: `${plan.source_release_id}:${gateId}`,
      tenant_key: EXPECTED.tenantKey,
      test_namespace: TEST_NAMESPACE,
      gate_id: gateId,
      transition,
      input_count: inputCount,
      output_count: outputCount,
      unexplained_variance: 0,
      gate_status: "passed",
      failure_classification: null,
      repair_owner: "foundation-v2-agent",
      rerun_scope: "meridian-health-source-volume",
      proof_uri: `proof://foundation-v2/${plan.execution_id}/${gateId}`,
      writer_job_id: plan.execution_id,
    })),
  );
}

async function runSourceVolumeSelfTest() {
  const executionContractTests = runExecutionContractSelfTests();
  const schemaProofTests = meridianSchemaProofTests();
  const calls = [];
  const client = {
    async query(sql, params = []) {
      if (String(sql).includes("source_records")) calls.push({ table: "source_records", param_count: params.length });
      if (String(sql).includes("source_field_values")) calls.push({ table: "source_field_values", param_count: params.length });
      return { rows: [] };
    },
  };
  const headers = Array.from({ length: 1001 }, (_, index) => `field_${String(index + 1).padStart(4, "0")}`);
  const row = Object.fromEntries(headers.map((header, index) => [header, `value-${index + 1}`]));
  await insertSourceRowsAndFields(
    client,
    { execution_id: "meridian-health-source-volume-self-test", source_release_id: "meridian-health-source-volume-self-test" },
    {
      relative_path: "source_system_extracts/self-test.csv",
      file_name: "self-test.csv",
      source_file_id: "meridian-health-source-volume-self-test:file",
      object_type: "self_test_object",
      headers,
      rows: [row],
    },
  );
  const firstWrite = calls[0]?.table || "";
  const recordWrites = calls.filter((call) => call.table === "source_records").length;
  const fieldWrites = calls.filter((call) => call.table === "source_field_values").length;
  const passed = firstWrite === "source_records" && recordWrites === 1 && fieldWrites === 1;
  if (!passed) {
    throw new Error(`Meridian Health source-volume row/field FK write order failed: ${JSON.stringify(calls)}`);
  }
  return {
    status: "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_SELF_TEST_PASSED",
    first_write: firstWrite,
    record_writes: recordWrites,
    field_writes: fieldWrites,
    field_values_replayed: headers.length,
    execution_contract_tests: executionContractTests,
    schema_proof_tests: schemaProofTests,
  };
}

function runExecutionContractSelfTests() {
  const basePlan = {
    tenant_key: EXPECTED.tenantKey,
    test_namespace: TEST_NAMESPACE,
    source_release_id: EXPECTED_SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    isolation_scope: ISOLATION_SCOPE,
    file_count: 54,
  };
  const cases = [
    ["wrong_schema", { database_schema: "foundation_v2_healthcare_gs" }],
    ["wrong_tenant", { tenant_key: "healthcare-demo-new" }],
    ["wrong_namespace", { test_namespace: "foundation-v2-healthcare-progressive-golden-slice-v1" }],
    ["wrong_release", { source_release_id: "healthcare-demo-new-foundation-v2-progressive-golden-slice-v1" }],
    ["wrong_isolation_scope", { isolation_scope: "ISOLATED_MERIDIAN_HEALTH_DEMO_LAB_ONLY" }],
    ["writer_role_mismatch", { writer_role: "foundation_v2_healthcare_gs_writer" }],
    ["reader_role_mismatch", { reader_role: "foundation_v2_healthcare_gs_reader" }],
    ["same_counts_different_content", { source_release_id: `${EXPECTED.datasetId}:${SOURCE_VOLUME_RELEASE_VERSION}:samecounts00` }],
  ];
  const results = cases.map(([caseId, overrides]) => {
    try {
      assertMeridianExecutionContract(basePlan, overrides);
      return { case_id: caseId, expected: "blocked", actual: "allowed", passed: false };
    } catch (error) {
      return { case_id: caseId, expected: "blocked", actual: "blocked", passed: true, error: error.message };
    }
  });
  const wrongFileContextCountPlan = { ...basePlan, file_count: 53 };
  try {
    assertMeridianExecutionContract(wrongFileContextCountPlan);
    results.push({ case_id: "source_file_context_row_mismatch", expected: "blocked", actual: "allowed", passed: false });
  } catch (error) {
    results.push({ case_id: "source_file_context_row_mismatch", expected: "blocked", actual: "blocked", passed: true, error: error.message });
  }
  if (results.some((result) => !result.passed)) {
    throw new Error(`Meridian Health execution contract self-test failed: ${JSON.stringify(results.filter((result) => !result.passed))}`);
  }
  return results;
}

function meridianSchemaProofTests() {
  return [
    {
      case_id: "missing_rls_policy",
      expected: "blocked",
      proof_query: `SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = '${DATABASE_SCHEMA}.source_file_context'::regclass`,
    },
    {
      case_id: "non_aca_execution",
      expected: "blocked_before_db_connect",
      required_env: ["MERIDIAN_HEALTH_DEMO_LAYER1_APPLY_APPROVED=true", "MERIDIAN_HEALTH_DEMO_APPROVED_PROOF_SHA256=<exact proof sha>", "ACA_JOB_NAME=<approved data-build job>"],
    },
    {
      case_id: "file_hash_mismatch",
      expected: "blocked",
      comparison: "source_files.content_sha256 and source_file_context.content_sha256 must match package manifest hashes",
    },
  ];
}

async function insertBatches(client, sqlPrefix, columns, rowsToInsert) {
  if (rowsToInsert.length === 0) return;
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
  for (let offset = 0; offset < rowsToInsert.length; offset += chunkSize) {
    const chunk = rowsToInsert.slice(offset, offset + chunkSize);
    const params = [];
    const valuesSql = chunk.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        params.push(row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(",")})`;
    });
    await client.query(`${sqlPrefix}${valuesSql.join(",")}`, params);
  }
}

function writePlanProof(outDir, plan) {
  writeJson(proofRef(outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_EXPECTED_COUNTS.json"), publicPlanSummary(plan));
  writeJson(proofRef(outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_DATABASE_TARGET_CONTRACT.json"), plan.database_target_contract);
  writeJson(proofRef(outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_SCHEMA_PROOF_TESTS.json"), meridianSchemaProofTests());
  writeCsv(
    proofRef(outDir, "MERIDIAN_HEALTH_DEMO_SOURCE_VOLUME_FILES.csv"),
    ["file_name", "source_group", "context_treatment", "demo_priority", "event_id", "effective_as_of", "source_family", "row_count", "field_count", "content_sha256"],
    plan.files.map((file) => ({
      file_name: file.file_name,
      source_group: file.source_group,
      context_treatment: file.context_treatment,
      demo_priority: file.demo_priority,
      event_id: file.event_id,
      effective_as_of: file.effective_as_of,
      source_family: file.source_family,
      row_count: file.row_count,
      field_count: file.field_count,
      content_sha256: file.content_sha256,
    })),
  );
}

function manifest(status, plan, extra) {
  return {
    status,
    generated_at: new Date().toISOString(),
    mutation_executed: status.endsWith("_APPLIED"),
    ...publicPlanSummary(plan),
    ...extra,
  };
}

function publicPlanSummary(plan) {
  return {
    tenant_key: plan.tenant_key,
    dataset_id: plan.dataset_id,
    dataset_version: plan.dataset_version,
    test_namespace: plan.test_namespace,
    source_release_id: plan.source_release_id,
    foundation_release_alias: plan.foundation_release_alias,
    execution_id: plan.execution_id,
    release_version: plan.release_version,
    release_hash: plan.release_hash,
    isolation_scope: plan.isolation_scope,
    package_dir: plan.package_dir,
    proof_zip: plan.proof_zip,
    proof_zip_sha256: plan.proof_zip_sha256,
    file_count: plan.file_count,
    source_group_counts: plan.source_group_counts,
    demo_priority_counts: plan.demo_priority_counts,
    total_source_rows: plan.total_source_rows,
    total_field_values: plan.total_field_values,
    source_field_value_rule: plan.source_field_value_rule,
    max_columns: plan.max_columns,
    database_schema: plan.database_schema,
    database_target_contract: plan.database_target_contract,
    source_file_context_rows: plan.source_file_context_rows,
    expected_counts: expectedCounts(plan),
    schema_proof_tests: meridianSchemaProofTests(),
    restricted_detail_health_plan_extracts_present: plan.restricted_detail_health_plan_extracts_present,
  };
}

function parseCsvHeaders(text) {
  const [first = ""] = text.split(/\n/u);
  return first.split(",").map((header) => header.replace(/^"|"$/g, ""));
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

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function shortHash(value, length = 12) {
  return sha256(value).slice(0, length);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}

function tableRef(tableName) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(tableName)}`;
}
