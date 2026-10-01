import assert from "node:assert/strict";
import pg from "pg";
import {
  generatePack,
  loadIntoNewAssessment,
} from "../load_synthetic_enterprise_v1";
import { rm } from "node:fs/promises";

async function main(): Promise<void> {
  const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");

  const pack = await generatePack();
  try {
    const blobUris = new Map(
      pack.manifest.files.map((file) => [
        file.source_room_family,
        `https://synthetic.invalid/${pack.manifest.source_set_hash}/${file.source_room_family}`,
      ]),
    );
    const readback = await loadIntoNewAssessment(
      connectionString,
      pack,
      blobUris,
    );
    assert.equal(readback.serving_state, "not_promoted");
    assert.deepEqual(
      readback.unresolved_relationships,
      pack.normalized.unresolved_relationships.map((edge) => edge.id),
    );
    assert.deepEqual(readback.counts, {
      source_files: 22,
      source_records: 16416,
      objects: 5759,
      relationships: 10619,
      applications: 24,
      application_modules: 726,
      missing_object_lineage: 0,
      missing_edge_lineage: 0,
      missing_source_blob: 0,
    });
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
      const query = async (sql: string) =>
        Number((await client.query<{ count: string }>(sql)).rows[0].count);
      assert.equal(
        await query(
          "select count(*) from ecl_context.object where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and object_type = 'application_module'",
        ),
        726,
      );
      assert.equal(
        await query(
          "select count(*) from ecl_context.object where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and object_type = 'evidence_request' and value_state = 'unknown'",
        ),
        224,
      );
      assert.equal(
        await query(
          "select count(*) from ecl_context.object where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and object_type = 'leadership_observation' and basis = 'model_inferred'",
        ),
        1,
      );
      assert.equal(
        await query(
          "select count(*) from ecl_context.object where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and object_type = 'metric' and value_state = 'conflicting'",
        ),
        1,
      );
      assert.equal(
        await query(
          "select count(*) from ecl_source.source_record where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and native_id = 'MET-0004-ALT'",
        ),
        1,
      );
      const unresolvedId = pack.normalized.unresolved_relationships[0].id;
      const unresolved = await client.query<{ count: string }>(
        "select count(*) from ecl_context.relationship where assessment_id = $1 and attributes_json ->> 'native_relationship_id' = $2",
        [pack.manifest.assessment_id, unresolvedId],
      );
      assert.equal(Number(unresolved.rows[0].count), 0);
      assert.equal(
        await query(
          "select count(*) from ecl_source.source_file where assessment_id = 'assessment-meridian-synthetic-enterprise-v1' and metadata_json ->> 'client_attestation_state' = 'not_client_attested'",
        ),
        22,
      );
    } finally {
      await client.end();
    }
    await assert.rejects(
      loadIntoNewAssessment(connectionString, pack, blobUris),
      /already contains source or canonical rows/,
    );
    console.log(JSON.stringify({ accepted: true, ...readback }));
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
