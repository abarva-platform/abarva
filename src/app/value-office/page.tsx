'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useClientContext } from '@/lib/use-client-context'
import type { AbarNexusProvenance } from '@/lib/value-office/types'
import { getAbarNexusRoadmap, getAbarNexusSourcesForVertical } from '@/lib/value-office/abarnexus'

type ListItem = {
  id: string
  title: string
  status: string
  recommendation_summary?: string | null
  use_case_type?: string | null
  confidence_score?: number
  updated_at: string
}

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

const BG = '#F6F1E8'
const PANEL = '#FFFCF6'
const INK = '#171411'
const MUTED = '#6E655C'
const LINE = '#DDCFBD'
const TEAL = '#127C72'
const RED = '#A43D34'
const GOLD = '#B0721E'
const SHELL = '#F9F4EC'

function ValueOfficePageInner() {
  const { clientId, currentClient } = useClientContext()
  const [idea, setIdea] = useState('')
  const [sponsorName, setSponsorName] = useState('')
  const [sponsorRole, setSponsorRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [schemaReady, setSchemaReady] = useState(true)
  const [items, setItems] = useState<ListItem[]>([])
  const [advisorResult, setAdvisorResult] = useState<AdvisorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abarnexusSources = useMemo(() => getAbarNexusSourcesForVertical(currentClient.vertical), [currentClient.vertical])
  const freeSources = abarnexusSources.filter(source => source.tier === 'free_now')
  const clientSources = abarnexusSources.filter(source => source.tier === 'client_required')
  const premiumSources = abarnexusSources.filter(source => source.tier === 'premium_later')
  const roadmap = getAbarNexusRoadmap()

  async function load() {
    const res = await fetch(`/api/value-office/use-cases?clientId=${clientId}`)
    const data = await res.json()
    setSchemaReady(data.schemaReady !== false)
    setItems(data.items || [])
  }

  useEffect(() => {
    load().catch(err => setError(err.message))
  }, [clientId])

  const submitDisabled = useMemo(() => !idea.trim() || loading, [idea, loading])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setAdvisorResult(null)

    try {
      const res = await fetch('/api/value-office/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          idea,
          sponsorName,
          sponsorRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Advisor request failed')

      setAdvisorResult(data)
      setSchemaReady(data.schemaReady !== false)
      if (data.persisted) {
        await load()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '22px 24px 42px', color: INK, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 126 }}>
            <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
                Workspace
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 8 }}>AI Value Office</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 14 }}>
                A full-width workspace for idea pressure-testing, value design, evidence planning, and executive review.
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['Client', currentClient.shortName],
                  ['Vertical', currentClient.vertical],
                  ['Mode', 'Agent-led advisory'],
                  ['Scope', 'Portfolio + value proof'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: `1px solid ${LINE}` }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                AbarNexus
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Client-required', `${clientSources.length}`],
                  ['Free-now', `${freeSources.length}`],
                  ['Premium-later', `${premiumSources.length}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 24 }}>{value}</div>
                  </div>
                ))}
              </div>
              <a href="/value-office/tracker" style={{ display: 'inline-block', marginTop: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: TEAL, textDecoration: 'none' }}>
                Open execution tracker →
              </a>
            </section>

            <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                Product Standard
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                This shell is moving toward a full-canvas enterprise workspace: left rail, broad work surface, restrained cards, and decision-grade density inspired by Snowflake and Harvey.ai.
              </div>
            </section>
          </aside>

          <main style={{ minWidth: 0 }}>
            <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 24, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 720px' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                    Advisor Workbench
                  </div>
                  <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(34px, 4.2vw, 60px)', lineHeight: 1 }}>Start with the idea. Force the value story early.</h1>
                  <p style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 18, lineHeight: 1.65, color: MUTED, maxWidth: 980 }}>
                    A CXO or Maestro should be able to ask, “I have this use case. What do you think?” This workspace turns that question into a structured use case, a value contract draft, an evidence plan, and a recommendation with provenance.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))', gap: 12, flex: '0 0 460px', maxWidth: '100%' }}>
                  {[
                    ['Client', currentClient.name],
                    ['Use cases', `${items.length}`],
                    ['Knowledge sources', `${clientSources.length + freeSources.length}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

        {!schemaReady && (
          <div style={{ background: '#FFF4E5', border: `1px solid #F2C488`, borderRadius: 18, padding: '14px 18px', marginBottom: 18, fontFamily: 'DM Sans, sans-serif', color: '#7A4B08' }}>
            The new AI Value Office tables are not deployed in Supabase yet. The advisor still works, but persistence is currently disabled until migration `009_ai_value_office.sql` is applied.
          </div>
        )}

        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 24, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
            <div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }}>
                AbarNexus
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.1 }}>Free-first knowledge layer, built to expand later.</h2>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.65, maxWidth: 760 }}>
                We should not wait for expensive subscriptions to make the agent feel smart. AbarNexus starts with client truth plus official public benchmark sources, then adds premium enrichment only if it materially sharpens the recommendation.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
                {[
                  ['Client-required', `${clientSources.length}`],
                  ['Free-now sources', `${freeSources.length}`],
                  ['Premium-later slots', `${premiumSources.length}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: 8 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 26 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {roadmap.map(step => (
                <div key={step.phase} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: step.phase === 'later' ? GOLD : TEAL, marginBottom: 8 }}>
                    {step.phase}
                  </div>
                  <div style={{ fontSize: 21, marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                    {step.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 18 }}>
            {[
              { label: 'Client truth', sources: clientSources, accent: TEAL },
              { label: 'Free now', sources: freeSources, accent: TEAL },
              { label: 'Premium later', sources: premiumSources, accent: GOLD },
            ].map(group => (
              <div key={group.label} style={{ border: `1px solid ${LINE}`, borderRadius: 20, padding: 18, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: group.accent, marginBottom: 10 }}>
                  {group.label}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {group.sources.slice(0, 4).map(source => (
                    <div key={source.id}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 3 }}>{source.name}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                        {source.why_it_matters}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 0.9fr) minmax(520px, 1.1fr)', gap: 18 }}>
          <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 22 }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
              New Use Case
            </div>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Idea / use case</div>
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Example: We want to reinvent future of work across IT support, HR queries, and research administration using ServiceNow, Claude, and our governed data platforms."
                style={{ width: '100%', minHeight: 180, resize: 'vertical', borderRadius: 16, border: `1px solid ${LINE}`, padding: 14, fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.55, background: '#FFF9F0', color: INK }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sponsor name</div>
                <input
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', borderRadius: 14, border: `1px solid ${LINE}`, padding: '12px 13px', fontFamily: 'DM Sans, sans-serif', background: '#FFF9F0' }}
                />
              </label>
              <label>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sponsor role</div>
                <input
                  value={sponsorRole}
                  onChange={e => setSponsorRole(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', borderRadius: 14, border: `1px solid ${LINE}`, padding: '12px 13px', fontFamily: 'DM Sans, sans-serif', background: '#FFF9F0' }}
                />
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitDisabled}
              style={{
                marginTop: 16,
                width: '100%',
                borderRadius: 16,
                border: 'none',
                background: submitDisabled ? '#D7D0C4' : `linear-gradient(135deg, ${TEAL}, #1F514C)`,
                color: '#F7FFFE',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 18px',
                cursor: submitDisabled ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Pressure-testing use case...' : 'Ask AI Value Office'}
            </button>

            {error && (
              <div style={{ marginTop: 12, color: RED, fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
            )}
          </section>

          <section style={{ display: 'grid', gap: 18 }}>
            <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 22 }}>
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
                  <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
                    {advisorResult.advisorResult.recommendation.summary}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    {[
                      ['Client truth', advisorResult.provenance.client_truth],
                      ['Public benchmarks', advisorResult.provenance.public_benchmarks],
                      ['Pattern memory', advisorResult.provenance.pattern_memory],
                      ['Still assumption', advisorResult.provenance.assumptions],
                    ].map(([label, items]) => (
                      <div key={String(label)} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 12, background: '#FFF9F0' }}>
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: label === 'Still assumption' ? GOLD : TEAL, marginBottom: 8 }}>
                          {label}
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {(items as string[]).slice(0, 3).map(entry => (
                            <div key={entry} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.45 }}>
                              {entry}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {advisorResult.useCaseId && (
                    <a
                      href={`/value-office/${advisorResult.useCaseId}`}
                      style={{ display: 'inline-block', marginTop: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: TEAL, textDecoration: 'none' }}
                    >
                      Open full record →
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                  The first response should feel like a strong Maestro: narrow the use case, identify what good looks like, and force the value/evidence conversation early.
                </div>
              )}
            </div>

            <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 26, padding: 22 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
                Existing Use Cases
              </div>
              {items.length === 0 ? (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>No saved AI Value Office use cases yet for {currentClient.shortName}.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {items.map(item => (
                    <a
                      key={item.id}
                      href={`/value-office/${item.id}`}
                      style={{ textDecoration: 'none', color: INK, border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 21, marginBottom: 6 }}>{item.title}</div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                            {item.recommendation_summary || item.use_case_type || 'Draft use case'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'Courier New, monospace', fontSize: 11 }}>
                          <div style={{ color: TEAL, marginBottom: 6 }}>{item.status}</div>
                          <div style={{ color: MUTED }}>{item.confidence_score || 0}/100</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
          </main>
        </div>
    </div>
  )
}

export default function ValueOfficePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: BG }} />}>
      <ValueOfficePageInner />
    </Suspense>
  )
}
