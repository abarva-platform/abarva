'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { SOLUTIONS, SolutionKey, PhaseKey } from '@/lib/solutions/solution-config'
import MarginOpportunityMap from '@/components/engage/MarginOpportunityMap'
import OutputRenderer from '@/components/OutputRenderer'

const T = {
  bg: '#F8F7F4',
  surface: '#FFFFFF',
  border: '#E2E1DC',
  teal: '#2DD4C8',
  tealDim: 'rgba(45,212,200,0.10)',
  tealBorder: 'rgba(45,212,200,0.25)',
  text: '#0C0C0C',
  text2: '#3C3C3C',
  muted: '#888888',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.10)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.10)',
  green: '#34D399',
  greenDim: 'rgba(52,211,153,0.10)',
  indigo: '#818CF8',
  mono: 'JetBrains Mono, Menlo, monospace',
  sans: 'DM Sans, Inter, system-ui, sans-serif',
}

const PHASE_STATUS_COLORS: Record<string, string> = {
  locked: T.muted,
  in_progress: T.teal,
  awaiting_maestro_review: T.amber,
  published_to_client: T.indigo,
  awaiting_client_approval: T.indigo,
  disputed: T.red,
  refining: T.amber,
  approved: T.green,
  complete: T.green,
}

const PHASE_STATUS_LABELS: Record<string, string> = {
  locked: 'LOCKED',
  in_progress: 'IN PROGRESS',
  awaiting_maestro_review: 'REVIEW NEEDED',
  published_to_client: 'SENT TO CLIENT',
  awaiting_client_approval: 'AWAITING APPROVAL',
  disputed: 'DISPUTED',
  refining: 'REFINING',
  approved: 'APPROVED',
  complete: 'COMPLETE',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: T.red,
  high: T.amber,
  medium: T.text2,
  low: T.muted,
  positive: T.green,
}

type Panel = 'workstreams' | 'findings' | 'deliverables' | 'output' | 'activity'

export default function MaestroWorkspace() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const rawParams = useParams()
  const clientId = rawParams.clientId as string
  const solution = rawParams.solution as SolutionKey

  const [loading, setLoading] = useState(true)
  const [engagement, setEngagement] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [workstreams, setWorkstreams] = useState<any[]>([])
  const [outputs, setOutputs] = useState<any[]>([])
  const [findings, setFindings] = useState<any[]>([])
  const [genomeMatches, setGenomeMatches] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)
  const [activeWorkstreamId, setActiveWorkstreamId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [aiStreamBuffer, setAiStreamBuffer] = useState('')

  const [rightPanel, setRightPanel] = useState<Panel>('findings')
  const [generatingOutput, setGeneratingOutput] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [approving, setApproving] = useState(false)

  const [starting, setStarting] = useState(false)
  const [opportunityLevers, setOpportunityLevers] = useState<any[]>([])
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [runningVendorIntel, setRunningVendorIntel] = useState(false)
  const [vendorIntelResult, setVendorIntelResult] = useState<any>(null)

  // Engagement switcher
  const [engagementList, setEngagementList] = useState<any[]>([])
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newEngagementName, setNewEngagementName] = useState('')
  const [switching, setSwitching] = useState(false)
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [seedingFullDemo, setSeedingFullDemo] = useState(false)

  // Admin unlock
  const [unlockConfirm, setUnlockConfirm] = useState<{ phaseId: string; phaseName: string; phaseNum: number } | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const solutionConfig = SOLUTIONS[solution]
  const clientName = engagement?.metadata?.client_name || clientId.charAt(0).toUpperCase() + clientId.slice(1)

  // Auth check
  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    const role = user.publicMetadata?.role as string
    if (role !== 'admin' && role !== 'investor') { router.push('/'); return }
    // Investors are scoped to their assigned clientId — prevent URL-param spoofing
    if (role === 'investor') {
      const assignedClient = user.publicMetadata?.clientId as string | undefined
      if (assignedClient && assignedClient !== clientId) { router.push('/'); return }
    }
  }, [isLoaded, user, router, clientId])

  const isReadOnly = false  // investors play Maestro role — full orchestration access
  const isInvestor = (user?.publicMetadata?.role as string) === 'investor'

  // Load engagement
  const loadEngagement = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/engage/${clientId}/${solution}?includeDraft=true`)
    if (res.status === 404) {
      setLoading(false)
      return
    }
    const data = await res.json()
    if (data.exists) {
      setEngagement(data.engagement)
      setPhases(data.phases || [])
      setWorkstreams(data.workstreams || [])
      setOutputs(data.outputs || [])
      setFindings(data.findings || [])
      setGenomeMatches(data.genomeMatches || [])
      setActivity(data.activity || [])

      // Set active phase to current_phase
      const currentPhase = data.phases?.find((p: any) => p.phase_number === data.engagement.current_phase)
      if (currentPhase) {
        setActivePhaseId(currentPhase.id)
        // Set first workstream of current phase as active
        const phaseWs = data.workstreams?.filter((w: any) => w.phase_id === currentPhase.id)
        if (phaseWs?.length > 0) setActiveWorkstreamId(phaseWs[0].id)
      }
    }
    setLoading(false)
  }, [clientId, solution])

  useEffect(() => {
    loadEngagement()
  }, [loadEngagement])

  // Auto-seed demo for investors landing on an empty workspace
  useEffect(() => {
    if (!isLoaded || !isInvestor || engagement || loading) return
    fetch(`/api/engage/${clientId}/${solution}/seed-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy: 'investor-view', fullDemo: true })
    }).then(() => loadEngagement())
  }, [isLoaded, isInvestor, engagement, loading, clientId, solution, loadEngagement])

  // Load engagement list for switcher
  const loadEngagementList = useCallback(async () => {
    const res = await fetch(`/api/engage/${clientId}/${solution}/list`)
    if (res.ok) {
      const data = await res.json()
      setEngagementList(data.engagements || [])
    }
  }, [clientId, solution])

  useEffect(() => {
    loadEngagementList()
  }, [loadEngagementList])

  const switchEngagement = async (engagementId: string) => {
    setSwitching(true)
    setSwitcherOpen(false)
    await fetch(`/api/engage/${clientId}/${solution}/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engagementId })
    })
    await loadEngagement()
    await loadEngagementList()
    setSwitching(false)
  }

  const startNewEngagement = async () => {
    if (!newEngagementName.trim()) return
    setStarting(true)
    setShowNewModal(false)
    const clientName = clientId === 'arcturus' ? 'Arcturus Financial Group' : 'Meridian Health System'
    await fetch('/api/engage/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId, clientName, solution,
        createdBy: user?.fullName || 'Anand Sundaram',
        engagementName: newEngagementName.trim()
      })
    })
    setNewEngagementName('')
    await loadEngagement()
    await loadEngagementList()
    setStarting(false)
  }

  const seedDemo = async () => {
    setSeedingDemo(true)
    setSwitcherOpen(false)
    await fetch(`/api/engage/${clientId}/${solution}/seed-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy: user?.fullName || 'Anand Sundaram' })
    })
    await loadEngagement()
    await loadEngagementList()
    setSeedingDemo(false)
  }

  const seedFullDemo = async () => {
    setSeedingFullDemo(true)
    setSwitcherOpen(false)
    const cName = clientId === 'arcturus' ? 'Arcturus Financial Group' : 'Meridian Health System'
    await fetch(`/api/engage/${clientId}/${solution}/seed-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createdBy: user?.fullName || 'Anand Sundaram',
        fullDemo: true,
        engagementName: `${cName} — Full Demo`
      })
    })
    await loadEngagement()
    await loadEngagementList()
    setSeedingFullDemo(false)
  }

  const adminUnlock = async (phaseId: string) => {
    setUnlocking(true)
    await fetch(`/api/engage/phase/${phaseId}/admin-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorName: user?.fullName || 'Anand Sundaram' })
    })
    setUnlockConfirm(null)
    await loadEngagement()
    await loadEngagementList()
    setUnlocking(false)
  }

  // Load opportunity map for margin solution
  useEffect(() => {
    if (solution !== 'margin') return
    fetch(`/api/engage/${clientId}/${solution}/opportunity-map`)
      .then(r => r.json())
      .then(data => { if (data.levers) setOpportunityLevers(data.levers) })
      .catch(() => {})
  }, [clientId, solution])

  // Load messages when workstream changes
  useEffect(() => {
    if (!activeWorkstreamId) return
    setMessagesLoading(true)
    fetch(`/api/engage/workstream/${activeWorkstreamId}/message`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages || [])
        setMessagesLoading(false)
      })
  }, [activeWorkstreamId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiStreamBuffer])

  const startEngagement = async () => {
    setStarting(true)
    const clientName = clientId === 'arcturus' ? 'Arcturus Financial Group' : 'Meridian Health System'
    const res = await fetch('/api/engage/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientName,
        solution,
        createdBy: user?.fullName || 'Anand Sundaram',
        engagementName: `${clientName} — Demo`
      })
    })
    if (res.ok) {
      await loadEngagement()
      await loadEngagementList()
    }
    setStarting(false)
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !activeWorkstreamId || sending) return
    const text = inputText
    setInputText('')
    setSending(true)
    setAiTyping(true)
    setAiStreamBuffer('')

    // Optimistically add user message
    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'maestro',
      actor_name: user?.fullName || 'Maestro',
      content: text,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])

    const res = await fetch(`/api/engage/workstream/${activeWorkstreamId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text,
        actorName: user?.fullName || 'Maestro',
        actorId: user?.id
      })
    })

    if (!res.ok || !res.body) {
      setSending(false)
      setAiTyping(false)
      return
    }

    // Stream AI response
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      setAiStreamBuffer(buffer)
    }

    // Add completed AI message
    const aiMsg = {
      id: 'ai-' + Date.now(),
      role: 'maestro_ai',
      actor_name: 'AbarVa AI',
      content: buffer,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, aiMsg])
    setAiStreamBuffer('')
    setAiTyping(false)
    setSending(false)
  }

  const approvePhase = async (phaseId: string) => {
    setApproving(true)
    await fetch(`/api/engage/phase/${phaseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approved',
        actorId: user?.id,
        actorName: user?.fullName || 'Maestro',
        actorRole: 'maestro'
      })
    })
    await loadEngagement()
    setApproving(false)
  }

  const generateOutput = async () => {
    if (!activePhaseId) return
    setGeneratingOutput(true)
    await fetch(`/api/engage/phase/${activePhaseId}/generate-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generatedBy: user?.fullName || 'Maestro' })
    })
    await loadEngagement()
    setGeneratingOutput(false)
  }

  const publishOutput = async (outputId: string) => {
    if (!activePhaseId) return
    setPublishing(true)
    await fetch(`/api/engage/phase/${activePhaseId}/publish-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outputId,
        publishedBy: user?.fullName || 'Maestro',
        publisherRole: 'admin'
      })
    })
    await loadEngagement()
    setPublishing(false)
  }

  const updateFinding = async (findingId: string, status: string, isPublished?: boolean) => {
    const body: any = { status, updatedBy: user?.fullName }
    if (isPublished !== undefined) body.isPublished = isPublished
    await fetch(`/api/engage/finding/${findingId}/comment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    await loadEngagement()
  }

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: '11px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Loading workspace...
        </div>
      </div>
    )
  }

  if (!solutionConfig) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, paddingTop: '64px' }}>
        <AbarvaNav />
        <div style={{ padding: '48px', color: T.muted, fontFamily: T.mono }}>Invalid solution: {solution}</div>
      </div>
    )
  }

  // No engagement yet
  if (!engagement) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg }}>
        <AbarvaNav />
        <div style={{ paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {solutionConfig.intelligence_name}
            </div>
            <h1 style={{ fontFamily: T.sans, fontSize: '28px', color: T.text, margin: '0 0 12px', fontWeight: 600 }}>
              {clientName} × {solutionConfig.name}
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: '14px', color: T.text, margin: '0 0 32px', lineHeight: 1.6 }}>
              No engagement found. Start a new engagement to begin Phase 0 readiness assessment.
            </p>
            <p style={{ fontFamily: T.mono, fontSize: '11px', color: T.muted, margin: '0 0 24px' }}>
              "{solutionConfig.cxo_question}"
            </p>
            <button
              onClick={startEngagement}
              disabled={starting}
              style={{
                background: T.teal, color: T.bg, border: 'none', borderRadius: '8px',
                padding: '12px 28px', fontFamily: T.mono, fontSize: '11px', fontWeight: 700,
                letterSpacing: '.08em', textTransform: 'uppercase', cursor: starting ? 'not-allowed' : 'pointer',
                opacity: starting ? 0.7 : 1
              }}
            >
              {starting ? 'Starting...' : 'Start Engagement'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activePhase = phases.find(p => p.id === activePhaseId)
  const activePhaseConfig = activePhase ? solutionConfig.phases[activePhase.phase_number as PhaseKey] : null
  const phaseWorkstreams = workstreams.filter(w => w.phase_id === activePhaseId)
  const phaseFindings = findings.filter(f => f.phase_id === activePhaseId)
  const phaseOutput = outputs.find(o => o.phase_id === activePhaseId)
  const phase0Output = outputs.find(o => {
    const ph = phases.find(p => p.id === o.phase_id)
    return ph?.phase_number === 0
  })

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <AbarvaNav />

      {/* Header bar */}
      <div style={{
        position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 90,
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: '0 24px', height: '44px', display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        {/* Back to Maestro */}
        <a href={`/maestro/${clientId}`} style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: T.teal,
          textDecoration: 'none', letterSpacing: '.08em', textTransform: 'uppercase',
          flexShrink: 0, opacity: 0.8,
        }}>← Maestro</a>
        <div style={{ width: '1px', height: '16px', background: T.border }} />

        {/* Intelligence name */}
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', flexShrink: 0 }}>
          {solutionConfig.intelligence_name}
        </div>

        {/* Phase badge — only when there is an active phase */}
        {activePhase && (
          <>
            <div style={{ width: '1px', height: '16px', background: T.border }} />
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '.1em',
              color: PHASE_STATUS_COLORS[activePhase.status] || T.muted,
              textTransform: 'uppercase', padding: '3px 10px',
              background: `${PHASE_STATUS_COLORS[activePhase.status]}12`,
              border: `1px solid ${PHASE_STATUS_COLORS[activePhase.status]}30`,
              borderRadius: '20px', flexShrink: 0,
            }}>
              Phase {activePhase.phase_number} · {PHASE_STATUS_LABELS[activePhase.status] || activePhase.status}
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Engagement Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            disabled={switching}
            style={{
              background: 'rgba(45,212,200,0.06)', border: `1px solid rgba(45,212,200,0.2)`,
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span style={{ fontFamily: T.sans, fontSize: '12px', color: T.teal, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {seedingFullDemo ? 'Loading full demo...' : seedingDemo ? 'Loading demo...' : switching ? 'Switching...' : (engagement?.engagement_name || 'Default')}
            </span>
            <span style={{ color: T.teal, fontSize: '9px' }}>▾</span>
          </button>

          {switcherOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: '10px', padding: '6px 0', zIndex: 300, minWidth: '260px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <div style={{ padding: '4px 14px 8px', fontFamily: T.mono, fontSize: '8px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Engagement slots
              </div>
              {engagementList.map(eng => (
                <button
                  key={eng.id}
                  onClick={() => eng.id !== engagement?.id && switchEngagement(eng.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 14px',
                    background: eng.is_active ? T.tealDim : 'transparent',
                    border: 'none', cursor: eng.id === engagement?.id ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: eng.is_active ? T.teal : T.muted }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sans, fontSize: '12px', color: eng.is_active ? T.teal : T.text, fontWeight: eng.is_active ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {eng.engagement_name || 'Unnamed'}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text2, marginTop: '1px' }}>
                      Phase {eng.current_phase} · {eng.status}
                    </div>
                  </div>
                  {eng.is_active && <span style={{ fontFamily: T.mono, fontSize: '8px', color: T.teal, textTransform: 'uppercase', letterSpacing: '.06em' }}>Active</span>}
                </button>
              ))}
              {!isReadOnly && (
                <>
                  <div style={{ borderTop: `1px solid ${T.border}`, margin: '4px 0' }} />
                  <button
                    onClick={() => { setSwitcherOpen(false); setShowNewModal(true) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 14px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ color: T.teal, fontSize: '14px', lineHeight: 1 }}>+</span>
                    <span style={{ fontFamily: T.sans, fontSize: '12px', color: T.teal }}>New engagement</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main layout: sidebar + content + right panel */}
      <div style={{ paddingTop: '104px', display: 'flex', minHeight: '100vh' }}>

        {/* Left sidebar (240px) */}
        <div style={{
          width: '240px', flexShrink: 0, borderRight: `1px solid ${T.border}`,
          padding: '20px 0', position: 'fixed', top: '104px', bottom: 0, overflowY: 'auto',
          background: T.bg
        }}>
          {/* Phase Navigator */}
          <div style={{ padding: '0 16px', marginBottom: '8px' }}>
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Phases
            </div>
            {phases.map(phase => {
              const pConfig = solutionConfig.phases[phase.phase_number as PhaseKey]
              const isActive = phase.id === activePhaseId
              const isLocked = phase.status === 'locked'
              const statusColor = PHASE_STATUS_COLORS[phase.status] || T.muted
              return (
                <button
                  key={phase.id}
                  onClick={() => {
                    if (!isLocked) {
                      setActivePhaseId(phase.id)
                      const phWs = workstreams.filter(w => w.phase_id === phase.id)
                      if (phWs.length > 0) setActiveWorkstreamId(phWs[0].id)
                    }
                  }}
                  style={{
                    width: '100%', textAlign: 'left', background: isActive ? T.tealDim : 'transparent',
                    border: isActive ? `1px solid ${T.tealBorder}` : '1px solid transparent',
                    borderRadius: '6px', padding: '10px 12px', marginBottom: '4px',
                    cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.4 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      fontFamily: T.mono, fontSize: '9px', color: statusColor,
                      letterSpacing: '.1em', textTransform: 'uppercase'
                    }}>
                      {phase.phase_number}
                    </div>
                    <div style={{ flex: 1, height: '1px', background: `${statusColor}30` }} />
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: statusColor
                    }} />
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: '12px', color: isActive ? T.teal : T.text, fontWeight: isActive ? 600 : 400 }}>
                    {pConfig.name}
                  </div>
                  {isLocked && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text2 }}>
                        {pConfig.unlock_condition}
                      </div>
                      {/* Admin bypass — visible only to admin */}
                      {(user?.publicMetadata?.role as string) === 'admin' && (
                        <div
                          onClick={e => { e.stopPropagation(); setUnlockConfirm({ phaseId: phase.id, phaseName: pConfig.name, phaseNum: phase.phase_number }) }}
                          style={{
                            marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontFamily: T.mono, fontSize: '9px', color: T.muted,
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: '4px', padding: '3px 8px', cursor: 'pointer',
                            letterSpacing: '.06em', textTransform: 'uppercase'
                          }}
                        >
                          ↑ Unlock
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Genome Matches */}
          {genomeMatches.length > 0 && (
            <div style={{ padding: '0 16px', marginTop: '16px' }}>
              <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Genome Patterns ({genomeMatches.length})
              </div>
              {genomeMatches.map(gm => (
                <div key={gm.id} style={{
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: '6px',
                  padding: '10px 12px', marginBottom: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: T.mono, fontSize: '10px', color: T.muted, fontWeight: 700 }}>{gm.pattern_code}</span>
                    <span style={{
                      fontFamily: T.mono, fontSize: '8px', letterSpacing: '.08em',
                      color: gm.confidence === 'confirmed' ? T.red : gm.confidence === 'probable' ? T.amber : T.text2,
                      textTransform: 'uppercase'
                    }}>{gm.confidence}</span>
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: '11px', color: T.text }}>{gm.pattern_name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.text2, marginTop: '4px' }}>
                    {Math.round(gm.failure_rate * 100)}% failure rate
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, marginLeft: '240px', marginRight: '340px' }}>

          {activePhase && activePhaseConfig ? (
            <>
              {/* Phase 0 — special view */}
              {activePhase.phase_number === 0 ? (
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: T.mono, fontSize: '10px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Phase 0 · Readiness Assessment
                    </div>
                    <h2 style={{ fontFamily: T.sans, fontSize: '22px', color: T.text, margin: '0 0 8px', fontWeight: 600 }}>
                      {clientName} Readiness Scorecard
                    </h2>
                  </div>

                  {phase0Output?.content && (
                    <Phase0Scorecard data={phase0Output.content} />
                  )}

                  {/* Margin Opportunity Map — shown after scorecard for margin solution */}
                  {solution === 'margin' && opportunityLevers.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <MarginOpportunityMap
                        clientId={clientId}
                        engagementId={engagement?.id || ''}
                        levers={opportunityLevers}
                        onUploadRequest={(leverId, dataRequired) => {
                          // Open a focused data request — future: trigger select-scope API
                          console.log('Upload request for', leverId, dataRequired)
                        }}
                        onNumbersEntry={(leverId) => {
                          console.log('Numbers entry for', leverId)
                        }}
                      />
                    </div>
                  )}

                  {/* Tech Track Selector — shown after Phase 0 scorecard */}
                  {solution === 'tech' && phase0Output?.content && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '24px'
                      }}>
                        <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                          Select Engagement Track
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                          {[
                            { id: 'core_system', label: 'Core System Modernization', desc: 'Replace, wrap, or optimise aging systems. Vendor scored against your data.' },
                            { id: 'erp', label: 'ERP Selection & SI Governance', desc: 'Product + SI scored by Genome. Governance model to prevent the 84% failure pattern.' },
                            { id: 'cloud_advisory', label: 'Cloud Architecture Advisory', desc: 'Blueprint design and SI governance. AbarVa does not build — we design and govern.' },
                            { id: 'all', label: 'All Three Tracks', desc: 'Comprehensive assessment across all three. Workstreams run in parallel.' },
                          ].map(track => (
                            <button
                              key={track.id}
                              onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                              style={{
                                background: selectedTrack === track.id ? T.tealDim : T.bg,
                                border: `1px solid ${selectedTrack === track.id ? T.teal : T.border}`,
                                borderRadius: '8px', padding: '14px', textAlign: 'left', cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontFamily: T.sans, fontSize: '13px', color: selectedTrack === track.id ? T.teal : T.text, fontWeight: 600, marginBottom: '4px' }}>
                                {track.label}
                              </div>
                              <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text, lineHeight: 1.5 }}>
                                {track.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedTrack && (
                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={async () => {
                                if (!engagement?.id) return
                                await fetch(`/api/engage/${clientId}/${solution}/select-scope`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ focus_areas: [selectedTrack], selectedBy: user?.fullName })
                                })
                              }}
                              style={{
                                background: T.teal, color: T.bg, border: 'none', borderRadius: '6px',
                                padding: '10px 24px', fontFamily: T.mono, fontSize: '11px', fontWeight: 700,
                                letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer'
                              }}
                            >
                              Confirm Track → Begin Phase 1
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phase 0 messages */}
                  {phaseWorkstreams.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Analysis Notes
                      </div>
                      {messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} />
                      ))}
                    </div>
                  )}

                  {/* Approve Phase 0 */}
                  {activePhase.status === 'in_progress' && phase0Output && (
                    <div style={{
                      marginTop: '32px', background: T.surface, border: `1px solid ${T.tealBorder}`,
                      borderRadius: '10px', padding: '20px'
                    }}>
                      <div style={{ fontFamily: T.sans, fontSize: '14px', color: T.text, marginBottom: '8px', fontWeight: 600 }}>
                        Ready to proceed to Phase 1?
                      </div>
                      <p style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, margin: '0 0 16px', lineHeight: 1.6 }}>
                        Review the readiness scorecard above. Approving Phase 0 will unlock Phase 1 —
                        {activePhaseConfig ? ` ${solutionConfig.phases[1].name}` : ''} — and pre-populate the default workstreams with opening prompts.
                      </p>
                      <button
                        onClick={isReadOnly ? undefined : () => approvePhase(activePhase.id)}
                        disabled={approving || isReadOnly}
                        style={{
                          background: isReadOnly ? T.border : T.teal,
                          color: isReadOnly ? T.muted : T.bg,
                          border: 'none', borderRadius: '8px',
                          padding: '10px 24px', fontFamily: T.mono, fontSize: '11px', fontWeight: 700,
                          letterSpacing: '.08em', textTransform: 'uppercase',
                          cursor: 'not-allowed', opacity: isReadOnly ? 0.45 : (approving ? 0.7 : 1)
                        }}
                      >
                        {approving ? 'Approving...' : 'Approve Phase 0 — Unlock Phase 1'}
                      </button>
                      {isReadOnly && (
                        <div style={{ marginTop: '6px', fontFamily: T.mono, fontSize: '9px', color: '#F59E0B', letterSpacing: '.08em' }}>
                          🔒 ADMIN ONLY
                        </div>
                      )}
                    </div>
                  )}

                  {activePhase.status === 'approved' && (
                    <div style={{
                      marginTop: '24px', background: T.greenDim, border: `1px solid ${T.green}30`,
                      borderRadius: '8px', padding: '12px 16px',
                      fontFamily: T.mono, fontSize: '11px', color: T.teal, letterSpacing: '.06em'
                    }}>
                      PHASE 0 APPROVED — Phase 1 is now active
                    </div>
                  )}
                </div>

              ) : (
                // Phases 1-4: Workstream conversation view
                <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

                  {/* Vendor Intelligence banner — Phase 2 × Tech only */}
                  {solution === 'tech' && activePhase?.phase_number === 2 && (
                    <div style={{
                      background: 'rgba(129,140,248,0.06)', borderBottom: `1px solid rgba(129,140,248,0.2)`,
                      padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexShrink: 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          Vendor Intelligence
                        </div>
                        <div style={{ fontFamily: T.sans, fontSize: '12px', color: T.text }}>
                          Score vendors against Genome track record — not analyst rankings
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {vendorIntelResult && (
                          <span style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            {vendorIntelResult.vendors?.length || 0} vendors scored
                          </span>
                        )}
                        <button
                          disabled={runningVendorIntel}
                          onClick={async () => {
                            setRunningVendorIntel(true)
                            const res = await fetch(`/api/engage/${clientId}/${solution}/vendor-intelligence`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ track: selectedTrack || 'core_system', engagementId: engagement?.id })
                            })
                            if (res.ok) setVendorIntelResult(await res.json())
                            setRunningVendorIntel(false)
                          }}
                          style={{
                            background: runningVendorIntel ? T.border : T.indigo,
                            color: runningVendorIntel ? T.muted : '#fff',
                            border: 'none', borderRadius: '6px', padding: '7px 16px',
                            fontFamily: T.mono, fontSize: '10px', fontWeight: 700,
                            letterSpacing: '.06em', textTransform: 'uppercase',
                            cursor: runningVendorIntel ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {runningVendorIntel ? 'Running...' : 'Run Vendor Intelligence'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Workstream tabs */}
                  <div style={{
                    display: 'flex', borderBottom: `1px solid ${T.border}`,
                    padding: '0 20px', overflowX: 'auto', flexShrink: 0
                  }}>
                    {phaseWorkstreams.map((ws, i) => (
                      <button
                        key={ws.id}
                        onClick={() => setActiveWorkstreamId(ws.id)}
                        style={{
                          background: 'transparent', border: 'none',
                          borderBottom: `2px solid ${ws.id === activeWorkstreamId ? T.teal : 'transparent'}`,
                          padding: '12px 16px', cursor: 'pointer',
                          fontFamily: T.sans, fontSize: '13px',
                          color: ws.id === activeWorkstreamId ? T.teal : T.text2,
                          fontWeight: ws.id === activeWorkstreamId ? 600 : 400,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {ws.name}
                      </button>
                    ))}
                  </div>

                  {/* Chat area */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '20px' }}>
                  <div style={{ flex: 1 }} />
                    {messagesLoading ? (
                      <div style={{ color: T.text2, fontFamily: T.mono, fontSize: '11px', textAlign: 'center', paddingTop: '40px' }}>
                        Loading...
                      </div>
                    ) : (
                      <>
                        {messages.map(msg => (
                          <MessageBubble key={msg.id} msg={msg} />
                        ))}
                        {aiTyping && aiStreamBuffer && (
                          <MessageBubble msg={{
                            id: 'streaming',
                            role: 'maestro_ai',
                            actor_name: 'AbarVa AI',
                            content: aiStreamBuffer,
                            created_at: new Date().toISOString()
                          }} streaming />
                        )}
                        {aiTyping && !aiStreamBuffer && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: T.tealDim, border: `1px solid ${T.tealBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ fontFamily: T.mono, fontSize: '8px', color: T.teal }}>AI</div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: T.teal, opacity: 0.5 }} />
                              ))}
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                  </div>

                  {/* Input area — greyed out for investor, functional for admin */}
                  <div style={{
                    borderTop: `1px solid ${T.border}`, padding: '16px 20px',
                    background: T.surface, flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', opacity: isReadOnly ? 0.35 : 1, pointerEvents: isReadOnly ? 'none' : 'auto' }}>
                      <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                        }}
                        placeholder={isReadOnly ? 'Investor view — messaging is admin only' : 'Message the AI analyst... (Enter to send, Shift+Enter for new line)'}
                        rows={2}
                        disabled={isReadOnly}
                        style={{
                          flex: 1, background: T.bg, border: `1px solid ${T.border}`,
                          borderRadius: '8px', padding: '10px 14px', resize: 'none',
                          fontFamily: T.sans, fontSize: '13px', color: T.text,
                          outline: 'none', lineHeight: 1.5
                        }}
                      />
                      <button
                        disabled={isReadOnly}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'transparent', border: `1px solid ${T.border}`,
                          borderRadius: '8px', padding: '10px 12px', cursor: isReadOnly ? 'not-allowed' : 'pointer',
                          color: T.text2, fontSize: '14px'
                        }}
                        title="Attach file"
                      >
                        ⊕
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!inputText.trim() || sending || isReadOnly}
                        style={{
                          background: inputText.trim() && !sending && !isReadOnly ? T.teal : T.border,
                          color: inputText.trim() && !sending && !isReadOnly ? T.bg : T.muted,
                          border: 'none', borderRadius: '8px', padding: '10px 18px',
                          fontFamily: T.mono, fontSize: '11px', fontWeight: 700,
                          letterSpacing: '.06em', textTransform: 'uppercase',
                          cursor: 'not-allowed'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: T.text2, fontFamily: T.mono, fontSize: '12px' }}>
              Select a phase to begin
            </div>
          )}
        </div>

        {/* Right panel (340px) */}
        <div style={{
          width: '340px', flexShrink: 0, borderLeft: `1px solid ${T.border}`,
          position: 'fixed', top: '104px', right: 0, bottom: 0, overflowY: 'auto',
          background: T.bg
        }}>
          {/* Right panel tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
            {(['findings', 'deliverables', 'output', 'activity'] as Panel[]).map(panel => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel)}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${rightPanel === panel ? T.teal : 'transparent'}`,
                  padding: '10px 4px', cursor: 'pointer',
                  fontFamily: T.mono, fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase',
                  color: rightPanel === panel ? T.teal : T.text2
                }}
              >
                {panel}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px' }}>
            {rightPanel === 'findings' && (
              <FindingsPanel
                findings={phaseFindings}
                onUpdate={updateFinding}
              />
            )}
            {rightPanel === 'deliverables' && (
              <DeliverablesPanel
                phase={activePhase}
                workstreams={workstreams}
                phaseOutput={phaseOutput}
                solutionConfig={solutionConfig}
              />
            )}
            {rightPanel === 'output' && (
              <OutputPanel
                phase={activePhase}
                phaseOutput={phaseOutput}
                generatingOutput={generatingOutput}
                publishing={publishing}
                onGenerate={generateOutput}
                onPublish={publishOutput}
                isReadOnly={isReadOnly}
              />
            )}
            {rightPanel === 'activity' && (
              <ActivityPanel activity={activity} />
            )}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={async e => {
        const file = e.target.files?.[0]
        if (!file || !activePhaseId) return
        const fd = new FormData()
        fd.append('file', file)
        fd.append('uploadedBy', user?.fullName || 'Maestro')
        fd.append('uploadedByRole', 'admin')
        if (activeWorkstreamId) fd.append('workstreamId', activeWorkstreamId)
        await fetch(`/api/engage/phase/${activePhaseId}/upload`, { method: 'POST', body: fd })
        await loadEngagement()
      }} />

      {/* Admin Unlock Confirmation Modal */}
      {unlockConfirm && (
        <div
          onClick={() => !unlocking && setUnlockConfirm(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.85)',
            backdropFilter: 'blur(4px)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.surface, border: `1px solid rgba(245,158,11,0.3)`,
              borderRadius: '14px', padding: '32px', width: '400px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Admin Override
            </div>
            <div style={{ fontFamily: T.sans, fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>
              Unlock Phase {unlockConfirm.phaseNum}?
            </div>
            <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, marginBottom: '6px' }}>
              <strong>{unlockConfirm.phaseName}</strong>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text2, marginBottom: '28px', lineHeight: 1.6 }}>
              This bypasses the stage gate for <strong style={{ color: T.text }}>{clientName}</strong>. The override will be logged in the activity feed with your name and timestamp.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUnlockConfirm(null)}
                disabled={unlocking}
                style={{
                  padding: '9px 18px', borderRadius: '7px', cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${T.border}`,
                  fontFamily: T.sans, fontSize: '13px', color: T.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => adminUnlock(unlockConfirm.phaseId)}
                disabled={unlocking}
                style={{
                  padding: '9px 20px', borderRadius: '7px',
                  cursor: unlocking ? 'not-allowed' : 'pointer',
                  background: T.amber, border: 'none',
                  fontFamily: T.sans, fontSize: '13px', color: '#0C0C0C', fontWeight: 700,
                  opacity: unlocking ? 0.7 : 1
                }}
              >
                {unlocking ? 'Unlocking...' : 'Unlock Phase ↑'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Engagement Modal */}
      {showNewModal && (
        <div
          onClick={() => setShowNewModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.85)',
            backdropFilter: 'blur(4px)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: '14px', padding: '32px', width: '420px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Engagement Slots
            </div>
            <div style={{ fontFamily: T.sans, fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>
              New Engagement
            </div>
            <div style={{ fontFamily: T.sans, fontSize: '13px', color: T.text, marginBottom: '24px', lineHeight: 1.6 }}>
              Creates a fresh {solutionConfig?.name || solution} engagement for {clientId}. The current active engagement is preserved and can be switched back at any time.
            </div>

            <label style={{ fontFamily: T.mono, fontSize: '9px', color: T.teal, letterSpacing: '.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Engagement Name
            </label>
            <input
              autoFocus
              value={newEngagementName}
              onChange={e => setNewEngagementName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newEngagementName.trim()) startNewEngagement() }}
              placeholder={`e.g. ${clientId === 'arcturus' ? 'Arcturus' : 'Meridian'} — Q3 Demo`}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px',
                padding: '10px 14px', fontFamily: T.sans, fontSize: '13px', color: T.text,
                outline: 'none', marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  padding: '9px 18px', borderRadius: '7px', cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${T.border}`,
                  fontFamily: T.sans, fontSize: '13px', color: T.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={startNewEngagement}
                disabled={!newEngagementName.trim()}
                style={{
                  padding: '9px 20px', borderRadius: '7px', cursor: newEngagementName.trim() ? 'pointer' : 'not-allowed',
                  background: newEngagementName.trim() ? T.teal : 'rgba(45,212,200,0.15)',
                  border: 'none', fontFamily: T.sans, fontSize: '13px',
                  color: newEngagementName.trim() ? '#0C0C0C' : T.teal, fontWeight: 600
                }}
              >
                Start Engagement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, streaming }: { msg: any; streaming?: boolean }) {
  const isAI = msg.role === 'maestro_ai'
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: isAI ? 'rgba(45,212,200,0.10)' : 'rgba(129,140,248,0.10)',
        border: `1px solid ${isAI ? 'rgba(45,212,200,0.25)' : 'rgba(129,140,248,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '2px'
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: isAI ? '#2DD4C8' : '#818CF8' }}>
          {isAI ? 'AI' : 'M'}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: isAI ? '#2DD4C8' : '#818CF8', fontWeight: 600 }}>
            {msg.actor_name}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#888888' }}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {streaming && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', animation: 'pulse 1s infinite' }}>●</span>
          )}
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#0C0C0C',
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
          background: isAI ? 'rgba(45,212,200,0.04)' : 'transparent',
          border: isAI ? '1px solid rgba(45,212,200,0.10)' : 'none',
          borderRadius: '8px', padding: isAI ? '12px' : '0'
        }}>
          {formatMessageContent(msg.content)}
        </div>
      </div>
    </div>
  )
}

function formatMessageContent(content: string) {
  // Parse bold **text** and citations [ARC-D01]
  return content
    .split(/(\*\*[^*]+\*\*|\[[A-Z0-9-]+\])/g)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0C0C0C', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      }
      if (/^\[[A-Z0-9-]+\]$/.test(part)) {
        return <span key={i} style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#2DD4C8',
          background: 'rgba(45,212,200,0.10)', border: '1px solid rgba(45,212,200,0.25)',
          borderRadius: '3px', padding: '1px 5px'
        }}>{part}</span>
      }
      return part
    })
}

function Phase0Scorecard({ data }: { data: any }) {
  if (!data) return null
  const score = data.overall_score ?? data.scorecard?.overall
  const verdict = data.overall_verdict ?? data.scorecard?.readiness
  const summary = data.verdict_summary ?? data.scorecard?.summary
  const scoreColor = score >= 70 ? '#34D399' : score >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div>
      {/* Overall score */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E1DC', borderRadius: '12px',
        padding: '24px', marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '48px', color: scoreColor, fontWeight: 700, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '4px' }}>
              / 100
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
              color: scoreColor, letterSpacing: '.1em', textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              {verdict?.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#0C0C0C', lineHeight: 1.6, maxWidth: '400px' }}>
              {summary}
            </div>
          </div>
        </div>
      </div>

      {/* Dimension scores — old schema */}
      {data.dimension_scores && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Dimension Scores
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(data.dimension_scores).map(([dim, d]: [string, any]) => {
              const c = d.score >= 70 ? '#34D399' : d.score >= 40 ? '#F59E0B' : '#EF4444'
              return (
                <div key={dim} style={{ background: '#FFFFFF', border: '1px solid #E2E1DC', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#0C0C0C' }}>
                      {dim.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: c, fontWeight: 700 }}>
                      {d.score}
                    </div>
                  </div>
                  <div style={{ height: '3px', background: '#E2E1DC', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.score}%`, background: c, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#3C3C3C', marginTop: '6px', lineHeight: 1.5 }}>
                    {d.evidence}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dimension scores — new schema (scorecard.dimensions array) */}
      {!data.dimension_scores && data.scorecard?.dimensions && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Dimension Scores
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {data.scorecard.dimensions.map((dim: any) => {
              const c = dim.score >= 70 ? '#34D399' : dim.score >= 40 ? '#F59E0B' : '#EF4444'
              return (
                <div key={dim.id} style={{ background: '#FFFFFF', border: '1px solid #E2E1DC', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#0C0C0C' }}>{dim.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: c, fontWeight: 700 }}>{dim.score}</div>
                  </div>
                  <div style={{ height: '3px', background: '#E2E1DC', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${dim.score}%`, background: c, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#3C3C3C', marginTop: '6px', lineHeight: 1.5 }}>
                    {dim.detail}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top findings */}
      {data.top_findings && (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Key Findings
          </div>
          {data.top_findings.map((f: any, i: number) => {
            const colors: Record<string, string> = { critical: '#EF4444', high: '#F59E0B', medium: '#F59E0B', positive: '#34D399' }
            const c = colors[f.severity] || '#3C3C3C'
            return (
              <div key={i} style={{
                background: '#FFFFFF', border: `1px solid ${c}30`,
                borderLeft: `3px solid ${c}`, borderRadius: '8px',
                padding: '12px 16px', marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#0C0C0C', marginBottom: '4px', fontWeight: 600 }}>
                      {f.title}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#3C3C3C', lineHeight: 1.5 }}>
                      {f.description}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '9px',
                        color: c, background: `${c}15`, border: `1px solid ${c}30`,
                        borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '.06em'
                      }}>{f.severity}</span>
                      {f.genome_pattern && (
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '9px',
                          color: '#EF4444', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                          borderRadius: '3px', padding: '2px 6px'
                        }}>{f.genome_pattern}</span>
                      )}
                      {f.source_files?.map((sf: string) => (
                        <span key={sf} style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '9px',
                          color: '#2DD4C8', background: 'rgba(45,212,200,0.08)', border: '1px solid rgba(45,212,200,0.20)',
                          borderRadius: '3px', padding: '2px 6px'
                        }}>{sf}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FindingsPanel({ findings, onUpdate }: { findings: any[]; onUpdate: (id: string, status: string, isPublished?: boolean) => void }) {
  if (findings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#3C3C3C', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
        No findings yet.<br />AI will surface findings as the conversation progresses.
      </div>
    )
  }
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        Findings ({findings.length})
      </div>
      {findings.map(f => {
        const colors: Record<string, string> = { critical: '#EF4444', high: '#F59E0B', medium: '#F59E0B', low: '#34D399', positive: '#34D399' }
        const c = colors[f.severity] || '#3C3C3C'
        return (
          <div key={f.id} style={{
            background: '#FFFFFF', border: `1px solid ${c}20`,
            borderLeft: `3px solid ${c}`, borderRadius: '8px',
            padding: '12px', marginBottom: '8px'
          }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#0C0C0C', marginBottom: '6px', fontWeight: 600, lineHeight: 1.4 }}>
              {f.title}
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#3C3C3C', marginBottom: '8px', lineHeight: 1.5 }}>
              {f.description?.slice(0, 120)}{f.description?.length > 120 ? '...' : ''}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '8px',
                color: c, background: `${c}15`, borderRadius: '3px', padding: '2px 5px', textTransform: 'uppercase'
              }}>{f.severity}</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '8px',
                color: f.status === 'confirmed' ? '#34D399' : f.status === 'disputed' ? '#EF4444' : '#475569',
                background: f.status === 'confirmed' ? 'rgba(52,211,153,0.10)' : f.status === 'disputed' ? 'rgba(239,68,68,0.10)' : 'rgba(71,85,105,0.10)',
                borderRadius: '3px', padding: '2px 5px', textTransform: 'uppercase'
              }}>{f.status}</span>
              {f.is_published && (
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '8px',
                  color: '#818CF8', background: 'rgba(129,140,248,0.10)', borderRadius: '3px', padding: '2px 5px'
                }}>PUBLISHED</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {f.status !== 'confirmed' && (
                <button onClick={() => onUpdate(f.id, 'confirmed')} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#34D399',
                  background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: '4px', padding: '3px 8px', cursor: 'pointer'
                }}>Confirm</button>
              )}
              {f.status !== 'disputed' && (
                <button onClick={() => onUpdate(f.id, 'disputed')} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#EF4444',
                  background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '4px', padding: '3px 8px', cursor: 'pointer'
                }}>Dispute</button>
              )}
              {!f.is_published && f.status === 'confirmed' && (
                <button onClick={() => onUpdate(f.id, 'confirmed', true)} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#818CF8',
                  background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.25)',
                  borderRadius: '4px', padding: '3px 8px', cursor: 'pointer'
                }}>Publish</button>
              )}
              <button onClick={() => onUpdate(f.id, 'removed')} style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#3C3C3C',
                background: 'transparent', border: '1px solid #E2E1DC',
                borderRadius: '4px', padding: '3px 8px', cursor: 'pointer'
              }}>Remove</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OutputPanel({ phase, phaseOutput, generatingOutput, publishing, onGenerate, onPublish, isReadOnly }: {
  phase: any; phaseOutput: any; generatingOutput: boolean; publishing: boolean;
  onGenerate: () => void; onPublish: (id: string) => void; isReadOnly?: boolean
}) {
  if (!phase) return null
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Output Document
      </div>

      {!phaseOutput ? (
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#0C0C0C', marginBottom: '16px', lineHeight: 1.6 }}>
            Generate the phase output document once workstream conversations are complete.
            The AI will synthesise all workstream discussions into a structured deliverable.
          </div>
          <button
            onClick={isReadOnly ? undefined : onGenerate}
            disabled={generatingOutput || isReadOnly}
            style={{
              width: '100%', background: (generatingOutput || isReadOnly) ? '#E2E1DC' : '#2DD4C8',
              color: (generatingOutput || isReadOnly) ? '#3C3C3C' : '#0C0C0C',
              border: 'none', borderRadius: '8px', padding: '12px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700,
              letterSpacing: '.08em', textTransform: 'uppercase',
              cursor: 'not-allowed', opacity: isReadOnly ? 0.45 : 1
            }}
          >
            {generatingOutput ? 'Generating...' : 'Generate Draft Output'}
          </button>
          {isReadOnly && <div style={{ marginTop: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#F59E0B', letterSpacing: '.08em' }}>🔒 ADMIN ONLY</div>}
        </div>
      ) : (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E1DC', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#0C0C0C', fontWeight: 600, marginBottom: '4px' }}>
              {phaseOutput.title}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              V{phaseOutput.version} · {phaseOutput.status?.toUpperCase()} · {new Date(phaseOutput.created_at).toLocaleDateString()}
            </div>

            {/* CXO-ready rendered output */}
            <OutputRenderer
              outputType={phaseOutput.output_type}
              content={phaseOutput.content}
              approvedBy={phaseOutput.approved_by}
              approvedAt={phaseOutput.approved_at}
            />

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#888888' }}>
              {JSON.stringify(phaseOutput.content).length.toLocaleString()} chars of structured content
            </div>
          </div>

          {phaseOutput.status !== 'published' && phaseOutput.status !== 'approved' && (
            <>
            <button
              onClick={isReadOnly ? undefined : () => onPublish(phaseOutput.id)}
              disabled={publishing || isReadOnly}
              style={{
                width: '100%', background: (publishing || isReadOnly) ? '#E2E1DC' : '#818CF8',
                color: (publishing || isReadOnly) ? '#3C3C3C' : '#0C0C0C',
                border: 'none', borderRadius: '8px', padding: '12px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700,
                letterSpacing: '.08em', textTransform: 'uppercase',
                cursor: 'not-allowed', marginBottom: '4px', opacity: isReadOnly ? 0.45 : 1
              }}
            >
              {publishing ? 'Publishing...' : 'Publish to Client'}
            </button>
            {isReadOnly && <div style={{ marginTop: '2px', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#F59E0B', letterSpacing: '.08em' }}>🔒 ADMIN ONLY</div>}
            </>
          )}

          {phaseOutput.status === 'published' && (
            <div style={{
              background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.25)',
              borderRadius: '8px', padding: '12px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#818CF8',
              textAlign: 'center', marginBottom: '8px'
            }}>
              PUBLISHED TO CLIENT
            </div>
          )}

          {phaseOutput.status === 'approved' && (
            <div style={{
              background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: '8px', padding: '12px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#34D399',
              textAlign: 'center', marginBottom: '8px'
            }}>
              APPROVED BY CLIENT
            </div>
          )}

          <button
            onClick={onGenerate}
            disabled={generatingOutput}
            style={{
              width: '100%', background: 'transparent',
              color: generatingOutput ? '#3C3C3C' : '#0C0C0C',
              border: '1px solid #E2E1DC', borderRadius: '8px', padding: '10px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
              letterSpacing: '.06em', textTransform: 'uppercase',
              cursor: generatingOutput ? 'not-allowed' : 'pointer'
            }}
          >
            {generatingOutput ? 'Generating...' : 'Regenerate Draft'}
          </button>
        </div>
      )}
    </div>
  )
}

function DeliverablesPanel({ phase, workstreams, phaseOutput, solutionConfig }: {
  phase: any; workstreams: any[]; phaseOutput: any; solutionConfig: any
}) {
  if (!phase) return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#3C3C3C', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
      Select a phase to view deliverables.
    </div>
  )

  const phaseNum = phase.phase_number as number
  const phaseConfig = solutionConfig?.phases?.[phaseNum]
  const defaultWorkstreams: { name: string; description: string }[] = phaseConfig?.default_workstreams || []
  const isComplete = phase.status === 'complete' || phase.status === 'approved'
  const outputApproved = phaseOutput?.status === 'approved' || phaseOutput?.status === 'published'

  // Build deliverable list: each workstream is a deliverable, plus the phase output as master
  const deliverables = defaultWorkstreams.map((dws, i) => {
    const dbWs = workstreams.find((w: any) => w.name === dws.name || w.order_index === i)
    const hasMessages = dbWs // simplified — if workstream exists, it's been touched
    const status: 'signed_off' | 'ready' | 'in_progress' = isComplete ? 'signed_off' : hasMessages ? 'in_progress' : 'in_progress'
    return { name: dws.name, status, workstream: dbWs }
  })

  const statusBadge = (status: string) => {
    if (status === 'signed_off') return {
      label: '✓ SIGNED OFF', bg: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)'
    }
    if (status === 'ready') return {
      label: 'READY FOR REVIEW', bg: 'rgba(45,212,200,0.12)', color: '#2DD4C8', border: '1px solid rgba(45,212,200,0.25)'
    }
    return {
      label: 'IN PROGRESS', bg: 'rgba(17,24,39,0.06)', color: '#3C3C3C', border: '1px solid rgba(17,24,39,0.15)'
    }
  }

  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        Deliverables — Phase {phaseNum}
      </div>

      {deliverables.length === 0 && (
        <div style={{ fontSize: '12px', color: '#3C3C3C', lineHeight: 1.6 }}>
          No deliverables configured for this phase.
        </div>
      )}

      {deliverables.map((d, i) => {
        const badge = statusBadge(d.status)
        return (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid rgba(45,212,200,0.20)',
            borderRadius: '8px', padding: '14px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: '#0C0C0C', fontWeight: 600, lineHeight: 1.4 }}>
                {d.name}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', letterSpacing: '.08em',
                background: badge.bg, color: badge.color, border: badge.border,
                borderRadius: '4px', padding: '3px 7px', flexShrink: 0,
              }}>
                {badge.label}
              </div>
            </div>
            {d.status === 'signed_off' && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#888888', marginTop: '6px' }}>
                Anand Sundaram · {new Date(phase.approved_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        )
      })}

      {/* Master Output card */}
      {(phaseOutput || deliverables.length > 0) && (
        <div style={{
          background: '#FFFFFF', border: `1px solid ${outputApproved ? 'rgba(45,212,200,0.35)' : 'rgba(45,212,200,0.20)'}`,
          borderLeft: '3px solid #2DD4C8', borderRadius: '8px', padding: '14px', marginTop: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', color: '#0C0C0C', fontWeight: 600 }}>
              {phaseConfig?.name || `Phase ${phaseNum}`} Output
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#2DD4C8', background: 'rgba(45,212,200,0.10)', border: '1px solid rgba(45,212,200,0.20)', borderRadius: '3px', padding: '2px 6px' }}>
              MASTER OUTPUT
            </div>
          </div>
          {!phaseOutput && (
            <div style={{ fontSize: '12px', color: '#3C3C3C' }}>
              Generated after workstreams complete
            </div>
          )}
          {phaseOutput && !outputApproved && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8' }}>
              {phaseOutput.status?.toUpperCase()} · Awaiting CXO approval
            </div>
          )}
          {outputApproved && (
            <a href="#output" onClick={e => { e.preventDefault() }} style={{
              display: 'block', marginTop: '8px',
              background: '#2DD4C8', color: '#0C0C0C', borderRadius: '6px',
              padding: '8px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif', textAlign: 'center',
            }}>
              Ready for CXO Approval →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function ActivityPanel({ activity }: { activity: any[] }) {
  if (activity.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#3C3C3C', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
        No activity yet.
      </div>
    )
  }
  const actionColors: Record<string, string> = {
    engagement_started: '#2DD4C8',
    phase_unlocked: '#34D399',
    phase_approved: '#34D399',
    output_published: '#818CF8',
    output_disputed: '#EF4444',
    file_uploaded: '#F59E0B',
    message_sent: '#475569',
    output_generated: '#2DD4C8',
  }
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2DD4C8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        Activity Log
      </div>
      {activity.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: actionColors[a.action] || '#475569', marginTop: '5px'
          }} />
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#0C0C0C', lineHeight: 1.4 }}>
              {a.description}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#888888', marginTop: '2px' }}>
              {a.actor_name} · {new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
