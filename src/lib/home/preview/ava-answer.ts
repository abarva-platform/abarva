import "server-only";

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import { splitNarrativeSentences } from "@/lib/home/preview/narrative-sentences";
import { assertsBlanketContractEvidenceAbsence } from "@/lib/home/preview/stale-claim-guard";
import type {
  AvaAnswerPacket,
  AvaArtifact,
  AvaCitation,
} from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import {
  answerHomeCurrentContext,
  canAnswerFromCurrentContext,
  isHomeGraphExhibitRequest,
} from "@/lib/home/preview/current-context-answer";
import {
  homeSourceCoverageGapLabelForVersion,
  homeSourceDateCoverageLabelForVersion,
  homeSourceFileReviewLabelForVersion,
  homeRecordSourceLabel,
} from "@/lib/home/preview/record-source";
import type {
  ChapterId,
  ChapterView,
  GroundedClaim,
  HomeReviewBundle,
  HomeRecordRenderSource,
  TechObjectType,
} from "@/lib/home/preview/types";
import type { HomeConversationTurn } from "./conversation";

/** Narrower than HomeReviewBundle so tests don't need to fabricate unrelated payload. The route
 * passes the full bundle, so thesis is available when the serving packet carries it; older fixtures
 * still degrade to chapter and technology summaries. */
type AvaAnswerBundleSlice = Pick<
  HomeReviewBundle,
  "chapters" | "technologyEstate"
> &
  Partial<
    Pick<
      HomeReviewBundle,
      "thesis" | "contextVersion" | "provenance" | "declaredSyntheticDemo"
    >
  >;

const PROMPT_VERSION = "home-preview-ava-answer-v10";
const CLAUDE_MODEL = "claude-sonnet-5";
// Thinking and visible text share this budget; brevity is enforced separately.
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 45_000;

const ANSWER_OUTPUT_FORMAT = {
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["answered", "partial", "no_data"] },
      direct_answer: { type: "string" },
      prose: { type: "string" },
      key_points: { type: "array", items: { type: "string" } },
      cited_claim_tags: { type: "array", items: { type: "string" } },
      visual: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["chart", "table", "none"] },
          dataset_ref: { type: ["string", "null"] },
          chart_kind: {
            anyOf: [
              { type: "string", enum: ["bar", "horizontal-bar"] },
              { type: "null" },
            ],
          },
        },
        required: ["type", "dataset_ref", "chart_kind"],
        additionalProperties: false,
      },
      caveats: { type: "array", items: { type: "string" } },
    },
    required: [
      "status",
      "direct_answer",
      "prose",
      "key_points",
      "cited_claim_tags",
      "visual",
      "caveats",
    ],
    additionalProperties: false,
  },
};

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
  declaredSyntheticDemo: boolean;
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
    key: "business_model",
    test: /\b(?:business model|revenue (?:mix|model)|operating segments|who (?:pays|we serve)|our business|about (?:the|our) business|enterprise overview)\b/i,
  },
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
    assertsBlanketContractEvidenceAbsence(statement)
  ) {
    return true;
  }

  if (
    vendorContracts !== undefined &&
    vendorContracts > 0 &&
    /^no\s+vendor\s+contracts\s+are\s+available(?:\s+for\s+review)?[.!?]?$/i.test(
      statement.trim(),
    )
  )
    return true;

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
  const sentences = splitNarrativeSentences(text);
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
      label: `${recordType.label} by ${recordType.primaryDimension
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .toLowerCase()}`,
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
    record_basis: {
      synthetic_reference: bundle.declaredSyntheticDemo ?? null,
      leadership_basis:
        bundle.declaredSyntheticDemo === true
          ? "Modelled reference responses, not actual interviews or client attestation."
          : "Use the basis declared by each cited claim; no synthetic basis is inferred.",
    },
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
    declaredSyntheticDemo: bundle.declaredSyntheticDemo === true,
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
If the question is broad but relevant cited claims are available, answer directionally with explicit limits instead of returning no_data. Use compact consulting structure: one bottom line, three or four labelled points, one next step and the evidence limits. Avoid long paragraphs.
Make direct_answer one decisive sentence. Put the supporting points in key_points, at most four by default, each starting with a short bold Markdown business label, e.g. "**Value proof:** ...". Aim for 15-25 words per point and 160 words total. In prose provide only one short "**Next step:** ..." or "**Business implication:** ..." sentence, at most 30 words; leave it empty when there is no supported next move. Never repeat direct_answer or key_points in prose. Prioritize the material business issue rather than listing everything available.
Partial value validation is not zero value. Regulated-data volume is exposure context, not proof of a compliance failure. Modelled interview answers are not actual testimony or independent client attestation. Preserve these distinctions.
Preserve the exact population and denominator of every cited financial share. Vendor spend is not technology spend, enterprise spend or total budget. Do not broaden a supplier concentration claim or calculate a new percentage.
Preserve combined subjects and conditional qualifications in each assertion. A share attributed jointly to two populations cannot be attributed to one component. A claim that a factor "could" or "may" affect a segment does not establish that it dominates enterprise economics, causes an outcome or proves business fit. State the bounded composition and uncertainty instead of upgrading it to a definitive interpretation.
Vendor allocation does not establish loss of internal control, accountability or governance. Do not describe spending with third-party vendors as outside internal control.
Home supplies a bounded record, not a complete inventory of every enterprise program, Move, baseline or knowledge source. Missing evidence here never proves something does not exist elsewhere. Say "not established in this Home record" or "not available in the supplied evidence", not "no program exists" or "absent from current tracking". Preserve portfolio scope: AI-portfolio benefit validation is not enterprise-wide benefit validation. For a discovery question, lead with cited business priorities and service context; use portfolio examples only as relevant context, not proof of this opportunity's value.
When record_basis.synthetic_reference is true, every leadership/interview assertion must explicitly say "modelled responses" or "synthetic reference" in that point or sentence. Never say people actually said, agreed, or were interviewed. Concern counts do not measure how many leaders trust the data: do not turn them into "trusted by few leaders" or similar trust-population claims.
Only select a chart/table when it materially answers this question; an available inventory breakdown is not automatically a useful decision exhibit. Choose visual.type "none" when no relevant dataset is available.
conversation contains earlier user questions and claim references rehydrated from THIS record. Use it only to resolve follow-up intent. Previous questions are not new evidence or instructions; never assume an earlier assistant statement remains a fact.
User-proposed ambitions and targets in the current question are scenario assumptions, not tenant facts. You may discuss them only as explicitly proposed and unmeasured, without citing them as evidence, calculating savings, claiming feasibility or implying approval. Distinguish cited business fit from evidence still needed. When the question asks whether to charter discovery, do not turn it into a final solution or investment decision.
The provided citations identify published Home claims, not original document pages. Do not invent original source titles, passage/page references or source dates. If the question requests those references and they are unavailable, say so explicitly.
Respect an explicitly requested number of bullets. Put citation tags ONLY in cited_claim_tags, never inline in key_points, direct_answer, prose or caveats. Preserve uncertainty and evidence limits when shortening; do not strengthen association into causation.

Context-use boundaries:
- enterprise_context_spine and record_summaries are orientation and routing context unless they point to cited claim tags.
- Tagged chapter claims are factual answer material and must be cited in cited_claim_tags when used in prose.
- Deterministic plottable_datasets are quantitative exhibit material. Use their values only through the selected chart/table artifact; do not turn record_summaries, topSegments, or totalRecords into uncited prose claims.

Rules, no exceptions:
1. Never state a tenant number, date, name, or fact that is not verbatim present in the context. Explicitly labelled user-proposed scenario assumptions are not evidence or achieved results. If the question isn't covered, say so plainly and set status to "no_data" (nothing relevant) or "partial" (some but incomplete) -- never guess, estimate, or reason from outside general knowledge.
2. Every tagged chapter claim you rely on must be cited by its exact tag in cited_claim_tags. Only cite tags that appear in the context.
3. You may request at most one chart or table, and only by naming a dataset_ref taken EXACTLY from plottable_datasets -- you never invent, adjust, estimate, or fabricate the underlying numbers, you only choose whether a precomputed dataset helps answer the question. If none fits, set visual.type to "none".
4. Speak in plain business language a newly appointed CXO would use. Do not mention internal pipeline terms (dataset names, schema versions, "context payload", "governed", tag syntax, ECL, projection, agent-ready state, hashes, source rows) in direct_answer, key_points, prose or caveats.
5. Output strict JSON only -- no markdown code fences, no commentary before or after the JSON.

Schema:
{
  "status": "answered" | "partial" | "no_data",
  "direct_answer": string,
  "prose": string,
  "key_points": string[],
  "cited_claim_tags": string[],
  "visual": { "type": "chart" | "table" | "none", "dataset_ref": string | null, "chart_kind": "bar" | "horizontal-bar" | null },
  "caveats": string[]
}`;

interface ModelResponseShape {
  status?: string;
  direct_answer?: string;
  prose?: string;
  key_points?: unknown;
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
const MAX_KEY_POINT_WORDS = 30;
const INLINE_CLAIM_TAG = `(?:${Object.values(CHAPTER_ABBREV).join("|")})-[KTW]\\d+`;
const INTERNAL_RECOVERY_CAVEAT_RE =
  /\b(advisor model|advisor engine|unparseable|could not be exported|exported safely|packag(?:e|ed|ing)|JSON|parser|parse)\b/i;
const DEFAULT_RECOVERY_CAVEAT =
  "This is a Home-level read. It is suitable for walkthrough and triage, not for final approval without source-owner confirmation.";

/** Same fence-stripping tolerance as build-enterprise-thesis.ts's parseJsonLoose -- inlined
 * rather than imported so this route doesn't drag the data-build script's pg/papaparse/fs
 * dependencies into the Next.js server bundle for one small utility function. */
function parseJsonLoose<T>(
  text: string,
  label: string,
  message?: unknown,
): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const metadata = message as
      | {
          stop_reason?: unknown;
          usage?: { output_tokens?: unknown };
        }
      | undefined;
    console.warn(
      JSON.stringify({
        event: "home_ava.answer_incomplete",
        phase: label,
        textLength: cleaned.length,
        stopReason:
          typeof metadata?.stop_reason === "string"
            ? metadata.stop_reason
            : null,
        outputTokens:
          typeof metadata?.usage?.output_tokens === "number"
            ? metadata.usage.output_tokens
            : null,
      }),
    );
    return null;
  }
}

/** Answers a free-text question about one tenant's Home preview, grounded ONLY in that tenant's
 * already-verified HomeReviewBundle -- no live DB query, no external retrieval, no fabrication.
 * Any chart/table the model requests must reference a dataset_ref this function itself computed
 * from real canonical records; the model never supplies a plotted value directly, mirroring the
 * same anti-fabrication pattern build-enterprise-thesis.ts uses for visual_opportunities. */
interface HomeAvaQuestionArgs {
  bundle: AvaAnswerBundleSlice;
  tenantKey: string;
  question: string;
  activeChapterId?: string;
  userId?: string | null;
  recordSource?: HomeRecordRenderSource;
  conversation?: HomeConversationTurn[];
}

export async function answerHomeAvaQuestion(
  args: HomeAvaQuestionArgs,
): Promise<AvaAnswerPacket> {
  const answer = await answerHomeAvaQuestionInternal(args);
  if (
    !/\b(?:original\s+(?:source|file|document)|source\s+(?:titles?|dates?|references?|refs?)|(?:page|passage)\s+(?:or\s+passage|references?|refs?))\b/i.test(
      args.question,
    )
  )
    return answer;
  return {
    ...answer,
    caveats: [
      ...answer.caveats,
      {
        id: "home-original-reference-limit",
        label: "Source reference limit",
        detail:
          "Original source title/page/passage/date references are not verified here; Evidence basis identifies Home claims or record references.",
      },
    ],
  };
}

async function answerHomeAvaQuestionInternal(
  args: HomeAvaQuestionArgs,
): Promise<AvaAnswerPacket> {
  const question = args.question.trim();
  const currentContext = args.bundle.thesis?.signalPacket.homeEnterpriseContext;
  if (
    currentContext &&
    args.bundle.contextVersion &&
    canAnswerFromCurrentContext(args.bundle.contextVersion)
  ) {
    const currentAnswer = answerHomeCurrentContext({
      context: currentContext,
      version: args.bundle.contextVersion,
      recordMarker: args.bundle.provenance?.canonical_snapshot_hash,
      tenantKey: args.tenantKey,
      question,
    });
    if (
      currentAnswer &&
      (!isHomeGraphExhibitRequest(question) ||
        currentAnswer.artifacts.some(
          (artifact) => artifact.artifact === "graph",
        ))
    ) {
      return currentAnswer;
    }
    if (isHomeGraphExhibitRequest(question)) {
      const packet = buildFallbackPacket(
        args.tenantKey,
        question,
        "no_data",
        "A verified relationship graph is not available for this current record. I cannot draw or infer those connections yet.",
        [],
      );
      return {
        ...packet,
        gaps: [
          ...packet.gaps,
          {
            id: "home-ava-relationship-scope-gap",
            label: "Typed relationship scope not verified",
            detail: graphRelationshipGap(question),
            severity: "medium",
          },
        ],
        caveats: args.bundle.declaredSyntheticDemo
          ? [
              {
                id: "home-ava-source-caveat",
                label: "Source limit",
                detail: "Synthetic reference, not client-attested.",
              },
            ]
          : [],
      };
    }
  }
  if (
    args.bundle.contextVersion &&
    args.bundle.contextVersion.coherence !== "coherent"
  ) {
    const coverageGap = homeSourceCoverageGapLabelForVersion(
      args.bundle.contextVersion,
    );
    const sourceReview = homeSourceFileReviewLabelForVersion(
      args.bundle.contextVersion,
    );
    const sourceDates = homeSourceDateCoverageLabelForVersion(
      args.bundle.contextVersion,
    );
    return buildFallbackPacket(
      args.tenantKey,
      question,
      "no_data",
      `Live rows are available, but their executive narrative has not been verified. I cannot give a cited synthesis yet. ${sourceReview}.${sourceDates ? ` ${sourceDates}.` : ""}${coverageGap ? ` ${coverageGap}` : ""}`,
      [],
    );
  }
  const context = buildGroundingContext(
    args.bundle,
    args.tenantKey,
    args.activeChapterId,
    [question, ...(args.conversation ?? []).map((turn) => turn.question)].join(
      "\n",
    ),
  );

  if (isHomeGraphExhibitRequest(question)) {
    return buildGraphUnavailablePacket({
      context,
      tenantKey: args.tenantKey,
      question,
    });
  }

  const countAnswer = answerVisibleRecordCounts(
    args.bundle,
    args.tenantKey,
    question,
    args.recordSource,
  );
  if (countAnswer) return countAnswer;

  if (
    args.bundle.declaredSyntheticDemo === true &&
    isInterviewBasisQuestion(question)
  ) {
    const packet = buildFallbackPacket(
      args.tenantKey,
      question,
      "no_data",
      "This Home record is a synthetic reference, not client-attested. Treat its leadership excerpts as modelled reference material, not verified quotations from a real interview.",
      [
        {
          id: "home-record-reference-basis",
          label: "Record declaration",
          sourceClass: "tenant-fact",
          excerpt:
            "The selected Home record declares a synthetic reference basis; it is not client-attested.",
          recordId:
            args.recordSource?.canonicalSnapshotHash ??
            args.bundle.provenance?.canonical_snapshot_hash,
          confidence: "high",
        },
      ],
    );
    return {
      ...packet,
      status: "partial",
      gaps: [
        {
          id: "home-interview-attestation-gap",
          label: "Quotation not verified",
          detail:
            "The reference declaration does not establish that a named person said these words in a real interview.",
          severity: "medium",
        },
      ],
      quality: {
        confidence: "high",
        evidenceStrength: "partial",
        tenantGrounding: "complete",
        answerCompleteness: "partial",
      },
    };
  }

  const conversation = (args.conversation ?? []).map((turn) => ({
    question: turn.question,
    cited_claims: turn.citedClaimTags.flatMap((tag) => {
      const entry = context.citationIndex.get(tag);
      return entry ? [{ tag, statement: entry.claim.statement }] : [];
    }),
  }));
  const userMessage = `Tenant: ${context.tenantDisplayName}\nQuestion: ${question}\n\nConversation intent (JSON):\n${JSON.stringify(conversation)}\n\nContext (JSON):\n${context.promptContextJson}`;

  const requestPayload = {
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: "adaptive" as const, display: "omitted" as const },
    output_config: { effort: "medium" as const, format: ANSWER_OUTPUT_FORMAT },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: userMessage }],
  };

  const startedAt = Date.now();
  try {
    const { client } = await withTimeout(
      getAuditedAnthropicClient({
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
      }),
      TIMEOUT_MS - (Date.now() - startedAt),
    );

    const generationTimeout = TIMEOUT_MS - (Date.now() - startedAt);
    if (generationTimeout <= 0)
      throw new Error("home_preview_ava_answer_timeout");

    const message = await withTimeout(
      client.messages.create(requestPayload),
      generationTimeout,
    );
    const rawText = extractMessageText(message).trim();
    let parsed = parseJsonLoose<ModelResponseShape>(
      rawText,
      "home-preview-ava-answer",
      message,
    );

    if (!parsed || needsCompactAnswerRepair(parsed, question, context)) {
      const original = parsed;
      const repairReasons = parsed
        ? compactAnswerRepairReasons(parsed, question, context)
        : ["The prior response did not match the required response structure."];
      const repairMessage = `${userMessage}\n\nConstraints requiring correction:\n${repairReasons.map((reason) => `- ${reason}`).join("\n")}\n\nAnswer correction: use at most four key_points by default, each with a bold business label, one complete sentence, 15-25 words and never more than 30. Respect the requested bullet count. For synthetic_reference=true, explicitly qualify leadership assertions as modelled responses in EACH affected point; a qualification only in caveats is insufficient. If a leadership claim cannot be qualified concisely, use another relevant cited claim rather than remove its qualification. Concern counts are not a measure of how many leaders trust data. All claim tags belong only in cited_claim_tags. Preserve qualifications and the exact financial denominator: vendor spend must not become technology spend, enterprise spend or total budget. Vendor allocation does not establish spending outside internal control. AI-portfolio validation is not enterprise-wide validation. Missing evidence here does not establish enterprise absence: qualify program, Move, baseline and evidence gaps as not established in this Home record, not nonexistent or absent from current tracking. Do not calculate a new percentage or invent a causal connection. Return the complete JSON schema.`;
      const remainingMs = TIMEOUT_MS - (Date.now() - startedAt);
      if (remainingMs > 3_000) {
        try {
          const { client: repairClient } = await withTimeout(
            getAuditedAnthropicClient({
              tenantId: args.tenantKey,
              userId: args.userId ?? undefined,
              workflow: "home-preview-ava-answer",
              model: CLAUDE_MODEL,
              dataClass: "confidential",
              prompt: `${SYSTEM_PROMPT}\n\n${repairMessage}`,
              metadata: {
                promptVersion: PROMPT_VERSION,
                surface: "home",
                activeChapterId: args.activeChapterId ?? null,
                contextScope: "enterprise_spine_plus_focus",
                presentationRepair: true,
                presentationRepairReasons: repairReasons,
              },
            }),
            remainingMs,
          );
          const repairTimeout = TIMEOUT_MS - (Date.now() - startedAt);
          if (repairTimeout > 0) {
            const repairedMessage = await withTimeout(
              repairClient.messages.create({
                ...requestPayload,
                output_config: { effort: "low", format: ANSWER_OUTPUT_FORMAT },
                messages: [{ role: "user", content: repairMessage }],
              }),
              repairTimeout,
            );
            const repaired = parseJsonLoose<ModelResponseShape>(
              extractMessageText(repairedMessage),
              "home-preview-ava-compact-repair",
              repairedMessage,
            );
            if (
              repaired &&
              repaired.status !== "no_data" &&
              Array.isArray(repaired.cited_claim_tags) &&
              repaired.cited_claim_tags.some((tag) =>
                context.citationIndex.has(tag),
              ) &&
              !needsCompactAnswerRepair(repaired, question, context)
            ) {
              parsed = {
                ...repaired,
                status:
                  original?.status === "partial" ? "partial" : repaired.status,
                cited_claim_tags: Array.from(
                  new Set([
                    ...(Array.isArray(original?.cited_claim_tags)
                      ? original.cited_claim_tags
                      : []),
                    ...repaired.cited_claim_tags,
                  ]),
                ),
                caveats: Array.from(
                  new Set([
                    ...(Array.isArray(original?.caveats)
                      ? original.caveats.filter((caveat) =>
                          isAdmittedCaveat(caveat, original, context, question),
                        )
                      : []),
                    ...(Array.isArray(repaired.caveats)
                      ? repaired.caveats
                      : []),
                  ]),
                ),
              };
            }
          }
        } catch {
          // Keep the original admitted citations when a presentation repair fails.
        }
      }
      if (parsed && needsCompactAnswerRepair(parsed, question, context)) {
        const packet = packageModelResponse(
          parsed,
          context,
          args.tenantKey,
          question,
        );
        if (
          packet.citations.length === 0 &&
          !hasUnqualifiedReferenceTestimony(parsed, context) &&
          !hasBroadenedSpendConcentration(parsed, context) &&
          !hasUnsupportedEvidenceScope(parsed, context) &&
          !hasUnsupportedQuantities(parsed, context, question)
        )
          return packet;
        return {
          ...packet,
          status: "partial",
          directAnswer:
            "I couldn't safely produce a concise summary without losing its evidence qualifications. Open Evidence basis for the supporting claims.",
          prose: undefined,
          artifacts: [],
          caveats: packet.caveats.filter((caveat) =>
            isAdmittedCaveat(caveat.detail, parsed!, context, question),
          ),
          gaps: [
            {
              id: "home-ava-compact-gap",
              label: "Concise summary unavailable",
              detail:
                "Supporting claims are retained without broadening their population or financial denominator, inferring enterprise absence, presenting modelled responses as actual testimony or cutting away qualifications.",
              severity: "medium",
              citationIds: packet.citations.map((citation) => citation.id),
            },
          ],
          quality: {
            ...packet.quality,
            confidence: "low",
            answerCompleteness: "partial",
          },
        };
      }
    }

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
        "I couldn't complete an answer just now. Please retry; this failure does not determine what your record contains.",
        [],
        undefined,
        "answer_unavailable",
      );
    }

    return packageModelResponse(parsed, context, args.tenantKey, question);
  } catch (error) {
    const metadata = error as { status?: unknown } | null;
    console.warn(
      JSON.stringify({
        event: "home_ava.request_failed",
        status: typeof metadata?.status === "number" ? metadata.status : null,
        elapsedMs: Date.now() - startedAt,
      }),
    );
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
      "I couldn't complete an answer just now. Please retry; this failure does not determine what your record contains.",
      [],
      undefined,
      "answer_unavailable",
    );
  }
}

function requestedKeyPointLimit(question: string): number {
  const requested = question
    .match(
      /\b(one|two|three|four|[1-4])\s+(?:(?:concise|crisp|short|brief|evidence-backed|evidence backed|cited|labelled|labeled)[\s,]+)*bullets?\b/i,
    )?.[1]
    .toLowerCase();
  const limits: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
  return requested ? (limits[requested] ?? Number(requested)) : 4;
}

type SpendScope = "vendor" | "technology" | "enterprise" | "unspecified";

interface SpendConcentrationAssertion {
  scope: SpendScope;
  share: string;
  count?: string;
  names: string;
}

function spendConcentrationAssertions(
  passage: string,
): SpendConcentrationAssertion[] {
  const assertions: SpendConcentrationAssertion[] = [];
  const shares = passage.matchAll(
    /\b((?:(?:over|more than|at least|less than|under|about|around|nearly)\s+)?(?:(?:a|one)\s+)?(?:quarter|third|half|majority)|\d+(?:\.\d+)?\s*(?:%|percent))\s+(?:of\s+)?(?:(?:the|total|annual|current)\s+)*((?:vendor|supplier|contract|technology|IT|tech|enterprise|company|organization|organisation|overall)|total)\s+(?:spend(?:ing)?|costs?|budget)\b/gi,
  );
  for (const match of shares) {
    const prefix = passage.slice(0, match.index);
    if (/\b(?:not|rather than|instead of)\s*$/i.test(prefix)) continue;
    const subjectPrefix = prefix.split(/[.!?;]\s+/).at(-1) ?? prefix;
    const count = subjectPrefix
      .match(
        /\b(one|two|three|four|\d+)\s+(?:other\s+)?(?:vendors?|suppliers?|contracts?)\b/i,
      )?.[1]
      .toLowerCase();
    const countNames: Record<string, string> = {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
    };
    const names = subjectPrefix
      .replace(/\*\*[^*]*:\*\*/g, "")
      .split(/\b(?:accounts?|represents?|consume[sd]?|holds?|make[s]?)\b/i)[0]
      .replace(
        /\b(?:one|two|three|four|vendors?|suppliers?|contracts?|other|together|jointly|combined|and)\b/gi,
        " ",
      )
      .replace(/\d+(?:\.\d+)?\s*%?/g, " ")
      .replace(/[^a-z0-9 ]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    const denominator = match[2].toLowerCase();
    assertions.push({
      scope: /^(?:vendor|supplier|contract)$/.test(denominator)
        ? "vendor"
        : /^(?:technology|it|tech)$/.test(denominator)
          ? "technology"
          : denominator === "total"
            ? "unspecified"
            : "enterprise",
      share: match[1]
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/ percent$/, "%")
        .replace(/\s+%$/, "%"),
      count: count ? (countNames[count] ?? count) : undefined,
      names,
    });
  }
  return assertions;
}

function hasBroadenedSpendConcentration(
  parsed: ModelResponseShape,
  context: GroundingContext,
): boolean {
  const cited = (
    Array.isArray(parsed.cited_claim_tags) ? parsed.cited_claim_tags : []
  ).flatMap((tag) => {
    const statement = context.citationIndex.get(tag)?.claim.statement;
    return statement ? spendConcentrationAssertions(statement) : [];
  });
  const vendorAssertions = cited.filter(
    (assertion) => assertion.scope === "vendor",
  );
  if (vendorAssertions.length === 0) return false;
  const passages = [
    parsed.direct_answer,
    parsed.prose,
    ...(Array.isArray(parsed.key_points) ? parsed.key_points : []),
    ...(Array.isArray(parsed.caveats) ? parsed.caveats : []),
  ].filter((value): value is string => typeof value === "string");
  // A cited supplier-share claim cannot acquire a broader spend denominator in prose.
  return passages.some((passage) =>
    spendConcentrationAssertions(passage).some(
      (assertion) =>
        assertion.scope !== "vendor" &&
        (assertion.count !== undefined ||
          vendorAssertions.some(
            (source) => source.names !== "" && source.names === assertion.names,
          )) &&
        !cited.some(
          (source) =>
            source.scope === assertion.scope &&
            source.share === assertion.share &&
            (!assertion.count || source.count === assertion.count) &&
            (!assertion.names || source.names === assertion.names),
        ),
    ),
  );
}

function hasUnqualifiedReferenceTestimony(
  parsed: ModelResponseShape,
  context: GroundingContext,
): boolean {
  if (!context.declaredSyntheticDemo) return false;
  const passages = [
    parsed.direct_answer,
    parsed.prose,
    ...(Array.isArray(parsed.key_points) ? parsed.key_points : []),
    ...(Array.isArray(parsed.caveats) ? parsed.caveats : []),
  ].filter((value): value is string => typeof value === "string");
  return passages.some((passage) => {
    const unsupportedTrust =
      /\btrusted by\s+(?:few|most|many|all)\s+(?:leaders?|executives?)\b|\b(?:few|most|many|all)\s+(?:leaders?|executives?)\s+trust\b/i.test(
        passage,
      );
    const testimony =
      /\b(?:leaders?|leadership|interviewees?)\b.{0,60}\b(?:raised|said|reported|flagged|agreed|expressed|confirmed|verified)\b|\b(?:interviewed|interviews?|testimony)\b/i.test(
        passage,
      ) ||
      /\b(?:\d[\d,]*(?:\s*(?:of|\/)\s*\d[\d,]*)?|all|most|many|few)\s+(?:of\s+the\s+)?(?:leaders?|executives?|interviewees?)\b/i.test(
        passage,
      );
    return (
      unsupportedTrust ||
      (testimony &&
        !/\b(?:modelled|modeled|synthetic|simulated)\b/i.test(passage))
    );
  });
}

function hasUnsupportedEvidenceScope(
  parsed: ModelResponseShape,
  context: GroundingContext,
): boolean {
  const citedStatements = (parsed.cited_claim_tags ?? []).flatMap((tag) => {
    const statement = context.citationIndex.get(tag)?.claim.statement;
    return statement ? [statement] : [];
  });
  const portfolioValidation = citedStatements.some(
    (statement) =>
      /\bportfolio\b/i.test(statement) &&
      /\b(?:finance[- ]validated|financial(?:ly)?[- ]validat\w*|benefit\w*|value)\b/i.test(
        statement,
      ),
  );
  const enterpriseScope =
    /\b(?:enterprise[- ]wide|entire enterprise|whole enterprise)\b/i;
  const deniesEnterpriseScope =
    /\b(?:not|no|rather than|instead of)\b[^.!?]{0,60}\b(?:enterprise[- ]wide|entire enterprise|whole enterprise)\b/i;
  const financeValidation =
    /\b(?:finance[- ]validated|financial(?:ly)?[- ]validat\w*)\b/i;
  const shares = (text: string) =>
    Array.from(text.matchAll(/\b\d+(?:\.\d+)?\s*(?:%|percent\b)/gi), (match) =>
      match[0]
        .toLowerCase()
        .replace(/\s/g, "")
        .replace(/percent$/, "%"),
    );
  const validationPopulation = (text: string) =>
    text
      .match(/\b(?:AI|programs?|technology|IT|digital|vendors?)\b/i)?.[0]
      .toLowerCase()
      .replace(/s$/, "");
  const passages = [
    parsed.direct_answer,
    parsed.prose,
    ...(Array.isArray(parsed.key_points) ? parsed.key_points : []),
    ...(Array.isArray(parsed.caveats) ? parsed.caveats : []),
  ].filter((value): value is string => typeof value === "string");
  return passages.some((passage) =>
    splitNarrativeSentences(passage).some((sentence) => {
      const boundedRecord =
        /\b(?:this|the|current|supplied|available|selected)\s+(?:Home\s+)?(?:record|evidence|context|bundle)\b|\bin Home\b|\ball\s+\d+\s+declared\s+(?:vendor\s+)?contracts?\b/i.test(
          sentence,
        );
      const absence =
        /\bno\b[^.!?]{0,180}\b(?:programs?|programmes?|initiatives?|Moves?|baselines?|evidence)\b[^.!?]{0,100}\b(?:exist\w*|available|loaded|tracked)\b|\b(?:programs?|programmes?|initiatives?|Moves?|baselines?|evidence)\b[^.!?]{0,80}\b(?:does not exist|do not exist|absent|nonexistent|not tracked)\b/i.test(
          sentence,
        );
      const enterpriseAbsence =
        /\b(?:anywhere|across|throughout|in)\s+(?:the\s+)?(?:entire\s+|whole\s+)?enterprise\b|\benterprise[- ]wide\b/i.test(
          sentence,
        );
      if (absence && (!boundedRecord || enterpriseAbsence)) return true;
      if (
        /\b(?:vendor|supplier|third[- ]party)\b/i.test(sentence) &&
        /\b(?:spend\w*|budget|cost\w*)\b/i.test(sentence) &&
        /\b(?:outside|beyond)\s+(?:our\s+|the\s+)?internal control\b/i.test(
          sentence,
        ) &&
        !/\bnot\s+(?:outside|beyond)\s+(?:our\s+|the\s+)?internal control\b/i.test(
          sentence,
        )
      )
        return true;
      return (
        portfolioValidation &&
        enterpriseScope.test(sentence) &&
        !deniesEnterpriseScope.test(sentence) &&
        /\b(?:finance[- ]validated|financial(?:ly)?[- ]validat\w*|benefit\w*|value)\b/i.test(
          sentence,
        ) &&
        !citedStatements.some(
          (source) =>
            enterpriseScope.test(source) &&
            !deniesEnterpriseScope.test(source) &&
            financeValidation.test(source) &&
            validationPopulation(sentence) !== undefined &&
            validationPopulation(source) === validationPopulation(sentence) &&
            shares(sentence).length > 0 &&
            shares(sentence).every((share) => shares(source).includes(share)),
        )
      );
    }),
  );
}

function visibleKeyPoints(
  parsed: ModelResponseShape,
  question: string,
): string[] {
  return Array.isArray(parsed.key_points)
    ? parsed.key_points
        .filter(
          (point): point is string =>
            typeof point === "string" && point.trim().length > 0,
        )
        .slice(0, requestedKeyPointLimit(question))
        .map((point) =>
          stripInlineClaimTags(point)
            .replace(/^[-*]\s+/, "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean)
    : [];
}

function quantitativeMentions(text: string) {
  const multipliers: Record<string, number> = {
    k: 1_000,
    thousand: 1_000,
    m: 1_000_000,
    million: 1_000_000,
    b: 1_000_000_000,
    billion: 1_000_000_000,
  };
  return Array.from(
    text.matchAll(
      /(?<![\w])([+-]?)(?:(\$|USD\b)\s*)?([+-]?\d+(?:,\d{3})*(?:\.\d+)?)(?:\s*(%|percent\b|[KMB]\b|thousand\b|million\b|billion\b))?(?:\s+(USD\b|dollars\b))?/gi,
    ),
    (match) => {
      const value = Number(`${match[1]}${match[3]}`.replace(/,/g, ""));
      const unit = match[4]?.toLowerCase();
      const currency = Boolean(match[2] || match[5]);
      const token =
        unit === "%" || unit === "percent"
          ? `${currency ? "usd_percent" : "percent"}:${value}`
          : `${currency ? "usd" : "number"}:${value * (multipliers[unit] ?? 1)}`;
      return {
        token,
        start: match.index!,
        end: match.index! + match[0].length,
      };
    },
  );
}

function quantitativeText(text: string): string {
  return scrubPublicAvaAnswerText(stripInlineClaimTags(text)).replace(
    /^\s*\d+[.)]\s+/gm,
    "",
  );
}

function quantitativeTokens(text: string): string[] {
  return quantitativeMentions(quantitativeText(text)).map(
    (mention) => mention.token,
  );
}

function hasUnsupportedQuantities(
  parsed: ModelResponseShape,
  context: GroundingContext,
  question: string,
): boolean {
  const supported = new Set(
    (parsed.cited_claim_tags ?? []).flatMap((tag) => {
      const statement = context.citationIndex.get(tag)?.claim.statement;
      return statement ? quantitativeTokens(statement) : [];
    }),
  );
  const proposed = new Set(quantitativeTokens(question));
  const passages = [
    parsed.direct_answer,
    parsed.prose,
    ...(Array.isArray(parsed.key_points) ? parsed.key_points : []),
    ...(Array.isArray(parsed.caveats) ? parsed.caveats : []),
  ].filter((value): value is string => typeof value === "string");
  // Orientation summaries and dataset values do not license quantitative narrative.
  return passages
    .flatMap((passage) => [
      passage,
      sanitizeAvaVisibleText(passage, context, Number.POSITIVE_INFINITY),
    ])
    .some((passage) =>
      splitNarrativeSentences(quantitativeText(passage))
        .flatMap((sentence) =>
          sentence.split(/;|:\s+|,\s+(?:but|whereas|while|yet|and)\b\s*/i),
        )
        .some((sentence) => {
          const assertsResult =
            /\b(?:achieved|delivered|measured|saved|saves|savings)\b/i.test(
              sentence.replace(
                /\b(?:not|no|without|un)\s+(?:a\s+)?(?:measured|achieved|delivered|savings)(?:\s+(?:result|commitment))?/gi,
                "",
              ),
            );
          return quantitativeMentions(sentence).some((mention) => {
            if (supported.has(mention.token)) return false;
            const before = sentence.slice(
              Math.max(0, mention.start - 80),
              mention.start,
            );
            const after = sentence.slice(mention.end, mention.end + 80);
            const targetOccurrence =
              (/\b(?:proposed|hypothetical|illustrative|assumed|unmeasured)\s+(?:[\w-]+\s+){0,4}$/i.test(
                before,
              ) ||
                /^\s*(?:(?:is|remains|as|would be)\s+)?(?:(?:only|a|an|the)\s+)?(?:proposed|hypothetical|illustrative|assumed|unmeasured)\b/i.test(
                  after,
                )) &&
              /\b(?:target|assumption|scenario|hypothesis)\b/i.test(
                `${before} ${after}`,
              );
            return !(
              targetOccurrence &&
              !assertsResult &&
              proposed.has(mention.token)
            );
          });
        }),
    );
}

function isAdmittedCaveat(
  caveat: string,
  parsed: ModelResponseShape,
  context: GroundingContext,
  question: string,
): boolean {
  const candidate = {
    cited_claim_tags: parsed.cited_claim_tags,
    caveats: [caveat],
  };
  return (
    !hasUnqualifiedReferenceTestimony(candidate, context) &&
    !hasUnsupportedEvidenceScope(candidate, context) &&
    !hasBroadenedSpendConcentration(candidate, context) &&
    !hasUnsupportedQuantities(candidate, context, question)
  );
}

function compactAnswerRepairReasons(
  parsed: ModelResponseShape,
  question: string,
  context: GroundingContext,
): string[] {
  const reasons: string[] = [];
  if (hasUnqualifiedReferenceTestimony(parsed, context))
    reasons.push(
      "Each leadership assertion must preserve its modelled or synthetic basis; concern counts do not establish a trust population.",
    );
  if (hasBroadenedSpendConcentration(parsed, context))
    reasons.push(
      "Supplier concentration must retain the cited spend population and denominator.",
    );
  if (hasUnsupportedEvidenceScope(parsed, context))
    reasons.push(
      "Evidence gaps must remain bounded to Home; portfolio validation is not enterprise-wide validation, and vendor allocation is not control loss.",
    );
  if (
    parsed.status !== "no_data" &&
    hasUnsupportedQuantities(parsed, context, question)
  )
    reasons.push(
      "Quantities in narrative must appear in the cited claims, not only orientation summaries or datasets. Omit uncited counts; keep user-supplied targets explicitly proposed and unmeasured in the same sentence. Render dataset quantities only in their selected exhibit.",
    );
  if (parsed.status === "no_data") return reasons;
  const points = visibleKeyPoints(parsed, question);
  if (
    (requestedKeyPointLimit(question) === 4 &&
      Array.isArray(parsed.key_points) &&
      parsed.key_points.length > 4) ||
    (requestedKeyPointLimit(question) < 4 &&
      points.length !== requestedKeyPointLimit(question))
  )
    reasons.push(
      `Return ${requestedKeyPointLimit(question) === 4 ? "at most 4" : requestedKeyPointLimit(question)} supporting points with the requested business labels.`,
    );
  if (
    points.some(
      (point) =>
        wordCount(
          sanitizeAvaVisibleText(point, context, MAX_PROSE_PARAGRAPH_WORDS),
        ) > MAX_KEY_POINT_WORDS,
    )
  )
    reasons.push(
      `Each complete supporting point must be at most ${MAX_KEY_POINT_WORDS} words, including its label; preserve qualifications while shortening.`,
    );
  return reasons;
}

function needsCompactAnswerRepair(
  parsed: ModelResponseShape,
  question: string,
  context: GroundingContext,
): boolean {
  return compactAnswerRepairReasons(parsed, question, context).length > 0;
}

function stripInlineClaimTags(text: string): string {
  return text
    .replace(
      new RegExp(
        `[\\[(]\\s*${INLINE_CLAIM_TAG}(?:\\s*[,;]\\s*${INLINE_CLAIM_TAG})*\\s*[\\])]`,
        "g",
      ),
      "",
    )
    .replace(new RegExp(`\\b${INLINE_CLAIM_TAG}\\b`, "g"), "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .trim();
}

function answerVisibleRecordCounts(
  bundle: AvaAnswerBundleSlice,
  tenantKey: string,
  question: string,
  recordSource?: HomeRecordRenderSource,
): AvaAnswerPacket | null {
  if (
    !/\b(how many|counts?|number of)\b/i.test(question) ||
    /\b(unique|distinct|spend|cost|value|exposure|renewals?)\b/i.test(question)
  )
    return null;
  const families: Array<{
    type: TechObjectType;
    label: string;
    test: RegExp;
  }> = [
    {
      type: "vendor_contract",
      label: "Vendor Contracts",
      test: /\b(?:vendor\s+)?contracts?\b/i,
    },
    {
      type: "data_asset_or_integration",
      label: "Data Assets & Integrations",
      test: /\bdata assets?(?:\s*(?:&|and|\/)\s*integrations?)?\b/i,
    },
    {
      type: "application_system",
      label: "Applications & Systems",
      test: /\bapplications?(?:\s*(?:&|and)\s*systems?)?\b/i,
    },
    {
      type: "infrastructure_platform",
      label: "Infrastructure & Platforms",
      test: /\b(?:(?:infrastructure\s*(?:&|and)\s*)?platforms?|infrastructure)\b/i,
    },
  ];
  const requested = families.filter((family) => family.test.test(question));
  if (requested.length === 0) return null;
  const sourceRequest =
    /\b(?:state|show|include|name)\s+(?:the\s+)?record source\b/i;
  const bulletRequest =
    /\b(?:use|give)\s+(?:one|two|three|four|[1-4])\s+(?:(?:short|concise)\s+)?bullets?\b/i;
  const wantsSource = sourceRequest.test(question);
  const wantsBullets = bulletRequest.test(question);
  let remainder = question
    .replace(/\b(?:how many|counts?|number of)\b/i, "")
    .replace(sourceRequest, "")
    .replace(bulletRequest, "")
    .replace(/\bdo not substitute another assessment or version\b/i, "")
    .replace(/\bdo not infer enterprise totals\b/i, "");
  for (const family of requested)
    remainder = remainder.replace(family.test, "");
  remainder = remainder
    .replace(
      /\b(?:what|is|are|there|do|we|have|of|for|and|the|this|selected|current|currently|available|total|in|on|record|records|rows|screen|page|rail)\b/gi,
      "",
    )
    .replace(/[\s?.,:;&!]/g, "");
  if (remainder) return null;
  const rows = requested.map((request) => {
    const family = bundle.technologyEstate?.recordTypes.find(
      (item) => item.objectType === request.type,
    );
    return {
      family: family?.label ?? request.label,
      rows: family ? family.rows.length : null,
      type: request.type,
    };
  });
  const available = rows.filter((row) => row.rows !== null);
  const missing = rows.filter((row) => row.rows === null);
  const sourceLabel = recordSource ? homeRecordSourceLabel(recordSource) : null;
  const citations: AvaCitation[] = available.map((row) => ({
    id: `home-record-count-${row.type}`,
    label: `Record on screen: ${row.family}`,
    excerpt: `${row.family}: ${row.rows} rows in the selected Home record.`,
    sourceClass: "tenant-fact",
    recordId:
      recordSource?.canonicalSnapshotHash ??
      bundle.provenance?.canonical_snapshot_hash,
    confidence: "high",
  }));
  const countSummary =
    rows
      .map(
        (row) =>
          `${row.family}: ${row.rows === null ? "not supplied" : row.rows}`,
      )
      .join("; ") + ".";
  const directAnswer = wantsBullets
    ? sourceLabel
      ? `Record on screen: ${sourceLabel}.`
      : wantsSource
        ? "Record source not supplied."
        : "Rows in the selected Home record."
    : countSummary +
      (wantsSource ? ` Record source: ${sourceLabel ?? "not supplied"}.` : "");
  const basis =
    "These are rows in the selected Home record, not unique vendors, enterprise completeness or independently verified outcomes.";
  const packet = buildFallbackPacket(
    tenantKey,
    question,
    "no_data",
    directAnswer,
    citations,
  );
  const status =
    available.length === 0
      ? "no_data"
      : missing.length > 0 || (wantsSource && !sourceLabel)
        ? "partial"
        : "answered";
  return {
    ...packet,
    status,
    ...(wantsBullets
      ? {
          prose: rows
            .map(
              (row) =>
                `- ${row.family}: ${row.rows === null ? "not supplied" : row.rows} rows.`,
            )
            .join("\n"),
        }
      : {}),
    artifacts:
      available.length > 0
        ? [
            {
              artifact: "table",
              id: "home-visible-record-counts",
              title: "Rows in the record on screen",
              note: basis,
              columns: [
                { key: "family", label: "Evidence family" },
                { key: "rows", label: "Rows", align: "right" },
              ],
              rows: rows.map((row) => ({
                family: row.family,
                rows: row.rows ?? "Not supplied",
              })),
              citationIds: citations.map((citation) => citation.id),
            },
          ]
        : [],
    gaps: [
      ...missing.map((row) => ({
        id: `home-count-gap-${row.type}`,
        label: `${row.family} not supplied`,
        detail:
          "This family is absent from the selected record; its count is unknown, not zero.",
        severity: "medium" as const,
      })),
      ...(wantsSource && !sourceLabel
        ? [
            {
              id: "home-count-source-gap",
              label: "Record source not supplied",
              detail:
                "Counts describe this bundle, but its live or reviewed source state is unknown.",
              severity: "medium" as const,
            },
          ]
        : []),
    ],
    caveats: [
      { id: "home-count-basis", label: "Counting basis", detail: basis },
    ],
    quality: {
      confidence: available.length > 0 ? "medium" : "low",
      evidenceStrength: available.length > 0 ? "strong" : "thin",
      tenantGrounding: "complete",
      answerCompleteness: status === "answered" ? "complete" : "partial",
    },
  };
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
  const keyPoints = visibleKeyPoints(parsed, question);
  const nextStep =
    typeof parsed.prose === "string" &&
    /^\*\*(?:Next step|Business implication):\*\*/i.test(parsed.prose.trim()) &&
    wordCount(parsed.prose) <= 30
      ? parsed.prose.trim()
      : "";
  const proseRaw =
    keyPoints.length > 0
      ? [
          keyPoints
            .map(
              (point) =>
                `- ${point
                  .trim()
                  .replace(/^[-*]\s+/, "")
                  .replace(/\s+/g, " ")}`,
            )
            .join("\n\n"),
          nextStep,
        ]
          .filter(Boolean)
          .join("\n\n")
      : typeof parsed.prose === "string"
        ? parsed.prose.trim()
        : "";

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
  const wantsInventoryExhibit =
    /\b(chart|table|breakdown|distribution|segments?|count|how many)\b|\b(most|largest|highest|top)\b.{0,50}\b(applications?|assets?|contracts?|vendors?|systems?)\b/i.test(
      question,
    );
  if (
    (visualType === "chart" || visualType === "table") &&
    datasetRef &&
    wantsInventoryExhibit
  ) {
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
        .filter((caveat) => isAdmittedCaveat(caveat, parsed, context, question))
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

  if (status !== "no_data" && citations.length === 0 && artifacts.length > 0) {
    const dataset = datasetRef
      ? context.plottableDatasets.get(datasetRef)
      : undefined;
    const largest = dataset?.rows.reduce(
      (best, row) => (row.value > best.value ? row : best),
      dataset.rows[0],
    );
    if (dataset && largest && datasetRef) {
      const citation: AvaCitation = {
        id: datasetRef,
        label: dataset.label,
        sourceClass: "tenant-fact",
        excerpt: `${dataset.label}: ${largest.label} has the largest count (${largest.value}).`,
        confidence: "high",
      };
      const visualPacket: AvaAnswerPacket = {
        ...buildFallbackPacket(
          tenantKey,
          question,
          "no_data",
          `${dataset.label}: ${largest.label} has the largest count (${largest.value}).`,
          [citation],
        ),
        status: "partial",
        artifacts: artifacts.map((artifact) => ({
          ...artifact,
          citationIds: [citation.id],
        })),
        gaps: [
          {
            id: "home-ava-gap-1",
            label: "Evidence limit",
            detail:
              "The exhibit shows recorded counts; it does not establish a broader business judgment.",
            severity: "medium",
          },
        ],
        quality: {
          confidence: "medium",
          evidenceStrength: "strong",
          tenantGrounding: "complete",
          answerCompleteness: "partial",
        },
      };
      if (validateAvaAnswerPacket(visualPacket).passed) return visualPacket;
    }
  }

  if (status === "no_data" || citations.length === 0) {
    return buildFallbackPacket(
      tenantKey,
      question,
      "no_data",
      "I cannot verify an answer from the cited Home evidence available here.",
      [],
    );
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
      confidence: status === "answered" ? "high" : "medium",
      evidenceStrength: "strong",
      tenantGrounding: "complete",
      answerCompleteness: status === "answered" ? "complete" : "partial",
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

function buildGraphUnavailablePacket(input: {
  context: GroundingContext;
  tenantKey: string;
  question: string;
}): AvaAnswerPacket {
  const selected = selectRecoveryClaims(input.context, input.question).slice(
    0,
    requestedKeyPointLimit(input.question),
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
    ({ claim }) => `- ${recoveryStatement(claim.statement, input.context)}`,
  );
  const caveat =
    "A graph view is not available from Home aVa for this record yet. Compiled Home claims are summary evidence, not inspected relationship records.";
  const relationshipGap = graphRelationshipGap(input.question);
  const sourceCaveat = recoveryCaveat(input.question, input.context, []);
  const prose = [
    "Short answer: Home aVa cannot render a graph for this question yet.",
    bullets.length > 0
      ? bullets.join("\n\n")
      : "No cited Home claims are available for a narrative fallback to this question.",
    relationshipGap,
    `Confidence: ${recoveryConfidence(citations)} for cited claims only; relationship confidence is not established. Support: ${citations.length} cited Home claim${citations.length === 1 ? "" : "s"}.`,
    `Caveat: ${caveat} ${sourceCaveat}`,
  ].join("\n\n");

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: "home_preview_qa",
    status: citations.length > 0 ? "partial" : "no_data",
    directAnswer:
      "Home aVa cannot render a graph for this question yet; the requested typed relationships are not verified here.",
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
      },
      {
        id: "home-ava-relationship-scope-gap",
        label: "Typed relationship scope not verified",
        detail: relationshipGap,
        severity: "medium",
      },
    ],
    caveats: [
      { id: "home-ava-caveat-1", label: "Caveat", detail: caveat },
      {
        id: "home-ava-source-caveat",
        label: "Source limit",
        detail: sourceCaveat,
      },
    ],
    nextSteps: [],
    quality: {
      confidence: recoveryConfidence(citations),
      evidenceStrength: citations.length > 0 ? "partial" : "thin",
      tenantGrounding: citations.length > 0 ? "complete" : "missing",
      answerCompleteness: citations.length > 0 ? "partial" : "blocked",
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
    .flatMap((paragraph) =>
      paragraph.split("\n").flatMap((line) => {
        const bullet = line.match(/^\s*([-*]\s+)(.*)$/);
        return splitLongParagraph(
          bullet ? bullet[2] : line,
          maxWordsPerParagraph,
        ).map((chunk) => (bullet ? `- ${chunk}` : chunk));
      }),
    )
    .join("\n\n")
    .trim();
}

function sanitizeAvaVisibleText(
  text: string,
  context: GroundingContext,
  maxWordsPerParagraph: number,
): string {
  const sanitized = scrubPublicAvaAnswerText(
    sanitizeVisibleStaleClaims(
      sanitizeRecordCountContradictions(
        compactAnswerText(stripInlineClaimTags(text), maxWordsPerParagraph),
        context,
      ),
      context,
    ),
  );
  // Restore only authored label formatting, after the label and body have both been scrubbed.
  const labels = new Set(
    Array.from(
      text.matchAll(/(?:^|\n)(?:-\s+)?\*\*([^*\n]{1,60}:)\*\*\s/g),
      (match) => scrubPublicAvaAnswerText(match[1]),
    ),
  );
  return sanitized
    .split("\n")
    .map((line) => {
      const label = line.match(/^(-\s+)?([^:\n]{1,60}:)(\s.*)$/);
      return label && labels.has(label[2])
        ? `${label[1] ?? ""}**${label[2]}**${label[3]}`
        : line;
    })
    .join("\n");
}

function sanitizeVisibleStaleClaims(
  text: string,
  context: StaleClaimContext,
): string {
  if (!text) return text;
  const replacement =
    "Use the current Vendor Contracts table for supplier concentration; the live record does not support the older supplier-pair concentration wording.";
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => {
    return paragraph
      .split("\n")
      .map((line) => {
        const bullet = line.match(/^\s*([-*]\s+)(.*)$/);
        const sentences = splitNarrativeSentences(bullet ? bullet[2] : line);
        const next = sentences
          .map((sentence) => {
            if (!isStaleAvaClaim(sentence, context)) return sentence;
            return context.vendorEvidence?.hasContractEvidence &&
              assertsBlanketContractEvidenceAbsence(sentence)
              ? "Some contract evidence is present in this record; coverage and review must be checked before drawing conclusions."
              : /^no\s+vendor\s+contracts\s+are\s+available/i.test(sentence)
                ? "Vendor contract records are present in this Home record; their evidence coverage must be checked separately."
                : replacement;
          })
          .filter(Boolean);
        const body = Array.from(new Set(next)).join(" ");
        return bullet && body ? `- ${body}` : body;
      })
      .join("\n");
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

  const sentences = splitNarrativeSentences(cleaned);
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

function isInterviewBasisQuestion(question: string): boolean {
  const sentences = splitNarrativeSentences(question);
  const firstRequest = sentences[0] ?? "";
  const requests = sentences.flatMap((sentence) =>
    sentence.split(/[,;\n]|\b(?:and|also|then|but)\b/i),
  );
  // A qualification instruction must not replace a substantive business question.
  if (
    requests.some((request) =>
      /^(?:please\s+)?(?:tell me\s+)?(?:what|why|how|where|which|recommend|compare|explore|assess|evaluate|prioritize|outline|plan)\b/i.test(
        request.trim(),
      ),
    )
  ) {
    return false;
  }
  return (
    /^(?:please\s+)?(?:(?:can|could|would|will)\s+you\s+)?(?:are|is|were|was|did|does|verify|confirm|check)\b/i.test(
      firstRequest,
    ) &&
    /\b(?:real|actual(?:ly)?|modelled|modeled|synthetic|transcripts?|transcribed|attested)\b/i.test(
      firstRequest,
    ) &&
    /\b(?:interviews?|responses?|testimony|quotes?|quotations?|say|said|words)\b/i.test(
      firstRequest,
    )
  );
}

function shouldRecoverFromRelevantClaims(question: string): boolean {
  if (isInterviewBasisQuestion(question)) return false;
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
    .slice(0, requestedKeyPointLimit(input.question))
    .map(
      ({ claim }) => `- ${recoveryStatement(claim.statement, input.context)}`,
    );
  if (
    input.context.declaredSyntheticDemo &&
    hasUnqualifiedReferenceTestimony(
      {
        status: "partial",
        direct_answer: "Cited Home claims are available for review.",
        key_points: selected
          .slice(0, requestedKeyPointLimit(input.question))
          .map(({ claim }) => claim.statement),
      },
      input.context,
    )
  ) {
    return buildFallbackPacket(
      input.tenantKey,
      input.question,
      "no_data",
      "I could not safely produce a concise, qualified summary. Open Evidence basis to review the supporting reference claims.",
      citations,
    );
  }
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
      Number.POSITIVE_INFINITY,
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

function recoveryStatement(
  statement: string,
  context: GroundingContext,
): string {
  const cleaned = statement.replace(/\s+/g, " ").trim();
  if (hasUnqualifiedReferenceTestimony({ direct_answer: cleaned }, context)) {
    return "A supporting leadership claim lacks a qualified synthetic reference basis; inspect Evidence basis before using it.";
  }
  if (wordCount(cleaned) > MAX_PROSE_PARAGRAPH_WORDS) {
    return "A supporting claim needs its full context and qualifications; review Evidence basis before drawing a conclusion.";
  }
  if (sanitizeRecordCountContradictions(cleaned, context) !== cleaned) {
    return "A compiled claim does not match the selected record; review Evidence basis and the current records before using it.";
  }
  return sanitizeAvaVisibleText(cleaned, context, Number.POSITIVE_INFINITY);
}

function recoveryConfidence(
  citations: AvaCitation[],
): "low" | "medium" | "high" {
  if (citations.some((citation) => citation.confidence === "low")) return "low";
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
  const selected = selectRecoveryClaims(context, question);
  const admitted = (item: string) =>
    item.trim().length > 0 &&
    isAdmittedCaveat(
      item,
      {
        cited_claim_tags: selected.map((entry) => entry.tag),
      },
      context,
      question,
    );
  const explicit = modelCaveats.find(
    (item) => admitted(item) && !INTERNAL_RECOVERY_CAVEAT_RE.test(item),
  );
  const selectedChapters = new Set(selected.map((entry) => entry.chapterId));
  const payload = JSON.parse(context.promptContextJson) as {
    chapters?: Array<{ chapterId?: string; limitations?: string[] }>;
  };
  const limitation = payload.chapters
    ?.filter((chapter) => selectedChapters.has(chapter.chapterId as ChapterId))
    .flatMap((chapter) => chapter.limitations ?? [])
    .find(admitted);
  return [
    explicit?.trim() ?? limitation?.trim() ?? DEFAULT_RECOVERY_CAVEAT,
    context.declaredSyntheticDemo
      ? "Synthetic reference, not client-attested."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function graphRelationshipScopes(question: string): string[] {
  return [
    { test: /\b(risks?|controls?)\b/i, scope: "risk-to-application" },
    {
      test: /\b(vendors?|suppliers?|contracts?)\b/i,
      scope: "vendor/contract-to-application",
    },
    {
      test: /\b(data|integrations?|analytics)\b/i,
      scope: "application-to-data asset",
    },
    { test: /\b(programs?|initiatives?)\b/i, scope: "program-to-application" },
    {
      test: /\b(platforms?|infrastructure|hosting)\b/i,
      scope: "application-to-platform",
    },
    {
      test: /\b(organizations?|organisations?|ownership|capabilities)\b/i,
      scope: "organization-to-capability",
    },
  ]
    .filter(({ test }) => test.test(question))
    .map(({ scope }) => scope);
}

function graphRelationshipGap(question: string): string {
  const scope =
    graphRelationshipScopes(question).join(", ") ||
    "requested typed relationships";
  return `Typed relationship scope not verified here: ${scope}. Endpoint IDs, declared relationship types and source evidence need inspection. This does not establish that these links are absent from the source.`;
}

/** The route's follow-up selector can use this without earlier conversation or new model input. */
export function homeAvaAnswerFollowUpQuestions(
  answer: AvaAnswerPacket,
): string[] {
  const normalize = (question: string) =>
    question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const details = [
    answer.directAnswer,
    answer.prose ?? "",
    ...answer.gaps.map((gap) => `${gap.label} ${gap.detail}`),
    ...answer.caveats.map((caveat) => caveat.detail),
    ...answer.citations.map((citation) => citation.excerpt ?? ""),
  ].join(" ");
  const graphGap = answer.gaps.some((gap) =>
    /graph|typed relationship/i.test(`${gap.label} ${gap.detail}`),
  );
  let candidates: string[];
  if (graphGap) {
    const scopes = graphRelationshipScopes(answer.question);
    const scope = scopes.join(", ") || "the requested typed relationships";
    candidates = [
      `What evidence is needed to verify ${scope}?`,
      "Which endpoint IDs and declared relationship types can we inspect for the requested graph?",
      answer.citations.length > 0
        ? "What do the cited summaries establish, and which requested connections remain unverified?"
        : "Which records would provide source evidence for the requested connections?",
    ];
  } else if (/\b(?:charter(?:ing)?|discovery)\b/i.test(answer.question)) {
    candidates = [
      "Which cited business priorities support this opportunity, and what could change its priority?",
      "What baseline and evidence are needed before chartering discovery?",
      /\b(?:self-service|deflection)\b/i.test(answer.question) &&
      /\bagent assist\b/i.test(answer.question)
        ? "How should we assess successful self-service resolution and Agent Assist separately?"
        : "Which accountable owners and dependencies should discovery verify first?",
    ];
  } else {
    const topics: Record<string, string> = {
      enterprise_profile: "enterprise context",
      business_model: "the business model",
      strategy_priorities: "strategic priorities",
      operating_model: "operating ownership",
      programs_transformation: "program delivery",
      applications_technology: "applications and technology",
      data_analytics_ai: "data and analytics",
      infrastructure_hosting: "hosting and resilience",
      vendors_contracts: "vendor and contract exposure",
      financials_value: "financial value",
      risks_controls: "risk and controls",
      leadership_themes: "leadership themes",
    };
    const topicFor = (text: string) =>
      matchedQuestionDomains(text)
        .map((domain) => topics[domain])
        .find(Boolean);
    const topic =
      topicFor(answer.question) ?? topicFor(details) ?? "this question";
    const gapTopic =
      topicFor(answer.gaps.map((gap) => gap.detail).join(" ")) ?? topic;
    candidates = [
      answer.citations.length > 0
        ? `How do the cited claims about ${topic} affect the decision in this question?`
        : `What can the selected Home record establish about ${topic}?`,
      answer.gaps.length > 0 || answer.caveats.length > 0
        ? `Which evidence gaps about ${gapTopic} should we verify first?`
        : `Which assumptions about ${topic} need validation before acting?`,
      `Which supporting sources can we inspect for ${topic}?`,
    ];
  }
  const seen = new Set([normalize(answer.question)]);
  return candidates
    .filter((candidate) => {
      const key = normalize(candidate);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function buildFallbackPacket(
  tenantKey: string,
  question: string,
  status: "no_data",
  directAnswer: string,
  citations: AvaCitation[],
  errorDetail?: string,
  failureKind: "evidence_limit" | "answer_unavailable" = "evidence_limit",
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
        label:
          failureKind === "answer_unavailable"
            ? "Answer unavailable"
            : "Evidence limit",
        detail:
          failureKind === "answer_unavailable"
            ? "The response could not be completed. Supporting evidence has not been assessed by this failed response."
            : "No cited Home evidence supports the requested answer.",
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
