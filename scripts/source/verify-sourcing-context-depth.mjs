import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const tenantArg = process.argv.find((arg) => arg.startsWith("--tenant="));
const tenantKey = tenantArg?.split("=")[1] || process.env.SOURCE_TENANT_KEY || "skyharbor_global";

const databaseUrl =
  process.env.SOURCE_CONTEXT_DATABASE_URL ||
  process.env.AZURE_LAB_DATABASE_URL ||
  process.env.ABARVA_AZURE_DATABASE_URL ||
  process.env.AZURE_DATABASE_URL ||
  process.env.DATABASE_URL;

const expectedTables = [
  "vendor",
  "contract",
  "contract_term",
  "contract_price_component",
  "service",
  "sourcing_event",
  "sourcing_event_supplier",
  "contract_scope",
  "vendor_application_relationship",
  "vendor_platform_relationship",
  "contract_initiative_dependency_detail",
  "vendor_spend_observation",
  "contract_consumption_observation",
  "contract_performance_observation",
  "contract_service_credit",
  "contract_milestone",
  "vendor_risk_observation",
  "market_benchmark",
  "sourcing_opportunity",
  "renewal_decision",
  "commercial_variance",
];

const expectedViews = [
  "sourcing_vendor_v1",
  "sourcing_contract_v1",
  "sourcing_contract_scope_v1",
  "sourcing_spend_monthly_v1",
  "sourcing_performance_v1",
  "sourcing_opportunity_v1",
  "sourcing_event_v1",
  "sourcing_event_supplier_v1",
  "sourcing_context_coverage_v1",
];

function clientOptions() {
  if (!databaseUrl) {
    throw new Error("Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  }
  return {
    connectionString: databaseUrl,
    application_name: "source-sourcing-context-depth-verify",
    ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
  };
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0];
}

async function main() {
  const client = new Client(clientOptions());
  await client.connect();
  try {
    const tables = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_type = 'BASE TABLE'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
      `,
      [expectedTables],
    );
    const tableNames = tables.rows.map((row) => row.table_name);
    const missingTables = expectedTables.filter((name) => !tableNames.includes(name));

    const views = await client.query(
      `
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'consumption'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
      `,
      [expectedViews],
    );
    const viewNames = views.rows.map((row) => row.table_name);
    const missingViews = expectedViews.filter((name) => !viewNames.includes(name));

    const livePortfolio = await scalar(
      client,
      `
      SELECT
        COUNT(*)::int AS contract_rows,
        COUNT(DISTINCT vendor_id)::int AS vendor_rows,
        COALESCE(SUM(annual_value), 0)::numeric AS annual_value
      FROM source.contract_vendor_360
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );

    const contractView = await scalar(
      client,
      `
      SELECT
        COUNT(*)::int AS contract_rows,
        COUNT(DISTINCT vendor_id)::int AS vendor_rows,
        COALESCE(SUM(annual_value), 0)::numeric AS annual_value,
        COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0)::int AS auto_renew_rows
      FROM consumption.sourcing_contract_v1
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );

    const vendorView = await scalar(
      client,
      `
      SELECT
        COUNT(*)::int AS vendor_rows,
        COALESCE(SUM(contract_count), 0)::int AS contract_count,
        COALESCE(SUM(annual_value), 0)::numeric AS annual_value
      FROM consumption.sourcing_vendor_v1
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );

    const coverage = await scalar(
      client,
      `
      SELECT *
      FROM consumption.sourcing_context_coverage_v1
      WHERE tenant_key = $1
      `,
      [tenantKey],
    );

    const scopeMethods = await client.query(
      `
      SELECT relationship_method, COUNT(*)::int AS rows
      FROM consumption.sourcing_contract_scope_v1
      WHERE tenant_key = $1
      GROUP BY relationship_method
      ORDER BY rows DESC, relationship_method
      `,
      [tenantKey],
    );

    const contractTotalMatches =
      Number(livePortfolio.annual_value) === Number(contractView.annual_value) &&
      Number(livePortfolio.annual_value) === Number(vendorView.annual_value);

    const result = {
      ok: missingTables.length === 0 && missingViews.length === 0 && contractTotalMatches,
      tenant_key: tenantKey,
      source_tables_present: tableNames.length,
      consumption_views_present: viewNames.length,
      missing_tables: missingTables,
      missing_views: missingViews,
      live_portfolio: livePortfolio,
      sourcing_contract_v1: contractView,
      sourcing_vendor_v1: vendorView,
      contract_total_matches_live_source: contractTotalMatches,
      sourcing_context_coverage_v1: coverage,
      scope_relationship_methods: scopeMethods.rows,
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
