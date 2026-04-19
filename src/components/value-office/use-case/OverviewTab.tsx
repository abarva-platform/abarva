'use client'

import Link from 'next/link'
import { VALUE_OFFICE_COLORS, titleCase } from '../design'
import { useUseCaseWorkspace } from './UseCaseWorkspaceProvider'

const { panel: PANEL, line: LINE, teal: TEAL, muted: MUTED, gold: GOLD } = VALUE_OFFICE_COLORS

export default function OverviewTab() {
  const {
    item,
    loading,
    sourceHealthSummary,
    evidenceCoverage,
    valueContractStrength,
    decisionEngine,
    contradictions,
    knowledgeLayer,
    workflow,
    nextActions,
  } = useUseCaseWorkspace()

  if (loading) {
    return (
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
        Loading use case overview…
      </div>
    )
  }

  if (!item) return null

  const executiveSummary = typeof item.metadata?.executive_summary === 'string'
    ? item.metadata.executive_summary
    : item.recommendation_summary || 'Executive summary pending.'

  const readiness = item.readiness as Record<string, unknown>
  const readinessScores: Array<[string, number | undefined]> = [
    ['Overall', typeof readiness.overall === 'number' ? readiness.overall : undefined],
    ['Data', typeof readiness.data === 'number' ? readiness.data : undefined],
    ['Workflow', typeof readiness.workflow === 'number' ? readiness.workflow : undefined],
    ['Sponsorship', typeof readiness.sponsorship === 'number' ? readiness.sponsorship : undefined],
    ['Governance', typeof readiness.governance === 'number' ? readiness.governance : undefined],
    ['Integration', typeof readiness.integration === 'number' ? readiness.integration : undefined],
  ]

  return (
    <>
      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
              Overview
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 40, lineHeight: 1.08 }}>{item.title}</h1>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
              {executiveSummary}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {item.sponsor_name && (
                <span style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                  Sponsor: {item.sponsor_name}{item.sponsor_role ? ` · ${item.sponsor_role}` : ''}
                </span>
              )}
              {item.use_case_type && (
                <span style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                  {item.use_case_type}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              ['Status', titleCase(item.status)],
              ['Stage', workflow.current_stage],
              ['Confidence', `${item.confidence_score}/100`],
              ['Progress', `${workflow.stage_progress}%`],
              ['At-risk evidence', `${sourceHealthSummary.atRisk.length}`],
              ['Contracts', `${item.value_contracts.length}`],
            ].map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
            Workflow stage
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ fontSize: 28, lineHeight: 1.1 }}>{workflow.current_stage}</div>
            <span style={{ padding: '6px 10px', borderRadius: 999, background: '#EFFAF7', color: TEAL, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {workflow.stage_progress}% complete
            </span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {workflow.stage_requirements.map(requirement => (
              <div key={requirement.id} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, background: '#FFF9F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{requirement.label}</div>
                  <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: requirement.satisfied ? TEAL : GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {requirement.satisfied ? 'done' : 'missing'}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  {requirement.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
            Qualification
          </div>
          <div style={{ display: 'grid', gap: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
            <div><strong>Business problem:</strong> {item.business_problem || 'Not defined yet.'}</div>
            <div><strong>Why now:</strong> {item.why_now || 'Not defined yet.'}</div>
            <div><strong>Target users:</strong> {item.target_users || 'Not defined yet.'}</div>
            <div><strong>Workflow scope:</strong> {item.workflow_summary || 'Not defined yet.'}</div>
            <div><strong>Value hypothesis:</strong> {item.value_hypothesis || 'Not defined yet.'}</div>
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
            Recommendation state
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 28, lineHeight: 1.15 }}>
              {titleCase(decisionEngine.state)}
            </div>
            <span style={{ padding: '6px 10px', borderRadius: 999, background: '#EFFAF7', color: TEAL, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Engine score {decisionEngine.score}/100
            </span>
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
            {decisionEngine.rationale[decisionEngine.rationale.length - 1]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              ['Evidence coverage', `${evidenceCoverage.score}/100`],
              ['Value contract strength', `${valueContractStrength}/100`],
              ['At-risk evidence', `${sourceHealthSummary.atRisk.length}`],
            ].map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/value-office/${item.id}/value`} style={{ textDecoration: 'none', padding: '10px 12px', borderRadius: 14, background: '#171411', color: '#F7FFFE', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
              Define value contract
            </Link>
            <Link href={`/value-office/${item.id}/review`} style={{ textDecoration: 'none', padding: '10px 12px', borderRadius: 14, border: `1px solid ${LINE}`, background: '#FFF9F0', color: TEAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
              Go to review
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
            Readiness
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 12 }}>
            {readinessScores.map(([label, value]) => (
              <div key={String(label)} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24 }}>{value ?? '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
            {(typeof readiness.notes === 'string' ? readiness.notes : '') || 'Readiness notes will appear once the advisor or the team adds them.'}
          </div>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
            Contradictions
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
                No major contradictions detected from the current value, evidence, and outcome design.
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
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
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
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
                  No missing requirements in the current stage.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
              Client truth
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {knowledgeLayer.clientTruth.slice(0, 3).map(entry => (
                <div key={entry} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{entry}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
              Pattern memory
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {knowledgeLayer.patternMemory.slice(0, 3).map(pattern => (
                <div key={pattern.id} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  <strong>{pattern.title}:</strong> {pattern.summary}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
              Public benchmarks
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {knowledgeLayer.publicBenchmarks.slice(0, 3).map(entry => (
                <div key={entry} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{entry}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
