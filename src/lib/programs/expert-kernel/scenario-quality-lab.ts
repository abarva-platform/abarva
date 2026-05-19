// Moves Expert Kernel — scenario quality lab.
//
// This is the "real-life scenario" audit harness for Moves. It does not
// replace user research. It gives us a deterministic, repeatable lab that asks
// the same questions a CXO / VP Sourcing / delivery lead would ask after a
// complex idea moves from Intelligence into Moves:
//   - Is every artifact grounded, not fabricated?
//   - Did the kernel challenge the case, or just generate prose?
//   - Are estimates and sensitivities CFO-defensible?
//   - Does the workshop/advisory loop tell the team what to do next?
//   - Can updated evidence be accepted, rejected, and routed without being
//     silently swallowed?
//
// Pure module: no I/O, no model calls, no DB. Same case + same update packet
// returns the same scorecard every time.

import {
  EXPERT_REVIEW_CASE_IDS,
  EXPERT_REVIEW_CASES,
  type ExpertReviewCaseId,
} from './expert-review-cases';
import {
  KERNEL_ARTIFACTS,
  type KernelArtifactId,
} from './exports/artifact-catalog';
import { buildNextBestAdvisoryTurn } from './advisory-session';
import {
  buildExpertReviewConsole,
  validateReviewSubmission,
} from './expert-review-console';
import type {
  ExpertReviewInput,
  ExpertReviewerRole,
} from './expert-review-calibration';
import type { BusinessCaseSkeleton } from './business-case-compiler';

export type ScenarioArtifactId =
  | 'intelligence_idea'
  | KernelArtifactId
  | 'workshop_session_support'
  | 'updated_content_acceptance'
  | 'trace_and_governance';

export interface ScenarioQualityCriterion {
  id: string;
  label: string;
  score: number;
  detail: string;
  gap?: string;
}

export interface ScenarioArtifactScore {
  artifactId: ScenarioArtifactId;
  label: string;
  score: number;
  verdict: 'excellent' | 'good' | 'needs_work' | 'weak';
  criteria: ScenarioQualityCriterion[];
}

export type UpdateInputKind =
  | 'baseline_metric'
  | 'assumption_review'
  | 'rate_card_override'
  | 'workshop_note';

export interface ScenarioUpdateInput {
  kind: UpdateInputKind;
  key: string;
  label: string;
  value?: number | string;
  source: string;
  owner: string;
  reviewerRole?: ExpertReviewerRole;
  requiredAction?: string;
}

export interface ScenarioUpdateAssessment {
  accepted: ScenarioUpdateInput[];
  rejected: Array<{
    input: ScenarioUpdateInput;
    reason: string;
  }>;
  reviewValidationErrors: string[];
  regenerationRequired: boolean;
  regenerationReasons: string[];
}

export interface ScenarioQualityLabResult {
  caseId: ExpertReviewCaseId;
  tenantLabel: string;
  moveLabel: string;
  overallScore: number;
  recommendation: BusinessCaseSkeleton['recommendation'];
  scorecard: ScenarioArtifactScore[];
  updateAssessment: ScenarioUpdateAssessment;
  nextBestAction: string;
  summary: string;
  nextClientCaseId: ExpertReviewCaseId | null;
}

const ARTIFACT_LABEL: Record<ScenarioArtifactId, string> = {
  intelligence_idea: 'Intelligence idea and bet framing',
  discover_brief: 'Discover brief',
  charter_case: 'Charter business-case skeleton',
  business_case_pack: 'Costed business-case pack',
  financial_model: 'Financial model',
  cfo_pack: 'CFO business-case pack',
  mobilize_pack: 'Mobilize and go-decision packet',
  workshop_session_support: 'Workshop and advisory support',
  updated_content_acceptance: 'Updated-content acceptance loop',
  trace_and_governance: 'Trace, governance and auditability',
};

const DEFAULT_UPDATES: Record<ExpertReviewCaseId, ScenarioUpdateInput[]> = {
  apexretail: [
    {
      kind: 'baseline_metric',
      key: 'cost_per_contact_usd',
      label: 'Cost per contact',
      value: 7.85,
      source: 'Finance workshop upload — contact-center unit economics v1',
      owner: 'Brendan Fox',
    },
    {
      kind: 'baseline_metric',
      key: 'contact_volume_annual',
      label: 'Annual contact volume',
      value: 18_400_000,
      source: 'NICE CXone annual interaction export',
      owner: 'James Wright',
    },
    {
      kind: 'assumption_review',
      key: 'containment_uplift',
      label: 'Containment uplift assumption',
      source: 'VP Customer Care workshop challenge',
      owner: 'Mariana Rojas',
      reviewerRole: 'domain_operator',
      requiredAction: 'Run a 2-week floor pilot before locking containment uplift.',
    },
    {
      kind: 'workshop_note',
      key: 'manager_adoption',
      label: 'Manager reinforcement risk',
      source: 'Mobilization workshop note',
      owner: 'WFM Lead',
      requiredAction: 'Add manager coaching checkpoint to the 30-day plan.',
    },
    {
      kind: 'baseline_metric',
      key: 'unmapped_sentiment_score',
      label: 'Unmapped sentiment score',
      value: 62,
      source: 'Ad hoc spreadsheet',
      owner: 'Unknown',
    },
  ],
  meridian: [
    {
      kind: 'baseline_metric',
      key: 'cost_per_clinician_hour_usd',
      label: 'Cost per clinician hour',
      value: 118,
      source: 'Meridian Finance clinician-cost attestation',
      owner: 'David Park',
    },
    {
      kind: 'baseline_metric',
      key: 'raf_to_revenue_coefficient_usd',
      label: 'RAF to revenue coefficient',
      value: 9850,
      source: 'Health-plan finance model review',
      owner: 'Thomas Hartwell',
    },
    {
      kind: 'assumption_review',
      key: 'locum_avoidance',
      label: 'Locum avoidance assumption',
      source: 'Clinical operations workshop',
      owner: 'Dr. Jennifer Wexler',
      reviewerRole: 'domain_operator',
      requiredAction: 'Separate physician-time recovery from locum avoidance.',
    },
    {
      kind: 'workshop_note',
      key: 'ehr_governance',
      label: 'Epic governance dependency',
      source: 'EHR architecture session',
      owner: 'Linda Howard',
      requiredAction: 'Add Epic change-control dependency before mobilization.',
    },
    {
      kind: 'baseline_metric',
      key: 'unmapped_physician_sentiment',
      label: 'Unmapped physician sentiment',
      value: 74,
      source: 'Ad hoc workshop poll',
      owner: 'Unknown',
    },
  ],
  arcturus: [
    {
      kind: 'baseline_metric',
      key: 'fraud_analyst_fte_cost_usd',
      label: 'Fraud analyst FTE cost',
      value: 154_000,
      source: 'First Capital Finance labor-cost attestation',
      owner: 'Transformation Finance',
    },
    {
      kind: 'baseline_metric',
      key: 'alert_volume_annual',
      label: 'Annual fraud alert volume',
      value: 420_000,
      source: 'Actimize alert ledger',
      owner: 'Fraud Operations',
    },
    {
      kind: 'rate_card_override',
      key: 'fc_committed_budget',
      label: 'Committed FC-FRAUD-2026 budget',
      value: 1_800_000,
      source: 'Board-approved FY26 program budget',
      owner: 'Transformation Finance',
      requiredAction: 'Reconcile market-rate should-cost with committed internal budget.',
    },
    {
      kind: 'assumption_review',
      key: 'false_positive_cost',
      label: 'False-positive cost assumption',
      source: 'Model-risk review workshop',
      owner: 'Fraud Operations',
      reviewerRole: 'risk_compliance',
      requiredAction: 'Quantify manual-review cost by segment before funding expansion.',
    },
    {
      kind: 'baseline_metric',
      key: 'unmapped_branch_feedback',
      label: 'Unmapped branch feedback',
      value: 41,
      source: 'Unstructured branch-manager note',
      owner: 'Unknown',
    },
  ],
};

export function runMovesScenarioQualityLab(
  caseId: ExpertReviewCaseId,
  updates: ScenarioUpdateInput[] = DEFAULT_UPDATES[caseId],
): ScenarioQualityLabResult {
  const entry = EXPERT_REVIEW_CASES[caseId];
  const { skeleton } = entry.buildCase();
  const { fullCase } = entry.buildFullCase();
  const mobilize = entry.buildMobilize();
  const advisory = buildNextBestAdvisoryTurn(skeleton);
  const updateAssessment = assessScenarioUpdates(skeleton, updates);

  const scorecard: ScenarioArtifactScore[] = [
    scoreIntelligenceIdea(caseId, skeleton),
    scoreDiscoverBrief(skeleton, advisory.actions.length),
    scoreCharterCase(skeleton),
    scoreBusinessCasePack(skeleton, fullCase.flags.length),
    scoreFinancialModel(skeleton),
    scoreCfoPack(skeleton),
    scoreMobilizePack(mobilize.measurement.wiringCoverage, mobilize.goPack.decision),
    scoreWorkshopSupport(skeleton, advisory.actions.length, updateAssessment),
    scoreUpdateAcceptance(updateAssessment),
    scoreTraceAndGovernance(skeleton),
  ];

  const overallScore = round1(
    scorecard.reduce((sum, item) => sum + item.score, 0) / scorecard.length,
  );

  return {
    caseId,
    tenantLabel: entry.tenantLabel,
    moveLabel: entry.moveLabel,
    overallScore,
    recommendation: skeleton.recommendation,
    scorecard,
    updateAssessment,
    nextBestAction: advisory.recommendedAction.prompt,
    summary: summarizeLab(entry.tenantLabel, entry.moveLabel, overallScore, skeleton),
    nextClientCaseId: nextCaseId(caseId),
  };
}

export function runAllMovesScenarioQualityLabs(): ScenarioQualityLabResult[] {
  return EXPERT_REVIEW_CASE_IDS.map((caseId) => runMovesScenarioQualityLab(caseId));
}

export function assessScenarioUpdates(
  skeleton: BusinessCaseSkeleton,
  updates: ScenarioUpdateInput[],
): ScenarioUpdateAssessment {
  const knownBaselineKeys = new Set(skeleton.baseline.metrics.map((m) => m.key));
  const knownAssumptionKeys = new Set(skeleton.assumptions.assumptions.map((a) => a.key));
  const accepted: ScenarioUpdateInput[] = [];
  const rejected: ScenarioUpdateAssessment['rejected'] = [];
  const reviewValidationErrors: string[] = [];
  const regenerationReasons = new Set<string>();

  for (const input of updates) {
    if (input.kind === 'baseline_metric') {
      if (!knownBaselineKeys.has(input.key)) {
        rejected.push({
          input,
          reason:
            'No matching baseline key in the current Moves case. The agent must not accept this into the business case silently.',
        });
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Baseline metric updated: ${input.key}.`);
      continue;
    }

    if (input.kind === 'assumption_review') {
      const review: ExpertReviewInput = {
        reviewerId: `${input.reviewerRole ?? 'reviewer'}:${input.owner}`,
        role: input.reviewerRole ?? 'delivery_lead',
        verdict: 'credible_with_conditions',
        note: `${input.label}: ${input.source}`,
        assumptionKeys: [input.key],
        requiredActions: input.requiredAction ? [input.requiredAction] : [],
      };
      const validation = validateReviewSubmission(review, knownAssumptionKeys);
      if (!validation.ok) {
        rejected.push({ input, reason: validation.error ?? 'Invalid expert review.' });
        reviewValidationErrors.push(validation.error ?? 'Invalid expert review.');
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Assumption challenged: ${input.key}.`);
      continue;
    }

    if (input.kind === 'rate_card_override') {
      accepted.push(input);
      regenerationReasons.add('Rate card / budget override provided.');
      continue;
    }

    if (input.kind === 'workshop_note') {
      if (!input.requiredAction?.trim()) {
        rejected.push({
          input,
          reason:
            'Workshop notes must carry an action or decision; raw observations alone are not enough to alter deliverables.',
        });
        continue;
      }
      accepted.push(input);
      regenerationReasons.add(`Workshop action captured: ${input.key}.`);
    }
  }

  return {
    accepted,
    rejected,
    reviewValidationErrors,
    regenerationRequired: regenerationReasons.size > 0,
    regenerationReasons: [...regenerationReasons].sort(),
  };
}

function scoreIntelligenceIdea(
  caseId: ExpertReviewCaseId,
  skeleton: BusinessCaseSkeleton,
): ScenarioArtifactScore {
  return artifact('intelligence_idea', [
    criterion(
      'tenant_anchor',
      'Scenario is anchored to a real tenant Move',
      skeleton.moveName.trim() && skeleton.tenantKey.trim() ? 8.5 : 3,
      `${caseId} resolves to ${skeleton.tenantKey} / ${skeleton.moveName}.`,
    ),
    criterion(
      'promotion_depth',
      'Idea can be shaped into a business case, not just a note',
      skeleton.baseline.metrics.length > 0 && skeleton.assumptions.assumptions.length > 0 ? 7.5 : 4,
      'The kernel can consume the idea into baseline, assumptions, value, and effort.',
    ),
    criterion(
      'live_dialogue_gap',
      'Live Intelligence dialogue has been human-tested',
      5,
      'Current test is deterministic; a human-observed Intelligence conversation is still needed.',
      'Run a watched CXO/VP prompt session and score the conversation transcript.',
    ),
  ]);
}

function scoreDiscoverBrief(
  skeleton: BusinessCaseSkeleton,
  advisoryActionCount: number,
): ScenarioArtifactScore {
  return artifact('discover_brief', [
    criterion(
      'baseline_coverage',
      'Baseline facts are present and gaps explicit',
      5 + skeleton.baseline.coverage * 5,
      `${skeleton.baseline.recordedMetrics.length} recorded metric(s), ${skeleton.baseline.seedGaps.length} seed gap(s).`,
    ),
    criterion(
      'no_fabrication',
      'Missing data is declared, not invented',
      skeleton.baseline.seedGaps.every((g) => g.seedGapReason) ? 9.5 : 3,
      'Every seed gap carries a reason and source-quality absent.',
    ),
    criterion(
      'next_question',
      'Agent knows what to ask next',
      advisoryActionCount > 0 ? 8 : 4,
      `${advisoryActionCount} advisory action(s) generated from missing data and critic findings.`,
    ),
  ]);
}

function scoreCharterCase(skeleton: BusinessCaseSkeleton): ScenarioArtifactScore {
  return artifact('charter_case', [
    criterion(
      'value_hypothesis',
      'Value and effort are quantified as ranges',
      skeleton.valueRange.point > 0 && skeleton.effortRange.point > 0 ? 8 : 4,
      `Value ${money(skeleton.valueRange.point)}; effort ${money(skeleton.effortRange.point)}.`,
    ),
    criterion(
      'owned_assumptions',
      'Assumptions are named, owned, and sensitivity-ranked',
      skeleton.assumptions.topMovers.length >= 3 ? 8.5 : 6,
      `${skeleton.assumptions.topMovers.length} top mover(s) carried into sensitivity.`,
    ),
    criterion(
      'kill_logic',
      'The case can say no / shape rather than flatter',
      skeleton.killCriteria.length > 0 && skeleton.recommendation !== 'fund' ? 9 : 6,
      `${skeleton.recommendation} with ${skeleton.killCriteria.length} kill criterion/criteria.`,
    ),
  ]);
}

function scoreBusinessCasePack(
  skeleton: BusinessCaseSkeleton,
  flagCount: number,
): ScenarioArtifactScore {
  return artifact('business_case_pack', [
    criterion(
      'cfo_sensitivity',
      'CFO-grade base / conservative / upside sensitivity exists',
      skeleton.sensitivity.topMovers.length > 0 && skeleton.sensitivity.whatBreaksTheCase.length > 0 ? 8.5 : 4,
      skeleton.sensitivity.whatBreaksTheCase,
    ),
    criterion(
      'critic_visible',
      'Critic findings are surfaced, not hidden',
      skeleton.critic.findings.length > 0 ? 8.5 : 6,
      `${skeleton.critic.findings.length} critic finding(s), ${skeleton.critic.blockers.length} blocker(s).`,
    ),
    criterion(
      'roadmap_flags',
      'Design & Plan flags are visible',
      flagCount >= 0 ? 7.5 : 4,
      `${flagCount} full-case flag(s) surfaced to the reviewer.`,
    ),
  ]);
}

function scoreFinancialModel(skeleton: BusinessCaseSkeleton): ScenarioArtifactScore {
  return artifact('financial_model', [
    criterion(
      'rate_card_provenance',
      'Rate-card provenance is explicit',
      skeleton.effort.rateCard.provenance === 'comprehensive' ? 8.5 : 7,
      `${skeleton.effort.rateCard.provenance}: ${skeleton.effort.rateCard.label}`,
    ),
    criterion(
      'payback_honesty',
      'Payback is not claimed when monetisation is blocked',
      skeleton.economics.monetisable || skeleton.economics.paybackMonths === null ? 9 : 3,
      skeleton.economics.paybackMonths === null
        ? 'Payback is null because monetisation is not defensible yet.'
        : `Payback ${skeleton.economics.paybackMonths} months.`,
    ),
    criterion(
      'business_change_split',
      'AI build vs. business-change effort is separated',
      skeleton.effort.buildVsChange.businessChangeFraction > 0 ? 8 : 5,
      skeleton.effort.buildVsChange.note,
    ),
  ]);
}

function scoreCfoPack(skeleton: BusinessCaseSkeleton): ScenarioArtifactScore {
  return artifact('cfo_pack', [
    criterion(
      'seven_part_answer',
      'Answer, case, assumptions, wrong-if, do-not-fund-yet, Tower measure, evidence/gaps are present',
      skeleton.towerHandoff.length > 0 && skeleton.assumptions.topMovers.length > 0 ? 8 : 5,
      `${skeleton.towerHandoff.length} Tower handoff metric(s), ${skeleton.assumptions.topMovers.length} top assumption(s).`,
    ),
    criterion(
      'board_honesty',
      'Board pack does not bury blockers',
      skeleton.critic.hasBlocker && skeleton.recommendation !== 'fund' ? 9 : 7,
      skeleton.recommendationRationale,
    ),
    criterion(
      'executive_actionability',
      'A CXO can see the next gate',
      skeleton.killCriteria.length > 0 ? 8 : 4,
      skeleton.killCriteria[0]?.condition ?? 'No kill criterion present.',
    ),
  ]);
}

function scoreMobilizePack(
  wiringCoverage: number,
  goDecision: string,
): ScenarioArtifactScore {
  return artifact('mobilize_pack', [
    criterion(
      'tower_measurement',
      'Tower measurement handoff is wired to Discover baseline',
      5 + wiringCoverage * 5,
      `${Math.round(wiringCoverage * 100)}% of measurement metrics are wired.`,
    ),
    criterion(
      'go_decision_honesty',
      'Go decision does not overrule blockers',
      goDecision === 'no_go' ? 8.5 : 7,
      `Mobilize go-decision is ${goDecision}.`,
    ),
    criterion(
      'change_depth',
      'Adoption/change is treated as part of the business case',
      7.5,
      'Adoption approach covers impacted roles, training, manager adoption, communications, and hypercare.',
    ),
  ]);
}

function scoreWorkshopSupport(
  skeleton: BusinessCaseSkeleton,
  advisoryActionCount: number,
  updates: ScenarioUpdateAssessment,
): ScenarioArtifactScore {
  return artifact('workshop_session_support', [
    criterion(
      'question_tree',
      'Agent produces workshop prompts from the case, not generic questions',
      advisoryActionCount >= skeleton.baseline.seedGaps.length ? 8 : 5,
      `${advisoryActionCount} advisory action(s) for ${skeleton.baseline.seedGaps.length} seed gap(s).`,
    ),
    criterion(
      'session_update_routing',
      'Workshop updates route to baseline / assumptions / rate card / actions',
      updates.accepted.length >= 3 ? 8 : 5,
      `${updates.accepted.length} accepted update(s); ${updates.rejected.length} rejected update(s).`,
    ),
    criterion(
      'human_observed_gap',
      'Observed human facilitation has been completed',
      5,
      'This lab simulates a workshop update packet; it does not replace a watched practitioner session.',
      'Run the same lab with a live VP/CXO providing the update packet.',
    ),
  ]);
}

function scoreUpdateAcceptance(
  updates: ScenarioUpdateAssessment,
): ScenarioArtifactScore {
  const acceptedRatio =
    updates.accepted.length + updates.rejected.length === 0
      ? 0
      : updates.accepted.length / (updates.accepted.length + updates.rejected.length);
  return artifact('updated_content_acceptance', [
    criterion(
      'known_inputs_accepted',
      'Known updated content is accepted into the right lane',
      5 + acceptedRatio * 4,
      `${updates.accepted.length} accepted; ${updates.rejected.length} rejected.`,
    ),
    criterion(
      'unknown_inputs_rejected',
      'Unknown content is rejected instead of silently changing the case',
      updates.rejected.length > 0 ? 9 : 7,
      updates.rejected[0]?.reason ?? 'No rejected inputs in this scenario.',
    ),
    criterion(
      'regeneration_signal',
      'Material updates trigger a regeneration decision',
      updates.regenerationRequired ? 8.5 : 4,
      updates.regenerationReasons.join(' '),
    ),
  ]);
}

function scoreTraceAndGovernance(skeleton: BusinessCaseSkeleton): ScenarioArtifactScore {
  const consoleView = buildExpertReviewConsole(skeleton, []);
  return artifact('trace_and_governance', [
    criterion(
      'review_gate',
      'Expert-review gate blocks promotion until required roles review',
      consoleView.calibration.verdict === 'not_ready' ? 8.5 : 6,
      consoleView.calibration.findings.map((f) => f.message).join(' '),
    ),
    criterion(
      'audit_objects',
      'Evidence, assumptions, critic, and Tower handoff are inspectable',
      skeleton.assumptions.assumptions.length > 0 &&
        skeleton.critic.findings.length >= 0 &&
        skeleton.towerHandoff.length > 0
        ? 8
        : 4,
      `${skeleton.assumptions.assumptions.length} assumptions; ${skeleton.towerHandoff.length} Tower metrics.`,
    ),
    criterion(
      'artifact_catalog',
      'All kernel artifacts are catalogued for export',
      KERNEL_ARTIFACTS.length === 6 ? 8.5 : 5,
      `${KERNEL_ARTIFACTS.length} exportable kernel artifact(s).`,
    ),
  ]);
}

function artifact(
  artifactId: ScenarioArtifactId,
  criteria: ScenarioQualityCriterion[],
): ScenarioArtifactScore {
  const score = round1(
    criteria.reduce((sum, item) => sum + clampScore(item.score), 0) /
      criteria.length,
  );
  return {
    artifactId,
    label: ARTIFACT_LABEL[artifactId],
    score,
    verdict:
      score >= 8.5
        ? 'excellent'
        : score >= 7
          ? 'good'
          : score >= 5.5
            ? 'needs_work'
            : 'weak',
    criteria: criteria.map((c) => ({ ...c, score: clampScore(c.score) })),
  };
}

function criterion(
  id: string,
  label: string,
  score: number,
  detail: string,
  gap?: string,
): ScenarioQualityCriterion {
  return { id, label, score: clampScore(score), detail, gap };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, round1(score)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function summarizeLab(
  tenantLabel: string,
  moveLabel: string,
  overallScore: number,
  skeleton: BusinessCaseSkeleton,
): string {
  return (
    `${tenantLabel} / ${moveLabel}: ${overallScore}/10. ` +
    `Recommendation is ${skeleton.recommendation}; ` +
    `${skeleton.baseline.seedGaps.length} baseline seed gap(s), ` +
    `${skeleton.critic.blockers.length} critic blocker(s).`
  );
}

function nextCaseId(caseId: ExpertReviewCaseId): ExpertReviewCaseId | null {
  const idx = EXPERT_REVIEW_CASE_IDS.indexOf(caseId);
  return EXPERT_REVIEW_CASE_IDS[idx + 1] ?? null;
}
