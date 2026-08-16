#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

import {
  buildCanonicalTenantDataReport,
  type CanonicalDataBuildReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const APPROVED_TENANTS = new Set(["meridian-health", "skyharbor-air"]);
const DEFAULT_TENANTS = ["meridian-health", "skyharbor-air"];
const CONTRACT_VERSION = "enterprise-intelligence-template-pack-v6-runtime-baseline";
const DEFAULT_OUT_DIR = "reports/source-l4-cube-refresh/latest";
const AS_OF_DATE = "2027-06-30";
const TRUE_VALUES = new Set(["1", "true", "yes"]);

type Attr = { value?: unknown };
type RecordLike = Pick<
  CanonicalIngestionRecord,
  "tenantKey" | "objectType" | "sourceObjectId" | "canonicalObjectKey" | "attributes" | "qualityStatus"
>;
type Row = Record<string, unknown>;

type Args = {
  tenants: string[];
  outDir: string;
  buildVersion: string;
  inputSourceVersion: string;
  idempotencyKey: string;
  write: boolean;
  readbackOnly: boolean;
  fromDb: boolean;
  emitProofBundle: boolean;
};

function parseArgs(argv: readonly string[]): Args {
  const tenants: string[] = [];
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    return value && !value.startsWith("--") ? value : undefined;
  };
  const envValue = (name: string): string | undefined => {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
  };
  const envFlag = (name: string): boolean =>
    TRUE_VALUES.has(String(process.env[name] ?? "").trim().toLowerCase());
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--tenant") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--tenant requires a value");
      tenants.push(value);
      index += 1;
    }
  }
  const envTenants = String(process.env.SOURCE_L4_CUBE_TENANTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    tenants: tenants.length > 0 ? tenants : envTenants.length > 0 ? envTenants : DEFAULT_TENANTS,
    outDir: get("--out-dir") ?? envValue("SOURCE_L4_CUBE_OUT_DIR") ?? DEFAULT_OUT_DIR,
    buildVersion:
      get("--build-version") ??
      envValue("SOURCE_L4_CUBE_BUILD_VERSION") ??
      `source-l4-cube-refresh-${new Date().toISOString().slice(0, 10)}`,
    inputSourceVersion:
      get("--input-source-version") ?? envValue("SOURCE_L4_CUBE_INPUT_SOURCE_VERSION") ?? gitSha(),
    idempotencyKey:
      get("--idempotency-key") ??
      envValue("SOURCE_L4_CUBE_IDEMPOTENCY_KEY") ??
      `source-l4-cube-refresh:${gitSha()}:${Date.now()}`,
    write: argv.includes("--write") || envFlag("SOURCE_L4_CUBE_WRITE"),
    readbackOnly: argv.includes("--readback-only") || envFlag("SOURCE_L4_CUBE_READBACK_ONLY"),
    fromDb: argv.includes("--from-db") || envFlag("SOURCE_L4_CUBE_FROM_DB"),
    emitProofBundle: argv.includes("--emit-proof-bundle") || envFlag("SOURCE_L4_CUBE_EMIT_PROOF_BUNDLE"),
  };
}

function assertScope(tenants: readonly string[]): void {
  const unique = new Set(tenants);
  if (unique.size !== tenants.length) throw new Error(`Duplicate tenant in scope: ${tenants.join(", ")}`);
  for (const tenant of tenants) {
    if (!APPROVED_TENANTS.has(tenant)) throw new Error(`Out-of-scope tenant refused: ${tenant}`);
  }
}

function gitSha(): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function databaseUrl(): string {
  const value =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.AZURE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL");
  return value;
}

function sha(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function slug(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function q(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function attr(record: RecordLike, name: string): unknown {
  return (record.attributes as Record<string, Attr>)[name]?.value;
}

function text(value: unknown): string | null {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join("; ") || null;
  const out = String(value ?? "").trim();
  return out ? out : null;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value: unknown): string | null {
  const out = text(value);
  return out && /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
}

function monthsBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const months = (ey - sy) * 12 + (em - sm);
  return Number.isFinite(months) && months > 0 ? months : null;
}

function confidence(value: unknown): number {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "high") return 0.9;
  if (normalized === "medium") return 0.78;
  if (normalized === "low") return 0.62;
  return 0.7;
}

function quality(record: RecordLike): string {
  if (record.qualityStatus === "quarantined") return "blocked";
  return "reviewed";
}

function contractIdFor(record: RecordLike): string {
  const explicit = text(attr(record, "contractId"));
  if (explicit) return explicit;
  return `CTR-${sha([record.tenantKey, attr(record, "vendorName"), attr(record, "contractName"), record.sourceObjectId].join("|")).slice(0, 10).toUpperCase()}`;
}

function vendorIdFor(record: RecordLike): string {
  const explicit = text(attr(record, "vendorId"));
  if (explicit) return explicit;
  const vendorName = text(attr(record, "vendorName")) ?? text(attr(record, "displayName")) ?? "vendor";
  return `VEN-${sha([record.tenantKey, vendorName].join("|")).slice(0, 10)}`;
}

function buildProjection(records: RecordLike[], args: Args): Record<string, Row[]> {
  const accepted = records.filter((record) => record.qualityStatus !== "quarantined");
  const contracts = accepted.filter((record) => record.objectType === "vendor_contract");
  const apps = accepted.filter((record) => record.objectType === "application_system");
  const appsByTenantName = new Map(apps.map((record) => [`${record.tenantKey}:${text(attr(record, "systemName"))}`, record]));
  const vendorByKey = new Map<string, Row>();
  const contractRows: Row[] = [];
  const scopeRows: Row[] = [];
  const consumptionRows: Row[] = [];
  const opportunityRows: Row[] = [];

  for (const record of contracts) {
    const tenant = record.tenantKey;
    const vendorName = text(attr(record, "vendorName")) ?? text(attr(record, "displayName")) ?? "Unknown vendor";
    const contractName = text(attr(record, "contractName")) ?? `${vendorName} agreement`;
    const vendorId = vendorIdFor(record);
    const contractId = contractIdFor(record);
    const annualSpend = num(attr(record, "annualSpendUsd"));
    const start = date(attr(record, "termStart"));
    const end = date(attr(record, "termEnd"));
    const months = monthsBetween(start, end);
    const totalCommitted = annualSpend == null ? null : Number((annualSpend * ((months ?? 12) / 12)).toFixed(2));
    const load = args.buildVersion;
    const basePayload = {
      l3BuildVersion: args.buildVersion,
      l3InputSourceVersion: args.inputSourceVersion,
      l3IdempotencyKey: args.idempotencyKey,
      sourceObjectId: record.sourceObjectId,
      canonicalObjectKey: record.canonicalObjectKey,
    };
    vendorByKey.set(`${tenant}:${vendorId}`, {
      tenant_key: tenant,
      vendor_id: vendorId,
      legal_name: vendorName,
      parent_company: vendorName,
      supplier_category: text(attr(record, "serviceCategory")),
      strategic_status: "synthetic_demo_reviewed",
      country: "US",
      region: "North America",
      diversity_status: null,
      risk_tier: text(attr(record, "riskRating")),
      financial_health_status: null,
      security_risk_status: text(attr(record, "riskRating")),
      relationship_owner_role: text(attr(record, "businessOwner")),
      active_state: "active",
      source_system: "intelligence_v6.business_records",
      source_record_id: record.sourceObjectId,
      as_of_date: date(attr(record, "sourceDate")) ?? AS_OF_DATE,
      confidence: confidence(attr(record, "confidence")),
      quality_state: quality(record),
      evidence_reference: text(attr(record, "sourcePath")) ?? text(attr(record, "sourceFile")),
      load_run_id: load,
      raw_payload: { ...basePayload, objectType: record.objectType },
    });
    contractRows.push({
      tenant_key: tenant,
      contract_id: contractId,
      vendor_id: vendorId,
      contract_name: contractName,
      agreement_type: text(attr(record, "commercialModel")),
      effective_date: start,
      expiration_date: end,
      notice_deadline: date(attr(record, "renewalDate")),
      renewal_type: text(attr(record, "commercialModel")),
      auto_renew: false,
      term_length_months: months,
      annual_value: annualSpend,
      total_committed_value: totalCommitted,
      currency: "USD",
      payment_terms: text(attr(record, "commercialModel")),
      benchmark_rights: text(attr(record, "renegotiationLevers")),
      termination_rights: null,
      price_uplift_terms: null,
      minimum_commitment: null,
      service_credit_cap: null,
      exit_assistance_terms: text(attr(record, "contractTermsDetail")),
      renewal_owner_role: text(attr(record, "contractOwner")),
      parent_contract_id: null,
      document_file_id: null,
      source_system: "intelligence_v6.business_records",
      source_record_id: record.sourceObjectId,
      as_of_date: date(attr(record, "sourceDate")) ?? AS_OF_DATE,
      confidence: confidence(attr(record, "confidence")),
      quality_state: quality(record),
      evidence_reference: text(attr(record, "sourcePath")) ?? text(attr(record, "sourceFile")),
      load_run_id: load,
      raw_payload: { ...basePayload, vendorName, supportedSystems: list(attr(record, "supportedSystems")) },
    });
    consumptionRows.push({
      tenant_key: tenant,
      observation_id: `${contractId}:annual-spend:${sha(record.sourceObjectId).slice(0, 8)}`,
      contract_id: contractId,
      service_id: null,
      business_unit: text(attr(record, "supportedFunctions")),
      cost_center: text(attr(record, "businessOwner")),
      period_start: `${AS_OF_DATE.slice(0, 4)}-01-01`,
      period_end: AS_OF_DATE,
      committed_amount: annualSpend,
      invoice_amount: annualSpend,
      paid_amount: null,
      actual_spend: annualSpend,
      consumed_quantity: null,
      consumed_unit: null,
      overage_amount: null,
      service_credit_amount: null,
      currency: "USD",
      source_system: "intelligence_v6.business_records",
      source_record_id: record.sourceObjectId,
      as_of_date: date(attr(record, "sourceDate")) ?? AS_OF_DATE,
      confidence: confidence(attr(record, "confidence")),
      quality_state: quality(record),
      evidence_reference: text(attr(record, "sourcePath")) ?? text(attr(record, "sourceFile")),
      load_run_id: load,
      raw_payload: { ...basePayload, annualSpendUsd: annualSpend },
    });
    const risk = String(text(attr(record, "riskRating")) ?? "").toLowerCase();
    if (risk === "high" || risk === "medium") {
      opportunityRows.push({
        tenant_key: tenant,
        opportunity_id: `${contractId}:renewal-evidence-review`,
        opportunity_type: "renewal_evidence_review",
        vendor_id: vendorId,
        contract_id: contractId,
        event_id: `${contractId}:source-l4-refresh`,
        title: `Review renewal and evidence posture for ${vendorName}`,
        finding_summary: text(attr(record, "knownGaps")) ?? "Planning-grade evidence requires review before client-facing value claims.",
        deterministic_basis: "Derived from Layer 3 vendor_contract risk and known_gaps; no realized-value claim.",
        value_low: null,
        value_high: null,
        currency: "USD",
        timing_window: date(attr(record, "renewalDate")) ?? "next renewal",
        confidence: confidence(attr(record, "confidence")),
        quality_state: "reviewed",
        recommended_action: "prepare evidence review before action",
        accountable_role: text(attr(record, "contractOwner")),
        evidence_reference: text(attr(record, "sourcePath")) ?? text(attr(record, "sourceFile")),
        missing_context: text(attr(record, "knownGaps")),
        as_of_date: date(attr(record, "sourceDate")) ?? AS_OF_DATE,
        load_run_id: load,
        raw_payload: { ...basePayload, riskRating: text(attr(record, "riskRating")) },
      });
    }
    for (const systemName of list(attr(record, "supportedSystems"))) {
      if (/^\(?no\s+/i.test(systemName)) continue;
      const app = appsByTenantName.get(`${tenant}:${systemName}`);
      scopeRows.push({
        tenant_key: tenant,
        contract_scope_id: `${contractId}:application:${sha(systemName).slice(0, 12)}`,
        contract_id: contractId,
        scope_type: "application",
        scope_ref: app ? `APP-${sha(`${tenant}:${systemName}`).slice(0, 10)}` : slug(systemName),
        scope_name: systemName,
        service_id: null,
        relationship_method: app ? "explicit_contract_scope" : "name_based_inference",
        relationship_confidence: app ? 0.9 : 0.62,
        effective_from: start,
        effective_to: end,
        criticality: app ? text(attr(app, "criticality")) : null,
        source_system: "intelligence_v6.business_records",
        source_record_id: `${record.sourceObjectId}:${systemName}`,
        as_of_date: date(attr(record, "sourceDate")) ?? AS_OF_DATE,
        quality_state: app ? "reviewed" : "partial",
        evidence_reference: text(attr(record, "sourcePath")) ?? text(attr(record, "sourceFile")),
        load_run_id: load,
        raw_payload: {
          ...basePayload,
          business_function: app ? text(attr(app, "businessFunction")) : text(attr(record, "supportedFunctions")),
          lifecycle_state: app ? text(attr(app, "lifecycleState")) : null,
          hosting_model: app ? text(attr(app, "deploymentModel")) : null,
          annual_run_cost: null,
          modernization_plan: app ? text(attr(app, "knownUpgradesPlanNarrative")) : null,
          known_pain_risk: app ? text(attr(app, "knownChallengesNarrative")) : null,
        },
      });
    }
  }

  return {
    vendor: [...vendorByKey.values()],
    contract: contractRows,
    contract_scope: scopeRows,
    contract_consumption_observation: consumptionRows,
    sourcing_opportunity: opportunityRows,
  };
}

async function recordsFromLocal(args: Args): Promise<RecordLike[]> {
  const report: CanonicalDataBuildReport = await buildCanonicalTenantDataReport({
    repoRoot: path.resolve(__dirname, "../.."),
    tenantKeys: args.tenants,
  });
  return report.canonicalRecords;
}

async function recordsFromDb(client: Client, args: Args): Promise<RecordLike[]> {
  const result = await client.query(
    `SELECT
       tenant_key AS "tenantKey",
       object_type AS "objectType",
       source_object_id AS "sourceObjectId",
       canonical_object_key AS "canonicalObjectKey",
       attributes,
       quality_status AS "qualityStatus"
     FROM intelligence_v6.business_records
     WHERE tenant_key = ANY($1::text[])
       AND contract_version = $2
       AND build_version = $3
       AND input_source_version = $4
       AND idempotency_key = $5`,
    [args.tenants, CONTRACT_VERSION, args.buildVersion, args.inputSourceVersion, args.idempotencyKey],
  );
  return result.rows;
}

async function upsertRows(client: Client, table: string, rows: Row[], conflict: string[]): Promise<number> {
  if (rows.length === 0) return 0;
  const columns = Object.keys(rows[0]);
  let written = 0;
  for (const row of rows) {
    const values = columns.map((column) =>
      column === "raw_payload" ? JSON.stringify(row[column] ?? {}) : row[column] ?? null,
    );
    const updateColumns = columns.filter((column) => !conflict.includes(column));
    await client.query(
      `INSERT INTO source.${q(table)} (${columns.map(q).join(",")})
       VALUES (${columns.map((_, index) => `$${index + 1}`).join(",")})
       ON CONFLICT (${conflict.map(q).join(",")})
       DO UPDATE SET ${updateColumns.map((column) => `${q(column)}=EXCLUDED.${q(column)}`).join(",")}`,
      values,
    );
    written += 1;
  }
  return written;
}

async function refreshViews(client: Client, args: Args): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS source.l4_cube_active_load_run (
      tenant_key TEXT PRIMARY KEY,
      load_run_id TEXT NOT NULL,
      input_source_version TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb
    )`);

  for (const tenant of args.tenants) {
    await client.query(
      `INSERT INTO source.l4_cube_active_load_run
         (tenant_key, load_run_id, input_source_version, idempotency_key, raw_payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (tenant_key)
       DO UPDATE SET
         load_run_id = EXCLUDED.load_run_id,
         input_source_version = EXCLUDED.input_source_version,
         idempotency_key = EXCLUDED.idempotency_key,
         activated_at = now(),
         raw_payload = EXCLUDED.raw_payload`,
      [
        tenant,
        args.buildVersion,
        args.inputSourceVersion,
        args.idempotencyKey,
        JSON.stringify({ projection: "source-l4-cube", contractVersion: CONTRACT_VERSION }),
      ],
    );
  }

  await client.query(`
    DROP VIEW IF EXISTS consumption.sourcing_context_coverage_v1;
    DROP VIEW IF EXISTS consumption.sourcing_vendor_semantic_v1;
    DROP VIEW IF EXISTS consumption.sourcing_event_supplier_v1;
    DROP VIEW IF EXISTS consumption.sourcing_event_v1;
    DROP VIEW IF EXISTS consumption.sourcing_opportunity_v1;
    DROP VIEW IF EXISTS consumption.sourcing_performance_v1;
    DROP VIEW IF EXISTS consumption.sourcing_spend_monthly_v1;
    DROP VIEW IF EXISTS consumption.sourcing_contract_scope_v1;
    DROP VIEW IF EXISTS consumption.sourcing_contract_v1;
    DROP VIEW IF EXISTS consumption.sourcing_vendor_v1;
    DROP VIEW IF EXISTS source.contract_360;
    DROP VIEW IF EXISTS source.vendor_contract_portfolio;
    DROP VIEW IF EXISTS source.contract_vendor_360`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_application_scope AS
    SELECT
      cs.tenant_key,
      cs.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      COALESCE(cs.scope_ref, cs.scope_name) AS application_ref,
      cs.scope_name AS application_name,
      cs.raw_payload->>'business_function' AS business_function,
      NULL::text AS function_ref,
      cs.criticality,
      cs.raw_payload->>'lifecycle_state' AS lifecycle_state,
      cs.raw_payload->>'hosting_model' AS hosting_model,
      NULLIF(cs.raw_payload->>'annual_run_cost', '')::numeric AS annual_run_cost,
      cs.raw_payload->>'modernization_plan' AS modernization_plan,
      NULL::text AS sla_tier,
      cs.raw_payload->>'known_pain_risk' AS known_pain_risk,
      cs.scope_ref AS it_portfolio_ref,
      cs.load_run_id
    FROM source.contract_scope cs
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = cs.tenant_key
     AND active.load_run_id = cs.load_run_id
    LEFT JOIN source.contract c
      ON c.tenant_key = cs.tenant_key
     AND c.contract_id = cs.contract_id
     AND c.load_run_id = cs.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
     AND v.load_run_id = c.load_run_id`);

  await client.query(`
    CREATE VIEW source.contract_vendor_360 AS
    SELECT
      c.tenant_key,
      c.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id, 'Unknown vendor') AS vendor_name,
      v.supplier_category AS vendor_category,
      c.contract_name,
      concat_ws(
        ' - ',
        NULLIF(c.agreement_type, ''),
        NULLIF(c.payment_terms, ''),
        NULLIF(c.benchmark_rights, ''),
        NULLIF(c.termination_rights, '')
      ) AS scope_summary,
      c.annual_value::numeric AS annual_value,
      c.total_committed_value::numeric AS total_committed_value,
      COALESCE(consumption.committed_annual_spend, c.annual_value) AS committed_annual_spend,
      COALESCE(consumption.actual_annual_spend, c.annual_value) AS actual_annual_spend,
      c.expiration_date AS end_date,
      CASE
        WHEN c.expiration_date IS NOT NULL AND c.notice_deadline IS NOT NULL
          THEN (c.expiration_date - c.notice_deadline)::numeric
        ELSE NULL::numeric
      END AS notice_period_days,
      c.auto_renew,
      c.renewal_type AS renewal_decision_state,
      c.renewal_owner_role AS renewal_owner_ref,
      c.benchmark_rights AS benchmarking_clause,
      concat_ws(
        ' - ',
        NULLIF(c.termination_rights, ''),
        NULLIF(c.exit_assistance_terms, '')
      ) AS exit_rights_summary,
      COALESCE(c.raw_payload ->> 'alternatives_available', NULL) AS alternatives_available,
      COALESCE(v.risk_tier, v.strategic_status) AS concentration_note,
      c.confidence::text AS source_confidence,
      c.annual_value::numeric AS resolved_annual_value,
      false AS annual_value_conflict_flag,
      c.total_committed_value::numeric AS resolved_total_committed_value,
      false AS total_committed_value_conflict_flag,
      c.load_run_id
    FROM source.contract c
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = c.tenant_key
     AND active.load_run_id = c.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
     AND v.load_run_id = c.load_run_id
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        sum(committed_amount)::numeric AS committed_annual_spend,
        sum(actual_spend)::numeric AS actual_annual_spend
      FROM source.contract_consumption_observation
      GROUP BY tenant_key, contract_id, load_run_id
    ) consumption
      ON consumption.tenant_key = c.tenant_key
     AND consumption.contract_id = c.contract_id
     AND consumption.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE VIEW source.vendor_contract_portfolio AS
    SELECT
      tenant_key,
      vendor_ref,
      vendor_name,
      vendor_category,
      count(*) AS contract_count,
      sum(annual_value) AS annual_value,
      sum(total_committed_value) AS total_committed_value,
      count(*) FILTER (WHERE auto_renew) AS auto_renew_contracts,
      min(end_date) AS next_end_date,
      array_agg(contract_id ORDER BY annual_value DESC NULLS LAST, contract_id) AS contract_refs,
      load_run_id
    FROM source.contract_vendor_360
    GROUP BY tenant_key, vendor_ref, vendor_name, vendor_category, load_run_id`);

  await client.query(`
    CREATE VIEW source.contract_360 AS
    SELECT
      c.*,
      COALESCE(app.scoped_application_count, 0) AS scoped_application_count,
      COALESCE(app.critical_application_count, 0) AS critical_application_count,
      0::numeric AS linked_budget_amount,
      0::numeric AS linked_actual_amount,
      0::bigint AS linked_budget_lines,
      COALESCE(perf.cloud_sev1_sev2_incidents, 0) AS cloud_sev1_sev2_incidents,
      perf.evidence_gap AS operational_evidence_gap,
      0::bigint AS initiative_dependency_count
    FROM source.contract_vendor_360 c
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        count(DISTINCT application_ref) AS scoped_application_count,
        count(DISTINCT application_ref) FILTER (
          WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
        ) AS critical_application_count
      FROM source.contract_application_scope
      GROUP BY tenant_key, contract_id, load_run_id
    ) app
      ON app.tenant_key = c.tenant_key
     AND app.contract_id = c.contract_id
     AND app.load_run_id = c.load_run_id
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        sum(breach_count)::int AS cloud_sev1_sev2_incidents,
        NULL::text AS evidence_gap
      FROM source.contract_performance_observation
      GROUP BY tenant_key, contract_id, load_run_id
    ) perf
      ON perf.tenant_key = c.tenant_key
     AND perf.contract_id = c.contract_id
     AND perf.load_run_id = c.load_run_id`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_vendor_v1 AS
    WITH contract_rollup AS (
      SELECT
        c.tenant_key,
        c.vendor_id,
        count(*)::bigint AS contract_count,
        sum(c.annual_value) AS annual_value,
        sum(c.total_committed_value) AS total_committed_value,
        count(*) FILTER (WHERE c.auto_renew)::bigint AS auto_renew_contracts,
        min(c.expiration_date) AS next_end_date,
        array_agg(c.contract_id ORDER BY c.annual_value DESC NULLS LAST, c.contract_id) AS contract_refs,
        max(c.load_run_id) AS load_run_id
      FROM source.contract c
      JOIN source.l4_cube_active_load_run active
        ON active.tenant_key = c.tenant_key
       AND active.load_run_id = c.load_run_id
      GROUP BY c.tenant_key, c.vendor_id
    ),
    base AS (
      SELECT
        r.tenant_key,
        r.vendor_id AS vendor_ref,
        r.vendor_id,
        COALESCE(v.legal_name, r.vendor_id) AS vendor_name,
        COALESCE(v.legal_name, r.vendor_id) AS legal_name,
        COALESCE(v.parent_company, v.legal_name, r.vendor_id) AS parent_vendor,
        v.supplier_category AS category,
        v.supplier_category,
        v.strategic_status,
        v.country,
        v.region,
        v.diversity_status,
        v.risk_tier,
        v.financial_health_status,
        v.security_risk_status,
        v.relationship_owner_role,
        r.contract_count,
        r.annual_value AS annual_contract_value,
        r.annual_value,
        r.total_committed_value,
        r.auto_renew_contracts,
        r.next_end_date,
        r.contract_refs,
        row_number() OVER (PARTITION BY r.tenant_key ORDER BY r.annual_value DESC NULLS LAST, COALESCE(v.legal_name, r.vendor_id)) AS vendor_rank,
        CASE
          WHEN sum(r.annual_value) OVER (PARTITION BY r.tenant_key) > 0
            THEN r.annual_value / sum(r.annual_value) OVER (PARTITION BY r.tenant_key)
          ELSE NULL
        END AS portfolio_share_pct,
        CASE
          WHEN sum(r.annual_value) OVER (PARTITION BY r.tenant_key) > 0
            THEN sum(r.annual_value) OVER (
              PARTITION BY r.tenant_key
              ORDER BY r.annual_value DESC NULLS LAST, COALESCE(v.legal_name, r.vendor_id)
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) / sum(r.annual_value) OVER (PARTITION BY r.tenant_key)
          ELSE NULL
        END AS cumulative_portfolio_share_pct,
        COALESCE(scope.critical_application_count, 0) AS critical_application_count,
        0::bigint AS lock_in_signal_count,
        COALESCE(v.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
        r.load_run_id AS knowledge_baseline_ref,
        'sourcing-consumption-v1'::text AS projection_contract_version,
        'accepted'::text AS authority_state,
        COALESCE(v.quality_state, 'reviewed') AS quality_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        r.load_run_id
      FROM contract_rollup r
      LEFT JOIN source.vendor v
        ON v.tenant_key = r.tenant_key
       AND v.vendor_id = r.vendor_id
       AND v.load_run_id = r.load_run_id
      LEFT JOIN (
        SELECT
          tenant_key,
          vendor_ref,
          count(DISTINCT application_ref) FILTER (
            WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
          ) AS critical_application_count
        FROM source.contract_application_scope
        GROUP BY tenant_key, vendor_ref
      ) scope
        ON scope.tenant_key = r.tenant_key
       AND scope.vendor_ref = r.vendor_id
    )
    SELECT
      tenant_key,
      vendor_ref,
      vendor_id,
      vendor_name,
      legal_name,
      parent_vendor,
      category,
      supplier_category,
      strategic_status,
      country,
      region,
      diversity_status,
      risk_tier,
      financial_health_status,
      security_risk_status,
      relationship_owner_role,
      contract_count,
      annual_contract_value,
      annual_value,
      total_committed_value,
      auto_renew_contracts,
      next_end_date,
      contract_refs,
      vendor_rank,
      portfolio_share_pct,
      cumulative_portfolio_share_pct,
      vendor_rank <= 5 AS top_5_flag,
      vendor_rank <= 10 AS top_10_flag,
      critical_application_count,
      lock_in_signal_count,
      as_of_date,
      knowledge_baseline_ref,
      projection_contract_version,
      authority_state,
      quality_state,
      freshness_state,
      availability_state,
      load_run_id
    FROM base
    WHERE source.can_read_sourcing_tenant(tenant_key)`);

  await client.query(`
    CREATE VIEW consumption.sourcing_vendor_semantic_v1 AS
    SELECT * FROM consumption.sourcing_vendor_v1;
    GRANT SELECT ON consumption.sourcing_vendor_semantic_v1 TO authenticated, service_role`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_contract_v1 AS
    SELECT
      c.tenant_key,
      c.contract_id AS contract_ref,
      c.contract_id,
      c.contract_name,
      c.vendor_id AS vendor_ref,
      c.vendor_id,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      v.supplier_category AS contract_category,
      c.agreement_type,
      c.renewal_type,
      CASE
        WHEN c.expiration_date IS NOT NULL AND c.expiration_date < DATE '${AS_OF_DATE}' THEN 'expired'
        ELSE 'active'
      END AS contract_state,
      c.renewal_type AS renewal_state,
      COALESCE(c.auto_renew, false) AS auto_renew,
      c.annual_value AS annual_contract_value,
      c.annual_value,
      COALESCE(consumption.actual_annual_spend, c.annual_value) AS actual_annual_spend,
      COALESCE(consumption.committed_annual_spend, c.annual_value) AS committed_annual_spend,
      c.total_committed_value,
      c.effective_date,
      c.expiration_date,
      c.notice_deadline,
      CASE WHEN c.notice_deadline IS NULL THEN NULL ELSE c.notice_deadline - DATE '${AS_OF_DATE}' END AS days_to_notice_deadline,
      CASE WHEN c.expiration_date IS NULL THEN NULL ELSE c.expiration_date - DATE '${AS_OF_DATE}' END AS days_to_contract_expiry,
      CASE
        WHEN c.notice_deadline IS NULL THEN 'unknown'
        WHEN c.notice_deadline < DATE '${AS_OF_DATE}' THEN 'passed_active'
        WHEN c.notice_deadline <= DATE '${AS_OF_DATE}' + 90 THEN 'within_90_days'
        WHEN c.notice_deadline <= DATE '${AS_OF_DATE}' + 180 THEN 'within_180_days'
        ELSE 'future'
      END AS notice_deadline_state,
      CASE
        WHEN c.expiration_date IS NULL THEN 'unknown'
        WHEN c.expiration_date <= DATE '${AS_OF_DATE}' + 90 THEN 'within_90_days'
        WHEN c.expiration_date <= DATE '${AS_OF_DATE}' + 180 THEN 'within_180_days'
        ELSE 'beyond_180_days'
      END AS renewal_urgency_state,
      COALESCE(c.benchmark_rights, '') <> '' AS benchmark_rights_present,
      CASE
        WHEN COALESCE(c.benchmark_rights, '') = '' THEN 'not_loaded'
        WHEN c.benchmark_rights ILIKE '%weak%' OR c.benchmark_rights ILIKE '%limited%' THEN 'weak'
        ELSE 'present'
      END AS benchmark_status,
      CASE
        WHEN COALESCE(c.raw_payload->>'alternatives_available', '') ILIKE '%limited%'
          OR COALESCE(c.raw_payload->>'alternatives_available', '') ILIKE '%none%'
          OR COALESCE(c.raw_payload->>'alternatives_available', '') = ''
          THEN 'limited'
        ELSE 'available'
      END AS alternatives_status,
      COALESCE(c.benchmark_rights, '') = ''
        OR c.benchmark_rights ILIKE '%weak%'
        OR c.benchmark_rights ILIKE '%limited%' AS weak_benchmark_flag,
      COALESCE(c.raw_payload->>'alternatives_available', '') ILIKE '%limited%'
        OR COALESCE(c.raw_payload->>'alternatives_available', '') ILIKE '%none%'
        OR COALESCE(c.raw_payload->>'alternatives_available', '') = '' AS limited_alternatives_flag,
      COALESCE(scope.scoped_application_count, 0) AS scoped_application_count,
      COALESCE(scope.critical_application_count, 0) AS critical_application_count,
      0::bigint AS modernization_dependency_count,
      COALESCE(scope.critical_application_count, 0) AS lock_in_signal_count,
      true AS portfolio_rollup_eligible,
      COALESCE(c.confidence, 0.9) AS confidence,
      c.currency,
      COALESCE(c.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      c.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      COALESCE(c.quality_state, 'reviewed') AS quality_state,
      'current'::text AS freshness_state,
      CASE WHEN c.annual_value IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      c.load_run_id
    FROM source.contract c
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = c.tenant_key
     AND active.load_run_id = c.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
     AND v.load_run_id = c.load_run_id
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        sum(committed_amount)::numeric AS committed_annual_spend,
        sum(actual_spend)::numeric AS actual_annual_spend
      FROM source.contract_consumption_observation
      GROUP BY tenant_key, contract_id, load_run_id
    ) consumption
      ON consumption.tenant_key = c.tenant_key
     AND consumption.contract_id = c.contract_id
     AND consumption.load_run_id = c.load_run_id
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        count(*)::bigint AS scoped_application_count,
        count(*) FILTER (WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical'))::bigint AS critical_application_count
      FROM source.contract_scope
      GROUP BY tenant_key, contract_id, load_run_id
    ) scope
      ON scope.tenant_key = c.tenant_key
     AND scope.contract_id = c.contract_id
     AND scope.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_contract_scope_v1 AS
    SELECT
      cs.tenant_key,
      cs.contract_scope_id AS scope_relationship_ref,
      cs.contract_scope_id,
      cs.contract_id AS contract_ref,
      cs.contract_id,
      c.vendor_id AS vendor_ref,
      c.vendor_id,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      cs.scope_type,
      cs.scope_ref,
      cs.scope_name,
      cs.raw_payload->>'business_function' AS business_function,
      NULL::text AS function_ref,
      cs.criticality,
      cs.raw_payload->>'lifecycle_state' AS lifecycle_state,
      cs.raw_payload->>'modernization_plan' AS modernization_plan,
      cs.relationship_method,
      cs.relationship_confidence,
      cs.criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical') AS critical_application_flag,
      COALESCE(cs.raw_payload->>'lifecycle_state', '') ILIKE '%retire%' AS retire_application_flag,
      COALESCE(cs.raw_payload->>'modernization_plan', '') ILIKE '%replace%' AS replace_application_flag,
      COALESCE(cs.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      cs.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      COALESCE(cs.quality_state, 'reviewed') AS quality_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      cs.load_run_id
    FROM source.contract_scope cs
    JOIN source.contract c
      ON c.tenant_key = cs.tenant_key
     AND c.contract_id = cs.contract_id
     AND c.load_run_id = cs.load_run_id
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = cs.tenant_key
     AND active.load_run_id = cs.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
     AND v.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(cs.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_spend_monthly_v1 AS
    SELECT
      o.tenant_key,
      o.observation_id,
      o.contract_id AS contract_ref,
      o.contract_id,
      o.service_id AS service_ref,
      o.service_id,
      o.business_unit,
      o.cost_center,
      NULL::text AS service_category,
      o.period_start AS month,
      o.committed_amount,
      o.invoice_amount,
      o.paid_amount,
      o.actual_spend,
      o.consumed_quantity AS consumed_amount,
      o.overage_amount,
      o.service_credit_amount AS credit_eligible_amount,
      o.service_credit_amount AS credit_recovered_amount,
      o.service_credit_amount,
      CASE WHEN o.committed_amount IS NOT NULL AND o.actual_spend IS NOT NULL THEN o.committed_amount - o.actual_spend ELSE NULL END AS unused_commitment_amount,
      CASE WHEN o.committed_amount IS NOT NULL AND o.committed_amount <> 0 AND o.actual_spend IS NOT NULL THEN o.actual_spend / o.committed_amount ELSE NULL END AS consumption_rate,
      CASE WHEN o.service_credit_amount IS NOT NULL AND o.service_credit_amount <> 0 THEN 1 ELSE NULL END AS credit_recovery_rate,
      1::int AS invoice_lines,
      'contract_matched'::text AS matching_state,
      o.currency,
      COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      o.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'current'::text AS freshness_state,
      CASE WHEN o.actual_spend IS NULL AND o.invoice_amount IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      o.load_run_id
    FROM source.contract_consumption_observation o
    JOIN source.contract c
      ON c.tenant_key = o.tenant_key
     AND c.contract_id = o.contract_id
     AND c.load_run_id = o.load_run_id
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = o.tenant_key
     AND active.load_run_id = o.load_run_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_performance_v1 AS
    SELECT
      o.tenant_key,
      o.observation_id,
      o.contract_id AS contract_ref,
      o.contract_id,
      o.service_id AS service_ref,
      o.service_id,
      o.metric_name AS metric_ref,
      o.metric_name,
      o.period_start AS period,
      o.period_start,
      o.period_end,
      o.unit,
      CASE WHEN COALESCE(o.breach_count, 0) > 0 THEN 'breached' WHEN o.actual_value IS NULL AND o.value_num IS NULL THEN 'not_loaded' ELSE 'met_or_unclassified' END AS performance_state,
      CASE WHEN COALESCE(o.credit_recovered, 0) > 0 THEN 'recovered' WHEN COALESCE(o.credit_claimed, 0) > 0 THEN 'claimed' WHEN COALESCE(o.credit_calculated, 0) > 0 THEN 'earned_unclaimed' ELSE 'none' END AS credit_state,
      CASE WHEN o.evidence_reference IS NULL OR o.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
      o.breach_count,
      o.credit_eligible,
      o.credit_calculated AS credit_eligible_amount,
      o.credit_calculated AS credit_calculated_amount,
      o.credit_calculated,
      o.credit_claimed AS credit_claimed_amount,
      o.credit_claimed,
      o.credit_recovered AS credit_recovered_amount,
      o.credit_recovered,
      o.currency,
      COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      o.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'current'::text AS freshness_state,
      CASE WHEN o.actual_value IS NULL AND o.value_num IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      o.load_run_id
    FROM source.contract_performance_observation o
    JOIN source.contract c
      ON c.tenant_key = o.tenant_key
     AND c.contract_id = o.contract_id
     AND c.load_run_id = o.load_run_id
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = o.tenant_key
     AND active.load_run_id = o.load_run_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
    SELECT
      o.tenant_key,
      o.opportunity_id AS opportunity_ref,
      o.opportunity_id,
      o.vendor_id AS vendor_ref,
      o.vendor_id,
      o.contract_id AS contract_ref,
      o.contract_id,
      o.event_id AS event_ref,
      o.event_id,
      o.opportunity_type AS action_type,
      o.opportunity_type,
      o.title,
      o.finding_summary,
      o.deterministic_basis,
      o.value_low,
      o.value_high,
      COALESCE(o.value_high, o.value_low) AS annual_value_exposed,
      COALESCE(o.value_low, 0) AS addressable_spend,
      CASE WHEN COALESCE(o.value_high, o.value_low, 0) >= 10000000 THEN 'high' WHEN COALESCE(o.value_high, o.value_low, 0) >= 1000000 THEN 'medium' ELSE 'low' END AS priority,
      o.confidence,
      CASE WHEN o.quality_state = 'accepted' AND o.confidence >= 0.75 THEN 'ready_to_act' WHEN o.quality_state IN ('missing_evidence', 'blocked') THEN 'evidence_blocked' ELSE 'review_required' END AS readiness_state,
      CASE WHEN o.evidence_reference IS NULL OR o.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
      o.recommended_action,
      o.accountable_role,
      NULL::date AS decision_due_date,
      o.opportunity_type AS finding_rule_ref,
      COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      o.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      o.quality_state AS authority_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      o.load_run_id
    FROM source.sourcing_opportunity o
    JOIN source.contract c
      ON c.tenant_key = o.tenant_key
     AND c.contract_id = o.contract_id
     AND c.load_run_id = o.load_run_id
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = o.tenant_key
     AND active.load_run_id = o.load_run_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_event_v1 AS
    SELECT
      e.tenant_key,
      e.event_id AS event_ref,
      e.event_id,
      e.event_id AS event_name,
      e.event_type,
      NULL::text AS category,
      e.business_outcome,
      e.event_status AS stage,
      e.event_status AS status,
      e.event_status,
      e.incumbent_contracts[1] AS incumbent_contract_ref,
      NULL::text AS incumbent_vendor_ref,
      e.decision_due_date AS target_decision_date,
      e.accountable_role AS event_owner_role,
      e.accountable_role,
      e.decision_due_date,
      COALESCE(NULLIF(e.baseline_volumes->>'estimated_annual_value', '')::numeric, 0) AS estimated_annual_value,
      COALESCE(NULLIF(e.raw_payload->>'requirement_count', '')::numeric, 0) AS requirement_count,
      COALESCE(NULLIF(e.raw_payload->>'invited_supplier_count', '')::numeric, 0) AS invited_supplier_count,
      COALESCE(NULLIF(e.raw_payload->>'response_count', '')::numeric, 0) AS response_count,
      COALESCE(NULLIF(e.raw_payload->>'qualified_supplier_count', '')::numeric, 0) AS qualified_supplier_count,
      COALESCE(NULLIF(e.raw_payload->>'evaluation_completion_pct', '')::numeric, 0) AS evaluation_completion_pct,
      COALESCE(NULLIF(e.raw_payload->>'commercial_normalization_completion_pct', '')::numeric, 0) AS commercial_normalization_completion_pct,
      CASE WHEN e.as_of_date IS NOT NULL THEN DATE '${AS_OF_DATE}' - e.as_of_date ELSE NULL END AS days_in_current_stage,
      COALESCE(e.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      e.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      e.quality_state AS authority_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      e.load_run_id,
      e.service_scope
    FROM source.sourcing_event e
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = e.tenant_key
     AND active.load_run_id = e.load_run_id
    WHERE source.can_read_sourcing_tenant(e.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_event_supplier_v1 AS
    SELECT
      s.tenant_key,
      s.event_supplier_id,
      s.event_id AS event_ref,
      s.event_id,
      s.vendor_id AS supplier_ref,
      s.vendor_id,
      s.supplier_name,
      s.response_status AS response_state,
      s.response_status,
      s.supplier_status AS qualification_state,
      s.supplier_status,
      s.recommendation AS recommendation_state,
      s.recommendation,
      COALESCE(s.raw_payload->>'bafo_state', 'not_started') AS bafo_state,
      COALESCE(NULLIF(s.commercial_normalization->>'normalized_annual_value', '')::numeric, 0) AS normalized_annual_value,
      COALESCE(NULLIF(s.commercial_normalization->>'normalized_total_contract_value', '')::numeric, 0) AS normalized_total_contract_value,
      s.weighted_score,
      COALESCE(NULLIF(s.raw_payload->>'commercial_score', '')::numeric, NULL) AS commercial_score,
      COALESCE(NULLIF(s.raw_payload->>'technical_score', '')::numeric, NULL) AS technical_score,
      s.risk_score,
      COALESCE(NULLIF(s.raw_payload->>'exception_count', '')::numeric, 0) AS exception_count,
      COALESCE(s.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      s.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      s.quality_state AS authority_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      s.load_run_id
    FROM source.sourcing_event_supplier s
    JOIN source.sourcing_event e
      ON e.tenant_key = s.tenant_key
     AND e.event_id = s.event_id
     AND e.load_run_id = s.load_run_id
    JOIN source.l4_cube_active_load_run active
      ON active.tenant_key = s.tenant_key
     AND active.load_run_id = s.load_run_id
    WHERE source.can_read_sourcing_tenant(s.tenant_key)`);

  await client.query(`
    CREATE VIEW consumption.sourcing_context_coverage_v1 AS
    SELECT tenant_key, 'contracts' AS context_area, count(*) AS row_count, count(*) FILTER (WHERE annual_contract_value IS NOT NULL) AS populated_count
    FROM consumption.sourcing_contract_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'contract_scope', count(*), count(*) FILTER (WHERE relationship_method <> 'unresolved')
    FROM consumption.sourcing_contract_scope_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'monthly_spend_consumption', count(*), count(*) FILTER (WHERE actual_spend IS NOT NULL OR invoice_amount IS NOT NULL)
    FROM consumption.sourcing_spend_monthly_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'performance_sla', count(*), count(*) FILTER (WHERE performance_state <> 'not_loaded')
    FROM consumption.sourcing_performance_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'opportunities', count(*), count(*) FILTER (WHERE evidence_state = 'present')
    FROM consumption.sourcing_opportunity_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'sourcing_events', count(*), count(*) FILTER (WHERE status IS NOT NULL)
    FROM consumption.sourcing_event_v1
    GROUP BY tenant_key`);

  await client.query(`
    GRANT SELECT ON
      consumption.sourcing_vendor_v1,
      consumption.sourcing_contract_v1,
      consumption.sourcing_contract_scope_v1,
      consumption.sourcing_spend_monthly_v1,
      consumption.sourcing_performance_v1,
      consumption.sourcing_opportunity_v1,
      consumption.sourcing_event_v1,
      consumption.sourcing_event_supplier_v1,
      consumption.sourcing_context_coverage_v1
    TO authenticated, service_role`);
}

async function tableCount(client: Client, table: string, tenants: string[], loadRunId?: string): Promise<number> {
  const loadPredicate = loadRunId ? "AND load_run_id = $2" : "";
  const params: unknown[] = loadRunId ? [tenants, loadRunId] : [tenants];
  const result = await client.query(
    `SELECT count(*)::int AS count FROM ${table} WHERE tenant_key = ANY($1::text[]) ${loadPredicate}`,
    params,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function tenantScopedTableCount(
  client: Client,
  table: string,
  tenants: string[],
  loadRunId?: string,
): Promise<number> {
  let total = 0;
  for (const tenant of tenants) {
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenant]);
    const loadPredicate = loadRunId ? "AND load_run_id = $2" : "";
    const params: unknown[] = loadRunId ? [tenant, loadRunId] : [tenant];
    const result = await client.query(
      `SELECT count(*)::int AS count FROM ${table} WHERE tenant_key = $1 ${loadPredicate}`,
      params,
    );
    total += Number(result.rows[0]?.count ?? 0);
  }
  await client.query("SELECT set_config('app.tenant_key', '', false)");
  return total;
}

async function readback(client: Client, args: Args): Promise<Record<string, number>> {
  return {
    source_vendor: await tableCount(client, "source.vendor", args.tenants, args.buildVersion),
    source_contract: await tableCount(client, "source.contract", args.tenants, args.buildVersion),
    source_contract_scope: await tableCount(client, "source.contract_scope", args.tenants, args.buildVersion),
    source_contract_consumption_observation: await tableCount(
      client,
      "source.contract_consumption_observation",
      args.tenants,
      args.buildVersion,
    ),
    source_sourcing_opportunity: await tableCount(client, "source.sourcing_opportunity", args.tenants, args.buildVersion),
    source_contract_performance_observation: await tableCount(
      client,
      "source.contract_performance_observation",
      args.tenants,
      args.buildVersion,
    ),
    source_sourcing_event: await tableCount(client, "source.sourcing_event", args.tenants, args.buildVersion),
    source_sourcing_event_supplier: await tableCount(
      client,
      "source.sourcing_event_supplier",
      args.tenants,
      args.buildVersion,
    ),
    source_contract_vendor_360: await tenantScopedTableCount(
      client,
      "source.contract_vendor_360",
      args.tenants,
      args.buildVersion,
    ),
    source_contract_360: await tenantScopedTableCount(
      client,
      "source.contract_360",
      args.tenants,
      args.buildVersion,
    ),
    source_vendor_contract_portfolio: await tenantScopedTableCount(
      client,
      "source.vendor_contract_portfolio",
      args.tenants,
      args.buildVersion,
    ),
    source_contract_application_scope: await tenantScopedTableCount(
      client,
      "source.contract_application_scope",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_contract_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_contract_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_vendor_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_vendor_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_vendor_semantic_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_vendor_semantic_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_contract_scope_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_contract_scope_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_spend_monthly_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_spend_monthly_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_performance_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_performance_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_opportunity_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_opportunity_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_event_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_event_v1",
      args.tenants,
      args.buildVersion,
    ),
    consumption_sourcing_event_supplier_v1: await tenantScopedTableCount(
      client,
      "consumption.sourcing_event_supplier_v1",
      args.tenants,
      args.buildVersion,
    ),
  };
}

function assertReadbackMatchesCurrentBuild(readbackRows: Record<string, number>): void {
  const expectedPairs: Array<[string, string]> = [
    ["source_vendor", "consumption_sourcing_vendor_v1"],
    ["source_vendor", "consumption_sourcing_vendor_semantic_v1"],
    ["source_vendor", "source_vendor_contract_portfolio"],
    ["source_contract", "consumption_sourcing_contract_v1"],
    ["source_contract", "source_contract_vendor_360"],
    ["source_contract", "source_contract_360"],
    ["source_contract_scope", "consumption_sourcing_contract_scope_v1"],
    ["source_contract_scope", "source_contract_application_scope"],
    ["source_contract_consumption_observation", "consumption_sourcing_spend_monthly_v1"],
    ["source_contract_performance_observation", "consumption_sourcing_performance_v1"],
    ["source_sourcing_opportunity", "consumption_sourcing_opportunity_v1"],
    ["source_sourcing_event", "consumption_sourcing_event_v1"],
    ["source_sourcing_event_supplier", "consumption_sourcing_event_supplier_v1"],
  ];
  const mismatches = expectedPairs
    .map(([sourceKey, consumptionKey]) => ({
      sourceKey,
      consumptionKey,
      sourceRows: readbackRows[sourceKey] ?? 0,
      consumptionRows: readbackRows[consumptionKey] ?? 0,
    }))
    .filter((row) => row.sourceRows !== row.consumptionRows);
  if (mismatches.length > 0) {
    throw new Error(`Cube readback does not match current build: ${JSON.stringify(mismatches)}`);
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath: string, summary: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    [
      "# Source L4 And Cube Refresh Proof",
      "",
      `- Status: ${summary.status}`,
      `- Mode: ${summary.mode}`,
      `- Git SHA: ${summary.gitSha}`,
      `- Build version: ${summary.buildVersion}`,
      `- Input source version: ${summary.inputSourceVersion}`,
      `- Tenant scope: ${(summary.tenantScope as string[]).join(", ")}`,
      `- Source contracts projected: ${(summary.projectedRows as Record<string, number>).contract}`,
      `- Source vendors projected: ${(summary.projectedRows as Record<string, number>).vendor}`,
      `- Contract scope rows projected: ${(summary.projectedRows as Record<string, number>).contract_scope}`,
      `- Product read models updated: ${summary.productReadModelsUpdated}`,
      `- Cube views verified: ${summary.cubeViewsVerified}`,
      "",
    ].join("\n"),
  );
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
  });
  if (tar.status !== 0) throw new Error(tar.stderr || "Proof bundle tar failed");
  console.log("__SOURCE_L4_CUBE_PROOF_TGZ_BEGIN__");
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log("__SOURCE_L4_CUBE_PROOF_TGZ_END__");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  assertScope(args.tenants);
  const outDir = path.resolve(path.resolve(__dirname, "../.."), args.outDir);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  let records: RecordLike[] = [];
  let projectedRows: Record<string, number> = {};
  const persistedRows: Record<string, number> = {};
  let readbackRows: Record<string, number> | null = null;

  const client =
    args.write || args.readbackOnly || args.fromDb
      ? new Client({ ...postgresClientOptions(databaseUrl(), "abarva-source-l4-cube-refresh") })
      : null;
  try {
    if (client) await client.connect();
    if (!args.readbackOnly) {
      records = args.write || args.fromDb ? await recordsFromDb(client as Client, args) : await recordsFromLocal(args);
      const projection = buildProjection(records, args);
      projectedRows = Object.fromEntries(Object.entries(projection).map(([table, rows]) => [table, rows.length]));
      writeJson(path.join(outDir, "projection-plan.json"), { projectedRows, tenants: args.tenants });
      if (args.write) {
        if (process.env.SOURCE_L4_CUBE_WRITE_APPROVED !== "true") {
          throw new Error("Refusing write: set SOURCE_L4_CUBE_WRITE_APPROVED=true in the governed ACA job.");
        }
        await (client as Client).query("BEGIN");
        await refreshViews(client as Client, args);
        const conflicts: Record<string, string[]> = {
          vendor: ["tenant_key", "vendor_id"],
          contract: ["tenant_key", "contract_id"],
          contract_scope: ["tenant_key", "contract_scope_id"],
          contract_consumption_observation: ["tenant_key", "observation_id"],
          sourcing_opportunity: ["tenant_key", "opportunity_id"],
        };
        for (const [table, rows] of Object.entries(projection)) {
          persistedRows[table] = await upsertRows(client as Client, table, rows, conflicts[table]);
        }
        await (client as Client).query("COMMIT");
      }
    }
    if (client && (args.write || args.readbackOnly)) {
      readbackRows = await readback(client, args);
      assertReadbackMatchesCurrentBuild(readbackRows);
    }
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    if (client) await client.end().catch(() => undefined);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    status: "pass",
    mode: args.write ? "write" : args.readbackOnly ? "readback" : "dry-run",
    gitSha: gitSha(),
    buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion,
    idempotencyKey: args.idempotencyKey,
    tenantScope: args.tenants,
    approvedScopeOnly: true,
    canonicalRecordsRead: records.length,
    projectedRows,
    persistedRows,
    readbackRows,
    productReadModelsUpdated: args.write,
    cubeViewsVerified: Boolean(readbackRows),
    cubeReadContracts: [
      "source.contract_360",
      "source.vendor_contract_portfolio",
      "source.contract_application_scope",
      "consumption.sourcing_contract_v1",
      "consumption.sourcing_vendor_v1",
      "consumption.sourcing_vendor_semantic_v1",
      "consumption.sourcing_contract_scope_v1",
      "consumption.sourcing_spend_monthly_v1",
      "consumption.sourcing_performance_v1",
      "consumption.sourcing_opportunity_v1",
      "consumption.sourcing_event_v1",
      "consumption.sourcing_event_supplier_v1",
    ],
    cubeHierarchyCoverage: {
      vendor_portfolio: "consumption.sourcing_vendor_v1",
      contract_portfolio: "consumption.sourcing_contract_v1",
      renewal_calendar: "consumption.sourcing_contract_v1",
      scope_confidence: "consumption.sourcing_contract_scope_v1",
      spend_consumption: "consumption.sourcing_spend_monthly_v1",
      service_credit_path: "consumption.sourcing_performance_v1",
      opportunity_pipeline: "consumption.sourcing_opportunity_v1",
      event_pipeline: "consumption.sourcing_event_v1",
      supplier_response_path: "consumption.sourcing_event_supplier_v1",
    },
    caveat:
      "This refresh updates governed Source L4 read models and Cube-facing consumption views for the active build only. Performance and event cubes are verified as current-build scoped; zero rows means the projector has not produced those facts for this build.",
  };
  writeJson(path.join(outDir, "summary.json"), summary);
  writeMarkdown(path.join(outDir, "summary.md"), summary);
  if (args.emitProofBundle) emitProofBundle(outDir);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
