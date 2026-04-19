'use client'

import { VALUE_OFFICE_COLORS, titleCase } from '../design'
import { UseCaseSuccessBanner } from './UseCaseWorkflowShell'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, muted: MUTED, ink: INK, gold: GOLD, red: RED } = VALUE_OFFICE_COLORS

function healthTone(label: string) {
  if (label === 'blocked') return { bg: '#FDEEEE', color: RED }
  if (label === 'stale' || label === 'attention') return { bg: '#FFF7EB', color: GOLD }
  return { bg: '#EFFAF7', color: TEAL }
}

export default function EvidenceTab() {
  const {
    editableEvidence,
    evidenceDirty,
    savingEvidence,
    sourceHealthSummary,
    updateEvidence,
    updateEvidenceDetails,
    applyEvidenceIntervention,
    applyRequestTemplate,
    applyDeliveryPackage,
    saveEvidence,
  } = useUseCaseWorkspace()

  return (
    <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 6 }}>
            Evidence
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            Define how value will be proven, who owns the evidence, and where it may break down.
          </div>
        </div>
        <button
          onClick={saveEvidence}
          disabled={!evidenceDirty || savingEvidence}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '10px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            background: !evidenceDirty || savingEvidence ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
            color: '#F7FFFE',
            cursor: !evidenceDirty || savingEvidence ? 'default' : 'pointer',
          }}
        >
          {savingEvidence ? 'Saving…' : 'Save evidence plan'}
        </button>
      </div>
      <UseCaseSuccessBanner scope="evidence" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          ['Healthy', `${sourceHealthSummary.healthy.length}`],
          ['Blocked', `${sourceHealthSummary.blocked.length}`],
          ['Stale', `${sourceHealthSummary.stale.length}`],
          ['Ownerless', `${sourceHealthSummary.ownerMissing.length}`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {editableEvidence.length === 0 ? (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            Define how value will be proven.
          </div>
        ) : editableEvidence.map((source, index) => {
          const sourceHealth = sourceHealthSummary.items.find(item => item.source.source_name === source.source_name)
          const tone = healthTone(sourceHealth?.health.label || 'healthy')

          return (
            <article key={`${source.source_name}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 24, lineHeight: 1.15 }}>{source.source_name}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>{source.system_name} · {source.integration_mode}</div>
                </div>
                <span style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {titleCase(sourceHealth?.health.label || 'healthy')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Source type</strong>
                  <input value={source.source_type} onChange={e => updateEvidence(index, 'source_type', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Owner</strong>
                  <input value={source.owner_name} onChange={e => updateEvidence(index, 'owner_name', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Collection status</strong>
                  <select value={source.details?.collection_status || 'expected'} onChange={e => updateEvidenceDetails(index, 'collection_status', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }}>
                    <option value="expected">expected</option>
                    <option value="requested">requested</option>
                    <option value="received">received</option>
                    <option value="stale">stale</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Notes / request package</strong>
                <textarea value={source.details?.notes || ''} onChange={e => updateEvidenceDetails(index, 'notes', e.target.value)} style={{ width: '100%', marginTop: 4, minHeight: 92, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <button onClick={() => applyEvidenceIntervention(index, 'assign_owner')} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 10px', background: PANEL, color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Assign owner</button>
                <button onClick={() => applyEvidenceIntervention(index, 'request_refresh')} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 10px', background: PANEL, color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Request refresh</button>
                <button onClick={() => applyEvidenceIntervention(index, 'mark_received')} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 10px', background: PANEL, color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Mark received</button>
                <button onClick={() => applyRequestTemplate(index)} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 10px', background: PANEL, color: GOLD, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Draft request</button>
                <button onClick={() => applyDeliveryPackage(index)} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 10px', background: PANEL, color: GOLD, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Prepare package</button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
