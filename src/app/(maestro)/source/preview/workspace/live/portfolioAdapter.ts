import "server-only";

import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  summarizePortfolio,
  tierApplicationScopeByConfidence,
} from "@/lib/source/data-model/vendor-contract-portfolio";
import { computeSourcingOpportunities } from "@/lib/source/data-model/sourcing-opportunities";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import {
  loadSourceV4WorkspaceSnapshot,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";
import {
  listContract360,
  listContractApplicationScope,
  listContractInitiativeDependency,
  listVendorContractPortfolio,
} from "@/lib/source/data-model/read-adapter";
import type {
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractInitiativeDependencyRow,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";

// ─────────────────────────────────────────────────────────────────────────
// Portfolio-wide read for the Source Workspace. One fetch, on the server,
// against the tables verified real in types.ts. Every downstream number in
// the workspace traces back to a row returned here or a pure function over
// it — nothing is computed a second time in the client.
// ─────────────────────────────────────────────────────────────────────────

export interface SourceWorkspacePortfolioData {
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly semanticLayer: ReturnType<typeof sourceV4CubeUiCatalogForAgent>;
  readonly v4Snapshot: SourceV4WorkspaceSnapshot;
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

export async function loadSourceWorkspacePortfolio(
  tenantKey: string,
  asOfDateIso: string,
): Promise<SourceWorkspacePortfolioData> {
  const [
    contractsRaw,
    vendors,
    applicationScope,
    initiativeDependencies,
    v4Snapshot,
  ] = await Promise.all([
    listContract360(tenantKey).catch(() => []),
    listVendorContractPortfolio(tenantKey).catch(() => []),
    listContractApplicationScope(tenantKey).catch(() => []),
    listContractInitiativeDependency(tenantKey).catch(() => []),
    loadSourceV4WorkspaceSnapshot(tenantKey, asOfDateIso),
  ]);

  const contracts = excludeSupplementalContracts(contractsRaw);

  return {
    tenantKey,
    asOfDateIso,
    semanticLayer: sourceV4CubeUiCatalogForAgent(),
    v4Snapshot,
    contracts,
    vendors,
    applicationScope,
    initiativeDependencies,
    isEmpty: contracts.length === 0,
    reads: {
      contracts: contractsRaw.length > 0 ? "available" : "missing",
      vendors: vendors.length > 0 ? "available" : "missing",
      applicationScope: applicationScope.length > 0 ? "available" : "missing",
      initiativeDependencies:
        initiativeDependencies.length > 0 ? "available" : "missing",
    },
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
