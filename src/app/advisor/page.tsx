'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'
import AdvisorChat from '@/components/advisor/AdvisorChat'

// ─────────────────────────────────────────────────────────────────────────────
// /advisor — minimal advisor chat page for Package 1 acceptance testing.
//
// Query params:
//   ?client=meridian|arcturus|apexretail   (required; maps to client_brief row)
//   ?engagement_id=<uuid>                  (optional; auto-generated per tab)
//   ?role=CIO|CFO|...                      (optional; default "executive")
//   ?name=<display name>                   (optional; override brief identity)
//
// engagement_id persists in sessionStorage for the tab so page reloads keep
// the same conversation. A fresh tab starts a new engagement.
// ─────────────────────────────────────────────────────────────────────────────

function genEngagementId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `eng_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function AdvisorPageInner() {
  const params = useSearchParams()
  const clientId = (params.get('client') || '').trim()
  const clientName = (params.get('name') || '').trim() || undefined
  const userRole = (params.get('role') || '').trim() || 'executive'
  const qEngagement = (params.get('engagement_id') || '').trim()

  const storageKey = useMemo(
    () => `advisor:engagement:${clientId || 'unknown'}`,
    [clientId],
  )

  const [engagementId, setEngagementId] = useState<string>('')

  useEffect(() => {
    if (!clientId) return
    if (qEngagement) {
      setEngagementId(qEngagement)
      try {
        sessionStorage.setItem(storageKey, qEngagement)
      } catch {}
      return
    }
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
  }, [clientId, qEngagement, storageKey])

  function newEngagement() {
    const fresh = genEngagementId()
    setEngagementId(fresh)
    try {
      sessionStorage.setItem(storageKey, fresh)
    } catch {}
  }

  if (!clientId) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F7F4' }}>
        <AbarvaNav activePage="" />
        <div
          style={{
            maxWidth: 720,
            margin: '48px auto',
            padding: 24,
            fontFamily: 'DM Sans, sans-serif',
            color: '#171411',
          }}
        >
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            Advisor
          </h1>
          <p>
            Add <code>?client=meridian</code>, <code>?client=arcturus</code>, or{' '}
            <code>?client=apexretail</code> to the URL to open a session with a
            known client brief.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F7F4',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AbarvaNav activePage="" />
      <div
        style={{
          maxWidth: 920,
          width: '100%',
          margin: '0 auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#127C72',
                marginBottom: 4,
              }}
            >
              Advisor · {clientId}
            </div>
            <div style={{ fontSize: 13, color: '#6E655C' }}>
              Engagement: {engagementId ? engagementId.slice(0, 8) : '…'}
            </div>
          </div>
          <button
            type="button"
            onClick={newEngagement}
            style={{
              border: '1px solid #D6D1C4',
              background: '#FFFFFF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: '#171411',
            }}
          >
            New engagement
          </button>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            border: '1px solid #E5E2DA',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#FFFFFF',
          }}
        >
          {engagementId ? (
            <AdvisorChat
              key={engagementId}
              clientId={clientId}
              clientName={clientName}
              userRole={userRole}
              engagementId={engagementId}
            />
          ) : (
            <div style={{ padding: 20, color: '#6E655C' }}>Preparing…</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdvisorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, color: '#6E655C' }}>Loading advisor…</div>
      }
    >
      <AdvisorPageInner />
    </Suspense>
  )
}
