// Multi-pass prompt builder.
//
// Builds the six-pass prompt sequence (architect → evidence-grounding → full-draft →
// red-team → board-grade-rewrite → render-package). Every final-generation prompt
// follows the Prompt Construction Standard: Role, Mission, Expert Latitude,
// Governance Boundary, Evidence, Missing Evidence, Quality Bar, Formatting.
//
// The deliberate design choice: give Claude expert LATITUDE (it may add sections,
// exhibits, and tables a senior consultant would include) while binding every
// client-specific fact to governed evidence, an approved assumption, or a placeholder.

import type {
  DeliverableArtifactBrief,
  DeliverableIntelligenceRequest,
  GenerationPass,
  PassPrompt,
  PlannedSection,
} from "./types";
import { renderEvidenceForPrompt } from "./source-register";
import type { GovernedEvidenceItem } from "./types";
import { resolvePassTokenBudget } from "@/lib/ai/document-generation-policy";
import { roadmapStructuredOutputInstruction } from "@/lib/deliverables/roadmap-structured-output";
import {
  renderStorySpinePrompt,
  storySpineFor,
} from "@/lib/deliverables/shared/executive-story-contract";
import { renderAdaptiveDepthPrompt } from "@/lib/deliverables/adaptive-depth";
import type { MovesDeliverableKey } from "@/lib/deliverables/profiles/types";

const USE_CASE_TITLE: Record<string, string> = {
  AMS_IT_OUTSOURCING: "application management services and IT outsourcing",
  ERP_SI_SELECTION: "ERP and systems-integrator selection",
  CLOUD_MODERNIZATION: "cloud modernization and migration",
  AI_PDLC: "the AI-powered product development lifecycle",
};

function describeUseCase(archetype: string): string {
  return (
    USE_CASE_TITLE[archetype] ?? archetype.replace(/_/g, " ").toLowerCase()
  );
}

export function artifactHonestyDiscipline(
  req: DeliverableIntelligenceRequest,
): string {
  if (req.module !== "moves") {
    return [
      `HONESTY DISCIPLINE: No number, date, dollar value, percentage, timeline, benefit, ROI, NPV, payback, vendor price, or KPI may be asserted as fact unless it cites governed evidence [n].`,
      `If the source is absent, label it [ASSUMPTION TO VALIDATE: ...] or put it in the single Open Inputs Required table. Do not scatter [CLIENT TO COMPLETE] placeholders through the prose.`,
    ].join(" ");
  }

  switch (req.deliverableType) {
    case "business_case":
      return [
        `HONEST BUSINESS-CASE MODE: If baseline, cost, benefit, and sensitivity inputs are not all present as governed evidence, produce a Business Case Readiness Memo, not a full Business Case.`,
        `Do not assert ROI, NPV, payback, total benefit, total cost, or a funding amount as fact unless cited [n]. State value hypotheses qualitatively and route missing finance inputs to one Open Inputs Required table.`,
      ].join(" ");
    case "estimate_model":
    case "financial_model":
      return [
        `HONEST FINANCIAL-MODEL MODE: If finance-grade baseline/cost/benefit/sensitivity inputs are absent, do not fabricate a model. Produce a Financial Model Input Register that states the model is omitted until inputs exist.`,
        `Every cell/value/date/range must be cited [n] or explicitly labeled as an assumption; otherwise route it to one Open Inputs Required table.`,
      ].join(" ");
    case "roadmap":
    case "execution_roadmap":
      return [
        `HONEST ROADMAP MODE: Workstreams, gates, dependencies, owners, and sequencing may be recommended. Calendar dates, durations, and capacity commitments must be cited [n] or labeled [ASSUMPTION TO VALIDATE: indicative timeline pending capacity confirmation].`,
        `Use one Open Inputs Required table for capacity, date, or dependency inputs that must be confirmed.`,
        roadmapStructuredOutputInstruction(),
      ].join(" ");
    case "value_measurement_contract":
      return [
        `HONEST VALUE-MEASUREMENT MODE: This artifact defines HOW value will be measured: metric, owner, source, method, cadence, baseline status, and acceptance rule.`,
        `Do not assert realized value, target value, ROI, or dates as fact unless cited [n]. For absent values, state that measurement input is required and route missing baselines/sources to one Open Inputs Required table.`,
      ].join(" ");
    case "sourcing_strategy":
      return [
        `HONEST SOURCING-STRATEGY MODE: Provide build/buy/partner/hybrid options, criteria, guardrails, and a recommended path.`,
        `Costs, vendor prices, dates, and commercial ranges must be cited [n] or labeled as assumptions; otherwise route them to one Open Inputs Required table.`,
      ].join(" ");
    default:
      return [
        `HONESTY DISCIPLINE: No number, date, dollar value, percentage, timeline, benefit, ROI, NPV, payback, vendor price, or KPI may be asserted as fact unless it cites governed evidence [n].`,
        `If the source is absent, label it [ASSUMPTION TO VALIDATE: ...] or put it in the single Open Inputs Required table. Do not scatter [CLIENT TO COMPLETE] placeholders through the prose.`,
      ].join(" ");
  }
}

/** The standing role + governance system prompt shared by every pass. */
export function buildSystemPrompt(req: DeliverableIntelligenceRequest): string {
  const expertise = describeUseCase(req.useCaseArchetype);
  const conciseInstrument = req.qualityBar.enforceMaxAsBlocker === true;
  return [
    `You are a senior McKinsey partner, CIO/CFO/CPO advisor, and a recognized expert in enterprise technology transformation and ${expertise}.`,
    `You produce board-grade consulting artifacts that read like a senior engagement team prepared them for an executive steering committee — specific, structured, and decision-oriented.`,
    ``,
    `You operate in TWO modes simultaneously:`,
    `1. GOVERNED FACTUAL MODE — for ANY client-specific fact (names, owners, dates, financial values, KPIs, systems, vendor contracts, timelines, legal terms, benchmarks, pricing, approvals) you use ONLY the governed evidence provided, an approved assumption, or an explicit placeholder. You NEVER invent these.`,
    `2. EXPERT ARTIFACT MODE — for artifact structure, narrative, exhibits, tables, decision frameworks, recommended sections, standard boilerplate, and professional language you use your full expert knowledge, unconstrained by the minimum section list.`,
    ``,
    `Hard rules:`,
    `- Cite every client-specific fact with [n] tied to the Source Register.`,
    `- No numeric, date, currency, percentage, timeline, ROI, NPV, payback, or value claim may appear as an asserted fact without [n]. If not grounded, label it [ASSUMPTION TO VALIDATE: ...] or route it to Open Inputs Required.`,
    `- Use ONE consolidated Open Inputs Required table for missing inputs. Do not scatter [CLIENT TO COMPLETE] tags through the narrative.`,
    `- Where a client fact is missing, write [EVIDENCE MISSING: <what>], [ASSUMPTION TO VALIDATE: <what>], or [CLIENT TO COMPLETE: <what>] — never fabricate.`,
    `- Never expose internal source ids, chunk ids, table names, fact keys, or system status words in the body.`,
    `- Do not use internal phase shorthand (P0, P1, P2, P3, P4, P5) in client prose. Write "origination", "charter", "discovery", "design", "roadmap/business-case planning", or "handoff" instead. If ranking priority, write "Priority 1", not "P1".`,
    `- Use "Source Register" only as the appendix/evidence-register heading. In the narrative body, say "cited evidence", "evidence appendix", or "what the evidence shows".`,
    `- Citation and evidence-handling rules are invisible authoring controls. Never explain, restate, or summarize these rules in the client artifact, and never write that a claim is "tied to" a Source Register or evidence register. Simply comply with the rules.`,
    `- Never write "authorized to build", "not authorized", or "not authorized to build" in client prose. Use executive decision language such as "in scope for delivery", "hold the investment decision", or "requires further validation", as appropriate.`,
    conciseInstrument
      ? `- This artifact is a concise approval instrument with an enforced length ceiling. Respect brevity as a quality requirement: use compact tables, remove repetition, and do not expand into later-phase analysis.`
      : `- Do not optimize for short documents. Optimize for high-quality, decision-grade artifacts.`,
  ].join("\n");
}

/** The shared context block (mission → formatting) injected into the generation passes. */
function buildContextBlock(
  req: DeliverableIntelligenceRequest,
  brief: DeliverableArtifactBrief,
  evidence: GovernedEvidenceItem[],
): string {
  const audience = req.audience.join(", ");
  const missing =
    req.missingEvidence.length === 0
      ? "(none flagged)"
      : req.missingEvidence
          .map(
            (m) =>
              `- ${m.label} (${m.evidenceFamily}): ${m.whyItMatters} → ${m.completionPath}`,
          )
          .join("\n");
  const clientComplete =
    req.clientCompleteItems.length === 0
      ? "(none)"
      : req.clientCompleteItems
          .map((c) => `- ${c.label} [owner: ${c.owner}; ${c.reason}]`)
          .join("\n");
  const assumptions =
    req.approvedAssumptions.length === 0
      ? "(none approved)"
      : req.approvedAssumptions
          .map(
            (a) =>
              `- ${a.statement} (basis: ${a.basis}${a.mustValidate ? "; VALIDATE" : ""})`,
          )
          .join("\n");

  const latitude = brief.fixedStructure
    ? `This artifact uses a FIXED STRUCTURE. Do not add sections, exhibits, tables, appendices, or decision views beyond the recommended structure unless explicitly listed under EXPECTED EXHIBITS or EXPECTED TABLES. Apply expert frameworks, synthesis, and executive language only within that fixed structure; qualitative industry context must never become a fabricated client fact.`
    : `Use your expert knowledge to design the best artifact for this use case. You are NOT limited to the minimum sections — add sections, exhibits, tables, and decision views if they materially improve the artifact. ${brief.allowedExpertKnowledge}`;
  const structureLabel = brief.fixedStructure
    ? "REQUIRED STRUCTURE (exhaustive — do not add sections)"
    : "RECOMMENDED STRUCTURE (a senior consultant's baseline — improve on it)";

  return [
    `MISSION: Create the best possible ${req.deliverableType.replace(/_/g, " ")} for ${req.clientDisplayName} — initiative "${req.initiativeDisplayName}" — for ${audience} to support this decision:`,
    `  ${req.decisionContext}`,
    ``,
    `EXPERT LATITUDE: ${latitude}`,
    ``,
    `GOVERNANCE BOUNDARY: ${brief.disallowedFabrication} ${brief.citationPolicy}`,
    ``,
    artifactHonestyDiscipline(req),
    ``,
    `AVAILABLE GOVERNED EVIDENCE (cite by [n]):`,
    renderEvidenceForPrompt(evidence),
    ``,
    `MISSING EVIDENCE (mark as [EVIDENCE MISSING] or [ASSUMPTION TO VALIDATE]):`,
    missing,
    ``,
    `CLIENT-TO-COMPLETE ITEMS (mark as [CLIENT TO COMPLETE]; never invent):`,
    clientComplete,
    ``,
    `APPROVED ASSUMPTIONS (use, labelled):`,
    assumptions,
    ``,
    `${structureLabel}:`,
    brief.recommendedStructure
      .map(
        (s, i) =>
          `  ${i + 1}. ${s.title} — ${s.intent} [${s.groundingMode}] Section instruction: ${s.expertLatitude}`,
      )
      .join("\n"),
    ``,
    ...(brief.fixedStructure
      ? [
          `FIXED-STRUCTURE DISCIPLINE: The generated sectionPlan must use exactly these section keys, in this order: ${brief.recommendedStructure.map((s) => s.key).join(", ")}. Do not split, rename, duplicate, or add sections.`,
          ``,
        ]
      : []),
    ...(brief.forbiddenSectionTopics && brief.forbiddenSectionTopics.length > 0
      ? [
          `PHASE DISCIPLINE — OUT OF SCOPE for this deliverable (these belong to later phases; do NOT add sections, exhibits, or extended analysis on them, even to "improve" the artifact): ${brief.forbiddenSectionTopics.join("; ")}. Keep this document to the decision it must drive; reference later-phase work only as a forward pointer, never as analysis.`,
          ``,
        ]
      : []),
    ...(brief.prohibitedContent && brief.prohibitedContent.length > 0
      ? [`PURPOSE BOUNDARY: ${brief.prohibitedContent.join(" ")}`, ``]
      : []),
    `EXPECTED EXHIBITS:`,
    brief.expectedExhibits.length > 0
      ? brief.expectedExhibits
          .map((e) =>
            e.requiredElements && e.requiredElements.length > 0
              ? `  - ${e.title} [${e.kind}]: MUST show ${e.requiredElements.join(", ")}.${e.legendRequired ? " Include a legend marking each element illustrative, selected, or client-confirmed." : ""}`
              : `  - ${e.title} [${e.kind}]: ${e.purpose}`,
          )
          .join("\n")
      : "  (use judgment)",
    `EXPECTED TABLES: ${brief.expectedTables.map((t) => t.title).join("; ") || "(use judgment)"}`,
    ``,
    `QUALITY BAR: ${brief.qualityCriteria.join(" ")} Output must read like a board-grade consulting artifact, not an LLM draft. Strengthen synthesis, implications, and the decision ask.`,
    storySpineInstruction(req),
    adaptiveDepthInstruction(req),
    narrativeSpineInstruction(req),
    sizeDisciplineInstruction(req),
    deterministicNumbersInstruction(req),
    ``,
    `FORMATTING: ${brief.formattingInstructions} Body ≈ ${req.formattingProfile.bodyPointSize}pt. ${req.formattingProfile.wideDataToExcelCompanion ? "Move wide datasets into an Excel companion exhibit rather than tiny in-document tables." : ""} Output formats: ${req.outputFormats.join(", ")}.`,
  ].join("\n");
}

function adaptiveDepthInstruction(req: DeliverableIntelligenceRequest): string {
  if (req.module !== "moves") return "";
  return `\n${renderAdaptiveDepthPrompt(
    req.adaptiveDepth,
    req.deliverableType,
  )}`;
}

/**
 * The shared executive story spine for this artifact's phase — the ORDER the
 * reader's questions get answered in. Empty for artifacts that are instruments
 * rather than arguments (a charter, a measurement contract), which have a job
 * but no narrative arc.
 *
 * Deliberately separate from `narrativeSpineInstruction`: that one states the
 * qualities the argument must have (tension, options, gaps); this one states
 * what the argument IS. The deck contract will project the same beats onto
 * slides, which is how a document and its deck stay the same story.
 */
function storySpineInstruction(req: DeliverableIntelligenceRequest): string {
  if (req.module !== "moves") return "";
  const spine = storySpineFor(req.deliverableType as MovesDeliverableKey);
  return spine ? `\n${renderStorySpinePrompt(spine)}` : "";
}

/**
 * Numbers come from the deterministic engine, never from the model.
 *
 * Stated in the prompt as well as enforced downstream because a model that
 * believes it may compute a total will produce one that looks authoritative,
 * and a reader cannot tell the difference by looking.
 */
function deterministicNumbersInstruction(
  req: DeliverableIntelligenceRequest,
): string {
  if (req.module !== "moves") return "";
  const spine = storySpineFor(req.deliverableType as MovesDeliverableKey);
  if (spine !== "p4_investment_case") return "";
  return (
    "\nNUMBERS ARE NOT YOURS TO COMPUTE: every cost, effort, value, payback, " +
    "TCO, ROI and sensitivity figure in this artifact comes from the " +
    "deterministic pricing and value model and is supplied to you as evidence. " +
    "Do not calculate, derive, extrapolate, total, or adjust any figure — not " +
    "even arithmetic on supplied numbers. Cite the supplied value and explain " +
    "what it means, why it is what it is, and what would change it. If a figure " +
    "you need was not supplied, say so plainly and name it as an open input; " +
    "do not estimate it to complete the narrative."
  );
}

/** The narrative-spine requirement: this document must argue a case, not fill sections. */
function narrativeSpineInstruction(
  req: DeliverableIntelligenceRequest,
): string {
  const qb = req.qualityBar;
  const asks: string[] = [];
  if (qb.requiresCentralTension)
    asks.push(
      "state the central tension/why-now plainly (what problem, what economic leakage, what happens if nothing changes)",
    );
  if (qb.requiresOptionsConsidered)
    asks.push(
      "show real options considered and why the recommended path won — not the recommended path presented as the only one",
    );
  if (qb.requiresEvidenceGapsNoted)
    asks.push(
      "state plainly what remains unproven or unconfirmed — do not imply completeness the evidence does not support",
    );
  if (asks.length === 0) return "";
  return `\nNARRATIVE SPINE: This document must read as one coherent argument, not a collection of disconnected sections. Specifically: ${asks.join("; ")}.`;
}

/** The size-range discipline instruction — a range is a boundary, not a target to hit by padding. */
function sizeDisciplineInstruction(
  req: DeliverableIntelligenceRequest,
): string {
  const qb = req.qualityBar;
  if (!qb.targetBodyWordsMax) return "";
  // When the band counts prose only, say so — otherwise the model budgets its
  // tables against a ceiling they do not consume, and under-exhibits to fit.
  const unit = qb.excludeNonProseFromBody
    ? "body words of PROSE (tables, exhibits and appendices do not count toward this, so use them freely)"
    : "body words";
  if (qb.enforceMaxAsBlocker) {
    return `\nSIZE DISCIPLINE: Target ${qb.minBodyWords.toLocaleString()}–${qb.targetBodyWordsMax.toLocaleString()} ${unit} for this artifact type. This ceiling is a HARD QUALITY GATE, not a suggestion. If you need to include many facts, compress them into compact tables; do not add explanatory prose, appendices, methodology sections, or later-phase analysis. The final document should feel like a crisp sponsor decision memo.`;
  }
  return `\nSIZE DISCIPLINE: Target ${qb.minBodyWords.toLocaleString()}–${qb.targetBodyWordsMax.toLocaleString()} ${unit} for this artifact type. Do not optimize for minimum length OR maximum length — optimize for decision usefulness, professional completeness, visual clarity, evidence traceability, and human usability. Use this range as a discipline boundary, not permission to omit necessary analysis below it or pad with filler, generic methodology prose, or unsupported detail above it. Every section must advance the decision, evidence, design, or approval this artifact exists to drive.`;
}

function conciseInstrumentDraftInstruction(
  req: DeliverableIntelligenceRequest,
): string {
  const qb = req.qualityBar;
  if (!qb.enforceMaxAsBlocker || !qb.targetBodyWordsMax) return "";
  if (req.deliverableType !== "charter") {
    return [
      `ENFORCED DOCUMENT-SIZE RULES:`,
      `- The entire authored body must stay within ${qb.targetBodyWordsMax.toLocaleString()} words. This is a quality gate, not a suggestion.`,
      `- Follow the REQUIRED STRUCTURE exactly. Do not add a second current-state report, architecture recap, methodology, vendor landscape, or implementation manual.`,
      `- Use compact tables and the required exhibits to carry detail; keep prose focused on decisions, implications, trade-offs, controls, and open inputs.`,
      `- Summarize inherited upstream decisions once and link the design to them. Never reproduce whole predecessor sections.`,
      `- Consolidate risks and missing inputs rather than repeating them in every section.`,
      `- Before returning, delete repetition, generic framework exposition, and any subsection that does not change the decision or execution understanding.`,
    ].join("\n");
  }
  return [
    `CONCISE APPROVAL-INSTRUMENT RULES:`,
    `- The entire body must stay within ${qb.targetBodyWordsMax.toLocaleString()} words; target 900–1,100 when the evidence is rich.`,
    `- Obey every per-section word budget in the REQUIRED STRUCTURE.`,
    `- Use compact Markdown tables for scope, roles, value hypothesis, risks, and P2 handoff.`,
    `- Do not include a cover letter, table of contents, appendix narrative, methodology explanation, or repeated source summaries.`,
    `- Do not write P2 current-state findings, P3 solution design, P4 economics, or implementation planning here.`,
  ].join("\n");
}

function extractSectionWordBudget(text?: string): number | null {
  if (!text) return null;
  const match = text.match(/under\s+(\d+)\s+words/i);
  if (!match) return null;
  const n = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function conciseSectionDraftInstruction(
  req: DeliverableIntelligenceRequest,
  brief: DeliverableArtifactBrief,
  section?: PlannedSection,
): string {
  const qb = req.qualityBar;
  if (!qb.enforceMaxAsBlocker || !qb.targetBodyWordsMax) return "";
  const structureSection = brief.recommendedStructure.find(
    (s) => s.key === section?.key,
  );
  const sectionInstruction =
    structureSection?.expertLatitude || section?.rationale || "";
  const sectionCount = Math.max(brief.recommendedStructure.length, 1);
  const fallbackBudget = Math.max(
    120,
    Math.floor(qb.targetBodyWordsMax / sectionCount),
  );
  const wordBudget =
    extractSectionWordBudget(sectionInstruction) ?? fallbackBudget;

  if (req.deliverableType !== "charter") {
    return [
      `ENFORCED SECTION-SIZE RULES:`,
      `- Hard cap for this section: ${wordBudget} body words.`,
      `- Section-specific instruction: ${sectionInstruction || "stay concise and decision-oriented"}.`,
      `- Use one compact table or exhibit when it carries the detail more clearly than prose.`,
      `- Do not repeat the recommendation, inherited architecture, evidence summary, risks, open inputs, or predecessor-document narrative unless this section changes their implication.`,
      `- Do not add subsections beyond what is necessary to answer this section's decision question.`,
      `- Before returning, delete any sentence that does not advance the design, trade-off, control, accountability, or decision this section exists to explain.`,
    ].join("\n");
  }

  return [
    `CONCISE SECTION RULES:`,
    `- This is one section of a concise approval instrument, not a standalone report.`,
    `- Hard cap for this section: ${wordBudget} body words.`,
    `- Section-specific instruction: ${sectionInstruction || "stay concise and decision-oriented"}.`,
    `- Use one compact table OR up to 4 tight bullets when it saves words; otherwise use one short paragraph.`,
    `- Do not repeat the full source summary, methodology, background, appendix material, or boilerplate.`,
    `- Do not write P2 current-state findings, P3 solution design, P4 economics, or implementation planning here.`,
    `- Before returning, delete any sentence that does not help approve, caveat, or hold the P1 Charter decision.`,
  ].join("\n");
}

const PLAN_SCHEMA_HINT = `Return ONLY JSON matching DeliverableGenerationPlan:
{ "sectionPlan":[{"key","title","groundingMode","evidenceCitations":[n],"assumptionsUsed":[],"placeholders":[],"rationale"}],
  "evidenceMapping":[{"citationNumber","usedInSections":[],"supportsClaim"}],
  "missingEvidenceHandling":[{"evidenceFamily","handledAs","note"}],
  "artifactEnhancementSuggestions":[{"suggestion","addsSectionOrExhibit","rationale"}],
  "tableAndExhibitPlan":[{"key","title","kind":"table|exhibit","targetFormat","groundingMode"}],
  "clientCompletePlan":[{"key","label","owner","placement"}],
  "outputPackagePlan":[{"format","contents"}] }`;

const SECTION_SCHEMA_HINT = `Return ONLY JSON for THIS ONE section:
{ "key","title","bodyMarkdown","groundingMode","citationsUsed":[n] }`;

const SYNTHESIS_SCHEMA_HINT = `Return ONLY JSON (the document-level executive layer):
{ "title","subtitle","recommendation","nextActions":[],
  "tables":[{"key","title","columns":[],"rows":[[]],"targetFormat":"docx"}],
  "clientCompleteChecklist":[{"key","label","owner","reason":"client_judgment|legal_review|procurement_signoff|pricing_signoff","placeholderText"}] }
Reason is an internal enum for workflow routing; do not copy snake_case reason codes into narrative prose, tables, or placeholder text.`;

const RENDER_SCHEMA_HINT = `Return ONLY JSON matching RenderableDeliverable:
{ "title","subtitle","clientDisplayName","initiativeDisplayName",
  "generatedSections":[{"key","title","bodyMarkdown","groundingMode","citationsUsed":[n]}],
  "tables":[{"key","title","columns":[],"rows":[[]],"targetFormat"}],
  "exhibits":[{"key","title","kind","description","targetFormat"}],
  "sourceRegister":[{"citationNumber","label","evidenceFamily","confidence","asOf"}],
  "assumptions":[...], "clientCompleteChecklist":[...], "recommendation", "nextActions":[] }`;

export interface PassInputs {
  req: DeliverableIntelligenceRequest;
  brief: DeliverableArtifactBrief;
  evidence: GovernedEvidenceItem[];
  /** prior-pass outputs threaded into later passes. */
  approvedPlanJson?: string;
  draftMarkdown?: string;
  critiqueText?: string;
  revisedDraftMarkdown?: string;
  /** decomposed: the single section this call drafts. */
  section?: PlannedSection;
  /** decomposed: all section titles+intent, so an independent section stays coherent. */
  outlineSummary?: string;
  /** decomposed: section summaries fed to the synthesis pass. */
  sectionDrafts?: { title: string; summary: string }[];
}

export function buildPassPrompt(
  pass: GenerationPass,
  inputs: PassInputs,
): PassPrompt {
  const { req, brief, evidence } = inputs;
  const highStakes = req.qualityBar.tone === "board_grade_consulting";
  const system = buildSystemPrompt(req);
  const context = buildContextBlock(req, brief, evidence);
  let user = "";

  switch (pass) {
    case "architect": {
      // The plan gate (validateGenerationPlan) auto-rejects plans that cite a
      // non-existent evidence number or mark a section governed_facts/mixed
      // without grounding it. The architect is an LLM and freelances both, so
      // state the gate's rules explicitly (with the exact valid citation numbers)
      // — this makes the plan reliably gate-valid instead of a non-deterministic
      // ~1-in-4 pass.
      const validCitations = evidence.map((e) => e.citationNumber);
      const citationList =
        validCitations.length > 0
          ? validCitations.map((n) => `[${n}]`).join(", ")
          : "(none — there is NO governed evidence; do not cite any [n])";
      const planValidityRules = [
        `PLAN VALIDITY RULES — your plan is AUTO-REJECTED (and the whole job fails) if you break any of these, so follow them exactly:`,
        `1. evidenceCitations may use ONLY these citation numbers, which are the ones present in AVAILABLE GOVERNED EVIDENCE: ${citationList}. NEVER invent or cite any number outside this set.`,
        `2. For EVERY section whose groundingMode is "governed_facts" or "mixed", you MUST populate at least one of: evidenceCitations (a valid number above), assumptionsUsed, or placeholders. A governed_facts/mixed section with all three empty would fabricate client facts and is rejected.`,
        `3. If a section carries no client-specific facts (pure expert framing, methodology, narrative, or standard boilerplate), set its groundingMode to "expert_template" — those need no citations, assumptions, or placeholders.`,
        `4. Prefer "expert_template" for any section you cannot ground with the evidence/assumptions/placeholders above, rather than marking it governed_facts/mixed and leaving it ungrounded.`,
      ].join("\n");
      const architectInstruction = brief.fixedStructure
        ? `PASS 1 — ARTIFACT ARCHITECT. Produce a generation plan for this fixed-structure deliverable. Use exactly the REQUIRED STRUCTURE keys from the context block, in the same order. Do NOT add, split, rename, or duplicate sections. You may improve the rationale within each required section, but the outline itself is locked. DO NOT draft the full document yet.`
        : `PASS 1 — ARTIFACT ARCHITECT. Design the best possible structure for this deliverable. Use your expert knowledge of consulting, technology strategy, sourcing, transformation, and executive decision-making. Identify required sections, optional sections, exhibits, tables, and placeholders. Propose enhancements beyond the baseline structure where they raise quality. DO NOT draft the full document yet.`;
      user = [
        context,
        ``,
        architectInstruction,
        ``,
        planValidityRules,
        ``,
        PLAN_SCHEMA_HINT,
      ].join("\n");
      break;
    }
    case "evidence_grounding":
      user = [
        context,
        ``,
        `PASS 2 — EVIDENCE GROUNDING. Here is the approved plan:`,
        inputs.approvedPlanJson ?? "(plan missing)",
        ``,
        `For EACH planned section, state precisely: what is supported by governed evidence (with [n]), what is missing, what must be client-to-complete, and what is standard expert/template content. Return the updated evidenceMapping + missingEvidenceHandling arrays of the plan as JSON.`,
      ].join("\n");
      break;
    case "full_draft":
      user = [
        context,
        ``,
        `PASS 3 — FULL DRAFT. Using the approved plan below, write the FULL document in senior consulting style. Use governed evidence (cited [n]) for client facts; use expert knowledge for structure, framing, standard sections, exhibits, and professional language. Clearly mark every missing client fact with the correct placeholder tag. Include the required decision tables, risk/issues/dependencies table, client-to-complete checklist, evidence appendix/register, and a clear recommendation with next steps. Write in Markdown with numbered headings. Apply citation and evidence rules silently; do not describe those authoring rules in the document body.`,
        conciseInstrumentDraftInstruction(req),
        `APPROVED PLAN:`,
        inputs.approvedPlanJson ?? "(plan missing)",
      ].join("\n");
      break;
    case "red_team":
      user = [
        `Review the following ${req.deliverableType.replace(/_/g, " ")} draft as a skeptical senior McKinsey partner and CIO advisor preparing it for a board steering committee.`,
        `Identify, specifically and section by section: weak or generic language, missing exhibits/tables, UNSUPPORTED client claims (facts asserted without a [n] citation, an approved assumption, or a placeholder), unclear or missing decisions, thin synthesis, poor formatting, and any place client input is required but not flagged. Also flag if the draft followed the template too mechanically or is too short for a board-grade artifact.`,
        `Be concrete and prescriptive — name the section and the fix. Do not rewrite; produce a critique.`,
        ``,
        `DRAFT:`,
        inputs.draftMarkdown ?? "(draft missing)",
      ].join("\n");
      break;
    case "board_grade_rewrite":
      user = [
        context,
        ``,
        `PASS 5 — BOARD-GRADE REWRITE. Revise the draft to board-grade quality using the critique. Strengthen synthesis, implications, the decision ask, tables, exhibits, placeholders, and source discipline. Remove generic language and mechanical template-following. Replace any P0/P1/P2/P3/P4/P5 shorthand in body prose with human phase names, and reserve "Source Register" for the appendix/evidence-register heading only. Apply citation and evidence rules silently: remove any sentence that explains those authoring rules or says claims are tied to a Source Register or evidence register. Replace "authorized to build", "not authorized", and "not authorized to build" with executive decision language such as "in scope for delivery", "hold the investment decision", or "requires further validation". DO NOT add unsupported client facts — every client-specific claim stays cited, an approved assumption, or a placeholder. Return the full revised document in Markdown.`,
        conciseInstrumentDraftInstruction(req),
        ``,
        `CRITIQUE TO ADDRESS:`,
        inputs.critiqueText ?? "(critique missing)",
        ``,
        `CURRENT DRAFT:`,
        inputs.draftMarkdown ?? "(draft missing)",
      ].join("\n");
      break;
    case "render_package":
      user = [
        `Convert the final board-grade document into the structured render package below. Preserve all content, citations [n], placeholders, tables, exhibits, assumptions, the client-to-complete checklist, the recommendation, and next actions. Keep evidence traceability in the appendix/register, not repeated in the narrative body. Wide datasets should be expressed as tables with targetFormat "xlsx".`,
        RENDER_SCHEMA_HINT,
        ``,
        `FINAL DOCUMENT:`,
        inputs.revisedDraftMarkdown ??
          inputs.draftMarkdown ??
          "(document missing)",
      ].join("\n");
      break;
    case "section_draft": {
      const s = inputs.section;
      const assigned =
        evidence.length > 0
          ? evidence
              .map((e) => `[${e.citationNumber}] ${e.label}: ${e.statement}`)
              .join("\n")
          : "(no evidence assigned to this section — cite nothing; tag any client fact as a placeholder)";
      user = [
        context,
        ``,
        `FULL OUTLINE (for coherence only — do NOT write any other section):`,
        inputs.outlineSummary ?? "",
        ``,
        `WRITE ONLY THIS SECTION: "${s?.title ?? ""}"  (groundingMode: ${s?.groundingMode ?? "expert_template"}).`,
        `Intent: ${s?.rationale || s?.title || ""}`,
        conciseSectionDraftInstruction(req, brief, s),
        `Write board-grade, senior-consulting Markdown for JUST this section (numbered sub-headings, tables/lists as needed). Use ONLY the assigned evidence below, cited [n]. For any client-specific number / $ / % / date you cannot ground, write [ASSUMPTION TO VALIDATE: <what>] or describe the required input for the Open Inputs Required table — NEVER invent. Before returning, verify EVERY figure has a [n], an approved assumption, or a placeholder tag.`,
        ``,
        `ASSIGNED EVIDENCE (the only [n] you may cite):`,
        assigned,
        ``,
        SECTION_SCHEMA_HINT,
      ].join("\n");
      break;
    }
    case "synthesis": {
      const summaries = (inputs.sectionDrafts ?? [])
        .map((d) => `## ${d.title}\n${d.summary}`)
        .join("\n\n");
      user = [
        `You are assembling the EXECUTIVE LAYER of a ${req.deliverableType.replace(/_/g, " ")} for ${req.clientDisplayName} from its drafted sections (summaries below). Produce ONLY the document-level structured fields as JSON — do not rewrite the sections.`,
        `Requirements: "recommendation" is 2–3 sentences stating the decision ask. "nextActions" is 3–6 concrete items. "tables" MUST include a risk/issues/dependencies table (key:"risk_register", title:"Risk / Issues / Dependencies", columns + rows). "clientCompleteChecklist" lists what the client must still provide. Do NOT introduce unsupported client facts — any figure needs a [n], an approved assumption, or a placeholder tag.`,
        SYNTHESIS_SCHEMA_HINT,
        ``,
        `SECTION SUMMARIES:`,
        summaries,
      ].join("\n");
      break;
    }
  }

  return {
    pass,
    system,
    user,
    maxTokens: resolvePassTokenBudget({
      pass,
      deliverableType: req.deliverableType,
      highStakes,
    }),
    highStakes,
  };
}

/** The ordered six-pass sequence. */
export const GENERATION_PASSES: GenerationPass[] = [
  "architect",
  "evidence_grounding",
  "full_draft",
  "red_team",
  "board_grade_rewrite",
  "render_package",
];
