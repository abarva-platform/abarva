export const RESPONSIBLE_AI_TRAINING_VERSION = 'responsible-ai-training-v1-2026-06-02';

export const RESPONSIBLE_AI_TRAINING_ROUTE = '/responsible-ai/training';

export const RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES = 10;

export const RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT =
  'I completed the Responsible AI Use training and understand that AbarVa provides AI-assisted decision support. I remain responsible for reviewing evidence, validating assumptions, escalating uncertainty, and approving actions before they are taken.';

export const RESPONSIBLE_AI_TRAINING_MODULES = [
  {
    title: 'AbarVa is an advisor, not the decision owner',
    body:
      'AI-generated briefs, recommendations, forecasts, and drafts support your review. They do not replace human judgment, approval authority, policy obligations, or professional accountability.',
  },
  {
    title: 'Check evidence before acting',
    body:
      'Review source citations, confidence cues, missing-data warnings, and assumptions before committing a Move, Source action, configuration change, export, or client communication.',
  },
  {
    title: 'Escalate uncertainty and sensitive data',
    body:
      'Pause when evidence is incomplete, schema mappings are unclear, PHI/PII may be present, or the action could affect spend, obligations, workforce decisions, customers, or external parties.',
  },
  {
    title: 'Use edit-before-commit and justification fields',
    body:
      'Treat AI drafts as starting points. Edit them, add your reasoning, attach evidence, and make the approval record clear enough for a future audit.',
  },
] as const;
