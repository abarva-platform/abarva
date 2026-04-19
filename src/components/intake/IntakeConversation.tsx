'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// IntakeConversation — left-pane chat surface for the partner-style intake.
//
// Behavior:
//   1. On mount, GET /api/intake to restore history. If empty, fire opening
//      (POST with message='').
//   2. On submit, POST /api/intake with message. Stream response into a live
//      assistant bubble.
//   3. Read X-Intake-Act and X-Intake-Turn response headers to show the
//      "Act N · turn M" metadata above each assistant bubble.
//   4. When total persisted turns reaches ≥ 6, fire onCharterReady so the
//      CharterPanel can attempt drafting.
//
// The synthetic "[session_opened]" user row is hidden from display but kept
// in state so turn numbers stay consistent with the server.
// ─────────────────────────────────────────────────────────────────────────────

type Turn = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  turn_number?: number
  act?: number
}

export type IntakeConversationProps = {
  clientId: string
  clientName?: string
  userRole: string
  engagementId: string
  onCharterReady?: () => void
}

const SYNTHETIC_OPEN = '[session_opened]'

const COLOR = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceAlt: '#161616',
  border: '#222222',
  borderSoft: '#1B1B1B',
  ink: '#EDEDED',
  muted: '#8A8A8A',
  mutedSoft: '#5B5B5B',
  teal: '#2DD4C8',
  warn: '#F59E0B',
  danger: '#F87171',
}

const FONT_BODY = 'DM Sans, system-ui, sans-serif'
const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace'

function isDisplayable(t: Turn): boolean {
  return !(t.role === 'user' && t.content === SYNTHETIC_OPEN)
}

export default function IntakeConversation({
  clientId,
  clientName,
  userRole,
  engagementId,
  onCharterReady,
}: IntakeConversationProps) {
  const { user, isLoaded } = useUser()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestAct, setLatestAct] = useState<number | null>(null)
  const [latestTurn, setLatestTurn] = useState<number | null>(null)
  const charterFiredRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const userId = user?.id ?? ''
  const ready = isLoaded && Boolean(userId) && Boolean(engagementId) && Boolean(clientId)

  const visibleTurns = useMemo(() => turns.filter(isDisplayable), [turns])

  const sendTurn = useCallback(
    async (message: string) => {
      if (!ready) return
      setError(null)
      setStreaming(true)

      if (message && message !== SYNTHETIC_OPEN) {
        setTurns((prev) => [...prev, { role: 'user', content: message }])
      }
      setTurns((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engagement_id: engagementId,
            client_id: clientId,
            user_id: userId,
            clientName,
            userRole,
            message,
          }),
        })

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => '')
          throw new Error(`${res.status} ${body}`)
        }

        const actHeader = res.headers.get('X-Intake-Act')
        const turnHeader = res.headers.get('X-Intake-Turn')
        const act = actHeader ? Number(actHeader) : null
        const turnNum = turnHeader ? Number(turnHeader) : null
        if (act) setLatestAct(act)
        if (turnNum) setLatestTurn(turnNum)

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
              next[next.length - 1] = {
                ...last,
                content: assistantText,
                act: act ?? undefined,
                turn_number: turnNum ?? undefined,
              }
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

  // On mount: load history, fire opening if empty.
  useEffect(() => {
    if (!ready || bootstrapped) return
    let cancelled = false

    async function bootstrap() {
      try {
        const res = await fetch(
          `/api/intake?engagement_id=${encodeURIComponent(engagementId)}&user_id=${encodeURIComponent(userId)}`,
        )
        if (cancelled) return
        if (res.ok) {
          const data = (await res.json()) as { turns?: Turn[] }
          const restored = data.turns ?? []
          if (restored.length > 0) {
            setTurns(restored)
            const lastAssistant = [...restored]
              .reverse()
              .find((t) => t.role === 'assistant')
            if (lastAssistant?.act) setLatestAct(lastAssistant.act)
            if (lastAssistant?.turn_number) setLatestTurn(lastAssistant.turn_number)
            setBootstrapped(true)
            return
          }
        }
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

  // Auto-scroll.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [turns])

  // Fire onCharterReady whenever persisted turns reach ≥ 6 and on each
  // subsequent assistant landing (so CharterPanel can retry drafting).
  useEffect(() => {
    if (!onCharterReady) return
    if (streaming) return
    if (turns.length < 6) return
    // Fire on first crossing, then again on each new assistant message.
    if (!charterFiredRef.current) {
      charterFiredRef.current = true
      onCharterReady()
      return
    }
    const lastRole = turns[turns.length - 1]?.role
    if (lastRole === 'assistant') {
      onCharterReady()
    }
  }, [turns, streaming, onCharterReady])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || streaming) return
    setInput('')
    void sendTurn(trimmed)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: COLOR.bg,
        color: COLOR.ink,
        fontFamily: FONT_BODY,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {!isLoaded && <div style={{ color: COLOR.muted }}>Loading…</div>}
        {isLoaded && !userId && (
          <div style={{ color: COLOR.warn }}>
            Sign in required to run intake.
          </div>
        )}

        {visibleTurns.map((t, i) => (
          <div
            key={t.id ?? `${t.role}-${t.turn_number ?? i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: t.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 6,
            }}
          >
            {t.role === 'assistant' && (t.act || t.turn_number) && (
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: COLOR.mutedSoft,
                  paddingLeft: 4,
                }}
              >
                {t.act ? `ACT ${t.act}` : ''}
                {t.act && t.turn_number ? ' · ' : ''}
                {t.turn_number ? `TURN ${t.turn_number}` : ''}
              </div>
            )}
            <div
              style={{
                maxWidth: '84%',
                background: t.role === 'user' ? COLOR.teal : COLOR.surface,
                color: t.role === 'user' ? '#06201E' : COLOR.ink,
                border:
                  t.role === 'assistant' ? `1px solid ${COLOR.border}` : 'none',
                borderRadius: 10,
                padding: '12px 15px',
                fontSize: 14.5,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                fontWeight: t.role === 'user' ? 500 : 400,
              }}
            >
              {t.content ||
                (t.role === 'assistant' && streaming ? (
                  <span style={{ color: COLOR.muted }}>…</span>
                ) : (
                  ''
                ))}
            </div>
          </div>
        ))}

        {error && (
          <div
            style={{
              alignSelf: 'center',
              background: '#2A1515',
              color: COLOR.danger,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12.5,
              fontFamily: FONT_MONO,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: `1px solid ${COLOR.border}`,
          padding: '14px 18px',
          display: 'flex',
          gap: 10,
          background: COLOR.surfaceAlt,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ready ? 'Your reply…' : 'Loading context…'}
          disabled={!ready || streaming}
          style={{
            flex: 1,
            background: COLOR.bg,
            border: `1px solid ${COLOR.border}`,
            color: COLOR.ink,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 14.5,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!ready || streaming || !input.trim()}
          style={{
            background: COLOR.teal,
            color: '#06201E',
            border: 'none',
            borderRadius: 8,
            padding: '0 18px',
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor:
              !ready || streaming || !input.trim() ? 'default' : 'pointer',
            opacity: !ready || streaming || !input.trim() ? 0.45 : 1,
          }}
        >
          Send
        </button>
      </form>

      {(latestAct || latestTurn) && (
        <div
          style={{
            borderTop: `1px solid ${COLOR.borderSoft}`,
            padding: '6px 18px',
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLOR.mutedSoft,
            background: COLOR.bg,
          }}
        >
          {latestAct ? `ACT ${latestAct} OF 5` : ''}
          {latestAct && latestTurn ? '  ·  ' : ''}
          {latestTurn ? `TURN ${latestTurn}` : ''}
        </div>
      )}
    </div>
  )
}
