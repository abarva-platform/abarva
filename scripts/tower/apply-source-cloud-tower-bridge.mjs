#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

loadDotenv(path.resolve(process.cwd(), ".env.local"));
loadDotenv(path.resolve(process.cwd(), ".env"));

const MODES = new Set(["plan", "apply", "verify"]);
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_DATASET_VERSION = "meridian-cloud-consumption-depth-v1-20260907";
const DEFAULT_PACKAGE_DIR =
  "datasets/source/cloud-consumption/meridian-cloud-consumption-depth-v1-20260907";
const DEFAULT_BUILD_VERSION = "tower-source-cloud-bridge-v20260907";
const DEFAULT_LOAD_RUN_ID =
  "source-cloud-consumption-package-meridian-cloud-consumption-depth-v1-20260907-20260907T1415Z";
const SOURCE_SYSTEM = "source_cloud_consumption_package_loader";
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";
const PROJECTION_VERSION = 2;
const CUBE_VERSION = 2;

const PROJECTION_KEYS = {
  recommended_actions: "tower_recommended_actions",
  value_proof: "tower_value_proof",
  cost_lens: "tower_cost_lens",
  evidence: "tower_evidence",
  risk_lens: "tower_risk_lens",
};

const SURFACE_BY_PAGE = {
  recommended_actions: "tower_command_center",
  value_proof: "tower_value_chain",
  cost_lens: "tower_value_chain",
  evidence: "tower_evidence_queue",
  risk_lens: "tower_evidence_queue",
};

function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseArgs() {
  const mode = argValue("mode") ?? process.env.TOWER_SOURCE_CLOUD_BRIDGE_MODE ?? "plan";
  if (!MODES.has(mode)) throw new Error(`Unsupported TOWER_SOURCE_CLOUD_BRIDGE_MODE: ${mode}`);
  const tenantKey =
    argValue("tenant-key") ??
    process.env.TOWER_SOURCE_CLOUD_BRIDGE_TENANT_KEY ??
    DEFAULT_TENANT_KEY;
  const datasetVersion =
    argValue("dataset-version") ??
    process.env.TOWER_SOURCE_CLOUD_BRIDGE_DATASET_VERSION ??
    DEFAULT_DATASET_VERSION;
  const buildVersion =
    argValue("build-version") ??
    process.env.TOWER_SOURCE_CLOUD_BRIDGE_BUILD_VERSION ??
    DEFAULT_BUILD_VERSION;
  const loadRunId =
    argValue("load-run-id") ??
    process.env.TOWER_SOURCE_CLOUD_BRIDGE_LOAD_RUN_ID ??
    DEFAULT_LOAD_RUN_ID;
  const runStamp = stamp();
  return {
    mode,
    tenantKey,
    datasetVersion,
    buildVersion,
    loadRunId,
    idempotencyKey:
      argValue("idempotency-key") ??
      process.env.TOWER_SOURCE_CLOUD_BRIDGE_IDEMPOTENCY_KEY ??
      `${tenantKey}:${datasetVersion}:${buildVersion}`,
    packageDir: path.resolve(
      process.cwd(),
      argValue("package-dir") ??
        process.env.TOWER_SOURCE_CLOUD_BRIDGE_PACKAGE_DIR ??
        DEFAULT_PACKAGE_DIR,
    ),
    proofDir: path.resolve(
      argValue("proof-dir") ??
        process.env.TOWER_SOURCE_CLOUD_BRIDGE_PROOF_DIR ??
        path.join(os.tmpdir(), `tower-source-cloud-bridge-${mode}-${runStamp}`),
    ),
    applyApproved:
      process.env.TOWER_SOURCE_CLOUD_BRIDGE_APPLY_APPROVED === "true" ||
      process.argv.includes("--apply-approved"),
    emitProofBundle:
      process.env.TOWER_SOURCE_CLOUD_BRIDGE_EMIT_PROOF_BUNDLE === "true" ||
      process.argv.includes("--emit-proof-bundle"),
  };
}

function databaseUrl() {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function shouldDisablePostgresSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "disable") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    ...(applicationName ? { application_name: applicationName } : {}),
    ssl: shouldDisablePostgresSsl(connectionString) ? false : { rejectUnauthorized: false },
  };
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableUuid(...parts) {
  const hex = sha256(parts.join("|")).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const header = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((value) => String(value).trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function readSourceFiles(packageDir) {
  const sourceDir = path.join(packageDir, "source-files");
  return Object.fromEntries(
    fs
      .readdirSync(sourceDir)
      .filter((file) => file.endsWith(".csv"))
      .sort()
      .map((file) => [file, readCsv(path.join(sourceDir, file))]),
  );
}

function value(row, key) {
  return String(row?.[key] ?? "").trim();
}

function numberValue(row, key) {
  const parsed = Number(value(row, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const groupKey = value(row, key);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
  }
  return groups;
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => value(row, key)).filter(Boolean))];
}

function sourceFilesHash(sourceFiles) {
  return sha256(stableJson(sourceFiles));
}

function requireApplyApproval(args) {
  if (!args.applyApproved) {
    throw new Error(
      "TOWER_SOURCE_CLOUD_BRIDGE_APPLY_APPROVED=true or --apply-approved is required for apply mode.",
    );
  }
}

function writeJson(filePath, valueToWrite) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(valueToWrite, null, 2)}\n`, "utf8");
}

function emitProofBundle(proofDir) {
  const result = spawnSync("tar", ["-czf", "-", "-C", path.dirname(proofDir), path.basename(proofDir)], {
    encoding: "base64",
    maxBuffer: 200 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Failed to create proof bundle");
  }
  console.log(PROOF_BEGIN);
  console.log(result.stdout);
  console.log(PROOF_END);
}

function monthEnd(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function periodStart(row) {
  return value(row, "period_start") || (value(row, "month") ? `${value(row, "month")}-01` : null);
}

function periodEnd(row) {
  return value(row, "period_end") || (value(row, "month") ? monthEnd(value(row, "month")) : null);
}

function fiscalQuarter(dateText) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateText ?? "");
  if (!match) return null;
  return `${match[1]}-Q${Math.floor((Number(match[2]) - 1) / 3) + 1}`;
}

function sourceRefs(args, opportunity) {
  return value(opportunity, "evidence_rows")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((sourceRecordId) => ({
      source_family: "source_cloud_consumption",
      source_system: SOURCE_SYSTEM,
      source_table: "source.cloud_consumption_adapter_row",
      source_record_id: sourceRecordId,
      source_file: value(opportunity, "source_file_id"),
      dataset_version: args.datasetVersion,
      load_run_id: args.loadRunId,
      contract_id: value(opportunity, "contract_id"),
      vendor_ref: value(opportunity, "vendor_ref"),
      vendor_name: value(opportunity, "vendor_name"),
    }));
}

function expectedFromPackage(sourceFiles) {
  const opportunities = sourceFiles["optimization_opportunities.csv"] ?? [];
  const contracts = sourceFiles["cloud_contract_register.csv"] ?? [];
  const contractIds = uniqueValues(contracts, "contract_id");
  const opportunityIds = uniqueValues(opportunities, "opportunity_id");
  return {
    source_expected_readback: {
      contracts: contractIds.length,
      opportunities: opportunityIds.length,
      spend_months: (sourceFiles["monthly_spend.csv"] ?? []).length,
      cloud_usage_rows: (sourceFiles["cloud_service_usage_monthly.csv"] ?? []).length,
      commitment_coverage_rows: (sourceFiles["cloud_commitment_coverage_monthly.csv"] ?? []).length,
      resource_inventory_rows: (sourceFiles["cloud_resource_inventory.csv"] ?? []).length,
      tag_quality_rows: (sourceFiles["cloud_tag_quality.csv"] ?? []).length,
      ap_reconciliation_rows: (sourceFiles["cloud_ap_invoice_reconciliation.csv"] ?? []).length,
      monetary_opportunities: opportunities.filter((row) => numberValue(row, "annual_value_usd") > 0).length,
      control_opportunities: opportunities.filter((row) => numberValue(row, "annual_value_usd") === 0).length,
    },
    tower_expected_delta: {
      projection_entry_rows: opportunities.length * 5,
      tower_recommended_actions_rows: opportunities.length,
      tower_value_proof_rows: opportunities.length,
      tower_cost_lens_rows: opportunities.length,
      tower_evidence_rows: opportunities.length,
      tower_risk_lens_rows: opportunities.length,
      cube_slice_rows: opportunities.length * 2,
    },
  };
}

function qualityGate(args, sourceFiles) {
  const failures = [];
  const opportunities = sourceFiles["optimization_opportunities.csv"] ?? [];
  const contracts = sourceFiles["cloud_contract_register.csv"] ?? [];
  const contractIds = new Set(contracts.map((row) => value(row, "contract_id")));
  const rowsWithTenant = Object.entries(sourceFiles).filter(([, rows]) =>
    rows.some((row) => "tenant_key" in row),
  );

  for (const [file, rows] of rowsWithTenant) {
    for (const row of rows) {
      const rowId = value(row, "source_row_id") || value(row, "opportunity_id") || value(row, "contract_id") || file;
      if (value(row, "tenant_key") !== args.tenantKey) failures.push(`${file}:${rowId}:wrong_tenant`);
      if ("dataset_version" in row && value(row, "dataset_version") !== args.datasetVersion) {
        failures.push(`${file}:${rowId}:wrong_dataset_version`);
      }
    }
  }

  for (const row of opportunities) {
    if (!contractIds.has(value(row, "contract_id"))) {
      failures.push(`${value(row, "opportunity_id")}:unknown_contract`);
    }
    if (!sourceRefs(args, row).length) failures.push(`${value(row, "opportunity_id")}:missing_evidence_refs`);
    if (value(row, "finance_confirmation_state") !== "not_confirmed") {
      failures.push(`${value(row, "opportunity_id")}:must_remain_not_confirmed`);
    }
  }

  const hasAws = contracts.some((row) => value(row, "cloud_provider") === "aws" || value(row, "vendor_ref") === "VEN-AWS");
  if (!hasAws) failures.push("aws_contract_required");

  return {
    status: failures.length ? "FAIL" : "PASS",
    failures,
    tenant_key: args.tenantKey,
    dataset_version: args.datasetVersion,
  };
}

async function setTenant(client, tenantKey) {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
}

async function readActiveTowerContext(client, tenantKey) {
  const active = await client.query(
    `SELECT tenant_key, assessment_id, snapshot_id, projection_version
       FROM serving.tower_active_assessment_keys()
      WHERE tenant_key = $1
      ORDER BY projection_version DESC
      LIMIT 1`,
    [tenantKey],
  );
  const row = active.rows[0];
  if (!row) throw new Error(`No active Tower assessment found for ${tenantKey}`);

  const manifests = await client.query(
    `SELECT projection_key, id, snapshot_id
       FROM ecl_projection.projection_manifest
      WHERE tenant_key = $1
        AND assessment_id = $2
        AND projection_version = $3
        AND projection_key = ANY($4::text[])`,
    [tenantKey, row.assessment_id, row.projection_version, Object.values(PROJECTION_KEYS)],
  );
  const byKey = Object.fromEntries(manifests.rows.map((manifest) => [manifest.projection_key, manifest]));
  for (const key of Object.values(PROJECTION_KEYS)) {
    if (!byKey[key]) throw new Error(`Missing active Tower projection manifest ${key}`);
  }

  const cubeManifests = await client.query(
    `SELECT cube_key, id, snapshot_id
       FROM ecl_projection.cube_manifest
      WHERE tenant_key = $1
        AND assessment_id = $2
        AND cube_version = $3
        AND cube_key = ANY($4::text[])`,
    [tenantKey, row.assessment_id, CUBE_VERSION, ["tower_spend_value_cube", "tower_evidence_cube"]],
  );
  const cubeByKey = Object.fromEntries(cubeManifests.rows.map((manifest) => [manifest.cube_key, manifest]));
  for (const key of ["tower_spend_value_cube", "tower_evidence_cube"]) {
    if (!cubeByKey[key]) throw new Error(`Missing active Tower cube manifest ${key}`);
  }

  return {
    tenantKey: row.tenant_key,
    assessmentId: row.assessment_id,
    projectionVersion: Number(row.projection_version),
    snapshotId: String(row.snapshot_id),
    manifests: byKey,
    cubeManifests: cubeByKey,
  };
}

async function sourceReadback(client, args, sourceFiles) {
  const contracts = uniqueValues(sourceFiles["cloud_contract_register.csv"] ?? [], "contract_id");
  const opportunities = uniqueValues(sourceFiles["optimization_opportunities.csv"] ?? [], "opportunity_id");
  const result = await client.query(
    `SELECT
       (SELECT count(*)::int FROM source.contract_360 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS contracts,
       (SELECT count(*)::int FROM consumption.sourcing_opportunity_v1 WHERE tenant_key = $1 AND opportunity_id = ANY($3::text[]) AND load_run_id = $4) AS opportunities,
       (SELECT count(*)::int FROM consumption.sourcing_spend_monthly_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS spend_months,
       (SELECT count(*)::int FROM consumption.sourcing_cloud_usage_monthly_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS cloud_usage_rows,
       (SELECT count(*)::int FROM consumption.sourcing_cloud_commitment_coverage_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS commitment_coverage_rows,
       (SELECT count(*)::int FROM consumption.sourcing_cloud_resource_inventory_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS resource_inventory_rows,
       (SELECT count(*)::int FROM consumption.sourcing_cloud_tag_quality_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS tag_quality_rows,
       (SELECT count(*)::int FROM consumption.sourcing_cloud_ap_invoice_reconciliation_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])) AS ap_reconciliation_rows,
       (SELECT count(*)::int FROM consumption.sourcing_opportunity_v1 WHERE tenant_key = $1 AND opportunity_id = ANY($3::text[]) AND annual_value_exposed > 0) AS monetary_opportunities,
       (SELECT count(*)::int FROM consumption.sourcing_opportunity_v1 WHERE tenant_key = $1 AND opportunity_id = ANY($3::text[]) AND annual_value_exposed = 0) AS control_opportunities`,
    [args.tenantKey, contracts, opportunities, args.loadRunId],
  );
  return result.rows[0] ?? {};
}

async function loadOpportunities(client, args, sourceFiles) {
  const opportunityIds = uniqueValues(sourceFiles["optimization_opportunities.csv"] ?? [], "opportunity_id");
  const result = await client.query(
    `SELECT
       o.opportunity_id,
       o.contract_id,
       o.vendor_id AS vendor_ref,
       COALESCE(v.legal_name, c.vendor_id, o.vendor_id) AS vendor_name,
       o.action_type,
       o.opportunity_type,
       o.title,
       o.finding_summary,
       o.deterministic_basis,
       o.annual_value_exposed,
       o.addressable_spend,
       o.priority,
       o.confidence,
       o.readiness_state,
       o.evidence_state,
       o.recommended_action,
       o.accountable_role,
       o.decision_due_date,
       o.finding_rule_ref,
       o.knowledge_baseline_ref,
       o.authority_state,
       o.load_run_id,
       c.contract_name,
       c.actual_annual_spend,
       c.annual_value AS annual_contract_value,
       c.end_date AS expiration_date,
       c.renewal_notice_date AS notice_deadline,
       c.auto_renew,
       c.benchmarking_clause AS benchmark_rights,
       c.exit_rights_summary AS termination_rights
     FROM consumption.sourcing_opportunity_v1 o
     JOIN source.contract_360 c
       ON c.tenant_key = o.tenant_key
      AND c.contract_id = o.contract_id
     LEFT JOIN source.vendor v
       ON v.tenant_key = o.tenant_key
      AND v.vendor_id = o.vendor_id
     WHERE o.tenant_key = $1
       AND o.opportunity_id = ANY($2::text[])
       AND o.load_run_id = $3
     ORDER BY COALESCE(o.annual_value_exposed, 0) DESC, o.opportunity_id`,
    [args.tenantKey, opportunityIds, args.loadRunId],
  );
  if (result.rows.length !== opportunityIds.length) {
    throw new Error(`Source opportunity readback returned ${result.rows.length}; expected ${opportunityIds.length}`);
  }
  return result.rows;
}

function gateForOpportunity(row) {
  const amount = Number(row.annual_value_exposed ?? 0);
  if (amount > 0) {
    return {
      status: "gated",
      code: "finance_confirmation_required",
      detail:
        "Source cloud opportunity is evidence-backed, but the amount is not finance-confirmed realized value.",
      nextGate: "finance_confirmation",
      evidenceNeeded: [
        "finance owner confirmation",
        "business owner approval",
        "implementation acceptance",
        "post-action run-rate proof",
      ],
    };
  }
  return {
    status: "blocked",
    code: "control_action_required",
    detail:
      "Source cloud row is a governance blocker, not a savings amount; resolve it before allocating value by owner or application.",
    nextGate: "control_owner_resolution",
    evidenceNeeded: [
      "control owner resolution",
      "tag or AP reconciliation proof",
      "updated Source evidence row",
    ],
  };
}

function bridgeRowKey(opportunityId) {
  return `source_cloud:${opportunityId}`;
}

function projectionEntryId(context, pageKey, rowKey) {
  return stableUuid(
    "tower-source-cloud-bridge:projection-entry",
    context.tenantKey,
    context.assessmentId,
    context.projectionVersion,
    pageKey,
    rowKey,
  );
}

function projectionEntryPayload(args, row, pageKey, refs, gate) {
  return {
    page_key: pageKey,
    layer4_build_version: args.buildVersion,
    bridge_source: "source_cloud_consumption_layer4",
    source_dataset_version: args.datasetVersion,
    source_load_run_id: args.loadRunId,
    opportunity_id: row.opportunity_id,
    contract_id: row.contract_id,
    contract_name: row.contract_name,
    vendor_ref: row.vendor_ref,
    vendor_name: row.vendor_name,
    opportunity_type: row.opportunity_type,
    title: row.title,
    finding_summary: row.finding_summary,
    deterministic_basis: row.deterministic_basis,
    recommended_action: row.recommended_action,
    annual_value_exposed: Number(row.annual_value_exposed ?? 0),
    addressable_spend: Number(row.addressable_spend ?? 0),
    confidence: Number(row.confidence ?? 0),
    readiness_state: row.readiness_state,
    evidence_state: row.evidence_state,
    claim_gate_status: gate.status,
    claim_gate_reason_code: gate.code,
    claim_gate_reason_detail: gate.detail,
    evidence_needed_json: gate.evidenceNeeded,
    blocked_value_usd: Number(row.annual_value_exposed ?? 0),
    claimable_value_usd: 0,
    finance_validated_value_usd: 0,
    usage_supported_value_usd: Number(row.annual_value_exposed ?? 0),
    owner_role: row.accountable_role,
    handoff_module: "Source",
    source_ref_count: refs.length,
  };
}

async function upsertProjectionEntry(client, context, args, pageKey, rowKey, rowType, payload, refs) {
  const surfaceKey = SURFACE_BY_PAGE[pageKey];
  const projectionKey = PROJECTION_KEYS[pageKey];
  const manifest = context.manifests[projectionKey];
  const entryId = projectionEntryId(context, pageKey, rowKey);
  const projectionRowKey = `${pageKey}:${rowKey}`;
  const sourceHash = sha256(stableJson([payload, refs]));
  await client.query(
    `INSERT INTO ecl_projection.projection_entry (
       id, tenant_key, assessment_id, snapshot_id, projection_manifest_id,
       projection_version, surface_key, row_key, row_type, source_hash,
       refs_content_hash, refs_cache_json, display_cache_json
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
     ON CONFLICT (tenant_key, assessment_id, projection_version, surface_key, row_key)
     DO UPDATE SET snapshot_id = EXCLUDED.snapshot_id,
                   projection_manifest_id = EXCLUDED.projection_manifest_id,
                   row_type = EXCLUDED.row_type,
                   source_hash = EXCLUDED.source_hash,
                   refs_content_hash = EXCLUDED.refs_content_hash,
                   refs_cache_json = EXCLUDED.refs_cache_json,
                   display_cache_json = EXCLUDED.display_cache_json,
                   created_at = now()`,
    [
      entryId,
      context.tenantKey,
      context.assessmentId,
      manifest.snapshot_id,
      manifest.id,
      context.projectionVersion,
      surfaceKey,
      projectionRowKey,
      rowType,
      sourceHash,
      sha256(stableJson(refs)),
      JSON.stringify({ source_refs: refs, idempotency_key: args.idempotencyKey }),
      JSON.stringify(payload),
    ],
  );
  return { entryId, manifestId: manifest.id, snapshotId: manifest.snapshot_id, sourceHash };
}

async function upsertCommandRow(client, context, args, pageKey, opportunity) {
  const rowKey = bridgeRowKey(opportunity.opportunity_id);
  const refs = sourceRefs(args, {
    evidence_rows: opportunity.evidence_rows,
    source_file_id: opportunity.source_file_id,
    contract_id: opportunity.contract_id,
    vendor_ref: opportunity.vendor_ref,
    vendor_name: opportunity.vendor_name,
  });
  const gate = gateForOpportunity(opportunity);
  const payload = projectionEntryPayload(args, opportunity, pageKey, refs, gate);
  const entry = await upsertProjectionEntry(client, context, args, pageKey, rowKey, "source_cloud_optimization_candidate", payload, refs);
  await client.query(
    `INSERT INTO ecl_projection.tower_command_center (
       id, tenant_key, assessment_id, snapshot_id, projection_manifest_id,
       projection_entry_id, projection_version, row_key, page_key, row_type,
       primary_object_id, claim_id, claim_gate_status, claim_gate_reason_code,
       claim_gate_reason_detail, next_gate, evidence_needed_json, funded_amount_usd,
       promised_value_usd, usage_supported_value_usd, finance_validated_value_usd,
       claimable_value_usd, blocked_value_usd, proof_maturity_score,
       risk_pressure_score, usage_strength_score, owner_role, handoff_module,
       value_state, quality_state, metric_keys_json, source_refs_json,
       gap_flags_json, display_payload_json, source_hash
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,$11,$12,$13,$14,$15,$16::jsonb,NULL,$17,$18,0,0,$19,$20,$21,$22,$23,$24,$25,$26,$27::jsonb,$28::jsonb,$29::jsonb,$30::jsonb,$31)
     ON CONFLICT (tenant_key, assessment_id, projection_version, page_key, row_key)
     DO UPDATE SET projection_manifest_id = EXCLUDED.projection_manifest_id,
                   projection_entry_id = EXCLUDED.projection_entry_id,
                   claim_gate_status = EXCLUDED.claim_gate_status,
                   claim_gate_reason_code = EXCLUDED.claim_gate_reason_code,
                   claim_gate_reason_detail = EXCLUDED.claim_gate_reason_detail,
                   next_gate = EXCLUDED.next_gate,
                   evidence_needed_json = EXCLUDED.evidence_needed_json,
                   promised_value_usd = EXCLUDED.promised_value_usd,
                   usage_supported_value_usd = EXCLUDED.usage_supported_value_usd,
                   finance_validated_value_usd = EXCLUDED.finance_validated_value_usd,
                   claimable_value_usd = EXCLUDED.claimable_value_usd,
                   blocked_value_usd = EXCLUDED.blocked_value_usd,
                   proof_maturity_score = EXCLUDED.proof_maturity_score,
                   risk_pressure_score = EXCLUDED.risk_pressure_score,
                   usage_strength_score = EXCLUDED.usage_strength_score,
                   owner_role = EXCLUDED.owner_role,
                   handoff_module = EXCLUDED.handoff_module,
                   value_state = EXCLUDED.value_state,
                   quality_state = EXCLUDED.quality_state,
                   metric_keys_json = EXCLUDED.metric_keys_json,
                   source_refs_json = EXCLUDED.source_refs_json,
                   gap_flags_json = EXCLUDED.gap_flags_json,
                   display_payload_json = EXCLUDED.display_payload_json,
                   source_hash = EXCLUDED.source_hash,
                   created_at = now()`,
    [
      stableUuid("tower-source-cloud-bridge:command", context.tenantKey, context.assessmentId, pageKey, rowKey),
      context.tenantKey,
      context.assessmentId,
      entry.snapshotId,
      entry.manifestId,
      entry.entryId,
      context.projectionVersion,
      rowKey,
      pageKey,
      "source_cloud_optimization_candidate",
      opportunity.opportunity_id,
      gate.status,
      gate.code,
      gate.detail,
      gate.nextGate,
      JSON.stringify(gate.evidenceNeeded),
      Number(opportunity.annual_value_exposed ?? 0),
      Number(opportunity.annual_value_exposed ?? 0),
      Number(opportunity.annual_value_exposed ?? 0),
      Math.round(Number(opportunity.confidence ?? 0) * 100),
      gate.status === "blocked" ? 85 : 55,
      refs.length ? Math.min(100, 50 + refs.length * 10) : 25,
      opportunity.accountable_role ?? "sourcing_owner",
      "Source",
      Number(opportunity.annual_value_exposed ?? 0) > 0 ? "estimated" : "known",
      gate.status === "blocked" ? "warning" : "passed",
      JSON.stringify(["source_cloud_candidate_value_usd", "source_cloud_evidence_gate"]),
      JSON.stringify(refs),
      JSON.stringify(gate.evidenceNeeded),
      JSON.stringify(payload),
      entry.sourceHash,
    ],
  );
}

async function upsertValueRow(client, context, args, pageKey, opportunity) {
  const rowKey = bridgeRowKey(opportunity.opportunity_id);
  const refs = sourceRefs(args, {
    evidence_rows: opportunity.evidence_rows,
    source_file_id: opportunity.source_file_id,
    contract_id: opportunity.contract_id,
    vendor_ref: opportunity.vendor_ref,
    vendor_name: opportunity.vendor_name,
  });
  const gate = gateForOpportunity(opportunity);
  const periodEndValue = opportunity.decision_due_date ?? "2026-12-31";
  const payload = {
    ...projectionEntryPayload(args, opportunity, pageKey, refs, gate),
    period_start: "2026-01-01",
    period_end: periodEndValue,
    fiscal_quarter: fiscalQuarter(periodEndValue) ?? "2026-Q4",
    scenario: "candidate",
    business_case_value_usd: Number(opportunity.annual_value_exposed ?? 0),
    risk_adjusted_forecast_usd: Number(opportunity.annual_value_exposed ?? 0) * Number(opportunity.confidence ?? 0),
    economic_classification: opportunity.opportunity_type,
    board_scope_state: "not_board_claimable",
    material_scope_state: Number(opportunity.annual_value_exposed ?? 0) > 0 ? "candidate_value" : "control_blocker",
  };
  const entry = await upsertProjectionEntry(client, context, args, pageKey, rowKey, "source_cloud_value_gate", payload, refs);
  await client.query(
    `INSERT INTO ecl_projection.tower_value_chain (
       id, tenant_key, assessment_id, snapshot_id, projection_manifest_id,
       projection_entry_id, projection_version, row_key, page_key, row_type,
       primary_object_id, claim_id, observation_key, metric_key, measure_id,
       source_record_id, review_event_id, evidence_state, claim_gate_status,
       claim_gate_reason_code, claim_gate_reason_detail, next_gate,
       evidence_needed_json, baseline_value, current_value, target_value,
       claimable_value_usd, blocked_value_usd, value_state, quality_state,
       source_refs_json, display_payload_json, gap_flags_json, source_hash
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,$11,$12,$13,NULL,NULL,NULL,$14,$15,$16,$17,$18,$19::jsonb,$20,$21,$22,0,$23,$24,$25,$26::jsonb,$27::jsonb,$28::jsonb,$29)
     ON CONFLICT (tenant_key, assessment_id, projection_version, page_key, row_key)
     DO UPDATE SET projection_manifest_id = EXCLUDED.projection_manifest_id,
                   projection_entry_id = EXCLUDED.projection_entry_id,
                   evidence_state = EXCLUDED.evidence_state,
                   claim_gate_status = EXCLUDED.claim_gate_status,
                   claim_gate_reason_code = EXCLUDED.claim_gate_reason_code,
                   claim_gate_reason_detail = EXCLUDED.claim_gate_reason_detail,
                   next_gate = EXCLUDED.next_gate,
                   evidence_needed_json = EXCLUDED.evidence_needed_json,
                   baseline_value = EXCLUDED.baseline_value,
                   current_value = EXCLUDED.current_value,
                   target_value = EXCLUDED.target_value,
                   claimable_value_usd = EXCLUDED.claimable_value_usd,
                   blocked_value_usd = EXCLUDED.blocked_value_usd,
                   value_state = EXCLUDED.value_state,
                   quality_state = EXCLUDED.quality_state,
                   source_refs_json = EXCLUDED.source_refs_json,
                   display_payload_json = EXCLUDED.display_payload_json,
                   gap_flags_json = EXCLUDED.gap_flags_json,
                   source_hash = EXCLUDED.source_hash,
                   created_at = now()`,
    [
      stableUuid("tower-source-cloud-bridge:value", context.tenantKey, context.assessmentId, pageKey, rowKey),
      context.tenantKey,
      context.assessmentId,
      entry.snapshotId,
      entry.manifestId,
      entry.entryId,
      context.projectionVersion,
      rowKey,
      pageKey,
      "source_cloud_value_gate",
      opportunity.opportunity_id,
      `${opportunity.opportunity_id}:${pageKey}`,
      "source_cloud_candidate_value_usd",
      opportunity.evidence_state === "present" ? "source_recorded" : "blocked",
      gate.status,
      gate.code,
      gate.detail,
      gate.nextGate,
      JSON.stringify(gate.evidenceNeeded),
      Number(opportunity.addressable_spend ?? 0),
      Number(opportunity.actual_annual_spend ?? 0),
      Number(opportunity.annual_value_exposed ?? 0),
      Number(opportunity.annual_value_exposed ?? 0),
      Number(opportunity.annual_value_exposed ?? 0) > 0 ? "estimated" : "known",
      gate.status === "blocked" ? "warning" : "passed",
      JSON.stringify(refs),
      JSON.stringify(payload),
      JSON.stringify(gate.evidenceNeeded),
      entry.sourceHash,
    ],
  );
}

async function upsertEvidenceRow(client, context, args, pageKey, opportunity) {
  const rowKey = bridgeRowKey(opportunity.opportunity_id);
  const refs = sourceRefs(args, {
    evidence_rows: opportunity.evidence_rows,
    source_file_id: opportunity.source_file_id,
    contract_id: opportunity.contract_id,
    vendor_ref: opportunity.vendor_ref,
    vendor_name: opportunity.vendor_name,
  });
  const gate = gateForOpportunity(opportunity);
  const payload = {
    ...projectionEntryPayload(args, opportunity, pageKey, refs, gate),
    proof_needed:
      Number(opportunity.annual_value_exposed ?? 0) > 0
        ? "Finance confirmation, owner approval, and post-action run-rate proof are required before this can be claimed."
        : "Control owner resolution is required before allocating this spend or action to a business owner.",
  };
  const entry = await upsertProjectionEntry(client, context, args, pageKey, rowKey, "source_cloud_evidence_gate", payload, refs);
  await client.query(
    `INSERT INTO ecl_projection.tower_evidence_queue (
       id, tenant_key, assessment_id, snapshot_id, projection_manifest_id,
       projection_entry_id, projection_version, row_key, page_key, row_type,
       primary_object_id, claim_id, claim_gate_status, claim_gate_reason_code,
       claim_gate_reason_detail, evidence_needed_json, next_gate, owner_role,
       due_date, related_measure_id, source_record_id, review_event_id,
       evidence_state, priority_score, source_refs_json, gap_flags_json,
       display_payload_json, source_hash
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,$11,$12,$13,$14,$15::jsonb,$16,$17,NULL,NULL,NULL,NULL,$18,$19,$20::jsonb,$21::jsonb,$22::jsonb,$23)
     ON CONFLICT (tenant_key, assessment_id, projection_version, page_key, row_key)
     DO UPDATE SET projection_manifest_id = EXCLUDED.projection_manifest_id,
                   projection_entry_id = EXCLUDED.projection_entry_id,
                   claim_gate_status = EXCLUDED.claim_gate_status,
                   claim_gate_reason_code = EXCLUDED.claim_gate_reason_code,
                   claim_gate_reason_detail = EXCLUDED.claim_gate_reason_detail,
                   evidence_needed_json = EXCLUDED.evidence_needed_json,
                   next_gate = EXCLUDED.next_gate,
                   owner_role = EXCLUDED.owner_role,
                   evidence_state = EXCLUDED.evidence_state,
                   priority_score = EXCLUDED.priority_score,
                   source_refs_json = EXCLUDED.source_refs_json,
                   gap_flags_json = EXCLUDED.gap_flags_json,
                   display_payload_json = EXCLUDED.display_payload_json,
                   source_hash = EXCLUDED.source_hash,
                   created_at = now()`,
    [
      stableUuid("tower-source-cloud-bridge:evidence", context.tenantKey, context.assessmentId, pageKey, rowKey),
      context.tenantKey,
      context.assessmentId,
      entry.snapshotId,
      entry.manifestId,
      entry.entryId,
      context.projectionVersion,
      rowKey,
      pageKey,
      "source_cloud_evidence_gate",
      opportunity.opportunity_id,
      gate.status,
      gate.code,
      gate.detail,
      JSON.stringify(gate.evidenceNeeded),
      gate.nextGate,
      opportunity.accountable_role ?? "sourcing_owner",
      opportunity.evidence_state === "present" ? "source_recorded" : "blocked",
      gate.status === "blocked" ? 85 : 65,
      JSON.stringify(refs),
      JSON.stringify(gate.evidenceNeeded),
      JSON.stringify(payload),
      entry.sourceHash,
    ],
  );
}

async function upsertCubeSlice(client, context, args, cubeKey, opportunity) {
  const rowKey = bridgeRowKey(opportunity.opportunity_id);
  const manifest = context.cubeManifests[cubeKey];
  const refs = sourceRefs(args, {
    evidence_rows: opportunity.evidence_rows,
    source_file_id: opportunity.source_file_id,
    contract_id: opportunity.contract_id,
    vendor_ref: opportunity.vendor_ref,
    vendor_name: opportunity.vendor_name,
  });
  const amount = Number(opportunity.annual_value_exposed ?? 0);
  const dimensions = {
    source_bridge: "source_cloud_consumption",
    opportunity_id: opportunity.opportunity_id,
    contract_id: opportunity.contract_id,
    contract_name: opportunity.contract_name,
    vendor_ref: opportunity.vendor_ref,
    vendor_name: opportunity.vendor_name,
    opportunity_type: opportunity.opportunity_type,
    readiness_state: opportunity.readiness_state,
    evidence_state: opportunity.evidence_state,
    dataset_version: args.datasetVersion,
    load_run_id: args.loadRunId,
  };
  const measures = {
    candidate_value_usd: amount,
    finance_validated_value_usd: 0,
    claimable_value_usd: 0,
    evidence_ref_count: refs.length,
    confidence: Number(opportunity.confidence ?? 0),
  };
  await client.query(
    `INSERT INTO ecl_projection.cube_slice (
       id, tenant_key, assessment_id, snapshot_id, cube_manifest_id,
       cube_key, cube_version, slice_key, grain_key, primary_object_id,
       dimensions_json, measures_json, primary_metric_key, metric_keys_json,
       source_refs_json, basis_summary, value_state, quality_state,
       gap_flags_json, source_hash
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'source_cloud_opportunity',NULL,$9::jsonb,$10::jsonb,'source_cloud_candidate_value_usd',$11::jsonb,$12::jsonb,$13,$14,$15,$16::jsonb,$17)
     ON CONFLICT (tenant_key, assessment_id, cube_key, cube_version, slice_key)
     DO UPDATE SET snapshot_id = EXCLUDED.snapshot_id,
                   cube_manifest_id = EXCLUDED.cube_manifest_id,
                   dimensions_json = EXCLUDED.dimensions_json,
                   measures_json = EXCLUDED.measures_json,
                   metric_keys_json = EXCLUDED.metric_keys_json,
                   source_refs_json = EXCLUDED.source_refs_json,
                   basis_summary = EXCLUDED.basis_summary,
                   value_state = EXCLUDED.value_state,
                   quality_state = EXCLUDED.quality_state,
                   gap_flags_json = EXCLUDED.gap_flags_json,
                   source_hash = EXCLUDED.source_hash,
                   created_at = now()`,
    [
      stableUuid("tower-source-cloud-bridge:cube", context.tenantKey, context.assessmentId, cubeKey, rowKey),
      context.tenantKey,
      context.assessmentId,
      manifest.snapshot_id,
      manifest.id,
      cubeKey,
      CUBE_VERSION,
      rowKey,
      JSON.stringify(dimensions),
      JSON.stringify(measures),
      JSON.stringify(["source_cloud_candidate_value_usd", "source_cloud_evidence_gate"]),
      JSON.stringify(refs),
      opportunity.deterministic_basis ?? "Source cloud opportunity is projected into Tower as gated candidate value.",
      amount > 0 ? "estimated" : "known",
      amount > 0 ? "warning" : "passed",
      JSON.stringify(amount > 0 ? ["finance_confirmation_required"] : ["control_action_required"]),
      sha256(stableJson([dimensions, measures, refs])),
    ],
  );
}

async function deleteBridgeRows(client, context) {
  await client.query(
    `DELETE FROM ecl_projection.tower_command_center
      WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
        AND page_key = 'recommended_actions' AND row_key LIKE 'source_cloud:%'`,
    [context.tenantKey, context.assessmentId, context.projectionVersion],
  );
  await client.query(
    `DELETE FROM ecl_projection.tower_value_chain
      WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
        AND page_key IN ('value_proof','cost_lens') AND row_key LIKE 'source_cloud:%'`,
    [context.tenantKey, context.assessmentId, context.projectionVersion],
  );
  await client.query(
    `DELETE FROM ecl_projection.tower_evidence_queue
      WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
        AND page_key IN ('evidence','risk_lens') AND row_key LIKE 'source_cloud:%'`,
    [context.tenantKey, context.assessmentId, context.projectionVersion],
  );
  await client.query(
    `DELETE FROM ecl_projection.projection_entry
      WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
        AND surface_key IN ('tower_command_center','tower_value_chain','tower_evidence_queue')
        AND row_key LIKE '%source_cloud:%'`,
    [context.tenantKey, context.assessmentId, context.projectionVersion],
  );
  await client.query(
    `DELETE FROM ecl_projection.cube_slice
      WHERE tenant_key = $1 AND assessment_id = $2 AND cube_version = $3
        AND cube_key IN ('tower_spend_value_cube','tower_evidence_cube')
        AND slice_key LIKE 'source_cloud:%'`,
    [context.tenantKey, context.assessmentId, CUBE_VERSION],
  );
}

async function applyBridge(client, context, args, sourceFiles) {
  const byId = new Map(
    (sourceFiles["optimization_opportunities.csv"] ?? []).map((row) => [
      value(row, "opportunity_id"),
      row,
    ]),
  );
  const opportunities = (await loadOpportunities(client, args, sourceFiles)).map((row) => ({
    ...row,
    ...(byId.get(row.opportunity_id) ?? {}),
  }));

  await deleteBridgeRows(client, context);
  for (const opportunity of opportunities) {
    await upsertCommandRow(client, context, args, "recommended_actions", opportunity);
    await upsertValueRow(client, context, args, "value_proof", opportunity);
    await upsertValueRow(client, context, args, "cost_lens", opportunity);
    await upsertEvidenceRow(client, context, args, "evidence", opportunity);
    await upsertEvidenceRow(client, context, args, "risk_lens", opportunity);
    await upsertCubeSlice(client, context, args, "tower_spend_value_cube", opportunity);
    await upsertCubeSlice(client, context, args, "tower_evidence_cube", opportunity);
  }

  for (const cubeKey of ["tower_spend_value_cube", "tower_evidence_cube"]) {
    await client.query(
      `UPDATE ecl_projection.cube_manifest
          SET slice_count = (
                SELECT count(*)::int
                  FROM ecl_projection.cube_slice
                 WHERE tenant_key = $1
                   AND assessment_id = $2
                   AND cube_key = $3
                   AND cube_version = $4
              ),
              created_at = now()
        WHERE tenant_key = $1
          AND assessment_id = $2
          AND cube_key = $3
          AND cube_version = $4`,
      [context.tenantKey, context.assessmentId, cubeKey, CUBE_VERSION],
    );
  }
}

async function towerBridgeReadback(client, context) {
  const result = await client.query(
    `SELECT
       (SELECT count(*)::int FROM ecl_projection.projection_entry
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND surface_key IN ('tower_command_center','tower_value_chain','tower_evidence_queue')
           AND row_key LIKE '%source_cloud:%') AS projection_entry_rows,
       (SELECT count(*)::int FROM ecl_projection.tower_command_center
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND page_key = 'recommended_actions' AND row_key LIKE 'source_cloud:%') AS tower_recommended_actions_rows,
       (SELECT count(*)::int FROM ecl_projection.tower_value_chain
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND page_key = 'value_proof' AND row_key LIKE 'source_cloud:%') AS tower_value_proof_rows,
       (SELECT count(*)::int FROM ecl_projection.tower_value_chain
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND page_key = 'cost_lens' AND row_key LIKE 'source_cloud:%') AS tower_cost_lens_rows,
       (SELECT count(*)::int FROM ecl_projection.tower_evidence_queue
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND page_key = 'evidence' AND row_key LIKE 'source_cloud:%') AS tower_evidence_rows,
       (SELECT count(*)::int FROM ecl_projection.tower_evidence_queue
         WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3
           AND page_key = 'risk_lens' AND row_key LIKE 'source_cloud:%') AS tower_risk_lens_rows,
       (SELECT count(*)::int FROM ecl_projection.cube_slice
         WHERE tenant_key = $1 AND assessment_id = $2 AND cube_version = $4
           AND cube_key IN ('tower_spend_value_cube','tower_evidence_cube')
           AND slice_key LIKE 'source_cloud:%') AS cube_slice_rows,
       (SELECT count(*)::int FROM serving.tower_recommended_actions
         WHERE tenant_key = $1 AND row_key LIKE 'source_cloud:%') AS serving_recommended_actions_rows,
       (SELECT count(*)::int FROM serving.tower_value_proof
         WHERE tenant_key = $1 AND row_key LIKE 'source_cloud:%') AS serving_value_proof_rows,
       (SELECT count(*)::int FROM serving.tower_cost_lens
         WHERE tenant_key = $1 AND row_key LIKE 'source_cloud:%') AS serving_cost_lens_rows,
       (SELECT count(*)::int FROM serving.tower_evidence
         WHERE tenant_key = $1 AND row_key LIKE 'source_cloud:%') AS serving_evidence_rows,
       (SELECT count(*)::int FROM serving.tower_risk_lens
         WHERE tenant_key = $1 AND row_key LIKE 'source_cloud:%') AS serving_risk_lens_rows,
       (SELECT count(*)::int FROM (
          SELECT source_refs_json FROM ecl_projection.tower_command_center
           WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3 AND row_key LIKE 'source_cloud:%'
          UNION ALL
          SELECT source_refs_json FROM ecl_projection.tower_value_chain
           WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3 AND row_key LIKE 'source_cloud:%'
          UNION ALL
          SELECT source_refs_json FROM ecl_projection.tower_evidence_queue
           WHERE tenant_key = $1 AND assessment_id = $2 AND projection_version = $3 AND row_key LIKE 'source_cloud:%'
        ) rows WHERE COALESCE(jsonb_array_length(source_refs_json), 0) = 0) AS source_ref_missing_rows`,
    [context.tenantKey, context.assessmentId, context.projectionVersion, CUBE_VERSION],
  );
  return result.rows[0] ?? {};
}

function assertCounts(expected, actual, label) {
  const failures = Object.entries(expected)
    .filter(([key, count]) => Number(actual[key] ?? 0) !== count)
    .map(([key, count]) => `${key}: expected ${count}, read ${actual[key] ?? 0}`);
  if (failures.length) throw new Error(`${label} mismatch: ${failures.join("; ")}`);
}

async function main() {
  const args = parseArgs();
  const sourceFiles = readSourceFiles(args.packageDir);
  const expected = expectedFromPackage(sourceFiles);
  const gate = qualityGate(args, sourceFiles);
  const summary = {
    event: "tower_source_cloud_bridge_started",
    mode: args.mode,
    tenant_key: args.tenantKey,
    dataset_version: args.datasetVersion,
    load_run_id: args.loadRunId,
    build_version: args.buildVersion,
    idempotency_key: args.idempotencyKey,
    package_dir: args.packageDir,
    source_files_sha256: sourceFilesHash(sourceFiles),
    git_sha: gitSha(),
    quality_gate: gate,
    ...expected,
  };
  writeJson(path.join(args.proofDir, "summary.json"), summary);
  if (gate.status !== "PASS") throw new Error(`Quality gate failed: ${gate.failures.join("; ")}`);

  if (args.mode === "plan") {
    summary.event = "tower_source_cloud_bridge_planned";
    writeJson(path.join(args.proofDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(databaseUrl(), "tower-source-cloud-bridge"));
  await client.connect();
  try {
    await setTenant(client, args.tenantKey);
    const context = await readActiveTowerContext(client, args.tenantKey);
    summary.active_tower_context = context;
    const sourceRows = await sourceReadback(client, args, sourceFiles);
    summary.source_readback = sourceRows;
    assertCounts(expected.source_expected_readback, sourceRows, "Source cloud readback");

    if (args.mode === "apply") {
      requireApplyApproval(args);
      await client.query("BEGIN");
      await applyBridge(client, context, args, sourceFiles);
      await client.query("COMMIT");
      summary.event = "tower_source_cloud_bridge_applied";
    } else {
      summary.event = "tower_source_cloud_bridge_verified";
    }

    const towerRows = await towerBridgeReadback(client, context);
    summary.tower_bridge_readback = towerRows;
    assertCounts(expected.tower_expected_delta, towerRows, "Tower bridge readback");
    if (Number(towerRows.source_ref_missing_rows ?? 0) !== 0) {
      throw new Error(`Tower bridge source refs missing: ${towerRows.source_ref_missing_rows}`);
    }
    writeJson(path.join(args.proofDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    summary.event = "tower_source_cloud_bridge_failed";
    summary.error = error instanceof Error ? error.message : String(error);
    writeJson(path.join(args.proofDir, "summary.json"), summary);
    throw error;
  } finally {
    await client.end();
  }

  if (args.emitProofBundle) emitProofBundle(args.proofDir);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
