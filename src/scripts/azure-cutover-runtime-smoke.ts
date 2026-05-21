#!/usr/bin/env -S npx tsx
// Azure cutover runtime persistence smoke.
//
// Runs inside the Container Apps environment where private Azure Postgres
// resolves. The probe is intentionally transactional by default: it validates
// schema presence, inserts and reads representative runtime rows, checks a
// recent ingestion smoke run when provided, and rolls back synthetic data.

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type SmokeStatus = 'pass' | 'fail';

type Check = {
  readonly name: string;
  readonly status: SmokeStatus;
  readonly detail: string;
  readonly evidence?: unknown;
};

type Options = {
  readonly databaseUrl: string;
  readonly tenantKey: string;
  readonly ingestionSmokeRunId: string | null;
  readonly commitFixture: boolean;
};

function readOption(argv: string[], name: string): string | null {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

function parseOptions(): Options {
  const argv = process.argv.slice(2);
  const databaseUrl =
    readOption(argv, '--database-url') ??
    process.env.AZURE_LAB_DATABASE_URL ??
    process.env.DATABASE_URL ??
    '';

  if (!databaseUrl.trim()) {
    throw new Error('Missing DATABASE_URL, AZURE_LAB_DATABASE_URL, or --database-url.');
  }

  return {
    databaseUrl,
    tenantKey: readOption(argv, '--tenant-key') ?? process.env.AZURE_CUTOVER_TENANT_KEY ?? 'apex-retail',
    ingestionSmokeRunId:
      readOption(argv, '--ingestion-smoke-run-id') ??
      process.env.INGESTION_SMOKE_RUN_ID ??
      null,
    commitFixture: hasFlag(argv, '--commit-fixture'),
  };
}

async function relationExists(client: Client, relationName: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      select exists (
        select 1
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = $1
           and c.relkind = 'r'
      ) as exists
    `,
    [relationName],
  );
  return result.rows[0]?.exists === true;
}

async function assertCount(client: Client, table: string, id: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `select count(*)::text as count from ${table} where id = $1`,
    [id],
  );
  return Number(result.rows[0]?.count ?? '0');
}

async function run(options: Options): Promise<Check[]> {
  const client = new Client(postgresClientOptions(options.databaseUrl, 'azure-cutover-runtime-smoke'));
  await client.connect();

  const checks: Check[] = [];
  const runId = `cutover-runtime-${Date.now()}`;

  try {
    for (const table of [
      'expert_reviews',
      'sourcing_work_items',
      'platform_notification_events',
      'platform_notification_deliveries',
      'sensitive_upload_audit',
    ]) {
      const exists = await relationExists(client, table);
      checks.push({
        name: `schema.${table}.exists`,
        status: exists ? 'pass' : 'fail',
        detail: exists ? `${table} exists.` : `${table} is missing.`,
      });
      if (!exists) {
        throw new Error(`Missing required table: ${table}`);
      }
    }

    await client.query('begin');

    const expertReviewId = randomUUID();
    await client.query(
      `
        insert into expert_reviews (
          id,
          tenant_client_key,
          move_ref,
          move_name,
          reviewer_id,
          reviewer_role,
          verdict,
          note,
          assumption_keys,
          required_actions,
          created_by
        )
        values ($1, $2, $3, 'Azure cutover smoke Move', 'cutover-smoke', 'cfo',
          'credible_with_conditions', 'Synthetic cutover smoke review.', array['cost-per-contact'], array['capture missing baseline'], 'azure-cutover-runtime-smoke')
      `,
      [expertReviewId, options.tenantKey, `${runId}:move`],
    );
    checks.push({
      name: 'runtime.expert_reviews.insert_read',
      status: (await assertCount(client, 'expert_reviews', expertReviewId)) === 1 ? 'pass' : 'fail',
      detail: 'expert_reviews accepts and returns an append-only review row.',
      evidence: { id: expertReviewId },
    });

    const workItemId = randomUUID();
    await client.query(
      `
        insert into sourcing_work_items (
          id,
          tenant_client_key,
          subject_kind,
          subject_ref,
          subject_label,
          kind,
          title,
          owner,
          due_date,
          status,
          legal_status,
          procurement_status,
          note,
          metadata,
          created_by,
          updated_by
        )
        values ($1, $2, 'contract', $3, 'Azure cutover smoke contract', 'owner_assignment',
          'Assign cutover smoke owner', 'platform-ops@abarva.ai', current_date + 7,
          'open', 'not_applicable', 'not_applicable', 'Synthetic cutover smoke work item.',
          $4::jsonb, 'azure-cutover-runtime-smoke', 'azure-cutover-runtime-smoke')
      `,
      [workItemId, options.tenantKey, `${runId}:contract`, JSON.stringify({ runId })],
    );
    checks.push({
      name: 'runtime.sourcing_work_items.insert_read',
      status: (await assertCount(client, 'sourcing_work_items', workItemId)) === 1 ? 'pass' : 'fail',
      detail: 'sourcing_work_items accepts and returns a Source action-layer row.',
      evidence: { id: workItemId },
    });

    const notificationId = randomUUID();
    await client.query(
      `
        insert into platform_notification_events (
          id,
          tenant_key,
          module,
          severity,
          source_event_type,
          subject_type,
          subject_id,
          subject_label,
          title,
          body_text,
          href,
          audience_jsonb,
          channels_jsonb,
          evidence_refs_jsonb,
          dedupe_key,
          metadata_jsonb
        )
        values ($1, $2, 'platform', 'attention', 'cutover_smoke', 'cutover', $3,
          'Azure cutover smoke', 'Azure cutover smoke notification',
          'Synthetic notification event for cutover QA.', '/platform/admin/build-progress',
          '["platform-ops"]'::jsonb, '["email_now"]'::jsonb, '[]'::jsonb, $4, $5::jsonb)
      `,
      [
        notificationId,
        options.tenantKey,
        `${runId}:subject`,
        `${runId}:notification`,
        JSON.stringify({ runId }),
      ],
    );
    checks.push({
      name: 'runtime.platform_notification_events.insert_read',
      status: (await assertCount(client, 'platform_notification_events', notificationId)) === 1 ? 'pass' : 'fail',
      detail: 'platform_notification_events accepts and returns an operating signal.',
      evidence: { id: notificationId },
    });

    const deliveryId = randomUUID();
    await client.query(
      `
        insert into platform_notification_deliveries (
          id,
          tenant_key,
          notification_event_id,
          channel,
          recipient_ref,
          recipient_email,
          status,
          provider_message_id,
          metadata_jsonb
        )
        values ($1, $2, $3, 'email_now', 'platform-ops', 'platform-ops@abarva.ai',
          'skipped', null, $4::jsonb)
      `,
      [deliveryId, options.tenantKey, notificationId, JSON.stringify({ runId, reason: 'cutover-smoke' })],
    );
    checks.push({
      name: 'runtime.platform_notification_deliveries.insert_read',
      status: (await assertCount(client, 'platform_notification_deliveries', deliveryId)) === 1 ? 'pass' : 'fail',
      detail: 'platform_notification_deliveries accepts and returns a delivery audit row.',
      evidence: { id: deliveryId, notificationEventId: notificationId },
    });

    if (options.ingestionSmokeRunId) {
      const ingestion = await client.query<{
        smoke_case: string | null;
        final_decision: string;
        count: string;
      }>(
        `
          select
            metadata #>> '{metadata,smokeCase}' as smoke_case,
            final_decision,
            count(*)::text as count
          from sensitive_upload_audit
          where metadata #>> '{metadata,smokeRunId}' = $1
            and ingestion_tier = 'tier2_blob'
            and parent_id is null
          group by 1, 2
          order by 1, 2
        `,
        [options.ingestionSmokeRunId],
      );
      const observed = Object.fromEntries(
        ingestion.rows.map((row) => [row.smoke_case ?? 'unknown', row.final_decision]),
      );
      const counts = Object.fromEntries(
        ingestion.rows.map((row) => [row.smoke_case ?? 'unknown', Number(row.count)]),
      );
      const pass = observed.safe === 'allow' &&
        observed.sensitive === 'quarantine' &&
        counts.safe === 1 &&
        counts.sensitive === 1;
      checks.push({
        name: 'runtime.ingestion_smoke.audit_rows',
        status: pass ? 'pass' : 'fail',
        detail: pass
          ? 'The provided ingestion smoke run has exactly one expected allow/quarantine audit row per case.'
          : 'The provided ingestion smoke run does not have exactly one expected audit row per case.',
        evidence: { ingestionSmokeRunId: options.ingestionSmokeRunId, observed, counts },
      });
    }

    if (checks.some((check) => check.status === 'fail')) {
      throw new Error('One or more cutover runtime checks failed.');
    }

    if (options.commitFixture) {
      await client.query('commit');
    } else {
      await client.query('rollback');
    }

    return checks;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const options = parseOptions();
  const checks = await run(options);
  const summary = checks.reduce(
    (counts, check) => {
      counts[check.status] += 1;
      return counts;
    },
    { pass: 0, fail: 0 },
  );

  console.log(JSON.stringify({
    status: summary.fail > 0 ? 'fail' : 'pass',
    event: 'azure_cutover_runtime_smoke',
    tenantKey: options.tenantKey,
    ingestionSmokeRunId: options.ingestionSmokeRunId,
    committed: options.commitFixture,
    summary,
    checks,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    event: 'azure_cutover_runtime_smoke',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
