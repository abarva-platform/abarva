#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { checksumFile, readCsv, writeCsv } from "../lib/v6-v7/csv.mjs";
import { tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/multi-tenant-data-plane-load-plan");
const owner = "AbarVa data-plane operator";
const modules = ["home", "tower", "intelligence", "moves", "source"];
const internalTerms = [/\bV6\b/i, /\bV7\b/i, /source_record_id/i, /\brecord ID\b/i, /\bloaded records\b/i, /\bloaded view\b/i, /\bsubstrate\b/i];

const manifestHeaders = [
  "tenant_key",
  "artifact_type",
  "source_path",
  "target_table_or_store",
  "record_count",
  "checksum_hash",
  "active_candidate_status",
  "overwrite_policy",
  "rollback_key",
  "validation_rule",
  "owner",
  "load_required",
  "reason_if_not_loaded",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rel(file) {
  return path.relative(repoRoot, file);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function csvRows(file) {
  return exists(file) ? readCsv(file).length : 0;
}

function jsonRows(file, key = null) {
  if (!exists(file)) return 0;
  const payload = readJson(file);
  if (key && Array.isArray(payload[key])) return payload[key].length;
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload.story_blocks)) return payload.story_blocks.length;
  if (Array.isArray(payload.visual_specs)) return payload.visual_specs.length;
  if (Array.isArray(payload.tenantPacks)) {
    return payload.tenantPacks.reduce(
      (sum, pack) => sum + (pack.files ?? []).reduce((fileSum, file) => fileSum + (file.rows?.length ?? 0), 0),
      0,
    );
  }
  return 1;
}

function checksum(file) {
  return exists(file) ? checksumFile(file) : "";
}

function addRow(rows, {
  tenantKey,
  artifactType,
  file,
  target,
  recordCount,
  status = "candidate",
  overwritePolicy = "insert_new_candidate_version_only",
  rollbackKey,
  validationRule,
  loadRequired = "yes",
  reason = "",
}) {
  rows.push({
    tenant_key: tenantKey,
    artifact_type: artifactType,
    source_path: rel(file),
    target_table_or_store: target,
    record_count: recordCount,
    checksum_hash: checksum(file),
    active_candidate_status: status,
    overwrite_policy: overwritePolicy,
    rollback_key: rollbackKey,
    validation_rule: validationRule,
    owner,
    load_required: loadRequired,
    reason_if_not_loaded: reason,
  });
}

function datasetRoot(config) {
  return path.join(repoRoot, config.sourceDataset);
}

function addTenantInputRows(rows, config) {
  const base = path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey);
  const standardDir = path.join(base, "standard-2026-07-v3");
  for (const fileName of fs.readdirSync(standardDir).filter((file) => file.endsWith(".csv")).sort()) {
    const file = path.join(standardDir, fileName);
    addRow(rows, {
      tenantKey: config.tenantKey,
      artifactType: "v3_tenant_input",
      file,
      target: "file-backed source staging; derived into intelligence_v7 load payload",
      recordCount: csvRows(file),
      status: "file_backed_source",
      overwritePolicy: "append-only source artifact; do not overwrite without new dataset version",
      rollbackKey: `${config.tenantKey}:source-input:${fileName}`,
      validationRule: "tenant_key must match canonical tenant; input remains provenance source for generated pack",
      loadRequired: "no",
      reason: "Retained as source provenance; runtime load uses generated V7 candidate records derived from these inputs.",
    });
  }
  const interviewFile = path.join(base, "interviews/executive_interviews.csv");
  addRow(rows, {
    tenantKey: config.tenantKey,
    artifactType: "interview_evidence",
    file: interviewFile,
    target: "file-backed evidence staging; future governed interview_evidence store",
    recordCount: csvRows(interviewFile),
    status: "file_backed_source",
    overwritePolicy: "append-only interview evidence; do not overwrite without new source_adapter version",
    rollbackKey: `${config.tenantKey}:sa07-interviews`,
    validationRule: "source_adapter_id must be SA07; tenant_key must match; no PHI/PII or real client restricted names",
    loadRequired: "no",
    reason: "Interview rows are already mapped into generated governed context rows; raw interview store is not part of current loader.",
  });
}

function targetForV7(fileName) {
  if (/V7_12_/.test(fileName)) return "intelligence_v7.business_records + intelligence_v7.record_fields + intelligence_v7.graph_nodes + intelligence_v7.relationship_edges";
  if (/V7_20_/.test(fileName)) return "intelligence_v7.business_records + intelligence_v7.record_fields + intelligence_v7.chunk_registry";
  if (/V7_00_/.test(fileName)) return "intelligence_v7.business_records + intelligence_v7.record_fields + intelligence_v7.entity_registry";
  return "intelligence_v7.source_files + intelligence_v7.business_records + intelligence_v7.record_fields";
}

function addGeneratedPackRows(rows, config) {
  const root = datasetRoot(config);
  const manifest = readJson(path.join(root, "V6_V7_GENERATED_MANIFEST.json"));
  const payload = path.join(root, "azure/v7-tenant-load-payload.json");
  addRow(rows, {
    tenantKey: config.tenantKey,
    artifactType: "v7_load_payload",
    file: payload,
    target: "ACA data-build job payload; scripts/v7/load-tenant-v7-azure.mjs input",
    recordCount: jsonRows(payload),
    status: "candidate",
    overwritePolicy: "load as candidate contract only; do not promote active in dry run",
    rollbackKey: `${config.tenantKey}:${manifest.v7ContractVersion}:payload`,
    validationRule: "contractVersion must match manifest; tenantPacks tenant_key must match canonical tenant",
  });

  const v7Dir = path.join(root, "v7");
  for (const fileName of fs.readdirSync(v7Dir).filter((file) => file.endsWith(".csv")).sort()) {
    const file = path.join(v7Dir, fileName);
    addRow(rows, {
      tenantKey: config.tenantKey,
      artifactType: "canonical_fact_context",
      file,
      target: targetForV7(fileName),
      recordCount: csvRows(file),
      status: "candidate",
      overwritePolicy: "insert candidate contract records under new contract_version; do not update active pointer",
      rollbackKey: `${config.tenantKey}:${manifest.v7ContractVersion}:${fileName}`,
      validationRule: "tenant_key and contract_version scoped; RLS must use tenant_key; source_file checksum must match manifest",
    });
  }

  const templateDir = path.join(root, "templates");
  for (const fileName of fs.readdirSync(templateDir).filter((file) => file.endsWith(".csv")).sort()) {
    const file = path.join(templateDir, fileName);
    addRow(rows, {
      tenantKey: config.tenantKey,
      artifactType: "internal_build_lineage",
      file,
      target: "file-backed build lineage only",
      recordCount: csvRows(file),
      status: "file_backed_lineage",
      overwritePolicy: "do not load directly; V7 candidate rows are the runtime data-plane target",
      rollbackKey: `${config.tenantKey}:${manifest.v6ContractVersion}:${fileName}`,
      validationRule: "must not be exposed as user-facing V6 language; used only to reproduce generated V7 candidate records",
      loadRequired: "no",
      reason: "Internal build lineage. Loading V6-labeled source files directly would violate user-facing language boundary.",
    });
  }
}

function addHomeDerivedRows(rows, config) {
  const root = datasetRoot(config);
  const manifest = readJson(path.join(root, "V6_V7_GENERATED_MANIFEST.json"));
  const homeDir = path.join(root, "derived/home");
  const mappings = [
    ["derived_dimension_rollups.csv", "home_dimension_rollup", "candidate derived Home context store; can be recomputed from intelligence_v7 records"],
    ["derived_gap_insights.csv", "context_gaps_confidence", "candidate derived gap/confidence store; can be recomputed from intelligence_v7 records"],
    ["derived_relationship_rollups.csv", "relationship_graph_rollup", "candidate derived relationship rollup store; source of truth remains intelligence_v7.relationship_edges"],
    ["derived_source_ledger.csv", "evidence_registry_rollup", "candidate derived source ledger store; source of truth remains intelligence_v7.source_files"],
  ];
  for (const [fileName, artifactType, target] of mappings) {
    const file = path.join(homeDir, fileName);
    addRow(rows, {
      tenantKey: config.tenantKey,
      artifactType,
      file,
      target,
      recordCount: csvRows(file),
      status: "candidate_derived",
      overwritePolicy: "replace only within candidate dataset version; do not mutate active runtime pointer",
      rollbackKey: `${config.tenantKey}:${manifest.v7ContractVersion}:${fileName}`,
      validationRule: "tenant_key derived from canonical dataset; user-facing labels must be sanitized by runtime renderer",
      loadRequired: "no",
      reason: "Current runtime can recompute or file-read these derived views; no stable persisted derived table is required for this dry run.",
    });
  }
}

function addAdvisoryRows(rows, config) {
  const root = datasetRoot(config);
  const story = path.join(root, "derived/knowledge/approved-cxo-story-blocks.json");
  const visuals = path.join(root, "derived/knowledge/approved-cxo-visual-specs.json");
  addRow(rows, {
    tenantKey: config.tenantKey,
    artifactType: "home_knowledge_story_blocks",
    file: story,
    target: "file-backed approved advisory artifact; future governed_advisory_artifacts store",
    recordCount: jsonRows(story, "story_blocks"),
    status: "approved_file_backed_candidate",
    overwritePolicy: "approved-only; replace only with regenerated artifact passing proof gate",
    rollbackKey: `${config.tenantKey}:home-knowledge-story-blocks`,
    validationRule: "all blocks approved_for_render; tenant_key exact; no cross-tenant or internal language leakage",
    loadRequired: "no",
    reason: "Local runtime proof consumes this file-backed artifact today; no current Azure table exists for advisory blocks.",
  });
  addRow(rows, {
    tenantKey: config.tenantKey,
    artifactType: "home_knowledge_visual_specs",
    file: visuals,
    target: "file-backed approved advisory visual specs; future governed_advisory_visual_specs store",
    recordCount: jsonRows(visuals, "visual_specs"),
    status: "approved_file_backed_candidate",
    overwritePolicy: "approved-only; replace only with regenerated artifact passing proof gate",
    rollbackKey: `${config.tenantKey}:home-knowledge-visual-specs`,
    validationRule: "visual specs approved by proof gate; chart_allowed must respect evidence boundary",
    loadRequired: "no",
    reason: "Local runtime proof consumes this file-backed artifact today; no current Azure table exists for advisory visual specs.",
  });

  for (const moduleName of modules) {
    for (const [fileName, artifactType] of [["generated-blocks.json", "module_advisory_blocks"], ["generated-visual-specs.json", "module_visual_specs"]]) {
      const file = path.join(repoRoot, "reports/module-cxo-content", config.tenantKey, moduleName, fileName);
      addRow(rows, {
        tenantKey: config.tenantKey,
        artifactType,
        file,
        target: "file-backed generated module artifact; future governed_module_advisory_artifacts store",
        recordCount: jsonRows(file),
        status: "approved_file_backed_candidate",
        overwritePolicy: "approved-only; replace only by tenant/module after audit passes",
        rollbackKey: `${config.tenantKey}:${moduleName}:${artifactType}`,
        validationRule: "tenant_key and module must match; approved_for_render required for blocks; no cross-tenant or internal language leakage",
        loadRequired: "no",
        reason: "Module artifacts are locally runtime-proven from generated imports; no current Azure table exists for module advisory content.",
      });
    }
  }
}

function buildRows() {
  const rows = [];
  for (const config of tenantV6CanonicalConfigs) {
    addTenantInputRows(rows, config);
    addGeneratedPackRows(rows, config);
    addHomeDerivedRows(rows, config);
    addAdvisoryRows(rows, config);
  }
  return rows;
}

function scanUserFacingContent(rows) {
  const relevant = rows.filter((row) =>
    ["home_knowledge_story_blocks", "home_knowledge_visual_specs", "module_advisory_blocks", "module_visual_specs"].includes(row.artifact_type),
  );
  return relevant.map((row) => {
    const file = path.join(repoRoot, row.source_path);
    const text = exists(file) ? fs.readFileSync(file, "utf8") : "";
    const leaks = internalTerms.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
    return { row, leaks };
  });
}

function dryRunRows(rows) {
  const advisoryScans = new Map(scanUserFacingContent(rows).map((scan) => [scan.row.source_path, scan.leaks]));
  return rows.map((row) => {
    const missing = !exists(path.join(repoRoot, row.source_path));
    const checksumMissing = !row.checksum_hash;
    const recordCountBad = Number(row.record_count) < 0;
    const advisoryLeaks = advisoryScans.get(row.source_path) ?? [];
    const pass = !missing && !checksumMissing && !recordCountBad && advisoryLeaks.length === 0;
    return {
      tenant_key: row.tenant_key,
      artifact_type: row.artifact_type,
      source_path: row.source_path,
      load_required: row.load_required,
      mutation_performed: "no",
      dry_run_status: pass ? "Pass" : "Fail",
      checks: [
        missing ? "missing source file" : "source exists",
        checksumMissing ? "missing checksum" : "checksum computed",
        recordCountBad ? "invalid record count" : "record count valid",
        advisoryLeaks.length ? `internal language leak: ${advisoryLeaks.join("|")}` : "user-facing language boundary ok",
      ].join("; "),
    };
  });
}

function activeCandidateRows(rows) {
  return rows.map((row) => ({
    tenant_key: row.tenant_key,
    artifact_type: row.artifact_type,
    source_path: row.source_path,
    active_candidate_status: row.active_candidate_status,
    promotes_active: "no",
    mutation_performed: "no",
    status: row.active_candidate_status.includes("candidate") || row.active_candidate_status.includes("file_backed") ? "Pass" : "Fail",
    check: "Dry run never promotes active contract version or product runtime pointer.",
  }));
}

function tableMapping(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.artifact_type}|${row.target_table_or_store}|${row.load_required}`;
    if (!grouped.has(key)) {
      grouped.set(key, { artifact_type: row.artifact_type, target: row.target_table_or_store, load_required: row.load_required, count: 0, records: 0 });
    }
    const item = grouped.get(key);
    item.count += 1;
    item.records += Number(row.record_count || 0);
  }
  return [...grouped.values()].sort((a, b) => a.artifact_type.localeCompare(b.artifact_type));
}

function renderMarkdownTables(rows) {
  return tableMapping(rows)
    .map((item) => `| ${item.artifact_type} | ${item.target} | ${item.count} | ${item.records} | ${item.load_required} |`)
    .join("\n");
}

function renderProofHtml({ rows, dryRows, activeRows }) {
  const totals = summarize(rows, dryRows, activeRows);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Multi-Tenant Data-Plane Load Plan And Dry Run</title>
  <style>
    body{font-family:Arial,sans-serif;margin:32px;background:#fbfcfd;color:#1f2937}
    h1,h2{margin-bottom:8px}
    .note{max-width:980px;color:#52606d;line-height:1.45}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:12px;margin:22px 0}
    .card{border:1px solid #d8dee4;background:#fff;border-radius:8px;padding:14px}
    .card span{display:block;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
    .card strong{display:block;margin-top:6px;font-size:24px}
    table{border-collapse:collapse;width:100%;background:#fff;margin:16px 0 28px}
    th,td{border:1px solid #d8dee4;padding:8px;text-align:left;vertical-align:top;font-size:13px}
    th{background:#f1f5f9}
    .pass{color:#166534;font-weight:700}
  </style>
</head>
<body>
  <h1>Multi-Tenant Data-Plane Load Plan And Dry Run</h1>
  <p class="note">Status: <span class="pass">${escapeHtml(totals.status)}</span>. Scope: non-mutating dry run only. No Azure/Postgres connection, no deployment, no active promotion, and no production retrieval proof.</p>
  <div class="grid">
    <div class="card"><span>Manifest rows</span><strong>${totals.manifestRows}</strong></div>
    <div class="card"><span>Load-required rows</span><strong>${totals.loadRequiredRows}</strong></div>
    <div class="card"><span>File-backed rows</span><strong>${totals.fileBackedRows}</strong></div>
    <div class="card"><span>Dry-run failures</span><strong>${totals.failures}</strong></div>
  </div>
  <h2>Target Mapping</h2>
  <table>
    <thead><tr><th>Artifact Type</th><th>Target Table Or Store</th><th>Artifacts</th><th>Records</th><th>Load Required</th></tr></thead>
    <tbody>${tableMapping(rows).map((item) => `<tr><td>${escapeHtml(item.artifact_type)}</td><td>${escapeHtml(item.target)}</td><td>${item.count}</td><td>${item.records}</td><td>${escapeHtml(item.load_required)}</td></tr>`).join("\n")}</tbody>
  </table>
  <h2>Boundary</h2>
  <p class="note">Every planned data-plane mutation remains candidate-scoped. Advisory content remains approved file-backed unless a governed advisory artifact store is explicitly added later. Rollback keys are present on every manifest row.</p>
</body>
</html>`;
}

function summarize(rows, dryRows, activeRows) {
  const failures = dryRows.filter((row) => row.dry_run_status !== "Pass").length + activeRows.filter((row) => row.status !== "Pass").length;
  return {
    status: failures === 0 ? "Pass" : "Fail",
    manifestRows: rows.length,
    loadRequiredRows: rows.filter((row) => row.load_required === "yes").length,
    fileBackedRows: rows.filter((row) => row.load_required === "no").length,
    failures,
    tenants: tenantV6CanonicalConfigs.map((config) => config.tenantKey),
    generatedAt: new Date().toISOString(),
  };
}

function writeReports(rows, dryRows, activeRows) {
  ensureDir(reportDir);
  writeCsv(path.join(reportDir, "load-manifest.csv"), manifestHeaders, rows);
  writeCsv(path.join(reportDir, "dry-run-results.csv"), Object.keys(dryRows[0]), dryRows);
  writeCsv(path.join(reportDir, "active-candidate-boundary-check.csv"), Object.keys(activeRows[0]), activeRows);

  const summary = summarize(rows, dryRows, activeRows);
  fs.writeFileSync(path.join(reportDir, "summary.json"), `${JSON.stringify({ ...summary, tableMapping: tableMapping(rows) }, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, "summary.md"), `# Multi-Tenant Data-Plane Load Plan And Dry Run

- Status: ${summary.status}
- Scope: non-mutating dry run only. No Azure/Postgres connection, no deployment, no active promotion, and no production retrieval proof.
- Tenants: ${summary.tenants.join(", ")}
- Manifest rows: ${summary.manifestRows}
- Load-required rows: ${summary.loadRequiredRows}
- File-backed / no-load rows: ${summary.fileBackedRows}
- Dry-run failures: ${summary.failures}

## Required Outputs

- \`load-manifest.csv\`
- \`dry-run-results.csv\`
- \`table-mapping.md\`
- \`rollback-plan.md\`
- \`tenant-isolation-plan.md\`
- \`active-candidate-boundary-check.csv\`
- \`proof.html\`
`);

  fs.writeFileSync(path.join(reportDir, "table-mapping.md"), `# Table Mapping

| Artifact Type | Target Table Or Store | Artifact Files | Records | Load Required |
| --- | --- | ---: | ---: | --- |
${renderMarkdownTables(rows)}

## Notes

- The existing loader target for canonical generated rows is \`intelligence_v7\`.
- Home/Knowledge and module advisory artifacts are approved file-backed artifacts today; this plan names a future governed advisory artifact store instead of inventing a mutation path.
- V6-labeled files are retained as build lineage only and are not planned for direct data-plane load.
`);

  fs.writeFileSync(path.join(reportDir, "rollback-plan.md"), `# Rollback Plan

This dry run performs no Azure/Postgres mutation. For a future approved load:

1. Load only into a new candidate \`contract_version\` per tenant.
2. Do not update \`intelligence_v7.active_tenant_contract_versions\` during initial load.
3. Use each manifest row's \`rollback_key\` to delete candidate \`tenant_pack_runs\`, \`source_files\`, \`business_records\`, \`record_fields\`, \`graph_nodes\`, \`relationship_edges\`, and \`chunk_registry\` rows by \`tenant_key\` plus \`contract_version\`.
4. If advisory artifacts move to a governed artifact store later, version by \`tenant_key\`, \`module\`, artifact kind, and checksum; rollback deletes only that candidate artifact version.
5. Promotion to active requires a separate approval and signed-in browser proof. Rollback from active promotion restores the previous active contract version from the promotion event.
`);

  fs.writeFileSync(path.join(reportDir, "tenant-isolation-plan.md"), `# Tenant Isolation Plan

- Canonical tenants: ${summary.tenants.join(", ")}.
- Every load-required row carries \`tenant_key\`, candidate \`contract_version\`, source path, checksum, and rollback key.
- Existing \`intelligence_v7\` target tables are tenant-scoped and protected by RLS policies that compare \`tenant_key\` to runtime tenant settings.
- Candidate loads must never mix files across tenants; the dry-run manifest uses one row per tenant artifact and checks exact source paths.
- Advisory artifacts remain approved-only and tenant/module-scoped. Cross-tenant leak scans are already enforced by \`audit:multi-tenant-runtime-retrieval-proof\`.
- Missing artifacts must fail closed: no cross-tenant fallback, no active promotion, no synthesized replacement.
`);

  fs.writeFileSync(path.join(reportDir, "proof.html"), renderProofHtml({ rows, dryRows, activeRows }));
}

const rows = buildRows();
const dryRows = dryRunRows(rows);
const activeRows = activeCandidateRows(rows);
writeReports(rows, dryRows, activeRows);
const summary = summarize(rows, dryRows, activeRows);
console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "Pass") process.exit(1);
