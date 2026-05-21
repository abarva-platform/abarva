#!/usr/bin/env -S npx tsx
// Seed First Capital source_events for Azure cutover parity.
//
// The First Capital tenant had rich contract and context substrate but only two
// persisted Source events in Azure. This additive, idempotent seed brings the
// tenant to the same demo/cutover threshold as Apex and Meridian, and scaffolds
// the canonical Source canvas rows for each event.

import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { buildEventScaffold } from '@/lib/source/canvas-substrate';
import { postgresClientOptions } from '../postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TENANT_KEY = 'arcturus';

type SourceEventSeed = {
  readonly id: string;
  readonly eventCode: string;
  readonly eventName: string;
  readonly eventType: string;
  readonly currentStageKey: string;
  readonly lifecycleState: string;
  readonly linkedProgramId: string | null;
  readonly estimatedValueUsd: number;
  readonly triggerDescription: string;
  readonly scopeDescription: string;
  readonly decisionOwner: string;
};

const EVENTS: ReadonlyArray<SourceEventSeed> = [
  {
    id: 'd4c26954-00d2-44ef-bb45-bc97df6c7a10',
    eventCode: 'FC-FEDNOW-GATEWAY-2026',
    eventName: 'FedNow Gateway Cutover Vendor Readiness',
    eventType: 'software',
    currentStageKey: 'evaluation',
    lifecycleState: 'waiting_on_client',
    linkedProgramId: 'FC-FEDNOW-2026',
    estimatedValueUsd: 14_400_000,
    triggerDescription:
      'FedNow cutover is scheduled for 2026 and needs vendor-readiness, support, audit-rights, and transition-risk confirmation before production commitment.',
    scopeDescription:
      'Assess Volante gateway readiness, cutover support, resilience obligations, audit evidence, and production support economics for the real-time payments launch.',
    decisionOwner: 'Kira Tanaka-Riveras',
  },
  {
    id: 'e5591f70-38e5-45bd-b16a-4d28b63cf1db',
    eventCode: 'FC-REG-REPORTING-2026',
    eventName: 'Regulatory Reporting Platform Modernization',
    eventType: 'software',
    currentStageKey: 'strategy',
    lifecycleState: 'active',
    linkedProgramId: 'FC-REGREPORT-2026',
    estimatedValueUsd: 27_600_000,
    triggerDescription:
      'Adenza/Nasdaq price pressure and Call Report modernization create a sourcing decision across upgrade, renegotiation, or alternative reporting platform paths.',
    scopeDescription:
      'Compare incumbent upgrade economics, reporting-control coverage, model-risk evidence, implementation risk, and regulatory exam readiness.',
    decisionOwner: 'Eleanora Ouellette-Park',
  },
  {
    id: '7ec0e8d5-f0b7-4748-94c2-a64f0e0b2f8b',
    eventCode: 'FC-SNOWFLAKE-FINOPS-2026',
    eventName: 'Snowflake FinOps and Data Platform Rebid',
    eventType: 'infrastructure',
    currentStageKey: 'pricing',
    lifecycleState: 'active',
    linkedProgramId: 'FC-DATA-MRM-2026',
    estimatedValueUsd: 22_800_000,
    triggerDescription:
      'Snowflake compute spend is rising while MRM and AI workloads expand; the CIO needs a defensible rebid/renegotiation path before the next platform commitment.',
    scopeDescription:
      'Normalize data-platform consumption, workload commitments, governance requirements, FinOps controls, and alternative warehouse/lakehouse economics.',
    decisionOwner: 'Bjorn Ngangole',
  },
];

function databaseUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.AZURE_LAB_DATABASE_URL ?? '';
  if (!url.trim()) {
    throw new Error('Missing DATABASE_URL or AZURE_LAB_DATABASE_URL.');
  }
  return url;
}

async function upsertSourceEvent(client: Client, seed: SourceEventSeed): Promise<void> {
  await client.query(
    `
      insert into source_events (
        id,
        client_key,
        event_code,
        event_name,
        event_type,
        current_stage_key,
        current_stage_entered_at,
        lifecycle_state,
        linked_program_id,
        estimated_value_usd,
        trigger_description,
        scope_description,
        decision_owner,
        created_by_user_id,
        created_at,
        updated_at,
        lead_agent
      )
      values (
        $1, $2, $3, $4, $5, $6, now(), $7, $8, $9, $10, $11, $12,
        'azure-cutover-firstcapital-source-seed', now(), now(), 'sentinel'
      )
      on conflict (id) do update set
        client_key = excluded.client_key,
        event_code = excluded.event_code,
        event_name = excluded.event_name,
        event_type = excluded.event_type,
        current_stage_key = excluded.current_stage_key,
        lifecycle_state = excluded.lifecycle_state,
        linked_program_id = excluded.linked_program_id,
        estimated_value_usd = excluded.estimated_value_usd,
        trigger_description = excluded.trigger_description,
        scope_description = excluded.scope_description,
        decision_owner = excluded.decision_owner,
        lead_agent = excluded.lead_agent,
        updated_at = now()
    `,
    [
      seed.id,
      TENANT_KEY,
      seed.eventCode,
      seed.eventName,
      seed.eventType,
      seed.currentStageKey,
      seed.lifecycleState,
      seed.linkedProgramId,
      seed.estimatedValueUsd,
      seed.triggerDescription,
      seed.scopeDescription,
      seed.decisionOwner,
    ],
  );
}

async function scaffold(client: Client, seed: SourceEventSeed): Promise<void> {
  const { artifactStates, gateCriterionStates, evidenceStates } = buildEventScaffold({
    sourceEventId: seed.id,
    tenantKey: TENANT_KEY,
  });

  for (const row of artifactStates) {
    await client.query(
      `
        insert into source_event_artifact_states (
          source_event_id,
          tenant_key,
          artifact_code,
          stage_key,
          artifact_family,
          tier,
          status,
          requirement_level,
          gate_defining
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        on conflict (source_event_id, artifact_code) do nothing
      `,
      [
        row.source_event_id,
        row.tenant_key,
        row.artifact_code,
        row.stage_key,
        row.artifact_family,
        row.tier,
        row.status,
        row.requirement_level,
        row.gate_defining,
      ],
    );
  }

  for (const row of gateCriterionStates) {
    await client.query(
      `
        insert into source_event_gate_criterion_states (
          source_event_id,
          tenant_key,
          criterion_id,
          from_stage,
          to_stage,
          state
        )
        values ($1,$2,$3,$4,$5,$6)
        on conflict (source_event_id, criterion_id) do nothing
      `,
      [
        row.source_event_id,
        row.tenant_key,
        row.criterion_id,
        row.from_stage,
        row.to_stage,
        row.state,
      ],
    );
  }

  for (const row of evidenceStates) {
    await client.query(
      `
        insert into source_event_evidence_states (
          source_event_id,
          tenant_key,
          requirement_id,
          stage_key,
          current_state
        )
        values ($1,$2,$3,$4,$5)
        on conflict (source_event_id, requirement_id) do nothing
      `,
      [
        row.source_event_id,
        row.tenant_key,
        row.requirement_id,
        row.stage_key,
        row.current_state,
      ],
    );
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log(JSON.stringify({
      status: 'dry-run',
      tenantKey: TENANT_KEY,
      sourceEvents: EVENTS.map((event) => ({
        id: event.id,
        eventCode: event.eventCode,
        eventName: event.eventName,
      })),
    }, null, 2));
    return;
  }

  const client = new Client(postgresClientOptions(databaseUrl(), 'seed-first-capital-source-events'));
  await client.connect();

  try {
    await client.query('begin');
    for (const event of EVENTS) {
      await upsertSourceEvent(client, event);
      await scaffold(client, event);
    }
    await client.query('commit');

    const count = await client.query<{ count: string }>(
      `select count(*)::text from source_events where client_key in ('first-capital','firstcapital','arcturus','brindlemark')`,
    );

    console.log(JSON.stringify({
      status: 'pass',
      event: 'first_capital_source_events_seeded',
      tenantKey: TENANT_KEY,
      upserted: EVENTS.length,
      totalFirstCapitalSourceEvents: Number(count.rows[0]?.count ?? '0'),
    }, null, 2));
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    event: 'first_capital_source_events_seeded',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
