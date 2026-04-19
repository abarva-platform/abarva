'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { EvidenceSourceDraft } from '@/lib/value-office/types'
import { summarizeSourceHealth } from '@/lib/value-office/source-health'

const BG = '#F6F1E8'
const PANEL = '#FFFCF6'
const INK = '#171411'
const MUTED = '#6E655C'
const LINE = '#DDCFBD'
const TEAL = '#127C72'
const GOLD = '#B0721E'
const RED = '#A43D34'

type ReviewDetail = {
  id: string
  title: string
  use_case_type: string | null
  status: string
  confidence_score: number
  metadata: { executive_summary?: string }
  latest_recommendation: null | {
    summary: string
    rationale: string
    strengths: string[]
    risks: string[]
    missing_data: string[]
    next_actions: string[]
  }
  value_contracts: Array<{
    category: string
    baseline_metric: string
    target_metric: string
    evidence_owner: string
    confidence_grade: string
  }>
  evidence_sources: Array<{
    source_name: string
    source_type: string
    integration_mode: string
    status: EvidenceSourceDraft['status']
    system_name: string
    owner_name: string
    details?: EvidenceSourceDraft['details']
  }>
  decision_history: Array<{
    id: string
    decision: string
    rationale: string
    created_at: string
  }>
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export default function ValueOfficeReviewPage() {
  const params = useParams<{ useCaseId: string }>()
  const useCaseId = Array.isArray(params.useCaseId) ? params.useCaseId[0] : params.useCaseId
  const [item, setItem] = useState<ReviewDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!useCaseId) return
      const res = await fetch(`/api/value-office/use-cases/${useCaseId}`)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Unable to load review')
      setItem(data.item)
    }
    load().catch(err => setError(err.message))
  }, [useCaseId])

  const pendingSources = item?.evidence_sources.filter(source => {
    const status = source.details?.collection_status || 'expected'
    return status === 'expected' || status === 'requested' || status === 'stale'
  }).length || 0
  const latestDecision = item?.decision_history[0] || null
  const sourceHealth = summarizeSourceHealth(item?.evidence_sources || [])
  const riskCards = [
    ['Blocked', `${sourceHealth.blocked.length}`],
    ['Stale', `${sourceHealth.stale.length}`],
    ['Ownerless', `${sourceHealth.ownerMissing.length}`],
    ['Attention', `${sourceHealth.attention.length}`],
  ]
  const highestRiskSources = sourceHealth.items
    .filter(entry => entry.health.label !== 'healthy')
    .slice(0, 4)

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto', padding: '22px 24px 42px', background: BG, color: INK, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <a href={`/value-office/${useCaseId}`} style={{ color: TEAL, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
            ← Back to use case workspace
          </a>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CXO review mode
          </div>
        </div>

        {error && (
          <div style={{ color: RED, fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
        )}

        {item && (
          <>
            <section style={{ background: '#171411', color: '#F6F1E8', borderRadius: 28, padding: 28, marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#87D5C8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Executive review
                  </div>
                  <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(34px, 4.8vw, 58px)', lineHeight: 1.04 }}>{item.title}</h1>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(246,241,232,0.82)', lineHeight: 1.65, maxWidth: 860 }}>
                    {item.metadata?.executive_summary || item.latest_recommendation?.summary || 'Executive framing pending.'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Status', titleCase(item.status)],
                    ['Confidence', `${item.confidence_score}/100`],
                    ['Sources at risk', `${sourceHealth.atRisk.length}`],
                    ['Pending evidence', `${pendingSources}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: 'rgba(246,241,232,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 22 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Recommendation
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.12 }}>
                  {item.latest_recommendation?.summary || 'Recommendation pending'}
                </h2>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
                  {item.latest_recommendation?.rationale || 'A recommendation rationale has not been finalized yet.'}
                </div>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Latest decision
                </div>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{latestDecision ? titleCase(latestDecision.decision) : 'No decision recorded'}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
                  {latestDecision?.rationale || 'No leadership rationale has been captured yet.'}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Why it wins
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {(item.latest_recommendation?.strengths || []).slice(0, 5).map(point => (
                    <div key={point} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  What must be true
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {([...(item.latest_recommendation?.missing_data || []), ...(item.latest_recommendation?.risks || [])]).slice(0, 5).map(point => (
                    <div key={point} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Value contract snapshot
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {item.value_contracts.slice(0, 4).map(contract => (
                    <div key={`${contract.category}-${contract.target_metric}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 14, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 4 }}>{contract.category}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                        Baseline: {contract.baseline_metric || 'Not set'} · Target: {contract.target_metric || 'Not set'}
                      </div>
                      <div style={{ marginTop: 6, fontFamily: 'Courier New, monospace', fontSize: 10, color: contract.confidence_grade.toLowerCase() === 'bronze' ? GOLD : TEAL }}>
                        {contract.confidence_grade || 'Unrated'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Evidence risk
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                  {riskCards.map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 22 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                  {highestRiskSources.length > 0 ? highestRiskSources.map(entry => (
                    <div key={entry.source.source_name} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{entry.source.source_name}</div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: entry.health.label === 'blocked' ? 'rgba(164,61,52,0.12)' : entry.health.label === 'stale' ? 'rgba(176,114,30,0.12)' : 'rgba(18,124,114,0.12)',
                          color: entry.health.label === 'blocked' ? RED : entry.health.label === 'stale' ? GOLD : TEAL,
                          fontFamily: 'Courier New, monospace',
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}>
                          {titleCase(entry.health.label)}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                        {entry.health.reason}
                      </div>
                      <div style={{ marginTop: 4, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                        {titleCase(entry.source.details?.collection_status || 'expected')} · Owner: {entry.source.owner_name || 'Unassigned'}
                      </div>
                      {entry.source.details?.blocker && (
                        <div style={{ marginTop: 4, fontFamily: 'DM Sans, sans-serif', color: RED, lineHeight: 1.5 }}>
                          Blocker: {entry.source.details.blocker}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                      No material evidence-source escalations are active right now.
                    </div>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Leadership interventions now
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(sourceHealth.interventions.length > 0
                      ? sourceHealth.interventions
                      : [`Evidence readiness is stable enough to focus leadership attention on value realization rather than data plumbing.`]
                    ).slice(0, 4).map(action => (
                      <div key={action} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Next actions
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {(item.latest_recommendation?.next_actions || []).slice(0, 6).map(action => (
                  <div key={action} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 14, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    {action}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
    </div>
  )
}
