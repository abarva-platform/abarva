import { Client } from "pg";

import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  toContractOptimizationPersistenceRows,
} from "../../src/lib/source/contract-optimization";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

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
  return process.argv.includes("--apply") || process.env.SOURCE_CONTRACT_OPTIMIZATION_APPLY === "true";
}

async function main() {
  const input = buildSkyHarborAmsExistingContractInput({
    tenantKey: process.env.TENANT_KEY || "skyharbor-air",
    sourceEventId:
      process.env.SOURCE_EVENT_ID || "skyh-ams-contract-optimization-2026",
  });
  const profile = buildContractOptimizationMveProfile(input);
  const rows = toContractOptimizationPersistenceRows(profile);
  const apply = shouldApply();

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-optimization-load"),
  );
  await client.connect();

  try {
    await client.query("begin");

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
          "source_contract_optimization_profiles",
          "source_contract_optimization_findings",
          "source_contract_optimization_levers",
        ],
      ],
    );

    if (tables.rowCount !== 3) {
      throw new Error(
        `Contract optimization tables missing. Found ${tables.rows
          .map((row) => row.table_name)
          .join(", ") || "none"}. Run migrations first.`,
      );
    }

    if (apply) {
      await client.query(
        `
          delete from public.source_contract_optimization_profiles
          where tenant_key = $1 and source_event_id = $2
        `,
        [rows.profile.tenant_key, rows.profile.source_event_id],
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
