import {
  buildEvidenceReadinessSummary,
  CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
} from "./evidence-readiness";
import type {
  ContractOptimizationAnalytics,
  ContractOptimizationAnalyticsInput,
  SourceAnalyticFinding,
  SourceEvidenceReference,
} from "./types";

const money = (value: number | null): string => {
  if (!value || !Number.isFinite(value)) return "value to be quantified";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
};

export function calculateInvoiceLeakage(
  invoiceLines: ContractOptimizationAnalyticsInput["invoiceLines"],
): { sampledLeakageUsd: number; annualizedLeakageUsd: number | null } {
  const sampledLeakageUsd = invoiceLines.reduce(
    (sum, line) =>
      sum + Math.max(0, line.invoicedAmountUsd - line.contractedAmountUsd),
    0,
  );
  return {
    sampledLeakageUsd,
    annualizedLeakageUsd: invoiceLines.length
      ? Math.round(sampledLeakageUsd * (12 / invoiceLines.length))
      : null,
  };
}

export function calculateChangeOrderLeakage(
  changeOrders: ContractOptimizationAnalyticsInput["changeOrders"],
): {
  sampledExposureUsd: number;
  recurringExposureUsd: number;
  annualizedLeakageUsd: number | null;
} {
  const risky = changeOrders.filter(
    (line) =>
      line.recurring ||
      !line.catalogMapped ||
      line.approvalEvidence !== "complete",
  );
  const sampledExposureUsd = risky.reduce((sum, line) => sum + line.amountUsd, 0);
  const recurringExposureUsd = risky
    .filter((line) => line.recurring)
    .reduce((sum, line) => sum + line.amountUsd, 0);
  return {
    sampledExposureUsd,
    recurringExposureUsd,
    annualizedLeakageUsd: risky.length
      ? Math.round(recurringExposureUsd || sampledExposureUsd * 0.5)
      : null,
  };
}

export function calculateStaffingVariance(
  staffing: ContractOptimizationAnalyticsInput["staffingCommitments"],
): {
  committedFte: number;
  observedFte: number;
  missingFte: number;
  variancePct: number;
  annualizedExposureUsd: number | null;
} {
  const committedFte = staffing.reduce((sum, row) => sum + row.committedFte, 0);
  const observedFte = staffing.reduce((sum, row) => sum + row.observedFte, 0);
  const missingFte = Math.max(0, committedFte - observedFte);
  return {
    committedFte,
    observedFte,
    missingFte,
    variancePct: committedFte ? (missingFte / committedFte) * 100 : 0,
    annualizedExposureUsd: staffing.length ? Math.round(missingFte * 185_000) : null,
  };
}

export function calculateSlaCreditWeakness(
  slas: ContractOptimizationAnalyticsInput["slas"],
): { weakSlaCount: number; totalSlaCount: number; weaknessScore: number } {
  const weakSlaCount = slas.filter(
    (sla) =>
      /miss|below|not met|missed/i.test(sla.actual) ||
      /no direct credit|none|not defined/i.test(
        `${sla.creditCap} ${sla.chronicMissLanguage}`,
      ) ||
      /[1-4]%/.test(sla.creditCap),
  ).length;
  return {
    weakSlaCount,
    totalSlaCount: slas.length,
    weaknessScore: slas.length ? Math.round((weakSlaCount / slas.length) * 100) : 0,
  };
}

export function calculateOperationalPressure(
  metrics: ContractOptimizationAnalyticsInput["operationalBaselines"],
): Array<{ metric: string; deltaPct: number; pressure: "high" | "medium" | "low" }> {
  return metrics.map((metric) => {
    const deltaPct = metric.baseline
      ? ((metric.current - metric.baseline) / metric.baseline) * 100
      : 0;
    return {
      metric: metric.metric,
      deltaPct,
      pressure: deltaPct >= 15 ? "high" : deltaPct >= 8 ? "medium" : "low",
    };
  });
}

export function calculateRenewalUrgency(
  renewalNoticeDate: string,
  asOf = "2026-07-02",
): { daysUntilNotice: number; urgency: "high" | "medium" | "low" } {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilNotice = Math.ceil(
    (Date.parse(renewalNoticeDate) - Date.parse(asOf)) / msPerDay,
  );
  return {
    daysUntilNotice,
    urgency: daysUntilNotice <= 90 ? "high" : daysUntilNotice <= 180 ? "medium" : "low",
  };
}

export function calculateFinancialExposureRange(args: {
  invoiceAnnualizedUsd: number | null;
  staffingAnnualizedUsd: number | null;
  changeOrderAnnualizedUsd: number | null;
}): { lowUsd: number | null; highUsd: number | null; label: string } {
  const required = [
    args.invoiceAnnualizedUsd,
    args.staffingAnnualizedUsd,
    args.changeOrderAnnualizedUsd,
  ];
  if (required.some((value) => !value || value <= 0)) {
    return {
      lowUsd: null,
      highUsd: null,
      label: "not enough evidence to quantify exposure yet",
    };
  }
  const highUsd = required.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  const lowUsd = Math.round(highUsd * 0.75);
  return {
    lowUsd,
    highUsd,
    label: `${money(lowUsd)}-${money(highUsd)} annualized, subject to vendor cure review`,
  };
}

export function buildContractOptimizationAnalytics(
  input: ContractOptimizationAnalyticsInput,
): ContractOptimizationAnalytics {
  const readiness = buildEvidenceReadinessSummary({
    evidenceRefs: input.evidenceRefs,
    requiredEvidence: CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE,
    assumptions:
      input.evidenceRefs.length >= CONTRACT_OPTIMIZATION_REQUIRED_EVIDENCE.length
        ? []
        : ["Commercial exposure is limited to loaded evidence until missing sources are supplied."],
  });
  const invoice = calculateInvoiceLeakage(input.invoiceLines);
  const staffing = calculateStaffingVariance(input.staffingCommitments);
  const changeOrders = calculateChangeOrderLeakage(input.changeOrders);
  const sla = calculateSlaCreditWeakness(input.slas);
  const renewal = calculateRenewalUrgency(input.renewalNoticeDate);
  const exposure = calculateFinancialExposureRange({
    invoiceAnnualizedUsd: readiness.requiredEvidenceMissing.includes("invoice_history")
      ? null
      : invoice.annualizedLeakageUsd,
    staffingAnnualizedUsd: readiness.requiredEvidenceMissing.includes("staffing_model")
      ? null
      : staffing.annualizedExposureUsd,
    changeOrderAnnualizedUsd: readiness.requiredEvidenceMissing.includes("change_order_ledger")
      ? null
      : changeOrders.annualizedLeakageUsd,
  });
  const evidence = (id: string) =>
    input.evidenceRefs.filter((ref) => ref.evidenceId === id);
  const findings = buildContractFindings(input, {
    invoice,
    staffing,
    changeOrders,
    sla,
    renewal,
    evidence,
  });

  return {
    readiness,
    runRateUsd: input.currentAnnualRunRateUsd,
    exposureLowUsd: exposure.lowUsd,
    exposureHighUsd: exposure.highUsd,
    exposureLabel: exposure.label,
    exposureDrivers: [
      {
        driver: "Invoice variance",
        lowUsd: invoice.annualizedLeakageUsd
          ? Math.round(invoice.annualizedLeakageUsd * 0.5)
          : null,
        highUsd: invoice.annualizedLeakageUsd,
        confidence: input.invoiceLines.length ? "high" : "low",
        caveat: input.invoiceLines.length
          ? "Annualized from loaded invoice sample."
          : "Invoice history is missing.",
      },
      {
        driver: "Staffing coverage variance",
        lowUsd: staffing.annualizedExposureUsd
          ? Math.round(staffing.annualizedExposureUsd * 0.35)
          : null,
        highUsd: staffing.annualizedExposureUsd,
        confidence: input.staffingCommitments.length ? "medium" : "low",
        caveat: input.staffingCommitments.length
          ? "Uses committed versus observed FTE denominator."
          : "Staffing evidence is missing.",
      },
      {
        driver: "Recurring change-order leakage",
        lowUsd: changeOrders.annualizedLeakageUsd
          ? Math.round(changeOrders.annualizedLeakageUsd * 0.4)
          : null,
        highUsd: changeOrders.annualizedLeakageUsd,
        confidence: input.changeOrders.length ? "medium" : "low",
        caveat: input.changeOrders.length
          ? "Uses recurring or risky change-order sample."
          : "Change-order evidence is missing.",
      },
    ],
    findings,
    recommendedPath:
      readiness.mode === "evidence_light"
        ? [
            "Build the contract baseline and data request pack before quantifying exposure.",
            "Do not claim savings until invoices, staffing, SLA, ticket, and change-order evidence are loaded.",
          ]
        : [
            "Do not renew as-is.",
            "Issue cure and reservation-of-rights notice.",
            "Renegotiate the incumbent with cure conditions.",
            "Prepare RFP fallback if cure items remain open.",
          ],
    doNothingScenario: [
      "Exposure persists into the next term.",
      "Renewal leverage decays as notice windows close.",
      "Recurring exceptions become normalized run cost.",
      "Weak SLA economics continue without stronger remedy.",
    ],
    dataRequests: readiness.recommendedDataRequests,
  };
}

function buildContractFindings(
  input: ContractOptimizationAnalyticsInput,
  args: {
    invoice: ReturnType<typeof calculateInvoiceLeakage>;
    staffing: ReturnType<typeof calculateStaffingVariance>;
    changeOrders: ReturnType<typeof calculateChangeOrderLeakage>;
    sla: ReturnType<typeof calculateSlaCreditWeakness>;
    renewal: ReturnType<typeof calculateRenewalUrgency>;
    evidence: (id: string) => SourceEvidenceReference[];
  },
): SourceAnalyticFinding[] {
  const findings: SourceAnalyticFinding[] = [];
  if (args.invoice.annualizedLeakageUsd) {
    findings.push({
      id: "contract.invoice_leakage",
      title: "Invoice leakage",
      category: "commercial_exposure",
      severity: "high",
      finding: `${money(args.invoice.sampledLeakageUsd)} sampled invoice variance; ${money(args.invoice.annualizedLeakageUsd)} annualized exposure.`,
      evidenceUsed: args.evidence("E-INVOICE"),
      evidenceMissing: [],
      quantifiedImpactLowUsd: Math.round(args.invoice.annualizedLeakageUsd * 0.5),
      quantifiedImpactHighUsd: args.invoice.annualizedLeakageUsd,
      confidence: "high",
      assumptions: ["Annualized from loaded invoice sample."],
      recommendedAction: "Recover unsupported invoice variance and reset the renewal baseline.",
      sourcingStage: "contract_optimization",
      businessImpact: ["cost", "vendor_accountability"],
    });
  }
  if (args.sla.weakSlaCount) {
    findings.push({
      id: "contract.sla_weakness",
      title: "Weak SLA economics",
      category: "service_accountability",
      severity: "high",
      finding: `${args.sla.weakSlaCount} of ${args.sla.totalSlaCount} SLA commitments show weak credit economics or chronic-miss controls.`,
      evidenceUsed: args.evidence("E-SLA"),
      evidenceMissing: [],
      directionalImpact: "Operational risk without proportionate vendor remedy.",
      confidence: "high",
      assumptions: [],
      recommendedAction: "Increase credit caps, add chronic-miss escalators, and restrict earn-back.",
      sourcingStage: "contract_optimization",
      businessImpact: ["risk", "service_customer", "vendor_accountability"],
    });
  }
  if (args.staffing.annualizedExposureUsd) {
    findings.push({
      id: "contract.staffing_variance",
      title: "Staffing variance",
      category: "delivery_model",
      severity: "high",
      finding: `${args.staffing.missingFte.toFixed(1)} of ${args.staffing.committedFte.toFixed(1)} committed FTE are not visible; ${args.staffing.variancePct.toFixed(1)}% variance.`,
      evidenceUsed: args.evidence("E-STAFF"),
      evidenceMissing: [],
      quantifiedImpactLowUsd: Math.round(args.staffing.annualizedExposureUsd * 0.35),
      quantifiedImpactHighUsd: args.staffing.annualizedExposureUsd,
      confidence: "medium",
      assumptions: ["Uses planning rate of $185K per missing FTE until client rate card is supplied."],
      recommendedAction: "Require staffing true-up, shift coverage attestation, and credits for underfilled roles.",
      sourcingStage: "contract_optimization",
      businessImpact: ["cost", "risk", "vendor_accountability"],
    });
  }
  if (args.changeOrders.annualizedLeakageUsd) {
    findings.push({
      id: "contract.change_order_leakage",
      title: "Change-order leakage",
      category: "scope_control",
      severity: "high",
      finding: `${money(args.changeOrders.sampledExposureUsd)} sampled change-order exposure; ${money(args.changeOrders.recurringExposureUsd)} appears recurring.`,
      evidenceUsed: args.evidence("E-CHANGE"),
      evidenceMissing: [],
      quantifiedImpactLowUsd: Math.round(args.changeOrders.annualizedLeakageUsd * 0.4),
      quantifiedImpactHighUsd: args.changeOrders.annualizedLeakageUsd,
      confidence: "medium",
      assumptions: [],
      recommendedAction: "Move approved recurring work into catalog pricing and credit unsupported items.",
      sourcingStage: "contract_optimization",
      businessImpact: ["cost", "compliance_governance"],
    });
  }
  findings.push({
    id: "contract.renewal_urgency",
    title: "Renewal leverage window",
    category: "renewal_timing",
    severity: args.renewal.urgency === "high" ? "high" : "medium",
    finding: `${args.renewal.daysUntilNotice} days remain until the renewal notice date.`,
    evidenceUsed: args.evidence("E-RENEWAL"),
    evidenceMissing: [],
    directionalImpact: "Delay reduces buyer leverage.",
    confidence: "high",
    assumptions: [],
    recommendedAction: "Preserve renewal and rebid rights while cure items are unresolved.",
    sourcingStage: "contract_optimization",
    businessImpact: ["speed", "risk", "vendor_accountability"],
  });
  return findings;
}
