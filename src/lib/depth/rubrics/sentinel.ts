import { defineRubric } from './shared';

export const sentinelRubric = defineRubric({
  type: 'sentinel',
  code: 'S',
  title: 'Sentinel Reasoning Output',
  description: 'A Sentinel output must be grounded, dissent-aware, and traceable.',
  passThreshold: 8,
  requiredSections: ['Clarifying questions', 'Frame', 'Tenant evidence', 'Corpus patterns', 'Dissent', 'Audit trail'],
  criteria: [
    { id: 'S1', label: 'Clarifies gaps', weight: 1, description: 'Asks clarifying questions when context is incomplete.', evidence: ['clarifying questions', 'context incomplete'] },
    { id: 'S2', label: 'Named frame', weight: 1, description: 'Names the reasoning frame.', evidence: ['frame', 'TIME', 'Wardley', 'decision frame'] },
    { id: 'S3', label: 'Tenant evidence', weight: 1, description: 'Tenant evidence per claim.', evidence: ['tenant evidence', 'client evidence', 'Apex Retail'] },
    { id: 'S4', label: 'Corpus citations', weight: 1, description: 'Corpus pattern cited per recommendation.', evidence: ['corpus pattern', 'P-IT-', 'citation'] },
    { id: 'S5', label: 'Confidence', weight: 1, description: 'Confidence per recommendation.', evidence: ['confidence', 'calibration'] },
    { id: 'S6', label: 'Dissent', weight: 1, description: 'Dissent is first-class.', evidence: ['dissent block', 'strongest objection'] },
    { id: 'S7', label: 'View-change hedge', weight: 1, description: 'States what would change the view.', evidence: ['what would change my view', 'would change my view'] },
    { id: 'S8', label: 'Constraint sensitivity', weight: 1, description: 'Sensitive to top user constraint.', evidence: ['top constraint', 'constraint sensitivity'] },
    { id: 'S9', label: 'Next action', weight: 1, description: 'Names a Move, workshop, or instrument.', evidence: ['next action', 'Move', 'workshop', 'instrument'] },
    { id: 'S10', label: 'Audit trail', weight: 1, description: 'Anchored to reasoning trace.', evidence: ['audit trail', 'reasoning trace'] },
  ],
});
