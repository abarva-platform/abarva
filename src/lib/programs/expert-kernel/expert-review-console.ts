// Moves Expert Kernel — Expert Review Console view-model.
//
// A design-partner reviewer's directive: do not build more broad surfaces —
// build the console where real finance / delivery / sourcing / domain experts
// can read the kernel's generated business case and calibrate it. The
// calibration ENGINE already exists (`expert-review-calibration.ts`); this
// module assembles the read-only VIEW the console renders, and threads
// reviewer notes back into the assumption ledger.
//
// Pure module: deterministic, no I/O. The route reads `buildExpertReviewConsole`
// for the kernel skeleton; persisted `ExpertReviewInput[]` (loaded through the
// data-plane seam) is folded in by `applyReviewsToConsole`.

import type { BusinessCaseSkeleton } from './business-case-compiler';
import type { Assumption } from './assumption-ledger';
import type { BaselineMetric } from './baseline-model';
import type { CriticFinding } from './critic';
import {
  calibrateBusinessCaseWithExpertReviews,
  type ExpertReviewInput,
  type ExpertReviewerRole,
  type ExpertCalibrationResult,
} from './expert-review-calibration';

/** The selectable expert lenses, with display labels, for the console form. */
export const EXPERT_REVIEWER_ROLES: ReadonlyArray<{
  role: ExpertReviewerRole;
  label: string;
}> = [
  { role: 'cfo', label: 'CFO / Finance' },
  { role: 'transformation_partner', label: 'Transformation Partner' },
  { role: 'sourcing_vp', label: 'Sourcing VP' },
  { role: 'delivery_lead', label: 'Delivery Lead' },
  { role: 'domain_operator', label: 'Domain Operator' },
  { role: 'risk_compliance', label: 'Risk & Compliance' },
];

/** The verdict options, with the reviewer-facing gloss the spec asked for. */
export const EXPERT_REVIEW_VERDICTS: ReadonlyArray<{
  verdict: ExpertReviewInput['verdict'];
  label: string;
  tone: 'good' | 'warn' | 'bad';
}> = [
  { verdict: 'credible', label: 'Credible', tone: 'good' },
  { verdict: 'credible_with_conditions', label: 'Credible — needs data', tone: 'warn' },
  { verdict: 'weak', label: 'Weak', tone: 'warn' },
  { verdict: 'wrong', label: 'Wrong', tone: 'bad' },
];

/** One assumption, annotated with any reviewer notes that touched its key. */
export interface AnnotatedAssumption {
  assumption: Assumption;
  /** Notes attached because a review's `assumptionKeys` named this assumption. */
  reviewerNotes: Array<{
    reviewerId: string;
    role: ExpertReviewerRole;
    verdict: ExpertReviewInput['verdict'];
    note: string;
  }>;
}

/** The read-only console view-model the route renders. */
export interface ExpertReviewConsoleView {
  moveName: string;
  tenantKey: string;
  /** 1 — the generated business case (kernel skeleton, surfaced whole). */
  skeleton: BusinessCaseSkeleton;
  /** 2 — missing evidence: the baseline-model seed gaps. */
  missingEvidence: BaselineMetric[];
  /** 3 — assumptions + reviewer-note annotations. */
  assumptions: AnnotatedAssumption[];
  /** 3 — the top assumptions that move the case (sensitivity). */
  topMovers: Assumption[];
  /** 4 — critic challenges, blockers first. */
  criticChallenges: CriticFinding[];
  /** The reviews accumulated so far (from persistence). */
  reviews: ExpertReviewInput[];
  /** 7 — the running calibration result. */
  calibration: ExpertCalibrationResult;
}

const CRITIC_SEVERITY_RANK: Record<CriticFinding['severity'], number> = {
  blocker: 0,
  concern: 1,
  note: 2,
};

/**
 * Annotate each assumption with the reviewer notes whose `assumptionKeys`
 * named it — the "capture reviewer notes into the assumption ledger" step.
 * Pure: it does not mutate the ledger, it produces an annotated projection.
 */
export function annotateAssumptionsWithReviews(
  assumptions: Assumption[],
  reviews: ExpertReviewInput[],
): AnnotatedAssumption[] {
  return assumptions.map((assumption) => ({
    assumption,
    reviewerNotes: reviews
      .filter((r) => (r.assumptionKeys ?? []).includes(assumption.key))
      .map((r) => ({
        reviewerId: r.reviewerId,
        role: r.role,
        verdict: r.verdict,
        note: r.note,
      })),
  }));
}

/**
 * Assemble the Expert Review Console view-model from a kernel skeleton and the
 * reviews accumulated so far. Deterministic — calibration, annotation, and
 * critic ordering are all pure functions of the inputs.
 */
export function buildExpertReviewConsole(
  skeleton: BusinessCaseSkeleton,
  reviews: ExpertReviewInput[] = [],
): ExpertReviewConsoleView {
  const criticChallenges = [...skeleton.critic.findings].sort(
    (a, b) => CRITIC_SEVERITY_RANK[a.severity] - CRITIC_SEVERITY_RANK[b.severity],
  );

  return {
    moveName: skeleton.moveName,
    tenantKey: skeleton.tenantKey,
    skeleton,
    missingEvidence: skeleton.baseline.seedGaps,
    assumptions: annotateAssumptionsWithReviews(
      skeleton.assumptions.assumptions,
      reviews,
    ),
    topMovers: skeleton.sensitivity.topMovers,
    criticChallenges,
    reviews,
    calibration: calibrateBusinessCaseWithExpertReviews(skeleton, reviews),
  };
}

/** Outcome of validating a reviewer's submission before it is persisted. */
export interface ReviewSubmissionValidation {
  ok: boolean;
  error?: string;
}

/**
 * Validate a single reviewer submission. The console must not persist a
 * review with no rationale, no reviewer id, or an assumption key the kernel
 * does not know — that would silently orphan the note.
 */
export function validateReviewSubmission(
  input: ExpertReviewInput,
  knownAssumptionKeys: ReadonlySet<string>,
): ReviewSubmissionValidation {
  if (!input.reviewerId.trim()) {
    return { ok: false, error: 'A reviewer identity is required.' };
  }
  if (!input.note.trim()) {
    return { ok: false, error: 'A written rationale is required.' };
  }
  for (const key of input.assumptionKeys ?? []) {
    if (!knownAssumptionKeys.has(key)) {
      return { ok: false, error: `Unknown assumption key: ${key}` };
    }
  }
  return { ok: true };
}

/**
 * Fold a freshly-submitted review into an existing console view — the
 * review → calibration → assumption-ledger loop, run in one pass. Used by the
 * route after a persist, and by tests to exercise the full flow without I/O.
 */
export function applyReviewsToConsole(
  skeleton: BusinessCaseSkeleton,
  reviews: ExpertReviewInput[],
): ExpertReviewConsoleView {
  return buildExpertReviewConsole(skeleton, reviews);
}
