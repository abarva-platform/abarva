import {
  CONTRACT_EVIDENCE_TEMPLATES,
  getContractEvidenceTemplatePack,
} from "@/lib/source/contract-evidence/templates";
import type {
  SourceContractEvidenceArchetypeKey,
  SourceContractEvidenceFamily,
  SourceContractEvidenceTemplate,
} from "@/lib/source/contract-evidence/types";

import type {
  ContractOptimizationEvidenceClass,
  ContractOptimizationEvidenceItem,
  ContractOptimizationEvidencePack,
  ContractOptimizationReviewState,
} from "./contract-optimization-evidence";

/**
 * Whether the governed evidence for a family has reached the product at all, and
 * by which route. This deliberately does not say "uploaded" unless a person
 * actually confirmed the row: governed source-system loads and client uploads are
 * different provenance and must not be reported as the same thing.
 */
export type ContractOptimizationEvidenceLoadState =
  | "not_loaded"
  | "system_loaded"
  | "document_loaded"
  | "human_confirmed";

/** How far the extraction/review pipeline has taken the family. */
export type ContractOptimizationEvidenceParserState =
  | "not_run"
  | "needs_review"
  | "extracted"
  | "reviewed"
  | "finance_validated";

export type ContractOptimizationEvidenceObligation = "required" | "optional";

export type ContractOptimizationEvidenceReadinessStatus =
  | "blocked"
  | "partial"
  | "ready";

export interface ContractOptimizationEvidenceReadinessRow {
  readonly family: SourceContractEvidenceFamily;
  readonly label: string;
  readonly purpose: string;
  readonly obligation: ContractOptimizationEvidenceObligation;
  readonly evidenceClass: ContractOptimizationEvidenceClass;
  readonly sourceSystems: readonly string[];
  readonly ownerRole: string;
  readonly grainHistory: string;
  readonly templateFileName: string;
  readonly templateSheetName: string;
  readonly loadState: ContractOptimizationEvidenceLoadState;
  readonly parserState: ContractOptimizationEvidenceParserState;
  readonly factObjectRefs: readonly string[];
  readonly factObjectCount: number;
  readonly artifactImpact: string;
  readonly blocks: string;
  readonly nextAction: string;
}

export interface ContractOptimizationEvidenceReadiness {
  readonly rows: readonly ContractOptimizationEvidenceReadinessRow[];
  readonly requiredTotal: number;
  readonly requiredEvidenced: number;
  readonly status: ContractOptimizationEvidenceReadinessStatus;
  /** Required families with no governed evidence at all. */
  readonly blockingFamilies: readonly SourceContractEvidenceFamily[];
  /**
   * True when at least one required family is missing. Sizing may still be
   * computed internally, but no external value claim may be made.
   */
  readonly sizingBlocked: boolean;
  readonly summary: string;
}

interface EvidenceFamilySpec {
  readonly ownerRole: string;
  readonly sourceSystems: readonly string[];
  readonly grainHistory: string;
  readonly artifactImpact: string;
  readonly blocks: string;
  /**
   * Substrings matched against `evidence_refs` on governed ledger items. Matching
   * is on the governed reference key, never on tenant, vendor, or contract names.
   */
  readonly evidenceRefMatchers: readonly string[];
  readonly nextActionWhenMissing: string;
  readonly nextActionWhenPresent: string;
}

const FAMILY_SPECS: Record<SourceContractEvidenceFamily, EvidenceFamilySpec> = {
  contract_baseline: {
    ownerRole: "Contract manager / Legal operations",
    sourceSystems: ["CLM / contract repository"],
    grainHistory:
      "Agreement, SOW, order form, and amendment grain for the active term.",
    artifactImpact: "Locked Baseline, Opportunity Diagnosis, Approval Brief",
    blocks: "Baseline lock and every downstream value claim",
    evidenceRefMatchers: [
      "pricing_schedule",
      "contract.scope_summary",
      "cmdb.application_scope",
    ],
    nextActionWhenMissing:
      "Request the executed agreement, order forms, amendments, and pricing schedule from the contract owner.",
    nextActionWhenPresent:
      "Reconcile the extracted baseline against the contract register before locking.",
  },
  invoice_summary: {
    ownerRole: "Accounts payable / Finance operations",
    sourceSystems: ["AP / ERP / financial subledger", "Procurement / S2P"],
    grainHistory:
      "Invoice-line and PO-line grain for the active term; 12-24 months preferred.",
    artifactImpact: "Locked Baseline, Recoverable Leakage rows",
    blocks: "Actual-spend baseline and contracted-to-actual variance",
    evidenceRefMatchers: [
      "invoice_lines",
      "po_contract_match",
      "post_amendment_invoices",
    ],
    nextActionWhenMissing:
      "Request the invoice register with PO match and GL coding for the active term.",
    nextActionWhenPresent:
      "Confirm period coverage is complete before treating variance as addressable.",
  },
  invoice_exception: {
    ownerRole: "Accounts payable / Procurement operations",
    sourceSystems: ["AP / ERP / financial subledger"],
    grainHistory:
      "Exception-level rows above the agreed materiality threshold for the active term.",
    artifactImpact: "Recoverable Leakage rows, Vendor dispute pack",
    blocks: "Off-contract billing and duplicate-charge recovery claims",
    evidenceRefMatchers: ["rate_card_variance", "fieldglass.rate_card"],
    nextActionWhenMissing:
      "Request disputed-invoice and payment-block extracts from the AP exception queue.",
    nextActionWhenPresent:
      "Classify each exception as vendor-responsible or client-responsible before claiming recovery.",
  },
  sla_performance: {
    ownerRole: "Service delivery manager / Vendor management",
    sourceSystems: ["ITSM / service management", "CLM / contract repository"],
    grainHistory: "Monthly SLA and service-credit rows; 24 months preferred.",
    artifactImpact: "Recoverable Leakage rows, Service-credit claim pack",
    blocks: "Service-credit recovery and cure-rights position",
    evidenceRefMatchers: [
      "sla_incident_service_credit_monthly",
      "sla_performance_history",
      "contract.sla_credit_terms",
      "clm.sla_exhibit",
      "service_credit_register",
    ],
    nextActionWhenMissing:
      "Request contract-governed SLA performance and the monthly service-credit claim log.",
    nextActionWhenPresent:
      "Check credit caps and exclusions before treating the earned-less-claimed gap as recoverable.",
  },
  ticket_volume: {
    ownerRole: "Service delivery manager / Tower lead",
    sourceSystems: [
      "ITSM / service management",
      "SaaS / cloud admin telemetry",
    ],
    grainHistory:
      "Monthly demand/usage aggregates by tower, queue, SKU, or service for the active term; 12 months preferred.",
    artifactImpact: "Locked Baseline volumetrics, Negotiation Strategy",
    blocks: "Demand-versus-baseline comparison and volume/usage-based repricing",
    evidenceRefMatchers: [
      "ticket_volumes",
      "ticket_volume",
      "usage_entitlement",
      "source.golden_contract_usage_entitlement_monthly",
      "raw_source_v4.entra_saas_usage_monthly",
    ],
    nextActionWhenMissing:
      "Request monthly aggregate demand volumes by tower, queue, SKU, or service; do not upload ticket text or user-level activity.",
    nextActionWhenPresent:
      "Compare observed demand or usage with the contracted baseline before repricing.",
  },
  staffing_model: {
    ownerRole: "Vendor management lead / Tower lead",
    sourceSystems: ["Procurement / S2P", "ITSM / service management"],
    grainHistory:
      "Role and tower grain for the active term; no personal employee data.",
    artifactImpact: "Negotiation Strategy, Vendor Ask List",
    blocks: "Committed-versus-observed staffing position",
    evidenceRefMatchers: [],
    nextActionWhenMissing:
      "Request committed-versus-observed staffing by tower from the vendor governance pack.",
    nextActionWhenPresent:
      "Confirm coverage and location mix against the contracted staffing schedule.",
  },
  change_order: {
    ownerRole: "Contract manager / Category manager",
    sourceSystems: ["CLM / contract repository", "Procurement / S2P"],
    grainHistory: "Change-order record grain for the active term.",
    artifactImpact: "Locked Baseline, Negotiated Improvement rows",
    blocks: "Separating true project change from recurring run work",
    evidenceRefMatchers: [
      "change_order_register",
      "change_order",
      "renewal_negotiation_history",
      "contract.indexation_terms",
    ],
    nextActionWhenMissing:
      "Request the approved change-order register with recurring flags and approval evidence.",
    nextActionWhenPresent:
      "Reclassify recurring change orders into the run baseline before sizing.",
  },
  renewal_terms: {
    ownerRole: "Contract manager / Legal operations",
    sourceSystems: ["CLM / contract repository"],
    grainHistory:
      "Clause-level rows for renewal, notice, cure, benchmark, and termination rights.",
    artifactImpact: "Avoided Cost rows, Negotiation Strategy timing",
    blocks: "Decision timing, leverage window, and auto-renewal risk",
    evidenceRefMatchers: [
      "renewal_notice",
      "contract.renewal_terms",
      "renewal_terms",
      "benchmarking_clause",
      "exit_rights_summary",
      "clm.renewal_quote",
    ],
    nextActionWhenMissing:
      "Request renewal, notice, cure, and termination clause summaries with dates.",
    nextActionWhenPresent:
      "Confirm the notice window against today's date before committing to a strategy.",
  },
  evidence_reference: {
    ownerRole: "Vendor management lead",
    sourceSystems: ["CLM / contract repository", "Finance / FP&A / Tower value evidence"],
    grainHistory: "One citation row per extract; page, sheet, or report section.",
    artifactImpact: "Citation map on every generated artifact",
    blocks: "Nothing on its own; it makes other rows auditable",
    evidenceRefMatchers: [
      "tower.value_claim",
      "finance_value_confirmation",
    ],
    nextActionWhenMissing:
      "Capture the file, page, or report reference behind each extract already provided.",
    nextActionWhenPresent:
      "Keep citations current as new extracts arrive.",
  },
};

const EVIDENCE_CLASS_RANK: Record<ContractOptimizationEvidenceClass, number> = {
  missing: 0,
  inferred: 1,
  document_evidenced: 2,
  system_evidenced: 3,
  human_validated: 4,
};

const REVIEW_STATE_TO_PARSER_STATE: Record<
  ContractOptimizationReviewState,
  ContractOptimizationEvidenceParserState
> = {
  missing: "not_run",
  needs_review: "needs_review",
  system_extracted: "extracted",
  document_extracted: "extracted",
  procurement_reviewed: "reviewed",
  legal_reviewed: "reviewed",
  finance_validated: "finance_validated",
};

const PARSER_STATE_RANK: Record<
  ContractOptimizationEvidenceParserState,
  number
> = {
  not_run: 0,
  needs_review: 1,
  extracted: 2,
  reviewed: 3,
  finance_validated: 4,
};

/**
 * Build the evidence readiness board for one contract.
 *
 * The requirement spine comes from the governed template registry, so the rows
 * are the same for every tenant and contract. Observed state comes only from the
 * governed evidence pack. A family with no matching governed evidence reports
 * `missing`/`not_loaded`/`not_run` — it is never reported as a zero amount, and
 * never inferred from the contract's identity.
 *
 * Where several governed items back one family, the row reports the *weakest*
 * evidence class and parser state among them: a family is only as trustworthy as
 * its least-supported input.
 */
export function buildContractOptimizationEvidenceReadiness(input: {
  readonly evidencePack: ContractOptimizationEvidencePack | null;
  readonly archetypeKey?: SourceContractEvidenceArchetypeKey;
}): ContractOptimizationEvidenceReadiness {
  const archetypeKey =
    input.archetypeKey ?? inferEvidenceArchetype(input.evidencePack);
  const templates: readonly SourceContractEvidenceTemplate[] = archetypeKey
    ? getContractEvidenceTemplatePack(archetypeKey).templates
    : CONTRACT_EVIDENCE_TEMPLATES;

  const items = input.evidencePack?.ledger_items ?? [];
  const rows = templates.map((template) =>
    buildRow(template, matchItems(items, template.family)),
  );

  const requiredRows = rows.filter((row) => row.obligation === "required");
  const evidencedRequired = requiredRows.filter(
    (row) => row.evidenceClass !== "missing",
  );
  const blockingFamilies = requiredRows
    .filter((row) => row.evidenceClass === "missing")
    .map((row) => row.family);

  const status: ContractOptimizationEvidenceReadinessStatus =
    blockingFamilies.length === 0
      ? "ready"
      : evidencedRequired.length === 0
        ? "blocked"
        : "partial";

  return {
    rows,
    requiredTotal: requiredRows.length,
    requiredEvidenced: evidencedRequired.length,
    status,
    blockingFamilies,
    sizingBlocked: blockingFamilies.length > 0,
    summary: summarize(
      status,
      evidencedRequired.length,
      requiredRows.length,
      blockingFamilies,
      templates,
    ),
  };
}

function inferEvidenceArchetype(
  evidencePack: ContractOptimizationEvidencePack | null,
): SourceContractEvidenceArchetypeKey | undefined {
  const refs = evidencePack?.ledger_items.flatMap((item) => [
    ...item.evidence_refs,
    ...item.source_systems,
  ]) ?? [];
  const haystack = refs.join(" ").toLowerCase();
  if (
    haystack.includes("usage_entitlement") ||
    haystack.includes("entra_saas_usage") ||
    haystack.includes("saas / cloud admin") ||
    haystack.includes("admin usage export")
  ) {
    return "saas_renewal_optimization";
  }
  return undefined;
}

function matchItems(
  items: readonly ContractOptimizationEvidenceItem[],
  family: SourceContractEvidenceFamily,
): readonly ContractOptimizationEvidenceItem[] {
  const matchers = FAMILY_SPECS[family].evidenceRefMatchers;
  if (matchers.length === 0) return [];
  return items.filter((item) =>
    item.evidence_refs.some((ref) =>
      matchers.some((matcher) => ref.includes(matcher)),
    ),
  );
}

function buildRow(
  template: SourceContractEvidenceTemplate,
  matched: readonly ContractOptimizationEvidenceItem[],
): ContractOptimizationEvidenceReadinessRow {
  const spec = FAMILY_SPECS[template.family];
  const obligation: ContractOptimizationEvidenceObligation = template.required
    ? "required"
    : "optional";

  if (matched.length === 0) {
    return {
      family: template.family,
      label: template.sheetName,
      purpose: template.purpose,
      obligation,
      evidenceClass: "missing",
      sourceSystems: spec.sourceSystems,
      ownerRole: spec.ownerRole,
      grainHistory: spec.grainHistory,
      templateFileName: template.fileName,
      templateSheetName: template.sheetName,
      loadState: "not_loaded",
      parserState: "not_run",
      factObjectRefs: [],
      factObjectCount: 0,
      artifactImpact: spec.artifactImpact,
      blocks: spec.blocks,
      nextAction: spec.nextActionWhenMissing,
    };
  }

  const evidenceClass = weakestEvidenceClass(matched);
  const parserState = weakestParserState(matched);
  const factObjectRefs = collectFactObjectRefs(matched);

  return {
    family: template.family,
    label: template.sheetName,
    purpose: template.purpose,
    obligation,
    evidenceClass,
    sourceSystems: collectSourceSystems(matched, spec),
    ownerRole: spec.ownerRole,
    grainHistory: spec.grainHistory,
    templateFileName: template.fileName,
    templateSheetName: template.sheetName,
    loadState: loadStateFor(evidenceClass, parserState),
    parserState,
    factObjectRefs,
    factObjectCount: factObjectRefs.length,
    artifactImpact: spec.artifactImpact,
    blocks: spec.blocks,
    nextAction:
      evidenceClass === "missing"
        ? spec.nextActionWhenMissing
        : spec.nextActionWhenPresent,
  };
}

function weakestEvidenceClass(
  items: readonly ContractOptimizationEvidenceItem[],
): ContractOptimizationEvidenceClass {
  return items.reduce<ContractOptimizationEvidenceClass>(
    (weakest, item) =>
      EVIDENCE_CLASS_RANK[item.evidence_class] < EVIDENCE_CLASS_RANK[weakest]
        ? item.evidence_class
        : weakest,
    "human_validated",
  );
}

function weakestParserState(
  items: readonly ContractOptimizationEvidenceItem[],
): ContractOptimizationEvidenceParserState {
  return items.reduce<ContractOptimizationEvidenceParserState>((weakest, item) => {
    const state = REVIEW_STATE_TO_PARSER_STATE[item.review_state];
    return PARSER_STATE_RANK[state] < PARSER_STATE_RANK[weakest]
      ? state
      : weakest;
  }, "finance_validated");
}

function loadStateFor(
  evidenceClass: ContractOptimizationEvidenceClass,
  parserState: ContractOptimizationEvidenceParserState,
): ContractOptimizationEvidenceLoadState {
  if (evidenceClass === "missing") return "not_loaded";
  if (parserState === "finance_validated" || evidenceClass === "human_validated") {
    return "human_confirmed";
  }
  if (evidenceClass === "document_evidenced") return "document_loaded";
  return "system_loaded";
}

function collectSourceSystems(
  items: readonly ContractOptimizationEvidenceItem[],
  spec: EvidenceFamilySpec,
): readonly string[] {
  const observed = new Set<string>();
  for (const item of items) {
    for (const system of item.source_systems) observed.add(system);
  }
  return observed.size > 0 ? [...observed] : spec.sourceSystems;
}

function collectFactObjectRefs(
  items: readonly ContractOptimizationEvidenceItem[],
): readonly string[] {
  const refs = new Set<string>();
  for (const item of items) {
    for (const ref of item.source_record_ids) refs.add(ref);
    for (const ref of item.document_refs) refs.add(ref);
  }
  return [...refs];
}

function summarize(
  status: ContractOptimizationEvidenceReadinessStatus,
  evidencedRequired: number,
  requiredTotal: number,
  blockingFamilies: readonly SourceContractEvidenceFamily[],
  templates: readonly SourceContractEvidenceTemplate[],
): string {
  if (status === "ready") {
    return `All ${requiredTotal} required evidence families have governed evidence. Review parser state and owner sign-off before any external value claim.`;
  }
  const missingLabels = blockingFamilies
    .map(
      (family) =>
        templates.find((template) => template.family === family)?.sheetName ??
        family,
    )
    .join(", ");
  if (status === "blocked") {
    return `No required evidence family has governed evidence yet. Collect ${missingLabels} before sizing this contract.`;
  }
  return `${evidencedRequired} of ${requiredTotal} required evidence families have governed evidence. Missing: ${missingLabels}. Sizing stays internal until these are collected.`;
}
