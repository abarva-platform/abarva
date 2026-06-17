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
} from './types';
import { renderEvidenceForPrompt } from './source-register';
import type { GovernedEvidenceItem } from './types';
import { resolvePassTokenBudget } from '@/lib/ai/document-generation-policy';

const USE_CASE_TITLE: Record<string, string> = {
  AMS_IT_OUTSOURCING: 'application management services and IT outsourcing',
  ERP_SI_SELECTION: 'ERP and systems-integrator selection',
  CLOUD_MODERNIZATION: 'cloud modernization and migration',
  AI_PDLC: 'the AI-powered product development lifecycle',
};

function describeUseCase(archetype: string): string {
  return USE_CASE_TITLE[archetype] ?? archetype.replace(/_/g, ' ').toLowerCase();
}

/** The standing role + governance system prompt shared by every pass. */
export function buildSystemPrompt(req: DeliverableIntelligenceRequest): string {
  const expertise = describeUseCase(req.useCaseArchetype);
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
    `- Where a client fact is missing, write [EVIDENCE MISSING: <what>], [ASSUMPTION TO VALIDATE: <what>], or [CLIENT TO COMPLETE: <what>] — never fabricate.`,
    `- Never expose internal source ids, chunk ids, table names, fact keys, or system status words in the body.`,
    `- Do not optimize for short documents. Optimize for high-quality, decision-grade artifacts.`,
  ].join('\n');
}

/** The shared context block (mission → formatting) injected into the generation passes. */
function buildContextBlock(
  req: DeliverableIntelligenceRequest,
  brief: DeliverableArtifactBrief,
  evidence: GovernedEvidenceItem[],
): string {
  const audience = req.audience.join(', ');
  const missing =
    req.missingEvidence.length === 0
      ? '(none flagged)'
      : req.missingEvidence
          .map((m) => `- ${m.label} (${m.evidenceFamily}): ${m.whyItMatters} → ${m.completionPath}`)
          .join('\n');
  const clientComplete =
    req.clientCompleteItems.length === 0
      ? '(none)'
      : req.clientCompleteItems.map((c) => `- ${c.label} [owner: ${c.owner}; ${c.reason}]`).join('\n');
  const assumptions =
    req.approvedAssumptions.length === 0
      ? '(none approved)'
      : req.approvedAssumptions
          .map((a) => `- ${a.statement} (basis: ${a.basis}${a.mustValidate ? '; VALIDATE' : ''})`)
          .join('\n');

  return [
    `MISSION: Create the best possible ${req.deliverableType.replace(/_/g, ' ')} for ${req.clientDisplayName} — initiative "${req.initiativeDisplayName}" — for ${audience} to support this decision:`,
    `  ${req.decisionContext}`,
    ``,
    `EXPERT LATITUDE: Use your expert knowledge to design the best artifact for this use case. You are NOT limited to the minimum sections — add sections, exhibits, tables, and decision views if they materially improve the artifact. ${brief.allowedExpertKnowledge}`,
    ``,
    `GOVERNANCE BOUNDARY: ${brief.disallowedFabrication} ${brief.citationPolicy}`,
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
    `RECOMMENDED STRUCTURE (a senior consultant's baseline — improve on it):`,
    brief.recommendedStructure.map((s, i) => `  ${i + 1}. ${s.title} — ${s.intent} [${s.groundingMode}]`).join('\n'),
    ``,
    `EXPECTED EXHIBITS: ${brief.expectedExhibits.map((e) => e.title).join('; ') || '(use judgment)'}`,
    `EXPECTED TABLES: ${brief.expectedTables.map((t) => t.title).join('; ') || '(use judgment)'}`,
    ``,
    `QUALITY BAR: ${brief.qualityCriteria.join(' ')} Output must read like a board-grade consulting artifact, not an LLM draft. Strengthen synthesis, implications, and the decision ask.`,
    ``,
    `FORMATTING: ${brief.formattingInstructions} Body ≈ ${req.formattingProfile.bodyPointSize}pt. ${req.formattingProfile.wideDataToExcelCompanion ? 'Move wide datasets into an Excel companion exhibit rather than tiny in-document tables.' : ''} Output formats: ${req.outputFormats.join(', ')}.`,
  ].join('\n');
}

const PLAN_SCHEMA_HINT = `Return ONLY JSON matching DeliverableGenerationPlan:
{ "sectionPlan":[{"key","title","groundingMode","evidenceCitations":[n],"assumptionsUsed":[],"placeholders":[],"rationale"}],
  "evidenceMapping":[{"citationNumber","usedInSections":[],"supportsClaim"}],
  "missingEvidenceHandling":[{"evidenceFamily","handledAs","note"}],
  "artifactEnhancementSuggestions":[{"suggestion","addsSectionOrExhibit","rationale"}],
  "tableAndExhibitPlan":[{"key","title","kind":"table|exhibit","targetFormat","groundingMode"}],
  "clientCompletePlan":[{"key","label","owner","placement"}],
  "outputPackagePlan":[{"format","contents"}] }`;

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
}

export function buildPassPrompt(pass: GenerationPass, inputs: PassInputs): PassPrompt {
  const { req, brief, evidence } = inputs;
  const highStakes = req.qualityBar.tone === 'board_grade_consulting';
  const system = buildSystemPrompt(req);
  const context = buildContextBlock(req, brief, evidence);
  let user = '';

  switch (pass) {
    case 'architect': {
      // The plan gate (validateGenerationPlan) auto-rejects plans that cite a
      // non-existent evidence number or mark a section governed_facts/mixed
      // without grounding it. The architect is an LLM and freelances both, so
      // state the gate's rules explicitly (with the exact valid citation numbers)
      // — this makes the plan reliably gate-valid instead of a non-deterministic
      // ~1-in-4 pass.
      const validCitations = evidence.map((e) => e.citationNumber);
      const citationList =
        validCitations.length > 0
          ? validCitations.map((n) => `[${n}]`).join(', ')
          : '(none — there is NO governed evidence; do not cite any [n])';
      const planValidityRules = [
        `PLAN VALIDITY RULES — your plan is AUTO-REJECTED (and the whole job fails) if you break any of these, so follow them exactly:`,
        `1. evidenceCitations may use ONLY these citation numbers, which are the ones present in AVAILABLE GOVERNED EVIDENCE: ${citationList}. NEVER invent or cite any number outside this set.`,
        `2. For EVERY section whose groundingMode is "governed_facts" or "mixed", you MUST populate at least one of: evidenceCitations (a valid number above), assumptionsUsed, or placeholders. A governed_facts/mixed section with all three empty would fabricate client facts and is rejected.`,
        `3. If a section carries no client-specific facts (pure expert framing, methodology, narrative, or standard boilerplate), set its groundingMode to "expert_template" — those need no citations, assumptions, or placeholders.`,
        `4. Prefer "expert_template" for any section you cannot ground with the evidence/assumptions/placeholders above, rather than marking it governed_facts/mixed and leaving it ungrounded.`,
      ].join('\n');
      user = [
        context,
        ``,
        `PASS 1 — ARTIFACT ARCHITECT. Design the best possible structure for this deliverable. Use your expert knowledge of consulting, technology strategy, sourcing, transformation, and executive decision-making. Identify required sections, optional sections, exhibits, tables, and placeholders. Propose enhancements beyond the baseline structure where they raise quality. DO NOT draft the full document yet.`,
        ``,
        planValidityRules,
        ``,
        PLAN_SCHEMA_HINT,
      ].join('\n');
      break;
    }
    case 'evidence_grounding':
      user = [
        context,
        ``,
        `PASS 2 — EVIDENCE GROUNDING. Here is the approved plan:`,
        inputs.approvedPlanJson ?? '(plan missing)',
        ``,
        `For EACH planned section, state precisely: what is supported by governed evidence (with [n]), what is missing, what must be client-to-complete, and what is standard expert/template content. Return the updated evidenceMapping + missingEvidenceHandling arrays of the plan as JSON.`,
      ].join('\n');
      break;
    case 'full_draft':
      user = [
        context,
        ``,
        `PASS 3 — FULL DRAFT. Using the approved plan below, write the FULL document in senior consulting style. Use governed evidence (cited [n]) for client facts; use expert knowledge for structure, framing, standard sections, exhibits, and professional language. Clearly mark every missing client fact with the correct placeholder tag. Include decision tables, evidence tables, a risk/issues/dependencies table, a client-to-complete checklist, a source register, and a clear recommendation with next steps. Write in Markdown with numbered headings.`,
        `APPROVED PLAN:`,
        inputs.approvedPlanJson ?? '(plan missing)',
      ].join('\n');
      break;
    case 'red_team':
      user = [
        `Review the following ${req.deliverableType.replace(/_/g, ' ')} draft as a skeptical senior McKinsey partner and CIO advisor preparing it for a board steering committee.`,
        `Identify, specifically and section by section: weak or generic language, missing exhibits/tables, UNSUPPORTED client claims (facts asserted without a [n] citation, an approved assumption, or a placeholder), unclear or missing decisions, thin synthesis, poor formatting, and any place client input is required but not flagged. Also flag if the draft followed the template too mechanically or is too short for a board-grade artifact.`,
        `Be concrete and prescriptive — name the section and the fix. Do not rewrite; produce a critique.`,
        ``,
        `DRAFT:`,
        inputs.draftMarkdown ?? '(draft missing)',
      ].join('\n');
      break;
    case 'board_grade_rewrite':
      user = [
        context,
        ``,
        `PASS 5 — BOARD-GRADE REWRITE. Revise the draft to board-grade quality using the critique. Strengthen synthesis, implications, the decision ask, tables, exhibits, placeholders, and source discipline. Remove generic language and mechanical template-following. DO NOT add unsupported client facts — every client-specific claim stays cited, an approved assumption, or a placeholder. Return the full revised document in Markdown.`,
        ``,
        `CRITIQUE TO ADDRESS:`,
        inputs.critiqueText ?? '(critique missing)',
        ``,
        `CURRENT DRAFT:`,
        inputs.draftMarkdown ?? '(draft missing)',
      ].join('\n');
      break;
    case 'render_package':
      user = [
        `Convert the final board-grade document into the structured render package below. Preserve all content, citations [n], placeholders, tables, exhibits, the source register, assumptions, the client-to-complete checklist, the recommendation, and next actions. Wide datasets should be expressed as tables with targetFormat "xlsx".`,
        RENDER_SCHEMA_HINT,
        ``,
        `FINAL DOCUMENT:`,
        inputs.revisedDraftMarkdown ?? inputs.draftMarkdown ?? '(document missing)',
      ].join('\n');
      break;
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
  'architect',
  'evidence_grounding',
  'full_draft',
  'red_team',
  'board_grade_rewrite',
  'render_package',
];
