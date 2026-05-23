import { defineRubric } from './shared';

export const instrumentRubric = defineRubric({
  type: 'instrument',
  code: 'I',
  title: 'Data-collection Instrument',
  description: 'An instrument must collect evidence with statistical, privacy, and cleaning discipline.',
  passThreshold: 8,
  requiredSections: ['Sample size', 'Bias controls', 'Privacy', 'Validation rules', 'Triangulation', 'Refresh cadence'],
  criteria: [
    { id: 'I1', label: 'Sample math', weight: 1, description: 'Sample size and confidence math.', evidence: ['sample size', 'confidence', 'power'] },
    { id: 'I2', label: 'Bias controls', weight: 1, description: 'Response, selection, and social-desirability controls.', evidence: ['bias controls', 'selection bias', 'social-desirability'] },
    { id: 'I3', label: 'Privacy consent', weight: 1, description: 'Consent and anonymization-at-source.', evidence: ['privacy', 'consent', 'anonymization-at-source'] },
    { id: 'I4', label: 'Validation rules', weight: 1, description: 'Capture-time validation.', evidence: ['validation rules', 'capture'] },
    { id: 'I5', label: 'Triangulation', weight: 1, description: 'No single instrument is treated as truth.', evidence: ['triangulation', 'cross-check'] },
    { id: 'I6', label: 'Calibration questions', weight: 1, description: 'Attention checks or calibration questions.', evidence: ['calibration questions', 'attention check'] },
    { id: 'I7', label: 'Cleaning checklist', weight: 1, description: '15 named cleaning steps.', evidence: ['data-cleaning checklist', '15 named steps'] },
    { id: 'I8', label: 'Edge cases', weight: 1, description: 'Handling guide for non-standard teams/data.', evidence: ['edge-case', 'contractor-heavy', 'mainframe'] },
    { id: 'I9', label: 'Missing-data sensitivity', weight: 1, description: 'Sensitivity to missing data.', evidence: ['missing data', 'sensitivity'] },
    { id: 'I10', label: 'Refresh cadence', weight: 1, description: 'Refresh owner and cadence.', evidence: ['refresh cadence', 'monthly', 'quarterly'] },
  ],
});
