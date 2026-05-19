// Moves Expert Kernel — interactive advisory behavior.
//
// This closes the "interactive advisory" gap: when the kernel cannot defend a
// business case, the agent should guide the user to the next missing fact or
// decision instead of returning a static document.

import type { BusinessCaseSkeleton } from './business-case-compiler';

export type AdvisoryActionKind =
  | 'ask_for_data'
  | 'challenge_assumption'
  | 'assign_owner'
  | 'explain_recommendation'
  | 'prepare_tower_measurement';

export interface AdvisoryAction {
  kind: AdvisoryActionKind;
  priority: number;
  prompt: string;
  why: string;
  relatedKeys: string[];
}

export interface AdvisoryTurn {
  headline: string;
  recommendedAction: AdvisoryAction;
  actions: AdvisoryAction[];
}

export function buildNextBestAdvisoryTurn(
  skeleton: BusinessCaseSkeleton,
): AdvisoryTurn {
  const actions: AdvisoryAction[] = [];

  for (const gap of skeleton.baseline.seedGaps) {
    const priority = gap.key.includes('cost')
      ? 110
      : gap.key.includes('volume')
        ? 100
        : 70;
    actions.push({
      kind: 'ask_for_data',
      priority,
      prompt: `Please provide ${gap.label} (${gap.unit}) or confirm who owns it.`,
      why: gap.seedGapReason ?? 'This metric is not recorded.',
      relatedKeys: [gap.key],
    });
  }

  for (const assumption of skeleton.assumptions.topMovers) {
    actions.push({
      kind: assumption.isSeedGapProxy ? 'challenge_assumption' : 'explain_recommendation',
      priority: assumption.isSeedGapProxy ? 95 : 50,
      prompt: `Validate assumption "${assumption.key}" with ${assumption.owner}.`,
      why: `Sensitivity impact is ${assumption.sensitivityImpact}; confidence is ${assumption.confidence}.`,
      relatedKeys: [assumption.key],
    });
  }

  for (const blocker of skeleton.critic.blockers) {
    actions.push({
      kind: 'assign_owner',
      priority: 90,
      prompt: `Assign an owner to close critic blocker "${blocker.code}".`,
      why: blocker.message,
      relatedKeys: [blocker.code],
    });
  }

  if (skeleton.towerHandoff.length > 0) {
    actions.push({
      kind: 'prepare_tower_measurement',
      priority: 35,
      prompt: 'Confirm Tower measurement cadence and owner before mobilization.',
      why: 'The business case must hand Tower a measurable baseline-to-outcome spine.',
      relatedKeys: skeleton.towerHandoff.map((handoff) => handoff.metricKey),
    });
  }

  const sorted = actions.sort((a, b) => b.priority - a.priority || a.prompt.localeCompare(b.prompt));
  const recommendedAction = sorted[0] ?? {
    kind: 'explain_recommendation',
    priority: 1,
    prompt: 'Explain the recommendation and evidence used.',
    why: 'No missing data or critic blocker is open.',
    relatedKeys: [],
  };

  return {
    headline:
      skeleton.recommendation === 'fund'
        ? 'The case is defensible; move to funding challenge.'
        : 'The case is not yet fundable; close the highest-sensitivity blocker first.',
    recommendedAction,
    actions: sorted,
  };
}
