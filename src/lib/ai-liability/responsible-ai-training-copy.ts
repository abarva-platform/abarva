export const RESPONSIBLE_AI_TRAINING_VERSION =
  "responsible-ai-training-v1-2026-06-02";

export const RESPONSIBLE_AI_TRAINING_ROUTE = "/responsible-ai/training";

export const RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES = 10;

export const RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT =
  "I completed the Responsible AI Use training and understand that AbarVa provides AI-assisted decision support. I remain responsible for reviewing evidence, validating assumptions, escalating uncertainty, and approving actions before they are taken.";

export interface ResponsibleAiTrainingModule {
  readonly title: string;
  readonly body: string;
}

export const RESPONSIBLE_AI_TRAINING_MODULES = [
  {
    title: "AbarVa is an advisor, not the decision owner",
    body: "AI-generated briefs, recommendations, forecasts, and drafts support your review. They do not replace human judgment, approval authority, policy obligations, or professional accountability.",
  },
  {
    title: "Check evidence before acting",
    body: "Review source citations, confidence cues, missing-data warnings, and assumptions before committing a Move, Source action, configuration change, export, or client communication.",
  },
  {
    title: "Escalate uncertainty and sensitive data",
    body: "Pause when evidence is incomplete, schema mappings are unclear, PHI/PII may be present, or the action could affect spend, obligations, workforce decisions, customers, or external parties.",
  },
  {
    title: "Use edit-before-commit and justification fields",
    body: "Treat AI drafts as starting points. Edit them, add your reasoning, attach evidence, and make the approval record clear enough for a future audit.",
  },
] as const satisfies readonly ResponsibleAiTrainingModule[];

export const AIRLINE_FOUNDATION_TRAINING_COMPLETION_STATEMENT =
  "I completed the Airline Demo New foundation training and understand that the Knowledge Baseline is decision-support context, not approval authority. I will use accepted evidence, honor deferred categories, verify module outputs before action, and keep human owners accountable for business decisions.";

export const AIRLINE_FOUNDATION_TRAINING_MODULES = [
  {
    title: "Start from the active Knowledge Baseline",
    body: "For Airline Demo New, the trusted starting point is the governed baseline identity shown in the product. Treat the baseline ID, content hash, projection version, source release, and refresh run as the audit trail for what aVa, Knowledge, Cube, and analytics are allowed to use.",
  },
  {
    title: "Separate accepted evidence from deferred claims",
    body: "Inventory facts, routine source-derived records, and evidence-backed relationships can inform the demo. Commercial conclusions, target-state assertions, KPI interpretations, and high-impact dependencies remain deferred until explicitly reviewed and approved.",
  },
  {
    title: "Use the airline workflow boundary",
    body: "Knowledge explains the enterprise context. Intelligence and aVa synthesize that context. Source, Moves, and Tower may keep operational workflow state, but accepted enterprise facts must publish through the governed Knowledge path before they are treated as reusable truth.",
  },
  {
    title: "Look for business value, not raw data volume",
    body: "A strong answer should connect airline operations, vendors, systems, incidents, spend, risk, and evidence into business decisions: network resilience, IROPS readiness, operational exposure, sourcing leverage, modernization sequence, and value protection.",
  },
  {
    title: "Keep human ownership explicit",
    body: "AbarVa can prepare evidence, identify gaps, recommend next questions, and generate executive artifacts. A human owner must still validate assumptions, review source boundaries, approve vendor or operational actions, and decide what is safe for client-facing use.",
  },
] as const satisfies readonly ResponsibleAiTrainingModule[];
