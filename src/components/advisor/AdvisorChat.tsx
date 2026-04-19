'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// AdvisorChat — minimal chat surface for the /api/advisor endpoint.
//
// Responsibilities:
//   1. On mount, read turn history from /api/advisor/history and restore the
//      visible conversation so page reload doesn't lose state.
//   2. If history is empty, auto-fire an "opening" request so the ceremony
//      lands immediately.
//   3. On user submit, POST /api/advisor with engagement_id + user_id +
//      message; stream the assistant's response into a new turn in place.
//
// Synthetic "[session opened]" user rows are filtered out of the visible
// turn list but remain in the DB for turn-number monotonicity.
// ─────────────────────────────────────────────────────────────────────────────

type Turn = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  turn_number?: number
}

type AdvisorChatProps = {
  clientId: string
  clientName?: string
  userRole?: string
  engagementId: string
}

const SYNTHETIC_OPEN = '[session opened]'

function isDisplayable(t: Turn): boolean {
  return !(t.role === 'user' && t.content === SYNTHETIC_OPEN)
}

export default function AdvisorChat({
  clientId,
  clientName,
  userRole = 'executive',
  engagementId,
}: AdvisorChatProps) {
  const { user, isLoaded } = useUser()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const userId = user?.id ?? ''
  const ready = isLoaded && Boolean(userId) && Boolean(engagementId) && Boolean(clientId)

  // Streams a POST /api/advisor turn into a new assistant bubble.
  const sendTurn = useCallback(
    async (message: string) => {
      if (!ready) return
      setError(null)
      setStreaming(true)

      // Optimistic user bubble unless this is the synthetic opener.
      if (message && message !== SYNTHETIC_OPEN) {
        setTurns((prev) => [...prev, { role: 'user', content: message }])
      }
      // Placeholder assistant bubble we'll fill as chunks arrive.
      setTurns((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            clientName,
            userRole,
            engagement_id: engagementId,
            user_id: userId,
            message: message || undefined,
          }),
        })

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => '')
          throw new Error(`Advisor request failed: ${res.status} ${body}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let assistantText = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          setTurns((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: assistantText }
            }
            return next
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error'
        setError(msg)
        setTurns((prev) => prev.slice(0, -1))
      } finally {
        setStreaming(false)
      }
    },
    [clientId, clientName, userRole, engagementId, userId, ready],
  )

  // On mount: load history, and if empty, fire the opening ceremony.
  useEffect(() => {
    if (!ready || bootstrapped) return
    let cancelled = false

    async function bootstrap() {
      try {
        const res = await fetch(
          `/api/advisor/history?engagement_id=${encodeURIComponent(engagementId)}&user_id=${encodeURIComponent(userId)}`,
        )
        if (cancelled) return
        if (res.ok) {
          const data = (await res.json()) as { turns?: Turn[] }
          const restored = data.turns ?? []
          if (restored.length > 0) {
            setTurns(restored)
            setBootstrapped(true)
            return
          }
        }
        // Fresh session: fire the opening ceremony.
        setBootstrapped(true)
        await sendTurn('')
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'unknown error'
        setError(msg)
        setBootstrapped(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [ready, bootstrapped, engagementId, userId, sendTurn])

  // Auto-scroll to latest turn.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [turns])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput('')
    void sendTurn(trimmed)
  }

  const visibleTurns = turns.filter(isDisplayable)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: '#F8F7F4',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {!isLoaded && <div style={{ color: '#666' }}>Loading…</div>}
        {isLoaded && !userId && (
          <div style={{ color: '#c2410c' }}>
            Sign in required to load the advisor.
          </div>
        )}
        {visibleTurns.map((t, i) => (
          <div
            key={t.id ?? `${t.role}-${t.turn_number ?? i}`}
            style={{
              alignSelf: t.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              background: t.role === 'user' ? '#171411' : '#FFFFFF',
              color: t.role === 'user' ? '#F8F7F4' : '#171411',
              border: t.role === 'assistant' ? '1px solid #E5E2DA' : 'none',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 15,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {t.content || (t.role === 'assistant' && streaming ? '…' : '')}
          </div>
        ))}
        {error && (
          <div
            style={{
              alignSelf: 'center',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: '1px solid #E5E2DA',
          padding: '14px 16px',
          display: 'flex',
          gap: 10,
          background: '#FFFFFF',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            ready ? 'Reply to the advisor…' : 'Loading context…'
          }
          disabled={!ready || streaming}
          style={{
            flex: 1,
            border: '1px solid #D6D1C4',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 15,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!ready || streaming || !input.trim()}
          style={{
            background: '#171411',
            color: '#F8F7F4',
            border: 'none',
            borderRadius: 8,
            padding: '0 18px',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: !ready || streaming || !input.trim() ? 'default' : 'pointer',
            opacity: !ready || streaming || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
