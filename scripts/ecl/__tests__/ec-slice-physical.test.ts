import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import Papa from 'papaparse';
import pg from 'pg';
import { CANONICAL_TENANT_KEYS } from '../../../src/config/tenants/CANONICAL_TENANTS';
import { evaluateSelfServiceQa } from '../../../src/lib/ecl/insights/ec-slice-rules';
import { adaptEcPrivateCandidateV0 } from '../adapt_ec_private_candidate_v0';
import { planEcSliceV6Shadow, type ShadowObjectRow, type ShadowRelationshipRow } from '../ec_slice_v6_shadow';
import { makeEcPrivateCandidateFixture } from './ec_private_candidate_fixture';
import { disposableConnection, initializeDisposableSchema, insertFixtureRow, writeIsolatedEnvelope } from './ec_slice_physical_helpers';

function independentUuid(parts: string[]): string {
  const bytes = createHash('sha256').update(parts.join('|')).digest().subarray(0,16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}

function independentJson(value: unknown): string {
  const sort = (item: unknown): unknown => Array.isArray(item) ? item.map(sort) :
    item && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([key,value]) => [key,sort(value)])) : item;
  return JSON.stringify(sort(value)) + '\n';
}

test('refuses external databases, alternate databases, overrides and unguarded clients before connecting', async () => {
  const prior = process.env.ECL_ADMISSION_TEST_DATABASE_URL;
  try {
    for (const raw of ['postgresql://example.invalid/ecl_admission_test','postgresql://127.0.0.1/production','postgresql://127.0.0.1/ecl_admission_test?host=example.invalid']) {
      process.env.ECL_ADMISSION_TEST_DATABASE_URL = raw;
      assert.throws(disposableConnection);
    }
    await assert.rejects(initializeDisposableSchema(new pg.Client()), /unguarded database client/);
  } finally {
    if (prior === undefined) delete process.env.ECL_ADMISSION_TEST_DATABASE_URL;
    else process.env.ECL_ADMISSION_TEST_DATABASE_URL = prior;
  }
});

test('isolated ECL persistence, independent raw readback, RLS and V6 shadow proof', async () => {
  const db = disposableConnection();
  await db.connect();
  try {
    await initializeDisposableSchema(db);
    const servingCounts = async () => (await db.query(`select
      (select count(*)::integer from ecl_projection.projection_manifest) as manifests,
      (select count(*)::integer from ecl_projection.home_enterprise_landscape) as home,
      (select count(*)::integer from ecl_projection.tower_command_center) as tower`)).rows[0];
    const servingBefore = await servingCounts();
    const fixture = makeEcPrivateCandidateFixture({same_application_labels:true});
    fixture.binding.assessment_id = 'ec-disposable-proof-v0';
    const envelope = adaptEcPrivateCandidateV0(fixture.input,fixture.binding);
    const scope = [fixture.binding.tenant_key,fixture.binding.assessment_id];
    assert.equal(envelope.object.filter(row => row.object_type === 'application').length,3);
    assert.equal(envelope.object.filter(row => row.object_type === 'application_module').length,1);
    assert.equal(envelope.object.filter(row => row.object_type === 'application_deployment').length,4);
    await writeIsolatedEnvelope(db,envelope);
    await assert.rejects(writeIsolatedEnvelope(db,envelope), /Occupied assessment/);

    const objects = (await db.query<ShadowObjectRow>('select * from ecl_context.object where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const relationships = (await db.query<ShadowRelationshipRow>('select * from ecl_context.relationship where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const sourceRecords = (await db.query('select * from ecl_source.source_record where tenant_key=$1 and assessment_id=$2',scope)).rows;
    // Reconstruct native entity IDs from source bytes, not the adapter output arrays.
    const raw = Papa.parse<Record<string,string>>(Buffer.from(fixture.input.raw_files['raw/fixture/objects.csv']).toString(), {header:true,skipEmptyLines:true});
    assert.equal(raw.errors.length,0);
    const rawObjectIds = new Map<string,string>();
    const rawEntityIds = raw.data.filter(row => !['design:source_document','design:evidence_item'].includes(row.ci_class)).map(row => {
      assert.match(row.ci_class,/^design:/);
      const candidateId = 'ent:' + createHash('sha256').update(independentJson([
        fixture.binding.fixture_namespace,fixture.binding.tenant_key,row.ci_class,'fixture:rows:v0',row.native_key,
      ])).digest('hex');
      const result = independentUuid([fixture.binding.id_namespace,...scope,'object',candidateId]);
      rawObjectIds.set(`objects/${row.native_key}`,result);
      return result;
    });
    assert.deepEqual(objects.map(row=>row.id).sort(),rawEntityIds.sort());
    const independentCounts = Object.fromEntries(['design:application','design:application_module','design:deployment'].map(type=>[type,raw.data.filter(row=>row.ci_class===type).length]));
    assert.deepEqual(independentCounts,{'design:application':3,'design:application_module':1,'design:deployment':4});
    assert.equal(new Set(objects.filter(row=>row.object_type==='application').map(row=>row.display_name)).size,1,'same labels do not collapse objects');
    const rawLinksBytes = fixture.input.raw_files['raw/fixture/links.csv'];
    const links = Papa.parse<Record<string,string>>(Buffer.from(rawLinksBytes).toString(),{header:true,skipEmptyLines:true});
    assert.equal(links.errors.length,0);
    const mapping:Record<string,[string,boolean]> = {
      'design:module_of':['MODULE_OF',false], 'design:deployment_of':['DEPLOYMENT_OF',false],
      'design:hosted_on':['HOSTED_ON',false], 'design:mitigated_by':['MITIGATES',true],
      'design:supports_process':['SUPPORTS',false], 'design:uses_tool':['USES',false],
      'design:requests_evidence_for':['EVIDENCE_REQUESTED_FOR',false], 'design:feeds':['FEEDS',false],
      'design:belongs_to_segment':['BELONGS_TO_SEGMENT',false],
    };
    const rawSource = 'src:' + createHash('sha256').update(independentJson([
      fixture.binding.fixture_namespace,scope[0],'fixture','Fictional custodian','fixture:rows:v0','raw/fixture/links.csv',
    ])).digest('hex');
    const rawVersion = 'srcv:' + createHash('sha256').update(independentJson([
      rawSource,createHash('sha256').update(rawLinksBytes).digest('hex'),
    ])).digest('hex');
    const edgeTuple = (id:string,from:string,type:string,to:string,qualifiers:unknown) => independentJson([id,from,type,to,qualifiers]);
    const rawEdgeTuples = links.data.filter(row=>mapping[row.predicate]).map(row=>{
      const [type,reverse]=mapping[row.predicate];
      const candidateId='edge:'+createHash('sha256').update(independentJson([rawVersion,row.relationship_key])).digest('hex');
      const id=independentUuid([fixture.binding.id_namespace,...scope,'relationship',candidateId]);
      const from=rawObjectIds.get(reverse?row.to_ref:row.from_ref)!;
      const to=rawObjectIds.get(reverse?row.from_ref:row.to_ref)!;
      assert.ok(from && to);
      return edgeTuple(id,from,type,to,JSON.parse(row.qualifiers));
    });
    assert.deepEqual(relationships.map(row=>edgeTuple(row.id,row.from_object_id,row.relationship_type,row.to_object_id,row.qualifiers_json)).sort(),rawEdgeTuples.sort());
    for (const source of envelope.source_file) {
      const bytes = fixture.input.raw_files[source.file_name];
      assert.equal(createHash('sha256').update(bytes).digest('hex'),source.file_hash);
    }
    for (const record of sourceRecords.filter(row=>row.record_type==='csv_row')) {
      const source = envelope.source_file.find(row=>row.id===record.source_file_id)!;
      const parsed = Papa.parse<Record<string,string>>(Buffer.from(fixture.input.raw_files[source.file_name]).toString(),{header:true,skipEmptyLines:true});
      assert.deepEqual(record.payload_json,parsed.data[record.row_number-2]);
    }
    const measures = (await db.query('select observation_role,value_number,value_state,observation_key from ecl_context.measure where tenant_key=$1 and assessment_id=$2',scope)).rows;
    assert.equal(measures.find(row=>row.observation_role==='target').value_number,'17');
    assert.equal(measures.find(row=>row.observation_role==='baseline').value_number,null);
    assert.equal(measures.filter(row=>row.observation_role==='actual' && row.value_number===null).length,1);
    assert.equal(measures.length,5);
    assert.equal(new Set(measures.map(row=>row.observation_key)).size < measures.length,true,'same-grain competing values survive');
    const excerpts=(await db.query('select extracted_value,confidence,human_verification_state from ecl_source.document_extraction where tenant_key=$1 and assessment_id=$2',scope)).rows;
    assert.equal(excerpts.length,envelope.evidence_item.length);
    assert.ok(excerpts.every(row=>row.confidence===null && row.human_verification_state==='unverified'));

    const renamed = makeEcPrivateCandidateFixture({label_suffix:' renamed'});
    renamed.binding.assessment_id=fixture.binding.assessment_id;
    assert.deepEqual(adaptEcPrivateCandidateV0(renamed.input,renamed.binding).object.map(row=>row.id),envelope.object.map(row=>row.id));
    const collided = makeEcPrivateCandidateFixture({same_application_labels:true});
    collided.binding.assessment_id=fixture.binding.assessment_id;
    assert.equal(new Set(adaptEcPrivateCandidateV0(collided.input,collided.binding).object.filter(row=>row.object_type==='application').map(row=>row.id)).size,3);
    const corrected = makeEcPrivateCandidateFixture({source_revision:'v2'});
    corrected.binding.assessment_id=fixture.binding.assessment_id;
    const correction = adaptEcPrivateCandidateV0(corrected.input,corrected.binding);
    assert.deepEqual(correction.object.map(row=>row.id),envelope.object.map(row=>row.id));
    assert.notDeepEqual(correction.source_file.map(row=>row.file_hash),envelope.source_file.map(row=>row.file_hash));

    const dictionary = (await db.query('select * from intelligence_v6.relationship_types')).rows;
    // pg returns timestamps as Dates; planner receives the canonical serialized record contract.
    const serializedRelationships = JSON.parse(JSON.stringify(relationships)) as ShadowRelationshipRow[];
    const shadow = planEcSliceV6Shadow({tenantKey:scope[0],assessmentId:scope[1],objects,relationships:serializedRelationships,dictionary,
      readerSlice:{tenantKey:scope[0],assessmentId:scope[1],objects,relationships:serializedRelationships}});
    assert.equal(shadow.comparison.status,'match',JSON.stringify(shadow.issues));
    assert.equal(shadow.graph_edges.length,relationships.length);
    for (const row of shadow.graph_nodes) await insertFixtureRow(db,'intelligence_v6.graph_nodes',{...row});
    for (const row of shadow.graph_edges) await insertFixtureRow(db,'intelligence_v6.graph_edges',{...row});
    for (const row of shadow.graph_quality_reports) await insertFixtureRow(db,'intelligence_v6.graph_quality_reports',{...row});
    assert.equal(shadow.agent_ready,false);
    assert.equal(shadow.quality_status,'not_ready');

    const hash = (value: string) => createHash('sha256').update(value).digest('hex');
    const qaScope = {namespace:'unit:physical-qa',binding_key:scope[0],cohort_id:'qa-only'};
    const qa = evaluateSelfServiceQa({
      context:{scope:qaScope,selection:{valid_at:'2026-09-30',known_at:'2026-10-16T00:00:00Z'},
        implementation_sha256:hash(readFileSync(new URL('../../../src/lib/ecl/insights/ec-slice-rules.ts',import.meta.url),'utf8')),
        versions:{dictionary:'unit-v0',definition:'qa-v0',crosswalk:'unit-v0',policy:'unit-v0'},
        coverage:{expected_count:1,completeness:'complete',basis:'explicit_qa_fixture_only',revision:'qa-v0'},
        applicability:'in_scope',access:{scope_ids:['qa-fixture-only'],revision:'qa-access-v0'}},
      evidence:{id:'qa-only',scope:qaScope,source_id:'unit:qa',source_version_id:'unit:qa:v0',source_sha256:hash('explicit-qa-only'),
        payload_sha256:hash('100/20/12/3/2/3'),locator:'unit:qa-only',source_known_at:'2026-10-10T00:00:00Z',
        known_from:'2026-10-10T00:00:00Z',known_to:null,valid_from:'2026-09-01',valid_to:null,source_date:'2026-09-30',fresh_until:null,
        access:'allowed',review:'not_reviewed',state:'current',
        access_scope:{id:'qa-only',state:'known',scope_ids:['qa-fixture-only'],revision:'qa-access-v0'}},
      purpose:'qa_only',scenario:'qa',eligible:100,attempts:20,successful:12,abandoned:3,unresolved:2,subsequent_agent:3,
      follow_up_complete:true,repeat_contact_window_days:7,eligibility_taxonomy:'fictional-routine-only',
      observation_period:['2026-09-01','2026-10-01'],timezone:'UTC',
    });
    assert.equal((qa.details as {successful_resolution_percent:number}).successful_resolution_percent,12);
    await insertFixtureRow(db,'ecl_context.rule_evaluation',{
      id:independentUuid(['unit:qa-evaluation',...scope,qa.revision_id]),tenant_key:scope[0],assessment_id:scope[1],
      rule_id:qa.rule_id,rule_version:qa.rule_version,implementation_hash:qa.implementation_sha256,
      input_fingerprint:qa.input_sha256,result_state:qa.output_state,coverage_json:qa.coverage,
      dependencies_json:qa.dependencies,result_json:qa,
    });
    assert.equal((await db.query('select result_json from ecl_context.rule_evaluation where tenant_key=$1 and assessment_id=$2',scope)).rows[0].result_json.details.business_actual,null);

    await db.query(`do $$ begin if not exists (select 1 from pg_roles where rolname='ec_slice_reader') then
      create role ec_slice_reader nosuperuser nobypassrls; end if; end $$`);
    await db.query('grant usage on schema ecl_context,ecl_source,intelligence_v6 to ec_slice_reader');
    await db.query('grant select on all tables in schema ecl_context,ecl_source,intelligence_v6 to ec_slice_reader');
    await db.query('set role ec_slice_reader');
    await db.query("select set_config('app.tenant_key',$1,false)",[scope[0]]);
    assert.equal((await db.query('select count(*)::integer as count from ecl_context.object where assessment_id=$1',[scope[1]])).rows[0].count,objects.length);
    const secondTenant = CANONICAL_TENANT_KEYS.find(key=>key!==scope[0]);
    assert.ok(secondTenant);
    await db.query("select set_config('app.tenant_key',$1,false)",[secondTenant]);
    for (const table of ['ecl_context.object','ecl_context.relationship','ecl_context.measure','ecl_context.assertion','ecl_context.rule_evaluation','ecl_source.source_record','ecl_source.document_extraction']) {
      assert.equal((await db.query(`select count(*)::integer as count from ${table} where assessment_id=$1`,[scope[1]])).rows[0].count,0);
    }
    assert.equal((await db.query('select count(*)::integer as count from intelligence_v6.graph_nodes where contract_version=$1',[shadow.contract_version])).rows[0].count,0);
    await db.query('reset role');
    const edge = envelope.relationship[0];
    await assert.rejects(db.query(`insert into ecl_context.relationship
      (id,tenant_key,assessment_id,from_object_id,to_object_id,relationship_type,basis,value_state,review_state)
      values (gen_random_uuid(),$1,$2,$3,$4,$5,'source_recorded','unknown','not_reviewed')`,
      [secondTenant,scope[1],edge.from_object_id,edge.to_object_id,edge.relationship_type]), /relationship_from_object_fk|relationship_to_object_fk/);
    assert.deepEqual(await servingCounts(),servingBefore);
    console.log(JSON.stringify({proof:'generic_disposable_contract_only',objects:objects.length,relationships:relationships.length,
      logical_applications:3,application_modules:1,deployments:4,replay:'refused',effective_role_rls:'passed',shadow:shadow.comparison.status,
      tenant_load:'not_run',serving:'not_approved'}));
  } finally {
    await db.query('reset role').catch(()=>undefined);
    await db.end();
  }
});
