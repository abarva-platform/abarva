import { Pool } from "pg";
const M = "___GOR___";
const emit = (k: string, v: unknown) => { let s = JSON.stringify(v); if (s.length > 8000) s = s.slice(0, 8000) + "…"; console.log(`${M}${k}${M}${s}`); };
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const cols = await pool.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='governed_object_readiness' ORDER BY ordinal_position`);
  emit("COLS", cols.rows);
  // current distinct values on the target rows
  for (const c of ["agent_readiness_status", "retrievability", "classification", "source_layer", "source_basis", "confidence_level"]) {
    try {
      const r = await pool.query(`SELECT ${c} AS v, count(*) n FROM governed_object_readiness WHERE client_key IN ('apex-retail','meridian-health','lakeshore-holdings') GROUP BY 1 ORDER BY 2 DESC`);
      emit("DISTINCT_" + c, r.rows);
    } catch (e: any) { emit("DISTINCT_" + c + "_ERR", { e: e.message }); }
  }
  // tenant_id populated? + sample row
  const ti = await pool.query(`SELECT client_key, count(*) total, count(*) FILTER (WHERE tenant_id IS NOT NULL) with_tenant_id FROM governed_object_readiness WHERE client_key IN ('apex-retail','meridian-health','lakeshore-holdings') GROUP BY 1`);
  emit("TENANT_ID", ti.rows);
  const sample = await pool.query(`SELECT * FROM governed_object_readiness WHERE client_key='meridian-health' LIMIT 1`);
  emit("SAMPLE", sample.rows[0] ? Object.fromEntries(Object.entries(sample.rows[0]).map(([k, v]) => [k, v === null ? null : (typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v).slice(0, 80))])) : null);
  // resolve client_ids for tenant_id population
  const ids = await pool.query(`SELECT id, tenant_key, slug FROM clients WHERE tenant_key IN ('apexretail','apex-retail','meridian-health','meridian','lakeshore-holdings','lakeshore') OR slug IN ('apex-retail','meridian-health','lakeshore-holdings')`);
  emit("CLIENT_IDS", ids.rows);
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("FATAL", { error: e.message }); process.exit(1); });
