// Expert Review Console — view-model + the review → calibration → assumption
// ledger flow. The console UI is thin; these tests pin the pure view-model
// the route renders, exercised on the real Apex Contact Center AI Routing case.

import { buildApexContactCenterCase } from '../apex-contact-center-case';
import {
  buildExpertReviewConsole,
  applyReviewsToConsole,
  annotateAssumptionsWithReviews,
  validateReviewSubmission,
  EXPERT_REVIEWER_ROLES,
  EXPERT_REVIEW_VERDICTS,
} from '../expert-review-console';
import type { ExpertReviewInput } from '../expert-review-calibration';

const { skeleton } = buildApexContactCenterCase();
const knownKeys = new Set(skeleton.assumptions.assumptions.map((a) => a.key));

function review(over: Partial<ExpertReviewInput>): ExpertReviewInput {
  return {
    reviewerId: 'r1',
    role: 'cfo',
    verdict: 'credible',
    note: 'looks grounded',
    ...over,
  };
}

describe('Expert Review Console — grounded render for the Apex case', () => {
  it('surfaces the kernel skeleton, seed gaps, assumptions, and critic findings', () => {
    const view = buildExpertReviewConsole(skeleton, []);
    expect(view.moveName).toBe('Contact Center AI Routing');
    expect(view.tenantKey).toBe('apex-retail');
    // Apex has four declared seed gaps — surfaced as missing evidence.
    expect(view.missingEvidence.length).toBe(4);
    expect(view.missingEvidence.every((m) => m.value === null)).toBe(true);
    // Assumptions and the top movers are surfaced.
    expect(view.assumptions.length).toBe(skeleton.assumptions.assumptions.length);
    expect(view.topMovers.length).toBeGreaterThan(0);
    expect(view.topMovers.length).toBeLessThanOrEqual(3);
    // Critic challenges are ordered blockers-first.
    const ranks = view.criticChallenges.map((f) =>
      f.severity === 'blocker' ? 0 : f.severity === 'concern' ? 1 : 2,
    );
    expect([...ranks].sort()).toEqual(ranks);
  });

  it('starts not_ready with zero reviews', () => {
    const view = buildExpertReviewConsole(skeleton, []);
    expect(view.calibration.verdict).toBe('not_ready');
    expect(view.calibration.reviewCount).toBe(0);
  });
});

describe('review → calibration loop', () => {
  it('two reviews covering CFO + delivery lift the verdict off not_ready', () => {
    const reviews = [
      review({ reviewerId: 'cfo-1', role: 'cfo', verdict: 'credible_with_conditions' }),
      review({ reviewerId: 'del-1', role: 'delivery_lead', verdict: 'credible' }),
    ];
    const view = applyReviewsToConsole(skeleton, reviews);
    expect(view.calibration.reviewCount).toBe(2);
    expect(view.calibration.rolesCovered).toEqual(
      expect.arrayContaining(['cfo', 'delivery_lead']),
    );
    // A "credible_with_conditions" verdict yields a conditional calibration,
    // not a clean accept.
    expect(view.calibration.verdict).toBe('conditional');
    expect(view.calibration.verdict).not.toBe('not_ready');
  });

  it('a wrong verdict from any reviewer drives the calibration to not_ready', () => {
    const reviews = [
      review({ reviewerId: 'cfo-1', role: 'cfo' }),
      review({ reviewerId: 'tp-1', role: 'transformation_partner', verdict: 'wrong' }),
    ];
    const view = applyReviewsToConsole(skeleton, reviews);
    expect(view.calibration.verdict).toBe('not_ready');
  });

  it('required actions from reviews flow through into the calibration result', () => {
    const reviews = [
      review({
        reviewerId: 'cfo-1',
        role: 'cfo',
        verdict: 'credible_with_conditions',
        requiredActions: ['Capture the cost-per-contact baseline'],
      }),
      review({ reviewerId: 'del-1', role: 'delivery_lead' }),
    ];
    const view = applyReviewsToConsole(skeleton, reviews);
    expect(view.calibration.requiredActions).toContain(
      'Capture the cost-per-contact baseline',
    );
  });
});

describe('review notes captured into the assumption ledger', () => {
  it('attaches a review note to the assumptions its assumptionKeys name', () => {
    const reviews = [
      review({
        reviewerId: 'cfo-1',
        role: 'cfo',
        note: 'the $6.50 proxy is too low for this retailer',
        assumptionKeys: ['cost_per_contact'],
      }),
      review({ reviewerId: 'del-1', role: 'delivery_lead' }),
    ];
    const view = applyReviewsToConsole(skeleton, reviews);
    const annotated = view.assumptions.find(
      (a) => a.assumption.key === 'cost_per_contact',
    );
    expect(annotated?.reviewerNotes.length).toBe(1);
    expect(annotated?.reviewerNotes[0]?.note).toContain('$6.50 proxy');
    // An untouched assumption carries no notes.
    const untouched = view.assumptions.find(
      (a) => a.assumption.key === 'rate_card',
    );
    expect(untouched?.reviewerNotes.length).toBe(0);
  });

  it('annotateAssumptionsWithReviews is pure — it does not mutate the ledger', () => {
    const before = skeleton.assumptions.assumptions.length;
    annotateAssumptionsWithReviews(skeleton.assumptions.assumptions, [
      review({ assumptionKeys: ['cost_per_contact'] }),
    ]);
    expect(skeleton.assumptions.assumptions.length).toBe(before);
  });
});

describe('review submission validation', () => {
  it('rejects an empty rationale, an empty reviewer, and an unknown key', () => {
    expect(validateReviewSubmission(review({ note: '' }), knownKeys).ok).toBe(false);
    expect(
      validateReviewSubmission(review({ reviewerId: '' }), knownKeys).ok,
    ).toBe(false);
    expect(
      validateReviewSubmission(
        review({ assumptionKeys: ['no_such_key'] }),
        knownKeys,
      ).ok,
    ).toBe(false);
  });

  it('accepts a well-formed review touching a known assumption', () => {
    const result = validateReviewSubmission(
      review({ assumptionKeys: ['containment_uplift'] }),
      knownKeys,
    );
    expect(result.ok).toBe(true);
  });
});

describe('console metadata', () => {
  it('exposes all six reviewer roles and four verdicts for the form', () => {
    expect(EXPERT_REVIEWER_ROLES.length).toBe(6);
    expect(EXPERT_REVIEW_VERDICTS.map((v) => v.verdict)).toEqual([
      'credible',
      'credible_with_conditions',
      'weak',
      'wrong',
    ]);
  });
});
