'use client'

/**
 * OutputRenderer — CXO-ready HTML renders for phase output documents.
 * Takes output type + content data and renders a designed page within the OUTPUT tab panel.
 */

const T = {
  bg: '#060A12', surface: '#0D1520', border: '#1C2D45',
  teal: '#2DD4C8', tealDim: 'rgba(45,212,200,0.08)', tealBorder: 'rgba(45,212,200,0.20)',
  text: '#EFF6FF', text2: 'rgba(255,255,255,0.75)', muted: 'rgba(255,255,255,0.6)',
  red: '#EF4444', redDim: 'rgba(239,68,68,0.10)',
  amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.10)',
  green: '#34D399', greenDim: 'rgba(52,211,153,0.10)',
  indigo: '#818CF8',
  mono: 'JetBrains Mono, monospace',
  sans: 'DM Sans, sans-serif',
  serif: 'Georgia, serif',
}

interface OutputRendererProps {
  outputType: string
  content: any
  clientName?: string
  engagementId?: string
  approvedBy?: string
  approvedAt?: string
}

export default function OutputRenderer({ outputType, content, clientName, engagementId, approvedBy, approvedAt }: OutputRendererProps) {
  if (!content) return null

  switch (outputType) {
    case 'readiness_scorecard':
      return <ReadinessScorecardOutput content={content} clientName={clientName} approvedBy={approvedBy} approvedAt={approvedAt} />
    case 'situation_brief':
      return <SituationBriefOutput content={content} clientName={clientName} engagementId={engagementId} approvedBy={approvedBy} approvedAt={approvedAt} />
    case 'investment_committee':
      return <InvestmentCommitteeOutput content={content} clientName={clientName} approvedBy={approvedBy} approvedAt={approvedAt} />
    case 'baseline_agreement':
      return <BaselineAgreementOutput content={content} clientName={clientName} approvedBy={approvedBy} approvedAt={approvedAt} />
    case 'outcome_dashboard':
    case 'outcome_report':
      return <OutcomeDashboardOutput content={content} clientName={clientName} />
    case 'ai_readiness_certificate':
      return <ReadinessScorecardOutput content={content} clientName={clientName} approvedBy={approvedBy} approvedAt={approvedAt} />
    default:
      return <GenericOutput content={content} outputType={outputType} />
  }
}

// ─── Shared Header ──────────────────────────────────────────────────────────

function DocHeader({ clientName, docType, engagementId, approvedAt }: {
  clientName?: string; docType: string; engagementId?: string; approvedAt?: string
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: T.serif, fontSize: '16px', fontWeight: 500, color: T.text }}>
          Abar<span style={{ fontFamily: T.mono, color: T.teal }}>Va</span>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.12em', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: '3px', padding: '2px 8px' }}>
          CONFIDENTIAL
        </div>
      </div>
      {/* Row 2 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        {clientName && <div style={{ fontSize: '20px', fontWeight: 600, color: T.text }}>{clientName}</div>}
        <div style={{ fontFamily: T.mono, fontSize: '11px', color: T.teal }}>{docType}</div>
      </div>
      {/* Row 3 */}
      <div style={{ display: 'flex', gap: '16px', fontFamily: T.mono, fontSize: '9px', color: T.muted }}>
        {approvedAt && <span>Generated {new Date(approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
        {engagementId && <span>ID: {engagementId.slice(0, 8).toUpperCase()}</span>}
      </div>
      {/* Teal divider */}
      <div style={{ height: '1px', background: T.teal, marginTop: '12px', opacity: 0.5 }} />
    </div>
  )
}

function ApprovalBlock({ approvedBy, approvedAt }: { approvedBy?: string; approvedAt?: string }) {
  if (!approvedBy) return null
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '16px', marginTop: '24px' }}>
      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.1em', marginBottom: '10px' }}>
        REVIEWED AND APPROVED BY
      </div>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>{approvedBy}</div>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal }}>AbarVa · Engagement Lead</div>
        </div>
        {approvedAt && (
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, marginLeft: 'auto' }}>
            {new Date(approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: T.muted, marginTop: '8px', fontStyle: 'italic' }}>
        Intelligence. Now act on it.
      </div>
    </div>
  )
}

// ─── Readiness Scorecard ─────────────────────────────────────────────────────

function ReadinessScorecardOutput({ content, clientName, approvedBy, approvedAt }: any) {
  const score = content.overall_score ?? content.scorecard?.overall ?? 0
  const verdict = content.overall_verdict ?? content.scorecard?.readiness ?? 'unknown'
  const summary = content.verdict_summary ?? content.scorecard?.summary ?? ''
  const scoreColor = score >= 70 ? T.green : score >= 40 ? T.amber : T.red
  const dimensions = content.dimension_scores ? Object.entries(content.dimension_scores) : []
  const genomeMatches: any[] = content.genome_matches || []
  const topFindings: any[] = content.top_findings || []

  return (
    <div style={{ fontFamily: T.sans }}>
      <DocHeader clientName={clientName} docType="Readiness Assessment" approvedAt={approvedAt} />

      {/* Score hero */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: T.mono, fontSize: '52px', color: scoreColor, fontWeight: 700, lineHeight: 1 }}>{score}</div>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.1em', marginTop: '2px' }}>/ 100</div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: '10px', color: scoreColor, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {verdict?.toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', color: T.text2, lineHeight: 1.6 }}>{summary}</div>
          </div>
        </div>
      </div>

      {/* Dimension scores */}
      {dimensions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Dimension Scores
          </div>
          {dimensions.map(([dim, d]: [string, any]) => {
            const c = d.score >= 70 ? T.green : d.score >= 40 ? T.amber : T.red
            return (
              <div key={dim} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', color: T.text }}>{dim.replace(/_/g, ' ')}</div>
                  <div style={{ fontFamily: T.mono, fontSize: '13px', color: c, fontWeight: 700 }}>{d.score}</div>
                </div>
                <div style={{ height: '3px', background: T.border, borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${d.score}%`, background: c, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
                {d.evidence && <div style={{ fontSize: '11px', color: T.text2, marginTop: '6px', lineHeight: 1.5 }}>{d.evidence}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Genome matches */}
      {genomeMatches.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Genome Matches ({genomeMatches.length})
          </div>
          {genomeMatches.map((gm: any, i: number) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.teal}`, borderRadius: '8px', padding: '12px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ fontFamily: T.mono, fontSize: '12px', color: T.teal, fontWeight: 700 }}>{gm.code}</div>
                <div style={{ fontFamily: T.mono, fontSize: '11px', color: T.teal }}>{Math.round((gm.confidence ?? gm.failure_rate ?? 0) * 100)}%</div>
              </div>
              <div style={{ fontSize: '12px', color: T.text, fontWeight: 600, marginBottom: '3px' }}>{gm.name}</div>
              {gm.evidence && <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5 }}>{gm.evidence}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Top findings */}
      {topFindings.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Key Findings
          </div>
          {topFindings.map((f: any, i: number) => {
            const c = f.severity === 'critical' ? T.red : f.severity === 'high' ? T.amber : T.text2
            return (
              <div key={i} style={{ background: T.surface, borderLeft: `3px solid ${c}`, border: `1px solid ${c}25`, borderRadius: '8px', padding: '12px', marginBottom: '6px' }}>
                <div style={{ fontFamily: T.mono, fontSize: '8px', color: c, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.severity}</div>
                <div style={{ fontSize: '13px', color: T.text, fontWeight: 600, marginBottom: '4px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.5 }}>{f.description}</div>
              </div>
            )
          })}
        </div>
      )}

      <ApprovalBlock approvedBy={approvedBy} approvedAt={approvedAt} />
    </div>
  )
}

// ─── Situation Brief ─────────────────────────────────────────────────────────

function SituationBriefOutput({ content, clientName, engagementId, approvedBy, approvedAt }: any) {
  const headline = content.headline ?? ''
  const summary = content.verdict_summary ?? content.summary ?? ''
  const gaps: any[] = content.gaps || content.top_findings || []
  const genomeMatches: any[] = content.genome_matches || []
  const recoveryRange = content.recovery_range || content.addressable_range

  return (
    <div style={{ fontFamily: T.sans }}>
      <DocHeader clientName={clientName} docType="Situation Brief" engagementId={engagementId} approvedAt={approvedAt} />

      {/* Headline */}
      {headline && (
        <div style={{ fontSize: '15px', fontStyle: 'italic', color: T.text, lineHeight: 1.6, marginBottom: '16px', borderLeft: `3px solid ${T.teal}`, paddingLeft: '12px' }}>
          "{headline}"
        </div>
      )}

      {/* Executive summary cards */}
      {content.summary_cards && (
        <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
          {content.summary_cards.map((card: any, i: number) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.teal}`, borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: T.text2, marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontFamily: T.mono, fontSize: '24px', color: T.teal, fontWeight: 700, marginBottom: '4px' }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: T.text2 }}>{card.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recovery range */}
      {recoveryRange && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Recovery Range
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '22px', color: T.teal, fontWeight: 700 }}>{recoveryRange.low || recoveryRange.min}</div>
            <div style={{ fontSize: '12px', color: T.muted }}>to</div>
            <div style={{ fontFamily: T.mono, fontSize: '22px', color: T.teal, fontWeight: 700 }}>{recoveryRange.high || recoveryRange.max}</div>
          </div>
          {recoveryRange.note && <div style={{ fontSize: '11px', color: T.muted, marginTop: '6px' }}>{recoveryRange.note}</div>}
        </div>
      )}

      {/* Gap register */}
      {gaps.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Gap Register ({gaps.length})
          </div>
          {gaps.map((g: any, i: number) => {
            const c = g.severity === 'critical' ? T.red : g.severity === 'high' ? T.amber : T.text2
            return (
              <div key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${c}`, borderRadius: '8px', padding: '12px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '8px', color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase' }}>
                    {g.severity}
                  </div>
                  {g.genome_pattern && (
                    <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.teal, background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: '3px', padding: '2px 6px' }}>
                      {g.genome_pattern}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: T.text, fontWeight: 600, marginBottom: '3px' }}>{g.title}</div>
                <div style={{ fontSize: '11px', color: T.text2, lineHeight: 1.5 }}>{g.description}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Genome matches */}
      {genomeMatches.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
          {genomeMatches.map((gm: any, i: number) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.teal}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontFamily: T.mono, fontSize: '14px', color: T.teal, fontWeight: 700, marginBottom: '2px' }}>{gm.code}</div>
              <div style={{ fontSize: '11px', color: T.text, fontWeight: 600, marginBottom: '2px' }}>{gm.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal }}>{Math.round((gm.confidence ?? gm.failure_rate ?? 0) * 100)}%</div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.6 }}>{summary}</div>
        </div>
      )}

      <ApprovalBlock approvedBy={approvedBy} approvedAt={approvedAt} />
    </div>
  )
}

// ─── Investment Committee Package ────────────────────────────────────────────

function InvestmentCommitteeOutput({ content, clientName, approvedBy, approvedAt }: any) {
  const scenarios = content.scenarios || []
  const risks: any[] = content.risks || content.risk_register || []
  const vendorRec = content.vendor_recommendation

  return (
    <div style={{ fontFamily: T.sans }}>
      <DocHeader clientName={clientName} docType="Investment Committee Package" approvedAt={approvedAt} />

      {/* 3-scenario model */}
      {scenarios.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            3-Scenario Model
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {scenarios.map((s: any, i: number) => {
              const isBase = s.label?.toLowerCase() === 'base' || i === 1
              return (
                <div key={i} style={{
                  background: T.surface,
                  border: `1px solid ${isBase ? T.tealBorder : T.border}`,
                  borderLeft: isBase ? `3px solid ${T.teal}` : undefined,
                  borderRadius: '8px', padding: '14px',
                  opacity: isBase ? 1 : 0.8,
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.1em', marginBottom: '8px' }}>
                    {s.label?.toUpperCase()}
                  </div>
                  {s.investment && <div style={{ fontSize: '11px', color: T.text2, marginBottom: '4px' }}>Investment: {s.investment}</div>}
                  {s.return && <div style={{ fontFamily: T.mono, fontSize: '20px', color: T.teal, fontWeight: 700, marginBottom: '4px' }}>{s.return}</div>}
                  {s.irr && <div style={{ fontSize: '11px', color: T.teal, marginBottom: '2px' }}>IRR: {s.irr}</div>}
                  {s.payback && <div style={{ fontSize: '11px', color: T.text2 }}>Payback: {s.payback}</div>}
                </div>
              )
            })}
          </div>
          {content.genome_note && (
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, marginTop: '6px', fontStyle: 'italic' }}>
              {content.genome_note}
            </div>
          )}
        </div>
      )}

      {/* Risk register */}
      {risks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Risk Register
          </div>
          {risks.map((r: any, i: number) => {
            const likelihood = r.likelihood?.toLowerCase()
            const impact = r.impact?.toLowerCase()
            const dotColor = (level: string) => level === 'high' ? T.red : level === 'medium' ? T.amber : T.green
            return (
              <div key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingTop: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor(likelihood || '') }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor(impact || '') }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: T.text, fontWeight: 600, marginBottom: '2px' }}>{r.risk || r.title}</div>
                  {r.mitigation && <div style={{ fontSize: '11px', color: T.text2 }}>{r.mitigation}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vendor recommendation */}
      {vendorRec && (
        <div style={{ background: T.surface, border: `1px solid ${T.tealBorder}`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', color: T.text, fontWeight: 600 }}>{vendorRec.name || 'Recommended SI'}</div>
            <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.teal, background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: '3px', padding: '2px 7px' }}>RECOMMENDED</div>
          </div>
          {vendorRec.genome_match && <div style={{ fontFamily: T.mono, fontSize: '16px', color: T.teal, fontWeight: 700, marginBottom: '4px' }}>{vendorRec.genome_match} Genome match</div>}
          {vendorRec.day_rate && <div style={{ fontSize: '12px', color: T.text2, marginBottom: '6px' }}>{vendorRec.day_rate}</div>}
          {vendorRec.protections && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {vendorRec.protections.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ color: T.teal, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: '11px', color: T.text2 }}>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ApprovalBlock approvedBy={approvedBy} approvedAt={approvedAt} />
    </div>
  )
}

// ─── Baseline Agreement ──────────────────────────────────────────────────────

function BaselineAgreementOutput({ content, clientName, approvedBy, approvedAt }: any) {
  const kpis: any[] = content.kpis || content.baseline_kpis || []
  const feeTriggers: any[] = content.fee_triggers || []

  return (
    <div style={{ fontFamily: T.sans }}>
      <DocHeader clientName={clientName} docType="Baseline Agreement" approvedAt={approvedAt} />

      {/* Subtitle */}
      <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
        This agreement locks the measurement baseline for the AbarVa engagement. Fee is earned only when verified savings exceed the baseline.
      </div>

      {/* KPI table */}
      {kpis.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Baseline KPIs
          </div>
          {kpis.map((kpi: any, i: number) => (
            <div key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.teal, marginBottom: '3px' }}>KPI</div>
                  <div style={{ fontSize: '12px', color: T.text, fontWeight: 600 }}>{kpi.name || kpi.kpi}</div>
                </div>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.muted, marginBottom: '3px' }}>BASELINE</div>
                  <div style={{ fontFamily: T.mono, fontSize: '12px', color: T.text }}>{kpi.baseline || kpi.current}</div>
                </div>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.muted, marginBottom: '3px' }}>TARGET</div>
                  <div style={{ fontFamily: T.mono, fontSize: '12px', color: T.teal }}>{kpi.target}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fee triggers */}
      {feeTriggers.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Fee Trigger Schedule
          </div>
          {feeTriggers.map((ft: any, i: number) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.tealBorder}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: T.text }}>{ft.threshold || ft.trigger}</div>
                <div style={{ fontFamily: T.mono, fontSize: '12px', color: T.teal, fontWeight: 700 }}>{ft.fee || ft.amount}</div>
              </div>
              {ft.method && <div style={{ fontSize: '11px', color: T.muted, marginTop: '3px' }}>{ft.method}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Signature block */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
        <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.1em', marginBottom: '12px' }}>
          AGREED AND ACCEPTED BY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: T.text, fontWeight: 600 }}>{clientName || 'Client CEO'}</div>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal }}>CEO · {clientName}</div>
            <div style={{ height: '1px', background: T.border, margin: '10px 0' }} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: T.text, fontWeight: 600 }}>{approvedBy || 'Anand Sundaram'}</div>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal }}>Program Lead · AbarVa</div>
            <div style={{ height: '1px', background: T.border, margin: '10px 0' }} />
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, marginTop: '6px' }}>
          Digital signature via AbarVa platform · {approvedAt ? new Date(approvedAt).toISOString() : new Date().toISOString()}
        </div>
      </div>
    </div>
  )
}

// ─── Outcome Dashboard ───────────────────────────────────────────────────────

function OutcomeDashboardOutput({ content, clientName }: any) {
  const kpis: any[] = content.kpis || content.metrics || []
  const verifiedSavings = content.verified_savings
  const feeEarned = content.fee_earned
  const nextTrigger = content.next_trigger
  const monthNum = content.month || content.period || 'N'

  const statusColor = (status: string) => status === 'ahead' ? T.green : status === 'behind' ? T.red : T.amber
  const statusLabel = (status: string) => status === 'ahead' ? '↑ Ahead' : status === 'behind' ? '↓ Behind' : '→ On track'

  return (
    <div style={{ fontFamily: T.sans }}>
      <DocHeader clientName={clientName} docType={`Outcome Tracking · Month ${monthNum}`} />

      {/* KPI cards */}
      {kpis.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: kpis.length >= 2 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '16px' }}>
          {kpis.map((kpi: any, i: number) => {
            const status = kpi.status || (kpi.current_value <= kpi.target ? 'on_track' : 'behind')
            const c = statusColor(status)
            return (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${c}`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {kpi.name || kpi.label}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: '28px', color: T.text, fontWeight: 700, lineHeight: 1, marginBottom: '4px' }}>
                  {kpi.current_value ?? kpi.current}
                </div>
                {kpi.target && <div style={{ fontSize: '11px', color: T.text2 }}>Target: {kpi.target}</div>}
                <div style={{ fontFamily: T.mono, fontSize: '9px', color: c, marginTop: '4px' }}>{statusLabel(status)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fee tracker */}
      {(verifiedSavings || feeEarned) && (
        <div style={{ background: T.surface, border: `1px solid ${T.tealBorder}`, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Verified Savings to Date
          </div>
          {verifiedSavings && <div style={{ fontFamily: T.mono, fontSize: '32px', color: T.teal, fontWeight: 700, marginBottom: '6px' }}>{verifiedSavings}</div>}
          {feeEarned && <div style={{ fontSize: '16px', color: T.text, marginBottom: '4px' }}>AbarVa fee earned: {feeEarned}</div>}
          {nextTrigger && (
            <div style={{ fontSize: '12px', color: T.muted, marginBottom: '10px' }}>
              Next trigger at {nextTrigger} additional savings
            </div>
          )}
          {verifiedSavings && nextTrigger && (
            <div style={{ height: '4px', background: T.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '45%', background: T.teal, borderRadius: '2px' }} />
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {content.timeline && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Monthly Timeline
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(content.timeline as any[]).map((m: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: m.status === 'complete' ? T.teal : m.status === 'current' ? T.teal : 'transparent',
                  border: m.status === 'current' ? `2px solid ${T.teal}` : `2px solid ${m.status === 'complete' ? T.teal : T.border}`,
                }} />
                <div style={{ fontFamily: T.mono, fontSize: '8px', color: m.status === 'future' ? T.muted : T.text2 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Generic fallback ────────────────────────────────────────────────────────

function GenericOutput({ content, outputType }: { content: any; outputType: string }) {
  if (typeof content === 'string') {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        {outputType.replace(/_/g, ' ')}
      </div>
      {Object.entries(content).map(([key, val]) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.6)', letterSpacing: '.08em', marginBottom: '4px' }}>
            {key.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.6 }}>
            {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
          </div>
        </div>
      ))}
    </div>
  )
}
