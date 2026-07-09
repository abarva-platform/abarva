#!/usr/bin/env node
/**
 * One-off read-only audit for Source event
 * adcb1cd0-c586-4622-bd29-574cc5a10862 (Lakeshore Holdings AMS Sourcing
 * Event, LAKE-AMS-2026-46EADB28). Reports which artifact codes on
 * source_event_artifact_states have a persisted body, and prints an excerpt
 * of each so real generated text can be quality-audited.
 *
 * Read-only. Does not mutate source_events, source_event_artifact_states,
 * or any approval/gate state.
 *
 * Usage: node scripts/qa/lakeshore-ams-artifact-audit.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const localEnv = path.join(REPO_ROOT, '.env.local');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : '/Users/anand/Projects/nexus/.env.local' });

const databaseUrl = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL');
  process.exit(2);
}

const EVENT_ID = 'adcb1cd0-c586-4622-bd29-574cc5a10862';

function disableSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

const db = new pg.Client({
  connectionString: databaseUrl,
  application_name: 'lakeshore-ams-artifact-audit',
  ssl: disableSsl(databaseUrl) ? false : { rejectUnauthorized: false },
});

async function main() {
  await db.connect();

  console.log('=== source_events row ===');
  const eventRes = await db.query(
    `select id, event_name, event_code, client_key, lifecycle_state, current_stage_key, created_at, updated_at
     from source_events where id = $1`,
    [EVENT_ID],
  );
  console.log(JSON.stringify(eventRes.rows, null, 2));

  console.log('\n=== source_event_artifact_states: all rows for this event (summary) ===');
  const summaryRes = await db.query(
    `select artifact_code, stage_key, status, tier,
            (body is not null and length(trim(body)) > 0) as has_body,
            coalesce(length(body), 0) as body_length,
            body_format, body_authored_by, body_updated_at, updated_at
     from source_event_artifact_states
     where source_event_id = $1
     order by stage_key, artifact_code`,
    [EVENT_ID],
  );
  console.log(`Row count: ${summaryRes.rowCount}`);
  console.table(
    summaryRes.rows.map((r) => ({
      artifact_code: r.artifact_code,
      stage_key: r.stage_key,
      status: r.status,
      tier: r.tier,
      has_body: r.has_body,
      body_length: r.body_length,
      body_format: r.body_format,
      body_authored_by: r.body_authored_by,
      body_updated_at: r.body_updated_at,
    })),
  );

  console.log('\n=== Excerpts (first 2000 chars) for rows with a body ===');
  const withBody = summaryRes.rows.filter((r) => r.has_body);
  for (const row of withBody) {
    const bodyRes = await db.query(
      `select body from source_event_artifact_states
       where source_event_id = $1 and artifact_code = $2`,
      [EVENT_ID, row.artifact_code],
    );
    const body = bodyRes.rows[0]?.body ?? '';
    console.log(`\n----- ${row.artifact_code} (length=${body.length}) -----`);
    console.log(body.slice(0, 2000));
    console.log('----- END EXCERPT -----');
  }

  if (withBody.length === 0) {
    console.log('(no artifact rows for this event have a non-empty body)');
  }

  console.log('\n=== source_event_generation_jobs / source_artifact_generation_jobs (if present) ===');
  try {
    const jobsRes = await db.query(
      `select id, artifact_code, stage_key, status, requested_via, attempt_count, last_error, created_at, updated_at
       from source_artifact_generation_jobs
       where source_event_id = $1
       order by created_at desc`,
      [EVENT_ID],
    );
    console.table(jobsRes.rows);
  } catch (err) {
    console.log(`(job table query failed/absent: ${err.message})`);
  }

  await db.end();
}

main().catch((err) => {
  console.error('AUDIT FAILED:', err);
  process.exitCode = 1;
});
