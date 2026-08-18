/**
 * The canonical dimension registry.
 *
 * Every canonical object type, once, with what to call it, which attribute names an instance, and
 * which products read it. It lives in its own module because more than one build reads it — the
 * landscape projector and the orientation pack generator — and importing it from a script means
 * importing that script's side effects along with it.
 *
 * Adding a canonical type without adding it here is the failure this file prevents: the type loads,
 * nothing reads it, and no surface reports it missing.
 */

/**
 * Every canonical object type, with the products that consume it and the attribute that names an
 * instance of it.
 *
 * This registry is the point of the whole exercise. The first version of this file covered only the
 * nine types Home renders, which would have made it the fourth per-module supply chain rather than
 * the one shared projection. A dimension belongs here because it exists in the canonical model, not
 * because a particular screen wants it; `products` records who reads it, and adding a reader is an
 * entry in a list rather than a new pipeline.
 *
 * `nameAttribute` is what a human calls one of these — `systemName`, `vendorName`, `riskOrControlName`.
 * It is how a count becomes an answer: "804 applications" is inventory, "804 applications, including
 * Epic Hyperspace and Kronos" is a landscape.
 *
 * `section` maps the dimension onto the Intelligence advisory sections. Several dimensions share a
 * section — operations draws on process evidence, service performance, and managed service scope —
 * which is correct: a section is a question, and more than one kind of fact can answer it.
 */
type ProductSurface = "home" | "intelligence" | "moves" | "tower" | "source";

export interface LandscapeDimension {
  objectType: string;
  key: string;
  label: string;
  nameAttribute: string;
  /** Intelligence advisory section id, or null when no section asks this question yet. */
  section: string | null;
  products: ProductSurface[];
}

export const LANDSCAPE_DIMENSIONS: LandscapeDimension[] = [
  // THE ENTERPRISE
  { objectType: "tenant_profile", key: "enterprise_profile", label: "Enterprise profile", nameAttribute: "entityName", section: "profile", products: ["home", "intelligence"] },
  { objectType: "business_function", key: "business_functions", label: "Business functions", nameAttribute: "functionName", section: "operating", products: ["home", "intelligence", "moves"] },
  { objectType: "org_owner", key: "org_ownership", label: "Organisation and ownership", nameAttribute: "orgUnit", section: "operating", products: ["home", "intelligence"] },
  { objectType: "workforce_role", key: "workforce_roles", label: "Workforce and roles", nameAttribute: "personaOrRole", section: "workforce", products: ["home", "intelligence"] },

  // THE ESTATE
  { objectType: "application_system", key: "applications", label: "Applications and systems", nameAttribute: "systemName", section: "applications", products: ["home", "intelligence", "source", "tower"] },
  { objectType: "infrastructure_platform", key: "infrastructure", label: "Infrastructure platforms", nameAttribute: "platformName", section: "infrastructure", products: ["home", "intelligence", "tower"] },
  { objectType: "data_asset_or_integration", key: "data_assets", label: "Data assets and integrations", nameAttribute: "dataAssetName", section: "data", products: ["home", "intelligence"] },
  { objectType: "relationship_source_row", key: "integrations", label: "System relationships", nameAttribute: "fromObjectName", section: "integrations", products: ["intelligence"] },
  { objectType: "platform_maturity_assessment", key: "platform_maturity", label: "Platform maturity", nameAttribute: "platformOrCapability", section: "infrastructure", products: ["home", "intelligence"] },

  // MONEY & PARTNERS
  { objectType: "vendor_contract", key: "vendors", label: "Vendors and contracts", nameAttribute: "vendorName", section: "vendors", products: ["intelligence", "source", "tower"] },
  { objectType: "spend_value_fact", key: "spend", label: "Spend and value", nameAttribute: "spendCategory", section: "budget", products: ["intelligence", "source", "tower"] },
  { objectType: "managed_service_scope", key: "managed_services", label: "Managed service scope", nameAttribute: "serviceName", section: "operations", products: ["intelligence", "source"] },

  // AI & RISK
  { objectType: "ai_automation_use_case", key: "ai_use_cases", label: "AI and automation use cases", nameAttribute: "useCaseName", section: "ai", products: ["intelligence", "moves"] },
  { objectType: "ai_tool_usage_observation", key: "ai_tool_usage", label: "AI tool usage", nameAttribute: "toolName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_value_realization_signal", key: "ai_value_signals", label: "AI value signals", nameAttribute: "programName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_kpi_outcome_observation", key: "ai_kpis", label: "AI KPI outcomes", nameAttribute: "kpiName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_value_interview_evidence", key: "ai_interviews", label: "AI value interviews", nameAttribute: "stakeholderRole", section: "ai", products: ["intelligence"] },
  { objectType: "risk_or_control", key: "risks_controls", label: "Risks and controls", nameAttribute: "riskOrControlName", section: "risk", products: ["home", "intelligence"] },
  { objectType: "operational_process_evidence", key: "processes", label: "Operational processes", nameAttribute: "processName", section: "operations", products: ["intelligence", "moves"] },
  { objectType: "service_performance_observation", key: "service_performance", label: "Service performance", nameAttribute: "systemName", section: "operations", products: ["intelligence", "tower"] },

  // OUTSIDE-IN
  { objectType: "industry_context_pattern", key: "industry_patterns", label: "Industry context patterns", nameAttribute: "patternName", section: "benchmarks", products: ["intelligence"] },
  { objectType: "expert_lens", key: "expert_lenses", label: "Expert lenses", nameAttribute: "lensName", section: "benchmarks", products: ["intelligence"] },
  { objectType: "evidence_source", key: "evidence_sources", label: "Evidence sources", nameAttribute: "sourceFile", section: "policies", products: ["home", "intelligence"] },
  { objectType: "semantic_crosswalk_evidence", key: "crosswalk", label: "Semantic crosswalk evidence", nameAttribute: "canonicalObjectName", section: "policies", products: ["intelligence"] },

  // PROGRAMS & OUTCOMES
  { objectType: "program_initiative", key: "programs", label: "Programs and initiatives", nameAttribute: "programName", section: null, products: ["moves", "tower"] },
  { objectType: "metric_outcome", key: "metrics", label: "Metrics and outcomes", nameAttribute: "metricName", section: null, products: ["moves", "tower"] },
];
