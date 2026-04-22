'use client';

import type { ExecutionRoadmapTracker } from '@/types/tracker';

function driftTone(direction: string) {
  if (direction === 'over') return 'red';
  if (direction === 'slightly_over') return 'amber';
  return 'teal';
}

export function ExecutionRoadmapTrackerView({ tracker }: { tracker: ExecutionRoadmapTracker }) {
  const calendar = tracker.tracker_summary.calendar_estimate_vs_actual;

  return (
    <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Execution roadmap tracker</div>
        <div className="programs-name" style={{ fontSize: 28, marginTop: 8 }}>
          Week {calendar.weeks_elapsed} · {calendar.drift_direction.replace('_', ' ')}
        </div>
        <div className="programs-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="programs-chip">Remaining P50 {calendar.weeks_remaining_p50_current}w</span>
          <span className="programs-chip teal">Remaining P80 {calendar.weeks_remaining_p80_current}w</span>
          <span className={`programs-chip ${calendar.delta_vs_phase_2_estimate_pct > 0 ? 'amber' : 'teal'}`}>
            {calendar.delta_vs_phase_2_estimate_pct > 0 ? '+' : ''}{calendar.delta_vs_phase_2_estimate_pct}% vs lock
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {tracker.tracker_summary.effort_estimate_vs_actual.map((line) => (
          <div key={line.label} className="programs-card" style={{ padding: 16 }}>
            <div className="programs-eyebrow">{line.label}</div>
            <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontSize: 22, marginTop: 8 }}>
              {line.actual_to_date} actual
            </div>
            <div className="programs-muted" style={{ marginTop: 6 }}>
              {line.estimated_to_date} estimated to date
            </div>
            <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span className={`programs-chip ${driftTone(line.drift_direction)}`}>
                {line.delta_pct > 0 ? '+' : ''}{line.delta_pct}%
              </span>
              <span className="programs-chip">{line.drift_direction.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Work unit tracking</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {tracker.work_unit_tracking.map((unit) => (
            <div key={unit.work_unit_id} className="programs-card" style={{ padding: 14 }}>
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{unit.work_unit_id}</div>
                  <div className="programs-muted" style={{ marginTop: 6 }}>{unit.estimated.effort_value}</div>
                </div>
                <span className={`programs-chip ${unit.status === 'complete' ? 'green' : unit.status === 'in_progress' ? 'amber' : 'teal'}`}>
                  {unit.status.replace('_', ' ')}
                </span>
              </div>
              <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="programs-chip">P80 {unit.estimated.p80}</span>
                {unit.actual.wall_clock_actual ? <span className="programs-chip">{unit.actual.wall_clock_actual} actual</span> : null}
                {unit.delta ? <span className="programs-chip">{unit.delta.percentile_at_which_landed}</span> : null}
              </div>
              {unit.learning_note ? <div className="programs-muted" style={{ marginTop: 10 }}>{unit.learning_note}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="programs-grid-2">
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Gate decision timeline</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {tracker.gate_decision_tracking.map((gate) => (
              <div key={gate.gate_name} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{gate.gate_name}</div>
                <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span className="programs-chip">Target {gate.gate_date_target}</span>
                  {gate.gate_date_actual ? <span className="programs-chip">Actual {gate.gate_date_actual}</span> : null}
                  <span className="programs-chip">{gate.cxo_hours_budgeted} hrs budgeted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Genome feedback</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {tracker.genome_feedback_candidates.map((candidate) => (
              <div key={candidate.observation} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{candidate.type.replace(/_/g, ' ')}</div>
                <div className="programs-muted" style={{ marginTop: 6 }}>{candidate.observation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
