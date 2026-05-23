import { defineRubric } from './shared';

export const gateRubric = defineRubric({
  type: 'gate',
  code: 'G',
  title: 'Move Gate',
  description: 'A gate must be a deterministic decision surface with evidence, ownership, and kill criteria.',
  passThreshold: 8,
  requiredSections: ['RACI', 'Required artifacts', 'Evidence anchors', 'Kill criteria', 'Decision capture', 'Hand-off'],
  criteria: [
    { id: 'G1', label: 'RACI owner', weight: 1, description: 'Single accountable owner.', evidence: ['RACI', 'single accountable owner'] },
    { id: 'G2', label: 'Artifact criteria', weight: 1, description: 'Required artifacts and completion criteria.', evidence: ['required artifacts', 'completion criteria'] },
    { id: 'G3', label: 'Evidence anchors', weight: 1, description: 'Audit trail evidence anchors.', evidence: ['evidence anchors', 'audit trail'] },
    { id: 'G4', label: 'Numeric kill criteria', weight: 1, description: 'Kill thresholds are numeric.', evidence: ['kill criteria', '%', '$', 'threshold'] },
    { id: 'G5', label: 'Sensitivity', weight: 1, description: 'Gate sensitivity analysis.', evidence: ['sensitivity analysis', '+/-20%', '20 percent'] },
    { id: 'G6', label: 'Pre-mortem', weight: 1, description: 'Pre-mortem ritual.', evidence: ['pre-mortem', 'ritual'] },
    { id: 'G7', label: 'Decision and dissent', weight: 1, description: 'Decision capture and dissent log.', evidence: ['decision capture', 'dissent log'] },
    { id: 'G8', label: 'Time budget', weight: 1, description: 'P50/P90 time budget.', evidence: ['time budget', 'P50', 'P90'] },
    { id: 'G9', label: 'Hand-off', weight: 1, description: 'Next-gate hand-off ritual.', evidence: ['hand-off', 'next gate'] },
    { id: 'G10', label: 'Maturity great', weight: 1, description: 'Maturity model states what great looks like.', evidence: ['maturity model', 'great looks like', 'stage 5'] },
  ],
});
