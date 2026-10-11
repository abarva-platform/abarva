#!/usr/bin/env node

/** Read-only, redacted preflight for the Tower ECL serving path. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const MIGRATIONS = [
  "20260830190000_tower_serving_active_generation_join.sql",
  "20260830230000_tower_serving_page_key_split.sql",
  "20260830234500_tower_serving_remaining_lens_scope.sql",
  "20260831031000_ecl_substrate_baseline.sql",
];
export const FUNCTIONS = ["tower_ai_rows", "tower_command_rows", "tower_value_rows", "tower_evidence_rows"];
export const VIEWS = [
  "tower_command_center", "tower_value_proof", "tower_decision_lanes",
  "tower_evidence", "tower_recommended_actions", "tower_ai_portfolio",
  "tower_cost_lens", "tower_risk_lens", "tower_adoption_lens",
];

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(here, "../../supabase/migrations");
const stripComments = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");

export function functionPredicates(body, name) {
  const sql = stripComments(body ?? "").toLowerCase().replace(/\s+/g, " ");
  const activeJoin = /\bjoin\s+serving\.tower_active_assessment_keys\s*\(\s*\)\s+active\b/.test(sql)
    && ["tenant_key", "assessment_id", "projection_version"].every((key) =>
      new RegExp(`\\bactive\\.${key}\\s*=\\s*p\\.${key}\\b|\\bp\\.${key}\\s*=\\s*active\\.${key}\\b`).test(sql));
  const page = name === "tower_ai_rows"
    ? /\bcoalesce\s*\(\s*p\.display_payload_json\s*->>\s*'page_key'\s*,\s*'ai_portfolio'\s*\)\s*=\s*page_key_arg\b/.test(sql)
    : name === "tower_evidence_rows"
      ? /\bp\.page_key\s*=\s*page_key_arg\b/.test(sql)
      : /\bpage_key_arg\s*=\s*'all'\s+or\s+p\.page_key\s*=\s*page_key_arg\b/.test(sql);
  return { activeJoin, page };
}

export function migrationStatus(record, localHash) {
  if (!record) return "missing";
  if (!record.sha256) return "applied_unhashed";
  return record.sha256 === localHash ? "match" : "hash_mismatch";
}

export function anonymize(rows) {
  const tenants = [...new Set(rows.map((r) => r.tenant_key))].sort();
  const tenantMap = new Map(tenants.map((key, index) => [key, `tenant_${index + 1}`]));
  const assessments = new Map();
  for (const tenant of tenants) {
    const ids = [...new Set(rows.filter((r) => r.tenant_key === tenant).map((r) => r.assessment_id))]
      .filter((id) => id != null).sort();
    assessments.set(tenant, new Map(ids.map((id, index) => [id, `assessment_${index + 1}`])));
  }
  return (row) => `${tenantMap.get(row.tenant_key)}\t${assessments.get(row.tenant_key)?.get(row.assessment_id) ?? "none"}\tv${row.projection_version ?? "none"}`;
}

export async function inspect(client, localHashes) {
  const lines = [];
  const gaps = [];
  const records = [];
  const ledgerPresent = (await client.query("select to_regclass('schema_migrations') is not null as present")).rows[0]?.present === true;
  const ledgerHasHash = ledgerPresent && (await client.query(
    `select exists (select 1 from information_schema.columns
      where table_name = 'schema_migrations' and column_name = 'sha256'
        and table_schema = any(current_schemas(false))) as present`,
  )).rows[0]?.present === true;
  const ledger = ledgerPresent
    ? (await client.query(`select name, ${ledgerHasHash ? "sha256" : "null::text as sha256"}
         from schema_migrations where name = any($1::text[])`, [MIGRATIONS])).rows
    : [];
  if (!ledgerPresent) gaps.push("migration_ledger_absent");
  for (const name of MIGRATIONS) {
    const record = ledger.find((r) => r.name === name);
    const status = migrationStatus(record, localHashes[name]);
    lines.push(`MIGRATION\t${name}\t${status}\tlocal_sha256=${localHashes[name]}\tledger_sha256=${record?.sha256 ?? "none"}`);
    if (status !== "match") gaps.push(`migration_${status}:${name}`);
  }

  const definitions = (await client.query(
    `select p.proname, pg_get_functiondef(p.oid) as body
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'serving' and p.proname = any($1::text[])
        and pg_get_function_identity_arguments(p.oid) = 'surface_key_arg text, page_key_arg text'`,
    [FUNCTIONS],
  )).rows;
  for (const name of FUNCTIONS) {
    const body = definitions.find((r) => r.proname === name)?.body;
    const checks = functionPredicates(body, name);
    lines.push(`FUNCTION\t${name}\tpresent=${Boolean(body)}\tactive_join=${checks.activeJoin}\tpage_filter=${checks.page}`);
    if (!body || !checks.activeJoin || !checks.page) gaps.push(`function_predicate:${name}`);
  }

  const lifecyclePresent = (await client.query("select to_regclass('ecl_projection.tower_assessment_lifecycle') is not null as present")).rows[0]?.present === true;
  const lifecycle = lifecyclePresent
    ? (await client.query("select tenant_key, assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle")).rows
    : [];
  if (!lifecyclePresent) gaps.push("lifecycle_absent");
  const keysPresent = (await client.query("select to_regprocedure('serving.tower_active_assessment_keys()') is not null as present")).rows[0]?.present === true;
  const keys = keysPresent
    ? (await client.query("select tenant_key, assessment_id, projection_version from serving.tower_active_assessment_keys()")).rows
    : [];
  if (!keysPresent) gaps.push("active_keys_absent");

  const aiPresent = (await client.query("select to_regclass('ecl_projection.tower_ai_portfolio') is not null as present")).rows[0]?.present === true;
  const ai = aiPresent
    ? (await client.query(`select tenant_key, assessment_id, projection_version,
            coalesce(display_payload_json ->> 'page_key', 'ai_portfolio') as page_key,
            count(*)::int as rows from ecl_projection.tower_ai_portfolio
            group by tenant_key, assessment_id, projection_version, 4`)).rows
    : [];
  if (!aiPresent) gaps.push("ai_projection_absent");

  const viewCatalog = (await client.query(
    `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'serving' and c.relname = any($1::text[]) and c.relkind in ('v','m')`,
    [VIEWS],
  )).rows.map((r) => r.relname);
  const viewRows = [];
  for (const name of VIEWS) {
    if (!viewCatalog.includes(name)) {
      lines.push(`VIEW\t${name}\tmissing`);
      gaps.push(`view_absent:${name}`);
      continue;
    }
    const result = await client.query(`select tenant_key, assessment_id, projection_version, count(*)::int as rows
      from serving.${name} group by tenant_key, assessment_id, projection_version`);
    lines.push(`VIEW\t${name}\tpresent\tgroups=${result.rows.length}\trows=${result.rows.reduce((sum, row) => sum + Number(row.rows), 0)}`);
    viewRows.push(...result.rows.map((r) => ({ ...r, view: name })));
  }

  records.push(...lifecycle, ...keys, ...ai, ...viewRows);
  const label = anonymize(records);
  const tenants = [...new Set(records.map((r) => r.tenant_key))].sort();
  for (const tenant of tenants) {
    const declared = lifecycle.filter((r) => r.tenant_key === tenant && r.state === "active");
    const retired = lifecycle.filter((r) => r.tenant_key === tenant && r.state === "retired");
    const resolved = keys.filter((r) => r.tenant_key === tenant);
    const same = declared.length === 1 && resolved.length === 1
      && declared[0].assessment_id === resolved[0].assessment_id
      && Number(declared[0].projection_version) === Number(resolved[0].projection_version);
    const status = same ? "match" : declared.length === 0 && resolved.length === 1 ? "fallback" : "mismatch";
    const representative = resolved[0] ?? declared[0] ?? { tenant_key: tenant };
    lines.push(`ACTIVE\t${label(representative)}\tdeclared=${declared.length}\tretired=${retired.length}\tresolved=${resolved.length}\tstatus=${status}`);
    if (status !== "match") gaps.push(`active_${status}`);
  }
  for (const r of ai.sort(groupSort)) lines.push(`AI_PHYSICAL\t${label(r)}\tpage=${safePage(r.page_key)}\trows=${r.rows}`);
  for (const r of viewRows.sort(groupSort)) lines.push(`VIEW_ROWS\t${r.view}\t${label(r)}\trows=${r.rows}`);
  return { lines, gaps };
}

function groupSort(a, b) {
  return String(a.tenant_key).localeCompare(String(b.tenant_key))
    || String(a.assessment_id).localeCompare(String(b.assessment_id))
    || Number(a.projection_version) - Number(b.projection_version)
    || String(a.view ?? a.page_key).localeCompare(String(b.view ?? b.page_key));
}
function safePage(page) {
  return ["ai_portfolio", "adoption_lens"].includes(page) ? page : "other";
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const localHashes = Object.fromEntries(MIGRATIONS.map((name) => [name,
    createHash("sha256").update(readFileSync(path.join(migrationDir, name))).digest("hex")]));
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await inspect(client, localHashes);
    await client.query("COMMIT");
    for (const line of result.lines) console.log(line);
    console.log(`PREFLIGHT_STATUS\t${result.gaps.length ? "BLOCKED" : "PASS"}\tgaps=${result.gaps.length}`);
    if (result.gaps.length) process.exitCode = 1;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error("PREFLIGHT_STATUS\tERROR\tSee private operator diagnostics");
    process.exitCode = 1;
  });
}
