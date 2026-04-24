export type SourceContextQualityDimension =
  | 'contextCompleteness'
  | 'patternGrounding'
  | 'evidenceCoverage'
  | 'eventStateGrounding'
  | 'missingInputAwareness'
  | 'actionability'
  | 'vanillaResponseRisk';

export type SourceContextQualityLabel = 'low' | 'medium' | 'high';

export type SourceContextQualityScoreValue = 0 | 1 | 2 | 3 | 4 | 5;

export type SourceVanillaResponseRisk = SourceContextQualityScoreValue;

export interface SourceContextQualityScore {
  contextCompleteness: SourceContextQualityScoreValue;
  patternGrounding: SourceContextQualityScoreValue;
  evidenceCoverage: SourceContextQualityScoreValue;
  eventStateGrounding: SourceContextQualityScoreValue;
  missingInputAwareness: SourceContextQualityScoreValue;
  actionability: SourceContextQualityScoreValue;
  vanillaResponseRisk: SourceVanillaResponseRisk;
  overallConfidence: SourceContextQualityLabel;
  missingContextReasons: string[];
}

export interface SourceContextQualityThresholds {
  minimumContextGrounding: SourceContextQualityScoreValue;
  minimumActionability: SourceContextQualityScoreValue;
  minimumEvidenceForEventSpecificAnswer: SourceContextQualityScoreValue;
  maximumVanillaResponseRisk: SourceVanillaResponseRisk;
}

export interface SourceContextQualityAssessment {
  score: SourceContextQualityScore;
  thresholds: SourceContextQualityThresholds;
  passes: boolean;
  failedDimensions: SourceContextQualityDimension[];
  notes: string[];
}

export const DEFAULT_SOURCE_CONTEXT_QUALITY_THRESHOLDS: SourceContextQualityThresholds = {
  minimumContextGrounding: 4,
  minimumActionability: 4,
  minimumEvidenceForEventSpecificAnswer: 3,
  maximumVanillaResponseRisk: 1,
};
