'use client';

import type { TimelineResourceEstimate } from '@/types/estimation';

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function TimelineResourceEstimateView({ estimate }: { estimate: TimelineResourceEstimate }) {
  return (
    <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Timeline + resource estimate</div>
        <div className="programs-name" style={{ fontSize: 28, marginTop: 8 }}>
          {estimate.summary.total_calendar_weeks_p80} week P80 commitment
        </div>
        <div className="programs-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="programs-chip">P50 {estimate.summary.total_calendar_weeks_p50} weeks</span>
          <span className="programs-chip teal">P80 {estimate.summary.total_calendar_weeks_p80} weeks</span>
          <span className="programs-chip amber">P95 {estimate.summary.total_calendar_weeks_p95} weeks</span>
          <span className="programs-chip">{estimate.sponsor_approval.approval_percentile_commitment} locked</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {estimate.summary.effort_composition_rollup.map((line) => (
          <div key={line.label} className="programs-card" style={{ padding: 16 }}>
            <div className="programs-eyebrow">{line.label}</div>
            <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontSize: 24, marginTop: 8 }}>{line.band.p80}</div>
            <div className="programs-muted" style={{ marginTop: 6 }}>
              P50 {line.band.p50} · P95 {line.band.p95}
            </div>
          </div>
        ))}
      </div>

      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Phase breakdown</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {estimate.phase_breakdown.map((phase) => (
            <div key={phase.phase} className="programs-card" style={{ padding: 16 }}>
              <div className="programs-row" style={{ justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{phase.phase_name}</div>
                  <div className="programs-muted" style={{ marginTop: 6 }}>
                    P50 {phase.calendar_weeks.p50}w · P80 {phase.calendar_weeks.p80}w · P95 {phase.calendar_weeks.p95}w
                  </div>
                </div>
                <div className="programs-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="programs-chip">Agent {phase.owner_mix.agent_share_pct}%</span>
                  <span className="programs-chip">Human {phase.owner_mix.human_share_pct}%</span>
                  <span className="programs-chip">SI {phase.owner_mix.si_share_pct}%</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {phase.named_gate_decisions.map((gate) => (
                  <div key={gate.gate_name} className="programs-card" style={{ padding: 12 }}>
                    <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{gate.gate_name}</div>
                    <div className="programs-muted" style={{ marginTop: 6 }}>{gate.gate_description}</div>
                    <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <span className="programs-chip">{gate.gate_date_target}</span>
                      <span className="programs-chip">{gate.decision_authority}</span>
                      <span className="programs-chip">{gate.cxo_decision_hours_budgeted} CXO hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="programs-grid-2">
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Political decision moments</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {estimate.political_decision_moments.map((moment) => (
              <div key={moment.decision_moment_name} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{moment.decision_moment_name}</div>
                <div className="programs-muted" style={{ marginTop: 6 }}>{moment.stall_risk_description}</div>
                <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span className="programs-chip">{moment.calendar_target}</span>
                  <span className="programs-chip">{moment.cxo_hours_budgeted} hours</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Stall scenarios</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {estimate.stall_scenarios.map((scenario) => (
              <div key={scenario.scenario_name} className="programs-card" style={{ padding: 14 }}>
                <div style={{ color: 'var(--programs-text-primary, #F5F5F0)', fontWeight: 600 }}>{scenario.scenario_name}</div>
                <div className="programs-muted" style={{ marginTop: 6 }}>{scenario.mitigation}</div>
                <div className="programs-row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span className="programs-chip">P50 {percent(scenario.probability_p50)}</span>
                  <span className="programs-chip amber">{scenario.if_materializes_calendar_impact}</span>
                  <span className="programs-chip">{scenario.if_materializes_cost_impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
