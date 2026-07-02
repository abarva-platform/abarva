import { Client } from "pg";

import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  toContractOptimizationPersistenceRows,
} from "../../src/lib/source/contract-optimization";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DEFAULT_TENANT_KEY = "skyharbor";
const DEFAULT_SOURCE_EVENT_CODE = "SKYH-AMS-CONTRACT-OPT-2026";
const DEFAULT_SOURCE_EVENT_NAME =
  "SkyHarbor AMS Contract Optimization and Renewal Decision";

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function shouldApply(): boolean {
  return (
    process.argv.includes("--apply") ||
    process.env.SOURCE_CONTRACT_OPTIMIZATION_APPLY === "true"
  );
}

async function main() {
  const tenantKey = process.env.TENANT_KEY || DEFAULT_TENANT_KEY;
  const sourceEventCode =
    process.env.SOURCE_EVENT_CODE || DEFAULT_SOURCE_EVENT_CODE;
  const apply = shouldApply();

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-optimization-load"),
  );
  await client.connect();

  try {
    await client.query("begin");
    await assertRequiredTables(client);

    const sourceEvent = await ensureSourceEvent({
      client,
      apply,
      tenantKey,
      sourceEventCode,
    });
    if (apply) {
      await ensureSourceParticipants({
        client,
        tenantKey,
        sourceEventId: sourceEvent.id,
      });
    }

    const input = buildSkyHarborAmsExistingContractInput({
      tenantKey,
      sourceEventId: process.env.SOURCE_EVENT_ID || sourceEvent.id,
    });
    const profile = buildContractOptimizationMveProfile(input);
    const rows = toContractOptimizationPersistenceRows(profile);

    if (apply) {
      await client.query(
        `
          delete from public.source_contract_optimization_profiles
          where tenant_key = $1 and source_event_id = any($2::text[])
        `,
        [
          rows.profile.tenant_key,
          [
            rows.profile.source_event_id,
            sourceEventCode,
            "skyh-ams-contract-optimization-2026",
          ],
        ],
      );

      const insertedProfile = await client.query<{ id: string }>(
        `
          insert into public.source_contract_optimization_profiles (
            tenant_key,
            source_event_id,
            incumbent_vendor_name,
            contract_name,
            source_type,
            synthetic_demo,
            decision_use,
            current_annual_run_rate_usd,
            term_start,
            term_end,
            renewal_notice_date,
            ready_for_optimization,
            ready_reason,
            extraction_boundary,
            profile_payload,
            evidence_refs
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10::date, $11::date,
            $12, $13, $14, $15::jsonb, $16::jsonb
          )
          returning id
        `,
        [
          rows.profile.tenant_key,
          rows.profile.source_event_id,
          rows.profile.incumbent_vendor_name,
          rows.profile.contract_name,
          rows.profile.source_type,
          rows.profile.synthetic_demo,
          rows.profile.decision_use,
          rows.profile.current_annual_run_rate_usd,
          rows.profile.term_start,
          rows.profile.term_end,
          rows.profile.renewal_notice_date,
          rows.profile.ready_for_optimization,
          rows.profile.ready_reason,
          rows.profile.extraction_boundary,
          JSON.stringify(rows.profile.profile_payload),
          JSON.stringify(rows.profile.evidence_refs),
        ],
      );
      const profileId = insertedProfile.rows[0]?.id;
      if (!profileId) throw new Error("Profile insert did not return an id.");

      for (const finding of rows.findings) {
        await client.query(
          `
            insert into public.source_contract_optimization_findings (
              profile_id,
              tenant_key,
              source_event_id,
              finding_key,
              category,
              severity,
              title,
              current_state,
              sourcing_implication,
              recommended_action,
              estimated_annual_impact_usd,
              confidence,
              evidence_refs
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
            )
          `,
          [
            profileId,
            finding.tenant_key,
            finding.source_event_id,
            finding.finding_key,
            finding.category,
            finding.severity,
            finding.title,
            finding.current_state,
            finding.sourcing_implication,
            finding.recommended_action,
            finding.estimated_annual_impact_usd,
            finding.confidence,
            JSON.stringify(finding.evidence_refs),
          ],
        );
      }

      for (const lever of rows.levers) {
        await client.query(
          `
            insert into public.source_contract_optimization_levers (
              profile_id,
              tenant_key,
              source_event_id,
              lever_key,
              lever_type,
              finding_key,
              priority,
              buyer_ask,
              negotiation_language,
              value_basis,
              annual_impact_low_usd,
              annual_impact_high_usd,
              owner_role
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
          `,
          [
            profileId,
            lever.tenant_key,
            lever.source_event_id,
            lever.lever_key,
            lever.lever_type,
            lever.finding_key,
            lever.priority,
            lever.buyer_ask,
            lever.negotiation_language,
            lever.value_basis,
            lever.annual_impact_low_usd,
            lever.annual_impact_high_usd,
            lever.owner_role,
          ],
        );
      }
    }

    const counts = await client.query<{
      profiles: string;
      findings: string;
      levers: string;
    }>(
      `
        select
          (select count(*)::text from public.source_contract_optimization_profiles where tenant_key = $1 and source_event_id = $2) as profiles,
          (select count(*)::text from public.source_contract_optimization_findings where tenant_key = $1 and source_event_id = $2) as findings,
          (select count(*)::text from public.source_contract_optimization_levers where tenant_key = $1 and source_event_id = $2) as levers
      `,
      [rows.profile.tenant_key, rows.profile.source_event_id],
    );

    await client.query(apply ? "commit" : "rollback");

    console.log(
      JSON.stringify(
        {
          event: "source_contract_optimization_load",
          apply,
          sourceEvent: {
            id: sourceEvent.id,
            code: sourceEventCode,
            ensured: sourceEvent.ensured,
          },
          tenantKey: rows.profile.tenant_key,
          sourceEventId: rows.profile.source_event_id,
          syntheticDemo: rows.profile.synthetic_demo,
          decisionUse: rows.profile.decision_use,
          readyForOptimization: rows.profile.ready_for_optimization,
          generatedRows: {
            profiles: 1,
            findings: rows.findings.length,
            levers: rows.levers.length,
          },
          persistedRows: {
            profiles: Number(counts.rows[0]?.profiles || 0),
            findings: Number(counts.rows[0]?.findings || 0),
            levers: Number(counts.rows[0]?.levers || 0),
          },
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function assertRequiredTables(client: Client): Promise<void> {
  const tables = await client.query<{ table_name: string }>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name
    `,
    [
      [
        "source_events",
        "source_event_participants",
        "source_contract_optimization_profiles",
        "source_contract_optimization_findings",
        "source_contract_optimization_levers",
      ],
    ],
  );
  const foundTables = new Set(tables.rows.map((row) => row.table_name));
  for (const tableName of [
    "source_events",
    "source_contract_optimization_profiles",
    "source_contract_optimization_findings",
    "source_contract_optimization_levers",
  ]) {
    if (foundTables.has(tableName)) continue;
    throw new Error(
      `Contract optimization table ${tableName} missing. Found ${tables.rows
        .map((row) => row.table_name)
        .join(", ") || "none"}. Run migrations first.`,
    );
  }
}

async function ensureSourceEvent(args: {
  client: Client;
  apply: boolean;
  tenantKey: string;
  sourceEventCode: string;
}): Promise<{ id: string; ensured: boolean }> {
  const existing = await args.client.query<{ id: string }>(
    `
      select id
      from public.source_events
      where client_key = $1 and lower(event_code) = lower($2)
      order by updated_at desc
      limit 1
    `,
    [args.tenantKey, args.sourceEventCode],
  );
  const existingId = existing.rows[0]?.id;
  if (!args.apply) {
    return { id: existingId ?? args.sourceEventCode, ensured: Boolean(existingId) };
  }

  const nowIso = new Date().toISOString();
  const payload: Array<string | number> = [
    args.tenantKey,
    args.sourceEventCode,
    DEFAULT_SOURCE_EVENT_NAME,
    "managed_service",
    "responses",
    "active",
    72_000_000,
    "Incumbent AMS renewal decision: validate whether to renew as-is, renegotiate with enforceable cure conditions, or prepare an RFP fallback before the renewal notice window.",
    "Existing application managed services contract optimization across invoices, SLA economics, staffing commitments, change orders, operational workload, and renewal leverage.",
    "VP IT Operations / Procurement commercial lead",
    nowIso,
  ];

  if (existingId) {
    await args.client.query(
      `
        update public.source_events
        set event_name = $3,
            event_type = $4,
            current_stage_key = $5,
            lifecycle_state = $6,
            estimated_value_usd = $7,
            trigger_description = $8,
            scope_description = $9,
            decision_owner = $10,
            current_stage_entered_at = coalesce(current_stage_entered_at, $11::timestamptz),
            value_at_stake_low_usd = 5800000,
            value_at_stake_high_usd = 7400000,
            lead_agent = 'sentinel',
            classified_category = 'ams',
            updated_at = $11::timestamptz
        where client_key = $1 and lower(event_code) = lower($2)
      `,
      payload,
    );
    return { id: existingId, ensured: true };
  }

  const inserted = await args.client.query<{ id: string }>(
    `
      insert into public.source_events (
        client_key,
        event_code,
        event_name,
        event_type,
        current_stage_key,
        lifecycle_state,
        estimated_value_usd,
        trigger_description,
        scope_description,
        decision_owner,
        current_stage_entered_at,
        value_at_stake_low_usd,
        value_at_stake_high_usd,
        lead_agent,
        classified_category,
        created_at,
        updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz,
        5800000, 7400000, 'sentinel', 'ams', $11::timestamptz, $11::timestamptz
      )
      returning id
    `,
    payload,
  );
  const id = inserted.rows[0]?.id;
  if (!id) throw new Error("Source event insert did not return an id.");
  return { id, ensured: true };
}

async function ensureSourceParticipants(args: {
  client: Client;
  tenantKey: string;
  sourceEventId: string;
}): Promise<void> {
  const participantTable = await args.client.query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'source_event_participants'
      ) as exists
    `,
  );
  if (!participantTable.rows[0]?.exists) return;

  await args.client.query(
    `
      insert into public.source_event_participants (
        client_key,
        source_event_id,
        source_event_row_id,
        user_id,
        user_name,
        role,
        approval_authority,
        source_access_level,
        can_view_financial,
        can_upload_source_artifacts,
        can_generate_sourcing_artifacts,
        can_publish_sourcing_artifacts,
        can_approve_source_stages,
        can_approve_award,
        notify_on,
        updated_at
      )
      select
        $1,
        $2,
        $2::uuid,
        pcm.person_id::text,
        coalesce(p.name, p.email, 'SkyHarbor source participant'),
        'source contributor',
        'approver',
        'source_member',
        true,
        true,
        true,
        false,
        true,
        false,
        array['source_event_update', 'approval_needed']::text[],
        now()
      from public.person_client_memberships pcm
      join public.clients c on c.id = pcm.client_id
      left join public.persons p on p.id = pcm.person_id
      where c.key = $1
        and pcm.person_id is not null
      on conflict (client_key, source_event_id, user_id)
      do update set
        source_event_row_id = excluded.source_event_row_id,
        source_access_level = excluded.source_access_level,
        can_view_financial = excluded.can_view_financial,
        can_generate_sourcing_artifacts = excluded.can_generate_sourcing_artifacts,
        can_approve_source_stages = excluded.can_approve_source_stages,
        updated_at = now()
    `,
    [args.tenantKey, args.sourceEventId],
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
