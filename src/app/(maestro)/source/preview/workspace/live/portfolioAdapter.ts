import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import Papa from "papaparse";

import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  numberFromDb,
  summarizePortfolio,
  tierApplicationScopeByConfidence,
  type ContractLeverageEntry,
} from "@/lib/source/data-model/vendor-contract-portfolio";
import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";
import { resolveEclProductProvider } from "@/lib/ecl/product-provider";
import { computeSourcingOpportunities } from "@/lib/source/data-model/sourcing-opportunities";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import {
  createEmptySourceV4WorkspaceSnapshot,
  loadSourceV4WorkspaceSnapshot,
  type SourceV4SliceAvailability,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  evaluateContractCategoryQuality,
  type SourceContractCategoryQualitySummary,
} from "@/lib/source/data-model/contract-category-quality";
import {
  listContract360,
  listContractApplicationScope,
  listContractInitiativeDependency,
  listSourceAvaGroundingBundles,
  listSourceContractActionCandidates,
  listSourceContractClaimCards,
  listSourceContractEvidenceCoverage,
  listSourcePageStoryline,
  listSourceVendorPositions,
  listVendorContractPortfolio,
} from "@/lib/source/data-model/read-adapter";
import type {
  SourceAvaGroundingBundleRow,
  SourceContract360Row,
  SourceContractActionCandidateRow,
  SourceContractApplicationScopeRow,
  SourceContractClaimCardRow,
  SourceContractEvidenceCoverageRow,
  SourceContractInitiativeDependencyRow,
  SourcePageStorylineRow,
  SourceVendorPositionRow,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";

// ─────────────────────────────────────────────────────────────────────────
// Portfolio-wide read for the Source Workspace. One fetch, on the server,
// against the tables verified real in types.ts. Every downstream number in
// the workspace traces back to a row returned here or a pure function over
// it — nothing is computed a second time in the client.
// ─────────────────────────────────────────────────────────────────────────

type SourceWorkspaceExploreProvider =
  | "LegacySourceContract360Provider"
  | "EclProjectionCsvProvider"
  | "EclProjectionDbProvider";

type EclProjectionRow = Record<string, unknown>;
type SourceServingViewName =
  | "source_contract_360"
  | "source_vendor_portfolio"
  | "source_vendor_360"
  | "source_events"
  | "source_compare"
  | "source_approvals";
type EclCubeSliceRow = {
  readonly cube_key: string;
  readonly slice_key: string;
  readonly primary_metric_key: string;
  readonly quality_state: string;
};
type EclRuntimeEvidenceSummary = {
  readonly spendRowCount: number;
  readonly spendActual: number;
  readonly spendCommitted: number;
  readonly performanceRowCount: number;
  readonly performanceBreachCount: number;
  readonly creditCalculated: number;
  readonly creditClaimed: number;
  readonly creditRecovered: number;
};
export type SourceWorkspaceProviderMode =
  | "legacy"
  | "ecl_projection"
  | "ecl_projection_db";
export type SourceWorkspaceImpactMode = "full" | "deferred";

export interface SourceWorkspaceLoadOptions {
  readonly impactMode?: SourceWorkspaceImpactMode;
}

export interface SourceWorkspacePortfolioData {
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly semanticLayer: ReturnType<typeof sourceV4CubeUiCatalogForAgent>;
  readonly v4Snapshot: SourceV4WorkspaceSnapshot;
  readonly categoryQuality: SourceContractCategoryQualitySummary;
  readonly workspaceDiagnostics: {
    readonly datasetLabel: string;
    readonly datasetId: string;
    readonly datasetVersion: string;
    readonly analyticsProvider: string;
    readonly activeLoadRunId: string | null;
    readonly asOfDateIso: string;
    readonly v4ContractCount: number;
    readonly v4VendorCount: number;
    readonly legacyContractCount: number;
    readonly legacyVendorCount: number;
    readonly exploreProvider: SourceWorkspaceExploreProvider;
    readonly exploreMatchesV4: boolean;
    readonly mismatchWarning: string | null;
    readonly eclProjectionDir?: string | null;
    readonly eclCompareResponseCount?: number;
  };
  readonly cockpit: SourceVendor360CockpitData;
  readonly impact: SourceWorkspaceImpactLayer;
  readonly contracts: readonly SourceContract360Row[];
  readonly vendors: readonly SourceVendorContractPortfolioRow[];
  readonly applicationScope: readonly SourceContractApplicationScopeRow[];
  readonly initiativeDependencies: readonly SourceContractInitiativeDependencyRow[];
  readonly isEmpty: boolean;
  readonly reads: {
    readonly contracts: "available" | "missing";
    readonly vendors: "available" | "missing";
    readonly applicationScope: "available" | "missing";
    readonly initiativeDependencies: "available" | "missing";
  };
}

export interface SourceWorkspaceImpactLayer {
  readonly evidenceCoverage: readonly SourceContractEvidenceCoverageRow[];
  readonly actionCandidates: readonly SourceContractActionCandidateRow[];
  readonly claimCards: readonly SourceContractClaimCardRow[];
  readonly vendorPositions: readonly SourceVendorPositionRow[];
  readonly storyline: readonly SourcePageStorylineRow[];
  readonly avaGroundingBundles: readonly SourceAvaGroundingBundleRow[];
}

export type CockpitGateState = "pass" | "warn" | "fail";
export type CockpitReadState = "available" | "missing" | "error";

export interface SourceVendor360CockpitData {
  readonly verdict: {
    readonly eyebrow: string;
    readonly headline: string;
    readonly decidingAxis: string;
    readonly bindingChip: string;
    readonly supports: readonly {
      readonly label: string;
      readonly value: string;
      readonly note: string;
      readonly tone: CockpitGateState;
    }[];
  };
  readonly banner: {
    readonly datasetLabel: string;
    readonly v4ContractCount: number;
    readonly v4VendorCount: number;
    readonly asOfDateIso: string;
    readonly activeLoadRunId: string | null;
  };
  readonly actionQueue: readonly CockpitActionRow[];
  readonly topContracts: readonly CockpitTopContractRow[];
  readonly claimQualityControls: readonly CockpitClaimQualityControl[];
  readonly proofLayers: {
    readonly evidenceBehindVerdict: readonly CockpitProofEntry[];
    readonly sourceSystems: readonly CockpitSourceSystemRow[];
    readonly reconciliation: {
      readonly exploreMatchesV4: boolean;
      readonly legacyContractCount: number;
      readonly legacyVendorCount: number;
      readonly v4ContractCount: number;
      readonly v4VendorCount: number;
      readonly mismatchWarning: string | null;
    };
    readonly sourceMappingTable: readonly CockpitSourceMappingRow[];
    readonly lineageRail: readonly string[];
  };
}

export interface CockpitActionRow {
  readonly contractId: string;
  readonly actionVerb: string;
  readonly counterparty: string;
  readonly contractNumber: string;
  readonly why: string;
  readonly annualValue: number | null;
  readonly annualValueLabel: string;
  readonly deadlineIso: string | null;
  readonly deadlineLabel: string;
  readonly gate: CockpitGateState;
  readonly gateLabel: string;
  readonly opportunityId: string | null;
}

export interface CockpitTopContractRow {
  readonly contractId: string;
  readonly counterparty: string;
  readonly contractNumber: string;
  readonly annualValue: number | null;
  readonly annualValueLabel: string;
  readonly termLabel: string;
  readonly renewalLabel: string;
  readonly gate: CockpitGateState;
  readonly gateLabel: string;
  readonly sourceDocumentLabel: string;
  readonly sourceDocumentNeed: string | null;
  readonly confidence: number | null;
  readonly confidenceLabel: string;
  readonly confidenceGate: CockpitGateState;
}

interface CockpitProofEntry {
  readonly label: string;
  readonly binding: string;
  readonly grain: string;
  readonly value: string;
}

interface CockpitClaimQualityControl {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly tone: CockpitGateState;
}

interface CockpitSourceSystemRow {
  readonly name: string;
  readonly binding: string;
  readonly grain: string;
  readonly rowCount: number;
  readonly state: CockpitReadState;
  readonly note: string;
}

interface CockpitSourceMappingRow {
  readonly bindingName: string;
  readonly grain: string;
  readonly rowCount: number;
  readonly state: CockpitReadState;
}

export async function loadSourceWorkspacePortfolio(
  tenantKey: string,
  asOfDateIso: string,
  providerOverride?: SourceWorkspaceProviderMode | null,
  options: SourceWorkspaceLoadOptions = {},
): Promise<SourceWorkspacePortfolioData> {
  const provider = sourceWorkspaceProvider(providerOverride);
  if (provider !== "legacy") {
    return loadEclProjectionWorkspacePortfolio(
      tenantKey,
      asOfDateIso,
      provider,
      options,
    );
  }

  const [
    contractsRaw,
    vendors,
    applicationScope,
    initiativeDependencies,
    v4Snapshot,
    impact,
  ] = await Promise.all([
    listContract360(tenantKey).catch(() => []),
    listVendorContractPortfolio(tenantKey).catch(() => []),
    listContractApplicationScope(tenantKey).catch(() => []),
    listContractInitiativeDependency(tenantKey).catch(() => []),
    loadSourceV4WorkspaceSnapshot(tenantKey, asOfDateIso),
    loadWorkspaceImpactLayerForMode(tenantKey, options.impactMode),
  ]);

  const contracts = excludeSupplementalContracts(contractsRaw);
  const impactResolved = resolveImpactVendorNames(impact, contracts, vendors);
  const categoryQuality = evaluateContractCategoryQuality(contracts);
  const legacyVendorRefs = new Set(
    contracts.map((contract) => contract.vendor_ref),
  );
  const legacyVendorCount = legacyVendorRefs.size;
  const v4ContractCount =
    v4Snapshot.executivePortfolio.contractCount ||
    v4Snapshot.contextCoverage.contracts;
  const v4VendorCount =
    v4Snapshot.contextCoverage.vendors || v4Snapshot.topVendors.length;
  const exploreMatchesV4 =
    contracts.length === v4ContractCount && legacyVendorCount === v4VendorCount;
  const workspaceDiagnostics = {
    datasetLabel: v4Snapshot.datasetLabel,
    datasetId: v4Snapshot.datasetId,
    datasetVersion: v4Snapshot.datasetVersion,
    analyticsProvider: v4Snapshot.analyticsProvider,
    activeLoadRunId: v4Snapshot.activeLoadRunId,
    asOfDateIso: v4Snapshot.asOfDateIso,
    v4ContractCount,
    v4VendorCount,
    legacyContractCount: contracts.length,
    legacyVendorCount,
    exploreProvider: "LegacySourceContract360Provider" as const,
    exploreMatchesV4,
    mismatchWarning: exploreMatchesV4
      ? null
      : `Explore lens is reading ${contracts.length} contracts / ${legacyVendorCount} vendors from source.contract_360 while the active Source V4 snapshot reports ${v4ContractCount} contract families / ${v4VendorCount} vendors.`,
  };
  const reads = {
    contracts:
      contractsRaw.length > 0 ? ("available" as const) : ("missing" as const),
    vendors: vendors.length > 0 ? ("available" as const) : ("missing" as const),
    applicationScope:
      applicationScope.length > 0
        ? ("available" as const)
        : ("missing" as const),
    initiativeDependencies:
      initiativeDependencies.length > 0
        ? ("available" as const)
        : ("missing" as const),
  };

  return {
    tenantKey,
    asOfDateIso,
    semanticLayer: sourceV4CubeUiCatalogForAgent({
      datasetId: v4Snapshot.datasetId,
    }),
    v4Snapshot,
    categoryQuality,
    workspaceDiagnostics,
    cockpit: buildSourceVendor360Cockpit({
      contracts,
      vendors,
      applicationScope,
      initiativeDependencies,
      v4Snapshot,
      workspaceDiagnostics,
      reads,
      asOfDateIso,
    }),
    impact: impactResolved,
    contracts,
    vendors,
    applicationScope,
    initiativeDependencies,
    isEmpty: contracts.length === 0,
    reads,
  };
}

export function sourceWorkspaceProvider(
  providerOverride?: SourceWorkspaceProviderMode | null,
): SourceWorkspaceProviderMode {
  if (providerOverride) {
    return providerOverride;
  }
  if (process.env.SOURCE_WORKSPACE_PROVIDER === "legacy") {
    return "legacy";
  }
  if (process.env.SOURCE_WORKSPACE_PROVIDER === "ecl_projection") {
    return "ecl_projection";
  }
  if (
    process.env.SOURCE_WORKSPACE_PROVIDER === "ecl_projection_db" ||
    resolveEclProductProvider() === "ecl_projection_db"
  ) {
    return "ecl_projection_db";
  }
  return "legacy";
}

async function loadEclProjectionWorkspacePortfolio(
  tenantKey: string,
  asOfDateIso: string,
  provider: SourceWorkspaceProviderMode,
  options: SourceWorkspaceLoadOptions = {},
): Promise<SourceWorkspacePortfolioData> {
  const projectionDir = process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR?.trim();
  if (provider === "ecl_projection" && !projectionDir) {
    throw new Error(
      "SOURCE_WORKSPACE_PROVIDER=ecl_projection requires SOURCE_WORKSPACE_ECL_PROJECTION_DIR.",
    );
  }

  const [
    contractRows,
    vendorRows,
    eventRows,
    cubeSliceRows,
    impact,
  ] = await Promise.all([
    provider === "ecl_projection_db"
      ? readProjectionTable(tenantKey, "source_contract_360")
      : readProjectionCsv(
          path.join(projectionDir ?? "", "source_contract_360_projection.csv"),
        ),
    provider === "ecl_projection_db"
      ? readProjectionView(tenantKey, "source_vendor_portfolio")
      : readProjectionCsv(
          path.join(projectionDir ?? "", "source_vendor_360_projection.csv"),
        ),
    provider === "ecl_projection_db"
      ? Promise.resolve([])
      : readProjectionCsv(
          path.join(
            projectionDir ?? "",
            "source_event_workspace_projection.csv",
          ),
        ),
    provider === "ecl_projection_db"
      ? readEclCubeSlices(tenantKey)
      : Promise.resolve([]),
    loadWorkspaceImpactLayerForMode(tenantKey, options.impactMode),
  ]);
  const acceptedTenantKeys = new Set(
    [tenantKey, ...tenantAliasesFor(tenantKey)].map((value) => value.trim()),
  );
  const tenantMatches = (row: EclProjectionRow) =>
    acceptedTenantKeys.has(textValue(row.tenant_key).trim());

  const eclContracts = contractRows
    .filter(tenantMatches)
    .map(contractFromEclProjectionRow);
  const contracts = eclContracts;
  const eclVendors = vendorRows
    .filter(tenantMatches)
    .map(vendorFromEclProjectionRow);
  const vendors = eclVendors;
  const impactResolved = resolveImpactVendorNames(impact, contracts, vendors);
  const runtimeEvidence = runtimeEvidenceFromImpactLayer(impactResolved);
  const applicationScope = contractRows
    .filter(tenantMatches)
    .flatMap(scopeFromEclProjectionRow);
  const initiativeDependencies: SourceContractInitiativeDependencyRow[] = [];
  const v4Snapshot = eclSourceWorkspaceSnapshot({
    asOfDateIso,
    contracts,
    vendors,
    applicationScope,
    cubeSliceRows,
    runtimeEvidence,
  });
  const categoryQuality = evaluateContractCategoryQuality(contracts);
  const legacyVendorCount = new Set(
    contracts.map((contract) => contract.vendor_ref),
  ).size;
  const workspaceDiagnostics = {
    datasetLabel: v4Snapshot.datasetLabel,
    datasetId: v4Snapshot.datasetId,
    datasetVersion: v4Snapshot.datasetVersion,
    analyticsProvider:
      provider === "ecl_projection_db"
        ? "EclProjectionDbProvider"
        : "EclProjectionCsvProvider",
    activeLoadRunId: v4Snapshot.activeLoadRunId,
    asOfDateIso: v4Snapshot.asOfDateIso,
    v4ContractCount: contracts.length,
    v4VendorCount: legacyVendorCount,
    legacyContractCount: contracts.length,
    legacyVendorCount,
    exploreProvider:
      provider === "ecl_projection_db"
        ? ("EclProjectionDbProvider" as const)
        : ("EclProjectionCsvProvider" as const),
    exploreMatchesV4: true,
    mismatchWarning: null,
    eclProjectionDir: provider === "ecl_projection_db" ? null : projectionDir,
    eclCompareResponseCount:
      provider === "ecl_projection_db"
        ? undefined
        : eventRows.filter(
            (row) =>
              tenantMatches(row) &&
              textValue(row.workspace_tab) === "compare" &&
              textValue(row.row_type) === "vendor_response_compare",
          ).length,
  };
  const reads = {
    contracts:
      contracts.length > 0 ? ("available" as const) : ("missing" as const),
    vendors: vendors.length > 0 ? ("available" as const) : ("missing" as const),
    applicationScope:
      applicationScope.length > 0
        ? ("available" as const)
        : ("missing" as const),
    initiativeDependencies: "missing" as const,
  };

  return {
    tenantKey,
    asOfDateIso,
    semanticLayer: sourceV4CubeUiCatalogForAgent({
      datasetId: v4Snapshot.datasetId,
    }),
    v4Snapshot,
    categoryQuality,
    workspaceDiagnostics,
    cockpit: buildSourceVendor360Cockpit({
      contracts,
      vendors,
      applicationScope,
      initiativeDependencies,
      v4Snapshot,
      workspaceDiagnostics,
      reads,
      asOfDateIso,
    }),
    impact: impactResolved,
    contracts,
    vendors,
    applicationScope,
    initiativeDependencies,
    isEmpty: contracts.length === 0,
    reads,
  };
}

function loadWorkspaceImpactLayerForMode(
  tenantKey: string,
  impactMode: SourceWorkspaceImpactMode = "full",
): Promise<SourceWorkspaceImpactLayer> {
  if (impactMode === "deferred") {
    return Promise.resolve(emptySourceWorkspaceImpactLayer());
  }
  return loadSourceWorkspaceImpactLayer(tenantKey);
}

function emptySourceWorkspaceImpactLayer(): SourceWorkspaceImpactLayer {
  return {
    evidenceCoverage: [],
    actionCandidates: [],
    claimCards: [],
    vendorPositions: [],
    storyline: [],
    avaGroundingBundles: [],
  };
}

async function loadSourceWorkspaceImpactLayer(
  tenantKey: string,
): Promise<SourceWorkspaceImpactLayer> {
  const [
    evidenceCoverage,
    actionCandidates,
    claimCards,
    vendorPositions,
    storyline,
    avaGroundingBundles,
  ] = await Promise.all([
    listSourceContractEvidenceCoverage(tenantKey).catch(() => []),
    listSourceContractActionCandidates(tenantKey).catch(() => []),
    listSourceContractClaimCards(tenantKey).catch(() => []),
    listSourceVendorPositions(tenantKey).catch(() => []),
    listSourcePageStoryline(tenantKey).catch(() => []),
    listSourceAvaGroundingBundles(tenantKey).catch(() => []),
  ]);
  const viewImpact = {
    evidenceCoverage,
    actionCandidates,
    claimCards,
    vendorPositions,
    storyline,
    avaGroundingBundles,
  };
  if (!shouldCompleteImpactLayer(viewImpact)) return viewImpact;
  const derivedImpact = await loadDerivedSourceWorkspaceImpactLayer(tenantKey);
  if (derivedImpact && hasImpactLayerRows(derivedImpact)) {
    return mergeSourceWorkspaceImpactLayer(viewImpact, derivedImpact);
  }
  return viewImpact;
}

function hasImpactLayerRows(impact: SourceWorkspaceImpactLayer): boolean {
  return (
    impact.evidenceCoverage.length > 0 ||
    impact.actionCandidates.length > 0 ||
    impact.claimCards.length > 0 ||
    impact.vendorPositions.length > 0 ||
    impact.storyline.length > 0 ||
    impact.avaGroundingBundles.length > 0
  );
}

function hasExecutiveImpactRows(impact: SourceWorkspaceImpactLayer): boolean {
  return (
    impact.actionCandidates.length > 0 ||
    impact.claimCards.length > 0 ||
    impact.storyline.length > 0 ||
    impact.avaGroundingBundles.length > 0
  );
}

function shouldCompleteImpactLayer(impact: SourceWorkspaceImpactLayer): boolean {
  if (!hasExecutiveImpactRows(impact)) return true;
  const actionGroundingBundleCount = impact.avaGroundingBundles.filter(
    (row) => row.page_key === "contract_action",
  ).length;
  return (
    impact.evidenceCoverage.length === 0 ||
    impact.vendorPositions.length === 0 ||
    impact.storyline.length === 0 ||
    (impact.actionCandidates.length > 0 &&
      impact.claimCards.length < impact.actionCandidates.length) ||
    (impact.actionCandidates.length > 0 &&
      actionGroundingBundleCount < impact.actionCandidates.length)
  );
}

function mergeSourceWorkspaceImpactLayer(
  base: SourceWorkspaceImpactLayer,
  overlay: SourceWorkspaceImpactLayer,
): SourceWorkspaceImpactLayer {
  return {
    evidenceCoverage: mergeRowsByKey(
      base.evidenceCoverage,
      overlay.evidenceCoverage,
      (row) => row.contract_id,
    ),
    actionCandidates: mergeRowsByKey(
      base.actionCandidates,
      overlay.actionCandidates,
      (row) => row.action_candidate_id,
    ),
    claimCards: mergeRowsByKey(
      base.claimCards,
      overlay.claimCards,
      (row) => row.claim_card_id,
    ),
    vendorPositions: mergeRowsByKey(
      base.vendorPositions,
      overlay.vendorPositions,
      (row) => row.vendor_ref,
    ),
    storyline: mergeRowsByKey(
      base.storyline,
      overlay.storyline,
      (row) => `${row.page_key}:${row.section_key}`,
    ),
    avaGroundingBundles: mergeRowsByKey(
      base.avaGroundingBundles,
      overlay.avaGroundingBundles,
      (row) => row.grounding_bundle_id,
    ),
  };
}

type VendorNamedRow = {
  readonly contract_id?: string | null;
  readonly vendor_ref: string;
  readonly vendor_name: string;
};

const UUID_VALUE_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

export function resolveImpactVendorNames(
  impact: SourceWorkspaceImpactLayer,
  contracts: readonly SourceContract360Row[],
  vendors: readonly SourceVendorContractPortfolioRow[],
): SourceWorkspaceImpactLayer {
  const resolver = buildVendorNameResolver(contracts, vendors);
  seedImpactVendorRefs(impact, resolver);
  const refNameMap = resolver.refNameMap;
  const evidenceCoverage = impact.evidenceCoverage.map((row) =>
    resolveVendorNameField(row, resolver),
  );
  const actionCandidates = impact.actionCandidates.map((row) =>
    resolveVendorNameField(row, resolver),
  );
  const claimCards = impact.claimCards.map((row) => {
    const resolved = resolveVendorNameField(row, resolver);
    return {
      ...resolved,
      allowed_executive_statement: replaceOpaqueVendorText(
        resolved.allowed_executive_statement,
        refNameMap,
      ),
    };
  });
  const vendorPositions = impact.vendorPositions.map((row) =>
    resolveVendorNameField(row, resolver),
  );
  const storyline = impact.storyline.map((row) => ({
    ...row,
    allowed_executive_statement: replaceOpaqueVendorText(
      row.allowed_executive_statement,
      refNameMap,
    ),
    primary_metric_value: replaceOpaqueVendorText(
      row.primary_metric_value,
      refNameMap,
    ),
  }));
  const avaGroundingBundles = impact.avaGroundingBundles.map((row) => ({
    ...row,
    allowed_claims_json: replaceOpaqueVendorValues(
      row.allowed_claims_json,
      refNameMap,
    ) as readonly Record<string, unknown>[],
    citation_sources_json: replaceOpaqueVendorValues(
      row.citation_sources_json,
      refNameMap,
    ) as Record<string, unknown> | null,
  }));

  return {
    evidenceCoverage,
    actionCandidates,
    claimCards,
    vendorPositions,
    storyline,
    avaGroundingBundles,
  };
}

function buildVendorNameResolver(
  contracts: readonly SourceContract360Row[],
  vendors: readonly SourceVendorContractPortfolioRow[],
) {
  const vendorNameByRef = new Map<string, string>();
  const vendorNameByContract = new Map<string, string>();
  for (const vendor of vendors) {
    addVendorName(vendorNameByRef, vendor.vendor_ref, vendor.vendor_name);
  }
  for (const contract of contracts) {
    addVendorName(
      vendorNameByRef,
      contract.vendor_ref,
      contract.vendor_name,
    );
    if (isReadableVendorName(contract.vendor_name, contract.vendor_ref)) {
      vendorNameByContract.set(contract.contract_id, contract.vendor_name);
    }
  }
  return { vendorNameByRef, vendorNameByContract, refNameMap: vendorNameByRef };
}

function seedImpactVendorRefs(
  impact: SourceWorkspaceImpactLayer,
  resolver: ReturnType<typeof buildVendorNameResolver>,
) {
  for (const row of [
    ...impact.evidenceCoverage,
    ...impact.actionCandidates,
    ...impact.claimCards,
  ]) {
    addContractScopedImpactVendorName(row, resolver);
  }
}

function addContractScopedImpactVendorName<Row extends VendorNamedRow>(
  row: Row,
  resolver: ReturnType<typeof buildVendorNameResolver>,
) {
  if (!row.contract_id) return;
  const resolvedName = resolver.vendorNameByContract.get(row.contract_id);
  if (!resolvedName) return;
  addResolvedOpaqueVendorValue(row.vendor_ref, resolvedName, resolver);
  addResolvedOpaqueVendorValue(row.vendor_name, resolvedName, resolver);
}

function addResolvedOpaqueVendorValue(
  opaqueValue: string | null | undefined,
  resolvedName: string,
  resolver: ReturnType<typeof buildVendorNameResolver>,
) {
  const normalized = opaqueValue?.trim();
  if (!normalized || normalized === resolvedName) return;
  if (isReadableVendorName(normalized, undefined)) return;
  resolver.vendorNameByRef.set(normalized, resolvedName);
}

function addVendorName(
  index: Map<string, string>,
  vendorRef: string | null | undefined,
  vendorName: string | null | undefined,
) {
  if (!vendorRef) return;
  if (!isReadableVendorName(vendorName, vendorRef)) return;
  index.set(vendorRef, vendorName.trim());
}

function resolveVendorNameField<Row extends VendorNamedRow>(
  row: Row,
  resolver: ReturnType<typeof buildVendorNameResolver>,
): Row {
  if (isReadableVendorName(row.vendor_name, row.vendor_ref)) return row;
  const resolved =
    resolver.vendorNameByRef.get(row.vendor_ref) ??
    (row.contract_id
      ? resolver.vendorNameByContract.get(row.contract_id)
      : undefined);
  if (!resolved) return row;
  return { ...row, vendor_name: resolved };
}

function isReadableVendorName(
  vendorName: string | null | undefined,
  vendorRef: string | null | undefined,
): vendorName is string {
  const normalizedName = vendorName?.trim();
  if (!normalizedName) return false;
  if (vendorRef && normalizedName === vendorRef.trim()) return false;
  return !UUID_VALUE_PATTERN.test(normalizedName);
}

function replaceOpaqueVendorText(
  value: string,
  refNameMap: ReadonlyMap<string, string>,
): string {
  let next = value;
  for (const [vendorRef, vendorName] of refNameMap) {
    if (!vendorRef || vendorRef === vendorName) continue;
    next = next.split(vendorRef).join(vendorName);
  }
  return next;
}

function replaceOpaqueVendorValues(
  value: unknown,
  refNameMap: ReadonlyMap<string, string>,
  key = "",
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceOpaqueVendorValues(item, refNameMap, key),
    );
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        replaceOpaqueVendorValues(entryValue, refNameMap, entryKey),
      ]),
    );
  }
  if (typeof value !== "string") return value;
  if (key.endsWith("_id") || key.endsWith("_ref") || key === "contract_id") {
    return value;
  }
  return replaceOpaqueVendorText(value, refNameMap);
}

function mergeRowsByKey<Row>(
  base: readonly Row[],
  overlay: readonly Row[],
  keyOf: (row: Row) => string,
): Row[] {
  const rows = new Map<string, Row>();
  for (const row of base) rows.set(keyOf(row), row);
  for (const row of overlay) rows.set(keyOf(row), row);
  return Array.from(rows.values());
}

async function loadDerivedSourceWorkspaceImpactLayer(
  tenantKey: string,
): Promise<SourceWorkspaceImpactLayer> {
  const acceptedTenantKeys = Array.from(
    new Set(
      [
        canonicalTenantKey(tenantKey),
        tenantKey,
        ...tenantAliasesFor(tenantKey),
      ].map((value) => value.trim()),
    ),
  );
  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [
        canonicalTenantKey(tenantKey),
      ]);
      const evidenceCoverage = await run<SourceContractEvidenceCoverageRow>(
        `WITH spend AS (
           SELECT
             tenant_key,
             contract_id,
             count(*)::bigint AS spend_rows,
             COALESCE(sum(actual_spend), 0)::numeric AS actual_spend_usd,
             COALESCE(sum(committed_amount), 0)::numeric AS committed_spend_usd
            FROM consumption.sourcing_spend_monthly_v1
           WHERE tenant_key = ANY($1::text[])
           GROUP BY tenant_key, contract_id
         ),
         performance AS (
           SELECT
             tenant_key,
             contract_id,
             count(*)::bigint AS performance_rows,
             count(*) FILTER (WHERE performance_state = 'breached')::bigint AS breach_rows,
             COALESCE(sum(credit_calculated), 0)::numeric AS credit_calculated_usd,
             COALESCE(sum(credit_claimed), 0)::numeric AS credit_claimed_usd,
             COALESCE(sum(credit_recovered), 0)::numeric AS credit_recovered_usd
            FROM consumption.sourcing_performance_v1
           WHERE tenant_key = ANY($1::text[])
           GROUP BY tenant_key, contract_id
         ),
         opportunities AS (
           SELECT
             tenant_key,
             contract_id,
             count(*)::bigint AS opportunity_rows,
             COALESCE(sum(annual_value_exposed), 0)::numeric AS candidate_amount_usd,
             count(*) FILTER (WHERE readiness_state = 'finance_confirmation_required')::bigint AS finance_confirmation_required_rows,
             count(*) FILTER (WHERE evidence_state = 'present')::bigint AS opportunities_with_evidence
            FROM consumption.sourcing_opportunity_v1
           WHERE tenant_key = ANY($1::text[])
           GROUP BY tenant_key, contract_id
         ),
         scope AS (
           SELECT
             tenant_key,
             contract_id,
             count(*)::bigint AS scope_rows,
             count(*) FILTER (WHERE critical_application_flag)::bigint AS critical_scope_rows
            FROM consumption.sourcing_contract_scope_v1
           WHERE tenant_key = ANY($1::text[])
           GROUP BY tenant_key, contract_id
         )
         SELECT
           c.tenant_key,
           c.contract_id,
           c.vendor_ref,
           c.vendor_name,
           c.vendor_category,
           c.vendor_category AS contract_archetype,
           c.contract_name,
           COALESCE(spend.spend_rows, 0)::bigint AS spend_rows,
           COALESCE(spend.actual_spend_usd, 0)::numeric AS actual_spend_usd,
           COALESCE(spend.committed_spend_usd, 0)::numeric AS committed_spend_usd,
           COALESCE(performance.performance_rows, 0)::bigint AS performance_rows,
           COALESCE(performance.breach_rows, 0)::bigint AS breach_rows,
           COALESCE(performance.credit_calculated_usd, 0)::numeric AS credit_calculated_usd,
           COALESCE(performance.credit_claimed_usd, 0)::numeric AS credit_claimed_usd,
           COALESCE(performance.credit_recovered_usd, 0)::numeric AS credit_recovered_usd,
           GREATEST(COALESCE(performance.credit_calculated_usd, 0) - COALESCE(performance.credit_claimed_usd, 0), 0)::numeric AS unclaimed_credit_usd,
           COALESCE(opportunities.opportunity_rows, 0)::bigint AS opportunity_rows,
           COALESCE(opportunities.candidate_amount_usd, 0)::numeric AS candidate_amount_usd,
           COALESCE(opportunities.finance_confirmation_required_rows, 0)::bigint AS finance_confirmation_required_rows,
           COALESCE(opportunities.opportunities_with_evidence, 0)::bigint AS opportunities_with_evidence,
           COALESCE(scope.scope_rows, 0)::bigint AS scope_rows,
           COALESCE(scope.critical_scope_rows, 0)::bigint AS critical_scope_rows,
           COALESCE(c.document_page_text_count, 0)::bigint AS document_page_text_rows,
           COALESCE(c.change_order_count, 0)::bigint AS change_order_rows,
           CASE
             WHEN COALESCE(opportunities.opportunity_rows, 0) > 0
              AND COALESCE(opportunities.opportunities_with_evidence, 0) = 0 THEN 'blocked'
             WHEN COALESCE(spend.spend_rows, 0) > 0
              AND COALESCE(performance.performance_rows, 0) > 0
              AND COALESCE(c.document_page_text_count, 0) > 0 THEN 'decision_ready'
             WHEN COALESCE(spend.spend_rows, 0) > 0
               OR COALESCE(performance.performance_rows, 0) > 0
               OR COALESCE(c.document_page_text_count, 0) > 0
               OR COALESCE(opportunities.opportunity_rows, 0) > 0 THEN 'partial'
             ELSE 'not_loaded'
           END AS coverage_state,
           concat_ws(
             '; ',
             CASE WHEN COALESCE(spend.spend_rows, 0) = 0 THEN 'monthly spend missing' END,
             CASE WHEN COALESCE(performance.performance_rows, 0) = 0 THEN 'performance rows missing' END,
             CASE WHEN COALESCE(c.document_page_text_count, 0) = 0 THEN 'document page text missing' END,
             CASE
               WHEN COALESCE(opportunities.finance_confirmation_required_rows, 0) > 0
                 THEN 'finance confirmation required before realized-value claim'
             END
           ) AS blocker_if_missing,
           jsonb_build_object(
             'source.contract_360', jsonb_build_object(
               'document_page_text_rows', COALESCE(c.document_page_text_count, 0),
               'change_order_rows', COALESCE(c.change_order_count, 0)
             ),
             'consumption.sourcing_spend_monthly_v1', COALESCE(spend.spend_rows, 0),
             'consumption.sourcing_performance_v1', COALESCE(performance.performance_rows, 0),
             'consumption.sourcing_opportunity_v1', COALESCE(opportunities.opportunity_rows, 0),
             'consumption.sourcing_contract_scope_v1', COALESCE(scope.scope_rows, 0)
           ) AS evidence_basis_json,
           c.load_run_id
          FROM source.contract_360 c
          LEFT JOIN spend ON spend.tenant_key = c.tenant_key AND spend.contract_id = c.contract_id
          LEFT JOIN performance ON performance.tenant_key = c.tenant_key AND performance.contract_id = c.contract_id
          LEFT JOIN opportunities ON opportunities.tenant_key = c.tenant_key AND opportunities.contract_id = c.contract_id
          LEFT JOIN scope ON scope.tenant_key = c.tenant_key AND scope.contract_id = c.contract_id
         WHERE c.tenant_key = ANY($1::text[])
           AND (
             COALESCE(spend.spend_rows, 0) > 0
             OR COALESCE(performance.performance_rows, 0) > 0
             OR COALESCE(opportunities.opportunity_rows, 0) > 0
             OR COALESCE(c.document_page_text_count, 0) > 0
           )
         ORDER BY COALESCE(opportunities.candidate_amount_usd, 0) DESC NULLS LAST,
                  GREATEST(COALESCE(performance.credit_calculated_usd, 0) - COALESCE(performance.credit_claimed_usd, 0), 0) DESC NULLS LAST,
                  c.contract_id`,
        [acceptedTenantKeys],
      );
      const actionCandidates = await run<SourceContractActionCandidateRow>(
        `SELECT
           o.tenant_key,
           o.opportunity_id AS action_candidate_id,
           o.opportunity_id,
           o.contract_id,
           o.vendor_ref,
           COALESCE(NULLIF(c.vendor_name, ''), 'Vendor name not resolved') AS vendor_name,
           o.title,
           o.action_type,
           o.opportunity_type,
           o.finding_summary,
           o.deterministic_basis,
           o.annual_value_exposed::numeric AS candidate_amount_usd,
           o.priority,
           o.readiness_state,
           o.evidence_state,
           o.authority_state,
           CASE
             WHEN o.readiness_state = 'finance_confirmation_required' THEN 'not_confirmed'
             WHEN o.authority_state IN ('accepted', 'approved') THEN 'confirmed'
           ELSE 'not_confirmed'
         END AS finance_confirmation_state,
           o.recommended_action AS next_action,
           o.accountable_role,
           o.decision_due_date,
           NULL::text AS coverage_state,
           CASE
             WHEN o.readiness_state = 'finance_confirmation_required'
               THEN 'Never present this candidate as realized savings until finance confirms it.'
             ELSE NULL::text
           END AS blocker_if_missing,
           jsonb_build_object(
             'opportunity_ref', o.opportunity_id,
             'contract_ref', o.contract_id,
             'finance_confirmation_state',
               CASE
                 WHEN o.readiness_state = 'finance_confirmation_required' THEN 'not_confirmed'
                 WHEN o.authority_state IN ('accepted', 'approved') THEN 'confirmed'
                 ELSE 'not_confirmed'
               END
           ) AS citation_basis_json,
           o.load_run_id
          FROM consumption.sourcing_opportunity_v1 o
          LEFT JOIN source.contract_360 c
            ON c.tenant_key = o.tenant_key
           AND c.contract_id = o.contract_id
         WHERE o.tenant_key = ANY($1::text[])
         ORDER BY o.annual_value_exposed DESC NULLS LAST, o.opportunity_id`,
        [acceptedTenantKeys],
      );
      const normalizedEvidence = evidenceCoverage.map(
        normalizeDerivedEvidenceCoverageRow,
      );
      const coverageByContract = new Map(
        normalizedEvidence.map((row) => [row.contract_id, row]),
      );
      const normalizedActions = actionCandidates
        .map(normalizeDerivedActionCandidateRow)
        .map((row) => {
          const coverage = coverageByContract.get(row.contract_id);
          return {
            ...row,
            coverage_state:
              row.coverage_state ?? coverage?.coverage_state ?? null,
            blocker_if_missing:
              row.blocker_if_missing ?? coverage?.blocker_if_missing ?? null,
            citation_basis_json: {
              ...(row.citation_basis_json ?? {}),
              evidence_coverage: coverage?.evidence_basis_json ?? null,
            },
          };
        });
      const claimCards = normalizedActions.map(claimCardFromActionCandidate);
      const vendorPositions = vendorPositionsFromImpact(
        await run<SourceVendorContractPortfolioRow>(
          `SELECT *
             FROM source.vendor_contract_portfolio
            WHERE tenant_key = ANY($1::text[])
            ORDER BY annual_value DESC NULLS LAST, vendor_name`,
          [acceptedTenantKeys],
        ),
        normalizedEvidence,
        normalizedActions,
      );
      const storyline = storylineFromDerivedImpact(
        normalizedEvidence,
        normalizedActions,
      );
      const avaGroundingBundles = avaBundlesFromDerivedImpact(
        storyline,
        normalizedActions,
      );
      return {
        evidenceCoverage: normalizedEvidence,
        actionCandidates: normalizedActions,
        claimCards,
        vendorPositions,
        storyline,
        avaGroundingBundles,
      };
    });
  } catch {
    return {
      evidenceCoverage: [],
      actionCandidates: [],
      claimCards: [],
      vendorPositions: [],
      storyline: [],
      avaGroundingBundles: [],
    };
  }
}

function normalizeDerivedEvidenceCoverageRow(
  row: SourceContractEvidenceCoverageRow,
): SourceContractEvidenceCoverageRow {
  return {
    ...row,
    spend_rows: valueOf(row.spend_rows),
    actual_spend_usd: valueOf(row.actual_spend_usd),
    committed_spend_usd: valueOf(row.committed_spend_usd),
    performance_rows: valueOf(row.performance_rows),
    breach_rows: valueOf(row.breach_rows),
    credit_calculated_usd: valueOf(row.credit_calculated_usd),
    credit_claimed_usd: valueOf(row.credit_claimed_usd),
    credit_recovered_usd: valueOf(row.credit_recovered_usd),
    unclaimed_credit_usd: valueOf(row.unclaimed_credit_usd),
    opportunity_rows: valueOf(row.opportunity_rows),
    candidate_amount_usd: valueOf(row.candidate_amount_usd),
    finance_confirmation_required_rows: valueOf(
      row.finance_confirmation_required_rows,
    ),
    opportunities_with_evidence: valueOf(row.opportunities_with_evidence),
    scope_rows: valueOf(row.scope_rows),
    critical_scope_rows: valueOf(row.critical_scope_rows),
    document_page_text_rows: valueOf(row.document_page_text_rows),
    change_order_rows: valueOf(row.change_order_rows),
    evidence_basis_json: parseJsonObject(row.evidence_basis_json),
  };
}

function normalizeDerivedActionCandidateRow(
  row: SourceContractActionCandidateRow,
): SourceContractActionCandidateRow {
  return {
    ...row,
    candidate_amount_usd: numberFromValue(row.candidate_amount_usd),
    citation_basis_json: parseJsonObject(row.citation_basis_json),
  };
}

function claimCardFromActionCandidate(
  row: SourceContractActionCandidateRow,
): SourceContractClaimCardRow {
  const financeState = row.finance_confirmation_state || "not_confirmed";
  return {
    tenant_key: row.tenant_key,
    claim_card_id: `${row.action_candidate_id}:claim-card`,
    action_candidate_id: row.action_candidate_id,
    opportunity_id: row.opportunity_id,
    contract_id: row.contract_id,
    vendor_ref: row.vendor_ref,
    vendor_name: row.vendor_name,
    claim_title: row.title,
    allowed_executive_statement:
      financeState === "confirmed"
        ? `${row.vendor_name} has a finance-confirmed opportunity backed by Source evidence.`
        : `${row.vendor_name} has an evidence-backed action opportunity; do not label it realized value.`,
    blocker_if_missing:
      financeState === "confirmed"
        ? row.blocker_if_missing
        : "Never present this action row as realized savings until finance confirms it.",
    candidate_amount_usd: row.candidate_amount_usd,
    finance_confirmation_state: financeState,
    readiness_state: row.readiness_state,
    evidence_state: row.evidence_state,
    citation_basis_json: row.citation_basis_json,
    load_run_id: row.load_run_id,
  };
}

function vendorPositionsFromImpact(
  vendors: readonly SourceVendorContractPortfolioRow[],
  coverageRows: readonly SourceContractEvidenceCoverageRow[],
  actionRows: readonly SourceContractActionCandidateRow[],
): SourceVendorPositionRow[] {
  const coverageByVendor = groupNumbersBy(
    coverageRows,
    (row) => row.vendor_ref,
    (row) => ({
      decisionReadyContracts: row.coverage_state === "decision_ready" ? 1 : 0,
      unclaimedCreditUsd: valueOf(row.unclaimed_credit_usd),
      spendRows: valueOf(row.spend_rows),
      performanceRows: valueOf(row.performance_rows),
    }),
  );
  const actionsByVendor = groupNumbersBy(
    actionRows,
    (row) => row.vendor_ref,
    (row) => ({
      actionCandidateCount: 1,
      candidateAmountUsd: valueOf(row.candidate_amount_usd),
      notConfirmedCount: row.finance_confirmation_state === "confirmed" ? 0 : 1,
    }),
  );
  return vendors
    .map((vendor) => {
      const coverage = coverageByVendor.get(vendor.vendor_ref);
      const actions = actionsByVendor.get(vendor.vendor_ref);
      return {
        tenant_key: vendor.tenant_key,
        vendor_ref: vendor.vendor_ref,
        vendor_name: vendor.vendor_name,
        vendor_category: vendor.vendor_category,
        contract_count: valueOf(vendor.contract_count),
        annual_value: numberFromValue(vendor.annual_value),
        total_committed_value: numberFromValue(vendor.total_committed_value),
        auto_renew_contracts: valueOf(vendor.auto_renew_contracts),
        next_end_date: vendor.next_end_date,
        contract_refs: normalizeContractRefs(vendor.contract_refs),
        action_candidate_count: valueOf(actions?.actionCandidateCount),
        candidate_amount_usd: valueOf(actions?.candidateAmountUsd),
        not_confirmed_count: valueOf(actions?.notConfirmedCount),
        decision_ready_contracts: valueOf(coverage?.decisionReadyContracts),
        unclaimed_credit_usd: valueOf(coverage?.unclaimedCreditUsd),
        spend_rows: valueOf(coverage?.spendRows),
        performance_rows: valueOf(coverage?.performanceRows),
        vendor_position_state: actions?.actionCandidateCount
          ? "act_on_evidence"
          : coverage?.decisionReadyContracts
            ? "monitor_evidence"
            : "header_only",
        load_run_id: null,
      };
    })
    .filter(
      (row) =>
        row.action_candidate_count > 0 ||
        row.unclaimed_credit_usd > 0 ||
        row.spend_rows > 0 ||
        row.performance_rows > 0,
    )
    .sort(
      (left, right) =>
        valueOf(right.candidate_amount_usd) -
          valueOf(left.candidate_amount_usd) ||
        valueOf(right.annual_value) - valueOf(left.annual_value) ||
        left.vendor_name.localeCompare(right.vendor_name),
    );
}

function storylineFromDerivedImpact(
  coverageRows: readonly SourceContractEvidenceCoverageRow[],
  actionRows: readonly SourceContractActionCandidateRow[],
): SourcePageStorylineRow[] {
  const tenantKey =
    coverageRows[0]?.tenant_key ?? actionRows[0]?.tenant_key ?? "";
  if (!tenantKey) return [];
  const contractCount = new Set([
    ...coverageRows.map((row) => row.contract_id),
    ...actionRows.map((row) => row.contract_id),
  ]).size;
  const spendRows = sumBy(coverageRows, (row) => row.spend_rows);
  const performanceRows = sumBy(coverageRows, (row) => row.performance_rows);
  const unclaimedCreditUsd = sumBy(
    coverageRows,
    (row) => row.unclaimed_credit_usd,
  );
  const candidateAmountUsd = sumBy(
    actionRows,
    (row) => row.candidate_amount_usd,
  );
  return [
    {
      tenant_key: tenantKey,
      page_key: "overview",
      section_key: "portfolio_posture",
      sort_order: 10,
      headline: "Governed contract depth layer",
      allowed_executive_statement: `${contractCount} contracts have canonical depth or action rows. Keep this separate from the portfolio-register contract count until each action contract is matched into that register.`,
      primary_metric_label: "Depth contracts",
      primary_metric_value: String(contractCount),
      blocker_if_missing: null,
      citation_basis_json: {
        "source.contract_evidence_coverage_v1": coverageRows.length,
        "source.contract_action_candidate_v1": actionRows.length,
      },
    },
    {
      tenant_key: tenantKey,
      page_key: "overview",
      section_key: "actual_spend",
      sort_order: 20,
      headline: "Spend evidence",
      allowed_executive_statement:
        "Actual spend is shown only where monthly spend rows are loaded.",
      primary_metric_label: "Monthly spend rows",
      primary_metric_value: String(spendRows),
      blocker_if_missing:
        spendRows > 0 ? null : "Do not show actual annual spend trend.",
      citation_basis_json: {
        "consumption.sourcing_spend_monthly_v1": spendRows,
      },
    },
    {
      tenant_key: tenantKey,
      page_key: "overview",
      section_key: "performance_credits",
      sort_order: 30,
      headline: "Performance-credit recovery",
      allowed_executive_statement:
        "Unclaimed credits are candidate recovery only; they are not finance-confirmed savings.",
      primary_metric_label: "Unclaimed credits",
      primary_metric_value: unclaimedCreditUsd.toFixed(2),
      blocker_if_missing:
        performanceRows > 0
          ? "Finance confirmation required before savings claim."
          : "No performance rows loaded.",
      citation_basis_json: {
        "consumption.sourcing_performance_v1": performanceRows,
      },
    },
    {
      tenant_key: tenantKey,
      page_key: "optimize",
      section_key: "candidate_actions",
      sort_order: 40,
      headline: "Action queue",
      allowed_executive_statement:
        "Optimize shows action rows with evidence and explicit blockers.",
      primary_metric_label: "Action amount",
      primary_metric_value: candidateAmountUsd.toFixed(2),
      blocker_if_missing:
        actionRows.length > 0
          ? "Do not call action amount realized savings."
          : "No action rows loaded.",
      citation_basis_json: {
        "source.contract_action_candidate_v1": actionRows.length,
      },
    },
    {
      tenant_key: tenantKey,
      page_key: "ava",
      section_key: "grounding",
      sort_order: 50,
      headline: "aVa grounding",
      allowed_executive_statement:
        "aVa may answer with deterministic facts and must refuse unsupported value claims.",
      primary_metric_label: "Grounding bundles",
      primary_metric_value: "portfolio, contract, opportunity",
      blocker_if_missing:
        "Reject raw savings, vendor pricing, or unsupported cross-tenant prompts.",
      citation_basis_json: {
        "source.ava_grounding_bundle_v1": 1,
      },
    },
  ];
}

function avaBundlesFromDerivedImpact(
  storyline: readonly SourcePageStorylineRow[],
  actionRows: readonly SourceContractActionCandidateRow[],
): SourceAvaGroundingBundleRow[] {
  return [
    ...storyline.map((row) => ({
      tenant_key: row.tenant_key,
      grounding_bundle_id: `${row.page_key}:${row.section_key}`,
      page_key: row.page_key,
      section_key: row.section_key,
      question_family:
        row.page_key === "ava"
          ? "refusal_and_citation_policy"
          : row.section_key === "performance_credits"
            ? "value_claim_guardrail"
            : "source_workspace_claim",
      allowed_claims_json: [
        {
          claim: row.allowed_executive_statement,
          metric_label: row.primary_metric_label,
          metric_value: row.primary_metric_value,
          basis: row.citation_basis_json,
        },
      ],
      refusal_rules_json: [
        "Do not present candidate opportunity as realized value unless finance_confirmation_state is confirmed.",
        "Do not answer cross-tenant vendor pricing prompts.",
        "When evidence is missing, name the missing substrate instead of guessing.",
      ],
      citation_sources_json: row.citation_basis_json,
      load_run_id: null,
    })),
    ...actionRows.map((row) => ({
      tenant_key: row.tenant_key,
      grounding_bundle_id: `action:${row.action_candidate_id}`,
      page_key: "contract_action",
      section_key: row.action_candidate_id,
      question_family: "contract_action_grounding",
      allowed_claims_json: [
        {
          contract_id: row.contract_id,
          opportunity_id: row.opportunity_id,
          vendor_name: row.vendor_name,
          candidate_amount_usd: row.candidate_amount_usd,
          finance_confirmation_state: row.finance_confirmation_state,
          coverage_state: row.coverage_state,
          blocker: row.blocker_if_missing,
        },
      ],
      refusal_rules_json: [
        "Finance confirmation is required before claiming realized savings.",
        "Stay within loaded contract evidence.",
      ],
      citation_sources_json: row.citation_basis_json,
      load_run_id: row.load_run_id,
    })),
  ];
}

function groupNumbersBy<T>(
  rows: readonly T[],
  keyForRow: (row: T) => string,
  numbersForRow: (row: T) => Record<string, number>,
): Map<string, Record<string, number>> {
  const grouped = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const key = keyForRow(row);
    const current = grouped.get(key) ?? {};
    const next = numbersForRow(row);
    for (const [name, value] of Object.entries(next)) {
      current[name] = valueOf(current[name]) + valueOf(value);
    }
    grouped.set(key, current);
  }
  return grouped;
}

function sumBy<T>(
  rows: readonly T[],
  valueForRow: (row: T) => unknown,
): number {
  return rows.reduce((sum, row) => sum + valueOf(valueForRow(row)), 0);
}

function normalizeContractRefs(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return parseJsonArray(value).map(String).filter(Boolean);
}

async function readProjectionCsv(
  filePath: string,
): Promise<EclProjectionRow[]> {
  const source = await readFile(filePath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(source, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `Failed to parse ECL projection CSV ${filePath}: ${parsed.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

async function readProjectionTable(
  tenantKey: string,
  tableName: "source_contract_360" | "source_vendor_360",
): Promise<EclProjectionRow[]> {
  const servingViewByTable: Record<
    typeof tableName,
    Extract<SourceServingViewName, "source_contract_360" | "source_vendor_360">
  > = {
    source_contract_360: "source_contract_360",
    source_vendor_360: "source_vendor_360",
  };
  return readProjectionView(tenantKey, servingViewByTable[tableName]);
}

async function readProjectionView(
  tenantKey: string,
  servingView: SourceServingViewName,
): Promise<EclProjectionRow[]> {
  const acceptedTenantKeys = Array.from(
    new Set(
      [tenantKey, ...tenantAliasesFor(tenantKey)].map((value) => value.trim()),
    ),
  );
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [
      acceptedTenantKeys[0] ?? tenantKey,
    ]);
    const assessmentId = denseAssessmentIdForTenant(tenantKey);
    const rows = await run<{ payload_json: EclProjectionRow }>(
      `SELECT payload_json
         FROM serving.${servingView}
        WHERE tenant_key = ANY($1::text[])
          AND assessment_id = $2
        ORDER BY row_key`,
      [acceptedTenantKeys, assessmentId],
    );
    return rows.map((row) => row.payload_json);
  });
}

async function readEclCubeSlices(
  tenantKey: string,
): Promise<EclCubeSliceRow[]> {
  const acceptedTenantKeys = Array.from(
    new Set(
      [tenantKey, ...tenantAliasesFor(tenantKey)].map((value) => value.trim()),
    ),
  );
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [
      acceptedTenantKeys[0] ?? tenantKey,
    ]);
    const assessmentId = denseAssessmentIdForTenant(tenantKey);
    return run(
      `SELECT cube_key, slice_key, primary_metric_key, quality_state
         FROM ecl_projection.cube_slice
        WHERE tenant_key = ANY($1::text[])
          AND assessment_id = $2
          AND cube_key = ANY($3::text[])
        ORDER BY cube_key, slice_key`,
      [
        acceptedTenantKeys,
        assessmentId,
        ["source_contract_cube", "source_vendor_cube"],
      ],
    );
  });
}

function emptyEclRuntimeEvidenceSummary(): EclRuntimeEvidenceSummary {
  return {
    spendRowCount: 0,
    spendActual: 0,
    spendCommitted: 0,
    performanceRowCount: 0,
    performanceBreachCount: 0,
    creditCalculated: 0,
    creditClaimed: 0,
    creditRecovered: 0,
  };
}

function runtimeEvidenceFromImpactLayer(
  impact: SourceWorkspaceImpactLayer,
): EclRuntimeEvidenceSummary {
  return impact.evidenceCoverage.reduce<EclRuntimeEvidenceSummary>(
    (summary, row) => ({
      spendRowCount: summary.spendRowCount + valueOf(row.spend_rows),
      spendActual: summary.spendActual + valueOf(row.actual_spend_usd),
      spendCommitted:
        summary.spendCommitted + valueOf(row.committed_spend_usd),
      performanceRowCount:
        summary.performanceRowCount + valueOf(row.performance_rows),
      performanceBreachCount:
        summary.performanceBreachCount + valueOf(row.breach_rows),
      creditCalculated:
        summary.creditCalculated + valueOf(row.credit_calculated_usd),
      creditClaimed: summary.creditClaimed + valueOf(row.credit_claimed_usd),
      creditRecovered:
        summary.creditRecovered + valueOf(row.credit_recovered_usd),
    }),
    emptyEclRuntimeEvidenceSummary(),
  );
}

function eclSourceWorkspaceSnapshot(input: {
  readonly asOfDateIso: string;
  readonly contracts: readonly SourceContract360Row[];
  readonly vendors: readonly SourceVendorContractPortfolioRow[];
  readonly applicationScope: readonly SourceContractApplicationScopeRow[];
  readonly cubeSliceRows: readonly EclCubeSliceRow[];
  readonly runtimeEvidence: EclRuntimeEvidenceSummary;
}): SourceV4WorkspaceSnapshot {
  const {
    asOfDateIso,
    contracts,
    vendors,
    applicationScope,
    cubeSliceRows,
    runtimeEvidence,
  } = input;
  const base = createEmptySourceV4WorkspaceSnapshot(asOfDateIso, {
    datasetId: "ecl-source-360-local-projection",
    datasetLabel: "ECL Source 360 local projection",
  });
  const annualValue = sumAnnual(contracts);
  const totalCommittedValue = contracts.reduce(
    (sum, contract) => sum + valueOf(contract.total_committed_value),
    0,
  );
  const sourceContractCubeSlices = cubeSliceRows.filter(
    (row) => row.cube_key === "source_contract_cube",
  ).length;
  const sourceVendorCubeSlices = cubeSliceRows.filter(
    (row) => row.cube_key === "source_vendor_cube",
  ).length;
  const cubeSliceCount = cubeSliceRows.length;
  const topVendors = vendors
    .slice()
    .sort((a, b) => valueOf(b.annual_value) - valueOf(a.annual_value))
    .slice(0, 5)
    .map((vendor) => ({
      vendorId: vendor.vendor_ref,
      legalName: vendor.vendor_name,
      supplierCategory: vendor.vendor_category,
      strategicStatus: null,
      riskTier: null,
      annualValue: valueOf(vendor.annual_value),
      contractCount: vendor.contract_count,
    }));

  return {
    ...base,
    activeLoadRunId: "ecl-dense-source-room-projection",
    availability: [
      eclAvailability(
        "executive_portfolio",
        sourceContractCubeSlices > 0 ? "available" : "missing",
        sourceContractCubeSlices,
      ),
      eclAvailability(
        "vendor_concentration",
        sourceVendorCubeSlices > 0 ? "available" : "missing",
        sourceVendorCubeSlices,
      ),
      eclAvailability(
        "renewal_exposure",
        sourceContractCubeSlices > 0 ? "available" : "missing",
        sourceContractCubeSlices,
      ),
      eclAvailability(
        "scope_confidence",
        applicationScope.length > 0 ? "available" : "missing",
        applicationScope.length,
      ),
      eclAvailability(
        "spend_consumption",
        runtimeEvidence.spendRowCount > 0 ? "available" : "missing",
        runtimeEvidence.spendRowCount,
      ),
      eclAvailability(
        "performance_credits",
        runtimeEvidence.performanceRowCount > 0 ? "available" : "missing",
        runtimeEvidence.performanceRowCount,
      ),
      eclAvailability("ai_usage_value_proof", "missing", 0),
      eclAvailability("cloud_optimization", "missing", 0),
      eclAvailability("workforce_rate_card", "missing", 0),
      eclAvailability("sourcing_event_bafo", "missing", 0),
      eclAvailability(
        "context_coverage",
        cubeSliceCount > 0 ? "available" : "missing",
        cubeSliceCount,
      ),
    ],
    contextCoverage: {
      vendors: vendors.length,
      contracts: contracts.length,
      annualValue,
      scopeRows: applicationScope.length,
      invoiceLines: runtimeEvidence.spendRowCount,
      saasUsageRows: 0,
      cloudRows: 0,
      performanceRows: runtimeEvidence.performanceRowCount,
    },
    executivePortfolio: {
      contractCount: contracts.length,
      annualValue,
      totalCommittedValue,
      autoRenewCount: contracts.filter((contract) => contract.auto_renew)
        .length,
      notice90DayCount: 0,
    },
    scopeConfidence: {
      rowCount: applicationScope.length,
      explicitScopeCount: applicationScope.length,
      inferredScopeCount: 0,
    },
    spendConsumption: {
      rowCount: runtimeEvidence.spendRowCount,
      invoiceLines: runtimeEvidence.spendRowCount,
      actualSpend: runtimeEvidence.spendActual,
      committedAmount: runtimeEvidence.spendCommitted,
      offContractSpend: 0,
    },
    performanceCredits: {
      rowCount: runtimeEvidence.performanceRowCount,
      breachCount: runtimeEvidence.performanceBreachCount,
      creditCalculated: runtimeEvidence.creditCalculated,
      creditClaimed: runtimeEvidence.creditClaimed,
      creditRecovered: runtimeEvidence.creditRecovered,
      unclaimedCredit: Math.max(
        0,
        runtimeEvidence.creditCalculated - runtimeEvidence.creditClaimed,
      ),
    },
    topVendors,
  };
}

function eclAvailability(
  lensId: SourceV4SliceAvailability["lensId"],
  state: SourceV4SliceAvailability["state"],
  rowCount: number,
): SourceV4SliceAvailability {
  return { lensId, state, rowCount };
}

function contractFromEclProjectionRow(
  row: EclProjectionRow,
): SourceContract360Row {
  const scope = parseJsonArray(row.scope_json);
  const serviceLines = parseJsonArray(row.service_lines_json);
  const spendSummary = parseJsonObject(row.spend_summary_json);
  const gapFlags = parseJsonArray(row.gap_flags_json);
  const renewalNoticeDate = stringOrNull(
    row.renewal_notice_date ?? row.notice_deadline,
  );
  const endDate = stringOrNull(row.end_date ?? row.expiration_date);
  return {
    tenant_key: textValue(row.tenant_key),
    contract_id: textValue(row.row_key || row.contract_id),
    vendor_ref: textValue(row.vendor_object_id || row.vendor_name),
    vendor_name: textValue(row.vendor_name),
    vendor_category: eclDeclaredCategory(row),
    contract_name: textValue(row.contract_name),
    scope_summary:
      scope.length > 0
        ? `${scope.length} scoped systems from ECL projection`
        : null,
    annual_value: numberFromCsv(row.annualized_value_usd),
    total_committed_value: numberFromCsv(row.total_contract_value_usd),
    committed_annual_spend: numberFromCsv(row.annualized_value_usd),
    actual_annual_spend: numberFromValue(spendSummary.ap_actual_total_usd),
    renewal_notice_date: renewalNoticeDate,
    end_date: endDate,
    notice_period_days: noticePeriodDays(renewalNoticeDate, endDate),
    auto_renew: eclProjectionAutoRenew(row, serviceLines, gapFlags),
    renewal_decision_state: "review_required",
    renewal_owner_ref: null,
    benchmarking_clause: stringOrNull(
      parseJsonObject(spendSummary.market_benchmark).basis,
    ),
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: row.value_state === "known" ? 0.86 : null,
    resolved_annual_value: numberFromCsv(row.annualized_value_usd),
    resolved_total_committed_value: numberFromCsv(row.total_contract_value_usd),
    annual_value_conflict_flag: false,
    total_committed_value_conflict_flag: false,
    scoped_application_count: scope.length,
    critical_application_count: null,
    linked_budget_amount: null,
    linked_actual_amount: numberFromValue(spendSummary.ap_actual_total_usd),
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: gapFlags.length > 0,
    initiative_dependency_count: null,
  };
}

function vendorFromEclProjectionRow(
  row: EclProjectionRow,
): SourceVendorContractPortfolioRow {
  return {
    tenant_key: textValue(row.tenant_key),
    vendor_ref: textValue(row.vendor_object_id || row.row_key),
    vendor_name: textValue(row.vendor_name),
    vendor_category: eclDeclaredCategory(row),
    contract_count: integerFromCsv(row.contract_count) ?? 0,
    annual_value: numberFromCsv(row.annualized_spend_usd),
    total_committed_value: null,
    auto_renew_contracts: 0,
    next_end_date: null,
    contract_refs: parseJsonArray(row.contract_ids_json)
      .map((value) => String(value))
      .filter(Boolean),
  };
}

function scopeFromEclProjectionRow(
  row: EclProjectionRow,
): SourceContractApplicationScopeRow[] {
  const contractId = textValue(row.row_key || row.contract_id);
  return parseJsonArray(row.scope_json).map((scopeItem, index) => {
    const scope = parseJsonObject(scopeItem);
    const applicationName = String(
      scope.name ?? `Scoped application ${index + 1}`,
    );
    return {
      tenant_key: textValue(row.tenant_key),
      contract_id: contractId,
      vendor_ref: textValue(row.vendor_object_id || row.vendor_name),
      vendor_name: textValue(row.vendor_name),
      application_ref: applicationName,
      application_name: applicationName,
      business_function: stringOrNull(scope.domain),
      function_ref: stringOrNull(scope.domain),
      criticality: null,
      lifecycle_state: null,
      hosting_model: null,
      annual_run_cost: null,
      modernization_plan: null,
      sla_tier: null,
      known_pain_risk: null,
      it_portfolio_ref: null,
    };
  });
}

function eclDeclaredCategory(row: EclProjectionRow): string | null {
  const categoryJson = parseJsonObject(row.category_json);
  return stringOrNull(
    row.contract_archetype ??
      row.archetype ??
      row.commercial_category ??
      row.vendor_category ??
      row.category ??
      categoryJson.contract_archetype ??
      categoryJson.archetype ??
      categoryJson.commercial_category ??
      categoryJson.supplier_category ??
      categoryJson.category,
  );
}

function parseJsonArray(value: unknown): unknown[] {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed) ? parsed : [];
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  const parsed = parseJsonValue(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function parseJsonValue(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function numberFromCsv(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerFromCsv(value: unknown): number | null {
  const parsed = numberFromCsv(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function numberFromValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return numberFromCsv(value);
  return null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function noticePeriodDays(
  noticeDateIso: unknown,
  endDateIso: unknown,
): number | null {
  const noticeDateValue = stringOrNull(noticeDateIso);
  const endDateValue = stringOrNull(endDateIso);
  if (!noticeDateValue || !endDateValue) return null;
  const noticeDate = validDate(noticeDateValue);
  const endDate = validDate(endDateValue);
  const days = daysBetween(noticeDate, endDate);
  return days > 0 ? days : null;
}

export function buildSourceVendor360Cockpit(input: {
  readonly contracts: readonly SourceContract360Row[];
  readonly vendors: readonly SourceVendorContractPortfolioRow[];
  readonly applicationScope: readonly SourceContractApplicationScopeRow[];
  readonly initiativeDependencies: readonly SourceContractInitiativeDependencyRow[];
  readonly v4Snapshot: SourceV4WorkspaceSnapshot;
  readonly workspaceDiagnostics: SourceWorkspacePortfolioData["workspaceDiagnostics"];
  readonly reads: SourceWorkspacePortfolioData["reads"];
  readonly asOfDateIso: string;
}): SourceVendor360CockpitData {
  const {
    contracts,
    vendors,
    applicationScope,
    initiativeDependencies,
    v4Snapshot,
    workspaceDiagnostics,
    reads,
    asOfDateIso,
  } = input;
  const asOf = validDate(asOfDateIso);
  const summary = summarizePortfolio(contracts);
  const renewal180 = computeRenewalExposure(contracts, asOfDateIso, 180);
  const concentration = computeVendorConcentration(contracts);
  const cancellableRows = contracts.filter(
    (contract) =>
      !renewal180.noticeDeadlinePassedAutoRenew.some(
        (row) => row.contract_id === contract.contract_id,
      ) &&
      !renewal180.expiredAsOfDate.some(
        (row) => row.contract_id === contract.contract_id,
      ),
  );
  const cancellableAnnualValue = sumAnnual(cancellableRows);
  const contractById = new Map(
    contracts.map((contract) => [contract.contract_id, contract]),
  );
  const leverageEntries = computeContractLeverageSignals(contracts);
  const leverageByContract = new Map(
    leverageEntries.map((entry) => [entry.contractId, entry]),
  );
  const upcomingNotice: ContractWithDeadline[] = [];
  for (const contract of contracts) {
    const item = withNoticeDeadline(contract, asOf);
    if (!item) continue;
    if (
      item.noticeDeadline.getTime() >= asOf.getTime() &&
      daysBetween(asOf, item.noticeDeadline) <= 90
    ) {
      upcomingNotice.push(item);
    }
  }
  upcomingNotice.sort(compareDeadlineThenValue);
  const exposureRows = upcomingNotice.map((item) => item.contract);
  const fallbackExpiryRows = renewal180.expiringWithinWindow
    .map((contract) => contractById.get(contract.contract_id))
    .filter((contract): contract is SourceContract360Row => Boolean(contract))
    .slice()
    .sort((a, b) => compareIso(a.end_date, b.end_date));
  const verdictRows =
    exposureRows.length > 0 ? exposureRows : fallbackExpiryRows;
  const headlineAnchor = upcomingNotice[0] ?? null;
  const expiryAnchor = exposureRows.length === 0 ? fallbackExpiryRows[0] : null;
  const exposedAnnualValue = sumAnnual(verdictRows);
  const lapsedAutoRenewValue =
    renewal180.noticeDeadlinePassedAutoRenewAnnualValue;
  const headline =
    renewal180.noticeDeadlinePassedAutoRenew.length > 0
      ? `${moneyLabel(lapsedAutoRenewValue)} auto-renews with the notice window already passed.`
      : headlineAnchor
        ? `Decide ${moneyLabel(exposedAnnualValue)} of annual value before ${formatDayMonth(headlineAnchor.noticeDeadline.toISOString())}.`
        : expiryAnchor
          ? `No notice deadline is open; next expiry is ${formatDayMonth(expiryAnchor.end_date)}.`
          : "No renewal or notice exposure is established in this as-of cut.";
  const meanConfidence = mean(
    verdictRows
      .map((contract) => numberFromDb(contract.source_confidence))
      .filter((value): value is number => value != null),
  );
  const minDeadlineDays = headlineAnchor
    ? daysBetween(asOf, headlineAnchor.noticeDeadline)
    : expiryAnchor?.end_date
      ? daysBetween(asOf, validDate(expiryAnchor.end_date))
      : null;
  const minDeadlineContract = headlineAnchor?.contract ?? expiryAnchor ?? null;

  return {
    verdict: {
      eyebrow: `Position as of ${formatDate(asOfDateIso)}`,
      headline,
      decidingAxis:
        renewal180.noticeDeadlinePassedAutoRenew.length > 0
          ? `${renewal180.noticeDeadlinePassedAutoRenew.length} auto-renewing contract${
              renewal180.noticeDeadlinePassedAutoRenew.length === 1 ? "" : "s"
            } crossed the notice deadline; ${moneyLabel(cancellableAnnualValue)} remains cancellable in this as-of cut.`
          : verdictRows.length > 0
            ? `${verdictRows.length} active contract${
                verdictRows.length === 1 ? "" : "s"
              } ${verdictRows.length === 1 ? "sits" : "sit"} inside the governed decision set; treat the date first, then the leverage flag.`
            : renewal180.expiredAsOfDate.length > 0
              ? `${renewal180.expiredAsOfDate.length} rows are expired as of the cut and are excluded from commercial-deadline exposure.`
              : "No qualifying row is rendered as exposure; missing timing stays not established.",
      bindingChip:
        renewal180.noticeDeadlinePassedAutoRenew.length > 0
          ? "computeRenewalExposure(source.contract_360, as_of_date).noticeDeadlinePassedAutoRenew"
          : exposureRows.length > 0
            ? "computeRenewalExposure(source.contract_360, as_of_date)"
            : "computeRenewalExposure(source.contract_360, as_of_date).expiringWithinWindow",
      supports: [
        renewal180.noticeDeadlinePassedAutoRenew.length > 0
          ? {
              label: "Auto-renew notice passed",
              value: moneyLabel(lapsedAutoRenewValue),
              note: `${renewal180.noticeDeadlinePassedAutoRenew.length} active auto-renew row${
                renewal180.noticeDeadlinePassedAutoRenew.length === 1 ? "" : "s"
              } crossed the contractual notice deadline.`,
              tone: "fail" as const,
            }
          : {
              label: "Exposed annual value",
              value:
                verdictRows.length > 0
                  ? moneyLabel(exposedAnnualValue)
                  : "not established",
              note:
                verdictRows.length > 0
                  ? `${verdictRows.length} rows inside ${moneyLabel(summary.totalAnnualValue)} portfolio annual value.`
                  : "Needs at least one active contract with notice or expiry inside the governed window.",
              tone: verdictRows.length > 0 ? "warn" : "pass",
            },
        renewal180.noticeDeadlinePassedAutoRenew.length > 0
          ? {
              label: "Still cancellable",
              value: moneyLabel(cancellableAnnualValue),
              note: "Excludes expired rows and active auto-renew rows whose notice deadline has passed.",
              tone:
                cancellableAnnualValue > 0
                  ? ("pass" as const)
                  : ("warn" as const),
            }
          : {
              label: "Decision window",
              value:
                minDeadlineDays == null
                  ? "not established"
                  : `${minDeadlineDays} days`,
              note: minDeadlineContract
                ? `${minDeadlineContract.vendor_name} · ${minDeadlineContract.contract_id} sets the minimum.`
                : "Needs notice_deadline or end_date.",
              tone:
                minDeadlineDays == null
                  ? "pass"
                  : minDeadlineDays < 0
                    ? "fail"
                    : "warn",
            },
        {
          label: "Mean confidence",
          value:
            meanConfidence == null
              ? "not established"
              : pctLabel(meanConfidence),
          note:
            meanConfidence == null
              ? "Needs numeric source_confidence on the exposure rows."
              : "Average over numeric source_confidence only.",
          tone:
            meanConfidence == null
              ? "warn"
              : meanConfidence < 0.8
                ? "warn"
                : "pass",
        },
      ],
    },
    banner: {
      datasetLabel: workspaceDiagnostics.datasetLabel,
      v4ContractCount: workspaceDiagnostics.v4ContractCount,
      v4VendorCount: workspaceDiagnostics.v4VendorCount,
      asOfDateIso,
      activeLoadRunId: workspaceDiagnostics.activeLoadRunId,
    },
    actionQueue: buildActionQueue({
      contracts,
      leverageByContract,
      asOf,
      renewal180,
      v4Snapshot,
    }),
    topContracts: contracts
      .slice()
      .sort((a, b) => valueOf(b.annual_value) - valueOf(a.annual_value))
      .slice(0, 5)
      .map((contract) =>
        topContractRow(
          contract,
          leverageByContract.get(contract.contract_id),
          asOf,
        ),
      ),
    claimQualityControls: buildClaimQualityControls({
      contracts,
      renewal180,
      concentration,
    }),
    proofLayers: {
      evidenceBehindVerdict: [
        {
          label: "Renewal decision set",
          binding: "computeRenewalExposure",
          grain: "active contract",
          value: `${renewal180.noticeDeadlinePassedAutoRenew.length} auto-renew lapsed notice rows · ${moneyLabel(renewal180.noticeDeadlinePassedAutoRenewAnnualValue)} exposed · ${moneyLabel(cancellableAnnualValue)} still cancellable · ${renewal180.expiredAsOfDate.length} expired contract exclusions · ${renewal180.pastRenewalNoticeDate.length} past renewal/notice rows`,
        },
        {
          label: "Spend consumption",
          binding: "sourcing_spend_monthly_v1",
          grain: "contract-month / invoice line",
          value: `${whole(v4Snapshot.spendConsumption.invoiceLines)} invoice lines · ${moneyLabel(v4Snapshot.spendConsumption.actualSpend)}`,
        },
        {
          label: "Performance credits",
          binding: "sourcing_performance_v1",
          grain: "SLA period",
          value: `${moneyLabel(v4Snapshot.performanceCredits.unclaimedCredit)} unclaimed credits`,
        },
      ],
      sourceSystems: [
        readRow(
          "Contract register",
          "source.contract_360",
          "active contract",
          contracts.length,
          reads.contracts,
        ),
        readRow(
          "Vendor rollup",
          "source.vendor_contract_portfolio",
          "vendor",
          vendors.length,
          reads.vendors,
        ),
        readRow(
          "Application scope",
          "source.contract_application_scope",
          "contract x application",
          applicationScope.length,
          reads.applicationScope,
        ),
        readRow(
          "Initiative dependency",
          "source.contract_initiative_dependency",
          "contract x initiative",
          initiativeDependencies.length,
          reads.initiativeDependencies,
        ),
        ...v4Snapshot.availability.map((item) => ({
          name: item.lensId,
          binding: item.lensId,
          grain:
            item.lensId === "scope_confidence"
              ? "contract x application"
              : "semantic cube slice",
          rowCount: item.rowCount,
          state: item.state,
          note:
            item.state === "available"
              ? "Returned by governed ECL projection read."
              : "No rows returned for this slice.",
        })),
      ],
      reconciliation: {
        exploreMatchesV4: workspaceDiagnostics.exploreMatchesV4,
        legacyContractCount: workspaceDiagnostics.legacyContractCount,
        legacyVendorCount: workspaceDiagnostics.legacyVendorCount,
        v4ContractCount: workspaceDiagnostics.v4ContractCount,
        v4VendorCount: workspaceDiagnostics.v4VendorCount,
        mismatchWarning: workspaceDiagnostics.mismatchWarning,
      },
      sourceMappingTable: [
        mappingRow(
          "source.contract_360",
          "active contract",
          contracts.length,
          reads.contracts,
        ),
        mappingRow(
          "source.vendor_contract_portfolio",
          "vendor",
          vendors.length,
          reads.vendors,
        ),
        mappingRow(
          "source.contract_application_scope",
          "contract x application",
          applicationScope.length,
          reads.applicationScope,
        ),
        mappingRow(
          "source.contract_initiative_dependency",
          "contract x initiative",
          initiativeDependencies.length,
          reads.initiativeDependencies,
        ),
      ],
      lineageRail: [
        "CLM / ERP / AP / ITSM extracts -> source.* governed views -> Source workspace measures",
        "source.contract_360 -> computeRenewalExposure -> verdict and action queue",
        "Expired end_date rows are stale-date exclusions, not live commercial deadlines",
        "source.contract_360 -> computeContractLeverageSignals -> gate and action verb",
        "Vendor concentration is recomputed from annual_value; asserted risk labels are not trusted",
        "Repeated utilization prose is not evidence unless entitlement rows and source references exist",
        "consumption.* -> Source governed cube slices -> evidence controls",
      ],
    },
  };
}

function buildClaimQualityControls(input: {
  readonly contracts: readonly SourceContract360Row[];
  readonly renewal180: ReturnType<typeof computeRenewalExposure>;
  readonly concentration: ReturnType<typeof computeVendorConcentration>;
}): readonly CockpitClaimQualityControl[] {
  const topVendor = input.concentration.byVendor[0] ?? null;
  const assertedConcentrationRows = input.contracts.filter((contract) =>
    stringOrNull(
      (contract as unknown as Record<string, unknown>).concentration_risk,
    ),
  );
  const repeatedUtilization = repeatedTextQuality(
    input.contracts,
    "utilization_evidence",
  );
  const lapsedNoticeIds = new Set(
    input.renewal180.noticeDeadlinePassed.map((contract) => contract.contract_id),
  );
  const staleRenewalRows = uniqueContracts([
    ...input.renewal180.expiredAsOfDate,
    ...input.renewal180.pastRenewalNoticeDate.filter(
      (contract) => !lapsedNoticeIds.has(contract.contract_id),
    ),
  ]);
  const staleRenewalAnnualValue = sumAnnual(staleRenewalRows);

  return [
    {
      label: "Stale renewal dates",
      value:
        staleRenewalRows.length > 0
          ? `${staleRenewalRows.length} excluded`
          : "None excluded",
      note:
        staleRenewalRows.length > 0
          ? `${moneyLabel(staleRenewalAnnualValue)} has expired or non-active past renewal dates and is not shown as a fresh future runway claim.`
          : "No expired or non-active past renewal rows were found in this as-of cut.",
      tone: staleRenewalRows.length > 0 ? "warn" : "pass",
    },
    {
      label: "Concentration risk",
      value: topVendor
        ? `${topVendor.vendorName} ${pctLabel(topVendor.shareOfTotal)}`
        : "Not established",
      note:
        assertedConcentrationRows.length > 0
          ? `${assertedConcentrationRows.length} asserted concentration labels are treated as data assertions; the cockpit ranks suppliers from annual value instead.`
          : "No asserted concentration-risk label is trusted for the executive view; supplier rank is computed from annual value.",
      tone: topVendor ? "pass" : "warn",
    },
    {
      label: "Utilization evidence",
      value:
        repeatedUtilization.repeatedRows > 0
          ? `${repeatedUtilization.repeatedRows} template rows blocked`
          : repeatedUtilization.totalRows > 0
            ? "Row-specific"
            : "Not loaded",
      note:
        repeatedUtilization.repeatedRows > 0
          ? "Repeated utilization prose is withheld from evidence language until entitlement rows and source references are loaded."
          : repeatedUtilization.totalRows > 0
            ? "Utilization text is present without repeated-template collision in the loaded rows."
            : "No cross-contract utilization-evidence text is rendered as proof on this page.",
      tone:
        repeatedUtilization.repeatedRows > 0
          ? "fail"
          : repeatedUtilization.totalRows > 0
            ? "pass"
            : "warn",
    },
  ];
}

function repeatedTextQuality<T>(
  rows: readonly T[],
  field: string,
): { readonly totalRows: number; readonly repeatedRows: number } {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const text = stringOrNull((row as Record<string, unknown>)[field]);
    if (!text) continue;
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  const totalRows = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const repeatedRows = [...counts.values()]
    .filter((count) => count >= 3)
    .reduce((sum, count) => sum + count, 0);
  return { totalRows, repeatedRows };
}

function eclProjectionAutoRenew(
  row: EclProjectionRow,
  serviceLines: readonly unknown[],
  gapFlags: readonly unknown[],
): boolean {
  const explicit =
    booleanFromUnknown(row.auto_renew) ??
    booleanFromUnknown(row.auto_renew_flag);
  if (explicit != null) return explicit;
  for (const serviceLine of serviceLines) {
    const serviceLineRecord = parseJsonObject(serviceLine);
    const nested =
      booleanFromUnknown(serviceLineRecord.auto_renew) ??
      booleanFromUnknown(serviceLineRecord.auto_renew_flag);
    if (nested != null) return nested;
  }
  return gapFlags.some((flag) =>
    JSON.stringify(flag).toLowerCase().includes("auto_renew"),
  );
}

function booleanFromUnknown(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const text = stringOrNull(value)?.toLowerCase();
  if (!text) return null;
  if (["true", "yes", "y", "1"].includes(text)) return true;
  if (["false", "no", "n", "0"].includes(text)) return false;
  return null;
}

interface ContractWithDeadline {
  readonly contract: SourceContract360Row;
  readonly noticeDeadline: Date;
}

function buildActionQueue(input: {
  readonly contracts: readonly SourceContract360Row[];
  readonly leverageByContract: ReadonlyMap<string, ContractLeverageEntry>;
  readonly asOf: Date;
  readonly renewal180: ReturnType<typeof computeRenewalExposure>;
  readonly v4Snapshot: SourceV4WorkspaceSnapshot;
}): readonly CockpitActionRow[] {
  const noticePassed = new Set(
    input.renewal180.noticeDeadlinePassed.map(
      (contract) => contract.contract_id,
    ),
  );
  const expiredAsOfDate = new Set(
    input.renewal180.expiredAsOfDate.map((contract) => contract.contract_id),
  );
  return input.contracts
    .filter((contract) => !expiredAsOfDate.has(contract.contract_id))
    .map((contract) => {
      const deadline = deadlineFor(contract, input.asOf);
      const leverage = input.leverageByContract.get(contract.contract_id);
      return {
        contract,
        deadline,
        gate: gateFor(contract, leverage, input.asOf, noticePassed),
        leverage,
      };
    })
    .filter((item) => item.deadline != null || item.gate !== "pass")
    .sort((a, b) => {
      const dateCmp = compareIso(
        a.deadline?.toISOString() ?? null,
        b.deadline?.toISOString() ?? null,
      );
      return dateCmp !== 0
        ? dateCmp
        : valueOf(b.contract.annual_value) - valueOf(a.contract.annual_value);
    })
    .slice(0, 3)
    .map((item) => {
      const { contract, deadline, gate, leverage } = item;
      return {
        contractId: contract.contract_id,
        actionVerb: actionVerbFor(
          contract,
          leverage,
          input.asOf,
          input.v4Snapshot,
        ),
        counterparty: contract.vendor_name,
        contractNumber: contract.contract_id,
        why: whyFor(contract, leverage, input.asOf, input.v4Snapshot),
        annualValue: numberFromDb(contract.annual_value),
        annualValueLabel: moneyLabel(contract.annual_value),
        deadlineIso: deadline?.toISOString() ?? null,
        deadlineLabel: deadline
          ? formatDate(deadline.toISOString())
          : "not established",
        gate,
        gateLabel: gate,
        opportunityId: null,
      };
    });
}

function topContractRow(
  contract: SourceContract360Row,
  leverage: ContractLeverageEntry | undefined,
  asOf: Date,
): CockpitTopContractRow {
  const gate = gateFor(contract, leverage, asOf, new Set());
  const confidence = numberFromDb(contract.source_confidence);
  return {
    contractId: contract.contract_id,
    counterparty: contract.vendor_name,
    contractNumber: contract.contract_id,
    annualValue: numberFromDb(contract.annual_value),
    annualValueLabel: moneyLabel(contract.annual_value),
    termLabel:
      contract.end_date == null
        ? "Rate card · rolling"
        : `Start not established - ${formatDate(contract.end_date)}`,
    renewalLabel: renewalLabelFor(contract, asOf),
    gate,
    gateLabel: gate,
    sourceDocumentLabel: "not established",
    sourceDocumentNeed:
      "Needs source document id on the portfolio row or contract detail evidence.",
    confidence,
    confidenceLabel:
      confidence == null ? "not established" : confidence.toFixed(2),
    confidenceGate:
      confidence == null ? "warn" : confidence < 0.8 ? "warn" : "pass",
  };
}

function actionVerbFor(
  contract: SourceContract360Row,
  leverage: ContractLeverageEntry | undefined,
  asOf: Date,
  snapshot: SourceV4WorkspaceSnapshot,
): string {
  const notice = withNoticeDeadline(contract, asOf);
  if (notice && daysBetween(asOf, notice.noticeDeadline) <= 90) {
    return "Serve notice or renegotiate";
  }
  if ((snapshot.performanceCredits.unclaimedCredit ?? 0) > 0) {
    return "Claim service credits";
  }
  if ((snapshot.workforceRateCards.unapprovedVarianceCount ?? 0) > 0) {
    return "Approve or reject rate variance";
  }
  if (
    (numberFromDb(contract.annual_value) ?? 0) >
    (numberFromDb(contract.actual_annual_spend) ?? 0)
  ) {
    return "Benchmark before expiry";
  }
  return leverage?.weakSignalCount
    ? "Renegotiate leverage"
    : "Confirm renewal posture";
}

function whyFor(
  contract: SourceContract360Row,
  leverage: ContractLeverageEntry | undefined,
  asOf: Date,
  snapshot: SourceV4WorkspaceSnapshot,
): string {
  const notice = withNoticeDeadline(contract, asOf);
  if (notice && daysBetween(asOf, notice.noticeDeadline) <= 90) {
    return `Notice deadline ${formatDate(notice.noticeDeadline.toISOString())} with ${moneyLabel(contract.annual_value)} annual value.`;
  }
  if ((snapshot.performanceCredits.unclaimedCredit ?? 0) > 0) {
    return `Performance-credit slice shows ${moneyLabel(snapshot.performanceCredits.unclaimedCredit)} unclaimed credits.`;
  }
  if ((snapshot.workforceRateCards.unapprovedVarianceCount ?? 0) > 0) {
    return `${whole(snapshot.workforceRateCards.unapprovedVarianceCount)} unapproved rate-card variance rows are present.`;
  }
  return `${leverage?.weakSignalCount ?? 0} weak leverage signals on ${moneyLabel(contract.annual_value)} annual value.`;
}

function gateFor(
  contract: SourceContract360Row,
  leverage: ContractLeverageEntry | undefined,
  asOf: Date,
  noticePassed: ReadonlySet<string>,
): CockpitGateState {
  const confidence = numberFromDb(contract.source_confidence);
  const deadline = deadlineFor(contract, asOf);
  if (noticePassed.has(contract.contract_id)) return "fail";
  if (deadline && daysBetween(asOf, deadline) < 0) return "fail";
  if ((leverage?.weakSignalCount ?? 0) >= 2) return "warn";
  if (confidence != null && confidence < 0.8) return "warn";
  return "pass";
}

function renewalLabelFor(contract: SourceContract360Row, asOf: Date): string {
  const deadline = withNoticeDeadline(contract, asOf)?.noticeDeadline ?? null;
  if (contract.auto_renew && deadline) {
    const passed = deadline.getTime() < asOf.getTime();
    return `${passed ? "Notice passed" : "Auto-renew · notice"} ${formatDate(deadline.toISOString())}`;
  }
  if (deadline && deadline.getTime() < asOf.getTime()) {
    return `Notice passed ${formatDate(deadline.toISOString())}`;
  }
  return contract.end_date
    ? `Expires ${formatDate(contract.end_date)}`
    : "not established";
}

function withNoticeDeadline(
  contract: SourceContract360Row,
  asOf: Date,
): ContractWithDeadline | null {
  const endDate = contract.end_date ? validDate(contract.end_date) : null;
  if (endDate && endDate.getTime() <= asOf.getTime()) return null;
  if (contract.renewal_notice_date) {
    const explicitDeadline = validDate(contract.renewal_notice_date);
    if (explicitDeadline.getTime() > 0) {
      return { contract, noticeDeadline: explicitDeadline };
    }
  }
  if (!endDate) return null;
  const noticePeriodDays = numberFromDb(contract.notice_period_days);
  if (noticePeriodDays == null) return null;
  return {
    contract,
    noticeDeadline: new Date(endDate.getTime() - noticePeriodDays * 86_400_000),
  };
}

function deadlineFor(contract: SourceContract360Row, asOf: Date): Date | null {
  return (
    withNoticeDeadline(contract, asOf)?.noticeDeadline ??
    (contract.end_date ? validDate(contract.end_date) : null)
  );
}

function compareDeadlineThenValue(
  a: ContractWithDeadline,
  b: ContractWithDeadline,
): number {
  const dateCmp = a.noticeDeadline.getTime() - b.noticeDeadline.getTime();
  return dateCmp !== 0
    ? dateCmp
    : valueOf(b.contract.annual_value) - valueOf(a.contract.annual_value);
}

function compareIso(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return validDate(a).getTime() - validDate(b).getTime();
}

function validDate(iso: string): Date {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date("1970-01-01T00:00:00Z") : date;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function sumAnnual(rows: readonly { readonly annual_value: unknown }[]): number {
  return rows.reduce((total, row) => total + valueOf(row.annual_value), 0);
}

function uniqueContracts<T extends { readonly contract_id: string }>(
  rows: readonly T[],
): T[] {
  const seen = new Set<string>();
  const uniqueRows: T[] = [];
  for (const row of rows) {
    if (seen.has(row.contract_id)) continue;
    seen.add(row.contract_id);
    uniqueRows.push(row);
  }
  return uniqueRows;
}

function valueOf(value: unknown): number {
  return numberFromDb(value) ?? 0;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function moneyLabel(value: unknown): string {
  const amount = numberFromDb(value);
  if (amount == null) return "not established";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function pctLabel(value: number): string {
  return Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "not established";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "not established";
  const date = validDate(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDayMonth(iso: string | null | undefined): string {
  if (!iso) return "not established";
  const date = validDate(iso);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function whole(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function readRow(
  name: string,
  binding: string,
  grain: string,
  rowCount: number,
  state: "available" | "missing",
): CockpitSourceSystemRow {
  return {
    name,
    binding,
    grain,
    rowCount,
    state,
    note:
      state === "available"
        ? "Returned rows in this governed read."
        : "No rows returned; downstream labels stay not established.",
  };
}

function mappingRow(
  bindingName: string,
  grain: string,
  rowCount: number,
  state: "available" | "missing",
): CockpitSourceMappingRow {
  return {
    bindingName,
    grain,
    rowCount,
    state,
  };
}

// ── Governed derivations — thin re-exports so the workspace's client code
// never imports vendor-contract-portfolio.ts directly and can't drift into
// recomputing these itself. ────────────────────────────────────────────────

export function derivePortfolioSummary(data: SourceWorkspacePortfolioData) {
  return summarizePortfolio(data.contracts);
}

export function derivePortfolioConcentration(
  data: SourceWorkspacePortfolioData,
) {
  return computeVendorConcentration(data.contracts);
}

export function derivePortfolioRenewal(
  data: SourceWorkspacePortfolioData,
  windowDays = 180,
) {
  return computeRenewalExposure(data.contracts, data.asOfDateIso, windowDays);
}

export function derivePortfolioLeverage(data: SourceWorkspacePortfolioData) {
  return computeContractLeverageSignals(data.contracts);
}

export function derivePortfolioOpportunities(
  data: SourceWorkspacePortfolioData,
) {
  return computeSourcingOpportunities(data.contracts, data.asOfDateIso);
}

export function deriveApplicationScopeTiers(
  data: SourceWorkspacePortfolioData,
  contractId?: string,
) {
  const rows = contractId
    ? data.applicationScope.filter((r) => r.contract_id === contractId)
    : data.applicationScope;
  // No explicit (contract_id, application_ref) reference set is loaded in this
  // environment yet — every row stays `unresolved` rather than guessed into a
  // stronger tier. See tierApplicationScopeByConfidence's own doc comment.
  return tierApplicationScopeByConfidence(rows);
}
