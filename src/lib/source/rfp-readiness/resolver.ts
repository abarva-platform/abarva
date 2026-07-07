// Source RFP section-readiness resolver (PR-1).
//
// Computes the EFFECTIVE mode + readiness status for a section against live governed
// evidence. The hard rules are enforced here, not in prose:
//  - A section never resolves to AUTO-GOVERNED unless all its required evidence is
//    agent_ready (and required inputs present). Missing evidence drops it to ELICIT
//    (capturable) or CLIENT-COMPLETE (judgment/policy).
//  - Every section gets one of the explicit ReadinessStatus labels — never silently weak.

import type {
  RfpSectionDefinition,
  RfpSectionReadiness,
  SectionMode,
  SectionResolutionContext,
  ReadinessStatus,
  ReviewKind,
} from './types';

const REVIEW_STATUS: Record<ReviewKind, ReadinessStatus> = {
  legal: 'legal_review_required',
  procurement: 'procurement_review_required',
  pricing: 'pricing_review_required',
};

/** Is a single input satisfied? Evidence-family inputs need agent_ready; others need a captured answer. */
function inputPresent(
  input: RfpSectionDefinition['requiredInputs'][number],
  ctx: SectionResolutionContext,
): boolean {
  if (input.clientDecision) return ctx.capturedInputs.has(input.key);
  if (input.evidenceFamily) return ctx.agentReadyFamilies.has(input.evidenceFamily);
  return ctx.capturedInputs.has(input.key);
}

function pendingReviews(def: RfpSectionDefinition, ctx: SectionResolutionContext): ReviewKind[] {
  const need: ReviewKind[] = [];
  if (def.legalReviewRequired && !ctx.reviewsSignedOff.has('legal')) need.push('legal');
  if (def.procurementReviewRequired && !ctx.reviewsSignedOff.has('procurement')) need.push('procurement');
  if (def.pricingReviewRequired && !ctx.reviewsSignedOff.has('pricing')) need.push('pricing');
  return need;
}

export function resolveSectionReadiness(
  def: RfpSectionDefinition,
  ctx: SectionResolutionContext,
): RfpSectionReadiness {
  const required = def.requiredInputs;
  const present = required.filter((i) => inputPresent(i, ctx));
  const missing = required.filter((i) => !inputPresent(i, ctx));
  const missingKeys = missing.map((i) => i.key);
  const completenessScore = required.length === 0 ? 1 : +(present.length / required.length).toFixed(2);

  // citations for covered families
  const citedSources: string[] = [];
  const sourceBasis: string[] = [];
  for (const fam of def.evidenceFamilies) {
    if (ctx.agentReadyFamilies.has(fam)) {
      sourceBasis.push(fam);
      for (const c of ctx.citationsByFamily?.[fam] ?? []) citedSources.push(c);
    }
  }

  const reviews = pendingReviews(def, ctx);
  const allEvidencePresent = missing.length === 0;
  const missingAreAllJudgment = missing.length > 0 && missing.every((i) => i.clientDecision);

  // ── EFFECTIVE mode (the hard rule lives here) ──
  let mode: SectionMode = def.defaultMode;
  if (def.defaultMode === 'auto_governed') {
    if (!allEvidencePresent) {
      // never stay AUTO-GOVERNED with missing evidence
      mode = missingAreAllJudgment && def.clientCompleteAllowed ? 'client_complete' : 'elicit';
    }
  } else if (def.defaultMode === 'client_complete') {
    mode = 'client_complete';
  } else if (def.defaultMode === 'elicit') {
    // an elicit section whose evidence has since arrived becomes governed
    mode = allEvidencePresent && def.evidenceFamilies.length > 0 ? 'auto_governed' : 'elicit';
  } // auto_template stays auto_template (boilerplate, no client facts)

  // ── readiness status + confidence ──
  let readinessStatus: ReadinessStatus;
  let confidence: RfpSectionReadiness['confidence'];
  let preliminaryOnly = false;
  const assumptions: string[] = [];
  const clientToComplete: string[] = [];

  if (mode === 'auto_governed') {
    confidence = 'high';
    readinessStatus = reviews.length ? REVIEW_STATUS[reviews[0]] : 'issue_ready';
  } else if (mode === 'auto_template') {
    confidence = 'medium';
    // boilerplate is preliminary until the required review (legal/procurement) signs off
    readinessStatus = reviews.length ? REVIEW_STATUS[reviews[0]] : 'preliminary';
  } else if (mode === 'client_complete') {
    confidence = 'insufficient_evidence';
    readinessStatus = reviews.includes('legal')
      ? 'legal_review_required'
      : 'client_to_complete';
    clientToComplete.push(...missing.map((i) => i.label));
    if (clientToComplete.length === 0) clientToComplete.push(def.title);
  } else {
    // elicit
    if (ctx.allowPreliminary && def.preliminaryDraftAllowed) {
      readinessStatus = 'preliminary';
      preliminaryOnly = true;
      confidence = 'low';
      assumptions.push(`Preliminary draft from assumptions; pending: ${missingKeys.join(', ')}`);
    } else {
      readinessStatus = 'evidence_missing';
      confidence = 'insufficient_evidence';
    }
  }
  // a pending review always shows (overrides issue_ready)
  if (reviews.length && readinessStatus === 'issue_ready') readinessStatus = REVIEW_STATUS[reviews[0]];

  const issueReady = readinessStatus === 'issue_ready';

  // ── recommended next action ──
  let recommendedNextAction: string;
  if (issueReady) recommendedNextAction = 'Issue-ready — review and lock.';
  else if (mode === 'client_complete') recommendedNextAction = `Client/legal to complete: ${(clientToComplete[0] ?? def.title)}.`;
  else if (mode === 'elicit') recommendedNextAction = `Nexus intake: capture ${missingKeys.join(', ') || 'inputs'} (upload, template, or chat).`;
  else if (reviews.length) recommendedNextAction = `${reviews.join(' + ')} review required before issuance.`;
  else recommendedNextAction = 'Standard template — review and confirm.';

  return {
    sectionId: def.id,
    sectionNumber: def.sectionNumber,
    title: def.title,
    mode,
    readinessStatus,
    completenessScore,
    requiredInputs: required.map((i) => i.key),
    presentInputs: present.map((i) => i.key),
    missingInputs: missingKeys,
    evidenceFamilies: def.evidenceFamilies,
    citedSources,
    sourceBasis,
    confidence,
    assumptions,
    clientToCompleteItems: clientToComplete,
    reviewsRequired: reviews,
    issueReady,
    preliminaryOnly,
    recommendedNextAction,
  };
}

/** Roll a set of section readinesses into a package scorecard. */
export function buildReadinessScorecard(sections: RfpSectionReadiness[]) {
  const by = (s: ReadinessStatus) => sections.filter((x) => x.readinessStatus === s).length;
  const overall = sections.length
    ? +(sections.reduce((a, b) => a + b.completenessScore, 0) / sections.length * 100).toFixed(0)
    : 0;
  return {
    overallReadinessPct: overall,
    total: sections.length,
    issue_ready: by('issue_ready'),
    preliminary: by('preliminary'),
    evidence_missing: by('evidence_missing'),
    client_to_complete: by('client_to_complete'),
    legal_review_required: by('legal_review_required'),
    procurement_review_required: by('procurement_review_required'),
    pricing_review_required: by('pricing_review_required'),
    blocked: by('blocked'),
  };
}
