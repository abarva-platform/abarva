import type {
  ContractOptimizationFinding,
  ContractOptimizationInput,
  ContractOptimizationLever,
  ContractOptimizationMveProfile,
} from "./types";

const money = (value: number): string =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const evidenceLabel = (
  input: ContractOptimizationInput,
  evidenceId: string,
): string => {
  const ref = input.evidenceRefs.find((evidence) => evidence.evidenceId === evidenceId);
  return ref ? `${ref.title} (${ref.reference})` : evidenceId;
};

function invoiceLeakage(input: ContractOptimizationInput): ContractOptimizationFinding | null {
  const leakage = input.invoiceLines.reduce(
    (sum, line) => sum + Math.max(0, line.invoicedAmountUsd - line.contractedAmountUsd),
    0,
  );
  if (leakage <= 0) return null;
  const annualized = leakage * (12 / Math.max(1, input.invoiceLines.length));
  return {
    findingId: "F-PRICE-LEAKAGE",
    category: "price_leakage",
    title: "Invoices are running above contracted baseline",
    evidenceLabels: [...new Set(input.invoiceLines.map((line) => evidenceLabel(input, line.evidenceId)))],
    severity: annualized > input.currentAnnualRunRateUsd * 0.04 ? "high" : "medium",
    currentState: `${money(leakage)} of above-baseline invoice variance appears in the sampled months; annualized exposure is about ${money(annualized)}.`,
    sourcingImplication:
      "The incumbent commercial baseline cannot be treated as clean until pass-throughs, demand changes, and out-of-catalog charges are reconciled.",
    recommendedAction:
      "Create a recovery and normalization schedule before renewal pricing; require vendor to classify every variance as approved demand, recoverable leakage, or future catalog item.",
    estimatedAnnualImpactUsd: Math.round(annualized),
    confidence: "high",
  };
}

function slaLeakage(input: ContractOptimizationInput): ContractOptimizationFinding | null {
  const weak = input.slas.filter((sla) =>
    /miss|below|not met|missed/i.test(sla.actual) ||
    /cap.*[0-4]%|4%|3%|2%|1%/i.test(sla.creditCap) ||
    /none|silent|not defined/i.test(sla.chronicMissLanguage),
  );
  if (!weak.length) return null;
  return {
    findingId: "F-SLA-CREDIT",
    category: "sla_credit_leakage",
    title: "Service credits do not match operational criticality",
    evidenceLabels: [...new Set(weak.map((sla) => evidenceLabel(input, sla.evidenceId)))],
    severity: "high",
    currentState: `${weak.length} SLA commitment(s) show missed/weak performance economics or insufficient chronic-miss language.`,
    sourcingImplication:
      "The buyer has operational risk without proportionate contractual remedy, which weakens renewal leverage and service accountability.",
    recommendedAction:
      "Tighten service-credit caps, add chronic-miss escalators, restrict earn-back, and link credits to airline-critical towers.",
    estimatedAnnualImpactUsd: null,
    confidence: "high",
  };
}

function staffingGap(input: ContractOptimizationInput): ContractOptimizationFinding | null {
  const gaps = input.staffingCommitments.filter(
    (row) => row.observedFte < row.committedFte || /unverified|gap|partial/i.test(row.coverage),
  );
  if (!gaps.length) return null;
  const missingFte = gaps.reduce((sum, row) => sum + Math.max(0, row.committedFte - row.observedFte), 0);
  const impact = missingFte > 0 ? missingFte * 185_000 : null;
  return {
    findingId: "F-STAFFING-COVERAGE",
    category: "staffing_coverage_gap",
    title: "Committed staffing and observed coverage do not fully reconcile",
    evidenceLabels: [...new Set(gaps.map((row) => evidenceLabel(input, row.evidenceId)))],
    severity: missingFte >= 8 ? "high" : "medium",
    currentState: `${missingFte.toFixed(1)} committed FTE equivalent(s) are not visible in observed staffing or shift coverage.`,
    sourcingImplication:
      "Service quality and pricing are not comparable unless staffing gaps are either cured, credited, or removed from the retained baseline.",
    recommendedAction:
      "Require a monthly staffing true-up, named shift coverage, and service-credit linkage for underfilled critical roles.",
    estimatedAnnualImpactUsd: impact ? Math.round(impact) : null,
    confidence: "medium",
  };
}

function operationalRisk(input: ContractOptimizationInput): ContractOptimizationFinding | null {
  const deteriorated = input.operationalBaselines.filter((metric) => metric.current > metric.baseline * 1.08);
  if (!deteriorated.length) return null;
  return {
    findingId: "F-OPERATIONAL-RISK",
    category: "service_performance_risk",
    title: "Operational workload is rising faster than the contract model",
    evidenceLabels: [...new Set(deteriorated.map((metric) => evidenceLabel(input, metric.evidenceId)))],
    severity: "medium",
    currentState: deteriorated
      .map((metric) => `${metric.metric}: ${metric.current}${metric.unit} vs baseline ${metric.baseline}${metric.unit}`)
      .join("; "),
    sourcingImplication:
      "The contract should be optimized around real demand drivers instead of renewing the original run baseline.",
    recommendedAction:
      "Reset volume bands, introduce automation glidepath commitments, and separate demand growth from vendor productivity obligations.",
    estimatedAnnualImpactUsd: null,
    confidence: "medium",
  };
}

function renewalWindow(input: ContractOptimizationInput): ContractOptimizationFinding {
  return {
    findingId: "F-RENEWAL-WINDOW",
    category: "renewal_window",
    title: "Renewal notice creates a time-bound leverage window",
    evidenceLabels: [evidenceLabel(input, "E-RENEWAL")],
    severity: "medium",
    currentState: `Current term ends ${input.termEnd}; renewal notice date is ${input.renewalNoticeDate}.`,
    sourcingImplication:
      "The buyer should not let auto-renewal timing outrun the invoice, SLA, staffing, and automation cure plan.",
    recommendedAction:
      "Issue a reservation-of-rights and optimization notice before the renewal window closes; preserve rebid leverage if cure items remain open.",
    estimatedAnnualImpactUsd: null,
    confidence: "high",
  };
}

function buildLevers(findings: ContractOptimizationFinding[]): ContractOptimizationLever[] {
  return findings.map((finding, index) => {
    const base = {
      findingId: finding.findingId,
      priority: (finding.severity === "high" ? "P0" : index <= 2 ? "P1" : "P2") as ContractOptimizationLever["priority"],
      ownerRole: finding.category === "sla_credit_leakage" ? "Service delivery lead" : "Commercial lead",
    };
    if (finding.category === "price_leakage") {
      return {
        ...base,
        leverId: "L-RECOVER-LEAKAGE",
        leverType: "recover_invoice_leakage",
        buyerAsk:
          "Recover or credit unsupported invoice variance and lock a normalized run-rate baseline for renewal pricing.",
        negotiationLanguage:
          "Vendor must provide a variance ledger by month and category; unsupported pass-throughs and out-of-catalog charges will be credited or removed from the renewal baseline.",
        valueBasis: "evidenced",
        annualImpactLowUsd: finding.estimatedAnnualImpactUsd ? Math.round(finding.estimatedAnnualImpactUsd * 0.5) : null,
        annualImpactHighUsd: finding.estimatedAnnualImpactUsd,
      };
    }
    if (finding.category === "sla_credit_leakage") {
      return {
        ...base,
        leverId: "L-SLA-ECONOMICS",
        leverType: "tighten_service_credit_economics",
        buyerAsk: "Increase SLA credit cap and add chronic-miss escalators for critical towers.",
        negotiationLanguage:
          "Renewal pricing is conditional on stronger service-credit economics, chronic-miss escalation, and no earn-back until sustained performance is proven.",
        valueBasis: "opportunity_to_test",
        annualImpactLowUsd: null,
        annualImpactHighUsd: null,
      };
    }
    if (finding.category === "staffing_coverage_gap") {
      return {
        ...base,
        leverId: "L-STAFFING-TRUEUP",
        leverType: "reprice_staffing_coverage",
        buyerAsk: "True up underfilled staffing commitments through credits or revised tower pricing.",
        negotiationLanguage:
          "Vendor must reconcile committed FTE, observed staffing, and shift coverage monthly; unresolved gaps reduce run-rate or trigger service credits.",
        valueBasis: finding.estimatedAnnualImpactUsd ? "evidenced" : "opportunity_to_test",
        annualImpactLowUsd: finding.estimatedAnnualImpactUsd ? Math.round(finding.estimatedAnnualImpactUsd * 0.35) : null,
        annualImpactHighUsd: finding.estimatedAnnualImpactUsd,
      };
    }
    if (finding.category === "service_performance_risk") {
      return {
        ...base,
        leverId: "L-PRODUCTIVITY-CURE",
        leverType: "force_productivity_commitment",
        buyerAsk: "Convert demand and ticket-growth pressure into a measured automation and productivity glidepath.",
        negotiationLanguage:
          "Vendor must commit to ticket-deflection and root-cause-remediation targets with baseline, measurement method, and price-down or credit if the glidepath is missed.",
        valueBasis: "opportunity_to_test",
        annualImpactLowUsd: null,
        annualImpactHighUsd: null,
      };
    }
    return {
      ...base,
      leverId: "L-RENEWAL-WINDOW",
      leverType: "use_renewal_window",
      buyerAsk: "Use renewal timing to preserve competitive tension until cure items close.",
      negotiationLanguage:
        "Buyer reserves all renewal, extension, and rebid rights until commercial, SLA, staffing, and invoice-cure actions are resolved.",
      valueBasis: "opportunity_to_test",
      annualImpactLowUsd: null,
      annualImpactHighUsd: null,
    };
  });
}

function area(
  areaName: string,
  evidenceLabels: string[],
  whyItMatters: string,
): ContractOptimizationMveProfile["minimumViableExtractionAreas"][number] {
  return {
    area: areaName,
    status: evidenceLabels.length ? "covered" : "missing",
    evidenceLabels,
    whyItMatters,
  };
}

export function buildContractOptimizationMveProfile(
  input: ContractOptimizationInput,
): ContractOptimizationMveProfile {
  const findings = [
    invoiceLeakage(input),
    slaLeakage(input),
    staffingGap(input),
    operationalRisk(input),
    renewalWindow(input),
  ].filter((finding): finding is ContractOptimizationFinding => Boolean(finding));

  const levers = buildLevers(findings);
  const clientToComplete = [
    input.invoiceLines.length ? null : "Load at least 12 months of invoice history.",
    input.operationalBaselines.length ? null : "Load ticket, incident, and service-volume history.",
    input.staffingCommitments.length ? null : "Load staffing roster or monthly staffing attestation.",
    input.slas.length ? null : "Load SLA exhibit and service-credit history.",
  ].filter((gap): gap is string => Boolean(gap));

  return {
    tenantKey: input.tenantKey,
    sourceEventId: input.sourceEventId,
    contractName: input.contractName,
    incumbentVendorName: input.incumbentVendorName,
    syntheticDemo: input.syntheticDemo,
    decisionUse: findings.some((finding) => finding.severity === "high")
      ? "rebid_or_renegotiate"
      : "optimize_existing_contract",
    extractionBoundary:
      "Minimum viable extraction for sourcing decisions: contract terms, pricing, SLA economics, invoice variance, staffing commitments, operational demand, exceptions, renewal timing, optimization findings, and negotiation levers. It is not a general-purpose contract Q&A or clause summarizer.",
    contractBaseline: {
      termStart: input.termStart,
      termEnd: input.termEnd,
      renewalNoticeDate: input.renewalNoticeDate,
      currentAnnualRunRateUsd: input.currentAnnualRunRateUsd,
      termCount: input.terms.length,
      evidenceCount: input.evidenceRefs.length,
    },
    minimumViableExtractionAreas: [
      area("Contract baseline and renewal rights", [evidenceLabel(input, "E-MSA"), evidenceLabel(input, "E-RENEWAL")], "Preserves renewal/rebid leverage and avoids accidental auto-renewal."),
      area("Pricing and invoice baseline", [...new Set(input.invoiceLines.map((line) => evidenceLabel(input, line.evidenceId)))], "Separates contracted run-rate from invoice leakage, demand growth, and pass-through exposure."),
      area("SLA economics", [...new Set(input.slas.map((sla) => evidenceLabel(input, sla.evidenceId)))], "Tests whether service promises carry enough remedy to matter."),
      area("Staffing and coverage", [...new Set(input.staffingCommitments.map((row) => evidenceLabel(input, row.evidenceId)))], "Reconciles priced labor with delivered coverage."),
      area("Operational volume and quality", [...new Set(input.operationalBaselines.map((metric) => evidenceLabel(input, metric.evidenceId)))], "Shows whether demand, incidents, and changes are moving against the contract baseline."),
      area("Optimization and negotiation levers", findings.map((finding) => finding.title), "Turns extracted evidence into sourcing action rather than document browsing."),
    ],
    findings,
    levers,
    clientToComplete,
    readyForOptimization:
      clientToComplete.length > 1 ? "no" : findings.length ? "conditional" : "yes",
    readyReason:
      clientToComplete.length > 1
        ? "The profile lacks enough structured evidence to support optimization."
        : findings.length
          ? "The profile is strong enough for a renewal/optimization workshop, with caveats and vendor cure items named."
          : "The profile is ready for optimization with no major evidence gaps detected.",
  };
}

export function buildSkyHarborAmsExistingContractInput(): ContractOptimizationInput {
  return {
    tenantKey: "skyharbor-air",
    sourceEventId: "skyh-ams-contract-optimization-2026",
    contractName: "SkyHarbor Air Application Managed Services Agreement",
    incumbentVendorName: "Vendor A — incumbent operations profile",
    syntheticDemo: true,
    currentAnnualRunRateUsd: 38_400_000,
    termStart: "2023-01-01",
    termEnd: "2027-12-31",
    renewalNoticeDate: "2026-09-30",
    evidenceRefs: [
      { evidenceId: "E-MSA", role: "master_services_agreement", title: "Executed AMS Master Services Agreement", sourceType: "synthetic_demo", reference: "MSA Sections 2, 5, 9, 14", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-RENEWAL", role: "renewal_notice", title: "Renewal and termination notice schedule", sourceType: "synthetic_demo", reference: "MSA Section 14.2", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-PRICING", role: "pricing_schedule", title: "Schedule B pricing and rate card", sourceType: "synthetic_demo", reference: "Schedule B rows 1-38", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-INVOICE", role: "invoice_history", title: "12-month invoice baseline extract", sourceType: "synthetic_demo", reference: "Invoice extract Jan-Dec FY26", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-SLA", role: "sla_exhibit", title: "Schedule C SLA and service credit exhibit", sourceType: "synthetic_demo", reference: "Schedule C tables 1-4", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-OPS", role: "service_performance", title: "ServiceNow operations baseline", sourceType: "synthetic_demo", reference: "ITSM export FY26 Q1-Q4", syntheticDemoLabel: "Synthetic demo evidence" },
      { evidenceId: "E-STAFF", role: "staffing_roster", title: "Monthly staffing and location attestation", sourceType: "synthetic_demo", reference: "Staffing exhibit FY26 months 1-12", syntheticDemoLabel: "Synthetic demo evidence" },
    ],
    terms: [
      { termKey: "term", label: "Term", value: "Five-year managed services term ending 2027-12-31", evidenceId: "E-MSA", riskLevel: "medium" },
      { termKey: "notice", label: "Renewal notice", value: "Buyer must give non-renewal notice by 2026-09-30", evidenceId: "E-RENEWAL", riskLevel: "high" },
      { termKey: "pass_through", label: "Pass-through charges", value: "Vendor may invoice approved tooling and travel pass-throughs with supporting detail", evidenceId: "E-PRICING", riskLevel: "medium" },
      { termKey: "benchmark", label: "Benchmarking", value: "Benchmark right available once per contract year after year two", evidenceId: "E-MSA", riskLevel: "low" },
    ],
    slas: [
      { serviceLevel: "P1 incident restore", target: "95% within 4 hours", actual: "91.8% - missed in five months", creditMechanism: "Monthly service credit if target missed", creditCap: "4% of monthly service fee", chronicMissLanguage: "Not defined", evidenceId: "E-SLA" },
      { serviceLevel: "P2 incident restore", target: "92% within 12 hours", actual: "93.4% met", creditMechanism: "Monthly service credit", creditCap: "3% of monthly service fee", chronicMissLanguage: "Two consecutive misses trigger corrective-action plan", evidenceId: "E-SLA" },
      { serviceLevel: "Change success", target: "98% successful changes", actual: "96.9% - below target", creditMechanism: "Operational review only", creditCap: "No direct credit", chronicMissLanguage: "Not defined", evidenceId: "E-SLA" },
    ],
    invoiceLines: [
      { month: "2026-01", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_265_000, varianceReason: "tooling pass-through", evidenceId: "E-INVOICE" },
      { month: "2026-02", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_318_000, varianceReason: "out-of-catalog environment support", evidenceId: "E-INVOICE" },
      { month: "2026-03", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_280_000, varianceReason: "travel and premium coverage", evidenceId: "E-INVOICE" },
      { month: "2026-04", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_352_000, varianceReason: "demand growth not cataloged", evidenceId: "E-INVOICE" },
      { month: "2026-05", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_410_000, varianceReason: "change-order support", evidenceId: "E-INVOICE" },
      { month: "2026-06", category: "base run", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_366_000, varianceReason: "tooling pass-through", evidenceId: "E-INVOICE" },
    ],
    operationalBaselines: [
      { metric: "Monthly AMS tickets", baseline: 7420, current: 8610, unit: "tickets", evidenceId: "E-OPS", implication: "Demand volume exceeds original support baseline." },
      { metric: "Reopened incidents", baseline: 4.8, current: 7.1, unit: "%", evidenceId: "E-OPS", implication: "Root-cause quality and knowledge management need a cure plan." },
      { metric: "Emergency changes", baseline: 31, current: 44, unit: "per month", evidenceId: "E-OPS", implication: "Change discipline is weaker than the contract assumed." },
    ],
    staffingCommitments: [
      { tower: "Airline operations apps", committedFte: 54, observedFte: 48, locationMix: "US 38%, India 52%, nearshore 10%", coverage: "partial weekend gap", evidenceId: "E-STAFF" },
      { tower: "Corporate shared services", committedFte: 38, observedFte: 36, locationMix: "US 28%, India 62%, nearshore 10%", coverage: "verified weekday coverage", evidenceId: "E-STAFF" },
      { tower: "Data and integration support", committedFte: 22, observedFte: 18, locationMix: "US 32%, India 68%", coverage: "unverified overnight escalation", evidenceId: "E-STAFF" },
    ],
  };
}
