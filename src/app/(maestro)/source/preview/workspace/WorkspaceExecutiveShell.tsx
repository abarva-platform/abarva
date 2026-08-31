"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SourceWorkspaceVM } from "./buildViewModel";
import { fmtDate, money, pct, type WorkspaceViewModel } from "./viewModel";
import type { SourceWorkspacePortfolioData } from "./live/portfolioAdapter";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type {
  SourceContractApplicationScopeRow,
  SourceContract360Row,
  SourceContractActionCandidateRow,
  SourceContractEvidenceCoverageRow,
  SourceContractPerformancePeriodRow,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";

const PAGE_LABELS = [
  "Verdict",
  "Vendors",
  "Contracts",
  "Optimize",
  "Evidence",
  "Contract graph",
] as const;
const CONTRACT_TABS = [
  "Story",
  "Scope",
  "Economics",
  "Performance",
  "Relationship",
  "Evidence",
  "Optimize",
] as const;
const VENDOR_SUBTABS = ["Concentration", "Evidence depth", "Archetype mix"] as const;
const CONTRACT_LIST_SUBTABS = ["Contract table", "Evidence depth", "Financial posture"] as const;
const OPTIMIZE_SUBTABS = ["Action queue", "Type mix", "Contract readiness"] as const;
const GRAPH_SUBTABS = ["Flow", "Volume", "Mapping spine"] as const;

type PageLabel = (typeof PAGE_LABELS)[number];
type ExecutiveVendorRow = SourceVendorContractPortfolioRow & {
  readonly vendor_refs: readonly string[];
};
type FocusedContractRow = {
  readonly contract: SourceContract360Row;
  readonly coverage: SourceContractEvidenceCoverageRow | null;
  readonly actionRows: number;
  readonly claimRows: number;
  readonly depthScore: number;
  readonly reason: string;
};
type FocusedContractSet = {
  readonly rows: readonly FocusedContractRow[];
  readonly remainderCount: number;
  readonly remainderAnnualValue: number;
  readonly depthReadyCount: number;
};
type VendorCoverageSummary = {
  spendRows: number;
  performanceRows: number;
  actionRows: number;
  unclaimedCredit: number;
};
type FocusedVendorRow = {
  readonly vendor: ExecutiveVendorRow;
  readonly coverage: VendorCoverageSummary | null;
  readonly reason: string;
};
type FocusedVendorSet = {
  readonly rows: readonly FocusedVendorRow[];
  readonly remainderCount: number;
  readonly remainderAnnualValue: number;
  readonly depthReadyCount: number;
};
type FocusedActionSet = {
  readonly rows: readonly SourceContractActionCandidateRow[];
  readonly remainderCount: number;
  readonly remainderAmount: number;
  readonly totalRows: number;
  readonly totalAmount: number;
};

export function WorkspaceExecutiveShell({
  vm,
  logic,
  portfolio,
  tenantName,
}: {
  vm: SourceWorkspaceVM;
  logic: WorkspaceViewModel;
  portfolio: SourceWorkspacePortfolioData;
  tenantName: string;
}) {
  const [showLineage, setShowLineage] = useState(false);
  const selectedContract =
    (vm.c?.id
      ? portfolio.contracts.find(
          (contract) => contract.contract_id === vm.c?.id,
        )
      : null) ??
    preferredContract(portfolio) ??
    portfolio.contracts[0] ??
    null;
  const executiveVendors = topVendors(portfolio);
  const currentPage = activePage(logic, vm);
  const selectedVendorRef =
    logic.state.sel.kind === "vendor"
      ? logic.state.sel.id
      : currentPage === "Vendors"
        ? (executiveVendors[0]?.vendor_ref ?? selectedContract?.vendor_ref ?? null)
        : (selectedContract?.vendor_ref ??
          executiveVendors[0]?.vendor_ref ??
          null);
  const selectedVendor = selectedVendorRef
    ? (executiveVendors.find((vendor) =>
        vendor.vendor_refs.includes(selectedVendorRef),
      ) ?? null)
    : null;
  const headerContract = vm.isContract ? selectedContract : null;
  const totalAnnualValue = portfolioAnnualValue(portfolio);
  const lapsedAutoRenewSupport = supportByLabel(
    portfolio,
    "Auto-renew notice passed",
  );
  const decisionSupport = supportByLabel(portfolio, "Exposed annual value");
  const cancellableSupport = supportByLabel(portfolio, "Still cancellable");
  const windowSupport = supportByLabel(portfolio, "Decision window");
  const staleRenewalControl = claimQualityByLabel(
    portfolio,
    "Stale renewal dates",
  );
  const impactUnclaimedCredit = portfolio.impact.evidenceCoverage.reduce(
    (sum, row) => sum + (numberFromDb(row.unclaimed_credit_usd) ?? 0),
    0,
  );
  const impactCandidateAmount = portfolio.impact.actionCandidates.reduce(
    (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
    0,
  );
  const creditFinding = Math.max(
    portfolio.v4Snapshot.performanceCredits.unclaimedCredit,
    impactUnclaimedCredit,
  );
  const performanceRows = portfolio.v4Snapshot.performanceCredits.rowCount;
  const spendRows = portfolio.v4Snapshot.spendConsumption.rowCount;
  const performanceCreditContract = [...portfolio.impact.evidenceCoverage]
    .filter(
      (row) =>
        (numberFromDb(row.performance_rows) ?? 0) > 0 &&
        (numberFromDb(row.unclaimed_credit_usd) ?? 0) > 0,
    )
    .sort(
      (left, right) =>
        (numberFromDb(right.unclaimed_credit_usd) ?? 0) -
          (numberFromDb(left.unclaimed_credit_usd) ?? 0) ||
        (numberFromDb(right.performance_rows) ?? 0) -
          (numberFromDb(left.performance_rows) ?? 0) ||
        left.contract_id.localeCompare(right.contract_id),
    )[0];
  const findingContract =
    creditFinding > 0
      ? (performanceCreditContract
        ? {
            contractId: performanceCreditContract.contract_id,
            counterparty: performanceCreditContract.vendor_name,
            deadlineLabel: "Not established",
          }
        : (portfolio.cockpit.actionQueue.find((row) =>
          /credit/i.test(`${row.actionVerb} ${row.why}`),
        ) ??
          portfolio.cockpit.actionQueue[0] ??
          null))
      : null;
  const claimContract = claimContractForPage(currentPage);

  const selectPage = (page: PageLabel) => {
    if (page === "Verdict") {
      logic.select("portfolio", null, "Portfolio");
      return;
    }
    if (page === "Vendors") {
      logic.select("vendorList", null);
      return;
    }
    if (page === "Contracts") {
      logic.select("contractList", null);
      return;
    }
    if (page === "Evidence") {
      logic.select("evidence", null, "Coverage");
      return;
    }
    if (page === "Contract graph") {
      logic.select("graph", null);
      return;
    }
    if (page === "Optimize") {
      logic.select("optimize", null, logic.state.tabs.optimize ?? "Action queue");
      return;
    }
  };

  const openContract = (contractId: string, tab: string = "Story") =>
    logic.select("contract", contractId, tab);

  const openVendor = (vendorRef: string) => logic.select("vendor", vendorRef);

  return (
    <main className="sw-v2-shell" aria-label="Source workspace">
      <header className="sw-v2-frame-bar" aria-label="Source workspace header">
        <div className="sw-v2-frame-brand">
          <span>
            Abar<i>Va</i>
          </span>
          <b>Source 360</b>
        </div>
        <div className="sw-v2-frame-meta">
          {(tenantName || "Current workspace").toUpperCase()} ·{" "}
          {portfolio.contracts.length} contracts · {portfolio.vendors.length}{" "}
          vendors · data as of {fmtDate(portfolio.asOfDateIso)}
        </div>
      </header>

      <section className="sw-v2-main">
        <header className="sw-v2-topbar">
          <div>
            <div className="sw-v2-breadcrumb">Source 360 / {currentPage}</div>
            <div className="sw-v2-context">
              {tenantName || "Current workspace"} · governed contract book
            </div>
            <h1>
              {headlineFor(
                currentPage,
                tenantName,
                selectedVendor,
                headerContract,
              )}
            </h1>
            <p>
              {subheadFor(
                currentPage,
                portfolio,
                selectedVendor,
                headerContract,
              )}
            </p>
          </div>
          <div className="sw-v2-controls" aria-label="Workspace controls">
            <div className="sw-v2-control" aria-label="Scope filter">
              <span>Scope</span>
              <b>All loaded contracts</b>
            </div>
            <div className="sw-v2-control" aria-label="Data as of">
              <span>As of</span>
              <b>{fmtDate(portfolio.asOfDateIso)}</b>
            </div>
            <div
              className="sw-v2-control sw-v2-control-actions"
              aria-label="Workspace action toolbar"
            >
              <span>Actions</span>
              <div className="sw-v2-action-toolbar-buttons">
                <button
                  type="button"
                  className="sw-v2-action-button"
                  onClick={() => logic.select("contractList", null)}
                >
                  <span>View contracts</span>
                </button>
                <button
                  type="button"
                  className="sw-v2-action-button"
                  onClick={() =>
                    logic.select(
                      "optimize",
                      null,
                      logic.state.tabs.optimize ?? "Action queue",
                    )
                  }
                >
                  <span>Run optimize</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav
          className="sw-v2-horizontal-tabs"
          aria-label="Source workspace navigation"
        >
          {PAGE_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              className={label === currentPage ? "is-active" : ""}
              onClick={() => selectPage(label)}
            >
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="sw-v2-metrics" aria-label="Portfolio facts">
          <Metric
            label="Contracts"
            value={String(portfolio.contracts.length)}
            note="Loaded contract records"
          />
          <Metric
            label="Vendors"
            value={String(portfolio.vendors.length)}
            note="Vendor rollups"
          />
          <Metric
            label="Annual value"
            value={money(totalAnnualValue)}
            note="Sum of recorded annual value"
          />
          <Metric
            label={lapsedAutoRenewSupport?.label ?? "Active renewal exposure"}
            value={
              lapsedAutoRenewSupport?.value ??
              decisionSupport?.value ??
              "Not established"
            }
            note={
              lapsedAutoRenewSupport?.note ??
              decisionSupport?.note ??
              "No active auto-renew or decision-window rows are established."
            }
            tone={lapsedAutoRenewSupport ? "warn" : undefined}
          />
          <Metric
            label={cancellableSupport?.label ?? "Open timing signal"}
            value={
              cancellableSupport?.value ??
              windowSupport?.value ??
              "Not established"
            }
            note={
              cancellableSupport?.note ??
              windowSupport?.note ??
              "Needs active notice_deadline or end_date rows."
            }
            tone={cancellableSupport || windowSupport ? "warn" : undefined}
          />
          <Metric
            label={staleRenewalControl?.label ?? "Stale renewal dates"}
            value={staleRenewalControl?.value ?? "Not established"}
            note={
              staleRenewalControl?.note ??
              "Expired or past-date rows are excluded from deadline claims."
            }
            tone={
              staleRenewalControl && staleRenewalControl.tone !== "pass"
                ? "warn"
                : undefined
            }
          />
        </section>

        <section className="sw-v2-content-canvas" aria-label="Source 360 canvas">
          <ClaimContract
            allowed={claimContract.allowed}
            blocker={claimContract.blocker}
          />

          {currentPage === "Verdict" ? (
            <PortfolioPage
              portfolio={portfolio}
              creditFinding={creditFinding}
              findingContract={findingContract}
              performanceRows={performanceRows}
              spendRows={spendRows}
              impactCandidateAmount={impactCandidateAmount}
              onOpenContract={openContract}
              onOpenVendors={() => logic.select("vendorList", null)}
            />
          ) : null}

          {currentPage === "Vendors" ? (
            <VendorsPage
              portfolio={portfolio}
              selectedVendor={selectedVendor}
              totalAnnualValue={totalAnnualValue}
              subtab={logic.state.tabs.vendorList ?? "Concentration"}
              onOpenSubtab={(tab) => logic.setTab("vendorList", tab)}
              onOpenVendor={openVendor}
              onOpenContract={openContract}
            />
          ) : null}

          {currentPage === "Contracts" ? (
            vm.isContract && selectedContract ? (
              <ContractPage
                vm={vm}
                logic={logic}
                portfolio={portfolio}
                contract={selectedContract}
                onOpenTab={(tab) => logic.setTab("contract", tab)}
              />
            ) : (
              <ContractsPage
                portfolio={portfolio}
                subtab={logic.state.tabs.contractList ?? "Contract table"}
                onOpenSubtab={(tab) => logic.setTab("contractList", tab)}
                onOpenContract={openContract}
              />
            )
          ) : null}

          {currentPage === "Optimize" && selectedContract ? (
            <OptimizePage
              vm={vm}
              contract={selectedContract}
              creditFinding={creditFinding}
              findingContract={findingContract}
              performanceRows={performanceRows}
              spendRows={spendRows}
              portfolio={portfolio}
              subtab={logic.state.tabs.optimize ?? "Action queue"}
              onOpenSubtab={(tab) => logic.setTab("optimize", tab)}
              onOpenContract={openContract}
            />
          ) : null}

          {currentPage === "Evidence" ? (
            <EvidencePage
              portfolio={portfolio}
              showLineage={showLineage}
              onToggleLineage={() => setShowLineage((current) => !current)}
            />
          ) : null}

          {currentPage === "Contract graph" ? (
            <ContractGraphPage
              portfolio={portfolio}
              subtab={logic.state.tabs.graph ?? "Flow"}
              onOpenSubtab={(tab) => logic.setTab("graph", tab)}
              showLineage={showLineage}
              onToggleLineage={() => setShowLineage((current) => !current)}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

function PortfolioPage({
  portfolio,
  creditFinding,
  findingContract,
  performanceRows,
  spendRows,
  impactCandidateAmount,
  onOpenContract,
  onOpenVendors,
}: {
  portfolio: SourceWorkspacePortfolioData;
  creditFinding: number;
  findingContract: {
    contractId: string;
    counterparty: string;
    deadlineLabel: string;
  } | null;
  performanceRows: number;
  spendRows: number;
  impactCandidateAmount: number;
  onOpenContract: (contractId: string, tab?: string) => void;
  onOpenVendors: () => void;
}) {
  const claimCards = portfolio.impact.claimCards.slice(0, 3);
  const storyline = storylineBySurface(portfolio, "overview");
  const portfolioContractIds = new Set(
    portfolio.contracts.map((contract) => contract.contract_id),
  );
  const depthContractIds = new Set([
    ...portfolio.impact.evidenceCoverage.map((row) => row.contract_id),
    ...portfolio.impact.actionCandidates.map((row) => row.contract_id),
  ]);
  const supplementalActionContractCount =
    portfolio.impact.actionCandidates.filter(
      (row) => !portfolioContractIds.has(row.contract_id),
    ).length;
  const executiveStatement =
    portfolio.impact.actionCandidates.length > 0
      ? `${portfolio.contracts.length} contracts are in the portfolio register. ${depthContractIds.size} contracts have canonical depth rows and ${portfolio.impact.actionCandidates.length} action candidates are in the action layer${supplementalActionContractCount > 0 ? "; supplemental candidates do not change the register count until matched into the governed contract book" : ""}. Claims stay limited to cited evidence rows.`
      : (storyline?.allowed_executive_statement ??
        portfolio.cockpit.verdict.decidingAxis);

  return (
    <div className="sw-v2-grid sw-v2-verdict-grid">
      <section className="sw-v2-panel sw-v2-verdict-position">
        <PanelHead
          eyebrow="Executive position"
          title={
            portfolio.impact.actionCandidates.length > 0
              ? "Governed contract book + action layer"
              : (storyline?.headline ?? portfolio.cockpit.verdict.headline)
          }
        />
        <p className="sw-v2-lede">{executiveStatement}</p>
        <div className="sw-v2-decision-list sw-v2-compact-decisions">
          {claimCards.length
            ? claimCards.map((row) => (
                <button
                  key={row.opportunity_id}
                  type="button"
                  className="sw-v2-decision-row"
                  onClick={() => onOpenContract(row.contract_id, "Optimize")}
                >
                  <span>
                    <b>{row.claim_title ?? "Review candidate action"}</b>
                    <small>
                      {row.vendor_name} / {row.contract_id}
                    </small>
                  </span>
                  <span>{money(numberFromDb(row.candidate_amount_usd))}</span>
                  <span>{row.readiness_state ?? row.evidence_state}</span>
                </button>
              ))
            : portfolio.cockpit.actionQueue.slice(0, 3).map((row) => (
                <button
                  key={row.contractId}
                  type="button"
                  className="sw-v2-decision-row"
                  onClick={() => onOpenContract(row.contractId)}
                >
                  <span>
                    <b>{row.actionVerb}</b>
                    <small>
                      {row.counterparty} / {row.contractId}
                    </small>
                  </span>
                  <span>{row.annualValueLabel}</span>
                  <span>{row.deadlineLabel}</span>
                </button>
              ))}
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-verdict-action">
        <PanelHead
          eyebrow="Action opportunity"
          title="Finance confirmation remains separate"
        />
        {impactCandidateAmount > 0 ? (
          <>
            <div className="sw-v2-finding-value">
              {money(impactCandidateAmount)}
            </div>
            <p className="sw-v2-muted">
              Sum of deterministic action candidates in the contract-depth
              layer. This is a review queue, not realized savings or a change
              to the portfolio denominator.
            </p>
            {claimCards[0] ? (
              <button
                type="button"
                className="sw-v2-primary"
                onClick={() =>
                  onOpenContract(claimCards[0].contract_id, "Optimize")
                }
              >
                Open top action
              </button>
            ) : null}
          </>
        ) : creditFinding > 0 && findingContract ? (
          <>
            <div className="sw-v2-finding-value">{money(creditFinding)}</div>
            <p className="sw-v2-muted">
              Unclaimed credits in the loaded performance-credit slice. This is
              evidence for {findingContract.contractId}, not a portfolio-wide
              savings claim.
            </p>
            <button
              type="button"
              className="sw-v2-primary"
              onClick={() =>
                onOpenContract(findingContract.contractId, "Optimize")
              }
            >
              Open finding
            </button>
          </>
        ) : (
          <p className="sw-v2-muted">
            No quantified opportunity is loaded in the current deterministic
            slice.
          </p>
        )}
      </section>

      <section className="sw-v2-panel sw-v2-verdict-vendors">
        <PanelHead
          eyebrow="Vendor concentration"
          title="Largest relationships by recorded annual value"
        />
        <VendorConcentrationChart
          vendors={topVendors(portfolio).slice(0, 5)}
          totalAnnualValue={portfolioAnnualValue(portfolio)}
        />
        <div className="sw-v2-vendor-strip">
          {topVendors(portfolio)
            .slice(0, 5)
            .map((vendor) => (
              <button
                key={vendor.vendor_ref}
                type="button"
                onClick={onOpenVendors}
                style={
                  {
                    "--sw-v2-share": `${vendorShare(vendor, portfolioAnnualValue(portfolio))}%`,
                  } as CSSProperties
                }
              >
                <b>{vendor.vendor_name}</b>
                <span>
                  {money(numberFromDb(vendor.annual_value))} /{" "}
                  {vendor.contract_count} contracts
                </span>
              </button>
            ))}
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-verdict-evidence">
        <PanelHead eyebrow="Evidence posture" title="Loaded rows only" />
        <div className="sw-v2-fact-stack sw-v2-compact-facts">
          <Fact label="Spend rows" value={String(spendRows)} />
          <Fact label="Performance rows" value={String(performanceRows)} />
          <Fact
            label="Claim cards"
            value={String(portfolio.impact.claimCards.length)}
          />
          <Fact
            label="aVa bundles"
            value={String(portfolio.impact.avaGroundingBundles.length)}
          />
          <Fact label="Finance confirmed" value="Not established" />
          <Fact label="Unsupported dashboard claims" value="Hidden" />
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-verdict-quality">
        <PanelHead
          eyebrow="Claim quality controls"
          title="Computed, excluded, or withheld"
        />
        <div className="sw-v2-fact-stack sw-v2-compact-facts sw-v2-control-facts">
          {portfolio.cockpit.claimQualityControls.map((control) => (
            <div key={control.label}>
              <Fact label={control.label} value={control.value} />
              <p className="sw-v2-muted">{control.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VendorsPage({
  portfolio,
  selectedVendor,
  totalAnnualValue,
  subtab,
  onOpenSubtab,
  onOpenVendor,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  selectedVendor: ExecutiveVendorRow | null;
  totalAnnualValue: number | null;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenVendor: (vendorRef: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const vendors = topVendors(portfolio);
  const selectedContracts = selectedVendor
    ? vendorLinkedContracts(portfolio.contracts, selectedVendor)
    : [];
  const selectedVendorPosition = selectedVendor
    ? portfolio.impact.vendorPositions.find(
        (vendor) => vendor.vendor_ref === selectedVendor.vendor_ref,
      )
    : null;
  const selectedVendorCoverage = selectedVendor
    ? (vendorCoverageRows(portfolio).get(selectedVendor.vendor_ref) ?? null)
    : null;

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <SubtabBar
          tabs={VENDOR_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead
          eyebrow="Vendor 360"
          title={vendorSubtabTitle(subtab)}
        />
        {subtab === "Evidence depth" ? (
          <VendorEvidenceDepthTable
            portfolio={portfolio}
            vendors={vendors}
            selectedVendor={selectedVendor}
            onOpenVendor={onOpenVendor}
          />
        ) : subtab === "Archetype mix" ? (
          <VendorArchetypeTable
            portfolio={portfolio}
            onOpenVendor={onOpenVendor}
          />
        ) : (
          <div className="sw-v2-vendor-concentration-view">
            <VendorConcentrationChart
              vendors={vendors.slice(0, 5)}
              totalAnnualValue={totalAnnualValue}
            />
            <VendorConcentrationTable
              portfolio={portfolio}
              vendors={vendors}
              selectedVendor={selectedVendor}
              totalAnnualValue={totalAnnualValue}
              onOpenVendor={onOpenVendor}
            />
          </div>
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Selected vendor"
          title={selectedVendor?.vendor_name ?? "Select a vendor"}
        />
        {selectedVendor ? (
          <div className="sw-v2-vendor-summary">
            <div className="sw-v2-vendor-summary-hero">
              <span>{selectedVendor.vendor_category ?? "Category not established"}</span>
              <b>{money(numberFromDb(selectedVendor.annual_value))}</b>
              <small>
                {selectedVendor.contract_count} contracts /{" "}
                {formatShare(selectedVendor, totalAnnualValue)} of recorded
                annual value
              </small>
            </div>
            <div className="sw-v2-vendor-metric-grid">
              <Fact
                label="Auto-renewing"
                value={String(selectedVendor.auto_renew_contracts)}
              />
              <Fact
                label="Action rows"
                value={String(
                  selectedVendorPosition?.action_candidate_count ?? 0,
                )}
              />
              <Fact
                label="Unconfirmed action value"
                value={money(
                  numberFromDb(selectedVendorPosition?.candidate_amount_usd),
                )}
              />
              <Fact
                label="Unclaimed credits"
                value={money(
                  numberFromDb(selectedVendorPosition?.unclaimed_credit_usd),
                )}
              />
              <Fact
                label="Spend rows"
                value={formatCount(selectedVendorCoverage?.spendRows)}
              />
              <Fact
                label="Performance rows"
                value={formatCount(selectedVendorCoverage?.performanceRows)}
              />
            </div>
            <div className="sw-v2-vendor-contracts">
              <span>Grouped contracts</span>
              {selectedContracts.length > 0 ? (
                selectedContracts.slice(0, 6).map((contract) => (
                  <button
                    key={contract.contract_id}
                    type="button"
                    onClick={() => onOpenContract(contract.contract_id)}
                  >
                    <b>{contract.contract_id}</b>
                    <small>{contract.contract_name || contract.vendor_name}</small>
                    <strong>{money(numberFromDb(contract.annual_value))}</strong>
                  </button>
                ))
              ) : (
                <p className="sw-v2-muted">
                  Contract-level rows are not materialized for this vendor
                  selection.
                </p>
              )}
              {selectedContracts.length > 6 ? (
                <p className="sw-v2-muted">
                  {selectedContracts.length - 6} more contract headers stay in
                  the grouped vendor rollup.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="sw-v2-muted">
            Choose a row to see grouped contract headers.
          </p>
        )}
      </section>
    </div>
  );
}

function VendorConcentrationChart({
  vendors,
  totalAnnualValue,
}: {
  vendors: readonly ExecutiveVendorRow[];
  totalAnnualValue: number | null;
}) {
  const data = vendors.map((vendor) => {
    const annualValue = numberFromDb(vendor.annual_value) ?? 0;
    return {
      name: vendor.vendor_name,
      shortName: compactVendorName(vendor.vendor_name),
      annualValue,
      share: vendorShare(vendor, totalAnnualValue),
    };
  });

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="sw-v2-recharts-card" aria-label="Vendor concentration chart">
      <MeasuredChartFrame className="sw-v2-chart-frame-bar" height={238}>
        {(chartWidth, chartHeight) => (
          <BarChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 4 }}
            barCategoryGap={14}
          >
            <CartesianGrid
              horizontal={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis
              type="number"
              hide
              domain={[0, "dataMax"]}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={142}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(186,117,23,0.08)" }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value) => [
                money(typeof value === "number" ? value : Number(value)),
                "Annual value",
              ]}
              labelFormatter={(_, rows) => rows[0]?.payload?.name ?? ""}
            />
            <Bar dataKey="annualValue" radius={[0, 5, 5, 0]}>
              {data.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={index === 0 ? "#0a0a0b" : index === 1 ? "#1d9e75" : "#ba7517"}
                  opacity={Math.max(0.45, 1 - index * 0.12)}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        {data.map((row) => (
          <span key={row.name}>
            <b>{row.shortName}</b>
            {row.share > 0 ? ` ${row.share.toFixed(1)}%` : " share unavailable"}
          </span>
        ))}
      </div>
    </div>
  );
}

function ContractPerformanceTrendChart({
  periods,
}: {
  periods: readonly SourceContractPerformancePeriodRow[];
}) {
  const data = periods.slice(0, 12).map((row) => ({
    period: shortMonth(row.period_start),
    actual: numberFromDb(row.value_num),
    credit: numberFromDb(row.credit_calculated) ?? 0,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div
      className="sw-v2-recharts-card sw-v2-recharts-card-compact"
      aria-label="Contract performance trend chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-line" height={224}>
        {(chartWidth, chartHeight) => (
          <LineChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            margin={{ top: 12, right: 24, bottom: 8, left: 4 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              yAxisId="actual"
              domain={[80, 100]}
              width={38}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis yAxisId="credit" orientation="right" hide />
            <Tooltip
              cursor={{ stroke: "rgba(186,117,23,0.28)", strokeWidth: 1 }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value, name) => {
                if (name === "credit") {
                  return [
                    money(typeof value === "number" ? value : Number(value)),
                    "Credit calculated",
                  ];
                }
                return [`${Number(value).toFixed(1)}%`, "Actual"];
              }}
            />
            <Line
              yAxisId="actual"
              type="monotone"
              dataKey="actual"
              stroke="#0a0a0b"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5, stroke: "#ba7517", strokeWidth: 2 }}
              connectNulls
            />
            <Line
              yAxisId="credit"
              type="monotone"
              dataKey="credit"
              stroke="#ba7517"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        <span>
          <b>black</b> actual SLA %
        </span>
        <span>
          <b>amber</b> calculated credits
        </span>
      </div>
    </div>
  );
}

function OptimizeTypeMixChart({
  rows,
}: {
  rows: readonly ReturnType<typeof optimizeTypeRows>[number][];
}) {
  const data = rows
    .filter((row) => row.amount > 0)
    .slice(0, 5)
    .map((row) => ({
      name: row.type,
      value: row.amount,
    }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div
      className="sw-v2-recharts-card sw-v2-recharts-card-compact"
      aria-label="Optimize action mix chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-donut" height={224}>
        {(chartWidth, chartHeight) => (
          <PieChart width={chartWidth} height={chartHeight}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={3}
            >
              {data.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={index === 0 ? "#0a0a0b" : index === 1 ? "#1d9e75" : "#ba7517"}
                  opacity={Math.max(0.52, 1 - index * 0.13)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value) => [
                money(typeof value === "number" ? value : Number(value)),
                "Candidate amount",
              ]}
            />
          </PieChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        {data.map((row) => (
          <span key={row.name}>
            <b>{row.name}</b>
            {money(row.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MeasuredChartFrame({
  className,
  height,
  children,
}: {
  className: string;
  height: number;
  children: (width: number, height: number) => ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(620);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const syncWidth = () => {
      const nextWidth = Math.floor(frame.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    syncWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncWidth);
      return () => window.removeEventListener("resize", syncWidth);
    }

    const observer = new ResizeObserver(syncWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const chartWidth = Math.max(280, width);

  return (
    <div
      ref={frameRef}
      className={`sw-v2-chart-frame ${className}`}
      data-chart-width={chartWidth}
    >
      <div className="sw-v2-chart-stage" style={{ height }}>
        {children(chartWidth, height)}
      </div>
    </div>
  );
}

function VendorConcentrationTable({
  portfolio,
  vendors,
  selectedVendor,
  totalAnnualValue,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  vendors: readonly ExecutiveVendorRow[];
  selectedVendor: ExecutiveVendorRow | null;
  totalAnnualValue: number | null;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const focus = focusedVendorSet(portfolio, vendors, "concentration");
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-vendor-row">
        <span>Vendor</span>
        <span>Contracts</span>
        <span>Annual value</span>
        <span>Share</span>
        <span>Why listed</span>
      </div>
      {focus.rows.map(({ vendor, reason }) => (
        <button
          key={vendor.vendor_ref}
          type="button"
          className={`sw-v2-table-row sw-v2-vendor-row ${selectedVendor?.vendor_ref === vendor.vendor_ref ? "is-selected" : ""}`}
          onClick={() => onOpenVendor(vendor.vendor_ref)}
        >
          <span>
            <b>{vendor.vendor_name}</b>
            <small>{vendor.vendor_category ?? "Category not established"}</small>
          </span>
          <span>{vendor.contract_count}</span>
          <span>{money(numberFromDb(vendor.annual_value))}</span>
          <span>{formatShare(vendor, totalAnnualValue)}</span>
          <span>{reason}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} further vendor relationships</b>
          <span>
            {money(focus.remainderAnnualValue)} remains summarized in the
            portfolio rollup.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function VendorEvidenceDepthTable({
  portfolio,
  vendors,
  selectedVendor,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  vendors: readonly ExecutiveVendorRow[];
  selectedVendor: ExecutiveVendorRow | null;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const coverageByVendor = vendorCoverageRows(portfolio);
  const focus = focusedVendorSet(portfolio, vendors, "evidence");
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-vendor-depth-row">
        <span>Vendor</span>
        <span>Spend rows</span>
        <span>Performance rows</span>
        <span>Action rows</span>
        <span>Unclaimed credits</span>
      </div>
      {focus.rows.map(({ vendor }) => {
        const coverage = coverageByVendor.get(vendor.vendor_ref);
        return (
          <button
            key={vendor.vendor_ref}
            type="button"
            className={`sw-v2-table-row sw-v2-vendor-depth-row ${selectedVendor?.vendor_ref === vendor.vendor_ref ? "is-selected" : ""}`}
            onClick={() => onOpenVendor(vendor.vendor_ref)}
          >
            <span>
              <b>{vendor.vendor_name}</b>
              <small>{vendor.contract_count} contracts</small>
            </span>
            <span>{formatCount(coverage?.spendRows)}</span>
            <span>{formatCount(coverage?.performanceRows)}</span>
            <span>{formatCount(coverage?.actionRows)}</span>
            <span>{money(coverage?.unclaimedCredit ?? null)}</span>
          </button>
        );
      })}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.depthReadyCount} vendor relationships have loaded depth.</b>
          <span>
            The remaining {focus.remainderCount} stay summarized until contract
            evidence rows are loaded beneath them.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function VendorArchetypeTable({
  portfolio,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const rows = vendorArchetypeRows(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-archetype-row">
        <span>Archetype</span>
        <span>Vendors</span>
        <span>Contracts</span>
        <span>Annual value</span>
        <span>Representative vendor</span>
      </div>
      {rows.map((row) => (
        <button
          key={row.category}
          type="button"
          className="sw-v2-table-row sw-v2-archetype-row"
          onClick={() => {
            if (row.vendorRef) onOpenVendor(row.vendorRef);
          }}
        >
          <span>
            <b>{row.category}</b>
            <small>Declared category; no inferred taxonomy override.</small>
          </span>
          <span>{row.vendorCount}</span>
          <span>{row.contractCount}</span>
          <span>{money(row.annualValue)}</span>
          <span>{row.vendorName ?? "Not established"}</span>
        </button>
      ))}
    </div>
  );
}

function ContractsPage({
  portfolio,
  subtab,
  onOpenSubtab,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <SubtabBar
          tabs={CONTRACT_LIST_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead eyebrow="Contracts" title={contractListSubtabTitle(subtab)} />
        {subtab === "Evidence depth" ? (
          <ContractEvidenceDepthTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : subtab === "Financial posture" ? (
          <ContractFinancialPostureTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : (
          <ContractListTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Contract list guardrail" title="Rows before story" />
        <div className="sw-v2-fact-stack">
          <Fact label="Contracts" value={String(portfolio.contracts.length)} />
          <Fact
            label="Evidence coverage rows"
            value={String(portfolio.impact.evidenceCoverage.length)}
          />
          <Fact
            label="Action rows"
            value={String(portfolio.impact.actionCandidates.length)}
          />
          <Fact label="Finance confirmed" value="Not established" />
          <p className="sw-v2-muted">
            Open a contract row for Story, Scope, Economics, Performance,
            Relationship, Evidence, and Optimize detail.
          </p>
        </div>
      </section>
    </div>
  );
}

function ContractListTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-contract-row">
        <span>Contract</span>
        <span>Vendor</span>
        <span>Why listed</span>
        <span>Annual value</span>
        <span>Next action</span>
      </div>
      {focus.rows.map(({ contract, reason, actionRows }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-contract-row"
          onClick={() => onOpenContract(contract.contract_id)}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{contract.contract_id}</small>
          </span>
          <span>{contract.vendor_name}</span>
          <span>{reason}</span>
          <span>{money(numberFromDb(contract.annual_value))}</span>
          <span>
            {actionRows > 0 ? "Open Optimize" : "Review Contract 360"}
          </span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} further registry contracts</b>
          <span>
            {money(focus.remainderAnnualValue)} stays summarized until spend,
            performance, document, or action evidence is loaded.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractEvidenceDepthTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-contract-depth-row">
        <span>Contract</span>
        <span>Spend</span>
        <span>Performance</span>
        <span>Docs</span>
        <span>Actions</span>
        <span>Coverage</span>
      </div>
      {focus.rows.map(({ contract, coverage, actionRows }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-contract-depth-row"
          onClick={() => onOpenContract(contract.contract_id, "Evidence")}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{contract.contract_id}</small>
          </span>
          <span>{formatCount(coverage?.spend_rows)}</span>
          <span>{formatCount(coverage?.performance_rows)}</span>
          <span>{formatCount(coverage?.document_page_text_rows)}</span>
          <span>{formatCount(actionRows)}</span>
          <span>{coverage?.coverage_state ?? "Header only"}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.depthReadyCount} contracts have loaded detail rows.</b>
          <span>
            The remaining {focus.remainderCount} are held as portfolio registry
            rows until their evidence lanes are populated.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractFinancialPostureTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-financial-row">
        <span>Contract</span>
        <span>Annual value</span>
        <span>Actual spend</span>
        <span>Committed value</span>
        <span>Posture</span>
      </div>
      {focus.rows.map(({ contract }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-financial-row"
          onClick={() => onOpenContract(contract.contract_id, "Economics")}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{contract.vendor_name}</small>
          </span>
          <span>{money(numberFromDb(contract.annual_value))}</span>
          <span>{money(numberFromDb(contract.actual_annual_spend))}</span>
          <span>{money(numberFromDb(contract.total_committed_value))}</span>
          <span>{financialPosture(contract)}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} registry-only financial rows summarized.</b>
          <span>
            Actual spend is only shown when monthly spend or consumption rows
            exist for the contract.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractPage({
  vm,
  logic,
  portfolio,
  contract,
  onOpenTab,
}: {
  vm: SourceWorkspaceVM;
  logic: WorkspaceViewModel;
  portfolio: SourceWorkspacePortfolioData;
  contract: SourceContract360Row;
  onOpenTab: (tab: string) => void;
}) {
  const tab = logic.state.tabs.contract ?? "Story";
  const detailReady = vm.detailState === "ready";
  const coverage = coverageForContract(portfolio, contract.contract_id);
  const scopeRows = portfolio.applicationScope.filter(
    (row) => row.contract_id === contract.contract_id,
  );
  const contractClaimCards = portfolio.impact.claimCards.filter(
    (row) => row.contract_id === contract.contract_id,
  );
  const tabNarrative = contractTabNarrative(
    tab,
    vm,
    contract,
    coverage,
    scopeRows,
    contractClaimCards[0],
  );

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <div className="sw-v2-tabbar">
          {CONTRACT_TABS.map((label) => (
            <button
              key={label}
              type="button"
              className={tab === label ? "is-active" : ""}
              onClick={() => onOpenTab(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <PanelHead
          eyebrow={`Contract 360 / ${tab}`}
          title={contract.contract_name}
        />
        <p className="sw-v2-lede">
          {tabNarrative.body}
        </p>
        <div className="sw-v2-tab-claim">
          <span>{tabNarrative.provenance}</span>
          <b>{tabNarrative.headline}</b>
          <small>{tabNarrative.blocker}</small>
        </div>
        {tab === "Scope" ? (
          <ContractScopeTable scopeRows={scopeRows} />
        ) : tab === "Performance" &&
        detailReady &&
        vm.detail?.performancePeriods?.length ? (
          <>
            <ContractPerformanceTrendChart
              periods={vm.detail.performancePeriods}
            />
            <div className="sw-v2-table">
              <div className="sw-v2-table-head sw-v2-performance-row">
                <span>Period</span>
                <span>Metric</span>
                <span>Actual</span>
                <span>Credit</span>
              </div>
              {vm.detail.performancePeriods.slice(0, 12).map((row) => (
                <div
                  key={row.observation_id}
                  className="sw-v2-table-row sw-v2-performance-row"
                >
                  <span>{fmtDate(row.period_start)}</span>
                  <span>{row.metric_name}</span>
                  <span>
                    {performanceActual(row.actual_value, row.value_num)}
                  </span>
                  <span>{money(numberFromDb(row.credit_calculated))}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="sw-v2-fact-grid">
            <Fact label="Vendor" value={contract.vendor_name} />
            <Fact
              label="Annual value"
              value={money(numberFromDb(contract.annual_value))}
            />
            <Fact
              label="Actual annual spend"
              value={money(numberFromDb(contract.actual_annual_spend))}
            />
            <Fact label="End date" value={fmtDate(contract.end_date)} />
            <Fact
              label="Auto-renew"
              value={contract.auto_renew ? "Yes" : "No"}
            />
            <Fact
              label="Notice period"
              value={
                contract.notice_period_days == null
                  ? "Not established"
                  : `${contract.notice_period_days} days`
              }
            />
            <Fact
              label="Benchmarking"
              value={displayBenchmarkingClause(contract.benchmarking_clause)}
            />
            <Fact
              label="Source confidence"
              value={
                contract.source_confidence == null
                  ? "Not established"
                  : pct(numberFromDb(contract.source_confidence) ?? 0)
              }
            />
          </div>
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow={tab === "Scope" ? "Scope coverage" : "Evidence state"}
          title={
            tab === "Scope"
              ? `${scopeRows.length} scoped rows`
              : detailStateLabel(vm.detailState)
          }
        />
        {vm.opportunityView ? (
          <div className="sw-v2-fact-stack">
            <Fact
              label="Recoverable"
              value={vm.opportunityView.potential.recoverable}
            />
            <Fact
              label="Avoidable"
              value={vm.opportunityView.potential.avoidable}
            />
            <Fact
              label="Negotiable"
              value={vm.opportunityView.potential.negotiable}
            />
            <Fact
              label="Finance confirmed"
              value={vm.opportunityView.financeConfirmed}
            />
            <Fact
              label="Deterministic cards"
              value={String(contractClaimCards.length)}
            />
          </div>
        ) : (
          <div className="sw-v2-fact-stack">
            <Fact
              label="Coverage state"
              value={coverage?.coverage_state ?? "Header only"}
            />
            <Fact label="Scope rows" value={String(scopeRows.length)} />
            <Fact
              label="Spend rows"
              value={formatCount(coverage?.spend_rows)}
            />
            <Fact
              label="Performance rows"
              value={formatCount(coverage?.performance_rows)}
            />
            <Fact
              label="Document pages"
              value={formatCount(coverage?.document_page_text_rows)}
            />
            <p className="sw-v2-muted">
              {coverage?.blocker_if_missing ??
                "Contract-specific optimization evidence is not loaded for this selection."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function OptimizePage({
  vm,
  contract,
  creditFinding,
  findingContract,
  performanceRows,
  spendRows,
  portfolio,
  subtab,
  onOpenSubtab,
  onOpenContract,
}: {
  vm: SourceWorkspaceVM;
  contract: SourceContract360Row;
  creditFinding: number;
  findingContract: { contractId: string; counterparty: string } | null;
  performanceRows: number;
  spendRows: number;
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const contractCandidates = portfolio.impact.actionCandidates.filter(
    (row) => row.contract_id === contract.contract_id,
  );
  const topCandidate = contractCandidates[0] ?? null;
  const candidateAmount = contractCandidates.reduce(
    (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
    0,
  );
  const claimCard = topCandidate
    ? portfolio.impact.claimCards.find(
        (row) => row.opportunity_id === topCandidate.opportunity_id,
      )
    : null;
  const actionSet = focusedActionSet(portfolio);

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <SubtabBar
          tabs={OPTIMIZE_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead eyebrow="Optimize" title={optimizeSubtabTitle(subtab)} />
        {subtab === "Type mix" ? (
          <OptimizeByTypeTable portfolio={portfolio} />
        ) : subtab === "Contract readiness" ? (
          <OptimizeByContractTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : (
          <>
            <OptimizeTypeMixChart rows={optimizeTypeRows(portfolio)} />
            <div className="sw-v2-lanes">
              <ValueLane
                title="Recover money"
                value={
                  creditFinding > 0 ? money(creditFinding) : "Not established"
                }
                note={
                  creditFinding > 0 && findingContract
                    ? `${findingContract.contractId} / ${findingContract.counterparty}. Loaded service-credit rows show calculated credits above claimed credits.`
                    : "No recoverable opportunity is quantified in loaded rows."
                }
                active={creditFinding > 0}
              />
              <ValueLane
                title="Avoid future spend"
                value={
                  candidateAmount > 0
                    ? money(candidateAmount)
                    : "Not established"
                }
                note={
                  topCandidate
                    ? `${topCandidate.opportunity_type}: ${topCandidate.deterministic_basis}`
                    : "Requires usage, renewal, rate-card, or entitlement evidence before sizing."
                }
                active={candidateAmount > 0}
              />
              <ValueLane
                title="Improve the deal"
                value="Not established"
                note="Requires terms extraction or benchmark evidence before a negotiation value is shown."
              />
            </div>
            {findingContract ? (
              <button
                type="button"
                className="sw-v2-primary"
                onClick={() =>
                  onOpenContract(findingContract.contractId, "Performance")
                }
              >
                Review performance evidence
              </button>
            ) : null}
            <OptimizeActionQueue
              actionSet={actionSet}
              onOpenContract={onOpenContract}
            />
          </>
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Evidence basis" title="Why this is shown" />
        <div className="sw-v2-fact-stack">
          <Fact label="Contract in view" value={contract.contract_id} />
          <Fact label="Spend rows" value={String(spendRows)} />
          <Fact label="Performance rows" value={String(performanceRows)} />
          <Fact
            label="Action rows"
            value={String(contractCandidates.length)}
          />
          <Fact
            label="Action amount"
            value={
              candidateAmount > 0 ? money(candidateAmount) : "Not established"
            }
          />
          <Fact
            label="Selected opportunity"
            value={
              topCandidate?.next_action ??
              vm.opportunityView?.selectedOpportunity?.label ??
              "Not established"
            }
          />
          <Fact
            label="Finance confirmed"
            value={
              topCandidate?.finance_confirmation_state ??
              vm.opportunityView?.financeConfirmed ??
              "Not established"
            }
          />
          {claimCard ? (
            <p className="sw-v2-muted">{claimCard.blocker_if_missing}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function OptimizeByTypeTable({
  portfolio,
}: {
  portfolio: SourceWorkspacePortfolioData;
}) {
  const rows = optimizeTypeRows(portfolio);
  if (rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No typed action rows loaded.</b>
        <p>
          Source will not summarize recoverable, avoidable, or negotiable value
          by type until action rows exist.
        </p>
      </div>
    );
  }
  return (
    <>
      <OptimizeTypeMixChart rows={rows} />
      <div className="sw-v2-table">
        <div className="sw-v2-table-head sw-v2-opt-type-row">
          <span>Action type</span>
          <span>Rows</span>
          <span>Action amount</span>
          <span>Finance state</span>
        </div>
        {rows.map((row) => (
          <div key={row.type} className="sw-v2-table-row sw-v2-opt-type-row">
            <span>
              <b>{row.type}</b>
              <small>Derived from loaded action rows.</small>
            </span>
            <span>{row.count}</span>
            <span>{money(row.amount)}</span>
            <span>{row.financeState}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function OptimizeByContractTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const actionSet = focusedActionSet(portfolio);
  if (actionSet.rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No contract-level action rows loaded.</b>
        <p>
          Contract headers can still be inspected, but Source will not invent an
          optimization action without evidence-backed action rows.
        </p>
      </div>
    );
  }
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-opt-contract-row">
        <span>Contract</span>
        <span>Finding</span>
        <span>Amount</span>
        <span>Next action</span>
      </div>
      {actionSet.rows.map((row) => (
        <button
          key={row.action_candidate_id}
          type="button"
          className="sw-v2-table-row sw-v2-opt-contract-row"
          onClick={() => onOpenContract(row.contract_id, "Optimize")}
        >
          <span>
            <b>{row.vendor_name}</b>
            <small>{row.contract_id}</small>
          </span>
          <span>{row.finding_summary ?? row.title ?? "Review candidate"}</span>
          <span>{money(numberFromDb(row.candidate_amount_usd))}</span>
          <span>{row.next_action ?? row.readiness_state ?? "Not established"}</span>
        </button>
      ))}
      {actionSet.remainderCount > 0 ? (
        <div className="sw-v2-table-row sw-v2-opt-contract-row sw-v2-rollup-row">
          <span>
            <b>{actionSet.remainderCount} further action rows</b>
            <small>Summarized so the operator sees the ranked queue first.</small>
          </span>
          <span>Open Type mix or Evidence for full lineage before action.</span>
          <span>{money(actionSet.remainderAmount)}</span>
          <span>Keep behind rollup until selected.</span>
        </div>
      ) : null}
    </div>
  );
}

function OptimizeActionQueue({
  actionSet,
  onOpenContract,
}: {
  actionSet: FocusedActionSet;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  if (actionSet.rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No optimize-ready action rows loaded.</b>
        <p>
          Source can describe the contract book, but it will not recommend a
          move until an evidence-backed action row exists.
        </p>
      </div>
    );
  }
  return (
    <div className="sw-v2-table sw-v2-action-queue">
      <div className="sw-v2-table-head sw-v2-action-row">
        <span>Action</span>
        <span>Contract</span>
        <span>Amount</span>
        <span>Finance state</span>
        <span>Next</span>
      </div>
      {actionSet.rows.map((row) => (
        <button
          key={row.action_candidate_id}
          type="button"
          className="sw-v2-table-row sw-v2-action-row"
          onClick={() => onOpenContract(row.contract_id, "Optimize")}
        >
          <span>
            <b>{row.title ?? row.finding_summary ?? "Review loaded action"}</b>
            <small>{row.deterministic_basis ?? "Evidence basis loaded."}</small>
          </span>
          <span>
            <b>{row.vendor_name}</b>
            <small>{row.contract_id}</small>
          </span>
          <span>{money(numberFromDb(row.candidate_amount_usd))}</span>
          <span>{formatFinanceState(row.finance_confirmation_state)}</span>
          <span>{row.next_action ?? row.readiness_state ?? "Review evidence"}</span>
        </button>
      ))}
      {actionSet.remainderCount > 0 ? (
        <div className="sw-v2-table-row sw-v2-action-row sw-v2-rollup-row">
          <span>
            <b>{actionSet.remainderCount} further action rows</b>
            <small>Kept in the rollup until an operator selects the next move.</small>
          </span>
          <span>Portfolio rollup</span>
          <span>{money(actionSet.remainderAmount)}</span>
          <span>Mixed states</span>
          <span>Review by type</span>
        </div>
      ) : null}
    </div>
  );
}

function EvidencePage({
  portfolio,
  showLineage,
  onToggleLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  const coverage = portfolio.impact.evidenceCoverage;
  const sourceRows = [
    {
      name: "Contract headers",
      support: "Contract count, dates, values, renewal posture",
      lineage: "source.contract_360",
      count: portfolio.contracts.length,
      state: portfolio.reads.contracts,
    },
    {
      name: "Vendor rollups",
      support: "Vendor count, concentration, grouped contracts",
      lineage: "source.vendor_contract_portfolio",
      count: portfolio.vendors.length,
      state: portfolio.reads.vendors,
    },
    {
      name: "Application scope",
      support: "Contract-to-application rows and named scope",
      lineage: "source.contract_application_scope",
      count: portfolio.applicationScope.length,
      state: portfolio.reads.applicationScope,
    },
    {
      name: "Action rows",
      support: "Optimize-ready actions",
      lineage: "source.contract_action_candidate_v1",
      count: portfolio.impact.actionCandidates.length,
      state: portfolio.impact.actionCandidates.length ? "available" : "missing",
    },
    {
      name: "Claim cards",
      support: "Allowed executive statements and blockers",
      lineage: "source.contract_claim_card_v1",
      count: portfolio.impact.claimCards.length,
      state: portfolio.impact.claimCards.length ? "available" : "missing",
    },
    {
      name: "aVa grounding",
      support: "Citations, refusals, and safe-answer bundles",
      lineage: "source.ava_grounding_bundle_v1",
      count: portfolio.impact.avaGroundingBundles.length,
      state: portfolio.impact.avaGroundingBundles.length
        ? "available"
        : "missing",
    },
  ];

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead
          eyebrow="Evidence"
          title="Loaded rows, missing lanes, and claim eligibility"
        />
        <LineageToggle
          showLineage={showLineage}
          onToggleLineage={onToggleLineage}
        />
        <div className="sw-v2-table">
          <div className="sw-v2-table-head sw-v2-evidence-row">
            <span>Evidence lane</span>
            <span>Supports</span>
            <span>Rows</span>
            <span>Status</span>
          </div>
          {sourceRows.map((row) => (
            <div
              key={row.lineage}
              className="sw-v2-table-row sw-v2-evidence-row"
            >
              <span>
                <b>{row.name}</b>
                {showLineage ? <small>{row.lineage}</small> : null}
              </span>
              <span>{row.support}</span>
              <span>{row.count}</span>
              <span>{row.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Coverage" title="Contract-depth posture" />
        <div className="sw-v2-fact-stack">
          <Fact
            label="Evidence coverage rows"
            value={String(coverage.length)}
          />
          <Fact
            label="Spend rows"
            value={String(
              coverage.reduce(
                (sum, row) => sum + (numberFromDb(row.spend_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact
            label="Performance rows"
            value={String(
              coverage.reduce(
                (sum, row) => sum + (numberFromDb(row.performance_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact
            label="Document page text"
            value={String(
              coverage.reduce(
                (sum, row) =>
                  sum + (numberFromDb(row.document_page_text_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact label="Finance confirmed" value="Not established" />
        </div>
      </section>
    </div>
  );
}

function ContractGraphPage({
  portfolio,
  subtab,
  onOpenSubtab,
  showLineage,
  onToggleLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  const lanes = [
    {
      title: "Source systems and files",
      nodes: [
        {
          label: "Contract repository",
          lineage: "CLM agreements, SOWs, pricing schedules, amendments",
        },
        {
          label: "Finance and invoices",
          lineage: "AP / ERP paid amount, invoice amount, cost center",
        },
        {
          label: "Service catalog",
          lineage: "CMDB applications, service towers, hosting model",
        },
        {
          label: "Service performance",
          lineage: "ITSM tickets, incidents, SLA periods, service credits",
        },
        {
          label: "Usage consoles",
          lineage: "SaaS seats, cloud usage, reserved commitments",
        },
      ],
    },
    {
      title: "Adapters",
      nodes: [
        {
          label: "Register adapter",
          lineage: "contract_register_adapter",
        },
        {
          label: "Clause adapter",
          lineage: "contract_clause_adapter",
        },
        {
          label: "Spend adapter",
          lineage: "contract_consumption_adapter",
        },
        {
          label: "Performance adapter",
          lineage: "contract_performance_adapter",
        },
        {
          label: "Scope adapter",
          lineage: "contract_scope_adapter",
        },
        {
          label: "Opportunity adapter",
          lineage: "optimization_opportunity_adapter",
        },
      ],
    },
    {
      title: "Canonical facts",
      nodes: [
        {
          label: "Contract",
          lineage: "source.contract",
        },
        {
          label: "Commercial terms",
          lineage: "source.contract_term",
        },
        {
          label: "Scope and applications",
          lineage: "source.contract_scope",
        },
        {
          label: "Monthly spend observations",
          lineage: "source.contract_consumption_observation",
        },
        {
          label: "Performance observations",
          lineage: "source.contract_performance_observation",
        },
        {
          label: "Optimization opportunities",
          lineage: "source.optimization_opportunity",
        },
      ],
    },
    {
      title: "Source page substrate",
      nodes: [
        {
          label: "Source 360",
          lineage: "source.contract_360",
        },
        {
          label: "Claim cards",
          lineage: "source.contract_claim_card_v1",
        },
        {
          label: "Action queue",
          lineage: "source.contract_action_candidate_v1",
        },
        {
          label: "Vendor position",
          lineage: "source.vendor_position_v1",
        },
        {
          label: "Page storyline",
          lineage: "source.source_page_storyline_v1",
        },
        {
          label: "aVa grounding bundle",
          lineage: "source.ava_grounding_bundle_v1",
        },
      ],
    },
  ];

  return (
    <div className="sw-v2-grid sw-v2-graph-layout">
      <section className="sw-v2-panel sw-v2-span-2 sw-v2-graph-hero-panel">
        <SubtabBar
          tabs={GRAPH_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead
          eyebrow="Contract graph"
          title={graphSubtabTitle(subtab)}
        />
        {subtab === "Volume" ? (
          <GraphVolumeTable portfolio={portfolio} showLineage={showLineage} />
        ) : subtab === "Mapping spine" ? (
          <GraphSpineTable portfolio={portfolio} showLineage={showLineage} />
        ) : (
          <div className="sw-v2-graph">
            {lanes.map((lane) => (
              <div key={lane.title} className="sw-v2-graph-lane">
                <h3>{lane.title}</h3>
                {lane.nodes.map((node) => (
                  <div key={node.lineage} className="sw-v2-graph-node">
                    <b>{node.label}</b>
                    {showLineage ? <small>{node.lineage}</small> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <LineageToggle
          showLineage={showLineage}
          onToggleLineage={onToggleLineage}
        />
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Live substrate" title="What Source can use now" />
        <div className="sw-v2-fact-stack">
          <Fact label="Contracts" value={String(portfolio.contracts.length)} />
          <Fact label="Vendors" value={String(portfolio.vendors.length)} />
          <Fact
            label="Claim cards"
            value={String(portfolio.impact.claimCards.length)}
          />
          <Fact
            label="Action rows"
            value={String(portfolio.impact.actionCandidates.length)}
          />
          <Fact
            label="aVa bundles"
            value={String(portfolio.impact.avaGroundingBundles.length)}
          />
        </div>
      </section>
    </div>
  );
}

function GraphVolumeTable({
  portfolio,
  showLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
}) {
  const coverage = portfolio.impact.evidenceCoverage;
  const rows = [
    {
      layer: "Contract headers",
      object: "source.contract_360",
      count: portfolio.contracts.length,
      claim: "Contract count, vendor, dates, values, renewal posture",
    },
    {
      layer: "Vendor rollups",
      object: "source.vendor_contract_portfolio",
      count: portfolio.vendors.length,
      claim: "Vendor count, concentration, grouped contract list",
    },
    {
      layer: "Application scope",
      object: "source.contract_application_scope",
      count: portfolio.applicationScope.length,
      claim: "Contract-to-application rows only where loaded",
    },
    {
      layer: "Spend rows",
      object: "consumption.sourcing_spend_monthly_v1",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.spend_rows) ?? 0),
        0,
      ),
      claim: "Actual spend trend only where monthly rows exist",
    },
    {
      layer: "Performance rows",
      object: "consumption.sourcing_performance_v1",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.performance_rows) ?? 0),
        0,
      ),
      claim: "SLA and credit posture only where periods exist",
    },
    {
      layer: "Action rows",
      object: "source.contract_action_candidate_v1",
      count: portfolio.impact.actionCandidates.length,
      claim: "Optimize queue rows; not finance-confirmed value",
    },
  ];
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-graph-volume-row">
        <span>Layer</span>
        <span>{showLineage ? "Read object" : "Substrate"}</span>
        <span>Rows</span>
        <span>Allowed claim</span>
      </div>
      {rows.map((row) => (
        <div key={row.object} className="sw-v2-table-row sw-v2-graph-volume-row">
          <span>
            <b>{row.layer}</b>
          </span>
          <span>{showLineage ? row.object : plainSubstrateLabel(row.object)}</span>
          <span>{row.count}</span>
          <span>{row.claim}</span>
        </div>
      ))}
    </div>
  );
}

function GraphSpineTable({
  portfolio,
  showLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
}) {
  const rows: Array<{
    family: string;
    sourceSystem: string;
    adapter: string;
    canonical: string;
    substrate: string;
    rows: number;
  }> = [
    {
      family: "Contract register",
      sourceSystem: "CLM / contract repository",
      adapter: "contract_register_adapter",
      canonical: "source.contract, source.vendor",
      substrate: "source.contract_360",
      rows: portfolio.contracts.length,
    },
    {
      family: "Vendor rollup",
      sourceSystem: "Vendor master and contract refs",
      adapter: "vendor_portfolio_adapter",
      canonical: "source.vendor",
      substrate: "source.vendor_contract_portfolio",
      rows: portfolio.vendors.length,
    },
    {
      family: "Scope to applications",
      sourceSystem: "CMDB / service catalog",
      adapter: "contract_scope_adapter",
      canonical: "source.contract_scope",
      substrate: "source.contract_application_scope",
      rows: portfolio.applicationScope.length,
    },
    {
      family: "Spend consumption",
      sourceSystem: "AP / ERP invoices",
      adapter: "contract_consumption_adapter",
      canonical: "source.contract_consumption_observation",
      substrate: "consumption.sourcing_spend_monthly_v1",
      rows: portfolio.v4Snapshot.spendConsumption.rowCount,
    },
    {
      family: "SLA performance",
      sourceSystem: "ITSM / SLA history",
      adapter: "contract_performance_adapter",
      canonical: "source.contract_performance_observation",
      substrate: "consumption.sourcing_performance_v1",
      rows: portfolio.v4Snapshot.performanceCredits.rowCount,
    },
    {
      family: "Optimization action",
      sourceSystem: "Deterministic impact layer",
      adapter: "optimization_opportunity_adapter",
      canonical: "source.optimization_opportunity",
      substrate: "source.contract_action_candidate_v1",
      rows: portfolio.impact.actionCandidates.length,
    },
  ];
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-graph-spine-row">
        <span>Evidence family</span>
        <span>Source system</span>
        <span>{showLineage ? "Adapter" : "Intake path"}</span>
        <span>{showLineage ? "Canonical" : "Facts created"}</span>
        <span>{showLineage ? "Product substrate" : "Source view"}</span>
        <span>Rows</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.family}
          className="sw-v2-table-row sw-v2-graph-spine-row"
        >
          <span>{row.family}</span>
          <span>{row.sourceSystem}</span>
          <span>
            {showLineage ? row.adapter : plainAdapterLabel(row.adapter)}
          </span>
          <span>
            {showLineage ? row.canonical : plainCanonicalLabel(row.canonical)}
          </span>
          <span>
            {showLineage ? row.substrate : plainSubstrateLabel(row.substrate)}
          </span>
          <span>{row.rows}</span>
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "warn";
}) {
  return (
    <div className={`sw-v2-metric ${tone === "warn" ? "is-warn" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  );
}

function SubtabBar<T extends readonly string[]>({
  tabs,
  active,
  onSelect,
}: {
  tabs: T;
  active: string;
  onSelect: (tab: T[number]) => void;
}) {
  return (
    <div className="sw-v2-subtabbar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          className={active === tab ? "is-active" : ""}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function LineageToggle({
  showLineage,
  onToggleLineage,
}: {
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  return (
    <div className="sw-v2-lineage-toggle">
      <p>
        {showLineage
          ? "Canonical object names, adapters, and read-model paths are visible for audit."
          : "Executive view hides raw substrate names; open lineage when auditing the evidence path."}
      </p>
      <button type="button" onClick={onToggleLineage}>
        {showLineage ? "Hide lineage" : "Show lineage"}
      </button>
    </div>
  );
}

function PanelHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="sw-v2-panel-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function plainAdapterLabel(adapter: string) {
  if (adapter.includes("contract_register")) return "Contract register";
  if (adapter.includes("vendor_portfolio")) return "Vendor rollup";
  if (adapter.includes("scope")) return "Scope mapping";
  if (adapter.includes("consumption")) return "Spend consumption";
  if (adapter.includes("performance")) return "SLA performance";
  if (adapter.includes("optimization")) return "Action calculation";
  return "Mapped intake";
}

function plainCanonicalLabel(canonical: string) {
  if (canonical.includes("contract, source.vendor")) {
    return "Contracts and vendors";
  }
  if (canonical.includes("source.vendor")) return "Vendor facts";
  if (canonical.includes("contract_scope")) return "Scope facts";
  if (canonical.includes("contract_consumption")) return "Monthly spend facts";
  if (canonical.includes("contract_performance")) {
    return "Performance and credit facts";
  }
  if (canonical.includes("optimization")) return "Opportunity facts";
  if (canonical.includes("contract_term")) return "Commercial term facts";
  return "Canonical facts";
}

function plainSubstrateLabel(substrate: string) {
  if (substrate.includes("contract_360")) return "Contract detail";
  if (substrate.includes("vendor_contract_portfolio")) return "Vendor portfolio";
  if (substrate.includes("application_scope")) return "Application scope";
  if (substrate.includes("spend_monthly")) return "Spend trend";
  if (substrate.includes("performance")) return "Performance view";
  if (substrate.includes("action_candidate")) return "Optimize action queue";
  if (substrate.includes("claim_card")) return "Executive claim cards";
  if (substrate.includes("vendor_position")) return "Vendor position";
  if (substrate.includes("source_page_storyline")) return "Page storyline";
  if (substrate.includes("ava_grounding")) return "aVa grounding";
  return "Source view";
}

function ClaimContract({
  allowed,
  blocker,
}: {
  allowed: string;
  blocker: string;
}) {
  return (
    <div className="sw-v2-claim-contract" aria-label="Claim contract">
      <div className="sw-v2-claim-card is-allowed">
        <span>What this tab lets you say</span>
        <b>{allowed}</b>
      </div>
      <div className="sw-v2-claim-card is-blocker">
        <span>Blocked without more evidence</span>
        <b>{blocker}</b>
      </div>
    </div>
  );
}

function claimContractForPage(page: PageLabel) {
  if (page === "Vendors") {
    return {
      allowed:
        "This vendor has N contracts and recorded annual value in the active set.",
      blocker:
        "No vendor-wide SLA, risk score, or realized savings unless broad rows exist.",
    };
  }
  if (page === "Contracts") {
    return {
      allowed:
        "This contract is actionable only when evidence-backed conditions exist.",
      blocker:
        "No narrative-only opportunity and no zero-fill for missing rows.",
    };
  }
  if (page === "Optimize") {
    return {
      allowed: "Action opportunity, not finance-confirmed realized value.",
      blocker:
        "Never label an amount as realized savings before finance state changes.",
    };
  }
  if (page === "Evidence") {
    return {
      allowed: "Open the exact evidence family behind every claim.",
      blocker:
        "Do not render page-span document claims or portfolio SLA without required rows.",
    };
  }
  if (page === "Contract graph") {
    return {
      allowed:
        "Every figure traces to a source file, adapter, canonical object, and read model.",
      blocker:
        "No lineage claim for change-order timelines or page-span retrieval until proven.",
    };
  }
  return {
    allowed:
      "Here is the governed contract decision set and its evidence coverage.",
    blocker: "No portfolio-wide claims without a coverage denominator.",
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="sw-v2-fact">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ValueLane({
  title,
  value,
  note,
  active,
}: {
  title: string;
  value: string;
  note: string;
  active?: boolean;
}) {
  return (
    <div className={`sw-v2-lane ${active ? "is-active" : ""}`}>
      <span>{title}</span>
      <b>{value}</b>
      <p>{note}</p>
    </div>
  );
}

function ContractScopeTable({
  scopeRows,
}: {
  scopeRows: readonly SourceContractApplicationScopeRow[];
}) {
  if (scopeRows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No scoped applications loaded for this contract.</b>
        <p>
          Source can show the contract header, but it will not infer which
          applications, services, or business functions are covered.
        </p>
      </div>
    );
  }

  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-scope-row">
        <span>Application / service</span>
        <span>Business function</span>
        <span>Criticality</span>
        <span>Hosting</span>
        <span>Run cost</span>
      </div>
      {scopeRows.slice(0, 12).map((row) => (
        <div
          key={`${row.contract_id}:${row.application_ref}`}
          className="sw-v2-table-row sw-v2-scope-row"
        >
          <span>
            <b>{row.application_name}</b>
            <small>{row.application_ref}</small>
          </span>
          <span>{row.business_function ?? "Not established"}</span>
          <span>{row.criticality ?? "Not established"}</span>
          <span>{row.hosting_model ?? "Not established"}</span>
          <span>{money(numberFromDb(row.annual_run_cost))}</span>
        </div>
      ))}
      {scopeRows.length > 12 ? (
        <div className="sw-v2-table-foot">
          Showing 12 of {scopeRows.length} scoped rows.
        </div>
      ) : null}
    </div>
  );
}

function activePage(
  logic: WorkspaceViewModel,
  vm: SourceWorkspaceVM,
): PageLabel {
  if (logic.state.sel.kind === "evidence") return "Evidence";
  if (logic.state.sel.kind === "graph") return "Contract graph";
  if (logic.state.sel.kind === "vendor" || vm.isVendorList) return "Vendors";
  if (vm.isContractList) return "Contracts";
  if (logic.state.sel.kind === "optimize") return "Optimize";
  if (vm.isContract) return "Contracts";
  return "Verdict";
}

function preferredContract(portfolio: SourceWorkspacePortfolioData) {
  const creditContract = portfolio.cockpit.actionQueue.find((row) =>
    /credit/i.test(`${row.actionVerb} ${row.why}`),
  );
  if (creditContract) {
    return (
      portfolio.contracts.find(
        (contract) => contract.contract_id === creditContract.contractId,
      ) ?? null
    );
  }
  const topContract = portfolio.cockpit.topContracts[0];
  return topContract
    ? (portfolio.contracts.find(
        (contract) => contract.contract_id === topContract.contractId,
      ) ?? null)
    : null;
}

function supportByLabel(
  portfolio: SourceWorkspacePortfolioData,
  label: string,
) {
  return (
    portfolio.cockpit.verdict.supports.find(
      (support) => support.label === label,
    ) ?? null
  );
}

function claimQualityByLabel(
  portfolio: SourceWorkspacePortfolioData,
  label: string,
) {
  return (
    portfolio.cockpit.claimQualityControls.find(
      (control) => control.label === label,
    ) ?? null
  );
}

function coverageForContract(
  portfolio: SourceWorkspacePortfolioData,
  contractId: string,
) {
  return (
    portfolio.impact.evidenceCoverage.find(
      (row) => row.contract_id === contractId,
    ) ?? null
  );
}

function storylineBySurface(
  portfolio: SourceWorkspacePortfolioData,
  surfaceKey: string,
) {
  return (
    portfolio.impact.storyline.find((row) => row.page_key === surfaceKey) ??
    portfolio.impact.storyline.find((row) => row.section_key === surfaceKey) ??
    null
  );
}

function formatCount(value: number | null | undefined) {
  return value == null ? "Not established" : String(value);
}

function contractsByAnnualValue(
  contracts: readonly SourceContract360Row[],
) {
  return contracts
    .slice()
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    );
}

function focusedContractSet(
  portfolio: SourceWorkspacePortfolioData,
  limit = 7,
): FocusedContractSet {
  const coverageByContract = new Map(
    portfolio.impact.evidenceCoverage.map((row) => [row.contract_id, row]),
  );
  const actionRowsByContract = countByContract(
    portfolio.impact.actionCandidates.map((row) => row.contract_id),
  );
  const claimRowsByContract = countByContract(
    portfolio.impact.claimCards.map((row) => row.contract_id),
  );
  const ranked = contractsByAnnualValue(portfolio.contracts)
    .map((contract): FocusedContractRow => {
      const coverage = coverageByContract.get(contract.contract_id) ?? null;
      const actionRows = actionRowsByContract.get(contract.contract_id) ?? 0;
      const claimRows = claimRowsByContract.get(contract.contract_id) ?? 0;
      const depthScore = contractDepthScore(contract, coverage, actionRows, claimRows);
      return {
        contract,
        coverage,
        actionRows,
        claimRows,
        depthScore,
        reason: contractFocusReason(contract, coverage, actionRows, claimRows),
      };
    })
    .sort(
      (a, b) =>
        b.depthScore - a.depthScore ||
        (numberFromDb(b.contract.annual_value) ?? 0) -
          (numberFromDb(a.contract.annual_value) ?? 0),
    );
  const rows = ranked
    .filter((row) => row.depthScore > 0)
    .slice(0, limit);
  if (rows.length < Math.min(limit, 3)) {
    const selected = new Set(rows.map((row) => row.contract.contract_id));
    for (const row of ranked) {
      if (rows.length >= Math.min(limit, 3)) break;
      if (selected.has(row.contract.contract_id)) continue;
      rows.push(row);
      selected.add(row.contract.contract_id);
    }
  }
  const selectedIds = new Set(rows.map((row) => row.contract.contract_id));
  const remainder = portfolio.contracts.filter(
    (contract) => !selectedIds.has(contract.contract_id),
  );
  return {
    rows,
    remainderCount: remainder.length,
    remainderAnnualValue: remainder.reduce(
      (sum, contract) => sum + (numberFromDb(contract.annual_value) ?? 0),
      0,
    ),
    depthReadyCount: ranked.filter((row) => row.depthScore > 0).length,
  };
}

function countByContract(contractIds: readonly string[]) {
  const counts = new Map<string, number>();
  for (const contractId of contractIds) {
    counts.set(contractId, (counts.get(contractId) ?? 0) + 1);
  }
  return counts;
}

function contractDepthScore(
  contract: SourceContract360Row,
  coverage: SourceContractEvidenceCoverageRow | null,
  actionRows: number,
  claimRows: number,
) {
  return (
    actionRows * 100 +
    claimRows * 90 +
    (coverage?.opportunity_rows ?? 0) * 80 +
    (coverage?.performance_rows ?? 0) * 8 +
    (coverage?.spend_rows ?? 0) * 6 +
    (coverage?.document_page_text_rows ?? 0) * 3 +
    (coverage?.scope_rows ?? 0) * 2 +
    (numberFromDb(coverage?.unclaimed_credit_usd) ?? 0) / 10000 +
    (numberFromDb(contract.actual_annual_spend) == null ? 0 : 5)
  );
}

function contractFocusReason(
  contract: SourceContract360Row,
  coverage: SourceContractEvidenceCoverageRow | null,
  actionRows: number,
  claimRows: number,
) {
  if (claimRows > 0) return `${claimRows} executive claim card${claimRows === 1 ? "" : "s"}`;
  if (actionRows > 0) return `${actionRows} action row${actionRows === 1 ? "" : "s"}`;
  if ((coverage?.unclaimed_credit_usd ?? 0) > 0) return "Unclaimed credit evidence";
  if ((coverage?.performance_rows ?? 0) > 0) return "Performance evidence loaded";
  if ((coverage?.spend_rows ?? 0) > 0) return "Monthly spend loaded";
  if ((coverage?.document_page_text_rows ?? 0) > 0) return "Document text loaded";
  if ((coverage?.scope_rows ?? 0) > 0) return "Application scope mapped";
  if (numberFromDb(contract.actual_annual_spend) != null) return "Actual spend loaded";
  return "Header-only portfolio signal";
}

function focusedVendorSet(
  portfolio: SourceWorkspacePortfolioData,
  vendors: readonly ExecutiveVendorRow[],
  mode: "concentration" | "evidence",
  limit = 7,
): FocusedVendorSet {
  const coverageByVendor = vendorCoverageRows(portfolio);
  const ranked = vendors
    .map((vendor): FocusedVendorRow => {
      const coverage = coverageByVendor.get(vendor.vendor_ref) ?? null;
      return {
        vendor,
        coverage,
        reason:
          mode === "evidence"
            ? vendorEvidenceReason(coverage)
            : vendorConcentrationReason(vendor),
      };
    })
    .sort((a, b) => {
      if (mode === "evidence") {
        return (
          vendorDepthScore(b.coverage) - vendorDepthScore(a.coverage) ||
          (numberFromDb(b.vendor.annual_value) ?? 0) -
            (numberFromDb(a.vendor.annual_value) ?? 0)
        );
      }
      return (
        (numberFromDb(b.vendor.annual_value) ?? 0) -
        (numberFromDb(a.vendor.annual_value) ?? 0)
      );
    });
  const rows =
    mode === "evidence"
      ? ranked.filter((row) => vendorDepthScore(row.coverage) > 0).slice(0, limit)
      : ranked.slice(0, limit);
  if (mode === "evidence" && rows.length < Math.min(limit, 3)) {
    const selected = new Set(rows.map((row) => row.vendor.vendor_ref));
    for (const row of ranked) {
      if (rows.length >= Math.min(limit, 3)) break;
      if (selected.has(row.vendor.vendor_ref)) continue;
      rows.push(row);
      selected.add(row.vendor.vendor_ref);
    }
  }
  const selectedRefs = new Set(rows.map((row) => row.vendor.vendor_ref));
  const remainder = vendors.filter(
    (vendor) => !selectedRefs.has(vendor.vendor_ref),
  );
  return {
    rows,
    remainderCount: remainder.length,
    remainderAnnualValue: remainder.reduce(
      (sum, vendor) => sum + (numberFromDb(vendor.annual_value) ?? 0),
      0,
    ),
    depthReadyCount: ranked.filter((row) => vendorDepthScore(row.coverage) > 0)
      .length,
  };
}

function vendorDepthScore(coverage: VendorCoverageSummary | null) {
  if (!coverage) return 0;
  return (
    coverage.actionRows * 100 +
    coverage.performanceRows * 8 +
    coverage.spendRows * 6 +
    coverage.unclaimedCredit / 10000
  );
}

function vendorEvidenceReason(coverage: VendorCoverageSummary | null) {
  if (!coverage) return "Rollup only";
  if (coverage.unclaimedCredit > 0) return "Unclaimed credit evidence";
  if (coverage.actionRows > 0) return "Action rows loaded";
  if (coverage.performanceRows > 0) return "Performance rows loaded";
  if (coverage.spendRows > 0) return "Spend rows loaded";
  return "Rollup only";
}

function vendorConcentrationReason(vendor: ExecutiveVendorRow) {
  if (vendor.contract_count > 1) return "Multi-contract relationship";
  if (vendor.auto_renew_contracts > 0) return "Auto-renew exposure";
  return "Largest recorded relationships";
}

function vendorCoverageRows(portfolio: SourceWorkspacePortfolioData) {
  const rows = new Map<string, VendorCoverageSummary>();
  const vendorRefsByContract = new Map(
    portfolio.contracts.map((contract) => [
      contract.contract_id,
      contract.vendor_ref,
    ]),
  );
  for (const coverage of portfolio.impact.evidenceCoverage) {
    const vendorRef =
      coverage.vendor_ref || vendorRefsByContract.get(coverage.contract_id);
    if (!vendorRef) continue;
    const current = rows.get(vendorRef) ?? {
      spendRows: 0,
      performanceRows: 0,
      actionRows: 0,
      unclaimedCredit: 0,
    };
    current.spendRows += numberFromDb(coverage.spend_rows) ?? 0;
    current.performanceRows += numberFromDb(coverage.performance_rows) ?? 0;
    current.actionRows += numberFromDb(coverage.opportunity_rows) ?? 0;
    current.unclaimedCredit += numberFromDb(coverage.unclaimed_credit_usd) ?? 0;
    rows.set(vendorRef, current);
  }
  return rows;
}

function vendorArchetypeRows(portfolio: SourceWorkspacePortfolioData) {
  const groups = new Map<
    string,
    {
      category: string;
      vendorRefs: Set<string>;
      contractCount: number;
      annualValue: number;
      vendorRef: string | null;
      vendorName: string | null;
    }
  >();
  for (const contract of portfolio.contracts) {
    const category = contract.vendor_category ?? "Not established";
    const current =
      groups.get(category) ??
      {
        category,
        vendorRefs: new Set<string>(),
        contractCount: 0,
        annualValue: 0,
        vendorRef: null,
        vendorName: null,
      };
    current.vendorRefs.add(contract.vendor_ref);
    current.contractCount += 1;
    current.annualValue += numberFromDb(contract.annual_value) ?? 0;
    if (!current.vendorRef) {
      current.vendorRef = contract.vendor_ref;
      current.vendorName = contract.vendor_name;
    }
    groups.set(category, current);
  }
  return [...groups.values()]
    .map((row) => ({
      category: row.category,
      vendorCount: row.vendorRefs.size,
      contractCount: row.contractCount,
      annualValue: row.annualValue,
      vendorRef: row.vendorRef,
      vendorName: row.vendorName,
    }))
    .sort((a, b) => b.annualValue - a.annualValue);
}

function optimizeTypeRows(portfolio: SourceWorkspacePortfolioData) {
  const groups = new Map<
    string,
    {
      type: string;
      count: number;
      amount: number;
      financeStates: Set<string>;
    }
  >();
  for (const candidate of portfolio.impact.actionCandidates) {
    const type =
      candidate.opportunity_type ?? candidate.action_type ?? "Not established";
    const current =
      groups.get(type) ??
      { type, count: 0, amount: 0, financeStates: new Set<string>() };
    current.count += 1;
    current.amount += numberFromDb(candidate.candidate_amount_usd) ?? 0;
    current.financeStates.add(candidate.finance_confirmation_state);
    groups.set(type, current);
  }
  return [...groups.values()]
    .map((row) => ({
      type: row.type.replace(/_/g, " "),
      count: row.count,
      amount: row.amount,
      financeState: [...row.financeStates].join(", "),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function focusedActionSet(
  portfolio: SourceWorkspacePortfolioData,
): FocusedActionSet {
  const rows = [...portfolio.impact.actionCandidates].sort((left, right) => {
    const rightAmount = numberFromDb(right.candidate_amount_usd) ?? 0;
    const leftAmount = numberFromDb(left.candidate_amount_usd) ?? 0;
    return rightAmount - leftAmount || left.contract_id.localeCompare(right.contract_id);
  });
  const visibleRows = rows.slice(0, 5);
  const remainderRows = rows.slice(5);
  return {
    rows: visibleRows,
    remainderCount: remainderRows.length,
    remainderAmount: remainderRows.reduce(
      (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
      0,
    ),
    totalRows: rows.length,
    totalAmount: rows.reduce(
      (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
      0,
    ),
  };
}

function formatFinanceState(state: string | null | undefined) {
  if (!state) return "Not established";
  return state.replace(/_/g, " ");
}

function financialPosture(contract: SourceContract360Row) {
  const actual = numberFromDb(contract.actual_annual_spend);
  const annual = numberFromDb(contract.annual_value);
  if (actual == null) return "Actual spend not established";
  if (annual == null) return "Annual value not established";
  const variance = actual - annual;
  if (Math.abs(variance) < 1) return "Actual matches annual value";
  return variance > 0
    ? `${money(variance)} above annual value`
    : `${money(Math.abs(variance))} below annual value`;
}

function vendorSubtabTitle(subtab: string) {
  if (subtab === "Evidence depth") return "Which vendors have usable depth";
  if (subtab === "Archetype mix") return "Declared contract archetypes";
  return "One row per supplier relationship";
}

function contractListSubtabTitle(subtab: string) {
  if (subtab === "Evidence depth") return "Which contracts can support detail";
  if (subtab === "Financial posture") return "Annual, actual, and committed values";
  return "Focused contract set";
}

function optimizeSubtabTitle(subtab: string) {
  if (subtab === "Type mix") return "Action rows grouped by type";
  if (subtab === "Contract readiness") return "Contract-level action rows";
  return "Evidence-backed action queue";
}

function graphSubtabTitle(subtab: string) {
  if (subtab === "Volume") return "Loaded row volume by substrate";
  if (subtab === "Mapping spine") return "Source system to product mapping";
  return "Contract at the center; systems, facts, and actions around it";
}

export function topVendors(
  portfolio: SourceWorkspacePortfolioData,
): ExecutiveVendorRow[] {
  const byVendorName = new Map<string, ExecutiveVendorRow>();
  for (const vendor of portfolio.vendors) {
    const key = normalizedVendorName(vendor.vendor_name);
    const existing = byVendorName.get(key);
    if (!existing) {
      byVendorName.set(key, { ...vendor, vendor_refs: [vendor.vendor_ref] });
      continue;
    }
    byVendorName.set(key, {
      ...existing,
      vendor_category: existing.vendor_category ?? vendor.vendor_category,
      contract_count: existing.contract_count + vendor.contract_count,
      annual_value:
        (numberFromDb(existing.annual_value) ?? 0) +
        (numberFromDb(vendor.annual_value) ?? 0),
      total_committed_value:
        (numberFromDb(existing.total_committed_value) ?? 0) +
        (numberFromDb(vendor.total_committed_value) ?? 0),
      auto_renew_contracts:
        existing.auto_renew_contracts + vendor.auto_renew_contracts,
      next_end_date: earlierDate(existing.next_end_date, vendor.next_end_date),
      contract_refs: uniqueRefs([
        ...existing.contract_refs,
        ...vendor.contract_refs,
      ]),
      vendor_refs: uniqueRefs([...existing.vendor_refs, vendor.vendor_ref]),
    });
  }
  return [...byVendorName.values()]
    .map((vendor) => withContractBackedVendorMetrics(vendor, portfolio.contracts))
    .slice()
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    );
}

export function displayBenchmarkingClause(value: string | null | undefined) {
  const clause = value?.trim();
  if (!clause || isActionNarrative(clause)) return "Not established";
  return clause;
}

function isActionNarrative(value: string) {
  return (
    /^\(\d+\)/.test(value.trim()) ||
    /\b(unused entitlements|right-size|potential savings|approximately \$|current unit pricing|convert the|consolidate overlapping|recommend|candidate opportunity)\b/i.test(
      value,
    )
  );
}

function withContractBackedVendorMetrics(
  vendor: ExecutiveVendorRow,
  contracts: readonly SourceContract360Row[],
): ExecutiveVendorRow {
  const contractRefs = uniqueRefs(vendor.contract_refs);
  const linkedContracts = vendorLinkedContracts(contracts, {
    ...vendor,
    contract_refs: contractRefs,
  });
  if (linkedContracts.length === 0) {
    return {
      ...vendor,
      contract_refs: contractRefs,
      contract_count: contractRefs.length || vendor.contract_count,
    };
  }
  const annualValue = linkedContracts.reduce(
    (sum, contract) =>
      sum +
      (numberFromDb(contract.resolved_annual_value) ??
        numberFromDb(contract.annual_value) ??
        0),
    0,
  );
  const totalCommittedValue = linkedContracts.reduce(
    (sum, contract) =>
      sum +
      (numberFromDb(contract.resolved_total_committed_value) ??
        numberFromDb(contract.total_committed_value) ??
        0),
    0,
  );
  const nextEndDate = linkedContracts.reduce<string | null>(
    (next, contract) => earlierDate(next, contract.end_date),
    null,
  );

  return {
    ...vendor,
    contract_count: linkedContracts.length,
    annual_value: annualValue > 0 ? annualValue : vendor.annual_value,
    total_committed_value:
      totalCommittedValue > 0
        ? totalCommittedValue
        : vendor.total_committed_value,
    auto_renew_contracts: linkedContracts.filter(
      (contract) => contract.auto_renew,
    ).length,
    next_end_date: nextEndDate ?? vendor.next_end_date,
    contract_refs: uniqueRefs(
      linkedContracts.map((contract) => contract.contract_id),
    ),
  };
}

function vendorLinkedContracts(
  contracts: readonly SourceContract360Row[],
  vendor: ExecutiveVendorRow,
) {
  const explicitRefs = new Set(uniqueRefs(vendor.contract_refs));
  const vendorRefs = new Set(uniqueRefs([vendor.vendor_ref, ...vendor.vendor_refs]));
  const normalizedName = normalizedVendorName(vendor.vendor_name);
  const rows = new Map<string, SourceContract360Row>();
  for (const contract of contracts) {
    const hasExplicitRef = explicitRefs.has(contract.contract_id);
    const hasVendorRef = vendorRefs.has(contract.vendor_ref);
    const hasVendorName =
      normalizedName.length > 0 &&
      normalizedVendorName(contract.vendor_name) === normalizedName;
    if (hasExplicitRef || hasVendorRef || hasVendorName) {
      rows.set(contract.contract_id, contract);
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      (numberFromDb(b.resolved_annual_value) ??
        numberFromDb(b.annual_value) ??
        0) -
      (numberFromDb(a.resolved_annual_value) ??
        numberFromDb(a.annual_value) ??
        0),
  );
}

function normalizedVendorName(name: string) {
  return name
    .toLowerCase()
    .replace(
      /\b(incorporated|inc|corporation|corp|llc|ltd|limited|company|co)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactVendorName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 16).trim()}...`;
}

function earlierDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function uniqueRefs(refs: readonly string[]) {
  return [...new Set(refs.filter(Boolean))];
}

function portfolioAnnualValue(portfolio: SourceWorkspacePortfolioData) {
  const snapshotValue = numberFromDb(
    portfolio.v4Snapshot.executivePortfolio.annualValue,
  );
  if (snapshotValue && snapshotValue > 0) return snapshotValue;
  const vendorValue = portfolio.vendors.reduce(
    (sum, vendor) => sum + (numberFromDb(vendor.annual_value) ?? 0),
    0,
  );
  return vendorValue > 0 ? vendorValue : null;
}

function vendorShare(
  vendor: SourceVendorContractPortfolioRow,
  totalAnnualValue: number | null,
) {
  const value = numberFromDb(vendor.annual_value) ?? 0;
  if (!totalAnnualValue || totalAnnualValue <= 0) return 0;
  return Math.max(3, Math.min(100, (value / totalAnnualValue) * 100));
}

function formatShare(
  vendor: SourceVendorContractPortfolioRow,
  totalAnnualValue: number | null,
) {
  const value = numberFromDb(vendor.annual_value) ?? 0;
  if (!totalAnnualValue || totalAnnualValue <= 0) return "Not established";
  return `${((value / totalAnnualValue) * 100).toFixed(1)}%`;
}

function shortMonth(value: string | null | undefined) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 7);
  return date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function headlineFor(
  page: PageLabel,
  tenantName: string,
  vendor: SourceVendorContractPortfolioRow | null,
  contract: SourceContract360Row | null,
) {
  if (page === "Vendors") return vendor?.vendor_name ?? "Vendor portfolio";
  if (page === "Contracts") return contract?.vendor_name ?? "Contract 360";
  if (page === "Optimize") return "Optimize evidenced opportunities";
  if (page === "Evidence") return "Evidence and proof";
  if (page === "Contract graph") return "Source contract graph";
  return "Source 360";
}

function subheadFor(
  page: PageLabel,
  portfolio: SourceWorkspacePortfolioData,
  vendor: SourceVendorContractPortfolioRow | null,
  contract: SourceContract360Row | null,
) {
  if (page === "Vendors") {
    return vendor
      ? `${vendor.contract_count} contracts / ${money(numberFromDb(vendor.annual_value))} recorded annual value.`
      : `${portfolio.vendors.length} supplier relationships with recorded contract count and annual value.`;
  }
  if (page === "Contracts" && contract) {
    return `${contract.contract_id} / ${money(numberFromDb(contract.annual_value))} annual value / expiry ${fmtDate(contract.end_date)}.`;
  }
  if (page === "Optimize") {
    return "Only quantified findings with loaded evidence are shown. Finance confirmation remains separate.";
  }
  if (page === "Evidence") {
    return "Evidence lanes, row counts, and blockers are visible without exposing raw diagnostics by default.";
  }
  if (page === "Contract graph") {
    return "A governed lineage map from source systems through adapters, canonical facts, cubes, Source, Tower, and aVa.";
  }
  return `${portfolio.contracts.length} contracts / ${portfolio.vendors.length} vendors. Unsupported dashboard claims are hidden.`;
}

function contractTabNarrative(
  tab: string,
  vm: SourceWorkspaceVM,
  contract: SourceContract360Row,
  coverage: ReturnType<typeof coverageForContract>,
  scopeRows: readonly SourceContractApplicationScopeRow[],
  claimCard:
    | SourceWorkspacePortfolioData["impact"]["claimCards"][number]
    | undefined,
) {
  if (tab === "Scope") {
    if (scopeRows.length > 0) {
      const namedRows = scopeRows.filter(
        (row) =>
          row.application_name &&
          !/^scoped application \d+$/i.test(row.application_name),
      ).length;
      return {
        headline: `${scopeRows.length} scoped application rows loaded.`,
        body: `${namedRows} of ${scopeRows.length} rows carry named application or service scope. Criticality, hosting, and run-cost fields remain visible only where Source has them.`,
        provenance: "Scope basis",
        blocker:
          namedRows === scopeRows.length
            ? "Do not infer unsupported tower, module, or CMDB relationships beyond these rows."
            : "Generic scope labels block a stronger executive claim until CMDB/SOW names are loaded.",
      };
    }
    return {
      headline: "No application or service scope rows loaded.",
      body: "The contract exists in the governed book, but Source does not yet know what applications, services, or functions it covers.",
      provenance: "Scope gap",
      blocker:
        "No scope rationalization, app risk, or tower handoff claim is allowed without scoped rows.",
    };
  }
  if (tab === "Performance") {
    if (vm.detailState === "ready" && vm.detail?.performancePeriods?.length) {
      return {
        headline: `${vm.detail.performancePeriods.length} performance periods loaded.`,
        body: "Monthly performance rows are loaded for this contract. Misses and service-credit amounts stay visible as evidence, not finance-confirmed value.",
        provenance: "Performance basis",
        blocker:
          "Credit rows do not become realized value until finance confirmation is loaded.",
      };
    }
    if ((coverage?.performance_rows ?? 0) > 0) {
      return {
        headline: `${coverage?.performance_rows} governed performance rows loaded.`,
        body: `${coverage?.performance_rows} governed performance rows are in the Source impact layer for this contract. Open detail proof before using row-level claims.`,
        provenance: "Performance basis",
        blocker:
          "Withhold period-by-period conclusions until the detail rows render in this tab.",
      };
    }
    return {
      headline: "No performance periods loaded.",
      body: "No contract-specific performance periods are loaded for this selection.",
      provenance: "Performance gap",
      blocker:
        "No SLA quality, credit, or performance trend claim is allowed for this contract.",
    };
  }
  if (tab === "Relationship") {
    return {
      headline: "Relationship is limited to loaded rollups and headers.",
      body: "Relationship facts are limited to the vendor rollup and contract headers unless dependency rows are loaded.",
      provenance: "Relationship basis",
      blocker:
        "Do not claim business-unit, application, or tower dependency coverage without matching rows.",
    };
  }
  if (tab === "Evidence") {
    if (vm.detailState === "error") {
      return {
        headline: "Per-contract detail is unavailable.",
        body: "Per-contract detail could not load. The workspace is withholding evidence claims for this contract.",
        provenance: "Evidence guard",
        blocker:
          "Do not use document, clause, or row-level claims from this contract until detail proof loads.",
      };
    }
    return {
      headline: "Evidence rows and missing inputs stay separate.",
      body: "Evidence rows, source documents, and missing inputs are separated from the contract header.",
      provenance: "Evidence basis",
      blocker:
        "No document page-span claim is allowed unless page text and source document IDs are loaded.",
    };
  }
  if (tab === "Optimize") {
    if (claimCard) {
      return {
        headline: claimCard.claim_title ?? "Evidence-backed action row",
        body: claimCard.allowed_executive_statement,
        provenance: "Action basis",
        blocker:
          claimCard.blocker_if_missing ??
          "Finance confirmation remains separate from action opportunity.",
      };
    }
    return {
      headline: "No contract-specific opportunity loaded.",
      body: vm.opportunityView
        ? vm.opportunityView.recommendationDetail
        : "No contract-specific opportunity set is loaded for this selection.",
      provenance: "Optimize gap",
      blocker:
        "Do not manufacture savings or recommend action without a candidate and evidence rows.",
    };
  }
  if (tab === "Economics") {
    if ((coverage?.spend_rows ?? 0) > 0) {
      return {
        headline: `${coverage?.spend_rows} monthly spend rows loaded.`,
        body: `${coverage?.spend_rows} monthly spend rows support actual spend. Missing finance confirmation still blocks realized-value language.`,
        provenance: "Economics basis",
        blocker:
          "Actual spend is evidence, not realized savings or budget approval.",
      };
    }
    return {
      headline: "Actual spend is not established.",
      body: "Economics shows recorded annual value and actual spend only. Missing spend is not converted to zero.",
      provenance: "Economics gap",
      blocker:
        "No variance, consumption, or run-rate story without monthly spend rows.",
    };
  }
  return {
    headline: "Contract header loaded; actions require evidence.",
    body: `${contract.vendor_name} has a governed contract header. Source sizes action only where supporting rows are loaded.`,
    provenance: "Story basis",
    blocker:
      "No opportunity narrative unless the tab can point to scope, spend, performance, or claim rows.",
  };
}

function detailStateLabel(state: SourceWorkspaceVM["detailState"]) {
  if (state === "ready") return "Detail loaded";
  if (state === "loading") return "Loading detail";
  if (state === "error") return "Detail unavailable";
  return "Header only";
}

export function performanceActual(actualValue: unknown, valueNum: unknown) {
  const formatActual = (actual: number) =>
    actual <= 1 ? pct(actual) : `${actual.toFixed(1)}%`;
  if (typeof actualValue === "number" && Number.isFinite(actualValue)) {
    return formatActual(actualValue);
  }
  if (actualValue != null) {
    const actualText = String(actualValue).trim();
    if (actualText) return actualText;
  }
  const actual = numberFromDb(valueNum);
  if (actual == null) return "Not established";
  return formatActual(actual);
}
