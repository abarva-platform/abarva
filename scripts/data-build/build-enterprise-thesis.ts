#!/usr/bin/env npx tsx
/**
 * The EnterpriseThesis: one whole-enterprise reasoning pass, built once and inherited by every
 * Home chapter that reads it downstream.
 *
 * This sits after the deterministic layers (decision context → quality manifest → signal packet)
 * and before any chapter is written. Its entire reason to exist is the finding from the first
 * design pass at this problem: a model asked to reason over 4,026 undifferentiated records has no
 * way to know which sixty of them matter, and a model asked to write eight independent chapters
 * without a shared spine produces eight disconnected mini-essays that happen to describe the same
 * company. This call sees the whole signal packet once, is asked to find the smallest set of ideas
 * that explain the enterprise, and that structured output becomes the one thing every chapter
 * writer downstream is required to stay consistent with.
 *
 * What makes this call different from every other generation call built this session — the
 * six-block orientation pack, the per-dimension insights — is that those were asked to *describe*
 * a narrow slice and validated by literal substring matching. This call is asked to *synthesize*
 * across the whole packet, and substring matching cannot validate a synthesized claim: "the number
 * 407 appears somewhere in the packet" proves nothing about whether the sentence connecting it to
 * three other numbers is actually true. That is why this file also carries a second, adversarial
 * verification call — not deferred to a later iteration, because this is the surface that makes
 * the strongest connected claims Home will show, and it is the one place a plausible-sounding but
 * unsupported synthesis would do the most damage if it shipped unverified.
 *
 * Usage:
 *   npx tsx scripts/data-build/build-enterprise-thesis.ts [--tenant <key>] [--out-dir <dir>]
 *
 * Dry-run by default. Writes only with THESIS_WRITE=true and THESIS_WRITE_APPROVED=true.
 * Requires ANTHROPIC_API_KEY to generate; without it, the deterministic layers still build and
 * are written to the output directory, with no thesis attempted.
 */

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { Client } from "pg";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";
import {
  buildDecisionContext,
  buildContextQualityManifest,
  buildEnterpriseSignalPacket,
  type Signal,
  type ContextItem,
} from "./enterprise-signal-packet";

const TENANTS = (() => {
  const i = process.argv.indexOf("--tenant");
  return i > -1 ? [process.argv[i + 1]] : ["meridian-health", "skyharbor-air"];
})();
const OUT_DIR = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/enterprise-thesis";
})();
const WRITE = process.env.THESIS_WRITE === "true" && process.env.THESIS_WRITE_APPROVED === "true";
const CLAUDE_MODEL = "claude-sonnet-5";
const ARTIFACT_TYPE = "NexusEnterpriseThesisV1";

/**
 * Contracts with document-level extraction, per tenant. Not derivable from canonical -- that
 * evidence lives in a separate root that never merges into the canonical vendor_contract object.
 * Named explicitly here, the same way the golden-evidence loaders name their own contract scope.
 */
const GOLDEN_EVIDENCE_CONTRACTS: Record<string, string[]> = {
  "skyharbor-air": ["Vantage", "Northgate"],
  "meridian-health": [],
};

/* ------------------------------------------------------------------------------------------------
 * Thesis shape
 * ---------------------------------------------------------------------------------------------- */

/**
 * What kind of claim this is, not just what it says -- the two-domain bar for "a real connection"
 * only makes sense for a claim that's actually claiming a connection. A FACT restating one signal
 * ("the program is 12% complete") was never trying to connect two domains and shouldn't be
 * penalized for not doing so; a CROSS_DOMAIN_INSIGHT or ADVISORY_INFERENCE is exactly the shape
 * that bar exists to police. Untyped, every claim got the same bar regardless of what it was
 * attempting, which is why a live run flagged 34-36 single-domain program-status facts per tenant
 * as "issues" -- they were never wrong, the check just didn't know what it was looking at.
 */
export type ClaimType = "FACT" | "OBSERVATION" | "CROSS_DOMAIN_INSIGHT" | "ADVISORY_INFERENCE";

/** Every substantive claim in the thesis takes this shape. Nothing floats free of its evidence. */
export interface GroundedClaim {
  statement: string;
  evidence_ids: string[];
  confidence: "low" | "medium" | "high";
  claim_type: ClaimType;
}

/** The fixed grammar of visualizable shapes. Claude selects a type and a dataset_ref from what
 * the deterministic compiler actually computed (`signalPacket.visualDatasets`); it never supplies
 * or adjusts a plotted value, and it may not invent a renderer outside this list. Recharts owns
 * the quantitative half (bar..heatmap); governed SVG components own the relational/structural half
 * (capability_map..timeline) -- the split locked in this session's Home visual-architecture design. */
export type VisualType =
  | "bar" | "stacked_bar" | "horizontal_bar" | "line" | "slope" | "scatter" | "bubble"
  | "treemap" | "donut" | "bullet" | "heatmap"
  | "capability_map" | "dependency_graph" | "organization_map" | "strategy_tree"
  | "risk_chain" | "value_chain" | "timeline";

export const VISUAL_TYPES: readonly VisualType[] = [
  "bar", "stacked_bar", "horizontal_bar", "line", "slope", "scatter", "bubble",
  "treemap", "donut", "bullet", "heatmap",
  "capability_map", "dependency_graph", "organization_map", "strategy_tree",
  "risk_chain", "value_chain", "timeline",
];

export interface VisualOpportunity {
  visual_type: VisualType;
  /** Answer-first, consulting-style -- "A small number of vendors carry a disproportionate share
   * of technology dependency," never "Vendor Spend." */
  title: string;
  purpose: string;
  /** Must be an exact key in signalPacket.visualDatasets. Nothing else is plottable. */
  dataset_ref: string;
  key_message: string;
  evidence_ids: string[];
  priority: "high" | "medium" | "low";
}

export interface EnterpriseThesis {
  enterprise_story: string;
  /** The material claims enterprise_story's prose is built from, decomposed and individually
   * cited/verified -- the top-of-thesis narrative is the highest-visibility surface in the whole
   * object and was, until this field existed, the one place a claim could ship without ever
   * passing through the verification ledger. */
  enterprise_story_claims: GroundedClaim[];
  value_creation_model: {
    summary: string;
    primary_value_drivers: GroundedClaim[];
    economic_dependencies: GroundedClaim[];
  };
  strategic_bets: GroundedClaim[];
  structural_constraints: GroundedClaim[];
  operating_tensions: GroundedClaim[];
  leadership_consensus: GroundedClaim[];
  leadership_disagreements: GroundedClaim[];
  performance_story: {
    where_improving: GroundedClaim[];
    where_off_track: GroundedClaim[];
    where_unknown: GroundedClaim[];
  };
  technology_and_data_implications: GroundedClaim[];
  material_risks: GroundedClaim[];
  value_realization_tensions: GroundedClaim[];
  /** A named executive surface in its own right (mirrors the "What Needs Attention" Home
   * chapter), not just an alias for material_risks -- risks are what could go wrong; this is
   * whatever most needs a decision or a look, which may be a risk, a gap, a stalled program, or
   * a tension, and is worth a reader being able to find in one place rather than assembling it
   * themselves from five other arrays. */
  what_needs_attention: GroundedClaim[];
  evidence_gaps: string[];
  things_a_new_cxo_should_know: GroundedClaim[];
  questions_for_management: string[];
  /** Optional by nature -- a visualization is proposed only where it strengthens the story, not
   * for every section. See VisualOpportunity for the grammar and dataset_ref constraint. */
  visual_opportunities: VisualOpportunity[];
}

/* ------------------------------------------------------------------------------------------------
 * The prompt
 * ---------------------------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You are not writing Home-page copy yet. You are constructing the internal enterprise
thesis that every Abarva Home narrative will inherit.

Act as the senior strategy partner responsible for briefing a newly appointed CEO or CXO before
their first executive-team meetings.

You have been given a governed enterprise context packet containing deterministic facts, valid
canonical relationships, leadership perspectives, precomputed material signals, evidence quality,
and coverage limitations. Every signal in the packet carries an id (sig_XXX) and the names of the
records that produced it.

Your objective is to determine the smallest set of ideas that best explain how this enterprise
works, where value is created, what management is trying to change, what is helping or constraining
that change, where leadership perceptions and system evidence diverge, and what deserves executive
attention.

Do not summarize datasets or dimensions individually. Build a single coherent theory of the
enterprise.

A strong thesis connects multiple domains. Seek connections such as:
strategy <-> economics <-> portfolio
operating model <-> performance <-> technology
technology <-> spend <-> vendor dependency
data <-> operational capability <-> transformation
leadership perspective <-> system evidence
risk <-> capability <-> system <-> owner
investment <-> expected value <-> measured outcome

EVIDENCE DISCIPLINE
- The signals and facts in the packet are authoritative. Never recompute a number that appears
  there; quote it exactly.
- Every claim you make must carry evidence_ids citing the specific signals or context items it
  draws on. A claim with no evidence_ids will be discarded before a person ever sees it.
- The packet carries two kinds of citeable evidence: signals (sig_*), which are computed
  observations, and context items (ctx_*), which are plain governed facts -- enterprise identity,
  business economics, declared customer segments, declared strategic priorities. A claim resting
  on revenue, industry, a declared priority, or a customer segment must cite the matching ctx_* id.
  Never write a bare parenthetical like "(enterpriseIdentity)" -- that names an object, not a
  citation, and cannot be checked. Cite the real id.
- Leadership perspectives are perspectives, not enterprise facts. Say so.
- Never translate an enterprise-wide leadership theme into program-specific sentiment unless a
  signal in the packet explicitly resolves that specific link. The packet tells you the resolution
  rate for that link; if it is low, say the theme is enterprise-wide and stop there.
- Coverage limitations are part of the analysis, not a footnote. Sparse evidence must reduce your
  stated confidence, not be omitted.
- Data-quality defects (missing baselines, inconsistent notation, unlinked evidence) are not
  performance results. Never characterize a measurement gap as good or bad performance.
- Do not use an industry benchmark for an industry other than the one stated in the packet.
- Never state that two facts are causally related merely because they coexist in the packet.
- A "candidate relationship" in the packet, if present, is explicitly not client-attested and must
  never be presented as a fact.

ANALYTICAL STANDARD
Prioritize materiality over completeness. Do not mention something merely because a signal exists
for it — the packet has already filtered for materiality; your job is synthesis across what
survived that filter, not further summary of it.

Look specifically for: concentration, fragmentation, dependencies, duplication, strategic tension,
investment/outcome gaps, transformation load, structural complexity, leadership consensus,
leadership disagreement, execution risk, evidence gaps, and emerging opportunity.

Each major thesis statement should connect at least two domains from the list above; the strongest
connect three or more. Write like an adviser who has studied this enterprise closely — not like a
reporting engine describing a database.

INFERENCE, NOT JUST RESTATEMENT
You are not limited to sentences a signal already states verbatim. A reasonable synthesis across
two or more signals is exactly what you are for -- "this estate's rationalization candidates could
fund part of the modernization portfolio" is a legitimate inference if the packet shows both a
rationalization figure and a funded modernization program, even though no single signal says it.
The discipline is not "never infer" -- it is "never claim more certainty, scope, ranking, or
causality than the cited evidence actually supports." A claim can be a genuine, useful, un-hedged
observation, or it can be a careful inference phrased with appropriate uncertainty ("could",
"may", "is consistent with") -- both are welcome. What is not welcome is either one dressed up as
more certain than it is: a topic every leader raised is not the same as leaders agreeing on a
solution; two named risks are not "the most severe" without a comparison across every risk; a
program at 7% complete is not "the most consequential in the portfolio" without a portfolio-wide
ranking behind it. Say what the evidence supports, including a well-reasoned inference -- just say
it at the certainty the evidence actually earns.

CLAIM TYPE -- TAG WHAT KIND OF CLAIM THIS IS
Every GroundedClaim carries a claim_type, and the two-domain bar below only applies to two of the
four:
- FACT: a direct restatement of one signal or context item, in your own words. Single-domain is
  fine -- a fact was never claiming a connection.
- OBSERVATION: a pattern noticed within one domain (e.g. "three of the five largest risks concern
  the same system"). Still single-domain is fine.
- CROSS_DOMAIN_INSIGHT: a claim connecting two or more domains from the list above. This is where
  the two-domain evidence bar applies.
- ADVISORY_INFERENCE: a recommendation or implication for management, synthesized rather than
  stated verbatim anywhere. This is also where the two-domain bar applies.
Do not inflate a FACT into a CROSS_DOMAIN_INSIGHT to sound more significant, and do not undersell
a genuine connection as a FACT to dodge the evidence bar -- tag it honestly.

VISUALS -- PROPOSE ONLY WHERE THEY STRENGTHEN THE STORY
You may propose visual_opportunities: each one selects a visual_type from a fixed list and a
dataset_ref that must be an exact key in the packet's visualDatasets object -- nothing else is
plottable, and you never supply or adjust a plotted value yourself. A visualization is not
required for every section; recommend one only when spatial, relational, comparative, trend,
concentration, composition, or dependency information is materially easier to understand visually
than in prose. Do not propose a chart for every array — most sections need none.

Allowed visual_type values:
- Quantitative (Recharts): bar, stacked_bar, horizontal_bar, line, slope, scatter, bubble,
  treemap, donut, bullet, heatmap.
- Relational/structural (governed SVG): capability_map, dependency_graph, organization_map,
  strategy_tree, risk_chain, value_chain, timeline.

Every visual's title must be answer-first, consulting-exhibit style, not a BI chart label: not
"Vendor Spend" but "A small number of vendors carry a disproportionate share of technology
dependency." The title must be something the dataset actually supports -- do not title a chart
with a claim stronger than what dataset_ref's rows show.

Do not propose a dependency_graph, strategy_tree, or any relational visual that would draw a
priority-to-program, priority-to-spend, or priority-to-KPI line -- no canonical linkage supports
that connection (see the packet's prohibitedComparisons), and drawing it visually would present a
candidate relationship as fact more persuasively than stating it in prose would.

LENGTH -- THIS IS A SPINE, NOT A REPORT
Keep every section within these bounds. The eight chapter writers built on top of this thesis
later provide the depth; this object stays sharp enough that a reader can hold the whole thing in
mind at once.
- enterprise_story: 250-400 words. enterprise_story_claims: 3-5 items -- the material assertions
  the story prose is built from, each individually cited and claim_type-tagged. Every material
  claim in the prose should be represented here; this is the auditable backbone under the words.
- value_creation_model.primary_value_drivers: 2-4 GroundedClaim items.
  value_creation_model.economic_dependencies: 2-4 GroundedClaim items.
- strategic_bets, structural_constraints, operating_tensions, material_risks,
  value_realization_tensions, what_needs_attention, technology_and_data_implications: 3-5 items
  each.
- leadership_consensus: 3-5 items. leadership_disagreements: 2-3 items.
- performance_story: 2-3 items in each of where_improving / where_off_track / where_unknown.
- things_a_new_cxo_should_know: 5-7 items. questions_for_management: 5-7 items.
- visual_opportunities: 0-6 items across the whole thesis -- propose fewer if fewer genuinely earn
  a visual.
Do not pad a section to reach a minimum, and do not exceed the maximum to fit in one more
observation -- pick the strongest ones.

Output strict JSON matching the schema you are given. No prose outside the JSON.`;

function buildUserPrompt(signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): string {
  const claimShape = "{ statement, evidence_ids: [sig_xxx or ctx_xxx], confidence: low|medium|high, claim_type: FACT|OBSERVATION|CROSS_DOMAIN_INSIGHT|ADVISORY_INFERENCE }";
  const datasetNames = Object.keys(signalPacket.visualDatasets);
  return (
    `Build the EnterpriseThesis for this enterprise from the governed context packet below. ` +
    `Every claim needs evidence_ids from the signals or context items list, and a claim_type. ` +
    `Return JSON matching this shape exactly:\n\n` +
    JSON.stringify(
      {
        enterprise_story: "string, 250-400 words",
        enterprise_story_claims: [`3-5 GroundedClaim: ${claimShape} -- the material assertions the story is built from`],
        value_creation_model: {
          summary: "string",
          primary_value_drivers: [`2-4 GroundedClaim: ${claimShape}`],
          economic_dependencies: [`2-4 GroundedClaim: ${claimShape}`],
        },
        strategic_bets: [`3-5 GroundedClaim: ${claimShape}`],
        structural_constraints: ["3-5 GroundedClaim"],
        operating_tensions: ["3-5 GroundedClaim"],
        leadership_consensus: ["3-5 GroundedClaim"],
        leadership_disagreements: ["2-3 GroundedClaim"],
        performance_story: {
          where_improving: ["2-3 GroundedClaim"],
          where_off_track: ["2-3 GroundedClaim"],
          where_unknown: ["2-3 GroundedClaim"],
        },
        technology_and_data_implications: ["3-5 GroundedClaim"],
        material_risks: ["3-5 GroundedClaim"],
        value_realization_tensions: ["3-5 GroundedClaim"],
        what_needs_attention: ["3-5 GroundedClaim -- whatever most needs a decision or a look, drawn from any domain, not limited to risk"],
        evidence_gaps: ["string, as many as genuinely material"],
        things_a_new_cxo_should_know: ["5-7 GroundedClaim"],
        questions_for_management: ["string, 5-7 items"],
        visual_opportunities: [
          "0-6 VisualOpportunity: { visual_type: <from the allowed list>, title (answer-first), purpose, " +
            `dataset_ref (must be exactly one of: ${datasetNames.join(", ") || "(none available)"}), ` +
            "key_message, evidence_ids, priority: high|medium|low }",
        ],
      },
      null,
      2,
    ) +
    `\n\nGoverned context packet (signals are sig_*, context facts are ctx_*, plottable datasets ` +
    `are under visualDatasets):\n` +
    JSON.stringify(signalPacket, null, 2)
  );
}

/* ------------------------------------------------------------------------------------------------
 * Structural validation — cheap, automatic, runs on every claim before anything else does
 * ---------------------------------------------------------------------------------------------- */

interface StructuralIssue {
  path: string;
  reason: string;
}

/**
 * Every evidence_id cited must exist in the packet, and a claim calling itself an "insight" in
 * spirit (i.e. every GroundedClaim here) must draw on signals spanning at least two domains,
 * exactly the bar the user's own prompt sets for what counts as a real connection rather than a
 * restatement of one signal in different words. Both are free to check because the signal packet
 * already carries each signal's `domains` — this function does not re-derive anything, only looks
 * up what the compiler already computed.
 */
export function validateStructure(thesis: EnterpriseThesis, signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): StructuralIssue[] {
  const issues: StructuralIssue[] = [];
  // sig_* and ctx_* share one evidence namespace as far as a claim is concerned -- both are
  // "governed things this claim is allowed to cite" -- so they resolve through the same lookup.
  const byId = new Map<string, Signal | ContextItem>([
    ...signalPacket.signals.map((s): [string, Signal | ContextItem] => [s.id, s]),
    ...signalPacket.contextItems.map((c): [string, Signal | ContextItem] => [c.id, c]),
  ]);
  const domainRequiringTypes: ClaimType[] = ["CROSS_DOMAIN_INSIGHT", "ADVISORY_INFERENCE"];

  function checkClaim(path: string, claim: GroundedClaim) {
    if (claim.evidence_ids.length === 0) {
      issues.push({ path, reason: "no evidence_ids cited" });
      return;
    }
    const domains = new Set<string>();
    for (const evId of claim.evidence_ids) {
      const item = byId.get(evId);
      if (!item) {
        issues.push({ path, reason: `cites unknown evidence id: ${evId}` });
        continue;
      }
      item.domains.forEach((d) => domains.add(d));
    }
    // The two-domain bar only polices claims that are actually attempting a cross-domain
    // connection. A FACT or OBSERVATION restating a single signal was never trying to connect
    // anything and isn't a structural problem for staying single-domain.
    if (domainRequiringTypes.includes(claim.claim_type) && domains.size < 2) {
      issues.push({
        path,
        reason: `claim_type=${claim.claim_type} spans only ${domains.size} domain(s), below the two-domain bar for a real connection`,
      });
    }
  }

  thesis.enterprise_story_claims.forEach((c, i) => checkClaim(`enterprise_story_claims[${i}]`, c));
  thesis.value_creation_model.primary_value_drivers.forEach((c, i) => checkClaim(`value_creation_model.primary_value_drivers[${i}]`, c));
  thesis.value_creation_model.economic_dependencies.forEach((c, i) => checkClaim(`value_creation_model.economic_dependencies[${i}]`, c));
  thesis.strategic_bets.forEach((c, i) => checkClaim(`strategic_bets[${i}]`, c));
  thesis.structural_constraints.forEach((c, i) => checkClaim(`structural_constraints[${i}]`, c));
  thesis.operating_tensions.forEach((c, i) => checkClaim(`operating_tensions[${i}]`, c));
  thesis.leadership_consensus.forEach((c, i) => checkClaim(`leadership_consensus[${i}]`, c));
  thesis.leadership_disagreements.forEach((c, i) => checkClaim(`leadership_disagreements[${i}]`, c));
  thesis.performance_story.where_improving.forEach((c, i) => checkClaim(`performance_story.where_improving[${i}]`, c));
  thesis.performance_story.where_off_track.forEach((c, i) => checkClaim(`performance_story.where_off_track[${i}]`, c));
  thesis.technology_and_data_implications.forEach((c, i) => checkClaim(`technology_and_data_implications[${i}]`, c));
  thesis.material_risks.forEach((c, i) => checkClaim(`material_risks[${i}]`, c));
  thesis.value_realization_tensions.forEach((c, i) => checkClaim(`value_realization_tensions[${i}]`, c));
  thesis.what_needs_attention.forEach((c, i) => checkClaim(`what_needs_attention[${i}]`, c));
  thesis.things_a_new_cxo_should_know.forEach((c, i) => checkClaim(`things_a_new_cxo_should_know[${i}]`, c));

  // Visuals get their own check: dataset_ref must be a real, precomputed dataset (nothing else is
  // plottable) and visual_type must be one of the fixed grammar's shapes -- the two guardrails
  // that keep a visual honest without needing a model call to verify it.
  (thesis.visual_opportunities ?? []).forEach((v, i) => {
    const path = `visual_opportunities[${i}]`;
    if (!VISUAL_TYPES.includes(v.visual_type)) {
      issues.push({ path, reason: `visual_type "${v.visual_type}" is not in the allowed grammar` });
    }
    if (!(v.dataset_ref in signalPacket.visualDatasets)) {
      issues.push({ path, reason: `dataset_ref "${v.dataset_ref}" does not exist in visualDatasets` });
    }
    for (const evId of v.evidence_ids ?? []) {
      if (!byId.has(evId)) issues.push({ path, reason: `cites unknown evidence id: ${evId}` });
    }
  });

  return issues;
}

/* ------------------------------------------------------------------------------------------------
 * Entailment verification — the part that structural checks cannot do
 *
 * A structural check proves every cited evidence_id is real and spans two domains. It cannot prove
 * the claim's SENTENCE actually follows from what those signals say — a model can cite two genuine
 * signal ids next to a connection between them that isn't actually supported by either. That gap
 * is why this exists, and why it runs in V1 rather than being deferred: this is the surface making
 * the strongest synthesized claims Home will show a reader, which is exactly where an unverified
 * plausible-sounding connection would do the most damage.
 *
 * The verifier call is deliberately blind to everything except the claim and its own cited
 * evidence -- it never sees the rest of the thesis, the rest of the packet, or the reasoning that
 * produced the claim. That is the same "narrow is safer" discipline the orientation-pack
 * generator uses, applied to checking instead of writing.
 * ---------------------------------------------------------------------------------------------- */

/**
 * Four states, not three, and the fourth (SUPPORTED_INFERENCE) is the whole point of paying for a
 * model here instead of a template. A synthesis across two facts that no single fact states
 * verbatim is not a defect to be caught -- it is the advisory judgment this layer exists to
 * produce. What makes it acceptable is not that it was already written somewhere; it is that it
 * follows reasonably from what was, and says so at the certainty it has actually earned. Collapsing
 * SUPPORTED_INFERENCE into OVERSTATED would strip every genuine insight down to a restated fact;
 * collapsing it into SUPPORTED would stop distinguishing "the packet says this" from "this is a
 * reasonable read of the packet" -- a distinction worth keeping visible to a reader, not just to
 * the pipeline.
 */
type Verdict = "SUPPORTED" | "SUPPORTED_INFERENCE" | "OVERSTATED" | "UNSUPPORTED";

const VERIFIER_SYSTEM_PROMPT = `You are a skeptical fact-checker. You will be given a claim and a list of
facts. Your only job is to decide whether the claim follows from exactly those facts and nothing else.

Return exactly one of:

SUPPORTED — every part of the claim is directly stated by the facts. No interpretation required.

SUPPORTED_INFERENCE — the claim is not a literal fact, but is a reasonable synthesis of two or more
of the given facts, and is phrased with uncertainty appropriate to an inference rather than stated
as settled ("could", "may", "is consistent with", "suggests" -- not "is" or "proves"). The
connection must be one a careful reader would accept as a fair reading of the facts, not a leap.

OVERSTATED — the claim's direction is defensible, but its certainty, ranking, causality, scope, or
consensus exceeds what the facts support. This includes: a comparative or superlative ("the most
severe", "the largest") with no comparison across the full set in the facts; causation asserted
from coexistence; a topic being "raised" turned into leaders "agreeing" or having "conviction"; a
single case generalized into a pattern; scope broadened beyond what was named (e.g. "the
organization" when the facts name one system or one program).

UNSUPPORTED — the claim does not follow from the facts at all, even as an inference.

Default to OVERSTATED over SUPPORTED_INFERENCE when genuinely unsure whether a leap is reasonable
or too far -- a demoted insight costs a rewrite; a false SUPPORTED_INFERENCE costs a confident
claim with no real basis reaching an executive under the cover of "inference."

Respond with strict JSON: { "verdict": "...", "reasoning": "one sentence" }`;

/** sig_* and ctx_* share one evidence namespace -- a verifier resolving a claim's citations must
 * be able to see every governed context item cited, not only computed signals. */
function evidenceLookup(signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>) {
  return new Map<string, { statement: string }>([
    ...signalPacket.signals.map((s): [string, { statement: string }] => [s.id, s]),
    ...signalPacket.contextItems.map((c): [string, { statement: string }] => [c.id, c]),
  ]);
}

async function verifyClaim(
  client: Parameters<typeof callClaude>[0],
  claim: GroundedClaim,
  signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>,
): Promise<{ verdict: Verdict; reasoning: string }> {
  const byId = evidenceLookup(signalPacket);
  const facts = claim.evidence_ids.map((id) => byId.get(id)?.statement).filter(Boolean);
  if (facts.length === 0) return { verdict: "UNSUPPORTED", reasoning: "no resolvable evidence ids" };

  const userPrompt =
    `Claim:\n${claim.statement}\n\nFacts (this is all you may use):\n` +
    facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  // A single-claim classification against a handful of facts -- low effort is proportionate, and
  // 4096 gives headroom above every ceiling this call has previously failed at (200, then 3072).
  const result = await callClaude(client, VERIFIER_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return { verdict: "UNSUPPORTED", reasoning: "verifier call failed" };
  try {
    const parsed = JSON.parse(result.text) as { verdict: Verdict; reasoning: string };
    return parsed;
  } catch {
    return { verdict: "UNSUPPORTED", reasoning: "verifier returned non-JSON" };
  }
}

/**
 * Targeted repair for an OVERSTATED claim -- not a delete, not a full-paragraph rewrite by a
 * second, more conservative pass. That second failure mode is real: a pipeline that hands a
 * "write this more carefully" instruction to a fresh model call tends to sand every claim down to
 * the same cautious register, which is exactly the bland-summary problem this whole layer was
 * built to escape in the first place. This call sees only the original sentence, the facts that
 * were actually cited, and the verifier's specific objection -- and is told to fix only what the
 * objection named, keeping everything else about the sentence's specificity and shape intact.
 */
const REPAIR_SYSTEM_PROMPT = `A claim you wrote was flagged as overstated. You will be given the
original claim, the facts it was allowed to use, and specifically what about it overstepped them.

Rewrite the claim so it no longer makes that overstated assertion, while preserving everything else
that was good about it: the specific numbers, the named entities, the connection between facts, the
executive usefulness. Do not become generic. Do not hedge more than the flagged problem requires.
Do not add new facts.

If the underlying observation is still interesting once the overstated part is removed, keep it and
phrase the remaining connection as an appropriately uncertain inference ("could", "may", "is
consistent with") rather than deleting the insight entirely. Losing a good observation because one
word overstepped is worse than fixing the word.

Respond with strict JSON: { "repaired_statement": "..." }`;

async function repairClaim(
  client: Parameters<typeof callClaude>[0],
  claim: GroundedClaim,
  verifierReasoning: string,
  signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>,
): Promise<string | null> {
  const byId = evidenceLookup(signalPacket);
  const facts = claim.evidence_ids.map((id) => byId.get(id)?.statement).filter(Boolean);
  const userPrompt =
    `Original claim:\n${claim.statement}\n\n` +
    `Facts it was allowed to use:\n${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n` +
    `What overstepped them:\n${verifierReasoning}`;
  // Rewriting one sentence against a named, specific objection -- low effort, same generous
  // ceiling as the verifier call above.
  const result = await callClaude(client, REPAIR_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return null;
  try {
    const parsed = JSON.parse(result.text) as { repaired_statement: string };
    return parsed.repaired_statement || null;
  } catch {
    return null;
  }
}

/**
 * Reconciles narrative prose against a claims list after verification has repaired or dropped one
 * or more of those claims. Without this, the published claims array can say one corrected thing
 * while the prose paragraph next to it still says the original, uncorrected thing -- a real
 * inconsistency, not a cosmetic one, since enterprise_story is the single highest-visibility
 * surface in the whole thesis. Only called when something actually changed; unlike repairClaim
 * (which touches one sentence), this rewrites the whole paragraph, so it's reserved for the case
 * where skipping it would leave the story visibly contradicting its own evidence base.
 */
const RECONCILE_SYSTEM_PROMPT = `You wrote a narrative paragraph, and separately decomposed its
material claims into a list. Verification has since corrected one or more of those claims --
either repaired to remove an unsupported assertion, or dropped entirely because it did not hold up.

Rewrite the paragraph so it is fully consistent with the corrected claims list: no sentence in the
paragraph should assert something the corrected claims no longer support. Preserve the original's
tone, structure, and level of detail as closely as possible -- this is a consistency correction,
not a rewrite from scratch. Keep it within the same approximate length as the original.

Respond with strict JSON: { "revised_text": "..." }`;

async function reconcileNarrative(
  client: Parameters<typeof callClaude>[0],
  originalText: string,
  correctedClaims: GroundedClaim[],
): Promise<string | null> {
  const userPrompt =
    `Original paragraph:\n${originalText}\n\n` +
    `Corrected claims list (this is what the paragraph must now be consistent with):\n` +
    correctedClaims.map((c, i) => `${i + 1}. ${c.statement}`).join("\n");
  // A full-paragraph rewrite against a short claims list -- low effort is proportionate, and this
  // only ever fires when something actually needs reconciling, not on every run.
  const result = await callClaude(client, RECONCILE_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return null;
  try {
    const parsed = JSON.parse(result.text) as { revised_text: string };
    return parsed.revised_text || null;
  } catch {
    return null;
  }
}

/** Claim categories verified — the surfaces carrying comparative, causal, consensus, or
 * strategic-alignment claims, the shapes most prone to overstepping their evidence. Purely
 * descriptive sections (performance_story) are left unverified: verifying every sentence adds
 * cost and latency for a shape that rarely overstates, and flattens the writing for no gain. */
function claimsRequiringVerification(thesis: EnterpriseThesis): Array<{ path: string; claim: GroundedClaim }> {
  const out: Array<{ path: string; claim: GroundedClaim }> = [];
  thesis.enterprise_story_claims.forEach((c, i) => out.push({ path: `enterprise_story_claims[${i}]`, claim: c }));
  thesis.value_creation_model.primary_value_drivers.forEach((c, i) => out.push({ path: `value_creation_model.primary_value_drivers[${i}]`, claim: c }));
  thesis.value_creation_model.economic_dependencies.forEach((c, i) => out.push({ path: `value_creation_model.economic_dependencies[${i}]`, claim: c }));
  thesis.strategic_bets.forEach((c, i) => out.push({ path: `strategic_bets[${i}]`, claim: c }));
  thesis.structural_constraints.forEach((c, i) => out.push({ path: `structural_constraints[${i}]`, claim: c }));
  thesis.operating_tensions.forEach((c, i) => out.push({ path: `operating_tensions[${i}]`, claim: c }));
  thesis.leadership_consensus.forEach((c, i) => out.push({ path: `leadership_consensus[${i}]`, claim: c }));
  thesis.leadership_disagreements.forEach((c, i) => out.push({ path: `leadership_disagreements[${i}]`, claim: c }));
  thesis.technology_and_data_implications.forEach((c, i) => out.push({ path: `technology_and_data_implications[${i}]`, claim: c }));
  thesis.material_risks.forEach((c, i) => out.push({ path: `material_risks[${i}]`, claim: c }));
  thesis.value_realization_tensions.forEach((c, i) => out.push({ path: `value_realization_tensions[${i}]`, claim: c }));
  thesis.what_needs_attention.forEach((c, i) => out.push({ path: `what_needs_attention[${i}]`, claim: c }));
  thesis.things_a_new_cxo_should_know.forEach((c, i) => out.push({ path: `things_a_new_cxo_should_know[${i}]`, claim: c }));
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Claude call plumbing
 * ---------------------------------------------------------------------------------------------- */

type ReasoningEffort = "low" | "medium" | "high" | "xhigh" | "max";

async function callClaude(
  client: { messages: { create: (p: Record<string, unknown>) => Promise<unknown> } } | null,
  system: string,
  userPrompt: string,
  maxTokens: number,
  effort: ReasoningEffort,
): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string } | null> {
  if (!client) return null;
  // A live run against this model rejected `thinking: {type: "enabled", budget_tokens}` outright --
  // 400 "\"thinking.type.enabled\" is not supported for this model. Use \"thinking.type.adaptive\"
  // and \"output_config.effort\" to control thinking behavior." That's the model family's actual
  // contract: thinking is adaptive (not a fixed token allotment the caller reserves) and its depth
  // is steered by an effort tier instead. max_tokens is still the ceiling on thinking + text
  // combined, so it's sized generously per call rather than as a precise thinkingBudget + content
  // sum -- the two empty-response bugs this ceiling was originally chasing (ceiling too low for
  // either the response or the model's own reasoning) are still guarded by the diagnostic below.
  const response = (await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort },
    system,
    messages: [{ role: "user", content: userPrompt }],
  })) as {
    model: string;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number; output_tokens_details?: { thinking_tokens?: number } };
    content: Array<{ type: string; text?: string }>;
  };
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  if (!text) {
    // The first real run against both tenants returned empty text from every call with no other
    // signal to explain why. Guessing at a fix (a bigger max_tokens budget) without knowing the
    // actual cause is exactly the mistake this session spent four deploy cycles unlearning on the
    // orientation pack's validator. Print what the API actually said -- block types, stop reason,
    // and the thinking/output token split -- so a second empty response is diagnosable instead of
    // another guess.
    const blockTypes = response.content.map((b) => b.type).join(",") || "(no content blocks)";
    console.log(
      `    ! empty text -- stop_reason=${response.stop_reason ?? "unknown"} blocks=[${blockTypes}] ` +
        `output_tokens=${response.usage?.output_tokens ?? "unknown"} ` +
        `thinking_tokens=${response.usage?.output_tokens_details?.thinking_tokens ?? "unknown"} ` +
        `max_tokens=${maxTokens} effort=${effort}`,
    );
    return null;
  }
  return {
    text,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    model: response.model,
  };
}

export function parseThesisJson(text: string): EnterpriseThesis | null {
  // Models occasionally wrap JSON in a code fence despite instructions. Strip it if present.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as EnterpriseThesis;
  } catch {
    return null;
  }
}

/** Drop a claim from its array in place. Used after verification rejects it. */
export function dropClaim(thesis: EnterpriseThesis, path: string) {
  const m = path.match(/^([a-zA-Z_.]+)\[(\d+)\]$/);
  if (!m) return;
  const [, arrayPath, idxStr] = m;
  const idx = Number(idxStr);
  const segments = arrayPath.split(".");
  let target: any = thesis;
  for (const seg of segments.slice(0, -1)) target = target[seg];
  const arr = target[segments[segments.length - 1]] as unknown[];
  arr[idx] = null as never;
}

/* ------------------------------------------------------------------------------------------------
 * Build
 * ---------------------------------------------------------------------------------------------- */

async function buildTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const report = await buildCanonicalTenantDataReport({ repoRoot: process.cwd(), tenantKeys: [tenantKey] });
  const records = report.canonicalRecords.filter((r: any) => r.tenantKey === tenantKey) as any;
  if (records.length === 0) throw new Error(`no canonical records for ${tenantKey}`);

  const crosswalkPath = path.join(
    process.cwd(),
    `datasets/tenant-inputs/active/${tenantKey}/current/12b_interview_initiative_metric_crosswalk.csv`,
  );
  let crosswalkRows: Array<{ canonicalObjectType: string; canonicalObjectName?: string }> = [];
  if (fs.existsSync(crosswalkPath)) {
    const parsed = Papa.parse(fs.readFileSync(crosswalkPath, "utf8"), { header: true, skipEmptyLines: true });
    crosswalkRows = (parsed.data as any[]).map((r) => ({
      canonicalObjectType: r.canonical_object_type,
      canonicalObjectName: r.canonical_object_name,
    }));
  }

  const dc = buildDecisionContext(records);
  const quality = buildContextQualityManifest(records, crosswalkRows, GOLDEN_EVIDENCE_CONTRACTS[tenantKey] ?? []);
  const signalPacket = buildEnterpriseSignalPacket(dc, quality);

  console.log(`  ${records.length.toLocaleString()} records → ${signalPacket.signals.length} material signals`);

  if (!client) {
    return {
      signalPacket, rawGeneration: null, publishedGeneration: null,
      structuralIssues: [], verificationLedger: [], usage: { input: 0, output: 0 },
    };
  }

  const userPrompt = buildUserPrompt(signalPacket);
  const usage = { input: 0, output: 0 };
  // The schema's array bounds are now stated explicitly in SYSTEM_PROMPT (a spine, not a report --
  // 3-5 items per array, 250-400 words for enterprise_story), targeting roughly 6000 tokens of
  // actual content in the worst case. This call's thinking is not a token budget the caller
  // reserves (this model rejects that shape entirely -- see callClaude) but an effort tier the
  // model manages itself; "medium" is proportionate to genuine cross-domain synthesis across a
  // 40+ signal packet without inviting the runaway reasoning that ate an entire fixed budget on
  // the first live attempt. max_tokens is a generous ceiling on thinking + content combined, not a
  // precise split -- if a future run shows this still truncating, the diagnostic in callClaude now
  // reports the actual thinking/output token split instead of requiring another guess.
  const generation = await callClaude(client, SYSTEM_PROMPT, userPrompt, 10000, "medium");
  if (!generation) {
    console.log("  ! thesis generation returned no text");
    return {
      signalPacket, rawGeneration: null, publishedGeneration: null,
      structuralIssues: [], verificationLedger: [], usage,
    };
  }
  usage.input += generation.inputTokens;
  usage.output += generation.outputTokens;

  const rawGeneration = parseThesisJson(generation.text);
  if (!rawGeneration) {
    console.log("  ! thesis did not parse as JSON — first 300 chars:");
    console.log("   ", generation.text.slice(0, 300));
    return {
      signalPacket, rawGeneration: null, publishedGeneration: null,
      structuralIssues: [], verificationLedger: [], usage,
    };
  }

  const structuralIssues = validateStructure(rawGeneration, signalPacket);
  console.log(`  structural check: ${structuralIssues.length} issue(s)`);
  for (const issue of structuralIssues.slice(0, 10)) console.log(`    - ${issue.path}: ${issue.reason}`);

  // raw_generation is the untouched model output -- captured before any repair or drop mutates
  // the working copy, so it survives independently of what verification decides to do with it.
  const publishedGeneration: EnterpriseThesis = JSON.parse(JSON.stringify(rawGeneration));

  const toVerify = claimsRequiringVerification(publishedGeneration);
  console.log(`  verifying ${toVerify.length} high-stakes claims...`);
  const verificationLedger: Array<{ path: string; verdict: Verdict; reasoning: string; action: string }> = [];
  for (const { path: claimPath, claim } of toVerify) {
    const result = await verifyClaim(client, claim, signalPacket);
    if (result.verdict === "UNSUPPORTED") {
      dropClaim(publishedGeneration, claimPath);
      verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "dropped" });
    } else if (result.verdict === "OVERSTATED") {
      const repaired = await repairClaim(client, claim, result.reasoning, signalPacket);
      if (repaired) {
        claim.statement = repaired;
        verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "repaired" });
      } else {
        // Repair itself failed (no client response, or bad JSON back) -- an overstated claim that
        // can't be corrected is worse than no claim, so this is the one place drop still applies
        // to an OVERSTATED verdict.
        dropClaim(publishedGeneration, claimPath);
        verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "dropped (repair failed)" });
      }
    } else {
      // SUPPORTED and SUPPORTED_INFERENCE are both publishable as-is -- SUPPORTED_INFERENCE is
      // reasonable, appropriately-hedged synthesis, not a defect to correct.
      verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "kept" });
    }
  }
  const tally: Record<string, number> = {};
  for (const r of verificationLedger) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;
  console.log(`  verifier verdicts:`, tally);

  // If verification touched any claim underneath the story or the value-creation summary, the
  // prose next to those claims is now stale -- reconcile it so the highest-visibility text in the
  // thesis doesn't visibly contradict the claims it was supposedly built from.
  const storyClaimsChanged = verificationLedger.some(
    (r) => r.path.startsWith("enterprise_story_claims[") && r.action !== "kept",
  );
  if (storyClaimsChanged) {
    const survivingClaims = publishedGeneration.enterprise_story_claims.filter((c): c is GroundedClaim => c !== null);
    const revised = await reconcileNarrative(client, publishedGeneration.enterprise_story, survivingClaims);
    if (revised) {
      publishedGeneration.enterprise_story = revised;
      console.log("  reconciled enterprise_story against corrected claims");
    } else {
      console.log("  ! enterprise_story reconciliation failed -- prose may be stale relative to corrected claims");
    }
  }

  const vcmClaimsChanged = verificationLedger.some(
    (r) =>
      (r.path.startsWith("value_creation_model.primary_value_drivers[") ||
        r.path.startsWith("value_creation_model.economic_dependencies[")) &&
      r.action !== "kept",
  );
  if (vcmClaimsChanged) {
    const survivingClaims = [
      ...publishedGeneration.value_creation_model.primary_value_drivers,
      ...publishedGeneration.value_creation_model.economic_dependencies,
    ].filter((c): c is GroundedClaim => c !== null);
    const revised = await reconcileNarrative(client, publishedGeneration.value_creation_model.summary, survivingClaims);
    if (revised) {
      publishedGeneration.value_creation_model.summary = revised;
      console.log("  reconciled value_creation_model.summary against corrected claims");
    } else {
      console.log("  ! value_creation_model.summary reconciliation failed -- prose may be stale relative to corrected claims");
    }
  }

  return { signalPacket, rawGeneration, publishedGeneration, structuralIssues, verificationLedger, usage };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  let client: Parameters<typeof callClaude>[0] = null;
  if (hasKey) {
    const { getAnthropicDirectClient } = await import("../../src/lib/integrations/ai-egress/anthropic-direct");
    client = getAnthropicDirectClient({ workload: "enterprise_thesis" }) as never;
  } else {
    console.log("! ANTHROPIC_API_KEY absent — building deterministic layers only, no thesis attempted\n");
  }

  for (const tenantKey of TENANTS) {
    console.log(`\n=== ${tenantKey} ===`);
    const { signalPacket, rawGeneration, publishedGeneration, structuralIssues, verificationLedger, usage } =
      await buildTenant(tenantKey, client);

    const result = { tenantKey, signalPacket, rawGeneration, publishedGeneration, structuralIssues, verificationLedger };
    const outFile = path.join(OUT_DIR, `${tenantKey}-enterprise-thesis.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`  → ${outFile}`);
    if (usage.output) console.log(`  tokens in ${usage.input} / out ${usage.output}`);

    // The out-dir above is inside the job's ephemeral container and is lost when it exits. Print
    // the full result to stdout too, one line per tenant, so it survives in the captured job log
    // and can be parsed back out locally -- the same reason the orientation-pack build's rejection
    // reasons were readable from console output earlier this session, just generalized to the
    // whole result instead of a summary line.
    console.log(`__ENTERPRISE_THESIS_RESULT_BEGIN__${JSON.stringify(result)}__ENTERPRISE_THESIS_RESULT_END__`);

    if (!WRITE || !publishedGeneration) continue;

    const contentHash = require("node:crypto")
      .createHash("sha256")
      .update(JSON.stringify(signalPacket))
      .digest("hex");

    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      await db.query("BEGIN");
      const existing = await db.query<{ content_hash: string }>(
        `SELECT content_hash FROM public.home_knowledge_packs
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'
          ORDER BY created_at DESC LIMIT 1`,
        [tenantKey, ARTIFACT_TYPE],
      );
      if (existing.rows[0]?.content_hash === contentHash) {
        console.log("  = unchanged since last build, not rewritten");
        await db.query("ROLLBACK");
        continue;
      }
      await db.query(
        `UPDATE public.home_knowledge_packs
            SET status = 'retired', effective_to = now(), updated_at = now()
          WHERE tenant_key = $1 AND artifact_type = $2 AND status <> 'retired'`,
        [tenantKey, ARTIFACT_TYPE],
      );
      const inserted = await db.query<{ id: string }>(
        `INSERT INTO public.home_knowledge_packs (
           tenant_key, tenant_name, pack_version, status, artifact_type,
           source_pack_hash, generator_version, generated_by, generated_model,
           claude_model, claude_prompt_version, content_hash, render_pack,
           quality_report, validation_status, validation_issues, effective_from
         ) VALUES ($1,$2,$3,'candidate',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
         RETURNING id`,
        [
          tenantKey,
          tenantKey,
          `${ARTIFACT_TYPE}:${contentHash.slice(0, 12)}`,
          ARTIFACT_TYPE,
          contentHash,
          "enterprise-thesis/v1",
          "build-enterprise-thesis",
          CLAUDE_MODEL,
          CLAUDE_MODEL,
          "enterprise-thesis/v1",
          contentHash,
          // Three separate objects, per the standing rule against silent post-hoc scrubbing: the
          // unmodified model output, what's actually published after repair/drop, and the full
          // ledger of what the verifier decided and why -- each independently inspectable rather
          // than only the end state.
          JSON.stringify({ signalPacket, raw_generation: rawGeneration, published_generation: publishedGeneration }),
          JSON.stringify({ structuralIssues, verificationLedger }),
          structuralIssues.length === 0 ? "pass" : "warn",
          JSON.stringify(structuralIssues),
        ],
      );
      const readback = await db.query<{ has_thesis: boolean }>(
        `SELECT (render_pack->'published_generation') IS NOT NULL AS has_thesis FROM public.home_knowledge_packs WHERE id = $1`,
        [inserted.rows[0].id],
      );
      if (!readback.rows[0]?.has_thesis) throw new Error("readback found no thesis in stored render_pack");
      await db.query("COMMIT");
      console.log(`  ✓ stored ${inserted.rows[0].id}`);
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      await db.end();
    }
  }
}

// Only run when invoked directly -- importing this module (e.g. from a test) must not execute a
// build. The same mistake, fixed once already this session in the orientation-pack generator when
// the dimension registry lived in a script that ran its own build on import.
if (process.argv[1] && process.argv[1].includes("build-enterprise-thesis")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
