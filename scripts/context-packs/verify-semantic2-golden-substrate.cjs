#!/usr/bin/env node
//
// Semantic2 golden substrate-proof — SkyHarbor.
//
// Answers the one gate the Home/Intelligence wiring waits on: are the entities
// the 5 golden questions need actually present AND answerable in the LIVE Azure
// enterprise_context_* tables — not just "rows exist", but "the payload carries
// the fields the composer reads".
//
// Reuses the proven connection + tenant-alias pattern from verify-v4-live-counts.cjs
// (handles the skyharbor / skyharbor-air key landmine). Must run with VNet reach
// to the private DB — set ABARVA_AZURE_DATABASE_URL (or DATABASE_URL). See the run
// recipe in docs/semantic2-answer-synthesis/SUBSTRATE_PROOF.md.
//
// Output: a single RESULT_JSON line (grep it out of the job log).

const { Client } = require('pg');

const TENANT = {
  key: 'skyharbor-air',
  name: 'SkyHarbor Air',
  aliases: ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
};

// Each golden question maps to payload keys it needs from enterprise_context_records.
const GOLDEN_NEEDS = [
  { q: 'Q1 IT org ownership', anyKey: ['executive_owner_role', 'owner_role', 'reports_to_role'] },
  { q: 'Q2 capability dependency', anyKey: ['business_criticality', 'criticality'] },
  { q: 'Q3 data & analytics estate', anyKey: ['platform', 'trust_score'] },
  { q: 'Q4 vendor footprint', anyKey: ['vendor', 'annual_run_rate_usd', 'annual_contract_value_usd'] },
];

const EXPECTED = { records_min: 4000, facts_min: 1, relationships_min: 1 }; // SkyHarbor context_rows ~6083

function orExists(keys, startIdx) {
  return keys.map((_, i) => `jsonb_exists(payload::jsonb, $${startIdx + i})`).join(' or ');
}

async function main() {
  const cs = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
  if (!cs) throw new Error('ABARVA_AZURE_DATABASE_URL or DATABASE_URL required (VNet reach to the private DB)');
  const pg = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const a = TENANT.aliases;
  try {
    // 1. Which tenant_key form is actually present, and total records.
    const present = await pg.query(
      'select tenant_key, count(*)::int n from enterprise_context_records where tenant_key = any($1::text[]) group by 1 order by 2 desc',
      [a],
    );
    const totalRecords = present.rows.reduce((s, r) => s + r.n, 0);

    // 2. record_type distribution (discovery — we learn how the live loader typed things).
    const types = await pg.query(
      'select record_type, count(*)::int n from enterprise_context_records where tenant_key = any($1::text[]) group by 1 order by 2 desc',
      [a],
    );
    const facts = await pg.query('select count(*)::int n from enterprise_context_facts where tenant_key = any($1::text[])', [a]);
    const rels = await pg.query('select count(*)::int n from enterprise_context_relationships where tenant_key = any($1::text[])', [a]);

    // 3. Golden answerability — does payload carry the keys each question reads?
    const checks = [];
    for (const need of GOLDEN_NEEDS) {
      const cond = orExists(need.anyKey, 2);
      const r = await pg.query(
        `select count(*)::int n from enterprise_context_records where tenant_key = any($1::text[]) and (${cond})`,
        [a, ...need.anyKey],
      );
      const sample = await pg.query(
        `select payload from enterprise_context_records where tenant_key = any($1::text[]) and (${cond}) limit 1`,
        [a, ...need.anyKey],
      );
      checks.push({
        question: need.q,
        any_of_keys: need.anyKey,
        matching_records: r.rows[0].n,
        sample_payload_keys: sample.rows[0] ? Object.keys(sample.rows[0].payload || {}).slice(0, 14) : [],
      });
    }

    // 4. Concrete Q1 proof — pull a couple IT-org rows the way the composer would.
    const q1cond = orExists(['executive_owner_role', 'owner_role'], 2);
    const q1 = await pg.query(
      `select payload->>'team_name' as team, coalesce(payload->>'executive_owner_role', payload->>'owner_role') as owner_role,
              payload->>'annual_budget_usd' as budget
       from enterprise_context_records where tenant_key = any($1::text[]) and (${q1cond}) limit 3`,
      [a, 'executive_owner_role', 'owner_role'],
    );

    const pass = totalRecords >= EXPECTED.records_min && checks.every((c) => c.matching_records > 0);

    const verdict = {
      pass,
      tenant_key_forms_present: present.rows,
      total_records: totalRecords,
      facts: facts.rows[0].n,
      relationships: rels.rows[0].n,
      record_type_distribution: types.rows.slice(0, 30),
      golden_answerability: checks,
      q1_live_sample: q1.rows,
      interpretation: pass
        ? 'LIVE substrate is golden-ready: records present + every golden question has matching payload keys. Swap the dataset adapter for a live-Azure retriever and flip the flag.'
        : 'NOT golden-ready. If total_records is low: data not loaded for SkyHarbor — load first. If matching_records is 0 for a question: the field exists in the dataset but not in the live payload — the loader is dropping/renaming it; fix the loader or add a mapping before wiring.',
    };
    console.log('RESULT_JSON ' + JSON.stringify({ ok: true, tenant: TENANT.key, verified_at: new Date().toISOString(), verdict }, null, 2));
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error('RESULT_JSON ' + JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
