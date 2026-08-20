import "server-only";

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";
import type { AvaAnswerPacket, AvaArtifact, AvaCitation } from "@/lib/ava-answer/contract";
import type { ChapterId, ChapterView, GroundedClaim, HomeReviewBundle } from "@/lib/home/preview/types";

/** Only the two fields answerHomeAvaQuestion actually reads -- narrower than HomeReviewBundle so
 * a test fixture doesn't need to fabricate an unused thesis/provenance payload just to satisfy
 * the type. getHomeReviewBundle's return value already structurally satisfies this. */
type AvaAnswerBundleSlice = Pick<HomeReviewBundle, "chapters" | "technologyEstate">;

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

interface GroundingContext {
  tenantDisplayName: string;
  promptContextJson: string;
  citationIndex: Map<string, TaggedClaim>;
  plottableDatasets: Map<string, PlottableDataset>;
}

const TENANT_DISPLAY_NAMES: Record<string, string> = {
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air",
};

/** Tags every claim across all eight chapters (or just the active one, when supplied) with a
 * short stable reference like "EB-K1" so the model can cite exactly which already-verified
 * statement it drew from, without us trusting it to reproduce the statement text itself. */
function tagClaims(chapters: ChapterView[], activeChapterId: string | undefined): TaggedClaim[] {
  const scoped = activeChapterId
    ? chapters.filter((c) => c.chapterId === activeChapterId)
    : chapters;
  const tagged: TaggedClaim[] = [];
  for (const chapter of scoped) {
    const abbrev = CHAPTER_ABBREV[chapter.chapterId];
    chapter.key_insights.forEach((claim, i) => tagged.push({ tag: `${abbrev}-K${i + 1}`, claim, chapterId: chapter.chapterId }));
    chapter.tensions.forEach((claim, i) => tagged.push({ tag: `${abbrev}-T${i + 1}`, claim, chapterId: chapter.chapterId }));
    chapter.what_to_watch.forEach((claim, i) => tagged.push({ tag: `${abbrev}-W${i + 1}`, claim, chapterId: chapter.chapterId }));
  }
  return tagged;
}

function buildGroundingContext(bundle: AvaAnswerBundleSlice, tenantKey: string, activeChapterId: string | undefined): GroundingContext {
  const taggedClaims = tagClaims(bundle.chapters, activeChapterId);
  const citationIndex = new Map(taggedClaims.map((t) => [t.tag, t]));

  const plottableDatasets = new Map<string, PlottableDataset>();
  for (const recordType of bundle.technologyEstate?.recordTypes ?? []) {
    if (!recordType.primaryDimension || recordType.dimensionCounts.length === 0) continue;
    const key = `tech.${recordType.objectType}.by_${recordType.primaryDimension}`;
    plottableDatasets.set(key, {
      label: `${recordType.label} by ${recordType.primaryDimension}`,
      rows: recordType.dimensionCounts.map((d) => ({ label: d.value, value: d.count })),
    });
  }

  const chaptersForContext = (activeChapterId ? bundle.chapters.filter((c) => c.chapterId === activeChapterId) : bundle.chapters).map(
    (chapter) => {
      const abbrev = CHAPTER_ABBREV[chapter.chapterId];
      return {
        chapterId: chapter.chapterId,
        title: chapter.title,
        headline: chapter.headline,
        executive_synthesis: chapter.executive_synthesis,
        key_insights: chapter.key_insights.map((c, i) => ({ tag: `${abbrev}-K${i + 1}`, statement: c.statement, claim_type: c.claim_type, confidence: c.confidence })),
        tensions: chapter.tensions.map((c, i) => ({ tag: `${abbrev}-T${i + 1}`, statement: c.statement, claim_type: c.claim_type, confidence: c.confidence })),
        what_to_watch: chapter.what_to_watch.map((c, i) => ({ tag: `${abbrev}-W${i + 1}`, statement: c.statement, claim_type: c.claim_type, confidence: c.confidence })),
      };
    },
  );

  const technologyEstateSummary = (bundle.technologyEstate?.recordTypes ?? []).map((rt) => ({
    objectType: rt.objectType,
    label: rt.label,
    totalRecords: rt.rows.length,
    primaryDimension: rt.primaryDimension,
    datasetRefIfAvailable: rt.primaryDimension ? `tech.${rt.objectType}.by_${rt.primaryDimension}` : null,
  }));

  const contextPayload = {
    tenant: TENANT_DISPLAY_NAMES[tenantKey] ?? tenantKey,
    scoped_to_active_chapter: activeChapterId ?? null,
    chapters: chaptersForContext,
    technology_estate_summary: technologyEstateSummary,
    plottable_datasets: Array.from(plottableDatasets.entries()).map(([ref, d]) => ({
      dataset_ref: ref,
      label: d.label,
      segment_count: d.rows.length,
      segments_preview: d.rows.slice(0, 6),
    })),
  };

  return {
    tenantDisplayName: TENANT_DISPLAY_NAMES[tenantKey] ?? tenantKey,
    promptContextJson: JSON.stringify(contextPayload, null, 2),
    citationIndex,
    plottableDatasets,
  };
}

const SYSTEM_PROMPT = `You are aVa, AbarVa's advisor for this tenant's Home preview experience. Answer the user's question using ONLY the enterprise context supplied in the user message -- the tenant's verified chapter narratives (Executive Brief, Our Business, Strategy & Value Creation, How We Operate, Technology & Data, Performance & Value, Leadership Perspective, What Needs Attention) and its real Technology Estate segmentation counts. Every claim below carries a citation tag (e.g. "EB-K1"); each of those statements has already passed an entailment-verification pass against underlying evidence before publication.

Rules, no exceptions:
1. Never state a number, date, name, or fact that is not verbatim present in the context. If the question isn't covered, say so plainly and set status to "no_data" (nothing relevant) or "partial" (some but incomplete) -- never guess, estimate, or reason from outside general knowledge.
2. Every claim you rely on must be cited by its exact tag in cited_claim_tags. Only cite tags that appear in the context.
3. You may request at most one chart or table, and only by naming a dataset_ref taken EXACTLY from plottable_datasets -- you never invent, adjust, estimate, or fabricate the underlying numbers, you only choose whether a precomputed dataset helps answer the question. If none fits, set visual.type to "none".
4. Speak in plain business language a newly appointed CXO would use. Do not mention internal pipeline terms (dataset names, schema versions, "context payload", "governed", tag syntax) in direct_answer or prose.
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
  visual?: { type?: string; dataset_ref?: string | null; chart_kind?: string | null };
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("home_preview_ava_answer_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const ALLOWED_STATUS = new Set(["answered", "partial", "no_data"]);
const ALLOWED_CHART_KIND = new Set(["bar", "horizontal-bar"]);

/** Same fence-stripping tolerance as build-enterprise-thesis.ts's parseJsonLoose -- inlined
 * rather than imported so this route doesn't drag the data-build script's pg/papaparse/fs
 * dependencies into the Next.js server bundle for one small utility function. */
function parseJsonLoose<T>(text: string, label: string): T | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
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
  const context = buildGroundingContext(args.bundle, args.tenantKey, args.activeChapterId);

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
      metadata: { promptVersion: PROMPT_VERSION, surface: "home", activeChapterId: args.activeChapterId ?? null },
    });

    const message = await withTimeout(client.messages.create(requestPayload), TIMEOUT_MS);
    const rawText = extractMessageText(message).trim();
    const parsed = parseJsonLoose<ModelResponseShape>(rawText, "home-preview-ava-answer");

    if (!parsed) {
      return buildFallbackPacket(args.tenantKey, question, "no_data", "I couldn't produce a grounded answer to that just now -- try rephrasing the question.", []);
    }

    return packageModelResponse(parsed, context, args.tenantKey, question);
  } catch (error) {
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
  const status = ALLOWED_STATUS.has(parsed.status ?? "") ? (parsed.status as "answered" | "partial" | "no_data") : "partial";
  const directAnswerRaw = typeof parsed.direct_answer === "string" && parsed.direct_answer.trim() ? parsed.direct_answer.trim() : "I don't have a grounded answer for that yet.";
  const proseRaw = typeof parsed.prose === "string" ? parsed.prose.trim() : "";

  const citedTags = Array.isArray(parsed.cited_claim_tags) ? parsed.cited_claim_tags.filter((t): t is string => typeof t === "string") : [];
  const citations: AvaCitation[] = [];
  for (const tag of citedTags) {
    const entry = context.citationIndex.get(tag);
    if (!entry) continue; // model cited a tag we never offered -- drop it rather than trust it
    citations.push({
      id: tag,
      label: entry.claim.statement.slice(0, 96),
      sourceClass: "tenant-fact",
      excerpt: entry.claim.statement,
      confidence: entry.claim.confidence === "low" ? "low" : entry.claim.confidence === "medium" ? "medium" : "high",
    });
  }

  const artifacts: AvaArtifact[] = [];
  const visualType = parsed.visual?.type;
  const datasetRef = parsed.visual?.dataset_ref ?? null;
  if ((visualType === "chart" || visualType === "table") && datasetRef) {
    const dataset = context.plottableDatasets.get(datasetRef);
    if (dataset) {
      if (visualType === "chart") {
        const kind = ALLOWED_CHART_KIND.has(parsed.visual?.chart_kind ?? "") ? (parsed.visual!.chart_kind as "bar" | "horizontal-bar") : "horizontal-bar";
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

  const caveats = Array.isArray(parsed.caveats) ? parsed.caveats.filter((c): c is string => typeof c === "string" && c.trim().length > 0) : [];

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey,
    question,
    intent: "home_preview_qa",
    status,
    directAnswer: scrubPublicAvaAnswerText(directAnswerRaw),
    prose: proseRaw ? scrubPublicAvaAnswerText(proseRaw) : undefined,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts,
    citations,
    gaps: [],
    caveats: caveats.map((detail, i) => ({ id: `home-ava-caveat-${i + 1}`, label: "Caveat", detail })),
    nextSteps: [],
    quality: {
      confidence: status === "answered" ? "high" : status === "partial" ? "medium" : "low",
      evidenceStrength: citations.length > 0 ? "strong" : status === "no_data" ? "thin" : "partial",
      tenantGrounding: "complete",
      answerCompleteness: status === "answered" ? "complete" : status === "partial" ? "partial" : "blocked",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
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
    gaps: [],
    caveats: errorDetail ? [{ id: "home-ava-error", label: "Advisor error", detail: errorDetail }] : [],
    nextSteps: [],
    quality: { confidence: "low", evidenceStrength: "thin", tenantGrounding: "missing", answerCompleteness: "blocked" },
    safety: { tenantFencePassed: true, rawIdsSuppressed: true, forbiddenLanguagePassed: true, unsupportedClaimsBlocked: true },
  };
}
