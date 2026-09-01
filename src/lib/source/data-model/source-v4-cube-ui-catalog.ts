export const SOURCE_V4_CUBE_DATASET_ID = "skyharbor-source-v4-202608";
export const SOURCE_V4_CUBE_AS_OF_DATE = "2027-06-30";

export type SourceV4QuestionDomain =
  | "executive_portfolio_concentration"
  | "vendor_360"
  | "contract_economics_terms"
  | "spend_invoices_commitments"
  | "saas_cloud_consumption_utilization"
  | "sla_incidents_service_credits"
  | "renewals_notice_leverage"
  | "application_platform_dependencies"
  | "workforce_rate_cards"
  | "cyber_vendor_risk"
  | "sourcing_events_supplier_bafo"
  | "ai_adoption_productivity_value_proof"
  | "evidence_lineage_conflict_missing_proof";

export type SourceV4CubeViewName =
  | "source_v4_executive_portfolio"
  | "source_v4_vendor_concentration"
  | "source_v4_renewal_exposure"
  | "source_v4_scope_confidence"
  | "source_v4_spend_consumption"
  | "source_v4_performance_credits"
  | "source_v4_ai_usage_value_proof"
  | "source_v4_cloud_optimization"
  | "source_v4_workforce_rate_card"
  | "source_v4_sourcing_event_bafo";

export type SourceV4UiLensId =
  | "executive_portfolio"
  | "vendor_concentration"
  | "renewal_exposure"
  | "scope_confidence"
  | "spend_consumption"
  | "performance_credits"
  | "ai_usage_value_proof"
  | "cloud_optimization"
  | "workforce_rate_card"
  | "sourcing_event_bafo";

export interface SourceV4CubeUiLens {
  readonly id: SourceV4UiLensId;
  readonly label: string;
  readonly storyRole: string;
  readonly cubeView: SourceV4CubeViewName;
  readonly requiredIncludes: readonly string[];
  readonly requiredHierarchies: readonly string[];
  readonly defaultHierarchy: string;
  readonly questionDomains: readonly SourceV4QuestionDomain[];
  readonly sourceDomains: readonly string[];
  readonly defaultVisuals: readonly string[];
  readonly defaultDrillPath: readonly string[];
  readonly qlikBehaviors: readonly string[];
  readonly allowedConclusions: readonly string[];
  readonly prohibitedOverstatements: readonly string[];
}

export const SOURCE_V4_CUBE_UI_LENSES: readonly SourceV4CubeUiLens[] = [
  {
    id: "executive_portfolio",
    label: "Executive portfolio",
    storyRole:
      "Start with portfolio size, committed value, renewal posture and context coverage.",
    cubeView: "source_v4_executive_portfolio",
    requiredIncludes: [
      "count",
      "annual_value",
      "total_committed_value",
      "auto_renew_count",
      "notice_90_day_count",
      "v4_contract_portfolio",
      "v4_renewal_calendar",
      "vendors",
      "contracts",
      "scope_rows",
      "invoice_lines",
    ],
    requiredHierarchies: ["v4_contract_portfolio", "v4_renewal_calendar"],
    defaultHierarchy: "v4_contract_portfolio",
    questionDomains: [
      "executive_portfolio_concentration",
      "contract_economics_terms",
      "spend_invoices_commitments",
      "application_platform_dependencies",
      "evidence_lineage_conflict_missing_proof",
    ],
    sourceDomains: [
      "supplier_master",
      "contract_header",
      "financial_line",
      "scope_mapping",
    ],
    defaultVisuals: ["KPI strip", "coverage tiles", "source explorer"],
    defaultDrillPath: [
      "agreement_type",
      "renewal_type",
      "vendor_name",
      "contract_id",
    ],
    qlikBehaviors: [
      "select-to-filter",
      "clear-selection",
      "drill-to-source-record",
    ],
    allowedConclusions: [
      "Portfolio scale, concentration and renewal posture are supportable.",
    ],
    prohibitedOverstatements: [
      "Do not infer recoverable savings or realized value from portfolio totals.",
    ],
  },
  {
    id: "vendor_concentration",
    label: "Vendor concentration",
    storyRole:
      "Show where annual value concentrates by supplier category, strategic status and risk tier.",
    cubeView: "source_v4_vendor_concentration",
    requiredIncludes: [
      "legal_name",
      "supplier_category",
      "strategic_status",
      "risk_tier",
      "annual_value",
      "contract_count",
      "v4_vendor_portfolio",
    ],
    requiredHierarchies: ["v4_vendor_portfolio"],
    defaultHierarchy: "v4_vendor_portfolio",
    questionDomains: [
      "executive_portfolio_concentration",
      "vendor_360",
      "cyber_vendor_risk",
    ],
    sourceDomains: [
      "supplier_master",
      "contract_header",
      "financial_line",
      "service_performance",
    ],
    defaultVisuals: ["Pareto bar", "vendor cards", "risk-tier matrix"],
    defaultDrillPath: [
      "supplier_category",
      "strategic_status",
      "risk_tier",
      "legal_name",
    ],
    qlikBehaviors: [
      "associative-category-filter",
      "top-n-toggle",
      "vendor-drill",
    ],
    allowedConclusions: [
      "Dependency and concentration can be named when they trace to vendor and contract rows.",
    ],
    prohibitedOverstatements: [
      "Do not treat high spend alone as vendor fault, risk, or savings potential.",
    ],
  },
  {
    id: "renewal_exposure",
    label: "Renewal exposure",
    storyRole: "Turn dates and clauses into an actionable renewal calendar.",
    cubeView: "source_v4_renewal_exposure",
    requiredIncludes: [
      "contract_id",
      "vendor_name",
      "renewal_type",
      "expiration_date",
      "notice_deadline",
      "auto_renew",
      "annual_value",
      "notice_90_day_count",
      "v4_renewal_calendar",
    ],
    requiredHierarchies: ["v4_renewal_calendar"],
    defaultHierarchy: "v4_renewal_calendar",
    questionDomains: [
      "renewals_notice_leverage",
      "contract_economics_terms",
      "vendor_360",
    ],
    sourceDomains: ["contract_header", "legal_evidence", "financial_line"],
    defaultVisuals: [
      "timeline",
      "notice-deadline table",
      "auto-renew exposure cards",
    ],
    defaultDrillPath: [
      "renewal_type",
      "auto_renew",
      "notice_deadline",
      "expiration_date",
      "vendor_name",
      "contract_id",
    ],
    qlikBehaviors: ["date-window-brush", "auto-renew-toggle", "contract-drill"],
    allowedConclusions: [
      "Open and missed decision windows can be named from contract terms.",
    ],
    prohibitedOverstatements: [
      "Do not state negotiation outcome or legal recoverability without reviewed evidence.",
    ],
  },
  {
    id: "scope_confidence",
    label: "Application and platform scope",
    storyRole:
      "Separate explicit scope evidence from inferred relationships before the UI ranks dependencies.",
    cubeView: "source_v4_scope_confidence",
    requiredIncludes: [
      "contract_id",
      "scope_type",
      "scope_name",
      "criticality",
      "relationship_method",
      "count",
      "explicit_scope_count",
      "inferred_scope_count",
      "average_relationship_confidence",
      "v4_scope_confidence",
    ],
    requiredHierarchies: ["v4_scope_confidence"],
    defaultHierarchy: "v4_scope_confidence",
    questionDomains: [
      "application_platform_dependencies",
      "vendor_360",
      "evidence_lineage_conflict_missing_proof",
    ],
    sourceDomains: ["scope_mapping", "contract_header", "supplier_master"],
    defaultVisuals: ["dependency heat map", "confidence split", "scope table"],
    defaultDrillPath: [
      "scope_type",
      "criticality",
      "relationship_method",
      "scope_name",
      "contract_id",
    ],
    qlikBehaviors: [
      "confidence-filter",
      "criticality-filter",
      "scope-record-drill",
    ],
    allowedConclusions: [
      "Explicit and inferred dependency coverage can be compared.",
    ],
    prohibitedOverstatements: [
      "Do not promote inferred relationships to confirmed application ownership.",
    ],
  },
  {
    id: "spend_consumption",
    label: "Spend and invoice consumption",
    storyRole:
      "Bridge contract value to invoice lines, cost centers, matching state and off-contract spend.",
    cubeView: "source_v4_spend_consumption",
    requiredIncludes: [
      "contract_id",
      "vendor_id",
      "business_unit",
      "cost_center",
      "matching_state",
      "month",
      "invoice_lines",
      "actual_spend",
      "committed_amount",
      "off_contract_spend",
      "v4_spend_consumption",
    ],
    requiredHierarchies: ["v4_spend_consumption"],
    defaultHierarchy: "v4_spend_consumption",
    questionDomains: [
      "spend_invoices_commitments",
      "contract_economics_terms",
      "saas_cloud_consumption_utilization",
    ],
    sourceDomains: ["financial_line", "contract_header", "supplier_master"],
    defaultVisuals: [
      "monthly spend bars",
      "matching-state stack",
      "off-contract table",
    ],
    defaultDrillPath: [
      "business_unit",
      "cost_center",
      "matching_state",
      "vendor_id",
      "contract_id",
      "month",
    ],
    qlikBehaviors: [
      "month-brush",
      "matching-state-toggle",
      "invoice-line-drill",
    ],
    allowedConclusions: [
      "Actual spend, committed spend and off-contract spend can be reconciled by month.",
    ],
    prohibitedOverstatements: [
      "Do not call variance savings without entitlement, baseline and finance validation.",
    ],
  },
  {
    id: "performance_credits",
    label: "SLA and service credits",
    storyRole:
      "Reveal service-credit leakage by separating calculated, claimed and recovered credits.",
    cubeView: "source_v4_performance_credits",
    requiredIncludes: [
      "contract_id",
      "metric_name",
      "period_start",
      "breach_count",
      "credit_calculated",
      "credit_claimed",
      "credit_recovered",
      "unclaimed_credit",
      "v4_service_credit_path",
    ],
    requiredHierarchies: ["v4_service_credit_path"],
    defaultHierarchy: "v4_service_credit_path",
    questionDomains: [
      "sla_incidents_service_credits",
      "vendor_360",
      "cyber_vendor_risk",
    ],
    sourceDomains: [
      "service_performance",
      "contract_header",
      "legal_evidence",
      "financial_line",
    ],
    defaultVisuals: ["credit waterfall", "breach trend", "metric detail table"],
    defaultDrillPath: [
      "metric_name",
      "claim_state",
      "dispute_status",
      "contract_id",
      "period_start",
    ],
    qlikBehaviors: ["metric-filter", "period-brush", "credit-state-drill"],
    allowedConclusions: [
      "Unclaimed service-credit exposure can be named when calculated and claimed fields diverge.",
    ],
    prohibitedOverstatements: [
      "Do not state credits are recoverable cash without legal and vendor-acceptance evidence.",
    ],
  },
  {
    id: "ai_usage_value_proof",
    label: "AI usage and value proof",
    storyRole:
      "Show whether tools such as copilots and coding assistants have usage, baselines and finance proof.",
    cubeView: "source_v4_ai_usage_value_proof",
    requiredIncludes: [
      "product_name",
      "function_ref",
      "finance_validation_state",
      "claimable_value_state",
      "baseline_metric_state",
      "period_start",
      "assigned_seats",
      "active_users",
      "actual_cost",
      "claimable_rows",
      "v4_ai_usage_value_proof",
    ],
    requiredHierarchies: ["v4_ai_usage_value_proof"],
    defaultHierarchy: "v4_ai_usage_value_proof",
    questionDomains: [
      "ai_adoption_productivity_value_proof",
      "saas_cloud_consumption_utilization",
      "evidence_lineage_conflict_missing_proof",
    ],
    sourceDomains: [
      "saas_usage",
      "contract_header",
      "financial_line",
      "tower_value_claims",
    ],
    defaultVisuals: [
      "usage funnel",
      "cost-by-tool bars",
      "value-proof state matrix",
    ],
    defaultDrillPath: [
      "product_name",
      "function_ref",
      "baseline_metric_state",
      "finance_validation_state",
      "claimable_value_state",
      "period_start",
    ],
    qlikBehaviors: [
      "tool-filter",
      "function-filter",
      "proof-state-toggle",
      "period-brush",
    ],
    allowedConclusions: [
      "Usage, adoption, cost and claimability state can be shown separately.",
    ],
    prohibitedOverstatements: [
      "Do not claim developer productivity improved from active users alone.",
      "Do not render unknown or unvalidated value as zero.",
      "Do not mark claimable value unless baseline and finance validation support it.",
    ],
  },
  {
    id: "cloud_optimization",
    label: "Cloud optimization",
    storyRole:
      "Connect Azure cost rows to commitment type, service, region and overage posture.",
    cubeView: "source_v4_cloud_optimization",
    requiredIncludes: [
      "service_name",
      "region",
      "commitment_type",
      "optimization_recommendation_state",
      "period_start",
      "actual_cost",
      "amortized_cost",
      "overage_amount",
      "v4_cloud_optimization",
    ],
    requiredHierarchies: ["v4_cloud_optimization"],
    defaultHierarchy: "v4_cloud_optimization",
    questionDomains: [
      "saas_cloud_consumption_utilization",
      "spend_invoices_commitments",
    ],
    sourceDomains: ["cloud_consumption", "financial_line", "contract_header"],
    defaultVisuals: [
      "service-cost treemap",
      "commitment-overage bars",
      "monthly trend",
    ],
    defaultDrillPath: [
      "service_name",
      "region",
      "commitment_type",
      "optimization_recommendation_state",
      "period_start",
    ],
    qlikBehaviors: [
      "service-filter",
      "region-filter",
      "commitment-toggle",
      "period-brush",
    ],
    allowedConclusions: [
      "Cost, amortization and overage can be compared at service and region grain.",
    ],
    prohibitedOverstatements: [
      "Do not call an optimization recommendation a realized saving.",
    ],
  },
  {
    id: "workforce_rate_card",
    label: "Workforce and rate cards",
    storyRole:
      "Expose where roles, locations, rates and approvals diverge from governed rate-card terms.",
    cubeView: "source_v4_workforce_rate_card",
    requiredIncludes: [
      "contract_id",
      "role_title",
      "level",
      "location",
      "approval_state",
      "rate_card_amendment_exists",
      "hours",
      "bill_rate",
      "unapproved_variance_count",
      "v4_rate_card_path",
    ],
    requiredHierarchies: ["v4_rate_card_path"],
    defaultHierarchy: "v4_rate_card_path",
    questionDomains: ["workforce_rate_cards", "contract_economics_terms"],
    sourceDomains: [
      "workforce_rate_card",
      "contract_header",
      "legal_evidence",
      "financial_line",
    ],
    defaultVisuals: [
      "role-location heat map",
      "approval-state table",
      "variance bar",
    ],
    defaultDrillPath: [
      "role_title",
      "level",
      "location",
      "approval_state",
      "contract_id",
    ],
    qlikBehaviors: [
      "role-filter",
      "location-filter",
      "approval-toggle",
      "rate-card-drill",
    ],
    allowedConclusions: [
      "Unapproved variance counts can be flagged for review.",
    ],
    prohibitedOverstatements: [
      "Do not state overbilling without reviewed rate-card and invoice evidence.",
    ],
  },
  {
    id: "sourcing_event_bafo",
    label: "Sourcing event and BAFO",
    storyRole:
      "Tie events, rounds, supplier responses, comparability and weighted scores into a negotiation path.",
    cubeView: "source_v4_sourcing_event_bafo",
    requiredIncludes: [
      "event_id",
      "event_type",
      "stage",
      "round",
      "supplier_id",
      "response_status",
      "bafo_marker",
      "comparability_flag",
      "normalized_cost",
      "line_item_cost",
      "weighted_score",
      "v4_sourcing_event_path",
    ],
    requiredHierarchies: ["v4_sourcing_event_path"],
    defaultHierarchy: "v4_sourcing_event_path",
    questionDomains: [
      "sourcing_events_supplier_bafo",
      "renewals_notice_leverage",
    ],
    sourceDomains: [
      "sourcing_event",
      "supplier_response",
      "financial_line",
      "contract_header",
    ],
    defaultVisuals: [
      "BAFO scorecard",
      "supplier comparison table",
      "round progression",
    ],
    defaultDrillPath: [
      "event_type",
      "stage",
      "round",
      "response_status",
      "supplier_id",
      "bafo_marker",
      "event_id",
    ],
    qlikBehaviors: [
      "event-filter",
      "round-filter",
      "supplier-filter",
      "comparison-drill",
    ],
    allowedConclusions: [
      "Supplier comparability, BAFO state and score posture can be shown at event grain.",
    ],
    prohibitedOverstatements: [
      "Do not state award recommendation without documented evaluation and approval evidence.",
    ],
  },
] as const;

export const SOURCE_V4_CUBE_UI_LENS_BY_ID: Readonly<
  Record<SourceV4UiLensId, SourceV4CubeUiLens>
> = Object.freeze(
  SOURCE_V4_CUBE_UI_LENSES.reduce(
    (acc, lens) => ({ ...acc, [lens.id]: lens }),
    {} as Record<SourceV4UiLensId, SourceV4CubeUiLens>,
  ),
);

export function sourceV4CubeLensesForDomain(
  domain: SourceV4QuestionDomain,
): readonly SourceV4CubeUiLens[] {
  return SOURCE_V4_CUBE_UI_LENSES.filter((lens) =>
    lens.questionDomains.includes(domain),
  );
}

export function sourceV4CubeViewsForDomain(
  domain: SourceV4QuestionDomain,
): readonly SourceV4CubeViewName[] {
  return sourceV4CubeLensesForDomain(domain).map((lens) => lens.cubeView);
}

export function sourceV4CubeUiCatalogForAgent(
  options: { readonly datasetId?: string | null } = {},
) {
  return {
    datasetId: options.datasetId?.trim() || "source-v4-cube-ui-catalog",
    asOfDate: SOURCE_V4_CUBE_AS_OF_DATE,
    lenses: SOURCE_V4_CUBE_UI_LENSES.map((lens) => ({
      id: lens.id,
      label: lens.label,
      cubeView: lens.cubeView,
      storyRole: lens.storyRole,
      defaultHierarchy: lens.defaultHierarchy,
      defaultDrillPath: lens.defaultDrillPath,
      qlikBehaviors: lens.qlikBehaviors,
      allowedConclusions: lens.allowedConclusions,
      prohibitedOverstatements: lens.prohibitedOverstatements,
    })),
  };
}
