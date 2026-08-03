import dotenv from "dotenv";
import fs from "node:fs";
import yaml from "js-yaml";
import { Client } from "pg";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const tenantArg = process.argv.find((arg) => arg.startsWith("--tenant="));
const tenantKey = tenantArg?.split("=")[1] || process.env.SOURCE_TENANT_KEY || "skyharbor_global";

const databaseUrl =
  process.env.SOURCE_CUBE_DATABASE_URL ||
  process.env.SOURCE_CONTEXT_DATABASE_URL ||
  process.env.AZURE_LAB_DATABASE_URL ||
  process.env.ABARVA_AZURE_DATABASE_URL ||
  process.env.AZURE_DATABASE_URL ||
  process.env.DATABASE_URL;

const modelPath = "cube/model/source_sourcing.yml";
const rewritePath = "cube/cube.py";

function clientOptions() {
  if (!databaseUrl) {
    throw new Error("Missing SOURCE_CUBE_DATABASE_URL, SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  }
  return {
    connectionString: databaseUrl,
    application_name: "source-cube-parity-verify",
    ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

function sqlIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `"${value}"`;
}

function cubeTable(cube) {
  const [schema, table] = String(cube.sql_table || "").split(".");
  if (!schema || !table) throw new Error(`Cube ${cube.name} has invalid sql_table ${cube.sql_table}`);
  return `${sqlIdent(schema)}.${sqlIdent(table)}`;
}

function measureSql(measure) {
  if (measure.type === "count") return "count(*)";
  if (measure.type === "count_distinct") return `count(DISTINCT (${measure.sql}))`;
  if (measure.type === "sum") return `sum(${measure.sql})`;
  if (measure.type === "avg") return `avg(${measure.sql})`;
  throw new Error(`Unsupported measure type ${measure.type} for ${measure.name}`);
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0];
}

async function validateCube(client, cube) {
  const table = cubeTable(cube);
  const dimensions = cube.dimensions || [];
  const measures = cube.measures || [];
  const tenantDimension = dimensions.find((dimension) => dimension.name === "tenant_key");
  if (!tenantDimension) throw new Error(`Cube ${cube.name} does not expose tenant_key`);

  const row = await scalar(client, `SELECT count(*)::int AS rows FROM ${table} WHERE tenant_key = $1`, [tenantKey]);
  const primaryKeys = dimensions.filter((dimension) => dimension.primary_key);
  const primaryKeyChecks = [];
  for (const primaryKey of primaryKeys) {
    const keyCheck = await scalar(
      client,
      `
      SELECT
        count(*)::int AS rows,
        count(DISTINCT (${primaryKey.sql}))::int AS distinct_keys
      FROM ${table}
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );
    if (Number(keyCheck.rows) !== Number(keyCheck.distinct_keys)) {
      throw new Error(`${cube.name}.${primaryKey.name} is declared primary_key but has ${keyCheck.rows} rows and ${keyCheck.distinct_keys} distinct keys`);
    }
    primaryKeyChecks.push({ name: primaryKey.name, rows: keyCheck.rows, distinct_keys: keyCheck.distinct_keys });
  }

  for (const dimension of dimensions) {
    await client.query(`SELECT ${dimension.sql} AS value FROM ${table} WHERE tenant_key = $1 LIMIT 1`, [tenantKey]);
  }

  const measureResults = {};
  for (const measure of measures) {
    const result = await scalar(client, `SELECT ${measureSql(measure)} AS value FROM ${table} WHERE tenant_key = $1`, [tenantKey]);
    measureResults[measure.name] = result?.value ?? null;
  }

  return {
    name: cube.name,
    sql_table: cube.sql_table,
    rows: row.rows,
    primary_key_checks: primaryKeyChecks,
    measures: measureResults,
  };
}

async function main() {
  const model = yaml.load(fs.readFileSync(modelPath, "utf8"));
  const rewrite = fs.readFileSync(rewritePath, "utf8");
  const cubes = model.cubes || [];
  const views = model.views || [];

  if (cubes.length !== 8) throw new Error(`Expected 8 Source cubes, found ${cubes.length}`);
  if (views.length !== 9) throw new Error(`Expected 9 Source Cube views, found ${views.length}`);
  if (!rewrite.includes("tenant_key is required in Cube securityContext")) {
    throw new Error("Cube query_rewrite does not hard-require tenant_key");
  }

  const client = new Client(clientOptions());
  await client.connect();
  try {
    await client.query("SELECT set_config('app.tenant_key', '__source_cube_probe__', false)");
    const negativeTenantProbe = await scalar(client, "SELECT source.can_read_sourcing_tenant($1) AS allowed", [tenantKey]);
    if (negativeTenantProbe?.allowed === true) {
      throw new Error("source.can_read_sourcing_tenant allowed the requested tenant while app.tenant_key was set to a different tenant");
    }

    await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);

    const livePortfolio = await scalar(
      client,
      `
      SELECT
        count(*)::int AS contract_rows,
        count(DISTINCT vendor_ref)::int AS vendor_rows,
        COALESCE(sum(annual_value), 0)::numeric AS annual_value
      FROM source.contract_vendor_360
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );

    const cubeResults = [];
    for (const cube of cubes) {
      cubeResults.push(await validateCube(client, cube));
    }

    const contracts = cubeResults.find((cube) => cube.name === "sourcing_contracts");
    const vendors = cubeResults.find((cube) => cube.name === "sourcing_vendors");
    const failures = [];

    if (Number(contracts?.rows) !== Number(livePortfolio.contract_rows)) {
      failures.push(`sourcing_contracts rows ${contracts?.rows} != live contracts ${livePortfolio.contract_rows}`);
    }
    if (Number(contracts?.measures?.annual_value) !== Number(livePortfolio.annual_value)) {
      failures.push(`sourcing_contracts annual_value ${contracts?.measures?.annual_value} != live ${livePortfolio.annual_value}`);
    }
    if (Number(vendors?.rows) !== Number(livePortfolio.vendor_rows)) {
      failures.push(`sourcing_vendors rows ${vendors?.rows} != live distinct vendors ${livePortfolio.vendor_rows}`);
    }
    if (Number(vendors?.measures?.annual_value) !== Number(livePortfolio.annual_value)) {
      failures.push(`sourcing_vendors annual_value ${vendors?.measures?.annual_value} != live ${livePortfolio.annual_value}`);
    }
    if (Number(vendors?.measures?.contract_count) !== Number(livePortfolio.contract_rows)) {
      failures.push(`sourcing_vendors contract_count ${vendors?.measures?.contract_count} != live contracts ${livePortfolio.contract_rows}`);
    }

    const viewNames = new Set(views.map((view) => view.name));
    for (const expectedView of [
      "source_executive_portfolio",
      "source_vendor_concentration",
      "source_renewal_exposure",
      "source_contract_scope_confidence",
      "source_spend_consumption",
      "source_performance_and_credits",
      "source_opportunity_pipeline",
      "source_event_execution",
      "source_supplier_comparison",
    ]) {
      if (!viewNames.has(expectedView)) failures.push(`missing Cube view ${expectedView}`);
    }

    const result = {
      ok: failures.length === 0,
      tenant_key: tenantKey,
      cube_model: {
        path: modelPath,
        cubes: cubes.length,
        views: views.length,
      },
      live_portfolio: livePortfolio,
      cube_results: cubeResults,
      failures,
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
