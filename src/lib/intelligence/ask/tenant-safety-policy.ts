export interface TenantSafetyRegexPattern {
  factId: string;
  label: string;
  re: RegExp;
}

export interface TenantSafetyPolicy {
  tenantKey: string;
  displayName: string;
  matchKeys: string[];
  retiredAliases: string[];
  staleFactPatterns: TenantSafetyRegexPattern[];
  syntheticOnlyTerms: string[];
  crossTenantForbiddenTerms: string[];
  sourceOnlyCleanupTerms: string[];
}

function literalPattern(
  factId: string,
  label: string,
  term: string,
): TenantSafetyRegexPattern {
  return {
    factId,
    label,
    re: new RegExp(`\\b${escapeRegExp(term).replace(/\\ /g, "\\s+")}\\b`, "i"),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LAKESHORE_STALE_FACTS: TenantSafetyRegexPattern[] = [
  {
    factId: "old_revenue_54_2b",
    label: "Retired Lakeshore revenue $54.2B",
    re: /\$?\s*54\.2\s*(?:B|billion)\b/i,
  },
  {
    factId: "old_employee_count_72000",
    label: "Retired Lakeshore employee count 72,000",
    re: /\b72,?000\s+(?:FTEs?|employees|people|headcount)\b/i,
  },
  {
    factId: "old_plant_count_89",
    label: "Retired Lakeshore plant count 89 manufacturing plants",
    re: /\b89\s+manufacturing\s+plants\b/i,
  },
  {
    factId: "old_tech_budget_1_8b",
    label: "Retired Lakeshore technology budget $1.8B",
    re: /\$?\s*1\.8\s*(?:B|billion)\s+(?:annual\s+)?technology\s+budget\b/i,
  },
  {
    factId: "old_ai_budget_54m",
    label: "Retired Lakeshore AI/data budget $54M",
    re: /\$?\s*54\s*(?:M|million)\s+(?:AI|AI\/data|data)\s+budget\b/i,
  },
];

const POLICIES: TenantSafetyPolicy[] = [
  {
    tenantKey: "apex-retail",
    displayName: "Apex Retail",
    matchKeys: ["apex", "apexretail", "apex-retail"],
    retiredAliases: [],
    staleFactPatterns: [],
    syntheticOnlyTerms: [
      "apexretail-enterprise-context-v1",
      "tenant-overlays/apex-intelligence-layer-overlay",
      "client:tnt_apex_retail",
    ],
    crossTenantForbiddenTerms: [
      "SkyHarbor",
      "IROPS",
      "Lakeshore",
      "Meridian Health",
      "First Capital",
      "Northstar",
      "Morgan Street",
    ],
    sourceOnlyCleanupTerms: ["Apex Retail Group"],
  },
  {
    tenantKey: "meridian-health",
    displayName: "Meridian Health System",
    matchKeys: ["meridian", "meridianhealth", "meridian-health"],
    retiredAliases: [],
    staleFactPatterns: [],
    syntheticOnlyTerms: ["meridian-enterprise-context-v1"],
    crossTenantForbiddenTerms: [
      "SkyHarbor",
      "IROPS",
      "Lakeshore",
      "Apex Retail",
      "First Capital",
      "Northstar",
      "airline",
      "Morgan Street",
    ],
    sourceOnlyCleanupTerms: [
      "Heliara",
      "Heliara Health",
      "Heliara Health Alliance",
    ],
  },
  {
    tenantKey: "first-capital",
    displayName: "First Capital",
    matchKeys: ["firstcapital", "first-capital", "arcturus"],
    retiredAliases: [
      "Arcturus Financial",
      "Arcturus Financial Group",
      "First Capital Financial",
    ],
    staleFactPatterns: [],
    syntheticOnlyTerms: [],
    crossTenantForbiddenTerms: [
      "SkyHarbor",
      "IROPS",
      "Lakeshore",
      "Apex Retail",
      "Meridian Health",
      "Northstar",
      "airline",
      "Morgan Street",
    ],
    sourceOnlyCleanupTerms: [],
  },
  {
    tenantKey: "northstar-clinical",
    displayName: "Northstar Clinical Technologies",
    matchKeys: ["northstar", "northstarclinical", "northstar-clinical"],
    retiredAliases: ["Northstar MedTech"],
    staleFactPatterns: [],
    syntheticOnlyTerms: [],
    crossTenantForbiddenTerms: [
      "SkyHarbor",
      "IROPS",
      "Lakeshore",
      "Apex Retail",
      "Meridian Health",
      "First Capital",
      "airline",
      "Morgan Street",
    ],
    sourceOnlyCleanupTerms: [],
  },
  {
    tenantKey: "skyharbor-air",
    displayName: "Airline Demo",
    matchKeys: ["skyharbor", "skyharborair", "skyharbor-air"],
    retiredAliases: [],
    staleFactPatterns: [],
    syntheticOnlyTerms: ["skyharbor-enterprise-context-v1"],
    crossTenantForbiddenTerms: [
      "Lakeshore",
      "Morgan Street",
      "HarborPoint",
      "Riverton",
      "Keystone",
      "Apex Retail",
      "Meridian Health",
      "First Capital",
      "Northstar",
    ],
    sourceOnlyCleanupTerms: ["SkyHarbor Air Group", "SkyHarbor Airlines"],
  },
  {
    tenantKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    matchKeys: [
      "lakeshore",
      "lakeshoreholdings",
      "lakeshore-holdings",
      "lakeshoreindustries",
      "lakeshore-industries",
    ],
    retiredAliases: [
      "Lakeshore Industries",
      "Lakeshore Holdings Industries",
      "Industrial Demo",
      "Manufacturing Demo",
      "Mona Street",
      "HarborPoint",
      "HarborPoint Packaging Group",
      "Riverton",
      "Riverton Components & Field Services",
      "Keystone Industrial Services",
    ],
    staleFactPatterns: LAKESHORE_STALE_FACTS,
    syntheticOnlyTerms: [
      "lakeshore-industries-synthetic-v6",
      "lakeshore-holdings-synthetic-v6",
      "lakeshore-kyriba-synthetic-v1",
      "synthetic_peer_anchor",
    ],
    crossTenantForbiddenTerms: [
      "SkyHarbor",
      "airline",
      "IROPS",
      "Morgan Street",
      "Apex Retail",
      "Meridian Health",
      "First Capital",
      "Northstar",
    ],
    sourceOnlyCleanupTerms: [],
  },
];

export const INTELLIGENCE_TENANT_SAFETY_POLICIES: TenantSafetyPolicy[] =
  POLICIES.map((policy) => ({
    ...policy,
    matchKeys: Array.from(
      new Set(
        [policy.tenantKey, policy.displayName, ...policy.matchKeys].map(
          normalizePolicyKey,
        ),
      ),
    ),
  }));

export function resolveTenantSafetyPolicy(
  ...keys: Array<string | null | undefined>
): TenantSafetyPolicy | null {
  const normalizedKeys = keys.map(normalizePolicyKey).filter(Boolean);
  for (const key of normalizedKeys) {
    const policy = INTELLIGENCE_TENANT_SAFETY_POLICIES.find((candidate) =>
      candidate.matchKeys.includes(key),
    );
    if (policy) return policy;
  }
  return null;
}

export function tenantSafetyBlockingPatterns(
  policy: TenantSafetyPolicy,
): TenantSafetyRegexPattern[] {
  return [
    ...policy.retiredAliases.map((term) =>
      literalPattern(
        `retired_alias_${normalizePolicyKey(term)}`,
        `Retired ${policy.displayName} alias: ${term}`,
        term,
      ),
    ),
    ...policy.staleFactPatterns,
    ...policy.syntheticOnlyTerms.map((term) =>
      literalPattern(
        `synthetic_only_${normalizePolicyKey(term)}`,
        `Synthetic-only ${policy.displayName} term: ${term}`,
        term,
      ),
    ),
    ...policy.crossTenantForbiddenTerms.map((term) =>
      literalPattern(
        `cross_tenant_${normalizePolicyKey(term)}`,
        `Cross-tenant forbidden term for ${policy.displayName}: ${term}`,
        term,
      ),
    ),
  ];
}

export function normalizePolicyKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}
