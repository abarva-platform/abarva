'use client'

import { VALUE_OFFICE_COLORS } from '../design'
import { UseCaseSuccessBanner } from './UseCaseWorkflowShell'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, muted: MUTED, ink: INK, gold: GOLD, red: RED } = VALUE_OFFICE_COLORS

export default function OutcomesTab() {
  const {
    editableSnapshots,
    snapshotsDirty,
    savingSnapshots,
    baselineSnapshots,
    targetSnapshots,
    currentSnapshots,
    outcomeProgress,
    outcomeSummary,
    updateSnapshot,
    seedSnapshotsFromContracts,
    addObservedSnapshot,
    saveSnapshots,
  } = useUseCaseWorkspace()

  return (
    <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 6 }}>
            Outcomes
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            Connect baseline, target, and observed metrics so realized value can be proven over time.
          </div>
        </div>
        <button
          onClick={saveSnapshots}
          disabled={!snapshotsDirty || savingSnapshots}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '10px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            background: !snapshotsDirty || savingSnapshots ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
            color: '#F7FFFE',
            cursor: !snapshotsDirty || savingSnapshots ? 'default' : 'pointer',
          }}
        >
          {savingSnapshots ? 'Saving…' : 'Save snapshots'}
        </button>
      </div>
      <UseCaseSuccessBanner scope="snapshots" />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={seedSnapshotsFromContracts} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '10px 12px', background: '#FFF9F0', color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Seed from contracts</button>
        <button onClick={addObservedSnapshot} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '10px 12px', background: '#FFF9F0', color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Add observed snapshot</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          ['Baseline', `${baselineSnapshots.length}`],
          ['Target', `${targetSnapshots.length}`],
          ['Observed', `${currentSnapshots.length}`],
          ['Average progress', `${outcomeSummary.averageProgress}%`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, marginBottom: 18 }}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Outcome summary
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 10 }}>
            {outcomeProgress.length
              ? `${outcomeSummary.onTrack} lines are on track, ${outcomeSummary.needsAttention} need intervention, and ${outcomeSummary.missingObserved} target lines still need an observed reading.`
              : 'The product can compute progress once baseline, target, and current observed values exist for the same category.'}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: INK, lineHeight: 1.6 }}>
            {outcomeSummary.topOutcome
              ? `Strongest current line: ${outcomeSummary.topOutcome.category} is at ${outcomeSummary.topOutcome.progress}% progress toward target.`
              : 'Next step: capture at least one observed metric against an existing target.'}
          </div>
        </div>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Progress toward target
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {outcomeProgress.length ? outcomeProgress.slice(0, 4).map(snapshot => (
              <div key={`${snapshot.category}-${snapshot.metricName}-${snapshot.capturedAt}`} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{snapshot.category}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.45 }}>{snapshot.metricName}</div>
                  </div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: snapshot.progress >= 80 ? TEAL : snapshot.progress >= 50 ? GOLD : RED }}>
                    {snapshot.progress}%
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: '#E7DCCB', overflow: 'hidden' }}>
                  <div style={{ width: `${snapshot.progress}%`, height: '100%', background: snapshot.progress >= 80 ? TEAL : snapshot.progress >= 50 ? GOLD : RED }} />
                </div>
              </div>
            )) : (
              <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                Add baseline, target, and observed metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {editableSnapshots.length === 0 ? (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
            Add baseline, target, and observed metrics.
          </div>
        ) : editableSnapshots.map((snapshot, index) => (
          <article key={`${snapshot.snapshot_type}-${snapshot.metric_name}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Category</strong>
                <input value={snapshot.category} onChange={e => updateSnapshot(index, 'category', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Snapshot type</strong>
                <select value={snapshot.snapshot_type} onChange={e => updateSnapshot(index, 'snapshot_type', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}>
                  <option value="baseline">baseline</option>
                  <option value="target">target</option>
                  <option value="current_observed">current_observed</option>
                </select>
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Captured at</strong>
                <input value={snapshot.captured_at} onChange={e => updateSnapshot(index, 'captured_at', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Metric name</strong>
                <input value={snapshot.metric_name} onChange={e => updateSnapshot(index, 'metric_name', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Metric value</strong>
                <input value={snapshot.metric_value} onChange={e => updateSnapshot(index, 'metric_value', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Unit</strong>
                <input value={snapshot.unit || ''} onChange={e => updateSnapshot(index, 'unit', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
