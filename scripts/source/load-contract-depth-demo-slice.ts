import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { Client, type QueryResultRow } from "pg";

import {
  buildContractDepthScenario,
  contractDepthOpportunityId,
  contractDepthQualityGate,
  type ContractDepthMonth,
} from "../../src/lib/source/data-model/contract-depth-demo-slice";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

interface Args {
  readonly apply: boolean;
  readonly tenantKey: string;
  readonly tenantAliases: readonly string[];
  readonly contractId: string;
  readonly datasetVersion: string;
  readonly loadRunId: string;
  readonly idempotencyKey: string;
  readonly asOfMonth: string;
  readonly outDir: string;
  readonly emitProofBundle: boolean;
  readonly allowContractUpsert: boolean;
}

interface ContractIdentity {
  readonly tenantKey: string;
  readonly contractId: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly annualValueUsd: number | null;
  readonly totalCommittedValueUsd: number | null;
  readonly expirationDate: string | null;
  readonly loadRunId: string | null;
  readonly source: string;
}

interface CountRow {
  readonly source_contract: string;
  readonly source_contract_consumption_observation: string;
  readonly source_contract_performance_observation: string;
  readonly source_contract_service_credit: string;
  readonly consumption_sourcing_spend_monthly_v1: string;
  readonly consumption_sourcing_performance_v1: string;
  readonly optimization_opportunity: string;
  readonly calculation_run: string;
  readonly opportunity_evidence: string;
  readonly total_spend: string;
  readonly credit_calculated: string;
  readonly credit_claimed: string;
  readonly credit_recovered: string;
  readonly unclaimed_credit: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const value = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index >= 0) return argv[index + 1];
    return argv
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  const tenantKey =
    value("--tenant-key") ?? process.env.SOURCE_CONTRACT_DEPTH_TENANT_KEY;
  const contractId =
    value("--contract-id") ?? process.env.SOURCE_CONTRACT_DEPTH_CONTRACT_ID;
  if (!tenantKey) throw new Error("Missing --tenant-key.");
  if (!contractId) throw new Error("Missing --contract-id.");
  const aliases = (
    value("--tenant-alias") ??
    process.env.SOURCE_CONTRACT_DEPTH_TENANT_ALIASES ??
    tenantKey
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const loadRunId =
    value("--load-run-id") ??
    process.env.SOURCE_CONTRACT_DEPTH_LOAD_RUN_ID ??
    `source-contract-depth-${stamp()}`;
  const idempotencyKey =
    value("--idempotency-key") ??
    process.env.SOURCE_CONTRACT_DEPTH_IDEMPOTENCY_KEY ??
    `${tenantKey}:${contractId}:sla-credit-depth:v1`;
  return {
    apply:
      argv.includes("--apply") ||
      process.env.SOURCE_CONTRACT_DEPTH_APPLY === "true",
    tenantKey,
    tenantAliases: [...new Set([tenantKey, ...aliases])],
    contractId,
    datasetVersion:
      value("--dataset-version") ??
      process.env.SOURCE_CONTRACT_DEPTH_DATASET_VERSION ??
      "source-contract-depth-sla-credit-v1",
    loadRunId,
    idempotencyKey,
    asOfMonth:
      value("--as-of-month") ??
      process.env.SOURCE_CONTRACT_DEPTH_AS_OF_MONTH ??
      "2026-08-01",
    outDir: path.resolve(
      value("--out-dir") ??
        process.env.SOURCE_CONTRACT_DEPTH_PROOF_DIR ??
        `/tmp/source-contract-depth-${stamp()}`,
    ),
    emitProofBundle:
      argv.includes("--emit-proof-bundle") ||
      process.env.SOURCE_CONTRACT_DEPTH_EMIT_PROOF_BUNDLE === "true" ||
      process.env.EMIT_ACA_PROOF_BUNDLE === "true",
    allowContractUpsert:
      argv.includes("--allow-contract-upsert") ||
      process.env.SOURCE_CONTRACT_DEPTH_ALLOW_CONTRACT_UPSERT === "true",
  };
}

function databaseUrl(): string {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

async function assertRequiredTables(client: Client): Promise<void> {
  const required = [
    ["source", "contract"],
    ["source", "contract_consumption_observation"],
    ["source", "contract_performance_observation"],
    ["source", "contract_service_credit"],
    ["source", "optimization_opportunity"],
    ["source", "optimization_baseline"],
    ["source", "opportunity_evidence"],
    ["source", "calculation_rule"],
    ["source", "calculation_run"],
    ["source", "calculation_input"],
    ["source", "calculation_output"],
    ["source", "opportunity_valuation"],
    ["source", "evidence_requirement"],
    ["source", "opportunity_requirement_status"],
    ["source", "evidence_request"],
    ["source", "opportunity_stage_event"],
    ["source", "optimization_case"],
    ["source", "case_opportunity"],
  ] as const;
  const result = await client.query<{ key: string }>(
    `SELECT table_schema || '.' || table_name AS key
       FROM information_schema.tables
      WHERE (table_schema, table_name) IN (${required
        .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
        .join(", ")})`,
    required.flat(),
  );
  const found = new Set(result.rows.map((row) => row.key));
  const missing = required
    .map(([schema, table]) => `${schema}.${table}`)
    .filter((key) => !found.has(key));
  if (missing.length > 0) {
    throw new Error(
      `Missing required Source depth tables: ${missing.join(", ")}. Stop and run migrations first.`,
    );
  }
}

async function readContractIdentity(
  client: Client,
  args: Args,
): Promise<ContractIdentity> {
  const contract = await client.query<Record<string, unknown>>(
    `SELECT
       c.tenant_key,
       c.contract_id,
       c.vendor_id,
       COALESCE(v.legal_name, c.vendor_id, 'Unknown vendor') AS vendor_name,
       c.contract_name,
       c.annual_value,
       c.total_committed_value,
       c.expiration_date,
       c.load_run_id
      FROM source.contract c
      LEFT JOIN source.vendor v
        ON v.tenant_key = c.tenant_key
       AND v.vendor_id = c.vendor_id
     WHERE c.tenant_key = ANY($1::text[])
       AND c.contract_id = $2
     ORDER BY c.updated_at DESC NULLS LAST
     LIMIT 1`,
    [args.tenantAliases, args.contractId],
  );
  if (contract.rows[0]) {
    const row = contract.rows[0];
    return {
      tenantKey: text(row.tenant_key) ?? args.tenantKey,
      contractId: text(row.contract_id) ?? args.contractId,
      vendorId: text(row.vendor_id) ?? "unknown-vendor",
      vendorName: text(row.vendor_name) ?? "Unknown vendor",
      contractName: text(row.contract_name) ?? args.contractId,
      annualValueUsd: numberValue(row.annual_value),
      totalCommittedValueUsd: numberValue(row.total_committed_value),
      expirationDate: dateValue(row.expiration_date),
      loadRunId: text(row.load_run_id),
      source: "source.contract",
    };
  }

  const candidate = await optionalQuery<Record<string, unknown>>(
    client,
    `SELECT *
       FROM source.meridian_vendor360_contract
      WHERE tenant_key = ANY($1::text[])
        AND contract_id = $2
      ORDER BY dataset_id DESC, updated_at DESC NULLS LAST
      LIMIT 1`,
    [args.tenantAliases, args.contractId],
  );
  if (candidate[0]) {
    const row = candidate[0];
    return {
      tenantKey: text(row.tenant_key) ?? args.tenantKey,
      contractId: text(row.contract_id) ?? args.contractId,
      vendorId: text(row.vendor_ref) ?? "unknown-vendor",
      vendorName: text(row.vendor_name) ?? "Unknown vendor",
      contractName: text(row.contract_name) ?? args.contractId,
      annualValueUsd: numberValue(row.annual_value),
      totalCommittedValueUsd: numberValue(row.total_committed_value),
      expirationDate: dateValue(row.end_date),
      loadRunId: null,
      source: "source.meridian_vendor360_contract",
    };
  }

  const projection = await optionalQuery<{ payload_json: Record<string, unknown> }>(
    client,
    `SELECT payload_json
       FROM serving.source_contract_360
      WHERE tenant_key = ANY($1::text[])
        AND (
          payload_json->>'row_key' = $2
          OR payload_json->>'contract_id' = $2
        )
      ORDER BY row_key
      LIMIT 1`,
    [args.tenantAliases, args.contractId],
  );
  if (projection[0]?.payload_json) {
    const row = projection[0].payload_json;
    return {
      tenantKey: text(row.tenant_key) ?? args.tenantKey,
      contractId: text(row.row_key) ?? text(row.contract_id) ?? args.contractId,
      vendorId: text(row.vendor_object_id) ?? "unknown-vendor",
      vendorName: text(row.vendor_name) ?? "Unknown vendor",
      contractName: text(row.contract_name) ?? args.contractId,
      annualValueUsd: numberValue(row.annualized_value_usd),
      totalCommittedValueUsd: numberValue(row.total_contract_value_usd),
      expirationDate: dateValue(row.end_date),
      loadRunId: null,
      source: "serving.source_contract_360",
    };
  }

  throw new Error(
    `Contract ${args.contractId} could not be found in canonical Source, candidate Source, or serving projection tables.`,
  );
}

async function optionalQuery<R extends QueryResultRow>(
  client: Client,
  sql: string,
  params: readonly unknown[],
): Promise<R[]> {
  try {
    const result = await client.query<R>(sql, [...params]);
    return result.rows;
  } catch (error) {
    if (String(error).includes("does not exist")) return [];
    throw error;
  }
}

async function activeLoadRunId(
  client: Client,
  args: Args,
  identity: ContractIdentity,
): Promise<string> {
  if (identity.loadRunId) return identity.loadRunId;
  const active = await optionalQuery<{ load_run_id: string }>(
    client,
    `SELECT load_run_id
       FROM source.l4_cube_active_load_run
      WHERE tenant_key = ANY($1::text[])
      LIMIT 1`,
    [args.tenantAliases],
  );
  return active[0]?.load_run_id ?? args.loadRunId;
}

async function ensureContractBackbone(
  client: Client,
  args: Args,
  identity: ContractIdentity,
  loadRunId: string,
  annualSpendUsd: number,
): Promise<Record<string, number>> {
  const updatedContract = await client.query<{ count: string }>(
    `WITH updated AS (
       UPDATE source.contract
          SET auto_renew = true,
              notice_deadline = CASE
                WHEN expiration_date IS NULL THEN notice_deadline
                ELSE expiration_date - 90
              END,
              benchmark_rights = 'present',
              annual_value = COALESCE(annual_value, $3),
              total_committed_value = COALESCE(total_committed_value, $3),
              load_run_id = COALESCE(load_run_id, $4),
              quality_state = 'reviewed',
              raw_payload = COALESCE(raw_payload, '{}'::jsonb) || $5::jsonb,
              updated_at = now()
        WHERE tenant_key = ANY($1::text[])
          AND contract_id = $2
      RETURNING 1
     )
     SELECT count(*)::text FROM updated`,
    [
      args.tenantAliases,
      args.contractId,
      annualSpendUsd,
      loadRunId,
      JSON.stringify({
        source_contract_depth_demo_slice: {
          idempotency_key: args.idempotencyKey,
          dataset_version: args.datasetVersion,
        },
      }),
    ],
  );
  let insertedContract = 0;
  if (Number(updatedContract.rows[0]?.count ?? 0) === 0) {
    if (!args.allowContractUpsert) {
      throw new Error(
        "No source.contract row matched the selected contract. Re-run with SOURCE_CONTRACT_DEPTH_ALLOW_CONTRACT_UPSERT=true only if materializing the canonical contract row from the serving projection is approved.",
      );
    }
    await client.query(
      `INSERT INTO source.contract (
         tenant_key, contract_id, vendor_id, contract_name, agreement_type,
         expiration_date, notice_deadline, renewal_type, auto_renew,
         annual_value, total_committed_value, currency, benchmark_rights,
         renewal_owner_role, source_system, source_record_id, as_of_date,
         confidence, quality_state, evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, $4, 'sourcing contract', $5::date,
         CASE WHEN $5::date IS NULL THEN NULL ELSE $5::date - 90 END,
         'review_required', true, $6, $7, 'USD', 'present',
         'Vendor management / service owner', 'governed_source_depth_loader',
         $8, $9::date, 0.86, 'reviewed', $10, $11, $12::jsonb
       )
       ON CONFLICT (tenant_key, contract_id)
       DO UPDATE SET auto_renew = EXCLUDED.auto_renew,
                     notice_deadline = EXCLUDED.notice_deadline,
                     benchmark_rights = EXCLUDED.benchmark_rights,
                     annual_value = COALESCE(source.contract.annual_value, EXCLUDED.annual_value),
                     total_committed_value = COALESCE(source.contract.total_committed_value, EXCLUDED.total_committed_value),
                     quality_state = EXCLUDED.quality_state,
                     load_run_id = COALESCE(source.contract.load_run_id, EXCLUDED.load_run_id),
                     raw_payload = COALESCE(source.contract.raw_payload, '{}'::jsonb) || EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        args.contractId,
        identity.vendorId,
        identity.contractName,
        identity.expirationDate,
        identity.annualValueUsd ?? annualSpendUsd,
        identity.totalCommittedValueUsd ?? identity.annualValueUsd ?? annualSpendUsd,
        args.idempotencyKey,
        args.asOfMonth,
        `source_contract_depth:${args.idempotencyKey}`,
        loadRunId,
        JSON.stringify({
          source_contract_depth_demo_slice: {
            idempotency_key: args.idempotencyKey,
            dataset_version: args.datasetVersion,
            source_identity: identity.source,
          },
        }),
      ],
    );
    insertedContract = 1;
  }

  const updatedCandidate = await optionalQuery<{ count: string }>(
    client,
    `WITH updated AS (
       UPDATE source.meridian_vendor360_contract
          SET actual_annual_spend = $3,
              notice_period_days = 90,
              auto_renew = true,
              benchmarking_clause = 'present',
              action_gate_state = COALESCE(action_gate_state, 'review_required'),
              updated_at = now()
        WHERE tenant_key = ANY($1::text[])
          AND contract_id = $2
      RETURNING 1
     )
     SELECT count(*)::text FROM updated`,
    [args.tenantAliases, args.contractId, annualSpendUsd],
  );

  return {
    sourceContractUpdated: Number(updatedContract.rows[0]?.count ?? 0),
    sourceContractInserted: insertedContract,
    candidateContractUpdated: Number(updatedCandidate[0]?.count ?? 0),
  };
}

async function upsertObservationRows(
  client: Client,
  args: Args,
  identity: ContractIdentity,
  loadRunId: string,
  months: readonly ContractDepthMonth[],
): Promise<void> {
  for (const [index, month] of months.entries()) {
    const monthKey = month.monthStart.slice(0, 7);
    const observationId = `${args.idempotencyKey}:spend:${monthKey}`;
    await client.query(
      `INSERT INTO source.contract_consumption_observation (
         tenant_key, observation_id, contract_id, service_id, business_unit,
         cost_center, period_start, period_end, committed_amount,
         invoice_amount, paid_amount, actual_spend, currency, source_system,
         source_record_id, as_of_date, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, 'claims-processing', 'Pharmacy operations',
         'pharmacy-benefits', $4::date, $5::date, $6, $7, $7, $7, 'USD',
         'governed_source_depth_loader', $2, $8::date, 0.92, 'reviewed',
         $9, $10, $11::jsonb
       )
       ON CONFLICT (tenant_key, observation_id)
       DO UPDATE SET period_start = EXCLUDED.period_start,
                     period_end = EXCLUDED.period_end,
                     committed_amount = EXCLUDED.committed_amount,
                     invoice_amount = EXCLUDED.invoice_amount,
                     paid_amount = EXCLUDED.paid_amount,
                     actual_spend = EXCLUDED.actual_spend,
                     quality_state = EXCLUDED.quality_state,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        observationId,
        identity.contractId,
        month.monthStart,
        month.monthEnd,
        716_667,
        month.actualSpendUsd,
        args.asOfMonth,
        `source_contract_depth:${args.idempotencyKey}`,
        loadRunId,
        JSON.stringify({
          row_index: index + 1,
          vendor_id: identity.vendorId,
          vendor_name: identity.vendorName,
          dataset_version: args.datasetVersion,
        }),
      ],
    );

    const performanceId = `${args.idempotencyKey}:performance:${monthKey}`;
    await client.query(
      `INSERT INTO source.contract_performance_observation (
         tenant_key, observation_id, contract_id, service_id, metric_name,
         period_start, period_end, contracted_target, actual_value, value_num,
         unit, breach_count, credit_eligible, credit_calculated,
         credit_claimed, credit_recovered, currency, source_system,
         source_record_id, as_of_date, confidence, quality_state,
         evidence_reference, load_run_id, raw_payload
       )
       VALUES (
         $1, $2, $3, 'claims-processing',
         'claims processed within 24 hours (%)', $4::date, $5::date,
         '95%', $6, $7, '%', $8, $9, $10, $11, 0, 'USD',
         'governed_source_depth_loader', $2, $12::date, 0.94, 'reviewed',
         $13, $14, $15::jsonb
       )
       ON CONFLICT (tenant_key, observation_id)
       DO UPDATE SET period_start = EXCLUDED.period_start,
                     period_end = EXCLUDED.period_end,
                     contracted_target = EXCLUDED.contracted_target,
                     actual_value = EXCLUDED.actual_value,
                     value_num = EXCLUDED.value_num,
                     breach_count = EXCLUDED.breach_count,
                     credit_eligible = EXCLUDED.credit_eligible,
                     credit_calculated = EXCLUDED.credit_calculated,
                     credit_claimed = EXCLUDED.credit_claimed,
                     credit_recovered = EXCLUDED.credit_recovered,
                     quality_state = EXCLUDED.quality_state,
                     evidence_reference = EXCLUDED.evidence_reference,
                     load_run_id = EXCLUDED.load_run_id,
                     raw_payload = EXCLUDED.raw_payload,
                     updated_at = now()`,
      [
        args.tenantKey,
        performanceId,
        identity.contractId,
        month.monthStart,
        month.monthEnd,
        `${month.slaActualPct}%`,
        month.slaActualPct,
        month.breached ? 1 : 0,
        month.breached,
        month.creditOwedUsd,
        month.creditClaimedUsd,
        args.asOfMonth,
        `source_contract_depth:${args.idempotencyKey}`,
        loadRunId,
        JSON.stringify({
          row_index: index + 1,
          vendor_id: identity.vendorId,
          vendor_name: identity.vendorName,
          contracted_threshold_pct: month.slaTargetPct,
          credit_owed_usd: month.creditOwedUsd,
          credit_claimed: false,
          dataset_version: args.datasetVersion,
        }),
      ],
    );

    if (month.breached) {
      const creditId = `${args.idempotencyKey}:service-credit:${monthKey}`;
      await client.query(
        `INSERT INTO source.contract_service_credit (
           tenant_key, service_credit_id, contract_id, service_id,
           period_start, period_end, trigger_metric, credit_earned,
           credit_claimed, credit_recovered, credit_waived, currency, status,
           owner_role, source_system, source_record_id, as_of_date, confidence,
           quality_state, evidence_reference, load_run_id, raw_payload
         )
         VALUES (
           $1, $2, $3, 'claims-processing', $4::date, $5::date,
           'claims processed within 24 hours (%)', $6, 0, 0, 0, 'USD',
           'identified', 'Vendor management / service owner',
           'governed_source_depth_loader', $2, $7::date, 0.94, 'reviewed',
           $8, $9, $10::jsonb
         )
         ON CONFLICT (tenant_key, service_credit_id)
         DO UPDATE SET period_start = EXCLUDED.period_start,
                       period_end = EXCLUDED.period_end,
                       credit_earned = EXCLUDED.credit_earned,
                       credit_claimed = EXCLUDED.credit_claimed,
                       credit_recovered = EXCLUDED.credit_recovered,
                       credit_waived = EXCLUDED.credit_waived,
                       status = EXCLUDED.status,
                       quality_state = EXCLUDED.quality_state,
                       evidence_reference = EXCLUDED.evidence_reference,
                       load_run_id = EXCLUDED.load_run_id,
                       raw_payload = EXCLUDED.raw_payload,
                       updated_at = now()`,
        [
          args.tenantKey,
          creditId,
          identity.contractId,
          month.monthStart,
          month.monthEnd,
          month.creditOwedUsd,
          args.asOfMonth,
          `source_contract_depth:${args.idempotencyKey}`,
          loadRunId,
          JSON.stringify({
            actual_pct: month.slaActualPct,
            threshold_pct: month.slaTargetPct,
            credit_owed_usd: month.creditOwedUsd,
            credit_claimed: false,
            dataset_version: args.datasetVersion,
          }),
        ],
      );
    }
  }
}

async function replaceOptimizationSpine(
  client: Client,
  args: Args,
  identity: ContractIdentity,
  scenario: ReturnType<typeof buildContractDepthScenario>,
): Promise<void> {
  const opportunityId = contractDepthOpportunityId({
    contractId: identity.contractId,
    datasetVersion: args.datasetVersion,
  });
  const calculationRunId = `${opportunityId}:calculation:1.0.0`;
  const baselineId = `${identity.contractId}:commercial-baseline`;
  const caseId = `${identity.contractId}:optimize-contract`;

  await client.query(
    `DELETE FROM source.optimization_case
      WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, identity.contractId],
  );
  await client.query(
    `DELETE FROM source.optimization_baseline
      WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, identity.contractId],
  );
  await client.query(
    `DELETE FROM source.optimization_opportunity
      WHERE tenant_key = $1 AND dataset_version = $2 AND contract_id = $3`,
    [args.tenantKey, args.datasetVersion, identity.contractId],
  );

  await client.query(
    `INSERT INTO source.optimization_baseline (
       tenant_key, dataset_version, baseline_id, contract_id, baseline_state,
       annual_value_usd, pricing_schedule_annual_value_usd,
       actual_annual_spend_usd, total_committed_value_usd,
       conflict_amount_usd, detail, source_refs, payload
     )
     VALUES (
       $1, $2, $3, $4, 'ready', $5, NULL, $6, $7, NULL,
       $8, $9::jsonb, $10::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      baselineId,
      identity.contractId,
      identity.annualValueUsd ?? scenario.annualBaseFeeUsd,
      scenario.annualSpendUsd,
      identity.totalCommittedValueUsd ?? identity.annualValueUsd ?? scenario.annualBaseFeeUsd,
      "Annual spend is supported by 12 governed monthly spend observations; pricing schedule tie-out remains a separate evidence class.",
      JSON.stringify([
        "source.contract_consumption_observation",
        "source.contract_performance_observation",
      ]),
      JSON.stringify({
        headline: "Monthly spend and SLA evidence are loaded for optimization review.",
      }),
    ],
  );

  await client.query(
    `INSERT INTO source.optimization_opportunity (
       tenant_key, dataset_version, opportunity_id, contract_id, vendor_id,
       value_type, stage, amount_usd, amount_state, evidence_grade,
       confidence, owner, next_action, blocking_gap, deadline,
       overlap_treatment, approval_state, narrative, payload
     )
     VALUES (
       $1, $2, $3, $4, $5, 'recoverable_leakage', 'quantified', $6,
       'exact', 'system_evidenced', 0.90,
       'Vendor management / service owner',
       'Validate entitlement against SLA clause and service-review pack before issuing a recovery claim.',
       'Entitlement, vendor-responsibility exclusions, and claim status require legal/vendor-management review.',
       NULL, 'Tracked as recoverable opportunity. Credits already received are kept out of the finance-confirmed outcome calculation.',
       'requires_entitlement_review', $7, $8::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      opportunityId,
      identity.contractId,
      identity.vendorId,
      scenario.unclaimedCreditUsd,
      `Monthly SLA evidence shows ${formatUsd(scenario.creditOwedUsd)} earned, ${formatUsd(scenario.creditClaimedUsd)} claimed, and ${formatUsd(0)} received.`,
      JSON.stringify({
        label: "SLA credits earned but not claimed",
        short_label: "SLA credits",
        source_systems: ["ITSM / service management", "CLM / contract repository"],
        idempotency_key: args.idempotencyKey,
      }),
    ],
  );

  await client.query(
    `INSERT INTO source.calculation_rule (
       tenant_key, dataset_version, rule_id, rule_version, formula,
       input_contract, output_contract, payload
     )
     VALUES (
       $1, $2, 'source.contract_optimization.sla_credit_recovery.v1',
       '1.0.0',
       'SUM(max(service credits earned - service credits claimed, 0)) by contract month = unclaimed SLA credit opportunity',
       $3::jsonb, $4::jsonb, '{}'::jsonb
     )
     ON CONFLICT (tenant_key, dataset_version, rule_id, rule_version)
     DO UPDATE SET formula = EXCLUDED.formula,
                   input_contract = EXCLUDED.input_contract,
                   output_contract = EXCLUDED.output_contract`,
    [
      args.tenantKey,
      args.datasetVersion,
      JSON.stringify([
        "contract_month",
        "credit_earned_usd",
        "credit_claimed_usd",
      ]),
      JSON.stringify(["calculated_amount_usd", "eligible_quantity"]),
    ],
  );

  await client.query(
    `INSERT INTO source.calculation_run (
       tenant_key, dataset_version, calculation_run_id, opportunity_id,
       rule_id, rule_version, run_state, run_hash, completed_at, payload
     )
     VALUES (
       $1, $2, $3, $4,
       'source.contract_optimization.sla_credit_recovery.v1', '1.0.0',
       'completed', $5, now(), $6::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      calculationRunId,
      opportunityId,
      sha256(JSON.stringify(scenario.months)),
      JSON.stringify({
        included_line_count: scenario.missedMonthCount,
        excluded_line_count: scenario.months.length - scenario.missedMonthCount,
        pending_line_count: 0,
      }),
    ],
  );

  for (const month of scenario.months.filter((row) => row.creditOwedUsd > 0)) {
    const monthKey = month.monthStart.slice(0, 7);
    const sourceRecordId = `${args.idempotencyKey}:performance:${monthKey}`;
    await client.query(
      `INSERT INTO source.opportunity_evidence (
         tenant_key, dataset_version, opportunity_id, evidence_class,
         source_system, source_table, source_record_id, source_file_report,
         source_document_id, source_page, source_span, review_state,
         evidence_status, amount_usd, quantity, unit, payload
       )
       VALUES (
         $1, $2, $3, 'sla', 'ITSM / service management',
         'source.contract_performance_observation', $4, NULL, NULL, NULL, NULL,
         'system_evidenced', 'EVIDENCE_AVAILABLE', $5, 1, 'month', $6::jsonb
       )`,
      [
        args.tenantKey,
        args.datasetVersion,
        opportunityId,
        sourceRecordId,
        month.creditOwedUsd,
        JSON.stringify({
          period_start: month.monthStart,
          period_end: month.monthEnd,
          actual_pct: month.slaActualPct,
          threshold_pct: month.slaTargetPct,
          credit_claimed: false,
        }),
      ],
    );
    for (const input of [
      ["credit_earned_usd", month.creditOwedUsd, "USD"],
      ["credit_claimed_usd", month.creditClaimedUsd, "USD"],
      ["actual_sla_pct", month.slaActualPct, "%"],
    ] as const) {
      await client.query(
        `INSERT INTO source.calculation_input (
           tenant_key, dataset_version, calculation_run_id, input_key,
           source_table, source_record_id, value_numeric, value_text, unit,
           inclusion_state, inclusion_reason, payload
         )
         VALUES (
           $1, $2, $3, $4, 'source.contract_performance_observation', $5,
           $6, NULL, $7, 'included',
           'Missed monthly SLA period with earned unclaimed service credit.',
           $8::jsonb
         )`,
        [
          args.tenantKey,
          args.datasetVersion,
          calculationRunId,
          `${monthKey}.${input[0]}`,
          sourceRecordId,
          input[1],
          input[2],
          JSON.stringify({
            period_start: month.monthStart,
            period_end: month.monthEnd,
          }),
        ],
      );
    }
  }

  await client.query(
    `INSERT INTO source.calculation_output (
       tenant_key, dataset_version, calculation_run_id, output_key,
       amount_usd, quantity, unit, payload
     )
     VALUES
       ($1, $2, $3, 'calculated_amount_usd', $4, NULL, 'USD', '{}'::jsonb),
       ($1, $2, $3, 'eligible_quantity', NULL, $5, 'month', '{}'::jsonb)`,
    [
      args.tenantKey,
      args.datasetVersion,
      calculationRunId,
      scenario.unclaimedCreditUsd,
      scenario.missedMonthCount,
    ],
  );

  await client.query(
    `INSERT INTO source.opportunity_valuation (
       tenant_key, dataset_version, opportunity_id, valuation_type,
       amount_usd, valuation_state, basis, source_run_id,
       effective_date, payload
     )
     VALUES (
       $1, $2, $3, 'potential', $4, 'quantified',
       'Monthly SLA-credit observations calculate earned less claimed credits.',
       $5, $6::date, $7::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      opportunityId,
      scenario.unclaimedCreditUsd,
      calculationRunId,
      args.asOfMonth,
      JSON.stringify({ amount_state: "exact", evidence_grade: "system_evidenced" }),
    ],
  );

  const requirementId = `${opportunityId}:entitlement-review`;
  await client.query(
    `INSERT INTO source.evidence_requirement (
       tenant_key, dataset_version, requirement_id, evidence_class,
       requirement_text, grain, minimum_period_months, owner_role, payload
     )
     VALUES (
       $1, $2, $3, 'sla',
       'Legal/vendor-management review must validate entitlement and exclusions before issuing a credit claim.',
       'contract_month', 12, 'Vendor management / service owner', '{}'::jsonb
     )
     ON CONFLICT (tenant_key, dataset_version, requirement_id)
     DO UPDATE SET requirement_text = EXCLUDED.requirement_text,
                   grain = EXCLUDED.grain,
                   minimum_period_months = EXCLUDED.minimum_period_months`,
    [args.tenantKey, args.datasetVersion, requirementId],
  );
  await client.query(
    `INSERT INTO source.opportunity_requirement_status (
       tenant_key, dataset_version, opportunity_id, requirement_id, status,
       status_detail, owner, due_date, payload
     )
     VALUES (
       $1, $2, $3, $4, 'workflow_required',
       'System evidence quantifies the credit gap; entitlement review remains required before vendor action.',
       'Vendor management / service owner', NULL, '{}'::jsonb
     )`,
    [args.tenantKey, args.datasetVersion, opportunityId, requirementId],
  );
  await client.query(
    `INSERT INTO source.evidence_request (
       tenant_key, dataset_version, evidence_request_id, opportunity_id,
       requirement_id, request_text, owner, due_date, request_state, payload
     )
     VALUES (
       $1, $2, $3, $4, $5,
       'Validate SLA entitlement and claim window before issuing recovery demand.',
       'Vendor management / service owner', NULL, 'open', '{}'::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      `${opportunityId}:entitlement-review-request`,
      opportunityId,
      requirementId,
    ],
  );
  await client.query(
    `INSERT INTO source.opportunity_stage_event (
       tenant_key, dataset_version, opportunity_id, from_stage, to_stage,
       reason, changed_by_role, payload
     )
     VALUES (
       $1, $2, $3, NULL, 'quantified',
       'Monthly SLA rows loaded through governed Source depth job.',
       'source_depth_loader', '{}'::jsonb
     )`,
    [args.tenantKey, args.datasetVersion, opportunityId],
  );
  await client.query(
    `INSERT INTO source.optimization_case (
       tenant_key, dataset_version, optimization_case_id, door1_event_id,
       contract_id, vendor_id, baseline_id, case_state, owner, next_action,
       payload
     )
     VALUES (
       $1, $2, $3, NULL, $4, $5, $6, 'evidence_review',
       'Vendor management / service owner',
       'Validate entitlement before vendor outreach.',
       $7::jsonb
     )`,
    [
      args.tenantKey,
      args.datasetVersion,
      caseId,
      identity.contractId,
      identity.vendorId,
      baselineId,
      JSON.stringify({
        recommendation: "Review governed SLA-credit recovery evidence.",
        selected_opportunity_id: opportunityId,
      }),
    ],
  );
  await client.query(
    `INSERT INTO source.case_opportunity (
       tenant_key, dataset_version, optimization_case_id, opportunity_id,
       selected_for_action, sequence, payload
     )
     VALUES ($1, $2, $3, $4, true, 1, '{}'::jsonb)`,
    [args.tenantKey, args.datasetVersion, caseId, opportunityId],
  );
}

async function readbackCounts(
  client: Client,
  args: Args,
  identity: ContractIdentity,
): Promise<Record<string, number>> {
  const result = await client.query<CountRow>(
    `SELECT
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = ANY($1::text[]) AND contract_id = $2) AS source_contract,
       (SELECT count(*)::text FROM source.contract_consumption_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS source_contract_consumption_observation,
       (SELECT count(*)::text FROM source.contract_performance_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS source_contract_performance_observation,
       (SELECT count(*)::text FROM source.contract_service_credit WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS source_contract_service_credit,
       (SELECT count(*)::text FROM consumption.sourcing_spend_monthly_v1 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 AND knowledge_baseline_ref IS NOT NULL) AS consumption_sourcing_spend_monthly_v1,
       (SELECT count(*)::text FROM consumption.sourcing_performance_v1 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 AND knowledge_baseline_ref IS NOT NULL) AS consumption_sourcing_performance_v1,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $3 AND dataset_version = $5 AND contract_id = $2) AS optimization_opportunity,
       (SELECT count(*)::text FROM source.calculation_run WHERE tenant_key = $3 AND dataset_version = $5) AS calculation_run,
       (SELECT count(*)::text FROM source.opportunity_evidence WHERE tenant_key = $3 AND dataset_version = $5) AS opportunity_evidence,
       (SELECT COALESCE(SUM(actual_spend), 0)::text FROM source.contract_consumption_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS total_spend,
       (SELECT COALESCE(SUM(credit_calculated), 0)::text FROM source.contract_performance_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS credit_calculated,
       (SELECT COALESCE(SUM(credit_claimed), 0)::text FROM source.contract_performance_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS credit_claimed,
       (SELECT COALESCE(SUM(credit_recovered), 0)::text FROM source.contract_performance_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS credit_recovered,
       (SELECT COALESCE(SUM(GREATEST(COALESCE(credit_calculated, 0) - COALESCE(credit_claimed, 0), 0)), 0)::text FROM source.contract_performance_observation WHERE tenant_key = $3 AND contract_id = $2 AND evidence_reference = $4) AS unclaimed_credit`,
    [
      args.tenantAliases,
      identity.contractId,
      args.tenantKey,
      `source_contract_depth:${args.idempotencyKey}`,
      args.datasetVersion,
    ],
  );
  return Object.fromEntries(
    Object.entries(result.rows[0] ?? {}).map(([key, value]) => [
      key,
      numberValue(value) ?? 0,
    ]),
  );
}

function assertReadback(
  readback: Record<string, number>,
  scenario: ReturnType<typeof buildContractDepthScenario>,
): readonly string[] {
  const failures: string[] = [];
  if (readback.source_contract < 1) failures.push("source.contract row missing");
  if (readback.source_contract_consumption_observation !== 12) {
    failures.push("expected 12 source contract consumption observations");
  }
  if (readback.source_contract_performance_observation !== 12) {
    failures.push("expected 12 source contract performance observations");
  }
  if (readback.source_contract_service_credit !== 3) {
    failures.push("expected 3 source contract service-credit rows");
  }
  if (readback.optimization_opportunity !== 1) {
    failures.push("expected 1 optimization opportunity");
  }
  if (readback.calculation_run !== 1) failures.push("expected 1 calculation run");
  if (Math.abs(readback.total_spend - scenario.annualSpendUsd) > 0.01) {
    failures.push("annual spend readback does not reconcile");
  }
  if (Math.abs(readback.unclaimed_credit - scenario.unclaimedCreditUsd) > 0.01) {
    failures.push("unclaimed credit readback does not reconcile");
  }
  return failures;
}

function writeProof(
  outDir: string,
  name: string,
  value: unknown,
): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(value, null, 2));
}

function writeSummaryMarkdown(
  outDir: string,
  summary: Record<string, unknown>,
): void {
  fs.writeFileSync(
    path.join(outDir, "SUMMARY.md"),
    [
      "# Source Contract Depth Load Proof",
      "",
      `- Status: ${summary.status}`,
      `- Mode: ${summary.mode}`,
      `- Tenant scope: ${summary.tenantScope}`,
      `- Contract id: ${summary.contractId}`,
      `- Dataset version: ${summary.datasetVersion}`,
      `- Idempotency key: ${summary.idempotencyKey}`,
      `- Mutation: ${summary.mutation}`,
      `- Quality gate: ${summary.qualityGate}`,
      "",
    ].join("\n"),
  );
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const tar = spawnSync(
    "tar",
    ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)],
    { encoding: "utf8" },
  );
  if (tar.status !== 0) throw new Error(tar.stderr || "Proof bundle tar failed");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main(): Promise<void> {
  const args = parseArgs();
  const scenario = buildContractDepthScenario({ asOfMonth: args.asOfMonth });
  const scenarioFailures = contractDepthQualityGate(scenario);
  fs.rmSync(args.outDir, { recursive: true, force: true });
  fs.mkdirSync(args.outDir, { recursive: true });
  writeProof(args.outDir, "scenario.json", scenario);

  if (scenarioFailures.length > 0) {
    throw new Error(`Scenario quality gate failed: ${scenarioFailures.join("; ")}`);
  }
  if (args.apply && process.env.SOURCE_CONTRACT_DEPTH_APPLY_APPROVED !== "true") {
    throw new Error(
      "Refusing write: set SOURCE_CONTRACT_DEPTH_APPLY_APPROVED=true in the governed ACA job.",
    );
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-depth-demo-slice"),
  );
  let identity: ContractIdentity | null = null;
  let backboneUpdates: Record<string, number> = {};
  let readback: Record<string, number> | null = null;
  let readbackFailures: readonly string[] = [];
  try {
    await client.connect();
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    await assertRequiredTables(client);
    identity = await readContractIdentity(client, args);
    const loadRunId = await activeLoadRunId(client, args, identity);
    writeProof(args.outDir, "contract-identity.json", {
      ...identity,
      observationLoadRunId: loadRunId,
    });
    if (args.apply) {
      await client.query("BEGIN");
      backboneUpdates = await ensureContractBackbone(
        client,
        args,
        identity,
        loadRunId,
        scenario.annualSpendUsd,
      );
      await upsertObservationRows(
        client,
        args,
        identity,
        loadRunId,
        scenario.months,
      );
      await replaceOptimizationSpine(client, args, identity, scenario);
      await client.query("COMMIT");
    }
    readback = await readbackCounts(client, args, identity);
    readbackFailures = args.apply ? assertReadback(readback, scenario) : [];
    writeProof(args.outDir, "readback.json", readback);
    writeProof(args.outDir, "quality-gate.json", {
      scenarioFailures,
      readbackFailures,
      pass: scenarioFailures.length === 0 && readbackFailures.length === 0,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    status: readbackFailures.length === 0 ? "pass" : "fail",
    mode: args.apply ? "apply" : "dry-run",
    tenantScope: args.tenantKey,
    tenantAliases: args.tenantAliases,
    contractId: args.contractId,
    datasetVersion: args.datasetVersion,
    loadRunId: args.loadRunId,
    idempotencyKey: args.idempotencyKey,
    mutation: args.apply ? "single-contract-source-depth-upsert" : "none",
    contractIdentitySource: identity?.source,
    scenario,
    backboneUpdates,
    readback,
    qualityGate: readbackFailures.length === 0 ? "pass" : "fail",
    readbackFailures,
    productProofExpectations: [
      "Contract 360 Performance tab should show 12 monthly SLA rows and 3 missed periods.",
      "Contract 360 Optimize tab should show a quantified SLA-credit recovery opportunity.",
      "Source Proof Layers should show non-zero spend_consumption and performance_credits rows.",
    ],
  };
  writeProof(args.outDir, "SUMMARY.json", summary);
  writeSummaryMarkdown(args.outDir, summary);
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  console.log(JSON.stringify(summary, null, 2));
  if (readbackFailures.length > 0) process.exitCode = 1;
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function text(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value ?? "").replace(/,/gu, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const date = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : null;
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
