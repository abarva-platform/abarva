/**
 * Human-readable labels and grouping order for the raw `domains` tags that appear on every signal
 * and context item (e.g. `vendor_contract`, `application_system`). Used by CurrentState to group
 * "what has been loaded" into a real architecture/operations survey instead of one flat list, and
 * by BrowseTheData's domain filter so the dropdown doesn't show raw snake_case identifiers.
 *
 * Order matters here: it's the display order for CurrentState's category cards, roughly moving
 * from "what the enterprise is" through technology through people through risk/programs/AI --
 * not alphabetical, so a reader scanning top to bottom gets a coherent survey.
 */
export const DOMAIN_LABELS: Record<string, string> = {
  tenant_profile: "Enterprise Profile",
  business_function: "Business Functions",
  application_system: "Applications & Systems",
  data_asset_or_integration: "Data & Integrations",
  infrastructure_platform: "Infrastructure & Platforms",
  vendor_contract: "Vendors & Contracts",
  spend_value_fact: "Spend & Value",
  managed_service_scope: "Managed Services",
  platform_maturity_assessment: "Platform Maturity",
  workforce_role: "Workforce",
  program_initiative: "Programs & Initiatives",
  operational_process_evidence: "Operational Process Evidence",
  metric_outcome: "Metrics & Outcomes",
  risk_or_control: "Risk & Controls",
  relationship_source_row: "Declared Relationships",
  evidence_source: "Evidence Sources",
  ai_automation_use_case: "AI & Automation Use Cases",
  ai_value_realization_signal: "AI Value Realization",
  ai_value_interview_evidence: "AI Value — Interview Evidence",
  ai_tool_usage_observation: "AI Tool Usage",
};

export const DOMAIN_ORDER = Object.keys(DOMAIN_LABELS);

/** A domain this codebase doesn't know a label for yet -- title-cases the raw identifier rather
 * than showing it verbatim, so a newly-added domain never renders as a warty snake_case string
 * before someone gets around to adding it to DOMAIN_LABELS. */
export function domainLabel(domain: string): string {
  if (DOMAIN_LABELS[domain]) return DOMAIN_LABELS[domain];
  return domain
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
