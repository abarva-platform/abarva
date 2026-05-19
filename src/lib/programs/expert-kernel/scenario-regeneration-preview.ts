// Moves Expert Kernel — scenario regeneration preview.
//
// Applies accepted watched-session / workshop updates into a deterministic
// preview. This is deliberately not a full business-case recomputation: rate
// card and economics changes are flagged as requiring the full estimator.
// The preview lets a reviewer see exactly what would change before any case is
// promoted.

import {
  buildAssumptionLedger,
  type AssumptionLedger,
} from './assumption-ledger';
import {
  buildBaselineModel,
  type BaselineModel,
} from './baseline-model';
import type { BusinessCaseSkeleton } from './business-case-compiler';
import type { RegenerationArtifactId, RegenerationDiff } from './watched-session-mode';
import type { ScenarioUpdateAssessment, ScenarioUpdateInput } from './scenario-updates';
import type { Confidence } from './types';

export interface AppliedRegenerationChange {
  updateKey: string;
  updateLabel: string;
  lane: ScenarioUpdateInput['kind'];
  beforeValue: number | string | null;
  afterValue: number | string | undefined;
  owner: string;
  source: string;
  affectedArtifacts: RegenerationArtifactId[];
}

export interface BlockedRegenerationChange {
  updateKey: string;
  updateLabel: string;
  reason: string;
}

export interface ScenarioRegenerationPreview {
  state: 'preview_ready' | 'preview_with_recompute_required';
  recommendationBefore: BusinessCaseSkeleton['recommendation'];
  recommendationAfter: 'requires_recompute_before_promotion';
  baselineBefore: {
    coverage: number;
    seedGapCount: number;
  };
  baselineAfter: {
    coverage: number;
    seedGapCount: number;
    resolvedSeedGaps: string[];
  };
  baselinePreview: BaselineModel;
  assumptionPreview: AssumptionLedger;
  appliedChanges: AppliedRegenerationChange[];
  blockedChanges: BlockedRegenerationChange[];
  challengedAssumptions: string[];
  rateCardOverrides: string[];
  mobilizeActions: string[];
  fullRecomputeReasons: string[];
  affectedArtifacts: RegenerationArtifactId[];
  auditSummary: string;
}

export function buildScenarioRegenerationPreview(
  skeleton: BusinessCaseSkeleton,
  assessment: ScenarioUpdateAssessment,
  diff: RegenerationDiff,
): ScenarioRegenerationPreview {
  const baselineInputs = skeleton.baseline.metrics.map((metric) => ({ ...metric }));
  const assumptionInputs = skeleton.assumptions.assumptions.map((assumption) => ({
    ...assumption,
  }));
  const appliedChanges: AppliedRegenerationChange[] = [];
  const blockedChanges: BlockedRegenerationChange[] = diff.rejectedChanges.map((change) => ({
    updateKey: change.updateKey,
    updateLabel: change.updateLabel,
    reason: change.reason,
  }));
  const challengedAssumptions: string[] = [];
  const rateCardOverrides: string[] = [];
  const mobilizeActions: string[] = [];
  const fullRecomputeReasons = new Set<string>();

  const seedGapKeysBefore = new Set(skeleton.baseline.seedGaps.map((metric) => metric.key));

  for (const update of assessment.accepted) {
    const artifactChange = diff.acceptedChanges.find(
      (change) => change.updateKey === update.key && change.updateKind === update.kind,
    );

    if (update.kind === 'baseline_metric') {
      const metric = baselineInputs.find((item) => item.key === update.key);
      if (!metric) {
        blockedChanges.push({
          updateKey: update.key,
          updateLabel: update.label,
          reason: 'No matching baseline metric exists in the preview model.',
        });
        continue;
      }
      if (typeof update.value !== 'number') {
        blockedChanges.push({
          updateKey: update.key,
          updateLabel: update.label,
          reason: 'Baseline updates require a numeric value before preview regeneration.',
        });
        continue;
      }

      const beforeValue = metric.value;
      metric.value = update.value;
      metric.source = update.source;
      metric.sourceQuality = 'stated';
      metric.confidence = 'medium';
      metric.seedGapReason = undefined;
      metric.caveat = 'Updated from watched-session / workshop evidence; verify before promotion.';

      appliedChanges.push(applied(update, beforeValue, artifactChange));
      fullRecomputeReasons.add(`Baseline metric '${update.key}' changed.`);
      continue;
    }

    if (update.kind === 'assumption_review') {
      const assumption = assumptionInputs.find((item) => item.key === update.key);
      if (!assumption) {
        blockedChanges.push({
          updateKey: update.key,
          updateLabel: update.label,
          reason: 'No matching assumption exists in the preview model.',
        });
        continue;
      }
      assumption.owner = update.owner || assumption.owner;
      assumption.confidence = lowerConfidence(assumption.confidence);
      assumption.source =
        `${assumption.source}; challenged in session by ${update.owner}: ` +
        `${update.requiredAction ?? update.source}`;
      challengedAssumptions.push(update.key);
      appliedChanges.push(applied(update, null, artifactChange));
      fullRecomputeReasons.add(`Assumption '${update.key}' needs sensitivity review.`);
      continue;
    }

    if (update.kind === 'rate_card_override') {
      rateCardOverrides.push(update.key);
      appliedChanges.push(applied(update, null, artifactChange));
      fullRecomputeReasons.add(
        `Rate-card override '${update.key}' requires effort-estimator recomputation.`,
      );
      continue;
    }

    mobilizeActions.push(update.requiredAction ?? update.label);
    appliedChanges.push(applied(update, null, artifactChange));
  }

  const baselinePreview = buildBaselineModel({
    moveName: skeleton.moveName,
    tenantKey: skeleton.tenantKey,
    metrics: baselineInputs,
  });
  const assumptionPreview = buildAssumptionLedger(assumptionInputs);
  const resolvedSeedGaps = baselinePreview.recordedMetrics
    .filter((metric) => seedGapKeysBefore.has(metric.key))
    .map((metric) => metric.key)
    .sort();

  const affectedArtifacts = unique(
    appliedChanges.flatMap((change) => change.affectedArtifacts),
  );

  return {
    state:
      fullRecomputeReasons.size > 0
        ? 'preview_with_recompute_required'
        : 'preview_ready',
    recommendationBefore: skeleton.recommendation,
    recommendationAfter: 'requires_recompute_before_promotion',
    baselineBefore: {
      coverage: skeleton.baseline.coverage,
      seedGapCount: skeleton.baseline.seedGaps.length,
    },
    baselineAfter: {
      coverage: baselinePreview.coverage,
      seedGapCount: baselinePreview.seedGaps.length,
      resolvedSeedGaps,
    },
    baselinePreview,
    assumptionPreview,
    appliedChanges,
    blockedChanges,
    challengedAssumptions: challengedAssumptions.sort(),
    rateCardOverrides: rateCardOverrides.sort(),
    mobilizeActions,
    fullRecomputeReasons: [...fullRecomputeReasons].sort(),
    affectedArtifacts,
    auditSummary:
      `${appliedChanges.length} change(s) preview-applied, ` +
      `${resolvedSeedGaps.length} seed gap(s) resolved in preview, ` +
      `${fullRecomputeReasons.size} full recompute reason(s).`,
  };
}

function applied(
  update: ScenarioUpdateInput,
  beforeValue: number | string | null,
  diffItem: RegenerationDiff['acceptedChanges'][number] | undefined,
): AppliedRegenerationChange {
  return {
    updateKey: update.key,
    updateLabel: update.label,
    lane: update.kind,
    beforeValue,
    afterValue: update.value,
    owner: update.owner,
    source: update.source,
    affectedArtifacts: diffItem?.affectedArtifacts ?? [],
  };
}

function lowerConfidence(confidence: Confidence): Confidence {
  if (confidence === 'high') return 'medium';
  return confidence;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
