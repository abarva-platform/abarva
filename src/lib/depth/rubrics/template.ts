import { defineRubric } from './shared';

export const templateRubric = defineRubric({
  type: 'template',
  code: 'T',
  title: 'Template / Artifact',
  description: 'A shipping artifact template must be executable by a delivery team, not just narratively persuasive.',
  passThreshold: 8,
  requiredSections: ['TOC', 'RACI', 'Sensitivity analysis', 'Quality gate', 'Maturity model', 'Vertical overlay'],
  criteria: [
    { id: 'T1', label: 'Numbered depth-tagged TOC', weight: 1, description: 'TOC uses L1/L2/L3 and effort estimates.', evidence: ['TOC', 'L1', 'L2', 'L3', 'effort estimate'] },
    { id: 'T2', label: 'Layered frameworks', weight: 1, description: 'At least two named frameworks are layered.', evidence: ['TIME', 'Wardley', 'Team Topologies', 'frameworks layered'] },
    { id: 'T3', label: 'Numerical benchmarks', weight: 1, description: 'Claims carry range, sample size, and source.', evidence: ['range', 'n=', 'source', 'benchmark'] },
    { id: 'T4', label: 'Anti-patterns', weight: 1, description: 'At least three named failure patterns.', evidence: ['anti-pattern', 'goes wrong when', 'failure mode'] },
    { id: 'T5', label: 'RACI and decision rights', weight: 1, description: 'Single accountable owner and thresholds.', evidence: ['RACI', 'single accountable owner', 'decision threshold'] },
    { id: 'T6', label: 'Sensitivity analysis', weight: 1, description: 'Assumption shifts include plus/minus 20 percent.', evidence: ['sensitivity analysis', '+/-20%', '20 percent'] },
    { id: 'T7', label: 'Sequenced sub-steps', weight: 1, description: 'Steps include effort and dependency arrows.', evidence: ['dependency arrow', 'depends on', 'P50', 'effort'] },
    { id: 'T8', label: 'Quality gate', weight: 1, description: 'Done definition is testable.', evidence: ['quality gate', 'done definition', 'testable criteria'] },
    { id: 'T9', label: 'Maturity model overlay', weight: 1, description: 'Current stage and next stage are explicit.', evidence: ['maturity model', 'stage 1', 'stage 5', 'next stage'] },
    { id: 'T10', label: 'Context overlay', weight: 1, description: 'Vertical, regional, or persona changes are explicit.', evidence: ['vertical overlay', 'regional overlay', 'persona overlay'] },
  ],
});
