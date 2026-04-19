'use client'

import { VALUE_OFFICE_COLORS } from '../design'
import { UseCaseSuccessBanner } from './UseCaseWorkflowShell'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, muted: MUTED, ink: INK } = VALUE_OFFICE_COLORS

export default function ValueContractTab() {
  const {
    editableContracts,
    contractsDirty,
    savingContracts,
    updateContract,
    saveContracts,
  } = useUseCaseWorkspace()

  return (
    <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 6 }}>
            Value Contract
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            Capture the measurable value story before execution starts.
          </div>
        </div>
        <button
          onClick={saveContracts}
          disabled={!contractsDirty || savingContracts}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '10px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            background: !contractsDirty || savingContracts ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
            color: '#F7FFFE',
            cursor: !contractsDirty || savingContracts ? 'default' : 'pointer',
          }}
        >
          {savingContracts ? 'Saving…' : 'Save value contract'}
        </button>
      </div>
      <UseCaseSuccessBanner scope="contracts" />
      <div style={{ display: 'grid', gap: 12 }}>
        {editableContracts.length === 0 ? (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            Add the first contract line so the use case has a measurable value story.
          </div>
        ) : editableContracts.map((contract, index) => (
          <article key={`${contract.category}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
            <input
              value={contract.category}
              onChange={e => updateContract(index, 'category', e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 22, marginBottom: 10, color: INK, fontFamily: 'Georgia, serif' }}
            />
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Where value is lost</strong>
                <textarea value={contract.where_value_lost} onChange={e => updateContract(index, 'where_value_lost', e.target.value)} style={{ width: '100%', marginTop: 4, minHeight: 64, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                <strong>Target state</strong>
                <textarea value={contract.target_state} onChange={e => updateContract(index, 'target_state', e.target.value)} style={{ width: '100%', marginTop: 4, minHeight: 64, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 10, background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Baseline metric</strong>
                  <input value={contract.baseline_metric} onChange={e => updateContract(index, 'baseline_metric', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Baseline value</strong>
                  <input value={contract.baseline_value || ''} onChange={e => updateContract(index, 'baseline_value', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Target metric</strong>
                  <input value={contract.target_metric} onChange={e => updateContract(index, 'target_metric', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Target value</strong>
                  <input value={contract.target_value || ''} onChange={e => updateContract(index, 'target_value', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Evidence source</strong>
                  <input value={contract.evidence_source} onChange={e => updateContract(index, 'evidence_source', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Evidence owner</strong>
                  <input value={contract.evidence_owner} onChange={e => updateContract(index, 'evidence_owner', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
                <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  <strong>Confidence</strong>
                  <input value={contract.confidence_grade} onChange={e => updateContract(index, 'confidence_grade', e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: PANEL, color: INK, fontFamily: 'DM Sans, sans-serif' }} />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
