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
  THESIS_PROMPT_VERSION,
  type EnterpriseThesis,
  type GroundedClaim,
  type VisualOpportunity,
} from "./build-enterprise-thesis";
import type { Signal, ContextItem, buildEnterpriseSignalPacket } from "./enterprise-signal-packet";
import { buildTechnologyEstateBundle } from "./technology-estate";

type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;

/* ------------------------------------------------------------------------------------------------
 * Provenance -- the generated institutional narrative needs lineage the same way any other
 * governed artifact does. Bump home_synthesis_contract_version when ChapterView's shape changes
 * in a way a consumer needs to know about; bump the prompt versions when SYSTEM_PROMPT or
 * CHAPTER_SYNTHESIS_SYSTEM_PROMPT change meaningfully; bump verification_version when the
 * verification/repair architecture itself changes (e.g. this session's targeted-repair-v2, which
 * extended entailment verification to performance_story and questions_for_management).
 * ---------------------------------------------------------------------------------------------- */

const HOME_SYNTHESIS_CONTRACT_VERSION = "home-chapters-v1";
const CHAPTER_PROMPT_VERSION = "home-chapters/v1";
const VERIFICATION_VERSION = "targeted-repair-v2";

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

function buildProvenance(signalPacket: EnterpriseSignalPacket, thesisPromptVersion: string, generatedAt: string): HomeReviewBundleProvenance {
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

const CHAPTER_DEFS: Array<{ id: ChapterId; title: string; guidingQuestion: string }> = [
  { id: "executive_brief", title: "Executive Brief", guidingQuestion: "What should I understand in my first ten minutes?" },
  { id: "our_business", title: "Our Business", guidingQuestion: "How does this enterprise work and create value?" },
  { id: "strategy_value_creation", title: "Strategy & Value Creation", guidingQuestion: "Where are we trying to go, and what bets are we making?" },
  { id: "how_we_operate", title: "How We Operate", guidingQuestion: "How is the enterprise organized and how does work get done?" },
  { id: "technology_data", title: "Technology & Data", guidingQuestion: "What enables the business, and where is complexity or dependency concentrated?" },
  { id: "performance_value", title: "Performance & Value", guidingQuestion: "Are we moving toward outcomes, and can we prove the value?" },
  { id: "leadership_perspective", title: "Leadership Perspective", guidingQuestion: "What do leaders agree on, disagree on, and worry about?" },
  { id: "what_needs_attention", title: "What Needs Attention", guidingQuestion: "What tensions, risks, dependencies and decisions deserve executive attention?" },
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
export function assignQuestions(thesis: EnterpriseThesis): Record<ChapterId, string[]> {
  const questions = alive(thesis.questions_for_management);
  const byChapter: Record<ChapterId, string[]> = {
    executive_brief: questions.slice(0, 5).map((q) => q.statement),
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
      key_insights: alive(thesis.things_a_new_cxo_should_know).slice(0, 5),
      tensions: alive(thesis.what_needs_attention).slice(0, 3),
      what_to_watch: alive(thesis.material_risks).slice(0, 2),
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

Respond with strict JSON: { "headline": "...", "executive_synthesis": "..." }`;

async function synthesizeChapterNarrative(
  client: Parameters<typeof callClaude>[0],
  def: { title: string; guidingQuestion: string },
  claims: GroundedClaim[],
): Promise<{ headline: string; executive_synthesis: string } | null> {
  if (claims.length === 0) {
    return {
      headline: `${def.title}: not enough verified evidence yet`,
      executive_synthesis: `The current context does not yet establish enough verified, cross-domain material to answer "${def.guidingQuestion}" for this chapter. This is a coverage gap, not a finding -- do not infer content here.`,
    };
  }
  const userPrompt =
    `Chapter: ${def.title}\nGuiding question: ${def.guidingQuestion}\n\n` +
    `Assigned claims (the ONLY source of content for this chapter):\n` +
    claims.map((c, i) => `${i + 1}. [${c.claim_type}] ${c.statement}`).join("\n");
  const result = await callClaude(client, CHAPTER_SYNTHESIS_SYSTEM_PROMPT, userPrompt, 3072, "low");
  if (!result) return null;
  return parseJsonLoose<{ headline: string; executive_synthesis: string }>(result.text, `chapter synthesis (${def.title})`);
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

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
  const provenance = buildProvenance(signalPacket, THESIS_PROMPT_VERSION, new Date().toISOString());

  const slices = assembleChapterSlices(thesis, signalPacket);
  const visuals = assignVisuals(thesis);
  const questions = assignQuestions(thesis);
  const gaps = assignEvidenceGaps(thesis);

  const chapters: ChapterView[] = [];
  for (const def of CHAPTER_DEFS) {
    const slice = slices[def.id];
    const allClaims = [...slice.key_insights, ...slice.tensions, ...slice.what_to_watch];
    const synthesis = await synthesizeChapterNarrative(client, def, allClaims);
    const limitations: string[] = [...gaps[def.id]];
    if (allClaims.length === 0) {
      limitations.push("No verified claims were routed to this chapter from the current thesis -- treat as a coverage gap.");
    }
    if (def.id === "our_business" && signalPacket.contextItems.filter((c) => c.id.startsWith("ctx_segment")).length === 0) {
      limitations.push("Segment-level revenue economics are not represented in the current governed context (01b_business_segments is not read by the canonical build); this chapter describes what is available, not a complete value-creation model.");
    }
    chapters.push({
      chapterId: def.id,
      title: def.title,
      guidingQuestion: def.guidingQuestion,
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

  return { tenantKey, chapters, thesisResult: built, provenance, technologyEstate };
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
