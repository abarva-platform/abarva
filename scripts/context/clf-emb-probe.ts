import { Pool } from "pg";
const M = "___EMB___";
const emit = (k: string, v: unknown) => console.log(`${M}${k}${M}${JSON.stringify(v)}`);
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const T = `tenant_key IN ('apex-retail','apexretail','meridian-health','lakeshore-holdings')`;
  emit("model_dim", (await pool.query(
    `SELECT tenant_key, embedding_model, embedding_dim, embedding_status, count(*) n
     FROM enterprise_context_chunks WHERE ${T} GROUP BY 1,2,3,4 ORDER BY 1,4`)).rows);
  emit("apex_fact_chunks", (await pool.query(
    `SELECT tenant_key, count(*) n FROM enterprise_context_chunks
     WHERE tenant_key IN ('apex-retail','apexretail') GROUP BY 1`)).rows);
  // sample an embedded chunk: is the embedding a real vector? length + first 3 values
  const s = await pool.query(
    `SELECT tenant_key, embedding_model, embedding_dim, jsonb_array_length(embedding) AS len,
       (embedding->>0) v0, (embedding->>1) v1
     FROM enterprise_context_chunks WHERE tenant_key='meridian-health' AND embedding_status='embedded'
       AND embedding IS NOT NULL LIMIT 1`);
  emit("sample_embedded", s.rows[0] ?? null);
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("ERR", { error: e.message }); process.exit(1); });
