import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requireFromApp = createRequire(fs.existsSync('/app/package.json') ? '/app/package.json' : new URL('../../package.json', import.meta.url));
const { Client } = requireFromApp('pg');

const payloadUrl = process.env.V7_PAYLOAD_URL;
const defaultPayloadFile = fileURLToPath(new URL('../../datasets/lakeshore-industries-synthetic-v7-holdco/azure/v7-holdco-azure-load-payload.json', import.meta.url));
const payloadFile = process.env.V7_PAYLOAD_FILE || (fs.existsSync(defaultPayloadFile) ? defaultPayloadFile : '');
if (!payloadUrl && !payloadFile) throw new Error('V7_PAYLOAD_URL or V7_PAYLOAD_FILE is required, and the baked Lakeshore V7.1 payload was not found');
const connectionString = process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL || process.env.AZURE_DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const holdcoSqlFile = fileURLToPath(new URL('./sql/intelligence-v7-holdco-entity-spine.sql', import.meta.url));

function key(...parts) {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join(':').replace(/[^a-zA-Z0-9:_./-]+/g, '_').slice(0, 360);
}

function nodeKey(tenantKey, type, ref) {
  return key(tenantKey, type || 'unknown', ref || 'unknown').slice(0, 360);
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(String(value).replace(/[$,%]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function boolOrNull(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(text)) return true;
  if (['false', 'no', 'n', '0'].includes(text)) return false;
  return null;
}

function dateOrNull(value) {
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function batchInsert(client, table, columns, rows, conflictClause, jsonbColumns = []) {
  if (!rows.length) return;
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const values = chunk.map((row, rowIndex) => {
      const offset = rowIndex * columns.length;
      params.push(...row);
      return '(' + columns.map((col, colIndex) => {
        const p = '$' + (offset + colIndex + 1);
        return jsonbColumns.includes(col) ? p + '::jsonb' : p;
      }).join(',') + ')';
    }).join(',');
    await q(client, 'insert into ' + table + ' (' + columns.join(',') + ') values ' + values + ' ' + conflictClause, params);
  }
}

function dedupeByKey(rows, keyIndex = 0) {
  const seen = new Map();
  for (const row of rows) {
    const keyValue = row[keyIndex];
    if (!seen.has(keyValue)) seen.set(keyValue, row);
  }
  return Array.from(seen.values());
}

async function ensureSchema(client) {
  await q(client, `create schema if not exists intelligence_v7`);
  await q(client, `
    create table if not exists intelligence_v7.contract_versions (
      contract_version text primary key,
      contract_name text not null,
      status text not null default 'candidate',
      generated_from text not null,
      metadata jsonb not null default '{}'::jsonb,
      loaded_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`);
  await q(client, `
    create table if not exists intelligence_v7.dimension_registry (
      dimension_key text primary key,
      contract_version text not null references intelligence_v7.contract_versions(contract_version) on delete cascade,
      dimension_file text not null,
      dimension_label text not null,
      column_count integer not null,
      metadata jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`);
  await q(client, `
    create table if not exists intelligence_v7.column_registry (
      column_key text primary key,
      contract_version text not null,
      dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete cascade,
      column_name text not null,
      column_ordinal integer not null,
      client_field text,
      required_level text,
      allowed_format text,
      client_instruction text,
      example_value text,
      module_use text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(contract_version, dimension_key, column_name)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.tenant_pack_runs (
      run_key text primary key,
      tenant_key text not null,
      tenant_name text not null,
      contract_version text not null references intelligence_v7.contract_versions(contract_version) on delete restrict,
      source_dataset text not null,
      load_status text not null default 'loaded',
      file_count integer not null,
      row_count integer not null,
      field_count integer not null,
      graph_node_count integer not null default 0,
      relationship_edge_count integer not null default 0,
      chunk_count integer not null default 0,
      validation_report jsonb not null default '{}'::jsonb,
      loaded_at timestamptz not null default now(),
      superseded_at timestamptz,
      unique(tenant_key, contract_version, source_dataset)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.source_files (
      source_file_key text primary key,
      run_key text not null references intelligence_v7.tenant_pack_runs(run_key) on delete cascade,
      tenant_key text not null,
      contract_version text not null,
      dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
      source_file text not null,
      row_count integer not null,
      checksum_sha256 text not null,
      loaded_at timestamptz not null default now(),
      unique(run_key, source_file)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.business_records (
      record_key text primary key,
      run_key text not null references intelligence_v7.tenant_pack_runs(run_key) on delete cascade,
      tenant_key text not null,
      contract_version text not null,
      dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
      source_file_key text not null references intelligence_v7.source_files(source_file_key) on delete cascade,
      source_file text not null,
      source_row_number integer not null,
      record_id text not null,
      record_name text not null,
      entity_scope text,
      entity_name text,
      parent_entity_name text,
      used_by_entities text,
      shared_service_flag boolean,
      budget_ownership_model text,
      source_artifact_name text,
      source_validation_status text,
      source_as_of_date date,
      values_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(tenant_key, contract_version, dimension_key, source_file, source_row_number)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.record_fields (
      record_field_key text primary key,
      record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
      tenant_key text not null,
      contract_version text not null,
      dimension_key text not null references intelligence_v7.dimension_registry(dimension_key) on delete restrict,
      column_key text not null references intelligence_v7.column_registry(column_key) on delete restrict,
      column_name text not null,
      value_text text not null,
      value_number numeric,
      value_date date,
      value_bool boolean,
      source_file_key text not null references intelligence_v7.source_files(source_file_key) on delete cascade,
      source_row_number integer not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(record_key, column_name)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.graph_nodes (
      node_key text primary key,
      tenant_key text not null,
      contract_version text not null,
      node_type text not null,
      node_ref text not null,
      entity_scope text,
      entity_name text,
      source_record_key text,
      values_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(tenant_key, contract_version, node_type, node_ref)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.relationship_edges (
      edge_key text primary key,
      tenant_key text not null,
      contract_version text not null,
      relationship_id text not null,
      from_node_key text not null references intelligence_v7.graph_nodes(node_key) on delete cascade,
      to_node_key text not null references intelligence_v7.graph_nodes(node_key) on delete cascade,
      from_object_ref text not null,
      from_object_type text not null,
      relationship_type text not null,
      to_object_ref text not null,
      to_object_type text not null,
      relationship_direction text,
      evidence_ref text,
      relationship_strength text,
      quality_score numeric,
      source_record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
      values_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      unique(tenant_key, contract_version, relationship_id, source_record_key)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.chunk_registry (
      chunk_key text primary key,
      tenant_key text not null,
      contract_version text not null,
      chunk_id text not null,
      source_artifact_ref text,
      dimension text,
      fact_refs text,
      semantic_tags text,
      entity_refs text,
      retrieval_eligibility text,
      sensitivity text,
      embedding_model text,
      index_name text,
      indexed_at text,
      stale_after date,
      source_record_key text not null references intelligence_v7.business_records(record_key) on delete cascade,
      values_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(tenant_key, contract_version, chunk_id)
    )`);
  await q(client, `
    create table if not exists intelligence_v7.load_reconciliation (
      reconciliation_key text primary key,
      contract_version text not null,
      tenant_key text not null,
      dimension_key text,
      expected_rows integer,
      actual_records integer,
      actual_fields integer,
      actual_edges integer,
      actual_chunks integer,
      status text not null,
      details jsonb not null default '{}'::jsonb,
      checked_at timestamptz not null default now()
    )`);
  await q(client, `create or replace view intelligence_v7.current_tenant_pack_runs as
    select distinct on (tenant_key) *
    from intelligence_v7.tenant_pack_runs
    where load_status in ('loaded','validated') and superseded_at is null
    order by tenant_key, loaded_at desc`);
  await q(client, `create or replace view intelligence_v7.current_business_records as
    select r.* from intelligence_v7.business_records r join intelligence_v7.current_tenant_pack_runs run on run.run_key = r.run_key`);
  await q(client, `create or replace view intelligence_v7.graph_edge_health as
    select tenant_key, contract_version, count(*)::bigint as edge_count,
      count(distinct from_node_key)::bigint as from_node_count,
      count(distinct to_node_key)::bigint as to_node_count,
      count(*) filter (where quality_score is null or quality_score < 50)::bigint as weak_or_unscored_edges
    from intelligence_v7.relationship_edges group by tenant_key, contract_version`);
  for (const table of ['tenant_pack_runs','source_files','business_records','record_fields','graph_nodes','relationship_edges','chunk_registry']) {
    await q(client, 'alter table intelligence_v7.' + table + ' enable row level security');
    await q(client, 'drop policy if exists intelligence_v7_tenant_select on intelligence_v7.' + table);
    await q(client, "create policy intelligence_v7_tenant_select on intelligence_v7." + table + " for select using (tenant_key = current_setting('app.tenant_key', true) or tenant_key = current_setting('app.client_key', true) or current_setting('app.tenant_key', true) = 'internal-admin')");
  }
  await q(client, 'create index if not exists idx_intelligence_v7_records_tenant_dimension on intelligence_v7.business_records(tenant_key, dimension_key, record_name)');
  await q(client, 'create index if not exists idx_intelligence_v7_records_values_json on intelligence_v7.business_records using gin(values_json)');
  await q(client, 'create index if not exists idx_intelligence_v7_fields_tenant_column on intelligence_v7.record_fields(tenant_key, column_name)');
  await q(client, 'create index if not exists idx_intelligence_v7_nodes_tenant_type on intelligence_v7.graph_nodes(tenant_key, node_type, node_ref)');
  await q(client, 'create index if not exists idx_intelligence_v7_edges_tenant_type on intelligence_v7.relationship_edges(tenant_key, relationship_type)');
  await q(client, 'create index if not exists idx_intelligence_v7_chunks_tenant on intelligence_v7.chunk_registry(tenant_key, retrieval_eligibility)');
}

async function applyHoldcoEntitySpine(client) {
  const sql = fs.readFileSync(holdcoSqlFile, 'utf8');
  await q(client, sql);
}

const payload = payloadFile
  ? JSON.parse(fs.readFileSync(payloadFile, 'utf8'))
  : await fetch(payloadUrl).then(async (r) => {
      if (!r.ok) throw new Error('payload fetch failed: ' + r.status + ' ' + await r.text());
      return r.json();
    });

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, application_name: 'abarva-v7-loader' });
await client.connect();
const summary = { generatedAt: new Date().toISOString(), contractVersion: payload.contractVersion, tenants: [], totals: {} };
try {
  await client.query('begin');
  await ensureSchema(client);
  await q(client, `insert into intelligence_v7.contract_versions(contract_version, contract_name, status, generated_from, metadata, updated_at)
    values($1,$2,'active',$3,$4::jsonb,now())
    on conflict(contract_version) do update set status='active', metadata=excluded.metadata, updated_at=now()`,
    [payload.contractVersion, payload.contractName, payload.sourceDataDir, JSON.stringify({ generatedAt: payload.generatedAt, sourceTemplateDir: payload.sourceTemplateDir })]);

  for (const dim of payload.dimensions) {
    await q(client, `insert into intelligence_v7.dimension_registry(dimension_key, contract_version, dimension_file, dimension_label, column_count, metadata, updated_at)
      values($1,$2,$3,$4,$5,$6::jsonb,now())
      on conflict(dimension_key) do update set dimension_label=excluded.dimension_label, column_count=excluded.column_count, metadata=excluded.metadata, updated_at=now()`,
      [dim.dimensionKey, payload.contractVersion, dim.file, dim.label, dim.columns.length, JSON.stringify(dim.metadata)]);
    const columnRows = dim.columns.map((col, idx) => {
      const meta = dim.metadata.find((m) => m['Internal Field'] === col || m['Client Field'] === col) || {};
      return [
        key(payload.contractVersion, dim.dimensionKey, col),
        payload.contractVersion,
        dim.dimensionKey,
        col,
        idx + 1,
        meta['Client Field'] || col,
        meta.Required || '',
        meta['Allowed / Format'] || '',
        meta['Client Instruction'] || '',
        meta.Example || '',
        meta['Right Canvas / Module Use'] || '',
      ];
    });
    await batchInsert(client, 'intelligence_v7.column_registry',
      ['column_key','contract_version','dimension_key','column_name','column_ordinal','client_field','required_level','allowed_format','client_instruction','example_value','module_use'],
      columnRows,
      `on conflict(column_key) do update set client_field=excluded.client_field, required_level=excluded.required_level, allowed_format=excluded.allowed_format, client_instruction=excluded.client_instruction, example_value=excluded.example_value, module_use=excluded.module_use, updated_at=now()`);
  }

  for (const tenant of payload.tenantPacks) {
    const runKey = key('run', payload.contractVersion, tenant.tenantKey);
    await q(client, `update intelligence_v7.tenant_pack_runs set superseded_at=now(), load_status='superseded' where tenant_key=$1 and run_key<>$2 and superseded_at is null`, [tenant.tenantKey, runKey]);
    await q(client, `delete from intelligence_v7.tenant_pack_runs where run_key=$1`, [runKey]);
    const expectedRows = tenant.files.reduce((sum, f) => sum + f.rows.length, 0);
    await q(client, `insert into intelligence_v7.tenant_pack_runs(run_key, tenant_key, tenant_name, contract_version, source_dataset, load_status, file_count, row_count, field_count)
      values($1,$2,$3,$4,$5,'loaded',$6,$7,0)`,
      [runKey, tenant.tenantKey, tenant.tenantName, payload.contractVersion, payload.sourceDataDir, tenant.files.length, expectedRows]);

    let fieldCount = 0;
    let edgeCount = 0;
    let chunkCount = 0;
    for (const file of tenant.files) {
      const sourceFileKey = key('sf', runKey, file.file);
      await q(client, `insert into intelligence_v7.source_files(source_file_key, run_key, tenant_key, contract_version, dimension_key, source_file, row_count, checksum_sha256)
        values($1,$2,$3,$4,$5,$6,$7,$8)`,
        [sourceFileKey, runKey, tenant.tenantKey, payload.contractVersion, file.dimensionKey, file.file, file.rows.length, file.checksumSha256]);

      const observedColumnNames = Array.from(new Set(file.rows.flatMap((item) => Object.keys(item.values || {}))));
      const observedColumnRows = observedColumnNames.map((col, idx) => [
        key(payload.contractVersion, file.dimensionKey, col),
        payload.contractVersion,
        file.dimensionKey,
        col,
        1000 + idx,
        col,
        'observed',
        'source provided',
        'Observed in loaded source data; not part of the formal client template.',
        '',
        'lineage and source audit',
      ]);
      await batchInsert(client, 'intelligence_v7.column_registry',
        ['column_key','contract_version','dimension_key','column_name','column_ordinal','client_field','required_level','allowed_format','client_instruction','example_value','module_use'],
        observedColumnRows,
        `on conflict(column_key) do nothing`);

      const businessRows = [];
      const fieldRows = [];
      const nodeRows = [];
      const edgeRows = [];
      const chunkRows = [];

      for (const item of file.rows) {
        const row = item.values;
        const recordKey = key('rec', runKey, file.dimensionKey, item.sourceRowNumber);
        const recordId = row.record_id || row.chunk_id || row.relationship_id || key(file.dimensionKey, item.sourceRowNumber);
        businessRows.push([
          recordKey, runKey, tenant.tenantKey, payload.contractVersion, file.dimensionKey, sourceFileKey, file.file, item.sourceRowNumber,
          recordId, item.recordName, row.entity_scope || null, row.entity_name || null, row.parent_entity_name || null,
          row.used_by_entities || null, boolOrNull(row.shared_service_flag), row.budget_ownership_model || null,
          row.source_artifact_name || null, row.source_validation_status || row.validation_status || null, dateOrNull(row.source_as_of_date), JSON.stringify(row)
        ]);

        const objectType = file.dimensionKey.replace(/^v7_\d+_/, '');
        nodeRows.push([
          nodeKey(tenant.tenantKey, objectType, item.recordName), tenant.tenantKey, payload.contractVersion, objectType, item.recordName,
          row.entity_scope || null, row.entity_name || null, recordKey, JSON.stringify({ dimensionKey: file.dimensionKey, recordName: item.recordName })
        ]);

        for (const [col, value] of Object.entries(row)) {
          const text = String(value ?? '');
          if (!text) continue;
          fieldRows.push([
            key('field', recordKey, col), recordKey, tenant.tenantKey, payload.contractVersion, file.dimensionKey,
            key(payload.contractVersion, file.dimensionKey, col), col, text, numberOrNull(text), dateOrNull(text), boolOrNull(text),
            sourceFileKey, item.sourceRowNumber
          ]);
        }

        if (file.file === 'V7_12_relationships_graph_edges.csv') {
          const fromType = row.from_object_type || 'unknown';
          const toType = row.to_object_type || 'unknown';
          const fromKey = nodeKey(tenant.tenantKey, fromType, row.from_object_ref);
          const toKey = nodeKey(tenant.tenantKey, toType, row.to_object_ref);
          nodeRows.push([fromKey, tenant.tenantKey, payload.contractVersion, fromType, row.from_object_ref, row.entity_scope || null, row.entity_name || null, recordKey, JSON.stringify({ relationshipEndpoint: 'from' })]);
          nodeRows.push([toKey, tenant.tenantKey, payload.contractVersion, toType, row.to_object_ref, row.entity_scope || null, row.entity_name || null, recordKey, JSON.stringify({ relationshipEndpoint: 'to' })]);
          edgeRows.push([
            key('edge', recordKey), tenant.tenantKey, payload.contractVersion, row.relationship_id || key(item.sourceRowNumber, row.from_object_ref, row.relationship_type, row.to_object_ref),
            fromKey, toKey, row.from_object_ref || '', fromType, row.relationship_type || '', row.to_object_ref || '', toType,
            row.relationship_direction || '', row.evidence_ref || '', row.relationship_strength || '', numberOrNull(row.quality_score), recordKey, JSON.stringify(row)
          ]);
        }

        if (file.file === 'V7_20_chunk_retrieval_registry.csv') {
          chunkRows.push([
            key('chunk', recordKey), tenant.tenantKey, payload.contractVersion, row.chunk_id || key(item.sourceRowNumber),
            row.source_artifact_ref || '', row.dimension || '', row.fact_refs || '', row.semantic_tags || '', row.entity_refs || '',
            row.retrieval_eligibility || '', row.sensitivity || '', row.embedding_model || '', row.index_name || '', row.indexed_at || '',
            dateOrNull(row.stale_after), recordKey, JSON.stringify(row)
          ]);
        }
      }

      await batchInsert(client, 'intelligence_v7.business_records',
        ['record_key','run_key','tenant_key','contract_version','dimension_key','source_file_key','source_file','source_row_number','record_id','record_name','entity_scope','entity_name','parent_entity_name','used_by_entities','shared_service_flag','budget_ownership_model','source_artifact_name','source_validation_status','source_as_of_date','values_json'],
        businessRows,
        `on conflict(record_key) do update set record_name=excluded.record_name, values_json=excluded.values_json, updated_at=now()`,
        ['values_json']);
      await batchInsert(client, 'intelligence_v7.graph_nodes',
        ['node_key','tenant_key','contract_version','node_type','node_ref','entity_scope','entity_name','source_record_key','values_json'],
        dedupeByKey(nodeRows),
        `on conflict(node_key) do update set values_json=excluded.values_json, updated_at=now()`,
        ['values_json']);
      await batchInsert(client, 'intelligence_v7.record_fields',
        ['record_field_key','record_key','tenant_key','contract_version','dimension_key','column_key','column_name','value_text','value_number','value_date','value_bool','source_file_key','source_row_number'],
        fieldRows,
        `on conflict(record_field_key) do update set value_text=excluded.value_text, value_number=excluded.value_number, value_date=excluded.value_date, value_bool=excluded.value_bool, updated_at=now()`);
      await batchInsert(client, 'intelligence_v7.relationship_edges',
        ['edge_key','tenant_key','contract_version','relationship_id','from_node_key','to_node_key','from_object_ref','from_object_type','relationship_type','to_object_ref','to_object_type','relationship_direction','evidence_ref','relationship_strength','quality_score','source_record_key','values_json'],
        edgeRows,
        `on conflict(edge_key) do update set relationship_type=excluded.relationship_type, values_json=excluded.values_json`,
        ['values_json']);
      await batchInsert(client, 'intelligence_v7.chunk_registry',
        ['chunk_key','tenant_key','contract_version','chunk_id','source_artifact_ref','dimension','fact_refs','semantic_tags','entity_refs','retrieval_eligibility','sensitivity','embedding_model','index_name','indexed_at','stale_after','source_record_key','values_json'],
        chunkRows,
        `on conflict(chunk_key) do update set semantic_tags=excluded.semantic_tags, retrieval_eligibility=excluded.retrieval_eligibility, values_json=excluded.values_json, updated_at=now()`,
        ['values_json']);

      fieldCount += fieldRows.length;
      edgeCount += edgeRows.length;
      chunkCount += chunkRows.length;
    }

    const nodeCount = await q(client, `select count(*)::int as c from intelligence_v7.graph_nodes where tenant_key=$1 and contract_version=$2`, [tenant.tenantKey, payload.contractVersion]);
    await q(client, `update intelligence_v7.tenant_pack_runs set field_count=$1, graph_node_count=$2, relationship_edge_count=$3, chunk_count=$4, load_status='validated', validation_report=$5::jsonb where run_key=$6`,
      [fieldCount, nodeCount.rows[0].c, edgeCount, chunkCount, JSON.stringify({ expectedRows, fieldCount, edgeCount, chunkCount }), runKey]);
    summary.tenants.push({ tenantKey: tenant.tenantKey, files: tenant.files.length, rows: expectedRows, fields: fieldCount, graphNodes: nodeCount.rows[0].c, relationshipEdges: edgeCount, chunks: chunkCount });
  }

  await applyHoldcoEntitySpine(client);

  const counts = await q(client, `
    select 'business_records' as name, count(*)::bigint as count from intelligence_v7.business_records where contract_version=$1
    union all select 'record_fields', count(*)::bigint from intelligence_v7.record_fields where contract_version=$1
    union all select 'relationship_edges', count(*)::bigint from intelligence_v7.relationship_edges where contract_version=$1
    union all select 'graph_nodes', count(*)::bigint from intelligence_v7.graph_nodes where contract_version=$1
    union all select 'chunk_registry', count(*)::bigint from intelligence_v7.chunk_registry where contract_version=$1
    union all select 'source_files', count(*)::bigint from intelligence_v7.source_files where contract_version=$1
  `, [payload.contractVersion]);
  const graphHealth = await q(client, `select * from intelligence_v7.graph_edge_health where contract_version=$1 order by tenant_key`, [payload.contractVersion]);
  const dimCounts = await q(client, `
    select tenant_key, dimension_key, count(*)::int as actual_records
    from intelligence_v7.business_records
    where contract_version=$1
    group by tenant_key, dimension_key
    order by tenant_key, dimension_key
  `, [payload.contractVersion]);
  const entityCounts = await q(client, `
    select entity_scope, count(*)::int as count
    from intelligence_v7.entity_registry
    where contract_version=$1
    group by entity_scope
    order by entity_scope
  `, [payload.contractVersion]);
  const entityCoverage = await q(client, `
    select entity_name, dimension_key, record_count
    from intelligence_v7.entity_dimension_coverage
    where tenant_key='lakeshore-industries' and contract_version=$1
    order by entity_name, dimension_key
  `, [payload.contractVersion]);
  summary.totals = Object.fromEntries(counts.rows.map((r) => [r.name, Number(r.count)]));
  summary.graphHealth = graphHealth.rows;
  summary.dimensionCounts = dimCounts.rows;
  summary.entityRegistry = entityCounts.rows;
  summary.entityCoverageRows = entityCoverage.rows.length;

  await client.query('commit');
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
} catch (e) {
  await client.query('rollback');
  console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), stack: e?.stack }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end();
}
