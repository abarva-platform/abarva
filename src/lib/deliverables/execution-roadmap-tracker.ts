import type { ModuleContent } from '@/lib/programs/types';
import { MORRISON_SEED, MORRISON_TRACKER_TEMPLATE } from '@/lib/estimation/templates';
import type { ExecutionRoadmapTracker } from '@/types/tracker';

export function buildExecutionRoadmapTracker(): ExecutionRoadmapTracker {
  return MORRISON_TRACKER_TEMPLATE;
}

export function buildExecutionRoadmapTrackerModuleContent(): ModuleContent {
  const tracker = buildExecutionRoadmapTracker();
  const calendar = tracker.tracker_summary.calendar_estimate_vs_actual;

  return {
    summary: `${MORRISON_SEED.programName} is operating within the locked commitment envelope while tracking real drift across calendar time, effort, cost, and stall probabilities.`,
    formFields: [
      { label: 'Linked estimate', value: tracker.tracker_summary.timeline_resource_estimate_id },
      { label: 'Current phase', value: tracker.tracker_summary.current_phase },
      { label: 'Weeks elapsed', value: String(calendar.weeks_elapsed) },
      { label: 'Cost delta', value: `${tracker.tracker_summary.total_cost_delta_pct > 0 ? '+' : ''}${tracker.tracker_summary.total_cost_delta_pct}%` },
    ],
    narrativeBlocks: [
      {
        title: 'Operating-reality summary',
        body: tracker.tracker_summary.narrative_summary,
      },
      {
        title: 'Unexpected stall signal',
        body: tracker.tracker_summary.unexpected_stall_scenarios
          .map((scenario) => `${scenario.scenario_name} · detected ${scenario.detected_date} · ${scenario.current_status}`)
          .join('\n'),
      },
    ],
    findings: [
      {
        title: 'Tracker is still within the commitment band',
        detail: 'Calendar drift is positive but still inside the P80 commitment that was locked at estimate signoff.',
        evidence: [
          `${calendar.weeks_elapsed} weeks elapsed`,
          `${calendar.weeks_remaining_p80_current} weeks remaining at current P80`,
          `${calendar.delta_vs_phase_2_estimate_pct}% vs original Phase 2 estimate`,
        ],
      },
      {
        title: 'Specialist-agent demand is the hottest ledger',
        detail: 'Specialist-agent turns are running over plan faster than the other effort ledgers and deserve the most monitoring attention.',
        evidence: tracker.tracker_summary.effort_estimate_vs_actual
          .filter((line) => line.delta_pct > 0)
          .map((line) => `${line.label} · ${line.delta_pct > 0 ? '+' : ''}${line.delta_pct}%`),
      },
    ],
    executionRoadmapTracker: tracker,
  };
}
