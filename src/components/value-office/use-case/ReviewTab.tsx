'use client'

import { VALUE_OFFICE_COLORS, titleCase } from '../design'
import { UseCaseSuccessBanner } from './UseCaseWorkflowShell'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, gold: GOLD, muted: MUTED } = VALUE_OFFICE_COLORS

export default function ReviewTab() {
  const {
    item,
    decision,
    decisionRationale,
    savingDecision,
    setDecision,
    setDecisionRationale,
    saveDecision,
    sourceHealthSummary,
    decisionEngine,
    contradictions,
    knowledgeLayer,
    evidenceCoverage,
    valueContractStrength,
    readinessScore,
    workflow,
    nextActions,
  } = useUseCaseWorkspace()

  if (!item) return null

  const executiveSummary = typeof item.metadata?.executive_summary === 'string'
    ? item.metadata.executive_summary
    : item.latest_recommendation?.summary || 'Executive framing pending.'

  const latestDecision = item.decision_history[0] || null

  return (
    <>
      <section style={{ background: '#171411', color: '#F6F1E8', borderRadius: 28, padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#87D5C8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Review
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(34px, 4.4vw, 54px)', lineHeight: 1.05 }}>{item.title}</h1>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.82)', lineHeight: 1.65 }}>
              {executiveSummary}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Confidence', `${item.confidence_score}/100`],
              ['Evidence at risk', `${sourceHealthSummary.atRisk.length}`],
              ['Value lines', `${item.value_contracts.length}`],
              ['Latest decision', latestDecision ? titleCase(latestDecision.decision) : 'Pending'],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: 'rgba(246,241,232,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Recommendation
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.1 }}>{item.latest_recommendation?.summary || 'Recommendation pending'}</h2>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 14 }}>
            {item.latest_recommendation?.rationale || 'A recommendation rationale has not been finalized yet.'}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              <strong>Why it wins:</strong> {(item.latest_recommendation?.strengths || []).slice(0, 3).join(' · ') || 'Not captured yet.'}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              <strong>What must be true:</strong> {([...(item.latest_recommendation?.missing_data || []), ...(item.latest_recommendation?.risks || [])]).slice(0, 3).join(' · ') || 'Not captured yet.'}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              <strong>Engine state:</strong> {titleCase(decisionEngine.state)} · {decisionEngine.rationale[decisionEngine.rationale.length - 1]}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
              <strong>Workflow stage:</strong> {workflow.current_stage} · {workflow.stage_progress}% complete
            </div>
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Decision gate
          </div>
          <UseCaseSuccessBanner scope="decision" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
            <label style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
              Decision
              <select value={decision} onChange={e => setDecision(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 12, border: `1px solid ${LINE}`, padding: '10px 11px', background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif' }}>
                <option value="ready_for_review">ready_for_review</option>
                <option value="approved">approved</option>
                <option value="pilot">pilot</option>
                <option value="hold">hold</option>
                <option value="redesign">redesign</option>
                <option value="scaled">scaled</option>
                <option value="stopped">stopped</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <button onClick={saveDecision} disabled={savingDecision} style={{ alignSelf: 'end', border: 'none', borderRadius: 14, padding: '12px 16px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, background: savingDecision ? '#D7D0C4' : 'linear-gradient(135deg, #127C72, #1F514C)', color: '#F7FFFE', cursor: savingDecision ? 'default' : 'pointer' }}>
              {savingDecision ? 'Recording…' : 'Record decision'}
            </button>
          </div>
          <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
            Rationale
            <textarea value={decisionRationale} onChange={e => setDecisionRationale(e.target.value)} placeholder="Why should leadership move this use case forward, hold it, or redesign it?" style={{ width: '100%', marginTop: 4, minHeight: 110, resize: 'vertical', borderRadius: 12, border: `1px solid ${LINE}`, padding: 12, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif' }} />
          </label>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Decision inputs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Readiness', `${readinessScore}/100`],
              ['Evidence coverage', `${evidenceCoverage.score}/100`],
              ['Value contract strength', `${valueContractStrength}/100`],
            ].map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {decisionEngine.rationale.map(point => (
              <div key={point} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                {point}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Contradictions and interventions
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {contradictions.length ? contradictions.slice(0, 4).map(item => (
              <div key={item.id} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{item.title}</div>
                  <span style={{ padding: '4px 8px', borderRadius: 999, background: item.severity === 'severe' ? '#FDEEEE' : '#FFF7EB', color: item.severity === 'severe' ? '#A43D34' : GOLD, fontFamily: 'Courier New, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.severity}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 6 }}>
                  {item.explanation}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#171411', lineHeight: 1.55 }}>
                  <strong>Intervention:</strong> {item.intervention}
                </div>
              </div>
            )) : (
              <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                No major contradictions detected from the current use-case structure.
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Top next actions
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {nextActions.map(action => (
              <div key={`${action.description}-${action.reason}`} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{action.description}</div>
                  <span style={{ padding: '4px 8px', borderRadius: 999, background: action.priority === 'high' ? '#FDEEEE' : action.priority === 'medium' ? '#FFF7EB' : '#EFFAF7', color: action.priority === 'high' ? '#A43D34' : action.priority === 'medium' ? GOLD : TEAL, fontFamily: 'Courier New, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {action.priority}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  {action.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Missing requirements
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {workflow.missing_requirements.length ? workflow.missing_requirements.map(requirement => (
              <div key={requirement.id} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 6 }}>{requirement.label}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  {requirement.reason}
                </div>
              </div>
            )) : (
              <div style={{ border: `1px dashed ${LINE}`, borderRadius: 16, padding: 16, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                No missing requirements in the current review stage.
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Failure patterns
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {knowledgeLayer.failurePatterns.slice(0, 3).map(pattern => (
                <div key={pattern.id} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  <strong>{pattern.title}:</strong> {pattern.summary}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Intervention playbooks
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {knowledgeLayer.interventionPlaybooks.slice(0, 3).map(playbook => (
                <div key={playbook.id} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  <strong>{playbook.title}:</strong> {playbook.intervention}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
