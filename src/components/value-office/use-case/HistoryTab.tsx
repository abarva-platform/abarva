'use client'

import { VALUE_OFFICE_COLORS, titleCase } from '../design'
import { UseCaseSuccessBanner } from './UseCaseWorkflowShell'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, gold: GOLD, muted: MUTED } = VALUE_OFFICE_COLORS

export default function HistoryTab() {
  const { item, assistantMessage, refinement, setRefinement, refining, sendRefinement } = useUseCaseWorkspace()

  if (!item) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18 }}>
      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Conversation
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              Refine the use case and keep the advisor memory attached to the record.
            </div>
          </div>
        </div>
        <UseCaseSuccessBanner scope="refinement" />
        <textarea value={refinement} onChange={e => setRefinement(e.target.value)} placeholder="Add new information, missing baselines, sponsor updates, or evidence constraints." style={{ width: '100%', minHeight: 140, resize: 'vertical', borderRadius: 16, border: `1px solid ${LINE}`, padding: 14, fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.55, background: '#FFF9F0' }} />
        <button onClick={sendRefinement} disabled={!refinement.trim() || refining} style={{ marginTop: 12, border: 'none', borderRadius: 16, padding: '14px 18px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, background: !refinement.trim() || refining ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`, color: '#F7FFFE', cursor: !refinement.trim() || refining ? 'default' : 'pointer' }}>
          {refining ? 'Refining use case…' : 'Refine with AI Value Office'}
        </button>
        {assistantMessage && (
          <div style={{ marginTop: 14, border: `1px solid #B8D9D2`, borderRadius: 16, padding: 14, background: '#EAF6F3', fontFamily: 'DM Sans, sans-serif', color: '#21443E', lineHeight: 1.6 }}>
            {assistantMessage}
          </div>
        )}
        <div style={{ display: 'grid', gap: 10, marginTop: 14, maxHeight: 420, overflowY: 'auto' }}>
          {item.conversation.map(message => (
            <div key={message.id} style={{ border: `1px solid ${message.role === 'advisor' ? '#B8D9D2' : LINE}`, borderRadius: 16, padding: 14, background: message.role === 'advisor' ? '#F1FBF8' : '#FFF9F0' }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: message.role === 'advisor' ? TEAL : MUTED, marginBottom: 8 }}>
                {message.role === 'advisor' ? 'AI Value Office' : 'User'}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{message.content}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Decision history
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {item.decision_history.length ? item.decision_history.map(entry => (
            <div key={entry.id} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase' }}>
                  {titleCase(entry.decision)}
                </div>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED }}>
                  {entry.created_at.slice(0, 10)}
                </div>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                {entry.rationale || 'No rationale recorded.'}
              </div>
            </div>
          )) : (
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              No decisions have been recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
