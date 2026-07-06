import { createRequire } from 'node:module';
import fs from 'node:fs';

const requireFromApp = createRequire(fs.existsSync('/app/package.json') ? '/app/package.json' : new URL('../../package.json', import.meta.url));
const { Client } = requireFromApp('pg');

const contractVersion = process.env.V7_CONTRACT_VERSION || 'v7.1.0-holdco-entity-spine-20260706';
const tenantKey = process.env.V7_TENANT_KEY || 'lakeshore-industries';
const connectionString = process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL || process.env.AZURE_DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  application_name: 'v7-holdco-readback',
});

async function q(sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

try {
  await client.connect();
  await client.query("select set_config('app.tenant_key', $1, false)", [tenantKey]);

  const report = {
    tenantKey,
    contractVersion,
    run: await q(
      `select tenant_key, tenant_name, contract_version, load_status,
        file_count, row_count, field_count, graph_node_count,
        relationship_edge_count, chunk_count, loaded_at::text
       from intelligence_v7.tenant_pack_runs
       where tenant_key = $1 and contract_version = $2
       order by loaded_at desc
       limit 1`,
      [tenantKey, contractVersion],
    ),
    entityRollup: await q(
      `select entity_scope, count(*)::int as count,
        sum(revenue_usd)::numeric as revenue_usd,
        sum(employee_count)::int as employees,
        sum(total_direct_technology_budget_usd)::numeric as tech_budget_usd
       from intelligence_v7.current_entity_registry
       where tenant_key = $1
       group by entity_scope
       order by entity_scope`,
      [tenantKey],
    ),
    entityNames: await q(
      `select entity_name, entity_scope, parent_entity_name,
        revenue_usd, employee_count, total_direct_technology_budget_usd
       from intelligence_v7.current_entity_registry
       where tenant_key = $1
       order by entity_scope, entity_name`,
      [tenantKey],
    ),
    dimensionCounts: await q(
      `select dimension_key, count(*)::int as records
       from intelligence_v7.business_records
       where tenant_key = $1 and contract_version = $2
       group by dimension_key
       order by dimension_key`,
      [tenantKey, contractVersion],
    ),
    systemScopes: await q(
      `select values_json->>'system_scope' as system_scope, count(*)::int as systems
       from intelligence_v7.business_records
       where tenant_key = $1
         and contract_version = $2
         and dimension_key = 'v7_05_applications_systems'
       group by 1
       order by 1`,
      [tenantKey, contractVersion],
    ),
    sharedSystemBridgeByOpco: await q(
      `select entity_name, count(*)::int as shared_system_bridge_rows
       from intelligence_v7.business_records
       where tenant_key = $1
         and contract_version = $2
         and dimension_key = 'v7_18_function_system_data_vendor_bridge'
         and values_json->>'dependency_type' = 'corporate_shared_system'
       group by entity_name
       order by entity_name`,
      [tenantKey, contractVersion],
    ),
    graphHealth: await q(
      `select tenant_key, contract_version, edge_count, from_node_count,
        to_node_count, weak_or_unscored_edges
       from intelligence_v7.graph_edge_health
       where tenant_key = $1 and contract_version = $2`,
      [tenantKey, contractVersion],
    ),
  };

  const failures = [];
  if (report.run[0]?.load_status !== 'validated') failures.push('Latest run is not validated.');
  if (Number(report.run[0]?.row_count ?? 0) !== 2974) failures.push(`Expected 2974 rows, got ${report.run[0]?.row_count}.`);
  if ((report.entityNames ?? []).length !== 8) failures.push(`Expected 8 entity rows, got ${report.entityNames.length}.`);
  if (!report.systemScopes.some((row) => row.system_scope === 'corporate_shared_service' && row.systems === 24)) {
    failures.push('Expected 24 corporate_shared_service systems.');
  }
  if (!report.systemScopes.some((row) => row.system_scope === 'opco_local_application' && row.systems === 126)) {
    failures.push('Expected 126 opco_local_application systems.');
  }
  if ((report.sharedSystemBridgeByOpco ?? []).length !== 7) failures.push('Expected shared-system bridge rows for 7 OpCos.');
  for (const row of report.sharedSystemBridgeByOpco) {
    if (Number(row.shared_system_bridge_rows) < 12) {
      failures.push(`${row.entity_name} has only ${row.shared_system_bridge_rows} shared-system bridge rows.`);
    }
  }
  if (Number(report.graphHealth[0]?.weak_or_unscored_edges ?? 1) !== 0) failures.push('Graph health has weak/unscored edges.');

  console.log(JSON.stringify({ ok: failures.length === 0, failures, report }, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), stack: error?.stack }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
