'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import IntakeConversation from '@/components/intake/IntakeConversation'
import CharterPanel from '@/components/intake/CharterPanel'

// ─────────────────────────────────────────────────────────────────────────────
// /engage/new/[clientId]?role=CIO&name=Meridian
//
// Two-pane intake workbench — IntakeConversation on the left, CharterPanel on
// the right. Mobile stacks vertically.
// ─────────────────────────────────────────────────────────────────────────────

const COLOR = {
  bg: '#0A0A0A',
  surface: '#111111',
  border: '#222222',
  borderSoft: '#1B1B1B',
  ink: '#EDEDED',
  muted: '#8A8A8A',
  mutedSoft: '#5B5B5B',
  teal: '#2DD4C8',
  warn: '#F59E0B',
}

const FONT_BODY = 'DM Sans, system-ui, sans-serif'
const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace'
const FONT_DISPLAY = 'Georgia, serif'

function genEngagementId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `eng_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function NewEngagementInner() {
  const params = useParams<{ clientId: string }>()
  const searchParams = useSearchParams()
  const clientId = (params?.clientId || '').trim()
  const userRole = (searchParams.get('role') || '').trim() || 'executive'
  const clientNameRaw = (searchParams.get('name') || '').trim()
  const clientName = clientNameRaw || undefined

  const { user, isLoaded } = useUser()
  const userId = user?.id ?? ''

  const storageKey = useMemo(
    () => `intake:engagement:${clientId || 'unknown'}`,
    [clientId],
  )
  const [engagementId, setEngagementId] = useState<string>('')
  const [charterRefreshKey, setCharterRefreshKey] = useState(0)
  const [conversationKey, setConversationKey] = useState(0)

  useEffect(() => {
    if (!clientId) return
    let existing: string | null = null
    try {
      existing = sessionStorage.getItem(storageKey)
    } catch {}
    if (existing) {
      setEngagementId(existing)
      return
    }
    const fresh = genEngagementId()
    setEngagementId(fresh)
    try {
      sessionStorage.setItem(storageKey, fresh)
    } catch {}
  }, [clientId, storageKey])

  const handleNewIntake = useCallback(() => {
    const fresh = genEngagementId()
    setEngagementId(fresh)
    try {
      sessionStorage.setItem(storageKey, fresh)
    } catch {}
    setCharterRefreshKey(0)
    setConversationKey((k) => k + 1)
  }, [storageKey])

  const handleCharterReady = useCallback(() => {
    setCharterRefreshKey((k) => k + 1)
  }, [])

  const handlePushback = useCallback(() => {
    // Pushback posted a new user turn and Claude's revised assistant response;
    // remount IntakeConversation so it re-fetches history cleanly.
    setConversationKey((k) => k + 1)
    setCharterRefreshKey((k) => k + 1)
  }, [])

  const headerTitle = clientName || clientId || 'New engagement'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLOR.bg,
        color: COLOR.ink,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT_BODY,
      }}
    >
      <header
        style={{
          padding: '14px 26px',
          borderBottom: `1px solid ${COLOR.borderSoft}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          background: COLOR.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              letterSpacing: '-0.01em',
              color: COLOR.ink,
            }}
          >
            AbarVa
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLOR.mutedSoft,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            NEW ENGAGEMENT · {headerTitle.toUpperCase()} · {userRole.toUpperCase()}
          </div>
        </div>
        <button
          type="button"
          onClick={handleNewIntake}
          style={{
            background: 'transparent',
            border: `1px solid ${COLOR.border}`,
            color: COLOR.ink,
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          New intake
        </button>
      </header>

      {!clientId && (
        <div style={{ padding: 40, color: COLOR.warn, fontFamily: FONT_BODY }}>
          No client specified in the URL. Visit /engage/new/&lt;clientId&gt;.
        </div>
      )}

      {clientId && isLoaded && !userId && (
        <div style={{ padding: 40, color: COLOR.warn, fontFamily: FONT_BODY }}>
          Sign in required to start a new engagement.
        </div>
      )}

      {clientId && (!isLoaded || !userId || !engagementId) ? null : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 0,
          }}
        >
          <style>{`
            @media (min-width: 960px) {
              .intake-split { grid-template-columns: 55fr 45fr !important; }
            }
          `}</style>
          <div
            className="intake-split"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              flex: 1,
              minHeight: 0,
            }}
          >
            <section
              style={{
                minHeight: 0,
                borderRight: `1px solid ${COLOR.borderSoft}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <IntakeConversation
                key={conversationKey}
                clientId={clientId}
                clientName={clientName}
                userRole={userRole}
                engagementId={engagementId}
                onCharterReady={handleCharterReady}
              />
            </section>
            <section
              style={{
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CharterPanel
                engagementId={engagementId}
                clientId={clientId}
                userId={userId}
                refreshKey={charterRefreshKey}
                clientName={clientName}
                userRole={userRole}
                onPushback={handlePushback}
              />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewEngagementPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: COLOR.bg,
            color: COLOR.muted,
            padding: 40,
            fontFamily: FONT_BODY,
          }}
        >
          Loading intake…
        </div>
      }
    >
      <NewEngagementInner />
    </Suspense>
  )
}
