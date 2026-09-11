"use client";

import type {
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractEvidenceCoverageRow,
  SourceContractTabIntelligenceRow,
} from "@/lib/source/data-model/types";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import { money, fmtDate } from "./viewModel";
import type { SourceWorkspaceVM } from "./buildViewModel";
import { countOrDash } from "./contractPopulations";

/**
 * Contract 360 — the per-tab briefing surfaces.
 *
 * Transcribed from the Claude Design contract "Source Contract 360.dc.html".
 * Every figure resolves to a governed row; where the design carried an
 * illustrative number the model does not hold, these render the refusal rather
 * than the design's placeholder. The design wins on form, the canonical model
 * wins on fact.
 */

/* -------------------------------------------------------------------------- */
/* shared                                                                     */
/* -------------------------------------------------------------------------- */

type Coverage = SourceContractEvidenceCoverageRow | null | undefined;

/** A count that was never loaded is a dash, not a zero. */
function laneCount(coverage: Coverage, field: keyof SourceContractEvidenceCoverageRow) {
  if (!coverage) return null;
  return numberFromDb(coverage[field] as never);
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function tabIntelligence(
  vm: SourceWorkspaceVM,
  tabKey: string,
): SourceContractTabIntelligenceRow | null {
  const rows = vm.detail?.contractTabIntelligence ?? [];
  return (
    rows.find(
      (row) => row.tab_key.toLowerCase() === tabKey.toLowerCase(),
    ) ?? null
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The contract headline.
 *
 * The design opens every contract with a sentence rather than a label: the
 * subject in full weight, the commercial question after it in grey. The notice
 * window is the only chip, because it is the only fact on the header that
 * expires.
 */
export function ContractBriefingHeader({
  contract,
  vm,
  noticeDays,
  onBack,
}: {
  contract: SourceContract360Row;
  vm: SourceWorkspaceVM;
  noticeDays: number | null;
  onBack: () => void;
}) {
  const story = tabIntelligence(vm, "Story");
  const archetype = vm.contractEducation?.archetypeLabel ?? null;
  const committed = numberFromDb(
    (contract as unknown as { committed_value?: unknown }).committed_value,
  );

  const subline = [
    archetype,
    vm.optWorkflow ? `step ${vm.optWorkflow.currentIndex} of 7` : null,
    committed ? `${money(committed)} committed` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sw-c3-head">
      <div className="sw-c3-crumb">
        <button className="sw-c3-crumb-back" onClick={onBack} type="button">
          ← All contracts
        </button>
        <span className="sw-c3-eyebrow">
          {contract.vendor_name} · {contract.contract_id}
        </span>
      </div>
      <div className="sw-c3-head-row">
        <div className="sw-c3-head-main">
          <h1 className="sw-c3-title">
            {contract.contract_name}
            {story?.headline ? (
              <span className="sw-c3-title-dim"> {story.headline}</span>
            ) : null}
          </h1>
          {subline ? <p className="sw-c3-note">{sentenceCase(subline)}</p> : null}
        </div>
        {noticeDays != null ? (
          <span className="sw-c3-pill-alert">
            <span className="sw-c3-dot" />
            Notice window — {noticeDays} days
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Register-only tier                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A contract in the book with no evidence package behind it.
 *
 * The design withholds the tabs rather than rendering seven empty ones, and
 * says what loading would unlock. An empty tab reads as a product that does not
 * work; a withheld tab reads as a product that knows what it does not have.
 */
export function ContractRegisterOnly({
  contract,
  onBack,
}: {
  contract: SourceContract360Row;
  onBack: () => void;
}) {
  const depthPath = [
    {
      what: "Load contract facts",
      who: "Contract manager · clause and pricing extraction",
      unlocks: "Story · Scope",
    },
    {
      what: "Reconcile spend and usage",
      who: "Accounts payable · platform admin",
      unlocks: "Economics",
    },
    {
      what: "Load service performance rows",
      who: "Service delivery",
      unlocks: "Performance",
    },
    {
      what: "Raise the optimization case",
      who: "Category manager",
      unlocks: "Optimize",
    },
  ];

  return (
    <div className="sw-c3-split">
      <section className="sw-c3-card sw-c3-card-lead sw-c3-card-rule">
        <div className="sw-c3-eyebrow">Register only · no evidence package</div>
        <p className="sw-c3-sparse-lede">
          This contract is in the book. It has not been reconciled to evidence.
        </p>
        <p className="sw-c3-prose">
          Header facts are governed and shown below. Story, Scope, Economics,
          Performance, Relationship and Optimize each need loaded rows that do
          not exist for this contract yet, so those tabs are withheld rather
          than rendered empty.
        </p>
        <div className="sw-c3-tiles" style={{ ["--sw-c3-tile-count" as string]: 3 }}>
          <div className="sw-c3-tile">
            <div className="sw-c3-tile-label">Annual value</div>
            <div className="sw-c3-tile-value">
              {money(numberFromDb(contract.annual_value))}
            </div>
          </div>
          <div className="sw-c3-tile">
            <div className="sw-c3-tile-label">Evidence</div>
            <div className="sw-c3-tile-state">
              <span className="sw-c3-dot sw-c3-dot-hollow" />
              Not loaded
            </div>
          </div>
          <div className="sw-c3-tile">
            <div className="sw-c3-tile-label">Contract type</div>
            <div className="sw-c3-tile-state">Not declared</div>
          </div>
        </div>
        <p className="sw-c3-note">
          <button className="sw-c3-crumb-back" onClick={onBack} type="button">
            ← Back to all contracts
          </button>
        </p>
      </section>
      <section className="sw-c3-card">
        <div className="sw-c3-eyebrow">What evidence would unlock</div>
        <div className="sw-c3-rows sw-c3-depth-path">
          {depthPath.map((step) => (
            <div className="sw-c3-row" key={step.what}>
              <span className="sw-c3-row-main">
                <span className="sw-c3-row-title">{step.what}</span>
                <span className="sw-c3-row-note">{step.who}</span>
              </span>
              <span className="sw-c3-row-aside sw-c3-mono">{step.unlocks}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Story                                                                      */
/* -------------------------------------------------------------------------- */

export function ContractStoryBriefing({
  contract,
  coverage,
  vm,
}: {
  contract: SourceContract360Row;
  coverage: Coverage;
  vm: SourceWorkspaceVM;
}) {
  const story = tabIntelligence(vm, "Story");
  const committed = laneCount(coverage, "committed_spend_usd");
  const actual = laneCount(coverage, "actual_spend_usd");
  const workflow = vm.optWorkflow;

  const evidenceState: {
    name: string;
    state: string;
    tone: string;
    required: boolean;
  }[] = [
    {
      name: "Scope rows",
      value: laneCount(coverage, "scope_rows"),
      required: true,
    },
    {
      name: "Spend months",
      value: laneCount(coverage, "spend_rows"),
      required: true,
    },
    {
      name: "Service performance",
      value: laneCount(coverage, "performance_rows"),
      required: contractFacetRequired(vm, "Performance"),
    },
    {
      name: "Document page text",
      value: laneCount(coverage, "document_page_text_rows"),
      required: true,
    },
    {
      name: "Opportunities",
      value: laneCount(coverage, "opportunity_rows"),
      required: true,
    },
  ].map((lane) => ({
    name: lane.value == null ? lane.name : `${lane.name} · ${lane.value}`,
    state: !lane.required
      ? "Not required"
      : lane.value == null
        ? "Not loaded"
        : lane.value > 0
          ? "Loaded"
          : "None found",
    tone: !lane.required
      ? "transparent"
      : lane.value != null && lane.value > 0
        ? "var(--sw-c3-green)"
        : "var(--sw-c3-stone)",
    required: lane.required,
  }));

  return (
    <div className="sw-c3-split">
      <div className="sw-c3-stack">
        <section className="sw-c3-card sw-c3-card-lead sw-c3-story-purpose">
          <div className="sw-c3-eyebrow sw-c3-eyebrow-accent">
            What this contract is
          </div>
          <p className="sw-c3-display">
            {story?.headline ?? "Purpose has not been reviewed for this contract."}
          </p>
          <p className="sw-c3-prose">
            {story?.allowed_executive_statement ??
              "No reviewed commercial purpose is loaded, so Source will not characterise this agreement."}
          </p>
          {story ? (
            <p className="sw-c3-note">
              {`Reviewed contract intelligence · confidence ${story.confidence_level} · ${story.review_status}`}
            </p>
          ) : null}
        </section>

        <section className="sw-c3-card sw-c3-story-thesis">
          <div className="sw-c3-eyebrow">Commercial position</div>
          <p className="sw-c3-prose" style={{ marginTop: 10 }}>
            {story?.supporting_evidence_summary
              ? `Evidence basis: ${story.supporting_evidence_summary}.`
              : "No supporting evidence summary is recorded for this contract."}
          </p>
          <div className="sw-c3-tiles">
            <div className="sw-c3-tile">
              <div className="sw-c3-tile-label">Annual value</div>
              <div className="sw-c3-tile-value">
                {money(numberFromDb(contract.annual_value))}
              </div>
            </div>
            <div className="sw-c3-tile">
              <div className="sw-c3-tile-label">Actual annual spend</div>
              <div className="sw-c3-tile-value sw-c3-tile-value-alert">
                {actual == null ? "Not loaded" : money(actual)}
              </div>
            </div>
            <div className="sw-c3-tile">
              <div className="sw-c3-tile-label">Committed</div>
              <div className="sw-c3-tile-value">
                {committed == null ? "Not recorded" : money(committed)}
              </div>
            </div>
            <div className="sw-c3-tile">
              <div className="sw-c3-tile-label">Renewal</div>
              <div className="sw-c3-tile-state">{fmtDate(contract.end_date)}</div>
            </div>
          </div>
        </section>
      </div>

      <div className="sw-c3-stack">
        {workflow ? (
          <section className="sw-c3-card-dark">
            <div className="sw-c3-eyebrow">Action posture</div>
            <p className="sw-c3-display sw-c3-display-sm">
              {workflow.primaryAction}
            </p>
            <p className="sw-c3-prose">{workflow.primaryActionDetail}</p>
          </section>
        ) : null}

        <section className="sw-c3-card">
          <div className="sw-c3-eyebrow">Evidence state</div>
          <div className="sw-c3-evidence-state">
            {evidenceState.map((lane) => (
              <div className="sw-c3-evidence-state-row" key={lane.name}>
                <span
                  className={
                    lane.required
                      ? "sw-c3-dot"
                      : "sw-c3-dot sw-c3-dot-hollow"
                  }
                  style={{ ["--sw-c3-tone" as string]: lane.tone }}
                />
                <span className="sw-c3-evidence-state-name">{lane.name}</span>
                <span className="sw-c3-mono sw-c3-evidence-state-value">
                  {lane.state}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function contractFacetRequired(vm: SourceWorkspaceVM, facet: "Performance") {
  return vm.contractEducation?.facetRequirements[facet]?.state !== "not_required";
}

/* -------------------------------------------------------------------------- */
/* Scope                                                                      */
/* -------------------------------------------------------------------------- */

const CRITICALITY_TONE: Record<string, string> = {
  "business critical": "var(--sw-c3-red)",
  critical: "var(--sw-c3-red)",
  "tier 1": "var(--sw-c3-red)",
  important: "var(--sw-c3-amber)",
  "tier 2": "var(--sw-c3-amber)",
};

export function ContractScopeBriefing({
  scopeRows,
  vm,
}: {
  scopeRows: readonly SourceContractApplicationScopeRow[];
  vm: SourceWorkspaceVM;
}) {
  const scope = tabIntelligence(vm, "Scope");
  const functions = [
    ...new Set(scopeRows.map((row) => row.business_function).filter(Boolean)),
  ];

  return (
    <div className="sw-c3-split">
      <section className="sw-c3-card sw-c3-card-lead">
        <div className="sw-c3-eyebrow sw-c3-eyebrow-accent">
          What is actually in scope
        </div>
        <p className="sw-c3-display">
          {scope?.headline ??
            `${scopeRows.length} declared workload scope${scopeRows.length === 1 ? "" : "s"}.`}
        </p>
        <p className="sw-c3-note">
          {`${scopeRows.length} scope row${scopeRows.length === 1 ? "" : "s"}`}
          {functions.length ? ` · ${functions.join(", ")}` : ""}
        </p>
        <div className="sw-c3-rows sw-c3-scope-group">
          {scopeRows.map((row) => {
            const criticality = row.criticality?.trim() ?? "";
            return (
              <div className="sw-c3-row" key={row.application_ref}>
                <span className="sw-c3-row-main">
                  <span className="sw-c3-row-title sw-c3-row-title-serif">
                    {row.application_name}
                  </span>
                  <span className="sw-c3-row-note">
                    {row.business_function ?? "Business function not recorded"}
                    {row.annual_run_cost != null
                      ? ` · ${money(numberFromDb(row.annual_run_cost))} annual run cost`
                      : " · annual run cost not loaded"}
                  </span>
                </span>
                <span className="sw-c3-row-aside">
                  <span className="sw-c3-scope-hosting">
                    {row.hosting_model ?? "Hosting not recorded"}
                  </span>
                  {criticality ? (
                    <span className="sw-c3-scope-crit">
                      <span
                        className="sw-c3-dot"
                        style={{
                          ["--sw-c3-tone" as string]:
                            CRITICALITY_TONE[criticality.toLowerCase()] ??
                            "var(--sw-c3-stone)",
                        }}
                      />
                      {criticality}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sw-c3-card sw-c3-card-rule sw-c3-scope-boundary">
        <div className="sw-c3-eyebrow">The boundary</div>
        <p className="sw-c3-display sw-c3-display-sm">
          Declared scope, not enterprise-wide dependency coverage.
        </p>
        <p className="sw-c3-prose">
          {scope?.allowed_executive_statement ??
            "These are the rows the contract record declares. Source does not infer a wider dependency footprint from them."}
        </p>
        {scope?.missing_evidence_summary ? (
          <p className="sw-c3-note">{sentenceCase(scope.missing_evidence_summary)}.</p>
        ) : null}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Relationship                                                               */
/* -------------------------------------------------------------------------- */

export function ContractRelationshipBriefing({
  contract,
  scopeRows,
  vm,
}: {
  contract: SourceContract360Row;
  scopeRows: readonly SourceContractApplicationScopeRow[];
  vm: SourceWorkspaceVM;
}) {
  const relationship = tabIntelligence(vm, "Relationship");
  const functions = [
    ...new Set(scopeRows.map((row) => row.business_function).filter(Boolean)),
  ];
  const hosting = [
    ...new Set(scopeRows.map((row) => row.hosting_model).filter(Boolean)),
  ];
  const opportunities = vm.opportunityView?.opportunities?.length ?? null;

  const rows = [
    {
      kind: "Vendor",
      name: contract.vendor_name,
      note: "Commercial counterparty on the executed agreement",
    },
    {
      kind: "Contract",
      name: contract.contract_id,
      note: contract.contract_name,
    },
    {
      kind: "Covered work",
      name:
        scopeRows.length > 0
          ? scopeRows.map((row) => row.application_name).join(" · ")
          : "No scope rows loaded",
      note: `${scopeRows.length} declared scope row${scopeRows.length === 1 ? "" : "s"}`,
    },
    {
      kind: "Business functions",
      name: functions.length ? functions.join(" · ") : "Not recorded",
      note: "Read from the loaded scope rows",
    },
    {
      kind: "Hosting",
      name: hosting.length ? hosting.join(" · ") : "Not recorded",
      note: "Declared on the scope rows, not inferred from a CMDB",
    },
    ...(opportunities != null
      ? [
          {
            kind: "Optimization case",
            name: `${opportunities} opportunit${opportunities === 1 ? "y" : "ies"}`,
            note: vm.optWorkflow
              ? `Currently at step ${vm.optWorkflow.currentIndex} of 7 · ${vm.optWorkflow.currentLabel}`
              : "No workflow position derived",
          },
        ]
      : []),
  ];

  return (
    <div className="sw-c3-split">
      <section className="sw-c3-card sw-c3-card-lead">
        <div className="sw-c3-eyebrow sw-c3-eyebrow-accent">
          Declared relationships
        </div>
        <p className="sw-c3-display">
          {relationship?.headline ??
            "One vendor, one agreement, and the work it covers."}
        </p>
        <p className="sw-c3-note">
          Everything below is declared on the contract record or its scope rows.
          Nothing is inferred.
        </p>
        <div className="sw-c3-rows">
          {rows.map((row) => (
            <div className="sw-c3-row" key={row.kind}>
              <span className="sw-c3-row-kind">{row.kind}</span>
              <span className="sw-c3-row-main">
                <span className="sw-c3-row-title">{row.name}</span>
                <span className="sw-c3-row-note">{row.note}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-c3-card sw-c3-card-rule sw-c3-rel-boundary">
        <div className="sw-c3-eyebrow">Not shown</div>
        <p className="sw-c3-prose" style={{ marginTop: 10 }}>
          No dependency graph and no initiative links appear here. Those
          relationships would be inferred, and an inferred dependency in front of
          an executive reads as a fact.
        </p>
        <p className="sw-c3-prose">
          When application inventory is loaded with a declared relationship
          method and a confidence, this tab gains a scope map — and says which
          method produced each edge.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Evidence families.
 *
 * A family the archetype does not require renders `n/a` and says so, rather
 * than a zero sitting in the same column as a real count. The two states mean
 * opposite things and the design refuses to spell them the same way.
 */
export function ContractEvidenceFamilies({
  coverage,
  vm,
}: {
  coverage: Coverage;
  vm: SourceWorkspaceVM;
}) {
  const evidence = tabIntelligence(vm, "Evidence");
  const performanceRequired = contractFacetRequired(vm, "Performance");

  const families = [
    {
      name: "Spend, monthly",
      note: "Committed, invoiced, paid and actual amounts by month.",
      count: laneCount(coverage, "spend_rows"),
      system: "finance ledger",
      required: true,
    },
    {
      name: "Application scope",
      note: "The declared workloads and business functions this contract covers.",
      count: laneCount(coverage, "scope_rows"),
      system: "contract record",
      required: true,
    },
    {
      name: "Opportunities",
      note: "Governed optimization candidates raised against this contract.",
      count: laneCount(coverage, "opportunity_rows"),
      system: "source",
      required: true,
    },
    {
      name: "Document page text",
      note: "Page spans and proof text behind a clause-level claim.",
      count: laneCount(coverage, "document_page_text_rows"),
      system: "contract_pdf · restricted",
      required: true,
    },
    {
      name: "Change orders",
      note: "Scope and commercial drift against the original agreement.",
      count: laneCount(coverage, "change_order_rows"),
      system: "contract record",
      required: true,
    },
    {
      name: "Service performance and credits",
      note: performanceRequired
        ? "Service levels achieved, breaches, and credits calculated against them."
        : "Not required by this contract type. Its absence blocks no claim here.",
      count: laneCount(coverage, "performance_rows"),
      system: performanceRequired ? "service management" : "—",
      required: performanceRequired,
    },
  ];

  return (
    <div className="sw-c3-stack">
      <section className="sw-c3-card sw-c3-card-lead">
        <p className="sw-c3-display">
          {evidence?.headline ??
            "Every figure on this contract resolves to a loaded row."}
        </p>
        {evidence?.supporting_evidence_summary ? (
          <p className="sw-c3-note">
            {sentenceCase(evidence.supporting_evidence_summary)}.
          </p>
        ) : null}

        <div className="sw-c3-rows sw-c3-evidence-family">
          {families.map((family) => (
            <div className="sw-c3-row" key={family.name}>
              <span className="sw-c3-row-main">
                <span className="sw-c3-row-title sw-c3-row-title-serif">
                  {family.name}
                </span>
                <span className="sw-c3-row-note">{family.note}</span>
              </span>
              <span className="sw-c3-row-aside">
                {family.required ? (
                  <>
                    <span className="sw-c3-family-count">
                      {countOrDash(family.count)}
                    </span>
                    <span className="sw-c3-family-system">{family.system}</span>
                  </>
                ) : (
                  <span className="sw-c3-na">Not required</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <p className="sw-c3-note sw-c3-evidence-footer">
          A dash means the lane was never loaded; a zero means it was loaded and
          holds nothing. Raw source documents stay in the system of record —
          Source renders the assertions drawn from them, each with its load run.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lever table                                                                */
/* -------------------------------------------------------------------------- */

const LEVER_COLUMNS = [
  "Lever",
  "Buyer ask",
  "Why the vendor can agree",
  "Evidence basis",
  "Value state",
  "Amount",
  "Owner",
  "Next step",
] as const;

/**
 * The lever table, exported unchanged into the client memo.
 *
 * Every column reads a governed field. A lever with no amount says which state
 * it is in rather than showing a blank, and the footer states the two things a
 * reader would otherwise assume wrongly: that the amounts add up, and that any
 * of it is realised.
 */
export function ContractLeverTable({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  const opportunities = view?.opportunities ?? [];
  if (opportunities.length === 0) return null;

  const sized = opportunities.filter((row) => row.amountUsd != null).length;

  return (
    <section className="sw-c3-card sw-c3-card-flush">
      <div className="sw-c3-lever-head">
        <span className="sw-c3-display sw-c3-display-sm">Lever table</span>
        <span className="sw-c3-note">
          {opportunities.length} governed lever
          {opportunities.length === 1 ? "" : "s"} · {sized} sized ·{" "}
          {opportunities.length - sized} signal-stage
        </span>
      </div>
      <div className="sw-c3-table-wrap">
        <table className="sw-c3-lever-table">
          <thead>
            <tr>
              {LEVER_COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opportunities.map((row) => (
              <tr key={row.id}>
                <td
                  className="sw-c3-lever-name"
                  style={{ ["--sw-c3-tone" as string]: row.tone }}
                >
                  <b>{row.label}</b>
                  <span>
                    {row.valueType}
                    {row.timingDependency ? ` · ${row.timingDependency}` : ""}
                  </span>
                </td>
                <td>{row.buyerAsk ?? "Buyer ask not recorded"}</td>
                <td>
                  {row.vendorConcession ??
                    "No vendor-side rationale recorded for this lever."}
                </td>
                <td className="sw-c3-lever-basis">
                  {row.sourceRefs.length > 0
                    ? row.sourceRefs.join(" · ")
                    : `Evidence grade ${row.grade}`}
                </td>
                <td>
                  <span className="sw-c3-badge">{row.stage}</span>
                </td>
                <td className="sw-c3-lever-amount">{row.amount}</td>
                <td>
                  <span>{row.owner}</span>
                  {row.ownerRole ? (
                    <span className="sw-c3-lever-ownerrole">{row.ownerRole}</span>
                  ) : null}
                </td>
                <td>
                  <span>{row.nextAction ?? "No next step recorded"}</span>
                  {row.blockingGap ? (
                    <span className="sw-c3-lever-blocker">{row.blockingGap}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sw-c3-table-foot">
        <span>
          Amounts are per lever and are not additive — two levers may address the
          same money.
        </span>
        <span>
          {opportunities.length - sized > 0
            ? `${opportunities.length - sized} lever${opportunities.length - sized === 1 ? " carries" : "s carry"} no amount and ${opportunities.length - sized === 1 ? "is" : "are"} not counted.`
            : "Every lever carries a traced amount."}
        </span>
        <span>
          Realized value is{" "}
          <b style={{ color: "var(--sw-c3-ink)" }}>
            {view?.financeConfirmed ?? "Not established"}
          </b>{" "}
          until Finance confirms.
        </span>
      </div>
    </section>
  );
}
