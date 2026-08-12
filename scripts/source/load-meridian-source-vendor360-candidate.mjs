#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  REPO_ROOT,
  "scripts/source/fixtures/meridian-source-5-contract-layer-cube-proof-20260811",
);
const DEFAULT_DATASET_ID = "meridian-source-5-contract-vendor360-20260811";
const DEFAULT_DATASET_VERSION = "meridian-source-5-contract-layer-cube-proof-20260811";
const DEFAULT_TENANT_KEY = "meridian_health_global";
const DEFAULT_SOURCE_TENANT_KEY = "meridian-health";
const CONTRACT_IDS = Object.freeze([
  "MER-CTR-RCM-001",
  "MER-CTR-HR-BPO-001",
  "MER-CTR-FIN-BPO-001",
  "MER-CTR-SC-BPO-001",
  "MER-CTR-SSO-BPO-001",
]);

const SOURCE_EXTRACTS = Object.freeze([
  "source_system_extracts/calculation_inputs.csv",
  "source_system_extracts/calculation_outputs.csv",
  "source_system_extracts/contract_document_inventory.csv",
  "source_system_extracts/contract_register.csv",
  "source_system_extracts/current_meridian_file_profile.csv",
  "source_system_extracts/document_clause_extractions.csv",
  "source_system_extracts/evidence_entity_links.csv",
  "source_system_extracts/fact_assertions.csv",
  "source_system_extracts/fact_conflicts.csv",
  "source_system_extracts/reviewer_decisions.csv",
  "source_system_extracts/source_ap_po_invoice_lines.csv",
  "source_system_extracts/source_bpo_process_baseline.csv",
  "source_system_extracts/source_contract_change_orders.csv",
  "source_system_extracts/source_contract_pricing_rate_cards.csv",
  "source_system_extracts/source_contract_scope_services.csv",
  "source_system_extracts/source_finance_realization.csv",
  "source_system_extracts/source_risk_control_evidence.csv",
  "source_system_extracts/source_sla_kpi_events.csv",
  "source_system_extracts/source_sourcing_event_artifacts.csv",
  "source_system_extracts/source_transition_evidence.csv",
  "source_system_extracts/supplier_master.csv",
]);

const MERIDIAN_TABLES = Object.freeze([
  "meridian_vendor360_contract",
  "meridian_vendor360_application_scope",
  "meridian_vendor360_financial_exposure",
  "meridian_vendor360_operational_performance",
  "meridian_vendor360_initiative_dependency",
  "meridian_vendor360_source_extract",
  "meridian_vendor360_mapping",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  };
  const mode =
    value("--mode") ??
    (args.includes("--apply") ? "apply" : args.includes("--verify") ? "verify" : "plan");
  if (!["plan", "preflight", "apply", "verify", "self-test"].includes(mode)) {
    throw new Error(`Unsupported --mode ${mode}`);
  }
  return {
    mode,
    packageDir: path.resolve(value("--package-dir") ?? process.env.MERIDIAN_SOURCE_VENDOR360_PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR),
    tenantKey: value("--tenant-key") ?? process.env.TENANT_KEY ?? DEFAULT_TENANT_KEY,
    sourceTenantKey: value("--source-tenant-key") ?? process.env.SOURCE_TENANT_KEY ?? DEFAULT_SOURCE_TENANT_KEY,
    datasetId: value("--dataset-id") ?? process.env.DATASET_ID ?? DEFAULT_DATASET_ID,
    datasetVersion: value("--dataset-version") ?? process.env.DATASET_VERSION ?? DEFAULT_DATASET_VERSION,
    loadRunId:
      value("--load-run-id") ??
      process.env.LOAD_RUN_ID ??
      `meridian-source-vendor360-${stamp()}`,
    outDir: path.resolve(value("--out-dir") ?? process.env.PROOF_BUNDLE_DIR ?? "/tmp/meridian-source-vendor360-candidate"),
    emitProofBundle: args.includes("--emit-proof-bundle") || process.env.EMIT_ACA_PROOF_BUNDLE === "true",
  };
}

function databaseUrl() {
  return (
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function readText(packageDir, relativePath) {
  return fs.readFileSync(path.join(packageDir, relativePath), "utf8");
}

function readJson(packageDir, relativePath) {
  return JSON.parse(readText(packageDir, relativePath));
}

function readCsv(packageDir, relativePath) {
  const records = parseCsv(readText(packageDir, relativePath));
  const headers = records[0] ?? [];
  return records.slice(1).filter((record) => record.some((value) => value !== "")).map((record) => {
    const cleaned = {};
    for (const [index, key] of headers.entries()) {
      if (!key) continue;
      cleaned[key] = record[index] == null ? "" : String(record[index]);
    }
    return cleaned;
  });
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (inQuotes) throw new Error("CSV parse failed: unterminated quoted field");
  return rows;
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

function num(value) {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value) {
  return ["true", "yes", "y", "1"].includes(String(value ?? "").trim().toLowerCase());
}

function text(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function assertPackageHashes(packageDir, manifest) {
  const failures = [];
  for (const file of manifest.files ?? []) {
    const filePath = path.join(packageDir, file.path);
    if (!fs.existsSync(filePath)) {
      failures.push(`${file.path}: missing`);
      continue;
    }
    const actual = sha256(fs.readFileSync(filePath));
    if (actual !== file.sha256) failures.push(`${file.path}: ${actual} != ${file.sha256}`);
  }
  if (failures.length) {
    throw new Error(`Package hash validation failed: ${failures.slice(0, 5).join("; ")}`);
  }
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const groupKey = row[key] ?? "";
    const existing = grouped.get(groupKey) ?? [];
    existing.push(row);
    grouped.set(groupKey, existing);
  }
  return grouped;
}

function firstBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function buildModel(args) {
  const manifest = readJson(args.packageDir, "package_manifest.json");
  assertPackageHashes(args.packageDir, manifest);

  const contracts = readCsv(args.packageDir, "source_system_extracts/contract_register.csv");
  const suppliers = firstBy(readCsv(args.packageDir, "source_system_extracts/supplier_master.csv"), "supplier_id");
  const vendor360 = firstBy(readCsv(args.packageDir, "layer4_vendor360_preview/vendor360_read_model.csv"), "contract_id");
  const scopeRows = readCsv(args.packageDir, "source_system_extracts/source_contract_scope_services.csv");
  const invoiceRows = readCsv(args.packageDir, "source_system_extracts/source_ap_po_invoice_lines.csv");
  const slaRows = readCsv(args.packageDir, "source_system_extracts/source_sla_kpi_events.csv");
  const transitionRows = readCsv(args.packageDir, "source_system_extracts/source_transition_evidence.csv");
  const clauseRows = readCsv(args.packageDir, "source_system_extracts/document_clause_extractions.csv");
  const mappingRows = readCsv(args.packageDir, "layer4_vendor360_preview/vendor360_extract_mapping.csv");

  const scopeByContract = groupBy(scopeRows, "contract_id");
  const invoiceByContract = groupBy(invoiceRows, "contract_id");
  const slaByContract = groupBy(slaRows, "contract_id");
  const transitionByContract = groupBy(transitionRows, "contract_id");

  const contractRows = contracts.map((row) => {
    const card = vendor360.get(row.contract_id) ?? {};
    const supplier = suppliers.get(row.supplier_id) ?? {};
    const scoped = scopeByContract.get(row.contract_id) ?? [];
    const sla = slaByContract.get(row.contract_id) ?? [];
    const transition = transitionByContract.get(row.contract_id) ?? [];
    const openIssues = transition.reduce((sum, item) => sum + (num(item.open_issue_count) ?? 0), 0);
    return {
      tenant_key: args.tenantKey,
      dataset_id: args.datasetId,
      dataset_version: args.datasetVersion,
      source_tenant_key: args.sourceTenantKey,
      contract_id: row.contract_id,
      vendor_ref: row.vendor_parent_id,
      vendor_name: row.supplier_legal_name || supplier.supplier_legal_name,
      vendor_category: row.category || supplier.supplier_category,
      contract_name: row.contract_name,
      scope_summary: `${row.category}; ${scoped.length} scoped service rows; ${card.document_count ?? 0} documents; ${card.clause_span_count ?? 0} clause spans`,
      annual_value: num(row.annual_value_usd),
      total_committed_value: num(row.committed_value_usd),
      committed_annual_spend: num(row.annual_value_usd),
      actual_annual_spend: num(card.invoice_amount_usd),
      end_date: text(row.expiration_date),
      notice_period_days: null,
      auto_renew: bool(row.auto_renew),
      renewal_decision_state: row.review_state,
      renewal_owner_ref: row.procurement_owner_role,
      benchmarking_clause: "Source-system extract mapping is available in layer4_vendor360_preview/vendor360_extract_mapping.csv.",
      exit_rights_summary: `Notice deadline ${row.notice_deadline}; action gate ${card.action_gate_state || "unknown"}.`,
      alternatives_available: card.vendor_outreach_state,
      concentration_note: card.cpo_storyline,
      source_confidence: 0.96,
      resolved_annual_value: num(row.annual_value_usd),
      annual_value_conflict_flag: false,
      resolved_total_committed_value: num(row.committed_value_usd),
      total_committed_value_conflict_flag: false,
      scoped_application_count: scoped.length,
      critical_application_count: scoped.filter((item) => /claims|denial|security|control|transition/i.test(`${item.process_name} ${item.service_tower}`)).length,
      linked_budget_amount: num(row.annual_value_usd),
      linked_actual_amount: num(card.invoice_amount_usd),
      linked_budget_lines: invoiceByContract.get(row.contract_id)?.length ?? 0,
      cloud_sev1_sev2_incidents: sla.filter((item) => item.breach_state === "breached").length,
      operational_evidence_gap: openIssues > 0 ? `${openIssues} transition/control issues remain open in synthetic fixture.` : "false",
      initiative_dependency_count: transition.length,
      action_gate_state: card.action_gate_state,
      value_proven_state: card.value_proven_state,
      forecast_value_usd: num(card.forecast_value_usd),
      finance_confirmed_value_usd: num(card.finance_confirmed_value_usd),
      payload_json: {
        fixture_role: row.fixture_role,
        source_record_id: row.source_record_id,
        commercial_instrument_id: row.commercial_instrument_id,
        supplier_id: row.supplier_id,
        procurement_owner_role: row.procurement_owner_role,
        business_owner_role: row.business_owner_role,
        finance_owner_role: row.finance_owner_role,
        cpo_storyline: card.cpo_storyline,
        synthetic_notice: manifest.warning,
      },
    };
  });

  return {
    manifest,
    contracts: contractRows,
    scope: scopeRows.map((row) => ({
      tenant_key: args.tenantKey,
      dataset_id: args.datasetId,
      dataset_version: args.datasetVersion,
      contract_id: row.contract_id,
      vendor_ref: contractRows.find((contract) => contract.contract_id === row.contract_id)?.vendor_ref,
      vendor_name: contractRows.find((contract) => contract.contract_id === row.contract_id)?.vendor_name,
      application_ref: row.service_tower_id,
      application_name: row.process_name,
      business_function: row.service_tower,
      function_ref: row.service_tower_id,
      criticality: row.handoff_gate,
      lifecycle_state: row.review_state,
      hosting_model: row.location,
      annual_run_cost: null,
      modernization_plan: row.in_scope_work,
      sla_tier: row.system_of_record,
      known_pain_risk: row.out_of_scope_work,
      it_portfolio_ref: row.service_tower_id,
      relationship_method: "explicit_sow_scope",
      relationship_confidence: 0.96,
    })),
    financial: contractRows.map((contract) => ({
      tenant_key: args.tenantKey,
      dataset_id: args.datasetId,
      dataset_version: args.datasetVersion,
      contract_id: contract.contract_id,
      vendor_ref: contract.vendor_ref,
      vendor_name: contract.vendor_name,
      contracted_annual_value: contract.annual_value,
      total_committed_value: contract.total_committed_value,
      committed_annual_spend: contract.committed_annual_spend,
      actual_annual_spend: contract.actual_annual_spend,
      linked_budget_amount: contract.linked_budget_amount,
      linked_forecast_amount: contract.forecast_value_usd,
      linked_actual_amount: contract.linked_actual_amount,
      linked_committed_amount: contract.finance_confirmed_value_usd,
      linked_budget_lines: contract.linked_budget_lines,
    })),
    operational: contractRows.map((contract) => {
      const sla = slaByContract.get(contract.contract_id) ?? [];
      return {
        tenant_key: args.tenantKey,
        dataset_id: args.datasetId,
        dataset_version: args.datasetVersion,
        contract_id: contract.contract_id,
        vendor_ref: contract.vendor_ref,
        vendor_name: contract.vendor_name,
        sla_summary: `${sla.length} synthetic SLA/KPI events; ${sla.filter((row) => row.breach_state === "breached").length} breached.`,
        scoped_application_count: contract.scoped_application_count,
        critical_application_count: contract.critical_application_count,
        cloud_sev1_sev2_incidents: contract.cloud_sev1_sev2_incidents,
        avg_cloud_change_failure_rate: null,
        service_credits_earned: sla.reduce((sum, row) => sum + (num(row.service_credits_earned_usd) ?? 0), 0),
        service_credits_claimed: sla.reduce((sum, row) => sum + (num(row.service_credits_claimed_usd) ?? 0), 0),
        evidence_gap: contract.operational_evidence_gap,
      };
    }),
    dependencies: transitionRows.map((row) => {
      const contract = contractRows.find((item) => item.contract_id === row.contract_id);
      return {
        tenant_key: args.tenantKey,
        dataset_id: args.datasetId,
        dataset_version: args.datasetVersion,
        contract_id: row.contract_id,
        vendor_ref: contract?.vendor_ref,
        vendor_name: contract?.vendor_name,
        initiative_ref: row.transition_wave_id,
        initiative_project_name: row.wave_name,
        status: row.acceptance_state,
        target_end_date: text(row.actual_or_forecast_date) ?? text(row.planned_date),
        approved_budget: null,
        expected_business_technology_value: row.acceptance_criteria,
        major_risk_constraint: `open_issue_count=${row.open_issue_count}`,
        decision_needed: row.review_state,
      };
    }),
    sourceExtracts: SOURCE_EXTRACTS.flatMap((relativePath) => {
      const sourceTable = path.basename(relativePath, ".csv");
      const seen = new Map();
      return readCsv(args.packageDir, relativePath).map((row, index) => {
        const rowHash = sha256(JSON.stringify(row));
        const nativeRecordId =
          row.source_record_id || row.read_model_id || row.canonical_id || row.row_hash || `${sourceTable}:${index + 2}`;
        const duplicateCount = seen.get(nativeRecordId) ?? 0;
        seen.set(nativeRecordId, duplicateCount + 1);
        const sourceRecordId =
          duplicateCount === 0 ? nativeRecordId : `${nativeRecordId}#row-${index + 2}-${rowHash.slice(0, 12)}`;
        return {
          tenant_key: args.tenantKey,
          dataset_id: args.datasetId,
          dataset_version: args.datasetVersion,
          source_tenant_key: args.sourceTenantKey,
          source_table: sourceTable,
          source_file: relativePath,
          source_row_number: index + 2,
          source_record_id: sourceRecordId,
          contract_id: row.contract_id || null,
          row_sha256: rowHash,
          payload_json: {
            ...row,
            native_source_record_id: nativeRecordId,
          },
        };
      });
    }),
    mapping: mappingRows.map((row, index) => ({
      tenant_key: args.tenantKey,
      dataset_id: args.datasetId,
      dataset_version: args.datasetVersion,
      mapping_id: `vendor360-map-${String(index + 1).padStart(3, "0")}`,
      source_extract: row.source_extract,
      source_grain: row.source_grain,
      vendor360_component: row.vendor360_component,
      layer_path: row.layer_path,
      proof_rule: row.proof_rule,
      cpo_readout: row.cpo_readout,
    })),
    docExtractions: clauseRows.map((row) => ({
      extraction_id: row.source_record_id,
      tenant_key: args.tenantKey,
      load_run_id: args.loadRunId,
      concept_ref: row.concept_ref,
      subject_kind: "contract",
      subject_ref: row.contract_id,
      value_text: row.extracted_text,
      value_num: null,
      source_kind: "span",
      source_file_id: row.document_id,
      source_page: num(row.source_page),
      source_section: row.concept_ref,
      confidence: num(row.confidence),
      method: row.extraction_method,
      review_state: row.review_state,
      visibility_class: "internal",
      content_authenticity: "synthetic",
      payload_json: {
        dataset_id: args.datasetId,
        dataset_version: args.datasetVersion,
        source_record_id: row.source_record_id,
        row_hash: row.row_hash,
        synthetic_notice: manifest.warning,
      },
    })),
  };
}

function planPayload(args, model) {
  return {
    event: "meridian_source_vendor360_candidate_plan",
    mode: args.mode,
    apply: false,
    tenant_key: args.tenantKey,
    source_tenant_key: args.sourceTenantKey,
    dataset_id: args.datasetId,
    dataset_version: args.datasetVersion,
    load_run_id: args.loadRunId,
    package_dir: path.relative(REPO_ROOT, args.packageDir),
    package_status: model.manifest.status,
    package_warning: model.manifest.warning,
    target_counts: {
      contracts: model.contracts.length,
      application_scope: model.scope.length,
      financial_exposure: model.financial.length,
      operational_performance: model.operational.length,
      initiative_dependency: model.dependencies.length,
      source_extract_rows: model.sourceExtracts.length,
      vendor360_mapping_rows: model.mapping.length,
      doc_extraction_rows: model.docExtractions.length,
    },
    contract_ids: model.contracts.map((row) => row.contract_id),
    gates: Object.fromEntries(model.contracts.map((row) => [row.contract_id, {
      action_gate_state: row.action_gate_state,
      value_proven_state: row.value_proven_state,
      forecast_value_usd: row.forecast_value_usd,
      finance_confirmed_value_usd: row.finance_confirmed_value_usd,
    }])),
    hard_gate:
      "Apply is a mutating production data operation. Run this plan/preflight in ACA first; require explicit human approval before --mode apply.",
  };
}

async function ensureSchemas(client) {
  await client.query("CREATE SCHEMA IF NOT EXISTS source");
  await client.query("CREATE SCHEMA IF NOT EXISTS doc");
  await client.query("CREATE SCHEMA IF NOT EXISTS meta");
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_contract (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      source_tenant_key text not null,
      contract_id text not null,
      vendor_ref text,
      vendor_name text,
      vendor_category text,
      contract_name text,
      scope_summary text,
      annual_value numeric,
      total_committed_value numeric,
      committed_annual_spend numeric,
      actual_annual_spend numeric,
      end_date date,
      notice_period_days numeric,
      auto_renew boolean not null default false,
      renewal_decision_state text,
      renewal_owner_ref text,
      benchmarking_clause text,
      exit_rights_summary text,
      alternatives_available text,
      concentration_note text,
      source_confidence numeric,
      resolved_annual_value numeric,
      annual_value_conflict_flag boolean,
      resolved_total_committed_value numeric,
      total_committed_value_conflict_flag boolean,
      scoped_application_count int,
      critical_application_count int,
      linked_budget_amount numeric,
      linked_actual_amount numeric,
      linked_budget_lines int,
      cloud_sev1_sev2_incidents int,
      operational_evidence_gap text,
      initiative_dependency_count int,
      action_gate_state text,
      value_proven_state text,
      forecast_value_usd numeric,
      finance_confirmed_value_usd numeric,
      payload_json jsonb not null default '{}'::jsonb,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, contract_id)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_application_scope (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      contract_id text not null,
      vendor_ref text,
      vendor_name text,
      application_ref text not null,
      application_name text,
      business_function text,
      function_ref text,
      criticality text,
      lifecycle_state text,
      hosting_model text,
      annual_run_cost numeric,
      modernization_plan text,
      sla_tier text,
      known_pain_risk text,
      it_portfolio_ref text,
      relationship_method text,
      relationship_confidence numeric,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, contract_id, application_ref)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_financial_exposure (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      contract_id text not null,
      vendor_ref text,
      vendor_name text,
      contracted_annual_value numeric,
      total_committed_value numeric,
      committed_annual_spend numeric,
      actual_annual_spend numeric,
      linked_budget_amount numeric,
      linked_forecast_amount numeric,
      linked_actual_amount numeric,
      linked_committed_amount numeric,
      linked_budget_lines int,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, contract_id)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_operational_performance (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      contract_id text not null,
      vendor_ref text,
      vendor_name text,
      sla_summary text,
      scoped_application_count int,
      critical_application_count int,
      cloud_sev1_sev2_incidents int,
      avg_cloud_change_failure_rate numeric,
      service_credits_earned numeric,
      service_credits_claimed numeric,
      evidence_gap text,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, contract_id)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_initiative_dependency (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      contract_id text not null,
      vendor_ref text,
      vendor_name text,
      initiative_ref text not null,
      initiative_project_name text,
      status text,
      target_end_date date,
      approved_budget numeric,
      expected_business_technology_value text,
      major_risk_constraint text,
      decision_needed text,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, contract_id, initiative_ref)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_source_extract (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      source_tenant_key text not null,
      source_table text not null,
      source_file text not null,
      source_row_number int not null,
      source_record_id text not null,
      contract_id text,
      row_sha256 text not null,
      payload_json jsonb not null,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, source_table, source_record_id)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.meridian_vendor360_mapping (
      tenant_key text not null,
      dataset_id text not null,
      dataset_version text not null,
      mapping_id text not null,
      source_extract text,
      source_grain text,
      vendor360_component text,
      layer_path text,
      proof_rule text,
      cpo_readout text,
      load_run_id text not null,
      updated_at timestamptz not null default now(),
      primary key (tenant_key, dataset_id, mapping_id)
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS meta.concept (
      concept_ref text primary key,
      domain text not null,
      label text not null,
      datatype text not null,
      unit text,
      definition text not null,
      active boolean not null default true,
      created_at timestamptz not null default now()
    )`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS doc.extraction (
      extraction_id text primary key,
      tenant_key text not null,
      load_run_id text not null,
      concept_ref text not null,
      subject_kind text not null,
      subject_ref text not null,
      value_text text,
      value_num numeric,
      source_kind text not null,
      source_file_id text,
      source_page int,
      source_section text,
      confidence numeric,
      method text,
      review_state text not null default 'unreviewed',
      visibility_class text not null default 'internal',
      content_authenticity text not null,
      payload_json jsonb not null default '{}'::jsonb,
      extracted_at timestamptz default now(),
      unique (tenant_key, extraction_id)
    )`);
  await client.query(`
    DO $$
    DECLARE table_name text;
    BEGIN
      FOREACH table_name IN ARRAY ARRAY[
        'meridian_vendor360_contract',
        'meridian_vendor360_application_scope',
        'meridian_vendor360_financial_exposure',
        'meridian_vendor360_operational_performance',
        'meridian_vendor360_initiative_dependency',
        'meridian_vendor360_source_extract',
        'meridian_vendor360_mapping'
      ]
      LOOP
        IF to_regprocedure('source.can_read_sourcing_tenant(text)') IS NOT NULL THEN
          EXECUTE format('ALTER TABLE source.%I ENABLE ROW LEVEL SECURITY', table_name);
          EXECUTE format('DROP POLICY IF EXISTS authenticated_read_%I ON source.%I', table_name, table_name);
          EXECUTE format('CREATE POLICY authenticated_read_%I ON source.%I FOR SELECT USING (source.can_read_sourcing_tenant(tenant_key))', table_name, table_name);
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          EXECUTE format('GRANT SELECT ON source.%I TO authenticated', table_name);
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON source.%I TO service_role', table_name);
        END IF;
      END LOOP;
    END $$`);
}

async function deleteDataset(client, args, model) {
  for (const table of MERIDIAN_TABLES) {
    await client.query(`DELETE FROM source.${quoteIdent(table)} WHERE tenant_key = $1 AND dataset_id = $2`, [
      args.tenantKey,
      args.datasetId,
    ]);
  }
  await client.query(
    `DELETE FROM doc.extraction
      WHERE tenant_key = $1
        AND (payload_json->>'dataset_id') = $2`,
    [args.tenantKey, args.datasetId],
  );
  await client.query(
    `DELETE FROM doc.extraction
      WHERE tenant_key = $1
        AND extraction_id = ANY($2::text[])`,
    [args.tenantKey, model.docExtractions.map((row) => row.extraction_id)],
  );
}

async function insertMany(client, table, rows, columns, args) {
  for (const row of rows) {
    const record = {
      ...row,
      load_run_id: args.loadRunId,
      updated_at: new Date(),
    };
    await client.query(
      `INSERT INTO ${table} (${columns.map(quoteIdent).join(", ")})
       VALUES (${columns.map((_, index) => `$${index + 1}`).join(", ")})`,
      columns.map((column) =>
        column === "payload_json" ? JSON.stringify(record[column] ?? {}) : record[column] ?? null,
      ),
    );
  }
}

async function loadModel(client, args, model) {
  await ensureSchemas(client);
  await deleteDataset(client, args, model);
  const contractColumns = [
    "tenant_key", "dataset_id", "dataset_version", "source_tenant_key", "contract_id", "vendor_ref", "vendor_name",
    "vendor_category", "contract_name", "scope_summary", "annual_value", "total_committed_value",
    "committed_annual_spend", "actual_annual_spend", "end_date", "notice_period_days", "auto_renew",
    "renewal_decision_state", "renewal_owner_ref", "benchmarking_clause", "exit_rights_summary",
    "alternatives_available", "concentration_note", "source_confidence", "resolved_annual_value",
    "annual_value_conflict_flag", "resolved_total_committed_value", "total_committed_value_conflict_flag",
    "scoped_application_count", "critical_application_count", "linked_budget_amount", "linked_actual_amount",
    "linked_budget_lines", "cloud_sev1_sev2_incidents", "operational_evidence_gap",
    "initiative_dependency_count", "action_gate_state", "value_proven_state", "forecast_value_usd",
    "finance_confirmed_value_usd", "payload_json", "load_run_id", "updated_at",
  ];
  await insertMany(client, "source.meridian_vendor360_contract", model.contracts, contractColumns, args);
  await insertMany(client, "source.meridian_vendor360_application_scope", model.scope, [
    "tenant_key", "dataset_id", "dataset_version", "contract_id", "vendor_ref", "vendor_name", "application_ref",
    "application_name", "business_function", "function_ref", "criticality", "lifecycle_state", "hosting_model",
    "annual_run_cost", "modernization_plan", "sla_tier", "known_pain_risk", "it_portfolio_ref",
    "relationship_method", "relationship_confidence", "load_run_id", "updated_at",
  ], args);
  await insertMany(client, "source.meridian_vendor360_financial_exposure", model.financial, [
    "tenant_key", "dataset_id", "dataset_version", "contract_id", "vendor_ref", "vendor_name",
    "contracted_annual_value", "total_committed_value", "committed_annual_spend", "actual_annual_spend",
    "linked_budget_amount", "linked_forecast_amount", "linked_actual_amount", "linked_committed_amount",
    "linked_budget_lines", "load_run_id", "updated_at",
  ], args);
  await insertMany(client, "source.meridian_vendor360_operational_performance", model.operational, [
    "tenant_key", "dataset_id", "dataset_version", "contract_id", "vendor_ref", "vendor_name",
    "sla_summary", "scoped_application_count", "critical_application_count", "cloud_sev1_sev2_incidents",
    "avg_cloud_change_failure_rate", "service_credits_earned", "service_credits_claimed", "evidence_gap",
    "load_run_id", "updated_at",
  ], args);
  await insertMany(client, "source.meridian_vendor360_initiative_dependency", model.dependencies, [
    "tenant_key", "dataset_id", "dataset_version", "contract_id", "vendor_ref", "vendor_name",
    "initiative_ref", "initiative_project_name", "status", "target_end_date", "approved_budget",
    "expected_business_technology_value", "major_risk_constraint", "decision_needed", "load_run_id", "updated_at",
  ], args);
  await insertMany(client, "source.meridian_vendor360_source_extract", model.sourceExtracts, [
    "tenant_key", "dataset_id", "dataset_version", "source_tenant_key", "source_table", "source_file",
    "source_row_number", "source_record_id", "contract_id", "row_sha256", "payload_json", "load_run_id", "updated_at",
  ], args);
  await insertMany(client, "source.meridian_vendor360_mapping", model.mapping, [
    "tenant_key", "dataset_id", "dataset_version", "mapping_id", "source_extract", "source_grain",
    "vendor360_component", "layer_path", "proof_rule", "cpo_readout", "load_run_id", "updated_at",
  ], args);

  const conceptRefs = [...new Set(model.docExtractions.map((row) => row.concept_ref))];
  for (const conceptRef of conceptRefs) {
    await client.query(
      `INSERT INTO meta.concept (concept_ref, domain, label, datatype, definition, active)
       VALUES ($1, $2, $3, 'text', $4, true)
       ON CONFLICT (concept_ref) DO UPDATE SET label = excluded.label, definition = excluded.definition, active = true`,
      [
        conceptRef,
        conceptRef.split(".")[0] || "contract",
        conceptRef.split(".").slice(1).join(" ").replace(/-/g, " "),
        "Synthetic PHI-free contract clause extraction from Meridian Source Vendor 360 candidate package.",
      ],
    );
  }
  await insertMany(client, "doc.extraction", model.docExtractions, [
    "extraction_id", "tenant_key", "load_run_id", "concept_ref", "subject_kind", "subject_ref",
    "value_text", "value_num", "source_kind", "source_file_id", "source_page", "source_section",
    "confidence", "method", "review_state", "visibility_class", "content_authenticity", "payload_json",
  ], args);
}

async function readback(client, args) {
  const counts = await client.query(
    `SELECT
       (SELECT count(*)::int FROM source.meridian_vendor360_contract WHERE tenant_key = $1 AND dataset_id = $2) AS contracts,
       (SELECT count(*)::int FROM source.meridian_vendor360_application_scope WHERE tenant_key = $1 AND dataset_id = $2) AS application_scope,
       (SELECT count(*)::int FROM source.meridian_vendor360_financial_exposure WHERE tenant_key = $1 AND dataset_id = $2) AS financial_exposure,
       (SELECT count(*)::int FROM source.meridian_vendor360_operational_performance WHERE tenant_key = $1 AND dataset_id = $2) AS operational_performance,
       (SELECT count(*)::int FROM source.meridian_vendor360_initiative_dependency WHERE tenant_key = $1 AND dataset_id = $2) AS initiative_dependency,
       (SELECT count(*)::int FROM source.meridian_vendor360_source_extract WHERE tenant_key = $1 AND dataset_id = $2) AS source_extract_rows,
       (SELECT count(*)::int FROM source.meridian_vendor360_mapping WHERE tenant_key = $1 AND dataset_id = $2) AS vendor360_mapping_rows,
       (SELECT count(*)::int FROM doc.extraction WHERE tenant_key = $1 AND payload_json->>'dataset_id' = $2) AS doc_extraction_rows,
       (SELECT coalesce(sum(annual_value), 0)::numeric FROM source.meridian_vendor360_contract WHERE tenant_key = $1 AND dataset_id = $2) AS annual_value_usd,
       (SELECT coalesce(sum(finance_confirmed_value_usd), 0)::numeric FROM source.meridian_vendor360_contract WHERE tenant_key = $1 AND dataset_id = $2) AS finance_confirmed_value_usd`,
    [args.tenantKey, args.datasetId],
  );
  const ids = await client.query(
    `SELECT contract_id, vendor_name, annual_value, action_gate_state, value_proven_state
       FROM source.meridian_vendor360_contract
      WHERE tenant_key = $1 AND dataset_id = $2
      ORDER BY annual_value DESC NULLS LAST`,
    [args.tenantKey, args.datasetId],
  );
  return {
    counts: counts.rows[0] ?? {},
    contracts: ids.rows,
  };
}

function compareCounts(expected, actual) {
  const failures = [];
  for (const [key, value] of Object.entries(expected)) {
    if (Number(actual[key] ?? 0) !== Number(value)) {
      failures.push(`${key}: expected ${value}, got ${actual[key] ?? 0}`);
    }
  }
  return failures;
}

function writeProof(args, payload) {
  if (!args.emitProofBundle) return;
  fs.mkdirSync(args.outDir, { recursive: true });
  fs.writeFileSync(
    path.join(args.outDir, "meridian-source-vendor360-candidate-proof.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
}

async function main() {
  const args = parseArgs();
  const model = buildModel(args);
  const plan = planPayload(args, model);

  if (args.mode === "self-test" || args.mode === "plan") {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }

  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "meridian-source-vendor360-candidate"));
  await client.connect();
  try {
    if (args.mode === "verify") {
      const verification = await readback(client, args);
      const failures = compareCounts(plan.target_counts, verification.counts);
      const payload = {
        ...plan,
        event: "meridian_source_vendor360_candidate_verify",
        mode: args.mode,
        readback: verification,
        passed: failures.length === 0,
        failures,
      };
      writeProof(args, payload);
      console.log(JSON.stringify(payload, null, 2));
      if (failures.length) process.exitCode = 1;
      return;
    }

    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [args.tenantKey]);
    await loadModel(client, args, model);
    const verification = await readback(client, args);
    const failures = compareCounts(plan.target_counts, verification.counts);
    if (failures.length) {
      throw new Error(`Readback count mismatch: ${failures.join("; ")}`);
    }
    if (args.mode === "apply") {
      await client.query("commit");
    } else {
      await client.query("rollback");
    }
    const payload = {
      ...plan,
      event: args.mode === "apply" ? "meridian_source_vendor360_candidate_loaded" : "meridian_source_vendor360_candidate_preflight",
      apply: args.mode === "apply",
      readback: verification,
      passed: true,
      committed: args.mode === "apply",
    };
    writeProof(args, payload);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
        code: error.code,
        detail: error.detail,
        schema: error.schema,
        table: error.table,
        column: error.column,
        constraint: error.constraint,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
