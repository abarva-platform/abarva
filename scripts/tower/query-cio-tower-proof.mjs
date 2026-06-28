import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const tables = [
  "source_registry",
  "entities",
  "facts",
  "relationships",
  "measures",
  "measure_results",
  "question_contracts",
];

async function countTable(tableName) {
  const result = await client.query(
    `select count(*)::int as count from cio_tower.${tableName}`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function main() {
  await client.connect();

  const counts = {};
  for (const tableName of tables) {
    counts[tableName] = await countTable(tableName);
  }

  const byTenant = await client.query(`
    select
      tenant_key,
      count(*) filter (where layer = 'source')::int as source_rows,
      count(*) filter (where layer = 'entity')::int as entity_rows,
      count(*) filter (where layer = 'fact')::int as fact_rows,
      count(*) filter (where layer = 'relationship')::int as relationship_rows,
      count(*) filter (where layer = 'measure_result')::int as measure_result_rows
    from (
      select tenant_key, 'source' as layer from cio_tower.source_registry
      union all
      select tenant_key, 'entity' as layer from cio_tower.entities
      union all
      select tenant_key, 'fact' as layer from cio_tower.facts
      union all
      select tenant_key, 'relationship' as layer from cio_tower.relationships
      union all
      select tenant_key, 'measure_result' as layer from cio_tower.measure_results
    ) layered
    group by tenant_key
    order by tenant_key
  `);

  const trendMeasures = await client.query(`
    select
      tenant_key,
      measure_key,
      period,
      value_numeric::numeric::text as value_numeric,
      formula_version,
      coalesce(array_length(source_fact_keys, 1), 0)::int as source_fact_count,
      value_json
    from cio_tower.measure_results
    where measure_key in ('total_it_budget_fy25_baseline', 'total_it_budget_fy26')
    order by tenant_key, period, measure_key
  `);

  console.log(
    JSON.stringify(
      {
        counts,
        byTenant: byTenant.rows,
        trendMeasures: trendMeasures.rows,
      },
      null,
      2,
    ),
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {
    // ignore close failures during error handling
  }
  process.exit(1);
});
