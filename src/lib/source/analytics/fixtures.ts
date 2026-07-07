import type {
  BafoLeverInput,
  ContractOptimizationAnalyticsInput,
  SourceEvidenceReference,
  VendorEvaluationInput,
  VendorResponseMveInput,
} from "./types";

const evidence = (
  evidenceId: string,
  evidenceType: SourceEvidenceReference["evidenceType"],
  sourceLabel: string,
): SourceEvidenceReference => ({
  evidenceId,
  evidenceType,
  fileName: `${evidenceId}.synthetic.md`,
  sourceLabel,
  sourceSection: "Synthetic demo evidence",
  dateRange: "FY26",
  confidence: "high",
  syntheticDemoFlag: true,
});

export function skyHarborContractOptimizationEvidenceRichFixture(): ContractOptimizationAnalyticsInput {
  return {
    currentAnnualRunRateUsd: 38_400_000,
    termEnd: "2027-12-31",
    renewalNoticeDate: "2026-09-30",
    evidenceRefs: [
      evidence("E-MSA", "contract_msa", "Executed AMS MSA"),
      evidence("E-SOW", "statement_of_work", "Active AMS SOW"),
      evidence("E-PRICING", "pricing_schedule", "Schedule B pricing"),
      evidence("E-INVOICE", "invoice_history", "12-month invoice baseline extract"),
      evidence("E-SLA", "sla_report", "SLA and service credit exhibit"),
      evidence("E-OPS", "ticket_history", "ServiceNow operational baseline"),
      evidence("E-STAFF", "staffing_model", "Monthly staffing attestation"),
      evidence("E-CHANGE", "change_order_ledger", "Change-order ledger"),
      evidence("E-RENEWAL", "renewal_notice", "Renewal notice schedule"),
    ],
    invoiceLines: [
      { month: "2026-01", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_265_000, evidenceId: "E-INVOICE" },
      { month: "2026-02", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_318_000, evidenceId: "E-INVOICE" },
      { month: "2026-03", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_280_000, evidenceId: "E-INVOICE" },
      { month: "2026-04", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_352_000, evidenceId: "E-INVOICE" },
      { month: "2026-05", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_410_000, evidenceId: "E-INVOICE" },
      { month: "2026-06", contractedAmountUsd: 3_200_000, invoicedAmountUsd: 3_366_000, evidenceId: "E-INVOICE" },
    ],
    staffingCommitments: [
      { tower: "Airline operations apps", committedFte: 54, observedFte: 48, evidenceId: "E-STAFF" },
      { tower: "Corporate shared services", committedFte: 38, observedFte: 36, evidenceId: "E-STAFF" },
      { tower: "Data and integration support", committedFte: 22, observedFte: 18, evidenceId: "E-STAFF" },
    ],
    changeOrders: [
      { requestId: "CO-0261", amountUsd: 186_000, recurring: false, catalogMapped: true, approvalEvidence: "complete", evidenceId: "E-CHANGE" },
      { requestId: "CO-0274", amountUsd: 312_000, recurring: true, catalogMapped: false, approvalEvidence: "partial", evidenceId: "E-CHANGE" },
      { requestId: "CO-0288", amountUsd: 428_000, recurring: true, catalogMapped: false, approvalEvidence: "partial", evidenceId: "E-CHANGE" },
      { requestId: "CO-0302", amountUsd: 144_000, recurring: false, catalogMapped: false, approvalEvidence: "missing", evidenceId: "E-CHANGE" },
      { requestId: "CO-0310", amountUsd: 268_000, recurring: true, catalogMapped: false, approvalEvidence: "partial", evidenceId: "E-CHANGE" },
    ],
    slas: [
      { serviceLevel: "P1 incident restore", target: "95% within 4 hours", actual: "91.8% - missed in five months", creditCap: "4% of monthly service fee", chronicMissLanguage: "Not defined", evidenceId: "E-SLA" },
      { serviceLevel: "Change success", target: "98% successful changes", actual: "96.9% - below target", creditCap: "No direct credit", chronicMissLanguage: "Not defined", evidenceId: "E-SLA" },
    ],
    operationalBaselines: [
      { metric: "Monthly AMS tickets", baseline: 7420, current: 8610, unit: "tickets", evidenceId: "E-OPS" },
      { metric: "Reopened incidents", baseline: 4.8, current: 7.1, unit: "%", evidenceId: "E-OPS" },
      { metric: "Emergency changes", baseline: 31, current: 44, unit: "per month", evidenceId: "E-OPS" },
    ],
  };
}

export function skyHarborContractOptimizationEvidencePartialFixture(): ContractOptimizationAnalyticsInput {
  const rich = skyHarborContractOptimizationEvidenceRichFixture();
  return {
    ...rich,
    evidenceRefs: rich.evidenceRefs.filter(
      (ref) => !["invoice_history", "staffing_model"].includes(ref.evidenceType),
    ),
    invoiceLines: [],
    staffingCommitments: [],
  };
}

export function evidenceLightContractBaselineFixture(): ContractOptimizationAnalyticsInput {
  const rich = skyHarborContractOptimizationEvidenceRichFixture();
  return {
    ...rich,
    evidenceRefs: rich.evidenceRefs.filter((ref) =>
      ["contract_msa", "statement_of_work", "renewal_notice"].includes(ref.evidenceType),
    ),
    invoiceLines: [],
    staffingCommitments: [],
    changeOrders: [],
    slas: [],
    operationalBaselines: [],
  };
}

export function skyHarborVendorResponseFixture(): VendorResponseMveInput[] {
  const commonEvidence = [
    evidence("V-RESP", "vendor_response_narrative", "Sectioned vendor response"),
    evidence("V-CLAIMS", "vendor_claim_register", "Vendor claim register"),
    evidence("V-PRICE", "pricing_workbook", "Pricing workbook"),
    evidence("V-STAFF", "staffing_location_model", "Staffing and location model"),
    evidence("V-SLA", "sla_commitment_table", "SLA commitment table"),
    evidence("V-ASSUME", "assumptions_exclusions_log", "Assumptions and exclusions log"),
    evidence("V-EXCEPT", "commercial_exceptions_table", "Commercial exceptions table"),
    evidence("V-TRANS", "transition_plan", "Transition plan"),
  ];
  return [
    vendor("vendor-a", "Vendor A", commonEvidence, true, ["SLA cap remains below buyer target"]),
    vendor("vendor-b", "Vendor B", commonEvidence, false, [
      "Productivity claim lacks pricing credit",
      "24x7 staffing not fully supported",
    ]),
    vendor("vendor-c", "Vendor C", commonEvidence, true, [
      "Scope exclusions require commercial review",
    ]),
  ];
}

export function skyHarborVendorEvaluationFixture(): VendorEvaluationInput[] {
  return [
    {
      vendorId: "vendor-a",
      vendorName: "Vendor A",
      evidenceCompletenessScore: 94,
      unresolvedConditions: ["Strengthen SLA credit cap"],
      posture: "risk-adjusted lead with strongest continuity posture",
      categoryScores: scoreSet([7.2, 7.8, 7.0, 7.4, 7.6, 7.1, 7.3, 7.0, 8.2]),
    },
    {
      vendorId: "vendor-b",
      vendorName: "Vendor B",
      evidenceCompletenessScore: 82,
      unresolvedConditions: [
        "Cure 24x7 staffing gap",
        "Price productivity back into run-rate",
        "Tighten transition dependencies",
      ],
      posture: "price benchmark only until staffing and productivity economics are cured",
      categoryScores: scoreSet([8.2, 6.8, 6.0, 6.1, 5.9, 5.8, 7.6, 6.1, 6.6]),
    },
    {
      vendorId: "vendor-c",
      vendorName: "Vendor C",
      evidenceCompletenessScore: 88,
      unresolvedConditions: ["Clarify scope exclusions", "Normalize transition fees"],
      posture: "conditional service-accountability finalist",
      categoryScores: scoreSet([6.9, 7.0, 8.0, 7.0, 7.2, 6.7, 6.8, 6.7, 7.4]),
    },
  ];
}

export function skyHarborBafoLeverFixture(): BafoLeverInput[] {
  return [
    {
      vendorId: "vendor-b",
      vendorName: "Vendor B",
      issue: "unsupported productivity economics",
      severity: "high",
      valueAtStakeUsd: 2_400_000,
      category: "productivity credit",
      evidenceBasis: "MVE profile and pricing workbook gap",
      cureCondition: "year-by-year automation baseline, measurement method, and price-down schedule",
      scoreImpact: 0.45,
    },
    {
      vendorId: "vendor-a",
      vendorName: "Vendor A",
      issue: "weak SLA credit cap",
      severity: "medium",
      valueAtStakeUsd: null,
      category: "service accountability",
      evidenceBasis: "SLA commitment table",
      cureCondition: "higher credit cap, chronic-miss escalator, and restricted earn-back",
      scoreImpact: 0.25,
    },
    {
      vendorId: "vendor-c",
      vendorName: "Vendor C",
      issue: "scope exclusion ambiguity",
      severity: "medium",
      valueAtStakeUsd: 900_000,
      category: "scope control",
      evidenceBasis: "exceptions table",
      cureCondition: "redlined exclusions with buyer-approved retained scope list",
      scoreImpact: 0.3,
    },
  ];
}

function vendor(
  vendorId: string,
  vendorName: string,
  evidenceRefs: SourceEvidenceReference[],
  commerciallyBackedClaims: boolean,
  gaps: string[],
): VendorResponseMveInput {
  return {
    vendorId,
    vendorName,
    evidenceRefs,
    sections: Array.from({ length: 15 }, (_, index) => ({
      section: `RFP section ${index + 1}`,
      answered: index < 14 || vendorId !== "vendor-b",
      evidenceId: "V-RESP",
    })),
    claims: [
      {
        claimId: `${vendorId}-claim-1`,
        claim: "automation productivity by year two",
        supported: commerciallyBackedClaims,
        commercialCommitment: commerciallyBackedClaims,
        evidenceId: "V-CLAIMS",
      },
      {
        claimId: `${vendorId}-claim-2`,
        claim: "critical application continuity",
        supported: true,
        commercialCommitment: true,
        evidenceId: "V-CLAIMS",
      },
    ],
    pricing: {
      fiveYearTcoUsd: vendorId === "vendor-b" ? 182_000_000 : 195_000_000,
      yearOneRunCostUsd: vendorId === "vendor-b" ? 32_000_000 : 36_500_000,
      transitionCostUsd: vendorId === "vendor-c" ? 6_500_000 : 5_000_000,
      comparable: vendorId !== "vendor-b",
      gaps: vendorId === "vendor-b" ? ["productivity credit not priced back"] : [],
    },
    staffing: {
      rolesProvided: true,
      locationMixProvided: vendorId !== "vendor-b",
      coverageModelProvided: vendorId !== "vendor-b",
      riskNotes: vendorId === "vendor-b" ? ["24x7 coverage not fully staffed"] : [],
    },
    sla: {
      targetsProvided: true,
      creditsProvided: true,
      capsProvided: vendorId !== "vendor-a",
      exclusionsProvided: true,
      riskNotes: vendorId === "vendor-a" ? ["credit cap below buyer target"] : [],
    },
    transition: {
      milestonesProvided: true,
      dependenciesProvided: vendorId !== "vendor-b",
      exitCriteriaProvided: true,
      riskNotes: vendorId === "vendor-b" ? ["dependencies not explicit"] : [],
    },
    assumptions: gaps,
    exceptions: vendorId === "vendor-c" ? ["scope carve-out requires legal review"] : [],
  };
}

function scoreSet(scores: number[]): VendorEvaluationInput["categoryScores"] {
  const categories = [
    "Commercial value",
    "Scope fit",
    "Service/SLA strength",
    "Transition readiness",
    "Staffing/delivery model",
    "Automation/productivity credibility",
    "Pricing transparency",
    "Risk/commercial exceptions",
    "Evidence completeness",
  ];
  return categories.map((category, index) => ({
    category,
    weight: [20, 10, 15, 10, 10, 10, 10, 10, 5][index] ?? 10,
    score: scores[index] ?? 0,
    rationale: `${category} score from structured MVE profile.`,
  }));
}
