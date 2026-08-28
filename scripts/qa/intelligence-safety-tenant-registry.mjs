export const INTELLIGENCE_SAFETY_TENANTS = {
  apexretail: {
    registryKey: "apexretail",
    canonicalKey: "apex-retail",
    clientKey: "apexretail",
    displayName: "Apex Retail",
    testPersonaEnv: "APEX_PERSONA_EMAIL",
    testPersonaEmail: "apexretail-agent@abarva.example.com",
    industry: "retail / stores / ecommerce / supply chain",
    active: true,
    retiredAliases: [],
    bannedAliases: [],
    sourceOnlyCleanupTerms: ["Apex Retail Group"],
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
    knownRetiredFacts: [],
  },
  meridian: {
    registryKey: "meridian",
    canonicalKey: "meridian-health",
    clientKey: "meridian",
    displayName: "Meridian Health System",
    testPersonaEnv: "MERIDIAN_PERSONA_EMAIL",
    testPersonaEmail: "meridian-agent@abarva.example.com",
    industry:
      "healthcare provider / payer operations / clinical transformation",
    active: true,
    retiredAliases: [],
    bannedAliases: [],
    sourceOnlyCleanupTerms: [
      "Heliara",
      "Heliara Health",
      "Heliara Health Alliance",
    ],
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
    knownRetiredFacts: [],
  },
  firstcapital: {
    registryKey: "firstcapital",
    canonicalKey: "first-capital",
    clientKey: "arcturus",
    displayName: "First Capital",
    testPersonaEnv: "FIRSTCAPITAL_PERSONA_EMAIL",
    testPersonaEmail: "arcturus-agent@abarva.example.com",
    industry: "financial services / banking / risk and compliance",
    active: true,
    retiredAliases: [
      "Arcturus Financial",
      "Arcturus Financial Group",
      "First Capital Financial",
    ],
    bannedAliases: [
      "Arcturus Financial",
      "Arcturus Financial Group",
      "First Capital Financial",
    ],
    sourceOnlyCleanupTerms: [],
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
    knownRetiredFacts: [],
  },
  northstar: {
    registryKey: "northstar",
    canonicalKey: "northstar-clinical",
    clientKey: "northstar",
    displayName: "Northstar Clinical Technologies",
    testPersonaEnv: "NORTHSTAR_PERSONA_EMAIL",
    testPersonaEmail: "northstar-agent@abarva.example.com",
    industry: "healthcare medtech / devices / product operations",
    active: true,
    retiredAliases: ["Northstar MedTech"],
    bannedAliases: ["Northstar MedTech"],
    sourceOnlyCleanupTerms: [],
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
    knownRetiredFacts: [],
  },
  skyharbor: {
    registryKey: "skyharbor",
    canonicalKey: "skyharbor-air",
    clientKey: "skyharbor",
    displayName: "SkyHarbor Air",
    testPersonaEnv: "SKYHARBOR_PERSONA_EMAIL",
    testPersonaEmail: "skyharbor-agent@abarva.example.com",
    industry: "airline / aviation operations / crew and IROPS",
    active: true,
    retiredAliases: [],
    bannedAliases: [],
    sourceOnlyCleanupTerms: ["SkyHarbor Air Group", "SkyHarbor Airlines"],
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
    knownRetiredFacts: [],
  },
  lakeshore: {
    registryKey: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    clientKey: "lakeshore",
    displayName: "Lakeshore Holdings",
    testPersonaEnv: "LAKESHORE_DEMO_QA_EMAIL",
    testPersonaEmail: "lakeshore-agent@abarva.example.com",
    industry:
      "diversified holding company / shared services / industrial portfolio",
    active: true,
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
    bannedAliases: [
      "Lakeshore Industries",
      "Lakeshore Holdings Industries",
      "Industrial Demo",
      "Manufacturing Demo",
      "Mona Street",
    ],
    sourceOnlyCleanupTerms: [],
    staleFactPatterns: [
      { label: "old_revenue_54_2b", re: /\$?54\.2B\b|\b54\.2\s*billion\b/i },
      {
        label: "old_employee_count_72000",
        re: /\b72,?000\s+(?:FTEs?|employees|people)\b/i,
      },
      { label: "old_plant_count_89", re: /\b89\s+manufacturing\s+plants\b/i },
      {
        label: "old_tech_budget_1_8b",
        re: /\$?1\.8B\s+(?:annual\s+)?technology\s+budget\b/i,
      },
      {
        label: "old_ai_budget_54m",
        re: /\$54M\s+(?:AI|AI\/data|data)\s+budget\b/i,
      },
    ],
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
      "HarborPoint",
      "Riverton",
      "Keystone",
      "Apex Retail",
      "Meridian Health",
      "First Capital",
      "Northstar",
    ],
    knownRetiredFacts: [
      "Lakeshore Industries",
      "$54.2B revenue",
      "72,000 employees",
      "89 manufacturing plants",
      "$1.8B annual technology budget",
      "$54M AI/data budget",
    ],
  },
  "morgan-street-equivalent": {
    registryKey: "morgan-street-equivalent",
    canonicalKey: "lakeshore-holdings",
    clientKey: "lakeshore",
    displayName: "Morgan Street equivalent (Lakeshore Holdings)",
    testPersonaEnv: "LAKESHORE_DEMO_QA_EMAIL",
    testPersonaEmail: "lakeshore-agent@abarva.example.com",
    industry: "diversified holding company / Morgan Street-shape equivalent",
    active: false,
    aliasOf: "lakeshore",
    discoveryNote:
      "Morgan Street is not a separate reachable Intelligence client in this runtime; Lakeshore Holdings is the Morgan Street-shape equivalent.",
    retiredAliases: ["Morgan Street", "Mona Street", "Lakeshore Industries"],
    bannedAliases: ["Morgan Street", "Mona Street", "Lakeshore Industries"],
    sourceOnlyCleanupTerms: [],
    staleFactPatterns: [
      { label: "old_revenue_54_2b", re: /\$?54\.2B\b|\b54\.2\s*billion\b/i },
      {
        label: "old_employee_count_72000",
        re: /\b72,?000\s+(?:FTEs?|employees|people)\b/i,
      },
    ],
    syntheticOnlyTerms: [
      "synthetic_peer_anchor",
      "lakeshore-industries-synthetic-v6",
    ],
    crossTenantForbiddenTerms: ["SkyHarbor", "airline", "IROPS"],
    knownRetiredFacts: ["Lakeshore Industries", "Morgan Street"],
  },
};

export const ACTIVE_INTELLIGENCE_SAFETY_TENANT_KEYS = Object.entries(
  INTELLIGENCE_SAFETY_TENANTS,
)
  .filter(([, tenant]) => tenant.active)
  .map(([key]) => key);

export function normalizeSafetyTenantKey(key) {
  const k = String(key ?? "")
    .toLowerCase()
    .replace(/[_\s-]/g, "");
  if (k.includes("morgan") || k.includes("monastreet"))
    return "morgan-street-equivalent";
  if (k.includes("lake")) return "lakeshore";
  if (k.includes("sky")) return "skyharbor";
  if (k.includes("apex")) return "apexretail";
  if (k.includes("meridian")) return "meridian";
  if (k.includes("first") || k.includes("arcturus")) return "firstcapital";
  if (k.includes("northstar")) return "northstar";
  return String(key ?? "").toLowerCase();
}

export function resolveSafetyTenant(key) {
  const normalized = normalizeSafetyTenantKey(key);
  return INTELLIGENCE_SAFETY_TENANTS[normalized] ?? null;
}

export function safetyTenantEmail(tenant, env = process.env) {
  return (
    env.INTEL_AUDIT_EMAIL ??
    (tenant.testPersonaEnv ? env[tenant.testPersonaEnv] : undefined) ??
    tenant.testPersonaEmail
  );
}
