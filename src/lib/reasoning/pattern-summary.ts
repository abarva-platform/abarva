// src/lib/reasoning/pattern-summary.ts
//
// Pure helpers that flatten a LifecyclePatternSeed into the small strings the
// PatternSelector card + preview pane render. No React imports — keeps the
// helper deterministic and trivially testable.

import type {
  LifecyclePatternSeed,
  ContradictionTemplate,
  ExpectedArtifact,
  LifecycleStage,
} from '@/lib/intelligence/seed-types';

export interface PatternSummary {
  patternId: string;
  title: string;
  /** Single-line applicability sentence, truncated to ~140 chars. */
  applicabilityLine: string;
  /** Short label like "30–120 days". */
  durationLabel: string;
  /** "10 stages" / "1 stage". */
  stageCountLabel: string;
}

export interface PatternPreview {
  /** First N stage labels in order. */
  topStageLabels: string[];
  /** Top N expected artifacts, required first. */
  topArtifacts: Array<{ label: string; stageId: string; requirement: ExpectedArtifact['requirement'] }>;
  /** A representative contradiction template, or null if the pattern has none. */
  topContradiction: {
    label: string;
    partyA: string;
    partyB: string;
    severity: ContradictionTemplate['severity'];
  } | null;
}

const MAX_APPLICABILITY = 140;

/** Truncate to the nearest word boundary under the cap, appending an ellipsis. */
function truncate(input: string, cap = MAX_APPLICABILITY): string {
  const trimmed = input.trim();
  if (trimmed.length <= cap) return trimmed;
  // Drop everything past the last space within the cap.
  const slice = trimmed.slice(0, cap);
  const lastSpace = slice.lastIndexOf(' ');
  const head = lastSpace > cap * 0.6 ? slice.slice(0, lastSpace) : slice;
  return head.replace(/[.,;:\s]+$/, '') + '…';
}

/** Stage-count label that pluralises correctly. */
function stageCountLabel(stages: LifecycleStage[]): string {
  return stages.length === 1 ? '1 stage' : `${stages.length} stages`;
}

/** Range label like "30–120 days"; collapses identical min/max. */
function durationLabel(range: { min: number; max: number }): string {
  if (range.min === range.max) return `${range.min} days`;
  return `${range.min}–${range.max} days`;
}

/**
 * Build the small card-row summary for a pattern.
 * Pure — no I/O, no randomness.
 */
export function summarizePattern(pattern: LifecyclePatternSeed): PatternSummary {
  return {
    patternId: pattern.patternId,
    title: pattern.title,
    applicabilityLine: truncate(pattern.applicability),
    durationLabel: durationLabel(pattern.typicalDurationDays),
    stageCountLabel: stageCountLabel(pattern.stages),
  };
}

/**
 * Build the preview-pane shape for a pattern: first 5 stage labels, top 3
 * expected artifacts (required first), and one contradiction template.
 */
export function previewPattern(pattern: LifecyclePatternSeed): PatternPreview {
  const orderedStages = [...pattern.stages].sort((a, b) => a.order - b.order);
  const topStageLabels = orderedStages.slice(0, 5).map((s) => s.label);

  const requirementRank: Record<ExpectedArtifact['requirement'], number> = {
    required: 0,
    recommended: 1,
    optional: 2,
  };
  const topArtifacts = [...pattern.expectedArtifacts]
    .sort((a, b) => requirementRank[a.requirement] - requirementRank[b.requirement])
    .slice(0, 3)
    .map((a) => ({ label: a.label, stageId: a.stageId, requirement: a.requirement }));

  const severityRank: Record<ContradictionTemplate['severity'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const sortedContradictions = [...pattern.contradictionTemplates].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
  const top = sortedContradictions[0];
  const topContradiction = top
    ? { label: top.label, partyA: top.partyA, partyB: top.partyB, severity: top.severity }
    : null;

  return { topStageLabels, topArtifacts, topContradiction };
}
