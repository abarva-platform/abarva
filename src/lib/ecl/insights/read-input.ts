import type { JobDatabase } from "../../../../scripts/ecl/synthetic_enterprise_home_job";
import type { InsightInput, InsightMeasure, InsightObject, InsightRelationship, InsightSource } from "./types";
import { insightHash } from "./engine";

/** Operator-only canonical read. Products consume the serving view, not these tables. */
export async function readInsightInput(
  db: JobDatabase,
  tenantKey: string,
  assessmentId: string,
  asOf: string,
): Promise<InsightInput> {
  const params = [tenantKey, assessmentId];
  const objects = await db.query<InsightObject>(
    `select id::text, tenant_key, assessment_id, object_type,
       coalesce(nullif(attributes_json->>'canonical_semantic_type', ''), object_type) as canonical_semantic_type,
       display_name, lifecycle_state, source_record_id::text, basis, value_state,
       review_state, attributes_json from ecl_context.object
       where tenant_key = $1 and assessment_id = $2 order by id`, params);
  if (!objects.rows.length) throw new Error("No canonical objects in the explicitly selected assessment");
  const relationships = await db.query<InsightRelationship>(
    `select id::text, tenant_key, assessment_id, from_object_id::text, to_object_id::text,
       relationship_type, source_record_id::text, basis, value_state, review_state
       from ecl_context.relationship where tenant_key = $1 and assessment_id = $2 order by id`, params);
  const measures = await db.query<InsightMeasure>(
    `select id::text, tenant_key, assessment_id, subject_object_id::text, metric_key,
       value_number::float8, unit, period_start::text, period_end::text, scenario,
       source_record_id::text, basis, value_state, quality_state, review_state, attributes_json
       from ecl_context.measure where tenant_key = $1 and assessment_id = $2 order by id`, params);
  const sources = await db.query<InsightSource & { payload_json: unknown }>(
    `select r.id::text, r.tenant_key, r.assessment_id, r.source_file_id::text, r.parse_state,
       f.file_hash, f.origin, f.quality_state, f.access_class, r.payload_json
       from ecl_source.source_record r join ecl_source.source_file f
         on f.tenant_key = r.tenant_key and f.assessment_id = r.assessment_id and f.id = r.source_file_id
       where r.tenant_key = $1 and r.assessment_id = $2 order by r.id`, params);
  const metricDefinitions = await db.query<InsightInput["metricDefinitions"][number]>(
    `select metric_key, unit, definition from ecl_context.metric_definition
       where tenant_key = $1 order by metric_key`, [tenantKey]);
  const cubeTables = await db.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'ecl_projection'
       and table_name in ('cube_manifest', 'cube_slice', 'cube_slice_measure')`);
  const present = new Set(cubeTables.rows.map((row) => row.table_name));
  let cubeManifests: InsightInput["cubeManifests"] = [];
  let cubeMeasureLinks: InsightInput["cubeMeasureLinks"] = [];
  if (present.has("cube_manifest")) {
    cubeManifests = (await db.query(
      `select id::text, cube_key, cube_version, source_hash, cube_hash, quality_state, admission_status
       from ecl_projection.cube_manifest where tenant_key = $1 and assessment_id = $2 order by id`, params)).rows;
  }
  if (["cube_manifest", "cube_slice", "cube_slice_measure"].every((name) => present.has(name))) {
    cubeMeasureLinks = (await db.query<InsightInput["cubeMeasureLinks"][number]>(
      `select l.cube_slice_id::text, l.measure_id::text, l.metric_key
       from ecl_projection.cube_slice_measure l
       join ecl_projection.cube_slice s
         on s.tenant_key = l.tenant_key and s.assessment_id = l.assessment_id and s.id = l.cube_slice_id
       join ecl_projection.cube_manifest m
         on m.tenant_key = s.tenant_key and m.assessment_id = s.assessment_id and m.id = s.cube_manifest_id
       where l.tenant_key = $1 and l.assessment_id = $2
         and m.admission_status = 'admitted' and m.quality_state = 'passed'
         and s.quality_state = 'passed' and s.value_state = 'known'
       order by l.cube_slice_id, l.measure_id, l.metric_key`, params)).rows;
  }
  return { tenantKey, assessmentId, asOf, objects: objects.rows, relationships: relationships.rows,
    measures: measures.rows, sources: sources.rows.map(({ payload_json, ...source }) =>
      ({ ...source, record_hash: insightHash(payload_json) })), metricDefinitions: metricDefinitions.rows,
    cubeManifests, cubeMeasureLinks };
}
