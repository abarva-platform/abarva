import dotenv from 'dotenv';
import { Client } from 'pg';

import { buildEventScaffold } from '../../lib/source/canvas-substrate/scaffold';

dotenv.config({ path: '.env.local' });

type SourceStage =
  | 'strategy'
  | 'scope'
  | 'rfp'
  | 'responses'
  | 'evaluation'
  | 'pricing'
  | 'bafo'
  | 'executive_decision'
  | 'selection'
  | 'transition'
  | 'value';

type SourceLifecycle =
  | 'active'
  | 'waiting_on_client'
  | 'waiting_on_vendor'
  | 'waiting_on_procurement'
  | 'waiting_on_executive_decision'
  | 'paused'
  | 'at_risk'
  | 'completed';

interface CanonicalSourceEvent {
  clientKey: 'apexretail' | 'meridian' | 'arcturus';
  eventCode: string;
  eventName: string;
  eventType: 'managed_service' | 'software' | 'infrastructure' | 'consulting' | 'other';
  currentStageKey: SourceStage;
  lifecycleState: SourceLifecycle;
  linkedProgramId: string | null;
  estimatedValueUsd: number;
  valueAtStakeLowUsd: number;
  valueAtStakeHighUsd: number;
  triggerDescription: string;
  scopeDescription: string;
  decisionOwner: string;
  projectedValueLedger: Array<{
    label: string;
    amountUsd: number;
    confidence: 'low' | 'medium' | 'high';
    note: string;
  }>;
  evidenceCitations: string[];
  missingInputs: string[];
}

const CANONICAL_EVENTS: CanonicalSourceEvent[] = [
  {
    clientKey: 'apexretail',
    eventCode: 'APX-SRC-AMS-2026',
    eventName: 'AMS Outsourcing 2026',
    eventType: 'managed_service',
    currentStageKey: 'bafo',
    lifecycleState: 'active',
    linkedProgramId: 'APX-CDP-2026',
    estimatedValueUsd: 35_000_000,
    valueAtStakeLowUsd: 30_000_000,
    valueAtStakeHighUsd: 42_000_000,
    triggerDescription:
      'Apex Retail is re-running AMS sourcing after the 2023-24 pause and needs a BAFO-backed operating model before the CDP Q3 integration window compresses.',
    scopeDescription:
      'Application managed services, L2/L3 support, transition planning, SLA controls, and CDP/SAP integration support across the Apex Retail application estate.',
    decisionOwner: 'CIO Office',
    projectedValueLedger: [
      {
        label: 'Managed services run-rate optimization',
        amountUsd: 18_000_000,
        confidence: 'medium',
        note: 'Projected from AMS operating model consolidation and support-tier rationalization.',
      },
      {
        label: 'Transition and SLA leakage avoided',
        amountUsd: 9_500_000,
        confidence: 'medium',
        note: 'Projected from BAFO controls around KT, staffing, and SLA scope creep.',
      },
      {
        label: 'CDP delivery risk protected',
        amountUsd: 7_500_000,
        confidence: 'low',
        note: 'Projected value tied to keeping APX-CDP-2026 integration work on schedule.',
      },
    ],
    evidenceCitations: [
      'src/scripts/setup-data/apex-data/07_sourcing_artifacts/ams_bafo_tracker.md',
      'src/scripts/setup-data/apex-data/11_vendor_contracts/vendor_scorecards.csv',
      'src/scripts/setup-data/apex-data/11_vendor_contracts/contract_clause_inventory.json',
      'src/scripts/setup-data/apex-data/10_operating_telemetry/risk_action_decision_log.json',
      'src/lib/source/source-commercial-demo-scenario.ts',
    ],
    missingInputs: [
      'BAFO responses from Northstar Managed Services and ArcVault Managed',
      'Selection committee final scoring notes',
    ],
  },
  {
    clientKey: 'apexretail',
    eventCode: 'APX-SRC-CDP-2026',
    eventName: 'CDP Vendor Selection',
    eventType: 'software',
    currentStageKey: 'evaluation',
    lifecycleState: 'active',
    linkedProgramId: 'APX-CDP-2026',
    estimatedValueUsd: 2_400_000,
    valueAtStakeLowUsd: 1_900_000,
    valueAtStakeHighUsd: 3_200_000,
    triggerDescription:
      'Apex Retail needs to select the CDP platform path supporting identity resolution, loyalty activation, and consent-governed personalization.',
    scopeDescription:
      'CDP platform vendor evaluation across identity resolution, activation connectors, loyalty integration, consent posture, data portability, and implementation support.',
    decisionOwner: 'CDO + CMO Steering Group',
    projectedValueLedger: [
      {
        label: 'Activation lift protected',
        amountUsd: 1_050_000,
        confidence: 'medium',
        note: 'Projected incremental value from faster audience activation and reduced campaign leakage.',
      },
      {
        label: 'Integration rework avoided',
        amountUsd: 800_000,
        confidence: 'medium',
        note: 'Projected avoidance from selecting a vendor aligned to current CRM and consent constraints.',
      },
      {
        label: 'Vendor exit and portability risk reduced',
        amountUsd: 550_000,
        confidence: 'low',
        note: 'Projected protection from contract terms around data portability and exit assistance.',
      },
    ],
    evidenceCitations: [
      'src/scripts/setup-data/apex-data/03_it_landscape/systems_inventory.csv',
      'src/scripts/setup-data/apex-data/03_it_landscape/integration_map.json',
      'src/scripts/setup-data/apex-data/07_sourcing_artifacts/cdp_rfp_issued.md',
      'src/scripts/setup-data/apex-data/07_sourcing_artifacts/cdp_vendor_evaluation.csv',
      'src/scripts/setup-data/apex-data/09_evidence_ledger/evidence_ledger.json',
    ],
    missingInputs: [
      'Final identity-resolution benchmark from finalist vendors',
      'Legal confirmation of exit-assistance clause language',
    ],
  },
  {
    clientKey: 'apexretail',
    eventCode: 'APX-SRC-CCAI-2026',
    eventName: 'Contact Center AI Platform Selection',
    eventType: 'software',
    currentStageKey: 'rfp',
    lifecycleState: 'waiting_on_vendor',
    linkedProgramId: 'APX-CC-2026',
    estimatedValueUsd: 1_800_000,
    valueAtStakeLowUsd: 1_300_000,
    valueAtStakeHighUsd: 2_500_000,
    triggerDescription:
      'Apex Retail is moving Contact Center AI from discovery into vendor selection for intent routing, agent assist, and escalation quality.',
    scopeDescription:
      'Vendor platform selection for contact center intent routing, agent assist, QA analytics, knowledge integrations, and Genesys/CRM interoperability.',
    decisionOwner: 'VP Customer Experience + CIO Office',
    projectedValueLedger: [
      {
        label: 'Average handle time reduction',
        amountUsd: 750_000,
        confidence: 'medium',
        note: 'Projected from call-volume baseline and expected agent assist adoption.',
      },
      {
        label: 'Containment and routing improvement',
        amountUsd: 650_000,
        confidence: 'medium',
        note: 'Projected from higher first-contact containment and fewer misroutes.',
      },
      {
        label: 'Quality monitoring productivity',
        amountUsd: 400_000,
        confidence: 'low',
        note: 'Projected from QA sampling automation and coaching workflow efficiency.',
      },
    ],
    evidenceCitations: [
      'src/lib/programs/programs-fixture.ts',
      'scripts/seed-apex-demo-move.ts',
      'src/scripts/setup-data/apex-data/06_program_inventory/active_programs.json',
      'src/scripts/setup-data/apex-data/10_operating_telemetry/recent_meeting_notes.md',
      'src/lib/intelligence/program-lifecycle-patterns.ts',
    ],
    missingInputs: [
      'Final vendor responses to integration-security questionnaire',
      'Updated intent taxonomy coverage baseline',
    ],
  },
  {
    clientKey: 'apexretail',
    eventCode: 'APX-SRC-SAPROD-2026',
    eventName: 'Store Associate Productivity Tools Selection',
    eventType: 'software',
    currentStageKey: 'scope',
    lifecycleState: 'waiting_on_client',
    linkedProgramId: 'APX-SAP-2026',
    estimatedValueUsd: 800_000,
    valueAtStakeLowUsd: 550_000,
    valueAtStakeHighUsd: 1_200_000,
    triggerDescription:
      'Apex Retail needs to select frontline productivity tooling for store associates while the program evidence baseline is still being hardened.',
    scopeDescription:
      'Tool selection for associate task assistance, store execution workflows, knowledge access, measurement telemetry, and pilot-store rollout controls.',
    decisionOwner: 'Store Operations + CTO Office',
    projectedValueLedger: [
      {
        label: 'Frontline productivity lift',
        amountUsd: 360_000,
        confidence: 'medium',
        note: 'Projected from associate workflow time savings in pilot stores.',
      },
      {
        label: 'Training and ramp compression',
        amountUsd: 240_000,
        confidence: 'low',
        note: 'Projected from guided task support and faster procedure lookup.',
      },
      {
        label: 'Execution variance reduction',
        amountUsd: 200_000,
        confidence: 'low',
        note: 'Projected from better task adherence and store-level telemetry.',
      },
    ],
    evidenceCitations: [
      'src/lib/programs/programs-fixture.ts',
      'src/lib/intelligence/pattern-action-canvas-view.ts',
      'src/lib/intelligence/gate-readiness-view.ts',
      'src/scripts/setup-data/apex-data/06_program_inventory/active_programs.json',
      'src/scripts/setup-data/apex-data/10_operating_telemetry/risk_action_decision_log.json',
    ],
    missingInputs: [
      'Pilot store confirmation',
      'Store associate KPI baseline by region',
      'Security review for mobile workflow access',
    ],
  },
];

const dryRun = !process.argv.includes('--no-dry-run');

function valueTargetBody(event: CanonicalSourceEvent): string {
  const ledger = event.projectedValueLedger
    .map(
      (line) =>
        `- ${line.label}: $${line.amountUsd.toLocaleString('en-US')} (${line.confidence}) - ${line.note}`,
    )
    .join('\n');
  const citations = event.evidenceCitations.map((citation) => `- ${citation}`).join('\n');
  const missing = event.missingInputs.map((input) => `- ${input}`).join('\n');

  return [
    `# ${event.eventName} Value Target`,
    '',
    `Value at stake: $${event.estimatedValueUsd.toLocaleString('en-US')}`,
    `Range: $${event.valueAtStakeLowUsd.toLocaleString('en-US')} - $${event.valueAtStakeHighUsd.toLocaleString('en-US')}`,
    `Workflow stage: ${event.currentStageKey}`,
    '',
    '## Projected Value Ledger',
    ledger,
    '',
    '## Evidence Citations',
    citations,
    '',
    '## Missing Inputs',
    missing,
  ].join('\n');
}

async function ensureEvent(client: Client, event: CanonicalSourceEvent): Promise<{
  action: 'inserted' | 'updated' | 'would_insert' | 'would_update';
  id: string | null;
  code: string;
}> {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id
      FROM source_events
      WHERE client_key = $1 AND event_code = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [event.clientKey, event.eventCode],
  );

  const existingId = existing.rows[0]?.id ?? null;
  if (dryRun) {
    return {
      action: existingId ? 'would_update' : 'would_insert',
      id: existingId,
      code: event.eventCode,
    };
  }

  const params = [
    event.clientKey,
    event.eventCode,
    event.eventName,
    event.eventType,
    event.currentStageKey,
    event.lifecycleState,
    event.linkedProgramId,
    event.estimatedValueUsd,
    event.triggerDescription,
    event.scopeDescription,
    event.decisionOwner,
    'seed:ensure-client-sourcing-events',
    event.valueAtStakeLowUsd,
    event.valueAtStakeHighUsd,
  ];

  const row = existingId
    ? await client.query<{ id: string }>(
        `
          UPDATE source_events
          SET
            event_name = $3,
            event_type = $4,
            current_stage_key = $5,
            lifecycle_state = $6,
            linked_program_id = $7,
            estimated_value_usd = $8,
            trigger_description = $9,
            scope_description = $10,
            decision_owner = $11,
            created_by_user_id = COALESCE(created_by_user_id, $12),
            lead_agent = 'sentinel',
            current_stage_entered_at = COALESCE(current_stage_entered_at, now()),
            value_at_stake_low_usd = $13,
            value_at_stake_high_usd = $14
          WHERE id = $15
          RETURNING id
        `,
        [...params, existingId],
      )
    : await client.query<{ id: string }>(
        `
          INSERT INTO source_events (
            client_key,
            event_code,
            event_name,
            event_type,
            current_stage_key,
            lifecycle_state,
            linked_program_id,
            estimated_value_usd,
            trigger_description,
            scope_description,
            decision_owner,
            created_by_user_id,
            lead_agent,
            current_stage_entered_at,
            value_at_stake_low_usd,
            value_at_stake_high_usd
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'sentinel', now(), $13, $14)
          RETURNING id
        `,
        params,
      );

  const id = row.rows[0].id;
  await ensureScaffold(client, event, id);
  await writeValueArtifactBody(client, event, id);
  await annotateEvidenceStates(client, event, id);

  return {
    action: existingId ? 'updated' : 'inserted',
    id,
    code: event.eventCode,
  };
}

async function ensureScaffold(client: Client, event: CanonicalSourceEvent, sourceEventId: string): Promise<void> {
  const scaffold = buildEventScaffold({
    sourceEventId,
    tenantKey: event.clientKey,
  });

  for (const row of scaffold.artifactStates) {
    await client.query(
      `
        INSERT INTO source_event_artifact_states (
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (source_event_id, artifact_code) DO NOTHING
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

  for (const row of scaffold.gateCriterionStates) {
    await client.query(
      `
        INSERT INTO source_event_gate_criterion_states (
          source_event_id,
          tenant_key,
          criterion_id,
          from_stage,
          to_stage,
          state
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (source_event_id, criterion_id) DO NOTHING
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

  for (const row of scaffold.evidenceStates) {
    await client.query(
      `
        INSERT INTO source_event_evidence_states (
          source_event_id,
          tenant_key,
          requirement_id,
          stage_key,
          current_state
        )
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (source_event_id, requirement_id) DO NOTHING
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

async function writeValueArtifactBody(client: Client, event: CanonicalSourceEvent, sourceEventId: string): Promise<void> {
  await client.query(
    `
      UPDATE source_event_artifact_states
      SET
        status = 'drafting',
        tier = 'outline',
        notes = $3,
        body = $4,
        body_format = 'markdown',
        body_authored_by = 'seed:ensure-client-sourcing-events',
        body_updated_at = now(),
        body_generation_metadata = $5::jsonb
      WHERE source_event_id = $1
        AND artifact_code = 'd02_value_target'
        AND tenant_key = $2
    `,
    [
      sourceEventId,
      event.clientKey,
      `Projected value ledger and citation packet seeded for ${event.eventCode}.`,
      valueTargetBody(event),
      JSON.stringify({
        source: 'ensure-client-sourcing-events',
        eventCode: event.eventCode,
        projectedValueLedger: event.projectedValueLedger,
        evidenceCitations: event.evidenceCitations,
        missingInputs: event.missingInputs,
      }),
    ],
  );
}

async function annotateEvidenceStates(client: Client, event: CanonicalSourceEvent, sourceEventId: string): Promise<void> {
  const notes = [
    `Seeded citations for ${event.eventCode}:`,
    ...event.evidenceCitations.map((citation) => `- ${citation}`),
    '',
    'Missing inputs:',
    ...event.missingInputs.map((input) => `- ${input}`),
  ].join('\n');

  await client.query(
    `
      UPDATE source_event_evidence_states
      SET
        current_state = 'Available',
        notes = $3,
        last_synced_at = now()
      WHERE source_event_id = $1
        AND tenant_key = $2
        AND requirement_id IN (
          'EVID-SRC-STR-INCUMBENT',
          'EVID-SRC-STR-SPONSOR-COMMIT',
          'EVID-SRC-SCOPE-APP-INV',
          'EVID-SRC-SCOPE-ORG',
          'EVID-SRC-SCOPE-TICKET-HISTORY'
        )
    `,
    [sourceEventId, event.clientKey, notes],
  );
}

async function summarize(client: Client): Promise<void> {
  const result = await client.query(
    `
      SELECT
        se.client_key,
        se.event_code,
        se.event_name,
        se.current_stage_key,
        se.lifecycle_state,
        se.estimated_value_usd,
        COUNT(DISTINCT eas.id) AS artifact_states,
        COUNT(DISTINCT gcs.id) AS gate_states,
        COUNT(DISTINCT evs.id) AS evidence_states
      FROM source_events se
      LEFT JOIN source_event_artifact_states eas ON eas.source_event_id = se.id
      LEFT JOIN source_event_gate_criterion_states gcs ON gcs.source_event_id = se.id
      LEFT JOIN source_event_evidence_states evs ON evs.source_event_id = se.id
      WHERE se.client_key IN ('apexretail', 'meridian', 'arcturus')
      GROUP BY se.id
      ORDER BY se.client_key, se.event_code, se.event_name
    `,
  );

  console.table(result.rows);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    const actions = [];
    for (const event of CANONICAL_EVENTS) {
      actions.push(await ensureEvent(client, event));
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('Dry run only. Re-run with --no-dry-run to persist changes.');
    } else {
      await client.query('COMMIT');
    }

    console.table(actions);
    await summarize(client);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
