'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { SOLUTIONS, SolutionKey, PhaseKey, PhaseConfig } from '@/lib/solutions/solution-config'

const T = {
  bg: '#060A12',
  surface: '#0D1520',
  border: '#1C2D45',
  teal: '#2DD4C8',
  tealDim: 'rgba(45,212,200,0.10)',
  tealBorder: 'rgba(45,212,200,0.25)',
  text: '#EFF6FF',
  text2: 'rgba(255,255,255,0.75)',
  muted: 'rgba(255,255,255,0.6)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.10)',
  amber: '#F59E0B',
  green: '#34D399',
  greenDim: 'rgba(52,211,153,0.10)',
  indigo: '#818CF8',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

const PHASE_STATUSES = {
  locked: { label: 'Upcoming', color: T.muted },
  in_progress: { label: 'In Progress', color: T.teal },
  awaiting_maestro_review: { label: 'In Progress', color: T.teal },
  published_to_client: { label: 'Awaiting Your Review', color: T.amber },
  awaiting_client_approval: { label: 'Awaiting Your Review', color: T.amber },
  disputed: { label: 'Under Review', color: T.amber },
  refining: { label: 'Under Review', color: T.amber },
  approved: { label: 'Approved', color: T.green },
  complete: { label: 'Complete', color: T.green },
}

function PortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const rawParams = useParams()
  const searchParams = useSearchParams()

  const solution = rawParams.solution as SolutionKey
  const clientIdOverride = searchParams.get('client')

  const [loading, setLoading] = useState(true)
  const [engagement, setEngagement] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [outputs, setOutputs] = useState<any[]>([])
  const [genomeMatches, setGenomeMatches] = useState<any[]>([])

  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)
  const [disputeText, setDisputeText] = useState('')
  const [disputePhaseId, setDisputePhaseId] = useState<string | null>(null)
  const [commentSection, setCommentSection] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [dataRequests, setDataRequests] = useState<any[]>([])
  const [numberEntryId, setNumberEntryId] = useState<string | null>(null)
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({})
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const role = user?.publicMetadata?.role as string | undefined
  const clientId = clientIdOverride || user?.publicMetadata?.clientId as string | undefined
  const solutionConfig = SOLUTIONS[solution]

  // Auth
  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    // client role = portal user, admin can preview with ?client= param
    if (role !== 'client' && role !== 'admin') { router.push('/'); return }
    if (!clientId) { router.push('/sign-in'); return }
  }, [isLoaded, user, router, role, clientId])

  const clientName = clientId === 'arcturus' ? 'Arcturus Financial Group' :
    clientId === 'meridian' ? 'Meridian Health System' :
    clientId?.charAt(0).toUpperCase() + (clientId?.slice(1) || '')

  const loadData = useCallback(async () => {
    if (!clientId || !solution) return
    setLoading(true)
    const res = await fetch(`/api/engage/${clientId}/${solution}`)
    if (res.status === 404) {
      setLoading(false)
      return
    }
    const data = await res.json()
    if (data.exists) {
      setEngagement(data.engagement)
      setPhases(data.phases || [])
      // Client portal only sees published outputs
      setOutputs((data.outputs || []).filter((o: any) => o.status === 'published' || o.status === 'approved'))
      setGenomeMatches(data.genomeMatches || [])

      // Set active phase to current engagement phase
      const current = data.phases?.find((p: any) => p.phase_number === data.engagement.current_phase)
      if (current) setActivePhaseId(current.id)
    }
    setLoading(false)
  }, [clientId, solution])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!clientId || !solution) return
    fetch(`/api/engage/${clientId}/${solution}/data-requests`)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setDataRequests(d.requests || []))
      .catch(() => {})
  }, [clientId, solution])

  const handleNumberSubmit = async (requestId: string) => {
    const vals = [numberInputs[`${requestId}_0`], numberInputs[`${requestId}_1`], numberInputs[`${requestId}_2`]]
    if (vals.some(v => !v?.trim())) return
    setRespondingId(requestId)
    await fetch(`/api/engage/data-request/${requestId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'numbers_entered',
        response_numbers: { n1: vals[0], n2: vals[1], n3: vals[2] },
        respondedBy: user?.fullName || clientName
      })
    })
    setDataRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'numbers_entered' } : r))
    setNumberEntryId(null)
    setRespondingId(null)
  }

  const handleApprove = async (phaseId: string) => {
    setSubmitting(true)
    await fetch(`/api/engage/phase/${phaseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approved',
        actorId: user?.id,
        actorName: user?.fullName || clientName,
        actorRole: 'client',
        comment: 'Approved via client portal'
      })
    })
    await loadData()
    setSubmitting(false)
  }

  const handleDispute = async (phaseId: string) => {
    if (!disputeText.trim()) return
    setSubmitting(true)
    await fetch(`/api/engage/phase/${phaseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'disputed',
        actorId: user?.id,
        actorName: user?.fullName || clientName,
        actorRole: 'client',
        comment: disputeText
      })
    })
    setDisputeText('')
    setDisputePhaseId(null)
    await loadData()
    setSubmitting(false)
  }

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: '11px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Loading your engagement...
        </div>
      </div>
    )
  }

  if (!solutionConfig) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, paddingTop: '64px' }}>
        <AbarvaNav />
        <div style={{ padding: '48px', color: T.red, fontFamily: T.mono }}>Invalid solution: {solution}</div>
      </div>
    )
  }

  if (!engagement) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg }}>
        <AbarvaNav />
        <div style={{
          paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {solutionConfig.intelligence_name}
            </div>
            <h1 style={{ fontFamily: T.sans, fontSize: '24px', color: T.text, margin: '0 0 12px', fontWeight: 600 }}>
              {solutionConfig.name}
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.text2, margin: 0, lineHeight: 1.6 }}>
              Your engagement is being prepared. You will be notified when your Maestro is ready to begin.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activePhase = phases.find(p => p.id === activePhaseId)
  const activePhaseConfig = activePhase ? solutionConfig.phases[activePhase.phase_number as PhaseKey] : null
  const activeOutput = outputs.find(o => o.phase_id === activePhaseId)

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <AbarvaNav />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '88px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            {solutionConfig.intelligence_name}
          </div>
          <h1 style={{ fontFamily: T.sans, fontSize: '28px', color: T.text, margin: '0 0 8px', fontWeight: 600 }}>
            {clientName}
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.text2, margin: 0 }}>
            {solutionConfig.name} · AbarVa Engagement Portal
          </p>
        </div>

        {/* Data Requests (Phase 0 client intake) */}
        {dataRequests.filter(r => r.status === 'pending' || r.status === 'numbers_entered' || r.status === 'uploaded').length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Data Requests · {dataRequests.filter(r => r.status === 'pending').length} Pending
            </div>
            {dataRequests.map(req => {
              const isPending = req.status === 'pending'
              const isDone = req.status === 'numbers_entered' || req.status === 'uploaded'
              const isExpanded = numberEntryId === req.id
              return (
                <div key={req.id} style={{
                  background: T.surface,
                  border: `1px solid ${isDone ? T.green + '40' : isExpanded ? T.tealBorder : T.border}`,
                  borderLeft: `3px solid ${isDone ? T.green : isExpanded ? T.teal : T.amber}`,
                  borderRadius: '10px', padding: '20px', marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, fontWeight: 600 }}>
                          {req.file_requested}
                        </div>
                        {isDone && (
                          <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.green, background: T.greenDim, borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            {req.status === 'numbers_entered' ? 'Numbers provided' : 'Uploaded'}
                          </span>
                        )}
                        {isPending && (
                          <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.amber, background: 'rgba(245,158,11,0.10)', borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            Requested
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text2, marginBottom: '4px' }}>
                        {req.why_needed}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal }}>
                        Unlocks: {req.what_it_unlocks}
                      </div>
                    </div>
                    {isPending && !isExpanded && (
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => { setNumberEntryId(req.id) }}
                          style={{
                            background: 'transparent', color: T.teal, border: `1px solid ${T.tealBorder}`,
                            borderRadius: '6px', padding: '7px 14px', cursor: 'pointer',
                            fontFamily: T.mono, fontSize: '10px', letterSpacing: '.04em', whiteSpace: 'nowrap'
                          }}
                        >
                          Enter 3 numbers instead
                        </button>
                        <button
                          style={{
                            background: T.teal, color: T.bg,
                            border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer',
                            fontFamily: T.mono, fontSize: '10px', fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap'
                          }}
                        >
                          Upload file
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3-numbers entry form */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
                      {req.three_number_alternative && (
                        <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text2, marginBottom: '12px', fontStyle: 'italic' }}>
                          {req.three_number_alternative}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {[0, 1, 2].map(i => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`Number ${i + 1}`}
                            value={numberInputs[`${req.id}_${i}`] || ''}
                            onChange={e => setNumberInputs(prev => ({ ...prev, [`${req.id}_${i}`]: e.target.value }))}
                            style={{
                              flex: 1, minWidth: '100px', background: T.bg, border: `1px solid ${T.border}`,
                              borderRadius: '6px', padding: '10px 12px',
                              fontFamily: T.mono, fontSize: '13px', color: T.text, outline: 'none'
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setNumberEntryId(null)}
                          style={{
                            background: 'transparent', color: T.text2, border: `1px solid ${T.border}`,
                            borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
                            fontFamily: T.mono, fontSize: '10px', letterSpacing: '.04em'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={respondingId === req.id}
                          onClick={() => handleNumberSubmit(req.id)}
                          style={{
                            background: T.teal, color: T.bg, border: 'none',
                            borderRadius: '6px', padding: '8px 20px', cursor: respondingId === req.id ? 'not-allowed' : 'pointer',
                            fontFamily: T.mono, fontSize: '10px', fontWeight: 700, letterSpacing: '.04em',
                            opacity: respondingId === req.id ? 0.7 : 1
                          }}
                        >
                          {respondingId === req.id ? 'Submitting...' : 'Submit numbers'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Phase Timeline */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
          padding: '24px', marginBottom: '32px'
        }}>
          <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Engagement Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
            {phases.filter(p => p.phase_number > 0).map((phase, i, arr) => {
              const pConfig = solutionConfig.phases[phase.phase_number as PhaseKey]
              const statusInfo = PHASE_STATUSES[phase.status as keyof typeof PHASE_STATUSES] || { label: 'Locked', color: T.muted }
              const isActive = phase.id === activePhaseId
              return (
                <div key={phase.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '120px' }}>
                  <div
                    onClick={() => setActivePhaseId(phase.id)}
                    style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 8px',
                      background: isActive ? T.teal : phase.status === 'approved' || phase.status === 'complete' ? T.green : T.surface,
                      border: `2px solid ${isActive ? T.teal : statusInfo.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      <span style={{
                        fontFamily: T.mono, fontSize: '11px', fontWeight: 700,
                        color: isActive ? T.bg : phase.status === 'approved' || phase.status === 'complete' ? T.bg : statusInfo.color
                      }}>
                        {phase.phase_number}
                      </span>
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: '11px', color: isActive ? T.teal : T.text2, fontWeight: isActive ? 600 : 400, lineHeight: 1.3 }}>
                      {pConfig.name}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: '9px', color: statusInfo.color, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {statusInfo.label}
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{
                      width: '32px', height: '2px', flexShrink: 0,
                      background: phase.status === 'approved' || phase.status === 'complete' ? T.green : T.border
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Phase Content */}
        {activePhase && activePhaseConfig && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Phase {activePhase.phase_number} · {activePhaseConfig.name}
              </div>
              <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.text2, margin: 0, lineHeight: 1.6 }}>
                {activePhaseConfig.description}
              </p>
            </div>

            {!activeOutput ? (
              // Nothing published yet
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
                padding: '48px 32px', textAlign: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 20px', borderRadius: '50%', background: T.tealDim, border: `1px solid ${T.tealBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '18px', color: T.teal }}>◎</div>
                </div>
                <div style={{ fontFamily: T.sans, fontSize: '16px', color: T.text, fontWeight: 600, marginBottom: '12px' }}>
                  Your Maestro is preparing Phase {activePhase.phase_number}
                </div>
                <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.text2, margin: '0 auto', maxWidth: '400px', lineHeight: 1.6 }}>
                  You will be notified when the Phase {activePhase.phase_number} {activePhaseConfig.output_title} is ready for your review.
                </p>
              </div>
            ) : (
              // Output published — show document
              <div>
                <div style={{
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
                  padding: '32px', marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontFamily: T.sans, fontSize: '20px', color: T.text, margin: '0 0 6px', fontWeight: 600 }}>
                        {activeOutput.title}
                      </h2>
                      <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.muted, letterSpacing: '.06em' }}>
                        Version {activeOutput.version} · Published {new Date(activeOutput.published_at || activeOutput.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    {activeOutput.status === 'approved' && (
                      <div style={{
                        fontFamily: T.mono, fontSize: '10px', color: T.green,
                        background: T.greenDim, border: `1px solid ${T.green}30`,
                        borderRadius: '6px', padding: '6px 12px', letterSpacing: '.08em', textTransform: 'uppercase'
                      }}>
                        Approved
                      </div>
                    )}
                  </div>

                  <OutputDocument content={activeOutput.content} outputType={activeOutput.output_type} onComment={(section) => {
                    setCommentSection(section)
                    setCommentText('')
                  }} />
                </div>

                {/* Comment form */}
                {commentSection && (
                  <div style={{
                    background: T.surface, border: `1px solid ${T.tealBorder}`,
                    borderRadius: '12px', padding: '20px', marginBottom: '24px'
                  }}>
                    <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Comment on: {commentSection}
                    </div>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Share your thoughts on this section with your Maestro..."
                      rows={3}
                      style={{
                        width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: '8px', padding: '12px', resize: 'vertical',
                        fontFamily: T.sans, fontSize: '13px', color: T.text,
                        outline: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        onClick={() => { setCommentSection(null); setCommentText('') }}
                        style={{
                          background: 'transparent', color: T.text2, border: `1px solid ${T.border}`,
                          borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
                          fontFamily: T.mono, fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!commentText.trim() || submitting}
                        style={{
                          background: commentText.trim() ? T.teal : T.border,
                          color: commentText.trim() ? T.bg : T.muted,
                          border: 'none', borderRadius: '6px', padding: '8px 20px',
                          cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                          fontFamily: T.mono, fontSize: '10px', fontWeight: 700,
                          letterSpacing: '.06em', textTransform: 'uppercase'
                        }}
                      >
                        Send to Maestro
                      </button>
                    </div>
                  </div>
                )}

                {/* Approval controls */}
                {activeOutput.status === 'published' && activePhase.status === 'published_to_client' && (() => {
                  const activePhaseConfig = solutionConfig?.phases[activePhase.phase_number as PhaseKey] as PhaseConfig | undefined
                  const gateType = activePhaseConfig?.gate_type ?? 'hard'
                  const isHardGate = gateType !== 'soft'
                  return (
                  <div style={{
                    background: T.surface,
                    border: `1px solid ${isHardGate ? T.border : 'rgba(45,212,200,0.25)'}`,
                    borderRadius: '12px', padding: '28px'
                  }}>
                    {/* Gate type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{
                        fontFamily: T.mono, fontSize: '9px', letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: isHardGate ? T.amber : T.teal,
                        background: isHardGate ? 'rgba(245,158,11,0.08)' : 'rgba(45,212,200,0.08)',
                        border: `1px solid ${isHardGate ? 'rgba(245,158,11,0.3)' : 'rgba(45,212,200,0.3)'}`,
                        borderRadius: '4px', padding: '3px 8px',
                      }}>
                        {isHardGate ? '🔒 Hard Gate' : '· Soft Gate'}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text2 }}>
                        {activePhaseConfig?.gate_description}
                      </div>
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: '16px', color: T.text, fontWeight: 600, marginBottom: '8px' }}>
                      Does this accurately describe your situation?
                    </div>
                    <p style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, margin: '0 0 24px', lineHeight: 1.6 }}>
                      {isHardGate
                        ? `Your approval unlocks Phase ${activePhase.phase_number + 1}. This is a hard gate — approval is required to proceed. Flag anything that needs revision first.`
                        : `Your approval moves the engagement to Phase ${activePhase.phase_number + 1}. If something needs to be corrected, flag it and your Maestro will revise.`
                      }
                    </p>

                    {disputePhaseId !== activePhase.id ? (
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleApprove(activePhase.id)}
                          disabled={submitting}
                          style={{
                            flex: 1, minWidth: '200px', background: T.green,
                            color: T.bg, border: 'none', borderRadius: '8px',
                            padding: '14px 24px', cursor: submitting ? 'not-allowed' : 'pointer',
                            fontFamily: T.sans, fontSize: '14px', fontWeight: 600,
                            opacity: submitting ? 0.7 : 1
                          }}
                        >
                          Approve — Continue to Phase {activePhase.phase_number + 1}
                        </button>
                        <button
                          onClick={() => setDisputePhaseId(activePhase.id)}
                          style={{
                            flex: 1, minWidth: '200px', background: 'transparent',
                            color: T.text2, border: `1px solid ${T.border}`,
                            borderRadius: '8px', padding: '14px 24px', cursor: 'pointer',
                            fontFamily: T.sans, fontSize: '14px'
                          }}
                        >
                          I need to flag something
                        </button>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={disputeText}
                          onChange={e => setDisputeText(e.target.value)}
                          placeholder="What needs to be corrected or clarified?"
                          rows={3}
                          style={{
                            width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                            borderRadius: '8px', padding: '12px', resize: 'vertical',
                            fontFamily: T.sans, fontSize: '13px', color: T.text,
                            outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                            marginBottom: '12px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setDisputePhaseId(null); setDisputeText('') }}
                            style={{
                              background: 'transparent', color: T.text2, border: `1px solid ${T.border}`,
                              borderRadius: '6px', padding: '10px 20px', cursor: 'pointer',
                              fontFamily: T.sans, fontSize: '13px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDispute(activePhase.id)}
                            disabled={!disputeText.trim() || submitting}
                            style={{
                              background: T.red, color: '#fff', border: 'none',
                              borderRadius: '6px', padding: '10px 20px',
                              cursor: !disputeText.trim() || submitting ? 'not-allowed' : 'pointer',
                              fontFamily: T.sans, fontSize: '13px', fontWeight: 600,
                              opacity: !disputeText.trim() || submitting ? 0.7 : 1
                            }}
                          >
                            {submitting ? 'Sending...' : 'Flag to Maestro'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })()}

                {activePhase.status === 'disputed' && (
                  <div style={{
                    background: T.redDim, border: `1px solid ${T.red}30`, borderRadius: '12px',
                    padding: '20px', textAlign: 'center'
                  }}>
                    <div style={{ fontFamily: T.sans, fontSize: '14px', color: T.text, fontWeight: 600, marginBottom: '6px' }}>
                      Your feedback has been sent to your Maestro
                    </div>
                    <p style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, margin: 0 }}>
                      They are reviewing your comments and will share a revised document shortly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completed phases — collapsible */}
        {phases.filter(p => p.phase_number > 0 && (p.status === 'approved' || p.status === 'complete') && p.id !== activePhaseId).length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Completed Phases
            </div>
            {phases
              .filter(p => p.phase_number > 0 && (p.status === 'approved' || p.status === 'complete') && p.id !== activePhaseId)
              .map(phase => {
                const pConfig = solutionConfig.phases[phase.phase_number as PhaseKey]
                const pOutput = outputs.find(o => o.phase_id === phase.id && (o.status === 'approved' || o.status === 'published'))
                return (
                  <div key={phase.id} style={{
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px',
                    padding: '16px 20px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, fontWeight: 600 }}>
                        Phase {phase.phase_number} · {pConfig.name}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.green, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Approved {phase.approved_at ? new Date(phase.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setActivePhaseId(phase.id)}
                      style={{
                        background: 'transparent', color: T.teal, border: `1px solid ${T.tealBorder}`,
                        borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
                        fontFamily: T.mono, fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase'
                      }}
                    >
                      View
                    </button>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    </div>
  )
}

function OutputDocument({ content, outputType, onComment }: { content: any; outputType: string; onComment: (section: string) => void }) {
  if (!content) return null

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          {title}
        </div>
        <button
          onClick={() => onComment(title)}
          style={{
            background: 'transparent', color: T.muted, border: `1px solid ${T.border}`,
            borderRadius: '4px', padding: '3px 10px', cursor: 'pointer',
            fontFamily: T.mono, fontSize: '9px', letterSpacing: '.06em', textTransform: 'uppercase'
          }}
        >
          Comment
        </button>
      </div>
      {children}
    </div>
  )

  if (outputType === 'readiness_scorecard') {
    return (
      <div>
        {content.verdict_summary && (
          <Section title="Summary">
            <div style={{ fontFamily: T.sans, fontSize: '15px', color: T.text, lineHeight: 1.7 }}>
              {content.verdict_summary}
            </div>
          </Section>
        )}
        {content.top_findings && (
          <Section title="Key Findings">
            {content.top_findings.map((f: any, i: number) => (
              <FindingItem key={i} finding={f} />
            ))}
          </Section>
        )}
        {content.recommended_action && (
          <Section title="Recommended Action">
            <div style={{
              background: T.tealDim, border: `1px solid ${T.tealBorder}`,
              borderRadius: '8px', padding: '16px',
              fontFamily: T.sans, fontSize: '14px', color: T.text, lineHeight: 1.6
            }}>
              {content.recommended_action}
            </div>
          </Section>
        )}
      </div>
    )
  }

  if (outputType === 'situation_brief') {
    return (
      <div>
        {content.headline && (
          <Section title="Headline Finding">
            <div style={{ fontFamily: T.sans, fontSize: '16px', color: T.text, lineHeight: 1.5, fontWeight: 600 }}>
              {content.headline}
            </div>
          </Section>
        )}
        {content.key_findings && (
          <Section title="Key Findings">
            {content.key_findings.map((f: any, i: number) => (
              <FindingItem key={i} finding={f} />
            ))}
          </Section>
        )}
        {content.what_is_working && (
          <Section title="What Is Working">
            {content.what_is_working.map((w: any, i: number) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', background: T.greenDim, borderRadius: '8px', border: `1px solid ${T.green}20` }}>
                <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.green, fontWeight: 600, marginBottom: '4px' }}>{w.title}</div>
                <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2 }}>{w.description}</div>
              </div>
            ))}
          </Section>
        )}
        {content.recovery_range && (
          <Section title="Recovery Range">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {['conservative', 'base', 'optimistic'].map(scenario => (
                <div key={scenario} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {scenario}
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: '18px', color: T.teal, fontWeight: 700 }}>
                    {content.recovery_range[scenario] || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
        {content.recommended_first_action && (
          <Section title="First Action">
            <div style={{ background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: '8px', padding: '16px', fontFamily: T.sans, fontSize: '14px', color: T.text, lineHeight: 1.6 }}>
              {content.recommended_first_action}
            </div>
          </Section>
        )}
      </div>
    )
  }

  // Generic fallback for other output types
  return (
    <div>
      {Object.entries(content).map(([key, val]) => {
        if (typeof val === 'string' && val) {
          return (
            <Section key={key} title={key.replace(/_/g, ' ')}>
              <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, lineHeight: 1.6 }}>
                {val}
              </div>
            </Section>
          )
        }
        if (Array.isArray(val) && val.length > 0) {
          return (
            <Section key={key} title={key.replace(/_/g, ' ')}>
              {val.map((item: any, i: number) => (
                <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                  {typeof item === 'object' ? (
                    Object.entries(item).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: '4px' }}>
                        <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.muted }}>{k}: </span>
                        <span style={{ fontFamily: T.sans, fontSize: '13px', color: T.text }}>{String(v)}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2 }}>{String(item)}</div>
                  )}
                </div>
              ))}
            </Section>
          )
        }
        return null
      })}
    </div>
  )
}

function FindingItem({ finding }: { finding: any }) {
  const colors: Record<string, string> = { critical: T.red, high: T.amber, medium: T.text2, low: T.muted, positive: T.green }
  const c = colors[finding.severity] || T.text2
  return (
    <div style={{
      background: T.bg, border: `1px solid ${c}20`, borderLeft: `3px solid ${c}`,
      borderRadius: '8px', padding: '14px', marginBottom: '10px'
    }}>
      <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>
        {finding.title}
      </div>
      {finding.description && (
        <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, lineHeight: 1.6, marginBottom: '8px' }}>
          {finding.description}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: T.mono, fontSize: '9px', color: c, background: `${c}15`,
          borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em'
        }}>{finding.severity}</span>
        {finding.genome_pattern && (
          <span style={{
            fontFamily: T.mono, fontSize: '9px', color: T.red, background: 'rgba(239,68,68,0.10)',
            borderRadius: '3px', padding: '2px 6px'
          }}>{finding.genome_pattern}</span>
        )}
        {finding.source_files?.map((sf: string) => (
          <span key={sf} style={{
            fontFamily: T.mono, fontSize: '9px', color: T.teal, background: T.tealDim,
            borderRadius: '3px', padding: '2px 6px'
          }}>{sf}</span>
        ))}
      </div>
    </div>
  )
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060A12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#2DD4C8', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Loading...
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}
