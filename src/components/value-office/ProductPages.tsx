'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { useClientContext } from '@/lib/use-client-context'
import { buildUseCaseIntelligence } from '@/lib/value-office/use-case-intelligence'
import type { AbarNexusProvenance, ValueOfficeUseCaseDetail, ValueOfficeUseCaseRecord } from '@/lib/value-office/types'
import { getAbarNexusRoadmap, getAbarNexusSourcesForVertical } from '@/lib/value-office/abarnexus'
import { VALUE_OFFICE_DEMO_SEEDS } from '@/lib/value-office/demo-seeds'
import { FAILURE_PATTERNS } from '@/lib/value-office/patterns/failure-patterns'
import { INTERVENTION_PLAYBOOKS } from '@/lib/value-office/patterns/intervention-playbooks'
import { VALUE_PATTERNS } from '@/lib/value-office/patterns/value-patterns'
import { useValueOfficeList } from './useValueOfficeList'
import { useValueOfficeDetails } from './useValueOfficeDetails'
import { VALUE_OFFICE_COLORS, valueOfficeBannerStyle } from './design'

const { pageBg: BG, panel: PANEL, ink: INK, muted: MUTED, line: LINE, teal: TEAL, red: RED, gold: GOLD } = VALUE_OFFICE_COLORS

type AdvisorResponse = {
  schemaReady: boolean
  persisted: boolean
  useCaseId: string | null
  advisorResult: {
    refined_title: string
    executive_summary: string
    recommendation: { summary: string; type: string }
    confidence_score: number
  }
  provenance: AbarNexusProvenance
}

function humanizePortfolioError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('schema') || lower.includes('supabase')) {
    return 'AI Value Office cannot load saved records right now because the Value Office tables or Supabase configuration are not fully available.'
  }
  if (lower.includes('anthropic') || lower.includes('api key')) {
    return 'The advisor could not run because the model service is not available. Check the Anthropic configuration and try again.'
  }
  return message
}

function statusTone(status: string) {
  if (['approved', 'pilot', 'scaled'].includes(status)) return { bg: '#EFFAF7', color: TEAL }
  if (['hold', 'redesign', 'rejected', 'stopped'].includes(status)) return { bg: '#FDEEEE', color: RED }
  return { bg: '#FFF7EB', color: GOLD }
}

function decisionTone(state: string) {
  if (state === 'ready_for_pilot') return { bg: '#EFFAF7', color: TEAL }
  if (state === 'hold_and_design') return { bg: '#FDEEEE', color: RED }
  return { bg: '#FFF7EB', color: GOLD }
}

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function PageFrame({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div style={{ maxWidth: 1520, margin: '0 auto', padding: '24px 24px 42px', background: BG, color: INK, fontFamily: 'Georgia, serif' }}>
      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 24, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: aside ? '1.15fr 0.85fr' : '1fr', gap: 18, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
              {eyebrow}
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(34px, 4vw, 56px)', lineHeight: 1.05 }}>{title}</h1>
            <p style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 18, lineHeight: 1.65, color: MUTED, maxWidth: 920 }}>
              {description}
            </p>
          </div>
          {aside}
        </div>
      </section>
      {children}
    </div>
  )
}

function ReviewQueue({
  items,
}: {
  items: ValueOfficeUseCaseDetail[]
}) {
  if (!items.length) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 24, padding: 22, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
        No initiatives are waiting in review right now.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map(item => {
        const intelligence = buildUseCaseIntelligence(item)
        const tone = decisionTone(intelligence.decisionEngine.state)
        const missingDataCount = item.latest_recommendation?.missing_data?.length || 0

        return (
          <article key={item.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{item.title}</h2>
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {intelligence.decisionEngine.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
                  {item.recommendation_summary || item.latest_recommendation?.summary || 'Recommendation summary will appear after the advisor runs.'}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    <strong>Decision rationale:</strong> {intelligence.decisionEngine.rationale[intelligence.decisionEngine.rationale.length - 1]}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    <strong>Most important before review:</strong> {intelligence.primaryGap}
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Confidence', `${item.confidence_score}/100`],
                    ['Readiness', `${intelligence.readinessScore}/100`],
                    ['Contradictions', `${intelligence.contradictions.length}`],
                    ['Missing data', `${missingDataCount}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 20 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                  Sponsor: {item.sponsor_name || 'Not assigned'}{item.sponsor_role ? ` · ${item.sponsor_role}` : ''}
                </div>
                <Link
                  href={`/value-office/${item.id}/review`}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#171411',
                    color: '#F7FFFE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Open executive review
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ExecutionQueue({
  items,
}: {
  items: ValueOfficeUseCaseDetail[]
}) {
  if (!items.length) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 24, padding: 22, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
        No initiatives are in execution yet. Move a reviewed use case into pilot or approval to begin execution tracking.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map(item => {
        const intelligence = buildUseCaseIntelligence(item)
        const tone = statusTone(item.status)

        return (
          <article key={item.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{item.title}</h2>
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
                  {item.recommendation_summary || item.latest_recommendation?.summary || 'Execution framing will appear once a recommendation is finalized.'}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    <strong>Owner accountability:</strong> {item.owner_name || item.sponsor_name || 'Owner to confirm'}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    <strong>Current execution focus:</strong> {intelligence.executionFocus}
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Evidence progress', `${intelligence.evidenceCoverage.score}/100`],
                    ['Outcome progress', `${intelligence.outcomeSummary.averageProgress}%`],
                    ['At-risk evidence', `${intelligence.sourceHealthSummary.atRisk.length}`],
                    ['Observed lines', `${intelligence.currentSnapshots.length}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 20 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/value-office/${item.id}/outcomes`}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#171411',
                    color: '#F7FFFE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Open execution workspace
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function UseCaseList({
  items,
  emptyMessage,
  actionLabel,
  hrefForItem,
}: {
  items: ValueOfficeUseCaseRecord[]
  emptyMessage: string
  actionLabel: string
  hrefForItem: (item: ValueOfficeUseCaseRecord) => string
}) {
  if (!items.length) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 24, padding: 22, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map(item => {
        const tone = statusTone(item.status)
        return (
          <article key={item.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{item.title}</h2>
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
                  {item.recommendation_summary || 'Recommendation summary will appear after the advisor runs.'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {item.use_case_type && (
                    <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                      {item.use_case_type}
                    </span>
                  )}
                  {item.sponsor_name && (
                    <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                      Sponsor: {item.sponsor_name}{item.sponsor_role ? ` · ${item.sponsor_role}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                      Confidence
                    </div>
                    <div style={{ fontSize: 22 }}>{item.confidence_score}/100</div>
                  </div>
                  <div style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                      Updated
                    </div>
                    <div style={{ fontSize: 16 }}>{item.updated_at.slice(0, 10)}</div>
                  </div>
                </div>
                <Link
                  href={hrefForItem(item)}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#171411',
                    color: '#F7FFFE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function PortfolioQueue({
  items,
}: {
  items: ValueOfficeUseCaseDetail[]
}) {
  if (!items.length) {
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 24, padding: 22, background: PANEL, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
        Start by testing an idea.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map(item => {
        const intelligence = buildUseCaseIntelligence(item)
        const tone = decisionTone(intelligence.decisionEngine.state)

        return (
          <article key={item.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{item.title}</h2>
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.color, fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {intelligence.decisionEngine.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, marginBottom: 12 }}>
                  {item.recommendation_summary || item.latest_recommendation?.summary || 'Recommendation summary will appear after the advisor runs.'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                    Stage: {intelligence.workflow.current_stage}
                  </span>
                  {item.sponsor_name && (
                    <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: MUTED }}>
                      Sponsor: {item.sponsor_name}{item.sponsor_role ? ` · ${item.sponsor_role}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Confidence', `${item.confidence_score}/100`],
                    ['Stage progress', `${intelligence.workflow.stage_progress}%`],
                    ['Status', item.status.replace(/_/g, ' ')],
                    ['Next step', intelligence.nextActions[0]?.description || 'Continue workflow'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: label === 'Next step' ? 15 : 20, lineHeight: 1.35 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/value-office/${item.id}/overview`}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#171411',
                    color: '#F7FFFE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Open workflow
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function PortfolioPage() {
  const { currentClient } = useClientContext()
  const { items, loading, schemaReady, error } = useValueOfficeList()
  const { items: detailItems, loading: detailLoading, error: detailError } = useValueOfficeDetails(items.map(item => item.id))

  const summary = useMemo(() => ({
    total: items.length,
    inReview: items.filter(item => ['recommended', 'ready_for_review', 'hold', 'redesign'].includes(item.status)).length,
    inExecution: items.filter(item => ['approved', 'pilot', 'scaled'].includes(item.status)).length,
  }), [items])

  return (
    <PageFrame
      eyebrow="Portfolio"
      title="Track AI ideas as a disciplined portfolio."
      description="This is the operating portfolio for AI Value Office: every use case, its status, its confidence, and whether leadership has enough evidence to move forward."
      aside={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            ['Use cases', `${summary.total}`],
            ['In review', `${summary.inReview}`],
            ['In execution', `${summary.inExecution}`],
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 24 }}>{value}</div>
            </div>
          ))}
        </div>
      }
    >
      {!schemaReady && (
        <div style={{ ...valueOfficeBannerStyle('#FFF4E5', '#F2C488', '#7A4B08'), marginBottom: 18 }}>
          AI Value Office is running in limited mode. Portfolio records will appear once the Value Office tables are available.
        </div>
      )}
      {error && (
        <div style={{ ...valueOfficeBannerStyle('#FDEEEE', '#E6B1AA', RED), marginBottom: 18 }}>
          {humanizePortfolioError(error)}
        </div>
      )}
      {detailError && (
        <div style={{ ...valueOfficeBannerStyle('#FFF4E5', '#F2C488', '#7A4B08'), marginBottom: 18 }}>
          Stage detail is partially unavailable, so the portfolio will fall back to saved record summaries.
        </div>
      )}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
          Portfolio for {currentClient.shortName}. Start new work from a real idea, then move it through qualification, review, and execution.
        </div>
        <Link
          href="/value-office/new"
          style={{
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${TEAL}, #1F514C)`,
            color: '#F7FFFE',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
          }}
        >
          Create new use case
        </Link>
      </section>
      {loading ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading AI Value Office portfolio…
        </div>
      ) : detailLoading && items.length ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading workflow stages, decision signals, and next actions…
        </div>
      ) : detailItems.length ? (
        <PortfolioQueue items={detailItems} />
      ) : (
        <UseCaseList
          items={items}
          emptyMessage="Start by testing an idea."
          actionLabel="Open workflow"
          hrefForItem={item => `/value-office/${item.id}/overview`}
        />
      )}
    </PageFrame>
  )
}

export function NewUseCasePage() {
  const { clientId, currentClient } = useClientContext()
  const [idea, setIdea] = useState('')
  const [sponsorName, setSponsorName] = useState('')
  const [sponsorRole, setSponsorRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [advisorResult, setAdvisorResult] = useState<AdvisorResponse | null>(null)

  function loadDemoExample(seedId: string) {
    const seed = VALUE_OFFICE_DEMO_SEEDS.find(item => item.id === seedId)
    if (!seed) return
    setIdea(seed.idea)
    setSponsorName(seed.sponsorName)
    setSponsorRole(seed.sponsorRole)
    setError(null)
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setAdvisorResult(null)
    try {
      const res = await fetch('/api/value-office/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, idea, sponsorName, sponsorRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Advisor request failed')
      setAdvisorResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageFrame
      eyebrow="Intake"
      title="Turn an AI idea into a real use case."
      description="This page is only for intake. Capture the idea, the sponsor context, and the first recommendation. The rest of the workflow happens inside the use-case workspace."
      aside={
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 22, padding: 18, background: '#FFF9F0' }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Client context
          </div>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{currentClient.shortName}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
            {currentClient.vertical} · Start with a concrete workflow, a named sponsor, and a clear value hypothesis.
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 0.95fr) minmax(420px, 1.05fr)', gap: 18 }}>
        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
            New Use Case
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Idea / use case</div>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="Example: We want to reduce repetitive IT service desk work using AI triage and ServiceNow automation."
              style={{ width: '100%', minHeight: 180, resize: 'vertical', borderRadius: 16, border: `1px solid ${LINE}`, padding: 14, fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.55, background: '#FFF9F0', color: INK }}
            />
          </label>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Load demo example</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VALUE_OFFICE_DEMO_SEEDS.map(seed => (
                <button
                  key={seed.id}
                  onClick={() => loadDemoExample(seed.id)}
                  style={{
                    border: `1px solid ${LINE}`,
                    borderRadius: 999,
                    padding: '9px 12px',
                    background: '#FFF9F0',
                    color: TEAL,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {seed.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sponsor name</div>
              <input value={sponsorName} onChange={e => setSponsorName(e.target.value)} placeholder="Optional" style={{ width: '100%', borderRadius: 14, border: `1px solid ${LINE}`, padding: '12px 13px', fontFamily: 'DM Sans, sans-serif', background: '#FFF9F0' }} />
            </label>
            <label>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sponsor role</div>
              <input value={sponsorRole} onChange={e => setSponsorRole(e.target.value)} placeholder="Optional" style={{ width: '100%', borderRadius: 14, border: `1px solid ${LINE}`, padding: '12px 13px', fontFamily: 'DM Sans, sans-serif', background: '#FFF9F0' }} />
            </label>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!idea.trim() || loading}
            style={{
              marginTop: 16,
              width: '100%',
              borderRadius: 16,
              border: 'none',
              background: !idea.trim() || loading ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
              color: '#F7FFFE',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              padding: '14px 18px',
              cursor: !idea.trim() || loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Running advisor…' : 'Start AI Value Office advisor'}
          </button>
          {error && (
            <div style={{ ...valueOfficeBannerStyle('#FDEEEE', '#E6B1AA', RED), marginTop: 12 }}>
              {humanizePortfolioError(error)}
            </div>
          )}
        </section>

        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
            Advisor Output
          </div>
          {advisorResult ? (
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 28 }}>{advisorResult.advisorResult.refined_title}</h2>
              <p style={{ margin: '0 0 12px', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                {advisorResult.advisorResult.executive_summary}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ padding: '8px 10px', borderRadius: 999, background: '#E5F4F1', color: TEAL, fontFamily: 'Courier New, monospace', fontSize: 11 }}>
                  {advisorResult.advisorResult.recommendation.type}
                </span>
                <span style={{ padding: '8px 10px', borderRadius: 999, background: '#F7EBD7', color: GOLD, fontFamily: 'Courier New, monospace', fontSize: 11 }}>
                  Confidence {advisorResult.advisorResult.confidence_score}/100
                </span>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 12 }}>
                {advisorResult.advisorResult.recommendation.summary}
              </div>
              {advisorResult.useCaseId && (
                <Link
                  href={`/value-office/${advisorResult.useCaseId}/overview`}
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#171411',
                    color: '#F7FFFE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  Open workflow
                </Link>
              )}
            </div>
          ) : (
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 20, padding: 18, background: '#FFF9F0', fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65 }}>
              Start with a concrete idea, then let the advisor shape the first recommendation, confidence view, and workflow handoff.
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

export function ReviewsPage() {
  const { grouped, loading, error } = useValueOfficeList()
  const { items: detailItems, loading: detailLoading, error: detailError } = useValueOfficeDetails(grouped.review.map(item => item.id))
  const reviewStats = useMemo(() => {
    const intelligence = detailItems.map(item => buildUseCaseIntelligence(item))
    return {
      ready: intelligence.filter(item => item.decisionEngine.state === 'ready_for_pilot').length,
      tighten: intelligence.filter(item => item.decisionEngine.state === 'tighten_before_pilot').length,
      hold: intelligence.filter(item => item.decisionEngine.state === 'hold_and_design').length,
      averageConfidence: average(detailItems.map(item => item.confidence_score || 0)),
    }
  }, [detailItems])

  return (
    <PageFrame
      eyebrow="Reviews"
      title="Prepare decision-ready AI initiatives."
      description="Reviews is for initiatives moving toward leadership decisions. Keep this page tight: recommendation, confidence, sponsor, and the path into the executive review."
    >
      {error && (
        <div style={{ ...valueOfficeBannerStyle('#FDEEEE', '#E6B1AA', RED), marginBottom: 18 }}>
          {humanizePortfolioError(error)}
        </div>
      )}
      {detailError && (
        <div style={{ ...valueOfficeBannerStyle('#FFF4E5', '#F2C488', '#7A4B08'), marginBottom: 18 }}>
          Review detail is partially unavailable, so the queue is falling back to saved portfolio records.
        </div>
      )}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          ['Ready for pilot', `${reviewStats.ready}`],
          ['Tighten before pilot', `${reviewStats.tighten}`],
          ['Hold and design', `${reviewStats.hold}`],
          ['Average confidence', `${reviewStats.averageConfidence}/100`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26 }}>{value}</div>
          </div>
        ))}
      </section>
      {loading ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading review queue…
        </div>
      ) : detailLoading && grouped.review.length ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading decision detail and contradiction signals…
        </div>
      ) : detailItems.length ? (
        <ReviewQueue items={detailItems} />
      ) : (
        <UseCaseList
          items={grouped.review}
          emptyMessage="No initiatives are waiting in review right now."
          actionLabel="Open review"
          hrefForItem={item => `/value-office/${item.id}/review`}
        />
      )}
    </PageFrame>
  )
}

export function ExecutionPage() {
  const { grouped, loading, error } = useValueOfficeList()
  const { items: detailItems, loading: detailLoading, error: detailError } = useValueOfficeDetails(grouped.execution.map(item => item.id))
  const executionStats = useMemo(() => {
    const intelligence = detailItems.map(item => buildUseCaseIntelligence(item))
    return {
      approved: detailItems.filter(item => item.status === 'approved').length,
      pilot: detailItems.filter(item => item.status === 'pilot').length,
      scaled: detailItems.filter(item => item.status === 'scaled').length,
      averageEvidence: average(intelligence.map(item => item.evidenceCoverage.score)),
      averageOutcome: average(intelligence.map(item => item.outcomeSummary.averageProgress)),
    }
  }, [detailItems])

  return (
    <PageFrame
      eyebrow="Execution"
      title="Track what leadership has already chosen to move."
      description="Execution is for live initiatives: pilot, approved, or scaled work where owners, evidence progress, and realized outcomes matter more than idea framing."
    >
      {error && (
        <div style={{ ...valueOfficeBannerStyle('#FDEEEE', '#E6B1AA', RED), marginBottom: 18 }}>
          {humanizePortfolioError(error)}
        </div>
      )}
      {detailError && (
        <div style={{ ...valueOfficeBannerStyle('#FFF4E5', '#F2C488', '#7A4B08'), marginBottom: 18 }}>
          Execution detail is partially unavailable, so this page is falling back to saved portfolio records.
        </div>
      )}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          ['Approved', `${executionStats.approved}`],
          ['Pilot', `${executionStats.pilot}`],
          ['Scaled', `${executionStats.scaled}`],
          ['Avg evidence', `${executionStats.averageEvidence}/100`],
          ['Avg outcome', `${executionStats.averageOutcome}%`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26 }}>{value}</div>
          </div>
        ))}
      </section>
      {loading ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading execution queue…
        </div>
      ) : detailLoading && grouped.execution.length ? (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
          Loading execution detail, evidence progress, and realized outcomes…
        </div>
      ) : detailItems.length ? (
        <ExecutionQueue items={detailItems} />
      ) : (
        <UseCaseList
          items={grouped.execution}
          emptyMessage="No initiatives are in execution yet. Move a reviewed use case into pilot or approval to begin execution tracking."
          actionLabel="Open execution workflow"
          hrefForItem={item => `/value-office/${item.id}/outcomes`}
        />
      )}
    </PageFrame>
  )
}

export function KnowledgePage() {
  const { currentClient } = useClientContext()
  const abarnexusSources = useMemo(() => getAbarNexusSourcesForVertical(currentClient.vertical), [currentClient.vertical])
  const roadmap = getAbarNexusRoadmap()
  const clientSources = abarnexusSources.filter(source => source.tier === 'client_required')
  const freeSources = abarnexusSources.filter(source => source.tier === 'free_now')
  const premiumSources = abarnexusSources.filter(source => source.tier === 'premium_later')

  return (
    <PageFrame
      eyebrow="Knowledge"
      title="Understand what informs the recommendation."
      description="AbarNexus is the intelligence layer behind AI Value Office. It should feel grounded in client truth first, strengthened by public benchmarks, and only later expanded with premium data where it materially sharpens the recommendation."
    >
      <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            ['Client-required', `${clientSources.length}`, 'Data the client must share to create real confidence.'],
            ['Free-now', `${freeSources.length}`, 'Official and public signals that add benchmarking without new subscriptions.'],
            ['Premium-later', `${premiumSources.length}`, 'Optional enrichment once the product earns the need for it.'],
          ].map(([label, value, description]) => (
            <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, background: '#FFF9F0' }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: label === 'Premium-later' ? GOLD : TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{value}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>{description}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Source groups
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {([
              ['Client truth', clientSources],
              ['Free now', freeSources],
              ['Premium later', premiumSources],
            ] as const).map(([label, sources]) => (
              <div key={label}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {sources.slice(0, 4).map(source => (
                    <div key={source.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 8 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{source.name}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{source.why_it_matters}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Roadmap
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {roadmap.map(step => (
              <div key={step.phase} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: step.phase === 'later' ? GOLD : TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{step.phase}</div>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginTop: 18 }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Value patterns
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {VALUE_PATTERNS.slice(0, 3).map(pattern => (
              <div key={pattern.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{pattern.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{pattern.summary}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Failure patterns
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {FAILURE_PATTERNS.slice(0, 3).map(pattern => (
              <div key={pattern.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{pattern.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{pattern.summary}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Intervention playbooks
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {INTERVENTION_PLAYBOOKS.slice(0, 3).map(playbook => (
              <div key={playbook.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{playbook.title}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>{playbook.intervention}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  )
}
