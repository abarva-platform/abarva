import type {
  HomeV6BrowserPreview,
  HomeV6BrowserSourceRow,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";

export type HomeV6ContextFindingClaimBasis =
  | "tenant_fact"
  | "calculated"
  | "abarva_assessment"
  | "industry_pattern"
  | "mixed";

export type HomeV6ContextFindingSurface =
  "home" | "intelligence" | "tower" | "source" | "moves";

export interface HomeV6ContextFinding {
  findingId: string;
  tenantKey: string;
  tenantDisplayName: string;
  title: string;
  executiveFinding: string;
  whyItMatters: string;
  supportingDimensions: string[];
  sourceFiles: string[];
  sourceRowCount: number;
  evidenceRefs: Array<{
    v6File: string;
    rowId: string;
    label: string;
    claimSupported: string;
  }>;
  evidenceGaps: string[];
  confidence: "high" | "medium" | "low";
  claimBasis: HomeV6ContextFindingClaimBasis;
  patternContextUsed: boolean;
  recommendedSurface: HomeV6ContextFindingSurface;
  recommendedQuestion: string;
}

interface FindingRecipe {
  id: string;
  dimensions: string[];
  terms: string[];
  title: string;
  finding: string;
  why: string;
  claimBasis: HomeV6ContextFindingClaimBasis;
  patternContextUsed?: boolean;
  recommendedSurface: HomeV6ContextFindingSurface;
  recommendedQuestion: string;
}

const AIRLINE_RECIPES: FindingRecipe[] = [
  {
    id: "airline-operational-resilience",
    dimensions: [
      "Applications & Core Systems",
      "Data & Analytics Estate",
      "Integrations & Interfaces",
      "Operations & Service",
    ],
    terms: ["irops", "irregular", "recovery", "passenger", "pnr", "itinerary"],
    title: "Operational resilience depends on governed recovery data.",
    finding:
      "The strongest Airline Demo context points to IROPS, passenger itinerary, and integration dependencies as the control point for operational AI.",
    why: "Autonomous or semi-autonomous recovery work should not scale until the systems, data products, and interfaces behind disruption decisions have ownership, freshness, and lineage evidence.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "intelligence",
    recommendedQuestion:
      "Which IROPS and recovery-data dependencies should be fixed before agentic operations scale?",
  },
  {
    id: "airline-ai-readiness",
    dimensions: [
      "AI & Automation Footprint",
      "AI Governance & Policy",
      "Benefits Realization",
      "Risk & RAID Log",
    ],
    terms: ["copilot", "agent", "ai", "automation", "model", "readiness"],
    title: "AI readiness is visible, but value proof is still the gate.",
    finding:
      "The V6 AI rows show active AI and automation context, but readiness, governance, and value evidence need to travel together before scale decisions.",
    why: "This keeps the demo honest: Home can show loaded AI activity and the gaps around adoption, controls, and value, while Tower or Intelligence should own the scale decision.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "tower",
    recommendedQuestion:
      "Which AI initiatives have enough readiness, adoption, and value evidence for Tower to scale or hold?",
  },
  {
    id: "airline-system-data-dependency",
    dimensions: [
      "Applications & Core Systems",
      "Data & Analytics Estate",
      "Integrations & Interfaces",
      "Industry Benchmarks",
    ],
    terms: ["mainframe", "teradata", "sas", "bi", "data", "lineage", "api"],
    title:
      "System modernization and data dependency should be treated as one decision.",
    finding:
      "The V6 context connects legacy systems, analytics platforms, and integration rows; modernization choices should be sequenced around dependency risk, not isolated platform preference.",
    why: "The industry-pattern context can help frame options, but the tenant proof needs the V6 rows that show which systems, data assets, and interfaces are actually in play.",
    claimBasis: "mixed",
    patternContextUsed: true,
    recommendedSurface: "moves",
    recommendedQuestion:
      "What sequence of system, data, and integration work should become the first modernization Move?",
  },
  {
    id: "airline-customer-recovery-controls",
    dimensions: [
      "Business & Operating Model",
      "Data & Analytics Estate",
      "Security & Compliance",
      "Industry Benchmarks",
    ],
    terms: ["customer", "identity", "consent", "cdp", "recovery", "control"],
    title: "Customer recovery AI needs identity and control evidence.",
    finding:
      "Customer-facing AI should be framed around recoverability, consent, and identity governance before it becomes a personalization or service automation story.",
    why: "That distinction matters because pattern context is useful for options, but tenant proof must come from loaded identity, data, and control rows.",
    claimBasis: "mixed",
    patternContextUsed: true,
    recommendedSurface: "source",
    recommendedQuestion:
      "Which customer-data systems and vendor contracts should Source validate before customer AI scale?",
  },
];

const INDUSTRIAL_RECIPES: FindingRecipe[] = [
  {
    id: "industrial-treasury-modernization",
    dimensions: [
      "Applications & Core Systems",
      "Vendors & Contracts",
      "Initiatives & Roadmap",
      "Operations & Service",
    ],
    terms: ["kyriba", "treasury", "cash", "payment", "bank"],
    title: "Treasury modernization is a control-evidence story.",
    finding:
      "The V6 rows make treasury modernization visible across systems, vendors, initiatives, and operating controls.",
    why: "This should be presented as a governed rollout with evidence gates, not as a generic finance transformation or AI use case.",
    claimBasis: "tenant_fact",
    recommendedSurface: "source",
    recommendedQuestion:
      "Which treasury vendors, controls, and rollout evidence should Source validate before action?",
  },
  {
    id: "industrial-erp-finance-data",
    dimensions: [
      "Applications & Core Systems",
      "Data & Analytics Estate",
      "Integrations & Interfaces",
      "Risk & RAID Log",
    ],
    terms: ["erp", "oracle", "sap", "ap", "ar", "gl", "finance", "feed"],
    title: "Finance value depends on ERP and data dependency proof.",
    finding:
      "The V6 context links finance systems, data assets, integrations, and risk controls, so value claims should be gated on feed quality and ownership.",
    why: "This gives executives a better question than whether the tool is live: whether finance data is governed enough to support decisions and automation.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "intelligence",
    recommendedQuestion:
      "Which ERP, AP, AR, GL, and data dependencies should be fixed before finance AI decisions?",
  },
  {
    id: "industrial-liquidity-forecasting",
    dimensions: [
      "Data & Analytics Estate",
      "Business Metrics",
      "Benefits Realization",
      "AI & Automation Footprint",
    ],
    terms: ["liquidity", "forecast", "cash", "working", "capital", "metric"],
    title: "Liquidity forecasting should stay gated on finance data readiness.",
    finding:
      "The V6 substrate shows finance-data and value-measurement context, but forecasting should stay evidence-gated until metric ownership and data readiness are clear.",
    why: "Home can surface the opportunity and the gaps; Tower should own whether value is provable and ready to track.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "tower",
    recommendedQuestion:
      "What finance-data and value proof does Tower need before liquidity forecasting is board-ready?",
  },
  {
    id: "industrial-finance-ai-controls",
    dimensions: [
      "AI & Automation Footprint",
      "AI Governance & Policy",
      "Security & Compliance",
      "Industry Benchmarks",
    ],
    terms: ["finance", "ai", "close", "report", "control", "governance"],
    title: "Finance AI should not outrun controls and board-grade proof.",
    finding:
      "The V6 context ties AI, governance, controls, and industry-pattern context together; the safe executive message is to prove controls before claiming finance AI value.",
    why: "Pattern context can shape the benchmark, but tenant proof still needs loaded control, metric, and value evidence.",
    claimBasis: "mixed",
    patternContextUsed: true,
    recommendedSurface: "moves",
    recommendedQuestion:
      "What Move should sequence finance AI controls, evidence, and executive proof?",
  },
];

const GENERIC_RECIPES: FindingRecipe[] = [
  {
    id: "generic-system-data-risk",
    dimensions: [
      "Applications & Core Systems",
      "Data & Analytics Estate",
      "Risk & RAID Log",
    ],
    terms: ["data", "system", "risk", "owner", "quality"],
    title: "System and data readiness are the main context gate.",
    finding:
      "The V6 rows show enough system and data context to orient questions, while gaps identify where decisions need stronger evidence.",
    why: "This lets Home guide the user to the right follow-up surface without pretending every decision is already board-grade.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "intelligence",
    recommendedQuestion:
      "Which system and data-readiness gaps matter most for the next executive decision?",
  },
  {
    id: "generic-vendor-proof",
    dimensions: ["Vendors & Contracts", "Applications & Core Systems"],
    terms: ["vendor", "contract", "renewal", "system"],
    title: "Vendor action should stay tied to loaded contract evidence.",
    finding:
      "The V6 vendor and system rows can support sourcing questions when they include enough ownership, scope, and renewal evidence.",
    why: "Source should own commercial action when contract details are strong; Home should name gaps when they are thin.",
    claimBasis: "tenant_fact",
    recommendedSurface: "source",
    recommendedQuestion:
      "Which vendor or contract evidence is ready for Source, and what is still missing?",
  },
  {
    id: "generic-ai-value",
    dimensions: ["AI & Automation Footprint", "Benefits Realization"],
    terms: ["ai", "automation", "value", "adoption"],
    title: "AI activity needs value and adoption proof.",
    finding:
      "The V6 AI and benefits context can separate loaded AI activity from value that is actually proven.",
    why: "That keeps executive answers from sounding polished while relying on incomplete adoption or value evidence.",
    claimBasis: "abarva_assessment",
    recommendedSurface: "tower",
    recommendedQuestion:
      "Which AI initiatives have enough adoption and value proof for Tower tracking?",
  },
  {
    id: "generic-execution-sequence",
    dimensions: ["Initiatives & Roadmap", "Risk & RAID Log"],
    terms: ["initiative", "program", "risk", "dependency"],
    title:
      "Execution should be sequenced around dependencies and evidence gaps.",
    finding:
      "The V6 roadmap and risk rows help identify what should become a governed Move rather than an unstructured follow-up.",
    why: "Moves should own sequencing when ownership, dependencies, or controls need to be made explicit.",
    claimBasis: "tenant_fact",
    recommendedSurface: "moves",
    recommendedQuestion:
      "Which initiative should become the next governed Move, and what evidence gate comes first?",
  },
];

export function buildHomeV6ContextFindings(
  browser: HomeV6ContextBrowser | null | undefined,
): HomeV6ContextFinding[] {
  if (!browser) return [];
  const recipes = recipesForTenant(browser.tenantKey);
  return recipes.slice(0, 4).map((recipe) => buildFinding(browser, recipe));
}

function recipesForTenant(tenantKey: string): FindingRecipe[] {
  const normalized = tenantKey.toLowerCase();
  if (normalized.includes("skyharbor")) return AIRLINE_RECIPES;
  if (normalized.includes("lakeshore")) return INDUSTRIAL_RECIPES;
  return GENERIC_RECIPES;
}

function buildFinding(
  browser: HomeV6ContextBrowser,
  recipe: FindingRecipe,
): HomeV6ContextFinding {
  const previews = recipe.dimensions
    .map((dimension) => browser.dimensions[dimension])
    .filter((preview): preview is HomeV6BrowserPreview => Boolean(preview));
  const sourceFiles = unique(previews.flatMap((preview) => preview.fileNames));
  const sourceRowCount = previews.reduce(
    (sum, preview) => sum + preview.rowCount,
    0,
  );
  const matchedRows = selectEvidenceRows(previews, recipe.terms);
  const evidenceGaps = unique([
    ...matchedRows.flatMap((row) => row.knownGaps),
    ...previews.flatMap((preview) =>
      preview.knownGaps.map((gap) => `${gap.label} (${gap.count})`),
    ),
  ]).slice(0, 5);
  return {
    findingId: recipe.id,
    tenantKey: browser.tenantKey,
    tenantDisplayName: browser.displayName,
    title: recipe.title,
    executiveFinding: recipe.finding,
    whyItMatters: recipe.why,
    supportingDimensions: previews.map((preview) => preview.dimension),
    sourceFiles,
    sourceRowCount,
    evidenceRefs: matchedRows.slice(0, 5).map((row) => ({
      v6File: row.v6File,
      rowId: row.rowId,
      label: row.label,
      claimSupported: claimSupportedFor(row, recipe),
    })),
    evidenceGaps,
    confidence: confidenceFor(sourceRowCount, matchedRows.length, evidenceGaps),
    claimBasis: recipe.claimBasis,
    patternContextUsed:
      Boolean(recipe.patternContextUsed) ||
      recipe.claimBasis === "industry_pattern" ||
      (recipe.claimBasis === "mixed" &&
        recipe.dimensions.includes("Industry Benchmarks")),
    recommendedSurface: recipe.recommendedSurface,
    recommendedQuestion: recipe.recommendedQuestion,
  };
}

function selectEvidenceRows(
  previews: HomeV6BrowserPreview[],
  terms: string[],
): HomeV6BrowserSourceRow[] {
  const normalizedTerms = terms.map(normalize).filter(Boolean);
  const allRows = previews.flatMap((preview) => preview.sourceRows);
  const matched = allRows.filter((row) => {
    const haystack = normalize(
      [row.label, row.rowId, ...Object.values(row.values)].join(" "),
    );
    return normalizedTerms.some((term) => haystack.includes(term));
  });
  return uniqueRows(matched.length > 0 ? matched : allRows);
}

function claimSupportedFor(
  row: HomeV6BrowserSourceRow,
  recipe: FindingRecipe,
): string {
  const visibleValue = Object.entries(row.values).find(
    ([, value]) =>
      value && value !== "Needs evidence" && value !== "Not loaded",
  );
  if (!visibleValue) return recipe.title;
  return `${recipe.title} — ${visibleValue[0]}: ${visibleValue[1]}`;
}

function confidenceFor(
  sourceRowCount: number,
  evidenceRefCount: number,
  evidenceGaps: string[],
): "high" | "medium" | "low" {
  if (
    sourceRowCount >= 30 &&
    evidenceRefCount >= 3 &&
    evidenceGaps.length <= 3
  ) {
    return "high";
  }
  if (sourceRowCount >= 8 && evidenceRefCount >= 2) return "medium";
  return "low";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function uniqueRows(rows: HomeV6BrowserSourceRow[]): HomeV6BrowserSourceRow[] {
  const seen = new Set<string>();
  const output: HomeV6BrowserSourceRow[] = [];
  for (const row of rows) {
    const key = `${row.v6File}:${row.rowId}:${row.rowNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}
