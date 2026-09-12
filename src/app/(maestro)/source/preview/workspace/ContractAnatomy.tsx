"use client";

import type {
  ContractEducationView,
  ContractFacetKey,
} from "@/lib/source/contract-intelligence/education";
import type { SourceContractEvidenceCoverageRow } from "@/lib/source/data-model/types";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type { SourceWorkspaceVM } from "./buildViewModel";

/**
 * The anatomy of a contract: what feeds it, what it is, and which of its seven
 * questions the evidence can answer.
 *
 * The deck draws this as seven named source systems on the left — a CLM, an
 * ERP, a service-management tool, a CMDB, an HRIS — flowing into one canonical
 * record and out to seven facets.
 *
 * The left column is not built that way here, deliberately. Every loaded row on
 * this contract records its `source_system` as the package loader's own name,
 * so no integration with a named upstream system exists in the data. Drawing
 * Icertis or ServiceNow as an integrated feed would assert a connection the
 * product does not have — the one claim on this surface a buyer would check
 * first. What renders instead is what genuinely feeds the contract: the
 * document types loaded, the adapter that carried them, and the row counts.
 *
 * The centre column is the canonical model's real table and column names, which
 * is schema documentation rather than a claim about this contract.
 *
 * The right column is fully live. The seven facets and their required or
 * not-required state come from the archetype model; whether each is answered
 * comes from the contract's own lanes.
 */

type Coverage = SourceContractEvidenceCoverageRow | null | undefined;

type FacetState = "answered" | "open" | "not_required";

const FACET_ORDER: readonly ContractFacetKey[] = [
  "Story",
  "Scope",
  "Economics",
  "Performance",
  "Relationship",
  "Evidence",
  "Optimize",
];

const FACET_QUESTION: Record<ContractFacetKey, string> = {
  Story: "The plain-English summary, in ten seconds",
  Scope: "What this pays for — and what it excludes",
  Economics: "Value, term, pricing, auto-renew, notice",
  Performance: "Service levels attained; credits against claims",
  Relationship: "Business and contract owners, named",
  Evidence: "Source documents and exports, always cited",
  Optimize: "Recoverable, avoidable, or negotiable",
};

/** The canonical objects a contract resolves to. Schema, not a claim. */
const CANONICAL_FIELDS: readonly { readonly name: string; readonly note: string }[] =
  [
    { name: "contract_term", note: "term, notice, renewal" },
    { name: "contract_scope", note: "what is in and out" },
    { name: "contract_consumption_observation", note: "metered usage" },
    { name: "contract_performance_observation", note: "service levels attained" },
    { name: "vendor", note: "the counterparty" },
  ];

function lane(coverage: Coverage, field: keyof SourceContractEvidenceCoverageRow) {
  if (!coverage) return null;
  return numberFromDb(coverage[field] as never);
}

function facetStates(
  coverage: Coverage,
  education: ContractEducationView | null,
  scopeRowCount: number,
  opportunityCount: number,
): Record<ContractFacetKey, FacetState> {
  const required = (facet: ContractFacetKey) =>
    education?.facetRequirements?.[facet]?.state !== "not_required";

  const answered: Record<ContractFacetKey, boolean> = {
    Story: Boolean(education?.archetypeKey && education.archetypeKey !== "unmapped"),
    Scope: scopeRowCount > 0,
    Economics: (lane(coverage, "spend_rows") ?? 0) > 0,
    Performance: (lane(coverage, "performance_rows") ?? 0) > 0,
    Relationship: scopeRowCount > 0,
    Evidence: (lane(coverage, "document_page_text_rows") ?? 0) > 0,
    Optimize: opportunityCount > 0,
  };

  const out = {} as Record<ContractFacetKey, FacetState>;
  for (const facet of FACET_ORDER) {
    out[facet] = !required(facet)
      ? "not_required"
      : answered[facet]
        ? "answered"
        : "open";
  }
  return out;
}

export function ContractAnatomy({
  coverage,
  scopeRowCount,
  vm,
}: {
  coverage: Coverage;
  scopeRowCount: number;
  vm: SourceWorkspaceVM;
}) {
  const education = vm.contractEducation ?? null;
  const opportunityCount = vm.opportunityView?.opportunities?.length ?? 0;
  const states = facetStates(coverage, education, scopeRowCount, opportunityCount);

  const answered = FACET_ORDER.filter((f) => states[f] === "answered").length;
  const open = FACET_ORDER.filter((f) => states[f] === "open").length;
  const notRequired = FACET_ORDER.filter(
    (f) => states[f] === "not_required",
  ).length;

  /* What actually feeds this contract, counted from its own rows. */
  const feeds: readonly { readonly label: string; readonly detail: string }[] = [
    {
      label: "Contract register",
      detail: `header, archetype and terms · ${lane(coverage, "spend_rows") != null ? "loaded" : "not loaded"}`,
    },
    {
      label: "Monthly spend and invoices",
      detail: `${lane(coverage, "spend_rows") ?? 0} rows`,
    },
    {
      label: "Application scope",
      detail: `${scopeRowCount} declared ${scopeRowCount === 1 ? "workload" : "workloads"}`,
    },
    {
      label: "Service performance",
      detail:
        states.Performance === "not_required"
          ? "not required by this contract type"
          : `${lane(coverage, "performance_rows") ?? 0} rows`,
    },
    {
      label: "Source documents",
      detail: `${lane(coverage, "document_page_text_rows") ?? 0} page-text rows`,
    },
    {
      label: "Optimization opportunities",
      detail: `${opportunityCount} governed ${opportunityCount === 1 ? "lever" : "levers"}`,
    },
  ];

  return (
    <section className="sw-c3-card">
      <div className="sw-c3-eyebrow">What a contract actually is</div>
      <p className="sw-c3-display sw-c3-display-sm sw-c3-edu-question">
        A contract is seven questions. This one answers {answered}.
      </p>
      <p className="sw-c3-note">
        {open === 0
          ? "Every question this contract type requires has evidence behind it."
          : `${open} ${open === 1 ? "question is" : "questions are"} open.`}
        {notRequired > 0
          ? ` ${notRequired} ${notRequired === 1 ? "does" : "do"} not apply to this contract type — not a gap, a state.`
          : ""}
      </p>

      <div className="sw-c3-anatomy">
        <div className="sw-c3-anatomy-col">
          <div className="sw-c3-eyebrow">What feeds it</div>
          <div className="sw-c3-rows">
            {feeds.map((feed) => (
              <div className="sw-c3-row" key={feed.label}>
                <span className="sw-c3-row-main">
                  <span className="sw-c3-row-title">{feed.label}</span>
                  <span className="sw-c3-row-note">{feed.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="sw-c3-note">
            Named upstream systems are not shown. Every loaded row records the
            package loader as its source system, so no integration with a named
            system exists to display.
          </p>
        </div>

        <div className="sw-c3-anatomy-col sw-c3-anatomy-canonical">
          <div className="sw-c3-eyebrow">One governed record</div>
          <p className="sw-c3-anatomy-model">source.contract</p>
          <div className="sw-c3-anatomy-fields">
            {CANONICAL_FIELDS.map((field) => (
              <div key={field.name}>
                <code>{field.name}</code>
                <span>{field.note}</span>
              </div>
            ))}
          </div>
          <p className="sw-c3-note">
            The canonical objects every tab is a projection of. No product owns
            this data.
          </p>
        </div>

        <div className="sw-c3-anatomy-col">
          <div className="sw-c3-eyebrow">Seven facets, live state</div>
          <div className="sw-c3-facets">
            {FACET_ORDER.map((facet, index) => {
              const state = states[facet];
              return (
                <div
                  className={`sw-c3-facet sw-c3-facet-${state}`}
                  key={facet}
                >
                  <span className="sw-c3-facet-index">{index + 1}</span>
                  <span className="sw-c3-facet-main">
                    <span className="sw-c3-facet-name">{facet}</span>
                    <span className="sw-c3-facet-question">
                      {FACET_QUESTION[facet]}
                    </span>
                  </span>
                  <span className="sw-c3-facet-mark">
                    {state === "answered"
                      ? "✓"
                      : state === "not_required"
                        ? "n/a"
                        : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
