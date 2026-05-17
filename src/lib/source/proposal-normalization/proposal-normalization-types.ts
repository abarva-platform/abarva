// Slice 1.4 — Proposal normalization matrix
//
// Types for normalizing raw vendor proposal responses into one decision-grade
// comparison matrix. Distinct from `pricing-normalization` (which is purely
// cost/commercial): this model normalizes the *qualitative* terms an unwary
// buyer would miss — scope exceptions, assumptions, rates, accelerators, IP,
// security posture, transition approach, and SLAs/XLAs.
//
// Standalone module. Does not import from or modify any shared Source file.

/** The eight proposal dimensions Source normalizes for apples-to-apples comparison. */
export type ProposalDimensionKey =
  | 'scope_exceptions'
  | 'assumptions'
  | 'rates'
  | 'accelerators'
  | 'ip_terms'
  | 'security_posture'
  | 'transition_approach'
  | 'sla_xla';

/** Per-vendor stance on a single dimension after normalization. */
export type ProposalDimensionStance =
  | 'favorable' // terms protect the buyer / exceed baseline
  | 'standard' // terms are at the expected market baseline
  | 'unfavorable' // terms shift cost or risk onto the buyer
  | 'undisclosed'; // vendor did not respond to this dimension

/** How comparable a vendor's overall proposal is once normalized. */
export type ProposalComparability =
  | 'comparable'
  | 'partially_comparable'
  | 'not_comparable';

/** How divergent vendors are on one dimension — the buyer-risk signal. */
export type DimensionDivergence =
  | 'aligned' // all vendors land at the same stance
  | 'minor' // a single stance step of spread
  | 'material' // a stance gap a buyer would miss without normalization
  | 'undisclosed_gap'; // at least one vendor left the dimension blank

// ── Raw input ────────────────────────────────────────────────────────────────

/** One vendor's raw response on a single proposal dimension. */
export interface RawProposalDimension {
  key: ProposalDimensionKey;
  /** Free-text vendor language as submitted; empty/blank means undisclosed. */
  statement?: string;
  /** Quantified buyer-cost or buyer-risk exposure in USD, if estimable. */
  exposureUsd?: number;
  /** Vendor-attached caveats that qualify the statement. */
  caveats?: string[];
}

/** A single raw vendor proposal as submitted to the sourcing event. */
export interface RawVendorProposal {
  vendorId: string;
  vendorName: string;
  dimensions: RawProposalDimension[];
}

export interface ProposalNormalizationInput {
  eventId: string;
  eventName: string;
  stage: string;
  proposals: RawVendorProposal[];
  generatedAt?: string;
}

// ── Normalized output ────────────────────────────────────────────────────────

/** One vendor's normalized position on one dimension. */
export interface NormalizedDimensionCell {
  vendorId: string;
  vendorName: string;
  key: ProposalDimensionKey;
  stance: ProposalDimensionStance;
  /** Plain-language normalized restatement of the vendor's term. */
  normalizedStatement: string;
  exposureUsd: number;
  caveatCount: number;
  /** Whether the vendor actually answered this dimension. */
  disclosed: boolean;
}

/** A full row of the matrix — one dimension across every vendor. */
export interface NormalizedDimensionRow {
  key: ProposalDimensionKey;
  label: string;
  divergence: DimensionDivergence;
  cells: NormalizedDimensionCell[];
  /** Lowest-exposure (best) and highest-exposure (worst) vendor on this row. */
  bestVendorId: string | null;
  worstVendorId: string | null;
  /** USD spread between best and worst — the buyer-blind-spot magnitude. */
  exposureSpreadUsd: number;
  /** Expert callout when the row hides a trap a buyer would miss. */
  buyerBlindSpot: string | null;
}

/** Per-vendor roll-up across all dimensions. */
export interface VendorProposalSummary {
  vendorId: string;
  vendorName: string;
  comparability: ProposalComparability;
  disclosedDimensions: number;
  undisclosedDimensions: number;
  unfavorableDimensions: number;
  totalExposureUsd: number;
  rationale: string[];
}

export interface ProposalNormalizationSummary {
  totalVendors: number;
  totalDimensions: number;
  comparableVendors: number;
  materialDivergenceRows: number;
  undisclosedGapRows: number;
  totalExposureSpreadUsd: number;
}

export interface ProposalNormalizationMatrix {
  eventId: string;
  eventName: string;
  stage: string;
  generatedAt: string;
  rows: NormalizedDimensionRow[];
  vendorSummaries: VendorProposalSummary[];
  summary: ProposalNormalizationSummary;
  /** Ordered, highest-impact things a buyer must not miss. */
  buyerBlindSpots: string[];
  recommendedNextAction: string;
}
