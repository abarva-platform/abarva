import { Pool } from "pg";
import {
  parseMeridianEnterpriseContextDataset,
  buildMeridianEnterpriseContextIngestionPlan,
  retargetEnterpriseContextIngestionPlan,
} from "@/lib/enterprise-context/ingestion/meridian-loader";
import { buildEnterpriseContextChunksFromPlan } from "@/lib/enterprise-context/chunking";

const M = "___POLISH___";
const emit = (k: string, v: unknown) => { let s = JSON.stringify(v); if (s.length > 7000) s = s.slice(0, 7000) + "…"; console.log(`${M}${k}${M}${s}`); };
const KEY = process.env.OPENAI_API_KEY;

async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts.map((t) => t && t.trim() ? t : " ") }),
  });
  if (!resp.ok) throw new Error(`openai ${resp.status} ${(await resp.text()).slice(0, 250)}`);
  const j: any = await resp.json();
  return j.data.map((d: any) => d.embedding);
}
async function embedRows(pool: Pool, rows: any[]): Promise<number> {
  let done = 0;
  for (let i = 0; i < rows.length; i += 96) {
    const batch = rows.slice(i, i + 96);
    const vecs = await embedBatch(batch.map((r) => r.chunk_text ?? " "));
    for (let j = 0; j < batch.length; j++) {
      await pool.query(
        `UPDATE enterprise_context_chunks SET embedding=$2::jsonb, embedding_dim=1536,
           embedding_model='text-embedding-3-small', embedding_status='embedded', embedded_at=now(), updated_at=now()
         WHERE id=$1`,
        [batch[j].id, JSON.stringify(vecs[j])],
      );
    }
    done += batch.length;
  }
  return done;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  const APPLY = process.env.APPLY === "1";

  // 1) finish pending embeddings (lakeshore + meridian)
  const pend = (await pool.query(
    `SELECT id, chunk_text FROM enterprise_context_chunks WHERE embedding_status='pending'
       AND tenant_key IN ('lakeshore-holdings','meridian-health') ORDER BY tenant_key, chunk_id`)).rows;
  emit("PENDING_COUNT", { n: pend.length });
  if (APPLY && pend.length) emit("PENDING_EMBEDDED", { n: await embedRows(pool, pend) });

  // 2) Apex fact-chunking from the baked dataset (records -> chunks)
  const parsed = parseMeridianEnterpriseContextDataset("/app/data/apexretail");
  const plan: any = retargetEnterpriseContextIngestionPlan(buildMeridianEnterpriseContextIngestionPlan(parsed), "apexretail");
  const chunks: any[] = buildEnterpriseContextChunksFromPlan(plan, "/app/data/apexretail");
  emit("APEX_CHUNKS_BUILT", { n: chunks.length, sample: chunks[0]?.chunkId });
  const CLIENT = "c7578e7a-545a-4b75-860e-465358f5e00b";
  const TK = "apex-retail"; // canonical key to join the existing apex index + retrieval
  if (APPLY) {
    let ins = 0;
    for (const c of chunks) {
      await pool.query(
        `INSERT INTO enterprise_context_chunks
           (client_id,tenant_key,chunk_id,source_segment_id,source_record_id,source_doc,source_path,chunk_index,chunk_text,token_count,embedding_status,provenance,chunk_metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11::jsonb,$12::jsonb)
         ON CONFLICT (tenant_key,chunk_id) DO UPDATE SET chunk_text=EXCLUDED.chunk_text, updated_at=now()`,
        [CLIENT, TK, c.chunkId, c.sourceSegmentId, c.sourceRecordId, c.sourceDoc, c.sourcePath, c.chunkIndex ?? 0, c.chunkText, c.tokenCount ?? 0, JSON.stringify(c.provenance ?? {}), JSON.stringify(c.chunkMetadata ?? {})],
      );
      ins++;
    }
    emit("APEX_CHUNKS_INSERTED", { n: ins });
    const arows = (await pool.query(`SELECT id, chunk_text FROM enterprise_context_chunks WHERE tenant_key='apex-retail' AND embedding_status='pending'`)).rows;
    emit("APEX_CHUNKS_EMBEDDED", { n: await embedRows(pool, arows) });
  }

  emit("VERIFY", (await pool.query(
    `SELECT tenant_key, embedding_status, count(*) n FROM enterprise_context_chunks
       WHERE tenant_key IN ('apex-retail','lakeshore-holdings','meridian-health') GROUP BY 1,2 ORDER BY 1,2`)).rows);
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("ERR", { error: e.message, stack: (e.stack || "").slice(0, 400) }); process.exit(1); });
