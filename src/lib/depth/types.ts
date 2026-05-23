export type DepthRubricType = 'template' | 'workshop' | 'instrument' | 'pattern' | 'gate' | 'sentinel';

export interface DepthCriterion {
  id: string;
  label: string;
  weight: number;
  description: string;
  evidence: readonly string[];
}

export interface DepthCriterionScore {
  criterion_id: string;
  label: string;
  score: number;
  reasoning: string;
  structural_hits: string[];
}

export interface DepthStructuralResult {
  criterionScores: DepthCriterionScore[];
  missingRequiredSections: string[];
  structuralScore: number;
}

export interface DepthRubricDefinition {
  type: DepthRubricType;
  code: 'T' | 'W' | 'I' | 'P' | 'G' | 'S';
  title: string;
  description: string;
  passThreshold: number;
  criteria: readonly DepthCriterion[];
  requiredSections: readonly string[];
  structuralCheck(content: string): DepthStructuralResult;
  semanticPrompt(content: string, structural: DepthStructuralResult): string;
}

export interface DepthLintResult {
  artifact_id: string;
  rubric_type: DepthRubricType;
  total_score: number;
  criterion_scores: DepthCriterionScore[];
  reasoning: string;
  pass: boolean;
  cache_hit?: boolean;
  estimated_cost_usd?: number;
  alert?: string;
}

export interface DepthScoreOptions {
  artifactId?: string;
  userId?: string;
}
