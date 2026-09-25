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
 *
 * Item U-521. The Optimize facet used to read `vm.opportunityView` -- the
 * product's computed opportunity set -- so the card answered one of its seven
 * questions with the recommendation that question is about, and the "What feeds
 * it" block listed that computed count among the contract's inputs. Both sites
 * now read the evidence coverage row, so all seven facets have one source and
 * the feeds block enumerates only the coverage lanes.
 *
 * What that does NOT settle, measured while making the change and recorded here
 * so the next reader does not re-derive it: `opportunity_rows` does not mean one
 * population. The migration-owned projection defines it as count(*) over
 * `source.contract_action_candidate_v1`
 * (`20260910203000_source_contract_tab_intelligence.sql:73`, self-labelled at
 * `:126`), while the live portfolio adapter defines it as count(*) over deduped
 * `source.optimization_opportunity` (`live/portfolioAdapter.ts:986`, from the
 * `opportunity_source` CTE, self-labelled at `:1081`) -- which is the same table
 * behind `vm.opportunityView`. A third writer, `contractCoverageWithDetailLanes`
 * in `WorkspaceExecutiveShell.tsx:6240`, overwrites the lane with the computed
 * count outright.
 *
 * So on the live path this facet may still be answered from the computed set,
 * arriving through the lane instead of directly. That is a data-contract defect
 * rather than a rendering one and it is filed as item U-522; do not "fix" it
 * here by picking another column. `opportunities_with_evidence` is the obvious
 * candidate and is not safe to adopt yet: it filters on `evidence_state`, and
 * item C-402 has the related `evidence_status` column open as effectively
 * constant. Until U-522 settles which population this lane reports, treat the
 * Optimize facet as consistent with its siblings but not independently proven.
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

function laneCountLabel(
  coverage: Coverage,
  field: keyof SourceContractEvidenceCoverageRow,
  noun: string,
): string {
  const count = lane(coverage, field);
  if (count == null) return `${noun} not loaded`;
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function facetStates(
  coverage: Coverage,
  education: ContractEducationView | null,
  scopeRowCount: number,
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
    Optimize: (lane(coverage, "opportunity_rows") ?? 0) > 0,
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
  const states = facetStates(coverage, education, scopeRowCount);

  const answered = FACET_ORDER.filter((f) => states[f] === "answered").length;
  const open = FACET_ORDER.filter((f) => states[f] === "open").length;
  const notRequired = FACET_ORDER.filter(
    (f) => states[f] === "not_required",
  ).length;

  /* What actually feeds this contract, counted from its own rows. */
  const feeds: readonly { readonly label: string; readonly detail: string }[] = [
    {
      label: "Contract register",
      detail: `header ${vm.c ? "loaded" : "not loaded"} · archetype ${education?.archetypeKey && education.archetypeKey !== "unmapped" ? "mapped" : "not mapped"} · terms ${vm.c?.expiry && vm.c.expiry !== "Not established" ? "loaded" : "not loaded"}`,
    },
    {
      label: "Monthly spend and invoices",
      detail: laneCountLabel(coverage, "spend_rows", "spend row"),
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
        : laneCountLabel(coverage, "performance_rows", "performance row"),
    },
    {
      label: "Source documents",
      detail: laneCountLabel(coverage, "document_page_text_rows", "document passage"),
    },
    {
      // Item U-521. Reads the coverage lane rather than
      // `vm.opportunityView.opportunities`: the computed set is an answer about
      // this contract, not an input to it, and printing it here claimed a feed
      // for a contract with no loaded rows and authored levers -- and printed
      // "0 governed levers" rather than "not loaded" when nothing was there.
      // Named as an evidence row count, matching `Contract360Surfaces` under
      // item U-518. Which population the lane actually reports is contested
      // across read paths; see the note at the top of this file and item U-522.
      label: "Opportunity evidence rows",
      detail: laneCountLabel(
        coverage,
        "opportunity_rows",
        "opportunity evidence row",
      ),
    },
  ];

  return (
    <section className="sw-c3-card">
      <div className="sw-c3-eyebrow">What a contract actually is</div>
      <p className="sw-c3-display sw-c3-display-sm sw-c3-edu-question">
        This contract answers {answered} of {FACET_ORDER.length} decision questions.
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
