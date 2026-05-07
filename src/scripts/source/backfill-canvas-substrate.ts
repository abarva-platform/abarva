/**
 * Backfill the canvas substrate for source events that pre-date the substrate.
 *
 * Reads every active row from `source_events` and ensures matching rows exist
 * in `source_event_artifact_states`, `source_event_gate_criterion_states`,
 * and `source_event_evidence_states`. Idempotent — re-runs are safe (upsert
 * with ignoreDuplicates).
 *
 * Usage:
 *   npx tsx src/scripts/source/backfill-canvas-substrate.ts
 *   npx tsx src/scripts/source/backfill-canvas-substrate.ts --dry
 *   npx tsx src/scripts/source/backfill-canvas-substrate.ts --client apexretail
 *
 * Requires DATABASE_URL or SUPABASE service-role credentials in .env.local.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { buildEventScaffold, expectedScaffoldRowCount } from '../../lib/source/canvas-substrate';

config({ path: '.env.local' });
config({ path: '.env' });

interface CliOptions {
  dryRun: boolean;
  clientKey?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry') || args.includes('--dry-run');
  const clientIdx = args.findIndex((a) => a === '--client');
  const clientKey = clientIdx >= 0 ? args[clientIdx + 1] : undefined;
  return { dryRun, clientKey };
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

interface SourceEventLite {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  current_stage_key: string;
}

async function listEventsToBackfill(
  supabase: ReturnType<typeof getServiceClient>,
  clientKey?: string,
): Promise<SourceEventLite[]> {
  let query = supabase
    .from('source_events')
    .select('id, client_key, event_code, event_name, current_stage_key')
    .neq('lifecycle_state', 'archived')
    .order('created_at', { ascending: true });
  if (clientKey) query = query.eq('client_key', clientKey);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as SourceEventLite[] | null) ?? [];
}

async function eventNeedsBackfill(
  supabase: ReturnType<typeof getServiceClient>,
  eventId: string,
): Promise<{ artifactCount: number; criterionCount: number; evidenceCount: number }> {
  const [{ count: artifactCount = 0 }, { count: criterionCount = 0 }, { count: evidenceCount = 0 }] =
    await Promise.all([
      supabase
        .from('source_event_artifact_states')
        .select('id', { count: 'exact', head: true })
        .eq('source_event_id', eventId),
      supabase
        .from('source_event_gate_criterion_states')
        .select('id', { count: 'exact', head: true })
        .eq('source_event_id', eventId),
      supabase
        .from('source_event_evidence_states')
        .select('id', { count: 'exact', head: true })
        .eq('source_event_id', eventId),
    ]);
  return {
    artifactCount: artifactCount ?? 0,
    criterionCount: criterionCount ?? 0,
    evidenceCount: evidenceCount ?? 0,
  };
}

async function backfillEvent(
  supabase: ReturnType<typeof getServiceClient>,
  event: SourceEventLite,
  dryRun: boolean,
): Promise<{ inserted: number; skipped: boolean }> {
  const expected = expectedScaffoldRowCount();
  const counts = await eventNeedsBackfill(supabase, event.id);
  const fullyScaffolded =
    counts.artifactCount >= expected.artifactStates &&
    counts.criterionCount >= expected.gateCriterionStates &&
    counts.evidenceCount >= expected.evidenceStates;

  if (fullyScaffolded) {
    return { inserted: 0, skipped: true };
  }

  if (dryRun) {
    return { inserted: expected.total - (counts.artifactCount + counts.criterionCount + counts.evidenceCount), skipped: false };
  }

  const { artifactStates, gateCriterionStates, evidenceStates } = buildEventScaffold({
    sourceEventId: event.id,
    tenantKey: event.client_key,
  });

  const results = await Promise.all([
    supabase
      .from('source_event_artifact_states')
      .upsert(artifactStates, {
        onConflict: 'source_event_id,artifact_code',
        ignoreDuplicates: true,
      }),
    supabase
      .from('source_event_gate_criterion_states')
      .upsert(gateCriterionStates, {
        onConflict: 'source_event_id,criterion_id',
        ignoreDuplicates: true,
      }),
    supabase
      .from('source_event_evidence_states')
      .upsert(evidenceStates, {
        onConflict: 'source_event_id,requirement_id',
        ignoreDuplicates: true,
      }),
  ]);

  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }

  return { inserted: expected.total - (counts.artifactCount + counts.criterionCount + counts.evidenceCount), skipped: false };
}

async function main() {
  const opts = parseArgs();
  const supabase = getServiceClient();

   
  console.log(
    `Backfill canvas substrate · ${opts.dryRun ? 'DRY RUN' : 'LIVE'}` +
      (opts.clientKey ? ` · client=${opts.clientKey}` : ''),
  );

  const events = await listEventsToBackfill(supabase, opts.clientKey);
   
  console.log(`Found ${events.length} active events to inspect.`);

  let totalInserted = 0;
  let totalSkipped = 0;
  for (const event of events) {
    try {
      const { inserted, skipped } = await backfillEvent(supabase, event, opts.dryRun);
      if (skipped) {
        totalSkipped += 1;
         
        console.log(`  · ${event.event_code} (${event.event_name}) — already scaffolded`);
      } else {
        totalInserted += inserted;
         
        console.log(
          `  ${opts.dryRun ? '~' : '✓'} ${event.event_code} (${event.event_name}) — ${inserted} rows ${opts.dryRun ? 'would insert' : 'inserted'}`,
        );
      }
    } catch (err) {
       
      console.error(`  ✗ ${event.event_code}: ${err instanceof Error ? err.message : err}`);
    }
  }

   
  console.log(
    `\nDone. ${totalSkipped} already scaffolded · ${totalInserted} ${opts.dryRun ? 'would be inserted' : 'inserted'}.`,
  );
}

main().catch((err) => {
   
  console.error('Backfill failed:', err);
  process.exit(1);
});
