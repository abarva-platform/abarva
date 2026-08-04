import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join("docs", "source", "skyharbor-v4");
const QUESTION_BANK = "source_v4_question_bank.json";
const COVERAGE_MATRIX = "source_v4_question_coverage_matrix.json";
const MODEL_FIT_AUDIT = "source_v4_model_fit_audit.json";
const CONTRACT_DOC = path.join(
  "docs",
  "source",
  "SKYHARBOR_SOURCE_V4_QUESTION_EVIDENCE_CONTRACT.md",
);
const GENERATOR_DOC = path.join(
  "docs",
  "source",
  "SKYHARBOR_SOURCE_V4_GENERATOR_DESIGN.md",
);
const CUBE_MODEL = path.join("cube", "model", "source_sourcing.yml");

const contractMeta = {
  contract_id: "skyharbor-source-v4-question-evidence-contract",
  version: "v1",
  tenant_key: "skyharbor_global",
  dataset_id: "skyharbor-source-v4-202608",
  dataset_version: "v4",
  as_of_date: "2027-06-30",
  question_count: 150,
};

const sourceFiles = {
  supplier_master: ["suppliers/ARIBA_SUPPLIERS.csv"],
  contract_header: ["contracts/ARIBA_CONTRACT_WORKSPACES.csv"],
  legal_evidence: ["legal/SHAREPOINT_CONTRACT_EVIDENCE.csv"],
  financial_line: ["finance/S4_VENDOR_INVOICE_LINES.csv"],
  saas_usage: ["usage/ENTRA_SAAS_USAGE_MONTHLY.csv"],
  cloud_consumption: ["cloud/AZURE_COST_MONTHLY.csv"],
  service_performance: ["performance/SERVICENOW_SLA_MONTHLY.csv"],
  workforce_rate_card: ["workforce/FIELDGLASS_RATE_CARD.csv"],
  sourcing_event: ["sourcing/ARIBA_SOURCING_EVENTS.csv"],
  scope_mapping: ["scope/LEANIX_CONTRACT_SCOPE.csv"],
};

const columnsByDomain = {
  supplier_master: [
    "vendor_id",
    "legal_name",
    "supplier_category",
    "risk_tier",
    "onboarding_status",
  ],
  contract_header: [
    "contract_id",
    "vendor_id",
    "agreement_type",
    "annual_value",
    "expiration_date",
    "notice_deadline",
    "renewal_type",
  ],
  legal_evidence: [
    "file_id",
    "document_role",
    "contract_id",
    "content_sha256",
    "extraction_confidence",
    "review_state",
  ],
  financial_line: [
    "supplier_id",
    "contract_id",
    "invoice_id",
    "invoice_line",
    "cost_center",
    "posting_date",
    "net_amount",
    "matching_state",
  ],
  saas_usage: [
    "tool_id",
    "sku_id",
    "function_ref",
    "assigned_seats",
    "active_users",
    "period_start",
    "actual_cost",
  ],
  cloud_consumption: [
    "subscription_id",
    "service_name",
    "region",
    "usage_quantity",
    "actual_cost",
    "commitment_id",
    "period_start",
  ],
  service_performance: [
    "contract_id",
    "metric_name",
    "target",
    "actual",
    "breach_count",
    "credit_calculated",
    "credit_claimed",
  ],
  workforce_rate_card: [
    "sow_id",
    "work_order_id",
    "role_title",
    "location",
    "bill_rate",
    "hours",
    "approved_rate",
  ],
  sourcing_event: [
    "event_id",
    "event_type",
    "stage",
    "supplier_id",
    "response_id",
    "score",
    "normalized_cost",
  ],
  scope_mapping: [
    "contract_id",
    "application_id",
    "criticality",
    "lifecycle",
    "relationship_method",
    "confidence",
  ],
};

const visuals = [
  "table",
  "waterfall",
  "time_series",
  "scatter",
  "sankey",
  "heatmap",
  "funnel",
  "evidence_drawer",
];

const foci = [
  "flight operations",
  "crew operations",
  "maintenance and engineering",
  "airport operations",
  "revenue management",
  "customer recovery",
  "digital commerce",
  "finance operations",
  "HR and workforce",
  "cybersecurity",
  "data and analytics",
  "enterprise platforms",
];

const storyThreads = [
  "saas_rationalization",
  "managed_service_value_leakage",
  "cloud_commitment_exposure",
  "app_retirement_contract_conflict",
  "ai_value_proof_gap",
  "supplier_bafo_normalization",
  "evidence_conflict_resolution",
];

const decisionAngles = [
  "board attention",
  "near-term renegotiation",
  "budget reallocation",
  "evidence request",
  "owner escalation",
  "commercial leverage",
  "risk reduction",
  "renewal sequencing",
  "operational recovery",
  "value proof",
  "scope cleanup",
  "supplier challenge",
  "portfolio governance",
  "canary answer proof",
  "Cube drill validation",
  "aVa response quality",
  "Source visual readiness",
  "Tower value discipline",
];

const domains = [
  {
    key: "executive_portfolio_concentration",
    label: "Executive portfolio and concentration",
    count: 12,
    requiredSourceDomains: [
      "supplier_master",
      "contract_header",
      "financial_line",
      "scope_mapping",
    ],
    measures: [
      "annual_value",
      "actual_spend",
      "contract_count",
      "vendor_count",
    ],
    dimensions: [
      "supplier_category",
      "strategic_status",
      "risk_tier",
      "business_unit",
      "criticality",
    ],
    grain: "vendor_category_contract_month",
    cubeViews: ["source_executive_portfolio", "source_vendor_concentration"],
    drillPath: [
      "supplier_category",
      "strategic_status",
      "risk_tier",
      "legal_name",
      "contract_id",
    ],
    storyThreads: [
      "portfolio_baseline",
      "managed_service_value_leakage",
      "app_retirement_contract_conflict",
    ],
    visual: ["table", "waterfall", "heatmap"],
    nextViews: [],
    question: (focus) =>
      `Where is SkyHarbor most concentrated across ${focus} vendors, contracts, actual spend and critical scope?`,
  },
  {
    key: "vendor_360",
    label: "Vendor 360",
    count: 12,
    requiredSourceDomains: [
      "supplier_master",
      "contract_header",
      "financial_line",
      "service_performance",
      "scope_mapping",
    ],
    measures: [
      "annual_value",
      "actual_spend",
      "breach_count",
      "unclaimed_credit",
      "scope_count",
    ],
    dimensions: [
      "legal_name",
      "supplier_category",
      "risk_tier",
      "contract_id",
      "service_category",
    ],
    grain: "vendor_contract_service_month",
    cubeViews: [
      "source_vendor_concentration",
      "source_performance_and_credits",
      "source_contract_scope_confidence",
    ],
    drillPath: [
      "legal_name",
      "contract_id",
      "service_category",
      "metric_name",
      "period_start",
    ],
    storyThreads: [
      "managed_service_value_leakage",
      "cloud_commitment_exposure",
      "evidence_conflict_resolution",
    ],
    visual: ["table", "sankey", "evidence_drawer"],
    nextViews: [],
    question: (focus) =>
      `What is the full commercial, operational and scope posture for the top ${focus} supplier?`,
  },
  {
    key: "contract_economics_terms",
    label: "Contract economics and commercial terms",
    count: 18,
    requiredSourceDomains: [
      "contract_header",
      "legal_evidence",
      "financial_line",
      "service_performance",
    ],
    measures: [
      "annual_value",
      "total_committed_value",
      "invoice_amount",
      "credit_calculated",
      "credit_claimed",
    ],
    dimensions: [
      "agreement_type",
      "renewal_type",
      "document_role",
      "quality_state",
      "contract_id",
    ],
    grain: "contract_clause_invoice_credit",
    cubeViews: ["source_executive_portfolio", "source_performance_and_credits"],
    drillPath: [
      "agreement_type",
      "renewal_type",
      "vendor_name",
      "contract_id",
      "document_role",
    ],
    storyThreads: [
      "managed_service_value_leakage",
      "evidence_conflict_resolution",
      "saas_rationalization",
    ],
    visual: ["waterfall", "table", "evidence_drawer"],
    nextViews: [
      "source_contract_terms_detail",
      "source_legal_evidence_conflict",
    ],
    question: (focus) =>
      `Which ${focus} contracts have economics or commercial terms that change the renewal decision?`,
  },
  {
    key: "spend_invoices_commitments",
    label: "Spend, invoices and commitments",
    count: 15,
    requiredSourceDomains: [
      "financial_line",
      "contract_header",
      "supplier_master",
    ],
    measures: [
      "actual_spend",
      "invoice_amount",
      "committed_amount",
      "overage_amount",
    ],
    dimensions: [
      "business_unit",
      "cost_center",
      "service_category",
      "matching_state",
      "contract_id",
    ],
    grain: "invoice_line_contract_month",
    cubeViews: ["source_spend_consumption", "source_executive_portfolio"],
    drillPath: [
      "business_unit",
      "cost_center",
      "service_category",
      "contract_id",
      "month",
    ],
    storyThreads: [
      "managed_service_value_leakage",
      "cloud_commitment_exposure",
      "saas_rationalization",
    ],
    visual: ["time_series", "waterfall", "table"],
    nextViews: [],
    question: (focus) =>
      `Which ${focus} invoice and commitment patterns explain variance from contract value?`,
  },
  {
    key: "saas_cloud_consumption_utilization",
    label: "SaaS/cloud consumption and utilization",
    count: 14,
    requiredSourceDomains: [
      "saas_usage",
      "cloud_consumption",
      "contract_header",
      "financial_line",
      "scope_mapping",
    ],
    measures: [
      "assigned_seats",
      "active_users",
      "actual_cost",
      "usage_quantity",
      "committed_amount",
    ],
    dimensions: [
      "tool_id",
      "sku_id",
      "function_ref",
      "subscription_id",
      "service_name",
      "region",
    ],
    grain: "tool_or_cloud_service_month",
    cubeViews: ["source_spend_consumption", "source_contract_scope_confidence"],
    drillPath: [
      "service_category",
      "contract_id",
      "business_unit",
      "cost_center",
      "month",
    ],
    storyThreads: [
      "saas_rationalization",
      "cloud_commitment_exposure",
      "ai_value_proof_gap",
    ],
    visual: ["time_series", "scatter", "heatmap"],
    nextViews: ["source_saas_usage_value", "source_cloud_commitment"],
    question: (focus) =>
      `Where is ${focus} paying for SaaS or cloud capacity that utilization does not yet support?`,
  },
  {
    key: "sla_incidents_service_credits",
    label: "SLA, incidents and service credits",
    count: 13,
    requiredSourceDomains: [
      "service_performance",
      "contract_header",
      "legal_evidence",
      "financial_line",
    ],
    measures: [
      "breach_count",
      "credit_calculated",
      "credit_claimed",
      "credit_recovered",
      "unclaimed_credit",
    ],
    dimensions: [
      "metric_name",
      "credit_eligible",
      "contract_id",
      "period_start",
      "quality_state",
    ],
    grain: "contract_metric_month",
    cubeViews: ["source_performance_and_credits", "source_spend_consumption"],
    drillPath: [
      "metric_name",
      "credit_eligible",
      "contract_id",
      "period_start",
    ],
    storyThreads: [
      "managed_service_value_leakage",
      "evidence_conflict_resolution",
    ],
    visual: ["waterfall", "time_series", "evidence_drawer"],
    nextViews: [],
    question: (focus) =>
      `Which ${focus} SLA misses created recoverable credits, and what remains unclaimed?`,
  },
  {
    key: "renewals_notice_leverage",
    label: "Renewals, notice periods and leverage",
    count: 12,
    requiredSourceDomains: [
      "contract_header",
      "legal_evidence",
      "financial_line",
      "scope_mapping",
      "sourcing_event",
    ],
    measures: [
      "annual_value",
      "notice_90_day_count",
      "actual_spend",
      "weighted_score",
    ],
    dimensions: [
      "expiration_date",
      "notice_deadline",
      "auto_renew",
      "renewal_type",
      "recommended_action",
    ],
    grain: "contract_renewal_window",
    cubeViews: [
      "source_renewal_exposure",
      "source_event_execution",
      "source_supplier_comparison",
    ],
    drillPath: [
      "renewal_type",
      "auto_renew",
      "expiration_date",
      "notice_deadline",
      "contract_id",
    ],
    storyThreads: [
      "app_retirement_contract_conflict",
      "managed_service_value_leakage",
      "supplier_bafo_normalization",
    ],
    visual: ["table", "funnel", "time_series"],
    nextViews: [],
    question: (focus) =>
      `Which ${focus} renewals need a decision before leverage expires?`,
  },
  {
    key: "application_platform_dependencies",
    label: "Application/platform dependencies",
    count: 10,
    requiredSourceDomains: [
      "scope_mapping",
      "contract_header",
      "supplier_master",
      "financial_line",
    ],
    measures: [
      "scope_count",
      "explicit_scope_count",
      "inferred_scope_count",
      "annual_value",
    ],
    dimensions: [
      "scope_type",
      "scope_name",
      "criticality",
      "lifecycle",
      "relationship_method",
    ],
    grain: "contract_application_scope",
    cubeViews: [
      "source_contract_scope_confidence",
      "source_executive_portfolio",
    ],
    drillPath: [
      "scope_type",
      "criticality",
      "relationship_method",
      "scope_name",
      "contract_id",
    ],
    storyThreads: [
      "app_retirement_contract_conflict",
      "cloud_commitment_exposure",
    ],
    visual: ["sankey", "heatmap", "table"],
    nextViews: [],
    question: (focus) =>
      `Which ${focus} applications or platforms are commercially locked by contracts despite lifecycle pressure?`,
  },
  {
    key: "workforce_rate_cards",
    label: "Workforce and rate cards",
    count: 9,
    requiredSourceDomains: [
      "workforce_rate_card",
      "contract_header",
      "financial_line",
      "legal_evidence",
    ],
    measures: [
      "bill_rate",
      "approved_rate",
      "hours",
      "actual_spend",
      "rate_variance",
    ],
    dimensions: [
      "role_title",
      "location",
      "rate_card_id",
      "work_order_id",
      "approval_state",
    ],
    grain: "sow_role_location_month",
    cubeViews: ["source_spend_consumption"],
    drillPath: ["business_unit", "service_category", "contract_id", "month"],
    storyThreads: [
      "managed_service_value_leakage",
      "evidence_conflict_resolution",
    ],
    visual: ["scatter", "waterfall", "table"],
    nextViews: ["source_workforce_rate_card"],
    question: (focus) =>
      `Where do ${focus} SOW roles show rate drift or mix shift against the approved card?`,
  },
  {
    key: "cyber_vendor_risk",
    label: "Cyber/vendor risk",
    count: 5,
    requiredSourceDomains: [
      "supplier_master",
      "legal_evidence",
      "contract_header",
      "service_performance",
    ],
    measures: ["risk_score", "open_findings", "breach_count", "annual_value"],
    dimensions: [
      "risk_tier",
      "cyber_risk_state",
      "privacy_risk_state",
      "document_role",
      "supplier_category",
    ],
    grain: "vendor_risk_contract",
    cubeViews: [
      "source_vendor_concentration",
      "source_performance_and_credits",
    ],
    drillPath: ["supplier_category", "risk_tier", "legal_name", "contract_id"],
    storyThreads: [
      "evidence_conflict_resolution",
      "managed_service_value_leakage",
    ],
    visual: ["heatmap", "table", "evidence_drawer"],
    nextViews: ["source_vendor_risk"],
    question: (focus) =>
      `Which ${focus} vendors combine material spend with unresolved cyber or privacy evidence?`,
  },
  {
    key: "sourcing_events_supplier_bafo",
    label: "Sourcing events, supplier comparison and BAFO",
    count: 10,
    requiredSourceDomains: [
      "sourcing_event",
      "supplier_master",
      "financial_line",
      "contract_header",
    ],
    measures: [
      "weighted_score",
      "risk_score",
      "normalized_cost",
      "actual_spend",
    ],
    dimensions: [
      "event_type",
      "event_status",
      "service_scope",
      "supplier_status",
      "recommendation",
    ],
    grain: "event_supplier_response_line",
    cubeViews: ["source_event_execution", "source_supplier_comparison"],
    drillPath: [
      "event_type",
      "service_scope",
      "event_status",
      "response_status",
      "supplier_name",
    ],
    storyThreads: [
      "supplier_bafo_normalization",
      "managed_service_value_leakage",
    ],
    visual: ["scatter", "funnel", "table"],
    nextViews: [],
    question: (focus) =>
      `Which ${focus} supplier looks best after BAFO normalization rather than headline price?`,
  },
  {
    key: "ai_adoption_productivity_value_proof",
    label: "AI adoption, productivity and value proof",
    count: 10,
    requiredSourceDomains: [
      "saas_usage",
      "service_performance",
      "financial_line",
      "scope_mapping",
    ],
    measures: [
      "assigned_seats",
      "active_users",
      "actual_cost",
      "baseline_metric",
      "post_metric",
      "finance_validated_value",
    ],
    dimensions: [
      "tool_id",
      "function_ref",
      "usage_metric_name",
      "metric_name",
      "claim_state",
    ],
    grain: "ai_tool_function_month_metric",
    cubeViews: ["source_spend_consumption", "source_performance_and_credits"],
    drillPath: ["service_category", "business_unit", "contract_id", "month"],
    storyThreads: ["ai_value_proof_gap", "saas_rationalization"],
    visual: ["funnel", "time_series", "evidence_drawer"],
    nextViews: ["source_ai_value_proof", "source_tower_claim_bridge"],
    question: (focus) =>
      `Is AI tooling in ${focus} producing usage-supported, baseline-backed and finance-validated value?`,
  },
  {
    key: "evidence_lineage_conflict_missing_proof",
    label: "Evidence lineage, conflict and missing proof",
    count: 10,
    requiredSourceDomains: [
      "legal_evidence",
      "contract_header",
      "financial_line",
      "service_performance",
      "sourcing_event",
    ],
    measures: [
      "conflict_count",
      "missing_evidence_count",
      "confidence",
      "annual_value",
    ],
    dimensions: [
      "document_role",
      "quality_state",
      "evidence_state",
      "source_system",
      "review_state",
    ],
    grain: "evidence_assertion_conflict_group",
    cubeViews: ["source_executive_portfolio", "source_performance_and_credits"],
    drillPath: [
      "agreement_type",
      "vendor_name",
      "contract_id",
      "document_role",
    ],
    storyThreads: [
      "evidence_conflict_resolution",
      "managed_service_value_leakage",
      "supplier_bafo_normalization",
    ],
    visual: ["evidence_drawer", "table", "heatmap"],
    nextViews: ["source_legal_evidence_conflict"],
    question: (focus) =>
      `Which ${focus} answers must be withheld or caveated because evidence is missing or contradictory?`,
  },
];

function unique(values) {
  return [...new Set(values)].sort();
}

function extractCubeViews(yaml) {
  const viewBlock = yaml.split(/\nviews:\n/u)[1] || "";
  return [...viewBlock.matchAll(/^  - name: ([a-z0-9_]+)/gmu)]
    .map((match) => match[1])
    .sort();
}

function evidenceDepth(domain, index) {
  const requiresClause =
    domain.requiredSourceDomains.includes("legal_evidence");
  const requiresTime = [
    "financial_line",
    "saas_usage",
    "cloud_consumption",
    "service_performance",
  ].some((sourceDomain) => domain.requiredSourceDomains.includes(sourceDomain));
  return {
    min_source_records: Math.max(3, domain.requiredSourceDomains.length),
    min_source_domains: domain.requiredSourceDomains.length,
    clause_or_page_required: requiresClause,
    time_series_months_required: requiresTime ? 24 : 0,
    human_review_required: requiresClause || index % 5 === 0,
  };
}

function articleFor(text) {
  return /^[aeiou]/iu.test(text) ? "an" : "a";
}

function expectedAnswerShape(visual) {
  if (visual === "time_series")
    return "ordered_monthly_series_with_drillable_rows";
  if (visual === "waterfall") return "reconciled_bridge_with_components";
  if (visual === "scatter") return "ranked_comparison_with_outlier_flags";
  if (visual === "funnel") return "stage_count_and_dropoff_summary";
  if (visual === "evidence_drawer")
    return "answer_with_evidence_status_and_caveats";
  if (visual === "sankey") return "flow_path_with_ranked_dependencies";
  if (visual === "heatmap") return "matrix_with_exposure_bands_and_drill";
  return "ranked_table_with_source_drill";
}

function allowedConclusion(domain) {
  if (domain.key.includes("ai_adoption")) {
    return "May separate adoption, usage-supported signal and finance-validated value; may not mark value claimable without baseline and attestation.";
  }
  if (domain.key.includes("evidence")) {
    return "May withhold an answer or mark it disputed when reviewed evidence is absent or contradictory.";
  }
  if (domain.key.includes("sourcing_events")) {
    return "May recommend shortlist or BAFO action only when normalized cost, score, exceptions and risk are comparable.";
  }
  return "May identify exposure, variance, leakage or next action only when required source domains reconcile at the declared grain.";
}

function prohibitedOverstatement(domain) {
  if (domain.key.includes("ai_adoption"))
    return "Do not claim productivity improvement from license usage alone; require before/after operating metrics and finance validation.";
  if (domain.key.includes("saas_cloud"))
    return "Do not convert under-utilization or unused commitment into savings unless recoverability is evidenced.";
  if (domain.key.includes("sla"))
    return "Do not call calculated credits recovered unless claimed and received amounts support it.";
  if (domain.key.includes("contract_economics"))
    return "Do not pick the largest value when contract, AP and tracker values disagree; mark conflict until reviewed.";
  return "Do not state savings, compliance, recoverability or vendor fault when evidence is inferred, missing or disputed.";
}

function expectedAction(domain) {
  if (domain.key.includes("renewals"))
    return "Create renewal decision docket with owner, notice date, leverage posture and required evidence.";
  if (domain.key.includes("sourcing_events"))
    return "Create clarification or BAFO action tied to comparable line items and unresolved exceptions.";
  if (domain.key.includes("evidence"))
    return "Create evidence request with owner role, source system, needed field/document and due date.";
  if (domain.key.includes("ai_adoption"))
    return "Require baseline capture before expanding spend or claiming realized value.";
  return "Open Source drill path, validate evidence state and route the finding to sourcing or vendor-management action.";
}

function buildQuestions() {
  const questions = [];
  let sequence = 1;
  for (const domain of domains) {
    for (let index = 0; index < domain.count; index += 1) {
      const focus = foci[(sequence + index) % foci.length];
      const angle = decisionAngles[index % decisionAngles.length];
      const storyThread =
        domain.storyThreads[index % domain.storyThreads.length];
      const visual =
        domain.visual[index % domain.visual.length] ||
        visuals[index % visuals.length];
      const questionId = `SRCV4-${String(sequence).padStart(3, "0")}`;
      const sourceDomains =
        storyThread === "portfolio_baseline"
          ? domain.requiredSourceDomains
          : unique([
              ...domain.requiredSourceDomains,
              ...storyDomains(storyThread),
            ]);
      const baseQuestion = domain.question(focus).replace(/\?$/u, "");
      questions.push({
        question_id: questionId,
        domain: domain.key,
        question: `${baseQuestion}, viewed through the lens of ${angle}?`,
        executive_intent: `Support ${articleFor(domain.label)} ${domain.label.toLowerCase()} decision for ${focus}.`,
        required_source_domains: sourceDomains,
        required_measures: domain.measures,
        required_dimensions: domain.dimensions,
        required_grain: domain.grain,
        required_story_thread: storyThread,
        required_evidence_depth: evidenceDepth(domain, index),
        expected_visual: visual,
        expected_drill_path: domain.drillPath,
        allowed_conclusion: allowedConclusion(domain),
        prohibited_overstatement: prohibitedOverstatement(domain),
        expected_action: expectedAction(domain),
        acceptance_rule: `Pass if the answer uses ${domain.cubeViews.join(" or ")} or an approved successor view, returns ${expectedAnswerShape(visual)}, exposes drill members ${domain.drillPath.join(" > ")}, and cites source records for ${sourceDomains.join(", ")}.`,
      });
      sequence += 1;
    }
  }
  return questions;
}

function storyDomains(thread) {
  return (
    {
      portfolio_baseline: [],
      saas_rationalization: ["contract_header", "saas_usage", "financial_line"],
      managed_service_value_leakage: [
        "contract_header",
        "workforce_rate_card",
        "financial_line",
        "service_performance",
      ],
      cloud_commitment_exposure: [
        "contract_header",
        "cloud_consumption",
        "financial_line",
      ],
      app_retirement_contract_conflict: ["contract_header", "scope_mapping"],
      ai_value_proof_gap: [
        "saas_usage",
        "service_performance",
        "financial_line",
      ],
      supplier_bafo_normalization: ["sourcing_event", "supplier_master"],
      evidence_conflict_resolution: ["legal_evidence", "contract_header"],
    }[thread] || []
  );
}

function buildCoverage(questions) {
  return questions.map((question) => {
    const domain = domains.find(
      (candidate) => candidate.key === question.domain,
    );
    const sourceDomains = question.required_source_domains;
    return {
      question_id: question.question_id,
      required_source_files: unique(
        sourceDomains.flatMap(
          (sourceDomain) => sourceFiles[sourceDomain] || [],
        ),
      ),
      required_columns: Object.fromEntries(
        sourceDomains.map((sourceDomain) => [
          sourceDomain,
          columnsByDomain[sourceDomain] || [],
        ]),
      ),
      planted_scenario_records: [
        `${question.required_story_thread}:${question.domain}:case`,
        `${question.required_story_thread}:${question.required_grain}:grain`,
        `${question.required_story_thread}:evidence_depth:${question.required_evidence_depth.min_source_records}`,
      ],
      cube_view: domain.cubeViews[0],
      alternate_cube_views: domain.cubeViews.slice(1),
      required_next_views: domain.nextViews,
      drill_members: question.expected_drill_path,
      expected_answer: expectedAnswerShape(question.expected_visual),
      evidence_requirement: {
        source_record_required: true,
        clause_or_page_required:
          question.required_evidence_depth.clause_or_page_required,
        no_pii: true,
        conflict_behavior: question.domain.includes("evidence")
          ? "withhold_or_dispute"
          : "name_gap_and_continue",
      },
    };
  });
}

function buildModelFitAudit(observedViews, questions) {
  return {
    ...contractMeta,
    observed_cube_views: observedViews,
    audit_basis: [
      "cube/model/source_sourcing.yml",
      "docs/architecture/source/SOURCE_SOURCING_CONTEXT_DEPTH_CONTRACT_2026-08-03.md",
      "docs/source/SKYHARBOR_SOURCE_V4_ROW_DEPTH_CONTRACT.md",
    ],
    domains: domains.map((domain) => {
      const coveredViews = domain.cubeViews.filter((view) =>
        observedViews.includes(view),
      );
      let fitState = "gap";
      if (
        coveredViews.length === domain.cubeViews.length &&
        domain.nextViews.length === 0
      )
        fitState = "covered";
      else if (coveredViews.length > 0) fitState = "partial";
      return {
        domain: domain.key,
        label: domain.label,
        question_count: questions.filter(
          (question) => question.domain === domain.key,
        ).length,
        model_fit_state: fitState,
        current_cube_views: coveredViews,
        required_next_views: domain.nextViews,
        required_source_domains: domain.requiredSourceDomains,
        audit_note:
          fitState === "covered"
            ? "Current Cube views can support the primary rollups and drill path once v4 rows exist."
            : "Current Cube views cover part of the path; v4 should add the listed view(s) only after canary evidence proves the need.",
      };
    }),
  };
}

function buildDoc(distribution, observedViews) {
  const lines = [
    "# SkyHarbor Source v4 Question And Evidence Contract",
    "",
    "**Status:** required before Source v4 canary generation, lab load, Cube activation or aVa question baseline.",
    "",
    "This contract freezes the questions the v4 package must answer before the generator is allowed to create the full 180K-250K row synthetic corpus.",
    "",
    "The row-depth verifier proves that rows are source-shaped. This contract proves that the rows are useful.",
    "",
    "## Required Artifacts",
    "",
    "- `docs/source/skyharbor-v4/source_v4_question_bank.json`",
    "- `docs/source/skyharbor-v4/source_v4_question_coverage_matrix.json`",
    "- `docs/source/skyharbor-v4/source_v4_model_fit_audit.json`",
    "- `scripts/source/verify-skyharbor-v4-question-coverage.mjs`",
    "",
    "## Distribution",
    "",
    "| Domain | Questions |",
    "| --- | ---: |",
    ...distribution
      .map(([domain, count]) => [`| ${domain} | ${count} |`])
      .flat(),
    "",
    "Total: 150 questions.",
    "",
    "## Required Fields Per Question",
    "",
    "Every question carries:",
    "",
    "```text",
    "question_id",
    "domain",
    "question",
    "executive_intent",
    "required_source_domains",
    "required_measures",
    "required_dimensions",
    "required_grain",
    "required_story_thread",
    "required_evidence_depth",
    "expected_visual",
    "expected_drill_path",
    "allowed_conclusion",
    "prohibited_overstatement",
    "expected_action",
    "acceptance_rule",
    "```",
    "",
    "## Coverage Matrix",
    "",
    "Each question maps to source files, columns, planted scenario records, Cube view, drill members, expected answer shape and evidence requirement.",
    "",
    "The matrix is deliberately stricter than a question list. A question without files, columns, planted records or evidence behavior is not a load acceptance question.",
    "",
    "## Model-Fit Position",
    "",
    "Observed Source Cube views in this repo:",
    "",
    ...observedViews.map((view) => `- \`${view}\``),
    "",
    "The audit separates domains already supportable by current Cube views from domains that need canary-proven successor views. New views should be added because a question path fails, not because a diagram looks incomplete.",
    "",
    "## Acceptance",
    "",
    "Run:",
    "",
    "```bash",
    "npm run source:v4:question-coverage:verify",
    "```",
    "",
    "A Source v4 package cannot enter lab unless this gate, the row-depth verifier and the future canary answer proof all pass.",
    "",
    "## Non-Goals",
    "",
    "- No synthetic data generation in this lane.",
    "- No Postgres, Cube runtime or ACA mutation in this lane.",
    "- No claim that current v3 data can answer all 150 questions.",
  ];
  return `${lines.join("\n")}\n`;
}

function buildGeneratorDoc() {
  const lines = [
    "# SkyHarbor Source v4 Generator Design",
    "",
    "**Status:** design specification for the future generator; no rows are generated by this artifact.",
    "",
    "The v4 generator must work backward from the question/evidence contract and forward from the package manifest. Every generated row must satisfy both sides:",
    "",
    "1. It must look like a practical extract from a named system of record.",
    "2. It must support at least one accepted question, drill path, planted story thread, evidence request or quality finding.",
    "",
    "## Generation Order",
    "",
    "1. Load `source_v4_question_bank.json` and `source_v4_question_coverage_matrix.json`.",
    "2. Build a canary plan for 5-8 vendors, 10 contract families, 3-6 months and all seven story threads.",
    "3. Generate source-system-shaped extracts for suppliers, contracts, legal evidence, invoices, SaaS usage, cloud consumption, service performance, workforce/rate cards, sourcing events and scope mappings.",
    "4. Attach lineage fields and deterministic `row_hash` to every row.",
    "5. Run the row-depth verifier.",
    "6. Run the question coverage verifier.",
    "7. Load only into an isolated lab tenant/version after human review.",
    "8. Run Postgres, Cube, Source and aVa question proof.",
    "9. Expand to the 180K-250K row full package only after canary evidence passes.",
    "",
    "## Planted Story Requirements",
    "",
    "The generator must plant connected patterns for:",
    "",
    "- SaaS rationalization",
    "- Managed service value leakage",
    "- Cloud commitment exposure",
    "- Application retirement contract conflict",
    "- AI value proof gap",
    "- Supplier BAFO normalization",
    "- Evidence conflict resolution",
    "",
    "Each story must be reachable through at least three product/Cube paths. A one-row anomaly does not satisfy the story.",
    "",
    "## AI Value Rule",
    "",
    "Copilot, Claude Code, Now Assist and Workday-agent examples must distinguish:",
    "",
    "- license purchased",
    "- seat assigned",
    "- active usage",
    "- baseline metric captured",
    "- post metric captured",
    "- finance validated",
    "- claimable value",
    "",
    "Usage is not value. A productivity claim requires before/after DORA or operational metrics plus agreed attribution and finance validation.",
    "",
    "## Stop Conditions",
    "",
    "Stop generation when:",
    "",
    "- A required question has no source files or columns.",
    "- A story thread cannot reach its required domains.",
    "- A source-system extract would require PII to look realistic.",
    "- A value claim would be inferred from adoption alone.",
    "- Current Cube views cannot support the canary and the required next view is not documented in the model-fit audit.",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const cubeYaml = await fs.readFile(CUBE_MODEL, "utf8");
  const observedViews = extractCubeViews(cubeYaml);
  const questions = buildQuestions();
  const distribution = domains.map((domain) => [
    domain.key,
    questions.filter((question) => question.domain === domain.key).length,
  ]);
  const coverageRows = buildCoverage(questions);
  const modelFit = buildModelFitAudit(observedViews, questions);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, QUESTION_BANK),
    `${JSON.stringify({ ...contractMeta, distribution: Object.fromEntries(distribution), questions }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(OUT_DIR, COVERAGE_MATRIX),
    `${JSON.stringify({ ...contractMeta, rows: coverageRows }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(OUT_DIR, MODEL_FIT_AUDIT),
    `${JSON.stringify(modelFit, null, 2)}\n`,
  );
  await fs.writeFile(CONTRACT_DOC, buildDoc(distribution, observedViews));
  await fs.writeFile(GENERATOR_DOC, buildGeneratorDoc());

  console.log(
    JSON.stringify(
      {
        ok: true,
        out_dir: OUT_DIR,
        question_count: questions.length,
        observed_cube_views: observedViews.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
