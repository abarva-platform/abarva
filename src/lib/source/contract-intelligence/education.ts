export type ContractEducationState = "ready" | "partial" | "blocked";

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
  readonly hasBenchmarking: boolean;
}

type EducationGuide = Omit<
  ContractEducationView,
  "archetypeKey" | "state" | "stateLabel" | "steps" | "basis"
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
      "enterprise_agreement",
    ],
    archetypeLabel: "Software subscription",
    headline: "Manage entitlement, adoption, and renewal economics together.",
    body: "The commercial question is whether paid entitlement matches active use and whether the renewal preserves flexibility as adoption changes. Seats, usage, price terms, and renewal rights need one evidence trail.",
    focus:
      "Reduce shelfware and renewal surprise without confusing adoption signals with a savings outcome.",
    requiredEvidence: ["documentRows", "spendRows", "scopeRows"],
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
    input.hasBenchmarking
      ? "Benchmarking clause present"
      : "Benchmarking clause not established",
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
  };
}
