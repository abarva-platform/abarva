import { corpus as defaultCorpus } from '../lib/intelligence';
import { detectContradictions, type ContradictionDetectionFinding } from '../lib/intelligence/contradiction-detector';
import type { ContradictionDetectionRuleId } from '../lib/intelligence/detection-rules';
import type { LoadedCorpus } from '../lib/intelligence/types';

export interface ContradictionDetectionJobInput {
  corpus?: LoadedCorpus;
  includeResolved?: boolean;
  detectedAt?: string;
}

export interface ContradictionDetectionJobSummary {
  scannedContradictions: number;
  scannedPatterns: number;
  scannedSignals: number;
  reviewQueueCount: number;
  ruleHitCounts: Record<ContradictionDetectionRuleId, number>;
}

export interface ContradictionDetectionJobResult {
  jobId: 'contradiction-detection-v1';
  detector: 'deterministic-rule-based';
  llmCalls: 0;
  detectedAt: string;
  summary: ContradictionDetectionJobSummary;
  reviewQueue: ContradictionDetectionFinding[];
}

export function runContradictionDetectionJob(input: ContradictionDetectionJobInput = {}): ContradictionDetectionJobResult {
  const activeCorpus = input.corpus ?? defaultCorpus;
  const detection = detectContradictions({
    corpus: activeCorpus,
    includeResolved: input.includeResolved,
  });

  return {
    jobId: 'contradiction-detection-v1',
    detector: 'deterministic-rule-based',
    llmCalls: 0,
    detectedAt: input.detectedAt ?? activeCorpus.loadedAt,
    summary: {
      scannedContradictions: detection.scannedContradictions,
      scannedPatterns: detection.scannedPatterns,
      scannedSignals: detection.scannedSignals,
      reviewQueueCount: detection.findings.length,
      ruleHitCounts: detection.ruleHitCounts,
    },
    reviewQueue: detection.findings,
  };
}
