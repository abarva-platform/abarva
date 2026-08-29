// Project governed Source contract-depth consumption rows into the unified
// Tower facts layer. Source remains the contract system of record; Tower gets
// only evidence-backed facts it can use for portfolio actions and CXO posture.

import {
  type CioTowerFactRow,
  type CioTowerFactScope,
  type CioTowerFactView,
  type CanonicalIdentity,
  type CioTowerTenantIdentity,
  factKey,
  safeKey,
  withCanonicalIdentity,
  SOURCE_PRIORITY,
} from "./facts-schema";
import { PROGRAM_METRIC_KEYS } from "./mart-metric-keys";

const FORMULA_VERSION = "source_contract_depth_to_tower_facts_v1";

export interface SourceContractRow {
  contract_id: string;
  contract_name: string | null;
  vendor_name: string | null;
  annual_contract_value: number | string | null;
  actual_annual_spend: number | string | null;
  authority_state: string | null;
  quality_state: string | null;
  knowledge_baseline_ref: string | null;
}

export interface SourceOpportunityRow {
  opportunity_id: string;
  contract_id: string;
  vendor_name: string | null;
  title: string | null;
  annual_value_exposed: number | string | null;
  readiness_state: string | null;
  evidence_state: string | null;
  recommended_action: string | null;
  accountable_role: string | null;
  knowledge_baseline_ref: string | null;
}

export interface SourcePerformanceAggregateRow {
  contract_id: string;
  breached_periods: number | string | null;
  credit_calculated: number | string | null;
  credit_claimed: number | string | null;
  credit_recovered: number | string | null;
  evidence_rows: number | string | null;
  knowledge_baseline_ref: string | null;
}

export interface SourceContractDepthInput {
  contracts?: readonly SourceContractRow[];
  opportunities?: readonly SourceOpportunityRow[];
  performance?: readonly SourcePerformanceAggregateRow[];
}

function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function contractProgramKey(contractId: string): string {
  return `contract::${safeKey(contractId)}`;
}

function contractCanonical(
  contract: {
    contract_id: string;
    contract_name?: string | null;
    vendor_name?: string | null;
  },
  metricKey: string,
  metricUnit: string,
): CanonicalIdentity {
  return {
    canonical_tool_key: null,
    canonical_program_key: contractProgramKey(contract.contract_id),
    vendor_name: contract.vendor_name ?? null,
    system_name: contract.contract_name ?? contract.contract_id,
    program_code: contract.contract_id,
    metric_key: metricKey,
    metric_unit: metricUnit,
    period_start: null,
    period_end: null,
    source_priority: SOURCE_PRIORITY.synthetic,
  };
}

function buildSourceContractFact(args: {
  tenantKey: string;
  keyParts: Array<string | number>;
  measure: string;
  view: CioTowerFactView;
  scope?: CioTowerFactScope;
  valueNumeric: number;
  unit?: CioTowerFactRow["unit"];
  basis?: CioTowerFactRow["basis"];
  amountType?: CioTowerFactRow["amount_type"];
  sourceKey: string;
  sourceRow: string | null;
  canonical: CanonicalIdentity;
  attributes?: Record<string, unknown>;
}): CioTowerFactRow {
  return {
    fact_key: factKey(args.tenantKey, ...args.keyParts),
    tenant_key: args.tenantKey,
    entity_key: null,
    entity_type: "contract",
    measure: args.measure,
    scope: args.scope ?? "contract",
    view: args.view,
    amount_type: args.amountType ?? "none",
    basis: args.basis ?? "actual",
    period: "current",
    value_numeric: args.valueNumeric,
    value_text: null,
    value_date: null,
    value_bool: null,
    unit: args.unit ?? "usd",
    value_source: "synthetic",
    confidence: "medium",
    source_key: args.sourceKey,
    source_row: args.sourceRow,
    formula_key: "",
    formula_version: FORMULA_VERSION,
    is_rollup_of: "",
    component_of: "",
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: JSON.stringify(
      withCanonicalIdentity(
        {
          source_system: "Source contract depth package",
          synthetic_policy: "synthetic_demo_only_not_client_truth",
          ...(args.attributes ?? {}),
        },
        args.canonical,
      ),
    ),
  };
}

export function projectSourceContractDepthToFacts(
  input: SourceContractDepthInput,
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const facts: CioTowerFactRow[] = [];
  const contractsById = new Map(
    (input.contracts ?? []).map((row) => [row.contract_id, row]),
  );

  for (const contract of input.contracts ?? []) {
    const annualValue = num(contract.annual_contract_value);
    if (annualValue !== null) {
      facts.push(
        buildSourceContractFact({
          tenantKey: identity.tenantKey,
          keyParts: ["source-contract-funding", contract.contract_id],
          measure: `${contract.contract_name ?? contract.contract_id} annual contract value`,
          view: "vendor_contract",
          valueNumeric: annualValue,
          basis: "committed",
          sourceKey: "source.contract_360",
          sourceRow: contract.contract_id,
          canonical: contractCanonical(
            contract,
            PROGRAM_METRIC_KEYS.approvedFunding,
            "usd",
          ),
          attributes: {
            contract_id: contract.contract_id,
            contract_name: contract.contract_name,
            vendor_name: contract.vendor_name,
            authority_state: contract.authority_state,
            quality_state: contract.quality_state,
            knowledge_baseline_ref: contract.knowledge_baseline_ref,
            funding_boundary: "annual_contract_value",
          },
        }),
      );
    }

    const actualSpend = num(contract.actual_annual_spend);
    if (actualSpend !== null) {
      facts.push(
        buildSourceContractFact({
          tenantKey: identity.tenantKey,
          keyParts: ["source-contract-actual-spend", contract.contract_id],
          measure: `${contract.contract_name ?? contract.contract_id} actual annual spend`,
          view: "vendor_contract",
          valueNumeric: actualSpend,
          amountType: "run",
          sourceKey: "consumption.sourcing_contract_v1",
          sourceRow: contract.contract_id,
          canonical: contractCanonical(
            contract,
            "contract_actual_annual_spend_usd",
            "usd",
          ),
          attributes: {
            contract_id: contract.contract_id,
            contract_name: contract.contract_name,
            vendor_name: contract.vendor_name,
            knowledge_baseline_ref: contract.knowledge_baseline_ref,
          },
        }),
      );
    }
  }

  for (const opportunity of input.opportunities ?? []) {
    const amount = num(opportunity.annual_value_exposed);
    if (amount === null || amount <= 0) continue;
    const contract = contractsById.get(opportunity.contract_id);
    const display = opportunity.title ?? contract?.contract_name ?? opportunity.contract_id;
    facts.push(
      buildSourceContractFact({
        tenantKey: identity.tenantKey,
        keyParts: ["source-contract-opportunity", opportunity.opportunity_id],
        measure: `${display} opportunity value`,
        view: "value",
        valueNumeric: amount,
        basis: "forecast",
        sourceKey: "consumption.sourcing_opportunity_v1",
        sourceRow: opportunity.opportunity_id,
        canonical: contractCanonical(
          {
            contract_id: opportunity.contract_id,
            contract_name: display,
            vendor_name: opportunity.vendor_name ?? contract?.vendor_name,
          },
          PROGRAM_METRIC_KEYS.promisedValue,
          "usd",
        ),
        attributes: {
          contract_id: opportunity.contract_id,
          opportunity_id: opportunity.opportunity_id,
          contract_name: contract?.contract_name ?? null,
          vendor_name: opportunity.vendor_name ?? contract?.vendor_name ?? null,
          title: opportunity.title,
          readiness_state: opportunity.readiness_state,
          evidence_state: opportunity.evidence_state,
          recommended_action: opportunity.recommended_action,
          evidence_owner: opportunity.accountable_role,
          finance_confirmation_state: "not_confirmed",
          knowledge_baseline_ref: opportunity.knowledge_baseline_ref,
        },
      }),
    );
  }

  for (const performance of input.performance ?? []) {
    const breachedPeriods = num(performance.breached_periods);
    if (breachedPeriods !== null && breachedPeriods > 0) {
      const contract = contractsById.get(performance.contract_id);
      facts.push(
        buildSourceContractFact({
          tenantKey: identity.tenantKey,
          keyParts: ["source-contract-sla-breaches", performance.contract_id],
          measure: `${contract?.contract_name ?? performance.contract_id} breached SLA periods`,
          view: "operational_kpi",
          valueNumeric: breachedPeriods,
          unit: "count",
          sourceKey: "consumption.sourcing_performance_v1",
          sourceRow: performance.contract_id,
          canonical: contractCanonical(
            {
              contract_id: performance.contract_id,
              contract_name: contract?.contract_name,
              vendor_name: contract?.vendor_name,
            },
            "contract_sla_breached_periods",
            "count",
          ),
          attributes: {
            contract_id: performance.contract_id,
            contract_name: contract?.contract_name ?? null,
            vendor_name: contract?.vendor_name ?? null,
            evidence_rows: num(performance.evidence_rows),
            knowledge_baseline_ref: performance.knowledge_baseline_ref,
          },
        }),
      );
    }

    const calculated = num(performance.credit_calculated) ?? 0;
    const claimed = num(performance.credit_claimed) ?? 0;
    const recovered = num(performance.credit_recovered) ?? 0;
    const unclaimed = Math.max(0, calculated - claimed - recovered);
    if (unclaimed > 0) {
      const contract = contractsById.get(performance.contract_id);
      facts.push(
        buildSourceContractFact({
          tenantKey: identity.tenantKey,
          keyParts: ["source-contract-unclaimed-credit", performance.contract_id],
          measure: `${contract?.contract_name ?? performance.contract_id} unclaimed service credits`,
          view: "operational_kpi",
          valueNumeric: unclaimed,
          sourceKey: "consumption.sourcing_performance_v1",
          sourceRow: performance.contract_id,
          canonical: contractCanonical(
            {
              contract_id: performance.contract_id,
              contract_name: contract?.contract_name,
              vendor_name: contract?.vendor_name,
            },
            "contract_unclaimed_service_credit_usd",
            "usd",
          ),
          attributes: {
            contract_id: performance.contract_id,
            contract_name: contract?.contract_name ?? null,
            vendor_name: contract?.vendor_name ?? null,
            credit_calculated: calculated,
            credit_claimed: claimed,
            credit_recovered: recovered,
            finance_confirmation_state: "not_confirmed",
            knowledge_baseline_ref: performance.knowledge_baseline_ref,
          },
        }),
      );
    }
  }

  return facts;
}
