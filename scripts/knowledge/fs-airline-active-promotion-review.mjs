#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const requireFromApp = createRequire(new URL("../../package.json", import.meta.url));
const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/fs-airline-active-promotion-review");
const allowedHost = "pg-abarva-context-lab-001.postgres.database.azure.com";
const sourceSystem = "tenant_data_factory_candidate";
const tenants = {
  "first-capital-financial": { displayLabel: "FS Demo" },
  "skyharbor-air": { displayLabel: "Airline Demo" },
};
const truthStatement =
  "Planning-grade synthetic candidate context only. Not real client production data, not PHI/PII/payment-card data, not active tenant truth, and not a claim of realized financial value.";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(file, headers, rows) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeMd(file, lines) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function rootFor(tenantKey) {
  return `datasets/tenant-inputs/generated/${tenantKey}/rich-synthetic-2026-07-v3`;
}

function sourceRootFor(tenantKey) {
  return `datasets/tenant-inputs/candidates/${tenantKey}/rich-synthetic-2026-07-v3`;
}

function loadTenant(tenantKey) {
  const root = rootFor(tenantKey);
  return {
    tenantKey,
    displayLabel: tenants[tenantKey].displayLabel,
    manifest: readJson(`${root}/tenant-generation-manifest.json`),
    home: readJson(`${root}/home-context-view.json`),
    tower: readJson(`${root}/tower-dashboard-view.json`),
    moves: readJson(`${root}/moves-context-view.json`),
    source: readJson(`${root}/source-context-view.json`),
    chunks: readJson(`${root}/retrieval-chunks.json`),
    storyBlocks: readJson(`${root}/approved-candidate-story-blocks.json`),
    renderPack: readJson(`${root}/render-pack.json`),
    sourceFiles: fs.readdirSync(path.join(repoRoot, sourceRootFor(tenantKey))).filter((file) => file.endsWith(".csv")).sort(),
  };
}

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.TARGET_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    ""
  );
}

function targetInfo() {
  const url = connectionString();
  if (!url) return { ok: false, reason: "missing DATABASE_URL/Azure Postgres URL", host: "", database: "" };
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");
  const ok = parsed.hostname === allowedHost && !/prod/i.test(database);
  return { ok, reason: ok ? "" : `target must be ${allowedHost} and non-prod database, got ${parsed.hostname}/${database}`, host: parsed.hostname, database };
}

function pgClient() {
  const { Client } = requireFromApp("pg");
  return Client;
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function tableExists(client, table) {
  const result = await q(client, "select to_regclass($1) as name", [table]);
  return Boolean(result.rows[0]?.name);
}

async function countWhere(client, table, predicate, params) {
  if (!(await tableExists(client, table))) return { exists: false, count: 0 };
  const result = await q(client, `select count(*)::int as c from ${table} where ${predicate}`, params);
  return { exists: true, count: Number(result.rows[0]?.c || 0) };
}

function add(rows, tenant, area, check, status, detail, evidence = "") {
  rows.push({
    tenant_key: tenant.tenantKey,
    display_label: tenant.displayLabel,
    area,
    check,
    status,
    detail,
    evidence,
  });
}

function localHomeRows(tenant) {
  const rows = [];
  const dimensions = tenant.home;
  const hasSummary = dimensions.every((row) => Boolean(row.summary));
  const hasInterestingFacts = dimensions.every((row) => Array.isArray(row.interesting_facts) && row.interesting_facts.length > 0);
  const hasData = dimensions.every((row) => Number(row.data_row_count) > 0);
  const hasRelationships = dimensions.every((row) => Number(row.relationship_count) > 0);
  const hasGaps = dimensions.every((row) => Number(row.gap_count) >= 0);
  const hasEvidence = dimensions.every((row) => Array.isArray(row.evidence_refs) && row.evidence_refs.length > 0);
  add(rows, tenant, "Home", "19 dimensions", dimensions.length === 19 ? "Pass" : "Fail", `${dimensions.length}/19 dimensions`);
  add(rows, tenant, "Home", "Summary", hasSummary ? "Pass" : "Fail", "summary field present on every dimension");
  add(rows, tenant, "Home", "Interesting Facts", hasInterestingFacts ? "Pass" : "Fail", "interesting_facts present on every dimension");
  add(rows, tenant, "Home", "Dashboard", tenant.renderPack.default_runtime_visible === false ? "Pass" : "Fail", "render pack is candidate preview only");
  add(rows, tenant, "Home", "Data", hasData ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.data_row_count || 0), 0)} data rows represented`);
  add(rows, tenant, "Home", "Relationships", hasRelationships ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.relationship_count || 0), 0)} relationships represented`);
  add(rows, tenant, "Home", "Gaps", hasGaps ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.gap_count || 0), 0)} gaps represented`);
  add(rows, tenant, "Home", "Evidence", hasEvidence ? "Pass" : "Fail", "evidence refs present on every dimension");
  return rows;
}

function localTowerRows(tenant) {
  const rows = [];
  const lanes = new Set((tenant.tower.decision_lanes || []).map((row) => row.lane));
  add(rows, tenant, "Tower", "Executive Command View", tenant.tower.budget_posture && tenant.tower.decision_lanes ? "Pass" : "Fail", "budget posture and decision lanes present");
  add(rows, tenant, "Tower", "budget posture", tenant.tower.budget_posture?.fy26_it_budget_usd ? "Pass" : "Fail", JSON.stringify(tenant.tower.budget_posture || {}));
  add(rows, tenant, "Tower", "run/change split", tenant.tower.budget_posture?.run_change_split ? "Pass" : "Fail", tenant.tower.budget_posture?.run_change_split || "");
  add(rows, tenant, "Tower", "approved programs", tenant.tower.approved_programs?.length === 12 ? "Pass" : "Fail", `${tenant.tower.approved_programs?.length || 0}/12 programs`);
  add(rows, tenant, "Tower", "candidate AI opportunities", tenant.tower.candidate_ai_opportunities?.length === 12 ? "Pass" : "Fail", `${tenant.tower.candidate_ai_opportunities?.length || 0}/12 opportunities`);
  add(rows, tenant, "Tower", "value proof ladder", tenant.tower.value_proof_ladder?.includes("not realized") ? "Pass" : "Fail", (tenant.tower.value_proof_ladder || []).join("; "));
  add(rows, tenant, "Tower", "Fund/Fix/Freeze/Stop lanes", ["Fund", "Fix", "Freeze", "Stop"].every((lane) => lanes.has(lane)) ? "Pass" : "Fail", [...lanes].join("; "));
  return rows;
}

function localIntelligenceRows(tenant) {
  const rows = [];
  const candidateOnly = tenant.chunks.every((row) => row.retrieval_scope === "candidate_preview_only");
  const defaultInvisible = tenant.chunks.every((row) => row.default_runtime_visible === false);
  const cited = tenant.chunks.every((row) => row.evidence_id && row.fact_key);
  add(rows, tenant, "Intelligence", "candidate retrieval chunks", tenant.chunks.length === tenant.manifest.counts.retrieval_chunks ? "Pass" : "Fail", `${tenant.chunks.length}/${tenant.manifest.counts.retrieval_chunks} chunks`);
  add(rows, tenant, "Intelligence", "explicit candidate retrieval scope", candidateOnly ? "Pass" : "Fail", "retrieval_scope=candidate_preview_only");
  add(rows, tenant, "Intelligence", "default active retrieval excluded", defaultInvisible ? "Pass" : "Fail", "default_runtime_visible=false");
  add(rows, tenant, "Intelligence", "candidate evidence citations", cited ? "Pass" : "Fail", "fact_key and evidence_id present for every retrieval chunk");
  return rows;
}

function localMovesSourceRows(tenant) {
  const rows = [];
  add(rows, tenant, "Moves", "planning-only context", tenant.moves.every((row) => row.active_execution_commitment === false) ? "Pass" : "Fail", "active_execution_commitment=false");
  add(rows, tenant, "Moves", "phase readiness", tenant.moves.every((row) => row.phase_readiness) ? "Pass" : "Fail", `${tenant.moves.length} moves checked`);
  add(rows, tenant, "Moves", "evidence requirements", tenant.moves.every((row) => row.evidence_requirements) ? "Pass" : "Fail", `${tenant.moves.length} moves checked`);
  add(rows, tenant, "Source", "leverage candidates", tenant.source.length === 12 ? "Pass" : "Fail", `${tenant.source.length}/12 Source contexts`);
  add(rows, tenant, "Source", "no unsupported savings claims", tenant.source.every((row) => row.savings_claim_allowed === false) ? "Pass" : "Fail", "savings_claim_allowed=false");
  add(rows, tenant, "Source", "contract evidence required", tenant.source.every((row) => /contract, SLA, invoice/i.test(row.evidence_required || "")) ? "Pass" : "Fail", "contract/SLA/invoice evidence required");
  return rows;
}

function blockedClaimsRows(tenantsList) {
  const rows = [];
  for (const tenant of tenantsList) {
    const checks = [
      ["story_blocks_default_runtime", tenant.storyBlocks.filter((row) => row.approved_for_default_runtime !== false).length],
      ["retrieval_chunks_default_visible", tenant.chunks.filter((row) => row.default_runtime_visible !== false).length],
      ["moves_active_execution_commitments", tenant.moves.filter((row) => row.active_execution_commitment !== false).length],
      ["source_savings_claims_allowed", tenant.source.filter((row) => row.savings_claim_allowed !== false).length],
      ["tower_realized_value_claims", (tenant.tower.candidate_ai_opportunities || []).filter((row) => !/blocked|baseline|required/i.test(row.value_claim_status || "")).length],
    ];
    for (const [check, findings] of checks) {
      rows.push({
        tenant_key: tenant.tenantKey,
        display_label: tenant.displayLabel,
        check,
        findings,
        status: findings === 0 ? "Pass" : "Fail",
      });
    }
  }
  return rows;
}

async function dbRows(client, tenantsList) {
  const promotionRows = [];
  const defaultRows = [];
  for (const tenant of tenantsList) {
    const contractVersion = tenant.manifest.candidate_contract_version;
    const loadRunId = tenant.manifest.load_run_id;
    const pack = await countWhere(client, "intelligence_v7.tenant_pack_runs", "tenant_key=$1 and contract_version=$2 and load_status in ('loaded','validated')", [tenant.tenantKey, contractVersion]);
    const activeCandidate = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1 and active_contract_version=$2", [tenant.tenantKey, contractVersion]);
    const activeAny = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1", [tenant.tenantKey]);
    const records = await countWhere(client, "intelligence_v7.business_records", "tenant_key=$1 and contract_version=$2", [tenant.tenantKey, contractVersion]);
    const facts = await countWhere(client, "intelligence_v7.record_fields", "tenant_key=$1 and contract_version=$2", [tenant.tenantKey, contractVersion]);
    const nodes = await countWhere(client, "intelligence_v7.graph_nodes", "tenant_key=$1 and contract_version=$2", [tenant.tenantKey, contractVersion]);
    const edges = await countWhere(client, "intelligence_v7.relationship_edges", "tenant_key=$1 and contract_version=$2", [tenant.tenantKey, contractVersion]);
    const chunks = await countWhere(client, "intelligence_v7.chunk_registry", "tenant_key=$1 and contract_version=$2 and retrieval_eligibility='candidate_preview_only'", [tenant.tenantKey, contractVersion]);
    const moduleReadiness = await countWhere(client, "intelligence_v7.module_readiness_scores", "tenant_key=$1 and contract_version=$2", [tenant.tenantKey, contractVersion]);
    const towerValidation = await countWhere(client, "cio_tower.validation_results", "tenant_key=$1 and validation_run_key=$2", [tenant.tenantKey, `${loadRunId}:tower-validation`]);
    const sourceManifest = await countWhere(client, "public.source_contract_evidence_manifests", "tenant_key=$1 and upload_batch_id=$2", [tenant.tenantKey, loadRunId]);
    const sourceEvents = await countWhere(client, "public.source_events", "client_key=$1 and event_code like $2", [tenant.tenantKey, `${loadRunId}%`]);
    add(promotionRows, tenant, "Promotion", "candidate contract version", contractVersion ? "Pass" : "Fail", contractVersion);
    add(promotionRows, tenant, "Promotion", "candidate pack loaded/validated", pack.exists && pack.count === 1 ? "Pass" : "Fail", `${pack.count}/1 tenant_pack_runs rows`);
    add(promotionRows, tenant, "Promotion", "active pointer unchanged", activeCandidate.exists && activeCandidate.count === 0 ? "Pass" : "Fail", `${activeCandidate.count} active rows point at candidate; ${activeAny.count} active pointer rows for tenant`);
    add(promotionRows, tenant, "Promotion", "records readback", records.exists && records.count === tenant.manifest.counts.canonical_records ? "Pass" : "Fail", `${records.count}/${tenant.manifest.counts.canonical_records}`);
    add(promotionRows, tenant, "Promotion", "facts readback", facts.exists && facts.count === tenant.manifest.counts.canonical_facts ? "Pass" : "Fail", `${facts.count}/${tenant.manifest.counts.canonical_facts}`);
    add(promotionRows, tenant, "Promotion", "graph nodes readback", nodes.exists && nodes.count === tenant.manifest.counts.graph_nodes ? "Pass" : "Fail", `${nodes.count}/${tenant.manifest.counts.graph_nodes}`);
    add(promotionRows, tenant, "Promotion", "graph edges readback", edges.exists && edges.count === tenant.manifest.counts.graph_edges ? "Pass" : "Fail", `${edges.count}/${tenant.manifest.counts.graph_edges}`);
    add(promotionRows, tenant, "Promotion", "candidate chunks readback", chunks.exists && chunks.count === tenant.manifest.counts.retrieval_chunks ? "Pass" : "Fail", `${chunks.count}/${tenant.manifest.counts.retrieval_chunks}`);
    add(promotionRows, tenant, "Promotion", "module readiness rows", moduleReadiness.exists && moduleReadiness.count >= 5 ? "Pass" : "Fail", `${moduleReadiness.count}/5 module readiness rows`);
    add(promotionRows, tenant, "Promotion", "Tower validation rows", towerValidation.exists && towerValidation.count >= 5 ? "Pass" : "Fail", `${towerValidation.count}/5 Tower validation rows`);
    add(promotionRows, tenant, "Promotion", "Source candidate evidence manifests", sourceManifest.exists && sourceManifest.count === 12 ? "Pass" : "Fail", `${sourceManifest.count}/12 Source manifests`);
    add(promotionRows, tenant, "Promotion", "Source active events not created", sourceEvents.exists && sourceEvents.count === 0 ? "Pass" : "Fail", `${sourceEvents.count} source_events rows`);
    defaultRows.push({
      tenant_key: tenant.tenantKey,
      display_label: tenant.displayLabel,
      candidate_contract_version: contractVersion,
      active_pointer_rows_for_candidate: activeCandidate.count,
      active_pointer_rows_for_tenant: activeAny.count,
      candidate_chunks_default_visible: tenant.chunks.filter((row) => row.default_runtime_visible !== false).length,
      source_events_created: sourceEvents.count,
      status: activeCandidate.count === 0 && tenant.chunks.every((row) => row.default_runtime_visible === false) && sourceEvents.count === 0 ? "Pass" : "Fail",
    });
  }
  return { promotionRows, defaultRows };
}

function sourceAuditRows() {
  const rows = [];
  const homePage = readText("src/app/(maestro)/home/page.tsx");
  const browser = readText("src/lib/home/v7-context-browser.ts");
  rows.push({
    check: "Home default route requires active pointer",
    status: /getActiveTenantContractVersion|active_contract/i.test(browser) && /candidatePreview/i.test(homePage) ? "Pass" : "Watch",
    evidence: "home/page.tsx and v7-context-browser.ts inspected for active pointer and candidatePreview handling",
  });
  rows.push({
    check: "Candidate preview labels visible",
    status: browser.includes("Candidate preview") && browser.includes("Not active tenant truth") ? "Pass" : "Fail",
    evidence: "v7-context-browser.ts exposes candidate preview labels",
  });
  rows.push({
    check: "Module runtime default exclusion",
    status: browser.includes("candidate-preview") && browser.includes("default") ? "Pass" : "Watch",
    evidence: "candidate preview mode is explicit and separate from active mode",
  });
  return rows;
}

function writeProofHtml(status, tenantsList, allRows) {
  const cardHtml = tenantsList
    .map(
      (tenant) =>
        `<section class="card"><h2>${tenant.displayLabel}</h2><p>${tenant.tenantKey}</p><dl><dt>Contract</dt><dd>${tenant.manifest.candidate_contract_version}</dd><dt>Records</dt><dd>${tenant.manifest.counts.canonical_records.toLocaleString("en-US")}</dd><dt>Facts</dt><dd>${tenant.manifest.counts.canonical_facts.toLocaleString("en-US")}</dd><dt>Graph</dt><dd>${(tenant.manifest.counts.graph_nodes + tenant.manifest.counts.graph_edges).toLocaleString("en-US")}</dd><dt>Chunks</dt><dd>${tenant.manifest.counts.retrieval_chunks.toLocaleString("en-US")}</dd></dl></section>`,
    )
    .join("");
  const failed = allRows.filter((row) => row.status !== "Pass").length;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>FS/Airline Active Promotion Review</title><style>body{font-family:Arial,Helvetica,sans-serif;margin:28px;background:#f7f8fa;color:#16202a}.status{font-weight:800;color:${status === "READY_FOR_ACTIVE_PROMOTION" ? "#166534" : "#9a3412"}}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:16px}.note{border-left:4px solid #a15c00;background:#fff8eb;padding:12px}table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}td,th{border:1px solid #d9dee7;padding:8px;text-align:left}.Pass{color:#166534;font-weight:700}.Fail{color:#991b1b;font-weight:700}.Watch{color:#9a3412;font-weight:700}</style></head><body><h1>FS/Airline Active Promotion Review</h1><p class="status">${status}</p><p class="note">${truthStatement}</p><div class="grid">${cardHtml}</div><p>Checks: ${allRows.length}; non-pass: ${failed}. This is a dry run only. Active promotion remains out of scope.</p><table><thead><tr><th>Tenant</th><th>Area</th><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>${allRows.map((row) => `<tr><td>${row.display_label || row.tenant_key || ""}</td><td>${row.area || ""}</td><td>${row.check || ""}</td><td class="${row.status}">${row.status}</td><td>${csvEscape(row.detail || row.evidence || "").replace(/^"|"$/g, "")}</td></tr>`).join("")}</tbody></table></body></html>`;
  fs.writeFileSync(path.join(outDir, "proof.html"), html);
}

function emitProofBundle() {
  if (process.env.EMIT_ACA_PROOF_BUNDLE !== "true") return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fs-airline-promotion-review-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(tar.stderr || "proof bundle tar failed");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function run() {
  ensureDir(outDir);
  const tenantsList = Object.keys(tenants).map(loadTenant);
  const localHome = tenantsList.flatMap(localHomeRows);
  const localTower = tenantsList.flatMap(localTowerRows);
  const localIntelligence = tenantsList.flatMap(localIntelligenceRows);
  const localMovesSource = tenantsList.flatMap(localMovesSourceRows);
  const blockedClaims = blockedClaimsRows(tenantsList);
  const readerAudit = sourceAuditRows();
  let promotionRows = [];
  let defaultRows = tenantsList.map((tenant) => ({
    tenant_key: tenant.tenantKey,
    display_label: tenant.displayLabel,
    candidate_contract_version: tenant.manifest.candidate_contract_version,
    active_pointer_rows_for_candidate: "not_checked_no_database_url",
    active_pointer_rows_for_tenant: "not_checked_no_database_url",
    candidate_chunks_default_visible: tenant.chunks.filter((row) => row.default_runtime_visible !== false).length,
    source_events_created: "not_checked_no_database_url",
    status: "Watch",
  }));
  const target = targetInfo();
  if (target.ok) {
    const Client = pgClient();
    const client = new Client({ connectionString: connectionString(), ssl: { rejectUnauthorized: false }, application_name: "fs-airline-active-promotion-review" });
    await client.connect();
    try {
      const db = await dbRows(client, tenantsList);
      promotionRows = db.promotionRows;
      defaultRows = db.defaultRows;
    } finally {
      await client.end().catch(() => {});
    }
  } else {
    for (const tenant of tenantsList) {
      add(promotionRows, tenant, "Promotion", "database target", "Watch", target.reason, "dry run can run locally without DB; operator proof must include DB");
    }
  }
  writeCsv(path.join(outDir, "promotion-dry-run.csv"), ["tenant_key", "display_label", "area", "check", "status", "detail", "evidence"], promotionRows);
  writeCsv(path.join(outDir, "reader-audit.csv"), ["check", "status", "evidence"], readerAudit);
  writeCsv(path.join(outDir, "home-preview-proof.csv"), ["tenant_key", "display_label", "area", "check", "status", "detail", "evidence"], localHome);
  writeCsv(path.join(outDir, "tower-preview-proof.csv"), ["tenant_key", "display_label", "area", "check", "status", "detail", "evidence"], localTower);
  writeCsv(path.join(outDir, "intelligence-preview-proof.csv"), ["tenant_key", "display_label", "area", "check", "status", "detail", "evidence"], localIntelligence);
  writeCsv(path.join(outDir, "moves-source-preview-proof.csv"), ["tenant_key", "display_label", "area", "check", "status", "detail", "evidence"], localMovesSource);
  writeCsv(path.join(outDir, "default-runtime-invisibility.csv"), ["tenant_key", "display_label", "candidate_contract_version", "active_pointer_rows_for_candidate", "active_pointer_rows_for_tenant", "candidate_chunks_default_visible", "source_events_created", "status"], defaultRows);
  writeCsv(path.join(outDir, "blocked-claims-audit.csv"), ["tenant_key", "display_label", "check", "findings", "status"], blockedClaims);
  const allRows = [...promotionRows, ...readerAudit, ...localHome, ...localTower, ...localIntelligence, ...localMovesSource, ...defaultRows, ...blockedClaims];
  const hasFail = allRows.some((row) => row.status === "Fail");
  const hasWatch = allRows.some((row) => row.status === "Watch");
  const status = hasFail ? "BLOCKED_BEFORE_ACTIVE_PROMOTION" : hasWatch ? "WATCH_BEFORE_ACTIVE_PROMOTION" : "READY_FOR_ACTIVE_PROMOTION";
  writeMd(path.join(outDir, "default-runtime-invisibility.md"), [
    "# Default Runtime Invisibility",
    "",
    `Status: ${defaultRows.every((row) => row.status === "Pass") ? "PASS" : "WATCH_OR_FAIL"}`,
    "",
    "- Active promotion is not performed by this dry run.",
    "- Candidate contracts must not be selected by active pointers.",
    "- Candidate chunks must remain `candidate_preview_only` and `default_runtime_visible=false`.",
    "- Source active events must not be created by candidate context review.",
    "",
    ...defaultRows.map((row) => `- ${row.display_label} (${row.tenant_key}): ${row.status}; active pointer rows for candidate=${row.active_pointer_rows_for_candidate}.`),
  ]);
  writeMd(path.join(outDir, "summary.md"), [
    "# FS/Airline Active Promotion Review",
    "",
    `Final status: ${status}`,
    "",
    truthStatement,
    "",
    "Boundary:",
    "- Active promotion dry run only.",
    "- No active pointer mutation.",
    "- No deploy claim.",
    "- No signed-in runtime page proof claim.",
    "",
    "Tenants:",
    ...tenantsList.map((tenant) => `- ${tenant.displayLabel} (${tenant.tenantKey}): ${tenant.manifest.counts.canonical_records.toLocaleString("en-US")} records, ${tenant.manifest.counts.canonical_facts.toLocaleString("en-US")} facts, ${tenant.manifest.counts.graph_nodes.toLocaleString("en-US")} graph nodes, ${tenant.manifest.counts.graph_edges.toLocaleString("en-US")} graph edges, ${tenant.manifest.counts.retrieval_chunks.toLocaleString("en-US")} chunks.`),
    "",
    "Result:",
    status === "READY_FOR_ACTIVE_PROMOTION"
      ? "Both tenants are ready for a separate active-promotion approval step. Promote only one tenant first."
      : "Do not promote until all Watch/Fail rows are resolved.",
  ]);
  writeJson(path.join(outDir, "summary.json"), {
    status,
    target,
    generated_at: new Date().toISOString(),
    tenants: tenantsList.map((tenant) => tenant.tenantKey),
    active_pointer_updated: false,
    promotion_performed: false,
    signed_in_runtime_page_proof: false,
  });
  writeProofHtml(status, tenantsList, allRows);
  emitProofBundle();
  console.log(JSON.stringify({ status, out_dir: outDir, active_pointer_updated: false, promotion_performed: false }, null, 2));
  if (hasFail) process.exit(1);
}

run().catch((error) => {
  writeJson(path.join(outDir, "summary.json"), {
    status: "BLOCKED_BEFORE_ACTIVE_PROMOTION",
    target: targetInfo(),
    error: String(error.message || error),
    generated_at: new Date().toISOString(),
    active_pointer_updated: false,
    promotion_performed: false,
  });
  console.error(error.stack || error.message);
  process.exit(1);
});
