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
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";
import {
  buildDecisionContext,
  buildContextQualityManifest,
  buildEnterpriseSignalPacket,
  type Signal,
  type ContextItem,
  type RelationshipRow,
  type SourceSummary,
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
/** Shared with build-home-chapters.ts's provenance stamp -- one source of truth for what prompt
 * version produced a given thesis, rather than the same string hardcoded in two files. */
export const THESIS_PROMPT_VERSION = "enterprise-thesis/v1.2-source-breadth";
export const THESIS_OUTPUT_TOKEN_BUDGET = 28000;

/**
 * Contracts with document-level extraction, per tenant. Not derivable from canonical -- that
 * evidence lives in a separate root that never merges into the canonical vendor_contract object.
 * Named explicitly here, the same way the golden-evidence loaders name their own contract scope.
 */
const GOLDEN_EVIDENCE_CONTRACTS: Record<string, string[]> = {
  "skyharbor-air": ["Vantage", "Northgate"],
  "meridian-health": [],
};

const INTAKE_FILE_EXTENSIONS = new Set([".csv", ".tsv", ".json"]);

function walkIntakeFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkIntakeFiles(fullPath));
    } else if (entry.isFile() && INTAKE_FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function sourceDomainForFile(relativePath: string): string {
  const name = path.basename(relativePath).toLowerCase();
  if (name.startsWith("00_guide")) return "intake_guidance";
  if (name.startsWith("00_")) return "enterprise_structure";
  if (name.startsWith("01")) return "business_model";
  if (name.startsWith("02")) return "organization";
  if (name.startsWith("03")) return "workforce";
  if (name.startsWith("04")) return "technology_estate";
  if (name.startsWith("05")) return "data_estate";
  if (name.startsWith("06")) return "infrastructure";
  if (name.startsWith("07")) return "vendor_commercial_estate";
  if (name.startsWith("08")) return "spend_value";
  if (name.startsWith("09")) return "transformation_portfolio";
  if (name.startsWith("10") || name.startsWith("sa08") || name.startsWith("sa09")) return "ai_portfolio";
  if (name.startsWith("11")) return "risk_controls";
  if (name.startsWith("12")) return "relationships";
  if (name.startsWith("13")) return "evidence";
  if (name.startsWith("14")) return "metrics_outcomes";
  if (name.startsWith("15") || name.startsWith("16")) return "analytical_framing";
  if (name.startsWith("17")) return "managed_services";
  if (name.startsWith("18")) return "operations";
  if (name.startsWith("19")) return "data_platform_maturity";
  if (name.startsWith("sa10")) return "leadership_voice";
  if (name.startsWith("sa11")) return "operational_outcomes";
  return "client_intake";
}

function summarizeRecord(row: Record<string, unknown>, fields: string[]): string | null {
  const values = fields.map((field) => String(row[field] ?? "").trim()).filter(Boolean).slice(0, 3);
  return values.length ? values.join(" · ") : null;
}

function summarizeCsvFile(fullPath: string, relativePath: string): SourceSummary {
  const text = fs.readFileSync(fullPath, "utf8");
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  const fields = (parsed.meta.fields ?? []).filter(Boolean);
  const nonEmptyByField = new Map<string, number>();
  for (const row of rows) {
    for (const field of fields) {
      if (String(row[field] ?? "").trim()) nonEmptyByField.set(field, (nonEmptyByField.get(field) ?? 0) + 1);
    }
  }
  const materialFields = [...nonEmptyByField.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([field]) => field)
    .slice(0, 12);
  const exampleFields = materialFields.length ? materialFields : fields.slice(0, 5);
  return {
    sourcePath: relativePath,
    domain: sourceDomainForFile(relativePath),
    objectTypes: ["client_intake_file"],
    recordCount: 0,
    rawRowCount: rows.length,
    canonicalRecordCount: 0,
    sourceKind: relativePath.toLowerCase().startsWith("00_guide") ? "intake_guidance" : "client_intake_file",
    basis: ["coverage_context_not_citable"],
    authority: ["client_intake_inventory"],
    qualityStates: parsed.errors.length ? ["parse_warnings"] : ["raw_intake_file"],
    materialFields,
    exampleRecords: rows.map((row) => summarizeRecord(row, exampleFields)).filter((value): value is string => Boolean(value)).slice(0, 5),
  };
}

function summarizeJsonFile(fullPath: string, relativePath: string): SourceSummary {
  const text = fs.readFileSync(fullPath, "utf8");
  let rawRowCount = 1;
  let materialFields: string[] = [];
  let qualityState = "raw_intake_file";
  try {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    rawRowCount = rows.length;
    const firstObject = rows.find((row) => row && typeof row === "object" && !Array.isArray(row)) as Record<string, unknown> | undefined;
    materialFields = firstObject ? Object.keys(firstObject).slice(0, 12) : [];
  } catch {
    qualityState = "parse_warnings";
  }
  return {
    sourcePath: relativePath,
    domain: sourceDomainForFile(relativePath),
    objectTypes: ["client_intake_file"],
    recordCount: 0,
    rawRowCount,
    canonicalRecordCount: 0,
    sourceKind: "client_intake_file",
    basis: ["coverage_context_not_citable"],
    authority: ["client_intake_inventory"],
    qualityStates: [qualityState],
    materialFields,
    exampleRecords: [],
  };
}

function buildIntakeSourceInventorySummaries(repoRoot: string, tenantKey: string): SourceSummary[] {
  const currentRoot = path.join(repoRoot, "datasets", "tenant-inputs", "active", tenantKey, "current");
  return walkIntakeFiles(currentRoot).map((fullPath) => {
    const relativePath = path.relative(currentRoot, fullPath).split(path.sep).join("/");
    const ext = path.extname(fullPath).toLowerCase();
    return ext === ".csv" || ext === ".tsv"
      ? summarizeCsvFile(fullPath, relativePath)
      : summarizeJsonFile(fullPath, relativePath);
  });
}

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

type MaybeGroundedClaim = GroundedClaim | null;

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
  /** Was a plain string[] until a live run found questions embedding fabricated factual premises
   * with no evidence backing them at all ("given the PAM Rollout program is at 0% completion,
   * what's the plan to...") -- a question is not exempt from the evidence rule just because it's
   * phrased as a question instead of an assertion; the premise inside it is still a claim. Now a
   * GroundedClaim like everything else, entailment-verified the same way: `statement` is the
   * question text, `evidence_ids` ground whatever specific fact, number, or named entity the
   * question references. */
  questions_for_management: GroundedClaim[];
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
workforce <-> automation opportunity <-> operating model
infrastructure risk <-> platform criticality <-> continuity
AI portfolio status <-> promised value <-> finance-validated value
declared system relationships <-> integration concentration <-> dependency
declared risk-to-program linkage <-> program delivery <-> risk exposure
data/analytics maturity gap <-> platform investment <-> capability

EVIDENCE DISCIPLINE
- The packet includes real leadership testimony (verbatim, consented quotes) as citeable signals,
  not just theme-frequency counts. When a quote materially supports a claim, quote it or closely
  paraphrase it -- this is what makes leadership perspective a voice, not a tally.
- The packet includes real, declared relationship data (system integrations, risk-to-program
  impacts, program sponsorship) from a source the client explicitly provided. This is not the
  same thing as a "candidate relationship" and may be cited as fact -- it is a declared linkage,
  not an inference.
- The packet includes analyticalLenses: industry patterns and named expert lenses. These are
  framing material, not facts about this enterprise. Never cite an analyticalLenses entry as
  evidence_ids for a claim about this specific enterprise -- they exist to help you recognize a
  pattern worth investigating, not to be quoted as something true of this tenant.
- The packet includes sourceSummaries: file-level breadth context across the intake. Use these to
  understand which source families are present, thin, or absent before deciding what the enterprise
  story can responsibly say. Never cite sourceSummaries as evidence_ids; they are coverage context,
  not standalone proof for a business claim.
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

CXO-VISIBLE LANGUAGE
Your output may be rendered directly in an executive surface. Do not expose implementation,
pipeline, database, route, or proof-harness vocabulary in any visible field. Do not say ECL,
projection, serving view, loaded row, canonical entity, row count, payload, schema, source room,
writer, provider flag, context_policy, source_refs_json, projection_entry, usable_count, row
readiness, or "not enough verified evidence yet". If the supplied packet is too thin to answer a
chapter's business question, write a precise limitation as an evidence gap; do not manufacture a
chapter headline from missing evidence or from technical counts.

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

CLAIM TYPE DISCIPLINE
Use FACT or OBSERVATION for a claim that rests on one domain. Use CROSS_DOMAIN_INSIGHT or
ADVISORY_INFERENCE only when the evidence_ids genuinely connect two or more domains. Do not label a
single-domain count, ranking, absence, or limitation as an advisory inference just because it has
executive implications; the verifier will drop that as structurally unsupported. When the packet
contains a citable context item saying a source family or evidence type is absent, cite that context
item and write the absence plainly as an evidence limit. Do not transform an absence of strategy,
leadership, KPI, finance-attestation, or business-economics evidence into a strategic bet,
leadership consensus, or value-realization claim.
The safest valid output for a section whose evidence is only single-domain is a small number of
FACT or OBSERVATION items, or an empty array. Never fill a cross-domain/advisory section by
promoting a one-domain fact. If no claim in a section earns two-domain evidence, leave that section
empty rather than making a management implication from one measurement.
Before returning JSON, audit every claim_type against its cited evidence domains. If a claim marked
CROSS_DOMAIN_INSIGHT or ADVISORY_INFERENCE cites only one domain, either downgrade it to FACT or
OBSERVATION when the statement is still useful, or remove it. Do not keep a structurally invalid
claim because it sounds executive. Empty arrays are acceptable for questions, tensions, watch items,
and visual opportunities when the packet does not support them; filling the shape with unsupported
management questions is worse than leaving the shape sparse.

NUMERIC AND COMPARATIVE EVIDENCE
Every number, rank, percentage, date, supplier share, application count, cost total, movement count,
or named-function comparison in a claim must appear exactly in one of that claim's cited signal or
context statements. Do not use packet metadata, source summaries, visual dataset rows, analytical
lenses, or general background knowledge to support a number unless the same number is repeated in a
cited sig_* or ctx_* item. A broad scope or coverage item can support a limitation, but it cannot
support a precise figure or a completeness claim. Row counts, source-file counts, source-family
summaries, or the presence of a source file do not prove "full coverage", "complete evidence",
"estate visibility", or "systematic classification" unless a cited signal says exactly that. If a
cited item says a value is only an application annual-cost total, do
not rename it as a total technology budget, finance-attested spend, enterprise run-rate, or value
pool. If a cited item says a movement count is an integration-record count, do not convert it into
data volume, transaction volume, or proof of analytics consumption.

Named entity language follows the same rule. If a claim names a specific application, product,
supplier, platform, program, tool, report, business function, or technology, at least one cited
sig_* or ctx_* statement for that same claim must contain that exact name. Do not lift named
entities from sourceSummaries, uncited contextItems, visual dataset labels, or background knowledge
and attach them to a nearby aggregate signal. If the only cited support is an aggregate such as
"750 applications" or "top five suppliers", speak at that aggregate level and do not add example
names. Questions for management obey this rule too: a question may ask what evidence is missing,
but it must not smuggle in an uncited named system, owner, program, platform, or governance process.

Ranking language must also be grounded. You may say "largest", "top five", "second", or name a
function as prominent only when a cited signal gives that ranking or the comparison set. Do not
single out a function, supplier, program, or platform because it sounds strategically important
unless the cited evidence states the count, share, or reason. Questions for management follow the
same rule: they may ask what evidence is needed, but they must not imply that a plan, governance
process, contingency process, framework, or leadership priority already exists unless a cited fact
establishes it. Prefer fewer claims and questions over filling the shape with unsupported
specificity.

MANAGEMENT QUESTIONS ARE OPTIONAL AND RARE
questions_for_management is not a required executive flourish. It is only for questions whose
premise is itself fully grounded in cited evidence. A count, percentage, notice window, supplier
share, or missing field can support a fact or observation; it does not by itself support asking
"what is the current process", "who owns", "what is the plan", "how are leaders tracking", or
"what governance exists" unless a cited signal or context item actually establishes that such a
process, owner, plan, governance mechanism, or leadership decision exists or is explicitly absent.
If the evidence only says a control-relevant fact exists -- for example many contracts have long
notice periods -- write the control-relevant fact as what_needs_attention or evidence_gaps. Do not
invent a management-process premise around it. When no question earns this bar, return
questions_for_management: [].

CONTRACT FLEXIBILITY AND EXIT LANGUAGE
Renewal notice days, auto-renewal counts, and supplier concentration are commercial facts. They may
support "renewal timing should be reviewed" or "contract calendar discipline matters." They do not
by themselves prove constrained renegotiation, constrained exit, lost leverage, switching cost, or
commercial inflexibility unless cited evidence also includes termination rights, transition cost,
benchmarking rights, volume commitments, shortfall penalties, or comparable exit mechanics. Say
"review before asserting savings or flexibility" when that is all the evidence supports.

VALUE CREATION MODEL -- LEAD WITH THE BUSINESS, NOT THE TECHNOLOGY ESTATE
value_creation_model exists to answer one question: how does this enterprise actually make money
and create value? That is a business-economics question first -- revenue segments and their
relative scale, customer/channel mix, what drives volume or margin, how operating segments relate
to each other economically. Technology is something that ENABLES that value creation; it is not
the value creation itself. A live run got this backwards on a tenant where segment-level economics
were sparse in the packet: value_creation_model.summary led with "Airport & Ground Operations has
217 applications and $471.2M of technology cost" -- a real fact, but a technology-estate fact
standing in for a business-value fact, useful to a CIO and useless to a new CEO trying to
understand how the company works.
- If the packet's business context (enterpriseIdentity, businessEconomics, ctx_* segment and
  customer items) gives you enough to describe real revenue/customer/channel economics, lead with
  that. Technology facts belong in economic_dependencies as what the business model depends on,
  not as the model itself.
- If that business-economics context is genuinely thin in the packet -- check before assuming --
  say so explicitly in the summary (e.g. "segment-level revenue economics are not represented in
  the current context; what follows describes technology dependency, not business value creation")
  rather than silently substituting technology cost as if it answered the value-creation question.
  An honest gap is better than a confident answer to the wrong question.
- Do not write "the enterprise creates value through <function>", "value is primarily created by
  <function>", or similar wording unless a cited revenue, customer, product-line, margin, or
  operating-model fact establishes that function's role in value creation. Application count,
  contract value, data-flow count, or vendor concentration can support "this function carries a
  large technology/commercial footprint"; they cannot support "this function creates value."
- If the only cited facts for value_creation_model are technology, application, contract, vendor,
  infrastructure, or data-movement facts, the summary's first sentence must be a refusal/limitation:
  "The current evidence does not establish the enterprise's value-creation model." Then explain the
  technology/commercial dependency that is visible, without pretending it is the business model.

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
Keep every section within these ceilings. These are maximums, not minimums. The eight chapter
writers built on top of this thesis later provide the depth; this object stays sharp enough that a
reader can hold the whole thing in mind at once.
- enterprise_story: 200-350 words. enterprise_story_claims: 1-5 items -- the material assertions
  the story prose is built from, each individually cited and claim_type-tagged. Every material
  claim in the prose should be represented here; this is the auditable backbone under the words.
- value_creation_model.primary_value_drivers: 0-4 GroundedClaim items.
  value_creation_model.economic_dependencies: 0-4 GroundedClaim items.
- strategic_bets, structural_constraints, operating_tensions, material_risks,
  value_realization_tensions, what_needs_attention, technology_and_data_implications: 0-5 items
  each. Empty is correct when the current packet does not support a grounded claim for that section.
- leadership_consensus: 0-5 items. leadership_disagreements: 0-3 items.
- performance_story: 0-3 items in each of where_improving / where_off_track / where_unknown.
- things_a_new_cxo_should_know: 0-6 items. questions_for_management: 0-5 items, each a
  GroundedClaim whose statement is the question text -- if the question references a specific
  fact, number, program, or named entity, cite the evidence_ids that establish it exists; do not
  invent a detail (a percentage, a sponsor change, a dependency) to make a question sound sharper
  than the evidence supports. A genuinely open question with no factual premise ("what would it
  take to accelerate X?") should still cite the evidence_ids for whatever X is.
- visual_opportunities: 0-6 items across the whole thesis -- propose fewer if fewer genuinely earn
  a visual.
Do not pad a section to reach a minimum, and do not exceed the maximum to fit in one more
observation -- pick the strongest ones.

Output strict JSON matching the schema you are given. No prose outside the JSON.`;

function buildUserPrompt(signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): string {
  const claimShape = "{ statement, evidence_ids: [sig_xxx or ctx_xxx], confidence: low|medium|high, claim_type: FACT|OBSERVATION|CROSS_DOMAIN_INSIGHT|ADVISORY_INFERENCE }";
  const datasetNames = Object.keys(signalPacket.visualDatasets);
  const evidenceScopeInstructions = buildEvidenceScopeInstructions(signalPacket);
  return (
    `Build the EnterpriseThesis for this enterprise from the governed context packet below. ` +
    `Every claim needs evidence_ids from the signals or context items list, and a claim_type. ` +
    `Apply this deterministic evidence-scope contract before deciding which sections to fill:\n\n` +
    evidenceScopeInstructions +
    `\n\n` +
    `Return JSON matching this shape exactly:\n\n` +
    JSON.stringify(
      {
        enterprise_story: "string, 200-350 words",
        enterprise_story_claims: [`1-5 GroundedClaim: ${claimShape} -- the material assertions the story is built from`],
        value_creation_model: {
          summary: "string",
          primary_value_drivers: [`0-4 GroundedClaim: ${claimShape}`],
          economic_dependencies: [`0-4 GroundedClaim: ${claimShape}`],
        },
        strategic_bets: [`0-5 GroundedClaim: ${claimShape}`],
        structural_constraints: ["0-5 GroundedClaim"],
        operating_tensions: ["0-5 GroundedClaim"],
        leadership_consensus: ["0-5 GroundedClaim"],
        leadership_disagreements: ["0-3 GroundedClaim"],
        performance_story: {
          where_improving: ["0-3 GroundedClaim"],
          where_off_track: ["0-3 GroundedClaim"],
          where_unknown: ["0-3 GroundedClaim"],
        },
        technology_and_data_implications: ["0-5 GroundedClaim"],
        material_risks: ["0-5 GroundedClaim"],
        value_realization_tensions: ["0-5 GroundedClaim"],
        what_needs_attention: ["0-5 GroundedClaim -- whatever most needs a decision or a look, drawn from any domain, not limited to risk"],
        evidence_gaps: ["string, as many as genuinely material"],
        things_a_new_cxo_should_know: ["0-6 GroundedClaim"],
        questions_for_management: ["0-5 GroundedClaim -- statement is the question text; evidence_ids ground any fact, number, program, or named entity the question references"],
        visual_opportunities: [
          "0-6 VisualOpportunity: { visual_type: <from the allowed list>, title (answer-first), purpose, " +
            `dataset_ref (must be exactly one of: ${datasetNames.join(", ") || "(none available)"}), ` +
            "key_message, evidence_ids, priority: high|medium|low }",
        ],
      },
      null,
      2,
    ) +
    `\n\nGoverned context packet (signals are sig_*, context facts are ctx_*, sourceSummaries ` +
    `describe file-level breadth and gaps but are not citable evidence, plottable datasets are ` +
    `under visualDatasets; analyticalLenses are framing material, never citable as evidence_ids ` +
    `for a claim about this specific enterprise):\n` +
    JSON.stringify(signalPacket, null, 2)
  );
}

function buildEvidenceScopeInstructions(signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>): string {
  const signalDomains = new Set(signalPacket.signals.flatMap((signal) => signal.domains));
  const hasBusinessEconomics =
    signalPacket.businessEconomics.operatingSegments.length > 0 ||
    signalPacket.businessEconomics.customerSegments.length > 0 ||
    Boolean(signalPacket.enterpriseIdentity.revenue);
  const hasStrategyEvidence = signalPacket.strategicPriorities.length > 0 || signalDomains.has("program_initiative");
  const hasLeadershipEvidence = signalDomains.has("ai_value_interview_evidence");
  const hasOutcomeLinkage = signalDomains.has("metric_outcome") || signalDomains.has("ai_value_realization_signal");
  const hasProcessOwnerEvidence =
    signalDomains.has("operational_process_evidence") ||
    signalPacket.contextItems.some((item) => /\b(owner|accountable|process|governance)\b/i.test(item.statement));

  const forcedEmpty: string[] = [];
  if (!hasStrategyEvidence) forcedEmpty.push("strategic_bets");
  if (!hasLeadershipEvidence) forcedEmpty.push("leadership_consensus", "leadership_disagreements");
  if (!hasBusinessEconomics) forcedEmpty.push("value_creation_model.primary_value_drivers");
  if (!hasOutcomeLinkage) forcedEmpty.push("performance_story.where_improving", "performance_story.where_off_track");
  if (!hasLeadershipEvidence && !hasStrategyEvidence && !hasProcessOwnerEvidence) {
    forcedEmpty.push("questions_for_management");
  }

  const lines = [
    `- business_economics_evidence: ${hasBusinessEconomics ? "present" : "absent"} -- ${hasBusinessEconomics ? "value_creation_model may describe business value drivers if cited" : "value_creation_model.summary must lead with a limitation; primary_value_drivers must be []"}.`,
    `- strategy_program_evidence: ${hasStrategyEvidence ? "present" : "absent"} -- ${hasStrategyEvidence ? "strategic_bets may be populated only with cited priorities/programs" : "strategic_bets must be []"}.`,
    `- leadership_voice_evidence: ${hasLeadershipEvidence ? "present" : "absent"} -- ${hasLeadershipEvidence ? "leadership sections may cite testimony/consensus signals" : "leadership_consensus and leadership_disagreements must be []"}.`,
    `- outcome_linkage_evidence: ${hasOutcomeLinkage ? "present" : "absent"} -- ${hasOutcomeLinkage ? "performance_story may distinguish improving/off-track/unknown from cited metrics" : "where_improving and where_off_track must be []; use where_unknown for missing KPI or finance-attestation linkage"}.`,
    `- management_process_evidence: ${hasProcessOwnerEvidence ? "present" : "absent"} -- ${hasProcessOwnerEvidence ? "questions may reference only cited owners/processes/governance" : "do not ask process/owner/governance questions"}.`,
  ];
  if (forcedEmpty.length) {
    lines.push(`- forced_empty_sections_for_this_packet: ${forcedEmpty.join(", ")}.`);
  } else {
    lines.push("- forced_empty_sections_for_this_packet: none.");
  }
  lines.push(
    "- If a forced-empty section conflicts with the generic schema below, the forced-empty instruction wins.",
    "- For remaining sections, prefer FACT or OBSERVATION unless the cited evidence truly spans multiple domains and the statement needs the stronger claim_type.",
  );
  return lines.join("\n");
}

/* ------------------------------------------------------------------------------------------------
 * Structural validation — cheap, automatic, runs on every claim before anything else does
 * ---------------------------------------------------------------------------------------------- */

export interface StructuralIssue {
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
    const evidenceIds = claimEvidenceIds(claim);
    if (evidenceIds.length === 0) {
      issues.push({ path, reason: "no evidence_ids cited" });
      return;
    }
    const domains = new Set<string>();
    for (const evId of evidenceIds) {
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

  function checkClaims(path: string, claims: MaybeGroundedClaim[]) {
    claims.forEach((claim, i) => {
      if (claim) checkClaim(`${path}[${i}]`, claim);
    });
  }

  checkClaims("enterprise_story_claims", thesis.enterprise_story_claims);
  checkClaims("value_creation_model.primary_value_drivers", thesis.value_creation_model.primary_value_drivers);
  checkClaims("value_creation_model.economic_dependencies", thesis.value_creation_model.economic_dependencies);
  checkClaims("strategic_bets", thesis.strategic_bets);
  checkClaims("structural_constraints", thesis.structural_constraints);
  checkClaims("operating_tensions", thesis.operating_tensions);
  checkClaims("leadership_consensus", thesis.leadership_consensus);
  checkClaims("leadership_disagreements", thesis.leadership_disagreements);
  checkClaims("performance_story.where_improving", thesis.performance_story.where_improving);
  checkClaims("performance_story.where_off_track", thesis.performance_story.where_off_track);
  // where_unknown was missing from this list entirely -- found while adding performance_story to
  // entailment verification below; it had neither the structural nor the semantic check.
  checkClaims("performance_story.where_unknown", thesis.performance_story.where_unknown);
  checkClaims("technology_and_data_implications", thesis.technology_and_data_implications);
  checkClaims("material_risks", thesis.material_risks);
  checkClaims("value_realization_tensions", thesis.value_realization_tensions);
  checkClaims("what_needs_attention", thesis.what_needs_attention);
  checkClaims("things_a_new_cxo_should_know", thesis.things_a_new_cxo_should_know);
  checkClaims("questions_for_management", thesis.questions_for_management);

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
export type Verdict = "SUPPORTED" | "SUPPORTED_INFERENCE" | "OVERSTATED" | "UNSUPPORTED";
export interface VerificationLedgerEntry {
  path: string;
  verdict: Verdict;
  reasoning: string;
  action: string;
}

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

function claimEvidenceIds(claim: GroundedClaim): string[] {
  return Array.isArray(claim.evidence_ids) ? claim.evidence_ids : [];
}

async function verifyClaim(
  client: Parameters<typeof callClaude>[0],
  claim: GroundedClaim,
  signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>,
): Promise<{ verdict: Verdict; reasoning: string }> {
  const byId = evidenceLookup(signalPacket);
  const facts = claimEvidenceIds(claim).map((id) => byId.get(id)?.statement).filter(Boolean);
  if (facts.length === 0) return { verdict: "UNSUPPORTED", reasoning: "no resolvable evidence ids" };

  const userPrompt =
    `Claim:\n${claim.statement}\n\nFacts (this is all you may use):\n` +
    facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

  // A single-claim classification against a handful of facts -- low effort is proportionate, and
  // 4096 gives headroom above every ceiling this call has previously failed at (200, then 3072).
  const result = await callClaude(client, VERIFIER_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return { verdict: "UNSUPPORTED", reasoning: "verifier call failed" };
  const parsed = parseJsonLoose<{ verdict: Verdict; reasoning: string }>(result.text, "claim verifier");
  if (parsed) return parsed;

  const fallbackVerdict = result.text.match(/\b(SUPPORTED_INFERENCE|SUPPORTED|OVERSTATED|UNSUPPORTED)\b/)?.[1] as Verdict | undefined;
  if (fallbackVerdict) {
    return {
      verdict: fallbackVerdict,
      reasoning: `verifier returned malformed JSON; recovered explicit verdict from response: ${result.text
        .replace(/\s+/g, " ")
        .slice(0, 240)}`,
    };
  }
  return { verdict: "UNSUPPORTED", reasoning: "verifier returned non-JSON with no recoverable verdict" };
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
  const facts = claimEvidenceIds(claim).map((id) => byId.get(id)?.statement).filter(Boolean);
  const userPrompt =
    `Original claim:\n${claim.statement}\n\n` +
    `Facts it was allowed to use:\n${facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n` +
    `What overstepped them:\n${verifierReasoning}`;
  // Rewriting one sentence against a named, specific objection -- low effort, same generous
  // ceiling as the verifier call above.
  const result = await callClaude(client, REPAIR_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return null;
  const parsed = parseJsonLoose<{ repaired_statement: string }>(result.text, "claim repair");
  return parsed?.repaired_statement || null;
}

/**
 * Synthesizes final, publishable prose FROM the verified claim ledger -- run unconditionally
 * after every claim underneath a narrative paragraph has been through verification, not only when
 * verification happened to flag something. That distinction is the actual fix, not a nicety: a
 * "reconcile only if something changed" pass cannot catch a claim that was never decomposed into
 * the claims array in the first place -- a live run produced "a well-capitalized, strategically
 * clear organization" in enterprise_story with nothing in enterprise_story_claims establishing
 * "well-capitalized" at all, so it sailed through unverified no matter how carefully the claims
 * that DID exist were checked. Feeding the draft to the model only for tone/structure reference,
 * never as a source of facts, and building the sentence content strictly from the approved claims
 * list closes that gap regardless of whether anything was actually repaired or dropped.
 */
const PROSE_SYNTHESIS_SYSTEM_PROMPT = `You are producing the final, publishable version of a
narrative paragraph. You will be given a draft paragraph and the final, verified list of claims
this paragraph is allowed to be built from -- every claim on that list has already passed
entailment verification; some may have been corrected or removed from what the draft originally
said.

Write a new paragraph that:
- Reads naturally as flowing prose in the same voice and register as the draft -- do not write a
  list of claims stitched together.
- Asserts nothing that is not directly supported by the claims list. This includes adjectives and
  characterizations, not just factual statements: if the draft calls the enterprise
  "well-capitalized" or "strategically clear" and no claim on the list establishes that, drop the
  characterization entirely rather than keep it because it sounds natural.
- May combine, reorder, or lightly connect claims for readability, but must not introduce any new
  fact, number, ranking, causal link, or degree of certainty beyond what the claims themselves
  state.
- Stays within approximately the same length as the draft.

The draft is reference material for tone and shape only. Every substantive sentence in your output
must trace to a specific claim on the list below it.

Respond with strict JSON: { "final_text": "..." }`;

async function synthesizeProseFromClaims(
  client: Parameters<typeof callClaude>[0],
  draftText: string,
  approvedClaims: GroundedClaim[],
): Promise<string | null> {
  const userPrompt =
    `Draft paragraph (tone/structure reference only -- not a source of facts):\n${draftText}\n\n` +
    `Approved claims (the ONLY source of content for the final paragraph):\n` +
    approvedClaims.map((c, i) => `${i + 1}. ${c.statement}`).join("\n");
  // A full-paragraph synthesis against a short claims list -- low effort is proportionate. This
  // now runs on every generation, not only when verification flagged something, so it's kept cheap
  // deliberately.
  const result = await callClaude(client, PROSE_SYNTHESIS_SYSTEM_PROMPT, userPrompt, 4096, "low");
  if (!result) return null;
  const parsed = parseJsonLoose<{ final_text: string }>(result.text, "prose synthesis");
  return parsed?.final_text || null;
}

/** Claim categories verified — the surfaces carrying comparative, causal, consensus, or
 * strategic-alignment claims, the shapes most prone to overstepping their evidence.
 *
 * performance_story used to be excluded here on the theory that "purely descriptive sections
 * rarely overstate." A live run falsified that: a where_improving claim asserted a specific named
 * program ("IROPS AI Recovery Cockpit Expansion") at a specific completion percentage (23%) that
 * appear nowhere in the tenant's real data, citing a real evidence_id (sig_portfolio_033) that in
 * fact describes a completely different program at a completely different completion percentage
 * (7%). It passed the structural check (a real evidence_id, correct claim_type) because structural
 * validation checks that evidence_ids resolve and the domain count is met -- it does not check
 * that the claim's specific numbers are actually what the cited evidence says, which is exactly
 * what the entailment verifier below does for every other section. "Descriptive" is not a reason a
 * claim can't invent a number; it just means the earlier assumption that it wouldn't wasn't
 * checked against real output. */
function claimsRequiringVerification(thesis: EnterpriseThesis): Array<{ path: string; claim: GroundedClaim }> {
  const out: Array<{ path: string; claim: GroundedClaim }> = [];
  const add = (path: string, claims: MaybeGroundedClaim[]) => {
    claims.forEach((claim, i) => {
      if (claim) out.push({ path: `${path}[${i}]`, claim });
    });
  };
  add("enterprise_story_claims", thesis.enterprise_story_claims);
  add("value_creation_model.primary_value_drivers", thesis.value_creation_model.primary_value_drivers);
  add("value_creation_model.economic_dependencies", thesis.value_creation_model.economic_dependencies);
  add("strategic_bets", thesis.strategic_bets);
  add("structural_constraints", thesis.structural_constraints);
  add("operating_tensions", thesis.operating_tensions);
  add("leadership_consensus", thesis.leadership_consensus);
  add("leadership_disagreements", thesis.leadership_disagreements);
  add("performance_story.where_improving", thesis.performance_story.where_improving);
  add("performance_story.where_off_track", thesis.performance_story.where_off_track);
  add("performance_story.where_unknown", thesis.performance_story.where_unknown);
  add("technology_and_data_implications", thesis.technology_and_data_implications);
  add("material_risks", thesis.material_risks);
  add("value_realization_tensions", thesis.value_realization_tensions);
  add("what_needs_attention", thesis.what_needs_attention);
  add("things_a_new_cxo_should_know", thesis.things_a_new_cxo_should_know);
  add("questions_for_management", thesis.questions_for_management);
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Claude call plumbing
 * ---------------------------------------------------------------------------------------------- */

export type ReasoningEffort = "low" | "medium" | "high" | "xhigh" | "max";

/** Shared client shape so downstream scripts (e.g. the chapter writer) can reuse the exact same
 * call plumbing -- adaptive thinking config, diagnostics -- instead of reimplementing it. */
export type AnthropicLikeClient = {
  messages: { stream: (p: Record<string, unknown>) => { finalMessage: () => Promise<unknown> } };
} | null;

export async function callClaude(
  client: AnthropicLikeClient,
  system: string,
  userPrompt: string,
  maxTokens: number,
  effort: ReasoningEffort,
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  stopReason: string | null;
  model: string;
} | null> {
  if (!client) return null;
  // A live run against this model rejected `thinking: {type: "enabled", budget_tokens}` outright --
  // 400 "\"thinking.type.enabled\" is not supported for this model. Use \"thinking.type.adaptive\"
  // and \"output_config.effort\" to control thinking behavior." That's the model family's actual
  // contract: thinking is adaptive (not a fixed token allotment the caller reserves) and its depth
  // is steered by an effort tier instead. max_tokens is still the ceiling on thinking + text
  // combined, so it's sized generously per call rather than as a precise thinkingBudget + content
  // sum -- the two empty-response bugs this ceiling was originally chasing (ceiling too low for
  // either the response or the model's own reasoning) are still guarded by the diagnostic below.
  //
  // Uses messages.stream().finalMessage() rather than messages.create(): the Anthropic SDK's own
  // client-side guard throws synchronously, before any network call, whenever a non-streaming
  // request's max_tokens implies it could plausibly run past 10 minutes wall-clock (a fixed
  // maxTokens/128000 * 60min heuristic, independent of whether this specific call is actually that
  // slow) -- raising this call's ceiling to 28000 to fix a truncation bug crossed that threshold and
  // crashed the whole batch with an uncaught AnthropicError before either tenant finished. Streaming
  // is the SDK's own documented fix for exactly this, and it produces the identical final Message
  // shape (content/usage/stop_reason/model) once complete, so nothing below this call needed to
  // change.
  const response = (await client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort },
    system,
    messages: [{ role: "user", content: userPrompt }],
  }).finalMessage()) as {
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
  if (response.stop_reason === "max_tokens") {
    // Non-empty text can still be an incomplete, truncated response -- exactly what happened on a
    // live run of the hardened schema, where added required fields (claim_type, decomposed story
    // claims, structured value-creation claims, visual_opportunities) pushed real content past a
    // ceiling that was sized for the pre-hardening schema. Logging the thinking/output split here,
    // not only on the empty-text branch, means the next time a ceiling proves too low the actual
    // split is on record instead of requiring another live failure to find out.
    console.log(
      `    ! stop_reason=max_tokens (response may be truncated) output_tokens=${response.usage?.output_tokens ?? "unknown"} ` +
        `thinking_tokens=${response.usage?.output_tokens_details?.thinking_tokens ?? "unknown"} max_tokens=${maxTokens} effort=${effort}`,
    );
  }
  return {
    text,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    thinkingTokens: response.usage?.output_tokens_details?.thinking_tokens ?? 0,
    stopReason: response.stop_reason ?? null,
    model: response.model,
  };
}

/**
 * Every small structured-output call in this pipeline (verifier, repair, prose synthesis, chapter
 * synthesis) asks the model for "strict JSON" and occasionally gets it back wrapped in a ```json
 * code fence anyway. A live run surfaced this concretely: the chapter-writer's calls hit this on
 * 5 of 16 attempts and failed silently (bare `catch {}`, no logged reason) while the thesis-level
 * calls happened not to hit it that same run -- "didn't reproduce this time" is not evidence the
 * gap isn't real, it's evidence the sample was too small. `label` is only used for the diagnostic
 * log line so a real failure names which call site produced it instead of vanishing into a null.
 */
export function parseJsonLoose<T>(text: string, label: string): T | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.log(
      `    ! ${label}: model response was not valid JSON even after code-fence stripping -- ` +
        `${error instanceof Error ? error.message : String(error)}; raw text (first 200 chars): ` +
        JSON.stringify(cleaned.slice(0, 200)),
    );
    return null;
  }
}

export function parseThesisJson(text: string): EnterpriseThesis | null {
  return parseJsonLoose<EnterpriseThesis>(text, "thesis generation");
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

export async function buildVerifiedEnterpriseThesisFromSignalPacket(
  signalPacket: ReturnType<typeof buildEnterpriseSignalPacket>,
  client: Parameters<typeof callClaude>[0],
) {
  const usage = { input: 0, output: 0 };

  if (!client) {
    return {
      rawGeneration: null,
      publishedGeneration: null,
      structuralIssues: [],
      verificationLedger: [],
      publicationIssues: [],
      usage,
    };
  }

  const userPrompt = buildUserPrompt(signalPacket);
  // The schema's array bounds are stated explicitly in SYSTEM_PROMPT (a spine, not a report -- 3-5
  // items per array, 250-400 words for enterprise_story) and haven't grown; what changed in the
  // hardening pass is real required structure per item: claim_type on every GroundedClaim,
  // enterprise_story_claims (3-5 more claims), value_creation_model's drivers/dependencies going
  // from bare strings to full claims, and up to 6 visual_opportunities. A live run at 10000 hit the
  // ceiling on both tenants with content still incomplete; 16000 fixed that run, but a later live
  // run truncated again on both tenants (stop_reason=max_tokens, unterminated JSON string) --
  // confirmation that 16000 is marginal, not safely clear, for this schema's real output length,
  // since the model's own response length varies run to run for the same input. 28000 gives
  // meaningfully more headroom above the observed failure point while staying well under the
  // 34000 this codebase already runs in production for a comparably large structured generation
  // (src/lib/deliverables/strategic-moves-artifact-standard.ts). "medium" effort is unchanged --
  // proportionate to genuine cross-domain synthesis across a 40+ signal packet.
  const generation = await callClaude(client, SYSTEM_PROMPT, userPrompt, THESIS_OUTPUT_TOKEN_BUDGET, "medium");
  if (!generation) {
    console.log("  ! thesis generation returned no text");
    return {
      rawGeneration: null,
      publishedGeneration: null,
      structuralIssues: [],
      verificationLedger: [],
      publicationIssues: [],
      usage,
    };
  }
  usage.input += generation.inputTokens;
  usage.output += generation.outputTokens;

  const rawGeneration = parseThesisJson(generation.text);
  if (!rawGeneration) {
    console.log("  ! thesis did not parse as JSON -- first 300 chars:");
    console.log("   ", generation.text.slice(0, 300));
    return {
      rawGeneration: null,
      publishedGeneration: null,
      structuralIssues: [],
      verificationLedger: [],
      publicationIssues: [],
      usage,
    };
  }

  const structuralIssues = validateStructure(rawGeneration, signalPacket);
  console.log(`  structural check: ${structuralIssues.length} issue(s)`);
  for (const issue of structuralIssues.slice(0, 10)) console.log(`    - ${issue.path}: ${issue.reason}`);

  // raw_generation is the untouched model output -- captured before any repair or drop mutates
  // the working copy, so it survives independently of what verification decides to do with it.
  const publishedGeneration: EnterpriseThesis = JSON.parse(JSON.stringify(rawGeneration));

  const verificationLedger: Array<{ path: string; verdict: Verdict; reasoning: string; action: string; claim_statement?: string }> = [];
  for (const issue of structuralIssues) {
    dropClaim(publishedGeneration, issue.path);
    verificationLedger.push({
      path: issue.path,
      verdict: "UNSUPPORTED",
      reasoning: `structural issue: ${issue.reason}`,
      action: "dropped_structural",
    });
  }

  const toVerify = claimsRequiringVerification(publishedGeneration);
  console.log(`  verifying ${toVerify.length} high-stakes claims...`);
  for (const { path: claimPath, claim } of toVerify) {
    const result = await verifyClaim(client, claim, signalPacket);
    if (result.verdict === "UNSUPPORTED") {
      dropClaim(publishedGeneration, claimPath);
      verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "dropped", claim_statement: claim.statement });
    } else if (result.verdict === "OVERSTATED") {
      const repaired = await repairClaim(client, claim, result.reasoning, signalPacket);
      if (repaired) {
        claim.statement = repaired;
        verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "repaired", claim_statement: claim.statement });
      } else {
        // Repair itself failed (no client response, or bad JSON back) -- an overstated claim that
        // can't be corrected is worse than no claim, so this is the one place drop still applies
        // to an OVERSTATED verdict.
        dropClaim(publishedGeneration, claimPath);
        verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "dropped (repair failed)", claim_statement: claim.statement });
      }
    } else {
      // SUPPORTED and SUPPORTED_INFERENCE are both publishable as-is -- SUPPORTED_INFERENCE is
      // reasonable, appropriately-hedged synthesis, not a defect to correct.
      verificationLedger.push({ path: claimPath, verdict: result.verdict, reasoning: result.reasoning, action: "kept", claim_statement: claim.statement });
    }
  }
  const tally: Record<string, number> = {};
  for (const r of verificationLedger) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;
  console.log(`  verifier verdicts:`, tally);

  const publicationIssues: string[] = [];

  // Published prose is always synthesized FROM the final approved claims, not conditionally
  // patched only when verification happened to flag something in that specific section.
  {
    const survivingClaims = publishedGeneration.enterprise_story_claims.filter((c): c is GroundedClaim => c !== null);
    const finalText = await synthesizeProseFromClaims(client, publishedGeneration.enterprise_story, survivingClaims);
    if (finalText) {
      publishedGeneration.enterprise_story = finalText;
    } else {
      console.log("  ! enterprise_story prose synthesis failed -- publishing raw draft prose, verify manually before use");
      publicationIssues.push("enterprise_story_prose_synthesis_failed");
    }
  }

  {
    const survivingClaims = [
      ...publishedGeneration.value_creation_model.primary_value_drivers,
      ...publishedGeneration.value_creation_model.economic_dependencies,
    ].filter((c): c is GroundedClaim => c !== null);
    const finalText = await synthesizeProseFromClaims(client, publishedGeneration.value_creation_model.summary, survivingClaims);
    if (finalText) {
      publishedGeneration.value_creation_model.summary = finalText;
    } else {
      console.log("  ! value_creation_model.summary prose synthesis failed -- publishing raw draft prose, verify manually before use");
      publicationIssues.push("value_creation_model_summary_prose_synthesis_failed");
    }
  }

  return { rawGeneration, publishedGeneration, structuralIssues, verificationLedger, publicationIssues, usage };
}

export async function buildTenant(tenantKey: string, client: Parameters<typeof callClaude>[0]) {
  const report = await buildCanonicalTenantDataReport({ repoRoot: process.cwd(), tenantKeys: [tenantKey] });
  const records: CanonicalIngestionRecord[] = report.canonicalRecords.filter((r) => r.tenantKey === tenantKey);
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

  // Read the declared relationship graph directly, the same precedented pattern as the crosswalk
  // file above -- report.relationshipCandidates does not surface this file's own from_object_type
  // column (it tags every row's sourceObjectType as the row's own canonical type,
  // "relationship_source_row", not the entity the row is actually describing), so it cannot
  // answer "which systems does this system integrate with." The raw file can.
  const relationshipsPath = path.join(process.cwd(), `datasets/tenant-inputs/active/${tenantKey}/current/12_relationships.csv`);
  let relationshipRows: RelationshipRow[] = [];
  if (fs.existsSync(relationshipsPath)) {
    const parsed = Papa.parse(fs.readFileSync(relationshipsPath, "utf8"), { header: true, skipEmptyLines: true });
    relationshipRows = (parsed.data as any[]).map((r) => ({
      relationshipType: r.relationship_type,
      sourceObjectType: r.from_object_type,
      sourceObjectName: r.from_object_name,
      targetObjectType: r.to_object_type,
      targetObjectName: r.to_object_name,
      sourcePath: relationshipsPath,
    }));
  }
  const intakeSourceSummaries = buildIntakeSourceInventorySummaries(process.cwd(), tenantKey);
  const dc = buildDecisionContext(records, relationshipRows, intakeSourceSummaries);
  const quality = buildContextQualityManifest(records, crosswalkRows, GOLDEN_EVIDENCE_CONTRACTS[tenantKey] ?? []);
  const signalPacket = buildEnterpriseSignalPacket(dc, quality);

  console.log(`  ${records.length.toLocaleString()} records → ${signalPacket.signals.length} material signals`);

  if (!client) {
    return {
      signalPacket, rawGeneration: null, publishedGeneration: null,
      structuralIssues: [], verificationLedger: [], usage: { input: 0, output: 0 }, canonicalRecords: records,
    };
  }

  const thesisResult = await buildVerifiedEnterpriseThesisFromSignalPacket(signalPacket, client);
  return { signalPacket, ...thesisResult, canonicalRecords: records };
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
    // One tenant's uncaught error must not cost a sibling tenant its own already-completed output
    // -- a live run of the downstream chapter writer (which calls buildTenant the same way) hit
    // exactly this: an SDK-level error on the first tenant crashed the whole process before the
    // second tenant was even attempted. This only wraps the :plan-relevant work (build + write +
    // stdout marker); the :apply DB-write block below intentionally still fails loudly on error --
    // a partial/failed write is not something to silently skip past.
    let generationResult: Awaited<ReturnType<typeof buildTenant>>;
    try {
      generationResult = await buildTenant(tenantKey, client);
    } catch (error) {
      console.log(`  ! ${tenantKey} failed with an uncaught error -- continuing to the next tenant:`);
      console.log(`   `, error instanceof Error ? error.stack ?? error.message : error);
      continue;
    }
    const { signalPacket, rawGeneration, publishedGeneration, structuralIssues, verificationLedger, usage } = generationResult;

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
          THESIS_PROMPT_VERSION,
          "build-enterprise-thesis",
          CLAUDE_MODEL,
          CLAUDE_MODEL,
          THESIS_PROMPT_VERSION,
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
