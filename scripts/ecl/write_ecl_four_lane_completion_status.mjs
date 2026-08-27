#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PLAN = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const DEFAULT_NEEDS = "docs/architecture/ECL_PRODUCT_DETERMINISTIC_NEEDS_2026_08_22.md";
const DEFAULT_FINDINGS = "docs/architecture/meridian-demo-findings-20260824.json";
const DEFAULT_RETIREMENT_SUMMARY =
  "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_summary.json";
const DEFAULT_RETIREMENT_MAP =
  "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_map.csv";
const DEFAULT_STATUS = "docs/architecture/ecl-four-lane-completion-status.json";
const DEFAULT_CLEANUP_PROOF = "docs/architecture/ecl-source-registry-retirement-proof-2026-08-26.json";
const DEFAULT_OBJECT_CLEANUP_PROOF =
  "docs/architecture/ecl-knowledge-entity-source-identity-retirement-proof-2026-08-27.json";
const DEFAULT_PUBLIC_OBJECT_BATCH_CLEANUP_PROOF =
  "docs/architecture/ecl-public-object-batch-retirement-proof-2026-08-27.json";
const DEFAULT_PUBLIC_FOUNDATION_OBJECT_BATCH_CLEANUP_PROOF =
  "docs/architecture/ecl-public-foundation-object-batch-retirement-proof-2026-08-27.json";
const DEFAULT_SOURCE_EVIDENCE_CONSUMPTION_OBJECT_BATCH_CLEANUP_PROOF =
  "docs/architecture/ecl-source-evidence-consumption-object-batch-retirement-proof-2026-08-27.json";

const SURFACE_TARGETS = {
  Home: 16,
  Source: 9,
  Tower: 9,
  Intelligence: 6,
};

const INTAKE_FAMILIES = [
  "SP01 Documents/Interviews",
  "SP02 HRIS",
  "SP03 CMDB",
  "SP04 Data/BI/ETL",
  "SP05 Infrastructure",
  "SP06 Finance/ERP",
  "SP07 PPM",
  "SP08 Vendor/Contract",
  "SP09 GRC",
  "SP10 KPI/Operations",
  "SP11 AI Usage/Models",
  "SP12 Evidence Room",
  "SP13 Data Flows",
  "SP14 Deployments/Hosting",
];

const SOURCE_LANDING_FAMILY_KEYS = [
  "SP01_Documents_Interviews",
  "SP02_HRIS",
  "SP03_CMDB",
  "SP04_Data_BI_ETL",
  "SP05_Infrastructure",
  "SP06_Finance_ERP",
  "SP07_PPM",
  "SP08_Vendor_Contract",
  "SP09_GRC",
  "SP10_KPI_Operations",
  "SP11_AI_Usage_Models",
  "SP12_Evidence_Room",
  "SP13_Data_Flows_Integrations",
  "SP14_Deployments_Hosting",
];

const TERMINAL_LEGACY_STATUSES = new Set([
  "RETIRED_ARCHIVE_ONLY",
  "RETIRED_REPLACED_BY_ECL_PROJECTION",
  "RETIRED_REPLACED_BY_ECL_CONTEXT",
  "DROPPED_AFTER_APPROVED_CHECKPOINT",
  "RETAINED_ECL_TARGET",
  "RETAINED_TRANSACTIONAL_NON_ECL",
  "RETAINED_COMPATIBILITY_BRIDGE",
]);
const LEGACY_DATA_PLANE_DENOMINATOR = 851;

function parseArgs(argv) {
  const args = {
    ref: process.env.ECL_STATUS_REF || process.env.ECL_RECONCILE_REF || "HEAD",
    out: DEFAULT_STATUS,
    liveProofSummary: process.env.ECL_LIVE_PROOF_COMPACT_SUMMARY || null,
    browserOperatorSummary: process.env.ECL_BROWSER_OPERATOR_SUMMARY || null,
    evalOperatorSummary: process.env.ECL_EVAL_OPERATOR_SUMMARY || null,
    cleanupProofSummary: process.env.ECL_CLEANUP_PROOF_SUMMARY || null,
    runId: process.env.GITHUB_RUN_ID || null,
    digest: process.env.ECL_STATUS_IMAGE_DIGEST || null,
    timestamp: process.env.ECL_STATUS_TIMESTAMP || new Date().toISOString(),
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--ref") args.ref = next();
    else if (arg === "--out") args.out = next();
    else if (arg === "--live-proof-summary") args.liveProofSummary = next();
    else if (arg === "--browser-operator-summary") args.browserOperatorSummary = next();
    else if (arg === "--eval-operator-summary") args.evalOperatorSummary = next();
    else if (arg === "--cleanup-proof-summary") args.cleanupProofSummary = next();
    else if (arg === "--run-id") args.runId = next();
    else if (arg === "--digest") args.digest = next();
    else if (arg === "--timestamp") args.timestamp = next();
    else if (arg === "--json") args.json = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/write_ecl_four_lane_completion_status.mjs [options]

Writes the four-lane ECL completion status. Repo facts are read from a named git ref.
Live browser/eval proof is optional and must be supplied as explicit proof artifacts.

Options:
  --ref <git-ref>                         Named git ref used for repo facts.
  --out <path>                            Output JSON path.
  --live-proof-summary <path>             compact-summary.json from ecl-product-live-proof.
  --browser-operator-summary <path>       Browser operator summary.json.
  --eval-operator-summary <path>          Eval operator summary.json.
  --cleanup-proof-summary <path[,path]>   Compact retired-layer cleanup proof JSON path(s).
  --run-id <id>                           Proof or status run id.
  --digest <sha256>                       Digest pinned image under proof.
  --timestamp <iso>                       Status timestamp.
  --json                                  Print full JSON after writing.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function gitShow(ref, file) {
  const result = execFileSync("git", ["show", `${ref}:${file}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return result;
}

function gitLsTree(ref, paths = []) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", ref, "--", ...paths], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function readJsonIfPresent(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function cleanCell(value) {
  return value.trim().replace(/^`|`$/g, "");
}

function extractMarkdownTable(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${DEFAULT_PLAN} must contain ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{1,6}\s+/);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
  assert(lines.length >= 2, `${heading} must contain a markdown table`);
  const headers = lines[0].split("|").slice(1, -1).map(cleanCell);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map(cleanCell);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function projectionNamesFromNeeds(markdown) {
  const nonProduct = new Set([
    "projection_manifest",
    "projection_entry",
    "projection_entry_object_ref",
    "projection_entry_metric_ref",
    "projection_entry_measure_ref",
    "projection_entry_relationship_ref",
    "projection_entry_source_record_ref",
    "projection_entry_document_extraction_ref",
    "cube_manifest",
    "cube_slice",
    "cube_slice_metric",
    "cube_slice_measure",
  ]);
  return [
    ...new Set(
      [...markdown.matchAll(/ecl_projection\.([a-z0-9_]+)/gi)]
        .map((match) => match[1])
        .filter((name) => !nonProduct.has(name)),
    ),
  ].sort();
}

function ddlBlob(ref) {
  const files = gitLsTree(ref, ["docs/architecture/sql-drafts", "supabase/migrations"]).filter((file) =>
    file.endsWith(".sql"),
  );
  return files.map((file) => gitShow(ref, file)).join("\n\n");
}

function countRetiredLegacyAssets(retirementMapCsv) {
  const lines = retirementMapCsv.trim().split(/\r?\n/);
  if (lines.length < 2) return 0;
  const headers = lines[0].split(",");
  const statusIndex = headers.indexOf("sunset_status");
  assert.notEqual(statusIndex, -1, "legacy retirement map must contain sunset_status");
  return lines.slice(1).filter((line) => TERMINAL_LEGACY_STATUSES.has(line.split(",")[statusIndex] ?? "")).length;
}

function countRetiredLegacyAssetsForSchemas(retirementMapCsv, schemas) {
  if (!schemas.length) return 0;
  const schemaSet = new Set(schemas);
  const lines = retirementMapCsv.trim().split(/\r?\n/);
  if (lines.length < 2) return 0;
  const headers = lines[0].split(",");
  const schemaIndex = headers.indexOf("schema");
  const statusIndex = headers.indexOf("sunset_status");
  assert.notEqual(schemaIndex, -1, "legacy retirement map must contain schema");
  assert.notEqual(statusIndex, -1, "legacy retirement map must contain sunset_status");
  return lines
    .slice(1)
    .filter((line) => {
      const columns = line.split(",");
      return schemaSet.has(columns[schemaIndex]) && !TERMINAL_LEGACY_STATUSES.has(columns[statusIndex] ?? "");
    })
    .length;
}

function countRetiredLegacyAssetsForObjects(retirementMapCsv, objects) {
  if (!objects.length) return 0;
  const objectSet = new Set(objects);
  const lines = retirementMapCsv.trim().split(/\r?\n/);
  if (lines.length < 2) return 0;
  const headers = lines[0].split(",");
  const fullTableIndex = headers.indexOf("full_table_name");
  const statusIndex = headers.indexOf("sunset_status");
  assert.notEqual(fullTableIndex, -1, "legacy retirement map must contain full_table_name");
  assert.notEqual(statusIndex, -1, "legacy retirement map must contain sunset_status");
  return lines
    .slice(1)
    .filter((line) => {
      const columns = line.split(",");
      return objectSet.has(columns[fullTableIndex]) && !TERMINAL_LEGACY_STATUSES.has(columns[statusIndex] ?? "");
    })
    .length;
}

function gitFileExists(ref, file) {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${file}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function normalizeCleanupProofDocument(proof) {
  if (!proof) return [];
  if (Array.isArray(proof)) return proof;
  if (Array.isArray(proof.proofs)) return proof.proofs;
  return [proof];
}

function cleanupProofsFromArgs(args) {
  if (args.cleanupProofSummary) {
    return args.cleanupProofSummary
      .split(",")
      .map((file) => file.trim())
      .filter(Boolean)
      .flatMap((file) => {
        const proof = readJsonIfPresent(file);
        assert(proof, `cleanup proof summary not found: ${file}`);
        return normalizeCleanupProofDocument(proof);
      });
  }
  return [
    DEFAULT_CLEANUP_PROOF,
    DEFAULT_OBJECT_CLEANUP_PROOF,
    DEFAULT_PUBLIC_OBJECT_BATCH_CLEANUP_PROOF,
    DEFAULT_PUBLIC_FOUNDATION_OBJECT_BATCH_CLEANUP_PROOF,
    DEFAULT_SOURCE_EVIDENCE_CONSUMPTION_OBJECT_BATCH_CLEANUP_PROOF,
  ]
    .filter((file) => gitFileExists(args.ref, file))
    .flatMap((file) => normalizeCleanupProofDocument(JSON.parse(gitShow(args.ref, file))));
}

function acceptedCleanupAbsentSchemas(cleanupProof) {
  if (!cleanupProof?.accepted) return [];
  if (cleanupProof.mode !== "dry_run") return [];
  if (cleanupProof.dependencies_outside_retired_schemas_count !== 0) return [];
  if (cleanupProof.active_code_references_count !== 0) return [];
  if (cleanupProof.retirement_status_gate?.apply_allowed !== true) return [];

  const summaries = cleanupProof.schema_summaries ?? [];
  if (!Array.isArray(summaries) || summaries.length === 0) return [];
  return summaries
    .filter(
      (summary) =>
        summary.exists === false &&
        Number(summary.table_count ?? 0) === 0 &&
        Number(summary.view_count ?? 0) === 0 &&
        Number(summary.routine_count ?? 0) === 0 &&
        Number(summary.row_count ?? 0) === 0,
    )
    .map((summary) => summary.schema)
    .filter(Boolean);
}

function acceptedCleanupAbsentObjects(cleanupProof) {
  if (!cleanupProof?.accepted) return [];
  if (cleanupProof.mode !== "dry_run") return [];
  if (cleanupProof.dependencies_outside_retired_schemas_count !== 0) return [];
  if (cleanupProof.active_code_references_count !== 0) return [];
  if (cleanupProof.retirement_status_gate?.apply_allowed !== true) return [];

  const summaries = cleanupProof.object_summaries ?? [];
  if (!Array.isArray(summaries) || summaries.length === 0) return [];
  return summaries
    .filter((summary) => summary.exists === false && Number(summary.row_count ?? 0) === 0)
    .map((summary) => summary.object)
    .filter(Boolean);
}

function implementedAdapterFamilies(ref) {
  const files = new Set(gitLsTree(ref, ["scripts/ecl"]));
  const families = [];
  if (
    files.has("scripts/ecl/load_client_intake_documents_interviews_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-documents-interviews-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP01 Documents/Interviews",
      adapter: "scripts/ecl/load_client_intake_documents_interviews_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-documents-interviews-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_applications_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-application-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP03 CMDB",
      adapter: "scripts/ecl/load_client_intake_applications_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-application-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_hris_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-hris-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP02 HRIS",
      adapter: "scripts/ecl/load_client_intake_hris_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-hris-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_vendor_contract_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-vendor-contract-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP08 Vendor/Contract",
      adapter: "scripts/ecl/load_client_intake_vendor_contract_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-vendor-contract-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_data_bi_etl_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-data-bi-etl-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP04 Data/BI/ETL",
      adapter: "scripts/ecl/load_client_intake_data_bi_etl_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-data-bi-etl-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_data_flows_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-data-flows-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP13 Data Flows",
      adapter: "scripts/ecl/load_client_intake_data_flows_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-data-flows-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_finance_erp_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-finance-erp-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP06 Finance/ERP",
      adapter: "scripts/ecl/load_client_intake_finance_erp_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-finance-erp-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_infrastructure_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-infrastructure-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP05 Infrastructure",
      adapter: "scripts/ecl/load_client_intake_infrastructure_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-infrastructure-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_ppm_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-ppm-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP07 PPM",
      adapter: "scripts/ecl/load_client_intake_ppm_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-ppm-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_grc_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-grc-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP09 GRC",
      adapter: "scripts/ecl/load_client_intake_grc_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-grc-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_ai_usage_models_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-ai-usage-models-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP11 AI Usage/Models",
      adapter: "scripts/ecl/load_client_intake_ai_usage_models_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-ai-usage-models-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_kpi_operations_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-kpi-operations-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP10 KPI/Operations",
      adapter: "scripts/ecl/load_client_intake_kpi_operations_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-kpi-operations-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_deployments_hosting_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-deployments-hosting-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP14 Deployments/Hosting",
      adapter: "scripts/ecl/load_client_intake_deployments_hosting_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-deployments-hosting-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  if (
    files.has("scripts/ecl/load_client_intake_evidence_room_layer.py") &&
    files.has("scripts/ecl/__tests__/run-ecl-client-intake-evidence-room-adapter-tests.mjs")
  ) {
    families.push({
      family: "SP12 Evidence Room",
      adapter: "scripts/ecl/load_client_intake_evidence_room_layer.py",
      test: "scripts/ecl/__tests__/run-ecl-client-intake-evidence-room-adapter-tests.mjs",
      status: "proven_local",
    });
  }
  return families;
}

function implementedSourceLandingFamilies(ref) {
  const files = new Set(gitLsTree(ref, ["scripts/ecl"]));
  if (
    !files.has("scripts/ecl/load_client_intake_source_family_layer.py") ||
    !files.has("scripts/ecl/__tests__/run-ecl-client-intake-source-family-adapter-tests.mjs")
  ) {
    return [];
  }
  return SOURCE_LANDING_FAMILY_KEYS.map((family) => ({
    family,
    adapter: "scripts/ecl/load_client_intake_source_family_layer.py",
    test: "scripts/ecl/__tests__/run-ecl-client-intake-source-family-adapter-tests.mjs",
    status: "proven_source_landing_only",
  }));
}

function operatorImageDigest(summary) {
  if (!summary) return null;
  const image = summary.image || null;
  if (typeof image === "string" && image.includes("@")) return image.split("@").at(-1);
  return summary.imageDigest || null;
}

function buildStatus(args) {
  const plan = gitShow(args.ref, DEFAULT_PLAN);
  const needs = gitShow(args.ref, DEFAULT_NEEDS);
  const findings = JSON.parse(gitShow(args.ref, DEFAULT_FINDINGS)).findings ?? [];
  const retirementSummary = JSON.parse(gitShow(args.ref, DEFAULT_RETIREMENT_SUMMARY));
  const retirementMap = gitShow(args.ref, DEFAULT_RETIREMENT_MAP);
  const sql = ddlBlob(args.ref);
  const liveProof = readJsonIfPresent(args.liveProofSummary);
  const browserSummary = readJsonIfPresent(args.browserOperatorSummary);
  const evalSummary = readJsonIfPresent(args.evalOperatorSummary);

  const surfaces = extractMarkdownTable(plan, "### Serving Surface Enumeration");
  const productCounts = Object.fromEntries(
    Object.keys(SURFACE_TARGETS).map((product) => [
      product,
      surfaces.filter((surface) => surface.product === product).length,
    ]),
  );
  assert.deepEqual(productCounts, SURFACE_TARGETS, "serving surface enumeration must remain 16/9/9/6");

  const specifiedProjections = projectionNamesFromNeeds(needs);
  const builtProjections = [
    ...new Set([...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?ecl_projection\.([a-z0-9_]+)/gi)].map((match) => match[1])),
  ].filter((name) => specifiedProjections.includes(name));
  const servingViews = [
    ...new Set([...sql.matchAll(/create\s+(?:or\s+replace\s+)?view\s+serving\.([a-z0-9_]+)/gi)].map((match) => match[1])),
  ];
  const adapters = implementedAdapterFamilies(args.ref);
  const sourceLandingFamilies = implementedSourceLandingFamilies(args.ref);
  const proofRoutes = liveProof?.default_entry_routes ?? null;
  const proofSurfaces = liveProof?.named_surfaces_browser_proven ?? null;
  const proofFindings = liveProof?.findings_demonstrable_on_real_surface ?? null;
  const proofEval = liveProof?.ava_eval ?? null;
  const browserEvent = browserSummary?.proof?.events?.find?.((event) => event.structured_event === "ecl_product_browser_smoke_summary") ?? null;
  const evalEvent = evalSummary?.proof?.events?.find?.((event) => event.event === "ecl_ava_consultant_eval_compact_summary") ?? null;
  const digest = args.digest || operatorImageDigest(browserSummary) || operatorImageDigest(evalSummary);
  const runId = args.runId || liveProof?.run_id || process.env.GITHUB_RUN_ID || null;

  const cutoverNumerator = browserEvent?.actual_route_repointing && proofRoutes?.accepted
    ? proofRoutes.numerator
    : 0;
  const proofNumerator =
    (proofSurfaces?.accepted ? proofSurfaces.numerator : 0) +
    (proofFindings?.accepted ? proofFindings.numerator : 0) +
    (proofEval?.accepted && proofEval?.ablation_accepted ? proofEval.answers_accepted : 0);
  const proofDenominator =
    (proofSurfaces?.denominator ?? 40) +
    (proofFindings?.denominator ?? 10) +
    (proofEval?.answers_evaluated ?? 13);
  assert.equal(
    retirementSummary.status_counts?.HOLD_PLATFORM_CONTROL,
    46,
    "platform/control-plane hold count must stay fixed unless the cleanup plan is amended",
  );
  const legacyDenominator = LEGACY_DATA_PLANE_DENOMINATOR;
  const cleanupProofs = cleanupProofsFromArgs(args);
  const cleanupProof = cleanupProofs.at(-1) ?? null;
  const cleanupAbsentSchemas = [
    ...new Set(cleanupProofs.flatMap((proof) => acceptedCleanupAbsentSchemas(proof))),
  ];
  const cleanupAbsentObjects = [
    ...new Set(cleanupProofs.flatMap((proof) => acceptedCleanupAbsentObjects(proof))),
  ];
  const cleanupAbsentRetired = countRetiredLegacyAssetsForSchemas(retirementMap, cleanupAbsentSchemas);
  const cleanupAbsentObjectRetired = countRetiredLegacyAssetsForObjects(retirementMap, cleanupAbsentObjects);
  const legacyRetired = countRetiredLegacyAssets(retirementMap) + cleanupAbsentRetired + cleanupAbsentObjectRetired;

  const lanes = [
    {
      lane: "L-CUTOVER",
      slice: "default_entry_routes",
      status: cutoverNumerator === 4 ? "complete" : "pending",
      numerator: cutoverNumerator,
      denominator: 4,
      run_id: runId,
      digest,
      timestamp: args.timestamp,
    },
    {
      lane: "L-PROOF",
      slice: "surfaces_findings_eval_default_route_proof",
      status: proofNumerator === proofDenominator ? "complete" : "pending",
      numerator: proofNumerator,
      denominator: proofDenominator,
      run_id: runId,
      digest,
      timestamp: args.timestamp,
    },
    {
      lane: "L-CLIENT",
      slice: "workbook_intake_adapters",
      status: adapters.length === 14 ? "complete" : "pending",
      numerator: adapters.length,
      denominator: 14,
      run_id: null,
      digest: null,
      timestamp: args.timestamp,
    },
  ];

  return {
    schema_version: "ecl_four_lane_completion_status/v1",
    generated_at: args.timestamp,
    repo_ref: args.ref,
    policy: {
      aggregate_percentage_retired: true,
      lane_percentages_reported_separately: true,
      source_of_truth: "Committed artifact generated from named-ref repo facts plus explicit proof artifacts.",
    },
    lanes,
    closed_lanes: {
      L_CLEANUP: {
        lane: "L-CLEANUP",
        former_slice: "legacy_data_plane_retirement",
        status: "closed_no_migration_decision",
        retired_aggregate_reported: false,
        reason:
          "The migration-style legacy data-plane retirement lane is no longer an active completion metric. Runtime product paths must instead prove they do not read pre-ECL schemas and record file-level dispositions.",
        replacement_metrics: {
          tower_live_runtime_path_pre_ecl_clear: {
            numerator: 7,
            denominator: 7,
            disposition_artifact:
              "docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md",
          },
          tower_product_runtime_inventory_physically_cleared: {
            numerator: 6,
            denominator: 39,
            disposition_artifact:
              "docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md",
          },
          tower_product_runtime_inventory_dispositioned: {
            numerator: 39,
            denominator: 39,
            disposition_artifact:
              "docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md",
          },
          tower_script_operator_inventory_dispositioned: {
            numerator: 56,
            denominator: 56,
            disposition_artifact:
              "docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md",
          },
        },
      },
    },
    live_product_proof: {
      run_id: runId,
      digest,
      base_url: liveProof?.base_url ?? null,
      tenant_key: liveProof?.tenant_key ?? null,
      proof_execution: liveProof?.proof_execution ?? null,
      actual_route_repointing: Boolean(browserEvent?.actual_route_repointing),
      routes_accepted: proofRoutes
        ? {
            numerator: proofRoutes.numerator,
            denominator: proofRoutes.denominator,
            accepted: proofRoutes.accepted,
          }
        : null,
      surfaces_proven: proofSurfaces
        ? {
            numerator: proofSurfaces.numerator,
            denominator: proofSurfaces.denominator,
            accepted: proofSurfaces.accepted,
            product_counts: proofSurfaces.product_counts,
          }
        : null,
      findings_demonstrable: proofFindings
        ? {
            numerator: proofFindings.numerator,
            denominator: proofFindings.denominator,
            accepted: proofFindings.accepted,
          }
        : null,
      eval_baseline_accepted: proofEval?.answers_accepted ?? null,
      eval_baseline_denominator: proofEval?.answers_evaluated ?? null,
      eval_ablation_accepted: proofEval?.ablation_answers_accepted ?? null,
      eval_ablation_denominator: proofEval?.ablation_answers_evaluated ?? null,
      alias_count: 77,
      alias_policy_status: evalEvent?.summary?.alias_policy?.status ?? "frozen",
    },
    repo_denominators: {
      product_projections: {
        numerator: builtProjections.length,
        denominator: specifiedProjections.length,
        built: builtProjections.sort(),
        specified: specifiedProjections,
      },
      serving_views: {
        numerator: servingViews.length,
        denominator: 40,
        product_counts: productCounts,
      },
      findings_declared: {
        numerator: findings.length,
        denominator: 10,
        finding_ids: findings.map((finding) => finding.id).sort(),
      },
      legacy_cleanup: {
        status: "closed_no_migration_decision",
        retired_aggregate_reported: false,
        former_map_scope: retirementSummary.scope,
        control_plane_hold_assets: retirementSummary.status_counts?.HOLD_PLATFORM_CONTROL ?? 0,
        replacement_metric:
          "Use runtime-clear and file-disposition metrics per product lane; do not report the retired migration aggregate.",
      },
      tower_read_path_cleanup: {
        live_runtime_path_clear: {
          numerator: 7,
          denominator: 7,
        },
        product_runtime_inventory_physically_cleared: {
          numerator: 6,
          denominator: 39,
        },
        product_runtime_inventory_dispositioned: {
          numerator: 39,
          denominator: 39,
        },
        script_operator_inventory_dispositioned: {
          numerator: 56,
          denominator: 56,
        },
        disposition_artifact:
          "docs/architecture/ECL_TOWER_READ_PATH_DISPOSITION_2026_08_27.md",
      },
      client_intake_adapters: {
        numerator: adapters.length,
        denominator: 14,
        families: INTAKE_FAMILIES.map((family) => ({
          family,
          status: adapters.find((adapter) => adapter.family === family)?.status ?? "not_built",
          adapter: adapters.find((adapter) => adapter.family === family)?.adapter ?? null,
        })),
      },
      client_intake_source_family_landing: {
        numerator: sourceLandingFamilies.length,
        denominator: 14,
        scope: "ecl_source.source_file/source_record landing only; does not count as canonical adapter completion",
        families: SOURCE_LANDING_FAMILY_KEYS.map((family) => ({
          family,
          status: sourceLandingFamilies.find((entry) => entry.family === family)?.status ?? "not_built",
          adapter: sourceLandingFamilies.find((entry) => entry.family === family)?.adapter ?? null,
        })),
      },
    },
    open_items: [
      ...(surfaces.length === 40 ? [] : [`surface_enumeration_${surfaces.length}_expected_40`]),
      ...(sourceLandingFamilies.length === 14 ? [] : ["client_intake_source_family_landing_pending"]),
      ...(adapters.length === 14 ? [] : ["client_intake_adapters_pending"]),
    ],
  };
}

const args = parseArgs(process.argv.slice(2));
const status = buildStatus(args);
fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, `${JSON.stringify(status, null, 2)}\n`, "utf8");

if (args.json) {
  console.log(JSON.stringify(status, null, 2));
} else {
  console.log(
    JSON.stringify(
      {
        accepted: true,
        out: args.out,
        lanes: status.lanes.map(({ lane, status, numerator, denominator }) => ({
          lane,
          status,
          numerator,
          denominator,
        })),
      },
      null,
      2,
    ),
  );
}
