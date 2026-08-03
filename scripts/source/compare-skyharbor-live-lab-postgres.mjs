import { Client } from "pg";

const tenantKey = process.env.SKYHARBOR_TENANT_KEY || "skyharbor_global";
const prodUrl = process.env.PROD_DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
const labUrl = process.env.LAB_DATABASE_URL || process.env.AZURE_LAB_DATABASE_URL;

const rawSchemas = ["raw_enterprise_it", "raw_data_analytics", "raw_cloud_hybrid"];

function connectionOptions(connectionString, applicationName) {
  if (!connectionString) throw new Error(`${applicationName}: missing connection string`);
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 20000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 20000),
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

function normalizeRows(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === null ? null : String(value)])));
}

async function maybeQuery(client, sql, params = []) {
  try {
    const result = await client.query(sql, params);
    return { ok: true, rows: normalizeRows(result.rows) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function inspectDatabase(label, connectionString) {
  const client = new Client(connectionOptions(connectionString, `skyharbor-${label}-parity`));
  await client.connect();
  try {
    const identity = await maybeQuery(client, `
      SELECT current_database() AS database_name, current_user AS user_name, inet_server_addr()::text AS server_addr
    `);

    const rawTables = await maybeQuery(client, `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = ANY($1::text[])
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `, [rawSchemas]);

    const rawCounts = await maybeQuery(client, `
      SELECT table_schema, table_name,
        (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS row_count
      FROM information_schema.tables
      WHERE table_schema = ANY($1::text[])
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `, [rawSchemas]);

    const sourceViews = await maybeQuery(client, `
      SELECT table_schema, table_name
      FROM information_schema.views
      WHERE table_schema = 'source'
        AND table_name = ANY(ARRAY[
          'contract_vendor_360',
          'contract_360',
          'vendor_contract_portfolio',
          'contract_application_scope',
          'contract_initiative_dependency'
        ]::text[])
      ORDER BY table_name
    `);

    const contractVendor360 = await maybeQuery(client, `
      SELECT
        COUNT(*)::bigint AS rows,
        COUNT(DISTINCT vendor_id)::bigint AS vendors,
        COALESCE(SUM(annual_value), 0)::numeric(18,2) AS annual_value,
        COALESCE(SUM(total_committed_value), 0)::numeric(18,2) AS total_committed_value
      FROM source.contract_vendor_360
      WHERE tenant_key = $1
    `, [tenantKey]);

    const contract360 = await maybeQuery(client, `
      SELECT
        COUNT(*)::bigint AS rows,
        COUNT(DISTINCT vendor_ref)::bigint AS vendors,
        COALESCE(SUM(annual_value), 0)::numeric(18,2) AS annual_value,
        COALESCE(SUM(total_committed_value), 0)::numeric(18,2) AS total_committed_value,
        COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::bigint AS auto_renew_rows
      FROM source.contract_360
      WHERE tenant_key = $1
    `, [tenantKey]);

    const sourcePortfolio = await maybeQuery(client, `
      SELECT
        COUNT(*)::bigint AS rows,
        COALESCE(SUM(annual_value), 0)::numeric(18,2) AS annual_value,
        COALESCE(SUM(total_committed_value), 0)::numeric(18,2) AS total_committed_value,
        COALESCE(SUM(contract_count), 0)::bigint AS contract_count
      FROM source.vendor_contract_portfolio
      WHERE tenant_key = $1
    `, [tenantKey]);

    const scope = await maybeQuery(client, `
      SELECT
        COUNT(*)::bigint AS rows,
        COUNT(DISTINCT contract_id)::bigint AS contracts,
        COUNT(DISTINCT application_ref)::bigint AS applications,
        COUNT(*) FILTER (WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical'))::bigint AS critical_rows
      FROM source.contract_application_scope
      WHERE tenant_key = $1
    `, [tenantKey]);

    const towerClaims = await maybeQuery(client, `
      SELECT
        COUNT(*)::bigint AS claims,
        COUNT(*) FILTER (WHERE lower(COALESCE(claim_state, '')) = 'funded_no_baseline')::bigint AS funded_no_baseline,
        COUNT(*) FILTER (WHERE lower(COALESCE(claim_state, '')) = 'usage_supported')::bigint AS usage_supported,
        COUNT(*) FILTER (WHERE lower(COALESCE(claim_state, '')) = 'finance_validated')::bigint AS finance_validated,
        COUNT(*) FILTER (WHERE lower(COALESCE(claim_state, '')) = 'claimable')::bigint AS claimable
      FROM tower.value_claim
      WHERE tenant_key = $1
    `, [tenantKey]);

    return {
      label,
      identity,
      raw_tables: rawTables,
      raw_counts: rawCounts,
      source_views: sourceViews,
      contract_vendor_360: contractVendor360,
      contract_360: contract360,
      vendor_contract_portfolio: sourcePortfolio,
      contract_application_scope: scope,
      tower_value_claim: towerClaims,
    };
  } finally {
    await client.end();
  }
}

function firstRow(result) {
  return result?.ok ? result.rows[0] ?? {} : { error: result?.error ?? "missing" };
}

function tableCountMap(result) {
  if (!result?.ok) return {};
  return Object.fromEntries(result.rows.map((row) => [`${row.table_schema}.${row.table_name}`, Number(row.row_count)]));
}

function compare(prod, lab) {
  const checks = [];
  const addCheck = (name, left, right) => checks.push({ name, prod: left, lab: right, match: String(left) === String(right) });

  addCheck("raw_table_count", prod.raw_tables.ok ? prod.raw_tables.rows.length : "error", lab.raw_tables.ok ? lab.raw_tables.rows.length : "error");
  const prodRaw = tableCountMap(prod.raw_counts);
  const labRaw = tableCountMap(lab.raw_counts);
  for (const table of Array.from(new Set([...Object.keys(prodRaw), ...Object.keys(labRaw)])).sort()) {
    addCheck(`raw_rows:${table}`, prodRaw[table] ?? "missing", labRaw[table] ?? "missing");
  }

  for (const [section, fields] of [
    ["contract_vendor_360", ["rows", "vendors", "annual_value", "total_committed_value"]],
    ["contract_360", ["rows", "vendors", "annual_value", "total_committed_value", "auto_renew_rows"]],
    ["vendor_contract_portfolio", ["rows", "annual_value", "total_committed_value", "contract_count"]],
    ["contract_application_scope", ["rows", "contracts", "applications", "critical_rows"]],
    ["tower_value_claim", ["claims", "funded_no_baseline", "usage_supported", "finance_validated", "claimable"]],
  ]) {
    const prodRow = firstRow(prod[section]);
    const labRow = firstRow(lab[section]);
    for (const field of fields) addCheck(`${section}.${field}`, prodRow[field] ?? "missing", labRow[field] ?? "missing");
  }

  return {
    ok: checks.every((check) => check.match),
    checks,
    mismatches: checks.filter((check) => !check.match),
  };
}

async function main() {
  const prod = await inspectDatabase("prod", prodUrl);
  const lab = await inspectDatabase("lab", labUrl);
  const parity = compare(prod, lab);
  console.log(JSON.stringify({
    ok: parity.ok,
    tenant_key: tenantKey,
    prod: {
      identity: prod.identity,
      source_views: prod.source_views,
    },
    lab: {
      identity: lab.identity,
      source_views: lab.source_views,
    },
    parity,
  }, null, 2));
  if (!parity.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
