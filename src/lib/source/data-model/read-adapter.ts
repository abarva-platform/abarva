// ─────────────────────────────────────────────────────────────────────────────
// Read adapter for the new cross-domain SkyHarbor schema (source.*, tower.*,
// doc.*). Azure Postgres only — these schemas have no Supabase/public-schema
// legacy equivalent, so unlike most `read-adapters/*ReadAdapter.ts` files this
// has no dual-plane switch.
//
// `postgresCompat.ts`'s fluent `.from()` cannot address a non-public schema
// (`schema()` is currently a no-op passthrough), so every query here goes
// through a session-scoped SQL runner with hand-written, schema-qualified,
// parameterized SQL. The session sets `app.tenant_key` before querying because
// the Source/Tower/doc tables are RLS-protected; without that setting, a valid
// tenant can appear to have no rows even after the live load succeeds.
// ─────────────────────────────────────────────────────────────────────────────

import { azureRead } from "@/lib/data-plane/azureRead";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";
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

/**
 * Resolve tenant aliases through the shared tenant service. Source data-model
 * readers must not carry tenant-specific alias lists because the same contract
 * optimization capability has to run for every tenant over the same evidence
 * classes. Unknown tenants intentionally pass through as exact keys.
 */
function tenantKeyAliases(tenantKey: string): string[] {
  return tenantAliasesFor(tenantKey);
}

function tenantRlsKey(tenantKey: string): string {
  return canonicalTenantKey(tenantKey);
}

async function queryForTenant<R>(
  tenantKey: string,
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  const aliases = tenantKeyAliases(tenantKey);
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [
      tenantRlsKey(tenantKey),
    ]);
    return run(sql, [aliases, ...params]);
  });
}

export async function listContractVendor360(
  tenantKey: string,
): Promise<SourceContractVendor360Row[]> {
  return queryForTenant<SourceContractVendor360Row>(
    tenantKey,
    "SELECT * FROM source.contract_vendor_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function listContract360(
  tenantKey: string,
): Promise<SourceContract360Row[]> {
  return queryForTenant<SourceContract360Row>(
    tenantKey,
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function getContract360(
  tenantKey: string,
  contractId: string,
): Promise<SourceContract360Row | null> {
  const rows = await queryForTenant<SourceContract360Row>(
    tenantKey,
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 LIMIT 1",
    [contractId],
  );
  return rows[0] ?? null;
}

export async function listVendorContractPortfolio(
  tenantKey: string,
): Promise<SourceVendorContractPortfolioRow[]> {
  return queryForTenant<SourceVendorContractPortfolioRow>(
    tenantKey,
    "SELECT * FROM source.vendor_contract_portfolio WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function listContractApplicationScope(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractApplicationScopeRow[]> {
  if (contractId) {
    return queryForTenant<SourceContractApplicationScopeRow>(
      tenantKey,
      "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [contractId],
    );
  }
  return queryForTenant<SourceContractApplicationScopeRow>(
    tenantKey,
    "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractFinancialExposure(
  tenantKey: string,
): Promise<SourceContractFinancialExposureRow[]> {
  return queryForTenant<SourceContractFinancialExposureRow>(
    tenantKey,
    "SELECT * FROM source.contract_financial_exposure WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractOperationalPerformance(
  tenantKey: string,
): Promise<SourceContractOperationalPerformanceRow[]> {
  return queryForTenant<SourceContractOperationalPerformanceRow>(
    tenantKey,
    "SELECT * FROM source.contract_operational_performance WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractInitiativeDependency(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractInitiativeDependencyRow[]> {
  if (contractId) {
    return queryForTenant<SourceContractInitiativeDependencyRow>(
      tenantKey,
      "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [contractId],
    );
  }
  return queryForTenant<SourceContractInitiativeDependencyRow>(
    tenantKey,
    "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listApplicationVendorExposure(
  tenantKey: string,
): Promise<SourceApplicationVendorExposureRow[]> {
  return queryForTenant<SourceApplicationVendorExposureRow>(
    tenantKey,
    "SELECT * FROM source.application_vendor_exposure WHERE tenant_key = ANY($1::text[])",
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
  return queryForTenant<TowerMetricObservationRow>(
    tenantKey,
    `SELECT DISTINCT ON (subject_ref, metric_ref) *
       FROM tower.metric_observation
      WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2)
      ORDER BY subject_ref, metric_ref, period_end DESC`,
    [subjectRefs],
  );
}

export async function listTowerValueClaimsForSubjects(
  tenantKey: string,
  subjectRefs: readonly string[],
): Promise<TowerValueClaimRow[]> {
  if (subjectRefs.length === 0) return [];
  return queryForTenant<TowerValueClaimRow>(
    tenantKey,
    "SELECT * FROM tower.value_claim WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2) ORDER BY evaluated_at DESC NULLS LAST",
    [subjectRefs],
  );
}

export async function listTowerMetricProvenance(
  tenantKey: string,
  provenanceIds: readonly string[],
): Promise<TowerMetricProvenanceRow[]> {
  if (provenanceIds.length === 0) return [];
  return queryForTenant<TowerMetricProvenanceRow>(
    tenantKey,
    "SELECT * FROM tower.metric_provenance WHERE tenant_key = ANY($1::text[]) AND provenance_id = ANY($2)",
    [provenanceIds],
  );
}

/** doc.extraction rows backing a concept_ref — for exact clause/row citation. */
export async function listDocExtractionsForSubject(
  tenantKey: string,
  subjectRef: string,
): Promise<DocExtractionRow[]> {
  return queryForTenant<DocExtractionRow>(
    tenantKey,
    "SELECT * FROM doc.extraction WHERE tenant_key = ANY($1::text[]) AND subject_ref = $2 ORDER BY extracted_at DESC",
    [subjectRef],
  );
}
