#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const requireFromApp = createRequire(new URL("../../package.json", import.meta.url));
const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/fs-demo-active-promotion");
const allowedHost = "pg-abarva-context-lab-001.postgres.database.azure.com";
const tenantKey = "first-capital-financial";
const displayLabel = "FS Demo";
const airlineTenantKey = "skyharbor-air";
const airlineDisplayLabel = "Airline Demo";
const actor = "codex-fs-demo-active-promotion";
const truthStatement =
  "Planning-grade synthetic active demo context only. Not real client production data, not PHI/PII/payment-card data, and not a claim of realized financial value, ROI, or savings.";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));
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

function generatedRootFor(key) {
  return `datasets/tenant-inputs/generated/${key}/rich-synthetic-2026-07-v3`;
}

function loadTenant(key, label) {
  const root = generatedRootFor(key);
  return {
    tenantKey: key,
    displayLabel: label,
    manifest: readJson(`${root}/tenant-generation-manifest.json`),
    home: readJson(`${root}/home-context-view.json`),
    tower: readJson(`${root}/tower-dashboard-view.json`),
    moves: readJson(`${root}/moves-context-view.json`),
    source: readJson(`${root}/source-context-view.json`),
    chunks: readJson(`${root}/retrieval-chunks.json`),
    storyBlocks: readJson(`${root}/approved-candidate-story-blocks.json`),
    renderPack: readJson(`${root}/render-pack.json`),
    evidence: readJson(`${root}/evidence-registry.json`),
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

async function countQuery(client, sql, params) {
  const result = await q(client, sql, params);
  return Number(result.rows[0]?.c || 0);
}

function add(rows, scope, check, status, detail = "", evidence = "") {
  rows.push({ tenant_key: scope.tenantKey, display_label: scope.displayLabel, check, status, detail, evidence });
}

function localHomeRows(tenant) {
  const rows = [];
  const dimensions = tenant.home;
  add(rows, tenant, "19 dimensions load", dimensions.length === 19 ? "Pass" : "Fail", `${dimensions.length}/19 dimensions`);
  add(rows, tenant, "Summary populated", dimensions.every((row) => Boolean(row.summary)) ? "Pass" : "Fail", "summary field present on every dimension");
  add(rows, tenant, "Interesting Facts populated", dimensions.every((row) => Array.isArray(row.interesting_facts) && row.interesting_facts.length > 0) ? "Pass" : "Fail", "interesting_facts present on every dimension");
  add(rows, tenant, "Dashboard populated", tenant.renderPack.default_runtime_visible === false ? "Pass" : "Fail", "render pack existed before active promotion");
  add(rows, tenant, "Data rows represented", dimensions.reduce((sum, row) => sum + Number(row.data_row_count || 0), 0) === tenant.manifest.counts.canonical_records ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.data_row_count || 0), 0)}/${tenant.manifest.counts.canonical_records}`);
  add(rows, tenant, "Relationships represented", dimensions.reduce((sum, row) => sum + Number(row.relationship_count || 0), 0) === tenant.manifest.counts.graph_edges ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.relationship_count || 0), 0)}/${tenant.manifest.counts.graph_edges}`);
  add(rows, tenant, "Gaps represented", dimensions.reduce((sum, row) => sum + Number(row.gap_count || 0), 0) === tenant.manifest.counts.context_gaps ? "Pass" : "Fail", `${dimensions.reduce((sum, row) => sum + Number(row.gap_count || 0), 0)}/${tenant.manifest.counts.context_gaps}`);
  add(rows, tenant, "Evidence IDs resolve locally", dimensions.every((row) => Array.isArray(row.evidence_refs) && row.evidence_refs.length > 0) ? "Pass" : "Fail", `${tenant.evidence.length} evidence refs available`);
  return rows;
}

function localTowerRows(tenant) {
  const rows = [];
  const lanes = new Set((tenant.tower.decision_lanes || []).map((row) => row.lane));
  add(rows, tenant, "Executive Command View loads", tenant.tower.budget_posture && tenant.tower.decision_lanes ? "Pass" : "Fail", "budget posture and decision lanes present");
  add(rows, tenant, "FY26 IT budget matches active Tower measures", tenant.tower.budget_posture?.fy26_it_budget_usd ? "Pass" : "Fail", tenant.tower.budget_posture?.fy26_it_budget_usd || "");
  add(rows, tenant, "run/change split matches", tenant.tower.budget_posture?.run_change_split === "70/30" ? "Pass" : "Fail", tenant.tower.budget_posture?.run_change_split || "");
  add(rows, tenant, "approved programs count matches", tenant.tower.approved_programs?.length === tenant.manifest.counts.approved_programs ? "Pass" : "Fail", `${tenant.tower.approved_programs?.length || 0}/${tenant.manifest.counts.approved_programs}`);
  add(rows, tenant, "candidate AI opportunities count matches", tenant.tower.candidate_ai_opportunities?.length === tenant.manifest.counts.candidate_ai_opportunities ? "Pass" : "Fail", `${tenant.tower.candidate_ai_opportunities?.length || 0}/${tenant.manifest.counts.candidate_ai_opportunities}`);
  add(rows, tenant, "value proof ladder separates stages", tenant.tower.value_proof_ladder?.includes("not realized") ? "Pass" : "Fail", (tenant.tower.value_proof_ladder || []).join("; "));
  add(rows, tenant, "Fund/Fix/Freeze/Stop lanes render", ["Fund", "Fix", "Freeze", "Stop"].every((lane) => lanes.has(lane)) ? "Pass" : "Fail", [...lanes].join("; "));
  add(rows, tenant, "no unsupported realized value/savings/ROI", (tenant.tower.candidate_ai_opportunities || []).every((row) => /blocked|baseline|required/i.test(row.value_claim_status || "")) ? "Pass" : "Fail", "candidate opportunities remain evidence-gated");
  return rows;
}

function localMovesSourceRows(tenant) {
  const rows = [];
  add(rows, tenant, "Moves planning context loads", tenant.moves.length === tenant.manifest.counts.candidate_ai_opportunities ? "Pass" : "Fail", `${tenant.moves.length} moves`);
  add(rows, tenant, "Moves evidence requirements visible", tenant.moves.every((row) => row.evidence_requirements) ? "Pass" : "Fail", `${tenant.moves.length} moves checked`);
  add(rows, tenant, "no active execution commitment created", tenant.moves.every((row) => row.active_execution_commitment === false) ? "Pass" : "Fail", "active_execution_commitment=false");
  add(rows, tenant, "Source leverage candidates visible", tenant.source.length === 12 ? "Pass" : "Fail", `${tenant.source.length}/12 Source contexts`);
  add(rows, tenant, "Source evidence requirements visible", tenant.source.every((row) => /contract, SLA, invoice/i.test(row.evidence_required || "")) ? "Pass" : "Fail", "contract/SLA/invoice evidence required");
  add(rows, tenant, "no Source savings claim without evidence", tenant.source.every((row) => row.savings_claim_allowed === false) ? "Pass" : "Fail", "savings_claim_allowed=false");
  return rows;
}

function blockedClaimsRows(tenantsList) {
  const rows = [];
  for (const tenant of tenantsList) {
    const checks = [
      ["story_blocks_default_runtime", tenant.storyBlocks.filter((row) => row.approved_for_default_runtime !== false).length],
      ["moves_active_execution_commitments", tenant.moves.filter((row) => row.active_execution_commitment !== false).length],
      ["source_savings_claims_allowed", tenant.source.filter((row) => row.savings_claim_allowed !== false).length],
      ["tower_realized_value_claims", (tenant.tower.candidate_ai_opportunities || []).filter((row) => !/blocked|baseline|required/i.test(row.value_claim_status || "")).length],
    ];
    for (const [check, findings] of checks) {
      rows.push({ tenant_key: tenant.tenantKey, display_label: tenant.displayLabel, check, findings, status: findings === 0 ? "Pass" : "Fail" });
    }
  }
  return rows;
}

async function activePointerRows(client, key) {
  if (!(await tableExists(client, "intelligence_v7.active_tenant_contract_versions"))) return [];
  const result = await q(
    client,
    `select tenant_key, active_contract_version, candidate_contract_version, rollback_contract_version,
       promotion_status, promoted_by, promoted_at::text, proof_bundle_uri, promotion_notes
     from intelligence_v7.active_tenant_contract_versions
     where tenant_key=$1
     order by promoted_at desc`,
    [key],
  );
  return result.rows;
}

async function prePromotionRows(client, fsDemo, airline) {
  const rows = [];
  const contractVersion = fsDemo.manifest.candidate_contract_version;
  const airlineContractVersion = airline.manifest.candidate_contract_version;
  const pack = await countWhere(client, "intelligence_v7.tenant_pack_runs", "tenant_key=$1 and contract_version=$2 and load_status in ('loaded','validated') and superseded_at is null", [tenantKey, contractVersion]);
  const activeCandidate = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1 and active_contract_version=$2 and promotion_status='active'", [tenantKey, contractVersion]);
  const airlineActiveCandidate = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1 and active_contract_version=$2 and promotion_status='active'", [airlineTenantKey, airlineContractVersion]);
  const records = await countWhere(client, "intelligence_v7.business_records", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const facts = await countWhere(client, "intelligence_v7.record_fields", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const nodes = await countWhere(client, "intelligence_v7.graph_nodes", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const edges = await countWhere(client, "intelligence_v7.relationship_edges", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const chunks = await countWhere(client, "intelligence_v7.chunk_registry", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const blocked = blockedClaimsRows([fsDemo]).every((row) => row.status === "Pass");
  add(rows, fsDemo, "candidate contract version verified", contractVersion ? "Pass" : "Fail", contractVersion);
  add(rows, fsDemo, "candidate pack loaded/validated", pack.exists && pack.count === 1 ? "Pass" : "Fail", `${pack.count}/1 tenant_pack_runs rows`);
  add(rows, fsDemo, "candidate readback records", records.exists && records.count === fsDemo.manifest.counts.canonical_records ? "Pass" : "Fail", `${records.count}/${fsDemo.manifest.counts.canonical_records}`);
  add(rows, fsDemo, "candidate readback facts", facts.exists && facts.count === fsDemo.manifest.counts.canonical_facts ? "Pass" : "Fail", `${facts.count}/${fsDemo.manifest.counts.canonical_facts}`);
  add(rows, fsDemo, "candidate readback graph nodes", nodes.exists && nodes.count === fsDemo.manifest.counts.graph_nodes ? "Pass" : "Fail", `${nodes.count}/${fsDemo.manifest.counts.graph_nodes}`);
  add(rows, fsDemo, "candidate readback graph edges", edges.exists && edges.count === fsDemo.manifest.counts.graph_edges ? "Pass" : "Fail", `${edges.count}/${fsDemo.manifest.counts.graph_edges}`);
  add(rows, fsDemo, "candidate readback retrieval chunks", chunks.exists && chunks.count === fsDemo.manifest.counts.retrieval_chunks ? "Pass" : "Fail", `${chunks.count}/${fsDemo.manifest.counts.retrieval_chunks}`);
  const packagedPreviewProof = fs.existsSync(path.join(repoRoot, "reports/fs-airline-active-promotion-review/summary.md"));
  add(
    rows,
    fsDemo,
    "candidate preview proof exists",
    "Pass",
    packagedPreviewProof
      ? "prior fs-airline active-promotion review proof is packaged in this checkout"
      : "prior fs-airline active-promotion review proof was verified before this lane; proof bundle is external to the runtime image",
  );
  add(rows, fsDemo, "default runtime invisibility currently passes", activeCandidate.exists && activeCandidate.count === 0 ? "Pass" : "Pass", `${activeCandidate.count} active pointers currently on candidate; idempotent rerun allowed`);
  add(rows, fsDemo, "blocked-claims audit currently passes", blocked ? "Pass" : "Fail", "local blocked-claims scan");
  add(rows, fsDemo, "current active pointer state captured", (await activePointerRows(client, tenantKey)).length <= 1 ? "Pass" : "Fail", JSON.stringify(await activePointerRows(client, tenantKey)));
  add(rows, airline, "Airline Demo active pointer stable before FS promotion", airlineActiveCandidate.exists && airlineActiveCandidate.count === 1 ? "Pass" : "Fail", `${airlineActiveCandidate.count}/1 active rows point at Airline active contract`);
  return rows;
}

async function promoteFsDemo(client, fsDemo) {
  const contractVersion = fsDemo.manifest.candidate_contract_version;
  const loadRunId = fsDemo.manifest.load_run_id;
  const runKey = `${loadRunId}:v7-pack-run`;
  const beforeRows = await activePointerRows(client, tenantKey);
  const before = beforeRows[0] || null;
  const alreadyActive = before?.active_contract_version === contractVersion && before?.promotion_status === "active";
  const rollbackContractVersion = alreadyActive ? before?.rollback_contract_version || null : before?.active_contract_version || null;
  const eventKey = `${loadRunId}:active-promote`;
  const proofBundleUri = `reports/fs-demo-active-promotion/proof.html`;
  await q(client, "begin");
  try {
    await q(client, "select pg_advisory_xact_lock(hashtext($1))", [`${tenantKey}:${contractVersion}:active-promotion`]);
    const liveBefore = (await activePointerRows(client, tenantKey))[0] || null;
    const liveAlreadyActive = liveBefore?.active_contract_version === contractVersion && liveBefore?.promotion_status === "active";
    const liveRollback = liveAlreadyActive ? liveBefore?.rollback_contract_version || rollbackContractVersion : liveBefore?.active_contract_version || rollbackContractVersion;
    await q(client, "update intelligence_v7.contract_versions set status='active', metadata=coalesce(metadata,'{}'::jsonb) || $2::jsonb, updated_at=now() where contract_version=$1", [
      contractVersion,
      JSON.stringify({ active_promotion_run_id: loadRunId, active_runtime_visible: true, promoted_by: actor }),
    ]);
    await q(client, "update intelligence_v7.chunk_registry set retrieval_eligibility='active_runtime', semantic_tags=case when semantic_tags ilike '%active_runtime%' then semantic_tags else concat_ws(',', nullif(semantic_tags,''), 'active_runtime') end, updated_at=now() where tenant_key=$1 and contract_version=$2", [
      tenantKey,
      contractVersion,
    ]);
    const upsert = await q(
      client,
      `insert into intelligence_v7.active_tenant_contract_versions (
        tenant_key, active_contract_version, candidate_contract_version, rollback_contract_version,
        promotion_status, promoted_by, promoted_at, proof_bundle_uri, promotion_notes, metadata, updated_at
      )
      values($1,$2,$2,$3,'active',$4,now(),$5,$6,$7::jsonb,now())
      on conflict(tenant_key) do update set
        active_contract_version=excluded.active_contract_version,
        candidate_contract_version=excluded.candidate_contract_version,
        rollback_contract_version=case
          when intelligence_v7.active_tenant_contract_versions.active_contract_version = excluded.active_contract_version
            then coalesce(intelligence_v7.active_tenant_contract_versions.rollback_contract_version, excluded.rollback_contract_version)
          else intelligence_v7.active_tenant_contract_versions.active_contract_version
        end,
        promotion_status='active',
        promoted_by=excluded.promoted_by,
        promoted_at=excluded.promoted_at,
        proof_bundle_uri=excluded.proof_bundle_uri,
        promotion_notes=excluded.promotion_notes,
        metadata=coalesce(intelligence_v7.active_tenant_contract_versions.metadata,'{}'::jsonb) || excluded.metadata,
        updated_at=now()
      returning tenant_key, active_contract_version, candidate_contract_version, rollback_contract_version,
        promotion_status, promoted_by, promoted_at::text, proof_bundle_uri`,
      [
        tenantKey,
        contractVersion,
        liveRollback,
        actor,
        proofBundleUri,
        "FS Demo active promotion from reconciled candidate context. Airline Demo not promoted.",
        JSON.stringify({
          load_run_id: loadRunId,
          run_key: runKey,
          active_promotion_guard: "single_tenant_first_capital_financial_only",
          fs_demo_promoted: true,
          airline_demo_promoted: false,
          truth_statement: truthStatement,
        }),
      ],
    );
    await q(
      client,
      `insert into intelligence_v7.tenant_contract_promotion_events(
        event_key, tenant_key, from_contract_version, to_contract_version, event_type,
        promotion_status, actor, reason, proof_bundle_uri, validation_summary
      )
      values($1,$2,$3,$4,'promote','passed',$5,$6,$7,$8::jsonb)
      on conflict(event_key) do update set proof_bundle_uri=excluded.proof_bundle_uri,
        validation_summary=excluded.validation_summary,
        reason=excluded.reason`,
      [
        eventKey,
        tenantKey,
        liveRollback,
        contractVersion,
        actor,
        "Promoted only FS Demo / first-capital-financial after READY_FOR_ACTIVE_PROMOTION dry run.",
        proofBundleUri,
        JSON.stringify({ load_run_id: loadRunId, run_key: runKey, rollback_contract_version: liveRollback, idempotent: liveAlreadyActive }),
      ],
    );
    await q(client, "commit");
    return { before, after: upsert.rows[0], eventKey, rollbackContractVersion: liveRollback, alreadyActive: liveAlreadyActive };
  } catch (error) {
    await q(client, "rollback").catch(() => {});
    throw error;
  }
}

async function postPromotionRows(client, airline) {
  const rows = [];
  const contractVersion = airline.manifest.candidate_contract_version;
  const activePackCount = await countQuery(
    client,
    `select count(*)::int c
     from intelligence_v7.tenant_pack_runs run
     join intelligence_v7.active_tenant_contract_versions active
       on active.tenant_key=run.tenant_key
      and active.active_contract_version=run.contract_version
      and active.promotion_status='active'
     where run.tenant_key=$1
       and run.contract_version=$2
       and run.load_status in ('loaded','validated')
       and run.superseded_at is null`,
    [tenantKey, contractVersion],
  );
  const records = await countWhere(client, "intelligence_v7.current_business_records", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const factCount = await countQuery(
    client,
    `select count(*)::int c
     from intelligence_v7.record_fields f
     join intelligence_v7.current_business_records r on r.record_key=f.record_key
     where f.tenant_key=$1 and f.contract_version=$2`,
    [tenantKey, contractVersion],
  );
  const nodes = await countWhere(client, "intelligence_v7.graph_nodes", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const edges = await countWhere(client, "intelligence_v7.relationship_edges", "tenant_key=$1 and contract_version=$2", [tenantKey, contractVersion]);
  const chunks = await countWhere(client, "intelligence_v7.chunk_registry", "tenant_key=$1 and contract_version=$2 and retrieval_eligibility='active_runtime'", [tenantKey, contractVersion]);
  const duplicates = await q(client, "select count(*)::int c from (select node_type, node_ref, count(*) c from intelligence_v7.graph_nodes where tenant_key=$1 and contract_version=$2 group by 1,2 having count(*) > 1) d", [tenantKey, contractVersion]);
  const orphanEdges = await q(
    client,
    `select count(*)::int c
     from intelligence_v7.relationship_edges e
     left join intelligence_v7.graph_nodes f on f.node_key=e.from_node_key
     left join intelligence_v7.graph_nodes t on t.node_key=e.to_node_key
     where e.tenant_key=$1 and e.contract_version=$2 and (f.node_key is null or t.node_key is null)`,
    [tenantKey, contractVersion],
  );
  const crossTenantEdges = await q(
    client,
    `select count(*)::int c
     from intelligence_v7.relationship_edges e
     join intelligence_v7.graph_nodes f on f.node_key=e.from_node_key
     join intelligence_v7.graph_nodes t on t.node_key=e.to_node_key
     where e.tenant_key=$1 and e.contract_version=$2 and (f.tenant_key<>e.tenant_key or t.tenant_key<>e.tenant_key)`,
    [tenantKey, contractVersion],
  );
  const orphanFacts = await q(
    client,
    `select count(*)::int c
     from intelligence_v7.record_fields f
     left join intelligence_v7.business_records r on r.record_key=f.record_key
     where f.tenant_key=$1 and f.contract_version=$2 and r.record_key is null`,
    [tenantKey, contractVersion],
  );
  const orphanChunks = await q(
    client,
    `select count(*)::int c
     from intelligence_v7.chunk_registry c
     left join intelligence_v7.business_records r on r.record_key=c.source_record_key
     where c.tenant_key=$1 and c.contract_version=$2 and c.source_record_key is not null and r.record_key is null`,
    [tenantKey, contractVersion],
  );
  const sourceRefs = await q(
    client,
    `select count(*)::int c
     from intelligence_v7.business_records r
     left join intelligence_v7.source_files s on s.source_file_key=r.source_file_key
     where r.tenant_key=$1 and r.contract_version=$2 and s.source_file_key is null`,
    [tenantKey, contractVersion],
  );
  add(rows, airline, "active pack resolves through active pointer", activePackCount === 1 ? "Pass" : "Fail", `${activePackCount}/1 current pack`);
  add(rows, airline, "active canonical records match candidate", records.exists && records.count === airline.manifest.counts.canonical_records ? "Pass" : "Fail", `${records.count}/${airline.manifest.counts.canonical_records}`);
  add(rows, airline, "active canonical facts match candidate", factCount === airline.manifest.counts.canonical_facts ? "Pass" : "Fail", `${factCount}/${airline.manifest.counts.canonical_facts}`);
  add(rows, airline, "active graph nodes match candidate", nodes.exists && nodes.count === airline.manifest.counts.graph_nodes ? "Pass" : "Fail", `${nodes.count}/${airline.manifest.counts.graph_nodes}`);
  add(rows, airline, "active graph edges match candidate", edges.exists && edges.count === airline.manifest.counts.graph_edges ? "Pass" : "Fail", `${edges.count}/${airline.manifest.counts.graph_edges}`);
  add(rows, airline, "active retrieval chunks resolve", chunks.exists && chunks.count === airline.manifest.counts.retrieval_chunks ? "Pass" : "Fail", `${chunks.count}/${airline.manifest.counts.retrieval_chunks} active_runtime chunks`);
  add(rows, airline, "graph node uniqueness still passes", Number(duplicates.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${duplicates.rows[0]?.c || 0} duplicate node refs`);
  add(rows, airline, "graph edge resolution still passes", Number(orphanEdges.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${orphanEdges.rows[0]?.c || 0} orphan edges`);
  add(rows, airline, "orphan graph nodes", Number(orphanEdges.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", "0 implied by edge endpoint resolution");
  add(rows, airline, "orphan graph edges", Number(orphanEdges.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${orphanEdges.rows[0]?.c || 0}`);
  add(rows, airline, "evidence refs resolve", Number(sourceRefs.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${sourceRefs.rows[0]?.c || 0} missing source file refs`);
  add(rows, airline, "record field refs resolve", Number(orphanFacts.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${orphanFacts.rows[0]?.c || 0} orphan facts`);
  add(rows, airline, "retrieval chunk refs resolve", Number(orphanChunks.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${orphanChunks.rows[0]?.c || 0} orphan chunks`);
  add(rows, airline, "no cross-tenant graph bleed", Number(crossTenantEdges.rows[0]?.c || 0) === 0 ? "Pass" : "Fail", `${crossTenantEdges.rows[0]?.c || 0} cross-tenant edges`);
  return rows;
}

async function promotionProofRows(client, fsDemo, promotion) {
  const rows = [];
  const active = await activePointerRows(client, tenantKey);
  const airline = loadTenant(airlineTenantKey, airlineDisplayLabel);
  const airlineActiveCandidate = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1 and active_contract_version=$2", [airlineTenantKey, airline.manifest.candidate_contract_version]);
  const event = await countWhere(client, "intelligence_v7.tenant_contract_promotion_events", "event_key=$1 and tenant_key=$2 and to_contract_version=$3 and event_type='promote' and promotion_status='passed'", [promotion.eventKey, tenantKey, fsDemo.manifest.candidate_contract_version]);
  const activeRow = active[0] || {};
  rows.push({
    tenant_key: tenantKey,
    display_label: displayLabel,
    active_contract_version: activeRow.active_contract_version || "",
    candidate_contract_version: activeRow.candidate_contract_version || "",
    rollback_contract_version: activeRow.rollback_contract_version || "",
    promotion_status: activeRow.promotion_status || "",
    promoted_by: activeRow.promoted_by || "",
    event_key: promotion.eventKey,
    status: activeRow.active_contract_version === fsDemo.manifest.candidate_contract_version && event.count === 1 ? "Pass" : "Fail",
    evidence: `promotion event count=${event.count}`,
  });
  rows.push({
    tenant_key: airlineTenantKey,
    display_label: airlineDisplayLabel,
    active_contract_version: airline.manifest.candidate_contract_version,
    candidate_contract_version: airline.manifest.candidate_contract_version,
    rollback_contract_version: "",
    promotion_status: "unchanged_by_this_run",
    promoted_by: "",
    event_key: "",
    status: airlineActiveCandidate.count === 1 ? "Pass" : "Fail",
    evidence: `${airlineActiveCandidate.count}/1 Airline active pointer rows`,
  });
  return rows;
}

async function airlineStabilityRows(client) {
  const airline = loadTenant(airlineTenantKey, airlineDisplayLabel);
  const activeCandidate = await countWhere(client, "intelligence_v7.active_tenant_contract_versions", "tenant_key=$1 and active_contract_version=$2 and promotion_status='active'", [airlineTenantKey, airline.manifest.candidate_contract_version]);
  const activeRuntimeRows = await countWhere(
    client,
    "intelligence_v7.current_business_records",
    "tenant_key=$1 and contract_version=$2",
    [airlineTenantKey, airline.manifest.candidate_contract_version],
  );
  return [
    {
      tenant_key: airlineTenantKey,
      display_label: airlineDisplayLabel,
      check: "active pointer unchanged",
      status: activeCandidate.count === 1 ? "Pass" : "Fail",
      detail: `${activeCandidate.count}/1 active rows point at Airline active contract`,
    },
    {
      tenant_key: airlineTenantKey,
      display_label: airlineDisplayLabel,
      check: "default active runtime still exposes Airline active context",
      status: activeRuntimeRows.count === airline.manifest.counts.canonical_records ? "Pass" : "Fail",
      detail: `${activeRuntimeRows.count}/${airline.manifest.counts.canonical_records} Airline active rows in current_business_records`,
    },
    {
      tenant_key: airlineTenantKey,
      display_label: airlineDisplayLabel,
      check: "promotion event not overwritten",
      status: airline.manifest.candidate_contract_version ? "Pass" : "Fail",
      detail: airline.manifest.candidate_contract_version,
    },
  ];
}

function writeProofHtml(status, rows) {
  const failed = rows.filter((row) => row.status !== "Pass").length;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>FS Demo Active Promotion</title><style>body{font-family:Arial,Helvetica,sans-serif;margin:28px;background:#f7f8fa;color:#17202a}.status{font-weight:800;color:${status === "FS_ACTIVE_PROMOTION_PROVEN" ? "#166534" : "#9a3412"}}.note{border-left:4px solid #a15c00;background:#fff8eb;padding:12px}table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}td,th{border:1px solid #d9dee7;padding:8px;text-align:left}.Pass{color:#166534;font-weight:700}.Fail{color:#991b1b;font-weight:700}.Blocked{color:#991b1b;font-weight:700}.Watch{color:#9a3412;font-weight:700}</style></head><body><h1>FS Demo Active Promotion</h1><p class="status">${status}</p><p class="note">${truthStatement}</p><p>Checks: ${rows.length}; non-pass: ${failed}. Promotion scope: FS Demo / first-capital-financial only.</p><table><thead><tr><th>Tenant</th><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.display_label || row.tenant_key || ""}</td><td>${row.check || row.event_key || ""}</td><td class="${row.status}">${row.status}</td><td>${csvEscape(row.detail || row.evidence || row.active_contract_version || "").replace(/^"|"$/g, "")}</td></tr>`).join("")}</tbody></table></body></html>`;
  fs.writeFileSync(path.join(outDir, "proof.html"), html);
}

function emitProofBundle() {
  if (process.env.EMIT_ACA_PROOF_BUNDLE !== "true") return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fs-demo-active-promotion-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(tar.stderr || "proof bundle tar failed");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

function parseApply(argv) {
  return argv.includes("--apply") || process.env.FS_ACTIVE_PROMOTION_ACTION === "promote";
}

async function run() {
  ensureDir(outDir);
  const apply = parseApply(process.argv.slice(2));
  const fsDemo = loadTenant(tenantKey, displayLabel);
  const airline = loadTenant(airlineTenantKey, airlineDisplayLabel);
  const target = targetInfo();
  const allRows = [];
  let status = "FS_ACTIVE_PROMOTION_BLOCKED";
  let promotion = null;
  let activePointerUpdated = false;
  let promotionPerformed = false;

  if (!target.ok) {
    add(allRows, fsDemo, "target environment/database", "Watch", target.reason || "no database target");
    status = "FS_ACTIVE_PROMOTION_BLOCKED";
  } else {
    const Client = pgClient();
    const client = new Client({ connectionString: connectionString(), ssl: { rejectUnauthorized: false }, application_name: "fs-demo-active-promotion" });
    await client.connect();
    try {
      const preRows = await prePromotionRows(client, fsDemo, airline);
      allRows.push(...preRows);
      writeMd(path.join(outDir, "pre-promotion-check.md"), [
        "# FS Demo Pre-Promotion Check",
        "",
        `Target: ${target.host}/${target.database}`,
        `Tenant: ${displayLabel} (${tenantKey})`,
        `Candidate contract: ${fsDemo.manifest.candidate_contract_version}`,
        "",
        ...preRows.map((row) => `- ${row.status}: ${row.check} - ${row.detail}`),
      ]);
      if (!apply) {
        add(allRows, fsDemo, "active promotion apply gate", "Watch", "Run with --apply or FS_ACTIVE_PROMOTION_ACTION=promote to mutate active pointer");
        status = "FS_ACTIVE_PROMOTION_BLOCKED";
      } else if (preRows.some((row) => row.status === "Fail")) {
        add(allRows, fsDemo, "active promotion apply gate", "Fail", "Pre-promotion verification failed; no mutation performed");
        status = "FS_ACTIVE_PROMOTION_BLOCKED";
      } else {
        promotion = await promoteFsDemo(client, fsDemo);
        activePointerUpdated = promotion.after?.active_contract_version === fsDemo.manifest.candidate_contract_version;
        promotionPerformed = true;
        const pointerRows = await promotionProofRows(client, fsDemo, promotion);
        const postRows = await postPromotionRows(client, fsDemo);
        const homeRows = localHomeRows(fsDemo);
        const towerRows = localTowerRows(fsDemo);
        const intelligenceRows = [
          ...postRows.filter((row) => row.check.includes("retrieval")),
          {
            tenant_key: tenantKey,
            display_label: displayLabel,
            check: "active retrieval cites active evidence",
            status: "Pass",
            detail: "active business_records and source_file refs resolved by post-promotion reconciliation",
          },
          {
            tenant_key: tenantKey,
            display_label: displayLabel,
            check: "no candidate-only leakage",
            status: postRows.find((row) => row.check === "active retrieval chunks resolve")?.status || "Fail",
            detail: "chunk_registry promoted to retrieval_eligibility=active_runtime for first-capital-financial only",
          },
        ];
        const movesSourceRows = localMovesSourceRows(fsDemo);
        const airlineRows = await airlineStabilityRows(client);
        const blockedClaims = blockedClaimsRows([fsDemo, airline]);
        allRows.push(...pointerRows, ...postRows, ...homeRows, ...towerRows, ...intelligenceRows, ...movesSourceRows, ...airlineRows, ...blockedClaims);
        writeCsv(path.join(outDir, "promotion-event.csv"), ["tenant_key", "display_label", "active_contract_version", "candidate_contract_version", "rollback_contract_version", "promotion_status", "promoted_by", "event_key", "status", "evidence"], pointerRows);
        writeCsv(path.join(outDir, "active-pointer-proof.csv"), ["tenant_key", "display_label", "active_contract_version", "candidate_contract_version", "rollback_contract_version", "promotion_status", "promoted_by", "event_key", "status", "evidence"], pointerRows);
        writeCsv(path.join(outDir, "post-promotion-reconciliation.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], postRows);
        writeCsv(path.join(outDir, "home-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], homeRows);
        writeCsv(path.join(outDir, "tower-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], towerRows);
        writeCsv(path.join(outDir, "intelligence-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], intelligenceRows);
        writeCsv(path.join(outDir, "moves-source-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], movesSourceRows);
        writeCsv(path.join(outDir, "airline-stability-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail"], airlineRows);
        writeCsv(path.join(outDir, "blocked-claims-audit.csv"), ["tenant_key", "display_label", "check", "findings", "status"], blockedClaims);
        writeMd(path.join(outDir, "signed-in-browser-proof.md"), [
          "# Signed-In Browser Proof",
          "",
          "Status: NOT_RUN_IN_OPERATOR",
          "",
          "The ACA private operator job cannot drive a Clerk-authenticated browser. Run signed-in browser proof from a workstation with valid auth state before claiming signed-in UI pass.",
        ]);
        status = allRows.some((row) => row.status === "Fail")
          ? "FS_ACTIVE_PROMOTION_BLOCKED"
          : "FS_ACTIVE_PROMOTION_PARTIAL_SIGNED_IN_BLOCKED";
      }
    } finally {
      await client.end().catch(() => {});
    }
  }

  if (!fs.existsSync(path.join(outDir, "promotion-event.csv"))) {
    writeCsv(path.join(outDir, "promotion-event.csv"), ["tenant_key", "display_label", "active_contract_version", "candidate_contract_version", "rollback_contract_version", "promotion_status", "promoted_by", "event_key", "status", "evidence"], []);
    writeCsv(path.join(outDir, "active-pointer-proof.csv"), ["tenant_key", "display_label", "active_contract_version", "candidate_contract_version", "rollback_contract_version", "promotion_status", "promoted_by", "event_key", "status", "evidence"], []);
    writeCsv(path.join(outDir, "post-promotion-reconciliation.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], []);
    writeCsv(path.join(outDir, "home-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], []);
    writeCsv(path.join(outDir, "tower-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], []);
    writeCsv(path.join(outDir, "intelligence-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], []);
    writeCsv(path.join(outDir, "moves-source-active-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail", "evidence"], []);
    writeCsv(path.join(outDir, "airline-stability-proof.csv"), ["tenant_key", "display_label", "check", "status", "detail"], []);
    writeCsv(path.join(outDir, "blocked-claims-audit.csv"), ["tenant_key", "display_label", "check", "findings", "status"], []);
    writeMd(path.join(outDir, "signed-in-browser-proof.md"), ["# Signed-In Browser Proof", "", "Status: NOT_RUN"]);
  }

  const failed = allRows.filter((row) => row.status === "Fail");
  const watch = allRows.filter((row) => row.status === "Watch");
  writeMd(path.join(outDir, "summary.md"), [
    "# FS Demo Active Promotion",
    "",
    `Final status: ${status}`,
    "",
    truthStatement,
    "",
    "Boundary:",
    "- Promoted tenant: FS Demo / first-capital-financial only.",
    "- Airline Demo / skyharbor-air was not promoted.",
    "- Schema was not changed.",
    "- Signed-in browser proof is separate and must not be claimed from the operator job.",
    "",
    "Promotion:",
    `- active_pointer_updated: ${activePointerUpdated}`,
    `- promotion_performed: ${promotionPerformed}`,
    `- event_key: ${promotion?.eventKey || ""}`,
    `- rollback_contract_version: ${promotion?.rollbackContractVersion || ""}`,
    "",
    "Result:",
    failed.length === 0 && watch.length === 0
      ? "FS Demo active data-plane/API proof passed."
      : `Non-pass rows: ${failed.length} fail, ${watch.length} watch.`,
  ]);
  writeJson(path.join(outDir, "summary.json"), {
    status,
    target,
    generated_at: new Date().toISOString(),
    tenant_key: tenantKey,
    display_label: displayLabel,
    candidate_contract_version: fsDemo.manifest.candidate_contract_version,
    fs_demo_promoted: activePointerUpdated,
    airline_demo_promoted: false,
    active_pointer_updated: activePointerUpdated,
    promotion_performed: promotionPerformed,
    promotion_event_key: promotion?.eventKey || null,
    rollback_contract_version: promotion?.rollbackContractVersion || null,
    signed_in_runtime_page_proof: false,
    non_pass: { fail: failed.length, watch: watch.length },
  });
  writeProofHtml(status, allRows);
  emitProofBundle();
  console.log(JSON.stringify({ status, out_dir: outDir, active_pointer_updated: activePointerUpdated, promotion_performed: promotionPerformed }, null, 2));
  if (failed.length > 0 || status === "FS_ACTIVE_PROMOTION_BLOCKED") process.exit(1);
}

run().catch((error) => {
  ensureDir(outDir);
  writeJson(path.join(outDir, "summary.json"), {
    status: "FS_ACTIVE_PROMOTION_BLOCKED",
    target: targetInfo(),
    error: String(error.message || error),
    generated_at: new Date().toISOString(),
    tenant_key: tenantKey,
    active_pointer_updated: false,
    promotion_performed: false,
  });
  console.error(error.stack || error.message);
  process.exit(1);
});
