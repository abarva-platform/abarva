export const RESPONSIBLE_AI_PRINCIPLES = [
  {
    title: 'AbarVa advises; humans decide',
    body:
      'AbarVa generates decision support, not autonomous business decisions. Consequential actions require a named human owner, cited evidence, and an approval step.',
  },
  {
    title: 'Evidence must stay visible',
    body:
      'Recommendations should show sources, assumptions, missing inputs, confidence, and what would change the recommendation.',
  },
  {
    title: 'No silent high-risk use',
    body:
      'Employment, healthcare treatment, credit, insurance, legal determinations, regulated consumer decisions, and individual-rights impacts require additional review or are outside permitted use.',
  },
  {
    title: 'Client context is scoped',
    body:
      'Client data and generated artifacts are handled through tenant-scoped controls. Cross-client access is treated as a security incident.',
  },
] as const;

export const MODEL_CARD_ROWS = [
  ['Primary use', 'Enterprise AI program, sourcing, portfolio, and setup decision support.'],
  ['Primary users', 'Client executives, program leads, sourcing teams, and AbarVa operators.'],
  ['Human oversight', 'Required for approvals, exports, gate advances, external actions, and high-risk recommendations.'],
  ['Inputs', 'Client-approved context, structured program/source records, uploaded evidence, public corpus material, and user prompts.'],
  ['Outputs', 'Draft recommendations, evidence summaries, risk flags, artifacts, board-pack language, and next-action suggestions.'],
  ['Known limitations', 'Outputs can be incomplete, stale, overly confident, or wrong when source context is missing or contradictory.'],
  ['Monitoring', 'Release gates, audit records, evidence packets, prompt/output controls, and targeted regression tests.'],
  ['Review cadence', 'Updated on material model, prompt, retrieval, policy, or release-control changes.'],
] as const;

export const KNOWN_LIMITATIONS = [
  {
    title: 'AbarVa can miss missing data',
    body:
      'The system can identify many evidence gaps, but it may fail to notice that a needed input is absent, stale, or outside the corpus.',
  },
  {
    title: 'AbarVa can overstate certainty',
    body:
      'Confidence labels and assumptions reduce this risk, but they do not replace user review of the underlying evidence.',
  },
  {
    title: 'AbarVa can inherit source errors',
    body:
      'If an uploaded file, structured record, or seed corpus contains errors, the system may carry those errors into downstream analysis.',
  },
  {
    title: 'AbarVa is not a regulated decision system',
    body:
      'It must not be used as the final authority for legal, medical, credit, insurance, employment, or individual-rights decisions.',
  },
  {
    title: 'AbarVa is not a substitute for counsel or professional review',
    body:
      'Legal, accounting, security, clinical, procurement, and compliance conclusions require qualified human review.',
  },
] as const;
