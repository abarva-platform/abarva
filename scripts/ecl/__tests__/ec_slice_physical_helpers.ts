import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { EcPrivateCandidateEnvelope } from '../ec_private_candidate_types';
import { EC_PRIVATE_TYPE_MAP } from '../ec_private_candidate_types';

const guardedClients = new WeakSet<pg.Client>();

export function disposableConnection(): pg.Client {
  const raw = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? '';
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    url.pathname !== '/ecl_admission_test' || url.search || url.hash) {
    throw new Error('Only explicit loopback ecl_admission_test is allowed');
  }
  const client = new pg.Client({ connectionString: raw });
  guardedClients.add(client);
  return client;
}

async function assertDisposableServer(db: pg.Client) {
  if (!guardedClients.has(db)) throw new Error('An unguarded database client is not allowed');
  // A CI service reports its container address; the validated client URI is loopback.
  const {rows:[scope]} = await db.query('select current_database() as db');
  if (scope.db !== 'ecl_admission_test') {
    throw new Error('Connected server is not the disposable loopback database');
  }
}

export async function initializeDisposableSchema(db: pg.Client) {
  await assertDisposableServer(db);
  const sql = (relative: string) => db.query(readFileSync(new URL(`../../../${relative}`, import.meta.url), 'utf8'));
  if (!(await db.query("select to_regclass('ecl_context.object') as relation")).rows[0].relation) {
    await sql('supabase/migrations/20260831031000_ecl_substrate_baseline.sql');
    await sql('supabase/migrations/20261001183000_ecl_enterprise_context_admission.sql');
  }
  await db.query(`do $$ begin
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
  end $$`);
  await sql('supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql');
  await sql('docs/architecture/sql-drafts/ec_slice_context_v0.sql');
  await sql('docs/architecture/sql-drafts/ec_slice_context_v0.sql');
  // Fixture catalog metadata, not source facts. Narrow semantic types stay separate.
  const countingClasses:Record<string,string> = {
    enterprise:'enterprise_scope',business_segment:'business_entity',business_function:'business_entity',
    organization:'business_entity',process:'business_entity',application:'business_entity',
    application_deployment:'deployment_instance',data_platform:'technical_component',data_product:'business_entity',
    infrastructure:'technical_component',vendor:'commercial_entity',contract:'commercial_entity',program:'initiative',
    metric:'metric_definition',risk:'risk_control',control:'risk_control',ai_program:'initiative',
    ai_use_case:'business_entity',ai_tool:'technical_component',persona:'persona',
    application_module:'context_detail',data_flow:'context_detail',spend_line:'context_detail',
    evidence_request:'context_detail',leadership_observation:'context_detail',strategic_priority:'context_detail',
    capability:'business_entity',initiative:'initiative',
  };
  for (const type of new Set(Object.values(EC_PRIVATE_TYPE_MAP).filter((value) => value !== null))) {
    const countingClass=countingClasses[type];
    if (!countingClass) throw new Error('Fixture catalog type has no declared counting class');
    await db.query(`insert into ecl_context.object_type_catalog
      (object_type,display_label,grain,counting_class,description)
      values ($1,$1,$1,$2,'Disposable admission metadata') on conflict do nothing`, [type,countingClass]);
  }
}

const TABLES = new Set([
  'ecl_source.source_file', 'ecl_source.source_record', 'ecl_source.document', 'ecl_source.document_extraction',
  'ecl_context.object', 'ecl_context.assertion', 'ecl_context.metric_definition',
  'ecl_context.measure', 'ecl_context.relationship', 'ecl_context.rule_evaluation',
  'intelligence_v6.graph_nodes', 'intelligence_v6.graph_edges', 'intelligence_v6.graph_quality_reports',
]);

export async function insertFixtureRow(db: pg.Client, table: string, row: Record<string, unknown>) {
  await assertDisposableServer(db);
  if (!TABLES.has(table)) throw new Error('Not an isolated contract-proof table');
  const entries = Object.entries(row);
  if (entries.some(([key]) => !/^[a-z_]+$/.test(key))) throw new Error('Invalid column');
  const json = new Set(['metadata','findings','source_evidence_refs']);
  const values = entries.map(([key, value]) =>
    value !== null && (key.endsWith('_json') || json.has(key)) ? JSON.stringify(value) : value);
  await db.query(`insert into ${table} (${entries.map(([key]) => `"${key}"`).join(',')})
    values (${values.map((_, index) => `$${index + 1}`).join(',')})`, values);
}

/** Test-only writer. No production URI, registry load override or external connection. */
export async function writeIsolatedEnvelope(db: pg.Client, envelope: EcPrivateCandidateEnvelope) {
  await assertDisposableServer(db);
  const { tenant_key, assessment_id } = envelope.binding;
  if (assessment_id !== 'ec-disposable-proof-v0') throw new Error('Only the isolated proof assessment is allowed');
  await db.query('begin');
  try {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`ec-proof:${tenant_key}:${assessment_id}`]);
    const occupied = await db.query(`select exists (
      select 1 from ecl_context.object where tenant_key=$1 and assessment_id=$2
      union all select 1 from ecl_source.source_file where tenant_key=$1 and assessment_id=$2
      union all select 1 from ecl_context.rule_evaluation where tenant_key=$1 and assessment_id=$2
    ) as occupied`, [tenant_key, assessment_id]);
    if (occupied.rows[0].occupied) throw new Error('Occupied assessment; replay refused');
    for (const row of envelope.source_file) await insertFixtureRow(db,'ecl_source.source_file', {
      id:row.id,tenant_key,assessment_id,source_type:row.source_type,source_owner:row.source_owner,
      file_name:row.file_name,blob_uri:`urn:disposable:raw:${row.file_hash}`,file_hash:row.file_hash,
      source_date:row.source_date,received_at:row.received_at,access_class:row.access_class,
      quality_state:row.quality_state,origin:row.origin,metadata_json:{ candidate:row },
    });
    for (const row of envelope.source_record) await insertFixtureRow(db,'ecl_source.source_record', {
      id:row.id,tenant_key,assessment_id,source_file_id:row.source_file_id,native_id:row.native_id,
      record_type:row.record_type,row_number:row.row_number,payload_json:row.payload_json,
      parse_state:row.parse_state,parse_notes:'Isolated fictional contract proof; not client-attested.',
      attributes_json:{...row.attributes_json,candidate:row},
    });
    for (const row of envelope.object) await insertFixtureRow(db,'ecl_context.object', {
      id:row.id,tenant_key,assessment_id,object_key:row.object_key,object_type:row.object_type,
      display_name:row.display_name,lifecycle_state:'candidate',source_record_id:row.source_record_id,
      basis:row.basis,value_state:row.value_state,review_state:row.review_state,
      attributes_json:{...row.attributes_json,canonical_semantic_type:row.canonical_semantic_type,candidate:row},
    });
    for (const row of envelope.document) await insertFixtureRow(db,'ecl_source.document', {
      id:row.id,tenant_key,assessment_id,source_file_id:row.source_file_id,document_key:row.document_key,
      document_type:'interview_notes',title:row.title,file_hash:row.file_hash,
      access_class:'restricted',review_state:'not_reviewed',
    });
    for (const row of envelope.evidence_item) {
      const file = envelope.source_file.find(file=>file.file_name===row.evidence_locator.file_path);
      const source = envelope.source_record.find(source=>source.source_file_id===file?.id && source.record_type==='text');
      if (!source || typeof source.payload_json!=='string') throw new Error('Evidence excerpt lacks exact source bytes');
      const start=Number(row.evidence_locator.line_start), end=Number(row.evidence_locator.line_end);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) throw new Error('Evidence excerpt needs line bounds');
      const excerpt=source.payload_json.split('\n').slice(start-1,end).join('\n');
      await insertFixtureRow(db,'ecl_source.document_extraction',{
        id:row.id,tenant_key,assessment_id,document_id:row.document_id,field_key:'fictional_source_excerpt',
        extracted_value:excerpt,normalized_value_json:{candidate:row},page_number:null,
        span_reference:JSON.stringify(row.evidence_locator),basis:'source_recorded',confidence:null,
        human_verification_state:'unverified',
      });
    }
    for (const row of envelope.assertion) await insertFixtureRow(db,'ecl_context.assertion', {
      id:row.id,tenant_key,assessment_id,subject_id:row.subject_id,subject_kind:row.subject_kind,
      subject_object_id:row.subject_object_id,semantic_key:row.predicate,value_json:row.value_json,
      missing_reason:row.missing_reason,source_record_id:row.source_record_id,source_version:row.source_version,
      source_locator_json:row.source_locator,valid_from:row.valid_from,valid_to:row.valid_to,
      known_at:row.known_at,basis:row.fact_basis,review_state:row.review_state,attributes_json:{candidate:row},
    });
    for (const metricKey of new Set(envelope.measure.map((row) => row.metric_key))) {
      const row = envelope.measure.find((row) => row.metric_key === metricKey)!;
      await insertFixtureRow(db,'ecl_context.metric_definition', {
        id:row.definition_id,tenant_key,metric_key:metricKey,metric_name:metricKey,
        definition:'Unreviewed fictional definition; full source contract retained on observation.',
        unit:row.unit,directionality:'neutral',cadence:'point_in_time',aggregation_rule:'none',
      });
    }
    for (const row of envelope.measure) await insertFixtureRow(db,'ecl_context.measure', {
      id:row.id,tenant_key,assessment_id,subject_object_id:row.subject_object_id,metric_key:row.metric_key,
      value_number:row.value_number,value_text:row.value_text,unit:row.unit,
      period_start:row.period_start,period_end:row.period_end,scenario:row.scenario,
      source_record_id:row.source_record_id,basis:row.basis,value_state:row.value_state,
      quality_state:row.quality_state,review_state:row.review_state,definition_version:row.definition_version,
      population_json:row.population_json,dimensions_json:row.dimensions_json,calendar:row.calendar,
      timezone:row.timezone,method:row.method,currency:row.currency,observation_role:row.observation_role,
      observation_key:row.observation_key,attributes_json:{candidate:row},
    });
    for (const row of envelope.relationship) await insertFixtureRow(db,'ecl_context.relationship', {
      id:row.id,tenant_key,assessment_id,from_object_id:row.from_object_id,to_object_id:row.to_object_id,
      relationship_type:row.relationship_type,source_record_id:row.source_record_id,
      basis:row.basis,value_state:row.value_state,review_state:row.review_state,source_version:row.source_version,
      valid_from:row.valid_from,valid_to:row.valid_to,known_at:row.known_at,qualifiers_json:row.qualifiers_json,
      attributes_json:{...row.attributes_json,candidate:row},
    });
    await db.query('commit');
  } catch (error) {
    await db.query('rollback');
    throw error;
  }
}
