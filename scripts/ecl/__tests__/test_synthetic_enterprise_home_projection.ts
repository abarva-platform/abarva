import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import pg from "pg";
import { generatePack } from "../load_synthetic_enterprise_v1";
import { writeShadowHomeProjection } from "../project_synthetic_enterprise_home";

async function main(): Promise<void> {
  const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");
  const pack = await generatePack("v2");
  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    const proof = await writeShadowHomeProjection(
      db,
      pack,
      "https://synthetic.invalid/readback.json",
      "local-shadow-proof",
      "https://synthetic.invalid/projection-proof.json",
    );
    assert.equal(proof.serving_state, "shadow_not_promoted");
    const counts = await db.query<{
      page_key: string;
      row_type: string;
      n: string;
    }>(
      `
      select page_key, row_type, count(*) as n
      from ecl_projection.home_enterprise_landscape
      where tenant_key = $1 and assessment_id = $2
      group by page_key, row_type
    `,
      [pack.manifest.tenant_key, pack.manifest.assessment_id],
    );
    const count = (page: string, type: string) =>
      Number(
        counts.rows.find(
          (row) => row.page_key === page && row.row_type === type,
        )?.n ?? 0,
      );
    assert.equal(count("applications_systems", "application"), 344);
    assert.equal(count("vendor_contracts", "contract"), 230);
    assert.equal(count("business_unit_profile", "business_segment"), 3);
    assert.equal(count("business_unit_profile", "business_function"), 14);
    assert.equal(count("business_unit_profile", "workforce_role"), 72);
    assert.equal(count("current_state_data_flow", "data_flow"), 1350);
    const serving = await db.query<{ n: string }>(
      `
      select count(*) as n from serving.home_applications_systems
      where tenant_key = $1 and assessment_id = $2
    `,
      [pack.manifest.tenant_key, pack.manifest.assessment_id],
    );
    assert.equal(Number(serving.rows[0].n), 344);
    const links = await db.query<{ missing: string }>(
      `
      select count(*) as missing
      from ecl_projection.home_enterprise_landscape h
      left join ecl_projection.projection_entry_source_record_ref r
        on r.tenant_key = h.tenant_key and r.assessment_id = h.assessment_id
       and r.projection_entry_id = h.projection_entry_id and r.source_hash = h.source_hash
      where h.tenant_key = $1 and h.assessment_id = $2 and r.source_record_id is null
    `,
      [pack.manifest.tenant_key, pack.manifest.assessment_id],
    );
    assert.equal(Number(links.rows[0].missing), 0);
    await assert.rejects(
      writeShadowHomeProjection(
        db,
        pack,
        "https://synthetic.invalid/readback.json",
        "local-shadow-proof-duplicate",
        "https://synthetic.invalid/projection-proof.json",
      ),
      /Refusing occupied Home projection/,
    );
    console.log(
      JSON.stringify({ status: "passed", rows: proof.rows, linked: true }),
    );
  } finally {
    await db.end();
    await rm(pack.dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
