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

async function refreshViews(client: Client): Promise<void> {
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
      cs.scope_ref AS it_portfolio_ref
    FROM source.contract_scope cs
    LEFT JOIN source.contract c
      ON c.tenant_key = cs.tenant_key
     AND c.contract_id = cs.contract_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id`);
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
    source_contract_360: await tableCount(client, "source.contract_360", args.tenants),
    source_vendor_contract_portfolio: await tableCount(client, "source.vendor_contract_portfolio", args.tenants),
    source_contract_application_scope: await tableCount(client, "source.contract_application_scope", args.tenants),
    consumption_sourcing_contract_v1: await tableCount(client, "consumption.sourcing_contract_v1", args.tenants),
    consumption_sourcing_vendor_v1: await tableCount(client, "consumption.sourcing_vendor_v1", args.tenants),
    consumption_sourcing_contract_scope_v1: await tableCount(client, "consumption.sourcing_contract_scope_v1", args.tenants),
    consumption_sourcing_spend_monthly_v1: await tableCount(client, "consumption.sourcing_spend_monthly_v1", args.tenants),
    consumption_sourcing_opportunity_v1: await tableCount(client, "consumption.sourcing_opportunity_v1", args.tenants),
  };
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
        await refreshViews(client as Client);
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
      "consumption.sourcing_contract_scope_v1",
      "consumption.sourcing_spend_monthly_v1",
      "consumption.sourcing_opportunity_v1",
    ],
    cubeHierarchyCoverage: {
      vendor_portfolio: "consumption.sourcing_vendor_v1",
      contract_portfolio: "consumption.sourcing_contract_v1",
      renewal_calendar: "consumption.sourcing_contract_v1",
      scope_confidence: "consumption.sourcing_contract_scope_v1",
      spend_consumption: "consumption.sourcing_spend_monthly_v1",
      opportunity_pipeline: "consumption.sourcing_opportunity_v1",
    },
    caveat:
      "This refresh updates governed Source L4 read models and Cube-facing consumption views. Source V4 canary/raw-source-only slices remain separately reported until retired or reprojected.",
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
