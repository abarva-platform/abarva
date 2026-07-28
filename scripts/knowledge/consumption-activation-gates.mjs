#!/usr/bin/env node
/**
 * Consumption activation gates — machine-checkable exit criteria for flipping a
 * tenant from the fixture provider to the governed HTTP consumption provider.
 *
 * Encodes the eight activation conditions. READ-ONLY: this script never writes
 * to any database and never activates anything. It reports, per gate, one of
 * PASS / FAIL / UNVERIFIED (needs a DB) / REQUIRES_PROOF (needs a runtime/human
 * proof). Activation is ALLOWED only when every gate is PASS.
 *
 * Usage:
 *   node scripts/knowledge/consumption-activation-gates.mjs --tenant <key> [--baseline <ref>] [--strict]
 *   (set DATABASE_URL / AZURE_LAB_DATABASE_URL to run the DB-backed gates read-only)
 *
 * This is the enforcement for "keep the flag off until real-data parity is
 * proven." It is intended to run as part of the Bucket-B activation runbook, not
 * to mutate the data plane.
 */

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const tenant = getArg("tenant");
const baseline = getArg("baseline") ?? null;
const strict = args.includes("--strict");
const FIXTURE_PREFIX = "fixture-";

if (!tenant) {
  console.error("ERROR: --tenant <key> is required.");
  process.exit(2);
}

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.AZURE_LAB_DATABASE_URL ||
  process.env.TARGET_DATABASE_URL ||
  null;

const results = [];
const record = (id, title, status, detail) =>
  results.push({ id, title, status, detail });

/** Read-only query helper. Returns null (and marks UNVERIFIED at call site) if no DB. */
async function query(sql, params) {
  if (!dbUrl) return null;
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const r = await client.query(sql, params);
    return r.rows;
  } finally {
    await client.end();
  }
}

async function run() {
  // GATE 4 (code-only, definitive): a real tenant can never resolve to fixtures.
  // Mirrors assertFixtureNamespace() in src/lib/knowledge/fixtures/index.ts.
  if (tenant.startsWith(FIXTURE_PREFIX)) {
    record(4, "No fixture provider for the activated tenant", "FAIL",
      `Tenant "${tenant}" is a fixture namespace; a fixture tenant must never be activated as real.`);
  } else {
    record(4, "No fixture provider for the activated tenant", "PASS",
      `"${tenant}" is not a fixture namespace; the fixture path fails closed for it.`);
  }

  // GATE 1: an active baseline exists.
  try {
    const rows = await query(
      `SELECT knowledge_baseline_ref FROM publication.active_knowledge_baseline WHERE tenant_key = $1`,
      [tenant]);
    if (rows === null) record(1, "Active baseline exists", "UNVERIFIED", "No DB connection; run in Bucket B against the lab.");
    else if (rows.length === 1) record(1, "Active baseline exists", "PASS", `active baseline = ${rows[0].knowledge_baseline_ref}`);
    else record(1, "Active baseline exists", "FAIL", `expected exactly 1 active baseline, found ${rows.length}`);
  } catch (e) { record(1, "Active baseline exists", "UNVERIFIED", `schema not present: ${e.message}`); }

  // GATE 2: projection build succeeded (no failed refresh_run for the active baseline).
  try {
    const rows = await query(
      `SELECT count(*)::int AS fails FROM consumption.refresh_run
       WHERE tenant_key = $1 AND status = 'fail'
         AND ($2::text IS NULL OR knowledge_baseline_ref = $2)`,
      [tenant, baseline]);
    if (rows === null) record(2, "Projection build succeeded", "UNVERIFIED", "No DB connection.");
    else if (rows[0].fails === 0) record(2, "Projection build succeeded", "PASS", "0 failed refresh_run rows");
    else record(2, "Projection build succeeded", "FAIL", `${rows[0].fails} failed refresh_run rows`);
  } catch (e) { record(2, "Projection build succeeded", "UNVERIFIED", `schema not present: ${e.message}`); }

  // GATE 3: canonical ↔ publication ↔ consumption counts reconcile.
  try {
    const rows = await query(
      `SELECT count(*)::int AS n FROM consumption.consumer_reconciliation_ledger
       WHERE tenant_key = $1 AND status = 'fail'`,
      [tenant]);
    if (rows === null) record(3, "Counts reconcile (canonical↔publication↔consumption)", "UNVERIFIED", "No DB connection.");
    else if (rows[0].n === 0) record(3, "Counts reconcile", "PASS", "no reconciliation failures");
    else record(3, "Counts reconcile", "FAIL", `${rows[0].n} reconciliation failures`);
  } catch (e) { record(3, "Counts reconcile", "UNVERIFIED", `schema not present: ${e.message}`); }

  // GATE 6: Cube/metric ↔ Postgres metric parity.
  try {
    const rows = await query(
      `SELECT count(*)::int AS n FROM consumption.consumer_reconciliation_ledger
       WHERE tenant_key = $1 AND measure_or_view LIKE 'metric%' AND status = 'fail'`,
      [tenant]);
    if (rows === null) record(6, "Cube ↔ Postgres metric parity", "UNVERIFIED", "No DB connection.");
    else if (rows[0].n === 0) record(6, "Cube ↔ Postgres metric parity", "PASS", "metric parity holds");
    else record(6, "Cube ↔ Postgres metric parity", "FAIL", `${rows[0].n} metric parity failures`);
  } catch (e) { record(6, "Cube ↔ Postgres metric parity", "UNVERIFIED", `schema not present: ${e.message}`); }

  // GATE 8: rollback to the prior baseline is proven.
  try {
    const rows = await query(
      `SELECT previous_baseline_ref FROM publication.active_knowledge_baseline WHERE tenant_key = $1`,
      [tenant]);
    if (rows === null) record(8, "Rollback to prior baseline proven", "UNVERIFIED", "No DB connection.");
    else if (rows.length && rows[0].previous_baseline_ref) record(8, "Rollback to prior baseline proven", "PASS", `prior = ${rows[0].previous_baseline_ref}`);
    else record(8, "Rollback to prior baseline proven", "REQUIRES_PROOF", "No prior baseline yet (first activation); rollback drill must be captured before enabling.");
  } catch (e) { record(8, "Rollback to prior baseline proven", "UNVERIFIED", `schema not present: ${e.message}`); }

  // GATE 5 + 7: runtime/human proofs — cannot be asserted from a DB query.
  record(5, "Home renders without Cube AND without aVa", "REQUIRES_PROOF",
    "Capture a deterministic-path render with Cube unavailable and models disabled (screenshot + no model call on load).");
  record(7, "Signed-in admin AND tenant proof pass", "REQUIRES_PROOF",
    "Capture signed-in platform-admin and signed-in tenant renders of the governed shell for this tenant.");

  // ---- report ----
  results.sort((a, b) => a.id - b.id);
  console.log(`\nConsumption activation gates — tenant="${tenant}"${baseline ? ` baseline="${baseline}"` : ""}\n`);
  for (const r of results) {
    const mark = { PASS: "PASS ✓", FAIL: "FAIL ✗", UNVERIFIED: "UNVERIFIED", REQUIRES_PROOF: "REQUIRES_PROOF" }[r.status];
    console.log(`  [${r.id}] ${mark.padEnd(15)} ${r.title}\n        ${r.detail}`);
  }
  const allPass = results.every((r) => r.status === "PASS");
  console.log(`\n  ACTIVATION ${allPass ? "ALLOWED — all eight gates PASS." : "BLOCKED — not all gates PASS."}\n`);
  if (!allPass && strict) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(2); });
