// Sourcing Stage Packs - PR-SRC-A
//
// Programs has PhasePack doctrine for Nexus. Sourcing needs the same kind of
// per-stage operating doctrine for Sentinel: what the stage produces, what
// evidence blocks advance, which questions to drive, and which procurement
// anti-patterns to flag before the event moves on.

import type {
  PhaseAntiPattern,
  PhaseCoachingArc,
  PhaseDependencies,
  PhaseEvidenceItem,
  PhaseQuestion,
} from '@/lib/programs/phase-packs/types';
import type { SourceStageKey } from '@/lib/source/types';

export type SourcingStageNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StageEvidenceItem = PhaseEvidenceItem;
export type StageQuestion = PhaseQuestion;
export type StageAntiPattern = PhaseAntiPattern;
export type StageCoachingArc = PhaseCoachingArc;
export type StageDependencies = PhaseDependencies;

export interface StagePackCrossReferences {
  /** Corpus pattern IDs Sentinel can retrieve through the broker. */
  patternIds: string[];
  /** Existing Source workflow keys this doctrine maps onto. */
  sourceStageKeys: SourceStageKey[];
}

export interface StagePack {
  stage: SourcingStageNumber;
  /** Display label, e.g. 'S5 BAFO'. */
  label: string;
  /** Source workflow stages that represent this procurement stage today. */
  sourceStageKeys?: SourceStageKey[];
  /** Corpus and workflow references. These are references only, not content. */
  crossReferences?: StagePackCrossReferences;
  /** What successful completion produces. */
  outcome: string;
  /** Evidence items the stage needs. Hard items block advance. */
  definitionOfDone: StageEvidenceItem[];
  /** Questions sequenced by stage arc. */
  rightQuestions: {
    open: StageQuestion[];
    converge: StageQuestion[];
    close: StageQuestion[];
  };
  /** Anti-patterns Sentinel must surface when detected. */
  antiPatterns: StageAntiPattern[];
  coachingArc: StageCoachingArc;
  dependencies: StageDependencies;
}
