export type ContractEducationState = "ready" | "partial" | "blocked";

export type ContractFacetKey =
  | "Story"
  | "Scope"
  | "Economics"
  | "Performance"
  | "Relationship"
  | "Evidence"
  | "Optimize";

export interface ContractFacetRequirement {
  readonly state: "required" | "not_required";
  readonly reason: string;
}

export interface ContractEducationThreshold {
  /** The observable signal, in the reader's terms. */
  readonly signal: string;
  /** What it changes about the commercial position. */
  readonly decision: string;
  readonly tone: "act" | "watch" | "relax";
}

export interface ContractEducationStep {
  readonly key: "track" | "load" | "observe";
  readonly title: string;
  readonly question: string;
  readonly guidance: string;
  readonly evidence: string;
  readonly state: "loaded" | "next" | "not_required";
}

export interface ContractEducationView {
  readonly archetypeKey: string;
  readonly archetypeLabel: string;
  readonly headline: string;
  readonly body: string;
  readonly state: ContractEducationState;
  readonly stateLabel: string;
  readonly steps: readonly ContractEducationStep[];
  readonly focus: string;
  readonly basis: readonly string[];
  /**
   * How many evidence inputs this archetype's playbook requires, and which of
   * them are not loaded — in reader-facing words.
   *
   * `stateLabel` alone says "partial" without saying partial for what, which
   * let a summary contradict the steps beneath it: the step states and the
   * readiness word are computed from different populations, so a step could
   * read "loaded" while the requirement behind it was still outstanding.
   * Carrying the reason means the surface never has to infer it.
   */
  readonly requiredEvidenceCount: number;
  readonly missingEvidence: readonly string[];
  /**
   * The thresholds that change the commercial decision, written before the
   * numbers move so the response is a policy rather than an argument.
   *
   * Authored per archetype, never derived from a contract's own figures: a
   * threshold inferred from the data it is meant to judge is circular, and on a
   * governed surface it would read as a finding rather than a rule.
   */
  readonly thresholds: readonly ContractEducationThreshold[];
  readonly facetRequirements: Readonly<
    Record<ContractFacetKey, ContractFacetRequirement>
  >;
}

export interface ContractEducationInput {
  readonly archetype?: string | null;
  readonly vendorName?: string | null;
  readonly contractName?: string | null;
  readonly scopeRows: number;
  readonly spendRows: number;
  readonly invoiceRows: number;
  readonly performanceRows: number;
  readonly documentRows: number;
  readonly opportunityRows: number;
  readonly changeOrderRows: number;
  readonly hasReviewedPurpose: boolean;
  /**
   * The recorded benchmarking-clause value, verbatim from the contract record
   * (for example "present", "absent", "limited"), or null when the contract
   * carries no value at all. This is deliberately not a boolean: the field is
   * a value enum, and coercing it to a flag reads an explicitly recorded
   * "absent" as presence.
   */
  readonly benchmarkingClause: string | null;
}

type EducationGuide = Omit<
  ContractEducationView,
  | "archetypeKey"
  | "state"
  | "stateLabel"
  | "steps"
  | "basis"
  | "facetRequirements"
  | "requiredEvidenceCount"
  | "missingEvidence"
> & {
  readonly match: (key: string) => boolean;
  readonly requiredEvidence: readonly (keyof ContractEducationInput)[];
  readonly stepCopy: Readonly<
    Record<
      ContractEducationStep["key"],
      Omit<ContractEducationStep, "state" | "evidence">
    >
  >;
};

const REQUIRED_FACETS: Readonly<
  Record<ContractFacetKey, ContractFacetRequirement>
> = {
  Story: {
    state: "required",
    reason: "Every contract needs a plain-English commercial purpose.",
  },
  Scope: {
    state: "required",
    reason: "The named applications, services, or workloads bound the contract.",
  },
  Economics: {
    state: "required",
    reason: "Commercial value and observed spend are part of the contract baseline.",
  },
  Performance: {
    state: "required",
    reason: "Service quality evidence is part of this archetype's operating model.",
  },
  Relationship: {
    state: "required",
    reason: "Loaded relationships explain who provides and owns the contract.",
  },
  Evidence: {
    state: "required",
    reason: "Every claim must show its evidence boundary.",
  },
  Optimize: {
    state: "required",
    reason: "The relevant commercial actions belong in the optimization view.",
  },
};

function facetRequirementsForArchetype(
  key: string,
): Readonly<Record<ContractFacetKey, ContractFacetRequirement>> {
  const notPerformance =
    key.includes("cloud") ||
    key.includes("consumption") ||
    key.includes("edp") ||
    key.includes("saas") ||
    key.includes("subscription") ||
    key.includes("software") ||
    key.includes("license") ||
    key.includes("productivity") ||
    key.includes("crm");
  if (!notPerformance) return REQUIRED_FACETS;
  return {
    ...REQUIRED_FACETS,
    Performance: {
      state: "not_required",
      reason:
        "This archetype is governed by consumption, entitlement, or commercial evidence; SLA and service-credit performance is not a required lane unless the contract declares it.",
    },
  };
}

const guide = (
  config: Omit<EducationGuide, "match"> & {
    readonly matches: readonly string[];
  },
): EducationGuide => ({
  ...config,
  match: (key) => config.matches.some((value) => key.includes(value)),
});

const GUIDES: readonly EducationGuide[] = [
  guide({
    matches: [
      "cloud_consumption",
      "cloud_platform",
      "consumption_commit",
      "edp",
    ],
    archetypeLabel: "Cloud consumption commitment",
    headline: "Manage the commitment against real workload demand.",
    body: "The commercial question is whether the buyer is paying for a commitment that the workloads can actually consume. Keep usage, commitment coverage, billing, and renewal timing together before changing the commercial position.",
    focus:
      "Turn consumption evidence into a right-sized commitment and a controlled renewal decision.",
    requiredEvidence: ["spendRows", "scopeRows", "documentRows"],
    thresholds: [
      {
        signal:
          "Utilization is still under 40% at the two-thirds mark of the term",
        decision:
          "Serve notice and re-base. The commitment was sized wrong, not the adoption plan.",
        tone: "act",
      },
      {
        signal:
          "Utilization crosses 70%",
        decision:
          "Stop treating this as over-bought and move the conversation to rate and tier.",
        tone: "relax",
      },
      {
        signal:
          "A third workload group starts drawing on the commitment",
        decision:
          "Re-forecast before renewal — the original sizing may turn out to be right.",
        tone: "watch",
      },
      {
        signal:
          "Unconsumed balance exceeds a year of observed use",
        decision:
          "Carry-forward becomes the primary ask, ahead of a step-down.",
        tone: "watch",
      },
    ],
    stepCopy: {
      track: {
        key: "track",
        title: "Track",
        question: "Are workloads using what the contract commits?",
        guidance:
          "Track committed amount, actual spend, covered spend, on-demand spend, utilization, and the workload or account consuming it each month.",
      },
      load: {
        key: "load",
        title: "Load",
        question: "What makes the consumption number defensible?",
        guidance:
          "Load the executed order or EDP, monthly billing export, commitment coverage, resource inventory, application ownership, tag quality, and AP reconciliation.",
      },
      observe: {
        key: "observe",
        title: "Observe",
        question: "What should change before the next commercial gate?",
        guidance:
          "Watch utilization trend, on-demand leakage, stable workload coverage, untagged spend, workload migration, and the notice window. Treat a signal as a sizing task until the underlying rows support an ask.",
      },
    },
  }),
  guide({
    matches: [
      "managed_services",
      "service_desk",
      "application_managed",
      "outsourcing",
      "ams",
    ],
    archetypeLabel: "Managed services agreement",
    headline: "Manage the service promise against demand, quality, and scope.",
    body: "The commercial question is whether the fee, scope, service level, and change-order pattern still match the service the buyer receives. The operating evidence is part of the contract decision, not a separate report.",
    focus:
      "Make service demand, delivery quality, scope movement, and remedies visible before renewal or amendment.",
    requiredEvidence: [
      "documentRows",
      "scopeRows",
      "performanceRows",
      "invoiceRows",
    ],
    thresholds: [
      {
        signal:
          "Service credits are earned two periods running",
        decision:
          "Raise the credits as a governance failure, not a billing correction.",
        tone: "act",
      },
      {
        signal:
          "Ticket volume falls while the fee holds flat",
        decision:
          "The price no longer tracks the work. Re-base at the next commercial gate.",
        tone: "watch",
      },
      {
        signal:
          "A scope change lands without a change order",
        decision:
          "Stop and document it. Undocumented scope is the most expensive drift on this contract type.",
        tone: "act",
      },
    ],
    stepCopy: {
      track: {
        key: "track",
        title: "Track",
        question: "Is the service being delivered at the contracted level?",
        guidance:
          "Track SLA attainment, breach counts, credits calculated and claimed, ticket volumes, recurring changes, service towers, and unit or fee movement.",
      },
      load: {
        key: "load",
        title: "Load",
        question: "What proves the service and commercial baseline?",
        guidance:
          "Load the MSA, SOWs, SLA schedule, rate card, invoice lines, ITSM tickets, approved change orders, QBR scorecards, scope inventory, and transition or exit terms.",
      },
      observe: {
        key: "observe",
        title: "Observe",
        question: "Where is the agreement drifting over time?",
        guidance:
          "Watch chronic misses, unclaimed credits, recurring change-order spend, demand reduction without fee flex, scope outside the base service, and the evidence needed for an exit or rebid decision.",
      },
    },
  }),
  guide({
    matches: [
      "saas",
      "subscription",
      "software",
      "license",
      "productivity",
      "productivity_platform",
      "collaboration",
      "enterprise_agreement",
    ],
    archetypeLabel: "Software subscription",
    headline: "Manage entitlement, adoption, and renewal economics together.",
    body: "The commercial question is whether paid entitlement matches active use and whether the renewal preserves flexibility as adoption changes. Seats, usage, price terms, and renewal rights need one evidence trail.",
    focus:
      "Reduce shelfware and renewal surprise without confusing adoption signals with a savings outcome.",
    requiredEvidence: ["documentRows", "spendRows", "scopeRows"],
    thresholds: [],
    stepCopy: {
      track: {
        key: "track",
        title: "Track",
        question: "Are entitlements aligned to active use?",
        guidance:
          "Track purchased units, assigned units, active users, feature or workload adoption, invoice quantities, price changes, and renewal commitments by period.",
      },
      load: {
        key: "load",
        title: "Load",
        question: "What makes a renewal adjustment defensible?",
        guidance:
          "Load the agreement and order forms, seat or usage export, invoice detail, price list, support tier, true-up rules, termination rights, and business owner mapping.",
      },
      observe: {
        key: "observe",
        title: "Observe",
        question: "What should the owner decide before renewal?",
        guidance:
          "Watch inactive entitlement, tier thresholds, true-up exposure, price or index changes, unused support, adoption by business unit, and the date by which a reduction or exit must be served.",
      },
    },
  }),
];

const FALLBACK_GUIDE: EducationGuide = guide({
  matches: [],
  archetypeLabel: "Contract governance",
  headline: "Build the evidence loop before changing the deal.",
  body: "Every contract needs a stable baseline, a clear scope, observable performance or usage, and an owner who can act at the next commercial decision. The archetype mapping is the first missing fact when the contract shape is not declared.",
  focus:
    "Map the contract to an archetype, then run its evidence loop through renewal and value review.",
  requiredEvidence: ["documentRows", "scopeRows", "spendRows"],
  thresholds: [
    {
      signal:
        "The notice window opens with no position agreed",
      decision:
        "Escalate. Auto-renewal is the default outcome of an unmade decision.",
      tone: "act",
    },
    {
      signal:
        "Invoiced and paid diverge for two periods",
      decision:
        "Reconcile before treating any figure on this contract as evidence.",
      tone: "watch",
    },
  ],
  stepCopy: {
    track: {
      key: "track",
      title: "Track",
      question: "What is the baseline that can move?",
      guidance:
        "Track the committed commercial baseline, actual spend or usage, scope, key obligations, renewal timing, and the owner accountable for the next decision.",
    },
    load: {
      key: "load",
      title: "Load",
      question: "What evidence is needed to make the contract actionable?",
      guidance:
        "Load the executed agreement, SOWs or change orders, invoices, usage or performance records, scope inventory, and any approved benchmark or finance evidence.",
    },
    observe: {
      key: "observe",
      title: "Observe",
      question: "What should improve before the next review?",
      guidance:
        "Observe variance, service or usage trend, scope change, exceptions, owner actions, and whether a candidate value becomes approved or finance-confirmed.",
    },
  },
});

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function display(value: string | null | undefined): string {
  return value?.trim() || "not established";
}

/**
 * Render the benchmarking clause as the contract records it.
 *
 * The stored field is a value enum ("present", "present_with_annual_right",
 * "limited", "none", "absent", ...), so a truthiness check on it reports every
 * populated row as a clause the buyer holds — including the rows that say the
 * opposite. Report the recorded value instead of a flag, and reserve "not
 * established" for contracts that carry no value at all.
 */
const EVIDENCE_LABELS: Readonly<
  Partial<Record<keyof ContractEducationInput, string>>
> = {
  spendRows: "spend and usage rows",
  scopeRows: "scope rows",
  documentRows: "document rows",
  performanceRows: "performance rows",
  invoiceRows: "invoice rows",
  opportunityRows: "opportunity rows",
  changeOrderRows: "change-order rows",
};

function evidenceLabel(field: keyof ContractEducationInput): string {
  return EVIDENCE_LABELS[field] ?? String(field);
}

function describeBenchmarkingClause(value: string | null | undefined): string {
  const recorded = value?.trim();
  if (!recorded) return "Benchmarking clause not established";
  const spoken = recorded.replace(/[_-]+/g, " ").toLowerCase();
  return `Benchmarking clause ${spoken}`;
}

export function buildContractEducation(
  input: ContractEducationInput,
): ContractEducationView {
  const key = input.archetype?.trim()
    ? input.archetype.toLowerCase().replaceAll(" ", "_")
    : "unmapped";
  const selected =
    GUIDES.find((candidate) => candidate.match(key)) ?? FALLBACK_GUIDE;
  const steps = (
    Object.keys(selected.stepCopy) as ContractEducationStep["key"][]
  ).map((stepKey) => {
    const copy = selected.stepCopy[stepKey];
      const state: ContractEducationStep["state"] =
      stepKey === "track"
        ? positive(input.spendRows) || positive(input.performanceRows)
          ? "loaded"
          : "next"
        : stepKey === "load"
          ? positive(input.documentRows) || input.hasReviewedPurpose
            ? "loaded"
            : "next"
          : positive(input.spendRows) || positive(input.performanceRows)
            ? "loaded"
            : "next";
    const evidence =
      stepKey === "track"
        ? `${input.spendRows} spend/usage rows; ${input.performanceRows} performance rows`
        : stepKey === "load"
          ? `${input.documentRows} document rows; ${input.scopeRows} scope rows; ${input.invoiceRows} invoice rows`
          : `${input.opportunityRows} opportunity rows; ${input.changeOrderRows} change-order rows`;
    return { ...copy, state, evidence };
  });
  const missing = selected.requiredEvidence.filter((field) => {
    const value = input[field];
    return typeof value === "number" ? !positive(value) : !value;
  });
  const state: ContractEducationState =
    missing.length === 0
      ? "ready"
      : missing.length < selected.requiredEvidence.length
        ? "partial"
        : "blocked";
  const stateLabel =
    state === "ready"
      ? "Education basis loaded"
      : state === "partial"
        ? "Education basis is partial"
        : "Education starts with evidence mapping";
  const basis = [
    `${display(input.contractName)} · ${display(input.vendorName)}`,
    `${selected.archetypeLabel} guide selected from ${display(input.archetype)}`,
    `${input.scopeRows} scope · ${input.spendRows} spend/usage · ${input.performanceRows} performance · ${input.documentRows} document rows`,
    describeBenchmarkingClause(input.benchmarkingClause),
  ];
  return {
    archetypeKey: key || "unmapped",
    archetypeLabel: selected.archetypeLabel,
    headline: selected.headline,
    body: selected.body,
    state,
    stateLabel,
    steps,
    focus: selected.focus,
    basis,
    requiredEvidenceCount: selected.requiredEvidence.length,
    missingEvidence: missing.map(evidenceLabel),
    thresholds: selected.thresholds,
    facetRequirements: facetRequirementsForArchetype(key),
  };
}

/**
 * Reads the persisted Layer 3 education object. The fallback builder remains
 * useful for older read models, but new Contract 360 pages should prefer the
 * load-time record so the guide has the same version and provenance as the
 * contract anatomy and evidence story.
 */
export function contractEducationFromRecord(
  record: Record<string, unknown> | null | undefined,
): ContractEducationView | null {
  const sourceRecord = record ?? {};
  const education = sourceRecord.education;
  if (!isRecord(education)) return null;
  const contract = isRecord(sourceRecord.contract) ? sourceRecord.contract : {};
  const steps = (['track', 'load', 'observe'] as const).map((key) => {
    const raw = education[key];
    const step = isRecord(raw) ? raw : {};
    const state: ContractEducationStep["state"] =
      step.state === 'loaded' || step.state === 'not_required'
        ? step.state
        : 'next';
    return {
      key,
      title: key[0].toUpperCase() + key.slice(1),
      question: stringValue(step.question) ?? 'What evidence is needed next?',
      guidance: stringValue(step.guidance) ?? 'Load the governed evidence family for this archetype.',
      evidence: state === 'loaded' ? 'Loaded in the contract intelligence record.' : 'Next evidence action is required.',
      state,
    };
  });
  const review = isRecord(sourceRecord.review) ? sourceRecord.review : {};
  const recordState = stringValue(review.status);
  const reviewed = recordState === 'reviewed' || recordState === 'approved';
  /**
   * A step the archetype does not require is not an outstanding step. Counting
   * it as one is how a contract with nothing missing came to be described as
   * having a partial basis.
   */
  const applicableSteps = steps.filter((step) => step.state !== 'not_required');
  const outstandingSteps = applicableSteps.filter(
    (step) => step.state !== 'loaded',
  );
  const everyApplicableStepLoaded =
    applicableSteps.length > 0 && outstandingSteps.length === 0;
  const state: ContractEducationState = reviewed
    ? 'ready'
    : steps.some((step) => step.state === 'loaded')
      ? 'partial'
      : 'blocked';
  const archetypeLabel =
    stringValue(education.archetype_label) ??
    stringValue(contract.archetype_label) ??
    'Contract governance';
  const archetypeKey =
    stringValue(education.archetype_key) ??
    stringValue(contract.archetype_key) ??
    'unmapped';
  const facetRequirements = readFacetRequirements(
    education.facet_requirements,
    archetypeKey,
  );
  const headline =
    stringValue(education.headline) ??
    'Build the evidence loop before changing the deal.';
  const body =
    stringValue(education.body) ??
    'Use the contract archetype to decide what to track, load, and observe.';
  return {
    archetypeKey,
    archetypeLabel,
    headline,
    body,
    state,
    /*
     * Name the thing that is actually incomplete. "Education basis is partial"
     * on a contract whose every applicable step is loaded blames the evidence
     * for what is really an unsigned review, and reads on screen as a gap the
     * team has to go and close.
     */
    stateLabel:
      state === 'ready'
        ? 'Education basis loaded'
        : state === 'blocked'
          ? 'Education starts with evidence mapping'
          : everyApplicableStepLoaded
            ? 'Evidence loaded · record not yet reviewed'
            : 'Education basis is partial',
    steps,
    focus: body,
    basis: [
      `${stringValue(contract.title) ?? 'Contract'} · ${stringValue(contract.vendor_name) ?? 'Vendor'}`,
      `${archetypeLabel} guide · load-time governed playbook`,
      'Archetype, industry context, evidence requirements, and provenance are linked in the same record',
    ],
    thresholds:
      GUIDES.find((candidate) => candidate.match(archetypeKey))?.thresholds ??
      FALLBACK_GUIDE.thresholds,
    requiredEvidenceCount: applicableSteps.length,
    missingEvidence: outstandingSteps.map(
      (step) => `${step.title.toLowerCase()} evidence`,
    ),
    facetRequirements,
  };
}

function readFacetRequirements(
  value: unknown,
  archetypeKey: string,
): Readonly<Record<ContractFacetKey, ContractFacetRequirement>> {
  const fallback = facetRequirementsForArchetype(archetypeKey);
  if (!isRecord(value)) return fallback;
  const result = { ...fallback };
  for (const key of Object.keys(fallback) as ContractFacetKey[]) {
    const raw = value[key];
    if (!isRecord(raw)) continue;
    const state =
      raw.state === "not_required"
        ? "not_required"
        : raw.state === "required"
          ? "required"
          : null;
    const reason = stringValue(raw.reason);
    if (state && reason) result[key] = { state, reason };
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
