'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { SOLUTIONS, SolutionKey, PhaseKey, PhaseConfig } from '@/lib/solutions/solution-config'

const BG = '#060A12'
const CARD = '#0D1520'
const BORDER = '#1C2D45'
const TEAL = '#2DD4C8'
const WHITE = '#EFF6FF'
const MUTED = 'rgba(255,255,255,0.75)'
const DIM = 'rgba(255,255,255,0.6)'
const AMBER = '#F59E0B'
const GREEN = '#22C55E'
const RED = '#EF4444'
const SANS = 'DM Sans, sans-serif'
const MONO = 'JetBrains Mono, monospace'

const PHASE_STATUSES = {
  locked: { label: 'Upcoming', color: MUTED },
  in_progress: { label: 'In Progress', color: TEAL },
  awaiting_maestro_review: { label: 'In Progress', color: TEAL },
  published_to_client: { label: 'Awaiting Your Review', color: AMBER },
  awaiting_client_approval: { label: 'Awaiting Your Review', color: AMBER },
  disputed: { label: 'Under Review', color: AMBER },
  refining: { label: 'Under Review', color: AMBER },
  approved: { label: 'Approved', color: GREEN },
  complete: { label: 'Complete', color: GREEN },
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const [findings, setFindings] = useState<any[]>([])
  const [workstreams, setWorkstreams] = useState<any[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)

  const [dataRequests, setDataRequests] = useState<any[]>([])
  const [numberEntryId, setNumberEntryId] = useState<string | null>(null)
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({})
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const [showMessageModal, setShowMessageModal] = useState(false)

  const role = user?.publicMetadata?.role as string | undefined
  const clientId = clientIdOverride || user?.publicMetadata?.clientId as string | undefined
  const solutionConfig = SOLUTIONS[solution]

  // Auth
  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    if (role !== 'client' && role !== 'admin') { router.push('/'); return }
    if (!clientId) { router.push('/sign-in'); return }
  }, [isLoaded, user, router, role, clientId])

  const clientName = clientId === 'arcturus' ? 'Arcturus Financial Group' :
    clientId === 'meridian' ? 'Meridian Health System' :
    clientId ? (clientId.charAt(0).toUpperCase() + clientId.slice(1)) : ''

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
      setOutputs((data.outputs || []).filter((o: any) => o.status === 'published' || o.status === 'approved'))
      setGenomeMatches(data.genomeMatches || [])
      setFindings(data.findings || [])
      setWorkstreams(data.workstreams || [])
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

  const handleDispute = async (phaseId: string, disputeText: string) => {
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
    await loadData()
    setSubmitting(false)
  }

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Loading your engagement...
        </div>
      </div>
    )
  }

  if (!solutionConfig) {
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <TopBar clientName={clientName} userName={user?.fullName || ''} />
        <div style={{ padding: '48px', color: RED, fontFamily: MONO }}>Invalid solution: {solution}</div>
      </div>
    )
  }

  if (!engagement) {
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <TopBar clientName={clientName} userName={user?.fullName || ''} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {solutionConfig.intelligence_name}
            </div>
            <h1 style={{ fontFamily: SANS, fontSize: '24px', color: WHITE, margin: '0 0 12px', fontWeight: 600 }}>
              {solutionConfig.name}
            </h1>
            <p style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, margin: 0, lineHeight: 1.6 }}>
              Your engagement is being prepared. You will be notified when your Maestro is ready to begin.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Derived state
  const currentPhase = phases.find((p: any) => p.phase_number === engagement.current_phase)
  const isReadyForApproval = currentPhase?.status === 'awaiting_client_approval' || currentPhase?.status === 'published_to_client'
  const isComplete = engagement.status === 'complete'
  const isInProgress = !isReadyForApproval && !isComplete

  const completedPhaseCount = phases.filter((p: any) => (p.status === 'approved' || p.status === 'complete') && p.phase_number > 0).length

  const phaseStatusLabel = (() => {
    if (!currentPhase) return 'IN PROGRESS'
    const s = currentPhase.status
    if (s === 'in_progress' || s === 'awaiting_maestro_review') return 'IN PROGRESS'
    if (s === 'published_to_client' || s === 'awaiting_client_approval') return 'AWAITING APPROVAL'
    if (s === 'approved' || s === 'complete') return 'COMPLETE'
    if (s === 'disputed' || s === 'refining') return 'UNDER REVIEW'
    return 'IN PROGRESS'
  })()

  const topFindings = findings
    .filter((f: any) => f.severity !== 'positive' && f.status !== 'removed')
    .sort((a: any, b: any) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    })
    .slice(0, 3)

  const pendingDataRequests = dataRequests.filter((r: any) => r.status === 'pending' || r.status === 'numbers_entered' || r.status === 'uploaded')

  const phaseFindings = (phaseNum: number) => {
    const phase = phases.find((p: any) => p.phase_number === phaseNum)
    if (!phase) return []
    return findings.filter((f: any) => f.phase_id === phase.id)
  }

  const currentPhaseFindings = currentPhase ? phaseFindings(currentPhase.phase_number) : []
  const criticalCount = currentPhaseFindings.filter((f: any) => f.severity === 'critical').length
  const highCount = currentPhaseFindings.filter((f: any) => f.severity === 'high').length

  // Approval modal findings
  const modalFindings = currentPhaseFindings
    .filter((f: any) => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      {/* 1. CUSTOM TOP BAR */}
      <TopBar clientName={clientName} userName={user?.fullName || ''} />

      {/* 2. HERO STATUS CARD */}
      <div style={{
        background: 'rgba(13,20,32,0.80)',
        borderBottom: '1px solid rgba(45,212,200,0.15)',
        padding: '28px 5vw'
      }}>
        {/* Row 1 */}
        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '12px' }}>
          {solutionConfig.intelligence_name} · {clientName.toUpperCase()}
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: SANS, fontSize: '28px', fontWeight: 700, color: WHITE }}>
            {solutionConfig.name}
          </div>
          {engagement.current_phase != null && (
            <div style={{
              border: '1px solid rgba(45,212,200,0.30)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontFamily: MONO,
              fontSize: '10px',
              color: TEAL,
              whiteSpace: 'nowrap'
            }}>
              PHASE {engagement.current_phase} · {phaseStatusLabel}
            </div>
          )}
        </div>

        {/* Row 3 — Progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, (completedPhaseCount / 4) * 100))}%`,
              background: TEAL,
              height: '4px',
              borderRadius: '2px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.40)', marginTop: '6px' }}>
            Phase {engagement.current_phase} of 4 · {completedPhaseCount * 25}% complete
          </div>
        </div>

        {/* Row 4 */}
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.40)', marginTop: '10px' }}>
          Started: {formatDate(engagement.created_at)} · Engagement: {engagement.engagement_name || '—'}
        </div>
      </div>

      {/* 3. THREE-COLUMN BODY */}
      <div style={{ padding: '32px 5vw', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: '0 0 28%', minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '14px' }}>
            ENGAGEMENT PHASES
          </div>

          {[1, 2, 3, 4].map((phaseNum, idx) => {
            const phase = phases.find((p: any) => p.phase_number === phaseNum)
            const pConfig = solutionConfig.phases[phaseNum as PhaseKey]
            const status = phase?.status || 'locked'
            const isApproved = status === 'approved' || status === 'complete'
            const isActive = status === 'in_progress' || status === 'awaiting_maestro_review' || status === 'published_to_client' || status === 'awaiting_client_approval' || status === 'disputed' || status === 'refining'
            const isLocked = status === 'locked'
            const phaseWorkstreams = phase ? workstreams.filter((w: any) => w.phase_id === phase.id) : []

            return (
              <div key={phaseNum}>
                {/* Connecting line before (except first) */}
                {idx > 0 && (
                  <div style={{
                    width: '2px',
                    height: '12px',
                    background: isApproved || (phases.find((p: any) => p.phase_number === phaseNum - 1)?.status === 'approved' || phases.find((p: any) => p.phase_number === phaseNum - 1)?.status === 'complete') ? TEAL : 'rgba(255,255,255,0.10)',
                    marginLeft: '9px',
                    marginBottom: '0px'
                  }} />
                )}

                {/* Phase card */}
                <div style={{
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '4px',
                  background: isApproved ? 'rgba(34,197,94,0.04)' : isActive ? 'rgba(45,212,200,0.06)' : 'transparent',
                  border: isApproved ? '1px solid rgba(34,197,94,0.30)' : isActive ? '1px solid rgba(45,212,200,0.20)' : '1px solid rgba(255,255,255,0.06)',
                  borderLeft: isApproved ? '2px solid rgba(34,197,94,0.30)' : isActive ? '3px solid ' + TEAL : '2px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {/* Icon */}
                    <div style={{ flexShrink: 0, marginTop: '1px' }}>
                      {isApproved ? (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.40)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', color: GREEN
                        }}>✓</div>
                      ) : isActive ? (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: TEAL, marginTop: '6px',
                          animation: 'pulse 2s infinite'
                        }} />
                      ) : (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', color: 'rgba(255,255,255,0.20)'
                        }}>○</div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: isApproved ? MUTED : isActive ? TEAL : 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '3px' }}>
                        Phase {phaseNum}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: isActive ? '14px' : '13px', fontWeight: isActive ? 700 : 400, color: isLocked ? 'rgba(255,255,255,0.30)' : WHITE, marginBottom: '4px' }}>
                        {pConfig?.name || `Phase ${phaseNum}`}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: '9px', color: isApproved ? GREEN : isActive ? TEAL : 'rgba(255,255,255,0.25)' }}>
                        {isApproved
                          ? `Approved · ${formatDate(phase?.approved_at)}`
                          : isActive
                          ? `In progress · ${phaseWorkstreams.length} workstream${phaseWorkstreams.length !== 1 ? 's' : ''} active`
                          : 'Locked'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Fee Status Card */}
          <div style={{
            background: 'rgba(45,212,200,0.04)',
            border: '1px solid rgba(45,212,200,0.15)',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '20px'
          }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
              FEE STATUS
            </div>
            <div style={{ fontFamily: MONO, fontSize: '24px', fontWeight: 700, color: TEAL, marginBottom: '6px' }}>
              {engagement.metadata?.verified_savings || '—'}
            </div>
            <div style={{ fontFamily: SANS, fontSize: '14px', color: WHITE, marginBottom: '8px' }}>
              Fee earned: {engagement.metadata?.fee_earned || '$0'}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.50)', marginBottom: '10px' }}>
              Fee triggered at $10M verified savings
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
              <div style={{ height: '4px', width: '0%', background: TEAL, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Data Requests — ACTION NEEDED */}
          {pendingDataRequests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: AMBER, textTransform: 'uppercase', letterSpacing: '.12em' }}>
                  ACTION NEEDED
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.40)' }}>
                  {dataRequests.filter((r: any) => r.status === 'pending').length} pending data request{dataRequests.filter((r: any) => r.status === 'pending').length !== 1 ? 's' : ''}
                </div>
              </div>
              {dataRequests.map((req: any) => {
                const isPending = req.status === 'pending'
                const isDone = req.status === 'numbers_entered' || req.status === 'uploaded'
                const isExpanded = numberEntryId === req.id
                return (
                  <div key={req.id} style={{
                    background: CARD,
                    border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : isExpanded ? 'rgba(45,212,200,0.25)' : BORDER}`,
                    borderLeft: `3px solid ${isDone ? GREEN : isExpanded ? TEAL : AMBER}`,
                    borderRadius: '10px', padding: '20px', marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, fontWeight: 600 }}>
                            {req.file_requested}
                          </div>
                          {isDone && (
                            <span style={{ fontFamily: MONO, fontSize: '9px', color: GREEN, background: 'rgba(34,197,94,0.10)', borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                              {req.status === 'numbers_entered' ? 'Numbers provided' : 'Uploaded'}
                            </span>
                          )}
                          {isPending && (
                            <span style={{ fontFamily: MONO, fontSize: '9px', color: AMBER, background: 'rgba(245,158,11,0.10)', borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                              Requested
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginBottom: '4px' }}>
                          {req.why_needed}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL }}>
                          Unlocks: {req.what_it_unlocks}
                        </div>
                      </div>
                      {isPending && !isExpanded && (
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => setNumberEntryId(req.id)}
                            style={{
                              background: 'transparent', color: TEAL, border: '1px solid rgba(45,212,200,0.25)',
                              borderRadius: '6px', padding: '7px 14px', cursor: 'pointer',
                              fontFamily: MONO, fontSize: '10px', letterSpacing: '.04em', whiteSpace: 'nowrap'
                            }}
                          >
                            Enter 3 numbers instead
                          </button>
                          <button
                            style={{
                              background: TEAL, color: BG,
                              border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer',
                              fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap'
                            }}
                          >
                            Upload file
                          </button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}>
                        {req.three_number_alternative && (
                          <div style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginBottom: '12px', fontStyle: 'italic' }}>
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
                                flex: 1, minWidth: '100px', background: BG, border: `1px solid ${BORDER}`,
                                borderRadius: '6px', padding: '10px 12px',
                                fontFamily: MONO, fontSize: '13px', color: WHITE, outline: 'none'
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setNumberEntryId(null)}
                            style={{
                              background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`,
                              borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
                              fontFamily: MONO, fontSize: '10px', letterSpacing: '.04em'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            disabled={respondingId === req.id}
                            onClick={() => handleNumberSubmit(req.id)}
                            style={{
                              background: TEAL, color: BG, border: 'none',
                              borderRadius: '6px', padding: '8px 20px', cursor: respondingId === req.id ? 'not-allowed' : 'pointer',
                              fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '.04em',
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

          {/* LATEST INTELLIGENCE */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em' }}>
                LATEST INTELLIGENCE
              </div>
              {findings.length > 0 && (
                <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, cursor: 'pointer' }}>
                  View all {findings.length} findings →
                </div>
              )}
            </div>

            {topFindings.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.40)', fontStyle: 'italic' }}>
                AbarVa will publish intelligence as the engagement progresses.
              </div>
            ) : (
              topFindings.map((f: any) => (
                <FindingCard key={f.id} finding={f} phases={phases} workstreams={workstreams} />
              ))
            )}
          </div>

          {/* PUBLISHED OUTPUTS */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '14px' }}>
              PUBLISHED OUTPUTS
            </div>

            {outputs.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.40)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                AbarVa will publish outputs as each phase is completed.
              </div>
            ) : (
              outputs.map((output: any) => {
                const phase = phases.find((p: any) => p.id === output.phase_id)
                const phaseNum = phase?.phase_number
                return (
                  <div key={output.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {/* Phase badge */}
                    {phaseNum != null && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'rgba(45,212,200,0.10)',
                        border: '1px solid rgba(45,212,200,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: '9px', color: TEAL, flexShrink: 0
                      }}>
                        P{phaseNum}
                      </div>
                    )}
                    {/* Title */}
                    <div style={{ flex: 1, fontFamily: SANS, fontSize: '13px', color: WHITE, minWidth: 0 }}>
                      {output.title}
                    </div>
                    {/* Date */}
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, flexShrink: 0 }}>
                      {formatDate(output.approved_at || output.created_at)}
                    </div>
                    {/* View */}
                    <button style={{
                      background: 'transparent', color: TEAL,
                      border: '1px solid rgba(45,212,200,0.25)',
                      borderRadius: '4px', padding: '4px 10px',
                      fontFamily: MONO, fontSize: '9px', cursor: 'pointer', flexShrink: 0
                    }}>
                      View
                    </button>
                    {/* Download */}
                    <button style={{
                      background: 'transparent', color: WHITE,
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px', padding: '4px 10px',
                      fontFamily: MONO, fontSize: '9px', cursor: 'pointer', flexShrink: 0
                    }}>
                      Download
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: '0 0 260px', position: 'sticky', top: '72px' }}>

          {/* ACTION CARD */}
          {isReadyForApproval ? (
            // State A — Ready for approval
            <div style={{
              background: 'rgba(45,212,200,0.06)',
              border: '1px solid rgba(45,212,200,0.30)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
                YOUR ACTION
              </div>
              <div style={{ fontFamily: SANS, fontSize: '16px', fontWeight: 700, color: WHITE, marginBottom: '10px' }}>
                Phase {currentPhase?.phase_number} is ready for your review
              </div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.6, marginBottom: '8px' }}>
                {solutionConfig.phases[currentPhase?.phase_number as PhaseKey]?.gate_description || 'Review the findings and approve to proceed to the next phase.'}
              </div>
              {(criticalCount > 0 || highCount > 0) && (
                <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, marginBottom: '16px' }}>
                  {criticalCount > 0 ? `${criticalCount} critical` : ''}{criticalCount > 0 && highCount > 0 ? ' · ' : ''}{highCount > 0 ? `${highCount} high` : ''} findings identified
                </div>
              )}
              <button
                onClick={() => setShowApprovalModal(true)}
                style={{
                  width: '100%', background: TEAL, color: BG,
                  border: 'none', borderRadius: '8px', padding: '14px',
                  fontFamily: SANS, fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', marginTop: '4px'
                }}
              >
                Review &amp; Approve Phase {currentPhase?.phase_number} →
              </button>
              <button style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.20)',
                color: MUTED, borderRadius: '8px', padding: '12px',
                fontFamily: SANS, fontSize: '13px', cursor: 'pointer', marginTop: '10px'
              }}>
                Download Phase Summary
              </button>
            </div>
          ) : isComplete ? (
            // State C — Complete
            <div style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: GREEN, textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
                ENGAGEMENT COMPLETE
              </div>
              <div style={{ fontFamily: MONO, fontSize: '28px', fontWeight: 700, color: TEAL, marginBottom: '6px' }}>
                {engagement.metadata?.verified_savings || '—'}
              </div>
              <div style={{ fontFamily: SANS, fontSize: '14px', color: WHITE, marginBottom: '20px' }}>
                {engagement.metadata?.fee_earned || 'Fee calculation pending'}
              </div>
              <button style={{
                width: '100%', background: TEAL, color: BG,
                border: 'none', borderRadius: '8px', padding: '14px',
                fontFamily: SANS, fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }}>
                Download Final Report →
              </button>
            </div>
          ) : (
            // State B — In progress
            <div style={{
              background: 'rgba(13,20,32,0.80)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
                IN PROGRESS
              </div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.70)', lineHeight: 1.6 }}>
                AbarVa is working on Phase {currentPhase?.phase_number}. You will be notified when it is ready for your review.
              </div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.40)', marginTop: '12px' }}>
                Last activity: {formatDate(engagement.updated_at || engagement.created_at)}
              </div>
            </div>
          )}

          {/* MAESTRO CONTACT CARD */}
          <div style={{
            background: 'rgba(13,20,32,0.60)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
              YOUR MAESTRO
            </div>
            <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 600, color: WHITE, marginBottom: '4px' }}>
              Anand Sundaram
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, marginBottom: '12px' }}>
              AbarVa Lead
            </div>
            <div
              onClick={() => setShowMessageModal(true)}
              style={{ fontFamily: MONO, fontSize: '10px', color: TEAL, cursor: 'pointer' }}
            >
              Send a message →
            </div>
          </div>
        </div>
      </div>

      {/* 5. BELOW-FOLD SECTIONS */}
      <div style={{ padding: '0 5vw 32px' }}>

        {/* ENGAGEMENT OUTPUTS TABLE */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '16px' }}>
            ENGAGEMENT OUTPUTS
          </div>
          {outputs.length === 0 ? (
            <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>
              No outputs published yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Phase', 'Output Name', 'Published', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{
                      fontFamily: MONO, fontSize: '10px', color: TEAL,
                      padding: '8px 12px', background: 'rgba(45,212,200,0.04)',
                      borderBottom: `1px solid ${BORDER}`, textAlign: 'left',
                      fontWeight: 400, letterSpacing: '.06em', textTransform: 'uppercase'
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outputs.map((output: any) => {
                  const phase = phases.find((p: any) => p.id === output.phase_id)
                  const phaseNum = phase?.phase_number
                  const isApprovedOut = output.status === 'approved'
                  return (
                    <tr key={output.id}>
                      <td style={{ fontFamily: MONO, fontSize: '13px', color: WHITE, padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {phaseNum != null ? (
                          <span style={{
                            fontFamily: MONO, fontSize: '9px', color: TEAL,
                            background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.20)',
                            borderRadius: '3px', padding: '2px 6px'
                          }}>P{phaseNum}</span>
                        ) : '—'}
                      </td>
                      <td style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {output.title}
                      </td>
                      <td style={{ fontFamily: MONO, fontSize: '9px', color: MUTED, padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {formatDate(output.approved_at || output.created_at)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{
                          fontFamily: MONO, fontSize: '9px',
                          color: isApprovedOut ? GREEN : TEAL,
                          background: isApprovedOut ? 'rgba(34,197,94,0.08)' : 'rgba(45,212,200,0.08)',
                          border: `1px solid ${isApprovedOut ? 'rgba(34,197,94,0.25)' : 'rgba(45,212,200,0.25)'}`,
                          borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase'
                        }}>
                          {isApprovedOut ? 'Approved' : 'Published'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{
                            background: 'transparent', color: TEAL, border: 'none',
                            fontFamily: MONO, fontSize: '9px', cursor: 'pointer', padding: 0
                          }}>View</button>
                          <button style={{
                            background: 'transparent', color: TEAL, border: 'none',
                            fontFamily: MONO, fontSize: '9px', cursor: 'pointer', padding: 0
                          }}>Download</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* GENOME PATTERN SUMMARY */}
        {genomeMatches.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '4px' }}>
              GENOME PATTERN SUMMARY
            </div>
            <div style={{ fontFamily: SANS, fontSize: '12px', color: 'rgba(255,255,255,0.60)', marginBottom: '20px' }}>
              Patterns matched against your engagement data
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {genomeMatches.map((gm: any, i: number) => (
                <div key={i} style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderTop: `2px solid ${TEAL}`,
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <div style={{ fontFamily: MONO, fontSize: '24px', fontWeight: 700, color: TEAL, marginBottom: '8px' }}>
                    {gm.pattern_code}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 600, color: WHITE, marginBottom: '6px' }}>
                    {gm.pattern_name}
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '8px' }}>
                    <div style={{
                      height: '4px',
                      width: `${Math.min(100, (gm.failure_rate || 0) * 100)}%`,
                      background: TEAL, borderRadius: '2px'
                    }} />
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: '12px', color: 'rgba(255,255,255,0.70)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {gm.evidence ? gm.evidence.slice(0, 100) + (gm.evidence.length > 100 ? '…' : '') : ''}
                  </div>
                  <span style={{
                    fontFamily: MONO, fontSize: '9px',
                    color: gm.confidence === 'confirmed' ? TEAL : MUTED,
                    textTransform: 'uppercase', letterSpacing: '.06em'
                  }}>
                    {gm.confidence === 'confirmed' ? 'CONFIRMED' : 'PROBABLE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '32px 5vw', textAlign: 'center', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.30)' }}>
          AbarVa · Intelligence. Now act on it.
        </div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.20)', marginTop: '4px' }}>
          Confidential — for {clientName} only
        </div>
      </div>

      {/* 4. APPROVAL MODAL */}
      {showApprovalModal && currentPhase && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(6,10,18,0.95)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: CARD,
            border: '1px solid rgba(45,212,200,0.30)',
            borderRadius: '14px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%'
          }}>
            {approvalSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)', border: `1px solid ${GREEN}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '20px', color: GREEN
                }}>✓</div>
                <div style={{ fontFamily: SANS, fontSize: '16px', fontWeight: 700, color: WHITE, marginBottom: '8px' }}>
                  Phase {currentPhase.phase_number} approved
                </div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: MUTED }}>
                  AbarVa will begin Phase {currentPhase.phase_number + 1}.
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: SANS, fontSize: '20px', fontWeight: 700, color: WHITE, marginBottom: '12px' }}>
                  Approve Phase {currentPhase.phase_number} — {solutionConfig.phases[currentPhase.phase_number as PhaseKey]?.name || ''}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(255,255,255,0.80)', lineHeight: 1.6, marginTop: '12px' }}>
                  By approving, you confirm that AbarVa may proceed to Phase {currentPhase.phase_number + 1}.
                  This approval is logged with your name, role, and timestamp.
                </div>

                {modalFindings.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL, textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: '10px' }}>
                      FINDINGS YOU ARE APPROVING
                    </div>
                    {modalFindings.map((f: any) => (
                      <div key={f.id} style={{ fontFamily: SANS, fontSize: '13px', color: WHITE, lineHeight: 1.6, marginBottom: '6px' }}>
                        · {f.title}
                      </div>
                    ))}
                    {currentPhaseFindings.filter((f: any) => f.severity === 'critical' || f.severity === 'high').length > 5 && (
                      <div style={{ fontFamily: MONO, fontSize: '10px', color: MUTED, marginTop: '6px' }}>
                        + {currentPhaseFindings.filter((f: any) => f.severity === 'critical' || f.severity === 'high').length - 5} additional findings
                      </div>
                    )}
                  </div>
                )}

                <button
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true)
                    await fetch(`/api/engage/phase/${currentPhase.id}/approve`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'approved',
                        actorName: user?.fullName || clientName,
                        actorRole: role || 'client',
                        comment: 'Approved via client portal'
                      })
                    })
                    setApprovalSuccess(true)
                    setTimeout(() => {
                      setShowApprovalModal(false)
                      setApprovalSuccess(false)
                      loadData()
                    }, 2000)
                    setSubmitting(false)
                  }}
                  style={{
                    width: '100%', background: submitting ? 'rgba(45,212,200,0.5)' : TEAL,
                    color: BG, border: 'none', borderRadius: '8px', padding: '14px',
                    fontFamily: SANS, fontSize: '14px', fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '20px'
                  }}
                >
                  {submitting ? 'Approving...' : 'Confirm Approval →'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'rgba(255,255,255,0.60)', fontSize: '13px',
                      cursor: 'pointer', fontFamily: SANS
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// TOP BAR COMPONENT
function TopBar({ clientName, userName }: { clientName: string; userName: string }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: '56px',
      background: 'rgba(6,10,18,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(45,212,200,0.12)',
      padding: '0 5vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* LEFT: AbarVa wordmark */}
      <div>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: 800, color: WHITE }}>Abar</span>
        <span style={{ fontFamily: MONO, fontSize: '23px', fontWeight: 900, color: TEAL }}>Va</span>
      </div>

      {/* CENTER: client name */}
      <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 600, color: WHITE }}>
        {clientName}
      </div>

      {/* RIGHT: user name + sign out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: SANS, fontSize: '13px', color: MUTED }}>{userName}</span>
        <SignOutButton>
          <button style={{
            background: 'transparent', border: 'none',
            color: TEAL, fontSize: '13px', cursor: 'pointer',
            fontFamily: SANS, padding: 0
          }}>
            Sign out
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}

// FINDING CARD COMPONENT
function FindingCard({ finding, phases, workstreams }: { finding: any; phases: any[]; workstreams: any[] }) {
  const severityColor = finding.severity === 'critical' ? RED
    : finding.severity === 'high' ? '#F97316'
    : finding.severity === 'medium' ? AMBER
    : MUTED

  const severityBg = finding.severity === 'critical' ? 'rgba(239,68,68,0.12)'
    : finding.severity === 'high' ? 'rgba(249,115,22,0.12)'
    : finding.severity === 'medium' ? 'rgba(245,158,11,0.12)'
    : 'rgba(255,255,255,0.06)'

  const phase = phases.find((p: any) => p.id === finding.phase_id)
  const ws = workstreams.find((w: any) => w.id === finding.workstream_id)
  const contextLabel = ws?.name || (phase ? `Phase ${phase.phase_number}` : '—')

  return (
    <div style={{
      background: CARD,
      border: '1px solid rgba(45,212,200,0.10)',
      borderRadius: '10px',
      padding: '18px 20px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'border-color 0.2s'
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(45,212,200,0.10)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontFamily: MONO, fontSize: '9px',
          color: severityColor, background: severityBg,
          borderRadius: '3px', padding: '2px 6px',
          letterSpacing: '.06em', textTransform: 'uppercase'
        }}>
          {finding.severity?.toUpperCase() || 'FINDING'}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {finding.genome_pattern && (
            <span style={{
              fontFamily: MONO, fontSize: '10px', color: TEAL,
              border: '1px solid rgba(45,212,200,0.25)',
              background: 'rgba(45,212,200,0.06)',
              borderRadius: '3px', padding: '2px 6px'
            }}>
              {finding.genome_pattern}
            </span>
          )}
          <span style={{
            fontFamily: MONO, fontSize: '9px',
            color: 'rgba(45,212,200,0.80)',
            background: 'rgba(45,212,200,0.08)',
            border: '1px solid rgba(45,212,200,0.20)',
            borderRadius: '3px', padding: '2px 6px'
          }}>
            CONFIRMED
          </span>
        </div>
      </div>
      <div style={{ fontFamily: SANS, fontSize: '14px', fontWeight: 600, color: WHITE, marginTop: '10px' }}>
        {finding.title}
      </div>
      <div style={{
        fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.78)',
        lineHeight: 1.6, marginTop: '6px',
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
      } as React.CSSProperties}>
        {finding.body || finding.description || finding.summary || ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}>
          {contextLabel}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '9px', color: TEAL }}>
          View full finding →
        </div>
      </div>
    </div>
  )
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Loading...
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}
