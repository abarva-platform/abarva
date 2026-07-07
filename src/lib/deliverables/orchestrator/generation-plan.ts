// Plan validation — gates Claude's Pass-1 architect output before any drafting.
//
// The architect pass returns a DeliverableGenerationPlan. We validate that the plan
// covers the brief's required sections, only cites evidence that exists, and handles
// every missing-evidence family + client-to-complete item somewhere — so a thin or
// fabricating plan is caught before we spend tokens on a full draft.

import type {
  DeliverableArtifactBrief,
  DeliverableGenerationPlan,
  DeliverableIntelligenceRequest,
  PlanValidationResult,
} from './types';

/** True when any forbidden topic appears (case-insensitive) in the given text. */
function matchesForbiddenTopic(
  text: string | undefined,
  topics: string[],
): boolean {
  if (!text) return false;
  const haystack = text.toLowerCase().replace(/_/g, ' ');
  return topics.some((t) => haystack.includes(t.toLowerCase()));
}

/**
 * Deterministically repair an architect plan so it satisfies the plan gate
 * WITHOUT weakening it. The architect (an LLM) persistently invents citation
 * numbers outside the evidence bundle (e.g. cites [16]/[17]/[27] when only 12
 * items exist) and marks sections fact-bearing without grounding them — explicit
 * prompt instructions do not reliably stop it. Both would be broken references /
 * fabrication, so we drop every citation not present in the bundle and downgrade
 * any now-ungrounded governed_facts/mixed section to `expert_template` (standard
 * framing, no client facts). `validateGenerationPlan` still runs afterward and
 * still catches genuinely thin or unhandled plans — this only removes the
 * LLM's invalid-citation / ungrounded-section noise that would otherwise hard-block
 * an entire run for a defect the draft passes would never have honoured anyway.
 */
export function sanitizeGenerationPlan(
  plan: DeliverableGenerationPlan,
  req: DeliverableIntelligenceRequest,
  brief?: DeliverableArtifactBrief,
): DeliverableGenerationPlan {
  // Phase discipline: drop any planned section / exhibit / enhancement whose key
  // or title is about a forbidden later-phase topic (e.g. a P1 Charter must not
  // carry a current-state evidence analysis or target-state design). The architect
  // is told to omit these, but it freelances "improvements" anyway, so we strip
  // them deterministically — this is what makes charter runs consistent. A required
  // section is never forbidden (the two lists are disjoint by construction), so the
  // thin-plan guard still holds.
  const forbidden = brief?.forbiddenSectionTopics ?? [];
  if (forbidden.length > 0) {
    plan.sectionPlan = (plan.sectionPlan ?? []).filter(
      (s) =>
        !matchesForbiddenTopic(s.key, forbidden) &&
        !matchesForbiddenTopic(s.title, forbidden),
    );
    if (Array.isArray(plan.tableAndExhibitPlan)) {
      plan.tableAndExhibitPlan = plan.tableAndExhibitPlan.filter(
        (t) =>
          !matchesForbiddenTopic(t.key, forbidden) &&
          !matchesForbiddenTopic(t.title, forbidden),
      );
    }
    if (Array.isArray(plan.artifactEnhancementSuggestions)) {
      plan.artifactEnhancementSuggestions =
        plan.artifactEnhancementSuggestions.filter(
          (e) =>
            !matchesForbiddenTopic(e.addsSectionOrExhibit, forbidden) &&
            !matchesForbiddenTopic(e.suggestion, forbidden),
        );
    }
  }

  const valid = new Set(req.governedEvidenceBundle.map((e) => e.citationNumber));
  for (const s of plan.sectionPlan ?? []) {
    s.evidenceCitations = (s.evidenceCitations ?? []).filter((n) => valid.has(n));
    const grounded =
      s.evidenceCitations.length > 0 ||
      (s.placeholders ?? []).length > 0 ||
      (s.assumptionsUsed ?? []).length > 0;
    if ((s.groundingMode === 'governed_facts' || s.groundingMode === 'mixed') && !grounded) {
      s.groundingMode = 'expert_template';
    }
  }
  if (Array.isArray(plan.evidenceMapping)) {
    plan.evidenceMapping = plan.evidenceMapping.filter((m) => valid.has(m.citationNumber));
  }
  return plan;
}

export function validateGenerationPlan(
  plan: DeliverableGenerationPlan,
  req: DeliverableIntelligenceRequest,
  brief: DeliverableArtifactBrief,
): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sectionKeys = new Set(plan.sectionPlan.map((s) => s.key));

  // Required sections: the architect (an LLM) routinely names sections semantically
  // rather than with the brief's exact keys (e.g. "program_objectives" vs "objectives"),
  // so an exact-key miss is advisory, NOT a hard block — the draft/rewrite passes still
  // cover the content and the QUALITY gate validates the actual rendered document
  // (section count, source register, no fabrication). The total-count check below stays
  // hard, so a genuinely thin plan is still rejected.
  for (const key of brief.requiredSections) {
    if (!sectionKeys.has(key)) warnings.push(`plan does not key a section as "${key}" (covered later passes / checked by the quality gate)`);
  }

  // every cited evidence number must exist in the bundle
  const validCitations = new Set(req.governedEvidenceBundle.map((e) => e.citationNumber));
  for (const s of plan.sectionPlan) {
    for (const n of s.evidenceCitations) {
      if (!validCitations.has(n)) errors.push(`section "${s.key}" cites [${n}] which is not in the governed evidence bundle`);
    }
    // a governed_facts / mixed section that cites nothing AND has no placeholder is a fabrication risk
    if ((s.groundingMode === 'governed_facts' || s.groundingMode === 'mixed') &&
        s.evidenceCitations.length === 0 && s.placeholders.length === 0 && s.assumptionsUsed.length === 0) {
      errors.push(`section "${s.key}" is ${s.groundingMode} but cites no evidence, uses no assumption, and has no placeholder — would fabricate client facts`);
    }
  }

  // every missing-evidence family must be handled (placeholder/assumption/client-complete), not silently dropped
  const handledFamilies = new Set(plan.missingEvidenceHandling.map((m) => m.evidenceFamily));
  for (const m of req.missingEvidence) {
    if (!handledFamilies.has(m.evidenceFamily)) {
      warnings.push(`missing-evidence family "${m.evidenceFamily}" not explicitly handled in the plan`);
    }
  }

  // every client-to-complete item must be placed somewhere
  const placedClientComplete = new Set(plan.clientCompletePlan.map((c) => c.key));
  for (const c of req.clientCompleteItems) {
    if (!placedClientComplete.has(c.key)) errors.push(`client-to-complete item "${c.key}" is not placed in the plan`);
  }

  // output package must cover the requested formats
  const plannedFormats = new Set(plan.outputPackagePlan.map((o) => o.format));
  for (const f of req.outputFormats) {
    if (!plannedFormats.has(f)) warnings.push(`output format "${f}" not addressed in the output package plan`);
  }

  // thin-plan guard
  if (plan.sectionPlan.length < brief.requiredSections.length) {
    errors.push(`plan has ${plan.sectionPlan.length} sections; brief requires at least ${brief.requiredSections.length}`);
  }
  if (plan.tableAndExhibitPlan.length === 0 && (brief.expectedTables.length > 0 || brief.expectedExhibits.length > 0)) {
    warnings.push('plan includes no tables/exhibits though the brief expects them');
  }
  if (plan.artifactEnhancementSuggestions.length === 0) {
    warnings.push('plan proposes no enhancements beyond the baseline structure — may be too mechanical');
  }

  return { ok: errors.length === 0, errors, warnings };
}
