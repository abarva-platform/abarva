import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { before, after } from "node:test";
import pg from "pg";
import { input } from "./integrated-insights.test";
import { buildIntegratedInsightPlan, insightUuid } from "../../../src/lib/ecl/insights/engine";
import { persistInsightCandidates } from "../../../src/lib/ecl/insights/store";
import { readInsightInput } from "../../../src/lib/ecl/insights/read-input";
import { runInsightJob, type InsightRuntime } from "../integrated_insights_job";
import { connectDatabase } from "../synthetic_enterprise_home_job";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";

const databaseUrl = process.env.INSIGHT_TEST_DATABASE_URL;
if (!databaseUrl || !["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname) ||
  !/^\/insight_test/.test(new URL(databaseUrl).pathname)) throw new Error("Dedicated local insight_test database required");
const db = new pg.Client({ connectionString: databaseUrl });
const readerRole = `insight_test_reader_${process.pid}`;
const fixture = input();
const releaseRecord = "docs/releases/records/2026-10-11-enterprise-integrated-insight-candidates.md";
const declaration = (plan: ReturnType<typeof buildIntegratedInsightPlan>) => ({
  dataset_id: "test-integrated", client_key: fixture.tenantKey, tenant_scope: "canonical_tenant", title: "Local test fixture",
  source_layer: "signal", classification: "confidential", owner: "test", source_basis: "local fixture only",
  ingestion_method: "operator_aca_job", retrieval_plan: "postgres_fts", retrieval_proof_required: true,
  expected_object_count: plan.findings.length, approved_by: "Morgan Example", approved_at: "2026-10-11",
  load_approval: { approved_by: "Morgan Example", approved_at: "2026-10-11", assessment_id: fixture.assessmentId,
    source_set_hash: plan.loadVersionHash, release_record: releaseRecord },
});
let plan: ReturnType<typeof buildIntegratedInsightPlan>;

before(async () => {
  await db.connect();
  await db.query(`create schema ecl_source; create schema ecl_context; create schema ecl_projection; create schema serving;
    create table ecl_source.source_file (id uuid, tenant_key text, assessment_id text, file_hash text, origin text,
      quality_state text, access_class text, primary key(tenant_key,assessment_id,id));
    create table ecl_source.source_record (id uuid, tenant_key text, assessment_id text, source_file_id uuid,
      parse_state text, payload_json jsonb, primary key(tenant_key,assessment_id,id));
    create table ecl_context.object (id uuid, tenant_key text, assessment_id text, object_type text, display_name text,
      lifecycle_state text, source_record_id uuid, basis text, value_state text, review_state text, attributes_json jsonb,
      primary key(tenant_key,assessment_id,id));
    create table ecl_context.relationship (id uuid, tenant_key text, assessment_id text, from_object_id uuid, to_object_id uuid,
      relationship_type text, source_record_id uuid, basis text, value_state text, review_state text,
      primary key(tenant_key,assessment_id,id));
    create table ecl_context.metric_definition (tenant_key text, metric_key text, unit text, definition text);
    create table ecl_context.measure (id uuid, tenant_key text, assessment_id text, subject_object_id uuid, metric_key text,
      value_number numeric, unit text, period_start date, period_end date, scenario text, source_record_id uuid,
      basis text, value_state text, quality_state text, review_state text, attributes_json jsonb,
      primary key(tenant_key,assessment_id,id));
    create table ecl_projection.cube_manifest (id uuid, tenant_key text, assessment_id text, cube_key text,
      cube_version int, source_hash text, cube_hash text, quality_state text, admission_status text);
    create table ecl_projection.cube_slice (id uuid, tenant_key text, assessment_id text, cube_manifest_id uuid,
      quality_state text, value_state text, primary key(tenant_key,assessment_id,id));
    create table ecl_projection.cube_slice_measure (tenant_key text, assessment_id text, cube_slice_id uuid, measure_id uuid, metric_key text);`);
  const source = fixture.sources[0];
  await db.query("insert into ecl_source.source_file values($1,$2,$3,$4,$5,$6,$7)",
    [source.source_file_id, source.tenant_key, source.assessment_id, source.file_hash, source.origin, source.quality_state, source.access_class]);
  await db.query("insert into ecl_source.source_record values($1,$2,$3,$4,$5,$6::jsonb)",
    [source.id, source.tenant_key, source.assessment_id, source.source_file_id, source.parse_state, JSON.stringify({ fixture: true })]);
  for (const o of fixture.objects) await db.query("insert into ecl_context.object values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)",
    [o.id,o.tenant_key,o.assessment_id,o.object_type,o.display_name,o.lifecycle_state,o.source_record_id,o.basis,o.value_state,o.review_state,JSON.stringify(o.attributes_json)]);
  for (const r of fixture.relationships) await db.query("insert into ecl_context.relationship values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [r.id,r.tenant_key,r.assessment_id,r.from_object_id,r.to_object_id,r.relationship_type,r.source_record_id,r.basis,r.value_state,r.review_state]);
  for (const m of fixture.measures) await db.query("insert into ecl_context.measure values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)",
    [m.id,m.tenant_key,m.assessment_id,m.subject_object_id,m.metric_key,m.value_number,m.unit,m.period_start,m.period_end,m.scenario,m.source_record_id,m.basis,m.value_state,m.quality_state,m.review_state,JSON.stringify(m.attributes_json)]);
  for (const m of fixture.metricDefinitions) await db.query("insert into ecl_context.metric_definition values($1,$2,$3,$4)",
    [fixture.tenantKey,m.metric_key,m.unit,m.definition]);
  const cubeManifest = insightUuid("cube manifest");
  await db.query("insert into ecl_projection.cube_manifest values($1,$2,$3,'test',1,$4,$4,'passed','admitted')",
    [cubeManifest,fixture.tenantKey,fixture.assessmentId,"a".repeat(64)]);
  await db.query("insert into ecl_projection.cube_slice values($1,$2,$3,$4,'passed','known')",
    [fixture.cubeMeasureLinks[0].cube_slice_id,fixture.tenantKey,fixture.assessmentId,cubeManifest]);
  for (const link of fixture.cubeMeasureLinks) await db.query("insert into ecl_projection.cube_slice_measure values($1,$2,$3,$4,$5)",
    [fixture.tenantKey,fixture.assessmentId,link.cube_slice_id,link.measure_id,link.metric_key]);
  await db.query(await readFile("supabase/migrations/20261011210000_enterprise_integrated_insight_candidates.sql", "utf8"));
  plan = buildIntegratedInsightPlan(await readInsightInput(db, fixture.tenantKey, fixture.assessmentId, fixture.asOf));
});
after(async () => { await db.end(); });

test("real migration, canonical read, persisted content and all lineage sets agree", async () => {
  assert.equal(plan.findings.length, 5);
  await db.query("begin isolation level serializable");
  await db.query("select set_config('app.tenant_key',$1,true)",[fixture.tenantKey]);
  const receipt = await persistInsightCandidates(db, plan, { datasetId: "test-integrated", manifests: [declaration(plan)],
    recordExists: () => true, runId: "local-pg-first", releaseRecord, jobRecord: { local_test: true } });
  assert.equal(receipt.findings, 5);
  assert.equal(receipt.idempotentReplay, false);
  await db.query("commit");
});
test("same release replays without new rows or overwritten governance", async () => {
  await db.query("begin");
  const receipt = await persistInsightCandidates(db, plan, { datasetId: "test-integrated", manifests: [declaration(plan)],
    recordExists: () => true, runId: "local-pg-replay", releaseRecord, jobRecord: { local_test: true } });
  assert.equal(receipt.idempotentReplay, true);
  assert.equal(receipt.findings, 5);
  await db.query("commit");
  assert.equal(Number((await db.query("select count(*) from ecl_projection.enterprise_insight_release")).rows[0].count),1);
});
test("cross-tenant canonical lineage is rejected by physical composite FKs", async () => {
  const otherId = insightUuid("other-tenant-object");
  await db.query("insert into ecl_context.object(id,tenant_key,assessment_id) values($1,$2,$3)",
    [otherId,CANONICAL_TENANT_KEYS[1],fixture.assessmentId]);
  await assert.rejects(db.query("insert into ecl_projection.enterprise_insight_object_ref values($1,$2,$3,$4)",
    [fixture.tenantKey,fixture.assessmentId,plan.findings[0].id,otherId]), /foreign key/);
});
test("RLS hides candidates without scope and rejects cross-tenant writes", async () => {
  await db.query(`create role ${readerRole};
    grant usage on schema ecl_projection, serving to ${readerRole};
    grant select on all tables in schema ecl_projection to ${readerRole};
    grant select on serving.enterprise_insight_candidates to ${readerRole};
    grant insert on ecl_projection.enterprise_insight_release to ${readerRole};`);
  await db.query("begin");
  try {
    await db.query(`set local role ${readerRole}`);
    assert.equal((await db.query("select * from serving.enterprise_insight_candidates")).rows.length,0);
    await db.query("select set_config('app.tenant_key',$1,true)",[fixture.tenantKey]);
    assert.equal((await db.query("select * from serving.enterprise_insight_candidates")).rows.length,5);
    await assert.rejects(db.query(`insert into ecl_projection.enterprise_insight_release
      (id,tenant_key,assessment_id,dataset_id,as_of,source_set_hash,rule_set_hash,result_hash,
       expected_finding_count,first_run_id,release_record,job_record_json,inventory_json,evaluations_json,load_version_hash)
      values($1,$2,'test','test','2026-10-11',$3,$3,$3,0,'test','test','{}','{}','[]',$3)`,
      [insightUuid("wrong-scope"),CANONICAL_TENANT_KEYS[1],"a".repeat(64)]), /row-level security/);
  } finally { await db.query("rollback"); }
});
test("database cannot mark candidates agent-ready", async () => {
  await assert.rejects(db.query("update ecl_projection.enterprise_insight_finding set agent_ready=true"), /check constraint/);
});
test("unadmitted Cube slices are not used as lineage", async () => {
  await db.query("begin");
  try {
    await db.query("update ecl_projection.cube_manifest set admission_status='refused'");
    const read = await readInsightInput(db,fixture.tenantKey,fixture.assessmentId,fixture.asOf);
    assert.equal(read.cubeMeasureLinks.length,0);
    assert.equal(read.cubeManifests.length,1);
  } finally { await db.query("rollback"); }
});
test("source-record content changes invalidate the exact candidate version", async () => {
  await db.query("begin");
  try {
    await db.query("update ecl_source.source_record set payload_json='{}'");
    const altered = buildIntegratedInsightPlan(await readInsightInput(db,fixture.tenantKey,fixture.assessmentId,fixture.asOf));
    assert.notEqual(altered.loadVersionHash, plan.loadVersionHash);
  } finally { await db.query("rollback"); }
});
test("operator plan is read-only; approved apply proves independent serving readback", async () => {
  const env = { DATABASE_URL: databaseUrl, ECL_INSIGHT_TENANT_KEY: fixture.tenantKey,
    ECL_INSIGHT_ASSESSMENT_ID: fixture.assessmentId, ECL_INSIGHT_AS_OF: fixture.asOf,
    ECL_INSIGHT_DATASET_ID: "test-integrated", ECL_INSIGHT_RUN_ID: "local-job-plan",
    ECL_INSIGHT_OPERATOR_IDENTITY: "test", ECL_INSIGHT_BUILD_VERSION: "v1", ECL_INSIGHT_RELEASE_RECORD: releaseRecord,
    ABARVA_OPERATOR_IMAGE: `test/web@sha256:${"a".repeat(64)}`, ABARVA_OPERATOR_BRANCH_COMMIT: "b".repeat(40) };
  const proofs: Buffer[] = [];
  const runtime: InsightRuntime = { connect: connectDatabase, manifests: async () => [declaration(plan)], recordExists: () => true,
    store: async () => ({ uriFor: (key) => `https://example.org/${key}`, read: async () => Buffer.alloc(0),
      writeOnce: async (key, bytes) => { proofs.push(bytes); return { uri: key, created: true }; } }) };
  const result = await runInsightJob(env,"plan",runtime);
  assert.equal(result.mutation_applied,false);
  const applied = await runInsightJob({ ...env,ECL_INSIGHT_RUN_ID:"local-job-apply", ECL_INSIGHT_EXPECTED_VERSION_HASH:plan.loadVersionHash },"apply",runtime);
  assert.equal(applied.mutation_applied,true);
  assert.equal(proofs.length,4);
});
