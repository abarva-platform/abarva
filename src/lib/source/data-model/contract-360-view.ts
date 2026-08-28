// ─────────────────────────────────────────────────────────────────────────────
// View-model for the Contract 360 detail page (drill-down from Vendor &
// Contract Portfolio). Combines source.contract_360 with its financial
// exposure, operational performance, initiative dependency, and
// confidence-tiered application scope rows, plus a Tower performance/value
// overlay keyed by the same subject_refs (contract_id, vendor_ref, and every
// application_ref in scope).
//
// Same honesty rule as vendor-portfolio-view.ts: this module only formats and
// tiers what the read-adapter returned. It never invents a number, and it
// never upgrades an application-scope row's confidence tier beyond what the
// caller-supplied explicitApplicationPairs set actually proves.
// ─────────────────────────────────────────────────────────────────────────────

import {
  tierApplicationScopeByConfidence,
  type ApplicationScopeConfidenceTiers,
} from "./vendor-contract-portfolio";
import type { ContractOptimizationEvidencePack } from "./contract-optimization-evidence";
import type { ContractOptimizationOpportunitySet } from "./contract-optimization-opportunity";
import type {
  DocExtractionRow,
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractEvidenceOverviewRow,
  SourceContractEvidencePerformanceSummary,
  SourceContractEvidencePricingRow,
  SourceContractEvidenceScopeRow,
  SourceContractFinancialExposureRow,
  SourceContractInitiativeDependencyRow,
  SourceContractOperationalPerformanceRow,
  SourceContractPerformancePeriodRow,
  SourceContractSpendMonthlyRow,
  TowerMetricObservationRow,
  TowerValueClaimRow,
} from "./types";

export interface Contract360View {
  readonly contract: SourceContract360Row;
  readonly financialExposure: SourceContractFinancialExposureRow | null;
  readonly operationalPerformance: SourceContractOperationalPerformanceRow | null;
  readonly initiativeDependencies: readonly SourceContractInitiativeDependencyRow[];
  readonly scopeTiers: ApplicationScopeConfidenceTiers;
  readonly towerObservations: readonly TowerMetricObservationRow[];
  readonly towerValueClaims: readonly TowerValueClaimRow[];
  readonly hasTowerOverlay: boolean;
  /** doc.extraction rows citing this contract or its vendor — exact clause/row provenance. */
  readonly docExtractions: readonly DocExtractionRow[];
  /** Shared four-ledger optimization evidence, if governed system/document rows exist. */
  readonly optimizationEvidence: ContractOptimizationEvidencePack | null;
  /** Atomic opportunity spine and governed calculation/evidence detail. */
  readonly optimizationOpportunitySet: ContractOptimizationOpportunitySet | null;
  /** Contract evidence detail package: source-system extracts at business grain. */
  readonly evidenceOverview: SourceContractEvidenceOverviewRow | null;
  readonly evidenceScope: readonly SourceContractEvidenceScopeRow[];
  readonly evidencePricing: readonly SourceContractEvidencePricingRow[];
  readonly evidencePerformance: SourceContractEvidencePerformanceSummary | null;
  readonly performancePeriods: readonly SourceContractPerformancePeriodRow[];
  readonly spendMonths: readonly SourceContractSpendMonthlyRow[];
}

export interface BuildContract360ViewInput {
  readonly contract: SourceContract360Row;
  readonly applicationScope: readonly SourceContractApplicationScopeRow[];
  readonly financialExposure: readonly SourceContractFinancialExposureRow[];
  readonly operationalPerformance: readonly SourceContractOperationalPerformanceRow[];
  readonly initiativeDependencies: readonly SourceContractInitiativeDependencyRow[];
  readonly towerObservations: readonly TowerMetricObservationRow[];
  readonly towerValueClaims: readonly TowerValueClaimRow[];
  readonly docExtractions?: readonly DocExtractionRow[];
  readonly optimizationEvidence?: ContractOptimizationEvidencePack | null;
  readonly optimizationOpportunitySet?: ContractOptimizationOpportunitySet | null;
  readonly evidenceOverview?: SourceContractEvidenceOverviewRow | null;
  readonly evidenceScope?: readonly SourceContractEvidenceScopeRow[];
  readonly evidencePricing?: readonly SourceContractEvidencePricingRow[];
  readonly evidencePerformance?: SourceContractEvidencePerformanceSummary | null;
  readonly performancePeriods?: readonly SourceContractPerformancePeriodRow[];
  readonly spendMonths?: readonly SourceContractSpendMonthlyRow[];
  /** (contract_id, application_ref) pairs proven by an actual SOW/contract-scope reference. */
  readonly explicitApplicationPairs?: ReadonlySet<string>;
}

export function buildContract360View(
  input: BuildContract360ViewInput,
): Contract360View {
  const {
    contract,
    applicationScope,
    financialExposure,
    operationalPerformance,
    initiativeDependencies,
    towerObservations,
    towerValueClaims,
    docExtractions = [],
    optimizationEvidence = null,
    optimizationOpportunitySet = null,
    evidenceOverview = null,
    evidenceScope = [],
    evidencePricing = [],
    evidencePerformance = null,
    performancePeriods = [],
    spendMonths = [],
    explicitApplicationPairs,
  } = input;

  const scopeTiers = tierApplicationScopeByConfidence(
    applicationScope,
    explicitApplicationPairs,
  );

  return {
    contract,
    financialExposure:
      financialExposure.find((r) => r.contract_id === contract.contract_id) ??
      null,
    operationalPerformance:
      operationalPerformance.find(
        (r) => r.contract_id === contract.contract_id,
      ) ?? null,
    initiativeDependencies: initiativeDependencies.filter(
      (r) => r.contract_id === contract.contract_id,
    ),
    scopeTiers,
    towerObservations,
    towerValueClaims,
    hasTowerOverlay:
      towerObservations.length > 0 || towerValueClaims.length > 0,
    docExtractions,
    optimizationEvidence,
    optimizationOpportunitySet,
    evidenceOverview,
    evidenceScope,
    evidencePricing,
    evidencePerformance,
    performancePeriods: performancePeriods.filter(
      (r) => r.contract_id === contract.contract_id,
    ),
    spendMonths: spendMonths.filter(
      (r) => r.contract_id === contract.contract_id,
    ),
  };
}

/** Every subject_ref worth overlaying Tower data against for a given contract. */
export function collectContractSubjectRefs(
  contract: SourceContract360Row,
  applicationScope: readonly SourceContractApplicationScopeRow[],
): readonly string[] {
  return Array.from(
    new Set([
      contract.contract_id,
      contract.vendor_ref,
      ...applicationScope.map((r) => r.application_ref),
    ]),
  );
}

export const RELATIONSHIP_METHOD_LABEL: Record<string, string> = {
  explicit_contract_scope: "Explicit — contract scope",
  explicit_sow_scope: "Explicit — SOW scope",
  reviewed_mapping: "Reviewed mapping",
  vendor_based_inference: "Vendor-based inference",
  name_based_inference: "Name-based inference",
  unresolved: "Unresolved",
};
