import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
} from "@/lib/home/enterprise-landscape-view-model";

/**
 * The Intelligence surface used to send the model two executive-summary
 * fields, the first three sections' first three current-state rows, eight
 * maturity items and six source lines. The landscape carries roughly fourteen
 * sections across five nav groups, so most of the loaded enterprise was never
 * offered to the answer path at all.
 *
 * This builds a persistent enterprise spine instead: every section is routed
 * into the typed bucket that matches its domain, so the model has a baseline
 * picture of the enterprise even when question-specific retrieval is narrow.
 * The buckets line up with the domain budgets in the surface-context
 * retriever, which renders each one under its own labelled heading.
 */

const ENTERPRISE_SECTION_IDS = ["profile", "operating", "workforce"] as const;
const ESTATE_SECTION_IDS = [
  "applications",
  "infrastructure",
  "data",
  "integrations",
] as const;
const COMMERCIAL_SECTION_IDS = ["vendors", "budget"] as const;
const AI_SECTION_IDS = ["ai"] as const;
const RISK_SECTION_IDS = ["risk", "operations"] as const;
const OUTSIDE_IN_SECTION_IDS = ["benchmarks", "policies"] as const;

const GROUPED_SECTION_IDS: ReadonlySet<string> = new Set<string>([
  ...ENTERPRISE_SECTION_IDS,
  ...ESTATE_SECTION_IDS,
  ...COMMERCIAL_SECTION_IDS,
  ...AI_SECTION_IDS,
  ...RISK_SECTION_IDS,
  ...OUTSIDE_IN_SECTION_IDS,
]);

// Sent slightly above the retriever's per-domain budget so cross-domain
// dedupe there does not leave a domain short.
const BUCKET_CAPS = {
  tenant: 20,
  strategy: 10,
  vendor: 10,
  useCase: 10,
  risk: 10,
  quality: 10,
  source: 8,
  page: 8,
} as const;

const UNGROUPED_RESERVE = 6;

export interface EnterpriseContextSpine {
  pageFacts: string[];
  tenantFacts: string[];
  strategyFacts: string[];
  vendorFacts: string[];
  useCaseFacts: string[];
  riskFacts: string[];
  qualityFacts: string[];
  sourceFacts: string[];
}

export function buildEnterpriseContextSpine(
  viewModel: EnterpriseLandscapeViewModel,
  sectionList: LandscapeSection[],
): EnterpriseContextSpine {
  const sections = sectionList.filter(Boolean);
  const pick = (ids: readonly string[]) =>
    sections.filter((section) => ids.includes(section.id));

  // Any section the nav groups do not cover still has to reach the model, or a
  // tenant with a different section vocabulary would silently lose context.
  const ungrouped = sections.filter(
    (section) => !GROUPED_SECTION_IDS.has(section.id),
  );

  const enterprise = pick(ENTERPRISE_SECTION_IDS);
  const estate = pick(ESTATE_SECTION_IDS);
  const commercial = pick(COMMERCIAL_SECTION_IDS);
  const ai = pick(AI_SECTION_IDS);
  const risk = pick(RISK_SECTION_IDS);
  const outsideIn = pick(OUTSIDE_IN_SECTION_IDS);

  // Reserve budget for ungrouped sections before the known groups consume the
  // cap, otherwise an unrecognised section is starved by ordering alone.
  const ungroupedFacts = capped(currentState(ungrouped, 2), UNGROUPED_RESERVE);
  const groupedTenantFacts = capped(
    currentState([...enterprise, ...estate], 3),
    BUCKET_CAPS.tenant - ungroupedFacts.length,
  );

  return {
    pageFacts: capped(
      [
        `${viewModel.tenantName} Intelligence briefing — enterprise, estate, commercial, AI, risk and outside-in context.`,
        ...sections
          .filter((section) => section.executiveSummary?.trim())
          .map((section) => `${section.title}: ${section.executiveSummary}`),
      ],
      BUCKET_CAPS.page,
    ),
    tenantFacts: capped(
      [...groupedTenantFacts, ...ungroupedFacts],
      BUCKET_CAPS.tenant,
    ),
    strategyFacts: capped(
      [
        ...leadershipReads([...enterprise, ...outsideIn]),
        ...implications([...enterprise, ...outsideIn], 3),
        ...currentState(outsideIn, 3),
      ],
      BUCKET_CAPS.strategy,
    ),
    vendorFacts: capped(
      [...currentState(commercial, 4), ...implications(commercial, 2)],
      BUCKET_CAPS.vendor,
    ),
    useCaseFacts: capped(
      [...currentState(ai, 5), ...implications(ai, 3)],
      BUCKET_CAPS.useCase,
    ),
    riskFacts: capped(
      [
        ...currentState(risk, 4),
        ...implications(risk, 2),
        ...riskImplications(sections),
      ],
      BUCKET_CAPS.risk,
    ),
    qualityFacts: capped(
      sections.flatMap((section) =>
        section.maturity.map(
          (item) => `${section.title} — ${item.label}: ${item.score}%`,
        ),
      ),
      BUCKET_CAPS.quality,
    ),
    sourceFacts: capped(
      sections.flatMap((section) =>
        section.sources.map((source) => `${source.title}: ${source.detail}`),
      ),
      BUCKET_CAPS.source,
    ),
  };
}

function currentState(
  sections: LandscapeSection[],
  perSection: number,
): string[] {
  return sections.flatMap((section) =>
    section.currentState
      .slice(0, perSection)
      .map((row) => `${section.title} — ${row.area}: ${row.assessment}`),
  );
}

function implications(
  sections: LandscapeSection[],
  perSection: number,
): string[] {
  return sections.flatMap((section) =>
    section.implications
      .slice(0, perSection)
      .map((item) => `${section.title} — ${item.label}: ${item.value}`),
  );
}

function riskImplications(sections: LandscapeSection[]): string[] {
  return sections.flatMap((section) =>
    section.implications
      .filter((item) => item.risk)
      .map((item) => `${section.title} risk — ${item.label}: ${item.value}`),
  );
}

function leadershipReads(sections: LandscapeSection[]): string[] {
  return sections
    .filter((section) => section.leadershipRead?.trim())
    .map((section) => `${section.title} leadership read: ${section.leadershipRead}`);
}

function capped(values: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= cap) break;
  }
  return out;
}
