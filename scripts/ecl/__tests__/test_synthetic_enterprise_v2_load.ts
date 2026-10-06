import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import pg from "pg";
import type { LoadApproval } from "../../../src/lib/governance/dataset-manifest";
import {
  generatePack,
  loadIntoNewAssessment,
} from "../load_synthetic_enterprise_v1";

async function main(): Promise<void> {
  const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");

  const pack = await generatePack("v2");
  try {
    const blobUris = new Map(
      pack.manifest.files.map((file) => [
        file.source_room_family,
        `https://synthetic.invalid/${pack.manifest.source_set_hash}/${file.source_room_family}`,
      ]),
    );
    const approval: LoadApproval = {
      approved_by: "Jordan Rivera",
      approved_at: "2026-01-01",
      assessment_id: pack.manifest.assessment_id,
      source_set_hash: pack.manifest.source_set_hash,
      release_record: "docs/releases/records/2026-01-01-fixture-load.md",
    };
    const readback = await loadIntoNewAssessment(
      connectionString,
      pack,
      blobUris,
      approval,
    );
    assert.deepEqual(readback.load_approval, approval);
    assert.equal(readback.serving_state, "not_promoted");
    assert.deepEqual(readback.counts, {
      source_files: 22,
      source_records: 17844,
      objects: 6079,
      relationships: 11727,
      applications: 344,
      application_modules: 726,
      missing_object_lineage: 0,
      missing_edge_lineage: 0,
      missing_source_blob: 0,
    });
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
      const result = await client.query<{ applications: string; services: string; modules: string }>(
        `select
          (select count(*) from ecl_context.application_v where tenant_key = $1 and assessment_id = $2) as applications,
          (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2 and object_type = 'application' and attributes_json->>'application_grain' = 'logical_service') as services,
          (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2 and object_type = 'application_module') as modules`,
        [pack.manifest.tenant_key, pack.manifest.assessment_id],
      );
      assert.deepEqual(Object.values(result.rows[0]).map(Number), [344, 320, 726]);
      // Generated services and modules load as computed; only the products the
      // definition names load as recorded.
      const bases = await client.query<{
        basis: string;
        grain: string | null;
        count: string;
      }>(
        `select basis, attributes_json->>'application_grain' as grain, count(*)
           from ecl_context.object where tenant_key = $1 and assessment_id = $2
          group by basis, grain order by basis, grain`,
        [pack.manifest.tenant_key, pack.manifest.assessment_id],
      );
      assert.deepEqual(
        bases.rows.map((row) => [row.basis, row.grain, Number(row.count)]),
        [
          ["calculated", "governed_module", 726],
          ["calculated", "logical_service", 320],
          ["model_inferred", null, 1],
          ["source_recorded", "logical_product", 24],
          ["source_recorded", null, 5008],
        ],
      );
    } finally {
      await client.end();
    }
    await assert.rejects(
      loadIntoNewAssessment(connectionString, pack, blobUris, approval),
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
