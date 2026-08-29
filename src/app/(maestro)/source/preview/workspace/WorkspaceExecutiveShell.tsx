"use client";

import type { CSSProperties } from "react";
import type { SourceWorkspaceVM } from "./buildViewModel";
import { fmtDate, money, pct, type WorkspaceViewModel } from "./viewModel";
import type { SourceWorkspacePortfolioData } from "./live/portfolioAdapter";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";

const PAGE_LABELS = [
  "Portfolio",
  "Vendors",
  "Contract 360",
  "Optimize",
] as const;
const CONTRACT_TABS = [
  "Story",
  "Economics",
  "Performance",
  "Relationship",
  "Evidence",
  "Optimize",
] as const;

type PageLabel = (typeof PAGE_LABELS)[number];

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
  const selectedContract =
    (vm.c?.id
      ? portfolio.contracts.find(
          (contract) => contract.contract_id === vm.c?.id,
        )
      : null) ??
    preferredContract(portfolio) ??
    portfolio.contracts[0] ??
    null;
  const selectedVendorRef =
    logic.state.sel.kind === "vendor"
      ? logic.state.sel.id
      : (selectedContract?.vendor_ref ??
        topVendors(portfolio)[0]?.vendor_ref ??
        null);
  const selectedVendor = selectedVendorRef
    ? (portfolio.vendors.find(
        (vendor) => vendor.vendor_ref === selectedVendorRef,
      ) ?? null)
    : null;
  const currentPage = activePage(logic, vm);
  const totalAnnualValue = portfolioAnnualValue(portfolio);
  const decisionSupport = supportByLabel(portfolio, "Exposed annual value");
  const windowSupport = supportByLabel(portfolio, "Decision window");
  const confidenceSupport = supportByLabel(portfolio, "Mean confidence");
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
  const findingContract =
    creditFinding > 0
      ? (portfolio.cockpit.actionQueue.find((row) =>
          /credit/i.test(`${row.actionVerb} ${row.why}`),
        ) ??
        portfolio.cockpit.actionQueue[0] ??
        null)
      : null;

  const selectPage = (page: PageLabel) => {
    if (page === "Portfolio") {
      logic.select("portfolio", null, "Portfolio");
      return;
    }
    if (page === "Vendors") {
      logic.select("vendorList", null);
      return;
    }
    const contract = selectedContract ?? portfolio.contracts[0] ?? null;
    if (!contract) return;
    logic.select(
      "contract",
      contract.contract_id,
      page === "Optimize" ? "Optimize" : "Story",
    );
  };

  const openContract = (contractId: string, tab: string = "Story") =>
    logic.select("contract", contractId, tab);

  const openVendor = (vendorRef: string) => logic.select("vendor", vendorRef);

  return (
    <main className="sw-v2-shell" aria-label="Source workspace">
      <aside className="sw-v2-rail" aria-label="Source workspace sidebar">
        <div>
          <div className="sw-v2-mark">Nexus Source</div>
          <p className="sw-v2-rail-note">
            Governed contract book. Cross-contract facts only.
          </p>
        </div>
        <nav
          className="sw-v2-rail-nav"
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
        <div className="sw-v2-rail-foot">
          <span>{portfolio.workspaceDiagnostics.exploreProvider}</span>
          <b>{fmtDate(portfolio.asOfDateIso)}</b>
        </div>
      </aside>

      <section className="sw-v2-main">
        <header className="sw-v2-topbar">
          <div>
            <div className="sw-v2-breadcrumb">Vendor 360 / {currentPage}</div>
            <h1>
              {headlineFor(
                currentPage,
                tenantName,
                selectedVendor,
                selectedContract,
              )}
            </h1>
            <p>
              {subheadFor(
                currentPage,
                portfolio,
                selectedVendor,
                selectedContract,
              )}
            </p>
          </div>
          <div className="sw-v2-actions">
            <button
              type="button"
              onClick={() => logic.select("vendorList", null)}
            >
              Vendors
            </button>
            <button
              type="button"
              onClick={() => logic.select("contractList", null)}
            >
              Contracts
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedContract)
                  openContract(selectedContract.contract_id, "Optimize");
              }}
            >
              Optimize
            </button>
          </div>
        </header>

        <section className="sw-v2-metrics" aria-label="Portfolio facts">
          <Metric
            label="Contracts"
            value={String(portfolio.contracts.length)}
            note="source.contract_360"
          />
          <Metric
            label="Vendors"
            value={String(portfolio.vendors.length)}
            note="source.vendor_contract_portfolio"
          />
          <Metric
            label="Annual value"
            value={money(totalAnnualValue)}
            note="sum of recorded annual_value"
          />
          <Metric
            label="Decision set"
            value={decisionSupport?.value ?? "Not established"}
            note={
              decisionSupport?.note ??
              "No qualifying rows in the governed window"
            }
          />
          <Metric
            label="Nearest deadline"
            value={windowSupport?.value ?? "Not established"}
            note={windowSupport?.note ?? "Needs notice_deadline or end_date"}
            tone="warn"
          />
          <Metric
            label="Mean confidence"
            value={confidenceSupport?.value ?? "Not established"}
            note={confidenceSupport?.note ?? "Numeric source_confidence only"}
          />
        </section>

        {currentPage === "Portfolio" ? (
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
            onOpenVendor={openVendor}
            onOpenContract={openContract}
          />
        ) : null}

        {currentPage === "Contract 360" && selectedContract ? (
          <ContractPage
            vm={vm}
            logic={logic}
            portfolio={portfolio}
            contract={selectedContract}
            onOpenTab={(tab) => logic.setTab("contract", tab)}
          />
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
            onOpenContract={openContract}
          />
        ) : null}
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

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead
          eyebrow="Executive position"
          title={storyline?.headline ?? portfolio.cockpit.verdict.headline}
        />
        <p className="sw-v2-lede">
          {storyline?.allowed_executive_statement ??
            portfolio.cockpit.verdict.decidingAxis}
        </p>
        <div className="sw-v2-decision-list">
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

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Candidate opportunity"
          title="Finance confirmation remains separate"
        />
        {impactCandidateAmount > 0 ? (
          <>
            <div className="sw-v2-finding-value">
              {money(impactCandidateAmount)}
            </div>
            <p className="sw-v2-muted">
              Sum of deterministic action candidates in the loaded
              contract-depth package. Do not present as realized savings.
            </p>
            {claimCards[0] ? (
              <button
                type="button"
                className="sw-v2-primary"
                onClick={() =>
                  onOpenContract(claimCards[0].contract_id, "Optimize")
                }
              >
                Open top candidate
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

      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead
          eyebrow="Vendor concentration"
          title="Largest relationships by recorded annual value"
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

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Evidence posture" title="Loaded rows only" />
        <div className="sw-v2-fact-stack">
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
    </div>
  );
}

function VendorsPage({
  portfolio,
  selectedVendor,
  totalAnnualValue,
  onOpenVendor,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  selectedVendor: SourceVendorContractPortfolioRow | null;
  totalAnnualValue: number | null;
  onOpenVendor: (vendorRef: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const vendors = topVendors(portfolio);
  const selectedContracts = selectedVendor
    ? portfolio.contracts.filter(
        (contract) => contract.vendor_ref === selectedVendor.vendor_ref,
      )
    : [];
  const selectedVendorPosition = selectedVendor
    ? portfolio.impact.vendorPositions.find(
        (vendor) => vendor.vendor_ref === selectedVendor.vendor_ref,
      )
    : null;

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead
          eyebrow="Vendor 360"
          title="One row per supplier relationship"
        />
        <div className="sw-v2-table">
          <div className="sw-v2-table-head sw-v2-vendor-row">
            <span>Vendor</span>
            <span>Contracts</span>
            <span>Annual value</span>
            <span>Share</span>
          </div>
          {vendors.slice(0, 12).map((vendor) => (
            <button
              key={vendor.vendor_ref}
              type="button"
              className={`sw-v2-table-row sw-v2-vendor-row ${selectedVendor?.vendor_ref === vendor.vendor_ref ? "is-selected" : ""}`}
              onClick={() => onOpenVendor(vendor.vendor_ref)}
            >
              <span>
                <b>{vendor.vendor_name}</b>
                <small>
                  {vendor.vendor_category ?? "Category not established"}
                </small>
              </span>
              <span>{vendor.contract_count}</span>
              <span>{money(numberFromDb(vendor.annual_value))}</span>
              <span>{formatShare(vendor, totalAnnualValue)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Selected vendor"
          title={selectedVendor?.vendor_name ?? "Select a vendor"}
        />
        {selectedVendor ? (
          <>
            <div className="sw-v2-fact-stack">
              <Fact
                label="Contracts"
                value={String(selectedVendor.contract_count)}
              />
              <Fact
                label="Annual value"
                value={money(numberFromDb(selectedVendor.annual_value))}
              />
              <Fact
                label="Share"
                value={formatShare(selectedVendor, totalAnnualValue)}
              />
              <Fact
                label="Auto-renewing"
                value={String(selectedVendor.auto_renew_contracts)}
              />
              <Fact
                label="Action candidates"
                value={String(
                  selectedVendorPosition?.action_candidate_count ?? 0,
                )}
              />
              <Fact
                label="Candidate exposure"
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
            </div>
            <div className="sw-v2-mini-list">
              {selectedContracts.slice(0, 6).map((contract) => (
                <button
                  key={contract.contract_id}
                  type="button"
                  onClick={() => onOpenContract(contract.contract_id)}
                >
                  <b>{contract.contract_id}</b>
                  <span>{money(numberFromDb(contract.annual_value))}</span>
                </button>
              ))}
              {selectedContracts.length === 0 ? (
                <p className="sw-v2-muted">
                  Contract-level rows are not materialized for this vendor
                  selection.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="sw-v2-muted">
            Choose a row to see grouped contract headers.
          </p>
        )}
      </section>
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
  const contractClaimCards = portfolio.impact.claimCards.filter(
    (row) => row.contract_id === contract.contract_id,
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
          {contractStory(tab, vm, contract, coverage, contractClaimCards[0])}
        </p>
        {tab === "Performance" &&
        detailReady &&
        vm.detail?.performancePeriods?.length ? (
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
              value={contract.benchmarking_clause ?? "Not established"}
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
          eyebrow="Evidence state"
          title={detailStateLabel(vm.detailState)}
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
  onOpenContract,
}: {
  vm: SourceWorkspaceVM;
  contract: SourceContract360Row;
  creditFinding: number;
  findingContract: { contractId: string; counterparty: string } | null;
  performanceRows: number;
  spendRows: number;
  portfolio: SourceWorkspacePortfolioData;
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

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead eyebrow="Optimize" title="Evidence-backed action only" />
        <div className="sw-v2-lanes">
          <ValueLane
            title="Recover money"
            value={creditFinding > 0 ? money(creditFinding) : "Not established"}
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
              candidateAmount > 0 ? money(candidateAmount) : "Not established"
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
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Proof layers" title="What is loaded" />
        <div className="sw-v2-fact-stack">
          <Fact label="Selected contract" value={contract.contract_id} />
          <Fact label="Spend rows" value={String(spendRows)} />
          <Fact label="Performance rows" value={String(performanceRows)} />
          <Fact
            label="Action candidates"
            value={String(contractCandidates.length)}
          />
          <Fact
            label="Candidate amount"
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

function PanelHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="sw-v2-panel-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
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

function activePage(
  logic: WorkspaceViewModel,
  vm: SourceWorkspaceVM,
): PageLabel {
  if (logic.state.sel.kind === "vendor" || vm.isVendorList) return "Vendors";
  if (vm.isContract && logic.state.tabs.contract === "Optimize")
    return "Optimize";
  if (vm.isContract) return "Contract 360";
  return "Portfolio";
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

function topVendors(portfolio: SourceWorkspacePortfolioData) {
  return portfolio.vendors
    .slice()
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    );
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

function headlineFor(
  page: PageLabel,
  tenantName: string,
  vendor: SourceVendorContractPortfolioRow | null,
  contract: SourceContract360Row | null,
) {
  if (page === "Vendors") return vendor?.vendor_name ?? "Vendor portfolio";
  if (page === "Contract 360") return contract?.vendor_name ?? "Contract 360";
  if (page === "Optimize") return "Optimize evidenced opportunities";
  return tenantName;
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
  if (page === "Contract 360" && contract) {
    return `${contract.contract_id} / ${money(numberFromDb(contract.annual_value))} annual value / expiry ${fmtDate(contract.end_date)}.`;
  }
  if (page === "Optimize") {
    return "Only quantified findings with loaded evidence are shown. Finance confirmation remains separate.";
  }
  return `${portfolio.contracts.length} contracts / ${portfolio.vendors.length} vendors. Unsupported dashboard claims are hidden.`;
}

function contractStory(
  tab: string,
  vm: SourceWorkspaceVM,
  contract: SourceContract360Row,
  coverage: ReturnType<typeof coverageForContract>,
  claimCard:
    | SourceWorkspacePortfolioData["impact"]["claimCards"][number]
    | undefined,
) {
  if (tab === "Performance") {
    if (vm.detailState === "ready" && vm.detail?.performancePeriods?.length) {
      return "Monthly performance rows are loaded for this contract. Misses and service-credit amounts stay visible as evidence, not finance-confirmed value.";
    }
    if ((coverage?.performance_rows ?? 0) > 0) {
      return `${coverage?.performance_rows} governed performance rows are in the Source impact layer for this contract. Open detail proof before using row-level claims.`;
    }
    return "No contract-specific performance periods are loaded for this selection.";
  }
  if (tab === "Relationship") {
    return "Relationship facts are limited to the vendor rollup and contract headers unless dependency rows are loaded.";
  }
  if (tab === "Evidence") {
    return vm.detailState === "error"
      ? "Per-contract detail could not load. The workspace is withholding evidence claims for this contract."
      : "Evidence rows, source documents, and missing inputs are separated from the contract header.";
  }
  if (tab === "Optimize") {
    if (claimCard) {
      return claimCard.allowed_executive_statement;
    }
    return vm.opportunityView
      ? vm.opportunityView.recommendationDetail
      : "No contract-specific opportunity set is loaded for this selection.";
  }
  if (tab === "Economics") {
    if ((coverage?.spend_rows ?? 0) > 0) {
      return `${coverage?.spend_rows} monthly spend rows support actual spend. Missing finance confirmation still blocks realized-value language.`;
    }
    return "Economics shows recorded annual value and actual spend only. Missing spend is not converted to zero.";
  }
  return `${contract.vendor_name} has a governed contract header. Source sizes action only where supporting rows are loaded.`;
}

function detailStateLabel(state: SourceWorkspaceVM["detailState"]) {
  if (state === "ready") return "Detail loaded";
  if (state === "loading") return "Loading detail";
  if (state === "error") return "Detail unavailable";
  return "Header only";
}

export function performanceActual(
  actualValue: unknown,
  valueNum: unknown,
) {
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
