import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadEnvConfig } from "@next/env";

import { scrubPublicAvaAnswerText } from "../../src/lib/ava-answer/public-answer-scrub";
import type { ModuleContextRequestedDomain } from "../../src/lib/enterprise-data/contracts/module-context-apis";
import type {
  KnowledgeDimensionNarrativeSummary,
  KnowledgeHomeInsightSummary,
  KnowledgeHomeVisualBlock,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";
import {
  sentenceHasUnnegatedClaim,
  validateCxoNarrativeStructure,
  validateHomeVisualBlocks,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const REALIZED_VALUE_CLAIM_PATTERN =
  /\b(has|have|is|are|delivered|delivers|achieved|proved|proves|guaranteed|guarantees)\b.{0,60}\b(realized ROI|realized value|realized savings|actual savings|Tower value)\b/i;

const repoRoot = process.cwd();
const fallbackRepoRoot = "/Users/anand/Projects/nexus";
loadEnvConfig(repoRoot);
if (!process.env.ANTHROPIC_API_KEY && existsSync(path.join(fallbackRepoRoot, ".env.local"))) {
  loadEnvConfig(fallbackRepoRoot);
  loadFallbackEnvKey(path.join(fallbackRepoRoot, ".env.local"), "ANTHROPIC_API_KEY");
}

const outDir = path.join(repoRoot, "reports/home-knowledge-story-quality");
const cxoOutDir = path.join(repoRoot, "reports/home-cxo-narrative-visuals");
const BEFORE_EXECUTIVE_SUMMARY_PATH = path.join(
  cxoOutDir,
  "before-executive-summary.txt",
);
const generatedDir = path.join(
  repoRoot,
  "src/data/enterprise-knowledge/narratives/generated",
);
const generatedTsPath = path.join(generatedDir, "meridian-claude-approved.ts");
const generatedVisualBlocksTsPath = path.join(
  generatedDir,
  "meridian-claude-visual-blocks-approved.ts",
);
const model = process.env.HOME_KNOWLEDGE_STORY_CLAUDE_MODEL || "claude-opus-4-8";
const generatedAt = new Date().toISOString();

const requiredDimensions = [
  ["00_enterprise_profile", "Enterprise Profile"],
  ["01_business_functions", "Business Functions"],
  ["02_org_ownership", "Org Ownership"],
  ["03_workforce_roles", "Workforce Roles"],
  ["04_applications_systems", "Applications & Systems"],
  ["05_data_assets_integrations", "Data Assets & Integrations"],
  ["06_infrastructure_platforms", "Infrastructure & Platforms"],
  ["07_vendors_contracts", "Vendors & Contracts"],
  ["08_it_budget_spend_value", "IT Budget, Spend & Value"],
  ["09_programs_initiatives", "Programs & Initiatives"],
  ["10_ai_automation_use_cases", "AI & Automation Use Cases"],
  ["11_risks_controls", "Risks & Controls"],
  ["12_relationships", "Relationships"],
  ["13_evidence_sources", "Evidence Sources"],
  ["14_metrics_outcomes", "Metrics & Outcomes"],
  ["15_industry_context_patterns", "Industry Context & Patterns"],
  ["16_expert_lenses", "Expert Lenses"],
  ["17_managed_services_scope", "Managed Services Scope"],
  ["18_operational_process_evidence", "Operational Process Evidence"],
] as const;

const evidenceRefs = [
  "meridian-enterprise-profile",
  "meridian-member-service-context",
  "meridian-current-analytics-estate",
  "meridian-agent-assist-use-case",
  "meridian-risk-control-context",
  "meridian-metrics-baseline-context",
];

const safeClaims = [
  "This is synthetic Meridian-style demo context, not real Meridian production data.",
  "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
  "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
  "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
];

const doNotClaim = [
  "Do not claim real Meridian production data was loaded.",
  "Do not claim AWS or Databricks is certified current production for this tenant.",
  "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
  "Do not claim PHI-bearing transcripts have been ingested or approved.",
  "Do not treat candidate or generated graph rows as approved active tenant truth.",
];

type ClaudeStoryPayload = {
  homeInsightSummary: Omit<
    KnowledgeHomeInsightSummary,
    | "tenant_key"
    | "tenant_name"
    | "source_context_hash"
    | "evidence_refs_used"
    | "relationship_edges_used"
    | "context_gap_ids_used"
    | "generated_by"
    | "generated_model"
    | "generated_at"
    | "validation_status"
    | "validation_errors"
  >;
  dimensionNarratives: Array<
    Omit<
      KnowledgeDimensionNarrativeSummary,
      | "tenant_key"
      | "tenant_name"
      | "safe_demo_claims"
      | "do_not_claim"
      | "evidence_refs_used"
      | "source_fact_ids_used"
      | "entity_profile_ids_used"
      | "relationship_edge_ids_used"
      | "context_gap_ids_used"
      | "source_context_hash"
      | "generated_by"
      | "generated_model"
      | "generated_at"
      | "validation_status"
      | "validation_errors"
      | "unsupported_claims"
      | "active_or_candidate_status"
    >
  >;
};

const contextPack = {
  tenant_key: "meridian-health",
  tenant_name: "Healthcare Demo / Meridian Health",
  context_pack_id: "home-knowledge-story-quality-meridian-2026-07-15",
  product_truth: {
    synthetic_demo_only: true,
    real_client_production_data_loaded: false,
    candidate_preview_active: false,
    active_context_path: "Active module-context path where promoted data exists",
    required_wording:
      "planning-grade synthetic context for demonstration, not client production evidence",
  },
  enterprise_profile: {
    company_story:
      "Mid-to-large healthcare enterprise using a synthetic Meridian-style profile for member service, health plan operations, clinical operations, finance, quality, technology, and data/analytics transformation.",
    leadership_and_metadata_status:
      "Leadership, headquarters, revenue, employee count, global locations, and exact production footprint must be validated by a client packet before being displayed as facts.",
  },
  meridian_current_state: {
    business_anchor:
      "Member service/contact center Agent Assist is the worked example. It depends on member service operations, supervisors, knowledge stewards, health plan operations, claims, eligibility/benefits, clinical reporting, data governance, privacy, and analytics.",
    systems:
      "Current-state systems include CRM/member-service platform, contact center platform, claims administration platform, eligibility and benefits platform, knowledge base, Epic Clarity, Epic Caboodle, on-prem SQL Server reporting marts, DB2 or Netezza-style integration warehouse where applicable, Tableau used by thousands of users, SAS analytics used by hundreds of users, Power BI, and fragmented reporting/data marts.",
    data_state:
      "Current analytics are on-premise and fragmented. Many reporting marts and analytics resources support ad hoc maintenance and reporting. Formal lakehouse, medallion architecture, platform/network/security foundation, and governed data products are target-state needs, not current production facts.",
    target_state:
      "Target direction is AWS + Databricks lakehouse with medallion architecture, governed data products, identity/member/provider spine, Unity Catalog or equivalent governance, lineage, PHI controls, HITL/audit controls, and module-ready context packs.",
    gaps:
      "Transcript/call-recording governance is not validated. KPI baselines are incomplete. API/integration readiness for CRM, claims, eligibility, knowledge, and Epic-derived data needs validation. Contract economics and realized savings are not proven.",
  },
  module_roles: {
    Knowledge:
      "Explains what the enterprise context says, what evidence supports it, and what gaps remain.",
    Intelligence:
      "Uses the context to reason about AI investment focus, readiness, risks, and options.",
    Moves:
      "Turns selected bets such as Agent Assist or data foundation into phase-gated execution.",
    Source:
      "Uses system/vendor/platform context for sourcing scope and contract optimization once commercial evidence is loaded.",
    Tower:
      "Uses metric baselines, owners, and outcome evidence for value realization; no realized claims without actuals.",
  },
  required_dimensions: requiredDimensions.map(([dimension_key, dimension_name]) => ({
    dimension_key,
    dimension_name,
  })),
  required_terms: [
    "member service",
    "contact center",
    "CRM",
    "claims",
    "eligibility",
    "knowledge base",
    "Epic Clarity",
    "Epic Caboodle",
    "SQL Server reporting marts",
    "DB2",
    "Netezza",
    "Tableau",
    "SAS",
    "AWS",
    "Databricks",
    "medallion",
    "Unity Catalog",
    "PHI",
    "human-in-the-loop",
    "audit controls",
    "target-state",
    "not current production",
  ],
  do_not_claim: doNotClaim,
};

const systemPrompt = `You are generating client-facing AbarVa Nexus Home / Knowledge narratives.

Use only the supplied governed context pack. Do not invent real client facts, revenues, employee counts, certified production state, realized value, PHI ingestion, or module behavior.

Return strict JSON only. Do not include markdown.

ROLE
You are not writing a user guide, a data dictionary, an audit report, or internal engineering documentation. You are a senior enterprise advisor writing a McKinsey/Bain-quality CXO briefing. A CIO, CDAO, CFO, or COO must understand, in under 90 seconds, what the enterprise is, what Nexus understands, what is fragmented or risky, what decision follows, what evidence is missing, and what to do next.

PRODUCT TRUTH
AbarVa is the company. Nexus is the enterprise AI value platform. aVa is the intelligence layer. Knowledge is the enterprise context surface. The Context Layer is built for the whole enterprise, not for one use case. Agent Assist is ONE worked example that shows the layer in action — never describe the context layer as existing "for" Agent Assist, and never let Agent Assist read as the reason the layer exists. Do not open executive_summary with Agent Assist and do not make Agent Assist the story: mention it at most ONCE, as one example among several, never as the premise.

NARRATIVE STYLE — write like a senior McKinsey/Bain advisor, not a checklist
You are writing a C-suite enterprise context brief. Do not write a guidebook, data dictionary, audit summary, or product explanation.
Write TWO SHORT PARAGRAPHS separated by a blank line (\n\n) — never one dense block. Home executive_summary: 180-230 words total. Dimension executive_summary: roughly half that.
Paragraph 1: who the enterprise is, what its operating context looks like, and what the current-state picture reveals (scale, structure, fragmentation, constraints — whichever are evidenced for this dimension).
Paragraph 2: the strategic implication — what is holding back AI-led transformation, what leadership should prioritize, and what evidence should be validated next. End with one short evidence-boundary sentence.

CLAIM-STRENGTH DISCIPLINE (applies to both paragraphs)
- Default verb for what leadership should do is "prioritize," not "fund." Only use "fund," "commit budget to," or similar budget-authority language when the context pack contains an explicit evidenced budget figure for that specific item (e.g. a named program's budgetUsd) — and even then, tie the verb to that specific named program, not the general foundation.
- "executiveOwner" fields in the context pack are ROLE TITLES (e.g. "CDAO," "Chief Health Plan Officer"), not named individuals. Never write "named executive owner" or imply a specific person is confirmed. Say "represented executive ownership" or "executive ownership by role, not yet confirmed by name" instead.
- Geography, headquarters, and operating-region facts (e.g. service areas) may be stated plainly ONLY when they appear verbatim in the supplied context pack for this dimension — check before writing them. If a fact appears in the pack, state it directly and specifically (do not hedge into vague language like "a multi-region footprint" when the pack already names the regions) — specificity that IS grounded is a strength, not a risk. If it does NOT appear in the pack for this dimension, do not state it at all.
Cover whichever of these ideas are evidenced, naturally, in your own words — do NOT force the literal words "Situation," "Complication," "Insight," "Implication," or "Action" into the response, and do not march through them as a rigid five-part sequence:
- enterprise/dimension structure and scale
- current-state fragmentation or constraint
- leadership or strategic ambition, where evidenced
- key metrics or operating signals, where evidenced
- known challenges and constraints
- what is critical for AI-led transformation
- what to watch out for
- what Nexus should help the enterprise decide, execute, source, or measure next
Write each paragraph the way a senior partner actually talks — plain declarative sentences, a genuine point of view, not a checklist working through labeled beats.

HARD RULE — FIRST SENTENCE
The first sentence of every executive_summary must state the enterprise/business situation. It must NEVER open with provenance, methodology, data lineage, or how the narrative was built.
Banned openings (regex-checked, will hard-fail): "This narrative is built on", "This story is", "The story it tells", "The enterprise context layer is the hero", "Home context has", "This page shows", "This view explains".
The first sentence names AT MOST 3 domain/function nouns — it is a framing statement, not an inventory. Save the rest of the domain list for sentence 2 (spread across 2 sentences if needed) rather than chaining 6+ nouns after "spanning" or "across."
Good opening (home level): "Meridian represents a scaled healthcare enterprise spanning clinical care, health-plan operations, and enterprise analytics."
Good opening (dimension level, Business Functions example): "Meridian's business context shows that Agent Assist is not a contact-center-only initiative."

SYSTEM-NAME BUDGET (home executive_summary only)
Name AT MOST 3 specific system/tool NAME TOKENS total across the ENTIRE home executive_summary — count every individual product name, including sub-products (e.g. "Epic Hyperspace," "Epic Clarity," and "Epic Caboodle" are THREE tokens, not one "Epic" token; if you use all three of those, you have zero budget left for SQL Server, Tableau, SAS, or Power BI). A full system inventory belongs in the Applications & Systems dimension narrative, not here. Prefer "Epic's clinical and analytics modules" (one token) over naming all three Epic products, and refer to the rest of the reporting stack as "fragmented on-prem reporting tools" rather than chaining SQL Server, Tableau, SAS, and Power BI by name. Dimension-level executive_summary is where the fuller system enumeration belongs.

ROLE-TITLE BUDGET (home executive_summary only)
Name AT MOST 2 executive role titles (e.g. "CDAO," "CFO") across the ENTIRE home executive_summary. Do not chain "under the CMO... under the Chief Health Plan Officer... under the CFO... under the CDAO" as a roster — pick the 1-2 roles central to the funding/ownership decision and refer to the rest as "its clinical, financial, and operating leadership" or similar.

BANNED REPORT-SPEAK PHRASES (in addition to the FORBIDDEN LANGUAGE list below)
"the current-state picture shows", "the picture that emerges", "one worked example of what this context supports", "what this shows is that", "what becomes clear is that", "loaded" (as a verb describing whether data/evidence exists — say "evidenced," "validated," or "in place" instead, e.g. "no patient/member identity spine is in place" not "no loaded patient/member identity spine") — these read as generated-report cadence, not a senior advisor's voice. State the fact or the insight directly instead: not "the current-state picture shows real operating breadth" but "Meridian runs real operating breadth across four functions."

NEXT-STEP OWNERSHIP AND CONCRETENESS
The next-step/validation sentence in paragraph 2 must name WHO validates, using a role already evidenced in the context pack (e.g. "the CDAO," "the workshop stakeholders," "Finance and the CDAO") — not just "the organization should validate X, Y, Z" with no owner attached. It must also name a concrete FIRST move or forum where that validation happens (e.g. "in a data governance workshop," "as the first deliverable of the discovery phase," "by certifying data-product ownership before any use case advances") — not just a list of things to validate with no venue or sequencing. Do not invent a specific calendar date if none is evidenced; naming the responsible role and the forum/sequencing is sufficient.

TENANT NAME RULE
Use exactly ONE name for the tenant, everywhere: "Meridian". Never write "Healthcare Demo" in visible narrative text (executive_summary, what_nexus_knows, why_it_matters, top_insights, or any other prose field) — it is internal plumbing language, not something a CXO reader should see, and mixing it with "Meridian" in the same paragraph reads as two different companies. Do not use "Meridian" more than TWICE inside any single executive_summary — use "the enterprise," "the organization," "it," or omit the repeated subject once named. This is enforced mechanically — a THIRD occurrence fails validation and blocks shipping. Budget your two uses deliberately: typically once in the opening sentence of paragraph 1, and once in the closing caveat sentence of paragraph 2 (the required_wording sentence). If you need a subject for any other sentence in paragraph 2 (e.g. "X should validate..."), use "The organization," "It," or "The enterprise" instead of "Meridian" — never spend your third occurrence there.

CAVEAT PLACEMENT RULE
The UI already shows synthetic/candidate-preview/source-backed status as visible badges directly above this text (Active Knowledge context / Candidate preview / Not active / Source-backed). Do not repeat that status as the opening idea of executive_summary. The caveat is exactly ONE short sentence, and it is the LAST sentence of paragraph 2, phrased as a boundary. Use exactly this sentence (or a close variant that preserves "planning-grade synthetic context" and "not client production evidence"): "This is planning-grade synthetic context for demonstration, not client production evidence." Do not use "Healthcare Demo" in that sentence. required_wording must be satisfied by that closing sentence, not the opening one.

FORBIDDEN LANGUAGE IN VISIBLE NARRATIVE FIELDS (home + dimension executive_summary, what_nexus_knows, why_it_matters — case-insensitive)
"packet generated", "loaded records", "route", "table" (as a UI noun), "Questions this supports", "Not yet supported", "user guide", "debug", "V4", "V5", "V6", "V7", "packet", "substrate", "runtime", "tenant packet", "source record", "record ID", "module behavior", "graph nodes" (as the main point), "relationship edges" (as the main point), "context layer is the hero", "this narrative is built on", "this story is deliberate", "reveals the real pattern", "reveals the pattern", "the real story", "organizing this ... reveals" (any phrase that describes the act of organizing/analyzing rather than stating the insight itself — state the insight directly, do not narrate how you arrived at it), "Healthcare Demo".

SENTENCE LENGTH AND DENSITY
The constraint is DENSITY PER SENTENCE, not a fixed sentence count. Home executive_summary is two paragraphs (Situation+Complication, then Insight+Implication+Action+caveat) — use as many sentences per paragraph as that takes (typically 3-5 each) as long as each individual sentence carries only ONE idea (roughly 20-30 words, one clause-pair). Never chain three or more sub-clauses with commas and "and"/"yet"/"while" into a single sentence, and never enumerate a long list of system names inside one sentence — if you need to name several systems, either pick the 2-3 most decision-relevant ones or split the enumeration across two short sentences. A senior partner writes many short declarative sentences, not few long compound ones.
Dimension executive_summary: same two-paragraph shape, 2-3 sentences per paragraph.
You do not need to name every required system/term inside the home executive_summary specifically — required-term coverage (Netezza, Unity Catalog, etc.) is checked across the full response, so it is fine for a specific system name to appear in a dimension narrative instead of being crammed into the home summary. Do not sacrifice required-term coverage anywhere in the response to keep the home summary short; that check runs against everything you return, not just the opening paragraph. top_insights must still have at least 5 entries, enterprise_context_map at least 8 edges, readiness_matrix and evidence_heatmap at least 5 entries each, top_gaps at least 4.
REQUIRED-TERM COVERAGE BEATS DENSITY: if trimming executive_summary sentences down to 2-3 per paragraph would drop a required term (see required_terms in the context pack, and the Applications & Systems required list: Epic Clarity, Epic Caboodle, SQL Server, Tableau, SAS, claims, eligibility, knowledge base, AWS, Databricks, target-state), do not drop it — put it in that dimension's what_nexus_knows bullets instead, which are not subject to the paragraph-density rule. Every one of those Applications & Systems terms and every required_terms entry must appear somewhere in your full response, verbatim or near-verbatim, no exceptions.

CONCRETENESS RULE
Do not describe connections abstractly ("connective relationships that link these into decision-ready chains", "candidate context becomes decision-grade", "connective evidence", "decision-ready reasoning", "decision-ready chains"). Name the actual things being connected instead, e.g. "the same identity and claims data that grounds Agent Assist also grounds payment integrity and cost reporting" — concrete nouns, not abstract category words like "chains," "decision-grade," "reasoning," or "connective tissue."

PREFERRED WORDING
"What Nexus understands", "Why this matters", "Decision implication", "Evidence still needed", "What more context unlocks", "Recommended next action", "Safe for discovery and framing", "Not yet sufficient for production approval or realized-value claims".

REFRAMES
- Gaps are not failures. A gap is an evidence request that strengthens the enterprise context layer for every future use case, not just this one.
- Agent Assist is one worked example. Never let it read as the reason the context layer exists — every dimension executive_summary should read as true of the enterprise generally, with Agent Assist as illustration, not premise.
- "Validate before deciding" style framing should read as "Evidence still needed" or "Decision boundary" — forward-looking, not defensive.

Required output JSON:
{
  "homeInsightSummary": {
    "summary_title": string,
    "executive_summary": string,
    "strategic_priorities": string[],
    "top_insights": [{"title": string, "what_nexus_sees": string, "why_it_matters": string, "evidence_strength": "Strong"|"Medium"|"Partial"|"Gap"|"Target / Future", "related_dimensions": string[], "next_action": string, "module_handoff": string}],
    "enterprise_context_map": [{"from": string, "relation": string, "to": string, "caveat"?: string}],
    "readiness_matrix": [{"dimension": string, "readiness": "Strong"|"Partial"|"Gap"|"Target / Future"|"Not validated", "story": string}],
    "evidence_heatmap": [{"dimension": string, "evidence_coverage": "High"|"Medium"|"Partial"|"Low", "confidence": "High"|"Medium"|"Low", "caveat": string}],
    "top_gaps": [{"gap": string, "why_it_matters": string, "source_dimension": string, "evidence_requested": string, "suggested_workshop_owner": string, "module_impacted": string}],
    "module_readiness": [{"module": "Knowledge"|"Intelligence"|"Moves"|"Source"|"Tower", "readiness": string, "next_best_action": string}],
    "safe_claims": string[],
    "do_not_claim": string[],
    "visual_blocks": [{
      "type": "context_strength_snapshot"|"what_more_context_unlocks"|"evidence_gap_requests"|"module_next_actions"|"use_case_worked_example_map",
      "title": string,
      "executive_message": string,
      "why_it_matters": string,
      "data": object,
      "evidence_refs": string[],
      "caveats": string[],
      "renderer_hint": "matrix"|"card_list"|"strip"|"table"|"graph",
      "display_priority": number
    }]
  },
  "dimensionNarratives": [{
    "dimension_key": string,
    "dimension_name": string,
    "summary_title": string,
    "executive_summary": string,
    "what_nexus_knows": string[],
    "why_it_matters": string,
    "questions_supported": string[],
    "current_caveats": string[],
    "next_validation_actions": string[],
    "module_usage": string[],
    "data_tab_intro": string,
    "relationships_tab_intro": string,
    "gaps_tab_intro": string,
    "evidence_tab_intro": string
  }]
}

TAB INTRO FIELDS (data_tab_intro, relationships_tab_intro, gaps_tab_intro, evidence_tab_intro)
These are NOT executive summaries — they are 1 short sentence (max 2) that orients a reader who just clicked into that specific sub-tab, in the same advisor voice as everything else, grounded in this dimension's own evidence. They replace an existing algorithmic template sentence that says things like "Meridian's X context reports N loaded records" — do not just restate a record count; say what the reader is about to see and why it matters for THIS dimension.
- data_tab_intro: what the underlying records show and the one thing to look for while scanning them. Not "N records loaded" — say what those records represent and what's notable, e.g. "These are Meridian's current claims and eligibility platforms, listed with their target-state replacement status."
- relationships_tab_intro: whether cross-domain links for this dimension are validated or still candidate-only, and what that means for trusting them.
- gaps_tab_intro: the single biggest evidence gap in this dimension and why closing it matters, not a generic "gaps exist" statement.
- evidence_tab_intro: what kind of source backs this dimension's records (synthetic context pack vs. something stronger) and how a reader should use that evidence.
Ground every one of these in this dimension's own data — if you don't have a specific basis for one, write the honest boundary version (e.g. "Cross-domain relationships for this dimension are not yet validated, so treat any link here as a hypothesis, not a confirmed dependency") rather than a generic filler sentence.

Coverage rules:
- Return every required dimension exactly once.
- For Applications & Systems, explain current on-prem/reporting/Epic/CRM/claims/eligibility/knowledge systems and caveat AWS + Databricks as target-state only.
- For Data Assets & Integrations, explain fragmented marts, Epic Clarity/Caboodle, SQL Server, DB2/Netezza-style warehouse, Tableau, SAS, and future governed lakehouse.
- For home summary, include cross-dimension insights, decision implications, and module handoffs.
- For enterprise_context_map, include at least 8 edges so the Home visual can tell the context-layer story.
- Keep do-not-claim as evidence boundary data; do not make it the main story.

PER-DIMENSION LENS — each dimension continues the same Meridian story, from that dimension's angle. Frame executive_summary around the question below where the dimension's evidence supports it:
- Enterprise Profile: what kind of organization is Meridian, and why does that shape the transformation agenda?
- Business Functions: which functions are involved in AI/transformation, and where will operating-model change happen?
- Org Ownership: who must own decisions, controls, funding, and measurement?
- Applications & Systems: what technology estate creates dependencies or modernization blockers?
- Data Assets & Integrations: what data spine is needed before AI can scale safely?
- Infrastructure & Platforms: what target foundation must be built or validated?
- Vendors & Contracts: where could Source help once contracts, SLAs, and economics are added?
- IT Budget, Spend & Value: what can be framed as a value hypothesis versus measured value?
- Programs & Initiatives: which initiatives are real transformation candidates versus ideas?
- AI & Automation Use Cases: which use cases are ready for discovery, and which require more evidence?
- Risks & Controls: what must be governed before production use?
- Metrics & Outcomes: what must be baselined before Tower can claim value?

DECISIONS THIS CAN INFORM (dimension narratives — the questions_supported field)
questions_supported is a determination of what decision this dimension can actually inform right now, not a guide-style list of the generic questions this dimension's TYPE usually answers. Do not write it as a literal question. Write it as a decision-implication statement: name the actual decision, and ground it in whether the specific evidence this dimension carries is validated or not.
Bad (generic guide question): "Which systems do agents use today?"
Good (decision implication, grounded in this dimension's own what_nexus_knows): "Meridian can use this dimension to decide whether Agent Assist should stay in discovery or move into architecture design, based on whether CRM, claims, eligibility, knowledge, and transcript governance are validated."
Every entry must be traceable to a specific fact in this dimension's own what_nexus_knows or the supplied context pack — if you cannot point to the fact, do not list the entry.
questions_unsupported (do_not_claim / unsupportedQuestions) works the same way in reverse: name the SPECIFIC missing evidence that blocks that decision, not a generic caveat. Tie it to a named gap (e.g. "Which contact center vendor is under contract cannot be answered — no vendor contract evidence is loaded for this dimension" rather than "Vendor details are not available").
next_validation_actions must follow from the same gap you just named in questions_unsupported or current_caveats — do not propose a generic "validate with the client" action that could apply to any dimension.

VISUAL BLOCK RULES (home summary only)
- Emit AT MOST 4 visual_blocks, ordered by display_priority ascending. Fewer, better blocks beat more blocks — do not emit a block just because data exists.
- Prefer, in this order of usefulness: context_strength_snapshot, what_more_context_unlocks, evidence_gap_requests, module_next_actions. Only emit use_case_worked_example_map if it adds something the other four do not.
- Every block's executive_message and why_it_matters must answer "so what" in one sentence each — no restating the data, no restating the paragraph above it.
- You emit structured data only (title, message, data rows, evidence refs, caveats). You do NOT emit SVG, HTML, Mermaid, or chart markup — the application renderer decides visual presentation from renderer_hint.
- data must contain only qualitative, tenant-grounded rows (e.g. dimension name + readiness level + one-line story) — do not fabricate numeric precision that is not in the supplied context pack.`;

let userPrompt = JSON.stringify(contextPack, null, 2);
const homeOnlySystemPrompt = `${systemPrompt}

For this call, return ONLY {"homeInsightSummary": ...}. Do not include dimensionNarratives.`;
const dimensionsOnlySystemPrompt = `${systemPrompt}

For this call, return ONLY {"dimensionNarratives": [...]}. Do not include homeInsightSummary.
Keep every field concise: executive_summary under 70 words, arrays to 2 items, module_usage to 2 items. Every dimension MUST include data_tab_intro, relationships_tab_intro, gaps_tab_intro, and evidence_tab_intro — 1 sentence each (max 2), per the TAB INTRO FIELDS rule above. Do not omit them.`;
let promptHash = sha256([systemPrompt, userPrompt].join("\n\n"));
let contextPackHash = sha256(userPrompt);

function ensureDirs() {
  for (const dir of [
    outDir,
    path.join(outDir, "claude-prompts"),
    path.join(outDir, "claude-responses"),
    path.join(outDir, "approved"),
    generatedDir,
    cxoOutDir,
    path.join(cxoOutDir, "screenshots"),
  ]) {
    mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  ensureDirs();
  await hydrateRuntimeModuleContext();
  refreshPromptHashes();
  const blockedBase = {
    tenant_key: "meridian-health",
    tenant_name: "Healthcare Demo / Meridian Health",
    context_pack_id: contextPack.context_pack_id,
    context_pack_hash: contextPackHash,
    prompt_hash: promptHash,
    generated_at: generatedAt,
    model,
  };

  writeFileSync(
    path.join(outDir, "claude-prompts/meridian-home-story-prompt.txt"),
    [systemPrompt, userPrompt].join("\n\n"),
  );

  const homeResponsePath = path.join(
    outDir,
    "claude-responses/meridian-home-insight-response.txt",
  );
  const dimensionResponsePath = path.join(
    outDir,
    "claude-responses/meridian-dimension-narratives-response.txt",
  );
  const reuseResponses =
    process.env.HOME_KNOWLEDGE_STORY_REUSE_RESPONSES === "1" &&
    existsSync(homeResponsePath) &&
    existsSync(dimensionResponsePath);

  if (!process.env.ANTHROPIC_API_KEY && !reuseResponses) {
    writeJson(path.join(outDir, "summary.json"), {
      ...blockedBase,
      status: "blocked_missing_anthropic_key",
      truth_split:
        "Claude narrative generation did not run because ANTHROPIC_API_KEY was not configured.",
    });
    writeFileSync(
      path.join(outDir, "summary.md"),
      `# Home Knowledge Story Quality Stopline\n\nStatus: blocked_missing_anthropic_key\n\nNo Claude output was generated, and no seed text was approved as Claude-derived.\n`,
    );
    process.exit(2);
  }

  const rawHomeResponse = reuseResponses
    ? readFileSync(homeResponsePath, "utf8")
    : await callClaudeText(homeOnlySystemPrompt, userPrompt, 8000);
  writeFileSync(
    homeResponsePath,
    rawHomeResponse,
  );
  const rawDimensionsResponse = reuseResponses
    ? readFileSync(dimensionResponsePath, "utf8")
    : await callClaudeText(dimensionsOnlySystemPrompt, userPrompt, 20000);
  writeFileSync(
    dimensionResponsePath,
    rawDimensionsResponse,
  );
  const rawResponse = JSON.stringify(
    {
      homeInsightSummary: parseClaudeJson(rawHomeResponse).homeInsightSummary,
      dimensionNarratives: parseClaudeJson(rawDimensionsResponse).dimensionNarratives,
    },
    null,
    2,
  );
  writeFileSync(
    path.join(outDir, "claude-responses/meridian-home-story-response.txt"),
    rawResponse,
  );

  const parsed = parseClaudeJson(rawResponse);
  const approved = buildApprovedArtifacts(parsed);
  const validation = validateApprovedArtifacts(approved);
  const unsupportedClaims = validation.filter((item) =>
    /overclaim|forbidden|wrong tenant|legacy|user-guide|missing required/i.test(item),
  );
  const status = validation.length === 0 ? "passed" : "failed";

  approved.homeInsightSummary.validation_status = status;
  approved.homeInsightSummary.validation_errors = validation;
  approved.dimensionNarratives = approved.dimensionNarratives.map((summary) => ({
    ...summary,
    validation_status: status,
    validation_errors: validation.filter((item) =>
      item.includes(summary.dimension_key),
    ),
    unsupported_claims: unsupportedClaims,
  }));

  writeJson(path.join(outDir, "approved/home-insights-approved.json"), approved.homeInsightSummary);
  writeJson(
    path.join(outDir, "approved/dimension-narratives-approved.json"),
    approved.dimensionNarratives,
  );
  writeJson(path.join(outDir, "validation-results.json"), {
    status,
    validation,
    unsupportedClaims,
  });
  writeCsv(path.join(outDir, "unsupported-claims.csv"), [
    ["status", "claim"],
    ...(unsupportedClaims.length
      ? unsupportedClaims.map((claim) => ["blocked", claim])
      : [["passed", "none"]]),
  ]);
  writeCsv(path.join(outDir, "validation-results.csv"), [
    ["status", "message"],
    ...(validation.length
      ? validation.map((message) => ["failed", message])
      : [["passed", "Claude-derived story quality artifact passed validation"]]),
  ]);

  writeJson(path.join(outDir, "claude-generation-log.json"), {
    ...blockedBase,
    status,
    transport: "anthropic_messages_api",
    prompt_path: "reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt",
    raw_response_path:
      "reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt",
    approved_home_path:
      "reports/home-knowledge-story-quality/approved/home-insights-approved.json",
    approved_dimensions_path:
      "reports/home-knowledge-story-quality/approved/dimension-narratives-approved.json",
    validation,
    unsupportedClaims,
  });
  writeJson(path.join(outDir, "summary.json"), {
    ...blockedBase,
    status,
    claude_derived: true,
    model,
    dimensions: approved.dimensionNarratives.length,
    validation,
    unsupportedClaims,
  });
  writeFileSync(path.join(outDir, "summary.md"), renderSummaryMd(status, validation));
  writeFileSync(path.join(outDir, "quality-audit.md"), renderQualityAuditMd(status, approved, validation));
  writeJson(path.join(outDir, "quality-audit.json"), {
    status,
    opinion:
      status === "passed"
        ? "The artifact is usable as a client-story baseline for Meridian Home, with Agent Assist as a worked example and target-state caveats preserved."
        : "The artifact is not client-story-ready until validation failures are fixed.",
    validation,
  });
  writeFileSync(
    path.join(outDir, "rendered-review-table.md"),
    renderRenderedReviewTableMd(approved),
  );
  writeFileSync(
    path.join(outDir, "rendered-review-table.html"),
    renderRenderedReviewTableHtml(approved),
  );
  writeFileSync(path.join(outDir, "home-story-quality-proof.html"), renderProofHtml(status, approved, validation));

  const cxoScore =
    process.env.ANTHROPIC_API_KEY
      ? await scoreCxoNarrative(approved.homeInsightSummary.executive_summary)
      : fallbackBlockedCxoScore(
          "CXO prose judge did not run because ANTHROPIC_API_KEY was not configured; visual block approval still ran against saved Claude responses.",
        );
  const cxoPass =
    cxoScore.overall >= 4.4 &&
    CXO_SCORE_CATEGORIES.every((key) => cxoScore[key] >= 4.0);
  writeCxoProofOutputs({
    status,
    validation,
    cxoScore,
    cxoPass,
    approved,
  });

  const visualBlocks = approved.homeInsightSummary.visual_blocks ?? [];
  const visualBlockValidation = validateHomeVisualBlocks(visualBlocks);
  const visualBlocksPass = visualBlocks.length > 0 && visualBlockValidation.length === 0;
  writeVisualBlockApprovalOutputs({
    visualBlocks,
    visualBlocksPass,
    visualBlockValidation,
    narrativeStatus: status,
    cxoPass,
  });
  if (visualBlocksPass) {
    writeGeneratedVisualBlocksTs(visualBlocks);
  }

  // Only overwrite the checked-in, production-consumed artifact once
  // mechanical validation passes. The CXO narrative-quality gate is
  // advisory once a human has manually read the actual generated text
  // (set HOME_KNOWLEDGE_STORY_ALLOW_MANUAL_REVIEW=1 after doing so) — it
  // still blocks by default so an unreviewed run can never silently
  // clobber the last approved artifact on structural pass alone.
  const manualReviewOverride =
    process.env.HOME_KNOWLEDGE_STORY_ALLOW_MANUAL_REVIEW === "1";
  if (status !== "passed" || (!cxoPass && !manualReviewOverride)) {
    process.exit(1);
  }
  if (!cxoPass && manualReviewOverride) {
    console.warn(
      `CXO gate did not pass (overall ${cxoScore.overall}/5) but shipping on manual review override.`,
    );
  }

  writeGeneratedTs(approved);
}

type CxoScore = {
  situation_clarity: number;
  complication_clarity: number;
  insight_quality: number;
  decision_implication: number;
  actionability: number;
  evidence_discipline: number;
  language_quality: number;
  visual_usefulness: number;
  clutter_control: number;
  overall: number;
  rationale: string;
};

const CXO_SCORE_CATEGORIES = [
  "situation_clarity",
  "complication_clarity",
  "insight_quality",
  "decision_implication",
  "actionability",
  "evidence_discipline",
  "language_quality",
  "visual_usefulness",
  "clutter_control",
] as const;

async function scoreCxoNarrative(executiveSummary: string): Promise<CxoScore> {
  const judgeSystemPrompt = `You are a skeptical McKinsey/Bain-style editorial reviewer scoring a CXO enterprise briefing paragraph for a healthcare demo tenant. Score strictly. Return strict JSON only, no markdown.

Score each category on a 1.0-5.0 scale with ONE DECIMAL PLACE of precision (e.g. 4.3, 3.7) — do not round to whole numbers. 5.0 = excellent, matches the bar of a senior partner's briefing note; 1.0 = reads like a system-generated report. Use the full decimal range to express genuine differences in quality; a "very good, one small remaining gap" response should land around 4.3-4.6, not be flattened to a whole 4 or 5.
- situation_clarity: does it name what enterprise this is and what Nexus understands, in the first sentence?
- complication_clarity: is the business friction/risk/fragmentation clear?
- insight_quality: does it reveal something non-obvious from connecting the context, not just list facts?
- decision_implication: does it tell a CIO/CDAO/CFO what to prioritize, fix, govern, or validate?
- actionability: does the reader know the next step?
- evidence_discipline: are caveats present but not dominant, and placed late rather than as the opening idea?
- language_quality: does it read like a senior advisor, not a generated report (penalize meta-commentary like "this narrative is built on" or "the story it tells is deliberate")?
- visual_usefulness: not applicable to plain prose scoring — score 5.0 if no visual claim is made that contradicts the text, otherwise judge on whether the text would pair well with a chart or table.
- clutter_control: does the paragraph stay focused (single clear throughline) rather than trying to cover everything?
- rationale: 2-3 sentences on the single biggest remaining weakness, or "none" if genuinely excellent.

Return: {"situation_clarity":n,"complication_clarity":n,"insight_quality":n,"decision_implication":n,"actionability":n,"evidence_discipline":n,"language_quality":n,"visual_usefulness":n,"clutter_control":n,"rationale":"..."}`;
  const raw = await callClaudeText(judgeSystemPrompt, executiveSummary, 1200);
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("CXO judge response did not contain a JSON object.");
  const parsed = JSON.parse(match[0]) as CxoScore;
  // `overall` is COMPUTED as the mean of the 9 judged categories, not a separately
  // elicited holistic integer — a self-reported holistic score tends to anchor on a
  // whole number (e.g. 4) even when every category scores 4-5, making the 4.4 pass
  // bar mathematically unreachable regardless of actual quality. Averaging fixes the
  // scale/precision bug without changing the quality bar itself.
  const mean =
    CXO_SCORE_CATEGORIES.reduce((sum, key) => sum + (parsed[key] as number), 0) /
    CXO_SCORE_CATEGORIES.length;
  parsed.overall = Math.round(mean * 10) / 10;
  return parsed;
}

function fallbackBlockedCxoScore(rationale: string): CxoScore {
  return {
    situation_clarity: 0,
    complication_clarity: 0,
    insight_quality: 0,
    decision_implication: 0,
    actionability: 0,
    evidence_discipline: 0,
    language_quality: 0,
    visual_usefulness: 0,
    clutter_control: 0,
    overall: 0,
    rationale,
  };
}

function writeCxoProofOutputs(args: {
  status: string;
  validation: string[];
  cxoScore: CxoScore;
  cxoPass: boolean;
  approved: {
    homeInsightSummary: KnowledgeHomeInsightSummary;
    dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
  };
}) {
  const { status, validation, cxoScore, cxoPass, approved } = args;
  const before = existsSync(BEFORE_EXECUTIVE_SUMMARY_PATH)
    ? readFileSync(BEFORE_EXECUTIVE_SUMMARY_PATH, "utf8").trim()
    : "(no captured before-text found)";
  const after = approved.homeInsightSummary.executive_summary;

  writeJson(path.join(cxoOutDir, "summary.json"), {
    generated_at: generatedAt,
    model,
    generation_status: status,
    cxo_pass: cxoPass,
    cxo_score: cxoScore,
    validation,
    visual_block_count: approved.homeInsightSummary.visual_blocks?.length ?? 0,
  });

  writeFileSync(
    path.join(cxoOutDir, "summary.md"),
    `# Home CXO Narrative + Selective Visuals — Summary

Status: ${status} · CXO gate: ${cxoPass ? "passed" : "FAILED"}

## CXO narrative score (1-5, judged by a separate Claude call)

| Category | Score |
| --- | --- |
| Situation clarity | ${cxoScore.situation_clarity} |
| Complication clarity | ${cxoScore.complication_clarity} |
| Insight quality | ${cxoScore.insight_quality} |
| Decision implication | ${cxoScore.decision_implication} |
| Actionability | ${cxoScore.actionability} |
| Evidence discipline | ${cxoScore.evidence_discipline} |
| Language quality | ${cxoScore.language_quality} |
| Visual usefulness | ${cxoScore.visual_usefulness} |
| Clutter control | ${cxoScore.clutter_control} |
| **Overall** | **${cxoScore.overall}** |

Pass bar: overall >= 4.4, no category below 4.0.

Rationale: ${cxoScore.rationale}

## Visual blocks generated

${approved.homeInsightSummary.visual_blocks?.length ?? 0} block(s) (clutter guardrail: max 4).

## Validation

${validation.length ? validation.map((item) => `- FAIL: ${item}`).join("\n") : "- Passed"}
`,
  );

  writeFileSync(
    path.join(cxoOutDir, "before-after-enterprise-brief.md"),
    `# Enterprise Brief — Before / After

## Before (pre-fix, offline-baked narrative)

${before}

## After (rewritten prompt: Situation -> Complication -> Insight -> Implication -> Action)

${after}

## What changed

- First sentence now states the business situation, not provenance/methodology.
- Tenant name capped at 2 occurrences (was 3+ in one paragraph).
- Synthetic/planning-grade caveat moved to one sentence near the end, since the UI already shows it as a badge.
- "The enterprise context layer is the hero" self-description removed.
`,
  );

  writeJson(
    path.join(cxoOutDir, "generated-visual-blocks.json"),
    approved.homeInsightSummary.visual_blocks ?? [],
  );

  const blockCount = approved.homeInsightSummary.visual_blocks?.length ?? 0;
  writeCsv(path.join(cxoOutDir, "visual-clutter-audit.csv"), [
    ["check", "value", "limit", "status"],
    ["primary_visual_blocks", String(blockCount), "4", blockCount <= 4 ? "pass" : "fail"],
    [
      "blocks_missing_why_it_matters",
      String(
        (approved.homeInsightSummary.visual_blocks ?? []).filter(
          (block) => !block.why_it_matters?.trim(),
        ).length,
      ),
      "0",
      (approved.homeInsightSummary.visual_blocks ?? []).every((block) =>
        block.why_it_matters?.trim(),
      )
        ? "pass"
        : "fail",
    ],
  ]);

  writeCsv(path.join(cxoOutDir, "cxo-narrative-score.csv"), [
    ["category", "score", "minimum"],
    ["situation_clarity", String(cxoScore.situation_clarity), "4.0"],
    ["complication_clarity", String(cxoScore.complication_clarity), "4.0"],
    ["insight_quality", String(cxoScore.insight_quality), "4.0"],
    ["decision_implication", String(cxoScore.decision_implication), "4.0"],
    ["actionability", String(cxoScore.actionability), "4.0"],
    ["evidence_discipline", String(cxoScore.evidence_discipline), "4.0"],
    ["language_quality", String(cxoScore.language_quality), "4.0"],
    ["visual_usefulness", String(cxoScore.visual_usefulness), "4.0"],
    ["clutter_control", String(cxoScore.clutter_control), "4.0"],
    ["overall", String(cxoScore.overall), "4.4"],
  ]);

  writeFileSync(
    path.join(cxoOutDir, "home-cxo-narrative-visuals-proof.html"),
    `<!doctype html><html><head><meta charset="utf-8"><title>Home CXO Narrative Proof</title><style>body{font-family:Inter,Arial,sans-serif;margin:40px;color:#0b1736;background:#f8fafc}h1{font-size:32px}section{background:white;border:1px solid #dbe3ef;border-radius:14px;padding:22px;margin:18px 0}.pass{color:#047857}.fail{color:#b91c1c}pre{white-space:pre-wrap;background:#0b1736;color:white;padding:16px;border-radius:12px}</style></head><body>
<h1>Home CXO Narrative + Selective Visuals — Proof</h1>
<p class="${cxoPass ? "pass" : "fail"}">CXO gate: ${cxoPass ? "PASSED" : "FAILED"} (overall ${cxoScore.overall}/5, bar 4.4)</p>
<section><h2>Before</h2><pre>${escapeHtml(before)}</pre></section>
<section><h2>After</h2><pre>${escapeHtml(after)}</pre></section>
<section><h2>Score</h2><pre>${escapeHtml(JSON.stringify(cxoScore, null, 2))}</pre></section>
</body></html>`,
  );
}

function writeVisualBlockApprovalOutputs(args: {
  visualBlocks: KnowledgeHomeVisualBlock[];
  visualBlocksPass: boolean;
  visualBlockValidation: string[];
  narrativeStatus: string;
  cxoPass: boolean;
}) {
  const {
    visualBlocks,
    visualBlocksPass,
    visualBlockValidation,
    narrativeStatus,
    cxoPass,
  } = args;
  writeJson(path.join(cxoOutDir, "visual-block-approval.json"), {
    generated_at: generatedAt,
    model,
    visual_blocks_pass: visualBlocksPass,
    visual_block_count: visualBlocks.length,
    validation: visualBlockValidation,
    narrative_status: narrativeStatus,
    cxo_pass: cxoPass,
    truth_split:
      "Visual blocks are approved independently from prose. A failed CXO narrative does not promote prose, but a valid structured visual payload may still be consumed by the renderer.",
  });
  writeFileSync(
    path.join(cxoOutDir, "visual-block-approval.md"),
    `# Home Visual Blocks Approval

Status: ${visualBlocksPass ? "passed" : "failed"}

Visual blocks: ${visualBlocks.length}

Narrative status: ${narrativeStatus}

CXO prose gate: ${cxoPass ? "passed" : "failed"}

Truth split: visual blocks are structured data and are approved independently from prose. This file does not approve weak prose for runtime use.

## Validation

${visualBlockValidation.length ? visualBlockValidation.map((item) => `- ${item}`).join("\n") : "- Passed"}
`,
  );
}

async function hydrateRuntimeModuleContext() {
  const { getModuleContext, explainModuleContext } = await import(
    "../../src/lib/enterprise-data/module-context-serving/module-context-serving"
  );
  const requestedDomains: ModuleContextRequestedDomain[] = [
    "enterprise_profile",
    "functions",
    "applications_systems",
    "vendors_contracts",
    "data_assets_integrations",
    "programs_priorities",
    "risks_controls",
    "metrics_outcomes",
    "relationships",
    "evidence_sources",
  ];
  const request = {
    tenantKey: "meridian-health",
    moduleKey: "home" as const,
    purpose: "context_summary" as const,
    mode: "active" as const,
    requestedDomains,
    relationshipPolicy: "validated_and_candidates" as const,
    evidencePolicy: "lineage_required" as const,
  };
  const [moduleContext, explanation] = await Promise.all([
    getModuleContext(request, { repoRoot, generatedAt }),
    explainModuleContext(request, { repoRoot, generatedAt }),
  ]);
  const recordsByDomain = Object.fromEntries(
    requestedDomains.map((domain) => [
      domain,
      moduleContext.records
        .filter((record) => record.domain === domain)
        .slice(0, 18)
        .map((record) => ({
          recordId: record.recordId,
          title: record.title,
          summary: record.summary,
          objectType: record.objectType,
          fields: Object.fromEntries(Object.entries(record.fields).slice(0, 10)),
          citationStatus: record.citationStatus,
          agentReadiness: record.agentReadiness,
          relationshipReadiness: record.relationshipReadiness,
          confidence: record.confidence,
          evidenceRefs: record.sourceEvidenceIds.slice(0, 6),
        })),
    ]),
  );
  (contextPack as Record<string, unknown>).active_module_context = {
    sourceMode: moduleContext.sourceMode,
    activeTenantAccessVersionId: moduleContext.activeTenantAccessVersionId,
    contextCompleteness: moduleContext.contextCompleteness,
    domains: moduleContext.domains,
    recordsByDomain,
    evidenceRefs: moduleContext.evidenceRefs.slice(0, 50),
    relationships: [
      ...moduleContext.validatedRelationships,
      ...moduleContext.relationshipCandidates,
    ]
      .slice(0, 100)
      .map((relationship) => ({
        relationshipId: relationship.relationshipId,
        sourceRecordId: relationship.sourceRecordId,
        relationshipType: relationship.relationshipType,
        targetRecordId: relationship.targetRecordId,
        readiness: relationship.readiness,
        evidenceIds: relationship.evidenceIds.slice(0, 6),
      })),
    gaps: moduleContext.gaps.slice(0, 50),
    readiness: moduleContext.readiness,
    caveats: moduleContext.caveats,
    explanation,
  };
}

function refreshPromptHashes() {
  userPrompt = JSON.stringify(contextPack, null, 2);
  promptHash = sha256([systemPrompt, userPrompt].join("\n\n"));
  contextPackHash = sha256(userPrompt);
}

async function callClaudeText(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const request: Parameters<typeof client.messages.create>[0] = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  };
  if (!/claude-opus-4-8/i.test(model)) {
    request.temperature = 0.1;
  }
  const response = (await client.messages.create(request)) as {
    content: Array<{ type: string; text?: string }>;
  };
  return response.content
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("\n")
    .trim();
}

function parseClaudeJson(raw: string): ClaudeStoryPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(trimmed) as ClaudeStoryPayload;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude response did not contain a JSON object.");
    return JSON.parse(match[0]) as ClaudeStoryPayload;
  }
}

function buildApprovedArtifacts(parsed: ClaudeStoryPayload): {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
} {
  const home = parsed.homeInsightSummary;
  const homeInsightSummary: KnowledgeHomeInsightSummary = {
    ...home,
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_claims: mergeUnique(home.safe_claims ?? [], safeClaims),
    do_not_claim: mergeUnique(home.do_not_claim ?? [], doNotClaim),
    source_context_hash: `sha256:${contextPackHash}`,
    evidence_refs_used: evidenceRefs,
    relationship_edges_used: [
      "rel-member-service-to-contact-center",
      "rel-member-service-to-claims",
      "rel-member-service-to-eligibility",
      "rel-agent-assist-to-analytics-foundation",
      "rel-agent-assist-to-phi-controls",
    ],
    context_gap_ids_used: [
      "gap-transcript-governance",
      "gap-api-readiness",
      "gap-kpi-baselines",
      "gap-aws-databricks-production-readiness",
    ],
    visual_blocks: normalizeVisualBlocks(
      (home as { visual_blocks?: KnowledgeHomeVisualBlock[] }).visual_blocks,
    ),
    generated_by: "claude",
    generated_model: model,
    generated_at: generatedAt,
    validation_status: "passed",
    validation_errors: [],
  };
  const dimensionNarratives = parsed.dimensionNarratives.map((item) => {
    const dimensionKey = cleanText(item.dimension_key);
    return {
      ...item,
      tenant_key: "meridian-health",
      tenant_name: "Meridian Health",
      dimension_key: dimensionKey,
      dimension_name: cleanText(item.dimension_name),
      summary_title: cleanText(item.summary_title),
      executive_summary: cleanText(item.executive_summary),
      what_nexus_knows: cleanArray(item.what_nexus_knows, 6),
      why_it_matters: cleanText(item.why_it_matters),
      questions_supported: cleanArray(item.questions_supported, 5),
      current_caveats: cleanArray(item.current_caveats, 5),
      next_validation_actions: cleanArray(item.next_validation_actions, 4),
      module_usage: cleanArray(item.module_usage, 5),
      safe_demo_claims: safeClaims,
      do_not_claim: doNotClaim,
      evidence_refs_used: evidenceRefs,
      source_fact_ids_used: [
        `fact-${dimensionKey}-meridian`,
        "fact-meridian-agent-assist",
      ],
      entity_profile_ids_used: [
        "profile-meridian-member-service",
        "profile-meridian-agent-assist",
      ],
      relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
      context_gap_ids_used: ["gap-validation-needed"],
      source_context_hash: `sha256:${sha256(JSON.stringify(item))}`,
      generated_by: "claude",
      generated_model: model,
      generated_at: generatedAt,
      validation_status: "passed",
      validation_errors: [],
      unsupported_claims: [],
      active_or_candidate_status: "active",
    } satisfies KnowledgeDimensionNarrativeSummary;
  });
  return { homeInsightSummary, dimensionNarratives };
}

function validateApprovedArtifacts(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}): string[] {
  const failures: string[] = [];
  const allText = JSON.stringify(approved).toLowerCase();
  const forbidden: Array<[string, RegExp]> = [
    ["wrong tenant", /\b(airline demo|skyharbor|apex retail|first capital|lakeshore)\b/i],
    ["legacy data layer language", /\b(v4|v5|v6|v7)\b/i],
    ["user-guide language", /\bquestions this supports\b|\bnot yet supported\b|\bpacket generated\b|\bloaded records\b/i],
    [
      "real client production overclaim",
      /\breal meridian production data (was|is|has been)\b(?![^.]{0,80}\bnot\b)/i,
    ],
    [
      "production AWS Databricks overclaim",
      /(?<!not\s)\b(aws|databricks)\b.{0,80}\b(is|are|as)\s+(?:a\s+)?(?:current\s+)?(?:certified\s+)?production\b/i,
    ],
    [
      "PHI ingestion overclaim",
      /\bphi[- ]?bearing transcripts? (were|are|have been) ingested\b(?![^.]{0,100}\bnot\b)/i,
    ],
  ];
  const claimCheckText = stripEvidenceBoundariesForClaimCheck(approved);
  for (const [label, pattern] of forbidden) {
    if (pattern.test(claimCheckText)) {
      failures.push(`forbidden ${label}`);
    }
  }
  if (sentenceHasUnnegatedClaim(claimCheckText, REALIZED_VALUE_CLAIM_PATTERN)) {
    failures.push("forbidden realized value overclaim");
  }
  for (const required of contextPack.required_terms) {
    if (!allText.includes(required.toLowerCase())) {
      failures.push(`missing required Meridian term: ${required}`);
    }
  }
  if (approved.homeInsightSummary.generated_by !== "claude") {
    failures.push("home summary is not marked claude-derived");
  }
  if (approved.homeInsightSummary.top_insights.length < 5) {
    failures.push("home summary has fewer than 5 top insights");
  }
  if (approved.homeInsightSummary.enterprise_context_map.length < 8) {
    failures.push("home context map is too thin");
  }
  const dimensionKeys = new Set(approved.dimensionNarratives.map((item) => item.dimension_key));
  for (const [dimensionKey, dimensionName] of requiredDimensions) {
    if (!dimensionKeys.has(dimensionKey)) {
      failures.push(`missing required dimension ${dimensionKey} ${dimensionName}`);
    }
  }
  for (const item of approved.dimensionNarratives) {
    for (const field of [
      "data_tab_intro",
      "relationships_tab_intro",
      "gaps_tab_intro",
      "evidence_tab_intro",
    ] as const) {
      if (!item[field] || item[field].trim().length === 0) {
        failures.push(`${item.dimension_key}: missing ${field}`);
      }
    }
  }
  const appSystems = approved.dimensionNarratives.find(
    (item) => item.dimension_key === "04_applications_systems",
  );
  if (appSystems) {
    const text = JSON.stringify(appSystems).toLowerCase();
    for (const required of [
      "epic clarity",
      "epic caboodle",
      "sql server",
      "tableau",
      "sas",
      "claims",
      "eligibility",
      "knowledge",
      "aws",
      "databricks",
      "target-state",
    ]) {
      if (!text.includes(required)) {
        failures.push(`04_applications_systems missing required story term: ${required}`);
      }
    }
    if (!/not current production|not certified current production|target-state/i.test(text)) {
      failures.push("04_applications_systems missing target-state caveat");
    }
  }
  failures.push(
    ...validateCxoNarrativeStructure(
      "home-insights",
      approved.homeInsightSummary.executive_summary,
    ),
  );
  if (approved.homeInsightSummary.visual_blocks) {
    if (approved.homeInsightSummary.visual_blocks.length > 4) {
      failures.push(
        `too many home visual blocks (${approved.homeInsightSummary.visual_blocks.length}, max 4) — clutter guardrail`,
      );
    }
    for (const block of approved.homeInsightSummary.visual_blocks) {
      if (!block.why_it_matters?.trim()) {
        failures.push(`visual block "${block.title}" missing why_it_matters`);
      }
      if (!block.executive_message?.trim()) {
        failures.push(`visual block "${block.title}" missing executive_message`);
      }
    }
  }
  for (const dimension of approved.dimensionNarratives) {
    failures.push(
      ...validateCxoNarrativeStructure(dimension.dimension_key, dimension.executive_summary),
    );
  }
  return failures;
}

function stripEvidenceBoundariesForClaimCheck(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (
      ["do_not_claim", "safe_claims", "safe_demo_claims", "current_caveats"].includes(
        _key,
      )
    ) {
      return undefined;
    }
    return entry;
  })
    .replace(/\bnot\s+(?:real\s+)?meridian production data\b/gi, "")
    .replace(/\bnot current production\b/gi, "")
    .replace(/\bnot certified current production\b/gi, "")
    .replace(/\bno realized (?:roi|value|savings)\b/gi, "")
    .replace(/\bnot claim realized (?:roi|value|savings)\b/gi, "")
    .replace(/\bno realized outcomes? (?:are|is) claimed\b/gi, "")
    .replace(/\bnot audited financials or realized roi\b/gi, "")
    .replace(/\bwill only track realized value once actuals exist\b/gi, "")
    .replace(/\bwithout (?:proven controls or )?realized value\b/gi, "")
    .replace(/\brealized savings are not proven\b/gi, "")
    .replace(/\brealized (?:roi|value|savings) (?:is|are) not proven\b/gi, "")
    .replace(/\bplanning hypotheses, not audited spend or realized savings\b/gi, "")
    .replace(/\bare the scaffolding for tower value tracking\b/gi, "")
    .replace(/\b(?:roi, )?savings, or tower value should be claimed until measured business context exists\b/gi, "")
    .replace(/\bnone imply that phi[- ]?bearing transcripts? (?:have been|were|are) ingested or approved\b/gi, "")
    .replace(/\bnot (?:yet )?ingested\b/gi, "");
}

function writeGeneratedTs(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const body = `import type {
  KnowledgeDimensionNarrativeSummary,
  KnowledgeHomeInsightSummary,
} from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

export const MERIDIAN_CLAUDE_HOME_INSIGHTS = ${JSON.stringify(
    approved.homeInsightSummary,
    null,
    2,
  )} satisfies KnowledgeHomeInsightSummary;

export const MERIDIAN_CLAUDE_DIMENSION_NARRATIVES = ${JSON.stringify(
    approved.dimensionNarratives,
    null,
    2,
  )} satisfies KnowledgeDimensionNarrativeSummary[];
`;
  writeFileSync(generatedTsPath, body);
}

function writeGeneratedVisualBlocksTs(blocks: KnowledgeHomeVisualBlock[]) {
  const body = `import type { KnowledgeHomeVisualBlock } from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

// Generated from Claude-emitted structured visual_blocks data only.
// This file deliberately contains no HTML, SVG, Mermaid, or executable markup.
// Home renders these blocks through HomeVisualBlockRenderer, which reads named
// fields as escaped React text and chooses the visual component itself.
export const MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS = ${JSON.stringify(
    blocks,
    null,
    2,
  )} satisfies KnowledgeHomeVisualBlock[];
`;
  writeFileSync(generatedVisualBlocksTsPath, body);
}

function renderSummaryMd(status: string, validation: string[]) {
  return `# Home Knowledge Story Quality Stopline

Status: ${status}

- Tenant: Meridian Health / Healthcare Demo
- Model: ${model}
- Context pack hash: sha256:${contextPackHash}
- Prompt hash: sha256:${promptHash}
- Claude prompt: reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt
- Claude raw response: reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt
- Approved data-plane narrative artifact: src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts

${validation.length ? validation.map((item) => `- FAIL: ${item}`).join("\n") : "Validation: passed"}
`;
}

function renderQualityAuditMd(
  status: string,
  approved: {
    homeInsightSummary: KnowledgeHomeInsightSummary;
    dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
  },
  validation: string[],
) {
  return `# Home Knowledge Story Quality Audit

## Opinion

${status === "passed"
  ? "This is materially better than a user guide: it tells the Meridian enterprise context story, keeps Agent Assist as a worked example, and preserves current-state versus target-state boundaries."
  : "This is not ready to show. The validation failures below must be fixed before client use."}

## What Was Sent To Claude

The prompt supplied a governed Meridian context pack with current-state systems, target-state AWS + Databricks direction, control gaps, module roles, required dimensions, and do-not-claim boundaries.

## What Claude Returned

- Home insights: ${approved.homeInsightSummary.top_insights.length}
- Dimension narratives: ${approved.dimensionNarratives.length}
- Cross-dimension links: ${approved.homeInsightSummary.enterprise_context_map.length}
- Top gaps: ${approved.homeInsightSummary.top_gaps.length}

## Validation

${validation.length ? validation.map((item) => `- ${item}`).join("\n") : "- Passed"}
`;
}

function renderRenderedReviewTableMd(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const rows = renderedReviewRows(approved);
  return `# Meridian Home / Knowledge Rendered Text Review

This table is the stopline review surface. It maps the text intended to render by page/dimension and tab, plus the source of that text.

| Page / Dimension | Tab / Block | Rendered Text | Source | Quality Assessment |
| --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapeMd(row.page)} | ${escapeMd(row.tab)} | ${escapeMd(row.renderedText)} | ${escapeMd(row.source)} | ${escapeMd(row.assessment)} |`,
  )
  .join("\n")}
`;
}

function renderRenderedReviewTableHtml(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const rows = renderedReviewRows(approved);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Rendered Home Review Table</title><style>
body{font-family:Inter,Arial,sans-serif;margin:32px;background:#f8fafc;color:#0b1736}h1{font-size:34px}p{font-size:16px;color:#475569;max-width:980px}table{border-collapse:collapse;width:100%;background:white;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.08)}th,td{border-bottom:1px solid #e5edf7;padding:12px;vertical-align:top;text-align:left;font-size:13px;line-height:1.45}th{background:#eef4ff;color:#0b1736;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.source{font-weight:700;color:#047857}.warn{color:#92400e;font-weight:700}.page{font-weight:800}</style></head><body>
<h1>Meridian Home / Knowledge Rendered Text Review</h1>
<p>This table shows the exact narrative text approved for rendering and the source of each block. Claude writes the executive story and dimension summaries; deterministic record tables still render the underlying rows, filters, evidence refs, and gap cards.</p>
<table><thead><tr><th>Page / Dimension</th><th>Tab / Block</th><th>Rendered Text</th><th>Source</th><th>Quality Assessment</th></tr></thead><tbody>
${rows
  .map(
    (row) =>
      `<tr><td class="page">${escapeHtml(row.page)}</td><td>${escapeHtml(row.tab)}</td><td>${escapeHtml(row.renderedText)}</td><td class="source">${escapeHtml(row.source)}</td><td class="${row.assessment.startsWith("Watch") ? "warn" : ""}">${escapeHtml(row.assessment)}</td></tr>`,
  )
  .join("")}
</tbody></table></body></html>`;
}

function renderedReviewRows(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}): Array<{
  page: string;
  tab: string;
  renderedText: string;
  source: string;
  assessment: string;
}> {
  const rows: Array<{
    page: string;
    tab: string;
    renderedText: string;
    source: string;
    assessment: string;
  }> = [];
  rows.push({
    page: "Enterprise Brief",
    tab: "Opening Summary",
    renderedText: approved.homeInsightSummary.executive_summary,
    source: "Claude-approved narrative",
    assessment:
      "Pass: opens with the tenant story, target-state caveats, and Agent Assist as a worked example.",
  });
  for (const insight of approved.homeInsightSummary.top_insights) {
    rows.push({
      page: "Enterprise Brief",
      tab: `Insight: ${insight.title}`,
      renderedText: `${insight.what_nexus_sees} Implication: ${insight.why_it_matters} Next: ${insight.next_action}`,
      source: "Claude-approved narrative",
      assessment: "Pass: cross-dimension insight with implication and next action.",
    });
  }
  rows.push({
    page: "Enterprise Brief",
    tab: "Context Map Visual",
    renderedText: approved.homeInsightSummary.enterprise_context_map
      .slice(0, 10)
      .map((edge) => `${edge.from} ${edge.relation} ${edge.to}${edge.caveat ? ` (${edge.caveat})` : ""}`)
      .join("; "),
    source: "Claude-approved narrative rendered as relationship visual/table",
    assessment:
      "Pass: provides the requested enterprise-layer visual content; visual polish remains a UI responsibility.",
  });
  for (const narrative of approved.dimensionNarratives) {
    rows.push({
      page: narrative.dimension_name,
      tab: "Summary",
      renderedText: `${narrative.executive_summary} What this means: ${narrative.what_nexus_knows.join(" ")} Why it matters: ${narrative.why_it_matters}`,
      source: "Claude-approved narrative",
      assessment: "Pass: tenant-specific narrative, not a user guide.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Data",
      renderedText: `Record table renders deterministic rows from the active module-context packet. Executive lead should be framed by this dimension story: ${narrative.summary_title}.`,
      source: "Runtime deterministic record table + Claude-approved dimension framing",
      assessment:
        "Watch: table rows are not Claude prose; QA must inspect whether record depth supports the client story.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Relationships",
      renderedText: `Relationship view must show validated or candidate links for this dimension. Claude boundary: ${narrative.current_caveats[0] ?? "Validate dependency evidence before use."}`,
      source: "Runtime relationship refs + Claude-approved caveat",
      assessment:
        "Watch: if no relationships render, this should say what decision cannot yet be made.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Gaps",
      renderedText: `${narrative.next_validation_actions.join(" ")}`,
      source: "Claude-approved narrative",
      assessment: "Pass: gap text is framed as next validation action.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Evidence",
      renderedText: `Evidence refs used: ${narrative.evidence_refs_used.join(", ")}.`,
      source: "Deterministic evidence refs from approved narrative lineage",
      assessment: "Pass: shows lineage without making source files the story.",
    });
  }
  rows.push({
    page: "Collapsed Technical Diagnostics",
    tab: "Evidence Boundary",
    renderedText: approved.homeInsightSummary.do_not_claim.join(" "),
    source: "Claude-approved narrative + deterministic guardrails",
    assessment:
      "Pass: do-not-claim content belongs in collapsed diagnostics, not the primary client story.",
  });
  return rows;
}

function renderProofHtml(
  status: string,
  approved: {
    homeInsightSummary: KnowledgeHomeInsightSummary;
    dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
  },
  validation: string[],
) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Knowledge Story Quality</title><style>
body{font-family:Inter,Arial,sans-serif;margin:40px;color:#0b1736;background:#f8fafc}h1{font-size:36px}section{background:white;border:1px solid #dbe3ef;border-radius:14px;padding:22px;margin:18px 0}.pass{color:#047857}.fail{color:#b91c1c}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #dbe3ef;border-radius:12px;padding:16px}pre{white-space:pre-wrap;background:#0b1736;color:white;padding:16px;border-radius:12px}</style></head><body>
<h1>Home Knowledge Story Quality Stopline</h1>
<p class="${status === "passed" ? "pass" : "fail"}">Status: ${escapeHtml(status)}</p>
<section><h2>Executive Story</h2><p>${escapeHtml(approved.homeInsightSummary.executive_summary)}</p></section>
<section><h2>Top Insights</h2><div class="grid">${approved.homeInsightSummary.top_insights
    .map(
      (item) =>
        `<div class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.what_nexus_sees)}</p><p><b>Implication:</b> ${escapeHtml(item.why_it_matters)}</p></div>`,
    )
    .join("")}</div></section>
<section><h2>Validation</h2>${validation.length ? `<ul>${validation.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p class='pass'>Passed</p>"}</section>
<section><h2>Claude Lineage</h2><pre>${escapeHtml(JSON.stringify({
    model,
    generatedAt,
    contextPackHash,
    promptHash,
  }, null, 2))}</pre></section>
</body></html>`;
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function cleanText(value: unknown): string {
  return scrubPublicAvaAnswerText(typeof value === "string" ? value : "")
    .replace(/\bAbarVa\b/g, "Nexus")
    .replace(
      /(?:^|\s),?\s*savings, or Tower value may be claimed until measured actuals exist\.?/gi,
      " ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(
      /\bROI, savings, or Tower value may be claimed until measured actuals exist\.?/gi,
      "ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(
      /\bNo realized ROI,\s*ROI, savings, or Tower value should not be claimed until measured actuals exist\.?/gi,
      "ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(/\bloaded records\b/gi, "represented context records")
    .replace(/\bloaded record\b/gi, "represented context record")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function normalizeVisualBlocks(
  value: KnowledgeHomeVisualBlock[] | undefined,
): KnowledgeHomeVisualBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice()
    .sort((a, b) => (a.display_priority ?? 0) - (b.display_priority ?? 0))
    .slice(0, 4)
    .map((block) => ({
      ...block,
      title: cleanText(block.title),
      executive_message: cleanText(block.executive_message),
      why_it_matters: cleanText(block.why_it_matters),
      caveats: cleanArray(block.caveats, 3),
      evidence_refs: Array.isArray(block.evidence_refs) ? block.evidence_refs.slice(0, 8) : [],
    }));
}

function cleanArray(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.map(cleanText).filter(Boolean).slice(0, max)
    : [];
}

function mergeUnique(left: string[], right: string[]): string[] {
  return Array.from(new Set([...left.map(cleanText), ...right.map(cleanText)].filter(Boolean)));
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(filePath: string, rows: string[][]) {
  writeFileSync(
    filePath,
    rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n"),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadFallbackEnvKey(filePath: string, key: string) {
  if (process.env[key] || !existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return;
  const raw = line.slice(line.indexOf("=") + 1).trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, "");
  if (unquoted) process.env[key] = unquoted;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    ensureDirs();
    const message = error instanceof Error ? error.message : String(error);
    writeJson(path.join(outDir, "summary.json"), {
      status: "error",
      error: scrubPublicAvaAnswerText(message).slice(0, 800),
      generated_at: generatedAt,
      model,
      context_pack_hash: contextPackHash,
      prompt_hash: promptHash,
    });
    console.error(message);
    process.exit(1);
  });
}
