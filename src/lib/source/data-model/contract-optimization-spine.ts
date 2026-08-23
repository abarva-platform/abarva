import type {
  ContractOptimizationLedgerKind,
  ContractOptimizationLedgerLine,
  ContractOptimizationLedgerSummary,
} from "./contract-optimization-ledger";
import type { SourceContract360Row } from "./types";
import {
  computeRenewalExposure,
  computeVendorConcentration,
  numberFromDb,
  type ContractLeverageEntry,
} from "./vendor-contract-portfolio";

export type ContractOptimizationFitReasonKind =
  | "material_exposure"
  | "weak_leverage"
  | "decision_timing"
  | "commercial_variance"
  | "operational_pressure"
  | "enterprise_dependency"
  | "evidence_gap"
  | "value_proof";

export interface ContractOptimizationFitReason {
  readonly kind: ContractOptimizationFitReasonKind;
  readonly label: string;
  readonly detail: string;
  readonly sourceRef: string;
  readonly tone: "strong" | "warning" | "missing" | "neutral";
  readonly role: "action_trigger" | "supporting_context" | "evidence_gate";
  readonly points: number;
}

export interface ContractOptimizationCandidate {
  readonly contractId: string;
  readonly vendorRef: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly annualValue: number;
  readonly score: number;
  readonly rank: number;
  readonly band: string;
  readonly action: string;
  readonly reasons: readonly ContractOptimizationFitReason[];
}

export interface ContractOptimizationSourceConnection {
  readonly id: string;
  readonly sourceSystem: string;
  readonly examples: readonly string[];
  readonly extract: string;
  readonly evidenceClasses: readonly string[];
  readonly ledgers: readonly ContractOptimizationLedgerKind[];
  readonly fields: readonly string[];
  readonly outcome: string;
}

export interface ContractOptimizationSourcingRequirement {
  readonly lineId: string;
  readonly lineLabel: string;
  readonly nextAction: string;
  readonly connections: readonly ContractOptimizationSourceConnection[];
  readonly ask: string;
}

export interface ContractOptimizationSpine {
  readonly selected: ContractOptimizationCandidate | null;
  readonly candidates: readonly ContractOptimizationCandidate[];
  readonly topCandidates: readonly ContractOptimizationCandidate[];
  readonly sourceConnections: readonly ContractOptimizationSourceConnection[];
  readonly missingEvidenceSources: readonly ContractOptimizationSourcingRequirement[];
  readonly contractStory: readonly string[];
  readonly missingEvidenceStory: readonly string[];
}

const SOURCE_CONNECTIONS: readonly ContractOptimizationSourceConnection[] = [
  {
    id: "clm",
    sourceSystem: "CLM / contract repository",
    examples: [
      "Icertis",
      "Ironclad",
      "DocuSign CLM",
      "Agiloft",
      "Conga",
      "SharePoint contract library",
    ],
    extract:
      "Executed agreement, SOW, order forms, amendments, change orders, pricing schedules, renewal and termination clauses.",
    evidenceClasses: [
      "contract_term",
      "rate_card",
      "renewal",
      "change_order",
      "approved_agreement",
    ],
    ledgers: ["negotiated_improvement", "avoided_cost"],
    fields: [
      "contract_id",
      "document_id",
      "clause_type",
      "effective_date",
      "page/span",
      "review_state",
    ],
    outcome:
      "Proves rights, deadlines, pricing mechanics, benchmark rights, caps, and signed concessions.",
  },
  {
    id: "procurement",
    sourceSystem: "Procurement / S2P",
    examples: [
      "SAP Ariba",
      "Coupa",
      "Oracle Procurement",
      "Workday Strategic Sourcing",
      "Zip",
    ],
    extract:
      "POs, sourcing events, supplier responses, award summary, approved savings case.",
    evidenceClasses: [
      "supplier_offer",
      "benchmark",
      "scope",
      "approved_agreement",
    ],
    ledgers: ["negotiated_improvement", "avoided_cost"],
    fields: [
      "supplier_id",
      "event_id",
      "bid_round",
      "normalized_price",
      "award_state",
      "approver_role",
    ],
    outcome:
      "Turns leverage into a defendable negotiation plan rather than a generic price ask.",
  },
  {
    id: "ap_erp",
    sourceSystem: "AP / ERP / financial subledger",
    examples: [
      "SAP S/4HANA",
      "Oracle Fusion",
      "Workday Financials",
      "NetSuite",
      "Coupa Invoice",
    ],
    extract:
      "Invoice lines, payments, PO match, GL coding, credits, disputes, taxes, and pass-throughs.",
    evidenceClasses: ["invoice", "payment", "rate_card"],
    ledgers: ["recoverable_leakage", "avoided_cost"],
    fields: [
      "invoice_id",
      "line_id",
      "po_id",
      "service_period",
      "amount",
      "contract_id",
      "match_state",
    ],
    outcome:
      "Finds duplicate charges, off-contract billing, rate-card variance, and unclaimed credits.",
  },
  {
    id: "itsm",
    sourceSystem: "ITSM / service management",
    examples: [
      "ServiceNow",
      "Jira Service Management",
      "PagerDuty",
      "BMC Helix",
    ],
    extract:
      "SLA performance, incident severity, breach logs, service review packs, credit eligibility.",
    evidenceClasses: ["sla", "service_credit"],
    ledgers: ["recoverable_leakage"],
    fields: [
      "service_id",
      "period",
      "target",
      "actual",
      "breach_count",
      "credit_earned",
      "credit_claimed",
    ],
    outcome:
      "Quantifies service credits and separates operational pain from commercial recoverability.",
  },
  {
    id: "usage",
    sourceSystem: "Usage / entitlement / consumption platforms",
    examples: [
      "Salesforce admin",
      "Microsoft 365 admin",
      "Snowflake",
      "AWS CUR",
      "Azure Cost Management",
      "GCP Billing",
    ],
    extract:
      "Seats, active users, consumption, storage, workload, feature adoption, license assignment.",
    evidenceClasses: ["usage", "cloud_consumption", "scope"],
    ledgers: ["avoided_cost"],
    fields: [
      "product_id",
      "sku",
      "assigned_qty",
      "active_qty",
      "period",
      "usage_unit",
      "cost",
    ],
    outcome:
      "Separates shelfware, under-used entitlement, and real demand before negotiating renewal scope.",
  },
  {
    id: "finance_tower",
    sourceSystem: "Finance / FP&A / Tower value evidence",
    examples: [
      "Apptio",
      "Anaplan",
      "ERP GL",
      "FP&A forecast model",
      "AbarVa Tower",
    ],
    extract:
      "Baseline, target, actual, owner, attestation state, accepted value claim and caveats.",
    evidenceClasses: [
      "finance_value_confirmation",
      "workforce",
      "approved_agreement",
    ],
    ledgers: ["realized_value"],
    fields: [
      "claim_id",
      "metric_ref",
      "baseline",
      "actual",
      "currency",
      "claim_state",
      "approver_role",
    ],
    outcome:
      "Promotes value only after finance confirmation; everything else remains potential or workflow-required.",
  },
];

export const CONTRACT_OPTIMIZATION_SOURCE_CONNECTIONS = SOURCE_CONNECTIONS;

const SOURCE_CONNECTION_BY_ID = new Map(
  SOURCE_CONNECTIONS.map((connection) => [connection.id, connection]),
);

export function buildContractOptimizationSpine(input: {
  readonly contract: SourceContract360Row | null;
  readonly contracts: readonly SourceContract360Row[];
  readonly leverageEntries: readonly ContractLeverageEntry[];
  readonly ledger: ContractOptimizationLedgerSummary | null;
  readonly asOfDateIso: string;
}): ContractOptimizationSpine {
  const candidates = rankCandidates({
    contracts: input.contracts,
    leverageEntries: input.leverageEntries,
    asOfDateIso: input.asOfDateIso,
  });
  const selected = input.contract
    ? (candidates.find(
        (candidate) => candidate.contractId === input.contract?.contract_id,
      ) ?? null)
    : null;
  const missingEvidenceStory = missingEvidenceFor(input.ledger?.lines ?? []);

  return {
    selected,
    candidates: selected ? [] : candidates,
    topCandidates: candidates.slice(0, 5),
    sourceConnections: SOURCE_CONNECTIONS,
    missingEvidenceSources: sourcingRequirementsFor(input.ledger?.lines ?? []),
    contractStory: selected ? storyFor(selected, input.ledger) : [],
    missingEvidenceStory,
  };
}

function rankCandidates(input: {
  readonly contracts: readonly SourceContract360Row[];
  readonly leverageEntries: readonly ContractLeverageEntry[];
  readonly asOfDateIso: string;
}): readonly ContractOptimizationCandidate[] {
  const leverageByContract = new Map(
    input.leverageEntries.map((entry) => [entry.contractId, entry]),
  );
  const concentration = computeVendorConcentration(input.contracts);
  const topVendorRefs = new Set(
    concentration.byVendor.slice(0, 5).map((vendor) => vendor.vendorRef),
  );
  const renewal = computeRenewalExposure(
    input.contracts,
    input.asOfDateIso,
    180,
  );
  const noticePassed = new Set(
    renewal.noticeDeadlinePassed.map((row) => row.contract_id),
  );
  const expiring180 = new Set(
    renewal.expiringWithinWindow.map((row) => row.contract_id),
  );

  const ranked = input.contracts
    .map((contract) => {
      const leverage = leverageByContract.get(contract.contract_id) ?? null;
      return scoreContract({
        contract,
        leverage,
        topVendorRefs,
        noticePassed,
        expiring180,
      });
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.annualValue - a.annualValue;
    });

  return ranked.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function scoreContract(input: {
  readonly contract: SourceContract360Row;
  readonly leverage: ContractLeverageEntry | null;
  readonly topVendorRefs: ReadonlySet<string>;
  readonly noticePassed: ReadonlySet<string>;
  readonly expiring180: ReadonlySet<string>;
}): ContractOptimizationCandidate {
  const { contract, leverage } = input;
  const annualValue = numberFromDb(contract.annual_value) ?? 0;
  const actualSpend = numberFromDb(contract.actual_annual_spend);
  const annualVariance = actualSpend == null ? null : annualValue - actualSpend;
  const reasons: ContractOptimizationFitReason[] = [];

  if (
    annualValue >= 25_000_000 ||
    input.topVendorRefs.has(contract.vendor_ref)
  ) {
    reasons.push({
      kind: "material_exposure",
      label: "Material commercial exposure",
      detail: input.topVendorRefs.has(contract.vendor_ref)
        ? `${contract.vendor_name} is in the top vendor concentration set and this contract carries ${formatUsd(annualValue)} annual value.`
        : `This contract carries ${formatUsd(annualValue)} annual value, large enough to justify sourcing attention.`,
      sourceRef:
        "source.contract_360.annual_value + computeVendorConcentration(source.contract_360)",
      tone: "strong",
      role: "supporting_context",
      points: annualValue >= 25_000_000 ? 22 : 14,
    });
  }

  if (leverage && leverage.weakSignalCount > 0) {
    reasons.push({
      kind: "weak_leverage",
      label: `${leverage.weakSignalCount} weak leverage signal${leverage.weakSignalCount === 1 ? "" : "s"}`,
      detail: weakSignalDetail(leverage),
      sourceRef: "computeContractLeverageSignals(source.contract_360)",
      tone: leverage.weakSignalCount >= 2 ? "warning" : "neutral",
      role: "action_trigger",
      points: Math.min(30, leverage.weakSignalCount * 9),
    });
  }

  if (
    input.noticePassed.has(contract.contract_id) ||
    input.expiring180.has(contract.contract_id)
  ) {
    reasons.push({
      kind: "decision_timing",
      label: input.noticePassed.has(contract.contract_id)
        ? "Notice decision is already late"
        : "Renewal decision window is active",
      detail: input.noticePassed.has(contract.contract_id)
        ? "The notice deadline has passed while the contract remains active; remediation options narrow quickly."
        : "The contract is inside the 180-day renewal window and should not wait for ad hoc analysis.",
      sourceRef: "computeRenewalExposure(source.contract_360, as_of_date)",
      tone: input.noticePassed.has(contract.contract_id) ? "warning" : "strong",
      role: "action_trigger",
      points: input.noticePassed.has(contract.contract_id) ? 20 : 14,
    });
  }

  if (
    annualVariance != null &&
    Math.abs(annualVariance) >= Math.max(1_000_000, annualValue * 0.05)
  ) {
    reasons.push({
      kind: "commercial_variance",
      label: "Contracted-to-actual variance is visible",
      detail: `${formatUsd(annualVariance)} variance is visible, but Source does not treat it as value until entitlement, invoice, and usage evidence classify the cause.`,
      sourceRef:
        "source.contract_360.annual_value + source.contract_360.actual_annual_spend",
      tone: "neutral",
      role: "evidence_gate",
      points: 10,
    });
  }

  const incidents = numberFromDb(contract.cloud_sev1_sev2_incidents);
  if (incidents != null && incidents > 0) {
    reasons.push({
      kind: "operational_pressure",
      label: "Operational pressure is linked",
      detail: `${Math.round(incidents).toLocaleString("en-US")} Sev1/Sev2 incident observations are linked to the contract context.`,
      sourceRef: "source.contract_360.cloud_sev1_sev2_incidents",
      tone: "warning",
      role: "evidence_gate",
      points: incidents >= 100 ? 10 : 6,
    });
  }

  const criticalApps = numberFromDb(contract.critical_application_count);
  const initiativeDependencies = numberFromDb(
    contract.initiative_dependency_count,
  );
  if ((criticalApps ?? 0) > 0 || (initiativeDependencies ?? 0) > 0) {
    reasons.push({
      kind: "enterprise_dependency",
      label: "Enterprise dependency is visible",
      detail: `${criticalApps ?? 0} critical application(s) and ${initiativeDependencies ?? 0} initiative dependency row(s) are linked.`,
      sourceRef:
        "source.contract_application_scope + source.contract_initiative_dependency",
      tone: "strong",
      role: "supporting_context",
      points: 8,
    });
  }

  const score = Math.min(
    100,
    reasons.reduce((total, reason) => total + reason.points, 0),
  );
  return {
    contractId: contract.contract_id,
    vendorRef: contract.vendor_ref,
    vendorName: contract.vendor_name,
    contractName: contract.contract_name,
    annualValue,
    score,
    rank: 0,
    band:
      score >= 70
        ? "Prime optimization candidate"
        : score >= 45
          ? "Workable optimization candidate"
          : score >= 25
            ? "Monitor and enrich evidence"
            : "Not a priority yet",
    action: actionFor(score, reasons),
    reasons,
  };
}

function actionFor(
  score: number,
  reasons: readonly ContractOptimizationFitReason[],
): string {
  if (
    reasons.some(
      (reason) =>
        reason.kind === "decision_timing" && reason.tone === "warning",
    )
  ) {
    return "Stabilize decision rights, then run contract optimization with minimum evidence.";
  }
  if (score >= 70)
    return "Start contract optimization now: baseline, leakage diagnosis, levers, approval, and finance value confirmation.";
  if (score >= 45)
    return "Open contract optimization after loading the missing evidence pack.";
  if (score >= 25)
    return "Keep on the sourcing agenda and enrich evidence before negotiation.";
  return "Monitor; no current optimization case is established.";
}

function storyFor(
  selected: ContractOptimizationCandidate,
  ledger: ContractOptimizationLedgerSummary | null,
): readonly string[] {
  const triggerDetails = selected.reasons
    .filter((reason) => reason.role === "action_trigger")
    .map((reason) => reason.detail);
  const supportDetails = selected.reasons
    .filter((reason) => reason.role !== "action_trigger")
    .slice(0, 3)
    .map((reason) => reason.detail);
  const ledgerLine = ledger
    ? ledger.headline
    : "Four-ledger value remains unavailable until contract, invoice, usage, SLA, and finance evidence are mapped.";
  return [
    `${selected.vendorName} ranks #${selected.rank} because it combines ${formatUsd(selected.annualValue)} annual exposure with ${triggerDetails.length} action trigger(s) and ${supportDetails.length} supporting context signal(s).`,
    ...triggerDetails,
    ...supportDetails,
    ledgerLine,
  ];
}

function missingEvidenceFor(
  lines: readonly ContractOptimizationLedgerLine[],
): readonly string[] {
  return lines
    .filter((line) => line.state === "needs_evidence")
    .map((line) => `${line.label}: ${line.nextAction}`);
}

function sourcingRequirementsFor(
  lines: readonly ContractOptimizationLedgerLine[],
): readonly ContractOptimizationSourcingRequirement[] {
  return lines
    .filter(
      (line) =>
        line.evidenceClass === "missing" || line.state === "needs_evidence",
    )
    .map((line) => {
      const connectionIds = sourceConnectionIdsFor(line);
      const connections = connectionIds
        .map((id) => SOURCE_CONNECTION_BY_ID.get(id))
        .filter(
          (connection): connection is ContractOptimizationSourceConnection =>
            Boolean(connection),
        );
      return {
        lineId: line.id,
        lineLabel: line.label,
        nextAction: line.nextAction,
        connections,
        ask: askFor(line, connections),
      };
    })
    .filter((requirement) => requirement.connections.length > 0);
}

function sourceConnectionIdsFor(
  line: ContractOptimizationLedgerLine,
): readonly string[] {
  if (
    line.id.includes("sla") ||
    line.sourceRefs.some((ref) => ref.includes("service_credit"))
  ) {
    return ["itsm", "clm"];
  }
  if (
    line.id.includes("invoice") ||
    line.id.includes("rate") ||
    line.sourceRefs.some(
      (ref) => ref.includes("invoice") || ref.includes("rate_card"),
    )
  ) {
    return ["ap_erp", "clm"];
  }
  if (line.kind === "avoided_cost") {
    return ["usage", "clm", "procurement"];
  }
  if (line.kind === "negotiated_improvement") {
    return ["procurement", "clm"];
  }
  if (line.kind === "realized_value") {
    return ["finance_tower"];
  }
  return [];
}

function askFor(
  line: ContractOptimizationLedgerLine,
  connections: readonly ContractOptimizationSourceConnection[],
): string {
  const fields = Array.from(
    new Set(connections.flatMap((connection) => connection.fields)),
  ).slice(0, 8);
  if (line.kind === "recoverable_leakage") {
    return `Ask for ${connections.map((connection) => connection.sourceSystem).join(" plus ")} extracts covering ${fields.join(", ")}.`;
  }
  if (line.kind === "realized_value") {
    return "Ask Finance/Tower for the approved claim record, baseline, actuals, cadence, owner role, and attestation state.";
  }
  return `Ask for ${connections.map((connection) => connection.sourceSystem).join(" plus ")} extracts so contract optimization can classify this line before assigning value.`;
}

function weakSignalDetail(leverage: ContractLeverageEntry): string {
  const labels = Object.entries(leverage.weakSignals)
    .filter(([, value]) => value)
    .map(([key]) => key.replace(/_/g, " "));
  return labels.length
    ? `Weak signals: ${labels.join(", ")}.`
    : "No weak-signal labels were returned.";
}

function formatUsd(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}
