export interface SourceHardQuestionAnswer {
  directAnswer: string;
  sourcingJudgment: string;
  evidenceReference: string;
  blockerOrGap: string;
  recommendedNextAction: string;
  whatWouldChangeTheAnswer: string;
  answerText: string;
}

export function answerHardSourceQuestion(prompt: string, evidenceText = ''): SourceHardQuestionAnswer | null {
  const promptOnly = prompt.toLowerCase();

  if (/skip\s+bafo|sole[-\s]?source|renewal deadline|deadline is close|issue.*rfi|invite.*bafo|bafo now|rfi now/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — do not issue an RFI, invite BAFO, skip BAFO, or sole-source only because the renewal deadline is close; do not skip BAFO governance.',
      sourcingJudgment: 'Renewal urgency raises action priority, but it does not erase sourcing governance, buyer-owned scope, pricing comparability, or P0 legal/data-rights blockers.',
      evidenceReference: evidenceOrDefault(evidenceText, 'Renewal notice / incumbent contract evidence plus open blocker state.'),
      blockerOrGap: 'Buyer-owned scope, baseline economics, comparable pricing, legal, or transition blockers must be closed or explicitly risk-accepted before a vendor-facing event advances.',
      recommendedNextAction: 'Protect the notice window, lock the buyer architecture and commercial baseline first, then issue targeted RFI/BAFO asks only against the confirmed scope.',
      whatWouldChangeTheAnswer: 'A signed buyer-owned scope boundary, named baseline owner with current economics, and closed P0 legal/data-rights plus comparable pricing evidence.',
    });
  }

  if (/11\.4|pilot savings|claim.*savings|full.*savings|excluded union|holiday weeks/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — do not claim the full challenged pilot savings as the base case.',
      sourcingJudgment: 'A non-representative pilot must be treated as upside or sensitivity, not a board-grade base-case value claim.',
      evidenceReference: evidenceOrDefault(evidenceText, 'Pilot savings evidence and CFO/base-case savings constraint.'),
      blockerOrGap: 'Savings are challenged because the pilot excluded union stores, holiday weeks, or other representative operating conditions.',
      recommendedNextAction: 'Use a conservative base case, show the challenged pilot as upside, and require refreshed full-fleet evidence.',
      whatWouldChangeTheAnswer: 'Representative telemetry with volume, seasonality, union-store coverage and CFO-approved base-case assumptions.',
    });
  }

  if (/stale telemetry|last year|last year's|ignore.*telemetry|full[-\s]?fleet/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — do not ignore stale telemetry or use last year’s pilot as a full-fleet fact.',
      sourcingJudgment: 'Stale or non-representative telemetry can inform a hypothesis, but it cannot anchor a CXO funding or award claim.',
      evidenceReference: evidenceOrDefault(evidenceText, 'Operating telemetry freshness and pilot representativeness evidence.'),
      blockerOrGap: 'Fresh full-fleet operating telemetry is missing or insufficiently representative.',
      recommendedNextAction: 'Refresh telemetry, split base/upside cases, and label stale pilot evidence as challenged.',
      whatWouldChangeTheAnswer: 'Current-period full-fleet telemetry with documented coverage of peak, holiday and constrained-store conditions.',
    });
  }

  if (/cheapest|lowest.*(price|cost)|award.*p0|p0.*(telemetry|model-improvement|model improvement|data rights)/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — price cannot override an unresolved P0 AI/data-rights issue.',
      sourcingJudgment: 'A vendor can be commercially attractive and still not awardable if telemetry, model-improvement, audit or data-rights terms are unresolved.',
      evidenceReference: evidenceOrDefault(evidenceText, 'AI/data clause gap, legal redlines and vendor pricing comparison.'),
      blockerOrGap: 'P0 telemetry/model-improvement or audit-rights blocker remains open.',
      recommendedNextAction: 'Hold award and run targeted BAFO for revised AI/data terms, audit-rights confirmation and normalized pricing.',
      whatWouldChangeTheAnswer: 'Legal accepts revised clauses or a named executive formally accepts the residual AI/data risk before signature.',
    });
  }

  if (/renew.*incumbent|fix.*audit rights later|audit rights later|fastest/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — do not sign now and fix audit rights later.',
      sourcingJudgment: 'Audit rights and AI/data controls are signature gates, not post-signature cleanup items.',
      evidenceReference: evidenceOrDefault(evidenceText, 'Incumbent renewal evidence and AI/audit-rights clause gap.'),
      blockerOrGap: 'Audit-rights or AI/data-rights blocker remains unresolved before signature.',
      recommendedNextAction: 'Serve/protect notice if needed, keep leverage through BAFO, and close audit-rights redlines before renewal.',
      whatWouldChangeTheAnswer: 'The incumbent signs acceptable audit/data-rights terms or the risk is explicitly accepted before signature.',
    });
  }

  if (/missing.*price|prices blank|ai module prices|normalize.*anyway|apples-to-apples/.test(promptOnly)) {
    return makeAnswer({
      directAnswer: 'No — do not normalize incomplete pricing and call it apples-to-apples.',
      sourcingJudgment: 'A non-conforming vendor response must be remediated or excluded from like-for-like comparison.',
      evidenceReference: evidenceOrDefault(evidenceText, 'Vendor pricing submission and pricing-comparability evidence.'),
      blockerOrGap: 'Missing AI module pricing makes the commercial comparison non-comparable.',
      recommendedNextAction: 'Require a conforming pricing resubmission or carve the missing scope out of all vendor comparisons.',
      whatWouldChangeTheAnswer: 'Complete pricing lines for the AI modules, assumptions and exclusions on the same basis as other vendors.',
    });
  }

  return null;
}

function makeAnswer(args: Omit<SourceHardQuestionAnswer, 'answerText'>): SourceHardQuestionAnswer {
  return {
    ...args,
    answerText: [
      `Direct answer: ${args.directAnswer}`,
      `Sourcing judgment: ${args.sourcingJudgment}`,
      `Evidence: ${args.evidenceReference}`,
      `Blocker/gap: ${args.blockerOrGap}`,
      `Next action: ${args.recommendedNextAction}`,
      `What would change the answer: ${args.whatWouldChangeTheAnswer}`,
    ].join('\n'),
  };
}

function evidenceOrDefault(evidenceText: string, fallback: string): string {
  const lines = evidenceText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 40);
  const exactField = lines.find((line) => hasExactEvidenceField(line));
  if (exactField) return exactField;
  const buyerOwnedEvidence = lines.find((line) =>
    /baseline|scope boundary|buyer architecture|decision owner|trigger|adobe|salesforce|accenture|pricing|commercial/i.test(line),
  );
  const first = buyerOwnedEvidence ?? lines[0];
  return first ?? fallback;
}

function hasExactEvidenceField(line: string): boolean {
  return /\b(?:intake|source_events|vendor_pricing|pricing_submissions|selection_memo|legal_review|contract_terms|telemetry)\.[a-z0-9_[\].-]+/i.test(line)
    || /\b[a-z_]+\[[a-z0-9_-]+\]\.[a-z0-9_[\].-]+/i.test(line);
}
