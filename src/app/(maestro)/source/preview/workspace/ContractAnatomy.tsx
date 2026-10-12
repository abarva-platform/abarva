"use client";

import { useId, useState } from "react";
import type {
  ContractEducationView,
  ContractFacetKey,
} from "@/lib/source/contract-intelligence/education";
import type { SourceContractEvidenceCoverageRow } from "@/lib/source/data-model/types";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type { SourceWorkspaceVM } from "./buildViewModel";

// Coverage reports available lanes, not evaluated commercial decisions.
// D-500 still owns the opportunity-row population across projection paths.

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

const FACET_SIGNAL: Record<ContractFacetKey, string> = {
  Story: "Contract type mapped",
  Scope: "Scope rows available",
  Economics: "Spend rows available",
  Performance: "Performance observations available",
  Relationship: "Scope associations available; owners not validated",
  Evidence: "Document passages available; citation review separate",
  Optimize: "Opportunity records available; calculation proof separate",
};

const INPUTS = [
  {
    key: "agreements",
    label: "Agreements & terms",
    example: "CLM / SharePoint",
    extract: "Executed agreement + terms extract",
    owner: "Contract manager / Legal ops",
    object: "Terms & cited passages",
    request:
      "Provide the executed agreement and SOW, plus notice, renewal, pricing and remedies; bind every file to the same canonical contract ID.",
    unlocks: "Renewal timing, contractual rights and scope boundaries",
    types: [
      "contract",
      "sow",
      "master_services_agreement",
      "statement_of_work",
      "pricing_schedule",
    ],
  },
  {
    key: "invoices",
    label: "Invoices & payments",
    example: "SAP / Oracle / ERP AP",
    extract: "Invoice lines + payment extract",
    owner: "AP / Finance operations",
    object: "Spend & payment observations",
    request:
      "Provide invoice IDs, PO and contract references, currency, line amounts, paid amount and reporting period. Reconcile them before calculating leakage.",
    unlocks: "Billing variance, payment reconciliation and rate-card checks",
    types: ["invoice_export", "invoice", "invoice_summary"],
  },
  {
    key: "scope",
    label: "Application & service scope",
    example: "CMDB / ServiceNow",
    extract: "Scope schedule + CMDB workbook",
    owner: "App owner / CMDB steward",
    object: "Declared scope & ownership",
    request:
      "Provide application and service IDs, the contract or SOW reference, owner, criticality and explicit inclusion or exclusion. Do not join by vendor name alone.",
    unlocks: "Paid-for scope, service accountability and dependencies",
    types: ["scope", "application_inventory"],
  },
  {
    key: "performance",
    label: "Service performance",
    example: "ServiceNow / ITSM",
    extract: "SLA history + incident extract",
    owner: "Service delivery / Vendor management",
    object: "Performance observations",
    request:
      "Provide metric, unit, target, actual, period and incident IDs, together with the governing SLA clause and credit rules.",
    unlocks: "Service breaches, remedy eligibility and vendor follow-up",
    types: ["sla", "sla_report", "performance"],
  },
  {
    key: "changes",
    label: "Change orders",
    example: "Contract change register / CLM",
    extract: "Approved changes + invoice linkage",
    owner: "Contract manager / Category manager",
    object: "Change-order facts",
    request:
      "Provide change-order IDs, scope classification, approval, amount, effective period and invoice references. Compare against the base SOW over the same period.",
    unlocks: "Recurring work billed outside base scope",
    types: ["change_order", "change_order_ledger"],
  },
  {
    key: "usage",
    label: "Measured usage",
    example: "Platform admin / usage meter",
    extract: "Usage + entitlement history",
    owner: "Service delivery / platform admin",
    object: "Consumption observations",
    request:
      "Provide measured quantity and unit, entitled or committed quantity, active users or workloads, contract reference and aligned reporting periods.",
    unlocks: "Consumption against commitment and right-sizing",
    types: ["usage_entitlement_report", "usage"],
  },
  {
    key: "opportunities",
    label: "Opportunity evidence",
    example: "Evidence / calculation register",
    extract: "Cited inputs + calculation record",
    owner: "Category manager / Finance",
    object: "Evidence-bound action candidates",
    request:
      "Bind each candidate action to contract-specific source rows, rule and version, reporting period, calculation inputs and reviewer. An authored amount is not a calculation.",
    unlocks: "Reproducible recommendations, not verified savings",
    types: ["opportunity", "calculation"],
  },
] as const;

function value(input: unknown): string | null {
  return typeof input === "string" && input.trim() ? input.trim() : null;
}

function upstream(input: unknown): string | null {
  const system = value(input);
  return system &&
    !/^(source_contract_depth_package_loader|governed_source_depth_loader|intelligence_v6\.|source\.|doc\.)/i.test(
      system,
    )
    ? system
    : null;
}

function inputProvenance(
  vm: SourceWorkspaceVM,
  input: (typeof INPUTS)[number],
) {
  const contract = vm.detail?.contract;
  const files = (vm.detail?.documentFiles ?? []).filter(
    (file) =>
      contract &&
      file.tenant_key === contract.tenant_key &&
      file.contract_ref === contract.contract_id &&
      (input.types as readonly string[]).includes(file.document_type ?? ""),
  );
  const observations =
    input.key === "invoices"
      ? (vm.detail?.spendMonths ?? [])
      : input.key === "performance"
        ? (vm.detail?.performancePeriods ?? [])
        : [];
  const scoped = observations.filter(
    (row) =>
      contract &&
      row.tenant_key === contract.tenant_key &&
      row.contract_id === contract.contract_id,
  );
  return {
    origins: [
      ...new Set([
        ...files.flatMap((file) => {
          const origin = upstream(
            file.metadata_json?.upstream_source_system ??
              file.metadata_json?.source_system,
          );
          return origin
            ? [
                `${file.content_authenticity === "synthetic" ? "Synthetic origin" : "Recorded origin"}: ${origin}`,
              ]
            : [];
        }),
        ...scoped.flatMap((row) => {
          const origin = upstream(row.source_system);
          return origin ? [`Recorded origin: ${origin}`] : [];
        }),
      ]),
    ],
    refs: [
      ...new Set([
        ...files.map((file) => file.file_name ?? file.file_id),
        ...scoped.flatMap((row) =>
          [value(row.evidence_reference), value(row.source_record_id)].filter(
            (ref): ref is string => ref !== null,
          ),
        ),
      ]),
    ],
    runs: [
      ...new Set(
        [
          ...files.map((file) => file.load_run_id),
          ...scoped.map((row) => row.load_run_id),
        ].filter((run): run is string => Boolean(run)),
      ),
    ],
  };
}

function lane(
  coverage: Coverage,
  field: keyof SourceContractEvidenceCoverageRow,
) {
  if (!coverage) return null;
  return numberFromDb(coverage[field] as never);
}

function facetStates(
  coverage: Coverage,
  education: ContractEducationView | null,
  scopeRowCount: number,
): Record<ContractFacetKey, FacetState> {
  const required = (facet: ContractFacetKey) =>
    education?.facetRequirements?.[facet]?.state !== "not_required";

  const answered: Record<ContractFacetKey, boolean> = {
    Story: Boolean(
      education?.archetypeKey && education.archetypeKey !== "unmapped",
    ),
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
  const [selectedInput, setSelectedInput] = useState<string>("agreements");
  const detailId = useId();
  const education = vm.contractEducation ?? null;
  const states = facetStates(coverage, education, scopeRowCount);

  const answered = FACET_ORDER.filter((f) => states[f] === "answered").length;
  const open = FACET_ORDER.filter((f) => states[f] === "open").length;
  const notRequired = FACET_ORDER.filter(
    (f) => states[f] === "not_required",
  ).length;

  const counts: Record<string, number | null> = {
    agreements: lane(coverage, "document_page_text_rows"),
    invoices: lane(coverage, "spend_rows"),
    scope: scopeRowCount,
    performance: lane(coverage, "performance_rows"),
    changes: lane(coverage, "change_order_rows"),
    usage: null,
    opportunities: lane(coverage, "opportunity_rows"),
  };
  const nouns: Record<string, string> = {
    agreements: "document passage",
    invoices: "spend row",
    scope: "scope row",
    performance: "performance row",
    changes: "change-order row",
    opportunities: "opportunity record",
  };
  const missingInputs: Record<string, string> = {
    agreements: "Executed agreement and terms needed",
    invoices: "Invoice and payment extract needed",
    scope: "Scope extract needed",
    performance: "SLA history needed",
    changes: "Approved change ledger needed",
    opportunities: "Cited opportunity inputs needed",
  };
  const selected =
    INPUTS.find((input) => input.key === selectedInput) ?? INPUTS[0];
  const provenance = inputProvenance(vm, selected);
  const countLabel = (key: string) => {
    if (key === "usage") return "Usage history not exposed in this view";
    if (key === "performance" && states.Performance === "not_required")
      return "Not required by this contract type";
    const count = counts[key];
    if (count === 0) return missingInputs[key];
    if (key === "agreements" && count != null)
      return `Contract-wide: ${count} document passage${count === 1 ? "" : "s"}`;
    return count == null
      ? "Not established in this view"
      : `${count} ${nouns[key]}${count === 1 ? "" : "s"}`;
  };

  return (
    <section
      className="sw-c3-card sw-c3-evidence-path"
      aria-label="Contract evidence path"
    >
      <div className="sw-c3-eyebrow">Contract evidence path</div>
      <p className="sw-c3-display sw-c3-display-sm sw-c3-edu-question">
        From source evidence to contract decisions
      </p>
      <p className="sw-c3-note">
        View coverage: {answered} of {FACET_ORDER.length}. Row presence is not
        decision readiness.
        {open > 0
          ? ` ${open} ${open === 1 ? "view needs" : "views need"} evidence.`
          : ""}
        {notRequired > 0
          ? ` ${notRequired} ${notRequired === 1 ? "does" : "do"} not apply to this contract type - not a gap, a state.`
          : ""}
      </p>

      <div className="sw-c3-flow">
        <svg
          className="sw-c3-flow-wires"
          viewBox="0 0 1000 476"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {INPUTS.map((input, index) => {
            const y = 34 + index * 68;
            return (
              <path
                key={input.key}
                d={`M 665 ${y} C 700 ${y}, 690 238, 735 238`}
                className={input.key === selectedInput ? "is-selected" : ""}
              />
            );
          })}
        </svg>
        <div className="sw-c3-anatomy-col sw-c3-flow-inputs">
          <div className="sw-c3-flow-columns sw-c3-eyebrow">
            <span>Source systems</span>
            <span>Extracts & workbooks</span>
          </div>
          <p className="sw-c3-flow-example-note">
            Examples, not verified connections
          </p>
          {INPUTS.map((input) => {
            return (
              <button
                type="button"
                key={input.key}
                className="sw-c3-flow-input"
                aria-pressed={selectedInput === input.key}
                aria-controls={detailId}
                onClick={() => setSelectedInput(input.key)}
              >
                <span className="sw-c3-flow-source">
                  <span>
                    <strong>{input.label}</strong>
                    <small>Typical: {input.example}</small>
                  </span>
                </span>
                <span className="sw-c3-flow-arrow" aria-hidden="true">
                  →
                </span>
                <span className="sw-c3-flow-extract">
                  <strong>{input.extract}</strong>
                  <small>{countLabel(input.key)}</small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="sw-c3-flow-record">
          <div className="sw-c3-eyebrow">Canonical contract</div>
          <strong>One contract identity</strong>
          <span className="sw-c3-flow-contract-id">
            {vm.detail?.contract.contract_id ??
              vm.c?.id ??
              coverage?.contract_id ??
              "Identity not loaded"}
          </span>
          <div className="sw-c3-flow-structure-label">Record structure</div>
          <ul>
            <li>Terms & scope</li>
            <li>Vendor & owner dimensions</li>
            <li>Spend & performance facts</li>
            <li>Cited document passages</li>
          </ul>
          <div className="sw-c3-flow-output">
            <span aria-hidden="true">→</span>
            <span>Evidence-bound decisions</span>
          </div>
          <p className="sw-c3-note">
            Rule + inputs + references required for a calculated recommendation.
          </p>
        </div>
      </div>

      <section
        id={detailId}
        className="sw-c3-flow-detail"
        aria-label={`${selected.label} input detail`}
      >
        <div>
          <div className="sw-c3-eyebrow">{selected.label}</div>
          <strong>{selected.object}</strong>
          <p>
            {provenance.origins.length
              ? provenance.origins.join(" · ")
              : "Upstream origin not declared"}
          </p>
          {selected.key === "invoices" ? (
            <p>
              Spend rows do not prove invoice reconciliation or measured usage.
            </p>
          ) : null}
        </div>
        <div>
          <div className="sw-c3-eyebrow">Suggested input owner</div>
          <strong>{selected.owner}</strong>
          <p>{selected.request}</p>
          <small>Unlocks: {selected.unlocks}</small>
        </div>
        {provenance.refs.length || provenance.runs.length ? (
          <details className="sw-c3-flow-lineage">
            <summary>Recorded files, rows & load runs</summary>
            <ul>
              {provenance.refs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
              {provenance.runs.map((run) => (
                <li key={run}>Load run: {run}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>
      <details className="sw-c3-flow-facets">
        <summary>
          Evidence by contract view{" "}
          <span>
            {answered}/{FACET_ORDER.length} with evidence
          </span>
        </summary>
        <div className="sw-c3-facets">
          {FACET_ORDER.map((facet, index) => {
            const state = states[facet];
            return (
              <div className={`sw-c3-facet sw-c3-facet-${state}`} key={facet}>
                <span className="sw-c3-facet-index">{index + 1}</span>
                <span className="sw-c3-facet-main">
                  <span className="sw-c3-facet-name">{facet}</span>
                  <span className="sw-c3-facet-question">
                    {FACET_SIGNAL[facet]}
                  </span>
                </span>
                <span className="sw-c3-facet-mark">
                  {state === "answered" ? (
                    <span aria-label="Evidence present">✓</span>
                  ) : state === "not_required" ? (
                    "n/a"
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
