import { Pool } from "pg";
const M = "___PROMO___";
const emit = (k: string, v: unknown) => { let s = JSON.stringify(v); if (s.length > 8000) s = s.slice(0, 8000) + "…"; console.log(`${M}${k}${M}${s}`); };
const T = `tenant_key IN ('apexretail','apex-retail','meridian-health','lakeshore-holdings')`;

const Q: Array<{ n: string; sql: string }> = [
  // substantive promotion-gate readiness of facts: active + confidence + source_file + evidence_pointer (citation-ready)
  { n: "fact_gate_readiness", sql: `
    SELECT tenant_key,
      count(*) total,
      count(*) FILTER (WHERE lifecycle_state='active') active,
      count(*) FILTER (WHERE lifecycle_state='active' AND confidence IS NOT NULL
        AND source_file IS NOT NULL AND source_file<>'' AND evidence_pointer IS NOT NULL AND evidence_pointer<>'') gate_ready
    FROM enterprise_context_facts WHERE ${T} GROUP BY 1 ORDER BY 1` },
  // apex per-dimension citation-readiness (the newly loaded facts)
  { n: "apex_dim_gate", sql: `
    SELECT r.record_type,
      count(*) facts,
      count(*) FILTER (WHERE f.confidence IS NOT NULL AND f.source_file IS NOT NULL AND f.evidence_pointer IS NOT NULL) gate_ready
    FROM enterprise_context_facts f JOIN enterprise_context_records r ON r.id=f.record_id
    WHERE f.tenant_key='apexretail' AND f.lifecycle_state='active' GROUP BY 1 ORDER BY 1` },
  // governed_object_readiness current status by client + the columns it tracks
  { n: "gor_status", sql: `
    SELECT client_key, agent_readiness_status,
      count(*) n,
      count(*) FILTER (WHERE retrievability IS NOT NULL) has_retrievability,
      count(*) FILTER (WHERE source_basis IS NOT NULL) has_source_basis,
      count(*) FILTER (WHERE confidence_level IS NOT NULL) has_confidence,
      count(*) FILTER (WHERE cited_render_verified_at IS NOT NULL) has_cited_verified
    FROM governed_object_readiness
    WHERE client_key IN ('apex-retail','meridian-health','lakeshore-holdings')
    GROUP BY 1,2 ORDER BY 1` },
  // what object_table does gor track (chunks vs facts)?
  { n: "gor_object_tables", sql: `
    SELECT client_key, object_table, count(*) n FROM governed_object_readiness
    WHERE client_key IN ('apex-retail','meridian-health','lakeshore-holdings') GROUP BY 1,2 ORDER BY 1,2` },
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  for (const q of Q) { try { const r = await pool.query(q.sql); emit(q.n, r.rows); } catch (e: any) { emit(q.n + "_ERR", { error: e.message }); } }
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("FATAL", { error: e.message }); process.exit(1); });
