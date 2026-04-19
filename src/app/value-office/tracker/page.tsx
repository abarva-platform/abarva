'use client'

import { useEffect, useState } from 'react'
import {
  getConnectorTemplate,
  getConnectorTemplates,
  getPriorityConnectorPlaybooks,
  getOperationalIngestionSummary,
  getPriorityIngestionBlueprint,
  type AbarNexusNormalizedRecord,
  type AbarNexusRunStatus,
} from '@/lib/value-office/ingestion'
import { EXECUTION_TRACKS, getExecutionSummary, type ExecutionStatus } from '@/lib/value-office/execution-tracker'

const BG = '#F6F1E8'
const PANEL = '#FFFCF6'
const INK = '#171411'
const MUTED = '#6E655C'
const LINE = '#DDCFBD'
const TEAL = '#127C72'
const GOLD = '#B0721E'
const RED = '#A43D34'
const SHELL = '#F9F4EC'

function statusMeta(status: ExecutionStatus) {
  if (status === 'done') return { label: 'Done', color: TEAL, bg: '#EFFAF7' }
  if (status === 'in_progress') return { label: 'In progress', color: GOLD, bg: '#FFF7EB' }
  return { label: 'Not started', color: MUTED, bg: '#F7F0E8' }
}

function driverLabel(driver: string) {
  if (driver === 'recommendation_credibility') return 'Recommendation credibility'
  if (driver === 'evidence_operability') return 'Evidence operability'
  return 'Measurable value proof'
}

function runStatusMeta(status: AbarNexusRunStatus) {
  if (status === 'ready') return { label: 'Ready', color: TEAL, bg: '#EFFAF7' }
  if (status === 'needs_setup') return { label: 'Needs setup', color: GOLD, bg: '#FFF7EB' }
  if (status === 'blocked') return { label: 'Blocked', color: RED, bg: '#FDEEEE' }
  return { label: 'Planned', color: MUTED, bg: '#F7F0E8' }
}

export default function ValueOfficeTrackerPage() {
  const summary = getExecutionSummary()
  const ingestion = getPriorityIngestionBlueprint('healthcare')
  const ingestionOps = getOperationalIngestionSummary('healthcare')
  const connectorTemplates = getConnectorTemplates()
  const priorityPlaybooks = getPriorityConnectorPlaybooks()
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null)
  const [previewRecords, setPreviewRecords] = useState<AbarNexusNormalizedRecord[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [runHistory, setRunHistory] = useState<Array<Record<string, any>>>([])
  const [runHistoryReady, setRunHistoryReady] = useState(true)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  async function loadRunHistory() {
    const res = await fetch('/api/value-office/ingestion/preview')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Unable to load ingestion history')
    setRunHistory(data.items || [])
    setRunHistoryReady(data.schemaReady !== false)
    if (!selectedRunId && data.items?.length) {
      setSelectedRunId(String(data.items[0].id))
    }
  }

  async function runPreview(sourceId: string) {
    setPreviewSourceId(sourceId)
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const res = await fetch('/api/value-office/ingestion/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to run ingestion preview')
      setPreviewRecords(data.records || [])
      await loadRunHistory().catch(() => null)
    } catch (error: any) {
      setPreviewError(error.message)
      setPreviewRecords([])
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    loadRunHistory().catch(() => null)
  }, [])

  const selectedRun = runHistory.find(run => String(run.id) === selectedRunId) || null
  const selectedRunRecords = Array.isArray(selectedRun?.records) ? selectedRun.records as AbarNexusNormalizedRecord[] : []

  return (
    <div style={{ maxWidth: 1760, margin: '0 auto', padding: '22px 24px 42px', background: BG, color: INK, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 126 }}>
            <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
                Build Board
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 8 }}>Execution tracker</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                This page is the internal operating surface for how we are turning AI Value Office into a serious enterprise product.
              </div>
            </section>
            <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 20 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
                Current Focus
              </div>
              <div style={{ fontSize: 24, lineHeight: 1.2, marginBottom: 8 }}>{summary.activeItem?.title ?? 'No active item'}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 12 }}>
                {summary.activeItem?.notes ?? 'All current execution tracks are complete.'}
              </div>
              <div style={{ height: 10, borderRadius: 999, background: '#E9DDCF', overflow: 'hidden' }}>
                <div style={{ width: `${summary.activeItem?.progress ?? 100}%`, height: '100%', background: summary.activeItem ? GOLD : TEAL }} />
              </div>
              <div style={{ marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                Next: {summary.activeItem?.nextAction ?? 'Choose the next highest-value backlog item.'}
              </div>
            </section>
          </aside>

          <main style={{ minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, marginBottom: 18 }}>
          <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 26 }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 14 }}>
              AI Value Office
            </div>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1 }}>Execution tracker</h1>
            <p style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 18, lineHeight: 1.6, color: MUTED, maxWidth: 760 }}>
              This is the build board for the product itself: what is already real, what is in motion now, and what we should tackle next to deepen recommendation credibility, evidence operability, and measurable value proof.
            </p>
          </section>

          <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 24 }}>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 12 }}>
              Current focus
            </div>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{summary.activeItem?.title ?? 'No active item'}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 14 }}>
              {summary.activeItem?.notes ?? 'All current execution tracks are complete.'}
            </div>
            <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${LINE}`, background: '#FFF9F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD }}>
                  Active task progress
                </span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: INK }}>
                  {summary.activeItem?.progress ?? 100}%
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: '#F0E5D8', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${summary.activeItem?.progress ?? 100}%`,
                    height: '100%',
                    background: summary.activeItem ? GOLD : TEAL,
                  }}
                />
              </div>
              <div style={{ marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                Next: {summary.activeItem?.nextAction ?? 'Choose the next highest-value backlog item.'}
              </div>
            </div>
          </section>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          {[
            ['Tracks', `${summary.total}`, TEAL],
            ['Completed', `${summary.completed}`, TEAL],
            ['In progress', `${summary.inProgress}`, GOLD],
            ['Overall progress', `${summary.averageProgress}%`, RED],
          ].map(([label, value, accent]) => (
            <div key={label} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 22, padding: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent as string, marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontSize: 32 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 22, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                Live progress
              </div>
              <h2 style={{ margin: 0, fontSize: 30 }}>Backlog execution by track</h2>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, maxWidth: 420, textAlign: 'right', lineHeight: 1.55 }}>
              The rule is simple: every next item should strengthen recommendation credibility, evidence operability, or measurable value proof.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {EXECUTION_TRACKS.map(track => {
              const meta = statusMeta(track.status)
              return (
                <article key={track.id} style={{ border: `1px solid ${LINE}`, borderRadius: 22, padding: 18, background: '#FFF9F0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 18 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <div style={{ fontSize: 24 }}>{track.title}</div>
                        <span style={{ padding: '6px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700 }}>
                          {meta.label}
                        </span>
                        <span style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED }}>
                          {driverLabel(track.valueDriver)}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>
                        {track.notes}
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                        <strong>Next action:</strong> {track.nextAction}
                      </div>
                    </div>

                    <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 18 }}>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
                        Progress
                      </div>
                      <div style={{ fontSize: 34, marginBottom: 10 }}>{track.progress}%</div>
                      <div style={{ height: 12, borderRadius: 999, background: '#F0E5D8', overflow: 'hidden', marginBottom: 10 }}>
                        <div
                          style={{
                            width: `${track.progress}%`,
                            height: '100%',
                            background: track.status === 'done' ? TEAL : track.status === 'in_progress' ? GOLD : '#CDBAA5',
                          }}
                        />
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                        {track.status === 'done'
                          ? 'This layer is shipped.'
                          : track.status === 'in_progress'
                            ? 'This is the current build focus.'
                            : 'This sits in the next queue.'}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 28, padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                AbarNexus
              </div>
              <h2 style={{ margin: 0, fontSize: 30 }}>Ingestion skeleton</h2>
              <div style={{ marginTop: 10, fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, maxWidth: 760 }}>
                This is the normalized landing plan for the future knowledge layer. The goal is not to bolt on random connectors. It is to define how client truth and public data land as reusable objects for recommendation, evidence, and value realization.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Preferred now', `${ingestion.preferred.length}`],
                ['Free candidate feeds', `${ingestion.candidate.length}`],
                ['Premium later', `${ingestion.planned.length}`],
              ].map(([label, value]) => (
                <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 24 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Preferred', items: ingestion.preferred, accent: TEAL },
              { label: 'Candidate', items: ingestion.candidate.slice(0, 4), accent: GOLD },
              { label: 'Planned', items: ingestion.planned.slice(0, 3), accent: MUTED },
            ].map(group => (
              <div key={group.label} style={{ border: `1px solid ${LINE}`, borderRadius: 20, padding: 18, background: '#FFF9F0' }}>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: group.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  {group.label}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {group.items.map(source => (
                    <div key={source.sourceId} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, background: PANEL }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 4 }}>{source.sourceName}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5, marginBottom: 8 }}>
                        {source.whyItMatters}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {source.delivery}
                        </span>
                        <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {source.landingZone}
                        </span>
                        <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {source.freshnessExpectation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Ready', `${ingestionOps.ready.length}`],
                ['Needs setup', `${ingestionOps.needsSetup.length}`],
                ['Blocked', `${ingestionOps.blocked.length}`],
                ['Planned', `${ingestionOps.planned.length}`],
              ].map(([label, value]) => (
                <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 14, background: '#FFF9F0' }}>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 22 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {ingestionOps.registry.slice(0, 6).map(source => {
                const meta = runStatusMeta(source.runStatus)
                return (
                  <div key={source.sourceId} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{source.sourceName}</div>
                          <span style={{ padding: '5px 8px', borderRadius: 999, background: meta.bg, color: meta.color, fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700 }}>
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                          {source.whyItMatters}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>{source.delivery}</span>
                          <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>{source.landingZone}</span>
                          <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>{source.normalizedObjects.join(', ')}</span>
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
                          <strong>Next step:</strong> {source.nextStep}
                        </div>
                        {source.blocker && (
                          <div style={{ marginTop: 6, fontFamily: 'DM Sans, sans-serif', color: RED, lineHeight: 1.55 }}>
                            <strong>Blocker:</strong> {source.blocker}
                          </div>
                        )}
                        <button
                          onClick={() => runPreview(source.sourceId)}
                          disabled={previewLoading}
                          style={{
                            marginTop: 10,
                            border: `1px solid ${LINE}`,
                            borderRadius: 999,
                            padding: '8px 12px',
                            background: source.runStatus === 'ready' ? '#E5F4F1' : '#FFF4E5',
                            color: source.runStatus === 'ready' ? TEAL : GOLD,
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 700,
                            cursor: previewLoading ? 'default' : 'pointer',
                          }}
                        >
                          {previewLoading && previewSourceId === source.sourceId ? 'Running preview...' : 'Run preview'}
                        </button>
                      </div>
                      <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 16 }}>
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Readiness
                        </div>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{source.readinessScore}%</div>
                        <div style={{ height: 10, borderRadius: 999, background: '#F0E5D8', overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ width: `${source.readinessScore}%`, height: '100%', background: source.readinessScore >= 75 ? TEAL : source.readinessScore >= 50 ? GOLD : RED }} />
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                          Freshness {source.freshnessExpectation} · Tier {source.tier}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Feed and export-first connector templates
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                This is the bridge from manual evidence operations to repeatable telemetry. We do not need deep integrations everywhere on day one. We do need crisp connector patterns the client can actually support.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
                {connectorTemplates.map(template => (
                  <div key={template.id} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{template.title}</div>
                      <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                        {template.id}
                      </span>
                      <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                        {template.automationLevel}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                      {template.summary}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 8 }}>
                      <strong>Best for:</strong> {template.bestFor}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 8 }}>
                      <strong>Required inputs:</strong> {template.requiredInputs.join(' · ')}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 8 }}>
                      <strong>Output contract:</strong> {template.outputContract}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {template.emittedObjects.map(objectType => (
                        <span key={objectType} style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {objectType}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {template.setupSteps.map(step => (
                        <div key={step} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Priority system playbooks
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                These are the first source-specific onboarding packs we can hand to a design partner. They show what the connector should prove, how the feed lands, and what the minimum export contract looks like.
              </div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                {priorityPlaybooks.map(playbook => {
                  const template = getConnectorTemplate(playbook.recommendedTemplateId)
                  return (
                    <div key={playbook.id} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{playbook.title}</div>
                            <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                              {playbook.systemFamily}
                            </span>
                            {template && (
                              <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                                {template.id}
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                            {playbook.summary}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 10 }}>
                            <strong>Best for:</strong> {playbook.bestFor}
                          </div>
                          <div style={{ display: 'grid', gap: 6 }}>
                            {playbook.onboardingChecklist.map(step => (
                              <div key={step} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 16 }}>
                          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Sample export contract
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 8 }}>
                            <strong>{playbook.exportContract.objectName}</strong> · {playbook.exportContract.cadence}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                            <strong>Required columns:</strong> {playbook.exportContract.requiredColumns.join(' · ')}
                          </div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                            <strong>Join keys:</strong> {playbook.exportContract.joinKeys.join(' · ')}
                          </div>
                          <div style={{ display: 'grid', gap: 6 }}>
                            {playbook.exportContract.qualityChecks.map(check => (
                              <div key={check} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                                {check}
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
                            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                              Request template
                            </div>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginBottom: 6 }}>
                              <strong>{playbook.requestTemplate.subject}</strong>
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                              {playbook.requestTemplate.instructions.map(step => (
                                <div key={step} style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.5 }}>
                                  {step}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Runnable ingestion preview
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                This is the first runnable ingestion action in the product. It executes a source-specific preview adapter and shows the normalized objects the feed would produce.
              </div>
              {previewError && (
                <div style={{ color: RED, fontFamily: 'DM Sans, sans-serif', marginBottom: 10 }}>{previewError}</div>
              )}
              {previewSourceId ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {previewRecords.map((record, index) => (
                    <div key={`${record.sourceId}-${record.title}-${index}`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{record.title}</div>
                        <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {record.objectType}
                        </span>
                        <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                          {record.recordDate}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                        {record.summary}
                      </div>
                      <pre style={{ margin: 0, padding: 12, borderRadius: 14, background: PANEL, border: `1px solid ${LINE}`, fontSize: 12, overflowX: 'auto', color: INK }}>
                        {JSON.stringify(record.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {!previewRecords.length && !previewLoading && (
                    <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                      No preview records returned for this source yet.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  Choose any source above and run a preview to see the normalized output objects.
                </div>
              )}
            </div>

            <div style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Recent ingestion runs
              </div>
              {!runHistoryReady && (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, marginBottom: 10 }}>
                  Run history persistence will appear here once migration `010_abarnexus_ingestion_runs.sql` is applied.
                </div>
              )}
              <div style={{ display: 'grid', gap: 10 }}>
                {runHistory.length ? runHistory.map(run => (
                  <div key={String(run.id)} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 14, background: '#FFF9F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{String(run.source_name || run.source_id)}</div>
                      <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED }}>
                        {String(run.created_at || '').slice(0, 19).replace('T', ' ')}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55 }}>
                      {String(run.status || 'completed')} · {String(run.mode || 'preview')} · {String(run.record_count || 0)} records
                    </div>
                    <button
                      onClick={() => setSelectedRunId(String(run.id))}
                      style={{
                        marginTop: 10,
                        border: `1px solid ${LINE}`,
                        borderRadius: 999,
                        padding: '7px 11px',
                        background: String(run.id) === selectedRunId ? '#E5F4F1' : PANEL,
                        color: String(run.id) === selectedRunId ? TEAL : INK,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {String(run.id) === selectedRunId ? 'Inspecting' : 'Inspect records'}
                    </button>
                  </div>
                )) : (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                    No persisted ingestion runs yet.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Stored normalized records
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                This is the beginnings of product memory: normalized records saved from a prior ingestion run, ready to become reusable `AbarNexus` context.
              </div>
              {selectedRun ? (
                <div>
                  <div style={{ marginBottom: 12, fontFamily: 'DM Sans, sans-serif', color: INK }}>
                    <strong>{String(selectedRun.source_name || selectedRun.source_id)}</strong>{' '}
                    <span style={{ color: MUTED }}>
                      · {String(selectedRun.record_count || 0)} records · {String(selectedRun.created_at || '').slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {selectedRunRecords.length ? selectedRunRecords.map((record, index) => (
                      <div key={`${record.sourceId}-${record.title}-${index}-stored`} style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: '#FFF9F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{record.title}</div>
                          <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                            {record.objectType}
                          </span>
                          <span style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                            stored
                          </span>
                        </div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 8 }}>
                          {record.summary}
                        </div>
                        <pre style={{ margin: 0, padding: 12, borderRadius: 14, background: PANEL, border: `1px solid ${LINE}`, fontSize: 12, overflowX: 'auto', color: INK }}>
                          {JSON.stringify(record.payload, null, 2)}
                        </pre>
                      </div>
                    )) : (
                      <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                        This run does not contain stored normalized records yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED }}>
                  Pick a persisted run above to inspect its stored normalized records.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
    </div>
  )
}
