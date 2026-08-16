import "server-only";

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
import { computeSourcingOpportunities } from "@/lib/source/data-model/sourcing-opportunities";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import {
  loadSourceV4WorkspaceSnapshot,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";
import {
  evaluateContractCategoryQuality,
  type SourceContractCategoryQualitySummary,
} from "@/lib/source/data-model/contract-category-quality";
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
    readonly exploreProvider: "LegacySourceContract360Provider";
    readonly exploreMatchesV4: boolean;
    readonly mismatchWarning: string | null;
  };
  readonly cockpit: SourceVendor360CockpitData;
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
    semanticLayer: sourceV4CubeUiCatalogForAgent(),
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
    contracts,
    vendors,
    applicationScope,
    initiativeDependencies,
    isEmpty: contracts.length === 0,
    reads,
  };
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
  const headline = headlineAnchor
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
        verdictRows.length > 0
          ? `${verdictRows.length} active contract${verdictRows.length === 1 ? "" : "s"} sit inside the governed decision set; treat the date first, then the leverage flag.`
          : "No qualifying row is rendered as exposure; missing timing stays not established.",
      bindingChip:
        exposureRows.length > 0
          ? "computeRenewalExposure(source.contract_360, as_of_date)"
          : "computeRenewalExposure(source.contract_360, as_of_date).expiringWithinWindow",
      supports: [
        {
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
        {
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
    proofLayers: {
      evidenceBehindVerdict: [
        {
          label: "Renewal decision set",
          binding: "computeRenewalExposure",
          grain: "active contract",
          value: `${renewal180.expiringWithinWindow.length} expiry rows · ${renewal180.noticeDeadlinePassed.length} lapsed notice rows`,
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
              ? "Returned by governed V4 snapshot."
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
        "source.contract_360 -> computeContractLeverageSignals -> gate and action verb",
        "consumption.* -> Source governed cube slices -> proof layers",
      ],
    },
  };
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
  return input.contracts
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
  if (!contract.end_date) return null;
  const endDate = validDate(contract.end_date);
  if (endDate.getTime() <= asOf.getTime()) return null;
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

function sumAnnual(rows: readonly SourceContract360Row[]): number {
  return rows.reduce((total, row) => total + valueOf(row.annual_value), 0);
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
