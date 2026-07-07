import type {
  ContractOptimizationAnalytics,
  SourceExecutiveStoryPayload,
  VendorEvaluationResult,
} from "./types";

export function buildSourceExecutiveStoryPayload(args: {
  contractAnalytics?: ContractOptimizationAnalytics;
  vendorResults?: VendorEvaluationResult[];
}): SourceExecutiveStoryPayload {
  const contract = args.contractAnalytics;
  const topVendor = args.vendorResults?.slice().sort((a, b) => a.rank - b.rank)[0];
  const evidenceCaveats = contract
    ? [
        ...contract.readiness.cannotQuantify.map(
          (item) => `Cannot quantify ${item} until required evidence is loaded.`,
        ),
        ...contract.readiness.assumptions,
      ]
    : [];

  return {
    executiveMessage: contract
      ? [
          "Do not renew the incumbent agreement as-is.",
          `Identified exposure is ${contract.exposureLabel}.`,
          "Issue cure notice, renegotiate with defined commercial conditions, and preserve competitive fallback authority.",
        ]
      : [
          topVendor
            ? `${topVendor.vendorName} is the risk-adjusted lead based on the deterministic scorecard.`
            : "Source has not yet calculated a sourcing recommendation.",
          "Use BAFO to cure unsupported claims, commercial gaps, and service-accountability risks.",
          "Do not make a final award recommendation until unresolved conditions are closed or explicitly accepted.",
        ],
    decisionRequired: contract
      ? "Approve cure notice and renegotiation path while preserving RFP fallback."
      : "Approve BAFO conditions and finalist posture before award recommendation.",
    commercialOpportunityMap: [
      {
        theme: "recover_cash",
        label: "Recover cash",
        findings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("cost"))
          .map((finding) => finding.title) ?? ["Pricing and commercial gaps"],
        action: "Recover unsupported charges and normalize the commercial baseline.",
      },
      {
        theme: "reduce_future_spend",
        label: "Reduce future spend",
        findings: ["Productivity and catalog pricing"],
        action: "Convert vendor claims into measurable price-down commitments.",
      },
      {
        theme: "reduce_risk",
        label: "Reduce operational risk",
        findings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("risk"))
          .map((finding) => finding.title) ?? ["Transition and service risks"],
        action: "Tighten service, transition, and governance controls before commitment.",
      },
      {
        theme: "increase_vendor_accountability",
        label: "Increase vendor accountability",
        findings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("vendor_accountability"))
          .map((finding) => finding.title) ?? ["Unsupported claims"],
        action: "Tie claims to evidence, commercial terms, and score movement.",
      },
    ],
    exposureDrivers: contract?.exposureDrivers ?? [],
    doNothingScenario: contract?.doNothingScenario ?? [
      "Unsupported claims remain in the vendor story.",
      "BAFO leverage weakens because conditions are not quantified.",
      "Final award recommendation becomes harder to defend.",
    ],
    decisionTimeline: [
      {
        step: "Confirm evidence boundary",
        timing: "Now",
        decisionOwner: "Sourcing lead",
        exitCriteria: "Known facts, assumptions, and missing evidence are named.",
      },
      {
        step: contract ? "Issue cure notice" : "Issue BAFO instructions",
        timing: "Next",
        decisionOwner: "CPO / CIO",
        exitCriteria: "Vendor receives specific conditions and response requirements.",
      },
      {
        step: "Executive decision",
        timing: "After vendor response",
        decisionOwner: "CIO / CFO / CPO",
        exitCriteria: "Scores, risks, and commercial commitments are updated.",
      },
    ],
    businessImpactMapping: [
      {
        impact: "cost",
        readout: "Commercial leakage and pricing comparability determine value capture.",
        linkedFindings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("cost"))
          .map((finding) => finding.title) ?? [],
      },
      {
        impact: "risk",
        readout: "Service, transition, and evidence gaps determine execution risk.",
        linkedFindings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("risk"))
          .map((finding) => finding.title) ?? [],
      },
      {
        impact: "vendor_accountability",
        readout: "Claims must become measurable commitments before final decision.",
        linkedFindings: contract?.findings
          .filter((finding) => finding.businessImpact.includes("vendor_accountability"))
          .map((finding) => finding.title) ?? [],
      },
    ],
    evidenceCaveats,
    recommendedNextActions: contract?.recommendedPath ?? [
      "Run BAFO against the top vendor conditions.",
      "Update deterministic scores after cure responses.",
      "Keep every finalist in view until the scorecard proves otherwise.",
    ],
    suggestedAvaAnswerFrame: {
      directAnswer: contract
        ? "Do not renew as-is; renegotiate with cure conditions and preserve fallback."
        : "Advance only the vendors whose BAFO responses cure the scored conditions.",
      evidence: contract?.findings.map((finding) => finding.title) ?? [],
      implication: contract
        ? "The current commercial model does not reflect loaded operating evidence."
        : "The ranking is defensible only when the scorecard and evidence boundary stay explicit.",
      action: contract
        ? "Approve cure notice and commercial reconciliation."
        : "Approve BAFO asks and update the weighted scorecard after responses.",
    },
  };
}
