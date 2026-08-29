// ─────────────────────────────────────────────────────────────────────────────
// TypeScript mirror of the new cross-domain SkyHarbor read-model schema
// (`source.*`, `tower.*`, `doc.*`, `meta.*`, `sem.*`), which all tenants are
// pivoting to. Source consumes this layer — it does not own or copy it.
//
// Every field name below was verified against a real Postgres export
// (SkyHarbor_Postgres_Layers_Cube_Audit_20260802T182921), not invented from
// the design spec alone. Row counts at verification time (tenant_key =
// 'skyharbor_global'):
//   source.contract_vendor_360        119 rows / 28 distinct vendor_ref
//   source.contract_360               120 rows (includes 1 non-vendor row)
//   source.contract_application_scope 3,373 rows (raw register has only 357
//                                      explicit contract-to-application refs
//                                      across 278 unique applications — the
//                                      extra rows are vendor-level inference,
//                                      see relationship_method below)
//   source.vendor_contract_portfolio  93 rows
//   tower.metric_observation          7,174 rows
//   tower.value_claim                 162 rows
//
// These schemas do not exist in this repo's tracked migrations as of this
// writing — they were applied directly against the SkyHarbor Postgres
// instance by a separate build lane. Treat this file as the contract until
// a migration file surfaces; keep it in lockstep once one does.
// ─────────────────────────────────────────────────────────────────────────────

/** Every table in this schema carries this discriminator. */
export type SkyHarborTenantKey = string;

// ---------------------------------------------------------------------------
// source.contract_vendor_360 / source.contract_360
//
// contract_360 is a strict superset of contract_vendor_360 (same commercial
// columns, plus enterprise-scope rollups). Kept as separate interfaces so a
// caller that only needs commercial terms doesn't have to know about scope
// counts that may not be populated for every contract.
// ---------------------------------------------------------------------------

/** `annual_value_conflict_flag`-style columns: true when sem.* extraction disagreed. */
export interface ConflictFlagged {
  readonly annual_value_conflict_flag: boolean | null;
  readonly total_committed_value_conflict_flag: boolean | null;
}

export interface SourceContractVendor360Row extends ConflictFlagged {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly vendor_category: string | null;
  readonly contract_name: string;
  readonly scope_summary: string | null;
  readonly annual_value: number | null;
  readonly total_committed_value: number | null;
  readonly committed_annual_spend: number | null;
  readonly actual_annual_spend: number | null;
  readonly end_date: string | null;
  readonly notice_period_days: number | null;
  readonly auto_renew: boolean;
  readonly renewal_decision_state: string | null;
  readonly renewal_owner_ref: string | null;
  readonly benchmarking_clause: string | null;
  readonly exit_rights_summary: string | null;
  readonly alternatives_available: string | null;
  readonly concentration_note: string | null;
  /** 0-1 confidence assigned by the resolution layer (sem.extraction_resolved). */
  readonly source_confidence: number | null;
  /** Resolved value to use when annual_value_conflict_flag is true — prefer this over annual_value. */
  readonly resolved_annual_value: number | null;
  readonly resolved_total_committed_value: number | null;
}

export interface SourceContract360Row extends SourceContractVendor360Row {
  readonly scoped_application_count: number | null;
  readonly critical_application_count: number | null;
  readonly linked_budget_amount: number | null;
  readonly linked_actual_amount: number | null;
  readonly linked_budget_lines: number | null;
  readonly cloud_sev1_sev2_incidents: number | null;
  readonly operational_evidence_gap: boolean | string | null;
  readonly initiative_dependency_count: number | null;
}

// ---------------------------------------------------------------------------
// source.vendor_contract_portfolio — one row per vendor, contracts rolled up.
// ---------------------------------------------------------------------------

export interface SourceVendorContractPortfolioRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly vendor_category: string | null;
  readonly contract_count: number;
  readonly annual_value: number | null;
  readonly total_committed_value: number | null;
  readonly auto_renew_contracts: number;
  readonly next_end_date: string | null;
  /** Postgres array column — contract_id[]. */
  readonly contract_refs: readonly string[];
}

// ---------------------------------------------------------------------------
// source.contract_application_scope — the confidence-tiered link table.
//
// relationship_method / relationship_confidence are NOT literal columns in
// the exported CSV (the raw view only carries hosting/lifecycle/criticality
// facts) — they must be derived by the repository layer per the "relationship
// confidence must remain visible" requirement, by cross-referencing which
// rows appear in the raw 357-row explicit register vs. rows only reachable
// via vendor_ref join. See vendor-contract-portfolio.ts for the derivation.
// ---------------------------------------------------------------------------

export interface SourceContractApplicationScopeRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly application_ref: string;
  readonly application_name: string;
  readonly business_function: string | null;
  readonly function_ref: string | null;
  readonly criticality: string | null;
  readonly lifecycle_state: string | null;
  readonly hosting_model: string | null;
  readonly annual_run_cost: number | null;
  readonly modernization_plan: string | null;
  readonly sla_tier: string | null;
  readonly known_pain_risk: string | null;
  readonly it_portfolio_ref: string | null;
}

/**
 * How a contract<->application link was established. Not a DB column — this
 * is the app-tier classification the "review before calling it contract
 * scope" requirement demands. `unresolved` covers links whose method cannot
 * be determined from the export at hand.
 */
export type RelationshipMethod =
  | "explicit_contract_scope"
  | "explicit_sow_scope"
  | "reviewed_mapping"
  | "vendor_based_inference"
  | "name_based_inference"
  | "unresolved";

export interface RelationshipConfidence {
  readonly relationship_method: RelationshipMethod;
  /** 0-1, monotonic with relationship_method (explicit_* highest, unresolved lowest). */
  readonly relationship_confidence: number;
}

// ---------------------------------------------------------------------------
// source.contract_financial_exposure
// ---------------------------------------------------------------------------

export interface SourceContractFinancialExposureRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly contracted_annual_value: number | null;
  readonly total_committed_value: number | null;
  readonly committed_annual_spend: number | null;
  readonly actual_annual_spend: number | null;
  readonly linked_budget_amount: number | null;
  readonly linked_forecast_amount: number | null;
  readonly linked_actual_amount: number | null;
  readonly linked_committed_amount: number | null;
  readonly linked_budget_lines: number | null;
}

// ---------------------------------------------------------------------------
// source.contract_operational_performance
// ---------------------------------------------------------------------------

export interface SourceContractOperationalPerformanceRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly sla_summary: string | null;
  readonly scoped_application_count: number | null;
  readonly critical_application_count: number | null;
  readonly cloud_sev1_sev2_incidents: number | null;
  readonly avg_cloud_change_failure_rate: number | null;
  readonly service_credits_earned: number | null;
  readonly service_credits_claimed: number | null;
  readonly evidence_gap: boolean | string | null;
}

// ---------------------------------------------------------------------------
// Contract evidence detail package
//
// These rows are loaded from source-system extracts at business grain for a
// selected contract. The physical SkyHarbor canary tables currently use the
// `source.golden_contract_*` prefix, but the shape below is deliberately
// tenant-agnostic: every tenant can populate the same evidence classes from
// its own CLM, ERP/AP, ITSM, usage, sourcing, and finance systems.
// ---------------------------------------------------------------------------

export interface SourceContractEvidenceOverviewRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly dataset_version: string | null;
  readonly contract_id: string;
  readonly vendor_id: string | null;
  readonly vendor_name: string | null;
  readonly contract_name: string | null;
  readonly contract_archetype: string | null;
  readonly contract_english_overview: string | null;
  readonly business_functions_supported: string | null;
  readonly systems_services_supported: string | null;
  readonly annual_value_usd: number | null;
  readonly actual_annual_spend_usd: number | null;
  readonly total_committed_value_usd: number | null;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly notice_deadline: string | null;
  readonly notice_period_days: number | null;
  readonly auto_renew: boolean | string | null;
  readonly decision_owner_role_ref: string | null;
  readonly source_system: string | null;
  readonly source_system_examples: string | null;
  readonly source_file_report: string | null;
  readonly source_record_id: string | null;
  readonly extraction_grain: string | null;
  readonly refresh_frequency: string | null;
  readonly review_status: string | null;
}

export interface SourceContractEvidenceScopeRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly dataset_version: string | null;
  readonly contract_id: string;
  readonly vendor_id: string | null;
  readonly vendor_name: string | null;
  readonly application_ref: string | null;
  readonly application_name: string | null;
  readonly business_function: string | null;
  readonly criticality: string | null;
  readonly service_or_platform_component: string | null;
  readonly annual_run_cost_usd: number | null;
  readonly relationship_method: string | null;
  readonly relationship_confidence: number | null;
  readonly source_system: string | null;
  readonly source_system_examples: string | null;
  readonly source_record_id: string | null;
  readonly source_file_report: string | null;
  readonly extraction_grain: string | null;
  readonly refresh_frequency: string | null;
  readonly review_status: string | null;
}

export interface SourceContractEvidencePricingRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly dataset_version: string | null;
  readonly contract_id: string;
  readonly vendor_id: string | null;
  readonly vendor_name: string | null;
  readonly line_item_id: string | null;
  readonly sku_or_service_code: string | null;
  readonly line_item_description: string | null;
  readonly spend_driver: string | null;
  readonly quantity_or_commitment: number | string | null;
  readonly unit_of_measure: string | null;
  readonly unit_price_usd: number | null;
  readonly annual_value_usd: number | null;
  readonly evidence_source: string | null;
  readonly source_system: string | null;
  readonly source_system_examples: string | null;
  readonly source_record_id: string | null;
  readonly source_file_report: string | null;
  readonly extraction_grain: string | null;
  readonly refresh_frequency: string | null;
  readonly review_status: string | null;
}

export interface SourceContractEvidencePerformanceSummary {
  readonly contract_id: string;
  readonly dataset_version: string | null;
  readonly period_start: string | null;
  readonly period_end: string | null;
  readonly sla_months: number;
  readonly sev1_incidents: number;
  readonly sev2_incidents: number;
  readonly service_credits_earned_usd: number;
  readonly service_credits_claimed_usd: number;
  readonly service_credits_received_usd: number;
  readonly invoice_line_count: number;
  readonly invoice_exception_count: number;
  readonly invoice_exception_amount_usd: number;
  readonly rate_card_variance_usd: number;
  readonly recoverable_leakage_usd: number;
  readonly avoided_cost_usd: number;
  readonly negotiated_improvement_usd: number;
  readonly realized_value_usd: number;
  readonly source_systems: readonly string[];
  readonly refresh_frequency: string | null;
  readonly review_status: string | null;
}

export interface SourceContractPerformancePeriodRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly observation_id: string;
  readonly contract_id: string;
  readonly service_id: string | null;
  readonly metric_name: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly contracted_target: string | null;
  readonly actual_value: string | null;
  readonly value_num: number | null;
  readonly unit: string | null;
  readonly performance_state: string;
  readonly credit_state: string;
  readonly breach_count: number | null;
  readonly credit_eligible: boolean | null;
  readonly credit_calculated: number | null;
  readonly credit_claimed: number | null;
  readonly credit_recovered: number | null;
  readonly currency: string;
  readonly source_system: string | null;
  readonly source_record_id: string | null;
  readonly as_of_date: string | null;
  readonly quality_state: string | null;
  readonly evidence_reference: string | null;
  readonly load_run_id: string | null;
}

export interface SourceContractSpendMonthlyRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly observation_id: string;
  readonly contract_id: string;
  readonly service_id: string | null;
  readonly business_unit: string | null;
  readonly cost_center: string | null;
  readonly month: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly committed_amount: number | null;
  readonly invoice_amount: number | null;
  readonly paid_amount: number | null;
  readonly actual_spend: number | null;
  readonly currency: string;
  readonly source_system: string | null;
  readonly source_record_id: string | null;
  readonly as_of_date: string | null;
  readonly quality_state: string | null;
  readonly evidence_reference: string | null;
  readonly load_run_id: string | null;
}

// ---------------------------------------------------------------------------
// Deterministic Source impact layer
//
// These are Layer 4 product-substrate views generated from canonical Source
// facts and consumption views. They are not model output. They tell Source,
// Optimize, and aVa exactly which executive claims are allowed, which actions
// are only candidates, and which missing evidence blocks stronger language.
// ---------------------------------------------------------------------------

export interface SourceContractEvidenceCoverageRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly contract_name: string;
  readonly spend_rows: number;
  readonly actual_spend_usd: number;
  readonly committed_spend_usd: number;
  readonly performance_rows: number;
  readonly breach_rows: number;
  readonly credit_calculated_usd: number;
  readonly credit_claimed_usd: number;
  readonly credit_recovered_usd: number;
  readonly unclaimed_credit_usd: number;
  readonly opportunity_rows: number;
  readonly candidate_amount_usd: number;
  readonly finance_confirmation_required_rows: number;
  readonly opportunities_with_evidence: number;
  readonly scope_rows: number;
  readonly critical_scope_rows: number;
  readonly document_page_text_rows: number;
  readonly change_order_rows: number;
  readonly coverage_state:
    | "decision_ready"
    | "partial"
    | "blocked"
    | "not_loaded"
    | string;
  readonly blocker_if_missing: string | null;
  readonly evidence_basis_json: Record<string, unknown> | null;
  readonly load_run_id: string | null;
}

export interface SourceContractActionCandidateRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly action_candidate_id: string;
  readonly opportunity_id: string;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly title: string | null;
  readonly action_type: string | null;
  readonly opportunity_type: string | null;
  readonly finding_summary: string | null;
  readonly deterministic_basis: string | null;
  readonly candidate_amount_usd: number | null;
  readonly priority: string | null;
  readonly readiness_state: string | null;
  readonly evidence_state: string | null;
  readonly authority_state: string | null;
  readonly finance_confirmation_state: "confirmed" | "not_confirmed" | string;
  readonly next_action: string | null;
  readonly accountable_role: string | null;
  readonly decision_due_date: string | null;
  readonly coverage_state: string | null;
  readonly blocker_if_missing: string | null;
  readonly citation_basis_json: Record<string, unknown> | null;
  readonly load_run_id: string | null;
}

export interface SourceContractClaimCardRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly claim_card_id: string;
  readonly action_candidate_id: string;
  readonly opportunity_id: string;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly claim_title: string | null;
  readonly allowed_executive_statement: string;
  readonly blocker_if_missing: string | null;
  readonly candidate_amount_usd: number | null;
  readonly finance_confirmation_state: string;
  readonly readiness_state: string | null;
  readonly evidence_state: string | null;
  readonly citation_basis_json: Record<string, unknown> | null;
  readonly load_run_id: string | null;
}

export interface SourceVendorPositionRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly vendor_category: string | null;
  readonly contract_count: number;
  readonly annual_value: number | null;
  readonly total_committed_value: number | null;
  readonly auto_renew_contracts: number;
  readonly next_end_date: string | null;
  readonly contract_refs: readonly string[];
  readonly action_candidate_count: number;
  readonly candidate_amount_usd: number;
  readonly not_confirmed_count: number;
  readonly decision_ready_contracts: number;
  readonly unclaimed_credit_usd: number;
  readonly spend_rows: number;
  readonly performance_rows: number;
  readonly vendor_position_state: string;
  readonly load_run_id: string | null;
}

export interface SourcePageStorylineRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly page_key: string;
  readonly section_key: string;
  readonly sort_order: number;
  readonly headline: string;
  readonly allowed_executive_statement: string;
  readonly primary_metric_label: string;
  readonly primary_metric_value: string;
  readonly blocker_if_missing: string | null;
  readonly citation_basis_json: Record<string, unknown> | null;
}

export interface SourceAvaGroundingBundleRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly grounding_bundle_id: string;
  readonly page_key: string;
  readonly section_key: string;
  readonly question_family: string;
  readonly allowed_claims_json: readonly Record<string, unknown>[];
  readonly refusal_rules_json: readonly string[];
  readonly citation_sources_json: Record<string, unknown> | null;
  readonly load_run_id: string | null;
}

// ---------------------------------------------------------------------------
// source.contract_initiative_dependency
// ---------------------------------------------------------------------------

export interface SourceContractInitiativeDependencyRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly contract_id: string;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly initiative_ref: string;
  readonly initiative_project_name: string;
  readonly status: string | null;
  readonly target_end_date: string | null;
  readonly approved_budget: number | null;
  readonly expected_business_technology_value: string | null;
  readonly major_risk_constraint: string | null;
  readonly decision_needed: string | null;
}

// ---------------------------------------------------------------------------
// source.application_vendor_exposure
// ---------------------------------------------------------------------------

export interface SourceApplicationVendorExposureRow {
  readonly tenant_key: SkyHarborTenantKey;
  readonly application_ref: string;
  readonly application_name: string;
  readonly criticality: string | null;
  readonly lifecycle_status: string | null;
  readonly hosting_model: string | null;
  readonly vendor_ref: string;
  readonly vendor_name: string;
  readonly annual_run_cost: number | null;
  readonly contract_count: number;
  readonly contracted_annual_value: number | null;
  readonly risk_count: number | null;
}

// ---------------------------------------------------------------------------
// tower.metric_observation / tower.value_claim / tower.metric_provenance
//
// This is what "performance vs. entitlement" is computed against — Source
// must never assert an actual metric value itself, only join to these.
// ---------------------------------------------------------------------------

export type TowerQualityState =
  | "available"
  | "not_loaded"
  | "not_measured"
  | "withheld"
  | "conflicting"
  | "stale";
export type TowerEvidenceState =
  | "candidate"
  | "accepted"
  | "superseded"
  | "not_applicable";

export interface TowerMetricObservationRow {
  readonly observation_id: string;
  readonly tenant_key: SkyHarborTenantKey;
  readonly subject_ref: string;
  readonly metric_ref: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly scenario: string | null;
  readonly value_num: number | null;
  readonly value_text: string | null;
  readonly unit: string | null;
  readonly currency: string | null;
  readonly numerator: number | null;
  readonly denominator: number | null;
  readonly sample_size: number | null;
  readonly cohort_ref: string | null;
  readonly dimension_json: Record<string, unknown> | null;
  readonly provenance_id: string | null;
  readonly source_result_hash: string | null;
  readonly quality_state: TowerQualityState;
  readonly evidence_state: TowerEvidenceState;
  readonly observed_at: string;
  readonly stale_at: string | null;
}

export type TowerClaimState =
  | "draft"
  | "blocked"
  | "accepted"
  | "rejected"
  | string;

export interface TowerValueClaimRow {
  readonly claim_id: string;
  readonly tenant_key: SkyHarborTenantKey;
  readonly subject_ref: string;
  readonly outcome_metric_ref: string;
  readonly baseline_observation_id: string | null;
  readonly target_observation_id: string | null;
  readonly actual_observation_id: string | null;
  readonly promised_value: number | null;
  readonly calculated_value: number | null;
  readonly currency: string | null;
  readonly attribution_basis: string | null;
  readonly quality_guardrail_state: string | null;
  readonly risk_guardrail_state: string | null;
  readonly claim_state: TowerClaimState;
  readonly claim_rule_version: string | null;
  readonly claim_input_hash: string | null;
  readonly caveat: string | null;
  readonly blocked_reason: string | null;
  readonly next_gate: string | null;
  readonly next_gate_owner_role: string | null;
  readonly evaluated_at: string | null;
  readonly stale_at: string | null;
  readonly stale_reason: string | null;
}

export interface TowerMetricProvenanceRow {
  readonly provenance_id: string;
  readonly tenant_key: SkyHarborTenantKey;
  readonly source_system: string | null;
  readonly source_report: string | null;
  readonly source_schema: string | null;
  readonly source_table: string | null;
  readonly source_file_id: string | null;
  readonly source_row_pointer: string | null;
  readonly formula: string | null;
  readonly formula_version: string | null;
  readonly extraction_method: string | null;
  readonly historical_depth: string | null;
  readonly refresh_cadence: string | null;
  readonly last_refreshed: string | null;
  readonly known_limitations: string | null;
  readonly data_owner_role: string | null;
  readonly quality_score: number | null;
  readonly attestation_status: string | null;
}

// ---------------------------------------------------------------------------
// doc.* — evidence lineage, needed so a Source view can cite exact clause /
// row provenance rather than a bare table name.
// ---------------------------------------------------------------------------

export interface DocExtractionRow {
  readonly extraction_id: string;
  readonly tenant_key: SkyHarborTenantKey;
  readonly concept_ref: string;
  readonly subject_kind: string;
  readonly subject_ref: string;
  readonly value_text: string | null;
  readonly value_num: number | null;
  readonly confidence: number | null;
  readonly method: string | null;
  readonly review_state: string | null;
  readonly source_file_id: string | null;
  readonly source_page: number | null;
  readonly source_section: string | null;
  readonly extracted_at: string;
}

/**
 * A vendor whose contract(s) exist only as supplemental evidence — loaded
 * (or pending load) into doc.* for a specific demo/analysis, but NOT part
 * of the reconciled 28-vendor / 119-contract v3 register. Must be excluded
 * from every portfolio-level rollup (concentration, total annual value,
 * budget-reconciliation percentage) unless and until someone deliberately
 * crosswalks or replaces a v3 contract with it.
 *
 * Supplemental PDFs must still flow through doc.file/page/span/extraction;
 * they are excluded from portfolio totals until a reviewed crosswalk maps
 * them to source.contract_360. This constant is intentionally empty until
 * those supplemental vendors receive governed vendor_ref values.
 */
export const SUPPLEMENTAL_CONTRACT_VENDOR_REFS: ReadonlySet<string> = new Set([
  // 'crestline', 'nimbusworks', 'aerolake' — populate with real vendor_ref
  // values once these are loaded into doc.file and a vendor_ref is assigned.
]);
