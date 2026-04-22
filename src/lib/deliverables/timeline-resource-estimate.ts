import type { ModuleContent } from '@/lib/programs/types';
import { MORRISON_SEED, MORRISON_TIMELINE_TEMPLATE } from '@/lib/estimation/templates';
import {
  countCapabilityRisingWorkUnits,
  countPoliticalRiskWorkUnits,
  summarizeCommitmentRisk,
} from '@/lib/estimation/genome-calibration';
import type { TimelineResourceEstimate } from '@/types/estimation';

export function buildTimelineResourceEstimate(): TimelineResourceEstimate {
  return MORRISON_TIMELINE_TEMPLATE;
}

export function buildTimelineResourceEstimateModuleContent(): ModuleContent {
  const estimate = buildTimelineResourceEstimate();
  const commitment = summarizeCommitmentRisk(estimate);

  return {
    summary: `${MORRISON_SEED.programName} carries a dual-ledger estimate with a locked ${estimate.sponsor_approval.approval_percentile_commitment} commitment, explicit decision-hour budgeting, and Genome-calibrated bands across all work units.`,
    formFields: [
      { label: 'Program', value: MORRISON_SEED.programName },
      { label: 'Client', value: MORRISON_SEED.clientName },
      { label: 'Locked commitment', value: `${estimate.sponsor_approval.approval_percentile_commitment} · ${estimate.summary.total_calendar_weeks_p80} weeks` },
      { label: 'Approval', value: `${estimate.sponsor_approval.approval_signature_method} on ${estimate.sponsor_approval.approval_date}` },
    ],
    narrativeBlocks: [
      {
        title: 'Why this estimate is different',
        body: 'This estimate keeps calendar time, human effort, agent effort, and decision latency visible at the same time. The commitment is not a single-point forecast; it is an explicit percentile backed by flex modes and stall scenarios.',
      },
      {
        title: 'Genome calibration',
        body: estimate.genome_calibration.calibrations_applied.join('\n'),
      },
    ],
    tracker: [
      {
        label: 'Commitment envelope',
        baseline: `${estimate.summary.total_calendar_weeks_p50} weeks P50`,
        target: `${estimate.summary.total_calendar_weeks_p80} weeks P80`,
        current: `${commitment.expected_commitment_weeks} calibrated weeks`,
        trend: 'Locked',
      },
      {
        label: 'Political-risk work units',
        baseline: '0',
        target: `${countPoliticalRiskWorkUnits(estimate.work_units)}`,
        current: `${countPoliticalRiskWorkUnits(estimate.work_units)}`,
        trend: 'Explicitly modeled',
      },
      {
        label: 'Capability-rising units',
        baseline: '0',
        target: `${countCapabilityRisingWorkUnits(estimate.work_units)}`,
        current: `${countCapabilityRisingWorkUnits(estimate.work_units)}`,
        trend: 'Discount applied',
      },
    ],
    findings: [
      {
        title: 'Flex modes materially change the estimate',
        detail: 'Political-heavy and capability-rising flexes are named and quantified rather than hidden inside a generic contingency line.',
        evidence: estimate.flex_modes_applied.flatMap((mode) => mode.adjustments_made),
      },
      {
        title: 'Decision latency is a first-class constraint',
        detail: 'The roadmap budgets executive time at phase and gate level, which prevents the plan from understating sponsor bottlenecks.',
        evidence: estimate.political_decision_moments.map((item) => `${item.decision_moment_name} · ${item.cxo_hours_budgeted} hours budgeted`),
      },
    ],
    timelineEstimate: estimate,
  };
}
