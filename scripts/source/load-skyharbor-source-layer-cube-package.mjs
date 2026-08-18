#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { canonicalTenantKey } from "../../src/lib/tenant/aliases";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const requireFromApp = createRequire(new URL("../../package.json", import.meta.url));

const DATASET_ID = "skyharbor-air-source-layer-cube-demo-20260811";
const DATASET_VERSION = "source-layer-cube-demo-20260811";
const DEFAULT_PACKAGE_ROOT =
  "datasets/source/contract-intelligence/skyharbor-source-layer-cube-20260811";
const DEFAULT_TENANT_KEY = "skyharbor-air";
const APPROVED_CANONICAL_TENANT_KEY = "skyharbor-air";
const DEFAULT_LOAD_RUN_ID = `${DATASET_ID}:operator-reviewed`;
let LOAD_RUN_ID = DEFAULT_LOAD_RUN_ID;
const AS_OF_DATE = "2027-06-30";

const REQUIRED_TABLES = Object.freeze([
  "vendor",
  "contract",
  "contract_term",
  "contract_price_component",
  "contract_consumption_observation",
  "contract_performance_observation",
  "contract_service_credit",
  "sourcing_opportunity",
  "renewal_decision",
  "commercial_variance",
]);

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    if (process.env[key] !== undefined) continue;
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? fallback;
  const prefixed = process.argv.find((value) => value.startsWith(`${name}=`));
  return prefixed ? prefixed.slice(name.length + 1) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function applyRequested() {
  return (
    hasFlag("--apply") ||
    process.env.SOURCE_SKYHARBOR_LAYER_CUBE_APPLY === "true"
  );
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") value += char;
  }
  if (row.length || value) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...dataRows] = rows.filter((candidate) =>
    candidate.some((cell) => cell !== ""),
  );
  if (!headers) return [];
  return dataRows.map((cells, rowIndex) => ({
    ...Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""])),
    __source_row_number: rowIndex + 2,
  }));
}

function readCsv(root, rel) {
  return parseCsv(fs.readFileSync(path.join(root, rel), "utf8"));
}

function readJson(root, rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function sha256File(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function text(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function bool(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (["true", "yes", "1"].includes(s)) return true;
  if (["false", "no", "0"].includes(s)) return false;
  return null;
}

function date(value) {
  const s = text(value);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function monthEnd(value) {
  const s = text(value);
  if (!s || !/^\d{4}-\d{2}$/.test(s)) return null;
  const [year, month] = s.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function qualityStateFor(row) {
  const review = String(row.review_state ?? "").toLowerCase();
  if (review.includes("conflict")) return "conflict";
  if (review.includes("accepted") || review.includes("ready")) return "accepted";
  if (review.includes("review")) return "reviewed";
  return "partial";
}

function normalizedValueType(value) {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("recover")) return "recoverable_leakage";
  if (s.includes("avoid")) return "avoided_cost";
  return "negotiated_improvement";
}

function confidenceForGrade(grade) {
  const s = String(grade ?? "").trim().toUpperCase();
  if (s.startsWith("A")) return 0.9;
  if (s.startsWith("B")) return 0.75;
  if (s.startsWith("C")) return 0.6;
  return 0.5;
}

function packageFingerprint(root) {
  const files = [
    "proof_manifest.json",
    "layer_1_client_intake/source_package_manifest.json",
    "validation/validation_results.json",
    "layer_4_read_models/source_contract_portfolio.csv",
    "layer_4_read_models/source_contract_360_read_model.csv",
    "cube/source_contract_cube.csv",
  ];
  return createHash("sha256")
    .update(files.map((rel) => `${rel}:${sha256File(path.join(root, rel))}`).join("\n"))
    .digest("hex");
}

function loadPackage(root, tenantKey) {
  const manifest = readJson(root, "proof_manifest.json");
  const validation = readJson(root, "validation/validation_results.json");
  const validationErrors = Array.isArray(validation)
    ? validation.filter((row) => String(row.status ?? "").toLowerCase() === "fail")
    : [];
  if (validationErrors.length > 0) {
    throw new Error(`Package validation contains ${validationErrors.length} failing checks.`);
  }

  const contracts = readCsv(root, "layer_3_canonical/canonical_contracts.csv");
  const vendors = readCsv(root, "layer_3_canonical/canonical_vendors_suppliers.csv");
  const clauses = readCsv(root, "layer_3_canonical/canonical_clauses.csv");
  const pricing = readCsv(root, "layer_3_canonical/canonical_pricing_lines.csv");
  const usage = readCsv(root, "layer_3_canonical/canonical_usage_entitlements.csv");
  const sla = readCsv(root, "layer_3_canonical/canonical_sla_events.csv");
  const opportunities = readCsv(root, "layer_3_canonical/canonical_opportunities.csv");
  const finance = readCsv(root, "layer_3_canonical/canonical_finance_periods.csv");
  const gateFlags = readCsv(root, "cube/cube_gate_flags.csv");

  const contractById = new Map(contracts.map((row) => [row.contract_id, row]));
  const gatesByContract = new Map(gateFlags.map((row) => [row.contract_id, row]));
  const vendorByParent = new Map();
  for (const row of vendors) {
    const vendorId = row.vendor_parent_id;
    if (!vendorId || vendorByParent.has(vendorId)) continue;
    vendorByParent.set(vendorId, row);
  }

  const vendorRows = [...vendorByParent.values()].map((row) => {
    const relatedContract = contracts.find(
      (contract) => contract.vendor_parent_id === row.vendor_parent_id,
    );
    return {
      tenant_key: tenantKey,
      vendor_id: row.vendor_parent_id,
      legal_name: row.vendor_parent_name || row.supplier_legal_name,
      parent_company: row.vendor_parent_name || row.supplier_legal_name,
      supplier_category: relatedContract?.category ?? null,
      strategic_status: "synthetic_demo_operator_reviewed",
      country: row.tax_country || "US",
      region: row.tax_country === "US" ? "North America" : null,
      diversity_status: null,
      risk_tier: row.risk_status || null,
      financial_health_status: null,
      security_risk_status: row.risk_status || null,
      relationship_owner_role: relatedContract?.procurement_owner_role ?? null,
      active_state: row.supplier_status || "active",
      source_system: "source_layer_cube_package",
      source_record_id: row.canonical_object_id,
      as_of_date: row.as_of_date || AS_OF_DATE,
      confidence: 0.88,
      quality_state: qualityStateFor(row),
      evidence_reference: row.source_file,
      load_run_id: LOAD_RUN_ID,
      raw_payload: row,
    };
  });

  const contractRows = contracts.map((row) => {
    const gate = gatesByContract.get(row.contract_id) ?? {};
    return {
      tenant_key: tenantKey,
      contract_id: row.contract_id,
      vendor_id: row.vendor_parent_id,
      contract_name: row.contract_name,
      agreement_type: row.contract_archetype,
      effective_date: date(row.effective_date),
      expiration_date: date(row.expiration_date),
      notice_deadline: date(row.notice_deadline),
      renewal_type: gate.action_ready_state || row.fixture_role,
      auto_renew: bool(row.auto_renew),
      term_length_months: null,
      annual_value: num(row.annual_value_usd),
      total_committed_value: num(row.committed_value_usd),
      currency: "USD",
      payment_terms: null,
      benchmark_rights: gate.allow_action_claim === "yes" ? "operator_reviewed_action_ready" : "blocked_by_conflict_control",
      termination_rights: gate.vendor_outreach_state || null,
      price_uplift_terms: null,
      minimum_commitment: null,
      service_credit_cap: null,
      exit_assistance_terms: gate.value_proven_state || null,
      renewal_owner_role: row.procurement_owner_role,
      parent_contract_id: row.contract_family_id,
      document_file_id: row.commercial_instrument_id,
      source_system: row.source_system || "source_layer_cube_package",
      source_record_id: row.source_record_id,
      as_of_date: row.as_of_date || AS_OF_DATE,
      confidence: gate.allow_action_claim === "yes" ? 0.9 : 0.65,
      quality_state: qualityStateFor(row),
      evidence_reference: row.source_file,
      load_run_id: LOAD_RUN_ID,
      raw_payload: { ...row, gate },
    };
  });

  const contractTerms = clauses.map((row) => ({
    tenant_key: tenantKey,
    term_id: row.canonical_object_id,
    contract_id: row.contract_id,
    term_type: row.evidence_class || "document_clause",
    term_name: row.clause_title || row.concept_ref || row.canonical_object_id,
    term_value: row.extracted_text || row.clause_summary || row.review_state,
    value_num: num(row.amount_usd),
    unit: row.unit || null,
    currency: row.currency || null,
    effective_date: null,
    expiration_date: null,
    page_ref: row.page_span || row.source_page || null,
    clause_ref: row.concept_ref || null,
    source_system: row.source_system || "document_clause_extraction",
    source_record_id: row.source_record_id || row.canonical_object_id,
    as_of_date: row.as_of_date || AS_OF_DATE,
    confidence: 0.82,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const priceComponents = pricing.map((row) => ({
    tenant_key: tenantKey,
    price_component_id: row.canonical_object_id,
    contract_id: row.contract_id,
    component_type: row.price_component_type || row.sku_or_service || "pricing_line",
    component_name: row.sku_or_service || row.price_component_type || row.canonical_object_id,
    service_id: row.sku_or_service || null,
    rate: num(row.unit_rate_usd),
    amount: num(row.annualized_amount_usd ?? row.line_amount_usd),
    currency: "USD",
    unit: row.unit || null,
    volume_band_min: num(row.volume_band_min),
    volume_band_max: num(row.volume_band_max),
    minimum_commitment: num(row.minimum_commitment_usd),
    overage_rate: num(row.overage_rate_usd),
    effective_date: date(row.effective_date),
    expiration_date: date(row.expiration_date),
    source_system: row.source_system || "pricing_schedule",
    source_record_id: row.source_record_id || row.canonical_object_id,
    as_of_date: row.as_of_date || AS_OF_DATE,
    confidence: 0.84,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const consumptionRows = usage.map((row) => ({
    tenant_key: tenantKey,
    observation_id: row.canonical_object_id,
    contract_id: row.contract_id,
    service_id: row.sku_or_service || null,
    business_unit: row.user_cohort || null,
    cost_center: null,
    period_start: row.period_month ? `${row.period_month}-01` : AS_OF_DATE,
    period_end: monthEnd(row.period_month) || AS_OF_DATE,
    committed_amount: num(row.monthly_cost_usd),
    invoice_amount: num(row.monthly_cost_usd),
    paid_amount: null,
    actual_spend: num(row.monthly_cost_usd),
    consumed_quantity: num(row.active_quantity),
    consumed_unit: "active_quantity",
    overage_amount: null,
    service_credit_amount: null,
    currency: "USD",
    source_system: row.source_system || "usage_entitlement",
    source_record_id: row.source_record_id,
    as_of_date: row.as_of_date || AS_OF_DATE,
    confidence: 0.78,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const performanceRows = sla.map((row) => ({
    tenant_key: tenantKey,
    observation_id: row.canonical_object_id,
    contract_id: row.contract_id,
    service_id: row.service_id || null,
    metric_name: row.sla_name || "sla_attainment",
    period_start: date(row.event_date) || AS_OF_DATE,
    period_end: date(row.event_date) || AS_OF_DATE,
    contracted_target: row.target_attainment_rate || null,
    actual_value: row.actual_attainment_rate || null,
    value_num: num(row.actual_attainment_rate),
    unit: "attainment_rate",
    breach_count: row.breach_state === "breached" ? 1 : 0,
    credit_eligible: num(row.service_credits_earned_usd) > 0,
    credit_calculated: num(row.service_credits_earned_usd),
    credit_claimed: num(row.service_credits_claimed_usd),
    credit_recovered: num(row.service_credits_received_usd),
    currency: "USD",
    source_system: row.source_system || "sla_event",
    source_record_id: row.source_record_id,
    as_of_date: row.as_of_date || AS_OF_DATE,
    confidence: row.review_state === "disputed" ? 0.62 : 0.8,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const serviceCreditRows = sla.map((row) => ({
    tenant_key: tenantKey,
    service_credit_id: `${row.canonical_object_id}:credit`,
    contract_id: row.contract_id,
    service_id: row.service_id || null,
    period_start: date(row.event_date) || AS_OF_DATE,
    period_end: date(row.event_date) || AS_OF_DATE,
    trigger_metric: row.sla_name || "sla_attainment",
    credit_earned: num(row.service_credits_earned_usd),
    credit_claimed: num(row.service_credits_claimed_usd),
    credit_recovered: num(row.service_credits_received_usd),
    credit_waived: null,
    currency: "USD",
    status: row.dispute_state || (num(row.service_credits_earned_usd) > 0 ? "identified" : "not_triggered"),
    owner_role: contractById.get(row.contract_id)?.service_owner_role ?? null,
    source_system: row.source_system || "sla_event",
    source_record_id: row.source_record_id,
    as_of_date: row.as_of_date || AS_OF_DATE,
    confidence: row.review_state === "disputed" ? 0.62 : 0.8,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const opportunityRows = opportunities.map((row) => ({
    tenant_key: tenantKey,
    opportunity_id: row.opportunity_id,
    opportunity_type: row.opportunity_subtype,
    vendor_id: row.vendor_parent_id,
    contract_id: row.contract_id,
    event_id: `${row.contract_id}:source-layer-cube-demo`,
    title: row.opportunity_subtype,
    finding_summary: row.hypothesis,
    deterministic_basis: `Layer/cube package ${DATASET_ID}; evidence grade ${row.evidence_grade}`,
    value_low: num(row.current_valuation_low_usd),
    value_high: num(row.current_valuation_high_usd),
    currency: "USD",
    timing_window: row.current_value_stage,
    confidence: confidenceForGrade(row.evidence_grade),
    quality_state: row.contract_id === "CTR-061" ? "conflict" : qualityStateFor(row),
    recommended_action: row.opportunity_status,
    accountable_role: row.owner_role,
    evidence_reference: row.source_file,
    missing_context: row.blocking_factors || null,
    as_of_date: AS_OF_DATE,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  const renewalRows = contracts.map((row) => {
    const gate = gatesByContract.get(row.contract_id) ?? {};
    return {
      tenant_key: tenantKey,
      renewal_decision_id: `${row.contract_id}:renewal-decision`,
      contract_id: row.contract_id,
      decision_window: row.notice_deadline,
      notice_deadline: date(row.notice_deadline),
      current_decision_status: gate.action_ready_state || row.fixture_role,
      business_dependency: row.business_owner_role,
      transition_lead_time: null,
      market_scan_status: gate.vendor_outreach_state || null,
      alternative_supplier_status: gate.vendor_outreach_state || null,
      benchmark_status: gate.diagnosis_ready_state || null,
      recommended_action:
        gate.allow_action_claim === "yes"
          ? "prepare_operator_reviewed_vendor_outreach"
          : "hold_for_conflict_resolution",
      accountable_role: row.procurement_owner_role,
      decision_due_date: date(row.notice_deadline),
      as_of_date: row.as_of_date || AS_OF_DATE,
      confidence: gate.allow_action_claim === "yes" ? 0.88 : 0.62,
      quality_state: gate.allow_action_claim === "yes" ? "accepted" : "conflict",
      evidence_reference: row.source_file,
      load_run_id: LOAD_RUN_ID,
      raw_payload: { ...row, gate },
    };
  });

  const commercialVarianceRows = finance.map((row) => ({
    tenant_key: tenantKey,
    variance_id: row.canonical_object_id,
    contract_id: row.contract_id,
    vendor_id: contractById.get(row.contract_id)?.vendor_parent_id ?? null,
    variance_type: row.confirmation_state || "finance_realization_period",
    baseline_value: num(row.forecast_value_usd),
    comparison_value: num(row.observed_actual_usd),
    variance_amount:
      num(row.observed_actual_usd) !== null && num(row.forecast_value_usd) !== null
        ? num(row.observed_actual_usd) - num(row.forecast_value_usd)
        : null,
    variance_pct: null,
    currency: "USD",
    calculation_basis: "finance realization period from operator-reviewed synthetic package",
    period_start: null,
    period_end: null,
    confidence: 0.66,
    quality_state: qualityStateFor(row),
    evidence_reference: row.source_file,
    load_run_id: LOAD_RUN_ID,
    raw_payload: row,
  }));

  return {
    manifest,
    packageFingerprint: packageFingerprint(root),
    rows: {
      vendor: vendorRows,
      contract: contractRows,
      contract_term: contractTerms,
      contract_price_component: priceComponents,
      contract_consumption_observation: consumptionRows,
      contract_performance_observation: performanceRows,
      contract_service_credit: serviceCreditRows,
      sourcing_opportunity: opportunityRows,
      renewal_decision: renewalRows,
      commercial_variance: commercialVarianceRows,
    },
  };
}

async function assertTables(client) {
  const result = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((table) => !found.has(table));
  if (missing.length > 0) {
    throw new Error(
      `Missing required Source tables: ${missing.join(", ")}. Run source:contract-optimization:schema:apply through the ACA operator job first.`,
    );
  }
}

async function upsertRows(client, table, rows, conflictColumns) {
  if (rows.length === 0) return 0;
  const columns = Object.keys(rows[0]);
  let written = 0;
  for (const row of rows) {
    const values = columns.map((column) =>
      column === "raw_payload" ? JSON.stringify(row[column]) : row[column],
    );
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const updateColumns = columns.filter((column) => !conflictColumns.includes(column));
    await client.query(
      `INSERT INTO source.${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (${conflictColumns.map(quoteIdent).join(", ")})
       DO UPDATE SET ${updateColumns
         .map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`)
         .join(", ")}`,
      values,
    );
    written += 1;
  }
  return written;
}

function quoteIdent(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function readbackCounts(client, tenantKey) {
  const rows = {};
  for (const table of Object.keys(TABLE_CONFLICTS)) {
    const result = await client.query(
      `SELECT count(*)::int AS count
         FROM source.${quoteIdent(table)}
        WHERE tenant_key = $1
          AND load_run_id = $2`,
      [tenantKey, LOAD_RUN_ID],
    );
    rows[table] = result.rows[0]?.count ?? 0;
  }
  return rows;
}

const TABLE_CONFLICTS = Object.freeze({
  vendor: ["tenant_key", "vendor_id"],
  contract: ["tenant_key", "contract_id"],
  contract_term: ["tenant_key", "term_id"],
  contract_price_component: ["tenant_key", "price_component_id"],
  contract_consumption_observation: ["tenant_key", "observation_id"],
  contract_performance_observation: ["tenant_key", "observation_id"],
  contract_service_credit: ["tenant_key", "service_credit_id"],
  sourcing_opportunity: ["tenant_key", "opportunity_id"],
  renewal_decision: ["tenant_key", "renewal_decision_id"],
  commercial_variance: ["tenant_key", "variance_id"],
});

async function main() {
  const apply = applyRequested();
  const packageRoot = path.resolve(arg("--package-root", DEFAULT_PACKAGE_ROOT));
  const requestedTenantKey = arg("--tenant-key", process.env.TENANT_KEY || DEFAULT_TENANT_KEY);
  const tenantKey = canonicalTenantKey(requestedTenantKey);
  if (tenantKey !== APPROVED_CANONICAL_TENANT_KEY) {
    throw new Error(
      `Refusing to load ${DATASET_ID} for ${tenantKey}. Approved canonical tenant is ${APPROVED_CANONICAL_TENANT_KEY}.`,
    );
  }
  if (!fs.existsSync(packageRoot)) {
    throw new Error(`Package root not found: ${packageRoot}`);
  }
  // source.contract_vendor_360 joins source.contract to source.l4_cube_active_load_run on
  // (tenant_key, load_run_id) -- exactly one load_run_id is "active" per tenant, and rows
  // under any other load_run_id are invisible to the view even though they exist in the
  // base table. Default to this package's own run id (safe, isolated); pass
  // --load-run-id/LOAD_RUN_ID explicitly to coexist with whatever load_run_id is currently
  // active for the tenant instead.
  LOAD_RUN_ID = arg("--load-run-id", process.env.LOAD_RUN_ID || DEFAULT_LOAD_RUN_ID);

  const loaded = loadPackage(packageRoot, tenantKey);
  const generatedRows = Object.fromEntries(
    Object.entries(loaded.rows).map(([table, rows]) => [table, rows.length]),
  );

  const plan = {
    event: "skyharbor_source_layer_cube_package_load",
    apply,
    datasetId: DATASET_ID,
    datasetVersion: DATASET_VERSION,
    tenantKey,
    requestedTenantKey,
    loadRunId: LOAD_RUN_ID,
    packageRoot,
    packageFingerprint: loaded.packageFingerprint,
    syntheticDemo: true,
    operatorReviewed: true,
    liveClientTruth: false,
    retrievalIndexingApproved: false,
    activeTenantAccessPromotionApproved: false,
    generatedRows,
  };

  if (!apply) {
    console.log(JSON.stringify({ ...plan, persistedRows: null }, null, 2));
    return;
  }

  const { Client } = requireFromApp("pg");
  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-layer-cube-package-load"),
  );
  await client.connect();
  const persistedRows = {};
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
    await assertTables(client);
    for (const [table, rows] of Object.entries(loaded.rows)) {
      persistedRows[table] = await upsertRows(
        client,
        table,
        rows,
        TABLE_CONFLICTS[table],
      );
    }
    await client.query("COMMIT");
    const readback = await readbackCounts(client, tenantKey);
    console.log(JSON.stringify({ ...plan, persistedRows, readback }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
