// Apex-realness audit for the Contact Center AI Routing Move.
//
// SELECT-only. Loads .env.local + DATABASE_URL, inspects what baseline data
// genuinely exists for the seeded Apex Move so the Expert Kernel can ground
// the business-case skeleton honestly (present / partial / absent).
//
// Run: npx tsx src/scripts/audit-apex-contact-center-realness.ts

import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

async function rows(client: Client, sql: string, params: unknown[] = []) {
  try {
    const r = await client.query(sql, params);
    return r.rows;
  } catch (e) {
    return [{ __error: (e as Error).message }];
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('x DATABASE_URL is required for the Apex-realness audit.');
    process.exit(1);
  }
  const client = new Client(
    postgresClientOptions(url, 'audit-apex-contact-center-realness'),
  );
  await client.connect();
  try {
    const report: Record<string, unknown> = {};

    report.clients = await rows(
      client,
      "select id, client_key, name from clients where client_key ilike '%apex%'",
    );

    report.ai_initiatives = await rows(
      client,
      "select id, name, phase, status from ai_initiatives where name ilike '%contact center%'",
    );

    report.programs = await rows(
      client,
      "select id, name, phase, status from programs where name ilike '%contact center%'",
    );

    report.program_milestones = await rows(
      client,
      "select name, phase, status, target_date from program_milestones where program_id in (select id from programs where name ilike '%contact center%')",
    );

    report.kpis = await rows(
      client,
      "select count(*)::int as n from kpis k join clients c on c.id = k.client_id where c.client_key ilike '%apex%'",
    );

    report.kpi_cluster_2_3 = await rows(
      client,
      "select name, current_value, target_value, unit from kpis k join clients c on c.id = k.client_id where c.client_key ilike '%apex%' and (k.name ilike '%csat%' or k.name ilike '%nps%' or k.name ilike '%retention%') limit 20",
    );

    report.it_financials = await rows(
      client,
      "select count(*)::int as n from data_segment_it_financials f join clients c on c.id = f.client_id where c.client_key ilike '%apex%'",
    );

    report.contact_center_context_chunks = await rows(
      client,
      "select count(*)::int as n from enterprise_context_chunks ch join clients c on c.id = ch.client_id where c.client_key ilike '%apex%' and (ch.content ilike '%handle time%' or ch.content ilike '%contact cent%' or ch.content ilike '%call volume%' or ch.content ilike '%containment%')",
    );

    report.operating_telemetry = await rows(
      client,
      "select count(*)::int as n from data_segment_operating_telemetry t join clients c on c.id = t.client_id where c.client_key ilike '%apex%'",
    );

    report.vendor_contracts = await rows(
      client,
      "select count(*)::int as n from data_segment_vendor_contracts v join clients c on c.id = v.client_id where c.client_key ilike '%apex%'",
    );

    report.baseline_deliverable = await rows(
      client,
      "select title, status from program_modules where title ilike '%baseline metrics%' and title ilike '%contact center%'",
    );

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('x Apex-realness audit failed.');
  console.error(e);
  process.exit(1);
});
