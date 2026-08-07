#!/usr/bin/env node
import crypto from "node:crypto";
import { Client } from "pg";

const RAW_SCHEMA = "raw_source_v4";
const TOWER_SCHEMA = "tower";
const DATASET_ID = "skyharbor-source-v4-202608-golden-evidence";
const DATASET_VERSION = "v4-golden-evidence";
const TENANT_KEY = "skyharbor_global";
const CONTRACT_ID = "CTR-061";
const SOURCE_THREAD_ID = "source_contract_optimization_golden_evidence_v1";

const EXPECTED = Object.freeze({
  slaUnclaimed: 620_000,
  invoiceException: 275_000,
  rateVariance: 410_000,
  recoverableLeakage: 1_305_000,
  avoidedCost: 1_580_000,
  negotiatedImprovement: 1_100_000,
  realizedValue: 1_185_000,
});

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  return {
    apply:
      args.includes("--apply") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_APPLY === "true",
    tenantKey:
      value("--tenant-key") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_TENANT_KEY ||
      TENANT_KEY,
    contractId:
      value("--contract-id") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_CONTRACT_ID ||
      CONTRACT_ID,
    datasetId:
      value("--dataset-id") ||
      process.env.SOURCE_GOLDEN_EVIDENCE_DATASET_ID ||
      DATASET_ID,
    loadRunId:
      value("--load-run-id") ||
      process.env.LOAD_RUN_ID ||
      `source-golden-evidence-${stamp()}`,
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

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
}

function tenantAliases(tenantKey) {
  return [
    ...new Set(
      [tenantKey, tenantKey === "skyharbor_global" ? "skyharbor" : null].filter(
        Boolean,
      ),
    ),
  ];
}

async function tableColumns(client, table) {
  const result = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2`,
    [RAW_SCHEMA, table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function ensureRawTable(client, table) {
  const columns = await tableColumns(client, table);
  if (columns.size === 0) {
    throw new Error(`Required raw table is missing: ${RAW_SCHEMA}.${table}`);
  }
  return columns;
}

async function deleteAugmentationRows(client, args) {
  for (const table of [
    "servicenow_sla_monthly",
    "s4_vendor_invoice_lines",
    "fieldglass_rate_card",
    "entra_saas_usage_monthly",
    "ariba_sourcing_events",
  ]) {
    await ensureRawTable(client, table);
    await client.query(
      `DELETE FROM ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(table)}
        WHERE _tenant_key = $1 AND _dataset_id = $2`,
      [args.tenantKey, args.datasetId],
    );
  }
}

function baseRawRow(args, table, index, row) {
  const logical = {
    tenant_key: args.tenantKey,
    dataset_id: args.datasetId,
    dataset_version: DATASET_VERSION,
    source_system: row.source_system,
    source_module: row.source_module,
    source_object: row.source_object,
    source_record_id: row.source_record_id,
    source_record_url_or_path: row.source_record_url_or_path,
    extract_job_id: args.loadRunId,
    extract_method: "synthetic_canary_operator_job",
    extract_timestamp: new Date().toISOString(),
    as_of_date: "2027-06-30",
    business_owner_role: "Strategic sourcing lead",
    technical_owner_role: "Source data steward",
    quality_state: row.quality_state || "system_record",
    evidence_state: row.evidence_state || "system_evidenced",
    synthetic_generation_rule:
      "Synthetic canary evidence shaped like client source-system exports; not client fact.",
    scenario_thread_id: SOURCE_THREAD_ID,
    ...row,
  };
  const raw = {
    ...logical,
    row_hash: sha256(JSON.stringify(logical)),
    _tenant_key: args.tenantKey,
    _dataset_id: args.datasetId,
    _load_run_id: args.loadRunId,
    _source_file: `golden-evidence/${table}.csv`,
    _source_row_number: index + 2,
    _source_csv_sha256: sha256(`${args.datasetId}:${table}`),
    _row_sha256: sha256(JSON.stringify(logical)),
    _loaded_at: new Date(),
  };
  return raw;
}

async function insertRawRows(client, args, table, rows) {
  const columns = await ensureRawTable(client, table);
  const prepared = rows.map((row, index) =>
    baseRawRow(args, table, index, row),
  );
  for (const row of prepared) {
    const filtered = Object.fromEntries(
      Object.entries(row).filter(([column]) => columns.has(column)),
    );
    const columnNames = Object.keys(filtered);
    const values = Object.values(filtered);
    await client.query(
      `INSERT INTO ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(table)}
       (${columnNames.map(quoteIdent).join(", ")})
       VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")})`,
      values,
    );
  }
  return prepared.length;
}

function monthDate(index, day = 1) {
  const month = String(index + 1).padStart(2, "0");
  return `2027-${month}-${String(day).padStart(2, "0")}`;
}

function performanceRows(contractId) {
  const monthlyCredits = Array.from({ length: 12 }, (_, index) =>
    index === 11 ? 48_000 : 52_000,
  );
  return monthlyCredits.map((credit, index) => ({
    source_system: "ServiceNow",
    source_module: "Vendor SLA Performance",
    source_object: "sla_credit_month",
    source_record_id: `SNOW-SLA-${contractId}-${String(index + 1).padStart(2, "0")}`,
    source_record_url_or_path: "servicenow:/reports/vendor-sla-credit-register",
    contract_id: contractId,
    service_id: "SVC-DATA-PLATFORM-SUPPORT",
    application_id: "APP-DATA-PLATFORM-061",
    metric_name: "Platform availability service credit",
    target: "99.9",
    actual: index % 3 === 0 ? "99.62" : "99.73",
    unit: "percent",
    period_start: monthDate(index, 1),
    period_end: monthDate(index, 28),
    breach_count: index % 3 === 0 ? "2" : "1",
    severity_mix: "sev2:1;sev3:2",
    incident_count: String(4 + (index % 3)),
    request_count: String(420 + index * 7),
    change_count: String(18 + (index % 4)),
    credit_eligible: "true",
    credit_calculated: String(credit),
    credit_earned: String(credit),
    credit_claimed: "0",
    credit_recovered: "0",
    claim_state: "earned_unclaimed",
    root_cause_category: "vendor_platform_availability",
    vendor_responsibility_marker: "vendor_responsible",
    dispute_status: "not_disputed",
    review_state: "system_extracted",
  }));
}

function invoiceRows(contractId) {
  return [
    {
      source_system: "SAP S/4HANA",
      source_module: "Accounts Payable",
      source_object: "vendor_invoice_line",
      source_record_id: `S4-INV-${contractId}-OFFCONTRACT-001`,
      source_record_url_or_path: "s4:/ap/vendor-invoice-lines",
      supplier_id: "SUP-MICROSOFT",
      vendor_id: "VND-MICROSOFT",
      contract_id: contractId,
      po_number: "PO-2027-061-8801",
      po_line: "10",
      invoice_id: "INV-2027-061-4412",
      invoice_line: "1",
      gl_account: "617500",
      cost_center: "CC-IT-DATA",
      business_unit: "Technology",
      company_code: "SHG1",
      tax_code: "TX0",
      service_period_start: "2027-04-01",
      service_period_end: "2027-04-30",
      posting_date: "2027-05-04",
      invoice_date: "2027-05-01",
      payment_date: "2027-05-29",
      payment_status: "paid",
      line_description: "Premium support hours billed outside active SOW.",
      quantity: "1",
      unit_price: "185000",
      net_amount: "185000",
      line_amount: "185000",
      actual_spend: "185000",
      tax_amount: "0",
      gross_amount: "185000",
      currency: "USD",
      matching_state: "off_contract",
      contract_match_state: "no_active_contract_line",
      commitment_amount: "0",
      accrual_adjustment_flag: "false",
      reason_code: "missing_contract_line",
      approver_role: "AP operations manager",
      ap_processing_state: "paid_pending_recovery_review",
    },
    {
      source_system: "SAP S/4HANA",
      source_module: "Accounts Payable",
      source_object: "vendor_invoice_line",
      source_record_id: `S4-INV-${contractId}-DUPLICATE-001`,
      source_record_url_or_path: "s4:/ap/vendor-invoice-lines",
      supplier_id: "SUP-MICROSOFT",
      vendor_id: "VND-MICROSOFT",
      contract_id: contractId,
      po_number: "PO-2027-061-8802",
      po_line: "20",
      invoice_id: "INV-2027-061-4488",
      invoice_line: "2",
      gl_account: "617500",
      cost_center: "CC-IT-DATA",
      business_unit: "Technology",
      company_code: "SHG1",
      tax_code: "TX0",
      service_period_start: "2027-05-01",
      service_period_end: "2027-05-31",
      posting_date: "2027-06-05",
      invoice_date: "2027-06-01",
      payment_date: "2027-06-28",
      payment_status: "paid",
      line_description: "Duplicate monthly managed service fee.",
      quantity: "1",
      unit_price: "90000",
      net_amount: "90000",
      line_amount: "90000",
      actual_spend: "90000",
      tax_amount: "0",
      gross_amount: "90000",
      currency: "USD",
      matching_state: "duplicate_exception",
      contract_match_state: "matched_duplicate_line",
      commitment_amount: "0",
      accrual_adjustment_flag: "false",
      reason_code: "duplicate_invoice_line",
      approver_role: "AP operations manager",
      ap_processing_state: "paid_pending_supplier_credit",
    },
  ];
}

function rateCardRows(contractId) {
  return [1, 2].map((sequence) => ({
    source_system: "SAP Fieldglass",
    source_module: "Rate Card",
    source_object: "work_order_rate_line",
    source_record_id: `FG-RATE-${contractId}-${sequence}`,
    source_record_url_or_path: "fieldglass:/rate-card/work-orders",
    contract_id: contractId,
    sow_id: `SOW-${contractId}-DATA`,
    work_order_id: `WO-${contractId}-${sequence}`,
    role: "Cloud data engineer",
    role_title: "Senior cloud data engineer",
    level: "senior",
    location: sequence === 1 ? "US" : "Nearshore",
    rate_card_id: `RC-${contractId}-2027`,
    rate_effective_start: "2027-01-01",
    rate_effective_end: "2027-12-31",
    worker_ref: `worker-ref-${sequence}`,
    bill_rate: "195",
    billed_rate: "195",
    approved_rate: "175",
    currency: "USD",
    hours: "10250",
    utilization: "0.87",
    blended_rate: "195",
    onshore_offshore_mix: sequence === 1 ? "70/30" : "60/40",
    variance: "205000",
    approval_state: "variance_unapproved",
    reason_code: "rate_card_amendment_missing",
    change_order_id: `CO-${contractId}-RATE-${sequence}`,
    rate_card_amendment_exists: "false",
  }));
}

function usageRows(contractId) {
  return [
    ["Unused premium analytics seats", "720", "410", "720", "540000"],
    ["Retiring duplicate reporting workspace", "940", "510", "940", "710000"],
    ["Renewal uplift exposure pool", "420", "235", "420", "330000"],
  ].map(([productName, assigned, active, paid, cost], index) => ({
    source_system: "Microsoft Entra ID",
    source_module: "SaaS Usage",
    source_object: "monthly_saas_usage",
    source_record_id: `ENTRA-USAGE-${contractId}-${index + 1}`,
    source_record_url_or_path: "entra:/enterprise-applications/usage",
    tool_id: `TOOL-${contractId}-${index + 1}`,
    product_id: `PROD-${contractId}-${index + 1}`,
    product_name: productName,
    sku_id: `SKU-${contractId}-${index + 1}`,
    contract_id: contractId,
    vendor_id: "VND-MICROSOFT",
    tenant_subscription_workspace_id: `TENANT-WORKSPACE-${index + 1}`,
    function_ref: "FUNC-IT-DATA",
    team_ref: "TEAM-DATA-PLATFORM",
    assigned_seats: assigned,
    active_users: active,
    inactive_users: String(Number(assigned) - Number(active)),
    paid_seats: paid,
    overage_seats: "0",
    usage_metric_name: "monthly_active_users",
    usage_count: active,
    last_activity_band: "31-90 days",
    month: `2027-0${index + 4}-01`,
    period_start: `2027-0${index + 4}-01`,
    period_end: `2027-0${index + 4}-28`,
    unit_cost: String(Math.round(Number(cost) / Math.max(1, Number(paid)))),
    committed_amount: cost,
    actual_cost: cost,
    allocation_basis: "assigned_seat_cost",
    renewal_true_up_linkage: "renewal_baseline",
    recoverability_state: "recoverable_after_owner_review",
    usage_evidence_state: "system_evidenced",
    baseline_metric_state: "baseline_present",
    finance_validation_state: "not_validated",
    claimable_value_state: "claimable",
  }));
}

function sourcingRows(contractId) {
  return [
    {
      source_system: "SAP Ariba",
      source_module: "Sourcing",
      source_object: "supplier_offer_line",
      source_record_id: `ARIBA-BAFO-${contractId}-001`,
      source_record_url_or_path: "ariba:/sourcing/events/bafo-lines",
      event_id: `EVT-${contractId}-OPT-2027`,
      event_type: "incumbent_optimization",
      stage: "BAFO",
      round: "2",
      lot_package: "Data platform optimization package",
      requirement_id: `REQ-${contractId}-COMMERCIAL-01`,
      scoring_weight: "0.35",
      supplier_id: "SUP-MICROSOFT",
      vendor_id: "VND-MICROSOFT",
      response_id: `RESP-${contractId}-BAFO`,
      response_status: "submitted",
      submitted_timestamp: "2027-06-24T15:35:00Z",
      bafo_marker: "true",
      commercial_line_item: "Renewal price concession and index-cap package",
      unit: "annual",
      volume_assumption: "current run-rate",
      price: "34900000",
      transition_cost: "0",
      optional_excluded_cost: "0",
      technical_score: "88",
      commercial_score: "94",
      risk_score: "76",
      score: "89",
      evaluator_role: "Strategic sourcing lead",
      exception_type: "",
      clarification_state: "closed",
      normalized_cost: "36000000",
      line_item_cost: "34900000",
      comparability_flag: "comparable",
      unresolved_gap_reason: "",
    },
  ];
}

async function verifyContract(client, args) {
  const result = await client.query(
    `SELECT tenant_key, contract_id, vendor_ref, vendor_name, annual_value
       FROM source.contract_360
      WHERE tenant_key = ANY($1::text[]) AND contract_id = $2
      LIMIT 1`,
    [tenantAliases(args.tenantKey), args.contractId],
  );
  if (!result.rows[0]) {
    throw new Error(
      `Contract ${args.contractId} was not found in source.contract_360 for ${args.tenantKey}`,
    );
  }
  return result.rows[0];
}

async function upsertTowerClaim(client, args, contract) {
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.metric_definition (
       metric_ref, domain, label, description, value_type, unit, aggregation_rule,
       directionality, formula_version, freshness_days, required_sample_size, claim_gate_rule
     )
     VALUES (
       'value.claimable_amount', 'value', 'Claimable value amount',
       'Value that passed deterministic claim gates.', 'numeric', 'usd', 'sum',
       'higher_is_better', 'tower_claim_rule_v1', 90, null, 'all_gates_required'
     )
     ON CONFLICT (metric_ref) DO UPDATE SET
       label = excluded.label,
       description = excluded.description,
       active = true`,
  );
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.tracked_subject (
       subject_ref, tenant_key, subject_kind, title, vendor_ref, contract_ref, owner_role, metadata_json
     )
     VALUES ($1, $2, 'contract', $3, $4, $1, 'Strategic sourcing lead', $5::jsonb)
     ON CONFLICT (tenant_key, subject_ref) DO UPDATE SET
       title = excluded.title,
       vendor_ref = excluded.vendor_ref,
       contract_ref = excluded.contract_ref,
       metadata_json = excluded.metadata_json`,
    [
      args.contractId,
      args.tenantKey,
      `${contract.vendor_name || "Selected vendor"} contract optimization canary`,
      contract.vendor_ref || null,
      JSON.stringify({
        dataset_id: args.datasetId,
        dataset_version: DATASET_VERSION,
        synthetic_canary: true,
      }),
    ],
  );
  const claimInputHash = sha256(
    JSON.stringify({
      contract_id: args.contractId,
      dataset_id: args.datasetId,
      realized_value: EXPECTED.realizedValue,
      source_thread_id: SOURCE_THREAD_ID,
    }),
  );
  await client.query(
    `INSERT INTO ${quoteIdent(TOWER_SCHEMA)}.value_claim (
       claim_id, tenant_key, subject_ref, outcome_metric_ref, promised_value,
       calculated_value, currency, attribution_basis, quality_guardrail_state,
       risk_guardrail_state, claim_state, claim_rule_version, claim_input_hash,
       caveat, blocked_reason, next_gate, next_gate_owner_role, evaluated_at
     )
     VALUES (
       $1, $2, $3, 'value.claimable_amount', $4, $5, 'USD', $6,
       'finance_validated', 'pass', 'finance_validated',
       'source_contract_optimization_golden_v1', $7, $8, null, null, null, now()
     )
     ON CONFLICT (tenant_key, claim_id) DO UPDATE SET
       subject_ref = excluded.subject_ref,
       promised_value = excluded.promised_value,
       calculated_value = excluded.calculated_value,
       attribution_basis = excluded.attribution_basis,
       quality_guardrail_state = excluded.quality_guardrail_state,
       risk_guardrail_state = excluded.risk_guardrail_state,
       claim_state = excluded.claim_state,
       claim_input_hash = excluded.claim_input_hash,
       caveat = excluded.caveat,
       blocked_reason = null,
       next_gate = null,
       next_gate_owner_role = null,
       evaluated_at = now()`,
    [
      `claim-source-contract-golden-${args.contractId.toLowerCase()}`,
      args.tenantKey,
      args.contractId,
      EXPECTED.negotiatedImprovement,
      EXPECTED.realizedValue,
      "Executed amendment, post-amendment AP invoice run-rate, recovered credits, and Finance/Tower attestation.",
      claimInputHash,
      "Synthetic canary evidence pack for product validation; not client fact.",
    ],
  );
}

async function reconcile(client, args) {
  const result = await client.query(
    `
    SELECT
      (SELECT COALESCE(SUM(credit_calculated::numeric - credit_claimed::numeric), 0)
         FROM ${quoteIdent(RAW_SCHEMA)}.servicenow_sla_monthly
        WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = $3) AS sla_unclaimed,
      (SELECT COALESCE(SUM(actual_spend::numeric), 0)
         FROM ${quoteIdent(RAW_SCHEMA)}.s4_vendor_invoice_lines
        WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = $3
          AND (matching_state = 'off_contract' OR matching_state ILIKE '%duplicate%')) AS invoice_exception,
      (SELECT COALESCE(SUM(variance::numeric), 0)
         FROM ${quoteIdent(RAW_SCHEMA)}.fieldglass_rate_card
        WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = $3
          AND approval_state = 'variance_unapproved') AS rate_variance,
      (SELECT COALESCE(SUM(actual_cost::numeric), 0)
         FROM ${quoteIdent(RAW_SCHEMA)}.entra_saas_usage_monthly
        WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = $3
          AND claimable_value_state = 'claimable') AS avoided_cost,
      (SELECT COALESCE(SUM(normalized_cost::numeric - line_item_cost::numeric), 0)
         FROM ${quoteIdent(RAW_SCHEMA)}.ariba_sourcing_events
        WHERE _tenant_key = $1 AND _dataset_id = $2 AND contract_id = $3) AS negotiated_improvement,
      (SELECT COALESCE(SUM(calculated_value), 0)
         FROM ${quoteIdent(TOWER_SCHEMA)}.value_claim
        WHERE tenant_key = $1 AND subject_ref = $3 AND claim_state = 'finance_validated') AS realized_value
    `,
    [args.tenantKey, args.datasetId, args.contractId],
  );
  const row = result.rows[0];
  const actual = {
    slaUnclaimed: Number(row.sla_unclaimed),
    invoiceException: Number(row.invoice_exception),
    rateVariance: Number(row.rate_variance),
    recoverableLeakage:
      Number(row.sla_unclaimed) +
      Number(row.invoice_exception) +
      Number(row.rate_variance),
    avoidedCost: Number(row.avoided_cost),
    negotiatedImprovement: Number(row.negotiated_improvement),
    realizedValue: Number(row.realized_value),
  };
  const failures = Object.entries(EXPECTED)
    .filter(([key, expected]) => actual[key] !== expected)
    .map(
      ([key, expected]) => `${key}: expected ${expected}, got ${actual[key]}`,
    );
  return { ...actual, passed: failures.length === 0, failures };
}

async function main() {
  const args = parseArgs();
  const plan = {
    event: "source_contract_golden_evidence_plan",
    apply: false,
    tenant_key: args.tenantKey,
    dataset_id: args.datasetId,
    dataset_version: DATASET_VERSION,
    contract_id: args.contractId,
    load_run_id: args.loadRunId,
    evidence_rows: {
      servicenow_sla_monthly: 12,
      s4_vendor_invoice_lines: 2,
      fieldglass_rate_card: 2,
      entra_saas_usage_monthly: 3,
      ariba_sourcing_events: 1,
      tower_value_claim: 1,
    },
    expected: EXPECTED,
    note: "Governed synthetic canary evidence; clearly marked synthetic and loaded through source-system-shaped raw tables.",
  };
  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  const client = new Client(
    postgresClientOptions(url, "source-golden-contract-evidence-load"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const contract = await verifyContract(client, args);
    await deleteAugmentationRows(client, args);
    const inserted = {
      servicenow_sla_monthly: await insertRawRows(
        client,
        args,
        "servicenow_sla_monthly",
        performanceRows(args.contractId),
      ),
      s4_vendor_invoice_lines: await insertRawRows(
        client,
        args,
        "s4_vendor_invoice_lines",
        invoiceRows(args.contractId),
      ),
      fieldglass_rate_card: await insertRawRows(
        client,
        args,
        "fieldglass_rate_card",
        rateCardRows(args.contractId),
      ),
      entra_saas_usage_monthly: await insertRawRows(
        client,
        args,
        "entra_saas_usage_monthly",
        usageRows(args.contractId),
      ),
      ariba_sourcing_events: await insertRawRows(
        client,
        args,
        "ariba_sourcing_events",
        sourcingRows(args.contractId),
      ),
    };
    await upsertTowerClaim(client, args, contract);
    const reconciliation = await reconcile(client, args);
    if (!reconciliation.passed) {
      throw new Error(
        `Golden evidence reconciliation failed: ${JSON.stringify(reconciliation)}`,
      );
    }
    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          ...plan,
          event: "source_contract_golden_evidence_loaded",
          apply: true,
          contract,
          inserted,
          reconciliation,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
