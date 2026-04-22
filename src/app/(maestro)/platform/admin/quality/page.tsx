'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { calculateConfidence } from '@/lib/confidence'

const S = {
  page: { minHeight: '100vh', background: '#F8F7F4', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#111827' } as CSSProperties,
  shell: { maxWidth: '1480px', margin: '0 auto', padding: '32px 40px 64px' } as CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E8E6E3', borderRadius: '16px', boxShadow: '0 18px 38px rgba(15,23,42,0.04)' } as CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.12em' } as CSSProperties,
}

const LINKS = [
  { href: '/platform/admin', label: 'Engagement Hub' },
  { href: '/platform/admin/data', label: 'Data Loader' },
  { href: '/platform/admin/quality', label: 'Quality Ops', active: true },
  { href: '/platform/admin/approvals', label: 'Approvals' },
  { href: '/platform/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/platform/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/platform/admin/context', label: 'Business Context' },
]

type TenantKey = 'meridian' | 'firstcapital' | 'apexretail' | 'keystone'
type Pillar = 'data' | 'evidence' | 'intelligence' | 'knowledge'
type Severity = 'critical' | 'high' | 'medium'
type Readiness = 'Exploratory' | 'Decision-support' | 'Board-ready' | 'Settlement-ready'
type BacklogTrack = 'intelligence' | 'chat' | 'design' | 'admin'
type BacklogStatus = 'done' | 'in_progress' | 'queued' | 'blocked'

type TenantSeed = {
  key: TenantKey
  label: string
  shortLabel: string
  orgId?: string
  queryCategory?: string
  baseData: number
  baseEvidence: number
  baseIntelligence: number
  baseKnowledge: number
  notes: string[]
}

type QualityAction = {
  id: string
  tenant: TenantKey
  pillar: Pillar
  severity: Severity
  title: string
  detail: string
  delta: number
  owner: string
  cta: string
}

type BacklogItem = {
  id: string
  track: BacklogTrack
  surface: string
  title: string
  status: BacklogStatus
  progress: number
  counter: string
  outcome: string
  nextStep: string
}

const confidenceMeridian = calculateConfidence('meridian', 'clinical')
const confidenceFirstCapital = calculateConfidence('firstcapital', 'vendor')
const confidenceApex = calculateConfidence('apexretail', 'ai_investment')

const TENANTS: TenantSeed[] = [
  {
    key: 'meridian',
    label: 'Meridian Health System',
    shortLabel: 'Meridian',
    orgId: 'meridian',
    queryCategory: 'clinical',
    baseData: confidenceMeridian.score,
    baseEvidence: 71,
    baseIntelligence: 74,
    baseKnowledge: 68,
    notes: [
      'Strong data coverage, but evidence refs are inconsistent across generated intelligence.',
      'Cross-source synthesis is useful, yet 2 executive contradictions remain unresolved.',
    ],
  },
  {
    key: 'firstcapital',
    label: 'First Capital Financial',
    shortLabel: 'First Capital',
    orgId: 'firstcapital',
    queryCategory: 'vendor',
    baseData: confidenceFirstCapital.score,
    baseEvidence: 66,
    baseIntelligence: 69,
    baseKnowledge: 61,
    notes: [
      'Vendor and regulatory data are present, but several scorecards still lack source-of-record links.',
      'Pattern confidence is improving, but promotion discipline is still thin.',
    ],
  },
  {
    key: 'apexretail',
    label: 'Apex Retail Group',
    shortLabel: 'Apex',
    orgId: 'apexretail',
    queryCategory: 'ai_investment',
    baseData: confidenceApex.score,
    baseEvidence: 63,
    baseIntelligence: 72,
    baseKnowledge: 64,
    notes: [
      'Commercial and IT data are strong enough for direction, but customer journey evidence is patchy.',
      'Intervention suggestions outrun evidence depth in a few places.',
    ],
  },
  {
    key: 'keystone',
    label: 'Keystone Energy Holdings',
    shortLabel: 'Keystone',
    baseData: 58,
    baseEvidence: 54,
    baseIntelligence: 57,
    baseKnowledge: 49,
    notes: [
      'Still below decision-support. Too much of the corpus is thin, stale, or ownerless.',
      'This tenant should be treated as exploratory until provenance and baseline gaps are closed.',
    ],
  },
]

const QUALITY_ACTIONS: QualityAction[] = [
  {
    id: 'm-evidence-claims',
    tenant: 'meridian',
    pillar: 'evidence',
    severity: 'critical',
    title: 'Attach source-of-record refs to 12 ungrounded claims',
    detail: 'Current intelligence packets still contain 12 claims without direct Evidence Ledger anchors.',
    delta: 8,
    owner: 'Steward',
    cta: 'Open Evidence Ledger gaps',
  },
  {
    id: 'm-contradictions',
    tenant: 'meridian',
    pillar: 'intelligence',
    severity: 'high',
    title: 'Resolve 2 open executive contradictions',
    detail: 'Finance and operations disagree on prior-auth accountability; CMO and CIO disagree on deployment readiness.',
    delta: 6,
    owner: 'Sentinel',
    cta: 'Review contradiction log',
  },
  {
    id: 'm-promotion',
    tenant: 'meridian',
    pillar: 'knowledge',
    severity: 'medium',
    title: 'Complete anonymization review for 3 emergent pattern packages',
    detail: 'Signals are strong enough to promote, but legal anonymization sign-off is still missing.',
    delta: 5,
    owner: 'Steward',
    cta: 'Advance promotion package',
  },
  {
    id: 'fc-provenance',
    tenant: 'firstcapital',
    pillar: 'evidence',
    severity: 'high',
    title: 'Backfill provenance on 7 vendor scorecards',
    detail: 'Performance scorecards are being cited in strategy output without a documented system owner and export timestamp.',
    delta: 7,
    owner: 'Steward',
    cta: 'Request source metadata',
  },
  {
    id: 'fc-regulatory-freshness',
    tenant: 'firstcapital',
    pillar: 'data',
    severity: 'medium',
    title: 'Replace stale regulatory pack with Q2 exports',
    detail: 'Current MAS and FCA materials are old enough to weaken readiness for live board discussion.',
    delta: 5,
    owner: 'Nexus',
    cta: 'Upload fresh regulatory artifacts',
  },
  {
    id: 'fc-pattern-threshold',
    tenant: 'firstcapital',
    pillar: 'knowledge',
    severity: 'medium',
    title: 'Raise 2 candidate patterns above promotion threshold',
    detail: 'Signals exist, but the n-count and intervention history are still too thin for canonical promotion.',
    delta: 4,
    owner: 'Sentinel',
    cta: 'Inspect candidate pattern set',
  },
  {
    id: 'a-customer-evidence',
    tenant: 'apexretail',
    pillar: 'data',
    severity: 'high',
    title: 'Load missing customer journey exports',
    detail: 'Drop-off and retention claims are directionally right, but the customer event layer is incomplete.',
    delta: 6,
    owner: 'Nexus',
    cta: 'Request customer data upload',
  },
  {
    id: 'a-intervention-grounding',
    tenant: 'apexretail',
    pillar: 'intelligence',
    severity: 'high',
    title: 'Downgrade or ground 9 intervention recommendations',
    detail: 'Some recommendations are good ideas but not yet justified by the current evidence base.',
    delta: 7,
    owner: 'Sentinel',
    cta: 'Review recommendation quality',
  },
  {
    id: 'a-anonymization',
    tenant: 'apexretail',
    pillar: 'knowledge',
    severity: 'medium',
    title: 'Clear anonymization review on 2 cross-tenant retail signals',
    detail: 'The signals are valuable but cannot enter the reusable layer until contribution packaging is complete.',
    delta: 4,
    owner: 'Steward',
    cta: 'Open anonymization queue',
  },
  {
    id: 'k-baseline',
    tenant: 'keystone',
    pillar: 'evidence',
    severity: 'critical',
    title: 'Lock an outcome baseline before more strategy output is generated',
    detail: 'No locked baseline means no credible attribution path, which drags both evidence and readiness.',
    delta: 9,
    owner: 'Nexus',
    cta: 'Create baseline package',
  },
  {
    id: 'k-ownerless-observations',
    tenant: 'keystone',
    pillar: 'data',
    severity: 'high',
    title: 'Assign owners to 14 ownerless observations',
    detail: 'The corpus contains claims and notes with no accountable human owner or system source.',
    delta: 6,
    owner: 'Steward',
    cta: 'Assign source owners',
  },
  {
    id: 'k-pattern-synthesis',
    tenant: 'keystone',
    pillar: 'intelligence',
    severity: 'medium',
    title: 'Add cross-source support for 3 high-importance claims',
    detail: 'Current briefs rely too heavily on interview notes and need KPI or system corroboration.',
    delta: 5,
    owner: 'Atlas',
    cta: 'Open claim support review',
  },
  {
    id: 'k-promotion-discipline',
    tenant: 'keystone',
    pillar: 'knowledge',
    severity: 'medium',
    title: 'Stop promoting low-confidence signals into reusable memory',
    detail: 'Keystone has candidate signals being treated too optimistically for their actual support level.',
    delta: 6,
    owner: 'Sentinel',
    cta: 'Tighten promotion thresholds',
  },
]

const BACKLOG_ITEMS: BacklogItem[] = [
  {
    id: 'intel-auth',
    track: 'intelligence',
    surface: 'Intelligence · Atlas · tenancy',
    title: 'Close demo-user auth and client-resolution leaks',
    status: 'done',
    progress: 100,
    counter: '2 merged fixes / 2 deployed',
    outcome: 'Signed-in Clerk demo users can resolve tenant context without the old no-client dead end.',
    nextStep: 'Smoke-test the live app with Meridian and First Capital demo users.',
  },
  {
    id: 'chat-inputs',
    track: 'chat',
    surface: 'All chat composers',
    title: 'Replace single-line inputs with multiline autosizing composer',
    status: 'done',
    progress: 100,
    counter: '6 chat surfaces / 6 upgraded',
    outcome: 'Composers now wrap, support Shift+Enter, and enable spellcheck/autocorrect across agent surfaces.',
    nextStep: 'Keep an eye on any remaining hardcoded input fields outside the shared composer.',
  },
  {
    id: 'admin-nav',
    track: 'admin',
    surface: 'Top navigation · admin access',
    title: 'Restore direct Admin navigation and demo-admin fallback',
    status: 'done',
    progress: 100,
    counter: '1 route fix / 1 deployed',
    outcome: 'Admin now routes to /platform/admin instead of dropping users back on the generic platform page.',
    nextStep: 'Verify the live deploy with the two known demo-admin accounts.',
  },
  {
    id: 'warm-ui-rollout',
    track: 'design',
    surface: 'Programs · Tower · Platform hero',
    title: 'Roll out the warm editorial UI system to operational pages',
    status: 'in_progress',
    progress: 62,
    counter: '3 major surfaces / 5 redesigned',
    outcome: 'The design language is live on several priority pages, but page-to-page consistency is still incomplete.',
    nextStep: 'Apply the same light-canvas grammar to Intelligence, Data, Investor, and remaining admin surfaces.',
  },
  {
    id: 'phase-chat',
    track: 'chat',
    surface: 'Program chat · phase transitions',
    title: 'Reset program chat by phase and preserve prior-phase summary in the rail',
    status: 'in_progress',
    progress: 72,
    counter: '3 interaction fixes / 4 shipped',
    outcome: 'Phase handoff logic and right-rail summaries are in code, but the end-to-end live UX still needs smoke-testing.',
    nextStep: 'Confirm Phase 0 approval cleanly opens a fresh Phase 1 thread in the deployed app.',
  },
  {
    id: 'intel-left-rail',
    track: 'intelligence',
    surface: 'Intelligence landing page',
    title: 'Replace the current Intelligence shell with a real left-rail navigation layout',
    status: 'in_progress',
    progress: 38,
    counter: '1 new browser component / 1 full-page IA rewrite pending',
    outcome: 'Foundation browser building blocks exist, but the actual landing page still reads as the old workspace.',
    nextStep: 'Promote the browser into the primary layout, add the persistent left rail, and retire the duplicated library path.',
  },
  {
    id: 'intel-links',
    track: 'intelligence',
    surface: 'Intelligence cards · benchmarks · patterns · vendors',
    title: 'Make every Intelligence section and card navigate to real supporting content',
    status: 'queued',
    progress: 18,
    counter: '0 dead-link pages acceptable / content audit still required',
    outcome: 'The IA is not trustworthy until every top box and content card either opens a real page or is removed.',
    nextStep: 'Audit patterns, benchmarks, vendors, frameworks, and regulations; generate content where the route is empty.',
  },
  {
    id: 'backlog-tracker',
    track: 'admin',
    surface: 'Quality Ops · execution tracker',
    title: 'Display a live backlog tracker with item-by-item status and counters',
    status: 'done',
    progress: 100,
    counter: '1 operator tracker / now live on this page',
    outcome: 'Progress is now visible in-product instead of being trapped in chat history and PR archaeology.',
    nextStep: 'Keep this table current as each backlog item is merged and verified.',
  },
]

function readinessLabel(score: number): Readiness {
  if (score >= 90) return 'Settlement-ready'
  if (score >= 80) return 'Board-ready'
  if (score >= 65) return 'Decision-support'
  return 'Exploratory'
}

function readinessColor(label: Readiness) {
  if (label === 'Settlement-ready') return { bg: '#ECFDF5', text: '#166534', border: '#A7F3D0' }
  if (label === 'Board-ready') return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }
  if (label === 'Decision-support') return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }
  return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }
}

function severityStyle(severity: Severity) {
  if (severity === 'critical') return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }
  if (severity === 'high') return { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' }
  return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }
}

function pillarLabel(pillar: Pillar) {
  if (pillar === 'data') return 'Data Quality'
  if (pillar === 'evidence') return 'Evidence Integrity'
  if (pillar === 'intelligence') return 'Intelligence Quality'
  return 'Knowledge Health'
}

function pillarAccent(pillar: Pillar) {
  if (pillar === 'data') return '#2563EB'
  if (pillar === 'evidence') return '#059669'
  if (pillar === 'intelligence') return '#14B8A6'
  return '#7C3AED'
}

function backlogStatusTheme(status: BacklogStatus) {
  if (status === 'done') return { bg: '#ECFDF5', text: '#166534', border: '#A7F3D0', label: 'Done' }
  if (status === 'in_progress') return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'In progress' }
  if (status === 'blocked') return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', label: 'Blocked' }
  return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', label: 'Queued' }
}

function trackLabel(track: BacklogTrack) {
  if (track === 'intelligence') return 'Intelligence'
  if (track === 'chat') return 'Chat + agents'
  if (track === 'design') return 'Design system'
  return 'Admin + ops'
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export default function AdminQualityOps() {
  const [selectedTenant, setSelectedTenant] = useState<TenantKey | 'all'>('all')
  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [selectedTrack, setSelectedTrack] = useState<BacklogTrack | 'all'>('all')

  const scopedTenants = selectedTenant === 'all' ? TENANTS : TENANTS.filter((tenant) => tenant.key === selectedTenant)
  const scopedActions = QUALITY_ACTIONS.filter((action) => selectedTenant === 'all' || action.tenant === selectedTenant)

  const tenantScores = useMemo(() => {
    return TENANTS.map((tenant) => {
      const tenantActions = QUALITY_ACTIONS.filter((action) => action.tenant === tenant.key)
      const resolved = tenantActions.filter((action) => resolvedIds.includes(action.id))
      const unresolved = tenantActions.filter((action) => !resolvedIds.includes(action.id))

      const score = {
        data: Math.min(100, tenant.baseData + resolved.filter((action) => action.pillar === 'data').reduce((sum, action) => sum + action.delta, 0)),
        evidence: Math.min(100, tenant.baseEvidence + resolved.filter((action) => action.pillar === 'evidence').reduce((sum, action) => sum + action.delta, 0)),
        intelligence: Math.min(100, tenant.baseIntelligence + resolved.filter((action) => action.pillar === 'intelligence').reduce((sum, action) => sum + action.delta, 0)),
        knowledge: Math.min(100, tenant.baseKnowledge + resolved.filter((action) => action.pillar === 'knowledge').reduce((sum, action) => sum + action.delta, 0)),
      }

      const overall = Math.round(score.data * 0.3 + score.evidence * 0.25 + score.intelligence * 0.25 + score.knowledge * 0.2)
      const nextBest = [...unresolved].sort((a, b) => b.delta - a.delta)[0]
      const totalLiftRemaining = unresolved.reduce((sum, action) => sum + action.delta, 0)

      return {
        tenant,
        score,
        overall,
        readiness: readinessLabel(overall),
        unresolved,
        resolved,
        nextBest,
        totalLiftRemaining,
      }
    })
  }, [resolvedIds])

  const scopedScoreRows = tenantScores.filter((row) => selectedTenant === 'all' || row.tenant.key === selectedTenant)
  const overallScore = average(scopedScoreRows.map((row) => row.overall))
  const averageData = average(scopedScoreRows.map((row) => row.score.data))
  const averageEvidence = average(scopedScoreRows.map((row) => row.score.evidence))
  const averageIntelligence = average(scopedScoreRows.map((row) => row.score.intelligence))
  const averageKnowledge = average(scopedScoreRows.map((row) => row.score.knowledge))
  const topActions = [...scopedActions]
    .filter((action) => !resolvedIds.includes(action.id))
    .sort((a, b) => b.delta - a.delta)
  const totalPotentialLift = topActions.slice(0, 5).reduce((sum, action) => sum + action.delta, 0)
  const readiness = readinessLabel(overallScore)
  const readinessTheme = readinessColor(readiness)
  const backlogItems = selectedTrack === 'all'
    ? BACKLOG_ITEMS
    : BACKLOG_ITEMS.filter((item) => item.track === selectedTrack)
  const doneCount = backlogItems.filter((item) => item.status === 'done').length
  const inProgressCount = backlogItems.filter((item) => item.status === 'in_progress').length
  const queuedCount = backlogItems.filter((item) => item.status === 'queued').length
  const blockedCount = backlogItems.filter((item) => item.status === 'blocked').length
  const backlogCompletion = average(backlogItems.map((item) => item.progress))
  const nextBacklogItem = backlogItems.find((item) => item.status === 'in_progress') ?? backlogItems.find((item) => item.status === 'queued') ?? backlogItems[0]

  function toggleResolved(id: string) {
    setResolvedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E8E6E3', overflowX: 'auto' }}>
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              background: link.active ? '#0F172A' : '#F8F7F4',
              color: link.active ? '#FFFFFF' : '#475569',
              border: '1px solid #E8E6E3',
              flexShrink: 0,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div style={S.shell}>
        <section
          style={{
            ...S.card,
            padding: '28px 28px 24px',
            background:
              'radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 28%), radial-gradient(circle at bottom left, rgba(37,99,235,0.08), transparent 24%), #FFFFFF',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '880px' }}>
              <div style={{ ...S.label, color: '#14B8A6', marginBottom: '10px' }}>Quality Ops</div>
              <h1 style={{ fontSize: '34px', lineHeight: 1.02, letterSpacing: '-0.04em', margin: 0, color: '#111827', fontFamily: 'Georgia, serif' }}>
                Score the corpus. Show the gaps. Move the score with operator work.
              </h1>
              <p style={{ margin: '16px 0 0', fontSize: '16px', lineHeight: 1.7, color: '#4B5563', maxWidth: '820px' }}>
                This is the internal quality surface for AbarVa operators. It separates data quality,
                evidence integrity, intelligence quality, and knowledge health, then ties each weakness
                to a concrete action that can improve the score.
              </p>
            </div>

            <div
              style={{
                minWidth: '260px',
                padding: '18px 20px',
                borderRadius: '16px',
                border: `1px solid ${readinessTheme.border}`,
                background: readinessTheme.bg,
              }}
            >
              <div style={{ ...S.label, marginBottom: '8px', color: readinessTheme.text }}>Current readiness</div>
              <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1, color: readinessTheme.text }}>{overallScore}</div>
              <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 700, color: readinessTheme.text }}>{readiness}</div>
              <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.6, color: readinessTheme.text }}>
                Resolve the top five actions below and this cohort can gain about <strong>+{totalPotentialLift}</strong> points.
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Overall Quality', value: overallScore, sub: readiness, accent: '#0F172A' },
            { label: 'Data Quality', value: averageData, sub: 'Coverage · freshness · structure', accent: '#2563EB' },
            { label: 'Evidence Integrity', value: averageEvidence, sub: 'Provenance · chain-of-custody', accent: '#059669' },
            { label: 'Intelligence Quality', value: averageIntelligence, sub: 'Grounding · specificity · actionability', accent: '#14B8A6' },
            { label: 'Knowledge Health', value: averageKnowledge, sub: 'Promotion discipline · reusable patterns', accent: '#7C3AED' },
          ].map((card) => (
            <div key={card.label} style={{ ...S.card, padding: '18px 18px 16px' }}>
              <div style={S.label}>{card.label}</div>
              <div style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1, color: card.accent }}>{card.value}</div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <section
          style={{
            ...S.card,
            marginBottom: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 0.85fr',
              gap: '0',
            }}
          >
            <div style={{ padding: '24px 24px 20px', borderRight: '1px solid #F0EEEA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ maxWidth: '760px' }}>
                  <div style={{ ...S.label, color: '#14B8A6', marginBottom: '10px' }}>Execution tracker</div>
                  <div style={{ fontSize: '28px', lineHeight: 1.04, letterSpacing: '-0.03em', fontWeight: 700, color: '#111827', fontFamily: 'Georgia, serif' }}>
                    Execute the backlog one item at a time, with status always visible.
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '15px', lineHeight: 1.75, color: '#4B5563', maxWidth: '720px' }}>
                    This is the operator view for Intelligence and backlog rollout. Every item below carries a status,
                    percent complete, live counter, current outcome, and next action so we always know what shipped and what is still pending.
                  </div>
                </div>

                <div
                  style={{
                    minWidth: '220px',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    background: '#0F172A',
                    color: '#F8FAFC',
                  }}
                >
                  <div style={{ ...S.label, color: '#14B8A6', marginBottom: '8px' }}>Backlog completion</div>
                  <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>{backlogCompletion}%</div>
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 700 }}>Visible tracker progress</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.6, color: 'rgba(248,250,252,0.76)' }}>
                    {doneCount} done · {inProgressCount} in progress · {queuedCount} queued · {blockedCount} blocked
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
                {[
                  { label: 'Done', value: doneCount, sub: 'Merged or shipped', accent: '#166534', bg: '#ECFDF5' },
                  { label: 'In progress', value: inProgressCount, sub: 'Active execution', accent: '#1D4ED8', bg: '#EFF6FF' },
                  { label: 'Queued', value: queuedCount, sub: 'Next up', accent: '#B45309', bg: '#FFFBEB' },
                  { label: 'Blocked', value: blockedCount, sub: 'Needs unblock', accent: '#B91C1C', bg: '#FEF2F2' },
                  { label: 'Tracked items', value: backlogItems.length, sub: 'Visible in this filter', accent: '#0F172A', bg: '#F8F7F4' },
                ].map((card) => (
                  <div key={card.label} style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E8E6E3', background: card.bg }}>
                    <div style={S.label}>{card.label}</div>
                    <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: card.accent }}>{card.value}</div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{card.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px', background: '#FFFEFC' }}>
              <div style={S.label}>Next highest-priority action</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                {nextBacklogItem?.title ?? 'No tracked work'}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#4B5563', marginBottom: '12px' }}>
                {nextBacklogItem?.nextStep ?? 'Everything in the current filter is complete.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {([{ key: 'all', label: 'All tracks' }, { key: 'intelligence', label: 'Intelligence' }, { key: 'chat', label: 'Chat + agents' }, { key: 'design', label: 'Design system' }, { key: 'admin', label: 'Admin + ops' }] as const).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedTrack(option.key)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '999px',
                      border: '1px solid #E8E6E3',
                      background: selectedTrack === option.key ? '#0F172A' : '#FFFFFF',
                      color: selectedTrack === option.key ? '#FFFFFF' : '#374151',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7 }}>
                Use this strip as the single source of truth during rollout. If an item is done, mark it as done here.
                If it is still debated, it stays in progress or queued until the shipped experience changes.
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #F0EEEA', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1180px' }}>
              <thead>
                <tr style={{ background: '#FAFAF9', textAlign: 'left' }}>
                  {['Track', 'Surface', 'Backlog item', 'Status', 'Progress', 'Live counter', 'Outcome now', 'Next step'].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '12px 16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        borderBottom: '1px solid #F0EEEA',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backlogItems.map((item) => {
                  const status = backlogStatusTheme(item.status)
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3EF', verticalAlign: 'top' }}>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{trackLabel(item.track)}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563', lineHeight: 1.6 }}>{item.surface}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{item.title}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '999px', background: status.bg, color: status.text, border: `1px solid ${status.border}`, fontSize: '12px', fontWeight: 700 }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                          <span>{item.progress}%</span>
                          <span>{item.progress === 100 ? 'Complete' : 'Active'}</span>
                        </div>
                        <div style={{ height: '10px', borderRadius: '999px', background: '#EDEAE6', overflow: 'hidden' }}>
                          <div style={{ width: `${item.progress}%`, height: '100%', borderRadius: '999px', background: status.text }} />
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>{item.counter}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563', lineHeight: 1.7 }}>{item.outcome}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563', lineHeight: 1.7 }}>{item.nextStep}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: '18px', marginBottom: '24px' }}>
          <div style={{ ...S.card, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={S.label}>Highest-impact action queue</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>Resolve these next to move the score fastest.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {([{ key: 'all', label: 'All tenants' }, ...TENANTS.map((tenant) => ({ key: tenant.key, label: tenant.shortLabel }))] as const).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedTenant(option.key)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '999px',
                      border: '1px solid #E8E6E3',
                      background: selectedTenant === option.key ? '#0F172A' : '#FFFFFF',
                      color: selectedTenant === option.key ? '#FFFFFF' : '#374151',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topActions.map((action) => {
                const severity = severityStyle(action.severity)
                const isResolved = resolvedIds.includes(action.id)
                const tenant = TENANTS.find((row) => row.key === action.tenant)!
                return (
                  <div
                    key={action.id}
                    style={{
                      border: `1px solid ${isResolved ? '#BBF7D0' : '#E8E6E3'}`,
                      background: isResolved ? '#F0FDF4' : '#FFFEFC',
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tenant.shortLabel}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: severity.bg, color: severity.text, border: `1px solid ${severity.border}` }}>
                            {action.severity}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: `${pillarAccent(action.pillar)}14`, color: pillarAccent(action.pillar) }}>
                            {pillarLabel(action.pillar)}
                          </span>
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{action.title}</div>
                        <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.65, color: '#4B5563' }}>{action.detail}</div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
                          Owner: <strong style={{ color: '#374151' }}>{action.owner}</strong> · Estimated lift: <strong style={{ color: pillarAccent(action.pillar) }}>+{action.delta}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => toggleResolved(action.id)}
                          style={{
                            padding: '9px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${isResolved ? '#22C55E' : '#14B8A6'}`,
                            background: isResolved ? '#DCFCE7' : '#ECFEFF',
                            color: isResolved ? '#166534' : '#0F766E',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isResolved ? 'Resolved' : 'Resolve'}
                        </button>
                        <button
                          style={{
                            padding: '9px 14px',
                            borderRadius: '10px',
                            border: '1px solid #E8E6E3',
                            background: '#FFFFFF',
                            color: '#374151',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {action.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ ...S.card, padding: '22px' }}>
              <div style={S.label}>Scoring logic</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>What this page is measuring</div>
              {[
                { title: 'Data Quality', body: 'Coverage, freshness, structure, and completeness of the operating corpus.' },
                { title: 'Evidence Integrity', body: 'Provenance, source-of-record links, chain-of-custody, and owner accountability.' },
                { title: 'Intelligence Quality', body: 'Grounding, specificity, contradiction handling, and decision usefulness.' },
                { title: 'Knowledge Health', body: 'Pattern confidence, promotion discipline, anonymization integrity, and reuse value.' },
              ].map((item) => (
                <div key={item.title} style={{ padding: '12px 0', borderTop: '1px solid #F0EEEA' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', lineHeight: 1.65, color: '#4B5563' }}>{item.body}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, padding: '22px', background: '#0F172A', color: '#F8FAFC' }}>
              <div style={{ ...S.label, color: '#14B8A6' }}>Operator note</div>
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>A better score must come from better evidence, not more words.</div>
              <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.7, color: 'rgba(248,250,252,0.76)' }}>
                This page should never reward longer decks, prettier summaries, or more generated content
                unless coverage, provenance, contradiction handling, or promotion discipline actually improved.
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...S.card, padding: '22px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <div style={S.label}>Tenant quality map</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>Which tenants are board-ready and which are still exploratory?</div>
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', maxWidth: '340px', lineHeight: 1.6 }}>
              Click “Resolve” above and watch these scores move. This is intentionally operator-facing.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
            {tenantScores.map((row) => {
              const readinessTheme = readinessColor(row.readiness)
              return (
                <article key={row.tenant.key} style={{ border: '1px solid #E8E6E3', borderRadius: '16px', padding: '18px', background: '#FFFEFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{row.tenant.shortLabel}</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', color: '#6B7280' }}>{row.tenant.label}</div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '999px', background: readinessTheme.bg, color: readinessTheme.text, fontSize: '11px', fontWeight: 700, border: `1px solid ${readinessTheme.border}` }}>
                      {row.readiness}
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    {[
                      { label: 'Data', value: row.score.data, color: '#2563EB' },
                      { label: 'Evidence', value: row.score.evidence, color: '#059669' },
                      { label: 'Intelligence', value: row.score.intelligence, color: '#14B8A6' },
                      { label: 'Knowledge', value: row.score.knowledge, color: '#7C3AED' },
                    ].map((metric) => (
                      <div key={metric.label} style={{ padding: '10px 12px', borderRadius: '12px', background: '#F8F7F4', border: '1px solid #F0EEEA' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric.label}</div>
                        <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 800, color: metric.color }}>{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F0EEEA' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Biggest next action</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{row.nextBest?.title ?? 'No open blockers'}</div>
                    <div style={{ marginTop: '4px', fontSize: '13px', lineHeight: 1.6, color: '#4B5563' }}>
                      {row.nextBest ? `Estimated lift +${row.nextBest.delta}. ${row.nextBest.detail}` : 'This tenant has no remaining queued quality actions.'}
                    </div>
                    <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: '#6B7280', fontSize: '12px', lineHeight: 1.6 }}>
                      {row.tenant.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '18px' }}>
          <div style={{ ...S.card, padding: '22px' }}>
            <div style={S.label}>Score drivers by tenant</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tenantScores.map((row) => (
                <div key={row.tenant.key} style={{ padding: '16px', borderRadius: '14px', background: '#F8F7F4', border: '1px solid #F0EEEA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{row.tenant.label}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      Current <strong style={{ color: '#111827' }}>{row.overall}</strong> · potential remaining lift <strong style={{ color: '#111827' }}>+{row.totalLiftRemaining}</strong>
                    </div>
                  </div>
                  {([
                    { key: 'data', label: 'Data Quality', value: row.score.data },
                    { key: 'evidence', label: 'Evidence Integrity', value: row.score.evidence },
                    { key: 'intelligence', label: 'Intelligence Quality', value: row.score.intelligence },
                    { key: 'knowledge', label: 'Knowledge Health', value: row.score.knowledge },
                  ] as const).map((pillar) => (
                    <div key={pillar.key} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563', marginBottom: '5px' }}>
                        <span>{pillar.label}</span>
                        <strong style={{ color: pillarAccent(pillar.key) }}>{pillar.value}</strong>
                      </div>
                      <div style={{ height: '10px', background: '#EDEAE6', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pillar.value}%`, height: '100%', background: pillarAccent(pillar.key), borderRadius: '999px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, padding: '22px' }}>
            <div style={S.label}>Data confidence hook</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Best next upload per tenant</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TENANTS.map((tenant) => {
                const confidence =
                  tenant.orgId && tenant.queryCategory
                    ? calculateConfidence(tenant.orgId, tenant.queryCategory)
                    : null

                return (
                  <div key={tenant.key} style={{ padding: '14px', borderRadius: '14px', background: '#F8F7F4', border: '1px solid #F0EEEA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{tenant.label}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: confidence?.color ?? '#B45309' }}>
                        {confidence ? `${confidence.score}/100` : `${tenant.baseData}/100`}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#4B5563' }}>
                      {confidence?.topUpgrade
                        ? `${confidence.topUpgrade.action} · estimated data lift +${confidence.topUpgrade.delta}.`
                        : 'Upload executive interviews, operating metrics, and locked baseline artifacts before using this tenant for material judgment.'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
