// ─────────────────────────────────────────────────────────────────────────────
// Read adapter for the new cross-domain SkyHarbor schema (source.*, tower.*,
// doc.*). Azure Postgres only — these schemas have no Supabase/public-schema
// legacy equivalent, so unlike most `read-adapters/*ReadAdapter.ts` files this
// has no dual-plane switch.
//
// `postgresCompat.ts`'s fluent `.from()` cannot address a non-public schema
// (`schema()` is currently a no-op passthrough), so every query here goes
// through `azureRead.query()` with hand-written, schema-qualified,
// parameterized SQL. `missingTable: 'empty'` is used throughout so a query
// against a table that hasn't been created in a given environment degrades
// to an empty result instead of throwing — appropriate for a schema that, as
// of this writing, is not yet represented in this repo's tracked migrations.
// ─────────────────────────────────────────────────────────────────────────────

import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  DocExtractionRow,
  SourceApplicationVendorExposureRow,
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractFinancialExposureRow,
  SourceContractInitiativeDependencyRow,
  SourceContractOperationalPerformanceRow,
  SourceContractVendor360Row,
  SourceVendorContractPortfolioRow,
  TowerMetricObservationRow,
  TowerMetricProvenanceRow,
  TowerValueClaimRow,
} from "./types";

const MISSING_TABLE_EMPTY = { missingTable: "empty" as const };

/**
 * Known tenant_key spellings for the same real-world SkyHarbor tenant across
 * different parts of this codebase. The app resolves the active client key
 * as `skyharbor` or `skyharbor-air` (see src/lib/client-config.ts and the
 * contract-optimization load script's DEFAULT_TENANT_KEY), but the source,
 * tower, and doc schemas were verified against a real export under
 * `tenant_key = 'skyharbor_global'` (see types.ts header). Querying by exact
 * match on whichever spelling the caller happens to have produces a silent,
 * honest-looking empty result — not an error — so this alias resolution is
 * required, not optional, for this data model to ever return real rows.
 */
const SKYHARBOR_TENANT_ALIASES: readonly string[] = [
  "skyharbor",
  "skyharbor-air",
  "skyharbor_global",
];

function tenantKeyAliases(tenantKey: string): string[] {
  const normalized = tenantKey.trim().toLowerCase();
  if (!SKYHARBOR_TENANT_ALIASES.includes(normalized)) return [normalized];
  return [...SKYHARBOR_TENANT_ALIASES];
}

export async function listContractVendor360(
  tenantKey: string,
): Promise<SourceContractVendor360Row[]> {
  return azureRead.query<SourceContractVendor360Row>(
    "SELECT * FROM source.contract_vendor_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listContract360(
  tenantKey: string,
): Promise<SourceContract360Row[]> {
  return azureRead.query<SourceContract360Row>(
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function getContract360(
  tenantKey: string,
  contractId: string,
): Promise<SourceContract360Row | null> {
  const rows = await azureRead.query<SourceContract360Row>(
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 LIMIT 1",
    [tenantKeyAliases(tenantKey), contractId],
    MISSING_TABLE_EMPTY,
  );
  return rows[0] ?? null;
}

export async function listVendorContractPortfolio(
  tenantKey: string,
): Promise<SourceVendorContractPortfolioRow[]> {
  return azureRead.query<SourceVendorContractPortfolioRow>(
    "SELECT * FROM source.vendor_contract_portfolio WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listContractApplicationScope(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractApplicationScopeRow[]> {
  if (contractId) {
    return azureRead.query<SourceContractApplicationScopeRow>(
      "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [tenantKeyAliases(tenantKey), contractId],
      MISSING_TABLE_EMPTY,
    );
  }
  return azureRead.query<SourceContractApplicationScopeRow>(
    "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[])",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listContractFinancialExposure(
  tenantKey: string,
): Promise<SourceContractFinancialExposureRow[]> {
  return azureRead.query<SourceContractFinancialExposureRow>(
    "SELECT * FROM source.contract_financial_exposure WHERE tenant_key = ANY($1::text[])",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listContractOperationalPerformance(
  tenantKey: string,
): Promise<SourceContractOperationalPerformanceRow[]> {
  return azureRead.query<SourceContractOperationalPerformanceRow>(
    "SELECT * FROM source.contract_operational_performance WHERE tenant_key = ANY($1::text[])",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listContractInitiativeDependency(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractInitiativeDependencyRow[]> {
  if (contractId) {
    return azureRead.query<SourceContractInitiativeDependencyRow>(
      "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [tenantKeyAliases(tenantKey), contractId],
      MISSING_TABLE_EMPTY,
    );
  }
  return azureRead.query<SourceContractInitiativeDependencyRow>(
    "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[])",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

export async function listApplicationVendorExposure(
  tenantKey: string,
): Promise<SourceApplicationVendorExposureRow[]> {
  return azureRead.query<SourceApplicationVendorExposureRow>(
    "SELECT * FROM source.application_vendor_exposure WHERE tenant_key = ANY($1::text[])",
    [tenantKeyAliases(tenantKey)],
    MISSING_TABLE_EMPTY,
  );
}

/**
 * Tower metric observations for a set of subject_refs (contract_id and/or
 * vendor_ref — Tower's subject_ref is a free-text key, so callers pass
 * whatever refs they need overlaid). Returns the newest observation per
 * (subject_ref, metric_ref) by period_end — callers needing full history
 * should query tower.metric_observation directly.
 */
export async function listLatestTowerObservationsForSubjects(
  tenantKey: string,
  subjectRefs: readonly string[],
): Promise<TowerMetricObservationRow[]> {
  if (subjectRefs.length === 0) return [];
  return azureRead.query<TowerMetricObservationRow>(
    `SELECT DISTINCT ON (subject_ref, metric_ref) *
       FROM tower.metric_observation
      WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2)
      ORDER BY subject_ref, metric_ref, period_end DESC`,
    [tenantKeyAliases(tenantKey), subjectRefs],
    MISSING_TABLE_EMPTY,
  );
}

export async function listTowerValueClaimsForSubjects(
  tenantKey: string,
  subjectRefs: readonly string[],
): Promise<TowerValueClaimRow[]> {
  if (subjectRefs.length === 0) return [];
  return azureRead.query<TowerValueClaimRow>(
    "SELECT * FROM tower.value_claim WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2) ORDER BY evaluated_at DESC NULLS LAST",
    [tenantKeyAliases(tenantKey), subjectRefs],
    MISSING_TABLE_EMPTY,
  );
}

export async function listTowerMetricProvenance(
  tenantKey: string,
  provenanceIds: readonly string[],
): Promise<TowerMetricProvenanceRow[]> {
  if (provenanceIds.length === 0) return [];
  return azureRead.query<TowerMetricProvenanceRow>(
    "SELECT * FROM tower.metric_provenance WHERE tenant_key = ANY($1::text[]) AND provenance_id = ANY($2)",
    [tenantKeyAliases(tenantKey), provenanceIds],
    MISSING_TABLE_EMPTY,
  );
}

/** doc.extraction rows backing a concept_ref — for exact clause/row citation. */
export async function listDocExtractionsForSubject(
  tenantKey: string,
  subjectRef: string,
): Promise<DocExtractionRow[]> {
  return azureRead.query<DocExtractionRow>(
    "SELECT * FROM doc.extraction WHERE tenant_key = ANY($1::text[]) AND subject_ref = $2 ORDER BY extracted_at DESC",
    [tenantKeyAliases(tenantKey), subjectRef],
    MISSING_TABLE_EMPTY,
  );
}
