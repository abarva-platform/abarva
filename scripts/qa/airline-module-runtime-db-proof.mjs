#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ManagedIdentityCredential } from "@azure/identity";
import pg from "pg";

const { Pool } = pg;

const TENANT = "airline-demo-new";
const TOKEN = "AIRLINE_DEMO_NEW";
const OUT_DIR =
  process.env.AIRLINE_MODULE_DB_PROOF_OUT_DIR ??
  path.join(
    process.cwd(),
    "proof",
    "airline-all-module-data-plane-certification-2026-07-29",
  );
const OUT_FILE = path.join(OUT_DIR, "runtime-db-proof.json");
const POSTGRES_AAD_RESOURCE =
  "https://ossrdbms-aad.database.windows.net/.default";

function env(name) {
  return process.env[name]?.trim() || "";
}

async function aadToken(clientId) {
  const credential = new ManagedIdentityCredential(clientId);
  const token = await credential.getToken(POSTGRES_AAD_RESOURCE);
  if (!token?.token) throw new Error("managed_identity_token_missing");
  return token.token;
}

async function connect() {
  const host = env(`ABARVA_TENANT_PGHOST_${TOKEN}`) || env("PGHOST");
  const port = Number.parseInt(env(`ABARVA_TENANT_PGPORT_${TOKEN}`) || env("PGPORT") || "5432", 10);
  const user = env(`ABARVA_TENANT_PGUSER_${TOKEN}`) || env("PGUSER");
  const database = env(`ABARVA_TENANT_PGDATABASE_${TOKEN}`) || env("PGDATABASE");
  const aadClientId =
    env(`ABARVA_TENANT_POSTGRES_AAD_CLIENT_ID_${TOKEN}`) ||
    env("ABARVA_POSTGRES_AAD_CLIENT_ID") ||
    env("MANAGED_IDENTITY_CLIENT_ID") ||
    env("AZURE_CLIENT_ID");
  const password =
    env(`ABARVA_TENANT_PGPASSWORD_${TOKEN}`) ||
    env("PGPASSWORD") ||
    (aadClientId ? await aadToken(aadClientId) : "");

  const missing = [
    ["host", host],
    ["user", user],
    ["database", database],
    ["password_or_aad_client_id", password || aadClientId],
  ].filter(([, value]) => !value);
  if (missing.length) {
    throw new Error(`missing_airline_db_env:${missing.map(([key]) => key).join(",")}`);
  }

  const pool = new Pool({
    host,
    port: Number.isFinite(port) ? port : 5432,
    user,
    database,
    password,
    application_name: "airline-module-data-plane-certification",
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: { rejectUnauthorized: false },
  });
  return { pool, config: { host, port, user, database, aadClientId: aadClientId || null } };
}

async function query(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { pool, config } = await connect();
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [TENANT]);

    const identity = (await query(client, `
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        inet_server_addr()::text AS server_addr,
        inet_server_port() AS server_port,
        current_setting('app.tenant_key', true) AS tenant_setting,
        version() AS postgres_version
    `))[0];

    const baseline = await query(client, `
      SELECT tenant_key, knowledge_baseline_ref, baseline_content_hash,
             is_active, activated_at, projection_contract_version
        FROM publication.knowledge_baseline
       WHERE tenant_key = $1
       ORDER BY is_active DESC, activated_at DESC NULLS LAST
       LIMIT 5
    `, [TENANT]);

    const projectionCounts = await query(client, `
      SELECT 'consumption.enterprise_brief_v1' AS projection, count(*)::bigint AS rows
        FROM consumption.enterprise_brief_v1 WHERE tenant_key = $1
      UNION ALL
      SELECT 'consumption.domain_summary_v1', count(*)::bigint
        FROM consumption.domain_summary_v1 WHERE tenant_key = $1
      UNION ALL
      SELECT 'consumption.relationship_node_v1', count(*)::bigint
        FROM consumption.relationship_node_v1 WHERE tenant_key = $1
      UNION ALL
      SELECT 'consumption.relationship_edge_v1', count(*)::bigint
        FROM consumption.relationship_edge_v1 WHERE tenant_key = $1
      UNION ALL
      SELECT 'consumption.module_knowledge_packet_v1', count(*)::bigint
        FROM consumption.module_knowledge_packet_v1 WHERE tenant_key = $1
      UNION ALL
      SELECT 'consumption.metric_observation_v1', count(*)::bigint
        FROM consumption.metric_observation_v1 WHERE tenant_key = $1
    `, [TENANT]);

    const schemaInventory = await query(client, `
      SELECT n.nspname AS schema_name,
             count(*) FILTER (WHERE c.relkind IN ('r','p'))::int AS table_count,
             count(*) FILTER (WHERE c.relkind = 'v')::int AS view_count,
             count(*) FILTER (WHERE c.relkind = 'm')::int AS materialized_view_count
        FROM pg_namespace n
        JOIN pg_class c ON c.relnamespace = n.oid
       WHERE n.nspname NOT LIKE 'pg_%'
         AND n.nspname <> 'information_schema'
       GROUP BY n.nspname
       ORDER BY n.nspname
    `);

    const moduleRelationInventory = await query(client, `
      SELECT n.nspname AS schema_name, c.relname AS relation_name, c.relkind
        FROM pg_namespace n
        JOIN pg_class c ON c.relnamespace = n.oid
       WHERE n.nspname NOT LIKE 'pg_%'
         AND n.nspname <> 'information_schema'
         AND (
           n.nspname ~* '(source|move|program|tower|metric|consumption|publication)'
           OR c.relname ~* '(source|move|program|tower|metric|cube|superset|observable|vendor|contract)'
         )
       ORDER BY n.nspname, c.relname
       LIMIT 500
    `);

    const activeConnection = await query(client, `
      SELECT application_name, usename, datname, state, current_setting('app.tenant_key', true) AS tenant_setting
        FROM pg_stat_activity
       WHERE pid = pg_backend_pid()
    `);

    await client.query("ROLLBACK");

    const proof = {
      generatedAt: new Date().toISOString(),
      tenantKey: TENANT,
      config,
      identity,
      baseline,
      projectionCounts,
      schemaInventory,
      moduleRelationInventory,
      activeConnection,
      mutation: "none_read_only_transaction_rolled_back",
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(proof, null, 2));
    console.log(JSON.stringify({
      ok: true,
      tenantKey: TENANT,
      host: config.host,
      database: config.database,
      user: config.user,
      baseline: baseline[0]?.knowledge_baseline_ref ?? null,
      projectionCounts,
      outFile: OUT_FILE,
    }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
