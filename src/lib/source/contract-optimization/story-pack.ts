import {
  SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT,
  validateCxoStoryContract,
  type CxoBusinessImpactCategory,
  type CxoStoryContractValidation,
} from "@/lib/artifacts/cxo-storytelling-contract";
import type {
  ContractOptimizationFinding,
  ContractOptimizationLever,
  ContractOptimizationMveProfile,
} from "./types";
import { computeContractOptimizationExposureRollup } from "./exposure";

export type ContractOptimizationOpportunityQuadrant =
  | "Recover cash"
  | "Reduce future spend"
  | "Reduce operational risk"
  | "Increase vendor accountability";

export interface ContractOptimizationStoryItem {
  title: string;
  summary: string;
  findingIds: string[];
  leverIds: string[];
  businessImpact: CxoBusinessImpactCategory[];
}

export interface ContractOptimizationTimelineStep {
  label: string;
  timing: string;
  decision: string;
  ownerRole: string;
}

export interface ContractOptimizationNegotiationTheme {
  theme: string;
  buyerAsk: string;
  evidenceBasis: string;
  businessImpact: CxoBusinessImpactCategory[];
}

export interface ContractOptimizationScenario {
  path: "do_nothing" | "renegotiate";
  title: string;
  outcome: string;
  commercialEffect: string;
  riskEffect: string;
}

export interface ContractOptimizationStoryPack {
  executiveMessage: string[];
  decisionAsk: string;
  valueLeakageTree: string[];
  whyItIsHappening: string;
  opportunityMap: Array<{
    quadrant: ContractOptimizationOpportunityQuadrant;
    items: ContractOptimizationStoryItem[];
  }>;
  actionTimeline: ContractOptimizationTimelineStep[];
  negotiationThemes: ContractOptimizationNegotiationTheme[];
  scenarios: ContractOptimizationScenario[];
  businessImpactScorecard: Array<{
    category: CxoBusinessImpactCategory;
    implication: string;
    evidenceBasis: string;
  }>;
  validation: CxoStoryContractValidation;
}

const formatMoney = (value: number | null): string => {
  if (!value || !Number.isFinite(value)) return "value to be quantified";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
};

const impactRange = (lever: ContractOptimizationLever): string => {
  if (!lever.annualImpactLowUsd && !lever.annualImpactHighUsd) {
    return "value to be quantified during vendor cure review";
  }
  if (!lever.annualImpactLowUsd)
    return `up to ${formatMoney(lever.annualImpactHighUsd)}`;
  if (!lever.annualImpactHighUsd)
    return `at least ${formatMoney(lever.annualImpactLowUsd)}`;
  return `${formatMoney(lever.annualImpactLowUsd)} to ${formatMoney(lever.annualImpactHighUsd)}`;
};

function findLever(
  profile: ContractOptimizationMveProfile,
  leverType: ContractOptimizationLever["leverType"],
): ContractOptimizationLever | undefined {
  return profile.levers.find((lever) => lever.leverType === leverType);
}

function findFinding(
  profile: ContractOptimizationMveProfile,
  category: ContractOptimizationFinding["category"],
): ContractOptimizationFinding | undefined {
  return profile.findings.find((finding) => finding.category === category);
}

function storyItem(args: {
  title: string;
  summary: string;
  finding?: ContractOptimizationFinding;
  lever?: ContractOptimizationLever;
  businessImpact: CxoBusinessImpactCategory[];
}): ContractOptimizationStoryItem {
  return {
    title: args.title,
    summary: args.summary,
    findingIds: args.finding ? [args.finding.findingId] : [],
    leverIds: args.lever ? [args.lever.leverId] : [],
    businessImpact: args.businessImpact,
  };
}

export function buildContractOptimizationStoryPack(
  profile: ContractOptimizationMveProfile,
): ContractOptimizationStoryPack {
  const exposure = computeContractOptimizationExposureRollup(profile);
  const invoiceFinding = findFinding(profile, "price_leakage");
  const staffingFinding = findFinding(profile, "staffing_coverage_gap");
  const changeOrderFinding = findFinding(
    profile,
    "scope_change_order_exposure",
  );
  const slaFinding = findFinding(profile, "sla_credit_leakage");
  const operationalFinding = findFinding(profile, "service_performance_risk");
  const renewalFinding = findFinding(profile, "renewal_window");

  const invoiceLever = findLever(profile, "recover_invoice_leakage");
  const staffingLever = findLever(profile, "reprice_staffing_coverage");
  const changeOrderLever = findLever(
    profile,
    "convert_change_orders_to_catalog",
  );
  const slaLever = findLever(profile, "tighten_service_credit_economics");
  const productivityLever = findLever(profile, "force_productivity_commitment");
  const renewalLever = findLever(profile, "use_renewal_window");

  const executiveMessage = [
    `${profile.contractName} should not be renewed under its current commercial baseline.`,
    `Source identified ${exposure.label} driven primarily by invoice variance, staffing gaps, recurring change-order normalization, weak SLA economics, and operational pressure.`,
    "The recommended path is to issue a cure notice immediately, renegotiate under defined commercial conditions, and preserve competitive leverage through a prepared RFP fallback.",
  ];

  const opportunityMap: ContractOptimizationStoryPack["opportunityMap"] = [
    {
      quadrant: "Recover cash",
      items: [
        storyItem({
          title: "Recover unsupported invoice variance",
          summary: invoiceLever
            ? `${impactRange(invoiceLever)} tied to invoice variance and baseline normalization.`
            : "Invoice variance should be reconciled before renewal pricing.",
          finding: invoiceFinding,
          lever: invoiceLever,
          businessImpact: ["cost", "compliance"],
        }),
        storyItem({
          title: "Normalize recurring change orders",
          summary: changeOrderLever
            ? `${impactRange(changeOrderLever)} tied to recurring change-order and catalog leakage.`
            : "Recurring change-order spend should not silently become the renewal run rate.",
          finding: changeOrderFinding,
          lever: changeOrderLever,
          businessImpact: ["cost", "risk"],
        }),
      ],
    },
    {
      quadrant: "Reduce future spend",
      items: [
        storyItem({
          title: "Make productivity measurable and priced back",
          summary:
            "Operational demand growth should convert into a measured automation glidepath, not a higher unmanaged baseline.",
          finding: operationalFinding,
          lever: productivityLever,
          businessImpact: ["cost", "speed"],
        }),
      ],
    },
    {
      quadrant: "Reduce operational risk",
      items: [
        storyItem({
          title: "True up staffing coverage",
          summary: staffingLever
            ? `${impactRange(staffingLever)} tied to underfilled or unverified tower coverage.`
            : "Staffing commitments need monthly reconciliation before renewal approval.",
          finding: staffingFinding,
          lever: staffingLever,
          businessImpact: ["risk", "customer", "speed"],
        }),
        storyItem({
          title: "Reset contract to current operating demand",
          summary:
            "Ticket, reopen, and emergency-change pressure shows the contract model no longer reflects run reality.",
          finding: operationalFinding,
          lever: productivityLever,
          businessImpact: ["risk", "speed", "customer"],
        }),
      ],
    },
    {
      quadrant: "Increase vendor accountability",
      items: [
        storyItem({
          title: "Strengthen SLA economics",
          summary:
            "Service credits and chronic-miss language should match the operational criticality of the services in scope.",
          finding: slaFinding,
          lever: slaLever,
          businessImpact: ["risk", "customer", "compliance"],
        }),
        storyItem({
          title: "Use renewal timing as leverage",
          summary:
            "The renewal notice window should preserve optionality until commercial, SLA, staffing, and invoice-cure items close.",
          finding: renewalFinding,
          lever: renewalLever,
          businessImpact: ["cost", "risk", "compliance"],
        }),
      ],
    },
  ];

  const negotiationThemes: ContractOptimizationNegotiationTheme[] = [
    {
      theme: "Commercial recovery",
      buyerAsk:
        invoiceLever?.buyerAsk ??
        "Recover unsupported invoices and lock a normalized run-rate baseline.",
      evidenceBasis: invoiceFinding?.title ?? "Invoice baseline evidence",
      businessImpact: ["cost", "compliance"],
    },
    {
      theme: "Service accountability",
      buyerAsk:
        slaLever?.buyerAsk ??
        "Increase SLA remedies and chronic-miss escalation for critical towers.",
      evidenceBasis:
        slaFinding?.title ?? "SLA exhibit and service performance evidence",
      businessImpact: ["risk", "customer"],
    },
    {
      theme: "Operating model",
      buyerAsk:
        staffingLever?.buyerAsk ??
        "Reconcile committed staffing, observed coverage, and tower-level ownership.",
      evidenceBasis:
        staffingFinding?.title ?? "Staffing roster and coverage evidence",
      businessImpact: ["risk", "speed"],
    },
    {
      theme: "Future cost reduction",
      buyerAsk:
        productivityLever?.buyerAsk ??
        "Convert operating pressure into a priced automation and productivity glidepath.",
      evidenceBasis:
        operationalFinding?.title ?? "Operational baseline evidence",
      businessImpact: ["cost", "speed"],
    },
    {
      theme: "Competitive pressure",
      buyerAsk:
        renewalLever?.buyerAsk ??
        "Preserve RFP fallback authority until cure items close.",
      evidenceBasis: renewalFinding?.title ?? "Renewal notice evidence",
      businessImpact: ["cost", "risk", "compliance"],
    },
  ];

  const businessImpactScorecard: ContractOptimizationStoryPack["businessImpactScorecard"] =
    [
      {
        category: "cost",
        implication:
          "Recoverable leakage and normalized baseline economics drive the immediate value case.",
        evidenceBasis: exposure.label,
      },
      {
        category: "risk",
        implication:
          "Weak remedies, staffing gaps, and unresolved change-order treatment keep operational risk with the buyer.",
        evidenceBasis:
          "SLA, staffing, change-order, and operational baseline evidence",
      },
      {
        category: "speed",
        implication:
          "A cure-first path is faster than a full rebid, but only if the vendor supplies reconciliation evidence before the renewal window decays.",
        evidenceBasis: profile.contractBaseline.renewalNoticeDate,
      },
      {
        category: "customer",
        implication:
          "Ticket, reopen, restore, and emergency-change pressure can affect business-service reliability if not tied to stronger accountability.",
        evidenceBasis:
          operationalFinding?.title ?? "Operational pressure evidence",
      },
      {
        category: "compliance",
        implication:
          "Reservation-of-rights, approval evidence, and governance sign-off protect the buyer from accepting unsupported baseline cost.",
        evidenceBasis:
          "Governance minutes, renewal rights, and approval evidence",
      },
      {
        category: "compliance",
        implication:
          "The renewal steering committee needs a named decision gate before any renewal baseline becomes binding.",
        evidenceBasis: profile.recommendedPath.decisionOwnerRole,
      },
    ];

  const validation = validateCxoStoryContract({
    contract: SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT,
    storyElements: [
      "executive_message",
      "so_what",
      "where_value_is_moving",
      "why_it_happened",
      "what_should_happen",
      "options_and_tradeoffs",
      "commercial_opportunity_map",
      "if_we_do_nothing",
      "business_impact",
      "evidence_and_caveats",
    ],
    businessImpacts: businessImpactScorecard.map((row) => row.category),
    exhibits: [
      "decision_card",
      "value_tree",
      "exposure_bridge",
      "trend_chart",
      "root_cause_map",
      "timeline",
      "opportunity_map",
      "scenario_comparison",
      "business_impact_scorecard",
      "evidence_gap_matrix",
    ],
    promptPacketKeys: [
      "executiveMessage",
      "decisionAsk",
      "storySpine",
      "visualExhibits",
      "businessImpact",
      "evidenceBasis",
      "knownGaps",
      "forbiddenClaims",
    ],
  });

  return {
    executiveMessage,
    decisionAsk:
      "Approve cure notice and renegotiation path while preserving competitive fallback authority.",
    valueLeakageTree: [
      "Invoice variance",
      "Recurring change orders",
      "Weak SLA credits",
      "Underfilled staffing",
      "Productivity not priced back",
    ],
    whyItIsHappening:
      "The contract commercial model no longer reflects today’s operating reality: run volumes are above baseline, staffing is not fully reconciled, service accountability is underpowered, and recurring exceptions are being treated like ordinary run cost.",
    opportunityMap,
    actionTimeline: [
      {
        label: "Issue cure notice",
        timing: "Now",
        decision: profile.recommendedPath.immediateAction,
        ownerRole: "Procurement / legal / IT service owner",
      },
      {
        label: "Commercial reconciliation",
        timing: "Next 2-4 weeks",
        decision:
          "Classify every variance as approved demand, recoverable leakage, pass-through, or catalog item.",
        ownerRole: "Procurement commercial lead / finance controller",
      },
      {
        label: "Vendor response",
        timing: "Before renewal baseline is accepted",
        decision:
          "Require evidence-backed cure plan covering invoices, staffing, SLA remedies, change orders, and productivity.",
        ownerRole: "Vendor management lead",
      },
      {
        label: "Executive decision",
        timing: `Before ${profile.contractBaseline.renewalNoticeDate}`,
        decision:
          "Renew with cure commitments, renegotiate with holdbacks, or launch the competitive event.",
        ownerRole: profile.recommendedPath.decisionOwnerRole,
      },
    ],
    negotiationThemes,
    scenarios: [
      {
        path: "do_nothing",
        title: "If the buyer renews as-is",
        outcome:
          "The current baseline becomes the commercial anchor for the next term.",
        commercialEffect:
          "Exposure persists, recurring change orders can normalize into run cost, and productivity remains unpriced.",
        riskEffect:
          "Weak remedies and staffing uncertainty continue without a hard cure gate.",
      },
      {
        path: "renegotiate",
        title: "If the buyer cures and renegotiates",
        outcome:
          "Renewal approval becomes conditional on evidence-backed commercial and operating commitments.",
        commercialEffect:
          "Recoverable leakage is challenged, baseline cost is normalized, and future productivity has a measurable glidepath.",
        riskEffect:
          "SLA, staffing, and change-order accountability are reset before the buyer gives up competitive leverage.",
      },
    ],
    businessImpactScorecard,
    validation,
  };
}

export function contractOptimizationStoryPromptPacket(
  profile: ContractOptimizationMveProfile,
) {
  const storyPack = buildContractOptimizationStoryPack(profile);
  return {
    executiveMessage: storyPack.executiveMessage,
    decisionAsk: storyPack.decisionAsk,
    storySpine: {
      valueLeakageTree: storyPack.valueLeakageTree,
      whyItIsHappening: storyPack.whyItIsHappening,
      actionTimeline: storyPack.actionTimeline,
      scenarios: storyPack.scenarios,
    },
    visualExhibits: {
      opportunityMap: storyPack.opportunityMap,
      exposureDrivers: profile.visualInsights.exposureByDriver,
      invoiceTrend: profile.visualInsights.invoiceVarianceTrend,
      operationalPressure: profile.visualInsights.operationalPressure,
      staffingCoverage: profile.visualInsights.staffingCoverage,
    },
    businessImpact: storyPack.businessImpactScorecard,
    evidenceBasis: profile.minimumViableExtractionAreas,
    knownGaps: profile.clientToComplete,
    forbiddenClaims: [
      "Do not invent savings beyond the evidenced exposure range.",
      "Do not convert opportunity-to-test items into committed savings.",
      "Do not imply a final renewal decision without steering committee approval.",
      "Do not present synthetic demo evidence as a real client contract.",
    ],
  };
}
