import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url;
}

async function main() {
  const client = new Client(
    postgresClientOptions(databaseUrl(), "skyharbor-reconciliation-inspect"),
  );
  await client.connect();
  try {
    const oldTenantKeys = await client.query(
      `select distinct tenant_key, count(*)::int as n
         from public.source_contract_optimization_profiles
        group by tenant_key`,
    );
    const oldEventTenantKeys = await client.query(
      `select distinct client_key, count(*)::int as n
         from public.source_events
        where lower(client_key) like '%skyharbor%'
        group by client_key`,
    );

    let newSchemaExists = true;
    let newTenantKeys: { rows: unknown[] } = { rows: [] };
    let amsMatches: { rows: unknown[] } = { rows: [] };
    try {
      newTenantKeys = await client.query(
        `select distinct tenant_key, count(*)::int as n
           from source.contract_vendor_360
          group by tenant_key`,
      );
      amsMatches = await client.query(
        `select tenant_key, contract_id, vendor_ref, vendor_name, contract_name, annual_value
           from source.contract_vendor_360
          where contract_name ilike '%managed service%'
             or contract_name ilike '%AMS%'
             or vendor_name ilike '%vendor a%'
          order by annual_value desc nulls last
          limit 20`,
      );
    } catch (err) {
      newSchemaExists = false;
      console.error(
        "source.contract_vendor_360 query failed:",
        err instanceof Error ? err.message : String(err),
      );
    }

    console.log(
      JSON.stringify(
        {
          old_schema_public_contract_optimization_tenant_keys: oldTenantKeys.rows,
          old_schema_public_source_events_tenant_keys: oldEventTenantKeys.rows,
          new_schema_source_contract_vendor_360_exists: newSchemaExists,
          new_schema_source_contract_vendor_360_tenant_keys: newTenantKeys.rows,
          new_schema_ams_or_vendor_a_matches: amsMatches.rows,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
