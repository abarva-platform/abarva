import "server-only";
import { Pool } from "pg";
import { askIntelligence } from "@/lib/intelligence/ask";

const M = "___BUNDLE___";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
async function resolveTenantId(keys: string[]): Promise<string | null> {
  const r = await pool.query(
    `SELECT id, tenant_key, slug FROM clients WHERE tenant_key = ANY($1::text[]) OR slug = ANY($1::text[]) LIMIT 1`,
    [keys],
  );
  return r.rows[0]?.id ? String(r.rows[0].id) : null;
}
const emit = (k: string, v: unknown) => {
  let s: string;
  try { s = JSON.stringify(v); } catch { s = String(v); }
  if (s.length > 6500) s = s.slice(0, 6500) + "…TRUNC";
  console.log(`${M}${k}${M}${s}`);
};

const TENANTS = [
  { clientKey: "meridian", tenantKey: "meridian-health",
    q: "Which applications are most critical and which vendor contracts renew next? Cite evidence." },
  { clientKey: "lakeshore", tenantKey: "lakeshore-holdings",
    q: "What are our top business capabilities and largest vendor contracts? Cite evidence." },
  { clientKey: "apexretail", tenantKey: "apex-retail",
    q: "Which applications carry the highest run cost and which vendor contracts renew next? Cite evidence." },
];

async function run(t: typeof TENANTS[number]) {
  let answer = "", sources: any[] = [], coverage: any = null, err: string | null = null, classified: any = null;
  const tenantId = await resolveTenantId([t.clientKey, t.tenantKey]);
  emit("TENANTID", { clientKey: t.clientKey, tenantId });
  try {
    const stream = askIntelligence(t.q, {
      tenant: t.tenantKey,
      tenantId,
      tenantClientKey: t.clientKey,
      tenantInventoryKey: t.tenantKey,
      userId: "clf-bundle-proof",
    } as any);
    for await (const ev of stream as any) {
      if (ev.type === "delta" && typeof ev.text === "string") answer += ev.text;
      else if (ev.type === "sources") { if (Array.isArray(ev.sources)) sources = ev.sources; if (ev.coverageReport !== undefined) coverage = ev.coverageReport; }
      else if (ev.type === "classified") classified = ev;
      else if (ev.type === "error") err = ev.error ?? "error";
    }
  } catch (e: any) { err = e?.message ?? String(e); }

  // tenant-leakage check: does any returned source reference another tenant's keys?
  const others = TENANTS.filter((x) => x.clientKey !== t.clientKey).flatMap((x) => [x.clientKey, x.tenantKey]);
  const leaks = sources.filter((s) => {
    const blob = JSON.stringify(s).toLowerCase();
    return others.some((k) => blob.includes(k.toLowerCase()));
  });

  const cov: any = coverage || {};
  emit(t.clientKey, {
    tenant_key: t.tenantKey,
    client_key: t.clientKey,
    tenant_id: tenantId,
    user_intent: t.q,
    model_call_allowed: answer.length > 0,
    grounding_status: sources.length > 0 ? "grounded" : "ungrounded",
    answer_len: answer.length,
    answer_excerpt: answer.slice(0, 420),
    error: err,
    source_count: sources.length,
    citations_emitted: sources.slice(0, 6).map((s) => ({ type: s.type, name: String(s.name ?? "").slice(0, 55), seg: s.sourceSegmentId ?? s.segment ?? null })),
    source_type_buckets: sources.reduce((m: any, s) => { m[s.type] = (m[s.type] ?? 0) + 1; return m; }, {}),
    coverage_status: cov.status ?? null,
    present_segments: cov.presentSegments ?? null,
    missing_segments: cov.missingSegments ?? null,
    tenant_leakage_status: leaks.length === 0 ? "no_leak" : `LEAK:${leaks.length}`,
    classified_intent: classified ? (classified.intent ?? classified.type) : null,
  });
}

(async () => {
  for (const t of TENANTS) {
    emit("RUN", { tenant: t.clientKey });
    await run(t);
  }
  await pool.end();
  console.log(`${M}DONE${M}{}`);
})().catch((e) => { emit("FATAL", { error: e?.message ?? String(e) }); process.exit(1); });
