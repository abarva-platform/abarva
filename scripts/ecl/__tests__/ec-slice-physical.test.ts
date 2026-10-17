import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import Papa from 'papaparse';
import pg from 'pg';
import { CANONICAL_TENANT_KEYS } from '../../../src/config/tenants/CANONICAL_TENANTS';
import { evaluateSelfServiceQa } from '../ec_slice_rules';
import { adaptEcPrivateCandidateV0 } from '../adapt_ec_private_candidate_v0';
import type { EcCandidateHolds, EcPrivateCandidateEnvelope } from '../ec_private_candidate_types';
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

const edgeTuple = (id:string,from:string,type:string,to:string,qualifiers:unknown) => independentJson([id,from,type,to,qualifiers]);

// This source-byte oracle deliberately does not import adapter maps or UUID/hash helpers.
function independentRawGraph(fixture: ReturnType<typeof makeEcPrivateCandidateFixture>) {
  const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
  const scope = [fixture.binding.tenant_key,fixture.binding.assessment_id];
  const csv = (file: string) => {
    const parsed = Papa.parse<Record<string,string>>(Buffer.from(fixture.input.raw_files[file]).toString(),{header:true,skipEmptyLines:true});
    assert.deepEqual(parsed.errors,[]);
    return parsed.data;
  };
  const raw = csv('raw/fixture/objects.csv');
  const entities = raw.map(row=>{
    assert.match(row.ci_class,/^design:/);
    const candidateId = 'ent:' + hash(independentJson([
      fixture.binding.fixture_namespace,scope[0],row.ci_class,'fixture:rows:v0',row.native_key,
    ]));
    const kind = row.ci_class==='design:source_document' ? 'document' : row.ci_class==='design:evidence_item' ? 'evidence_item' : 'object';
    return {id:independentUuid([fixture.binding.id_namespace,...scope,kind,candidateId]),kind,row};
  });
  const objects = entities.filter(row=>row.kind==='object');
  const ids = new Map(objects.map(({id,row})=>[`objects/${row.native_key}`,id]));
  const sidecarIds = new Map(entities.filter(row=>row.kind!=='object').map(({id,row})=>[`objects/${row.native_key}`,id]));
  const mapping:Record<string,[string,boolean]> = {
    'design:module_of':['MODULE_OF',false], 'design:deployment_of':['DEPLOYMENT_OF',false],
    'design:hosted_on':['HOSTED_ON',false], 'design:mitigated_by':['MITIGATES',true],
    'design:supports_process':['SUPPORTS',false], 'design:uses_tool':['USES',false],
    'design:requests_evidence_for':['EVIDENCE_REQUESTED_FOR',false], 'design:feeds':['FEEDS',false],
    'design:belongs_to_segment':['BELONGS_TO_SEGMENT',false],
    'design:part_of_unit':['PART_OF_UNIT',false], 'design:performs':['PERFORMS',false],
    'design:realizes':['REALIZES',false], 'design:implements':['IMPLEMENTS_CAPABILITY',false],
    'design:part_of_program':['PART_OF_PROGRAM',false], 'design:assists_process':['ASSISTS_PROCESS',false],
    'design:advances':['ADVANCES_PRIORITY',false],
  };
  const source = 'src:' + hash(independentJson([
    fixture.binding.fixture_namespace,scope[0],'fixture','Fictional custodian','fixture:rows:v0','raw/fixture/links.csv',
  ]));
  const version = 'srcv:' + hash(independentJson([source,hash(fixture.input.raw_files['raw/fixture/links.csv'])]));
  const links = csv('raw/fixture/links.csv');
  const edges = links.filter(row=>row.predicate!=='design:cites_document').map(row=>{
    assert.ok(mapping[row.predicate],`Unaccounted raw predicate ${row.predicate}`);
    const [type,reverse] = mapping[row.predicate];
    const candidateId = 'edge:' + hash(independentJson([version,row.relationship_key]));
    const id = independentUuid([fixture.binding.id_namespace,...scope,'relationship',candidateId]);
    const from = ids.get(reverse?row.to_ref:row.from_ref);
    const to = ids.get(reverse?row.from_ref:row.to_ref);
    assert.ok(from && to);
    return {id,from,to,type,qualifiers:JSON.parse(row.qualifiers),row};
  });
  return {raw,objects,ids,sidecarIds,links,edges,tuples:edges.map(row=>edgeTuple(row.id,row.from,row.type,row.to,row.qualifiers)).sort()};
}

const businessPathNodes = [
  ['unit-a','organization','org_unit'], ['function-a','business_function','function'],
  ['process-a','process','process'], ['capability-a','capability','capability'],
  ['initiative-a','initiative','initiative'], ['program-a','program','program'],
  ['priority-a','strategic_priority','strategic_priority'], ['usecase-a','ai_use_case','ai_use_case'],
] as const;
const newBusinessVerbs = ['PART_OF_UNIT','PERFORMS','REALIZES','IMPLEMENTS_CAPABILITY','PART_OF_PROGRAM','ASSISTS_PROCESS'];

const businessPathSql = `with
  objects as (select * from ecl_context.object where tenant_key=$1 and assessment_id=$2),
  edges as (select * from ecl_context.relationship where tenant_key=$1 and assessment_id=$2)
select
  jsonb_build_array(u.id,f.id,p.id,c.id,i.id,g.id,s.id,a.id) as node_ids,
  jsonb_build_array(u.object_type,f.object_type,p.object_type,c.object_type,i.object_type,g.object_type,s.object_type,a.object_type) as object_types,
  jsonb_build_array(u.attributes_json->>'canonical_semantic_type',f.attributes_json->>'canonical_semantic_type',
    p.attributes_json->>'canonical_semantic_type',c.attributes_json->>'canonical_semantic_type',
    i.attributes_json->>'canonical_semantic_type',g.attributes_json->>'canonical_semantic_type',
    s.attributes_json->>'canonical_semantic_type',a.attributes_json->>'canonical_semantic_type') as semantic_types,
  jsonb_build_array(u.display_name,f.display_name,p.display_name,c.display_name,i.display_name,g.display_name,s.display_name,a.display_name) as labels,
  jsonb_build_array(unit_edge.id,performs.id,realizes.id,implements.id,program_edge.id,priority.id,initiative_priority.id,assists.id) as edge_ids
from objects f
join edges unit_edge on unit_edge.from_object_id=f.id and unit_edge.relationship_type='PART_OF_UNIT'
join objects u on u.id=unit_edge.to_object_id
join edges performs on performs.from_object_id=f.id and performs.relationship_type='PERFORMS'
join objects p on p.id=performs.to_object_id
join edges realizes on realizes.from_object_id=p.id and realizes.relationship_type='REALIZES'
join objects c on c.id=realizes.to_object_id
join edges implements on implements.to_object_id=c.id and implements.relationship_type='IMPLEMENTS_CAPABILITY'
join objects i on i.id=implements.from_object_id
join edges program_edge on program_edge.from_object_id=i.id and program_edge.relationship_type='PART_OF_PROGRAM'
join objects g on g.id=program_edge.to_object_id
join edges priority on priority.from_object_id=g.id and priority.relationship_type='ADVANCES_PRIORITY'
join objects s on s.id=priority.to_object_id
join edges initiative_priority on initiative_priority.from_object_id=i.id and initiative_priority.to_object_id=s.id
  and initiative_priority.relationship_type='ADVANCES_PRIORITY'
join edges assists on assists.to_object_id=p.id and assists.relationship_type='ASSISTS_PROCESS'
join objects a on a.id=assists.from_object_id
where f.id=$3`;

function assertCandidateHolds(row: EcCandidateHolds) {
  assert.equal(row.synthetic,true);
  assert.equal(row.fact_authority,'fictional_fixture_not_tenant_actuals');
  assert.equal(row.review_state,'not_reviewed');
  assert.equal(row.index_state,'not_indexed');
  assert.equal(row.agent_readiness_status,'blocked');
  assert.equal(row.downstream_context_policy,'exclude');
  assert.equal(row.independent_verification,'not_performed');
  assert.deepEqual(row.approvals,{declaration:'not_granted',load:'not_granted',serving:'not_granted',finance:'not_granted',approved_by:null,approved_at:null});
}

function assertEnvelopeHolds(envelope: EcPrivateCandidateEnvelope) {
  for (const row of [envelope,...envelope.source_file,...envelope.source_record,...envelope.object,
    ...envelope.assertion,...envelope.measure,...envelope.relationship,...envelope.document,...envelope.evidence_item]) assertCandidateHolds(row);
}

function assertAccessDependency(value: unknown) {
  assert.ok(value && typeof value==='object' && !Array.isArray(value));
  const dependency = value as Record<string,unknown>;
  assert.equal(dependency.kind,'source_access_scope');
  assert.equal(dependency.source_access_scope,'unknown');
  assert.equal(dependency.access_decision,'deny');
  assert.match(String(dependency.record_sha256),/^[a-f0-9]{64}$/);
  assert.equal(typeof dependency.source_version,'string');
  for (const key of ['source_scope_revision','declared_scope_revision']) {
    assert.ok(Object.hasOwn(dependency,key));
    assert.ok(dependency[key]===null || typeof dependency[key]==='string');
  }
  const {revision_sha256,...contents} = dependency;
  assert.equal(revision_sha256,createHash('sha256').update(independentJson(contents)).digest('hex'));
  return dependency;
}

function assertEnvelopeAccess(envelope: EcPrivateCandidateEnvelope) {
  for (const row of [...envelope.source_file,...envelope.source_record,...envelope.object,...envelope.assertion,
    ...envelope.measure,...envelope.relationship,...envelope.document,...envelope.evidence_item]) {
    assertAccessDependency(row.attributes_json.access_dependency);
  }
  for (const edge of envelope.relationship) {
    const dependency = assertAccessDependency(edge.attributes_json.access_dependency);
    const endpoints = edge.attributes_json.endpoint_access_dependencies;
    assert.ok(Array.isArray(endpoints));
    assert.equal(endpoints.length,2);
    const references = edge.attributes_json.reference_access_dependencies;
    assert.ok(Array.isArray(references));
    assert.deepEqual(dependency.upstream_scope_revisions,[...endpoints,...references].map(value=>assertAccessDependency(value).revision_sha256));
  }
}

test('generic fictional business graph matches independent raw tuples without a database', () => {
  const fixture = makeEcPrivateCandidateFixture({same_application_labels:true});
  const expected = independentRawGraph(fixture);
  const envelope = adaptEcPrivateCandidateV0(fixture.input,fixture.binding);
  assert.deepEqual(envelope.object.map(row=>row.id).sort(),expected.objects.map(row=>row.id).sort());
  assert.deepEqual(envelope.relationship.map(row=>edgeTuple(row.id,row.from_object_id,row.relationship_type,row.to_object_id,row.qualifiers_json)).sort(),expected.tuples);
  for (const [key,type,semantic] of businessPathNodes) {
    const raw = expected.objects.find(({row})=>row.native_key===key)!;
    const object = envelope.object.find(row=>row.id===raw.id)!;
    assert.deepEqual([object.object_type,object.canonical_semantic_type,object.display_name],[type,semantic,raw.row.label]);
  }
  assert.ok(newBusinessVerbs.every(verb=>expected.edges.some(row=>row.type===verb)));
  assert.deepEqual(envelope.gaps,[],'business links are admitted and citations are valid evidence sidecars');
  assert.equal(envelope.document.length,expected.raw.filter(row=>row.ci_class==='design:source_document').length);
  assert.equal(envelope.evidence_item.length,expected.raw.filter(row=>row.ci_class==='design:evidence_item').length);
  for (const link of expected.links.filter(row=>row.predicate==='design:cites_document')) {
    const source = envelope.source_record.find(row=>row.record_type==='csv_row' &&
      typeof row.payload_json==='object' && row.payload_json!==null && !Array.isArray(row.payload_json) &&
      row.payload_json.relationship_key===link.relationship_key)!;
    assert.ok(source);
    const sidecar = source.attributes_json.evidence_link as Record<string,unknown>;
    assert.ok(sidecar);
    const item = envelope.evidence_item.find(row=>row.id===sidecar.evidence_item_id)!;
    const document = envelope.document.find(row=>row.id===sidecar.document_id)!;
    assert.ok(item && document);
    assert.equal(item.id,expected.sidecarIds.get(link.from_ref));
    assert.equal(document.id,expected.sidecarIds.get(link.to_ref));
    assert.equal(item.document_id,document.id);
    assertAccessDependency(sidecar.access_dependency);
  }
  assertEnvelopeHolds(envelope);
  assertEnvelopeAccess(envelope);
});

test('generic contradictory evidence link is raw-consistent but rejected without a database', () => {
  const fixture = makeEcPrivateCandidateFixture({contradictory_evidence_link:true});
  const expected = independentRawGraph(fixture);
  assert.equal(expected.links.find(row=>row.from_ref==='objects/evidence-a')!.to_ref,'objects/doc-b');
  assert.equal(expected.raw.find(row=>row.native_key==='evidence-a')!.document_ref,'objects/doc-a');
  assert.throws(()=>adaptEcPrivateCandidateV0(fixture.input,fixture.binding),/citation.*document/);
});

test('generic access revision fingerprints invalidate dependent edges without changing raw bytes or identities', () => {
  const original = makeEcPrivateCandidateFixture();
  const before = adaptEcPrivateCandidateV0(original.input,original.binding);
  const raw = independentRawGraph(original);
  const signature = (edge: EcPrivateCandidateEnvelope['relationship'][number]) => {
    return assertAccessDependency(edge.attributes_json.access_dependency).revision_sha256;
  };
  for (const kind of ['source','endpoint','endpoint_source'] as const) {
    const revised = makeEcPrivateCandidateFixture();
    const record = (kind==='endpoint' ? revised.input.entities : revised.input.sources).find(value=>{
      const row = value as Record<string,unknown>;
      return kind==='endpoint' ? row.native_key==='process-a' :
        row.file_path===(kind==='source' ? 'raw/fixture/links.csv' : 'raw/fixture/objects.csv');
    }) as Record<string,unknown>;
    record.access_scope_revision = 'fictional-access-revision-v2';
    assert.deepEqual(revised.input.raw_files,original.input.raw_files);
    const after = adaptEcPrivateCandidateV0(revised.input,revised.binding);
    assertEnvelopeAccess(after);
    for (const key of ['source_file','source_record','object','assertion','measure','relationship','document','evidence_item'] as const) {
      assert.deepEqual(after[key].map(row=>row.id),before[key].map(row=>row.id));
    }
    assert.deepEqual(after.source_file.map(row=>row.file_hash),before.source_file.map(row=>row.file_hash));
    assert.deepEqual(after.relationship.map(row=>edgeTuple(row.id,row.from_object_id,row.relationship_type,row.to_object_id,row.qualifiers_json)).sort(),raw.tuples);
    for (const edge of after.relationship) {
      const prior = before.relationship.find(row=>row.id===edge.id)!;
      const touchesProcess = [edge.from_object_id,edge.to_object_id].includes(raw.ids.get('objects/process-a')!);
      if (kind!=='endpoint' || touchesProcess) assert.notEqual(signature(edge),signature(prior));
      else assert.equal(signature(edge),signature(prior));
      if (kind!=='source') {
        const local = (row: typeof edge) => Object.fromEntries(Object.entries(assertAccessDependency(row.attributes_json.access_dependency))
          .filter(([key])=>!['upstream_scope_revisions','revision_sha256'].includes(key)));
        assert.deepEqual(local(edge),local(prior));
      } else assert.deepEqual(edge.attributes_json.endpoint_access_dependencies,prior.attributes_json.endpoint_access_dependencies);
    }
  }
});

test('refuses external databases, alternate databases, overrides and unguarded clients before connecting', async () => {
  const prior = process.env.ECL_ADMISSION_TEST_DATABASE_URL;
  try {
    for (const raw of ['postgresql://example.invalid/ecl_admission_test','postgresql://127.0.0.1/production','postgresql://127.0.0.1/ecl_admission_test?host=example.invalid']) {
      process.env.ECL_ADMISSION_TEST_DATABASE_URL = raw;
      assert.throws(disposableConnection);
    }
    const unguarded=new pg.Client();
    let unguardedQueries=0;
    Object.defineProperty(unguarded,'query',{value:()=>{unguardedQueries+=1;throw new Error('Unexpected unguarded query');}});
    await assert.rejects(initializeDisposableSchema(unguarded), /unguarded database client/);
    await assert.rejects(insertFixtureRow(unguarded,'ecl_context.object',{}), /unguarded database client/);
    assert.equal(unguardedQueries,0);
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
    const beforeCitationRevision = adaptEcPrivateCandidateV0(fixture.input,fixture.binding);
    const changedCitation = (fixture.input.edges as Record<string,unknown>[]).find(row=>row.predicate==='design:cites_document');
    assert.ok(changedCitation);
    changedCitation.access_scope_revision='fictional-citation-only-access:v2';
    const envelope = adaptEcPrivateCandidateV0(fixture.input,fixture.binding);
    assert.deepEqual(envelope.source_file.map(row=>row.file_hash),beforeCitationRevision.source_file.map(row=>row.file_hash));
    const scope = [fixture.binding.tenant_key,fixture.binding.assessment_id];
    assertEnvelopeHolds(envelope);
    assertEnvelopeAccess(envelope);
    assert.equal(envelope.object.filter(row => row.object_type === 'application').length,3);
    assert.equal(envelope.object.filter(row => row.object_type === 'application_module').length,1);
    assert.equal(envelope.object.filter(row => row.object_type === 'application_deployment').length,4);
    await writeIsolatedEnvelope(db,envelope);
    await assert.rejects(writeIsolatedEnvelope(db,envelope), /Occupied assessment/);

    const objects = (await db.query<ShadowObjectRow>('select * from ecl_context.object where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const relationships = (await db.query<ShadowRelationshipRow>('select * from ecl_context.relationship where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const sourceRecords = (await db.query('select * from ecl_source.source_record where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const expected = independentRawGraph(fixture);
    const rawObjectIds = expected.ids;
    assert.deepEqual(objects.map(row=>row.id).sort(),expected.objects.map(row=>row.id).sort());
    const independentCounts = Object.fromEntries(['design:application','design:application_module','design:deployment'].map(type=>[type,expected.raw.filter(row=>row.ci_class===type).length]));
    assert.deepEqual(independentCounts,{'design:application':3,'design:application_module':1,'design:deployment':4});
    assert.equal((await db.query('select count(*)::integer as count from ecl_context.application_v where tenant_key=$1 and assessment_id=$2',scope)).rows[0].count,3);
    assert.equal(new Set(objects.filter(row=>row.object_type==='application').map(row=>row.display_name)).size,1,'same labels do not collapse objects');
    assert.deepEqual(relationships.map(row=>edgeTuple(row.id,row.from_object_id,row.relationship_type,row.to_object_id,row.qualifiers_json)).sort(),expected.tuples);
    const pathScope = [...scope,rawObjectIds.get('objects/function-a')];
    const pathEdges = [
      ['function-a','PART_OF_UNIT','unit-a'], ['function-a','PERFORMS','process-a'],
      ['process-a','REALIZES','capability-a'], ['initiative-a','IMPLEMENTS_CAPABILITY','capability-a'],
      ['initiative-a','PART_OF_PROGRAM','program-a'], ['program-a','ADVANCES_PRIORITY','priority-a'],
      ['initiative-a','ADVANCES_PRIORITY','priority-a'], ['usecase-a','ASSISTS_PROCESS','process-a'],
    ];
    const expectedPath = {
      node_ids:businessPathNodes.map(([key])=>rawObjectIds.get(`objects/${key}`)),
      object_types:businessPathNodes.map(([,type])=>type),
      semantic_types:businessPathNodes.map(([,,semantic])=>semantic),
      labels:businessPathNodes.map(([key])=>expected.raw.find(row=>row.native_key===key)!.label),
      edge_ids:pathEdges.map(([from,type,to])=>{
        const edge = expected.edges.find(row=>row.from===rawObjectIds.get(`objects/${from}`) && row.type===type && row.to===rawObjectIds.get(`objects/${to}`));
        assert.ok(edge);
        return edge.id;
      }),
    };
    assert.deepEqual((await db.query(businessPathSql,pathScope)).rows,[expectedPath]);
    for (const table of ['ecl_context.object','ecl_context.relationship','ecl_context.assertion','ecl_context.measure']) {
      const candidates = (await db.query(`select attributes_json->'candidate' as candidate from ${table} where tenant_key=$1 and assessment_id=$2`,scope)).rows;
      assert.ok(candidates.length);
      for (const {candidate} of candidates) {
        assertCandidateHolds(candidate);
        assertAccessDependency(candidate.attributes_json.access_dependency);
        if (table==='ecl_context.relationship') candidate.attributes_json.endpoint_access_dependencies.forEach(assertAccessDependency);
      }
    }
    for (const source of envelope.source_file) {
      const bytes = fixture.input.raw_files[source.file_name];
      assert.equal(createHash('sha256').update(bytes).digest('hex'),source.file_hash);
    }
    for (const record of sourceRecords.filter(row=>row.record_type==='csv_row')) {
      const source = envelope.source_file.find(row=>row.id===record.source_file_id)!;
      const parsed = Papa.parse<Record<string,string>>(Buffer.from(fixture.input.raw_files[source.file_name]).toString(),{header:true,skipEmptyLines:true});
      assert.deepEqual(record.payload_json,parsed.data[record.row_number-2]);
      assertCandidateHolds(record.attributes_json.candidate);
      assertAccessDependency(record.attributes_json.access_dependency);
    }
    const measures = (await db.query("select observation_role,value_number,value_state,observation_key,attributes_json->'candidate' as candidate from ecl_context.measure where tenant_key=$1 and assessment_id=$2",scope)).rows;
    assert.equal(measures.find(row=>row.observation_role==='target').value_number,'17');
    assert.equal(measures.find(row=>row.observation_role==='baseline').value_number,null);
    assert.equal(measures.filter(row=>row.observation_role==='actual' && row.value_number===null).length,1);
    assert.equal(measures.length,5);
    assert.equal(new Set(measures.map(row=>row.observation_key)).size < measures.length,true,'same-grain competing values survive');
    const competing = measures.filter(row=>row.observation_role==='actual' && row.value_number!==null);
    assert.deepEqual(competing.map(row=>row.value_number).sort(),['23','29']);
    assert.equal(new Set(competing.map(row=>row.observation_key)).size,1);
    assert.equal(new Set(competing.map(row=>row.candidate.source_version)).size,1);
    assert.equal(new Set(competing.map(row=>row.candidate.id)).size,2);
    const owners=(await db.query('select subject_id,semantic_key,source_version,value_json,source_access_scope,access_decision,source_locator_json from ecl_context.assertion where tenant_key=$1 and assessment_id=$2',scope)).rows;
    const ownerBytes=Papa.parse<Record<string,string>>(Buffer.from(fixture.input.raw_files['raw/fixture/owners.csv']).toString(),{header:true,skipEmptyLines:true});
    assert.equal(owners.length,2);
    assert.equal(new Set(owners.map(row=>independentJson([row.subject_id,row.semantic_key,row.source_version]))).size,1);
    assert.equal(new Set(owners.map(row=>independentJson(row.value_json))).size,2);
    for (const row of owners) {
      const original=ownerBytes.data[row.source_locator_json.row_number-2];
      assert.equal(row.subject_id,rawObjectIds.get(original.subject_ref));
      assert.equal(row.value_json.entity_id,rawObjectIds.get(original.value_ref));
      assert.equal(row.source_access_scope,'unknown');
      assert.equal(row.access_decision,'deny');
    }
    await assert.rejects(db.query(`insert into ecl_context.assertion
      (id,tenant_key,assessment_id,subject_id,subject_kind,subject_object_id,semantic_key,value_json,source_record_id,source_version,source_locator_json,known_at,basis)
      select gen_random_uuid(),tenant_key,assessment_id,subject_id,'object',null,semantic_key,value_json,source_record_id,source_version,source_locator_json,known_at,basis
      from ecl_context.assertion where tenant_key=$1 and assessment_id=$2 limit 1`,scope),/ec_assertion_subject_check/);
    const excerpts=(await db.query('select id,document_id,extracted_value,confidence,human_verification_state,normalized_value_json from ecl_source.document_extraction where tenant_key=$1 and assessment_id=$2',scope)).rows;
    assert.equal(excerpts.length,envelope.evidence_item.length);
    assert.ok(excerpts.every(row=>row.confidence===null && row.human_verification_state==='unverified'));
    for (const row of excerpts) {
      const locator=row.normalized_value_json.candidate.evidence_locator;
      assert.equal(createHash('sha256').update(row.extracted_value).digest('hex'),locator.excerpt_sha256);
      assertCandidateHolds(row.normalized_value_json.candidate);
      assertAccessDependency(row.normalized_value_json.candidate.attributes_json.access_dependency);
    }
    const documents = (await db.query('select id,review_state from ecl_source.document where tenant_key=$1 and assessment_id=$2',scope)).rows;
    for (const link of expected.links.filter(row=>row.predicate==='design:cites_document')) {
      const record = sourceRecords.find(row=>row.record_type==='csv_row' && row.payload_json.relationship_key===link.relationship_key);
      assert.ok(record);
      assert.deepEqual(record.payload_json,link);
      const itemId = expected.sidecarIds.get(link.from_ref);
      const documentId = expected.sidecarIds.get(link.to_ref);
      assert.ok(itemId && documentId);
      const sidecar = record.attributes_json.evidence_link;
      assert.ok(sidecar);
      assert.equal(sidecar.evidence_item_id,itemId);
      assert.equal(sidecar.document_id,documentId);
      const access = assertAccessDependency(sidecar.access_dependency);
      const originalRecord = beforeCitationRevision.source_record.find(row=>row.id===record.id)!;
      const originalLink = originalRecord.attributes_json.evidence_link as Record<string,unknown>;
      const originalAccess = originalLink.access_dependency as Record<string,unknown>;
      if (link.relationship_key===(changedCitation.source_locator as Record<string,unknown>).row_key) {
        assert.equal(access.declared_scope_revision,'fictional-citation-only-access:v2');
        assert.notEqual(access.revision_sha256,originalAccess.revision_sha256);
      } else assert.equal(access.revision_sha256,originalAccess.revision_sha256);
      const persistedCandidate = record.attributes_json.candidate;
      assert.deepEqual(sidecar,persistedCandidate.attributes_json.evidence_link);
      const excerpt = excerpts.find(row=>row.id===itemId);
      assert.ok(excerpt);
      assert.equal(excerpt.document_id,documentId);
      assert.equal(documents.find(row=>row.id===documentId)?.review_state,'not_reviewed');
      assert.ok(!objects.some(row=>row.id===itemId || row.id===documentId));
      assert.ok(!relationships.some(row=>[row.from_object_id,row.to_object_id].includes(itemId) ||
        [row.from_object_id,row.to_object_id].includes(documentId)));
    }

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
    for (const set of [shadow.comparison.node_ids,shadow.comparison.edge_ids,shadow.comparison.edge_set,shadow.comparison.semantic_nodes]) {
      assert.ok(set?.equal);
      assert.deepEqual(set.only_in_plan,[]);
      assert.deepEqual(set.only_in_reader,[]);
    }
    for (const row of shadow.graph_nodes) await insertFixtureRow(db,'intelligence_v6.graph_nodes',{...row});
    for (const row of shadow.graph_edges) await insertFixtureRow(db,'intelligence_v6.graph_edges',{...row});
    for (const row of shadow.graph_quality_reports) await insertFixtureRow(db,'intelligence_v6.graph_quality_reports',{...row});
    assert.equal(shadow.agent_ready,false);
    assert.equal(shadow.quality_status,'not_ready');
    const shadowScope = [scope[0],shadow.contract_version];
    const storedNodes = (await db.query('select * from intelligence_v6.graph_nodes where tenant_key=$1 and contract_version=$2',shadowScope)).rows;
    const storedEdges = (await db.query('select * from intelligence_v6.graph_edges where tenant_key=$1 and contract_version=$2',shadowScope)).rows;
    const storedQuality = (await db.query('select * from intelligence_v6.graph_quality_reports where tenant_key=$1 and contract_version=$2',shadowScope)).rows;
    assert.deepEqual(storedNodes.map(row=>independentJson([row.node_id,row.object_family,row.business_display_name])).sort(),
      expected.objects.map(({id,row})=>independentJson([id,row.ci_class.slice('design:'.length),row.label])).sort());
    assert.deepEqual(storedEdges.map(row=>edgeTuple(row.relationship_id,row.from_node_id,row.relationship_type,row.to_node_id,row.metadata.qualifiers_json)).sort(),expected.tuples);
    assert.deepEqual(storedEdges.map(row=>[row.relationship_id,row.from_object_family,row.to_object_family]).sort(),
      expected.edges.map(edge=>[edge.id,expected.objects.find(row=>row.id===edge.from)!.row.ci_class.slice('design:'.length),
        expected.objects.find(row=>row.id===edge.to)!.row.ci_class.slice('design:'.length)]).sort());
    for (const row of [...storedNodes,...storedEdges,...storedQuality]) {
      assert.equal(row.metadata.assessment_id,scope[1]);
      assert.equal(row.metadata.shadow_only,true);
      assert.equal(row.metadata.quality_status,'not_ready');
      assert.equal(row.metadata.governance_status,'blocked');
      assert.equal(row.metadata.serving_eligible,false);
      assert.equal(row.metadata.agent_ready,false);
      assert.equal(row.metadata.executive_safe,false);
      assert.equal(row.metadata.adoption_state,'excluded');
    }
    assert.equal(storedQuality.length,1);
    assert.equal(storedQuality[0].quality_status,'not_ready');
    assert.equal(storedQuality[0].inferred_node_count,0);
    assert.equal(storedQuality[0].total_nodes,expected.objects.length);
    assert.equal(storedQuality[0].total_edges,expected.edges.length);
    assert.deepEqual(envelope.gaps,[]);
    assert.ok(storedNodes.every(row=>!['source_document','evidence_item'].includes(row.object_family)));

    const hash = (value: string) => createHash('sha256').update(value).digest('hex');
    const qaScope = {namespace:'unit:physical-qa',binding_key:scope[0],cohort_id:'qa-only'};
    const qa = evaluateSelfServiceQa({
      context:{scope:qaScope,selection:{valid_at:'2026-09-30',known_at:'2026-10-16T00:00:00Z'},
        implementation_sha256:hash(readFileSync(new URL('../ec_slice_rules.ts',import.meta.url),'utf8')),
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
    assert.deepEqual((await db.query(businessPathSql,pathScope)).rows,[expectedPath]);
    const secondTenant = CANONICAL_TENANT_KEYS.find(key=>key!==scope[0]);
    assert.ok(secondTenant);
    await db.query("select set_config('app.tenant_key',$1,false)",[secondTenant]);
    for (const table of ['ecl_context.object','ecl_context.relationship','ecl_context.measure','ecl_context.assertion','ecl_context.rule_evaluation','ecl_source.source_file','ecl_source.source_record','ecl_source.document','ecl_source.document_extraction']) {
      assert.equal((await db.query(`select count(*)::integer as count from ${table} where assessment_id=$1`,[scope[1]])).rows[0].count,0);
    }
    assert.deepEqual((await db.query(businessPathSql,pathScope)).rows,[]);
    for (const table of ['intelligence_v6.graph_nodes','intelligence_v6.graph_edges','intelligence_v6.graph_quality_reports']) {
      assert.equal((await db.query(`select count(*)::integer as count from ${table} where contract_version=$1`,[shadow.contract_version])).rows[0].count,0);
    }
    await db.query('reset role');
    const edge = envelope.relationship[0];
    await assert.rejects(db.query(`insert into ecl_context.relationship
      (id,tenant_key,assessment_id,from_object_id,to_object_id,relationship_type,basis,value_state,review_state)
      values (gen_random_uuid(),$1,$2,$3,$4,$5,'source_recorded','unknown','not_reviewed')`,
      [secondTenant,scope[1],edge.from_object_id,edge.to_object_id,edge.relationship_type]), /relationship_from_object_fk|relationship_to_object_fk/);
    for (const edge of expected.edges.filter(row=>newBusinessVerbs.includes(row.type))) {
      await assert.rejects(db.query(`insert into ecl_context.relationship
        (id,tenant_key,assessment_id,from_object_id,to_object_id,relationship_type,basis,value_state,review_state)
        values (gen_random_uuid(),$1,$2,$3,$4,$5,'source_recorded','unknown','not_reviewed')`,
        [secondTenant,scope[1],edge.from,edge.to,edge.type]), /relationship_from_object_fk|relationship_to_object_fk/);
    }
    assert.deepEqual(await servingCounts(),servingBefore);
    console.log(JSON.stringify({proof:'generic_disposable_contract_only',objects:objects.length,relationships:relationships.length,
      logical_applications:3,application_modules:1,deployments:4,business_relationships:newBusinessVerbs,
      persisted_business_path:'matched_source_identity_and_types',persisted_shadow_set:'exact_match',
      replay:'refused',effective_role_rls:'passed',shadow:shadow.comparison.status,
      tenant_load:'not_run',serving:'not_approved'}));
  } finally {
    await db.query('reset role').catch(()=>undefined);
    await db.end();
  }
});
