import "server-only";

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import type {
  AvaAnswerPacket,
  AvaArtifact,
  AvaCitation,
} from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import type {
  ChapterId,
  ChapterView,
  GroundedClaim,
  HomeReviewBundle,
  TechObjectType,
} from "@/lib/home/preview/types";

/** Narrower than HomeReviewBundle so tests don't need to fabricate unrelated payload. The route
 * passes the full bundle, so thesis is available when the serving packet carries it; older fixtures
 * still degrade to chapter and technology summaries. */
type AvaAnswerBundleSlice = Pick<
  HomeReviewBundle,
  "chapters" | "technologyEstate"
> &
  Partial<Pick<HomeReviewBundle, "thesis">>;

const PROMPT_VERSION = "home-preview-ava-answer-v1";
const CLAUDE_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1600;
const TIMEOUT_MS = 45_000;

const CHAPTER_ABBREV: Record<ChapterId, string> = {
  executive_brief: "EB",
  our_business: "OB",
  strategy_value_creation: "SV",
  how_we_operate: "HO",
  technology_data: "TD",
  performance_value: "PV",
  leadership_perspective: "LP",
  what_needs_attention: "WA",
};

interface TaggedClaim {
  tag: string;
  claim: GroundedClaim;
  chapterId: ChapterId;
}

interface PlottableDataset {
  label: string;
  rows: Array<{ label: string; value: number }>;
}

interface VendorEvidenceSummary {
  totalSpend: number;
  supplierAliases: Map<string, string>;
  topSuppliers: Array<{ name: string; spend: number; sharePct: number }>;
  hasContractEvidence: boolean;
}

interface GroundingContext {
  tenantDisplayName: string;
  promptContextJson: string;
  taggedClaims: TaggedClaim[];
  citationIndex: Map<string, TaggedClaim>;
  plottableDatasets: Map<string, PlottableDataset>;
  recordCountsByObjectType: Map<TechObjectType, number>;
  vendorEvidence: VendorEvidenceSummary | null;
}

const TENANT_DISPLAY_NAMES: Record<string, string> = {
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air",
};

/** Tags every claim across all eight chapters with a short stable reference like "EB-K1" so the
 * model can cite exactly which already-verified statement it drew from. The active chapter is a
 * focus hint, not a context fence; narrowing this list made aVa miss material cross-domain context. */
function tagClaims(chapters: ChapterView[]): TaggedClaim[] {
  const tagged: TaggedClaim[] = [];
  for (const chapter of chapters) {
    const abbrev = CHAPTER_ABBREV[chapter.chapterId];
    chapter.key_insights.forEach((claim, i) =>
      tagged.push({
        tag: `${abbrev}-K${i + 1}`,
        claim,
        chapterId: chapter.chapterId,
      }),
    );
    chapter.tensions.forEach((claim, i) =>
      tagged.push({
        tag: `${abbrev}-T${i + 1}`,
        claim,
        chapterId: chapter.chapterId,
      }),
    );
    chapter.what_to_watch.forEach((claim, i) =>
      tagged.push({
        tag: `${abbrev}-W${i + 1}`,
        claim,
        chapterId: chapter.chapterId,
      }),
    );
  }
  return tagged;
}

const SPINE_AREAS: Array<{
  key: string;
  label: string;
  chapters: ChapterId[];
  objectTypes?: TechObjectType[];
}> = [
  {
    key: "enterprise_profile",
    label: "Enterprise profile",
    chapters: ["executive_brief", "our_business"],
  },
  {
    key: "business_model",
    label: "Business model and books of business",
    chapters: ["our_business"],
  },
  {
    key: "strategy_priorities",
    label: "Strategy and priorities",
    chapters: ["strategy_value_creation"],
  },
  {
    key: "operating_model",
    label: "Operating model, organization and ownership",
    chapters: ["how_we_operate"],
    objectTypes: ["organization_ownership"],
  },
  {
    key: "programs_transformation",
    label: "Major programs and transformation agenda",
    chapters: ["strategy_value_creation", "performance_value"],
    objectTypes: ["program_initiative"],
  },
  {
    key: "applications_technology",
    label: "Applications and technology estate",
    chapters: ["technology_data"],
    objectTypes: ["application_system"],
  },
  {
    key: "data_analytics_ai",
    label: "Data, analytics and AI estate",
    chapters: ["technology_data"],
    objectTypes: ["data_asset_or_integration", "ai_use_case"],
  },
  {
    key: "infrastructure_hosting",
    label: "Infrastructure and hosting",
    chapters: ["technology_data"],
    objectTypes: ["infrastructure_platform"],
  },
  {
    key: "vendors_contracts",
    label: "Vendors, contracts and commercial dependencies",
    chapters: ["technology_data", "what_needs_attention"],
    objectTypes: ["vendor_contract"],
  },
  {
    key: "financials_value",
    label: "Financials, spend, value and outcomes",
    chapters: ["performance_value"],
    objectTypes: ["metric_outcome"],
  },
  {
    key: "risks_controls",
    label: "Risks, controls and resilience",
    chapters: ["what_needs_attention"],
    objectTypes: ["risk_control"],
  },
  {
    key: "leadership_themes",
    label: "Leadership themes and disagreements",
    chapters: ["leadership_perspective"],
  },
  {
    key: "known_gaps",
    label: "Known gaps, conflicts and evidence limitations",
    chapters: ["executive_brief", "our_business", "what_needs_attention"],
  },
  {
    key: "attention_decisions",
    label: "Current major decisions and attention areas",
    chapters: ["executive_brief", "what_needs_attention"],
  },
];

const QUESTION_DOMAIN_RULES: Array<{ key: string; test: RegExp }> = [
  {
    key: "applications_technology",
    test: /\b(applications?|systems?|technology|moderni[sz]ation|estate|platform)\b/i,
  },
  {
    key: "data_analytics_ai",
    test: /\b(data|analytics|ai|automation|reporting|etl|integration|lineage)\b/i,
  },
  {
    key: "vendors_contracts",
    test: /\b(vendors?|contracts?|commercial|renewal|sourcing|third[- ]party)\b/i,
  },
  {
    key: "financials_value",
    test: /\b(cfo|finance|financial|commercial|spend|cost|budget|value|savings|outcome|metric|roi|revenue)\b/i,
  },
  {
    key: "risks_controls",
    test: /\b(risk|control|resilien|security|privacy|compliance|exposure)\b/i,
  },
  {
    key: "operating_model",
    test: /\b(operating model|ownership|owner|organization|organisation|accountab|decision rights?)\b/i,
  },
  {
    key: "programs_transformation",
    test: /\b(program|initiative|transformation|portfolio|delivery|roadmap)\b/i,
  },
  {
    key: "strategy_priorities",
    test: /\b(strategy|priority|bet|direction|where are we going)\b/i,
  },
  {
    key: "leadership_themes",
    test: /\b(leader|leadership|interview|agree|disagree|concern|worr)\b/i,
  },
  {
    key: "known_gaps",
    test: /\b(mislead|caveat|gap|missing|unknown|do not know|don't know|not know|evidence limit|board recommendation)\b/i,
  },
  {
    key: "attention_decisions",
    test: /\b(ceo|board|leadership|decision|friday|first|address|recommendation|attention)\b/i,
  },
];

function claimTagsForChapter(chapter: ChapterView): string[] {
  const abbrev = CHAPTER_ABBREV[chapter.chapterId];
  return [
    ...chapter.key_insights.map((_claim, i) => `${abbrev}-K${i + 1}`),
    ...chapter.tensions.map((_claim, i) => `${abbrev}-T${i + 1}`),
    ...chapter.what_to_watch.map((_claim, i) => `${abbrev}-W${i + 1}`),
  ];
}

function buildEnterpriseContextSpine(
  bundle: AvaAnswerBundleSlice,
  allowedClaimTags?: Set<string>,
) {
  const chaptersById = new Map(
    bundle.chapters.map((chapter) => [chapter.chapterId, chapter]),
  );
  const recordsByType = new Map(
    (bundle.technologyEstate?.recordTypes ?? []).map((recordType) => [
      recordType.objectType,
      recordType,
    ]),
  );

  return SPINE_AREAS.map((area) => {
    const areaChapters = area.chapters
      .map((id) => chaptersById.get(id))
      .filter((chapter): chapter is ChapterView => Boolean(chapter));
    const recordSummaries = (area.objectTypes ?? [])
      .map((objectType) => recordsByType.get(objectType))
      .filter(
        (
          recordType,
        ): recordType is NonNullable<ReturnType<typeof recordsByType.get>> =>
          Boolean(recordType),
      )
      .map((recordType) => ({
        objectType: recordType.objectType,
        label: recordType.label,
        totalRecords: recordType.rows.length,
        primaryDimension: recordType.primaryDimension ?? null,
        topSegments: (recordType.dimensionCounts ?? []).slice(0, 5),
      }));

    return {
      key: area.key,
      label: area.label,
      status:
        areaChapters.length > 0 || recordSummaries.length > 0
          ? "available"
          : "not_available",
      chapter_refs: areaChapters.map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        guidingQuestion: chapter.guidingQuestion,
        headline: chapter.headline,
        claim_tags: claimTagsForChapter(chapter)
          .filter((tag) => !allowedClaimTags || allowedClaimTags.has(tag))
          .slice(0, 10),
        limitations: chapter.limitations.slice(0, 3),
      })),
      record_summaries: recordSummaries,
    };
  });
}

function buildQuestionContextPlan(
  question: string,
  activeChapterId: string | undefined,
) {
  const matched = matchedQuestionDomains(question);
  const primaryDomains =
    matched.length > 0
      ? matched.slice(0, 2)
      : ["enterprise_profile", "attention_decisions"];
  return {
    active_chapter_focus: activeChapterId ?? null,
    focus_is_not_a_context_limit: true,
    answer_depth:
      /\b(complete|deep|full|comprehensive|detailed|assessment|recommend)\b/i.test(
        question,
      )
        ? "deep_dive"
        : /\b(why|how|should|concern|risk|compare|implication|means?|recommend)\b/i.test(
              question,
            )
          ? "executive"
          : "quick",
    primary_domains: primaryDomains,
    secondary_domains: matched
      .filter((key) => !primaryDomains.includes(key))
      .slice(0, 6),
    always_include: [
      "enterprise_profile",
      "business_model",
      "strategy_priorities",
      "operating_model",
      "known_gaps",
      "attention_decisions",
    ],
  };
}

function matchedQuestionDomains(question: string): string[] {
  return QUESTION_DOMAIN_RULES.filter((rule) => rule.test.test(question)).map(
    (rule) => rule.key,
  );
}

interface StaleClaimContext {
  recordCountsByObjectType: Map<TechObjectType, number>;
  vendorEvidence: VendorEvidenceSummary | null;
}

function summarizeVendorEvidence(
  bundle: AvaAnswerBundleSlice,
): VendorEvidenceSummary | null {
  const recordType = bundle.technologyEstate?.recordTypes.find(
    (rt) => rt.objectType === "vendor_contract",
  );
  if (!recordType) return null;

  const spendBySupplier = new Map<string, number>();
  const displayNameBySupplier = new Map<string, string>();
  const supplierAliases = new Map<string, string>();
  let hasContractEvidence = false;

  for (const row of recordType.rows) {
    const supplierName = normalizedCellText(row.vendorName);
    if (supplierName) {
      const key = normalizeSupplierAlias(supplierName);
      displayNameBySupplier.set(key, supplierName);
      spendBySupplier.set(
        key,
        (spendBySupplier.get(key) ?? 0) + numberCellValue(row.annualSpendUsd),
      );
      for (const alias of supplierNameAliases(supplierName)) {
        supplierAliases.set(alias, key);
      }
    }
    if (
      [
        "pricingHistory",
        "utilizationEvidence",
        "contractTermsDetail",
        "renegotiationLevers",
        "benchmarkClause",
      ].some((key) => Boolean(normalizedCellText(row[key])))
    ) {
      hasContractEvidence = true;
    }
  }

  const totalSpend = Array.from(spendBySupplier.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const topSuppliers = Array.from(spendBySupplier.entries())
    .map(([key, spend]) => ({
      name: displayNameBySupplier.get(key) ?? key,
      spend,
      sharePct: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return {
    totalSpend,
    supplierAliases,
    topSuppliers,
    hasContractEvidence,
  };
}

function normalizedCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberCellValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSupplierAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(corporation|corp\.?|inc\.?|llc|ltd\.?|company|co\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function supplierNameAliases(name: string): string[] {
  const normalized = normalizeSupplierAlias(name);
  const aliases = new Set<string>();
  if (normalized) aliases.add(normalized);
  const firstToken = normalized.split(/\s+/)[0];
  if (firstToken && firstToken.length >= 3) aliases.add(firstToken);
  return Array.from(aliases);
}

function isStaleAvaClaim(
  statement: string,
  context: StaleClaimContext,
): boolean {
  const vendorContracts =
    context.recordCountsByObjectType.get("vendor_contract");
  if (
    vendorContracts !== undefined &&
    containsConflictingVendorContractTotal(statement, vendorContracts)
  ) {
    return true;
  }

  const dataAssets = context.recordCountsByObjectType.get(
    "data_asset_or_integration",
  );
  if (
    dataAssets !== undefined &&
    containsConflictingDataAssetTotal(statement, dataAssets)
  ) {
    return true;
  }

  if (
    context.vendorEvidence?.hasContractEvidence &&
    /\b(no|none of the|absent|unavailable)\b/i.test(statement) &&
    /\b(vendor contracts?|contracts?|pricing|SLA|terms?|performance evidence|contract-level evidence|document-level evidence)\b/i.test(
      statement,
    )
  ) {
    return true;
  }

  if (
    context.vendorEvidence &&
    /\b(over|more than|at least)\s+(?:a\s+)?quarter\b/i.test(statement) &&
    /\b(vendor|supplier|contract)\s+spend\b/i.test(statement)
  ) {
    return vendorPairConcentrationConflicts(statement, context.vendorEvidence);
  }

  return false;
}

function containsConflictingVendorContractTotal(
  statement: string,
  expected: number,
): boolean {
  return [
    ...statement.matchAll(/\b(\d+)\s+vendor contracts?\b/gi),
    ...statement.matchAll(/\b(\d+)\s+declared\s+contracts?\b/gi),
  ].some((match) => Number(match[1]) !== expected);
}

function containsConflictingDataAssetTotal(
  statement: string,
  expected: number,
): boolean {
  return [
    ...statement.matchAll(
      /\b\d+\s+of\s+(\d+)\s+(?:tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
    ),
    ...statement.matchAll(
      /\b(\d+)\s+(?:tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
    ),
    ...statement.matchAll(
      /\bdata assets(?:\s*(?:and|\/)\s*integrations)?\s*\(\d+\s+of\s+(\d+)\)/gi,
    ),
  ].some((match) => Number(match[1]) !== expected);
}

function vendorPairConcentrationConflicts(
  statement: string,
  vendorEvidence: VendorEvidenceSummary,
): boolean {
  if (
    vendorEvidence.totalSpend <= 0 ||
    vendorEvidence.topSuppliers.length < 2
  ) {
    return false;
  }
  const normalizedStatement = normalizeSupplierAlias(statement);
  const mentionedSupplierKeys = new Set<string>();
  for (const [alias, supplierKey] of vendorEvidence.supplierAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalizedStatement)) {
      mentionedSupplierKeys.add(supplierKey);
    }
  }
  if (mentionedSupplierKeys.size < 2) return false;

  const topTwoKeys = new Set(
    vendorEvidence.topSuppliers
      .slice(0, 2)
      .map((supplier) => normalizeSupplierAlias(supplier.name)),
  );
  const mentionsOnlyTopTwo =
    mentionedSupplierKeys.size === topTwoKeys.size &&
    Array.from(mentionedSupplierKeys).every((key) => topTwoKeys.has(key));
  const topTwoShare = vendorEvidence.topSuppliers
    .slice(0, 2)
    .reduce((sum, supplier) => sum + supplier.sharePct, 0);

  return !mentionsOnlyTopTwo || topTwoShare < 25;
}

function sanitizeContextNarrative(
  text: string,
  context: StaleClaimContext,
): string {
  return dropStaleEvidenceSentences(text, context).trim();
}

function dropStaleEvidenceSentences(
  text: string,
  context: StaleClaimContext,
): string {
  if (!text) return text;
  const sentences = text
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [text];
  return sentences
    .filter((sentence) => !isStaleAvaClaim(sentence, context))
    .join(" ");
}

function buildGroundingContext(
  bundle: AvaAnswerBundleSlice,
  tenantKey: string,
  activeChapterId: string | undefined,
  question: string,
): GroundingContext {
  const recordCountsByObjectType = new Map(
    (bundle.technologyEstate?.recordTypes ?? []).map((recordType) => [
      recordType.objectType,
      recordType.rows.length,
    ]),
  );
  const vendorEvidence = summarizeVendorEvidence(bundle);
  const taggedClaims = tagClaims(bundle.chapters).filter(
    (taggedClaim) =>
      !isStaleAvaClaim(taggedClaim.claim.statement, {
        recordCountsByObjectType,
        vendorEvidence,
      }),
  );
  const citationIndex = new Map(taggedClaims.map((t) => [t.tag, t]));
  const allowedClaimTags = new Set(taggedClaims.map((t) => t.tag));

  const plottableDatasets = new Map<string, PlottableDataset>();
  for (const recordType of bundle.technologyEstate?.recordTypes ?? []) {
    if (!recordType.primaryDimension || recordType.dimensionCounts.length === 0)
      continue;
    const key = `tech.${recordType.objectType}.by_${recordType.primaryDimension}`;
    plottableDatasets.set(key, {
      label: `${recordType.label} by ${recordType.primaryDimension}`,
      rows: recordType.dimensionCounts.map((d) => ({
        label: d.value,
        value: d.count,
      })),
    });
  }

  const chaptersForContext = bundle.chapters.map((chapter) => {
    const abbrev = CHAPTER_ABBREV[chapter.chapterId];
    return {
      chapterId: chapter.chapterId,
      active_focus: chapter.chapterId === activeChapterId,
      title: chapter.title,
      guidingQuestion: chapter.guidingQuestion,
      headline: sanitizeContextNarrative(chapter.headline, {
        recordCountsByObjectType,
        vendorEvidence,
      }),
      executive_synthesis: sanitizeContextNarrative(
        chapter.executive_synthesis,
        {
          recordCountsByObjectType,
          vendorEvidence,
        },
      ),
      key_insights: chapter.key_insights
        .map((c, i) => ({
          tag: `${abbrev}-K${i + 1}`,
          statement: c.statement,
          claim_type: c.claim_type,
          confidence: c.confidence,
        }))
        .filter((claim) => allowedClaimTags.has(claim.tag)),
      tensions: chapter.tensions
        .map((c, i) => ({
          tag: `${abbrev}-T${i + 1}`,
          statement: c.statement,
          claim_type: c.claim_type,
          confidence: c.confidence,
        }))
        .filter((claim) => allowedClaimTags.has(claim.tag)),
      what_to_watch: chapter.what_to_watch
        .map((c, i) => ({
          tag: `${abbrev}-W${i + 1}`,
          statement: c.statement,
          claim_type: c.claim_type,
          confidence: c.confidence,
        }))
        .filter((claim) => allowedClaimTags.has(claim.tag)),
      limitations: chapter.limitations
        .map((limitation) =>
          sanitizeContextNarrative(limitation, {
            recordCountsByObjectType,
            vendorEvidence,
          }),
        )
        .filter(Boolean),
    };
  });

  const technologyEstateSummary = (
    bundle.technologyEstate?.recordTypes ?? []
  ).map((rt) => ({
    objectType: rt.objectType,
    label: rt.label,
    totalRecords: rt.rows.length,
    primaryDimension: rt.primaryDimension,
    datasetRefIfAvailable: rt.primaryDimension
      ? `tech.${rt.objectType}.by_${rt.primaryDimension}`
      : null,
  }));

  const contextPayload = {
    tenant: TENANT_DISPLAY_NAMES[tenantKey] ?? tenantKey,
    question_context_plan: buildQuestionContextPlan(question, activeChapterId),
    enterprise_context_spine: buildEnterpriseContextSpine(
      bundle,
      allowedClaimTags,
    ),
    chapters: chaptersForContext,
    technology_estate_summary: technologyEstateSummary,
    plottable_datasets: Array.from(plottableDatasets.entries()).map(
      ([ref, d]) => ({
        dataset_ref: ref,
        label: d.label,
        segment_count: d.rows.length,
        segments_preview: d.rows.slice(0, 6),
      }),
    ),
  };

  return {
    tenantDisplayName: TENANT_DISPLAY_NAMES[tenantKey] ?? tenantKey,
    promptContextJson: JSON.stringify(contextPayload, null, 2),
    taggedClaims,
    citationIndex,
    plottableDatasets,
    recordCountsByObjectType,
    vendorEvidence,
  };
}

const SYSTEM_PROMPT = `You are aVa, AbarVa's enterprise advisor for this tenant's Home preview experience. Answer the user's question using ONLY the enterprise context supplied in the user message: the enterprise context spine, the tenant's verified chapter narratives (Executive Brief, Our Business, Strategy & Value Creation, How We Operate, Technology & Data, Performance & Value, Leadership Perspective, What Needs Attention), and its real Technology Estate segmentation counts. Chapter claims carry citation tags (e.g. "EB-K1"); each tagged statement has already passed an entailment-verification pass against underlying evidence before publication.

The enterprise context spine is always available. Treat the active chapter as the user's current focus, not as a boundary. When the question touches one domain, consider whether another domain materially changes the answer: technology may depend on strategy, ownership, contracts, risk, programs, data, value, or leadership testimony. Do not force cross-domain connections when they are not relevant.
If the question is broad but relevant cited claims are available, answer directionally with explicit limits instead of returning no_data. Use compact consulting structure: short answer, 3-5 bullets, confidence/evidence, caveat. Avoid long paragraphs.

Context-use boundaries:
- enterprise_context_spine and record_summaries are orientation and routing context unless they point to cited claim tags.
- Tagged chapter claims are factual answer material and must be cited in cited_claim_tags when used in prose.
- Deterministic plottable_datasets are quantitative exhibit material. Use their values only through the selected chart/table artifact; do not turn record_summaries, topSegments, or totalRecords into uncited prose claims.

Rules, no exceptions:
1. Never state a number, date, name, or fact that is not verbatim present in the context. If the question isn't covered, say so plainly and set status to "no_data" (nothing relevant) or "partial" (some but incomplete) -- never guess, estimate, or reason from outside general knowledge.
2. Every tagged chapter claim you rely on must be cited by its exact tag in cited_claim_tags. Only cite tags that appear in the context.
3. You may request at most one chart or table, and only by naming a dataset_ref taken EXACTLY from plottable_datasets -- you never invent, adjust, estimate, or fabricate the underlying numbers, you only choose whether a precomputed dataset helps answer the question. If none fits, set visual.type to "none".
4. Speak in plain business language a newly appointed CXO would use. Do not mention internal pipeline terms (dataset names, schema versions, "context payload", "governed", tag syntax, ECL, projection, agent-ready state, hashes, source rows) in direct_answer or prose.
5. Output strict JSON only -- no markdown code fences, no commentary before or after the JSON.

Schema:
{
  "status": "answered" | "partial" | "no_data",
  "direct_answer": string,
  "prose": string,
  "cited_claim_tags": string[],
  "visual": { "type": "chart" | "table" | "none", "dataset_ref": string | null, "chart_kind": "bar" | "horizontal-bar" | null },
  "caveats": string[]
}`;

interface ModelResponseShape {
  status?: string;
  direct_answer?: string;
  prose?: string;
  cited_claim_tags?: string[];
  visual?: {
    type?: string;
    dataset_ref?: string | null;
    chart_kind?: string | null;
  };
  caveats?: string[];
}

function extractMessageText(message: unknown): string {
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : "";
    })
    .join("");
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("home_preview_ava_answer_timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const ALLOWED_STATUS = new Set(["answered", "partial", "no_data"]);
const ALLOWED_CHART_KIND = new Set(["bar", "horizontal-bar"]);
const MAX_DIRECT_ANSWER_WORDS = 55;
const MAX_PROSE_PARAGRAPH_WORDS = 70;
const GRAPH_EXHIBIT_REQUEST_RE =
  /\b(show|draw|render|create|display|visuali[sz]e|graph|map)\b.*\b(graph|network|relationship map|connections?|dependencies)\b|\b(graph|network|relationship map)\b.*\b(risks?|vendors?|applications?|systems?|data|programs?|contracts?|connect|connections?|dependencies)\b/i;
const INTERNAL_RECOVERY_CAVEAT_RE =
  /\b(advisor model|advisor engine|unparseable|could not be exported|exported safely|packag(?:e|ed|ing)|JSON|parser|parse)\b/i;
const DEFAULT_RECOVERY_CAVEAT =
  "This is a Home-level read. It is suitable for walkthrough and triage, not for final approval without source-owner confirmation.";

/** Same fence-stripping tolerance as build-enterprise-thesis.ts's parseJsonLoose -- inlined
 * rather than imported so this route doesn't drag the data-build script's pg/papaparse/fs
 * dependencies into the Next.js server bundle for one small utility function. */
function parseJsonLoose<T>(text: string, label: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.log(
      `home-preview-ava-answer: ${label}: model response was not valid JSON even after code-fence stripping -- ` +
        `${error instanceof Error ? error.message : String(error)}; raw text (first 200 chars): ` +
        JSON.stringify(cleaned.slice(0, 200)),
    );
    return null;
  }
}

/** Answers a free-text question about one tenant's Home preview, grounded ONLY in that tenant's
 * already-verified HomeReviewBundle -- no live DB query, no external retrieval, no fabrication.
 * Any chart/table the model requests must reference a dataset_ref this function itself computed
 * from real canonical records; the model never supplies a plotted value directly, mirroring the
 * same anti-fabrication pattern build-enterprise-thesis.ts uses for visual_opportunities. */
export async function answerHomeAvaQuestion(args: {
  bundle: AvaAnswerBundleSlice;
  tenantKey: string;
  question: string;
  activeChapterId?: string;
  userId?: string | null;
}): Promise<AvaAnswerPacket> {
  const question = args.question.trim();
  const context = buildGroundingContext(
    args.bundle,
    args.tenantKey,
    args.activeChapterId,
    question,
  );

  if (isGraphExhibitRequest(question)) {
    return buildGraphUnavailablePacket({
      context,
      tenantKey: args.tenantKey,
      question,
    });
  }

  const userMessage = `Tenant: ${context.tenantDisplayName}\nQuestion: ${question}\n\nContext (JSON):\n${context.promptContextJson}`;

  const requestPayload = {
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: userMessage }],
  };

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: args.tenantKey,
      userId: args.userId ?? undefined,
      workflow: "home-preview-ava-answer",
      model: CLAUDE_MODEL,
      dataClass: "confidential",
      prompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
      metadata: {
        promptVersion: PROMPT_VERSION,
        surface: "home",
        activeChapterId: args.activeChapterId ?? null,
        contextScope: "enterprise_spine_plus_focus",
      },
    });

    const message = await withTimeout(
      client.messages.create(requestPayload),
      TIMEOUT_MS,
    );
    const rawText = extractMessageText(message).trim();
    const parsed = parseJsonLoose<ModelResponseShape>(
      rawText,
      "home-preview-ava-answer",
    );

    if (!parsed) {
      const recovered = shouldRecoverFromRelevantClaims(question)
        ? buildClaimBackedRecoveryAnswer({
            context,
            tenantKey: args.tenantKey,
            question,
            modelCaveats: [
              "The advisor model returned an unparseable response, so this answer uses cited Home claims only.",
            ],
          })
        : null;
      if (recovered) return recovered;
      return buildFallbackPacket(
        args.tenantKey,
        question,
        "no_data",
        "I couldn't produce a grounded answer to that just now -- try rephrasing the question.",
        [],
      );
    }

    return packageModelResponse(parsed, context, args.tenantKey, question);
  } catch (error) {
    const recovered = shouldRecoverFromRelevantClaims(question)
      ? buildClaimBackedRecoveryAnswer({
          context,
          tenantKey: args.tenantKey,
          question,
          modelCaveats: [
            "The advisor engine was unavailable, so this answer uses cited Home claims only.",
          ],
        })
      : null;
    if (recovered) return recovered;
    return buildFallbackPacket(
      args.tenantKey,
      question,
      "no_data",
      "I couldn't reach the advisor engine just now -- please try again in a moment.",
      [],
      error instanceof Error ? error.message : String(error),
    );
  }
}

function packageModelResponse(
  parsed: ModelResponseShape,
  context: GroundingContext,
  tenantKey: string,
  question: string,
): AvaAnswerPacket {
  const status = ALLOWED_STATUS.has(parsed.status ?? "")
    ? (parsed.status as "answered" | "partial" | "no_data")
    : "partial";
  const directAnswerRaw =
    typeof parsed.direct_answer === "string" && parsed.direct_answer.trim()
      ? parsed.direct_answer.trim()
      : "I don't have a grounded answer for that yet.";
  const proseRaw = typeof parsed.prose === "string" ? parsed.prose.trim() : "";

  const citedTags = Array.isArray(parsed.cited_claim_tags)
    ? parsed.cited_claim_tags.filter((t): t is string => typeof t === "string")
    : [];
  const citations: AvaCitation[] = [];
  for (const tag of citedTags) {
    const entry = context.citationIndex.get(tag);
    if (!entry) continue; // model cited a tag we never offered -- drop it rather than trust it
    citations.push({
      id: tag,
      label: entry.claim.statement.slice(0, 96),
      sourceClass: "tenant-fact",
      excerpt: entry.claim.statement,
      confidence:
        entry.claim.confidence === "low"
          ? "low"
          : entry.claim.confidence === "medium"
            ? "medium"
            : "high",
    });
  }

  const artifacts: AvaArtifact[] = [];
  const visualType = parsed.visual?.type;
  const datasetRef = parsed.visual?.dataset_ref ?? null;
  if ((visualType === "chart" || visualType === "table") && datasetRef) {
    const dataset = context.plottableDatasets.get(datasetRef);
    if (dataset) {
      if (visualType === "chart") {
        const kind = ALLOWED_CHART_KIND.has(parsed.visual?.chart_kind ?? "")
          ? (parsed.visual!.chart_kind as "bar" | "horizontal-bar")
          : "horizontal-bar";
        artifacts.push({
          artifact: "chart",
          id: `home-ava-${datasetRef}`,
          kind,
          title: dataset.label,
          data: dataset.rows,
          xKey: "label",
          yKey: "value",
          citationIds: citedTags,
        });
      } else {
        artifacts.push({
          artifact: "table",
          id: `home-ava-${datasetRef}`,
          title: dataset.label,
          columns: [
            { key: "label", label: "Segment" },
            { key: "value", label: "Count", format: "number", align: "right" },
          ],
          rows: dataset.rows,
          citationIds: citedTags,
        });
      }
    }
    // A dataset_ref that doesn't match anything we offered is silently dropped, not trusted --
    // same "missing is never zero" discipline as the rest of this pipeline's visual contract.
  }

  const caveats = Array.isArray(parsed.caveats)
    ? parsed.caveats
        .filter(
          (c): c is string => typeof c === "string" && c.trim().length > 0,
        )
        .map((caveat) =>
          sanitizeAvaVisibleText(caveat, context, MAX_PROSE_PARAGRAPH_WORDS),
        )
    : [];
  const gaps =
    status === "partial" || status === "no_data"
      ? [
          {
            id: "home-ava-gap-1",
            label: "Evidence limit",
            detail:
              caveats[0] ??
              "This Home answer is directional and needs source-owner confirmation before it is used for approval.",
            severity:
              status === "no_data" ? ("high" as const) : ("medium" as const),
          },
        ]
      : [];

  if (
    (status === "no_data" || citations.length === 0) &&
    shouldRecoverFromRelevantClaims(question)
  ) {
    const recovered = buildClaimBackedRecoveryAnswer({
      context,
      tenantKey,
      question,
      modelCaveats: caveats,
    });
    if (recovered) return recovered;
  }

  const directAnswer = sanitizeAvaVisibleText(
    directAnswerRaw,
    context,
    MAX_DIRECT_ANSWER_WORDS,
  );
  const prose = proseRaw
    ? sanitizeAvaVisibleText(proseRaw, context, MAX_PROSE_PARAGRAPH_WORDS)
    : undefined;

  const packet: AvaAnswerPacket = {
    surface: "home",
    mode: "KNOW",
    tenantKey,
    question,
    intent: "home_preview_qa",
    status,
    directAnswer,
    prose,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts,
    citations,
    gaps,
    caveats: caveats.map((detail, i) => ({
      id: `home-ava-caveat-${i + 1}`,
      label: "Caveat",
      detail,
    })),
    nextSteps: [],
    quality: {
      confidence:
        status === "answered"
          ? "high"
          : status === "partial"
            ? "medium"
            : "low",
      evidenceStrength:
        citations.length > 0
          ? "strong"
          : status === "no_data"
            ? "thin"
            : "partial",
      tenantGrounding: "complete",
      answerCompleteness:
        status === "answered"
          ? "complete"
          : status === "partial"
            ? "partial"
            : "blocked",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
  const validation = validateAvaAnswerPacket(packet);
  if (validation.passed) return packet;
  const recovered = shouldRecoverFromRelevantClaims(question)
    ? buildClaimBackedRecoveryAnswer({
        context,
        tenantKey,
        question,
        modelCaveats: [
          ...caveats,
          "The advisor answer included material that could not be exported safely, so this answer uses cited Home claims only.",
        ],
      })
    : null;
  return (
    recovered ??
    buildFallbackPacket(
      tenantKey,
      question,
      "no_data",
      "I could not package that answer safely for display and export.",
      [],
    )
  );
}

function isGraphExhibitRequest(question: string): boolean {
  return GRAPH_EXHIBIT_REQUEST_RE.test(question);
}

function buildGraphUnavailablePacket(input: {
  context: GroundingContext;
  tenantKey: string;
  question: string;
}): AvaAnswerPacket {
  const selected = selectRecoveryClaims(input.context, input.question).slice(
    0,
    4,
  );
  const citations: AvaCitation[] = selected.map(({ tag, claim }) => ({
    id: tag,
    label: claim.statement.slice(0, 96),
    sourceClass: "tenant-fact",
    excerpt: claim.statement,
    confidence:
      claim.confidence === "low"
        ? "low"
        : claim.confidence === "medium"
          ? "medium"
          : "high",
  }));
  const bullets = selected.map(
    ({ claim }) => `- ${compactStatement(claim.statement)}`,
  );
  const caveat =
    "A graph view is not available from Home aVa for this record yet. Use this as a cited narrative read, not as a relationship exhibit.";
  const prose = [
    "Short answer: Home aVa cannot render a graph for this question yet.",
    bullets.length > 0
      ? bullets.join("\n\n")
      : "- I can answer from cited Home claims, but I cannot turn those claims into a graph view yet.",
    `Confidence: ${recoveryConfidence(citations)}. Support: ${citations.length} cited Home claim${citations.length === 1 ? "" : "s"}.`,
    `Caveat: ${caveat}`,
  ].join("\n\n");

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: "home_preview_qa",
    status: "partial",
    directAnswer:
      "Home aVa cannot render a graph for this question yet; it can only provide a cited narrative read.",
    prose,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [],
    citations,
    gaps: [
      {
        id: "home-ava-graph-gap",
        label: "Graph view unavailable",
        detail: caveat,
        severity: "medium",
        citationIds: citations.map((citation) => citation.id),
      },
    ],
    caveats: [{ id: "home-ava-caveat-1", label: "Caveat", detail: caveat }],
    nextSteps: [],
    quality: {
      confidence: citations.length > 0 ? "medium" : "low",
      evidenceStrength: citations.length > 0 ? "partial" : "thin",
      tenantGrounding: "complete",
      answerCompleteness: "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}

function compactAnswerText(text: string, maxWordsPerParagraph: number): string {
  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongParagraph(paragraph, maxWordsPerParagraph))
    .join("\n\n")
    .trim();
}

function sanitizeAvaVisibleText(
  text: string,
  context: GroundingContext,
  maxWordsPerParagraph: number,
): string {
  return scrubPublicAvaAnswerText(
    sanitizeVisibleStaleClaims(
      sanitizeRecordCountContradictions(
        compactAnswerText(text, maxWordsPerParagraph),
        context,
      ),
      context,
    ),
  );
}

function sanitizeVisibleStaleClaims(
  text: string,
  context: StaleClaimContext,
): string {
  if (!text) return text;
  const replacement =
    "Use the current Vendor Contracts table for supplier concentration; the live record does not support the older supplier-pair concentration wording.";
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => {
    const sentences = paragraph
      .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [paragraph];
    const next = sentences
      .map((sentence) =>
        isStaleAvaClaim(sentence, context) ? replacement : sentence,
      )
      .filter(Boolean);
    return Array.from(new Set(next)).join(" ");
  });
  return paragraphs.join("\n\n").trim();
}

function sanitizeRecordCountContradictions(
  text: string,
  context: GroundingContext,
): string {
  if (!text) return text;
  let sanitized = text;

  const vendorContracts =
    context.recordCountsByObjectType.get("vendor_contract");
  if (vendorContracts !== undefined) {
    sanitized = sanitized.replace(
      /\bnone\s+of\s+the\s+\d+\s+vendor contracts?\b/gi,
      `none of the ${vendorContracts} vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\b(all|every|no)\s+(?:of\s+the\s+)?\d+\s+vendor contracts?\b/gi,
      (_match, quantifier: string) =>
        `${quantifier} ${vendorContracts} vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\bthe\s+\d+\s+vendor contracts?\b/gi,
      `the ${vendorContracts} vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\ball\s+\d+\s+declared\s+vendor contracts?\b/gi,
      `all ${vendorContracts} declared vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\ball\s+\d+\s+declared\s+contracts?\b/gi,
      `all ${vendorContracts} declared vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\b(\d+)\s+declared\s+vendor contracts?\b/gi,
      (match, count: string) =>
        Number(count) === vendorContracts
          ? match
          : `${vendorContracts} declared vendor contracts`,
    );
    sanitized = sanitized.replace(
      /\b(\d+)\s+declared\s+contracts?\b/gi,
      (match, count: string) =>
        Number(count) === vendorContracts
          ? match
          : `${vendorContracts} declared vendor contracts`,
    );
  }

  const dataAssets = context.recordCountsByObjectType.get(
    "data_asset_or_integration",
  );
  if (dataAssets !== undefined) {
    sanitized = sanitized.replace(
      /\b(\d+)\s+of\s+(\d+)\s+(tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
      (match, _subset: string, total: string) =>
        Number(total) === dataAssets
          ? match
          : `a subset of the ${dataAssets} tracked data assets/integrations`,
    );
    sanitized = sanitized.replace(
      /\bthe\s+\d+\s+(tracked\s+)?data assets(?:\s*(?:and|\/)\s*integrations)?\b/gi,
      `the ${dataAssets} tracked data assets/integrations`,
    );
    sanitized = sanitized.replace(
      /\b(\d+)\s+of\s+(\d+)\s+tracked\s+data assets\/integrations\b/gi,
      (match, _subset: string, total: string) =>
        Number(total) === dataAssets
          ? match
          : `a subset of the ${dataAssets} tracked data assets/integrations`,
    );
    sanitized = sanitized.replace(
      /\b(\d+)\s+tracked\s+data assets\/integrations\b/gi,
      (match, count: string) =>
        Number(count) === dataAssets
          ? match
          : `${dataAssets} tracked data assets/integrations`,
    );
  }

  return sanitized;
}

function splitLongParagraph(paragraph: string, maxWords: number): string[] {
  const cleaned = paragraph.replace(/[ \t]+/g, " ").trim();
  if (!cleaned || wordCount(cleaned) <= maxWords)
    return cleaned ? [cleaned] : [];
  if (/^\s*[-*]\s+/.test(cleaned)) return chunkWords(cleaned, maxWords);

  const sentences = cleaned
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [cleaned];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (wordCount(sentence) > maxWords) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...chunkWords(sentence, maxWords));
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (wordCount(candidate) > maxWords && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function chunkWords(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function shouldRecoverFromRelevantClaims(question: string): boolean {
  return /\b(cfo|ceo|board|commercial|exposed|exposure|mislead|caveat|recommendation|what do we not know|don't know|not know|leadership|technology-value|value risk)\b/i.test(
    question,
  );
}

function buildClaimBackedRecoveryAnswer(input: {
  context: GroundingContext;
  tenantKey: string;
  question: string;
  modelCaveats: string[];
}): AvaAnswerPacket | null {
  const selected = selectRecoveryClaims(input.context, input.question);
  if (selected.length === 0) return null;
  const citations: AvaCitation[] = selected.map(({ tag, claim }) => ({
    id: tag,
    label: claim.statement.slice(0, 96),
    sourceClass: "tenant-fact",
    excerpt: claim.statement,
    confidence:
      claim.confidence === "low"
        ? "low"
        : claim.confidence === "medium"
          ? "medium"
          : "high",
  }));
  const caveat = sanitizeAvaVisibleText(
    recoveryCaveat(input.question, input.context, input.modelCaveats),
    input.context,
    MAX_PROSE_PARAGRAPH_WORDS,
  );
  const bullets = selected
    .slice(0, 4)
    .map(({ claim }) => `- ${compactStatement(claim.statement)}`);
  const confidence = recoveryConfidence(citations);
  const prose = [
    "Short answer: Home has enough evidence to answer directionally, but not enough to turn this into an approval recommendation.",
    bullets.join("\n\n"),
    `Confidence: ${confidence}. Support: ${citations.length} cited Home claim${citations.length === 1 ? "" : "s"}.`,
    `Caveat: ${caveat}`,
  ].join("\n\n");

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: "home_preview_qa",
    status: "partial",
    directAnswer:
      "Home can answer this directionally from cited enterprise claims, with evidence limits called out.",
    prose: sanitizeAvaVisibleText(
      prose,
      input.context,
      MAX_PROSE_PARAGRAPH_WORDS,
    ),
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [],
    citations,
    gaps: [
      {
        id: "home-ava-gap-1",
        label: "Evidence limit",
        detail: caveat,
        severity: "medium",
        citationIds: citations.map((citation) => citation.id),
      },
    ],
    caveats: [{ id: "home-ava-caveat-1", label: "Caveat", detail: caveat }],
    nextSteps: [],
    quality: {
      confidence,
      evidenceStrength: "partial",
      tenantGrounding: "complete",
      answerCompleteness: "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}

function selectRecoveryClaims(
  context: GroundingContext,
  question: string,
): TaggedClaim[] {
  const domains = matchedQuestionDomains(question);
  const chapterOrder = new Set<ChapterId>();
  for (const domain of [
    ...domains,
    "attention_decisions",
    "known_gaps",
    "enterprise_profile",
  ]) {
    const area = SPINE_AREAS.find((candidate) => candidate.key === domain);
    for (const chapter of area?.chapters ?? []) chapterOrder.add(chapter);
  }
  const ordered = context.taggedClaims
    .filter(
      (entry) => chapterOrder.size === 0 || chapterOrder.has(entry.chapterId),
    )
    .sort(
      (a, b) =>
        recoveryClaimScore(b, question) - recoveryClaimScore(a, question),
    );
  return ordered.length > 0
    ? ordered.slice(0, 5)
    : context.taggedClaims.slice(0, 5);
}

function recoveryClaimScore(entry: TaggedClaim, question: string): number {
  const normalized = question.toLowerCase();
  const statement = entry.claim.statement.toLowerCase();
  let score = 0;
  for (const token of normalized
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 3)) {
    if (statement.includes(token)) score += 2;
  }
  if (entry.claim.confidence === "high") score += 2;
  if (/\b(risk|gap|exposure|mislead|caveat|control)\b/.test(statement))
    score += 2;
  if (
    /\b(cfo|finance|financial|commercial|value|revenue|cost|spend)\b/.test(
      normalized,
    ) &&
    /\b(finance|financial|commercial|value|revenue|cost|spend|budget)\b/.test(
      statement,
    )
  )
    score += 4;
  if (
    /\b(ceo|board|leadership|decision)\b/.test(normalized) &&
    /\b(leadership|priority|decision|program|risk|value)\b/.test(statement)
  )
    score += 3;
  return score;
}

function compactStatement(statement: string): string {
  const cleaned = statement.replace(/\s+/g, " ").trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 42) return cleaned;
  return `${words.slice(0, 42).join(" ")}.`;
}

function recoveryConfidence(
  citations: AvaCitation[],
): "low" | "medium" | "high" {
  return citations.length >= 4 &&
    citations.every((citation) => citation.confidence === "high")
    ? "high"
    : citations.length >= 2
      ? "medium"
      : "low";
}

function recoveryCaveat(
  question: string,
  context: GroundingContext,
  modelCaveats: string[],
): string {
  const explicit = modelCaveats.find(
    (item) => item.trim().length > 0 && !INTERNAL_RECOVERY_CAVEAT_RE.test(item),
  );
  if (explicit) return explicit.trim();
  const selectedChapters = new Set(
    selectRecoveryClaims(context, question).map((entry) => entry.chapterId),
  );
  const payload = JSON.parse(context.promptContextJson) as {
    chapters?: Array<{ chapterId?: string; limitations?: string[] }>;
  };
  const limitation = payload.chapters
    ?.filter((chapter) => selectedChapters.has(chapter.chapterId as ChapterId))
    .flatMap((chapter) => chapter.limitations ?? [])
    .find((item) => item.trim().length > 0);
  return limitation?.trim() ?? DEFAULT_RECOVERY_CAVEAT;
}

function buildFallbackPacket(
  tenantKey: string,
  question: string,
  status: "no_data",
  directAnswer: string,
  citations: AvaCitation[],
  errorDetail?: string,
): AvaAnswerPacket {
  return {
    surface: "home",
    mode: "KNOW",
    tenantKey,
    question,
    intent: "home_preview_qa",
    status,
    directAnswer,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [],
    citations,
    gaps: [
      {
        id: "home-ava-gap-1",
        label: "Evidence limit",
        detail:
          "The requested answer was not available in a safely exportable form.",
        severity: "high",
      },
    ],
    caveats: errorDetail
      ? [{ id: "home-ava-error", label: "Advisor error", detail: errorDetail }]
      : [],
    nextSteps: [],
    quality: {
      confidence: "low",
      evidenceStrength: "thin",
      tenantGrounding: "missing",
      answerCompleteness: "blocked",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}
