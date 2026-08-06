#!/usr/bin/env node
import { Client } from "pg";

const APP_CLIENT_KEYS = ["skyharbor", "skyharbor_global"];
const STALE_LABEL = "Airline Demo";
const CANONICAL_LABEL = "SkyHarbor Global";
const TEXT_COLUMNS = [
  "event_name",
  "trigger_description",
  "scope_description",
  "decision_owner",
];

function usage() {
  return `Usage:
  node scripts/ops/repair-skyharbor-source-event-titles.mjs [--apply|--dry-run|--self-test]

Repairs stale visible Source event copy for the canonical SkyHarbor demo. The
script only scans public.source_events rows for SkyHarbor client keys and only
replaces the exact phrase "Airline Demo" in supported text columns.

Environment:
  DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL
  ABARVA_SOURCE_EVENT_TITLE_REPAIR_APPLY=true   Equivalent to --apply.
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

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function sourceEventColumns(client) {
  const result = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'source_events'
      ORDER BY ordinal_position`,
  );
  if (!result.rows.length) throw new Error("public.source_events table was not found.");
  return new Set(result.rows.map((row) => row.column_name));
}

function supportedTextColumns(columns) {
  return TEXT_COLUMNS.filter((column) => columns.has(column));
}

function selectColumns(columns) {
  return [
    "id",
    "client_key",
    "event_code",
    "event_name",
    "lifecycle_state",
    "updated_at",
    ...supportedTextColumns(columns).filter((column) => column !== "event_name"),
  ].filter((column, index, array) => columns.has(column) && array.indexOf(column) === index);
}

function stalePredicate(columns) {
  const textColumns = supportedTextColumns(columns);
  if (!columns.has("client_key")) throw new Error("source_events.client_key is required.");
  if (!textColumns.length) throw new Error("source_events has no supported visible text columns.");
  return textColumns
    .map((column) => `${quoteIdentifier(column)} ILIKE '%' || $2 || '%'`)
    .join(" OR ");
}

async function readMatchingRows(client, columns, staleOnly = true) {
  const selected = selectColumns(columns);
  const textPredicate = stalePredicate(columns);
  const where = staleOnly ? `AND (${textPredicate})` : "";
  const result = await client.query(
    `SELECT ${selected.map(quoteIdentifier).join(", ")}
       FROM public.source_events
      WHERE ${quoteIdentifier("client_key")} = ANY($1::text[])
        ${where}
      ORDER BY ${quoteIdentifier("updated_at")} DESC NULLS LAST, ${quoteIdentifier("event_code")} NULLS LAST, ${quoteIdentifier("id")}
      LIMIT 50`,
    [APP_CLIENT_KEYS, STALE_LABEL],
  );
  return result.rows;
}

function buildUpdateSql(columns) {
  const assignments = supportedTextColumns(columns).map(
    (column) =>
      `${quoteIdentifier(column)} = CASE WHEN ${quoteIdentifier(column)} IS NULL THEN NULL ELSE replace(${quoteIdentifier(column)}, $2, $3) END`,
  );
  if (columns.has("updated_at")) {
    assignments.push(`${quoteIdentifier("updated_at")} = now()`);
  }
  return `UPDATE public.source_events
             SET ${assignments.join(", ")}
           WHERE ${quoteIdentifier("client_key")} = ANY($1::text[])
             AND (${stalePredicate(columns)})`;
}

async function repair({ apply }) {
  const url = databaseUrl();
  const client = new Client({
    connectionString: url,
    application_name: "skyharbor-source-event-title-repair",
    ssl: shouldDisableSsl(url) ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  const startedAt = new Date().toISOString();
  try {
    const columns = await sourceEventColumns(client);
    const before = await readMatchingRows(client, columns, true);
    let mutation = { applied: false, mode: apply ? "apply" : "dry_run", rowCount: 0 };

    if (apply && before.length > 0) {
      await client.query("BEGIN");
      try {
        const result = await client.query(buildUpdateSql(columns), [
          APP_CLIENT_KEYS,
          STALE_LABEL,
          CANONICAL_LABEL,
        ]);
        mutation = { applied: true, mode: "update", rowCount: result.rowCount ?? 0 };
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    }

    const afterStaleRows = await readMatchingRows(client, columns, true);
    const afterSkyharborRows = await readMatchingRows(client, columns, false);
    const passed = afterStaleRows.length === 0;
    const proof = {
      event: "skyharbor_source_event_title_repair",
      status: passed ? "passed" : apply ? "failed" : "dry_run_pending_apply",
      apply,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      scope: {
        table: "public.source_events",
        client_keys: APP_CLIENT_KEYS,
        stale_label: STALE_LABEL,
        canonical_label: CANONICAL_LABEL,
        updated_columns: supportedTextColumns(columns),
      },
      before_stale_rows: before,
      mutation,
      after_stale_rows: afterStaleRows,
      after_skyharbor_sample: afterSkyharborRows.slice(0, 10),
      checks: {
        source_events_table_found: true,
        client_key_scoped: true,
        no_stale_label_in_skyharbor_source_events: passed,
      },
    };
    console.log(JSON.stringify(proof, null, 2));
    if (apply && !passed) process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function replaceStaleText(value) {
  return value == null ? value : String(value).replaceAll(STALE_LABEL, CANONICAL_LABEL);
}

function selfTest() {
  const columns = new Set(["id", "client_key", "event_code", "event_name", "scope_description", "updated_at"]);
  const sql = buildUpdateSql(columns);
  const sample = replaceStaleText("Airline Demo Normalize the sectioned narrative responses");
  const result = {
    event: "skyharbor_source_event_title_repair_self_test",
    status:
      sql.includes("UPDATE public.source_events") &&
      sql.includes('"client_key" = ANY($1::text[])') &&
      sample === "SkyHarbor Global Normalize the sectioned narrative responses"
        ? "passed"
        : "failed",
    updateSql: sql,
    sample,
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
  const apply =
    args.has("--apply") ||
    process.env.ABARVA_SOURCE_EVENT_TITLE_REPAIR_APPLY === "true";
  repair({ apply }).catch((error) => {
    console.error(JSON.stringify({
      event: "skyharbor_source_event_title_repair",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exit(1);
  });
}
