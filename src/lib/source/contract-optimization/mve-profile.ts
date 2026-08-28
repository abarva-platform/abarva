import type {
  ContractOptimizationFinding,
  ContractOptimizationInput,
  ContractOptimizationLever,
  ContractOptimizationMveProfile,
} from "./types";

const money = (value: number): string =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const number = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 1 });

const metricValue = (value: number, unit: string): string => {
  if (unit === "%") return `${number(value)}%`;
  if (/per month/i.test(unit)) return `${number(value)} ${unit}`;
  return `${number(value)} ${unit}`;
};

const evidenceLabel = (
  input: ContractOptimizationInput,
  evidenceId: string,
): string => {
  const ref = input.evidenceRefs.find(
    (evidence) => evidence.evidenceId === evidenceId,
  );
  return ref ? `${ref.title} (${ref.reference})` : evidenceId;
};

function invoiceLeakage(
  input: ContractOptimizationInput,
): ContractOptimizationFinding | null {
  const leakage = input.invoiceLines.reduce(
    (sum, line) =>
      sum + Math.max(0, line.invoicedAmountUsd - line.contractedAmountUsd),
    0,
  );
  if (leakage <= 0) return null;
  const annualized = leakage * (12 / Math.max(1, input.invoiceLines.length));
  return {
    findingId: "F-PRICE-LEAKAGE",
    category: "price_leakage",
    title: "Invoices are running above contracted baseline",
    evidenceLabels: [
      ...new Set(
        input.invoiceLines.map((line) => evidenceLabel(input, line.evidenceId)),
      ),
    ],
    severity:
      annualized > input.currentAnnualRunRateUsd * 0.04 ? "high" : "medium",
    currentState: `${money(leakage)} of above-baseline invoice variance appears in the sampled months; annualized exposure is about ${money(annualized)}.`,
    sourcingImplication:
      "The incumbent commercial baseline cannot be treated as clean until pass-throughs, demand changes, and out-of-catalog charges are reconciled.",
    recommendedAction:
      "Create a recovery and normalization schedule before renewal pricing; require vendor to classify every variance as approved demand, recoverable leakage, or future catalog item.",
    estimatedAnnualImpactUsd: Math.round(annualized),
    confidence: "high",
  };
}

function slaLeakage(
  input: ContractOptimizationInput,
): ContractOptimizationFinding | null {
  const weak = input.slas.filter(
    (sla) =>
      /miss|below|not met|missed/i.test(sla.actual) ||
      /cap.*[0-4]%|4%|3%|2%|1%/i.test(sla.creditCap) ||
      /none|silent|not defined/i.test(sla.chronicMissLanguage),
  );
  if (!weak.length) return null;
  return {
    findingId: "F-SLA-CREDIT",
    category: "sla_credit_leakage",
    title: "Service credits do not match operational criticality",
    evidenceLabels: [
      ...new Set(weak.map((sla) => evidenceLabel(input, sla.evidenceId))),
    ],
    severity: "high",
    currentState: `${weak.length} SLA commitment(s) show missed/weak performance economics or insufficient chronic-miss language.`,
    sourcingImplication:
      "The buyer has operational risk without proportionate contractual remedy, which weakens renewal leverage and service accountability.",
    recommendedAction:
      "Tighten service-credit caps, add chronic-miss escalators, restrict earn-back, and link credits to business-critical towers.",
    estimatedAnnualImpactUsd: null,
    confidence: "high",
  };
}

function staffingGap(
  input: ContractOptimizationInput,
): ContractOptimizationFinding | null {
  const gaps = input.staffingCommitments.filter(
    (row) =>
      row.observedFte < row.committedFte ||
      /unverified|gap|partial/i.test(row.coverage),
  );
  if (!gaps.length) return null;
  const missingFte = gaps.reduce(
    (sum, row) => sum + Math.max(0, row.committedFte - row.observedFte),
    0,
  );
  const committedFte = input.staffingCommitments.reduce(
    (sum, row) => sum + row.committedFte,
    0,
  );
  const observedFte = input.staffingCommitments.reduce(
    (sum, row) => sum + row.observedFte,
    0,
  );
  const variancePct = committedFte > 0 ? (missingFte / committedFte) * 100 : 0;
  const affectedTowers = gaps.map((row) => row.tower).join(", ");
  const impact = missingFte > 0 ? missingFte * 185_000 : null;
  return {
    findingId: "F-STAFFING-COVERAGE",
    category: "staffing_coverage_gap",
    title: "Committed staffing and observed coverage do not fully reconcile",
    evidenceLabels: [
      ...new Set(gaps.map((row) => evidenceLabel(input, row.evidenceId))),
    ],
    severity: missingFte >= 8 ? "high" : "medium",
    currentState: `${missingFte.toFixed(1)} of ${committedFte.toFixed(1)} committed FTE equivalent(s) are not visible in observed staffing or shift coverage (${variancePct.toFixed(1)}% variance; ${observedFte.toFixed(1)} observed FTE; affected towers: ${affectedTowers}). Estimated staffing value exposure is ${impact ? money(impact) : "not quantified"} annually.`,
    sourcingImplication:
      "Service quality and pricing are not comparable unless staffing gaps are either cured, credited, or removed from the retained baseline.",
    recommendedAction:
      "Require a monthly staffing true-up, named shift coverage, and service-credit linkage for underfilled critical roles.",
    estimatedAnnualImpactUsd: impact ? Math.round(impact) : null,
    confidence: "medium",
  };
}

function changeOrderExposure(
  input: ContractOptimizationInput,
): ContractOptimizationFinding | null {
  const risky = input.changeOrders.filter(
    (line) =>
      !line.catalogMapped ||
      line.approvalEvidence !== "complete" ||
      line.recurring,
  );
  if (!risky.length) return null;
  const exposure = risky.reduce((sum, line) => sum + line.amountUsd, 0);
  const recurringExposure = risky
    .filter((line) => line.recurring)
    .reduce((sum, line) => sum + line.amountUsd, 0);
  return {
    findingId: "F-CHANGE-ORDER-EXPOSURE",
    category: "scope_change_order_exposure",
    title: "Change-order spend is not cleanly cataloged into the run baseline",
    evidenceLabels: [
      ...new Set(risky.map((line) => evidenceLabel(input, line.evidenceId))),
    ],
    severity:
      exposure > input.currentAnnualRunRateUsd * 0.03 ? "high" : "medium",
    currentState: `${money(exposure)} of sampled change-order exposure lacks clean catalog mapping, complete approval evidence, or one-time/recurring separation; ${money(recurringExposure)} appears recurring.`,
    sourcingImplication:
      "The incumbent can convert operational exceptions into renewal baseline cost unless Source separates true scope growth from leakage and buyer-approved changes.",
    recommendedAction:
      "Create a change-order normalization schedule: retire unsupported items, move approved recurring work into catalog pricing, and require milestone approval for future out-of-scope work.",
    estimatedAnnualImpactUsd: Math.round(recurringExposure || exposure * 0.5),
    confidence: "medium",
  };
}

function operationalRisk(
  input: ContractOptimizationInput,
): ContractOptimizationFinding | null {
  const deteriorated = input.operationalBaselines.filter(
    (metric) => metric.current > metric.baseline * 1.08,
  );
  if (!deteriorated.length) return null;
  return {
    findingId: "F-OPERATIONAL-RISK",
    category: "service_performance_risk",
    title: "Operational workload is rising faster than the contract model",
    evidenceLabels: [
      ...new Set(
        deteriorated.map((metric) => evidenceLabel(input, metric.evidenceId)),
      ),
    ],
    severity: "medium",
    currentState: deteriorated
      .map(
        (metric) =>
          `${metric.metric}: ${metricValue(metric.current, metric.unit)} vs baseline ${metricValue(metric.baseline, metric.unit)}`,
      )
      .join("; "),
    sourcingImplication:
      "The contract should be optimized around real demand drivers instead of renewing the original run baseline.",
    recommendedAction:
      "Reset volume bands, introduce automation glidepath commitments, and separate demand growth from vendor productivity obligations.",
    estimatedAnnualImpactUsd: null,
    confidence: "medium",
  };
}

function renewalWindow(
  input: ContractOptimizationInput,
): ContractOptimizationFinding {
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

function buildLevers(
  findings: ContractOptimizationFinding[],
): ContractOptimizationLever[] {
  return findings.map((finding, index) => {
    const base = {
      findingId: finding.findingId,
      priority: (finding.severity === "high"
        ? "P0"
        : finding.category === "renewal_window" ||
            finding.category === "scope_change_order_exposure"
          ? "P1"
          : index <= 2
            ? "P1"
            : "P2") as ContractOptimizationLever["priority"],
      ownerRole:
        finding.category === "sla_credit_leakage"
          ? "Service delivery lead"
          : "Commercial lead",
    };
    if (finding.category === "price_leakage") {
      return {
        ...base,
        ownerRole: "Procurement commercial lead",
        leverId: "L-RECOVER-LEAKAGE",
        leverType: "recover_invoice_leakage",
        buyerAsk:
          "Recover or credit unsupported invoice variance and lock a normalized run-rate baseline for renewal pricing.",
        negotiationLanguage:
          "Vendor must provide a variance ledger by month and category; unsupported pass-throughs and out-of-catalog charges will be credited or removed from the renewal baseline.",
        valueBasis: "evidenced",
        annualImpactLowUsd: finding.estimatedAnnualImpactUsd
          ? Math.round(finding.estimatedAnnualImpactUsd * 0.5)
          : null,
        annualImpactHighUsd: finding.estimatedAnnualImpactUsd,
      };
    }
    if (finding.category === "sla_credit_leakage") {
      return {
        ...base,
        ownerRole: "IT service owner",
        leverId: "L-SLA-ECONOMICS",
        leverType: "tighten_service_credit_economics",
        buyerAsk:
          "Increase SLA credit cap and add chronic-miss escalators for critical towers.",
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
        ownerRole: "Vendor management lead",
        leverId: "L-STAFFING-TRUEUP",
        leverType: "reprice_staffing_coverage",
        buyerAsk:
          "True up underfilled staffing commitments through credits or revised tower pricing.",
        negotiationLanguage:
          "Vendor must reconcile committed FTE, observed staffing, and shift coverage monthly; unresolved gaps reduce run-rate or trigger service credits.",
        valueBasis: finding.estimatedAnnualImpactUsd
          ? "evidenced"
          : "opportunity_to_test",
        annualImpactLowUsd: finding.estimatedAnnualImpactUsd
          ? Math.round(finding.estimatedAnnualImpactUsd * 0.35)
          : null,
        annualImpactHighUsd: finding.estimatedAnnualImpactUsd,
      };
    }
    if (finding.category === "service_performance_risk") {
      return {
        ...base,
        ownerRole: "IT service owner",
        leverId: "L-PRODUCTIVITY-CURE",
        leverType: "force_productivity_commitment",
        buyerAsk:
          "Convert demand and ticket-growth pressure into a measured automation and productivity glidepath.",
        negotiationLanguage:
          "Vendor must commit to ticket-deflection and root-cause-remediation targets with baseline, measurement method, and price-down or credit if the glidepath is missed.",
        valueBasis: "opportunity_to_test",
        annualImpactLowUsd: null,
        annualImpactHighUsd: null,
      };
    }
    if (finding.category === "scope_change_order_exposure") {
      return {
        ...base,
        ownerRole: "Procurement commercial lead / finance controller",
        leverId: "L-CHANGE-ORDER-CATALOG",
        leverType: "convert_change_orders_to_catalog",
        buyerAsk:
          "Convert approved recurring change orders into catalog pricing and credit unsupported items.",
        negotiationLanguage:
          "Renewal baseline must exclude unsupported change-order charges; approved recurring work must move into catalog pricing with owner, approval evidence, and measurable service obligation.",
        valueBasis: finding.estimatedAnnualImpactUsd
          ? "evidenced"
          : "opportunity_to_test",
        annualImpactLowUsd: finding.estimatedAnnualImpactUsd
          ? Math.round(finding.estimatedAnnualImpactUsd * 0.4)
          : null,
        annualImpactHighUsd: finding.estimatedAnnualImpactUsd,
      };
    }
    return {
      ...base,
      ownerRole: "Renewal steering committee",
      leverId: "L-RENEWAL-WINDOW",
      leverType: "use_renewal_window",
      buyerAsk:
        "Use renewal timing to preserve competitive tension until cure items close.",
      negotiationLanguage:
        "Buyer reserves all renewal, extension, and rebid rights until commercial, SLA, staffing, and invoice-cure actions are resolved.",
      valueBasis: "opportunity_to_test",
      annualImpactLowUsd: null,
      annualImpactHighUsd: null,
    };
  });
}

function buildVisualInsights(
  input: ContractOptimizationInput,
  levers: ContractOptimizationLever[],
): ContractOptimizationMveProfile["visualInsights"] {
  return {
    exposureByDriver: levers.map((lever) => ({
      driver: lever.buyerAsk,
      annualImpactLowUsd: lever.annualImpactLowUsd,
      annualImpactHighUsd: lever.annualImpactHighUsd,
      valueBasis: lever.valueBasis,
      action: lever.negotiationLanguage,
    })),
    invoiceVarianceTrend: input.invoiceLines.map((line) => {
      const varianceUsd = Math.max(
        0,
        line.invoicedAmountUsd - line.contractedAmountUsd,
      );
      return {
        month: line.month,
        contractedAmountUsd: line.contractedAmountUsd,
        invoicedAmountUsd: line.invoicedAmountUsd,
        varianceUsd,
        variancePct:
          line.contractedAmountUsd > 0
            ? (varianceUsd / line.contractedAmountUsd) * 100
            : 0,
      };
    }),
    operationalPressure: input.operationalBaselines.map((metric) => ({
      metric: metric.metric,
      baseline: metric.baseline,
      current: metric.current,
      deltaPct:
        metric.baseline > 0
          ? ((metric.current - metric.baseline) / metric.baseline) * 100
          : 0,
      unit: metric.unit,
      implication: metric.implication,
    })),
    staffingCoverage: input.staffingCommitments.map((row) => {
      const gapFte = Math.max(0, row.committedFte - row.observedFte);
      return {
        tower: row.tower,
        committedFte: row.committedFte,
        observedFte: row.observedFte,
        gapFte,
        gapPct: row.committedFte > 0 ? (gapFte / row.committedFte) * 100 : 0,
        coverage: row.coverage,
      };
    }),
  };
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
    changeOrderExposure(input),
    operationalRisk(input),
    renewalWindow(input),
  ].filter((finding): finding is ContractOptimizationFinding =>
    Boolean(finding),
  );

  const levers = buildLevers(findings);
  const visualInsights = buildVisualInsights(input, levers);
  const clientToComplete = [
    input.invoiceLines.length
      ? null
      : "Load at least 12 months of invoice history.",
    input.operationalBaselines.length
      ? null
      : "Load ticket, incident, and service-volume history.",
    input.staffingCommitments.length
      ? null
      : "Load staffing roster or monthly staffing attestation.",
    input.slas.length ? null : "Load SLA exhibit and service-credit history.",
    input.changeOrders.length
      ? null
      : "Load change-order, amendment, and approval history.",
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
      area(
        "Contract baseline and renewal rights",
        [evidenceLabel(input, "E-MSA"), evidenceLabel(input, "E-RENEWAL")],
        "Preserves renewal/rebid leverage and avoids accidental auto-renewal.",
      ),
      area(
        "Pricing and invoice baseline",
        [
          ...new Set(
            input.invoiceLines.map((line) =>
              evidenceLabel(input, line.evidenceId),
            ),
          ),
        ],
        "Separates contracted run-rate from invoice leakage, demand growth, and pass-through exposure.",
      ),
      area(
        "SLA economics",
        [
          ...new Set(
            input.slas.map((sla) => evidenceLabel(input, sla.evidenceId)),
          ),
        ],
        "Tests whether service promises carry enough remedy to matter.",
      ),
      area(
        "Staffing and coverage",
        [
          ...new Set(
            input.staffingCommitments.map((row) =>
              evidenceLabel(input, row.evidenceId),
            ),
          ),
        ],
        "Reconciles priced labor with delivered coverage.",
      ),
      area(
        "Operational volume and quality",
        [
          ...new Set(
            input.operationalBaselines.map((metric) =>
              evidenceLabel(input, metric.evidenceId),
            ),
          ),
        ],
        "Shows whether demand, incidents, and changes are moving against the contract baseline.",
      ),
      area(
        "Change orders and amendments",
        [
          ...new Set(
            input.changeOrders.map((line) =>
              evidenceLabel(input, line.evidenceId),
            ),
          ),
        ],
        "Separates approved scope growth from leakage, recurring exceptions, and renewal baseline creep.",
      ),
      area(
        "Optimization and negotiation levers",
        findings.map((finding) => finding.title),
        "Turns extracted evidence into sourcing action rather than document browsing.",
      ),
    ],
    findings,
    levers,
    recommendedPath: {
      immediateAction:
        "Issue a reservation-of-rights and cure notice covering invoice variance, SLA economics, staffing reconciliation, and change-order normalization before the renewal notice window closes.",
      primaryPath:
        "Renegotiate the incumbent agreement with cure conditions, normalized run-rate baseline, stronger SLA credits, staffing true-up, and cataloged change-order controls.",
      fallbackPath:
        "Prepare a competitive RFP if cure items remain unresolved or the incumbent cannot convert the evidence-backed levers into commercial commitments.",
      doNotDo:
        "Do not renew as-is or treat the current run-rate as clean until leakage, staffing, SLA, and recurring change-order issues are resolved.",
      decisionOwnerRole: "CIO / CPO / CFO renewal steering committee",
    },
    clientToComplete,
    readyForOptimization:
      clientToComplete.length > 1
        ? "no"
        : findings.length
          ? "conditional"
          : "yes",
    readyReason:
      clientToComplete.length > 1
        ? "The profile lacks enough structured evidence to support optimization."
        : findings.length
          ? "The profile is strong enough for a renewal/optimization workshop, with caveats and vendor cure items named."
          : "The profile is ready for optimization with no major evidence gaps detected.",
    visualInsights,
  };
}

export function buildSkyHarborAmsExistingContractInput(
  overrides: Partial<
    Pick<ContractOptimizationInput, "sourceEventId" | "tenantKey">
  > = {},
): ContractOptimizationInput {
  return {
    tenantKey: overrides.tenantKey ?? "skyharbor-air",
    sourceEventId:
      overrides.sourceEventId ?? "skyh-ams-contract-optimization-2026",
    contractName: "SkyHarbor Air Application Managed Services Agreement",
    incumbentVendorName: "Vendor A — incumbent operations profile",
    syntheticDemo: true,
    currentAnnualRunRateUsd: 38_400_000,
    termStart: "2023-01-01",
    termEnd: "2027-12-31",
    renewalNoticeDate: "2026-09-30",
    evidenceRefs: [
      {
        evidenceId: "E-MSA",
        role: "master_services_agreement",
        title: "Executed AMS Master Services Agreement",
        sourceType: "synthetic_demo",
        reference: "MSA Sections 2, 5, 9, 14",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-RENEWAL",
        role: "renewal_notice",
        title: "Renewal and termination notice schedule",
        sourceType: "synthetic_demo",
        reference: "MSA Section 14.2",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-PRICING",
        role: "pricing_schedule",
        title: "Schedule B pricing and rate card",
        sourceType: "synthetic_demo",
        reference: "Schedule B rows 1-38",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-INVOICE",
        role: "invoice_history",
        title: "12-month invoice baseline extract",
        sourceType: "synthetic_demo",
        reference: "Invoice extract Jan-Dec FY26",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-SLA",
        role: "sla_exhibit",
        title: "Schedule C SLA and service credit exhibit",
        sourceType: "synthetic_demo",
        reference: "Schedule C tables 1-4",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-OPS",
        role: "service_performance",
        title: "ServiceNow operations baseline",
        sourceType: "synthetic_demo",
        reference: "ITSM export FY26 Q1-Q4",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-STAFF",
        role: "staffing_roster",
        title: "Monthly staffing and location attestation",
        sourceType: "synthetic_demo",
        reference: "Staffing exhibit FY26 months 1-12",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-CHANGE",
        role: "change_order_log",
        title: "Change-order and amendment ledger",
        sourceType: "synthetic_demo",
        reference: "Change-order ledger FY26 rows 1-9",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
      {
        evidenceId: "E-GOV",
        role: "governance_minutes",
        title: "Supplier QBR and cure-item minutes",
        sourceType: "synthetic_demo",
        reference: "QBR minutes FY26 Q2-Q4",
        syntheticDemoLabel: "Synthetic demo evidence",
      },
    ],
    terms: [
      {
        termKey: "term",
        label: "Term",
        value: "Five-year managed services term ending 2027-12-31",
        evidenceId: "E-MSA",
        riskLevel: "medium",
      },
      {
        termKey: "notice",
        label: "Renewal notice",
        value: "Buyer must give non-renewal notice by 2026-09-30",
        evidenceId: "E-RENEWAL",
        riskLevel: "high",
      },
      {
        termKey: "pass_through",
        label: "Pass-through charges",
        value:
          "Vendor may invoice approved tooling and travel pass-throughs with supporting detail",
        evidenceId: "E-PRICING",
        riskLevel: "medium",
      },
      {
        termKey: "benchmark",
        label: "Benchmarking",
        value:
          "Benchmark right available once per contract year after year two",
        evidenceId: "E-MSA",
        riskLevel: "low",
      },
    ],
    slas: [
      {
        serviceLevel: "P1 incident restore",
        target: "95% within 4 hours",
        actual: "91.8% - missed in five months",
        creditMechanism: "Monthly service credit if target missed",
        creditCap: "4% of monthly service fee",
        chronicMissLanguage: "Not defined",
        evidenceId: "E-SLA",
      },
      {
        serviceLevel: "P2 incident restore",
        target: "92% within 12 hours",
        actual: "93.4% met",
        creditMechanism: "Monthly service credit",
        creditCap: "3% of monthly service fee",
        chronicMissLanguage:
          "Two consecutive misses trigger corrective-action plan",
        evidenceId: "E-SLA",
      },
      {
        serviceLevel: "Change success",
        target: "98% successful changes",
        actual: "96.9% - below target",
        creditMechanism: "Operational review only",
        creditCap: "No direct credit",
        chronicMissLanguage: "Not defined",
        evidenceId: "E-SLA",
      },
    ],
    invoiceLines: [
      {
        month: "2026-01",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_265_000,
        varianceReason: "tooling pass-through",
        evidenceId: "E-INVOICE",
      },
      {
        month: "2026-02",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_318_000,
        varianceReason: "out-of-catalog environment support",
        evidenceId: "E-INVOICE",
      },
      {
        month: "2026-03",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_280_000,
        varianceReason: "travel and premium coverage",
        evidenceId: "E-INVOICE",
      },
      {
        month: "2026-04",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_352_000,
        varianceReason: "demand growth not cataloged",
        evidenceId: "E-INVOICE",
      },
      {
        month: "2026-05",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_410_000,
        varianceReason: "change-order support",
        evidenceId: "E-INVOICE",
      },
      {
        month: "2026-06",
        category: "base run",
        contractedAmountUsd: 3_200_000,
        invoicedAmountUsd: 3_366_000,
        varianceReason: "tooling pass-through",
        evidenceId: "E-INVOICE",
      },
    ],
    operationalBaselines: [
      {
        metric: "Monthly AMS tickets",
        baseline: 7420,
        current: 8610,
        unit: "tickets",
        evidenceId: "E-OPS",
        implication: "Demand volume exceeds original support baseline.",
      },
      {
        metric: "Reopened incidents",
        baseline: 4.8,
        current: 7.1,
        unit: "%",
        evidenceId: "E-OPS",
        implication:
          "Root-cause quality and knowledge management need a cure plan.",
      },
      {
        metric: "Emergency changes",
        baseline: 31,
        current: 44,
        unit: "per month",
        evidenceId: "E-OPS",
        implication: "Change discipline is weaker than the contract assumed.",
      },
    ],
    staffingCommitments: [
      {
        tower: "Airline operations apps",
        committedFte: 54,
        observedFte: 48,
        locationMix: "US 38%, India 52%, nearshore 10%",
        coverage: "partial weekend gap",
        evidenceId: "E-STAFF",
      },
      {
        tower: "Corporate shared services",
        committedFte: 38,
        observedFte: 36,
        locationMix: "US 28%, India 62%, nearshore 10%",
        coverage: "verified weekday coverage",
        evidenceId: "E-STAFF",
      },
      {
        tower: "Data and integration support",
        committedFte: 22,
        observedFte: 18,
        locationMix: "US 32%, India 68%",
        coverage: "unverified overnight escalation",
        evidenceId: "E-STAFF",
      },
    ],
    changeOrders: [
      {
        requestId: "CO-0261",
        category: "airport operations app hypercare",
        amountUsd: 186_000,
        recurring: false,
        catalogMapped: true,
        approvalEvidence: "complete",
        evidenceId: "E-CHANGE",
      },
      {
        requestId: "CO-0274",
        category: "premium weekend coverage",
        amountUsd: 312_000,
        recurring: true,
        catalogMapped: false,
        approvalEvidence: "partial",
        evidenceId: "E-CHANGE",
      },
      {
        requestId: "CO-0288",
        category: "integration incident bridge support",
        amountUsd: 428_000,
        recurring: true,
        catalogMapped: false,
        approvalEvidence: "partial",
        evidenceId: "E-CHANGE",
      },
      {
        requestId: "CO-0302",
        category: "finance close stabilization",
        amountUsd: 144_000,
        recurring: false,
        catalogMapped: false,
        approvalEvidence: "missing",
        evidenceId: "E-CHANGE",
      },
      {
        requestId: "CO-0310",
        category: "tooling pass-through uplift",
        amountUsd: 268_000,
        recurring: true,
        catalogMapped: false,
        approvalEvidence: "partial",
        evidenceId: "E-CHANGE",
      },
    ],
  };
}
