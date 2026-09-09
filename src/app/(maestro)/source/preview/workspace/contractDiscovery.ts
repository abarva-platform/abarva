import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type {
  SourceContract360Row,
  SourceContractActionCandidateRow,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";
import type { SourceWorkspacePortfolioData } from "./live/portfolioAdapter";
import { money } from "./viewModel";

function safeSupplementalVendorName(
  vendorName: string | null | undefined,
  vendorRef: string | null | undefined,
): string {
  const name = vendorName?.trim();
  if (name) return name;
  const ref = vendorRef?.trim();
  return ref || "Vendor name not resolved";
}

function supplementalCoverageContractRow(
  coverage: SourceContractEvidenceCoverageRow,
): SourceContract360Row {
  const committedSpend = numberFromDb(coverage.committed_spend_usd);
  const actualSpend = numberFromDb(coverage.actual_spend_usd);
  return {
    tenant_key: coverage.tenant_key,
    contract_id: coverage.contract_id,
    vendor_ref: coverage.vendor_ref,
    vendor_name: safeSupplementalVendorName(
      coverage.vendor_name,
      coverage.vendor_ref,
    ),
    vendor_category: coverage.vendor_category ?? coverage.contract_archetype ?? null,
    contract_archetype: coverage.contract_archetype ?? null,
    contract_name: coverage.contract_name || "Contract depth record",
    scope_summary: (coverage.coverage_state ?? "loaded").replaceAll("_", " "),
    annual_value: committedSpend ?? actualSpend,
    total_committed_value: committedSpend,
    committed_annual_spend: committedSpend,
    actual_annual_spend: actualSpend,
    renewal_notice_date: null,
    notice_deadline: null,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: coverage.coverage_state,
    renewal_owner_ref: null,
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: "Loaded through supplemental contract-depth evidence.",
    source_confidence: null,
    resolved_annual_value: committedSpend ?? actualSpend,
    resolved_total_committed_value: committedSpend,
    annual_value_conflict_flag: false,
    total_committed_value_conflict_flag: false,
    scoped_application_count: coverage.scope_rows,
    critical_application_count: coverage.critical_scope_rows,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: false,
    initiative_dependency_count: null,
  };
}

function supplementalActionContractRow(
  action: SourceContractActionCandidateRow,
): SourceContract360Row {
  const candidateAmount = numberFromDb(action.candidate_amount_usd);
  return {
    tenant_key: action.tenant_key,
    contract_id: action.contract_id,
    vendor_ref: action.vendor_ref,
    vendor_name: safeSupplementalVendorName(action.vendor_name, action.vendor_ref),
    vendor_category: action.opportunity_type ?? action.action_type ?? null,
    contract_archetype: action.opportunity_type ?? null,
    contract_name: action.title || "Action-layer contract",
    scope_summary: action.finding_summary ?? action.deterministic_basis,
    annual_value: null,
    total_committed_value: null,
    committed_annual_spend: null,
    actual_annual_spend: null,
    renewal_notice_date: null,
    notice_deadline: null,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: action.readiness_state,
    renewal_owner_ref: action.accountable_role,
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note:
      candidateAmount == null
        ? "Loaded through supplemental action evidence."
        : `${money(candidateAmount)} candidate action value loaded through supplemental action evidence.`,
    source_confidence: null,
    resolved_annual_value: null,
    resolved_total_committed_value: null,
    annual_value_conflict_flag: false,
    total_committed_value_conflict_flag: false,
    scoped_application_count: null,
    critical_application_count: null,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: false,
    initiative_dependency_count: null,
  };
}

export function focusableContractRows(
  portfolio: SourceWorkspacePortfolioData,
): readonly SourceContract360Row[] {
  const rows = new Map(
    portfolio.contracts.map((contract) => [contract.contract_id, contract]),
  );

  for (const coverage of portfolio.impact?.evidenceCoverage ?? []) {
    if (!rows.has(coverage.contract_id)) {
      rows.set(coverage.contract_id, supplementalCoverageContractRow(coverage));
    }
  }

  for (const action of portfolio.impact?.actionCandidates ?? []) {
    if (!rows.has(action.contract_id)) {
      rows.set(action.contract_id, supplementalActionContractRow(action));
    }
  }

  return [...rows.values()];
}
