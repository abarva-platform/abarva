import { defineRubric } from './shared';

export const patternRubric = defineRubric({
  type: 'pattern',
  code: 'P',
  title: 'Corpus Pattern',
  description: 'A corpus pattern must be a citable, bounded, decision-grade claim.',
  passThreshold: 8,
  requiredSections: ['Quantified claim', 'Evidence', 'Counterarguments', 'Confidence', 'Boundary conditions', 'Synthesis'],
  criteria: [
    { id: 'P1', label: 'Quantified claim', weight: 1, description: 'Number, scope, and horizon.', evidence: ['quantified claim', 'scope', 'horizon', '%'] },
    { id: 'P2', label: 'Evidence chunks', weight: 1, description: 'Three to five evidence chunks with primary citations.', evidence: ['evidence chunk', 'primary citation', 'source'] },
    { id: 'P3', label: 'Counterarguments', weight: 1, description: 'At least two named counterarguments.', evidence: ['counterargument', 'steelman'] },
    { id: 'P4', label: 'Calibrated confidence', weight: 1, description: 'Confidence is explicit and justified.', evidence: ['calibrated confidence', 'confidence'] },
    { id: 'P5', label: 'Boundary conditions', weight: 1, description: 'When this does not apply.', evidence: ['boundary conditions', 'does not apply'] },
    { id: 'P6', label: 'Failure modes', weight: 1, description: 'At least two failure modes.', evidence: ['failure mode', 'goes wrong when'] },
    { id: 'P7', label: 'Maturity linkage', weight: 1, description: 'Links to maturity stages.', evidence: ['maturity model', 'stage'] },
    { id: 'P8', label: 'Vertical overlay', weight: 1, description: 'Industry-specific changes.', evidence: ['vertical overlay', 'healthcare', 'financial services', 'retail'] },
    { id: 'P9', label: 'Related patterns', weight: 1, description: 'Graph relationships are listed.', evidence: ['related patterns', 'depends_on', 'contradicts', 'reinforces'] },
    { id: 'P10', label: 'So what', weight: 1, description: 'Synthesis paragraph states the executive implication.', evidence: ['so what', 'synthesis'] },
  ],
});
