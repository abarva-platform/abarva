'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { DEMO_SEEDS } from '@/lib/avr-demo-seed'
import AbarvaMark from '@/components/AbarvaMark'

const BG     = '#060A12'
const PANEL  = '#0C0C0C'
const WHITE  = '#FFFFFF'
const MUTED  = 'rgba(255,255,255,0.80)'
const DIM    = 'rgba(255,255,255,0.30)'
const TEAL   = '#2DD4C8'
const BORDER = 'rgba(255,255,255,0.07)'
const MONO   = "'JetBrains Mono', 'Courier New', monospace"
const SERIF  = "Georgia, 'Times New Roman', serif"
const SANS   = "'DM Sans', system-ui, sans-serif"

type Section = 'THE PROBLEM' | 'ABARNEXUS' | 'THE PLATFORM' | 'PROOF' | 'THE FUTURE'

interface Screen {
  id: string
  category: Section
  title: string
  body: string
  bullets: string[]
  url: string
  zoom?: number   // iframe scale (default 0.7)
  audio?: string  // filename base; defaults to padded idx+1
  onLoad?: (iframe: HTMLIFrameElement) => void
}

const PHASE_GROUPS: { label: string; category: Section; screens: string[] }[] = [
  { label: 'THE PROBLEM',  category: 'THE PROBLEM',  screens: ['1', '2'] },
  { label: 'ABARNEXUS',    category: 'ABARNEXUS',    screens: ['3', '4', '5', '6'] },
  { label: 'THE PLATFORM', category: 'THE PLATFORM', screens: ['7', '8', '9', '10', '11', '12', '13A', '13B', '14'] },
  { label: 'PROOF',        category: 'PROOF',        screens: ['15', '16', '17'] },
  { label: 'THE FUTURE',   category: 'THE FUTURE',   screens: ['18', '19'] },
]

// iframe interaction helpers — all wrapped in try/catch to silence cross-origin errors
function clickInIframe(iframe: HTMLIFrameElement, match: (text: string) => boolean, delayMs = 1000) {
  setTimeout(() => {
    try {
      const doc = iframe.contentDocument
      if (!doc) return
      const els = Array.from(doc.querySelectorAll('button, a'))
      const el = els.find(e => match(e.textContent || '')) as HTMLElement | undefined
      el?.click()
    } catch { /* cross-origin */ }
  }, delayMs)
}

function scrollIframe(iframe: HTMLIFrameElement, top: number, delayMs = 1000) {
  setTimeout(() => {
    try {
      iframe.contentWindow?.scrollTo({ top, behavior: 'smooth' })
    } catch { /* cross-origin */ }
  }, delayMs)
}

const SCREENS: Screen[] = [
  // ── THE PROBLEM ───────────────────────────────────────────────────────────
  {
    id: '1', audio: '01',
    category: 'THE PROBLEM',
    title: 'The $800B problem.',
    body: 'Enterprises spend $800B a year on transformation. The deliverable is a PowerPoint. The knowledge walks out with the partner. No baseline. No accountability. The same firm comes back next year with the same recommendations. AbarVa changes that.',
    bullets: [
      '$800B annual transformation spend — zero outcome accountability',
      '73% of AI investments produce no verified outcome',
      'Knowledge retires with the partner — every single time',
      'AbarVa changes the structure, not just the price',
    ],
    url: '/',
  },
  {
    id: '2', audio: '02',
    category: 'THE PROBLEM',
    title: 'Same problem. Same firms. Since forever.',
    body: 'AbarVa is not a consulting firm. It is an intelligence platform. Maestros embed inside the client — not external advisors. Platform fee. Engagement fee. Then 15–20% of verified savings above the locked Day Zero baseline — only if achieved. No ballooning SOWs. No fee for effort. Skin in the game.',
    bullets: [
      'Left column: how advisory firms work today — deck, leave, repeat',
      'Right column: how AbarVa works — data ingested before the first meeting',
      'Baseline locked Day 0 — immutable, auditable, defensible',
      'Knowledge stays in the platform permanently — never walks out the door',
    ],
    url: '/platform',
  },
  // ── ABARNEXUS ─────────────────────────────────────────────────────────────
  {
    id: '3', audio: '03',
    category: 'ABARNEXUS',
    title: 'AbarNexus. The brain that never forgets.',
    body: 'Three dimensions of knowledge — and none of them require you to give up your data. Dimension one: AbarNexus out-of-box — 340 Genome patterns, HFMA benchmarks, vendor performance data. Dimension two: your data, in your environment — files processed as embeddings inside your infrastructure, never ours. Dimension three: emergent intelligence — patterns from every engagement added back permanently. The 50th client benefits from the first 49.',
    bullets: [
      'Dimension 1: 340 Genome patterns + HFMA benchmarks — out of box',
      'Dimension 2: YOUR data — embeddings in YOUR infrastructure, not AbarVa',
      'Dimension 3: Emergent — every engagement adds new patterns permanently',
      'Zero data lock-in: you can leave at any time, your data stays with you',
    ],
    url: '/intelligence?client=meridian', zoom: 0.62,
  },
  {
    id: '4', audio: '04',
    category: 'ABARNEXUS',
    title: 'Your data never leaves your environment. Ever.',
    body: 'Every file you upload is processed into embeddings inside your Supabase instance — not ours. Your contracts, financials, org charts, vendor agreements: they become searchable intelligence that AbarNexus can query. But the raw data stays in your environment. We never see it. We never store it. When the engagement ends, you own the intelligence. Not AbarVa. You.',
    bullets: [
      'Client data: embeddings in your Supabase, not AbarVa servers',
      'AbarNexus queries your embeddings — never ingests your raw files',
      'Vendor contracts, financials, org charts: searchable, never exposed',
      'Engagement ends: all intelligence stays with you permanently',
    ],
    url: '/platform', zoom: 0.62,
  },
  {
    id: '5', audio: '05',
    category: 'ABARNEXUS',
    title: '340 failure patterns. Every one documented.',
    body: 'F007: CDO vacant at go-live — 79% programme failure rate. F011: vendor SLA never enforced — 74% suboptimal outcome. F003: platform end-of-life unplanned — 82% budget overrun. These are not estimates. They are statistical facts from organisations that were in exactly this position.',
    bullets: [
      'Live Contradiction Intelligence opens — F011 Ensemble SLA breach flagged',
      'Each pattern: failure rate, engagement count, and recovery path',
      'F011 active at Meridian: Ensemble SLA never enforced — 74% failure rate',
      'Genome compounds — each new engagement sharpens every future pattern',
    ],
    url: '/maestro/meridian', zoom: 0.62,
    onLoad: (iframe) => clickInIframe(iframe, t => t.includes('Contradictions'), 800),
  },
  {
    id: '6', audio: '06',
    category: 'ABARNEXUS',
    title: 'AbarNexus retrieves at every step.',
    body: 'Every message triggers a retrieval from the knowledge base. HFMA benchmarks. Genome failure patterns. The uploaded Ensemble contract. The brain retrieves exactly what\'s relevant — and injects it into every single response. Not a static prompt. Live intelligence.',
    bullets: [
      'Every AI response draws from the live knowledge base — not a static prompt',
      'Client data + Genome patterns + sector benchmarks retrieved per message',
      'The chat shows what the Maestro actually said to the client',
      'Outcomes panel builds on the right — every decision locked as structured data',
    ],
    url: '/ai-strategy?client=meridian&seed=demo', zoom: 0.60,
  },
  // ── THE PLATFORM ──────────────────────────────────────────────────────────
  {
    id: '7', audio: '07',
    category: 'THE PLATFORM',
    title: 'Before the first meeting, the Maestro already knows everything.',
    body: 'The Maestro workspace for Meridian. Before the first meeting, the platform knows: denial rate 18.2% vs benchmark 11.4%, CDO role vacant — F007 active, Epic goes live Q3 2026. No discovery week. 48 hours from data upload.',
    bullets: [
      'Active engagements table — Phase/Gate column visible after scroll',
      'RCM AI Denial Prevention · Phase 1 · ✅ Approved',
      'Technology Modernization · Phase 2 · ✅ Approved',
      'Margin Optimization · Phase 0 · 🔒 Locked',
    ],
    url: '/maestro/meridian', zoom: 0.62,
    onLoad: (iframe) => scrollIframe(iframe, 350, 1000),
  },
  {
    id: '8', audio: '08',
    category: 'THE PLATFORM',
    title: 'The Maestro Guide. Five steps from setup to verified outcome.',
    body: 'This is the operating manual that replaces 40 consultants. Setup the workspace. Review what AbarNexus already knows. Run the engagement. Navigate AbarNexus through every phase. Capture the verified outcome and earn the fee.',
    bullets: [
      'Step 1: Setup — client data ingested, Genome pre-matched in 48 hours',
      'Step 2: Intelligence review — Maestro reads signals before first meeting',
      'Step 3: Engagement launch — directive captured, scope locked',
      'Steps 4–5: Navigate every phase → verify outcomes → earn the fee',
    ],
    url: '/maestro/meridian', zoom: 0.62,
  },
  {
    id: '9', audio: '09',
    category: 'THE PLATFORM',
    title: 'A new engagement. Three minutes.',
    body: 'Click New Engagement. Four questions: the leadership directive, AI use cases, technology landscape, executive sponsor. AbarVa auto-infers the solution type from what you describe — you never pick from a list. A McKinsey SOW takes three weeks. This takes three minutes — and arrives knowing more.',
    bullets: [
      'New Engagement flow auto-opens — discovery conversation live',
      'AI auto-infers engagement type from directive — no category dropdown',
      'Genome validation shown live — success rate for this engagement type',
      'Canvas populates as questions are answered — scope locked on Submit',
    ],
    url: '/maestro/meridian', zoom: 0.62,
    onLoad: (iframe) => clickInIframe(iframe, t => t.includes('New Engagement'), 1000),
  },
  {
    id: '10', audio: '10',
    category: 'THE PLATFORM',
    title: 'Phase 0, Step 1. Three board-level signals.',
    body: 'AbarNexus opens with the three most critical signals at Meridian: the denial rate gap, prior auth automation lag, and the Epic go-live window. Every option is a real CXO stance — not a vague category. The AI Value Brief builds on the right. Every decision locked.',
    bullets: [
      'Options are real executive positions — not vague dropdown categories',
      'Option D always opens free text — the user is never trapped',
      'Right panel: AI Value Brief builds with every answered question',
      'AbarNexus retrieves Genome patterns in real time for each response',
    ],
    url: '/ai-strategy?client=meridian', zoom: 0.60,
    onLoad: (iframe) => clickInIframe(iframe, t => t.includes('0.1') || t.includes('Situation Confirmation'), 1500),
  },
  {
    id: '11', audio: '11',
    category: 'THE PLATFORM',
    title: '18 steps. 5 phases. Every outcome locked.',
    body: '$22.4M verified — KPMG audited. Day Zero baseline never moved. Denial rate: 18.2% to 16.1%, tracking to 12%. Epic integration on track Q3 2026. The board pack is ready. The fee is earned. Renewal confirmed.',
    bullets: [
      'Left sidebar: all 18 steps across 5 phases — every one complete and gated',
      'Phase 4: $22.4M verified, 5.7× ROI on AbarVa fee, KPMG-audited',
      'Fee earned: $3.92M on verified delta — not projected, not estimated',
      'Renewal confirmed — Meridian is a Phase 2 client. The Genome compounds.',
    ],
    url: '/ai-strategy?client=meridian', zoom: 0.60,
    onLoad: (iframe) => clickInIframe(iframe, t => t.includes('4.2') || t.includes('EXECUTE'), 1500),
  },
  {
    id: '12', audio: '12',
    category: 'THE PLATFORM',
    title: 'Not every problem needs 18 steps.',
    body: 'AbarVa has point solutions for specific problems: vendor spend optimisation, RCM denial prevention, AI portfolio accountability, Epic AI integration. Each is a focused workflow. Same AbarNexus intelligence. Faster time to value. No engagement manager required.',
    bullets: [
      'Point solutions for defined problem types — no full engagement required',
      'Vendor Spend: identify overpayment in 2 weeks, CFO-grade brief produced',
      'Denial Prevention: RCM-specific workflow, benchmarked to HFMA standard',
      'Each solution uses the same Genome intelligence — just scoped tighter',
    ],
    url: '/solutions',
  },
  {
    id: '13A', audio: '13a',
    category: 'THE PLATFORM',
    title: 'Your biggest vendor contract. AbarNexus already knows.',
    body: 'Your Bloomberg contract is $8.4M. AbarNexus knows 31 comparable asset managers pay $5.1M. It found $1.4M in unclaimed SLA credits — 18 months unacted. Run the Vendor Spend solution. Two weeks. CFO-grade negotiation brief. No third party. You own the intelligence.',
    bullets: [
      'Bloomberg contract: $8.4M — peers pay $5.1M, 31-firm benchmark',
      '$1.4M in unclaimed SLA credits — 18 months sitting on the table',
      'Two weeks: CFO-grade negotiation brief, no external consultant',
      'You run the RFP. You negotiate. You own the intelligence.',
    ],
    url: '/solutions',
  },
  {
    id: '13B', audio: '13b',
    category: 'THE PLATFORM',
    title: 'Live vendor intelligence. Every contract benchmarked.',
    body: 'This is Arcturus Financial — $279M vendor portfolio, 60 active contracts. 6 vendors meeting SLA. 11 SLA breaches with $1.8M in credits available NOW. 18 vendors above market rate. AbarNexus knows what comparable firms pay. It knows your SLA terms. It knows the renewal window.',
    bullets: [
      '$279M vendor portfolio · 60 active contracts benchmarked',
      '11 SLA breaches · $1.8M in credits available right now',
      '18 vendors above market rate — renewal windows flagged',
      'Not a spreadsheet, not a consultant — a platform reading every contract',
    ],
    url: '/ai-strategy?client=arcturus', zoom: 0.60,
  },
  {
    id: '14', audio: '14',
    category: 'THE PLATFORM',
    title: '7 deliverables. Every phase documented.',
    body: 'Phase 0 Situation Brief. Phase 1 Diagnose Report. Phase 2 Architecture and Roadmap. Phase 3 Value Framework. Phase 4 Board Pack and Fee Calculation. Every document generated by AbarNexus, reviewed by the Maestro, stored permanently. Yours to view, download, present.',
    bullets: [
      'Deliverables panel auto-opens — all 7 docs across 5 phases',
      'Architecture doc opens inline — full AbarVa-branded render',
      'Every document has engagement ID, date, Maestro name',
      'Download as HTML — present to your board directly',
    ],
    url: '/maestro/meridian', zoom: 0.62,
    onLoad: (iframe) => {
      setTimeout(() => {
        try {
          const doc = iframe.contentDocument
          if (!doc) return
          const del = Array.from(doc.querySelectorAll('button, a'))
            .find(el => (el.textContent || '').trim() === 'Deliverables') as HTMLElement | undefined
          del?.click()
          setTimeout(() => {
            try {
              const d2 = iframe.contentDocument
              if (!d2) return
              const viewBtns = Array.from(d2.querySelectorAll('button'))
                .filter(b => (b.textContent || '').trim() === 'View') as HTMLButtonElement[]
              viewBtns[1]?.click()
            } catch { /* cross-origin */ }
          }, 1500)
        } catch { /* cross-origin */ }
      }, 1000)
    },
  },
  // ── PROOF ─────────────────────────────────────────────────────────────────
  {
    id: '15', audio: '15',
    category: 'PROOF',
    title: 'Meridian. $22.4M verified. KPMG audited.',
    body: 'The engagement started with a denial rate of 18.2 percent. It ends with $22.4M verified. KPMG audited. 5.7× return on the AbarVa fee. Epic AI integration on track. Renewal confirmed. Meridian is a Phase 2 client. This is what outcome accountability looks like.',
    bullets: [
      'Starting position: 18.2% denial rate, $94M annual gap',
      '$22.4M verified — KPMG audit, not an AbarVa claim',
      '5.7× return on AbarVa fee — defensible to any board',
      'Renewal confirmed — Phase 2 client, Genome compounds',
    ],
    url: '/ai-strategy?client=meridian', zoom: 0.60,
    onLoad: (iframe) => clickInIframe(iframe, t => t.includes('4.2') || t.includes('Governance'), 1500),
  },
  {
    id: '16', audio: '16',
    category: 'PROOF',
    title: 'Arcturus Financial Group. $18.2M verified.',
    body: '$200B AUM. Cost-to-income ratio 71% versus 58% peer benchmark — an $840M efficiency gap. AbarNexus found $94M in AI spend with zero baselines and $1.4M in unclaimed Bloomberg SLA credits. $18.2M verified Month 4.',
    bullets: [
      'C/I ratio 71% vs 58% peer — $840M structural efficiency gap quantified',
      '$94M in AI spend with no baselines — zero programme accountability',
      '$1.4M Bloomberg SLA credits recovered — 18 months sitting on the table',
      'C/I trajectory confirmed structural — Series A trigger for outcome share',
    ],
    url: '/maestro/arcturus', zoom: 0.62,
  },
  {
    id: '17', audio: '17',
    category: 'PROOF',
    title: 'Apex Retail Group. $47.2M verified.',
    body: '340 stores. Azure spend 41% above peer benchmark — $39M recoverable. F003 matched: Teradata end-of-life with no migration plan. Month 1: reserved instance purchase — $14M Year 1, zero risk. Month 4: Azure + Databricks Medallion live. $47.2M verified Month 6.',
    bullets: [
      'Azure spend 41% above peer — $39M recoverable, no operational risk',
      'Teradata end-of-life: F003 pattern matched — $82M at risk if unplanned',
      'Month 1: reserved instance purchase — $14M saved, CFO approved in 48hrs',
      '$47.2M Month 6 — fastest outcome across the first three AbarVa engagements',
    ],
    url: '/maestro/apexretail', zoom: 0.62,
  },
  // ── THE FUTURE ────────────────────────────────────────────────────────────
  {
    id: '18', audio: '18',
    category: 'THE FUTURE',
    title: 'Every engagement makes AbarNexus smarter. Permanently.',
    body: 'At Series A, agents handle Phase 0 autonomously — one Maestro runs 4–6 engagements simultaneously. At Series B, the Genome Agent reads industry research continuously — AbarNexus self-updates from the world and from every engagement. Harvey AI did this for legal: $11B. Our market is $800B.',
    bullets: [
      'Platform architecture: 5 knowledge layers compounding per engagement',
      'Series A: cross-client Genome — 30+ engagements feeding live patterns',
      'Series B: autonomous agents — Maestro oversees, AI executes end-to-end',
      'Harvey AI: $11B for legal. AbarVa: same thesis. $800B. Nobody has touched it.',
    ],
    url: '/platform', zoom: 0.62,
    onLoad: (iframe) => scrollIframe(iframe, 1200, 1000),
  },
  {
    id: '19', audio: '19',
    category: 'THE FUTURE',
    title: 'When the engagement ends, everything stays.',
    body: 'When the engagement ends, everything stays with you. The Situation Brief. The Architecture. The Board Pack. Your vendor contracts were never on our servers. Your financials were never on our servers. Your data was processed as embeddings in your environment — and it stays there. AbarVa gave you the intelligence. You always had the data. Now act on it.',
    bullets: [
      'All deliverables are yours — Board Pack, Architecture, Roadmap, all of it',
      'Your vendor contracts: never on AbarVa servers — ever',
      'Your data: embeddings in your environment, stays there permanently',
      '71% of clients re-engage within 6 months — because the Genome compounds',
    ],
    url: '/maestro/meridian', zoom: 0.62,
  },
]

const DEMO_LS_SEEDS: Record<string, object> = DEMO_SEEDS as Record<string, object>

function DemoGuidedPageInner() {
  const [idx, setIdx]           = useState(0)
  const [dir, setDir]           = useState<'fwd' | 'back'>('fwd')
  const [autoOn, setAutoOn]     = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [selfServe, setSelfServe] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const screen    = SCREENS[idx]
  const total     = SCREENS.length
  const posthog   = usePostHog()
  const searchParams = useSearchParams()
  const ref = searchParams?.get('ref') ?? null

  // Capture screen view (and completion on final screen)
  useEffect(() => {
    if (!posthog) return
    posthog.capture('demo_screen_viewed', {
      screen_number: idx + 1,
      screen_title: SCREENS[idx].title,
      section: SCREENS[idx].category,
      ref,
    })
    if (idx === total - 1) {
      posthog.capture('demo_completed', {
        total_screens: total,
        ref,
      })
    }
  }, [idx, posthog, ref, total])

  // ── Auto-seed localStorage on mount ────────────────────────────────────────
  useEffect(() => {
    Object.entries(DEMO_LS_SEEDS).forEach(([client, seed]) => {
      const key      = `abarva_avr_v2_${client}`
      const existing = localStorage.getItem(key)
      const parsed   = existing ? (() => { try { return JSON.parse(existing) } catch { return null } })() : null
      if (!parsed || !Array.isArray(parsed.outcomes) || parsed.outcomes.length < 18) {
        localStorage.setItem(key, JSON.stringify(seed))
      }
    })
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const goTo = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(total - 1, i))
    setDir(clamped >= idx ? 'fwd' : 'back')
    setIdx(clamped)
    setCountdown(60)
    stopAudio()
  }, [total, idx, stopAudio])

  // ── Voice playback ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!voiceEnabled) return
    stopAudio()
    const screenAudio = SCREENS[idx].audio ?? String(idx + 1).padStart(2, '0')
    const audio       = new Audio(`/audio/demo/screen-${screenAudio}.mp3`)
    audioRef.current = audio
    audio.onplay   = () => setIsPlaying(true)
    audio.onended  = () => setIsPlaying(false)
    audio.onpause  = () => setIsPlaying(false)
    audio.onerror  = () => setIsPlaying(false)
    const t = setTimeout(() => audio.play().catch(() => {}), 500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, voiceEnabled])

  useEffect(() => () => stopAudio(), [stopAudio])

  // ── Keyboard nav ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(idx + 1)
      if (e.key === 'ArrowLeft')  goTo(idx - 1)
      if (e.key === 'Escape')     setSelfServe(false)
      if (e.key === ' ')          setAutoOn(a => !a)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, goTo])

  // ── Auto-advance ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoOn) return
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setIdx(i => {
            const next = Math.min(i + 1, total - 1)
            if (next === i) setAutoOn(false)
            setDir('fwd')
            stopAudio()
            return next
          })
          return 60
        }
        return c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoOn, total, stopAudio])

  const isFirst     = idx === 0
  const isLast      = idx === total - 1
  const progress    = ((idx + 1) / total) * 100
  const activeGroup = PHASE_GROUPS.find(g => g.screens.includes(screen.id))

  if (selfServe) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} title="AbarVa Platform" />
        <button
          onClick={() => setSelfServe(false)}
          style={{
            position: 'fixed', top: 12, right: 12, zIndex: 9999,
            padding: '8px 16px', background: PANEL, border: `1px solid ${BORDER}`,
            borderRadius: 6, color: TEAL, fontFamily: MONO, fontSize: 10,
            cursor: 'pointer', letterSpacing: '.08em',
          }}
        >
          ← GUIDED DEMO
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,212,200,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(45,212,200,0); }
        }
        @keyframes voicePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
      `}</style>

      <div style={{ height: '100vh', overflow: 'hidden', background: BG, display: 'flex', flexDirection: 'column', fontFamily: MONO }}>

        {/* ── TOP BAR ────────────────────────────────────────────────────── */}
        <div style={{
          height: 52, background: '#0F0E0D', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
        }}>
          {/* AbarVa serif wordmark */}
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AbarvaMark size={22} />
            <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#FAFAF9', fontWeight: 800, letterSpacing: '.05em' }}>Abar</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: TEAL, fontWeight: 900, letterSpacing: '.05em' }}>Va</span>
            </div>
          </a>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
            flexShrink: 0, padding: '4px 8px', borderRadius: 4,
            background: 'rgba(45,212,200,0.14)', color: TEAL,
            border: `1px solid ${TEAL}`,
          }}>GUIDED DEMO</span>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

          {/* Phase groups + dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {PHASE_GROUPS.map((group, gi) => {
              const groupActive = group.category === screen.category
              return (
                <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 1, minWidth: 0 }}>
                  {gi > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)', marginRight: 2, flexShrink: 0 }} />}
                  <span style={{
                    fontSize: 9, letterSpacing: '.09em', flexShrink: 0, whiteSpace: 'nowrap',
                    color: groupActive ? WHITE : 'rgba(255,255,255,0.50)',
                    fontWeight: groupActive ? 700 : 400,
                  }}>
                    {group.label}
                  </span>
                  {group.screens.map(sn => {
                    const si     = SCREENS.findIndex(s => s.id === sn)
                    if (si < 0) return null
                    const active = si === idx
                    const past   = si < idx
                    const wide   = sn.length > 2
                    return (
                      <button
                        key={sn}
                        onClick={() => goTo(si)}
                        title={SCREENS[si].title}
                        style={{
                          minWidth: 13, width: wide ? 20 : 13, height: 13,
                          borderRadius: 3, border: 'none', cursor: 'pointer',
                          background: active ? TEAL : past ? 'rgba(45,212,200,0.55)' : 'rgba(250,250,247,0.32)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          animation: active ? 'dotPulse 2s ease infinite' : 'none',
                        }}
                      >
                        <span style={{ fontSize: 7, color: active ? BG : past ? '#060A12' : '#FAFAF7', fontWeight: 700 }}>{sn}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Right controls — solid pills pop against the dark top bar */}
          <button
            onClick={() => {
              const next = !voiceEnabled
              setVoiceEnabled(next)
              if (isPlaying) stopAudio()
              posthog?.capture('demo_voice_toggled', { enabled: next, screen_number: idx + 1, ref })
            }}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
              fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
              background: (voiceEnabled || isPlaying) ? TEAL : '#FAFAF7',
              border: '1px solid transparent',
              color: '#0C0C0C',
              boxShadow: (voiceEnabled || isPlaying) ? '0 0 0 2px rgba(45,212,200,0.35)' : '0 1px 2px rgba(0,0,0,0.25)',
              animation: isPlaying ? 'voicePulse 1.5s ease infinite' : 'none',
            }}
          >
            {isPlaying ? '🎙 SPEAKING' : voiceEnabled ? '🔊 VOICE' : '🔇 VOICE'}
          </button>
          <button
            onClick={() => setAutoOn(a => !a)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
              fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
              background: autoOn ? TEAL : '#FAFAF7',
              border: '1px solid transparent',
              color: '#0C0C0C',
              boxShadow: autoOn ? '0 0 0 2px rgba(45,212,200,0.35)' : '0 1px 2px rgba(0,0,0,0.25)',
            }}
          >
            {autoOn ? `⏸ ${countdown}s` : '▶ AUTO'}
          </button>
          <button
            onClick={() => setSelfServe(true)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
              fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
              background: 'transparent', border: '1px solid rgba(250,250,247,0.45)',
              color: '#FAFAF7',
            }}
          >
            Explore →
          </button>
          <a href="/" style={{
            padding: '6px 14px', borderRadius: 20, flexShrink: 0,
            fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
            border: '1px solid transparent', background: '#FAFAF7',
            color: '#0C0C0C', textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}>
            ← Home
          </a>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT PANEL */}
          <div style={{
            width: 268, flexShrink: 0, background: PANEL,
            borderRight: `1px solid ${BORDER}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Animated content area */}
            <div
              key={`panel-${idx}`}
              style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 20px', animation: 'fadeUp 0.22s ease both' }}
            >
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 16 }}>
                SCREEN {screen.id} · {activeGroup?.label ?? screen.category}
              </div>

              <h2 style={{ fontFamily: SERIF, fontSize: 24, color: WHITE, fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px' }}>
                {screen.title}
              </h2>

              <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, lineHeight: 1.75, margin: '0 0 24px' }}>
                {screen.body}
              </p>

              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEAL, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
                  WHAT TO NOTICE
                </div>
                {screen.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEAL, flexShrink: 0, marginTop: 1, lineHeight: 1.5 }}>›</span>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom nav */}
            <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ padding: '14px 20px 12px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => goTo(idx - 1)}
                    disabled={isFirst}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 6,
                      cursor: isFirst ? 'default' : 'pointer',
                      background: 'transparent', border: `1px solid ${BORDER}`,
                      color: isFirst ? DIM : MUTED,
                      fontFamily: MONO, fontSize: 11,
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => goTo(idx + 1)}
                    disabled={isLast}
                    style={{
                      flex: 2, padding: '9px', borderRadius: 6,
                      cursor: isLast ? 'default' : 'pointer',
                      background: isLast ? 'transparent' : 'rgba(45,212,200,0.14)',
                      border: `1px solid ${isLast ? BORDER : 'rgba(45,212,200,0.4)'}`,
                      color: isLast ? DIM : TEAL,
                      fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    }}
                  >
                    {isLast ? 'Complete ✓' : 'Next →'}
                  </button>
                </div>
                <div style={{ textAlign: 'center', fontSize: 8, color: DIM, fontFamily: MONO }}>
                  ← → keys · space: auto · click any dot above
                </div>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: 3, background: TEAL, width: `${progress}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — zoomed iframe */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
            <div
              key={`iframe-${idx}`}
              style={{
                position: 'absolute', inset: 0,
                animation: `${dir === 'fwd' ? 'slideInRight' : 'slideInLeft'} 0.28s ease both`,
              }}
            >
              {(() => {
                const zoom = screen.zoom ?? 0.7
                const inv  = Math.round((100 / zoom) * 10) / 10
                return (
                  <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
                    <iframe
                      src={screen.url}
                      onLoad={(e) => {
                        try { screen.onLoad?.(e.currentTarget) } catch { /* cross-origin */ }
                      }}
                      style={{
                        width: `${inv}%`, height: `${inv}%`,
                        transform: `scale(${zoom})`, transformOrigin: 'top left',
                        position: 'absolute', top: 0, left: 0,
                        border: 'none', display: 'block',
                      }}
                      title={screen.title}
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DemoGuidedPage() {
  return (
    <Suspense fallback={null}>
      <DemoGuidedPageInner />
    </Suspense>
  )
}
