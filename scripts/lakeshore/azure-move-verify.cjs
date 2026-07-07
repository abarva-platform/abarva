/* Lakeshore Kyriba Move — Azure persistence verification (read-only). */
(async () => {
  const pg = require('pg');
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const L = (k, v) => console.log('MV ' + k + ' ' + JSON.stringify(v).slice(0, 800));
  const move = (await c.query("select id, name, current_phase, status from engagements where name ilike '%Kyriba%' order by created_at desc nulls last limit 1")).rows[0] || null;
  L('engagement', move);
  if (move) {
    const byFmt = (await c.query("select output_format, count(*)::int n from generated_artifacts where source_artifact_ref like $1 group by output_format order by output_format", [`move:${move.id}:%`])).rows;
    const total = (await c.query("select count(*)::int n from generated_artifacts where source_artifact_ref like $1", [`move:${move.id}:%`])).rows[0].n;
    const sample = (await c.query("select source_artifact_ref, output_format, blob_url, left(blob_sha256,12) sha from generated_artifacts where source_artifact_ref like $1 order by source_artifact_ref limit 4", [`move:${move.id}:%`])).rows;
    L('ga_total', total);
    L('ga_by_format', byFmt);
    L('ga_sample', sample);
  }
  await c.end();
  console.log('MV_DONE');
  setInterval(() => {}, 1 << 30);
})().catch((e) => { console.log('MV_FATAL ' + String((e && e.message) || e).slice(0, 300)); setInterval(() => {}, 1 << 30); });
