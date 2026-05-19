// Moves Expert Kernel — scenario update assessment.
//
// Shared pure module for taking updated content from a workshop / watched
// session / expert review and deciding whether it can affect the business
// case. The central rule is intentionally strict: mapped evidence is accepted
// into a named lane; unmapped content is rejected and never silently changes
// the case.

import type { BusinessCaseSkeleton } from './business-case-compiler';
import type {
  ExpertReviewInput,
  ExpertReviewerRole,
} from './expert-review-calibration';
import { validateReviewSubmission } from './expert-review-console';

export type UpdateInputKind =
  | 'baseline_metric'
  | 'assumption_review'
  | 'rate_card_override'
  | 'workshop_note';

export interface ScenarioUpdateInput {
  kind: UpdateInputKind;
  key: string;
  label: string;
  value?: number | string;
  source: string;
  owner: string;
  reviewerRole?: ExpertReviewerRole;
  requiredAction?: string;
}

export interface ScenarioUpdateAssessment {
  accepted: ScenarioUpdateInput[];
  rejected: Array<{
    input: ScenarioUpdateInput;
    reason: string;
  }>;
  reviewValidationErrors: string[];
  regenerationRequired: boolean;
  regenerationReasons: string[];
}

export function assessScenarioUpdates(
  skeleton: BusinessCaseSkeleton,
  updates: ScenarioUpdateInput[],
): ScenarioUpdateAssessment {
  const knownBaselineKeys = new Set(skeleton.baseline.metrics.map((m) => m.key));
  const knownAssumptionKeys = new Set(
    skeleton.assumptions.assumptions.map((a) => a.key),
  );
  const accepted: ScenarioUpdateInput[] = [];
  const rejected: ScenarioUpdateAssessment['rejected'] = [];
  const reviewValidationErrors: string[] = [];
  const regenerationReasons = new Set<string>();

  for (const input of updates) {
    if (input.kind === 'baseline_metric') {
      if (!knownBaselineKeys.has(input.key)) {
        rejected.push({
          input,
          reason:
            'No matching baseline key in the current Moves case. The agent must not accept this into the business case silently.',
        });
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Baseline metric updated: ${input.key}.`);
      continue;
    }

    if (input.kind === 'assumption_review') {
      const review: ExpertReviewInput = {
        reviewerId: `${input.reviewerRole ?? 'reviewer'}:${input.owner}`,
        role: input.reviewerRole ?? 'delivery_lead',
        verdict: 'credible_with_conditions',
        note: `${input.label}: ${input.source}`,
        assumptionKeys: [input.key],
        requiredActions: input.requiredAction ? [input.requiredAction] : [],
      };
      const validation = validateReviewSubmission(review, knownAssumptionKeys);
      if (!validation.ok) {
        rejected.push({ input, reason: validation.error ?? 'Invalid expert review.' });
        reviewValidationErrors.push(validation.error ?? 'Invalid expert review.');
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Assumption challenged: ${input.key}.`);
      continue;
    }

    if (input.kind === 'rate_card_override') {
      accepted.push(input);
      regenerationReasons.add('Rate card / budget override provided.');
      continue;
    }

    if (input.kind === 'workshop_note') {
      if (!input.requiredAction?.trim()) {
        rejected.push({
          input,
          reason:
            'Workshop notes must carry an action or decision; raw observations alone are not enough to alter deliverables.',
        });
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Workshop action captured: ${input.key}.`);
    }
  }

  return {
    accepted,
    rejected,
    reviewValidationErrors,
    regenerationRequired: regenerationReasons.size > 0,
    regenerationReasons: [...regenerationReasons].sort(),
  };
}
