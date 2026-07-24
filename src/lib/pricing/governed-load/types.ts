/**
 * Nexus Pricing Engine — PR3 governed-load pipeline shared types.
 *
 * See `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 and the PR3
 * execution prompt for why this is a NEW, independent pipeline (structurally
 * modeled on `src/lib/context-ingestion/`'s parse -> validate -> preview ->
 * approve -> commit shape) rather than a literal registration into
 * `template-registry.ts` / `buildValidatedAgentContextBundle` — rate cards
 * and pricing profiles are explicitly NOT enterprise-context facts
 * (`rate-card-templates.ts`'s own header comment, quoted in the audit).
 */

// ---------------------------------------------------------------------------
// Row-level error reporting (brief: "show me every problem row at once")
// ---------------------------------------------------------------------------

export interface RowError {
  /** 1-indexed against the data rows (the header is not counted; the first
   * data row is `rowNumber: 1`), so it lines up with what an operator sees
   * when they open the CSV in a spreadsheet and count past the header. */
  rowNumber: number;
  field?: string;
  code: string;
  message: string;
}

export interface ParseResult<T> {
  rows: T[];
  errors: RowError[];
}

// ---------------------------------------------------------------------------
// Client rate card CSV row (client_rate_card.template.csv)
// ---------------------------------------------------------------------------

export interface ClientRateCardCsvRow {
  rowNumber: number;
  roleOrBandRef: string;
  level: string | null;
  providerRef: string | null;
  locationRef: string | null;
  rateBasis: string;
  unit: string;
  rateValue: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
}

// ---------------------------------------------------------------------------
// Client pricing profile CSV row (client_pricing_profile.template.csv)
// ---------------------------------------------------------------------------

export interface ClientPricingProfileCsvRow {
  rowNumber: number;
  assumptionKey: string;
  assumptionValue: unknown;
  unitHint: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Client role alias CSV row (client_role_aliases.template.csv, optional)
// ---------------------------------------------------------------------------

export interface ClientRoleAliasCsvRow {
  rowNumber: number;
  aliasLabel: string;
  roleCode: string;
  aliasType: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Client technology cost CSV row (client_technology_costs.template.csv, optional)
// ---------------------------------------------------------------------------

export interface ClientTechnologyCostCsvRow {
  rowNumber: number;
  costKey: string;
  costValue: number;
  unit: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Diff preview (added / changed / unchanged / removed)
// ---------------------------------------------------------------------------

export interface DiffLineSummary {
  identityKey: string;
  roleOrBandRef: string;
  level: string | null;
  providerRef: string | null;
  locationRef: string | null;
  rateBasis: string;
  unit: string;
  rateValue: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
}

export interface RateCardDiff {
  added: DiffLineSummary[];
  changed: { before: DiffLineSummary; after: DiffLineSummary }[];
  unchanged: DiffLineSummary[];
  removed: DiffLineSummary[];
}

// ---------------------------------------------------------------------------
// Coverage report
// ---------------------------------------------------------------------------

export interface RoleCoverageEntry {
  roleCode: string;
  canonicalName: string;
  towerCode: string;
  /** Only present for direct/inherited entries — what actually resolved the rate. */
  resolvedVia?: "client_rate_card_line" | "global_rate_card_line" | "rate_band_default";
}

export interface RateCardCoverageReport {
  tenantKey: string;
  taxonomyVersion: number;
  totalRoles: number;
  direct: { count: number; roles: RoleCoverageEntry[] };
  inherited: { count: number; roles: RoleCoverageEntry[] };
  missing: { count: number; roles: RoleCoverageEntry[] };
  /** (direct + inherited) / total, rounded to 1 decimal place. */
  coveragePct: number;
}

// ---------------------------------------------------------------------------
// Governed projection (brief §6.1/6.7) — safe summary only, no raw lines.
// ---------------------------------------------------------------------------

export interface GovernedPricingProjection {
  tenantKey: string;
  rateCard: {
    cardCode: string;
    version: number;
    status: string;
    effectiveFrom: string | null;
    effectiveTo: string | null;
  } | null;
  coveragePct: number;
  unresolvedGapCount: number;
  clientProfile: { version: number; status: string } | null;
  modelVersion: number | null;
  taxonomyVersion: number | null;
  generatedAt: string;
}
