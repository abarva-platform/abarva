// Tower CXO chart contracts used by presentation components.
//
// Keep this file type-only. The retired cio_tower SQL reader remains isolated
// under src/lib/cio-tower and must not be pulled into live chart rendering.

export type CioTowerCxoSectionKey =
  | 'value_command_center'
  | 'portfolio_control'
  | 'vendor_contract_exposure'
  | 'evidence_trust'
  | 'ask_ava';

export interface CioTowerCxoEvidenceRef {
  factKey: string;
  label: string;
  measure: string;
  value: string;
  sourceFile: string | null;
  sourceRow: string | null;
  sourceSystem: string | null;
}

export interface CioTowerCxoMeasureCard {
  measureKey: string;
  label: string;
  section: CioTowerCxoSectionKey;
  valueNumeric: number | null;
  displayValue: string;
  period: string | null;
  basis: string | null;
  scope: string | null;
  formulaVersion: string | null;
  sourceFactKeys: string[];
  evidence: CioTowerCxoEvidenceRef[];
  gap: string | null;
}

export interface CioTowerCxoTableRow {
  label: string;
  type: string | null;
  measure: string;
  value: string;
  period: string;
  basis: string;
  confidence: string;
  source: string;
}

export interface CioTowerPortfolioValueRow {
  program: string;
  owner: string;
  blocker: string;
  budgetNumeric: number | null;
  budget: string;
  actualSpendNumeric: number | null;
  actualSpend: string;
  promisedValueNumeric: number | null;
  promisedValue: string;
  measuredValueNumeric: number | null;
  measuredValue: string;
  valueGapNumeric: number | null;
  valueGap: string;
  spendBurnRate: string;
  valueRealizationRate: string;
  measuredValuePerDollarSpent: string;
  evidenceStatus: string;
  inspectionReason: string;
  confidence: string;
  source: string;
  sourceFactKeys: string[];
}

export interface CioTowerCxoBenchmarkRow {
  tenantKey: string;
  label: string;
  isCurrent: boolean;
  totalBudget: number | null;
  runBudget: number | null;
  changeBudget: number | null;
  initiativeBudget: number | null;
  actualSpendYtd: number | null;
  promisedValue: number | null;
  measuredValue: number | null;
}

export interface CioTowerDerivedProjectionMetadata {
  projectionRole: 'derived_read_model';
  projectionPath: 'path_a_derived_projection';
  sourceOfTruthStatus: 'bridge_only';
  v3ReconciliationStatus: 'not_v3_reconciled';
  sourceOfTruthCaveat: string;
  realizedValueLanguagePolicy: string;
}

export const CIO_TOWER_DERIVED_PROJECTION_METADATA: CioTowerDerivedProjectionMetadata = {
  projectionRole: 'derived_read_model',
  projectionPath: 'path_a_derived_projection',
  sourceOfTruthStatus: 'bridge_only',
  v3ReconciliationStatus: 'not_v3_reconciled',
  sourceOfTruthCaveat:
    'Tower current-layer views are read-model projections until every displayed fact reconciles to ECL evidence, canonical facts, entity profiles, and relationships.',
  realizedValueLanguagePolicy:
    'Realized value requires finance-attested measured evidence; otherwise Tower must render value as promised, planned, forecast, or measurement-readiness.',
};

export interface CioTowerCxoViewModel {
  tenantKey: string;
  tenantName: string;
  generatedFrom: 'tower_current_layer';
  projectionMetadata: CioTowerDerivedProjectionMetadata;
  headline: string;
  sections: Array<{ key: CioTowerCxoSectionKey; label: string; purpose: string }>;
  cards: CioTowerCxoMeasureCard[];
  portfolioRows: CioTowerCxoTableRow[];
  portfolioValueRows: CioTowerPortfolioValueRow[];
  vendorRows: CioTowerCxoTableRow[];
  trustRows: CioTowerCxoTableRow[];
  benchmarkRows: CioTowerCxoBenchmarkRow[];
  gaps: string[];
  parityMeasureKey: 'total_it_budget_fy26';
}
