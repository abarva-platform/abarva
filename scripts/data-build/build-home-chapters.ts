#!/usr/bin/env npx tsx
/**
 * The eight-chapter Home writer, built on top of the EnterpriseThesis, not instead of it.
 *
 *   EnterpriseSignalPacket -> EnterpriseThesis -> verified/repaired claims -> Narrative Spine
 *                                                                                    |
 *                                                                    8 chapter writers (this file)
 *
 * The whole reason this file exists as a thin layer over the thesis rather than eight independent
 * generation calls is a specific failure mode: eight chapters that each reason about the raw
 * signal packet from scratch can disagree with each other -- one deciding the enterprise is
 * fundamentally a transformation story, another deciding it's fundamentally a vendor-dependency
 * story, with no shared spine forcing consistency. One thesis, eight views: every chapter here is
 * assembled from claims that already exist in the single published EnterpriseThesis, routed
 * deterministically (which array, which domain) rather than rediscovered, and each chapter's own
 * headline/executive_synthesis prose is generated FROM its assigned claim slice under the exact
 * same grounding discipline as build-enterprise-thesis.ts's prose synthesis -- a chapter may not
 * assert anything its assigned claims don't establish.
 *
 * Deliberately plan-only. There is no :apply path in this file at all -- not gated behind an env
 * var, not present as dead code to flip on later. Writing chapter packs to a production table,
 * switching /home, and removing the legacy reader are a separate, later decision once this output
 * has actually been reviewed.
 *
 * Usage:
 *   npx tsx scripts/data-build/build-home-chapters.ts [--tenant <key>] [--out-dir <dir>]
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  buildTenant,
  callClaude,
  parseJsonLoose,
  type ReasoningEffort,
  THESIS_PROMPT_VERSION,
  type EnterpriseThesis,
  type GroundedClaim,
  type VisualOpportunity,
} from "./build-enterprise-thesis";
import type { Signal, ContextItem, buildEnterpriseSignalPacket } from "./enterprise-signal-packet";
import { buildTechnologyEstateBundle } from "./technology-estate";
import {
  scoreLensDivergence,
  findInventedNumbers,
  findApplicationCountErrors,
  findInventoryOpening,
  JUDGMENT_CLASS_RULES_UNCHECKED,
  type LensTermClass,
  type ScorableChapter,
  type MustNotDoViolation,
} from "./home-lens-quality";

type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;
type HomeLensContract = {
  hat?: string;
  primaryAudience?: string;
  promptInstruction?: string;
  evidencePriority?: string[];
  style?: string;
  mustNotDo?: string[];
};
type HomePagePromptContract = {
  pageKey?: string;
  label?: string;
  writerLens?: string;
  voice?: string;
  decisionQuestion?: string;
  requiredContext?: string[];
  sourceLayerReads?: string[];
  mustShow?: string[];
  forbidden?: string[];
  lensContract?: HomeLensContract;
};
type EnterpriseSignalPacketWithPromptContracts = EnterpriseSignalPacket & {
  pagePromptContracts?: HomePagePromptContract[];
};

/* ------------------------------------------------------------------------------------------------
 * Provenance -- the generated institutional narrative needs lineage the same way any other
 * governed artifact does. Bump home_synthesis_contract_version when ChapterView's shape changes
 * in a way a consumer needs to know about; bump the prompt versions when SYSTEM_PROMPT or
 * CHAPTER_SYNTHESIS_SYSTEM_PROMPT change meaningfully; bump verification_version when the
 * verification/repair architecture itself changes (e.g. this session's targeted-repair-v2, which
 * extended entailment verification to performance_story and questions_for_management).
 * ---------------------------------------------------------------------------------------------- */

/**
 * Which term class each chapter's hat is supposed to over-index on. Two pairs deliberately share a
 * class (executive_brief/what_needs_attention, our_business/strategy_value_creation) because those
 * hats genuinely are adjacent -- a low separation there is interpretable, not a defect by itself.
 */
const CHAPTER_EXPECTED_LENS_CLASS: Record<ChapterId, LensTermClass> = {
  executive_brief: "money_decision",
  our_business: "strategy_bets",
  strategy_value_creation: "strategy_bets",
  how_we_operate: "operating_accountability",
  technology_data: "architecture_dependency",
  performance_value: "value_governance",
  leadership_perspective: "testimony_attribution",
  what_needs_attention: "money_decision",
};

const HOME_SYNTHESIS_CONTRACT_VERSION = "home-chapters-v1";
const CHAPTER_PROMPT_VERSION = "home-chapters/v1.1-page-lenses";
const VERIFICATION_VERSION = "targeted-repair-v2";

export interface HomeChapterAssemblyLimits {
  executiveBriefQuestions: number;
  executiveBriefKeyInsights: number;
  executiveBriefTensions: number;
  executiveBriefWatch: number;
}

export const HOME_CHAPTER_ASSEMBLY_LIMITS: HomeChapterAssemblyLimits = {
  executiveBriefQuestions: 5,
  executiveBriefKeyInsights: 5,
  executiveBriefTensions: 3,
  executiveBriefWatch: 2,
};

export const HOME_CHAPTER_WIDE_ASSEMBLY_LIMITS: HomeChapterAssemblyLimits = {
  executiveBriefQuestions: Number.POSITIVE_INFINITY,
  executiveBriefKeyInsights: Number.POSITIVE_INFINITY,
  executiveBriefTensions: Number.POSITIVE_INFINITY,
  executiveBriefWatch: Number.POSITIVE_INFINITY,
};

export const HOME_CHAPTER_SYNTHESIS_OPTIONS = {
  maxTokens: 3072,
  effort: "low" as ReasoningEffort,
};

export const HOME_CHAPTER_WIDE_BUDGET_SYNTHESIS_OPTIONS = {
  maxTokens: 8192,
  effort: "medium" as ReasoningEffort,
};

export interface HomeReviewBundleProvenance {
  home_synthesis_contract_version: string;
  thesis_prompt_version: string;
  chapter_prompt_version: string;
  model: string;
  signal_packet_version: string;
  /** sha256 of the signal packet's own JSON -- identical algorithm to the content-hash already
   * used in build-enterprise-thesis.ts's DB-write dedup check, so the two stay comparable. */
  canonical_snapshot_hash: string;
  verification_version: string;
  generated_at: string;
  /** Only populated when run as an ACA operator job (see scripts/ops/submit-aca-operator-job.mjs,
   * which sets these env vars) -- null for a local run. generation_commit_sha is the operator's
   * local `git rev-parse HEAD` at job-submission time (useful for reproducing a run during dev,
   * NOT necessarily the deployed image's build SHA if the caller's branch was ahead of what was
   * actually built). generation_image_digest is the authoritative one: the exact digest-pinned
   * image that ran, which is traceable back to its build commit via the ACR/GitHub Actions log. */
  generation_commit_sha: string | null;
  generation_image_digest: string | null;
}

export function buildHomeChapterProvenance(signalPacket: EnterpriseSignalPacket, thesisPromptVersion: string, generatedAt: string): HomeReviewBundleProvenance {
  return {
    home_synthesis_contract_version: HOME_SYNTHESIS_CONTRACT_VERSION,
    thesis_prompt_version: thesisPromptVersion,
    chapter_prompt_version: CHAPTER_PROMPT_VERSION,
    model: "claude-sonnet-5",
    signal_packet_version: "v1",
    canonical_snapshot_hash: crypto.createHash("sha256").update(JSON.stringify(signalPacket)).digest("hex"),
    verification_version: VERIFICATION_VERSION,
    generated_at: generatedAt,
    generation_commit_sha: process.env.ABARVA_OPERATOR_BRANCH_COMMIT ?? null,
    generation_image_digest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
  };
}

const TENANTS = (() => {
  const i = process.argv.indexOf("--tenant");
  return i > -1 ? [process.argv[i + 1]] : ["meridian-health", "skyharbor-air"];
})();
const OUT_DIR = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/home-chapters";
})();
const MEASURE_QUALITY = process.argv.includes("--measure-quality");

/* ------------------------------------------------------------------------------------------------
 * Chapter shape and definitions
 * ---------------------------------------------------------------------------------------------- */

export type ChapterId =
  | "executive_brief" | "our_business" | "strategy_value_creation" | "how_we_operate"
  | "technology_data" | "performance_value" | "leadership_perspective" | "what_needs_attention";

export interface ChapterView {
  chapterId: ChapterId;
  title: string;
  guidingQuestion: string;
  headline: string;
  executive_synthesis: string;
  key_insights: GroundedClaim[];
  tensions: GroundedClaim[];
  what_to_watch: GroundedClaim[];
  questions_to_ask: string[];
  visual_opportunities: VisualOpportunity[];
  limitations: string[];
}

const CHAPTER_DEFS: Array<{ id: ChapterId; title: string; guidingQuestion: string; writerLens: string }> = [
  {
    id: "executive_brief",
    title: "Executive Brief",
    guidingQuestion: "What should I understand in my first ten minutes?",
    writerLens: "Wear the CEO/board-adviser hat. Lead with business consequence, decision urgency, money, risk, and what a new executive should do next.",
  },
  {
    id: "our_business",
    title: "Our Business",
    guidingQuestion: "How does this enterprise work and create value?",
    writerLens: "Wear the business-strategy consultant hat. Explain the operating model, value pools, customer or member economics, and where technology or vendors constrain the model.",
  },
  {
    id: "strategy_value_creation",
    title: "Strategy & Value Creation",
    guidingQuestion: "Where are we trying to go, and what bets are we making?",
    writerLens: "Wear the corporate-strategy and value-creation hat. Tie priorities, programs, funding, KPIs, and value proof together only where cited evidence exists.",
  },
  {
    id: "how_we_operate",
    title: "How We Operate",
    guidingQuestion: "How is the enterprise organized and how does work get done?",
    writerLens: "Wear the operating-model adviser hat. Explain organization, ownership, process evidence, workforce constraints, and decision accountability.",
  },
  {
    id: "technology_data",
    title: "Technology & Data",
    guidingQuestion: "What enables the business, and where is complexity or dependency concentrated?",
    writerLens: "Wear the expert CTO, enterprise architect, and data-platform leader hat. Explain system blocks, hosting, integrations, data/BI/ETL workloads, platform risk, and architecture consequences in technology-native language that a business executive can still follow.",
  },
  {
    id: "performance_value",
    title: "Performance & Value",
    guidingQuestion: "Are we moving toward outcomes, and can we prove the value?",
    writerLens: "Wear the CFO/value-governance hat. Separate investment, committed value, measured value, blocked value, attestation, and evidence gaps.",
  },
  {
    id: "leadership_perspective",
    title: "Leadership Perspective",
    guidingQuestion: "What do leaders agree on, disagree on, and worry about?",
    writerLens: "Wear the executive-interview synthesis hat. Summarize quoted themes, priorities, disagreements, operating pain, and AI ambition by role and function without converting opinions into facts.",
  },
  {
    id: "what_needs_attention",
    title: "What Needs Attention",
    guidingQuestion: "What tensions, risks, dependencies and decisions deserve executive attention?",
    writerLens: "Wear the transformation-office and risk-committee hat. Name the few decisions, dependencies, owners, evidence gaps, and next actions that merit executive attention.",
  },
];

/* ------------------------------------------------------------------------------------------------
 * Deterministic claim/visual/question routing -- domains a claim's evidence touches decide which
 * chapter(s) it's eligible for. Executive Brief is the one deliberate exception: it's a landing-
 * page synthesis and is allowed to echo top items other chapters also carry.
 * ---------------------------------------------------------------------------------------------- */

/** Only the split this file actually makes: does a claim's evidence touch the technology estate,
 * or not. Structural constraints and operating tensions each split into a tech bucket and an
 * everything-else (operations) bucket using this one set -- no need for a domain set per chapter
 * when a single binary split covers the routing this file does. */
const TECH_DOMAINS = new Set([
  "application_system", "vendor_contract", "spend_value_fact", "infrastructure_platform",
  "data_asset_or_integration", "platform_maturity_assessment", "managed_service_scope",
]);

function claimDomains(claim: GroundedClaim, signalPacket: ReturnType<typeof import("./enterprise-signal-packet").buildEnterpriseSignalPacket>): Set<string> {
  const byId = new Map<string, Signal | ContextItem>([
    ...signalPacket.signals.map((s): [string, Signal | ContextItem] => [s.id, s]),
    ...signalPacket.contextItems.map((c): [string, Signal | ContextItem] => [c.id, c]),
  ]);
  const domains = new Set<string>();
  for (const id of claim.evidence_ids) {
    const item = byId.get(id);
    item?.domains.forEach((d) => domains.add(d));
  }
  return domains;
}

function touchesAny(domains: Set<string>, target: Set<string>): boolean {
  for (const d of domains) if (target.has(d)) return true;
  return false;
}

/** Verifier-rejected claims survive as `null` in place (see dropClaim) rather than being spliced
 * out, so every consumer of a GroundedClaim array must filter dead entries before use. */
function alive(arr: (GroundedClaim | null)[]): GroundedClaim[] {
  return arr.filter((c): c is GroundedClaim => c !== null);
}

/** Named dataset -> preferred chapter, extended from the 3-chapter prototype to all 8. */
const VISUAL_PREFERRED_CHAPTER: Record<string, ChapterId> = {
  vendor_spend_concentration: "technology_data",
  technology_spend_mix: "technology_data",
  application_landscape_by_function: "technology_data",
  data_workload_by_function: "technology_data",
  data_workload_by_technology: "technology_data",
  program_investment_distribution: "strategy_value_creation",
  stalled_programs: "strategy_value_creation",
  metric_target_attainment: "performance_value",
  leadership_theme_frequency: "leadership_perspective",
  leadership_evidence_alignment: "leadership_perspective",
  risk_system_concentration: "what_needs_attention",
};
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Every visual appears in exactly one non-Executive-Brief chapter (same discipline as the
 * 3-chapter prototype, generalized) -- Executive Brief separately borrows the single
 * highest-priority visual across the whole thesis as its own landing exhibit. */
export function assignVisuals(thesis: EnterpriseThesis): Record<ChapterId, VisualOpportunity[]> {
  const byChapter: Record<ChapterId, VisualOpportunity[]> = {
    executive_brief: [], our_business: [], strategy_value_creation: [], how_we_operate: [],
    technology_data: [], performance_value: [], leadership_perspective: [], what_needs_attention: [],
  };
  const ordered = [...thesis.visual_opportunities].sort((a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3));
  for (const v of ordered) {
    const chapter = VISUAL_PREFERRED_CHAPTER[v.dataset_ref] ?? "what_needs_attention";
    byChapter[chapter].push(v);
  }
  if (ordered[0]) byChapter.executive_brief.push(ordered[0]);
  return byChapter;
}

/** What each chapter's readers would recognise as *their* gap. Deliberately narrower than the
 * question keywords: a question routed to a slightly-off chapter is a mild misfile, but a gap
 * routed everywhere stops reading as a finding and starts reading as boilerplate. */
const CHAPTER_GAP_KEYWORDS: Partial<Record<ChapterId, string[]>> = {
  our_business: ["segment", "revenue", "customer"],
  strategy_value_creation: ["program", "initiative", "portfolio", "bet"],
  how_we_operate: ["workforce", "process", "org ", "role"],
  technology_data: ["vendor", "contract", "application", "integration", "system", "platform", "infrastructure"],
  performance_value: ["metric", "baseline", "target", "kpi", "notation"],
  leadership_perspective: ["leadership", "sentiment", "interview"],
};

/** Routes thesis-level `evidence_gaps` to the chapters they actually bear on.
 *
 * Gaps are the only client-safe absence signal the thesis produces. `structuralIssues` and the
 * verification ledger are *builder* records -- they speak in claim paths and verdict vocabulary
 * (`value_creation_model.primary_value_drivers[1]`, `claim_type=CROSS_DOMAIN_INSIGHT`) and must
 * never reach a client surface -- and most ledger entries are repairs rather than absences anyway.
 *
 * Unlike questions, a gap is not exclusive: one missing dataset can legitimately limit two
 * chapters, so a gap may route to more than one and is not consumed by the first match. A gap
 * matching no chapter is a whole-build limitation and belongs in the Executive Brief, where the
 * reader is being told what this record can and cannot support. */
export function assignEvidenceGaps(thesis: EnterpriseThesis): Record<ChapterId, string[]> {
  const gaps = thesis.evidence_gaps ?? [];
  const byChapter: Record<ChapterId, string[]> = {
    executive_brief: [], our_business: [], strategy_value_creation: [], how_we_operate: [],
    technology_data: [], performance_value: [], leadership_perspective: [], what_needs_attention: [],
  };
  for (const gap of gaps) {
    const text = gap.toLowerCase();
    let routed = false;
    for (const [chapterId, keywords] of Object.entries(CHAPTER_GAP_KEYWORDS) as Array<[ChapterId, string[]]>) {
      if (keywords.some((k) => text.includes(k))) {
        byChapter[chapterId].push(gap);
        routed = true;
      }
    }
    if (!routed) byChapter.executive_brief.push(gap);
  }
  return byChapter;
}

const CHAPTER_QUESTION_KEYWORDS: Partial<Record<ChapterId, string[]>> = {
  our_business: ["business", "segment", "revenue", "customer", "channel"],
  strategy_value_creation: ["priority", "program", "bet", "strategic", "portfolio", "return"],
  how_we_operate: ["operate", "process", "workforce", "organization", "staff"],
  technology_data: ["vendor", "contract", "technology", "data", "metric", "notation", "baseline", "platform"],
  performance_value: ["metric", "kpi", "value", "outcome", "target"],
  leadership_perspective: ["leader", "leadership", "sentiment", "contradict"],
};

/** questions_for_management is a GroundedClaim[] like every other thesis section (a live run found
 * questions embedding fabricated factual premises with zero evidence backing, and a question is
 * not exempt from the evidence rule just because it's phrased as a question) -- so this, like
 * assembleChapterSlices, must drop verifier-rejected (null) entries before routing, and route by
 * the question's own statement text rather than a raw string. */
function takeLimit<T>(items: T[], limit: number): T[] {
  return Number.isFinite(limit) ? items.slice(0, limit) : items;
}

const ENTERPRISE_OPENING_RE =
  /\b(?:enterprise|estate|application|system|source-target|data movement|flow|workload|analytics|reporting|ETL|script|business function|provider|payer|operating model)\b/i;
const COMMERCIAL_OPENING_RE =
  /\b(?:vendor|supplier|supplier group|top five supplier|contract|contracted value|commercial exposure|ready contract value|reviewed contract value)\b/i;
const EVIDENCE_BOUNDARY_OPENING_RE =
  /\b(?:not supplied|not yet supplied|not available|does not yet establish|should therefore be limited|do not infer|coverage gap|evidence gap|missing evidence|not enough verified evidence|not client-attested|synthetic)\b/i;

function unsuitableExecutiveOpening(statement: string): boolean {
  return COMMERCIAL_OPENING_RE.test(statement) || EVIDENCE_BOUNDARY_OPENING_RE.test(statement);
}

function enterpriseOpeningClaims(claims: GroundedClaim[]): GroundedClaim[] {
  const suitable = claims.filter((claim) => !unsuitableExecutiveOpening(claim.statement));
  if (suitable.length === 0) return [];
  const enterpriseShape = suitable.filter((claim) => ENTERPRISE_OPENING_RE.test(claim.statement));
  return enterpriseShape.length
    ? [
        ...enterpriseShape,
        ...suitable.filter((claim) => !enterpriseShape.includes(claim)),
      ]
    : suitable;
}

export function assignQuestions(
  thesis: EnterpriseThesis,
  limits: HomeChapterAssemblyLimits = HOME_CHAPTER_ASSEMBLY_LIMITS,
): Record<ChapterId, string[]> {
  const questions = alive(thesis.questions_for_management);
  const byChapter: Record<ChapterId, string[]> = {
    executive_brief: takeLimit(questions, limits.executiveBriefQuestions).map((q) => q.statement),
    our_business: [], strategy_value_creation: [], how_we_operate: [],
    technology_data: [], performance_value: [], leadership_perspective: [], what_needs_attention: [],
  };
  const claimed = new Set<string>();
  for (const [chapterId, keywords] of Object.entries(CHAPTER_QUESTION_KEYWORDS) as Array<[ChapterId, string[]]>) {
    for (const q of questions) {
      if (claimed.has(q.statement)) continue;
      if (keywords.some((k) => q.statement.toLowerCase().includes(k))) {
        byChapter[chapterId].push(q.statement);
        claimed.add(q.statement);
      }
    }
  }
  const leftover = questions.filter((q) => !claimed.has(q.statement));
  byChapter.what_needs_attention.push(...leftover.map((q) => q.statement));
  return byChapter;
}

/** Assembles all eight chapters' claim/visual/question slices deterministically -- no model call.
 * This is the "one thesis, eight views" router: every claim keeps citing the same evidence it
 * already cited in the thesis, just organized by which chapter it belongs in. */
export function assembleChapterSlices(
  thesis: EnterpriseThesis,
  signalPacket: ReturnType<typeof import("./enterprise-signal-packet").buildEnterpriseSignalPacket>,
  limits: HomeChapterAssemblyLimits = HOME_CHAPTER_ASSEMBLY_LIMITS,
): Record<ChapterId, { key_insights: GroundedClaim[]; tensions: GroundedClaim[]; what_to_watch: GroundedClaim[] }> {
  const structural = alive(thesis.structural_constraints);
  const operating = alive(thesis.operating_tensions);
  const techStructural = structural.filter((c) => touchesAny(claimDomains(c, signalPacket), TECH_DOMAINS));
  const opsStructural = structural.filter((c) => !techStructural.includes(c));
  const techOperating = operating.filter((c) => touchesAny(claimDomains(c, signalPacket), TECH_DOMAINS));
  const opsOperating = operating.filter((c) => !techOperating.includes(c));

  const performanceAll = [
    ...alive(thesis.performance_story.where_improving),
    ...alive(thesis.performance_story.where_off_track),
    ...alive(thesis.performance_story.where_unknown),
  ];

  return {
    executive_brief: {
      key_insights: takeLimit(enterpriseOpeningClaims(alive(thesis.things_a_new_cxo_should_know)), limits.executiveBriefKeyInsights),
      tensions: takeLimit(alive(thesis.what_needs_attention), limits.executiveBriefTensions),
      what_to_watch: takeLimit(alive(thesis.material_risks), limits.executiveBriefWatch),
    },
    our_business: {
      key_insights: [...alive(thesis.value_creation_model.primary_value_drivers), ...alive(thesis.value_creation_model.economic_dependencies)],
      tensions: [],
      what_to_watch: [],
    },
    strategy_value_creation: {
      key_insights: alive(thesis.strategic_bets),
      tensions: opsOperating,
      what_to_watch: [],
    },
    how_we_operate: {
      key_insights: opsStructural,
      tensions: [],
      what_to_watch: [],
    },
    technology_data: {
      key_insights: alive(thesis.technology_and_data_implications),
      tensions: techStructural,
      what_to_watch: techOperating,
    },
    performance_value: {
      key_insights: performanceAll,
      tensions: alive(thesis.value_realization_tensions),
      what_to_watch: [],
    },
    leadership_perspective: {
      key_insights: alive(thesis.leadership_consensus),
      tensions: alive(thesis.leadership_disagreements),
      what_to_watch: [],
    },
    what_needs_attention: {
      key_insights: alive(thesis.what_needs_attention),
      tensions: alive(thesis.material_risks),
      what_to_watch: [],
    },
  };
}

/* ------------------------------------------------------------------------------------------------
 * Per-chapter narrative synthesis -- grounded strictly in the chapter's assigned claims. This is
 * not independent reasoning about the enterprise; it is prose written from a pre-approved slice,
 * under the same "assert nothing the claims don't establish" discipline as the thesis's own prose
 * synthesis.
 * ---------------------------------------------------------------------------------------------- */

const CHAPTER_SYNTHESIS_SYSTEM_PROMPT = `You are writing one chapter of an executive Home
narrative. You are given this chapter's title, the question it exists to answer, and the specific
claims -- already verified, already approved -- this chapter is allowed to draw from. Every other
chapter in this Home experience is being written the same way, from its own claim slice of the
same underlying thesis; you are not reasoning about the enterprise from scratch, you are giving
voice to a section of an already-verified analysis.

Produce two things:
1. A headline: one answer-first sentence stating this chapter's most important, defensible
   takeaway -- not a topic label ("Technology & Data") but an actual claim ("Third-party spend
   concentrates dependency in a handful of vendors").
2. An executive_synthesis: a short paragraph (120-200 words) that reads as flowing prose,
   connecting the chapter's assigned claims into a coherent narrative answering the guiding
   question.

Discipline, same as everywhere else in this pipeline: assert nothing beyond what the assigned
claims state. Do not introduce a new fact, number, ranking, or causal link. If the assigned claims
are thin or don't fully answer the guiding question, say so honestly in the synthesis rather than
inventing material to fill the gap -- an honest "the current evidence does not yet establish X" is
correct output, not a failure.

For the Executive Brief, the headline must not be a supplier/contract fact, an evidence-boundary
caveat, or a standalone inventory count. Lead with the business consequence a new executive should
understand first. If no assigned claim supports that, return an executive-use limitation instead of
turning a caveat into the headline.

Write for a CXO or newly hired business/technology executive, not for the builder of this system.
Do not use implementation vocabulary such as ECL, projection, serving view, loaded rows, canonical
entity, payload, schema, source room, provider flag, adapter, upsert, hydration step, row type, writer,
generator, pipeline, or manifest. Use plain business language for the surface a leader would see.

Use the chapter-specific writer lens supplied in the user prompt. The lens changes the posture, not
the evidence boundary: the Executive Brief should read like business-strategy advice, Technology &
Data should read like an expert technologist and enterprise architect explaining consequences,
Performance & Value should read like CFO value governance, and Leadership Perspective should read
like interview synthesis. Never let the lens introduce facts not present in the assigned claims.

Respond with strict JSON: { "headline": "...", "executive_synthesis": "..." }`;

interface ChapterSynthesisOptions {
  maxTokens: number;
  effort: ReasoningEffort;
}

interface ChapterSynthesisResult {
  headline: string;
  executive_synthesis: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
}

interface ChapterBuildTelemetry {
  chapterId: ChapterId;
  assignedClaims: number;
  outputTokens: number;
  stopReason: string | null;
  /** Which branch of chapterDefinitionForPacket resolved. See LensSource for why this is recorded. */
  lensSource: LensSource;
  /** The Claude-generated prose and the claims it was allowed to draw on, for output-level scoring. */
  prose: string;
  claimStatements: string[];
}

const GENERATION_LANGUAGE_RE = /\b(?:ECL|projection|serving view|loaded rows?|canonical entit(?:y|ies)|payload|schema|source room|provider flag|not enough verified evidence yet|coverage gap in the build|adapter|upsert|hydration step|row type|generator|manifest)\b/i;

function countGenerationLanguage(statements: string[]): number {
  return statements.filter((statement) => GENERATION_LANGUAGE_RE.test(statement)).length;
}

function collectChapterRawStatements(chapters: ChapterView[]): string[] {
  const statements = chapters.flatMap((chapter) => [
    chapter.headline,
    chapter.executive_synthesis,
    ...chapter.key_insights.map((claim) => claim.statement),
    ...chapter.tensions.map((claim) => claim.statement),
    ...chapter.what_to_watch.map((claim) => claim.statement),
  ]).filter(Boolean);
  return Array.from(new Set(statements));
}

async function synthesizeChapterNarrative(
  client: Parameters<typeof callClaude>[0],
  def: { title: string; guidingQuestion: string; writerLens: string },
  claims: GroundedClaim[],
  options: ChapterSynthesisOptions = HOME_CHAPTER_SYNTHESIS_OPTIONS,
): Promise<ChapterSynthesisResult | null> {
  if (claims.length === 0) {
    return {
      headline: `${def.title} is deferred pending stronger evidence`,
      executive_synthesis: `This chapter is not ready for executive review. The current record does not yet connect enough verified statements to answer "${def.guidingQuestion}" with confidence, so the page preserves the gap rather than turning thin evidence into a conclusion.`,
      inputTokens: 0,
      outputTokens: 0,
      stopReason: null,
    };
  }
  const userPrompt =
    `Chapter: ${def.title}\nGuiding question: ${def.guidingQuestion}\nWriter lens: ${def.writerLens}\n\n` +
    `Assigned claims (the ONLY source of content for this chapter):\n` +
    claims.map((c, i) => `${i + 1}. [${c.claim_type}] ${c.statement}`).join("\n");
  const result = await callClaude(client, CHAPTER_SYNTHESIS_SYSTEM_PROMPT, userPrompt, options.maxTokens, options.effort);
  if (!result) return null;
  const parsed = parseJsonLoose<{ headline: string; executive_synthesis: string }>(result.text, `chapter synthesis (${def.title})`);
  if (!parsed) return null;
  return {
    ...parsed,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    stopReason: result.stopReason,
  };
}

function pagePromptContract(
  signalPacket: EnterpriseSignalPacketWithPromptContracts,
  chapterId: ChapterId,
): HomePagePromptContract | null {
  return signalPacket.pagePromptContracts?.find((contract) => contract.pageKey === chapterId) ?? null;
}

/**
 * `full_contract` means the packet's page lens contract reached the prompt. `fallback` means it did
 * not and the thin CHAPTER_DEFS writerLens string was used instead -- which used to happen silently,
 * so a whole run could be written on the old lenses while every contract test stayed green (they
 * assert the contract JSON, never the resolved prompt). Recorded so the measurement run can refuse.
 */
export type LensSource = "full_contract" | "fallback";

function chapterDefinitionForPacket(
  def: { id: ChapterId; title: string; guidingQuestion: string; writerLens: string },
  signalPacket: EnterpriseSignalPacketWithPromptContracts,
): { title: string; guidingQuestion: string; writerLens: string; lensSource: LensSource } {
  const contract = pagePromptContract(signalPacket, def.id);
  const lens = contract?.lensContract;
  const writerLens = lens?.promptInstruction
    ? [
        `Hat: ${lens.hat ?? contract?.writerLens ?? def.writerLens}`,
        `Primary audience: ${lens.primaryAudience ?? "Home executive reviewer"}`,
        `Instruction: ${lens.promptInstruction}`,
        `Evidence priority: ${(lens.evidencePriority ?? contract?.requiredContext ?? []).join("; ")}`,
        `Style: ${lens.style ?? contract?.voice ?? "concise and evidence-bound"}`,
        `Must not do: ${(lens.mustNotDo ?? contract?.forbidden ?? []).join("; ")}`,
      ].join("\n")
    : [
        def.writerLens,
        contract?.voice ? `Voice: ${contract.voice}` : null,
        contract?.requiredContext?.length ? `Required context: ${contract.requiredContext.join("; ")}` : null,
        contract?.mustShow?.length ? `Must show: ${contract.mustShow.join("; ")}` : null,
        contract?.forbidden?.length ? `Forbidden: ${contract.forbidden.join("; ")}` : null,
      ].filter(Boolean).join("\n");
  return {
    title: contract?.label ?? def.title,
    guidingQuestion: contract?.decisionQuestion ?? def.guidingQuestion,
    writerLens,
    lensSource: lens?.promptInstruction ? "full_contract" : "fallback",
  };
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

export async function buildChapterViewsFromVerifiedThesis(
  signalPacket: EnterpriseSignalPacket,
  thesis: EnterpriseThesis,
  client: Parameters<typeof callClaude>[0],
  chapterIds?: ChapterId[],
  options?: {
    assemblyLimits?: HomeChapterAssemblyLimits;
    synthesis?: ChapterSynthesisOptions;
    telemetry?: ChapterBuildTelemetry[];
  },
): Promise<ChapterView[]> {
  const wanted = chapterIds?.length ? new Set(chapterIds) : null;
  const assemblyLimits = options?.assemblyLimits ?? HOME_CHAPTER_ASSEMBLY_LIMITS;
  const synthesisOptions = options?.synthesis ?? HOME_CHAPTER_SYNTHESIS_OPTIONS;
  const slices = assembleChapterSlices(thesis, signalPacket, assemblyLimits);
  const visuals = assignVisuals(thesis);
  const questions = assignQuestions(thesis, assemblyLimits);
  const gaps = assignEvidenceGaps(thesis);

  const chapters: ChapterView[] = [];
  for (const def of CHAPTER_DEFS) {
    if (wanted && !wanted.has(def.id)) continue;
    const effectiveDef = chapterDefinitionForPacket(def, signalPacket as EnterpriseSignalPacketWithPromptContracts);
    const slice = slices[def.id];
    const allClaims = [...slice.key_insights, ...slice.tensions, ...slice.what_to_watch];
    const synthesis = await synthesizeChapterNarrative(client, effectiveDef, allClaims, synthesisOptions);
    options?.telemetry?.push({
      chapterId: def.id,
      assignedClaims: allClaims.length,
      outputTokens: synthesis?.outputTokens ?? 0,
      stopReason: synthesis?.stopReason ?? null,
      lensSource: effectiveDef.lensSource,
      prose: [synthesis?.headline, synthesis?.executive_synthesis].filter(Boolean).join(" "),
      claimStatements: allClaims.map((claim) => claim.statement),
    });
    const limitations: string[] = [...gaps[def.id]];
    if (allClaims.length === 0) {
      limitations.push("No verified statements are linked to this chapter yet; review the source coverage before using it in an executive readout.");
    }
    if (def.id === "our_business" && signalPacket.contextItems.filter((c) => c.id.startsWith("ctx_segment")).length === 0) {
      limitations.push("Segment-level revenue economics are not represented in the current governed context; this chapter describes what is available, not a complete value-creation model.");
    }
    chapters.push({
      chapterId: def.id,
      title: effectiveDef.title,
      guidingQuestion: effectiveDef.guidingQuestion,
      headline: synthesis?.headline ?? `${def.title}: synthesis unavailable`,
      executive_synthesis: synthesis?.executive_synthesis ?? "Chapter synthesis call failed; assigned claims are listed below for manual review.",
      key_insights: slice.key_insights,
      tensions: slice.tensions,
      what_to_watch: slice.what_to_watch,
      questions_to_ask: questions[def.id],
      visual_opportunities: visuals[def.id],
      limitations,
    });
  }

  return chapters;
}

async function buildChaptersForTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const built = await buildTenant(tenantKey, client);
  // Deterministic, no model call, no dependency on the thesis succeeding -- computed here
  // regardless of whether generation below produces a usable thesis, so a Claude failure doesn't
  // also cost the one part of this bundle that never needed Claude in the first place.
  const technologyEstate = buildTechnologyEstateBundle(built.canonicalRecords);
  if (!built.publishedGeneration) {
    return { tenantKey, chapters: null, thesisResult: built, provenance: null, technologyEstate };
  }
  const thesis = built.publishedGeneration;
  const signalPacket = built.signalPacket;
  const provenance = buildHomeChapterProvenance(signalPacket, THESIS_PROMPT_VERSION, new Date().toISOString());
  const chapters = await buildChapterViewsFromVerifiedThesis(signalPacket, thesis, client);

  return { tenantKey, chapters, thesisResult: built, provenance, technologyEstate };
}

const MEASUREMENT_VARIANTS = [
  {
    key: "baseline",
    description: "current assembly limits and current chapter token budget",
    assemblyLimits: HOME_CHAPTER_ASSEMBLY_LIMITS,
    synthesis: HOME_CHAPTER_SYNTHESIS_OPTIONS,
  },
  {
    key: "width",
    description: "wide assembly limits with current chapter token budget",
    assemblyLimits: HOME_CHAPTER_WIDE_ASSEMBLY_LIMITS,
    synthesis: HOME_CHAPTER_SYNTHESIS_OPTIONS,
  },
  {
    key: "width_budget",
    description: "wide assembly limits with 8192 token / medium effort chapter budget",
    assemblyLimits: HOME_CHAPTER_WIDE_ASSEMBLY_LIMITS,
    synthesis: HOME_CHAPTER_WIDE_BUDGET_SYNTHESIS_OPTIONS,
  },
] as const;

function summarizeVerificationLedger(ledger: Array<{ action: string; verdict: string }>) {
  return {
    generated: ledger.length,
    semanticDrops: ledger.filter((entry) => entry.action.startsWith("dropped")).length,
    repairs: ledger.filter((entry) => entry.action === "repaired").length,
    keptClean: ledger.filter((entry) => entry.action === "kept").length,
    overstated: ledger.filter((entry) => entry.verdict === "OVERSTATED").length,
    unsupported: ledger.filter((entry) => entry.verdict === "UNSUPPORTED").length,
  };
}

function summarizeSourceSummaryKinds(sourceSummaries: EnterpriseSignalPacket["sourceSummaries"]) {
  const counts: Record<string, number> = {};
  for (const summary of sourceSummaries) {
    const key = summary.sourceKind ?? "unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}


/* ------------------------------------------------------------------------------------------------
 * Output-level lens quality -- see scripts/data-build/home-lens-quality.ts for why these score
 * generated prose rather than the contract JSON.
 * ---------------------------------------------------------------------------------------------- */

const MUST_NOT_DO_CHECKED_RULES = [
  "quote a number that is not in the packet",
  "count deployments as applications",
  "start with a technology inventory",
] as const;

/**
 * The application/deployment split is the oracle for the CTO lens's "count deployments as
 * applications" rule -- the same double-count that has shipped before. Derived from the canonical
 * records rather than the estate bundle because the bundle does not carry deployments as their own
 * object type; a tenant with no deployment records reports 0 and the check degrades to "any stated
 * application count must equal the canonical one", which is still the half that matters.
 */
function estateCountsFromRecords(records: Array<{ objectType: string }>): { applications: number; deployments: number } {
  return {
    applications: records.filter((record) => record.objectType === "application_system").length,
    deployments: records.filter((record) => record.objectType.includes("deployment")).length,
  };
}

/** Tenant proper nouns are excluded from lens scoring -- every chapter repeats them, so they carry
 * no signal about which hat wrote the prose. */
function tenantNounsFor(tenantKey: string): string[] {
  return tenantKey.split(/[-_]/).filter((part) => part.length > 2);
}

function collectMustNotDoViolations(
  chapters: ScorableChapter[],
  counts: { applications: number; deployments: number },
): MustNotDoViolation[] {
  const violations: MustNotDoViolation[] = [];
  for (const chapter of chapters) {
    violations.push(...findInventedNumbers(chapter));
    if (chapter.chapterId === "technology_data") {
      violations.push(...findApplicationCountErrors(chapter, counts));
    }
    if (chapter.chapterId === "executive_brief") {
      violations.push(...findInventoryOpening(chapter));
    }
  }
  return violations;
}

async function measureChapterQualityForTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const built = await buildTenant(tenantKey, client);
  const generatedAt = new Date().toISOString();
  const tenantNouns = tenantNounsFor(tenantKey);
  const estateCounts = estateCountsFromRecords(built.canonicalRecords);
  const report = {
    tenantKey,
    generatedAt,
    defaultsChanged: false,
    packet: {
      signals: built.signalPacket.signals.length,
      contextItems: built.signalPacket.contextItems.length,
      sourceSummaries: built.signalPacket.sourceSummaries.length,
      sourceSummaryKinds: summarizeSourceSummaryKinds(built.signalPacket.sourceSummaries),
      rawIntakeFiles: built.signalPacket.sourceSummaries.filter((summary) => summary.rawRowCount !== undefined).length,
      visualDatasets: Object.keys(built.signalPacket.visualDatasets ?? {}).length,
    },
    estateCounts,
    verification: summarizeVerificationLedger(built.verificationLedger),
    variants: [] as Array<{
      key: string;
      description: string;
      assemblyLimits: HomeChapterAssemblyLimits;
      synthesis: ChapterSynthesisOptions;
      chapters: number;
      claimsPerChapter: Record<string, number>;
      totalOutputTokens: number;
      maxTokenStops: number;
      rawStatementCount: number;
      generationLanguageCount: number;
      lensSources: Record<string, string>;
      lensFallbacks: string[];
      divergence: ReturnType<typeof scoreLensDivergence>;
      mustNotDo: {
        checkedRules: string[];
        uncheckedJudgmentRules: string[];
        violations: MustNotDoViolation[];
      };
    }>,
  };

  if (!built.publishedGeneration) {
    throw new Error(`no published thesis available for ${tenantKey}; cannot measure chapter quality`);
  }

  for (const variant of MEASUREMENT_VARIANTS) {
    const telemetry: ChapterBuildTelemetry[] = [];
    const chapters = await buildChapterViewsFromVerifiedThesis(
      built.signalPacket,
      built.publishedGeneration,
      client,
      undefined,
      {
        assemblyLimits: variant.assemblyLimits,
        synthesis: variant.synthesis,
        telemetry,
      },
    );
    const claimsPerChapter = Object.fromEntries(
      chapters.map((chapter) => [
        chapter.chapterId,
        chapter.key_insights.length + chapter.tensions.length + chapter.what_to_watch.length,
      ]),
    );
    const rawStatements = collectChapterRawStatements(chapters);
    const scorable: ScorableChapter[] = telemetry.map((item) => ({
      chapterId: item.chapterId,
      prose: item.prose,
      claimStatements: item.claimStatements,
      expectedClass: CHAPTER_EXPECTED_LENS_CLASS[item.chapterId],
    }));
    report.variants.push({
      key: variant.key,
      description: variant.description,
      assemblyLimits: variant.assemblyLimits,
      synthesis: variant.synthesis,
      chapters: chapters.length,
      claimsPerChapter,
      totalOutputTokens: telemetry.reduce((sum, item) => sum + item.outputTokens, 0),
      maxTokenStops: telemetry.filter((item) => item.stopReason === "max_tokens").length,
      rawStatementCount: rawStatements.length,
      generationLanguageCount: countGenerationLanguage(rawStatements),
      lensSources: Object.fromEntries(telemetry.map((item) => [item.chapterId, item.lensSource])),
      lensFallbacks: telemetry.filter((item) => item.lensSource === "fallback").map((item) => item.chapterId),
      divergence: scoreLensDivergence(scorable, tenantNouns),
      mustNotDo: {
        checkedRules: [...MUST_NOT_DO_CHECKED_RULES],
        uncheckedJudgmentRules: [...JUDGMENT_CLASS_RULES_UNCHECKED],
        violations: collectMustNotDoViolations(scorable, estateCounts),
      },
    });
  }

  const fallbacks = report.variants.flatMap((variant) =>
    variant.lensFallbacks.map((chapterId) => `${variant.key}:${chapterId}`),
  );
  if (fallbacks.length > 0) {
    // Divergence scored while the writer silently used the thin CHAPTER_DEFS lens is a measurement
    // of the wrong prompt, so this refuses rather than reporting a number that cannot be acted on.
    throw new Error(
      `lens contract did not reach the prompt for ${fallbacks.length} chapter build(s): ${fallbacks.join(", ")}. ` +
        `Check that the signal packet carries pagePromptContracts with a lensContract.promptInstruction for every chapter.`,
    );
  }

  return report;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  let client: Parameters<typeof callClaude>[0] = null;
  if (hasKey) {
    const { getAnthropicDirectClient } = await import("../../src/lib/integrations/ai-egress/anthropic-direct");
    client = getAnthropicDirectClient({ workload: "home_chapters" }) as never;
  } else {
    console.log("! ANTHROPIC_API_KEY absent -- cannot build chapters without a thesis to build them from\n");
    return;
  }

  for (const tenantKey of TENANTS) {
    console.log(`\n=== ${tenantKey} ===`);
    // One tenant's uncaught error (a transient API failure, an SDK-level guard, anything not
    // already handled inside buildChaptersForTenant) must not cost a sibling tenant its own
    // already-completed output -- a live run hit exactly this: an SDK error on the first tenant
    // crashed the whole process before the second tenant was even attempted, and before the first
    // tenant's partial signal-packet work could be written anywhere.
    try {
      if (MEASURE_QUALITY) {
        const measurement = await measureChapterQualityForTenant(tenantKey, client);
        const outFile = path.join(OUT_DIR, `${tenantKey}-home-chapter-quality-measurement.json`);
        fs.writeFileSync(outFile, JSON.stringify(measurement, null, 2));
        console.log("  variant        chapters  output_tokens  max_token_stops  raw_statements  generation_language");
        for (const variant of measurement.variants) {
          console.log(
            `  ${variant.key.padEnd(13)} ${String(variant.chapters).padStart(8)}  ` +
              `${String(variant.totalOutputTokens).padStart(13)}  ${String(variant.maxTokenStops).padStart(15)}  ` +
              `${String(variant.rawStatementCount).padStart(14)}  ${String(variant.generationLanguageCount).padStart(19)}`,
          );
        }
        console.log("");
        console.log("  variant        mean_sep  weakest_lens                     sep  most_similar_pair                 cos  must_not_do");
        for (const variant of measurement.variants) {
          const weakest = variant.divergence.weakestLens;
          const pair = variant.divergence.mostSimilarPair;
          console.log(
            `  ${variant.key.padEnd(13)} ${String(variant.divergence.meanSeparation).padStart(8)}  ` +
              `${(weakest?.chapterId ?? "-").padEnd(30)} ${String(weakest?.separation ?? "-").padStart(5)}  ` +
              `${(pair ? `${pair.a}/${pair.b}` : "-").padEnd(32)} ${String(pair?.cosine ?? "-").padStart(4)}  ` +
              `${String(variant.mustNotDo.violations.length).padStart(11)}`,
          );
        }
        console.log(`  lens sources: ${measurement.variants.every((v) => v.lensFallbacks.length === 0) ? "full_contract for every chapter" : "FALLBACK PRESENT"}`);
        console.log(`  must_not_do judgment-class rules NOT checked: ${JUDGMENT_CLASS_RULES_UNCHECKED.length}`);
        console.log(`  estate: applications=${measurement.estateCounts.applications} deployments=${measurement.estateCounts.deployments}`);
        console.log(`  verifier: generated=${measurement.verification.generated} drops=${measurement.verification.semanticDrops} repairs=${measurement.verification.repairs} kept=${measurement.verification.keptClean}`);
        console.log(`  packet: signals=${measurement.packet.signals} context=${measurement.packet.contextItems} source_summaries=${measurement.packet.sourceSummaries}`);
        console.log(`  -> ${outFile}`);
        console.log(`__HOME_CHAPTER_QUALITY_MEASUREMENT_BEGIN__${JSON.stringify(measurement)}__HOME_CHAPTER_QUALITY_MEASUREMENT_END__`);
        continue;
      }
      const result = await buildChaptersForTenant(tenantKey, client);
      if (!result.chapters) {
        console.log("  ! no published thesis available -- see thesisResult for the underlying failure");
        continue;
      }
      for (const ch of result.chapters) {
        console.log(`  [${ch.chapterId}] ${ch.headline}`);
        console.log(`    insights=${ch.key_insights.length} tensions=${ch.tensions.length} watch=${ch.what_to_watch.length} visuals=${ch.visual_opportunities.length}`);
      }

      const outFile = path.join(OUT_DIR, `${tenantKey}-home-chapters.json`);
      fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
      console.log(`  -> ${outFile}`);

      // Same reason as build-enterprise-thesis.ts: the out-dir is inside the job's ephemeral
      // container and lost on exit; stdout survives in the captured job log.
      console.log(`__HOME_CHAPTERS_RESULT_BEGIN__${JSON.stringify(result)}__HOME_CHAPTERS_RESULT_END__`);
    } catch (error) {
      console.log(`  ! ${tenantKey} failed with an uncaught error -- continuing to the next tenant:`);
      console.log(`   `, error instanceof Error ? error.stack ?? error.message : error);
    }
  }

  console.log("\nPlan-only build complete. No database write exists in this script -- :apply, /home,");
  console.log("and the legacy reader are untouched.");
}

if (process.argv[1] && process.argv[1].includes("build-home-chapters")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
