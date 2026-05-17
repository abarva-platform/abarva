// Source · MRM-readiness vendor screen · Wave C1 · encoded SR 11-7 criteria.
//
// This is the encoded expert framework — the SR 11-7 model-risk
// obligations a vendor-supplied model must be able to support, written
// down so the Source agent can apply them to a customer's grounded
// vendor evidence. It is NOT product copy and NOT generic LLM knowledge;
// it is the SR 11-7 standard a model-risk-management reviewer applies.
//
// Source: Federal Reserve SR 11-7 / OCC Bulletin 2011-12, "Supervisory
// Guidance on Model Risk Management" (2011). Section references below
// follow the public guidance. SR 11-7 §VII is explicit that vendor and
// third-party models are in scope and that validation responsibility is
// non-delegable — the acquiring institution owns it. A vendor that
// cannot supply what validation needs therefore makes the institution
// non-compliant by construction, which is why these are *gating*
// criteria, not weighted scorecard lines.
//
// Expert-validation requirement (per SOURCE-SOURCING-METHODOLOGY.md §1):
// before this ships in Source it should be reviewed by a model-risk SME
// / procurement counsel, exactly as the AI-clause library is.

import type { MrmCriterionDefinition, MrmCriterionId } from './types';

/**
 * The eight encoded SR 11-7 MRM-readiness criteria. Ordered criticals
 * first — the three that map to the institution's non-delegable duties
 * (independent validation, ongoing monitoring, outcomes analysis) plus
 * conceptual-soundness evidence, then the supporting criteria.
 */
export const MRM_CRITERIA: readonly MrmCriterionDefinition[] = [
  {
    id: 'independent_validation_support',
    label: 'Independent validation support',
    sr117Reference: 'SR 11-7 §V — Validation; §VII — Vendor/third-party models',
    question:
      'Will the vendor give the institution (or its independent validators) the model documentation, methodology, assumptions, and test access needed to perform effective independent validation of the vendor model?',
    whyGating:
      'SR 11-7 makes validation a non-delegable institutional responsibility, including for vendor models. A vendor that treats its model as an opaque black box leaves the institution unable to discharge that duty — a hard regulatory bar, not a pricing trade-off.',
    critical: true,
  },
  {
    id: 'conceptual_soundness_evidence',
    label: 'Conceptual soundness evidence',
    sr117Reference: 'SR 11-7 §V.1 — Evaluation of conceptual soundness',
    question:
      'Can the vendor evidence the conceptual soundness of the model — its design, theory, assumptions, limitations, and the developmental testing behind it?',
    whyGating:
      'Without design rationale and developmental evidence, the institution cannot assess whether the model is sound for its intended use; SR 11-7 treats conceptual soundness as a core validation pillar.',
    critical: true,
  },
  {
    id: 'ongoing_monitoring_drift',
    label: 'Ongoing monitoring & drift detection',
    sr117Reference: 'SR 11-7 §V.2 — Ongoing monitoring',
    question:
      'Does the vendor support ongoing monitoring — performance tracking, benchmarking, and detection of model/data drift — including notifying the institution of material model changes or degradation?',
    whyGating:
      'SR 11-7 requires ongoing monitoring to confirm a model still works as intended. An AI/ML model that drifts silently is a live regulatory exposure; a vendor with no drift signal makes monitoring impossible.',
    critical: true,
  },
  {
    id: 'outcomes_analysis_backtesting',
    label: 'Outcomes analysis & backtesting',
    sr117Reference: 'SR 11-7 §V.3 — Outcomes analysis',
    question:
      'Will the vendor support outcomes analysis — backtesting, sensitivity analysis, and comparison of model outputs to actual results — over the institution’s own data?',
    whyGating:
      'Outcomes analysis is how SR 11-7 expects model performance to be challenged empirically. A vendor that will not expose outputs to backtesting blocks a required validation activity.',
    critical: true,
  },
  {
    id: 'explainability_documentation',
    label: 'Explainability & model documentation',
    sr117Reference: 'SR 11-7 §VI — Documentation; §V — Validation',
    question:
      'Does the vendor provide explainability for individual decisions and complete, current model documentation (a model card or equivalent) sufficient for a reviewer who did not build the model?',
    whyGating:
      'SR 11-7 requires documentation detailed enough for independent review. For AI/ML credit and fraud models, lack of explainability also collides with fair-lending and adverse-action obligations — a non-critical but material gap.',
    critical: false,
  },
  {
    id: 'data_lineage_quality',
    label: 'Data lineage & input quality',
    sr117Reference: 'SR 11-7 §III / §V.1 — Data and information used',
    question:
      'Can the vendor evidence the provenance, quality, and representativeness of the data the model was trained and calibrated on, and the data the institution must supply at run time?',
    whyGating:
      'SR 11-7 treats data quality and relevance as part of model risk. Unknown training-data lineage is both a soundness risk and an IP/bias risk the institution inherits.',
    critical: false,
  },
  {
    id: 'change_management_versioning',
    label: 'Change management & versioning',
    sr117Reference: 'SR 11-7 §VI — Documentation; §V.2 — Ongoing monitoring',
    question:
      'Does the vendor operate disciplined model versioning and change management — advance notice of model updates, revalidation triggers, and the ability to pin or roll back a model version?',
    whyGating:
      'An un-versioned model the vendor silently updates re-opens validation every release. SR 11-7 expects model changes to be controlled and revalidated.',
    critical: false,
  },
  {
    id: 'mrm_governance_roles',
    label: 'MRM governance & accountability',
    sr117Reference: 'SR 11-7 §VII — Governance, policies, and controls',
    question:
      'Does the vendor have a defined model-risk governance function — named accountable owners, an internal validation/review practice, and a contractual route for the institution’s MRM audit rights?',
    whyGating:
      'SR 11-7 §VII expects governance, policies, and controls around model risk. A vendor with no MRM function of its own cannot be a credible partner for a regulated model.',
    critical: false,
  },
];

const CRITERIA_BY_ID: ReadonlyMap<MrmCriterionId, MrmCriterionDefinition> =
  new Map(MRM_CRITERIA.map((c) => [c.id, c]));

/** Look up an encoded criterion definition by id. */
export function getMrmCriterion(
  id: MrmCriterionId,
): MrmCriterionDefinition | undefined {
  return CRITERIA_BY_ID.get(id);
}

/** The ids of the critical (must-be-fully-met) criteria. */
export const MRM_CRITICAL_CRITERION_IDS: readonly MrmCriterionId[] =
  MRM_CRITERIA.filter((c) => c.critical).map((c) => c.id);
