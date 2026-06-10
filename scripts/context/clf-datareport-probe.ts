import { Pool } from "pg";
const M = "___DR___";
const emit = (k: string, v: unknown) => { let s = JSON.stringify(v); if (s.length > 8500) s = s.slice(0, 8500) + "…"; console.log(`${M}${k}${M}${s}`); };
const TT = `('apex-retail','apexretail','meridian-health','lakeshore-holdings')`;

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  const tryQ = async (n: string, sql: string) => { try { emit(n, (await pool.query(sql)).rows); } catch (e: any) { emit(n + "_ERR", { e: e.message }); } };

  // discover corpus/pattern tables
  await tryQ("corpus_tables", `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%corpus%' OR table_name LIKE '%pattern%') ORDER BY 1`);
  // corpus pattern volumetrics by industry/vertical (try common shapes)
  for (const sql of [
    `SELECT industry, count(*) n, count(*) FILTER (WHERE embedding IS NOT NULL) embedded FROM corpus_patterns GROUP BY 1 ORDER BY 2 DESC`,
    `SELECT vertical AS industry, count(*) n FROM corpus_patterns GROUP BY 1 ORDER BY 2 DESC`,
    `SELECT industry_code AS industry, count(*) n FROM corpus_patterns GROUP BY 1 ORDER BY 2 DESC`,
  ]) { try { emit("corpus_by_industry", (await pool.query(sql)).rows); break; } catch (e: any) { emit("corpus_by_industry_try_ERR", { e: e.message }); } }
  await tryQ("corpus_total", `SELECT count(*) n FROM corpus_patterns`);
  await tryQ("corpus_cols", `SELECT column_name FROM information_schema.columns WHERE table_name='corpus_patterns' ORDER BY ordinal_position`);
  // pattern tier/type if present
  for (const c of ["tier", "pattern_tier", "pattern_type", "depth_score", "confidence"]) {
    await tryQ("corpus_dist_" + c, `SELECT ${c} AS v, count(*) n FROM corpus_patterns GROUP BY 1 ORDER BY 2 DESC LIMIT 12`).catch(() => {});
  }

  // CONTEXT consolidated per tenant
  await tryQ("ctx_records", `SELECT tenant_key, count(*) n FROM enterprise_context_records WHERE tenant_key IN ${TT} GROUP BY 1 ORDER BY 1`);
  await tryQ("ctx_facts", `SELECT tenant_key, count(*) facts, count(*) FILTER (WHERE lifecycle_state='active') active FROM enterprise_context_facts WHERE tenant_key IN ${TT} GROUP BY 1 ORDER BY 1`);
  await tryQ("ctx_facts_dim", `SELECT r.tenant_key, r.record_type, count(*) n FROM enterprise_context_facts f JOIN enterprise_context_records r ON r.id=f.record_id WHERE r.tenant_key IN ${TT} AND f.lifecycle_state='active' GROUP BY 1,2 ORDER BY 1,3 DESC`);
  await tryQ("ctx_chunks", `SELECT tenant_key, count(*) total, count(*) FILTER (WHERE embedding_status='embedded') embedded FROM enterprise_context_chunks WHERE tenant_key IN ${TT} GROUP BY 1 ORDER BY 1`);
  await tryQ("ctx_evidence", `SELECT tenant_key, count(*) n FROM enterprise_context_evidence WHERE tenant_key IN ${TT} GROUP BY 1`);
  await tryQ("ctx_relationships", `SELECT tenant_key, count(*) n FROM enterprise_context_relationships WHERE tenant_key IN ${TT} GROUP BY 1`);
  await tryQ("gor_ready", `SELECT client_key, agent_readiness_status, count(*) n FROM governed_object_readiness WHERE client_key IN ('apex-retail','meridian-health','lakeshore-holdings') GROUP BY 1,2 ORDER BY 1`);

  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("FATAL", { error: e.message }); process.exit(1); });
