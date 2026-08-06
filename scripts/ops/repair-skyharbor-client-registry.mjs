#!/usr/bin/env node
import { Client } from "pg";

const SKYHARBOR_CLIENT_ID = "6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301";
const APP_CLIENT_KEY = "skyharbor";
const CANONICAL_TENANT_KEY = "skyharbor_global";
const DISPLAY_NAME = "SkyHarbor Global";
const INDUSTRY_CODE = "AIRLINE";
const LOOKUP_ALIASES = [
  "skyharbor",
  "skyharbor_global",
  "skyharbor-air",
  "skyharbor-global",
  "skyharbor air",
  "skyharbor global",
  "skyharbor global airlines group",
  "skyharbor airlines",
  "airline demo",
];

const SENSITIVE_PATTERN = /(DATABASE_URL|PASSWORD|SECRET|TOKEN|KEY|CONNECTION)/i;

function usage() {
  return `Usage:
  node scripts/ops/repair-skyharbor-client-registry.mjs [--apply|--dry-run|--self-test]

Repairs the app-level clients row required for the SkyHarbor canonical tenant.
The script is intentionally narrow: it only upserts one public.clients row and
then proves the same alias lookup shape used by the runtime can resolve it.

Environment:
  DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL
  ABARVA_CLIENT_REGISTRY_REPAIR_APPLY=true   Equivalent to --apply.
`;
}

function shouldDisableSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "disable") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function databaseUrl() {
  const value =
    process.env.DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    "";
  if (!value.trim()) {
    throw new Error("DATABASE_URL, ABARVA_AZURE_DATABASE_URL, or AZURE_DATABASE_URL is required.");
  }
  return value.trim();
}

function redact(value) {
  if (!value) return value;
  return SENSITIVE_PATTERN.test(String(value)) ? "<redacted>" : value;
}

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function supportedPatch(columns, timestamp = new Date().toISOString()) {
  const desired = {
    tenant_key: CANONICAL_TENANT_KEY,
    slug: APP_CLIENT_KEY,
    name: DISPLAY_NAME,
    legal_name: DISPLAY_NAME,
    display_name: DISPLAY_NAME,
    short_name: "SkyHarbor",
    industry_code: INDUSTRY_CODE,
    client_key: APP_CLIENT_KEY,
    key: APP_CLIENT_KEY,
    updated_at: timestamp,
  };

  return Object.fromEntries(
    Object.entries(desired).filter(([column]) => columns.has(column)),
  );
}

function supportedInsert(columns, timestamp = new Date().toISOString()) {
  const desired = {
    id: SKYHARBOR_CLIENT_ID,
    tenant_key: CANONICAL_TENANT_KEY,
    slug: APP_CLIENT_KEY,
    name: DISPLAY_NAME,
    legal_name: DISPLAY_NAME,
    display_name: DISPLAY_NAME,
    short_name: "SkyHarbor",
    industry_code: INDUSTRY_CODE,
    client_key: APP_CLIENT_KEY,
    key: APP_CLIENT_KEY,
    created_at: timestamp,
    updated_at: timestamp,
  };

  return Object.fromEntries(
    Object.entries(desired).filter(([column]) => columns.has(column)),
  );
}

function buildWhereClause(columns) {
  const predicates = [];
  if (columns.has("id")) predicates.push(`${quoteIdentifier("id")} = $1`);
  if (columns.has("tenant_key")) predicates.push(`${quoteIdentifier("tenant_key")} = ANY($2::text[])`);
  if (columns.has("slug")) predicates.push(`${quoteIdentifier("slug")} = ANY($2::text[])`);
  if (columns.has("client_key")) predicates.push(`${quoteIdentifier("client_key")} = ANY($2::text[])`);
  if (columns.has("key")) predicates.push(`${quoteIdentifier("key")} = ANY($2::text[])`);
  if (columns.has("name")) predicates.push(`lower(${quoteIdentifier("name")}) = ANY($3::text[])`);
  if (predicates.length === 0) throw new Error("clients table has no supported identity columns.");
  return predicates.join(" OR ");
}

function buildUpdateStatement(columns, rowId, timestamp) {
  const patch = supportedPatch(columns, timestamp);
  if (!columns.has("id")) throw new Error("clients.id column is required for safe update.");
  const entries = Object.entries(patch);
  if (entries.length === 0) throw new Error("clients table has no supported patch columns.");
  const assignments = entries.map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  values.push(rowId);
  return {
    sql: `UPDATE public.clients SET ${assignments.join(", ")} WHERE ${quoteIdentifier("id")} = $${values.length}`,
    values,
    patch,
  };
}

function buildInsertStatement(columns, timestamp) {
  const insert = supportedInsert(columns, timestamp);
  if (!insert.id) throw new Error("clients.id column is required for safe insert.");
  if (!insert.tenant_key) throw new Error("clients.tenant_key column is required for safe insert.");
  const entries = Object.entries(insert);
  const quotedColumns = entries.map(([column]) => quoteIdentifier(column));
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  return {
    sql: `INSERT INTO public.clients (${quotedColumns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    values: entries.map(([, value]) => value),
    insert,
  };
}

function rowScore(row) {
  if (row.id === SKYHARBOR_CLIENT_ID) return 0;
  if (row.tenant_key === CANONICAL_TENANT_KEY) return 1;
  if (row.slug === APP_CLIENT_KEY) return 2;
  if (row.client_key === APP_CLIENT_KEY) return 3;
  if (row.key === APP_CLIENT_KEY) return 4;
  if (LOOKUP_ALIASES.includes(String(row.tenant_key ?? "").toLowerCase())) return 5;
  return 9;
}

function pickTargetRow(rows) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => rowScore(a) - rowScore(b))[0];
}

async function tableColumns(client) {
  const result = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'clients'
      ORDER BY ordinal_position`,
  );
  if (!result.rows.length) throw new Error("public.clients table was not found.");
  return new Set(result.rows.map((row) => row.column_name));
}

function selectColumns(columns) {
  return [
    "id",
    "tenant_key",
    "slug",
    "client_key",
    "key",
    "name",
    "legal_name",
    "display_name",
    "short_name",
    "industry_code",
    "created_at",
    "updated_at",
  ].filter((column) => columns.has(column));
}

async function findCandidateRows(client, columns) {
  const selected = selectColumns(columns);
  const whereClause = buildWhereClause(columns);
  const result = await client.query(
    `SELECT ${selected.map(quoteIdentifier).join(", ")}
       FROM public.clients
      WHERE ${whereClause}
      ORDER BY ${columns.has("tenant_key") ? `${quoteIdentifier("tenant_key")} NULLS LAST, ` : ""}${quoteIdentifier("id")}
      LIMIT 20`,
    [SKYHARBOR_CLIENT_ID, LOOKUP_ALIASES, LOOKUP_ALIASES.map((alias) => alias.toLowerCase())],
  );
  return result.rows;
}

async function runtimeAliasReadback(client, columns) {
  const selected = selectColumns(columns);
  const attempts = [];
  for (const alias of LOOKUP_ALIASES) {
    for (const column of ["tenant_key", "slug", "client_key", "key"]) {
      if (!columns.has(column)) continue;
      const result = await client.query(
        `SELECT ${selected.map(quoteIdentifier).join(", ")}
           FROM public.clients
          WHERE ${quoteIdentifier(column)} = $1
          ORDER BY ${quoteIdentifier("id")}
          LIMIT 2`,
        [alias],
      );
      attempts.push({ column, alias, rowCount: result.rowCount ?? 0 });
      if (result.rows[0]) {
        return { match: result.rows[0], matchedBy: { column, alias }, attempts };
      }
    }
    if (columns.has("name")) {
      const result = await client.query(
        `SELECT ${selected.map(quoteIdentifier).join(", ")}
           FROM public.clients
          WHERE lower(${quoteIdentifier("name")}) = lower($1)
          ORDER BY ${quoteIdentifier("id")}
          LIMIT 2`,
        [alias],
      );
      attempts.push({ column: "name", alias, rowCount: result.rowCount ?? 0 });
      if (result.rows[0]) {
        return { match: result.rows[0], matchedBy: { column: "name", alias }, attempts };
      }
    }
  }
  return { match: null, matchedBy: null, attempts };
}

async function repair({ apply }) {
  const url = databaseUrl();
  const client = new Client({
    connectionString: url,
    application_name: "skyharbor-client-registry-repair",
    ssl: shouldDisableSsl(url) ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  const startedAt = new Date().toISOString();
  try {
    const columns = await tableColumns(client);
    const before = await findCandidateRows(client, columns);
    const target = pickTargetRow(before);
    const timestamp = new Date().toISOString();
    let mutation = { applied: false, mode: apply ? "apply" : "dry_run" };

    if (apply) {
      await client.query("BEGIN");
      try {
        if (target?.id) {
          const statement = buildUpdateStatement(columns, target.id, timestamp);
          const result = await client.query(statement.sql, statement.values);
          mutation = {
            applied: true,
            mode: "update",
            rowCount: result.rowCount ?? 0,
            targetId: target.id,
            patchColumns: Object.keys(statement.patch),
          };
        } else {
          const statement = buildInsertStatement(columns, timestamp);
          const result = await client.query(statement.sql, statement.values);
          mutation = {
            applied: true,
            mode: "insert",
            rowCount: result.rowCount ?? 0,
            targetId: SKYHARBOR_CLIENT_ID,
            insertColumns: Object.keys(statement.insert),
          };
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    }

    const after = await findCandidateRows(client, columns);
    const readback = await runtimeAliasReadback(client, columns);
    const resolved = Boolean(
      readback.match &&
        readback.match.tenant_key === CANONICAL_TENANT_KEY &&
        (readback.match.industry_code ?? INDUSTRY_CODE) === INDUSTRY_CODE,
    );
    const proof = {
      event: "skyharbor_client_registry_repair",
      status: resolved ? "passed" : "failed",
      apply,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      database_url: redact("DATABASE_URL"),
      expected: {
        app_client_key: APP_CLIENT_KEY,
        canonical_tenant_key: CANONICAL_TENANT_KEY,
        preserved_client_id: SKYHARBOR_CLIENT_ID,
        industry_code: INDUSTRY_CODE,
      },
      columns: Array.from(columns).sort(),
      before,
      mutation,
      after,
      runtime_alias_readback: readback,
      checks: {
        runtime_alias_resolves: Boolean(readback.match),
        resolves_to_canonical_tenant: readback.match?.tenant_key === CANONICAL_TENANT_KEY,
        industry_code_airline: (readback.match?.industry_code ?? INDUSTRY_CODE) === INDUSTRY_CODE,
        preserved_client_id_found: after.some((row) => row.id === SKYHARBOR_CLIENT_ID),
      },
    };
    console.log(JSON.stringify(proof, null, 2));
    if (!resolved) {
      process.exitCode = 1;
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}

function selfTest() {
  const columns = new Set(["id", "tenant_key", "slug", "name", "legal_name", "industry_code", "created_at", "updated_at"]);
  const timestamp = "2026-08-06T00:00:00.000Z";
  const update = buildUpdateStatement(columns, SKYHARBOR_CLIENT_ID, timestamp);
  const insert = buildInsertStatement(columns, timestamp);
  const target = pickTargetRow([
    { id: "other", tenant_key: "skyharbor-air" },
    { id: SKYHARBOR_CLIENT_ID, tenant_key: "skyharbor-air" },
  ]);
  const result = {
    event: "skyharbor_client_registry_repair_self_test",
    status:
      update.sql.includes("UPDATE public.clients") &&
      insert.sql.includes("INSERT INTO public.clients") &&
      target?.id === SKYHARBOR_CLIENT_ID
        ? "passed"
        : "failed",
    updateSql: update.sql,
    insertSql: insert.sql,
    updateValues: update.values,
    insertValues: insert.values,
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "passed") process.exitCode = 1;
}

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  console.log(usage());
} else if (args.has("--self-test")) {
  selfTest();
} else {
  const apply = args.has("--apply") || process.env.ABARVA_CLIENT_REGISTRY_REPAIR_APPLY === "true";
  repair({ apply }).catch((error) => {
    console.error(JSON.stringify({
      event: "skyharbor_client_registry_repair",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exit(1);
  });
}
