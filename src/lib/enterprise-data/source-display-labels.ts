export interface SourceDisplayLabelInput {
  sourcePath?: string | null;
  evidenceId?: string | null;
  canonicalDomain?: string | null;
  domain?: string | null;
  fallback?: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  enterprise_profile: "Enterprise Profile",
  business_functions: "Business Functions",
  functions: "Business Functions",
  org_ownership: "Organization & Ownership",
  workforce_roles: "Workforce Roles",
  applications_systems: "Applications & Systems",
  data_assets_integrations: "Data Assets & Integrations",
  infrastructure_platforms: "Infrastructure & Platforms",
  vendors_contracts: "Vendors & Contracts",
  spend_value: "Spend & Value",
  programs_initiatives: "Programs & Initiatives",
  programs_priorities: "Programs & Initiatives",
  ai_automation_use_cases: "AI & Automation Use Cases",
  ai_initiatives: "AI & Automation Use Cases",
  risks_controls: "Risks & Controls",
  relationships: "Relationships",
  evidence_sources: "Evidence Sources",
  metrics_outcomes: "Metrics & Outcomes",
  industry_context_patterns: "Industry Context Patterns",
  expert_lenses: "Expert Lenses",
  service_scope_managed_services: "Service Scope & Managed Services",
  operational_process_evidence: "Operational Process Evidence",
};

const SOURCE_PATTERNS: Array<[RegExp, string]> = [
  [/enterprise[_-]profile|portfolio[_-]entity[_-]registry/i, "Enterprise Profile"],
  [/business[_-]functions|business[_-]capabilities/i, "Business Functions"],
  [/org[_-]ownership|org[_-]roles|team[_-]topology/i, "Organization & Ownership"],
  [/workforce[_-](roles|personas)|personas/i, "Workforce Roles"],
  [/applications[_-]systems|application[_-]portfolio|apps?[_-]systems?/i, "Applications & Systems"],
  [/data[_-]assets?[_-]integrations?|integration[_-]topology|data[_-]inventory/i, "Data Assets & Integrations"],
  [/infrastructure|cloud[_-]estate|data[_-]center|platforms?/i, "Infrastructure & Platforms"],
  [/vendors?[_-]contracts?|vendor[_-]contracts?/i, "Vendors & Contracts"],
  [/spend[_-]value|it[_-]financials|financial[_-]kpi|rate[_-]card|cost[_-]basis/i, "Spend & Value"],
  [/ai[_-](automation[_-])?use[_-]cases|ai[_-]initiatives|ai[_-]tooling/i, "AI & Automation Use Cases"],
  [/programs?[_-]initiatives?|initiatives\.csv|business[_-]priorities/i, "Programs & Initiatives"],
  [/risks?[_-]controls?|operations[_-]risk[_-]controls|qms|controls?/i, "Risks & Controls"],
  [/relationships?|graph[_-]edges?|bridge/i, "Relationships"],
  [/evidence[_-]sources|source[_-]evidence[_-]registry|chunk[_-]retrieval[_-]registry/i, "Evidence Sources"],
  [/metrics?[_-]outcomes?|metric[_-]definitions|dora[_-]baseline|sla[_-]register/i, "Metrics & Outcomes"],
  [/industry[_-](context|corpus|market|knowledge)[_-]patterns|market[_-]corpus/i, "Industry Context Patterns"],
  [/expert[_-]lenses/i, "Expert Lenses"],
  [/service[_-](scope|tower)[_-]managed[_-]services|managed[_-]services[_-]scope/i, "Service Scope & Managed Services"],
  [/operational[_-]evidence|process[_-]intelligence|incidents/i, "Operational Process Evidence"],
];

export function sourceDisplayLabelFor(input: SourceDisplayLabelInput): string {
  const domain = normalizeDomain(input.canonicalDomain ?? input.domain);
  if (domain && DOMAIN_LABELS[domain]) return DOMAIN_LABELS[domain];

  const candidates = [input.sourcePath, input.evidenceId].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  for (const candidate of candidates) {
    for (const [pattern, label] of SOURCE_PATTERNS) {
      if (pattern.test(candidate)) return label;
    }
  }

  return input.fallback ?? "Tenant Evidence";
}

export function technicalSourceFileFor(sourcePath?: string | null): string | undefined {
  if (!sourcePath) return undefined;
  const normalized = sourcePath.split("#")[0]?.split("@")[0]?.trim();
  if (!normalized) return undefined;
  return normalized.split(/[\\/]/).filter(Boolean).at(-1);
}

export function containsLegacyVersionLabel(value: string): boolean {
  return /\bV[467][_-]|\bV[467]\b|\/(?:current-state-pack|rich-enterprise-pack|rich-substrate-pack|upgrade-candidate-pack|holdco-pack|enterprise-pack)\//i.test(
    value,
  );
}

function normalizeDomain(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
