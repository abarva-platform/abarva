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

import fs from "node:fs";
import path from "node:path";

import {
  buildTenant,
  callClaude,
  type EnterpriseThesis,
  type GroundedClaim,
  type VisualOpportunity,
} from "./build-enterprise-thesis";
import type { Signal, ContextItem } from "./enterprise-signal-packet";

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

const CHAPTER_QUESTION_KEYWORDS: Partial<Record<ChapterId, string[]>> = {
  our_business: ["business", "segment", "revenue", "customer", "channel"],
  strategy_value_creation: ["priority", "program", "bet", "strategic", "portfolio", "return"],
  how_we_operate: ["operate", "process", "workforce", "organization", "staff"],
  technology_data: ["vendor", "contract", "technology", "data", "metric", "notation", "baseline", "platform"],
  performance_value: ["metric", "kpi", "value", "outcome", "target"],
  leadership_perspective: ["leader", "leadership", "sentiment", "contradict"],
};

export function assignQuestions(thesis: EnterpriseThesis): Record<ChapterId, string[]> {
  const byChapter: Record<ChapterId, string[]> = {
    executive_brief: thesis.questions_for_management.slice(0, 5),
    our_business: [], strategy_value_creation: [], how_we_operate: [],
    technology_data: [], performance_value: [], leadership_perspective: [], what_needs_attention: [],
  };
  const claimed = new Set<string>();
  for (const [chapterId, keywords] of Object.entries(CHAPTER_QUESTION_KEYWORDS) as Array<[ChapterId, string[]]>) {
    for (const q of thesis.questions_for_management) {
      if (claimed.has(q)) continue;
      if (keywords.some((k) => q.toLowerCase().includes(k))) {
        byChapter[chapterId].push(q);
        claimed.add(q);
      }
    }
  }
  const leftover = thesis.questions_for_management.filter((q) => !claimed.has(q));
  byChapter.what_needs_attention.push(...leftover);
  return byChapter;
}

/** Assembles all eight chapters' claim/visual/question slices deterministically -- no model call.
 * This is the "one thesis, eight views" router: every claim keeps citing the same evidence it
 * already cited in the thesis, just organized by which chapter it belongs in. */
export function assembleChapterSlices(
  thesis: EnterpriseThesis,
  signalPacket: ReturnType<typeof import("./enterprise-signal-packet").buildEnterpriseSignalPacket>,
): Record<ChapterId, { key_insights: GroundedClaim[]; tensions: GroundedClaim[]; what_to_watch: GroundedClaim[] }> {
  const alive = (arr: (GroundedClaim | null)[]) => arr.filter((c): c is GroundedClaim => c !== null);
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
  try {
    return JSON.parse(result.text) as { headline: string; executive_synthesis: string };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

async function buildChaptersForTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const built = await buildTenant(tenantKey, client);
  if (!built.publishedGeneration) {
    return { tenantKey, chapters: null, thesisResult: built };
  }
  const thesis = built.publishedGeneration;
  const signalPacket = built.signalPacket;

  const slices = assembleChapterSlices(thesis, signalPacket);
  const visuals = assignVisuals(thesis);
  const questions = assignQuestions(thesis);

  const chapters: ChapterView[] = [];
  for (const def of CHAPTER_DEFS) {
    const slice = slices[def.id];
    const allClaims = [...slice.key_insights, ...slice.tensions, ...slice.what_to_watch];
    const synthesis = await synthesizeChapterNarrative(client, def, allClaims);
    const limitations: string[] = [];
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

  return { tenantKey, chapters, thesisResult: built };
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
