import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  CHARTER_CONTRACT,
  CHARTER_PLACEHOLDER_LABELS,
  P3_P4_WORD_BAND_CONTRACTS,
} from "@/lib/deliverables/shared/artifact-contracts";
import { EXECUTIVE_ROADMAP_REFERENCE } from "@/lib/deliverables/shared/reference-library/executive-roadmap-reference";
import { roadmapStructuredOutputInstruction } from "@/lib/deliverables/roadmap-structured-output";
import type { GenerationMode } from "@/lib/programs/assert-phase-ready";
import { renderPhaseDeliverablePackagePrompt } from "@/lib/programs/phase-deliverable-package-contract";
import type { SolutionContext } from "@/lib/programs/solution-context";
import {
  exactEvidenceTermsForGoldenBar,
  taxonomyTermsForGoldenBar,
} from "./evidence-specificity";

export const STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC =
  "docs/design/strategic-moves/ARTIFACT_GENERATION_STANDARD.md";

// The draft caveat intro must NOT assert specific upstream items ("sponsor
// assignment, charter signoff") as still-outstanding — those may already be
// complete, and printing them as open on a governed artifact is a false
// governance statement (see the roadmap governed-artifact-sync review). The
// intro states only the one thing a draft always means: it is a pre-exit-gate
// review draft, not final until this phase's exit gate is approved. The
// concrete, currently-open items are appended separately from real gate state
// (see `formatDraftCaveatText`).
export const STRATEGIC_MOVES_DRAFT_CAVEAT =
  "This is a pre-exit-gate review draft generated from the approved evidence and captured inputs for this phase. It is intended for sponsor review and refinement, and is not final or board-ready until this phase's exit gate is approved.";

export const STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS = [
  "kernel",
  "function-pack",
  "generated-pack",
  "source row",
  "raw route",
  "blob path",
  "tenant key",
  "debug",
  "canonical internal id",
  "prompt",
  "model call",
  "implementation detail",
] as const;

export const P3_FUTURE_STATE_FORBIDDEN_ARTIFACT_TERMS = [
  "kernel",
  "function-pack",
  "generated-pack",
  "source row",
  "raw route",
  "blob path",
  "tenant key",
  "debug",
  "canonical internal id",
  "prompt",
  "model call",
  "AbarVa implements",
  "AbarVa executes",
  "AbarVa performs detailed process redesign",
  "AbarVa owns implementation",
  "AbarVa owns training rollout",
  "AbarVa automates the process end to end",
  "final design approved",
  "final workflow design approved",
  "implementation is complete",
  "P2 final approved",
  "P3 final approved",
] as const;

export interface ArtifactDepthStandard {
  targetWords: string;
  minWords: number;
  maxTokens: number;
  /**
   * A hard word ceiling distinct from the target range's upper bound (e.g.
   * target "900-1,100" but a hard maximum of 1,300 to allow headroom before
   * blocking). When absent, `maximumWordCountForArtifact` falls back to the
   * target range's own upper bound, as before.
   */
  hardMaxWords?: number;
}

/**
 * Builds an `ArtifactDepthStandard` from the shared P3/P4 word-band contract
 * (artifact-contracts.ts), so this pipeline can never drift from the
 * orchestrator's numbers again the way it did before the 2026-07-25
 * reconciliation (see P3_P4_WORD_BAND_CONTRACTS's own comment for the
 * contradictions that were found).
 */
function depthFromWordBand(
  key: keyof typeof P3_P4_WORD_BAND_CONTRACTS,
): ArtifactDepthStandard {
  const c = P3_P4_WORD_BAND_CONTRACTS[key];
  return {
    targetWords: `${c.minWords.toLocaleString()}-${c.targetWordsMax.toLocaleString()}`,
    minWords: c.minWords,
    maxTokens: c.maxOutputTokens,
    hardMaxWords: c.targetWordsMax,
  };
}

const DEPTH_BY_ARTIFACT: Partial<
  Record<DeliverableKey, ArtifactDepthStandard>
> = {
  // Word budget is read from the shared contract (src/lib/deliverables/
  // shared/artifact-contracts.ts) so it can never drift from the orchestrator
  // pipeline's copy again — see docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md.
  charter: {
    targetWords: `${CHARTER_CONTRACT.wordBudget.targetWords.min}-${CHARTER_CONTRACT.wordBudget.targetWords.max.toLocaleString()}`,
    minWords: CHARTER_CONTRACT.wordBudget.minWords,
    // Reconciled 2026-07-25: 4,000 tokens is generous enough for structured
    // content/tables well above the 1,300-word hard ceiling, without being
    // unbounded — unbounded raises latency, cost, and the odds of
    // over-generation followed by truncation/rejection. Read from the shared
    // contract so it can't drift from the orchestrator pipeline's copy again.
    maxTokens: CHARTER_CONTRACT.maxOutputTokens,
    hardMaxWords: CHARTER_CONTRACT.wordBudget.hardMaxWords,
  },
  discovery_report: {
    targetWords: "3,000-5,000",
    minWords: 2500,
    maxTokens: 34000,
  },
  root_cause_worksheet: {
    targetWords: "1,500-2,500",
    minWords: 1200,
    maxTokens: 24000,
  },
  solution_approach_options: {
    targetWords: "2,000-3,500",
    minWords: 1500,
    maxTokens: 30000,
  },
  // Reconciled 2026-07-25 with the orchestrator's quality-bar-registry.ts —
  // this type's ceiling here (previously 6,000) sat BELOW the orchestrator's
  // own floor (9,000), a real contradiction. Ceiling now matches the shared
  // contract (16,000). Floor is deliberately NOT raised to the shared
  // contract's 9,000: this pipeline generates target_state_architecture in a
  // single pass (p3FutureStateAssignment), unlike the orchestrator's
  // decomposed multi-pass generator that the 9,000-word floor was designed
  // around — forcing that floor here broke real generation in
  // generate-artifact.test.ts. Revisit once this pipeline's single-pass
  // prompt is proven to reliably produce that much depth; until then, a
  // shorter-but-real single-pass architecture document is better than
  // padding to hit a floor the prompt wasn't built for.
  target_state_architecture: {
    ...depthFromWordBand("target_state_architecture"),
    minWords: 2_500,
  },
  solution_design: depthFromWordBand("solution_design"),
  operating_model_design: depthFromWordBand("operating_model_design"),
  sourcing_strategy: depthFromWordBand("sourcing_strategy"),
  // golden-bar's DeliverableKey name for the orchestrator's `roadmap` type.
  // Reconciled 2026-07-25 — this type's ceiling here (previously 5,000)
  // exactly equalled the orchestrator's own floor.
  execution_roadmap: depthFromWordBand("roadmap"),
  // Reconciled 2026-07-25 — same contradiction as execution_roadmap: this
  // type's ceiling here (previously 5,000) exactly equalled the
  // orchestrator's own floor.
  business_case: depthFromWordBand("business_case"),
  handoff_package: {
    targetWords: "2,500-4,000",
    minWords: 2000,
    maxTokens: 30000,
  },
  // golden-bar's DeliverableKey name for the orchestrator's `estimate_model`
  // type. Added 2026-07-25 — this pipeline had no depth standard for it at
  // all before this reconciliation (silently fell back to the generic
  // 1,200/1,800-3,000/24,000 default).
  financial_model: depthFromWordBand("estimate_model"),
  // golden-bar's DeliverableKey name for the orchestrator's `value_model`
  // type. Added 2026-07-25 for the same reason as financial_model above.
  tower_metrics_plan: depthFromWordBand("value_model"),
  readiness_and_change_plan: depthFromWordBand("readiness_and_change_plan"),
};

export function depthStandardForArtifact(
  artifact: DeliverableKey,
): ArtifactDepthStandard {
  return (
    DEPTH_BY_ARTIFACT[artifact] ?? {
      targetWords: "1,800-3,000",
      minWords: 1200,
      maxTokens: 24000,
    }
  );
}

export function modelTokenBudgetForArtifact(artifact: DeliverableKey): number {
  return depthStandardForArtifact(artifact).maxTokens;
}

/** Parses the upper bound of a "700-1,200" style target-word range. */
function maxWordsFromTargetRange(targetWords: string): number | undefined {
  const numbers = targetWords.match(/[\d,]+/g);
  if (!numbers?.length) return undefined;
  const last = numbers[numbers.length - 1];
  if (!last) return undefined;
  const parsed = Number(last.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function maximumWordCountForArtifact(
  artifact: DeliverableKey,
): number | undefined {
  const standard = depthStandardForArtifact(artifact);
  return standard.hardMaxWords ?? maxWordsFromTargetRange(standard.targetWords);
}

export function premiumGoldenBarOptionsForArtifact(
  artifact: DeliverableKey,
  context?: SolutionContext,
): {
  minimumWordCount?: number;
  maximumWordCount?: number;
  enforceMaximumWordCount?: boolean;
  advisoryMaximumWordCount?: number;
  forbiddenContentPatterns?: readonly RegExp[];
  titleRule?: {
    genericForbiddenPatterns: readonly RegExp[];
    minWords: number;
  };
  forbiddenLanguage?: readonly string[];
  requiredExactEvidenceTerms?: readonly string[];
  requiredTaxonomyTerms?: readonly string[];
  forbidClientFacingRawIds?: boolean;
} {
  // A concision ceiling applies to every artifact type; concise executive
  // artifacts opt into enforcement once their rendered wrapper overhead is known.
  const maximumWordCount = maximumWordCountForArtifact(artifact);
  // Which golden-bar DeliverableKey maps to which shared P3_P4_WORD_BAND_CONTRACTS
  // entry — the two pipelines use different names for the same artifact type
  // (e.g. golden-bar's `execution_roadmap` is the orchestrator's `roadmap`).
  const WORD_BAND_KEY_BY_ARTIFACT: Partial<
    Record<DeliverableKey, keyof typeof P3_P4_WORD_BAND_CONTRACTS>
  > = {
    target_state_architecture: "target_state_architecture",
    solution_design: "solution_design",
    operating_model_design: "operating_model_design",
    sourcing_strategy: "sourcing_strategy",
    business_case: "business_case",
    execution_roadmap: "roadmap",
    financial_model: "estimate_model",
    tower_metrics_plan: "value_model",
  };
  const wordBand = WORD_BAND_KEY_BY_ARTIFACT[artifact]
    ? P3_P4_WORD_BAND_CONTRACTS[WORD_BAND_KEY_BY_ARTIFACT[artifact]!]
    : undefined;
  // Reconciled 2026-07-25: enforcement now matches the orchestrator's
  // enforceMaxAsBlocker exactly for every P3/P4 type with a shared contract —
  // previously this golden-bar whitelist silently disagreed with the
  // orchestrator for business_case/execution_roadmap (informational here,
  // hard-blocking there).
  const enforceMaximumWordCount =
    artifact === "charter" ? true : (wordBand?.enforceMaxAsBlocker ?? false);
  const advisoryMaximumWordCount =
    artifact === "charter"
      ? CHARTER_CONTRACT.wordBudget.advisoryMaxWords
      : wordBand?.advisoryMaxWords;

  if (artifact === "charter" || artifact === "discovery_report") {
    return {
      minimumWordCount: depthStandardForArtifact(artifact).minWords,
      maximumWordCount,
      enforceMaximumWordCount,
      ...(advisoryMaximumWordCount ? { advisoryMaximumWordCount } : {}),
      forbiddenLanguage: STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS,
      ...(artifact === "discovery_report" && context
        ? {
            requiredExactEvidenceTerms: exactEvidenceTermsForGoldenBar(context),
            requiredTaxonomyTerms: taxonomyTermsForGoldenBar(context),
            forbidClientFacingRawIds: true,
          }
        : {}),
    };
  }
  if (artifact === "target_state_architecture") {
    return {
      minimumWordCount: depthStandardForArtifact(artifact).minWords,
      maximumWordCount,
      forbiddenLanguage: P3_FUTURE_STATE_FORBIDDEN_ARTIFACT_TERMS,
      ...(context
        ? {
            requiredExactEvidenceTerms: exactEvidenceTermsForGoldenBar(context),
            requiredTaxonomyTerms: taxonomyTermsForGoldenBar(context),
            forbidClientFacingRawIds: true,
          }
        : {}),
    };
  }
  if (
    artifact === "solution_design" ||
    artifact === "operating_model_design" ||
    artifact === "sourcing_strategy"
  ) {
    return {
      minimumWordCount: depthStandardForArtifact(artifact).minWords,
      maximumWordCount,
      enforceMaximumWordCount,
      ...(advisoryMaximumWordCount ? { advisoryMaximumWordCount } : {}),
      forbiddenLanguage: P3_FUTURE_STATE_FORBIDDEN_ARTIFACT_TERMS,
      ...(context
        ? {
            requiredExactEvidenceTerms: exactEvidenceTermsForGoldenBar(context),
            requiredTaxonomyTerms: taxonomyTermsForGoldenBar(context),
            forbidClientFacingRawIds: true,
          }
        : {}),
    };
  }
  // Every branch above already forbids internal implementation language from
  // leaking into a client-facing artifact (kernel/tenant-key/prompt/etc. —
  // STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS). Artifacts that fall through to
  // here (root_cause_worksheet, solution_approach_options, execution_roadmap,
  // business_case, handoff_package) got no such check at all — an oversight,
  // not an intentional exemption; there is no artifact type where leaking
  // "tenant key" or "canonical internal id" into client-facing prose is ever
  // acceptable.
  return {
    maximumWordCount,
    enforceMaximumWordCount,
    ...(advisoryMaximumWordCount ? { advisoryMaximumWordCount } : {}),
    forbiddenLanguage: STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS,
    // REF_EXECUTIVE_ROADMAP pilot (2026-07-25) — mirrors the orchestrator's
    // forbiddenContentPatterns for the same artifact type, so both pipelines
    // flag the same "this reads like an implementation schedule" signal.
    ...(artifact === "execution_roadmap"
      ? {
          forbiddenContentPatterns:
            EXECUTIVE_ROADMAP_REFERENCE.forbiddenPatterns,
          titleRule: {
            genericForbiddenPatterns:
              EXECUTIVE_ROADMAP_REFERENCE.titleRule
                .genericTitleForbiddenPatterns,
            minWords: EXECUTIVE_ROADMAP_REFERENCE.titleRule.minTitleWords,
          },
        }
      : {}),
  };
}

function list(values: readonly string[] | undefined, fallback: string): string {
  if (!values?.length) return `[MISSING — ${fallback}]`;
  return values.map((value) => `- ${value}`).join("\n");
}

function claimClassificationBlock(): string {
  return `EVIDENCE-BOUND WRITING RULE
Classify substantive claims naturally in the artifact:
- supported by uploaded evidence or extracted enterprise context
- inferred from evidence
- assumption for review
- missing evidence
- decision needed

Use client-facing language such as "current evidence supports", "stakeholder notes suggest",
"this remains an assumption until", and "this cannot be finalized until". Do not invent values,
ROI, named owners, sponsor approval, or control readiness.

NUMERIC AND DATE CLAIM RULE
- Every client-facing sentence containing a number, date, dollar amount, or percentage must include
  its supporting [n] citation in that same sentence.
- If the value is a planning hypothesis, label that sentence [ASSUMPTION TO VALIDATE].
- If the value is unknown, use [CLIENT TO COMPLETE] or [EVIDENCE MISSING]; do not estimate it.
- Do not print a generated-on date, target date, timeline, page count, maturity score, or percentage
  unless it is evidence-backed or explicitly labeled as an assumption.`;
}

function evidencePriorityRuleBlock(): string {
  return `EVIDENCE PRIORITY RULE
Concrete extracted evidence must be surfaced before advisory interpretation. Prioritize evidence in this order:
1. exact extracted metrics from uploaded evidence
2. structured CSV/XLSX summaries
3. stakeholder/process notes
4. policy/control evidence
5. systems landscape evidence
6. inferred observations
7. assumptions for review
8. general advisory pattern

If exact metrics, exception categories, owners, risk levels, or baseline figures are available,
use them in the executive summary, diagnostic tables, evidence matrix, and missing-input table.
Do not write a polished consulting document that fails to use the strongest available evidence.`;
}

function metricsThatMatterBlock(ctx: SolutionContext): string {
  if (!ctx.metricsThatMatter?.length)
    return "- [none extracted as first-class metrics]";
  return ctx.metricsThatMatter
    .map((metric) => {
      const parts = [
        `${metric.label}: ${metric.value}`,
        metric.source ? `source=${metric.source}` : undefined,
        metric.caveat ? `caveat=${metric.caveat}` : undefined,
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

function evidenceTaxonomyBlock(ctx: SolutionContext): string {
  if (!ctx.evidenceTaxonomy?.length)
    return "- [none extracted as first-class taxonomy]";
  return ctx.evidenceTaxonomy
    .map((item) => {
      const parts = [
        item.category,
        item.volume ? `volume=${item.volume}` : undefined,
        item.rate ? `rate=${item.rate}` : undefined,
        item.averageResolutionDays
          ? `avg_resolution_days=${item.averageResolutionDays}`
          : undefined,
        item.manualTouchHours
          ? `manual_touch_hours=${item.manualTouchHours}`
          : undefined,
        item.riskLevel ? `risk=${item.riskLevel}` : undefined,
        item.owner ? `owner=${item.owner}` : undefined,
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

function missingInputsActionBlock(ctx: SolutionContext): string {
  if (!ctx.clientActionableMissingInputs?.length)
    return "- [none promoted as client-actionable inputs]";
  return ctx.clientActionableMissingInputs
    .map(
      (input) =>
        `- Needed: ${input.needed} | why=${input.whyItMatters} | owner=${input.owner} | use=${input.howItWillBeUsed} | gate=${input.gateImpact}`,
    )
    .join("\n");
}

function clientMoveReference(ctx: SolutionContext): string {
  return (
    ctx.useCase ?? ctx.useCaseCandidate ?? ctx.problemSeed ?? "client move"
  );
}

function p1Assignment(): string {
  const wb = CHARTER_CONTRACT.wordBudget;
  const labels = CHARTER_PLACEHOLDER_LABELS;
  const requiredSections = CHARTER_CONTRACT.sections
    .map((s, i) => `${i + 1}. ${s.title} — ${s.intent}`)
    .join("\n");
  const presentationElements = CHARTER_CONTRACT.presentationElements
    .map((element, i) => `${i + 1}. ${element}`)
    .join("\n");
  return `PHASE-SPECIFIC ASSIGNMENT — P1 MOVE CHARTER
Create an executive Charter that authorizes and bounds the Discovery phase for this Move.

The Charter is a governance document. It authorizes the work, defines its purpose and boundaries,
aligns sponsors, and prepares the client for Discovery.

The Charter is not a diagnostic report, solution design, architecture document, business case,
implementation roadmap, or project plan.

Near the beginning of the Charter, include this statement verbatim:
"${CHARTER_CONTRACT.boundaryStatement}"

Required sections, in order:
${requiredSections}

For "${CHARTER_CONTRACT.sections[7]?.title}" specifically: this section prepares the client for
Discovery — it does not perform the assessment. Include an executive table (Area / What to Expect /
What We Need From You / Priority) covering Business Process, People & Governance, Technology, Data,
Performance, and Risk & Controls; then a second table of typical Discovery activities and their
typical duration (e.g. Executive Sponsor Session ~60 minutes, Business Process Workshop ~90 minutes,
Technology Review ~60 minutes, Data Review ~60 minutes, Validation & Readout ~60 minutes); then a
short closing paragraph noting that a detailed Discovery Guidebook, tailored to this Move, will be
generated after Charter approval — containing interview questionnaires, workshop agendas, guided
templates, evidence checklists, and data-capture instructions. Do not embed that detailed material
in the Charter itself.

You consume only approved P0 structured capture, approved enterprise context, approved evidence,
and explicit sponsor input. Never invent information that should have been collected in P0. Every
sentence in this Charter must be traceable to one of those sources. If a required section cannot be
populated from them, do not fabricate content for it — write one of these exact labels instead,
whichever fits:
- "${labels.clientDecisionRequired}" (a decision only the client/sponsor can make)
- "${labels.toValidateDuringDiscovery}" (something Discovery itself must confirm — not a risk you infer)
- "${labels.evidenceRequiredForP2}" (a fact that only P2 evidence collection can supply)
No Charter section should ever require P2 evidence to be considered complete — a section that is
honestly incomplete, labeled as above, is correct; a section that is confidently wrong is not.
Never invent current-state findings, root causes, architecture, solution recommendations,
technology selections, roadmaps, operating models, costs, benefits, named owners, dates, baselines,
or financial estimates. Do not use placeholder text such as [DATA GAP].
Every quantitative statement must include its evidence citation in the same sentence, or be
explicitly labeled as an assumption requiring validation.

Document presentation standard
Produce an executive-quality Charter designed for approximately ${CHARTER_CONTRACT.estimatedRenderedPages} pages.
- Target ${wb.targetWords.min}-${wb.targetWords.max.toLocaleString()} body words.
- Hard maximum ${wb.hardMaxWords.toLocaleString()} body words.
- Use concise executive prose, short paragraphs, and descriptive headings.
- Use no more than ${CHARTER_CONTRACT.maxSubstantiveTables} substantive tables.
- Prefer tables where they improve decision clarity; do not convert every section into a table.
- Keep table cells concise and scannable.
- Do not repeat the same information in prose and tables.
- Do not create empty rows, placeholder sections, or decorative content.

Required presentation elements:
${presentationElements}

Rendering requirements (content-level — exact border width, colors, fonts, margins, padding, cover
treatment, headers, and footers are enforced by the document renderer, not by you):
- Use clear section hierarchy and consistent heading levels.
- Use bordered tables with a distinct header row.
- Keep the document free of markdown symbols, raw HTML, code fences, and formatting instructions.
- Do not use excessive bolding, colored callouts, icons, or decorative graphics.
- Focus on producing concise, structured executive content rather than presentation markup.`;
}

function p2Assignment(): string {
  return `PHASE-SPECIFIC ASSIGNMENT — P2 CURRENT WORK DIAGNOSTIC
Purpose: diagnose how work runs today and what must be validated before solution design.
Do not jump to a fully designed future state. AI opportunities may be identified, but only after
the current work, handoffs, controls, data, policy, and ownership issues are clear.

The artifact must answer:
- how work is performed today
- where handoffs, delays, rework, leakage, risk, or exception types occur
- what works today and should be preserved
- what breaks, why it breaks, and the implication
- whether the issue is process, data, policy, control, ownership, AI-fit, or a mix
- what evidence supports the diagnosis
- what evidence is still needed before finalizing
- how the client organization works today: leadership, teams, decision rights, locations,
  workforce shape, ways of working, culture/adoption signals, and system/tool landscape
- what workshop/interview/session evidence supports the process narrative

Required structures:
- Metrics-backed Executive Diagnostic Summary
- Word-ready Current State Process Document structure with table of contents
- Organization / leadership / teams / ways-of-working narrative
- Workforce location and adoption/culture observations
- Current-State Handoff Map
- Exception Taxonomy
- Pain Point / Root Cause Matrix
- Process vs Data vs Policy vs Ownership vs AI Matrix
- Control Implications table
- Evidence Coverage table
- Next Evidence Request table
- Owner / Action Matrix
- Workshop Agenda and Session Notes appendix
- Derived Visualization Inventory that labels every AbarVa-generated process flow, diagram, chart,
  and table as derived from client-loaded evidence

P2 evidence-specific requirements:
- Start with a metrics-backed diagnostic thesis. If the evidence packet contains exact metrics,
  do not describe the issue generically; use the exact numbers and explain what they imply.
- Include exact available metrics in the executive summary and evidence matrix.
- Use the exception taxonomy from uploaded evidence; include owners and risk levels when available.
- Distinguish validated metrics from finance-validation caveats.
- Build the handoff map from process notes.
- Build the control section from payment-control checklist evidence when present; otherwise mark it
  as a client-actionable missing input.
- Build the systems/data section from systems landscape evidence when present; otherwise mark it
  as a client-actionable missing input.
- Process flows should be introduced by a human-readable operating narrative before the diagram:
  how work starts, who touches it, what systems are used, where decisions happen, how exceptions
  are resolved, and what changes would affect people/adoption.
- Treat workshop agendas, business/IT interviews, process walkthrough notes, and client corrections
  as first-class evidence; if they are missing, list them as client-to-complete evidence rather than
  pretending the process narrative is final.
- Keep draft/final gates honest; do not mark P2 final or ready for P3 if readiness remains partial.`;
}

function p3FutureStateAssignment(ctx?: SolutionContext): string {
  const moveReference = ctx ? clientMoveReference(ctx) : "this Move";
  const useCaseText = [
    ctx?.useCase,
    ctx?.useCaseCandidate,
    ctx?.problemSeed,
    ctx?.scope,
    ...(ctx?.constraints ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isCommercialLending =
    /financial|bank|banking|commercial.?lend|loan|lending|credit|kyc|sanctions?|collateral|covenant|booking|servicing|relationship.?manager|los|core.?bank/.test(
      useCaseText,
    );
  const domainExamples = isCommercialLending
    ? `Domain-specific evidence priorities for commercial lending Agent Assist:
- loan onboarding cycle time, manual touch time, queue age, rework, defect, and exception baselines
- banker, relationship-manager, credit analyst, KYC/sanctions, collateral, operations, and servicing handoffs
- LOS, CRM, document-management, KYC/sanctions, credit-policy, covenant, collateral, core-banking, and servicing systems
- document completeness, data-quality, semantic-layer, API/search, IAM, audit-log, and model-risk controls
- human-owned credit, KYC, sanctions, collateral, covenant, and booking/servicing decision rights`
    : `Domain-specific evidence priorities:
- the exact baseline metrics, volumes, queues, cycle times, quality signals, and cost/value facts in the evidence packet
- the named process, system, data, control, owner, and workforce findings from the current-state diagnostic
- the specific systems of record, integration paths, semantic-layer/data-product dependencies, control hooks, and adoption constraints
- the human-owned decisions and no-automation-yet boundaries that are explicit in the Move evidence`;

  return `PHASE-SPECIFIC ASSIGNMENT — P3 FUTURE-STATE BLUEPRINT DRAFT
Purpose: shape the future-state direction from the approved P2 diagnostic without pretending P2
or P3 is final. This is a design-shaping artifact, not a detailed implementation plan.

Visible status requirement:
- Title or subtitle must state: "P3 Draft — based on approved P2 diagnostic for design shaping".
- State that P2 was approved only for P3 draft shaping.
- State that P2 is not final and P3 is not final.
- Carry forward sponsor/signoff, missing evidence, and unresolved decision caveats.

AbarVa boundary:
- AbarVa helps define the new way of working, future-state direction, human + AI roles, control
  points, work packages, governance, and value tracking.
- Client and delivery teams own detailed process redesign, BPMN/workflow design, system
  configuration, system changes, data engineering build, implementation, training rollout,
  adoption execution, and run-state operations.
- Use terms such as Future-State Direction, New Way of Working Blueprint, Target Operating
  Concept, and Implementation work packages for client/delivery teams.
- Do not imply AbarVa implements, executes, configures systems, trains users, runs operations,
  or completes end-to-end automation.

Context discipline:
- This artifact is for ${moveReference}. Do not import example facts, metrics, systems, control
  labels, or industry-specific language from unrelated Moves.
- Use only the business problem, P2 diagnostic, uploaded evidence, context extract, and phase
  capture content bound in this request.
- If a useful metric or system detail is absent, mark it as missing evidence or a decision needed;
  do not fill it from a prior example.

Evidence that must drive the thesis when present:
${domainExamples}

The artifact must answer:
- what P2 evidence implies for the future state
- what should change in the operating model
- which human and AI roles are safe to introduce now
- where human control must remain
- which future-state options are viable now versus later
- what controls, data, systems, governance, and adoption dependencies must be resolved
- what implementation work packages the client/delivery teams need to take forward
- which open decisions must be resolved before P4 planning and business case finalization

Required structures:
- Metrics-backed Executive Future-State Thesis
- Current-to-Future Logic Table: P2 finding, future-state implication, decision required,
  owner/delivery group, caveat
- New Way of Working Blueprint covering triage, routing, owner accountability, policy/control
  review, human control, AI assist, and no-automation-yet zones
- Human + AI Role Model table: activity, human owner, AI role, control hook, evidence required
  before scaling
- Future-State Workflow Option Matrix with 2-3 high-level options:
  A. rules-led workflow cleanup first
  B. AI-assisted triage and routing
  C. exception command center/control tower
- Control / Governance Matrix covering audit trail, segregation of duties, override policy,
  model/human review checkpoints, compliance controls, and evidence required before scaling
- Data and system dependency map covering systems of record, data quality, document/intake
  quality, case/workflow tracking, semantic layer, API/search integration, IAM, audit trail,
  lineage, and reporting baseline
- Adoption / Culture / Workforce implications
- Implementation Work Package table: objective, likely owner, key outputs, dependencies,
  AbarVa governance role, delivery owner role
- Open Decision Log
- P4 Readiness Checklist

Visual requirements:
- Current-to-future operating concept diagram
- Human + AI role model diagram
- Governance / control model diagram
- The artifact must contain explicitly labeled Conceptual Architecture, Logical Architecture,
  and Physical Architecture sections. These can be concise, but each must state the design pattern,
  systems/data/control implications, and unresolved evidence gaps.
- The executive story spine must be visible: current evidence → design implication → target-state
  option → control/adoption caveat → P4 planning decision.
- Use inline SVGs and real tables, not prose-only sections.`;
}

function p3SolutionDesignAssignment(ctx?: SolutionContext): string {
  const moveReference = ctx ? clientMoveReference(ctx) : "this Move";
  return `PHASE-SPECIFIC ASSIGNMENT — SOLUTION DESIGN SPECIFICATION
Purpose: explain how the proposed solution for ${moveReference} works from user event through
human decision, system action, control evidence, and measurement. This is a design draft for
review, not an implementation-complete claim and not a repeat of the Target Architecture.

Decision focus:
- show what the banker or operations user does, what the AI assist does, and what remains human-owned
- trace each material design choice to current-state evidence or an explicit assumption
- show the systems and data touched without inventing integrations or deployment commitments
- make exception handling, approval, override, audit, and measurement behavior explicit

Required exhibits — render each as a real diagram or decision table, not prose:
- Experience Flow
- Agent Workflow with human approval and override
- Exception Handling Flow
- Control Points and audit evidence
- Data Flow across the evidence-backed systems

Required sections:
- Executive design answer and decision needed
- Experience and workflow design
- Human + AI responsibilities
- Exception and escalation design
- Data, integration, identity, audit, and model-risk controls
- Measurement and observability
- Open inputs and implementation decisions

Length discipline:
- Target 3,200-4,800 body words so the final rendered package remains under 5,200 words
  after title page, status block, source register, and appendix overhead.
- Stop before 4,800 body words. Use exhibits and tables instead of expanded prose.
- Do not repeat the full architecture, operating model, sourcing strategy, or evidence register.
- Prefer exhibits and concise captions over architecture essays.`;
}

function p3OperatingModelAssignment(ctx?: SolutionContext): string {
  const moveReference = ctx ? clientMoveReference(ctx) : "this Move";
  return `PHASE-SPECIFIC ASSIGNMENT — OPERATING MODEL DESIGN
Purpose: define how work for ${moveReference} will be owned, governed, reviewed, and improved after
the solution exists. This is a practical operating model, not a solution architecture or PMO manual.

Required exhibits — render each as a real table or diagram:
- RACI
- Decision Rights Matrix
- Operating Cadence
- Escalation Path

Required sections:
- Executive operating-model answer and decisions needed
- Human + AI work split by activity
- Roles, accountability, and decision rights by title
- Operating cadence and service-management loop
- Control ownership, override, exception, and escalation path
- Adoption, workforce, skills, and change implications
- Measures, review triggers, and unresolved inputs

Length discipline:
- Target 2,400-4,600 rendered words / approximately 5-8 table-rich pages.
- Stop before 4,600 rendered words, including source register and appendix overhead.
- Do not reproduce the architecture, detailed workflow specification,
  sourcing options, implementation roadmap, or source register in the body.
- Use plain operating language; avoid governance-legal and generic PMO prose.`;
}

function p3SourcingStrategyAssignment(ctx?: SolutionContext): string {
  const moveReference = ctx ? clientMoveReference(ctx) : "this Move";
  return `PHASE-SPECIFIC ASSIGNMENT — SOURCING STRATEGY BRIEF
Purpose: decide the build, buy, partner, or hybrid path for ${moveReference}. This is a concise
options paper, not a procurement event, vendor selection, architecture, or implementation plan.

Required exhibits — render each as a real decision exhibit:
- Options Matrix comparing build, buy, partner, and hybrid
- Decision Box with recommendation, rationale, guardrails, and decisions still open

Required sections:
- Executive sourcing recommendation and decision needed
- Capability boundary: retain, acquire, and partner
- Evidence-backed evaluation criteria
- Build / buy / partner / hybrid options and tradeoffs
- Recommended path, guardrails, and reversibility
- Commercial, delivery, security, model-risk, data, and concentration considerations
- Next market-testing or diligence actions

Evidence discipline:
- Do not invent vendor names, prices, rates, savings, dates, delivery durations, or market facts.
- Any planning range must be labeled [ASSUMPTION TO VALIDATE]; client facts require [n].

Length discipline:
- Target 1,800-3,600 rendered words / approximately 4-6 pages.
- Stop before 3,600 rendered words, including source register and appendix overhead.
- Do not repeat the full target architecture or operating model.`;
}

/**
 * REF_EXECUTIVE_ROADMAP pilot (2026-07-25) — before this, `execution_roadmap`
 * had no dedicated prompt at all here and fell through to
 * `genericPhaseAssignment(4)`'s one shared P4 sentence. This reads the single
 * shared contract (shared/reference-library/executive-roadmap-reference.ts)
 * so the orchestrator's MOVES_ROADMAP brief and this pipeline can never
 * silently diverge on what a roadmap must show, the way word budgets did
 * before the earlier reconciliation work this session.
 */
function p4RoadmapAssignment(ctx?: SolutionContext): string {
  const ref = EXECUTIVE_ROADMAP_REFERENCE;
  const moveReference = ctx ? clientMoveReference(ctx) : "this Move";
  const horizonOutcomeLines = ref.horizons
    .map((h) => `  - ${h}: ${ref.horizonOutcomes[h]}`)
    .join("\n");
  return `PHASE-SPECIFIC ASSIGNMENT — EXECUTIVE TRANSITION ROADMAP (REF_EXECUTIVE_ROADMAP)
Purpose: ${ref.purpose.replace(/^Show/, "show")} for ${moveReference}.

Title — the title IS the executive conclusion, not a category label:
- Do not title this artifact any of: ${ref.titleRule.genericTitleForbiddenPatterns.map((p) => p.source).join(", ")}.
- Write a message-led title of at least ${ref.titleRule.minTitleWords} words stating the sequencing
  thesis, e.g.: "${ref.titleRule.example}."

Executive storytelling mandate — this is a sequencing ARGUMENT, not a schedule:
- Executive question this artifact answers: ${ref.story.executiveQuestion}
- Core message (state this as the opening thesis, in your own words, never the bare word "Roadmap"): ${ref.story.coreMessage}
- Decision required of the sponsor: ${ref.story.decisionRequired}
- Write as a senior advisor explaining the sequence to an executive. Lead with the conclusion (why
  this order), then support it. Do not sound like a template, checklist, or project-plan export.

Structure — horizons across the top, workstreams down the side. Each horizon leads with the
outcome achieved, never the activity:
${horizonOutcomeLines}
- Horizons (use exactly these ${ref.maxHorizons}, in order): ${ref.horizons.join(" → ")}.
- Workstreams (use at most ${ref.maxWorkstreams} of): ${ref.workstreams.join(", ")}.
- At most ${ref.maxActivitiesPerCell} major activities per horizon/workstream cell, and activities
  must appear beneath the horizon's outcome statement, never in place of it.
- Every roadmap item must carry: ${ref.requiredItemFields.join(", ")}. For evidenceStatus, use one
  of: approved, recommended, illustrative, client_decision_required, evidence_required — never let
  an unconfirmed sequence read as committed.
- Show decision gates (diamond) between horizons and dependencies (dashed) explicitly. Use these
  named gates where applicable: ${ref.decisionGates.join("; ")}.
- Show value milestones (proof of realized value, not technical completion) where applicable: ${ref.valueMilestones.join("; ")}.

Forbidden — this must read as an executive sequencing argument, not an implementation schedule:
- No sprint numbers, no day/week counters, no explicit calendar dates unless the client has
  approved specific committed dates.
- No Gantt-chart-style task lists. Use outcome language, not task-list language.
- No named owners, durations, or task dependencies that aren't backed by evidence in context.

Length discipline:
- Target ${P3_P4_WORD_BAND_CONTRACTS.roadmap.minWords.toLocaleString()}-${P3_P4_WORD_BAND_CONTRACTS.roadmap.targetWordsMax.toLocaleString()} rendered words.
- Do not repeat the full target architecture, operating model, or business case.
${roadmapStructuredOutputInstruction()}`;
}

function genericPhaseAssignment(phase: number): string {
  const byPhase: Record<number, string> = {
    0: "Frame the opportunity, evidence, value hypothesis, known/unknowns, and P1 recommendation.",
    3: "Design the future way of working, roles, controls, data/platform dependencies, and open design decisions.",
    4: "Sequence work, value, dependencies, funding assumptions, and decision gates without unsupported ROI.",
    5: "Mobilize execution with owners, governance cadence, Tower/Source handoff status, and 30/60/90 actions.",
  };
  return `PHASE-SPECIFIC ASSIGNMENT\n${byPhase[phase] ?? "Produce the phase deliverable with evidence-bound judgment and visual structure."}`;
}

export function phaseAssignmentForArtifact(args: {
  artifact: DeliverableKey;
  phase: number;
  context?: SolutionContext;
}): string {
  if (args.artifact === "charter" || args.phase === 1) return p1Assignment();
  if (args.artifact === "discovery_report" || args.phase === 2)
    return p2Assignment();
  if (args.artifact === "target_state_architecture")
    return p3FutureStateAssignment(args.context);
  if (args.artifact === "solution_design")
    return p3SolutionDesignAssignment(args.context);
  if (args.artifact === "operating_model_design")
    return p3OperatingModelAssignment(args.context);
  if (args.artifact === "sourcing_strategy")
    return p3SourcingStrategyAssignment(args.context);
  if (args.artifact === "execution_roadmap")
    return p4RoadmapAssignment(args.context);
  return genericPhaseAssignment(args.phase);
}

export function renderStrategicMovesArtifactBrief(args: {
  artifact: DeliverableKey;
  phase: number;
  context: SolutionContext;
  generationMode: GenerationMode;
  draftCaveat?: string;
}): string {
  const { context: ctx } = args;
  const depth = depthStandardForArtifact(args.artifact);
  const evidenceSignals = [
    ctx.currentState
      ? "current-state broker bundle is bound in full below"
      : undefined,
    ctx.humanApprovalNotes.length ? "human review notes are bound" : undefined,
    ctx.decisions.length ? "approved decisions are bound" : undefined,
    ctx.evidenceNeeds?.length ? "evidence needs are captured" : undefined,
  ].filter(Boolean);

  return `STRATEGIC MOVES PREMIUM ARTIFACT BRIEF
Standard: ${STRATEGIC_MOVES_ARTIFACT_STANDARD_DOC}

1. Artifact identity
- Tenant/client key: ${ctx.tenantKey}
- Client-facing move reference: ${clientMoveReference(ctx)}
- Internal move id, audit only, do NOT display in the client-facing artifact body: ${ctx.moveId}
- Phase: P${args.phase}
- Artifact type: ${args.artifact}
- Generation mode: ${args.generationMode}
- Intended use: sponsor review, workshop preparation, steering discussion, and phase-gate refinement
- Target depth: ${depth.targetWords} words; minimum acceptable depth: ${depth.minWords} words

2. Business context
- Use case / opportunity: ${ctx.useCase ?? ctx.useCaseCandidate ?? ctx.problemSeed ?? "[MISSING — use case or opportunity seed required]"}
- Scope: ${ctx.scope ?? "[MISSING — scope not captured]"}
- Value hypothesis: ${ctx.valueHypothesis ?? "[MISSING — value hypothesis not captured]"}
- Sponsor / owner status: ${ctx.sponsorCandidate ?? "[MISSING — sponsor not assigned]"}
- Constraints: ${list(ctx.constraints, "constraints not captured")}

3. Evidence base
- Evidence binding status: ${evidenceSignals.length ? evidenceSignals.join("; ") : "[MISSING — no evidence signals captured]"}
- Current state, extracted context, and structured summaries must be used when present below; do not treat file names or metadata as a substitute for extracted evidence.
- Metrics that must be foregrounded when available:
${metricsThatMatterBlock(ctx)}
- Exception taxonomy / risk-owner signals that must be used when available:
${evidenceTaxonomyBlock(ctx)}
- Client-actionable missing inputs:
${missingInputsActionBlock(ctx)}
- Missing evidence: ${list(ctx.evidenceNeeds, "evidence request list not captured")}
- Assumptions / kill criteria for review: ${list(ctx.killCriteria, "assumptions or kill criteria not captured")}

4. Readiness and gates
- Draft/final mode: ${args.generationMode}
- Draft caveat when applicable: ${args.generationMode === "draft" ? (args.draftCaveat ?? STRATEGIC_MOVES_DRAFT_CAVEAT) : "Not a draft artifact."}
- Final artifacts require capture complete, sponsor/owner conditions satisfied, evidence covered or waived, gate approval, golden-bar pass, and no hard blockers.

5. Phase-specific assignment
${phaseAssignmentForArtifact({ artifact: args.artifact, phase: args.phase, context: ctx })}

6. Deliverable package standard
${renderPhaseDeliverablePackagePrompt({ artifact: args.artifact, phase: args.phase })}

7. Quality bar
- Lead with judgment and a clear executive answer.
- Use diagrams, tables, matrices, and charts where they clarify flow, comparison, ownership, dependencies, controls, value, or gates.
- Make every section useful for a client discussion.
- State what is known, what it means, what is missing, what decision is needed, and what happens next.
- No generic AI filler, no fake certainty, no internal language, no unsupported value claims.

${evidencePriorityRuleBlock()}

${claimClassificationBlock()}`;
}
