import { Client, type QueryResultRow } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type TenantKey = 'apex-retail' | 'meridian-health' | 'first-capital';

type ClientMap = Map<string, string>;
type IdMap = Map<string, string>;

type CopySpec = {
  table: string;
  conflictColumns: string[];
  sourceWhere: string;
  sourceParams: unknown[];
  skipUpdateColumns?: string[];
  transform?: (row: QueryResultRow, clientMap: ClientMap) => QueryResultRow;
};

type ColumnMeta = {
  columnName: string;
  udtName: string;
};

const DEFAULT_TENANTS: TenantKey[] = ['apex-retail', 'meridian-health', 'first-capital'];

const TENANT_ALIASES: Record<TenantKey, string[]> = {
  'apex-retail': ['apex-retail', 'apexretail'],
  'meridian-health': ['meridian-health', 'meridian'],
  'first-capital': ['first-capital', 'firstcapital', 'arcturus', 'brindlemark'],
};

function parseArgs() {
  const args = process.argv.slice(2);
  const tenantArg = valueAfter(args, '--tenant');
  const dryRun = args.includes('--dry-run');
  const replace = args.includes('--replace');
  const tenants = tenantArg
    ? tenantArg.split(',').map((value) => value.trim()).filter(Boolean) as TenantKey[]
    : DEFAULT_TENANTS;

  for (const tenant of tenants) {
    if (!DEFAULT_TENANTS.includes(tenant)) {
      throw new Error(`Unsupported tenant "${tenant}". Expected one of ${DEFAULT_TENANTS.join(', ')}.`);
    }
  }

  return { tenants, dryRun, replace };
}

function valueAfter(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

function getUrl(name: string, aliases: string[] = []): string {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`${name} is required.`);
}

function makeClient(connectionString: string): Client {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

async function getTableColumnMeta(client: Client, table: string): Promise<ColumnMeta[]> {
  const result = await client.query<{ column_name: string; udt_name: string }>(
    `
      select column_name, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `,
    [table],
  );
  return result.rows.map((row) => ({ columnName: row.column_name, udtName: row.udt_name }));
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>("select to_regclass($1) is not null as exists", [`public.${table}`]);
  return Boolean(result.rows[0]?.exists);
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function selectRows(client: Client, table: string, whereSql: string, params: unknown[]): Promise<QueryResultRow[]> {
  const exists = await tableExists(client, table);
  if (!exists) return [];
  const result = await client.query(`select * from ${table} where ${whereSql}`, params);
  return result.rows;
}

async function upsertRows(
  client: Client,
  table: string,
  rows: QueryResultRow[],
  conflictColumns: string[],
  sourceLabel: string,
  skipUpdateColumns: string[] = [],
): Promise<number> {
  if (rows.length === 0) return 0;
  const targetColumnMeta = await getTableColumnMeta(client, table);
  const targetColumns = targetColumnMeta.map((column) => column.columnName);
  const targetColumnTypes = new Map(targetColumnMeta.map((column) => [column.columnName, column.udtName]));
  if (targetColumns.length === 0) throw new Error(`Target table ${table} does not exist.`);

  const rowColumns = Object.keys(rows[0] ?? {});
  const columns = targetColumns.filter((column) => rowColumns.includes(column));
  if (columns.length === 0) return 0;

  const updateColumns = columns.filter((column) => !conflictColumns.includes(column) && !skipUpdateColumns.includes(column));
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  const quotedConflict = conflictColumns.map((column) => `"${column}"`).join(', ');
  const updateSql = updateColumns.length
    ? `do update set ${updateColumns.map((column) => `"${column}" = excluded."${column}"`).join(', ')}`
    : 'do nothing';

  const batchSize = 200;
  let copied = 0;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values: unknown[] = [];
    const tuples = batch.map((row) => {
      const placeholders = columns.map((column) => {
        const columnType = targetColumnTypes.get(column);
        values.push(prepareValue(row[column], columnType));
        const cast = columnType === 'jsonb' || columnType === 'json'
          ? `::${columnType}`
          : '';
        return `$${values.length}${cast}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await client.query(
      `
        insert into ${table} (${quotedColumns})
        values ${tuples.join(', ')}
        on conflict (${quotedConflict}) ${updateSql}
      `,
      values,
    );
    copied += batch.length;
  }

  console.log(`${sourceLabel}: copied ${copied} rows into ${table}`);
  return copied;
}

function prepareValue(value: unknown, columnType: string | undefined): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (columnType === 'jsonb' || columnType === 'json') {
    return JSON.stringify(value);
  }
  return value;
}

async function ensureClientMap(source: Client, target: Client, tenants: TenantKey[]): Promise<ClientMap> {
  const sourceRows = await selectRows(
    source,
    'data_inventory_segments',
    'tenant_key = any($1::text[])',
    [uniqueValues(tenants.flatMap((tenant) => TENANT_ALIASES[tenant]))],
  );
  const sourceClientIds = uniqueValues(sourceRows.map((row) => String(row.client_id ?? '')));
  if (sourceClientIds.length === 0) return new Map();

  const sourceClients = await source.query('select * from clients where id = any($1::uuid[])', [sourceClientIds]);
  const map: ClientMap = new Map();

  for (const sourceClient of sourceClients.rows) {
    const byName = await target.query<{ id: string }>(
      `
        select id from clients
        where ($3::text is not null and tenant_key = $3::text)
           or name = $1
           or legal_name = $2
           or ($2 is not null and name = $2)
           or ($1 is not null and legal_name = $1)
        order by created_at
        limit 1
      `,
      [sourceClient.name, sourceClient.legal_name, sourceClient.tenant_key ?? null],
    );

    if (byName.rows[0]?.id) {
      const targetId = byName.rows[0].id;
      const matchedByTenantKeyOnly = Boolean(sourceClient.tenant_key) && sourceClient.name !== undefined;
      const updateColumns = matchedByTenantKeyOnly
        ? []
        : ['legal_name', 'billing_email', 'stripe_customer_id', 'industry_code']
          .filter((column) => sourceClient[column] !== undefined);
      if (updateColumns.length) {
        await target.query(
          `
            update clients
            set ${updateColumns.map((column, idx) => `${column} = $${idx + 2}`).join(', ')},
                updated_at = coalesce($${updateColumns.length + 2}::timestamptz, updated_at)
            where id = $1
          `,
          [targetId, ...updateColumns.map((column) => sourceClient[column]), sourceClient.updated_at ?? null],
        );
      }
      map.set(String(sourceClient.id), targetId);
      continue;
    }

    await upsertRows(target, 'clients', [sourceClient], ['id'], 'clients');
    map.set(String(sourceClient.id), String(sourceClient.id));
  }

  return map;
}

function remapClientId(row: QueryResultRow, clientMap: ClientMap): QueryResultRow {
  const next = { ...row };
  if (next.client_id) {
    next.client_id = clientMap.get(String(next.client_id)) ?? next.client_id;
  }
  return next;
}

function remapKpi(row: QueryResultRow, clientMap: ClientMap, personMap: IdMap): QueryResultRow {
  const next = remapClientId(row, clientMap);
  if (next.owner_person_id) {
    next.owner_person_id = personMap.get(String(next.owner_person_id)) ?? null;
  }
  // These references are optional context affordances. The Azure lab copy is
  // allowed to omit the referenced dimension rows while preserving the KPI row.
  for (const column of ['benchmark_peer_cohort_id', 'reasoning_scope_id', 'disclosure_scope_id']) {
    if (next[column]) next[column] = null;
  }
  return next;
}

function remapPatternPack(row: QueryResultRow, clientMap: ClientMap): QueryResultRow {
  const next = remapClientId(row, clientMap);
  for (const column of ['reasoning_scope_id', 'disclosure_scope_id']) {
    if (next[column]) next[column] = null;
  }
  return next;
}

function remapEngagement(row: QueryResultRow, clientMap: ClientMap, personMap: IdMap, teamMap: IdMap): QueryResultRow {
  const next = remapClientId(row, clientMap);
  for (const column of ['sponsor_person_id', 'co_sponsor_person_id', 'maestro_person_id', 'phase_locked_by_user_id']) {
    if (next[column]) {
      next[column] = personMap.get(String(next[column])) ?? next[column];
    }
  }
  if (next.team_id) {
    next.team_id = teamMap.get(String(next.team_id)) ?? next.team_id;
  }
  return next;
}

async function getEngagementIdsForSource(source: Client, sourceClientIds: string[]): Promise<string[]> {
  if (sourceClientIds.length === 0 || !(await tableExists(source, 'engagements'))) return [];
  const result = await source.query<{ id: string }>('select id from engagements where client_id::text = any($1::text[])', [sourceClientIds]);
  return result.rows.map((row) => row.id);
}

async function getReferencedPersonIdsForSource(source: Client, sourceClientIds: string[]): Promise<string[]> {
  if (sourceClientIds.length === 0 || !(await tableExists(source, 'engagements'))) return [];
  const result = await source.query<{ id: string }>(
    `
      select distinct person_id::text as id
      from engagements
      cross join lateral (
        values
          (sponsor_person_id),
          (co_sponsor_person_id),
          (maestro_person_id),
          (phase_locked_by_user_id)
      ) refs(person_id)
      where client_id::text = any($1::text[])
        and person_id is not null
    `,
    [sourceClientIds],
  );
  return result.rows.map((row) => row.id);
}

async function getReferencedTeamIdsForSource(source: Client, sourceClientIds: string[]): Promise<string[]> {
  if (sourceClientIds.length === 0 || !(await tableExists(source, 'engagements'))) return [];
  const result = await source.query<{ id: string }>(
    'select distinct team_id::text as id from engagements where client_id::text = any($1::text[]) and team_id is not null',
    [sourceClientIds],
  );
  return result.rows.map((row) => row.id);
}

async function ensurePersonMap(source: Client, target: Client, sourcePersonIds: string[]): Promise<IdMap> {
  const map: IdMap = new Map();
  if (sourcePersonIds.length === 0 || !(await tableExists(source, 'persons'))) return map;
  const sourcePeople = await source.query('select * from persons where id::text = any($1::text[])', [sourcePersonIds]);
  for (const sourcePerson of sourcePeople.rows) {
    const matched = await target.query<{ id: string }>(
      `
        select id from persons
        where id = $1::uuid
           or ($2::text is not null and graph_node_id = $2::text)
           or ($3::text is not null and email = $3::text)
        order by created_at
        limit 1
      `,
      [sourcePerson.id, sourcePerson.graph_node_id ?? null, sourcePerson.email ?? null],
    );
    if (matched.rows[0]?.id) {
      const targetId = matched.rows[0].id;
      const updateColumns = Object.keys(sourcePerson).filter((column) => column !== 'id' && sourcePerson[column] !== undefined);
      if (updateColumns.length) {
        await target.query(
          `
            update persons
            set ${updateColumns.map((column, idx) => `"${column}" = $${idx + 2}`).join(', ')}
            where id = $1
          `,
          [targetId, ...updateColumns.map((column) => prepareValue(sourcePerson[column], column.endsWith('profile') || ['communication_style', 'working_rhythm', 'maestro_profile'].includes(column) ? 'jsonb' : undefined))],
        );
      }
      map.set(String(sourcePerson.id), targetId);
      continue;
    }
    await upsertRows(target, 'persons', [sourcePerson], ['id'], 'persons');
    map.set(String(sourcePerson.id), String(sourcePerson.id));
  }
  return map;
}

async function ensureTeamMap(source: Client, target: Client, sourceTeamIds: string[]): Promise<IdMap> {
  const map: IdMap = new Map();
  if (sourceTeamIds.length === 0 || !(await tableExists(source, 'teams'))) return map;
  const sourceTeams = await source.query('select * from teams where id::text = any($1::text[])', [sourceTeamIds]);
  for (const sourceTeam of sourceTeams.rows) {
    const matched = await target.query<{ id: string }>(
      `
        select id from teams
        where id = $1::uuid
           or ($2::text is not null and slug = $2::text)
        order by created_at
        limit 1
      `,
      [sourceTeam.id, sourceTeam.slug ?? null],
    );
    if (matched.rows[0]?.id) {
      const targetId = matched.rows[0].id;
      const updateColumns = Object.keys(sourceTeam).filter((column) => column !== 'id' && sourceTeam[column] !== undefined);
      if (updateColumns.length) {
        await target.query(
          `
            update teams
            set ${updateColumns.map((column, idx) => `"${column}" = $${idx + 2}`).join(', ')}
            where id = $1
          `,
          [targetId, ...updateColumns.map((column) => sourceTeam[column])],
        );
      }
      map.set(String(sourceTeam.id), targetId);
      continue;
    }
    await upsertRows(target, 'teams', [sourceTeam], ['id'], 'teams');
    map.set(String(sourceTeam.id), String(sourceTeam.id));
  }
  return map;
}

async function replaceTenantRows(target: Client, tenants: TenantKey[], targetClientIds: string[]): Promise<void> {
  const aliases = uniqueValues(tenants.flatMap((tenant) => TENANT_ALIASES[tenant]));
  const deletes: Array<[string, string, unknown[]]> = [
    ['gate_criterion_states', 'gate_criteria_id in (select id from gate_criteria where program_id in (select id from engagements where client_id::text = any($1::text[])))', [targetClientIds]],
    ['gate_criteria', 'program_id in (select id from engagements where client_id::text = any($1::text[]))', [targetClientIds]],
    ['pattern_packs', 'client_id::text = any($1::text[])', [targetClientIds]],
    ['kpis', 'client_id::text = any($1::text[])', [targetClientIds]],
    ['source_events', 'client_key = any($1::text[])', [aliases]],
    ['enterprise_context_chunks', 'tenant_key = any($1::text[])', [aliases]],
    ['enterprise_graph_edges', 'tenant_key = any($1::text[])', [aliases]],
    ['enterprise_graph_nodes', 'tenant_key = any($1::text[])', [aliases]],
    ['data_inventory_audit_log', 'tenant_key = any($1::text[])', [aliases]],
    ['data_ingestion_runs', 'tenant_key = any($1::text[])', [aliases]],
    ['data_inventory_records', 'tenant_key = any($1::text[])', [aliases]],
    ['data_inventory_segments', 'tenant_key = any($1::text[])', [aliases]],
    ['tenant_expected_baselines', 'tenant_key = any($1::text[])', [aliases]],
  ];

  for (const [table, whereSql, params] of deletes) {
    if (!(await tableExists(target, table))) continue;
    const result = await target.query(`delete from ${table} where ${whereSql}`, params);
    console.log(`replace: deleted ${result.rowCount ?? 0} rows from ${table}`);
  }
}

async function copySpec(source: Client, target: Client, spec: CopySpec, clientMap: ClientMap, dryRun: boolean): Promise<number> {
  const rows = await selectRows(source, spec.table, spec.sourceWhere, spec.sourceParams);
  const transformed = rows.map((row) => spec.transform ? spec.transform(row, clientMap) : row);
  if (dryRun) {
    console.log(`dry-run: would copy ${transformed.length} rows into ${spec.table}`);
    return transformed.length;
  }
  return upsertRows(target, spec.table, transformed, spec.conflictColumns, spec.table, spec.skipUpdateColumns);
}

async function main() {
  const { tenants, dryRun, replace } = parseArgs();
  const sourceUrl = getUrl('SOURCE_DATABASE_URL', ['DATABASE_URL']);
  const targetUrl = getUrl('TARGET_DATABASE_URL', ['DATABASE_URL']);
  const source = makeClient(sourceUrl);
  const target = makeClient(targetUrl);
  await source.connect();
  await target.connect();

  try {
    const aliases = uniqueValues(tenants.flatMap((tenant) => TENANT_ALIASES[tenant]));
    const clientMap = await ensureClientMap(source, target, tenants);
    const sourceClientIds = [...clientMap.keys()];
    const targetClientIds = [...clientMap.values()];
    const sourceEngagementIds = await getEngagementIdsForSource(source, sourceClientIds);
    const sourcePersonIds = await getReferencedPersonIdsForSource(source, sourceClientIds);
    const sourceTeamIds = await getReferencedTeamIdsForSource(source, sourceClientIds);
    const personMap = await ensurePersonMap(source, target, sourcePersonIds);
    const teamMap = await ensureTeamMap(source, target, sourceTeamIds);

    console.log(JSON.stringify({
      tenants,
      aliases,
      sourceClientCount: sourceClientIds.length,
      targetClientCount: uniqueValues(targetClientIds).length,
      sourceEngagementCount: sourceEngagementIds.length,
      sourcePersonRefCount: sourcePersonIds.length,
      sourceTeamRefCount: sourceTeamIds.length,
      dryRun,
      replace,
    }, null, 2));

    if (replace && !dryRun) {
      await replaceTenantRows(target, tenants, targetClientIds);
    }

    const specs: CopySpec[] = [
      {
        table: 'engagements',
        conflictColumns: ['graph_node_id'],
        sourceWhere: 'client_id::text = any($1::text[])',
        sourceParams: [sourceClientIds],
        skipUpdateColumns: ['id'],
        transform: (row, map) => remapEngagement(row, map, personMap, teamMap),
      },
      {
        table: 'kpis',
        conflictColumns: ['id'],
        sourceWhere: 'client_id::text = any($1::text[])',
        sourceParams: [sourceClientIds],
        transform: (row, map) => remapKpi(row, map, personMap),
      },
      {
        table: 'pattern_packs',
        conflictColumns: ['id'],
        sourceWhere: 'client_id::text = any($1::text[])',
        sourceParams: [sourceClientIds],
        transform: remapPatternPack,
      },
      { table: 'tenant_expected_baselines', conflictColumns: ['tenant_key', 'segment_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'data_inventory_segments', conflictColumns: ['tenant_key', 'segment_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'data_inventory_records', conflictColumns: ['tenant_key', 'segment_id', 'record_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'enterprise_graph_nodes', conflictColumns: ['tenant_key', 'node_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'enterprise_graph_edges', conflictColumns: ['tenant_key', 'edge_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'enterprise_context_chunks', conflictColumns: ['tenant_key', 'chunk_id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'data_inventory_audit_log', conflictColumns: ['id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'data_ingestion_runs', conflictColumns: ['id'], sourceWhere: 'tenant_key = any($1::text[])', sourceParams: [aliases], transform: remapClientId },
      { table: 'source_events', conflictColumns: ['id'], sourceWhere: 'client_key = any($1::text[])', sourceParams: [aliases] },
      { table: 'gate_criteria', conflictColumns: ['program_id', 'stage_key', 'criterion_id'], sourceWhere: 'program_id::text = any($1::text[])', sourceParams: [sourceEngagementIds] },
      { table: 'gate_criterion_states', conflictColumns: ['id'], sourceWhere: 'gate_criteria_id in (select id from gate_criteria where program_id::text = any($1::text[]))', sourceParams: [sourceEngagementIds] },
    ];

    const copied: Record<string, number> = {};
    for (const spec of specs) {
      copied[spec.table] = await copySpec(source, target, spec, clientMap, dryRun);
    }

    console.log(JSON.stringify({ copied }, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error('x Tenant context copy failed.');
  console.error(error);
  process.exit(1);
});
