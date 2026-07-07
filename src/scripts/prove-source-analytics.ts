// ─────────────────────────────────────────────────────────────────────────────
// prove-source-analytics.ts — a headless, end-to-end proof of the Source
// value-analytics engine against the REAL data plane.
//
// The product routes (ingest/parse/door1/canvas) are Clerk-gated, so they can't
// be driven from a job. But the deterministic engine needs only a DB connection.
// This script proves the whole chain WITHOUT a browser session:
//
//   PART A · ENGINE — build an EventFactMap from realistic Lakeshore AMS facts,
//     run evaluateValueLevers + buildValueWaterfall, print the computed
//     value-type waterfall (ranges, confidence, per-type roll-up). No DB write.
//   PART B · PERSISTENCE — if a Lakeshore source_events row exists, INSERT the
//     facts into source_event_facts (real table, real citations), read them
//     back via SQL, rebuild the map, and re-run the engine — proving the value
//     is computed from PERSISTED, cited facts, not in-memory constants. The
//     proof rows are tagged and deleted at the end (idempotent).
//   PART C · HONESTY — drop a citationRequired input and show that lever renders
//     insufficient-evidence (missing keys named), never a fabricated number.
//
// Run in the VNet via an ACA job (the private Postgres is unreachable from a
// laptop). Read-mostly: PART B writes then deletes its own tagged rows.
//
//   npx tsx src/scripts/prove-source-analytics.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';
import {
  evaluateValueLevers,
  buildValueWaterfall,
} from '@/lib/source/facts/evaluators';
import type {
  EventFactMap,
  ValueLeverResult,
  ValueWaterfall,
} from '@/lib/source/facts/evaluators';
import { AMS_MANAGED_SERVICES } from '@/lib/source/archetypes/registry';
import { factSpecByKey } from '@/lib/source/facts/fact-catalog';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const CLIENT_KEY = 'lakeshore';
const PROOF_TAG = 'source-analytics-live-proof';

// A realistic Lakeshore AMS fact set (illustrative synthetic values). Each key is
// a canonical catalog fact; each carries a citation so the value is defensible.
interface ProofFact {
  fact_key: string;
  value: number;
  entity_kind: 'event' | 'tower' | 'app' | 'vendor';
  entity_ref: string | null;
  citation: { doc: string; locator: string };
  confidence: 'low' | 'med' | 'high';
}

const PROOF_FACTS: ProofFact[] = [
  // ENHANCEMENT_LEAKAGE (protected)
  { fact_key: 'annual_change_order_spend', value: 8_400_000, entity_kind: 'event', entity_ref: null, citation: { doc: 'Incumbent AMS MSA', locator: 'Sch. C — change-order ledger FY25' }, confidence: 'high' },
  { fact_key: 'recurring_avoidable_pct', value: 42, entity_kind: 'event', entity_ref: null, citation: { doc: 'Lakeshore ticket taxonomy', locator: 'Enhancement vs run classification' }, confidence: 'med' },
  { fact_key: 'term_years', value: 5, entity_kind: 'event', entity_ref: null, citation: { doc: 'Draft AMS RFP', locator: '§2 Term' }, confidence: 'high' },
  // VOLUME_BAND_PRICING (incremental_negotiated)
  { fact_key: 'annual_run_cost', value: 46_000_000, entity_kind: 'tower', entity_ref: 'AMS-RUN', citation: { doc: 'Run-cost baseline', locator: 'Committed FY25 tower spend' }, confidence: 'high' },
  { fact_key: 'projected_volume_decline_pct', value: 18, entity_kind: 'tower', entity_ref: 'AMS-RUN', citation: { doc: 'Enterprise inventory', locator: 'Ticket-volume trend 3yr' }, confidence: 'med' },
  { fact_key: 'variable_cost_share_pct', value: 55, entity_kind: 'tower', entity_ref: 'AMS-RUN', citation: { doc: 'Vendor pricing schedule', locator: 'Fixed vs variable split' }, confidence: 'med' },
  // PRODUCTIVITY_CREDITS (solution_tightening)
  { fact_key: 'automatable_effort_pool', value: 12_500_000, entity_kind: 'event', entity_ref: null, citation: { doc: 'Should-cost model', locator: 'Automatable effort pool' }, confidence: 'med' },
  { fact_key: 'committed_credit_pct', value: 8, entity_kind: 'vendor', entity_ref: 'INCUMBENT', citation: { doc: 'Vendor proposal', locator: 'Productivity credit schedule' }, confidence: 'med' },
  // RETAINED_COST (risk_adjusted)
  { fact_key: 'retained_fte_delta', value: 14, entity_kind: 'vendor', entity_ref: 'INCUMBENT', citation: { doc: 'Vendor proposal', locator: 'Retained-org model' }, confidence: 'low' },
  { fact_key: 'loaded_fte_cost', value: 185_000, entity_kind: 'event', entity_ref: null, citation: { doc: 'Enterprise inventory', locator: 'Loaded FTE cost' }, confidence: 'high' },
  // SLA_ECONOMICS (protected)
  { fact_key: 'at_risk_fee_pool', value: 9_200_000, entity_kind: 'vendor', entity_ref: 'INCUMBENT', citation: { doc: 'Vendor proposal', locator: 'Fee pool at risk' }, confidence: 'med' },
  { fact_key: 'credit_cap_pct', value: 12, entity_kind: 'vendor', entity_ref: 'INCUMBENT', citation: { doc: 'Vendor proposal', locator: 'SLA credit cap' }, confidence: 'med' },
  { fact_key: 'chronic_miss_rate', value: 9, entity_kind: 'event', entity_ref: null, citation: { doc: 'Incident record', locator: 'Chronic-miss rate FY25' }, confidence: 'med' },
  // TRANSITION_RISK (risk_adjusted)
  { fact_key: 'transition_fee', value: 3_100_000, entity_kind: 'vendor', entity_ref: 'INCUMBENT', citation: { doc: 'Vendor proposal', locator: 'Transition fee' }, confidence: 'high' },
  { fact_key: 'overrun_probability', value: 30, entity_kind: 'event', entity_ref: null, citation: { doc: 'ISG AMS benchmark', locator: 'Transition overrun probability' }, confidence: 'med' },
  { fact_key: 'overrun_cost_multiple', value: 1.6, entity_kind: 'event', entity_ref: null, citation: { doc: 'ISG AMS benchmark', locator: 'Overrun cost multiple' }, confidence: 'low' },
];

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function factMapFrom(facts: ProofFact[]): EventFactMap {
  const map: Record<string, number> = {};
  for (const f of facts) map[f.fact_key] = f.value;
  return map;
}

function printLevers(results: ValueLeverResult[]): void {
  console.log('\n  Per-lever results:');
  for (const r of results) {
    if (r.insufficientEvidence) {
      console.log(`   • ${r.key.padEnd(26)} [${r.valueType}]  INSUFFICIENT EVIDENCE — needs: ${r.missingEvidence.join(', ')}`);
    } else {
      console.log(`   • ${r.key.padEnd(26)} [${r.valueType}]  ${USD.format(r.low)}–${USD.format(r.high)}  (${r.confidence})`);
    }
  }
}

function printWaterfall(w: ValueWaterfall): void {
  console.log('\n  VALUE-TYPE WATERFALL (no single headline; protected/risk stated separately):');
  for (const b of w.bands) {
    console.log(`   ▸ ${b.valueType.padEnd(22)} ${USD.format(b.low)}–${USD.format(b.high)}  (${b.confidence})  [${b.leverKeys.length} lever(s)]`);
  }
  console.log(`   computed levers: ${w.computedLeverCount}   insufficient: ${w.insufficientLevers.length ? w.insufficientLevers.join(', ') : 'none'}`);
}

async function main(): Promise<void> {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(' SOURCE VALUE-ANALYTICS — LIVE ENGINE PROOF (Lakeshore, AMS)');
  console.log('══════════════════════════════════════════════════════════════════');

  // ── PART A · ENGINE (no DB) ──────────────────────────────────────────────
  console.log('\n── PART A · engine over in-memory facts ──');
  const facts = factMapFrom(PROOF_FACTS);
  const resultsA = evaluateValueLevers(AMS_MANAGED_SERVICES, facts);
  printLevers(resultsA);
  printWaterfall(buildValueWaterfall(resultsA));

  // ── PART C · HONESTY (drop a citationRequired input) ─────────────────────
  console.log('\n── PART C · honesty — drop committed_credit_pct (a required input) ──');
  const starved = { ...facts };
  delete starved['committed_credit_pct'];
  const resultsC = evaluateValueLevers(AMS_MANAGED_SERVICES, starved);
  const credit = resultsC.find((r) => r.key === 'AMS.PRODUCTIVITY_CREDITS');
  if (credit && credit.insufficientEvidence) {
    console.log(`   ✓ AMS.PRODUCTIVITY_CREDITS correctly abstains — missing: ${credit.missingEvidence.join(', ')} (no fabricated number)`);
  } else {
    console.log('   ✗ UNEXPECTED: the credit lever did not abstain when its required fact was absent');
  }

  // ── PART B · PERSISTENCE (real DB round-trip) ────────────────────────────
  console.log('\n── PART B · persistence round-trip via source_event_facts ──');
  const conn =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!conn) {
    console.log('   (skipped — no ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL / DATABASE_URL)');
    return;
  }
  const client = new Client(postgresClientOptions(conn));
  await client.connect();
  console.log('   ✓ connected to Postgres');
  try {
    // Confirm the table exists (proves the migration).
    const reg = await client.query("SELECT to_regclass('public.source_event_facts') AS t");
    if (!reg.rows[0]?.t) {
      console.log('   ✗ source_event_facts does not exist — migration not applied');
      return;
    }
    console.log('   ✓ source_event_facts table exists (migration applied)');

    // Find a Lakeshore source_events row to attach facts to (FK requires one).
    const ev = await client.query(
      "SELECT id FROM source_events WHERE client_key = $1 ORDER BY created_at DESC LIMIT 1",
      [CLIENT_KEY],
    );
    const eventId: string | undefined = ev.rows[0]?.id;
    if (!eventId) {
      console.log(`   (persistence round-trip skipped — no source_events row for client_key='${CLIENT_KEY}'; the FK requires a real event. Engine proof in PART A stands.)`);
      return;
    }
    console.log(`   ✓ using Lakeshore source_event ${eventId}`);

    // Clean any prior proof rows (idempotent), then insert this batch.
    await client.query(
      "DELETE FROM source_event_facts WHERE source_event_id = $1 AND client_key = $2 AND source_citation->>'proof_tag' = $3",
      [eventId, CLIENT_KEY, PROOF_TAG],
    );
    for (const f of PROOF_FACTS) {
      const spec = factSpecByKey(f.fact_key);
      await client.query(
        `INSERT INTO source_event_facts
           (source_event_id, client_key, fact_key, entity_kind, entity_ref,
            value_numeric, unit, source_method, source_citation, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'parsed',$8,$9)`,
        [
          eventId, CLIENT_KEY, f.fact_key, f.entity_kind, f.entity_ref,
          f.value, spec?.unit ?? 'count',
          JSON.stringify({ ...f.citation, proof_tag: PROOF_TAG }), f.confidence,
        ],
      );
    }
    console.log(`   ✓ inserted ${PROOF_FACTS.length} cited facts`);

    // Read them BACK from the DB and rebuild the fact map — the value must be
    // computed from persisted rows, not the in-memory constants.
    const back = await client.query(
      "SELECT fact_key, value_numeric FROM source_event_facts WHERE source_event_id = $1 AND client_key = $2 AND source_citation->>'proof_tag' = $3",
      [eventId, CLIENT_KEY, PROOF_TAG],
    );
    const dbMap: Record<string, number> = {};
    for (const row of back.rows) dbMap[row.fact_key] = Number(row.value_numeric);
    console.log(`   ✓ read back ${back.rows.length} facts from the DB`);

    const resultsB = evaluateValueLevers(AMS_MANAGED_SERVICES, dbMap);
    printLevers(resultsB);
    const wB = buildValueWaterfall(resultsB);
    printWaterfall(wB);

    // Clean up the proof rows.
    const del = await client.query(
      "DELETE FROM source_event_facts WHERE source_event_id = $1 AND client_key = $2 AND source_citation->>'proof_tag' = $3",
      [eventId, CLIENT_KEY, PROOF_TAG],
    );
    console.log(`   ✓ cleaned up ${del.rowCount} proof rows`);
    console.log('\n   RESULT: value-type waterfall computed from PERSISTED, cited Lakeshore facts.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('PROOF FAILED:', err);
  process.exit(1);
});
