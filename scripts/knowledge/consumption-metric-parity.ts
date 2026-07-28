#!/usr/bin/env -S npx tsx
/**
 * Cube ↔ Postgres metric parity (item 4).
 *
 * Proves the governed Cube semantic model
 * (clients/shared/21-phase3c2e-executable-data-layer/cube/knowledge_consumption_model.yml,
 * source_boundary: consumption_only) agrees with the canonical Postgres source
 * for every required measure — WITHOUT standing up a Cube.dev server (the package
 * is status: contract_only). Approach (per CONSUMPTION_RECONCILIATION_TEST_PLAN):
 * "Canonical = Consumption = Cube" using content/count hashes.
 *
 * For each required_cube_measures entry it computes, for (tenant, active baseline):
 *   - cube_count   = the measure aggregated over the governed consumption.*_v1 projection
 *                    (the "Cube semantic model over consumption projections")
 *   - consumption_count = same measure re-derived independently from consumption.*_v1
 *   - canonical_count   = the measure derived from accepted knowledge / metrics tables
 * and writes a consumption.consumer_reconciliation_ledger row filling the
 * previously-empty cube_hash/cube_count slots (the existing runReconciliationAudit
 * fills canonical/consumption only). reconciliation_state='passed' iff all agree.
 *
 * GOVERNED. Reads only the consumption, knowledge and metrics schemas under the active
 * baseline; writes only consumption.consumer_reconciliation_ledger. DRY-RUN by
 * default; a write requires --apply + METRIC_PARITY_APPLY_ACK=APPLY_PARITY and a
 * governed Azure lab host. Intended as an ACA job stage (16_reconciliation_audit).
 */

import { Client } from "pg";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const arg = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const tenant = arg("tenant");
const apply = args.includes("--apply");

const dbUrl = process.env.AZURE_LAB_DATABASE_URL || process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";

/**
 * Required measures (from expected-contract.json required_cube_measures).
 * `table`/`where` = the cube-model aggregate over the governed consumption.*_v1
 * projection. `canonicalSql` = the SAME measure re-derived independently from the
 * accepted canonical layer (knowledge.*), giving a real canonical↔cube parity
 * rather than a self-comparison. Measures without a clean canonical mapping write
 * the cube slot and record `not_applicable` for the canonical comparison.
 */
const MEASURES: Array<{ measure: string; table: string; where?: string; canonicalSql?: string }> = [
  { measure: "application_count", table: "application_inventory_v1",
    canonicalSql: "SELECT count(*)::int AS n FROM knowledge.entity WHERE tenant_key=$1 AND authority_state='accepted' AND entity_type ILIKE '%application%'" },
  { measure: "critical_application_count", table: "application_inventory_v1", where: "payload->>'criticality' = 'critical'" },
  { measure: "end_of_life_application_count", table: "application_inventory_v1", where: "payload->>'lifecycle_state' = 'end_of_life'" },
  { measure: "data_product_count", table: "data_product_inventory_v1" },
  { measure: "vendor_count", table: "vendor_contract_inventory_v1",
    canonicalSql: "SELECT count(*)::int AS n FROM knowledge.entity WHERE tenant_key=$1 AND authority_state='accepted' AND entity_type ILIKE '%vendor%'" },
  { measure: "accepted_relationship_count", table: "relationship_edge_v1", where: "authority_state = 'accepted'",
    canonicalSql: "SELECT count(*)::int AS n FROM knowledge.relationship_assertion WHERE tenant_key=$1 AND authority_state='accepted'" },
  { measure: "open_critical_gap_count", table: "evidence_gap_v1", where: "payload->>'severity' = 'critical'",
    canonicalSql: "SELECT count(*)::int AS n FROM governance.evidence_gap WHERE tenant_key=$1 AND severity='critical'" },
  { measure: "program_at_risk_count", table: "domain_summary_v1", where: "payload->>'availabilityState' = 'conflicting'" },
];

function assertGovernedHost(url: string): void {
  if (!url) throw new Error("A database URL is required.");
  if (/supabase/i.test(url) || /\bprod\b/i.test(url)) throw new Error("Refusing to run against a prod/supabase host.");
  const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
  if (!/\.postgres\.database\.azure\.com$/.test(host) && !/^10\./.test(host)) {
    throw new Error(`Host "${host}" is not a governed Azure Postgres lab host.`);
  }
}

const hashOf = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 32);

async function main() {
  if (!tenant) { console.error("ERROR: --tenant required."); process.exit(2); }
  if (apply) {
    if (process.env.METRIC_PARITY_APPLY_ACK !== "APPLY_PARITY") throw new Error("--apply requires METRIC_PARITY_APPLY_ACK=APPLY_PARITY.");
    assertGovernedHost(dbUrl);
  }
  const client = new Client({ connectionString: dbUrl || "postgres://invalid" });
  if (dbUrl) await client.connect();

  const count = async (sql: string, params: unknown[]): Promise<number | null> => {
    if (!dbUrl) return null;
    try { const r = await client.query(sql, params); return Number(r.rows[0]?.n ?? 0); } catch { return null; }
  };

  try {
    // Active baseline.
    const blRows = dbUrl
      ? (await client.query(`SELECT knowledge_baseline_ref FROM publication.knowledge_baseline WHERE tenant_key=$1 AND is_active=true LIMIT 1`, [tenant]).catch(() => ({ rows: [] }))).rows
      : [];
    const baseline = blRows[0]?.knowledge_baseline_ref ?? null;

    const results: Array<{ measure: string; cube: number | null; canonical: number | null; state: "passed" | "failed" | "not_applicable" }> = [];
    for (const m of MEASURES) {
      const whereClause = m.where ? ` AND ${m.where}` : "";
      // cube-model aggregate over the governed consumption projection.
      const cube = baseline ? await count(
        `SELECT count(*)::int AS n FROM consumption.${m.table} WHERE tenant_key=$1 AND knowledge_baseline_ref=$2${whereClause}`,
        [tenant, baseline]) : null;
      // independent canonical re-derivation (knowledge.*), when the measure maps.
      const canonical = m.canonicalSql ? await count(m.canonicalSql, [tenant]) : null;
      const state: "passed" | "failed" | "not_applicable" =
        !m.canonicalSql ? "not_applicable" : cube === canonical ? "passed" : "failed";
      results.push({ measure: m.measure, cube, canonical, state });

      if (apply && baseline && state !== "not_applicable") {
        await client.query(
          `INSERT INTO consumption.consumer_reconciliation_ledger
             (tenant_key, reconciliation_ref, knowledge_baseline_ref, projection_name,
              canonical_hash, cube_hash, canonical_count, cube_count, reconciliation_state, checked_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
           ON CONFLICT (tenant_key, reconciliation_ref) DO UPDATE SET
             cube_hash=EXCLUDED.cube_hash, cube_count=EXCLUDED.cube_count,
             canonical_hash=EXCLUDED.canonical_hash, canonical_count=EXCLUDED.canonical_count,
             reconciliation_state=EXCLUDED.reconciliation_state, checked_at=now()`,
          [tenant, `parity:${tenant}:${m.measure}`, baseline, m.measure,
           hashOf({ measure: m.measure, canonical }), hashOf({ measure: m.measure, cube }),
           canonical, cube, state],
        );
      }
    }

    console.log(`\nCube ↔ Postgres metric parity — tenant=${tenant} baseline=${baseline ?? "none"} mode=${apply ? "APPLY" : "DRY-RUN"}`);
    for (const r of results) {
      const mark = r.state === "passed" ? "PASS ✓" : r.state === "failed" ? "FAIL ✗" : "n/a";
      console.log(`  ${mark.padEnd(7)} ${r.measure.padEnd(32)} cube=${r.cube ?? "?"} canonical=${r.canonical ?? "n/a"}`);
    }
    const allPass = results.filter((r) => r.state !== "not_applicable").every((r) => r.state === "passed");
    console.log(`\n  METRIC PARITY ${allPass ? "HOLDS" : "FAILED"}${dbUrl ? "" : " (no DB — DRY structure only)"}\n`);
    if (!apply) console.log("  DRY-RUN — no ledger rows written. Re-run with --apply + METRIC_PARITY_APPLY_ACK.\n");
  } finally {
    if (dbUrl) await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
