/**
 * Nexus Pricing Engine — PR2 typed access layer.
 *
 * Hand-written types mirroring the `pricing_*` tables created by
 * `supabase/migrations/20260723233000_pricing_reference_schema_v1.sql` and
 * `20260723234500_pricing_rate_cards_client_profiles_v1.sql`.
 *
 * This repo has no DB-type-generation convention (no `supabase gen types` /
 * codegen script in `package.json`; the closest precedent,
 * `src/lib/programs/types.db.ts`, is also hand-written and hand-maintained
 * alongside its migrations) — these types follow that same hand-written
 * convention, snake_case field names matching the physical columns exactly,
 * so a row read via `azureRead` can be typed with no transform step.
 */

// ---------------------------------------------------------------------------
// Shared scope/status vocabularies
// ---------------------------------------------------------------------------

export type PricingRecordStatus = "active" | "retired" | "superseded" | "deprecated";
export type PricingVersionStatus = "draft" | "approved" | "superseded";
export type PricingRateCardScopeType = "global" | "client" | "move_exception";
export type PricingSnapshotStatus =
  | "draft"
  | "approved"
  | "superseded"
  | "stale_for_current_scope";

// ---------------------------------------------------------------------------
// Version registries
// ---------------------------------------------------------------------------

export interface PricingTaxonomyVersionRow {
  id: string;
  version: number;
  generated_from: string;
  source_sha256: string;
  content_hash: string;
  status: "active" | "superseded";
  is_current: boolean;
  tenant_key: string | null;
  created_at: string;
}

export interface PricingModelVersionRow {
  id: string;
  version: number;
  description: string | null;
  status: "draft" | "active" | "superseded";
  is_current: boolean;
  tenant_key: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Reference / taxonomy tables (brief §8.1)
// ---------------------------------------------------------------------------

export interface PricingTowerRow {
  id: string;
  taxonomy_version: number;
  tower_code: string;
  tower_name: string;
  scope: string | null;
  source_artifact: string | null;
  source_row: number | null;
  source_label: string | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingCapabilityRow {
  id: string;
  taxonomy_version: number;
  capability_code: string;
  tower_code: string;
  capability_name: string;
  scarcity_tier: string | null;
  agent_amenability: number | null;
  source_artifact: string | null;
  source_row: number | null;
  source_label: string | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingRoleFamilyRow {
  id: string;
  taxonomy_version: number;
  role_family_code: string;
  tower_code: string;
  capability_code: string;
  family_name: string;
  source_artifact: string | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingSeniorityLevelRow {
  id: string;
  taxonomy_version: number;
  level_code: string;
  level_name: string;
  rank: number;
  years_exp: string | null;
  expectation: string | null;
  source_artifact: string | null;
  source_row: number | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingRoleRow {
  id: string;
  taxonomy_version: number;
  role_code: string;
  canonical_name: string;
  tower_code: string;
  capability_code: string;
  role_family_code: string;
  role_type: string;
  allowed_level_min: string;
  allowed_level_max: string;
  default_rate_band_code: string | null;
  internal_external_default: string | null;
  billable_default: boolean;
  source_artifact: string | null;
  source_row: number | null;
  source_label: string | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingRoleAliasRow {
  id: string;
  taxonomy_version: number;
  alias_code: string;
  role_code: string;
  alias_label: string;
  normalized_alias: string;
  alias_type: string;
  tenant_key: string | null;
  provider_scope: string | null;
  source_artifact: string | null;
  source_row: number | null;
  status: string;
  content_hash: string;
  created_at: string;
}

export interface PricingProviderLevelAliasRow {
  id: string;
  tenant_key: string | null;
  provider_class_code: string;
  level_code: string;
  alias_label: string;
  normalized_alias: string;
  status: string;
  version: number;
  is_current: boolean;
  content_hash: string;
  created_at: string;
}

export interface PricingRateBandRow {
  id: string;
  taxonomy_version: number;
  rate_band_code: string;
  role_code: string;
  level_code: string;
  currency: string;
  rate_basis: string;
  rate_unit: string;
  loaded_rate: number | null;
  scarcity_adj_rate: number | null;
  indicative_bill_rate: number | null;
  valid_from: string;
  source: string | null;
  confidence: string | null;
  approval_status: string | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingProviderClassRow {
  id: string;
  taxonomy_version: number;
  provider_class_code: string;
  class_name: string;
  archetype_label: string | null;
  tier_multiplier: number;
  source_artifact: string | null;
  source_row: number | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingProviderRow {
  id: string;
  tenant_key: string | null;
  provider_code: string;
  provider_name: string;
  provider_class_code: string | null;
  status: string;
  version: number;
  is_current: boolean;
  content_hash: string;
  created_at: string;
}

export interface PricingDeliveryLocationRow {
  id: string;
  taxonomy_version: number;
  location_code: string;
  region_name: string;
  shore_category: string;
  salary_multiplier: number;
  rate_multiplier: number;
  scarcity_multiplier: number;
  cost_of_living_index: number | null;
  source_artifact: string | null;
  source_row: number | null;
  status: string;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Rate cards / client profiles (brief §8.2)
// ---------------------------------------------------------------------------

export interface PricingRateCardRow {
  id: string;
  scope_type: PricingRateCardScopeType;
  tenant_key: string | null;
  move_id: string | null;
  card_code: string;
  parent_rate_card_id: string | null;
  version: number;
  is_current: boolean;
  content_hash: string;
  status: PricingVersionStatus;
  approved_by: string | null;
  approved_at: string | null;
  approval_rationale: string | null;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
}

export interface PricingRateCardLineRow {
  id: string;
  card_version_id: string;
  role_or_band_ref: string;
  level: string | null;
  provider_ref: string | null;
  location_ref: string | null;
  rate_basis: string;
  unit: string;
  rate_value: number;
  currency: string;
  valid_from: string;
  valid_to: string | null;
  tenant_key: string | null;
  content_hash: string;
  created_at: string;
}

export interface PricingClientProfileRow {
  id: string;
  tenant_key: string;
  profile_version: number;
  is_current: boolean;
  content_hash: string;
  status: PricingVersionStatus;
  approved_by: string | null;
  approved_at: string | null;
  approval_rationale: string | null;
  created_at: string;
}

export interface PricingClientProfileValueRow {
  id: string;
  profile_id: string;
  tenant_key: string;
  profile_version: number;
  assumption_key: string;
  assumption_value: unknown;
  content_hash: string;
  created_at: string;
}

export interface PricingTechnologyCostDefaultRow {
  id: string;
  tenant_key: string | null;
  version: number;
  is_current: boolean;
  content_hash: string;
  cost_key: string;
  cost_value: number;
  unit: string;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Immutable snapshot skeleton (brief §8.3)
// ---------------------------------------------------------------------------

export interface PricingEstimateSnapshotRow {
  id: string;
  tenant_key: string;
  move_id: string;
  model_version: number | null;
  taxonomy_version: number | null;
  rate_card_version_id: string | null;
  client_profile_version_id: string | null;
  upstream_scope_fingerprint: string;
  totals: Record<string, unknown>;
  status: PricingSnapshotStatus;
  approved_by: string | null;
  approved_at: string | null;
  approval_rationale: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// PR5 Moves Cost & Effort estimate workflow (brief §8.3/§8.4) — mirrors
// `20260724010000_pricing_estimates_moves_workflow_v1.sql`. See that
// migration's header for the "no separate pricing_estimate_scenarios table"
// judgment call and the draft-mutability / replace-on-rerun conventions.
// ---------------------------------------------------------------------------

export type PricingEstimateInputSourceType =
  | "move_context"
  | "client_profile"
  | "global_default"
  | "client_input"
  | "override";

export type PricingEstimateInputConfidence = "low" | "medium" | "high";

export interface PricingEstimateRow {
  id: string;
  tenant_key: string;
  move_id: string;
  scenario_group_id: string;
  scenario_name: string;
  scenario_key: string;
  archetype_code: string;
  model_version: number;
  currency: string;
  target_start_date: string | null;
  target_duration_weeks: number | null;
  selected_rate_card_id: string | null;
  status: PricingSnapshotStatus;
  last_run_id: string | null;
  last_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingEstimateInputRow {
  id: string;
  estimate_id: string;
  input_key: string;
  value: unknown;
  unit: string | null;
  required: boolean;
  source_type: PricingEstimateInputSourceType;
  source_ref: string | null;
  confidence: PricingEstimateInputConfidence | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  override_reason: string | null;
  model_version: number | null;
  created_at: string;
  updated_at: string;
}

export interface PricingEstimateLineItemRow {
  id: string;
  estimate_id: string;
  tenant_key: string;
  run_id: string;
  archetype_code: string;
  activity_pack_code: string;
  activity_pack_name: string;
  category: "technical" | "shared_nontechnical";
  rule_code: string;
  operation: string;
  driver_code: string | null;
  driver_quantity: number | null;
  model_version: number;
  scenario_key: string;
  classification: string;
  shared_cost_ref: string | null;
  role_code: string | null;
  allocation_pct: number | null;
  raw_hours: number | null;
  complexity_factor: number | null;
  novelty_factor: number | null;
  assurance_factor: number | null;
  scenario_factor: number | null;
  expected_hours: number | null;
  role_hours: number | null;
  rate_resolved_from_scope: string | null;
  rate_hourly_cents: number | null;
  rate_currency: string | null;
  rate_card_version_id: string | null;
  labor_cost_cents: number | null;
  manual_cost_cents: number | null;
  gap_reason: string | null;
  override_rationale: string | null;
  formula_trace: string;
  created_at: string;
}
