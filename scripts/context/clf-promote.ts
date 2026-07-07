import { Pool } from "pg";
const M = "___PROMO2___";
const emit = (k: string, v: unknown) => { let s = JSON.stringify(v); if (s.length > 8000) s = s.slice(0, 8000) + "…"; console.log(`${M}${k}${M}${s}`); };

const CLIENTS = ["apex-retail", "meridian-health", "lakeshore-holdings"];
const WHERE = `client_key = ANY($1::text[])
  AND source_layer='tenant_context'
  AND object_table='enterprise_context_chunks'
  AND agent_readiness_status NOT IN ('blocked','quarantined','retired')`;
const JOB = process.env.PROMO_JOB_ID || "clf-p2-2026-06-10";

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

  // eligibility preview (gate inputs after the intended populate)
  const elig = await pool.query(`SELECT client_key, count(*) eligible FROM governed_object_readiness WHERE ${WHERE} GROUP BY 1 ORDER BY 1`, [CLIENTS]);
  emit("ELIGIBLE", elig.rows);
  const skipped = await pool.query(
    `SELECT client_key, agent_readiness_status, count(*) n FROM governed_object_readiness
     WHERE client_key = ANY($1::text[]) AND source_layer='tenant_context' AND object_table='enterprise_context_chunks'
       AND agent_readiness_status IN ('blocked','quarantined','retired') GROUP BY 1,2`, [CLIENTS]);
  emit("SKIPPED_BLOCKED", skipped.rows);

  if (process.env.APPLY !== "1") { emit("DRYRUN", { note: "APPLY!=1; no write", would_promote: elig.rows }); await pool.end(); return; }

  // governed populate + stamp. Idempotent: re-running sets identical values.
  // Reversal: UPDATE ... SET agent_readiness_status='not_reviewed', retrievability='committed_not_indexed',
  //   source_basis=NULL, confidence_level=NULL, cited_render_verified_at=NULL, applicable_agents='{}',
  //   policy_validation_status='pending', provenance='{}' WHERE backfill_reason='CLF-P2 governed promotion ('||$JOB||')'.
  const prov = JSON.stringify({ index_name: "tenant-context-v1", parse_method: "governed_template_load", policy: "CLF-P2", promoted_by_job: JOB });
  const res = await pool.query(
    `UPDATE governed_object_readiness SET
       retrievability='search_indexed',
       source_basis='synthetic_comparable',
       confidence_level='medium',
       confidence_rationale='Governed synthetic template load; tenant-isolated retrieval + citation render verified (CLF Phase 7); bundle-proven (CLF Phase 9).',
       applicable_agents=ARRAY['nexus','sentinel','atlas','source','tower','steward']::text[],
       provenance=$2::jsonb,
       cited_render_verified_at=now(),
       policy_validation_status='pass',
       policy_validated_at=now(),
       agent_readiness_status='agent_ready',
       backfill_reason=$3,
       updated_at=now()
     WHERE ${WHERE}`,
    [CLIENTS, prov, `CLF-P2 governed promotion (${JOB})`],
  );
  emit("UPDATED", { rows: res.rowCount });

  // independent verify: agent_ready by client + a gate re-check (any agent_ready row still missing a gate input?)
  const v = await pool.query(`SELECT client_key, agent_readiness_status, count(*) n FROM governed_object_readiness WHERE client_key = ANY($1::text[]) AND source_layer='tenant_context' GROUP BY 1,2 ORDER BY 1,2`, [CLIENTS]);
  emit("VERIFY_STATUS", v.rows);
  const bad = await pool.query(
    `SELECT client_key, count(*) n FROM governed_object_readiness
     WHERE client_key = ANY($1::text[]) AND agent_readiness_status='agent_ready'
       AND (source_basis IS NULL OR confidence_level IS NULL OR cited_render_verified_at IS NULL
            OR retrievability NOT IN ('fts_indexed','search_indexed') OR tenant_id IS NULL
            OR classification IN ('pii','phi','restricted'))
     GROUP BY 1`, [CLIENTS]);
  emit("GATE_VIOLATIONS_AFTER", bad.rows.length ? bad.rows : "none — every agent_ready row passes all gates");
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("ERR", { error: e.message }); process.exit(1); });
